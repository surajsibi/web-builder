---
doc_id: WEB-BUILDER-NAVBAR-PLAN
type: D3
scope: Standalone web-builder reusable block infrastructure, Link and Image primitives, editable Navbar logo surfaces, original responsive Navbar block, commerce-style Navbar block, template-backed library thumbnails, 1232px large-screen content rails, and responsive All category mega menu
authority: User-approved execution plan for the navbar feature; Project.md owns approved architecture and code/tests own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: The editable Image and Navbar-logo follow-up completed and was verified on 2026-08-11; verification totals and runtime evidence are owned by the implementation report and invalidated by a scope, implementation, or architecture change
---

# Plan: Reusable Blocks and Responsive Navbar

## Goal, scope, and authority

Implement a generic, registry-backed block insertion path and use it to provide responsive Navbar blocks in the Component Library. Each block must become ordinary independently editable nodes, insert atomically with fresh IDs, select its root, and produce one Undo entry. Preserve the original dark pill Navbar, add a separate two-row commerce Navbar based on the supplied reference, show recognizable template-backed thumbnails for both blocks without nesting interactive controls inside the library-card buttons, cap large-screen Navbar content at a centered 1232px boundary while allowing row surfaces to span the viewport, and make the Commerce Navbar's All category control expose an accessible responsive mega menu.

The approved architecture in `Project.md` governs component and block boundaries. The existing command executor, component registry, placement validator, responsive style schema, and store history behavior are verified implementation dependencies.

Included:

- A semantic Link primitive with safe URL handling.
- A semantic Image primitive with safe root-relative or HTTPS sources, explicit alternative text, optional protected linking, and authored fit.
- Typed block templates and a validated block registry.
- Atomic `block.insert` command execution.
- Component Library click and drag support for Blocks.
- A responsive Navbar block using a semantic header and navigation structure.
- A dark pill treatment with a bundled static Saturn-style Home mark, four links, and an email CTA.
- A separate commerce-style Navbar with a blue utility row, brand, location, search, saved/account/cart actions, a white category row, and bundled local SVG icons.
- Full-width, non-interactive library thumbnails recursively derived from each structural block's resolved insertion template.
- A 1232px maximum large-screen content rail for both Navbar templates, with full-width Commerce Navbar row surfaces and smaller responsive gutters.
- Native `details` and `summary` Container semantics plus an All category mega menu whose four groups and 20 destinations remain ordinary editable nodes.
- A desktop overlay presentation and a mobile inline one-column presentation for the mega menu.
- Focused unit and integrated editor tests plus full project verification.

Excluded:

- Hamburger-menu open/close state and the separate More dropdown.
- File upload, durable asset storage, and an asset-management library.
- Persistence, publishing, deployment, and block templates beyond the two Navbar designs.
- Changes to the established responsive breakpoint model.

The selected execution-state authority is `workspaces/navbar/workspace.md`.

## Constraints and assumptions

