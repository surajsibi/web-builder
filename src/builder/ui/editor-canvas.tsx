import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";

import type { EditorDragSource } from "@/builder/interaction/types";
import type { NodeId } from "@/builder/model/ids";
import type {
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";
import { componentRegistry } from "@/builder/registry/component-registry";
import type { RendererBaseProps } from "@/builder/registry/define-component-registry";
import { NodeRenderingController } from "@/builder/rendering/node-rendering-controller";
import { VIEWPORT_MIN_HEIGHT } from "@/builder/styles/compile";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { Viewport } from "@/builder/styles/types";
import {
  dragSourceId,
  dropTargetId,
  resolveEditorDropTarget,
  type DropAnchor,
} from "@/builder/ui/drag-and-drop";
import { EditorBreadcrumbs } from "@/builder/ui/editor-breadcrumbs";
import {
  resizeStyleChanges,
  spacingSidesForMode,
  spacingStyleChanges,
  type ResizeContext,
  type ResizeHandle,
  type SpacingProperty,
  type SpacingMode,
  type SpacingSide,
  type VisualEditSession,
  type VisualOverlayMode,
} from "@/builder/ui/visual-editing";

type EditorCanvasProps = {
  document: ProjectDocument;
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  viewport: Viewport;
  selectedNodeId: NodeId | null;
  dragSource: EditorDragSource | null;
  onSelectNode: (nodeId: NodeId) => void;
  onClearSelection: () => void;
  previewStyles: Readonly<Partial<Record<NodeId, CSSProperties>>>;
  visualMode: VisualOverlayMode;
  spacingModes: Readonly<Record<SpacingProperty, SpacingMode>>;
  onPreviewVisualEdit: (session: VisualEditSession) => void;
  onCommitVisualEdit: (session: VisualEditSession) => void;
  onCancelVisualEdit: () => void;
  onStartTextEdit: (nodeId: NodeId) => void;
  onCommitTextEdit: (nodeId: NodeId, text: string) => boolean;
  onCancelTextEdit: (nodeId: NodeId) => void;
};

type CanvasRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type NodeRects = Readonly<Record<NodeId, CanvasRect>>;
type CanvasSize = { width: number; height: number };

type BoxSides = Record<SpacingSide, number>;
type CanvasBoxModel = {
  padding: BoxSides;
  margin: BoxSides;
  content: CanvasSize;
  fontSize: number | null;
};
type NodeBoxModels = Readonly<Record<NodeId, CanvasBoxModel>>;
type ResizeUnitMetrics = {
  rootFontSize: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
};

type InlineTextEditSession = {
  nodeId: NodeId;
  originalText: string;
};

type RendererRootAttributes = NonNullable<
  RendererBaseProps<Record<string, never>>["rootAttributes"]
>;

type CanvasTextRootAttributes = RendererRootAttributes & {
  "data-canvas-text-editable": "true";
  "data-editor-control"?: "true";
  "data-inline-text-editing"?: "true";
};

const EMPTY_CONTAINER_MIN_HEIGHT = 48;

function readComputedPixels(
  computed: CSSStyleDeclaration,
  property: string,
): number {
  const value = Number.parseFloat(computed.getPropertyValue(property));
  return Number.isFinite(value) ? value : 0;
}

function contentSizeFor(
  rect: Readonly<{ width: number; height: number }>,
  computed: CSSStyleDeclaration,
): CanvasSize {
  return {
    width: Math.max(
      0,
      rect.width -
        readComputedPixels(computed, "border-left-width") -
        readComputedPixels(computed, "border-right-width") -
        readComputedPixels(computed, "padding-left") -
        readComputedPixels(computed, "padding-right"),
    ),
    height: Math.max(
      0,
      rect.height -
        readComputedPixels(computed, "border-top-width") -
        readComputedPixels(computed, "border-bottom-width") -
        readComputedPixels(computed, "padding-top") -
        readComputedPixels(computed, "padding-bottom"),
    ),
  };
}

function hasDefiniteNodeHeight(
  page: Readonly<PageDocument>,
  parentById: Readonly<ParentById>,
  nodeId: NodeId,
  viewport: Viewport,
): boolean {
  const node = page.nodes[nodeId];
  if (!node) return false;
  const height = resolveResponsiveStyles(node.styles, viewport).height;
  if (!height) return false;
  if (height.mode === "fixed") {
    if (height.unit !== "%") return true;
    const parentId = parentById[nodeId] ?? null;
    return parentId
      ? hasDefiniteNodeHeight(page, parentById, parentId, viewport)
      : false;
  }
  if (height.mode === "fill") {
    const parentId = parentById[nodeId] ?? null;
    return parentId
      ? hasDefiniteNodeHeight(page, parentById, parentId, viewport)
      : false;
  }
  return false;
}

function rectStyle(rect: CanvasRect): CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function resolveNodeInteractionRect(
  page: Readonly<PageDocument>,
  nodeId: NodeId,
  rect: CanvasRect,
): CanvasRect {
  const node = page.nodes[nodeId];
  const definition = node ? componentRegistry[node.type] : null;

  if (!node || !definition?.children.allowed || node.childIds.length > 0) {
    return rect;
  }

  return {
    ...rect,
    height: Math.max(rect.height, EMPTY_CONTAINER_MIN_HEIGHT),
  };
}

function CanvasDropZone({
  document,
  page,
  parentById,
  selectedNodeId,
  source,
  anchor,
  rect,
}: {
  document: ProjectDocument;
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  selectedNodeId: NodeId | null;
  source: EditorDragSource;
  anchor: DropAnchor;
  rect: CanvasRect;
}) {
  const resolution = resolveEditorDropTarget(
    {
      document,
      parentById: parentById as ParentById,
      activePageId: page.id,
      selectedNodeId,
    },
    source,
    anchor,
    "canvas",
  );
  const target = resolution.valid ? resolution.target : null;
  const { ref, isDropTarget } = useDroppable({
    id: target ? dropTargetId(target) : `drop:canvas:invalid:${anchor.intent}:${anchor.nodeId}`,
    data: target ? { editorTarget: target } : undefined,
    disabled: target === null,
  });

  if (!target) return null;

  return (
    <div
      aria-label={target.label}
      className={`canvas-drop-zone canvas-drop-${anchor.intent}${isDropTarget ? " is-active" : ""}`}
      ref={ref}
      style={rectStyle(rect)}
    >
      {isDropTarget ? <span>{target.label}</span> : null}
    </div>
  );
}

function nodeDropRect(rect: CanvasRect, intent: DropAnchor["intent"]): CanvasRect {
  if (intent === "before") {
    return { left: rect.left, top: rect.top - 7, width: rect.width, height: 14 };
  }
  if (intent === "after") {
    return {
      left: rect.left,
      top: rect.top + rect.height - 7,
      width: rect.width,
      height: 14,
    };
  }
  return {
    left: rect.left + 8,
    top: rect.top + Math.min(16, rect.height / 4),
    width: Math.max(0, rect.width - 16),
    height: Math.max(12, rect.height - Math.min(32, rect.height / 2)),
  };
}

function CanvasNode({
  nodeId,
  page,
  viewport,
  registerRoot,
  previewStyles,
  getRootAttributes,
}: {
  nodeId: NodeId;
  page: Readonly<PageDocument>;
  viewport: Viewport;
  registerRoot: (nodeId: NodeId, element: HTMLElement | null) => void;
  previewStyles: Readonly<Partial<Record<NodeId, CSSProperties>>>;
  getRootAttributes: (
    nodeId: NodeId,
  ) => RendererRootAttributes | undefined;
}) {
  const node = page.nodes[nodeId];
  const resolvedStyles = resolveResponsiveStyles(
    node.styles,
    viewport,
  );
  const livePreview = previewStyles[nodeId];
  const usesViewportHeight = livePreview
    ? livePreview.height === "auto" &&
      livePreview.minHeight === VIEWPORT_MIN_HEIGHT
    : resolvedStyles.height?.mode === "viewport";
  const usesEmptyContainerMinimum =
    node.type === "container" &&
    node.childIds.length === 0 &&
    resolvedStyles.height?.mode === "auto" &&
    resolvedStyles.minHeight === undefined &&
    livePreview?.minHeight === undefined &&
    (livePreview?.height === undefined || livePreview.height === "auto");
  const previewStyle = {
    ...livePreview,
    ...(usesEmptyContainerMinimum
      ? { minHeight: EMPTY_CONTAINER_MIN_HEIGHT }
      : {}),
    ...(page.rootIds.includes(nodeId) && usesViewportHeight
      ? {
          height: "auto",
          minHeight: "var(--editor-viewport-height)",
        }
      : {}),
  };

  return (
    <NodeRenderingController
      getClassName={() => "canvas-node"}
      getPreviewStyle={() => previewStyle}
      getRootAttributes={(renderedNode) => getRootAttributes(renderedNode.id)}
      nodeId={nodeId}
      page={page}
      registerRoot={(registeredNodeId, element) => {
        registerRoot(registeredNodeId, element);
      }}
      renderChild={(childId) => (
        <CanvasNode
          key={childId}
          getRootAttributes={getRootAttributes}
          nodeId={childId}
          page={page}
          previewStyles={previewStyles}
          registerRoot={registerRoot}
          viewport={viewport}
        />
      )}
      runtime={{ mode: "editor" }}
      viewport={viewport}
    />
  );
}

function CanvasNodeDragHandle({
  page,
  nodeId,
  rect,
}: {
  page: Readonly<PageDocument>;
  nodeId: NodeId;
  rect: CanvasRect;
}) {
  const node = page.nodes[nodeId];
  const source: EditorDragSource = {
    kind: "node",
    nodeId,
    surface: "canvas",
  };
  const { ref, handleRef, isDragging } = useDraggable({
    id: dragSourceId(source),
    data: { editorSource: source },
    disabled: node.meta.locked,
  });

  return (
    <button
      aria-label={`Drag ${node.meta.name}`}
      className={`canvas-node-drag-handle${isDragging ? " is-dragging" : ""}`}
      disabled={node.meta.locked}
      ref={(element) => {
        ref(element);
        handleRef(element);
      }}
      style={{
        left: Math.max(rect.left + rect.width - 30, rect.left + 3),
        top: rect.top + 3,
      }}
      title={node.meta.locked ? "Locked nodes cannot be dragged" : "Drag node"}
      type="button"
    >
      ⋮⋮
    </button>
  );
}

type VisualEditCallbacks = Pick<
  EditorCanvasProps,
  "onPreviewVisualEdit" | "onCommitVisualEdit" | "onCancelVisualEdit"
>;

function CanvasResizeHandle({
  handle,
  nodeId,
  nodeName,
  rect,
  resizeContext,
  onPreviewVisualEdit,
  onCommitVisualEdit,
  onCancelVisualEdit,
}: VisualEditCallbacks & {
  handle: ResizeHandle;
  nodeId: NodeId;
  nodeName: string;
  rect: CanvasRect;
  resizeContext: ResizeContext;
}) {
  const pointerStart = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const keyboardStart = useRef<{ width: number; height: number } | null>(null);
  const keyboardDelta = useRef({ x: 0, y: 0 });
  const latestChanges = useRef<VisualEditSession["changes"] | null>(null);

  const sessionFor = (x: number, y: number): VisualEditSession => ({
    nodeId,
    changes: resizeStyleChanges(
      handle,
      keyboardStart.current ?? rect,
      { x, y },
      resizeContext,
    ),
  });

  const previewPointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (!pointerStart.current) return null;
    const session: VisualEditSession = {
      nodeId,
      changes: resizeStyleChanges(
        handle,
        pointerStart.current,
        {
          x: event.clientX - pointerStart.current.x,
          y: event.clientY - pointerStart.current.y,
        },
        resizeContext,
      ),
    };
    latestChanges.current = session.changes;
    onPreviewVisualEdit(session);
    return session;
  };

  return (
    <button
      aria-label={`Resize ${nodeName} ${handle}`}
      className={`canvas-resize-handle canvas-resize-${handle}`}
      data-editor-control="true"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 1;
        let handled = true;
        if (event.key === "ArrowRight" && handle !== "south") {
          keyboardDelta.current.x += step;
        } else if (event.key === "ArrowLeft" && handle !== "south") {
          keyboardDelta.current.x -= step;
        } else if (event.key === "ArrowDown" && handle !== "east") {
          keyboardDelta.current.y += step;
        } else if (event.key === "ArrowUp" && handle !== "east") {
          keyboardDelta.current.y -= step;
        } else if (event.key === "Enter" && latestChanges.current) {
          onCommitVisualEdit({ nodeId, changes: latestChanges.current });
          latestChanges.current = null;
          keyboardStart.current = null;
          keyboardDelta.current = { x: 0, y: 0 };
        } else if (event.key === "Escape") {
          pointerStart.current = null;
          onCancelVisualEdit();
          latestChanges.current = null;
          keyboardStart.current = null;
          keyboardDelta.current = { x: 0, y: 0 };
        } else {
          handled = false;
        }
        if (!handled) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key.startsWith("Arrow")) {
          keyboardStart.current ??= { width: rect.width, height: rect.height };
          const session = sessionFor(
            keyboardDelta.current.x,
            keyboardDelta.current.y,
          );
          latestChanges.current = session.changes;
          onPreviewVisualEdit(session);
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        pointerStart.current = {
          x: event.clientX,
          y: event.clientY,
          width: rect.width,
          height: rect.height,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        const session: VisualEditSession = {
          nodeId,
          changes: resizeStyleChanges(
            handle,
            rect,
            { x: 0, y: 0 },
            resizeContext,
          ),
        };
        latestChanges.current = session.changes;
        onPreviewVisualEdit(session);
      }}
      onPointerMove={(event) => {
        if (!pointerStart.current) return;
        event.preventDefault();
        event.stopPropagation();
        previewPointer(event);
      }}
      onPointerUp={(event) => {
        if (!pointerStart.current) return;
        event.preventDefault();
        event.stopPropagation();
        const session = previewPointer(event);
        pointerStart.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (session) onCommitVisualEdit(session);
        latestChanges.current = null;
      }}
      style={
        handle === "east"
          ? { left: rect.left + rect.width, top: rect.top + rect.height / 2 }
          : handle === "south"
            ? { left: rect.left + rect.width / 2, top: rect.top + rect.height }
            : { left: rect.left + rect.width, top: rect.top + rect.height }
      }
      title="Drag to resize using the current responsive sizing context. Arrow keys preview; Enter commits."
      type="button"
    />
  );
}

