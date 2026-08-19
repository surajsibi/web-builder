---
doc_id: WEB-BUILDER-CONNECTED-STATE-BLOCKS-PLAN
type: D3
scope: Web-builder connected block template infrastructure, template-local node references, atomic state connection materialization, truthful Disclosure accessibility semantics, and a state-powered Disclosure block
authority: Gate 1-approved execution plan for CSB-01 through CSB-10; Project.md owns durable architecture and code, schemas, tests, and verified runtime behavior own implementation truth
owner: Suraj
lifecycle: approved
freshness: Gate 1 approval and CSB-01 through CSB-10 completion remain historical; the PR-review remediation amendment records current-main integration, portable benchmark evidence, the 48-file/669-test rerun, production build/startup verification, and Firefox 153.0 smoke through 2026-08-19 for committed source 40de821543b873d941f39da9030c7e8e2e06780e; invalidated by a Gate 1 decision, ownership, block-template, insertion-command, node-reference, Boolean State, Button, Component Library, focus-management, accessibility-contract, benchmark-evidence, browser-matrix, release-evidence, or accountable-exception change
amended_by: WEB-BUILDER-CONNECTED-STATE-BLOCKS-PR-REVIEW-REMEDIATION-REVIEW
---

# Plan: Connected State Blocks

## Goal, scope, and authority

Extend the existing code-authored block templates so one block insertion can create ordinary visual components, a nonvisual Boolean State, and validated internal connections with fresh real node IDs. Ship one accessible state-powered Disclosure without introducing a persisted block type, a second state store, hard-coded IDs, partial insertion, false accessibility state, or special-purpose runtime component types.

The resulting author experience is:

```text
Choose a state-powered block in the Component Library
-> insert one editable subtree
-> receive a working trigger, controlled content, and Boolean State
-> edit or reconnect every ordinary node through existing Layers and Inspector flows
-> Undo or Redo the insertion as one operation
```

The [connected-block template research](../research/connected-block-template-analysis.md) owns the planning evidence and alternatives. [`Project.md`](../../../Project.md) owns approved durable architecture. Repository code, schemas, tests, and verified runtime behavior remain authoritative for implemented behavior. The [components feature workspace](../workspace.md) remains the selected feature execution-state authority, the [branch journal](../../../branches/web-builder/feat-connected-state-blocks/journal.md) owns the repository resume point for `feat/connected-state-blocks`, the historical [release-exception review](../review/connected-state-blocks-release-exception-review.md) owns Suraj's decision to progress despite named unexecuted evidence, the [verification closure review](../review/connected-state-blocks-verification-closure-review.md) owns the earlier report approval and exception disposition, and the [PR-review remediation review](../review/connected-state-blocks-pr-review-remediation-review.md) owns the current-source verification and explicit documentation-location amendment.

### Gate 1 ownership and approval

Gate 1 was approved on 2026-08-18 for `feat/connected-state-blocks` at `c032701e52c5c8046a32d9365b8f5782fb75bbc6`. Suraj explicitly confirmed that role overlap is permitted and accepted all four roles:

| Required role | Assignee | Recorded acceptance |
| --- | --- | --- |
| Accountable Owner | Suraj | Accepted every Gate 1 decision and CSB-R-01 through CSB-R-08 disposition; recorded **Approved for CSB-01** |
| Technical Verifier | Suraj | Accepted the key, compiler, command-compatibility, registry-authority, dry-run/apply, migration, and verification contracts |
| Accessibility Verifier | Suraj | Accepted the Disclosure invariant, omission and non-mutation behavior, recovery contract, and pre-CSB-06 accessibility matrix |
| Performance Owner | Suraj | Accepted the benchmark method, evidence format, and 10% maximum median/p95 regression threshold; refreshed portable evidence passes at +3.25% median and -4.95% p95 |

Suraj confirmed in the accountable review that one person may hold all four roles for this Gate 1 decision. The [accountable re-review checklist](../review/connected-state-blocks-accountable-re-review-checklist.md) records each acceptance and the [plan review](../review/connected-state-blocks-plan-review.md) records the finding dispositions. The AI agent transcribed the human decision and did not supply or infer the approval.

### Included

- Optional template-local keys for nodes that participate in internal relationships.
- Optional template name hints for readable Layers and State labels.
- Generic internal prop references constrained by the target component's existing registry reference metadata.
- Template-authored shared node-level Boolean State visibility bindings.
- Two-pass block resolution and insertion-time materialization of local keys into fresh node IDs.
- Full validation before document mutation and one atomic `block.insert` result.
- A block-owned state convention that nests each template-created Boolean State inside the inserted visual root.
- Independent insertion and whole-root duplication through existing reference-remapping rules.
- Explicit persisted Button Disclosure configuration with registry-declared references to the Boolean State and controlled content.
- A read-only effective-semantics evaluator that emits `aria-expanded` only while the Button, state, panel, binding, and structural relationship remain valid.
- A Button component-version migration that preserves every existing Button as a normal action with no new accessibility state.
- Authoritative block-library family and search metadata for usable interactive blocks while keeping the nonvisual Boolean State out of the library.
- A state-powered Disclosure block that starts collapsed.
- Registry, command, store, migration, rendering, Editor, Component Library, duplication, keyboard, accessibility, and browser verification.
- Durable architecture, usage guidance, execution-state, and implementation-report updates after behavior is verified.

### Excluded

- Persisting a `block`, `blockInstance`, template key, or template reference in project documents.
- A second state store, cross-page state, persisted visitor state, or history-backed runtime changes.
- User-authored connected templates, saved components, template parameters, external template references, or a block marketplace.
- A full multi-item Accordion pattern, exclusive-open groups, heading-level automation, or panel landmark generation.
- `aria-controls` until the builder has an approved general element-ID and cross-node accessible-association contract. The W3C Disclosure pattern treats this relationship as optional; the block must not be marketed as an Accordion.
- A Dismissible announcement or any self-unmounting focused control until a separate plan defines the focus destination, restoration behavior, and accountable accessibility review.
- Dropdown, menu, popover, Drawer, modal, dialog, Tooltip, or Toast lifecycle behavior.
- Escape handling, outside-click dismissal, focus trapping/restoration, portals, scroll locking, or background inertness.
- Tabs or other single-selection interactions until a non-Boolean state contract exists.
- Conditional styles, variants, label swapping, icon rotation, enter/exit animation, and delayed unmount.
- A project schema-version increase unless implementation uncovers a persisted document-envelope change. The planned persisted change is limited to a deterministic Button component-version migration.

## Product and architecture decisions

### Connected blocks compile into ordinary nodes

A connected block is a code-authored recipe, not a new persisted object. After insertion, the project contains the same `BuilderNode` shape it already understands. Local keys exist only while resolving and inserting the template.

### Template-local keys are private and deterministic

Add optional local identity and relationship fields to the template contract. The following is illustrative TypeScript, not executable code:

```ts
type ComponentTemplate = {
  key?: string;
  nameHint?: string;
  type: ComponentType;
  props?: JsonObject;
  styles?: ComponentTemplateStyleOverrides;
  nodeReferences?: readonly {
    path: string;
    targetKey: string;
  }[];
  stateBinding?: {
    stateKey: string;
    on: "show" | "hide";
    off: "show" | "hide";
  };
  children?: readonly ComponentTemplate[];
};
```

