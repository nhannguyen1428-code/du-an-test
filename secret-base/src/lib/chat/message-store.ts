import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";
import type { MessageAttachment } from "@/types/attachment";
import {
  splitActiveMessages,
} from "@/lib/message-ttl";
import { purgeAttachmentsFromMessages, deleteAttachment } from "@/lib/uploads/service";

type Store = {
  messages: Message[];
  listeners: Set<(message: Message) => void>;
};

const globalStore = globalThis as typeof globalThis & { __chatStore?: Store };

function getStore(): Store {
  if (!globalStore.__chatStore) {
    globalStore.__chatStore = { messages: [], listeners: new Set() };
  }
  return globalStore.__chatStore;
}

function purgeStore(store: Store) {
  const { active, removed } = splitActiveMessages(store.messages);
  if (removed.length > 0) {
    void purgeAttachmentsFromMessages(removed);
    store.messages = active;
  }
}

export function listMessages(roomId: string = ROOM_ID, limit = 100): Message[] {
  const store = getStore();
  purgeStore(store);
  return store.messages
    .filter((m) => m.room_id === roomId)
    .slice(-limit);
}

export function addMessage(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
  attachment?: MessageAttachment;
}): Message {
  const store = getStore();
  purgeStore(store);
  const message: Message = {
    id: crypto.randomUUID(),
    room_id: input.room_id ?? ROOM_ID,
    nickname: input.nickname,
    client_id: input.client_id,
    content: input.content,
    created_at: new Date().toISOString(),
    attachment: input.attachment ?? null,
  };
  store.messages.push(message);
  if (store.messages.length > 500) {
    store.messages = store.messages.slice(-500);
  }
  for (const listener of store.listeners) {
    listener(message);
  }
  return message;
}

export function subscribe(listener: (message: Message) => void): () => void {
  const store = getStore();
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

function findRoomMessage(roomId: string, messageId: string): Message {
  const store = getStore();
  purgeStore(store);
  const message = store.messages.find(
    (m) => m.id === messageId && m.room_id === roomId,
  );
  if (!message) throw new Error("Không tìm thấy tin nhắn.");
  return message;
}

export function editMessageMemory(
  roomId: string,
  messageId: string,
  clientId: string,
  content: string,
): Message {
  const store = getStore();
  const message = findRoomMessage(roomId, messageId);
  if (message.client_id !== clientId) throw new Error("Không có quyền.");
  const updated: Message = {
    ...message,
    content,
    edited_at: new Date().toISOString(),
  };
  store.messages = store.messages.map((m) =>
    m.id === messageId ? updated : m,
  );
  return updated;
}

export async function recallMessageMemory(
  roomId: string,
  messageId: string,
  clientId: string,
): Promise<Message> {
  const store = getStore();
  const message = findRoomMessage(roomId, messageId);
  if (message.client_id !== clientId) throw new Error("Không có quyền.");
  if (message.attachment) await deleteAttachment(message.attachment);
  const updated: Message = {
    ...message,
    content: "",
    attachment: null,
    recalled_at: new Date().toISOString(),
  };
  store.messages = store.messages.map((m) =>
    m.id === messageId ? updated : m,
  );
  return updated;
}

export async function deleteMessageMemory(
  roomId: string,
  messageId: string,
  clientId: string,
): Promise<void> {
  const store = getStore();
  const message = findRoomMessage(roomId, messageId);
  if (message.client_id !== clientId) throw new Error("Không có quyền.");
  if (message.attachment) await deleteAttachment(message.attachment);
  store.messages = store.messages.filter((m) => m.id !== messageId);
}
