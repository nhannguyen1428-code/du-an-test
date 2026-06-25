export function isBlobStorageUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function getAttachmentDisplayUrl(url: string): string {
  if (url.startsWith("/api/")) return url;
  if (isBlobStorageUrl(url)) {
    return `/api/uploads/serve?url=${encodeURIComponent(url)}`;
  }
  return url;
}
