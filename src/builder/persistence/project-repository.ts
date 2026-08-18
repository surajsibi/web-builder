import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  type ProjectDocument,
} from "@/builder/model/project-document";
import { cloneProjectDocument } from "@/builder/project/clone";
import {
  prepareProjectHydration,
  type HydrationError,
} from "@/builder/project/hydration";

export const MAX_PROJECT_NAME_LENGTH = 120;
export const DEFAULT_PROJECT_LIST_LIMIT = 50;
export const MAX_PROJECT_LIST_LIMIT = 100;

export type ProjectContentPayload = Pick<
  ProjectDocument,
  "schemaVersion" | "name" | "pages" | "pageOrder" | "homePageId"
>;

export type ProjectSummary = {
  projectId: string;
  name: string;
  schemaVersion: number;
  revision: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UnavailableProjectReason =
  | "invalid-project"
  | "unsupported-version";

export type UnavailableProjectSummary = {
  recoveryId: string;
  displayName: string;
  lastKnownUpdatedAt: string | null;
  reason: UnavailableProjectReason;
};

export type ProjectListItem =
  | { availability: "ready"; summary: ProjectSummary }
  | { availability: "unavailable"; summary: UnavailableProjectSummary };

export type ProjectListInput = {
  query?: string;
  cursor?: string;
  limit?: number;
};

export type ProjectListResult = {
  items: ProjectListItem[];
  nextCursor: string | null;
};

export type ProjectLoadResult = {
  document: ProjectDocument;
  migrated: boolean;
};

export type SaveProjectInput = {
  expectedRevision: number;
  content: ProjectContentPayload;
};

export type SaveProjectReceipt = {
  projectId: string;
  revision: number;
  updatedAt: string;
};

export type ProjectRepositoryErrorCode =
  | "invalid-request"
  | "not-found"
  | "invalid-project"
  | "unsupported-version"
  | "inventory-changed"
  | "revision-conflict"
  | "storage-unavailable"
  | "unexpected-storage-error";

export class ProjectRepositoryError extends Error {
  readonly code: ProjectRepositoryErrorCode;
  readonly currentRevision?: number;
  readonly unavailableProject?: UnavailableProjectSummary;

  constructor(
    code: ProjectRepositoryErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      currentRevision?: number;
      unavailableProject?: UnavailableProjectSummary;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ProjectRepositoryError";
    this.code = code;
    this.currentRevision = options?.currentRevision;
    this.unavailableProject = options?.unavailableProject;
  }
}

export interface ProjectRepository {
  list(input?: ProjectListInput): Promise<ProjectListResult>;
  create(input: { name: string }): Promise<ProjectDocument>;
  load(projectId: string): Promise<ProjectLoadResult>;
  save(projectId: string, input: SaveProjectInput): Promise<SaveProjectReceipt>;
  rename(
    projectId: string,
    input: { name: string; expectedRevision: number },
  ): Promise<SaveProjectReceipt>;
  duplicate(
    projectId: string,
    input?: { name?: string },
  ): Promise<ProjectDocument>;
}

export type StoredProjectRecord = {
  storageKey: string;
  document: unknown;
  lastOpenedAt: string | null;
};

export type PreparedStoredProject =
  | {
      availability: "ready";
      document: ProjectDocument;
      migrated: boolean;
      summary: ProjectSummary;
    }
  | {
      availability: "unavailable";
      summary: UnavailableProjectSummary;
      error: HydrationError;
    };

type UnavailablePreparedStoredProject = Extract<
  PreparedStoredProject,
  { availability: "unavailable" }
>;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function normalizeProjectName(value: string): string {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_PROJECT_NAME_LENGTH ||
    CONTROL_CHARACTERS.test(normalized)
  ) {
    throw new ProjectRepositoryError(
      "invalid-request",
      `Project name must be between 1 and ${MAX_PROJECT_NAME_LENGTH} characters`,
    );
  }
  return normalized;
}

export function defaultDuplicateProjectName(sourceName: string): string {
  const suffix = " Copy";
  const availableSourceLength = MAX_PROJECT_NAME_LENGTH - suffix.length;
  return normalizeProjectName(
    `${sourceName.trim().slice(0, availableSourceLength).trimEnd()}${suffix}`,
  );
}

export function projectContent(
  document: Readonly<ProjectDocument>,
): ProjectContentPayload {
  return structuredClone({
    schemaVersion: document.schemaVersion,
    name: document.name,
    pages: document.pages,
    pageOrder: document.pageOrder,
    homePageId: document.homePageId,
  });
}

