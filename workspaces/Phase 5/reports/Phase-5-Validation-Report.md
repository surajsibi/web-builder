---
doc_id: WEB-BUILDER-PHASE-5-VALIDATION
type: D5
scope: Web builder Phase 5 visual resizing, spacing editing, flex and grid controls, uniform border, responsive decorative images and two-color linear gradients, Link text decoration, reusable effects, component-preview parity, Inspector groups, editor overlays, responsive behavior, and validation evidence
authority: Derived implementation report; Project.md and the approved Phase 5 architecture proposal own intent, while the linked source, tests, and runtime exercise own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against 26 test files and 265 tests, final focused component-library tests, TypeScript, ESLint, the production build, and rendered Chrome Library/Canvas/Preview parity plus non-Button Card effects on 2026-08-11; earlier Phase 5 evidence remains recorded; invalidated by changes to any linked implementation, test, Project.md, or Phase 5 decision
---

# Phase 5 validation report

## Outcome

Phase 5 is implemented and ready for review. The editor now provides professional direct manipulation, the approved layout controls, complete uniform border authoring, one responsive background layer on Section, Container, and Card, responsive Link text decoration, and component-agnostic Effects. Every component can author responsive multi-shadow and backdrop-blur values through the same shared schema, resolver, command, compiler, Canvas, and Preview path. Component Library previews that show an authored look now resolve the actual template and compiler output instead of maintaining parallel Button CSS. The background layer can be a safe decorative image or a requested two-color linear gradient with independent color opacity and angle. Link decoration is a closed none/underline/overline/line-through value inside the existing shared style pipeline. Existing command kinds, hydration versioning, history/store shape, placement, and registry capabilities remain frozen. Later user-approved refinements added root-only dynamic viewport fill, context-dependent visual resize conversion, and a bounded Container-presentation correction without changing the responsive cascade. Post-validation Inspector corrections keep text content visible directly above collapsed Typography controls, populate Font family with eight local/web-safe stacks while preserving existing custom values, keep native color controls mounted during continuous picker input, add per-color opacity, apply valid Padding and Margin numeric changes immediately, give newly inserted Headings an explicit zero margin, display absent spacing sides as `0px`, add uniform border and universal Effects controls, add image and gradient controls to the existing Background disclosure, and expose Text decoration only for Link.

A later Preview parity correction advances Container to component version 2. New Containers fill their parent at wide runtime sizes, and hydration converts only the former hidden `72rem` version-1 maximum to `100%`; other explicit maximum widths remain unchanged.

Delivered behavior:

- East, south, and south-east Canvas resize handles on editable sizing-capable nodes.
- Local pointer and keyboard resize previews followed by one final existing `node.updateStyles` command.
- Context-dependent resize commits that preserve explicit units, use parent-content-box percentages for first normal-flow semantic width resizes, and keep first height resizes in pixels.
- Absolute/fixed positioned first width resizes remain pixels; semantic widths within one percentage point of the parent snap back to `fill`.
- Resize values retain a zero floor and 24 px interaction targets.
- Inspector and Canvas padding/margin editing, with shared Axes controls for paired X/Y edits, All controls for four independent sides, editor-only bands, and responsive-layer commits.
- New Headings persist an explicit zero margin, so rendered browser spacing and the Inspector's Margin X/Y values both start at 0.
- Any absent padding or margin side displays as 0 px in Axes and All modes; the document remains unchanged until the user edits that control.
- Valid Inspector padding and margin numeric changes repaint the Canvas on each change event; blank or non-finite drafts remain local, blur does not duplicate an already-applied change, and the active input retains focus for consecutive spinner steps.
- Container-level Block, Flex, and Grid controls using only fields in the existing style schema.
- Flex direction, wrap, justification, alignment, and gap controls.
- Grid columns, optional rows, column/row gap, justification, and alignment controls.
- Registry-driven Content, Sizing, Spacing, Layout, Typography, Background, Border, and Position sections. Text-bearing Content stays visible with a multiline **Text content** editor and Typography directly below it; other Content sections and every style group remain collapsed by default.
- Sizing exposes only Width and Height; min/max values remain document-compatible but are not editable in the Inspector.
- Width and height distinguish Fill page from Fill parent; page-root height additionally supports Fill viewport as a growable `100dvh` runtime minimum.
- General numeric controls author only px, %, rem, and em; existing raw vw/vh values remain visible but cannot be newly authored.
- Typography, background color, uniform border style/width/color/radius, position, and z-index controls where the finalized component matrix permits them. Font family shows eight preset stacks, uses Inter as the inherited non-persisted display default, and retains an existing custom value as a selectable option.
- Link Typography includes responsive Text decoration choices for None, Underline, Overline, and Line through; new Links store Underline explicitly and other typography-capable components omit the control.
- Every component exposes a responsive Effects group with zero to four ordered inset/outer shadows and one nonnegative backdrop-blur length.
- Button visual presets express raised, glass, and glow looks through the generic style contract; Solid primary uses the Button registry default.
- Rendered Component Library previews use resolved component/block templates and the shared compiler. Their wrapper provides only a neutral surface, clipping, scale, and pointer suppression.
- One safe HTTPS or root-relative decorative background image on Section, Container, and Card, with Cover/Contain/Auto sizing, horizontal and vertical position, repeat, replace, responsive removal, and independent background-color fallback.
- One two-color linear gradient on the same responsive background layer, with start/end color pickers and opacity, a 0-to-360-degree angle, image replacement, and explicit removal.
- Native text and background color pickers remain active across continuous color updates instead of remounting after the first value.
- Text, background, and border colors expose a 0–100% opacity slider for hex and `transparent` values; sub-100% choices persist as eight-digit hex while whole-element opacity remains unchanged.
- Unsupported custom color strings remain editable and are preserved unchanged; their opacity slider is disabled instead of performing a lossy conversion.
- Flex, grid, block, padding, and margin guides that never enter props, styles, project state, hydration, or rendered semantic output.
- New Containers with zero vertical padding and responsive horizontal gutters of 24 px at Desktop, 20 px at Tablet, and 16 px at Mobile.
- A 48 px editor-only minimum for empty auto-height Containers that disappears after child insertion and does not enter persisted or published styles.
- Cancellation, page/selection/viewport changes, drag start, and invalid edits leave preview state out of the document and history.
- Two hundred sixty-five passing behavior-focused tests across twenty-six files, plus the final affected component-library suite, clean TypeScript, clean ESLint, and a production build. Rendered Chrome evidence confirms all eight Button looks across Library, Canvas, and final Preview, plus shared Card effects and mobile inheritance, in addition to earlier Phase 5 evidence.

No publishing, backend, authentication, persistence service, database, AI, template, block, asset, deployment, or advanced Canvas feature was started.

Primary sources:

