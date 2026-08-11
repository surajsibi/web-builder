import { describe, expect, it } from "vitest";

import { asNodeId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { createTestProject } from "@/builder/testing/project-fixtures";
import {
  deriveBreadcrumbs,
  duplicateDestination,
  parentSelectionTarget,
} from "@/builder/ui/tree-navigation";

function preparedTree() {
  const prepared = prepareProjectHydration(createTestProject());
  if (!prepared.success) throw new Error(prepared.error.reason);
  return {
    page: prepared.value.document.pages[prepared.value.document.homePageId],
    parentById: prepared.value.parentById,
  };
}

describe("tree navigation", () => {
  it("should derive the selected path from the page root to the deepest node", () => {
    const { page, parentById } = preparedTree();

    const breadcrumbs = deriveBreadcrumbs(
      page,
      parentById,
      asNodeId("node-text"),
    );

    expect(breadcrumbs.map((item) => item.nodeId)).toEqual([
      "node-section",
      "node-card",
      "node-text",
    ]);
  });

  it("should return each selected parent and stop at the page-root node", () => {
    const { page, parentById } = preparedTree();

    const textParent = parentSelectionTarget(
      page,
      parentById,
      asNodeId("node-text"),
    );
    const sectionParent = parentSelectionTarget(
      page,
      parentById,
      asNodeId("node-section"),
    );

    expect(textParent).toBe("node-card");
    expect(sectionParent).toBeNull();
  });

  it("should place a duplicate immediately after its source in the same parent", () => {
    const { page, parentById } = preparedTree();

    const destination = duplicateDestination(
      page,
      parentById,
      asNodeId("node-card"),
    );

    expect(destination).toEqual({ parentId: "node-section", index: 1 });
  });
});
