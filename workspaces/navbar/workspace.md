---
doc_id: WEB-BUILDER-NAVBAR-WORKSPACE
type: D4
scope: Web builder generic Boolean State connections, reusable block infrastructure, Image primitive, editable Navbar logo surfaces, dedicated Navbar library section, responsive Navbar blocks, and All category mega-menu execution state
authority: Selected execution-state authority for the navbar feature; code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Updated after draft PR #8 opened for the verified generic Boolean State connection implementation on 2026-08-14; invalidated by a related component, interaction, template, layout, verification, or review-status change
---

# Navbar block workspace

**Feature name:** Reusable Blocks and Responsive Navbar

**Feature directory identifier:** `navbar`

**Overall status:** Generic Boolean State connections are implemented and verified locally. Authors create and connect state only from an ordinary component's State tab; Boolean State is no longer exposed as a Component Library card or empty Interactions family. Every unbound visual component is Always visible by default and keeps optional visibility controls collapsed until requested. A newly created Boolean State starts Off with unchecked **Start visible**, while new bindings use On → Show and Off → Show so connecting state does not hide the component before the author chooses a Hide mapping. Authors can connect multiple components to the same state with independent On/Off visibility and configure an ordinary Button to Turn On, Turn Off, or Toggle that state. Obsolete dedicated State Action, Conditional Content, and Drawer component paths were removed; schema migration preserves compatible saved work. The verified follow-up is approved for commit and push on the current feature branch and remains unmerged. The prior Image, Navbar, Commerce Navbar, template-thumbnail, content-rail, and responsive mega-menu work also remains implemented and verified.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feat/boolean-state-drawer`

**Current milestone:** The library-removal, simplified Button State tab, and opt-in visibility follow-ups are implemented, verified, committed, and pushed on `feat/boolean-state-drawer`. [Draft PR #8](https://github.com/surajsibi/web-builder/pull/8) targets `main` for review.

**Feature summary:** Extend the Component Library with reusable Blocks that materialize validated component subtrees as one undoable document transaction and a reusable Image primitive in the Media family. Image accepts safe root-relative or HTTPS sources, including SVG files, explicit alternative text, an optional safe destination, protected new-tab behavior, and authored fit. The original Navbar's Saturn Home mark is now a linked Image node, while the Commerce Navbar's bag mark is an editable decorative Image beside the existing Brandname link; search, menu, chevron, and action icons remain decorative surfaces. Both Navbar templates retain their 1232px rails, full-width commerce row surfaces, template-backed thumbnails, and responsive All category mega menu. File uploads, an asset library, real commerce/search wiring, location selection, the More dropdown, persistence, publishing, and additional blocks remain outside scope.

**Boolean State summary:** Boolean State is a nonvisual, page-scoped node created from the State Inspector tab and managed through Layers; it is not a Component Library item. Ordinary visual components use the shared node-level `stateBinding` for visibility, while ordinary Buttons use Turn On, Turn Off, or Toggle actions. Runtime values remain outside persisted document state and history. One state can control many components, including inverted visibility mappings. Conditional styling, variants, enter/exit animation controls, cross-page state, and persisted visitor state remain follow-up work.

**Selected execution plan:** [Navbar block implementation plan](plan/Navbar-Block-Implementation-Plan.md)

**Implementation report:** [Navbar block implementation report](reports/Navbar-Block-Implementation-Report.md)

**Boolean State usage tutorial:** [Connect components with Boolean State](notes/Boolean-State-Connections-Tutorial.md)

## Verification summary

- Local commit `59f0c08` passes all 32 test files and 439 tests with serialized file execution, plus TypeScript, full ESLint, and the Next.js production build. The complete working tree passes all 32 files and 443 tests; its focused Editor suite passes 52 tests, and TypeScript and full ESLint pass.
- Behavior-first coverage verifies atomic state creation and connection, undo/redo, shared and inverted consumers, ordinary Button actions, unresolved references, authored-default reconciliation, and internal-reference remapping during duplication.
- Real-browser Editor QA verifies the 26-entry library has no Boolean State card or Interactions family, while the Design/State Inspector tabs still provide atomic create-and-connect and Layers access. Every unbound visual component presents collapsed optional visibility as Always visible. Expanding a Section shows unchecked **Start visible**; creating and connecting the Off state keeps it visible with On → Show and Off → Show. Button action remains first, a new action Button remains Always visible without a binding, Toggle works without visibility configuration, and Show/Hide fields appear only after deliberate visibility connection.
- Browser console review found only the development hydration warning caused by Chrome's external `cz-shortcut-listen` body attribute; no feature runtime error was observed.
- The prior Image and Navbar follow-up passed all 26 test files and 349 tests with serialized file execution; its four focused registry, library, and editor files passed 142 tests.
- Structural assertions verify the Image logo props, 1232px Navbar content rails, full-width Commerce row surfaces, native disclosure semantics, four mega-menu groups, 20 menu links, and the current 70-node Commerce Navbar insertion result.
- TypeScript, full-project ESLint, and the Next.js production build pass. The build retains the existing warning about the lockfile above the workspace.
- Chrome production-preview validation at 1280px confirms a 24px content-rail start, a 720px absolute four-column panel, all 20 menu links visible, and a document width equal to the viewport.
- Chrome validation at 390px confirms a 326px static one-column panel, all 20 menu links visible, successful click dismissal, a document width equal to the viewport, and no console errors.
- The temporary production preview on port 3015 was stopped after validation.
