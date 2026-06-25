"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/message-bubble";
import type { Message } from "@/types/message";

type MessageListProps = {
  messages: Message[];
  clientId: string;
};

export function MessageList({ messages, clientId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
        Chưa có tin nhắn. Hãy là người mở lời đầu tiên!
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isMine={message.client_id === clientId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
