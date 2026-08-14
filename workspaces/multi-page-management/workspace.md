---
doc_id: WEB-BUILDER-MULTI-PAGE-MANAGEMENT-WORKSPACE
type: D4
scope: Execution state for multi-page management in the web-builder editor
authority: Selected feature execution-state authority; code, tests, and verified runtime behavior remain authoritative for implementation
owner: Project owner
lifecycle: draft
freshness: Verified after pushing requested PR review changes on 2026-08-14; invalidated by a branch, PR, scope, implementation, or verification change
---

# Multi-page management workspace

**Feature name:** Multi-page management

**Feature directory identifier:** `multi-page-management`

**Overall status:** Draft PR #7 open; requested-change fixes committed and pushed, with re-review and merge pending

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/multi-page-management`, created from `main` at `8799e1cc5cf750029a481c1fb01568aa21c21fb3`

**Current milestone:** Add production page creation, switching, renaming, duplication, home-page selection, and guarded deletion to the editor's existing left panel.

**Feature summary:** Extend the current Components and Layers navigation with a Pages panel that matches Canvas Studio, uses canonical page commands, participates in Undo and Redo, preserves Preview behavior, and prepares the editor for later project persistence and dashboard work.

## Selected documents

- [Current-state research](research/multi-page-current-state.md)
- [Execution plan](plan/multi-page-management-plan.md)

## Scope

- Add Pages as the third left-panel tab while retaining the toolbar page selector.
- Add accessible create, rename, duplicate, set-as-home, and delete interactions.
- Add canonical `page.duplicate` and `page.setHome` commands.
- Preserve project hydration invariants, global node-ID uniqueness, history, selection reconciliation, Preview, and panel collapse behavior.
- Add behavior-first command, component, store, and editor integration coverage.

## Out of scope

- Saving projects across browser reloads.
- The project dashboard or editor project routes.
- Page reordering, manual slug editing, redirects, or full multi-page Preview navigation.

## Execution state

- **Current step:** Request re-review of [draft PR #7](https://github.com/surajsibi/web-builder/pull/7), then merge after approval.
- **Done:** Implemented canonical duplication and home-promotion commands, the accessible Pages panel, sidebar and shell integration, Canvas Studio styling, history and Preview synchronization, collision and node-limit defenses, and behavior-first coverage. Final review added complete menu and tab keyboard behavior, dialog and action focus restoration, visible protected-action explanations, reduced-motion handling, and contextual collapse announcements. Requested-change remediation now isolates global canvas shortcuts from interactive and dialog targets, preserves native Tab and Shift+Tab focus when action menus close, and exposes the left tab rail with vertical semantics and Up/Down navigation.
- **Verification:** TypeScript, repository-wide ESLint, all 487 tests in 33 files, the Next.js 16.3.0 production build, and `git diff --check` pass. Focused review suites also pass: PagesPanel 13/13 and EditorShell 54/54. The reliable full suite was run serially because the local Node 22 environment intermittently stalled Vitest workers; the project declares Node 24.19.x.
- **Remaining:** Request re-review and merge draft PR #7 after approval. Handle later persistence/project-dashboard milestones separately.
- **Last left off:** 2026-08-14 - All three requested PR review changes were committed as `d2812f6` and pushed to `origin/feature/multi-page-management`; the exact next action is to request re-review.
