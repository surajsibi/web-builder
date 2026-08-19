import { isJsonObject, isJsonValue } from "@/builder/model/json";
import type { JsonObject } from "@/builder/model/json";
import { asNodeId, asPageId } from "@/builder/model/ids";
import type { NodeId, PageId } from "@/builder/model/ids";
import type {
  BuilderNode,
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";
import { booleanStateBindingSchema } from "@/builder/model/state-binding";
import { reconcileDisclosureButtonProps } from "@/builder/interaction/disclosure-semantics";
import { evaluatePositioningEligibility } from "@/builder/positioning/eligibility";
import {
  blockRegistry,
  resolveBlockTemplate,
  type BlockType,
} from "@/builder/registry/block-registry";
import {
  canPlaceType,
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";
import { responsiveStylesSchema } from "@/builder/styles/schema";
import type {
  ResponsiveStyles,
  StylePatch,
  StyleValues,
  Viewport,
} from "@/builder/styles/types";
import { z } from "zod";

import {
  type CommandAppliedValue,
  type CommandNoopReason,
  type CommandValidationError,
  type EditorCommand,
  type NodeDestination,
  type StyleChange,
  type StyleTarget,
} from "./types";
import { cloneProjectDocument, valuesEqual } from "../project/clone";
import { prepareProjectHydration } from "../project/hydration";
import { createId, type IdGenerator } from "../project/id-generator";
import {
  remapNodeReferences,
  remapStateBinding,
} from "../project/node-references";
import {
  createGeneratedPageSlug,
  normalizeExplicitPageSlug,
} from "../project/slug";
import {
  buildProjectParentIndex,
  collectSubtreeNodeIds,
  type ParentById,
} from "../project/tree";

export type CommandSnapshot = {
  document: ProjectDocument;
  parentById: ParentById;
  activePageId: PageId;
  selectedNodeId: NodeId | null;
};

export type CommandCandidate = CommandSnapshot;

export type CommandPreparationResult =
  | {
      status: "applied";
      candidate: CommandCandidate;
      value: CommandAppliedValue;
    }
  | { status: "noop"; reason: CommandNoopReason }
  | { status: "rejected"; error: CommandValidationError };

export type CommandDryRunResult =
  | { status: "valid" }
  | Extract<CommandPreparationResult, { status: "noop" | "rejected" }>;

type CommandExecutionResult = CommandPreparationResult | { status: "valid" };
type CommandExecutionMode = "apply" | "dry-run";

export type CommandExecutorServices = {
  candidateValidation?: "full" | "scoped";
  idGenerator: IdGenerator;
};

const DEFAULT_SERVICES: CommandExecutorServices = {
  idGenerator: createId,
};

const commandIdSchema = z.string().min(1);
const commandDestinationSchema = z
  .object({
    parentId: commandIdSchema.nullable(),
    index: z.number(),
  })
  .strict();
const commandStyleTargetSchema = z
  .object({
    property: z.string().min(1),
    field: z.string().min(1).optional(),
  })
  .strict();
const commandStyleChangeSchema = z.union([
  z
    .object({
      operation: z.literal("reset"),
      target: commandStyleTargetSchema,
    })
    .strict(),
  z
    .object({
      operation: z.literal("set").optional(),
      target: commandStyleTargetSchema,
      value: z.unknown(),
    })
    .strict(),
]);
const commandViewportSchema = z.enum(["desktop", "tablet", "mobile"]);
const editorCommandEnvelopeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("page.create"),
      name: z.string().optional(),
      slug: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("page.rename"),
      pageId: commandIdSchema,
      name: z.string(),
    })
    .strict(),
  z
    .object({ kind: z.literal("page.duplicate"), pageId: commandIdSchema })
    .strict(),
  z
    .object({ kind: z.literal("page.setHome"), pageId: commandIdSchema })
    .strict(),
  z
    .object({ kind: z.literal("page.delete"), pageId: commandIdSchema })
    .strict(),
  z
    .object({
      kind: z.literal("node.insert"),
      pageId: commandIdSchema,
      componentType: z.string().min(1),
      destination: commandDestinationSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.remove"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.move"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      destination: commandDestinationSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.duplicate"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      destination: commandDestinationSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.rename"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      name: z.string(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.lock"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      locked: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.hide"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      hidden: z.boolean(),
      viewport: commandViewportSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.updateProps"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      nextProps: z.unknown(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.updateStyles"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      viewport: commandViewportSchema,
      changes: z.array(commandStyleChangeSchema),
    })
    .strict(),
  z
    .object({
      kind: z.literal("node.updateStateBinding"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      binding: booleanStateBindingSchema.nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("state.createAndConnect"),
      pageId: commandIdSchema,
      nodeId: commandIdSchema,
      name: z.string(),
      defaultValue: z.boolean(),
      on: z.enum(["show", "hide"]),
      off: z.enum(["show", "hide"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("block.insert"),
      pageId: commandIdSchema,
      blockType: z.string().min(1),
      destination: commandDestinationSchema,
    })
    .strict(),
]);

const STYLE_PROPERTIES = new Set<keyof StyleValues>([
  "display",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "margin",
  "padding",
  "color",
  "backgroundColor",
  "backgroundImage",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textDecoration",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "boxShadow",
  "backdropBlur",
  "position",
  "positionOffset",
  "zIndex",
  "grid",
  "flex",
]);

const NESTED_STYLE_FIELDS: Partial<Record<keyof StyleValues, ReadonlySet<string>>> = {
  margin: new Set(["top", "right", "bottom", "left"]),
  padding: new Set(["top", "right", "bottom", "left"]),
  grid: new Set([
    "columns",
    "rows",
    "columnGap",
    "rowGap",
    "justifyItems",
    "alignItems",
  ]),
  flex: new Set([
    "direction",
    "wrap",
    "justifyContent",
    "alignItems",
    "gap",
  ]),
};

function rejected(error: CommandValidationError): CommandPreparationResult {
  return { status: "rejected", error };
}

function noop(reason: CommandNoopReason): CommandPreparationResult {
  return { status: "noop", reason };
}

function getPage(
  document: Readonly<ProjectDocument>,
  pageId: PageId,
): PageDocument | null {
  return document.pages[pageId] ?? null;
}

function findNodePageId(
  document: Readonly<ProjectDocument>,
  nodeId: NodeId,
): PageId | null {
  for (const page of Object.values(document.pages)) {
    if (Object.hasOwn(page.nodes, nodeId)) return page.id;
  }
  return null;
}

function resolveNode(
  document: Readonly<ProjectDocument>,
  pageId: PageId,
  nodeId: NodeId,
): { page: PageDocument; node: BuilderNode } | CommandPreparationResult {
  const page = getPage(document, pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId,
      reason: `Page does not exist: ${pageId}`,
    });
  }

  const node = page.nodes[nodeId];
  if (node) return { page, node };

  const actualPageId = findNodePageId(document, nodeId);
  return rejected({
    code: actualPageId ? "node-not-in-page" : "node-not-found",
    pageId,
    nodeId,
    reason: actualPageId
      ? `Node ${nodeId} belongs to page ${actualPageId}`
      : `Node does not exist: ${nodeId}`,
  });
}

