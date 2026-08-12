---
doc_id: WEB-BUILDER-DEVELOPER-GUIDE
type: L2
scope: Local setup, verification, and repository orientation for web-builder 0.1.0 contributors
authority: package.json, .nvmrc, source code, and CI own executable behavior; this guide owns the contributor onboarding procedure
owner: Repository maintainer
lifecycle: maintained
freshness: Verified on 2026-08-12 against Node 24.19.0, pnpm 10.33.0, and the current package scripts; invalidated by toolchain, script, route, or contributor-workflow changes
---

# Web Builder

Run and verify a local Next.js 16 visual website builder with a structured component tree, responsive style data, drag-and-drop editing, preview, and bounded undo/redo history.

## Audience and scope

This guide is for contributors working on the `web-builder` repository. It covers local setup, the primary development commands, repository orientation, and current product boundaries. [Project architecture and product direction](Project.md) contains the deeper design context.

## Prerequisites

- Node.js 24.19.0. The supported range is `>=24.19.0 <25`; [.nvmrc](.nvmrc) records the exact development version.
- pnpm 10.33.0, as declared by `packageManager` in [package.json](package.json).
- A browser supported by Next.js 16 for manual editor and preview checks.

## Set up and run locally

1. Install the pinned dependencies:

   ```sh
   pnpm install --frozen-lockfile
   ```

2. Start the development server:

   ```sh
   pnpm dev
   ```

3. Open `http://localhost:3000`. The root route hosts the editor. Use its Preview action to open a snapshot of the current page.

Preview snapshots use browser storage, remain reusable across refreshes, and are limited to the 10 newest builder snapshots. Preview forms are intentionally non-persistent: entered values are neither saved nor sent, and the form-submission API returns an unavailable response.

## Verify a change

Run the same project checks defined by the [CI workflow](.github/workflows/ci.yml):

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For active test development, use `pnpm test:watch`. Deterministic performance evidence can be reproduced with:

```sh
pnpm benchmark:commands
pnpm benchmark:history
```

Successful verification means lint and type checking report no errors, all Vitest files pass, and Next.js produces a production build.

## Repository orientation

- [src/app](src/app) — Next.js routes, global styles, and the fail-closed form endpoint.
- [src/builder/commands](src/builder/commands) — the canonical document-mutation executor and command contracts.
- [src/builder/project](src/builder/project) — hydration, migrations, tree validation, cloning, and slug rules.
- [src/builder/registry](src/builder/registry) — component and block definitions, defaults, schemas, and renderers.
- [src/builder/store](src/builder/store) — Zustand editor state and bounded history.
- [src/builder/ui](src/builder/ui) — editor shell, canvas, inspector, layers, and drag interactions.
- [src/builder/preview](src/builder/preview) — isolated preview snapshots and preview rendering.
- [workspaces](workspaces) and [branches](branches) — governed feature and branch execution context; these are not runtime application code.

Tests are colocated in `__tests__/` directories. Add behavior-focused coverage next to the public module being changed.

## Common failures

- An engine warning usually means the shell is using a Node release outside `>=24.19.0 <25`. Activate the version in `.nvmrc`, then reinstall.
- A frozen installation failure means `package.json` and `pnpm-lock.yaml` disagree. Update the lockfile intentionally with the supported pnpm version.
- “Preview unavailable” means the snapshot is missing, invalid, or browser storage rejected the write, commonly because storage is disabled or full.
- Next.js may warn about a lockfile outside the repository when an ancestor directory contains another `pnpm-lock.yaml`; the repository lockfile remains the installation authority.

## Security and distribution status

Author-controlled links, image sources, props, styles, and project documents pass through runtime validation before hydration or rendering. Do not bypass the command executor or hydration pipeline when adding document mutations or import paths.

This repository does not currently include a software license. The project owner must select and add one before permissions for external reuse or distribution are represented. A Content Security Policy is also not enabled; introducing one requires a separately reviewed policy compatible with Next.js runtime behavior and the builder's controlled inline style rendering.

## Maintenance

Update this guide when `.nvmrc`, `package.json` scripts or versions, application routes, preview behavior, repository layout, CI gates, or the distribution/security decisions change. Verify every command on the supported Node version before publishing the update.
