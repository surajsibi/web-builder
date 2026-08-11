---
doc_id: WEB-BUILDER-PHASE-4-EDITOR-INTERACTION-ARCHITECTURE
type: A1
scope: Web builder Phase 4 editor interaction layer, drag-and-drop adapters, navigation derivations, keyboard actions, and layout-neutral Canvas overlays
authority: Derived current-behavior architecture description; Project.md owns architectural intent and the linked source and tests own implemented behavior
owner: Unassigned; accountable Architecture Owner required before promotion from draft
lifecycle: draft
freshness: Verified against the linked source, 145 automated tests, TypeScript, ESLint, the production build, and rendered selected-component deletion behavior on 2026-08-10; broader drag-and-drop browser evidence remains dated 2026-08-07; invalidated by changes to the command, store, rendering, drag-and-drop, Canvas, Layers, breadcrumb, Inspector removal, or keyboard implementation
---

# Editor interaction architecture

## Purpose and authority

This note describes the Phase 4 interaction architecture currently implemented in the web builder. It is a feature-scoped, derived view for engineers reviewing or extending editor interactions. It does not replace [Project.md](../../../Project.md), which remains authoritative for product and architectural intent.

Implemented behavior is owned by the linked source contracts and tests. The accompanying [Phase 4 validation report](../reports/Phase-4-Drag-and-Drop-Validation-Report.md) records verification and deviations.

## System boundary

The editor separates four concerns:

| Concern | Responsibility | Primary implementation |
| --- | --- | --- |
| Semantic rendering | Render one registry-defined semantic root with validated props and compiled responsive styles | [Node rendering controller](../../../src/builder/rendering/node-rendering-controller.tsx) |
| Interaction derivation | Resolve breadcrumbs, parent selection, duplication destinations, and visual drop intentions without mutation | [Tree navigation](../../../src/builder/ui/tree-navigation.ts), [drag-and-drop resolver](../../../src/builder/ui/drag-and-drop.ts) |
| Session state | Hold selection, viewport, active drag source, and active visual target without document history | [Builder store](../../../src/builder/store/builder-store.ts) |
| Persisted editing | Validate and atomically apply canonical commands with one history transaction | [Command executor](../../../src/builder/commands/execute-command.ts), [command contract](../../../src/builder/commands/types.ts) |
| Selected-component actions | Expose a visible, accessible removal control without bypassing commands, locks, selection fallback, history, or announcements | [Inspector](../../../src/builder/ui/inspector-panel.tsx), [Editor Shell](../../../src/builder/ui/editor-shell.tsx) |

No interaction component receives a raw Zustand setter. Document relationships and content change only through `dispatchEditorCommand(...)`.

## Interaction contracts

The session-level drag contracts are defined in [interaction types](../../../src/builder/interaction/types.ts):

~~~ts
export type DragSurface = "canvas" | "layers";

export type EditorDragSource =
  | {
      kind: "component";
      componentType: ComponentType;
    }
  | {
      kind: "node";
      nodeId: NodeId;
      surface: DragSurface;
    };

export type DropIntent = "before" | "inside" | "after" | "root";

export type EditorDropTarget = {
  surface: DragSurface;
  intent: DropIntent;
  targetNodeId: NodeId | null;
  destination: NodeDestination;
  label: string;
};

export type DragSession = {
  source: EditorDragSource;
};
~~~

`EditorDropTarget` retains surface, visual intent, target identity, and feedback label for the interaction layer. Its `destination` is the canonical command payload. Only that canonical destination crosses into persisted mutation.

## Drag-and-drop flow

~~~text
Component Library item | selected Canvas overlay handle | Layers row handle
  -> @dnd-kit EditorDragSource
  -> setDragSession(source)                        session-only
  -> render candidate overlay drop zones
  -> resolveEditorDropTarget(page, parentById, source, anchor, surface)
       -> page/source checks
       -> direct lock checks
       -> cycle checks
       -> canPlaceType(parentType, childType)
       -> final-index and no-op checks
  -> expose only valid EditorDropTarget zones
  -> setActiveDropTarget(target)                   session-only
  -> drag end
       -> commandForEditorDrop(...)
          component -> node.insert
          node      -> node.move
       -> dispatchEditorCommand(command)           one persisted transaction
  -> clear dragSession + activeDropTarget
~~~

Drag motion and target changes never mutate the document, `parentById`, dirty state, commit identity, or history. An accepted drag dispatches exactly one command. Cancellation or a missing valid target dispatches no command.

