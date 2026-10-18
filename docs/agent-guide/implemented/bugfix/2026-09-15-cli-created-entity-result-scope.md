# Correct CLI Created Entity Result Scope

## Problem

Create-mode responses from `upsert block`, `upsert task`, and `upsert asset`
previously included referenced entities and omitted nested blocks. Scripts
using those IDs for follow-up writes could modify unrelated pages or miss
requested descendants.

`cli/lib/add.ml` recursively scanned insertion response maps and sequences for
UUIDs, including reference maps. Its tree insertion accumulator retained the
parent response instead of the child responses. Action UUIDs were only used
when the insertion response contained no UUIDs.

The implementation baseline was `4943c6aa0e`. It did not include PR #13129's
separation between command-level metadata targets and returned IDs, so the
prerequisite isolation was implemented first. Runtime regressions used freshly
built CLI artifacts and the same db-worker-node build throughout.

Pre-fix evidence from disposable graphs:

- Task and asset creation returned `[194, 193]`, where `193` was the existing
  reference page.
- Updating every returned task ID to `done` added the Task tag and status to
  page `193`. Its changed entity snapshot persisted across worker restart.
- A nested request returned `[196, 197]` instead of the requested preorder
  `[196, 198, 199, 197]`.
- Command-level metadata changed reference pages before the prerequisite
  isolation. After isolation, the metadata regression passed while all three
  result-scope regressions still failed.
- Command-boundary tests returned `[801, 899]` instead of `[801, 802]` when
  insertion responses contained incidental entity `899`. A missing requested
  child also incorrectly produced success.

Worker logs showed successful insertion calls and normal stop/start events;
there was no worker error explaining these incorrect CLI results.

## Decision

### One create-result contract

Successful create-mode `data.result` contains exactly the resolved IDs of the
entities in the creation action:

- `upsert block`: all requested blocks, including descendants at every depth.
- `upsert task`: the requested task block.
- `upsert asset`: the requested asset block.

Insertion targets, references, automatically created reference pages, tags,
properties, property values, and other incidental entities are excluded.

Block results use input-tree preorder: each root, its descendants in sibling
order, then the next root. UUIDs are deduplicated at their first occurrence.
JSON and EDN expose the same list, for both `--blocks` and `--blocks-file`.

### Derive results from the action

`collect_action_block_uuids` is the sole source of result UUIDs. Controlled
creation paths call `ensure_block_uuids` before insertion, including for every
child. A missing internal UUID fails immediately rather than being omitted.
Each requested UUID is resolved once after the shared insertion and metadata
operations; an unresolved entity returns `add-id-resolution-failed` instead of
partial success. The existing target recheck preserves `target-not-found` when
concurrent deletion removed the insertion target.

The transaction-payload collector and resolution payload arguments are removed.
`insert_tree` awaits each parent and child insertion and propagates errors,
returning unit instead of accumulating unused payloads.

Task and asset creation continue to consume the shared result without separate
filters or collectors. Production and script consumers were inspected; none
required the accidental page IDs or incomplete descendant lists.

### Keep metadata targeting independent

`execute_create_block` applies command-level `--update-tags` and
`--update-properties` to top-level action UUIDs, preserving PR #13129's policy
without its fallback to returned IDs. Descendants appear in the result without
inheriting these command-level writes. Explicit per-block properties retain
their existing path.

Explicit page-targeted task updates remain valid, and mixed block/page deletion
continues to exclude pages. No compatibility option, stored-data migration,
automatic page repair, or property-key parsing change is introduced.

## Alternatives considered

### Rejected approaches

- Filtering insertion results by entity type cannot recover omitted descendants
  or prove that a remaining block belongs to the creation action.
- Merging parent and child responses retains incidental entities and duplicates
  information already available in the action tree.
- Separate task/asset collectors duplicate the shared contract.
- Rejecting page-targeted task updates removes a valid capability without
  correcting the result producer.
- Recursive command-level metadata updates are a separate policy decision.

## Consequences

### Verification

- `pnpm --dir cli test`: 238 tests pass, including the new command-result and
  unresolved-descendant tests, retained first-occurrence UUID deduplication,
  and concurrent target-deletion coverage. The two new command-result tests
  failed on the original shared implementation before passing with the fix.
- `pnpm cli:release` and a fresh db-worker-node build completed. The same worker
  build was used before and after the CLI fix.
- `created-entity-result-{metadata,block,task,asset}` in
  `cli-e2e/spec/non_sync_cases.edn`: all four cases pass. The block matrix covers
  eight input/output/reference combinations, children and grandchildren,
  multiple roots, repeated existing/new references, generated UUIDs, follow-up
  property writes, and mixed block/page deletion.
- The task case updates every returned ID to `done`, compares the reference
  page's full entity snapshot before and after worker restart, and separately
  verifies explicit page-to-task updates. The page snapshot stays unchanged.
- `bb -f cli-e2e/bb.edn test --skip-build`: 94 cases pass against current
  artifacts, including AgentBridge workflows.
- `bb -f cli-e2e/bb.edn unit-test`: 83 tests and 317 assertions pass.
- `dune build @all`, OCaml formatting checks, and `bb lint:large-vars` pass.
- CLI result documentation and `docs/cli/ocaml-cli-bugs-and-fixes.md` describe
  the corrected membership, ordering, and metadata boundary.

### Operational risks

Scripts that relied on incidental IDs or incomplete lists must consume the
corrected contract. Resolving all descendants increases lookups proportionally
to the number of requested UUIDs. Resolution errors can occur after writes have
completed; this change does not promise rollback or atomic creation. Earlier
unintended page updates are not automatically repaired.
