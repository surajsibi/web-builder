import { z } from "zod";

import { isJsonObject } from "@/builder/model/json";
import type { JsonObject } from "@/builder/model/json";
import type { PageId } from "@/builder/model/ids";
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  type ProjectDocument,
} from "@/builder/model/project-document";
import {
  canPlaceType,
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";
import type {
  ComponentMigration,
  RuntimeSchema,
} from "@/builder/registry/define-component-registry";
import { responsiveStylesSchema } from "@/builder/styles/schema";
import type { ResponsiveStyles } from "@/builder/styles/types";

import { cloneProjectDocument } from "./clone";
import { runDocumentMigrations } from "./migrations";
import { isCanonicalNonHomeSlug } from "./slug";
import {
  buildProjectParentIndex,
  type ParentById,
  type TreeValidationIssue,
} from "./tree";

const jsonObjectSchema = z.custom<JsonObject>(isJsonObject, {
  message: "Expected a JSON-compatible object",
});

const rawNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    componentVersion: z.number().int().positive(),
    childIds: z.array(z.string().min(1)),
    props: jsonObjectSchema,
    styles: jsonObjectSchema,
    meta: z
      .object({
        name: z.string().refine((value) => value.trim().length > 0, {
          message: "Node name must not be empty",
        }),
        locked: z.boolean(),
      })
      .strict(),
  })
  .strict();

const rawPageSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().refine((value) => value.trim().length > 0, {
      message: "Page name must not be empty",
    }),
    slug: z.string().min(1),
    rootIds: z.array(z.string().min(1)),
    nodes: z.record(z.string(), rawNodeSchema),
  })
  .strict();

const currentProjectEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_PROJECT_SCHEMA_VERSION),
    projectId: z.string().min(1),
    name: z.string().refine((value) => value.trim().length > 0, {
      message: "Project name must not be empty",
    }),
    pages: z.record(z.string(), rawPageSchema),
    pageOrder: z.array(z.string().min(1)),
    homePageId: z.string().min(1),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    revision: z.number().int().nonnegative(),
  })
  .strict();

type RawProjectDocument = z.infer<typeof currentProjectEnvelopeSchema>;

export type HydrationStage =
  | "json"
  | "document-version"
  | "document-migration"
  | "document-schema"
  | "tree"
  | "component-lookup"
  | "component-version"
  | "component-migration"
  | "props"
  | "styles"
  | "placement";

export type HydrationError = {
  stage: HydrationStage;
  pageId?: string;
  nodeId?: string;
  componentType?: string;
  schemaVersion?: number;
  componentVersion?: number;
  path?: string;
  reason: string;
};

export type PreparedProject = {
  document: ProjectDocument;
  parentById: ParentById;
  migrated: boolean;
};

export type HydrationResult =
  | {
      success: true;
      value: PreparedProject;
      rawPayload: unknown;
    }
  | {
      success: false;
      error: HydrationError;
      rawPayload: unknown;
    };

type RuntimeComponentDefinition = {
  version: number;
  propsSchema: RuntimeSchema<JsonObject>;
  migrations?: readonly ComponentMigration[];
};

function firstZodIssue(error: z.ZodError): Pick<HydrationError, "path" | "reason"> {
  const issue = error.issues[0];
  return {
    path: issue?.path.map(String).join(".") || undefined,
    reason: issue?.message ?? "Schema validation failed",
  };
}

function documentSchemaError(reason: string, path?: string): HydrationResult {
  return {
    success: false,
    error: { stage: "document-schema", reason, path },
    rawPayload: undefined,
  };
}

