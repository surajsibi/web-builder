# Adoption plan

## 1. Adoption principles

- Begin with authority and ownership, not a mass rewrite.
- Pilot on bounded repositories and high-value journeys.
- Inventory before migration; archive duplicates instead of copying them into a
  new shape.
- Introduce blocking controls only after precision and recovery are proven.
- Measure reader outcomes and defect reduction, not document count.

## 2. Required organizational decisions

| Decision | Accountable role | Needed before |
| --- | --- | --- |
| Name Documentation Governance Owner and backup | Engineering leadership | Phase 0 exit |
| Map capability owners to real teams | Governance Owner plus repository leaders | Pilot publication |
| Approve classification and retention schedule | Security/privacy/legal authority | R2/R3 migration |
| Define supported product/doc versions | Product and release owners | Version checks |
| Select catalog and publishing authorities | Governance and platform owners | Cross-repo pilot |
| Define R2/R3 thresholds and approvers | Risk authorities | Blocking enforcement |
| Approve initial standard version and exception policy | Governance Owner | Phase 1 |
| Fund tooling ownership and support | Engineering leadership | Phase 2 |

## 3. Phased rollout

### Phase 0 — Establish authority

**Scope:** Governance only.

Actions:

1. Name owners and approve the draft for a bounded pilot.
2. Instantiate the Knowledge Domain Register for pilot scopes.
3. Choose stable IDs, catalog format, classification, retention, and supported
   versions.
4. Baseline duplicate authorities, ownerless docs, broken links, generated drift,
   high-risk runbooks, and search/task outcomes.
5. Approve pilot rollback and communication plan.

**Exit:** 100% of pilot domains have one authority and real owner; no unresolved
Critical gap; R2/R3 approval map exists.

### Phase 1 — Inventory and pilot

**Scope:** One service repository, one UI/developer-doc repository, and one
cross-repository feature journey.

Actions:

1. Map existing files to types without moving paths.
2. Add a sidecar manifest/catalog first; derive metadata where possible.
3. Resolve duplicate authorities and ownerless R2/R3 docs.
4. Pilot templates for one feature, one ADR, one runbook, and one generated
   reference.
5. Run lint in report-only mode and tune false positives.
6. Test create/update/promote/archive decisions with human and AI contributors.

**Exit:** At least 95% classification coverage for maintained pilot docs; 100%
R2/R3 owner coverage; zero duplicate active authorities; blocking-rule false
positive rate below the locally approved threshold; rollback exercised.

### Phase 2 — Integrate and enforce reliable controls

**Scope:** Pilot repositories plus shared catalog.

Actions:

1. Add manifest, authority, owner, internal-link, Markdown, generated-provenance,
   and secret checks to pull requests.
2. Require accountable review for R2/R3 paths.
3. Connect dependency invalidation to code/schema/policy changes.
4. Publish active/archived search separation and redirects.
5. Add metrics and remediation queues.

**Exit:** Reliable MUST rules block; owners receive actionable invalidation
alerts; critical publication rollback succeeds; adoption measures improve for
two review cycles.

### Phase 3 — Scale across repositories

Actions:

1. Migrate by risk and reader value, not alphabetically.
2. Establish federated repository catalogs with one organization index.
3. Add standard/tool compatibility and version migrations.
4. Train owner, author, reviewer, and AI-agent workflows.
5. Review exceptions and residual risks quarterly or on trigger.

**Exit:** Target repositories meet conformance; no unresolved High gap outside
an approved bounded pilot; search resolves the tested tasks to authoritative,
version-compatible content.

### Phase 4 — Optimize

Actions:

1. Use defect and search evidence to remove low-value content.
2. Expand deterministic generation and semantic drift detection only where
   precision is demonstrated.
3. Introduce guarded remediation for low-risk mechanical fixes.
4. Reassess taxonomy and metadata cost using actual outcomes.

**Exit:** Improvement is sustained without rising exception, false-positive, or
authoring-toil rates.

## 4. Migration priority

| Priority | Content | Reason |
| --- | --- | --- |
| P0 | Destructive runbooks, security/privacy/legal/financial procedures, duplicate authorities | Highest harm if wrong |
| P1 | Generated API/config reference, architecture authorities, migrations, current developer journeys | High drift or change coupling |
| P2 | Feature records, troubleshooting, tests, release notes | Operational and delivery value |
| P3 | Tutorials, concepts, historical research, low-use knowledge base | Lower immediate harm; use analytics before investing |

## 5. Per-document migration algorithm

1. Identify reader outcome and knowledge tuple.
2. Map to a type and current authority.
3. Verify supported version and actual usage.
4. Select: keep, update, merge, derive, archive, delete, or temporary.
5. Add/derive manifest and owner.
6. Resolve sensitive data and retention.
7. Validate links, content, rendered output, and dependencies.
8. Publish atomically; preserve stable path or redirect.
9. Verify search/discovery and record the outcome.

Do not “touch” edit dates to pass freshness checks.

## 6. Training and change management

| Audience | Required competency |
| --- | --- |
| Knowledge owners | Authority, scope/version, approval, lifecycle, and exception decisions |
| Authors | Type selection, evidence classification, concise templates, accessibility |
| Reviewers | Risk tier, technical verification, semantic and generated boundaries |
| Tool owners | Rule precision, provenance, rollback, telemetry, compatibility |
| AI users | Context loading, evidence grounding, stop conditions, no autonomous approval/deletion |
| Consumers | Report defects, identify version/scope, find canonical and archived content |

Training MUST use real pilot examples and a scored conformance exercise.

## 7. Rollback and containment

Rollback triggers include:

- blocking-rule false positives exceed the approved threshold;
- active content disappears from search or redirects break;
- generated output is published from the wrong source/version;
- owner rules prevent urgent safe changes;
- sensitive content becomes more discoverable;
- authoring lead time rises without an offsetting quality benefit.

Rollback restores the last compatible rules/tooling and publication index,
disables only the faulty control, preserves diagnostics, informs owners, and
opens a remediation record. It does not waive unaffected safety controls.

## 8. Adoption approval

The proposal is approved only for a bounded pilot until real ownership,
retention, risk, and version decisions are supplied and the High gaps in
[`11-architectural-gap-analysis.md`](11-architectural-gap-analysis.md) are
closed or explicitly contained.

