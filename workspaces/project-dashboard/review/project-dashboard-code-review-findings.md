---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-CODE-REVIEW-2026-08-14
type: Q2
scope: Final pre-push code review and remediation verification of local project persistence, recovery UI, dashboard behavior, and save-state accessibility on web-builder feature/project-dashboard
authority: Verified implementation owns current behavior; this review owns the twelve scoped findings, their remediation evidence, and their pull-request disposition
owner: Project owner
lifecycle: in_review
freshness: Re-reviewed and locally remediated on 2026-08-18 at published head 61641d35084c3941f7f5ec0b6b5968c74d5d9d60 plus the current working-tree changes through two additional fail-before/pass-after cases, all 27 focused tests, the complete 567-test run, repository-wide ESLint, normal typechecking, diff checks, and a successful optimized production build; all twelve scoped findings are closed locally, while the latest two code fixes require publication and a fresh required-runtime run; invalidated by changes to the cited persistence, dashboard, editor-boundary, toolbar, CSS, regression-test, runtime, branch publication, or review disposition
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
remediated and verified in the local feature branch.

The pull-request review then identified three additional medium-severity
correctness and interaction defects: non-string IndexedDB keys were coerced,
offset pagination could mix changing inventories, and Escape dismissed pending
create or rename dialogs. All three are published at `61641d3` and passed the
required Node 24.19 CI job.

The follow-up review identified two more medium-severity defects and one
low-severity publication-record defect. Generated recovery identities could
collide with literal string keys, pending dialogs allowed keyboard focus to
escape, and maintained records still described the published remediation as
local. All three are now remediated in the current working tree; all twelve
scoped findings are closed locally.

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
| PD-R07 | IndexedDB listing coerced every `IDBValidKey` with `String(cursor.primaryKey)`. | Medium | A numeric key `1` could be listed as ready for document ID `"1"` even though string-key operations target a different record or return not-found; numeric/string collisions also produced duplicate UI identities. | Require a string physical key before readiness and preserve every other key type as unavailable. | Project owner | Numeric-only and colliding numeric/string records remain distinct; only the string record loads or mutates. | Remediated, published, and Node 24 verified |
| PD-R08 | Every page rebuilt and sorted the complete inventory, while the cursor contained only an offset. | Medium | A save or create between page requests could omit one project and duplicate another. | Bind cursors to an exact inventory snapshot and restart bounded dashboard enumeration when the snapshot changes. | Project owner | A 101-project scan mutated after page one returns all 101 unique IDs and includes the updated project. | Remediated, published, and Node 24 verified |
| PD-R09 | Escape always closed the create or rename dialog even while its controls were disabled for a pending mutation. | Medium | Completion could navigate after an apparently dismissed create, while failure guidance could be written into a closed dialog. | Ignore Escape while pending and keep completion effects attached to the visible dialog. | Project owner | Deferred create success and rename failure both keep the dialog open after Escape until their visible completion state. | Remediated, published, and Node 24 verified |
| PD-R10 | Only non-string IndexedDB keys received a type-tagged recovery identity. | Medium | Numeric key `1` collided with an unavailable literal string key `"indexeddb-key:number:1"`, causing dashboard duplicate detection to hide the complete inventory. | Encode every unavailable physical key, including strings, through the same typed identity scheme. | Project owner | Numeric and adversarial literal-string records both remain unavailable with distinct recovery IDs. | Remediated and verified locally |
| PD-R11 | Pending name dialogs disabled every input and button, leaving no focusable target for the focus trap. | Medium | Tab could move focus into the non-inert dashboard, allowing another action while the unresolved mutation later navigated or updated dialog state. | Keep a semantically disabled pending target focusable, move focus to it, trap Tab and Shift+Tab, and guard repeat submission. | Project owner | Pending create focus remains on the modal target in both Tab directions and Enter does not resubmit. | Remediated and verified locally |
| PD-R12 | Maintained records and the pull-request description still treated PD-R07 through PD-R09 as local and cited `a6a7b78`. | Low | Reviewers received an incorrect publication and required-runtime status after `61641d3` passed CI. | Correct the existing authorities and PR description to the actual published head, finding count, test count, and CI job. | Project owner | Records distinguish published `61641d3` from the later local fixes and link its successful Node 24.19 job. | Remediated and verified locally |

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

### PD-R07 - Non-string IndexedDB keys are coerced into project identities