Contract rules:

- Keys are optional and local to one block template. Every declared `key` and referenced `targetKey` or `stateKey` must match `^[a-z][a-z0-9-]{0,63}$` exactly.
- The grammar permits 1 through 64 ASCII characters. The first character must be a lowercase letter; remaining characters may be lowercase letters, digits, or hyphens.
- Keys are validated as authored. The resolver must not trim, case-fold, Unicode-normalize, or otherwise rewrite them; whitespace, uppercase characters, underscores, leading digits, and values longer than 64 characters are invalid.
- The resolver must collect declarations in a collision-safe `Map<string, ...>`. A second declaration of the same key is a validation error even when both declarations would otherwise describe compatible nodes.
- Key declaration and collision validation completes before relationship resolution, real-ID allocation, or document mutation. Registered block validation and command-time resolution must fail closed on the same invalid template.
- Invalid-key messages must identify the block type, offending key, template path, required grammar, and 1-64 character bound. Duplicate-key messages must identify the duplicate key plus both the first and repeated declaration paths. For example: `Block "disclosure" key "Panel_1" at "root.children[1]" is invalid; expected /^[a-z][a-z0-9-]{0,63}$/ (1-64 characters).`
- Every relationship target must declare a key; unrelated nodes need no key.
- `nameHint` is separate from key identity. It is optional, trimmed when present, must contain 1-80 characters after trimming, and becomes a unique readable `meta.name` base. Existing templates without a hint retain type-derived names.
- `nodeReferences.path` must match reference metadata already declared by the source component definition.
- The target key must exist in the same template and its component type must equal the reference metadata's `targetType`.
- A template cannot author a non-empty raw value at a registry-declared reference path; internal relationships must use `nodeReferences` so hard-coded node IDs cannot enter a reusable template.
- `stateBinding.stateKey` must resolve to a Boolean State in the same template. Boolean State itself cannot receive a visibility binding.
- Local keys and symbolic relationships never persist and never appear in Preview data, autosave data, history state, or exported project JSON.

Block discovery metadata belongs to the block registry rather than UI category inference. Reshape `BlockDefinition` around one validated library contract, illustrated here as non-executable TypeScript:

```ts
type BlockDefinition = {
  library: {
    label: string;
    category: string;
    family: "layout" | "navbar" | "buttons" | "inputs" | "interactive";
    icon: React.ComponentType;
    searchTerms?: readonly string[];
  };
  createTemplate: () => ComponentTemplate;
};
```

Existing blocks receive explicit compatible metadata during the bounded source migration. `component-library.tsx` consumes that registry contract and must not classify a block by comparing category display strings. This is application metadata and never persists in project documents.

### Template resolution and insertion use separate validation phases

1. Resolve defaults, authored props, styles, and child placement into an isolated template tree.
2. Collect the full local-key index before resolving forward or sibling references.
3. Reject duplicate keys, invalid names, dangling references, undeclared reference paths, wrong target types, invalid state mappings, raw hard-coded reference values, and nonvisual block roots.
4. Validate source props with a symbolic-aware template phase. A registry-declared reference path may remain at its documented empty default only when exactly one valid symbolic relationship supplies its final value; do not invent fake node IDs or rely on the current Button schema accepting an empty action target.
5. During `block.insert`, reserve one collision-free real ID for every node before materializing any node.
6. Build `template key -> NodeId` and template-object-to-ID maps.
7. Replace prop references and state-binding targets with real IDs, then run the final component props and state-binding schemas.
8. Build all nodes in isolated memory, clone the project, attach the subtree root at the requested destination, and run the existing final candidate validation.
9. Return either one applied tree mutation or one rejection with the source document unchanged.

The command result retains the existing `blockType`, `rootNodeId`, ordered `nodeIds`, and `destination` contract. Template-local keys stay private to the compiler. This plan does not permit a `keyedNodeIds` field or an equivalent command-contract expansion. Relationships are verified through materialized nodes addressed by the existing `nodeIds` result. Any later proposal to expose key-addressed results is a separate architecture and compatibility decision outside this scope and requires concrete non-test consumers plus an approved `Project.md` contract change.

### Template-created state is owned by the inserted subtree

The V1 ownership convention is:

