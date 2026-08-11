import type {
  EditorCommand,
  NodeDestination,
} from "@/builder/commands/types";
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
import {
  resolveBlockTemplate,
} from "@/builder/registry/block-registry";
import {
  canPlaceType,
  type ComponentType,
} from "@/builder/registry/component-registry";

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

function invalid(reason: string): DropResolution {
  return { valid: false, reason };
}

function sourceNode(
  page: Readonly<PageDocument>,
  source: EditorDragSource,
) {
  return source.kind === "node" ? page.nodes[source.nodeId] : null;
}

function sourceType(
  page: Readonly<PageDocument>,
  source: EditorDragSource,
): ComponentType | null {
  if (source.kind === "component") return source.componentType;
  if (source.kind === "block") return resolveBlockTemplate(source.blockType).type;
  return page.nodes[source.nodeId]?.type ?? null;
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

function containsNode(
  parentById: Readonly<ParentById>,
  ancestorId: NodeId,
  candidateId: NodeId,
): boolean {
  const visited = new Set<NodeId>();
  let current: NodeId | null = candidateId;

  while (current !== null && !visited.has(current)) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = parentById[current] ?? null;
  }

  return false;
}

export function resolveEditorDropTarget(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  source: EditorDragSource,
  anchor: DropAnchor,
  surface: DragSurface,
): DropResolution {
  const type = sourceType(page, source);
  if (!type) return invalid("Drag source does not belong to the active page");

  const movingNode = sourceNode(page, source);
  if (source.kind === "node" && !movingNode) {
    return invalid("Drag source does not belong to the active page");
  }

  if (movingNode?.meta.locked) return invalid("Locked nodes cannot be moved");

  const destination = destinationForAnchor(page, parentById, source, anchor);
  if (!destination) return invalid("A node cannot be dropped relative to itself");

  const currentParentId = movingNode
    ? parentById[movingNode.id] ?? null
    : null;
  if (
    movingNode &&
    currentParentId !== null &&
    page.nodes[currentParentId].meta.locked
  ) {
    return invalid("The current parent is locked");
  }

  const destinationParent =
    destination.parentId === null ? null : page.nodes[destination.parentId];
  if (destinationParent?.meta.locked) {
    return invalid("The destination parent is locked");
  }

  if (
    movingNode &&
    destination.parentId !== null &&
    containsNode(parentById, movingNode.id, destination.parentId)
  ) {
    return invalid("A node cannot move inside itself or a descendant");
  }

  const parentType = destinationParent?.type ?? null;
  if (!canPlaceType(parentType, type)) {
    return invalid("The destination rejects this component type");
  }

  const destinationSiblings =
    destination.parentId === null
      ? page.rootIds
      : destinationParent?.childIds ?? [];
  const sameParent = movingNode && currentParentId === destination.parentId;
  const destinationLength = destinationSiblings.length - (sameParent ? 1 : 0);
  if (destination.index < 0 || destination.index > destinationLength) {
    return invalid("The destination index is out of range");
  }

  if (movingNode) {
    const currentSiblings =
      currentParentId === null
        ? page.rootIds
        : page.nodes[currentParentId].childIds;
    const currentIndex = currentSiblings.indexOf(movingNode.id);
    if (
      currentParentId === destination.parentId &&
      currentIndex === destination.index
    ) {
      return invalid("The node is already at this destination");
    }
  }

  return {
    valid: true,
    target: {
      surface,
      intent: anchor.intent,
      targetNodeId: anchor.nodeId,
      destination,
      label: destinationLabel(page, anchor),
    },
  };
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
): EditorCommand {
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
