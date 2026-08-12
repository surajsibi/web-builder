---
doc_id: WEB-BUILDER-DRAG-DROP-VALIDATION-PERFORMANCE
type: D2
variant: investigation
scope: SRR-11 drag-overlay move-validation complexity and performance evidence for web-builder
authority: Recorded benchmark output owns comparative measurements; command and drag source plus behavior tests own implemented semantics
owner: Project owner
lifecycle: in_review
freshness: Verified on 2026-08-12 against reviewed commit fc3b1b6 and the SRR-11 working tree; invalidated by changes to move validation, drag target resolution, fixture construction, Node, or Vitest
---

# Investigation: Drag-overlay move validation scales with the moving subtree

## Impact and scope

While a node is dragged, Canvas and Layers can resolve several drop zones per visible node. Each candidate zone uses the command executor's validation-only move path. At the reviewed baseline, that path collected the complete moving subtree to decide whether the candidate parent was a descendant, repeating subtree-size work for every zone in an overlay pass.

This investigation measures only the full `resolveEditorDropTarget` overlay pass for valid deterministic trees. It does not change placement rules, drop-zone enumeration, candidate cloning, or applied-command validation.

## Reproduction

- Runtime: Node 24.19.0 on Windows with pnpm 10.33.0 and Vitest 4.1.10.
- Command: `pnpm benchmark:drag`.
- Runner: Node environment, one worker, no file parallelism.
- Sampling: five measured iterations per case; Vitest benchmarking is experimental, so results are comparative rather than cross-machine guarantees.
- Fixtures: one moving Section subtree containing exactly 200, 500, or 1,000 nodes plus an equal number of sibling containers, producing 1,200, 3,000, or 6,000 overlay zones.
- Baseline: reviewed commit `fc3b1b63e9c8ec6583bc5d796b1d61a682c3479b` with the benchmark added but before the ancestor-walk change.
- Remediation: keep the cycle check inside centralized move preparation, but walk `parentById` upward from the candidate parent to the moving node instead of materializing the moving subtree.

## Evidence timeline

| Time/order | Evidence | Source | Interpretation |
| --- | --- | --- | --- |
| 1 | Baseline means were 13.3770 ms, 66.0623 ms, and 267.57 ms as the moving subtree increased from 200 to 1,000 nodes. | Local `pnpm benchmark:drag` baseline run | Repeated subtree scans dominate larger overlay passes. |
| 2 | Existing move and drag suites passed after replacing the scan with an upward parent walk. | `execute-command.spec.ts` and `drag-and-drop.spec.ts` | The centralized cycle rule and observable placement behavior remain intact. |
| 3 | Final means were 4.2840 ms, 5.6562 ms, and 10.8092 ms for the same three fixtures. | Local `pnpm benchmark:drag` post-fix run | The moving-subtree multiplier is removed; remaining work scales mainly with zone count and ancestor height. |
| 4 | Lint, typecheck, two full 31-file / 416-test runs, and the production build passed. | Local SRR-16 matrix | No tested correctness or build regression was introduced. |

Mean overlay-pass time:

| Fixture | Baseline | Final post-fix | Reduction | Speedup |
| --- | ---: | ---: | ---: | ---: |
| 1,200 zones / 200-node moving subtree | 13.3770 ms | 4.2840 ms | 68.0% | 3.12x |
| 3,000 zones / 500-node moving subtree | 66.0623 ms | 5.6562 ms | 91.4% | 11.68x |
| 6,000 zones / 1,000-node moving subtree | 267.57 ms | 10.8092 ms | 96.0% | 24.75x |

## Hypotheses

| Hypothesis | Supporting evidence | Contradicting evidence | Status |
| --- | --- | --- | --- |
| Per-zone `collectSubtreeNodeIds` causes the nonlinear overlay cost. | Source called it inside every validation-only move preparation; baseline time rose 20.0x when zones and subtree size each rose 5x. | None in the measured path. | Confirmed |
| Moving the ancestor rule into drag UI code would be faster. | It could avoid command entry overhead. | It would duplicate command semantics and allow drag and applied moves to drift. | Eliminated |
| An upward `parentById` walk preserves cycle correctness with less work. | A candidate is inside the moving subtree exactly when following its parent chain reaches the moving node; behavior suites pass. | Deep ancestor chains still add bounded per-zone work. | Confirmed |

## Root cause or conclusion

The reviewed move preparation answered an ancestor question by enumerating every descendant of the moving node. Because drag resolution invokes that preparation for every candidate zone, a large moving subtree multiplied the overlay scan cost. The trusted hydrated snapshot already provides `parentById`, so the same condition can be answered by walking upward from the proposed parent and stopping if the moving node is reached.

## Resolution and verification

`execute-command.ts` now uses a cycle-safe upward walk with a visited set. The check remains inside command preparation, so applied moves and validation-only drag probes share one authority. The final largest fixture fell from 267.57 ms to 10.8092 ms while move/drop regression tests, lint, typecheck, two complete test runs, and the production build passed.

No timing assertion was added to unit tests. The committed benchmark is the reproducible performance evidence and should be re-run when move validation or overlay enumeration changes.

## Durable knowledge

- Use `pnpm benchmark:drag` for comparable drag-overlay measurements.
- Keep placement and cycle rules centralized in command preparation.
- For a trusted reverse parent index, answer ancestor membership by walking parents rather than collecting the candidate ancestor's full subtree.
- Treat absolute Vitest benchmark times as local evidence; compare identical fixtures and toolchains.
