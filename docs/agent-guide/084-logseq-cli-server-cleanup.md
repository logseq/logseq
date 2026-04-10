# 084 — Replace `server status` with `server cleanup` for revision-mismatch processes

## Summary

This plan updates the CLI server command set by removing `server status` and adding `server cleanup`.

`server cleanup` will terminate discovered `db-worker-node` processes that are both:

- owned by `:cli`
- revision-mismatched with the current CLI revision

The implementation will reuse current `logseq-cli` and `db-worker-node` lifecycle primitives:

- server discovery from lock files (`logseq.cli.server/list-servers`)
- revision metadata persisted in locks by db-worker-node (`:revision`)
- shutdown/kill paths already used by server stop/restart flows

## Requested behavior changes

1. Remove `logseq server status --graph <name>`.
2. Add `logseq server cleanup`.
3. `server cleanup` kills only discovered `:cli`-owned server processes where `server revision != current CLI revision`.

## Current baseline

- `server` command entries are defined in `src/main/logseq/cli/command/server.cljs` and currently include `list/status/start/stop/restart`.
- CLI parse/build/execute routing is centralized in `src/main/logseq/cli/commands.cljs`.
- Running server discovery already includes revision in `src/main/logseq/cli/server.cljs` (`list-servers` returns `:revision`).
- Revision mismatch semantics already exist and use exact string comparison (`compute-revision-mismatches`).
- db-worker-node writes revision into lock metadata in `src/main/frontend/worker/db_worker_node_lock.cljs`; legacy locks may have missing revision.

## Product decisions (locked)

1. **`server status` is removed, not deprecated.**
   - No alias.
   - Parsing `server status` should fail as unknown command after removal.

2. **Mismatch rule remains exact string comparison.**
   - If `cli-revision != server-revision`, it is a mismatch.
   - `nil`/missing server revision is treated as mismatch.

3. **Cleanup scope is discovered servers in current data-dir.**
   - Source of truth is lock-file-backed discovery from `list-servers`.
   - We do not add global OS-wide process scanning for all possible data dirs.

4. **Cleanup ownership scope is `:cli` only.**
   - Cleanup targets only servers where `:owner-source` is `:cli`.
   - Mismatched servers owned by `:electron` (or other owners) are reported but not terminated.

5. **Termination strategy is graceful-first for eligible targets.**
   - Attempt graceful shutdown first.
   - Fallback to process kill if needed.

## CLI contract for `server cleanup`

### Command surface

- New command: `logseq server cleanup`
- No `--graph` required.
- Works with existing global options (`--data-dir`, `--config`, `--output`, etc.).

### Result shape (proposed)

Return structured data for stable JSON/EDN automation:

- `:cli-revision`
- `:checked` (count of discovered servers)
- `:mismatched` (count)
- `:eligible` (count of mismatched servers with `:owner-source :cli`)
- `:skipped-owner` (mismatched servers not owned by `:cli`)
- `:killed` (servers/pids successfully terminated)
- `:failed` (servers/pids that could not be terminated)

Human output should summarize counts and list failed targets if any.

## Implementation design

### 1) Remove `server status` wiring

- Remove `server status` entry from `command/server.cljs`.
- Remove `:server-status` branches in:
  - parse-time graph-required validation set
  - build-action dispatch
  - execute dispatch
- Remove status-specific formatter branch/tests.

### 2) Add `server cleanup` command entry and action

In `command/server.cljs`:

- Add entry `['server' 'cleanup']` with description and example.
- Add `build-action` branch for `:server-cleanup` (no repo requirement).
- Add executor `execute-cleanup`.

In `commands.cljs`:

- Route `:server-cleanup` in build-action and execute.
- Ensure graph-required command set excludes cleanup.

### 3) Add cleanup orchestration in `logseq.cli.server`

Introduce a new function (e.g. `cleanup-revision-mismatched-servers!`) that:

1. resolves CLI revision (`logseq.cli.version/revision`, passed from command layer)
2. calls `list-servers`
3. computes mismatches using existing exact compare helper
4. partitions mismatches into eligible (`:owner-source :cli`) vs skipped-owner targets
5. terminates each eligible mismatched server process
6. removes stale locks when PID no longer exists
7. returns structured result data

