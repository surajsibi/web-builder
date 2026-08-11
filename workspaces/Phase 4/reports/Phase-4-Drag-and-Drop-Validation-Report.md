---
doc_id: WEB-BUILDER-PHASE-4-DRAG-AND-DROP-VALIDATION
type: D5
scope: Web builder Phase 4 drag-and-drop, reordering, reparenting, Layers, breadcrumbs, keyboard actions, duplicate command, interaction overlays, and validation evidence
authority: Derived implementation report; prompt.md and Project.md own scope and architectural intent, while the linked source, tests, and runtime exercise own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Original Phase 4 delivery evidence was verified on 2026-08-07; the selected-component deletion follow-up was verified against the workspace source, 145 automated tests, TypeScript, ESLint, the production build, and rendered browser behavior on 2026-08-10; invalidated by changes to any linked implementation, test, dependency, prompt.md, or Project.md section
---

# Phase 4 drag-and-drop validation report

## Outcome

Phase 4 delivers the requested editor interaction slice:

- Modern drag-and-drop sources for the Component Library, selected Canvas node, and every unlocked Layers row.
- Reordering, reparenting, moving into or out of containers, moving between containers, and moving to the page root.
- Prevalidated before, inside, after, and root targets on both Canvas and Layers surfaces.
- Exactly one canonical `node.insert` or `node.move` command per accepted drag and no history mutations during drag motion.
- A recursive, synchronized Layers tree with expand/collapse, selection, icons, names, types, locked state, and active-viewport hidden state.
- Root-to-selection breadcrumbs with clickable ancestors.
- A visible, node-specific **Delete component** action in the Inspector Selection section that uses the canonical removal command.
- `Escape` parent selection, `Delete` removal, non-destructive `Backspace`, and `Ctrl+D`/`Cmd+D` subtree duplication.
- A complete `node.duplicate` executor path with fresh project-wide IDs, fresh readable names, preserved props/styles/component versions/lock flags, explicit placement, selection, typed result mapping, and one history entry.
- A layout-neutral Canvas interaction overlay for selection, parent context, empty-container guidance, drag handles, and drop indicators.
- Eighty-four behavior-focused tests across all sixteen test files, plus TypeScript, lint, production build, and interactive browser validation.

All requested Phase 4 features are implemented. No Phase 5 or explicitly excluded system was started.

Primary sources:

- [Phase 4 prompt](../../../prompt.md)
- [Project architecture](../../../Project.md)
- [Phase 3 validation report](../../../Phase-3-Editor-UI-Validation-Report.md)
- [Editor interaction architecture note](../notes/editor-interaction-architecture.md)
- [Command executor](../../../src/builder/commands/execute-command.ts)
- [Drag-and-drop resolver](../../../src/builder/ui/drag-and-drop.ts)
- [Editor Shell](../../../src/builder/ui/editor-shell.tsx)
- [Editor Canvas](../../../src/builder/ui/editor-canvas.tsx)
- [Layers panel](../../../src/builder/ui/layers-panel.tsx)

## Scope and versions

| Item | Value |
| --- | --- |
| Workspace | Web builder local workspace |
| Project schema | Version 1 |
| Component schemas | Version 1 for Section, Container, Heading, Text, Card, and Button |
| Drag-and-drop | `@dnd-kit/react` 0.5.0 |
| State | Zustand 5.0.14 |
| Runtime | Next.js 16.3.0, React 19.2.8, TypeScript 5.9.3, Zod 4.4.3 |
| Implemented route | `/` renders the Phase 4 editor |
| Persistence | In-memory browser state only |
| Deployment | Not deployed |
| Git revision | Unavailable because the supplied workspace is not a Git worktree |