function isPreparationResult(
  value: unknown,
): value is CommandPreparationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value
  );
}

function locateNode(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  nodeId: NodeId,
): NodeDestination {
  const parentId = parentById[nodeId];
  const siblings = parentId === null ? page.rootIds : page.nodes[parentId].childIds;

  return { parentId, index: siblings.indexOf(nodeId) };
}

function validateDestination(
  page: Readonly<PageDocument>,
  destination: NodeDestination,
  movingNodeId?: NodeId,
  currentParentId?: NodeId | null,
): CommandValidationError | null {
  if (!Number.isInteger(destination.index)) {
    return {
      code: "invalid-input",
      pageId: page.id,
      parentId: destination.parentId,
      reason: "Destination index must be an integer",
    };
  }

  if (
    destination.parentId !== null &&
    !Object.hasOwn(page.nodes, destination.parentId)
  ) {
    return {
      code: "destination-not-found",
      pageId: page.id,
      parentId: destination.parentId,
      reason: `Destination parent does not exist: ${destination.parentId}`,
    };
  }

  const siblings =
    destination.parentId === null
      ? page.rootIds
      : page.nodes[destination.parentId].childIds;
  const sameParent =
    movingNodeId !== undefined && currentParentId === destination.parentId;
  const destinationLength = siblings.length - (sameParent ? 1 : 0);

  if (destination.index < 0 || destination.index > destinationLength) {
    return {
      code: "index-out-of-range",
      pageId: page.id,
      parentId: destination.parentId,
      reason: `Destination index must be between 0 and ${destinationLength}`,
    };
  }

  return null;
}

function lockedError(
  pageId: PageId,
  nodeId: NodeId,
  reason: string,
): CommandPreparationResult {
  return rejected({ code: "locked", pageId, nodeId, reason });
}

function uniquePageId(
  document: Readonly<ProjectDocument>,
  idGenerator: IdGenerator,
): PageId | null {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pageId = asPageId(idGenerator("page"));
    if (pageId.length > 0 && !Object.hasOwn(document.pages, pageId)) {
      return pageId;
    }
  }
  return null;
}

function uniquePageCopyName(
  document: Readonly<ProjectDocument>,
  sourceName: string,
): string {
  const names = new Set(Object.values(document.pages).map((page) => page.name));
  const base = `${sourceName} Copy`;
  if (!names.has(base)) return base;

  let suffix = 2;
  let candidate = `${base} ${suffix}`;
  while (names.has(candidate)) {
    suffix += 1;
    candidate = `${base} ${suffix}`;
  }
  return candidate;
}

function collectProjectNodeIds(
  document: Readonly<ProjectDocument>,
): Set<NodeId> {
  const nodeIds = new Set<NodeId>();
  for (const page of Object.values(document.pages)) {
    for (const nodeId of Object.keys(page.nodes) as NodeId[]) nodeIds.add(nodeId);
  }
  return nodeIds;
}

function reserveUniqueNodeId(
  reservedIds: Set<NodeId>,
  idGenerator: IdGenerator,
): NodeId | null {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const nodeId = asNodeId(idGenerator("node"));
    if (nodeId.length > 0 && !reservedIds.has(nodeId)) {
      reservedIds.add(nodeId);
      return nodeId;
    }
  }
  return null;
}

function readableNodeName(
  page: Readonly<PageDocument>,
  componentType: ComponentType,
): string {
  const label = componentRegistry[componentType].library.label;
  const names = new Set(Object.values(page.nodes).map((node) => node.meta.name));
  let suffix = 1;

  while (names.has(`${label} ${suffix}`)) suffix += 1;
  return `${label} ${suffix}`;
}

function nextReadableNodeName(
  type: ComponentType,
  reservedNames: Set<string>,
): string {
  const label = componentRegistry[type].library.label;
  let suffix = 1;

  while (reservedNames.has(`${label} ${suffix}`)) suffix += 1;
  const name = `${label} ${suffix}`;
  reservedNames.add(name);
  return name;
}

function nextUniqueNodeName(
  nameHint: string,
  reservedNames: Set<string>,
): string {
  if (!reservedNames.has(nameHint)) {
    reservedNames.add(nameHint);
    return nameHint;
  }

  let suffix = 2;
  let name = `${nameHint} ${suffix}`;
  while (reservedNames.has(name)) {
    suffix += 1;
    name = `${nameHint} ${suffix}`;
  }
  reservedNames.add(name);
  return name;
}

function placementError(
  pageId: PageId,
  parentId: NodeId | null,
  childType: ComponentType,
  parentType: ComponentType | null,
): CommandPreparationResult {
  return rejected({
    code: "placement-rejected",
    pageId,
    parentId,
    reason:
      parentType === null
        ? `${childType} cannot be placed at the page root`
        : `${childType} cannot be placed inside ${parentType}`,
  });
}

function validatePlacementForDestination(
  page: Readonly<PageDocument>,
  childType: ComponentType,
  destination: NodeDestination,
): CommandPreparationResult | null {
  const parentType =
    destination.parentId === null ? null : page.nodes[destination.parentId].type;

  return canPlaceType(parentType, childType)
    ? null
    : placementError(page.id, destination.parentId, childType, parentType);
}

