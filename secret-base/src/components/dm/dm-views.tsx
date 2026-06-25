"use client";

import { ChevronLeft } from "lucide-react";
import { MessageBubble } from "@/components/message-bubble";
import { MessageInput } from "@/components/message-input";
import { useUser } from "@/contexts/user-context";
import { useDmChat } from "@/hooks/use-dm";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { cn } from "@/lib/utils";
import { MESSAGE_TTL_MINUTES } from "@/lib/message-ttl";
import { getMessagePreviewText } from "@/lib/message-actions";
import { getAttachmentPreviewLabel } from "@/types/attachment";
import type { DmConversation } from "@/types/social";
import type { Message } from "@/types/message";
import { MAX_DM_LENGTH } from "@/types/social";

type DmListViewProps = {
  conversations: DmConversation[];
  selectedId?: string | null;
  onOpenChat: (conversationId: string, friendName: string) => void;
  variant?: "mobile" | "desktop";
};

export function DmListView({
  conversations,
  selectedId,
  onOpenChat,
  variant = "mobile",
}: DmListViewProps) {
  const isDesktop = variant === "desktop";

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        {!isDesktop ? (
          <header className="border-b border-white/10 bg-panel px-4 py-3">
            <h1 className="text-lg font-semibold">Tin riêng</h1>
            <p className="text-xs text-muted">Tin tự xóa sau {MESSAGE_TTL_MINUTES} phút</p>
          </header>
        ) : (
          <header className="border-b border-white/10 px-4 py-4">
            <h1 className="text-base font-semibold">Tin nhắn</h1>
            <p className="text-xs text-muted">Tự xóa sau {MESSAGE_TTL_MINUTES} phút</p>
          </header>
        )}
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
          Chưa có hội thoại. Kết bạn rồi bấm &quot;Nhắn tin&quot; nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-white/10 bg-panel px-4 py-3 lg:bg-transparent lg:py-4">
        <h1 className={cn("font-semibold", isDesktop ? "text-base" : "text-lg")}>
          {isDesktop ? "Tin nhắn" : "Tin riêng"}
        </h1>
        <p className="text-xs text-muted">
          {isDesktop ? `Tự xóa sau ${MESSAGE_TTL_MINUTES} phút` : `Tin tự xóa sau ${MESSAGE_TTL_MINUTES} phút`}
        </p>
      </header>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const selected = selectedId === conv.id;
          return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onOpenChat(conv.id, conv.friend.nickname)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition",
                selected ? "bg-accent/10" : "hover:bg-white/5",
              )}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                {conv.friend.nickname.charAt(0).toUpperCase()}
                {conv.unread_count > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent ring-2 ring-panel" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate font-medium",
                      conv.unread_count > 0 && "text-foreground",
                    )}
                  >
                    {conv.friend.nickname}
                  </span>
                  {conv.unread_count > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                      {conv.unread_count > 9 ? "9+" : conv.unread_count}
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "truncate text-sm",
                    conv.unread_count > 0
                      ? "font-medium text-foreground/90"
                      : "text-muted",
                  )}
                >
                  {conv.last_message
                    ? getMessagePreviewText(conv.last_message) ||
                      getAttachmentPreviewLabel(
                        conv.last_message.attachment,
                        conv.last_message.content,
                      )
                    : "Bắt đầu trò chuyện..."}
                </span>
              </div>
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

type DmChatViewProps = {
  conversationId: string;
  friendName: string;
  onBack: () => void;
  variant?: "mobile" | "desktop";
};

export function DmChatView({
  conversationId,
  friendName,
  onBack,
  variant = "mobile",
}: DmChatViewProps) {
  const { userId } = useUser();
  const { messages, error, sendMessage, messageActions } = useDmChat(conversationId, userId);
  const { containerRef, bottomRef, onScroll } = useChatScroll(messages);

  const adapted: Message[] = messages.map((m) => ({
    id: m.id,
    room_id: m.conversation_id,
    nickname: "",
    client_id: m.sender_id,
    content: m.content,
    created_at: m.created_at,
    edited_at: m.edited_at,
    recalled_at: m.recalled_at,
    attachment: m.attachment,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-white/10 bg-panel px-2 py-3 lg:px-6 lg:py-4">
        {variant === "mobile" ? (
          <button type="button" onClick={onBack} className="rounded-lg p-2 text-muted hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        <h1 className="truncate text-lg font-semibold lg:text-xl">{friendName}</h1>
      </header>

      {error ? (
        <div className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">{error}</div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col lg:mx-0 lg:max-w-none">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 lg:px-6"
        >
          {adapted.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-muted">
              Gửi tin đầu tiên!
            </p>
          ) : (
            adapted.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.client_id === userId}
                actions={message.client_id === userId ? messageActions : undefined}
                editMaxLength={MAX_DM_LENGTH}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}
