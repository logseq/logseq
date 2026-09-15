# Correct CLI Created Entity Result Scope

## Problem

The successful create-mode responses of `upsert block`, `upsert task`, and
`upsert asset` do not reliably identify the entities requested by the caller.
Their shared result collector can include referenced pages and omit nested
blocks. Scripts that use those IDs for subsequent writes can therefore modify
unrelated pages or miss entities they just created.

This decision covers issues 2 through 4 from the CLI investigation:

| Issue | Observed behavior | Consequence |
| --- | --- | --- |
| 2. Unrelated IDs in create results | Block, task, and asset creation can return referenced page IDs alongside the requested entity IDs. | Callers cannot safely use the result as the created-entity list. |
| 3. Follow-up writes target referenced pages | Iterating the IDs returned by task creation and setting each task to `done` also turns the referenced page into a task. | An ordinary create-then-update script writes outside its intended target set. |
| 4. Descendant IDs missing from create results | A nested block tree is inserted successfully, but child and grandchild IDs are absent from the result. | Follow-up processing misses part of the requested tree. |

### Runtime evidence

The investigation used disposable graphs and the same local db-worker-node
runtime for both the installed CLI (`a436863307-dirty`, built on 2026-09-04) and
a freshly compiled PR #13129 CLI (`d6fe6c3c318b6b0b8d44b6f827caebb261edc7f1`).
Both exhibited the following behaviors. Numeric IDs below are fixture-local.

- Creating `Task mentions [[TaskTarget]]` returned `[207, 195]`: task `207`
  and existing page `195`.
- Creating `Asset mentions [[AssetTarget]]` returned `[210, 197]`: asset `210`
  and existing page `197`.
- The create commands themselves left those pages unchanged. However, running
  `upsert task --id <id> --status done` for every ID in `[207, 195]` changed
  page `195` from `TaskTarget #Page` to `Done TaskTarget #Page #Task`.
  This persisted after stopping and restarting the worker.
- In the PR version, one request created root `215`, child `217`, grandchild
  `218`, and sibling `216`. The result was `[215, 216, 203]`, where `203` was a
  page referenced by the root. The child and grandchild were present in the
  graph but absent from the response.
- Passing a mixed block/page result to `remove block --id '[...]'` did not
  delete the page. That command reports page IDs separately and excludes them
  from deletion. This does not make the shared create result correct.

PR #13129 fixes direct tag/property contamination during block creation by
choosing write targets from the action. It explicitly leaves the returned IDs
unchanged. The defects in this document remain after that fix.

Primary code evidence:

- `cli/lib/add.ml`: `collect_uuids_from_value` recursively visits maps and
  sequences, including reference maps with `:block/uuid`.
- `cli/lib/add.ml`: `resolve_created_ids` prefers UUIDs collected from the
  insertion response. It consults `collect_action_block_uuids` only when that
  collection is empty.
- `cli/lib/add.ml`: `insert_tree` returns the parent insertion result when it
  is non-null instead of incorporating child insertion results.
- `cli/lib/upsert.ml`: `execute_task_create` and `execute_create_asset` return
  the IDs supplied by `Add.execute_add_block`.
- `cli/lib/upsert.ml`: task updates intentionally accept page entities as
  targets. A page ID incorrectly returned by task creation can therefore lead
  to a successful but unintended write.

## Proposal

### Define one create-result contract

For a successful create-mode command, `data.result` must contain exactly the
resolved IDs of the entities in the creation action:

- `upsert block`: every requested block, including descendants at every depth.
- `upsert task`: the requested task block.
- `upsert asset`: the requested asset block.

Exclude insertion targets, referenced pages or blocks, tags, property entities,
property-value entities, and any other incidental entities. A page created to
satisfy a reference is still excluded: it is not a requested block, task, or
asset result.

Return IDs in input-tree preorder: visit a block, then its descendants in
sibling order, then the next input sibling. For `[Root(Child(Grandchild)),
Sibling]`, return `[Root, Child, Grandchild, Sibling]`. Deduplicate UUIDs while
preserving their first occurrence. This uses the traversal already provided by
`collect_action_block_uuids`; it does not change insertion or graph ordering.

### Derive results from the action, not insertion payloads

In `cli/lib/add.ml`:

1. Use `collect_action_block_uuids` on the original `action.blocks` tree as the
   sole source of UUIDs for the response. UUID assignment already happens
   before insertion through `ensure_block_uuids`.
2. Resolve those UUIDs to database IDs after all requested insertion and
   metadata operations complete. A missing requested entity must produce the
   existing resolution error, not a partial successful result.
3. Remove the insertion-response argument from the internal ID-resolution
   functions and their callers. Remove `collect_uuids_from_value` if the
   implementation-time consumer search confirms that it has no remaining use.
4. Remove the parent/child result accumulator from `insert_tree` once it is
   no longer consumed. Continue awaiting every insertion and propagating its
   errors; only the response payload is irrelevant to target selection.
5. Preserve the existing distinction between an unresolved created entity and
   a concurrently deleted insertion target. Keep the target-deletion regression
   test behavior while updating implementation-specific assertions if needed.

Do not fall back to insertion-response scanning, return the old mixed list in
another field, or introduce an option for the old behavior. The response shape
stays the same; its contents are corrected. No stored-data migration is needed.

### Keep command consumers consistent

