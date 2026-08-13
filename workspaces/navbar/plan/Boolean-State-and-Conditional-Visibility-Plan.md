---
doc_id: WEB-BUILDER-BOOLEAN-STATE-VISIBILITY-PLAN
type: D3
scope: Proposed reusable Boolean State interaction foundation for the web-builder repository, including State Action, Conditional Content, typed page-scoped references, and an animation-compatible presence boundary
authority: User-approved execution plan for the Boolean interaction foundation; Project.md remains authoritative for durable architecture and code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before implementation approval
lifecycle: draft
freshness: Completed after the accepted condition-evaluation, reference-policy, and regression-test refinements on 2026-08-13; invalidated by a component-contract decision or relevant runtime, reference, renderer, or verification change
---

# Plan: Boolean state interaction foundation

## Goal, scope, and authority

Create a reusable page-level Boolean interaction foundation in which one Boolean State node defines an On or Off value, actions change that value, and independent consumers use it for visibility and future interactive behavior.

The architecture is intentionally broader than visibility while remaining limited to boolean state. Conditional visibility is the first consumer. Future variant switching, conditional styling, and Drawer behavior should reuse the same state, condition, action, reference, and runtime contracts without introducing parallel Boolean stores.

The implemented first-version components are:

| Component | Purpose | Children |
| --- | --- | --- |
| **Boolean State** | Defines one runtime On/Off value and its persisted default | None |
| **State Action** | Dispatches Turn On, Turn Off, or Toggle to a connected Boolean State | None in V1 |
| **Conditional Content** | Renders its authored subtree when its Boolean condition matches | Any placement-valid components |

The [Boolean State interaction foundation architecture review](../review/Boolean-State-Interaction-Foundation-Architecture-Review.md) records the evidence, findings, constraints, and recommended V1 boundary behind this plan.

The selected execution-state authority remains [Navbar block workspace](../workspace.md). The user approved this plan and the verified V1 refinements; implementation evidence is recorded in the [Boolean State implementation report](../reports/Boolean-State-Foundation-Implementation-Report.md).

## Recommended architecture

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

Text equivalent: the Boolean State node provides stable identity and an authored default to one page-scoped runtime. State Action changes that runtime value. Visibility, variants, styles, and Drawers independently consume the value without owning competing Boolean state.

### Core contracts

Use a reusable condition contract and a discriminated action contract rather than a visibility-specific state API.

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

This is the implemented V1 contract. Turn On and Turn Off map to `boolean.set` with `true` or `false`; Toggle maps to `boolean.toggle`. Consumers pass `BooleanCondition` through one shared evaluator so visibility and future adapters use the same equality and unresolved-state rules.

Each consumer owns its effect:

- Conditional Content decides desired visibility and presence.
- A future Variant consumer decides which authored representation to render.
- A future Style consumer applies a runtime style patch without rewriting responsive authored styles.
- A future Drawer Panel decides whether to portal and activate modal behavior.

Do not introduce a generic expression evaluator or an all-purpose consumer engine.

### Connection model

Use the Boolean State node's existing stable component ID as the connection target. State Action and Conditional Content store that ID in a `targetStateNodeId` prop. The Inspector presents a picker using readable node names and disambiguating identity; authors should not need to copy or type raw IDs.

Add typed reference metadata to the component registry. Each reference declaration should identify its prop path, permitted target component type, page scope, and clone-remapping behavior.

Consumer-to-state references are preferred over keeping consumer lists on Boolean State because:

- one state can serve any number of actions and consumers;
- adding or removing a consumer does not rewrite the state definition;
- existing project-wide unique node IDs avoid a second authored-ID namespace;
- subtree duplication can remap an internal reference through its existing old-to-new ID map; and
- unresolved references can fail safely without deleting or rewriting authored components.

### State rules

- Scope each Boolean State to its page; cross-page references are invalid.
- Persist only `defaultValue`; keep the current value in page-render-session runtime memory.
- Reset runtime state when the page rendering session is recreated or reloaded.
- Use the existing node `meta.name` as the readable state name rather than adding a second name prop.
- Permit multiple actions and consumers to reference one Boolean State.
- Support Turn On, Turn Off, and Toggle.
- Treat a missing target, a target on another page, or a non-Boolean-State target as an editor diagnostic.
- Make an unresolved State Action a no-op and an unresolved visibility consumer absent in Preview.
- Keep runtime changes out of document persistence, autosave, revision state, and undo/redo history.
- Do not implement runtime visibility by changing persisted responsive `styles.display`.

### Presence and animation lifecycle

