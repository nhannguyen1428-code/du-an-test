import { USER_ID_HEADER } from "@/lib/api/request";
import { getClientId } from "@/lib/storage";

export function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    [USER_ID_HEADER]: getClientId(),
  };
}

import type { User } from "@/types/social";

export async function registerUserApi(nickname: string, userId: string) {
  const res = await fetch("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: userId, nickname }),
  });
  if (!res.ok) throw new Error("Đăng ký thất bại.");
  return (await res.json()) as { user: User };
}
