import type { NodeDestination } from "@/builder/commands/types";
import type { NodeId } from "@/builder/model/ids";
import type { BlockType } from "@/builder/registry/block-registry";
import type { ComponentType } from "@/builder/registry/component-registry";

export type DragSurface = "canvas" | "layers";

export type EditorDragSource =
  | {
      kind: "component";
      componentType: ComponentType;
    }
  | {
      kind: "block";
      blockType: BlockType;
    }
  | {
      kind: "node";
      nodeId: NodeId;
      surface: DragSurface;
    };

export type DropIntent = "before" | "inside" | "after" | "root";

export type EditorDropTarget = {
  surface: DragSurface;
  intent: DropIntent;
  targetNodeId: NodeId | null;
  destination: NodeDestination;
  label: string;
};

export type DragSession = {
  source: EditorDragSource;
};

export type InteractionAction =
  | {
      kind: "boolean.set";
      stateNodeId: NodeId;
      value: boolean;
    }
  | {
      kind: "boolean.toggle";
      stateNodeId: NodeId;
    };
