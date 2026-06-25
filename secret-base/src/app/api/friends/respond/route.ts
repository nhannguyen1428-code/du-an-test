import { NextResponse } from "next/server";
import {
  badRequest,
  getUserIdFromRequest,
  unauthorized,
} from "@/lib/api/request";
import { respondFriendRequest } from "@/lib/social/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const requesterId = String(body.requester_id ?? "").trim();
    const action = String(body.action ?? "");

    if (!requesterId) return badRequest("Thiếu requester_id.");
    if (action !== "accept" && action !== "reject") {
      return badRequest("action phải là accept hoặc reject.");
    }

    await respondFriendRequest(userId, requesterId, action === "accept");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Xử lý lời mời thất bại.");
  }
}
