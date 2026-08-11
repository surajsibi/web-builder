# Final design review

## 1. Review outcome

The proposal is internally coherent and traceable enough for a bounded pilot,
but organization-wide approval is intentionally withheld. It defines one
authority per knowledge tuple, a finite taxonomy, distinct lifecycle profiles,
deterministic mutation decisions, risk-tiered governance, machine/hybrid/human
validation, compatible evolution, AI recovery controls, and measurable
outcomes.

The proposal cannot establish real owners, retention/classification rules,
supported versions, production tooling, or analytics from the available
evidence. Those are High adoption gaps, not placeholders to fill with invented
facts.

## 2. Requirements review

| Requirement | Review result | Canonical location |
| --- | --- | --- |
| Evidence-backed research and matrix | Pass | `00`, `sources.md` |
| Universal standard and profiles | Pass | `01` |
| Finite taxonomy and ontology | Pass: 22 types, variants consolidated | `02` |
| Authority, ownership, cardinality | Pass by design; organization mapping pending | `01` §§3–5; `02` §§3,6–7 |
| Create/update/merge/link/promote/archive/delete | Pass | `04` §§3–9 |
| Multi-repository governance and RACI | Pass by design | `01` §12; `04` §§1–2 |
| Lifecycle and maintenance | Pass | `01` §10; `02` §§8–10 |
| Automation roadmap and rollback | Pass by design; implementation pending | `06` |
| Exact success metrics | Pass; baselines pending | `07` |
| Linter and review rules | Pass by design; precision testing pending | `08` |
| Standard evolution and compatibility | Pass | `09` |
| Adversarial AI analysis | Pass: 24 scenarios plus regression/recovery | `10` |
| Requirements traceability and gap analysis | Pass | `11` |
| Type-specific templates | Pass; concise and linked to universal rules | `templates/` |
| Design integration, not parallel second standard | Pass | Accepted changes were applied to canonical files and listed in `11` §6 |

## 3. Assumptions and unavailable evidence

- Capability roles can be mapped to real, durable team identities.
- Repositories can emit change, validation, and publication events.
- Contract sources are structured enough for deterministic reference
  generation.
- A catalog can resolve cross-repository IDs, versions, owners, and
  dependencies.
- Legal, security, privacy, and compliance authorities will supply retention
  and classification rules.
- Representative readers can participate in task/search evaluations.

If an assumption fails, the affected control remains manual or the rollout
scope must shrink. The proposal does not claim that local templates, generated
indexes, or the Docusaurus scaffold prove mature organization adoption.

## 4. Real weaknesses and scaling limits

### Metadata and catalog cost

Seven universal fields plus dependency and compatibility data can become
expensive. Derivation and sidecars reduce repetition, but a catalog creates a
platform and ownership obligation. The pilot must remove metadata that does not
control behavior or answer a real query.

### Authority granularity

Exactly one authority is simple only after knowledge domains are well bounded.
Overly broad domains centralize ownership; overly narrow domains create catalog
sprawl. The standard provides cardinality but cannot preselect the correct
organizational boundaries.

### Semantic validation

Machine checks can prove structure, links, provenance, and some compatibility;
they cannot generally prove that an explanation is correct or a postmortem’s
causal analysis is fair. Hybrid expert review remains costly and can still fail.

### Federated discovery

Cross-repository IDs and catalogs preserve authority but do not automatically
produce good search. Version-aware ranking, access control, and archive
exclusion require a real platform and evaluation corpus.

### AI control burden

The complete standard is too large to load indiscriminately for every small
task. Compact, signed task profiles reduce context load but add generator and
version risks. The invariant checklist must remain present, and profile
equivalence needs regression testing.

### Small-team fit

A small team may combine multiple capability roles. That is acceptable for
R0/R1 work, but R3 separation-of-duties requirements can exceed its capacity.
The safe response is to reduce R3 scope or obtain external review, not to invent
approval.

## 5. Trade-offs and subjective decisions

