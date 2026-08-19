---
doc_id: WEB-BUILDER-CONNECTED-STATE-BLOCKS-ACCOUNTABLE-RE-REVIEW-CHECKLIST
type: Q2
scope: Accountable contract re-review and recorded Gate 1 approval for the Connected State Blocks implementation plan
authority: Supporting sign-off worksheet only; the plan owns proposed execution, the plan review owns findings and their status, Project.md owns approved architecture, and verified code and tests own implementation truth
owner: Suraj
lifecycle: approved
freshness: Gate 1 sign-off recorded for Suraj on 2026-08-18 at feat/connected-state-blocks commit c032701e52c5c8046a32d9365b8f5782fb75bbc6; supersede this record rather than editing its accepted meaning if any reviewed contract, finding, plan, branch, ownership, or approval changes
amended_by: WEB-BUILDER-CONNECTED-STATE-BLOCKS-PR-REVIEW-REMEDIATION-REVIEW
risk: R2 because approval permits work on persisted Button configuration, interaction semantics, and accessibility output
---

# Accountable re-review checklist: Connected State Blocks

## Purpose and expected outcome

Use this worksheet to decide whether the revised [implementation plan](../plan/Connected-State-Blocks-Implementation-Plan.md) is sufficiently precise to begin CSB-01. It converts the [architecture and accessibility review](connected-state-blocks-plan-review.md) into an accountable reading, checking, and sign-off sequence.

Completing this worksheet does not prove that the feature works. No application code has changed, so application tests are not required at this checkpoint. Runtime, browser, assistive-technology, performance, and release tests remain evidence gates during CSB-01 through CSB-10.

The possible outcomes are:

- **Approved for CSB-01:** all four required roles are assigned, all four record their required acceptance, every Gate 1 decision is accepted, and the Accountable Owner records explicit approval.
- **Changes required:** one or more contracts need revision; record the requested change and keep Gate 1 blocked.
- **Not approved:** a design or ownership blocker remains; do not begin implementation.

**Recorded outcome: Approved for CSB-01 by Suraj on 2026-08-18.** Suraj accepted all four roles and explicitly confirmed that role overlap is permitted. This approval does not claim that any application implementation or later evidence gate has passed.

## Step 1: Read the review set

Read these documents in order:

- [Research: How should blocks create and connect Boolean State safely?](../research/connected-block-template-analysis.md), especially **The first block should be a Disclosure**, **Dismissible Announcement remains outside this plan**, and **Recommendation**.
- [Plan: Connected State Blocks](../plan/Connected-State-Blocks-Implementation-Plan.md), especially **Product and architecture decisions**, **Ordered work**, **Detailed verification matrix**, **Quality and approval gates**, and **Completion**.
- [Architecture and accessibility review](connected-state-blocks-plan-review.md), especially findings CSB-R-01 through CSB-R-08 and **Decision and constraints**.
- [Components workspace](../workspace.md) and [branch journal](../../../branches/web-builder/feat-connected-state-blocks/journal.md) to confirm that the milestone, branch, and resume point agree.

While reading, confirm that the documents describe the same scope: connected template infrastructure plus one Disclosure adopter. Dismissible announcement, Accordion, and other interactive blocks must remain excluded.

## Step 2: Assign accountable roles

Suraj confirmed that one person may hold all four roles for this Gate 1 decision and accepted the responsibilities below.

| Required role | Assignee | Acceptance record | Responsibility at this checkpoint |
| --- | --- | --- | --- |
| Accountable Owner | Suraj | Accepted — 2026-08-18 | Accepted every Gate 1 decision and CSB-R-01 through CSB-R-08 disposition; authorized CSB-01 |
| Technical Verifier | Suraj | Accepted — 2026-08-18 | Accepted the key, compiler, command, registry, migration, dry-run/apply, and technical evidence boundaries |
| Accessibility Verifier | Suraj | Accepted — 2026-08-18 | Accepted the Disclosure invariant, non-mutation contract, recovery behavior, and pre-CSB-06 accessibility matrix |
| Performance Owner | Suraj | Accepted — 2026-08-18 | Accepted the benchmark method and evidence format and owns the numeric threshold decision required before CSB-08 passes |

Role overlap was explicitly confirmed by Suraj in the approval exchange on 2026-08-18. The AI agent transcribed the assignment and approval; it did not fill an accountable role or independently approve Gate 1.

## Step 3: Decide the exact Gate 1 contract

