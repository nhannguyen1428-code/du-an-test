"use client";

import { MessageBubble, type MessageActionHandlers } from "@/components/message-bubble";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import type { Message } from "@/types/message";

type MessageListProps = {
  messages: Message[];
  clientId: string;
  actions?: MessageActionHandlers;
};

export function MessageList({ messages, clientId, actions }: MessageListProps) {
  const { containerRef, bottomRef, onScroll } = useChatScroll(messages);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
        Chưa có tin nhắn. Hãy là người mở lời đầu tiên!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-4"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isMine={message.client_id === clientId}
          actions={message.client_id === clientId ? actions : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
