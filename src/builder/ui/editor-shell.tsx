"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import type {
  CommandResult,
  EditorCommand,
  StyleChange,
} from "@/builder/commands/types";
import type { JsonObject } from "@/builder/model/json";
import type { NodeId, PageId } from "@/builder/model/ids";
import {
  blockRegistry,
  resolveBlockTemplate,
  type BlockType,
} from "@/builder/registry/block-registry";
import type { ComponentType } from "@/builder/registry/component-registry";
import { componentRegistry } from "@/builder/registry/component-registry";
import {
  HEADING_LEVEL_FONT_SIZE_PX,
  type HeadingProps,
} from "@/builder/registry/components/component-definitions";
import type { LengthValue } from "@/builder/styles/types";
import {
  type BuilderStoreState,
  type HistoryActionResult,
  type SessionActionResult,
} from "@/builder/store/builder-store";
import { editorStore } from "@/builder/store/editor-store";
import {
  createPreviewHref,
  createPreviewSnapshotId,
  storePreviewSnapshot,
} from "@/builder/preview/preview-snapshot";
import { EditorCanvas } from "@/builder/ui/editor-canvas";
import { EditorLeftSidebar } from "@/builder/ui/editor-left-sidebar";
import { EditorToolbar } from "@/builder/ui/editor-toolbar";
import { InspectorPanel } from "@/builder/ui/inspector-panel";
import {
  previewStyleForChanges,
  type SpacingMode,
  type SpacingProperty,
  type VisualEditSession,
  type VisualOverlayMode,
} from "@/builder/ui/visual-editing";
import { resolveClickInsertionTarget } from "@/builder/ui/insertion-target";
import {
  commandForEditorDrop,
  readEditorDropTarget,
  readEditorDragSource,
} from "@/builder/ui/drag-and-drop";
import {
  duplicateDestination,
  parentSelectionTarget,
} from "@/builder/ui/tree-navigation";

type EditorShellProps = {
  store?: StoreApi<BuilderStoreState>;
};

type VisualEditingState = {
  session: VisualEditSession | null;
  mode: VisualOverlayMode;
  spacingModes: Record<SpacingProperty, SpacingMode>;
};

type VisualEditingAction =
  | { type: "preview"; session: VisualEditSession }
  | { type: "cancel" }
  | { type: "set-mode"; mode: VisualOverlayMode }
  | { type: "set-spacing-mode"; property: SpacingProperty; mode: SpacingMode }
  | { type: "reset" };

const INITIAL_VISUAL_EDITING_STATE: VisualEditingState = {
  session: null,
  mode: "none",
  spacingModes: { padding: "axes", margin: "axes" },
};

function reduceVisualEditing(
  state: VisualEditingState,
  action: VisualEditingAction,
): VisualEditingState {
  if (action.type === "preview") return { ...state, session: action.session };
  if (action.type === "cancel") return { ...state, session: null };
  if (action.type === "set-mode") {
    return { ...state, session: null, mode: action.mode };
  }
  if (action.type === "set-spacing-mode") {
    return {
      ...state,
      session: null,
      spacingModes: { ...state.spacingModes, [action.property]: action.mode },
    };
  }
  return { ...state, session: null, mode: "none" };
}

type EditorActionResult =
  | CommandResult
  | SessionActionResult
  | HistoryActionResult;

