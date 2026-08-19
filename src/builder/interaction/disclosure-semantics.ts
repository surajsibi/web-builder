import type { BooleanStateRuntime } from "@/builder/interaction/boolean-state-runtime";
import { asNodeId, type NodeId } from "@/builder/model/ids";
import type { JsonObject } from "@/builder/model/json";
import type {
  BuilderNode,
  PageDocument,
} from "@/builder/model/project-document";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { Viewport } from "@/builder/styles/types";

const DISCLOSURE_CONTRACT_FIELDS = [
  "href",
  "behavior",
  "stateAction",
  "targetStateNodeId",
  "stateAccessibility",
  "disclosureContentNodeId",
] as const;

export type DisclosureSemanticsReason =
  | "button-configuration"
  | "state-reference-missing"
  | "state-reference-wrong-type"
  | "content-reference-missing"
  | "content-reference-wrong-type"
  | "visibility-binding-missing"
  | "visibility-binding-state"
  | "visibility-binding-mapping"
  | "structural-relationship"
  | "independent-presentation"
  | "independent-visibility"
  | "ancestor-runtime-unavailable"
  | "runtime-unavailable";

type ResolvedDisclosureRelationship = {
  button: Readonly<BuilderNode>;
  content: Readonly<BuilderNode>;
  contentNodeId: NodeId;
  parentNodeId: NodeId;
  state: Readonly<BuilderNode>;
  stateNodeId: NodeId;
};

export type DisclosureSemanticsEvaluation =
  | { status: "inactive" }
  | {
      status: "invalid";
      reason: DisclosureSemanticsReason;
      relatedNodeId?: NodeId;
      relationship?: ResolvedDisclosureRelationship;
    }
  | {
      status: "valid";
      expanded: boolean;
      relationship: ResolvedDisclosureRelationship;
    };

function buttonConfigurationIsValid(node: Readonly<BuilderNode>): boolean {
  return (
    node.type === "button" &&
    node.props.stateAccessibility === "disclosure" &&
    node.props.href === "" &&
    node.props.behavior === "button" &&
    node.props.stateAction === "toggle" &&
    typeof node.props.targetStateNodeId === "string" &&
    node.props.targetStateNodeId !== "" &&
    typeof node.props.disclosureContentNodeId === "string" &&
    node.props.disclosureContentNodeId !== ""
  );
}

function parentIndexFor(page: Readonly<PageDocument>): Map<NodeId, NodeId | null> {
  const parentById = new Map<NodeId, NodeId | null>();
  for (const rootId of page.rootIds) parentById.set(rootId, null);
  for (const node of Object.values(page.nodes)) {
    for (const childId of node.childIds) {
      if (parentById.has(childId)) {
        parentById.delete(childId);
        continue;
      }
      parentById.set(childId, node.id);
    }
  }
  return parentById;
}

function pathToPageRoot(
  page: Readonly<PageDocument>,
  parentById: ReadonlyMap<NodeId, NodeId | null>,
  nodeId: NodeId,
): readonly NodeId[] | null {
  const path: NodeId[] = [];
  const visited = new Set<NodeId>();
  let current: NodeId | null = nodeId;

  while (current !== null) {
    if (visited.has(current) || !page.nodes[current] || !parentById.has(current)) {
      return null;
    }
    visited.add(current);
    path.push(current);
    current = parentById.get(current) ?? null;
  }

  return page.rootIds.includes(path[path.length - 1]) ? path : null;
}

function resolveRelationship(
  page: Readonly<PageDocument>,
  buttonNodeId: NodeId,
): DisclosureSemanticsEvaluation | ResolvedDisclosureRelationship {
  const button = page.nodes[buttonNodeId];
  if (!button || button.type !== "button") {
    return { status: "invalid", reason: "button-configuration" };
  }
  if (button.props.stateAccessibility !== "disclosure") {
    return { status: "inactive" };
  }
  if (!buttonConfigurationIsValid(button)) {
    return { status: "invalid", reason: "button-configuration" };
  }

  const stateNodeId = asNodeId(button.props.targetStateNodeId as string);
  const state = page.nodes[stateNodeId];
  if (!state) {
    return { status: "invalid", reason: "state-reference-missing" };
  }
  if (state.type !== "boolean-state") {
    return {
      status: "invalid",
      reason: "state-reference-wrong-type",
      relatedNodeId: state.id,
    };
  }

  const contentNodeId = asNodeId(button.props.disclosureContentNodeId as string);
  const content = page.nodes[contentNodeId];
  if (!content) {
    return { status: "invalid", reason: "content-reference-missing" };
  }
  if (content.type !== "container") {
    return {
      status: "invalid",
      reason: "content-reference-wrong-type",
      relatedNodeId: content.id,
    };
  }

  if (!content.stateBinding) {
    return {
      status: "invalid",
      reason: "visibility-binding-missing",
      relatedNodeId: content.id,
    };
  }
  if (content.stateBinding.stateNodeId !== state.id) {
    return {
      status: "invalid",
      reason: "visibility-binding-state",
      relatedNodeId: content.id,
    };
  }
  if (content.stateBinding.on !== "show" || content.stateBinding.off !== "hide") {
    return {
      status: "invalid",
      reason: "visibility-binding-mapping",
      relatedNodeId: content.id,
    };
  }

  const parentById = parentIndexFor(page);
  const parentNodeId = parentById.get(button.id);
  const stateParentNodeId = parentById.get(state.id);
  const contentParentNodeId = parentById.get(content.id);
  if (
    parentNodeId === undefined ||
    parentNodeId === null ||
    stateParentNodeId !== parentNodeId ||
    contentParentNodeId !== parentNodeId ||
    !page.nodes[parentNodeId] ||
    pathToPageRoot(page, parentById, parentNodeId) === null
  ) {
    return {
      status: "invalid",
      reason: "structural-relationship",
      relatedNodeId: content.id,
    };
  }

  return {
    button,
    content,
    contentNodeId,
    parentNodeId,
    state,
    stateNodeId,
  };
}

