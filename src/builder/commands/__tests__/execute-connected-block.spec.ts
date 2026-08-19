import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dryRunEditorCommand,
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import type { EditorCommand } from "@/builder/commands/types";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import * as blockRegistryModule from "@/builder/registry/block-registry";
import {
  createConnectedBlockTemplate,
  type ConnectedBlockTemplateOptions,
} from "@/builder/testing/connected-block-fixtures";
import { createTestProject } from "@/builder/testing/project-fixtures";

type BlockInsertCommand = Extract<EditorCommand, { kind: "block.insert" }>;

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

function useConnectedTemplate(
  options?: ConnectedBlockTemplateOptions,
): void {
  vi.spyOn(blockRegistryModule, "resolveBlockTemplate").mockReturnValue(
    createConnectedBlockTemplate(options),
  );
}

function insertAtPageRoot(): BlockInsertCommand {
  return {
    kind: "block.insert",
    pageId: asPageId("page-home"),
    blockType: "navbar",
    destination: { parentId: null, index: 1 },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeEditorCommand / connected block insertion", () => {
  it("should atomically materialize local references and bindings into ordinary nodes", () => {
    useConnectedTemplate();
    const snapshot = createSnapshot();
    snapshot.document.pages[asPageId("page-home")].nodes[
      asNodeId("node-card")
    ].meta.name = "Disclosure";
    const original = structuredClone(snapshot.document);
    const generatedIds = [
      "node-disclosure",
      "node-disclosure-trigger",
      "node-disclosure-panel",
      "node-disclosure-state",
    ];

    const result = executeEditorCommand(snapshot, insertAtPageRoot(), {
      idGenerator: () => generatedIds.shift() ?? "node-unexpected",
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    const root = page.nodes[asNodeId("node-disclosure")];
    const trigger = page.nodes[asNodeId("node-disclosure-trigger")];
    const panel = page.nodes[asNodeId("node-disclosure-panel")];
    const state = page.nodes[asNodeId("node-disclosure-state")];
    const serializedNodes = JSON.stringify([root, trigger, panel, state]);

    expect(page.rootIds).toEqual(["node-section", "node-disclosure"]);
    expect(root.childIds).toEqual([
      "node-disclosure-trigger",
      "node-disclosure-panel",
      "node-disclosure-state",
    ]);
    expect(trigger.props.targetStateNodeId).toBe("node-disclosure-state");
    expect(panel.stateBinding).toEqual({
      stateNodeId: "node-disclosure-state",
      on: "show",
      off: "hide",
    });
    expect(state.type).toBe("boolean-state");
    expect(result.candidate.selectedNodeId).toBe("node-disclosure");
    expect(result.value).toEqual({
      blockType: "navbar",
      rootNodeId: "node-disclosure",
      nodeIds: [
        "node-disclosure",
        "node-disclosure-trigger",
        "node-disclosure-panel",
        "node-disclosure-state",
      ],
      destination: { parentId: null, index: 1 },
    });
    expect(serializedNodes).not.toContain("local-");
    expect(serializedNodes).not.toContain("nameHint");
    expect(serializedNodes).not.toContain("nodeReferences");
    expect(serializedNodes).not.toContain("stateKey");
    expect(prepareProjectHydration(result.candidate.document).success).toBe(true);
    expect(snapshot.document).toEqual(original);
  });

  it("should uniquify name hints against the page and earlier template nodes", () => {
    useConnectedTemplate({
      rootNameHint: "Section fixture",
      triggerNameHint: "Connected part",
      panelNameHint: "Connected part",
      stateNameHint: "Connected part",
    });
    const snapshot = createSnapshot();
    const generatedIds = [
      "node-connected-root",
      "node-connected-trigger",
      "node-connected-panel",
      "node-connected-state",
    ];

    const result = executeEditorCommand(snapshot, insertAtPageRoot(), {
      idGenerator: () => generatedIds.shift() ?? "node-unexpected",
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    expect([
      page.nodes[asNodeId("node-connected-root")].meta.name,
      page.nodes[asNodeId("node-connected-trigger")].meta.name,
      page.nodes[asNodeId("node-connected-panel")].meta.name,
      page.nodes[asNodeId("node-connected-state")].meta.name,
    ]).toEqual([
      "Section fixture 2",
      "Connected part",
      "Connected part 2",
      "Connected part 3",
    ]);
  });

  it.each([
    {
      name: "a missing page",
      arrange: () => ({
        snapshot: createSnapshot(),
        command: {
          ...insertAtPageRoot(),
          pageId: asPageId("page-missing"),
        },
        code: "page-not-found",
      }),
    },
    {
      name: "a missing destination",
      arrange: () => ({
        snapshot: createSnapshot(),
        command: {
          ...insertAtPageRoot(),
          destination: { parentId: asNodeId("node-missing"), index: 0 },
        },
        code: "destination-not-found",
      }),
    },
    {
      name: "an invalid destination index",
      arrange: () => ({
        snapshot: createSnapshot(),
        command: {
          ...insertAtPageRoot(),
          destination: { parentId: null, index: 99 },
        },
        code: "index-out-of-range",
      }),
    },
    {
      name: "a locked destination",
      arrange: () => {
        const snapshot = createSnapshot();
        snapshot.document.pages[asPageId("page-home")].nodes[
          asNodeId("node-card")
        ].meta.locked = true;
        return {
          snapshot,
          command: {
            ...insertAtPageRoot(),
            destination: { parentId: asNodeId("node-card"), index: 1 },
          },
          code: "locked",
        };
      },
    },
    {
      name: "an incompatible placement",
      arrange: () => ({
        snapshot: createSnapshot(),
        command: {
          ...insertAtPageRoot(),
          destination: { parentId: asNodeId("node-text"), index: 0 },
        },
        code: "placement-rejected",
      }),
    },
  ] as const)(
    "should return the same $name rejection for dry-run and apply",
    ({ arrange }) => {
      const { snapshot, command, code } = arrange();

      const dryRun = dryRunEditorCommand(snapshot, command);
      const apply = executeEditorCommand(snapshot, command);

      expect(dryRun).toEqual(apply);
      expect(dryRun).toMatchObject({
        status: "rejected",
        error: { code },
      });
    },
  );

  it("should return the same relationship-validation rejection for dry-run and apply", () => {
    const snapshot = createSnapshot();
    const command = insertAtPageRoot();
    vi.spyOn(blockRegistryModule, "resolveBlockTemplate").mockImplementation(
      () => {
        throw new Error(
          'Block "navbar" reference "targetStateNodeId" at "root.children[0]" targets missing key "local-state".',
        );
      },
    );

    const dryRun = dryRunEditorCommand(snapshot, command);
    const apply = executeEditorCommand(snapshot, command);

    expect(dryRun).toEqual(apply);
    expect(dryRun).toMatchObject({
      status: "rejected",
      error: {
        code: "block-invalid",
        reason: expect.stringContaining('targets missing key "local-state"'),
      },
    });
  });

  it("should keep generated-ID exhaustion apply-only and leave the source unchanged", () => {
    useConnectedTemplate();
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);
    let generatedCount = 0;

    const dryRun = dryRunEditorCommand(snapshot, insertAtPageRoot());
    const apply = executeEditorCommand(snapshot, insertAtPageRoot(), {
      idGenerator: () => {
        generatedCount += 1;
        return generatedCount === 1 ? "node-reserved-root" : "node-section";
      },
    });

    expect(dryRun).toEqual({ status: "valid" });
    expect(apply).toMatchObject({
      status: "rejected",
      error: { code: "id-collision" },
    });
    expect(snapshot.document).toEqual(original);
  });
});
