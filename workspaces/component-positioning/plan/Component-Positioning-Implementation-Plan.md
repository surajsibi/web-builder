---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-IMPLEMENTATION-PLAN
type: D3
scope: Execution plan for responsive visual X/Y component movement in the web-builder Inspector and Canvas
authority: Selected execution plan for component positioning; workspace.md owns execution state, and code, tests, approved product decisions, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Created on 2026-08-12 from verified source inspection of main at e15cd9f798ad7b90ee7a9526627af73d583e346b and assigned to feature/component-positioning on 2026-08-12; invalidated by an approved scope change or relevant style, document-schema, command, Canvas, Inspector, rendering, drag-and-drop, or supported-browser change
---

# Plan: Add responsive visual component positioning

## Goal, scope, and authority

Let a user visually move a selected component along X and Y from the Canvas or Inspector while preserving the existing responsive style system, semantic renderer boundary, structural drag-and-drop behavior, command validation, locks, and Undo/Redo guarantees.

This plan owns the intended work order and verification gates. [The feature workspace](../workspace.md) owns execution status. [The baseline research](../research/current-positioning-and-movement.md) records the verified current state. Code, tests, approved product decisions, and verified runtime behavior remain authoritative for implemented behavior.

### Recommended first-release behavior

- Keep the existing drag handle responsible for structural reorder and reparent operations.
- Add a separate **Position on canvas** mode and movement handle for visual X/Y adjustment.
- Persist one atomic `positionOffset` style value with signed X and Y lengths at `base`, `tablet`, or `mobile`.
- Compile the resolved offset to the individual CSS `translate` property rather than constructing an arbitrary `transform` string.
- Keep CSS `position` and `zIndex` as independent existing style values; visual movement must not silently change either one.
- Preview pointer and keyboard movement locally, then commit one `node.updateStyles` transaction when the gesture completes.
- Reset removes the active layer's offset so desktop returns to zero and narrower viewports inherit the preceding layer.

Included:

- Persisted style types, runtime validation, responsive resolution, CSS compilation, cloning, and document migration for visual offsets.
- Explicit style reset/unset semantics through the canonical command boundary; `null` must not be overloaded to mean inherit.
- Inspector X/Y controls, value-origin guidance, active-viewport editing, and reset.
- A Canvas positioning mode with pointer drag, arrow-key nudge, Shift-modified larger steps, Enter commit, Escape cancel, and accessible instructions.
- One preview-only visual edit during a gesture and one undoable committed change at completion.
- Locked, hidden, text-editing, resize, spacing, layout-guide, and structural-drag interaction exclusions.
- Canvas and Preview parity, hydration/migration compatibility, regression coverage, and rendered browser verification.

Excluded unless separately approved:

- Replacing or weakening structural drag-and-drop, placement validation, tree relationships, or `node.move`.
- Parent-anchored absolute-position dragging, containing-block selection, fixed/sticky coordinate authoring, or automatic changes to CSS `position`.
- Snapping guides, alignment/distribution tools, collision avoidance, canvas bounds clamping, or automatic overlap prevention.
- Rotation, scale, skew, arbitrary transform strings, animation, or keyframes.
- Multi-selection movement, grouping, constraints, pinning, or breakpoint interpolation.
- Bring forward/backward/front/back commands or automatic z-index calculation.
- Changes to component props, renderer wrappers, component versions, placement rules, backend persistence, or publishing.

## Constraints and assumptions

