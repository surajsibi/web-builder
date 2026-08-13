---
doc_id: WEB-BUILDER-BOOLEAN-STATE-FOUNDATION-IMPLEMENTATION-REPORT
type: D5
scope: Reusable Boolean State, State Action, Conditional Content, page-scoped runtime, node-reference authoring, and reference-safe duplication in the standalone web builder
authority: Verified implementation record; code and automated tests remain authoritative for behavior, and Project.md remains authoritative for durable architecture
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on feat/boolean-state-foundation after the accepted refinements, 439 serialized tests, TypeScript, full ESLint, a Next.js production build, and applicable Editor/Preview browser QA on 2026-08-13; invalidated by relevant code, test, dependency, runtime, branch, or review-status changes
---

# Implementation report: Boolean State Interaction Foundation

## Outcome

The web builder now has a small, reusable Boolean interaction foundation instead of a visibility-specific or Drawer-specific state system.

V1 introduces three authored components:

- **Boolean State** owns one page-scoped runtime Boolean value.
- **State Action** changes a referenced Boolean State through Turn On, Turn Off, or Toggle.
- **Conditional Content** shows or removes an authored subtree according to a referenced Boolean State.

The current value exists only inside the rendered page session. It does not enter the project document, Zustand editor state, undo history, revision tracking, autosave, or preview snapshot data. Only the Boolean State node's authored `defaultValue` is persisted.

The implementation also adds one shared Boolean condition evaluator, typed node-reference metadata, a readable Inspector picker, unresolved-reference diagnostics, and duplication-aware reference remapping. These capabilities are generic enough to support later Boolean consumers such as variant switching and conditional styling without redesigning the state owner, condition, or action contract.

Drawer conversion was intentionally not implemented. A future Drawer must consume this Boolean State runtime and remain responsible only for Drawer-specific behavior such as portals, focus management, Escape handling, backdrop behavior, accessibility semantics, and scroll locking.

## Scope and versions

| Item | Value |
| --- | --- |
| Repository | Standalone `web builder` workspace |
| Branch | `feat/boolean-state-foundation` |
| Base commit | `e15cd9f798ad7b90ee7a9526627af73d583e346b` |
| Framework | Next.js 16.3.0, React 19.2.8, TypeScript 5.9.3 |
| Implementation state | Local and uncommitted; no release or deployment performed |
| Previous work protection | `stash@{0}` remains preserved and was not applied or modified |

Included in V1:

- Runtime-only page-scoped Boolean values.
- Persisted authored defaults.
- Stable node-ID references and readable node names.
- Turn On, Turn Off, and Toggle operations.
- A dedicated State Action authoring surface.
- Conditional Content for both On and Off branches.
- Multiple actions and consumers referencing one state.
- Equivalent Editor and Preview runtime providers.
- Inactive-content authoring in Editor.
- Immediate absence and unmounting in Preview.
- Fresh descendant runtime instances when content reopens.
- Ordinary responsive sizing, layout, position, and z-index styling on Conditional Content.
- Generic page-node reference metadata, selection, resolution, and diagnostics.
- Internal-reference remapping during connected subtree duplication.
- External-reference preservation when only a consumer is duplicated.
- An explicit presence boundary for future animation work.
- Behavior coverage for authored default changes, runtime deletion, reference reconnection, native Enter/Space activation, and unrelated page edits.

Excluded from V1:

- String or numeric variables.
- Formulas, expressions, workflow engines, or automation.
- Server state, cross-page state, or persisted visitor state.
- Authored entrance or exit animations.
- Variant-switching and conditional-style authoring interfaces.
- Generic action bindings on Button, Link, Image, Icon, or Container.
- Connected interaction blocks with template-local references.
- Drawer conversion or a Drawer-specific state registry.

## Architecture implemented

### Runtime flow

```text
Boolean State node.defaultValue
  -> page-scoped Boolean runtime provider
  -> runtime value keyed by stable node ID
  -> State Action dispatches Boolean action
  -> every consumer reads the same runtime value
  -> Conditional Content evaluates showWhen
  -> Editor authoring reveal or Preview presence decision
```

The runtime provider scans the active page for valid Boolean State nodes and initializes a transient value map from their persisted defaults. It exposes three operations:

- `has(stateNodeId)` checks whether a valid state exists in this page runtime.
- `read(stateNodeId)` reads its current Boolean value.
- `dispatch(action)` applies a generic Boolean set or toggle action and reports whether the target was handled.