Explicit exclusions preserved: publishing, backend APIs, database, authentication, templates, blocks, assets, media, AI generation, deployment, real persistence, preview mode, resize handles, and multi-selection.

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| Dependency | [package.json](../../../package.json), [pnpm-lock.yaml](../../../pnpm-lock.yaml) | Adds the modern `@dnd-kit/react` provider, draggable/droppable hooks, overlay, pointer behavior, and keyboard sensor behavior |
| Interaction types | [interaction/types.ts](../../../src/builder/interaction/types.ts) | Defines serializable component/node sources, Canvas/Layers surfaces, visual intents, canonical destinations, and drag session state |
| Command catalog | [commands/types.ts](../../../src/builder/commands/types.ts) | Adds the canonical `node.duplicate` request and typed applied result |
| Command executor | [execute-command.ts](../../../src/builder/commands/execute-command.ts) | Clones and validates complete subtrees atomically with fresh IDs and readable names |
| Store | [builder-store.ts](../../../src/builder/store/builder-store.ts) | Adds session-only drag source and active target state, cleared by hydration and page switching |
| Drop resolver | [drag-and-drop.ts](../../../src/builder/ui/drag-and-drop.ts) | Translates visual anchors to canonical final-index destinations and excludes invalid targets |
| Tree navigation | [tree-navigation.ts](../../../src/builder/ui/tree-navigation.ts) | Derives breadcrumbs, parent selection, and same-parent duplicate placement |
| Rendering boundary | [node-rendering-controller.tsx](../../../src/builder/rendering/node-rendering-controller.tsx) | Adds an optional editor recursion seam without changing semantic renderer props or defaults |
| Canvas | [editor-canvas.tsx](../../../src/builder/ui/editor-canvas.tsx) | Measures semantic roots and renders all interaction affordances in a separate positioned overlay |
| Layers | [layers-panel.tsx](../../../src/builder/ui/layers-panel.tsx) | Adds recursive tree navigation, synchronized selection, status indicators, handles, and drop targets |
| Left sidebar | [editor-left-sidebar.tsx](../../../src/builder/ui/editor-left-sidebar.tsx) | Adds Components/Layers tabs without adding a fourth workspace column |
| Breadcrumbs | [editor-breadcrumbs.tsx](../../../src/builder/ui/editor-breadcrumbs.tsx) | Shows and activates the selected ancestry path |
| Component Library | [component-library.tsx](../../../src/builder/ui/component-library.tsx) | Preserves click insertion and adds component drag sources |
| Inspector | [inspector-panel.tsx](../../../src/builder/ui/inspector-panel.tsx) | Exposes the selected node's accessible **Delete component** action and disables it for a directly locked node |
| Shell and keyboard | [editor-shell.tsx](../../../src/builder/ui/editor-shell.tsx) | Owns the drag provider, command adapter, announcements, visible removal callback, parent/delete/duplicate shortcuts, and editable-target guard |
| Editor styling | [globals.css](../../../src/app/globals.css) | Adds layout-neutral overlay, drop, Layers, breadcrumb, handle, and drag feedback presentation |
| Test environment | [vitest.setup.ts](../../../vitest.setup.ts) | Supplies the missing jsdom `ResizeObserver` surface required by the browser-oriented drag dependency |

## Final interaction flow

~~~text
Source activation
  Component Library | selected Canvas overlay handle | Layers handle
    -> EditorDragSource
    -> setDragSession                         no document/history change

Target discovery
  before | inside | after | page root
    -> resolveEditorDropTarget
       -> source/page validation
       -> direct-lock validation
       -> cycle validation
       -> canPlaceType
       -> final-index/range/no-op validation
    -> render/register valid targets only
    -> setActiveDropTarget                    no document/history change

Accepted drop
  component source -> node.insert
  node source      -> node.move
    -> dispatchEditorCommand
    -> isolated candidate + complete validation
    -> one Zustand commit
    -> one history entry + dirty + commitId
    -> clear drag session

Canceled or targetless drop
    -> clear drag session
    -> no command, commit, dirty, or history change
~~~

The detailed current-behavior description is maintained in the [editor interaction architecture note](../notes/editor-interaction-architecture.md).

## Drag validation rules

| Rule | Resolver behavior | Executor defense |
| --- | --- | --- |
| Active-page source | Rejects missing node/type before target registration | Resolves page and source identity again |
| Parent-child type compatibility | Calls `canPlaceType(parentType, sourceType)` | Calls placement validation and rehydrates final candidate |
| Cycle prevention | Walks `parentById` and excludes self/descendant parents | Collects source subtree and rejects a destination within it |
| Moving-node lock | Excludes a locked source | Rejects `node.move` on a locked source |
| Current-parent lock | Excludes moving a direct child out of a locked parent | Rejects direct structure change |
| Destination-parent lock | Excludes insert/move into a locked parent | Rejects destination structure change |
| Same-parent index | Calculates index after conceptual removal | Validates final-index range and detects current position |
| No-op | Excludes the resolved current final position | Returns `already-at-destination` if independently dispatched |
| Page root | Uses `parentId: null` and page `rootIds` | Validates root placement and final page tree |
| Complete document | Resolver limits visible targets | Candidate hydration revalidates tree, IDs, props, styles, and placement before commit |

## Duplicate command validation

