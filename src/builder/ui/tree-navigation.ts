import type { NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";

export type BreadcrumbItem = {
  nodeId: NodeId;
  name: string;
  type: string;
};

export function deriveBreadcrumbs(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  selectedNodeId: NodeId | null,
): readonly BreadcrumbItem[] {
  if (
    selectedNodeId === null ||
    !Object.hasOwn(page.nodes, selectedNodeId)
  ) {
    return [];
  }

  const path: BreadcrumbItem[] = [];
  const visited = new Set<NodeId>();
  let current: NodeId | null = selectedNodeId;

  while (current !== null && Object.hasOwn(page.nodes, current)) {
    if (visited.has(current)) return [];
    visited.add(current);
    const node = page.nodes[current];
    path.push({ nodeId: node.id, name: node.meta.name, type: node.type });
    current = parentById[current] ?? null;
  }

  return path.reverse();
}

export function parentSelectionTarget(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  selectedNodeId: NodeId | null,
): NodeId | null {
  if (
    selectedNodeId === null ||
    !Object.hasOwn(page.nodes, selectedNodeId)
  ) {
    return null;
  }

  return parentById[selectedNodeId] ?? null;
}

export function duplicateDestination(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  nodeId: NodeId,
) {
  const parentId = parentById[nodeId] ?? null;
  const siblings =
    parentId === null ? page.rootIds : page.nodes[parentId].childIds;

  return {
    parentId,
    index: siblings.indexOf(nodeId) + 1,
  };
}
