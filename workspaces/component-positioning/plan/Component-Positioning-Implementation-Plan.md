---
doc_id: WEB-BUILDER-COMPONENT-POSITIONING-IMPLEMENTATION-PLAN
type: D3
scope: Execution plan for responsive visual X/Y component movement in the web-builder Inspector and Canvas
authority: Selected execution plan for component positioning; workspace.md owns execution state, and code, tests, approved product decisions, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: approved
freshness: Created on 2026-08-12 from verified source inspection of main at e15cd9f798ad7b90ee7a9526627af73d583e346b, assigned to feature/component-positioning, revised after UX, recovery, extensibility, eligibility, responsive-schema, transform-composition, and high-risk container-enablement review, reverified through the supported-Node automated matrix and retained available-Chrome scope, and completed with project-owner implementation-report approval on 2026-08-13; invalidated by an approved scope change or relevant style, document-schema, command, Canvas, Inspector, Layers, breadcrumbs, rendering, publishing, drag-and-drop, geometry, transform, runtime, or supported-browser change
---

# Plan: Add responsive visual component positioning

## Goal, scope, and authority

Let a user visually move a selected component along X and Y from the Canvas or Inspector while preserving the existing responsive style system, semantic renderer boundary, structural drag-and-drop behavior, command validation, locks, and Undo/Redo guarantees.

This plan owns the intended work order and verification gates. [The feature workspace](../workspace.md) owns execution status. [The baseline research](../research/current-positioning-and-movement.md) records the verified current state. Code, tests, approved product decisions, and verified runtime behavior remain authoritative for implemented behavior.

### Recommended first-release behavior

- Keep the existing drag handle responsible for structural reorder and reparent operations.
- Select the primary visual-positioning affordance through CP-01A before implementation. Compare a dedicated positioning mode, a position handle shown for the selected node, and modifier-assisted dragging; an optional expert shortcut may complement, but must not replace, an accessible touch and keyboard path.
- Persist one atomic `positionOffset` style value with signed X and Y numeric lengths inside each existing responsive style layer: `styles.base.positionOffset`, `styles.tablet.positionOffset`, or `styles.mobile.positionOffset`.
- Compile the resolved offset to the individual CSS `translate` property rather than constructing an arbitrary `transform` string.
- Keep CSS `position` and `zIndex` as independent existing style values; visual movement must not silently change either one.
- Preview pointer and keyboard movement locally, then commit one `node.updateStyles` transaction when the gesture completes.
- Reset removes the active layer's offset so desktop returns to zero and narrower viewports inherit the preceding layer.
- Let users select an unreachable node through Layers, understand its selection path through breadcrumbs, and recover it through Inspector controls without Canvas hit-testing.
- Keep pointer-to-artboard conversion, offset calculation, proposed geometry, and preview generation reusable so future snapping, guides, alignment, and distribution can adjust proposed geometry without replacing the gesture or command boundary.
- Preserve `positionOffset` as an independently meaningful value so later `rotate`, `scale`, and controlled transform features can compose with it without reinterpreting or migrating existing offset values. Future features may still require their own additive document-schema migration.
- Enable eligible non-container flex and grid children independently of the high-risk container gate. Keep roots and every container-capable layout wrapper disabled until their separate stacking-context and containing-block gate passes.
- Render persisted `positionOffset` through the shared responsive resolver, style compiler, and semantic node renderer in Canvas, Preview, and every future Published surface. V1 verifies Canvas/Preview parity; Published parity becomes a blocking publishing gate when Published output exists.

Included:

- Persisted style types, runtime validation, responsive resolution, CSS compilation, cloning, and document migration for visual offsets.
- Explicit style reset/unset semantics through the canonical command boundary; `null` must not be overloaded to mean inherit.
- Inspector X/Y controls, value-origin guidance, active-viewport editing, and reset.
- The CP-01A UX comparison, evidence, decision, and approval record before application implementation.
- The selected Canvas positioning affordance with pointer or touch drag, arrow-key nudge, Shift-modified larger steps, Enter commit, Escape cancel, and accessible instructions.
- One preview-only visual edit during a gesture and one undoable committed change at completion.
- Locked, hidden, text-editing, resize, spacing, layout-guide, and structural-drag interaction exclusions.
- A decision matrix for root placement, containers, flex/grid children, absolute-positioned elements, locks, registry capabilities, and model categories that are not currently represented.
- Off-canvas recovery through Layers selection, breadcrumb path continuity, responsive value-origin guidance, and Inspector reset of the responsible layer without clicking the node on the Canvas.
- Reusable coordinate and geometry seams for future snap-to-grid, snap-to-center, snap-to-sibling, alignment guides, and distribution tools without implementing those features in V1.
- Verified composition with future individual `rotate` and `scale` properties and with controlled component-authored `transform` output, including the specified CSS transform order.
- A separately decidable high-risk enablement gate for root nodes and container-capable layout wrappers, plus a leaf-only release fallback when that gate fails.
- Bounded rendered scenarios for stacking, containing blocks, overlays, hit testing, nested transforms, deep flex/grid hierarchies, large offsets, and off-canvas recovery.
- Canvas and Preview parity, hydration/migration compatibility, regression coverage, and rendered browser verification.

Excluded unless separately approved:

