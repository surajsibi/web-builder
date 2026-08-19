---
doc_id: WEB-BUILDER-CONNECTED-STATE-BLOCKS-PLAN-REVIEW
type: Q2
scope: Architecture, accessibility, implementation-readiness, and documentation review of the Connected State Blocks execution plan on feat/connected-state-blocks at c032701e52c5c8046a32d9365b8f5782fb75bbc6
authority: Approved scoped assessment and Gate 1 disposition record; the reviewed plan owns approved execution intent, Project.md owns durable architecture, and code, schemas, tests, and verified runtime behavior own implementation truth
owner: Suraj
lifecycle: approved
freshness: Gate 1 approved by Suraj on 2026-08-18 for feat/connected-state-blocks at c032701e52c5c8046a32d9365b8f5782fb75bbc6; supersede this review rather than editing its accepted meaning if the plan, architecture contract, branch, ownership, or approval changes
risk: R2 because the reviewed work changes persisted Button props, component migration behavior, interaction semantics, and accessibility output
---

# Architecture and accessibility review: Connected State Blocks plan

## Question, scope, and baseline

Determine whether the [Connected State Blocks implementation plan](../plan/Connected-State-Blocks-Implementation-Plan.md) is correct, sufficiently bounded, and ready for implementation.

The review covers:

- connected block-template compilation and template-local relationships;
- atomic block insertion and command-result contracts;
- nested Boolean State ownership and duplication;
- Disclosure behavior and the original Dismissible announcement proposal now deferred by the revised draft;
- Button migration and accessibility semantics;
- Component Library family and search metadata;
- execution gates, verification, and documentation placement.

The baseline is `feat/connected-state-blocks` at `c032701e52c5c8046a32d9365b8f5782fb75bbc6`, as recorded by the [feature workspace](../workspace.md) and [branch workspace](../../../branches/web-builder/feat-connected-state-blocks/README.md). No feature implementation exists. This review did not execute runtime, browser, assistive-technology, performance, migration, or test-suite verification.

## Criteria and method

The review compared the plan and its [supporting research](../research/connected-block-template-analysis.md) against:

- the maintained architecture in [`Project.md`](../../../Project.md);
- the current block resolver, command executor, command-result types, Button schema and renderer, Boolean runtime, reference remapping, and Component Library implementation;
- the [W3C Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and, where the product intends alert semantics, the [W3C Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/);
- the workspace documentation standard and Q2 review requirements.

Claims are classified as verified source observations or review recommendations. Suraj accepted the Gate 1 design dispositions on 2026-08-18 under the confirmed four-role overlap. Findings that require implementation evidence remain pending at their named CSB work items.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSB-R-01 | The original plan excluded focus restoration, but the Dismiss Button turned Off the state that controlled its containing root. Preview would unmount the focused Button with no defined focus destination while requiring focus to remain “predictable.” The revised draft removes the Dismissible announcement from scope. | High | Keyboard and assistive-technology users could lose their location after dismissal, and the original accessibility gate had no objective expected result. | Keep the Dismissible announcement deferred until a separate plan names the post-dismissal focus destination, keyboard behavior, and accountable accessibility review. | Suraj — Accountable Owner and Accessibility Verifier | Re-review confirms the revised research, scope, ordered work, tests, gates, and completion criteria contain no self-unmounting dismissal behavior and preserve it as a separately gated follow-up. | Resolved for this plan by accepted scope exclusion |
| CSB-R-02 | The original `stateAccessibility: "disclosure"` proposal related the Button only to a Boolean State while the controlled panel could be inverted, reconnected, moved, deleted, or independently hidden. The revised draft adds a registry-declared controlled-content reference and separates persisted configuration from effective semantics. | High | A shipped block may start valid but become semantically false through ordinary supported editing unless every render evaluates the complete Button/state/panel relationship. | Require direct incompatible Button edits to clear persisted Disclosure configuration atomically. Panel/tree changes must preserve recoverable references where appropriate, disable effective semantics, omit `aria-expanded`, and show a specific Inspector warning without render-time document mutation. | Suraj — Accountable Owner, Technical Verifier, and Accessibility Verifier | Re-review confirms the complete invariant and behavior-first tests cover direct Button edits, panel movement/inversion/reconnection/deletion, independent hiding, unresolved references, repair, Undo/Redo, and proof that rendering never mutates the document. | Design accepted; CSB-01/06/07/09 implementation and accessibility evidence pending |
| CSB-R-03 | The original plan proposed `keyedNodeIds` even though [`Project.md`](../../../Project.md) and the exported command type limit `block.insert` results to existing public fields. This is an unapproved command-contract expansion, not inherently an implementation error. | Medium | Adding the field without consumers or architecture approval would couple public command results and tests to otherwise private template aliases. | Omit `keyedNodeIds` and every equivalent result expansion from this plan; verify relationships through materialized nodes plus existing `nodeIds`. | Suraj — Accountable Owner and Technical Verifier | Re-review confirms the existing command value remains unchanged and the plan contains no result-contract expansion. | Contract accepted; CSB-01/04 compatibility evidence pending |
| CSB-R-04 | The original research stated that `stateAction: "toggle"` with an empty `targetStateNodeId` failed the strict Button schema. Current [`buttonPropsSchema`](../../../src/builder/registry/components/component-definitions.tsx) rejects only a non-empty target when the action is `none`, and [`nodeReferenceIdSchema`](../../../src/builder/registry/components/reference-schemas.ts) permits an empty string. The revised research corrects the claim. | Medium | The original two-phase justification could have created an unnecessary synthetic-placeholder contract. | Justify two-phase resolution through symbolic relationship collection, real-ID materialization, and final validation. Introduce no fake node ID; a future non-empty schema constraint requires a separately approved symbolic-aware template validator. | Suraj — Technical Verifier | Re-review confirms the false behavior claim is absent, the existing schema behavior is documented, and no placeholder contract is introduced. | Contract accepted; CSB-03/04 implementation evidence pending |
| CSB-R-05 | The original plan required an Interactive family and block search terms without adding an authority to current [`BlockDefinition`](../../../src/builder/registry/define-block-registry.ts); [`component-library.tsx`](../../../src/builder/ui/component-library.tsx) currently infers structural-block families from category strings. The revised draft proposes validated registry-owned metadata. | Medium | Without one authority, implementation could add more UI-specific category branching or duplicate block discovery metadata. | Add one explicit block-library family/search contract to the block registry, cover it in CSB-02 and registry validation, and remove category-name classification from the UI. | Suraj — Accountable Owner and Technical Verifier | Re-review confirms Disclosure and every existing block receive family/search behavior from one validated metadata authority without category-name special cases. | Contract accepted; CSB-02/07 implementation evidence pending |
| CSB-R-06 | The original plan left the implementation branch unresolved and sent this feature's tutorial and D5 report to a different feature workspace. The revised draft identifies `feat/connected-state-blocks` and uses `workspaces/components/`. | Medium | Stale execution metadata could send durable artifacts to the wrong feature authority or repeat obsolete branch work. | Keep the refreshed manifest, baseline, branch journal link, and components workspace destinations consistent through re-review. | Suraj — Accountable Owner | All branch and artifact-location statements match the feature and branch workspaces, and local documentation links pass. | Resolved; documentation audit passed and accepted |
| CSB-R-07 | The original performance gate used an “agreed regression threshold,” while viewport, zoom, browser, and assistive-technology coverage were unnamed. Accessibility inputs are design prerequisites; the numeric performance decision is a later delivery gate. | Medium | Accessibility implementation could begin without objective semantics evidence, while CSB-08/09 could reach release without an objective performance decision. | Set and accept the browser/viewport/zoom/keyboard/assistive-technology matrix before revised CSB-06/07. Define the benchmark method and decision owner beforehand; the numeric threshold may remain open until revised CSB-08, where it becomes blocking. Record exact runtime/tool versions only after execution. | Suraj — Technical Verifier, Accessibility Verifier, and Performance Owner | Re-review confirms named accessibility inputs and expected outcomes precede semantic implementation, while the benchmark method/owner is fixed and a numeric threshold is required before the performance gate passes. | Contract and timing accepted; CSB-06/08/09 execution evidence pending |
| CSB-R-08 | Verified source inspection shows `dryRunEditorCommand` returns valid for `block.insert` before ID reservation and final materialization. No connected-template dry-run/apply failure has been demonstrated because implementation does not exist; this is an architectural risk. | Medium | Without an explicit contract, drag-and-drop could advertise a valid destination that deterministic apply-time validation later rejects. | Add dry-run/apply contract tests to CSB-04, keep deterministic materialization-independent failures in registry resolution, and document bounded ID exhaustion/collision as the permitted apply-only failure. | Suraj — Accountable Owner and Technical Verifier | Connected block dry-run and apply agree for every deterministic validation failure; generated-ID exhaustion/collision is the only documented apply-only failure. | Contract accepted; CSB-01/04 implementation evidence pending |

## Closure traceability audit

The plan's [review finding closure mapping](../plan/Connected-State-Blocks-Implementation-Plan.md#review-finding-closure-mapping) now gives every finding a plan section, implementation path, verification step, and required closure evidence. This review remains the authority for status.

| Review finding | Resolving plan contract | Verification path | Closure evidence state |
| --- | --- | --- | --- |
| CSB-R-01 | Exclusions and G1-D05 | Gate 1 scope audit and CSB-10 documentation audit | Accepted and resolved for this plan by scope exclusion |
| CSB-R-02 | Six-part Disclosure invariant and G1-D08 | CSB-01, CSB-06, CSB-07, and CSB-09 | Design accepted; later implementation/accessibility evidence pending |
| CSB-R-03 | Unchanged command result and G1-D06 | CSB-01 and CSB-04 compatibility tests | Contract accepted; later compatibility evidence pending |
| CSB-R-04 | Symbolic validation followed by real-ID materialization | CSB-03 and CSB-04 no-placeholder tests | Contract accepted; later no-placeholder evidence pending |
| CSB-R-05 | Single `BlockDefinition.library` metadata authority and G1-D07 | CSB-02 and CSB-07 registry/UI tests | Contract accepted; later registry/UI evidence pending |
| CSB-R-06 | Canonical branch/workspace/artifact authority | Gate 1 documentation audit and CSB-10 synchronization | Resolved; documentation evidence passed and was accepted |
| CSB-R-07 | Named accessibility matrix and benchmark decision timing | Pre-CSB-06 acceptance, CSB-08 benchmark, and CSB-09 runtime matrix | Contract and timing accepted; later execution evidence pending |
| CSB-R-08 | Deterministic dry-run/apply boundary | CSB-01 and CSB-04 paired failure tests | Contract accepted; later paired-outcome evidence pending |

Suraj accepted every Gate 1 disposition. CSB-R-01 is resolved for this plan by exclusion and CSB-R-06 is resolved by the passed documentation audit. CSB-R-02 through CSB-R-05, CSB-R-07, and CSB-R-08 retain their mapped implementation evidence requirements; runtime, migration, browser, accessibility, performance, and release evidence remains pending until its named CSB step executes.

## Positive controls verified

- Connected blocks compile into ordinary nodes rather than introducing a persisted block type or second runtime store.
- Nesting template-created Boolean State inside the visual root aligns with existing subtree deletion and remap-if-target-cloned duplication behavior. The plan correctly requires tests before treating this supported inference as verified behavior.
- Adding persisted Button configuration through a deterministic component-version migration while retaining project schema version 3 matches the current schema authority boundary, subject to re-review of the new controlled-content reference and effective evaluator.
- The plan correctly distinguishes Disclosure from Accordion. The W3C Disclosure pattern requires a native Button, Enter and Space activation, and accurate `aria-expanded`; `aria-controls` is optional.
- The ordered work, compatibility coverage, rollback containment, and exclusions provide useful implementation boundaries.
- The plan correctly requires Node 24 release evidence and refuses to treat Node 22 development results as final verification.

## Decision and constraints

**Decision: Approved for CSB-01 by Suraj on 2026-08-18; implementation evidence remains pending.**

Suraj accepted the architecture without a scope change, accepted G1-D01 through G1-D08, and confirmed that one person may act as Accountable Owner, Technical Verifier, Accessibility Verifier, and Performance Owner for this Gate 1 decision. The plan freezes the local-key grammar and collision behavior, makes the six-part Disclosure invariant and non-mutation rule explicit, and traces CSB-R-01 through CSB-R-08 to implementation and verification evidence.

Gate 1 acceptance confirms:

1. Confirm Dismissible Announcement and all self-unmounting focused controls remain outside this plan.
2. Confirm the six-part Button/state/content/binding/structure/visibility invariant, direct-edit clearing behavior, non-mutating rendering, Inspector warning, and recovery evidence path.
3. Confirm `keyedNodeIds` and every equivalent command-result expansion are outside this plan.
4. Confirm the Button-schema evidence is corrected and no fake node-ID placeholder is introduced.
5. Confirm block family and search metadata have one validated registry authority.
6. Confirm the active branch and all artifact destinations point to the components workspace.
7. Confirm accessibility inputs are fixed before semantic implementation, the benchmark method and owner are fixed beforehand, the numeric threshold blocks the performance gate, and dry-run/apply expectations distinguish deterministic validation from generated-ID exhaustion.
8. Suraj is assigned to all four roles under explicitly permitted role overlap and recorded every required acceptance.

The frozen key contract is `^[a-z][a-z0-9-]{0,63}$`: 1-64 ASCII characters, no normalization, collision-safe `Map` lookup, duplicate rejection with both declaration paths, and invalid-key messages that identify the block, value, path, grammar, and bound. `nameHint` is trimmed separately and limited to 1-80 characters. Existing visibility mappings such as On → Show and Off → Show remain valid generic state bindings, but effective Disclosure semantics require exactly On → Show and Off → Hide.

## Residual risk and follow-up

Residual risk remains in two-phase compilation, string-path relationship metadata, nested nonvisual state authoring, the persisted-versus-effective semantic boundary, and the Button component migration. The plan's focused tests and three reviewable slices contain those risks only if every later evidence gate is enforced.

There are no remaining Gate 1 blockers before CSB-01. The numeric performance threshold remains a blocking CSB-08 decision, and all mapped implementation, migration, browser, accessibility, performance, and release evidence remains pending. Implementation evidence must later be recorded in a D5 report; this approved review is not proof that runtime verification occurred.
