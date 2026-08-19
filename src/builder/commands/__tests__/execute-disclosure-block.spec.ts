import { describe, expect, it } from "vitest";

import {
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { componentRegistry } from "@/builder/registry/component-registry";
import { createTestProject } from "@/builder/testing/project-fixtures";

function createSnapshot(): CommandSnapshot {
  const prepared = prepareProjectHydration(createTestProject());
  if (!prepared.success) throw new Error(prepared.error.reason);

  return {
    document: prepared.value.document,
    parentById: prepared.value.parentById,
    activePageId: asPageId("page-home"),
    selectedNodeId: null,
  };
}

describe("executeEditorCommand / Disclosure block", () => {
  it("should atomically materialize a strict collapsed Disclosure as ordinary named nodes", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);
    const generatedIds = [
      "node-disclosure",
      "node-disclosure-button",
      "node-disclosure-content",
      "node-disclosure-copy",
      "node-disclosure-state",
    ];

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "block.insert",
        pageId: asPageId("page-home"),
        blockType: "disclosure",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => generatedIds.shift() ?? "node-unexpected" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    const root = page.nodes[asNodeId("node-disclosure")];
    const button = page.nodes[asNodeId("node-disclosure-button")];
    const content = page.nodes[asNodeId("node-disclosure-content")];
    const copy = page.nodes[asNodeId("node-disclosure-copy")];
    const state = page.nodes[asNodeId("node-disclosure-state")];

    expect(result.value).toEqual({
      blockType: "disclosure",
      rootNodeId: "node-disclosure",
      nodeIds: [
        "node-disclosure",
        "node-disclosure-button",
        "node-disclosure-content",
        "node-disclosure-copy",
        "node-disclosure-state",
      ],
      destination: { parentId: null, index: 1 },
    });
    expect(root).toMatchObject({
      type: "container",
      childIds: [
        "node-disclosure-button",
        "node-disclosure-content",
        "node-disclosure-state",
      ],
      meta: { name: "Disclosure" },
    });
    expect(button).toMatchObject({
      type: "button",
      meta: { name: "Show details" },
      props: {
        text: "Show details",
        targetStateNodeId: "node-disclosure-state",
        stateAction: "toggle",
        stateAccessibility: "disclosure",
        disclosureContentNodeId: "node-disclosure-content",
      },
    });
    expect(content).toMatchObject({
      type: "container",
      childIds: ["node-disclosure-copy"],
      meta: { name: "Disclosure content" },
      stateBinding: {
        stateNodeId: "node-disclosure-state",
        on: "show",
        off: "hide",
      },
    });
    expect(copy).toMatchObject({
      type: "text",
      meta: { name: "Disclosure details" },
      props: { text: "Replace this text with your details." },
    });
    expect(state).toMatchObject({
      type: "boolean-state",
      meta: { name: "Disclosure open" },
      props: { defaultValue: false },
    });
    expect(() => componentRegistry.button.propsSchema.parse(button.props)).not.toThrow();
    expect(result.candidate.selectedNodeId).toBe(root.id);
    expect(JSON.stringify(result.candidate.document)).not.toMatch(
      /"(?:key|nameHint|nodeReferences|stateKey)"/,
    );
    expect(result.value).not.toHaveProperty("keyedNodeIds");
    expect(snapshot.document).toEqual(original);
  });
});