export function projectSummary(
  document: Readonly<ProjectDocument>,
): ProjectSummary {
  return {
    projectId: document.projectId,
    name: document.name,
    schemaVersion: document.schemaVersion,
    revision: document.revision,
    pageCount: document.pageOrder.length,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function readSafeDisplayName(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return "Unavailable local project";
  }
  const name = Reflect.get(value, "name");
  if (typeof name !== "string") return "Unavailable local project";
  const normalized = name.trim();
  return normalized.length > 0 &&
    normalized.length <= MAX_PROJECT_NAME_LENGTH &&
    !CONTROL_CHARACTERS.test(normalized)
    ? normalized
    : "Unavailable local project";
}

function readSafeUpdatedAt(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const updatedAt = Reflect.get(value, "updatedAt");
  if (
    typeof updatedAt !== "string" ||
    updatedAt.length > 50 ||
    Number.isNaN(Date.parse(updatedAt))
  ) {
    return null;
  }
  return updatedAt;
}

export function unavailableReason(
  error: HydrationError,
): UnavailableProjectReason {
  if (error.stage === "component-version") return "unsupported-version";
  if (error.stage !== "document-version") return "invalid-project";
  return error.schemaVersion !== undefined && error.schemaVersion >= 0
    ? "unsupported-version"
    : "invalid-project";
}

export function prepareUnavailableStoredProject(
  recoveryId: string,
  rawDocument: unknown,
  error: HydrationError,
): UnavailablePreparedStoredProject {
  return {
    availability: "unavailable",
    summary: {
      recoveryId,
      displayName: readSafeDisplayName(rawDocument),
      lastKnownUpdatedAt: readSafeUpdatedAt(rawDocument),
      reason: unavailableReason(error),
    },
    error,
  };
}

export function prepareStoredProject(
  storageKey: string,
  rawDocument: unknown,
): PreparedStoredProject {
  const result = prepareProjectHydration(rawDocument);
  if (result.success) {
    if (result.value.document.projectId !== storageKey) {
      const error: HydrationError = {
        stage: "document-schema",
        path: "projectId",
        reason: "Stored project identity does not match its storage key",
      };
      return prepareUnavailableStoredProject(storageKey, rawDocument, error);
    }
    return {
      availability: "ready",
      document: result.value.document,
      migrated: result.value.migrated,
      summary: projectSummary(result.value.document),
    };
  }

  return prepareUnavailableStoredProject(storageKey, rawDocument, result.error);
}

export function documentFromStoredRecord(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  return Object.hasOwn(value, "document") ? Reflect.get(value, "document") : value;
}

export function assertReadyStoredProject(
  storageKey: string,
  value: unknown,
): ProjectLoadResult {
  return assertReadyPreparedStoredProject(
    prepareStoredProject(storageKey, documentFromStoredRecord(value)),
  );
}

export function assertReadyPreparedStoredProject(
  prepared: PreparedStoredProject,
): ProjectLoadResult {
  if (prepared.availability === "ready") {
    return {
      document: cloneProjectDocument(prepared.document),
      migrated: prepared.migrated,
    };
  }

  throw new ProjectRepositoryError(
    prepared.summary.reason,
    prepared.summary.reason === "unsupported-version"
      ? "This project requires an unsupported Canvas Studio version"
      : "This project cannot be opened safely",
    { unavailableProject: prepared.summary },
  );
}

export function buildSavedProject(
  current: Readonly<ProjectDocument>,
  input: SaveProjectInput,
  now: string,
): ProjectDocument {
  if (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 0) {
    throw new ProjectRepositoryError(
      "invalid-request",
      "Expected revision must be a non-negative integer",
    );
  }
  if (current.revision !== input.expectedRevision) {
    throw new ProjectRepositoryError(
      "revision-conflict",
      "The project changed after this editor loaded it",
      { currentRevision: current.revision },
    );
  }

  const candidate: ProjectDocument = {
    schemaVersion: input.content.schemaVersion,
    projectId: current.projectId,
    name: normalizeProjectName(input.content.name),
    pages: structuredClone(input.content.pages),
    pageOrder: structuredClone(input.content.pageOrder),
    homePageId: input.content.homePageId,
    createdAt: current.createdAt,
    updatedAt: now,
    revision: current.revision + 1,
  };
  const prepared = prepareProjectHydration(candidate);
  if (!prepared.success) {
    throw new ProjectRepositoryError(
      "invalid-project",
      "The project failed validation and was not saved",
    );
  }
  return prepared.value.document;
}

function itemDisplayName(item: ProjectListItem): string {
  return item.availability === "ready"
    ? item.summary.name
    : item.summary.displayName;
}

function itemUpdatedAt(item: ProjectListItem): string | null {
  return item.availability === "ready"
    ? item.summary.updatedAt
    : item.summary.lastKnownUpdatedAt;
}

function itemStableId(item: ProjectListItem): string {
  return item.availability === "ready"
    ? item.summary.projectId
    : item.summary.recoveryId;
}

type ParsedProjectCursor = {
  offset: number;
  snapshot: string | null;
};

export type ProjectPaginationState = {
  nextSnapshotId: number;
  snapshots: Map<string, string>;
};

const MAX_PROJECT_LIST_SNAPSHOTS = 16;

export function createProjectPaginationState(): ProjectPaginationState {
  return {
    nextSnapshotId: 0,
    snapshots: new Map(),
  };
}

function parseCursor(cursor: string | undefined): ParsedProjectCursor {
  if (cursor === undefined) return { offset: 0, snapshot: null };
  const match = /^project-list:([0-9a-z]+):([0-9a-z]+)$/.exec(cursor);
  if (!match) {
    throw new ProjectRepositoryError("invalid-request", "Invalid project cursor");
  }
  const offset = Number.parseInt(match[1], 36);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new ProjectRepositoryError("invalid-request", "Invalid project cursor");
  }
  return { offset, snapshot: match[2] };
}

