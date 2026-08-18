---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-JOURNAL
type: D4
scope: Execution state for web-builder feature/project-dashboard
authority: Selected repository execution-state record for this branch and feature
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after published head b9e7879 closed all fourteen findings and passed Node 24.19 CI, with the final browser replay also complete; invalidated by progress, scope, branch, pull-request, workspace-mapping, blocker, approval, publication, review, or verification changes
---

# Progress Journal - web-builder / feature/project-dashboard

**Feature workspace:**
`workspaces/project-dashboard/`

**Current step:**
Complete owner review of [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9). Promotion requires a green live current-head check; separately review the opt-in migration design before future backend work.

**Approach:**
Preserve the canonical `ProjectDocument` and hydration boundary, introduce a storage-independent repository contract, implement browser-local persistence first, move the editor to a project-specific route, and add autosave only after repository behavior is verified.

**Done:**

- Preserved the planning baseline on `main` in commit `da11e47` and pushed it to `origin/main`.
- Created and switched to `feature/project-dashboard` from that commit.
- Loaded the applicable workspace, documentation, Next.js 16.3, route, store, project-model, hydration, editor, and test context.
- Initialized this collision-safe repository branch workspace and linked it to `workspaces/project-dashboard/`.
- Drafted `workspaces/project-dashboard/plan/project-dashboard-implementation-plan.md` with bounded scope, architecture, ordered slices, verification gates, and data-loss controls.
- Renamed the canonical feature workspace from `backend` to `project-dashboard` and updated its branch mapping.
- Added `workspaces/project-dashboard/plan/local-to-backend-project-migration-guide.md` with explicit consent, identity, idempotency, validation, verification, coexistence, rollback, and retirement controls.
- Defined the ready/unavailable repository union and the dashboard's **Needs recovery** presentation, safe metadata, prohibited actions, direct-route containment, and raw-source preservation behavior.
- Recorded project-owner approval to start implementation.
- Added the storage-independent repository contract, deterministic memory adapter, raw IndexedDB adapter, revision conflicts, bounded recovery summaries, and safe whole-project duplication.
- Replaced `/` with a responsive project dashboard supporting create, list, open, search, rename, duplicate, empty, storage-error, corrupt, and unsupported states without adding deletion.
- Added `/projects/[projectId]`, per-route builder stores, bounded missing/unavailable states, manual save, 750 ms autosave, save-before-dashboard navigation, unload warnings, and conflict lockout.
- Removed the production editor singleton and kept Preview on its existing one-use snapshot path.
- Added `fake-indexeddb` as a test-only dependency and behavior-first repository, dashboard, loader, autosave, duplication, and SSR-laziness coverage.
- Added the in-review D5 implementation report with scope, as-built changes, verification evidence, rollout state, and residual risks.
- Created checkpoint commit `6939faa`, fetched `origin/main` at `4835734`, and rebased the feature as `153f397` after preserving the `project-dashboard` workspace rename and merging schema-version-3 specification facts.
- Updated whole-project duplication to remap schema-version-3 page-local component references and Boolean State bindings, matching the established page/subtree duplication boundary.
- Preserved hydration's migration signal through repository load and store creation so a supported older project becomes dirty and saves through optimistic concurrency rather than remaining normalized only in memory.
- Added the scoped project-dashboard code review with two high-, one medium-, and one low-severity finding, then recorded project-owner approval to remediate all four.
- Added behavior-first regression cases that failed against the reviewed implementation for dirty-editor unmount, stored key/ID mismatch, a 101-project dashboard, and successful-rename focus restoration.
- Started the existing revision-checked save when a dirty non-conflicted editor unmounts before the debounce interval.
- Contained hydrated records whose embedded project identity differs from their physical storage key as read-only **Needs recovery** entries across list, load, save, rename, and duplicate.
- Made dashboard loading consume all repository cursors with repeated-cursor protection, preserving search reachability beyond 100 projects.
- Kept the initiating project card mounted across successful rename refresh and closed through the shared focus-restoring path.
- Completed a final pre-push review of all three feature commits at `c4b9412`; PD-R01 through PD-R04 remain closed, while PD-R05 records the direct-route retry button's missing shared CSS variables and PD-R06 records the production toolbar's undiscoverable save-recovery guidance.
- Ran a controlled Chrome pass against the user's port-3000 dashboard and a temporary port-3102 production server without changing source code or stopping the user-started servers. Dashboard create, search, keyboard rename with focus restoration, and duplicate passed on port 3000. The production server additionally passed project routing, edit/autosave, reload persistence, manual save, immediate Browser Back persistence, rename, duplicate-content preservation, and editor viewport switching.
- Reproduced PD-R06 with two editors at the same project revision: the stale tab displayed only **Save conflict**, kept the full reload-or-return instruction solely in `aria-label` and `title`, omitted it from visible page text, and disabled **Save now**.
- Confirmed the PD-R05 boundary token defect in the rendered missing-project state: `--dashboard-ink` and `--dashboard-line` were empty on `.project-editor-boundary`, and the secondary action fell back to a current-color border rather than the intended dashboard token. The exact storage-error **Try again** state was not forced because doing so would require changing browser storage permissions or data outside the UI flow.
- The user confirmed that the same project directory was also running on port 3001 and closed that extra server. With only port 3000 listening, `/`, `/preview`, and the dynamic project route returned 200; a controlled Chrome reload and dashboard-to-editor navigation settled to **Saved locally**. This resolves the development-runtime blocker and confirms it was not a third branch-code defect.
- Remediated PD-R05 by moving the shared dashboard button tokens into a root-imported stylesheet that applies to both `.project-dashboard` and `.project-editor-boundary`.
- Remediated PD-R06 by rendering the full storage-failure or revision-conflict guidance visibly in the production toolbar, preserving polite atomic announcements, keeping manual storage retry enabled, and retaining conflict lockout with a usable **Return to Projects** action.
- Added production-component regression tests for computed boundary tokens, visible and enabled retry actions, keyboard order, retry dispatch, visible storage-failure guidance, visible conflict guidance, manual retry, conflict save lockout, and dashboard recovery. The three new cases failed before the remediations and pass afterward.
- Closed PD-R05 and PD-R06 after the two affected suites passed 69 of 69 tests, the complete suite passed 559 of 559, and lint, normal typechecking, and `git diff --check` passed.
- Confirmed the active port-3000 development server returns 200 for `/`, `/preview`, and `/projects/qa-missing-boundary`; its emitted CSS contains the shared editor-boundary tokens. A final post-remediation visual replay was not possible because the installed Browser plugin package is missing its required `scripts/browser-client.mjs` runtime file.
- After the user stopped port 3000, ran `pnpm build` against the remediated working tree. Next.js 16.3.0 compiled successfully, completed TypeScript and static generation, and emitted `/` as static plus `/preview`, `/projects/[projectId]`, and `/api/form-submissions` as dynamic routes under Node 22.21.1.
- Committed the final recovery remediation as `6c48a41`, pushed `feature/project-dashboard` to `origin`, and opened [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) against `main` after confirming no existing pull request used the branch.
- Verified published head `a6a7b78` through [Node 24.19 CI / Validate run 32109626246, job 95626050223](https://github.com/surajsibi/web-builder/actions/runs/32109626246/job/95626050223).
- Corrected draft pull request 9's description so it records that successful Node 24.19 job while requiring the same matrix again for any later remediation commit.
- Reproduced PD-R07 through PD-R09 with six fail-before cases: numeric IndexedDB key `1` appeared ready for project ID `"1"`; colliding numeric and string keys shared a project identity; a save between pages omitted the updated project and duplicated another React key; and Escape removed pending create and rename dialogs before success or failure completed.
- Remediated PD-R07 by requiring string physical IndexedDB keys for readiness, preserving every other key type through a type-tagged recovery identity, and namespace-tagging ready and unavailable React keys.
- Remediated PD-R08 with exact, bounded per-repository inventory signatures, the stable `inventory-changed` error, duplicate-item detection, and a three-attempt dashboard restart.
- Remediated PD-R09 by disabling Escape dismissal for pending create and rename dialogs while preserving idle and recovery-dialog dismissal.
- Completed local verification for the latest remediation: 3 focused files and 25 tests pass, the complete serial suite passes 41 files and 565 tests with the temporary 15-second ceiling, repository-wide lint, normal typechecking, and `git diff --check` pass, and the optimized Next.js build emits the expected routes.
- Published PD-R07 through PD-R09 in commit `61641d3` and verified that exact head through [Node 24.19 CI / Validate run 32120382654, job 95659238395](https://github.com/surajsibi/web-builder/actions/runs/32120382654/job/95659238395).
- Reproduced PD-R10 with numeric key `1` and unavailable literal string key `"indexeddb-key:number:1"`; both returned the same `recoveryId` and caused dashboard duplicate detection to reject the inventory.
- Reproduced PD-R11 by tabbing from a pending create dialog whose controls were all disabled; focus moved to the underlying **New project** action.
- Remediated PD-R10 by deriving every unavailable IndexedDB recovery identity, including strings, through one type-tagged encoder.
- Remediated PD-R11 by keeping the pending submit target focusable with `aria-disabled` and `aria-busy`, focusing it when pending begins, containing Tab in both directions, and guarding repeat submission.
- At that earlier checkpoint, corrected PD-R12 across the maintained publication records to identify published head `61641d3`, nine published findings, 565 published tests, and its successful Node 24.19 job while keeping then-unpublished PD-R10 and PD-R11 separate.
- At that earlier checkpoint, corrected draft pull request 9's description to the same `61641d3` publication boundary; the later `714973e` entry supersedes that status.
- Published PD-R10 through PD-R12 in checkpoint `714973e` and verified that exact head through [Node 24.19 CI / Validate run 32125020513, job 95673532383](https://github.com/surajsibi/web-builder/actions/runs/32125020513/job/95673532383).
- Completed the final controlled Chrome replay with a separate QA IndexedDB database: numeric key `1` and literal string key `"indexeddb-key:number:1"` remained two distinct recovery cards with correctly scoped dialogs; deferred create and rename retained modal focus through Tab, Shift+Tab, Escape, and Enter without duplicate mutation calls; no browser console warnings or errors appeared. The temporary QA route was removed after the replay.
- Reproduced PD-R13 with one mismatched string-key record: `list()` returned `indexeddb-key:string:"project-1"`, while `load()` returned raw `project-1` in `unavailableProject.recoveryId`.
- Remediated PD-R13 by routing IndexedDB list, load, save, rename, and duplicate errors through the same adapter-specific preparation result while preserving the shared clone and error behavior.
- Corrected PD-R14 by recording `714973e` as the published twelve-finding checkpoint and treating the live pull-request head and checks as the publication authority for later remediation commits.
- Published PD-R13 and PD-R14 at head `b9e7879` and verified that exact head through [Node 24.19 CI / Validate run 32128646603, job 95684696642](https://github.com/surajsibi/web-builder/actions/runs/32128646603/job/95684696642).

**Verification:**

- Git reported a clean tree before branch creation.
- The exact branch is `feature/project-dashboard`, normalized as `feature-project-dashboard`.
- Documentation manifests, branch mapping, relative links, trailing whitespace, and end-of-file checks pass.
- The legacy workspace path is absent from active context and documentation references.
- The migration guide's manifest, relative links, state-diagram text equivalent, trailing whitespace, and end-of-file checks pass.
- The specification and implementation plan now share one canonical corrupt/unsupported project behavior instead of independent UI assumptions.
- Documentation manifests, relative links, canonical corrupt-project requirements, branch mapping, diagram text equivalent, trailing whitespace, and end-of-file checks pass after the contract update.
- Repository-wide ESLint and TypeScript complete without errors.
- The optimized Next.js build succeeds and reports `/` as static and `/projects/[projectId]` as dynamic SSR.
- Feature-focused persistence, dashboard, loader, autosave, duplication, store, editor-shell, Preview, and SSR-laziness tests pass.
- Existing editor-shell and Preview regression suites pass 66 of 66 tests; the isolated Phase 5 suite passes 48 of 48 tests.
- A real Chrome run verified create, routed open, dirty-to-saved autosave, reload persistence, dashboard return, and the 390 px responsive card layout. Browser-created project data remains only in that test browser profile.
- Before the rebase, the complete suite passed 513 of 513 tests with a temporary 15-second runner ceiling. With the default five-second ceiling, one unchanged Phase 5 case could time out under full-machine load; repository test configuration remained unchanged. Node 22.21.1 produced the expected engine warning because the repository requires Node 24.19.x.
- The post-rebase focused whole-project duplication suite passes 2 of 2, including component-reference and Boolean State binding remapping.
- The final focused persistence, IndexedDB, loader, autosave, and whole-project duplication matrix passes 5 files and 19 tests.
- The pre-remediation focused matrix failed all four closure behaviors; after remediation, the four focused files pass 23 of 23 tests.
- The earlier checkpoint complete suite passed 41 files and 556 tests. The remediated feature-branch state passes 41 files and 559 tests with the temporary 15-second runner ceiling; repository-wide lint, normal typechecking, and the optimized production build also pass.
- A post-rebase Chrome smoke test lists two local projects, opens an existing project route, renders the 26-component library, reloads, and settles to **Saved locally**. The only console error is the known browser-extension `cz-shortcut-listen` body attribute mismatch.
- A controlled Chrome follow-up on 2026-08-16 created a project, added a second Heading, issued Browser Back immediately after the add interaction, reopened the project, and found both Headings. The same run submitted rename with Enter, displayed the renamed project, and verified that focus returned to the initiating **Rename** button.
- The only Chrome console error was the known extension-injected `cz-shortcut-listen` body-attribute hydration mismatch; no application-generated browser failure appeared during the follow-up.
- The 2026-08-18 focused final-review matrix passes 8 files and 49 tests; the complete suite passes 41 files and 556 tests with the temporary 15-second ceiling; repository-wide ESLint and `git diff --check` pass.
- A source-only TypeScript compiler run passes 121 files. The normal `pnpm typecheck` was initially blocked by malformed generated dev types while two same-folder servers were active; after port 3001 stopped and the dev state regenerated, `pnpm typecheck` passed outside the restricted sandbox under Node 22.21.1.
- The remediated production build passes after the user stopped the active development server. It reports the expected Node engine warning and an unrelated warning that `C:\Users\Suraj\pnpm-lock.yaml` is outside this repository.
- Before the extra server stopped, the port-3000 session served `/` but returned 404 for both `/preview` and `/projects/<projectId>` while the workspace global app-path manifest omitted those routes. After the user stopped the same-folder port-3001 server, only port 3000 remained and all three URLs returned 200. The temporary port-3102 server used during isolation was stopped after testing.
- The temporary production-browser pass produced no console warnings or errors. It created two QA-only records under the port-3102 origin. The port-3000 dashboard pass created `Virtual QA 2026-08-18 Renamed` and its copy while leaving the two pre-existing records unchanged.
- The PD-R05 and PD-R06 closure suites pass 2 files and 69 tests, including the three new production-boundary cases. The complete suite passes 41 files and 559 tests; `pnpm lint`, `pnpm typecheck`, and `git diff --check` pass under Node 22.21.1.
- The clean port-3000 development server serves the dashboard, Preview, and a missing-project route with HTTP 200, and the emitted stylesheet includes `--dashboard-ink: #17201f` for `.project-editor-boundary`.
- GitHub reports draft pull request 9 open and mergeable with base `main`, head `feature/project-dashboard`, and head commit `6c48a41fcdb65a34ac305419f2555dddde88966d` at creation.
- The six PD-R07 through PD-R09 cases fail against the published implementation and pass after remediation. The focused matrix passes 25 of 25 tests; the complete Node 22 suite passes 565 of 565 with the temporary ceiling; repository-wide lint, normal typecheck, diff checks, and the optimized build pass.
- Historical prepublication checkpoint `a6a7b78` passed the required Node 24.19 `CI / Validate` job before PD-R07 through PD-R09; the next entry records their later publication at `61641d3`.
- Published head `61641d3` contains PD-R07 through PD-R09 and passes the required Node 24.19 `CI / Validate` job.
- The two PD-R10 and PD-R11 behavior cases fail against `61641d3` and pass after remediation. The expanded focused matrix passes 27 of 27 tests; the complete Node 22 suite passes 567 of 567 with the temporary ceiling; repository-wide lint, normal typecheck, diff checks, and the optimized build pass.
- The PD-R13 cross-path identity assertion fails against `714973e` and passes after remediation. The affected three-file matrix passes 27 of 27 tests; the complete Node 22 suite passes 567 of 567 with the temporary ceiling; repository-wide lint, normal typecheck, diff checks, and the optimized build pass.
- Published head `b9e7879` contains all fourteen findings and passes the required Node 24.19 `CI / Validate` job.

**Remaining:**

- Complete owner review of draft pull request 9; promotion requires a green live current-head check.
- Review and revise the migration guide's proposed identity, revision, timestamp, idempotency, retention, recovery, and endpoint decisions.

**Last left off:**
2026-08-18 - All fourteen findings are published at `b9e7879`. The PD-R13 fail-before/pass-after assertion keeps recovery identities stable across list and project actions; the focused matrix passes 27 tests, the complete suite passes 567 tests with the temporary 15-second ceiling, and lint, typecheck, diff checks, the optimized build, final Chrome replay, and the exact-head Node 24.19 CI job pass. Owner review remains; promotion requires a green live current-head check.
