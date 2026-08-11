---
doc_id: WEB-BUILDER-LABEL-WORKSPACE
type: D4
scope: Web builder native Label primitive implementation state
authority: Selected execution-state authority for the Label component feature; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Active on 2026-08-11; invalidated by a related Label contract, labelable-control ID contract, placement rule, rendering behavior, or verification-status change
---

# Label component workspace

**Feature name:** Native Label Primitive

**Feature directory identifier:** `label`

**Overall status:** Implementation in progress

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Implement and verify one accessible native Label before the shared Form Field wrapper.

**Feature summary:** Add one leaf Label component that renders visible text through a native `<label>` and associates with a labelable control through an authored control ID. Keep submission field names independent from DOM IDs, migrate existing Input, Textarea, and Dropdown nodes with an empty control ID, and make Label editable through the shared Inspector, inline text editing, and style systems.

## Scope

- Add one leaf `label` component definition and Component Library icon.
- Render a native `<label>` with non-empty visible text and a valid authored `for` target.
- Add an optional explicit control ID to Input, Textarea, and Dropdown.
- Use the external visible label as the accessible name when a control ID is authored; preserve the existing `aria-label` fallback while the control ID is empty.
- Migrate existing saved Input, Textarea, and Dropdown nodes to an empty control ID without changing their current accessible name.
- Allow Label inside Form and existing general-purpose containers.
- Group Label with the Form container under the Forms `Forms` filter.
- Support Inspector editing, Canvas inline text editing, Preview focus association, hydration, and placement validation.

## Out of scope

- Automatic discovery or selection of target controls in the Inspector.
- Cross-node validation that a matching control exists or that authored DOM IDs are globally unique.
- Labeling Checkbox, Radio Group, or Checkbox Group, which already own their native label or legend relationships.
- Required or optional indicators, helper text, validation messages, and error announcements.
- The shared Form Field wrapper, automatic label/control composition, or backend submission changes.

## Risks and trade-offs

- Label-to-control association is explicit and standards-based, but authors must keep the Label target and control ID synchronized until the shared Form Field wrapper can own that relationship.
- Control IDs remain separate from form field names. This adds one Inspector field to labelable controls but avoids coupling DOM uniqueness to submission semantics.
- A control with an authored ID relies on an external visible Label for its accessible name. An empty ID preserves the existing authored `aria-label` behavior for backward compatibility.
- Cross-node reference and uniqueness validation remain deferred because the current registry validates individual node props rather than whole-document semantic references.

## Execution state

- **Current step:** Implement the Label and explicit control-ID contracts.
- **Done:** Inspected the registry, labelable controls, placement rules, Component Library grouping, inline text editing, migrations, and nearby behavior-first tests.
- **Verification:** Not yet run for Label.
- **Remaining:** Complete implementation, coverage, architecture documentation, automated checks, and rendered editor and Preview verification.
- **Last left off:** 2026-08-11 - Contract selected; implementation is in progress.
