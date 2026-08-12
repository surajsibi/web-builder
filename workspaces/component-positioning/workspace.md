---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-WORKSPACE
type: D4
scope: Execution state for planning and implementing responsive visual component positioning in web-builder
authority: Selected execution-state authority for component positioning; the execution plan owns intended work, while code, tests, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Created on 2026-08-12 from main at e15cd9f798ad7b90ee7a9526627af73d583e346b and assigned to feature/component-positioning on 2026-08-12; invalidated by a positioning scope decision or relevant style, command, Canvas, Inspector, rendering, or document-schema change
---

# Component positioning workspace

**Feature name:** Component positioning

**Feature directory identifier:** `component-positioning`

**Overall status:** Planning complete; implementation branch created and ready for baseline verification

**Participating repositories:** `web-builder`

**Active branches:** `feature/component-positioning`, created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b`. Repository context: [branch workspace](../../branches/web-builder/feature-component-positioning/README.md).

**Current milestone:** Review and approve the recommended responsive visual-offset design, then establish the implementation baseline on the active feature branch.

**Feature summary:** Let users visually move a selected component on the Canvas without replacing the existing structural drag-and-drop behavior. The recommended first release stores responsive X/Y offsets in the shared style model, exposes exact controls in the Inspector, provides a distinct pointer and keyboard Canvas movement mode, and commits each completed gesture through the existing validated style-command and undo/redo path.

**Selected execution plan:** [Component positioning implementation plan](plan/Component-Positioning-Implementation-Plan.md)

**Supporting research:** [Current positioning and movement baseline](research/current-positioning-and-movement.md)

## Evidence state

- Verified by bounded source inspection: Canvas and Layers drag-and-drop already perform structural `node.move` operations using parent-and-index destinations.
- Verified by bounded source inspection: the persisted style model and Inspector support CSS `position` and `zIndex`, but no X/Y position offsets.
- Verified by bounded source inspection: the shared visual-editing path already previews pointer and keyboard changes before committing one `node.updateStyles` command.
- Verified from the completed Phase 5 plan: freeform positioning and absolute-position dragging were intentionally excluded because the style schema had no offset fields.
- Proposed, not approved: add one atomic responsive visual-offset value compiled through the shared renderer and edited through a separate Canvas positioning mode.

## Execution state

- **Current step:** Review the draft execution plan and recommended data/interaction contract before beginning CP-01.
- **Done:** Established the feature workspace, recorded the verified baseline, produced the implementation plan, and created `feature/component-positioning` from the verified `main` commit.
- **Verification:** All three Markdown files contain the required manifests, every local link resolves, and no trailing whitespace was found on 2026-08-12. Human scope and technical review remain pending.
- **Remaining:** Approve or revise the scope, establish the implementation baseline, and execute the ordered plan. Pre-existing API data-binding documentation changes remain outside this feature and must not be staged or modified here.
- **Last left off:** 2026-08-12 - Switched to `feature/component-positioning`; branch records created and no application-code change has been made.
