---
doc_id: WEB-BUILDER-FEATURE-POSITION-MOVE-MODE-OVERLAY
type: A1
scope: Repository-specific facts and constraints for explicit Canvas move mode on feature/position-move-mode
authority: Repository-specific overlay for the linked feature; code, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: in_review
freshness: Verified on 2026-08-13 through implementation, automated tests, static checks, production build, and rendered Chrome interaction checks; invalidated by a positioning interaction, implementation, or verification change
---

# Repository overlay - web-builder / feature/position-move-mode

## Verified repository facts

- Responsive position offsets and the selected-node Canvas position handle were merged through PR #4 and are present in `main`.
- Exact responsive X/Y controls already exist in the Position Inspector group.
- The Canvas position handle already owns pointer preview/commit/cancel, keyboard nudge, announcements, and focus continuity.
- Structural Canvas and Layers dragging use a separate node-move path and must remain unchanged.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent.
- Normal Canvas selection no longer renders the position handle. The Inspector activates it through the transient `position` visual-overlay mode.
- Activating Move on canvas focuses the temporary handle so arrow-key preview, Shift-arrow movement, Enter commit, and Escape cancellation use the existing gesture path.
- The Position Inspector disables Move on canvas wherever central positioning eligibility rejects offset writes.
- Changing the CSS Position value while move mode is active exits the mode before applying the style change.

## Provisional assumptions

- None.

## Constraints

- Read the installed Next.js documentation before editing Next.js source or global CSS.
- Keep responsive offset resolution, command validation, eligibility, Preview parity, and Undo/Redo behavior unchanged.
- Move mode must be explicit, keyboard accessible, and mutually exclusive with text, spacing, layout, and structural drag interactions.
- Preserve the untracked Label control-size prototype as unrelated user-visible work.

## Risks

- A stale active mode after selection or eligibility changes could expose a handle for the wrong node.
- Hiding the normal-selection handle reduces direct-movement discoverability unless the Inspector control has clear labeling and pressed state.
- Reusing keyboard ownership without explicit focus could intercept arrow keys intended for another control.
