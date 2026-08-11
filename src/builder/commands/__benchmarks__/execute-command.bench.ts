import { bench, describe } from "vitest";

import {
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { buildProjectParentIndex } from "@/builder/project/tree";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";

const BENCHMARK_OPTIONS = {
  iterations: 5,
  time: 0,
  warmupIterations: 1,
  warmupTime: 0,
};

function createFlatSnapshot(nodeCount: number): CommandSnapshot {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  page.nodes = Object.create(null);
  page.rootIds = [];

  for (let index = 0; index < nodeCount; index += 1) {
    const node = createTestNode("card", `node-benchmark-${index}`);
    page.nodes[node.id] = node;
    page.rootIds.push(node.id);
  }

  const tree = buildProjectParentIndex(document);
  if (!tree.success) throw new Error(tree.issue.reason);

  return {
    document,
    parentById: tree.parentById,
    activePageId: page.id,
    selectedNodeId: null,
  };
}

function createDuplicableSnapshot(resultNodeCount: number): CommandSnapshot {
  const sourceNodeCount = resultNodeCount / 2;
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  const sourceNodeId = asNodeId("node-benchmark-source");
  const childIds = Array.from(
    { length: sourceNodeCount - 1 },
    (_, index) => asNodeId(`node-benchmark-child-${index}`),
  );

  page.nodes = Object.create(null);
  page.rootIds = [sourceNodeId];
  page.nodes[sourceNodeId] = createTestNode("section", sourceNodeId, childIds);
  for (const childId of childIds) {
    page.nodes[childId] = createTestNode("card", childId);
  }

  const tree = buildProjectParentIndex(document);
  if (!tree.success) throw new Error(tree.issue.reason);

  return {
    document,
    parentById: tree.parentById,
    activePageId: page.id,
    selectedNodeId: null,
  };
}

describe("executeEditorCommand command path", () => {
  for (const nodeCount of [100, 1_000, 10_000]) {
    const snapshot = createFlatSnapshot(nodeCount);
    const nodeId = asNodeId(`node-benchmark-${nodeCount - 1}`);

    bench(
      `rename in a ${nodeCount}-node document`,
      () => {
        const result = executeEditorCommand(snapshot, {
          kind: "node.rename",
          pageId: snapshot.activePageId,
          nodeId,
          name: "Renamed benchmark node",
        });

        if (result.status !== "applied") {
          throw new Error(`Rename benchmark was ${result.status}`);
        }
      },
      BENCHMARK_OPTIONS,
    );
  }

  for (const resultNodeCount of [100, 1_000, 10_000]) {
    const snapshot = createDuplicableSnapshot(resultNodeCount);
    const sourceNodeId = asNodeId("node-benchmark-source");

    bench(
      `duplicate into a ${resultNodeCount}-node document`,
      () => {
        let generatedId = 0;
        const result = executeEditorCommand(
          snapshot,
          {
            kind: "node.duplicate",
            pageId: snapshot.activePageId,
            nodeId: sourceNodeId,
            destination: { parentId: null, index: 1 },
          },
          {
            idGenerator: () => `node-copy-${generatedId++}`,
          },
        );

        if (result.status !== "applied") {
          throw new Error(`Duplicate benchmark was ${result.status}`);
        }
      },
      BENCHMARK_OPTIONS,
    );
  }
});
