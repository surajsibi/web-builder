---
doc_id: WEB-BUILDER-PHASE-2-ARCHITECTURE-VALIDATION
type: D5
scope: Web builder Phase 2 project hydration, Zustand state, command execution, transactions, history, selection, validation UI, and tests
authority: Derived implementation report; Project.md owns architectural intent and the linked source and tests own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against the workspace source and test results on 2026-08-07; invalidated by changes to any linked implementation, test, or Project.md section
---

# Phase 2 architecture validation report

## Outcome

Phase 2 implements the complete requested project/page/node state vertical slice:

- Atomic project hydration with schema validation, migration boundaries, tree validation, component validation, placement validation, and a project-wide runtime parent index.
- A vanilla Zustand builder store containing the hydrated document, active page, selection, dirty state, commit identity, and content-only undo/redo history.
- One pure synchronous executor for the eleven requested page and node commands.
- Candidate-first transactions: live state is never mutated during preparation, and one Zustand update commits an accepted candidate.
- Deterministic undo, redo, dirty-state, active-page, and selection behavior.
- A minimal browser validation harness for pages, nodes, commands, selection, and history.
- Forty-six behavior-focused tests across all nine test files in the repository.

The implementation is ready for architectural review. Drag-and-drop and the other explicitly excluded systems have not been started.

Primary sources:

- [Project.md](Project.md)
- [Project hydration](src/builder/project/hydration.ts)
- [Command contract](src/builder/commands/types.ts)
- [Command executor](src/builder/commands/execute-command.ts)
- [Builder store](src/builder/store/builder-store.ts)
- [Browser validation UI](src/builder/ui/phase-two-validation.tsx)

## Scope and versions

| Item | Value |
| --- | --- |
| Workspace | Web builder local workspace |
| Project schema | Version 1 |
| Component schemas | Version 1 for Section, Container, Heading, Text, Card, and Button |
| State library | Zustand 5.0.14 |
| Runtime | Next.js 16.3.0, React 19.2.8, TypeScript 5.9.3, Zod 4.4.3 |
| Implemented UI | Architecture validation harness only |
| Deployment | Not deployed |
| Git revision | Unavailable because the supplied workspace is not a Git worktree |

Explicit exclusions are drag-and-drop, Inspector UI, block templates, publishing, backend APIs, authentication, autosave, persistence APIs, and advanced canvas interactions.

## Final Zustand structure

The finalized public store contract is:

~~~ts
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

export type BuilderStoreState = {
  document: ProjectDocument | null;
  parentById: ParentById;
  activePageId: PageId | null;
  selectedNodeId: NodeId | null;
  dirty: boolean;
  commitId: number;
  history: HistoryState;
  hydrated: boolean;

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
  undo: () => HistoryActionResult;
  redo: () => HistoryActionResult;
};
~~~

State ownership is intentionally separated:

| State | Authority and lifecycle |
| --- | --- |
| document | Persistable project content after successful hydration |
| parentById | Runtime-only project-wide reverse index, rebuilt from canonical trees |
| activePageId | Session state; nullable only before hydration |
| selectedNodeId | Session state; always null or a node on the active page |
| dirty | Session persistence signal; true after an applied command, Undo, Redo, or a migration |
| commitId | Monotonic session commit counter |
| history | In-memory content-only snapshots |
| hydrated | Editing readiness boundary |

The store exposes no raw document setter. Ordinary persisted changes can enter state only through dispatchEditorCommand. Page switching and selection use separate session actions and do not create history or dirty the document.

## Hydration flow

The implementation is split across [hydration.ts](src/builder/project/hydration.ts), [migrations.ts](src/builder/project/migrations.ts), and [tree.ts](src/builder/project/tree.ts).

~~~text
unknown input
  -> preserve original payload
  -> parse JSON or clone object input
  -> read and validate schemaVersion
  -> run a contiguous document-migration chain
  -> validate the strict current ProjectDocument envelope
  -> validate page order, home page, slugs, record keys, and global node IDs
  -> validate every canonical page tree and build candidate parentById
  -> resolve component definitions
  -> run contiguous component migrations
  -> validate complete current props and ResponsiveStyles
  -> validate every root and child edge with canPlaceType
  -> rebuild and verify final parentById
  -> clone the prepared document
  -> one successful Zustand update
~~~

Hydration behavior:

