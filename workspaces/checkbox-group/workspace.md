---
doc_id: WEB-BUILDER-CHECKBOX-GROUP-WORKSPACE
type: D4
scope: Web builder native Checkbox Group primitive implementation state
authority: Selected execution-state authority for the Checkbox Group component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against 330 automated tests, TypeScript, ESLint, a production build, and rendered editor and Preview behavior; invalidated by a related component contract, Inspector control, Form placement, rendering, submission, or verification-status change
---

# Checkbox Group component workspace

**Feature name:** Native Checkbox Group Primitive

**Feature directory identifier:** `checkbox-group`

**Overall status:** Implemented and verified; ready for user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Checkbox Group implementation and verification complete; shared visible-label or Form Field work remains a separate future milestone.

**Feature summary:** Add one leaf Checkbox Group component that owns a visible group label and multiple native checkbox options. Persist authored options and default selections, preserve the visitor's live multi-selection, submit checked values through repeated native field names, and keep the group editable through the shared Inspector and style systems.

## Scope

- Add one leaf `checkbox-group` component definition and Component Library icon.
- Render a native `<fieldset>` with a visible `<legend>` and labeled native checkbox inputs.
- Expose field name, option labels and values, authored default selections, orientation, required-at-least-one behavior, and disabled state.
- Preserve a visitor's live selections across unrelated renderer updates and adopt changed authored defaults or options.
- Add one dependent string multi-select Inspector control so default selections are chosen from the current option list and invalid selections are pruned when options change.
- Allow Checkbox Group inside Form and existing general-purpose containers.
- Submit each selected option under the shared name so the existing FormData converter produces an ordered string array for multiple selections.
- Group Checkbox Group with Dropdown, Radio Group, and Checkbox under the Forms `Choices` filter.
- Cover registry validation, placement, Component Library discovery, Inspector editing, editor rendering, hydration, Preview submission, required behavior, and disabled behavior.

## Out of scope

- Separate display labels and submitted values for each option.
- Nested option groups, select-all behavior, option descriptions, and per-option disabled state.
- Indeterminate or tri-state options.
- A standalone Label primitive or shared Form Field wrapper.
- Custom checkbox graphics, validation-message authoring, backend storage, email delivery, and arbitrary external endpoints.

## Risks and trade-offs

- Option labels are also submitted values in V1, matching Dropdown and Radio Group; separate values would require a future component migration and richer option editor.
- Required means at least one option must be selected. Native HTML has no group-level checkbox constraint, so the renderer applies the native `required` constraint to the first option only while no option is selected and exposes `aria-required` on the group.
- Repeated selected values intentionally serialize as an ordered array; one selected value remains a scalar under the existing FormData converter contract.
- The dependent Inspector control expands shared metadata by one control type but prevents invalid or delimiter-based persisted defaults.

## Execution state

- **Current step:** Present the completed Checkbox Group for user review.
- **Done:** Implemented the component contract, renderer, registry placement, icon, Component Library grouping and search, dependent Inspector control, styles, Form and Preview integration, tests, and architecture documentation.
- **Verification:** Passed automated, static, build, and rendered browser checks recorded below.
- **Remaining:** User review only. A standalone Label primitive and shared Form Field wrapper remain intentionally unstarted.
- **Last left off:** 2026-08-11 - Checkbox Group is implemented and verified.

## Verification

- Focused Vitest coverage passed: 7 files and 151 tests.
- Full Vitest coverage passed: 26 files and 330 tests.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` passed. The production build generated `/`, `/preview`, and `/api/form-submissions`; Next.js also emitted the pre-existing warning about the additional lockfile under the user profile.
- Rendered editor verification confirmed 8 Forms components, 4 Choices components, Checkbox Group discovery and insertion, and Inspector authoring for the group label, field name, three options, two defaults, horizontal orientation, and required state.
- Rendered canvas and Preview verification confirmed the accessible `Interests` group, shared `interests` input name, authored default selections, independent pointer and Space-key toggling, and live preservation of visitor choices.
- Required-empty verification confirmed `aria-required="true"` on the group and the native `required` constraint on only the first checkbox while the selection is empty; selecting an option removes that constraint and removing the final selection restores it.
- Preview logs contained no Checkbox Group runtime error. The only browser error was the known development hydration warning caused by the installed extension adding `cz-shortcut-listen` to `<body>` before React hydrates.
