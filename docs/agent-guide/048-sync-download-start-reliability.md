# Sync Download And Sync Start Reliability Implementation Plan

Goal: Validate and fix `logseq sync download` plus `logseq sync start` so download data is complete and start reaches a working sync session.

Architecture: I will harden behavior with failing tests first at CLI, db-worker-node invoke boundary, and worker sync core, then apply minimal fixes in `logseq.cli.command.sync`, `frontend.worker.db_core`, and `frontend.worker.sync`.
Architecture: The start path will stop reporting false success by checking runtime status after start, and the download path will fail fast on incomplete or inconsistent snapshot import conditions.
Architecture: Manual verification will use a local untracked `cli.edn` built from the exact config block provided in this task.

Tech Stack: ClojureScript, babashka test runner, db-worker-node daemon, frontend worker thread APIs, websocket plus HTTP sync APIs.

Related: Builds on `docs/agent-guide/047-logseq-cli-sync-command.md`, and relates to `docs/agent-guide/033-desktop-db-worker-node-backend.md` and `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

## Problem statement

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` currently reports `sync start` success after invoking `:thread-api/db-sync-start`, but it does not verify the websocket state becomes `:open`.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` skips start when config or graph-id is missing, and the CLI currently does not distinguish this from a successful start.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` enforces frame integrity in `finalize-framed-buffer`, but the current tests do not cover incomplete snapshot frame failure through the full download flow.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` imports downloaded rows and returns a summary map, but there is no end-to-end CLI integration test that confirms downloaded graph data is usable and consistent after import.

This plan uses @planning-documents for naming, @writing-plans for granularity, @test-driven-development for sequence, and @clojure-debug when failures are not immediately obvious.

## Testing Plan

I will add CLI command tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` for start readiness polling, start timeout behavior, and download error propagation.

I will add worker sync tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` for incomplete framed snapshot behavior and download completeness invariants.

I will add worker daemon invoke tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` to verify start and status interactions remain stable through `/v1/invoke`.

I will add CLI integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` to verify `sync download` yields queryable graph data and `sync start` reaches `:open` within timeout in a deterministic mocked sync environment.

I will run targeted tests after each behavior slice and then run `bb dev:lint-and-test` for regression safety.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current integration map

```text
logseq sync download/start
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs
  -> remote sync HTTP + websocket endpoints
```

## Manual test configuration

Create `/tmp/logseq-sync-cli.edn` with the exact EDN block provided in this task request.

Keep this file local and untracked, and never commit the auth token to the repository.

Use `--config /tmp/logseq-sync-cli.edn` for every manual `logseq sync` command in this plan.

## Implementation plan

### Phase 0. Baseline and reproducibility.

1. Create `/tmp/logseq-sync-cli.edn` from the provided config block.
2. Run `bb dev:test -v logseq.cli.command.sync-test` to capture current CLI sync baseline.
3. Run `bb dev:test -v frontend.worker.db-sync-test` to capture current worker sync baseline.
4. Run `bb dev:test -v frontend.worker.db-worker-node-test` to capture current daemon invoke baseline.
5. Run `node ./dist/logseq.js sync remote-graphs --config /tmp/logseq-sync-cli.edn --output json` and record the graph-id and graph-name used for manual verification.

### Phase 1. RED tests for sync start readiness semantics.

6. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `sync start` polls `:thread-api/db-sync-status` and returns success only after `:ws-state` becomes `:open`.
7. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `sync start` returns `:error` with diagnostic status when `:ws-state` never reaches `:open` before timeout.
8. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that start skipped conditions like missing `:ws-url` are surfaced as actionable CLI errors instead of success.
9. Run `bb dev:test -v logseq.cli.command.sync-test/test-execute-sync-start` and verify RED failures are behavior failures.

### Phase 2. RED tests for download completeness and failure propagation.

10. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` that incomplete snapshot frames trigger `:db-sync/incomplete-snapshot-frame` behavior through download framing helpers.
11. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` that a valid download payload produces stable row batches that can be imported without truncation.
12. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `sync download` returns `:error` and preserves error code when `:thread-api/db-sync-download-graph-by-id` fails.
13. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that downloaded data is queryable after import and includes expected graph metadata.
14. Run `bb dev:test -v frontend.worker.db-sync-test` and `bb dev:test -v logseq.cli.integration-test` and verify RED failures are behavior failures.

### Phase 3. GREEN implementation for sync start observability.

15. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` to add a bounded wait helper that polls `:thread-api/db-sync-status` after `:thread-api/db-sync-start`.
16. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` so `:sync-start` returns `{:status :ok}` only when status shows `:ws-state :open`.
17. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` so timeout or skipped start returns `{:status :error}` with `:repo`, current `:ws-state`, and remediation hint.
18. If needed, update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` status payload to include one extra diagnostic field for recent start failures.
19. Re-run `bb dev:test -v logseq.cli.command.sync-test` until all start-related tests pass.

### Phase 4. GREEN implementation for download completeness guarantees.

20. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` to keep strict framed payload validation and expose structured failure details used by CLI.
21. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` download/import path to assert required result fields before import and fail fast on invalid payload.
22. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` download branch to preserve worker error code and context in CLI output.
23. Re-run `bb dev:test -v frontend.worker.db-sync-test` and `bb dev:test -v logseq.cli.command.sync-test` until download-related tests pass.

