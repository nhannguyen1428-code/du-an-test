import { NextResponse } from "next/server";
import { addMessage, listMessages } from "@/lib/chat/service";
import { validateMessageContent } from "@/lib/message-validation";
import { MAX_MESSAGE_LENGTH, ROOM_ID } from "@/types/message";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("room_id") ?? ROOM_ID;
  const messages = await listMessages(roomId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = String(body.nickname ?? "").trim();
    const clientId = body.client_id ? String(body.client_id) : null;
    const roomId = body.room_id ? String(body.room_id) : ROOM_ID;

    if (nickname.length < 2 || nickname.length > 24) {
      return NextResponse.json({ error: "Tên không hợp lệ." }, { status: 400 });
    }

    const { content, attachment } = validateMessageContent(
      String(body.content ?? ""),
      body.attachment,
      MAX_MESSAGE_LENGTH,
    );

    const message = await addMessage({
      room_id: roomId,
      nickname,
      client_id: clientId,
      content,
      attachment,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }
}
