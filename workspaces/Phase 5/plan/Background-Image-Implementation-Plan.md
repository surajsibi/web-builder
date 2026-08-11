---
doc_id: WEB-BUILDER-PHASE-5-BACKGROUND-IMAGE-PLAN
type: D3
scope: Add responsive decorative background-image controls and record the later two-color linear-gradient extension on the same atomic layer
authority: Approved execution order for the bounded Phase 5 background-image follow-up; Project.md owns product intent, the Phase 5 architecture proposal owns Phase 5 boundaries, and verified source owns current behavior
owner: Unassigned; accountable product and architecture owner required before promotion
lifecycle: approved
freshness: Image delivery remains recorded; the later linear-gradient extension is verified with 15 gradient-focused tests across seven files, the 220-test full suite, TypeScript, ESLint, the production build, and rendered Chrome editing on 2026-08-10; invalidated by a background-layer scope decision, style-contract change, asset-persistence decision, implementation change, or verification-status change
---

# Plan: Add responsive background images

## Goal, scope, and authority

Let users add a decorative background image to a Section, Container, or Card from the existing **Background** Inspector group. The feature will use one validated URL and structured controls for fit, position, and repeat. Every edit will continue through `node.updateStyles`, the existing Desktop/Tablet/Mobile cascade, strict hydration, shared compiler, history, Undo, Redo, editor renderer, and preview renderer.

The accountable user approved the bounded recommendation and authorized planning and implementation on 2026-08-10.

### Included work

- Add an atomic `backgroundImage` responsive style value with explicit `none` and `image` variants.
- Accept trimmed HTTPS URLs and same-origin root-relative paths up to 2,048 characters.
- Expose image URL, Cover/Contain/Auto fit, horizontal and vertical position, repeat mode, replace, and remove controls.
- Keep `backgroundColor` independent so it remains the fallback behind transparent image pixels.
- Add a registry capability that enables image controls for Section, Container, and Card while preserving color-only Button behavior.
- Add behavior-first validation, resolution, compilation, command, Inspector, history, lock, and regression coverage.
- Verify TypeScript, ESLint, the full test suite, and the production build.

### Excluded work

- File uploads, base64 or blob URL persistence, asset-library integration, and backend storage.
- Semantic image content or alternative text; meaningful images belong in a future Image component.
- Multiple background layers, radial gradients, extra gradient stops or positions, blend modes, attachment, origin, clip, custom CSS, and arbitrary pixel positioning. The original blanket gradient exclusion was superseded by the bounded two-color linear-gradient addendum below.
- Independent background-image opacity or overlays, which require a separate rendering-layer decision.
- Image backgrounds on Button, Heading, or Text.
- A new command kind, responsive cascade, renderer contract, store/history model, or persistence service.

## Implemented contract target

The intended persisted value is:

```ts
type BackgroundImageValue =
  | { kind: "none" }
  | {
      kind: "linear-gradient";
      angle: number;
      startColor: string;
      endColor: string;
    }
  | {
      kind: "image";
      source: string;
      size: "cover" | "contain" | "auto";
      positionX: "left" | "center" | "right";
      positionY: "top" | "center" | "bottom";
      repeat: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
    };

type StyleValues = {
  // Existing fields...
  backgroundColor?: string;
  backgroundImage?: BackgroundImageValue;
};
```

The value is atomic at each responsive layer. Inspector edits start from the resolved value and write a complete configuration to the active layer. `{ kind: "none" }` intentionally suppresses an inherited image at a narrower viewport.

Missing `backgroundImage` remains equivalent to the existing no-image behavior. This follows the workspace's additive optional-style precedent. A document containing the new field will not load in an older strict-schema build; durable cross-version exchange remains outside the shipped product scope.

## Post-completion linear-gradient addendum

On 2026-08-10, the user requested background gradient colors. The implemented bounded interpretation reuses the atomic responsive `backgroundImage` property because CSS represents a gradient as a background image:

- Section, Container, and Card can add one two-color linear gradient.
- The gradient stores a finite 0-to-360-degree angle and safe `transparent` or three-, four-, six-, or eight-digit hex start/end colors.
- Existing color controls provide independent opacity for each stop.
- A gradient and decorative image replace each other rather than forming multiple layers.
- Removing a gradient writes the existing `{ kind: "none" }` value, including at narrower responsive layers.
- The command catalog, capability matrix, responsive merge behavior, hydration version, history/store shape, renderer contract, and placement rules remain unchanged.

The addendum is implemented and technically verified but remains part of the draft Phase 5 review because no accountable owner is assigned.

## Constraints and assumptions

- **Verified:** The supplied workspace is not a Git worktree, so branch and synchronization steps do not apply.
- **Verified:** Background color currently flows through the shared style schema, resolver, compiler, command allowlist, Inspector, editor renderer, and preview renderer.
- **Verified:** The project has no durable asset store. File bytes and temporary blob URLs cannot produce portable project documents.
- **Approved boundary:** URL-based decorative images are sufficient for this follow-up; uploads wait for an asset-persistence feature.
- **Approved boundary:** Image background controls apply only to Section, Container, and Card.
- **Security constraint:** The style schema rejects protocol-relative URLs, `http:`, `data:`, `blob:`, `javascript:`, control characters, empty values, and overlong values.
- **Accessibility constraint:** Inspector help text identifies background images as decorative and directs meaningful content to an Image component.