function actionMessage(result: EditorActionResult, successMessage: string): string {
  if (result.status === "applied") return successMessage;
  if (result.status === "noop") {
    return "No change was needed" + ("reason" in result ? ": " + result.reason : ".");
  }
  if (result.status === "rejected") {
    return "Change rejected: " + ("error" in result ? result.error.reason : result.reason);
  }
  return "Change failed: " + result.message;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('[contenteditable="true"], [contenteditable="plaintext-only"]') !==
      null ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function isHeadingLevel(value: unknown): value is HeadingProps["level"] {
  return (
    typeof value === "string" &&
    Object.hasOwn(HEADING_LEVEL_FONT_SIZE_PX, value)
  );
}

function usesHeadingLevelPreset(
  fontSize: LengthValue | undefined,
  level: HeadingProps["level"],
): boolean {
  if (fontSize === undefined) return true;
  if ("keyword" in fontSize || fontSize.unit !== "px") return false;

  return (
    fontSize.value === HEADING_LEVEL_FONT_SIZE_PX[level] ||
    fontSize.value === HEADING_LEVEL_FONT_SIZE_PX.h2
  );
}

export function EditorShell({ store = editorStore }: EditorShellProps) {
  const state = useStore(store);
  const [announcement, setAnnouncement] = useState(
    "Editor ready. Choose a component to begin.",
  );
  const [visualEditing, dispatchVisualEditing] = useReducer(
    reduceVisualEditing,
    INITIAL_VISUAL_EDITING_STATE,
  );
  const visualEditSession = visualEditing.session;
  const visualMode = visualEditing.mode;
  const spacingModes = visualEditing.spacingModes;
  const visualEditSessionRef = useRef<VisualEditSession | null>(null);
  const document = state.document;
  const activePage =
    document && state.activePageId ? document.pages[state.activePageId] : null;
  const selectedNode =
    activePage && state.selectedNodeId
      ? activePage.nodes[state.selectedNodeId]
      : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      const current = store.getState();
      if (
        !current.document ||
        !current.activePageId ||
        current.dragSession !== null
      ) {
        return;
      }
      const page = current.document.pages[current.activePageId];
      const nodeId = current.selectedNodeId;
      if (!nodeId) return;

      if (event.key === "Escape") {
        if (visualEditSessionRef.current) {
          event.preventDefault();
          visualEditSessionRef.current = null;
          dispatchVisualEditing({ type: "cancel" });
          setAnnouncement("Visual edit canceled.");
          return;
        }
        const parentId = parentSelectionTarget(page, current.parentById, nodeId);
        if (!parentId) return;
        event.preventDefault();
        const result = current.selectNode(parentId);
        setAnnouncement(
          actionMessage(result, `Selected parent ${page.nodes[parentId].meta.name}.`),
        );
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        const nodeName = page.nodes[nodeId].meta.name;
        const result = current.dispatchEditorCommand({
          kind: "node.remove",
          pageId: page.id,
          nodeId,
        });
        setAnnouncement(actionMessage(result, `Deleted ${nodeName}.`));
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const nodeName = page.nodes[nodeId].meta.name;
        const result = current.dispatchEditorCommand({
          kind: "node.duplicate",
          pageId: page.id,
          nodeId,
          destination: duplicateDestination(page, current.parentById, nodeId),
        });
        setAnnouncement(actionMessage(result, `Duplicated ${nodeName}.`));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);

  useEffect(() => {
    visualEditSessionRef.current = visualEditSession;
  }, [visualEditSession]);

  const previewStyles = useMemo(() => {
    if (!visualEditSession || !activePage) return {};
    const node = activePage.nodes[visualEditSession.nodeId];
    if (!node) return {};
    return {
      [node.id]: previewStyleForChanges(
        node.styles,
        state.activeViewport,
        visualEditSession.changes,
      ),
    };
  }, [activePage, state.activeViewport, visualEditSession]);

  if (!document || !activePage || !state.activePageId) {
    return (
      <main className="editor-load-error">
        <h1>Project unavailable</h1>
        <p>The editor could not hydrate a valid project document.</p>
      </main>
    );
  }

  const activePageId = state.activePageId;
  const previewSnapshotId = createPreviewSnapshotId(
    document.projectId,
    activePageId,
    state.commitId,
  );

  const runCommand = (command: EditorCommand, successMessage: string) => {
    const result = state.dispatchEditorCommand(command);
    setAnnouncement(actionMessage(result, successMessage));
  };

  const resetVisualEditing = () => {
    visualEditSessionRef.current = null;
    dispatchVisualEditing({ type: "reset" });
  };

  const insertionTarget = (type: ComponentType) =>
    resolveClickInsertionTarget(
      activePage,
      state.parentById,
      state.selectedNodeId,
      type,
    );

  const insertComponent = (type: ComponentType) => {
    resetVisualEditing();
    const target = insertionTarget(type);
    if (!target) {
      setAnnouncement("This component cannot be inserted at the current target.");
      return;
    }

    runCommand(
      {
        kind: "node.insert",
        pageId: activePage.id,
        componentType: type,
        destination: target.destination,
      },
      "Added " + type + " at " + target.label + ".",
    );
  };

  const blockInsertionTarget = (type: BlockType) =>
    insertionTarget(resolveBlockTemplate(type).type);

  const insertBlock = (type: BlockType) => {
    resetVisualEditing();
    const target = blockInsertionTarget(type);
    if (!target) {
      setAnnouncement("This block cannot be inserted at the current target.");
      return;
    }

    runCommand(
      {
        kind: "block.insert",
        pageId: activePage.id,
        blockType: type,
        destination: target.destination,
      },
      `Added ${blockRegistry[type].label} at ${target.label}.`,
    );
  };

  const selectNode = (nodeId: NodeId) => {
    resetVisualEditing();
    const node = activePage.nodes[nodeId];
    const result = state.selectNode(nodeId);
    setAnnouncement(
      actionMessage(result, "Selected " + node.meta.name + "."),
    );
  };

  const clearSelection = () => {
    resetVisualEditing();
    const result = state.clearSelection();
    setAnnouncement(actionMessage(result, "Selection cleared."));
  };

  const startTextEdit = (nodeId: NodeId) => {
    resetVisualEditing();
    const node = activePage.nodes[nodeId];
    if (!node) return;
    setAnnouncement(
      `Editing ${node.meta.name}. Press Enter to save or Escape to cancel.`,
    );
  };

  const commitTextEdit = (nodeId: NodeId, text: string): boolean => {
    const node = activePage.nodes[nodeId];
    if (!node) {
      setAnnouncement("Change rejected: the edited component is unavailable.");
      return false;
    }

    const result = state.dispatchEditorCommand({
      kind: "node.updateProps",
      pageId: activePage.id,
      nodeId,
      nextProps: { ...node.props, text },
    });
    setAnnouncement(
      actionMessage(result, `Updated ${node.meta.name} content.`),
    );
    return result.status === "applied" || result.status === "noop";
  };

  const cancelTextEdit = (nodeId: NodeId) => {
    const node = activePage.nodes[nodeId];
    setAnnouncement(
      node ? `Canceled editing ${node.meta.name}.` : "Text editing canceled.",
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    resetVisualEditing();
    runCommand(
      {
        kind: "node.remove",
        pageId: activePage.id,
        nodeId: selectedNode.id,
      },
      `Deleted ${selectedNode.meta.name}.`,
    );
  };

  const renameSelectedNode = (name: string) => {
    if (!selectedNode) return;
    runCommand(
      {
        kind: "node.rename",
        pageId: activePage.id,
        nodeId: selectedNode.id,
        name,
      },
      `Renamed ${selectedNode.meta.name} to ${name}.`,
    );
  };

  const switchPage = (pageId: PageId) => {
    resetVisualEditing();
    const page = document.pages[pageId];
    const result = state.setActivePage(pageId);
    setAnnouncement(actionMessage(result, "Opened " + page.name + "."));
  };

  const updateProps = (nextProps: JsonObject) => {
    if (!selectedNode) return;
    const command = {
      kind: "node.updateProps",
      pageId: activePage.id,
      nodeId: selectedNode.id,
      nextProps,
    } satisfies EditorCommand;
    const previousLevel = selectedNode.props.level;
    const nextLevel = nextProps.level;
    const shouldUpdateHeadingPreset =
      selectedNode.type === "heading" &&
      isHeadingLevel(previousLevel) &&
      isHeadingLevel(nextLevel) &&
      previousLevel !== nextLevel &&
      usesHeadingLevelPreset(selectedNode.styles.base.fontSize, previousLevel);

    if (!shouldUpdateHeadingPreset) {
      runCommand(
        command,
        "Updated " + selectedNode.meta.name + " content.",
      );
      return;
    }

    const historyGroupId = `heading-level:${selectedNode.id}:${state.commitId + 1}`;
    const propsResult = state.dispatchEditorCommand(command, { historyGroupId });
    if (propsResult.status !== "applied") {
      setAnnouncement(
        actionMessage(
          propsResult,
          "Updated " + selectedNode.meta.name + " level.",
        ),
      );
      return;
    }

    const stylesResult = store.getState().dispatchEditorCommand(
      {
        kind: "node.updateStyles",
        pageId: activePage.id,
        nodeId: selectedNode.id,
        viewport: "desktop",
        changes: [
          {
            target: { property: "fontSize" },
            value: {
              value: HEADING_LEVEL_FONT_SIZE_PX[nextLevel],
              unit: "px",
            },
          },
        ],
      },
      { historyGroupId },
    );
    setAnnouncement(
      actionMessage(
        stylesResult,
        "Updated " + selectedNode.meta.name + " level.",
      ),
    );
  };

  const updateStyles = (
    changes: readonly [StyleChange, ...StyleChange[]],
  ) => {
    if (!selectedNode) return;
    runCommand(
      {
        kind: "node.updateStyles",
        pageId: activePage.id,
        nodeId: selectedNode.id,
        viewport: state.activeViewport,
        changes,
      },
      "Updated " + selectedNode.meta.name + " " + state.activeViewport + " styles.",
    );
  };

  const previewVisualEdit = (session: VisualEditSession) => {
    visualEditSessionRef.current = session;
    dispatchVisualEditing({ type: "preview", session });
  };

  const cancelVisualEdit = () => {
    visualEditSessionRef.current = null;
    dispatchVisualEditing({ type: "cancel" });
    setAnnouncement("Visual edit canceled.");
  };

  const commitVisualEdit = (session: VisualEditSession) => {
    const current = store.getState();
    const pageId = current.activePageId;
    const node =
      pageId && current.document
        ? current.document.pages[pageId]?.nodes[session.nodeId]
        : null;
    visualEditSessionRef.current = null;
    dispatchVisualEditing({ type: "cancel" });
    if (!pageId || !node) {
      setAnnouncement("Change rejected: the edited component is unavailable.");
      return;
    }
    const result = current.dispatchEditorCommand({
      kind: "node.updateStyles",
      pageId,
      nodeId: session.nodeId,
      viewport: current.activeViewport,
      changes: session.changes,
    });
    setAnnouncement(
      actionMessage(
        result,
        `Updated ${node.meta.name} ${current.activeViewport} styles.`,
      ),
    );
  };

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        const current = store.getState();
        const source = current.dragSession?.source ?? null;
        const target =
          readEditorDropTarget(event.operation.target?.data) ??
          current.activeDropTarget;

        if (!event.canceled && source && target && current.activePageId) {
          const page = current.document?.pages[current.activePageId];
          const sourceName =
            source.kind === "component"
              ? source.componentType
              : source.kind === "block"
                ? blockRegistry[source.blockType].label
                : page?.nodes[source.nodeId]?.meta.name ?? "node";
          const result = current.dispatchEditorCommand(
            commandForEditorDrop(current.activePageId, source, target),
          );
          setAnnouncement(
            actionMessage(
              result,
              source.kind === "node"
                ? `Moved ${sourceName} to ${target.label}.`
                : `Added ${sourceName} at ${target.label}.`,
            ),
          );
        } else if (event.canceled) {
          setAnnouncement("Drag canceled.");
        } else {
          setAnnouncement("No valid drop target was selected.");
        }

        current.setDragSession(null);
      }}
      onDragOver={(event) => {
        const current = store.getState();
        if (!current.dragSession) return;
        current.setActiveDropTarget(
          readEditorDropTarget(event.operation.target?.data),
        );
      }}
      onDragStart={(event) => {
        const source = readEditorDragSource(event.operation.source?.data);
        if (!source) return;
        const current = store.getState();
        visualEditSessionRef.current = null;
        dispatchVisualEditing({ type: "reset" });
        current.setDragSession({ source });
        if (source.kind === "node") current.selectNode(source.nodeId);
        setAnnouncement("Dragging. Choose a highlighted destination.");
      }}
    >
    <div className="editor-shell">
      <EditorToolbar
        activePageId={state.activePageId}
        activeViewport={state.activeViewport}
        canRedo={state.history.future.length > 0}
        canUndo={state.history.past.length > 0}
        dirty={state.dirty}
        onPreviewOpen={(event) => {
          try {
            storePreviewSnapshot(window.localStorage, previewSnapshotId, {
              document,
              activePageId,
            });
          } catch {
            event.preventDefault();
            setAnnouncement(
              "Preview could not open because browser storage is unavailable.",
            );
          }
        }}
        onPageChange={switchPage}
        onRedo={() => {
          resetVisualEditing();
          setAnnouncement(actionMessage(state.redo(), "Redid the last change."));
        }}
        onUndo={() => {
          resetVisualEditing();
          setAnnouncement(actionMessage(state.undo(), "Undid the last change."));
        }}
        onViewportChange={(viewport) => {
          resetVisualEditing();
          setAnnouncement(
            actionMessage(
              state.setViewport(viewport),
              "Switched to " + viewport + " viewport.",
            ),
          );
        }}
        pages={document.pageOrder.map((pageId) => document.pages[pageId])}
        previewHref={createPreviewHref(previewSnapshotId)}
        projectName={document.name}
      />

      <div className="editor-workspace">
        <EditorLeftSidebar
          activeDropTarget={state.activeDropTarget}
          dragSource={state.dragSession?.source ?? null}
          getBlockInsertionLabel={(type) =>
            blockInsertionTarget(type)?.label ?? "Unavailable"
          }
          getComponentInsertionLabel={(type) =>
            insertionTarget(type)?.label ?? "Unavailable"
          }
          onInsertBlock={insertBlock}
          onInsertComponent={insertComponent}
          onSelectNode={selectNode}
          page={activePage}
          parentById={state.parentById}
          selectedNodeId={state.selectedNodeId}
          viewport={state.activeViewport}
        />

        <EditorCanvas
          activeDropTarget={state.activeDropTarget}
          dragSource={state.dragSession?.source ?? null}
          onClearSelection={clearSelection}
          onCancelVisualEdit={cancelVisualEdit}
          onCancelTextEdit={cancelTextEdit}
          onCommitVisualEdit={commitVisualEdit}
          onCommitTextEdit={commitTextEdit}
          onPreviewVisualEdit={previewVisualEdit}
          onSelectNode={selectNode}
          onStartTextEdit={startTextEdit}
          page={activePage}
          parentById={state.parentById}
          previewStyles={previewStyles}
          selectedNodeId={state.selectedNodeId}
          spacingModes={spacingModes}
          viewport={state.activeViewport}
          visualMode={visualMode}
        />

        <InspectorPanel
          isRoot={
            selectedNode
              ? (state.parentById[selectedNode.id] ?? null) === null
              : false
          }
          node={selectedNode}
          onDelete={deleteSelectedNode}
          onRename={renameSelectedNode}
          onUpdateProps={updateProps}
          onUpdateStyles={updateStyles}
          onSpacingModeChange={(property, mode) => {
            if (visualEditSessionRef.current) cancelVisualEdit();
            dispatchVisualEditing({ type: "set-spacing-mode", property, mode });
          }}
          onVisualModeChange={(mode) => {
            if (visualEditSessionRef.current) cancelVisualEdit();
            dispatchVisualEditing({ type: "set-mode", mode });
          }}
          viewport={state.activeViewport}
          spacingModes={spacingModes}
          visualMode={visualMode}
        />
      </div>

      <div aria-live="polite" className="editor-announcement" role="status">
        {announcement}
      </div>

      <DragOverlay className="editor-drag-overlay" dropAnimation={null}>
        {state.dragSession ? (
          <span>
            {state.dragSession.source.kind === "component"
              ? componentRegistry[state.dragSession.source.componentType].library.label
              : state.dragSession.source.kind === "block"
                ? blockRegistry[state.dragSession.source.blockType].label
                : activePage.nodes[state.dragSession.source.nodeId]?.meta.name ?? "Node"}
          </span>
        ) : null}
      </DragOverlay>
    </div>
    </DragDropProvider>
  );
}
