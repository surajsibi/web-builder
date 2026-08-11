import type { NodeDestination } from "@/builder/commands/types";
import type { NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import {
  canPlaceType,
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";
import type { ParentById } from "@/builder/project/tree";

export type ClickInsertionTarget = {
  destination: NodeDestination;
  label: string;
};

function rootTarget(page: Readonly<PageDocument>): ClickInsertionTarget {
  return {
    destination: { parentId: null, index: page.rootIds.length },
    label: "Page root",
  };
}

export function resolveClickInsertionTarget(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  selectedNodeId: NodeId | null,
  childType: ComponentType,
): ClickInsertionTarget | null {
  if (selectedNodeId === null || !Object.hasOwn(page.nodes, selectedNodeId)) {
    return canPlaceType(null, childType) ? rootTarget(page) : null;
  }

  const selectedNode = page.nodes[selectedNodeId];
  const selectedDefinition = componentRegistry[selectedNode.type];

  if (
    selectedDefinition.children.allowed &&
    canPlaceType(selectedNode.type, childType)
  ) {
    return {
      destination: {
        parentId: selectedNode.id,
        index: selectedNode.childIds.length,
      },
      label: `Inside ${selectedNode.meta.name}`,
    };
  }

  const parentId = parentById[selectedNode.id] ?? null;
  const siblings =
    parentId === null ? page.rootIds : page.nodes[parentId].childIds;
  const parentType = parentId === null ? null : page.nodes[parentId].type;

  if (canPlaceType(parentType, childType)) {
    return {
      destination: {
        parentId,
        index: siblings.indexOf(selectedNode.id) + 1,
      },
      label: `After ${selectedNode.meta.name}`,
    };
  }

  return canPlaceType(null, childType) ? rootTarget(page) : null;
}
