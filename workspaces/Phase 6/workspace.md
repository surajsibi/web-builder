---
doc_id: WEB-BUILDER-PHASE-6-WORKSPACE
type: D4
scope: Web builder Phase 6 preview-mode execution state
authority: Selected execution-state authority for the user-approved Phase 6 preview-mode feature; Project.md and verified implementation remain authoritative for product architecture and current behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: The original Preview delivery is verified by 127 automated tests, TypeScript, ESLint, a production build, and desktop/mobile browser evidence; the 2026-08-10 Container width-parity correction is verified by 42 current affected tests, focused ESLint, migration coverage, and 1920 px Chrome geometry, while unrelated incomplete linear-gradient work currently prevents a clean full-suite and typecheck rerun
---

# Phase 6 workspace

**Feature name:** Phase 6 — Preview Mode

**Feature directory identifier:** `Phase 6`

**Overall status:** Preview implementation and the bounded Container width-parity correction are complete; awaiting user review.

**Participating repositories:** None detected; the supplied workspace is not a Git worktree.

**Active branches:** Not applicable.

**Current milestone:** Review the corrected wide-screen Container behavior in Preview.

**Feature summary:** Add a Preview action to the editor toolbar and a dedicated preview route. Preview opens in a new browser tab, consumes a one-use snapshot of the active unsaved page through the normal hydration validator, resolves responsive styles from the real browser width, and renders only page components. A bounded correction makes new Containers fill their parent at wide Preview sizes and migrates the former hidden `72rem` version-1 cap to `100%`. Durable persistence, publishing, deployment, and source-code export remain excluded.

**Deliverables:**

- [Preview routing and state research](research/preview-routing-and-state.md)
- [Phase 6 implementation plan](plan/Phase-6-Preview-Mode-Plan.md)
- [Phase 6 validation report](reports/Phase-6-Preview-Mode-Validation-Report.md)

**Verification:** The original Preview delivery passed TypeScript, ESLint, 127 tests, and the Next.js production build. The Container correction passes 42 current affected tests and focused ESLint. Migration tests verify that `72rem` changes to `100%` while a custom `60rem` maximum is preserved. Chrome at 1920 px verifies a migrated/default Container at `max-width: 100%` and the authored 24 px page gutter instead of the previous 384 px centered margin. The current full suite reports 204 passing tests and eight unrelated linear-gradient failures; typecheck is blocked by the same incomplete gradient work.
