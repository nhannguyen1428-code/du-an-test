"use client";

import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/types/message";
import type { MessageAttachment } from "@/types/attachment";
import { uploadChatFile } from "@/lib/uploads/client";
import { cn } from "@/lib/utils";

type MessageInputProps = {
  onSend: (content: string, attachment?: MessageAttachment) => Promise<void>;
  attachmentsEnabled?: boolean;
};

const FILE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip";

export function MessageInput({
  onSend,
  attachmentsEnabled = true,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearPendingFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(file: File | null) {
    clearPendingFile();
    if (!file) return;
    setPendingFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSend() {
    const trimmed = content.trim();
    if ((!trimmed && !pendingFile) || sending || uploading) return;

    setSending(true);
    setError(null);
    try {
      let attachment: MessageAttachment | undefined;
      if (pendingFile) {
        setUploading(true);
        attachment = await uploadChatFile(pendingFile);
        setUploading(false);
      }
      await onSend(trimmed, attachment);
      setContent("");
      clearPendingFile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi thất bại.");
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  const busy = sending || uploading;
  const canSend = Boolean(content.trim() || pendingFile) && !busy;

  return (
    <div className="border-t border-white/10 bg-panel px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 lg:max-w-none">
        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
            {error}
          </p>
        ) : null}

        {pendingFile ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/60 p-2">
            {previewUrl && pendingFile.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : previewUrl && pendingFile.type.startsWith("video/") ? (
              <video src={previewUrl} className="h-14 w-14 rounded-lg object-cover" muted />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-xs text-muted">
                FILE
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{pendingFile.name}</p>
              <p className="text-xs text-muted">
                {uploading ? "Đang tải lên..." : "Sẵn sàng gửi"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearPendingFile}
              disabled={busy}
              className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="Bỏ file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          {attachmentsEnabled ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                title="Gửi ảnh, video hoặc file"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent transition hover:bg-accent/20 disabled:opacity-50"
                aria-label="Đính kèm file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={pendingFile ? "Thêm chú thích (tuỳ chọn)..." : "Nhập tin nhắn..."}
            rows={1}
            disabled={busy}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-background px-4 py-3 text-[15px] outline-none focus:border-accent disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="Gửi tin nhắn"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
