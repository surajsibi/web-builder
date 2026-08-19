---
doc_id: WEB-BUILDER-CONNECTED-STATE-BLOCKS-RELEASE-EXCEPTION-REVIEW
type: Q2
scope: Accountable accessibility and release decision for Connected State Blocks after partial CSB-09 execution
authority: Accountable exception record for progression from CSB-09 to CSB-10; code, tests, verified runtime behavior, and retained evidence remain authoritative for what actually passed
owner: Suraj
lifecycle: approved
freshness: Accountable exception recorded from Suraj's explicit 2026-08-18 instruction on feat/connected-state-blocks based at c032701e52c5c8046a32d9365b8f5782fb75bbc6 and linked on 2026-08-19 to its verification-closure amendment; the original findings remain immutable and current disposition is owned by the amendment
risk: R2 because the decision accepts missing browser-zoom, Firefox, NVDA, and post-remediation full-suite/build evidence
amended_by: WEB-BUILDER-CONNECTED-STATE-BLOCKS-VERIFICATION-CLOSURE-REVIEW
---

# Accessibility and release review: Connected State Blocks exceptions

## Question, scope, and baseline

This review decides whether `feat/connected-state-blocks` may close CSB-09 and begin CSB-10 despite four known evidence gaps. The baseline is the uncommitted feature working tree based at `c032701e52c5c8046a32d9365b8f5782fb75bbc6` on 2026-08-18.

The later [verification closure review](connected-state-blocks-verification-closure-review.md) records Suraj's 2026-08-19 report approval, the subsequent passing evidence, and the narrowed sole remaining NVDA/Firefox exception. The findings below remain the immutable record of the earlier decision.

The executed evidence includes the Node 24.19.0 release suite and production build before the final responsive/root-layout remediation, focused Node 24.19.0 checks afterward, and Chrome 151.0.7922.138 Editor/Preview viewport, interaction, focus, reflow, and console verification. The excluded evidence is listed as findings below and must not be described as passed.

## Criteria and method

- Apply the approved [CSB-09 browser and accessibility matrix](../plan/Connected-State-Blocks-Implementation-Plan.md#browser-and-accessibility-matrix) and [Gate 5](../plan/Connected-State-Blocks-Implementation-Plan.md#gate-5-regression-and-release) criteria.
- Separate executed evidence from accountable risk acceptance.
- Preserve the WAI-ARIA Disclosure requirement that the native Button's expanded state remain truthful; do not infer Accordion behavior or `aria-controls` support.
- Treat the Accountable Owner's explicit direction as authority to waive the remaining evidence only for this delivery decision.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSB-EX-01 | The full 619-test suite and production build passed before the responsive CSS and root-layout remediation, but were not rerun afterward. Post-remediation Node 24.19.0 typecheck, focused layout ESLint, the 69-test Editor Shell spec, live development compilation, and Chrome checks pass. | Medium | A cross-surface regression outside the focused changed surface could remain undetected. | Rerun the full suite and production build after the remediation when the owner next requires complete release evidence. | Suraj | Full Node 24.19.0 serialized suite and production build pass at the final source revision. | Accepted exception |
| CSB-EX-02 | True Chrome 100%/200% browser zoom was not executable through the connected browser. A 195 x 422 CSS-pixel reflow proxy passes without overflow but is not zoom evidence. | Medium | Browser-zoom-specific behavior may differ from equivalent narrow reflow. | Execute the declared Chrome zoom rows if zoom support becomes available or a zoom regression is reported. | Suraj | Chrome Editor and Preview pass the named viewport matrix at true 100% and 200% zoom. | Accepted exception |
| CSB-EX-03 | Firefox was not installed or discoverable, so its Editor/Preview viewport and zoom matrix was not executed. | Medium | Firefox-specific layout or interaction behavior remains unverified. | Execute the named Firefox matrix when Firefox support is required or a browser-specific regression is reported. | Suraj | Current stable Firefox passes the named Editor/Preview viewport and zoom rows. | Accepted exception |
| CSB-EX-04 | NVDA with Firefox was unavailable, so no accountable assistive-technology review of name, role, expanded state, state changes, omission behavior, or Inspector warning discoverability was performed. | High | Automated and Chrome evidence cannot prove the intended screen-reader experience. | Perform the named NVDA/Firefox review before representing that matrix as verified. | Suraj | Accountable NVDA/Firefox review records every named result. | Accepted exception |

## Positive controls verified

- Node 24.19.0 typecheck, full ESLint, 619 serialized tests, the pre-remediation production build, and local production HTTP response passed.
- The compiler benchmark stayed below the accepted 10% median and p95 regression ceiling.
- Post-remediation Node 24.19.0 typecheck, focused layout ESLint, and all 69 Editor Shell tests passed.
- Chrome 151.0.7922.138 passed 1440 x 900 and 390 x 844 Editor/Preview viewport checks without page-level horizontal overflow, including both side panels expanded at the narrow size.
- Disclosure insertion, configuration repair, pointer/Enter/Space activation, truthful effective `aria-expanded`, Button focus retention, continued navigation, desktop/mobile Preview behavior, and clean Editor/Preview consoles passed in Chrome.

## Decision and constraints

**Decision: Approve progression to CSB-10 with documented exceptions.**

After the four remaining steps were presented, Suraj instructed: **"skip 1,2,3 start with 4"**. Suraj is the recorded Accountable Owner and Accessibility Verifier for this feature. This instruction accepts CSB-EX-01 through CSB-EX-04, authorizes CSB-09 closure by exception, and authorizes CSB-10 documentation and review preparation.

This is not a claim that the skipped checks passed. Release notes, the implementation report, branch context, and any PR must name the exceptions. The decision does not expand feature scope, add another interactive adopter, change project schema version 3, or turn Disclosure into an Accordion.

## Residual risk and follow-up

Suraj owns the accepted residual risk. Reopen the applicable finding when:

- a change touches connected-template compilation, Button Disclosure configuration, effective semantics, responsive Editor layout, hydration boundaries, or the relevant test harness;
- Chrome zoom, Firefox, or NVDA exposes a regression;
- supported-browser or accessibility policy requires the skipped matrix; or
- the feature is represented as having passed evidence that remains unexecuted.
