---
doc_id: WEB-BUILDER-PHASE-6-PREVIEW-VALIDATION
type: D5
scope: Web builder Phase 6 Preview action, separate-tab one-use state transfer, route, runtime page rendering, responsive behavior, and validation evidence
authority: Derived implementation report; Project.md and the Phase 6 plan own architecture and intent, while linked source, tests, build output, and runtime exercise own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: The original Preview delivery is verified by 127 automated tests, TypeScript, ESLint, a production build, and desktop/mobile browser evidence; the 2026-08-10 Container width-parity correction is verified by 42 current affected tests, focused ESLint, migration coverage, and 1920 px Chrome geometry, while unrelated incomplete linear-gradient work currently prevents a clean full-suite and typecheck rerun
---

# Implementation report: Phase 6 Preview Mode

## Outcome

Preview Mode is implemented and ready for review. The editor toolbar now opens `/preview?snapshot=...` in a new browser tab while the editor stays open in its original tab. Preview consumes a one-use snapshot of the current unsaved document and active page through the normal hydration validator, then renders semantic runtime output without the editor toolbar, navigation panels, Inspector, canvas structure, selection overlays, drag targets, resize controls, or editor-only empty prompts.

The preview uses the existing component registry, responsive resolver, style compiler, and node renderer. It does not expose JSON, create another rendering path, persist data, publish a site, or export source code.

The corrected Container contract removes a hidden wide-screen difference. New Containers use `max-width: 100%`; version-1 Containers carrying the former `72rem` default migrate during normal hydration, while any other explicit maximum remains unchanged.

## Scope and versions

| Item | Value |
| --- | --- |
| Workspace | Web builder local workspace; not a Git worktree |
| Runtime | Next.js 16.3.0, React 19.2.8, Zustand 5.0.14 package range resolved by the existing lockfile |
| Project and component schemas | Project version 1; Container and Button component version 2; other registered components version 1 |
| Routes | `/` editor; `/preview` runtime preview |
| State | Editor store in the original tab; isolated preview store hydrated from a one-use snapshot |
| Responsive contract | Existing desktop-first `base -> tablet -> mobile` cascade and shared 767/1024 px boundaries |
| Persistence | Excluded; browser storage is transfer-only and the snapshot is removed after retrieval |
| Publishing and export | Excluded |
| Deployment | Not deployed |

## Changes

| Area | Authoritative change | User or operational effect |
| --- | --- | --- |
| Editor state | [`editor-store.ts`](../../../src/builder/store/editor-store.ts), [`editor-shell.tsx`](../../../src/builder/ui/editor-shell.tsx) | Keeps the editor document authoritative in its tab and prepares the current document/page snapshot before Preview navigation |
| Snapshot transfer | [`preview-snapshot.ts`](../../../src/builder/preview/preview-snapshot.ts) | Creates the tokenized destination, serializes the one-use payload, removes it after retrieval, and rejects malformed envelopes |
| Runtime page boundary | [`page-rendering-controller.tsx`](../../../src/builder/rendering/page-rendering-controller.tsx) | Renders every ordered page root through the existing node renderer with no editor-only per-node wrapper or empty prompt |
| Responsive runtime | [`runtime-viewport.ts`](../../../src/builder/rendering/runtime-viewport.ts) | Maps real browser width through the existing shared breakpoints and updates Preview on resize |
| Preview route | [`preview/page.tsx`](../../../src/app/preview/page.tsx), [`preview-shell.tsx`](../../../src/builder/preview/preview-shell.tsx) | Reads the snapshot token, hydrates an isolated store through project validation, renders the active page, and shows a bounded recovery state for missing or invalid data |
| Toolbar | [`editor-toolbar.tsx`](../../../src/builder/ui/editor-toolbar.tsx) | Adds the `_blank` Preview link with `noopener noreferrer` next to local save state |
| Presentation | [`globals.css`](../../../src/app/globals.css) | Adds an accessible toolbar action, white full-viewport preview surface, and unavailable-state presentation |
| Container parity | [`component-definitions.tsx`](../../../src/builder/registry/components/component-definitions.tsx), [`hydration.spec.ts`](../../../src/builder/project/__tests__/hydration.spec.ts) | Makes new Containers fill the parent and upgrades only the former hidden `72rem` version-1 maximum to `100%` through the normal component-migration boundary |
| Durable architecture | [`Project.md`](../../../Project.md) | Records the implemented preview rendering, responsive, state-continuity, and persistence boundaries |
| Tests | [`page-rendering-controller.spec.tsx`](../../../src/builder/rendering/__tests__/page-rendering-controller.spec.tsx), [`runtime-viewport.spec.ts`](../../../src/builder/rendering/__tests__/runtime-viewport.spec.ts), [`preview-snapshot.spec.ts`](../../../src/builder/preview/__tests__/preview-snapshot.spec.ts), [`preview-shell.spec.tsx`](../../../src/builder/preview/__tests__/preview-shell.spec.tsx), [`editor-shell.spec.tsx`](../../../src/builder/ui/__tests__/editor-shell.spec.tsx) | Covers root rendering, breakpoint boundaries, new-tab link semantics, one-use transfer, malformed/missing snapshots, hydration under React Strict Mode, chrome exclusion, responsive recomputation, and recovery |

