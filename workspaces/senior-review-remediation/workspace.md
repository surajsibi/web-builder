---
doc_id: WEB-BUILDER-SENIOR-REVIEW-REMEDIATION-WORKSPACE
type: D4
scope: Project-wide remediation of the 2026-08-11 senior review for the web-builder repository
authority: Selected execution-state authority for senior-review remediation; the execution plan owns intended work, while code, configuration, tests, and verified runtime behavior own implemented behavior
owner: Project owner
lifecycle: draft
freshness: Updated on 2026-08-12 after SRR-07 passed remotely and SRR-08 passed its focused and full local verification gates; invalidated by an approved scope change, branch change, implementation progress, or new verification evidence
---

# Senior review remediation workspace

**Feature name:** Senior review remediation

**Feature directory identifier:** `senior-review-remediation`

**Overall status:** SRR-00 through SRR-07 are complete. SRR-08 focused correctness and interaction work is locally complete and awaiting checkpoint/remote CI verification.

**Participating repositories:** `web-builder`

**Active branches:** `web-builder`: `chore/senior-review-remediation`

**Branch history:** Planning was saved on `main` at `b159f15aef531819538ccc32a877d27f7061a64f`; implementation moved to the dedicated feature branch from that commit.

**Current milestone:** Checkpoint and remotely verify SRR-08, then begin the risk-based coverage and repository-readiness work in SRR-09.

**Feature summary:** Convert the 2026-08-11 senior review into independently verifiable remediation phases. Restore a reliable Node and CI baseline first, measure and improve command-path performance without weakening validation, bound history memory, make form-submission behavior honest and safe, and then address targeted correctness, coverage, preview-storage, and repository-readiness findings.

**Selected execution plan:** [Senior review remediation plan](plan/Senior-Review-Remediation-Plan.md)

## Evidence state

- Verified by checksum-verified reproduction: Node 25.2.1 produces 58 local-storage-related failures out of 349 tests in exactly the three reported suites.
- Verified by bounded inspection: `package.json` has no `engines` field, `.nvmrc` and a GitHub Actions workflow are absent, `EditorShell` subscribes without a selector, history entries retain full before/after content snapshots without a cap, preview snapshots are removed after reads, and the form route returns an accepted response without persistence.
- Verified baseline: Node 22.21.1 passes lint, typecheck, all 349 tests, and the production build.
- Verified remediation: Node 24.19.0 passes frozen installation, lint, typecheck, all 350 tests, and the production build; Node 25.2.1 also passes all 350 tests.
- Verified remotely: GitHub Actions run `31490573187` passed frozen installation, lint, typecheck, all tests, and the production build on commit `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- Verified command performance: valid duplication to a 10,000-node result improved from a 7,705.46 ms mean to 2,763.77 ms after one-set ID allocation; a 10,000-node rename remains about 1.73 seconds because full hydration still dominates.
- Verified remotely: GitHub Actions run `31492155602` passed the complete SRR-04 matrix on commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.
- Verified scoped validation: all command kinds and generated node-cap/depth-cap failures match full hydration; a 10,000-node rename improved from 1,728.33 ms to 240.05 ms.
- Verified remotely: GitHub Actions run `31493250145` passed the complete SRR-05 matrix on commit `20c3497d641abf8b59e82aee8e022685a269f81b`.
- Verified history retention: after 100 edits to a 1,000-node document, the live 50-entry history serializes to 94,080,080 bytes versus a 188,160,101-byte uncapped projection.
- Verified remotely: GitHub Actions run `31563217075` passed the complete SRR-06 matrix on commit `c42d562fc1805ec4666a61a14577a0f6044dc1fe`.
- Verified form behavior: the API rejects without body parsing, Preview never sends or logs visitor values, and each preview form displays a non-persistence notice instead of its configured success message.
- Verified remotely: GitHub Actions run `31563682967` passed the complete SRR-07 matrix on commit `01d58a13b783c5c320f48b53bad9f40a5f9fcbe9`.
- Verified focused corrections: active drop-target churn does not rerender the shell, Backspace deletes outside editable controls, defaults errors and structural equality are precise, preview snapshots are reusable and capped at 10, and drag validation uses the command executor's validation-only path.
- Not yet verified in this workspace: the SRR-08 remote CI result.

## Current execution state

- **Done:** SRR-00 through SRR-07 established reliability, performance, bounded history, and honest fail-closed form behavior. SRR-08 scopes the shell subscription, supports Mac Backspace deletion, distinguishes invalid registry style defaults, compares JSON values structurally, retains at most 10 reusable preview snapshots, consolidates drag validation with the command executor, and documents the deterministic singleton initialization requirement.
- **Verification:** Node 24.19.0 passes lint, typecheck, 28 files / 375 tests, and the production build after SRR-08. Focused SRR-08 tests pass 92 cases.
- **Remaining:** Remotely verify SRR-08, then execute SRR-09 and SRR-10.
- **Last left off:** 2026-08-12 — SRR-08 is locally complete and fully green. Preserve the unrelated modifications under `workspaces/api-data-bindings/`. Next action is the SRR-08 checkpoint/CI run followed by SRR-09.
