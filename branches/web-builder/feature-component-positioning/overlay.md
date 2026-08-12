---
doc_id: WEB-BUILDER-FEATURE-COMPONENT-POSITIONING-OVERLAY
type: A1
scope: Repository-specific facts, constraints, and risks for responsive visual component positioning on feature/component-positioning
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Verified by bounded inspection at e15cd9f798ad7b90ee7a9526627af73d583e346b on 2026-08-12; invalidated by a branch, dependency, configuration, implementation, or verification change
---

# Repository overlay - web-builder / feature/component-positioning

## Verified repository facts

- The branch was created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b`.
- Existing Canvas and Layers drag-and-drop behavior performs structural node movement using parent-and-index destinations.
- The shared style model supports CSS `position` and `zIndex` but does not store responsive X/Y visual offsets.
- The shared visual-editing path can preview changes during an interaction and commit one validated, undoable style command when the interaction finishes.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent.

## Provisional assumptions

- The initial implementation will use a separate Canvas positioning mode rather than changing structural drag-and-drop behavior.
- Responsive X/Y offsets will be stored atomically in the shared style model and compiled to individual CSS `translate` output.
- CSS `position` and `zIndex` will remain independent settings.

## Constraints

- Read the applicable installed Next.js documentation before editing Next.js source or configuration.
- Preserve structural drag-and-drop, validated hydration, responsive inheritance, undo/redo, and editor/Preview rendering parity.
- Pointer positioning must have keyboard-accessible controls and a clear reset path.
- Do not stage, edit, or otherwise absorb the pre-existing API data-binding documentation changes into this feature.

## Risks

- Pointer movement can conflict with selection, resize handles, structural drag-and-drop, and nested interactive components unless mode ownership is explicit.
- Incorrect responsive reset semantics can make inherited offsets difficult to understand or remove.
- Transform composition can conflict with component-authored transforms unless the offset output uses an independently composable CSS property.
- High-frequency pointer updates can create excessive history or rendering work unless preview and commit remain separate.
