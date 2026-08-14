import { describe, expect, it } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import {
  createBuilderStore,
  MAX_HISTORY_ENTRIES,
} from "@/builder/store/builder-store";
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

  it("should undo and redo page duplication and home-page promotion", () => {
    const store = createStore();

    const duplicated = store.getState().dispatchEditorCommand({
      kind: "page.duplicate",
      pageId: asPageId("page-home"),
    });
    expect(duplicated.status).toBe("applied");
    expect(store.getState()).toMatchObject({
      activePageId: "page-generated-1",
      selectedNodeId: null,
      dirty: true,
      commitId: 1,
    });

    const promoted = store.getState().dispatchEditorCommand({
      kind: "page.setHome",
      pageId: asPageId("page-about"),
    });
    expect(promoted.status).toBe("applied");
    expect(store.getState().document).toMatchObject({
      homePageId: "page-about",
      pages: {
        "page-home": { slug: "/home" },
        "page-about": { slug: "/" },
      },
    });

    expect(store.getState().undo().status).toBe("applied");
    expect(store.getState().document).toMatchObject({
      homePageId: "page-home",
      pages: {
        "page-home": { slug: "/" },
        "page-about": { slug: "/about" },
      },
    });

    expect(store.getState().redo().status).toBe("applied");
    expect(store.getState().document?.homePageId).toBe("page-about");

    expect(store.getState().undo().status).toBe("applied");
    expect(store.getState().undo().status).toBe("applied");
    expect(
      store.getState().document?.pages[asPageId("page-generated-1")],
    ).toBeUndefined();

    expect(store.getState().redo().status).toBe("applied");
    expect(
      store.getState().document?.pages[asPageId("page-generated-1")],
    ).toMatchObject({ name: "Home Copy", slug: "/home-copy" });

    expect(store.getState().redo().status).toBe("applied");
    expect(store.getState().document?.homePageId).toBe("page-about");
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

  it("should undo and redo an atomic responsive position offset", () => {
    const store = createStore();

    const applied = store.getState().dispatchEditorCommand({
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "positionOffset" },
          value: {
            x: { value: 24, unit: "px" },
            y: { value: -8, unit: "px" },
          },
        },
      ],
    });

    expect(applied.status).toBe("applied");
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles.tablet?.positionOffset,
    ).toEqual({
      x: { value: 24, unit: "px" },
      y: { value: -8, unit: "px" },
    });

    store.getState().undo();
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles,
    ).not.toHaveProperty("tablet.positionOffset");

    store.getState().redo();
    expect(
      store.getState().document?.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles.tablet?.positionOffset,
    ).toEqual({
      x: { value: 24, unit: "px" },
      y: { value: -8, unit: "px" },
    });
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

  it("should retain only the newest history entries through undo and redo", () => {
    const store = createStore();
    store.getState().selectNode(asNodeId("node-text"));

    for (let index = 1; index <= MAX_HISTORY_ENTRIES + 1; index += 1) {
      const result = store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: asPageId("page-home"),
        name: `Landing ${index}`,
      });
      expect(result.status).toBe("applied");
    }

    expect(store.getState().history.past).toHaveLength(MAX_HISTORY_ENTRIES);

    for (let index = 0; index < MAX_HISTORY_ENTRIES; index += 1) {
      expect(store.getState().undo().status).toBe("applied");
    }

    expect(store.getState().undo()).toEqual({ status: "noop" });
    expect(
      store.getState().document?.pages[asPageId("page-home")].name,
    ).toBe("Landing 1");
    expect(store.getState().selectedNodeId).toBe("node-text");
    expect(store.getState().history.future).toHaveLength(MAX_HISTORY_ENTRIES);

    for (let index = 0; index < MAX_HISTORY_ENTRIES; index += 1) {
      expect(store.getState().redo().status).toBe("applied");
    }

    expect(store.getState().redo()).toEqual({ status: "noop" });
    expect(
      store.getState().document?.pages[asPageId("page-home")].name,
    ).toBe(`Landing ${MAX_HISTORY_ENTRIES + 1}`);
    expect(store.getState().selectedNodeId).toBe("node-text");
    expect(store.getState().history.past).toHaveLength(MAX_HISTORY_ENTRIES);
  });

  it("should coalesce the active history group without evicting another entry", () => {
    const store = createStore();

    for (let index = 1; index < MAX_HISTORY_ENTRIES; index += 1) {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: asPageId("page-home"),
        name: `Landing ${index}`,
      });
    }
    store.getState().dispatchEditorCommand(
      {
        kind: "page.rename",
        pageId: asPageId("page-home"),
        name: "First grouped edit",
      },
      { historyGroupId: "rename-session" },
    );
    store.getState().dispatchEditorCommand(
      {
        kind: "page.rename",
        pageId: asPageId("page-home"),
        name: "Final grouped edit",
      },
      { historyGroupId: "rename-session" },
    );

    expect(store.getState().history.past).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(store.getState().undo().status).toBe("applied");
    expect(
      store.getState().document?.pages[asPageId("page-home")].name,
    ).toBe(`Landing ${MAX_HISTORY_ENTRIES - 1}`);

    for (let index = 1; index < MAX_HISTORY_ENTRIES; index += 1) {
      expect(store.getState().undo().status).toBe("applied");
    }
    expect(
      store.getState().document?.pages[asPageId("page-home")].name,
    ).toBe("Home");
  });

  it("should clear retained redo entries after editing from an undone state", () => {
    const store = createStore();

    for (let index = 1; index <= MAX_HISTORY_ENTRIES + 1; index += 1) {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: asPageId("page-home"),
        name: `Landing ${index}`,
      });
    }
    store.getState().undo();
    store.getState().undo();
    expect(store.getState().history.future).toHaveLength(2);

    const divergent = store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Divergent edit",
    });

    expect(divergent.status).toBe("applied");
    expect(store.getState().history.future).toHaveLength(0);
    expect(store.getState().redo()).toEqual({ status: "noop" });
    expect(
      store.getState().document?.pages[asPageId("page-home")].name,
    ).toBe("Divergent edit");
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

  it("should mark a captured commit saved without entering document history", () => {
    const store = createStore();
    store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Landing",
    });
    const beforeHistory = store.getState().history;
    const projectId = store.getState().document?.projectId;
    if (!projectId) throw new Error("Expected hydrated project ID");

    store.getState().markSaveStarted();
    store.getState().markSaveSucceeded({
      capturedCommitId: 1,
      receipt: {
        projectId,
        revision: 1,
        updatedAt: "2026-08-14T12:00:00.000Z",
      },
    });

    expect(store.getState()).toMatchObject({
      dirty: false,
      persistenceStatus: "saved",
      persistenceMessage: null,
      commitId: 1,
      document: {
        revision: 1,
        updatedAt: "2026-08-14T12:00:00.000Z",
      },
    });
    expect(store.getState().history).toBe(beforeHistory);
  });

  it("should keep newer edits dirty when an earlier save completes", () => {
    const store = createStore();
    store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "First edit",
    });
    store.getState().markSaveStarted();
    store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Newer edit",
    });
    const projectId = store.getState().document?.projectId;
    if (!projectId) throw new Error("Expected hydrated project ID");

    store.getState().markSaveSucceeded({
      capturedCommitId: 1,
      receipt: {
        projectId,
        revision: 1,
        updatedAt: "2026-08-14T12:00:00.000Z",
      },
    });

    expect(store.getState()).toMatchObject({
      dirty: true,
      persistenceStatus: "dirty",
      commitId: 2,
      document: { revision: 1 },
    });
  });

  it("should keep revision conflicts blocked after later editor commands", () => {
    const store = createStore();
    store.getState().markSaveFailed({
      status: "conflict",
      message: "Project changed elsewhere",
    });

    store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Local edit",
    });

    expect(store.getState()).toMatchObject({
      dirty: true,
      persistenceStatus: "conflict",
      persistenceMessage: "Project changed elsewhere",
      commitId: 1,
    });
  });
});
