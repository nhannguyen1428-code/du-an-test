export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

/** Vercel giới hạn body request ~4.5MB — upload qua server phải nhỏ hơn mức này. */
export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export async function uploadFileToBlob(
  file: File,
): Promise<{ url: string; pathname: string }> {
  const { put } = await import("@vercel/blob");
  const blob = await put(file.name, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteBlobByUrl(url: string): Promise<void> {
  if (!isBlobConfigured()) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // Best-effort cleanup when messages expire.
  }
}
