# Documentation linter and review rules

## 1. Rule model

Every rule uses this stable schema:

```yaml
id: DOC000
title: Short stable name
requirement_ref: 01-documentation-standard.md#anchor
modality: machine | hybrid | human
severity: error | warning | advisory
scope: path/type/risk expression
detection: objective test or review question
evidence: diagnostic payload
remediation: concrete action
autofix: none | safe
waivable: true | false
introduced_in: DOC-STD version
```

Rule IDs and meanings are compatibility surfaces. Severity can be tightened only
through the evolution process.

## 2. Machine-verifiable rules

| ID | Test | Default severity | Diagnostic evidence | Safe autofix |
| --- | --- | --- | --- | --- |
| DOC001 | Maintained manifest conforms to schema | Error | Missing/invalid fields and source location | Derived fields only |
| DOC002 | `doc_id` is unique and stable | Error | Conflicting paths/IDs | No |
| DOC003 | Primary type exists in registry | Error | Unknown type and allowed values | No |
| DOC004 | Owner resolves to an active approved identity/role mapping | Error for R2/R3, warning otherwise | Owner value and lookup result | No |
| DOC005 | Exactly one authority exists per registered active tuple | Error | Domain/scope/version/period and conflicts | No |
| DOC006 | Internal links and referenced anchors resolve | Error | Source, target, status | Verified redirect only |
| DOC007 | Headings are ordered and one H1/title model is used | Error | Heading and expected level | Safe level correction only when semantics unchanged |
| DOC008 | Code fences declare a known language or `text` | Error | Fence location | Add `text` only for clearly non-code blocks |
| DOC009 | Images have non-placeholder alternative text; decorative state explicit | Error | Image path and alt value | No |
| DOC010 | Link text is not generic | Error | Link text and target | No |
| DOC011 | Generated output has source revision, generator version, product version, checksum/status | Error | Missing/mismatched provenance | Regenerate metadata from trusted build |
| DOC012 | Generated paths contain no unapproved manual edits | Error | Diff and expected generated output | Regenerate |
| DOC013 | Version/scope metadata is compatible with publication target | Error | Declared and target versions | No |
| DOC014 | Dependency change produces revalidation or `suspect/invalidated` state | Error for R2/R3, warning otherwise | Changed dependency and dependent IDs | State update only |
| DOC015 | Superseded/archive content is excluded from active defaults and has relationship/redirect | Error | Index/search result and state | Reindex if configuration is authoritative |
| DOC016 | Secret and prohibited sensitive-data scan passes | Error, non-waivable in public paths | Redacted detector/classification result | Quarantine only; never reveal in diagnostic |
| DOC017 | Exception schema is complete and not expired | Error | Rule, owner, expiry, missing control | No |
| DOC018 | Supersession and amendment links are bidirectional and target valid types | Error | Relationship endpoints | Add reverse link only with verified IDs |
| DOC019 | Published content targets a supported product/standard version | Error | Supported matrix and declared version | No |
| DOC020 | Table rows have consistent columns and headers | Error | Table/row numbers | Mechanical alignment |
| DOC021 | File path and stable catalog path do not collide case-insensitively | Error | Colliding paths | No |
| DOC022 | Required text equivalent accompanies a diagram | Error | Diagram location and missing reference | No |
| DOC023 | R2/R3 destructive command blocks declare hazard and rollback fields | Error | Command location and missing fields | No |
| DOC024 | Template instance contains required type-specific sections | Warning/Error by type/risk | Missing sections | Insert empty headings only in draft |
| DOC025 | Citation URL, source ID, and bibliography target resolve | Error | Citation and failed target | No |

## 3. Hybrid rules

Automation identifies candidates; an accountable reviewer confirms meaning.

