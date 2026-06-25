import { Redis } from "@upstash/redis";
import { generateFriendCode, normalizeFriendCode } from "@/lib/friend-code";
import { isRedisConfigured } from "@/lib/chat/redis-store";
import {
  getLatestActiveMessage,
  loadAndPurgeRedisList,
} from "@/lib/message-ttl";
import { mutateRedisList } from "@/lib/redis-list-mutate";
import { deleteAttachment } from "@/lib/uploads/service";
import type {
  DmConversation,
  DmMessage,
  FriendRequest,
  User,
} from "@/types/social";
import { conversationId, MAX_DM_LENGTH } from "@/types/social";

function redis(): Redis {
  return Redis.fromEnv();
}

function userKey(id: string) {
  return `social:user:${id}`;
}
function codeKey(code: string) {
  return `social:code:${code}`;
}
function pairKey(a: string, b: string) {
  return `social:pair:${[a, b].sort().join(":")}`;
}
function friendsKey(userId: string) {
  return `social:friends:${userId}`;
}
function pendingInKey(userId: string) {
  return `social:pending_in:${userId}`;
}
function pendingOutKey(userId: string) {
  return `social:pending_out:${userId}`;
}
function dmKey(convId: string) {
  return `social:dm:${convId}`;
}
function readKey(userId: string, convId: string) {
  return `social:read:${userId}:${convId}`;
}

function parseDmMessage(raw: unknown): DmMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as DmMessage;
  return m.id && m.created_at ? m : null;
}

function serializeDmMessage(message: DmMessage): string {
  return JSON.stringify(message);
}

async function loadDmMessages(convId: string): Promise<DmMessage[]> {
  return loadAndPurgeRedisList(
    redis(),
    dmKey(convId),
    parseDmMessage,
    serializeDmMessage,
  );
}

async function countUnreadRedis(userId: string, convId: string): Promise<number> {
  const r = redis();
  const lastRead = (await r.get<string>(readKey(userId, convId))) ?? "";
  const messages = await loadDmMessages(convId);
  return messages.filter(
    (m) => m.sender_id !== userId && m.created_at > lastRead,
  ).length;
}

export async function markDmReadRedis(userId: string, convId: string): Promise<void> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  await redis().set(readKey(userId, convId), new Date().toISOString());
}

export { isRedisConfigured };

export async function registerUserRedis(input: {
  id: string;
  nickname: string;
}): Promise<User> {
  const r = redis();
  const existing = await r.get<User>(userKey(input.id));
  if (existing) {
    const updated = { ...existing, nickname: input.nickname };
    await r.set(userKey(input.id), updated);
    return updated;
  }

  let code = generateFriendCode();
  while (await r.exists(codeKey(code))) code = generateFriendCode();

  const user: User = {
    id: input.id,
    nickname: input.nickname,
    friend_code: code,
    created_at: new Date().toISOString(),
  };
  await r.set(userKey(user.id), user);
  await r.set(codeKey(code), user.id);
  return user;
}

export async function getUserRedis(id: string): Promise<User | null> {
  return (await redis().get<User>(userKey(id))) ?? null;
}

export async function getUserByCodeRedis(code: string): Promise<User | null> {
  const userId = await redis().get<string>(codeKey(normalizeFriendCode(code)));
  if (!userId) return null;
  return getUserRedis(userId);
}

