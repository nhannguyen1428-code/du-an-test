export type Message = {
  id: string;
  room_id: string;
  nickname: string;
  client_id: string | null;
  content: string;
  created_at: string;
};

export const ROOM_ID = "secret-base";
export const MAX_MESSAGE_LENGTH = 500;
export const SEND_COOLDOWN_MS = 1500;
