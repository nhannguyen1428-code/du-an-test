"use client";

import { useState } from "react";
import { MessageActionsMenu } from "@/components/message-actions-menu";
import { MessageAttachmentView } from "@/components/message-attachment";
import { MessageEditDialog } from "@/components/message-edit-dialog";
import {
  isMessageRecalled,
  MESSAGE_ACTION_WINDOW_MS,
} from "@/lib/message-actions";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { MAX_MESSAGE_LENGTH } from "@/types/message";

export type MessageActionHandlers = {
  onEdit: (messageId: string, content: string) => Promise<void>;
  onRecall: (messageId: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
};

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
  actions?: MessageActionHandlers;
  editMaxLength?: number;
};

function canModifyMessage(message: Message): boolean {
  if (isMessageRecalled(message)) return false;
  const age = Date.now() - new Date(message.created_at).getTime();
  return age <= MESSAGE_ACTION_WINDOW_MS;
}

export function MessageBubble({
  message,
  isMine,
  actions,
  editMaxLength = MAX_MESSAGE_LENGTH,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const recalled = isMessageRecalled(message);
  const showActions = isMine && actions && canModifyMessage(message);

  const time = new Date(message.created_at).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleRecall() {
    if (!actions) return;
    if (!confirm("Thu hồi tin nhắn này? Mọi người sẽ không xem được nội dung.")) {
      return;
    }
    await actions.onRecall(message.id);
  }

  async function handleDelete() {
    if (!actions) return;
    if (!confirm("Xóa vĩnh viễn tin nhắn này?")) return;
    await actions.onDelete(message.id);
  }

  return (
    <>
      <div className={cn("flex w-full gap-1", isMine ? "justify-end" : "justify-start")}>
        {showActions ? (
          <MessageActionsMenu
            canEdit={Boolean(message.content.trim())}
            onEdit={() => setEditing(true)}
            onRecall={() => void handleRecall()}
            onDelete={() => void handleDelete()}
          />
        ) : null}

        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]",
            isMine
              ? "rounded-br-md bg-bubble-mine text-white"
              : "rounded-bl-md bg-bubble-other text-foreground",
            recalled && "opacity-80",
          )}
        >
          {!isMine ? (
            <p className="mb-1 text-xs font-semibold text-accent">{message.nickname}</p>
          ) : null}

          {recalled ? (
            <p
              className={cn(
                "text-sm italic",
                isMine ? "text-white/75" : "text-muted",
              )}
            >
              {isMine ? "Bạn đã thu hồi tin nhắn" : "Tin nhắn đã được thu hồi"}
            </p>
          ) : (
            <>
              {message.attachment ? (
                <div className={message.content ? "mb-2" : ""}>
                  <MessageAttachmentView attachment={message.attachment} isMine={isMine} />
                </div>
              ) : null}

              {message.content ? (
                <p className="text-[15px] leading-5 break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              ) : null}
            </>
          )}

          <p
            className={cn(
              "mt-1 text-right text-[10px]",
              isMine ? "text-white/70" : "text-muted",
            )}
          >
            {time}
            {message.edited_at && !recalled ? (
              <span className="ml-1 opacity-80">· đã sửa</span>
            ) : null}
          </p>
        </div>
      </div>

      {showActions ? (
        <MessageEditDialog
          open={editing}
          initialContent={message.content}
          maxLength={editMaxLength}
          onClose={() => setEditing(false)}
          onSave={(content) => actions!.onEdit(message.id, content)}
        />
      ) : null}
    </>
  );
}
