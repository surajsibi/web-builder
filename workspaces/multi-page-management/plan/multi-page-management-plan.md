---
doc_id: WEB-BUILDER-MULTI-PAGE-MANAGEMENT-PLAN
type: D3
scope: Execution plan for production multi-page management on web-builder feature/multi-page-management
authority: Owns planned execution for this feature; workspace.md owns feature status and code/tests own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Verified against the reviewed implementation and final checks on 2026-08-14; invalidated by a scope, command contract, editor layout, or verification change
---

# Plan: Add production multi-page management

## Goal, scope, and authority

Deliver the approved Pages experience inside the existing Canvas Studio editor. The production editor must let a user create, select, rename, duplicate, promote, and delete pages from the left panel without bypassing command validation or history. The [feature workspace](../workspace.md) owns execution state; command types, executor code, store behavior, UI code, and tests remain authoritative for implemented behavior.

Project persistence and the project dashboard remain separate follow-up milestones.

## Constraints and assumptions

- Keep the toolbar page selector as a compact second switching surface.
- Use visible `Create` and `Cancel` labels in the creation flow; do not rely on color-only icon buttons.
- Renaming a page changes its display name but preserves its slug.
- Promoting a non-home page changes its slug to `/` and assigns the previous home a generated, unique slug based on its name.
- Duplicating a page must allocate a new page ID and new IDs for every copied node because node IDs are unique across a project.
- A home page, the last remaining page, or a page containing locked nodes remains protected from deletion.
- Do not add a persistence side effect to the Pages panel or builder store in this feature.
- Preserve the unrelated untracked Label prototype.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Project hydration and tree validation | Existing page-order, home-slug, unique-slug, global-node-ID, node-limit, and depth invariants remain enforced | Project owner | Stop and correct the command before UI integration |
| Builder command history | Every document mutation records one undoable command | Project owner | Keep the behavior behind command tests until history is correct |
| Left-panel layout | Components and Layers behavior and collapse preference remain intact | Project owner | Revert the Pages integration boundary and isolate the regression |
| Preview snapshots | Active page continues to determine the Preview page | Project owner | Block completion until focused Preview coverage passes |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| MP-01 | Add failing contract tests for `page.duplicate` and `page.setHome` | Existing fixtures and command executor | Focused command tests fail for the intended missing behavior | Project owner | Complete |
| MP-02 | Implement and validate the new page commands | MP-01 | Command, validation-equivalence, store, and hydration-adjacent tests pass | Project owner | Complete |
| MP-03 | Add a behavior-first `PagesPanel` component and tests | MP-02 | Accessible queries cover create/cancel, switching, rename, duplicate, home, delete confirmation, and protected actions | Project owner | Complete |
| MP-04 | Integrate Pages into `EditorLeftSidebar` and `EditorShell` | MP-03 | Toolbar, Canvas, Layers, selection, announcements, collapse state, history, and Preview remain synchronized | Project owner | Complete |
| MP-05 | Match the approved Canvas Studio visual language | MP-04 | Responsive rendered checks at representative desktop and reduced widths | Project owner | Complete |
| MP-06 | Run the complete verification matrix and record results | MP-01 through MP-05 | Focused tests, lint, typecheck, complete test suite, production build, and manual interaction verification pass | Project owner | Complete |

## Quality and approval gates

- All tests follow the repository's behavior-first test rules and use accessible queries for UI behavior.
- New command cases cover success, invalid page IDs, ID collisions, node limits, home no-op behavior, unique slug generation, and Undo/Redo.
- UI coverage verifies meaningful labels, keyboard form submission/cancellation, disabled/protected actions, confirmation before deletion, and focus continuity.
- Lint, TypeScript, the complete Vitest suite, and the production build must pass.
- Rendered verification must compare the Pages panel against the approved prototype and existing editor chrome.

## Risks, rollback, and containment

- Incorrect node-ID remapping can corrupt duplicated trees. Contain the risk in the command executor and require full structural assertions before UI work.
- Incorrect home promotion can violate the `/` invariant or create duplicate slugs. Generate the previous home's replacement slug before final validation and test conflicts.
- Page actions can leave visual editing state tied to the old page. Route every action through EditorShell callbacks that reset transient editing state.
- A menu or inline form can become unclear or inaccessible. Use visible labels, native controls, explicit menu/dialog semantics, and focus tests.
- If a phase fails, keep later phases unstarted and resume from the last green command or component boundary.

## Completion

The feature completes when all in-scope page operations work in the production editor, history and Preview remain correct, the verification matrix passes, rendered checks match the approved layout, and the implementation state is recorded in the feature workspace and branch journal. Final review met these gates with 482 passing tests across 33 files, repository-wide lint and TypeScript checks, the Next.js 16.3.0 production build, and `git diff --check`. Durable facts are promoted only after merge; the feature and branch workspaces remain active until branch completion.
