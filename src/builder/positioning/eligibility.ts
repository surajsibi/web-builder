import type { NodeId } from "@/builder/model/ids";
import type { BuilderNode } from "@/builder/model/project-document";
import { componentRegistry } from "@/builder/registry/component-registry";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { Viewport } from "@/builder/styles/types";

export type PositioningOperation =
  | "canvas-start"
  | "inspector-set"
  | "inspector-reset";

export type PositioningEligibilityReason =
  | "locked"
  | "capability-missing"
  | "not-rendered"
  | "root-node"
  | "container-capable"
  | "position-mode";

export type PositioningEligibility =
  | { status: "allowed" }
  | {
      status: "restricted" | "unsupported";
      reason: PositioningEligibilityReason;
    };

export type PositioningEligibilityInput = {
  node: Readonly<BuilderNode>;
  parentId: NodeId | null;
  viewport: Viewport;
  operation: PositioningOperation;
  rendered?: boolean;
};

export function evaluatePositioningEligibility(
  input: Readonly<PositioningEligibilityInput>,
): PositioningEligibility {
  const { node, operation } = input;
  const definition = componentRegistry[node.type];

  if (node.meta.locked) {
    return { status: "unsupported", reason: "locked" };
  }
  if (!definition.inspector.styles.includes("positioning")) {
    return { status: "unsupported", reason: "capability-missing" };
  }

  const resolved = resolveResponsiveStyles(node.styles, input.viewport);
  if (
    operation === "canvas-start" &&
    (input.rendered === false || resolved.display === "none")
  ) {
    return { status: "unsupported", reason: "not-rendered" };
  }

  // Reset is deliberately available as a recovery path for imported or
  // previously enabled high-risk nodes. It can remove an offset but cannot
  // create or change one.
  if (operation === "inspector-reset") return { status: "allowed" };

  if (input.parentId === null) {
    return { status: "restricted", reason: "root-node" };
  }
  if (definition.children.allowed) {
    return { status: "restricted", reason: "container-capable" };
  }
  if (
    resolved.position === "absolute" ||
    resolved.position === "fixed" ||
    resolved.position === "sticky"
  ) {
    return { status: "restricted", reason: "position-mode" };
  }

  return { status: "allowed" };
}
