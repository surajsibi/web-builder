---
doc_id: WEB-BUILDER-FEAT-BOOLEAN-STATE-DRAWER-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder feat/boolean-state-drawer
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Unassigned project owner
lifecycle: draft
freshness: Updated after generic Boolean State connection implementation and verification on 2026-08-14; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / feat/boolean-state-drawer

## Verified repository differences

- The Component Library contains 27 entries and exposes Boolean State as the only Interactions component.
- Any ordinary visual node may store a shared page-scoped visibility binding with independent On and Off Show/Hide behavior.
- The Inspector has Design and State tabs. State can atomically create and connect a Boolean State, connect an existing state, invert behavior, disconnect, and diagnose an unavailable target.
- Ordinary unlinked, non-submit Buttons can Turn On, Turn Off, or Toggle a page-local Boolean State. The Button renderer uses native pointer and keyboard activation in Editor and Preview.
- One Boolean State may control multiple components. Runtime values remain in the page rendering provider and never enter the document, history, revision, autosave, or Preview snapshot.
- Duplication remaps a state binding or Button action when its target is cloned in the same transaction and preserves a valid external target otherwise.
- Project schema version 2 migrates the former State Action, Conditional Content, Drawer Trigger, Drawer Panel, and Drawer Close nodes into normal Buttons and Containers with shared bindings and actions.
- Obsolete Drawer runtime, portal, registry metadata, components, icons, styles, and focused tests were removed.

## Verification

- Full serialized regression: 32 files and 439 tests pass.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.
- Real-browser Editor QA verifies create-and-connect, readable targets, inactive authoring, a root-level ordinary Button Toggle action, pointer activation, and keyboard activation.
- Browser console review found only the development hydration warning caused by Chrome's external `cz-shortcut-listen` body attribute.

## Constraints

- Node 24.19.x is the declared project engine. Verification passed under Node 22.21.1 with an engine warning, so the required-engine CI or maintainer environment remains the release authority.
- The build retains the existing warning about a parent-directory lockfile outside the selected Turbopack root.
- Conditional style changes, variants, authored enter/exit animations, cross-page state, and persisted visitor state remain outside the current implementation.

## Risks

- Legacy Drawer nodes retain only the compatible state, action, content, children, and visual properties represented by ordinary Buttons, Containers, and shared visibility bindings. Drawer-specific modal behavior is intentionally removed.
