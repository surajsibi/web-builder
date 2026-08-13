---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-WORKSPACE
type: D4
scope: Execution state for planning and implementing responsive visual component positioning in web-builder
authority: Selected execution-state authority for component positioning; the execution plan owns intended work, while code, tests, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: in_review
freshness: Created on 2026-08-12 from main at e15cd9f798ad7b90ee7a9526627af73d583e346b, assigned to feature/component-positioning, revised after the positioning-plan and high-risk container-enablement reviews, reverified through the supported-Node automated matrix and retained available-Chrome scope, and updated after project-owner CP-10 approval on 2026-08-13; invalidated by a positioning scope, UX, eligibility, or review decision or relevant style, command, Canvas, Inspector, Layers, breadcrumbs, geometry, transform, rendering, publishing, runtime, browser-support, or document-schema change
---

# Component positioning workspace

**Feature name:** Component positioning

**Feature directory identifier:** `component-positioning`

**Overall status:** CP-00 through CP-10 are complete and project-owner approved; CP-09A is complete with every high-risk root and container-capable category restricted; accountable human, physical-device, and remaining supported-browser evidence still gates public release

**Participating repositories:** `web-builder`

**Active branches:** `feature/component-positioning`, created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b`; feature implementation commit `10736b0` is pushed to origin. Repository context: [branch workspace](../../branches/web-builder/feature-component-positioning/README.md).

**Current milestone:** Retain the five-user, physical-touch, accountable screen-reader/browser, and any additional supported-browser evidence required before public release. Roots and container-capable wrappers remain restricted.

**Feature summary:** Let users visually move a selected component on the Canvas without replacing the existing structural drag-and-drop behavior. The revised first-release plan stores atomic responsive X/Y offsets inside the shared responsive style layers, selects the primary pointer/touch/keyboard affordance through a measurable UX gate, preserves non-Canvas off-canvas recovery, exposes exact Inspector controls, keeps geometry reusable for later snapping/alignment, renders committed offsets through the shared semantic style path, and commits each completed gesture through the existing validated style-command and undo/redo path. Non-container flex/grid children can ship independently; roots and container-capable wrappers remain disabled until their stacking-context and containing-block gate passes.

**Selected execution plan:** [Component positioning implementation plan](plan/Component-Positioning-Implementation-Plan.md)

**Supporting research:** [Current positioning and movement baseline](research/current-positioning-and-movement.md)

**Interaction review:** [CP-01A UX and accessibility review](review/component-positioning-ux-accessibility-review.md)

**Implementation report:** [Responsive component positioning implementation report](reports/component-positioning-implementation-report.md)

## Evidence state

- Verified by bounded source inspection: Canvas and Layers drag-and-drop already perform structural `node.move` operations using parent-and-index destinations.
- Verified by bounded source inspection: the persisted style model and Inspector support CSS `position` and `zIndex`, but no X/Y position offsets.
- Verified by bounded source inspection: the shared visual-editing path already previews pointer and keyboard changes before committing one `node.updateStyles` command.
- Verified from the completed Phase 5 plan: freeform positioning and absolute-position dragging were intentionally excluded because the style schema had no offset fields.
- Verified in implementation and focused tests: one atomic signed px-only `positionOffset` lives in each existing responsive style layer, resolves atomically, compiles to individual CSS `translate`, and emits no translation when the resolved axes are both zero.
- Verified in implementation and focused tests: project schema version 2 migrates version-1 documents without content loss; canonical style commands distinguish set from reset and preserve Undo/Redo semantics.
- Verified in implementation and focused tests: one central evaluator restricts roots, container-capable wrappers, and resolved absolute/fixed/sticky nodes while allowing eligible non-container flex/grid children; reset remains available as a recovery action where safe.
- Verified in implementation, integration tests, and rendered exercise: the Inspector exposes exact responsive X/Y set/reset controls, identifies inherited versus active-layer values, and recovers an off-canvas leaf through Layers and breadcrumbs without Canvas hit-testing.
- Verified in implementation, integration tests, and rendered exercise: the selected-node Canvas handle supports pointer/touch preview plus keyboard nudge, commit, cancel, focus continuity, hit testing at translated geometry, and announcements without persisting gesture state. Rendered pointer testing found and closed a Canvas click-capture defect that cleared selection after a successful drag.
- Verified in rendered exercise: committed Canvas and Preview offsets match at desktop, tablet, and mobile, including inherited values, an explicit mobile zero override, and large positive and negative signed values.
- Verified in available Chrome Canvas and Preview: eligible leaves preserve exact offsets through five nested flex ancestors (`37px -19px`), five nested grid ancestors (`-23px 14px`), and five mixed flex/grid ancestors (`45px 21px`).
- Verified in available Chrome Canvas and Preview: a translated relative leaf with `z-index: 10` paints above and receives hit testing ahead of its overlapping sibling; a translated Input keeps exact `80px -150px` geometry and remains focusable, targetable, and editable in Preview.
- Recorded as the CP-09A restricted outcome: no root or container-capable category is enabled because the sticky/fixed-descendant, overlay, portal, nested-transform, and whole-subtree gate has not passed. The central evaluator continues to deny affordance, gesture-start, and command writes for those categories without blocking eligible non-container positioning.
- Verified by bounded source inspection: Canvas and Preview share responsive resolution, style compilation, and semantic node rendering. Published output is not implemented, so Published parity remains a future publishing gate rather than a V1 verification claim.
- Verified on checksum-matched Node 24.19.0 with pnpm 10.33.0: lint, typecheck, the complete serial suite of 456 tests across 32 files, and the Next.js production build pass.

## Execution state

- **Current step:** Collect the remaining accountable human/device/browser evidence without widening the centrally restricted container scope.
- **Done:** Established the feature and branch workspaces; completed CP-00 through CP-10; implemented the versioned offset contract, atomic responsive resolution, zero-output CSS translation, deterministic migration, explicit style set/reset commands, central eligibility, reusable geometry and gesture helpers, Inspector recovery controls, and the selected-node Canvas position handle. Added responsive-origin, off-canvas recovery, gesture-conflict, selection-continuity, duplication, block-created-leaf, structural-drag, hydration, history, shared Canvas/Preview, deep flex/grid/mixed hierarchy, leaf stacking, and form-control evidence. Recorded CP-09A as restricted, so roots, container-capable wrappers, and absolute/fixed/sticky nodes remain centrally disabled. Completed the supported-Node CP-10 machine matrix, synchronized verified durable architecture, published the implementation report, received project-owner approval, and pushed feature implementation commit `10736b0` to origin on 2026-08-13.
- **Verification:** Focused component-positioning core suites pass 185 tests; focused editor integration passes 109 tests. On checksum-verified Node 24.19.0 with pnpm 10.33.0, `pnpm lint`, `pnpm typecheck`, the full serial repository suite (456 tests across 32 files), and `pnpm build` pass. Rendered checks in available Chrome pass desktop/tablet/mobile Canvas/Preview parity, responsive origin and explicit zero, large signed offsets, Layers/breadcrumb recovery, pointer and keyboard commit/cancel, selection continuity, translated hit testing, five-level flex/grid/mixed layouts, leaf z-index paint order, and translated Input focus/entry. One React hydration diagnostic is attributable to the Chrome extension adding `cz-shortcut-listen` to `<body>`, not application markup.
- **Remaining:** Retain evidence for any supported browser not represented by available Chrome, and run the CP-01A five-user, supported physical-touch, and accountable screen-reader/browser exercises before public release. UX-01 through UX-03 remain public-release follow-ups. Pre-existing API data-binding documentation changes remain outside this feature and must not be staged or modified here.
- **Last left off:** 2026-08-13 - CP-00 through CP-10 are complete and project-owner approved, CP-09A keeps every high-risk category restricted, and feature implementation commit `10736b0` is pushed to origin. Resume with accountable public-release evidence; unrelated `prompt.md` and API-data-binding changes remain outside this feature.