function inventorySnapshot(items: readonly ProjectListItem[]): string {
  return JSON.stringify(
    items.map((item) =>
      item.availability === "ready"
        ? [
            "ready",
            item.summary.projectId,
            item.summary.name,
            item.summary.schemaVersion,
            item.summary.revision,
            item.summary.pageCount,
            item.summary.createdAt,
            item.summary.updatedAt,
          ]
        : [
            "unavailable",
            item.summary.recoveryId,
            item.summary.displayName,
            item.summary.lastKnownUpdatedAt,
            item.summary.reason,
          ],
    ),
  );
}

function rememberInventorySnapshot(
  paginationState: ProjectPaginationState,
  inventory: string,
): string {
  while (paginationState.snapshots.size >= MAX_PROJECT_LIST_SNAPSHOTS) {
    const oldestSnapshot = paginationState.snapshots.keys().next().value;
    if (oldestSnapshot === undefined) break;
    paginationState.snapshots.delete(oldestSnapshot);
  }
  const snapshot = (paginationState.nextSnapshotId++).toString(36);
  paginationState.snapshots.set(snapshot, inventory);
  return snapshot;
}

export function paginateProjectItems(
  items: readonly ProjectListItem[],
  input: ProjectListInput = {},
  paginationState: ProjectPaginationState,
): ProjectListResult {
  const query = input.query?.trim().toLocaleLowerCase() ?? "";
  const filtered = query
    ? items.filter((item) =>
        itemDisplayName(item).toLocaleLowerCase().includes(query),
      )
    : [...items];
  filtered.sort((left, right) => {
    const leftTime = itemUpdatedAt(left);
    const rightTime = itemUpdatedAt(right);
    if (leftTime !== null && rightTime === null) return -1;
    if (leftTime === null && rightTime !== null) return 1;
    const timeOrder = (rightTime ?? "").localeCompare(leftTime ?? "");
    return timeOrder !== 0
      ? timeOrder
      : itemStableId(left).localeCompare(itemStableId(right));
  });

  const { offset, snapshot: cursorSnapshot } = parseCursor(input.cursor);
  const requestedLimit = input.limit ?? DEFAULT_PROJECT_LIST_LIMIT;
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    throw new ProjectRepositoryError(
      "invalid-request",
      "Project list limit must be a positive integer",
    );
  }
  const limit = Math.min(requestedLimit, MAX_PROJECT_LIST_LIMIT);
  const inventory = inventorySnapshot(filtered);
  if (
    cursorSnapshot !== null &&
    paginationState.snapshots.get(cursorSnapshot) !== inventory
  ) {
    paginationState.snapshots.delete(cursorSnapshot);
    throw new ProjectRepositoryError(
      "inventory-changed",
      "Project inventory changed while pagination was in progress",
    );
  }
  const page = filtered.slice(offset, offset + limit);
  const nextOffset = offset + page.length;
  const hasNextPage = nextOffset < filtered.length;
  const snapshot = cursorSnapshot ?? (
    hasNextPage
      ? rememberInventorySnapshot(paginationState, inventory)
      : null
  );
  if (!hasNextPage && snapshot !== null) {
    paginationState.snapshots.delete(snapshot);
  }

  return {
    items: page,
    nextCursor:
      hasNextPage && snapshot !== null
        ? `project-list:${nextOffset.toString(36)}:${snapshot}`
        : null,
  };
}

export function asStoredRecord(
  document: Readonly<ProjectDocument>,
  lastOpenedAt: string | null = null,
): StoredProjectRecord {
  return {
    storageKey: document.projectId,
    document: cloneProjectDocument(document),
    lastOpenedAt,
  };
}

export function currentProjectSchemaVersion(): number {
  return CURRENT_PROJECT_SCHEMA_VERSION;
}
