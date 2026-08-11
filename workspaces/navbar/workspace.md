---
doc_id: WEB-BUILDER-NAVBAR-WORKSPACE
type: D4
scope: Web builder reusable block infrastructure, reusable Image primitive, editable Navbar logo surfaces, dedicated Navbar library section, original responsive Navbar block, commerce-style Navbar block, and responsive All category mega-menu execution state
authority: Selected execution-state authority for the navbar feature; code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified after the editable Image and Navbar-logo follow-up with 349 automated tests, TypeScript, full ESLint, and a production build on 2026-08-11; prior desktop/mobile Navbar geometry evidence remains applicable and is invalidated by a related component, template, layout, verification, or review-status change
---

# Navbar block workspace

**Feature name:** Reusable Blocks and Responsive Navbar

**Feature directory identifier:** `navbar`

**Overall status:** Reusable Image primitive plus editable original and commerce Navbar logo surfaces, template-backed thumbnails, 1232px content rails, and the responsive All category mega menu implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review Image source, alternative-text, link, new-tab, and fit editing in the Media family and in both prebuilt Navbar blocks.

**Feature summary:** Extend the Component Library with reusable Blocks that materialize validated component subtrees as one undoable document transaction and a reusable Image primitive in the Media family. Image accepts safe root-relative or HTTPS sources, including SVG files, explicit alternative text, an optional safe destination, protected new-tab behavior, and authored fit. The original Navbar's Saturn Home mark is now a linked Image node, while the Commerce Navbar's bag mark is an editable decorative Image beside the existing Brandname link; search, menu, chevron, and action icons remain decorative surfaces. Both Navbar templates retain their 1232px rails, full-width commerce row surfaces, template-backed thumbnails, and responsive All category mega menu. File uploads, an asset library, real commerce/search wiring, location selection, the More dropdown, persistence, publishing, and additional blocks remain outside scope.

**Selected execution plan:** [Navbar block implementation plan](plan/Navbar-Block-Implementation-Plan.md)

**Implementation report:** [Navbar block implementation report](reports/Navbar-Block-Implementation-Report.md)

## Verification summary

- All 26 test files and 349 tests pass with serialized file execution; the four focused registry, library, and editor files pass 142 tests.
- Structural assertions verify the Image logo props, 1232px Navbar content rails, full-width Commerce row surfaces, native disclosure semantics, four mega-menu groups, 20 menu links, and the current 70-node Commerce Navbar insertion result.
- TypeScript, full-project ESLint, and the Next.js production build pass. The build retains the existing warning about the lockfile above the workspace.
- Chrome production-preview validation at 1280px confirms a 24px content-rail start, a 720px absolute four-column panel, all 20 menu links visible, and a document width equal to the viewport.
- Chrome validation at 390px confirms a 326px static one-column panel, all 20 menu links visible, successful click dismissal, a document width equal to the viewport, and no console errors.
- The temporary production preview on port 3015 was stopped after validation.
