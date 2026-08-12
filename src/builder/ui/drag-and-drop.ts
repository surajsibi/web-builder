import type {
  EditorCommand,
  NodeDestination,
} from "@/builder/commands/types";
import {
  dryRunEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import type {
  DragSurface,
  EditorDragSource,
  EditorDropTarget,
  DropIntent,
} from "@/builder/interaction/types";
import type { NodeId } from "@/builder/model/ids";
import type { PageId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";

export type DropAnchor =
  | { intent: "root"; nodeId: null }
  | { intent: Exclude<DropIntent, "root">; nodeId: NodeId };

export type {
  DragSurface,
  EditorDragSource,
  EditorDropTarget,
  DropIntent,
} from "@/builder/interaction/types";

export type DropResolution =
  | { valid: true; target: EditorDropTarget }
  | { valid: false; reason: string };

type EditorDropCommand = Extract<
  EditorCommand,
  { kind: "node.insert" | "node.move" | "block.insert" }
>;

function invalid(reason: string): DropResolution {
  return { valid: false, reason };
}

function sourceNode(
  page: Readonly<PageDocument>,
  source: EditorDragSource,
) {
  return source.kind === "node" ? page.nodes[source.nodeId] : null;
}

function destinationForAnchor(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  source: EditorDragSource,
  anchor: DropAnchor,
): NodeDestination | null {
  const movingNode = sourceNode(page, source);
  const currentParentId = movingNode ? parentById[movingNode.id] ?? null : null;

  if (anchor.intent === "root") {
    const adjustment =
      movingNode && currentParentId === null ? 1 : 0;
    return { parentId: null, index: page.rootIds.length - adjustment };
  }

  const targetNode = page.nodes[anchor.nodeId];
  if (!targetNode || movingNode?.id === targetNode.id) return null;

  if (anchor.intent === "inside") {
    const adjustment =
      movingNode && currentParentId === targetNode.id ? 1 : 0;
    return {
      parentId: targetNode.id,
      index: targetNode.childIds.length - adjustment,
    };
  }

  const parentId = parentById[targetNode.id] ?? null;
  const siblings =
    parentId === null ? page.rootIds : page.nodes[parentId].childIds;
  const targetIndex = siblings.indexOf(targetNode.id);
  const sourceIndex = movingNode ? siblings.indexOf(movingNode.id) : -1;
  const targetIndexAfterRemoval =
    movingNode && currentParentId === parentId && sourceIndex < targetIndex
      ? targetIndex - 1
      : targetIndex;

  return {
    parentId,
    index:
      anchor.intent === "before"
        ? targetIndexAfterRemoval
        : targetIndexAfterRemoval + 1,
  };
}

function destinationLabel(
  page: Readonly<PageDocument>,
  anchor: DropAnchor,
): string {
  if (anchor.intent === "root") return "Page root";
  const targetName = page.nodes[anchor.nodeId].meta.name;
  if (anchor.intent === "inside") return `Inside ${targetName}`;
  return `${anchor.intent === "before" ? "Before" : "After"} ${targetName}`;
}

export function resolveEditorDropTarget(
  snapshot: CommandSnapshot,
  source: EditorDragSource,
  anchor: DropAnchor,
  surface: DragSurface,
): DropResolution {
  const page = snapshot.document.pages[snapshot.activePageId];
  if (!page) return invalid("The active page is unavailable");
  const destination = destinationForAnchor(
    page,
    snapshot.parentById,
    source,
    anchor,
  );
  if (!destination) return invalid("A node cannot be dropped relative to itself");

  const target: EditorDropTarget = {
    surface,
    intent: anchor.intent,
    targetNodeId: anchor.nodeId,
    destination,
    label: destinationLabel(page, anchor),
  };
  const result = dryRunEditorCommand(
    snapshot,
    commandForEditorDrop(page.id, source, target),
  );

  if (result.status === "valid") return { valid: true, target };
  if (result.status === "noop") {
    return invalid("The node is already at this destination");
  }
  return invalid(result.error.reason);
}

export function dragSourceId(source: EditorDragSource): string {
  if (source.kind === "component") {
    return `drag:component:${source.componentType}`;
  }
  if (source.kind === "block") return `drag:block:${source.blockType}`;
  return `drag:${source.surface}:${source.nodeId}`;
}

export function dropTargetId(target: EditorDropTarget): string {
  return `drop:${target.surface}:${target.intent}:${target.targetNodeId ?? "root"}`;
}

export function commandForEditorDrop(
  pageId: PageId,
  source: EditorDragSource,
  target: EditorDropTarget,
): EditorDropCommand {
  if (source.kind === "component") {
    return {
      kind: "node.insert",
      pageId,
      componentType: source.componentType,
      destination: target.destination,
    };
  }

  if (source.kind === "block") {
    return {
      kind: "block.insert",
      pageId,
      blockType: source.blockType,
      destination: target.destination,
    };
  }

  return {
    kind: "node.move",
    pageId,
    nodeId: source.nodeId,
    destination: target.destination,
  };
}

export function readEditorDragSource(data: unknown): EditorDragSource | null {
  if (!data || typeof data !== "object" || !("editorSource" in data)) {
    return null;
  }
  return (data as { editorSource?: EditorDragSource }).editorSource ?? null;
}

export function readEditorDropTarget(data: unknown): EditorDropTarget | null {
  if (!data || typeof data !== "object" || !("editorTarget" in data)) {
    return null;
  }
  return (data as { editorTarget?: EditorDropTarget }).editorTarget ?? null;
}