function validateEnvelopeRelationships(
  document: RawProjectDocument,
): HydrationError | null {
  const pageKeys = Object.keys(document.pages);

  if (pageKeys.length === 0) {
    return {
      stage: "document-schema",
      path: "pages",
      reason: "A project must contain at least one page",
    };
  }

  const orderedPages = new Set(document.pageOrder);
  if (
    orderedPages.size !== document.pageOrder.length ||
    document.pageOrder.length !== pageKeys.length ||
    pageKeys.some((pageId) => !orderedPages.has(pageId))
  ) {
    return {
      stage: "document-schema",
      path: "pageOrder",
      reason: "pageOrder must contain every page exactly once",
    };
  }

  const homePage = document.pages[document.homePageId];
  if (!homePage || homePage.slug !== "/") {
    return {
      stage: "document-schema",
      pageId: document.homePageId,
      path: "homePageId",
      reason: "homePageId must reference an existing page with slug /",
    };
  }

  const slugs = new Set<string>();
  const globalNodeIds = new Set<string>();

  for (const [pageKey, page] of Object.entries(document.pages)) {
    if (pageKey !== page.id) {
      return {
        stage: "document-schema",
        pageId: page.id,
        path: `pages.${pageKey}.id`,
        reason: "Page record key must equal the embedded page ID",
      };
    }

    if (slugs.has(page.slug)) {
      return {
        stage: "document-schema",
        pageId: page.id,
        path: `pages.${pageKey}.slug`,
        reason: `Page slug is not unique: ${page.slug}`,
      };
    }
    slugs.add(page.slug);

    if (page.id !== document.homePageId && !isCanonicalNonHomeSlug(page.slug)) {
      return {
        stage: "document-schema",
        pageId: page.id,
        path: `pages.${pageKey}.slug`,
        reason: `Non-home page slug is not canonical: ${page.slug}`,
      };
    }

    for (const [nodeKey, node] of Object.entries(page.nodes)) {
      if (nodeKey !== node.id) {
        return {
          stage: "document-schema",
          pageId: page.id,
          nodeId: node.id,
          path: `pages.${pageKey}.nodes.${nodeKey}.id`,
          reason: "Node record key must equal the embedded node ID",
        };
      }
      if (globalNodeIds.has(node.id)) {
        return {
          stage: "document-schema",
          pageId: page.id,
          nodeId: node.id,
          reason: `Node ID is not project-wide unique: ${node.id}`,
        };
      }
      globalNodeIds.add(node.id);
    }
  }

  return null;
}

function asTreeError(issue: TreeValidationIssue): HydrationError {
  return {
    stage: "tree",
    pageId: issue.pageId,
    nodeId: issue.nodeId,
    reason: issue.reason,
  };
}

function isComponentType(type: string): type is ComponentType {
  return Object.hasOwn(componentRegistry, type);
}

function migrateAndValidateComponents(
  document: ProjectDocument,
): { success: true; migrated: boolean } | { success: false; error: HydrationError } {
  let migrated = false;

  for (const page of Object.values(document.pages)) {
    for (const node of Object.values(page.nodes)) {
      const untrustedType = node.type as string;

      if (!isComponentType(untrustedType)) {
        return {
          success: false,
          error: {
            stage: "component-lookup",
            pageId: page.id,
            nodeId: node.id,
            componentType: untrustedType,
            componentVersion: node.componentVersion,
            reason: `Unknown component type: ${untrustedType}`,
          },
        };
      }

      node.type = untrustedType;
      const definition = componentRegistry[
        untrustedType
      ] as unknown as RuntimeComponentDefinition;

      if (node.componentVersion > definition.version) {
        return {
          success: false,
          error: {
            stage: "component-version",
            pageId: page.id,
            nodeId: node.id,
            componentType: untrustedType,
            componentVersion: node.componentVersion,
            reason: `Future component version ${node.componentVersion} is not supported`,
          },
        };
      }

      while (node.componentVersion < definition.version) {
        const migrations = (definition.migrations ?? []).filter(
          (migration) => migration.fromVersion === node.componentVersion,
        );

        if (migrations.length !== 1) {
          return {
            success: false,
            error: {
              stage: "component-version",
              pageId: page.id,
              nodeId: node.id,
              componentType: untrustedType,
              componentVersion: node.componentVersion,
              reason:
                migrations.length === 0
                  ? `No component migration starts at version ${node.componentVersion}`
                  : `Ambiguous component migrations start at version ${node.componentVersion}`,
            },
          };
        }

        const migration = migrations[0];
        try {
          const next = migration.migrate({
            props: node.props,
            styles: node.styles as unknown as JsonObject,
          });

          if (!isJsonObject(next.props) || !isJsonObject(next.styles)) {
            throw new Error("Component migration returned non-JSON values");
          }

          node.props = next.props;
          node.styles = next.styles as unknown as ResponsiveStyles;
          node.componentVersion = migration.toVersion;
          migrated = true;
        } catch (error) {
          return {
            success: false,
            error: {
              stage: "component-migration",
              pageId: page.id,
              nodeId: node.id,
              componentType: untrustedType,
              componentVersion: node.componentVersion,
              reason:
                error instanceof Error
                  ? error.message
                  : "Component migration failed",
            },
          };
        }
      }

      try {
        node.props = definition.propsSchema.parse(node.props);
      } catch (error) {
        const zodIssue = error instanceof z.ZodError ? firstZodIssue(error) : null;
        return {
          success: false,
          error: {
            stage: "props",
            pageId: page.id,
            nodeId: node.id,
            componentType: untrustedType,
            componentVersion: node.componentVersion,
            path: zodIssue?.path,
            reason: zodIssue?.reason ?? "Component props are invalid",
          },
        };
      }

      const styleResult = responsiveStylesSchema.safeParse(node.styles);
      if (!styleResult.success) {
        const issue = firstZodIssue(styleResult.error);
        return {
          success: false,
          error: {
            stage: "styles",
            pageId: page.id,
            nodeId: node.id,
            componentType: untrustedType,
            componentVersion: node.componentVersion,
            path: issue.path,
            reason: issue.reason,
          },
        };
      }
      node.styles = styleResult.data;
    }
  }

  return { success: true, migrated };
}

