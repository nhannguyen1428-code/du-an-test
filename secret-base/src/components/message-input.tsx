"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/types/message";
import { cn } from "@/lib/utils";

type MessageInputProps = {
  onSend: (content: string) => Promise<void>;
};

export function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-white/10 bg-panel px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Nhập tin nhắn..."
          rows={1}
          disabled={sending}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-background px-4 py-3 text-[15px] outline-none focus:border-accent disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !content.trim()}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50",
          )}
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
