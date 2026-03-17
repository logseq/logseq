# 061 — Preserve spaces in canonical graph directory names

## Summary

Change canonical graph directory encoding so spaces are preserved as literal spaces.

- Before: graph-name `GRAPH one` -> graph dir `GRAPH~20one`
- After: graph-name `GRAPH one` -> graph dir `GRAPH one`

All other special-character encode/decode behavior remains unchanged.

This plan is based on the current `logseq-cli` and `db-worker-node` implementation, both of which already rely on shared graph-dir encoding utilities.

## Product decision (locked)

1. Canonical graph dir must preserve spaces (no `~20` for spaces).
2. Existing encoding/decoding rules for non-space special characters remain unchanged.
3. Existing directories using old space encodings (for example `~20` or `%20`) are treated as legacy-compatible inputs, not the canonical write format.
4. New writes/path derivations must use the new canonical format with literal spaces.

## Goals

- Align `logseq-cli` and `db-worker-node` on a canonical graph-dir format that keeps spaces as spaces.
- Keep current behavior for all non-space special characters.
- Preserve compatibility for existing legacy directory names during discovery/listing.
- Keep user-facing graph-name semantics unchanged.

## Non-goals

- Redesign graph naming.
- Change `logseq_db_` prefix handling rules.
- Introduce automatic on-disk migration in this iteration.
- Change unrelated path or lock semantics.

## Current behavior (relevant paths)

### Shared encoding contract

Authoritative helpers:

- `deps/common/src/logseq/common/graph_dir.cljs`
  - `encode-graph-dir-name`
  - `decode-graph-dir-name`
  - `decode-legacy-graph-dir-name`
  - `repo->graph-dir-key`
  - `graph-dir-key->encoded-dir-name`

Current behavior for space:

1. `encodeURIComponent("GRAPH one")` -> `GRAPH%20one`
2. `%` is rewritten to `~`
3. output becomes `GRAPH~20one`

### CLI usage

- `src/main/logseq/cli/server.cljs`
  - canonical/legacy classification for graph dirs (`classify-graph-dir`, `canonical-dir-name?`)
- `src/main/logseq/cli/command/graph.cljs`
  - `graph list` payload construction
- `src/main/logseq/cli/format.cljs`
  - legacy warning/rename suggestion rendering

### db-worker-node usage

- `src/main/frontend/worker/db_worker_node_lock.cljs`
  - `repo-dir`, `lock-path`, `repo->graph-dir-key`
- `src/main/frontend/worker/platform/node.cljs`
  - list/db path installation flows that resolve graph dir via shared helpers
- `src/main/frontend/worker/db_core.cljs`
  - storage pool naming path uses graph-dir key/encoded dir conventions

## Proposed behavior

### Canonical encode/decode contract

For graph-dir encoding:

- Preserve literal spaces in output.
- Keep current reversible encode/decode behavior for all other special characters.
- Keep `~`/`%` safety rules unchanged.

Examples:

- `GRAPH one` -> `GRAPH one` (changed)
- `a/b` -> `a~2Fb` (unchanged)
- `x:y` -> `x~3Ay` (unchanged)
- `100% real` -> `100~25 real` (unchanged except space stays literal)

Decoding expectations:

- `GRAPH one` -> `GRAPH one`
- `GRAPH~20one` -> `GRAPH one` (legacy-compatible decode still works)

### Canonical vs legacy classification in CLI

`graph list` canonical check should reflect the new canonical encoding:

- Directory `GRAPH one` is canonical.
- Directory `GRAPH~20one` is non-canonical (legacy) and should be surfaced as legacy with rename guidance targeting `GRAPH one`.
- Existing `%20` legacy directories remain legacy.

## Design details

### 1) Shared encoder update

Update `encode-graph-dir-name` in `deps/common/src/logseq/common/graph_dir.cljs` so space is not rewritten into `~20`.

Implementation constraint:

- Do not alter non-space transformation behavior.
- Keep encode/decode reversibility for previously supported special characters.

### 2) Keep decode compatibility

`decode-graph-dir-name` remains compatibility-friendly so both old and new directory spellings decode to the same graph-name.

No behavioral contraction should be introduced in decoding.

### 3) CLI classification and guidance alignment

Because canonical encoding changes, `src/main/logseq/cli/server.cljs` classification will naturally reclassify old `~20` dirs as legacy.

Ensure `target-graph-dir` generation and formatter output use the new canonical output containing spaces.

### 4) db-worker-node path outputs

No separate encoding logic should be added.

All db-worker-node path generation must continue to route through shared helpers so new canonical behavior applies consistently to:

- graph repo dir
- lock path
- db path
- log path

## Test plan

### Update existing tests

1. `src/test/frontend/worker/worker_common_util_test.cljs`
   - Update roundtrip expectations for space-containing names to canonical literal-space output.
2. `src/test/logseq/cli/common/graph_test.cljs`
   - Update graph-dir decode/list expectations from `space~20name` canonical assumptions to literal-space canonical behavior.
3. `src/test/logseq/cli/server_test.cljs`
   - Update canonical vs legacy expectations:
     - space directory canonical
     - `~20`/`%20` variants legacy where applicable
4. `src/test/logseq/cli/integration_test.cljs`
   - Update integration assertions for `graph list` legacy markers and rename targets.
5. `src/test/logseq/db/common_sqlite_test.cljs`
   - Update encoded-dir path assertions for graphs with spaces.
6. `src/test/logseq/cli/common_test.cljs`
   - Update unlink/move expectations when graph names contain spaces.
7. `src/test/logseq/cli/format_test.cljs`
   - Ensure rename suggestion target renders literal-space canonical dir.

### Add targeted coverage (if missing)

- Roundtrip examples that mix spaces with other special characters (for example `A B/C:D%~E`) to prove only space behavior changed.
- Explicit assertion that non-space character transformations are unchanged.

## Rollout and compatibility

- No immediate forced migration.
- Legacy directories remain discoverable/readable via existing decode + CLI legacy classification.
- New writes and canonical suggestions converge toward literal-space directories.

## Risks

1. Hidden assumptions in tests that treat `~20` as canonical for spaces.
2. Any code path bypassing shared graph-dir helpers could diverge (must be checked during implementation).
3. Rename suggestion shell formatting with spaces must remain safely quoted.

## Acceptance criteria

1. For graph-name `GRAPH one`, canonical graph dir is exactly `GRAPH one`.
2. Non-space special-character encoding behavior is unchanged from current behavior.
3. CLI graph listing marks old space-encoded dirs (`~20`/`%20`) as legacy where relevant.
4. db-worker-node path derivation uses the new canonical space-preserving output via shared helpers.
5. Updated tests pass and demonstrate:
   - new canonical space behavior,
   - unchanged non-space behavior,
   - legacy compatibility visibility.

## Affected files (planned)

Would modify:

- `deps/common/src/logseq/common/graph_dir.cljs`
- `src/main/logseq/cli/server.cljs` (if classification adjustments are required)
- `src/main/logseq/cli/format.cljs` (if rename guidance formatting expectations need updates)
- `src/test/frontend/worker/worker_common_util_test.cljs`
- `src/test/logseq/cli/common/graph_test.cljs`
- `src/test/logseq/cli/server_test.cljs`
- `src/test/logseq/cli/integration_test.cljs`
- `src/test/logseq/db/common_sqlite_test.cljs`
- `src/test/logseq/cli/common_test.cljs`
- `src/test/logseq/cli/format_test.cljs`

Would create:

- `docs/agent-guide/061-graph-dir-space-preserve-canonical.md`