1. The original string or object reference is returned as rawPayload and is never mutated.
2. String input is parsed. Object input is copied with structuredClone.
3. Future, unsupported-old, missing, or non-integer schema versions fail.
4. Document migrations are pure registry entries with explicit fromVersion and toVersion values.
5. The current envelope is strict: unknown fields and malformed required fields fail.
6. Cross-field invariants validate pageOrder, homePageId, canonical unique slugs, embedded IDs, and project-wide node ID uniqueness.
7. Tree validation rejects missing references, duplicate positions, multiple parents, roots used as children, orphans, cycles, excessive depth, and excessive project size.
8. Unknown component types, unsupported component versions, missing migration steps, invalid props, and invalid responsive styles fail with distinct stages.
9. Placement is revalidated after component migrations.
10. Zustand is populated only after all stages succeed. A failed hydration returns a structured error and leaves every existing state reference and history stack unchanged.
11. A successful hydration resets history and selection, chooses the requested existing page or Home, resets commitId, and marks dirty only when migration changed the document.

The structured hydration stages are json, document-version, document-migration, document-schema, tree, component-lookup, component-version, component-migration, props, styles, and placement.

## Command catalog

The finalized command contract is in [types.ts](src/builder/commands/types.ts). Runtime command envelopes are also strictly validated before a command-specific handler runs.

| Command | Applied behavior | Primary validation | Selection effect |
| --- | --- | --- | --- |
| page.create | Creates an empty non-home page, appends it, generates or normalizes its slug, and activates it | Name, explicit slug, slug uniqueness, project-wide page ID | Clears node selection |
| page.rename | Trims and changes only the page name | Existing page, non-empty name | Preserves selection |
| page.delete | Deletes an eligible page and all of its nodes | Existing page, Home/last-page protection, locked-node containment | If active, activates the next page, then previous, then Home; clears selection |
| node.insert | Clones current registry defaults into a new primitive node at an explicit destination | Page, component type, destination, direct parent lock, placement, defaults, project-wide node ID | Selects the new node only when targeting the active page |
| node.remove | Removes one complete subtree | Page membership, source/direct-parent locks, locked descendants | If active selection is removed, selects the former parent or null |
| node.move | Moves one subtree using final-index semantics | Page membership, source/current-parent/destination locks, cycle, index, placement | Selects the moved root only on the active page |
| node.rename | Trims and changes the readable node name | Page membership, node lock, non-empty name | Preserves selection |
| node.lock | Sets or clears the direct structural lock | Page membership, boolean shape | Preserves selection; unlocking is permitted |
| node.hide | Expresses visibility by changing the display style at one viewport | Page membership, node lock, viewport, final ResponsiveStyles | Preserves selection |
| node.updateProps | Replaces the complete props object | JSON object, node lock, strict current component props schema | Preserves selection |
| node.updateStyles | Applies one or more typed style changes to one responsive layer | Non-empty changes, target, JSON value, node lock, complete resulting ResponsiveStyles | Preserves selection |

All applied values contain command-relevant identities and destinations only. Valid already-represented requests return noop. Expected domain errors return rejected. Unexpected exceptions return failed with an errorId.

## Transaction flow

The transaction boundary is implemented by the pure executor and the Zustand dispatcher:

~~~text
dispatchEditorCommand(command, options)
  -> capture current immutable store snapshot
  -> validate runtime command envelope
  -> resolve and validate command references
  -> clone ProjectDocument
  -> apply changes only to the isolated clone
  -> run complete project hydration against the candidate
  -> obtain validated document + rebuilt parentById
  -> compute selection effect and history transaction
  -> one Zustand set
       document
       parentById
       activePageId
       selectedNodeId
       dirty
       commitId
       history
~~~

The public result union is:

~~~ts
export type CommandResult<Value extends CommandAppliedValue = CommandAppliedValue> =
  | {
      status: "applied";
      commitId: number;
      value: Value;
    }
  | {
      status: "noop";
      reason: CommandNoopReason;
    }
  | {
      status: "rejected";
      error: CommandValidationError;
    }
  | {
      status: "failed";
      errorId: string;
      message: string;
    };
~~~

Rollback is discard-based rather than compensating: preparation never mutates the live document, so rejected, no-op, and failed paths perform no Zustand update. A fault-injection test confirms that an exception thrown during ID generation leaves document, parent index, history, commit ID, and dirty state unchanged.

## Undo and redo design

History entries contain only the before and after DocumentContentSnapshot:

- Project name
- Pages
- Page order
- Home page ID

History deliberately excludes project identity, schema and component versions outside content, revisions, timestamps, parentById, active page, selection, commit IDs, dirty state, and UI state.

