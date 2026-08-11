---
doc_id: WEB-BUILDER-SENIOR-REVIEW-REMEDIATION-WORKSPACE
type: D4
scope: Project-wide remediation of the 2026-08-11 senior review for the web-builder repository
authority: Selected execution-state authority for senior-review remediation; the execution plan owns intended work, while code, configuration, tests, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-11 after SRR-03 passed locally and in GitHub Actions; invalidated by an approved scope change, branch change, implementation progress, or new verification evidence
---

# Senior review remediation workspace

**Feature name:** Senior review remediation

**Feature directory identifier:** `senior-review-remediation`

**Overall status:** SRR-00 through SRR-04 are complete. SRR-05 scoped-validation equivalence design is next.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `chore/senior-review-remediation`

**Branch history:** Planning was saved on `main` at `b159f15aef531819538ccc32a877d27f7061a64f`; implementation moved to the dedicated feature branch from that commit.

**Current milestone:** Define mutation scopes and prove equivalence against full hydration before deciding whether any scoped command validation is safe under SRR-05.

**Feature summary:** Convert the 2026-08-11 senior review into independently verifiable remediation phases. Restore a reliable Node and CI baseline first, measure and improve command-path performance without weakening validation, bound history memory, make form-submission behavior honest and safe, and then address targeted correctness, coverage, preview-storage, and repository-readiness findings.

**Selected execution plan:** [Senior review remediation plan](plan/Senior-Review-Remediation-Plan.md)

## Evidence state

- Verified by checksum-verified reproduction: Node 25.2.1 produces 58 local-storage-related failures out of 349 tests in exactly the three reported suites.
- Verified by bounded inspection: `package.json` has no `engines` field, `.nvmrc` and a GitHub Actions workflow are absent, `EditorShell` subscribes without a selector, history entries retain full before/after content snapshots without a cap, preview snapshots are removed after reads, and the form route returns an accepted response without persistence.
- Verified baseline: Node 22.21.1 passes lint, typecheck, all 349 tests, and the production build.
- Verified remediation: Node 24.19.0 passes frozen installation, lint, typecheck, all 350 tests, and the production build; Node 25.2.1 also passes all 350 tests.
- Verified remotely: GitHub Actions run `31490573187` passed frozen installation, lint, typecheck, all tests, and the production build on commit `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- Verified command performance: valid duplication to a 10,000-node result improved from a 7,705.46 ms mean to 2,763.77 ms after one-set ID allocation; a 10,000-node rename remains about 1.73 seconds because full hydration still dominates.
- Not yet verified in this workspace: scoped-validation equivalence and large-document history memory behavior.

## Current execution state

- **Done:** SRR-00 established the baseline. SRR-01 pinned Node 24.19.0. SRR-02 injected preview storage and removed ambient storage use from tests. SRR-03 added and remotely verified CI. SRR-04 added deterministic benchmarks, removed the redundant tree-index pass, and replaced per-node project ID scans with one reserved set per allocating command.
- **Verification:** Node 24.19.0 passes lint, typecheck, 26 files / 351 tests, and the production build after SRR-04. The recorded five-sample benchmark shows a 64.1% reduction for duplication to 10,000 nodes.
- **Remaining:** Execute SRR-05 through SRR-10.
- **Last left off:** 2026-08-11 — SRR-04 is locally complete and fully green; next action is to design the SRR-05 mutation-scope and full-validation equivalence matrix before changing validation behavior.
