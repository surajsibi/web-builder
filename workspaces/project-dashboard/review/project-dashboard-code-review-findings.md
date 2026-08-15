---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-CODE-REVIEW-2026-08-14
type: Q2
scope: Code review and remediation verification of local project autosave, stored-project identity validation, dashboard pagination, and rename-dialog focus on web-builder feature/project-dashboard
authority: Verified implementation owns current behavior; this review owns the four scoped findings, the approved remediation decision, and their bounded closure evidence
owner: Project owner
lifecycle: in_review
freshness: Remediation verified on 2026-08-16 in the working tree based on commit 4320c81bf8e284f80a69708b93f02afda823ffa5 through focused regression tests, repository-wide lint and typecheck, 556 tests, a production build, and controlled Chrome Back-navigation and rename-focus checks; invalidated by changes to the cited autosave, project repository, IndexedDB repository, dashboard, or regression-test files
---

# Code review: project dashboard persistence and accessibility

The review identified two high-severity data-integrity risks, one
medium-severity dashboard scalability problem, and one low-severity
keyboard-accessibility problem. The project owner approved the recommended
four-finding remediation scope on 2026-08-15. All four findings are implemented,
saved in a local feature-branch checkpoint, and pass their focused closure tests.

## Question, scope, and baseline

This review explains four findings in the local-first project dashboard on
`feature/project-dashboard` at commit
`4320c81bf8e284f80a69708b93f02afda823ffa5`, then records remediation evidence
saved in a local checkpoint based on that commit.

The reviewed paths are:

- [`use-project-autosave.ts`](../../../src/builder/persistence/use-project-autosave.ts)
- [`project-editor-loader.tsx`](../../../src/builder/persistence/project-editor-loader.tsx)
- [`project-repository.ts`](../../../src/builder/persistence/project-repository.ts)
- [`indexeddb-project-repository.ts`](../../../src/builder/persistence/indexeddb-project-repository.ts)
- [`project-dashboard.tsx`](../../../src/builder/dashboard/project-dashboard.tsx)
- [`use-project-autosave.spec.tsx`](../../../src/builder/persistence/__tests__/use-project-autosave.spec.tsx)
- [`project-repository.spec.ts`](../../../src/builder/persistence/__tests__/project-repository.spec.ts)
- [`indexeddb-project-repository.spec.ts`](../../../src/builder/persistence/__tests__/indexeddb-project-repository.spec.ts)
- [`project-dashboard.spec.tsx`](../../../src/builder/dashboard/__tests__/project-dashboard.spec.tsx)

The original findings were based on static code-flow inspection. Each failure
case was then represented by a behavior-first regression test that failed
before its remediation and passed afterward.

## Criteria and method

The review traces each user action through navigation, autosave, repository,
pagination, and focus-management code. Findings are ranked by likely impact:
possible loss or misdirection of project data is High; loss of dashboard access
at a scale boundary is Medium; and recoverable keyboard-focus loss is Low.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-R01 | A pending 750 ms autosave was cancelled when the editor unmounted, while only the toolbar dashboard action awaited `saveNow()`. | High | Browser Back could discard the latest edit. | Flush pending dirty state when the autosave controller unmounts. | Project owner | Edit and unmount before 750 ms; repository reload contains the edit. | Remediated and verified |
| PD-R02 | `prepareStoredProject()` accepted a valid document without comparing its embedded `projectId` with the storage key. | High | A mismatched record could load or save under another project's identity. | Treat key/ID mismatches as unavailable, read-only recovery records. | Project owner | Memory and IndexedDB list, load, save, rename, and duplicate paths reject a record stored under A whose document identifies as B. | Remediated and verified |
| PD-R03 | Both dashboard loads requested 100 items and ignored `nextCursor`; search filtered only the returned array. | Medium | Projects after the first 100 remained stored but could not be reached through the dashboard. | Consume every repository cursor before applying client-side search. | Project owner | With 101 projects, the count, buried project, and search result are reachable. | Remediated and verified |
| PD-R04 | Successful rename closed the dialog with `setNameDialog(null)` instead of the focus-restoring path. | Low | Keyboard and screen-reader users could lose their place after renaming. | Refresh without removing the initiating card, then close through the focus-restoring path. | Project owner | After a successful keyboard rename, focus returns to the initiating control. | Remediated and verified |

### PD-R01 — Browser Back can discard recent edits

At the reviewed commit, autosave started only after a 750 ms debounce. The
effect cleanup cleared that timer when the editor unmounted. The `beforeunload`
listener protected a full page unload, but did not cover ordinary Next.js
client-side history navigation.

The toolbar's **Projects** action is safer because `returnToDashboard()` calls
and awaits `saveNow()` before navigating. Browser Back does not go through that
handler.

Example: change a button label and press Browser Back within 750 ms. The editor
can unmount before the timer runs, leaving IndexedDB with the old label. Reopening
the project then shows the earlier value.

Evidence: [`use-project-autosave.ts`](../../../src/builder/persistence/use-project-autosave.ts)
and
[`project-editor-loader.tsx`](../../../src/builder/persistence/project-editor-loader.tsx).