The plan's [Gate 1 decision log](../plan/Connected-State-Blocks-Implementation-Plan.md#gate-1-decision-log) is the canonical contract summary. Record **Accept**, **Change required**, or **Reject** for every row below, then update the plan's acceptance state. A change request keeps Gate 1 blocked until the plan and review set are revised and re-reviewed.

| ID | Frozen decision | Accountable Owner decision | Required verifier acceptance |
| --- | --- | --- | --- |
| G1-D01 | Internal-only template keys and symbolic relationships | Accepted — Suraj | Technical Verifier Suraj: Accepted |
| G1-D02 | Two-phase symbolic validation and real-ID materialization before atomic mutation | Accepted — Suraj | Technical Verifier Suraj: Accepted |
| G1-D03 | Nested Boolean State ownership inside the visual root for V1 | Accepted — Suraj | Technical Verifier Suraj: Accepted |
| G1-D04 | Disclosure as the first and only adopter | Accepted — Suraj | Accessibility Verifier Suraj: Accepted |
| G1-D05 | No Dismissible Announcement or self-unmounting focused control in scope | Accepted — Suraj | Accessibility Verifier Suraj: Accepted |
| G1-D06 | No `keyedNodeIds` or equivalent command-result expansion | Accepted — Suraj | Technical Verifier Suraj: Accepted |
| G1-D07 | One validated `BlockDefinition.library` authority for block metadata | Accepted — Suraj | Technical Verifier Suraj: Accepted |
| G1-D08 | Persisted configuration separated from read-only effective semantics | Accepted — Suraj | Technical Verifier Suraj: Accepted; Accessibility Verifier Suraj: Accepted |

Confirm the frozen supporting bounds:

- [x] Every declared `key`, `targetKey`, and `stateKey` matches `^[a-z][a-z0-9-]{0,63}$` exactly and is 1-64 ASCII characters.
- [x] Keys are not trimmed, normalized, or case-folded; invalid authored values fail before ID allocation or document mutation.
- [x] A collision-safe `Map<string, ...>` owns key lookup; duplicates fail and identify both declaration paths.
- [x] Invalid-key messages identify block type, offending value, template path, exact grammar, and length bound.
- [x] `nameHint` is trimmed separately, contains 1-80 characters when supplied, and is uniquified for readable names during insertion.

All decision, verifier-acceptance, and supporting-bound checks were accepted by Suraj on 2026-08-18.

## Step 4: Review the Button, state, and panel invariant

### Persisted configuration

Confirm all of the following:

- [x] `stateAccessibility: "none"` requires an empty `disclosureContentNodeId` and keeps existing Button behavior.
- [x] `stateAccessibility: "disclosure"` requires an unlinked, non-submit Button, `stateAction: "toggle"`, a valid Boolean State reference, and a valid controlled-Container reference.
- [x] `disclosureContentNodeId` is a registry-declared, page-scoped, `remap-if-target-cloned` Container reference.
- [x] A direct incompatible Button edit clears `stateAccessibility` and `disclosureContentNodeId` atomically in one command and history entry.
- [x] Button version 5 migrates deterministically to version 6 with Disclosure disabled; project schema remains version 3.

### Effective semantics

Confirm that `aria-expanded` is emitted only when every condition below is true at the active page and viewport:

- [x] **Button configuration is valid:** the Button is unlinked and non-submit, has Disclosure enabled, uses Toggle, and contains both required references.
- [x] **State reference is valid:** the state reference resolves on the active page to a Boolean State.
- [x] **Controlled content reference is valid:** the content reference resolves on the same page to a Container.
- [x] **Visibility binding is valid:** the Container targets that same state with exactly `On -> Show` and `Off -> Hide`.
- [x] **Structural relationship is valid:** the Button, Boolean State, and controlled Container share the Disclosure root's direct parent and required ancestors exist.
- [x] **Effective visibility matches Disclosure state:** actual viewport visibility agrees with the live state and no independent presentation or unavailable runtime value creates a mismatch.
- [x] Rendering, hydration, and effective evaluation never mutate persisted data, repair references, dispatch commands, change document revision, or create history.

### Failure and recovery matrix

Check that each expected result is acceptable:

