---
doc_id: WEB-BUILDER-COMPONENTS-WORKSPACE
type: D4
scope: Execution state for connected block-template infrastructure and one state-powered Disclosure in web-builder
authority: Selected feature execution-state authority for connected state blocks; code, schemas, tests, and verified runtime behavior remain authoritative for implemented behavior
owner: Suraj
lifecycle: draft
freshness: CSB-09 accountable exception closure, the final post-remediation 619-test rerun, production build/startup verification, Firefox 153.0 Disclosure smoke, approved verification-closure amendment, and CSB-10 completion recorded through 2026-08-19 for the feat/connected-state-blocks working tree based at c032701e52c5c8046a32d9365b8f5782fb75bbc6; invalidated by a scope, branch, ownership, plan-review, block-template, Boolean State, Button, implementation, benchmark, runtime, browser, assistive-technology, documentation, verification, or accountable-decision change
---

# Components workspace

**Feature name:** Connected State Blocks and Disclosure

**Feature directory identifier:** `components`

**Overall status:** **CSB-10 complete; implementation report approved with one exception.** Under Node 24.19.0, typecheck and full ESLint pass, and the final post-remediation serialized suite passes 619 of 619 tests across 41 files in 188.65 seconds. The final Next.js 16.3.0 optimized production build succeeds in 45.43 seconds, starts in 310 ms, and returns HTTP 200 for `/` with a 79,945-byte HTML response. Chrome 151.0.7922.138 verifies the Editor and Preview at the 1440 x 900 and 390 x 844 viewport overrides without page-level horizontal overflow. Disclosure insertion, configuration repair, pointer, Enter, Space, truthful `aria-expanded`, focus retention, continued navigation, and desktop/mobile Preview behavior pass. The narrow Editor and extension-injected Preview hydration warning found during the first browser run were remediated; Node 24.19.0 typecheck, focused ESLint, the 69-test Editor Shell suite, the final 619-test suite and production build/startup check, post-fix Chrome interaction, reflow, and console checks pass. A Playwright 1.62.1 headless Firefox 153.0 smoke at 1440 x 900 also passes Editor loading with HTTP 200, Disclosure insertion, pointer expansion and collapse, truthful `aria-expanded`, zero console/page errors, and the horizontal-overflow and obvious visual-regression checks. Suraj approved the implementation report and verification-closure amendment with NVDA/Firefox as the sole remaining documented exception. Unexecuted true-browser-zoom, Firefox responsive, and Firefox keyboard cases are outside the approved delivery scope and are not passes. Durable architecture, the existing Boolean State tutorial, the approved D5 implementation report, both verification reviews, and execution trackers are synchronized, and documentation integrity validation passes. Project schema remains 3, the public command result remains unchanged, and no architecture or adopter scope changed. Dismissible Announcement and every self-unmounting focused-control pattern remain outside scope.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feat/connected-state-blocks`, created from `main` at `c032701e52c5c8046a32d9365b8f5782fb75bbc6`.

**Current milestone:** Prepare the confirmed feature-only commit and draft PR. GitHub authentication is valid and the approved scope excludes `ANALYZE_UP_PROJECT_GUIDE.md` and `tmp/`. CSB-10 documentation and accountable report review are complete; NVDA/Firefox is the sole remaining documented exception, and no unexecuted case may be represented as passing evidence.

**Feature summary:** Extend the existing block-template compiler so one atomic insertion can create ordinary editable components, a nonvisual Boolean State, and safe internal connections using temporary template-local keys that never enter persisted project data. The only planned adopter is an accessible state-powered Disclosure with explicit persisted Button/state/panel configuration and non-mutating effective semantics.

**Selected execution plan:** [Connected state blocks implementation plan](plan/Connected-State-Blocks-Implementation-Plan.md)

**Planning research:** [Connected-block template analysis](research/connected-block-template-analysis.md)

**Plan review:** [Connected State Blocks plan review](review/connected-state-blocks-plan-review.md)

**Gate 1 sign-off worksheet:** [Connected State Blocks accountable re-review checklist](review/connected-state-blocks-accountable-re-review-checklist.md)

**CSB-09 exception review:** [Connected State Blocks release-exception review](review/connected-state-blocks-release-exception-review.md)

**Verification closure review:** [Connected State Blocks verification-closure review](review/connected-state-blocks-verification-closure-review.md)

**Usage guide:** [Boolean State connections and Disclosure tutorial](../navbar/notes/Boolean-State-Connections-Tutorial.md)

**Implementation report:** [Connected State Blocks implementation report](reports/Connected-State-Blocks-Implementation-Report.md)
