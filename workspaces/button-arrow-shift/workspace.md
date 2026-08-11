---
doc_id: WEB-BUILDER-BUTTON-ARROW-SHIFT-WORKSPACE
type: D4
scope: Web builder Arrow shift Button preset execution state
authority: Selected execution-state authority for the Arrow shift Button preset fix; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against automated tests, TypeScript, ESLint, the production build, and rendered editor/Preview hover behavior; invalidated by a related Button schema, preset, renderer, stylesheet, or verification-status change
---

# Arrow shift Button workspace

**Feature name:** Arrow shift Button animation

**Feature directory identifier:** `button-arrow-shift`

**Overall status:** Implemented and verified; awaiting user review.

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the working Arrow shift animation in editor and Preview.

**Feature summary:** The Component Library card preview animates its text arrow, but the inserted preset resolves to a normal Button node without animation identity. Persist an explicit Button icon-animation property, apply it only to the Arrow shift preset, and render the same hover and keyboard-focus behavior in both editor and Preview.

## Scope

- Keep the existing Component Library preview behavior.
- Persist the Arrow shift behavior in the inserted Button node.
- Render the motion through the shared Button renderer in editor and Preview.
- Preserve existing Buttons through a component migration with animation disabled by default.
- Respect reduced-motion preferences while retaining immediate interaction feedback.
- Cover preset resolution, semantic rendering, and migration behavior.

## Out of scope

- A general animation timeline editor.
- Animation controls for non-Button components.
- Changing the Raised 3D or Navbar button behavior.
- Publishing, persistence backends, or project-schema changes.

## Evidence

- User-provided reproduction image: [`assets/arrow-shift-static-button.png`](assets/arrow-shift-static-button.png).
- Verified source behavior: `src/app/globals.css` scopes the existing transition to `.library-card:hover`, while `src/builder/registry/blocks/button-preset-blocks.ts` resolves the preset without an animation prop.
- Implemented behavior: Button component version 4 persists `iconAnimation`; version 3 and older Buttons migrate to `none`, while the Arrow shift preset resolves to `shift-right`.
- Shared rendering behavior: semantic Button and linked Button roots expose the configured animation through one data attribute, and the icon uses one stable class in editor and Preview.
- Accessibility behavior: hover and `:focus-visible` share the shift state; reduced-motion preference removes the timed transition while retaining immediate feedback.

## Verification

- Focused Vitest run: 5 files and 109 tests passed.
- Full serialized Vitest run: 26 files and 249 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed with Next.js 16.3.0; routes `/`, `/preview`, and `/api/form-submissions` built successfully.
- Rendered editor verification at `http://localhost:3000/`: the inserted Arrow shift Button exposed `shift-right`, the icon transition computed to `transform 0.15s`, and hover changed the transform from `none` to a 2.88 px horizontal translation.
- Rendered Preview verification: the generated Preview preserved the same `shift-right` attribute, 150 ms duration, and 2.88 px hover translation.
- Browser console: the only error was the previously documented hydration mismatch from the Chrome extension-injected `cz-shortcut-listen` body attribute; application markup did not provide that attribute.

## Risks and trade-offs

- The Button component version increases from 3 to 4. The migration intentionally keeps all existing Buttons static, so animation is opt-in and only the Arrow shift preset enables it by default.
- The shift distance is font-relative (`0.18em`), so it scales with the Button's configured typography.
- Keyboard `:focus-visible` and reduced-motion rules are implemented in the same verified stylesheet, but the rendered browser exercise directly measured hover only.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the Button icon-animation contract and migration, configured the Arrow shift preset, rendered the shared editor/Preview interaction, exposed the Inspector option, added regression coverage, and completed static, build, automated, and browser verification.
- **Verification:** All scoped checks passed. The unrelated Chrome-extension hydration warning remains observable in development mode.
- **Remaining:** User review only.
- **Last left off:** 2026-08-11 — Implementation and verification complete; the Arrow shift icon now animates in both editor and Preview.
