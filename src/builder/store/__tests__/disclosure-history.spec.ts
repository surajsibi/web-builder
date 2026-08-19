import { describe, expect, it } from "vitest";

import { asNodeId } from "@/builder/model/ids";
import { createBuilderStore } from "@/builder/store/builder-store";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

function createDisclosureStore() {
  const project = createTestProject();
  const page = project.pages[project.homePageId];
  const button = createTestNode("button", "history-disclosure-button");
  const content = createTestNode("container", "history-disclosure-content");
  const state = createTestNode("boolean-state", "history-disclosure-state");
  const root = createTestNode("container", "history-disclosure-root", [
    button.id,
    content.id,
    state.id,
  ]);

  button.props.targetStateNodeId = state.id;
  button.props.stateAction = "toggle";
  button.props.stateAccessibility = "disclosure";
  button.props.disclosureContentNodeId = content.id;
  content.stateBinding = {
    stateNodeId: state.id,
    on: "show",
    off: "hide",
  };
  page.rootIds.push(root.id);
  for (const node of [root, button, content, state]) page.nodes[node.id] = node;

  return { button, store: createBuilderStore({ initialDocument: project }) };
}

describe("Disclosure Button history", () => {
  it("should undo and redo direct reconciliation as one exact history entry", () => {
    const { button, store } = createDisclosureStore();
    const before = structuredClone(store.getState().document);

    const result = store.getState().dispatchEditorCommand({
      kind: "node.updateProps",
      pageId: store.getState().activePageId!,
      nodeId: button.id,
      nextProps: { ...button.props, stateAction: "turn-off" },
    });

    expect(result.status).toBe("applied");
    expect(store.getState().history.past).toHaveLength(1);
    expect(
      store.getState().document?.pages[store.getState().activePageId!].nodes[
        asNodeId("history-disclosure-button")
      ].props,
    ).toMatchObject({
      stateAction: "turn-off",
      stateAccessibility: "none",
      disclosureContentNodeId: "",
    });

    expect(store.getState().undo()).toMatchObject({ status: "applied" });
    expect(store.getState().document).toEqual({
      ...before,
      revision: store.getState().document?.revision,
      updatedAt: store.getState().document?.updatedAt,
    });

    expect(store.getState().redo()).toMatchObject({ status: "applied" });
    expect(
      store.getState().document?.pages[store.getState().activePageId!].nodes[
        button.id
      ].props,
    ).toMatchObject({
      stateAction: "turn-off",
      stateAccessibility: "none",
      disclosureContentNodeId: "",
    });
    expect(store.getState().history.past).toHaveLength(1);
  });
});
