# Architectural gap analysis

## 1. Scope, baseline, and method

The baseline is the proposed standard in this artifact set plus the local audit
and external research. Organizational owner maps, retention/classification
policies, supported versions, production documentation tooling, and analytics
were unavailable. The analysis therefore tests design completeness and
adoption readiness separately.

Procedure:

1. Map every required dimension to its canonical control.
2. Test authority and cardinality invariants.
3. Test entry, transition, feedback, failure, and terminal lifecycle paths.
4. Map each MUST to machine, hybrid, or accountable human enforcement.
5. Reuse AI adversarial cases.
6. Consolidate root gaps, score impact/likelihood/scope/detectability/
   reversibility/time-to-harm, and apply design fixes.
7. Constrain rollout where organization-specific gaps cannot be closed here.

## 2. Requirements-to-controls traceability

| Requirement dimension | Authoritative rule/artifact | Accountable capability | Enforcement/review | Evidence/input | Output |
| --- | --- | --- | --- | --- | --- |
| Architecture and layering | `02` §§2–3 | DGO | DOC005, conformance review | Catalog and authorities | Layer/domain mappings |
| Knowledge ownership/authority | `01` §§3–5; `02` §§6–7 | Knowledge Owner/DGO | DOC004–DOC005, HUM007 | Domain register/identity map | One authority and owner per tuple |
| Information flow/lifecycle | `02` §§8–9; `04` §§3,10 | Knowledge Owner | DOC014–DOC019, lifecycle review | Change/dependency events | Verified transitions/status |
| Taxonomy/ontology/templates | `02` §§1,4–5; `templates/` | DGO | DOC003, DOC024 | Type registry | Classified instances |
| Create/update/merge/promotion/archive/delete | `04` §§3–9 | Knowledge Owner/DGO | Decision algorithm, HUM006–HUM007 | Authority/dependency/retention data | Auditable mutation |
| Human/AI responsibilities | `01` §8; `10` | DGO/Knowledge Owner | HYB006, HUM008, regression suite | Provenance and evidence logs | Safe assist/stop/escalation |
| Governance/approval/escalation | `04` §§1–2,12 | DGO/Risk Specialist | RACI and risk gates | Owner/role map | Accountable approvals |
| Generated versus handwritten | `01` §§6.4, 8; `06` | Contract/Tool Owner | DOC011–DOC012, HYB008 | Source/generator revisions | Reproducible reference |
| Multi-repository discovery/linking | `01` §12; `02` §§2,7 | DGO/RM | DOC006, DOC013, DOC015, DOC019 | Federated catalog | Compatible canonical discovery |
| Maintenance cost/review triggers | `02` §10; `01` §10 | Knowledge Owner | Dependency/scheduled checks | Change and verification events | Risk-based maintenance |
| Automation/rollback | `06` | Tool Owner | Stage exit checks and controls | Precision, drift, rollback tests | Promoted/contained automation |
| Success metrics | `07` | Metric owners | Metric definitions and audits | Governed event stream | Actions/dashboards |
| Machine/hybrid/human validation | `08` | DGO/Tool Owner/KO | Rule catalogs | Repository/catalog/render data | Diagnostics and approvals |
| Evolution/backward compatibility | `09` | DGO | Compatibility matrix/migration gates | Version/tool inventory | Versioned standard/migration |
| AI failure prevention/recovery | `10` | DGO/Tool Owner | Stop conditions/regression | Adversarial corpus | Containment/recovery evidence |
| Security/privacy/accessibility/retention | `01` §§7.4,9,11 | Risk Specialist | DOC009–DOC010, DOC016, HYB005/HYB007 | Policy and rendered checks | Safe classified content |
| Adoption/migration/training | `03` | DGO/leadership | Phase entry/exit and rollback | Pilot baseline | Governed rollout |
| Gap analysis and remediation | This document | DGO | Closure criteria and residual register | Traceability/control tests | Approval constraint |

All requested dimensions have a canonical rule, but several depend on
organizational inputs not available in this task.

## 3. Invariant and lifecycle test results

