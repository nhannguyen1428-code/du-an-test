import { NextResponse } from "next/server";
import {
  deleteGroupMessage,
  editGroupMessage,
  recallGroupMessage,
} from "@/lib/chat/service";
import { ROOM_ID } from "@/types/message";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ messageId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const clientId = String(body.client_id ?? "");
    const roomId = body.room_id ? String(body.room_id) : ROOM_ID;
    const content = String(body.content ?? "");

    if (!clientId) {
      return NextResponse.json({ error: "Thiếu client_id." }, { status: 400 });
    }

    const message = await editGroupMessage({
      room_id: roomId,
      message_id: messageId,
      client_id: clientId,
      content,
    });
    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sửa tin thất bại." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const clientId = String(body.client_id ?? "");
    const roomId = body.room_id ? String(body.room_id) : ROOM_ID;
    const action = String(body.action ?? "recall");

    if (!clientId) {
      return NextResponse.json({ error: "Thiếu client_id." }, { status: 400 });
    }

    if (action === "recall") {
      const message = await recallGroupMessage({
        room_id: roomId,
        message_id: messageId,
        client_id: clientId,
      });
      return NextResponse.json({ message });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Thu hồi tin thất bại." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { messageId } = await params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const roomId = searchParams.get("room_id") ?? ROOM_ID;

    if (!clientId) {
      return NextResponse.json({ error: "Thiếu client_id." }, { status: 400 });
    }

    await deleteGroupMessage({
      room_id: roomId,
      message_id: messageId,
      client_id: clientId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xóa tin thất bại." },
      { status: 400 },
    );
  }
}