- [Project architecture](../../../Project.md)
- [Phase 5 architecture proposal](../plan/Phase-5-Architecture-Proposal.md)
- [Visual-editing change builders](../../../src/builder/ui/visual-editing.ts)
- [Editor Shell](../../../src/builder/ui/editor-shell.tsx)
- [Editor Canvas](../../../src/builder/ui/editor-canvas.tsx)
- [Inspector](../../../src/builder/ui/inspector-panel.tsx)
- [Style contract and compiler](../../../src/builder/styles/types.ts)
- [Style validation](../../../src/builder/styles/schema.ts)
- [Style command executor](../../../src/builder/commands/execute-command.ts)
- [Rendering controller](../../../src/builder/rendering/node-rendering-controller.tsx)
- [Component definitions](../../../src/builder/registry/components/component-definitions.tsx)
- [Button preset templates](../../../src/builder/registry/blocks/button-preset-blocks.ts)
- [Component Library](../../../src/builder/ui/component-library.tsx)
- [Editor styles](../../../src/app/globals.css)

## Scope and versions

| Item | Value |
| --- | --- |
| Workspace | Web builder local workspace |
| Project schema | Version 1; unchanged |
| Component schemas | Version 1 for Section, Heading, Text, Card, and Link; version 2 for Container and Button |
| Responsive dimensions | Additive semantic `viewport` mode; no project or component schema-version bump |
| State | Zustand 5.0.14; persisted store shape unchanged |
| Runtime | Next.js 16.3.0, React 19.2.8, TypeScript 5.9.3, Zod 4.4.3 |
| Implemented route | `/` renders the Phase 5 editor |
| Persistence | In-memory browser state only |
| Deployment | Not deployed |
| Git revision | Unavailable because the supplied workspace is not a Git worktree |

The approved P5-D1 through P5-D10 resolutions are recorded in the [architecture proposal](../plan/Phase-5-Architecture-Proposal.md). Reset/unset controls are intentionally deferred.

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| Visual-editing model | [visual-editing.ts](../../../src/builder/ui/visual-editing.ts) | Defines supported units, session/overlay types, shared Axes/All spacing-side resolution, context-dependent unit-preserving resize conversion, inheritance-safe spacing changes, layout defaults, and pure preview compilation |
| Rendering seam | [node-rendering-controller.tsx](../../../src/builder/rendering/node-rendering-controller.tsx) | Optionally composes editor preview CSS after canonical responsive compilation; default runtime rendering remains unchanged |
| Shell session | [editor-shell.tsx](../../../src/builder/ui/editor-shell.tsx) | Owns a local reducer and session ref, property-specific Axes/All spacing scope, preview map, cancel/reset lifecycle, and one-command final commit adapter |
| Canvas overlays | [editor-canvas.tsx](../../../src/builder/ui/editor-canvas.tsx) | Measures semantic roots, parent content boxes, font/viewport unit bases, and definite parent-height chains; renders resize handles, spacing bands/handles, and layout guides outside authored nodes; spacing handles honor the active property's Axes/All scope |
| Container defaults and migration | [component-definitions.tsx](../../../src/builder/registry/components/component-definitions.tsx) | Gives new Containers zero vertical padding, responsive 24/20/16 px horizontal gutters, and a visible `100%` maximum; version-1 hydration replaces only the former hidden `72rem` default |
| Heading defaults | [component-definitions.tsx](../../../src/builder/registry/components/component-definitions.tsx) | Gives new Headings a complete zero margin so the browser, compiled style model, and Inspector expose the same initial spacing |
| Inspector | [inspector-panel.tsx](../../../src/builder/ui/inspector-panel.tsx) | Renders groups in canonical order from registry capabilities and prop metadata; Sizing contains only contextual Width and Height controls; native color controls preserve their active element, synchronize committed values, and expose per-color opacity; spacing controls display absent sides as 0 px and apply valid changes immediately; Border exposes style, dedicated nonnegative width units, color/opacity, radius, None preservation, and atomic visible defaults; Background exposes atomic image and two-color linear-gradient controls on eligible containers; Link alone exposes responsive Text decoration inside Typography |
| Responsive sizing | [types.ts](../../../src/builder/styles/types.ts), [schema.ts](../../../src/builder/styles/schema.ts), [compile.ts](../../../src/builder/styles/compile.ts) | Adds the semantic viewport dimension, validates it, and compiles root viewport height as `height: auto` with a growable `100dvh` minimum |
| Uniform border contract | [types.ts](../../../src/builder/styles/types.ts), [schema.ts](../../../src/builder/styles/schema.ts), [resolve.ts](../../../src/builder/styles/resolve.ts), [compile.ts](../../../src/builder/styles/compile.ts) | Adds optional flat width/style/color fields, validates a closed style/unit set, preserves responsive field-level inheritance, and compiles the four uniform border properties |
| Background layer contract | [types.ts](../../../src/builder/styles/types.ts), [schema.ts](../../../src/builder/styles/schema.ts), [resolve.ts](../../../src/builder/styles/resolve.ts), [compile.ts](../../../src/builder/styles/compile.ts) | Extends the existing atomic background-image union with a safe two-color linear-gradient variant, clones it across responsive layers, and compiles exact shared editor/preview CSS |
| Link decoration contract | [types.ts](../../../src/builder/styles/types.ts), [schema.ts](../../../src/builder/styles/schema.ts), [resolve.ts](../../../src/builder/styles/resolve.ts), [compile.ts](../../../src/builder/styles/compile.ts) | Adds the closed optional `textDecoration` value, validates none/underline/overline/line-through, cascades it across responsive layers, and compiles the same CSS for editor and Preview |
| Effects contract | [types.ts](../../../src/builder/styles/types.ts), [schema.ts](../../../src/builder/styles/schema.ts), [resolve.ts](../../../src/builder/styles/resolve.ts), [compile.ts](../../../src/builder/styles/compile.ts) | Adds optional ordered `boxShadow` and `backdropBlur` values, validates bounded units/counts, replaces shadow lists atomically across responsive layers, supports an empty-list reset, and compiles the same CSS for every renderer |
| Component-preview parity | [component-library.tsx](../../../src/builder/ui/component-library.tsx), [button-preset-blocks.ts](../../../src/builder/registry/blocks/button-preset-blocks.ts), [component-definitions.tsx](../../../src/builder/registry/components/component-definitions.tsx) | Resolves the real component or block template for each rendered thumbnail; thumbnail CSS no longer owns duplicate Button visuals, while semantic icon motion reuses the shared markup and selector |
| Style commands | [execute-command.ts](../../../src/builder/commands/execute-command.ts) | Extends the existing `node.updateStyles` property allowlist for uniform borders and text decoration; candidate hydration, atomic commit, locks, history, Undo, and Redo remain the existing paths |
| Presentation | [globals.css](../../../src/app/globals.css) | Adds collapsible Inspector groups, compact value/unit fields, accessible color-opacity rows, link controls, handles, bands, flex/grid/block guides, and responsive Canvas-height variables |
| Pure behavior tests | [visual-editing.spec.ts](../../../src/builder/ui/__tests__/visual-editing.spec.ts) | Covers unit preservation, percentage conversion, positioned fallback, fill snapping, height validity, resize clamping, preview isolation, responsive spacing changes, missing-spacing initialization, and layout defaults |
| Integrated UI tests | [phase-five-editor.spec.tsx](../../../src/builder/ui/__tests__/phase-five-editor.spec.tsx) | Covers visible multiline text content followed immediately by collapsed Typography, populated font-family presets/default/selection/custom-value preservation, Link-only text decoration/default/render/history behavior, capability order, border defaults/atomic initialization/None preservation/color opacity/units/Undo, background-image and gradient controls, two-control Sizing, root-only viewport fill, active color-picker continuity, content-box percentage resizing, cancellation, one-entry history, Heading zero margins, absent-spacing zero display, immediate Padding/Margin feedback, Inspector and Canvas Axes/All scope, overlays, layout guides, flex/grid, and atomic prop rejection |
| Effects and parity tests | [schema.spec.ts](../../../src/builder/styles/__tests__/schema.spec.ts), [resolve.spec.ts](../../../src/builder/styles/__tests__/resolve.spec.ts), [compile.spec.ts](../../../src/builder/styles/__tests__/compile.spec.ts), [component-library.spec.tsx](../../../src/builder/ui/__tests__/component-library.spec.tsx), [preview-shell.spec.tsx](../../../src/builder/preview/__tests__/preview-shell.spec.tsx) | Covers invalid effects, responsive atomic replacement/reset, exact CSS, all eight real-template thumbnails, generic non-Button command/Inspector behavior, and final Preview output |
| Architecture state | [Phase 5 proposal](../plan/Phase-5-Architecture-Proposal.md), [workspace](../workspace.md) | Records approved decisions, completed implementation, evidence, and review status |

