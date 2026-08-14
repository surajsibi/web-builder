---
doc_id: WEB-BUILDER-BACKEND-WORKSPACE
type: D4
scope: Execution state for future project persistence, dashboard storage, and backend API planning in web-builder
authority: Selected execution-state authority for this future feature; Project.md and verified code own current behavior, and the linked draft specification owns proposed intent
owner: Project owner
lifecycle: draft
freshness: Reverified on 2026-08-14 against the schema-version-3 project model and hydration boundary at commit d12b4c5af8dc710cfc153a927aaf059bb08906f8; invalidated by an approved backend, persistence, authentication, dashboard, project-schema, or API-contract decision
---

# Backend and project persistence workspace

**Feature name:** Backend and project persistence

**Feature directory identifier:** `backend`

**Overall status:** Planning workspace initialized; no backend or persistence implementation is approved or started

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `main` for documentation only; create a separately approved feature branch before implementation

**Current milestone:** Preserve one useful, reviewable draft of the future project-storage model, API shapes, validation boundary, and local-to-backend transition.

**Feature summary:** Define how the project dashboard and editor can save, list, load, rename, duplicate, and eventually delete projects. Use browser-local IndexedDB behind a repository interface before a backend exists, then replace that adapter with a revision-checked API without changing the canonical project document or bypassing hydration validation.

## Selected documents

- [Draft project persistence and backend specification](plan/project-persistence-and-backend-spec.md)

## Scope

- Record verified current project-document and hydration boundaries.
- Record proposed local storage, backend storage, API, response, and error contracts.
- Separate persisted project content from editor-only session state and sensitive data.
- Track decisions and open questions so later work can be added only after explicit approval.

## Out of scope

- Backend folders under `src/`, route handlers, database schemas, migrations, or dependencies.
- Implementing IndexedDB, autosave, dashboard routes, authentication, authorization, publishing, deployment, asset uploads, or form-submission storage.
- Selecting a database, backend framework, hosting provider, authentication provider, retention period, or pricing model.

## Execution state

- **Current step:** Await the project owner's next approved backend or persistence requirement.
- **Done:** Created the planning-only workspace and captured the initial project storage, API payload, validation, concurrency, and migration proposal.
- **Verification:** Revalidated the draft against schema version 3 in `src/builder/model/project-document.ts`, the deterministic migration and hydration boundary, `src/builder/project/factory.ts`, the implemented routes under `src/app`, and the persistence boundaries in `Project.md`.
- **Remaining:** Approve or revise the proposed contract one decision at a time; select the first implementation slice only when requested.
- **Last left off:** 2026-08-14 - Revalidated the planning contract and examples for project schema version 3. No backend code, local persistence code, API route, database choice, or package change has been made.

## Decision intake

| Date | Decision or request | State | Effect |
| --- | --- | --- | --- |
| 2026-08-14 | Create a dedicated backend planning workspace and do not scaffold implementation until explicitly requested. | Confirmed | This workspace and its draft specification are the only delivered artifacts. |