function CanvasResizeHandles({
  nodeId,
  nodeName,
  rect,
  resizeContext,
  ...callbacks
}: VisualEditCallbacks & {
  nodeId: NodeId;
  nodeName: string;
  rect: CanvasRect;
  resizeContext: ResizeContext;
}) {
  return (
    <>
      {(["east", "south", "south-east"] as const).map((handle) => (
        <CanvasResizeHandle
          {...callbacks}
          handle={handle}
          key={handle}
          nodeId={nodeId}
          nodeName={nodeName}
          rect={rect}
          resizeContext={resizeContext}
        />
      ))}
    </>
  );
}

function spacingDelta(
  property: SpacingProperty,
  side: SpacingSide,
  deltaX: number,
  deltaY: number,
): number {
  if (property === "padding") {
    if (side === "top") return deltaY;
    if (side === "right") return -deltaX;
    if (side === "bottom") return -deltaY;
    return deltaX;
  }
  if (side === "top") return -deltaY;
  if (side === "right") return deltaX;
  if (side === "bottom") return deltaY;
  return -deltaX;
}

function spacingHandlePosition(
  rect: CanvasRect,
  box: CanvasBoxModel,
  property: SpacingProperty,
  side: SpacingSide,
): CSSProperties {
  const amount = box[property][side];
  if (side === "top") {
    return {
      left: rect.left + rect.width * 0.45,
      top: property === "padding" ? rect.top + amount : rect.top - amount,
    };
  }
  if (side === "right") {
    return {
      left:
        property === "padding"
          ? rect.left + rect.width - amount
          : rect.left + rect.width + amount,
      top: rect.top + rect.height * 0.55,
    };
  }
  if (side === "bottom") {
    return {
      left: rect.left + rect.width * 0.55,
      top:
        property === "padding"
          ? rect.top + rect.height - amount
          : rect.top + rect.height + amount,
    };
  }
  return {
    left: property === "padding" ? rect.left + amount : rect.left - amount,
    top: rect.top + rect.height * 0.45,
  };
}

