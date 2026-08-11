---
doc_id: WEB-BUILDER-PHASE-6-PREVIEW-RESEARCH
type: D2
variant: research
scope: Preview routing, editor-state continuity, and runtime rendering for the local Next.js 16.3.0 web builder
authority: Evidence synthesis only; Project.md, local implementation, tests, and bundled Next.js documentation remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against the local source and bundled Next.js 16.3.0 documentation on 2026-08-10; invalidated by routing, store, persistence, rendering, or responsive-contract changes
---

# Research: How should preview reuse unsaved editor state?

## Objective and scope

Determine the smallest preview architecture that renders the active page in a separate browser tab without editor chrome while preserving the editor's unsaved in-memory document. Publishing, durable persistence, source export, and shareable preview URLs are excluded.

## Baseline, assumptions, and unavailable evidence

The application is not a Git worktree and the stable `ai/context.md` and `ai/learned-rules.md` files are unavailable. The verified implementation and `Project.md` therefore provide the baseline. Before Phase 6, the editor created a module-local vanilla Zustand store and had no local or remote persistence. The initial same-tab Phase 6 implementation proved the renderer but did not satisfy the later separate-tab requirement.

## Method

The investigation inspected the editor toolbar, shell, Zustand store, hydration boundary, canvas, registry renderers, responsive style resolver, project architecture, and bundled Next.js 16.3.0 `Link` and page/search-parameter documentation. Automated and browser exercises then verified one-use transfer and separate-tab behavior.

## Evidence

| Claim/observation | Classification | Source/evidence | Scope/version | Confidence/limitation |
| --- | --- | --- | --- | --- |
| The editor-only canvas adds headings, breadcrumbs, selection, drop targets, and visual-editing overlays around the runtime renderer. | Fact | `src/builder/ui/editor-canvas.tsx` | Local source, 2026-08-10 | Direct inspection |
| `NodeRenderingController` already turns validated page nodes into registered React elements and compiled inline styles without requiring editor UI. | Fact | `src/builder/rendering/node-rendering-controller.tsx` | Local source, 2026-08-10 | Direct inspection |
| Responsive breakpoints are centralized at 767 px and 1024 px and styles resolve through the desktop-first cascade. | Fact | `src/builder/styles/types.ts`, `src/builder/styles/resolve.ts` | Local source, 2026-08-10 | Direct inspection |
| Next.js `Link` passes anchor attributes such as `target="_blank"`; its normal click handler still runs for new-tab navigation. | Fact | Bundled `link.md` | Next.js 16.3.0 | Official bundled documentation |
| A new browser tab has a separate JavaScript realm and cannot consume the editor's in-memory Zustand instance directly. | Fact | Initial same-tab implementation and browser runtime model | Local application | Requires an explicit cross-tab transfer boundary |
| Same-origin `localStorage` can synchronously publish a tokenized payload before the link's default new-tab navigation. | Fact | Browser Storage API plus local implementation exercise | Local application, 2026-08-10 | Subject to browser storage availability and quota |
| Passing the retrieved payload through `hydrateProject` preserves schema migration and validation as the only document admission boundary. | Fact | `src/builder/store/builder-store.ts`, `src/builder/project/hydration.ts` | Local source, 2026-08-10 | Direct inspection and focused tests |

## Findings and disagreements

Reusing `EditorCanvas` would leak editor-only structure into preview and would make runtime output depend on canvas interaction behavior. A dedicated page-level renderer over `NodeRenderingController` keeps preview aligned with the eventual published renderer. Adding only `target="_blank"` is insufficient because the new tab receives a fresh module realm. A tokenized, one-use same-origin snapshot is the narrow transfer required by the updated requirement; consuming it into an isolated store avoids making browser storage a second live state authority.

## Conclusion

Keep the page-level runtime controller and browser-width resolver. Before new-tab navigation, publish the current document and active page under a snapshot token. The preview route reads the token, removes the payload after retrieval, and calls the normal hydration validator against an isolated store. Successful preview output must contain no toolbar, panels, breadcrumbs, canvas stage, selection overlay, or empty-editor prompt.

## Recommendation

Implement separate-tab Preview with a one-use transfer, explicit storage-failure feedback, hydration validation, and a bounded unavailable state. Keep durable refresh survival and shareable preview URLs as later persistence features.

## Promotion and archival

If verification succeeds, record the as-built boundary in the Phase 6 implementation report. Do not promote it to stable project context until an accountable owner accepts the completed feature and the workspace process allows promotion.