| Scenario | Persisted configuration | Effective result | Inspector and recovery |
| --- | --- | --- | --- |
| Valid and collapsed | Preserved | Emit `aria-expanded="false"` | No broken-relationship warning |
| Valid and expanded | Preserved | Emit `aria-expanded="true"` | No broken-relationship warning |
| Direct incompatible Button edit | Atomically clear Disclosure configuration | Omit `aria-expanded` | The deliberate edit is one Undo/Redo history entry |
| Panel moved outside the shared parent | Preserve recoverable references | Omit `aria-expanded` | Show a specific warning and an explicit repair path |
| Binding inverted or reconnected | Preserve recoverable references | Omit `aria-expanded` | Show a specific warning and reconnection or repair action |
| Panel deleted or a reference is unresolved | Preserve schema-valid recoverable references where possible | Omit `aria-expanded` | Show a warning; Undo/Redo or explicit repair restores the relationship |
| Independent hiding or unavailable runtime state | Preserve persisted configuration | Omit `aria-expanded` | Show a warning until actual visibility agrees again |
| Exact relationship repaired | Preserve or deliberately reconnect configuration | Restore truthful `aria-expanded` | Clear the broken-relationship warning |
| Render or hydration evaluation | Never rewrite configuration | Derive or omit the attribute read-only | Never mutate the document or create history |

Reject or request revision if any broken relationship can retain a potentially false `aria-expanded` value, or if rendering attempts to repair persisted data.

Checked items in Steps 3 through 5 record acceptance of the planned contract and dependency order. They do not claim that the corresponding application behavior or tests exist.

## Step 5: Check CSB-01 through CSB-10 ordering and closure

Verify the dependency chain rather than merely checking that all IDs exist:

- [x] CSB-01 freezes compatibility and adds failing behavior-first cases before contract implementation.
- [x] CSB-02 depends on CSB-01 and introduces template and block-library contracts.
- [x] CSB-03 depends on CSB-02 and performs symbolic validation without fake node IDs.
- [x] CSB-04 depends on CSB-03 and materializes IDs atomically while preserving the command result.
- [x] CSB-05 depends on CSB-04 and verifies state ownership, duplication, deletion, and Undo/Redo.
- [x] CSB-06 depends on CSB-03 **and an accessibility matrix accepted by the accessibility owner**.
- [x] CSB-07 depends on CSB-04 and CSB-06; it is the first point at which the Disclosure adopter is added.
- [x] CSB-08 depends on CSB-05 and CSB-07, and cannot pass until the performance owner accepts a numeric threshold.
- [x] CSB-09 depends on CSB-08 and runs the Node 24 release, browser, keyboard, zoom, and assistive-technology matrix.
- [x] CSB-10 depends on CSB-09 and documents only verified behavior.

Confirm that completion requires recorded evidence for all ten work items, not just merged code.

## Step 6: Decide the review-finding statuses

The accountable reviewer should verify the plan's [review finding closure mapping](../plan/Connected-State-Blocks-Implementation-Plan.md#review-finding-closure-mapping) and record the final wording in the [plan review](connected-state-blocks-plan-review.md).

| Finding | Required Gate 1 disposition boundary | Plan mapping verified |
| --- | --- | --- |
| CSB-R-01 | Resolved for this plan only by confirmed scope exclusion; no dismissal implementation is authorized | Accepted by Suraj; resolved for this plan by exclusion |
| CSB-R-02 | Design accepted only if all six invariant conditions, omission behavior, recovery, and non-mutation evidence paths are complete; implementation verification remains pending | Accepted by Suraj; CSB-01/06/07/09 evidence pending |
| CSB-R-03 | Existing command-result contract accepted with no `keyedNodeIds` expansion; CSB-01/04 evidence remains pending | Accepted by Suraj; CSB-01/04 evidence pending |
| CSB-R-04 | Corrected schema evidence and no-placeholder two-phase contract accepted; CSB-03/04 evidence remains pending | Accepted by Suraj; CSB-03/04 evidence pending |
| CSB-R-05 | Single registry metadata authority accepted; CSB-02/07 evidence remains pending | Accepted by Suraj; CSB-02/07 evidence pending |
| CSB-R-06 | Branch, workspace, review, journal, and artifact locations accepted after the documentation audit | Accepted by Suraj; documentation audit passed |
| CSB-R-07 | Accessibility inputs and benchmark ownership/timing accepted; executed CSB-06/08/09 evidence remains pending | Accepted by Suraj; CSB-06/08/09 evidence pending |
| CSB-R-08 | Dry-run/apply boundary accepted; CSB-01/04 paired outcome evidence remains pending | Accepted by Suraj; CSB-01/04 evidence pending |

These are accepted design dispositions, not claims that unexecuted implementation tests passed. Later evidence remains owned by the named CSB work items.

## Step 7: Checks and tests required now

### Required now: document and decision checks

