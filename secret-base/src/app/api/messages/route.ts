import { NextResponse } from "next/server";
import { addMessage, listMessages } from "@/lib/chat/service";
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
    const content = String(body.content ?? "").trim();
    const clientId = body.client_id ? String(body.client_id) : null;
    const roomId = body.room_id ? String(body.room_id) : ROOM_ID;

    if (nickname.length < 2 || nickname.length > 24) {
      return NextResponse.json({ error: "Tên không hợp lệ." }, { status: 400 });
    }
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Tin nhắn không hợp lệ." },
        { status: 400 },
      );
    }

    const message = await addMessage({
      room_id: roomId,
      nickname,
      client_id: clientId,
      content,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
}
