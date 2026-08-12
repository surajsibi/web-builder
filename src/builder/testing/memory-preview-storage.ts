import type { PreviewSnapshotStorage } from "@/builder/preview/preview-snapshot";

export function createMemoryPreviewStorage(): PreviewSnapshotStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
