import { CURRENT_PROJECT_SCHEMA_VERSION } from "@/builder/model/project-document";

export type DocumentMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (value: unknown) => unknown;
};

type MutableRecord = Record<string, unknown>;

function asRecord(value: unknown): MutableRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as MutableRecord)
    : null;
}

function stringProp(node: MutableRecord | undefined, key: string): string {
  const props = asRecord(node?.props);
  const value = props?.[key];
  return typeof value === "string" ? value : "";
}

function buttonProps(
  text: string,
  targetStateNodeId: string,
  stateAction: "none" | "turn-on" | "turn-off" | "toggle",
): MutableRecord {
  return {
    text: text.trim() || "Button",
    href: "",
    openInNewTab: false,
    icon: null,
    iconPosition: "start",
    iconAnimation: "none",
    behavior: "button",
    targetStateNodeId,
    stateAction,
  };
}

function migrateLegacyInteractions(value: unknown): unknown {
  const document = structuredClone(value);
  const documentRecord = asRecord(document);
  if (!documentRecord) return document;

  const pages = asRecord(documentRecord.pages);
  if (!pages) {
    documentRecord.schemaVersion = 2;
    return document;
  }

  for (const pageValue of Object.values(pages)) {
    const page = asRecord(pageValue);
    const nodes = asRecord(page?.nodes);
    if (!nodes) continue;

    const nodeById = new Map<string, MutableRecord>();
    const parentById = new Map<string, string>();
    const stateByDrawerPanelId = new Map<string, string>();

    for (const [nodeId, nodeValue] of Object.entries(nodes)) {
      const node = asRecord(nodeValue);
      if (!node) continue;
      nodeById.set(nodeId, node);
      const childIds = Array.isArray(node.childIds) ? node.childIds : [];
      for (const childId of childIds) {
        if (typeof childId === "string") parentById.set(childId, nodeId);
      }
      if (node.type === "drawer-panel") {
        stateByDrawerPanelId.set(
          nodeId,
          stringProp(node, "targetStateNodeId"),
        );
      }
    }

    const drawerStateForDescendant = (nodeId: string): string => {
      const visited = new Set<string>();
      let ancestorId = parentById.get(nodeId);
      while (ancestorId && !visited.has(ancestorId)) {
        visited.add(ancestorId);
        if (stateByDrawerPanelId.has(ancestorId)) {
          return stateByDrawerPanelId.get(ancestorId) ?? "";
        }
        ancestorId = parentById.get(ancestorId);
      }
      return "";
    };

    for (const [nodeId, node] of nodeById) {
      if (node.type === "conditional-content") {
        const targetStateNodeId = stringProp(node, "targetStateNodeId");
        const showWhen = asRecord(node.props)?.showWhen !== false;
        node.type = "container";
        node.componentVersion = 3;
        node.props = { semanticTag: "div" };
        if (targetStateNodeId) {
          node.stateBinding = {
            stateNodeId: targetStateNodeId,
            on: showWhen ? "show" : "hide",
            off: showWhen ? "hide" : "show",
          };
        }
        continue;
      }

      if (node.type === "drawer-panel") {
        const targetStateNodeId = stateByDrawerPanelId.get(nodeId) ?? "";
        node.type = "container";
        node.componentVersion = 3;
        node.props = { semanticTag: "aside" };
        if (targetStateNodeId) {
          node.stateBinding = {
            stateNodeId: targetStateNodeId,
            on: "show",
            off: "hide",
          };
        }
        continue;
      }

      if (node.type === "state-action") {
        const props = asRecord(node.props);
        const targetStateNodeId = stringProp(node, "targetStateNodeId");
        const rawAction = props?.action;
        const action =
          rawAction === "turn-on" ||
          rawAction === "turn-off" ||
          rawAction === "toggle"
            ? rawAction
            : "toggle";
        node.type = "button";
        node.componentVersion = 5;
        node.props = buttonProps(
          typeof props?.text === "string" ? props.text : "Toggle state",
          targetStateNodeId,
          action,
        );
        continue;
      }

      if (node.type === "drawer-trigger") {
        const props = asRecord(node.props);
        const panelNodeId = stringProp(node, "targetDrawerNodeId");
        const targetStateNodeId = stateByDrawerPanelId.get(panelNodeId) ?? "";
        node.type = "button";
        node.componentVersion = 5;
        node.props = buttonProps(
          typeof props?.text === "string" ? props.text : "Open drawer",
          targetStateNodeId,
          "turn-on",
        );
        continue;
      }

      if (node.type === "drawer-close") {
        const props = asRecord(node.props);
        const targetStateNodeId = drawerStateForDescendant(nodeId);
        node.type = "button";
        node.componentVersion = 5;
        node.props = buttonProps(
          typeof props?.text === "string" ? props.text : "Close drawer",
          targetStateNodeId,
          "turn-off",
        );
      }
    }
  }

  documentRecord.schemaVersion = 2;
  return document;
}

export const documentMigrations: readonly DocumentMigration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: migrateLegacyInteractions,
  },
];

export type DocumentMigrationResult =
  | { success: true; value: unknown; migrated: boolean }
  | {
      success: false;
      stage: "document-version" | "document-migration";
      schemaVersion: number;
      reason: string;
    };

function readSchemaVersion(value: unknown): number | null {
  if (typeof value !== "object" || value === null) return null;
  const schemaVersion = Reflect.get(value, "schemaVersion");
  return Number.isInteger(schemaVersion) ? (schemaVersion as number) : null;
}

export function runDocumentMigrations(
  input: unknown,
): DocumentMigrationResult {
  const initialVersion = readSchemaVersion(input);

  if (initialVersion === null) {
    return {
      success: false,
      stage: "document-version",
      schemaVersion: -1,
      reason: "schemaVersion must be an integer",
    };
  }

  if (initialVersion > CURRENT_PROJECT_SCHEMA_VERSION) {
    return {
      success: false,
      stage: "document-version",
      schemaVersion: initialVersion,
      reason: `Future schema version ${initialVersion} is not supported`,
    };
  }

  let value = input;
  let version = initialVersion;
  let migrated = false;

  while (version < CURRENT_PROJECT_SCHEMA_VERSION) {
    const candidates = documentMigrations.filter(
      (migration) => migration.fromVersion === version,
    );

    if (candidates.length !== 1) {
      return {
        success: false,
        stage: "document-version",
        schemaVersion: version,
        reason:
          candidates.length === 0
            ? `No migration starts at schema version ${version}`
            : `Ambiguous migrations start at schema version ${version}`,
      };
    }

    const migration = candidates[0];

    try {
      value = migration.migrate(value);
    } catch (error) {
      return {
        success: false,
        stage: "document-migration",
        schemaVersion: version,
        reason:
          error instanceof Error ? error.message : "Document migration failed",
      };
    }

    const migratedVersion = readSchemaVersion(value);
    if (migratedVersion !== migration.toVersion) {
      return {
        success: false,
        stage: "document-migration",
        schemaVersion: version,
        reason: `Migration ${version} -> ${migration.toVersion} produced schema version ${migratedVersion}`,
      };
    }

    version = migration.toVersion;
    migrated = true;
  }

  return { success: true, value, migrated };
}
