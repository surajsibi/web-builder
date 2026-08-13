---
doc_id: WEB-BUILDER-NAVBAR-WORKSPACE
type: D4
scope: Web builder reusable Boolean State interaction foundation plus reusable block infrastructure, Image primitive, editable Navbar logo surfaces, dedicated Navbar library section, responsive Navbar blocks, and All category mega-menu execution state
authority: Selected execution-state authority for the navbar feature; code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Updated with the reconciled Boolean-State-driven Drawer V1 implementation plan on 2026-08-13; Boolean State remains verified by 439 serialized automated tests, TypeScript, full ESLint, a production build, and applicable Editor/Preview browser QA and is invalidated by a related component, interaction, template, layout, verification, or review-status change
---

# Navbar block workspace

**Feature name:** Reusable Blocks and Responsive Navbar

**Feature directory identifier:** `navbar`

**Overall status:** Reusable Boolean State V1 is complete and accepted as the interaction foundation. The prior Image, Navbar, Commerce Navbar, template-thumbnail, content-rail, and responsive mega-menu work also remains implemented and verified.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feat/boolean-state-foundation`

**Current milestone:** Boolean State, State Action, and Conditional Content V1 are complete. The connected Drawer V1 architecture has been reconciled with that foundation and is ready for a separately authorized implementation pass.

**Feature summary:** Extend the Component Library with reusable Blocks that materialize validated component subtrees as one undoable document transaction and a reusable Image primitive in the Media family. Image accepts safe root-relative or HTTPS sources, including SVG files, explicit alternative text, an optional safe destination, protected new-tab behavior, and authored fit. The original Navbar's Saturn Home mark is now a linked Image node, while the Commerce Navbar's bag mark is an editable decorative Image beside the existing Brandname link; search, menu, chevron, and action icons remain decorative surfaces. Both Navbar templates retain their 1232px rails, full-width commerce row surfaces, template-backed thumbnails, and responsive All category mega menu. File uploads, an asset library, real commerce/search wiring, location selection, the More dropdown, persistence, publishing, and additional blocks remain outside scope.

**Boolean State V1 summary:** The Interactions family provides nonvisual page-scoped Boolean State, native State Action with Turn On/Turn Off/Toggle, and normally styled Conditional Content. One shared evaluator resolves Boolean conditions; runtime values remain outside the document and history; registry metadata drives page-aware candidate selection, diagnostics, and duplication policy; inactive Preview content unmounts and reopens with fresh descendant runtime state. Variants, conditional styling, existing-component bindings, connected templates, authored transitions, and Drawer conversion remain separate follow-up work.

**Selected execution plan:** [Navbar block implementation plan](plan/Navbar-Block-Implementation-Plan.md)

**Proposed interaction foundation plan:** [Boolean state interaction foundation plan](plan/Boolean-State-and-Conditional-Visibility-Plan.md)

**Proposed Drawer implementation plan:** [Boolean-State-driven connected Drawer V1 plan](plan/Connected-Drawer-Components-Plan.md)

**Architecture review:** [Boolean State interaction foundation architecture review](review/Boolean-State-Interaction-Foundation-Architecture-Review.md)

**Implementation report:** [Navbar block implementation report](reports/Navbar-Block-Implementation-Report.md)

**Boolean State implementation report:** [Boolean State interaction foundation implementation report](reports/Boolean-State-Foundation-Implementation-Report.md)

## Verification summary

- Boolean State V1 passes all 32 test files and 439 tests with serialized file execution, plus TypeScript, full ESLint, and the Next.js production build.
- Focused tests cover authored default changes, runtime state deletion, reference reconnection, Enter and Space activation, unrelated page edits preserving live state, and supported reference metadata policies.
- Branch-server browser QA verifies the 29-entry library, Interactions family, readable state picker, inactive Editor authoring, runtime-only toggling, initial Preview absence, and Preview mounting after activation.
- The prior Image and Navbar follow-up passed all 26 test files and 349 tests with serialized file execution; its four focused registry, library, and editor files passed 142 tests.
- Structural assertions verify the Image logo props, 1232px Navbar content rails, full-width Commerce row surfaces, native disclosure semantics, four mega-menu groups, 20 menu links, and the current 70-node Commerce Navbar insertion result.
- TypeScript, full-project ESLint, and the Next.js production build pass. The build retains the existing warning about the lockfile above the workspace.
- Chrome production-preview validation at 1280px confirms a 24px content-rail start, a 720px absolute four-column panel, all 20 menu links visible, and a document width equal to the viewport.
- Chrome validation at 390px confirms a 326px static one-column panel, all 20 menu links visible, successful click dismissal, a document width equal to the viewport, and no console errors.
- The temporary production preview on port 3015 was stopped after validation.
