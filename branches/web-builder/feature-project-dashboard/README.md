---
doc_id: WEB-BUILDER-FEATURE-PROJECT-DASHBOARD-BRANCH-README
type: D4
scope: Repository branch workspace index for web-builder feature/project-dashboard
authority: Discovery index for the linked branch context; workspace.md owns feature execution state
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-18 after PD-R07 through PD-R09 were locally remediated and verified on top of published head a6a7b78; invalidated by a future branch, pull-request, feature-scope, implementation, publication, review, or workspace-mapping change
---

# Repository branch workspace - web-builder / feature/project-dashboard

**Repository:** `web-builder`

**Exact branch:** `feature/project-dashboard`

**Normalized directory identifier:** `feature-project-dashboard`

**Feature workspace:** [`workspaces/project-dashboard/`](../../../workspaces/project-dashboard/workspace.md)

**Summary:** Implements the local-first project dashboard, project-specific editor route, repository abstraction, IndexedDB adapter, revision-safe autosave path, and nine verified review remediations while retaining the later opt-in migration plan for authenticated backend storage. [Draft pull request 9](https://github.com/surajsibi/web-builder/pull/9) contains the first six fixes at published head `a6a7b78`, which passed [Node 24.19 CI / Validate](https://github.com/surajsibi/web-builder/actions/runs/32109626246/job/95626050223). The latest three fixes are locally verified and require publication, a fresh Node 24 run, owner review, and the final browser replay before ready-for-review promotion.

## Index

- [Repository overlay](overlay.md)
- [Progress journal](journal.md)
- [Feature implementation report](../../../workspaces/project-dashboard/reports/project-dashboard-implementation-report.md)
