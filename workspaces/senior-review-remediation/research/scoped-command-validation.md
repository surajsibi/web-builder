---
doc_id: WEB-BUILDER-SCOPED-COMMAND-VALIDATION
type: D2
variant: investigation
scope: SRR-05 equivalence and performance evidence for scoped editor-command validation
authority: Equivalence tests, raw benchmark evidence, and verified runtime behavior own this investigation; source code owns implemented validation behavior
owner: Project owner
lifecycle: concluded
freshness: Verified on 2026-08-11 for the SRR-05 scoped-validation implementation; invalidated by command, hydration, tree, registry, store-boundary, benchmark, Node, or Vitest changes
---

# Investigation: Scoped command validation

## Decision boundary

Editor commands operate on snapshots created by `prepareProjectHydration` and retained inside the builder store. Untrusted hydration, initial-document preparation, undo, and redo remain full-document validation boundaries. Scoped validation is not valid for an arbitrary caller-constructed or untrusted `CommandSnapshot`.

The full hydration path remains executable through the command service's `candidateValidation: "full"` mode and is used as the reference oracle in tests. The production default is `"scoped"`.

## Mutation scopes

| Command group | Commands | Scoped validation |
| --- | --- | --- |
| Local metadata | `page.rename`, `node.rename`, `node.lock` | Command envelope and command-specific value checks; reuse the trusted parent index |
| Local component data | `node.updateProps`, `node.updateStyles`, `node.hide` | Parse the complete affected props or responsive styles; reuse the trusted parent index |
| Page/tree structure | `page.create`, `page.delete`, `node.insert`, `node.remove`, `node.move`, `node.duplicate`, `block.insert` | Command-specific placement/locking/identity checks plus one complete tree-invariant pass and rebuilt parent index |

Structural validation still enforces the project-wide node cap, project-wide node-ID uniqueness, roots, child references, duplicate positions, orphans, cycles, and depth. It does not rerun component schemas for untouched nodes whose validity is inherited from the hydrated snapshot.

## Equivalence gate

`execute-command-validation-equivalence.spec.ts` executes the same snapshot and command twice with identical generated IDs: once in scoped mode and once through full hydration. It requires deep equality of the complete result union, including applied candidates and typed rejection details.

Coverage includes:

- all 13 editor command kinds;
- applied local, structural, subtree, and block mutations;
- invalid props and invalid styles;
- a generated 10,001-node candidate rejected by the project node cap;
- a generated depth-101 move rejected by the tree depth cap.

The existing command and hydration suites remain part of the gate. Generated IDs are now also required to be non-empty before reservation because full document schema validation no longer acts as a later fallback for that condition.

## Performance result

The identical Node 24.19.0 benchmark harness from SRR-04 was rerun with scoped validation. Each result uses one warm-up and five fixed measured iterations.

| Valid command/result size | SRR-04 full hydration | Scoped validation | Reduction | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Rename, 1,000-node document | 166.64 ms | 22.39 ms | 86.6% | 7.44× |
| Rename, 10,000-node document | 1,728.33 ms | 240.05 ms | 86.1% | 7.20× |
| Duplicate to 1,000 nodes | 161.83 ms | 30.67 ms | 81.0% | 5.28× |
| Duplicate to 10,000 nodes | 2,763.77 ms | 1,107.97 ms | 59.9% | 2.49× |

The 100-node cases are omitted from percentage claims because five-sample relative error is high at their short durations. Raw result: [scoped-validation benchmark JSON](command-path-scoped-validation.json).

Compared with the original pre-SRR-04 baseline, duplication to 10,000 nodes falls from 7,705.46 ms to 1,107.97 ms, an 85.6% reduction and 6.95× speedup.

## Conclusion

The equivalence gate supports scoped validation for commands executed through the hydrated builder-store boundary. Full hydration remains mandatory for every untrusted or reconstructed document boundary and available as the command reference implementation. Any new command kind must define a mutation scope and enter the scoped/full equivalence matrix before it can use scoped validation.
