---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder chore/senior-review-remediation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: in_review
freshness: Updated after local implementation and verification of SRR-11 through SRR-15 on 2026-08-12; invalidated by a code, dependency, configuration, benchmark, remote CI, or review-state change
---

# Repository overlay — web-builder / chore/senior-review-remediation

## Verified repository differences

- `.nvmrc` pins Node 24.19.0 and `package.json` accepts only Node `>=24.19.0 <25`.
- Editor and Preview shells accept narrow preview-storage dependencies and resolve browser storage lazily inside client event/effect paths.
- Storage-related tests use a Map-backed isolated implementation rather than `window.localStorage`.
- `.github/workflows/ci.yml` defines the frozen-install, lint, typecheck, test, and build pipeline for pull requests, manual dispatches, and pushes to `main`.
- Hydration reuses the tree index validated before component migration because component migrations cannot change roots or child relationships.
- Node insertion, block insertion, and subtree duplication reserve generated IDs in one project-wide set per command.
- `pnpm benchmark:commands` runs the deterministic SRR-04 command-path fixtures.
- Editor commands default to scoped validation for hydrated store snapshots; `candidateValidation: "full"` retains the full-hydration oracle used by equivalence tests.
- Local metadata/component edits reuse the trusted parent index; structural commands run one complete tree-invariant pass and rebuild the parent index.
- Undo/redo history retains at most 50 entries across command append and stack movement; the existing full before/after snapshot representation remains unchanged.
- `pnpm benchmark:history` reproduces the 1,000-node retained-payload measurement.
- `/api/form-submissions` is an explicit unavailable endpoint: it returns `503` with `Cache-Control: no-store` and does not parse request bodies.
- Preview forms display that submissions are not saved or sent and receive no submission callback, so visitor values are not logged or transmitted.
- `EditorShell` uses a shallow selector and excludes active drop-target state; individual drop zones render active state from the drag library while the store retains the drag-end fallback target.
- The command executor exposes a validation-only path for insert, block-insert, and move commands; drag target resolution uses it before any candidate clone or generated-ID allocation.
- Preview snapshots remain reusable; builder-owned entries are pruned before new writes at the 10-entry cap, and one quota failure triggers one bounded cleanup-and-retry without touching unrelated storage.
- JSON-value equality is structural and object-key-order-insensitive; arrays remain order-sensitive.
- JSON value guards reject throwing/side-effecting accessors, sparse arrays, and arrays with enumerable values that JSON serialization would discard.
- The root `README.md` is the maintained contributor setup and verification guide.
- Move-cycle validation walks upward through the trusted `parentById` index rather than collecting the moving subtree for every drag drop-zone probe.
- `pnpm benchmark:drag` runs the exact-size SRR-11 overlay fixtures for 200, 500, and 1,000-node moving subtrees.
- The maximum-node scoped/full equivalence case has an isolated 30-second timeout; global test timeout behavior is unchanged.
- `ComponentRendererRuntime` exposes no submission callback. Forms cancel native submission, and Preview may inject only the non-persistence notice.
- Legacy `successMessage` and `errorMessage` form props remain strict-schema compatible but are absent from the Inspector and have no active runtime behavior.

## Verified pre-merge review findings

- The confirmed node-move complexity finding is locally resolved: exact-size largest-fixture mean fell from 267.57 ms to 10.8092 ms while centralized move/drop behavior tests pass.
- The confirmed preview quota finding is locally resolved with builder-namespace-only pre-pruning and one bounded retry; the cap and failure surfacing remain covered.
- The confirmed equivalence timing-margin finding is locally resolved with a 30-second timeout on only the maximum-node correctness case; two complete 416-test runs pass.
- The confirmed duplicate-CI configuration finding is implemented locally by scoping `push` to `main`; one-run remote confirmation remains pending.
- The confirmed unreachable form-runtime finding is locally resolved. Persisted success/error fields remain schema-compatible until a versioned migration is approved.
- JSON object validation already ignores symbol-keyed descriptors because `Object.values` enumerates only string-keyed descriptor properties.
- Block templates validate internal placement while resolving registry definitions, so scoped block insertion does not admit a template with an invalid internal parent/child edge.

## SRR-09 readiness decisions

- Retain `PhaseTwoValidation` for now. It has no production import and therefore no runtime route or bundle role, while four draft phase-validation reports still link it as historical evidence. Remove it only with the report archival/link-migration decision so maintained links do not silently break.
- Do not choose a software license on behalf of the project owner. `README.md` makes the missing grant explicit; closure requires an owner-selected license and new `LICENSE` file.
- Do not enable an unverified CSP in this tranche. Closure requires a security reviewer to approve and test a policy against Next.js production behavior and the builder's controlled inline style rendering.

## Verified CI behavior

- GitHub Actions run `31490573187` passed on a GitHub-hosted Ubuntu runner for commit `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- GitHub Actions run `31492155602` passed the SRR-04 checkpoint on commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.
- GitHub Actions run `31493250145` passed the SRR-05 checkpoint on commit `20c3497d641abf8b59e82aee8e022685a269f81b`.
- GitHub Actions run `31563217075` passed the SRR-06 checkpoint on commit `c42d562fc1805ec4666a61a14577a0f6044dc1fe`.
- GitHub Actions run `31563682967` passed the SRR-07 checkpoint on commit `01d58a13b783c5c320f48b53bad9f40a5f9fcbe9`.
- GitHub Actions run `31565406088` passed the SRR-08 checkpoint on commit `96ed9760e7f0d20e26fcb5f80469f0750944e3e0`.
- GitHub Actions run `31566812922` passed the SRR-09 and final implemented-code checkpoint on commit `abaf022a1a58a725e675dc75363a7fa0877acbd9`.

## Constraints

- Node 24.19.0 is the supported development and CI runtime for this branch.
- Node 25 compatibility is tested only as regression evidence and does not expand the supported engine range.
- Full-document hydration remains the reference validator for every applied editor command and every untrusted document boundary.
- Initial hydration, explicit hydration, undo, and redo continue to use full-document validation.

## Risks

- The installed local Node 22 runtime remains outside the declared engine range and produces an expected pnpm warning.
- Scoped command validation relies on the builder-store invariant that every incoming command snapshot was fully hydrated; arbitrary caller-constructed snapshots are outside that boundary.
- The 50-entry cap bounds growth by edit count, but the measured 1,000-node retained payload is still 89.72 MiB; patch-based or structurally shared history remains a separately gated follow-up.
- Persistent form submissions, rate limiting, and bounded request parsing remain excluded until a durable backend is approved; the current endpoint fails before any body buffering or parsing.
- The preview snapshot cap bounds orphan count, not byte size; browser storage quotas can still reject a large snapshot and the editor reports that failure without opening Preview.
- The retained Phase 2 validation harness adds maintenance/test surface until its linked draft reports are archived or migrated.
- The preview quota recovery scans and parses existing builder snapshot entries; a separate metadata index would require a versioned storage design and is not justified by the 10-entry cap.
- Remote CI event de-duplication is configuration-correct locally but remains unverified until the published follow-up run completes.