- Replacing or weakening structural drag-and-drop, placement validation, tree relationships, or `node.move`.
- Parent-anchored absolute-position dragging, containing-block selection, fixed/sticky coordinate authoring, or automatic changes to CSS `position`.
- Snap-to-grid, snap-to-center, snap-to-sibling, snapping guides, alignment/distribution tools, collision avoidance, canvas bounds clamping, or automatic overlap prevention. Only their reusable geometry boundary is included.
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
- Required: responsiveness remains owned by `ResponsiveStyles`; `positionOffset` must not contain its own `base`, `tablet`, or `mobile` keys.
- Proposed: a new document schema version owns the shared persisted style-shape change; component versions remain unchanged.
- Proposed: direct Canvas positioning is available only to selected, unlocked, rendered nodes whose registry definition includes the existing `positioning` capability. Recovery reset remains available through non-Canvas navigation when a node is off-canvas or not rendered.
- Provisional: the primary interaction may be a dedicated mode, a selection handle, or a combined primary affordance plus optional modifier accelerator. Modifier-assisted dragging cannot be the only touch or keyboard path.
- Verified standards constraint: any non-`none` CSS `translate`, including an identity value such as `0px`, creates a stacking context and containing block for descendants. [CSS Transforms Level 2](https://www.w3.org/TR/css-transforms-2/#individual-transforms) also defines individual transform composition before the `transform` list. [CSS Transforms Level 1](https://www.w3.org/TR/css-transforms-1/#transform-rendering) specifies that a transformed element's padding box becomes the containing block for absolute and fixed descendants. Eligibility, zero-value behavior, fixed/sticky descendants, z-index interactions, and composition order require explicit verification.
- Verified implementation boundary: Canvas and Preview currently render committed styles through the shared responsive resolver, style compiler, and semantic node renderer. Published routes and source export do not exist and remain outside V1, so Published runtime parity cannot be claimed before a publishing surface is implemented.
- Required zero-output rule: when the resolved X and Y values are both numerically zero, the compiler emits no individual translation (`translate: none` or no `translate` declaration). An explicit stored zero still overrides an inherited nonzero offset but must not create an unnecessary stacking context.
- The final data shape, supported units, CSS `translate` compatibility and side effects, eligibility matrix, geometry extension seam, transform-composition order, and document migration must be approved before schema implementation begins.
- Before editing Next.js source or configuration, read the applicable installed Next.js 16 documentation under `node_modules/next/dist/docs/`.
- Preserve the unrelated API-data-binding documentation changes already present in the working tree.
- The project owner approved the dedicated branch, and `feature/component-positioning` was created from the inspected `main` commit on 2026-08-12.

### Required persisted contract

CP-01 must approve an equivalent of the following existing-convention shape. Exact units remain subject to CP-01 validation, but the responsive nesting direction is fixed:

```yaml
styles:
  base:
    positionOffset:
      x: { value: 0, unit: px }
      y: { value: 0, unit: px }
  tablet:
    positionOffset:
      x: { value: 20, unit: px }
      y: { value: -10, unit: px }
  mobile:
    positionOffset:
      x: { value: 0, unit: px }
      y: { value: 0, unit: px }
```

`positionOffset` is atomic within a responsive layer: X and Y are stored and validated together. Its axis values accept finite numeric lengths only, not CSS length keywords. Missing layer values inherit through the existing cascade. Reset deletes the targeted layer value; an explicit zero value overrides an inherited nonzero offset and is not the same operation as reset. After responsive resolution, an effective `(0, 0)` compiles to no translation so stored override semantics do not impose identity-transform side effects.

### Required eligibility decision matrix

CP-01 must approve or further restrict this matrix before implementation. A **container-capable layout wrapper** is any node whose registry definition permits children, including Section, Container, Card, Form, and future equivalent definitions. Rows may overlap; `Unsupported` takes precedence over `Restricted`, which takes precedence over `Allowed`. Therefore a flex or grid child that is also a container-capable wrapper remains Restricted.

| Node category or context | Proposed status | Required behavior or decision |
| --- | --- | --- |
| Root sections and other root nodes | Restricted; disabled by default | Enable only after the high-risk gate passes overflow, recovery, stacking-context, containing-block, whole-subtree, and nested-interaction checks; never reinterpret movement as root reordering. |
| Containers and other container-capable layout wrappers | Restricted; disabled by default | Enable only after the high-risk gate passes. Move the rendered subtree as one visual unit and verify fixed/sticky descendants, containing-block changes, z-index, overlays, nested hit-testing, and child editor overlays. |
| Non-container flex children | Allowed | Preserve the original flex slot and sibling layout; communicate that translation may overlap siblings and never mutate flex order or parentage. Leaf stacking and z-index checks still apply. |
| Non-container grid children | Allowed | Preserve the original grid area and sibling layout; communicate that translation may overlap cells and never mutate grid placement or parentage. Leaf stacking and z-index checks still apply. |
| Absolute-positioned elements | Restricted | Apply visual translation from the resolved absolute position without writing inset coordinates or changing `position`; verify containing-block semantics. |
| Reusable component instances | Unsupported / not represented | The current `BuilderNode` model has no reusable-instance identity. A future model must define source/instance style ownership before enabling positioning. |
| Dynamic or generated nodes | Unsupported / not represented | Blocks currently materialize ordinary nodes. Future runtime-generated or data-owned nodes require an explicit persistence and ownership contract. |
| Locked nodes | Unsupported | Canvas movement and Inspector mutation remain disabled; selection and recovery navigation remain available. |
| Nodes without the registry `positioning` capability | Unsupported | Do not expose positioning controls or accept a positioning gesture. |
| Hidden or unrendered nodes at the active viewport | Canvas unsupported; recovery allowed | Do not start a Canvas gesture. Layers selection, breadcrumbs, origin guidance, and Inspector recovery must remain usable. |

### High-risk container enablement gate and fallback

Root nodes and container-capable layout wrappers use a central default-deny eligibility decision. They may be added to the V1 positioning allowlist only after CP-09A records all of the following on every supported browser:

- Sticky descendants retain their approved nearest-scrollport behavior before, during, and after ancestor movement. Translation does not by itself redefine sticky anchoring, so the test must exercise real scrolling and containing boundaries rather than infer success from a static screenshot. See [CSS Positioned Layout Level 3](https://www.w3.org/TR/css-position-3/#sticky-pos).
- Fixed descendants retain the approved product behavior. A fixed descendant expected to remain viewport-fixed cannot pass merely because the browser correctly reanchors it to the translated ancestor; that semantic change fails the gate unless the product contract explicitly changes or the descendant is rendered outside the transformed subtree.
- Z-index and paint order remain predictable against ancestor, sibling, descendant, Canvas-control, and runtime overlay stacking contexts.
- Native controls, in-subtree dropdown/tooltip overlays, and portal-anchored overlays remain visually aligned, unclipped as approved, focusable, and operable. A portal mounted outside the transformed DOM subtree is not treated as a descendant, but its anchor geometry and stacking still require parity checks.
- Pointer targeting, focus targeting, selection, resize/spacing handles, and nested-component hit testing follow the rendered geometry.
- Nested translated containers compose predictably and do not corrupt measurement, preview, recovery, or Undo/Redo behavior.

If any required scenario fails or cannot be verified, CP-09A completes with a **restricted outcome**: keep `positionOffset` enabled for eligible non-container components, keep root and affected container-capable categories disabled at both the affordance and gesture-start eligibility boundaries, record the failed categories and evidence, and proceed with the core release. Do not weaken validation or bypass the shared style compiler to make a failing category appear supported. Enabling a restricted category later requires rerunning and passing CP-09A.

### Mandatory rendered scenario matrix

The fixtures must use bounded, named depths and offsets so failures are reproducible. “Deep” means at least five nested layout ancestors. “Large” means an offset large enough to move the target entirely outside the visible artboard in the exercised viewport.

| Gate | Mandatory scenario | Required evidence |
| --- | --- | --- |
| Core release | Non-container leaf in flex, non-container leaf in grid, five-level flex, five-level grid, and five-level mixed flex/grid hierarchies | Computed geometry, sibling flow, selection, hit testing, Undo/Redo, and Canvas/Preview parity remain correct. |
| Core release | Large positive and large negative offsets at desktop, tablet, and mobile | Persisted values remain unclamped, responsive inheritance remains correct, overflow behavior is documented, and recovery works without Canvas clicking. |
| Core release | Leaf z-index interaction against positioned and translated siblings | Paint order matches the approved stacking contract in Canvas and Preview. |
| Container enablement | Container with a sticky child inside an exercised scroll container | Sticky activation, constraints, scroll targeting, and geometry match the approved contract before and after movement. |
| Container enablement | Container with a fixed child expected to be viewport-fixed | The child remains viewport-fixed through an approved rendering strategy; reanchoring to the translated container fails this scenario. |
| Container enablement | Container with the current native Dropdown plus a synthetic in-subtree dropdown overlay | Native popup/control interaction and the synthetic overlay remain aligned, visible, focusable, and correctly stacked. |
| Container enablement | Container with a synthetic tooltip overlay | Anchor geometry, clipping, stacking, hover/focus behavior, and pointer targeting remain correct. |
| Container enablement | Container with a portal-anchored overlay mounted outside the transformed subtree | Anchor coordinates, scroll response, stacking, focus, dismissal, and Canvas/Preview parity remain correct. |
| Container enablement | Nested translated containers, including five-level flex, five-level grid, and five-level mixed flex/grid descendants | Transform composition, measurement, overlays, hit testing, history, and responsive behavior remain correct. |
| Container enablement | Large positive and negative container offsets followed by off-canvas recovery | Layers selection, breadcrumb continuity, Inspector value origin, responsive reset, focus restoration, and Undo/Redo work without Canvas hit-testing. |

Synthetic overlay fixtures are verification harnesses, not new persisted component types or V1 product features.

### CP-01A positioning UX validation

The approaches are interaction ingredients rather than necessarily exclusive implementations. CP-01A selects one primary affordance and may approve an optional accelerator only after the primary touch, keyboard, and accessible path passes.

| Approach | Advantages | Disadvantages and risks |
| --- | --- | --- |
| A. Dedicated positioning mode | Strong separation from structural drag; persistent instructions and keyboard state; easiest place to communicate active positioning intent. | Adds an activation step; creates mode memory and exit-state risk; may slow repeated adjustments. |
| B. Position handle shown on selection | Direct and visible after selection; supports pointer and touch; avoids dragging the semantic component body. | Adds overlay density near structural-drag and resize handles; may be difficult on small or nested nodes; requires collision and focus-order rules. |
| C. Modifier-assisted drag | Fast optional expert accelerator; adds little persistent UI. | Low discoverability; unavailable as a sole touch path; can conflict with selection, browser, operating-system, and assistive-technology shortcuts. |

Before testing starts, the project owner, interaction owner, and accessibility reviewer must approve the prototype, participant/device coverage, task script, and thresholds. The minimum gate is:

- At least five representative users exercise the pointer workflow; at least four complete selection and first movement without coaching within 30 seconds.
- Every prescribed keyboard-only task completes without pointer input, including start, 1 px and larger-step movement, commit, cancel, and recovery.
- The primary workflow completes on at least one supported touch device without requiring a hardware modifier key or hover.
- No trial dispatches `node.move` while attempting visual positioning, and no structural-drag trial dispatches `node.updateStyles` for position offsets.
- All participants recover a deliberately off-canvas node through Layers and Inspector without clicking it on the Canvas; the target is 100% task completion within 60 seconds after the Layers panel is identified.
- The accessibility reviewer verifies name, role, state, focus order, visible focus, instructions, and announcements in at least one supported screen-reader/browser combination.
- Resize, spacing, layout, text editing, selection, form-control interaction, and structural drag conflict scenarios have zero unresolved gesture-ownership failures.
- The decision record names the selected primary affordance, any optional accelerator, rejected alternatives, evidence, residual risks, and approval. Failure leaves the plan in draft and blocks CP-02.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Product scope | The project owner approves visual offsets as the first release and accepts the exclusions | Project owner | Keep this plan in draft and do not implement ambiguous absolute/freeform behavior |
| Implementation branch | Satisfied on 2026-08-12: the project owner approved `feature/component-positioning`, created from `main` at `e15cd9f798ad7b90ee7a9526627af73d583e346b` | Project owner and repository maintainer | Perform planning only; do not change application code on behalf of this feature |
| Persisted offset contract | Signed value shape, units, responsive inheritance, and CSS compilation are accepted | Editor architecture owner | Stop before schema changes and record the unresolved decision |
| Positioning UX decision | CP-01A selects and approves a primary pointer/touch/keyboard affordance using the measurable gate | Project owner, interaction owner, and accessibility reviewer | Keep the interaction unimplemented; do not treat a modifier as the only accessible path |
| Eligibility contract | CP-01 approves the node/context matrix and precedence rules against the current `BuilderNode` and registry model | Editor architecture owner and accessibility reviewer | Hide the affordance for unresolved categories and do not infer eligibility from layout alone |
| Document compatibility | Version 1 documents have one deterministic path to the new current schema | Editor architecture owner and technical verifier | Do not enable offset writes or advance the schema version |
| Style reset semantics | The command layer can delete an active-layer property without using `null` or bypassing validation | Editor architecture owner | Ship no Reset control and do not simulate inheritance with zero overrides |
| Gesture ownership | Structural drag, positioning, spacing, resizing, layout guides, and text editing have mutually exclusive activation rules | Interaction owner and accessibility reviewer | Disable the positioning affordance until conflicts are resolved |
| Browser support | The supported browser set and React style typing accept the selected individual CSS translation property | Repository maintainer and technical verifier | Use a reviewed controlled compiler fallback or revise the persisted design before implementation |
| Geometry baseline | Artboard-relative pointer deltas and any Canvas zoom conversion are characterized | Implementer and technical verifier | Restrict the feature to verified 1:1 scale and do not claim zoom-safe behavior |
| Geometry extension boundary | Coordinate conversion, raw proposed offset/rect, optional adjustment, preview, and commit responsibilities are defined without implementing snapping | Editor architecture owner and implementer | Stop gesture-helper implementation if future adjustment would require bypassing or replacing the command boundary |
| Transform composition | CSS ordering, individual `translate`/`rotate`/`scale`, controlled `transform`, transform origin, stacking context, and containing-block behavior are accepted | Editor architecture owner and technical verifier | Restrict eligibility or revise compilation before enabling offset writes |
| Recovery path | Layers can select an unreachable node, breadcrumbs preserve its path, and Inspector can reset the responsible responsive layer | Interaction owner and accessibility reviewer | Do not release large/unclamped offsets until non-Canvas recovery passes |
| High-risk container enablement | CP-09A passes for each root/container-capable category on every supported browser | Editor architecture owner, technical verifier, and accessibility reviewer | Complete CP-09A with a restricted outcome, keep the failing categories disabled, and release only the passing non-container scope |
| Semantic-renderer parity | Committed offsets use the shared resolver/compiler/node-renderer path in Canvas and Preview; every future Published renderer is contractually required to reuse it | Editor architecture owner and technical verifier | Block V1 on Canvas/Preview divergence; block a future publishing release until Published parity exists and passes |

## Ordered work

### Executable todo slices

The CP milestones execute through the following small, independently verifiable slices. The feature workspace and branch journal remain the execution-state authorities; this table defines the work decomposition rather than duplicating live status.

| Slice | Parent | Small deliverable | Narrow verification |
| --- | --- | --- | --- |
| CP-00.1 | CP-00 | Record branch, HEAD, dirty-tree boundaries, Node, pnpm, and Next.js versions | Repository mapping and unrelated-file boundary are explicit |
| CP-00.2 | CP-00 | Run lint, typecheck, tests, focused reruns, and build before application changes | Baseline results and environment limitations are retained |
| CP-01.1 | CP-01 | Map style types, runtime schemas, responsive merge/clone, compiler, renderer, registry, command, migration, Inspector, and Canvas seams | Every intended change has one verified authority and test location |
| CP-01.2 | CP-01 | Select px-only atomic offsets, reset/zero semantics, eligibility precedence, shared-renderer parity, and geometry boundaries | Signed, inherited, explicit-zero, reset, restricted, and parity examples are reviewable |
| CP-01A.1 | CP-01A | Build a disposable comparison prototype for dedicated mode, selection handle, and optional modifier accelerator | Pointer, touch-sized control, keyboard, focus, cancel, commit, and recovery tasks can be exercised without document writes |
| CP-01A.2 | CP-01A | Run the approved representative-user and accessibility task script and retain the decision evidence | Thresholds, selected/rejected alternatives, residual risks, and accountable approval are recorded |
| CP-02.1 | CP-02 | Add `PositionOffsetValue` types and strict base/patch schemas | Signed finite px values pass; keywords, partial axes, other units, and non-finite values fail |
| CP-02.2 | CP-02 | Add atomic clone and responsive cascade behavior | Base/tablet/mobile inheritance, explicit zero, and source immutability pass |
| CP-02.3 | CP-02 | Compile nonzero offsets to individual CSS `translate` and omit resolved zero | Compiler and semantic-renderer tests prove one shared committed output path |
| CP-03.1 | CP-03 | Advance the project schema and add the deterministic version-1 migration | Version 1 preserves content, version 2 round-trips, and future/malformed versions fail atomically |
| CP-04.1 | CP-04 | Represent explicit style set and reset operations without sentinel values | Command shape distinguishes stored zero from property deletion |
| CP-04.2 | CP-04 | Apply set/reset through the canonical responsive layer and clean empty patches | Desktop/tablet/mobile reset affects only the target layer and returns defined no-op reasons |
| CP-04.3 | CP-04 | Extend allowlist, validation-equivalence, lock, invalid-target, and history tests | Scoped and full validation remain equivalent; one command creates at most one commit |
| CP-05.1 | CP-05 | Add px offset, coordinate, proposed-rect, and optional-adjustment pure helpers | Positive/negative/large deltas, no clamp, and a synthetic adjustment pass |
| CP-05.2 | CP-05 | Add pointer/touch and keyboard session transitions for preview, commit, and cancel | 1 px, 10 px, Enter, Escape, pointer cancel, and one-commit behavior pass |
| CP-06.1 | CP-06 | Add one registry-driven positioning eligibility evaluator with matrix precedence | Root, container, leaf, capability, lock, hidden, and positioned-node cases pass |
| CP-06.2 | CP-06 | Add Inspector X/Y controls, active-layer origin, exact reset, and recovery copy | Controls are accessible, atomic, viewport-aware, and usable without Canvas hit testing |
| CP-07.1 | CP-07 | Add the CP-01A-approved Canvas affordance outside semantic renderer markup | Structural drag remains present and gesture ownership is mutually exclusive |
| CP-07.2 | CP-07 | Connect pointer/touch preview and one-command commit through visual editing | Preview equals commit, cancellation writes nothing, and the tree never changes |
| CP-07.3 | CP-07 | Connect keyboard start, nudge, commit, cancel, focus restoration, and announcements | Keyboard and accessibility interaction tests pass |
| CP-08.1 | CP-08 | Run focused integration, hydration, history, duplication, block, rendering, Preview, and drag regression suites | Every core contract passes before browser verification |
| CP-09.1 | CP-09 | Exercise the bounded core Canvas/Preview browser matrix at all three viewports | Geometry, computed styles, recovery, focus, hit testing, and console evidence are retained |
| CP-09A.1 | CP-09A | Exercise the separate root/container browser matrix and decide each category | Each category is enabled only on full pass; otherwise it remains centrally restricted |
| CP-10.1 | CP-10 | Run the supported-Node full matrix and synchronize the implementation report and durable context | Exact evidence, residual restrictions, and review readiness are recorded |

### CP-01 approved implementation contract

Project-owner review on 2026-08-12 approves the following technical contract and authorizes production implementation. This approval does not invent or replace the still-unretained five-user, physical-touch, or screen-reader evidence; those remain explicit release-readiness follow-ups for the public UI.

- Use one atomic `{ x, y }` value whose axes are signed finite pixel lengths. V1 does not expose percentage, font-relative, or viewport-relative offset units because pointer conversion and recovery semantics for those units are not yet deterministic.
- Treat missing data as inherited/zero, stored `(0, 0)` as an explicit responsive override, and reset as deletion from the active layer. Never encode reset as `null`, `undefined`, or a magic numeric value.
- Compile only a resolved nonzero value to the individual `translate` property. Canvas and Preview receive committed output only through `resolveResponsiveStyles`, `compileStyleValues`, and `NodeRenderingController`.
- Classify container capability from `componentRegistry[type].children.allowed`. Root nodes, all container-capable definitions, and resolved `absolute`, `fixed`, or `sticky` nodes remain Restricted in the first release. Locked or capability-ineligible nodes are Unsupported. Hidden nodes cannot start a Canvas gesture; non-Canvas reset remains available for recovery when otherwise eligible.
- Keep eligibility and operation context explicit: Canvas gesture start, Inspector set, Inspector recovery reset, and command validation consume the same evaluator but may apply stricter operation-specific outcomes.
- Keep artboard coordinate conversion, raw proposed offset/rect, optional adjustment, preview, and command commit as separate pure boundaries. V1 implements the identity adjustment only.
- Implement the selected-node position handle as the primary affordance because it preserves the structural drag handle and offers direct pointer/touch/keyboard semantics. Dedicated mode remains rejected for V1; modifier drag is accelerator-only.

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| CP-00 | Obtain scope approval, create or switch to an approved feature branch, record HEAD/tool versions, and establish a clean verification baseline | Product scope, implementation branch | Branch/workspace mapping is consistent; unrelated changes are preserved; focused and full baseline results are recorded | Repository maintainer and technical verifier | Complete with retained limitations - available Node is unsupported; two full-suite timeouts pass in focused rerun |
| CP-01 | Finalize the architecture and data contract: visual offsets versus absolute coordinates, exact existing-convention persisted shape, numeric units, atomic X/Y behavior, explicit zero versus reset, zero-output compilation, central eligibility matrix, high-risk fallback, recovery semantics, reusable geometry boundary, transform composition, semantic-renderer parity, and exclusions | CP-00, persisted offset contract, eligibility contract, geometry extension boundary, transform composition, recovery path | Approved examples cover desktop/tablet/mobile inheritance, positive/negative and explicit-zero values, reset, locks, every eligibility row and precedence case, geometry adjustment seams, fixed/sticky descendants, z-index, parity, restricted release, and structural drag separation | Project owner, editor architecture owner, interaction owner, and accessibility reviewer | Complete - project owner approved the recorded contract on 2026-08-12 |
| CP-01A | Prototype and compare the dedicated mode, selected-node position handle, and modifier-assisted accelerator; execute the measurable discoverability, pointer, touch, keyboard, accessibility, recovery, and conflict gate; select and approve one primary affordance plus any optional accelerator | CP-00, gesture ownership, recovery path | The decision record identifies evidence, selected/rejected approaches, residual risks, and approval. Project-owner risk acceptance may authorize implementation while missing human evidence remains a public-release follow-up | Project owner, interaction owner, accessibility reviewer, and technical verifier | Complete for implementation - project owner selected the position handle and accepted the recorded evidence gap on 2026-08-12; human touch/screen-reader/user evidence remains required before public release |
| CP-02 | Add the signed numeric offset type and schema inside the existing responsive layers, extend clone/merge behavior, compile it to controlled CSS, and add schema/resolve/compile tests | CP-01, CP-01A, browser support, transform composition | Missing and resolved-zero offsets compile to no translation; explicit stored zero still overrides inherited nonzero data; signed values validate; keywords reject; responsive layers resolve predictably; transform order and source immutability pass | Implementer | Complete - focused schema, resolution, and compiler suites pass 56 tests |
| CP-03 | Advance the project schema and add one deterministic version-1 migration that preserves existing documents while admitting the optional offset shape | CP-02, document compatibility | Version-1 fixtures migrate to the new version without content changes; current/future/missing migration cases remain atomic and diagnostic | Implementer and technical verifier | Complete - schema version 2 migration and hydration tests pass |
| CP-04 | Extend the canonical style command with explicit set and reset/unset behavior, update the style-property allowlist, and preserve scoped/full validation equivalence | CP-02, style reset semantics | Invalid targets and values reject atomically; reset deletes only the targeted active-layer value; applied/no-op/history semantics remain correct | Implementer and editor architecture owner | Complete - explicit set/reset, eligibility validation, equivalence, no-op, and history tests pass 48 tests |
| CP-05 | Add reusable coordinate-space, offset, proposed-geometry, optional-adjustment, preview, and gesture helpers to the visual-editing module, including pointer deltas, zoom/scroll conversion where supported, unit preservation where deterministic, keyboard steps, and cancellation; do not implement snapping | CP-02, CP-04, geometry baseline, geometry extension boundary | Pure unit tests cover positive/negative deltas, inherited offsets, raw versus adjusted proposals, 1 px arrows, 10 px Shift+arrows, Enter, Escape, zoom/scroll policy, no source mutation, and a synthetic future adjustment without command-boundary changes | Implementer | Complete - eligibility and visual-editing helper suites pass 23 tests |
| CP-06 | Expand the Position Inspector with Offset X, Offset Y, origin/inheritance guidance, deterministic recovery reset, and the CP-01A-selected positioning affordance for eligible nodes; apply a central default-deny rule to roots and container-capable wrappers until CP-09A passes | CP-01A, CP-04, CP-05, eligibility contract, recovery path | Controls follow matrix precedence, remain viewport/lock/validation aware, identify the responsible inherited layer, support recovery when the node is off-canvas or unrendered, are keyboard accessible, expose no invalid intermediate state, and cannot enable a restricted category through UI-only bypass | Implementer and accessibility reviewer | Complete - responsive origin/inheritance, exact set/reset, Layers and breadcrumb off-canvas recovery, and central restriction coverage pass automated tests and rendered verification |
| CP-07 | Add the CP-01A-selected Canvas movement interaction using the existing visual preview/commit lifecycle; isolate it from structural drag, resize, spacing, layout guides, selection, inline text editing, and semantic component interaction | CP-05, CP-06, gesture ownership | Pointer, touch, and keyboard paths required by the selected affordance preview smoothly, commit once, cancel cleanly, keep the tree unchanged, never cross command ownership, and produce clear live announcements | Implementer and accessibility reviewer | Complete - pointer/touch and keyboard preview, commit, cancel, focus, announcements, structural-drag separation, and gesture-conflict coverage pass; rendered pointer testing also found and closed a selection-continuity defect |
| CP-08 | Verify history, responsive behavior, hydration, semantic-renderer parity, central eligibility, locks, selection, duplication, block-created nodes, transform side effects, recovery navigation, and structural drag regressions | CP-03 through CP-07 | Focused integration tests and the core scenario rows pass; one gesture creates one undo step; Undo/Redo restores offsets exactly; every matrix row and precedence case is enforced; resolved zero emits no translation; old documents hydrate; all existing drag/drop tests pass | Implementer and technical verifier | Complete - hydration, history, responsive behavior, duplication, block-created leaves, recovery navigation, structural drag, eligibility, Canvas/Preview parity, and full serial repository regressions pass |
| CP-09 | Run core rendered browser checks at desktop, tablet, and mobile widths, including the non-container flex/grid, deep hierarchy, large-offset, z-index, recovery, pointer/touch/keyboard, and form/control scenarios, then address verified defects | CP-08 | Canvas and Preview committed geometry and computed styles match; transient Canvas preview equals the eventual committed result; every core scenario passes; the CP-01A workflow remains usable; every deliberately off-canvas leaf is recoverable without Canvas clicking; focus, announcements, and browser console pass | Technical verifier and accessibility reviewer | Complete for the retained browser-mechanical scope in available Chrome - all three viewports, inherited and explicit-zero layers, large signed offsets, off-canvas recovery, pointer and keyboard commit/cancel, selection continuity, translated hit testing, five-level flex/grid/mixed layouts, leaf z-index paint order, and translated form-control operation pass Canvas/Preview checks; supported physical-touch, screen-reader/browser, representative-user, and any additional supported-browser evidence remain public-release gates |
| CP-09A | Run the separate high-risk container/root browser matrix on every supported browser and record one outcome per category: enabled only after every required scenario passes, or restricted with the category kept disabled | CP-08, high-risk container enablement, semantic-renderer parity | Sticky/fixed descendants, native and synthetic overlays, portal anchoring, z-index, hit testing, nested transforms, deep layouts, large offsets, and container recovery have retained evidence; a failed scenario produces a restricted outcome rather than blocking the passing core scope | Technical verifier, editor architecture owner, and accessibility reviewer | Complete with restricted outcome - no root or container-capable category is enabled because the sticky/fixed, overlay, portal, nested-transform, and whole-subtree matrix has not passed; central affordance, gesture-start, and command validation continue to deny those categories |
| CP-10 | Run the complete verification matrix, update durable architecture only with verified behavior, publish an implementation report, and prepare the feature for review | CP-09, CP-09A decision | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on the supported Node version; CP-09A records an enabled or restricted outcome for every high-risk category; documentation checks and owner review pass | Technical verifier and project owner | Complete - checksum-verified Node 24.19.0 lint, typecheck, 456-test serial suite, production build, and documentation-integrity checks pass; durable architecture and the implementation report are synchronized; the project owner approved the report on 2026-08-13; the five-user, physical-touch, screen-reader/browser, and additional supported-browser evidence remains a separate public-release gate |

## Quality and approval gates

- Do not begin production application-code changes until both CP-01 and CP-01A record accountable approval of the data, eligibility, recovery, geometry, transform, and interaction contracts. CP-01A may use a bounded disposable prototype that cannot write project documents. The project owner supplied that approval on 2026-08-12; unretained human-study, physical-touch, and screen-reader evidence remains a public-release gate rather than an implementation blocker.
- Read the relevant installed Next.js 16 documentation before changing any Next.js source or configuration.
- Keep the semantic component renderer and saved component tree free of editor handles, pointer coordinates, DOM references, and gesture state.
- Do not add a new document mutation path. Persisted offsets must use the canonical command dispatcher and complete responsive-style validation.
- Do not overload `null`, `undefined`, or a magic number to mean responsive inheritance or reset.
- Keep structural drag-and-drop available through its existing dedicated handle and confirm positioning never dispatches `node.move`; structural dragging must never write `positionOffset`.
- Disable positioning while the node is locked, hidden at the active viewport, being text-edited, structurally dragged, resized, or edited by another Canvas visual mode.
- Use appropriate accessible control semantics and visible focus for the selected positioning affordance. Announce start, preview intent where appropriate, commit, cancellation, rejection, and lock state.
- Use 1 px arrow-key movement and 10 px movement with Shift unless accessibility review selects a different documented step.
- Ensure pointer-up and Enter commit at most one history transaction; Escape and pointer cancellation commit none.
- Test active-layer behavior separately for desktop, tablet, and mobile, including inheritance and reset.
- Test negative and large offsets without silently clamping persisted values. Select off-canvas and hidden nodes through Layers, preserve their breadcrumb path, identify the responsive value origin, and reset the responsible layer through the Inspector without Canvas hit-testing.
- Enforce the approved eligibility matrix at the affordance, gesture-start, and command-validation boundaries where applicable; UI hiding alone is not an authorization boundary.
- Classify container-capable wrappers from registry behavior rather than display style or a hard-coded component-name list. Apply Restricted-over-Allowed precedence when a flex/grid child can contain descendants.
- Keep coordinate conversion, raw proposal, optional adjustment, preview, and commit separable and testable. Future snapping or alignment must be able to adjust proposed geometry without replacing the gesture lifecycle or bypassing `node.updateStyles`.
- Verify missing, inherited, explicit-zero, resolved-zero, and nonzero translation separately. Resolved zero must emit no translation; nonzero translation must exercise stacking contexts and containing blocks, including roots, containers, fixed/sticky descendants, nested transformed nodes, z-index, overlays, hit testing, and overflow.
- Verify future individual `rotate` and `scale` values and controlled `transform` output compose in the approved CSS order without changing the meaning or stored representation of `positionOffset`.
- Persisted and committed `positionOffset` must flow through `resolveResponsiveStyles`, `compileStyleValues`, and the shared semantic node renderer in Canvas and Preview. Do not add Canvas-only positioning CSS, a Canvas-only translation algorithm, or editor-only committed transform behavior.
- Transient gesture preview is intentionally editor-only state, but it must use the same style-change preview/compiler path and produce the same computed translation as committing the identical changes. It must not become a second persisted rendering contract.
- Every future Published renderer must reuse the same persisted responsive resolution and style compilation contract. Because Published output does not exist in V1, record this as a future blocking publishing gate and do not claim Preview/Published runtime verification in this feature.
- Execute every row in the mandatory rendered scenario matrix. CP-09 core failures block release; CP-09A failures restrict only the affected root/container-capable categories.
- Verify version-1 hydration, current-version round trips, future-version rejection, and atomic failure behavior.
- Run focused style, migration, command, visual-editing, Inspector, Canvas, editor-shell, rendering, and preview suites before the complete repository matrix.
- Update `Project.md` only after implementation and rendered behavior are verified. Record proposals and unresolved decisions in the feature workspace until then.
- Project-owner approval is required before changing lifecycle from draft to approved or beginning implementation.

## Risks, rollback, and containment

- **Gesture ambiguity:** users may reposition when they intended to reorder. Keep the selected positioning affordance distinct from the structural drag handle, make gesture ownership mutually exclusive, and never infer visual-positioning intent from an unmodified drag of the semantic component body.
- **UX friction or invisibility:** a dedicated mode may add steps, a selected-node handle may crowd overlays, and a modifier may be undiscoverable or unavailable on touch. Select the primary affordance through CP-01A evidence and treat a modifier only as an optional accelerator unless an equivalent primary path exists.
- **Responsive breakage:** desktop offsets may cause tablet/mobile overlap. Preserve responsive inheritance, expose the active viewport and origin, and verify all three viewport layers.
- **Unrecoverable off-canvas nodes:** a large or inherited offset can move a component beyond the artboard. Keep Layers selection independent of Canvas geometry, preserve breadcrumb path continuity, expose the responsible responsive origin, and provide an Inspector recovery reset that does not depend on clicking the component.
- **Canvas/Preview mismatch:** editor-only transforms can produce false confidence. Compile offsets only through the shared style compiler and compare computed geometry in both surfaces.
- **Future Published mismatch:** publishing is not implemented, so V1 cannot exercise Published parity. Preserve the shared semantic-renderer contract and make Canvas/Preview/Published parity a blocking gate for the future publishing feature rather than inventing evidence now.
- **Transform collision and ordering:** an arbitrary transform string would make later rotate/scale composition fragile, while individual properties still have a defined composition order. Persist offsets independently, verify `translate -> rotate -> scale -> transform` behavior, and block implementation if supported browsers or component-authored transforms cannot preserve the contract.
- **Transform layout side effects:** any non-`none` translation creates a stacking context and containing block, even at an identity value. Restrict root nodes, containers, or absolute-positioned elements when fixed/sticky descendants, z-index, hit-testing, or overflow cannot be preserved as approved.
- **Container blast radius:** moving one container can alter the coordinate and stacking behavior of an entire subtree. Keep roots and container-capable wrappers default-denied, require CP-09A before enabling each category, and ship the verified non-container scope if the high-risk gate fails.
- **Premature extensibility:** building a snapping framework in V1 would increase scope, but a closed gesture helper would force a rewrite later. Define and test only the coordinate/proposed-geometry adjustment seam; keep all snapping, guide, alignment, and distribution behavior excluded.
- **Eligibility drift:** root placement, parent layout, position style, capability, visibility, and lock state overlap and can change responsively. Centralize the approved precedence rules and test every matrix row rather than scattering UI-only conditionals.
- **Schema rollback:** once a newer schema document is written, an older build rejects it as future data. Validate the migration and full feature before enabling writes; after release, prefer roll-forward correction over reverting the reader.
- **Reset corruption:** treating zero as inheritance or deleting the wrong layer can change responsive output. Add explicit reset semantics and test base, tablet, and mobile independently.
- **History flooding:** pointer movement could create one command per frame. Keep frames preview-only and commit one grouped transaction at gesture completion.
- **Interaction regression:** positioning overlays can block links, inputs, text editing, selection, or structural drops. Exercise interactive primitives and ensure editor controls remain outside semantic renderer markup.
- **Performance regression:** geometry measurement on every pointer event can rerender the editor. Reuse measured artboard-relative rectangles, batch previews, and add bounded render/interaction assertions if profiling shows risk.
- If a gate fails, stop at the last passing item, record the blocker in the eventual branch journal, disable the new affordance, and keep existing structural movement behavior. Destructive Git rollback is not authorized.

## Completion

The feature is complete only when CP-01 and CP-01A are approved; the existing-convention responsive schema, zero-output rule, central eligibility matrix, recovery path, reusable geometry boundary, transform-composition contract, and semantic-renderer parity rule are implemented; old and new documents hydrate safely; the selected pointer, touch, and keyboard positioning paths are accessible; structural drag-and-drop is unchanged; the core rendered scenario matrix passes; every off-canvas core scenario succeeds without Canvas clicking; Canvas and Preview committed positions and transform side effects match across all viewports; existing `positionOffset` values remain independently interpretable alongside future transform properties; one gesture produces one undoable transaction; and the complete repository verification matrix passes. CP-09A must record a decision for every high-risk category, but a restricted outcome does not block completion: roots and failing container-capable categories remain disabled while verified non-container flex/grid positioning ships. Published runtime parity is deferred as a mandatory gate of the future publishing feature because Published output does not exist in V1.

Publish an implementation report with exact verification evidence. Promote only verified durable style, migration, command, and interaction behavior into `Project.md`. After accountable review and completion, archive the feature and branch workspaces according to the workspace rules; do not archive or delete them automatically.
