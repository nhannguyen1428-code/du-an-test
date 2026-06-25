import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api/request";
import { registerUser } from "@/lib/social/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();

    if (id.length < 10) return badRequest("ID người dùng không hợp lệ.");
    if (nickname.length < 2 || nickname.length > 24) {
      return badRequest("Tên phải từ 2–24 ký tự.");
    }

    const user = await registerUser({ id, nickname });
    return NextResponse.json({ user });
  } catch {
    return badRequest("Dữ liệu không hợp lệ.");
  }
}
