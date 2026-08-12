---
doc_id: WEB-BUILDER-COMPONENT-LIBRARY-CATEGORIES-WORKSPACE
type: D4
scope: Component-library category refactor for the web-builder repository
authority: Selected execution-state authority for this refactor; code, configuration, tests, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Updated after full local verification on 2026-08-12; invalidated by a branch, scope, implementation, or verification change
---

# Component library categories workspace

**Feature name:** Component library categories

**Feature directory identifier:** `component-library-categories`

**Overall status:** Implementation and full local verification complete; awaiting review and commit.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `refactor/component-library-categories`

**Current milestone:** Review and checkpoint the verified category refactor.

**Feature summary:** Keep Form as the sole Forms entry; move Standard Input, Textarea, and the password-input preset to Inputs; move Checkbox, Checkbox Group, and Radio Group to Choices; move Dropdown to Selectors; and place Label under Typography. Preserve insertion, drag-and-drop, rendering, serialization, hydration, inspector, and validation behavior.

## Verification evidence

- Node 24.19.0 passes the focused Component Library suite: 1 file / 28 tests.
- Node 24.19.0 passes TypeScript typechecking and full ESLint validation.
- Node 24.19.0 passes the complete Vitest suite: 32 files / 414 tests.
- Node 24.19.0 passes the Next.js 16.3.0 production build.