Behavior:

- Every applied document command adds one transaction and clears redo.
- Adjacent applied commands with the same historyGroupId retain the first before snapshot and replace the last after snapshot.
- No-op, rejected, failed, hydration, and session actions do not add history.
- Undo applies the previous content snapshot; Redo applies the stored after snapshot.
- Each replay runs full hydration again, atomically rebuilds parentById, increments commitId, and marks dirty.
- Replay does not rerun current command lock checks because it restores an already accepted snapshot.
- Undo and Redo move existing entries between past and future rather than creating new entries.
- Empty Undo or Redo returns noop.

## Selection lifecycle

Selection is a node ID only and is not part of document history.

| Event | Result |
| --- | --- |
| Successful hydration | Selection becomes null |
| Select an existing active-page node | selectedNodeId becomes that ID |
| Select a missing or inactive-page node | Session action is rejected; state is unchanged |
| Clear selection | Becomes null; repeated clear is a no-op |
| Switch active page | Selection clears without history, dirty change, or commit increment |
| Create page | New page becomes active and selection clears |
| Insert active-page node | New node becomes selected |
| Insert or move on inactive page | Existing active-page selection is preserved |
| Move active-page node | Moved subtree root becomes selected |
| Remove selected subtree | Former parent is selected; a removed root falls back to null |
| Delete active page | Defined neighboring page becomes active and selection clears |
| Undo or Redo | Existing active-page selection is retained; otherwise the prior parent chain is walked to the nearest surviving ancestor, then null |

Selected node data and parent data remain derived from document, activePageId, selectedNodeId, and parentById. They are not duplicated in store state.

## Validation rules

### Project and hydration rules

- A project contains at least one page.
- pageOrder lists every page exactly once.
- homePageId references an existing page whose slug is /.
- Page slugs are unique. Non-home slugs are canonical V1 single-segment paths.
- Page and node record keys equal embedded IDs.
- Node IDs are unique across the complete project.
- Timestamps are ISO datetimes with offsets; revision is a non-negative integer.
- Every page tree has complete single-position coverage and no missing references, duplicate positions, multiple parents, cycles, roots-as-children, or orphans.
- The current defensive limits are 10,000 nodes per project and a maximum depth of 100.
- Every component type exists in the static registry.
- Document migrations precede component migrations, and migration chains must be unambiguous and contiguous.
- Current props validate as complete strict objects; registry defaults are not merged during hydration.
- ResponsiveStyles validate as strict JSON-compatible base and responsive layers.
- Every final root and child edge passes canPlaceType.

### Command and transaction rules

- The discriminated command envelope is strict and rejects missing, wrongly typed, or extra fields.
- Referenced pages and nodes must exist, and node IDs must belong to the supplied page.
- Destination indexes are integers using inclusive final-index bounds.
- Cross-page node moves are not supported.
- Page and node names are trimmed and non-empty; readable node names may repeat.
- Explicit slugs normalize before validation and conflicts reject. Generated slug conflicts use the smallest numeric suffix.
- Generated page and node IDs are project-wide collision checked for up to 20 attempts.
- Locked nodes reject props, styles, names, direct structural changes, moves, and deletion.
- Locked containers reject direct child-list changes.
- Subtree and page deletion reject any contained locked node.
- An unlocked ancestor containing locked descendants may move when its own affected edges are editable.
- Move cycles are rejected before candidate mutation.
- canPlaceType is the sole type-level edge authority.
- updateProps validates the complete replacement object.
- updateStyles validates every target and JSON value, then the complete resulting ResponsiveStyles object.
- The complete candidate is rehydrated before commit, covering final tree, identity, props, styles, placement, and relationship invariants.

## Minimal browser validation UI

The root route renders [phase-two-validation.tsx](src/builder/ui/phase-two-validation.tsx). It includes:

- Page list in pageOrder and active-page switching
- Create, rename, and delete page commands
- Active-page node list
- Insert, move, remove, rename, lock, hide, prop update, and style update command buttons
- Selected-node name, type, ID, parent, lock, and visibility display
- Clear-selection control
- Commit, dirty, Undo, and Redo status
- Undo and Redo controls
- Last typed command result

Rendered-browser validation confirmed:

1. Home initially loads with commit 0, clean state, no selection, and disabled history controls.
2. Insert root Card creates Card 1, selects it, marks dirty, increments commit, and enables Undo.
3. Undo removes the Card and enables Redo.
4. Redo restores the Card.
5. Create page adds and activates Untitled Page at /untitled-page and enables page deletion.
6. Selecting Card 1 on Home displays its derived metadata.
7. Switching to Untitled Page clears selection without another content commit.

