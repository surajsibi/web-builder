---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-CODE-REVIEW-2026-08-14
type: Q2
scope: Final pre-push code review and remediation verification of local project persistence, recovery UI, dashboard behavior, and save-state accessibility on web-builder feature/project-dashboard
authority: Verified implementation owns current behavior; this review owns the six scoped findings, their remediation evidence, and their final pre-push disposition
owner: Project owner
lifecycle: in_review
freshness: Re-reviewed and remediated on 2026-08-18 in the local feature-branch state following commit c4b9412ba5dab5546e75c2c6cf8b6b8a209aa2eb through pre-fix rendered reproduction, three fail-before/pass-after production-component cases, all 69 affected tests, the complete 559-test run, ESLint, normal typechecking, diff checks, live port-3000 compilation checks, and a successful optimized production build; all six scoped findings are closed; invalidated by changes to the cited persistence, dashboard, editor-boundary, toolbar, CSS, regression-test, or runtime files
---

# Code review: project dashboard persistence, recovery, and accessibility

The initial review identified two high-severity data-integrity risks, one
medium-severity dashboard scalability problem, and one low-severity
keyboard-accessibility problem. The project owner approved that four-finding
remediation scope on 2026-08-15, and all four findings remain closed.

The final pre-push review on 2026-08-18 identified two additional
medium-severity UI and accessibility defects. The direct-route storage retry
action lost its intended foreground and background styling outside the
dashboard CSS-variable scope, and the real editor toolbar did not render
save-failure or conflict guidance as visible content. Both findings are now
remediated and verified in the local feature branch; all six scoped findings are
closed.

## Question, scope, and baseline

This review explains the four findings first identified in the local-first
project dashboard at commit
`4320c81bf8e284f80a69708b93f02afda823ffa5`, records their remediation in
`c4b9412ba5dab5546e75c2c6cf8b6b8a209aa2eb`, and records two additional
findings from the final pre-push review of that checkpoint and their remediation
in the current feature-branch checkpoint.

The reviewed paths are:

- [`use-project-autosave.ts`](../../../src/builder/persistence/use-project-autosave.ts)
- [`project-editor-loader.tsx`](../../../src/builder/persistence/project-editor-loader.tsx)
- [`project-repository.ts`](../../../src/builder/persistence/project-repository.ts)
- [`indexeddb-project-repository.ts`](../../../src/builder/persistence/indexeddb-project-repository.ts)
- [`project-dashboard.tsx`](../../../src/builder/dashboard/project-dashboard.tsx)
- [`editor-toolbar.tsx`](../../../src/builder/ui/editor-toolbar.tsx)
- [`globals.css`](../../../src/app/globals.css)
- [`project-dashboard-theme.css`](../../../src/app/project-dashboard-theme.css)
- [`use-project-autosave.spec.tsx`](../../../src/builder/persistence/__tests__/use-project-autosave.spec.tsx)
- [`project-editor-loader.spec.tsx`](../../../src/builder/persistence/__tests__/project-editor-loader.spec.tsx)
- [`editor-shell.spec.tsx`](../../../src/builder/ui/__tests__/editor-shell.spec.tsx)
- [`project-repository.spec.ts`](../../../src/builder/persistence/__tests__/project-repository.spec.ts)
- [`indexeddb-project-repository.spec.ts`](../../../src/builder/persistence/__tests__/indexeddb-project-repository.spec.ts)
- [`project-dashboard.spec.tsx`](../../../src/builder/dashboard/__tests__/project-dashboard.spec.tsx)

The original findings were based on static code-flow inspection. Each failure
case was then represented by a behavior-first regression test that failed
before its remediation and passed afterward.

## Criteria and method

