---
doc_id: WEB-BUILDER-FEATURE-COLLAPSIBLE-EDITOR-PANELS-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder feature/collapsible-editor-panels
authority: Repository-specific overlay; code, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Verified on 2026-08-13 against the implemented editor layout, integration tests, production build, and rendered desktop behavior; invalidated by a related editor layout, panel interaction, persistence, or branch change
---

# Repository overlay — web-builder / feature/collapsible-editor-panels

## Verified repository facts

- The editor workspace retains one three-column grid and selects expanded or collapsed side-column widths through state attributes and CSS custom properties.
- The left panel collapses to the existing 72 px Components/Layers navigation rail; selecting either tab restores its content panel.
- The right Inspector collapses to a 48 px edge rail with a vertical label and native expand button.
- Both panel contents remain mounted while hidden, preserving local search, tab, and Inspector draft state.
- Panel preferences use a hydration-safe external-store adapter over browser-local storage and default to both panels expanded when no valid preference exists.
- Grid transitions are disabled when the user requests reduced motion.

## Provisional assumptions

## Constraints

- Preserve the existing Components/Layers navigation, Inspector editing contracts, Canvas behavior, and editor minimum-width policy.
- Panel controls must remain native buttons with accurate accessible names, expanded states, and controlled-region references.

## Risks

- Panel preferences are scoped to the editor origin rather than an individual project, so one browser preference applies across projects on that origin.
