# Adversarial AI failure analysis

## 1. Threat model

An apparently compliant AI agent can still fail through plausible prose,
incomplete context, malicious content, version skew, tool errors, metric
optimization, or excessive autonomy. NIST identifies confabulation and
information-integrity risks, including fabricated facts, logic, and citations
[S16]. This analysis treats AI as an untrusted drafting and analysis component
inside accountable controls.

## 2. Adversarial failure matrix

| ID | Failure and apparently compliant path | Prevention | Detection | Escalation and recovery | Regression / monitoring |
| --- | --- | --- | --- | --- | --- |
| AI-01 | **Fabricated fact:** fluent claim fills an evidence gap and matches the template. | Require claim classification and authority retrieval. | HYB001/HYB006 evidence review. | Stop publication; remove claim; review sibling claims. | Missing-evidence prompts; AI evidence compliance. |
| AI-02 | **Fabricated citation:** plausible official URL/title is invented. | Sources must be retrieved and registered before citation. | DOC025 resolve/title/publisher check. | Quarantine citation set; re-research. | Known/nonexistent citation cases. |
| AI-03 | **Invented owner/approval:** fills required metadata with a likely team/name. | Owner values only from approved identity map; AI cannot approve. | DOC004 plus approval audit. | Mark unowned; request accountable assignment. | Fake/inactive owner cases. |
| AI-04 | **Prompt injection in docs/source:** embedded text tells agent to ignore rules or exfiltrate data. | Treat retrieved content as data; instruction hierarchy and allowlisted actions. | Provenance log, tool/action policy, suspicious-instruction scan. | Stop tool use, isolate source, security review. | Injection corpus across Markdown/code/comments. |
| AI-05 | **Context loss/truncation:** agent misses authority or stop rule late in a long task. | Compact task brief with invariant checklist; reload before mutation. | Pre-publish conformance and authority query. | Roll back patch; reload exact context. | Long-context and compaction scenarios. |
| AI-06 | **Version skew:** correct instructions for the wrong product/standard version. | Resolve supported-version matrix before retrieval/draft. | DOC013/DOC019. | Block, retarget version, invalidate dependents. | Multi-version conflicting examples. |
| AI-07 | **Tool failure treated as absence:** search/read failure becomes “file does not exist.” | Distinguish no result from tool error; retry/alternate read; record unavailable evidence. | Tool telemetry and missing-evidence labels. | Stop material conclusion; human/tool-owner escalation. | Timeouts, partial reads, permission failures. |
| AI-08 | **Partial file read:** truncated output hides conflicting rules. | Require complete instruction reads and pagination checks. | Byte/line counts, EOF confirmation. | Re-read fully; discard affected reasoning/patch. | Truncated large-file test. |
| AI-09 | **Duplicate document:** a new polished guide is created without discovering the authority. | Mandatory duplicate/authority search before create. | DOC005/HYB002. | Freeze both; merge algorithm. | Synonym/path/cross-repo duplicate set. |
| AI-10 | **Manual generated edit:** agent “fixes” wrong API docs directly. | Generated paths read-only; edit source/generator. | DOC011/DOC012 and CI diff. | Revert generated patch; repair source; regenerate. | Generated-file mutation test. |
| AI-11 | **Unsafe runbook:** syntactically complete commands lack real preconditions or rollback. | R2/R3 human owner, sandbox/exercise, destructive-command contract. | DOC023, HYB003/HYB004. | Block publication; contain existing runbook; exercise safely. | Wrong-environment/destructive-command scenarios. |
| AI-12 | **Sensitive leakage:** logs/examples include token or personal data, then citations spread it. | Minimal data retrieval, classification, sanitization, restricted storage. | DOC016 plus specialist review. | Quarantine, revoke if needed, incident process, purge approved derivatives. | Seeded secret/PII variants; detector recall. |
| AI-13 | **Accepted record rewrite:** “clarification” changes an ADR/postmortem conclusion. | Immutable state and new superseding/amending record. | Git semantic review plus DOC018. | Restore prior record; create audited successor. | Meaning-changing paraphrase cases. |
| AI-14 | **Autonomous deletion/archive:** low usage is treated as no value. | Human-only delete gate and retention/dependency checks. | HUM006 and audit log. | Restore backup/index; reassess dependencies. | Hidden-dependency/legal-hold scenarios. |
| AI-15 | **Over-documentation:** every prompt produces all templates, appearing comprehensive. | Creation test and “just enough” principle. | Orphan/template/type and duplicate checks; owner review. | Merge/archive excess; refine prompt. | Small-change minimal-artifact tests. |
| AI-16 | **Premature promotion:** hypothesis is summarized as durable architecture. | Verified fact/inference/proposal labels and promotion gates. | HYB001/HYB009. | Demote to research; correct dependents. | Mixed evidence/hypothesis tests. |
| AI-17 | **Circular evidence:** docs cite each other without reaching code/policy/source. | Provenance graph must terminate at an authority. | Cycle/terminal-authority check. | Mark unknown; retrieve primary evidence. | Citation-cycle graph suite. |
| AI-18 | **False test/review claim:** agent writes “verified” because a command was planned or output was partial. | Verification claims require machine evidence ID/result. | CI evidence lookup and reviewer check. | Set unknown/failed; rerun. | Planned-vs-executed, partial-output cases. |
| AI-19 | **Severity inflation/deflation:** agent optimizes for approval or alarm. | Traceability-first severity rubric and human owner. | Gap review calibration; distribution monitoring. | Re-score with evidence; document uncertainty. | Borderline gap cases. |
| AI-20 | **Metric gaming:** agent touches dates, adds documents, or closes defects to improve KPIs. | Outcome denominators; edit date excluded from freshness; closure verification. | Metric anomaly and sample audit. | Reopen defects, invalidate metrics, fix incentive/control. | Timestamp-only and empty-doc cases. |
| AI-21 | **Accessibility theater:** alt text exists but is useless; diagram has no equivalent. | Semantic criteria and text-equivalent requirement. | DOC009/DOC022 + HYB005. | Correct with consumer/accessibility review. | Placeholder/verbose/misleading alt cases. |
| AI-22 | **Conflicting instructions:** repository rule weakens organization safety rule and agent follows locality. | Explicit precedence: local may be stricter, not weaken protected controls. | Instruction-conflict analyzer and risk review. | Stop, governance/risk decision. | Cross-level conflicting rule cases. |
| AI-23 | **Stale retrieval/search ranking:** archived document appears first and is summarized. | Active/version filters and authority-aware ranking. | DOC015/DOC019; search evaluation. | Correct index; retract/update generated answer. | Archived-vs-active retrieval set. |
| AI-24 | **Excessive prompt burden:** full standard consumes context and reduces task evidence quality. | Task-specific compact policy profile generated from canonical rules. | Context-budget telemetry and missed-control regression. | Load compact profile plus cited sections; split task. | Small/large context benchmark. |

