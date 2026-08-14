---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-OVERLAY
type: A1
scope: Repository-specific knowledge for web-builder feature/project-dashboard
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Verified on 2026-08-14 through lint, typecheck, 551 tests, production build, focused schema-version-3 integration tests, and rendered browser smoke testing against origin/main 4835734ba7a371281b9d3d5c9d8bb520c5e9676e; invalidated by a repository architecture, implementation, dependency, branch, or verification change
---

# Repository overlay - web-builder / feature/project-dashboard

## Verified repository facts

- `/` renders the local project dashboard; `/projects/[projectId]` loads one validated project into a dedicated builder store.
- `ProjectRepository` isolates storage from the dashboard and editor. The shipping adapter uses the browser IndexedDB API; tests use an in-memory adapter and `fake-indexeddb`.
- Every stored record is hydrated independently. Invalid and unsupported records remain visible through bounded **Needs recovery** summaries without editor actions or raw payload disclosure.
- Saves compare revisions atomically, update persistence metadata outside Undo/Redo history, debounce at 750 ms, and stop automatic writes after a conflict.
- The former production `editorStore` singleton is removed. Preview continues to use its existing one-use snapshot transport and creates no persistence fallback.
- The optimized Next.js build emits `/` as static content and `/projects/[projectId]` as a dynamic server-rendered route.
- Whole-project duplication remaps page-local component references and Boolean State bindings introduced by schema version 3.
- Repository loads preserve hydration's migration signal so the editor saves supported older documents through the revision-checked autosave path.

## Provisional assumptions

- A future backend adapter will preserve the current repository and canonical project-document boundaries.
- Guided recovery and export/import remain separate future slices.

## Constraints

- Project data exists only in the current browser profile and is not an account backup.
- Project deletion, authentication, cloud synchronization, publishing, and templates remain outside this slice.
- The repository declares Node `>=24.19.0 <25`; local verification ran under Node 22.21.1 with an engine warning because Node 24 is not installed in this environment.
- The branch is rebased onto `origin/main` at `4835734`, which introduces project schema version 3 and Boolean State/Drawer behavior; the complete post-rebase Node 22 matrix passes, while required-runtime Node 24 verification remains outstanding.

## Risks

- Clearing browser storage removes local projects until a separately approved export or backend migration path exists.
- The default five-second UI test ceiling can be too short for an unchanged Phase 5 case on this Node 22 machine. The final complete suite passes 551 of 551 with a temporary 15-second runner ceiling; repository test configuration remains unchanged.