Boolean State and Boolean condition evaluation must not decide whether React children are mounted. They expose only the current value and whether a condition matches. Conditional Content owns the presence lifecycle.

The intended lifecycle is:

```text
condition matches
      |
      v
entering -> visible -> exiting -> absent
```

Text equivalent: a matching condition requests visible content. The consumer may mount it in an entering phase, keep it visible, retain it temporarily while an exit transition runs, and finally unmount it when absent.

Rules:

- Without an authored animation, unmatched Conditional Content may become absent immediately and render no children.
- With a future animation, changing to unmatched must keep the subtree mounted during the `exiting` phase and unmount it only after the exit completes.
- After Conditional Content becomes absent, reopening it mounts fresh runtime component instances from their authored defaults. Temporary descendant state such as unsaved form input, media playback position, and component-local UI state is intentionally reset in V1.
- Fresh runtime instances do not create new builder nodes. Authored node IDs, props, styles, names, and child relationships remain unchanged.
- The controlling page-scoped Boolean State remains active until its page runtime resets; unmounting its Conditional Content consumer does not reset that controlling state.
- During `exiting`, the subtree must not remain interactive. Apply appropriate `inert`, `aria-hidden`, and pointer-event behavior while preserving the visible transition.
- Respect reduced-motion preferences by completing optional transitions immediately or using the approved reduced-motion behavior.
- A rapid state reversal during entering or exiting must cancel or reverse the pending transition deterministically rather than firing a stale unmount.
- Completion must have a bounded fallback if an expected transition-end event does not fire.
- Animation timing, easing, transforms, and other authored animation configuration remain outside Boolean State. They belong to Conditional Content or another specialized presence consumer.
- Drawer presence remains Drawer-specific because portal timing, focus trapping, background isolation, and scroll locking must coordinate with the modal lifecycle.
- Preserving descendant runtime state after hiding would require a separate, explicitly designed keep-mounted consumer mode. It is not part of V1.

V1 does not need to expose authored animation controls. It must preserve this boundary: Boolean condition produces desired visibility, and Conditional Content decides immediate or transitional presence. Do not place unconditional `return null` behavior inside the Boolean runtime itself.

### Editor behavior

- Render Boolean State as nonvisual in both Canvas and Preview.
- Keep Boolean State selectable through Layers and editable through Inspector.
- Add the three components to an Interaction or Logic library family, subject to the naming decision in BVS-01.
- Provide a page-aware target-state picker for State Action and Conditional Content.
- Keep inactive Conditional Content and every descendant in the authored document and Layers.
- Provide a bounded Editor authoring reveal for inactive content without changing its saved default or visitor runtime state.
- Show warnings for missing, invalid, deleted, wrong-type, or cross-page targets.
- Keep runtime clicks and presence phases out of document history.

### Relationship to Drawer

The Boolean State system controls desired open or closed state. It does not provide modal behavior.

The later connected Drawer design should reuse Boolean State for open and closed state. Drawer Panel remains responsible for dialog semantics, portals, presence animation, focus containment, Escape and backdrop dismissal, body-scroll locking, and focus restoration. Drawer Trigger and Drawer Close should dispatch Boolean actions while retaining their specialized accessibility and focus responsibilities.

A Drawer modal-layer manager may coordinate active DOM layers and focus, but it must not become a second authoritative open-state store.

## Included

- The three V1 component contracts and strict prop schemas.
- Reusable Boolean condition and action contracts.
- A page-scoped runtime provider used by Editor and Preview.
- Typed component-reference metadata, validation, diagnostics, and subtree-remapping rules.
- Page-aware Inspector target selection.
- Nonvisual-state and inactive-content authoring behavior.
- An explicit separation between desired visibility and presence lifecycle.
- Immediate absence when no animation is configured, without blocking future entering and exiting phases.
- Accessibility requirements for State Action and inactive or exiting content.
- Focused and full automated verification plus rendered Editor and Preview checks.
- Reconciliation of the connected Drawer proposal after the foundation is approved and verified.

## Excluded from V1

- String, number, object, expression, formula, or multi-value application state.
- Persisted visitor interaction state or backend synchronization.
- Cross-page state connections.
- Action bindings on existing Button, Link, Image, Icon, or Container components.
- Multiple actions per event or event types other than activation.
- Conditional Style implementation.
- A dedicated Variant Switching component.
- Authored animation controls, timelines, sequencing, or a general animation engine.
- A general workflow or event-automation engine.
- Route, query-string, cookie, account, or server-controlled state.
- Replacing Drawer Panel's modal accessibility behavior with generic Conditional Content.
- A connected example block until block-template-local references are designed and verified.

