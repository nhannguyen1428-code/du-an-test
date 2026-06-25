import { NextResponse } from "next/server";
import {
  isBlobConfigured,
  saveMultipartUpload,
  SERVER_UPLOAD_MAX_BYTES,
} from "@/lib/uploads/service";
import { ATTACHMENT_MAX_BYTES } from "@/types/attachment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
    }
    const attachment = await saveMultipartUpload(file);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload thất bại." },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    blob: isBlobConfigured(),
    maxBytes: ATTACHMENT_MAX_BYTES,
    serverMaxBytes: isBlobConfigured()
      ? SERVER_UPLOAD_MAX_BYTES
      : ATTACHMENT_MAX_BYTES.document,
  });
}
