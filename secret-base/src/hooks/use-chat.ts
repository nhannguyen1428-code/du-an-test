"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MAX_MESSAGE_LENGTH,
  ROOM_ID,
  SEND_COOLDOWN_MS,
  type Message,
} from "@/types/message";

export type ChatMode = "supabase" | "shared";

const POLL_INTERVAL_MS = 2000;

export function useChat(nickname: string | null, clientId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode] = useState<ChatMode>(() =>
    isSupabaseConfigured() ? "supabase" : "shared",
  );
  const lastSentAtRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const msg of incoming) map.set(msg.id, msg);
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
  }, []);

  const appendMessage = useCallback((incoming: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
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
      setMessages(data ?? []);
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
      const latest = data.messages ?? [];
      if (latest.length !== messagesRef.current.length) {
        mergeMessages(latest);
      } else {
        const lastRemote = latest.at(-1)?.id;
        const lastLocal = messagesRef.current.at(-1)?.id;
        if (lastRemote !== lastLocal) mergeMessages(latest);
      }
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
    async (content: string) => {
      if (!nickname) return;

      const now = Date.now();
      if (now - lastSentAtRef.current < SEND_COOLDOWN_MS) {
        setError("Gửi hơi nhanh, chờ 1–2 giây rồi thử lại.");
        return;
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        setError(`Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
        return;
      }

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

  return { messages, error, setError, sendMessage, mode };
}
