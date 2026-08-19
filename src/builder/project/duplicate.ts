import type { NodeId, PageId } from "@/builder/model/ids";
import { asNodeId, asPageId, asProjectId } from "@/builder/model/ids";
import type {
  BuilderNode,
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";

import { prepareProjectHydration } from "./hydration";
import { createId, type IdGenerator } from "./id-generator";
import { remapNodeReferences, remapStateBinding } from "./node-references";

type DuplicateProjectOptions = {
  name?: string;
  now?: string;
  idGenerator?: IdGenerator;
};

export function duplicateProjectDocument(
  source: Readonly<ProjectDocument>,
  options: DuplicateProjectOptions = {},
): ProjectDocument {
  const idGenerator = options.idGenerator ?? createId;
  const pageIds = new Map<PageId, PageId>();
  const nodeIds = new Map<NodeId, NodeId>();

  for (const pageId of source.pageOrder) {
    pageIds.set(pageId, asPageId(idGenerator("page")));
    for (const nodeId of Object.keys(source.pages[pageId].nodes) as NodeId[]) {
      nodeIds.set(nodeId, asNodeId(idGenerator("node")));
    }
  }

  const nodeIdMap = Object.create(null) as Record<NodeId, NodeId>;
  for (const [sourceNodeId, duplicateNodeId] of nodeIds) {
    nodeIdMap[sourceNodeId] = duplicateNodeId;
  }

  const pages = Object.create(null) as Record<PageId, PageDocument>;
  for (const sourcePageId of source.pageOrder) {
    const sourcePage = source.pages[sourcePageId];
    const pageId = pageIds.get(sourcePageId);
    if (!pageId) throw new Error(`Missing duplicate page ID for ${sourcePageId}`);
    const nodes = Object.create(null) as Record<NodeId, BuilderNode>;

    for (const sourceNode of Object.values(sourcePage.nodes)) {
      const nodeId = nodeIds.get(sourceNode.id);
      if (!nodeId) throw new Error(`Missing duplicate node ID for ${sourceNode.id}`);
      nodes[nodeId] = {
        ...structuredClone(sourceNode),
        id: nodeId,
        childIds: sourceNode.childIds.map((childId) => {
          const nextChildId = nodeIds.get(childId);
          if (!nextChildId) {
            throw new Error(`Missing duplicate child ID for ${childId}`);
          }
          return nextChildId;
        }),
        props: remapNodeReferences(sourceNode, nodeIdMap),
        ...(sourceNode.stateBinding
          ? { stateBinding: remapStateBinding(sourceNode, nodeIdMap) }
          : {}),
      };
    }

    pages[pageId] = {
      ...structuredClone(sourcePage),
      id: pageId,
      rootIds: sourcePage.rootIds.map((rootId) => {
        const nextRootId = nodeIds.get(rootId);
        if (!nextRootId) throw new Error(`Missing duplicate root ID for ${rootId}`);
        return nextRootId;
      }),
      nodes,
    };
  }

  const homePageId = pageIds.get(source.homePageId);
  if (!homePageId) throw new Error("Missing duplicate home page ID");
  const now = options.now ?? new Date().toISOString();
  const candidate: ProjectDocument = {
    schemaVersion: source.schemaVersion,
    projectId: asProjectId(idGenerator("project")),
    name: options.name?.trim() || `${source.name} Copy`,
    pages,
    pageOrder: source.pageOrder.map((pageId) => {
      const nextPageId = pageIds.get(pageId);
      if (!nextPageId) throw new Error(`Missing duplicate page order ID for ${pageId}`);
      return nextPageId;
    }),
    homePageId,
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
  const prepared = prepareProjectHydration(candidate);
  if (!prepared.success) {
    throw new Error(`Duplicated project failed hydration: ${prepared.error.reason}`);
  }
  return prepared.value.document;
}
