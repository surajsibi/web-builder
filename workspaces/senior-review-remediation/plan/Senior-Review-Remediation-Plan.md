---
doc_id: WEB-BUILDER-SENIOR-REVIEW-REMEDIATION-PLAN
type: D3
scope: Execution plan for reliability, performance, history, form, preview, correctness, coverage, repository readiness, and pre-merge PR review follow-up for web-builder
authority: Selected execution plan for senior-review remediation; workspace.md owns execution state, and code, configuration, tests, and verified runtime behavior own current implementation facts
owner: Project owner
lifecycle: approved
freshness: Updated on 2026-08-12 after local implementation and verification of SRR-11 through SRR-15; invalidated by new implementation evidence, dependency changes, remote CI results, or an approved scope change
---

# Plan: Remediate the senior review findings

## Goal, scope, and authority

Turn the 2026-08-11 senior review into a staged remediation effort that first restores a trustworthy contributor baseline, then improves large-document behavior without weakening the builder's validation boundary. Bound history memory, prevent the form preview from implying persistence, address targeted correctness defects, and leave deferred product or architectural decisions explicit.

This plan is the authority for intended work order and verification gates. [The feature workspace](../workspace.md) is the selected execution-state authority. Code, configuration, tests, and verified runtime behavior remain authoritative for implemented behavior.

Included:

- Supported Node runtime declaration, local version file, and GitHub Actions CI.
- Testable browser-storage boundaries and resolution of the reported modern-Node failures.
- Reproducible command-path benchmarks and the two low-risk performance improvements identified by review.
- A gated design for scoped command validation with equivalence testing against full validation.
- A bounded undo/redo history policy and retained-memory measurement.
- Honest preview form behavior, removal of sensitive submission logging, and fail-closed handling while persistence is excluded.
- Zustand selector use, platform-appropriate deletion keys, precise command error classification, structural equality, preview-snapshot lifecycle, drop-validation consolidation, and selected validation corrections.
- Direct tests for security- and invariant-relevant modules, plus a repository-readiness pass.
- Pre-merge correction of the confirmed drag-validation complexity regression, preview quota-recovery failure, timing-marginal equivalence test, and duplicate pull-request CI runs.
- Compatibility-preserving removal of the unreachable production form-submission runtime while retaining fail-closed behavior.

Excluded unless separately approved:

- Backend form persistence, authentication, publishing, deployment, and durable rate-limit infrastructure.
- A broad rewrite of the command executor, hydration pipeline, project schema, or component registry.
- Removing full validation from untrusted hydration or import boundaries.
- Choosing a software license on behalf of the project owner.
- Treating line count alone as a reason to add UI tests.

## Constraints and assumptions

