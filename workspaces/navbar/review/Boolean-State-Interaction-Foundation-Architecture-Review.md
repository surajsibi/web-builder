---
doc_id: WEB-BUILDER-BOOLEAN-STATE-ARCHITECTURE-REVIEW
type: Q2
scope: Architecture review of the proposed reusable Boolean State interaction foundation for the web-builder repository, including visibility, future variant and style consumers, generic activation actions, and future Drawer integration
authority: Scoped review recommendation based on the proposed Boolean State plan and verified repository implementation; Project.md remains authoritative for approved architecture and code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before accepting the recommendation
lifecycle: draft
freshness: Reverified against the accepted Boolean State V1 implementation and 439-test regression result on 2026-08-13; invalidated by changes to the runtime, condition, reference, renderer, Inspector, block-template, command, or Drawer architecture
---

# Architecture review: Boolean State interaction foundation

## Executive recommendation

**Accepted and satisfied for V1.** The Boolean State direction is sound, the plan was revised, and the user accepted the verified implementation refinements on 2026-08-13.

Boolean State should become the reusable runtime primitive. Conditional visibility, variant switching, conditional styling, and Drawer behavior should remain separate consumers over that primitive. The first version should implement only Boolean State, a dedicated State Action, and Conditional Content, together with the minimum runtime and cross-node reference infrastructure needed to make them safe.

The recommended relationship is:

```text
Boolean State node
  identity: existing node ID
  readable name: existing node meta.name
  persisted value: defaultValue
             |
             v
Page-scoped Boolean runtime
  |-- Conditional Visibility
  |-- Variant Switching (future)
  |-- Conditional Styling (future)
  `-- Drawer open/closed behavior (future)

State Action
  `-- dispatches a Boolean action to the same runtime
```

Text equivalent: a Boolean State node supplies stable identity and an authored default to one page-scoped runtime. State Action changes that runtime value. Visibility, variants, styles, and Drawers independently consume the value without creating their own Boolean state stores.

## Question, scope, and baseline

This review answers whether the proposed Boolean State architecture is an appropriate foundation for:

- conditional visibility;
- authored variant switching;
- conditional styling;
- actions that turn a state on, turn it off, or toggle it;
- future action bindings on existing semantic controls; and
- future Drawer components that use Boolean State as their open/closed source.

The review intentionally excludes string and numeric variables, formulas, expressions, workflows, automation, server state, cross-page state, and persisted visitor state.

The original review baseline was `main` commit `e15cd9f798ad7b90ee7a9526627af73d583e346b`. The implementation now exists as local, uncommitted work on `feat/boolean-state-foundation`; the prior work preserved in `stash@{0}` remains untouched.

At the original review point, no prototype or implementation existed. The completed follow-up now has focused tests, 439 serialized regression tests, TypeScript, ESLint, a production build, and applicable rendered Editor and Preview evidence recorded in the implementation report.

## Criteria and method

The review compared the proposal against these repository boundaries:

- the persisted [`BuilderNode`](../../../src/builder/model/project-document.ts) shape;
- project-wide node identity and tree validation in [`tree.ts`](../../../src/builder/project/tree.ts);
- component schemas, Inspector metadata, and renderer runtime contracts in [`define-component-registry.ts`](../../../src/builder/registry/define-component-registry.ts);
- Editor and Preview rendering in [`editor-canvas.tsx`](../../../src/builder/ui/editor-canvas.tsx), [`page-rendering-controller.tsx`](../../../src/builder/rendering/page-rendering-controller.tsx), and [`node-rendering-controller.tsx`](../../../src/builder/rendering/node-rendering-controller.tsx);
- Inspector inputs in [`inspector-panel.tsx`](../../../src/builder/ui/inspector-panel.tsx);
- subtree duplication and block materialization in [`execute-command.ts`](../../../src/builder/commands/execute-command.ts); and
- block-template identity in [`define-block-registry.ts`](../../../src/builder/registry/define-block-registry.ts).

The review favors the smallest architecture that preserves a credible extension path. It treats current code as authoritative for implemented behavior and labels unimplemented designs as recommendations.

## Recommended core contracts

The runtime should be built around a condition contract and an action contract rather than a visibility-specific API.

Illustrative TypeScript:

```ts
type BooleanCondition = {
  stateNodeId: NodeId;
  equals: boolean;
};

type InteractionAction =
  | {
      kind: "boolean.set";
      stateNodeId: NodeId;
      value: boolean;
    }
  | {
      kind: "boolean.toggle";
      stateNodeId: NodeId;
    };
```

This example is the implemented V1 contract. The user-facing Turn On and Turn Off operations map to `boolean.set` with `true` or `false`; Toggle maps to `boolean.toggle`, and all consumers can use the shared condition evaluator.

### State definition and runtime ownership

The Boolean State node should define:

- identity through its existing stable node ID;
- its readable name through the existing `meta.name`; and
- one persisted `defaultValue` boolean.

The page-scoped runtime provider should own the current value. It should derive Boolean State definitions directly from the complete page document rather than depending on mount-order registration by individual renderers. Runtime actions must not modify the document, create undo history, dirty autosave state, or persist the live value.

