import type { NodeId, PageId } from "@/builder/model/ids";
import type { ProjectDocument } from "@/builder/model/project-document";

export const MAX_PROJECT_NODES = 10_000;
export const MAX_TREE_DEPTH = 100;

export type ParentById = Record<NodeId, NodeId | null>;

export type TreeValidationIssue = {
  pageId?: PageId;
  nodeId?: NodeId;
  reason: string;
};

export type TreeValidationResult =
  | { success: true; parentById: ParentById }
  | { success: false; issue: TreeValidationIssue };

export function buildProjectParentIndex(
  project: Readonly<ProjectDocument>,
): TreeValidationResult {
  const parentById = Object.create(null) as ParentById;
  const globalNodeIds = new Set<NodeId>();
  let totalNodes = 0;

  for (const page of Object.values(project.pages)) {
    const nodeIds = Object.keys(page.nodes) as NodeId[];
    totalNodes += nodeIds.length;

    if (totalNodes > MAX_PROJECT_NODES) {
      return {
        success: false,
        issue: {
          pageId: page.id,
          reason: `Project exceeds the ${MAX_PROJECT_NODES} node limit`,
        },
      };
    }

    for (const nodeId of nodeIds) {
      if (globalNodeIds.has(nodeId)) {
        return {
          success: false,
          issue: {
            pageId: page.id,
            nodeId,
            reason: `Node ID is not project-wide unique: ${nodeId}`,
          },
        };
      }
      globalNodeIds.add(nodeId);
    }

    const positioned = new Set<NodeId>();

    for (const rootId of page.rootIds) {
      if (!Object.hasOwn(page.nodes, rootId)) {
        return {
          success: false,
          issue: {
            pageId: page.id,
            nodeId: rootId,
            reason: `Missing root node: ${rootId}`,
          },
        };
      }
      if (positioned.has(rootId)) {
        return {
          success: false,
          issue: {
            pageId: page.id,
            nodeId: rootId,
            reason: `Duplicate root position: ${rootId}`,
          },
        };
      }
      positioned.add(rootId);
      parentById[rootId] = null;
    }

    for (const node of Object.values(page.nodes)) {
      const directChildren = new Set<NodeId>();

      for (const childId of node.childIds) {
        if (directChildren.has(childId)) {
          return {
            success: false,
            issue: {
              pageId: page.id,
              nodeId: childId,
              reason: `Duplicate child position under ${node.id}: ${childId}`,
            },
          };
        }
        directChildren.add(childId);

        if (!Object.hasOwn(page.nodes, childId)) {
          return {
            success: false,
            issue: {
              pageId: page.id,
              nodeId: childId,
              reason: `Missing child node: ${childId}`,
            },
          };
        }
        if (positioned.has(childId)) {
          return {
            success: false,
            issue: {
              pageId: page.id,
              nodeId: childId,
              reason: `Node has multiple tree positions: ${childId}`,
            },
          };
        }
        positioned.add(childId);
        parentById[childId] = node.id;
      }
    }

    const visited = new Set<NodeId>();
    const visiting = new Set<NodeId>();

    const visit = (nodeId: NodeId, depth: number): TreeValidationIssue | null => {
      if (depth > MAX_TREE_DEPTH) {
        return {
          pageId: page.id,
          nodeId,
          reason: `Tree exceeds the ${MAX_TREE_DEPTH} level depth limit`,
        };
      }
      if (visiting.has(nodeId)) {
        return {
          pageId: page.id,
          nodeId,
          reason: `Tree contains a cycle at node: ${nodeId}`,
        };
      }
      if (visited.has(nodeId)) return null;

      visiting.add(nodeId);
      for (const childId of page.nodes[nodeId].childIds) {
        const issue = visit(childId, depth + 1);
        if (issue) return issue;
      }
      visiting.delete(nodeId);
      visited.add(nodeId);
      return null;
    };

    for (const rootId of page.rootIds) {
      const issue = visit(rootId, 1);
      if (issue) return { success: false, issue };
    }

    if (visited.size !== nodeIds.length || positioned.size !== nodeIds.length) {
      const orphanId = nodeIds.find((nodeId) => !visited.has(nodeId));
      return {
        success: false,
        issue: {
          pageId: page.id,
          nodeId: orphanId,
          reason: `Page contains an orphan or unreachable node: ${orphanId ?? page.id}`,
        },
      };
    }
  }

  return { success: true, parentById };
}

export function collectSubtreeNodeIds(
  project: Readonly<ProjectDocument>,
  pageId: PageId,
  rootId: NodeId,
): NodeId[] {
  const page = project.pages[pageId];
  const collected: NodeId[] = [];
  const pending = [rootId];

  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (!nodeId) continue;
    collected.push(nodeId);
    pending.push(...page.nodes[nodeId].childIds);
  }

  return collected;
}
