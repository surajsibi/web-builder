import { describe, expect, it, vi } from "vitest";

import {
  createPreviewHref,
  createPreviewSnapshotId,
  MAX_PREVIEW_SNAPSHOTS,
  storePreviewSnapshot,
  takePreviewSnapshot,
  type PreviewSnapshotStorage,
} from "@/builder/preview/preview-snapshot";
import { createMemoryPreviewStorage } from "@/builder/testing/memory-preview-storage";
import { createTestProject } from "@/builder/testing/project-fixtures";

const PREVIEW_KEY_PREFIX = "web-builder:preview:";

function createControlledPreviewStorage(options?: {
  setItem?: (values: Map<string, string>, key: string, value: string) => void;
}) {
  const values = new Map<string, string>();
  const setItem = vi.fn((key: string, value: string) => {
    if (options?.setItem) {
      options.setItem(values, key, value);
      return;
    }
    values.set(key, value);
  });
  const storage: PreviewSnapshotStorage = {
    getItem: (key) => values.get(key) ?? null,
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem,
  };

  return {
    keys: () => [...values.keys()],
    seed: (key: string, value: string) => values.set(key, value),
    setItem,
    storage,
  };
}

function serializedSnapshot(storedAt: number): string {
  const project = createTestProject();
  return JSON.stringify({
    activePageId: project.homePageId,
    document: project,
    storedAt,
  });
}

