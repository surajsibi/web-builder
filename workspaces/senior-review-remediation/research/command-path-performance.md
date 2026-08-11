---
doc_id: WEB-BUILDER-COMMAND-PATH-PERFORMANCE
type: D2
variant: investigation
scope: SRR-04 command-path performance measurement and low-risk optimization for web-builder
authority: Recorded benchmark artifacts and verified command behavior own the measurements; source code and tests own implemented behavior
owner: Project owner
lifecycle: concluded
freshness: Verified on 2026-08-11 against baseline commit 126d8d4 and optimized commit de7bd95; invalidated by command execution, hydration, registry schema, benchmark fixture, Node, or Vitest changes
---

# Investigation: Command-path performance

## Impact and scope

The senior review reported that every applied editor command performs full-document cloning and hydration, including a redundant second tree-index pass, and that subtree duplication and block insertion rebuild a project-wide node-ID set for every generated node. SRR-04 measures representative valid commands and removes only those two low-risk sources of repeated work. It does not scope or weaken full-document validation.

## Method

- Runtime: checksum-verified Node 24.19.0 on Microsoft Windows NT 10.0.26200.0.
- Toolchain: pnpm 10.33.0 and pinned Vitest 4.1.10.
- Command: `pnpm benchmark:commands -- --outputJson <artifact>`.
- Runner: Node environment, one worker, no file parallelism.
- Sampling: one warm-up followed by five fixed measured iterations per case.
- Rename fixture: a valid flat document containing exactly 100, 1,000, or 10,000 root cards; the last node is renamed.
- Duplication fixture: a valid section subtree containing 50, 500, or 5,000 nodes is duplicated at the page root, producing exactly 100, 1,000, or 10,000 nodes.
- Baseline implementation: committed command and hydration code at `126d8d491329c90e1c57bfebc59cc7443004d7b5`.
- Optimized implementation: reuse the initial validated parent index after component validation, and reserve generated IDs in one project-wide set per allocating command.
- Remote verification: GitHub Actions run `31492155602` passed lint, typecheck, all 351 tests, and the production build for optimized commit `de7bd9545da36a7052cb1d85c1a83d2acaaade8a`.

The machine and fixture construction are identical between runs. Vitest labels benchmarking experimental, so these numbers are comparative evidence for this change rather than a cross-machine performance guarantee.

## Results

Mean command time in milliseconds:

| Valid command/result size | Baseline | Optimized | Change | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Rename, 100-node document | 13.84 | 15.22 | Within run variance | 0.91× |
| Rename, 1,000-node document | 149.96 | 166.64 | Within run variance | 0.90× |
| Rename, 10,000-node document | 1,725.67 | 1,728.33 | No measurable change | 1.00× |
| Duplicate to 100 nodes | 17.41 | 17.31 | 0.5% lower | 1.01× |
| Duplicate to 1,000 nodes | 172.13 | 161.83 | 6.0% lower | 1.06× |
| Duplicate to 10,000 nodes | 7,705.46 | 2,763.77 | 64.1% lower | 2.79× |

Raw reports:

- [Committed baseline JSON](command-path-baseline.json)
- [Optimized JSON](command-path-optimized.json)

## Conclusion

Building one node-ID set per allocating command removes the reported O(N×M) allocation behavior. Its effect is negligible for small subtrees but material at the project limit: the valid 10,000-node duplication case falls from 7.71 seconds to 2.76 seconds.

Removing the redundant second tree-index build is logically safe because component migration and validation mutate component version, props, and styles but do not mutate page roots or node child relationships. The end-to-end rename benchmark cannot distinguish its smaller cost from run variance because full-document cloning and component/schema validation dominate the command.

The remaining 1.73-second 10,000-node rename confirms that SRR-05 is the important performance gate. Scoped validation must not proceed until equivalence tests compare it with full hydration and retain full validation at every untrusted input boundary.
