import { NextResponse } from "next/server";
import {
  badRequest,
  getUserIdFromRequest,
  unauthorized,
} from "@/lib/api/request";
import { listFriendsData, sendFriendRequest } from "@/lib/social/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const data = await listFriendsData(userId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const friendCode = String(body.friend_code ?? "");
    const request_ = await sendFriendRequest(userId, friendCode);
    return NextResponse.json({ request: request_ }, { status: 201 });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Gửi lời mời thất bại.");
  }
}