export async function sendFriendRequestRedis(
  requesterId: string,
  friendCode: string,
): Promise<FriendRequest> {
  const r = redis();
  const target = await getUserByCodeRedis(friendCode);
  if (!target) throw new Error("Không tìm thấy mã bạn.");
  if (target.id === requesterId) throw new Error("Không thể kết bạn với chính mình.");

  const key = pairKey(requesterId, target.id);
  const status = await r.get<string>(key);
  if (status === "accepted") throw new Error("Đã là bạn bè.");
  if (status === "pending") throw new Error("Đã gửi lời mời rồi.");

  await r.set(key, "pending");
  await r.sadd(pendingInKey(target.id), requesterId);
  await r.sadd(pendingOutKey(requesterId), target.id);

  return {
    id: key.replace("social:pair:", ""),
    requester_id: requesterId,
    addressee_id: target.id,
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

export async function respondFriendRequestRedis(
  userId: string,
  requesterId: string,
  accept: boolean,
): Promise<void> {
  const r = redis();
  const key = pairKey(userId, requesterId);
  const status = await r.get<string>(key);
  if (status !== "pending") throw new Error("Lời mời không hợp lệ.");

  await r.srem(pendingInKey(userId), requesterId);
  await r.srem(pendingOutKey(requesterId), userId);

  if (accept) {
    await r.set(key, "accepted");
    await r.sadd(friendsKey(userId), requesterId);
    await r.sadd(friendsKey(requesterId), userId);
  } else {
    await r.set(key, "rejected");
  }
}

export async function listFriendsDataRedis(userId: string): Promise<{
  friends: User[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const r = redis();
  const friendIds = (await r.smembers<string[]>(friendsKey(userId))) ?? [];
  const friends = (
    await Promise.all(friendIds.map((id) => getUserRedis(id)))
  ).filter((u): u is User => u !== null);

  const incomingIds = (await r.smembers<string[]>(pendingInKey(userId))) ?? [];
  const incoming: FriendRequest[] = [];
  for (const rid of incomingIds) {
    const requester = await getUserRedis(rid);
    if (!requester) continue;
    incoming.push({
      id: [rid, userId].sort().join(":"),
      requester_id: rid,
      addressee_id: userId,
      status: "pending",
      created_at: new Date().toISOString(),
      requester,
    });
  }

  const outgoingIds = (await r.smembers<string[]>(pendingOutKey(userId))) ?? [];
  const outgoing: FriendRequest[] = [];
  for (const aid of outgoingIds) {
    const addressee = await getUserRedis(aid);
    if (!addressee) continue;
    outgoing.push({
      id: [userId, aid].sort().join(":"),
      requester_id: userId,
      addressee_id: aid,
      status: "pending",
      created_at: new Date().toISOString(),
      addressee,
    });
  }

  return { friends, incoming, outgoing };
}

export async function listDmConversationsRedis(
  userId: string,
): Promise<DmConversation[]> {
  const { friends } = await listFriendsDataRedis(userId);
  const result: DmConversation[] = [];

  for (const friend of friends) {
    const convId = conversationId(userId, friend.id);
    const messages = await loadDmMessages(convId);
    const last = getLatestActiveMessage(messages);
    const unread = await countUnreadRedis(userId, convId);
    result.push({ id: convId, friend, last_message: last, unread_count: unread });
  }

  return result.sort((a, b) => {
    const ta = a.last_message?.created_at ?? "";
    const tb = b.last_message?.created_at ?? "";
    return tb.localeCompare(ta);
  });
}

export async function listDmMessagesRedis(
  userId: string,
  convId: string,
  limit = 100,
): Promise<DmMessage[]> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const active = await loadDmMessages(convId);
  return active.slice(-limit);
}

export async function sendDmMessageRedis(
  userId: string,
  convId: string,
  content: string,
  attachment?: import("@/types/attachment").MessageAttachment,
): Promise<DmMessage> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const trimmed = content.trim();
  if ((!trimmed && !attachment) || trimmed.length > MAX_DM_LENGTH) {
    throw new Error("Tin nhắn không hợp lệ.");
  }

  const message: DmMessage = {
    id: crypto.randomUUID(),
    conversation_id: convId,
    sender_id: userId,
    content: trimmed,
    created_at: new Date().toISOString(),
    attachment: attachment ?? null,
  };
  const r = redis();
  await loadDmMessages(convId);
  await r.rpush(dmKey(convId), serializeDmMessage(message));
  await r.ltrim(dmKey(convId), -500, -1);
  return message;
}

export async function areFriendsRedis(a: string, b: string): Promise<boolean> {
  return (await redis().get<string>(pairKey(a, b))) === "accepted";
}

export async function editDmMessageRedis(
  userId: string,
  convId: string,
  messageId: string,
  content: string,
): Promise<DmMessage> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const result = await mutateRedisList(
    redis(),
    dmKey(convId),
    parseDmMessage,
    serializeDmMessage,
    messageId,
    (message) => {
      if (message.sender_id !== userId) throw new Error("Không có quyền.");
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

export async function recallDmMessageRedis(
  userId: string,
  convId: string,
  messageId: string,
): Promise<DmMessage> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  let attachmentToDelete: DmMessage["attachment"];
  const result = await mutateRedisList(
    redis(),
    dmKey(convId),
    parseDmMessage,
    serializeDmMessage,
    messageId,
    (message) => {
      if (message.sender_id !== userId) throw new Error("Không có quyền.");
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

export async function deleteDmMessageRedis(
  userId: string,
  convId: string,
  messageId: string,
): Promise<void> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  await mutateRedisList(
    redis(),
    dmKey(convId),
    parseDmMessage,
    serializeDmMessage,
    messageId,
    (message) => {
      if (message.sender_id !== userId) throw new Error("Không có quyền.");
      return "delete";
    },
  );
}
