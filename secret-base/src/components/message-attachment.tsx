import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAttachmentDisplayUrl } from "@/lib/uploads/attachment-url";
import type { MessageAttachment } from "@/types/attachment";

type MessageAttachmentViewProps = {
  attachment: MessageAttachment;
  isMine: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachmentView({ attachment, isMine }: MessageAttachmentViewProps) {
  const src = getAttachmentDisplayUrl(attachment.url);

  if (attachment.kind === "image") {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={attachment.filename}
          className="max-h-56 w-full rounded-xl object-cover"
        />
      </a>
    );
  }

  if (attachment.kind === "video") {
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="max-h-56 w-full rounded-xl bg-black/30"
      />
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      download={attachment.filename}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2 transition hover:opacity-90",
        isMine ? "border-white/20 bg-white/10" : "border-white/10 bg-black/10",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.filename}</p>
        <p className="text-xs opacity-70">{formatSize(attachment.size_bytes)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}
