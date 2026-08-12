import { serialize } from "node:v8";

import { bench, describe } from "vitest";

import { asPageId } from "@/builder/model/ids";
import type { HistoryEntry } from "@/builder/store/builder-store";
import {
  createBuilderStore,
  MAX_HISTORY_ENTRIES,
} from "@/builder/store/builder-store";
import { createTestNode, createTestProject } from "@/builder/testing/project-fixtures";

const DOCUMENT_NODE_COUNT = 1_000;
const EDIT_COUNT = 100;

function measureHistoryRetention() {
  const document = createTestProject();
  const page = document.pages[asPageId("page-home")];
  page.nodes = Object.create(null);
  page.rootIds = [];

  for (let index = 0; index < DOCUMENT_NODE_COUNT; index += 1) {
    const node = createTestNode("card", `node-history-${index}`);
    page.nodes[node.id] = node;
    page.rootIds.push(node.id);
  }

  const store = createBuilderStore({ initialDocument: document });
  const projectedUnboundedPast: HistoryEntry[] = [];

  for (let index = 1; index <= EDIT_COUNT; index += 1) {
    const result = store.getState().dispatchEditorCommand({
      kind: "page.rename",
      pageId: page.id,
      name: `History edit ${index}`,
    });
    if (result.status !== "applied") {
      throw new Error(`History measurement command was ${result.status}`);
    }

    const entry = store.getState().history.past.at(-1);
    if (!entry) throw new Error("History measurement did not retain an entry");
    projectedUnboundedPast.push(entry);
  }

  const boundedHistory = store.getState().history;
  const boundedBytes = serialize(boundedHistory).byteLength;
  const projectedUnboundedBytes = serialize({
    past: projectedUnboundedPast,
    future: [],
  }).byteLength;

  return {
    boundedBytes,
    boundedEntries: boundedHistory.past.length,
    editCount: EDIT_COUNT,
    nodeCount: DOCUMENT_NODE_COUNT,
    projectedUnboundedBytes,
    projectedUnboundedEntries: projectedUnboundedPast.length,
    reductionPercent:
      ((projectedUnboundedBytes - boundedBytes) / projectedUnboundedBytes) * 100,
  };
}

const measurement = measureHistoryRetention();
const benchmarkOptions = {
  iterations: 1,
  time: 0,
  warmupIterations: 0,
  warmupTime: 0,
};

describe("builder history retained payload", () => {
  bench(
    `bounded: ${measurement.boundedEntries} entries, ${measurement.boundedBytes} bytes`,
    () => {
      if (measurement.boundedEntries !== MAX_HISTORY_ENTRIES) {
        throw new Error("Bounded history did not retain the configured limit");
      }
    },
    benchmarkOptions,
  );

  bench(
    `uncapped projection: ${measurement.projectedUnboundedEntries} entries, ${measurement.projectedUnboundedBytes} bytes`,
    () => {
      if (measurement.projectedUnboundedEntries !== EDIT_COUNT) {
        throw new Error("Unbounded projection did not capture every edit");
      }
    },
    benchmarkOptions,
  );

  bench(
    `retained payload reduction: ${measurement.reductionPercent.toFixed(1)}%`,
    () => {
      if (measurement.boundedBytes >= measurement.projectedUnboundedBytes) {
        throw new Error("Bounded history did not reduce retained payload");
      }
    },
    benchmarkOptions,
  );
});
