"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MessageEditDialogProps = {
  open: boolean;
  initialContent: string;
  maxLength: number;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
};

export function MessageEditDialog({
  open,
  initialContent,
  maxLength,
  onClose,
  onSave,
}: MessageEditDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setError(null);
    }
  }, [open, initialContent]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(content);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-4 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Sửa tin nhắn</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-background px-3 py-2 text-[15px] outline-none focus:border-accent"
          autoFocus
        />
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-white/5"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !content.trim()}
            className={cn(
              "rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white",
              "hover:bg-accent-hover disabled:opacity-50",
            )}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
