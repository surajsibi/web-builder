# Local documentation audit

**Date:** 2026-07-24
**Scope:** Agent workspace plus documentation-related files in `platform` and
`arvasit-ui`
**Classification:** Verified local evidence, except where explicitly labeled
as an inference

## Baseline and limitations

The workspace instructions require context loading from `ai/context.md` and
`ai/learned-rules.md`, but neither file exists. The root contains older context
files, but the active instructions do not name them as authoritative, so this
audit does not treat them as baseline context.

The root is not a valid Git working tree. Both product repositories were
inspected read-only; neither participates in this governance-only deliverable.
No claim was made about branch freshness.

## Existing rules and conventions

| Evidence | Verified observation | Implication for the proposed standard |
| --- | --- | --- |
| `AGENTS.md` and `ai/agent/*.md` | Verified implementation is authoritative; feature research, plans, reviews, reports, and assets have distinct workspace homes; branch execution state is separate from durable knowledge. | Preserve source-of-truth precedence and lifecycle separation. Do not create a competing context layer. |
| `platform/docs/templates/` | Templates exist for PRD, design, execution plan, decision log, tracker, and weekly sync. | Treat these as local specializations of bounded document types, not as universal proof that every feature needs every file. |
| `platform/docs/architecture/decisions/template.md` | ADRs include context, decision, consequences, alternatives, related records, and status. | Keep ADRs immutable after acceptance and supersede them with a new record. |
| `platform/docs/changelog/template.md` | Change records connect files, architecture decisions, contracts, business logic, tests, and related PRs/issues. | Keep release/change evidence distinct from durable explanatory documentation. |
| `platform/docs/` directory families | Current folders include architecture, API, audits, changelog, diagrams, features, operations, research, and runbooks. | The finite taxonomy should map these practices to explicit families and authority boundaries. |
| `platform/docs/api/contracts/README.md` and `platform/docs/api/flows/README.md` | Contract maps and API-flow docs are declared generation targets, but some entries remain “to be generated.” | Generated status must be machine-verifiable; labels alone are insufficient evidence of generation or freshness. |
| `platform/docs/diagrams/sequence/README.md` | Sequence diagrams are described as generated from source by an agent. | AI output still needs provenance, deterministic inputs where possible, and verification against implementation. |
| `platform/api/proto`, OpenAPI, and generated SDK layout documented in `platform/docs/folder-structure.md` | Schemas and generated artifacts already have code/configuration authorities. | Human documentation must link to generated reference instead of duplicating fields and signatures. |
| `platform/.github/CODEOWNERS` | Ownership covers encrypted environment files only, not documentation paths. | Documentation has no repository-enforced owner mapping in the inspected file. This is an ownership gap, not permission to invent owners. |
| `arvasit-ui/apps/arvasit-ui-docs/docusaurus.config.ts` | The docs site fails on broken links and provides search, but repository/organization settings are still placeholder values. | Broken-link checks are reusable evidence; deployment and ownership maturity must not be inferred from scaffolding. |
| `platform/docs/research/README.md` | The index contains lifecycle and maintenance claims, including archival, update frequency, and named role owners. | Existing claims need implementation or governance verification before promotion to organization-wide policy. |
| `workspaces/` and `archive/` | No active feature workspace or archive entry for a documentation standard was found. | `documentation-standard` is a new, user-identified feature workspace rather than a merge with existing work. |

## Conflicts and design decisions

### Output-contract placement

The source prompt requested a `documentation-standard/` artifact tree. The
active workspace rules required the draft and its supporting documentation to
begin under a feature workspace. After review, the reusable package was
promoted to `ai/docs-guide/`, where it can act as a stable agent dependency and
be copied into another project. The feature workspace retains the research,
review, and completion history.

### Existing templates versus a universal taxonomy

The local platform uses a five-document feature set in many feature folders.
The proposed standard will not mandate all five documents for every change.
Instead, the creation decision uses distinct purpose, owner, authority, audience,
and lifecycle tests. Local teams may retain their package as a profile when the
work justifies it.

### Generated documentation claims

Local indexes call some documentation generated while also containing
unfulfilled placeholders. The standard therefore requires generated artifacts
to expose source input, generator version, generation time or source revision,
and reproducible validation. An unverified “generated” label is not sufficient.

## Unavailable organizational decisions

The following cannot be established from local evidence:

- The accountable documentation governance owner.
- Real team names for domain and repository ownership.
- Required retention periods for incidents, security records, and regulated
  content.
- The publishing platform and search analytics that should be authoritative.
- Supported product and documentation version ranges.
- Compliance classifications and legal-hold requirements.

The standard models these as required registers or policy inputs and blocks
high-risk enforcement until accountable owners supply them.
