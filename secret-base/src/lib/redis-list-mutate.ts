import type { Redis } from "@upstash/redis";
import { loadAndPurgeRedisList } from "@/lib/message-ttl";
import { deleteAttachment } from "@/lib/uploads/service";
import type { MessageAttachment } from "@/types/attachment";

type MutableMessage = {
  id: string;
  created_at: string;
  attachment?: MessageAttachment | null;
};

export async function mutateRedisList<T extends MutableMessage>(
  redis: Redis,
  key: string,
  parseItem: (raw: unknown) => T | null,
  serializeItem: (item: T) => string,
  messageId: string,
  mutator: (item: T) => T | "delete",
): Promise<T | null> {
  const active = await loadAndPurgeRedisList(redis, key, parseItem, serializeItem);
  const idx = active.findIndex((m) => m.id === messageId);
  if (idx === -1) throw new Error("Không tìm thấy tin nhắn.");

  const current = active[idx];
  const next = mutator(current);

  if (next === "delete") {
    if (current.attachment) await deleteAttachment(current.attachment);
    active.splice(idx, 1);
  } else {
    active[idx] = next;
  }

  await redis.del(key);
  if (active.length > 0) {
    await redis.rpush(key, ...active.map(serializeItem));
  }

  return next === "delete" ? null : next;
}
