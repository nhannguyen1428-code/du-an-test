import {
  ALLOWED_MIME_TYPES,
  ATTACHMENT_MAX_BYTES,
  getAttachmentKind,
  type AttachmentKind,
  type MessageAttachment,
} from "@/types/attachment";

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateUploadFile(
  mimeType: string,
  sizeBytes: number,
): { kind: AttachmentKind } {
  if (!isAllowedMimeType(mimeType)) {
    throw new Error("Định dạng file không được hỗ trợ.");
  }
  const kind = getAttachmentKind(mimeType);
  if (!kind) throw new Error("Định dạng file không được hỗ trợ.");
  if (sizeBytes <= 0) throw new Error("File rỗng.");
  if (sizeBytes > ATTACHMENT_MAX_BYTES[kind]) {
    const maxMb = Math.round(ATTACHMENT_MAX_BYTES[kind] / (1024 * 1024));
    throw new Error(`File quá lớn (tối đa ${maxMb}MB).`);
  }
  return { kind };
}

export function parseAttachmentPayload(raw: unknown): MessageAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const att = raw as MessageAttachment;
  if (
    !att.id ||
    !att.url ||
    !att.kind ||
    !att.mime_type ||
    !att.filename ||
    typeof att.size_bytes !== "number"
  ) {
    return null;
  }
  if (!isAllowedMimeType(att.mime_type)) return null;
  if (getAttachmentKind(att.mime_type) !== att.kind) return null;
  try {
    validateUploadFile(att.mime_type, att.size_bytes);
  } catch {
    return null;
  }
  return att;
}

import { isBlobStorageUrl } from "@/lib/uploads/attachment-url";

export function isTrustedAttachmentUrl(url: string): boolean {
  if (url.startsWith("/api/uploads/")) return true;
  return isBlobStorageUrl(url);
}
