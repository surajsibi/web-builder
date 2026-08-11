---
doc_id: WEB-BUILDER-COMPONENT-LIBRARY-PROTOTYPE-WORKSPACE
type: D4
scope: Standalone web-builder component-library, code-gallery, and rules-explorer prototype execution state
authority: Selected execution-state authority for the component-library prototypes; the component registry, placement implementation, Inspector implementation, and block registry remain authoritative for current behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Active on 2026-08-11; invalidated by a related prototype, component registry, placement rule, Inspector implementation, block registry, or verification-status change
---

# Component library prototype workspace

**Feature name:** Component library exploration prototypes

**Feature directory identifier:** `component-library-prototype`

**Overall status:** Implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the completed code gallery and component-rules explorer.

**Feature summary:** Maintain three separate standalone prototype views of the component system. `component-library-prototype.html` explores the editor sidebar, `component-code-gallery-prototype.html` showcases component code, and `component-rules-prototype.html` maps the current registry's ten components to valid parent-child placement, editable content fields, Inspector style groups, defaults, and validation constraints. These prototypes do not change the editor or Preview runtime.

## Scope

- Represent all nine registered component primitives, the Navbar block, and all seven registered Button presets.
- Support catalog search and family filters without duplicating application state.
- Show an accessible code dialog from every component card.
- Provide HTML, React, and CSS tabs and a copy action.
- Represent all ten current component definitions in a selectable rules explorer.
- Explain page-root placement, valid parents, valid children, leaf/container behavior, validation rules, and default behavior for each component.
- Enumerate every selected component's content controls and shared Inspector groups, including universal Effects, responsive style layers, and locked-node behavior.
- Provide an all-components comparison table for quick cross-component review.
- Verify desktop and narrow-screen behavior in a browser.

## Out of scope

- Adding source-code export to the production editor or Preview route.
- Generating production-ready project code from authored page documents.
- Changing component schemas, registries, rendering, insertion, or persistence behavior.
- Generating the rules view dynamically from runtime TypeScript modules; the standalone prototype uses a reviewed snapshot of the authoritative implementation.

## Verification

- A jsdom interaction check parsed the standalone file, executed its script, and verified 17 component cards, 6 family filters, one code button per card, dialog opening, code-tab selection, and Dropdown search.
- Browser verification at `http://127.0.0.1:4173/component-code-gallery-prototype.html` confirmed all 17 rendered entries and the expected family totals: Layout 3, Typography 2, Buttons 8, Forms 2, and Navigation 2.
- Searching for `dropdown` showed one Dropdown card and the accessible `1 entry shown` status.
- The Navigation filter showed exactly Link and Navbar.
- Activating **View code for Navbar** opened the drawer on HTML; the CSS tab rendered 24 lines beginning with `.site-header {`; **Copy code** changed to **Copied**.
- A 390 × 844 responsive browser override produced a one-column gallery, static mobile filter rail, full-width code drawer, and fitting code-toolbar controls. The override was reset after verification.
- The browser console reported no warnings or errors.
- A jsdom interaction check for `component-rules-prototype.html` verified 10 component selectors, 10 comparison rows, the Form's 6-type child allowlist, Card's 10-type child set, component selection updates, and the selected Inspector group set.
- Browser verification at `http://127.0.0.1:4174/component-rules-prototype.html` confirmed the complete accessible component, placement, Inspector, and comparison-table structure.
- Selecting Button changed the placement view to 4 valid parent components, no valid children, and 7 content controls while keeping exactly one selected comparison row.
- A 390 x 844 responsive browser override confirmed a single-column explorer with no page-level horizontal overflow. The comparison table uses a contained 1080px scroll surface and compact 52px rows instead of squeezing seven columns into the mobile width. The override was reset after verification.
- The component-rules prototype browser console reported no warnings or errors.

## Risks and trade-offs

- The prototypes are deliberately standalone and do not change the production editor. They can be reviewed without starting Next.js, but their curated catalogs must be refreshed when the component registry, placement logic, Inspector, or block registry changes.
- Code examples are concise starting points, not a production source-code exporter. They reflect each component's semantic intent and visual defaults without serializing the editor's project document.
- The earlier `component-library-prototype.html` and `component-code-gallery-prototype.html` artifacts remain unchanged, so prior design work is preserved at the cost of maintaining three clearly differentiated prototypes.
- The rules explorer is a reviewed static snapshot rather than a generated registry view. This keeps it portable, but it can drift unless refreshed when its named implementation authorities change.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the dedicated responsive gallery and the component-rules explorer. The rules explorer covers all 10 current component definitions, derived parent-child relationships, validation and default summaries, selected Inspector controls, responsive and lock rules, and an all-components comparison table.
- **Verification:** Static interaction and rendered browser checks passed for both completed prototypes, including mobile geometry and clean browser consoles.
- **Remaining:** User review only.
- **Last left off:** 2026-08-11 — Component-rules prototype implementation and verification complete; the deliverable browser tab is open on the rules explorer.