| Test | Result | Evidence |
| --- | --- | --- |
| Exactly one authority per tuple | Designed; organization instantiation pending | `02` §§3,6–7; DOC005 |
| One owner and primary type per instance | Designed; real identities pending | `01` §4; DOC003–DOC004 |
| Generated views cannot own facts | Pass by design | `01` §§3,6.4; DOC011–DOC012 |
| Temporary-to-durable promotion is gated | Pass by design | `04` §7 |
| Living, immutable, generated, temporary, and discovery lifecycles have terminal paths | Pass by design | `02` §9 |
| Every objectively verifiable MUST has a machine/hybrid control or documented human reason | Pass by design | `08` §5 |
| Archive/delete includes retention, dependencies, recovery, and human approval | Pass by design; policy pending | `04` §§8–9 |
| AI failures have prevention, detection, escalation, recovery, regression, monitoring | Pass by design | `10` §§2–6 |
| Cross-repo compatibility has versions and migration | Pass by design; catalog tooling pending | `09` |

## 4. Architectural Gap Analysis Matrix

| Gap ID | Area and gap type | Missing, weak, or conflicting capability | Evidence | Affected knowledge, artifacts, users, or repositories | Severity | Why it matters | Impact if unresolved | Likelihood and detectability | Recommended solution | Alternatives and trade-offs | Effort and dependencies | Owner | Validation and closure criteria | Status | Residual risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-01 | Authority/ownership gap | No real DGO or knowledge-owner map exists. | Local audit; DOC004 cannot resolve identities. | All maintained docs; highest risk for R2/R3 | High | One authority rule cannot be accountable without real owners. | Conflicts, stale docs, blocked decisions, false approvals. | Certain; easy to detect in catalog. | Leadership names DGO/backups; DGO instantiates domain/owner map and repository delegation. | Decentralized ownership without central map is cheaper initially but leaves cross-repo disputes unresolved. | Medium; leadership and identity data. | Engineering leadership → DGO | 100% pilot domains and R2/R3 instances resolve to active owners/backups; dispute drill passes. | Open; pilot constraint | Human turnover and ownership lag. |
| GAP-02 | Safety/compliance gap | Classification, retention, legal-hold, and approved archive policies are unavailable. | Local audit; standard deliberately omits durations. | Incidents, logs, security/privacy, regulated docs, deletion | High | Unsafe retention or deletion can expose data or destroy required evidence. | Privacy/security/legal failure and irreversible loss. | Likely in enterprise use; may be detected late. | Risk authorities approve policy, storage classes, retention schedule, hold and deletion workflow; wire HYB007. | Keep everything avoids deletion loss but increases exposure/cost; delete early creates irreversible risk. | High; legal/security/privacy/storage. | Risk Specialist/policy authority | Policy approved; R2/R3 sample lifecycle and legal-hold drill pass; delete recovery verified. | Open; R2/R3 blocked | Jurisdiction/product-specific exceptions. |
| GAP-03 | Compatibility/migration gap | Supported product/doc versions and repository compatibility inventory are unknown. | No local version policy; `09` requires matrix. | Generated reference, guides, cross-repo links, tools, AI retrieval | High | Correct content for the wrong version is operationally incorrect. | Bad integration/migration steps and search results. | High in multi-repo systems; detectable only with version metadata. | Product/release owners declare support windows; inventory repositories/tools; implement DOC013/DOC019. | “Latest only” is simpler but abandons supported users and history. | Medium/high; release and catalog data. | Product/Release Owners | All pilot docs/tools declare compatible versions; wrong-version regression tests pass. | Open; pilot constraint | Emergency hotfix/version lag. |
| GAP-04 | Enforcement gap | Proposed catalog, linter, provenance, dependency, search, and rollback controls are not implemented. | Local Docusaurus has broken-link check only; no standard toolchain found. | All repositories and publication paths | High | Paper MUSTs do not reliably prevent drift or unsafe publication. | Inconsistent adoption and undetected defects. | Certain initially; visible through missing checks. | Implement `06` M0–M2 pilot; start report-only; promote precise rules; exercise rollback. | Manual reviews avoid tooling cost but do not scale and are less auditable. | High; tooling owner, CI, catalog. | Tool Owner/DGO | Pilot exit criteria met; blocking precision approved; rollback drill passes. | Open; pilot only | Semantic defects remain human-dependent. |
| GAP-05 | Scalability/cost gap | Seven-field manifest and 22-type taxonomy are untested with real contributors. | Design synthesis; no pilot results. | Authors, reviewers, small teams | Medium | Excess process could cause bypasses and stale metadata. | Adoption friction and exception growth. | Medium; detectable through toil/exception metrics. | Use sidecar/derived metadata; pilot representative small/large changes; remove fields/types that do not control behavior. | More metadata improves automation but compounds upkeep. | Medium; pilot and metrics. | DGO/Consumer Representative | M16 within approved tolerance; type agreement and exception targets met. | Open | Some domains need extensions. |
| GAP-06 | Measurement gap | No baselines, targets, analytics, or denominator-quality evidence exists. | `07` defines but cannot populate metrics. | Success decisions, search, adoption, tooling promotion | Medium | Improvement and harm cannot be demonstrated. | Vanity metrics, stalled remediation, premature automation. | Certain; immediately detectable. | Instrument pilot events, validate denominators, baseline a release cycle, approve risk-segmented targets. | Surveys are cheaper but insufficient alone; full telemetry raises privacy/toil concerns. | Medium; analytics/privacy. | Metric owners/DGO | Data-quality audit passes; baselines and action thresholds approved. | Open | Sparse usage and privacy limits. |
| GAP-07 | Enforcement/evidence gap | Semantic drift and claim-to-code verification remain mostly hybrid. | HYB001; no reliable general semantic validator. | Architecture, guides, troubleshooting, AI-authored facts | Medium | Syntactic compliance can mask false meaning. | Plausible but wrong docs. | Medium/high; often detected by expert or incident. | Dependency mapping, sampled technical review, executable examples, AI evidence evaluation; automate narrow domains only after precision proof. | Full LLM semantic checks broaden coverage but add non-determinism and false assurance. | High/ongoing; domain instrumentation. | Knowledge/Tool Owners | Escaped-defect trend improves; evaluation set precision/recall meets approved target. | Accepted residual/roadmap | Novel semantic drift remains. |
| GAP-08 | Recovery/safety gap | Approved storage and archival path for raw sensitive evidence is undefined. | Local audit and workspace rules prohibit guessing. | HAR/logs/screenshots/postmortem evidence | Medium | Ordinary archives may be inappropriate for secrets/personal data. | Exposure, retention breach, lost evidence. | Medium; classification may be late. | Define restricted evidence store, access, sanitization, retention, and archive/disposal workflow. | Sanitized-only storage lowers risk but can lose forensic detail. | Medium/high; security/storage/policy. | Risk Specialist | Restricted-store procedure tested; sample sanitized/raw flows pass. | Open; raw evidence blocked | Provider and jurisdiction constraints. |
| GAP-09 | Usability/discovery gap | Canonical publication platform, federated search, and ranking behavior are undecided. | Local UI docs site exists but is placeholder-like; root/platform docs are separate. | Readers and AI retrieval across repositories | Medium | Correct docs that cannot be found do not serve users; wrong ranking can return archives. | Search failure and stale AI answers. | High in multi-repo use; measurable once instrumented. | Select catalog/search authority; implement active/version/authority ranking and evaluation set. | Central portal improves discovery but adds platform ownership; federated search is complex. | High; platform/search/analytics. | DGO/Tool Owner/CR | Critical-journey search-success targets and archived-content tests pass. | Open | Search intent ambiguity. |
| GAP-10 | Scalability/usability gap | Full standard and prompt size may crowd out task evidence for AI agents. | AI-24; long multi-artifact standard. | AI-assisted work and review | Medium | Context loss can defeat the controls the prompt contains. | Missed rules, weak evidence, fabricated completion. | Medium/high; difficult without regression telemetry. | Generate signed task profiles from canonical rules; load only applicable types/risk; retain invariant checklist; regression test compaction. | Always load everything maximizes explicitness but consumes context and attention. | Medium; tooling and evaluation. | DGO/AI Tool Owner | Compact profiles produce identical required decisions on regression set with lower context use. | Open | Cross-domain edge cases. |

