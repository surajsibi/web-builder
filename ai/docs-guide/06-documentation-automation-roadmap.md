# Documentation automation roadmap

## 1. Automation principles

Automation has four distinct modes:

1. **AI assistance:** draft, classify, compare, and propose.
2. **Deterministic generation:** derive reference from controlled sources.
3. **Continuous validation:** detect objective defects and invalidation.
4. **Guarded remediation:** apply reversible, meaning-preserving fixes.

Full autonomy is not the default target. Judgment-heavy authority, safety,
approval, retention, and deletion remain human-accountable.

## 2. Maturity model

| Level | Capability | Entry criteria | Exit criteria | Rollback |
| --- | --- | --- | --- | --- |
| M0 Manual | Templates and human review | Named pilot owners | Baseline metrics and catalog exist | Revert templates |
| M1 Assisted | AI suggestions and report-only lint | Evidence access; no autonomous publish | Suggestion acceptance/defect rates measured | Disable assistant/rule |
| M2 Deterministic | Schema-driven generation and CI checks | Reproducible sources and tool owner | Drift-free pilot, provenance, build rollback | Restore last valid artifact/tool |
| M3 Continuous | Dependency invalidation, search/index checks, dashboards | Stable IDs and dependency graph | Alerts actionable; SLOs met | Pause affected detector |
| M4 Guarded remediation | Low-risk autofix with review or bounded auto-merge | High precision, reversible patch, audit log | No semantic regressions; rollback exercised | Revert patch and disable rule |

## 3. Target automation by type

| Type | AI assistance | Deterministic generation | Continuous validation | Guarded remediation | Human authority |
| --- | --- | --- | --- | --- | --- |
| Standard/policy | Compare, draft, trace | None | Links, IDs, compatibility | Formatting only | Governance approval |
| ADR | Structure, evidence comparison | Index only | State/relationship checks | Formatting only | Decision acceptance |
| Architecture | Draft diagrams/summaries | Partial from inventories | Dependency/drift checks | Links/format only | Technical meaning |
| Interface/data guide | Examples, mapping | Reference tables where schema-owned | Contract/example compatibility | Mechanical sync only | Guidance and trade-offs |
| Generated reference | Annotation suggestions | Primary target | Drift/build/version | Regenerate only | Source and release approval |
| Feature spec/plan | Structure, gap analysis | Tracker views only | Traceability/status consistency | Formatting only | Scope/priorities |
| Research/investigation | Search, clustering, comparison | Evidence indexes | Citation/link/evidence labels | Formatting only | Conclusions |
| Tracker/report/release note | Summarize evidence | High for status/change facts | Source consistency | Low-risk factual sync | Audience framing/sign-off |
| Runbook/troubleshooting | Draft/test scaffolds | Command extraction where safe | Exercise, version, command checks | Never alter operational meaning autonomously | Safety and procedure |
| Postmortem/review | Evidence intake, theme analysis | Timeline imports | Required fields/actions | Formatting only | Findings, causality, severity |
| Tutorial/how-to/concept/KB | Draft, personalize, search analysis | Tested snippets | Links, examples, version | Formatting/link fixes | Reader outcome and accuracy |

## 4. Roadmap

### Stage A — Foundations

- Stable IDs, type registry, owner map, risk tier, supported versions.
- Repository inventory and canonical authority mappings.
- Baseline lint, link, secret, and render checks.
- Audit log and publication rollback.

**Pilot:** one repository.
**Human boundary:** all changes reviewed.
**Exit:** inventory precision ≥ approved target and no unowned R2/R3 content.

### Stage B — Deterministic reference

- Generate API, CLI, configuration, event, and schema reference.
- Attach source revision, generator version, output checksum, and product
  version.
- Compare generated output to published output in CI.

**Pilot:** one contract family.
**Exit:** reproducible builds and zero unexplained drift across two releases.

### Stage C — Continuous validation

- Dependency invalidation from code/schema/policy changes.
- Search/discovery validation, redirects, archive exclusion.
- Template/type conformance and MUST-to-rule coverage.
- Owner notifications with evidence and remediation links.

**Exit:** alert precision, mean remediation time, and owner response meet the
pilot targets for two cycles.

### Stage D — AI assistance with regression tests

- Retrieval constrained to applicable scope/version/authority.
- Statement classification and evidence links.
- Stop conditions for conflict, missing ownership, tool failure, and sensitive
  data.
- Adversarial tests from `10-ai-failure-analysis.md`.

**Exit:** no invented approvals/citations in the evaluation set and materially
lower review effort without higher escaped-defect rate.

### Stage E — Guarded remediation

Eligible fixes:

- whitespace and Markdown syntax;
- safe link redirects with verified target;
- derived metadata refresh;
- regeneration from unchanged approved sources.

Ineligible fixes:

- semantic prose changes;
- owner, risk, retention, or authority assignment;
- accepted-record edits;
- operational commands;
- archive/deletion decisions.

**Exit:** every change is reversible, auditable, scoped, and monitored.

### Stage promotion gates

| Stage | Accountable owner | Entry | Human approval boundary | Measurable exit | Rollback/containment |
| --- | --- | --- | --- | --- | --- |
| A — Foundations | DGO with Repository Maintainer | Pilot scope and owners approved | Humans approve all catalog/content changes | Owner/authority inventory and baseline checks meet Phase 0/1 criteria | Restore prior publication/index; disable faulty check |
| B — Deterministic reference | Contract Owner with Tool Owner | Reproducible source and schema review exist | Human approves source and release; output is not hand-edited | Two release runs reproduce output with zero unexplained drift | Restore last valid artifact/generator |
| C — Continuous validation | Tool Owner | Stable IDs, dependencies, and baseline precision | Human resolves semantic, authority, retention, and R2/R3 findings | Alert precision, response, and search/version checks meet approved targets for two cycles | Demote detector to report-only; clear false invalidations |
| D — AI assistance | DGO with Knowledge Owner | Constrained retrieval, provenance log, and applicable regression corpus | Human approves all meaning and all R2/R3 publication | No fabricated approval/citation in evaluation set; review effort improves without more escaped defects | Disable affected model/prompt/profile; restore human workflow |
| E — Guarded remediation | Tool Owner with DGO | M3 stable, high-precision fix class, audit and patch rollback | Auto-merge allowed only for an explicitly approved low-risk fix class | No semantic regression across pilot window; every rollback drill succeeds | Revert patch set and disable the rule |

## 5. Continuous controls

| Control | Signal | Failure action |
| --- | --- | --- |
| Source provenance | Missing/mismatched revision or generator | Block generated publication |
| Drift | Generated output differs from approved source run | Regenerate or block |
| Dependency invalidation | Authority dependency changed | Mark dependent suspect and notify owner |
| Version compatibility | Unsupported/ambiguous version | Hide from active version or block |
| Sensitive data | Secret/PII classifier or policy signal | Quarantine and escalate; no autofix disclosure |
| Rule quality | False positives/negatives | Demote faulty rule, preserve unaffected gates |
| Search/discovery | Canonical result absent or archive ranked active | Reindex/rollback |
| AI regression | Fabrication, unsafe action, missed stop condition | Disable affected workflow and investigate |

## 6. Measures

Automation is promoted only when it improves:

- defect escape rate;
- drift detection latency;
- review effort;
- generation reproducibility;
- search success;
- remediation time;

without unacceptable increases in false positives, exceptions, publication
failures, sensitive-data exposure, or authoring lead time.
