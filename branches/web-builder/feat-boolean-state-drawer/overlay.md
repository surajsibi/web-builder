---
doc_id: WEB-BUILDER-FEAT-BOOLEAN-STATE-DRAWER-OVERLAY
type: A1
scope: Repository-specific implementation differences for web-builder feat/boolean-state-drawer
authority: Repository-specific overlay for the linked feature; code, configuration, tests, and verified runtime behavior remain authoritative
owner: Unassigned project owner
lifecycle: draft
freshness: Updated after Drawer implementation, final automated verification, and desktop/mobile browser QA on 2026-08-13; invalidated by an implementation, dependency, configuration, or verification change
---

# Repository overlay — web-builder / feat/boolean-state-drawer

## Verified repository differences

- The component registry now contains `drawer-trigger`, `drawer-panel`, and `drawer-close`, bringing the Component Library to 32 entries and the Interactions family to six entries.
- Registry editor metadata declares direct Canvas interaction generically and may require an ancestor component type; Drawer Close uses the latter for a non-mutating Inspector diagnostic.
- Drawer Trigger references Drawer Panel, Drawer Panel references Boolean State, and both page-scoped references use the shared `remap-if-target-cloned` duplication policy.
- Drawer open and close operations dispatch the generic Boolean action contract. The Drawer runtime owns only mounted DOM-layer order and activator references.
- Editor portals open panels into an artboard-local host without body locking or background isolation. Preview portals to `document.body` and applies modal focus, Escape, backdrop, isolation, scroll, and cleanup behavior.
- Focused verification passed 217 tests; the expanded Drawer runtime file passes 21 tests; the final complete branch passes 33 test files and 469 tests, TypeScript, ESLint, and the production build.
- Desktop browser QA on the branch server verifies the Canvas and Preview portal boundaries, `aria-modal`, initial and restored focus, Tab containment, Escape and backdrop close, body overflow restoration, background `inert` and `aria-hidden` restoration, and the authored layer z-index.
- Mobile browser QA at a 390×843 CSS viewport verifies artboard-local Editor containment, a clamped 320px Panel, authored z-index, usable builder chrome, body-level fixed Preview geometry without horizontal overflow, modal isolation, body locking, keyboard containment, Escape cleanup, and activator focus restoration.
- Mobile QA exposed a dialog-fallback Shift+Tab edge. The runtime now wraps both Tab directions from dialog fallback focus, and the regression suite covers it.

## Provisional assumptions

- No provisional Drawer V1 assumptions remain after desktop and mobile rendered QA. Future supported viewport changes must revalidate portal geometry and Canvas interaction.

## Constraints

- Node 24.19.x is the declared project engine. Verification passed under Node 22.21.1 with an engine warning, so the required-engine CI or maintainer environment remains the release authority.
- V1 uses immediate mount/unmount and fresh descendant runtime state; authored enter/exit transitions are excluded.
- No connected Drawer block exists because block templates do not yet provide template-local reference identity.

## Risks

- Durable documents containing the three new component types will require compatible registry definitions or an explicit migration if the feature is later rolled back.
