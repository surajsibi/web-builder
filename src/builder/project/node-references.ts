import { asNodeId, type NodeId, type PageId } from "@/builder/model/ids";
import type {
  BuilderNode,
  ProjectDocument,
} from "@/builder/model/project-document";
import {
  referencesForComponentType,
  type ComponentType,
} from "@/builder/registry/component-registry";
import type { ComponentNodeReferenceMetadata } from "@/builder/registry/define-component-registry";

export type NodeReferenceResolution =
  | { status: "empty" }
  | { status: "valid"; node: Readonly<BuilderNode> }
  | { status: "missing" }
  | { status: "wrong-type"; node: Readonly<BuilderNode> }
  | { status: "cross-page"; pageId: PageId; node: Readonly<BuilderNode> };

type NodeReferenceMetadata = ComponentNodeReferenceMetadata<
  string,
  ComponentType
>;

function assertPageScopedReference(
  reference: Readonly<NodeReferenceMetadata>,
): void {
  if (reference.scope !== "page") {
    throw new Error(`Unsupported node reference scope: ${reference.scope}`);
  }
}

export function listNodeReferenceCandidates(
  document: Readonly<ProjectDocument>,
  sourcePageId: PageId,
  reference: Readonly<NodeReferenceMetadata>,
): readonly Readonly<BuilderNode>[] {
  assertPageScopedReference(reference);
  const sourcePage = document.pages[sourcePageId];
  if (!sourcePage) return [];

  return Object.values(sourcePage.nodes).filter(
    (candidate) => candidate.type === reference.targetType,
  );
}

export function resolveNodeReference(
  document: Readonly<ProjectDocument>,
  sourcePageId: PageId,
  targetNodeId: string,
  reference: Readonly<NodeReferenceMetadata>,
): NodeReferenceResolution {
  assertPageScopedReference(reference);
  if (targetNodeId === "") return { status: "empty" };

  const nodeId = asNodeId(targetNodeId);
  const sourcePage = document.pages[sourcePageId];
  const localNode = sourcePage?.nodes[nodeId];
  if (localNode) {
    return localNode.type === reference.targetType
      ? { status: "valid", node: localNode }
      : { status: "wrong-type", node: localNode };
  }

  for (const page of Object.values(document.pages)) {
    if (page.id === sourcePageId) continue;
    const node = page.nodes[nodeId];
    if (node) return { status: "cross-page", pageId: page.id, node };
  }

  return { status: "missing" };
}

export function remapNodeReferences(
  node: Readonly<BuilderNode>,
  idMap: Readonly<Record<NodeId, NodeId>>,
): BuilderNode["props"] {
  const props = structuredClone(node.props);
  const references = referencesForComponentType(node.type);

  for (const reference of references) {
    if (reference.onDuplicate !== "remap-if-target-cloned") {
      throw new Error(
        `Unsupported node reference duplication policy: ${reference.onDuplicate}`,
      );
    }
    const target = props[reference.path];
    if (typeof target !== "string") continue;
    const remappedTarget = idMap[asNodeId(target)];
    if (remappedTarget) props[reference.path] = remappedTarget;
  }

  return props;
}
