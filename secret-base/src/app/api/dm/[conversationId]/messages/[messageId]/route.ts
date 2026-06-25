import { NextResponse } from "next/server";
import {
  badRequest,
  getUserIdFromRequest,
  unauthorized,
} from "@/lib/api/request";
import {
  deleteDmMessage,
  editDmMessage,
  recallDmMessage,
} from "@/lib/social/service";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ conversationId: string; messageId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId, messageId } = await params;
  try {
    const body = await request.json();
    const content = String(body.content ?? "");
    const message = await editDmMessage(userId, conversationId, messageId, content);
    return NextResponse.json({ message });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Sửa tin thất bại.");
  }
}

export async function POST(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId, messageId } = await params;
  try {
    const body = await request.json();
    const action = String(body.action ?? "recall");
    if (action !== "recall") {
      return badRequest("Hành động không hợp lệ.");
    }
    const message = await recallDmMessage(userId, conversationId, messageId);
    return NextResponse.json({ message });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Thu hồi tin thất bại.");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { conversationId, messageId } = await params;
  try {
    await deleteDmMessage(userId, conversationId, messageId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Xóa tin thất bại.");
  }
}
