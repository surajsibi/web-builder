---
doc_id: WEB-BUILDER-FEAT-BOOLEAN-STATE-DRAWER-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder feat/boolean-state-drawer
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Unassigned project owner
lifecycle: draft
freshness: Updated after resolving the schema-version, Button Canvas-affordance, and disabled-legacy-control PR #8 findings with full verification on 2026-08-14; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / feat/boolean-state-drawer

## Verified repository differences

- The Component Library contains 26 entries. Boolean State and the now-empty Interactions family are omitted because state creation belongs to the State Inspector tab.
- Any ordinary visual node may store a shared page-scoped visibility binding with independent On and Off Show/Hide behavior.
- The Inspector has Design and State tabs. State can atomically create and connect a Boolean State, connect an existing state, invert behavior, disconnect, and diagnose an unavailable target.
- Every unbound visual component presents optional visibility as a collapsed Always visible disclosure. Existing bindings open automatically. A newly created Boolean State starts Off with unchecked **Start visible**, and a new binding defaults to On → Show and Off → Show.
- If a connected state is missing or resolves to a non-Boolean-State node, the State tab reports it as unavailable and offers replacement or disconnection without a Component Library fallback.
- Ordinary unlinked, non-submit Buttons can Turn On, Turn Off, or Toggle a page-local Boolean State. The Button renderer uses native pointer and keyboard activation in Editor and Preview.
- Direct Canvas interaction is props-aware: only a Button with a configured state action activates its runtime behavior directly, while a Button with no state action retains drag, resize, and spacing controls.
- The Button State tab presents Button action first. Optional Button visibility defaults to a collapsed Always visible disclosure and exposes Show/Hide mapping only after deliberate connection.
- One Boolean State may control multiple components. Runtime values remain in the page rendering provider and never enter the document, history, revision, autosave, or Preview snapshot.
- Subtree and whole-page duplication remap a state binding or Button action when its target is cloned in the same transaction and preserve a valid external target otherwise.
- Project schema version 3 uses the deterministic version 1 → 2 → 3 chain. Its version 2 → 3 step migrates former State Action, Conditional Content, Drawer Trigger, Drawer Panel, and Drawer Close nodes into normal Buttons and Containers; a disabled legacy control becomes an inert Button with no state action.
- Obsolete Drawer runtime, portal, registry metadata, components, icons, styles, and focused tests were removed.

## Verification

- Full serialized regression: 34 files and 523 tests pass.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.
- Six focused migration, hydration, registry, rendering, and Canvas suites pass 165 tests.
- Real-browser Editor QA verifies create-and-connect, readable targets, inactive authoring, a root-level ordinary Button Toggle action, pointer activation, and keyboard activation.
- Browser console review found only the development hydration warning caused by Chrome's external `cz-shortcut-listen` body attribute.
- Real-browser Section QA verifies collapsed Always visible status, unchecked **Start visible**, and a connected On → Show / Off → Show Section that remains visible while its state is Off.

## Constraints

- Node 24.19.x is the declared project engine. Verification passed under Node 22.21.1 with an engine warning, so the required-engine CI or maintainer environment remains the release authority.
- The build retains the existing warning about a parent-directory lockfile outside the selected Turbopack root.
- Conditional style changes, variants, authored enter/exit animations, cross-page state, and persisted visitor state remain outside the current implementation.

## Risks

- Legacy Drawer nodes retain only the compatible state, action, content, children, and visual properties represented by ordinary Buttons, Containers, and shared visibility bindings. Drawer-specific modal behavior is intentionally removed.