- [x] Verify the branch is `feat/connected-state-blocks` and the baseline remains `c032701e52c5c8046a32d9365b8f5782fb75bbc6`.
- [x] Confirm the canonical feature workspace is `workspaces/components/` and the repository resume point is `branches/web-builder/feat-connected-state-blocks/journal.md`.
- [x] Record the approved lifecycle for the plan and Q2 sign-off records while keeping research and execution trackers in their existing delivery lifecycles.
- [x] Check that every relative Markdown link resolves.
- [x] Check that CSB-01 through CSB-10 each appear once in the ordered-work table and have explicit dependencies, verification, owner, and status.
- [x] Confirm the usage guide path is under `workspaces/components/notes/`, the D5 report path is under `workspaces/components/reports/`, and no artifact points to another feature workspace.

  **Amended delivery disposition (2026-08-19):** The implementation extended the pre-existing canonical [Boolean State connections and Disclosure tutorial](../../navbar/notes/Boolean-State-Connections-Tutorial.md) instead of creating a duplicate guide. The [PR-review remediation review](connected-state-blocks-pr-review-remediation-review.md) owns this explicit location correction; the checked item above remains the immutable Gate 1 expectation.
- [x] Search for stale in-scope Dismissible Announcement work, work IDs outside CSB-01 through CSB-10, synthetic node-ID placeholders, or any `keyedNodeIds` implementation path; none exist.
- [x] Record all four assignees, every Gate 1 decision, every required verifier acceptance, and the Accountable Owner's outcome.

No application test command is required now because the change set contains documentation only and explicitly states that implementation has not begun.

### Required later: implementation evidence

Do not run these as substitutes for the current owner review. Run them at their assigned CSB gate after code exists:

- Focused registry, resolver, command, store, migration, rendering, Inspector, Component Library, and interaction tests during CSB-01 through CSB-07.
- The predeclared benchmark during CSB-08: 10 warm-ups and at least 50 measured insertions, recording median and 95th percentile under the supported Node 24 runtime.
- The full release commands during CSB-09:

```powershell
pnpm typecheck
pnpm lint
pnpm test -- --maxWorkers 1 --no-file-parallelism
pnpm build
```

- Manual Editor and Preview review in stable Chrome and Firefox on Windows at 1440 x 900 and 390 x 844, at 100% and 200% zoom.
- Keyboard review of insertion, configuration, repair, Enter/Space activation, focus retention, collapse, and continued navigation.
- NVDA with Firefox review of the Button's name, role, collapsed/expanded state, state changes, omission of false `aria-expanded`, and Inspector warning discoverability.

Final release evidence must run with Node `>=24.19.0 <25`. Development results under Node 22 do not satisfy the release gate.

## Accountable sign-off

Recorded sign-off:

```text
Review date: 2026-08-18
Reviewed branch and commit: feat/connected-state-blocks at c032701e52c5c8046a32d9365b8f5782fb75bbc6

Role overlap: Permitted; Suraj explicitly confirmed one person may hold all four roles.

Accountable Owner: Suraj
Accountable Owner acceptance statement: Accepted G1-D01 through G1-D08 and the recorded CSB-R-01 through CSB-R-08 dispositions; approved CSB-01.
Technical Verifier: Suraj
Technical Verifier acceptance statement: Accepted the key, compiler, command, registry, migration, dry-run/apply, and technical evidence boundaries.
Accessibility Verifier: Suraj
Accessibility Verifier acceptance statement: Accepted the six-part Disclosure invariant, omission and non-mutation rules, recovery contract, and pre-CSB-06 accessibility matrix.
Performance Owner: Suraj
Performance Owner acceptance statement: Accepted the benchmark method and evidence format and the requirement to accept a numeric threshold before CSB-08 can pass.

G1-D01 through G1-D08: Accepted
Key grammar, collision, validation, failure-message, and nameHint bounds: Accepted
Six-part Button/state/content/binding/structure/visibility invariant: Accepted
Non-mutating rendering and recovery contract: Accepted
CSB-01 through CSB-10 dependencies and closure criteria: Accepted
CSB-R-01 through CSB-R-08 dispositions: Accepted with later implementation evidence pending where mapped

Gate 1 outcome: Approved for CSB-01
Required changes or conditions before CSB-01: None
Later gate conditions: Numeric performance threshold before CSB-08; all implementation, runtime, browser, accessibility, performance, and release evidence at its named gate.
Accountable owner approval statement: Suraj approved Gate 1 and authorized CSB-01 on 2026-08-18.
```

All four role names and acceptance statements are present, every Gate 1 decision is accepted without a required plan change, every finding disposition is recorded, and Suraj supplied the accountable approval.

The plan, plan review, components workspace, branch index, and branch journal are synchronized to this outcome. Research remains a draft delivery artifact; this approval does not promote unverified implementation behavior.
