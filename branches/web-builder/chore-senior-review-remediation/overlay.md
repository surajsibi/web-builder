---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder chore/senior-review-remediation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Updated after SRR-05 scoped validation passed its equivalence, benchmark, and full local verification gates on 2026-08-11; invalidated by an implementation, dependency, configuration, or verification change
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

## Verified CI behavior

- GitHub Actions run `31490573187` passed on a GitHub-hosted Ubuntu runner for commit `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- GitHub Actions run `31492155602` passed the SRR-04 checkpoint on commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.

## Constraints

- Node 24.19.0 is the supported development and CI runtime for this branch.
- Node 25 compatibility is tested only as regression evidence and does not expand the supported engine range.
- Full-document hydration remains the reference validator for every applied editor command and every untrusted document boundary.
- Initial hydration, explicit hydration, undo, and redo continue to use full-document validation.

## Risks

- The installed local Node 22 runtime remains outside the declared engine range and produces an expected pnpm warning.
- Scoped command validation relies on the builder-store invariant that every incoming command snapshot was fully hydrated; arbitrary caller-constructed snapshots are outside that boundary.