### Consumer design

Each consumer should own its effect while sharing Boolean resolution:

- Conditional Content decides whether to render its subtree.
- A future Variant consumer decides which authored representation to render.
- A future Style consumer applies an alternate runtime style patch without rewriting authored responsive styles.
- A future Drawer Panel decides whether to portal and activate its modal behavior.

Do not introduce a generic expression evaluator or an all-purpose consumer engine. Shared condition resolution is sufficient.

### Action design

V1 should expose a dedicated State Action component with native button behavior. Internally, it should dispatch the generic `InteractionAction` union.

Existing components should not receive generic bindings in V1. Button and Link can opt into activation bindings later after navigation, submission, activation ordering, and disabled behavior are defined. Container, Image, and Icon should not become clickable automatically because that can create inaccessible or nested interactive controls.

A future Drawer Trigger should remain specialized even if it dispatches a Boolean action. It must also coordinate `aria-controls`, `aria-expanded`, dialog identity, the initiating element, and focus restoration.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BSA-01 | The current proposal describes the right state scope but still frames Conditional Content as part of the core. | Medium | Future variants and styles could become coupled to visibility behavior. | Separate Boolean runtime, condition evaluation, action dispatch, and consumer adapters. | Project owner (unassigned) | Visibility reads the shared runtime through a consumer adapter; future variant and style adapters can use the same condition evaluator without visibility dependencies. | Closed — shared evaluator verified |
| BSA-02 | Node IDs are project-wide unique, but subtree duplication currently clones component props without remapping stored node references. | High | A duplicated consumer could continue controlling the original state. | Add typed component-reference metadata and remap a reference only when its target is included in the duplicated subtree; preserve valid external targets. | Document-command owner (unassigned) | Tests cover internal target remapping, external target preservation, unresolved references, undo, and redo. | Closed |
| BSA-03 | Boolean State is nonvisual, while Canvas selection and measurement normally depend on a rendered root element. | Medium | An editor-only visual card could alter layout and break Editor/Preview parity. | Render Boolean State as nonvisual in Canvas and Preview; keep it discoverable and selectable through Layers and Inspector. | Editor UI owner (unassigned) | Authors can add, rename, select, configure, duplicate, and delete a state without a Canvas DOM root. | Closed |
| BSA-04 | Keeping inactive Conditional Content mounted indefinitely can leave effects, focus behavior, timers, or portals active, while immediate unmount prevents exit animation. | High | Hidden content could still affect the page, or future transitions could be impossible. | Separate desired visibility from presence: permit a bounded, noninteractive exiting phase, then unmount when absent. Preserve authored nodes in the document and provide an Editor authoring reveal. | Rendering owner (unassigned) | V1 proves immediate absence and fresh remount through a dedicated presence boundary; bounded exit mechanics remain a required follow-up before animations ship. | Mitigated for V1 |
| BSA-05 | Editor and Preview share node rendering but do not enter through one common page-rendering component. | Medium | A provider added only to Preview or only to `PageRenderingController` would produce inconsistent behavior. | Mount the same Boolean runtime provider around the Editor canvas roots and Preview page roots separately. | Rendering owner (unassigned) | Equivalent state-action and consumer tests pass in Editor and Preview, with no state leakage between page render sessions. | Closed |
| BSA-06 | The Inspector currently receives the selected node and supports primitive top-level controls; it has no generic page-node reference picker. | Medium | Authors would have to type raw IDs, and invalid targets would be difficult to diagnose. | Add a node-reference Inspector control with page context, readable names, target-type filtering, and invalid-reference diagnostics. | Editor UI owner (unassigned) | Resolution tests cover empty, valid, deleted, wrong-type, and cross-page targets; Editor integration covers connection and deletion diagnostics. | Closed |
| BSA-07 | Block templates receive generated IDs only during materialization and have no local template identity for internal prop references. | Medium | A connected example block cannot safely author a State Action that targets a Boolean State created in the same block. | Defer the example block from V1, or separately introduce and verify template-local references before adding it. | Block infrastructure owner (unassigned) | A connected block receives fresh IDs and rewrites every internal reference atomically during each insertion. | Accepted and deferred |
| BSA-08 | The proposed plan includes core state, editor simulation, a connected example block, Drawer reconciliation, and full integration in one completion chain. | Medium | The first release becomes larger and harder to verify or roll back. | Ship the minimal V1 below and treat Drawer, variants, styles, and existing-component bindings as ordered follow-ups. | Project owner (unassigned) | V1 ships independently without migrating existing visual components or the verified Drawer. | Closed |
| BSA-09 | Direct State Action activation suppresses Canvas drag, resize, and spacing overlays. | Low | Authors must use Layers and Inspector for those manipulation paths. | Accept for V1 and design a separate activation-versus-manipulation affordance in a future Editor UX pass. | Editor UI owner (unassigned) | State Action can be activated and manipulated from Canvas without ambiguous or double-triggered interaction. | Accepted V1 follow-up |