function assertDestinationEditable(
  page: Readonly<PageDocument>,
  destination: NodeDestination,
): CommandPreparationResult | null {
  if (destination.parentId === null) return null;
  const parent = page.nodes[destination.parentId];
  return parent.meta.locked
    ? lockedError(
        page.id,
        parent.id,
        `Locked container ${parent.id} cannot change direct children`,
      )
    : null;
}

function mapHydrationErrorToCommand(
  error: Extract<ReturnType<typeof prepareProjectHydration>, { success: false }>[
    "error"
  ],
): CommandValidationError {
  const code: CommandValidationError["code"] =
    error.stage === "props"
      ? "props-invalid"
      : error.stage === "styles"
        ? "styles-invalid"
        : error.stage === "placement"
          ? "placement-rejected"
          : error.stage === "component-lookup"
            ? "component-type-unknown"
            : "tree-invalid";

  return {
    code,
    pageId: error.pageId as PageId | undefined,
    nodeId: error.nodeId as NodeId | undefined,
    path: error.path?.split("."),
    reason: error.reason,
  };
}

function finalizeCandidate(
  candidate: CommandCandidate,
  value: CommandAppliedValue,
  mutationScope: "local" | "tree",
  services: CommandExecutorServices,
): CommandPreparationResult {
  // Store snapshots are fully hydrated before command execution. Full mode is
  // retained as the equivalence oracle; hydrate, initial load, undo, and redo
  // continue to validate untrusted or reconstructed documents in full.
  if (services.candidateValidation === "full") {
    const validation = prepareProjectHydration(candidate.document);
    if (!validation.success) {
      return rejected(mapHydrationErrorToCommand(validation.error));
    }

    return {
      status: "applied",
      candidate: {
        ...candidate,
        document: validation.value.document,
        parentById: validation.value.parentById,
      },
      value,
    };
  }

  if (mutationScope === "tree") {
    const tree = buildProjectParentIndex(candidate.document);
    if (!tree.success) {
      return rejected({
        code: "tree-invalid",
        pageId: tree.issue.pageId,
        nodeId: tree.issue.nodeId,
        reason: tree.issue.reason,
      });
    }
    candidate = { ...candidate, parentById: tree.parentById };
  }

  return {
    status: "applied",
    candidate,
    value,
  };
}

function createPage(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "page.create" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const name = command.name === undefined ? "Untitled Page" : command.name.trim();
  if (name === "") {
    return rejected({
      code: "invalid-input",
      reason: "Page name must not be empty",
    });
  }

  const existingSlugs = new Set(
    Object.values(snapshot.document.pages).map((page) => page.slug),
  );
  const explicitSlug =
    command.slug === undefined ? undefined : normalizeExplicitPageSlug(command.slug);

  if (command.slug !== undefined && (!explicitSlug || explicitSlug === "/")) {
    return rejected({
      code: "slug-invalid",
      reason: "Explicit non-home page slug is invalid",
    });
  }
  if (explicitSlug && existingSlugs.has(explicitSlug)) {
    return rejected({
      code: "slug-conflict",
      reason: `Page slug already exists: ${explicitSlug}`,
    });
  }

  const pageId = uniquePageId(snapshot.document, services.idGenerator);
  if (!pageId) {
    return rejected({
      code: "id-collision",
      reason: "Could not generate a unique page ID",
    });
  }

  const slug = explicitSlug ?? createGeneratedPageSlug(name, existingSlugs);
  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[pageId] = {
    id: pageId,
    name,
    slug,
    rootIds: [],
    nodes: {},
  };
  candidate.pageOrder.push(pageId);

  return finalizeCandidate(
    {
      document: candidate,
      parentById: snapshot.parentById,
      activePageId: pageId,
      selectedNodeId: null,
    },
    { pageId, index: candidate.pageOrder.length - 1 },
    "tree",
    services,
  );
}

function renamePage(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "page.rename" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }

  const name = command.name.trim();
  if (name === "") {
    return rejected({
      code: "invalid-input",
      pageId: command.pageId,
      reason: "Page name must not be empty",
    });
  }
  if (name === page.name) return noop("value-unchanged");

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[command.pageId].name = name;
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { pageId: command.pageId },
    "local",
    services,
  );
}

function duplicatePage(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "page.duplicate" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }

  const pageId = uniquePageId(snapshot.document, services.idGenerator);
  if (!pageId) {
    return rejected({
      code: "id-collision",
      pageId: command.pageId,
      reason: "Could not generate a unique page ID",
    });
  }

  const sourceNodeIds = Object.keys(page.nodes) as NodeId[];
  const reservedNodeIds = collectProjectNodeIds(snapshot.document);
  const idMap = Object.create(null) as Record<NodeId, NodeId>;

  for (const sourceNodeId of sourceNodeIds) {
    const duplicateNodeId = reserveUniqueNodeId(
      reservedNodeIds,
      services.idGenerator,
    );
    if (!duplicateNodeId) {
      return rejected({
        code: "id-collision",
        pageId: command.pageId,
        nodeId: sourceNodeId,
        reason: "Could not generate unique node IDs for the duplicated page",
      });
    }
    idMap[sourceNodeId] = duplicateNodeId;
  }

  const name = uniquePageCopyName(snapshot.document, page.name);
  const existingSlugs = new Set(
    Object.values(snapshot.document.pages).map((candidatePage) => candidatePage.slug),
  );
  const slug = createGeneratedPageSlug(name, existingSlugs);
  const duplicateNodes = Object.create(null) as Record<NodeId, BuilderNode>;

  for (const sourceNodeId of sourceNodeIds) {
    const sourceNode = page.nodes[sourceNodeId];
    const duplicateNodeId = idMap[sourceNodeId];
    duplicateNodes[duplicateNodeId] = {
      ...structuredClone(sourceNode),
      id: duplicateNodeId,
      childIds: sourceNode.childIds.map((childId) => idMap[childId]),
      props: remapNodeReferences(sourceNode, idMap),
      ...(sourceNode.stateBinding
        ? { stateBinding: remapStateBinding(sourceNode, idMap) }
        : {}),
    };
  }

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[pageId] = {
    id: pageId,
    name,
    slug,
    rootIds: page.rootIds.map((rootId) => idMap[rootId]),
    nodes: duplicateNodes,
  };
  const sourceIndex = candidate.pageOrder.indexOf(page.id);
  const duplicateIndex = sourceIndex + 1;
  candidate.pageOrder.splice(duplicateIndex, 0, pageId);

  return finalizeCandidate(
    {
      document: candidate,
      parentById: snapshot.parentById,
      activePageId: pageId,
      selectedNodeId: null,
    },
    {
      sourcePageId: page.id,
      pageId,
      index: duplicateIndex,
      idMap,
    },
    "tree",
    services,
  );
}