- Verified: the source tree is standalone and has no Git metadata, so branch synchronization and repository branch journals do not apply.
- Verified: Section and Container accept nested components, Container supports the `nav` semantic tag, Button supports CTA links, and responsive flex/style patches are already available.
- Verified: the current library and drag source model only support primitive component insertion.
- Assumption to validate in tests: the Navbar root can use Section with `semanticTag: "header"` at the page root and all internal edges pass `canPlaceType`.
- The first mobile layout keeps every navigation destination visible by stacking links. No inaccessible hidden menu is introduced.
- The All category interaction uses native disclosure behavior so pointer and keyboard activation do not require serialized component state.
- Existing unrelated workspace work and source changes must remain untouched.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Component registry and placement policy | Existing definitions validate and accept the Navbar tree | Component owner (unassigned) | Stop block mutation and report the rejected edge |
| Command dispatcher and history | One applied command creates one history entry | Editor state owner (unassigned) | Keep block insertion isolated until focused history tests pass |
| Responsive style schema/compiler | Desktop and mobile Navbar overrides validate and compile | Styling owner (unassigned) | Reduce template overrides to supported schema fields |
| Component Library drag/drop adapters | Component behavior remains unchanged while Blocks are added | Editor UI owner (unassigned) | Preserve the component branch and add block-specific coverage |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| NAV-01 | Add the Link primitive, schema, renderer, registry entry, inspector configuration, and tests | Existing safe URL and renderer patterns | Registry, schema, rendering, and placement tests | Implementer | Complete: 15 focused tests and TypeScript pass |
| NAV-02 | Add typed component templates, block definitions, registry validation, and Navbar template | NAV-01 | Registry rejects invalid templates; Navbar template validates | Implementer | Complete: 4 focused tests and TypeScript pass |
| NAV-03 | Add `block.insert` command materialization with fresh IDs, complete pre-mutation validation, root selection, and applied metadata | NAV-02 | Command tests cover success, one transaction, invalid destination/template, locks, and ID collision | Implementer | Complete: 20 command tests, 11 store tests, and TypeScript pass |
| NAV-04 | Extend insertion targeting, drag sources, drop-command mapping, and the Component Library with Blocks | NAV-03 | Unit tests cover target resolution and block drag/click mapping | Implementer | Complete: 13 drag/drop tests and TypeScript pass |
| NAV-05 | Add integrated editor coverage for click insertion, tree shape, responsive styles, selection, and Undo/Redo | NAV-04 | Focused editor and rendering tests pass | Implementer | Complete: 24 editor integration tests pass |
| NAV-06 | Run TypeScript, ESLint, all automated tests, production build, and rendered browser validation where available | NAV-05 | Commands pass; limitations and observed runtime evidence recorded | Implementer and accountable reviewer | Complete: 290 tests, typecheck, lint, build, and Chrome desktop/mobile QA pass |
| NAV-07 | Preserve the original Navbar and add the separate commerce Navbar, its local icon assets, registry entry, and regression coverage | NAV-06 | Both Navbar templates resolve independently; library exposure, typecheck, lint, tests, build, and responsive runtime behavior pass | Implementer and accountable reviewer | Complete: 68 focused tests, 312 full-suite tests, typecheck, lint, build, and desktop/mobile browser QA pass |
| NAV-08 | Replace structural-block icon placeholders with full-width, template-backed thumbnails | NAV-07 | Both Navbar cards show recognizable recursive previews with no nested interactive elements; focused tests, typecheck, lint, build, and browser QA pass | Implementer and accountable reviewer | Complete: 3 focused tests, typecheck, focused lint, build, and browser QA pass |
| NAV-09 | Center Navbar content within a 1232px large-screen rail and make Commerce Navbar row surfaces full width | NAV-08 | Template structure asserts full-width wrappers and 1232px inner rails; focused registry/editor/library tests, typecheck, focused lint, build, and rendered geometry where available | Implementer and accountable reviewer | Complete: template assertions, typecheck, lint, build, and 1280px rendered validation confirm the 24px start implied by the centered 1232px rail |
| NAV-10 | Replace the static All category link with an accessible responsive mega-menu subtree and preserve native disclosure activation in the editor | NAV-09 | Semantic renderer coverage, template structure, editor interaction, full regression suite, build, and desktop/mobile runtime behavior pass | Implementer and accountable reviewer | Complete: 330 full-suite tests, typecheck, full lint, build, and desktop/mobile browser QA pass |
| NAV-11 | Add the reusable Image primitive and replace Navbar logo background-image workarounds with editable Image nodes while preserving decorative utility icons | NAV-10 | Safe source/link validation, accessible linked and decorative rendering, Media library discovery, Inspector editing, Navbar template assertions, full regression suite, typecheck, lint, and build | Implementer and accountable reviewer | Complete: 142 focused tests, 349 full-suite tests, typecheck, full lint, and build pass |

## Quality and approval gates

- Validate all template component types, props, responsive styles, child edges, and destination placement before document mutation.
- Generate project-wide collision-free node IDs and assign current component versions.
- Insert the complete subtree or no nodes; partial insertion is prohibited.
- Preserve the existing component click/drag behavior and node move behavior.
- Confirm one Navbar insertion produces one document commit and one Undo entry.
- Confirm primary mobile navigation remains visible and the mega-menu destinations remain available through the native disclosure.
- Confirm the category disclosure opens and closes natively, overlays without horizontal overflow on desktop, and expands inline without horizontal overflow on mobile.
- Run focused tests after each bounded implementation step, then run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Keep the plan and implementation report in draft until the user reviews the result; no AI-authored approval is recorded.

## Risks, rollback, and containment

- A block-specific drag union can regress existing component or node moves. Contain with exhaustive source branching and existing drag-and-drop regression tests.
- Recursive materialization can leave a partial tree if validation and mutation are interleaved. Contain by validating/materializing isolated data before cloning and mutating the document.
- Template style overrides can drift outside the responsive schema. Contain by parsing every materialized node through the component props schema and responsive style schema.
- Link navigation can interfere with Canvas editing. Reuse the renderer root-attribute guard and verify editor interaction tests; actual navigation remains available in Preview.
- Remote Image sources depend on the authored HTTPS host and expose visitors to that host's availability and request-level privacy behavior. Keep source validation strict and defer uploads, proxying, and asset governance to the future asset model.
- If a focused gate fails, stop at the last passing todo and keep the workspace resume point accurate. No destructive rollback command is authorized.

## Completion

Completion requires NAV-01 through NAV-11 to pass, the feature workspace to identify final verification and residual risks, and a D5 implementation report under `workspaces/navbar/reports/`. Durable implementation facts remain authoritative in code and tests; any future architecture documentation update must avoid duplicating `Project.md`.

NAV-01 through NAV-11 are complete within the recorded verification boundary. The result and residual risks are recorded in the [Navbar block implementation report](../reports/Navbar-Block-Implementation-Report.md); accountable user review remains pending while this plan stays in draft lifecycle.
