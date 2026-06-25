import { NextResponse } from "next/server";

export const USER_ID_HEADER = "x-user-id";

export function getUserIdFromRequest(request: Request): string | null {
  const id = request.headers.get(USER_ID_HEADER);
  if (!id || id.length < 10) return null;
  return id;
}

export function unauthorized() {
  return NextResponse.json({ error: "Chưa xác thực người dùng." }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}
