---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-JOURNAL
type: D4
scope: Execution state for web-builder chore/senior-review-remediation
authority: Selected repository execution-state record for this branch and feature
owner: Project owner
lifecycle: in_review
freshness: Updated after GitHub Actions run 31583752506 passed follow-up commit 278d0e2 on 2026-08-12; invalidated by a new commit, review response, blocker, or resume-point change
---

# Progress journal — web-builder / chore/senior-review-remediation

**Feature workspace:**
`workspaces/senior-review-remediation/`

**Current step:**
SRR-00 through SRR-16 are implemented, published, and verified. The prepared review response and reviewer follow-up remain before a merge decision.

**Approach:**
Preserve the verified SRR-00 through SRR-10 work, then resolve the confirmed pre-merge review findings in isolated stages: drag complexity, preview quota recovery, test timeout margin, CI event duplication, compatibility-preserving form cleanup, and final verification.

**Done:**

- Created `chore/senior-review-remediation` from `b159f15aef531819538ccc32a877d27f7061a64f` with project-owner approval.
- Loaded the applicable workspace, research, documentation, taxonomy, governance, feature-branch, and plan-template instructions.
- Loaded the selected feature workspace and execution plan.
- Recorded the installed Node 22.21.1 and pnpm 10.33.0 environment.
- Reproduced the reviewer-reported failure with the official checksum-verified Node 25.2.1 archive.
- Recorded the evidence in `workspaces/senior-review-remediation/research/node-web-storage-baseline.md`.
- Pinned Node 24.19.0 through `.nvmrc` and a bounded package engine range.
- Injected preview storage through narrow shell props and replaced ambient storage in tests with an isolated Map-backed implementation.
- Added behavior coverage for preview-storage failure.
- Added `.github/workflows/ci.yml` with read-only permissions, concurrency control, a bounded timeout, frozen installation, lint, typecheck, test, and build.
- Committed the reliability tranche as `126d8d491329c90e1c57bfebc59cc7443004d7b5` and pushed `chore/senior-review-remediation` to origin.
- Added deterministic rename and subtree-duplication benchmarks for valid 100, 1,000, and 10,000-node results.
- Removed the redundant post-component-validation tree-index rebuild.
- Replaced repeated project-wide node-ID scans with one reserved ID set per allocating command.
- Added regression coverage proving repeated generated IDs are retried without producing duplicate subtree identities.
- Recorded the method, raw JSON results, and interpretation in `workspaces/senior-review-remediation/research/command-path-performance.md`.
- Retained full candidate hydration as an explicit command validation mode and introduced scoped validation as the hydrated-store default.
- Classified all 13 commands as local or structural; structural mutations run the complete tree-invariant validator once.
- Added a scoped/full equivalence suite covering every command kind, invalid props/styles, a generated node-cap overflow, and a generated depth overflow.
- Kept hydration, initial-document preparation, undo, and redo on full document validation.
- Recorded scoped-validation boundaries, equivalence coverage, and benchmark results in `workspaces/senior-review-remediation/research/scoped-command-validation.md`.
- Added a 50-entry history limit across command append, undo, and redo without changing the full-snapshot representation.
- Added cap-boundary coverage for eviction, grouped edits, undo, redo, selection, and edit-after-undo behavior.
- Added `pnpm benchmark:history` and recorded retained-payload evidence in `workspaces/senior-review-remediation/research/history-retention.md`.
- Changed `/api/form-submissions` to return an explicit non-persistent `503` response without parsing the request body.
- Removed the unused payload-acceptance schema and the Preview logging/fetch path.
- Added an accessible persistent notice to preview forms stating that submissions are not saved or sent.
- Scoped `EditorShell` to a shallow selection that excludes high-frequency active drop-target changes and moved active highlighting to each drag-library drop zone.
- Added Backspace as the non-editable Mac removal shortcut while retaining editable-control guards.
- Separated registry props-default and styles-default validation errors and replaced serialized equality with structural JSON equality.
- Made preview snapshots reusable and garbage-collected builder preview entries to the newest 10 snapshots.
- Replaced duplicated drag validation rules with a command-executor validation-only path that stops before candidate allocation.
- Documented why the module-level editor store must retain deterministic initial IDs and timestamps.
- Added direct behavior coverage for JSON value guards, slug normalization/generation, document-version migration handling, and project tree invariants.
- Hardened JSON value guards so accessors are not invoked and lossy sparse or extended arrays are rejected.
- Removed the dead generated-slug root guard after direct normalization tests proved the base can never be `/`.
- Added the maintained root contributor README with supported toolchain, setup, verification, repository orientation, preview/form boundaries, and explicit license/CSP status.
- Retained the Phase 2 validation harness pending coordinated archival or link migration for the four draft reports that use it as historical evidence; confirmed it has no production import.
- Inspected pull request review `4913695775` against exact commit `fc3b1b63e9c8ec6583bc5d796b1d61a682c3479b` and confirmed that it contains one changes-requested review with no inline threads.
- Verified the drag complexity, preview quota-recovery, equivalence-timeout margin, duplicate-CI, and unreachable form-runtime findings; rejected the JSON-symbol and block-internal-placement claims with source evidence.
- Extended the selected execution plan with SRR-11 through SRR-16 instead of creating a duplicate plan.
- Received project-owner approval to execute the pre-merge follow-up.
- Received project-owner approval to commit and push only the remediation files while preserving the unrelated `workspaces/api-data-bindings/` changes.
- Added an exact-size drag-overlay benchmark and replaced per-zone moving-subtree collection with a cycle-safe upward walk through the trusted parent index.
- Added preview quota recovery that prunes stale builder-owned snapshots before writes and retries one quota failure exactly once without deleting unrelated storage or an existing current snapshot.
- Isolated the maximum-node validation-equivalence case with a 30-second per-test timeout while retaining global Vitest defaults.
- Limited CI branch `push` validation to `main` while retaining `pull_request` and `workflow_dispatch`.
- Removed the unreachable `submitForm` runtime callback, value conversion module and tests, form submission state machine, status styles, and inactive success/error Inspector controls.
- Preserved persisted form success/error fields in the strict schema and defaults; forms cancel native submission, Preview retains its unavailable notice, and the route remains fail-closed at `503`.
- Updated `Project.md` to remove the stale working-submission architecture and record the fail-closed contract.
- Added the D2 drag-validation investigation and updated the selected plan, workspace, overlay, and implementation report with local evidence.
- Committed the scoped follow-up as `278d0e2505d691e231f5698e03be8a5abec6d5a1` and pushed it to `origin/chore/senior-review-remediation` without staging the unrelated API-data workspace changes.