function setHomePage(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "page.setHome" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }
  if (page.id === snapshot.document.homePageId) {
    return noop("value-unchanged");
  }

  const previousHomePageId = snapshot.document.homePageId;
  const previousHomePage = snapshot.document.pages[previousHomePageId];
  const reservedSlugs = new Set(
    Object.values(snapshot.document.pages)
      .filter(
        (candidatePage) =>
          candidatePage.id !== page.id && candidatePage.id !== previousHomePageId,
      )
      .map((candidatePage) => candidatePage.slug),
  );
  const previousHomeSlug = createGeneratedPageSlug(
    previousHomePage.name,
    reservedSlugs,
  );

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.homePageId = page.id;
  candidate.pages[page.id].slug = "/";
  candidate.pages[previousHomePageId].slug = previousHomeSlug;

  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { pageId: page.id, previousHomePageId },
    "local",
    services,
  );
}

function deletePage(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "page.delete" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }
  if (
    command.pageId === snapshot.document.homePageId ||
    snapshot.document.pageOrder.length === 1
  ) {
    return rejected({
      code: "home-page-protected",
      pageId: command.pageId,
      reason: "The home page and last remaining page cannot be deleted",
    });
  }

  const lockedNode = Object.values(page.nodes).find((node) => node.meta.locked);
  if (lockedNode) {
    return lockedError(
      page.id,
      lockedNode.id,
      "A page containing a locked node cannot be deleted",
    );
  }

  const removedNodeIds = Object.keys(page.nodes) as NodeId[];
  const previousIndex = snapshot.document.pageOrder.indexOf(command.pageId);
  const candidate = cloneProjectDocument(snapshot.document);
  delete candidate.pages[command.pageId];
  candidate.pageOrder.splice(previousIndex, 1);

  let activePageId = snapshot.activePageId;
  let selectedNodeId = snapshot.selectedNodeId;
  if (command.pageId === snapshot.activePageId) {
    activePageId =
      candidate.pageOrder[previousIndex] ??
      candidate.pageOrder[previousIndex - 1] ??
      candidate.homePageId;
    selectedNodeId = null;
  }

  return finalizeCandidate(
    {
      document: candidate,
      parentById: snapshot.parentById,
      activePageId,
      selectedNodeId,
    },
    { pageId: command.pageId, removedNodeIds },
    "tree",
    services,
  );
}

function insertNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.insert" }>,
  services: CommandExecutorServices,
  mode: CommandExecutionMode,
): CommandExecutionResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }
  if (!Object.hasOwn(componentRegistry, command.componentType)) {
    return rejected({
      code: "component-type-unknown",
      pageId: command.pageId,
      reason: `Unknown component type: ${command.componentType}`,
    });
  }

  const destinationError = validateDestination(page, command.destination);
  if (destinationError) return rejected(destinationError);
  const lockedDestination = assertDestinationEditable(page, command.destination);
  if (lockedDestination) return lockedDestination;
  const placement = validatePlacementForDestination(
    page,
    command.componentType,
    command.destination,
  );
  if (placement) return placement;

  const definition = componentRegistry[command.componentType];
  const props = structuredClone(definition.defaults.props) as JsonObject;
  const styles = structuredClone(definition.defaults.styles);

  const parsedProps = definition.propsSchema.safeParse(props);
  if (!parsedProps.success) {
    return rejected({
      code: "props-invalid",
      pageId: page.id,
      reason: parsedProps.error.message,
    });
  }

  const parsedStyles = responsiveStylesSchema.safeParse(styles);
  if (!parsedStyles.success) {
    return rejected({
      code: "styles-invalid",
      pageId: page.id,
      reason: parsedStyles.error.message,
    });
  }

  if (mode === "dry-run") return { status: "valid" };

  const nodeId = reserveUniqueNodeId(
    collectProjectNodeIds(snapshot.document),
    services.idGenerator,
  );
  if (!nodeId) {
    return rejected({
      code: "id-collision",
      pageId: page.id,
      reason: "Could not generate a project-wide unique node ID",
    });
  }

  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[page.id];
  candidatePage.nodes[nodeId] = {
    id: nodeId,
    type: command.componentType,
    componentVersion: definition.version,
    childIds: [],
    props,
    styles,
    meta: {
      name: readableNodeName(page, command.componentType),
      locked: false,
    },
  };
  const siblings =
    command.destination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[command.destination.parentId].childIds;
  siblings.splice(command.destination.index, 0, nodeId);

  return finalizeCandidate(
    {
      document: candidate,
      parentById: snapshot.parentById,
      activePageId: snapshot.activePageId,
      selectedNodeId:
        command.pageId === snapshot.activePageId
          ? nodeId
          : snapshot.selectedNodeId,
    },
    { nodeId, destination: command.destination },
    "tree",
    services,
  );
}

