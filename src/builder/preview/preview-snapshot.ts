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

type CollectablePreviewSnapshotStorage = PreviewSnapshotWriter &
  Required<Pick<Storage, "getItem" | "removeItem" | "key" | "length">>;

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

function canCollectPreviewSnapshots(
  storage: PreviewSnapshotWriter,
): storage is CollectablePreviewSnapshotStorage {
  return (
    storage.getItem !== undefined &&
    storage.removeItem !== undefined &&
    storage.key !== undefined &&
    storage.length !== undefined
  );
}

function collectPreviewEntries(
  storage: CollectablePreviewSnapshotStorage,
  currentKey: string,
): { key: string; storedAt: number }[] {
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

  return entries.sort((left, right) => {
    if (left.key === currentKey) return -1;
    if (right.key === currentKey) return 1;
    return right.storedAt - left.storedAt || right.key.localeCompare(left.key);
  });
}

function prunePreviewSnapshots(
  storage: CollectablePreviewSnapshotStorage,
  currentKey: string,
  retainedEntryCount: number,
): void {
  for (const entry of collectPreviewEntries(storage, currentKey).slice(
    retainedEntryCount,
  )) {
    storage.removeItem(entry.key);
  }
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

export function storePreviewSnapshot(
  storage: PreviewSnapshotWriter,
  snapshotId: string,
  snapshot: PreviewSnapshot,
): void {
  const currentKey = snapshotStorageKey(snapshotId);
  const serialized = JSON.stringify({ ...snapshot, storedAt: Date.now() });

  if (!canCollectPreviewSnapshots(storage)) {
    storage.setItem(currentKey, serialized);
    return;
  }

  const currentEntryExists = storage.getItem(currentKey) !== null;
  prunePreviewSnapshots(
    storage,
    currentKey,
    currentEntryExists ? MAX_PREVIEW_SNAPSHOTS : MAX_PREVIEW_SNAPSHOTS - 1,
  );

  try {
    storage.setItem(currentKey, serialized);
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;

    // Preserve a reusable current snapshot while freeing every stale builder
    // preview entry, then make one bounded recovery attempt.
    prunePreviewSnapshots(storage, currentKey, currentEntryExists ? 1 : 0);
    storage.setItem(currentKey, serialized);
  }

  prunePreviewSnapshots(storage, currentKey, MAX_PREVIEW_SNAPSHOTS);
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
