const NICKNAME_KEY = "secret-base:nickname";
const CLIENT_ID_KEY = "secret-base:client-id";

export function getNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function clearNickname(): void {
  localStorage.removeItem(NICKNAME_KEY);
}

export function getClientId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
