---
doc_id: WEB-BUILDER-CANVAS-STUDIO-NAME-WORKSPACE
type: D4
scope: Web builder Canvas Studio product and default-project naming correction execution state
authority: Selected execution-state authority for the Canvas Studio naming corrections; code, tests, and verified runtime behavior remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified on 2026-08-11 against the isolated visible-toolbar assertion, focused ESLint, and a current-source stale-name search; invalidated by a related metadata title, editor brand label, initial project name, test expectation, or verification-status change
---

# Canvas Studio naming workspace

**Feature name:** Canvas Studio naming corrections

**Feature directory identifier:** `Canvas Studio`

**Overall status:** Naming corrections implemented and verified; awaiting user review.

**Participating repositories:** None detected. The implementation is scoped to the standalone web-builder source tree at the workspace root, which does not contain Git metadata.

**Active branches:** Not applicable.

**Current milestone:** Replace the generic initial project name with `Make It Yours` and verify the visible toolbar result.

**Feature summary:** Keep the intended `Canvas Studio` product name in application metadata and the editor brand, and use `Make It Yours` as the motivating initial project name shown beneath it.

## Scope

- Correct the static page title.
- Correct the visible editor toolbar brand.
- Replace the generic initial project name with `Make It Yours`.
- Update the existing observable UI assertion for the intended name.

## Out of scope

- Naming changes beyond the approved `Canvas Studio` brand and `Make It Yours` initial project name.
- Layout, styling, interaction, or persistence changes.

## Verification

- Focused Vitest run: `editor-shell.spec.tsx` passed all 33 tests.
- Exact stale-text search: the accidental spelling no longer appears outside generated and dependency directories.
- The first sandboxed test attempt could not read an installed `undici` file because of Windows `EPERM`; the identical test passed when rerun with permission to access the existing dependency tree.
- Isolated default-name assertion: the toolbar rendered `Make It Yours` and the test passed.
- Focused ESLint for `editor-store.ts` and `editor-shell.spec.tsx`: passed.
- Current-source search: the former generic project name no longer appears under `src/`.
- Broader editor-shell run after concurrent Password preset work: 34 tests passed and the unrelated Password reveal status assertion failed because it received `No change was needed.` after the reveal action instead of retaining the insertion message.

## Execution state

- **Current step:** Complete; awaiting user review.
- **Done:** Corrected the static metadata title and visible editor toolbar brand, changed the initial project name to `Make It Yours`, and added an observable toolbar assertion.
- **Verification:** The isolated naming assertion and focused ESLint passed, and the former generic name is absent from current source. One unrelated concurrent Password preset assertion remains failing in the broader editor-shell file.
- **Remaining:** User review only for this naming change; the unrelated Password reveal status test remains outside this task.
- **Last left off:** 2026-08-11 — The editor toolbar now shows `Make It Yours` as the initial project name beneath `Canvas Studio`.
