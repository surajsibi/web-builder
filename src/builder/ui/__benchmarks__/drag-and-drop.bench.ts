import { bench, describe } from "vitest";

import type { CommandSnapshot } from "@/builder/commands/execute-command";
import { asNodeId, asPageId } from "@/builder/model/ids";
import type { NodeId } from "@/builder/model/ids";
import { buildProjectParentIndex } from "@/builder/project/tree";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";
import {
  resolveEditorDropTarget,
  type DropAnchor,
  type EditorDragSource,
} from "@/builder/ui/drag-and-drop";

const BENCHMARK_OPTIONS = {
  iterations: 5,
  time: 0,
  warmupIterations: 1,
  warmupTime: 0,
};

function createOverlayFixture(subtreeNodeCount: number): {
  anchors: DropAnchor[];
  snapshot: CommandSnapshot;
  source: EditorDragSource;
} {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  const sourceNodeId = asNodeId("node-drag-source");
  const childIds = Array.from(
    { length: subtreeNodeCount - 1 },
    (_, index) => asNodeId(`node-drag-child-${index}`),
  );
  const siblingIds = Array.from(
    { length: subtreeNodeCount },
    (_, index) => asNodeId(`node-drag-sibling-${index}`),
  );

  page.nodes = Object.create(null);
  page.rootIds = [sourceNodeId, ...siblingIds];
  page.nodes[sourceNodeId] = createTestNode("section", sourceNodeId, childIds);
  for (const childId of childIds) {
    page.nodes[childId] = createTestNode("card", childId);
  }
  for (const siblingId of siblingIds) {
    page.nodes[siblingId] = createTestNode("card", siblingId);
  }

  const tree = buildProjectParentIndex(document);
  if (!tree.success) throw new Error(tree.issue.reason);

  const nodeIds = Object.keys(page.nodes) as NodeId[];
  const anchors = nodeIds.flatMap((nodeId) =>
    (["before", "inside", "after"] as const).map((intent) => ({
      intent,
      nodeId,
    })),
  );

  return {
    anchors,
    snapshot: {
      document,
      parentById: tree.parentById,
      activePageId: page.id,
      selectedNodeId: null,
    },
    source: { kind: "node", nodeId: sourceNodeId, surface: "canvas" },
  };
}

describe("resolveEditorDropTarget overlay pass", () => {
  for (const subtreeNodeCount of [200, 500, 1_000]) {
    const fixture = createOverlayFixture(subtreeNodeCount);

    bench(
      `${fixture.anchors.length} zones with a ${subtreeNodeCount}-node moving subtree`,
      () => {
        for (const anchor of fixture.anchors) {
          resolveEditorDropTarget(
            fixture.snapshot,
            fixture.source,
            anchor,
            "canvas",
          );
        }
      },
      BENCHMARK_OPTIONS,
    );
  }
});
