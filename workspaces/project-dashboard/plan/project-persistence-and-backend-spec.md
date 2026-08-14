---
doc_id: WEB-BUILDER-PROJECT-PERSISTENCE-BACKEND-SPEC
type: D1
scope: Proposed project persistence, dashboard repository, storage record, and HTTP API contract for web-builder schema version 3
authority: Draft product and interface intent only; verified code owns current behavior, and an approved executable schema will own the future machine contract
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-14 after aligning the implemented browser-local repository and dashboard contract with project schema version 3 from main; invalidated by an approved persistence, dashboard, authentication, API, project-schema, hydration-error, migration, recovery, or storage decision
---

# Project persistence and backend specification

## Status and intended outcome

This document preserves the contract for saving projects before and after a backend exists. The browser-local repository, dashboard, project route, safe unavailable-record behavior, and revision-checked autosave are implemented on `feature/project-dashboard` after a separate explicit request. Backend API, authentication, deletion, export/recovery, and cloud migration sections remain proposed future contracts and require their own approval.

The intended transition is:

```text
Initial phase: Dashboard/editor -> ProjectRepository -> browser IndexedDB
Backend phase: Dashboard/editor -> ProjectRepository -> HTTP API -> durable database
```

The dashboard and editor depend on `ProjectRepository`, not directly on IndexedDB or a specific backend. Replacing the repository adapter must not change the canonical project format or allow stored data to bypass validation.

## Problem and evidence

The editor has a versioned, JSON-compatible project model but has no durable project repository, project dashboard route, or project API. The implemented application routes are the editor, Preview, and a fail-closed form-submission endpoint. Preview browser storage is a one-use transfer and is not project persistence.

Verified current authorities:

- [`ProjectDocument`](../../../src/builder/model/project-document.ts) defines schema version, identity, project content, timestamps, and revision.
- [`createNewProject`](../../../src/builder/project/factory.ts) creates an empty Home page and starts at revision `0`.
- [`prepareProjectHydration`](../../../src/builder/project/hydration.ts) performs migrations, strict document validation, tree validation, component migration and validation, placement validation, and runtime index preparation.
- [`Project.md`](../../../Project.md#undo-autosave-and-persistence) defines the future revision-checked autosave and atomic hydration boundary.

Everything described as **proposed** below remains unimplemented and may be changed by an approved product or architecture decision.

## Outcomes and non-goals

| Kind | Statement | Measure |
| --- | --- | --- |
| Outcome | Save multiple projects locally before a backend exists. | A reload can list and reopen valid projects from the same browser profile. |
| Outcome | Keep dashboard and editor storage-independent. | Both use the same repository interface with local and API adapters. |
| Outcome | Preserve one canonical project transport format. | Every loaded project passes the existing migration and hydration boundary. |
| Outcome | Prevent lost updates when a backend is introduced. | Every write compares an expected revision and conflicts safely. |
| Outcome | Retain useful project metadata for dashboard discovery. | List responses contain identity, name, timestamps, revision, and derived page count without transferring every node. |
| Non-goal | Implement any backend or local persistence in this documentation change. | Not applicable |
| Non-goal | Select a database, framework, cloud, or authentication vendor. | Not applicable |
| Non-goal | Store visitor form values, secrets, uploads, generated source, publishing state, or deployment state. | Not applicable |
| Non-goal | Synchronize simultaneous offline edits or provide collaborative editing. | Not applicable |

## Users and journeys

The initial user is a single designer working in one browser profile:

1. Create a project from the dashboard.
2. Open the project in a project-specific editor route.
3. Edit pages and components.
4. See explicit saving, saved, local-only, and error states.
5. Return to the dashboard and reopen, rename, or duplicate a project.
6. Export a project as JSON for a manual backup when that separate feature is approved.

After authentication and a backend are approved, the same journey loads authorized projects through the API. A migration flow may offer to upload browser-local projects; it must never upload them silently.

## Canonical data boundaries

### Persist the project document

The canonical transport is the implemented `ProjectDocument`. Its current top-level fields are:

| Field | Format | Ownership and use |
| --- | --- | --- |
| `schemaVersion` | Non-negative supported integer; version `3` at the recorded verification commit | Selects deterministic document migrations. Clients cannot bypass compatibility checks. |
| `projectId` | Non-empty opaque string | Allocated once by the active repository and immutable. |
| `name` | Non-empty trimmed string | User-facing project name shown by the dashboard and editor. |
| `pages` | Record keyed by page ID | Canonical pages and component trees. Keys must match embedded IDs. |
| `pageOrder` | Ordered page-ID array | Contains every page exactly once. |
| `homePageId` | Existing page ID | References the page whose slug is `/`. |
| `createdAt` | ISO 8601 date-time with timezone | Repository-owned creation time. |
| `updatedAt` | ISO 8601 date-time with timezone | Repository-owned successful-write time. |
| `revision` | Non-negative integer | Repository-owned optimistic-concurrency version. |

The nested `PageDocument` and `BuilderNode` formats remain owned by [`project-document.ts`](../../../src/builder/model/project-document.ts). The API specification links to that authority instead of maintaining a second field list that could drift.

### Do not persist editor session state

The project repository must not store:

- active page, selection, hover, breadcrumbs, viewport, zoom, open panels, drag state, or drop targets;
- runtime-only `parentById` indexes;
- Undo and Redo history or the session `commitId`;
- temporary invalid Inspector input;
- one-use Preview snapshots or tokens;
- visitor-entered form values;
- access tokens, API credentials, database credentials, or other secrets;
- derived Canvas DOM, generated HTML/CSS, or cached thumbnails unless a later contract explicitly owns them.

### Proposed editable-content payload

Server-owned identity and concurrency fields must not be accepted as ordinary editor mutations. A save request therefore carries only the expected server revision and editable document content.

```ts
// Illustrative TypeScript; no executable API schema exists yet.
type ProjectContentPayload = Pick<
  ProjectDocument,
  "schemaVersion" | "name" | "pages" | "pageOrder" | "homePageId"
>;

type SaveProjectRequest = {
  expectedRevision: number;
  content: ProjectContentPayload;
};
```

The repository reconstructs a complete candidate using the route project ID and stored timestamps, increments the revision only after validation succeeds, and returns repository-owned metadata.

### Proposed dashboard summary

```ts
// Illustrative TypeScript; pageCount is derived rather than independently stored.
type ProjectSummary = {
  projectId: string;
  name: string;
  schemaVersion: number;
  revision: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};

type UnavailableProjectSummary = {
  recoveryId: string;
  displayName: string;
  lastKnownUpdatedAt: string | null;
  reason: "invalid-project" | "unsupported-version";
};

type ProjectListItem =
  | { availability: "ready"; summary: ProjectSummary }
  | { availability: "unavailable"; summary: UnavailableProjectSummary };
```

The list contract does not include component nodes. Opening a ready project retrieves the complete `ProjectDocument` separately. `recoveryId` is a stable opaque reference derived by the owning storage adapter from the physical record key; it is not a valid editor route ID and must not be presented as a project identity.

### Corrupt and unsupported project dashboard contract

A stored project is **corrupt** when its physical record can be enumerated but a cloned payload cannot complete normal project hydration because of malformed JSON, a missing or invalid envelope, failed document or component migration, invalid schema, invalid tree, unknown component, invalid component props or styles, or invalid placement. Corrupt is an internal data classification; the user-facing dashboard label is **Needs recovery**.

A stored project is **unsupported** when hydration returns an explicit stable compatibility result showing that the document or a known component requires a newer or unsupported version. Unsupported records use the same unavailable-card behavior but different explanatory copy. Implementation must use structured compatibility/error codes; it must not classify by parsing human-readable error messages.

The following are not corrupt-project records:

- a missing project key, which is **Not found**;
- IndexedDB denial, blocked opening, transaction failure, or inability to enumerate records, which is a dashboard-level **Storage unavailable** state; or
- a supported older project that successfully migrates and fully hydrates on a working clone, which is a ready project that needs a later revisioned save.

The local repository evaluates each physical record independently during `list`:

1. Preserve the untouched raw value.
2. Clone it and call `prepareProjectHydration`.
3. Return a ready summary only when full hydration succeeds.
4. Return an unavailable summary with `unsupported-version` only for a stable compatibility result.
5. Return an unavailable summary with `invalid-project` for every other hydration failure.
6. Continue listing other records when one record is unavailable.

The adapter derives display-only recovery metadata defensively. It may use a raw project name only when it is a bounded, trimmed, non-empty string without control characters; otherwise use **Unavailable local project**. It may expose `lastKnownUpdatedAt` only when it is a valid bounded ISO date-time. It never derives or displays page count, revision, schema version, or ordinary project actions from an invalid document.

The dashboard renders an unavailable record as follows:

| Surface | Required behavior |
| --- | --- |
| Card title | Safe bounded name or **Unavailable local project**. |
| Status | Visible text badge **Needs recovery**; color is not the only signal. |
| Corrupt explanation | **This project's saved data is damaged or incomplete and cannot be opened safely.** |
| Unsupported explanation | **This project was created with a version of Canvas Studio that this build cannot open.** |
| Location | **Stored on this browser** so the user knows data still exists locally. |
| Metadata | Safe last-known update time when available; no page count or revision. |
| Action | **View recovery details**, opening an accessible dialog with the safe reason category, preservation statement, and future recovery guidance. |
| Prohibited actions | Do not render Open, Rename, Duplicate, Preview, Save, or Delete for the unavailable record. |

The recovery-details dialog must not expose raw JSON, stack traces, browser exception text, component props, validation paths containing authored content, or internal database details. It explains that the original browser record remains unchanged and that normal editing and autosave are disabled. Raw recovery download/import remains a separately approved recovery slice; until it exists, the dialog must not claim the project can already be repaired or exported.

Unavailable records remain visible rather than disappearing from the project count. Dashboard summary copy reports both totals, for example **4 local projects, 1 needs recovery**. Search may match only the safe `displayName`. Ready and unavailable entries sort by safe update time descending; unavailable entries without a safe time sort last with a stable `recoveryId` tie-breaker.

Navigating directly to `/projects/{projectId}` for an unavailable record renders the same bounded recovery state. It never creates a replacement blank project, hydrates partial content, starts autosave, runs project mutations, or rewrites the raw source. Future migration to backend storage also excludes the record until the separately approved recovery path produces a fully validated project.

## Proposed repository interface

```ts
// Illustrative TypeScript. Exact errors and pagination types remain draft.
interface ProjectRepository {
  list(input?: {
    query?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    items: ProjectListItem[];
    nextCursor: string | null;
  }>;

  create(input: { name: string }): Promise<ProjectDocument>;
  load(projectId: string): Promise<ProjectDocument>;
  save(projectId: string, input: SaveProjectRequest): Promise<SaveProjectReceipt>;
  rename(
    projectId: string,
    input: { name: string; expectedRevision: number },
  ): Promise<SaveProjectReceipt>;
  duplicate(projectId: string, input?: { name?: string }): Promise<ProjectDocument>;
  delete(projectId: string, expectedRevision: number): Promise<void>;
}

type SaveProjectReceipt = {
  projectId: string;
  revision: number;
  updatedAt: string;
};
```

Deletion remains part of the interface so the dashboard boundary is complete, but its implementation must wait for an explicit hard-delete versus recoverable-delete and retention decision.

## Storage phases

### Browser-local phase

The proposed initial adapter is IndexedDB rather than `localStorage`. Project documents can grow, and IndexedDB provides asynchronous structured storage without blocking the main thread with one large synchronous string.

A local record may contain:

```ts
// Illustrative local-only storage record.
type LocalProjectRecord = {
  document: ProjectDocument;
  lastOpenedAt: string | null;
};
```

Local behavior must:

- validate a project before the first commit and after every read;
- use the same revision comparison as the future API adapter;
- update `updatedAt` and increment `revision` only after a successful write;
- show **Saved locally on this browser** rather than implying cloud backup;
- return corrupt or unsupported records as isolated **Needs recovery** list items while preserving their raw source and preventing ordinary project actions, editing, and autosave;
- explain that clearing browser data, using private browsing, or changing devices can remove access;
- avoid silently uploading local projects when a backend later becomes available.

### Durable backend phase

The proposed provider-neutral project record separates searchable metadata from JSON content:

| Stored value | Purpose | Initial requirement |
| --- | --- | --- |
| `id` | Stable project identity | Required |
| `owner_id` | Authorization boundary after authentication exists | Decision required before multi-user backend delivery |
| `name` | Dashboard search and display | Required |
| `schema_version` | Migration and compatibility gate | Required |
| `content_json` | `pages`, `pageOrder`, and `homePageId` | Required; validated JSON only |
| `revision` | Optimistic concurrency | Required |
| `created_at` | Audit and ordering | Required; server generated |
| `updated_at` | Dashboard ordering and save receipt | Required; server generated |
| `deleted_at` | Recoverable deletion | Optional; blocked on retention decision |

The storage layer assembles these values into the complete `ProjectDocument` returned to clients. `pageCount` is derived from validated content. User-specific activity such as `lastOpenedAt` must not be embedded in a shared project record if multi-user access is later supported.

Binary assets, thumbnails, deployments, form submissions, audit events, and secrets require separate storage contracts. They must not be inserted into `content_json` merely because the project record already exists.

## Proposed HTTP API

The paths are draft and assume same-origin Next.js route handlers or an equivalent gateway. A later separate backend may preserve these public paths while changing the internal service location.

| Method and path | Purpose | Request | Success data |
| --- | --- | --- | --- |
| `GET /api/projects` | List authorized project summaries, newest update first | Query: `query`, opaque `cursor`, bounded `limit` | `{ items, nextCursor }` |
| `POST /api/projects` | Create an empty project | `{ name }` | Complete `ProjectDocument` |
| `GET /api/projects/{projectId}` | Load one authorized project | None | Complete `ProjectDocument` |
| `PUT /api/projects/{projectId}` | Save editor content | `SaveProjectRequest` | `SaveProjectReceipt` |
| `PATCH /api/projects/{projectId}` | Rename from the dashboard | `{ name, expectedRevision }` | `SaveProjectReceipt` |
| `POST /api/projects/{projectId}/duplicate` | Copy a project with fresh project, page, and node IDs | Optional `{ name }` | Complete new `ProjectDocument` |
| `DELETE /api/projects/{projectId}` | Delete according to the separately approved retention policy | Revision precondition | No content |

### Success envelope

```json
{
  "data": {
    "projectId": "project_example",
    "revision": 13,
    "updatedAt": "2026-08-14T12:30:00.000Z"
  }
}
```

### List response

```json
{
  "data": {
    "items": [
      {
        "projectId": "project_example",
        "name": "Marketing site",
        "schemaVersion": 3,
        "revision": 13,
        "pageCount": 4,
        "createdAt": "2026-08-10T09:00:00.000Z",
        "updatedAt": "2026-08-14T12:30:00.000Z"
      }
    ],
    "nextCursor": null
  }
}
```

### Save request

This minimal example contains one empty Home page. Real node props and styles use the existing component and responsive-style contracts.

```json
{
  "expectedRevision": 12,
  "content": {
    "schemaVersion": 3,
    "name": "Marketing site",
    "pages": {
      "page_home": {
        "id": "page_home",
        "name": "Home",
        "slug": "/",
        "rootIds": [],
        "nodes": {}
      }
    },
    "pageOrder": ["page_home"],
    "homePageId": "page_home"
  }
}
```

### Error envelope

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "The project changed after this editor loaded it.",
    "requestId": "request_example",
    "details": {
      "expectedRevision": 12,
      "currentRevision": 13
    }
  }
}
```

Error responses must not expose stack traces, database errors, secrets, other users' resource existence, or rejected project content. Proposed stable error codes are:

| HTTP status | Code | Meaning |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | Request envelope or query is malformed. |
| `401` | `AUTHENTICATION_REQUIRED` | Authentication is required after auth exists. |
| `403` | `PROJECT_ACCESS_DENIED` | The authenticated user cannot perform the action. |
| `404` | `PROJECT_NOT_FOUND` | No accessible project exists for the opaque ID. |
| `409` | `REVISION_CONFLICT` | `expectedRevision` does not match the stored revision. |
| `413` | `PROJECT_TOO_LARGE` | Approved document or request limits are exceeded. |
| `422` | `INVALID_PROJECT` | Project migration, schema, tree, component, style, or placement validation failed. |
| `429` | `RATE_LIMITED` | An approved request limit was exceeded. |
| `500` | `INTERNAL_ERROR` | An unexpected failure occurred; details remain server-side. |

## Save and load behavior

### Save

1. Authenticate and authorize when those capabilities exist.
2. Parse a bounded JSON request.
3. Load the stored record without exposing it to another user.
4. Compare `expectedRevision` with the stored revision.
5. Reconstruct a complete candidate with server-owned ID and timestamps.
6. Run the same migration and validation contract as project hydration.
7. Persist content and metadata atomically with `revision + 1` and a server-generated `updatedAt`.
8. Return the save receipt.
9. Mark the editor clean only if its captured `commitId` still matches; otherwise schedule another save.

Validation failures and revision conflicts must not partially write the project.

### Load

1. Read the authorized raw record without mutating it.
2. Assemble the complete `ProjectDocument`.
3. Preserve the untouched source while migrations run on a working candidate.
4. Reject unsupported future versions, invalid migrations, invalid trees, unknown components, invalid props/styles, or invalid placement.
5. Hydrate the editor atomically only after every validation stage succeeds.
6. If a supported migration changed the document, require a new revisioned save rather than overwriting the source blindly.

## Requirements

| ID | Requirement | Priority | Acceptance evidence |
| --- | --- | --- | --- |
| BE-01 | All storage adapters implement one repository behavior contract. | Must | Shared contract tests pass against each adapter. |
| BE-02 | Every project load uses the migration and atomic hydration boundary. | Must | Corrupt, old-supported, unsupported-future, and valid fixtures behave as specified. |
| BE-03 | Every save validates the complete candidate and uses optimistic concurrency. | Must | Invalid writes remain atomic and stale revisions return `REVISION_CONFLICT`. |
| BE-04 | Repository-owned identity, revisions, and timestamps cannot be changed through editor content. | Must | Request and integration tests reject or ignore forged metadata. |
| BE-05 | Dashboard list responses omit component trees and derive page count. | Must | API contract tests verify the bounded summary shape. |
| BE-06 | Local storage is visibly identified as browser-local and supports explicit export when that feature is approved. | Must | UI and persistence tests verify messaging and reload behavior. |
| BE-07 | Authorization is applied to every project operation before a multi-user backend is exposed. | Must | Cross-user access tests fail closed. |
| BE-08 | Project documents never store visitor form values, credentials, or editor-only session state. | Must | Schema and security tests reject prohibited fields. |
| BE-09 | List pagination uses an opaque cursor and an approved maximum limit. | Should | Pagination contract tests cover stable ordering and malformed cursors. |
| BE-10 | Create and duplicate operations have an approved retry/idempotency policy before production use. | Should | Network-retry tests prove no accidental duplicate project creation. |
| BE-11 | One corrupt or unsupported record remains visible as **Needs recovery** and does not prevent valid records from listing. | Must | Repository and dashboard tests cover every hydration failure stage and mixed valid/unavailable inventories. |
| BE-12 | Unavailable records cannot open, rename, duplicate, preview, save, autosave, delete, or silently upload. | Must | Component and route tests prove prohibited actions are absent and direct navigation remains bounded. |
| BE-13 | The dashboard exposes only bounded recovery metadata and stable reason categories. | Must | Security and accessibility tests prove raw payloads, exception text, validation details, and color-only status are absent. |

## Constraints and policies

- Treat API input and stored JSON as untrusted on every boundary.
- Reuse one executable contract where possible; do not maintain unrelated client and server validators.
- Preserve project, page, and node ID opacity. Clients must not derive authorization or ordering from an ID.
- Enforce the implementation's project, tree-depth, node-count, string, and JSON limits, plus separately approved HTTP body and rate limits.
- Use transactions or an equivalent atomic compare-and-write mechanism for revisions.
- Do not reveal whether another user's project ID exists.
- Log request IDs, operation outcomes, latency, and safe error codes; do not log complete project JSON, visitor data, secrets, or access tokens by default.
- Require HTTPS and secure authentication before remote project storage is made available.
- Keep asset, publishing, deployment, and form-submission lifecycles separate from project-document persistence.

## Candidate delivery slices requiring separate approval

These are candidates, not authorized tasks:

1. Define repository contract tests and an IndexedDB adapter.
2. Add a local-only project dashboard and project-specific editor route.
3. Add debounced local autosave and explicit save-state UI.
4. Add JSON export/import and corrupt-source recovery.
5. Select backend, database, deployment, and authentication architecture.
6. Implement the API adapter, durable storage, authorization, and operational controls.
7. Offer an explicit local-project upload/migration flow.

Only the slice explicitly selected by the project owner may move into implementation planning.

## Risks and open questions

| Item | Classification | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Database, hosting, and backend runtime are not selected. | Question | Project owner | Approved architecture decision and operational requirements. |
| Authentication and project ownership semantics are not selected. | Blocking question for remote storage | Project owner | Approved identity, authorization, sharing, and account-deletion contract. |
| Hard delete versus recoverable delete and retention are undecided. | Blocking question for delete implementation | Project owner | Approved retention and recovery decision. |
| Maximum project bytes, pages, nodes, depth, and request rate need explicit production limits. | Risk | Project owner | Load tests, threat model, and approved limits. |
| Duplicate create requests may produce multiple projects after uncertain network failures. | Risk | Project owner | Approved idempotency-key and retention policy. |
| Browser-local projects can be lost when browser data is cleared. | Risk | Project owner | Clear UI warning plus approved export/backup flow. |
| Uploading local projects may create ID or revision collisions. | Risk | Project owner | Approved import identity and conflict policy with migration tests. |
| Multi-tab and multi-device edits can conflict. | Risk | Project owner | Approved revision-conflict UX; collaboration remains separately scoped. |
| Thumbnail generation and storage are undefined. | Question | Project owner | Separate derived-artifact contract if dashboard thumbnails are requested. |
| Asset uploads and persisted external credentials are undefined. | Question | Project owner | Separate asset and secret-storage specifications. |

## Approval and change control

The project owner approves product scope, data retention, providers, and delivery order. A technical review is required before approving API compatibility, migration, authentication, authorization, deletion, or production storage behavior.

Update this draft in place when a new approved backend requirement has the same scope and lifecycle. Record implementation details only after they are verified. When executable API schemas exist, they become the machine-contract authority and this document must link to them instead of duplicating generated reference.