Remediation: autosave cleanup now starts the existing revision-checked save when
the editor unmounts with dirty non-conflicted state. The focused test edits and
unmounts before the debounce interval, then verifies the repository contains
the edit at the next revision.

### PD-R02 — Stored keys are not validated against embedded project IDs

An IndexedDB record has an outer `storageKey` and an embedded
`document.projectId`. Normal writes make these values equal, but at the reviewed
commit hydration classified a valid document as ready without checking that
equality.

For example:

```text
storageKey: project-A
document.projectId: project-B
```

Loading by A can therefore produce a document that identifies as B. Editor
autosave uses the embedded `document.projectId`, so a later write targets B. If
B exists and its revision permits the write, the wrong record could be changed;
if B does not exist, saving can fail. Dashboard summaries can also expose the
embedded B identity for the record stored under A.

This mismatch is not expected from normal `asStoredRecord()` writes. The check
is defensive containment for corrupted, manually altered, or incorrectly
migrated browser data. A mismatch should retain the raw record but expose only a
read-only **Needs recovery** entry keyed by A.

Evidence: [`project-repository.ts`](../../../src/builder/persistence/project-repository.ts)
and
[`indexeddb-project-repository.ts`](../../../src/builder/persistence/indexeddb-project-repository.ts).

Remediation: successful hydration is no longer sufficient for readiness. The
prepared document must also identify as its physical storage key; otherwise it
becomes a bounded `invalid-project` recovery summary. Memory and IndexedDB tests
verify that list contains the record and that load, save, rename, and duplicate
cannot cross the identity boundary.

### PD-R03 — Projects after the first 100 are inaccessible

The repository contract returns `nextCursor` when more results exist. At the
reviewed commit, the dashboard's initial load and its reload after actions both
requested exactly 100 items but retained only `result.items`. Neither path
consumed `nextCursor`.

The search box then filters the in-memory `items` array. Because that array
contains at most 100 projects, search cannot find anything on a later page.
Repository ordering is newest update first, so older projects are the records
most likely to disappear from the dashboard. The records remain in IndexedDB;
the problem is dashboard reachability rather than deletion.

Evidence: [`project-dashboard.tsx`](../../../src/builder/dashboard/project-dashboard.tsx)
and
[`project-repository.ts`](../../../src/builder/persistence/project-repository.ts).

Remediation: dashboard loading now follows every `nextCursor` using the
repository's maximum page size and rejects a repeated cursor instead of
looping. Search continues to operate locally after the complete inventory is
loaded. A 101-project test verifies the total, the oldest project, and search.

### PD-R04 — Focus is lost after a successful rename

Opening a dialog records the triggering element. Cancelling calls
`closeDialog()`, which closes the dialog and restores focus to that trigger on
the next animation frame.

At the reviewed commit, a successful rename instead called
`setNameDialog(null)` directly. The dialog was removed without the explicit
restoration step, so keyboard and screen-reader users could land on the document
body and need to navigate back to the project card. This did not threaten
project data, which is why the finding was Low.

Evidence: [`project-dashboard.tsx`](../../../src/builder/dashboard/project-dashboard.tsx).

Remediation: a successful rename refreshes the inventory without removing the
project card, then closes through the shared focus-restoring path. The keyboard
test verifies that the renamed heading is visible and focus returns to the
initiating **Rename** button.

## Positive controls verified

- The toolbar's **Projects** action already waits for dirty state to save before
  navigation.
- Autosave uses optimistic revision checks and stops automatic writes after a
  conflict.
- Invalid or unsupported project documents already have a bounded, read-only
  recovery presentation.
- The repository contract already defines cursor pagination and repository-side
  query input.
- Dialog cancellation already implements trigger-focus restoration that can be
  reused for successful rename.

## Decision and constraints

The project owner approved remediation of all four findings on 2026-08-15. The
implementation remains local in the feature-branch checkpoint; this decision
does not authorize a push, merge, deployment, backend expansion, or deletion
capability.

Focused verification passes 4 files and 23 tests. Repository-wide lint and
typecheck pass, the complete suite passes 41 files and 556 tests with the
temporary 15-second ceiling, and the production build succeeds on Node
22.21.1. The repository-required Node 24.19.x run remains outstanding.

## Residual risk and follow-up

Controlled Chrome verification on 2026-08-16 created a browser-local QA project,
persisted an added Heading, added another Heading and issued Browser Back on the
next interaction without an explicit delay, then reopened the project and found
both Headings. The same run filled the rename field, submitted it with Enter,
displayed the new project name, and found the initiating **Rename** button as
`document.activeElement`. This closes the two rendered remediation follow-up
items. The retained QA project remains local to that Chrome profile.

An unmount-triggered save continues asynchronously after the editor leaves the
screen; if browser storage then fails, the departed editor cannot present that
failure. Hard unloads still receive the existing unsaved-change warning, and
revision conflicts still refuse the write. Re-review the four findings if the
cited implementation or regression tests change.