The P5-D7 and P5-D9 implementations change the existing style-property allowlist in `src/builder/commands/execute-command.ts`; neither adds or alters a command kind, transaction, lock rule, history behavior, store field, or placement rule. Production hydration code remains unchanged because the optional fields are accepted through the extended shared style schema. Registry changes include the previously approved Container default spacing and Heading default margin plus an explicit underline default for newly inserted Links; capability assignments do not change. Responsive resolution keeps its existing field-level cascade and merges the new optional border and text-decoration fields.

## Final visual-editing flow

~~~text
Pointer or keyboard gesture
  -> EditorShell-local visual-editing reducer
  -> VisualEditSession { nodeId, non-empty StyleChange[] }
  -> previewStyleForChanges(node.styles, viewport, changes)
  -> NodeRenderingController optional preview composition
  -> semantic node repaints
  -> ResizeObserver remeasures Canvas overlays

Gesture cancel
  -> clear local session
  -> canonical compiled styles repaint
  -> no command, document mutation, dirty transition, or history entry

Gesture commit
  -> clear local session
  -> dispatchEditorCommand(node.updateStyles)
  -> existing executor validation and isolated candidate hydration
  -> existing atomic store commit
  -> one commit ID, one history snapshot, dirty state
  -> existing Undo/Redo restores the complete document snapshot
~~~

Inspector controls do not use the live preview session for ordinary form edits. Valid Padding and Margin numeric drafts commit through one `node.updateStyles` command per change event so the Canvas repaints immediately; blur does not repeat the latest committed value. Other valid drafts retain their existing change-or-blur behavior. Invalid or incomplete drafts remain local or are rejected by the existing executor without mutation.

## Final Inspector capability matrix

Selection is always visible for a selected node and intentionally contains only the Name and Type cards. For Heading, Text, Link, and Button, the complete registry-driven Content section stays visible, its `text` field is a multiline **Text content** editor, and the eligible collapsed Typography group appears immediately afterward. These text-bearing components then show Sizing, Spacing, Layout, Background, Border, and Position as applicable. Components without a `text` field retain a collapsed Content group followed by their eligible style groups. Ancestry remains available through Canvas breadcrumbs and Layers, while lock state remains represented by disabled controls and the lock notice. Content is derived from `definition.inspector.props`; style groups remain gated by the frozen registry keys and collapsed by default.

| Component | Content | Sizing | Spacing | Layout | Typography | Background | Border | Position |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Section | Element, Anchor ID | Yes | Yes | Yes | No | Yes | Yes | Yes |
| Container | Element | Yes | Yes | Yes | No | Yes | Yes | Yes |
| Card | Element | Yes | Yes | Yes | No | Yes | Yes | Yes |
| Heading | Text, Level | Yes | Yes | No | Yes | No | No | Yes |
| Text | Text, Element | Yes | Yes | No | Yes | No | No | Yes |
| Link | Text, Link, Open in new tab | Yes | Yes | No | Yes | Yes | Yes | Yes |
| Button | Text, Link, Open in new tab | Yes | Yes | No | Yes | Yes | Yes | Yes |

The user-facing Position label maps to the frozen registry capability key `positioning`. No registry vocabulary, capability assignment, prop schema, or renderer contract changed; the default changes are limited to Container responsive spacing, Heading margin, and Link underline.

## Control surface

| Group | Implemented fields | Important behavior |
| --- | --- | --- |
| Selection | Name and Type | Compact two-card summary; Parent and State cards are intentionally omitted |
| Content | Every explicit registry prop field and control type | Text-bearing content stays visible, labels `text` as **Text content**, and uses a multiline editor; other Content sections remain collapsed; all changes commit complete props objects and component Zod schemas remain authoritative |
| Sizing | Width and height only | Fill means page for roots and parent for nested nodes; root height also offers growable Fill viewport; Fit, Auto, and Fixed remain available; direct resize preserves explicit units and otherwise chooses responsive width or pixel height by context; min/max and reset/unset are not exposed |
| Spacing | Padding or Margin X/Y, or top/right/bottom/left | Axes pairs X with left/right and Y with top/bottom in both Inspector and Canvas edits; All edits the selected side independently; margin retains `auto` and negative values; Canvas pointer edits commit px |
| Layout | Display Block/Flex/Grid and existing flex/grid container fields | Container-capable components only; switching modes initializes a complete config only when absent |
| Typography | Text color, family, size, weight, line height, letter spacing, alignment; Link also has text decoration | Typography-capable leaf components; decoration is Link-only and offers None, Underline, Overline, and Line through |
| Background | Background color and opacity | Keeps current schema string semantics; `transparent` maps to 0%, hex alpha is stored in eight-digit notation below 100%, and unsupported custom strings disable opacity without being rewritten |
| Border | Style, uniform width/unit, color/opacity, radius/unit | None keeps width and color readable but disabled, radius remains editable, and enabling a visible style atomically supplies missing `1px` and black defaults |
| Position | Position and z-index | Supports existing position enum and `auto`/numeric z-index |

## Resize architecture

- Handles are external buttons in the Canvas interaction overlay; semantic nodes do not become draggable or resizable controls.
- Eligible selected nodes expose east, south, and south-east handles when unlocked, not during drag, and when the registry grants Sizing.
- Pointer start captures the original DOM border-box width/height so ResizeObserver updates cannot accumulate deltas incorrectly.
- Canvas measurement records the containing parent's content-box dimensions, selected font size, root font size, browser viewport bases, and whether the parent-height chain is definite.
- Existing fixed px, %, rem, em, vw, and vh dimensions preserve their unit when the required basis is valid.
- A first `fill`, `fit`, or `auto` width resize in static, relative, or sticky flow stores a percentage of parent content width, rounded to two decimals.
- A first semantic width resize under absolute or fixed positioning stores px. A first semantic width within one percentage point of 100% stores `fill`.
- A first height resize stores px. Existing percentage height remains percentage only with a definite parent height; invalid percentage height falls back to px.
- Pointer movement clamps the rendered target to a zero-pixel equivalent; stored px is integral and stored relative units use at most two decimals.
- The visible control is smaller than its 24 px interaction target, provided by a pseudo-element.
- Keyboard arrows preview 1 px changes; Shift+Arrow previews 10 px; Enter commits; Escape cancels.
- Pointer completion commits the exact final preview in one `node.updateStyles` command.
- The active responsive layer remains authoritative: Desktop writes base, Tablet writes tablet, and Mobile writes mobile; one gesture never writes multiple layers.

