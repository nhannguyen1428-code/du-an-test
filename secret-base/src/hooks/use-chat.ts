"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { filterActiveMessages } from "@/lib/message-ttl";
import { useMessageExpiry } from "@/hooks/use-message-expiry";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MAX_MESSAGE_LENGTH,
  ROOM_ID,
  SEND_COOLDOWN_MS,
  type Message,
} from "@/types/message";
import type { MessageAttachment } from "@/types/attachment";

export type ChatMode = "supabase" | "shared";

const POLL_INTERVAL_MS = 2000;

export function useChat(nickname: string | null, clientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode] = useState<ChatMode>("shared");
  const lastSentAtRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  useMessageExpiry(setMessages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const msg of filterActiveMessages(incoming)) map.set(msg.id, msg);
      return filterActiveMessages(Array.from(map.values())).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
  }, []);

  const appendMessage = useCallback((incoming: Message) => {
    if (filterActiveMessages([incoming]).length === 0) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return filterActiveMessages([...prev, incoming]);
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (mode === "supabase") {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", ROOM_ID)
        .order("created_at", { ascending: true })
        .limit(100);
      if (fetchError) {
        setError("Không tải được tin nhắn từ Supabase.");
        return;
      }
      setMessages(filterActiveMessages(data ?? []));
      return;
    }

    const res = await fetch(`/api/messages?room_id=${ROOM_ID}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Không tải được tin nhắn.");
      return;
    }
    const data = (await res.json()) as { messages: Message[] };
    mergeMessages(data.messages ?? []);
  }, [mode, mergeMessages]);

  useEffect(() => {
    if (!nickname) return;
    void loadMessages();
  }, [nickname, loadMessages]);

  useEffect(() => {
    if (!nickname) return;

    if (mode === "supabase") {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const channel = supabase
        .channel(`room:${ROOM_ID}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${ROOM_ID}`,
          },
          (payload) => appendMessage(payload.new as Message),
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    const poll = async () => {
      const res = await fetch(`/api/messages?room_id=${ROOM_ID}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      const latest = filterActiveMessages(data.messages ?? []);
      setMessages(
        latest.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      );
    };

    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);

    const source = new EventSource(`/api/messages/stream?room_id=${ROOM_ID}`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          message?: Message;
        };
        if (data.type === "message" && data.message) {
          appendMessage(data.message);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      clearInterval(interval);
      source.close();
    };
  }, [nickname, mode, appendMessage, mergeMessages]);

  const sendMessage = useCallback(
    async (content: string, attachment?: MessageAttachment) => {
      if (!nickname) return;
      if (attachment && mode === "supabase") {
        setError("Gửi file chỉ hỗ trợ khi dùng Redis/Vercel.");
        return;
      }

      const now = Date.now();
      if (now - lastSentAtRef.current < SEND_COOLDOWN_MS) {
        setError("Gửi hơi nhanh, chờ 1–2 giây rồi thử lại.");
        return;
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        setError(`Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
        return;
      }
      if (!content.trim() && !attachment) return;

      setError(null);

      if (mode === "supabase") {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { error: insertError } = await supabase.from("messages").insert({
          room_id: ROOM_ID,
          nickname,
          client_id: clientId,
          content,
        });
        if (insertError) {
          setError("Gửi tin thất bại. Kiểm tra Supabase RLS.");
          return;
        }
      } else {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: ROOM_ID,
            nickname,
            client_id: clientId,
            content,
            attachment,
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Gửi tin thất bại.");
          return;
        }
        const data = (await res.json()) as { message: Message };
        appendMessage(data.message);
      }

      lastSentAtRef.current = now;
    },
    [nickname, clientId, mode, appendMessage],
  );

  const upsertMessage = useCallback((updated: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const messageActions = useCallback(() => {
    if (mode === "supabase") return undefined;
    return {
      onEdit: async (messageId: string, content: string) => {
        const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, room_id: ROOM_ID, content }),
        });
        const data = (await res.json()) as { message?: Message; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Sửa tin thất bại.");
        if (data.message) upsertMessage(data.message);
      },
      onRecall: async (messageId: string) => {
        const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, room_id: ROOM_ID, action: "recall" }),
        });
        const data = (await res.json()) as { message?: Message; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Thu hồi tin thất bại.");
        if (data.message) upsertMessage(data.message);
      },
      onDelete: async (messageId: string) => {
        const res = await fetch(
          `/api/messages/${encodeURIComponent(messageId)}?client_id=${encodeURIComponent(clientId)}&room_id=${encodeURIComponent(ROOM_ID)}`,
          { method: "DELETE" },
        );
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Xóa tin thất bại.");
        removeMessage(messageId);
      },
    };
  }, [clientId, mode, removeMessage, upsertMessage]);

  return {
    messages,
    error,
    setError,
    sendMessage,
    messageActions: messageActions(),
    mode,
  };
}
