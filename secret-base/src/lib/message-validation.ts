import type { MessageAttachment } from "@/types/attachment";
import { validateMessageAttachment } from "@/lib/uploads/service";

export function validateMessageContent(
  content: string,
  attachmentRaw: unknown,
  maxLength: number,
): { content: string; attachment?: MessageAttachment } {
  const trimmed = content.trim();
  const attachment = attachmentRaw
    ? validateMessageAttachment(attachmentRaw)
    : undefined;

  if (!trimmed && !attachment) {
    throw new Error("Tin nhắn không hợp lệ.");
  }
  if (trimmed.length > maxLength) {
    throw new Error("Tin nhắn không hợp lệ.");
  }

  return { content: trimmed, attachment };
}