The review traces each user action through navigation, autosave, repository,
pagination, focus management, error presentation, and the CSS cascade. Findings
are ranked by likely impact: possible loss or misdirection of project data is
High; an unavailable or undiscoverable recovery action or error instruction is
Medium; loss of dashboard access at a scale boundary is Medium; and recoverable
keyboard-focus loss is Low.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-R01 | A pending 750 ms autosave was cancelled when the editor unmounted, while only the toolbar dashboard action awaited `saveNow()`. | High | Browser Back could discard the latest edit. | Flush pending dirty state when the autosave controller unmounts. | Project owner | Edit and unmount before 750 ms; repository reload contains the edit. | Remediated and verified |
| PD-R02 | `prepareStoredProject()` accepted a valid document without comparing its embedded `projectId` with the storage key. | High | A mismatched record could load or save under another project's identity. | Treat key/ID mismatches as unavailable, read-only recovery records. | Project owner | Memory and IndexedDB list, load, save, rename, and duplicate paths reject a record stored under A whose document identifies as B. | Remediated and verified |
| PD-R03 | Both dashboard loads requested 100 items and ignored `nextCursor`; search filtered only the returned array. | Medium | Projects after the first 100 remained stored but could not be reached through the dashboard. | Consume every repository cursor before applying client-side search. | Project owner | With 101 projects, the count, buried project, and search result are reachable. | Remediated and verified |
| PD-R04 | Successful rename closed the dialog with `setNameDialog(null)` instead of the focus-restoring path. | Low | Keyboard and screen-reader users could lose their place after renaming. | Refresh without removing the initiating card, then close through the focus-restoring path. | Project owner | After a successful keyboard rename, focus returns to the initiating control. | Remediated and verified |
| PD-R05 | The direct-route error boundary reused `.dashboard-button.primary`, but `--dashboard-ink` and `--dashboard-line` were declared only on `.project-dashboard`. | Medium | The **Try again** action on storage and unexpected load failures had white text without its intended dark background, making the primary recovery action visually unavailable on the white card. | Define the shared button variables on a common ancestor or give the editor boundary self-contained button styles. | Project owner | Render a storage-error route and verify visible, enabled, focus-ordered **Try again** and **Return to Projects** actions with the intended computed tokens. | Remediated and verified |
| PD-R06 | The editor toolbar rendered only the generic save-state label; `persistenceMessage` existed only as `aria-label` and `title` on a non-focusable `div`. The autosave test harness rendered the message in a separate paragraph and therefore did not test the production presentation. | Medium | Sighted keyboard and touch users could not discover why saving failed or how to recover from a conflict; the conflict state also disabled **Save now** without exposing the reload/return guidance visibly. | Render actionable save-error and conflict guidance as visible status content or through a keyboard-operable disclosure, and exercise the production toolbar in the failure tests. | Project owner | Force storage-error and revision-conflict states in the production editor shell and verify visible full guidance, polite atomic announcement semantics, and usable recovery actions. | Remediated and verified |

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

### PD-R05 - Direct-route retry styling loses its CSS variables

The dashboard theme variables are declared on `.project-dashboard`. The
project editor's loading and failure boundary is a separate root and does not
inherit those variables, but its **Try again** and **Return to Projects**
actions reuse the dashboard button classes. The primary rule therefore loses
its `background: var(--dashboard-ink)` declaration while retaining white text.
The result is a primary retry label without a visible resting background on the
white boundary card. The secondary action also loses its intended border and
explicit text color, although its inherited text remains readable.

Evidence: [`project-editor-loader.tsx`](../../../src/builder/persistence/project-editor-loader.tsx)
and [`globals.css`](../../../src/app/globals.css).

Required remediation: make the shared button tokens available to both roots or
give the editor boundary self-contained styles, then add a rendered failure
state check that covers the computed presentation rather than class names
alone.

Remediation: the shared button tokens now live in
[`project-dashboard-theme.css`](../../../src/app/project-dashboard-theme.css),
which the root layout loads for both `.project-dashboard` and
`.project-editor-boundary`. The production loader test forces a
`storage-unavailable` repository failure, verifies both recovery actions are
visible and enabled, confirms the boundary computes the intended ink and line
tokens, tabs through the actions in order, and dispatches a retry.

### PD-R06 - Save recovery guidance is not visibly or operably exposed

Autosave produces specific recovery guidance for storage failures and revision
conflicts. The production toolbar renders only **Save failed** or **Save
conflict**. It places the detailed message in `aria-label` and `title` on a
non-focusable status `div`, so sighted keyboard and touch users have no reliable
way to discover it. In the conflict state, **Save now** is disabled, making the
missing reload-or-return instruction especially consequential.

The autosave tests do not exercise this production boundary: their test harness
renders `persistenceMessage` directly in a paragraph. This verifies controller
output but not the user-facing toolbar behavior.

Evidence: [`editor-toolbar.tsx`](../../../src/builder/ui/editor-toolbar.tsx)
and [`use-project-autosave.spec.tsx`](../../../src/builder/persistence/__tests__/use-project-autosave.spec.tsx).

Required remediation: render or disclose the full guidance through a visible,
keyboard-operable status treatment and add editor-level tests for storage-error
and conflict recovery.

Remediation: the production toolbar now renders the full
`persistenceMessage` as visible status content instead of confining it to a
tooltip and accessible label. The message shares a polite, atomic live region
with the short state label. Editor-shell tests verify that a storage failure
shows the full instruction and leaves **Save now** enabled, while a revision
conflict shows the full reload-or-return instruction, keeps **Save now**
disabled, and leaves **Return to Projects** operable.

### Rendered browser follow-up - 2026-08-18

A controlled Chrome pass supplied rendered evidence without changing source
code or altering browser storage outside user-facing application actions.

