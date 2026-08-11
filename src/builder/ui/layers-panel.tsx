import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";

import type {
  EditorDragSource,
  EditorDropTarget,
} from "@/builder/interaction/types";
import type { NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";
import { componentRegistry } from "@/builder/registry/component-registry";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { Viewport } from "@/builder/styles/types";
import {
  dragSourceId,
  dropTargetId,
  resolveEditorDropTarget,
  type DropAnchor,
} from "@/builder/ui/drag-and-drop";

type LayersPanelProps = {
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  viewport: Viewport;
  selectedNodeId: NodeId | null;
  dragSource: EditorDragSource | null;
  activeDropTarget: EditorDropTarget | null;
  onSelectNode: (nodeId: NodeId) => void;
};

function sameTarget(
  left: EditorDropTarget | null,
  right: EditorDropTarget,
): boolean {
  return left !== null && dropTargetId(left) === dropTargetId(right);
}

function LayerDropZone({
  page,
  parentById,
  source,
  anchor,
  activeDropTarget,
}: {
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  source: EditorDragSource;
  anchor: DropAnchor;
  activeDropTarget: EditorDropTarget | null;
}) {
  const resolution = resolveEditorDropTarget(
    page,
    parentById,
    source,
    anchor,
    "layers",
  );
  const target = resolution.valid ? resolution.target : null;
  const { ref, isDropTarget } = useDroppable({
    id: target ? dropTargetId(target) : `drop:layers:invalid:${anchor.intent}:${anchor.nodeId}`,
    data: target ? { editorTarget: target } : undefined,
    disabled: target === null,
  });

  if (!target) return null;

  const active = isDropTarget || sameTarget(activeDropTarget, target);
  return (
    <div
      aria-label={target.label}
      className={`layer-drop-zone layer-drop-${anchor.intent}${active ? " is-active" : ""}`}
      ref={ref}
    />
  );
}

function LayerNode({
  nodeId,
  depth,
  expandedIds,
  setExpandedIds,
  ...props
}: LayersPanelProps & {
  nodeId: NodeId;
  depth: number;
  expandedIds: ReadonlySet<NodeId>;
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<NodeId>>>;
}) {
  const node = props.page.nodes[nodeId];
  const definition = componentRegistry[node.type];
  const Icon = definition.library.icon;
  const hasChildren = node.childIds.length > 0;
  const expanded = expandedIds.has(node.id);
  const hidden = resolveResponsiveStyles(node.styles, props.viewport).display === "none";
  const source: EditorDragSource = {
    kind: "node",
    nodeId: node.id,
    surface: "layers",
  };
  const { ref, handleRef, isDragging } = useDraggable({
    id: dragSourceId(source),
    data: { editorSource: source },
    disabled: node.meta.locked,
  });

  return (
    <li
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={props.selectedNodeId === node.id}
      role="treeitem"
    >
      <div
        className={`layer-row${props.selectedNodeId === node.id ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
        ref={ref}
        style={{ paddingLeft: `${0.35 + depth * 0.85}rem` }}
      >
        {props.dragSource ? (
          <>
            <LayerDropZone
              activeDropTarget={props.activeDropTarget}
              anchor={{ intent: "before", nodeId: node.id }}
              page={props.page}
              parentById={props.parentById}
              source={props.dragSource}
            />
            <LayerDropZone
              activeDropTarget={props.activeDropTarget}
              anchor={{ intent: "inside", nodeId: node.id }}
              page={props.page}
              parentById={props.parentById}
              source={props.dragSource}
            />
            <LayerDropZone
              activeDropTarget={props.activeDropTarget}
              anchor={{ intent: "after", nodeId: node.id }}
              page={props.page}
              parentById={props.parentById}
              source={props.dragSource}
            />
          </>
        ) : null}

        {hasChildren ? (
          <button
            aria-label={`${expanded ? "Collapse" : "Expand"} ${node.meta.name}`}
            className="layer-toggle"
            onClick={() => {
              setExpandedIds((current) => {
                const next = new Set(current);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              });
            }}
            type="button"
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span aria-hidden="true" className="layer-toggle-spacer" />
        )}

        <button
          aria-current={props.selectedNodeId === node.id ? "true" : undefined}
          aria-label={`Select ${node.meta.name}`}
          className="layer-select"
          onClick={() => props.onSelectNode(node.id)}
          type="button"
        >
          <span aria-hidden="true" className="layer-icon"><Icon /></span>
          <span className="layer-name">{node.meta.name}</span>
          <span className="layer-type">{definition.library.label}</span>
          {hidden ? <span aria-label="Hidden" className="layer-status">◌</span> : null}
          {node.meta.locked ? <span aria-label="Locked" className="layer-status">⌑</span> : null}
        </button>

        <button
          aria-label={`Drag ${node.meta.name}`}
          className="layer-drag-handle"
          disabled={node.meta.locked}
          ref={handleRef}
          type="button"
        >
          ⋮⋮
        </button>
      </div>

      {hasChildren && expanded ? (
        <ul role="group">
          {node.childIds.map((childId) => (
            <LayerNode
              {...props}
              depth={depth + 1}
              expandedIds={expandedIds}
              key={childId}
              nodeId={childId}
              setExpandedIds={setExpandedIds}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LayersPanel(props: LayersPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<NodeId>>(
    () => new Set(Object.values(props.page.nodes).filter((node) => node.childIds.length > 0).map((node) => node.id)),
  );

  return (
    <div aria-labelledby="layers-title" className="layers-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-eyebrow">Navigate</p>
          <h2 id="layers-title">Layers</h2>
        </div>
        <span className="panel-count">{Object.keys(props.page.nodes).length}</span>
      </div>
      <p className="panel-intro">Select, inspect, and move nodes in the page tree.</p>

      {props.page.rootIds.length === 0 ? (
        <p className="layers-empty">This page has no layers.</p>
      ) : (
        <ul aria-label="Page layers" className="layers-tree" role="tree">
          {props.page.rootIds.map((nodeId) => (
            <LayerNode
              {...props}
              depth={0}
              expandedIds={expandedIds}
              key={nodeId}
              nodeId={nodeId}
              setExpandedIds={setExpandedIds}
            />
          ))}
        </ul>
      )}

      {props.dragSource ? (
        <LayerDropZone
          activeDropTarget={props.activeDropTarget}
          anchor={{ intent: "root", nodeId: null }}
          page={props.page}
          parentById={props.parentById}
          source={props.dragSource}
        />
      ) : null}
    </div>
  );
}
