---
doc_id: WEB-BUILDER-SENIOR-REVIEW-REMEDIATION-IMPLEMENTATION
type: D5
scope: Implemented remediation and verification for the 2026-08-11 senior review of web-builder on chore/senior-review-remediation
authority: Source, configuration, tests, benchmark artifacts, and GitHub Actions own implemented behavior and results; this report is the derived delivery record
owner: Project owner
lifecycle: draft
freshness: Verified on 2026-08-12 through implementation commit abaf022 and GitHub Actions run 31566812922; invalidated by changes to the remediated code, configuration, tests, benchmark fixtures, supported runtime, or reviewed product decisions
---

# Implementation report: Senior-review remediation

## Outcome

The remediation restores a reproducible Node 24 contributor baseline, makes CI executable, removes the reported Node web-storage test failure, materially reduces large-document command time, bounds undo history by edit count, makes preview forms fail closed, and resolves the focused interaction and correctness findings selected by the approved plan.

Direct security and invariant tests now cover JSON value guards, page slugs, document-version migration handling, and project tree validation. A maintained root developer guide now owns contributor setup and verification. The branch is ready for accountable review; it is not automatically merged or archived.

## Scope and versions

- Repository: `web-builder`.
- Branch: `chore/senior-review-remediation`.
- Planning origin: `b159f15aef531819538ccc32a877d27f7061a64f`.
- Implemented commits: `126d8d4`, `de7bd95`, `20c3497`, `c42d562`, `01d58a1`, `96ed976`, and `abaf022`, plus execution-state checkpoint commits.
- Supported runtime: Node 24.19.0 and pnpm 10.33.0.
- Framework: Next.js 16.3.0 and React 19.2.8.
- Excluded: persistent form backend, authentication, publishing, patch-based history, licensing choice, and an unreviewed Content Security Policy.

The [selected remediation plan](../plan/Senior-Review-Remediation-Plan.md) owns the intended scope. The [branch journal](../../../branches/web-builder/chore-senior-review-remediation/journal.md) records execution state.

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| Runtime and CI | [.nvmrc](../../../.nvmrc), [package.json](../../../package.json), and [ci.yml](../../../.github/workflows/ci.yml) | Contributors and CI use Node 24.19.0; frozen install, lint, typecheck, test, and build run on every branch update. |
| Browser storage | [preview snapshot boundary](../../../src/builder/preview/preview-snapshot.ts) and injected shell storage | Tests no longer depend on Node's ambient `localStorage`; browser storage failures remain user-visible and non-fatal. |
| Command allocation | [command executor](../../../src/builder/commands/execute-command.ts) and [hydration pipeline](../../../src/builder/project/hydration.ts) | Allocating commands build one project-wide ID set, and hydration avoids a redundant tree-index rebuild. |
| Validation performance | [scoped/full equivalence tests](../../../src/builder/commands/__tests__/execute-command-validation-equivalence.spec.ts) | Trusted store commands validate their mutation scope; untrusted hydration, initial load, undo, and redo retain full validation. |
| History | [builder store](../../../src/builder/store/builder-store.ts) and [history retention tests](../../../src/builder/store/__tests__/builder-store.spec.ts) | Undo/redo retains the newest 50 entries instead of growing without a bound. |
| Preview forms | [form endpoint](../../../src/app/api/form-submissions/route.ts) and [preview shell](../../../src/builder/preview/preview-shell.tsx) | Preview states that submissions are not saved or sent; the endpoint returns `503` without reading the request body, and visitor values are not logged. |
| Editor interaction | [editor shell](../../../src/builder/ui/editor-shell.tsx) and [drag validation](../../../src/builder/ui/drag-and-drop.ts) | Active drop-target churn does not rerender the shell; Backspace deletes on macOS; drag validity comes from the command executor. |
| Correctness | [structural equality](../../../src/builder/project/clone.ts), [JSON guards](../../../src/builder/model/json.ts), and [slug rules](../../../src/builder/project/slug.ts) | Object key order no longer changes no-op detection; accessors and lossy arrays are rejected as JSON data; style-default errors and generated slugs are classified precisely. |
| Preview lifecycle | [preview snapshot tests](../../../src/builder/preview/__tests__/preview-snapshot.spec.ts) | Snapshots can be reused across refreshes/tabs and old builder snapshots are garbage-collected to a maximum of 10. |
| Direct coverage | [JSON tests](../../../src/builder/model/__tests__/json.spec.ts), [slug tests](../../../src/builder/project/__tests__/slug.spec.ts), [migration tests](../../../src/builder/project/__tests__/migrations.spec.ts), and [tree tests](../../../src/builder/project/__tests__/tree.spec.ts) | Security and tree invariants have direct, deterministic behavioral contracts rather than only indirect hydration coverage. |
| Contributor readiness | [root developer guide](../../../README.md) | A fresh contributor has one maintained setup, verification, architecture-navigation, and current-boundaries entry point. |

## Decisions and deviations

