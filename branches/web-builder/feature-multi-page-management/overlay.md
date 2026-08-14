---
doc_id: WEB-BUILDER-FEATURE-MULTI-PAGE-MANAGEMENT-OVERLAY
type: A1
scope: Repository-specific facts and constraints for multi-page management on feature/multi-page-management
authority: Repository-specific overlay for the linked feature; code, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Verified after requested-change remediation and final checks on 2026-08-14; invalidated by a page-model, command, editor, Preview, or verification change
---

# Repository overlay - web-builder / feature/multi-page-management

## Verified repository facts

- `ProjectDocument` already contains `pages`, `pageOrder`, and `homePageId`.
- Hydration requires the home page to exist with slug `/`, non-home slugs to be canonical and unique, page order to contain every page exactly once, and node IDs to be unique across the project.
- Canonical commands create, rename, duplicate, promote to home, and protect deletion of pages.
- Page duplication allocates a new page ID, remaps every node ID, generates a unique name and slug, inserts the copy after its source, and activates the copy.
- Home-page promotion atomically assigns `/` to the new home and generates a conflict-free slug for the previous home.
- Builder-store command dispatch records document mutations in bounded Undo/Redo history.
- The production toolbar already switches pages, and Preview snapshots already retain the active page.
- The production left sidebar owns Components, Layers, and Pages tabs with arrow-key navigation and a shared collapse preference.
- The Pages panel provides accessible create, switch, rename, duplicate, set-home, and guarded-delete interactions with keyboard and focus continuity.
- The editor has no persisted project repository; `editorStore` starts from a deterministic initial project.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent.

## Resolved design decisions

- Promoting a page to home sets its slug to `/` and assigns the previous home a generated unique slug based on its name.
- Page rename preserves the existing slug to avoid silently changing paths.

## Constraints

- Read the installed Next.js 16 documentation before editing Client Component or global CSS source.
- Use canonical commands for every document mutation; the Pages panel must not mutate documents directly.
- Preserve global node-ID uniqueness when duplicating a page.
- Preserve Components, Layers, panel collapse, toolbar switching, Preview, history, selection, locked-node, node-cap, and tree-depth behavior.
- Use visible Create and Cancel labels rather than color-only action buttons.
- Keep persistence and dashboard work out of this branch.
- Preserve the unrelated untracked Label prototype.

## Risks

- Shallow page duplication would violate global node-ID uniqueness and corrupt parent indexing.
- Incorrect home promotion would violate the `/` and unique-slug invariants.
- Page switching or mutation could leave transient visual-editing state attached to a previous page.
- Menu, inline form, confirmation, or focus behavior can become inaccessible if implemented only visually.
