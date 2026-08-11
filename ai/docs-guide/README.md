# Portable documentation guide

**Package ID:** DOC-GUIDE
**Version:** 1.0.0-draft
**Status:** Active in this workspace; organization-wide adoption remains
subject to the gates in the standard
**Scope:** Human and AI documentation work in software projects
**Authority:** This file routes usage; `01-documentation-standard.md` contains
the canonical documentation rules
**Owner:** The adopting project must assign its accountable documentation owner
**Freshness:** Revalidate when the standard version, project instructions, or
documentation tooling changes

## Purpose

This folder is a self-contained documentation policy and template package. Keep
it at `ai/docs-guide/` so a project's root `AGENTS.md` can use the same stable
paths.

Copying this folder alone does not activate it. The destination project's root
`AGENTS.md` must explicitly require it. A ready-to-paste rule is provided in
[`AGENTS-INTEGRATION.md`](AGENTS-INTEGRATION.md).

## Required reading order

For every documentation task:

1. Read this file.
2. Read [`01-documentation-standard.md`](01-documentation-standard.md) in full.
3. Read [`02-document-taxonomy.md`](02-document-taxonomy.md) when selecting a
   document type, location, authority, audience, or lifecycle.
4. Read
   [`04-governance-and-decision-framework.md`](04-governance-and-decision-framework.md)
   before creating, updating, merging, promoting, archiving, or deleting
   documentation.
5. Select no more than the applicable template from [`templates/`](templates/).
6. Apply any stricter repository-specific instructions without weakening this
   package's safety, evidence, authority, and verification rules.

## Copy into another project

1. Copy this entire folder to `<new-project>/ai/docs-guide/` without flattening
   or renaming its contents.
2. Merge the rule in
   [`AGENTS-INTEGRATION.md`](AGENTS-INTEGRATION.md) into the new project's root
   `AGENTS.md`.
3. Reconcile the new project's existing documentation rules. Record and resolve
   conflicting authorities instead of silently choosing one.
4. Assign real owners, retention rules, supported versions, publishing
   locations, and other project-specific policy inputs before broad adoption.
5. Check that local Markdown links resolve and run the destination project's
   documentation validation.

## Package map

| Path | Purpose |
| --- | --- |
| `01-documentation-standard.md` | Canonical documentation workflow, quality, safety, lifecycle, and verification rules |
| `02-document-taxonomy.md` | Document families, types, authority boundaries, and lifecycle model |
| `04-governance-and-decision-framework.md` | Deterministic create/update/merge/link/archive/delete decisions |
| `templates/` | Reusable type-specific templates |
| `00-research-synthesis.md` and `sources.md` | Evidence and source traceability behind the design |
| `03-*` through `11-*` | Adoption, governance, quality, automation, evolution, risk, and gap-analysis support |
| `evidence/` | Design-time local evidence retained for traceability, not facts about the destination project |

## Portability rules

- Keep links inside this package relative.
- Do not add machine-specific absolute paths.
- Treat `evidence/` as design history; re-audit the destination project.
- Do not assume copied owner names, approvals, retention periods, supported
  versions, or verification results apply to the destination project.
- Update the root `AGENTS.md` and all affected links in the same change if this
  folder is moved or renamed.