## Spacing architecture

- Canvas measurement captures computed padding and margin in pixels for accurate guide placement.
- Padding bands render inside the border box; margin bands render outside it.
- Each side has an accessible external button and a side-specific drag direction.
- Canvas handles read the same property-specific scope as the Inspector: Axes mirrors the dragged value to the opposite side, while All updates only the dragged side.
- Padding clamps to 0 px; margin permits negative values supported by the frozen schema.
- When spacing already resolves, the change builder emits only field-level targets, preserving responsive inheritance.
- When no spacing value resolves at any inherited layer, the builder creates the required complete four-side value once, with untouched sides at 0 px.
- Padding and Margin Axes edits emit one non-empty paired batch for one command and one history entry; All emits only the independently edited side.
- Each valid numeric change dispatches its Axes or All batch immediately and retains the input element across the resulting render; blank and non-finite drafts do not dispatch.
- Opposite handles use offset anchors so shallow/empty nodes cannot make top/bottom or left/right controls collide.

## Flex and grid architecture

Flex and Grid remain container-level capabilities only, as approved in P5-D2.

Flex exposes:

- Direction: row, column, row-reverse, column-reverse.
- Wrap: nowrap, wrap, wrap-reverse.
- Justify content: flex-start, center, flex-end, space-between, space-around, space-evenly.
- Align items: stretch, flex-start, center, flex-end, baseline.
- Gap with approved units.

Grid exposes:

- Positive integer columns.
- Optional positive integer rows; returning rows to automatic is deferred with reset/unset.
- Column and row gaps with approved units.
- Justify items and align items: start, center, end, stretch.

The existing compiler remains authoritative: flex configuration compiles only when `display` is `flex`; grid configuration compiles only when `display` is `grid`. The Inspector never authors `display: none`; visibility remains the existing hide/show behavior.

## Validation and frozen-boundary rules

| Rule | Phase 5 UI behavior | Existing authoritative defense |
| --- | --- | --- |
| Locked node | Disables Inspector controls and suppresses resize/spacing handles | Command executor rejects locked updates |
| Non-finite draft | Remains uncommitted | Command JSON and style validation reject invalid values |
| Resize minimum | UI clamps rendered width/height to a zero-pixel equivalent before unit conversion | Existing schema remains unchanged |
| Normal-flow width resize | First semantic resize stores parent-content-box percent; near 100% snaps to `fill` | Existing DimensionValue accepts `%` and `fill` |
| Positioned width resize | First semantic resize under absolute/fixed position stores px | Existing DimensionValue accepts px |
| Explicit resize unit | Preserved through px conversion when its CSS basis is valid | Existing DimensionValue unit vocabulary remains unchanged |
| Percentage height | Preserved only when the parent-height chain is definite; otherwise stores px | Existing DimensionValue validation remains authoritative |
| Padding minimum | UI clamps Canvas and Inspector padding to 0 | Existing schema remains unchanged |
| Grid track count | UI rounds and clamps to positive integers | Existing style schema validates positive integers |
| Unsupported new unit | New controls offer only px, %, rem, em | Existing schema still accepts persisted vw/vh |
| Viewport fill | Offered only for page-root height | Semantic viewport mode compiles to `min-height: 100dvh`; Canvas preview substitutes the active artboard-height variable |
| Complete nested config | Mode switch supplies a full default only when absent | Candidate hydration validates resolved complete styles |
| Responsive inheritance | Existing nested values use field-level changes | Existing updateStyles executor applies the active viewport patch |
| Invalid props combination | UI submits complete props; result is announced as rejected | Component props schema rejects atomically |
| Preview isolation | Preview is React-local CSS only | Project/store/history never receive preview state |
| Gesture atomicity | One final non-empty change batch | Existing transaction, hydration, and history pipelines remain unchanged |
| Drag interaction | Starting a drag resets visual mode/session | Existing drag session and target validation remain unchanged |

No new command was required. Phase 5 uses only the existing `node.updateProps` and `node.updateStyles` paths.

## Test coverage

The final full suite contains twenty-six passing files and two hundred sixty-five passing tests. After the final optional library-search typing guard, the affected Component Library suite passes six tests; TypeScript, ESLint, and the production build also pass against the final files.

