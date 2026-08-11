---
doc_id: WEB-BUILDER-DROPDOWN-WORKSPACE
type: D4
scope: Web builder native Dropdown, Form container, and runtime submission implementation state
authority: Selected execution-state authority for the dropdown and form-submission feature; code and tests remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 after the scoped Dropdown focus-style correction, focused registry tests, type checking, linting, production build, and Canvas/Preview browser validation; invalidated by a related implementation, contract, verification, or review-status change
---

# Dropdown component workspace

**Feature name:** Native Dropdown Primitive

**Feature directory identifier:** `dropdown`

**Overall status:** Form-container, runtime-submission, and Dropdown focus-style follow-ups implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the native Form, Dropdown, submit Button, and Preview submission workflow.

**Feature summary:** Extend the native Dropdown primitive with a Form container and explicit submit-button behavior. Preserve authored configuration in the project document, collect live named controls through native `FormData` semantics only at runtime, suppress network submission in the editor, and validate the same-origin backend request envelope.

## Scope

- Add one leaf `dropdown` component definition and library icon.
- Render a native `<select>` with native `<option>` children and an accessible name.
- Remove the shared purple focus outline from the authored Dropdown in Canvas and Preview without changing focus treatment for editor controls.
- Let users edit each string option in an individually labeled input row, add new rows, and remove existing rows while preserving at least one option.
- Validate non-empty unique options and require any non-empty default value to reference an option.
- Clear the authored default value when its referenced option is removed.
- Cover registry behavior, schema rejection, Component Library insertion, Inspector editing, and document state.
- Add a native Form container that accepts form content without permitting nested forms.
- Add explicit submit behavior to Button while migrating existing Buttons to non-submitting behavior.
- Serialize named string controls at submit time, preserving repeated names as arrays.
- Suppress submissions in the editor and send preview submissions to the same-origin backend route.
- Expose accessible pending, success, and error submission feedback.
- Log serialized submission values only in the non-production browser console for local inspection.
- Validate backend submission envelopes without logging or persisting visitor values.

## Out of scope

- Custom popover menus, combobox search, multi-select, option groups, remote data, conditional logic, file uploads, and separate display labels or values.
- Durable submission storage, email delivery, authentication, anti-spam services, arbitrary external endpoints, and published-site hosting integration.

## Verification

- `pnpm test -- --fileParallelism=false src/builder/registry/__tests__/component-registry.spec.tsx`: 1 file and 41 tests passed after the focus-style correction.
- `pnpm test -- --fileParallelism=false src/builder/preview/__tests__/preview-shell.spec.tsx`: 1 file and 8 tests passed after the non-production console-log follow-up.
- Previous full regression run, before the logging-only follow-up: `pnpm test -- --fileParallelism=false` passed 25 files and 240 tests.
- `pnpm typecheck`: passed after the focus-style correction.
- `pnpm lint`: passed after the focus-style correction.
- `pnpm build`: passed after the focus-style correction with Next.js 16.3.0 and exposed dynamic `/api/form-submissions` and `/preview` routes. Next.js reported the existing workspace-root warning for `C:\Users\Suraj\pnpm-lock.yaml`.
- Browser validation: the Component Library exposes Form and Dropdown in Forms; a Dropdown and submit Button can be placed inside Form; editor activation stays on the editor without submission feedback; Preview submits `Option two` and announces `Thanks! Your submission was received.` During the focus follow-up, a keyboard-focused authored Dropdown computed to `outline-style: none` and `outline-offset: 0px` in both Canvas and Preview, while the editor's Active page select retained the shared 3px focus outline. The earlier Chrome session also reported a hydration warning caused by the external `cz-shortcut-listen` body attribute injected by an installed extension; the mismatch did not originate in application markup.

## Risks and trade-offs

- The authored Dropdown no longer presents the shared custom focus outline, as requested. This reduces its visible keyboard-focus indication; the exception is limited to Dropdown rendering, and editor/Inspector controls keep their existing focus outline.
