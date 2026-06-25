import { generateFriendCode, normalizeFriendCode } from "@/lib/friend-code";
import {
  filterActiveMessages,
  getLatestActiveMessage,
  splitActiveMessages,
} from "@/lib/message-ttl";
import { purgeAttachmentsFromMessages, deleteAttachment } from "@/lib/uploads/service";
import type { MessageAttachment } from "@/types/attachment";
import type {
  DmConversation,
  DmMessage,
  FriendRequest,
  User,
} from "@/types/social";
import { conversationId, MAX_DM_LENGTH } from "@/types/social";

type MemorySocial = {
  users: Map<string, User>;
  codes: Map<string, string>;
  friendships: Map<string, "pending" | "accepted" | "rejected">;
  pendingIn: Map<string, Set<string>>;
  pendingOut: Map<string, Set<string>>;
  friends: Map<string, Set<string>>;
  dmMessages: Map<string, DmMessage[]>;
  lastRead: Map<string, string>;
};

const globalStore = globalThis as typeof globalThis & {
  __socialStore?: MemorySocial;
};

function store(): MemorySocial {
  if (!globalStore.__socialStore) {
    globalStore.__socialStore = {
      users: new Map(),
      codes: new Map(),
      friendships: new Map(),
      pendingIn: new Map(),
      pendingOut: new Map(),
      friends: new Map(),
      dmMessages: new Map(),
      lastRead: new Map(),
    };
  }
  return globalStore.__socialStore;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function getFriendsSet(userId: string) {
  const s = store();
  if (!s.friends.has(userId)) s.friends.set(userId, new Set());
  return s.friends.get(userId)!;
}

export async function registerUserMemory(input: {
  id: string;
  nickname: string;
}): Promise<User> {
  const s = store();
  const existing = s.users.get(input.id);
  if (existing) {
    const updated = { ...existing, nickname: input.nickname };
    s.users.set(input.id, updated);
    return updated;
  }

  let code = generateFriendCode();
  while (s.codes.has(code)) code = generateFriendCode();

  const user: User = {
    id: input.id,
    nickname: input.nickname,
    friend_code: code,
    created_at: new Date().toISOString(),
  };
  s.users.set(user.id, user);
  s.codes.set(code, user.id);
  return user;
}

export async function getUserMemory(id: string): Promise<User | null> {
  return store().users.get(id) ?? null;
}

export async function getUserByCodeMemory(code: string): Promise<User | null> {
  const userId = store().codes.get(normalizeFriendCode(code));
  if (!userId) return null;
  return getUserMemory(userId);
}

export async function sendFriendRequestMemory(
  requesterId: string,
  friendCode: string,
): Promise<FriendRequest> {
  const s = store();
  const target = await getUserByCodeMemory(friendCode);
  if (!target) throw new Error("Không tìm thấy mã bạn.");
  if (target.id === requesterId) throw new Error("Không thể kết bạn với chính mình.");

  const key = pairKey(requesterId, target.id);
  const status = s.friendships.get(key);
  if (status === "accepted") throw new Error("Đã là bạn bè.");
  if (status === "pending") throw new Error("Đã gửi lời mời rồi.");

  s.friendships.set(key, "pending");
  if (!s.pendingIn.has(target.id)) s.pendingIn.set(target.id, new Set());
  if (!s.pendingOut.has(requesterId)) s.pendingOut.set(requesterId, new Set());
  s.pendingIn.get(target.id)!.add(requesterId);
  s.pendingOut.get(requesterId)!.add(target.id);

  return {
    id: key,
    requester_id: requesterId,
    addressee_id: target.id,
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

export async function respondFriendRequestMemory(
  userId: string,
  requesterId: string,
  accept: boolean,
): Promise<void> {
  const s = store();
  const key = pairKey(userId, requesterId);
  if (s.friendships.get(key) !== "pending") throw new Error("Lời mời không hợp lệ.");
  if (!s.pendingIn.get(userId)?.has(requesterId)) throw new Error("Lời mời không hợp lệ.");

  s.pendingIn.get(userId)!.delete(requesterId);
  s.pendingOut.get(requesterId)?.delete(userId);

  if (accept) {
    s.friendships.set(key, "accepted");
    getFriendsSet(userId).add(requesterId);
    getFriendsSet(requesterId).add(userId);
  } else {
    s.friendships.set(key, "rejected");
  }
}

export async function listFriendsDataMemory(userId: string): Promise<{
  friends: User[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const s = store();
  const friendIds = [...(s.friends.get(userId) ?? [])];
  const friends = (await Promise.all(friendIds.map((id) => getUserMemory(id)))).filter(
    (u): u is User => u !== null,
  );

  const incomingIds = [...(s.pendingIn.get(userId) ?? [])];
  const incoming: FriendRequest[] = [];
  for (const rid of incomingIds) {
    const requester = await getUserMemory(rid);
    if (!requester) continue;
    incoming.push({
      id: pairKey(rid, userId),
      requester_id: rid,
      addressee_id: userId,
      status: "pending",
      created_at: new Date().toISOString(),
      requester,
    });
  }

  const outgoingIds = [...(s.pendingOut.get(userId) ?? [])];
  const outgoing: FriendRequest[] = [];
  for (const aid of outgoingIds) {
    const addressee = await getUserMemory(aid);
    if (!addressee) continue;
    outgoing.push({
      id: pairKey(userId, aid),
      requester_id: userId,
      addressee_id: aid,
      status: "pending",
      created_at: new Date().toISOString(),
      addressee,
    });
  }

  return { friends, incoming, outgoing };
}

function readKey(userId: string, convId: string) {
  return `${userId}:${convId}`;
}

function purgeDmMemory(convId: string) {
  const s = store();
  const list = s.dmMessages.get(convId);
  if (!list) return;
  const { active, removed } = splitActiveMessages(list);
  if (removed.length > 0) {
    void purgeAttachmentsFromMessages(removed);
    s.dmMessages.set(convId, active);
  }
}

function countUnreadMemory(userId: string, convId: string): number {
  const s = store();
  purgeDmMemory(convId);
  const lastRead = s.lastRead.get(readKey(userId, convId)) ?? "";
  const messages = s.dmMessages.get(convId) ?? [];
  return messages.filter(
    (m) => m.sender_id !== userId && m.created_at > lastRead,
  ).length;
}

export async function markDmReadMemory(userId: string, convId: string): Promise<void> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  store().lastRead.set(readKey(userId, convId), new Date().toISOString());
}

export async function listDmConversationsMemory(
  userId: string,
): Promise<DmConversation[]> {
  const { friends } = await listFriendsDataMemory(userId);
  const s = store();
  const result: DmConversation[] = [];

  for (const friend of friends) {
    const convId = conversationId(userId, friend.id);
    purgeDmMemory(convId);
    const messages = s.dmMessages.get(convId) ?? [];
    result.push({
      id: convId,
      friend,
      last_message: getLatestActiveMessage(messages),
      unread_count: countUnreadMemory(userId, convId),
    });
  }

  return result.sort((a, b) => {
    const ta = a.last_message?.created_at ?? "";
    const tb = b.last_message?.created_at ?? "";
    return tb.localeCompare(ta);
  });
}

export async function listDmMessagesMemory(
  userId: string,
  convId: string,
  limit = 100,
): Promise<DmMessage[]> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  purgeDmMemory(convId);
  const messages = store().dmMessages.get(convId) ?? [];
  return messages.slice(-limit);
}

export async function sendDmMessageMemory(
  userId: string,
  convId: string,
  content: string,
  attachment?: MessageAttachment,
): Promise<DmMessage> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const trimmed = content.trim();
  if ((!trimmed && !attachment) || trimmed.length > MAX_DM_LENGTH) {
    throw new Error("Tin nhắn không hợp lệ.");
  }

  const s = store();
  purgeDmMemory(convId);
  const message: DmMessage = {
    id: crypto.randomUUID(),
    conversation_id: convId,
    sender_id: userId,
    content: trimmed,
    created_at: new Date().toISOString(),
    attachment: attachment ?? null,
  };
  if (!s.dmMessages.has(convId)) s.dmMessages.set(convId, []);
  const list = s.dmMessages.get(convId)!;
  list.push(message);
  if (list.length > 500) s.dmMessages.set(convId, list.slice(-500));
  return message;
}

export async function areFriendsMemory(a: string, b: string): Promise<boolean> {
  return store().friendships.get(pairKey(a, b)) === "accepted";
}

function findDmMessage(convId: string, messageId: string): DmMessage {
  purgeDmMemory(convId);
  const messages = store().dmMessages.get(convId) ?? [];
  const message = messages.find((m) => m.id === messageId);
  if (!message) throw new Error("Không tìm thấy tin nhắn.");
  return message;
}

export function editDmMessageMemory(
  userId: string,
  convId: string,
  messageId: string,
  content: string,
): DmMessage {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const s = store();
  const message = findDmMessage(convId, messageId);
  if (message.sender_id !== userId) throw new Error("Không có quyền.");
  const updated: DmMessage = {
    ...message,
    content,
    edited_at: new Date().toISOString(),
  };
  const list = s.dmMessages.get(convId) ?? [];
  s.dmMessages.set(
    convId,
    list.map((m) => (m.id === messageId ? updated : m)),
  );
  return updated;
}

export async function recallDmMessageMemory(
  userId: string,
  convId: string,
  messageId: string,
): Promise<DmMessage> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const s = store();
  const message = findDmMessage(convId, messageId);
  if (message.sender_id !== userId) throw new Error("Không có quyền.");
  if (message.attachment) await deleteAttachment(message.attachment);
  const updated: DmMessage = {
    ...message,
    content: "",
    attachment: null,
    recalled_at: new Date().toISOString(),
  };
  const list = s.dmMessages.get(convId) ?? [];
  s.dmMessages.set(
    convId,
    list.map((m) => (m.id === messageId ? updated : m)),
  );
  return updated;
}

export async function deleteDmMessageMemory(
  userId: string,
  convId: string,
  messageId: string,
): Promise<void> {
  if (!convId.includes(userId)) throw new Error("Không có quyền.");
  const s = store();
  const message = findDmMessage(convId, messageId);
  if (message.sender_id !== userId) throw new Error("Không có quyền.");
  if (message.attachment) await deleteAttachment(message.attachment);
  const list = s.dmMessages.get(convId) ?? [];
  s.dmMessages.set(
    convId,
    list.filter((m) => m.id !== messageId),
  );
}
