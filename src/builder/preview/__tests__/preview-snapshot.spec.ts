import { describe, expect, it, vi } from "vitest";

import {
  createPreviewHref,
  createPreviewSnapshotId,
  MAX_PREVIEW_SNAPSHOTS,
  storePreviewSnapshot,
  takePreviewSnapshot,
} from "@/builder/preview/preview-snapshot";
import { createMemoryPreviewStorage } from "@/builder/testing/memory-preview-storage";
import { createTestProject } from "@/builder/testing/project-fixtures";

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