The reusable `evaluateBooleanCondition(runtime, condition)` helper reads `{ stateNodeId, equals }`, returns `false` for unresolved targets, and provides one comparison rule for Conditional Content and future Boolean consumer adapters.

Changing pages creates a separate runtime session. Adding, deleting, or changing the authored default of a Boolean State reconciles the provider definitions. A changed authored default resets that state's runtime value; unrelated states keep their live values while their definitions remain unchanged.

### Generic action contract

The interaction contract is not named after visibility or Drawer behavior. It supports:

```ts
type InteractionAction =
  | { kind: "boolean.set"; stateNodeId: NodeId; value: boolean }
  | { kind: "boolean.toggle"; stateNodeId: NodeId };
```

State Action translates its authored `turn-on`, `turn-off`, or `toggle` setting into this shared runtime contract. Later existing-component bindings can dispatch the same actions after their own activation, navigation, submission, disabled-state, and accessibility rules are designed.

### Generic consumer boundary

Conditional Content is the first consumer adapter, not the state system itself. It passes its target and authored `showWhen` value to the shared Boolean condition evaluator.

This separation leaves room for later adapters:

- Variant consumers can choose one of two authored variants.
- Style consumers can select an alternate authored style set.
- Specialized Drawer components can read or dispatch the same state while owning modal behavior.

Those adapters remain outside V1, but they do not require changing Boolean State identity, runtime storage, reference metadata, or action dispatch.

### Presence and animation boundary

Desired visibility and mounted presence pass through a dedicated `ConditionalPresence` boundary.

V1 implements the deliberately small rule:

- Matching condition: render the authored subtree.
- Unmatched or unresolved condition in Preview: return `null` immediately.

This means inactive Preview descendants do not remain mounted, focusable, effectful, or able to create portals. When the condition matches again, React creates fresh descendant runtime instances from authored defaults. Saved node IDs, props, styles, and tree relationships remain unchanged.

The boundary prevents the consumer from hard-coding presence logic throughout the renderer. A future animation release can extend it with entering, visible, exiting, and absent phases, but that release must separately prove bounded noninteractive exit, reduced-motion behavior, rapid reversal safety, stale-completion protection, a completion fallback, and final unmount.

## Component behavior

### Boolean State

| Property or behavior | V1 result |
| --- | --- |
| Persisted prop | `defaultValue: boolean` only |
| Stable identity | Existing builder node ID |
| Readable identity | Existing editable `meta.name` |
| Visual output | None in Editor Canvas and Preview |
| Authoring access | Component Library, Layers, breadcrumbs, and Inspector |
| Scope | One rendered page session |
| Reload behavior | Reinitializes from the authored default |
| Sharing | Any number of same-page actions and consumers may reference it |

Boolean State intentionally has no visual style controls. Creating an editor-only Canvas card would have changed page layout and broken Editor/Preview parity, so nonvisual state remains discoverable through Layers and Inspector instead.

### State Action

State Action renders a native `<button type="button">` with:

- Visible authored text.
- One Boolean State node reference.
- Turn On, Turn Off, or Toggle.
- Authored disabled state.
- Normal sizing, spacing, background, border, typography, and positioning controls.

Native button semantics provide keyboard activation and prevent accidental form submission. State Action is allowed directly inside Form but remains a non-submit control.

When the target is empty, missing, the wrong type, or unavailable on the current page:

- The action exposes unresolved status.
- It reports `aria-disabled`.
- Activation performs no runtime mutation.
- The unresolved authored ID is preserved for diagnosis and repair.

In Editor, State Action is the only component allowed to perform its runtime operation directly on the Canvas. Selection still updates, while drag and visual-edit overlays are suppressed when they would block the direct click target.

### Conditional Content

Conditional Content is a real builder container rather than a visibility flag attached to arbitrary content. It supports ordinary authored styles, including:

- Block, flex, or grid layout.
- Width and height.
- Margin and padding.
- Background and background image.
- Border and effects.
- Static, relative, absolute, fixed, or sticky positioning.
- Authored z-index.

This supports a normal dropdown arrangement where the outer parent is relative and Conditional Content is absolute with a higher z-index. It also supports simple fixed sidebars. Specialized overlay components such as production Drawers or complex popovers may later portal their visual surface when clipping, stacking contexts, focus containment, or modal semantics require it.

