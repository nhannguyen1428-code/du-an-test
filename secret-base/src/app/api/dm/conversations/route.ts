import { NextResponse } from "next/server";
import { getUserIdFromRequest, unauthorized } from "@/lib/api/request";
import { listDmConversations } from "@/lib/social/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const conversations = await listDmConversations(userId);
  return NextResponse.json({ conversations });
}