function spacingBandStyle(
  rect: CanvasRect,
  box: CanvasBoxModel,
  property: SpacingProperty,
  side: SpacingSide,
): CSSProperties {
  const amount = Math.max(0, box[property][side]);
  if (property === "padding") {
    if (side === "top") return { left: rect.left, top: rect.top, width: rect.width, height: amount };
    if (side === "right") return { left: rect.left + rect.width - amount, top: rect.top, width: amount, height: rect.height };
    if (side === "bottom") return { left: rect.left, top: rect.top + rect.height - amount, width: rect.width, height: amount };
    return { left: rect.left, top: rect.top, width: amount, height: rect.height };
  }
  if (side === "top") return { left: rect.left, top: rect.top - amount, width: rect.width, height: amount };
  if (side === "right") return { left: rect.left + rect.width, top: rect.top, width: amount, height: rect.height };
  if (side === "bottom") return { left: rect.left, top: rect.top + rect.height, width: rect.width, height: amount };
  return { left: rect.left - amount, top: rect.top, width: amount, height: rect.height };
}

function CanvasSpacingHandle({
  nodeId,
  nodeName,
  nodeStyles,
  viewport,
  property,
  spacingMode,
  side,
  startValue,
  position,
  onPreviewVisualEdit,
  onCommitVisualEdit,
  onCancelVisualEdit,
}: VisualEditCallbacks & {
  nodeId: NodeId;
  nodeName: string;
  nodeStyles: PageDocument["nodes"][NodeId]["styles"];
  viewport: Viewport;
  property: SpacingProperty;
  spacingMode: SpacingMode;
  side: SpacingSide;
  startValue: number;
  position: CSSProperties;
}) {
  const pointerStart = useRef<{ x: number; y: number; value: number } | null>(null);

  const sessionFor = (event: PointerEvent<HTMLButtonElement>): VisualEditSession => {
    const start = pointerStart.current ?? {
      x: event.clientX,
      y: event.clientY,
      value: startValue,
    };
    const delta = spacingDelta(
      property,
      side,
      event.clientX - start.x,
      event.clientY - start.y,
    );
    const value = property === "padding"
      ? Math.max(0, Math.round(start.value + delta))
      : Math.round(start.value + delta);
    const linkedSides = spacingSidesForMode(spacingMode, side);
    const updates = Object.fromEntries(
      linkedSides.map((candidate) => [candidate, { value, unit: "px" }]),
    );
    return {
      nodeId,
      changes: spacingStyleChanges(nodeStyles, viewport, property, updates),
    };
  };

  return (
    <button
      aria-label={`Adjust ${nodeName} ${property} ${side}`}
      className={`canvas-spacing-handle canvas-spacing-${side}`}
      data-editor-control="true"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        pointerStart.current = null;
        onCancelVisualEdit();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        pointerStart.current = {
          x: event.clientX,
          y: event.clientY,
          value: startValue,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        onPreviewVisualEdit(sessionFor(event));
      }}
      onPointerMove={(event) => {
        if (!pointerStart.current) return;
        event.preventDefault();
        event.stopPropagation();
        onPreviewVisualEdit(sessionFor(event));
      }}
      onPointerUp={(event) => {
        if (!pointerStart.current) return;
        event.preventDefault();
        event.stopPropagation();
        const session = sessionFor(event);
        pointerStart.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onCommitVisualEdit(session);
      }}
      style={position}
      title={`Drag to adjust this ${spacingMode === "axes" ? "axis" : "side"} in pixels`}
      type="button"
    />
  );
}