`node.duplicate` is integrated into the strict command envelope and transaction pipeline. Its applied result contains:

~~~ts
{
  sourceNodeId: NodeId;
  duplicateNodeId: NodeId;
  idMap: Readonly<Record<NodeId, NodeId>>;
  destination: NodeDestination;
}
~~~

Validated behavior:

- The complete source subtree is copied.
- Every copy receives a fresh project-wide ID; generated collisions are retried and an exhausted generator rejects atomically.
- Every copy receives the next available readable component name.
- Component versions, props, responsive styles, child order, and direct lock flags are preserved.
- Child references are rewritten exclusively through the returned old-to-new ID map.
- A locked source subtree may be duplicated, but a locked destination parent rejects the command.
- The duplicate root is selected on the active page.
- One command creates one history entry; Undo removes the entire duplicate and Redo restores it.

## Selection lifecycle

| Interaction | Selection effect | History effect |
| --- | --- | --- |
| Canvas semantic node or empty-container overlay click | Select deepest mapped node | None |
| Layers row click | Select row node | None |
| Breadcrumb click | Select clicked ancestor | None |
| `Escape` | Select direct parent; no-op at page root | None |
| Accepted node move | Select moved subtree root | One entry |
| Duplicate | Select duplicate root | One entry |
| Inspector **Delete component** or `Delete` | Remove the selected subtree and select its former parent, or clear selection for a root | One entry |
| `Backspace` | Keep the selected subtree unchanged | None |
| Page switch | Clear selection and drag state | None |
| Undo/Redo | Content snapshot changes; surviving selection reconciliation remains as defined by the Phase 2 store | One history transition |

## Layout-neutral interaction layer

The Canvas no longer applies selection or empty-state classes that alter authored component presentation. Semantic root elements are measured through their existing refs. The separate overlay contains:

- Strong selected-node outline and label.
- Lighter selected-parent outline.
- Selected-node drag handle.
- Empty-container prompt, selection, handle, and drop zones aligned to one 48 px minimum editor interaction rectangle.
- Valid before, inside, after, and root drop zones.
- Active target labels and line/box feedback.

The browser exercise confirmed semantic roots remained normal section/article/paragraph elements; drag accessibility was attached to external handle buttons rather than semantic component roots. A review-reported Card mismatch was also reproduced and corrected: the original 48 px Card had a 72 px prompt and 48 px outline, while the corrected Desktop rendering aligns all three at 48 px. On Mobile, the authored Card remains 32 px tall and the editor-only prompt and outline share a 48 px hit area.

## Test coverage

The original Phase 4 delivery baseline contained sixteen passing files and eighty-five passing tests. The 2026-08-10 selected-component deletion follow-up runs within the expanded project suite of twenty-two passing files and 145 passing tests.