The browser console contained no application exception. Chrome injected a cz-shortcut-listen attribute into body, which caused a development-only React hydration diagnostic attributed to the browser extension rather than the application.

## Test coverage

Final automated result: **9 test files, 46 tests, all passing**.

| Test file | Tests | Validated behavior |
| --- | ---: | --- |
| [component-registry.spec.tsx](src/builder/registry/__tests__/component-registry.spec.tsx) | 7 | Exact six-component catalog; valid defaults and version; one semantic root for containers; button-versus-link semantics; safe new-tab attributes; unsafe link rejection; allowed root/container placement; leaf placement rejection |
| [define-component-registry.spec.tsx](src/builder/registry/__tests__/define-component-registry.spec.tsx) | 5 | Frozen registry lookup; invalid default rejection; unknown placement-reference rejection; duplicate inspector-capability rejection; incomplete migration-chain rejection |
| [schema.spec.ts](src/builder/styles/__tests__/schema.spec.ts) | 3 | Complete base with partial responsive patches; rejection of unknown/non-finite styles; rejection of nested patches that cannot resolve completely |
| [resolve.spec.ts](src/builder/styles/__tests__/resolve.spec.ts) | 2 | Base-to-tablet-to-mobile field-level cascade; cloned resolved values and persisted-layer immutability |
| [compile.spec.ts](src/builder/styles/__tests__/compile.spec.ts) | 2 | Dimension compilation; only active grid configuration emits; only active flex configuration emits |
| [hydration.spec.ts](src/builder/project/__tests__/hydration.spec.ts) | 6 | Successful hydration and parent index; input immutability; malformed JSON/raw preservation; future-version rejection; unknown component diagnostics; invalid tree rejection; strict props without default merging |
| [execute-command.spec.ts](src/builder/commands/__tests__/execute-command.spec.ts) | 10 | Malformed runtime command rejection; page create/slug/activation; page rename/delete/fallback; node insertion/defaults/index/selection; inactive-page selection preservation; atomic move and cycle rejection; direct locking and destructive containment; props/styles/hide validation; invalid-style atomic rejection; subtree deletion selection fallback |
| [builder-store.spec.ts](src/builder/store/__tests__/builder-store.spec.ts) | 8 | Successful empty-store hydration; failed hydration leaves live state untouched; applied versus no-op commit behavior; undo/redo content-only selection behavior; history grouping; page-switch selection and dirty behavior; rejected-command atomicity; unexpected-failure rollback |
| [phase-two-validation.spec.tsx](src/builder/ui/__tests__/phase-two-validation.spec.tsx) | 3 | Initial page/selection/history UI; node command with Undo/Redo controls; page create and activation through the executor |

Verification commands:

| Command | Result |
| --- | --- |
| pnpm test | Pass: 9 files, 46 tests |
| pnpm typecheck | Pass |
| pnpm lint | Pass with no warnings after cleanup |
| pnpm build | Pass; root route statically generated |
| Rendered browser exercise | Pass for page, node, selection, command, dirty, and history flows |

The Vitest run emits an upstream configuration notice that Vite now supports TypeScript paths natively. The production build emits an environment warning about an unrelated parent-directory lockfile at C:\Users\Suraj\pnpm-lock.yaml. Neither warning changes the passing result.

## Project.md conformance and intentional deviations

The implemented slice follows the core Project.md boundaries: canonical document trees, runtime-only parentById, strict hydration, pure candidate preparation, one atomic Zustand commit, typed result categories, direct structural locking, final-index moves, content-only history, non-historical selection, and no network work inside commands.

It does **not** match every Project.md detail exactly. The following differences are intentional and visible:

