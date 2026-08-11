import { describe, expect, it } from "vitest";

import {
  createPreviewHref,
  createPreviewSnapshotId,
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

  it("should consume a stored snapshot only once", () => {
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
    expect(takePreviewSnapshot(storage, snapshotId)).toBeNull();
  });

  it("should discard malformed stored data", () => {
    const storage = createMemoryPreviewStorage();
    storage.setItem("web-builder:preview:broken", "not-json");

    expect(takePreviewSnapshot(storage, "broken")).toBeNull();
    expect(storage.getItem("web-builder:preview:broken")).toBeNull();
  });
});
