---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-BASELINE-RESEARCH
type: D2
variant: research
scope: Current web-builder structural movement, CSS positioning, responsive style, and Canvas visual-editing behavior relevant to component positioning
authority: Source code, tests, and verified runtime behavior remain authoritative; this record owns only the bounded planning synthesis
owner: Project owner
lifecycle: draft
freshness: Verified by source inspection on 2026-08-12 against main at e15cd9f798ad7b90ee7a9526627af73d583e346b; invalidated by relevant style, command, Canvas, Inspector, rendering, drag-and-drop, or document-schema changes
---

# Research: How should visual component movement fit the existing editor architecture?

## Objective and scope

Establish the implemented movement and positioning baseline needed to plan direct visual component movement. The research distinguishes structural movement from visual offsetting and identifies the safest integration points. It does not approve a product design or implement code.

## Baseline, assumptions, and unavailable evidence

- `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b` is the inspected source baseline.
- Stable baseline files `ai/context.md` and `ai/learned-rules.md` are absent, so verified code and tests provide the factual baseline.
- The current worktree contains unrelated API-data-binding documentation changes; they were not read as component-positioning evidence or modified.
- No usability study, stakeholder-approved free-positioning specification, browser exercise, or implementation benchmark exists for this feature.
- The recommended data and interaction design remains a proposal until the project owner approves it.

## Method

Inspect the persisted style types and schema, style compiler, command contract and validation, drag target resolution, editor drag completion, visual-editing helpers, Canvas overlays, Inspector Position controls, architecture guidance, and the completed Phase 5 scope. Prefer executable source over prose when describing current behavior.

## Evidence

| Claim/observation | Classification | Source/evidence | Scope/version | Confidence/limitation |
| --- | --- | --- | --- | --- |
| Existing Canvas drag movement is structural: it resolves page-root, before, after, or inside destinations and dispatches `node.move`. | Verified fact | [Drag-and-drop target resolution](../../../src/builder/ui/drag-and-drop.ts), [editor drag completion](../../../src/builder/ui/editor-shell.tsx) | Inspected `main` commit | High; source inspection, not a new browser exercise |
| The current style model persists `position` and `zIndex` but has no component X/Y offset or inset fields. | Verified fact | [Style types](../../../src/builder/styles/types.ts), [style schema](../../../src/builder/styles/schema.ts) | Inspected `main` commit | High |
| The compiler emits CSS `position` and `zIndex` only; it cannot visually translate a component from persisted offsets. | Verified fact | [Style compiler](../../../src/builder/styles/compile.ts) | Inspected `main` commit | High |
| The Inspector's Position section exposes CSS position mode and z-index only. | Verified fact | [Inspector panel](../../../src/builder/ui/inspector-panel.tsx) | Inspected `main` commit | High |
| The visual-editing system already previews style changes and commits validated responsive `node.updateStyles` changes. | Verified fact | [Visual-editing helpers](../../../src/builder/ui/visual-editing.ts), [command contract](../../../src/builder/commands/types.ts), [command executor](../../../src/builder/commands/execute-command.ts) | Inspected `main` commit | High |
| Phase 5 explicitly excluded freeform positioning and noted that offset fields were absent. | Verified fact | [Phase 5 architecture proposal](<../../Phase 5/plan/Phase-5-Architecture-Proposal.md>) | Completed Phase 5 planning record | High for historical scope; implementation remains authoritative |
| Structural movement and visual movement require distinct gestures to avoid accidental reparenting while adjusting appearance. | Inference | Existing structural drag handle plus the visual-editing preview/commit boundary | Proposed feature | Medium until interaction testing |
| A responsive `positionOffset` style value compiled to the individual CSS `translate` property is the smallest coherent first-release model. | Proposal | Existing responsive style and compiler architecture | Proposed feature | Requires browser-support, schema, migration, and UX approval |

## Findings and disagreements

The builder already supports “move” in the document-structure sense. A dragged node changes its parent or sibling index, and the command path validates placement, locks, cycles, and destination indexes. Reusing that gesture for X/Y movement would make the same pointer action ambiguous.

CSS position mode is only partially authorable. Users can choose `relative`, `absolute`, `fixed`, or `sticky`, but they cannot persist offsets that establish a new visual location. Adding only top/left controls would also conflate parent-anchored positioning with a safer visual nudge that preserves normal layout flow.

The existing visual-editing architecture is the preferred integration point. It already keeps pointer previews out of persisted state, supports keyboard adjustments, and commits through the canonical responsive style command. A new document mutation command is unnecessary unless the existing style command cannot gain explicit reset/unset semantics safely.

## Conclusion

Implement the first release as responsive visual offsets rather than unrestricted absolute layout. Preserve the current structural drag handle. Add a separate positioning mode that edits the active viewport's offset, previews through the existing visual-editing path, and commits one validated style transaction per gesture.

The recommended representation is one atomic `positionOffset` object containing signed X and Y lengths. Compile it to CSS `translate` so normal-flow placement remains intact and future rotate/scale work is not forced into the same `transform` string. Treat the shared persisted style-shape change as a document-schema change, not a component-version change.

## Recommendation

Approve the linked execution plan with these first-release boundaries:

- responsive X/Y visual offsets;
- exact Inspector controls plus an explicit Canvas positioning mode;
- pointer and keyboard movement with cancel, reset, locks, and one-step Undo/Redo;
- unchanged structural drag-and-drop behavior;
- no snapping, rotation, multi-selection, collision avoidance, or parent-anchored absolute-position dragging.

Validate the final persisted shape, CSS property support, responsive reset behavior, interaction separation, editor/Preview parity, accessibility, migration, and full repository verification before release.

## Promotion and archival

If implementation is approved and verified, promote the durable style, command, and interaction contract into `Project.md` and record as-built evidence in a feature implementation report. Keep this research record as feature evidence, then archive it with the feature workspace after completion. Do not promote the proposed design as implemented behavior before verification.