The original Preview slice changed no project schema, component schema, command, hydration, history, placement, or registry definition. The later parity correction advances only Container from component version 1 to 2 and uses the existing component-migration mechanism; the project schema and all editor command/history/placement contracts remain unchanged.

## Decisions and deviations

The initial same-tab route was corrected after user review. The final toolbar uses a real `_blank` link and puts only a snapshot token in the URL. The document payload stays same-origin, is removed after the first read, and is admitted only through `hydrateProject`. This is a bounded state-transfer channel, not durable persistence or a second live document authority.

The preview includes one application-level surface wrapper for the white full-viewport background and responsive-state marker. Authored nodes remain direct children and receive no editor-specific class, wrapper, ref, overlay, or event guard.

## Verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Type correctness | `pnpm typecheck` | Pass | None observed |
| Static analysis | `pnpm lint` | Pass | None observed |
| Regression and focused behavior | `pnpm test` | Pass: 22 files, 127 tests | Vitest reports the pre-existing recommendation to replace `vite-tsconfig-paths` with native Vite path resolution |
| Production compatibility | `pnpm build` | Pass; `/preview` emitted as a dynamic App Router route | Build reports the existing Turbopack-root warning because a home-directory lockfile is ignored |
| Separate-tab unsaved state continuity | Browser: add an unsaved Heading, open Preview, inspect both tabs | Pass; `/` retained the Heading and Inspector while `/preview?snapshot=...` rendered the Heading in a second tab | Snapshot requires same-origin browser storage |
| No editor chrome | Chrome DOM inspection on `/preview` | Pass; toolbar, sidebar, canvas stage, and Inspector counts were all zero | Next.js development tools remain development-only browser UI |
| Desktop responsive output | Chrome at 1920 px runtime width | Pass; Preview reported `desktop`, heading rendered, default Button computed to 91.5 px | Computed width depends on the default Button text/font |
| Mobile responsive output | Chrome override at 390 × 844 | Pass; Preview reported `mobile`, runtime width was 390 px, and Button computed to 390 px | Tablet was covered by pure boundary tests rather than a separate visual capture |
| Browser diagnostics | Chrome error/warning log inspection | Pass with environmental qualification | One hydration message identified Chrome's injected `cz-shortcut-listen` body attribute; the mismatch did not identify an application attribute |

### Container parity correction verification

| Requirement or risk | Evidence | Result | Limitation |
| --- | --- | --- | --- |
| Affected regressions | Four focused Vitest files | Pass: 42 current tests | The current full suite also includes unrelated incomplete linear-gradient tests |
| Migration safety | Hydration tests | Pass: former `72rem` default becomes `100%`; explicit `60rem` remains unchanged; source input is not mutated | Version-1 authors could only create another maximum outside the current Inspector |
| Static analysis | Focused ESLint on implementation and affected tests | Pass | Full typecheck is blocked by unrelated linear-gradient type errors |
| Wide Preview geometry | Chrome at 1920 px | Pass: Container computes to `max-width: 100%`, spans 1920 px, and its authored content begins at the 24 px gutter instead of a 384 px centered margin | The editor desktop artboard remains 1120 px by design |
| Current full-suite signal | `pnpm test` | 204 pass; eight failures are confined to incomplete linear-gradient work | This correction does not claim a clean current full-suite baseline |

## Rollout and rollback

The change exists only in the local workspace and is not deployed. Rollback of Preview remains bounded to the snapshot-transfer module, toolbar link, route, runtime files, and styles. Rolling back the Container parity correction requires restoring the version-1 definition and its `72rem` default; any version-2 document must then be treated as unsupported rather than silently downgraded.

## Durable documentation updates

`Project.md` now records the implemented Preview Runtime boundary. Phase 6 intent, research, execution state, and verification remain in this feature workspace. No stable `ai/context.md` promotion was possible because the required context file is absent and the feature remains awaiting user review.

## Residual risks and follow-up

- Refreshing a consumed `/preview?snapshot=...` URL shows the bounded unavailable state; clicking Preview again creates a fresh one-use snapshot.
- The current preview URL is session-scoped, same-origin, and not shareable.
- Browsers that block or exhaust same-origin storage cannot open the unsaved preview; the editor prevents navigation and reports that failure.
- Metadata, asset handling, navigation across project pages, publishing, deployment, and source export remain future features.
- The toolbar retains the project's existing large-screen editor minimum width; responsive editor-shell redesign is outside Preview Mode.
- A version-1 Container that explicitly used `72rem` outside the Inspector is indistinguishable from the former copied default and therefore migrates to `100%`; other explicit maximum-width values are preserved.
