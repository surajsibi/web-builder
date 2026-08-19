import { afterEach, describe, expect, it, vi } from "vitest";

import type { CommandResult } from "@/builder/commands/types";
import { asNodeId, asPageId } from "@/builder/model/ids";
import * as blockRegistryModule from "@/builder/registry/block-registry";
import { createBuilderStore } from "@/builder/store/builder-store";
import { createConnectedBlockTemplate } from "@/builder/testing/connected-block-fixtures";
import { createTestProject } from "@/builder/testing/project-fixtures";

const PAGE_ID = asPageId("page-home");

function useConnectedBlockTemplate(): void {
  vi.spyOn(blockRegistryModule, "resolveBlockTemplate").mockImplementation(
    () => createConnectedBlockTemplate(),
  );
}

function createConnectedBlockStore(generatedIds: readonly string[]) {
  const remainingIds = [...generatedIds];

  return createBuilderStore({
    initialDocument: createTestProject(),
    idGenerator: (prefix) => {
      if (prefix !== "node") {
        throw new Error(`Unexpected ID prefix: ${prefix}`);
      }

      const id = remainingIds.shift();
      if (!id) throw new Error("Connected block fixture exhausted its IDs");
      return id;
    },
  });
}

function insertConnectedBlock(
  store: ReturnType<typeof createConnectedBlockStore>,
  index = 1,
) {
  return store.getState().dispatchEditorCommand({
    kind: "block.insert",
    pageId: PAGE_ID,
    blockType: "navbar",
    destination: { parentId: null, index },
  });
}

function expectBlockInsertApplied(result: CommandResult) {
  expect(result.status).toBe("applied");
  if (result.status !== "applied" || !("rootNodeId" in result.value)) {
    throw new Error("Expected an applied block.insert command");
  }

  return result.value;
}

function expectNodeDuplicateApplied(result: CommandResult) {
  expect(result.status).toBe("applied");
  if (result.status !== "applied" || !("sourceNodeId" in result.value)) {
    throw new Error("Expected an applied node.duplicate command");
  }

  return result.value;
}

