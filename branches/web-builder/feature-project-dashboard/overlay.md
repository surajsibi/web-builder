---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-OVERLAY
type: A1
scope: Repository-specific knowledge for web-builder feature/project-dashboard
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Rechecked on 2026-08-18 through published head b9e7879, its successful Node 24.19 CI job, all 27 focused tests, the complete 567-test run, repository-wide ESLint, normal typechecking, diff checks, a successful optimized production build, and the final controlled Chrome replay; all fourteen scoped findings are closed; invalidated by a repository architecture, implementation, dependency, branch, publication, review, or verification change
---

# Repository overlay - web-builder / feature/project-dashboard

## Verified repository facts

- `/` renders the local project dashboard; `/projects/[projectId]` loads one validated project into a dedicated builder store.
- `ProjectRepository` isolates storage from the dashboard and editor. The shipping adapter uses the browser IndexedDB API; tests use an in-memory adapter and `fake-indexeddb`.
- Every stored record is hydrated independently. Invalid and unsupported records remain visible through bounded **Needs recovery** summaries without editor actions or raw payload disclosure.
- A hydrated record is ready only when its embedded `projectId` equals its physical storage key; mismatches remain read-only **Needs recovery** records and cannot load, save, rename, or duplicate.
- Saves compare revisions atomically, update persistence metadata outside Undo/Redo history, debounce at 750 ms, start the same revision-checked save when a dirty editor unmounts, and stop automatic writes after a conflict.
- A ready IndexedDB record requires a string physical key. Every unavailable physical key, including strings, remains preserved as a read-only recovery record with a type-tagged identity, so generated identities cannot collide with literal string keys or cross the action boundary.
- IndexedDB list, load, save, rename, and duplicate paths derive unavailable identities through the same adapter preparation path, so one physical record retains one opaque recovery reference across inventory and action errors.
- Repository pagination binds every offset cursor to an exact bounded inventory signature. The dashboard discards and retries a changed inventory at most three times, deduplicates item identities, and still rejects repeated cursors defensively.
- Successful rename refreshes the project inventory without removing the initiating card, then restores focus through the shared dialog-close path.
- Create and rename dialogs ignore Escape while their repository mutation is pending. The guarded pending submit target remains focusable, receives focus, and contains Tab and Shift+Tab so success navigation and failure guidance stay attached to visible modal UI.
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
- The repository declares Node `>=24.19.0 <25`; the latest local verification ran under Node 22.21.1 with an engine warning because Node 24 is not installed in this environment.
- The branch is rebased onto `origin/main` at `4835734`, which introduces project schema version 3 and Boolean State/Drawer behavior. Published head `b9e7879` passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32128646603/job/95684696642). Owner review remains; promotion requires a green live current-head check.

## Risks

- Clearing browser storage removes local projects until a separately approved export or backend migration path exists.
- The default five-second UI test ceiling can be too short for unchanged Phase 5 cases on this Node 22 machine. The latest complete suite passes 567 of 567 with a temporary 15-second runner ceiling; the repository-wide default remains unchanged.
- Controlled Chrome verification on 2026-08-16 confirmed that an edit survives immediate Browser Back and that Enter-submitted rename restores focus to the initiating **Rename** button. The run retained its browser-local QA project and reported only the known extension-injected `cz-shortcut-listen` hydration mismatch.
- Controlled Chrome verification on 2026-08-18 used a separate QA IndexedDB database to show numeric key `1` and literal string key `"indexeddb-key:number:1"` as two distinct **Needs recovery** cards with correctly scoped dialogs. Deferred create and rename flows kept focus on the guarded pending target through Tab, Shift+Tab, Escape, and Enter, and the mutation counter remained at one. The replay produced no console warnings or errors, and its temporary source route was removed afterward.
- An unmount-triggered save continues asynchronously after navigation. A later storage failure cannot be displayed in the departed editor, although hard unload warnings and revision-conflict refusal remain in place.