- A clean temporary production server at the reviewed checkpoint passed project
  create/open, debounced autosave, reload persistence, manual save, immediate
  Browser Back persistence, keyboard rename with focus restoration, whole-project
  duplicate-content preservation, and editor viewport switching. The production
  tabs reported no console warnings or errors.
- PD-R06 reproduced with two tabs loaded at the same project revision. After
  the first tab saved, the second displayed only **Save conflict**, disabled
  **Save now**, and exposed the full instructionâ€”**This project changed in
  another editor. Reload it or return to Projects before making more
  changes.**â€”only through `aria-label` and `title`. The instruction was absent
  from visible page text, and the containing `div` had no role or tab stop.
- PD-R05's shared-token defect reproduced in the missing-project boundary.
  Computed `--dashboard-ink` and `--dashboard-line` values were empty on
  `.project-editor-boundary`, and the secondary action resolved to a
  current-color border instead of the intended dashboard line token. The exact
  storage-error **Try again** rendering was not forced because doing so would
  require changing browser storage permissions or stored data outside the
  product UI; its transparent-background/white-text outcome remains supported
  by the same missing-token cascade and source inspection.

The initial port-3000 session could not supply editor evidence: `/preview` and
`/projects/<projectId>` both returned 404. Two pre-existing Next listeners were
active on ports 3000 and 3001, and the workspace
`.next/dev/server/app-paths-manifest.json` contained only `/page` and
`/_not-found/page` even though route-specific compiled manifests existed. The
same checkpoint served the dynamic route correctly from the production build,
evidence consistent with a development-runtime/cache collision and verification
blocker rather than an additional branch-code finding. The pre-existing servers
were left untouched.

The user then confirmed that the same project directory was also running on
port 3001 and closed that extra server. With only port 3000 listening, `/`,
`/preview`, and the tested dynamic project route returned 200. Controlled Chrome
reloaded the editor, returned to the dashboard, and reopened the project with
**Saved locally** visible. This confirms the initial 404 was a same-worktree dev
cache collision and resolves that verification blocker; it is not a seventh
code-review finding.

### Post-remediation closure - 2026-08-18

Three production-component regression cases failed before the PD-R05 and
PD-R06 changes: the editor boundary had no computed dashboard tokens, and the
storage-failure and conflict instructions were absent from visible toolbar
text. After remediation:

- The loader and editor-shell suites pass 69 of 69 tests, including computed
  boundary tokens, keyboard-ordered retry actions, visible storage-failure and
  conflict guidance, manual storage retry, conflict save lockout, and dashboard
  recovery.
- The complete suite passes 41 files and 559 tests with the temporary
  15-second per-test ceiling. Repository-wide ESLint, normal `pnpm typecheck`,
  and `git diff --check` pass under Node 22.21.1.
- The active port-3000 dev server returns 200 for `/`, `/preview`, and
  `/projects/qa-missing-boundary`. Its emitted stylesheet includes the shared
  `.project-editor-boundary` tokens, confirming the new root CSS import compiles
  into the served application.
- After the user stopped the dev server, `pnpm build` compiled the remediated
  working tree, completed TypeScript and static generation, and emitted all
  expected static and dynamic routes.

A final post-remediation visual replay could not run because the installed
Browser plugin package is missing its required `scripts/browser-client.mjs`
runtime file. The skill prohibits substituting a different automation surface.
This leaves a supported-browser visual smoke as follow-up evidence, but it does
not reopen either finding: both production boundaries and their recovery
behavior are covered directly by fail-before/pass-after tests, and the live
server compiles the changed CSS and routes.

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

The project owner approved remediation of PD-R01 through PD-R04 on 2026-08-15,
and those findings remain closed. The user approved proceeding with PD-R05 and
PD-R06 remediation on 2026-08-18; both production-boundary closure suites now
pass, so all six findings are closed and the finding-based publication hold is
cleared. This review does not authorize a push, merge, deployment, backend
expansion, or deletion capability.

Closure verification passes the 2 affected files and all 69 tests,
repository-wide ESLint, normal `pnpm typecheck`, `git diff --check`, the
complete 41-file, 559-test suite with the temporary 15-second ceiling, and the
optimized production build. The earlier port-3000 server also compiled and
served the changed routes and shared CSS. All current verification ran on Node
22.21.1, and the repository-required Node 24.19.x matrix remains outstanding.

The owner should review the remediated diff before deciding whether to push.
Run the complete verification matrix under Node 24.19.x when available, and
repeat the two remediated states visually when the Browser plugin runtime is
repaired.

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
revision conflicts still refuse the write. Complete the Node 24 verification
matrix and post-remediation browser smoke before publication, and re-review the
six findings if the cited implementation or regression tests change.
