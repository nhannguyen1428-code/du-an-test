import type { Redis } from "@upstash/redis";
import { purgeAttachmentsFromMessages } from "@/lib/uploads/service";
import type { MessageAttachment } from "@/types/attachment";

export const MESSAGE_TTL_MS = 30 * 60 * 1000;
export const MESSAGE_TTL_MINUTES = 30;

type MaybeAttachment = { created_at: string; attachment?: MessageAttachment | null };

export function isMessageExpired(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() >= MESSAGE_TTL_MS;
}

export function splitActiveMessages<T extends { created_at: string }>(
  messages: T[],
  now = Date.now(),
): { active: T[]; removed: T[] } {
  const active: T[] = [];
  const removed: T[] = [];
  for (const message of messages) {
    if (isMessageExpired(message.created_at, now)) removed.push(message);
    else active.push(message);
  }
  return { active, removed };
}

export function filterActiveMessages<T extends { created_at: string }>(
  messages: T[],
  now = Date.now(),
): T[] {
  return splitActiveMessages(messages, now).active;
}

export function getLatestActiveMessage<T extends { created_at: string }>(
  messages: T[],
): T | null {
  return filterActiveMessages(messages).at(-1) ?? null;
}

export async function loadAndPurgeRedisList<T extends MaybeAttachment>(
  redis: Redis,
  key: string,
  parseItem: (raw: unknown) => T | null,
  serializeItem: (item: T) => string,
): Promise<T[]> {
  const raw = await redis.lrange<string>(key, 0, -1);
  const items = raw
    .map((item) => {
      try {
        const parsed = typeof item === "string" ? JSON.parse(item) : item;
        return parseItem(parsed);
      } catch {
        return null;
      }
    })
    .filter((m): m is T => m !== null);

  const { active, removed } = splitActiveMessages(items);
  if (active.length !== items.length) {
    await purgeAttachmentsFromMessages(removed);
    await redis.del(key);
    if (active.length > 0) {
      await redis.rpush(key, ...active.map(serializeItem));
    }
  }
  return active;
}
