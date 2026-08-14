---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-WORKSPACE
type: D4
scope: Execution state for the local-first project dashboard, project persistence, and future backend transition in web-builder
authority: Selected execution-state authority for this future feature; Project.md and verified code own current behavior, and the linked draft specification owns proposed intent
owner: Project owner
lifecycle: draft
freshness: Verified on 2026-08-14 after post-rebase lint, typecheck, 551-test, production-build, focused schema-version-3 integration, and rendered browser verification against origin/main 4835734ba7a371281b9d3d5c9d8bb520c5e9676e; invalidated by an approved backend, persistence, migration, authentication, dashboard, recovery, project-schema, hydration-error, API-contract, branch, workspace-mapping, or implementation decision
---

# Project dashboard and persistence workspace

**Feature name:** Project dashboard and persistence

**Feature directory identifier:** `project-dashboard`

**Overall status:** The local-first dashboard, IndexedDB repository, project-specific editor, and revision-safe autosave slice are implemented on the dedicated feature branch and ready for project-owner review; backend migration remains future work

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/project-dashboard`, originally created from `main` at `da11e47760e39e98f0d6fb989307260c75d8fb9a` and rebased onto `origin/main` at `4835734ba7a371281b9d3d5c9d8bb520c5e9676e`. Repository context: [branch workspace](../../branches/web-builder/feature-project-dashboard/README.md).

**Current milestone:** Review the verified rebased browser-local slice and decide whether to push it; separately review the opt-in migration design before future backend work.

**Feature summary:** Define how the project dashboard and editor can save, list, load, rename, duplicate, and eventually delete projects. Use browser-local IndexedDB behind a repository interface before a backend exists, then replace that adapter with a revision-checked API without changing the canonical project document or bypassing hydration validation.

## Selected documents

- [Draft project persistence and backend specification](plan/project-persistence-and-backend-spec.md)
- [Project dashboard implementation plan](plan/project-dashboard-implementation-plan.md)
- [Local-to-backend project migration guide](plan/local-to-backend-project-migration-guide.md)
- [Project dashboard implementation report](reports/project-dashboard-implementation-report.md)

## Scope

- Maintain the verified project-document, hydration, repository, dashboard, route, and autosave boundaries.
- Implement browser-local create, list, load, save, rename, and duplicate behavior behind `ProjectRepository`.
- Preserve corrupt and unsupported records through safe **Needs recovery** states.
- Document the explicit-consent, idempotent, verifiable migration from local IndexedDB projects to future authenticated backend storage.
- Separate persisted project content from editor-only session state and sensitive data.
- Track decisions and open questions so later work can be added only after explicit approval.

## Out of scope

- Backend API routes, database schemas, server migrations, or cloud-storage dependencies.
- Authentication, authorization, publishing, deployment, asset uploads, deletion, templates, or form-submission storage.
- Selecting a database, backend framework, hosting provider, authentication provider, retention period, or pricing model.

## Execution state

- **Current step:** Review the verified rebased local-first slice and decide whether to push the feature branch.
- **Done:** Created checkpoint commit `6939faa`, rebased it as `153f397` onto `origin/main` at `4835734`, preserved the `project-dashboard` workspace rename, retained the safe recovery contract, remapped schema-version-3 references during whole-project duplication, and preserved hydration's migration signal through revisioned autosave.
- **Verification:** Repository-wide lint and typecheck pass; the focused schema-version-3 persistence/duplication matrix passes 5 files and 19 tests; the complete suite passes 41 files and 551 tests with a temporary 15-second ceiling; the production build passes; and Chrome renders the dashboard, routed editor, 26-component library, reload, and saved state. Verification uses Node 22.21.1 because required Node 24.19.x is unavailable.
- **Remaining:** Owner review, explicit push direction, a full Node 24.19.x verification run when available, and separate approval of future migration identity, idempotency, retention, recovery, and endpoint decisions.
- **Last left off:** 2026-08-14 - The local-first dashboard is rebased onto the Boolean State/Drawer mainline, schema-version-3 integration issues are fixed, and the complete Node 22 verification matrix passes. The next action is owner review and an explicit push decision.

## Decision intake

| Date | Decision or request | State | Effect |
| --- | --- | --- | --- |
| 2026-08-14 | Create a dedicated backend planning workspace and do not scaffold implementation until explicitly requested. | Confirmed | This workspace and its draft specification are the only delivered artifacts. |
| 2026-08-14 | Create `feature/project-dashboard` after preserving the planning baseline on `main`. | Confirmed | Branch-specific planning and later approved implementation continue on the dedicated feature branch. |
| 2026-08-14 | Rename the canonical feature workspace from `backend` to `project-dashboard`. | Confirmed | The workspace name now matches the active dashboard feature; future backend transition planning remains a supporting document rather than the workspace identity. |
| 2026-08-14 | Document how browser-local projects will migrate to future backend storage. | Confirmed | Added a separate D6 migration guide with explicit consent, idempotency, verification, coexistence, rollback, and retirement gates. |
| 2026-08-14 | Define how a corrupt project appears in the dashboard before implementation. | Confirmed | The D1 specification now requires an isolated **Needs recovery** card, safe bounded metadata, reason-specific copy, no ordinary actions, preserved raw data, and bounded direct-route behavior. |
| 2026-08-14 | Start implementation of the approved local-first dashboard slice. | Confirmed | Implemented PD-01 through PD-08 without adding backend, authentication, deletion, templates, or cloud migration. |
