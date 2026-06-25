import { NextResponse } from "next/server";
import { isBlobStorageUrl } from "@/lib/uploads/attachment-url";
import { isBlobConfigured } from "@/lib/uploads/blob-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "Blob chưa cấu hình." }, { status: 503 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url || !isBlobStorageUrl(url)) {
    return NextResponse.json({ error: "URL không hợp lệ." }, { status: 400 });
  }

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      result.blob.contentType ?? "application/octet-stream",
    );
    headers.set("Cache-Control", "private, max-age=1800");
    if (result.blob.contentDisposition) {
      headers.set("Content-Disposition", result.blob.contentDisposition);
    }

    return new NextResponse(result.stream, { headers });
  } catch {
    return NextResponse.json({ error: "Không tải được file." }, { status: 500 });
  }
}
