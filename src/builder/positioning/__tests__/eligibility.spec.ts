import { describe, expect, it } from "vitest";

import { asNodeId } from "@/builder/model/ids";
import {
  evaluatePositioningEligibility,
  type PositioningEligibilityInput,
} from "@/builder/positioning/eligibility";
import { createTestNode } from "@/builder/testing/project-fixtures";

function createInput(
  overrides: Partial<PositioningEligibilityInput> = {},
): PositioningEligibilityInput {
  return {
    node: createTestNode("text", "node-text"),
    parentId: asNodeId("node-card"),
    viewport: "desktop",
    operation: "inspector-set",
    rendered: true,
    ...overrides,
  };
}

describe("evaluatePositioningEligibility", () => {
  it("should allow an unlocked non-container child with positioning capability", () => {
    expect(evaluatePositioningEligibility(createInput())).toEqual({
      status: "allowed",
    });
  });

  it("should restrict root nodes and container-capable wrappers", () => {
    const root = evaluatePositioningEligibility(
      createInput({ parentId: null }),
    );
    const container = evaluatePositioningEligibility(
      createInput({ node: createTestNode("card", "node-card") }),
    );

    expect(root).toEqual({ status: "restricted", reason: "root-node" });
    expect(container).toEqual({
      status: "restricted",
      reason: "container-capable",
    });
  });

  it.each(["absolute", "fixed", "sticky"] as const)(
    "should restrict a node with resolved %s positioning",
    (position) => {
      const node = createTestNode("text", "node-text");
      node.styles.base.position = position;

      expect(
        evaluatePositioningEligibility(createInput({ node })),
      ).toEqual({ status: "restricted", reason: "position-mode" });
    },
  );

  it("should make locked nodes unsupported before applying category restrictions", () => {
    const node = createTestNode("card", "node-card");
    node.meta.locked = true;

    expect(evaluatePositioningEligibility(createInput({ node }))).toEqual({
      status: "unsupported",
      reason: "locked",
    });
  });

  it("should reject Canvas start for an unrendered node but allow Inspector recovery reset", () => {
    const canvas = evaluatePositioningEligibility(
      createInput({ operation: "canvas-start", rendered: false }),
    );
    const recovery = evaluatePositioningEligibility(
      createInput({
        node: createTestNode("card", "node-card"),
        operation: "inspector-reset",
        rendered: false,
      }),
    );

    expect(canvas).toEqual({
      status: "unsupported",
      reason: "not-rendered",
    });
    expect(recovery).toEqual({ status: "allowed" });
  });
});
