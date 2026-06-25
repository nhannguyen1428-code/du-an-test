"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterActiveMessages } from "@/lib/message-ttl";
import { useMessageExpiry } from "@/hooks/use-message-expiry";
import { apiHeaders } from "@/lib/api/client";
import type { DmConversation, DmMessage } from "@/types/social";
import type { MessageAttachment } from "@/types/attachment";
import { SEND_COOLDOWN_MS } from "@/types/message";

const POLL_MS = 2000;

export function useDmConversations(enabled: boolean) {
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const load = useCallback(async () => {
    if (!enabled) return;
    const res = await fetch("/api/dm/conversations", {
      headers: apiHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Không tải được hội thoại.");
      return;
    }
    const data = (await res.json()) as { conversations: DmConversation[] };
    setConversations(data.conversations);
    setError(null);
  }, [enabled]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load, enabled]);

  return { conversations, error, totalUnread, reload: load };
}

async function markConversationRead(conversationId: string) {
  await fetch(`/api/dm/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
    headers: apiHeaders(),
  });
}

export function useDmChat(conversationId: string | null, userId: string) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastSentAtRef = useRef(0);

  useMessageExpiry(setMessages);

  const load = useCallback(async () => {
    if (!conversationId) return;
    const res = await fetch(`/api/dm/${encodeURIComponent(conversationId)}/messages`, {
      headers: apiHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Không tải được tin nhắn.");
      return;
    }
    const data = (await res.json()) as { messages: DmMessage[] };
    setMessages(filterActiveMessages(data.messages));
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    void markConversationRead(conversationId);
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load, conversationId]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    void markConversationRead(conversationId);
  }, [conversationId, messages]);

  const sendMessage = useCallback(
    async (content: string, attachment?: MessageAttachment) => {
      if (!conversationId) return;
      const now = Date.now();
      if (now - lastSentAtRef.current < SEND_COOLDOWN_MS) {
        setError("Gửi hơi nhanh, chờ 1–2 giây.");
        return;
      }
      if (!content.trim() && !attachment) return;
      setError(null);
      const res = await fetch(`/api/dm/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ content, attachment }),
      });
      const data = (await res.json()) as { message?: DmMessage; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gửi tin thất bại.");
        return;
      }
      if (data.message) {
        setMessages((prev) => {
          const next = prev.some((m) => m.id === data.message!.id)
            ? prev
            : [...prev, data.message!];
          return filterActiveMessages(next);
        });
      }
      lastSentAtRef.current = now;
    },
    [conversationId],
  );

  const upsertMessage = useCallback((updated: DmMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const messageActions = useMemo(
    () => ({
      onEdit: async (messageId: string, content: string) => {
        if (!conversationId) return;
        const res = await fetch(
          `/api/dm/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
          {
            method: "PATCH",
            headers: apiHeaders(),
            body: JSON.stringify({ content }),
          },
        );
        const data = (await res.json()) as { message?: DmMessage; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Sửa tin thất bại.");
        if (data.message) upsertMessage(data.message);
      },
      onRecall: async (messageId: string) => {
        if (!conversationId) return;
        const res = await fetch(
          `/api/dm/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
          {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({ action: "recall" }),
          },
        );
        const data = (await res.json()) as { message?: DmMessage; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Thu hồi tin thất bại.");
        if (data.message) upsertMessage(data.message);
      },
      onDelete: async (messageId: string) => {
        if (!conversationId) return;
        const res = await fetch(
          `/api/dm/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
          { method: "DELETE", headers: apiHeaders() },
        );
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Xóa tin thất bại.");
        removeMessage(messageId);
      },
    }),
    [conversationId, removeMessage, upsertMessage],
  );

  return { messages, error, sendMessage, messageActions, userId };
}
