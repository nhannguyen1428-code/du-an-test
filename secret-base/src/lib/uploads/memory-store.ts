type StoredFile = {
  data: Uint8Array;
  mime_type: string;
  filename: string;
  created_at: string;
};

const globalStore = globalThis as typeof globalThis & {
  __uploadStore?: Map<string, StoredFile>;
};

function store(): Map<string, StoredFile> {
  if (!globalStore.__uploadStore) {
    globalStore.__uploadStore = new Map();
  }
  return globalStore.__uploadStore;
}

export function saveMemoryFile(input: {
  data: Uint8Array;
  mime_type: string;
  filename: string;
}): { id: string; url: string } {
  const id = crypto.randomUUID();
  store().set(id, {
    data: input.data,
    mime_type: input.mime_type,
    filename: input.filename,
    created_at: new Date().toISOString(),
  });
  return { id, url: `/api/uploads/${id}` };
}

export function getMemoryFile(id: string): StoredFile | null {
  return store().get(id) ?? null;
}

export function deleteMemoryFileByUrl(url: string): void {
  const prefix = "/api/uploads/";
  if (!url.startsWith(prefix)) return;
  const id = url.slice(prefix.length);
  store().delete(id);
}