The implementation uses the modern [`@dnd-kit/react`](https://dndkit.com/react) provider and hooks. The installed package is pinned to `0.5.0` in [package.json](../../../package.json); package metadata is available from [npm](https://www.npmjs.com/package/@dnd-kit/react).

## Destination semantics

Visual anchors translate to `NodeDestination` before dispatch:

| Visual intent | Canonical destination |
| --- | --- |
| `root` | `parentId: null`, append after conceptual source removal |
| `inside` | Target node as parent, append after conceptual source removal |
| `before` | Target parent and target final index |
| `after` | Target parent and target final index plus one |

For a same-parent move, the resolver conceptually removes the source before calculating the final index. A destination that resolves back to the current final index is excluded as a no-op.

The resolver rejects:

- A source outside the active page.
- A locked moving node.
- A locked current parent whose direct children would change.
- A locked destination parent.
- Moving a node into itself or a descendant.
- A parent-child type pair rejected by `canPlaceType(...)`.
- An out-of-range final index.
- A no-op final position.

The command executor repeats authoritative validation against the immutable current snapshot and validates the complete candidate document before commit.

## Canvas interaction overlay

[Editor Canvas](../../../src/builder/ui/editor-canvas.tsx) keeps authored layout separate from editor feedback:

1. `NodeRenderingController` renders semantic roots without editor wrappers.
2. Root elements are registered in external maps and measured relative to the artboard.
3. A positioned interaction layer renders:
   - The selected-node outline and name.
   - A lighter parent outline.
   - A selected-node drag handle.
   - Empty-container prompts and hit targets.
   - Valid before, inside, after, and page-root drop zones.
4. Overlay elements are session UI only and never enter component props, styles, or saved JSON.

Empty containers resolve one shared interaction rectangle for their prompt, selected outline, drag handle, and drop zones. That rectangle preserves the measured semantic-root width and position while enforcing a 48 px minimum editor hit height. The prompt is inset and clipped inside the same rectangle. This keeps zero-height Containers and compact responsive Cards discoverable without changing authored component styles or semantic layout.

Canvas dragging starts from the selected node's overlay handle. This keeps drag semantics and keyboard affordances off authored semantic elements and avoids layout-changing wrappers or nested interactive roles. A user selects an unselected Canvas node before dragging it; Layers provides a direct handle for every visible unlocked row.

`NodeRenderingController` exposes an optional `renderChild` seam so the editor can preserve recursive measurement behavior without changing the registry renderer contract. Preview and future published rendering can continue using its default pure recursion.

## Layers and breadcrumbs

[Layers panel](../../../src/builder/ui/layers-panel.tsx) recursively derives its tree from `rootIds`, `childIds`, registry metadata, resolved viewport styles, and selection state. It owns only local expand/collapse state. It renders:

- Component icon, readable name, and type.
- Selected tree-item state.
- Locked and active-viewport hidden indicators.
- Expand/collapse controls.
- Selection and drag handles.
- Layout-neutral before, inside, after, and root drop zones during a drag.

The hidden indicator is derived from resolved `display: none`; no persisted `meta.hidden` is introduced.

[Breadcrumbs](../../../src/builder/ui/editor-breadcrumbs.tsx) derive the root-to-selection path from the active page and project-wide `parentById`. Clicking an ancestor calls the session-only selection action. Breadcrumbs and Layers do not write document or history state.

## Removal actions

The Inspector Selection section exposes a **Delete component** button whenever a node is selected. Its accessible name includes the selected node name. The button is disabled for a directly locked node and explains that the component must be unlocked before deletion.

Activating the button cancels any active visual-edit preview and dispatches the same canonical `node.remove` command used by the `Delete` keyboard shortcut. The command executor remains responsible for subtree lock protection, complete document validation, one history transaction, and selecting the former parent or clearing a removed page-root selection. The shell reports success or rejection through the editor status region, so the UI control does not introduce a second mutation path.

## Keyboard actions

[Editor Shell](../../../src/builder/ui/editor-shell.tsx) owns global editor shortcuts and ignores events originating in inputs, textareas, selects, or editable content:

| Key | Behavior | History |
| --- | --- | --- |
| `Escape` | Select the current node's parent; do nothing at a page root | None |
| `Delete` | Dispatch `node.remove` for the selected node | One entry when applied |
| `Backspace` | No editor action; the selected node remains unchanged | None |
| `Ctrl+D` / `Cmd+D` | Dispatch `node.duplicate` immediately after the selected node | One entry when applied |

Delete inherits subtree lock protection and selection fallback from the command executor. Duplication selects the duplicate root.

## Duplicate command

`node.duplicate` is a canonical persisted command with an explicit destination. The executor:

1. Resolves the source and validates the destination.
2. Permits reading a locked source subtree but requires an editable destination structure.
3. Collects the complete subtree.
4. Generates fresh project-wide IDs with collision checks for every node.
5. Generates fresh page-local readable names.
6. Clones component versions, props, responsive styles, child order, and lock flags.
7. Rewrites child IDs through the complete old-to-new map.
8. Inserts the duplicate root at the explicit destination.
9. Rehydrates and validates the complete candidate.
10. Selects the duplicate root and returns the complete ID map in one applied result.

## Session and history boundary

Phase 4 adds these session fields and actions to the existing Zustand structure:

~~~ts
dragSession: DragSession | null;
activeDropTarget: EditorDropTarget | null;

setDragSession(session: DragSession | null): SessionActionResult;
setActiveDropTarget(target: EditorDropTarget | null): SessionActionResult;
~~~

Starting, hovering, canceling, or clearing a drag preserves document identity, `parentById`, dirty state, `commitId`, and history identity. Hydration and active-page changes clear drag state atomically with other page-specific session state.

Undo and redo remain content-snapshot operations. Because one accepted drop dispatches one command, one Undo reverses the entire move and one Redo restores it.

## Accessibility and feedback

- Layers uses `tree`, `treeitem`, and `group` relationships with `aria-selected` and `aria-expanded` state.
- Canvas and Layers drag handles are buttons and inherit `@dnd-kit` keyboard dragging.
- Valid targets have readable labels and invalid targets are not registered.
- The shell announces drag start, accepted drop, cancellation, missing target, duplication, deletion, selection changes, and command failures through its live status region.
- The Inspector removal button uses the visible label **Delete component** and a node-specific accessible name such as **Delete Text 1**.
- The interaction overlay does not change semantic component roles.

## Scope boundary

This architecture does not include publishing, backend APIs, persistence services, authentication, templates, blocks, assets, deployment, preview mode, resize handles, multi-selection, or cross-page node moves. Those capabilities require separate approved slices.

## Maintenance

This draft must be reviewed and assigned to an accountable Architecture Owner before promotion. Update it in place when any linked Phase 4 interaction contract or boundary changes; archive or merge it into a broader maintained architecture description when the feature workspace closes.