function insertBlock(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "block.insert" }>,
  services: CommandExecutorServices,
  mode: CommandExecutionMode,
): CommandExecutionResult {
  const page = getPage(snapshot.document, command.pageId);
  if (!page) {
    return rejected({
      code: "page-not-found",
      pageId: command.pageId,
      reason: `Page does not exist: ${command.pageId}`,
    });
  }
  if (!Object.hasOwn(blockRegistry, command.blockType)) {
    return rejected({
      code: "block-type-unknown",
      pageId: command.pageId,
      reason: `Unknown block type: ${command.blockType}`,
    });
  }

  const destinationError = validateDestination(page, command.destination);
  if (destinationError) return rejected(destinationError);
  const lockedDestination = assertDestinationEditable(page, command.destination);
  if (lockedDestination) return lockedDestination;

  let template: ReturnType<typeof resolveBlockTemplate>;
  try {
    template = resolveBlockTemplate(command.blockType as BlockType);
  } catch (error) {
    return rejected({
      code: "block-invalid",
      pageId: page.id,
      reason:
        error instanceof Error
          ? error.message
          : `Block template is invalid: ${command.blockType}`,
    });
  }

  const placement = validatePlacementForDestination(
    page,
    template.type,
    command.destination,
  );
  if (placement) return placement;

  if (mode === "dry-run") return { status: "valid" };

  const templates: (typeof template)[] = [];
  const pathByTemplate = new Map<typeof template, string>();
  const collectTemplates = (node: typeof template, path: string) => {
    templates.push(node);
    pathByTemplate.set(node, path);
    node.children.forEach((child, index) => {
      collectTemplates(child, `${path}.children[${index}]`);
    });
  };
  collectTemplates(template, "root");

  const reservedIds = collectProjectNodeIds(snapshot.document);
  const idByTemplate = new Map<typeof template, NodeId>();
  const idByKey = new Map<string, NodeId>();
  for (const node of templates) {
    const nodeId = reserveUniqueNodeId(reservedIds, services.idGenerator);
    if (!nodeId) {
      return rejected({
        code: "id-collision",
        pageId: page.id,
        reason: "Could not generate unique IDs for the block subtree",
      });
    }
    idByTemplate.set(node, nodeId);
    if (node.key !== undefined) idByKey.set(node.key, nodeId);
  }

  const nodeIds = templates.map((node) => idByTemplate.get(node) as NodeId);
  const rootNodeId = nodeIds[0];
  const reservedNames = new Set(
    Object.values(page.nodes).map((node) => node.meta.name),
  );
  const materializedNodes = Object.create(null) as Record<NodeId, BuilderNode>;

  for (const node of templates) {
    const nodeId = idByTemplate.get(node) as NodeId;
    const path = pathByTemplate.get(node) as string;
    const props = structuredClone(node.props);
    for (const reference of node.nodeReferences ?? []) {
      const targetNodeId = idByKey.get(reference.targetKey);
      if (!targetNodeId) {
        return rejected({
          code: "block-invalid",
          pageId: page.id,
          reason: `Block "${command.blockType}" reference "${reference.path}" at "${path}" could not be materialized.`,
        });
      }
      props[reference.path] = targetNodeId;
    }

    const parsedProps = componentRegistry[node.type].propsSchema.safeParse(props);
    if (!parsedProps.success) {
      return rejected({
        code: "block-invalid",
        pageId: page.id,
        reason: `Block "${command.blockType}" materialized props at "${path}" are invalid.`,
      });
    }

    let stateBinding: BuilderNode["stateBinding"];
    if (node.stateBinding !== undefined) {
      const stateNodeId = idByKey.get(node.stateBinding.stateKey);
      if (!stateNodeId) {
        return rejected({
          code: "block-invalid",
          pageId: page.id,
          reason: `Block "${command.blockType}" state binding at "${path}" could not be materialized.`,
        });
      }
      const parsedBinding = booleanStateBindingSchema.safeParse({
        stateNodeId,
        on: node.stateBinding.on,
        off: node.stateBinding.off,
      });
      if (!parsedBinding.success) {
        return rejected({
          code: "block-invalid",
          pageId: page.id,
          reason: `Block "${command.blockType}" materialized state binding at "${path}" is invalid.`,
        });
      }
      stateBinding = {
        stateNodeId: asNodeId(parsedBinding.data.stateNodeId),
        on: parsedBinding.data.on,
        off: parsedBinding.data.off,
      };
    }

    materializedNodes[nodeId] = {
      id: nodeId,
      type: node.type,
      componentVersion: node.componentVersion,
      childIds: node.children.map(
        (child) => idByTemplate.get(child) as NodeId,
      ),
      props: parsedProps.data,
      styles: structuredClone(node.styles),
      ...(stateBinding !== undefined && { stateBinding }),
      meta: {
        name:
          node.nameHint === undefined
            ? nextReadableNodeName(node.type, reservedNames)
            : nextUniqueNodeName(node.nameHint, reservedNames),
        locked: false,
      },
    };
  }

  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[page.id];
  Object.assign(candidatePage.nodes, materializedNodes);
  const siblings =
    command.destination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[command.destination.parentId].childIds;
  siblings.splice(command.destination.index, 0, rootNodeId);

  return finalizeCandidate(
    {
      ...snapshot,
      document: candidate,
      selectedNodeId:
        page.id === snapshot.activePageId
          ? rootNodeId
          : snapshot.selectedNodeId,
    },
    {
      blockType: command.blockType,
      rootNodeId,
      nodeIds,
      destination: command.destination,
    },
    "tree",
    services,
  );
}

function removeNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.remove" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  const { page, node } = resolved;

  if (node.meta.locked) {
    return lockedError(page.id, node.id, "A locked node cannot be deleted");
  }

  const previousDestination = locateNode(page, snapshot.parentById, node.id);
  if (
    previousDestination.parentId !== null &&
    page.nodes[previousDestination.parentId].meta.locked
  ) {
    return lockedError(
      page.id,
      previousDestination.parentId,
      "A locked container cannot remove a direct child",
    );
  }

  const removedNodeIds = collectSubtreeNodeIds(
    snapshot.document,
    page.id,
    node.id,
  );
  const lockedDescendant = removedNodeIds.find(
    (nodeId) => page.nodes[nodeId].meta.locked,
  );
  if (lockedDescendant) {
    return lockedError(
      page.id,
      lockedDescendant,
      "A subtree containing a locked node cannot be deleted",
    );
  }

  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[page.id];
  const siblings =
    previousDestination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[previousDestination.parentId].childIds;
  siblings.splice(previousDestination.index, 1);
  for (const nodeId of removedNodeIds) delete candidatePage.nodes[nodeId];

  const selectionWasRemoved =
    snapshot.selectedNodeId !== null &&
    removedNodeIds.includes(snapshot.selectedNodeId);
  const selectedNodeId =
    page.id === snapshot.activePageId && selectionWasRemoved
      ? previousDestination.parentId
      : snapshot.selectedNodeId;

  return finalizeCandidate(
    { ...snapshot, document: candidate, selectedNodeId },
    { nodeId: node.id, removedNodeIds },
    "tree",
    services,
  );
}

