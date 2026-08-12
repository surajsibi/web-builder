---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder chore/senior-review-remediation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Updated after SRR-08 passed locally and remotely on 2026-08-12; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / chore/senior-review-remediation

## Verified repository differences

- `.nvmrc` pins Node 24.19.0 and `package.json` accepts only Node `>=24.19.0 <25`.
- Editor and Preview shells accept narrow preview-storage dependencies and resolve browser storage lazily inside client event/effect paths.
- Storage-related tests use a Map-backed isolated implementation rather than `window.localStorage`.
- `.github/workflows/ci.yml` defines the frozen-install, lint, typecheck, test, and build pipeline.
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
- Preview snapshots remain reusable and storage is garbage-collected to the 10 newest builder preview entries.
- JSON-value equality is structural and object-key-order-insensitive; arrays remain order-sensitive.

## Verified CI behavior

- GitHub Actions run `31490573187` passed on a GitHub-hosted Ubuntu runner for commit `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- GitHub Actions run `31492155602` passed the SRR-04 checkpoint on commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.
- GitHub Actions run `31493250145` passed the SRR-05 checkpoint on commit `20c3497d641abf8b59e82aee8e022685a269f81b`.
- GitHub Actions run `31563217075` passed the SRR-06 checkpoint on commit `c42d562fc1805ec4666a61a14577a0f6044dc1fe`.
- GitHub Actions run `31563682967` passed the SRR-07 checkpoint on commit `01d58a13b783c5c320f48b53bad9f40a5f9fcbe9`.
- GitHub Actions run `31565406088` passed the SRR-08 checkpoint on commit `96ed9760e7f0d20e26fcb5f80469f0750944e3e0`.

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