**Verification:**

- Node 22.21.1: lint passed, typecheck passed, 26 files / 349 tests passed in 74.45 seconds, and the Next.js production build passed.
- Node 25.2.1: 3 files failed and 58 of 349 tests failed in 184.36 seconds; primary errors report absent `clear`, `getItem`, and `setItem` methods on `window.localStorage`.
- Node 25.2.1 emitted the invalid `--localstorage-file` warning reported by the senior review.
- After SRR-02, Node 25.2.1 passes the 3 affected files / 59 tests and the complete 26 files / 350 tests without the prior storage warning.
- Node 24.19.0 passes frozen installation, lint, typecheck, 26 files / 350 tests, and the production build.
- GitHub Actions run `31490573187` passed every workflow step in 1 minute 29 seconds.
- SRR-04 focused verification passes 42 command and hydration tests.
- SRR-04 full Node 24.19.0 verification passes lint, typecheck, 26 files / 351 tests, and production build.
- GitHub Actions run `31492155602` passed the same SRR-04 matrix in 1 minute 21 seconds on commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.
- Valid duplication to a 10,000-node result improved from a 7,705.46 ms mean to 2,763.77 ms, a 64.1% reduction and 2.79× speedup.
- A valid 10,000-node rename remains effectively unchanged at about 1.73 seconds, confirming that full hydration is the next dominant cost.
- SRR-05 focused verification passes 59 command, equivalence, and hydration tests.
- SRR-05 full Node 24.19.0 verification passes lint, typecheck, 27 files / 369 tests, and production build.
- Scoped validation reduces the 10,000-node rename mean from 1,728.33 ms to 240.05 ms (86.1%, 7.20×) and the SRR-04 duplication mean from 2,763.77 ms to 1,107.97 ms (59.9%, 2.49×).
- GitHub Actions run `31493250145` passed every SRR-05 workflow step on commit `20c3497d641abf8b59e82aee8e022685a269f81b`.
- SRR-06 focused verification passes all 14 store tests.
- SRR-06 full Node 24.19.0 verification passes lint, typecheck, 27 files / 372 tests, and production build.
- After 100 edits to a 1,000-node document, the capped 50-entry history serializes to 94,080,080 bytes (89.72 MiB), 50.0% below the 188,160,101-byte uncapped projection.
- GitHub Actions run `31563217075` passed every SRR-06 workflow step in 1 minute 16 seconds on commit `c42d562fc1805ec4666a61a14577a0f6044dc1fe`.
- SRR-07 focused verification passes 73 route, Preview, and Form tests.
- SRR-07 full Node 24.19.0 verification passes lint, typecheck, 27 files / 370 tests, and production build.
- GitHub Actions run `31563682967` passed every SRR-07 workflow step in 1 minute 29 seconds on commit `01d58a13b783c5c320f48b53bad9f40a5f9fcbe9`.
- SRR-08 focused verification passes 92 command, project, preview, drag, layers, and shell tests.
- SRR-08 full Node 24.19.0 verification passes lint, typecheck, 28 files / 375 tests, and production build.
- GitHub Actions run `31565406088` passed every SRR-08 workflow step in 1 minute 13 seconds on commit `96ed9760e7f0d20e26fcb5f80469f0750944e3e0`.
- SRR-09 focused verification passes 4 files / 39 tests; lint and typecheck pass after the coverage and JSON-guard changes.
- SRR-09 full Node 24.19.0 verification passes lint, typecheck, 32 files / 414 tests, and production build.
- GitHub Actions run `31566812922` passed every SRR-09/final-code workflow step in 1 minute 40 seconds on commit `abaf022a1a58a725e675dc75363a7fa0877acbd9`.
- The SRR-10 D5 implementation report records all changes, verification, decisions, and residual risks.
- After review inspection, Node 24.19.0 passed the complete 32-file / 414-test suite in 153.27 seconds.
- The maximum-node equivalence case passed in isolation in 2.544 seconds, confirming correctness while leaving limited margin under the 5-second default timeout.
- GitHub Actions runs `31567183248` (`push`) and `31569281861` (`pull_request`) both passed against reviewed commit `fc3b1b6`, confirming duplicate event coverage.
- Corrected exact-size drag benchmark baseline means: 13.3770 ms, 66.0623 ms, and 267.57 ms for 1,200, 3,000, and 6,000 zones with 200, 500, and 1,000 moving-subtree nodes.
- Corrected exact-size optimized drag means: 4.2840 ms, 5.6562 ms, and 10.8092 ms, reductions of 68.0%, 91.4%, and 96.0%.
- Focused form, Preview, and route verification passes 3 files / 74 tests; focused move/drop verification passes 2 files / 39 tests; preview quota and equivalence suites also pass.
- Node 24.19.0 lint and typecheck pass.
- Two independent complete Node 24.19.0 runs each pass 31 files / 416 tests.
- The Next.js 16.3.0 production build passes; the existing ancestor-lockfile/Turbopack-root warning remains non-fatal.
- `.github/workflows/ci.yml` parses successfully as YAML with `push.branches: [main]`, `pull_request`, and `workflow_dispatch`.
- Final consolidated focused verification passes 6 files / 127 tests after the optimized move path and exact-size benchmark fixture were restored.
- Final post-audit lint and typecheck pass; documentation relative links resolve and `git diff --check` reports no whitespace errors.
- GitHub Actions run `31583752506` was the only automatic run for `278d0e2`; frozen installation, lint, typecheck, all tests, and the production build passed in 1 minute 28 seconds.

**Remaining:**

- Post the prepared evidence-based response to review 4913695775 only with approval, then make the merge decision.
- Decide the software license and whether to pursue a separately tested CSP as separate owner/security gates.

**Last left off:**
2026-08-12 — SRR-11 through SRR-16 are published and verified locally and remotely. The unrelated changes under `workspaces/api-data-bindings/` remain untouched. Next action: obtain approval to post the prepared review response, then wait for reviewer follow-up before any merge decision.
