---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-UX-ACCESSIBILITY-REVIEW
type: Q2
scope: CP-01A interaction and accessibility review for responsive visual component positioning in web-builder
authority: This review owns retained CP-01A prototype evidence and the production-UI gate; the execution plan owns intended behavior, and accountable human review owns approval
owner: Project owner
lifecycle: in_review
freshness: Automated prototype evidence and project-owner implementation approval recorded on 2026-08-12; invalidated by a prototype, task script, threshold, supported-device/browser, affordance, accessibility, or application-interaction change
---

# UX and accessibility review: Component positioning affordance

## Question, scope, and baseline

Can one primary positioning affordance let users move a selected component with pointer, touch, and keyboard input without colliding with structural drag-and-drop or making an off-canvas component unrecoverable?

The review compares a selected-node position handle, a dedicated positioning mode, and a modifier-assisted accelerator using the [disposable CP-01A prototype](../assets/positioning-affordance-prototype.html). The prototype does not load or write builder documents and is not production application code.

Automated browser evidence covers interaction mechanics, accessible names and status output, compact layout, touch-target size, and recovery controls. It does not replace the representative-user study, supported touch-device exercise, screen-reader/browser review, or accountable approvals required by the implementation plan.

## Criteria and method

- Apply the thresholds in [CP-01A positioning UX validation](../plan/Component-Positioning-Implementation-Plan.md#cp-01a-positioning-ux-validation).
- Preserve an independent structural-drag control; the prototype represents only visual positioning.
- Exercise selection-handle pointer drag, keyboard start/nudge/commit/cancel, dedicated-mode activation, modifier fallback, exact Inspector input, large off-canvas recovery, and active status announcements.
- Verify a minimum 44-by-44 CSS-pixel primary touch target and a compact 820-by-800 viewport.
- Inspect browser console warnings and errors.
- Treat automation as mechanical evidence only. Do not infer discoverability, cognitive load, real touch usability, screen-reader quality, or human approval.

## Findings

| ID | Finding and evidence | Severity | Impact | Recommendation | Owner | Closure test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UX-01 | The required five-user task study has not occurred. Automation cannot measure uncoached discovery or task comprehension. | High | CP-01A cannot select or approve a production primary affordance. | Run the approved task script with at least five representative users and retain timing and coaching evidence. | Project owner and interaction owner | At least four users complete first movement without coaching within 30 seconds; every off-canvas recovery task meets the approved threshold. | Open |
| UX-02 | No accountable accessibility reviewer has exercised name, role, state, focus order, visible focus, instructions, and announcements with a supported screen-reader/browser pair. | High | Production UI approval would be unsupported. | Complete the required accessibility review and record defects, retests, and approval. | Accessibility reviewer | The CP-01A accessibility row passes with retained reviewer evidence. | Open |
| UX-03 | The 48-by-48 CSS-pixel position handle and `touch-action: none` pass mechanical inspection, but no supported physical touch device has exercised the full task. | High | Touch reachability, drag behavior, and cancellation remain unverified. | Run the primary workflow on at least one supported touch device without hover or a hardware modifier. | Interaction owner and accessibility reviewer | Start, move, commit, cancel, and recovery all complete on the supported device. | Open |
| UX-04 | Automated browser checks passed selection-handle pointer drag, 1 px and 10 px keyboard movement, Enter commit, Escape cancel, dedicated-mode gating, and modifier keyboard fallback. | Low | The candidate mechanics are testable without changing builder documents. | Retain the prototype as the human-review harness; do not promote it to application code. | Technical verifier | Repeat after any prototype or task-script change with zero console errors. | Closed |
| UX-05 | Exact Inspector inputs initially committed only on `change`; browser exercise exposed delayed feedback. The prototype now commits on `input`, including X 2000 and Y -1200 followed by Layers selection and Inspector reset. | Medium | The original prototype obscured immediate value feedback and weakened the recovery exercise. | Keep immediate prototype feedback and require production controls to use the repository's validated draft/commit convention. | Interaction owner and implementer | Large positive/negative input, Layers recovery, and reset remain observable and deterministic. | Closed |

## Positive controls verified

- Selection-handle pointer drag committed one simulated change from X 0/Y 0 to X 70/Y 36.
- Keyboard preview moved 1 pixel with Arrow and 10 pixels with Shift+Arrow; Enter committed and Escape restored the session start.
- Dedicated mode rejected movement until activation, then permitted keyboard preview and cancellation.
- The modifier variant rejected unmodified pointer activation while retaining the same keyboard-accessible position control.
- Inspector input accepted X 2000/Y -1200, Layers selection reported the off-canvas values, and Inspector reset restored X 0/Y 0.
- The position handle measured 48 by 48 CSS pixels at the default and 820-by-800 compact viewports and retained `touch-action: none`.
- The controls expose accessible button, spinbutton, complementary-region, region, and polite status semantics in the browser accessibility snapshot.
- The browser console reported no warnings or errors during the final interaction and compact-layout checks.

## Decision and constraints

**Approved for implementation with retained release follow-up.** On 2026-08-12, the project owner confirmed review and authorized implementation of the selected-node position handle as the primary affordance. Dedicated mode is rejected for V1. Modifier-assisted movement remains accelerator-only and cannot satisfy the primary touch or keyboard path.

The approval closes CP-01A as an implementation blocker and explicitly accepts the reduced retained evidence. It does not assert that the missing five-user study, supported physical-touch exercise, or screen-reader/browser review occurred. UX-01 through UX-03 remain open and must close before a public release of the production positioning UI.

## Residual risk and follow-up

- Automation does not establish discoverability, learnability, comfort, or assistive-technology quality.
- The prototype does not include production resize, spacing, inline-text, form-control, or structural-drag implementations, so human conflict trials remain mandatory.
- The application must still verify one history transaction, command validation, responsive origin/reset behavior, and Canvas/Preview parity after implementation is authorized.
- Re-run this review when the primary affordance, task script, thresholds, supported browsers/devices, or accessibility behavior changes.
