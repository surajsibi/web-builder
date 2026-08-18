---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-WORKSPACE
type: D4
scope: Execution state for the local-first project dashboard, project persistence, and future backend transition in web-builder
authority: Selected execution-state authority for this future feature; Project.md and verified code own current behavior, and the linked draft specification owns proposed intent
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after published head b9e7879 closed all fourteen findings and passed Node 24.19 CI, with the final browser replay also complete; invalidated by an approved backend, persistence, migration, authentication, dashboard, recovery, project-schema, hydration-error, API-contract, branch, pull-request, workspace-mapping, implementation, review, publication, or verification decision
---

# Project dashboard and persistence workspace

**Feature name:** Project dashboard and persistence

**Feature directory identifier:** `project-dashboard`

**Overall status:** The local-first dashboard slice and all fourteen scoped review remediations are implemented and published in [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) at head `b9e7879`, which passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32128646603/job/95684696642). The final controlled Chrome replay also passes. Owner review remains; promotion requires a green live current-head check.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/project-dashboard`, originally created from `main` at `da11e47760e39e98f0d6fb989307260c75d8fb9a` and rebased onto `origin/main` at `4835734ba7a371281b9d3d5c9d8bb520c5e9676e`. Repository context: [branch workspace](../../branches/web-builder/feature-project-dashboard/README.md).

**Current milestone:** Complete owner review of draft pull request 9; promotion requires a green live current-head check. Separately review the opt-in migration design before future backend work.

**Feature summary:** Define how the project dashboard and editor can save, list, load, rename, duplicate, and eventually delete projects. Use browser-local IndexedDB behind a repository interface before a backend exists, then replace that adapter with a revision-checked API without changing the canonical project document or bypassing hydration validation.

## Selected documents

- [Draft project persistence and backend specification](plan/project-persistence-and-backend-spec.md)
- [Project dashboard implementation plan](plan/project-dashboard-implementation-plan.md)
- [Local-to-backend project migration guide](plan/local-to-backend-project-migration-guide.md)
- [Project dashboard implementation report](reports/project-dashboard-implementation-report.md)
- [Project dashboard code-review findings](review/project-dashboard-code-review-findings.md)

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

- **Current step:** Complete owner review of draft pull request 9; promotion requires a green live current-head check.
- **Done:** Created checkpoint commit `6939faa`, rebased it as `153f397` onto `origin/main` at `4835734`, completed schema-version-3 integration in `4320c81`, saved PD-R01 through PD-R04 in `c4b9412`, remediated PD-R05 and PD-R06 in `6c48a41`, published PD-R07 through PD-R09 in `61641d3`, published PD-R10 through PD-R12 in `714973e`, completed the final controlled Chrome replay, and published PD-R13 through PD-R14 in `b9e7879`.
- **Verification:** The three-file matrix passes 27 of 27 tests, covering cross-type unavailable recovery identities, stable list/action recovery identities, numeric/string action containment, changed-inventory pagination, pending Escape behavior, and pending modal focus containment. Repository-wide ESLint, normal `pnpm typecheck`, `git diff --check`, the complete 41-file, 567-test suite, and the optimized production build pass under Node 22.21.1. Published head `b9e7879` passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32128646603/job/95684696642). The final Chrome replay verified distinct real-IndexedDB recovery cards and create/rename modal containment with no console warnings or errors. The build emits `/` as static and `/preview`, `/projects/[projectId]`, and `/api/form-submissions` as dynamic routes.
- **Remaining:** Complete owner review and decide when to promote the pull request from draft; promotion requires a green live current-head check. Separately approve future migration identity, idempotency, retention, recovery, and endpoint decisions.
- **Last left off:** 2026-08-18 - All fourteen findings are published at `b9e7879`. The PD-R13 fail-before/pass-after assertion keeps recovery identities stable across list and project actions; focused tests pass 27 of 27, the complete suite passes 567 of 567 with the temporary 15-second ceiling, and lint, typecheck, diff checks, the optimized build, final Chrome replay, and the exact-head Node 24.19 CI job pass. Owner review remains; promotion requires a green live current-head check.

## Decision intake

| Date | Decision or request | State | Effect |
| --- | --- | --- | --- |
| 2026-08-14 | Create a dedicated backend planning workspace and do not scaffold implementation until explicitly requested. | Confirmed | This workspace and its draft specification are the only delivered artifacts. |
| 2026-08-14 | Create `feature/project-dashboard` after preserving the planning baseline on `main`. | Confirmed | Branch-specific planning and later approved implementation continue on the dedicated feature branch. |
| 2026-08-14 | Rename the canonical feature workspace from `backend` to `project-dashboard`. | Confirmed | The workspace name now matches the active dashboard feature; future backend transition planning remains a supporting document rather than the workspace identity. |
| 2026-08-14 | Document how browser-local projects will migrate to future backend storage. | Confirmed | Added a separate D6 migration guide with explicit consent, idempotency, verification, coexistence, rollback, and retirement gates. |
| 2026-08-14 | Define how a corrupt project appears in the dashboard before implementation. | Confirmed | The D1 specification now requires an isolated **Needs recovery** card, safe bounded metadata, reason-specific copy, no ordinary actions, preserved raw data, and bounded direct-route behavior. |
| 2026-08-14 | Start implementation of the approved local-first dashboard slice. | Confirmed | Implemented PD-01 through PD-08 without adding backend, authentication, deletion, templates, or cloud migration. |
| 2026-08-15 | Accept the recommendation to remediate all four project-dashboard code-review findings. | Confirmed | Implemented and verified PD-R01 through PD-R04 without expanding the approved local-first scope. |
| 2026-08-16 | Run the supported-browser remediation follow-up. | Confirmed | Controlled Chrome verified that the immediate-Back edit persisted and that Enter-submitted rename restored focus to the initiating control. |
| 2026-08-18 | Run the final pre-push branch review. | Confirmed | PD-R01 through PD-R04 remain closed; PD-R05 and PD-R06 are open, and publication is on hold pending a remediation decision. |
| 2026-08-18 | Remediate PD-R05 and PD-R06 after the user approved continuing. | Confirmed | Shared boundary tokens and visible toolbar recovery guidance are implemented; production-component closure tests pass and all six scoped findings are closed. |
| 2026-08-18 | Push `feature/project-dashboard` and open a pull request. | Historical checkpoint | Commit `6c48a41` opened [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9); later rows supersede its then-pending Node 24 and browser gates. |
| 2026-08-18 | Verify the then-current published pull-request head under the declared runtime. | Superseded checkpoint | Historical head `a6a7b78` passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32109626246/job/95626050223); later publication advanced the head to `61641d3`. |
| 2026-08-18 | Execute the three latest P2 review remediations. | Confirmed | PD-R07 through PD-R09 were published in `61641d3` and passed its required Node 24.19 job. |
| 2026-08-18 | Remediate the follow-up recovery-identity, modal-focus, and publication-record findings. | Superseded checkpoint | PD-R10 through PD-R12 were locally verified at that point; the next row records their later publication and Node 24 run. |
| 2026-08-18 | Publish PD-R10 through PD-R12 and verify the required runtime. | Confirmed | Checkpoint `714973e` contains the first twelve findings and passed its Node 24.19 `CI / Validate` job. |
| 2026-08-18 | Complete the final remediation-state browser replay. | Confirmed | Controlled Chrome verified distinct adversarial recovery cards and pending create/rename focus, dismissal, and resubmission containment; the temporary QA route was removed. |
| 2026-08-18 | Remediate stable cross-path recovery identities and the repeated publication-record drift. | Confirmed | PD-R13 and PD-R14 are closed in the current branch; publication state is now anchored to historical checkpoints while the live PR owns current-head status. |
| 2026-08-18 | Publish PD-R13 and PD-R14 and verify the required runtime. | Confirmed | Head `b9e7879` contains all fourteen findings and passed its Node 24.19 `CI / Validate` job; owner review remains, and promotion requires a green live current-head check. |
