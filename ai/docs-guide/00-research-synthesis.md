# Research synthesis

## Method and scope

This research addresses documentation architecture and governance, not the
current application. It combines:

1. Official primary guidance from Google, Microsoft, GitHub, Kubernetes, AWS,
   Google SRE, W3C, IETF, and NIST.
2. The recognized Diátaxis documentation framework.
3. A read-only audit of local workspace rules, templates, ownership files,
   generated-reference conventions, documentation folders, active workspaces,
   and archive availability.

Sources were selected for direct relevance rather than organization count.
Material claims link to [`sources.md`](sources.md). No quotations are needed;
the synthesis paraphrases the sources.

## Classification scheme

| Label | Meaning | Required treatment |
| --- | --- | --- |
| **E — Evidence-backed practice** | Directly supported by one or more sources. | Cite source IDs and preserve the supported boundary. |
| **S — Synthesis** | Derived from recurring patterns across sources or from connecting source-backed controls. | Cite inputs and state the inference. |
| **P — Organization-specific proposal** | A choice for this standard where external evidence does not determine one answer. | State rationale, trade-offs, owner/decision needed, and validation. |

These labels describe the basis of recommendations, not compliance severity.

## Recurring practices

### Design around reader intent and bounded content types

Google, Microsoft, GitHub, and Kubernetes emphasize reader goals, clarity,
direct language, and project-specific consistency. GitHub and Diátaxis define
content models that separate user needs instead of treating all prose as one
type. The shared lesson is not that one taxonomy is universally correct; it is
that types need explicit purpose and boundaries.
[[S1](sources.md#s1)–[S6](sources.md#s6),
[S17](sources.md#s17)–[S18](sources.md#s18)]

### Keep one authority and link to it

Kubernetes explicitly discourages dual-sourced content because it increases
maintenance cost and staleness. GitHub’s content model also provides reuse
mechanisms, while generated Kubernetes API reference demonstrates the value of
deriving reference material from schemas rather than manually mirroring them.
[[S4](sources.md#s4), [S7](sources.md#s7), [S11](sources.md#s11)]

### Review documentation like a maintained product

GitHub uses repository collaboration, self-review, preview rendering, and
automated checks. Its linter separates warnings from blocking errors and
provides bounded autofixes. GitHub CODEOWNERS enables path-based review
ownership. These sources support version control, review, validation, and
ownership; they do not imply that all documents need the same approval depth.
[[S8](sources.md#s8)–[S10](sources.md#s10)]

### Match lifecycle to artifact purpose

AWS treats accepted ADRs as immutable records superseded by later decisions.
Google SRE treats postmortems as triggered learning records requiring review
and action follow-through. GitHub’s linter can flag expiring content. These
different lifecycles support category-specific profiles rather than a single
“last reviewed every N days” rule.
[[S9](sources.md#s9), [S12](sources.md#s12)–[S13](sources.md#s13)]

### Automate objective checks; retain accountable judgment

GitHub’s content linter automates syntax and structure while its contribution
workflow retains technical review. NIST identifies confabulation and
information-integrity risks in generative AI, including fabricated reasoning
and citations. The combined implication is that AI may assist drafting and
checking, but may not become the unaccountable authority for project facts,
ownership, safety, approval, or deletion.
[[S8](sources.md#s8)–[S9](sources.md#s9), [S16](sources.md#s16)]

### Accessibility and normative language are system properties

WCAG provides testable accessibility outcomes for headings, labels, link
purpose, alternatives, and adaptable presentation. RFC 2119/8174 provides
precise requirement keywords and cautions against casual overuse. These support
machine checks where possible and explicit human checks where semantics are
not reliably automatable.
[[S14](sources.md#s14)–[S15](sources.md#s15)]

## Meaningful disagreements and trade-offs

| Topic | Tension | Resolution in this standard |
| --- | --- | --- |
| Four learning modes versus many engineering artifacts | Diátaxis focuses on reader mode; engineering work also needs ADRs, runbooks, incidents, plans, and release records with distinct authority/lifecycles. | Use reader modes as delivery profiles and a separate finite engineering taxonomy. Do not force operational or governance records into a learning-mode label. |
| Immutable records versus living documentation | AWS recommends immutable accepted ADRs; guides and runbooks must evolve with the system. | Lifecycle is type-specific: records are superseded, maintained guidance is updated in place, generated reference is regenerated, and temporary execution artifacts are promoted or archived. |
| Minimal metadata versus governance needs | Extra fields increase authoring cost; ownership, scope, status, and evidence are needed for safe automation. | Require a seven-field universal manifest only where a document is maintained; derive fields from path/repository where reliable. Add profile fields only when they control behavior. |
| “Just enough docs” versus enterprise traceability | Minimal content reduces search and maintenance load; regulated/high-risk changes need evidence and approval trails. | Risk-tier the gates. Low-risk docs use lightweight review; safety, security, legal, financial, and operational docs require accountable reviewers and retained evidence. |
| Reuse versus reader coherence | Reuse avoids drift but fragmented inclusions can harm readability and version clarity. | Reuse stable atomic facts only. Prefer links for independently meaningful content; validate version and scope at inclusion boundaries. |
| Scheduled reviews versus event-driven freshness | Calendars can create ceremonial edits; purely event-driven review can miss slow drift. | Use change-triggered invalidation first, backed by risk-based maximum verification intervals for high-risk maintained docs. |
| Local five-file feature package versus bounded creation | Local practice uses PRD/design/plan/log/tracker sets; requiring all files for small changes creates duplication. | Preserve the package as an optional profile; create each document only when its independent decision, audience, authority, or lifecycle passes the creation test. |

## Research evidence matrix

| Practice or claim | Classification | Supporting source(s) | Relevant families or types | Limitations or trade-offs |
| --- | --- | --- | --- | --- |
| Project-specific rules take precedence over general style guidance. | E | S1 | All maintained docs | Local rules can be stale or unsafe; conflicts still require escalation. |
| Define audience, intent, and outcome before drafting. | E | S2, S3, S5 | Guides, tutorials, concepts, plans | Requires user knowledge; absent evidence must be labeled. |
| Use a finite content model with explicit type boundaries. | E/S | S4, S6 | Taxonomy and templates | Diátaxis alone does not cover records and governance artifacts. |
| Create only enough documentation to satisfy a real user or control need. | E | S3 | All types | High-risk evidence obligations override minimalism. |
| Link to a canonical source instead of dual-sourcing it. | E | S7 | Reference, architecture, data/API docs | External authority availability and version stability must be monitored. |
| Generate deterministic reference from schemas/code/configuration where reliable. | E/S | S11, S18 | API, CLI, configuration, data reference | Generated reference can still reflect bad source annotations; validate generator and source. |
| Store maintained docs in version control and review rendered output and checks. | E | S8 | Maintained and generated docs | Collaborative documents may begin elsewhere during incidents; publish a controlled record afterward. |
| Apply machine linting with actionable diagnostics and bounded autofix. | E | S9 | Markdown, manifests, links, accessibility structure | Semantic accuracy, architecture, and risk judgment remain human/hybrid checks. |
| Assign path-based owners and optionally require their approval. | E | S10 | Repository-scoped maintained docs | CODEOWNERS maps reviewers, not knowledge authority by itself. |
| Accepted ADRs are immutable and later decisions supersede them. | E | S12 | ADR | Minor factual corrections need a narrowly defined errata policy. |
| Postmortems use predeclared triggers, blameless analysis, review, and actions. | E | S13 | Postmortem | Trigger thresholds and retention are organization-specific. |
| Accessible structure and alternatives are required quality attributes. | E | S14, S17 | All published docs and diagrams | Some WCAG checks need human evaluation and rendered-site testing. |
| Normative keywords have defined force and should be used sparingly. | E | S15 | Standards, policies, contracts | A keyword without an enforcement path creates false assurance. |
| AI can confidently produce inaccurate facts, logic, and citations. | E | S16 | AI-authored or AI-reviewed content | Risk varies by task and evidence quality; controls should be risk-based. |
| AI-generated factual content requires provenance, verification, and stop conditions. | S | S8, S16 | All AI-assisted docs | This workflow is a synthesis; effectiveness must be measured through defects and regression tests. |
| Freshness is a verification state, not merely a recent edit timestamp. | S | S8, S9, S12 | Maintained, generated, record types | Requires dependency and validation signals; not all repositories can implement them initially. |
| Every knowledge domain has exactly one authority for a given scope, version, and period. | P | S7, S10; L1 | Taxonomy, ownership register | Requires organization-specific domain mapping; exceptions for replicated availability must remain derived. |
| Use a seven-field maintained-document manifest. | P | S4, S9, S10 | Maintained docs | Metadata cost must be tested; repositories may derive some fields. |
| Risk-tier review and lifecycle gates. | S/P | S8–S10, S13–S16 | Governance | Thresholds need pilot calibration and accountable acceptance. |
| Preserve local feature templates as an optional profile rather than a universal package. | P | L2–L4, S3–S6 | Feature documents | Teams must decide when the profile is mandatory. |

## Research conclusion

The evidence supports a layered model with a single authority per knowledge
domain, bounded document types, code-adjacent review, generated reference,
type-specific lifecycle, and accountable human control over judgment-heavy
decisions. It does not establish this organization’s owners, retention periods,
risk thresholds, supported versions, or tooling budget. Those are explicit
adoption decisions, not facts to invent.