```text
Visual block root
|-- trigger or action Button
|-- controlled visual content
`-- Boolean State with a template-local key
```

This structure uses verified existing behavior: the runtime discovers Boolean State anywhere on the page, Container accepts the nonvisual child, and whole-subtree duplication already remaps internal prop references and `stateBinding`. The state remains page-scoped even though the tree records block ownership.

Required lifecycle behavior:

- Deleting the complete block deletes its internal state with the subtree.
- Duplicating the complete block creates a new state and controlled Container and remaps both copied Button references plus the copied visibility binding.
- Two separately inserted instances never share generated state IDs.
- Duplicating only a consumer keeps its existing state and controlled-content targets under the current external-reference rule; effective Disclosure semantics then depend on whether the copy still satisfies the shared-parent invariant.
- Moving the state or controlled Container outside the block is an explicit author edit; later duplication follows the resulting tree ownership and effective Disclosure semantics remain disabled while the shared-parent invariant is broken.
- Deleting only the state or controlled Container keeps current unavailable-target recovery behavior and recoverable Button configuration for remaining consumers.

### Disclosure separates persisted configuration from effective semantics

The [W3C Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) requires a Button whose `aria-expanded` reflects whether its controlled content is visible; native Button behavior supplies Enter and Space activation. A state reference alone cannot prove that relationship because an author may reconnect, invert, move, or delete the panel independently.

Add explicit persisted Button configuration with a closed contract such as:

```ts
stateAccessibility: "none" | "disclosure";
disclosureContentNodeId: string;
```

`targetStateNodeId` remains the registry-declared Boolean State reference. Add `disclosureContentNodeId` as a second registry-declared, page-scoped, `remap-if-target-cloned` reference whose target type is `container`. Template `nodeReferences` supplies both real IDs during insertion.

Persisted configuration rules:

- `stateAccessibility: "none"` requires an empty `disclosureContentNodeId` and preserves current Button behavior.
- `stateAccessibility: "disclosure"` requires an unlinked, non-submit Button, `stateAction: "toggle"`, a non-empty Boolean State reference, and a non-empty controlled-content reference.
- Direct Button prop edits that break those rules atomically set `stateAccessibility` to `none` and `disclosureContentNodeId` to an empty string in the same command and history entry.
- A direct Button edit may select another valid controlled Container or Toggle state only when the complete resulting configuration passes validation.
- Button moves from component version 5 to version 6. The deterministic 5-to-6 migration adds `stateAccessibility: "none"` and `disclosureContentNodeId: ""`; versions 1 through 5 continue through the complete migration chain.
- Project schema remains version 3 because the shared node envelope does not change.

Effective Disclosure semantics are a derived, read-only rendering decision. Rendering may emit `aria-expanded` only when all six parts of this invariant hold at the active page and viewport:

1. **Button configuration is valid.** The persisted Button is unlinked and non-submit, has `stateAccessibility: "disclosure"`, uses `stateAction: "toggle"`, and contains both required non-empty references.
2. **State reference is valid.** `targetStateNodeId` resolves on the active page to a Boolean State.
3. **Controlled content reference is valid.** `disclosureContentNodeId` resolves on the same page to a Container.
4. **Visibility binding is valid.** The controlled Container targets that same Boolean State with exactly On → Show and Off → Hide.
5. **Structural relationship is valid.** The Button, Boolean State, and controlled Container share the Disclosure root's direct parent, with all required ancestors available.
6. **Effective visibility matches Disclosure state.** The controlled Container's actual visibility at the active viewport agrees with the live Boolean State; no independent hidden state, responsive presentation, missing ancestor, or unavailable runtime value creates a mismatch.

When the complete invariant holds, the effective evaluator derives `aria-expanded` from the live visibility of the controlled Container. If any condition fails because of deletion, movement, inversion, reconnection, an unresolved reference, independent presentation, or unavailable runtime state, rendering must omit `aria-expanded`.

Rendering, hydration, and effective-semantics evaluation are pure with respect to persisted project data: they must not rewrite Button props, repair references, dispatch commands, change document revision, create history, or normalize the document. Recoverable configuration remains persisted where the schema permits it. The State Inspector shows a specific warning and offers explicit repair, reconnection, or configuration-clearing actions. Undo/Redo remains the recovery path for destructive tree edits.

Changing the panel, state, or tree does not silently rewrite Button props. The underlying Button state action may continue to follow its existing resolved/unavailable behavior, but it does not claim Disclosure semantics until the full invariant is restored. Hydration accepts schema-valid dangling references as recoverable configuration and uses the same effective evaluator rather than normalizing during render.

`aria-controls` is deferred rather than faked with unstable DOM IDs. The product-facing block is named Disclosure, not Accordion. A future Accordion plan must adopt the [W3C Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) with heading structure, stable panel association, and group keyboard decisions.

## Gate 1 decision log

This table is the canonical Gate 1 contract summary and acceptance record. Suraj accepted each decision as Accountable Owner and as the required verifier under the confirmed role-overlap arrangement.

| ID | Frozen plan decision | Owning plan section | Required acceptance | Acceptance state |
| --- | --- | --- | --- | --- |
| G1-D01 | Template keys and symbolic relationships are internal compiler metadata only and never persist or enter command results. | [Template-local keys are private and deterministic](#template-local-keys-are-private-and-deterministic) | Accountable Owner and Technical Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D02 | Resolution and insertion use two phases: symbolic collection and validation, followed by real-ID materialization and final validation before one atomic mutation. | [Template resolution and insertion use separate validation phases](#template-resolution-and-insertion-use-separate-validation-phases) | Accountable Owner and Technical Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D03 | A template-created Boolean State is nested inside and owned by the inserted visual root for V1. | [Template-created state is owned by the inserted subtree](#template-created-state-is-owned-by-the-inserted-subtree) | Accountable Owner and Technical Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D04 | Disclosure is the first and only adopter in this plan. | [State-powered Disclosure](#state-powered-disclosure) | Accountable Owner and Accessibility Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D05 | Dismissible Announcement and every self-unmounting focused-control pattern are out of scope and remain deferred; this plan contains no implementation path for them. | [Excluded](#excluded) | Accountable Owner and Accessibility Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D06 | The existing `block.insert` result remains unchanged; no `keyedNodeIds` field or equivalent command-contract expansion is permitted in this plan. | [Template resolution and insertion use separate validation phases](#template-resolution-and-insertion-use-separate-validation-phases) | Accountable Owner and Technical Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D07 | `BlockDefinition.library` is the single validated registry authority for block label, icon, category, family, and search terms; UI category-string inference is removed. | [Template-local keys are private and deterministic](#template-local-keys-are-private-and-deterministic) | Accountable Owner and Technical Verifier | Accepted — Suraj, 2026-08-18 |
| G1-D08 | Persisted Button configuration is distinct from read-only effective Disclosure semantics; broken effective relationships omit `aria-expanded` without render-time repair or mutation. | [Disclosure separates persisted configuration from effective semantics](#disclosure-separates-persisted-configuration-from-effective-semantics) | Accountable Owner, Technical Verifier, and Accessibility Verifier | Accepted — Suraj, 2026-08-18 |

Suraj, as Performance Owner, also accepted the [performance method and decision timing](#performance-method-and-decision-timing). On 2026-08-18, before CSB-08 execution, Suraj accepted a 10% maximum regression threshold for both median and p95 insertion duration.

## Initial block definition

### State-powered Disclosure

Initial tree and connections:

```text
Container: Disclosure
|-- Button: Show details
|   |-- action: Toggle local state "open"
|   |-- accessible behavior: Disclosure
|   `-- controlled content: local Container "content"
|-- Container: Disclosure content
|   |-- visibility: On -> Show, Off -> Hide using "open"
|   `-- Text: Replace this text with your details.
`-- Boolean State: Disclosure open
    `-- default: Off