## Dependencies

| Dependency | Required state | Owner | Failure response |
| --- | --- | --- | --- |
| Existing style pipeline | One structured optional property can validate, clone, cascade, and compile without another style system | Technical verifier | Stop and return the contract for architecture review |
| Existing registry capabilities | A second capability can share the Background group without exposing image controls on Button | Technical verifier | Keep the current group unchanged and revise capability design |
| Existing command/history path | A complete image configuration can be written atomically through `node.updateStyles` | Technical verifier | Do not add a command; correct the shared seam |
| Preview renderer | Shared compiled CSS continues to render in editor and preview | Technical verifier | Fix the shared compiler path rather than adding preview-only behavior |
| URL-only asset boundary | No upload or file persistence is promised | Accountable user / product owner | Stop if durable upload becomes required and open an asset-system plan |

## Ordered work

| ID | Deliverable/action | Depends on | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| BGIMG-01 | Record the approved contract, exclusions, compatibility policy, and implementation TODOs | User authorization | This D3 plan is linked from the Phase 5 workspace | Document author | Complete |
| BGIMG-02 | Add failing behavior-first tests for safe/unsafe sources, responsive `none`, exact CSS, command writes, capability exposure, Inspector editing, removal, lock behavior, and history | BGIMG-01 | Focused tests fail only at the missing contract and controls | Implementer / technical verifier | Complete |
| BGIMG-03 | Add structured types, strict schemas, cloning, atomic responsive merging, and CSS compilation | BGIMG-02 | Focused style tests pass without mutating inputs | Implementer / technical verifier | Complete |
| BGIMG-04 | Extend the command property allowlist and registry capability matrix | BGIMG-03 | Commands accept valid complete values, reject malformed values, and preserve Button color-only behavior | Implementer / technical verifier | Complete |
| BGIMG-05 | Add accessible URL, fit, position, repeat, replace, and remove controls to the existing Background group | BGIMG-04 | React tests observe labels, Canvas changes, active viewport isolation, disabled state, and one-step history | Implementer / technical verifier | Complete |
| BGIMG-06 | Verify the shared editor and preview rendering seam | BGIMG-05 | Compiler/rendering tests show the same exact CSS properties without editor-only component markup | Implementer / technical verifier | Complete |
| BGIMG-07 | Run full quality gates | BGIMG-06 | `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` pass | Technical verifier | Complete |
| BGIMG-08 | Update Phase 5 workspace and validation records with exact results and remaining limits | BGIMG-07 | Documentation links to implementation and distinguishes automated from unverified browser evidence | Document author / accountable owner | Complete |

## Quality and approval gates

This is an R2 compatibility change because it extends the persisted strict style contract. Completion requires:

- Focused red tests before implementation and green tests afterward.
- Exact schema rejection for unsafe or malformed image values.
- Exact CSS compilation with safely quoted URLs.
- Old documents with no `backgroundImage` field to hydrate unchanged.
- Responsive Desktop/Tablet/Mobile overrides, including explicit narrower-viewport removal.
- Capability-gated controls for Section, Container, and Card only.
- Locked nodes to keep controls disabled and reject mutation.
- One existing history entry per Inspector action, with working Undo and Redo.
- Passing typecheck, lint, full tests, and production build.
- Documentation to record that uploads, meaningful image content, overlays, and cross-version document exchange remain excluded.

## Risks, rollback, and containment

| Risk | Impact | Containment |
| --- | --- | --- |
| Unsafe or malformed URL reaches CSS | Unexpected external requests or invalid styles | Use a strict source allowlist, bounded length, complete schema validation, and quoted CSS serialization |
| File input creates nonportable documents | Preview snapshots become large or temporary URLs break | Do not expose upload until durable asset ownership exists |
| Image capability appears on Button | UI exceeds the approved component matrix | Add a separate registry capability and test exact exposure |
| Responsive partial edits lose configuration | Fit/position/repeat values unexpectedly reset | Treat the value atomically and write a complete resolved configuration |
| Remove cannot suppress an inherited image | Narrower viewports cannot opt out | Persist an explicit `{ kind: "none" }` variant |
| Users treat decorative images as content | Accessibility and SEO information is lost | Add Inspector guidance and keep semantic images out of this style feature |
| New strict field breaks older builds | Same-version backward application compatibility remains limited | Keep the field optional for current hydration and record the existing additive-contract limitation |

Rollback is code-only while durable persistence/export remains absent. Reverting the optional type/schema/compiler/Inspector changes restores the old UI, but an in-memory document containing `backgroundImage` must not be passed to an older strict hydrator.

## Completion

BGIMG-01 through BGIMG-08 remain complete. After the linear-gradient addendum, the gradient-focused schema, resolution, compiler, hydration, command, Inspector, and preview selection passes 15 tests across seven files; the complete project suite passes 220 tests across 23 files. `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass. The production build emits static `/` and `/_not-found` routes plus the dynamic `/preview` route.

The earlier image browser exercise remains partial. The later gradient exercise rendered the default 135-degree purple-to-blue gradient on a 1120-by-96-pixel Section and updated the live Canvas to a 90-degree orange-to-blue gradient through the Inspector. The automated editor and preview integration tests remain authoritative for the complete image and gradient behavior matrix. Uploads, overlays, meaningful image content, radial or multi-stop gradients, cross-version exchange, and a broader accessibility/cross-browser pass remain outside this plan.