### Phase 5. REFACTOR and regression safety.

24. Refactor only duplicated sync command helper code in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` without changing behavior.
25. Re-run `bb dev:test -v logseq.cli.command.sync-test` after refactor.
26. Re-run `bb dev:test -v frontend.worker.db-sync-test` after refactor.
27. Re-run `bb dev:test -v frontend.worker.db-worker-node-test` after refactor.

### Phase 6. Manual end-to-end verification with provided cli.edn.

28. Run `node ./dist/logseq.js sync download --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` and record `graph-id`, `remote-tx`, and `row-count`.
29. Run `node ./dist/logseq.js q --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json '[:find (count ?e) :where [?e :block/uuid]]'` and confirm graph has non-zero entities.
30. Run `node ./dist/logseq.js sync status --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` and capture pre-start `ws-state`.
31. Run `node ./dist/logseq.js sync start --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` and verify command succeeds only when status reaches `:open`.
32. Run `node ./dist/logseq.js upsert block --graph <graph-name> --title "sync smoke $(date +%s)" --config /tmp/logseq-sync-cli.edn --output json` to create a local change.
33. Run `node ./dist/logseq.js sync status --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` repeatedly until `pending-local` trends back to `0`.
34. If step 31 or step 33 fails, inspect db-worker-node log file under the graph repo directory and capture exact error code plus timestamp.

### Phase 7. Final verification.

35. Run `bb dev:lint-and-test` from `/Users/rcmerci/gh-repos/logseq` and ensure full suite is green.
36. Re-run manual step 31 one more time to verify no flakiness after full test run.
37. Document final behavior and known limitations in the PR summary.

## Edge cases to cover explicitly

`sync start` must return an actionable error when `:ws-url` is missing or empty.

`sync start` must avoid false success when token exists but handshake never reaches `:open`.

Repeated `sync start` calls must be idempotent and not create duplicate clients.

`sync download` must fail clearly when remote graph is not found and must include graph-name in the error.

`sync download` must fail clearly on incomplete framed snapshot payload.

`sync download` must not leave a half-imported local graph when import throws mid-batch.

`sync download` must preserve and report `graph-e2ee?` and remote graph-id in result payload.

## Verification command matrix

| Command | Expected outcome |
|---|---|
| `bb dev:test -v logseq.cli.command.sync-test` | Sync CLI tests pass, including start readiness and download error propagation. |
| `bb dev:test -v frontend.worker.db-sync-test` | Worker sync framing and download completeness tests pass. |
| `bb dev:test -v frontend.worker.db-worker-node-test` | Daemon invoke and status behavior remains green. |
| `bb dev:test -v logseq.cli.integration-test` | CLI integration verifies queryable data after download and start readiness path. |
| `node ./dist/logseq.js sync download --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` | Returns `status: ok` with stable `graph-id`, `remote-tx`, and non-negative `row-count`. |
| `node ./dist/logseq.js sync start --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` | Returns `status: ok` only when worker status reaches `ws-state: open`. |
| `node ./dist/logseq.js sync status --graph <graph-name> --config /tmp/logseq-sync-cli.edn --output json` | Shows non-negative queue counters and stable repo graph identifiers. |
| `bb dev:lint-and-test` | Full lint and unit suite passes with exit code `0`. |

## Testing Details

The test suite additions validate behavior from user-visible CLI result down to worker framed snapshot handling and daemon invoke boundary.

The tests verify externally observable behavior such as command status, error code, websocket state progression, and queryable post-download graph data.

The tests avoid checking private implementation details and focus on functional outcomes.

## Implementation Details

- Keep `sync` command API surface unchanged and improve readiness validation inside existing `:sync-start` execution path.
- Keep download protocol unchanged and improve payload validation plus error propagation semantics.
- Reuse `:thread-api/db-sync-status` as the source of readiness truth for CLI start.
- Keep all keyword names kebab-case and avoid introducing underscore keys.
- Ensure any new helper names avoid shadowed locals like `bytes`.
- Keep auth token handling in local config and never persist token values into repository files.
- 在 db-worker-node 中，如果是 desktop app 场景启动，token 读写保持原有代码路径。
- 在 db-worker-node 中，如果是 cli 场景启动，读取 token 一律从 `cli.edn`（sync config）中获取。
- 在 db-worker-node 中，如果是 cli 场景启动，写入 token 也走 `cli.edn`（sync config）路径。
- Preserve existing db-worker-node repo lock and method access rules.
- Keep manual verification commands deterministic by pinning `--config /tmp/logseq-sync-cli.edn`.
- Use a fixed `sync start` wait timeout of `10000` ms with no CLI override option.

## Question

No open question.

---
