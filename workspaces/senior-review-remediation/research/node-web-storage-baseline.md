---
doc_id: WEB-BUILDER-NODE-WEB-STORAGE-BASELINE
type: D2
variant: investigation
scope: Node-runtime compatibility of the web-builder Vitest/jsdom suites at the start of senior-review remediation
authority: Reproduction commands and captured output own this investigation record; package configuration, test code, and runtime behavior remain authoritative
owner: Project owner
lifecycle: concluded
freshness: Verified on 2026-08-11 after the storage fix passed the complete suite on Node 24.19.0 and Node 25.2.1; invalidated by Node, Vitest, jsdom, test setup, browser-storage, or affected-suite changes
---

# Investigation: Node web-storage test failures

## Impact and scope

The existing suite passes on the installed Node 22 runtime but fails on Node 25.2.1 when Vitest/jsdom tests access `window.localStorage`. The failure affects all tests in three files and prevents the repository from advertising an unqualified modern-Node development experience.

Affected test files:

- `src/builder/preview/__tests__/preview-shell.spec.tsx`
- `src/builder/preview/__tests__/preview-snapshot.spec.ts`
- `src/builder/ui/__tests__/editor-shell.spec.tsx`

This investigation covers runtime and test-environment behavior only. It does not establish application behavior in a real browser or benchmark the editor command path.

## Reproduction

Repository state:

- Branch: `chore/senior-review-remediation`
- Starting commit: `b159f15aef531819538ccc32a877d27f7061a64f`
- Operating system: Microsoft Windows NT 10.0.26200.0
- pnpm: 10.33.0

Installed Node 22.21.1 baseline:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Observed results:

- ESLint passed.
- TypeScript passed.
- Vitest passed 26 files and 349 tests in 74.45 seconds.
- Next.js 16.3.0 production build passed. It reported the existing Turbopack-root warning for the unrelated lockfile above the repository.

Node 25.2.1 reproduction:

1. Download the official `node-v25.2.1-win-x64.zip` and `SHASUMS256.txt` files from `https://nodejs.org/dist/v25.2.1/` into a temporary directory.
2. Verify the archive SHA-256 against the signed release checksum list.
3. Prepend the extracted Node directory to `PATH` for the test process.
4. Confirm `node --version` reports `v25.2.1`.
5. Run `pnpm test` without changing dependencies or test configuration.

Observed result:

- 23 files and 291 tests passed.
- 3 files and 58 tests failed.
- The run took 184.36 seconds.
- Primary failures reported that `window.localStorage.clear`, `setItem`, or `getItem` is not a function.
- Node emitted: ``Warning: `--localstorage-file` was provided without a valid path``.

## Evidence timeline

| Time/order | Evidence | Source | Interpretation |
| --- | --- | --- | --- |
| 1 | Node 22.21.1 passed lint, typecheck, 349 tests, and build | Local commands at the starting commit | The repository is green on the installed runtime |
| 2 | Node 25.2.1 failed exactly 58 tests in three storage-using files | Checksum-verified local reproduction | The senior-review failure count and affected scope are reproduced |
| 3 | Every primary failure reports missing Storage methods on `window.localStorage` | Vitest failure output | The failures share one storage-environment cause rather than 58 independent behavioral regressions |
| 4 | Node 25 exposes web storage without the earlier opt-in and returns an empty object when no local-storage file is configured | [Node 25 global-object documentation](https://nodejs.org/dist/latest/docs/api/globals.html#localstorage) | Node's runtime global can conflict with jsdom storage initialization |
| 5 | Node 24 keeps web storage behind `--experimental-webstorage` | [Node 24 global-object documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/globals.html#localstorage) | Pinning Node 24 contains contributor variance but does not remove the test's dependency on ambient globals |
| 6 | Node 24 is LTS and Node 25 is end-of-life as of 2026-08-11 | [Node.js release status](https://nodejs.org/en/about/previous-releases) | Node 24 is the appropriate supported baseline; Node 25 remains useful as a compatibility reproduction |
| 7 | Next.js 16 requires Node 20.9 or newer | `node_modules/next/dist/docs/01-app/01-getting-started/01-installation.md` and `node_modules/next/package.json` | Node 24 satisfies the framework requirement |

## Hypotheses

| Hypothesis | Supporting evidence | Contradicting evidence | Status |
| --- | --- | --- | --- |
| The 58 tests contain unrelated behavioral regressions | Failures occur across editor and preview suites | All primary failures use the same absent Storage methods; Node 22 passes every test | Eliminated |
| Node 25's built-in web-storage global displaces the jsdom Storage implementation used by these tests | Exact failure count reproduced; methods are absent; Node warning and official runtime behavior align | The internal Vitest/jsdom property-installation path was not instrumented | Confirmed at the runtime boundary; internal mechanism need not be relied upon by the fix |
| Pinning Node alone is sufficient | Node 22 passes and Node 24 does not enable storage by default | Current and future Node releases expose web storage differently, so tests remain coupled to ambient runtime globals | Eliminated as a complete fix |
| An injected storage dependency plus an isolated test implementation removes the collision | Storage helpers already accept narrow Storage interfaces | Not yet implemented or verified | Open; selected remediation |

## Root cause or conclusion

The suite depends on `window.localStorage` being the jsdom Storage implementation. Under Node 25.2.1, the test environment exposes an inert object at that property, so setup/cleanup and preview-snapshot operations fail before or during otherwise unrelated tests. The 58 failures are downstream effects of one ambient-global collision.

Node 24 LTS is the correct supported baseline for repository and CI consistency, but the durable fix is to stop tests and testable modules from depending on whichever storage object the host runtime installs.

## Resolution and verification

Implemented resolution:

1. `.nvmrc` pins Node 24.19.0 and `package.json` declares `>=24.19.0 <25`.
2. `EditorShell` and `PreviewShell` accept narrow preview-storage dependencies while resolving real `window.localStorage` lazily at their client-only event/effect boundaries.
3. Storage-related tests use an isolated Map-backed implementation instead of an ambient runtime global.
4. `.github/workflows/ci.yml` runs frozen installation, lint, typecheck, tests, and build on the pinned runtime.

Verification results:

- Node 22.21.1 focused gate: ESLint, TypeScript, and 59 affected tests passed; the engine warning is expected because Node 22 is outside the selected runtime range.
- Node 25.2.1 focused gate: 3 files and 59 affected tests passed without the previous storage warning.
- Node 25.2.1 full gate: 26 files and 350 tests passed in 64.78 seconds.
- Node 24.19.0 CI-equivalent gate: frozen installation, lint, typecheck, 26 files / 350 tests, and production build passed.
- The first remote GitHub Actions run remains pending an authorized commit and push.

## Durable knowledge

The supported Node and CI contract now lives in executable configuration. Storage-environment behavior remains in tests and code rather than a duplicated long-lived guide. Consider promoting a concise preventive rule only after the first remote CI run confirms the workflow.
