import { describe, expect, it } from "vitest";

import {
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import type { EditorCommand } from "@/builder/commands/types";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import {
  buildProjectParentIndex,
  MAX_PROJECT_NODES,
  MAX_TREE_DEPTH,
} from "@/builder/project/tree";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";

type EquivalenceCase = {
  command: EditorCommand;
  createSnapshot?: () => CommandSnapshot;
  generatedIds?: string[];
  name: string;
};

function createSnapshot(options?: {
  activePageId?: string;
  includeAboutPage?: boolean;
}): CommandSnapshot {
  const prepared = prepareProjectHydration(
    createTestProject({ includeAboutPage: options?.includeAboutPage }),
  );
  if (!prepared.success) throw new Error(prepared.error.reason);

  return {
    document: prepared.value.document,
    parentById: prepared.value.parentById,
    activePageId: asPageId(options?.activePageId ?? "page-home"),
    selectedNodeId: null,
  };
}

function createFlatSnapshot(nodeCount: number): CommandSnapshot {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  page.nodes = Object.create(null);
  page.rootIds = [];

  for (let index = 0; index < nodeCount; index += 1) {
    const node = createTestNode("card", `node-flat-${index}`);
    page.nodes[node.id] = node;
    page.rootIds.push(node.id);
  }

  return snapshotFromValidDocument(document, page.id);
}

function createDepthLimitSnapshot(): CommandSnapshot {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  const sectionIds = Array.from(
    { length: MAX_TREE_DEPTH },
    (_, index) => asNodeId(`node-depth-${index}`),
  );
  const movableNode = createTestNode("card", "node-movable");

  page.nodes = Object.create(null);
  page.rootIds = [sectionIds[0], movableNode.id];
  for (let index = 0; index < sectionIds.length; index += 1) {
    const childId = sectionIds[index + 1];
    const section = createTestNode(
      "section",
      sectionIds[index],
      childId ? [childId] : [],
    );
    page.nodes[section.id] = section;
  }
  page.nodes[movableNode.id] = movableNode;

  return snapshotFromValidDocument(document, page.id);
}

function snapshotFromValidDocument(
  document: ReturnType<typeof createTestProject>,
  activePageId: ReturnType<typeof asPageId>,
): CommandSnapshot {
  const tree = buildProjectParentIndex(document);
  if (!tree.success) throw new Error(tree.issue.reason);

  return {
    document,
    parentById: tree.parentById,
    activePageId,
    selectedNodeId: null,
  };
}

function executeCase(
  testCase: EquivalenceCase,
  snapshot: CommandSnapshot,
  candidateValidation: "full" | "scoped",
) {
  const generatedIds = [...(testCase.generatedIds ?? [])];

  return executeEditorCommand(snapshot, testCase.command, {
    candidateValidation,
    idGenerator: () => generatedIds.shift() ?? "unused-generated-id",
  });
}

const generatedNavbarIds = [
  "node-navbar",
  "node-navbar-nav",
  "node-navbar-menu",
  "node-navbar-logo",
  "node-navbar-work",
  "node-navbar-about",
  "node-navbar-playground",
  "node-navbar-resource",
  "node-navbar-cta",
];

const equivalenceCases: EquivalenceCase[] = [
  {
    name: "should match full validation when creating a page",
    command: { kind: "page.create", name: "Services" },
    generatedIds: ["page-services"],
  },
  {
    name: "should match full validation when renaming a page",
    command: {
      kind: "page.rename",
      pageId: asPageId("page-home"),
      name: "Landing",
    },
  },
  {
    name: "should match full validation when deleting a page",
    createSnapshot: () =>
      createSnapshot({ includeAboutPage: true, activePageId: "page-about" }),
    command: { kind: "page.delete", pageId: asPageId("page-about") },
  },
  {
    name: "should match full validation when inserting a node",
    command: {
      kind: "node.insert",
      pageId: asPageId("page-home"),
      componentType: "card",
      destination: { parentId: null, index: 1 },
    },
    generatedIds: ["node-created"],
  },
  {
    name: "should match full validation when removing a node",
    command: {
      kind: "node.remove",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
    },
  },
  {
    name: "should match full validation when moving a node",
    command: {
      kind: "node.move",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      destination: { parentId: asNodeId("node-section"), index: 1 },
    },
  },
  {
    name: "should match full validation when duplicating a subtree",
    command: {
      kind: "node.duplicate",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      destination: { parentId: asNodeId("node-section"), index: 1 },
    },
    generatedIds: ["node-card-copy", "node-text-copy"],
  },
  {
    name: "should match full validation when renaming a node",
    command: {
      kind: "node.rename",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      name: "Body copy",
    },
  },
  {
    name: "should match full validation when locking a node",
    command: {
      kind: "node.lock",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      locked: true,
    },
  },
  {
    name: "should match full validation when hiding a node",
    command: {
      kind: "node.hide",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "mobile",
      hidden: true,
    },
  },
  {
    name: "should match full validation when updating props",
    command: {
      kind: "node.updateProps",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      nextProps: { text: "Equivalent copy", semanticTag: "p" },
    },
  },
  {
    name: "should match full validation when updating styles",
    command: {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "fontSize" },
          value: { value: 18, unit: "px" },
        },
      ],
    },
  },
  {
    name: "should match full validation when inserting a block",
    command: {
      kind: "block.insert",
      pageId: asPageId("page-home"),
      blockType: "navbar",
      destination: { parentId: null, index: 1 },
    },
    generatedIds: generatedNavbarIds,
  },
  {
    name: "should match full validation when a node insertion exceeds the project limit",
    createSnapshot: () => createFlatSnapshot(MAX_PROJECT_NODES),
    command: {
      kind: "node.insert",
      pageId: asPageId("page-home"),
      componentType: "card",
      destination: { parentId: null, index: MAX_PROJECT_NODES },
    },
    generatedIds: ["node-over-limit"],
  },
  {
    name: "should match full validation when a move exceeds the tree depth limit",
    createSnapshot: createDepthLimitSnapshot,
    command: {
      kind: "node.move",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-movable"),
      destination: {
        parentId: asNodeId(`node-depth-${MAX_TREE_DEPTH - 1}`),
        index: 0,
      },
    },
  },
  {
    name: "should match full validation when props are invalid",
    command: {
      kind: "node.updateProps",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      nextProps: { text: 42 },
    },
  },
  {
    name: "should match full validation when styles are invalid",
    command: {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "desktop",
      changes: [{ target: { property: "display" }, value: "inline" }],
    },
  },
];

describe("executeEditorCommand candidate validation equivalence", () => {
  it.each(equivalenceCases)("$name", (testCase) => {
    const snapshot = testCase.createSnapshot?.() ?? createSnapshot();

    const scoped = executeCase(testCase, snapshot, "scoped");
    const full = executeCase(testCase, snapshot, "full");

    expect(scoped).toEqual(full);
  });
});
