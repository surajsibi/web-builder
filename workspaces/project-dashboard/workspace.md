---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-WORKSPACE
type: D4
scope: Execution state for the local-first project dashboard, project persistence, and future backend transition in web-builder
authority: Selected execution-state authority for this future feature; Project.md and verified code own current behavior, and the linked draft specification owns proposed intent
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-14 after implementing and verifying the local-first dashboard slice; invalidated by an approved backend, persistence, migration, authentication, dashboard, recovery, project-schema, hydration-error, API-contract, branch, workspace-mapping, or implementation decision
---

# Project dashboard and persistence workspace

**Feature name:** Project dashboard and persistence

**Feature directory identifier:** `project-dashboard`

**Overall status:** The local-first dashboard, IndexedDB repository, project-specific editor, and revision-safe autosave slice are implemented on the dedicated feature branch and ready for project-owner review; backend migration remains future work

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/project-dashboard`, created from `main` at `da11e47760e39e98f0d6fb989307260c75d8fb9a`. Repository context: [branch workspace](../../branches/web-builder/feature-project-dashboard/README.md).

**Current milestone:** Review the implemented browser-local slice and decide whether to commit and publish it; separately review the opt-in migration design before future backend work.

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

- **Current step:** Review the implemented local-first slice and decide whether to commit and publish the branch changes.
- **Done:** Completed PD-00 through PD-08: repository contracts, memory and IndexedDB adapters, safe duplication, responsive dashboard, project-specific loader/store, autosave and conflict handling, regression/browser verification, and the in-review D5 implementation report. The future D6 backend migration guide remains proposed.
- **Verification:** Repository-wide lint, typecheck, production build, focused feature suites, 66 editor/Preview regressions, and the isolated 48-test Phase 5 suite pass. The complete suite passes 513 of 513 with a temporary 15-second runner ceiling; repository test configuration remains unchanged. A browser journey verified create, routed open, autosave, reload persistence, dashboard return, and mobile layout. Verification used Node 22.21.1 with an engine warning because required Node 24.19.x is unavailable.
- **Remaining:** Owner review, explicit commit/push direction, a full Node 24.19.x verification run when available, and separate approval of future migration identity, idempotency, retention, recovery, and endpoint decisions.
- **Last left off:** 2026-08-14 - The local-first project dashboard and persistent editor slice is implemented and production-build verified. The next action is owner review and an explicit commit/push decision; no backend, authentication, deletion, export, or cloud migration was added.

## Decision intake

| Date | Decision or request | State | Effect |
| --- | --- | --- | --- |
| 2026-08-14 | Create a dedicated backend planning workspace and do not scaffold implementation until explicitly requested. | Confirmed | This workspace and its draft specification are the only delivered artifacts. |
| 2026-08-14 | Create `feature/project-dashboard` after preserving the planning baseline on `main`. | Confirmed | Branch-specific planning and later approved implementation continue on the dedicated feature branch. |
| 2026-08-14 | Rename the canonical feature workspace from `backend` to `project-dashboard`. | Confirmed | The workspace name now matches the active dashboard feature; future backend transition planning remains a supporting document rather than the workspace identity. |
| 2026-08-14 | Document how browser-local projects will migrate to future backend storage. | Confirmed | Added a separate D6 migration guide with explicit consent, idempotency, verification, coexistence, rollback, and retirement gates. |
| 2026-08-14 | Define how a corrupt project appears in the dashboard before implementation. | Confirmed | The D1 specification now requires an isolated **Needs recovery** card, safe bounded metadata, reason-specific copy, no ordinary actions, preserved raw data, and bounded direct-route behavior. |
| 2026-08-14 | Start implementation of the approved local-first dashboard slice. | Confirmed | Implemented PD-01 through PD-08 without adding backend, authentication, deletion, templates, or cloud migration. |
