import { describe, expect, it } from "vitest";

import { asNodeId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { createTestProject } from "@/builder/testing/project-fixtures";
import { resolveClickInsertionTarget } from "@/builder/ui/insertion-target";

function createPreparedFixture() {
  const prepared = prepareProjectHydration(createTestProject());
  if (!prepared.success) throw new Error(prepared.error.reason);

  return {
    page: prepared.value.document.pages[prepared.value.document.homePageId],
    parentById: prepared.value.parentById,
  };
}

describe("resolveClickInsertionTarget", () => {
  it("should append to the page root when no node is selected", () => {
    const fixture = createPreparedFixture();

    const target = resolveClickInsertionTarget(
      fixture.page,
      fixture.parentById,
      null,
      "card",
    );

    expect(target).toEqual({
      destination: { parentId: null, index: 1 },
      label: "Page root",
    });
  });

  it("should append inside a selected compatible container", () => {
    const fixture = createPreparedFixture();

    const target = resolveClickInsertionTarget(
      fixture.page,
      fixture.parentById,
      asNodeId("node-card"),
      "button",
    );

    expect(target).toEqual({
      destination: { parentId: "node-card", index: 1 },
      label: "Inside Card fixture",
    });
  });

  it("should insert after a selected leaf in its current parent", () => {
    const fixture = createPreparedFixture();

    const target = resolveClickInsertionTarget(
      fixture.page,
      fixture.parentById,
      asNodeId("node-text"),
      "heading",
    );

    expect(target).toEqual({
      destination: { parentId: "node-card", index: 1 },
      label: "After Text fixture",
    });
  });
});
