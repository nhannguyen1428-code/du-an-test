"use client";

import { MoreVertical, Pencil, Undo2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MessageActionsMenuProps = {
  canEdit: boolean;
  onEdit: () => void;
  onRecall: () => void;
  onDelete: () => void;
};

export function MessageActionsMenu({
  canEdit,
  onEdit,
  onRecall,
  onDelete,
}: MessageActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 self-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Tùy chọn tin nhắn"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute right-0 bottom-full z-20 mb-1 min-w-[10.5rem] overflow-hidden",
            "rounded-xl border border-white/10 bg-panel py-1 shadow-lg",
          )}
        >
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              <Pencil className="h-4 w-4" />
              Sửa tin nhắn
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRecall();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
          >
            <Undo2 className="h-4 w-4" />
            Thu hồi
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Xóa tin nhắn
          </button>
        </div>
      ) : null}
    </div>
  );
}
