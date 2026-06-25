import {
  addMessage as addMessageMemory,
  listMessages as listMessagesMemory,
} from "@/lib/chat/message-store";
import {
  addMessageRedis,
  isRedisConfigured,
  listMessagesRedis,
} from "@/lib/chat/redis-store";
import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";

export type ChatBackend = "supabase" | "redis" | "memory";

export function getServerBackend(): ChatBackend {
  if (isRedisConfigured()) return "redis";
  return "memory";
}

export async function listMessages(
  roomId: string = ROOM_ID,
  limit = 100,
): Promise<Message[]> {
  const backend = getServerBackend();
  if (backend === "redis") return listMessagesRedis(roomId, limit);
  return listMessagesMemory(roomId, limit);
}

export async function addMessage(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
}): Promise<Message> {
  const backend = getServerBackend();
  if (backend === "redis") return addMessageRedis(input);
  return addMessageMemory(input);
}
