---
doc_id: WEB-BUILDER-FEAT-BOOLEAN-STATE-FOUNDATION-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder feat/boolean-state-foundation
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Unassigned project owner
lifecycle: draft
freshness: Verified after the accepted Boolean State V1 refinements, 439 automated tests, production build, and applicable Editor/Preview browser QA on 2026-08-13; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / feat/boolean-state-foundation

## Verified repository differences

- The component registry now exposes Boolean State, State Action, and Conditional Content in a dedicated Interactions family.
- Boolean State renders no Canvas or Preview DOM, persists only `defaultValue`, and remains authorable through Layers and Inspector.
- Editor and Preview mount equivalent page-scoped Boolean runtime providers. Runtime actions do not mutate the document, revision, undo history, autosave state, or preview snapshot data.
- State Action maps Turn On, Turn Off, and Toggle into a reusable Boolean action contract and safely no-ops when its page-local target is unresolved.
- A shared Boolean condition evaluator owns value comparison and unresolved-state behavior for Conditional Content and future consumer adapters.
- Conditional Content is a normally styled container. Preview unmounts unmatched content immediately; Editor retains a muted authoring reveal. Reopening Preview content creates fresh descendant runtime instances.
- Registry reference metadata drives generic page-node candidate selection, resolution, Inspector diagnostics, and duplication remapping. Startup validation rejects unsupported scope and duplication policies. Whole-subtree duplication remaps internal targets; consumer-only duplication preserves external targets.
- The durable architecture in `Project.md` and the selected feature plan now describe the verified behavior.

## Retained V1 boundaries

- Authored animation controls and delayed exit mechanics remain deferred behind the dedicated presence boundary.
- Variant switching, conditional styling, bindings on existing components, connected interaction blocks, and Drawer conversion remain follow-up work.
- A future Drawer must consume Boolean State and may own only Drawer-specific portal, focus, Escape, backdrop, semantics, and scroll-lock behavior.

## Constraints

- V1 remains limited to page-scoped, runtime-only Boolean state.
- Existing Drawer behavior remains unchanged during the foundation implementation.
- Runtime interaction must not modify the document, undo history, revision, or persisted snapshot.

## Risks

- Connected block templates still lack template-local reference identity and must not author internally connected state until that contract is designed.
- Any future exit animation must prove bounded noninteractive exit, reduced-motion handling, rapid reversal safety, completion fallback, and final unmount.
- Native Button, Link, Image, Icon, and Container bindings require separate activation and accessibility contracts before they opt in.
- State Action direct activation suppresses its Canvas drag, resize, and spacing overlays. V1 accepts Layers and Inspector as the manipulation paths; a future Editor UX pass should separate activation from direct Canvas manipulation without changing runtime behavior.
