"use client";

import { getClientId } from "@/lib/storage";
import { USER_ID_HEADER } from "@/lib/api/request";
import { validateUploadFile } from "@/lib/uploads/validation";
import type { MessageAttachment } from "@/types/attachment";

export async function uploadChatFile(file: File): Promise<MessageAttachment> {
  validateUploadFile(file.type, file.size);

  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    headers: { [USER_ID_HEADER]: getClientId() },
  });
  const data = (await res.json()) as { attachment?: MessageAttachment; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Upload thất bại.");
  if (!data.attachment) throw new Error("Upload thất bại.");
  return data.attachment;
}
