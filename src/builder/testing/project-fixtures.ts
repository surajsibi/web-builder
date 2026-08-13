import { asNodeId, asPageId, asProjectId } from "@/builder/model/ids";
import type { NodeId, PageId } from "@/builder/model/ids";
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  type BuilderNode,
  type PageDocument,
  type ProjectDocument,
} from "@/builder/model/project-document";
import {
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";

export function createTestNode(
  type: ComponentType,
  id: string,
  childIds: readonly string[] = [],
): BuilderNode {
  const definition = componentRegistry[type];

  return {
    id: asNodeId(id),
    type,
    componentVersion: definition.version,
    childIds: childIds.map(asNodeId),
    props: structuredClone(definition.defaults.props),
    styles: structuredClone(definition.defaults.styles),
    meta: {
      name: `${definition.library.label} fixture`,
      locked: false,
    },
  };
}

export function createTestPage(
  id: string,
  name: string,
  slug: string,
  roots: readonly BuilderNode[] = [],
  descendants: readonly BuilderNode[] = [],
): PageDocument {
  const pageId = asPageId(id);
  const nodes = Object.create(null) as Record<NodeId, BuilderNode>;

  for (const node of [...roots, ...descendants]) nodes[node.id] = node;

  return {
    id: pageId,
    name,
    slug,
    rootIds: roots.map((node) => node.id),
    nodes,
  };
}

export function createTestProject(options?: {
  includeAboutPage?: boolean;
}): ProjectDocument {
  const text = createTestNode("text", "node-text");
  const card = createTestNode("card", "node-card", [text.id]);
  const section = createTestNode("section", "node-section", [card.id]);
  const home = createTestPage(
    "page-home",
    "Home",
    "/",
    [section],
    [card, text],
  );
  const pages = Object.create(null) as Record<PageId, PageDocument>;
  pages[home.id] = home;
  const pageOrder = [home.id];

  if (options?.includeAboutPage) {
    const about = createTestPage("page-about", "About", "/about");
    pages[about.id] = about;
    pageOrder.push(about.id);
  }

  return {
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    projectId: asProjectId("project-fixture"),
    name: "Fixture Project",
    pages,
    pageOrder,
    homePageId: home.id,
    createdAt: "2026-08-07T00:00:00.000Z",
    updatedAt: "2026-08-07T00:00:00.000Z",
    revision: 1,
  };
}
