import { describe, expect, it } from "vitest";

import { duplicateProjectDocument } from "@/builder/project/duplicate";
import { prepareProjectHydration } from "@/builder/project/hydration";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

describe("duplicateProjectDocument", () => {
  it("should create an independent valid project with fresh IDs", () => {
    const source = createTestProject({ includeAboutPage: true });
    let sequence = 0;

    const duplicate = duplicateProjectDocument(source, {
      name: "Storefront Copy",
      now: "2026-08-14T10:30:00.000Z",
      idGenerator: (prefix) => `${prefix}-copy-${++sequence}`,
    });

    expect(duplicate).toMatchObject({
      name: "Storefront Copy",
      createdAt: "2026-08-14T10:30:00.000Z",
      updatedAt: "2026-08-14T10:30:00.000Z",
      revision: 0,
    });
    expect(duplicate.projectId).toMatch(/^project-copy-[0-9]+$/);
    expect(duplicate.pageOrder).not.toEqual(source.pageOrder);
    expect(Object.keys(duplicate.pages)).not.toEqual(Object.keys(source.pages));
    expect(
      Object.values(duplicate.pages).flatMap((page) => Object.keys(page.nodes)),
    ).not.toEqual(
      Object.values(source.pages).flatMap((page) => Object.keys(page.nodes)),
    );
    expect(prepareProjectHydration(duplicate).success).toBe(true);

    duplicate.pages[duplicate.homePageId].name = "Changed duplicate";
    expect(source.pages[source.homePageId].name).toBe("Home");
  });

  it("should remap schema-version-3 node references in the duplicate", () => {
    const source = createTestProject();
    const page = source.pages[source.homePageId];
    const state = createTestNode("boolean-state", "node-project-state");
    const button = createTestNode("button", "node-project-action");
    const connected = createTestNode("container", "node-project-connected");
    button.props.targetStateNodeId = state.id;
    button.props.stateAction = "toggle";
    connected.stateBinding = {
      stateNodeId: state.id,
      on: "show",
      off: "hide",
    };
    Object.assign(page.nodes, {
      [state.id]: state,
      [button.id]: button,
      [connected.id]: connected,
    });
    page.rootIds.push(state.id, button.id, connected.id);
    let sequence = 0;

    const duplicate = duplicateProjectDocument(source, {
      idGenerator: (prefix) => `${prefix}-state-copy-${++sequence}`,
    });
    const duplicatePage = duplicate.pages[duplicate.homePageId];
    const duplicateState = Object.values(duplicatePage.nodes).find(
      (node) => node.type === "boolean-state",
    );
    const duplicateButton = Object.values(duplicatePage.nodes).find(
      (node) => node.type === "button",
    );
    const duplicateConnected = Object.values(duplicatePage.nodes).find(
      (node) => node.stateBinding !== undefined,
    );

    expect(duplicateState).toBeDefined();
    expect(duplicateButton?.props.targetStateNodeId).toBe(duplicateState?.id);
    expect(duplicateConnected?.stateBinding?.stateNodeId).toBe(
      duplicateState?.id,
    );
    expect(duplicateButton?.props.targetStateNodeId).not.toBe(state.id);
    expect(duplicateConnected?.stateBinding?.stateNodeId).not.toBe(state.id);
    expect(prepareProjectHydration(duplicate).success).toBe(true);
  });
});
