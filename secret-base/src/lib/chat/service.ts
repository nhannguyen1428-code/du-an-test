import {
  addMessage as addMessageMemory,
  deleteMessageMemory,
  editMessageMemory,
  listMessages as listMessagesMemory,
  recallMessageMemory,
} from "@/lib/chat/message-store";
import {
  addMessageRedis,
  deleteMessageRedis,
  editMessageRedis,
  isRedisConfigured,
  listMessagesRedis,
  recallMessageRedis,
} from "@/lib/chat/redis-store";
import {
  assertCanModifyMessage,
  GROUP_EDIT_MAX,
  validateEditContent,
} from "@/lib/message-actions";
import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";

export type ChatBackend = "supabase" | "redis" | "memory";

export function getServerBackend(): ChatBackend {
  if (isRedisConfigured()) return "redis";
  return "memory";
}

function useRedis() {
  return isRedisConfigured();
}

export async function listMessages(
  roomId: string = ROOM_ID,
  limit = 100,
): Promise<Message[]> {
  if (useRedis()) return listMessagesRedis(roomId, limit);
  return listMessagesMemory(roomId, limit);
}

export async function addMessage(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
  attachment?: import("@/types/attachment").MessageAttachment;
}): Promise<Message> {
  if (useRedis()) return addMessageRedis(input);
  return addMessageMemory(input);
}

async function getGroupMessage(
  roomId: string,
  messageId: string,
): Promise<Message> {
  const messages = await listMessages(roomId, 500);
  const message = messages.find((m) => m.id === messageId);
  if (!message) throw new Error("Không tìm thấy tin nhắn.");
  return message;
}

export async function editGroupMessage(input: {
  room_id?: string;
  message_id: string;
  client_id: string;
  content: string;
}): Promise<Message> {
  const roomId = input.room_id ?? ROOM_ID;
  const message = await getGroupMessage(roomId, input.message_id);
  assertCanModifyMessage(message);
  const content = validateEditContent(input.content, GROUP_EDIT_MAX);

  return useRedis()
    ? editMessageRedis(roomId, input.message_id, input.client_id, content)
    : editMessageMemory(roomId, input.message_id, input.client_id, content);
}

export async function recallGroupMessage(input: {
  room_id?: string;
  message_id: string;
  client_id: string;
}): Promise<Message> {
  const roomId = input.room_id ?? ROOM_ID;
  const message = await getGroupMessage(roomId, input.message_id);
  assertCanModifyMessage(message);

  return useRedis()
    ? recallMessageRedis(roomId, input.message_id, input.client_id)
    : recallMessageMemory(roomId, input.message_id, input.client_id);
}

export async function deleteGroupMessage(input: {
  room_id?: string;
  message_id: string;
  client_id: string;
}): Promise<void> {
  const roomId = input.room_id ?? ROOM_ID;
  const message = await getGroupMessage(roomId, input.message_id);
  assertCanModifyMessage(message);

  if (useRedis()) {
    await deleteMessageRedis(roomId, input.message_id, input.client_id);
  } else {
    await deleteMessageMemory(roomId, input.message_id, input.client_id);
  }
}
