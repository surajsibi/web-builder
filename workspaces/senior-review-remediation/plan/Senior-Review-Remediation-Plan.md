---
doc_id: WEB-BUILDER-SENIOR-REVIEW-REMEDIATION-PLAN
type: D3
scope: Execution plan for reliability, performance, history, form, preview, correctness, coverage, and repository-readiness findings from the 2026-08-11 senior review of web-builder
authority: Selected execution plan for senior-review remediation; workspace.md owns execution state, and code, configuration, tests, and verified runtime behavior own current implementation facts
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-11 after SRR-05 passed its equivalence, performance, and full local verification gates; invalidated by approved scope changes, implementation evidence, dependency changes, or a different selected plan
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

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| SRR-00 | Create or switch to an approved feature branch and establish a clean reproducible baseline | Feature branch approval | Record branch, HEAD, Node/pnpm versions, failing suites, and current check results | Repository maintainer | Complete: Node 22 green and Node 25 failure reproduced |
| SRR-01 | Add the supported Node declaration and local version file | SRR-00 | Fresh install uses the selected major; package-manager and engine checks agree | Implementer | Complete: Node 24.19.0 verified |
| SRR-02 | Introduce one browser-storage boundary and inject isolated storage in tests | SRR-01 | Storage tests do not depend on Node's global `localStorage`; affected editor and preview suites pass | Implementer | Complete: 350 tests pass on Node 24 and Node 25 |
| SRR-03 | Add GitHub Actions CI for install, lint, typecheck, test, and build | SRR-01, SRR-02 | Workflow uses the lockfile and pinned toolchain; all four project checks pass | Implementer and technical verifier | Complete: local matrix and GitHub Actions run `31490573187` passed |
| SRR-04 | Add deterministic command benchmarks, remove the redundant parent-index build, and allocate one ID set per command | SRR-03 | Before/after results for representative 100, 1,000, and 10,000-node documents; command regression tests pass | Implementer and technical verifier | Complete: 64.1% lower 10,000-node duplication mean; full matrix passes |
| SRR-05 | Design scoped command validation and implement it only behind equivalence and mutation-scope tests | SRR-04 | Incremental and full validators agree across supported command cases and generated invalid cases; untrusted hydration remains full-document | Editor architecture owner and technical verifier | Locally complete and pushed as `20c3497`; CI run `31493250145` in progress |
| SRR-06 | Cap history at 50 entries and measure retained memory; keep patch-based history as a separately gated follow-up | SRR-03 | Eviction, grouping, undo, redo, selection, and edit-after-undo tests pass; memory result is recorded | Implementer and technical verifier | Not started |
| SRR-07 | Make preview forms explicitly non-persistent, fail the stub closed without parsing the body, and remove submitted-value logging | SRR-03 | Route and Preview tests prove no accepted/discarded state, no sensitive logging, and a clear user-facing notice | Implementer and product reviewer | Not started |
| SRR-08 | Address focused correctness and interaction findings | SRR-03 | Selector render test, Mac Backspace coverage, precise style-default errors, structural equality tests, reusable bounded preview snapshots, and consolidated drop validation pass | Implementer | Not started |
| SRR-09 | Expand direct risk-based coverage and complete repository readiness work | SRR-04 through SRR-08 | JSON guard, slug, migration, and tree tests pass; obsolete scaffolding decision is recorded; README is verified; license and CSP remain owner-reviewed decisions | Implementer, technical verifier, and project owner | Not started |
| SRR-10 | Run the final verification matrix and publish an implementation report | SRR-04 through SRR-09 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on the supported Node version and in CI | Technical verifier | Not started |

## Quality and approval gates

- Reproduce reviewer-reported failures before claiming their root cause is fixed.
- Record benchmark fixture shape, Node version, command, sample count, and before/after results. Do not use one unrecorded local timing as evidence.
- Preserve `applied`, `noop`, `rejected`, and `failed` command semantics and all existing typed error behavior.
- Keep full-document validation as the reference implementation while scoped validation is developed and compared.
- Do not combine history-representation redesign with the initial history cap.
- Do not simulate successful form persistence. The Preview must state that submissions are not saved until a durable backend is approved and implemented.
- Add behavior-focused regression tests for every changed path.
- Run focused tests after each item, then run the complete lint, typecheck, test, and build matrix at SRR-10.
- Keep this document in draft until the project owner approves the plan. Record implementation progress only in the feature workspace and branch journal.

## Risks, rollback, and containment

- **Validation regression:** scoped validation could miss a project-wide invariant. Keep the full validator available, require equivalence tests, and fall back to full validation on any unclassified mutation.
- **Misleading benchmark:** document generation or warm-up effects could distort results. Use deterministic valid fixtures and record methodology with the results.
- **History behavior regression:** eviction can break grouped edits or redo ordering. Introduce the cap without changing snapshot representation and retain focused state-machine tests.
- **Storage coupling:** replacing direct browser access can accidentally move browser-only behavior into server rendering. Keep the real storage adapter browser-bound and inject the interface into testable logic.
- **False form safety:** a `Content-Length` check alone does not bound a missing or dishonest header. While persistence is excluded, fail before body parsing; require bounded streaming and durable abuse controls when acceptance is implemented.
- **CSP breakage:** an untested policy can break Next.js scripts or authored styles. Inventory requirements and test production output before enabling enforcement.
- If a gate fails, stop at the last passing plan item, record the failure in the branch journal, and keep the safer existing behavior. Destructive Git rollback is not authorized.

## Completion

Completion requires SRR-00 through SRR-10 to be complete or explicitly deferred by the project owner, all supported-runtime checks to pass locally and in CI, benchmark and memory evidence to be recorded, and a D5 implementation report to identify changes, verification, residual risks, and deferred findings.

Promote only verified durable knowledge to the appropriate project authority. Archive the feature and branch workspaces after accountable review and completion; do not archive or delete them automatically.
