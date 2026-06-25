import { NextResponse } from "next/server";
import { readMemoryUpload } from "@/lib/uploads/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ fileId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { fileId } = await params;
  const file = readMemoryUpload(fileId);
  if (!file) {
    return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=1800",
    },
  });
}
