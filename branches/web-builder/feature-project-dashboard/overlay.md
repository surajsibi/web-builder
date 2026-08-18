---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-OVERLAY
type: A1
scope: Repository-specific knowledge for web-builder feature/project-dashboard
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Rechecked on 2026-08-18 in the local feature-branch state following commit c4b9412ba5dab5546e75c2c6cf8b6b8a209aa2eb through all 69 affected tests, the complete 559-test run, ESLint, normal typechecking, diff checks, live port-3000 compilation checks, and a successful optimized production build; all six scoped findings are closed; invalidated by a repository architecture, implementation, dependency, branch, review, or verification change
---

# Repository overlay - web-builder / feature/project-dashboard

## Verified repository facts

- `/` renders the local project dashboard; `/projects/[projectId]` loads one validated project into a dedicated builder store.
- `ProjectRepository` isolates storage from the dashboard and editor. The shipping adapter uses the browser IndexedDB API; tests use an in-memory adapter and `fake-indexeddb`.
- Every stored record is hydrated independently. Invalid and unsupported records remain visible through bounded **Needs recovery** summaries without editor actions or raw payload disclosure.
- A hydrated record is ready only when its embedded `projectId` equals its physical storage key; mismatches remain read-only **Needs recovery** records and cannot load, save, rename, or duplicate.
- Saves compare revisions atomically, update persistence metadata outside Undo/Redo history, debounce at 750 ms, start the same revision-checked save when a dirty editor unmounts, and stop automatic writes after a conflict.
- The dashboard follows all repository pagination cursors before applying local search and rejects a repeated cursor defensively.
- Successful rename refreshes the project inventory without removing the initiating card, then restores focus through the shared dialog-close path.
- Dashboard button tokens are shared by the dashboard and direct editor boundary, so storage and unexpected-load retry actions retain their intended foreground, border, and background presentation.
- Storage-failure and revision-conflict guidance is visible in the production editor toolbar and remains a polite atomic live-region announcement. Manual retry stays available for storage failures; conflicts continue disabling stale saves while leaving **Return to Projects** available.
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
- The branch is rebased onto `origin/main` at `4835734`, which introduces project schema version 3 and Boolean State/Drawer behavior; the complete six-finding review-remediation Node 22 matrix passes, while required-runtime Node 24 verification remains outstanding.

## Risks

- Clearing browser storage removes local projects until a separately approved export or backend migration path exists.
- The default five-second UI test ceiling can be too short for an unchanged Phase 5 case on this Node 22 machine. The final complete suite passes 559 of 559 with a temporary 15-second runner ceiling; the repository-wide default remains unchanged.
- Controlled Chrome verification on 2026-08-16 confirmed that an edit survives immediate Browser Back and that Enter-submitted rename restores focus to the initiating **Rename** button. The run retained its browser-local QA project and reported only the known extension-injected `cz-shortcut-listen` hydration mismatch.
- An unmount-triggered save continues asynchronously after navigation. A later storage failure cannot be displayed in the departed editor, although hard unload warnings and revision-conflict refusal remain in place.
