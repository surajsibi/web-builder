---
doc_id: WEB-BUILDER-REFACTOR-COMPONENT-LIBRARY-CATEGORIES-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder refactor/component-library-categories
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Project owner
lifecycle: draft
freshness: Updated after full local verification on 2026-08-12; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / refactor/component-library-categories

## Verified repository differences

- One ordered `FAMILY_CONFIG` owns component-family order, labels, descriptions, and icons.
- Forms contains only the `form` component.
- Inputs contains the `input` and `textarea` components plus the `input-password-reveal` preset block.
- Choices contains the `checkbox`, `checkbox-group`, and `radio-group` components.
- Selectors contains the `dropdown` component.
- Label is categorized under Typography.
- Sidebar counts remain derived from the live library entries and expose accessible labels such as `Forms (1)`.

## Constraints

- Component type keys, block type keys, templates, schemas, migrations, renderers, placement rules, inspector definitions, and command payloads remain unchanged.
- Registry category display values use the existing title-case convention; lowercase identifiers remain internal sidebar-family IDs.

## Risks

- Category-name search intentionally reflects the new taxonomy, so querying `Forms` no longer returns controls that now belong to Inputs, Choices, or Selectors.