## Constraints and assumptions

- Verified: every builder node already has a stable node ID, and project validation requires IDs to be unique across pages.
- Verified: subtree duplication creates an old-to-new node ID map but currently clones props without remapping stored node references.
- Verified: Editor and Preview share recursive node rendering but enter through different page-level rendering surfaces.
- Verified: responsive visibility uses authored `display` styles and must remain independent from runtime conditions.
- Verified: component props are persisted JSON validated by strict, versioned registry schemas.
- Verified: the Inspector does not currently have page context or a node-reference picker.
- Verified: block templates do not currently have template-local identity for internal prop references.
- Verified: a nonvisual Boolean State node remains operable through Layers and Inspector without a Canvas root.
- Verified: equivalent providers wrap the Editor and Preview surfaces without persisting or leaking runtime state.
- Verified: immediate absence satisfies V1 while the consumer boundary preserves future transitional presence.
- Verified: the Editor authoring reveal exposes inactive content without changing visitor presence or saved state.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Page rendering surfaces | The same Boolean provider behavior can wrap Editor and Preview roots | Rendering owner (unassigned) | Stop and select a different page-scoped host before component registration |
| Component registry | Nonvisual logic nodes, typed references, and V1 components satisfy strict definition contracts | Component owner (unassigned) | Keep the proposal in draft and revise the component representation |
| Document commands | Stored references can be declared and remapped without component-specific command branches | Document-command owner (unassigned) | Do not ship duplication or copy behavior for connected nodes |
| Inspector and Layers | Nonvisual and inactive nodes remain discoverable and editable | Editor UI owner (unassigned) | Block release until a reliable authoring path exists |
| Presence boundary | Desired visibility is separate from mounted presence and optional transitions | Rendering and accessibility owners (unassigned) | Ship immediate absence only and block authored animation controls |
| Accessibility | Actions and inactive or exiting content have predictable keyboard and assistive-technology behavior | Accessibility reviewer (unassigned) | Block release and retain specialized existing components |
| Connected Drawer proposal | Drawer consumes Boolean State without a competing open-state store | Project owner (unassigned) | Keep the current verified Drawer unchanged |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| BVS-01 | Approve component names, On/Off terminology, page scope, node-ID references, dedicated State Action, and the V1/deferred boundary | User review | Recorded approval or revised contract | Project owner | Complete â€” approved in conversation |
| BVS-02 | Prove that a Preview- and Canvas-nonvisual Boolean State remains addable, selectable, editable, duplicable, and removable through Layers and Inspector | BVS-01 | Focused Editor tests with no tree-integrity or persisted-state mutation | Implementer | Complete |
| BVS-03 | Define strict schemas, defaults, placement, Inspector metadata, icons, typed reference declarations, and library placement for the three components | BVS-01, BVS-02 | Registry initialization, invalid-props, and reference-metadata tests | Implementer | Complete |
| BVS-04 | Add a page-scoped Boolean runtime provider to both Editor and Preview rendering surfaces | BVS-03 | Page isolation, initialization, update, reset, cleanup, and no-leak tests | Implementer | Complete |
| BVS-05 | Implement Boolean State with persisted default and runtime-only current value | BVS-04 | Nonvisual behavior, initialization, default update, reload, and deletion tests | Implementer | Complete |
| BVS-06 | Implement the reusable action dispatcher and dedicated State Action with Turn On, Turn Off, and Toggle | BVS-04, BVS-05 | Pointer, native keyboard activation, disabled, invalid-target, and repeated-action tests | Implementer | Complete |
| BVS-07 | Implement Conditional Content as a Boolean consumer with desired visibility separated from presence | BVS-04, BVS-05 | On/Off branches, nested subtree, immediate absence, responsive-style isolation, and invalid-target tests | Implementer | Complete |
| BVS-08 | Preserve an animation-compatible presence seam and define future entering, visible, exiting, and absent behavior without exposing authored animation controls in V1 | BVS-07 | V1 immediate-absence tests plus documented future transition contract; animation mechanics remain deferred | Implementer and accessibility reviewer | Complete for V1 boundary |
| BVS-09 | Add the page-aware Inspector picker, diagnostics, inactive-content authoring reveal, and Layers access | BVS-05 through BVS-08 | Editor integration tests for connect, edit, reveal, select, reconnect, and runtime/persistence separation | Implementer | Complete |
| BVS-10 | Extend document commands with typed reference discovery and atomic remapping for duplication, deletion diagnostics, and undo/redo | BVS-03 | Internal-reference remap, external-reference preservation, deletion-warning, and transaction tests | Implementer | Complete |
| BVS-11 | Reconcile the connected Drawer proposal so it consumes Boolean State and owns only Drawer-specific modal and presence behavior | BVS-01 through BVS-10 | No competing state coordinator or connection contract remains in the follow-up proposal | Implementer and reviewer | Complete as architecture direction; Drawer implementation deferred |
| BVS-12 | Run focused and full verification and update durable documentation only for behavior proven by implementation | BVS-11 | TypeScript, ESLint, serialized tests, production build, keyboard semantics, and Editor/Preview rendering checks | Implementer and reviewer | Complete |

