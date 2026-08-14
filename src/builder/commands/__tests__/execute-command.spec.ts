import { describe, expect, it } from "vitest";

import {
  executeEditorCommand,
  type CommandSnapshot,
} from "@/builder/commands/execute-command";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { componentRegistry } from "@/builder/registry/component-registry";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

function createSnapshot(options?: {
  includeAboutPage?: boolean;
  activePageId?: string;
  selectedNodeId?: string;
}): CommandSnapshot {
  const prepared = prepareProjectHydration(
    createTestProject({ includeAboutPage: options?.includeAboutPage }),
  );
  if (!prepared.success) throw new Error(prepared.error.reason);

  return {
    document: prepared.value.document,
    parentById: prepared.value.parentById,
    activePageId: asPageId(options?.activePageId ?? "page-home"),
    selectedNodeId: options?.selectedNodeId
      ? asNodeId(options.selectedNodeId)
      : null,
  };
}

describe("executeEditorCommand", () => {
  it("should reject a malformed runtime command as invalid input", () => {
    const snapshot = createSnapshot();

    const result = executeEditorCommand(snapshot, {
      kind: "node.rename",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      name: 42,
    } as never);

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "invalid-input", path: ["name"] },
    });
  });

  it("should create a page with a normalized unique slug and activate it", () => {
    const snapshot = createSnapshot({ includeAboutPage: true });

    const result = executeEditorCommand(
      snapshot,
      { kind: "page.create", name: "Àbout Team" },
      { idGenerator: () => "page-created" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(result.candidate.document.pages[asPageId("page-created")]).toMatchObject({
      name: "Àbout Team",
      slug: "/about-team",
      rootIds: [],
      nodes: {},
    });
    expect(result.candidate.activePageId).toBe("page-created");
    expect(result.candidate.selectedNodeId).toBeNull();
    expect(snapshot.document.pages[asPageId("page-created")]).toBeUndefined();
  });

  it("should rename a page without changing its slug and delete an active non-home page", () => {
    const snapshot = createSnapshot({
      includeAboutPage: true,
      activePageId: "page-about",
    });

    const renamed = executeEditorCommand(snapshot, {
      kind: "page.rename",
      pageId: asPageId("page-about"),
      name: "  Our Team  ",
    });

    expect(renamed.status).toBe("applied");
    if (renamed.status !== "applied") return;
    expect(renamed.candidate.document.pages[asPageId("page-about")]).toMatchObject({
      name: "Our Team",
      slug: "/about",
    });

    const deleted = executeEditorCommand(renamed.candidate, {
      kind: "page.delete",
      pageId: asPageId("page-about"),
    });

    expect(deleted.status).toBe("applied");
    if (deleted.status !== "applied") return;
    expect(deleted.candidate.document.pages[asPageId("page-about")]).toBeUndefined();
    expect(deleted.candidate.activePageId).toBe("page-home");
    expect(deleted.candidate.selectedNodeId).toBeNull();
  });

  it("should duplicate a page with new page and node identities and activate the copy", () => {
    const snapshot = createSnapshot({ includeAboutPage: true });
    const generatedIds = [
      "page-home-copy",
      "node-section-copy",
      "node-card-copy",
      "node-text-copy",
    ];

    const result = executeEditorCommand(
      snapshot,
      { kind: "page.duplicate", pageId: asPageId("page-home") },
      { idGenerator: () => generatedIds.shift() ?? "unexpected-id" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const duplicate =
      result.candidate.document.pages[asPageId("page-home-copy")];
    expect(result.candidate.document.pageOrder).toEqual([
      "page-home",
      "page-home-copy",
      "page-about",
    ]);
    expect(duplicate).toMatchObject({
      name: "Home Copy",
      slug: "/home-copy",
      rootIds: ["node-section-copy"],
    });
    expect(duplicate.nodes[asNodeId("node-section-copy")].childIds).toEqual([
      "node-card-copy",
    ]);
    expect(duplicate.nodes[asNodeId("node-card-copy")].childIds).toEqual([
      "node-text-copy",
    ]);
    expect(duplicate.nodes[asNodeId("node-text-copy")]).toMatchObject({
      type: "text",
      props: snapshot.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].props,
      styles: snapshot.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles,
    });
    expect(result.candidate.activePageId).toBe("page-home-copy");
    expect(result.candidate.selectedNodeId).toBeNull();
    expect(snapshot.document.pages[asPageId("page-home-copy")]).toBeUndefined();
  });

  it("should promote a page to home and give the previous home a unique generated slug", () => {
    const snapshot = createSnapshot({ includeAboutPage: true });

    const result = executeEditorCommand(snapshot, {
      kind: "page.setHome",
      pageId: asPageId("page-about"),
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(result.candidate.document).toMatchObject({
      homePageId: "page-about",
      pages: {
        "page-home": { name: "Home", slug: "/home" },
        "page-about": { name: "About", slug: "/" },
      },
    });
    expect(result.candidate.activePageId).toBe("page-home");
  });

  it("should treat promoting the current home page as a no-op", () => {
    const snapshot = createSnapshot();

    const result = executeEditorCommand(snapshot, {
      kind: "page.setHome",
      pageId: asPageId("page-home"),
    });

    expect(result).toEqual({ status: "noop", reason: "value-unchanged" });
  });

  it("should reject page duplication when it cannot reserve unique identities without mutating the source", () => {
    const snapshot = createSnapshot({ includeAboutPage: true });
    const original = structuredClone(snapshot.document);

    const pageIdCollision = executeEditorCommand(
      snapshot,
      { kind: "page.duplicate", pageId: asPageId("page-home") },
      { idGenerator: () => "page-home" },
    );
    expect(pageIdCollision).toMatchObject({
      status: "rejected",
      error: { code: "id-collision", pageId: "page-home" },
    });

    const nodeIdCollision = executeEditorCommand(
      snapshot,
      { kind: "page.duplicate", pageId: asPageId("page-home") },
      {
        idGenerator: (prefix) =>
          prefix === "page" ? "page-copy" : "node-section",
      },
    );
    expect(nodeIdCollision).toMatchObject({
      status: "rejected",
      error: {
        code: "id-collision",
        pageId: "page-home",
        nodeId: "node-section",
      },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should reject a duplicated page that would exceed the project node limit", () => {
    const project = createTestProject({ includeAboutPage: true });
    const about = project.pages[asPageId("page-about")];
    for (let index = 0; index < 9_995; index += 1) {
      const node = createTestNode("text", `node-filler-${index}`);
      about.nodes[node.id] = node;
      about.rootIds.push(node.id);
    }
    const prepared = prepareProjectHydration(project);
    if (!prepared.success) throw new Error(prepared.error.reason);
    const snapshot: CommandSnapshot = {
      document: prepared.value.document,
      parentById: prepared.value.parentById,
      activePageId: asPageId("page-home"),
      selectedNodeId: null,
    };

    let nodeCounter = 0;
    const result = executeEditorCommand(
      snapshot,
      { kind: "page.duplicate", pageId: asPageId("page-home") },
      {
        idGenerator: (prefix) => {
          if (prefix === "page") return "page-copy";
          nodeCounter += 1;
          return `node-copy-${nodeCounter}`;
        },
      },
    );

    expect(result).toMatchObject({
      status: "rejected",
      error: {
        code: "tree-invalid",
        reason: "Project exceeds the 10000 node limit",
      },
    });
    expect(snapshot.document.pages[asPageId("page-copy")]).toBeUndefined();
  });

  it("should generate a conflict-free slug for the previous home page", () => {
    const snapshot = createSnapshot({ includeAboutPage: true });
    const reserved = executeEditorCommand(
      snapshot,
      { kind: "page.create", name: "Reserved", slug: "/home" },
      { idGenerator: () => "page-reserved" },
    );
    expect(reserved.status).toBe("applied");
    if (reserved.status !== "applied") return;

    const promoted = executeEditorCommand(reserved.candidate, {
      kind: "page.setHome",
      pageId: asPageId("page-about"),
    });
    expect(promoted.status).toBe("applied");
    if (promoted.status !== "applied") return;
    expect(promoted.candidate.document.pages[asPageId("page-home")].slug).toBe(
      "/home-2",
    );
  });

  it("should reject page duplication and home promotion for a missing page", () => {
    const snapshot = createSnapshot();

    for (const kind of ["page.duplicate", "page.setHome"] as const) {
      expect(
        executeEditorCommand(snapshot, {
          kind,
          pageId: asPageId("page-missing"),
        }),
      ).toMatchObject({
        status: "rejected",
        error: { code: "page-not-found", pageId: "page-missing" },
      });
    }
  });

  it("should insert validated registry defaults and select the new node", () => {
    const snapshot = createSnapshot();

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "card",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => "node-created" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    const node = page.nodes[asNodeId("node-created")];
    expect(page.rootIds).toEqual(["node-section", "node-created"]);
    expect(node).toMatchObject({
      type: "card",
      componentVersion: 1,
      childIds: [],
      meta: { name: "Card 1", locked: false },
    });
    expect(result.candidate.parentById[node.id]).toBeNull();
    expect(result.candidate.selectedNodeId).toBe(node.id);
  });

  it("should report invalid style defaults as a styles error", () => {
    const snapshot = createSnapshot();
    const defaults = componentRegistry.card.defaults;
    const originalStyles = defaults.styles;
    defaults.styles = {
      base: { color: 42 },
    } as unknown as typeof defaults.styles;

    try {
      const result = executeEditorCommand(snapshot, {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "card",
        destination: { parentId: null, index: 1 },
      });

      expect(result).toMatchObject({
        status: "rejected",
        error: { code: "styles-invalid", pageId: "page-home" },
      });
    } finally {
      defaults.styles = originalStyles;
    }
  });

  it("should preserve active-page selection when inserting on an inactive page", () => {
    const snapshot = createSnapshot({
      includeAboutPage: true,
      selectedNodeId: "node-text",
    });

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "node.insert",
        pageId: asPageId("page-about"),
        componentType: "card",
        destination: { parentId: null, index: 0 },
      },
      { idGenerator: () => "node-about-card" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(result.candidate.activePageId).toBe("page-home");
    expect(result.candidate.selectedNodeId).toBe("node-text");
  });

  it("should retry an empty generated node ID before inserting", () => {
    const snapshot = createSnapshot();
    const generatedIds = ["", "node-created"];

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "card",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => generatedIds.shift() ?? "node-collision" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].rootIds,
    ).toContain("node-created");
  });

  it("should insert form controls inside a Form and reject unsupported children", () => {
    const snapshot = createSnapshot();
    const insertedForm = executeEditorCommand(
      snapshot,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "form",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => "node-form" },
    );

    expect(insertedForm.status).toBe("applied");
    if (insertedForm.status !== "applied") return;

    const insertedInput = executeEditorCommand(
      insertedForm.candidate,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "input",
        destination: { parentId: asNodeId("node-form"), index: 0 },
      },
      { idGenerator: () => "node-form-input" },
    );

    expect(insertedInput.status).toBe("applied");
    if (insertedInput.status !== "applied") return;

    const insertedDropdown = executeEditorCommand(
      insertedInput.candidate,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "dropdown",
        destination: { parentId: asNodeId("node-form"), index: 1 },
      },
      { idGenerator: () => "node-form-dropdown" },
    );

    expect(insertedDropdown.status).toBe("applied");
    if (insertedDropdown.status !== "applied") return;
    expect(
      insertedDropdown.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-form")
      ].childIds,
    ).toEqual(["node-form-input", "node-form-dropdown"]);

    const nestedForm = executeEditorCommand(
      insertedDropdown.candidate,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "form",
        destination: { parentId: asNodeId("node-form"), index: 2 },
      },
      { idGenerator: () => "node-nested-form" },
    );

    expect(nestedForm).toMatchObject({
      status: "rejected",
      error: { code: "placement-rejected", parentId: "node-form" },
    });
  });

  it("should insert a complete Navbar block atomically and select its root", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);
    const generatedIds = [
      "node-navbar",
      "node-navbar-nav",
      "node-navbar-menu",
      "node-navbar-logo",
      "node-navbar-work",
      "node-navbar-about",
      "node-navbar-playground",
      "node-navbar-resource",
      "node-navbar-cta",
    ];

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "block.insert",
        pageId: asPageId("page-home"),
        blockType: "navbar",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => generatedIds.shift() ?? "node-unexpected" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    const navbar = page.nodes[asNodeId("node-navbar")];
    const navigation = page.nodes[asNodeId("node-navbar-nav")];
    const menu = page.nodes[asNodeId("node-navbar-menu")];

    expect(page.rootIds).toEqual(["node-section", "node-navbar"]);
    expect(navbar).toMatchObject({
      type: "section",
      props: { semanticTag: "header" },
      childIds: ["node-navbar-nav"],
      meta: { name: "Section 1", locked: false },
    });
    expect(navigation).toMatchObject({
      type: "container",
      props: { semanticTag: "nav" },
      childIds: [
        "node-navbar-menu",
        "node-navbar-cta",
      ],
      styles: {
        mobile: {
          flex: { direction: "column", alignItems: "stretch" },
        },
      },
    });
    expect(menu.childIds).toEqual([
      "node-navbar-logo",
      "node-navbar-work",
      "node-navbar-about",
      "node-navbar-playground",
      "node-navbar-resource",
    ]);
    expect(result.candidate.parentById[navbar.id]).toBeNull();
    expect(result.candidate.parentById[navigation.id]).toBe(navbar.id);
    expect(result.candidate.selectedNodeId).toBe(navbar.id);
    expect(result.value).toEqual({
      blockType: "navbar",
      rootNodeId: "node-navbar",
      nodeIds: [
        "node-navbar",
        "node-navbar-nav",
        "node-navbar-menu",
        "node-navbar-logo",
        "node-navbar-work",
        "node-navbar-about",
        "node-navbar-playground",
        "node-navbar-resource",
        "node-navbar-cta",
      ],
      destination: { parentId: null, index: 1 },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should reject an unknown block type without mutating the source", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(snapshot, {
      kind: "block.insert",
      pageId: asPageId("page-home"),
      blockType: "missing",
      destination: { parentId: null, index: 1 },
    } as never);

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "block-type-unknown" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should reject Navbar insertion into a locked destination", () => {
    const snapshot = createSnapshot();
    snapshot.document.pages[asPageId("page-home")].nodes[
      asNodeId("node-card")
    ].meta.locked = true;

    const result = executeEditorCommand(snapshot, {
      kind: "block.insert",
      pageId: asPageId("page-home"),
      blockType: "navbar",
      destination: { parentId: asNodeId("node-card"), index: 1 },
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "locked", nodeId: "node-card" },
    });
  });

  it("should reject Navbar insertion when fresh IDs cannot be generated", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "block.insert",
        pageId: asPageId("page-home"),
        blockType: "navbar",
        destination: { parentId: null, index: 1 },
      },
      { idGenerator: () => "node-section" },
    );

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "id-collision" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should move a subtree atomically and reject a cycle without mutating the source", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot.document);

    const moved = executeEditorCommand(snapshot, {
      kind: "node.move",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      destination: { parentId: asNodeId("node-section"), index: 1 },
    });

    expect(moved.status).toBe("applied");
    if (moved.status !== "applied") return;
    expect(moved.candidate.parentById[asNodeId("node-text")]).toBe(
      "node-section",
    );
    expect(
      moved.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].childIds,
    ).toEqual([]);

    const rejected = executeEditorCommand(snapshot, {
      kind: "node.move",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-section"),
      destination: { parentId: asNodeId("node-card"), index: 0 },
    });

    expect(rejected).toMatchObject({
      status: "rejected",
      error: { code: "cycle" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should duplicate a complete subtree with fresh identities and preserved values", () => {
    const snapshot = createSnapshot();
    snapshot.document.pages[asPageId("page-home")].nodes[
      asNodeId("node-card")
    ].meta.locked = true;
    snapshot.document.pages[asPageId("page-home")].nodes[
      asNodeId("node-text")
    ].styles.base.positionOffset = {
      x: { value: 18, unit: "px" },
      y: { value: -9, unit: "px" },
    };
    const generatedIds = ["node-card-copy", "node-text-copy"];

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "node.duplicate",
        pageId: asPageId("page-home"),
        nodeId: asNodeId("node-card"),
        destination: { parentId: asNodeId("node-section"), index: 1 },
      },
      { idGenerator: () => generatedIds.shift() ?? "node-collision" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const page = result.candidate.document.pages[asPageId("page-home")];
    const duplicate = page.nodes[asNodeId("node-card-copy")];
    const duplicateChild = page.nodes[asNodeId("node-text-copy")];
    expect(page.nodes[asNodeId("node-section")].childIds).toEqual([
      "node-card",
      "node-card-copy",
    ]);
    expect(duplicate).toMatchObject({
      type: "card",
      componentVersion: page.nodes[asNodeId("node-card")].componentVersion,
      childIds: ["node-text-copy"],
      props: page.nodes[asNodeId("node-card")].props,
      styles: page.nodes[asNodeId("node-card")].styles,
      meta: { name: "Card 1", locked: true },
    });
    expect(duplicateChild).toMatchObject({
      type: "text",
      props: page.nodes[asNodeId("node-text")].props,
      styles: page.nodes[asNodeId("node-text")].styles,
      meta: { name: "Text 1", locked: false },
    });
    expect(duplicateChild.styles.base.positionOffset).toEqual({
      x: { value: 18, unit: "px" },
      y: { value: -9, unit: "px" },
    });
    expect(duplicateChild.styles.base.positionOffset).not.toBe(
      page.nodes[asNodeId("node-text")].styles.base.positionOffset,
    );
    expect(result.candidate.parentById[duplicate.id]).toBe("node-section");
    expect(result.candidate.parentById[duplicateChild.id]).toBe(duplicate.id);
    expect(result.candidate.selectedNodeId).toBe(duplicate.id);
    expect(result.value).toMatchObject({
      sourceNodeId: "node-card",
      duplicateNodeId: "node-card-copy",
      idMap: {
        "node-card": "node-card-copy",
        "node-text": "node-text-copy",
      },
    });
  });

  it("should keep duplicated subtree IDs unique when the generator repeats a fresh ID", () => {
    const snapshot = createSnapshot();
    const generatedIds = [
      "node-card-copy",
      "node-card-copy",
      "node-text-copy",
    ];

    const result = executeEditorCommand(
      snapshot,
      {
        kind: "node.duplicate",
        pageId: asPageId("page-home"),
        nodeId: asNodeId("node-card"),
        destination: { parentId: asNodeId("node-section"), index: 1 },
      },
      { idGenerator: () => generatedIds.shift() ?? "node-collision" },
    );

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(result.value).toMatchObject({
      idMap: {
        "node-card": "node-card-copy",
        "node-text": "node-text-copy",
      },
    });
    expect(
      Object.keys(
        result.candidate.document.pages[asPageId("page-home")].nodes,
      ),
    ).toHaveLength(5);
  });

  it("should reject duplication into a locked destination without changing the source", () => {
    const snapshot = createSnapshot();
    snapshot.document.pages[asPageId("page-home")].nodes[
      asNodeId("node-card")
    ].meta.locked = true;
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(snapshot, {
      kind: "node.duplicate",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      destination: { parentId: asNodeId("node-card"), index: 1 },
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "locked", nodeId: "node-card" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should enforce direct structural locking while allowing the node to be unlocked", () => {
    const snapshot = createSnapshot();
    const locked = executeEditorCommand(snapshot, {
      kind: "node.lock",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      locked: true,
    });

    expect(locked.status).toBe("applied");
    if (locked.status !== "applied") return;

    const insertRejected = executeEditorCommand(
      locked.candidate,
      {
        kind: "node.insert",
        pageId: asPageId("page-home"),
        componentType: "button",
        destination: { parentId: asNodeId("node-card"), index: 1 },
      },
      { idGenerator: () => "node-button" },
    );
    expect(insertRejected).toMatchObject({
      status: "rejected",
      error: { code: "locked", nodeId: "node-card" },
    });

    const destructiveDeleteRejected = executeEditorCommand(locked.candidate, {
      kind: "node.remove",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-section"),
    });
    expect(destructiveDeleteRejected).toMatchObject({
      status: "rejected",
      error: { code: "locked", nodeId: "node-card" },
    });

    const unlocked = executeEditorCommand(locked.candidate, {
      kind: "node.lock",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      locked: false,
    });
    expect(unlocked.status).toBe("applied");
  });

  it("should update props, styles, and visibility through validated style data", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });

    const propsResult = executeEditorCommand(snapshot, {
      kind: "node.updateProps",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      nextProps: { text: "Updated copy", semanticTag: "p" },
    });
    expect(propsResult.status).toBe("applied");
    if (propsResult.status !== "applied") return;

    const stylesResult = executeEditorCommand(propsResult.candidate, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "fontSize" },
          value: { value: 18, unit: "px" },
        },
      ],
    });
    expect(stylesResult.status).toBe("applied");
    if (stylesResult.status !== "applied") return;

    const hidden = executeEditorCommand(stylesResult.candidate, {
      kind: "node.hide",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "mobile",
      hidden: true,
    });
    expect(hidden.status).toBe("applied");
    if (hidden.status !== "applied") return;

    const node =
      hidden.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ];
    expect(node.props.text).toBe("Updated copy");
    expect(node.styles.tablet?.fontSize).toEqual({ value: 18, unit: "px" });
    expect(node.styles.mobile?.display).toBe("none");
    expect(node.meta).not.toHaveProperty("hidden");
  });

  it("should reject invalid style values without mutating the source", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "desktop",
      changes: [
        {
          target: { property: "display" },
          value: "inline",
        },
      ],
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "styles-invalid", nodeId: "node-text" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should set an atomic position offset on the targeted responsive layer", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });
    const positionOffset = {
      x: { value: 36, unit: "px" as const },
      y: { value: -18, unit: "px" as const },
    };

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "positionOffset" },
          value: positionOffset,
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles.tablet?.positionOffset,
    ).toEqual(positionOffset);
    expect(
      snapshot.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ].styles,
    ).not.toHaveProperty("tablet.positionOffset");
  });

  it("should reset only the targeted position-offset layer and remove an empty patch", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });
    const node =
      snapshot.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ];
    node.styles.base.positionOffset = {
      x: { value: 10, unit: "px" },
      y: { value: 20, unit: "px" },
    };
    node.styles.tablet = {
      positionOffset: {
        x: { value: 0, unit: "px" },
        y: { value: 0, unit: "px" },
      },
    };

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "tablet",
      changes: [
        {
          operation: "reset",
          target: { property: "positionOffset" },
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    const updated =
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ];
    expect(updated.styles.tablet).toBeUndefined();
    expect(updated.styles.base.positionOffset).toEqual({
      x: { value: 10, unit: "px" },
      y: { value: 20, unit: "px" },
    });
  });

  it("should return style-already-reset when the targeted layer has no offset", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
      viewport: "mobile",
      changes: [
        {
          operation: "reset",
          target: { property: "positionOffset" },
        },
      ],
    });

    expect(result).toEqual({
      status: "noop",
      reason: "style-already-reset",
    });
  });

  it.each([
    ["node-section", "root-node"],
    ["node-card", "container-capable"],
  ])(
    "should reject position-offset writes for high-risk node %s",
    (nodeId, reason) => {
      const snapshot = createSnapshot({ selectedNodeId: nodeId });

      const result = executeEditorCommand(snapshot, {
        kind: "node.updateStyles",
        pageId: asPageId("page-home"),
        nodeId: asNodeId(nodeId),
        viewport: "desktop",
        changes: [
          {
            target: { property: "positionOffset" },
            value: {
              x: { value: 10, unit: "px" },
              y: { value: 5, unit: "px" },
            },
          },
        ],
      });

      expect(result).toMatchObject({
        status: "rejected",
        error: { code: "positioning-ineligible", reason },
      });
    },
  );

  it("should apply a uniform border batch to one responsive layer atomically", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "borderStyle" },
          value: "dashed",
        },
        {
          target: { property: "borderWidth" },
          value: { value: 0.125, unit: "rem" },
        },
        {
          target: { property: "borderColor" },
          value: "#3366998c",
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].styles.tablet,
    ).toMatchObject({
      borderStyle: "dashed",
      borderWidth: { value: 0.125, unit: "rem" },
      borderColor: "#3366998c",
    });
    expect(
      snapshot.document.pages[asPageId("page-home")].nodes[asNodeId("node-card")]
        .styles.tablet,
    ).not.toHaveProperty("borderStyle");
  });

  it("should reject an invalid border width without mutating the source", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "desktop",
      changes: [
        {
          target: { property: "borderWidth" },
          value: { value: -1, unit: "px" },
        },
      ],
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "styles-invalid", nodeId: "node-card" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should apply reusable effects to a non-Button responsive layer", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });
    const boxShadow = [
      {
        offsetX: 0,
        offsetY: 8,
        blurRadius: 24,
        spreadRadius: -12,
        unit: "px" as const,
        color: "#5b45d64d",
        inset: false,
      },
    ];

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "tablet",
      changes: [
        { target: { property: "boxShadow" }, value: boxShadow },
        {
          target: { property: "backdropBlur" },
          value: { value: 12, unit: "px" },
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].styles.tablet,
    ).toMatchObject({
      boxShadow,
      backdropBlur: { value: 12, unit: "px" },
    });
    expect(
      snapshot.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].styles.tablet,
    ).not.toHaveProperty("boxShadow");
  });

  it("should apply a complete background image to one responsive layer", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });
    const backgroundImage = {
      kind: "image" as const,
      source: "https://cdn.example.com/card.webp",
      size: "cover" as const,
      positionX: "center" as const,
      positionY: "bottom" as const,
      repeat: "no-repeat" as const,
    };

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "backgroundImage" },
          value: backgroundImage,
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].styles.tablet?.backgroundImage,
    ).toEqual(backgroundImage);
    expect(
      snapshot.document.pages[asPageId("page-home")].nodes[asNodeId("node-card")]
        .styles.tablet,
    ).not.toHaveProperty("backgroundImage");
  });

  it("should apply a complete linear gradient to one responsive layer", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });
    const gradient = {
      kind: "linear-gradient" as const,
      angle: 135,
      startColor: "#7c3aed",
      endColor: "#2563ebcc",
    };

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "tablet",
      changes: [
        {
          target: { property: "backgroundImage" },
          value: gradient,
        },
      ],
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-card")
      ].styles.tablet?.backgroundImage,
    ).toEqual(gradient);
    expect(
      snapshot.document.pages[asPageId("page-home")].nodes[asNodeId("node-card")]
        .styles.tablet,
    ).not.toHaveProperty("backgroundImage");
  });

  it("should reject an unsafe background image without mutating the source", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-card" });
    const original = structuredClone(snapshot.document);

    const result = executeEditorCommand(snapshot, {
      kind: "node.updateStyles",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-card"),
      viewport: "desktop",
      changes: [
        {
          target: { property: "backgroundImage" },
          value: {
            kind: "image",
            source: "data:image/png;base64,AAAA",
            size: "cover",
            positionX: "center",
            positionY: "center",
            repeat: "no-repeat",
          },
        },
      ],
    });

    expect(result).toMatchObject({
      status: "rejected",
      error: { code: "styles-invalid", nodeId: "node-card" },
    });
    expect(snapshot.document).toEqual(original);
  });

  it("should select the former parent when removing the selected subtree", () => {
    const snapshot = createSnapshot({ selectedNodeId: "node-text" });

    const result = executeEditorCommand(snapshot, {
      kind: "node.remove",
      pageId: asPageId("page-home"),
      nodeId: asNodeId("node-text"),
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") return;
    expect(result.candidate.selectedNodeId).toBe("node-card");
    expect(
      result.candidate.document.pages[asPageId("page-home")].nodes[
        asNodeId("node-text")
      ],
    ).toBeUndefined();
  });
});
