import { describe, expect, it } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import type { BuilderNode } from "@/builder/model/project-document";
import {
  buildProjectParentIndex,
  collectSubtreeNodeIds,
  MAX_PROJECT_NODES,
  MAX_TREE_DEPTH,
} from "@/builder/project/tree";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

function expectTreeFailure(
  project: ReturnType<typeof createTestProject>,
  reason: string,
) {
  const result = buildProjectParentIndex(project);

  expect(result).toMatchObject({ success: false, issue: { reason } });
}

describe("project tree validation", () => {
  it("should build the parent index and collect a complete subtree", () => {
    const project = createTestProject();

    expect(buildProjectParentIndex(project)).toEqual({
      success: true,
      parentById: {
        "node-section": null,
        "node-card": "node-section",
        "node-text": "node-card",
      },
    });
    expect(
      collectSubtreeNodeIds(
        project,
        project.homePageId,
        asNodeId("node-section"),
      ),
    ).toEqual(["node-section", "node-card", "node-text"]);
  });

  it("should reject missing and duplicate root positions", () => {
    const missing = createTestProject();
    missing.pages[missing.homePageId].rootIds = [asNodeId("node-missing")];
    expectTreeFailure(missing, "Missing root node: node-missing");

    const duplicate = createTestProject();
    duplicate.pages[duplicate.homePageId].rootIds.push(
      asNodeId("node-section"),
    );
    expectTreeFailure(duplicate, "Duplicate root position: node-section");
  });

  it("should reject missing, duplicate, and multiply positioned children", () => {
    const missing = createTestProject();
    missing.pages[missing.homePageId].nodes[
      asNodeId("node-card")
    ].childIds = [asNodeId("node-missing")];
    expectTreeFailure(missing, "Missing child node: node-missing");

    const duplicate = createTestProject();
    duplicate.pages[duplicate.homePageId].nodes[
      asNodeId("node-card")
    ].childIds.push(asNodeId("node-text"));
    expectTreeFailure(
      duplicate,
      "Duplicate child position under node-card: node-text",
    );

    const multiple = createTestProject();
    multiple.pages[multiple.homePageId].nodes[
      asNodeId("node-section")
    ].childIds.push(asNodeId("node-text"));
    expectTreeFailure(multiple, "Node has multiple tree positions: node-text");
  });

  it("should reject orphaned and cyclic relationships", () => {
    const orphaned = createTestProject();
    const orphan = createTestNode("text", "node-orphan");
    orphaned.pages[orphaned.homePageId].nodes[orphan.id] = orphan;
    expectTreeFailure(
      orphaned,
      "Page contains an orphan or unreachable node: node-orphan",
    );

    const cyclic = createTestProject();
    cyclic.pages[cyclic.homePageId].nodes[
      asNodeId("node-text")
    ].childIds.push(asNodeId("node-section"));
    expect(buildProjectParentIndex(cyclic).success).toBe(false);
  });

  it("should reject node IDs reused across pages", () => {
    const project = createTestProject({ includeAboutPage: true });
    const about = project.pages[asPageId("page-about")];
    const duplicate = createTestNode("text", "node-text");
    about.nodes[duplicate.id] = duplicate;
    about.rootIds.push(duplicate.id);

    expectTreeFailure(
      project,
      "Node ID is not project-wide unique: node-text",
    );
  });

  it("should reject a project above the node limit", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];
    const template = page.nodes[asNodeId("node-text")];

    for (let index = 0; index <= MAX_PROJECT_NODES - 3; index += 1) {
      const id = asNodeId(`node-limit-${index}`);
      page.nodes[id] = {
        ...template,
        id,
        childIds: [],
      };
      page.rootIds.push(id);
    }

    expectTreeFailure(
      project,
      `Project exceeds the ${MAX_PROJECT_NODES} node limit`,
    );
  });

  it("should reject a tree above the depth limit", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];
    page.rootIds = [];
    page.nodes = Object.create(null) as Record<string, BuilderNode>;

    let previous: BuilderNode | null = null;
    for (let depth = 1; depth <= MAX_TREE_DEPTH + 1; depth += 1) {
      const node = createTestNode("text", `node-depth-${depth}`);
      page.nodes[node.id] = node;
      if (previous) previous.childIds.push(node.id);
      else page.rootIds.push(node.id);
      previous = node;
    }

    expectTreeFailure(
      project,
      `Tree exceeds the ${MAX_TREE_DEPTH} level depth limit`,
    );
  });
});
