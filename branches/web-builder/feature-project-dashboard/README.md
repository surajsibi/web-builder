---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-BRANCH-README
type: D4
scope: Repository branch workspace index for web-builder feature/project-dashboard
authority: Discovery index for the linked branch context; workspace.md owns feature execution state
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after remediation and verification closed all six scoped code-review findings in the local feature branch; invalidated by a future branch, feature-scope, implementation, review, or workspace-mapping change
---

# Repository branch workspace - web-builder / feature/project-dashboard

**Repository:** `web-builder`

**Exact branch:** `feature/project-dashboard`

**Normalized directory identifier:** `feature-project-dashboard`

**Feature workspace:** [`workspaces/project-dashboard/`](../../../workspaces/project-dashboard/workspace.md)

**Summary:** Implements the local-first project dashboard, project-specific editor route, repository abstraction, IndexedDB adapter, revision-safe autosave path, and six verified review remediations while retaining the later opt-in migration plan for authenticated backend storage. The remediated production build passes locally; the branch remains unpushed pending owner review, explicit push direction, and the outstanding Node 24 verification matrix.

## Index

- [Repository overlay](overlay.md)
- [Progress journal](journal.md)
- [Feature implementation report](../../../workspaces/project-dashboard/reports/project-dashboard-implementation-report.md)
