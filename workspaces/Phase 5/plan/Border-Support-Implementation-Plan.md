---
doc_id: WEB-BUILDER-PHASE-5-BORDER-SUPPORT-PLAN
type: D3
scope: Implemented Web builder support for uniform border width, style, color, and radius controls on registry-eligible components
authority: Approved execution order for the border-support correction under P5-D7; Project.md owns product intent, the Phase 5 architecture proposal owns approved Phase 5 scope, and verified source owns current behavior
owner: Unassigned; accountable product and architecture owner required before promotion
lifecycle: approved
freshness: Implemented and verified against source, 143 automated tests, TypeScript, ESLint, the production build, and Chrome editor/preview behavior on 2026-08-10; invalidated by a border-scope decision, style-contract change, implementation change, or verification-status change
---

# Plan: Add complete uniform border controls

## Goal, scope, and authority

Add an actual, visible border to the existing **Border** Inspector group without creating a separate styling or mutation path. Components that already declare the registry `border` capability will support:

- Border style: None, Solid, Dashed, or Dotted.
- Uniform border width with nonnegative `px`, `rem`, or `em` values.
- Border color using the existing color picker, text value, and opacity behavior.
- The existing uniform border radius control.

All border edits will write to the active Desktop, Tablet, or Mobile style layer through the existing `node.updateStyles` command. They will use the existing responsive cascade, validation, hydration, rendering, history, Undo, and Redo systems.

The accountable user approved this D3 execution plan and authorized implementation on 2026-08-10. P5-D7 in the [Phase 5 architecture proposal](Phase-5-Architecture-Proposal.md) replaces the earlier radius-only Border decision.

### Verified as-built state

