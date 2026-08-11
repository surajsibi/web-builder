# Documentation standard evolution

## 1. Ownership and compatibility contract

The Documentation Governance Owner is accountable for this standard, its type
registry, schemas, templates, linter rules, migrations, deprecations, and
exception policy. Tool Owners own implementations but cannot redefine normative
meaning.

Compatibility surfaces:

- standard ID/version and section anchors;
- type and rule IDs;
- manifest schema and lifecycle values;
- template IDs and required fields;
- catalog and dependency formats;
- generated provenance schema;
- published paths, redirects, and discovery contracts.

## 2. Version policy

Use semantic versioning for the approved standard:

| Change | Version | Examples |
| --- | --- | --- |
| Patch | `x.y.Z` | Clarification or defect correction that changes no requirement outcome |
| Minor | `x.Y.0` | Backward-compatible optional field, new non-blocking rule, new variant |
| Major | `X.0.0` | New/changed MUST, type/lifecycle semantics, removed field/type, blocking severity, incompatible path/schema |

Draft suffixes (`-draft.N`) have no adoption authority. A supposedly
“clarifying” change that changes conformance is not a patch.

## 3. Compatibility matrix

The organization catalog MUST record:

| Component | Required declarations |
| --- | --- |
| Document instance | Standard version/range and manifest schema version |
| Template | Template version, supported type IDs, standard range |
| Linter | Rule-set version, standard range, schema range |
| Generator | Generator version, source schema range, output schema, standard range |
| Publication/search | Supported manifest/catalog versions |
| AI workflow | Prompt/control version, standard range, regression-suite version |
| Repository | Adopted standard version, local extensions, migration state |

Tools MUST fail with an actionable incompatibility message rather than silently
interpreting unknown semantics.

## 4. Change process

1. Open a change proposal with problem, evidence, classification
   (E/S/P), consumers, affected surfaces, and owner.
2. Prove the need against complexity-value criteria: risk reduced or reader
   outcome improved, one canonical home, objective verification, maintenance
   owner, and no simpler existing control.
3. Analyze compatibility, repository impact, prompt/context cost, tooling,
   migration, security/privacy, accessibility, and rollback.
4. Pilot material changes against representative repositories and AI
   regression cases.
5. Perform governance, domain, consumer, and specialist review according to
   risk.
6. Approve version and publish release notes, migration, deprecation, and tool
   matrix atomically.
7. Observe adoption and defects; roll back or contain when exit thresholds
   fail.

## 5. Migration requirements

Every breaking change MUST provide:

- affected types, fields, IDs, anchors, paths, tools, repositories, and owners;
- old-to-new mapping and examples;
- detection query/linter;
- automated migration limited to meaning-preserving transformations;
- manual review requirements;
- compatibility window and enforcement date;
- redirects/adapters where possible;
- rollback/containment;
- verification and completion report.

Repositories MAY lag only through a registered, expiring migration exception.
Cross-repository consumers must continue to understand both versions during the
declared compatibility window.

## 6. Deprecation

Lifecycle:

`active → deprecated → unsupported → removed`

Deprecation requires a replacement or reason none exists, impact inventory,
owner, announcement, supported-until milestone, migration path, telemetry, and
removal gate. Deprecation does not remove historical interpretation needed for
archived instances.

Removal is prohibited while supported repositories or tools still depend on the
surface unless an approved containment explicitly constrains them.

## 7. Emergency changes

Emergency changes are allowed only to contain an active safety, security,
privacy, legal, or systemic trust failure.

Required:

- named incident/decision owner;
- exact containment and affected scope;
- minimal reversible patch;
- communication and compatible fallback;
- retained evidence;
- retrospective review within the organization-defined incident window;
- normal migration or rollback after containment.

Emergency status does not authorize silent deletion, fabricated approval, or
weaker evidence.

## 8. Review triggers

Review the standard when:

- a Critical/High documentation or AI failure occurs;
- repeated exceptions indicate an unusable rule;
- a new repository/publishing model cannot conform;
- a material regulatory/accessibility/security policy changes;
- a blocking-rule precision or authoring-toil threshold fails;
- type collisions or owner/authority gaps recur;
- supported tool/manifest versions approach end of support;
- the maximum governance review interval set at adoption expires.

## 9. Evolution metrics

Measure:

- repositories by standard version and migration state;
- time to safe adoption, not publication count;
- migration failure/rollback rate;
- incompatible tool executions;
- rule precision and exceptions by rule/age;
- conformance defects after upgrades;
- authoring/review toil;
- reader/authority outcomes affected by changes.

## 10. Rollback

Rollback restores the prior compatible standard, rule set, templates,
catalog/search behavior, and tooling versions. New instances created under the
failed version are quarantined or interpreted through a documented adapter.
Evidence and migration logs are preserved. The failed version is marked
withdrawn; version numbers are never reused.