## 5. Severity rationale and prioritization

- **Critical: 0 unresolved.** Potentially Critical deletion, sensitive-data, and
  systemic-authority failures are contained by explicit blocking gates and
  pilot-only approval. If those gates are bypassed, the affected capability is
  not approved.
- **High: GAP-01–GAP-04.** They are likely to produce wrong, unowned,
  incompatible, or unenforced documentation across important domains. They
  block broad rollout but can be studied in a bounded, explicitly owned pilot.
- **Medium: GAP-05–GAP-10.** Each materially affects maintainability,
  measurement, semantic correctness, discovery, or scale, but has a practical
  bounded workaround and no demonstrated immediate systemic harm under the
  pilot constraints.
- **Low: none recorded.** Cosmetic issues were intentionally excluded from an
  architectural gap register.

## 6. Amendments applied to the proposed standard

| Before review | Gap/control test | Applied amendment |
| --- | --- | --- |
| Ownership named only as a principle | GAP-01 | RACI now gives exactly one accountable capability per mutation; broad adoption requires real mappings. |
| Retention was a generic lifecycle concern | GAP-02/GAP-08 | Core and delete gate now block on approved policy, legal hold, sensitive-evidence disposition, and recovery. |
| Versioning focused on documents | GAP-03 | Compatibility matrix now covers instances, templates, linters, generators, publication, AI workflows, and repositories. |
| Automation roadmap lacked explicit promotion safety | GAP-04 | Each maturity level now has entry/exit and rollback; blocking rules require precision proof. |
| Freshness could be measured by date | AI-20 | Four evidence states and M03 exclude timestamp-only proof. |
| AI control assumed complete context | GAP-10/AI-24 | Task-specific compact profiles and context regression are required. |
| Archive ranking was implicit | GAP-09/AI-23 | Active/version-aware ranking and archive exclusion are explicit linter/search controls. |
| MUST enforcement mapping was diffuse | Enforcement coverage test | `08` now maps objective MUSTs and documents human-only judgment. |

