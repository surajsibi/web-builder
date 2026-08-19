import { bench, describe } from "vitest";

import {
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import { asPageId } from "@/builder/model/ids";
import { buildProjectParentIndex } from "@/builder/project/tree";
import {
  blockRegistry,
  resolveBlockTemplate,
  type BlockType,
} from "@/builder/registry/block-registry";
import type { ResolvedComponentTemplate } from "@/builder/registry/define-block-registry";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";

const OPTIONS = {
  iterations: 50,
  time: 0,
  warmupIterations: 10,
  warmupTime: 0,
};

const FIXTURE_NODE_COUNT = 1_000;

function countTemplateNodes(template: ResolvedComponentTemplate): number {
  return (
    1 +
    template.children.reduce(
      (count, child) => count + countTemplateNodes(child),
      0,
    )
  );
}

function benchmarkBlockTypes(): readonly BlockType[] {
  const blockTypes: BlockType[] = ["commerce-navbar"];

  if (Object.hasOwn(blockRegistry, "disclosure")) {
    blockTypes.push("disclosure" as BlockType);
  }

  return blockTypes;
}

function createSnapshot(): CommandSnapshot {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  page.nodes = Object.create(null);
  page.rootIds = [];

  for (let index = 0; index < FIXTURE_NODE_COUNT; index += 1) {
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

describe("CSB-08 block.insert fixed fixture", () => {
  const snapshot = createSnapshot();

  for (const blockType of benchmarkBlockTypes()) {
    const templateNodeCount = countTemplateNodes(resolveBlockTemplate(blockType));

    bench(
      `block.insert ${blockType} (fixture: ${FIXTURE_NODE_COUNT} nodes, template: ${templateNodeCount} nodes)`,
      () => {
        let generatedId = 0;
        const result = executeEditorCommand(
          snapshot,
          {
            kind: "block.insert",
            pageId: snapshot.activePageId,
            blockType,
            destination: { parentId: null, index: FIXTURE_NODE_COUNT },
          },
          {
            idGenerator: () =>
              `node-benchmark-${blockType}-${generatedId++}`,
          },
        );

        if (result.status !== "applied") {
          throw new Error(`${blockType} insertion benchmark was ${result.status}`);
        }
      },
      OPTIONS,
    );
  }
});
