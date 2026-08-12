import type { PageId, ProjectId } from "@/builder/model/ids";
import type { ProjectDocument } from "@/builder/model/project-document";

const PREVIEW_SNAPSHOT_PREFIX = "web-builder:preview:";
export const MAX_PREVIEW_SNAPSHOTS = 10;

export type PreviewSnapshot = {
  document: ProjectDocument;
  activePageId: PageId;
};

export type PreviewSnapshotWriter = Pick<Storage, "setItem"> &
  Partial<Pick<Storage, "getItem" | "removeItem" | "key" | "length">>;
export type PreviewSnapshotReader = Pick<Storage, "getItem"> &
  Partial<Pick<Storage, "removeItem">>;
export type PreviewSnapshotStorage = PreviewSnapshotWriter &
  PreviewSnapshotReader;

type StoredPreviewSnapshot = {
  document: unknown;
  activePageId: string;
  storedAt?: number;
};

export function createPreviewSnapshotId(
  projectId: ProjectId,
  activePageId: PageId,
  commitId: number,
): string {
  return `${projectId}:${activePageId}:${commitId}`;
}

export function createPreviewHref(snapshotId: string): string {
  return `/preview?snapshot=${encodeURIComponent(snapshotId)}`;
}

function snapshotStorageKey(snapshotId: string): string {
  return PREVIEW_SNAPSHOT_PREFIX + snapshotId;
}

export function storePreviewSnapshot(
  storage: PreviewSnapshotWriter,
  snapshotId: string,
  snapshot: PreviewSnapshot,
): void {
  const currentKey = snapshotStorageKey(snapshotId);
  storage.setItem(
    currentKey,
    JSON.stringify({ ...snapshot, storedAt: Date.now() }),
  );

  if (
    storage.getItem === undefined ||
    storage.removeItem === undefined ||
    storage.key === undefined ||
    storage.length === undefined
  ) {
    return;
  }

  const entries: { key: string; storedAt: number }[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(PREVIEW_SNAPSHOT_PREFIX)) continue;

    let storedAt = 0;
    try {
      const parsed: unknown = JSON.parse(storage.getItem(key) ?? "null");
      if (
        isStoredPreviewSnapshot(parsed) &&
        typeof parsed.storedAt === "number"
      ) {
        storedAt = parsed.storedAt;
      }
    } catch {
      // Malformed preview entries are treated as the oldest candidates.
    }
    entries.push({ key, storedAt });
  }

  entries.sort((left, right) => {
    if (left.key === currentKey) return -1;
    if (right.key === currentKey) return 1;
    return right.storedAt - left.storedAt || right.key.localeCompare(left.key);
  });
  for (const entry of entries.slice(MAX_PREVIEW_SNAPSHOTS)) {
    storage.removeItem(entry.key);
  }
}

function isStoredPreviewSnapshot(value: unknown): value is StoredPreviewSnapshot {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<StoredPreviewSnapshot>;
  return "document" in candidate && typeof candidate.activePageId === "string";
}

export function takePreviewSnapshot(
  storage: PreviewSnapshotReader,
  snapshotId: string,
): StoredPreviewSnapshot | null {
  const key = snapshotStorageKey(snapshotId);
  const serialized = storage.getItem(key);
  if (serialized === null) return null;

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isStoredPreviewSnapshot(parsed)) {
      storage.removeItem?.(key);
      return null;
    }
    return { document: parsed.document, activePageId: parsed.activePageId };
  } catch {
    storage.removeItem?.(key);
    return null;
  }
}
