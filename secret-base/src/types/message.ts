export type Message = {
  id: string;
  room_id: string;
  nickname: string;
  client_id: string | null;
  content: string;
  created_at: string;
  edited_at?: string | null;
  recalled_at?: string | null;
  attachment?: import("@/types/attachment").MessageAttachment | null;
};

export const ROOM_ID = "secret-base";
export const MAX_MESSAGE_LENGTH = 500;
export const SEND_COOLDOWN_MS = 1500;
