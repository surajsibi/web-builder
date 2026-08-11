---
doc_id: WEB-BUILDER-TEXTAREA-WORKSPACE
type: D4
scope: Web builder native Textarea primitive implementation state
authority: Selected execution-state authority for the Textarea component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against 299 automated tests, TypeScript, ESLint, the Next.js 16.3.0 production build, and rendered editor/Preview behavior; invalidated by a related component contract, Form placement, Inspector, rendering, submission, or verification-status change
---

# Textarea component workspace

**Feature name:** Native Textarea Primitive

**Feature directory identifier:** `textarea`

**Overall status:** Implemented and verified; awaiting user review

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Review the editable Textarea primitive in the Component Library, Inspector, editor Canvas, Preview, and native Form submission path.

**Feature summary:** Add one leaf Textarea component for multiline string values. Persist authored configuration in the project document, preserve the visitor's live value, submit the named value through existing native FormData semantics, and keep the control editable through the shared Inspector and style systems.

## Scope

- Add one leaf `textarea` component definition and Component Library icon.
- Render a native `<textarea>` with an explicit accessible name.
- Expose field name, placeholder, authored default value, row count, required state, and disabled state.
- Preserve a visitor's live value across unrelated renderer updates and adopt a changed authored default.
- Allow Textarea inside Form and existing general-purpose containers.
- Submit named, enabled Textarea values through the existing native FormData path.
- Group Textarea with Input under the Forms `Inputs` filter.
- Cover registry validation, placement, Component Library discovery, Inspector editing, editor rendering, hydration, and Preview submission.

## Out of scope

- A standalone Label primitive or shared Form Field wrapper.
- Autosizing, character counters, minimum or maximum length, wrap modes, and validation-message authoring.
- Visitor-authored values in persisted project state.
- Backend submission storage, email delivery, and arbitrary external endpoints.

## Risks and trade-offs

- Row count controls the intrinsic height only while authored sizing remains automatic; an explicit authored height takes visual precedence.
- Native drag-resizing is disabled so browser-local dimensions cannot diverge from persisted builder styles.
- Visible labels remain deferred; Textarea follows Input and Dropdown by using its authored accessible label as `aria-label`.

## Verification

- Focused serialized Vitest run: 5 files and 114 tests passed across the component registry, Component Library, editor, hydration, and Preview.
- Full serialized Vitest run: 26 files and 299 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed with Next.js 16.3.0; routes `/`, `/preview`, and `/api/form-submissions` built successfully. The build retained the existing Turbopack workspace-root warning about the unrelated `C:\Users\Suraj\pnpm-lock.yaml`.
- Rendered editor verification at `http://localhost:3000/`: the Forms family reported six entries; the Inputs filter reported Input, Textarea, and Password reveal; Textarea inserted as one native control and exposed accessible label, field name, placeholder, multiline default value, row count, required, and disabled controls.
- Rendered Canvas and Preview verification: a configured Textarea rendered as a native `<textarea>` named `message`, retained its two-line authored and visitor values, used six rows, remained required, and computed `resize: none`. The editor Textarea measured 1024 × 156 px at the tested desktop viewport.
- Browser console: the editor reported no warnings or errors. Preview reported only an existing Chrome-extension `postMessage` error from `chrome-extension://cjdnfmjmdligcpfcekfmenlhiopehjkd`; no application-authored error was observed.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Added the Textarea contract, native renderer, default styles, icon, registry entry, Form placement, Component Library grouping and search aliases, Inspector controls, architecture update, and regression coverage.
- **Verification:** Focused and full automated tests, TypeScript, ESLint, the production build, and rendered editor/Preview checks passed. The Preview browser console contained only the documented external Chrome-extension error.
- **Remaining:** User review only.
- **Last left off:** 2026-08-11 — Textarea implementation and verification complete; the native multiline primitive is ready for review before shared visible-label work.