| Decision | Benefit | Cost / alternative |
| --- | --- | --- |
| 22 engineering types plus variants | Covers distinct authority/lifecycle needs without unbounded names | More complex than four Diátaxis modes; a smaller set would blur records, operations, and delivery |
| One primary type per instance | Deterministic lifecycle and validation | Mixed articles need a dominant purpose or linked companions |
| Seven-field manifest | Enables ownership, authority, lifecycle, and automation | Authoring cost; mitigate by derivation/sidecar |
| Immutable accepted records | Preserves decision/incident history | Corrections require errata or successor records |
| Risk-based review | Keeps low-risk changes lightweight | Classification judgment and potential inconsistency |
| Event-driven freshness plus maximum intervals for high risk | Avoids ceremonial edits while catching slow drift | Requires dependency telemetry and policy thresholds |
| Pilot-only approval | Prevents paper governance from masquerading as enforcement | Delays organization-wide standardization |

## 6. Accepted improvements

The integration review accepted and applied:

- exact authority cardinality and duplicate-resolution behavior;
- explicit freshness states tied to evidence;
- a complete delete gate with recovery and retention;
- AI handling for context loss, tool failure, prompt injection, version skew,
  and search ranking;
- standard/tool/template/AI compatibility declarations;
- rule rollout precision, waiver expiry, and autofix boundaries;
- metric denominators, action thresholds, limitations, and anti-gaming;
- compact AI task profiles as a controlled evolution item;
- explicit pilot constraints for unresolved High gaps.

These changes live in their canonical artifacts; this review does not redefine
them.

## 7. Deferred improvements

| Improvement | Why deferred | Trigger |
| --- | --- | --- |
| General semantic drift automation | Reliability and false assurance are unproven | Domain evaluation meets approved precision/recall |
| Guarded auto-remediation beyond syntax/regeneration | Meaning and authority risk | M3 controls and rollback are stable |
| Enterprise search architecture | Platform and analytics choices unavailable | GAP-09 owner and budget assigned |
| Numeric enterprise targets | No baseline or denominator-quality evidence | One pilot release cycle measured |
| Mandatory standardized feature bundle | Conflicts with “just enough” and small-change cost | Evidence shows bundle improves outcomes |
| Universal review intervals | Risk and change rates differ | Organization policy supplies risk-specific maxima |

## 8. Rejected alternatives

- Treat every README or local filename as a separate document type.
- Require all templates for every feature or change.
- Duplicate API/schema fields manually for readability.
- Use `last_updated` as freshness proof.
- Let an AI agent assign owners, approve content, resolve authority disputes, or
  delete records.
- Rewrite accepted ADRs/postmortems to reflect the latest view.
- Keep all historical content active in search.
- Make all linter rules blocking on first rollout.
- Optimize success by document count, word count, edits, or closure volume.
- Copy a public organization’s style guide as policy without local authority and
  fit analysis.

## 9. Compatibility impact

Existing paths and templates need not move immediately. Each maintained instance
can be mapped through a sidecar catalog. Breaking moves occur only when duplicate
authority or unsafe publication cannot be resolved in place; they require
redirects and migration evidence.

The local PRD/design/execution-plan/decision-log/tracker package remains a valid
profile when each artifact has independent purpose and lifecycle. It is not a
universal minimum.

Generated platform reference must transition from claims such as “to be
generated” to verifiable provenance and drift checks before it can satisfy the
generated-reference profile.

## 10. Open decisions

1. Who owns DOC-STD and its backups?
2. Which teams own each pilot knowledge domain?
3. What information classifications, retention periods, holds, and secure
   evidence stores apply?
4. Which product and documentation versions are supported?
5. What repositories and reader journeys form the pilot?
6. What publication catalog/search platform is authoritative?
7. What false-positive, authoring-toil, task-success, and remediation targets
   permit control promotion?
8. Which R3 domains require separation of duties or external review?

## 11. Final recommendation

Adopt the model as a proposed standard and run the bounded pilot defined in
`03-adoption-plan.md`. Do not declare organization-wide compliance until the
four unresolved High gaps in `11-architectural-gap-analysis.md` are closed or
explicitly contained with accountable acceptance.

