---
doc_id: WEB-BUILDER-NAVBAR-REPORT
type: D5
scope: Implemented reusable block infrastructure, semantic Link and Image primitives, editable Navbar logo surfaces, original responsive Navbar block, commerce-style Navbar block, template-backed Component Library thumbnails, 1232px content rails, and responsive All category mega menu in the standalone web builder
authority: Verified implementation record; code and automated tests remain authoritative for behavior, and Project.md remains authoritative for approved architecture
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified after the editable Image and Navbar-logo follow-up with 349 automated tests, TypeScript, full ESLint, and a production build on 2026-08-11; prior desktop/mobile Navbar geometry evidence remains applicable and is invalidated by relevant code, test, build, runtime, or review-status changes
---

# Implementation report: Reusable Blocks and Responsive Navbars

## Outcome

The Component Library provides a reusable Image primitive in Media plus two responsive Navbar blocks. Image accepts safe root-relative or HTTPS sources, including SVG files, explicit alternative text, optional protected linking, and `contain`, `cover`, or `fill` fitting. The original dark pill Navbar now represents its linked Saturn Home mark as an editable Image node. The Commerce Navbar represents its bag mark as an editable decorative Image beside the existing Brandname link while keeping utility icons decorative. Both Navbars retain their established rails, responsive layouts, thumbnails, atomic insertion, and All category behavior.

## Scope and versions

The change applies to the standalone web-builder source tree at the workspace root. No Git repository metadata, branch, commit, release, or external environment was present. The implemented scope includes the generic block registry and resolver, atomic block insertion command, Component Library click/drag integration, non-interactive recursive block-thumbnail rendering, semantic Link and Image primitives, a Media library family, native disclosure semantics on Container, responsive pill and Commerce Navbar templates with editable Image marks, bundled local icon assets, centered 1232px large-screen content rails, and automated verification.

Excluded from this version are file upload and durable asset storage, the More dropdown, location selection, real product-search and commerce-account wiring, persistence, publishing, deployment, and additional block templates.

## Changes

| Area | Authoritative change | User/operational effect |
| --- | --- | --- |
| Component registry | `src/builder/registry/components/component-definitions.tsx` and `component-registry.ts` add a validated semantic Link primitive and native `details`/`summary` Container semantics | Navbar destinations render as editable safe links, while disclosure content remains an ordinary editable subtree without serialized runtime state |
| Image primitive | `component-definitions.tsx`, `component-icons.tsx`, `component-registry.ts`, the shared image-source validator, and Component Library add a version-1 leaf Image with safe source, alt, optional link/new-tab, fit, Media discovery, and Inspector controls | Authors can insert an Image or select a Navbar mark and replace its SVG/image URL, alternative text, destination, new-tab behavior, sizing, spacing, background, border, position, and fit |
| Block infrastructure | `src/builder/registry/define-block-registry.ts` and `block-registry.ts` validate and resolve typed recursive templates | New pre-made blocks can reuse current component defaults without persisting block-only identity |
| Original Navbar template | `src/builder/registry/blocks/navbar-block.ts` retains the dark pill header/navigation tree and 1232px maximum while replacing the background-image Home link with a linked Image node backed by `public/saturn-mark.svg` | The bundled mark keeps its design and destination while becoming directly editable through Image controls |
| Commerce Navbar template | `src/builder/registry/blocks/commerce-navbar-block.ts` retains its full-width rows, 1232px rails, and current 70-node disclosure template while replacing the bag background surface with an unlinked decorative Image; the remaining seven local SVGs stay decorative surfaces | The brand mark source and fit are editable without turning search, menu, chevron, or account-action decoration into semantic content |
| Command execution | `src/builder/commands/types.ts` and `execute-command.ts` implement `block.insert` | Complete validation occurs before mutation; fresh IDs, root selection, and one atomic Undo entry are guaranteed |
| Editor integration | Component Library, shell, interaction types, and drag/drop adapters add block click and drag paths; the Canvas preserves native summary activation while selecting disclosure nodes | The library shows a Blocks group with Navbar, existing primitive insertion and node movement remain available, and the category menu can open inside the editor |
| Library thumbnails | `src/builder/ui/component-library.tsx` resolves structural block templates for preview and recursively renders non-interactive preview elements, including native images without authored links; `src/app/globals.css` gives structural blocks full-width, scaled preview frames | Navbar cards communicate their actual visual design while avoiding nested interactive controls |
| Regression coverage | Registry, command, store, drag/drop, and editor integration specs cover the new behavior | Invalid templates, destinations, locks, and ID collisions fail without partial document changes |

