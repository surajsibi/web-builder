import { createStore, type StoreApi } from "zustand/vanilla";

import {
  executeEditorCommand,
  type CommandExecutorServices,
} from "@/builder/commands/execute-command";
import type {
  CommandDispatchOptions,
  CommandResult,
  EditorCommand,
} from "@/builder/commands/types";
import type { NodeId, PageId } from "@/builder/model/ids";
import type {
  DragSession,
  EditorDropTarget,
} from "@/builder/interaction/types";
import type {
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";
import { cloneProjectDocument } from "@/builder/project/clone";
import {
  prepareProjectHydration,
  resolveInitialActivePage,
  type HydrationResult,
} from "@/builder/project/hydration";
import { createId, type IdGenerator } from "@/builder/project/id-generator";
import type { ParentById } from "@/builder/project/tree";
import type { Viewport } from "@/builder/styles/types";

export type DocumentContentSnapshot = {
  name: string;
  pages: Record<PageId, PageDocument>;
  pageOrder: PageId[];
  homePageId: PageId;
};

export type HistoryEntry = {
  before: DocumentContentSnapshot;
  after: DocumentContentSnapshot;
  historyGroupId?: string;
};

export type HistoryState = {
  past: HistoryEntry[];
  future: HistoryEntry[];
};

export type SessionActionResult =
  | { status: "applied" }
  | { status: "noop" }
  | { status: "rejected"; reason: string };

export type HistoryActionResult =
  | { status: "applied"; commitId: number }
  | { status: "noop" }
  | { status: "failed"; message: string };

export type BuilderStoreState = {
  document: ProjectDocument | null;
  parentById: ParentById;
  activePageId: PageId | null;
  selectedNodeId: NodeId | null;
  activeViewport: Viewport;
  dirty: boolean;
  commitId: number;
  history: HistoryState;
  hydrated: boolean;
  dragSession: DragSession | null;
  activeDropTarget: EditorDropTarget | null;

  hydrateProject: (
    input: unknown,
    requestedActivePageId?: string,
  ) => HydrationResult;
  dispatchEditorCommand: (
    command: EditorCommand,
    options?: CommandDispatchOptions,
  ) => CommandResult;
  setActivePage: (pageId: PageId) => SessionActionResult;
  selectNode: (nodeId: NodeId) => SessionActionResult;
  clearSelection: () => SessionActionResult;
  setViewport: (viewport: Viewport) => SessionActionResult;
  setDragSession: (session: DragSession | null) => SessionActionResult;
  setActiveDropTarget: (
    target: EditorDropTarget | null,
  ) => SessionActionResult;
  undo: () => HistoryActionResult;
  redo: () => HistoryActionResult;
};

type CreateBuilderStoreOptions = {
  initialDocument?: ProjectDocument;
  idGenerator?: IdGenerator;
};

const EMPTY_HISTORY: HistoryState = { past: [], future: [] };

function contentSnapshot(
  document: Readonly<ProjectDocument>,
): DocumentContentSnapshot {
  return structuredClone({
    name: document.name,
    pages: document.pages,
    pageOrder: document.pageOrder,
    homePageId: document.homePageId,
  });
}

function applyContentSnapshot(
  document: Readonly<ProjectDocument>,
  snapshot: Readonly<DocumentContentSnapshot>,
): ProjectDocument {
  const candidate = cloneProjectDocument(document);
  candidate.name = snapshot.name;
  candidate.pages = structuredClone(snapshot.pages);
  candidate.pageOrder = structuredClone(snapshot.pageOrder);
  candidate.homePageId = snapshot.homePageId;
  return candidate;
}

function nextHistory(
  current: Readonly<HistoryState>,
  before: DocumentContentSnapshot,
  after: DocumentContentSnapshot,
  historyGroupId?: string,
): HistoryState {
  const past = [...current.past];
  const last = past.at(-1);

  if (
    historyGroupId !== undefined &&
    last?.historyGroupId === historyGroupId
  ) {
    past[past.length - 1] = {
      ...last,
      after,
    };
  } else {
    past.push({ before, after, historyGroupId });
  }

  return { past, future: [] };
}

function chooseSurvivingActivePage(
  nextDocument: Readonly<ProjectDocument>,
  previousDocument: Readonly<ProjectDocument>,
  previousActivePageId: PageId,
): PageId {
  if (Object.hasOwn(nextDocument.pages, previousActivePageId)) {
    return previousActivePageId;
  }

  const previousIndex = previousDocument.pageOrder.indexOf(previousActivePageId);
  return (
    nextDocument.pageOrder[previousIndex] ??
    nextDocument.pageOrder[previousIndex - 1] ??
    nextDocument.homePageId
  );
}

function reconcileSelection(
  previousSelectedNodeId: NodeId | null,
  previousActivePageId: PageId,
  nextActivePageId: PageId,
  previousParentById: Readonly<ParentById>,
  nextDocument: Readonly<ProjectDocument>,
): NodeId | null {
  if (
    previousSelectedNodeId === null ||
    previousActivePageId !== nextActivePageId
  ) {
    return null;
  }

  const nextPage = nextDocument.pages[nextActivePageId];
  let candidate: NodeId | null = previousSelectedNodeId;

  while (candidate !== null) {
    if (Object.hasOwn(nextPage.nodes, candidate)) return candidate;
    candidate = previousParentById[candidate] ?? null;
  }

  return null;
}

function failureId(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `command-failure-${Date.now().toString(36)}`;
}

export function createBuilderStore(
  options: CreateBuilderStoreOptions = {},
): StoreApi<BuilderStoreState> {
  const executorServices: CommandExecutorServices = {
    idGenerator: options.idGenerator ?? createId,
  };

  const initialPrepared = options.initialDocument
    ? prepareProjectHydration(options.initialDocument)
    : null;

  if (initialPrepared && !initialPrepared.success) {
    throw new Error(
      `Initial project failed hydration: ${initialPrepared.error.reason}`,
    );
  }

  const initialDocument = initialPrepared?.success
    ? initialPrepared.value.document
    : null;
  const initialParentById = initialPrepared?.success
    ? initialPrepared.value.parentById
    : (Object.create(null) as ParentById);

  return createStore<BuilderStoreState>((set, get) => ({
    document: initialDocument,
    parentById: initialParentById,
    activePageId: initialDocument?.homePageId ?? null,
    selectedNodeId: null,
    activeViewport: "desktop",
    dirty: initialPrepared?.success ? initialPrepared.value.migrated : false,
    commitId: 0,
    history: EMPTY_HISTORY,
    hydrated: initialDocument !== null,
    dragSession: null,
    activeDropTarget: null,

    hydrateProject: (input, requestedActivePageId) => {
      const result = prepareProjectHydration(input);
      if (!result.success) return result;

      set({
        document: result.value.document,
        parentById: result.value.parentById,
        activePageId: resolveInitialActivePage(
          result.value.document,
          requestedActivePageId,
        ),
        selectedNodeId: null,
        activeViewport: "desktop",
        dirty: result.value.migrated,
        commitId: 0,
        history: { past: [], future: [] },
        hydrated: true,
        dragSession: null,
        activeDropTarget: null,
      });

      return result;
    },

    dispatchEditorCommand: (command, dispatchOptions) => {
      const state = get();
      if (!state.document || !state.activePageId) {
        return {
          status: "rejected",
          error: {
            code: "invalid-input",
            reason: "No project has been hydrated",
          },
        };
      }

      try {
        const preparation = executeEditorCommand(
          {
            document: state.document,
            parentById: state.parentById,
            activePageId: state.activePageId,
            selectedNodeId: state.selectedNodeId,
          },
          command,
          executorServices,
        );

        if (preparation.status !== "applied") return preparation;

        const commitId = state.commitId + 1;
        const history = nextHistory(
          state.history,
          contentSnapshot(state.document),
          contentSnapshot(preparation.candidate.document),
          dispatchOptions?.historyGroupId,
        );

        set({
          document: preparation.candidate.document,
          parentById: preparation.candidate.parentById,
          activePageId: preparation.candidate.activePageId,
          selectedNodeId: preparation.candidate.selectedNodeId,
          dirty: true,
          commitId,
          history,
        });

        return {
          status: "applied",
          commitId,
          value: preparation.value,
        };
      } catch (error) {
        return {
          status: "failed",
          errorId: failureId(),
          message:
            error instanceof Error
              ? error.message
              : "Unexpected command execution failure",
        };
      }
    },

    setActivePage: (pageId) => {
      const state = get();
      if (!state.document || !Object.hasOwn(state.document.pages, pageId)) {
        return {
          status: "rejected",
          reason: `Page does not exist: ${pageId}`,
        };
      }
      if (state.activePageId === pageId) return { status: "noop" };

      set({
        activePageId: pageId,
        selectedNodeId: null,
        dragSession: null,
        activeDropTarget: null,
      });
      return { status: "applied" };
    },

    selectNode: (nodeId) => {
      const state = get();
      if (!state.document || !state.activePageId) {
        return { status: "rejected", reason: "No project has been hydrated" };
      }
      const activePage = state.document.pages[state.activePageId];
      if (!Object.hasOwn(activePage.nodes, nodeId)) {
        return {
          status: "rejected",
          reason: `Node does not belong to the active page: ${nodeId}`,
        };
      }
      if (state.selectedNodeId === nodeId) return { status: "noop" };

      set({ selectedNodeId: nodeId });
      return { status: "applied" };
    },

    clearSelection: () => {
      if (get().selectedNodeId === null) return { status: "noop" };
      set({ selectedNodeId: null });
      return { status: "applied" };
    },

    setViewport: (viewport) => {
      if (!["desktop", "tablet", "mobile"].includes(viewport)) {
        return { status: "rejected", reason: `Unknown viewport: ${viewport}` };
      }
      if (get().activeViewport === viewport) return { status: "noop" };

      set({ activeViewport: viewport });
      return { status: "applied" };
    },

    setDragSession: (session) => {
      const state = get();
      if (JSON.stringify(state.dragSession) === JSON.stringify(session)) {
        return { status: "noop" };
      }

      set({
        dragSession: session,
        activeDropTarget: session === null ? null : state.activeDropTarget,
      });
      return { status: "applied" };
    },

    setActiveDropTarget: (target) => {
      const state = get();
      if (target !== null && state.dragSession === null) {
        return {
          status: "rejected",
          reason: "A drop target requires an active drag session",
        };
      }
      if (JSON.stringify(state.activeDropTarget) === JSON.stringify(target)) {
        return { status: "noop" };
      }

      set({ activeDropTarget: target });
      return { status: "applied" };
    },

    undo: () => {
      const state = get();
      if (!state.document || !state.activePageId || state.history.past.length === 0) {
        return { status: "noop" };
      }

      const entry = state.history.past.at(-1);
      if (!entry) return { status: "noop" };

      const candidate = applyContentSnapshot(state.document, entry.before);
      const prepared = prepareProjectHydration(candidate);
      if (!prepared.success) {
        return { status: "failed", message: prepared.error.reason };
      }

      const activePageId = chooseSurvivingActivePage(
        prepared.value.document,
        state.document,
        state.activePageId,
      );
      const selectedNodeId = reconcileSelection(
        state.selectedNodeId,
        state.activePageId,
        activePageId,
        state.parentById,
        prepared.value.document,
      );
      const commitId = state.commitId + 1;

      set({
        document: prepared.value.document,
        parentById: prepared.value.parentById,
        activePageId,
        selectedNodeId,
        dirty: true,
        commitId,
        history: {
          past: state.history.past.slice(0, -1),
          future: [...state.history.future, entry],
        },
      });

      return { status: "applied", commitId };
    },

    redo: () => {
      const state = get();
      if (!state.document || !state.activePageId || state.history.future.length === 0) {
        return { status: "noop" };
      }

      const entry = state.history.future.at(-1);
      if (!entry) return { status: "noop" };

      const candidate = applyContentSnapshot(state.document, entry.after);
      const prepared = prepareProjectHydration(candidate);
      if (!prepared.success) {
        return { status: "failed", message: prepared.error.reason };
      }

      const activePageId = chooseSurvivingActivePage(
        prepared.value.document,
        state.document,
        state.activePageId,
      );
      const selectedNodeId = reconcileSelection(
        state.selectedNodeId,
        state.activePageId,
        activePageId,
        state.parentById,
        prepared.value.document,
      );
      const commitId = state.commitId + 1;

      set({
        document: prepared.value.document,
        parentById: prepared.value.parentById,
        activePageId,
        selectedNodeId,
        dirty: true,
        commitId,
        history: {
          past: [...state.history.past, entry],
          future: state.history.future.slice(0, -1),
        },
      });

      return { status: "applied", commitId };
    },
  }));
}
