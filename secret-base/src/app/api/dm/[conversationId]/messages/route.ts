import { NextResponse } from "next/server";
import {
  badRequest,
  getUserIdFromRequest,
  unauthorized,
} from "@/lib/api/request";
import { listDmMessages, sendDmMessage } from "@/lib/social/service";
import { validateMessageContent } from "@/lib/message-validation";
import { MAX_DM_LENGTH } from "@/types/social";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId } = await params;
  try {
    const messages = await listDmMessages(userId, conversationId);
    return NextResponse.json({ messages });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Không tải được tin nhắn.");
  }
}

export async function POST(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId } = await params;
  try {
    const body = await request.json();
    const { content, attachment } = validateMessageContent(
      String(body.content ?? ""),
      body.attachment,
      MAX_DM_LENGTH,
    );
    const message = await sendDmMessage(userId, conversationId, content, attachment);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Gửi tin thất bại.");
  }
}