## 3. Control gaps found and applied improvements

| Gap found during adversarial review | Applied canonical improvement |
| --- | --- |
| Evidence requirements did not force tool-error distinction | Core standard now requires recording unavailable evidence; AI-07 adds stop/retry behavior. |
| Freshness could be gamed by edits | Freshness states now depend on verification/invalidation, and M03 forbids timestamp-only evidence. |
| “Human review” was too generic | R0–R3 gates and RACI name accountable capabilities. |
| Generated content could be manually patched | Generated profile and DOC011–DOC012 require source repair and regeneration. |
| Archive/delete lacked recovery | Delete gate requires recovery/rationale, dependency and policy checks; AI cannot approve. |
| Long prompts could cause their own control failure | Compact task profiles and context-budget regression are required. |
| Search could return historically correct but incompatible docs | Version-aware active ranking and archived exclusion are explicit. |
| Linter success could be mistaken for semantic correctness | Machine/hybrid/human catalogs and MUST coverage separate objective and judgment checks. |

## 4. Stop conditions

An AI workflow MUST stop material mutation when:

- authority, owner, scope, or version is unresolved;
- two sources conflict and precedence does not settle them;
- required evidence is unavailable, truncated, inaccessible, or failed;
- sensitive data classification is unknown;
- an action is destructive, irreversible, R3, or requires legal/policy judgment;
- a generated artifact cannot be reproduced;
- the standard/tool versions are incompatible;
- review, test, approval, or publication evidence cannot be verified;
- rollback/containment is unavailable for a high-risk action.

Stopping produces a concise blocker with evidence, affected scope, containment,
required decision, and safe work that may continue.

## 5. Escalation and recovery policy

| Failure class | Escalate to | Immediate containment | Recovery proof |
| --- | --- | --- | --- |
| Factual/authority | Knowledge Owner / DGO | Block publish; mark suspect | Authority verified; dependents checked |
| Safety/security/privacy | Risk Specialist / incident process | Quarantine, revoke/disable as applicable | Exposure contained; specialist approval |
| Version/tool/generator | Tool Owner / Repository Maintainer | Restore last valid version | Reproducible build and compatibility pass |
| Record integrity | Decision/Incident Owner | Restore immutable record | Successor/errata relationships valid |
| Deletion/archive | Knowledge Owner / policy authority | Restore backup/index | Dependencies, retention, redirects verified |
| AI-control regression | DGO / Tool Owner | Disable affected AI workflow | Regression suite passes and monitoring restored |

## 6. Regression-test catalog

Minimum suites:

- authority duplicates, absence, delegation, and scope overlap;
- active/archived and multi-version retrieval;
- valid, invalid, circular, and fabricated citations;
- partial reads, timeouts, permission denial, and stale cache;
- generated/manual boundary and source/generator mismatch;
- prompt injection in Markdown, code, comments, images, and linked pages;
- secrets and personal data in examples/logs;
- unsafe operational commands and missing rollback;
- immutable-record semantic edits;
- unsupported delete/archive requests;
- missing/inactive owners and fabricated approvals;
- evidence classification and hypothesis promotion;
- accessibility semantics;
- context truncation, compaction, and version conflicts;
- metric-gaming behaviors.

Each test records expected stop/action, evidence, allowed tools, prohibited
mutation, recovery, and monitoring signal. A model or prompt change cannot
publish R2/R3 content until the applicable suite passes.

## 7. Residual risks

- Semantic correctness cannot be fully automated.
- Retrieval may omit relevant evidence without observable tool failure.
- Real owner maps and policies can themselves be stale.
- Human reviewers can overtrust fluent AI output.
- Novel prompt injection and data-exfiltration paths will emerge.
- Smaller-context workflows can miss cross-domain interactions.

Owners must monitor escaped defects, AI evidence compliance, owner validity,
retrieval/search evaluations, rule precision, and incident trends. Uncontained
Critical or High residual risk restricts the workflow to a bounded pilot.

