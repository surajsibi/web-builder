import { describe, expect, it } from "vitest";

import { evaluateDisclosureSemantics } from "@/builder/interaction/disclosure-semantics";
import { asNodeId, type NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import {
  createTestNode,
  createTestPage,
} from "@/builder/testing/project-fixtures";

function createDisclosurePage() {
  const button = createTestNode("button", "disclosure-button");
  const content = createTestNode("container", "disclosure-content", [
    "disclosure-copy",
  ]);
  const copy = createTestNode("text", "disclosure-copy");
  const state = createTestNode("boolean-state", "disclosure-state");
  const root = createTestNode("container", "disclosure-root", [
    button.id,
    content.id,
    state.id,
  ]);

  button.props.text = "Show details";
  button.props.targetStateNodeId = state.id;
  button.props.stateAction = "toggle";
  button.props.stateAccessibility = "disclosure";
  button.props.disclosureContentNodeId = content.id;
  content.stateBinding = {
    stateNodeId: state.id,
    on: "show",
    off: "hide",
  };

  return {
    button,
    content,
    copy,
    page: createTestPage(
      "disclosure-page",
      "Disclosure page",
      "/disclosure",
      [root],
      [button, content, copy, state],
    ),
    root,
    state,
  };
}

function runtimeFor(values: Readonly<Record<string, boolean>>) {
  return {
    has: (stateNodeId: NodeId) => Object.hasOwn(values, stateNodeId),
    read: (stateNodeId: NodeId) => values[stateNodeId],
  };
}

function evaluate(
  page: Readonly<PageDocument>,
  buttonNodeId: NodeId,
  value: boolean | "unavailable" = false,
) {
  const values =
    value === "unavailable"
      ? {}
      : { [page.nodes[buttonNodeId].props.targetStateNodeId as string]: value };
  return evaluateDisclosureSemantics({
    page,
    buttonNodeId,
    viewport: "desktop",
    runtime: runtimeFor(values),
  });
}

describe("evaluateDisclosureSemantics", () => {
  it.each([
    [false, false],
    [true, true],
  ])(
    "should derive aria-expanded %s only from a complete relationship",
    (stateValue, expanded) => {
      const { button, page } = createDisclosurePage();

      const result = evaluate(page, button.id, stateValue);

      expect(result).toMatchObject({ status: "valid", expanded });
    },
  );

  it("should reject invalid persisted Button configuration", () => {
    const { button, page } = createDisclosurePage();
    button.props.stateAction = "turn-on";

    const result = evaluate(page, button.id);

    expect(result).toEqual({
      status: "invalid",
      reason: "button-configuration",
    });
  });

  it.each([
    ["missing state", "targetStateNodeId", "missing-state", "state-reference-missing"],
    ["wrong state type", "targetStateNodeId", "disclosure-copy", "state-reference-wrong-type"],
    ["missing content", "disclosureContentNodeId", "missing-content", "content-reference-missing"],
    ["wrong content type", "disclosureContentNodeId", "disclosure-copy", "content-reference-wrong-type"],
  ] as const)(
    "should reject a %s reference",
    (_scenario, field, target, reason) => {
      const { button, page } = createDisclosurePage();
      button.props[field] = target;

      const result = evaluate(page, button.id);

      expect(result).toMatchObject({ status: "invalid", reason });
    },
  );

  it.each([
    ["missing", null, "visibility-binding-missing"],
    [
      "reconnected",
      { stateNodeId: asNodeId("another-state"), on: "show", off: "hide" },
      "visibility-binding-state",
    ],
    [
      "inverted",
      { stateNodeId: asNodeId("disclosure-state"), on: "hide", off: "show" },
      "visibility-binding-mapping",
    ],
  ] as const)("should reject a %s visibility binding", (_scenario, binding, reason) => {
    const { button, content, page } = createDisclosurePage();
    content.stateBinding = binding ?? undefined;

    const result = evaluate(page, button.id);

    expect(result).toMatchObject({ status: "invalid", reason });
  });

  it("should reject content moved outside the shared direct parent", () => {
    const { button, content, page, root } = createDisclosurePage();
    root.childIds = root.childIds.filter((nodeId) => nodeId !== content.id);
    page.rootIds.push(content.id);

    const result = evaluate(page, button.id);

    expect(result).toMatchObject({
      status: "invalid",
      reason: "structural-relationship",
    });
  });

  it("should reject independently hidden content at the active viewport", () => {
    const { button, content, page } = createDisclosurePage();
    content.styles.base.display = "none";

    const result = evaluate(page, button.id);

    expect(result).toMatchObject({
      status: "invalid",
      reason: "independent-presentation",
      relatedNodeId: content.id,
    });
  });

  it("should reject an unavailable live state value", () => {
    const { button, page } = createDisclosurePage();

    const result = evaluate(page, button.id, "unavailable");

    expect(result).toMatchObject({
      status: "invalid",
      reason: "runtime-unavailable",
    });
  });

  it("should report ancestor visibility as runtime-dependent when no runtime is available", () => {
    const { button, page, root } = createDisclosurePage();
    const ancestorState = createTestNode("boolean-state", "ancestor-state");
    ancestorState.props.defaultValue = false;
    root.stateBinding = {
      stateNodeId: ancestorState.id,
      on: "show",
      off: "hide",
    };
    page.nodes[ancestorState.id] = ancestorState;
    page.rootIds.push(ancestorState.id);

    const result = evaluateDisclosureSemantics({
      page,
      buttonNodeId: button.id,
      viewport: "desktop",
      runtime: null,
    });

    expect(result).toMatchObject({
      status: "invalid",
      reason: "ancestor-runtime-unavailable",
      relatedNodeId: root.id,
    });
  });

  it("should reject content hidden by an ancestor state binding at runtime", () => {
    const { button, page, root, state } = createDisclosurePage();
    const ancestorState = createTestNode("boolean-state", "ancestor-state");
    ancestorState.props.defaultValue = false;
    root.stateBinding = {
      stateNodeId: ancestorState.id,
      on: "show",
      off: "hide",
    };
    page.nodes[ancestorState.id] = ancestorState;
    page.rootIds.push(ancestorState.id);

    const result = evaluateDisclosureSemantics({
      page,
      buttonNodeId: button.id,
      viewport: "desktop",
      runtime: runtimeFor({
        [state.id]: false,
        [ancestorState.id]: false,
      }),
    });

    expect(result).toMatchObject({
      status: "invalid",
      reason: "independent-visibility",
      relatedNodeId: root.id,
    });
  });

  it("should evaluate without mutating the page or persisted configuration", () => {
    const { button, page } = createDisclosurePage();
    const original = structuredClone(page);

    evaluate(page, button.id, true);
    evaluate(page, button.id, false);

    expect(page).toEqual(original);
  });
});