function CanvasSpacingOverlay({
  nodeId,
  nodeName,
  nodeStyles,
  viewport,
  rect,
  box,
  property,
  spacingMode,
  ...callbacks
}: VisualEditCallbacks & {
  nodeId: NodeId;
  nodeName: string;
  nodeStyles: PageDocument["nodes"][NodeId]["styles"];
  viewport: Viewport;
  rect: CanvasRect;
  box: CanvasBoxModel;
  property: SpacingProperty;
  spacingMode: SpacingMode;
}) {
  const sides: readonly SpacingSide[] = ["top", "right", "bottom", "left"];
  return (
    <>
      {sides.map((side) => (
        <div
          className={`canvas-spacing-band canvas-${property}-band`}
          key={`band:${side}`}
          style={spacingBandStyle(rect, box, property, side)}
        />
      ))}
      {sides.map((side) => (
        <CanvasSpacingHandle
          key={`handle:${side}`}
          nodeId={nodeId}
          nodeName={nodeName}
          nodeStyles={nodeStyles}
          onCancelVisualEdit={callbacks.onCancelVisualEdit}
          onCommitVisualEdit={callbacks.onCommitVisualEdit}
          onPreviewVisualEdit={callbacks.onPreviewVisualEdit}
          position={spacingHandlePosition(rect, box, property, side)}
          property={property}
          side={side}
          spacingMode={spacingMode}
          startValue={box[property][side]}
          viewport={viewport}
        />
      ))}
    </>
  );
}