## Decisions and deviations

The implementation follows the primitive/block architecture in `Project.md`: Image is a reusable persisted primitive, while its use as a logo is a Navbar template preset rather than a separate `logo` component type. The renderer uses native `<img>` markup instead of the framework image optimizer because runtime-authored HTTPS hosts cannot be represented by a fixed build-time allowlist. Linked images use one protected anchor root and require non-empty alt text; decorative unlinked images may use empty alt text. Raw SVG markup and embedded `data:` sources remain rejected, while SVG file URLs follow the normal safe-source contract. Structural thumbnails omit authored links so the surrounding library-card button stays valid. Existing layout and disclosure decisions remain unchanged.

## Verification

| Requirement/risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Navbar template and disclosure contracts | Block-registry and component-registry coverage within the current full suite | Pass | Verifies both 1232px rails, full-width row wrappers, native disclosure semantics, four mega-menu groups, 20 menu links, icon assets, and semantic destinations |
| Image and Navbar contract | Four focused registry, Component Library, and EditorShell files: 142 tests | Pass | Covers safe and unsafe sources, linked and decorative rendering, alt requirements, protected new tabs, fit, Media/logo search, Inspector editing, both Navbar logo templates, and non-interactive thumbnails |
| Type safety | `pnpm typecheck` | Pass | Standalone source-tree scope |
| Code quality | `pnpm lint` | Pass | Full standalone source tree |
| Production build | `pnpm build` with Next.js 16.3.0 | Pass | Retains the existing warning that Next.js ignored the lockfile above the workspace |
| Full automated regression suite | `pnpm test -- --fileParallelism=false`: 26 files, 349 tests | Pass | Serialized file execution remains the stable full-suite configuration; an initial three-minute command wrapper timed out before summary, and the identical longer-window rerun passed |
| Desktop mega-menu runtime | Chrome production preview at 1280px: content starts at x=24 for the centered 1232px rail; open panel is 720px wide, absolutely positioned, four columns, and exposes 20 visible links | Pass | Document scroll width equals the 1280px viewport; the panel overlays page content |
| Mobile mega-menu runtime | Chrome production preview at 390px: open panel is 326px wide, statically positioned, one column, and exposes 20 visible links | Pass | Document scroll width equals the 390px viewport; a second activation closes the menu; no console errors were recorded |

## Rollout and rollback

The implementation exists only in the local standalone source tree; no commit, release, deployment, or external rollout occurred. The Image follow-up is additive to the component registry and replaces only the two Navbar mark nodes in templates used for future insertions. Existing saved Navbar subtrees remain unchanged because block identity is not persisted and no document migration runs. No asset file was removed or replaced, and no destructive rollback was performed.

## Durable documentation updates

`Project.md` remains the architecture authority and was updated in place with the Image primitive's persistence, security, accessibility, rendering, and primitive-versus-block contract. The existing feature plan, workspace, and implementation report were updated in place with the completed execution state and verified evidence.

## Residual risks and follow-up

- Accountable user review is still required before promoting these draft records.
- Hamburger navigation requires an explicit runtime-state design and accessibility behavior before implementation.
- Commerce search, location selection, the More dropdown, saved/account/cart state, and real destinations remain visual placeholders until product behavior is specified.
- URL-based logo replacement is supported. File upload, storage ownership, asset reuse, and lifecycle management still require a future asset model.
- Remote HTTPS images depend on third-party availability and disclose ordinary image requests to the authored host; proxying and stricter host governance remain future product decisions.
- The two timeout-only failures seen under default parallel test-file execution indicate a test-runner resource-contention risk; closure is either stable default-parallel runs or an intentional serialized-suite configuration decision.
- Persistence and publishing remain outside this feature and must be verified separately when those capabilities exist.
