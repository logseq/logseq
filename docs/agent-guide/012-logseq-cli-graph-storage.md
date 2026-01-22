# Logseq CLI Graph Storage Plan

## Context
logseq-cli and db-worker-node currently store CLI-managed graphs under `~/.logseq/db-worker/` and use per-graph directories named like `.logseq-pool-<graph-name>/` (with partial encoding). This plan captures the non-functional updates requested:

1) Rename `~/.logseq/db-worker/` to `~/.logseq/cli-graphs/` for CLI-managed graphs.
2) Rename per-graph directory format from `.logseq-pool-<graph-name>/` to `<graph-name>/`.
3) Ensure graph names that are not valid directory names are encoded, and decoding is symmetric when reading/listing.

## Goals
- Move CLI graph storage to `~/.logseq/cli-graphs` by default.
- Use a clean per-graph directory name equal to the (encoded) graph name, without `.` prefix or `logseq-pool-` prefix.
- Provide a reversible encode/decode for graph names so list/read operations reconstruct the original graph name.
- CLI commands and outputs should hide the internal `logseq_db_` prefix; user-facing graph names strip that db prefix.
- Maintain db-worker-node functionality (locks/logs/kv-store) with the new paths.

## Non-goals
- Changing Electron or browser-based db graph storage (`~/logseq/graphs`) or OPFS behavior.
- Changing db schema or sqlite storage format.
- Changing db-worker-node API semantics.

## Current Behavior (Key References)
- CLI default data dir is `~/.logseq/db-worker`: `src/main/logseq/cli/config.cljs`.
- db-worker-node default data dir is `~/.logseq/db-worker`: `src/main/frontend/worker/db_worker_node.cljs`, `src/main/frontend/worker/db_worker_node_lock.cljs`, `src/main/frontend/worker/platform/node.cljs`.
- Per-graph directory currently `.logseq-pool-<sanitized>`:
  - `frontend.worker-common.util/get-pool-name` returns `logseq-pool-<sanitized>`: `src/main/frontend/worker_common/util.cljc`.
  - `repo-dir` uses `"." + pool-name` in CLI server, db-worker-node lock, and node platform: `src/main/logseq/cli/server.cljs`, `src/main/frontend/worker/db_worker_node_lock.cljs`, `src/main/frontend/worker/platform/node.cljs`.
- Current graph decoding in list operations reverses only `+3A+` and `++` (file-based graphs); other characters are not reversible: `src/main/logseq/cli/server.cljs`, `src/main/frontend/worker/platform/node.cljs`.

## Proposed Approach
### 1) New default data dir
- Change default data dir for CLI and db-worker-node from `~/.logseq/db-worker` to `~/.logseq/cli-graphs`.
- Update help text and any user-facing docs mentioning the old default.

### 2) New per-graph directory naming
- Replace `.logseq-pool-<graph-name>/` with `<encoded-graph-name>/`.
- Remove the leading dot and `logseq-pool-` prefix entirely for CLI-managed graphs.

### 3) Reversible graph name encoding
- Introduce a shared encode/decode pair for graph directory names that is bijective for all graph names.
- The encoding must avoid path separators and other invalid characters (esp. `/`, `\`, `:` on Windows).
- Suggested approach (reversible and simple):
  - Encode: apply `encodeURIComponent` to the graph name, then replace `%` with a safe delimiter (e.g. `~`) to keep filenames readable and avoid `%` edge cases.
  - Decode: reverse the delimiter replacement, then `decodeURIComponent`.
- Provide helper functions in a shared place (e.g. `frontend.worker-common.util` or a new shared CLI/worker helper) so CLI server, db-worker-node lock, and node platform list all use the same encode/decode logic.

## Implementation Steps
1) Add encode/decode helpers
   - Add new helpers for reversible graph name <-> directory name.
   - Update `get-pool-name` or replace its usage for CLI/db-worker-node paths.
   - Files: `src/main/frontend/worker_common/util.cljc`, potentially `deps/cli/src/logseq/cli/common/graph.cljs`.

2) Update data dir defaults
   - Change defaults to `~/.logseq/cli-graphs` in:
     - `src/main/logseq/cli/config.cljs`
     - `src/main/logseq/cli/server.cljs`
     - `src/main/frontend/worker/db_worker_node_lock.cljs`
     - `src/main/frontend/worker/db_worker_node.cljs` (help text)
     - `src/main/frontend/worker/platform/node.cljs`
   - Update any CLI docs/tests that reference `db-worker` as default.

3) Update repo-dir/path derivation
   - Replace `"." + pool-name` usage with new `<encoded-graph-name>` directory naming.
   - Update list-graphs and list-servers to decode from new directory names.
   - Files: `src/main/logseq/cli/server.cljs`, `src/main/frontend/worker/db_worker_node_lock.cljs`, `src/main/frontend/worker/platform/node.cljs`.

4) Tests & verification
   - Update CLI integration tests that construct temp dirs named `db-worker*` to match new defaults or explicitly pass `--data-dir`.
   - Update db-worker-node tests to use new naming and to validate encode/decode.
   - Ensure `bb dev:lint-and-test` passes.

## Open Questions
- The new encoding is CLI and db-worker-node only (no Electron changes).

## Rollout Notes
- This is a filesystem layout change. Include release notes and ensure users can override via `--data-dir`.
- Provide a one-time warning if old layout is detected and not migrated.
