import { MAX_MESSAGE_LENGTH } from "@/types/message";
import { MAX_DM_LENGTH } from "@/types/social";

export const MESSAGE_ACTION_WINDOW_MS = 15 * 60 * 1000;

type TimedMessage = {
  created_at: string;
  recalled_at?: string | null;
};

export function isMessageRecalled(message: TimedMessage): boolean {
  return Boolean(message.recalled_at);
}

export function assertCanModifyMessage(message: TimedMessage): void {
  if (isMessageRecalled(message)) {
    throw new Error("Tin nhắn đã được thu hồi.");
  }
  const age = Date.now() - new Date(message.created_at).getTime();
  if (age > MESSAGE_ACTION_WINDOW_MS) {
    throw new Error("Chỉ sửa / thu hồi / xóa được trong 15 phút sau khi gửi.");
  }
}

export function validateEditContent(content: string, maxLength: number): string {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Nội dung không được để trống.");
  if (trimmed.length > maxLength) throw new Error("Tin nhắn quá dài.");
  return trimmed;
}

export const GROUP_EDIT_MAX = MAX_MESSAGE_LENGTH;
export const DM_EDIT_MAX = MAX_DM_LENGTH;

export function getMessagePreviewText(message: {
  content: string;
  recalled_at?: string | null;
  attachment?: unknown | null;
}): string {
  if (message.recalled_at) return "Tin nhắn đã được thu hồi";
  if (message.content.trim()) return message.content.trim();
  if (message.attachment) return "📎 File đính kèm";
  return "";
}