| Test file | Behavior validated |
| --- | --- |
| [execute-command.spec.ts](../../../src/builder/commands/__tests__/execute-command.spec.ts) | Page and node command results, transaction preparation, structural locks, move/remove behavior, complete subtree duplication, fresh IDs/names, preserved values/locks, selection, typed ID map, and locked-destination rejection |
| [hydration.spec.ts](../../../src/builder/project/__tests__/hydration.spec.ts) | Schema-version gates, migrations, tree/index construction, component data, placement, global IDs, and atomic invalid-document rejection |
| [component-registry.spec.tsx](../../../src/builder/registry/__tests__/component-registry.spec.tsx) | Six finalized definitions, defaults, responsive styles, child rules, inspector capabilities, placement, icons, and semantic render roots |
| [define-component-registry.spec.tsx](../../../src/builder/registry/__tests__/define-component-registry.spec.tsx) | Registry startup rejection for broken types, placement references, capabilities, defaults, versions, and migrations |
| [node-rendering-controller.spec.tsx](../../../src/builder/rendering/__tests__/node-rendering-controller.spec.tsx) | Recursive semantic rendering, viewport resolution, compiled styles, root registration, controlled classes, and empty-container slot behavior |
| [builder-store.spec.ts](../../../src/builder/store/__tests__/builder-store.spec.ts) | Atomic hydration, command commits/no-ops/failures, history grouping, undo/redo, selection/page/viewport behavior, and drag-session isolation/clearing |
| [compile.spec.ts](../../../src/builder/styles/__tests__/compile.spec.ts) | Controlled conversion from resolved style values to React CSS output |
| [resolve.spec.ts](../../../src/builder/styles/__tests__/resolve.spec.ts) | Desktop/tablet/mobile inheritance and override resolution |
| [schema.spec.ts](../../../src/builder/styles/__tests__/schema.spec.ts) | Responsive style schema acceptance, rejection, and JSON-safe constraints |
| [drag-and-drop.spec.ts](../../../src/builder/ui/__tests__/drag-and-drop.spec.ts) | Drop-command translation, one-history drop integration, Undo/Redo after drag, root insertion, final-index reorder, reparent/move-out, cycles, no-ops, locks, and invalid leaf destinations |
| [editor-breadcrumbs.spec.tsx](../../../src/builder/ui/__tests__/editor-breadcrumbs.spec.tsx) | Root-to-selection breadcrumb order, selected crumb state, and ancestor activation |
| [editor-shell.spec.tsx](../../../src/builder/ui/__tests__/editor-shell.spec.tsx) | Complete shell, click insertion, Canvas selection, viewport/Inspector editing, layout-neutral selection, aligned empty Card prompt/selection geometry, parent shortcut, subtree duplication with Undo/Redo, visible Inspector deletion with parent-selection fallback, `Delete` removal, non-destructive `Backspace`, and editable-control shortcut guards |
| [insertion-target.spec.ts](../../../src/builder/ui/__tests__/insertion-target.spec.ts) | Click-insertion target derivation, container insertion, sibling fallback, and placement rejection |
| [layers-panel.spec.tsx](../../../src/builder/ui/__tests__/layers-panel.spec.tsx) | Recursive tree, selected row, component metadata, active-viewport hidden state, locked state/disabled handle, collapse/expand, and row selection |
| [phase-two-validation.spec.tsx](../../../src/builder/ui/__tests__/phase-two-validation.spec.tsx) | Retained Phase 2 browser harness for page/node command, selection, and history regressions |
| [tree-navigation.spec.ts](../../../src/builder/ui/__tests__/tree-navigation.spec.ts) | Breadcrumb derivation, parent target, and duplicate destination derivation without mutation |

The `test-case-writer` behavior-first rules influenced Phase 4 coverage: test names describe outcomes, UI tests query accessible roles and labels, and pure adapters are tested without mocking the command or store architecture.

## Verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Full automated regression | `pnpm test` | Pass on 2026-08-10: 22 files, 145 tests | Vitest reports an advisory that native Vite path resolution could replace `vite-tsconfig-paths` later |
| Static types | `pnpm typecheck` | Pass | None observed |
| Lint and accessibility rules | `pnpm lint` | Pass | Automated rules do not replace a full accessibility audit |
| Production compilation | `pnpm build` | Pass: static `/` and `/_not-found` generated | Next warns about an unrelated parent-directory lockfile/root discovery; build output is valid |
| Browser shell and responsive state | Local Next.js route in the in-app browser | Pass: hydrated editor, Desktop/Mobile switch, selection, Inspector, and responsive artboard | Local development runtime only |
| Empty Card overlay geometry | Browser Section â†’ Card exercise plus `editor-shell.spec.tsx` | Pass: Desktop Card/prompt/outline are 48 px; Mobile authored Card is 32 px while prompt/outline align at the 48 px editor minimum | The minimum hit rectangle is editor-only and may be taller than an otherwise zero-height semantic container |
| Layers and breadcrumb synchronization | Browser nested Section → Card → Text exercise | Pass: recursive rows, selected state, collapse/expand, and breadcrumbs synchronized | Single active page exercised |
| Keyboard selection and duplication | Browser `Escape` and `Ctrl+D` exercise | Pass: Text → Card parent selection; Card subtree duplicated as Card 2/Text 2 | Clipboard/copy-paste is out of scope |
| Duplicate history | Browser Undo/Redo plus automated executor/store tests | Pass: duplicate removed/restored as one entry | In-memory history only |
| Accepted drag transaction | Keyboard drag of Card 2 from Layers | Pass: Card 2 moved from Section 1 into Card 1 after Text 1 with one command | Pointer drag was not the sole browser path; keyboard drag exercised the same provider and drop pipeline |
| Drag Undo/Redo | Browser Inspector parent metadata | Pass: Undo restored parent `Section 1`; Redo restored parent `Card 1` | In-memory history only |
| Canvas drag source | Browser selected Canvas overlay handle | Pass: drag session and valid targets activated; Escape canceled and cleared it | The selected node exposes the Canvas handle; unselected Canvas nodes are selected first |
| Component Library drag source | Browser Add Button keyboard drag | Pass: Canvas root target appeared and cancellation announced cleanly | Drop was canceled because node insertion was already validated by click and pure drag adapter tests |
| Semantic output isolation | Browser accessibility tree and screenshot | Pass: semantic article/paragraph tree remained non-draggable; external buttons owned drag behavior | Preview/published modes remain out of scope |
| Delete behavior | Browser Inspector action plus `editor-shell.spec.tsx` and command tests | Pass on 2026-08-10: the visible node-specific control removed the selected component; automated coverage verifies UI history/fallback, `Delete` removal, non-destructive `Backspace`, and editable-control protection | Locked deletion is covered by command protection and the disabled Inspector state rather than the seeded browser document |

