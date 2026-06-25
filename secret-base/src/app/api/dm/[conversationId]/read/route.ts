import { NextResponse } from "next/server";
import {
  badRequest,
  getUserIdFromRequest,
  unauthorized,
} from "@/lib/api/request";
import { markDmRead } from "@/lib/social/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId } = await params;
  try {
    await markDmRead(userId, conversationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Đánh dấu đọc thất bại.");
  }
}
