export type User = {
  id: string;
  nickname: string;
  friend_code: string;
  created_at: string;
};

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export type FriendRequest = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  requester?: User;
  addressee?: User;
};

export type DmMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  recalled_at?: string | null;
  attachment?: import("@/types/attachment").MessageAttachment | null;
};

export type DmConversation = {
  id: string;
  friend: User;
  last_message: DmMessage | null;
  unread_count: number;
};

export const MAX_DM_LENGTH = 500;

export function conversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join(":");
}
