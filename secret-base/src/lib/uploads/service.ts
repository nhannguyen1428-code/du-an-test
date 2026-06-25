import {
  deleteBlobByUrl,
  isBlobConfigured,
  SERVER_UPLOAD_MAX_BYTES,
  uploadFileToBlob,
} from "@/lib/uploads/blob-store";
import {
  deleteMemoryFileByUrl,
  getMemoryFile,
  saveMemoryFile,
} from "@/lib/uploads/memory-store";
import {
  isTrustedAttachmentUrl,
  parseAttachmentPayload,
  validateUploadFile,
} from "@/lib/uploads/validation";
import type { MessageAttachment } from "@/types/attachment";
import { getAttachmentKind } from "@/types/attachment";

export { isBlobConfigured, SERVER_UPLOAD_MAX_BYTES };

export async function saveMultipartUpload(
  file: File,
): Promise<MessageAttachment> {
  const { kind } = validateUploadFile(file.type, file.size);

  if (isBlobConfigured()) {
    if (file.size > SERVER_UPLOAD_MAX_BYTES) {
      const maxMb = Math.round(SERVER_UPLOAD_MAX_BYTES / (1024 * 1024));
      throw new Error(
        `File quá lớn cho upload trực tiếp (tối đa ${maxMb}MB). Hãy nén ảnh hoặc chọn file nhỏ hơn.`,
      );
    }
    const { url, pathname } = await uploadFileToBlob(file);
    return {
      id: pathname,
      url,
      kind,
      mime_type: file.type,
      filename: file.name,
      size_bytes: file.size,
    };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const { id, url } = saveMemoryFile({
    data: buffer,
    mime_type: file.type,
    filename: file.name,
  });

  return {
    id,
    url,
    kind,
    mime_type: file.type,
    filename: file.name,
    size_bytes: file.size,
  };
}

export function validateMessageAttachment(raw: unknown): MessageAttachment {
  const attachment = parseAttachmentPayload(raw);
  if (!attachment) throw new Error("File đính kèm không hợp lệ.");
  if (!isTrustedAttachmentUrl(attachment.url)) {
    throw new Error("URL file không hợp lệ.");
  }
  return attachment;
}

export async function deleteAttachment(
  attachment: MessageAttachment,
): Promise<void> {
  if (attachment.url.startsWith("/api/uploads/")) {
    deleteMemoryFileByUrl(attachment.url);
    return;
  }
  await deleteBlobByUrl(attachment.url);
}

export async function purgeAttachmentsFromMessages(
  messages: Array<{ attachment?: MessageAttachment | null }>,
): Promise<void> {
  const attachments = messages
    .map((m) => m.attachment)
    .filter((att): att is MessageAttachment => Boolean(att));
  await Promise.all(attachments.map((att) => deleteAttachment(att)));
}

export function readMemoryUpload(fileId: string) {
  return getMemoryFile(fileId);
}
