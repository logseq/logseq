# 058 — db-worker-node revision and CLI server list compatibility

## Summary

This plan proposes three related improvements to align `db-worker-node` runtime metadata with `logseq-cli` versioning:

1. Add `--version` support to `db-worker-node`.
2. Persist `revision` in `db-worker.lock`.
3. Extend `logseq-cli server list` with a `REVISION` column and a compatibility warning when server revision differs from local CLI revision.

The goal is to make version drift observable and debuggable in multi-process and multi-version environments.

---

## Product decisions (locked)

1. **Mismatch rule**: if revision/commit strings are not exactly equal, it is a mismatch.
   - No normalization.
   - No short-hash expansion.
   - No suffix stripping.

2. **Warning scope**: mismatch warning is shown **only in human output**.
   - JSON output must not include human warning text.

---

## Background

Current behavior:

- `logseq-cli --version` already prints build metadata including `Revision`.
- `db-worker-node` accepts operational flags (`--repo`, `--data-dir`, etc.) but does not expose `--version`.
- `db-worker.lock` does not include revision metadata.
- `logseq-cli server list` shows process/state fields (`GRAPH`, `STATUS`, `HOST`, `PORT`, `PID`, `OWNER`) but not revision.

As a result, users cannot quickly determine whether a running DB worker matches the CLI binary currently used to manage it.

---

## Goals

- Expose `db-worker-node` revision consistently with CLI version semantics.
- Persist server revision in lock metadata for later discovery.
- Surface revision in `server list` output.
- Warn users when a listed server revision does not match local CLI revision (human output only).

## Non-goals

- No protocol change for worker RPC endpoints.
- No forced auto-restart or auto-migration for mismatched servers.
- No hard failure on mismatch (warning only).

---

## Design

### 1) Add `--version` to db-worker-node

#### Behavior

- `db-worker-node --version` prints version metadata and exits with code `0`.
- It must not require `--repo`.
- Output must include at least `Revision: <value>`.
- Formatting should follow `logseq-cli --version` style for consistency.

#### Implementation shape

- Extend argument parsing in `db_worker_node.cljs` to recognize `--version`.
- Add an early return branch in `main` before repo validation.
- Introduce a worker-side version namespace using `goog-define` values injected at build time.

### 2) Add `revision` to lock file

#### Behavior

- Lock creation writes `:revision`.
- Lock update preserves existing revision and remains backward compatible with old lock files.
- Reading old lock files without revision continues to work.

#### Implementation shape

- Add revision retrieval at lock write point.
- Extend `create-lock!` payload in `db_worker_node_lock.cljs`.
- Adjust `update-lock!` merge/preserve behavior.

### 3) Show revision in `server list` and warn on mismatch

#### Behavior

- Add `REVISION` column to human table output.
- `--format json` includes per-server `revision` field.
- Mismatch warning text appears only in human output.
- Missing revision should render as `-` and should not crash formatting.

#### Mismatch rule (exact string)

Given:

- local CLI revision = `cli-rev`
- server lock revision = `server-rev`

Then:

- mismatch if `cli-rev != server-rev` (exact string compare)
- no normalization at either side

#### Implementation shape

- Extend server discovery result in `logseq.cli.server/list-servers` to include `:revision`.
- Compute mismatch server set in command/data path (`server list` execute path), then pass structured mismatch info to formatter.
- Render warning block only in human formatter path.

---

## Build metadata strategy

Use the same metadata source philosophy as `logseq-cli`:

- Revision source priority:
  1. `LOGSEQ_REVISION` env
  2. git describe output
  3. fallback `"dev"`

- Build-time source priority:
  1. `LOGSEQ_BUILD_TIME` env
  2. current UTC timestamp

For `db-worker-node`, inject closure defines through its shadow build target, analogous to existing CLI metadata injection.

---

## Implementation plan (task list)

1. Add worker version namespace and shadow metadata wiring.
2. Add `--version` parse + main dispatch branch in `db_worker_node.cljs`.
3. Add `:revision` field in `db-worker.lock` create/update path.
4. Extend `server list` data model with revision.
5. Extend table formatter with `REVISION` column.
6. Add mismatch detection (exact string compare) and pass structured mismatch data.
7. Render mismatch warning in human output only.
8. Add/update tests for all paths.
9. Update CLI documentation.

---

## Testing plan

### Unit tests

- `db_worker_node_test.cljs`
  - Add case: `--version` recognized and exits early without repo.
  - Validate output includes `Revision`.

- `db_worker_node_lock_test.cljs`
  - Create lock includes `:revision`.
  - Update lock preserves existing revision.
  - Legacy lock without revision remains supported.

- `format_test.cljs`
  - Human `server list` table includes `REVISION` column.
  - Missing revision renders `-`.
  - Mismatch warning block appears in human output for exact-string mismatch.
  - No warning block when revisions are equal.

- `server_test.cljs` (or equivalent)
  - Discovery output includes revision extracted from lock.
  - Mismatch set computed with exact string comparison.

- JSON output tests
  - `server list --format json` contains per-server `revision`.
  - JSON output does not contain human warning text.

### Regression checks

- Existing `logseq-cli --version` tests remain green.
- Existing server list owner/status formatting remains unchanged aside from the added `REVISION` column and optional warning block in human mode.

---

## Rollout and compatibility

- Backward compatible with existing lock files.
- New clients can read old locks (revision absent).
- Old clients can ignore new lock key (`revision`) if parser is permissive map decode.

---

## Risks and mitigations

- **Risk:** db-worker build target missing metadata hook.
  - **Mitigation:** add explicit hook wiring and test fallback value (`dev`) in test target.

- **Risk:** warning noise in mixed environments.
  - **Mitigation:** warning remains informational and human-only.

- **Risk:** flaky tests due to dynamic metadata.
  - **Mitigation:** use deterministic test defines in shadow test config.

---

## Acceptance criteria

- `db-worker-node --version` prints revision and exits `0` without requiring repo args.
- `db-worker.lock` written by worker includes `revision`.
- `logseq-cli server list` (human) shows `REVISION` column.
- `logseq-cli server list` (human) prints mismatch warning when local CLI revision string is not exactly equal to server revision string.
- `logseq-cli server list --format json` includes server revision data and does not include human warning text.
- Added/updated tests cover happy path and backward-compatibility path.

---

## File scope (expected)

- `src/dev-cljs/shadow/hooks.clj`
- `shadow-cljs.edn`
- `src/main/frontend/worker/db_worker_node.cljs`
- `src/main/frontend/worker/db_worker_node_lock.cljs`
- `src/main/frontend/worker/version.cljs` (new)
- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/command/server.cljs`
- `src/main/logseq/cli/format.cljs`
- `src/test/frontend/worker/db_worker_node_test.cljs`
- `src/test/frontend/worker/db_worker_node_lock_test.cljs`
- `src/test/logseq/cli/format_test.cljs`
- `src/test/logseq/cli/server_test.cljs`
- `docs/cli/logseq-cli.md`
