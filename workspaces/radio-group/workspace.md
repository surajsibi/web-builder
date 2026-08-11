---
doc_id: WEB-BUILDER-RADIO-GROUP-WORKSPACE
type: D4
scope: Web builder native Radio Group primitive implementation state
authority: Selected execution-state authority for the Radio Group component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against 290 automated tests, TypeScript, ESLint, the Next.js 16.3.0 production build, and rendered editor/Preview behavior; invalidated by a related component contract, Form placement, Inspector, rendering, submission, or verification-status change
---

# Radio Group component workspace

**Feature name:** Native Radio Group Primitive

**Feature directory identifier:** `radio-group`

**Overall status:** Implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the accessible Radio Group in the Component Library, Inspector, editor Canvas, Preview, and native Form submission path before beginning Checkbox or shared visible-label work.

**Feature summary:** Add one leaf Radio Group component that owns a visible group label and mutually exclusive native radio options. Persist authored configuration in the project document, preserve live visitor selection, submit the selected named value through existing native FormData semantics, and keep the group editable through the shared Inspector and style systems.

## Scope

- Add one leaf `radio-group` component definition and Component Library icon.
- Render a native `<fieldset>` with a visible `<legend>` and labeled native radio inputs.
- Expose field name, option labels and values, default selection, orientation, required, and disabled configuration.
- Preserve a visitor's live selection across unrelated renderer updates and adopt a changed authored default.
- Allow Radio Group inside Form and existing general-purpose containers.
- Submit the selected value through the existing native FormData path.
- Group Dropdown and Radio Group under a Forms `Choices` filter that leaves room for Checkbox.
- Cover registry validation, placement, Component Library discovery, Inspector editing, editor rendering, hydration, and Preview submission.

## Out of scope

- Checkbox and Checkbox Group primitives.
- A standalone Label primitive or shared Form Field wrapper.
- Separate display labels and submitted values for each option.
- Conditional options, custom radio graphics, validation-message authoring, and backend storage or delivery.

## Risks and trade-offs

- Option labels are also submitted values, matching the existing Dropdown contract; separate values would require a future component migration.
- Radio groups that share a form field name participate in the same native group, so authors must use distinct names for independent groups.
- A standalone label association system remains deferred; Radio Group is independently accessible through its owned fieldset legend.

## Verification

- Focused serialized Vitest run: 6 files and 108 tests passed across the component registry, Component Library, editor, hydration, Preview, and FormData conversion.
- Full serialized Vitest run: 26 files and 290 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed with Next.js 16.3.0; routes `/`, `/preview`, and `/api/form-submissions` built successfully. The build retained the pre-existing Turbopack root warning about the ignored home-directory lockfile.
- Rendered editor verification at `http://localhost:3000/`: the Component Library reported five Forms entries, the `Choices` filter exposed Dropdown and Radio Group, insertion created one selected `radio-group` node, and the Inspector successfully authored the visible group label, field name, three options, default selection, horizontal orientation, and required state.
- Rendered Preview verification: the fieldset legend exposed the group name, all options shared `contactMethod`, `Phone` loaded as the authored default, pointer activation selected `Email`, and `ArrowRight` returned selection to `Phone` through native radio keyboard behavior.
- Browser console: Preview reported no errors. The editor reported only the previously documented development hydration warning caused by the Chrome extension-injected `cz-shortcut-listen` body attribute; application markup does not provide that attribute.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the Radio Group contract, native renderer, default styles, icon, registry entry, Form placement, Component Library `Choices` integration, Inspector controls, architecture update, and regression coverage.
- **Verification:** All focused and full automated, static, build, and rendered browser checks passed. The unrelated Chrome-extension hydration warning remains observable in the development editor only.
- **Remaining:** User review only; Checkbox and shared visible-label work remain deliberately unstarted.
- **Last left off:** 2026-08-11 — Radio Group implementation and verification complete; next feature in the approved order is Checkbox, but no Checkbox work has started.