- Verified: the repository is `web-builder`; `chore/senior-review-remediation` was created from `main` at `b159f15aef531819538ccc32a877d27f7061a64f` after the planning documentation was committed.
- Verified: `package.json` pins pnpm but does not declare a Node engine; `.nvmrc` and `.github/workflows/` are absent at the inspected commit.
- Verified: Node 22.21.1 passes lint, typecheck, all 349 tests, and the production build; checksum-verified Node 25.2.1 reproduces 58 local-storage-related failures in three test files.
- Verified: [pull request review 4913695775](https://github.com/surajsibi/web-builder/pull/1#pullrequestreview-4913695775) requested changes against exact commit `fc3b1b63e9c8ec6583bc5d796b1d61a682c3479b`.
- Verified: the review's drag complexity, preview quota-recovery, timing-margin, duplicate-CI, and unreachable form-runtime findings are actionable. The JSON-symbol and internal block-placement claims do not require changes because the current implementations already satisfy those cases.
- Verified: on Node 24.19.0, the complete suite passed 32 files and 414 tests in 153.27 seconds; the maximum-node equivalence case passed in isolation but consumed 2.544 seconds of its 5-second default timeout.
- Approved execution baseline: support Node 24.19.0 LTS through `.nvmrc`, a bounded `engines.node` range, and CI. Storage must still be corrected so the suite does not depend on accidental runtime globals.
- Proposed history limit: 50 entries. Confirm the product expectation and retained-memory result before marking SRR-06 complete.
- Scoped validation may proceed only after benchmarks demonstrate need and equivalence tests show that command-specific validation rejects every case rejected by full validation within the changed scope.
- Full validation remains required at untrusted document boundaries. Undo/redo validation changes are separate from the initial history cap.
- Phase 4 excludes backend persistence, so the bounded form remedy is to fail closed and state that preview submissions are not saved.
- Before editing Next.js code or configuration, read the relevant installed Next.js 16 documentation under `node_modules/next/dist/docs/`.
- Existing unrelated source and workspace changes must remain untouched.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Feature branch approval | Project owner approves creating or switching from `main` | Project owner | Keep the plan in draft and do not begin implementation |
| Supported Node baseline | One Node LTS major is selected and reproducible locally and in CI | Repository maintainer | Record the incompatibility and stop CI claims until resolved |
| Existing hydration and command invariants | Current rejection behavior is characterized by tests | Editor architecture owner | Keep full validation and limit work to measured low-risk optimizations |
| Performance fixtures | Valid deterministic documents cover small, medium, and maximum-scale cases | Implementer and technical verifier | Do not claim performance improvement without comparable results |
| History semantics | Grouping, undo, redo, selection reconciliation, and failure behavior remain specified by tests | Editor state owner | Revert the bounded history design before changing snapshot representation |
| Form product scope | Persistence remains explicitly excluded or receives separate approval | Project owner | Fail closed and display a non-persistence notice |
| Security-header compatibility | Next.js runtime, development tooling, and authored style behavior are inventoried | Security reviewer | Defer CSP rather than shipping an unverified policy |
| PR review baseline | Follow-up remains anchored to reviewed commit `fc3b1b6` and confirmed findings | Project owner and technical verifier | Re-evaluate the plan if the branch changes independently before implementation |
| Persisted form documents | Existing form nodes may contain `successMessage` and `errorMessage` fields | Editor architecture owner | Preserve schema compatibility and defer field removal to a versioned migration |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| SRR-00 | Create or switch to an approved feature branch and establish a clean reproducible baseline | Feature branch approval | Record branch, HEAD, Node/pnpm versions, failing suites, and current check results | Repository maintainer | Complete: Node 22 green and Node 25 failure reproduced |
| SRR-01 | Add the supported Node declaration and local version file | SRR-00 | Fresh install uses the selected major; package-manager and engine checks agree | Implementer | Complete: Node 24.19.0 verified |
| SRR-02 | Introduce one browser-storage boundary and inject isolated storage in tests | SRR-01 | Storage tests do not depend on Node's global `localStorage`; affected editor and preview suites pass | Implementer | Complete: 350 tests pass on Node 24 and Node 25 |
| SRR-03 | Add GitHub Actions CI for install, lint, typecheck, test, and build | SRR-01, SRR-02 | Workflow uses the lockfile and pinned toolchain; all four project checks pass | Implementer and technical verifier | Complete: local matrix and GitHub Actions run `31490573187` passed |
| SRR-04 | Add deterministic command benchmarks, remove the redundant parent-index build, and allocate one ID set per command | SRR-03 | Before/after results for representative 100, 1,000, and 10,000-node documents; command regression tests pass | Implementer and technical verifier | Complete: 64.1% lower 10,000-node duplication mean; full matrix passes |
| SRR-05 | Design scoped command validation and implement it only behind equivalence and mutation-scope tests | SRR-04 | Incremental and full validators agree across supported command cases and generated invalid cases; untrusted hydration remains full-document | Editor architecture owner and technical verifier | Complete: local matrix and GitHub Actions run `31493250145` passed |
| SRR-06 | Cap history at 50 entries and measure retained memory; keep patch-based history as a separately gated follow-up | SRR-03 | Eviction, grouping, undo, redo, selection, and edit-after-undo tests pass; memory result is recorded | Implementer and technical verifier | Complete: local matrix and GitHub Actions run `31563217075` passed |
| SRR-07 | Make preview forms explicitly non-persistent, fail the stub closed without parsing the body, and remove submitted-value logging | SRR-03 | Route and Preview tests prove no accepted/discarded state, no sensitive logging, and a clear user-facing notice | Implementer and product reviewer | Complete: local matrix and GitHub Actions run `31563682967` passed |
| SRR-08 | Address focused correctness and interaction findings | SRR-03 | Selector render test, Mac Backspace coverage, precise style-default errors, structural equality tests, reusable bounded preview snapshots, and consolidated drop validation pass | Implementer | Complete: local matrix and GitHub Actions run `31565406088` passed |
| SRR-09 | Expand direct risk-based coverage and complete repository readiness work | SRR-04 through SRR-08 | JSON guard, slug, migration, and tree tests pass; obsolete scaffolding decision is recorded; README is verified; license and CSP remain owner-reviewed decisions | Implementer, technical verifier, and project owner | Complete: local matrix and GitHub Actions run `31566812922` passed |
| SRR-10 | Run the final verification matrix and publish an implementation report | SRR-04 through SRR-09 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on the supported Node version and in CI | Technical verifier | Complete: final code matrix passed and implementation report published for review |
| SRR-11 | Replace per-drop-zone moving-subtree cycle scans with an upward ancestor walk inside the centralized command dry run | SRR-10, PR review baseline | Existing move/drop semantics pass; parent-into-descendant moves remain rejected; before/after 200, 500, and 1,000-node drag-overlay measurements no longer scale as subtree size times drop-zone count | Implementer and technical verifier | Complete locally: largest fixture fell from 267.57 ms to 10.8092 ms |
| SRR-12 | Make preview snapshot storage recover from quota pressure by pruning eligible builder snapshots before writing and retrying one failed write once | SRR-10, PR review baseline | Quota-simulating tests prove stale builder snapshots are pruned, unrelated storage is preserved, the cap remains 10, retry occurs at most once, and unrecoverable writes still surface the existing error | Implementer and technical verifier | Complete locally: four quota and ordering regressions pass |
| SRR-13 | Isolate the maximum-node equivalence case and give only that correctness test an explicit 30-second timeout | SRR-10, PR review baseline | The isolated equivalence file passes; the complete suite passes twice on Node 24.19.0 without changing global Vitest timeouts | Implementer and technical verifier | Complete locally: targeted timeout and two 416-test runs pass |
| SRR-14 | Scope the CI `push` trigger to `main` while retaining `pull_request` and manual dispatch coverage | SRR-10, PR review baseline | Workflow syntax is valid; the next PR branch SHA receives one automatic validation run rather than separate push and pull-request runs | Implementer and repository maintainer | Implemented; local YAML parse passes, remote event verification pending |
| SRR-15 | Remove unreachable production `submitForm` and form-status machinery, hide parked success/error fields from the inspector, and preserve their schema compatibility until a versioned document migration | SRR-10, persisted form documents | No production runtime or import exposes submission values; editor/preview form tests pass; preview notice and fail-closed `503` route remain; existing documents still hydrate | Implementer, editor architecture owner, and product reviewer | Complete locally: focused and full suites pass |
| SRR-16 | Run the pre-merge verification matrix, update the implementation report and execution state, and prepare an evidence-based response to every review item | SRR-11 through SRR-15 | Focused tests, lint, typecheck, full tests, build, drag measurements, and one GitHub Actions PR run pass; deferred and rejected comments have concise evidence | Technical verifier and project owner | Local matrix and evidence complete; GitHub Actions PR run and posted review response pending |

## Quality and approval gates

- Reproduce reviewer-reported failures before claiming their root cause is fixed.
- Record benchmark fixture shape, Node version, command, sample count, and before/after results. Do not use one unrecorded local timing as evidence.
- Preserve `applied`, `noop`, `rejected`, and `failed` command semantics and all existing typed error behavior.
- Keep full-document validation as the reference implementation while scoped validation is developed and compared.
- Do not combine history-representation redesign with the initial history cap.
- Do not simulate successful form persistence. The Preview must state that submissions are not saved until a durable backend is approved and implemented.
- Add behavior-focused regression tests for every changed path.
- Run focused tests after each item, then run the complete lint, typecheck, test, and build matrix at SRR-10.
- Keep drag performance evidence in a benchmark or recorded measurement rather than a timing-sensitive unit-test assertion.
- Preview cleanup may remove only keys owned by the `web-builder:preview:` namespace. Retry a failed write at most once and preserve the existing user-visible failure when recovery is impossible.
- Increase only the known maximum-node equivalence case timeout; do not weaken global timeout detection.
- Preserve pull-request validation when limiting branch push validation to `main`.
- Do not remove persisted form fields without a versioned migration. Park compatibility fields by removing their inspector controls and documenting the boundary.
- After SRR-11 through SRR-15, run focused checks followed by the complete supported-runtime matrix and remote PR validation at SRR-16.
- Project-owner approval to execute SRR-11 through SRR-16 was recorded on 2026-08-12. Record implementation and verification progress in the feature workspace and branch journal.

## Risks, rollback, and containment

- **Validation regression:** scoped validation could miss a project-wide invariant. Keep the full validator available, require equivalence tests, and fall back to full validation on any unclassified mutation.
- **Misleading benchmark:** document generation or warm-up effects could distort results. Use deterministic valid fixtures and record methodology with the results.
- **History behavior regression:** eviction can break grouped edits or redo ordering. Introduce the cap without changing snapshot representation and retain focused state-machine tests.
- **Storage coupling:** replacing direct browser access can accidentally move browser-only behavior into server rendering. Keep the real storage adapter browser-bound and inject the interface into testable logic.
- **False form safety:** a `Content-Length` check alone does not bound a missing or dishonest header. While persistence is excluded, fail before body parsing; require bounded streaming and durable abuse controls when acceptance is implemented.
- **CSP breakage:** an untested policy can break Next.js scripts or authored styles. Inventory requirements and test production output before enabling enforcement.
- **Validation drift:** restoring an ancestor walk outside the command executor would recreate duplicated rules. Keep the cycle check inside the centralized move-command preparation path and exercise it through drag resolution.
- **Storage data loss:** aggressive quota recovery could delete unrelated application data or the only reusable snapshot. Restrict cleanup to builder preview keys, retain the current snapshot when overwriting, and test ordering and retry bounds.
- **Hidden performance regression:** a large timeout can conceal slower command validation. Limit the timeout change to the correctness case and keep performance evidence separate.
- **Document compatibility:** deleting form props from the schema would invalidate existing project documents. Remove unreachable runtime behavior now and reserve schema removal for an approved migration.
- **CI coverage gap:** narrowing `push` too far could skip protected-branch validation. Keep `main`, `pull_request`, and `workflow_dispatch` triggers and verify the resulting event set remotely.
- If a gate fails, stop at the last passing plan item, record the failure in the branch journal, and keep the safer existing behavior. Destructive Git rollback is not authorized.

## Completion

SRR-00 through SRR-15 are implemented and locally verified. SRR-16's local matrix and evidence record are complete; one automatic pull-request CI run and posting the prepared review response remain outside this local checkpoint. The branch is not merge-ready until those remote gates pass and the project owner makes the merge decision.

Promote only verified durable knowledge to the appropriate project authority. Archive the feature and branch workspaces after accountable review and completion; do not archive or delete them automatically.
