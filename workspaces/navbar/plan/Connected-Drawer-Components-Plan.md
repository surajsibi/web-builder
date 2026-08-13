---
doc_id: WEB-BUILDER-CONNECTED-DRAWER-PLAN
type: D3
scope: Recommended V1 implementation plan for Boolean-State-driven Drawer Trigger, Drawer Panel, and Drawer Close components
authority: User-requested follow-up implementation plan; Project.md and code/tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Reconciled with the accepted Boolean State foundation at commit 1764796 on 2026-08-13; invalidated by a Boolean runtime, component registry, reference, rendering-boundary, editor-interaction, or Drawer implementation change
---

# Plan: Boolean-State-driven connected Drawer V1

> **Status:** Recommended architecture is ready for implementation planning. This document does not claim that Drawer code exists and does not authorize restoring the historical monolithic Drawer implementation.

## Goal, scope, and authority

Add a small, composable Drawer system that uses the completed Boolean State runtime as the only source of open or closed state.

The proposed composition is:

```text
Boolean State
  ^
  | Drawer Panel references this state
  |
Drawer Trigger --references--> Drawer Panel
                                  |
                                  `-- provides close context to Drawer Close
```

Text equivalent: Drawer Trigger targets a Drawer Panel by stable node ID. The panel targets one page-scoped Boolean State. Trigger activation resolves the panel and dispatches Turn On to that state. Drawer Close obtains its owning panel through React context and dispatches Turn Off to the same state. The panel renders only while that Boolean condition is true.

This split is intentional:

- Boolean State owns the runtime value.
- authored node references own durable connections.
- Drawer-specific code owns portal rendering and modal behavior.
- a modal-layer coordinator may track mounted DOM layers and activating elements, but it must never own an `activeDrawerId`, a second open-state map, or persisted Drawer state.

The completed [Boolean State plan](Boolean-State-and-Conditional-Visibility-Plan.md) and [implementation report](../reports/Boolean-State-Foundation-Implementation-Report.md) are the architectural prerequisites. `Project.md` and verified code/tests remain authoritative for behavior that has actually shipped.

## V1 component contracts

| Component | Persisted props | Runtime responsibility | Children |
| --- | --- | --- | --- |
| `drawer-trigger` | `text`, `targetDrawerNodeId`, `disabled` | Render a native button; expose `aria-controls` and `aria-expanded`; record its element as the activator; dispatch Boolean Turn On through the resolved panel | Leaf |
| `drawer-panel` | `targetStateNodeId`, `side`, `sizePx`, `dialogLabel`, `zIndex` | Evaluate the Boolean State; portal the modal layer; own dialog, focus, backdrop, Escape, and scroll behavior | Any registry-valid subtree |
| `drawer-close` | `text`, `disabled` | Render a native button; resolve its owning open panel through context; dispatch Boolean Turn Off | Leaf, expected inside a Drawer Panel subtree |

Recommended prop rules:

- `targetDrawerNodeId` is a page-scoped node reference whose target type is `drawer-panel`.
- `targetStateNodeId` is the existing page-scoped reference to `boolean-state`.
- references use the existing `remap-if-target-cloned` duplication policy.
- `side` is exactly `left`, `right`, `top`, or `bottom`.
- `sizePx` is a finite positive number with a conservative upper bound; the rendered panel is also clamped to the viewport.
- `dialogLabel` is required, trimmed, and used as the accessible name.
- `zIndex` is a finite nonnegative integer applied to the portalled layer. Its default must be high enough to sit above ordinary authored page content.
- Trigger and Close labels are required and remain ordinary authored button text in V1.
- Escape dismissal, backdrop dismissal, focus containment, and Preview body-scroll locking are required behavior, not optional V1 settings.

Multiple triggers may target one panel. A Boolean State may still have multiple consumers, including more than one Drawer Panel; the Drawer implementation must not silently rewrite this generic Boolean relationship. If several modal panels become open, only the top mounted layer may be interactive, while cleanup and body-lock handling remain safe for every mounted layer.

### Why Trigger references Panel

Trigger must identify the actual controlled dialog to provide a stable `aria-controls` relationship and to restore focus to the correct activator. Having Trigger reference only Boolean State would not identify which panel it controls when that state has multiple consumers. Requiring both panel and state references on Trigger would duplicate authored wiring and allow them to disagree.

Drawer Panel therefore owns the state reference, and the page-scoped Drawer adapter resolves:

```text
trigger node -> target panel node -> target Boolean State node
```

The rendered dialog DOM ID is derived from the stable panel node ID. No author-entered Drawer ID, duplicate-ID registry, or string-renaming workflow is needed.

## Runtime and modal architecture

### Boolean State remains authoritative

The Drawer adapter may expose operations such as `openPanel(panelNodeId, activator)` and `closePanel(panelNodeId)`, but those operations must dispatch the existing generic actions:

```text
open  -> boolean.set(stateNodeId, true)
close -> boolean.set(stateNodeId, false)
```

Panel visibility is always derived with the shared Boolean condition evaluator. The adapter must not mirror the value in local component state or a Drawer store. Opening through an ordinary State Action must also open the panel, and deleting or reconnecting the referenced state must immediately reconcile through the existing Boolean runtime rules.

The page-scoped adapter may precompute a static `panelNodeId -> stateNodeId` connection map from the current page document. That map describes authored wiring, not runtime state. Invalid or unresolved connections fail safely:

- unresolved Trigger target: native button remains present, reports an unresolved status, and does nothing;
- resolved panel with unresolved Boolean State: Trigger reports unavailable and does nothing; Panel stays closed;
- orphaned Drawer Close: native button remains present, reports an orphaned status, and does nothing.

### Modal-layer coordinator boundary

A lightweight modal-layer coordinator is allowed only for DOM lifecycle that Boolean State cannot represent:

- the element that activated each panel, for focus restoration;
- mounted portal-layer elements and their order, so only the top layer handles modal interaction;
- focus-scope registration and cleanup;
- background isolation bookkeeping;
- reference-counted body-scroll locking and restoration;
- the Editor or Preview portal host.

It must not persist or independently infer an open Drawer value, automatically close unrelated Boolean States, or expose an `activeDrawerId` as business state. Mounted layers are consequences of evaluated Boolean values, not another authority.

### Panel presence and lifecycle

V1 uses immediate presence:

- false or unresolved condition: no Preview panel or backdrop DOM;
- true condition: mount one new portal layer and its authored subtree;
- close: immediately unmount the layer and subtree after performing required cleanup;
- reopen: mount a fresh descendant runtime instance.

This matches the accepted Conditional Content V1 behavior. Authored enter/exit animation is deferred. Keep the condition-to-presence decision isolated inside Drawer Panel so a later Drawer-specific entering/exiting state machine can be added without changing Boolean State.

Do not reuse generic Conditional Content as the modal boundary. Drawer Panel needs coordinated unmount timing, focus, isolation, backdrop, and scroll cleanup.

### Portal, placement, and stacking

- Preview portals the layer to `document.body` through a client-safe host lookup.
- Editor portals into a dedicated host owned by the Canvas artboard. This escapes authored ancestor clipping while keeping the builder chrome usable.
- The layer is fixed to its host viewport and receives the authored `zIndex` prop.
- The backdrop fills the layer.
- The panel is anchored to `left`, `right`, `top`, or `bottom` and uses `sizePx` on the corresponding axis.
- The panel is clamped to viewport width or height and its content area scrolls independently when necessary.
- Panel styling uses the normal background, spacing, border, typography, and effect pipeline. Modal placement itself is component-owned so ordinary style controls cannot accidentally remove required fixed-layer behavior.

This guarantees the high-stack sidebar behavior discussed during review. Generic dropdowns remain a separate composition: a relative ordinary parent plus absolute Conditional Content with authored z-index. They do not need Drawer portal or modal semantics.

### Preview accessibility and focus

While a Preview Drawer is open:

- Trigger is a native `button` with `type="button"`, `aria-expanded`, and `aria-controls`.
- Panel exposes `role="dialog"`, `aria-modal="true"`, a stable DOM ID, and the authored accessible label.
- initial focus moves to the first enabled Drawer Close, then the first focusable descendant, then the panel itself as fallback;
- Tab and Shift+Tab remain inside the top modal layer;
- Escape closes only the top modal layer;
- activation on the backdrop itself closes the top layer, while clicks inside the panel do not;
- non-modal page content is isolated from keyboard and assistive-technology interaction and restored exactly on close;
- body scrolling is locked with prior inline styles preserved and restored; simultaneous cleanup is reference-count safe;
- focus returns to the last connected activator when it still exists and is focusable;
- opening through default state or a generic State Action has no invented restoration target.

Native buttons provide Enter and Space activation without custom keyboard emulation. V1 does not automatically close when an arbitrary Link inside the panel is activated; authors use Drawer Close, a future existing-component Boolean action binding, or navigation lifecycle behavior.

### Editor authoring behavior

Editor mode must preserve authoring access rather than pretending the entire builder application is visitor content:

- portal only within the Canvas artboard host;
- keep Layers and Inspector outside modal isolation and body-scroll locking;
- allow Trigger and Close direct activation on Canvas;
- allow selection and editing of open Panel descendants rendered through the portal;
- keep closed Panel descendants present in the document and Layers even though their Canvas DOM is absent;
- expose a visible empty-panel authoring surface when an open Panel has no children;
- show generic reference diagnostics for missing, deleted, wrong-type, or cross-page targets;
- expose an orphaned-close diagnostic without mutating the document.

Replace the current `selectedNode.type === "state-action"` Canvas assumption with small registry metadata for direct-interaction components. State Action, Drawer Trigger, and Drawer Close opt in through that metadata; Canvas overlay suppression and event routing consume the metadata generically. This completes the previously recorded Canvas UX follow-up only as far as Drawer requires and avoids adding more component-name checks.

## Included

- Drawer Trigger, Drawer Panel, and Drawer Close registry definitions.
- Strict schemas, defaults, icons, Interactions-family library entries, Inspector controls, and reference metadata.
- A page-scoped Drawer adapter that delegates all value changes to Boolean State.
- A bounded modal-layer coordinator that owns DOM lifecycle only.
- four placement sides, pixel panel size, authored layer z-index, backdrop, and scrollable content.
- Preview dialog semantics, background isolation, focus movement and containment, Escape, backdrop close, focus restoration, and body-scroll locking.
- Editor Canvas portal host, direct activation, selection, empty state, and safe diagnostics.
- Reference-aware duplication behavior through existing generic metadata.
- Behavior-first automated tests plus desktop and mobile Editor/Preview verification.

## Excluded from V1

- A Drawer-specific Boolean store, active-drawer business-state registry, module-level event bus, or persisted open value.
- Authored animation controls, delayed exit, swipe gestures, drag gestures, or route-driven state.
- Nested Drawer authoring as a supported pattern. The layer coordinator must still clean up safely if more than one panel mounts.
- Automatic close on arbitrary destination/link activation.
- Rich container triggers that could contain nested interactive elements.
- Existing Button, Link, Image, Icon, or Container action bindings.
- A connected Drawer block or Marketplace Navbar conversion. Block templates still lack safe template-local reference identity.
- String, numeric, expression, formula, workflow, server, cross-page, or persisted visitor state.
- Reintroducing or migrating the historical monolithic `navigation-drawer`; it is absent from the current branch and its stash remains untouched.

## Constraints and assumptions

- Verified: Boolean State, State Action, Conditional Content, the shared evaluator, typed page-node references, reference-aware duplication, and Editor/Preview providers are implemented at commit `1764796`.
- Verified: the current branch has no registered Drawer component or supported Drawer document node to migrate.
- Verified: stable node IDs can provide Drawer Panel DOM identity and typed reference targets.
- Verified: Editor Canvas currently contains one hardcoded State Action direct-interaction overlay rule that must become metadata-driven before adding Drawer controls.
- Assumption: Editor Canvas can provide a dedicated portal host without changing the persisted document schema.
- Assumption: Preview can isolate the rendered page background without mutating authored node data.
- Assumption: pixel panel size is sufficient for V1; responsive or tokenized Drawer sizing can follow after usage evidence.
- Stop condition: if portal children cannot retain correct selection/measurement through the Canvas host, pause before shipping and revise the Editor portal boundary.
- Stop condition: if background isolation or focus restoration cannot be made exact and reversible, do not ship a modal Drawer with partial accessibility behavior.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Boolean State foundation | Commit `1764796` or an equivalent merged foundation remains green | Project owner (unassigned) | Stop; do not create a competing Drawer state path |
| Reference metadata | Trigger-to-Panel and Panel-to-State references use the existing page scope and remap policy | Implementer | Extend generic metadata only when a reusable rule is proven; do not add Drawer branches to document commands |
| Rendering boundaries | Editor and Preview can share the Drawer adapter while selecting different portal hosts | Rendering owner (unassigned) | Stop before registry exposure and redesign the host boundary |
| Canvas interaction | Direct interaction is declared by registry metadata | Editor owner (unassigned) | Keep Drawer components out of the library until selection/activation behavior is deterministic |
| Modal accessibility | Focus, isolation, Escape, backdrop, and scroll restoration pass automated and browser checks | Accessibility reviewer (unassigned) | Block release; do not downgrade the component to a visually hidden container |
| Connected templates | Template-local references are deliberately unavailable in V1 | Project owner (unassigned) | Do not add a ready-made connected Drawer block |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| CDR-01 | Reconcile the historical connected-Drawer proposal with the completed Boolean runtime and select Panel node references instead of authored Drawer IDs | Boolean State foundation | This plan contains no Drawer-owned open value, `activeDrawerId`, or duplicate string-ID contract | Implementer and reviewer | Complete |
| CDR-02 | Add validated registry metadata for direct-interaction components and replace State Action Canvas type checks | CDR-01 | Registry validation and Editor overlay/event-routing tests | Implementer | Not started |
| CDR-03 | Define three component schemas, defaults, placement rules, icons, Inspector fields, and typed references | CDR-02 | Registry startup, strict-schema, defaults, placement, library-family, and reference tests | Implementer | Not started |
| CDR-04 | Add the page-scoped Drawer adapter, static Panel-to-State resolver, portal-host contract, and bounded modal-layer bookkeeping | CDR-03 | page isolation, unresolved/reconnected references, no mirrored Boolean state, layer ordering, and cleanup tests | Implementer | Not started |
| CDR-05 | Implement Drawer Trigger as a native button with Panel resolution, accessible state, activator capture, and Boolean Turn On dispatch | CDR-04 | pointer, Enter, Space, disabled, unresolved, multiple-trigger, generic-action-open, and `aria-*` tests | Implementer | Not started |
| CDR-06 | Implement Drawer Panel presence, four-side portal layout, z-index, dialog semantics, backdrop, Escape, isolation, focus lifecycle, and body scroll lock | CDR-04 | default-open, immediate close/reopen, fresh descendants, top-layer, focus, cleanup, side, size, and z-index tests | Implementer | Not started |
| CDR-07 | Implement nearest-panel Drawer Close context with native activation and safe orphan behavior | CDR-06 | close, Enter, Space, disabled, nested-descendant, orphan, and restoration tests | Implementer | Not started |
| CDR-08 | Complete Editor Canvas host, portal-child selection, empty state, Layers access, Inspector diagnostics, and generic duplication coverage | CDR-05, CDR-06, CDR-07 | Editor integration and command tests for selection, direct interaction, deletion, reconnection, subtree clone, external references, and undo/redo | Implementer | Not started |
| CDR-09 | Run focused and full automated verification | CDR-08 | component/runtime/Editor suites, `pnpm typecheck`, `pnpm lint`, serialized full tests, and `pnpm build` | Implementer | Not started |
| CDR-10 | Run desktop/mobile Editor and Preview browser QA, then update durable docs and a single implementation report with verified behavior only | CDR-09 | keyboard-only flow, accessibility tree, focus restore, scroll restore, portal geometry, stacking, console, documentation links, and clean diff | Implementer and reviewer | Not started |

## Required automated scenarios

- Trigger activation opens the referenced Panel by changing only its Boolean State runtime value.
- A generic State Action targeting the same state opens and closes the Panel without Drawer-local state.
- changing the authored default, deleting the Boolean State during runtime, reconnecting the Panel, reconnecting the Trigger, and making unrelated page edits preserve the existing Boolean reconciliation contract.
- unresolved or wrong-type references fail safely and recover after reconnection.
- duplicating State + Panel + Trigger remaps both internal references; duplicating only Trigger or Panel preserves valid external references.
- Preview false state has no panel/backdrop DOM; reopen creates fresh descendant runtime state.
- left, right, top, and bottom placement use the correct axis; configured z-index is applied to the portal layer.
- focus starts correctly, wraps in both directions, Escape closes only the top layer, backdrop-only activation closes, and focus restores when a valid activator exists.
- body overflow and isolation attributes restore their exact prior values after normal close, state deletion, page switch, unmount, and multiple-layer cleanup.
- Editor Drawer portals remain inside the Canvas host, builder chrome stays operable, Trigger and Close activate directly, and portal children remain selectable.
- runtime actions never mutate page nodes, revision, undo history, autosave payload, or Preview snapshot data.

## Quality and approval gates

- Do not begin Drawer implementation by restoring the old stash implementation; use it only as historical behavior evidence.
- Keep Boolean State as the only source of truth and test opening through both Drawer Trigger and generic State Action.
- Use stable node-reference metadata for every durable cross-node connection; no authored `drawerId` strings.
- Do not add a connected library block until template-local references are separately designed and verified.
- Do not claim modal accessibility complete until keyboard, focus, background isolation, scroll restoration, and cleanup pass in Preview.
- Do not let Editor modal behavior disable Layers or Inspector.
- Run focused tests after each bounded slice, then TypeScript, full ESLint, serialized full tests, production build, and rendered desktop/mobile checks.
- Keep documentation statements evidence-bounded. `Project.md` changes only after implementation behavior is verified.

## Risks, rollback, and containment

- **Competing state authority:** a convenient `activeDrawerId` can drift from Boolean State. Contain by deriving mount state only through the shared evaluator and dispatching existing actions.
- **Connection ambiguity:** Trigger-to-State alone cannot identify an accessible controlled dialog. Contain with Trigger-to-Panel and Panel-to-State references.
- **Multiple panels on one state:** generic multiple-consumer behavior can mount several panels. Contain with top-layer-only modal interaction and reference-counted cleanup; do not silently mutate other states.
- **Portal/editor mismatch:** document-body portals can block builder chrome or produce incorrect Canvas measurements. Contain with a Canvas-owned portal host and stop if selection geometry is not reliable.
- **Focus and isolation leaks:** deletion, page change, or rapid state changes can bypass ordinary close handlers. Contain with effect cleanup tests for every unmount path and exact prior-value restoration.
- **Direct-interaction hardcoding:** adding more component-name checks will make Canvas behavior brittle. Contain with validated registry metadata.
- **Animation pressure:** exit animation can tempt delayed state mutation or hidden interactive DOM. Keep V1 immediate and add a later Drawer presence state machine only with reduced-motion, reversal, timeout, and inert-exit guarantees.
- **Rollback:** until durable documents depend on Drawer nodes, remove the three definitions, adapter, and modal helpers as one bounded feature. Boolean State remains independently valid.

## Completion

Drawer V1 is complete only when CDR-01 through CDR-10 pass, all three components are authorable in Editor and equivalent in Preview, Boolean State is proven as the sole open/closed authority, accessibility and cleanup checks pass, full automated and rendered verification are green, and durable documentation records only the verified result.

After completion, connected blocks, authored transitions, automatic destination bindings, rich triggers, and responsive Drawer sizing remain separate follow-ups rather than hidden additions to V1.