## 7. Unresolved-gap and residual-risk register

| Gap | Pilot containment | Required decision/trigger |
| --- | --- | --- |
| GAP-01 | Pilot owner assigned before any maintained publication | Leadership owner appointment |
| GAP-02 | No R2/R3 deletion or sensitive publication without specialist | Approved policy |
| GAP-03 | Pilot declares one explicit product/standard range | Support-window decision |
| GAP-04 | Human review plus report-only tooling; no claimed enterprise enforcement | M0–M2 exit |
| GAP-05 | Sidecar metadata; collect toil/exception evidence | Pilot review |
| GAP-06 | Label metrics unavailable until baseline; no target claims | One release-cycle data |
| GAP-07 | Technical verifier required; no autonomous semantic approval | Precision evaluation |
| GAP-08 | Raw sensitive evidence not moved to ordinary archive | Approved secure store |
| GAP-09 | Use explicit catalog links in pilot; no enterprise search claim | Platform selection |
| GAP-10 | Load invariant checklist plus relevant sections | Compact-profile evaluation |

## 8. Remediation roadmap

| Priority | Gaps | Owner | Dependencies | Closure milestone |
| --- | --- | --- | --- | --- |
| 1 | GAP-01 | Engineering leadership/DGO | Organization decision | Pilot authority map |
| 1 | GAP-02, GAP-08 | Risk authorities | Classification, retention, storage | R2/R3 policy and drill |
| 1 | GAP-03 | Product/Release Owners | Version inventory | Compatible pilot range |
| 1 | GAP-04 | Tool Owner/DGO | CI/catalog/publisher | M2 pilot exit |
| 2 | GAP-05, GAP-06 | DGO/Metric Owners | Pilot users and telemetry | Baseline/adoption review |
| 2 | GAP-09 | DGO/Platform/CR | Catalog and analytics | Search journey target |
| 3 | GAP-07, GAP-10 | KO/AI Tool Owner | Evaluation corpora | Semantic/context promotion gates |

## 9. Before-and-after verification

After amendments:

- traceability covers every requested architecture dimension;
- all types have authority, owner capability, lifecycle, automation target,
  maintenance cost, and review trigger;
- every lifecycle profile has entry, transitions, feedback, failure, terminal,
  and retention behavior;
- every objective MUST maps to a rule or documented human judgment;
- AI scenarios map prevention, detection, escalation, recovery, regression, and
  monitoring;
- no Critical gap remains within the approved pilot scope;
- unresolved High gaps are explicit pilot constraints with owners and closure
  tests.

Actual linter, generator, search, rollback, and runtime tests were not performed
because those systems do not yet exist for this standard. Their results are not
claimed.

## 10. Approval statement

**Decision:** Architecturally coherent for a bounded design/pilot; **not
approved for broad organizational rollout**.

No unresolved Critical gap remains in the designed pilot controls. Four
unresolved High gaps—real ownership, retention/classification, supported
versions, and enforcement tooling—constrain adoption to an explicitly governed
pilot until their closure criteria are verified.