function getPage(store: ReturnType<typeof createConnectedBlockStore>) {
  const document = store.getState().document;
  if (!document) throw new Error("Expected a hydrated project");
  return document.pages[PAGE_ID];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("connected block state lifecycle", () => {
  it("should keep two production Disclosure insertions fully independent", () => {
    const store = createConnectedBlockStore([
      "node-first-root",
      "node-first-trigger",
      "node-first-panel",
      "node-first-copy",
      "node-first-state",
      "node-second-root",
      "node-second-trigger",
      "node-second-panel",
      "node-second-copy",
      "node-second-state",
    ]);

    const first = expectBlockInsertApplied(
      store.getState().dispatchEditorCommand({
        kind: "block.insert",
        pageId: PAGE_ID,
        blockType: "disclosure",
        destination: { parentId: null, index: 1 },
      }),
    );
    const second = expectBlockInsertApplied(
      store.getState().dispatchEditorCommand({
        kind: "block.insert",
        pageId: PAGE_ID,
        blockType: "disclosure",
        destination: { parentId: null, index: 2 },
      }),
    );

    const page = getPage(store);
    expect(page.nodes[first.nodeIds[1]].props).toMatchObject({
      targetStateNodeId: first.nodeIds[4],
      disclosureContentNodeId: first.nodeIds[2],
    });
    expect(page.nodes[first.nodeIds[2]].stateBinding?.stateNodeId).toBe(
      first.nodeIds[4],
    );
    expect(page.nodes[first.nodeIds[4]].props.defaultValue).toBe(false);
    expect(page.nodes[second.nodeIds[1]].props).toMatchObject({
      targetStateNodeId: second.nodeIds[4],
      disclosureContentNodeId: second.nodeIds[2],
    });
    expect(page.nodes[second.nodeIds[2]].stateBinding?.stateNodeId).toBe(
      second.nodeIds[4],
    );
    expect(new Set([...first.nodeIds, ...second.nodeIds]).size).toBe(10);
  });

  it("should remap both production Disclosure references when its root is duplicated", () => {
    const store = createConnectedBlockStore([
      "node-source-root",
      "node-source-trigger",
      "node-source-panel",
      "node-source-copy",
      "node-source-state",
      "node-copy-root",
      "node-copy-trigger",
      "node-copy-panel",
      "node-copy-copy",
      "node-copy-state",
    ]);
    const inserted = expectBlockInsertApplied(
      store.getState().dispatchEditorCommand({
        kind: "block.insert",
        pageId: PAGE_ID,
        blockType: "disclosure",
        destination: { parentId: null, index: 1 },
      }),
    );

    const duplicated = expectNodeDuplicateApplied(
      store.getState().dispatchEditorCommand({
        kind: "node.duplicate",
        pageId: PAGE_ID,
        nodeId: inserted.rootNodeId,
        destination: { parentId: null, index: 2 },
      }),
    );

    const page = getPage(store);
    const copiedTriggerId = duplicated.idMap[inserted.nodeIds[1]];
    const copiedPanelId = duplicated.idMap[inserted.nodeIds[2]];
    const copiedStateId = duplicated.idMap[inserted.nodeIds[4]];
    expect(page.nodes[copiedTriggerId].props).toMatchObject({
      targetStateNodeId: copiedStateId,
      disclosureContentNodeId: copiedPanelId,
    });
    expect(page.nodes[copiedPanelId].stateBinding?.stateNodeId).toBe(
      copiedStateId,
    );
    expect(page.nodes[inserted.nodeIds[1]].props).toMatchObject({
      targetStateNodeId: inserted.nodeIds[4],
      disclosureContentNodeId: inserted.nodeIds[2],
    });
  });

  it("should keep two inserted connected blocks on disjoint state identities", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-first-root",
      "node-first-trigger",
      "node-first-panel",
      "node-first-state",
      "node-second-root",
      "node-second-trigger",
      "node-second-panel",
      "node-second-state",
    ]);
    const sourceDocument = store.getState().document;
    const sourceSnapshot = structuredClone(sourceDocument);

    const first = expectBlockInsertApplied(insertConnectedBlock(store));
    const second = expectBlockInsertApplied(insertConnectedBlock(store, 2));

    const page = getPage(store);
    expect(first.nodeIds).toEqual([
      "node-first-root",
      "node-first-trigger",
      "node-first-panel",
      "node-first-state",
    ]);
    expect(second.nodeIds).toEqual([
      "node-second-root",
      "node-second-trigger",
      "node-second-panel",
      "node-second-state",
    ]);
    expect(
      page.nodes[asNodeId("node-first-trigger")].props.targetStateNodeId,
    ).toBe("node-first-state");
    expect(
      page.nodes[asNodeId("node-first-panel")].stateBinding?.stateNodeId,
    ).toBe("node-first-state");
    expect(
      page.nodes[asNodeId("node-second-trigger")].props.targetStateNodeId,
    ).toBe("node-second-state");
    expect(
      page.nodes[asNodeId("node-second-panel")].stateBinding?.stateNodeId,
    ).toBe("node-second-state");
    expect(sourceDocument).toEqual(sourceSnapshot);
    expect(store.getState()).toMatchObject({ commitId: 2 });
    expect(store.getState().history.past).toHaveLength(2);
  });

  it("should remap every internal state connection when the inserted root is duplicated", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-source-root",
      "node-source-trigger",
      "node-source-panel",
      "node-source-state",
      "node-copy-root",
      "node-copy-child-1",
      "node-copy-child-2",
      "node-copy-child-3",
    ]);
    const inserted = expectBlockInsertApplied(insertConnectedBlock(store));
    const sourceDocument = store.getState().document;
    const sourceSnapshot = structuredClone(sourceDocument);

    const duplicated = expectNodeDuplicateApplied(
      store.getState().dispatchEditorCommand({
        kind: "node.duplicate",
        pageId: PAGE_ID,
        nodeId: inserted.rootNodeId,
        destination: { parentId: null, index: 2 },
      }),
    );

    const page = getPage(store);
    const copiedTriggerId = duplicated.idMap[asNodeId("node-source-trigger")];
    const copiedPanelId = duplicated.idMap[asNodeId("node-source-panel")];
    const copiedStateId = duplicated.idMap[asNodeId("node-source-state")];
    expect(duplicated.idMap[asNodeId("node-source-root")]).toBe(
      "node-copy-root",
    );
    expect(page.nodes[asNodeId("node-copy-root")].childIds).toEqual([
      copiedTriggerId,
      copiedPanelId,
      copiedStateId,
    ]);
    expect(page.nodes[copiedTriggerId].props.targetStateNodeId).toBe(
      copiedStateId,
    );
    expect(page.nodes[copiedPanelId].stateBinding?.stateNodeId).toBe(
      copiedStateId,
    );
    expect(page.nodes[copiedStateId].type).toBe("boolean-state");
    expect(
      page.nodes[asNodeId("node-source-trigger")].props.targetStateNodeId,
    ).toBe("node-source-state");
    expect(
      page.nodes[asNodeId("node-source-panel")].stateBinding?.stateNodeId,
    ).toBe("node-source-state");
    expect(sourceDocument).toEqual(sourceSnapshot);
  });

  it("should preserve the external state target when only the trigger is duplicated", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-source-root",
      "node-source-trigger",
      "node-source-panel",
      "node-source-state",
      "node-trigger-copy",
    ]);
    const inserted = expectBlockInsertApplied(insertConnectedBlock(store));
    const sourceDocument = store.getState().document;
    const sourceSnapshot = structuredClone(sourceDocument);

    const duplicated = expectNodeDuplicateApplied(
      store.getState().dispatchEditorCommand({
        kind: "node.duplicate",
        pageId: PAGE_ID,
        nodeId: inserted.nodeIds[1],
        destination: { parentId: inserted.rootNodeId, index: 1 },
      }),
    );

    const page = getPage(store);
    expect(duplicated.duplicateNodeId).toBe("node-trigger-copy");
    expect(
      page.nodes[asNodeId("node-trigger-copy")].props.targetStateNodeId,
    ).toBe("node-source-state");
    expect(
      page.nodes[asNodeId("node-source-trigger")].props.targetStateNodeId,
    ).toBe("node-source-state");
    expect(sourceDocument).toEqual(sourceSnapshot);
  });

  it("should preserve the external state target when only the bound panel is duplicated", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-source-root",
      "node-source-trigger",
      "node-source-panel",
      "node-source-state",
      "node-panel-copy",
    ]);
    const inserted = expectBlockInsertApplied(insertConnectedBlock(store));
    const sourceDocument = store.getState().document;
    const sourceSnapshot = structuredClone(sourceDocument);

    const duplicated = expectNodeDuplicateApplied(
      store.getState().dispatchEditorCommand({
        kind: "node.duplicate",
        pageId: PAGE_ID,
        nodeId: inserted.nodeIds[2],
        destination: { parentId: inserted.rootNodeId, index: 2 },
      }),
    );

    const page = getPage(store);
    expect(duplicated.duplicateNodeId).toBe("node-panel-copy");
    expect(
      page.nodes[asNodeId("node-panel-copy")].stateBinding?.stateNodeId,
    ).toBe("node-source-state");
    expect(
      page.nodes[asNodeId("node-source-panel")].stateBinding?.stateNodeId,
    ).toBe("node-source-state");
    expect(sourceDocument).toEqual(sourceSnapshot);
  });

  it("should delete the nested state with the complete connected block root", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-owned-root",
      "node-owned-trigger",
      "node-owned-panel",
      "node-owned-state",
    ]);
    const inserted = expectBlockInsertApplied(insertConnectedBlock(store));
    const sourceDocument = store.getState().document;
    const sourceSnapshot = structuredClone(sourceDocument);

    const removed = store.getState().dispatchEditorCommand({
      kind: "node.remove",
      pageId: PAGE_ID,
      nodeId: inserted.rootNodeId,
    });

    expect(removed.status).toBe("applied");
    if (removed.status !== "applied" || !("removedNodeIds" in removed.value)) {
      throw new Error("Expected an applied node.remove command");
    }
    const page = getPage(store);
    expect(removed.value.removedNodeIds).toHaveLength(inserted.nodeIds.length);
    expect(removed.value.removedNodeIds).toEqual(
      expect.arrayContaining([...inserted.nodeIds]),
    );
    expect(page.rootIds).toEqual(["node-section"]);
    expect(Object.keys(page.nodes)).toEqual([
      "node-section",
      "node-card",
      "node-text",
    ]);
    expect(store.getState().selectedNodeId).toBeNull();
    expect(sourceDocument).toEqual(sourceSnapshot);
  });

  it("should undo and redo one insertion as the same connected subtree", () => {
    useConnectedBlockTemplate();
    const store = createConnectedBlockStore([
      "node-history-root",
      "node-history-trigger",
      "node-history-panel",
      "node-history-state",
    ]);

    const inserted = expectBlockInsertApplied(insertConnectedBlock(store));
    const insertedPage = getPage(store);
    const insertedNodes = inserted.nodeIds.map((nodeId) =>
      structuredClone(insertedPage.nodes[nodeId]),
    );
    expect(store.getState()).toMatchObject({ commitId: 1 });
    expect(store.getState().history.past).toHaveLength(1);

    const undone = store.getState().undo();

    expect(undone).toMatchObject({ status: "applied", commitId: 2 });
    expect(getPage(store).rootIds).toEqual(["node-section"]);
    expect(Object.keys(getPage(store).nodes)).toEqual([
      "node-section",
      "node-card",
      "node-text",
    ]);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(1);

    const redone = store.getState().redo();

    expect(redone).toMatchObject({ status: "applied", commitId: 3 });
    const redonePage = getPage(store);
    expect(inserted.nodeIds.map((nodeId) => redonePage.nodes[nodeId])).toEqual(
      insertedNodes,
    );
    expect(redonePage.rootIds).toEqual(["node-section", inserted.rootNodeId]);
    expect(
      redonePage.nodes[asNodeId("node-history-trigger")].props
        .targetStateNodeId,
    ).toBe("node-history-state");
    expect(
      redonePage.nodes[asNodeId("node-history-panel")].stateBinding
        ?.stateNodeId,
    ).toBe("node-history-state");
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.future).toHaveLength(0);
  });
});
