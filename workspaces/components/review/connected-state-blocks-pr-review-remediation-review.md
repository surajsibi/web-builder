---
doc_id: WEB-BUILDER-CONNECTED-STATE-BLOCKS-PR-REVIEW-REMEDIATION-REVIEW
type: Q2
scope: Remediation and verification of the six review findings raised on pull request 10 for feat/connected-state-blocks
authority: Current review-remediation assessment; source, tests, generated benchmark evidence, and verified runtime behavior remain authoritative
owner: Suraj
lifecycle: in_review
freshness: Verified on 2026-08-19 against committed source revision 40de821543b873d941f39da9030c7e8e2e06780e plus the generated evidence and documentation changes recorded by this review; invalidated by a relevant source, dependency, benchmark, browser, accessibility, documentation, branch, or review-decision change
risk: R2 because NVDA with Firefox remains the sole accepted release-verification exception
amends: WEB-BUILDER-CONNECTED-STATE-BLOCKS-VERIFICATION-CLOSURE-REVIEW, WEB-BUILDER-CONNECTED-STATE-BLOCKS-ACCOUNTABLE-RE-REVIEW-CHECKLIST, WEB-BUILDER-CONNECTED-STATE-BLOCKS-IMPLEMENTATION-PLAN, WEB-BUILDER-CONNECTED-STATE-BLOCKS-IMPLEMENTATION-REPORT
---

# Code and verification review: Connected State Blocks PR remediation

## Question, scope, and baseline