Editor and Preview intentionally differ only in authoring treatment:

- **Editor:** inactive content remains mounted, visually muted, selectable, and editable without changing saved state or activating visitor behavior.
- **Preview:** inactive or unresolved content is absent and its descendants are not mounted.

## Typed references and Inspector behavior

The component registry now supports optional typed reference declarations containing:

- The string prop path storing the node ID.
- The required target component type.
- Page scope.
- Duplication behavior.

Registry validation rejects:

- Reference paths not present in default props.
- Reference paths whose defaults are not strings.
- Duplicate reference paths.
- Unknown target component types.
- `node-reference` Inspector controls without matching reference metadata.
- Unsupported reference scopes.
- Unsupported duplication policies.

The Inspector uses the metadata to provide a generic page-aware picker. For Boolean State references it:

- Lists only Boolean State nodes from the current page.
- Shows readable node names rather than requiring raw ID entry.
- Adds the stable node ID when readable names are duplicated.
- Preserves an unavailable authored ID in the option list.
- Reports empty, deleted, wrong-type, and cross-page states distinctly.

Reference candidate discovery, resolution, scope enforcement, and duplication behavior are centralized in [`node-references.ts`](../../../src/builder/project/node-references.ts). The service reads the complete registry metadata, so future typed references do not need to recreate page, target, or clone-policy rules in each Inspector or command component.

## Duplication and deletion behavior

Node duplication now consults registry reference metadata after assigning every fresh ID in the duplicated subtree.

Rules:

- If a referenced target is also part of the duplicated subtree, the duplicate points to the target's fresh ID.
- If the target is outside the duplicated subtree, the duplicate preserves the existing valid external target.
- The source nodes and source references remain unchanged.
- Reference rewriting occurs inside the same validated duplication transaction.

Deleting a referenced Boolean State does not destructively rewrite its consumers. They preserve the unresolved ID, display an Inspector warning, and fail safely at runtime. This keeps Undo/Redo and later reconnection predictable.

Connected Component Library blocks were deferred because block templates currently receive generated IDs only during materialization and have no template-local identity for safe internal references.

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| Interaction contracts | [`interaction/types.ts`](../../../src/builder/interaction/types.ts) adds generic Boolean conditions and actions | State operations are reusable beyond visibility and Drawer terminology |
| Runtime | [`boolean-state-runtime.tsx`](../../../src/builder/interaction/boolean-state-runtime.tsx) adds the page-scoped provider, shared condition evaluator, lookup, dispatch, reconciliation, and presence boundary | Multiple consumers share one transient value and one comparison rule without persistence or Zustand coupling |
| Component registry | [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx), [`component-registry.ts`](../../../src/builder/registry/component-registry.ts), and [`component-icons.tsx`](../../../src/builder/registry/components/component-icons.tsx) add the three primitives | Authors can add and configure state, actions, and conditional containers |
| Registry infrastructure | [`define-component-registry.ts`](../../../src/builder/registry/define-component-registry.ts) adds `node-reference` controls and typed reference metadata validation | Cross-node connections become declared, discoverable, and extensible |
| Reference services | [`node-references.ts`](../../../src/builder/project/node-references.ts) discovers candidates, resolves target status, enforces scope, and applies declared clone-remapping policy | Missing, wrong-type, cross-page, internal, and external targets follow registry metadata rather than consumer-specific assumptions |
| Commands | [`execute-command.ts`](../../../src/builder/commands/execute-command.ts) remaps declared references during subtree duplication | Connected duplicates control their duplicated state instead of the original |
| Rendering | [`page-rendering-controller.tsx`](../../../src/builder/rendering/page-rendering-controller.tsx) and [`editor-canvas.tsx`](../../../src/builder/ui/editor-canvas.tsx) mount equivalent providers | Editor simulation and Preview use the same state semantics without sharing sessions |
| Editor interaction | [`editor-canvas.tsx`](../../../src/builder/ui/editor-canvas.tsx) permits direct State Action activation and preserves inactive authoring access | Authors can test interactions on Canvas without losing normal selection behavior |
| Inspector | [`inspector-panel.tsx`](../../../src/builder/ui/inspector-panel.tsx) receives page/document context and renders the generic reference picker | Authors select states by name and see actionable diagnostics |
| Library | [`component-library.tsx`](../../../src/builder/ui/component-library.tsx) adds the Interactions family | Boolean State, State Action, and Conditional Content are grouped together |
| Styling | [`globals.css`](../../../src/app/globals.css) styles unresolved actions and inactive Conditional Content | Invalid actions are visibly unavailable and hidden authored regions remain identifiable |
| Tests | Registry, command, rendering, project-reference, Component Library, and EditorShell specs add behavior-first coverage | Core runtime, reference, duplication, authoring, and persistence boundaries are protected |
| Durable architecture | [`Project.md`](../../../Project.md) records the verified registry, runtime, rendering, and persistence contracts | Future work has one durable architecture authority |
| Planning and review | [Plan](../plan/Boolean-State-and-Conditional-Visibility-Plan.md), [architecture review](../review/Boolean-State-Interaction-Foundation-Architecture-Review.md), workspace, branch overlay, and journal were updated | Completed work, evidence, decisions, and deferred scope are traceable |

