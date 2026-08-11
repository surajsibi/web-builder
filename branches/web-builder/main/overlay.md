---
doc_id: WEB-BUILDER-MAIN-SENIOR-REVIEW-OVERLAY
type: A1
scope: Repository-specific facts, constraints, and risks for web-builder main during senior-review remediation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Verified by bounded inspection at 081e7dd580ec15ba5d4bbea1b64a8c731605424b on 2026-08-11; invalidated by a branch, dependency, configuration, implementation, or verification change
---

# Repository overlay — web-builder / main

## Verified repository facts

- The repository remote is `https://github.com/surajsibi/web-builder.git`.
- The inspected branch is `main` at `081e7dd580ec15ba5d4bbea1b64a8c731605424b`.
- The project uses Next.js 16.3.0, React 19.2.8, pnpm 10.33.0, Vitest 4.1.10, jsdom 30.0.1, Zustand 5.0.14, and Zod 4.4.3.
- `package.json` does not declare `engines`; `.nvmrc` and a GitHub Actions workflow are absent.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent.

## Provisional assumptions

- Node 24 LTS is the proposed supported runtime. Validate a fresh install and full verification matrix before treating this as approved repository policy.
- A 50-entry history cap is the proposed initial memory bound. Validate retained memory and product expectations before approval.

## Constraints

- Read the applicable installed Next.js 16 documentation before editing Next.js source or configuration.
- Preserve full hydration validation for untrusted input.
- Preserve unrelated user work and workspace records.

## Risks

- Scoped validation can weaken project invariants unless it is compared against the full validator.
- A runtime pin without storage isolation can hide rather than resolve the reported test-environment coupling.
- A local-only rate limiter would imply protection that does not survive distributed or serverless deployment.