function CanvasLayoutGuides({
  rect,
  nodeStyles,
  viewport,
}: {
  rect: CanvasRect;
  nodeStyles: PageDocument["nodes"][NodeId]["styles"];
  viewport: Viewport;
}) {
  const resolved = resolveResponsiveStyles(nodeStyles, viewport);
  if (resolved.display === "flex") {
    const direction = resolved.flex?.direction ?? "row";
    return (
      <div
        aria-label={`Flex ${direction} layout guide`}
        className={`canvas-layout-guide canvas-flex-guide is-${direction}`}
        style={rectStyle(rect)}
      >
        <span>Flex {direction.replace("-", " ")} · gap {resolved.flex && "value" in resolved.flex.gap ? `${resolved.flex.gap.value}${resolved.flex.gap.unit}` : "0px"}</span>
      </div>
    );
  }
  if (resolved.display === "grid") {
    const columns = resolved.grid?.columns ?? 2;
    const rows = resolved.grid?.rows ?? 1;
    return (
      <div
        aria-label={`${columns} column grid layout guide`}
        className="canvas-layout-guide canvas-grid-guide"
        style={{
          ...rectStyle(rect),
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: columns * rows }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-label="Block layout guide"
      className="canvas-layout-guide canvas-block-guide"
      style={rectStyle(rect)}
    >
      <span>Block flow</span>
    </div>
  );
}

function CanvasInteractionOverlay({
  document,
  page,
  parentById,
  selectedNodeId,
  dragSource,
  rects,
  boxModels,
  artboardWidth,
  artboardContentSize,
  resizeUnitMetrics,
  viewport,
  spacingModes,
  visualMode,
  textEditingNodeId,
  onPreviewVisualEdit,
  onCommitVisualEdit,
  onCancelVisualEdit,
}: Pick<
  EditorCanvasProps,
  | "document"
  | "page"
  | "parentById"
  | "selectedNodeId"
  | "dragSource"
  | "viewport"
  | "spacingModes"
  | "visualMode"
  | "onPreviewVisualEdit"
  | "onCommitVisualEdit"
  | "onCancelVisualEdit"
> & {
  rects: NodeRects;
  boxModels: NodeBoxModels;
  artboardWidth: number;
  artboardContentSize: CanvasSize;
  resizeUnitMetrics: ResizeUnitMetrics;
  textEditingNodeId: NodeId | null;
}) {
  const interactionRects = Object.fromEntries(
    Object.entries(rects).map(([nodeId, rect]) => [
      nodeId,
      resolveNodeInteractionRect(page, nodeId as NodeId, rect),
    ]),
  ) as Record<NodeId, CanvasRect>;
  const parentId = selectedNodeId ? parentById[selectedNodeId] ?? null : null;
  const selectedRect = selectedNodeId ? interactionRects[selectedNodeId] : null;
  const selectedNode = selectedNodeId ? page.nodes[selectedNodeId] : null;
  const selectedDefinition = selectedNode
    ? componentRegistry[selectedNode.type]
    : null;
  const selectedStyles = selectedNode
    ? resolveResponsiveStyles(selectedNode.styles, viewport)
    : null;
  const parentRect = parentId ? rects[parentId] : null;
  const parentContentSize = parentId
    ? boxModels[parentId]?.content
    : artboardContentSize;
  const resizeContext: ResizeContext | null =
    selectedNode && selectedStyles
      ? {
          dimensions: {
            width: selectedStyles.width,
            height: selectedStyles.height,
            position: selectedStyles.position,
          },
          parentContentWidth:
            parentContentSize && parentContentSize.width > 0
              ? parentContentSize.width
              : null,
          parentContentHeight:
            parentContentSize && parentContentSize.height > 0
              ? parentContentSize.height
              : null,
          parentHasDefiniteHeight: parentId
            ? hasDefiniteNodeHeight(page, parentById, parentId, viewport)
            : false,
          elementFontSize: boxModels[selectedNode.id]?.fontSize ?? null,
          rootFontSize: resizeUnitMetrics.rootFontSize,
          viewportWidth: resizeUnitMetrics.viewportWidth,
          viewportHeight: resizeUnitMetrics.viewportHeight,
        }
      : null;
  const visibleBottom = Object.values(interactionRects).reduce(
    (bottom, rect) => Math.max(bottom, rect.top + rect.height),
    0,
  );

  return (
    <div className="canvas-interaction-overlay">
      {parentId && parentRect ? (
        <div className="canvas-parent-outline" style={rectStyle(parentRect)} />
      ) : null}

      {selectedNodeId && selectedRect ? (
        <>
          <div className="canvas-selection-outline" style={rectStyle(selectedRect)}>
            <span>
              {page.nodes[selectedNodeId].meta.name}
              {textEditingNodeId === selectedNodeId ? " · Editing" : ""}
            </span>
          </div>
          {textEditingNodeId !== selectedNodeId ? (
            <CanvasNodeDragHandle
              nodeId={selectedNodeId}
              page={page}
              rect={selectedRect}
            />
          ) : null}
          {!dragSource &&
          textEditingNodeId === null &&
          selectedNode &&
          resizeContext &&
          !selectedNode.meta.locked &&
          selectedDefinition?.inspector.styles.includes("sizing") ? (
            <CanvasResizeHandles
              nodeId={selectedNode.id}
              nodeName={selectedNode.meta.name}
              onCancelVisualEdit={onCancelVisualEdit}
              onCommitVisualEdit={onCommitVisualEdit}
              onPreviewVisualEdit={onPreviewVisualEdit}
              rect={selectedRect}
              resizeContext={resizeContext}
            />
          ) : null}
          {!dragSource &&
          textEditingNodeId === null &&
          selectedNode &&
          !selectedNode.meta.locked &&
          (visualMode === "padding" || visualMode === "margin") &&
          boxModels[selectedNode.id] ? (
            <CanvasSpacingOverlay
              box={boxModels[selectedNode.id]}
              nodeId={selectedNode.id}
              nodeName={selectedNode.meta.name}
              nodeStyles={selectedNode.styles}
              onCancelVisualEdit={onCancelVisualEdit}
              onCommitVisualEdit={onCommitVisualEdit}
              onPreviewVisualEdit={onPreviewVisualEdit}
              property={visualMode}
              rect={selectedRect}
              spacingMode={spacingModes[visualMode]}
              viewport={viewport}
            />
          ) : null}
          {!dragSource &&
          textEditingNodeId === null &&
          selectedNode &&
          visualMode === "layout" &&
          (selectedDefinition?.inspector.styles as readonly string[] | undefined)?.includes("layout") ? (
            <CanvasLayoutGuides
              nodeStyles={selectedNode.styles}
              rect={selectedRect}
              viewport={viewport}
            />
          ) : null}
        </>
      ) : null}

      {Object.values(page.nodes).map((node) => {
        const definition = componentRegistry[node.type];
        const rect = interactionRects[node.id];
        if (!definition.children.allowed || node.childIds.length > 0 || !rect) {
          return null;
        }
        return (
          <button
            aria-label={`Select empty ${node.meta.name}`}
            className="empty-container-overlay"
            data-editor-node-id={node.id}
            key={node.id}
            style={rectStyle(rect)}
            type="button"
          >
            <span>
              <strong>Empty {definition.library.label}</strong>
              <small>Select it, then add or drag a component</small>
            </span>
          </button>
        );
      })}

      {dragSource ? (
        <>
          {Object.values(page.nodes).flatMap((node) => {
            const rect = interactionRects[node.id];
            if (!rect) return [];
            return (["before", "inside", "after"] as const).map((intent) => (
              <CanvasDropZone
                anchor={{ intent, nodeId: node.id }}
                document={document}
                key={`${node.id}:${intent}`}
                page={page}
                parentById={parentById}
                rect={nodeDropRect(rect, intent)}
                selectedNodeId={selectedNodeId}
                source={dragSource}
              />
            ));
          })}
          <CanvasDropZone
            anchor={{ intent: "root", nodeId: null }}
            document={document}
            page={page}
            parentById={parentById}
            rect={{
              left: 0,
              top: page.rootIds.length === 0 ? 0 : Math.max(0, visibleBottom - 8),
              width: artboardWidth,
              height: page.rootIds.length === 0 ? 672 : 24,
            }}
            selectedNodeId={selectedNodeId}
            source={dragSource}
          />
        </>
      ) : null}
    </div>
  );
}

export function EditorCanvas({
  document: projectDocument,
  page,
  parentById,
  viewport,
  selectedNodeId,
  dragSource,
  onSelectNode,
  onClearSelection,
  previewStyles,
  spacingModes,
  visualMode,
  onPreviewVisualEdit,
  onCommitVisualEdit,
  onCancelVisualEdit,
  onStartTextEdit,
  onCommitTextEdit,
  onCancelTextEdit,
}: EditorCanvasProps) {
  const elementToNode = useRef(new WeakMap<HTMLElement, NodeId>());
  const elementsByNode = useRef(new Map<NodeId, HTMLElement>());
  const artboardRef = useRef<HTMLDivElement | null>(null);
  const textEditSessionRef = useRef<InlineTextEditSession | null>(null);
  const textEditDraftRef = useRef("");
  const [textEditSession, setTextEditSession] =
    useState<InlineTextEditSession | null>(null);
  const [rects, setRects] = useState<NodeRects>({} as Record<NodeId, CanvasRect>);
  const [boxModels, setBoxModels] = useState<NodeBoxModels>(
    {} as Record<NodeId, CanvasBoxModel>,
  );
  const [artboardWidth, setArtboardWidth] = useState(0);
  const [artboardContentSize, setArtboardContentSize] = useState<CanvasSize>({
    width: 0,
    height: 0,
  });
  const [resizeUnitMetrics, setResizeUnitMetrics] =
    useState<ResizeUnitMetrics>({
      rootFontSize: null,
      viewportWidth: null,
      viewportHeight: null,
    });

  const editableText = useCallback(
    (nodeId: NodeId): string | null => {
      const node = page.nodes[nodeId];
      if (
        !node ||
        node.meta.locked ||
        (node.type !== "heading" &&
          node.type !== "text" &&
          node.type !== "label" &&
          node.type !== "link") ||
        typeof node.props.text !== "string"
      ) {
        return null;
      }
      return node.props.text;
    },
    [page],
  );

  const startTextEditing = useCallback(
    (nodeId: NodeId): boolean => {
      if (textEditSessionRef.current?.nodeId === nodeId) return true;
      const text = editableText(nodeId);
      if (text === null) return false;

      const session = { nodeId, originalText: text };
      textEditSessionRef.current = session;
      textEditDraftRef.current = text;
      setTextEditSession(session);
      onStartTextEdit(nodeId);
      return true;
    },
    [editableText, onStartTextEdit],
  );

  const commitTextEditing = useCallback((): boolean => {
    const session = textEditSessionRef.current;
    if (!session) return false;
    if (!onCommitTextEdit(session.nodeId, textEditDraftRef.current)) {
      return false;
    }

    textEditSessionRef.current = null;
    setTextEditSession(null);
    return true;
  }, [onCommitTextEdit]);

  const cancelTextEditing = useCallback(() => {
    const session = textEditSessionRef.current;
    if (!session) return;

    const element = elementsByNode.current.get(session.nodeId);
    if (element) element.textContent = session.originalText;
    textEditSessionRef.current = null;
    textEditDraftRef.current = session.originalText;
    setTextEditSession(null);
    onCancelTextEdit(session.nodeId);
  }, [onCancelTextEdit]);

  const insertPlainText = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      textEditDraftRef.current = event.currentTarget.textContent ?? "";
    },
    [],
  );

  const rootAttributesFor = useCallback(
    (nodeId: NodeId): CanvasTextRootAttributes | undefined => {
      const text = editableText(nodeId);
      if (text === null) return undefined;
      const isEditing = textEditSession?.nodeId === nodeId;

      if (!isEditing) {
        return {
          "data-canvas-text-editable": "true",
          onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
            if (
              event.key !== "Enter" ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.nativeEvent.isComposing
            ) {
              return;
            }
            if (!startTextEditing(nodeId)) return;
            event.preventDefault();
            event.stopPropagation();
          },
          tabIndex: selectedNodeId === nodeId ? 0 : -1,
        };
      }

      return {
        "aria-label": `Edit ${page.nodes[nodeId].meta.name} text`,
        "aria-multiline": false,
        contentEditable: "plaintext-only",
        "data-canvas-text-editable": "true",
        "data-editor-control": "true",
        "data-inline-text-editing": "true",
        onBlur: () => {
          commitTextEditing();
        },
        onClick: (event: MouseEvent<HTMLElement>) => {
          if (page.nodes[nodeId].type === "link") event.preventDefault();
        },
        onInput: (event: FormEvent<HTMLElement>) => {
          textEditDraftRef.current = event.currentTarget.textContent ?? "";
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelTextEditing();
            return;
          }
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          commitTextEditing();
        },
        onPaste: insertPlainText,
        role: "textbox",
        spellCheck: true,
        suppressContentEditableWarning: true,
        tabIndex: 0,
      };
    },
    [
      cancelTextEditing,
      commitTextEditing,
      editableText,
      insertPlainText,
      page.nodes,
      selectedNodeId,
      startTextEditing,
      textEditSession,
    ],
  );

  const registerRoot = useCallback((nodeId: NodeId, element: HTMLElement | null) => {
    if (element) {
      elementToNode.current.set(element, nodeId);
      elementsByNode.current.set(nodeId, element);
    } else {
      elementsByNode.current.delete(nodeId);
    }
  }, []);

  useLayoutEffect(() => {
    if (!textEditSession) return;
    const element = elementsByNode.current.get(textEditSession.nodeId);
    if (!element) return;

    element.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [textEditSession]);

  useEffect(() => {
    const handleEnterShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.key !== "Enter" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.isComposing ||
        textEditSessionRef.current ||
        !selectedNodeId
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLButtonElement ||
        target instanceof HTMLAnchorElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (!startTextEditing(selectedNodeId)) return;
      event.preventDefault();
    };

    window.addEventListener("keydown", handleEnterShortcut);
    return () => window.removeEventListener("keydown", handleEnterShortcut);
  }, [selectedNodeId, startTextEditing]);

  const measure = useCallback(() => {
    const artboard = artboardRef.current;
    if (!artboard) return;
    const artboardRect = artboard.getBoundingClientRect();
    const artboardComputed = getComputedStyle(artboard);
    const next = Object.create(null) as Record<NodeId, CanvasRect>;
    const nextBoxes = Object.create(null) as Record<NodeId, CanvasBoxModel>;

    for (const [nodeId, element] of elementsByNode.current) {
      const rect = element.getBoundingClientRect();
      next[nodeId] = {
        left: rect.left - artboardRect.left,
        top: rect.top - artboardRect.top,
        width: rect.width,
        height: rect.height,
      };
      const computed = getComputedStyle(element);
      nextBoxes[nodeId] = {
        padding: {
          top: readComputedPixels(computed, "padding-top"),
          right: readComputedPixels(computed, "padding-right"),
          bottom: readComputedPixels(computed, "padding-bottom"),
          left: readComputedPixels(computed, "padding-left"),
        },
        margin: {
          top: readComputedPixels(computed, "margin-top"),
          right: readComputedPixels(computed, "margin-right"),
          bottom: readComputedPixels(computed, "margin-bottom"),
          left: readComputedPixels(computed, "margin-left"),
        },
        content: contentSizeFor(rect, computed),
        fontSize: readComputedPixels(computed, "font-size") || null,
      };
    }

    setRects(next);
    setBoxModels(nextBoxes);
    setArtboardWidth(artboardRect.width);
    setArtboardContentSize(contentSizeFor(artboardRect, artboardComputed));
    setResizeUnitMetrics({
      rootFontSize:
        readComputedPixels(
          getComputedStyle(document.documentElement),
          "font-size",
        ) || null,
      viewportWidth: window.innerWidth > 0 ? window.innerWidth : null,
      viewportHeight: window.innerHeight > 0 ? window.innerHeight : null,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, page, previewStyles, viewport, selectedNodeId]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    const ResizeObserverConstructor = globalThis.ResizeObserver;
    const observer = ResizeObserverConstructor
      ? new ResizeObserverConstructor(measure)
      : null;
    if (artboardRef.current) observer?.observe(artboardRef.current);
    for (const element of elementsByNode.current.values()) observer?.observe(element);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [measure, page]);

  const nodeIdFromEvent = (event: MouseEvent<HTMLElement>): NodeId | null => {
    for (const target of event.nativeEvent.composedPath()) {
      if (!(target instanceof HTMLElement)) continue;
      if (target.dataset.editorControl === "true") return null;
      const nodeId =
        elementToNode.current.get(target) ??
        (target.dataset.editorNodeId as NodeId | undefined);
      if (!nodeId) continue;

      return nodeId;
    }
    return null;
  };

  const handleCanvasClick = (event: MouseEvent<HTMLElement>) => {
    const nodeId = nodeIdFromEvent(event);
    if (nodeId) {
      const element = elementsByNode.current.get(nodeId);
      const activatesDisclosure =
        event.target instanceof HTMLElement &&
        event.target.closest("summary.builder-disclosure-summary") !== null;

      if (!activatesDisclosure) event.preventDefault();
      event.stopPropagation();
      onSelectNode(nodeId);
      if (editableText(nodeId) !== null) {
        element?.focus({ preventScroll: true });
      }
      return;
    }

    if (textEditSessionRef.current) return;
    onClearSelection();
  };

  const handleCanvasDoubleClick = (event: MouseEvent<HTMLElement>) => {
    const nodeId = nodeIdFromEvent(event);
    if (!nodeId || editableText(nodeId) === null) return;

    event.preventDefault();
    event.stopPropagation();
    if (selectedNodeId !== nodeId) onSelectNode(nodeId);
    startTextEditing(nodeId);
  };

  return (
    <main className="editor-canvas-panel">
      <div className="canvas-panel-heading">
        <div>
          <p className="panel-eyebrow">Canvas</p>
          <h1>{page.name}</h1>
        </div>
        <span>{viewport.charAt(0).toUpperCase() + viewport.slice(1)} preview</span>
      </div>

      <EditorBreadcrumbs
        onSelectNode={onSelectNode}
        page={page}
        parentById={parentById}
        selectedNodeId={selectedNodeId}
      />

      <section
        aria-label="Page canvas"
        className="canvas-stage"
        onClickCapture={handleCanvasClick}
        onDoubleClickCapture={handleCanvasDoubleClick}
        onScroll={measure}
      >
        <div
          aria-label={page.name + " canvas, " + viewport + " viewport"}
          className="canvas-artboard"
          data-viewport={viewport}
          ref={artboardRef}
        >
          {page.rootIds.length === 0 ? (
            <div className="empty-page-placeholder">
              <span aria-hidden="true">+</span>
              <strong>Your page is empty</strong>
              <p>Choose or drag a component from the library to begin.</p>
            </div>
          ) : (
            page.rootIds.map((nodeId) => (
              <CanvasNode
                getRootAttributes={rootAttributesFor}
                key={nodeId}
                nodeId={nodeId}
                page={page}
                previewStyles={previewStyles}
                registerRoot={registerRoot}
                viewport={viewport}
              />
            ))
          )}

          <CanvasInteractionOverlay
            artboardContentSize={artboardContentSize}
            artboardWidth={artboardWidth}
            boxModels={boxModels}
            document={projectDocument}
            dragSource={dragSource}
            page={page}
            parentById={parentById}
            onCancelVisualEdit={onCancelVisualEdit}
            onCommitVisualEdit={onCommitVisualEdit}
            onPreviewVisualEdit={onPreviewVisualEdit}
            rects={rects}
            resizeUnitMetrics={resizeUnitMetrics}
            selectedNodeId={selectedNodeId}
            spacingModes={spacingModes}
            textEditingNodeId={textEditSession?.nodeId ?? null}
            viewport={viewport}
            visualMode={visualMode}
          />
        </div>
      </section>
    </main>
  );
}