function validatePlacement(document: ProjectDocument): HydrationError | null {
  for (const page of Object.values(document.pages)) {
    for (const rootId of page.rootIds) {
      const node = page.nodes[rootId];
      if (!canPlaceType(null, node.type)) {
        return {
          stage: "placement",
          pageId: page.id,
          nodeId: node.id,
          componentType: node.type,
          reason: `${node.type} cannot be placed at the page root`,
        };
      }
    }

    for (const parent of Object.values(page.nodes)) {
      for (const childId of parent.childIds) {
        const child = page.nodes[childId];
        if (!canPlaceType(parent.type, child.type)) {
          return {
            stage: "placement",
            pageId: page.id,
            nodeId: child.id,
            componentType: child.type,
            reason: `${child.type} cannot be placed inside ${parent.type}`,
          };
        }
      }
    }
  }

  return null;
}

export function prepareProjectHydration(input: unknown): HydrationResult {
  const rawPayload = input;
  let parsedInput: unknown;

  try {
    parsedInput = typeof input === "string" ? JSON.parse(input) : structuredClone(input);
  } catch (error) {
    return {
      success: false,
      error: {
        stage: "json",
        reason: error instanceof Error ? error.message : "Invalid JSON payload",
      },
      rawPayload,
    };
  }

  const migrationResult = runDocumentMigrations(parsedInput);
  if (!migrationResult.success) {
    return {
      success: false,
      error: {
        stage: migrationResult.stage,
        schemaVersion: migrationResult.schemaVersion,
        reason: migrationResult.reason,
      },
      rawPayload,
    };
  }

  const envelopeResult = currentProjectEnvelopeSchema.safeParse(
    migrationResult.value,
  );
  if (!envelopeResult.success) {
    const issue = firstZodIssue(envelopeResult.error);
    const result = documentSchemaError(issue.reason, issue.path);
    return { ...result, rawPayload };
  }

  const relationshipError = validateEnvelopeRelationships(envelopeResult.data);
  if (relationshipError) {
    return { success: false, error: relationshipError, rawPayload };
  }

  const document = envelopeResult.data as unknown as ProjectDocument;
  const initialTree = buildProjectParentIndex(document);
  if (!initialTree.success) {
    return {
      success: false,
      error: asTreeError(initialTree.issue),
      rawPayload,
    };
  }

  const componentResult = migrateAndValidateComponents(document);
  if (!componentResult.success) {
    return { success: false, error: componentResult.error, rawPayload };
  }

  const placementError = validatePlacement(document);
  if (placementError) {
    return { success: false, error: placementError, rawPayload };
  }

  const finalTree = buildProjectParentIndex(document);
  if (!finalTree.success) {
    return {
      success: false,
      error: asTreeError(finalTree.issue),
      rawPayload,
    };
  }

  return {
    success: true,
    value: {
      document: cloneProjectDocument(document),
      parentById: finalTree.parentById,
      migrated: migrationResult.migrated || componentResult.migrated,
    },
    rawPayload,
  };
}

export function resolveInitialActivePage(
  document: Readonly<ProjectDocument>,
  requestedPageId?: string,
): PageId {
  if (requestedPageId && Object.hasOwn(document.pages, requestedPageId)) {
    return requestedPageId as PageId;
  }

  return document.homePageId;
}
