import { Redis } from "@upstash/redis";
import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";

function redisKey(roomId: string) {
  return `messages:${roomId}`;
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
  const raw = await redis.lrange<string>(redisKey(roomId), -limit, -1);
  return raw
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item) as Message;
        } catch {
          return null;
        }
      }
      return item as Message;
    })
    .filter((m): m is Message => m !== null);
}

export async function addMessageRedis(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
}): Promise<Message> {
  const redis = getRedis();
  const roomId = input.room_id ?? ROOM_ID;
  const message: Message = {
    id: crypto.randomUUID(),
    room_id: roomId,
    nickname: input.nickname,
    client_id: input.client_id,
    content: input.content,
    created_at: new Date().toISOString(),
  };

  await redis.rpush(redisKey(roomId), JSON.stringify(message));
  await redis.ltrim(redisKey(roomId), -500, -1);

  return message;
}
