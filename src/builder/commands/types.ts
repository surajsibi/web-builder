import type { JsonObject, JsonValue } from "@/builder/model/json";
import type { NodeId, PageId } from "@/builder/model/ids";
import type { BooleanStateBinding } from "@/builder/model/state-binding";
import type { ComponentType } from "@/builder/registry/component-registry";
import type { BlockType } from "@/builder/registry/block-registry";
import type {
  FlexConfig,
  GridConfig,
  SpacingValue,
  StyleValues,
  Viewport,
} from "@/builder/styles/types";

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];

export type NodeDestination = {
  parentId: NodeId | null;
  index: number;
};

export type StyleTarget =
  | {
      property: keyof StyleValues;
      field?: never;
    }
  | {
      property: "margin" | "padding";
      field: keyof SpacingValue;
    }
  | {
      property: "grid";
      field: keyof GridConfig;
    }
  | {
      property: "flex";
      field: keyof FlexConfig;
    };

export type StyleChange = {
  target: StyleTarget;
  value: JsonValue;
};

export type PageCommand =
  | {
      kind: "page.create";
      name?: string;
      slug?: string;
    }
  | {
      kind: "page.rename";
      pageId: PageId;
      name: string;
    }
  | {
      kind: "page.delete";
      pageId: PageId;
    };

export type NodeCommand =
  | {
      kind: "node.insert";
      pageId: PageId;
      componentType: ComponentType;
      destination: NodeDestination;
    }
  | {
      kind: "node.remove";
      pageId: PageId;
      nodeId: NodeId;
    }
  | {
      kind: "node.move";
      pageId: PageId;
      nodeId: NodeId;
      destination: NodeDestination;
    }
  | {
      kind: "node.duplicate";
      pageId: PageId;
      nodeId: NodeId;
      destination: NodeDestination;
    }
  | {
      kind: "node.rename";
      pageId: PageId;
      nodeId: NodeId;
      name: string;
    }
  | {
      kind: "node.lock";
      pageId: PageId;
      nodeId: NodeId;
      locked: boolean;
    }
  | {
      kind: "node.hide";
      pageId: PageId;
      nodeId: NodeId;
      hidden: boolean;
      viewport?: Viewport;
    }
  | {
      kind: "node.updateProps";
      pageId: PageId;
      nodeId: NodeId;
      nextProps: JsonObject;
    }
  | {
      kind: "node.updateStyles";
      pageId: PageId;
      nodeId: NodeId;
      viewport: Viewport;
      changes: NonEmptyReadonlyArray<StyleChange>;
    }
  | {
      kind: "node.updateStateBinding";
      pageId: PageId;
      nodeId: NodeId;
      binding: BooleanStateBinding | null;
    }
  | {
      kind: "state.createAndConnect";
      pageId: PageId;
      nodeId: NodeId;
      name: string;
      defaultValue: boolean;
      on: BooleanStateBinding["on"];
      off: BooleanStateBinding["off"];
    };

export type BlockCommand = {
  kind: "block.insert";
  pageId: PageId;
  blockType: BlockType;
  destination: NodeDestination;
};

export type EditorCommand = PageCommand | NodeCommand | BlockCommand;

export type CommandDispatchOptions = {
  historyGroupId?: string;
};

export type CommandNoopReason =
  | "already-at-destination"
  | "value-unchanged"
  | "style-already-reset";

export type CommandValidationError = {
  code:
    | "invalid-input"
    | "page-not-found"
    | "node-not-found"
    | "node-not-in-page"
    | "destination-not-found"
    | "component-type-unknown"
    | "block-type-unknown"
    | "block-invalid"
    | "locked"
    | "cycle"
    | "index-out-of-range"
    | "placement-rejected"
    | "props-invalid"
    | "styles-invalid"
    | "slug-invalid"
    | "slug-conflict"
    | "home-page-protected"
    | "id-collision"
    | "tree-invalid";
  pageId?: PageId;
  nodeId?: NodeId;
  parentId?: NodeId | null;
  path?: readonly (string | number)[];
  reason: string;
};

export type CommandAppliedValue =
  | { pageId: PageId; index: number }
  | { pageId: PageId }
  | { pageId: PageId; removedNodeIds: readonly NodeId[] }
  | { nodeId: NodeId; destination: NodeDestination }
  | {
      nodeId: NodeId;
      previousDestination: NodeDestination;
      destination: NodeDestination;
    }
  | {
      sourceNodeId: NodeId;
      duplicateNodeId: NodeId;
      idMap: Readonly<Record<NodeId, NodeId>>;
      destination: NodeDestination;
    }
  | { nodeId: NodeId; removedNodeIds: readonly NodeId[] }
  | { nodeId: NodeId; stateNodeId: NodeId }
  | {
      blockType: BlockType;
      rootNodeId: NodeId;
      nodeIds: readonly NodeId[];
      destination: NodeDestination;
    }
  | { nodeId: NodeId };

export type CommandResult<Value extends CommandAppliedValue = CommandAppliedValue> =
  | {
      status: "applied";
      commitId: number;
      value: Value;
    }
  | {
      status: "noop";
      reason: CommandNoopReason;
    }
  | {
      status: "rejected";
      error: CommandValidationError;
    }
  | {
      status: "failed";
      errorId: string;
      message: string;
    };