## Recommended V1 scope

### Include

#### Boolean State

- `defaultValue` only as persisted state data.
- Existing node ID as the stable reference target.
- Existing node name as its readable authoring name.
- Page-render-session-scoped current value.
- No visible Canvas or Preview output.

#### State Action

- Visible label.
- Target Boolean State reference.
- Turn On, Turn Off, and Toggle operations.
- Native button activation and disabled/no-op behavior for unresolved targets.
- The shared internal action dispatcher.

#### Conditional Content

- Target Boolean State reference.
- Show when On or show when Off.
- Any placement-valid authored children.
- No child rendering while absent in Preview.
- A future animation-compatible presence boundary that may retain children temporarily during a bounded, noninteractive exit phase.
- Fresh descendant runtime instances, initialized from authored defaults, whenever absent content is reopened.
- Layers access and a bounded authoring reveal in Editor.

#### Supporting infrastructure

- One page-scoped Boolean runtime provider used by Editor and Preview.
- Shared Boolean condition resolution and action dispatch.
- Separation between desired visibility and entering, visible, exiting, or absent presence.
- Typed node-reference metadata and diagnostics.
- Reference-aware subtree duplication.
- A page-aware Inspector target picker.
- Safe cleanup when state definitions are deleted or changed.
- Tests proving page isolation, default initialization, state changes, reset, multiple actions, multiple consumers, invalid targets, duplication, keyboard behavior, and absence of persistence or undo-history mutations.

### Defer

- Conditional Style implementation.
- A dedicated Variant Switching component.
- Bindings on existing Button, Link, Image, Icon, or Container components.
- Multiple actions attached to one activation.
- Events other than activation.
- A general event, expression, formula, or workflow system.
- A polished global On/Off simulation interface.
- Connected Drawer implementation.
- Preservation of descendant form values, media position, or component-local state after Conditional Content becomes absent.
- A reusable connected example block until block-template references are designed.

## Drawer direction

Drawer implementation should remain postponed until the Boolean foundation is verified.

The future Drawer Panel should reference Boolean State and react to its value. Drawer Trigger, Drawer Close, Escape handling, backdrop activation, and destination selection should dispatch Boolean actions to that same state.

Drawer-specific code should continue to own:

- portal rendering;
- dialog and accessibility semantics;
- focus movement, containment, and restoration;
- Escape and backdrop handling;
- body scroll locking; and
- any modal-layer coordination required for active DOM layers.

Drawer-specific code should not own a second authoritative open/closed value. A modal-layer manager may coordinate focus or portal layers, but it must not become a parallel Boolean state store.

## Positive controls verified

- Builder nodes already have stable IDs, readable names, validated component props, responsive styles, and ordered child IDs.
- Tree validation already enforces project-wide node ID uniqueness.
- Component definitions already provide strict schemas and explicit Inspector metadata.
- Duplicate commands already create a complete old-to-new ID map, providing the basis for reference remapping.
- Runtime-only interaction state is an established renderer pattern for existing form controls and the preserved Drawer implementation.
- Editor and Preview already share the semantic node renderer, reducing the amount of consumer-specific rendering code required.
- The current Drawer can remain available while the generic state foundation is implemented and verified, providing a bounded rollback path.

## Decision and constraints

The recommendation is **approve with constraints**:

1. Revise the Boolean State plan before implementation.
2. Treat Boolean runtime, condition evaluation, action dispatch, and consumer effects as separate responsibilities.
3. Add typed node-reference metadata before shipping any persisted cross-node state connection.
4. Ensure absent Preview content does not mount or create portals; any explicit exit phase must be bounded and noninteractive before final unmount.
5. Install equivalent runtime-provider behavior in Editor and Preview.
6. Keep the generic persisted action-binding surface out of V1 while using a reusable internal action dispatcher.
7. Do not make non-semantic components clickable by default.
8. Defer Drawer conversion until the Boolean foundation passes its own verification.
9. Do not introduce a drawer-specific authoritative open-state store.
10. Defer connected block templates unless template-local references are separately designed and verified.
11. Treat reopening absent Conditional Content as a fresh runtime mount while preserving the same authored builder nodes and page-level controlling Boolean State.

Recommended delivery order:

1. Boolean runtime and the three V1 components.
2. Conditional Visibility verification.
3. Drawer integration.
4. Variant Switching.
5. Conditional Styling.
6. Capability-aware action bindings on existing semantic controls.

## Residual risk and follow-up

The V1 closure tests now cover unresolved references, reference reconnection, hidden-content authoring, metadata-driven reference remapping, default reconciliation, runtime deletion, unrelated page edits, and Enter/Space action activation. Portal escape remains Drawer-owned, authored transitions retain their separate gates, and State Action Canvas manipulation remains the accepted low-severity Editor UX follow-up.

The user accepted the V1 recommendation and verified refinements. The accountable documentation owner remains unassigned, so this record retains its draft lifecycle; that governance gap does not reopen the implemented V1 decision. Re-review is required if future work changes the Boolean runtime, condition, reference, renderer, or document contracts.
