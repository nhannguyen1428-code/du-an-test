export type AttachmentKind = "image" | "video" | "document";

export type MessageAttachment = {
  id: string;
  url: string;
  kind: AttachmentKind;
  mime_type: string;
  filename: string;
  size_bytes: number;
};

export const ATTACHMENT_MAX_BYTES: Record<AttachmentKind, number> = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  document: 15 * 1024 * 1024,
};

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
] as const;

export function getAttachmentKind(mimeType: string): AttachmentKind | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export function getAttachmentPreviewLabel(
  attachment?: MessageAttachment | null,
  content?: string,
): string {
  if (content?.trim()) return content.trim();
  if (!attachment) return "";
  switch (attachment.kind) {
    case "image":
      return "📷 Ảnh";
    case "video":
      return "🎬 Video";
    default:
      return `📎 ${attachment.filename}`;
  }
}