export function evaluateDisclosureSemantics({
  page,
  buttonNodeId,
  viewport,
  runtime,
}: {
  page: Readonly<PageDocument>;
  buttonNodeId: NodeId;
  viewport: Viewport;
  runtime?: Pick<BooleanStateRuntime, "has" | "read"> | null;
}): DisclosureSemanticsEvaluation {
  const relationship = resolveRelationship(page, buttonNodeId);
  if ("status" in relationship) return relationship;

  const parentById = parentIndexFor(page);
  const contentPath = pathToPageRoot(page, parentById, relationship.content.id);
  if (!contentPath) {
    return {
      status: "invalid",
      reason: "structural-relationship",
      relationship,
    };
  }

  for (const nodeId of contentPath) {
    const candidate = page.nodes[nodeId];
    if (resolveResponsiveStyles(candidate.styles, viewport).display === "none") {
      return {
        status: "invalid",
        reason: "independent-presentation",
        relatedNodeId: candidate.id,
        relationship,
      };
    }
  }

  if (!runtime) {
    const runtimeDependentAncestor = contentPath
      .slice(1)
      .map((nodeId) => page.nodes[nodeId])
      .find((candidate) => candidate.stateBinding);
    if (runtimeDependentAncestor) {
      return {
        status: "invalid",
        reason: "ancestor-runtime-unavailable",
        relatedNodeId: runtimeDependentAncestor.id,
        relationship,
      };
    }
  }

  if (!runtime || !runtime.has(relationship.stateNodeId)) {
    return {
      status: "invalid",
      reason: "runtime-unavailable",
      relatedNodeId: relationship.stateNodeId,
      relationship,
    };
  }
  const stateValue = runtime.read(relationship.stateNodeId);
  if (stateValue === undefined) {
    return {
      status: "invalid",
      reason: "runtime-unavailable",
      relatedNodeId: relationship.stateNodeId,
      relationship,
    };
  }

  for (const nodeId of contentPath.slice(1)) {
    const candidate = page.nodes[nodeId];
    const binding = candidate.stateBinding;
    if (!binding) continue;
    if (!runtime.has(binding.stateNodeId)) {
      return {
        status: "invalid",
        reason: "runtime-unavailable",
        relatedNodeId: candidate.id,
        relationship,
      };
    }
    const value = runtime.read(binding.stateNodeId);
    if (value === undefined) {
      return {
        status: "invalid",
        reason: "runtime-unavailable",
        relatedNodeId: candidate.id,
        relationship,
      };
    }
    const visibility = value ? binding.on : binding.off;
    if (visibility === "hide") {
      return {
        status: "invalid",
        reason: "independent-visibility",
        relatedNodeId: candidate.id,
        relationship,
      };
    }
  }

  return { status: "valid", expanded: stateValue, relationship };
}

function disclosureReferenceTargetsAreValid(
  page: Readonly<PageDocument>,
  props: Readonly<JsonObject>,
): boolean {
  if (!buttonConfigurationIsValid({ type: "button", props } as BuilderNode)) {
    return false;
  }
  const state = page.nodes[asNodeId(props.targetStateNodeId as string)];
  const content = page.nodes[asNodeId(props.disclosureContentNodeId as string)];
  return state?.type === "boolean-state" && content?.type === "container";
}

export function reconcileDisclosureButtonProps(
  page: Readonly<PageDocument>,
  currentProps: Readonly<JsonObject>,
  nextProps: Readonly<JsonObject>,
): JsonObject {
  const reconciled = structuredClone(nextProps) as JsonObject;

  if (reconciled.stateAccessibility === "none") {
    reconciled.disclosureContentNodeId = "";
    return reconciled;
  }
  if (reconciled.stateAccessibility !== "disclosure") return reconciled;

  const contractChanged = DISCLOSURE_CONTRACT_FIELDS.some(
    (field) => currentProps[field] !== reconciled[field],
  );
  if (contractChanged && !disclosureReferenceTargetsAreValid(page, reconciled)) {
    reconciled.stateAccessibility = "none";
    reconciled.disclosureContentNodeId = "";
    if (reconciled.href !== "" || reconciled.behavior !== "button") {
      reconciled.stateAction = "none";
      reconciled.targetStateNodeId = "";
    } else if (reconciled.stateAction === "none") {
      reconciled.targetStateNodeId = "";
    }
  }

  return reconciled;
}