## Decisions and deviations

### Phase 4 prompt

The implementation matches the requested Phase 4 deliverables. No prompt feature was intentionally omitted. The Canvas uses a selected-node overlay drag handle instead of making authored semantic roots draggable; this is the concrete implementation of the prompt's dedicated interaction-layer requirement and preserves semantic output.

### Project.md

The following differences are explicit:

1. **Approved runtime command spellings remain from Phase 2.** The implementation uses `node.insert`, `node.updateProps`, `node.updateStyles`, `node.lock`, `node.hide`, and `page.delete`, while the broader Project.md contract uses `node.add`, kebab-case update/lock commands, no V1 hidden command, and `page.remove`. Phase 4 did not rename or duplicate frozen commands. Its drag adapter uses the implemented canonical `node.insert`/`node.move` boundary, and the requested `node.remove`/`node.duplicate` spellings match.
2. **The active drop target is richer session data.** Project.md sketches `activeDropTarget: NodeDestination | null`; the implementation stores `EditorDropTarget | null`, which includes the canonical `NodeDestination` plus surface, visual intent, target identity, and feedback label. It remains serializable, session-only, and never enters persisted state.
3. **The full Project.md store surface is not present.** Hover, zoom, panel layout, clipboard, and persistence lifecycle fields remain outside the approved Phase 1–4 slices. Phase 4 adds only the drag session fields it requires.
4. **Global CSS remains the existing editor styling mechanism.** Project.md names Tailwind CSS, but the approved Phase 3 codebase uses [globals.css](../../../src/app/globals.css). Phase 4 extended that existing mechanism rather than introducing a second styling system.
5. **Capture guards for arbitrary authored navigation/forms remain future work.** Phase 4 keeps overlays external and guards editor keyboard shortcuts in editable controls, but a generalized preview/edit interaction suppression system is not implemented because preview mode and advanced Canvas interaction are explicitly out of scope.

None of these differences bypasses hydration, registry placement, command validation, locking, rendering, transaction, or history boundaries.

## Rollout and rollback

This change exists only in the local workspace and is not deployed. There is no repository branch or commit because the supplied workspace has no Git metadata.

Rollback is file-level:

- Remove `@dnd-kit/react` and its lockfile entries.
- Revert the Phase 4 interaction types, command/store changes, UI modules, styles, and tests listed in this report.
- Restore the Phase 3 shell/Canvas/Component Library implementations.

Persisted-schema rollback or data migration is not required because Phase 4 adds no persisted document field or schema version. In-memory documents created during a browser session are discarded when the page reloads.

## Durable documentation updates

- [Editor interaction architecture](../notes/editor-interaction-architecture.md) records current Phase 4 boundaries and flows as a draft A1 derived view.
- This report records implementation and verification evidence as a draft D5 artifact.
- [Project.md](../../../Project.md) was not rewritten; it remains the architecture-intent authority.
- [Phase 4 workspace](../workspace.md) is updated to the review milestone and links both deliverables.

Both new documents require an accountable owner before promotion from draft.

## Residual risks and follow-up

- Pointer behavior is supplied by `@dnd-kit/react` and automated logic tests; the browser exercise completed the same provider path through keyboard dragging. A future cross-browser pointer/touch matrix should be part of the advanced interaction phase.
- Dense or deeply nested layouts may need collision-priority tuning after broader real-content testing. The current resolver remains authoritative for validity even if target-selection ergonomics evolve.
- The Layers expand set is local UI state. A newly duplicated subtree appears collapsed until expanded; this does not affect selection, document state, or drag validity.
- The development build reports that Next.js ignored an unrelated `C:\Users\Suraj\pnpm-lock.yaml` while discovering the Turbopack root. The workspace production build still passes; repository-root configuration can be tightened if this workspace is formalized.
- The Vite advisory about replacing `vite-tsconfig-paths` with native path resolution is maintenance-only and does not affect current test results.

Phase 4 is ready for user review. Phase 5 work has not begun.