Implementation must stop after a failed gate. The existing verified Navigation Drawer remains available until the generic state foundation and a later Drawer integration pass their own verification matrices.

## Quality and approval gates

- Obtain user approval for BVS-01 before implementation.
- Validate every default prop object through its strict schema at registry startup.
- Reject cross-page and wrong-component-type targets without changing runtime state.
- Prove that cloning a complete connected subtree remaps internal references and cloning only a consumer preserves a valid external target.
- Keep nonvisual and inactive nodes accessible to authors without adding visitor-visible layout.
- Ensure runtime state, authoring reveals, and presence phases do not create undo history, dirty the document, or enter persisted JSON.
- Test pointer and keyboard activation, accessible names, disabled behavior, and focus behavior.
- Confirm conditional state never overwrites responsive visibility styles.
- Confirm immediate absence when no animation is configured.
- Confirm that reopening absent Conditional Content creates fresh descendant runtime instances from authored defaults without changing builder node identity or persisted data.
- Before authored animations ship, prove noninteractive exit, reduced-motion behavior, rapid reversal, transition completion fallback, and final unmount.
- Preserve existing Navbar, Commerce Navbar, Marketplace Navbar, and Navigation Drawer behavior until a separately verified migration is approved.
- Run focused tests during implementation, followed by `pnpm typecheck`, `pnpm lint`, `pnpm test -- --maxWorkers 1 --no-file-parallelism`, `pnpm build`, and rendered desktop/mobile verification.

## Risks, rollback, and containment

- **Broken references:** deleting or independently copying a Boolean State can leave consumers unresolved. Keep consumers, show diagnostics, and fail safely.
- **Reference-remapping defects:** duplicated content could control the original state. Centralize typed remapping and test internal and external targets.
- **Hidden-editor trap:** authors may be unable to select inactive content. Keep nodes in Layers and provide an explicit authoring reveal.
- **Premature unmount:** immediate removal prevents an exit animation. Keep desired visibility separate from presence so a future exit phase may retain the subtree temporarily.
- **Mounted-hidden side effects:** indefinitely mounted hidden content can retain focus behavior, effects, timers, or portals. Unmount when presence becomes absent; keep any exit interval bounded and noninteractive.
- **Runtime-state reset:** unmounting intentionally clears unsaved descendant form values, media position, and component-local state. Document this V1 behavior and require a separately designed keep-mounted mode if preservation becomes necessary.
- **Stale transition completion:** a previous exit callback could unmount content after the condition becomes true again. Associate completion with the active transition and ignore stale callbacks.
- **Responsive conflict:** conditional visibility or style must not rewrite authored responsive display values.
- **Accessibility ambiguity:** visibility does not define dialog, disclosure, tab, or menu semantics. Keep pattern-specific behavior in specialized components.
- **State Action Canvas manipulation:** direct runtime activation currently suppresses Canvas drag, resize, and spacing overlays for State Action. V1 accepts Layers and Inspector as the manipulation paths; improve this in a separate Editor UX pass without changing the runtime contract.
- **Unbounded interaction system:** additional variables, expressions, events, or workflows require a separate architecture decision.
- **Rollback:** do not remove or refactor the verified Navigation Drawer while building the generic foundation. New components and runtime infrastructure can be removed if verification fails before supported documents depend on them.

## Completion

The V1 foundation is complete: BVS-01 through BVS-12 pass, the three components work in Editor and Preview, references remain safe through document operations, desired visibility is cleanly separated from presence, runtime changes remain nonpersistent, and all verification succeeds. The user accepted the final refinements on 2026-08-13.

Authored animation controls, connected blocks, variants, conditional styles, bindings on existing components, and the State Action Canvas-manipulation improvement remain follow-up work. Drawer implementation may now proceed as a separately scoped task, but it must consume this Boolean State foundation and must not introduce a second authoritative open-state store.
