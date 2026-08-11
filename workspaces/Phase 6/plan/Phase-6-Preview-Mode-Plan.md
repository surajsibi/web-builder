---
doc_id: WEB-BUILDER-PHASE-6-PREVIEW-PLAN
type: D3
scope: Execution plan for the local web builder Phase 6 preview-mode slice
authority: Selected execution plan for the user-approved Phase 6 scope; workspace.md owns current execution status
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Original Preview delivery completed and verified on 2026-08-10; the later Container width-parity correction is verified by affected tests, focused ESLint, migration coverage, and 1920 px Chrome geometry, with unrelated incomplete linear-gradient work recorded as the current full-suite/typecheck limitation
---

# Plan: Deliver editor preview mode

## Goal, scope, and authority

Add a Preview action that opens the active page in a new browser tab as runtime output without editor-only interface or overlays. Reuse the current validated project document, hydration boundary, component registry, style compiler, and responsive cascade. Transfer unsaved state once without introducing durable persistence. Publishing, deployment, shareable preview URLs, and source export remain excluded. The user's 2026-08-10 correction supersedes the initial same-tab constraint; `Project.md` and verified implementation constrain architecture.

## Constraints and assumptions

- The supplied directory is not a Git worktree, so branch and synchronization steps do not apply.
- Stable `ai/context.md` and `ai/learned-rules.md` files are unavailable; implementation and `Project.md` provide the baseline.
- The preview must not create a second component renderer or style cascade.
- The editor must remain open in its original tab while Preview opens in a new one.
- The new tab must receive the current unsaved document and active page through a bounded one-use transfer.
- Every transferred document must pass the existing hydration validator before rendering.
- Refreshing a consumed preview URL may show the unavailable state until durable persistence is implemented.
- The preview viewport must use the shared `BREAKPOINTS` constants.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Validated Zustand project document | Available from the editor store and transferable as one snapshot | Project owner | Show a bounded unavailable state; do not synthesize project data |
| Registry and runtime node renderer | Existing renderer remains editor-independent | Project owner | Stop if preview requires a competing renderer |
| Shared responsive breakpoints | Preview maps browser width through existing constants | Project owner | Stop on conflicting breakpoint authority |
| Next.js new-tab link behavior | Anchor attributes and click preparation execute before browser navigation | Framework/local implementation | Use a real link with `_blank`, `noopener`, and browser verification |
| Same-origin browser storage | Available for a short-lived snapshot payload | Browser | Prevent navigation and announce failure if storage is unavailable |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| P6-01 | Extract the default editor store into a shared module without changing store semantics | Existing editor shell | Existing editor tests and typecheck | Implementer | Complete |
| P6-02 | Add a page-level runtime renderer and browser-width viewport resolver | P6-01 | Focused renderer and boundary tests | Implementer | Complete |
| P6-03 | Add `/preview` and the toolbar Preview link | P6-01, P6-02 | Navigation and absence-of-editor-chrome tests | Implementer | Complete |
| P6-04 | Add preview presentation styles with a white, full-viewport runtime surface | P6-02 | Browser visual inspection at desktop and mobile widths | Implementer | Complete |
| P6-05 | Run complete automated and browser verification | P6-01 through P6-04 | TypeScript, ESLint, tests, build, browser evidence | Technical verifier | Complete |
| P6-06 | Record verified outcomes and remaining limitations | P6-05 | Report evidence matches command and browser results | Document author | Complete |
| P6-07 | Correct Preview to open in a new tab and transfer a validated one-use snapshot | P6-03 | Link, snapshot, hydration, missing-data, and Strict Mode tests | Implementer | Complete |
| P6-08 | Re-run full checks, production build, and two-tab browser verification; update Phase 6 records | P6-07 | 127 tests, TypeScript, ESLint, build, and simultaneous editor/preview evidence | Technical verifier and document author | Complete |
| P6-09 | Remove the hidden `72rem` default Container cap, migrate version-1 defaults, and verify wide Preview parity | P6-08 | Affected registry/hydration/editor tests, focused ESLint, and 1920 px computed geometry | Implementer and technical verifier | Complete |

## Quality and approval gates

The change must preserve all existing tests and pass focused preview tests, TypeScript, ESLint, the full Vitest suite, and the production build. Browser verification must demonstrate simultaneous editor and preview tabs, continuity of an unsaved component, retention of editor chrome in `/`, exclusion of editor chrome from `/preview`, and responsive behavior at the shared breakpoints. The accountable user must review the completed feature before the workspace leaves draft status.

## Risks, rollback, and containment

The primary risk is losing or trusting the wrong document across JavaScript realms. Contain it with a tokenized one-use payload, immediate removal after retrieval, isolated preview state, and the existing hydration validator. If storage serialization fails, prevent navigation and announce the failure. A preview refresh cannot reuse a consumed snapshot; state this limitation rather than turning transfer storage into persistence. Rollback removes the snapshot module and new-tab attributes without changing the project schema.

## Completion

Completion requires implemented code, focused regression coverage, passing project checks, successful desktop/mobile browser validation, and a Phase 6 implementation report. Keep the feature workspace active and awaiting user review rather than archiving it automatically.
