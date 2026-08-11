---
doc_id: WEB-BUILDER-INPUT-WORKSPACE
type: D4
scope: Web builder native Input primitive implementation state
authority: Selected execution-state authority for the Input component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against 290 automated tests, TypeScript, full ESLint, and rendered Canvas/Preview focus checks after removing duplicate editor-only Input focus outlines; the prior Next.js 16.3.0 production build remains recorded below; invalidated by a related component contract, Input preset, Form placement, Component Library, Inspector, rendering, focus treatment, or verification-status change
---

# Input component workspace

**Feature name:** Native Input Primitive

**Feature directory identifier:** `input`

**Overall status:** Implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the editable Input primitive, Password reveal preset, and Forms-family filters in the Component Library, Inspector, editor Canvas, Preview, and native Form submission path.

**Feature summary:** Maintain one Input primitive for text-like values and expose a Password reveal preset that enables an accessible runtime visibility control through shared props. Organize the Forms library through All, Inputs, Dropdowns, and Forms filters without creating duplicate primitives. Persist authored configuration in the project document, preserve live visitor values while masking changes, submit named values through existing native FormData semantics, and keep every Input variant editable through the shared Inspector and style systems.

## Scope

- Add one leaf `input` component definition and Component Library icon.
- Render a native `<input>` with an explicit accessible name.
- Support text, email, telephone, URL, password, and number input types.
- Expose field name, placeholder, default value, required, disabled, and password-reveal configuration.
- Add one Password reveal library preset that resolves to the existing `input` primitive rather than a second component type.
- Add Forms-family filters for All, Inputs, Dropdowns, and Forms; reset the selected filter when the user leaves the family.
- Render an accessible `type="button"` eye control only for password Inputs with reveal enabled; keep reveal interaction inactive in the editor and disable the control on disabled Inputs.
- Preserve a visitor's live value across unrelated renderer updates and adopt a changed authored default.
- Preserve the visitor's live password value when toggling between masked and visible presentation without mutating the authored input type.
- Use the Canvas selection outline as the only editor selection indicator for focused Inputs while retaining the accessible focus ring in Preview.
- Allow Input inside Form and existing general-purpose containers.
- Submit named, enabled Input values through the existing native FormData path.
- Cover registry validation, placement, Component Library discovery, Inspector editing, editor rendering, and Preview submission.

## Out of scope

- File uploads, checkboxes, radio groups, hidden fields, date/time controls, multiline text, input masks, and validation-message authoring.
- Separate visible Label, Fieldset, Checkbox, Radio, or Textarea primitives.
- Conditional Inspector controls for type-specific attributes such as numeric min/max/step.
- Submission storage, email delivery, or arbitrary external endpoints.

## Verification

- Focused Component Library Vitest run: 1 file and 9 tests passed, including Forms filtering and reset behavior.
- Full Vitest run: 26 files and 290 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- Prior Input implementation build: `pnpm build` passed with Next.js 16.3.0; routes `/`, `/preview`, and `/api/form-submissions` built successfully. The build was not rerun for the filter-only library change.
- Rendered editor verification at `http://localhost:3000/`: the Component Library reported four Forms entries, the Password reveal preset inserted one Input node at the page root, the Inspector exposed the enabled reveal setting, and clicking the eye control kept the editor field masked.
- Rendered focus verification at `http://localhost:3000/`: focused standard and Password reveal Inputs had no Canvas focus outline or box shadow, each retained one Canvas selection outline, and the same Password reveal Input in Preview retained the global solid 3 px focus ring with a 2 px offset.
- Rendered Preview verification: the eye control changed the same live value from `type="password"` to `type="text"` and back to `type="password"`; the 32 × 32 px button was vertically centered within the 43 px field with zero measured offset.
- Browser console: Preview reported no errors. The editor reported the previously documented development hydration warning caused by the Chrome extension-injected `cz-shortcut-listen` body attribute; application markup does not provide that attribute.

## Risks and trade-offs

- Input intentionally supports only string-valued, text-like controls. Checkbox, radio, and file semantics would not fit the current single-value contract and need separate primitives.
- Password reveal uses a composed field shell only when enabled so the accessible button and native input remain one measurable builder root; standard Input configurations retain their native `<input>` root.
- The accessible label is authored as `aria-label`; a separately visible Label primitive remains future work.
- Number fields currently expose native type and validation behavior but do not yet expose type-specific min, max, or step controls.
- Forms filters classify existing entries for discovery only; they do not change component schemas, insertion behavior, or the shared Input primitive contract.
- The focus override is limited to Input roots inside the editor artboard; it does not suppress authored box shadows or runtime focus indicators in Preview.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the Input contract, native renderer, default styles, icon, registry entry, Form placement, Component Library integration, Inspector controls, Password reveal prop and migration, Password reveal preset and thumbnail, accessible eye control, Forms-family filters, architecture update, regression coverage, and a Canvas-scoped focus-outline override for standard and Password reveal Inputs.
- **Verification:** The current implementation passes the full 290-test suite, TypeScript, full ESLint, and rendered Canvas/Preview focus checks. The prior Input build and browser checks remain recorded above. The unrelated Chrome-extension hydration warning remains observable in the development editor only.
- **Remaining:** User review only.
- **Last left off:** 2026-08-11 — Removed the duplicate editor-only focus outline from standard and Password reveal Inputs while preserving the Canvas selection outline and Preview focus ring; automated and rendered verification passed.
