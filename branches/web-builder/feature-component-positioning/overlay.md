---
doc_id: WEB-BUILDER-FEATURE-COMPONENT-POSITIONING-OVERLAY
type: A1
scope: Repository-specific facts, constraints, and risks for responsive visual component positioning on feature/component-positioning
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: in_review
freshness: Verified by bounded inspection at e15cd9f798ad7b90ee7a9526627af73d583e346b, revised after the positioning-plan and high-risk container-enablement reviews, reverified through the supported-Node automated matrix and retained available-Chrome scope, and updated after project-owner CP-10 approval on 2026-08-13; invalidated by a branch, scope, UX, eligibility, rendering, publishing, dependency, configuration, implementation, runtime, browser-support, or verification change
---

# Repository overlay - web-builder / feature/component-positioning

## Verified repository facts

- The branch was created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b`.
- Existing Canvas and Layers drag-and-drop behavior performs structural node movement using parent-and-index destinations.
- The shared style model now stores one atomic signed px-only `positionOffset` in the existing responsive layers while keeping CSS `position` and `zIndex` independent.
- The shared visual-editing path can preview changes during an interaction and commit one validated, undoable style command when the interaction finishes.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent.
- Canvas and Preview both route committed styles through the shared responsive resolver, style compiler, and semantic node renderer.
- Published routes and source export do not exist in V1.
- The existing production seams needed by the proposed contract are verified: `StyleValues` owns persisted values, the responsive schema/clone/merge/compiler path is shared, `NodeRenderingController` feeds Canvas and Preview, registry definitions expose `children.allowed` and `positioning`, and the command layer owns responsive mutations and lock validation.
- The disposable CP-01A prototype passes automated mechanics for pointer drag, keyboard preview/commit/cancel, dedicated-mode gating, modifier fallback, exact large offsets, non-Canvas recovery/reset, compact layout, a 48-by-48 touch target, and zero browser console warnings or errors. These checks do not constitute the required human UX or accessibility approval.
- Project schema version 2, version-1 migration, explicit style set/reset commands, central positioning eligibility, Inspector X/Y controls, and the selected-node Canvas position handle are implemented with focused and full automated coverage.
- Committed offsets use the shared responsive resolver, style compiler, and semantic node renderer in both Canvas and Preview; parity, hydration, Undo/Redo, responsive origin, duplication, block-created-leaf, recovery-navigation, structural-drag, and gesture-conflict tests pass.
- Rendered checks verify desktop/tablet/mobile Canvas/Preview parity, inherited and explicit-zero responsive behavior, large signed offsets, non-Canvas recovery, pointer and keyboard commit/cancel, selection continuity, and translated hit testing. Pointer testing found and closed a Canvas click-capture defect that cleared selection after a committed position drag.
- Available-Chrome Canvas/Preview checks verify exact eligible-leaf translation through five nested flex ancestors, five nested grid ancestors, and five mixed flex/grid ancestors; translated-leaf z-index paint order and hit testing; and translated Input focus, targeting, and text entry.
- CP-09A has a restricted outcome: roots and all container-capable definitions remain centrally disabled because the required sticky/fixed, overlay, portal, nested-transform, and whole-subtree verification has not passed.
- The CP-10 machine matrix passes on checksum-verified Node 24.19.0 with pnpm 10.33.0: lint, typecheck, 456 serial tests across 32 files, and the Next.js production build. The project owner approved the implementation report on 2026-08-13.
- Feature implementation commit `10736b0` is pushed to `origin/feature/component-positioning`; no runtime deployment or Published-site release has occurred.

## Provisional assumptions

- Supported physical-touch, representative-user, accountable screen-reader/browser, and any supported-browser evidence beyond available Chrome remains unretained. The existing automation and project-owner risk acceptance do not replace those public-release gates.
- Roots and registry definitions that permit children remain default-disabled. Enabling any one later requires that category to pass the full CP-09A matrix on every supported browser.

## Constraints

- Read the applicable installed Next.js documentation before editing Next.js source or configuration.
- Preserve structural drag-and-drop, validated hydration, responsive inheritance, undo/redo, and editor/Preview rendering parity.
- Pointer positioning must have keyboard-accessible controls and a clear reset path.
- Modifier-assisted dragging cannot be the sole touch, keyboard, or accessible interaction path.
- `positionOffset` must use the existing outer `base`/`tablet`/`mobile` layers; it must not introduce property-local breakpoint keys.
- The project owner approved the CP-01 contract and selected-node position handle for production implementation on 2026-08-12. Roots, container-capable wrappers, and resolved absolute/fixed/sticky nodes remain restricted.
- CP-01A still requires the approved five-user task study, a supported physical touch-device exercise, and an accountable screen-reader/browser accessibility review before public release. Automation and project-owner risk acceptance must not be promoted as that missing evidence.
- Persisted and committed offsets must share one semantic resolver/compiler/renderer path in Canvas and Preview. Future Published output must reuse the same contract and pass parity before publishing can release.
- Transient Canvas gesture preview may remain editor-only state, but it must compile equivalently to the committed style and must not become a second persisted rendering path.
- Do not stage, edit, or otherwise absorb the pre-existing API data-binding documentation changes into this feature.

## Risks

- Pointer movement can conflict with selection, resize handles, structural drag-and-drop, and nested interactive components unless mode ownership is explicit.
- Incorrect responsive reset semantics can make inherited offsets difficult to understand or remove.
- Transform composition can conflict with component-authored transforms unless the offset output uses an independently composable CSS property.
- Individual CSS translation still creates a stacking context and containing block for descendants, including at explicit zero, so roots, containers, absolute-positioned nodes, fixed/sticky descendants, z-index, overflow, and hit-testing need explicit gates.
- A translated container can change an entire subtree's fixed-descendant anchoring, stacking, overlays, and hit testing. Container/root failure must restrict only those categories instead of blocking the verified leaf release.
- Published parity cannot be exercised before a Published surface exists; claiming it in V1 would create false verification evidence.
- A closed geometry helper would force future snapping/alignment to replace the gesture path, while an overbuilt V1 snapping framework would expand scope unnecessarily.
- High-frequency pointer updates can create excessive history or rendering work unless preview and commit remain separate.
