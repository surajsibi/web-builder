---
doc_id: WEB-BUILDER-NAVBAR-WORKSPACE
type: D4
scope: Web builder reusable block infrastructure, dedicated Navbar library section, original responsive Navbar block, commerce-style Navbar block, and responsive All category mega-menu execution state
authority: Selected execution-state authority for the navbar feature; code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified after the interactive Commerce Navbar mega-menu follow-up with 330 automated tests, TypeScript, full ESLint, a production build, and desktop/mobile browser validation on 2026-08-11; invalidated by a navbar scope, implementation, verification, or review-status change
---

# Navbar block workspace

**Feature name:** Reusable Blocks and Responsive Navbar

**Feature directory identifier:** `navbar`

**Overall status:** Dedicated Navbar library section plus the original and commerce Navbar blocks, including template-backed thumbnails, 1232px content rails, and the responsive All category mega menu, implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review both prebuilt Navbar blocks at large-screen and mobile sizes, with particular attention to the 1232px content boundary and the Commerce Navbar's All category interaction.

**Feature summary:** Extend the Component Library with reusable Blocks that materialize validated component subtrees as one undoable document transaction. A dedicated Navbar family collects every prebuilt structural Navbar block while the Navigation family remains focused on the Link primitive. The original responsive Navbar remains available with its dark pill shell, Saturn-style Home mark, four links, and email CTA. A separate Commerce Navbar provides a blue utility row, brand, location, product search, saved/account/cart actions, a white category row, eight bundled SVG icons, and a native All category disclosure containing four editable mega-menu groups and 20 links. Both Navbar templates cap their large-screen content at 1232px. The Commerce Navbar renders each row surface across the full viewport while centering its editable content inside that rail; its mega menu overlays the page in four columns on desktop and expands inline as one column on mobile. Both library cards show full-width, non-interactive thumbnails recursively derived from the same resolved templates they insert. Both blocks materialize ordinary editable nodes. Real commerce/search wiring, location selection, the More dropdown, user-managed logo uploads, persistence, publishing, and additional blocks remain outside scope.

**Selected execution plan:** [Navbar block implementation plan](plan/Navbar-Block-Implementation-Plan.md)

**Implementation report:** [Navbar block implementation report](reports/Navbar-Block-Implementation-Report.md)

## Verification summary

- All 26 test files and 330 tests pass with serialized file execution; the focused EditorShell file passes all 41 tests.
- Structural assertions verify the 1232px Navbar content rails, full-width Commerce row surfaces, native disclosure semantics, four mega-menu groups, 20 menu links, and the 68-node atomic insertion result.
- TypeScript, full-project ESLint, and the Next.js production build pass. The build retains the existing warning about the lockfile above the workspace.
- Chrome production-preview validation at 1280px confirms a 24px content-rail start, a 720px absolute four-column panel, all 20 menu links visible, and a document width equal to the viewport.
- Chrome validation at 390px confirms a 326px static one-column panel, all 20 menu links visible, successful click dismissal, a document width equal to the viewport, and no console errors.
- The temporary production preview on port 3015 was stopped after validation.
