import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
};

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]",
          isMine
            ? "rounded-br-md bg-bubble-mine text-white"
            : "rounded-bl-md bg-bubble-other text-foreground",
        )}
      >
        {!isMine ? (
          <p className="mb-1 text-xs font-semibold text-accent">{message.nickname}</p>
        ) : null}
        <p className="text-[15px] leading-5 break-words whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isMine ? "text-white/70" : "text-muted",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