- Full hydration remains mandatory at untrusted and reconstructed boundaries. Scoped validation is limited to snapshots owned by the hydrated builder store and retains full validation as its test oracle.
- The initial history remedy is a 50-entry cap, not a simultaneous representation redesign. Full before/after snapshots remain because patch correctness and memory behavior need a separate architecture gate.
- Preview forms fail closed because durable persistence is outside the approved product scope. A `Content-Length` check was not presented as sufficient protection for a body that would still be buffered; the unavailable route does not parse the body at all.
- `PhaseTwoValidation` remains temporarily. It has no production import, while four draft phase reports link it as historical validation evidence. Removal is coupled to report archival or link migration.
- No software license was selected. That legal/product decision remains with the project owner and is stated in the developer guide.
- No CSP was enabled. A security reviewer must approve and production-test a policy compatible with Next.js and the builder's controlled inline style rendering.

## Verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Reproduce the reported failure | [Node web-storage investigation](../research/node-web-storage-baseline.md) | Node 25.2.1 reproduced 58 failures in the three reported suites. | Node 25 is compatibility evidence, not a supported runtime. |
| Stable contributor baseline | GitHub Actions run `31490573187` on `126d8d4` | Frozen install, lint, typecheck, tests, and build passed on Node 24.19.0. | One supported Node major. |
| Remove O(N×M) ID allocation | [command-path investigation](../research/command-path-performance.md) | 10,000-node duplication mean fell from 7,705.46 ms to 2,763.77 ms after SRR-04. | Comparative local benchmark, not a cross-machine guarantee. |
| Scope validation safely | [scoped-validation investigation](../research/scoped-command-validation.md) and run `31493250145` | All command kinds and generated node/depth failures matched full validation; 10,000-node rename fell to 240.05 ms and duplication to 1,107.97 ms. | Arbitrary caller-created snapshots remain outside the scoped boundary. |
| Bound history | [history-retention investigation](../research/history-retention.md) and run `31563217075` | 50-entry cap tests passed; the 1,000-node/100-edit retained payload fell from a 179.44 MiB uncapped projection to 89.72 MiB. | Serialized payload is not heap/RSS; full snapshots remain expensive. |
| Fail preview forms closed | Route, Preview, and renderer tests; run `31563682967` | No body parsing, accepted/discarded response, fetch, or sensitive console logging; Preview displays the non-persistence notice. | Persistence and abuse controls remain future backend work. |
| Correct focused interactions | 92 focused tests and run `31565406088` | Selector, Backspace, defaults error, equality, reusable snapshots, and consolidated drag checks passed. | Preview storage is bounded by count rather than bytes. |
| Cover security/invariants directly | 4 focused files / 39 tests | JSON, slug, migration, and tree contracts passed, including node/depth caps and malformed relationships. | Component/UI files remain covered by behavior suites rather than line-count-driven direct specs. |
| Final implemented code matrix | Node 24.19.0 local run and GitHub Actions run `31566812922` on `abaf022` | Lint and typecheck passed; 32 files / 414 tests passed; production build passed. | The local build reports an unrelated ancestor-lockfile warning; output is still successful. |

## Rollout and rollback

The work is pushed only to `chore/senior-review-remediation`; no protected branch was merged and no deployment was performed. Each remediation tranche is an independent commit, so a repository maintainer can revert a specific tranche with a normal reviewable revert if a regression is discovered. Destructive reset, forced push, and automatic workspace archival were not used.

Before merging, review the residual risks below and run the CI workflow against the final branch head. After merge, validate the editor, Preview, undo/redo, and drag interactions in a supported browser before release.

## Durable documentation updates

- [README.md](../../../README.md) now owns repository onboarding and current contributor verification.
- The [feature workspace](../workspace.md), [repository overlay](../../../branches/web-builder/chore-senior-review-remediation/overlay.md), and [branch journal](../../../branches/web-builder/chore-senior-review-remediation/journal.md) retain branch-specific decisions and evidence until accountable review and merge.
- Benchmark methods and raw evidence remain in the existing [research directory](../research/).
- Stable project architecture was not rewritten from branch-specific implementation details; promotion to durable project context should occur only after merge.

## Residual risks and follow-up

- History is bounded by edit count but remains large: the measured 50-entry payload for a 1,000-node project is 89.72 MiB. Patch-based or structurally shared history needs a separate equivalence and memory plan.
- A 10,000-node structural duplication still averages about 1.11 seconds locally, and undo/redo still perform full hydration.
- Persistent submissions, rate limiting, bounded streaming/body parsing, authentication, and durable storage remain unimplemented. Preview accurately communicates this state.
- Preview snapshots are capped at 10 entries, not a byte quota; one large document can still exhaust browser storage.
- General CSS color/font-family strings and `safeHrefSchema` policy consistency were not expanded in this remediation. Invalid CSS can still disappear through CSSOM feedback, and link protocol/length policy needs a separate product/security decision.
- The Phase 2 validation harness remains maintenance surface until its linked draft reports are archived or migrated.
- The repository still requires an owner-selected license and a security-reviewed CSP decision before those findings can close.
