---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-JOURNAL
type: D4
scope: Execution state for web-builder chore/senior-review-remediation
authority: Selected repository execution-state record for this branch and feature
owner: Project owner
lifecycle: draft
freshness: Updated after SRR-06 passed remotely and SRR-07 passed its focused and full local verification gates on 2026-08-12; invalidated by implementation progress, verification changes, blockers, or a resume-point change
---

# Progress journal — web-builder / chore/senior-review-remediation

**Feature workspace:**
`workspaces/senior-review-remediation/`

**Current step:**
SRR-00 through SRR-06 are complete. SRR-07 is locally complete and awaiting checkpoint/remote CI verification.

**Approach:**
Restore a reproducible green baseline first, then measure and optimize the command path, bound history, correct form behavior, address focused findings, and run the complete verification matrix.

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

**Remaining:**

- Checkpoint SRR-07 and verify it in GitHub Actions.
- Begin the focused correctness and interaction findings under SRR-08.

**Last left off:**
2026-08-12 — SRR-07 is locally complete and fully green. The unrelated changes under `workspaces/api-data-bindings/` remain untouched. Next action: checkpoint and remotely verify SRR-07, then begin SRR-08.