## Decisions and deviations

The implementation follows the approved architecture review and V1 plan with these explicit decisions:

- Node ID is the state identity; no second variable ID system was added.
- Node name is the author-facing label; runtime references do not depend on names.
- Only authored default state is persisted.
- Current state is provider-local, not stored in Zustand.
- State Action is the only V1 binding surface.
- Conditional Content is a consumer adapter rather than the core runtime.
- Inactive Preview content unmounts immediately when no animation exists.
- Reopening creates fresh descendant runtime instances.
- Inactive Editor content remains mounted as an authoring reveal.
- Invalid references remain in the document with diagnostics instead of destructive repair.
- Connected subtree duplication remaps only targets cloned in the same operation.
- Direct State Action activation remains available in Canvas; its suppressed drag, resize, and spacing overlays are accepted as a separate Editor UX follow-up for V1.
- Drawer, connected blocks, variants, conditional styles, and authored animations remain deferred.

One planned verification detail was narrowed: V1 does not implement delayed exit animation mechanics, so it cannot meaningfully test transition reversal, reduced motion, stale completion, or completion timeouts. Instead, it implements and tests immediate absence through a dedicated presence seam, and retains those animation requirements as gates for the future animation release.

## Verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Registry completeness and defaults | Component registry tests cover 19 primitives, versions, strict props, reference metadata, and the Interactions family | Pass | Application-code registry only |
| Reference metadata safety | Registry-definition tests reject missing metadata, invalid paths, non-string paths, duplicates, and unknown targets | Pass | Only page-scoped node references exist in V1 |
| Reference resolution | `node-references.spec.ts` covers empty, valid, missing, wrong-type, and cross-page references | Pass | Cross-page references are diagnosed, not supported |
| Runtime actions | Page rendering tests cover Turn On, Turn Off, Toggle, repeated actions, Enter and Space activation, native disabled behavior, invalid targets, and multiple consumers | Pass | Existing-component action bindings remain deferred |
| Boolean branches | Rendering tests cover `showWhen: true` and `showWhen: false` consumers sharing one state | Pass | No expression language by design |
| Fresh reopen behavior | A conditional Input is edited, closed, reopened, and verified to return to its authored default | Pass | V1 intentionally does not preserve unsaved descendant runtime state |
| Page isolation | Rendering switches between pages and confirms runtime values reset rather than leak | Pass | Cross-page state is intentionally unsupported |
| Runtime reconciliation | Rendering tests cover authored default changes, runtime state deletion, and unrelated page edits preserving live values | Pass | Runtime state remains page-session-only by design |
| Runtime/persistence separation | EditorShell test confirms a State Action changes rendered content without adding history or incrementing document revision | Pass | Runtime values vanish when the page render session ends |
| Editor authoring | EditorShell and browser QA cover named state selection, readable picker binding, inactive authored content, direct Canvas toggling, Layers access, deletion warning, and tested reference reconnection | Pass | State Action Canvas manipulation remains a non-blocking UX follow-up |
| Duplication | Command tests cover internal reference remapping and external reference preservation | Pass | Connected block insertion remains deferred |
| Type safety | `pnpm typecheck` | Pass | pnpm reports that local Node 22.21.1 is below the declared Node 24.19.x engine |
| Code quality | `pnpm lint` | Pass | Full repository scope |
| Automated regression | `pnpm test -- --maxWorkers 1 --no-file-parallelism`: 32 files, 439 tests | Pass | Default parallel run previously produced two existing heavy Inspector test timeouts; both passed in isolation and the intended serialized suite passed completely |
| Production compilation | `pnpm build` using Next.js 16.3.0 | Pass | Build retains the existing warning about a lockfile above the repository |
| Editor runtime QA | Chrome against the branch server: 29 library entries, Interactions count 3, named picker target, inactive authored subtree, and successful toggle | Pass | Desktop interaction path was inspected; responsive styling remains covered by the shared existing style system |
| Preview runtime QA | Fresh Preview starts without conditional text, then shows it after the State Action is activated | Pass | Preview snapshots remain one-use and nonpersistent by existing design |
| Browser console | Preview recorded no errors; Editor recorded only a hydration warning caused by Chrome adding `cz-shortcut-listen` to `<body>` | Pass with environment note | The injected extension attribute is outside application code |
| Documentation integrity | `git diff --check` and local Markdown link resolution | Pass | Records remain draft because an accountable documentation owner is unassigned |

