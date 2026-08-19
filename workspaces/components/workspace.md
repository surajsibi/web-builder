---
doc_id: WEB-BUILDER-COMPONENTS-WORKSPACE
type: D4
scope: Execution state for connected block-template infrastructure and one state-powered Disclosure in web-builder
authority: Selected feature execution-state authority for connected state blocks; code, schemas, tests, and verified runtime behavior remain authoritative for implemented behavior
owner: Suraj
lifecycle: draft
freshness: Current-main integration and all six PR-review remediations are verified through committed source 40de821543b873d941f39da9030c7e8e2e06780e, portable benchmark evidence, the 48-file/669-test rerun, fresh production build/startup check, Firefox 153.0 smoke, and synchronized in-review amendment on 2026-08-19; invalidated by a scope, branch, ownership, plan-review, block-template, Boolean State, Button, implementation, benchmark, runtime, browser, assistive-technology, documentation, verification, pull-request, or accountable-decision change
---

# Components workspace

**Feature name:** Connected State Blocks and Disclosure

**Feature directory identifier:** `components`

**Overall status:** **CSB-10 remains complete; six PR findings are remediated and await re-review.** The branch includes current `main`, preserves injected Editor stores, writes explicit responsive visibility overrides, distinguishes ancestor runtime dependence, and preflights shared-structure repair atomically. Under Node 24.19.0, typecheck and full ESLint pass; the focused regression passes 91 tests and the serialized full suite passes 669 of 669 tests across 48 files in 285.05 seconds. The fresh Next.js 16.3.0 production build succeeds in 24.07 seconds, reports ready in 217 ms, and returns HTTP 200 for the dashboard `/` route. Refreshed portable benchmark evidence records +3.25% median and -4.95% p95 legacy insertion regression, within the accepted 10% ceiling. Playwright 1.62.1 headless Firefox 153.0 at 1440 x 900 passes new-project Editor loading, Disclosure insertion, pointer expansion/collapse, truthful `aria-expanded`, zero console/page errors, zero horizontal overflow, geometry, and visual inspection. Suraj's earlier implementation-report approval remains historical; the current [PR-review remediation review](review/connected-state-blocks-pr-review-remediation-review.md) is `in_review`. NVDA/Firefox remains the sole documented exception, and no unexecuted case is represented as passing evidence.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feat/connected-state-blocks`, created from `main` at `c032701e52c5c8046a32d9365b8f5782fb75bbc6`.

**Current milestone:** Commit and push the generated evidence/documentation amendment after source commit `40de821`, update [draft PR 10](https://github.com/surajsibi/web-builder/pull/10), and request re-review. The unrelated untracked `ANALYZE_UP_PROJECT_GUIDE.md` remains excluded. NVDA/Firefox is the sole remaining documented exception.

**Feature summary:** Extend the existing block-template compiler so one atomic insertion can create ordinary editable components, a nonvisual Boolean State, and safe internal connections using temporary template-local keys that never enter persisted project data. The only planned adopter is an accessible state-powered Disclosure with explicit persisted Button/state/panel configuration and non-mutating effective semantics.

**Selected execution plan:** [Connected state blocks implementation plan](plan/Connected-State-Blocks-Implementation-Plan.md)

**Planning research:** [Connected-block template analysis](research/connected-block-template-analysis.md)

**Plan review:** [Connected State Blocks plan review](review/connected-state-blocks-plan-review.md)

**Gate 1 sign-off worksheet:** [Connected State Blocks accountable re-review checklist](review/connected-state-blocks-accountable-re-review-checklist.md)

**CSB-09 exception review:** [Connected State Blocks release-exception review](review/connected-state-blocks-release-exception-review.md)

**Verification closure review:** [Connected State Blocks verification-closure review](review/connected-state-blocks-verification-closure-review.md)

**PR-review remediation:** [Connected State Blocks PR-review remediation review](review/connected-state-blocks-pr-review-remediation-review.md)

**Usage guide:** [Boolean State connections and Disclosure tutorial](../navbar/notes/Boolean-State-Connections-Tutorial.md)

**Implementation report:** [Connected State Blocks implementation report](reports/Connected-State-Blocks-Implementation-Report.md)
