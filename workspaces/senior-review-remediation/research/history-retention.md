---
doc_id: WEB-BUILDER-HISTORY-RETENTION
type: D2
variant: investigation
scope: SRR-06 undo and redo history retention after introducing a 50-entry limit
authority: Store behavior tests and the raw retention artifact own the measured result; source code owns implemented history behavior
owner: Project owner
lifecycle: concluded
freshness: Verified on 2026-08-12 for the pending SRR-06 implementation after commit 3288ae5; invalidated by history representation, history limit, project fixtures, Node, V8 serialization, or store command changes
---

# Investigation: History retention

## Scope and decision

SRR-06 introduces a limit of 50 history entries without changing the existing full `before` and `after` content-snapshot representation. The limit applies when a command appends to history and defensively when undo or redo moves entries between stacks. Adjacent commands sharing a `historyGroupId` continue to replace the active entry's `after` snapshot without consuming another slot.

This change bounds retained history by edit count. It does not make retained memory independent of document size, and it does not attempt a patch-based or structurally shared history redesign.

## Behavioral verification

The store suite verifies that:

- the oldest entry is evicted after the fifty-first ungrouped edit;
- exactly 50 retained entries can be undone and redone before the actions become no-ops;
- selection survives retained page-name undo and redo operations;
- an active grouped edit at the limit remains one undo step without evicting another entry;
- a new edit after undo clears the retained redo branch;
- existing block insertion, grouping, selection reconciliation, rejected-command, and atomic-failure behavior still passes.

## Retained-data measurement

Method:

- Runtime: checksum-verified Node 24.19.0 on Microsoft Windows NT 10.0.26200.0.
- Toolchain: pnpm 10.33.0 and pinned Vitest 4.1.10.
- Command: `pnpm benchmark:history -- --outputJson workspaces/senior-review-remediation/research/history-retention.json`.
- Fixture: one valid page with 1,000 root card nodes.
- Workload: 100 applied page-name edits through the real builder store.
- Metric: `node:v8` structured-serialization byte length of retained history. This is a stable payload-size proxy, not resident heap or browser-memory overhead.
- Uncapped projection: every actual entry produced by the 100 edits is retained separately for serialization, while the live store applies the 50-entry cap.

Results:

| State after 100 edits | Entries | Serialized payload | MiB |
| --- | ---: | ---: | ---: |
| Live capped history | 50 | 94,080,080 bytes | 89.72 |
| Uncapped projection | 100 | 188,160,101 bytes | 179.44 |

The 50-entry policy reduces retained serialized payload by 50.0% for this workload and prevents further growth as additional ungrouped edits are committed. The raw result is in [history-retention.json](history-retention.json).

## Residual risk

About 89.72 MiB of serialized history for a 1,000-node document is still substantial. The cap fixes unbounded growth with respect to edit count, but full before/after snapshots remain expensive and scale with document size. Patch-based history or safe snapshot structural sharing should be evaluated as a separate architecture item with its own correctness and memory gates; it is not silently combined with this bounded change.

Undo and redo continue to run full hydration. Their validation cost was explicitly excluded from this initial history-cap item and should only change under an equivalence gate comparable to SRR-05.