- [`Project.md`](../../../Project.md#right-panel-properties-inspector) expects border color, width, style, and radius in the Properties Inspector.
- [`StyleValues`](../../../src/builder/styles/types.ts) stores optional `borderWidth`, `borderStyle`, `borderColor`, and `borderRadius` fields.
- The [style schema](../../../src/builder/styles/schema.ts), [responsive resolver](../../../src/builder/styles/resolve.ts), [CSS compiler](../../../src/builder/styles/compile.ts), and [command property allowlist](../../../src/builder/commands/execute-command.ts) validate, cascade, compile, and accept the uniform border fields.
- The [Inspector](../../../src/builder/ui/inspector-panel.tsx) renders style, width/unit, shared color/opacity, and radius/unit controls in the existing **Border** group.
- Section, Container, Card, and Button already declare the `border` capability. Heading and Text do not.
- Verified Chrome production behavior on 2026-08-10 showed atomic `1px solid #000000` initialization, one-step Undo/Redo, inactive-value preservation under None, Desktop/Tablet override isolation, and matching semantic preview CSS.

### Included work

- Extend the persisted responsive style contract with optional, uniform border fields.
- Validate, clone, cascade, compile, command, hydrate, and render those fields.
- Add capability-gated Inspector controls with accessible labels and locked-state behavior.
- Make the first visible-style selection produce a visible border in one atomic command.
- Preserve existing documents and existing component rendering when no border fields are present.
- Add behavior-first automated coverage and real-browser validation.
- Update Phase 5 and maintained project documentation after verified implementation.

### Excluded work

- Independent top, right, bottom, or left border controls.
- Different width, style, color, or radius per side/corner.
- Border images, gradients, shadows, outlines, or multiple borders.
- Canvas border-drag handles or direct manipulation.
- New reset/unset semantics or return-to-inheritance controls.
- New registry capability names or capability assignments.
- Changes to placement, component props, tree structure, backend services, persistence services, publishing, or deployment.

## Implemented style contract

Use three additive, flat fields beside the existing `borderRadius`:

```ts
type BorderWidthUnit = "px" | "rem" | "em";
type BorderWidthValue = {
  value: number;
  unit: BorderWidthUnit;
};
type BorderStyle = "none" | "solid" | "dashed" | "dotted";

type StyleValues = {
  // Existing fields...
  borderWidth?: BorderWidthValue;
  borderStyle?: BorderStyle;
  borderColor?: string;
  borderRadius?: LengthValue;
};
```

The dedicated width type prevents invalid border-width keywords, percentages, viewport units, negative values, and non-finite values from entering the document. Flat optional fields fit the existing field-level responsive cascade and avoid introducing a new nested configuration type solely for a uniform border.

The fields remain optional so existing schema-version-1 documents hydrate unchanged and render exactly as they do today. No document migration or component migration is proposed. This follows the existing additive-contract precedent, but a newer document containing border fields will not hydrate in an older strict-schema build; persistence and cross-version document exchange remain outside the delivered product scope.

## Inspector behavior

Render controls in this order inside the existing **Border** group:

1. Border style.
2. Border width and unit.
3. Border color and opacity.
4. Border radius and unit.

Resolved missing values appear as UI fallbacks, not persisted defaults:

- Style: `none`.
- Width: `0px`.
- Color: `#000000` at 100% opacity.

When a user changes style from `none` or an absent value to Solid, Dashed, or Dotted, the Inspector will send one atomic `node.updateStyles` batch containing:

- The selected `borderStyle`.
- `borderWidth: 1px` only when the resolved width is absent or zero.
- `borderColor: #000000` only when the resolved color is absent.

This guarantees that choosing a visible style immediately produces a visible border. Choosing None writes only `borderStyle: "none"`; it preserves inactive width, color, and radius values so they return if the user re-enables the border. Undo and Redo treat either operation as one existing command.

Width and color controls remain readable but disabled while the resolved style is `none`. Radius stays independently editable because rounded corners are meaningful without a visible border. Locked nodes disable every Border control through the existing lock behavior.

Edits at Tablet or Mobile create active-layer overrides. Selecting None at a narrower viewport intentionally suppresses an inherited visible border. Resetting that override back to inheritance remains deferred with the existing reset/unset decision.

## Constraints and assumptions

- **Verified:** The workspace is not a Git worktree; repository branch and synchronization steps do not apply.
- **Verified:** `node.updateStyles` already supports an atomic nonempty array of flat style changes and validates the complete candidate document before commit.
- **Verified:** The shared renderer compiles resolved styles for both the editor and preview route, so no renderer-specific border path is required.
- **Verified:** Border width accepts `px`, `rem`, and `em`; percentages, viewport units, keywords, negative values, and non-finite values remain unavailable.
- **Verified:** The visible default is `1px solid #000000` when the user enables a border with no inherited values.
- **Verified:** Optional additive fields do not increment the project or component schema version because missing fields preserve current semantics and no persisted cross-version exchange is shipped.
- **Approved boundary:** P5-D7 permits only the three additive uniform-border fields and preserves the remaining frozen Phase 5 architecture.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Phase 5 border amendment | Approve the uniform fields, closed style set, units, atomic initialization, and exclusions | Accountable user / product and architecture owner | Stop before implementation and revise this plan |
| Existing responsive style pipeline | Base, Tablet, and Mobile flat-field cascade remains authoritative | Technical verifier | Stop if implementation would require a second cascade |
| Existing command/history pipeline | All commits use `node.updateStyles`; one UI action creates one history entry | Technical verifier | Stop if a new command or history model appears necessary |
| Strict hydration | Old documents without border fields and new documents with valid fields both hydrate | Technical verifier | Do not ship; correct the schema or add an approved migration |
| Shared color control | Border color preserves picker focus, typed custom values, and opacity behavior | Technical verifier | Isolate and correct the shared control without regressing Background/Typography |
| Phase 6 preview renderer | Preview continues to use the shared resolved/compiled styles | Technical verifier | Fix the shared seam; do not add preview-only CSS |

## Affected implementation

| Area | Expected files | Planned change |
| --- | --- | --- |
| Style types | `src/builder/styles/types.ts` | Add `BorderWidthUnit`, `BorderWidthValue`, `BorderStyle`, and optional flat fields |
| Validation | `src/builder/styles/schema.ts` | Add strict width/style schemas to base and responsive patch validation |
| Responsive resolution | `src/builder/styles/resolve.ts` | Clone and merge border width plus flat style/color fields without mutation |
| CSS compilation | `src/builder/styles/compile.ts` | Emit `borderWidth`, `borderStyle`, `borderColor`, and existing radius |
| Commands | `src/builder/commands/execute-command.ts` | Add the three fields to the runtime style-property allowlist |
| Inspector | `src/builder/ui/inspector-panel.tsx` | Add the style selector, dedicated width control, reused color/opacity control, and atomic initialization batch |
| Presentation | `src/app/globals.css` | Adjust Border group layout only if the existing control primitives do not fit cleanly |
| Tests | Existing style, command, hydration, registry/rendering, and editor specs | Add contract, cascade, behavior, history, accessibility, and regression coverage |
| Documentation | Phase 5 proposal, workspace, validation report, and `Project.md` contract snippet | Record the approved decision and verified as-built behavior after implementation |

Component definitions should not gain default border fields, and registry capability assignments should not change. Missing values remain semantically equivalent to the browser's native no-border defaults.

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| BORDER-01 | Approve and record Phase 5 decision P5-D7, replacing the radius-only exclusion with uniform border support | User review of this plan | Phase 5 proposal states the approved fields, defaults, exclusions, and compatibility policy | Accountable user / document author | Complete |
| BORDER-02 | Add failing contract tests for valid/invalid border values, old-document compatibility, responsive overrides, and exact CSS output | BORDER-01 | Focused schema, resolve, compile, hydration, command, and editor tests produced 7 intended failures before implementation | Implementer / technical verifier | Complete |
| BORDER-03 | Implement the additive style types, schemas, cloning, cascade, and CSS compiler | BORDER-02 | Focused style and hydration specs pass; existing style behavior remains green | Implementer / technical verifier | Complete |
| BORDER-04 | Extend `node.updateStyles` validation for the new flat properties without changing the command kind or history model | BORDER-03 | Executor and editor tests cover responsive writes, invalid values, atomicity, Undo, and Redo | Implementer / technical verifier | Complete |
| BORDER-05 | Add capability-gated Inspector controls and atomic visible-style initialization | BORDER-04 | React tests cover capability presence, order, fallbacks, disabled states, None behavior, color opacity, and one-command initialization | Implementer / technical verifier | Complete |
| BORDER-06 | Verify semantic editor and preview rendering for Section, Container, Card, and Button | BORDER-05 | Shared compiler coverage applies to every registered semantic renderer; Chrome confirms matching Section editor/preview CSS and registry tests confirm the capability matrix | Implementer / technical verifier | Complete |
| BORDER-07 | Run full quality gates and real-browser scenarios | BORDER-06 | TypeScript, ESLint, 143 tests, production build, and the recorded risk-based Chrome matrix pass | Technical verifier | Complete |
| BORDER-08 | Update authoritative Phase 5 documentation and the validation report with exact evidence and remaining limits | BORDER-07 | Proposal, plan, workspace, validation report, and `Project.md` record the implemented contract and evidence | Document author / accountable owner | Complete |

## Required automated coverage

### Style and hydration

- Accept all four styles and nonnegative finite widths in `px`, `rem`, and `em`.
- Reject negative/non-finite widths, unsupported units, keywords, percentages, and unknown styles.
- Preserve a base border through Tablet/Mobile and override each flat field independently.
- Compile exact React CSS properties for visible and `none` borders.
- Hydrate an existing document with no border fields without mutation or migration.
- Hydrate valid new fields and reject malformed new fields with a precise style path.

### Commands and history

- Apply width, style, and color to the selected active viewport only.
- Apply visible-style initialization as one atomic nonempty change batch.
- Reject malformed fields and locked-node changes without mutating source state.
- Return no-op for unchanged border values.
- Undo and Redo restore the complete border transition in one step.

### Inspector and rendering

- Show the four controls only for Section, Container, Card, and Button.
- Keep the existing group order and collapsed-by-default behavior.
- Selecting Solid, Dashed, or Dotted from no border immediately renders `1px` with the default color.
- Selecting None hides the border without deleting width, color, or radius.
- Width cannot become negative and cannot author `%`, `vw`, or `vh`.
- Border color supports the existing picker continuity, typed custom colors, and opacity encoding without applying element opacity.
- Tablet/Mobile edits follow the existing responsive inheritance and override rules.
- Locked nodes expose readable disabled controls.
- Preview and editor semantic roots receive the same compiled border CSS.

## Real-browser validation matrix

1. Add a Section with a transparent background, enable Solid, and confirm a visible `1px` border appears immediately.
2. Change width, style, color, opacity, and radius on a Card; inspect inline and computed CSS.
3. Set a Desktop border, override style/color on Tablet, suppress it with None on Mobile, and verify each viewport.
4. Undo and Redo the first-enable batch once each and verify that all initialized fields move together.
5. Lock a bordered node and confirm every Border control is disabled while rendering remains unchanged.
6. Verify Button support and confirm Heading/Text do not expose the Border group.
7. Open the dedicated preview route and confirm it matches the editor's semantic border rendering without editor-only markup.
8. Exercise keyboard focus, labels, high zoom, and the color-opacity controls.

## Quality and approval gates

This is an R2 documentation and compatibility change because it extends the persisted project style contract. Implementation is complete only when:

- The accountable user approved P5-D7 and authorized implementation on 2026-08-10.
- Focused tests are written before the contract implementation and demonstrate the intended failure.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` pass.
- Risk-based Chrome checks pass for the user-visible border flow and preview; deterministic automated evidence covers the remaining capability, validation, hydration, and lock cases, and manual accessibility/cross-browser gaps are recorded.
- Existing documents hydrate unchanged; no unapproved migration or schema-version change is introduced.
- Commands, store/history, placement, component props, and renderer contracts remain unchanged except for accepting/compiling the new style fields.
- The final documentation distinguishes automated, browser, and untested evidence without overstating coverage.

## Risks, rollback, and containment

| Risk | Impact | Containment |
| --- | --- | --- |
| A border control changes no visible pixels | Users repeat the original confusion | Make visible-style selection atomically initialize missing width and color; validate computed CSS in a browser |
| Unsupported border-width units compile to invalid CSS | Stored state and rendered output diverge | Use a dedicated closed width type and schema rather than general `LengthValue` |
| Responsive None cannot return to inheritance | Mobile/Tablet users may need reset | State the existing reset limitation; do not invent `null` or copy-based reset semantics |
| Color-control changes regress Background or Typography | Shared picker focus/opacity behavior breaks | Reuse the control unchanged where possible and run its existing regression tests |
| New strict fields break old documents | Hydration rejects valid existing work | Keep fields optional and add explicit old-document hydration coverage |
| Same-version new documents fail in an older build | Backward application compatibility is limited | Record the additive-version trade-off; require a version/migration decision before persistence or export ships |
| Borders alter measured box geometry | Width can grow under `content-box` and affect layout/resize measurements | Browser-test nested layouts and resize behavior; do not change global box-sizing as part of this work |

Rollback is code-only because the fields are optional and persistence/export is not shipped. Reverting the type/schema/compiler/Inspector additions restores the old UI, but any in-memory document containing new fields must not be passed to the old strict hydrator. If validation uncovers a migration or box-model requirement, stop after the last green ordered step and return the plan for architectural review.

## Completion evidence

The border-support correction completed on 2026-08-10. The focused red run produced 7 intended failures across the missing schema, resolver, compiler, hydration, command, and Inspector seams; the completed focused run passed 58 tests. Full validation passed `pnpm typecheck`, `pnpm lint`, `pnpm test` (22 files, 143 tests), and `pnpm build`.

Chrome against the production build verified the default disabled state, atomic visible-border initialization, one-step Undo/Redo, `3rem` width, hex-alpha color and opacity, radius editing, None preservation, Desktop/Tablet override isolation, and matching preview CSS on the semantic Section root. Capability exposure for Section, Container, Card, and Button; absence for Heading and Text; invalid-width rejection; old-document hydration; and locked-node mutation rejection remain deterministic automated evidence rather than a repeated manual browser matrix. High-zoom, screen-reader, touch, and non-Chrome behavior remain follow-up validation, not claimed completion evidence.