| ID | Review | Candidate signal | Required evidence |
| --- | --- | --- | --- |
| HYB001 | Material current-behavior claims match implementation | Code/path/entity extraction or changed dependency | Verified code/schema/config/test/runtime link |
| HYB002 | No semantic duplicate authority exists | Similarity, shared domain IDs, overlapping audiences | Owner decision on scope/authority |
| HYB003 | Code and command examples are safe and valid | Compile/test/sandbox output | Environment, version, expected result, limitations |
| HYB004 | Runbook is executable, observable, and reversible | Structure plus exercise telemetry | Successful representative exercise and rollback |
| HYB005 | Accessibility semantics are adequate | Structural checks, alt-text heuristics | Rendered keyboard/screen-reader or expert review as applicable |
| HYB006 | AI-authored claims have valid provenance and classifications | AI provenance log and citation checks | Reviewer sample/full review by risk |
| HYB007 | Retention and classification are correct | Path/content classifier | Approved policy and specialist decision |
| HYB008 | Generated annotations accurately describe the implementation | Generator/schema tests | Contract-owner verification |
| HYB009 | Proposed promotion is durable and canonical | Repeated use, conclusion labels, destination candidate | Knowledge Owner acceptance |
| HYB010 | Redirect preserves reader intent and version | Link graph and title mapping | Consumer/owner confirmation for high-use paths |

## 4. Human-review rules

| ID | Required judgment | Accountable reviewer |
| --- | --- | --- |
| HUM001 | Audience, task, and “just enough” scope are correct | Knowledge Owner / Consumer Representative |
| HUM002 | Architecture, rationale, and trade-offs are technically sound | Architecture/Domain Owner |
| HUM003 | R2/R3 risk classification and mitigations are sufficient | Knowledge Owner / Risk Specialist |
| HUM004 | Causality, severity, and actions in postmortems/reviews are fair and supported | Incident/Review Owner |
| HUM005 | A standard or policy change is necessary, proportionate, and compatible | Documentation Governance Owner |
| HUM006 | Archive/delete preserves required knowledge and complies with policy | Knowledge Owner plus specialist as applicable |
| HUM007 | Conflicting authorities are resolved by an accountable decision | Documentation Governance Owner |
| HUM008 | AI stop condition can be cleared and evidence is sufficient | Role accountable for the blocked decision |

## 5. MUST-rule coverage

| Standard requirement | Control |
| --- | --- |
| One authority per tuple | DOC005 + HUM007 |
| Current behavior verified against L0 | HYB001 |
| No duplicate authority | DOC005 + HYB002 |
| Registered type and one owner | DOC003–DOC004 |
| Generated provenance/no manual edits | DOC011–DOC012 + HYB008 |
| Accessible structure/alternatives | DOC007, DOC009–DOC010, DOC020, DOC022 + HYB005 |
| AI no fabrication/approval | DOC025 + HYB006 + HUM008 + AI regression suite |
| High-risk safe commands | DOC023 + HYB003–HYB004 + HUM003 |
| Lifecycle, supersession, archive | DOC014–DOC019 |
| Sensitive data prohibited | DOC016 + HYB007 |
| Delete requires human/policy gate | HUM006; automation verifies checklist but cannot approve |

Human-only controls are used where objective automation cannot determine meaning,
accountability, proportionality, causality, or legal/policy disposition.

## 6. Execution

1. Editor/pre-commit: fast Markdown, manifest, link, and secret checks.
2. Pull request: full machine rules for changed docs and impacted dependents.
3. Scheduled: external links, identity validity, supported versions, exceptions,
   archive/search, and dependency drift.
4. Release: generated reproducibility, product-version compatibility, rendered
   output, and critical-journey validation.
5. Audit: sampled hybrid/human compliance and false-negative discovery.

Diagnostics MUST include rule ID, evidence, why it matters, exact location,
remediation, waiver route, and documentation link. Secret diagnostics MUST
redact the detected value.

## 7. Severity and rollout

- **Error:** reliable violation that can cause broken output, authority conflict,
  unsafe disclosure/action, or incompatible publication.
- **Warning:** likely defect requiring action or disposition but not precise
  enough to block.
- **Advisory:** improvement signal with no compliance effect.

New rules begin report-only, establish baseline and precision, then move to
warning. Promotion to error requires an owner, tested remediation, compatible
tooling, acceptable false-positive rate, communication, migration window, and
rollback.

## 8. Waivers

Waivers follow the exception schema in the core standard. DOC002, DOC005,
DOC012, DOC016, and human approval for R3 deletion are non-waivable unless the
standard itself defines a narrower safe exception. Suppression comments without
a registered exception are violations.

## 9. Autofix boundaries

Autofix MAY change syntax, whitespace, derived metadata, verified redirects, or
regenerate output. It MUST NOT alter meaning, evidence classification,
authority, owner, risk, lifecycle decision, operational command, accepted
record, retention, or deletion. Every autofix is a reviewable patch with tool
version and rollback.