```

Acceptance behavior:

- The Component Library preview renders the open visual shape but does not run state or create interactive nested controls inside the library-card Button.
- A new Editor insertion shows all authored nodes; the inactive panel uses the existing muted state-bound authoring treatment.
- Preview starts collapsed.
- Pointer, Enter, and Space activation toggle the same runtime state.
- `aria-expanded` starts false, becomes true when open, and returns to false when closed.
- The Button's controlled-content reference and state reference both point to fresh IDs inside the inserted subtree.
- Moving the panel outside the shared parent, inverting or reconnecting its visibility binding, deleting it, or making either reference unavailable omits `aria-expanded` and produces a specific Inspector warning without mutating Button props.
- Repairing the relationship restores effective Disclosure semantics; direct incompatible Button edits clear its persisted Disclosure configuration atomically.
- The panel fully unmounts in Preview when closed, matching the existing visibility contract.
- The state, Button, panel, and text remain ordinary editable Layers nodes.

### Component Library placement

- Add a non-empty **Interactive** family containing the Disclosure block.
- Keep Boolean State excluded from Component Library cards and search results.
- Keep existing Blocks family behavior: the entry also appears in the general Blocks view.
- Add registry-owned search terms including `state`, `toggle`, `show hide`, `disclosure`, and `details`.
- Preserve existing Navbar, layout, input, and Button preset classification and ordering unless an explicit library-order decision is made.

## Constraints and assumptions

- Verified: `main` at `c032701` contains project schema 3, Button version 5, generic prop-reference metadata, state-binding remapping, ordinary Button state actions, and one-root atomic block insertion.
- Verified: the current block resolver has no local identity or relationship contract and validates one component tree.
- Verified: the Boolean runtime scans all page nodes, so a nested state does not require runtime-provider changes.
- Verified: the current shell uses Node 22.21.1 while the repository requires Node 24.19.x. Local development may report an engine warning; final release authority is verification under Node 24.
- Verified execution context: `feat/connected-state-blocks` was created from `main` at `c032701`; no application implementation exists at this revision.
- Assumption to validate: nested nonvisual state remains understandable and operable in Layers for the newly inserted Disclosure.
- Assumption to validate: the Component Library preview can omit the nonvisual state and ignore runtime bindings without misleading the visual thumbnail.
- The implementation must preserve unrelated user work and existing blocks. Branch creation, switching, synchronization, commit, and push require their normal approvals and are not authorized by this plan alone.

## Expected implementation surface

| Area | Expected files | Planned responsibility |
| --- | --- | --- |
| Template contract and validation | `src/builder/registry/define-block-registry.ts` | Add local identity, name hints, symbolic prop references, template state bindings, two-phase validation, and resolved-template metadata |
| Block catalog | `src/builder/registry/define-block-registry.ts`, `src/builder/registry/block-registry.ts`, and a focused file under `src/builder/registry/blocks/` | Add validated block-library family/search metadata and register Disclosure without category-name inference or changes to persisted project data |
| Atomic insertion | `src/builder/commands/execute-command.ts` | Allocate IDs, materialize references/bindings/names, validate before mutation, preserve the existing command-result contract, and align deterministic dry-run/apply validation |
| Generic reference reuse | `src/builder/registry/component-registry.ts`, `src/builder/registry/define-component-registry.ts`, and `src/builder/project/node-references.ts` only if a narrow helper is needed | Reuse existing reference metadata and duplication behavior; avoid a parallel reference authority |
| Button semantics and migration | `src/builder/registry/components/component-definitions.tsx` | Add `stateAccessibility`, `disclosureContentNodeId`, both reference contracts, strict direct-edit reconciliation, Button version 6, and the 5-to-6 migration |
| State Inspector | `src/builder/ui/inspector-panel.tsx` | Expose persisted Disclosure configuration separately from effective status, warn on broken Button/state/panel invariants, and provide explicit repair or clearing actions |
| Component Library | `src/builder/ui/component-library.tsx` | Add the Interactive family, consume registry-owned block discovery metadata, and keep the Disclosure preview noninteractive and Boolean State hidden |
| Rendering integration | `src/builder/rendering/node-rendering-controller.tsx` and a focused relationship helper if required by the approved evaluator boundary | Derive effective Disclosure semantics without document mutation, reuse actual visibility decisions, and avoid a block-specific renderer |
| Styling | Template-authored responsive styles first; `src/app/globals.css` only for shared semantic focus/indicator behavior that templates cannot express | Keep visuals inside the existing style schema and avoid block-only runtime CSS where authored styles suffice |
| Focused tests | Existing specs under `src/builder/registry/__tests__/`, `src/builder/commands/__tests__/`, `src/builder/store/__tests__/`, `src/builder/project/__tests__/`, `src/builder/rendering/__tests__/`, and `src/builder/ui/__tests__/` | Cover every contract, migration, interaction, and regression gate close to its authority |
| Performance evidence | `src/builder/commands/__benchmarks__/csb08-insertion.bench.ts` and `src/builder/commands/__benchmarks__/percentile-benchmark-reporter.mts` | Run one revision-independent fixed-fixture harness against exact baseline and candidate sources; retain raw samples and portable UTF-8 evidence |
| Durable documentation after implementation | `Project.md`, the existing canonical tutorial at `workspaces/navbar/notes/Boolean-State-Connections-Tutorial.md`, a D5 report under `workspaces/components/reports/`, and the selected workspace/branch trackers | The [PR-review remediation review](../review/connected-state-blocks-pr-review-remediation-review.md) explicitly amends the originally planned `workspaces/components/notes/` location to avoid a duplicate Boolean State guide; record only verified as-built behavior and exact verification evidence |

This inventory is expected rather than pre-authorized. If implementation requires a persisted document-envelope change, a new runtime provider, broad component-reference redesign, or files outside these responsibilities, stop and review the scope before continuing.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Existing Boolean State runtime and visibility binding | Page-scoped runtime values, inactive Editor reveal, and absent Preview content remain unchanged | Technical Verifier — Suraj | Stop and separate any runtime redesign from this feature |
| Component reference metadata | Button `targetStateNodeId` remains a validated page-scoped remap-if-cloned reference, and `disclosureContentNodeId` uses the same authority for a Container target | Technical Verifier — Suraj | Do not introduce a template-only or rendering-only reference system that bypasses registry metadata |
| Block resolver and registry startup validation | Existing unconnected templates resolve unchanged | Technical Verifier — Suraj | Preserve the old template shape as a compatible subset and block rollout on regression |
| Command executor and full candidate validation | One `block.insert` remains one atomic tree mutation | Technical Verifier — Suraj | Reject before mutation; do not recover through partial cleanup |
| Subtree and page duplication | Internal reference targets remap only when cloned | Technical Verifier — Suraj | Keep connected blocks unavailable until independence tests pass |
| Button migration chain | Versions 1 through 5 migrate deterministically to version 6 | Technical Verifier — Suraj | Stop hydration rollout; do not merge defaults into persisted historical props |
| Component Library click, drag, search, preview, and families | Existing entries and interactions remain stable; block family/search metadata has one registry authority | Technical Verifier — Suraj | Isolate Interactive family changes and retain existing ordering |
| W3C Disclosure semantics | Native Button activation, an explicit controlled-content reference, and `aria-expanded` that matches effective content visibility | Accessibility Verifier — Suraj | Omit semantics on any broken invariant and do not label or ship the block as Disclosure until the semantic gate passes |

## Ordered work

| ID | Deliverable or action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| CSB-01 | Freeze the existing unconnected-template and `block.insert` result contracts with regression fixtures; add failing behavior-first cases for keys, references, bindings, block-library metadata, and hard-coded reference rejection | Current `main` baseline | Existing Navbar/input/Button templates and command values remain unchanged; new invalid connected templates fail with stable path-aware errors | Implementer | Complete — 2026-08-18 |
| CSB-02 | Extend `ComponentTemplate` and `ResolvedComponentTemplate` with optional `key`, `nameHint`, `nodeReferences`, and template `stateBinding`; extend `BlockDefinition` with validated library family/search metadata | CSB-01 | TypeScript rejects malformed authored structures; runtime tests cover key grammar, duplicate keys, empty hints, invalid library metadata, and unchanged legacy templates | Implementer | Complete — 2026-08-18 |
| CSB-03 | Refactor template resolution into symbolic-aware structural collection plus relationship validation using component registry reference metadata, without fake node-ID placeholders | CSB-02 | Tests reject dangling keys, wrong target types, undeclared/duplicate paths, raw hard-coded references, invalid state targets, Boolean State self-visibility, and final strict-props failures | Implementer | Complete — 2026-08-18 |
| CSB-04 | Extend `block.insert` with two-pass ID reservation, private local-key mapping, final prop/binding materialization, meaningful unique names, pre-mutation validation, and deterministic dry-run/apply agreement | CSB-03 | Tests prove no alias persists, existing command values stay compatible, deterministic failures agree between dry-run/apply, ID exhaustion is documented apply-only, collision rejection is non-mutating, root selection is unchanged, and insertion is one applied mutation | Implementer | Complete — 2026-08-18 |
| CSB-05 | Prove block-owned state lifecycle through insertion, whole-root duplication, consumer-only duplication, deletion, Undo/Redo, and two-instance independence | CSB-04 | Command/store tests prove independent state IDs and correct internal/external remapping without changing source snapshots | Implementer | Complete — 2026-08-18 |
| CSB-06 | Add Button `stateAccessibility` and `disclosureContentNodeId`, both registry reference contracts, direct-edit reconciliation, the read-only effective-semantics evaluator, Inspector diagnostics/repair, component version 6, and the deterministic 5-to-6 migration | CSB-03; approved accessibility matrix | Registry, migration, hydration, rendering, Inspector, direct-edit, panel edit/move/delete, pointer, Enter, Space, missing-target, and unchanged-document/history tests pass | Implementer and accessibility verifier | Complete — 2026-08-18 development evidence; Node 24 release gate remains CSB-09 |
| CSB-07 | Add the Interactive library family and state-powered Disclosure template with local state, both Button references, panel visibility binding, name hints, registry-owned search terms, and noninteractive preview behavior | CSB-04, CSB-06 | Registry, Component Library, Editor insertion, Preview, Layers, search, click/drag, state-default, relationship-break/recovery, and truthful `aria-expanded` tests pass | Implementer and product/accessibility verifier | Complete â€” 2026-08-18 development evidence; Node 24 and accountable release review remain CSB-09 |
| CSB-08 | Run focused validation and benchmark two-pass compilation against the existing largest block template using the predeclared method | CSB-05, CSB-07; 10% median/p95 performance threshold accepted by Suraj on 2026-08-18 | Focused suites pass; measured insertion remains within the accepted regression threshold or the compiler is optimized before rollout | Implementer and technical verifier | Complete; refreshed 2026-08-19 evidence records +3.25% median and -4.95% p95 regression |
| CSB-09 | Run the full release matrix under the declared Node 24 engine and complete the named browser, viewport, zoom, keyboard, and assistive-technology matrix | CSB-08 | Typecheck, full ESLint, serialized tests, production build, keyboard QA, console review, named browser coverage, and accountable accessibility review pass | Implementer and accountable verifiers | Closed by accountable exception — Suraj, 2026-08-18; the final post-remediation suite, production build/startup check, and basic Firefox 153.0 Disclosure smoke subsequently pass. The 2026-08-19 verification-closure approval retains NVDA/Firefox as the sole exception; unexecuted zoom, Firefox responsive, and Firefox keyboard cases are outside the approved delivery scope and are not passes. |
| CSB-10 | Update durable architecture and user guidance only with verified behavior, write the implementation report, and update the selected execution trackers | CSB-09 | Documentation manifests, unique IDs, links, Markdown structure, factual code links, and recorded verification evidence pass review | Implementer and accountable reviewer | Complete — 2026-08-19; Suraj approved the implementation report, the verification-closure amendment records NVDA/Firefox as the sole exception, and synchronized documentation validation passes. |

## Detailed verification matrix

### Registry and compiler

- Existing Navbar, Commerce Navbar, Button presets, and Input preset resolve without authored changes.
- Every block exposes family and optional search terms through one validated registry contract; Component Library code contains no category-string classification branch.
- Every declared or referenced local key matches `^[a-z][a-z0-9-]{0,63}$` exactly and is 1-64 characters; the resolver performs no normalization.
- Forward and sibling local references resolve after the full key index is collected.
- Invalid keys report the block, value, path, grammar, and length bound. Duplicate keys report the block, duplicate value, and both declaration paths.
- Missing targets, wrong target types, unknown prop paths, duplicate prop bindings, and invalid visibility mappings reject at registry validation.
- A Button template cannot smuggle a literal node ID into `targetStateNodeId` or `disclosureContentNodeId`.
- Symbolic-aware template validation accepts only registry-declared empty reference defaults backed by exactly one local relationship; it never creates a fake node-ID placeholder.
- Final materialized props pass the component's current strict schema after real IDs replace internal references.
- No key, hint, placeholder, or symbolic target appears in the saved node props, `stateBinding`, Preview snapshot, or serialized document.

### Command and history

- Click and drag insertion use the same `block.insert` command and produce equivalent trees.
- Dry-run and apply return the same result for every deterministic destination, placement, template, relationship, and materialization-independent validation failure.
- ID exhaustion/collision remains the only documented apply-only block-insertion failure because dry-run does not consume or predict generated IDs.
- Destination, lock, placement, index, and ID-collision failures leave the original document byte-for-byte equivalent.
- One successful insertion increments the document once, creates one Undo entry, selects the visual root, and returns every generated ID through the existing command-value shape.
- No command result exposes template-local keys; `keyedNodeIds` and equivalent result fields are outside this plan.
- Undo removes the visual subtree and its internal state together; Redo restores the same connected result through history.
- Two inserted copies receive disjoint node IDs and state IDs.
- Whole-root duplication remaps the Button's state and controlled-content references plus the panel visibility target to the duplicated nodes.
- Consumer-only duplication preserves the original state and controlled-content targets, matching the existing generic rule; the effective evaluator omits semantics when the copy no longer shares the required parent.
- Whole-page duplication continues to remap all page-local internal references.

### Rendering and interaction

- Boolean State renders no DOM even when nested in a visual block root.
- Editor renders inactive connected content using the existing authoring treatment and preserves Layers selection.
- Preview omits inactive bound content and its descendants.
- Disclosure starts Off/collapsed.
- Native pointer, Enter, and Space activation operate the state action.
- Runtime interaction does not change document revision, undo history, autosave state, or Preview snapshot data.
- Missing or wrong-type state targets remain safe no-ops with existing unavailable diagnostics.
- Effective Disclosure evaluation reads the current document, viewport, and Boolean runtime without dispatching commands, mutating nodes, or creating history.

### Accessibility

- Disclosure uses a native Button with a stable visible accessible name.
- `aria-expanded` matches actual controlled-content visibility before and after pointer, Enter, and Space activation only while the full persisted and effective invariant holds.
- Direct incompatible Button edits atomically clear persisted Disclosure configuration in one command; panel/tree edits preserve recoverable references and change only effective status.
- Panel deletion, movement outside the shared parent, binding inversion/reconnection, unresolved references, independent hidden presentation, and unavailable runtime state each omit `aria-expanded` and produce a specific Inspector warning.
- Repairing the exact relationship restores `aria-expanded`; rendering and hydration never normalize the document as a side effect.
- The first block is exposed as Disclosure, not Accordion.
- Focus remains on the persistent Disclosure Button while its controlled content mounts and unmounts.
- Focus-visible presentation and zoom/reflow pass the named viewport and zoom matrix.
- Automated DOM assertions are supplemented by the named keyboard and assistive-technology review; passing unit tests alone is not approval.

### Component Library and authoring

- The Interactive family is non-empty and contains Disclosure.
- Boolean State remains absent as a direct Component Library card or search result.
- Disclosure remains discoverable in All, Blocks, Interactive, favorites, and search paths as applicable.
- Library previews show representative open visuals without nested live Buttons inside the library-card Button.
- Inserting Disclosure announces a readable result and selects its visual root.
- Layers exposes meaningful names including **Disclosure**, **Show details**, **Disclosure content**, and **Disclosure open**.
- State Inspector distinguishes persisted Disclosure configuration from effective status and supports deliberate repair, reconnection, inversion, disconnection, or clearing without hidden reconciliation.

### Performance method and decision timing

- Benchmark `block.insert` with the largest existing block template and the new Disclosure template against baseline commit `c032701` on the same machine, supported Node 24 runtime, dependency lockfile, and production-equivalent command path.
- Use 10 warm-up insertions and at least 50 measured insertions into a fixed document fixture; record median and 95th-percentile duration, fixture node count, template node count, runtime version, CPU, and command revision.
- Suraj, as Technical Verifier and Performance Owner, accepted the benchmark method and evidence format for Gate 1. On 2026-08-18, before CSB-08 execution, Suraj accepted a 10% maximum regression threshold for both median and p95 insertion duration.
- CSB-08 evidence was refreshed on 2026-08-19 under Node 24.19.0 and Vitest 4.1.10 on the same Windows 11 machine, 1,000-node fixture, and production `block.insert` path. Baseline `c032701` and candidate `40de821` use the identical committed harness blob; Commerce Navbar is the largest legacy template at 70 nodes and Disclosure contains 5 nodes.
- Baseline `c032701` Commerce Navbar measured 56.7057 ms median and 90.6095 ms nearest-rank p95. Committed candidate `40de821` measured 58.5483 ms median and 86.1221 ms p95: +3.25% and -4.95% regressions, both within the accepted 10% ceiling. Candidate Disclosure measured 38.4245 ms median and 51.1941 ms p95.
- Raw [baseline JSON](../assets/csb-08-baseline-benchmark.json), [baseline UTF-8 text summary](../assets/csb-08-baseline-benchmark.txt), [candidate JSON](../assets/csb-08-candidate-benchmark.json), [candidate UTF-8 text summary](../assets/csb-08-candidate-benchmark.txt), and [benchmark metadata](../assets/csb-08-benchmark-metadata.json) retain the executed evidence and revision identities.

### Browser and accessibility matrix

- Before CSB-06 begins, an accountable accessibility owner must accept the expected results and evidence format for this matrix.
- Run Editor and Preview in current stable Chrome and Firefox on Windows at 1440 × 900 and a 390 × 844 responsive viewport, at 100% and 200% browser zoom. Record exact browser versions only when executed.
- Complete keyboard-only insertion, configuration, repair, pointer-equivalent activation with Enter and Space, focus retention on the persistent Button, and continued navigation after collapse.
- Complete an NVDA review with Firefox on Windows for the Disclosure Button's accessible name, role, collapsed/expanded state, state changes, omission of false `aria-expanded`, and Inspector warning discoverability. Record exact NVDA and Firefox versions only when executed.
- Any matrix substitution requires accountable accessibility approval recorded before CSB-06 or CSB-07 proceeds; passing automated tests alone does not authorize release.

### Release commands

Run focused suites after each bounded step, then complete:

```powershell
pnpm typecheck
pnpm lint
pnpm test -- --maxWorkers 1 --no-file-parallelism
pnpm build
```

Record exact test totals and runtime versions only after the commands run. Final release evidence must use Node `>=24.19.0 <25`; results under Node 22 may support development diagnosis but do not satisfy the declared engine gate.

### CSB-09 execution evidence

| Check | Result through 2026-08-19 | Evidence or remaining action |
| --- | --- | --- |
| Declared runtime | Pass | Node 24.19.0 |
| Typecheck | Pass | `tsc --noEmit` completed with no diagnostics |
| Full ESLint | Pass | `eslint .` completed with no findings |
| Serialized tests | Pass | The post-merge Node 24.19.0 command `pnpm dlx node@24.19.0 node_modules/vitest/vitest.mjs run --maxWorkers 1 --no-file-parallelism` passes 48 files and 669 tests with 0 failures in 285.05 seconds. This supersedes the earlier 41-file/619-test evidence after current-main integration and five new regressions. |
| Production build | Pass | The post-merge Node 24.19.0 command `pnpm dlx node@24.19.0 node_modules/next/dist/bin/next build` completed the Next.js 16.3.0 optimized build in 24.07 seconds with exit code 0. One non-blocking warning reported an ignored lockfile outside the repository. |
| Production startup and HTTP | Pass | The fresh build reported ready in 217 ms under `next start --hostname 127.0.0.1 --port 3219`; `/` returned HTTP 200 with a 6,967-byte response and the probe connected in 0.74 seconds. The dashboard now owns `/`, so byte size is not compared with the earlier Editor-root response. |
| Post-review focused checks | Pass | The behavior-first Disclosure semantics and Editor Shell command passes 91 tests in 73.64 seconds; Node 24.19.0 typecheck and full ESLint also pass. |
| Chrome matrix | Partial pass | Chrome 151.0.7922.138 passes Editor/Preview checks at 1440 x 900 and 390 x 844 viewport overrides with no page-level horizontal overflow, including both side panels expanded at the narrow width. Disclosure insertion, configuration repair, truthful `aria-expanded`, pointer/Enter/Space activation, focus retention, continued navigation, and clean Editor/Preview console checks pass. A 195 x 422 CSS-pixel reflow proxy also passes, but true 100%/200% browser zoom remains unexecuted because the connected browser exposes viewport control only; the reflow proxy is not zoom evidence. |
| Firefox Disclosure smoke | Pass for approved scope | Playwright 1.62.1 headless Firefox 153.0 passes a 1440 x 900 production smoke: Editor HTTP 200, Disclosure insertion, pointer expansion/collapse, Preview `aria-expanded` `false` to `true` to `false`, zero console/page errors, no horizontal overflow, and no obvious visual regression. The named 390 x 844 responsive viewport, true 100%/200% zoom, and Firefox keyboard rows were not executed; the verification-closure approval places them outside this delivery scope and does not represent them as passes. |
| NVDA with Firefox | Blocked | NVDA was not found in standard installation paths, App Paths registration, packaged apps, or command discovery. Install or provide the accountable assistive-technology environment and record the named human review. |
| Accountable accessibility/release review | Approved with one exception | The historical [release-exception review](../review/connected-state-blocks-release-exception-review.md) records Suraj's instruction to progress before the later reruns. The [verification closure review](../review/connected-state-blocks-verification-closure-review.md) records the passing full suite, production build/startup, and Firefox smoke, approves the implementation report, and retains NVDA/Firefox as the sole documented exception. |

The first restricted-sandbox typecheck attempt produced false dependency-resolution diagnostics because pnpm package files were hardlinked to an external store that the sandbox could not read. Reinstalling from the unchanged offline lockfile with workspace-local copied package files removed that environmental fault; the passing results above are the authoritative reruns. This dependency repair changed generated `node_modules` content only and did not change package or lockfile authority.

## Review finding closure mapping

The [Q2 plan review](../review/connected-state-blocks-plan-review.md) remains the authority for finding status. This table makes each finding traceable to a plan contract, implementation path, verification step, and required closure evidence. A drafted plan correction is not closure evidence; the Accountable Owner must accept the Gate 1 disposition, and later implementation evidence must be recorded at the named work item.

| Review finding | Plan section that resolves it | Implementation path | Verification step | Closure evidence required |
| --- | --- | --- | --- | --- |
| CSB-R-01 | [Excluded](#excluded), [Gate 1 decision G1-D05](#gate-1-decision-log), and [Completion](#completion) | No implementation path; Dismissible Announcement and self-unmounting focused controls remain outside CSB-01 through CSB-10 | Gate 1 scope audit and CSB-10 documentation audit | Accountable and Accessibility acceptance that no included deliverable, test, gate, or artifact reintroduces dismissal behavior; Q2 finding disposition recorded |
| CSB-R-02 | [Disclosure separates persisted configuration from effective semantics](#disclosure-separates-persisted-configuration-from-effective-semantics) and [Accessibility](#accessibility) | CSB-01 behavior-first cases, CSB-06 evaluator/migration/Inspector work, CSB-07 adopter, and CSB-09 accessibility execution | Direct-edit, tree-edit, rendering, hydration, warning, repair, Undo/Redo, unchanged-document/history, browser, keyboard, and NVDA checks | Gate 1 design acceptance plus passing automated evidence for all six invariant conditions, non-mutation proof, and accountable Accessibility verification |
| CSB-R-03 | [Template resolution and insertion use separate validation phases](#template-resolution-and-insertion-use-separate-validation-phases) and G1-D06 | CSB-01 compatibility fixtures and CSB-04 command materialization | Command type/result regression and relationship inspection through existing `nodeIds` | Gate 1 acceptance that no `keyedNodeIds` expansion is in scope plus passing compatibility tests showing the public command value is unchanged |
| CSB-R-04 | [Template resolution and insertion use separate validation phases](#template-resolution-and-insertion-use-separate-validation-phases) | CSB-03 symbolic validation and CSB-04 real-ID materialization | Schema-evidence review plus tests for symbolic relationships, final strict validation, and absence of fake IDs | Technical acceptance of the corrected Button-schema evidence and passing tests proving no placeholder or symbolic value persists |
| CSB-R-05 | [Template-local keys are private and deterministic](#template-local-keys-are-private-and-deterministic) and [Component Library placement](#component-library-placement) | CSB-02 registry metadata contract and CSB-07 Component Library consumption | Registry validation and UI regression tests across all existing blocks and Disclosure | Source and test evidence that `BlockDefinition.library` is the only metadata authority and category-string classification is absent |
| CSB-R-06 | [Goal, scope, and authority](#goal-scope-and-authority), [Expected implementation surface](#expected-implementation-surface), and [Completion](#completion) | Gate 1 document audit and CSB-10 documentation synchronization | Branch/workspace mapping, artifact-path, manifest, relative-link, and stale-reference checks | Passing documentation audit showing `feat/connected-state-blocks`, `workspaces/components/`, the linked review set, and branch journal agree |
| CSB-R-07 | [Performance method and decision timing](#performance-method-and-decision-timing), [Browser and accessibility matrix](#browser-and-accessibility-matrix), and [Gate 5](#gate-5-regression-and-release) | Accessibility matrix acceptance before CSB-06, benchmark execution in CSB-08, and release matrix in CSB-09 | Named-role acceptance, predeclared benchmark, Chrome/Firefox viewport and zoom checks, keyboard review, and NVDA/Firefox review | Accessibility Verifier acceptance before semantic work; Technical evidence plus Performance Owner threshold acceptance before CSB-08 passes; executed CSB-09 evidence |
| CSB-R-08 | [Template resolution and insertion use separate validation phases](#template-resolution-and-insertion-use-separate-validation-phases) and [Command and history](#command-and-history) | CSB-01 failing contract cases and CSB-04 dry-run/apply alignment | Paired dry-run/apply tests for every deterministic failure and non-mutating apply-only ID exhaustion/collision tests | Passing evidence that deterministic outcomes agree and generated-ID exhaustion/collision is the only documented apply-only failure |

## Quality and approval gates

### Gate 1: Contract approval

**Outcome: Approved for CSB-01 by Suraj on 2026-08-18.**

Approval evidence:

- Suraj is assigned as Accountable Owner, Technical Verifier, Accessibility Verifier, and Performance Owner, and explicitly confirmed that role overlap is permitted.
- The reviewed branch and commit are `feat/connected-state-blocks` at `c032701e52c5c8046a32d9365b8f5782fb75bbc6`.
- The exact local-key grammar `^[a-z][a-z0-9-]{0,63}$`, 1-64 character bound, no-normalization rule, collision-safe `Map`, duplicate rejection, path-aware failure messages, and `nameHint` bounds are accepted.
- G1-D01 through G1-D08 are accepted without qualification.
- The accessibility matrix, six-part Disclosure invariant, non-mutation contract, benchmark method, evidence format, and later numeric-threshold timing are accepted.
- The Q2 review records accepted dispositions for CSB-R-01 through CSB-R-08 without claiming unexecuted implementation verification.
- The workspace, review, checklist, branch index, and branch journal are synchronized to this outcome.

At the time of Gate 1 approval, no application test was required because implementation had not started; that approval authorized CSB-01 only. Subsequent implementation status and evidence are recorded in the ordered-work table and branch journal, and Gate 1 still does not claim that a later release gate has passed.

### Gate 2: Resolver safety

- All template and relationship validation completes before project mutation.
- Error messages identify block type and template path.
- Existing block templates remain source-compatible.
- No synthetic node-ID placeholder is introduced, and no symbolic value survives final materialization.
- Dry-run and apply agree on deterministic validation; generated-ID exhaustion remains explicitly apply-only.

### Gate 3: Document integrity

- Insertion, Undo/Redo, duplication, whole-page duplication, hydration, and serialization pass.
- State and controlled-content references remap through existing registry metadata and remain recoverable when their targets become unavailable.
- Project schema stays at version 3 unless an independently reviewed envelope change becomes necessary.
- Button version 6 migrates every supported historical Button version deterministically.

### Gate 4: Interaction and accessibility

- Before CSB-06 or CSB-07 begins, the accountable accessibility owner accepts the named browser, keyboard, zoom, NVDA, expected-result, and evidence matrix.
- Disclosure matches the scoped W3C pattern: native Button, Enter/Space activation, persistent Button focus, and `aria-expanded` that matches actual controlled-content visibility.
- Every broken Button/state/panel invariant omits `aria-expanded`, preserves or clears persisted configuration according to the documented edit boundary, and surfaces a specific Inspector recovery path.
- The block is not represented as a complete Accordion.
- An accountable accessibility verifier reviews the rendered result before approval.

### Gate 5: Regression and release

- Focused and full automated checks pass under the declared engine.
- The technical verifier recorded portable predeclared benchmark evidence; the measured +3.25% median and -4.95% p95 regressions are each below Suraj's accepted 10% threshold.
- Production build succeeds.
- The named Chrome/Firefox desktop, responsive viewport, and 100%/200% zoom matrix finds no feature error or horizontal-overflow regression.
- Existing Component Library entries, Navbar blocks, state authoring, Canvas manipulation, and Preview behavior remain intact.

Gate 5 is closed by accountable approval with one remaining exception. The final post-remediation Node 24 automated suite, benchmark, production build/startup check, Chrome verification, and basic Firefox 153.0 Disclosure smoke pass. Suraj's historical [release-exception review](../review/connected-state-blocks-release-exception-review.md) authorized progression to CSB-10 before the later reruns; the [verification closure review](../review/connected-state-blocks-verification-closure-review.md) records the final passing evidence and retains only NVDA/Firefox as a release exception. True-browser-zoom, Firefox responsive, and Firefox keyboard cases were not executed; they are outside the approved delivery verification scope, are not exceptions, and must not be promoted as passing evidence.

### Gate 6: Documentation and rollout

- `Project.md` changes describe only verified durable architecture.
- One usage guide explains insertion, state ownership, editing, duplication, and the boundary between Disclosure and Accordion.
- One D5 implementation report owns change inventory and verification evidence.
- Workspace and branch journals record the exact resume or completion point.
- The draft plan is not marked approved by an AI agent; accountable user/owner review remains required.

Gate 6 is complete. The architecture, existing tutorial, approved implementation report, historical release-exception review, verification-closure amendment, workspace, and branch trackers are synchronized. Suraj approved the report on 2026-08-19, and documentation integrity validation passes.

## Risks, rollback, and containment

| Risk | Trigger or symptom | Containment | Recovery or rollback |
| --- | --- | --- | --- |
| Symbolic reference leaks into persisted data | Serialized props or bindings contain a template key or placeholder | Assert final IDs and parse all nodes before candidate mutation | Reject insertion; keep connected entries unavailable until fixed |
| Existing blocks regress during resolver refactor | Navbar, presets, previews, or insertion tests change unexpectedly | Preserve the old template shape as a strict compatible subset | Revert only the connected-template slice through normal review; do not change existing templates to mask the regression |
| Partial tree insertion | Some nodes or state appear after a failed command | Build and validate materialized nodes in isolated memory | Reject the command before assigning nodes to the candidate page |
| Duplicated blocks share state | Copy Button or panel still targets the original state | Nest state inside the root and test whole-subtree remapping | Block release; do not add special duplicate behavior outside generic remapping without review |
| Name collisions make Layers confusing | Multiple blocks receive identical names | Uniquify `nameHint` against the page's reserved names in insertion order | Fall back to current type-derived naming if hint validation fails before mutation |
| Button migration damages historical projects | Version 1-5 hydration fails or behavior changes | Add one deterministic 5-to-6 step with `stateAccessibility: "none"` and an empty controlled-content reference; retain historical schemas | Stop rollout and restore the prior Button definition through an ordinary reviewed change; never merge current defaults into historical props |
| Disclosure semantics drift from visibility | `aria-expanded` remains present after panel movement, deletion, inversion, reconnection, unresolved references, or independent hiding | Use registry-declared state/content references plus one read-only effective-invariant evaluator; test every supported edit path and prohibit render-time mutation | Omit effective semantics and withhold the Disclosure library entry until the relationship and recovery path pass review |
| Nested state is hard to author | Layers selection, movement, or Inspector recovery is confusing | Browser-test Layers and State tab behavior before adding more blocks | Retain foundation behind tests but withhold state-powered library entries |
| Library family regression | Existing entries disappear, reorder, or require category-name branching | Put family/search metadata in the validated block registry and add exact discovery regression coverage | Isolate or revert the Interactive metadata without removing connected-template support |
| Added validation slows large block insertion | Largest current block shows material command latency regression | Measure focused insertion cost and avoid repeated full-tree scans | Optimize the compiler before rollout; do not weaken validation to meet latency |
| Scope expands into dismissal/modal/menu lifecycle | Implementation begins adding self-unmounting dismissal, focus restoration, focus traps, portals, outside click, or Escape coordination | Enforce exclusions and open a separately reviewed plan | Stop at the last passing connected-block milestone |

No destructive Git rollback is authorized. If a gate fails, stop at the last passing milestone, preserve the working tree, update the execution journal, and request direction when recovery changes scope or architecture.

## Delivery sequence and review boundaries

Use three reviewable implementation slices:

1. **Compiler foundation:** CSB-01 through CSB-05. No new Component Library entry is exposed until independence and atomicity pass.
2. **Accessible first adopter:** CSB-06 and CSB-07. Ship or review Disclosure only after the Button migration and accessibility gate pass together.
3. **Performance and rollout:** CSB-08 through CSB-10. Apply the accepted performance threshold, complete the named regression/browser/accessibility matrix, then document verified behavior.

Each slice should remain independently testable. Do not merge a partially wired block or expose a library entry that depends on an unverified later slice.

## Completion

The effort is complete only when:

- CSB-01 through CSB-10 are complete with recorded evidence.
- Existing unconnected blocks remain compatible.
- Connected insertion is atomic and no symbolic metadata persists.
- Two inserted or duplicated blocks operate on independent internal state.
- Disclosure meets its persisted-configuration, effective-semantics, behavior, and accessibility gates; every invalid relationship omits false `aria-expanded` without render-time mutation.
- Project schema remains 3 or any discovered need to change it has a separately reviewed migration decision.
- The full verification matrix passes under the declared Node 24 engine.
- Browser QA covers Editor and Preview in the named Chrome/Firefox, viewport, zoom, keyboard, and NVDA matrix.
- Durable architecture, usage guidance, implementation report, workspace state, and branch journal are synchronized with verified implementation.
- Suraj, as Accountable Owner, reviews the verified implementation outcome and decides completion, promotion, and archival after CSB-10.

The historical [release-exception review](../review/connected-state-blocks-release-exception-review.md) is an explicit deviation from the original full-matrix completion criteria. The [verification closure review](../review/connected-state-blocks-verification-closure-review.md) records the later passing evidence, Suraj's report approval, CSB-10 closure, and NVDA/Firefox as the sole remaining exception without converting any other unexecuted case into passing evidence. The documented implementation effort is complete; commit, push, pull-request, merge, deployment, and archival remain separate actions.

After completion, keep Dismissible Announcement, Dropdown, menu, Drawer/modal, full Accordion, Tabs, transitions, variants, conditional styling, and user-authored templates outside this plan. Archive the delivery artifacts only through the workspace completion process after verified durable findings are promoted.

## CSB-09 readiness assessment

**Assessment: Closed by accountable exception.**

The declared Node 24 typecheck and full ESLint pass. After current-main integration and PR-review remediation, the serialized suite passes all 669 tests across 48 files in 285.05 seconds. The optimized production build passes in 24.07 seconds, reports ready in 217 ms, and serves `/` with HTTP 200. Chrome 151.0.7922.138 retains the earlier desktop/responsive evidence, while a fresh Playwright 1.62.1 headless Firefox 153.0 run passes the 1440 x 900 Editor-load, Disclosure insertion, pointer interaction, `aria-expanded`, console, overflow, geometry, and visual smoke checks. The [PR-review remediation review](../review/connected-state-blocks-pr-review-remediation-review.md) awaits owner/PR re-review and does not alter Suraj's historical approval. NVDA/Firefox remains the sole documented exception; unexecuted true-browser-zoom, Firefox responsive, and Firefox keyboard cases remain outside the approved delivery scope and are not passes.

## Gate 1 readiness assessment

**Assessment: Ready.**

Gate 1 is approved for CSB-01 without an architecture or scope change. The plan freezes the local-key contract, records eight accepted architecture decisions, maps every Q2 finding to implementation and verification evidence, makes the six-part Disclosure invariant explicit, prohibits render-time mutation, and uses one consistent branch, workspace, review set, and artifact location.

Later delivery conditions remain pending and are not Gate 1 blockers:

- CSB-01 through CSB-10 remain complete; the source is committed through `40de821`, and the PR-review remediation record awaits owner/PR re-review.
- The refreshed CSB-08 Node 24.19.0 benchmark passes with portable raw-sample evidence. The +3.25% median and -4.95% p95 legacy-template regressions remain below the accepted 10% threshold.
- The post-merge Node 24 release suite passes with 669 of 669 tests, and the fresh production build/startup check passes. The earlier Chrome evidence and fresh Firefox 153.0 desktop Disclosure smoke pass within their recorded scope. NVDA/Firefox is the sole remaining documented exception. Unexecuted true-browser-zoom, Firefox responsive, and Firefox keyboard cases are outside the approved delivery scope and are not represented as passed.
- No implementation finding may be marked verified merely because its Gate 1 design disposition is accepted.

Gate 1 remains approved under the same architecture and scope. The completed CSB-10 documentation and verification closure do not expand feature scope or change the meaning of retained evidence.