- Verified: structural movement resolves parent-and-index destinations and commits `node.move`; it must remain a separate gesture and command.
- Verified: `StyleValues`, its schemas, compiler, command allowlist, and Position Inspector currently support `position` and `zIndex` but no X/Y offset.
- Verified: the visual-editing system already supports transient previews and one responsive `node.updateStyles` commit for pointer and keyboard gestures.
- Verified: the current project document schema version is 1 and the document migration chain is empty.
- Verified: Phase 5 excluded freeform and absolute-position drag because no offset values existed.
- Proposed: `positionOffset` is an atomic object containing signed X and Y structured lengths. Initial pointer movement uses pixels; exact controls may expose only units whose pixel conversion is deterministic in the existing unit context.
- Proposed: missing `positionOffset` means zero translation. Responsive resolution follows the existing `base -> tablet -> mobile` cascade.
- Proposed: a new document schema version owns the shared persisted style-shape change; component versions remain unchanged.
- Proposed: direct visual positioning is available only to selected, unlocked, rendered nodes whose registry definition includes the existing `positioning` capability.
- The final data shape, supported units, CSS `translate` compatibility, and document migration must be approved before implementation begins.
- Before editing Next.js source or configuration, read the applicable installed Next.js 16 documentation under `node_modules/next/dist/docs/`.
- Preserve the unrelated API-data-binding documentation changes already present in the working tree.
- The project owner approved the dedicated branch, and `feature/component-positioning` was created from the inspected `main` commit on 2026-08-12.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Product scope | The project owner approves visual offsets as the first release and accepts the exclusions | Project owner | Keep this plan in draft and do not implement ambiguous absolute/freeform behavior |
| Implementation branch | Satisfied on 2026-08-12: the project owner approved `feature/component-positioning`, created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b` | Project owner and repository maintainer | Perform planning only; do not change application code on behalf of this feature |
| Persisted offset contract | Signed value shape, units, responsive inheritance, and CSS compilation are accepted | Editor architecture owner | Stop before schema changes and record the unresolved decision |
| Document compatibility | Version 1 documents have one deterministic path to the new current schema | Editor architecture owner and technical verifier | Do not enable offset writes or advance the schema version |
| Style reset semantics | The command layer can delete an active-layer property without using `null` or bypassing validation | Editor architecture owner | Ship no Reset control and do not simulate inheritance with zero overrides |
| Gesture ownership | Structural drag, positioning, spacing, resizing, layout guides, and text editing have mutually exclusive activation rules | Interaction owner and accessibility reviewer | Disable the positioning affordance until conflicts are resolved |
| Browser support | The supported browser set and React style typing accept the selected individual CSS translation property | Repository maintainer and technical verifier | Use a reviewed controlled compiler fallback or revise the persisted design before implementation |
| Geometry baseline | Artboard-relative pointer deltas and any Canvas zoom conversion are characterized | Implementer and technical verifier | Restrict the feature to verified 1:1 scale and do not claim zoom-safe behavior |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| CP-00 | Obtain scope approval, create or switch to an approved feature branch, record HEAD/tool versions, and establish a clean verification baseline | Product scope, implementation branch | Branch/workspace mapping is consistent; unrelated changes are preserved; focused and full baseline results are recorded | Repository maintainer and technical verifier | In progress - branch created; scope approval and baseline verification remain |
| CP-01 | Finalize the positioning contract: visual offset versus absolute coordinates, exact persisted shape, supported units, reset semantics, interaction labels, and exclusions | CP-00, persisted offset contract, gesture ownership | Approved decision examples cover desktop/tablet/mobile inheritance, positive/negative movement, reset, locks, and structural drag separation | Project owner, editor architecture owner, and accessibility reviewer | Not started |
| CP-02 | Add the signed offset type and schema, extend clone/merge behavior, compile it to controlled CSS, and add schema/resolve/compile tests | CP-01, browser support | Missing offset compiles to no translation; signed values validate; responsive layers resolve predictably; source styles remain immutable | Implementer | Not started |
| CP-03 | Advance the project schema and add one deterministic version-1 migration that preserves existing documents while admitting the optional offset shape | CP-02, document compatibility | Version-1 fixtures migrate to the new version without content changes; current/future/missing migration cases remain atomic and diagnostic | Implementer and technical verifier | Not started |
| CP-04 | Extend the canonical style command with explicit set and reset/unset behavior, update the style-property allowlist, and preserve scoped/full validation equivalence | CP-02, style reset semantics | Invalid targets and values reject atomically; reset deletes only the targeted active-layer value; applied/no-op/history semantics remain correct | Implementer and editor architecture owner | Not started |
| CP-05 | Add reusable offset conversion and gesture helpers to the visual-editing module, including pointer deltas, unit preservation where deterministic, keyboard steps, preview generation, and cancellation | CP-02, CP-04, geometry baseline | Unit tests cover positive/negative deltas, inherited offsets, 1 px arrows, 10 px Shift+arrows, Enter, Escape, and no source mutation | Implementer | Not started |
| CP-06 | Expand the Position Inspector with Offset X, Offset Y, origin/inheritance guidance, Reset, and **Position on canvas** mode for eligible nodes | CP-04, CP-05 | Controls are capability-gated, viewport-aware, lock-aware, validation-aware, keyboard accessible, and do not expose invalid intermediate values to document state | Implementer and accessibility reviewer | Not started |
| CP-07 | Add the Canvas movement overlay and handle using the existing visual preview/commit lifecycle; isolate it from structural drag, resize, spacing, layout guides, selection, and inline text editing | CP-05, CP-06, gesture ownership | Pointer and keyboard gestures preview smoothly, commit once, cancel cleanly, keep the tree unchanged, and produce clear live announcements | Implementer and accessibility reviewer | Not started |
| CP-08 | Verify history, responsive behavior, hydration, Canvas/Preview parity, locking, selection, duplication, block-created nodes, and structural drag regressions | CP-03 through CP-07 | Focused integration tests pass; one gesture creates one undo step; Undo/Redo restores offsets exactly; old documents hydrate; all existing drag/drop tests pass | Implementer and technical verifier | Not started |
| CP-09 | Run rendered browser checks at desktop, tablet, and mobile widths, including overflow recovery and form/control interaction, then address verified defects | CP-08 | Computed Canvas and Preview positions match; keyboard-only movement works; components remain recoverable through Inspector reset; browser console is clean | Technical verifier and accessibility reviewer | Not started |
| CP-10 | Run the complete verification matrix, update durable architecture only with verified behavior, publish an implementation report, and prepare the feature for review | CP-09 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on the supported Node version; documentation checks and owner review pass | Technical verifier and project owner | Not started |

## Quality and approval gates

- Do not begin application-code changes until CP-01 records approval of the data and gesture contract.
- Read the relevant installed Next.js 16 documentation before changing any Next.js source or configuration.
- Keep the semantic component renderer and saved component tree free of editor handles, pointer coordinates, DOM references, and gesture state.
- Do not add a new document mutation path. Persisted offsets must use the canonical command dispatcher and complete responsive-style validation.
- Do not overload `null`, `undefined`, or a magic number to mean responsive inheritance or reset.
- Keep structural drag-and-drop available through its existing dedicated handle and confirm positioning never dispatches `node.move`.
- Disable positioning while the node is locked, hidden at the active viewport, being text-edited, structurally dragged, resized, or edited by another Canvas visual mode.
- Use accessible button semantics and visible focus for the positioning handle. Announce start, preview intent where appropriate, commit, cancellation, rejection, and lock state.
- Use 1 px arrow-key movement and 10 px movement with Shift unless accessibility review selects a different documented step.
- Ensure pointer-up and Enter commit at most one history transaction; Escape and pointer cancellation commit none.
- Test active-layer behavior separately for desktop, tablet, and mobile, including inheritance and reset.
- Test negative and large offsets without silently clamping persisted values. Ensure Inspector reset remains available when the component moves outside the visible artboard.
- Verify the same compiled style path renders Canvas and Preview; do not create Canvas-only positioning CSS.
- Verify version-1 hydration, current-version round trips, future-version rejection, and atomic failure behavior.
- Run focused style, migration, command, visual-editing, Inspector, Canvas, editor-shell, rendering, and preview suites before the complete repository matrix.
- Update `Project.md` only after implementation and rendered behavior are verified. Record proposals and unresolved decisions in the feature workspace until then.
- Project-owner approval is required before changing lifecycle from draft to approved or beginning implementation.

## Risks, rollback, and containment

- **Gesture ambiguity:** users may reposition when they intended to reorder. Keep separate labeled handles and mutually exclusive modes; never infer intent from dragging the semantic component body.
- **Responsive breakage:** desktop offsets may cause tablet/mobile overlap. Preserve responsive inheritance, expose the active viewport and origin, and verify all three viewport layers.
- **Unrecoverable off-canvas nodes:** a large offset can move a component beyond the artboard. Keep selection through Layers and breadcrumbs and provide an Inspector Reset action that does not depend on clicking the component.
- **Canvas/Preview mismatch:** editor-only transforms can produce false confidence. Compile offsets only through the shared style compiler and compare computed geometry in both surfaces.
- **Transform collision:** an arbitrary transform string would make later rotate/scale composition fragile. Prefer the individual CSS translation property and block implementation if browser support is insufficient.
- **Schema rollback:** once a newer schema document is written, an older build rejects it as future data. Validate the migration and full feature before enabling writes; after release, prefer roll-forward correction over reverting the reader.
- **Reset corruption:** treating zero as inheritance or deleting the wrong layer can change responsive output. Add explicit reset semantics and test base, tablet, and mobile independently.
- **History flooding:** pointer movement could create one command per frame. Keep frames preview-only and commit one grouped transaction at gesture completion.
- **Interaction regression:** positioning overlays can block links, inputs, text editing, selection, or structural drops. Exercise interactive primitives and ensure editor controls remain outside semantic renderer markup.
- **Performance regression:** geometry measurement on every pointer event can rerender the editor. Reuse measured artboard-relative rectangles, batch previews, and add bounded render/interaction assertions if profiling shows risk.
- If a gate fails, stop at the last passing item, record the blocker in the eventual branch journal, disable the new affordance, and keep existing structural movement behavior. Destructive Git rollback is not authorized.

## Completion

The feature is complete only when the approved first-release behavior is implemented, old and new documents hydrate safely, pointer and keyboard positioning are accessible, structural drag-and-drop is unchanged, Canvas and Preview positions match across all viewports, one gesture produces one undoable transaction, and the complete repository verification matrix passes.

Publish an implementation report with exact verification evidence. Promote only verified durable style, migration, command, and interaction behavior into `Project.md`. After accountable review and completion, archive the feature and branch workspaces according to the workspace rules; do not archive or delete them automatically.
