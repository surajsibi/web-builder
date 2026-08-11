import { afterEach, describe, expect, it } from "vitest";

import {
  createPreviewHref,
  createPreviewSnapshotId,
  storePreviewSnapshot,
  takePreviewSnapshot,
} from "@/builder/preview/preview-snapshot";
import { createTestProject } from "@/builder/testing/project-fixtures";

afterEach(() => window.localStorage.clear());

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

    storePreviewSnapshot(window.localStorage, snapshotId, {
      document: project,
      activePageId: project.homePageId,
    });

    expect(takePreviewSnapshot(window.localStorage, snapshotId)).toEqual({
      document: project,
      activePageId: project.homePageId,
    });
    expect(takePreviewSnapshot(window.localStorage, snapshotId)).toBeNull();
  });

  it("should discard malformed stored data", () => {
    window.localStorage.setItem("web-builder:preview:broken", "not-json");

    expect(takePreviewSnapshot(window.localStorage, "broken")).toBeNull();
    expect(window.localStorage.getItem("web-builder:preview:broken")).toBeNull();
  });
});