describe("preview snapshots", () => {
  it("should create a stable, URL-safe preview destination", () => {
    const project = createTestProject();
    const snapshotId = createPreviewSnapshotId(
      project.projectId,
      project.homePageId,
      7,
    );

    expect(snapshotId).toBe("project-fixture:page-home:7");
    expect(createPreviewHref(snapshotId)).toBe(
      "/preview?snapshot=project-fixture%3Apage-home%3A7",
    );
  });

  it("should keep a stored snapshot reusable across refreshes and tabs", () => {
    const project = createTestProject();
    const snapshotId = "snapshot-once";
    const storage = createMemoryPreviewStorage();

    storePreviewSnapshot(storage, snapshotId, {
      document: project,
      activePageId: project.homePageId,
    });

    expect(takePreviewSnapshot(storage, snapshotId)).toEqual({
      document: project,
      activePageId: project.homePageId,
    });
    expect(takePreviewSnapshot(storage, snapshotId)).toEqual({
      document: project,
      activePageId: project.homePageId,
    });
  });

  it("should garbage-collect old preview snapshots to a fixed bound", () => {
    const project = createTestProject();
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now++);
    const storage = createMemoryPreviewStorage();

    for (let index = 0; index <= MAX_PREVIEW_SNAPSHOTS; index += 1) {
      storePreviewSnapshot(storage, `snapshot-${index}`, {
        document: project,
        activePageId: project.homePageId,
      });
    }

    expect(storage.length).toBe(MAX_PREVIEW_SNAPSHOTS);
    expect(takePreviewSnapshot(storage, "snapshot-0")).toBeNull();
    expect(takePreviewSnapshot(storage, `snapshot-${MAX_PREVIEW_SNAPSHOTS}`)).toEqual({
      document: project,
      activePageId: project.homePageId,
    });
  });

  it("should prune stale builder snapshots before writing at the entry limit", () => {
    const project = createTestProject();
    const controlled = createControlledPreviewStorage({
      setItem: (values, key, value) => {
        const builderEntryCount = [...values.keys()].filter((candidate) =>
          candidate.startsWith(PREVIEW_KEY_PREFIX),
        ).length;
        if (!values.has(key) && builderEntryCount >= MAX_PREVIEW_SNAPSHOTS) {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        values.set(key, value);
      },
    });
    for (let index = 0; index < MAX_PREVIEW_SNAPSHOTS; index += 1) {
      controlled.seed(
        `${PREVIEW_KEY_PREFIX}old-${index}`,
        serializedSnapshot(index),
      );
    }
    controlled.seed("unrelated:setting", "preserve-me");

    storePreviewSnapshot(controlled.storage, "new", {
      document: project,
      activePageId: project.homePageId,
    });

    expect(
      controlled.keys().filter((key) => key.startsWith(PREVIEW_KEY_PREFIX)),
    ).toHaveLength(MAX_PREVIEW_SNAPSHOTS);
    expect(controlled.storage.getItem(`${PREVIEW_KEY_PREFIX}old-0`)).toBeNull();
    expect(controlled.storage.getItem(`${PREVIEW_KEY_PREFIX}new`)).not.toBeNull();
    expect(controlled.storage.getItem("unrelated:setting")).toBe("preserve-me");
  });

  it("should prune builder snapshots and retry one recoverable quota failure", () => {
    const project = createTestProject();
    let failuresRemaining = 1;
    const controlled = createControlledPreviewStorage({
      setItem: (values, key, value) => {
        if (failuresRemaining > 0) {
          failuresRemaining -= 1;
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        values.set(key, value);
      },
    });
    controlled.seed(`${PREVIEW_KEY_PREFIX}old-1`, serializedSnapshot(1));
    controlled.seed(`${PREVIEW_KEY_PREFIX}old-2`, serializedSnapshot(2));
    controlled.seed("unrelated:setting", "preserve-me");

    storePreviewSnapshot(controlled.storage, "new", {
      document: project,
      activePageId: project.homePageId,
    });

    expect(controlled.setItem).toHaveBeenCalledTimes(2);
    expect(
      controlled.keys().filter((key) => key.startsWith(PREVIEW_KEY_PREFIX)),
    ).toEqual([`${PREVIEW_KEY_PREFIX}new`]);
    expect(controlled.storage.getItem("unrelated:setting")).toBe("preserve-me");
  });

  it("should retry an unrecoverable quota failure only once", () => {
    const project = createTestProject();
    const controlled = createControlledPreviewStorage({
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    });
    controlled.seed(`${PREVIEW_KEY_PREFIX}old`, serializedSnapshot(1));
    controlled.seed("unrelated:setting", "preserve-me");

    expect(() =>
      storePreviewSnapshot(controlled.storage, "new", {
        document: project,
        activePageId: project.homePageId,
      }),
    ).toThrow("Quota exceeded");
    expect(controlled.setItem).toHaveBeenCalledTimes(2);
    expect(controlled.storage.getItem("unrelated:setting")).toBe("preserve-me");
  });

  it("should preserve the current reusable snapshot when an overwrite cannot recover", () => {
    const currentKey = `${PREVIEW_KEY_PREFIX}current`;
    const currentValue = serializedSnapshot(2);
    const project = createTestProject();
    const controlled = createControlledPreviewStorage({
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    });
    controlled.seed(`${PREVIEW_KEY_PREFIX}old`, serializedSnapshot(1));
    controlled.seed(currentKey, currentValue);

    expect(() =>
      storePreviewSnapshot(controlled.storage, "current", {
        document: project,
        activePageId: project.homePageId,
      }),
    ).toThrow("Quota exceeded");
    expect(controlled.storage.getItem(currentKey)).toBe(currentValue);
    expect(controlled.storage.getItem(`${PREVIEW_KEY_PREFIX}old`)).toBeNull();
  });

  it("should discard malformed stored data", () => {
    const storage = createMemoryPreviewStorage();
    storage.setItem("web-builder:preview:broken", "not-json");
    storage.setItem("web-builder:preview:incomplete", '{"activePageId":7}');

    expect(takePreviewSnapshot(storage, "broken")).toBeNull();
    expect(storage.getItem("web-builder:preview:broken")).toBeNull();
    expect(takePreviewSnapshot(storage, "incomplete")).toBeNull();
    expect(storage.getItem("web-builder:preview:incomplete")).toBeNull();
  });
});
