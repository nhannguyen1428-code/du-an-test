import { isRedisConfigured } from "@/lib/chat/redis-store";
import * as memory from "@/lib/social/memory-store";
import * as redis from "@/lib/social/redis-store";
import {
  assertCanModifyMessage,
  DM_EDIT_MAX,
  validateEditContent,
} from "@/lib/message-actions";
import type { DmConversation, DmMessage, FriendRequest, User } from "@/types/social";
import { conversationId } from "@/types/social";

function useRedis() {
  return isRedisConfigured();
}

export async function registerUser(input: {
  id: string;
  nickname: string;
}): Promise<User> {
  return useRedis()
    ? redis.registerUserRedis(input)
    : memory.registerUserMemory(input);
}

export async function getUser(id: string): Promise<User | null> {
  return useRedis() ? redis.getUserRedis(id) : memory.getUserMemory(id);
}

export async function sendFriendRequest(
  requesterId: string,
  friendCode: string,
): Promise<FriendRequest> {
  return useRedis()
    ? redis.sendFriendRequestRedis(requesterId, friendCode)
    : memory.sendFriendRequestMemory(requesterId, friendCode);
}

export async function respondFriendRequest(
  userId: string,
  requesterId: string,
  accept: boolean,
): Promise<void> {
  return useRedis()
    ? redis.respondFriendRequestRedis(userId, requesterId, accept)
    : memory.respondFriendRequestMemory(userId, requesterId, accept);
}

export async function listFriendsData(userId: string): Promise<{
  friends: User[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  return useRedis()
    ? redis.listFriendsDataRedis(userId)
    : memory.listFriendsDataMemory(userId);
}

export async function listDmConversations(userId: string): Promise<DmConversation[]> {
  return useRedis()
    ? redis.listDmConversationsRedis(userId)
    : memory.listDmConversationsMemory(userId);
}

export async function listDmMessages(
  userId: string,
  convId: string,
  limit = 100,
): Promise<DmMessage[]> {
  return useRedis()
    ? redis.listDmMessagesRedis(userId, convId, limit)
    : memory.listDmMessagesMemory(userId, convId, limit);
}

export async function sendDmMessage(
  userId: string,
  convId: string,
  content: string,
  attachment?: import("@/types/attachment").MessageAttachment,
): Promise<DmMessage> {
  const areFriends = useRedis()
    ? await redis.areFriendsRedis(...convId.split(":") as [string, string])
    : await memory.areFriendsMemory(...convId.split(":") as [string, string]);
  if (!areFriends) throw new Error("Chỉ nhắn tin với bạn bè.");
  return useRedis()
    ? redis.sendDmMessageRedis(userId, convId, content, attachment)
    : memory.sendDmMessageMemory(userId, convId, content, attachment);
}

export async function markDmRead(userId: string, convId: string): Promise<void> {
  return useRedis()
    ? redis.markDmReadRedis(userId, convId)
    : memory.markDmReadMemory(userId, convId);
}

async function getDmMessage(
  userId: string,
  convId: string,
  messageId: string,
): Promise<DmMessage> {
  const messages = await listDmMessages(userId, convId, 500);
  const message = messages.find((m) => m.id === messageId);
  if (!message) throw new Error("Không tìm thấy tin nhắn.");
  return message;
}

export async function editDmMessage(
  userId: string,
  convId: string,
  messageId: string,
  content: string,
): Promise<DmMessage> {
  const message = await getDmMessage(userId, convId, messageId);
  assertCanModifyMessage(message);
  const trimmed = validateEditContent(content, DM_EDIT_MAX);
  return useRedis()
    ? redis.editDmMessageRedis(userId, convId, messageId, trimmed)
    : memory.editDmMessageMemory(userId, convId, messageId, trimmed);
}

export async function recallDmMessage(
  userId: string,
  convId: string,
  messageId: string,
): Promise<DmMessage> {
  const message = await getDmMessage(userId, convId, messageId);
  assertCanModifyMessage(message);
  return useRedis()
    ? redis.recallDmMessageRedis(userId, convId, messageId)
    : memory.recallDmMessageMemory(userId, convId, messageId);
}

export async function deleteDmMessage(
  userId: string,
  convId: string,
  messageId: string,
): Promise<void> {
  const message = await getDmMessage(userId, convId, messageId);
  assertCanModifyMessage(message);
  return useRedis()
    ? redis.deleteDmMessageRedis(userId, convId, messageId)
    : memory.deleteDmMessageMemory(userId, convId, messageId);
}

export function getConversationId(userId: string, friendId: string): string {
  return conversationId(userId, friendId);
}