Implementation should reuse existing stop/shutdown logic where possible to avoid duplicate lifecycle behavior.

### 4) Ownership-aware termination behavior

Cleanup must not bypass ownership rules globally; it should only target mismatched servers owned by `:cli`.

Recommended approach:

- Filter mismatch targets to `:owner-source :cli` before termination.
- Reuse existing stop/shutdown flow for eligible targets.
- Keep existing owner-aware behavior unchanged for `stop`/`restart`.
- Report non-CLI mismatched servers in `:skipped-owner` for visibility.

### 5) Formatting and docs

- Add human formatting branch for `:server-cleanup` in `format.cljs`.
- Remove obsolete `:server-status` human formatting and associated tests.
- Update CLI docs and examples in `docs/cli/logseq-cli.md`.

## File scope (expected)

- `src/main/logseq/cli/command/server.cljs`
- `src/main/logseq/cli/commands.cljs`
- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/format.cljs`
- `src/main/logseq/cli/command/core.cljs` (if help grouping text needs update)
- `src/test/logseq/cli/commands_test.cljs`
- `src/test/logseq/cli/command/server_test.cljs`
- `src/test/logseq/cli/server_test.cljs`
- `src/test/logseq/cli/format_test.cljs`
- `cli-e2e/spec/non_sync_inventory.edn`
- `cli-e2e/spec/non_sync_cases.edn`
- `docs/cli/logseq-cli.md`

## TDD execution plan

1. Add failing parse/build tests for removing `server status` and adding `server cleanup`.
2. Add failing command execute tests for cleanup action wiring.
3. Add failing server lifecycle tests for mismatch selection and termination behavior.
4. Add failing formatter tests for new human cleanup output and remove status output expectations.
5. Implement command and server orchestration changes.
6. Update docs and cli-e2e inventory/cases.
7. Run focused tests, then full lint+test.

## Testing plan

### Unit tests

- `commands_test.cljs`
  - `server status` becomes unknown command.
  - `server cleanup` parses/builds/dispatches.
  - cleanup does not require `--graph`.

- `command/server_test.cljs`
  - cleanup execute returns structured summary.
  - mismatch semantics remain exact compare.

- `server_test.cljs`
  - cleanup kills only mismatched revision servers with `:owner-source :cli`.
  - mismatched servers owned by non-CLI owners are reported in `:skipped-owner` and remain untouched.
  - matching revision servers are untouched.
  - missing revision is treated as mismatch.
  - failures are reported in `:failed`.

- `format_test.cljs`
  - human cleanup output includes counts and failure lines.
  - status formatting tests removed/replaced.

### CLI E2E

- Remove `server status` coverage case.
- Add `server cleanup` coverage case (at least smoke path with zero or controlled mismatches).
- Update non-sync inventory command list under `:server`.

### Verification commands

```bash
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.command.server-test
bb dev:test -v logseq.cli.server-test
bb dev:test -v logseq.cli.format-test
bb -f cli-e2e/bb.edn test --skip-build
bb dev:lint-and-test
```

## Risks and mitigations

- **Risk:** Ownership metadata may be missing/legacy (`:unknown`) and reduce cleanup coverage.
  - **Mitigation:** keep cleanup intentionally strict (`:cli` only) and report skipped-owner targets explicitly for operator follow-up.

- **Risk:** Legacy locks without revision cause aggressive cleanup.
  - **Mitigation:** keep behavior intentional and documented (`missing revision = mismatch`).

- **Risk:** Duplicate stop logic divergence.
  - **Mitigation:** reuse existing stop/shutdown flow for `:cli`-owned targets and keep ownership filtering in one cleanup helper.

## Acceptance criteria

1. `logseq server status ...` is no longer available.
2. `logseq server cleanup` exists and executes without `--graph`.
3. Cleanup terminates only discovered mismatch servers with `:owner-source :cli` (`server revision != CLI revision`).
4. Mismatched servers with non-CLI ownership are not terminated and are reported as `:skipped-owner`.
5. Matching-revision servers are not terminated.
6. Structured JSON/EDN output reports `checked/mismatched/eligible/skipped-owner/killed/failed` summaries.
7. Human output is clear and actionable.
8. Unit tests and relevant cli-e2e coverage are updated and passing.
