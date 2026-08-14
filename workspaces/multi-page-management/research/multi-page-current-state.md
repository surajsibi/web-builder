---
doc_id: WEB-BUILDER-MULTI-PAGE-CURRENT-STATE-RESEARCH
type: D2
variant: research
scope: Verified current-state analysis for multi-page management in web-builder at 8799e1cc5cf750029a481c1fb01568aa21c21fb3
authority: Source code and tests remain authoritative; this document owns the scoped research synthesis for feature planning
owner: Project owner
lifecycle: draft
freshness: Verified by bounded source inspection on 2026-08-13; invalidated by page-model, command, store, left-panel, toolbar, Preview, or persistence changes
---

# Research: How should multi-page management fit the current editor?

## Objective and scope

Determine the smallest production implementation that matches the approved Pages prototype and preserves the current project model, command validation, history, editor layout, and Preview behavior. Project persistence and the dashboard are excluded.

## Baseline, assumptions, and unavailable evidence

- The inspected branch base is `main` at `8799e1cc5cf750029a481c1fb01568aa21c21fb3`.
- The user approved Pages as a third left-panel tab with a dedicated page list and action menu.
- No persisted project repository exists in the inspected code. Runtime behavior after implementation remains to be verified.

## Method

Inspect the project document, hydration invariants, command types and executor, builder store, editor shell, left sidebar, toolbar, Preview snapshot flow, global styles, and nearby command and React tests. Treat code and tests as the authority for current behavior.

## Evidence

| Claim/observation | Classification | Source/evidence | Scope/version | Confidence/limitation |
| --- | --- | --- | --- | --- |
| A project already owns `pages`, `pageOrder`, and `homePageId` | Verified fact | `src/builder/model/project-document.ts` | Base commit | Direct type inspection |
| Hydration requires exactly one existing home page whose slug is `/`, unique page slugs, complete page order, and globally unique node IDs | Verified fact | `src/builder/project/hydration.ts`, `src/builder/project/tree.ts` | Base commit | Direct validation inspection |
| Create, rename, and protected delete page commands already exist and participate in store history | Verified fact | `src/builder/commands/execute-command.ts`, `src/builder/store/builder-store.ts` | Base commit | Direct command/store inspection |
| Production UI exposes page switching only through the toolbar selector | Verified fact | `src/builder/ui/editor-toolbar.tsx`, `src/builder/ui/editor-shell.tsx` | Base commit | Direct render-path inspection |
| The existing left sidebar owns Components and Layers tabs and is the correct Pages integration boundary | Verified fact | `src/builder/ui/editor-left-sidebar.tsx`, `src/app/globals.css` | Base commit | Direct component/layout inspection |
| Preview snapshots store the whole document plus the active page and render that page | Verified fact | `src/builder/preview/preview-snapshot.ts`, `src/builder/preview/preview-shell.tsx` | Base commit | Direct flow inspection |
| Page duplication must remap every node ID | Verified inference | Global node-ID invariant plus existing node-duplication allocator | Proposed command | Required to produce a hydratable candidate |
| Home promotion should give the old home a generated slug rather than swapping page content paths | Proposed behavior | Current slug generator and approved UI intent | Feature scope | Requires command tests and rendered confirmation |
| Project documents are not saved across reloads | Verified fact | `src/builder/store/editor-store.ts`; no project repository or storage adapter found | Base commit | Bounded repository search |

## Findings and disagreements

The model is already multi-page, so no schema migration or architectural rewrite is required. The missing pieces are two page commands and a production management surface. The experimental Phase 2 validation UI proves the existing create, select, rename, and delete command path but is not part of the editor route and should not be reused as product UI.

The phrase `All changes local` does not establish project persistence. Page management must remain independent of storage so a later repository and dashboard can hydrate the same builder store without rewriting the panel.

## Conclusion

Add `page.duplicate` and `page.setHome` to the canonical command layer, then add a dedicated Pages panel inside the existing left sidebar and connect it through EditorShell. Retain the toolbar selector and current Preview snapshot behavior.

## Recommendation

Implement command behavior first with structural and history tests, then build an accessible Pages panel with visible Create and Cancel labels, an action menu, and guarded delete confirmation. Integrate only after the domain behavior is green.

## Promotion and archival

Do not promote provisional feature behavior before verification and merge. At completion, record verified results in the feature implementation report and promote only durable architecture or workflow facts required by stable project context.
