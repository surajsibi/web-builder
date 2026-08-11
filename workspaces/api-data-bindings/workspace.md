---
doc_id: WEB-BUILDER-API-DATA-BINDINGS-WORKSPACE
type: D4
scope: Standalone web-builder API data sources and dynamic component-binding feature execution state
authority: Selected execution-state authority for the api-data-bindings feature; Project.md and verified implementation remain authoritative for current product architecture and behavior
owner: Unassigned; accountable project owner required before approval or implementation
lifecycle: draft
freshness: Drafted on 2026-08-11 against project schema version 1, strict hydration, the shared editor and Preview renderer, the one-use Preview snapshot flow, and the existing form-submission Route Handler; invalidated by changes to any of those boundaries or by an approved scope decision
---

# API data bindings workspace

**Feature name:** API data sources and dynamic component bindings

**Feature directory identifier:** `api-data-bindings`

**Overall status:** Draft feature specification prepared; implementation has not started.

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review and approve the initial public REST JSON scope, security boundary, persistence dependency, and phased delivery order.

**Feature summary:** Let an author configure an approved external JSON data source, inspect its response, and bind eligible component properties to response values while retaining the authored static property as a safe fallback. Keep fetched values, request state, and credentials outside the saved component props. Route external requests through a constrained server execution boundary and extend the feature later with repeated collections, event-triggered actions, authenticated connectors, and additional protocols.

## Deliverables

- [API data sources and dynamic bindings specification](plan/api-data-sources-and-bindings-spec.md)

## Execution state

- **Current step:** Product and architecture review of the draft specification.
- **Approach:** Establish the project-document contract and pure binding resolver first, then add a constrained public-GET executor, editor authoring, and Preview integration behind an explicit feature gate. Add collection rendering, event actions, and private credentials only after the scalar path is verified.
- **Done:** Verified the relevant current code boundaries, created the draft feature specification, and completed documentation checks.
- **Verification:** Both Markdown files contain the required manifest fields, the specification has balanced code fences and a valid heading hierarchy, its referenced source paths exist, and the workspace link resolves. No implementation or runtime verification has occurred because implementation has not started.
- **Remaining:** Approve open product and security decisions, convert the approved specification into an execution plan, implement in independently verifiable phases, and produce an implementation report.
- **Last left off:** 2026-08-11 — Draft specification and documentation verification complete; implementation is intentionally unstarted pending user review and approval.
