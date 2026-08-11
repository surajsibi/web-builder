import { describe, expect, it } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { createBuilderStore } from "@/builder/store/builder-store";
import { createTestProject } from "@/builder/testing/project-fixtures";

function createStore() {
  let pageCounter = 0;
  let nodeCounter = 0;

  return createBuilderStore({
    initialDocument: createTestProject({ includeAboutPage: true }),
    idGenerator: (prefix) => {
      if (prefix === "page") {
        pageCounter += 1;
        return `page-generated-${pageCounter}`;
      }
      if (prefix === "node") {
        nodeCounter += 1;
        return `node-generated-${nodeCounter}`;
      }
      return "project-generated";
    },
  });
}

describe("createBuilderStore", () => {
  it("should populate an empty store only after successful hydration", () => {
    const store = createBuilderStore();

    expect(store.getState()).toMatchObject({
      document: null,
      activePageId: null,
      hydrated: false,
    });

    const result = store
      .getState()
      .hydrateProject(createTestProject({ includeAboutPage: true }), "page-about");

    expect(result.success).toBe(true);
    expect(store.getState()).toMatchObject({
      activePageId: "page-about",
      selectedNodeId: null,
      dirty: false,
      commitId: 0,
      hydrated: true,
    });
    expect(store.getState().parentById[asNodeId("node-text")]).toBe(
      "node-card",
    );
  });

  it("should leave all live state untouched when hydration fails", () => {
    const store = createStore();
    store.getState().selectNode(asNodeId("node-text"));
    const before = store.getState();
    const beforeDocument = structuredClone(before.document);
    const invalid = { ...createTestProject(), schemaVersion: 999 };

    const result = store.getState().hydrateProject(invalid);
    const after = store.getState();

    expect(result).toMatchObject({
      success: false,
      error: { stage: "document-version" },
    });
    expect(after.document).toEqual(beforeDocument);
    expect(after.parentById).toBe(before.parentById);
    expect(after.activePageId).toBe(before.activePageId);
    expect(after.selectedNodeId).toBe("node-text");
    expect(after.history).toBe(before.history);
    expect(after.commitId).toBe(before.commitId);
    expect(after.dirty).toBe(before.dirty);
  });

  it("should commit an applied command once and ignore a no-op", () => {
    const store = createStore();

    const applied = store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Landing",
    });

    expect(applied).toMatchObject({ status: "applied", commitId: 1 });
    expect(store.getState()).toMatchObject({ dirty: true, commitId: 1 });
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.future).toHaveLength(0);

    const noChange = store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Landing",
    });

    expect(noChange).toEqual({ status: "noop", reason: "value-unchanged" });
    expect(store.getState().commitId).toBe(1);
    expect(store.getState().history.past).toHaveLength(1);
  });

  it("should undo and redo content snapshots without restoring selection", () => {
    const store = createStore();

    const inserted = store.getState().dispatchEditorCommand({
      kind: "node.insert",
      pageId: asPageId("page-home"),
      componentType: "card",
      destination: { parentId: null, index: 1 },
    });
    expect(inserted.status).toBe("applied");
    expect(store.getState().selectedNodeId).toBe("node-generated-1");

    const undo = store.getState().undo();
    expect(undo).toMatchObject({ status: "applied", commitId: 2 });
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-generated-1")
      ],
    ).toBeUndefined();
    expect(store.getState().selectedNodeId).toBeNull();
    expect(store.getState().history.future).toHaveLength(1);

    const redo = store.getState().redo();
    expect(redo).toMatchObject({ status: "applied", commitId: 3 });
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-generated-1")
      ],
    ).toBeDefined();
    expect(store.getState().selectedNodeId).toBeNull();
    expect(store.getState()).toMatchObject({ dirty: true, commitId: 3 });
  });

  it("should commit and undo a complete Navbar block as one history entry", () => {
    const store = createStore();

    const inserted = store.getState().dispatchEditorCommand({
      kind: "block.insert",
      pageId: asPageId("page-home"),
      blockType: "navbar",
      destination: { parentId: null, index: 1 },
    });

    expect(inserted.status).toBe("applied");
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().commitId).toBe(1);
    expect(
      Object.keys(
        store.getState().document?.pages[asPageId("page-home")].nodes ?? {},
      ),
    ).toHaveLength(12);

    const undo = store.getState().undo();

    expect(undo).toMatchObject({ status: "applied", commitId: 2 });
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(1);
    expect(
      Object.keys(
        store.getState().document?.pages[asPageId("page-home")].nodes ?? {},
      ),
    ).toHaveLength(3);
  });

  it("should coalesce adjacent commands with the same history group", () => {
    const store = createStore();
    const originalName =
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].meta.name;

    store.getState().dispatchEditorCommand(
      {
        kind: "node.rename",
        pageId: asPageId("page-home"),
        nodeId: asNodeId("node-text"),
        name: "First edit",
      },
      { historyGroupId: "rename-session" },
    );
    store.getState().dispatchEditorCommand(
      {
        kind: "node.rename",
        pageId: asPageId("page-home"),
        nodeId: asNodeId("node-text"),
        name: "Final edit",
      },
      { historyGroupId: "rename-session" },
    );

    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().commitId).toBe(2);

    store.getState().undo();
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].meta.name,
    ).toBe(originalName);
  });

  it("should clear selection on a page switch without changing history or dirty state", () => {
    const store = createStore();
    store.getState().selectNode(asNodeId("node-text"));
    store.getState().setViewport("tablet");
    store.getState().setDragSession({
      source: {
        kind: "node",
        nodeId: asNodeId("node-text"),
        surface: "canvas",
      },
    });

    const result = store.getState().setActivePage(asPageId("page-about"));

    expect(result).toEqual({ status: "applied" });
    expect(store.getState()).toMatchObject({
      activePageId: "page-about",
      selectedNodeId: null,
      activeViewport: "tablet",
      dirty: false,
      commitId: 0,
      dragSession: null,
      activeDropTarget: null,
    });
    expect(store.getState().history.past).toHaveLength(0);
  });

  it("should manage drag session state without changing project history", () => {
    const store = createStore();
    const before = store.getState();
    const source = {
      kind: "node" as const,
      nodeId: asNodeId("node-card"),
      surface: "layers" as const,
    };
    const target = {
      surface: "canvas" as const,
      intent: "inside" as const,
      targetNodeId: asNodeId("node-section"),
      destination: { parentId: asNodeId("node-section"), index: 1 },
      label: "Move inside Section fixture",
    };

    expect(store.getState().setActiveDropTarget(target)).toMatchObject({
      status: "rejected",
    });
    expect(store.getState().setDragSession({ source })).toEqual({
      status: "applied",
    });
    expect(store.getState().setActiveDropTarget(target)).toEqual({
      status: "applied",
    });
    expect(store.getState()).toMatchObject({
      dragSession: { source },
      activeDropTarget: target,
      dirty: false,
      commitId: 0,
    });

    expect(store.getState().setDragSession(null)).toEqual({ status: "applied" });
    expect(store.getState()).toMatchObject({
      dragSession: null,
      activeDropTarget: null,
    });
    expect(store.getState().document).toBe(before.document);
    expect(store.getState().parentById).toBe(before.parentById);
    expect(store.getState().history).toBe(before.history);
  });

  it("should switch responsive viewport without changing document history or dirty state", () => {
    const store = createStore();
    const document = store.getState().document;

    const applied = store.getState().setViewport("mobile");
    const repeated = store.getState().setViewport("mobile");

    expect(applied).toEqual({ status: "applied" });
    expect(repeated).toEqual({ status: "noop" });
    expect(store.getState()).toMatchObject({
      activeViewport: "mobile",
      dirty: false,
      commitId: 0,
    });
    expect(store.getState().document).toBe(document);
    expect(store.getState().history.past).toHaveLength(0);
  });

  it("should preserve state when a command is rejected", () => {
    const store = createStore();
    const before = store.getState();

    const result = store.getState().dispatchEditorCommand({
      kind: "page.delete",
      pageId: asPageId("page-home"),
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "home-page-protected" },
    });
    expect(store.getState().document).toBe(before.document);
    expect(store.getState().parentById).toBe(before.parentById);
    expect(store.getState().history).toBe(before.history);
    expect(store.getState().commitId).toBe(0);
    expect(store.getState().dirty).toBe(false);
  });

  it("should roll back atomically when command preparation throws", () => {
    const store = createBuilderStore({
      initialDocument: createTestProject(),
      idGenerator: () => {
        throw new Error("ID source unavailable");
      },
    });
    const before = store.getState();

    const result = store.getState().dispatchEditorCommand({
      kind: "node.insert",
      pageId: asPageId("page-home"),
      componentType: "card",
      destination: { parentId: null, index: 1 },
    });

    expect(result).toMatchObject({
      status: "failed",
      errorId: expect.any(String),
      message: "ID source unavailable",
    });
    expect(store.getState().document).toBe(before.document);
    expect(store.getState().parentById).toBe(before.parentById);
    expect(store.getState().history).toBe(before.history);
    expect(store.getState().commitId).toBe(0);
    expect(store.getState().dirty).toBe(false);
  });
});
