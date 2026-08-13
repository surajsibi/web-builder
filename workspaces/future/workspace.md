---
doc_id: WEB-BUILDER-FUTURE-WORK-CATALOG
type: D4
scope: Cross-feature and cross-branch catalog of deferred ideas and future work for the web-builder project
authority: Selected catalog for the identity, status, and disposition of deferred work; linked feature workspaces own approved plans and execution state after an item is promoted
owner: Project owner
lifecycle: maintained
freshness: Created from project-owner direction on 2026-08-13; invalidated by a future-item status, priority, scope, ownership, promotion, completion, or disposition decision
---

# Future work catalog

## Purpose

This workspace is the branch-independent home for deferred ideas and future tasks. Use it to remember what remains without attaching an unapproved idea to the workspace or branch where it happened to originate.

An item may optionally link to a related feature workspace after that relationship is useful. A link provides context only; it does not transfer execution-state authority.

## Catalog rules

- Give every item a stable `FUT-###` identifier.
- Record ideas here before they are approved for implementation.
- Do not treat an item in this catalog as authorization to change product code.
- A source branch may be recorded for provenance, but live branch progress remains in that branch's `journal.md`.
- Add a related workspace only when one exists and the relationship helps future planning.
- When an item becomes planned work, create or select its canonical feature workspace, link it here, and keep detailed planning and execution state there.
- Do not duplicate an approved plan here. Retain only its identifier, disposition, and canonical link.
- Mark completed, rejected, or superseded items instead of silently removing them.

## Status definitions

| Status | Meaning |
| --- | --- |
| Idea | Saved for future consideration; requirements may be incomplete. |
| Candidate | Worth prioritizing; product and technical decisions remain. |
| Planned | Approved and linked to a canonical feature workspace or work system. |
| Active | Implementation is underway in the linked authority. |
| Done | Verified work is complete; the canonical implementation/report owns details. |
| Rejected | Deliberately not pursuing; retain the reason. |
| Superseded | Replaced by another future item or approved plan. |

## Future items

| ID | Future item | Status | Related workspace | Next decision |
| --- | --- | --- | --- | --- |
| FUT-001 | Move a Card or container as one visual unit while protecting its descendants from accidental independent movement. | Idea | None | Decide whether protection is a temporary gesture lock, an explicit group mode, or a persistent subtree lock. |
| FUT-002 | Optionally keep a visually positioned leaf inside its parent bounds. | Idea | None | Define the parent boundary, persistence model, responsive behavior, and out-of-bounds recovery. |

## FUT-001: Move a Card or container as one unit

### Idea

Moving a Card or another container should move its rendered descendants with it. During that interaction, its inner components could be protected from accidental independent movement so the subtree behaves like one visual unit.

### Guardrails

- Do not automatically overwrite the persisted lock state of every descendant.
- Prefer a temporary subtree interaction lock or explicit group-movement mode unless product review approves persistent subtree locking.
- One container gesture should create one undoable container-offset transaction and should not write descendant offsets or dispatch descendant structural moves.
- Preserve descendant structure, offsets, selection paths, and pre-existing lock states.
- This idea does not bypass the separate container stacking-context and containing-block verification gate.

### Decisions required before promotion

- Temporary interaction protection versus a persistent subtree-lock feature.
- Selection and editing behavior for descendants before, during, and after movement.
- Nested-container behavior and Undo/Redo ownership.
- Sticky/fixed descendants, overlays, z-index, hit testing, recovery, and Canvas/Preview/Published parity.

## FUT-002: Keep a positioned leaf inside its parent

### Idea

Add an optional **Keep inside parent** constraint for eligible leaf components. The setting should remain disabled by default so unrestricted positioning remains available.

The leaf remains structurally inside the same parent in both modes. Crossing a visual boundary must never trigger automatic reparenting.

### Proposed outcomes

- Constrain pointer, supported touch, keyboard, and exact Inspector positioning through one shared geometry rule.
- Preserve the leaf's structural parent, sibling order, and original layout slot.
- Evaluate bounds predictably at desktop, tablet, and mobile.
- Keep Layers selection, breadcrumbs, Inspector values, Reset, Undo, Redo, and off-canvas recovery available.
- Preserve the shared Canvas/Preview/Published style-compilation path.

### Guardrails

- Keep unrestricted positioning as the default.
- Do not equate movement constraints with CSS overflow or clipping.
- Do not silently rewrite a saved offset when a parent resizes or a breakpoint changes.
- Report an out-of-bounds saved value and provide an explicit, undoable recovery action.
- Reuse the existing coordinate, proposed-geometry, optional-adjustment, preview, and canonical command boundaries.
- Keep container/root positioning restrictions independent of this feature.

### Decisions required before promotion

- Which parent box defines the boundary: content box, padding box, or another explicit box?
- Is the setting global for the leaf or responsive by breakpoint?
- How should exact Inspector input handle an out-of-range value?
- What happens when the leaf is larger than its parent?
- What happens when parent resizing or responsive inheritance makes a saved offset out of bounds?
- How do zoom, scroll, borders, padding, nested transforms, and future rotate/scale affect the calculation?

### Required verification when planned

- Every parent edge using pointer, supported touch, keyboard, and Inspector input.
- Positive and negative offsets across desktop, tablet, and mobile.
- Flex, grid, and mixed nested layouts.
- Parent padding, borders, resize, and supported overflow modes.
- A leaf larger than its parent.
- Existing offsets before enabling and after disabling the constraint.
- Structural-drag separation, one-command history, cancellation, Reset, Undo, Redo, and recovery.
- Canvas/Preview parity and future Published parity.

## Promotion workflow

When the project owner promotes an item:

1. Select or create the canonical feature workspace.
2. Record the related workspace in the item table.
3. Move detailed requirements into the approved specification or plan instead of maintaining two copies.
4. Change the catalog status to `Planned` or `Active`.
5. Keep only the summary, decision, and canonical link here.