function containsAncestor(
  parentById: Readonly<ParentById>,
  ancestorId: NodeId,
  candidateId: NodeId,
): boolean {
  const visited = new Set<NodeId>();
  let current: NodeId | null = candidateId;

  while (current !== null && !visited.has(current)) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = parentById[current] ?? null;
  }

  return false;
}

function moveNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.move" }>,
  services: CommandExecutorServices,
  mode: CommandExecutionMode,
): CommandExecutionResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  const { page, node } = resolved;
  const previousDestination = locateNode(page, snapshot.parentById, node.id);

  if (node.meta.locked) {
    return lockedError(page.id, node.id, "A locked node cannot be moved");
  }
  if (
    previousDestination.parentId !== null &&
    page.nodes[previousDestination.parentId].meta.locked
  ) {
    return lockedError(
      page.id,
      previousDestination.parentId,
      "A locked container cannot move a direct child",
    );
  }

  const destinationError = validateDestination(
    page,
    command.destination,
    node.id,
    previousDestination.parentId,
  );
  if (destinationError) return rejected(destinationError);
  const lockedDestination = assertDestinationEditable(page, command.destination);
  if (lockedDestination) return lockedDestination;

  if (
    command.destination.parentId !== null &&
    containsAncestor(
      snapshot.parentById,
      node.id,
      command.destination.parentId,
    )
  ) {
    return rejected({
      code: "cycle",
      pageId: page.id,
      nodeId: node.id,
      parentId: command.destination.parentId,
      reason: "A node cannot move inside itself or one of its descendants",
    });
  }

  const placement = validatePlacementForDestination(
    page,
    node.type,
    command.destination,
  );
  if (placement) return placement;

  if (
    previousDestination.parentId === command.destination.parentId &&
    previousDestination.index === command.destination.index
  ) {
    return noop("already-at-destination");
  }

  if (mode === "dry-run") return { status: "valid" };

  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[page.id];
  const oldSiblings =
    previousDestination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[previousDestination.parentId].childIds;
  oldSiblings.splice(previousDestination.index, 1);
  const newSiblings =
    command.destination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[command.destination.parentId].childIds;
  newSiblings.splice(command.destination.index, 0, node.id);

  return finalizeCandidate(
    {
      ...snapshot,
      document: candidate,
      selectedNodeId:
        page.id === snapshot.activePageId ? node.id : snapshot.selectedNodeId,
    },
    {
      nodeId: node.id,
      previousDestination,
      destination: command.destination,
    },
    "tree",
    services,
  );
}

function duplicateNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.duplicate" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  const { page, node } = resolved;

  const destinationError = validateDestination(page, command.destination);
  if (destinationError) return rejected(destinationError);
  const lockedDestination = assertDestinationEditable(page, command.destination);
  if (lockedDestination) return lockedDestination;
  const placement = validatePlacementForDestination(
    page,
    node.type,
    command.destination,
  );
  if (placement) return placement;

  const sourceIds = collectSubtreeNodeIds(snapshot.document, page.id, node.id);
  const reservedIds = collectProjectNodeIds(snapshot.document);
  const idMap = Object.create(null) as Record<NodeId, NodeId>;

  for (const sourceId of sourceIds) {
    const duplicateId = reserveUniqueNodeId(reservedIds, services.idGenerator);
    if (!duplicateId) {
      return rejected({
        code: "id-collision",
        pageId: page.id,
        nodeId: sourceId,
        reason: "Could not generate unique IDs for the duplicated subtree",
      });
    }
    idMap[sourceId] = duplicateId;
  }

  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[page.id];
  const reservedNames = new Set(
    Object.values(page.nodes).map((candidateNode) => candidateNode.meta.name),
  );

  for (const sourceId of sourceIds) {
    const source = page.nodes[sourceId];
    const duplicateId = idMap[sourceId];
    candidatePage.nodes[duplicateId] = {
      ...structuredClone(source),
      id: duplicateId,
      childIds: source.childIds.map((childId) => idMap[childId]),
      props: remapNodeReferences(source, idMap),
      ...(source.stateBinding
        ? { stateBinding: remapStateBinding(source, idMap) }
        : {}),
      meta: {
        name: nextReadableNodeName(source.type, reservedNames),
        locked: source.meta.locked,
      },
    };
  }

  const duplicateNodeId = idMap[node.id];
  const siblings =
    command.destination.parentId === null
      ? candidatePage.rootIds
      : candidatePage.nodes[command.destination.parentId].childIds;
  siblings.splice(command.destination.index, 0, duplicateNodeId);

  return finalizeCandidate(
    {
      ...snapshot,
      document: candidate,
      selectedNodeId:
        page.id === snapshot.activePageId
          ? duplicateNodeId
          : snapshot.selectedNodeId,
    },
    {
      sourceNodeId: node.id,
      duplicateNodeId,
      idMap,
      destination: command.destination,
    },
    "tree",
    services,
  );
}

function renameNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.rename" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot be renamed",
    );
  }

  const name = command.name.trim();
  if (name === "") {
    return rejected({
      code: "invalid-input",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "Node name must not be empty",
    });
  }
  if (name === resolved.node.meta.name) return noop("value-unchanged");

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[resolved.page.id].nodes[resolved.node.id].meta.name = name;
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function lockNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.lock" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked === command.locked) {
    return noop("value-unchanged");
  }

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[resolved.page.id].nodes[resolved.node.id].meta.locked =
    command.locked;
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function updateProps(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.updateProps" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot update props",
    );
  }
  if (!isJsonObject(command.nextProps)) {
    return rejected({
      code: "props-invalid",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "Props must be a JSON-compatible object",
    });
  }

  const definition = componentRegistry[resolved.node.type];
  const nextProps =
    resolved.node.type === "button"
      ? reconcileDisclosureButtonProps(
          resolved.page,
          resolved.node.props,
          command.nextProps,
        )
      : command.nextProps;
  let parsedProps: JsonObject;
  try {
    parsedProps = definition.propsSchema.parse(nextProps) as JsonObject;
  } catch (error) {
    return rejected({
      code: "props-invalid",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      path:
        error instanceof z.ZodError
          ? error.issues[0]?.path.map((part) =>
              typeof part === "symbol" ? part.description ?? "symbol" : part,
            )
          : undefined,
      reason: error instanceof Error ? error.message : "Props are invalid",
    });
  }

  if (valuesEqual(resolved.node.props, parsedProps)) return noop("value-unchanged");

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[resolved.page.id].nodes[resolved.node.id].props =
    structuredClone(parsedProps);
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function validateStateBindingTarget(
  page: Readonly<PageDocument>,
  node: Readonly<BuilderNode>,
  stateNodeId: NodeId,
): CommandPreparationResult | null {
  if (node.type === "boolean-state") {
    return rejected({
      code: "invalid-input",
      pageId: page.id,
      nodeId: node.id,
      reason: "A Boolean State cannot control its own visibility",
    });
  }

  const target = page.nodes[stateNodeId];
  if (!target) {
    return rejected({
      code: "node-not-found",
      pageId: page.id,
      nodeId: stateNodeId,
      reason: `Boolean State does not exist on this page: ${stateNodeId}`,
    });
  }
  if (target.type !== "boolean-state") {
    return rejected({
      code: "invalid-input",
      pageId: page.id,
      nodeId: stateNodeId,
      reason: "A state connection must target a Boolean State",
    });
  }

  return null;
}

function updateStateBinding(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.updateStateBinding" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot change its state connection",
    );
  }

  if (command.binding) {
    const targetError = validateStateBindingTarget(
      resolved.page,
      resolved.node,
      command.binding.stateNodeId,
    );
    if (targetError) return targetError;
  }

  if (valuesEqual(resolved.node.stateBinding, command.binding ?? undefined)) {
    return noop("value-unchanged");
  }

  const candidate = cloneProjectDocument(snapshot.document);
  const candidateNode = candidate.pages[resolved.page.id].nodes[resolved.node.id];
  if (command.binding) {
    candidateNode.stateBinding = structuredClone(command.binding);
  } else {
    delete candidateNode.stateBinding;
  }

  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function createStateAndConnect(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "state.createAndConnect" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot create a state connection",
    );
  }
  if (resolved.node.type === "boolean-state") {
    return rejected({
      code: "invalid-input",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "A Boolean State cannot control its own visibility",
    });
  }

  const name = command.name.trim();
  if (name === "") {
    return rejected({
      code: "invalid-input",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "Boolean State name must not be empty",
    });
  }

  const stateNodeId = reserveUniqueNodeId(
    collectProjectNodeIds(snapshot.document),
    services.idGenerator,
  );
  if (!stateNodeId) {
    return rejected({
      code: "id-collision",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "Could not generate a unique Boolean State ID",
    });
  }

  const definition = componentRegistry["boolean-state"];
  const candidate = cloneProjectDocument(snapshot.document);
  const candidatePage = candidate.pages[resolved.page.id];
  candidatePage.nodes[stateNodeId] = {
    id: stateNodeId,
    type: "boolean-state",
    componentVersion: definition.version,
    childIds: [],
    props: { defaultValue: command.defaultValue },
    styles: structuredClone(definition.defaults.styles),
    meta: { name, locked: false },
  };
  candidatePage.rootIds.push(stateNodeId);
  candidatePage.nodes[resolved.node.id].stateBinding = {
    stateNodeId,
    on: command.on,
    off: command.off,
  };

  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id, stateNodeId },
    "tree",
    services,
  );
}

function styleLayer(
  styles: ResponsiveStyles,
  viewport: Viewport,
): StyleValues | StylePatch {
  if (viewport === "desktop") return styles.base;
  const current = styles[viewport] ?? {};
  styles[viewport] = current;
  return current;
}

function validateStyleTarget(target: StyleTarget): boolean {
  if (!STYLE_PROPERTIES.has(target.property)) return false;
  if (target.field === undefined) return true;
  return NESTED_STYLE_FIELDS[target.property]?.has(target.field) ?? false;
}

function applyStyleChange(
  styles: ResponsiveStyles,
  viewport: Viewport,
  change: StyleChange,
): "applied" | "already-reset" | "invalid" {
  if (!validateStyleTarget(change.target)) {
    return "invalid";
  }

  const { property, field } = change.target;

  if (change.operation === "reset") {
    const currentLayer =
      viewport === "desktop" ? styles.base : styles[viewport];
    if (!currentLayer) return "already-reset";

    const layer = currentLayer as Record<string, unknown>;
    if (field === undefined) {
      if (!Object.hasOwn(layer, property)) return "already-reset";
      delete layer[property];
    } else {
      const current = layer[property];
      if (
        typeof current !== "object" ||
        current === null ||
        Array.isArray(current) ||
        !Object.hasOwn(current, field)
      ) {
        return "already-reset";
      }

      const nested = { ...current } as Record<string, unknown>;
      delete nested[field];
      if (Object.keys(nested).length === 0) delete layer[property];
      else layer[property] = nested;
    }

    if (
      viewport !== "desktop" &&
      styles[viewport] &&
      Object.keys(styles[viewport]).length === 0
    ) {
      delete styles[viewport];
    }
    return "applied";
  }

  if (!isJsonValue(change.value)) return "invalid";

  const layer = styleLayer(styles, viewport) as Record<string, unknown>;

  if (field === undefined) {
    layer[property] = structuredClone(change.value);
    return "applied";
  }

  const current = layer[property];
  const nested =
    typeof current === "object" && current !== null && !Array.isArray(current)
      ? { ...current }
      : {};
  (nested as Record<string, unknown>)[field] = structuredClone(change.value);
  layer[property] = nested;
  return "applied";
}