| Difference | Reason and effect |
| --- | --- |
| Requested command names differ from the frozen Project.md catalog | The approved Phase 2 request explicitly names page.delete, node.insert, node.lock, node.updateProps, and node.updateStyles. Project.md names the analogous commands page.remove, node.add, node.set-locked, node.update-props, and node.update-styles. The implementation follows the latest approved command API. |
| node.hide exists although Project.md says V1 has no node.set-hidden | The approved Phase 2 request explicitly requires node.hide. It does not add meta.hidden; display remains the only persisted visibility authority. Showing at desktop restores the registry default display, while showing at tablet/mobile removes that layer's display override. |
| Several Project.md commands are not implemented in this slice | page.change-slug, page.reorder, node.duplicate, node.reset-style, and block.insert are outside the approved Phase 2 command list. Block templates were also explicitly excluded. |
| Pre-hydration store fields are nullable | document and activePageId are null until hydration succeeds, while Project.md illustrates the successfully hydrated non-null store. This explicit boundary prevents invalid or partial documents from entering live state. |
| Advanced session fields are absent | hoveredNodeId, activeDropTarget, activeViewport, zoom, dragSession, and panel state are deferred because drag-and-drop and advanced canvas work were explicitly excluded. |
| Persistence lifecycle is absent | The slice exposes dirty and commitId but no PersistenceState, autosave observer, revision API, or save actions because backend APIs and publishing/authentication work were excluded. With no persistence subsystem present, failed hydration cannot accidentally enable autosave. |
| Failed raw payload is returned, not retained inside Zustand | HydrationResult preserves rawPayload for the loading boundary while the store remains unchanged. A future persistence/import controller must own longer-lived recovery storage. |
| The document-migration registry is empty | Schema version 1 is the only existing document version. The migration runner implements contiguous, unambiguous sequencing, but there is no historical version to migrate; unsupported older and future versions reject. |
| Minimal pre-migration validation currently reads schemaVersion only | Full strict envelope and JSON compatibility validation occurs immediately after document migration. This is sufficient for current V1 with no historical migrations, but the first real document migration should add a version-specific minimal raw-envelope schema before processing historical shapes. |
| Defensive tree limits are implementation choices | Project.md requires size and depth limits without fixed values. The implementation uses 10,000 project nodes and depth 100. |

The node.hide desktop unhide behavior is the only notable semantic tradeoff in the requested command set: because no separate hidden metadata or previous-display slot is persisted, it restores the component's registry-default display rather than an arbitrary earlier custom desktop display. Responsive unhide is lossless with respect to the inherited cascade because it deletes only that responsive display override.

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| IDs and factory | [ids.ts](src/builder/model/ids.ts), [id-generator.ts](src/builder/project/id-generator.ts), [factory.ts](src/builder/project/factory.ts) | Branded ID constructors, collision-aware generation, and deterministic empty Home projects |
| Slugs | [slug.ts](src/builder/project/slug.ts) | Canonical explicit slugs and deterministic generated collision suffixes |
| Hydration | [hydration.ts](src/builder/project/hydration.ts), [migrations.ts](src/builder/project/migrations.ts), [tree.ts](src/builder/project/tree.ts) | Untrusted documents either become one fully validated candidate or fail atomically |
| Commands | [types.ts](src/builder/commands/types.ts), [execute-command.ts](src/builder/commands/execute-command.ts) | One typed, runtime-validated mutation catalog and a pure candidate executor |
| State | [builder-store.ts](src/builder/store/builder-store.ts) | Atomic commits, dirty state, history, selection, and hydration readiness |
| Validation UI | [phase-two-validation.tsx](src/builder/ui/phase-two-validation.tsx), [page.tsx](src/app/page.tsx), [globals.css](src/app/globals.css) | Browser-accessible architectural exercise surface |
| Dependency | [package.json](package.json), [pnpm-lock.yaml](pnpm-lock.yaml) | Zustand added as the state container |

## Rollout and rollback

The work exists only in the local workspace and has not been deployed or connected to storage. No Git metadata is available in this workspace, so there is no repository commit or branch rollback point. Rollback would require restoring the listed files from an external workspace copy or version-control source.

## Durable documentation updates

This report is a draft implementation record. It does not replace or mutate [Project.md](Project.md), which remains the architecture authority. The existing [Phase 1 foundation summary](Phase-1-Foundation-Summary.md) remains the implementation report for the component and responsive-style foundation.

## Residual risks and review gates

- Review and approve the requested command-name divergence before drag-and-drop adapters are written; those adapters must target one stable catalog.
- Decide whether node.hide remains a first-class command or is replaced by ordinary style updates before Inspector work.
- Add a version-specific minimal raw-envelope schema when the first historical ProjectDocument migration is introduced.
- Add persistence lifecycle state and autosave only when backend/revision work is explicitly approved.
- Remove or migrate the existing vite-tsconfig-paths configuration notice during a dedicated tooling cleanup.
- Resolve the parent-directory lockfile warning through an explicit Turbopack root only if the workspace layout becomes authoritative.

No drag-and-drop implementation should begin until this report and its intentional command/API deviations are reviewed.
