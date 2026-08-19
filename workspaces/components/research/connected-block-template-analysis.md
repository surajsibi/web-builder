---
doc_id: WEB-BUILDER-CONNECTED-BLOCK-TEMPLATE-RESEARCH
type: D2
variant: research
scope: Web-builder connected block templates, template-local node references, Boolean State ownership, atomic insertion, duplication, and a state-powered Disclosure at commit c032701e52c5c8046a32d9365b8f5782fb75bbc6
authority: Evidence synthesis for connected-block planning; repository code, schemas, tests, and verified runtime behavior remain authoritative
owner: Suraj
lifecycle: draft
freshness: Audited for final Gate 1 consistency on 2026-08-18 against the existing bounded source inspection; invalidated by a block-template, command-insertion, node-reference, Boolean State, Button, Component Library, focus-management, scope, or accessibility-contract change
---

# Research: How should blocks create and connect Boolean State safely?

## Objective and scope

Determine the smallest reusable architecture that lets a Component Library block create ordinary components, a page-scoped Boolean State, and valid internal connections in one insertion. The result must preserve the existing document model, atomic commands, Undo/Redo, duplication remapping, Editor authoring behavior, Preview behavior, and accessibility expectations.

This research covers the template contract, insertion compiler, ownership of template-created state, the first suitable block, and verification boundaries. It does not design self-unmounting dismissal focus management, modal focus management, menus, tabs, animations, enum state, external block parameters, or a user-authored block marketplace.

## Baseline, assumptions, and unavailable evidence

- The inspected repository is `web-builder` on `main` at commit `c032701e52c5c8046a32d9365b8f5782fb75bbc6`.
- The Boolean State implementation is present in `main`: visual nodes can bind visibility to one page-local state, and an ordinary Button can Turn On, Turn Off, or Toggle one state.
- The current shell uses Node `22.21.1`; `package.json` requires Node `>=24.19.0 <25`. Planning inspection is valid, but the implementation release gate must run under the declared Node 24 engine.
- The original inspection occurred on `main`. `feat/connected-state-blocks` was later created from the same commit; no feature implementation exists at this revision.
- Assistive-technology testing has not been performed for the proposed Disclosure. The plan therefore requires semantic automated coverage and accountable manual accessibility review before approval.

## Method

1. Inspected the current block-template types, resolver, registry, insertion command, command tests, Component Library, renderer, Boolean runtime, reference metadata, duplication remapping, and project hydration model.
2. Compared the proposed state ownership options against the existing tree and duplication behavior.
3. Checked the W3C WAI-ARIA Authoring Practices Guide for Disclosure and Accordion semantics and keyboard behavior, plus WCAG 2.2 focus-order guidance for self-unmounting controls.
4. Separated verified implementation facts from proposed design choices.

## Evidence

