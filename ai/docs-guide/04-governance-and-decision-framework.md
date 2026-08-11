# Governance and decision framework

## 1. Roles

Roles describe accountability capabilities. Adoption MUST map each role to a
real team or person and define a backup.

| Role | Accountable for |
| --- | --- |
| Documentation Governance Owner (DGO) | Standard, type registry, organization catalog, exceptions, and cross-domain disputes |
| Knowledge Owner (KO) | Accuracy, authority, scope, lifecycle, and risk for one knowledge domain |
| Document Author (DA) | Evidence-based drafting and remediation |
| Technical Verifier (TV) | Reproducing and validating technical claims |
| Repository Maintainer (RM) | Repository workflow, publication, redirects, and local integration |
| Risk Specialist (RS) | Security, privacy, legal, accessibility, financial, safety, or compliance review |
| Tool Owner (TO) | Generators, schema, linter, dependency graph, and rollback |
| Incident Owner (IO) | Incident record, review, and follow-up accountability |
| Consumer Representative (CR) | Reader task, usability, findability, and feedback evidence |

AI agents are tools or delegated authors, never accountable roles.

## 2. RACI

`A` accountable, `R` responsible, `C` consulted, `I` informed. Every action has
exactly one `A`.

| Action | DGO | KO | DA | TV | RM | RS | TO | IO | CR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create/update R0–R1 content | I | A | R | R | C | C | C | — | C |
| Approve R2 domain content | I | A | R | R | C | C | C | — | C |
| Approve R3 content | I | C | R | R | C | A | C | — | C |
| Create/supersede standard | A | C | R | C | C | C | C | — | C |
| Accept/supersede ADR | I | A | R | R | C | C | — | — | C |
| Generate/publish reference | I | A | C | C | R | C | R | — | I |
| Finalize postmortem | I | C | R | R | I | C | C | A | I |
| Archive maintained content | I | A | R | C | R | C | C | — | I |
| Delete content | C | A | R | C | R | C | C | — | I |
| Approve exception | A | C | R | C | C | C | C | — | I |
| Resolve duplicate authority | A | R | C | C | C | C | I | — | I |
| Change blocking linter rule | A | C | C | C | C | C | R | — | I |

For R3 deletion or retention decisions, an approved organizational policy MAY
make the Risk Specialist accountable; the mapping must be explicit.

## 3. Ordered mutation algorithm

Every create, update, merge, promotion, archive, or deletion follows this order.

1. **Load instructions.** Read organization and repository rules for the target
   scope.
2. **Name the tuple.** Identify knowledge domain, scope, version, and validity
   period.
3. **Resolve authority.** Query the Knowledge Domain Register and retrieve the
   current authority, owner, dependents, and lifecycle state.
4. **Classify intent.** Choose one operation: correct, extend, supersede,
   derive, promote, archive, or delete.
5. **Run the duplicate test.** Search by stable ID, domain, title synonyms,
   audience/task, and authority. If a suitable instance exists, do not create.
6. **Choose type.** Apply the finite taxonomy. A new type requires governance
   approval before content creation.
7. **Collect evidence.** Separate verified facts, inference, proposal,
   hypothesis, and external practice. Record missing/conflicting evidence.
8. **Assign risk.** Use R0–R3 from the core standard; escalate to the highest
   applicable tier.
9. **Select mutation target.** Change the authority first. Derived views are
   regenerated or updated only after authority acceptance.
10. **Draft narrowly.** Make the smallest complete change; preserve stable IDs,
    paths, anchors, and compatibility unless migration is approved.
11. **Propagate/invalidate.** Update safe dependents; mark all others `suspect`
    or `invalidated` and notify owners.
12. **Validate.** Run machine, hybrid, human, rendered, type-specific, and risk
    checks.
13. **Approve.** Obtain the single accountable approval and required consulted
    reviews.
14. **Publish and observe.** Publish atomically where possible; verify discovery
    and monitor defects.
15. **Record outcome.** Update lifecycle, verification evidence, redirects,
    actions, exceptions, and metrics.

Stop immediately on duplicate authority, unknown owner for R2/R3, evidence
conflict, version ambiguity, failed safety validation, unavailable rollback, or
tool failure that makes the result unverifiable.

## 4. Creation decision tree

```text
Is there a specific reader/control outcome?
├─ No → Do not create; keep private scratch material if needed.
└─ Yes
   ├─ Does a canonical authority or suitable document already exist?
   │  ├─ Yes, same purpose/scope/lifecycle → Update it.
   │  ├─ Yes, reader needs only the fact → Link to it.
   │  ├─ Yes, deterministic transformation is required → Create a derived view.
   │  └─ Yes, genuinely different audience or lifecycle → Continue.
   └─ Can owner, type, evidence, invalidation, verification, and terminal state be named?
      ├─ No → Temporary artifact; request missing decision.
      └─ Yes → Create one instance and register it.
```

## 5. Mutation decision table

| Condition | Operation | Rule |
| --- | --- | --- |
| Existing document has same purpose, authority, scope, owner, and lifecycle | **Update** | Change in place if its profile is living. |
| New event adds chronological evidence to the single selected record | **Append** | Append only to tracker/log types whose schema preserves event identity; never append meaning changes to immutable records. |
| Two documents own the same knowledge tuple | **Merge** | Freeze both; owner selects one stable authority; reconcile verified content; redirect/supersede the other; preserve history. |
| Existing authority answers the need without a different lifecycle | **Link** | Use a descriptive, version-compatible link. |
| Temporary analysis contains verified durable knowledge | **Promote** | Update/create the canonical type, cite evidence, then archive the temporary source with a promotion link. |
| New decision changes an accepted record | **Supersede** | Create a new record; link both directions; do not rewrite history. |
| Completed/superseded content retains historical or audit value | **Archive** | Set read-only status, preserve metadata/links, exclude from active discovery. |
| Content has no authority/history value and retention permits removal | **Delete** | Human-approved dependency, legal, security, recovery, and redirect checks required. |
| Same facts are needed in another format or portal | **Derive** | Define reproducible transformation and provenance; no independent owner of copied facts. |

