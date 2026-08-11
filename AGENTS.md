# Agent Instructions

This file is the entry point for the agent workspace rules. Detailed instructions are split across `ai/agent/` so they can be maintained and loaded by responsibility.

## Required Reading

Before planning, implementation, review, documentation, Git operations, or delegation, read these files in order:

1. `ai/agent/workspace-layout.md`
2. `ai/agent/session-workflow.md`
3. `ai/agent/context-loading.md`
4. `ai/agent/core-context-rules.md`

These files contain the workspace model, mandatory session workflow, context loading order, working principles, Git safety rules, context authority, context maintenance, and worker-context rules. Their instructions apply to every task.

## Task-Specific Reading

Read the following files before performing the corresponding work:

- `ai/agent/feature-branch-workspaces.md` when discovering, creating, loading, updating, or resuming a feature workspace or repository branch workspace.
- `ai/agent/research-and-artifacts.md` when conducting research, handling investigation artifacts, writing reports or reviews, managing assets, or archiving workspaces.
- `ai/agent/completion-and-delegation.md` when completing branches, promoting context, archiving completed work, or delegating work to another agent or worker.
- `ai/docs-guide/README.md` and `ai/docs-guide/01-documentation-standard.md` before creating, updating, restructuring, reviewing, publishing, archiving, or retiring maintained documentation.

When more than one category applies, read every applicable file. A referenced file is part of these instructions once its category applies; do not treat it as optional background documentation.

## Documentation Workflow

For every documentation task:

1. Read `ai/docs-guide/README.md`, then read `ai/docs-guide/01-documentation-standard.md` in full and follow its workflow, writing rules, safety gates, stop conditions, and verification requirements.
2. Confirm that the document should exist before creating it. Update an authoritative existing document instead of creating a duplicate whenever possible.
3. Read `ai/docs-guide/02-document-taxonomy.md` when choosing the document type, location, authority, audience, or lifecycle.
4. Read `ai/docs-guide/04-governance-and-decision-framework.md` before deciding whether to create, update, merge, link, promote, archive, or delete documentation.
5. Use the one matching file from `ai/docs-guide/templates/` when a template applies; do not generate an unnecessary bundle of documents.
6. Also read `ai/agent/research-and-artifacts.md` whenever the work includes research, reports, reviews, evidence, assets, sensitive material, or archival.

Repository-specific instructions may impose stricter documentation requirements, but they must not weaken the documentation standard's safety, evidence, authority, or verification rules. The `ai/docs-guide/` folder is an active, portable instruction dependency and must not be moved or removed unless this file and every affected reference are updated in the same change.

## Instruction Map

| File | Responsibility |
| --- | --- |
| `workspace-layout.md` | Agent workspace directory layout |
| `session-workflow.md` | Working-tree protection, branch verification, synchronization, planning, and context rebuilds |
| `context-loading.md` | Context discovery references, required loading order, and authority references |
| `core-context-rules.md` | Core principles, Git safety, context authority and discipline, worker context, and context maintenance |
| `feature-branch-workspaces.md` | Feature and repository workspace structure, discovery, initialization, file responsibilities, and progress journals |
| `research-and-artifacts.md` | Research, sensitive and temporary artifacts, reports, reviews, assets, and workspace archival |
| `completion-and-delegation.md` | Branch completion, context promotion, final archival, and the delegation-policy reference |
| `ai/docs-guide/README.md` | Portable documentation-guide entry point and installation instructions |
| `01-documentation-standard.md` | Mandatory workflow and quality standard for all maintained documentation |
| `02-document-taxonomy.md` | Document type, location, authority, audience, and lifecycle selection |
| `04-governance-and-decision-framework.md` | Documentation creation, mutation, promotion, archival, and deletion decisions |
| `templates/` | Type-specific documentation templates to use only when applicable |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