| Claim or observation | Classification | Source or evidence | Scope/version | Confidence or limitation |
| --- | --- | --- | --- | --- |
| A block definition returns one rooted template containing only component type, props, styles, and children. It has no template-local key, name hint, prop-reference binding, or shared node-level state binding. | Verified fact | [`define-block-registry.ts`](../../../src/builder/registry/define-block-registry.ts) | `main` at `c032701` | Direct source inspection |
| `block.insert` resolves one root, allocates fresh IDs for its subtree, materializes props/styles/children, inserts the root at the destination, and finalizes one tree mutation. It does not materialize symbolic references or `stateBinding`. | Verified fact | [`execute-command.ts`](../../../src/builder/commands/execute-command.ts) and [`execute-command.spec.ts`](../../../src/builder/commands/__tests__/execute-command.spec.ts) | `main` at `c032701` | Direct source and test inspection |
| The persisted node model already supports an optional Boolean State visibility binding, while Button stores its state target as a registry-declared page-scoped node reference. | Verified fact | [`project-document.ts`](../../../src/builder/model/project-document.ts), [`state-binding.ts`](../../../src/builder/model/state-binding.ts), and [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx) | Project schema 3; current Button version 5 | Direct source inspection |
| Generic prop references and `stateBinding` are remapped when the referenced target is cloned in the same duplication operation; otherwise the existing target is preserved. | Verified fact | [`node-references.ts`](../../../src/builder/project/node-references.ts) and duplication paths in [`execute-command.ts`](../../../src/builder/commands/execute-command.ts) | `main` at `c032701` | Direct source and existing regression inspection |
| The Boolean runtime discovers state from all nodes on the page rather than only page roots. | Verified fact | [`boolean-state-runtime.tsx`](../../../src/builder/interaction/boolean-state-runtime.tsx) | `main` at `c032701` | Direct source inspection |
| A Container accepts any registered child type, and Boolean State has no parent restriction, so the current placement contract permits a nonvisual Boolean State inside a visual block root. | Verified fact | [`component-registry.ts`](../../../src/builder/registry/component-registry.ts) and [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx) | `main` at `c032701` | Direct placement-contract inspection |
| Keeping a template-created Boolean State inside the block root makes whole-block duplication clone the state and lets existing remapping make the copy independent. | Supported inference | Existing subtree duplication and runtime discovery behavior above | Proposed connected-block V1 | Must be proven with insertion and duplication tests |
| Putting template-created state at the page root would require multi-root insertion and would make ordinary visual-root duplication preserve the original external state unless duplication gained a new ownership concept. | Supported inference | Current one-root insertion and remap-if-target-cloned behavior | Proposed connected-block V1 | Alternative not implemented; conclusion follows from current contracts |
| A W3C Disclosure uses a Button that toggles content, supports Enter and Space through native Button behavior, and exposes `aria-expanded`; `aria-controls` is optional for the Disclosure pattern. | External practice | [W3C Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | W3C APG accessed 2026-08-14 | Primary accessibility source; accountable runtime review still required |
| A full Accordion adds a heading structure and requires the header Button to reference its panel with `aria-controls`. | External practice | [W3C Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) | W3C APG accessed 2026-08-14 | Primary accessibility source; this exceeds the proposed first block |
| The template contract is application code rather than persisted project data. Adding template-only keys does not itself require a project schema migration. | Verified fact and supported inference | Block registry and project hydration sources above | Project schema 3 | A persisted Button prop change still requires a Button component migration |
| The current Button schema permits a non-`none` state action with an empty `targetStateNodeId`; it rejects only a non-empty target paired with `stateAction: "none"`. | Verified fact | [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx) and [`reference-schemas.ts`](../../../src/builder/registry/components/reference-schemas.ts) | Button version 5 at `c032701` | Direct schema inspection; this corrects the original research claim |
| A visual node's Boolean State binding can be reconnected or independently map On and Off to Show or Hide, while Button has no persisted reference to the content whose visibility it claims through Disclosure semantics. | Verified fact | [`state-binding.ts`](../../../src/builder/model/state-binding.ts), [`inspector-panel.tsx`](../../../src/builder/ui/inspector-panel.tsx), and [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx) | Project schema 3; Button version 5 | Direct source inspection |
| Removing a focused Dismiss Button together with its containing announcement requires an explicit logical focus result; leaving the destination undefined can disorient keyboard and assistive-technology users. | External practice and design inference | [WCAG 2.2 Understanding 2.4.3: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | W3C guidance accessed 2026-08-16 | The proposed runtime was not implemented or tested; focus behavior requires a separate accountable design |

## Findings and disagreements

### A connected block should remain ordinary nodes

The project does not need a persisted `block` node or a second runtime store. A connected block can remain a code-authored recipe that materializes normal components and one normal Boolean State. After insertion, the document owns only ordinary nodes and real node IDs; the template and its local aliases disappear.

### Template resolution must become two-phase

The current resolver validates each node before insertion IDs exist. Contrary to the original research claim, the current Button schema permits `stateAction: "toggle"` with an empty `targetStateNodeId`; that behavior does not justify placeholders. Two phases are still required because symbolic relationships must be collected and type-checked before real IDs exist, while the final persisted props and bindings must be validated after real-ID materialization:

1. Resolve the complete tree, collect and validate local keys, and validate symbolic relationships.
2. During insertion, allocate every real ID, replace symbolic references, validate the final props and state bindings again, and only then mutate a cloned document.

No synthetic placeholder is required by the current schema. No placeholder or local key may enter the persisted document; if a future approved schema requires a non-empty authored relationship, the template phase must use an explicit symbolic-aware validator rather than a fake node ID.

### Internal state belongs inside the visual root in V1

The recommended V1 convention is:

```text
State-powered block root
|-- visual trigger
|-- visual controlled content
`-- nonvisual Boolean State
```

The Boolean State remains page-scoped at runtime even though the tree expresses block ownership. Deleting the block removes its internal state. Duplicating the complete root clones the state and remaps the copied trigger and visibility bindings. If an author later moves the state outside the root, subsequent duplication follows the existing external-reference rule and may intentionally share that state.

### The first block should be a Disclosure, not a full Accordion

The first adopter should be labeled **Disclosure**. It can satisfy the Disclosure pattern with an ordinary native Button, a registry-declared reference to its controlled content Container, runtime-backed `aria-expanded`, and a content Container bound to the same Boolean State. Calling it an Accordion would promise the additional heading and panel-association contract described by the W3C Accordion pattern.

Persisted configuration and effective semantics are different. The Button may retain recoverable state and controlled-content references after a panel or tree edit, while rendering emits `aria-expanded` only when the Button, state, panel, binding, and structural relationship form a valid Disclosure at that moment. Direct Button edits that make its own configuration incompatible should clear that configuration atomically; rendering must never mutate the document to repair it.

The existing native `details` and `summary` path remains available for simple browser-owned disclosure behavior. The state-powered Disclosure is distinct because its Boolean State can be inspected and can control additional ordinary nodes.

### Dismissible Announcement remains outside this plan

A Dismissible announcement would exercise a different connection shape, but its focused Dismiss Button turns Off the state that hides and unmounts the entire containing root. The original proposal incorrectly treated this as requiring no focus-management behavior.

- The focused control disappears with its containing announcement.
- The browser's resulting focus destination is not an adequate product contract.
- A safe adopter must name and test a logical destination, restoration behavior, and assistive-technology expectations.

Dismissible Announcement is therefore excluded from this plan. No work item, gate, test path, or artifact in CSB-01 through CSB-10 implements it.

### Rejected or deferred alternatives

- Hard-coded node IDs are rejected because multiple insertions would collide or cross-connect.
- Page-root state resources and a multi-root bundle are deferred because they add ownership and duplication semantics that V1 does not need.
- Dedicated Accordion, Conditional Content, State Action, or Dismissible Banner component types are rejected because the existing primitives and Boolean runtime already own the required behavior.
- Dismissible Announcement remains outside this plan; any later proposal requires a separate scope and accountable accessibility review.
- Full Accordion groups, Dropdowns, menus, Drawers, and modals are deferred because their semantic, focus, Escape, outside-click, portal, or scroll-lock contracts exceed Boolean visibility.
- Tabs are deferred until a single-selection or enum state model exists; independent booleans permit invalid multiple-active or no-active combinations.
- Authored animation and exit presence remain deferred because hidden Preview content currently unmounts immediately.

## Conclusion

Connected state blocks are feasible without changing the persisted block model or adding a second state store. The smallest safe design adds optional template-local node keys, internal prop references, shared node-level visibility bindings, and meaningful name hints to the existing rooted template. The insertion compiler maps those local relationships to real IDs atomically. Template-created Boolean State lives inside the visual root so the current subtree duplication system provides independent copies. Disclosure additionally requires a persisted Button reference to its controlled content and a read-only effective-semantics evaluator that refuses to emit false accessibility state after ordinary author edits.

## Recommendation

Implement the foundation and one bounded adopter in this order:

1. Template-local keys, name hints, internal registry-declared prop references, and internal state bindings.
2. Two-phase validation and atomic ID materialization in `block.insert`.
3. Explicit Disclosure configuration on Button, including a registry-declared controlled-content reference, a deterministic Button version migration, and a non-mutating effective-semantics evaluator.
4. A state-powered Disclosure block.
5. Focused, full-suite, build, browser, keyboard, and accessibility verification before further interactive blocks.

The complete execution sequence and acceptance gates are defined in the [Connected state blocks implementation plan](../plan/Connected-State-Blocks-Implementation-Plan.md), with status owned by the [components feature workspace](../workspace.md).

## Promotion and archival

This research remains a feature-scoped D2 delivery artifact. After implementation, promote only verified durable architecture into `Project.md`, record implementation and verification in a D5 report, and archive this research with the feature workspace when the connected-block effort is complete. Do not promote rejected alternatives or unverified accessibility behavior as current system facts.
