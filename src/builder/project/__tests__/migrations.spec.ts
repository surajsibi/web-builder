import { describe, expect, it } from "vitest";

import { CURRENT_PROJECT_SCHEMA_VERSION } from "@/builder/model/project-document";
import { runDocumentMigrations } from "@/builder/project/migrations";

describe("runDocumentMigrations", () => {
  it("should migrate a version 1 document through every step without changing its content", () => {
    const input = {
      schemaVersion: 1,
      pages: { home: { rootIds: ["node-1"] } },
    };
    const original = structuredClone(input);

    const result = runDocumentMigrations(input);

    expect(result).toEqual({
      success: true,
      value: {
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        pages: { home: { rootIds: ["node-1"] } },
      },
      migrated: true,
    });
    expect(input).toEqual(original);
  });

  it("should migrate a version 2 document to version 3 without changing its content", () => {
    const input = {
      schemaVersion: 2,
      pages: { home: { rootIds: ["node-1"] } },
    };
    const original = structuredClone(input);

    const result = runDocumentMigrations(input);

    expect(result).toEqual({
      success: true,
      value: {
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        pages: { home: { rootIds: ["node-1"] } },
      },
      migrated: true,
    });
    expect(input).toEqual(original);
  });

  it("should return a current document unchanged without marking it migrated", () => {
    const input = { schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, value: "kept" };

    const result = runDocumentMigrations(input);

    expect(result).toEqual({ success: true, value: input, migrated: false });
  });

  it("should convert legacy interaction nodes into ordinary Buttons and Containers", () => {
    const input = {
      schemaVersion: 1,
      pages: {
        home: {
          nodes: {
            state: {
              id: "state",
              type: "boolean-state",
              childIds: [],
              props: { defaultValue: false },
            },
            action: {
              id: "action",
              type: "state-action",
              childIds: [],
              props: {
                text: "Toggle menu",
                targetStateNodeId: "state",
                action: "toggle",
                disabled: false,
              },
            },
            conditional: {
              id: "conditional",
              type: "conditional-content",
              childIds: [],
              props: { targetStateNodeId: "state", showWhen: true },
            },
            trigger: {
              id: "trigger",
              type: "drawer-trigger",
              childIds: [],
              props: {
                text: "Open",
                targetDrawerNodeId: "panel",
                disabled: false,
              },
            },
            panel: {
              id: "panel",
              type: "drawer-panel",
              childIds: ["close"],
              props: { targetStateNodeId: "state" },
            },
            close: {
              id: "close",
              type: "drawer-close",
              childIds: [],
              props: { text: "Close", disabled: false },
            },
          },
        },
      },
    };

    const result = runDocumentMigrations(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.migrated).toBe(true);
    expect(result.value).toMatchObject({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      pages: {
        home: {
          nodes: {
            action: {
              type: "button",
              componentVersion: 5,
              props: {
                text: "Toggle menu",
                targetStateNodeId: "state",
                stateAction: "toggle",
              },
            },
            conditional: {
              type: "container",
              stateBinding: {
                stateNodeId: "state",
                on: "show",
                off: "hide",
              },
            },
            trigger: {
              type: "button",
              props: {
                targetStateNodeId: "state",
                stateAction: "turn-on",
              },
            },
            panel: {
              type: "container",
              stateBinding: {
                stateNodeId: "state",
                on: "show",
                off: "hide",
              },
            },
            close: {
              type: "button",
              props: {
                targetStateNodeId: "state",
                stateAction: "turn-off",
              },
            },
          },
        },
      },
    });
    expect(input.schemaVersion).toBe(1);
  });

  it("should migrate disabled legacy controls to inert Buttons", () => {
    const input = {
      schemaVersion: 2,
      pages: {
        home: {
          nodes: {
            state: {
              id: "state",
              type: "boolean-state",
              childIds: [],
              props: { defaultValue: false },
            },
            action: {
              id: "action",
              type: "state-action",
              childIds: [],
              props: {
                text: "Disabled action",
                targetStateNodeId: "state",
                action: "toggle",
                disabled: true,
              },
            },
            trigger: {
              id: "trigger",
              type: "drawer-trigger",
              childIds: [],
              props: {
                text: "Disabled trigger",
                targetDrawerNodeId: "panel",
                disabled: true,
              },
            },
            panel: {
              id: "panel",
              type: "drawer-panel",
              childIds: ["close"],
              props: { targetStateNodeId: "state" },
            },
            close: {
              id: "close",
              type: "drawer-close",
              childIds: [],
              props: { text: "Disabled close", disabled: true },
            },
          },
        },
      },
    };
    const original = structuredClone(input);

    const result = runDocumentMigrations(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value).toMatchObject({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      pages: {
        home: {
          nodes: {
            action: {
              type: "button",
              props: { targetStateNodeId: "", stateAction: "none" },
            },
            trigger: {
              type: "button",
              props: { targetStateNodeId: "", stateAction: "none" },
            },
            close: {
              type: "button",
              props: { targetStateNodeId: "", stateAction: "none" },
            },
          },
        },
      },
    });
    expect(input).toEqual(original);
  });

  it.each([
    [{}, -1, "schemaVersion must be an integer"],
    [{ schemaVersion: "1" }, -1, "schemaVersion must be an integer"],
    [{ schemaVersion: 1.5 }, -1, "schemaVersion must be an integer"],
  ])(
    "should reject a missing or non-integer document version",
    (input, schemaVersion, reason) => {
      expect(runDocumentMigrations(input)).toEqual({
        success: false,
        stage: "document-version",
        schemaVersion,
        reason,
      });
    },
  );

  it("should reject future document versions", () => {
    const futureVersion = CURRENT_PROJECT_SCHEMA_VERSION + 1;

    expect(runDocumentMigrations({ schemaVersion: futureVersion })).toEqual({
      success: false,
      stage: "document-version",
      schemaVersion: futureVersion,
      reason: `Future schema version ${futureVersion} is not supported`,
    });
  });

  it("should reject a legacy document when no migration starts at its version", () => {
    expect(runDocumentMigrations({ schemaVersion: 0 })).toEqual({
      success: false,
      stage: "document-version",
      schemaVersion: 0,
      reason: "No migration starts at schema version 0",
    });
  });
});
