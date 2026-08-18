---
doc_id: WEB-BUILDER-PROJECT-DASHBOARD-WORKSPACE
type: D4
scope: Execution state for the local-first project dashboard, project persistence, and future backend transition in web-builder
authority: Selected execution-state authority for this future feature; Project.md and verified code own current behavior, and the linked draft specification owns proposed intent
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after published head 61641d3 passed Node 24.19 CI and the latest recovery-identity, modal-focus, and publication-record findings were locally remediated; invalidated by an approved backend, persistence, migration, authentication, dashboard, recovery, project-schema, hydration-error, API-contract, branch, pull-request, workspace-mapping, implementation, review, publication, or verification decision
---

# Project dashboard and persistence workspace

**Feature name:** Project dashboard and persistence

**Feature directory identifier:** `project-dashboard`

**Overall status:** The local-first dashboard slice and all twelve scoped review remediations are implemented in the current working tree. The first nine are published in [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) at `61641d3`, which passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32120382654/job/95659238395). The latest recovery-identity and modal-focus fixes still require commit, push, and a fresh required-runtime run. Owner review and the final remediation-state browser replay remain before ready-for-review promotion.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `feature/project-dashboard`, originally created from `main` at `da11e47760e39e98f0d6fb989307260c75d8fb9a` and rebased onto `origin/main` at `4835734ba7a371281b9d3d5c9d8bb520c5e9676e`. Repository context: [branch workspace](../../branches/web-builder/feature-project-dashboard/README.md).

**Current milestone:** Publish PD-R10 and PD-R11 to draft pull request 9, rerun its Node 24.19 matrix, and repeat the final remediation-state browser replay before promoting the pull request from draft; separately review the opt-in migration design before future backend work.

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

- **Current step:** Review and publish the locally verified PD-R10 and PD-R11 remediation, rerun Node 24.19 CI for the new head, and repeat the final browser replay before ready-for-review promotion.
- **Done:** Created checkpoint commit `6939faa`, rebased it as `153f397` onto `origin/main` at `4835734`, completed schema-version-3 integration in `4320c81`, saved PD-R01 through PD-R04 in `c4b9412`, remediated PD-R05 and PD-R06 in `6c48a41`, published PD-R07 through PD-R09 in `61641d3`, verified that head under Node 24.19, and locally remediated PD-R10 through PD-R12.
- **Verification:** The expanded three-file matrix passes 27 of 27 tests, covering cross-type unavailable recovery identities, numeric/string action containment, changed-inventory pagination, pending Escape behavior, and pending modal focus containment. Repository-wide ESLint, normal `pnpm typecheck`, `git diff --check`, the complete 41-file, 567-test suite, and the optimized production build pass under Node 22.21.1. Published head `61641d3` passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32120382654/job/95659238395) before the latest local code changes. The build emits `/` as static and `/preview`, `/projects/[projectId]`, and `/api/form-submissions` as dynamic routes.
- **Remaining:** Commit and push PD-R10 and PD-R11, rerun the complete Node 24.19 matrix for that published head, repeat the remediated visual states in a supported browser when the Browser plugin is repaired, decide when to promote the pull request from draft, and separately approve future migration identity, idempotency, retention, recovery, and endpoint decisions.
- **Last left off:** 2026-08-18 - PD-R10 through PD-R12 are implemented and locally verified on top of published head `61641d3`. Focused tests pass 27 of 27, the complete suite passes 567 of 567 with the temporary 15-second ceiling, and lint, typecheck, diff checks, and the optimized build pass under Node 22.21.1. Next action: commit and push the two code remediations, rerun Node 24.19 CI, and complete the final browser replay before ready-for-review promotion.

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
| 2026-08-18 | Push `feature/project-dashboard` and open a pull request. | Confirmed | Commit `6c48a41` was pushed and [draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) was opened against `main`; Node 24 verification and the final browser replay remain before ready-for-review promotion. |
| 2026-08-18 | Verify the then-current published pull-request head under the declared runtime. | Superseded checkpoint | Historical head `a6a7b78` passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32109626246/job/95626050223); later publication advanced the head to `61641d3`. |
| 2026-08-18 | Execute the three latest P2 review remediations. | Confirmed | PD-R07 through PD-R09 were published in `61641d3` and passed its required Node 24.19 job. |
| 2026-08-18 | Remediate the follow-up recovery-identity, modal-focus, and publication-record findings. | Confirmed | PD-R10 through PD-R12 are locally verified; the two code fixes require publication and a fresh Node 24 run. |