| Test file | Behavior validated |
| --- | --- |
| [execute-command.spec.ts](../../../src/builder/commands/__tests__/execute-command.spec.ts) | Page/node command results, atomic validation, structural locks, update props/styles including responsive border batches, complete safe image/gradient writes, and generic Card effects, invalid rejection, move/remove/duplicate behavior, IDs, selection, and typed results |
| [hydration.spec.ts](../../../src/builder/project/__tests__/hydration.spec.ts) | Schema/version gates, migrations, optional border and background-layer compatibility, parent index, placement, global IDs, and atomic invalid-document rejection |
| [component-registry.spec.tsx](../../../src/builder/registry/__tests__/component-registry.spec.tsx) | Current definitions, defaults including Link underline, responsive styles, child rules, Inspector capabilities, placement, icons, and semantic render roots |
| [define-component-registry.spec.tsx](../../../src/builder/registry/__tests__/define-component-registry.spec.tsx) | Registry startup rejection for broken types, references, capabilities, defaults, versions, and migrations |
| [node-rendering-controller.spec.tsx](../../../src/builder/rendering/__tests__/node-rendering-controller.spec.tsx) | Recursive semantic rendering, viewport resolution, compiled styles, root registration, classes, and empty-container slots |
| [builder-store.spec.ts](../../../src/builder/store/__tests__/builder-store.spec.ts) | Hydration, command commits/no-ops/failures, history grouping, Undo/Redo, dirty state, selection/page/viewport, and drag-session isolation |
| [compile.spec.ts](../../../src/builder/styles/__tests__/compile.spec.ts) | Controlled conversion from resolved values to React CSS, including exact text decoration, quoted image and two-color linear-gradient output, explicit `none`, uniform borders, multiple shadows, backdrop blur, conditional flex/grid, and growable viewport dimensions |
| [resolve.spec.ts](../../../src/builder/styles/__tests__/resolve.spec.ts) | Desktop/tablet/mobile inheritance, text-decoration cascade, atomic image/gradient and shadow-list cascade/cloning, border-field cascade, and nested override resolution |
| [schema.spec.ts](../../../src/builder/styles/__tests__/schema.spec.ts) | Responsive style acceptance/rejection, the closed text-decoration enum, complete safe image sources/configurations, safe gradient angles/colors, border/effect constraints, JSON-safe constraints, and viewport-dimension acceptance |
| [drag-and-drop.spec.ts](../../../src/builder/ui/__tests__/drag-and-drop.spec.ts) | Frozen drop translation, placement, locks, cycles, no-ops, root/sibling/inside movement, history, and Undo/Redo |
| [editor-breadcrumbs.spec.tsx](../../../src/builder/ui/__tests__/editor-breadcrumbs.spec.tsx) | Root-to-selection breadcrumb order, current state, and ancestor activation |
| [editor-shell.spec.tsx](../../../src/builder/ui/__tests__/editor-shell.spec.tsx) | Shell, click insertion, selection, responsive Inspector editing, responsive Container gutters, editor-only empty geometry, shortcuts, duplication, deletion, and history regressions |
| [insertion-target.spec.ts](../../../src/builder/ui/__tests__/insertion-target.spec.ts) | Click insertion derivation, container insertion, sibling fallback, and placement rejection |
| [layers-panel.spec.tsx](../../../src/builder/ui/__tests__/layers-panel.spec.tsx) | Recursive Layers tree, selection, metadata, hidden/locked state, collapse, and handles |
| [phase-two-validation.spec.tsx](../../../src/builder/ui/__tests__/phase-two-validation.spec.tsx) | Retained page/node/selection/history validation harness |
| [tree-navigation.spec.ts](../../../src/builder/ui/__tests__/tree-navigation.spec.ts) | Breadcrumb, parent-target, and duplicate-destination derivation without mutation |
| [visual-editing.spec.ts](../../../src/builder/ui/__tests__/visual-editing.spec.ts) | Normal-flow percentage width, positioned pixel width, preservation of px/%/rem/em/vw/vh, fill snapping, valid/invalid percentage height, zero clamp, isolated responsive preview, spacing inheritance, and flex/grid defaults |
| [phase-five-editor.spec.tsx](../../../src/builder/ui/__tests__/phase-five-editor.spec.tsx) | Exact capability matrix; universal non-Button Effects authoring/rendering; Link-only decoration/default/render/history behavior; background-image and gradient add/configure/replace/remove, responsive `none`, validation, locks, and history; border behavior; text-first content; group order; sizing; spacing; color continuity; pointer/keyboard resizing; flex/grid/guides; and atomic rejection |
| [component-library.spec.tsx](../../../src/builder/ui/__tests__/component-library.spec.tsx) | Search and discoverability plus all eight Button thumbnails rendering the same compiled template styles they insert |
| [preview-shell.spec.tsx](../../../src/builder/preview/__tests__/preview-shell.spec.tsx) | Preview hydration and semantic rendering through the shared compiler, including complete image, linear-gradient, Card shadow, and backdrop-blur CSS |

The `test-case-writer` behavior-first rules influenced the Phase 5 additions: outcome-oriented names, arrange/act/assert structure, accessible role/label queries, pure change-builder coverage, real store integration, and explicit success, cancellation, edge, history, and rejection paths.

## Verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Dynamic viewport compiler and editor integration | `pnpm test -- src/builder/styles/__tests__/compile.spec.ts src/builder/ui/__tests__/phase-five-editor.spec.tsx` on 2026-08-10 | Pass: 2 files, 13 tests; runtime compilation emits `100dvh` and the Canvas retains its artboard substitution | Published runtime behavior was not manually re-exercised in a mobile browser during this follow-up |
| Heading default margin | `phase-five-editor.spec.tsx`, `component-registry.spec.tsx`, targeted ESLint, and Chrome computed-style/Inspector inspection on 2026-08-10 | Pass: affected suites contain 24 passing tests; a new Heading renders 0 px on all four margins and its Margin X/Y inputs both show 0 | Existing stored Heading nodes are not migrated; the explicit default applies to newly inserted Headings |
| Missing spacing display | Focused `phase-five-editor.spec.tsx` regression plus live Chrome inspection of the existing Heading and Card from the reported screenshots on 2026-08-10 | Pass: Heading Padding X/Y and Card Margin X/Y each show 0 instead of blank; All mode uses the same fallback for every absent side | The 0 px value is presentational until edited, preserving the existing responsive style document and complete-four-side commit behavior |
| Text-first Inspector content | Focused `phase-five-editor.spec.tsx` and `editor-shell.spec.tsx` tests plus rendered Chrome DOM/layout inspection on 2026-08-10 | Pass: Heading Content is visible; **Text content** is a textarea; collapsed Typography immediately follows it; editing to `Hero title` updates the Canvas and announces the existing complete-props command result | Inline Canvas text editing remains out of scope; text commits retain the existing blur behavior |
| Padding/Margin Inspector corrections | Focused `phase-five-editor.spec.tsx` and `editor-shell.spec.tsx` tests plus Chrome DOM and rendered-layout inspection on 2026-08-10 | Pass: both properties expose only Axes and All; Axes shows X/Y; All shows four independent side controls; consecutive Padding Y and Margin X decrements repaint immediately and retain input focus | Margin retains `auto` units and negative values; the final lint-compatible draft synchronization adjustment was reverified by the focused automated regression after the browser exercise |
| Canvas spacing scope | Focused `phase-five-editor.spec.tsx` interaction tests plus the full automated suite on 2026-08-10 | Pass: in Axes mode a dragged padding handle commits the opposite side in the same command; in All mode the same Canvas gesture changes only the dragged side; each gesture creates one history entry | This follow-up was not manually re-exercised in Chrome |
| Color opacity control | `phase-five-editor.spec.tsx` plus rendered production Chrome exercise on 2026-08-10 | Pass: `#b33737` at 55% persisted as `#b337378c`; Canvas computed `rgba(179, 55, 55, 0.55)` while element opacity remained `1`; custom color strings disable the slider without mutation | Hex and `transparent` values are safely convertible; other CSS color syntaxes remain text-editable but do not expose opacity conversion |
| Uniform border support | Focused red/green schema, resolver, compiler, hydration, command, and editor specs plus Chrome against the production build on 2026-08-10 | Pass: 7 intended failures before implementation; 58 focused tests after implementation; default None uses disabled 0 px/black controls with editable radius; visible style initializes `1px solid #000000` in one Undo step; `3rem`, 55% hex-alpha color, and 20 px radius persist under None; Desktop None and Tablet Dotted remain isolated; preview compiles the same dashed `3rem`/color/radius CSS on the semantic Section | Capability gating, invalid direct commands, old-document hydration, and lock rejection are deterministic automated evidence; high zoom, screen reader, touch, and non-Chrome browsers were not manually exercised |
| Responsive background image | Focused red/green schema, resolver, compiler, hydration, command, Inspector, and preview specs on 2026-08-10 | Pass: 9 intended failures before implementation; 95 focused tests after implementation; safe complete sources/configurations compile to exact shared editor/preview CSS; unsafe and incomplete values reject atomically; Desktop images can be suppressed with Mobile `{ kind: "none" }`; Section, Container, and Card expose the controls while Button and Link remain color-only; locked controls do not mutate | Chrome showed the URL field, Add action, and decorative guidance, but Add/replace/remove rendering was not fully re-exercised because the development browser connection became unstable; uploads, semantic image content, overlays, touch, screen readers, and non-Chrome browsers remain unverified |
| Responsive linear gradient | Seven affected schema, resolver, compiler, hydration, command, Inspector, and preview specs plus Chrome on 2026-08-10 | Pass: 15 gradient-focused tests across seven files; safe complete values compile to exact shared editor/preview CSS; malformed colors, incomplete stops, and angles outside 0-360 reject; responsive values clone atomically; Inspector creation is one history entry; color/opacity/angle editing, lock state, image replacement, hydration, and preview pass. Chrome rendered a 135-degree purple-to-blue gradient on a 1120-by-96-pixel Section and updated it to a 90-degree orange-to-blue gradient. | Radial/multi-stop gradients, touch, screen readers, and non-Chrome browsers remain unverified. The only Chrome console error was the documented extension-injected body-attribute mismatch, not an application-authored error. |
| Font-family selector | Two focused `phase-five-editor.spec.tsx` interaction tests, the full automated suite, and rendered production Chrome exercise on 2026-08-10 | Pass: the visible selector shows eight presets with Inter as a non-persisted display default, applies Georgia through one history entry and to the Canvas heading, preserves an existing custom value, and produces no console error | Fonts unavailable on a client use the stored CSS fallback stack |
| Link text decoration | Five focused schema, resolver, compiler, registry, and integrated editor suites plus local Chrome on 2026-08-10 | Pass: 90 focused tests; schema accepts the four closed values and rejects unsupported input; responsive values cascade; exact CSS compiles; new Links default to Underline; only Link exposes the selector; Line through persists in one history entry and renders as inline and computed `line-through`; no console errors | Decoration color, thickness, style, offset, skip-ink, combined lines, screen readers, touch, and non-Chrome browsers remain unverified or out of scope |
| Reusable effects and component-preview parity | Eight focused style, command, registry, Library, integrated editor, and Preview suites plus live Chrome on 2026-08-11 | Pass: 131 focused tests; generic schema/command/responsive/compiler paths accept and render effects; every component exposes Effects; a Card renders authored shadow/blur and inherits them on Mobile; all eight Button looks have zero relevant computed-style differences between Library, Canvas, and final Preview | Generic hover/focus/active style authoring, screen readers, touch, and non-Chrome browsers remain out of scope or unverified |
| Full automated regression | `pnpm test -- --fileParallelism=false` on 2026-08-11 | Pass: 26 files, 265 tests; the final affected Component Library suite separately passes 6 tests after the optional search-term typing guard | Vitest prints a maintenance advisory about native Vite tsconfig path resolution |
| Static types | `pnpm typecheck` on 2026-08-11 | Pass | None observed |
| Lint | `pnpm lint` on 2026-08-11 | Pass with no warnings | Does not replace a full manual accessibility audit |
| Production compilation | `pnpm build` on 2026-08-11 | Pass: static `/` and `/_not-found`, plus the separately scoped dynamic `/preview` route, generated | Next warns about an unrelated parent-directory lockfile/root discovery |
| Empty Container presentation | Chrome Desktop/Mobile insertion and computed-geometry inspection on 2026-08-10 | Pass: Container, prompt, and selection are centered and 48 px high; Desktop gutters are 24 px, Mobile gutters are 16 px; inserting Text removes the inline minimum and restores a computed 0 px minimum | Tablet 20 px gutters are covered by the integrated UI test rather than this browser exercise |
| Native color-picker continuity | Chrome native color-surface drag with multiple intermediate values on 2026-08-10, plus the integrated active-element regression | Pass: the drag reached its destination value, the picker input remained connected throughout, the text value synchronized, and the original white canvas state was restored after verification | Exercised in Chrome on Windows; other browser and operating-system native picker implementations remain untested |
| Desktop editor presentation | Local Next.js route in Chrome | Pass: three-column shell, complete Inspector, external handles, empty prompt, and scrollable groups rendered correctly | Chrome development runtime only |
| Context-dependent resize and breakpoint isolation | Browser pointer drag on Desktop, Mobile switch, Mobile pointer drag, Desktop switch | Pass: Desktop stored/rendered 80% as 896/1120 px; Mobile inherited 80% as 312/390 px, then stored a 70% mobile override as 273 px; Desktop remained 80% | Absolute/fixed and non-percent unit branches are covered deterministically by pure tests |
| Padding direct manipulation | Browser top-padding drag after handle-collision correction | Pass: top changed 48 px to 68 px; bottom remained 48 px; status announced one desktop style update | Mouse path tested in Chrome; touch remains future validation |
| Shallow-node handle collisions | Browser bounding boxes and final screenshot | Pass: all four handles are individually targetable; top and bottom use distinct horizontal anchors | Extremely tiny non-empty authored boxes may still benefit from later collision heuristics |
| Flex controls and guide isolation | Browser Block to Flex to Column plus guide toggle | Pass: semantic Section compiled `display:flex` and `flex-direction:column`; guide label appeared; semantic dataset contained no editor data | Grid browser behavior is primarily covered by integrated tests and compiler tests |
| Responsive Canvas | Browser Desktop/Mobile switches with root Fill viewport | Pass: root matched the 1120 x 672 px Desktop artboard and the 390 x 844 px Mobile artboard, while retaining auto height for overflow | Custom breakpoints remain out of scope |
| Overlay mutual exclusion | Browser Layout guide then Padding edit | Pass: padding mode rendered four bands/four handles and removed the layout guide | Resize handles intentionally remain available outside drag mode |
| Console health | Final Chrome development log read | Pass: no application-authored warning or error | Chrome injected `cz-shortcut-listen` before hydration and React reported that external attribute mismatch |
| Frozen systems | Full Phase 1 through Phase 4 regression plus source-scope review | Pass: command kinds, candidate hydration flow, history/store, placement, and registry capability assignments are unchanged; the existing style allowlist/schema/resolver/compiler accept additive border, text-decoration, shadow, and blur fields; new Link defaults explicitly preserve underline | No Git diff is available because the supplied workspace is not a Git worktree |

The validation commands required execution outside the restricted filesystem sandbox because pnpm processes needed read access to installed dependencies. This changed no validation semantics.

## Decisions and deviations

### Approved Phase 5 architecture

The implementation matches P5-D1 through P5-D10:

1. Reset/unset controls are absent and command architecture remains frozen.
2. Flex/Grid authoring is container-level only.
3. P5-D3 was later amended: Canvas resize preserves valid explicit units, uses parent-relative percent for first normal-flow semantic width resize, and otherwise uses the approved pixel fallbacks.
4. General numeric controls author only px, %, rem, and em. The later root-only Fill viewport choice is a semantic mode, not raw vh authoring.
5. Gesture state is local to an `EditorShell` reducer; one final command commits.
6. Direct resizing stores no value below a zero-pixel equivalent.
7. Border authoring is uniform and additive: style is None/Solid/Dashed/Dotted, width is a finite nonnegative px/rem/em value, color reuses the existing opacity-aware control, visible styles initialize missing 1 px/black values atomically, and None preserves inactive values.
8. Background-image authoring is one URL-based decorative layer on Section, Container, and Card, stored atomically with fit, position, and repeat; explicit `none` suppresses inherited images at narrower viewports.
9. Link text decoration is responsive and limited to None, Underline, Overline, and Line through inside the existing Typography group; new Links explicitly default to Underline.
10. Shadows and backdrop blur are component-agnostic responsive styles, and rendered Component Library previews use the same template/compiler source as Canvas and Preview.

