"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

const BOTTOM_THRESHOLD_PX = 96;

type ScrollableMessage = {
  id: string;
  content: string;
  edited_at?: string | null;
  recalled_at?: string | null;
};

export function useChatScroll(messages: ScrollableMessage[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const hasScrolledOnceRef = useRef(false);

  const messagesKey = useMemo(
    () =>
      messages
        .map(
          (m) =>
            `${m.id}:${m.edited_at ?? ""}:${m.recalled_at ?? ""}:${m.content.length}`,
        )
        .join("|"),
    [messages],
  );

  const updateStickiness = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    bottomRef.current?.scrollIntoView({
      behavior: hasScrolledOnceRef.current ? "smooth" : "auto",
    });
    hasScrolledOnceRef.current = true;
  }, [messagesKey]);

  const scrollToBottom = useCallback((smooth = true) => {
    stickToBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    hasScrolledOnceRef.current = true;
  }, []);

  return { containerRef, bottomRef, onScroll: updateStickiness, scrollToBottom };
}
