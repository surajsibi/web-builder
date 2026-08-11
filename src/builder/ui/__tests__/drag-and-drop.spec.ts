import { describe, expect, it } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { createBuilderStore } from "@/builder/store/builder-store";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";
import {
  commandForEditorDrop,
  resolveEditorDropTarget,
  type EditorDragSource,
} from "@/builder/ui/drag-and-drop";

describe("commandForEditorDrop", () => {
  it("should translate component and node drops into dispatcher commands", () => {
    const target = {
      surface: "canvas" as const,
      intent: "inside" as const,
      targetNodeId: asNodeId("node-section"),
      destination: { parentId: asNodeId("node-section"), index: 1 },
      label: "Move inside Section fixture",
    };

    expect(
      commandForEditorDrop(
        asPageId("page-home"),
        { kind: "component", componentType: "text" },
        target,
      ),
    ).toEqual({
      kind: "node.insert",
      pageId: "page-home",
      componentType: "text",
      destination: target.destination,
    });
    expect(
      commandForEditorDrop(
        asPageId("page-home"),
        { kind: "block", blockType: "navbar" },
        target,
      ),
    ).toEqual({
      kind: "block.insert",
      pageId: "page-home",
      blockType: "navbar",
      destination: target.destination,
    });
    expect(
      commandForEditorDrop(
        asPageId("page-home"),
        { kind: "node", nodeId: asNodeId("node-text"), surface: "layers" },
        target,
      ),
    ).toEqual({
      kind: "node.move",
      pageId: "page-home",
      nodeId: "node-text",
      destination: target.destination,
    });
  });

  it("should commit one history entry for a drop and support undo and redo", () => {
    const store = createBuilderStore({ initialDocument: createTestProject() });
    const before = store.getState();
    const page = before.document?.pages[asPageId("page-home")];
    if (!page) throw new Error("Expected the home page");
    const source: EditorDragSource = {
      kind: "node",
      nodeId: asNodeId("node-text"),
      surface: "canvas",
    };
    const resolution = resolveEditorDropTarget(
      page,
      before.parentById,
      source,
      { intent: "after", nodeId: asNodeId("node-section") },
      "canvas",
    );
    if (!resolution.valid) throw new Error(resolution.reason);

    const result = store
      .getState()
      .dispatchEditorCommand(
        commandForEditorDrop(page.id, source, resolution.target),
      );

    expect(result).toMatchObject({ status: "applied", commitId: 1 });
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().parentById[asNodeId("node-text")]).toBeNull();

    store.getState().undo();
    expect(store.getState().parentById[asNodeId("node-text")]).toBe(
      "node-card",
    );
    store.getState().redo();
    expect(store.getState().parentById[asNodeId("node-text")]).toBeNull();
  });
});

function preparedTree() {
  const prepared = prepareProjectHydration(createTestProject());
  if (!prepared.success) throw new Error(prepared.error.reason);
  return {
    page: prepared.value.document.pages[prepared.value.document.homePageId],
    parentById: prepared.value.parentById,
  };
}

describe("resolveEditorDropTarget", () => {
  it("should append a library component at the page root", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "component", componentType: "button" },
      { intent: "root", nodeId: null },
      "canvas",
    );

    expect(result).toEqual({
      valid: true,
      target: expect.objectContaining({
        destination: { parentId: null, index: 1 },
        intent: "root",
      }),
    });
  });

  it("should resolve a Navbar block drop using its Section root type", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "block", blockType: "navbar" },
      { intent: "root", nodeId: null },
      "canvas",
    );

    expect(result).toEqual({
      valid: true,
      target: expect.objectContaining({
        destination: { parentId: null, index: 1 },
        intent: "root",
      }),
    });
  });

  it("should translate sibling reordering to final-index semantics", () => {
    const { page, parentById } = preparedTree();
    const heading = createTestNode("heading", "node-heading");
    page.nodes[heading.id] = heading;
    page.nodes[asNodeId("node-section")].childIds.push(heading.id);
    parentById[heading.id] = asNodeId("node-section");

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "node", nodeId: asNodeId("node-card"), surface: "layers" },
      { intent: "after", nodeId: heading.id },
      "layers",
    );

    expect(result).toMatchObject({
      valid: true,
      target: { destination: { parentId: "node-section", index: 1 } },
    });
  });

  it("should allow reparenting a node inside an unlocked container", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "node", nodeId: asNodeId("node-text"), surface: "canvas" },
      { intent: "inside", nodeId: asNodeId("node-section") },
      "canvas",
    );

    expect(result).toMatchObject({
      valid: true,
      target: { destination: { parentId: "node-section", index: 1 } },
    });
  });

  it("should allow moving a nested node out beside its parent", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "node", nodeId: asNodeId("node-text"), surface: "canvas" },
      { intent: "after", nodeId: asNodeId("node-section") },
      "canvas",
    );

    expect(result).toMatchObject({
      valid: true,
      target: { destination: { parentId: null, index: 1 } },
    });
  });

  it("should reject moving a node inside one of its descendants", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "node", nodeId: asNodeId("node-section"), surface: "canvas" },
      { intent: "inside", nodeId: asNodeId("node-card") },
      "canvas",
    );

    expect(result).toEqual({
      valid: false,
      reason: "A node cannot move inside itself or a descendant",
    });
  });

  it("should reject a drop that resolves to the current final index", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "node", nodeId: asNodeId("node-section"), surface: "canvas" },
      { intent: "root", nodeId: null },
      "canvas",
    );

    expect(result).toEqual({
      valid: false,
      reason: "The node is already at this destination",
    });
  });

  it.each([
    ["source", "node-text", "node-text"],
    ["current parent", "node-card", "node-text"],
    ["destination parent", "node-section", "node-text"],
  ])(
    "should reject a drag when the %s is locked",
    (_caseName, lockedId, sourceId) => {
      const { page, parentById } = preparedTree();
      page.nodes[asNodeId(lockedId)].meta.locked = true;
      const source: EditorDragSource = {
        kind: "node",
        nodeId: asNodeId(sourceId),
        surface: "layers",
      };

      const result = resolveEditorDropTarget(
        page,
        parentById,
        source,
        { intent: "inside", nodeId: asNodeId("node-section") },
        "layers",
      );

      expect(result.valid).toBe(false);
    },
  );

  it("should reject a destination that cannot accept children", () => {
    const { page, parentById } = preparedTree();

    const result = resolveEditorDropTarget(
      page,
      parentById,
      { kind: "component", componentType: "card" },
      { intent: "inside", nodeId: asNodeId("node-text") },
      "canvas",
    );

    expect(result).toEqual({
      valid: false,
      reason: "The destination rejects this component type",
    });
  });
});
