---
doc_id: WEB-BUILDER-CHORE-SENIOR-REVIEW-REMEDIATION-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder chore/senior-review-remediation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Updated after the Node, storage, and CI reliability tranche passed local verification on 2026-08-11; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / chore/senior-review-remediation

## Verified repository differences

- `.nvmrc` pins Node 24.19.0 and `package.json` accepts only Node `>=24.19.0 <25`.
- Editor and Preview shells accept narrow preview-storage dependencies and resolve browser storage lazily inside client event/effect paths.
- Storage-related tests use a Map-backed isolated implementation rather than `window.localStorage`.
- `.github/workflows/ci.yml` defines the frozen-install, lint, typecheck, test, and build pipeline.

## Provisional assumptions

- The workflow is expected to pass on GitHub-hosted Ubuntu runners because its exact command sequence passes locally on Node 24.19.0. The first remote run is required to verify that assumption.

## Constraints

- Node 24.19.0 is the supported development and CI runtime for this branch.
- Node 25 compatibility is tested only as regression evidence and does not expand the supported engine range.

## Risks

- The CI workflow has not run remotely because no commit or push is authorized yet.
- The installed local Node 22 runtime remains outside the declared engine range and produces an expected pnpm warning.
