---
doc_id: WEB-BUILDER-POSITION-MOVE-MODE-WORKSPACE
type: D4
scope: Execution state for explicit Canvas move mode in web-builder
authority: Selected feature execution-state authority; code, tests, and verified runtime behavior remain authoritative for implementation
owner: Project owner
lifecycle: in_review
freshness: Verified on 2026-08-13 through 458 automated tests, lint, TypeScript, production build, and rendered Chrome interaction checks; invalidated by a positioning interaction, branch, implementation, or verification change
---

# Position move mode workspace

**Feature name:** Position move mode

**Feature directory identifier:** `position-move-mode`

**Overall status:** Implemented, verified, and approved for publication

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/position-move-mode`, created from `main` at `4e3e7a3df0f0b37c2fc184d90f495414d243875c`

**Current milestone:** Publish the feature branch and proceed through pull-request review.

**Feature summary:** Keep normal Canvas selection visually clean, preserve exact responsive X/Y controls in the Inspector, and expose direct pointer and keyboard movement only while the user explicitly activates Move on canvas.

## Scope

- Hide the circular position handle during normal selection.
- Add an explicit Move on canvas toggle to the Position Inspector group for eligible nodes.
- Reuse the existing pointer preview, commit, cancel, announcement, and responsive style-command path while move mode is active.
- Preserve arrow-key nudging, Enter commit, Escape cancel, structural drag-and-drop, and positioning eligibility restrictions.
- Add behavior-first coverage for inactive, active, restricted, and cancellation states.

## Out of scope

- Changing the persisted position-offset model or responsive inheritance.
- Enabling positioning for roots, container-capable nodes, or resolved absolute, fixed, or sticky nodes.
- Changing structural Canvas or Layers drag-and-drop.
- Adding snapping, alignment guides, or new offset units.

## Risks and trade-offs

- Removing the default handle reduces visual obstruction but makes direct Canvas movement one action less discoverable.
- Move mode exits on selection and competing visual-mode changes and becomes inert during text editing or structural dragging.
- Keyboard instructions and pressed state must remain perceivable without relying on the Canvas icon alone.

## Execution state

- **Current step:** Publish the verified branch and proceed through pull-request review.
- **Done:** Added the explicit transient position visual mode, a Position Inspector toggle, focus transfer to the temporary Canvas handle, default handle removal, restricted-node gating, and behavior-first interaction coverage. The user reviewed all supported movable components and approved publication.
- **Verification:** On Node 24.19.0, all 32 test files and 458 tests, full lint, full TypeScript, and the production build pass. Rendered Chrome checks confirm inactive, active, keyboard commit, deactivated, restricted, and narrow-row layout states.
- **Remaining:** Pull-request review and merge.
- **Last left off:** 2026-08-13 - Explicit Move on canvas mode is implemented, verified, reviewed, and approved for publication on `feature/position-move-mode`.