IndexedDB distinguishes numeric and string keys, but listing converted every
physical key to a string before checking it against the embedded project ID.
A valid document stored under numeric key `1` with project ID `"1"` therefore
appeared ready even though `load("1")` queried the distinct string key.

Remediation: listing now requires the physical key itself to be a string.
Numbers, dates, binary keys, and arrays receive a stable type-tagged recovery
identity and remain read-only **Needs recovery** records without changing the
raw IndexedDB value. Ready and unavailable React keys are also namespace-tagged.

### PD-R08 - Offset cursors mix inventories when ordering changes

The repository rebuilt and sorted all summaries for every request but encoded
only the numeric offset in `nextCursor`. If a later project was saved between
pages and moved ahead of the offset, the next slice could repeat a previously
returned project and omit the updated one.

Remediation: each repository instance retains an exact canonical signature for
at most 16 active pagination snapshots. A later page must match that signature;
otherwise it returns the stable `inventory-changed` result. The dashboard
discards partial results and restarts from page one, with duplicate-item
detection and a three-attempt bound to prevent livelock.

### PD-R09 - Escape dismisses pending create and rename mutations

Dialog buttons and input were disabled while pending, but the document-level
Escape listener still called the close path. The already-running promise then
continued with navigation or an invisible error update.

Remediation: the shared dialog hook now accepts whether dismissal is allowed.
Name dialogs disable Escape dismissal while their mutation is pending; recovery
dialogs and idle name dialogs retain normal Escape behavior. Deferred success
and failure tests cover both create and rename.

### PD-R10 - Recovery identities collide across IndexedDB key types

Only non-string physical keys were encoded. An unavailable record stored under
literal string key `"indexeddb-key:number:1"` therefore retained the same
`recoveryId` generated for numeric key `1`. Dashboard duplicate detection
correctly rejected the ambiguous inventory, but this made all projects
temporarily unavailable.

Remediation: the IndexedDB adapter now derives every unavailable recovery
identity through the same type-tagged encoder, including strings. Ready string
records continue using their validated project IDs. The adversarial numeric and
literal-string pair now lists as two distinct unavailable records.

### PD-R11 - Pending dialogs have no focusable modal target

The Escape remediation disabled every native control while a create or rename
mutation was pending. The focus trap found no eligible element and returned
without preventing Tab, while the dashboard behind the modal remained
interactive.

Remediation: the pending submit control remains focusable with
`aria-disabled` and `aria-busy`, receives focus when the mutation starts, and
guards form submission while unresolved. Tab and Shift+Tab both remain on that
single modal target, and Enter cannot start a duplicate mutation.

### PD-R12 - Publication records lag the published pull-request head

Commit `61641d3` published PD-R07 through PD-R09 and passed Node 24.19 CI, but
the maintained records and PR description still cited `a6a7b78`, six findings,
559 tests, and an outstanding publication step.

Remediation: the existing authorities now identify `61641d3` as the published
nine-finding, 565-test checkpoint and link its successful required-runtime job.
The later PD-R10 and PD-R11 code fixes remain explicitly local until a separate
authorized publication.

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
PD-R06 remediation on 2026-08-18, approved execution of PD-R07 through PD-R09,
and then approved remediation of PD-R10 through PD-R12 on the same date. All
twelve findings are closed in the local working tree. PD-R07 through PD-R09 are
published; PD-R10 and PD-R11 still require publication and required-runtime
verification. This review did not itself authorize a push, merge, deployment,
backend expansion, or deletion capability. The user previously authorized the
push and creation of [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9);
that direction does not authorize another push, merge, or deployment.

Latest closure verification passes 3 focused files and all 27 tests,
repository-wide ESLint, normal `pnpm typecheck`, `git diff --check`, the
complete 41-file, 567-test suite with the temporary 15-second ceiling, and the
optimized production build under Node 22.21.1. Published head `61641d3`
passed the Node 24.19 `CI / Validate` job in
[run 32120382654, job 95659238395](https://github.com/surajsibi/web-builder/actions/runs/32120382654/job/95659238395).
That job predates PD-R10 and PD-R11, so the required-runtime matrix must run
again after those code changes are published.

The owner should review draft pull request 9 before promoting it from draft.
Publish the latest remediation, rerun the complete Node 24.19.x matrix, and
repeat the remediated states visually when the Browser plugin runtime is
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
revision conflicts still refuse the write. Complete the post-publication Node
24 verification matrix and browser smoke before ready-for-review promotion, and
re-review the twelve findings if the cited implementation or regression tests
change.
