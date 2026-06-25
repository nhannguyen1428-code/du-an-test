import type { Message } from "@/types/message";
import { ROOM_ID } from "@/types/message";

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

export function listMessages(roomId: string = ROOM_ID, limit = 100): Message[] {
  const store = getStore();
  return store.messages
    .filter((m) => m.room_id === roomId)
    .slice(-limit);
}

export function addMessage(input: {
  room_id?: string;
  nickname: string;
  client_id: string | null;
  content: string;
}): Message {
  const store = getStore();
  const message: Message = {
    id: crypto.randomUUID(),
    room_id: input.room_id ?? ROOM_ID,
    nickname: input.nickname,
    client_id: input.client_id,
    content: input.content,
    created_at: new Date().toISOString(),
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