No approved Phase 5 requirement was intentionally omitted. One browser-found ergonomic issue—opposite spacing-handle collision on an empty shallow node—was corrected in the overlay anchor calculation before final validation.

After the initial validation, the user approved three sizing refinements: contextual Fill page/Fill parent labels with a root-only growable Fill viewport mode; removal of Min/Max Width/Height from the Inspector; and the context-dependent, unit-preserving visual-resize policy. Min/max fields remain accepted and compiled for existing documents. Resize conversion is editor measurement logic and still commits one existing command at the active responsive layer. These addenda did not add a command, persisted store field, transaction/history behavior, registry capability, migration, or placement rule.

On 2026-08-10, the user approved a further bounded refinement: runtime Fill viewport height now uses a dynamic `100dvh` minimum. Normal fill remains parent-relative `100%`, Canvas preview continues to use the selected artboard-height variable, and existing viewport-width values retain their `100vw` compatibility behavior. This required no persisted-data or schema migration.

On 2026-08-10, the user also approved a Container-presentation correction. New Container nodes now persist zero vertical padding with 24/20/16 px responsive horizontal gutters. Empty auto-height Containers receive a 48 px minimum only through the Canvas preview seam; the minimum is removed after child insertion and yields to explicit height or minimum-height values. This intentionally lets an otherwise zero-height Container affect Canvas flow while empty, but it does not enter saved data or published output. That correction did not migrate stored spacing. A later Preview parity correction advances Container to version 2 and migrates only the former hidden `72rem` maximum to `100%`; stored spacing and any other explicit maximum remain unchanged.

On 2026-08-10, the user approved bounded Padding and Margin Inspector corrections. Both properties default to Axes with one X control for left/right and one Y control for top/bottom. All switches to four independent top/right/bottom/left controls; it does not mean link every side. A later Canvas follow-up on the same date lifted each property's scope into the existing local visual-editing reducer so direct manipulation honors the same choice: Axes mirrors the dragged value to the opposite side, while All changes only the dragged side. Margin continues to allow `auto` units and negative numeric values. The corrections change only editor-local mode state, control rendering, responsive style batches, and Canvas change construction; they do not change schemas, commands, persisted state, or history semantics.

On 2026-08-10, the user approved immediate feedback from the Padding and Margin numeric controls. Each valid input change now uses the existing responsive style command path, while blank or non-finite drafts remain local. Stable field identity and guarded prop synchronization retain focus across Canvas repaints, enabling consecutive native spinner or arrow-key steps without waiting for blur. No schema, command shape, renderer contract, or preview-session state was added.

On 2026-08-10, a bounded Heading correction added a complete zero-margin value to the registry default for newly inserted Headings. This suppresses browser user-agent heading margins through the existing style compiler and gives the Inspector concrete 0 values instead of blank spacing fields. No schema, renderer, command, history, responsive-cascade, or placement change was required.

On 2026-08-10, the user approved a bounded text-first Inspector correction. Heading, Text, Link, and Button now keep their complete registry-driven Content section visible, render the `text` field as a multiline **Text content** editor, and place collapsed Typography directly afterward. Non-text Content sections retain their previous disclosure behavior. The correction changes only Inspector presentation and local prop-control rendering; registry metadata, component schemas, commands, history, persistence, responsive resolution, and semantic renderers are unchanged.

On 2026-08-10, the missing-spacing correction was generalized at the Inspector boundary. Any absent padding or margin side now displays as `0px` in both Axes and All modes, including existing Heading padding and Card margin values. This is a presentational fallback only: selecting a component does not mutate its document, and the first edit still uses the existing complete-four-side spacing command when no resolved property exists.

On 2026-08-10, the user approved P5-D7 and the recommended uniform border design. Optional `borderWidth`, `borderStyle`, and `borderColor` fields now sit beside the existing radius, flow through the existing responsive and command pipelines, and require no migration or schema-version bump. Section, Container, Card, and Button keep their existing Border capability; Heading and Text remain unchanged. Per-side borders, reset/unset, outlines, and border manipulation on the Canvas remain excluded. Shadows were later approved separately as component-agnostic Effects under P5-D10.

On 2026-08-10, the user approved P5-D8 and the bounded responsive background-image plan. Optional atomic `backgroundImage` values now flow through strict source/configuration validation, cloning, responsive resolution, the existing style command allowlist, shared CSS compilation, Inspector history, editor rendering, and preview rendering. Section, Container, and Card receive the separate capability; Button and Link retain color-only Background controls. Explicit `{ kind: "none" }` suppresses inherited images at narrower viewports. Uploads, asset persistence, semantic image content, multiple layers, overlays/image opacity, and durable cross-version exchange remain excluded.

On 2026-08-10, the user requested gradient colors for backgrounds. The bounded implementation adds a `linear-gradient` variant to the same atomic `backgroundImage` union, with a 0-to-360-degree angle and two safe opacity-aware colors. It does not add a style property, command, capability, migration, renderer seam, or multiple-layer behavior. The image and gradient variants replace each other; radial gradients, extra stops, blend modes, overlays, and animation remain excluded. This follow-up is technically verified and recorded in the draft Phase 5 proposal pending accountable owner review.

On 2026-08-10, a bounded Font family Inspector correction replaced the empty free-text field with eight local/web-safe preset stacks. Inter mirrors the inherited editor default without writing a style until the user changes the selector; selecting a preset continues to use the existing responsive `node.updateStyles` command, and arbitrary font-family strings already present in a document remain visible as a custom option. No style schema, compiler, renderer, command, history, hydration, or migration change was required.

On 2026-08-10, the user approved P5-D9 and the bounded Link text-decoration follow-up. Optional `textDecoration` accepts only `none`, `underline`, `overline`, or `line-through`, flows through the shared responsive schema, resolver, style-command allowlist, and editor/Preview compiler, and appears only for Link inside the existing Typography group. New Links store underline explicitly; existing Links require no migration and Link remains component version 1. Decoration color, thickness, style, offset, skip-ink, and combined lines remain excluded.

On 2026-08-11, the user approved P5-D10 and one builder-wide source of truth for visual effects and rendered component previews. Optional `boxShadow` and `backdropBlur` values now flow through the existing responsive schema, atomic merge/cloning, style-command allowlist, compiler, Inspector, Canvas, and Preview. Effects are universal and require no registry capability. Button preset thumbnails resolve the actual default or block template and compile it; thumbnail-only CSS supplies only framing and scale. Raised, glass, and glow Buttons therefore use the same generic effects as Card or any other component. The Arrow shift interaction remains a semantic Button prop but shares its real icon markup and selector between Library and Canvas. No generic persisted interaction-state or transform architecture was added.

### Project.md

The relevant known and intentional differences are:

1. **Frozen runtime command spellings remain.** The implemented architecture uses `node.updateProps` and `node.updateStyles`; Project.md describes broader kebab-case command names. Phase 5 did not rename or duplicate commands.
2. **Reset/unset is deferred.** The frozen update-style command cannot remove a responsive field honestly. Phase 5 therefore provides no reset sizing, reset layer, return-to-inheritance, or Grid rows Auto control. This is approved P5-D1, not a hidden surrogate.
3. **Layout fields remain the current schema subset.** Item-level flex/grid controls, arbitrary track syntax, per-side borders, transforms, offsets, and advanced positioning remain absent.
4. **Raw unit exposure remains narrower than schema acceptance.** General controls author only px/%/rem/em. A root-only semantic Fill viewport mode was later approved, compiles to a dynamic viewport minimum at runtime, and is simulated against the selected Canvas artboard in the editor.
5. **Global CSS remains the editor styling mechanism.** Project.md names Tailwind CSS, while the approved codebase uses [globals.css](../../../src/app/globals.css). Phase 5 extended the established mechanism instead of adding a second styling system.
6. **The store remains intentionally smaller than the complete Project.md target.** Preview gestures are local React state and do not add persisted hover, zoom, panel-layout, clipboard, or persistence lifecycle fields.

None of these differences bypasses component schemas, responsive resolution, command validation, candidate hydration, transactions, dirty state, history, selection, locking, or placement.

## Rollout and rollback

This implementation exists only in the local workspace and is not deployed. No branch or commit exists because the supplied workspace has no Git metadata.

Rollback is file-level:

- Remove [visual-editing.ts](../../../src/builder/ui/visual-editing.ts) and the two Phase 5 test files.
- Revert the Phase 5 changes in the rendering controller, Shell, Canvas, Inspector, Component Library, Button preset templates, global editor CSS, and the additive border/background-image/text-decoration/effects fields and capabilities in the style/command pipeline.
- Restore the Phase 4 workspace/report state.

No document migration, schema downgrade, backend operation, or persisted-data rollback is required. The viewport dimension, uniform border, background-image, text-decoration, shadow, and blur fields are additive values in the existing responsive style contract and do not change the project or component schema version. An in-memory document containing `backgroundImage`, `textDecoration`, `boxShadow`, or `backdropBlur` must not be handed to an older strict-schema build after rollback.

## Durable documentation updates

- The [Phase 5 architecture proposal](../plan/Phase-5-Architecture-Proposal.md) records all finalized design decisions.
- The [Phase 5 workspace](../workspace.md) records completed implementation, validation, and the review milestone.
- This report records the implemented architecture, controls, tests, browser evidence, known deviations, and residual risks as a draft D5 artifact.
- `Project.md` now records the verified additive border, background-layer, text-decoration, shared-effects, and component-preview contracts; the frozen Phase 1 through Phase 4 documents were not rewritten.

The Phase 5 workspace documents require an accountable owner before promotion from draft.

## Residual risks and follow-up

- Reset/unset remains deliberately unavailable until a separately approved command architecture can delete responsive fields atomically.
- Selecting Border None preserves width, color, and radius but cannot return an active responsive field to inheritance; that remains part of the reset/unset limitation.
- A newer schema-version-1 in-memory document containing border fields will not hydrate in an older strict-schema build; persisted cross-version exchange is still outside the delivered product scope.
- A document containing `backgroundImage` has the same older-build strict-hydration limitation. Current documents without the optional field continue to hydrate unchanged.
- A document containing `textDecoration` has the same older-build strict-hydration limitation. Existing Links require no migration, but decoration color, thickness, style, offset, skip-ink, and combined lines remain unavailable.
- A document containing `boxShadow` or `backdropBlur` has the same older-build strict-hydration limitation. Current documents without those optional fields continue to hydrate unchanged.
- Shadow lists are intentionally limited to four entries and replace atomically at a responsive layer. The Inspector can author an empty list to suppress inherited shadows, but the deferred general reset/unset command still cannot remove the responsive field itself.
- Backdrop blur affects content behind a component, so its visible result depends on the component background and surrounding scene even though the compiled value is identical across Library, Canvas, and Preview.
- Generic hover, focus, and active style authoring remains outside this effects follow-up. Button icon motion stays a semantic component behavior rather than a general persisted interaction-style layer.
- Background images remain URL-only and decorative. File upload, asset ownership, alt text, multiple layers, radial or multi-stop gradients, blend modes, and overlay/image-opacity rendering require separately approved architecture.
- Background-image source validation reduces unsafe CSS input but does not guarantee that an approved remote host remains available, fast, private, or content-stable.
- Background-image controls were only partially observed in Chrome before the earlier development browser session became unstable; automated editor and preview integration tests remain authoritative for image add/replace/remove. Linear-gradient creation and live color/angle editing were rendered successfully in Chrome, but a complete accessibility and cross-browser exercise remains outstanding.
- Existing raw vw/vh values are preserved and visible but remain unavailable for new numeric authoring; the root-only semantic viewport choice uses `100dvh` at runtime and Canvas-specific preview substitution in the editor.
- Percentage widths intentionally follow the current containing block, so reparenting a resized node can change its rendered pixel width while preserving its stored proportion.
- Unit-preserving em/rem/vw/vh resize depends on the measured font or browser viewport basis; if a valid basis is unavailable, the gesture safely falls back to px.
- Grid rows cannot return to automatic once authored from the Phase 5 UI; this is the visible consequence of deferred unset.
- Canvas spacing gestures normalize the edited side to px. Inspector fields are the supported path for deliberate %, rem, or em authoring.
- Each valid Inspector spacing spinner step is an ordinary style command and history entry, so holding a spinner can produce multiple undo steps.
- Very dense or transformed future layouts may require more sophisticated handle collision and coordinate-space logic. Transforms are not in the current schema.
- Empty auto-height Containers intentionally occupy 48 px in the editor until content is inserted; this improves selection and visual centering but means the empty Canvas flow is taller than published empty markup.
- Existing stored Container nodes keep their stored spacing; only the former hidden `72rem` maximum is migrated to `100%`, while other explicit maximum-width values remain unchanged.
- Existing stored Heading nodes without a modeled margin keep their stored styles; the explicit zero-margin correction applies to newly inserted Headings unless a future migration is approved.
- Inspector zero values for absent spacing are presentational; origin badges remain deferred, so users cannot yet distinguish a displayed zero default from an explicitly stored zero without inspecting the document.
- Opacity conversion is intentionally limited to three-, four-, six-, and eight-digit hex plus `transparent`; arbitrary CSS variables and named/function colors are preserved but keep the slider disabled.
- Font presets use CSS fallback stacks rather than bundling additional font files; rendering can vary by client font availability before reaching the generic fallback.
- Touch, screen-reader workflow, color contrast, and multi-browser pointer matrices deserve a dedicated accessibility/cross-browser pass before a production release.
- The development build warns that Next.js ignored an unrelated `C:\Users\Suraj\pnpm-lock.yaml` during Turbopack root discovery. The workspace build still succeeds.
- Vitest reports that native Vite tsconfig path resolution could replace `vite-tsconfig-paths`; this is maintenance-only.

Phase 5 is complete and frozen pending user review. No publishing, backend, authentication, persistence, template, block, AI, database, or deployment work is part of this report; later-phase implementation is tracked separately.
