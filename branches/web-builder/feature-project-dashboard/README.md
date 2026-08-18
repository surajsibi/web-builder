---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-BRANCH-README
type: D4
scope: Repository branch workspace index for web-builder feature/project-dashboard
authority: Discovery index for the linked branch context; workspace.md owns feature execution state
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after checkpoint 714973e published the first twelve review remediations and passed Node 24.19 CI, the final browser replay passed, and the follow-up recovery-identity and publication-record findings were remediated in the current branch; invalidated by a future branch, pull-request, feature-scope, implementation, publication, review, or workspace-mapping change
---

# Repository branch workspace - web-builder / feature/project-dashboard

**Repository:** `web-builder`

**Exact branch:** `feature/project-dashboard`

**Normalized directory identifier:** `feature-project-dashboard`

**Feature workspace:** [`workspaces/project-dashboard/`](../../../workspaces/project-dashboard/workspace.md)

**Summary:** Implements the local-first project dashboard, project-specific editor route, repository abstraction, IndexedDB adapter, revision-safe autosave path, and fourteen verified review remediations while retaining the later opt-in migration plan for authenticated backend storage. [Draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) published the first twelve findings at checkpoint `714973e`, which passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32125020513/job/95673532383). The current branch also keeps adapter-derived recovery identities stable across list, load, and mutation errors; the pull request's current-head check is the publication authority before ready-for-review promotion.

## Index

- [Repository overlay](overlay.md)
- [Progress journal](journal.md)
- [Feature implementation report](../../../workspaces/project-dashboard/reports/project-dashboard-implementation-report.md)