Task and asset creation should continue using the corrected shared result.
They should not add separate page filters or their own UUID collectors. The
fix for issue 3 is to stop returning unrelated page IDs, not to prohibit valid
page-targeted task commands.

Search all production, test, and script consumers of create results before
implementation. Update expectations that encode incidental page IDs or missing
descendants, and verify that callers do not assume the old result count or
ordering.

### Relationship to PR #13129 and scope boundaries

Implement on top of PR #13129, or first retain equivalent separation between
creation-action write targets and returned result IDs. Without that separation,
expanding the result to include descendants also changes the targets used for
command-level tag/property updates in `execute_create_block`.

This decision does not choose whether command-level `--update-tags` or
`--update-properties` should apply recursively to descendants. Preserve the
existing PR behavior for those writes and cover that boundary in regression
tests. The response must include descendants regardless of that separate write
policy.

Other exclusions:

- No change to property-key shorthand parsing between create and update modes.
- No restriction on explicitly converting a page to a task.
- No automatic repair of pages changed by earlier commands or scripts.
- No redesign of update-mode responses, graph import/export, sync, or deletion.
- No new CLI options, classes, properties, compatibility paths, or migrations.

## Alternatives considered

### Filter pages out of insertion results

Insufficient: it cannot recover descendant IDs absent from the parent insertion
result. Filtering by entity type also does not establish that a remaining block
belongs to the caller's requested action.

### Merge parent and child insertion responses

This could recover descendants but retains the need to distinguish requested
entities from references and other incidental entities. The action already
provides that information, without depending on worker response structure.

### Fix each public command separately

Separate collectors in block, task, and asset creation would duplicate one
contract and leave other users of `Add.execute_add_block` exposed. Correct the
shared result producer instead.

### Reject page IDs in task updates

This would block a legitimate CLI capability and would not fix the inaccurate
create response. Explicit page-to-task operations must remain supported.

### Extend the fix to recursive metadata updates

Deferred. Result completeness and metadata inheritance are separate contracts.
Including this policy change would expand beyond issues 2 through 4.

## Acceptance criteria

- Block creation with existing and automatically created page references returns
  exactly the requested block IDs. Repeated references and multiple referenced
  pages do not add IDs or duplicates.
- Task and asset creation with a page reference each return exactly their one
  requested entity ID. The referenced page remains unchanged.
- A nested block request returns all requested IDs in input-tree preorder,
  without duplicates or reference IDs. Cover children, grandchildren, multiple
  top-level siblings, and references at different depths.
- The same result contract holds for `--blocks` and `--blocks-file`, and for
  trees without references. JSON and EDN expose equivalent result lists.
- A task create-then-update regression test iterates every returned ID, marks
  each as done, and proves that the referenced page has neither acquired the
  Task tag nor changed its task properties. Repeat the page check after worker
  restart.
- A nested create-then-update test uses every returned ID to set an explicit
  property and verifies that all requested blocks changed while reference
  pages did not. Use a resolved property identifier or supported string name
  to avoid mixing in the unrelated shorthand-parsing issue.
- Existing valid page-targeted task updates and mixed-ID block deletion retain
  their documented behavior.
- PR #13129's direct-write isolation remains intact. Command-level metadata
  handling of descendants is unchanged by this result-only fix.
- An unresolved requested UUID fails with the existing resolution error; it
  never returns a truncated success list. Concurrent insertion-target deletion
  continues to report `target-not-found` where applicable.
- Replace the transaction-payload collector test in
  `cli/test/cli_parity_test_cases.ml` with command-result coverage that includes
  incidental reference entities. Retain useful coverage of action-tree
  traversal and first-occurrence deduplication.
- Add runtime regressions in `cli-e2e/spec/non_sync_cases.edn`. Confirm they
  fail against the PR #13129 baseline before implementing the shared fix, then
  pass against freshly built CLI artifacts using the same worker runtime.
- Run `pnpm --dir cli test`, build with `pnpm cli:release`, and run the targeted
  CLI E2E cases followed by `bb -f cli-e2e/bb.edn test --skip-build` against
  current artifacts. Follow `cli-e2e/AGENTS.md` for test setup and cleanup.
- Update relevant CLI result documentation and bug records with the corrected
  membership and ordering contract. Run `spec-dev-tool check --all`.

## Risks

- Scripts may rely on the accidental extra IDs, incomplete nested results, or
  their ordering. Correct those consumers directly; do not preserve the invalid
  result contract through a compatibility layer.
- Adding descendant IDs increases the number of ID lookups for nested input.
  Resolve each requested UUID once. Query batching is optional and should not
  expand the correctness fix without evidence that it is needed.
- A failure during ID resolution happens after graph writes may have completed.
  Preserve explicit failure reporting; atomic creation and rollback are separate
  concerns and are not promised by this decision.
- Existing action collectors omit absent UUIDs. Verify the controlled creation
  paths assign UUIDs to every descendant before relying on the collector. Do
  not turn invalid internal state into a partial success or synthesize new
  UUIDs after insertion.
- Removing insertion-response handling must not skip child insertions, suppress
  errors, or change metadata execution order.
- The observed reproduction is specific to the tested CLI and worker builds.
  Re-run the runtime matrix on the implementation baseline and inspect worker
  logs before declaring the defects fixed.

## Questions

- None requiring additional user input for this exploration. The requested
  scope is issues 2 through 4. Preorder result ordering is the recommended
  contract, and recursive command-level metadata policy remains out of scope.
