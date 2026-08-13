import { describe, expect, it } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { resolveNodeReference } from "@/builder/project/node-references";
import { componentRegistry } from "@/builder/registry/component-registry";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

describe("resolveNodeReference", () => {
  it("should distinguish valid, missing, wrong-type, and cross-page targets", () => {
    const project = createTestProject({ includeAboutPage: true });
    const home = project.pages[asPageId("page-home")];
    const about = project.pages[asPageId("page-about")];
    const localState = createTestNode("boolean-state", "state-local");
    const remoteState = createTestNode("boolean-state", "state-remote");
    home.nodes[localState.id] = localState;
    home.rootIds.push(localState.id);
    about.nodes[remoteState.id] = remoteState;
    about.rootIds.push(remoteState.id);
    const reference = componentRegistry["state-action"].references[0];

    expect(resolveNodeReference(project, home.id, "", reference)).toEqual({
      status: "empty",
    });
    expect(
      resolveNodeReference(project, home.id, localState.id, reference),
    ).toMatchObject({ status: "valid", node: { id: localState.id } });
    expect(
      resolveNodeReference(
        project,
        home.id,
        asNodeId("node-text"),
        reference,
      ),
    ).toMatchObject({ status: "wrong-type", node: { id: "node-text" } });
    expect(
      resolveNodeReference(project, home.id, remoteState.id, reference),
    ).toMatchObject({
      status: "cross-page",
      pageId: about.id,
      node: { id: remoteState.id },
    });
    expect(
      resolveNodeReference(
        project,
        home.id,
        "state-deleted",
        reference,
      ),
    ).toEqual({ status: "missing" });
  });
});