## Rollout and rollback

The implementation exists only as uncommitted local changes on `feat/boolean-state-foundation`. No commit, push, pull request, release, deployment, document migration, or external rollout occurred.

The change is additive to the component registry. Existing saved nodes do not change unless an author inserts the new components. Removing the new component definitions before supported documents depend on them would roll back the feature without migrating existing component types.

Once documents containing the new component types are durably persisted or published, rollback must retain compatible registry definitions or provide an explicit document migration. Unknown component types remain fatal during normal hydration by existing project rules.

The prior `feat/amazon-style-navbar` work remains recoverable in `stash@{0}` and was not mixed into this branch.

## Durable documentation updates

- [`Project.md`](../../../Project.md) now describes Boolean State persistence, runtime scope, action dispatch, Conditional Content presence, typed references, duplication behavior, and Editor/Preview ownership.
- The [Boolean State implementation plan](../plan/Boolean-State-and-Conditional-Visibility-Plan.md) records completed V1 deliverables and preserves deferred animation gates.
- The [architecture review](../review/Boolean-State-Interaction-Foundation-Architecture-Review.md) records closed, mitigated, and accepted findings.
- The [feature workspace](../workspace.md) records the current milestone and verification summary.
- The [branch overlay](../../../branches/web-builder/feat-boolean-state-foundation/overlay.md) and [journal](../../../branches/web-builder/feat-boolean-state-foundation/journal.md) provide the repository-specific handoff state.

## Residual risks and follow-up

- **Delivery state:** the user accepted the verified V1 foundation, but the implementation remains local and uncommitted until an intentional Git handoff is requested.
- **Node engine:** verification succeeded under Node 22.21.1, but the repository declares Node 24.19.x. Release verification should use the declared engine.
- **Test resource contention:** two existing Editor Inspector tests exceeded their five-second timeout during one default parallel run. They passed in isolation, and the complete serialized suite passed. The repository should continue using its stable serialized full-suite command unless test-runner policy changes.
- **Authored transitions:** no animation controls or delayed exit mechanics exist. They require the complete presence and accessibility verification gates described in the plan.
- **Variant and style consumers:** the runtime supports additional adapters, but authoring schemas and Inspector interfaces have not been designed or implemented.
- **Existing-component bindings:** Button, Link, Image, Icon, and Container need explicit activation ordering, nesting, navigation/submission, disabled, and accessibility contracts before binding actions.
- **Connected templates:** block templates need template-local identity and atomic internal reference resolution before a connected State/Action/Content block is safe.
- **Drawer conversion:** a future Drawer should reference Boolean State and must not introduce a competing open-state store or active-drawer registry. Portal, focus, Escape, backdrop, dialog semantics, and scroll locking remain Drawer-owned.
- **Complex overlays:** ordinary absolute/fixed positioning and z-index work for simple sidebars and dropdowns. Portals remain necessary when clipping, stacking contexts, or modal semantics demand them.
- **State Action Canvas UX:** direct activation suppresses Canvas drag, resize, and spacing overlays. V1 accepts Layers and Inspector for manipulation; a future Editor UX pass should separate activation from manipulation.

## Handoff summary

Boolean State V1 is complete, accepted, verified, and documented on `feat/boolean-state-foundation`. It is ready to support a separately scoped Drawer implementation that consumes Boolean State as its open/closed source and keeps portal, focus, Escape, backdrop, semantics, and scroll-lock behavior Drawer-owned.
