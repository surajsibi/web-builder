import type { PageId, ProjectId } from "@/builder/model/ids";
import type { ProjectDocument } from "@/builder/model/project-document";

const PREVIEW_SNAPSHOT_PREFIX = "web-builder:preview:";

export type PreviewSnapshot = {
  document: ProjectDocument;
  activePageId: PageId;
};

export type PreviewSnapshotWriter = Pick<Storage, "setItem">;
export type PreviewSnapshotReader = Pick<Storage, "getItem" | "removeItem">;
export type PreviewSnapshotStorage = PreviewSnapshotWriter &
  PreviewSnapshotReader;

type StoredPreviewSnapshot = {
  document: unknown;
  activePageId: string;
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
  storage.setItem(snapshotStorageKey(snapshotId), JSON.stringify(snapshot));
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
    return isStoredPreviewSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  } finally {
    storage.removeItem(key);
  }
}
