---
doc_id: WEB-BUILDER-CHECKBOX-WORKSPACE
type: D4
scope: Web builder native Checkbox primitive implementation state
authority: Selected execution-state authority for the Checkbox component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against 312 automated tests, TypeScript, ESLint, the Next.js 16.3.0 production build, and rendered editor/Preview behavior; invalidated by a related component contract, Form placement, Inspector, rendering, submission, or verification-status change
---

# Checkbox component workspace

**Feature name:** Native Checkbox Primitive

**Feature directory identifier:** `checkbox`

**Overall status:** Implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the accessible Checkbox in the Component Library, Inspector, editor Canvas, Preview, and native Form submission path before beginning Checkbox Group or shared visible-label work.

**Feature summary:** Add one leaf Checkbox component that owns a visible label and a native checked state. Persist authored configuration in the project document, preserve the visitor's live checked state, submit the configured named value only while checked, and keep the control editable through the shared Inspector and style systems.

## Scope

- Add one leaf `checkbox` component definition and Component Library icon.
- Render a native checkbox wrapped by its visible `<label>`.
- Expose the visible label, optional field name, submitted value, authored default checked state, required state, and disabled state.
- Preserve a visitor's live checked state across unrelated renderer updates and adopt a changed authored default.
- Allow Checkbox inside Form and existing general-purpose containers.
- Use native successful-control semantics so unchecked, unnamed, and disabled controls are omitted from `FormData`.
- Group Checkbox with Dropdown and Radio Group under the Forms `Choices` filter.
- Cover registry validation, placement, Component Library discovery, Inspector editing, editor rendering, hydration, and Preview submission.

## Out of scope

- Checkbox Group, multi-option authoring, and custom group validation.
- Indeterminate or tri-state behavior.
- A standalone Label primitive or shared Form Field wrapper.
- Custom checkbox graphics, validation-message authoring, backend storage, email delivery, and arbitrary external endpoints.

## Risks and trade-offs

- Native forms omit an unchecked Checkbox instead of submitting `false`; consumers must distinguish an absent key from a checked configured value.
- Repeated checked controls with the same field name serialize as ordered arrays through the existing FormData converter.
- The visible label and submitted value are intentionally separate, which adds one Inspector field but prevents presentation copy from becoming an accidental API contract.
- A standalone label association system remains deferred because this component owns its native label relationship.

## Verification

- Focused serialized Vitest run: 6 files and 129 tests passed across the component registry, Component Library, editor, hydration, Preview, and FormData conversion.
- Full serialized Vitest run: 26 files and 312 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed with Next.js 16.3.0; routes `/`, `/preview`, and `/api/form-submissions` built successfully. The build retained the pre-existing Turbopack root warning about the ignored home-directory lockfile.
- Rendered editor verification at `http://localhost:3000/`: the Component Library reported seven Forms entries, the `Choices` filter exposed Dropdown, Radio Group, and Checkbox, insertion created one selected `checkbox` node, and the Inspector successfully authored the visible label, field name, independent submitted value, default checked state, and required state.
- Rendered Preview verification: the native control exposed the accessible name `Accept terms`, retained `name="terms"`, `value="accepted"`, and required semantics, loaded checked from its authored default, toggled off through pointer activation, and toggled on through the Space key.
- Browser console: no Checkbox runtime error appeared. Development Preview retained the previously documented hydration warning caused by the Chrome extension-injected `cz-shortcut-listen` body attribute; application markup does not provide that attribute.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the Checkbox contract, native labeled renderer, independent submitted value, default styles, icon, registry entry, Form placement, Component Library `Choices` integration, Inspector controls, architecture update, and regression coverage.
- **Verification:** All focused and full automated, static, build, and rendered browser checks passed. The unrelated Chrome-extension hydration warning remains observable in development Preview.
- **Remaining:** User review only; Checkbox Group and shared visible-label work remain deliberately unstarted.
- **Last left off:** 2026-08-11 — Checkbox implementation and verification complete; Checkbox Group and shared visible-label work have not started.