## 6. Merge algorithm for duplicate authorities

1. Mark both instances `authority_conflict`; block publication changes.
2. Determine the intended tuple and accountable Knowledge Owner.
3. Compare evidence, scope, versions, consumers, inbound links, and retention.
4. Select the survivor using, in order: explicit policy designation, closer
   coupling to the real authority, more stable identity, stronger verified
   evidence, then lower migration cost.
5. Reconcile facts only after verification; preserve decisions/records as
   history instead of flattening them into living prose.
6. Redirect or supersede the losing instance and migrate inbound links.
7. Run duplicate, link, version, search, and regression checks.
8. Record rationale and residual risk once.

An AI MAY produce the comparison but MUST NOT select the survivor when evidence
or authority is disputed.

## 7. Promotion algorithm

Promotion is a knowledge transition, not a file move.

| Gate | Required evidence |
| --- | --- |
| Durable value | The finding remains useful beyond the active work. |
| Verification | Implementation, schema, approved decision, test, or reproducible evidence. |
| Canonical destination | Registered knowledge domain and type. |
| Ownership | Destination owner accepts maintenance. |
| De-duplication | No existing authority is bypassed. |
| Scope/version | Valid boundary is explicit. |
| Cleanup | Temporary artifact links to the promoted authority and no longer claims primacy. |

Failure at any gate leaves the content temporary and records the missing action.

## 8. Archive decision tree

```text
Is the item still the active authority or required by supported versions?
├─ Yes → Keep maintained; fix freshness or ownership.
└─ No
   ├─ Does it preserve decision, incident, audit, delivery, or migration history?
   │  ├─ Yes → Archive with status, relationships, retention, and access controls.
   │  └─ No
   └─ Do law, policy, dependencies, or recovery needs require retention?
      ├─ Yes → Archive or quarantine as policy requires.
      └─ No → Eligible for deletion after human approval and link/tombstone decision.
```

## 9. Delete gate

Deletion is allowed only when all values are `true`:

```yaml
not_active_authority: true
supported_versions_unaffected: true
durable_knowledge_promoted_or_unneeded: true
reverse_dependencies_resolved: true
retention_satisfied: true
legal_hold_clear: true
sensitive_evidence_disposition_approved: true
human_owner_approved: true
recovery_or_rationale_recorded: true
redirect_or_tombstone_decided: true
```

Unknown is not true. Failed deletion validation restores the prior published
state and opens a defect.

## 10. Lifecycle gates

| Transition | Required gate |
| --- | --- |
| Draft → in review | Manifest, authority, owner, type, risk, evidence, and no unresolved blocking conflict |
| In review → approved/maintained | Technical validation, type checks, accountable approval, dependency registration |
| Maintained → suspect | Dependency changed or verification interval expired |
| Suspect → verified | Revalidation evidence linked |
| Suspect → invalidated | Demonstrated incompatibility or false claim |
| Active record → superseded | Accepted successor plus bidirectional relationship |
| Maintained/superseded → archived | Promotion, retention, discovery, links, and access checks |
| Archived → retired/deleted | Delete gate plus policy authority |
| Generated → published | Reproducible generation, provenance, drift and render checks |
| Published generated → invalidated | Source/generator mismatch, failed build, or unsupported version |

## 11. Scenario flows

### 11.1 Feature delivery across repositories

```text
Approved feature specification
→ one cross-repository execution plan if coordination is needed
→ repository trackers as delegated state authorities
→ implementation and tests in each repository
→ implementation report consolidates verification
→ update architecture/guides only for durable verified changes
→ generate interface reference
→ publish release note
→ archive delivery artifacts
```

No document is created for a step that an existing issue, schema, test report,
or release pipeline already owns.

### 11.2 Contract change

```text
Change schema authority
→ compatibility review
→ regenerate reference/SDKs
→ update task-oriented guide only if user workflow changed
→ run drift/link/example tests
→ publish versioned release note
```

Manual copying of field tables is prohibited.

### 11.3 Incident learning

```text
Incident evidence (restricted as needed)
→ triggered postmortem
→ factual timeline + contributing causes + actions
→ accountable review/finalization
→ actions tracked in work system
→ promote durable fixes to runbooks/troubleshooting/architecture/standards
→ archive immutable postmortem under retention policy
```

The postmortem does not become a live tracker.

### 11.4 Runbook change

```text
Automation/environment change or incident feedback
→ runbook marked suspect
→ owner updates prerequisites/steps/rollback/observability
→ representative exercise
→ R2/R3 review
→ publish and record exercise evidence
```

### 11.5 Documentation defect

```text
Reader or linter report
→ triage against authority and supported version
→ R0 wording fix or R1+ technical change
→ checks and approval
→ publish correction
→ update defect metrics and regression rule if recurring
```

## 12. Escalation and dispute handling

1. Domain owner resolves factual scope conflicts backed by evidence.
2. Governance Owner resolves type, authority-layer, and cross-domain conflicts.
3. Risk Specialist has stop authority for R3 safety, security, privacy, legal,
   financial, and compliance content.
4. Unresolved disputes remain blocked with a named decision, owner, deadline or
   trigger, containment, and residual risk.
5. An AI agent may summarize evidence but has no tie-breaking authority.

