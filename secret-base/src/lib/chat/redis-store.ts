import { Redis } from "@upstash/redis";
import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";
import type { MessageAttachment } from "@/types/attachment";
import { loadAndPurgeRedisList } from "@/lib/message-ttl";
import { mutateRedisList } from "@/lib/redis-list-mutate";
import { deleteAttachment } from "@/lib/uploads/service";

function redisKey(roomId: string) {
  return `messages:${roomId}`;
}

function parseMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Message;
  return m.id && m.created_at ? m : null;
}

function serializeMessage(message: Message): string {
  return JSON.stringify(message);
}

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRedis(): Redis {
  return Redis.fromEnv();
}

export async function listMessagesRedis(
  roomId: string = ROOM_ID,
  limit = 100,
): Promise<Message[]> {
  const redis = getRedis();
  const active = await loadAndPurgeRedisList(
    redis,
    redisKey(roomId),
    parseMessage,
    serializeMessage,
  );
  return active.slice(-limit);
}

export async function addMessageRedis(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
  attachment?: MessageAttachment;
}): Promise<Message> {
  const redis = getRedis();
  const roomId = input.room_id ?? ROOM_ID;
  const key = redisKey(roomId);

  await loadAndPurgeRedisList(redis, key, parseMessage, serializeMessage);

  const message: Message = {
    id: crypto.randomUUID(),
    room_id: roomId,
    nickname: input.nickname,
    client_id: input.client_id,
    content: input.content,
    created_at: new Date().toISOString(),
    attachment: input.attachment ?? null,
  };

  await redis.rpush(key, serializeMessage(message));
  await redis.ltrim(key, -500, -1);

  return message;
}

export async function editMessageRedis(
  roomId: string,
  messageId: string,
  clientId: string,
  content: string,
): Promise<Message> {
  const redis = getRedis();
  const result = await mutateRedisList(
    redis,
    redisKey(roomId),
    parseMessage,
    serializeMessage,
    messageId,
    (message) => {
      if (message.client_id !== clientId) throw new Error("Không có quyền.");
      return {
        ...message,
        content,
        edited_at: new Date().toISOString(),
      };
    },
  );
  if (!result) throw new Error("Không tìm thấy tin nhắn.");
  return result;
}

export async function recallMessageRedis(
  roomId: string,
  messageId: string,
  clientId: string,
): Promise<Message> {
  const redis = getRedis();
  let attachmentToDelete: MessageAttachment | null | undefined;
  const result = await mutateRedisList(
    redis,
    redisKey(roomId),
    parseMessage,
    serializeMessage,
    messageId,
    (message) => {
      if (message.client_id !== clientId) throw new Error("Không có quyền.");
      attachmentToDelete = message.attachment;
      return {
        ...message,
        content: "",
        attachment: null,
        recalled_at: new Date().toISOString(),
      };
    },
  );
  if (attachmentToDelete) await deleteAttachment(attachmentToDelete);
  if (!result) throw new Error("Không tìm thấy tin nhắn.");
  return result;
}

export async function deleteMessageRedis(
  roomId: string,
  messageId: string,
  clientId: string,
): Promise<void> {
  const redis = getRedis();
  await mutateRedisList(
    redis,
    redisKey(roomId),
    parseMessage,
    serializeMessage,
    messageId,
    (message) => {
      if (message.client_id !== clientId) throw new Error("Không có quyền.");
      return "delete";
    },
  );
}