This review determines whether the six findings raised on [pull request 10](https://github.com/surajsibi/web-builder/pull/10) are real and whether the implemented remediation is ready for PR re-review. It covers integration with `main` at `84923dc`, Disclosure viewport repair, effective-semantics diagnostics, shared-structure repair atomicity, portable benchmark evidence, and the delivered tutorial location.

The verified code baseline is commit `40de821543b873d941f39da9030c7e8e2e06780e`, descended from merge commit `8a206d2`. Generated benchmark assets and this documentation amendment follow that committed source. The earlier [verification closure review](connected-state-blocks-verification-closure-review.md) remains the immutable record of Suraj's approval for the earlier working tree; its 41-file/619-test, build, and Firefox observations were invalidated by later source and dependency changes and are superseded for the current tree by this review's fresh evidence. No NVDA/Firefox evidence was added.

## Criteria and method

- Reproduce each behavioral finding with a behavior-first regression before accepting a fix.
- Preserve `main`'s required injected Editor store and project-dashboard routing while retaining the feature.
- Require a single user action to leave the document unchanged when any shared-structure move is invalid.
- Require benchmark artifacts to use repository-relative paths, UTF-8 text, exact source/harness identities, and retained raw samples.
- Treat the approved plan and checklist as historical records; amend their delivered documentation-path disposition explicitly instead of creating a duplicate tutorial.
- Rerun Node 24.19.0 typecheck, full ESLint, the serialized complete suite, a fresh production build/startup check, and the scoped Firefox 153.0 Disclosure smoke.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSB-PR-01 | The branch conflicted with current `main`; `main` had removed the singleton `editor-store.ts` and made `EditorShell.store` required. The merge inspected all overlapping Editor files, preserved injected stores and dashboard routing, and resolved the direct CSS/Vitest conflicts without restoring the singleton. | Blocking | The PR could not merge and a careless resolution could reintroduce obsolete shared state. | Merge current `main`, preserve both feature and dashboard behavior, and rerun integration verification. | Implementer | The branch contains `84923dc`, has no unmerged paths, no `editorStore` import/default remains, and full verification passes. | Closed — fixed and verified |
| CSB-PR-02 | Responsive reveal used `node.hide` with `hidden: false`, which removes only a local tablet/mobile override and no-ops when `display: none` is inherited. The repair now writes an explicit active-viewport display value derived from the component default. | High | “Show at this viewport” could leave content hidden and Disclosure semantics disabled. | Write an explicit visible override and cover desktop-to-tablet and tablet-to-mobile inheritance. | Implementer | Both inherited-hide Editor regressions pass and verify `display: block` at the repaired viewport. | Closed — fixed and verified |
| CSB-PR-03 | Inspector evaluation passed no runtime and previously returned the generic runtime-unavailable result before detecting ancestor visibility bindings, allowing a misleading “Ready” message. The evaluator now reports `ancestor-runtime-unavailable`; Inspector renders an informational live-runtime warning and never offers readiness or destructive clearing for that state. | Medium | Inspector and Canvas/Preview could disagree about whether effective semantics are available. | Distinguish ancestor runtime dependence before the generic no-runtime result and test live-hidden and Inspector-only paths. | Implementer | Evaluator and Editor regressions pass for missing runtime and a live ancestor that hides content. | Closed — fixed and verified |
| CSB-PR-04 | Shared-structure repair dispatched the state move before learning that a later content move was invalid. The action now dry-runs every required move against the same original snapshot before dispatching any move. | Medium | A rejected repair could partially mutate the document. | Preflight the complete repair or introduce one transactional command. | Implementer | The locked-content regression reports rejection and proves both original parents remain unchanged. | Closed — fixed and verified |
| CSB-PR-05 | The original benchmark metadata named an uncommitted candidate; JSON contained absolute paths and empty samples; UTF-16 logs appeared binary. The regenerated artifacts identify baseline `c032701`, candidate `40de821`, the shared harness/reporter/config blobs, repository-relative paths, SHA-256 digests, UTF-8/LF logs, and all 50 samples per case. | Medium | A reviewer could not independently identify the candidate or recompute nearest-rank p95. | Bind evidence to committed revisions, sanitize paths/encoding, and retain raw samples. | Implementer | Parsed artifacts contain no machine-local path or NUL byte; independently recomputed p95 matches the recorded values. | Closed — fixed and verified |
| CSB-PR-06 | The approved plan/checklist expected a new tutorial under `workspaces/components/notes/`, while delivery deliberately extended the existing canonical Boolean State tutorial under `workspaces/navbar/notes/`. The historical expectation is now explicitly amended to the delivered canonical guide rather than duplicated. | Low | The accepted documentation record contradicted the actual link and workspace ownership. | Record the location amendment in the plan/checklist disposition and link this review from active delivery records. | Documentation owner | The plan, checklist, report, workspace, and branch trackers point to this amendment and one canonical tutorial. | Closed — amended; owner re-review pending |

## Positive controls verified

- The behavior-first focused command passed 91 of 91 tests across the Disclosure semantics and Editor Shell files in 73.64 seconds.
- Node 24.19.0 `tsc --noEmit` and full `eslint .` passed after merging the locked dependency set from `main`.
- The exact serialized command `pnpm dlx node@24.19.0 node_modules/vitest/vitest.mjs run --maxWorkers 1 --no-file-parallelism` passed 48 files and 669 tests with 0 failures in 285.05 seconds. The larger count supersedes, rather than contradicts, the earlier 41-file/619-test evidence.
- `pnpm dlx node@24.19.0 node_modules/next/dist/bin/next build` completed the Next.js 16.3.0 production build with exit code 0 in 24.07 seconds. The built server reported ready in 217 ms; `/` returned HTTP 200 with a 6,967-byte response, and the verification process was stopped.
- Playwright 1.62.1 headless Firefox 153.0 at 1440 × 900 loaded a newly created project Editor, inserted Disclosure, changed content visibility `false → true → false`, changed `aria-expanded` `false → true → false`, recorded zero console/page errors and zero horizontal overflow, and passed scripted geometry plus visual inspection of the Editor and expanded Preview.
- The same-machine benchmark ran baseline first with 10 warm-ups and 50 samples. Commerce Navbar measured 56.7057 ms baseline versus 58.5483 ms candidate median (+3.25%) and 90.6095 ms baseline versus 86.1221 ms candidate nearest-rank p95 (-4.95%), both within the accepted 10% ceiling. Candidate Disclosure measured 38.4245 ms median and 51.1941 ms p95.

## Decision and constraints

**Decision: The six findings are real and are technically remediated; the branch is ready for PR re-review.**

This assessment does not infer accountable approval of the new source revision. The earlier implementation-report approval and its NVDA/Firefox exception remain historical decisions. Suraj or the PR reviewer must accept the current remediation before this Q2 record can move from `in_review` to `approved`.

The known parent-lockfile warning remains non-blocking and unchanged. The Firefox check remains headless, desktop, and pointer-only. Unexecuted true browser zoom, Firefox responsive/keyboard rows, and NVDA/Firefox are not represented as passes; under the existing accountable scope decision, only NVDA/Firefox remains a documented release exception.

## Residual risk and follow-up

NVDA with Firefox remains the sole documented exception because no assistive-technology evidence is available for accessible name, role, expanded state, state-change announcement, omission behavior, or Inspector warning discoverability. Reopen this review if PR re-review finds a regression, the branch changes, benchmark inputs change, or NVDA/Firefox evidence becomes available.