function updateStyles(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.updateStyles" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot update styles",
    );
  }
  if (!Array.isArray(command.changes) || command.changes.length === 0) {
    return rejected({
      code: "invalid-input",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: "Style changes must not be empty",
    });
  }

  const nextStyles = structuredClone(resolved.node.styles);
  let appliedChangeCount = 0;
  for (const change of command.changes) {
    const result = applyStyleChange(nextStyles, command.viewport, change);
    if (result === "invalid") {
      return rejected({
        code: "styles-invalid",
        pageId: resolved.page.id,
        nodeId: resolved.node.id,
        reason: "Style change contains an invalid target or value",
      });
    }
    if (result === "applied") appliedChangeCount += 1;
  }

  if (appliedChangeCount === 0) return noop("style-already-reset");

  const parsed = responsiveStylesSchema.safeParse(nextStyles);
  if (!parsed.success) {
    return rejected({
      code: "styles-invalid",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      path: parsed.error.issues[0]?.path.map((part) =>
        typeof part === "symbol" ? part.description ?? "symbol" : part,
      ),
      reason: parsed.error.issues[0]?.message ?? "Styles are invalid",
    });
  }

  const setsPositionOffset = command.changes.some(
    (change) =>
      change.operation !== "reset" &&
      change.target.property === "positionOffset",
  );
  if (setsPositionOffset) {
    const eligibility = evaluatePositioningEligibility({
      node: { ...resolved.node, styles: parsed.data },
      parentId: snapshot.parentById[resolved.node.id],
      viewport: command.viewport,
      operation: "inspector-set",
      rendered: true,
    });
    if (eligibility.status !== "allowed") {
      return rejected({
        code: "positioning-ineligible",
        pageId: resolved.page.id,
        nodeId: resolved.node.id,
        reason: eligibility.reason,
      });
    }
  }
  if (valuesEqual(resolved.node.styles, parsed.data)) return noop("value-unchanged");

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[resolved.page.id].nodes[resolved.node.id].styles = parsed.data;
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function hideNode(
  snapshot: CommandSnapshot,
  command: Extract<EditorCommand, { kind: "node.hide" }>,
  services: CommandExecutorServices,
): CommandPreparationResult {
  const resolved = resolveNode(snapshot.document, command.pageId, command.nodeId);
  if (isPreparationResult(resolved)) return resolved;
  if (resolved.node.meta.locked) {
    return lockedError(
      resolved.page.id,
      resolved.node.id,
      "A locked node cannot change visibility",
    );
  }

  const viewport = command.viewport ?? "desktop";
  const nextStyles = structuredClone(resolved.node.styles);

  if (command.hidden) {
    styleLayer(nextStyles, viewport).display = "none";
  } else if (viewport === "desktop") {
    nextStyles.base.display =
      componentRegistry[resolved.node.type].defaults.styles.base.display ?? "block";
  } else if (nextStyles[viewport]?.display === undefined) {
    return noop("style-already-reset");
  } else {
    delete nextStyles[viewport]?.display;
    if (nextStyles[viewport] && Object.keys(nextStyles[viewport]).length === 0) {
      delete nextStyles[viewport];
    }
  }

  const parsed = responsiveStylesSchema.safeParse(nextStyles);
  if (!parsed.success) {
    return rejected({
      code: "styles-invalid",
      pageId: resolved.page.id,
      nodeId: resolved.node.id,
      reason: parsed.error.issues[0]?.message ?? "Visibility styles are invalid",
    });
  }
  if (valuesEqual(resolved.node.styles, parsed.data)) return noop("value-unchanged");

  const candidate = cloneProjectDocument(snapshot.document);
  candidate.pages[resolved.page.id].nodes[resolved.node.id].styles = parsed.data;
  return finalizeCandidate(
    { ...snapshot, document: candidate },
    { nodeId: resolved.node.id },
    "local",
    services,
  );
}

function executeEditorCommandInternal(
  snapshot: CommandSnapshot,
  command: EditorCommand,
  services: CommandExecutorServices,
  mode: CommandExecutionMode,
): CommandExecutionResult {
  const commandResult = editorCommandEnvelopeSchema.safeParse(command);
  if (!commandResult.success) {
    const issue = commandResult.error.issues[0];
    return rejected({
      code: "invalid-input",
      path: issue?.path.map((part) =>
        typeof part === "symbol" ? part.description ?? "symbol" : part,
      ),
      reason: issue?.message ?? "Command shape is invalid",
    });
  }

  const validatedCommand = commandResult.data as unknown as EditorCommand;
  switch (validatedCommand.kind) {
    case "page.create":
      return createPage(snapshot, validatedCommand, services);
    case "page.rename":
      return renamePage(snapshot, validatedCommand, services);
    case "page.duplicate":
      return duplicatePage(snapshot, validatedCommand, services);
    case "page.setHome":
      return setHomePage(snapshot, validatedCommand, services);
    case "page.delete":
      return deletePage(snapshot, validatedCommand, services);
    case "node.insert":
      return insertNode(snapshot, validatedCommand, services, mode);
    case "node.remove":
      return removeNode(snapshot, validatedCommand, services);
    case "node.move":
      return moveNode(snapshot, validatedCommand, services, mode);
    case "node.duplicate":
      return duplicateNode(snapshot, validatedCommand, services);
    case "node.rename":
      return renameNode(snapshot, validatedCommand, services);
    case "node.lock":
      return lockNode(snapshot, validatedCommand, services);
    case "node.hide":
      return hideNode(snapshot, validatedCommand, services);
    case "node.updateProps":
      return updateProps(snapshot, validatedCommand, services);
    case "node.updateStyles":
      return updateStyles(snapshot, validatedCommand, services);
    case "node.updateStateBinding":
      return updateStateBinding(snapshot, validatedCommand, services);
    case "state.createAndConnect":
      return createStateAndConnect(snapshot, validatedCommand, services);
    case "block.insert":
      return insertBlock(snapshot, validatedCommand, services, mode);
  }
}

export function executeEditorCommand(
  snapshot: CommandSnapshot,
  command: EditorCommand,
  services: CommandExecutorServices = DEFAULT_SERVICES,
): CommandPreparationResult {
  const result = executeEditorCommandInternal(snapshot, command, services, "apply");
  if (result.status === "valid") {
    throw new Error("Command validation returned without applying a candidate");
  }
  return result;
}

export function dryRunEditorCommand(
  snapshot: CommandSnapshot,
  command: Extract<
    EditorCommand,
    { kind: "node.insert" | "node.move" | "block.insert" }
  >,
): CommandDryRunResult {
  const result = executeEditorCommandInternal(
    snapshot,
    command,
    DEFAULT_SERVICES,
    "dry-run",
  );
  if (result.status === "applied") {
    throw new Error("Dry-run command unexpectedly applied a candidate");
  }
  return result;
}
