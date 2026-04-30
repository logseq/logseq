# Logseq CLI Sync Command Implementation Plan

Goal: Add `logseq sync` subcommands to inspect and operate db-sync through existing db-worker-node APIs.

Architecture: The CLI parser and executor will gain a dedicated sync command module that maps subcommands to `:thread-api/db-sync-*` calls via `/v1/invoke`.
Architecture: A small worker API addition will expose runtime sync status, and sync config commands will support headless token setup through CLI-managed config values.
Architecture: The design will reuse existing graph lock and repo binding behavior in `logseq.cli.server/ensure-server!` and `frontend.worker.db-worker-node/repo-error`.

Tech Stack: ClojureScript, babashka.cli, promesa, db-worker-node HTTP API, frontend.worker.sync.

Related: Builds on `docs/agent-guide/031-logseq-cli-doctor-command.md`, `docs/agent-guide/033-desktop-db-worker-node-backend.md`, and `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

## Problem statement

The current CLI exposes graph, server, doctor, list, upsert, remove, query, and show commands, but it does not expose db-sync control or observability.

`frontend.worker.db-core` already exposes operational db-sync thread APIs such as `:thread-api/db-sync-start`, `:thread-api/db-sync-stop`, `:thread-api/db-sync-upload-graph`, and `:thread-api/db-sync-grant-graph-access`.

`frontend.worker.db-worker-node` already routes these methods over `/v1/invoke` with repo-lock safety checks, so the missing piece is a CLI command surface and one read API for status inspection.

This plan keeps scope tight by reusing current transport and server lifecycle code, and only adds new worker behavior where inspection data is currently unavailable.

I will use @planning-documents for naming, @writing-plans for task granularity, @logseq-cli for CLI integration expectations, and @test-driven-development for implementation sequence.

## Testing Plan

I will add parser and action unit tests that fail first for new `sync` command help, option validation, and action shaping.

I will add command execution tests that fail first and verify `logseq.cli.transport/invoke` receives the exact method names and argument shapes for each sync subcommand.

I will add format tests that fail first and verify human output for `sync status` and action commands, while keeping JSON and EDN behavior unchanged.

I will add worker API tests that fail first for the new sync inspection API exposed through `/v1/invoke`.

I will add one CLI integration test that fails first and verifies an end-to-end `sync status` flow on a temp graph and a started db-worker-node process.

I will run targeted tests after each behavior slice and then run `bb dev:lint-and-test` before final review.

NOTE: I will write *all* tests before I add any implementation behavior.

## Scope and CLI surface

| CLI command | Purpose | Worker method | Repo required |
|---|---|---|---|
| `sync status [--graph <name>]` | View current db-sync runtime state and counters. | `:thread-api/db-sync-status` (new). | Yes. |
| `sync start [--graph <name>]` | Start db-sync websocket client for the graph. | `:thread-api/db-sync-start`. | Yes. |
| `sync stop [--graph <name>]` | Stop db-sync client for the running daemon. | `:thread-api/db-sync-stop`. | Yes, to target a graph daemon deterministically. |
| `sync upload [--graph <name>]` | Upload current graph snapshot and mark graph remote metadata. | `:thread-api/db-sync-upload-graph`. | Yes. |
| `sync download [--graph <name>]` | Download remote graph data and apply it to local graph storage. | `:thread-api/db-sync-download-graph` (new). | Yes. |
| `sync remote-graphs` | List remote graphs visible to current auth context. | `:thread-api/db-sync-list-remote-graphs` (new). | No. |
| `sync ensure-keys` | Ensure user RSA keys required by e2ee are present. | `:thread-api/db-sync-ensure-user-rsa-keys`. | No. |
| `sync grant-access --graph-id <uuid> --email <email> [--graph <name>]` | Grant encrypted graph key access to a target user email. | `:thread-api/db-sync-grant-graph-access`. | Yes. |
| `sync config set <name> <value>` | Set one config value by key. | `:thread-api/set-db-sync-config`. | No. |
| `sync config get <name>` | Read one config value by key. | `:thread-api/get-db-sync-config` (new). | No. |
| `sync config unset <name>` | Remove one config value by key. | `:thread-api/set-db-sync-config`. | No. |

The first release intentionally excludes asset download and raw kv import commands because they need more user-facing safety rails and payload tooling.

`sync config set` supports `ws-url`, `http-base`, and `auth-token`, and `config set auth-token <token-value>` is the headless authentication entrypoint.

`sync config get` and `sync config unset` reject unknown config keys.

`sync status` will return normalized fields even when sync is not configured, so scripts can branch deterministically.

`sync remote-graphs` and `sync download` require auth-token to be configured in headless mode.

## Architecture and integration points

```text
logseq sync <subcommand>
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs (parse/build/execute)
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs (new)
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs (ensure graph daemon)
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs (POST /v1/invoke)
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs (repo checks + invoke)
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs thread APIs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs and sync/crypt.cljs
```

Worker additions will be minimal, with no protocol changes to cloud endpoints.

CLI additions will follow existing `graph` and `server` command module patterns for spec, `entries`, `build-action`, and `execute-*` helpers.

## Implementation plan

### Phase 1. Add failing parser and help tests.

1. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that top-level help includes `sync` and `sync status`.
2. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that `logseq sync` shows subgroup help like `server` and `graph`.
3. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that `sync config set|get|unset` and `sync grant-access` show in sync group help.
4. Run `bb dev:test -v logseq.cli.commands-test/test-help-output` and confirm failure references missing `sync` command rows.

### Phase 2. Add failing action and execution tests for sync command module.

5. Create `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` with failing tests for `build-action` graph requirement on `sync status`.
6. Add a failing test for `build-action` rejection when `sync config set` is missing name or value.
7. Add a failing test for `build-action` rejection when `sync grant-access` misses `--graph-id` or `--email`.
8. Add a failing test for `build-action` graph requirement on `sync download`.
9. Add a failing execution test that stubs `logseq.cli.server/ensure-server!` and `logseq.cli.transport/invoke` and expects `:thread-api/db-sync-start` with `[repo]`.
10. Add a failing execution test that expects `:thread-api/db-sync-stop` with `[]` and still routes through `ensure-server!` using selected repo.
11. Add a failing execution test that expects `:thread-api/db-sync-upload-graph` with `[repo]`.
12. Add a failing execution test that expects `:thread-api/db-sync-download-graph` with `[repo]`.
13. Add a failing execution test that expects `:thread-api/db-sync-list-remote-graphs` for `sync remote-graphs`.
14. Add a failing execution test that expects `:thread-api/db-sync-ensure-user-rsa-keys` without repo.
15. Add a failing execution test that expects `:thread-api/db-sync-grant-graph-access` with `[repo graph-id email]`.
16. Add a failing execution test that expects `:thread-api/get-db-sync-config` for `sync config get <name>`.
17. Add a failing execution test that expects `:thread-api/set-db-sync-config` for `sync config set <name> <value>` and payload merge behavior.
18. Add a failing execution test that expects `:thread-api/set-db-sync-config` for `sync config unset <name>` and key removal behavior.
19. Add a failing execution test that verifies `sync config set auth-token <token-value>` updates worker-consumable token config for headless mode.
20. Run `bb dev:test -v logseq.cli.command.sync-test` and confirm failures are only from missing sync implementation.

### Phase 3. Implement CLI sync command wiring.

21. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` with sync option specs, `entries`, `build-action`, and `execute-*` functions.
22. Register `sync-command/entries` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` command table.
23. Extend `finalize-command` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` with sync-specific required-option checks.
24. Extend single-token group help routing in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` to include `sync`.
25. Extend `build-action` dispatch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` to call `sync-command/build-action`.
26. Extend `execute` dispatch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` to route sync action types.
27. Add `sync` to top-level command grouping in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`.
28. Run `bb dev:test -v logseq.cli.commands-test/test-parse-args-help` and `bb dev:test -v logseq.cli.command.sync-test` until green.

### Phase 4. Add read-only worker APIs for sync inspection.

29. Add a failing worker test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that `/v1/invoke` accepts `thread-api/get-db-sync-config` without repo.
30. Add a failing worker test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that `/v1/invoke` for `thread-api/db-sync-status` enforces repo and returns structured status.
31. Add `:thread-api/get-db-sync-config` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` returning current config map.
32. Add `:thread-api/db-sync-status` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` returning ws state, graph id, and sync counters for a repo.
33. Add or expose a small helper in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` to compute status without requiring websocket side effects.
34. Add `:thread-api/db-sync-list-remote-graphs` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` and implement cloud graph listing through worker sync HTTP helpers.
35. Add `:thread-api/db-sync-download-graph` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` and implement remote snapshot download plus local import flow.
36. Update worker sync auth token resolution so `sync config set auth-token <token-value>` is used in headless mode when state token is missing.
37. Register `:thread-api/get-db-sync-config` and `:thread-api/db-sync-list-remote-graphs` in `non-repo-methods` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.
38. Run `bb dev:test -v frontend.worker.db-worker-node-test` and fix only sync-related regressions.

### Phase 5. Add output formatting tests and implementation.

39. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of `sync status`.
40. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of `sync remote-graphs`.
41. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of sync action commands such as start, upload, and download.
42. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` verifying token redaction for `sync config get auth-token` in human output.
43. Implement sync human formatters in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` with stable keys and token redaction.
44. Confirm JSON and EDN output behavior by running `bb dev:test -v logseq.cli.format-test`.

### Phase 6. Add integration coverage and CLI docs.

45. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that creates a graph and runs `sync status` with `--output json`.
46. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `sync config set auth-token` then `sync config get auth-token` behavior.
47. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `sync config unset auth-token`.
48. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `sync remote-graphs --output json`.
49. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `sync download --graph <name>` flow with mocked remote snapshot response.
50. Implement any missing glue for integration stability in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`.
51. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` command docs with sync command examples and error behaviors.
52. Run `bb dev:test -v logseq.cli.integration-test` to verify end-to-end behavior.

### Phase 7. Final verification and cleanup.

53. Run `bb dev:lint-and-test` from `/Users/rcmerci/gh-repos/logseq` and confirm exit code `0`.
54. Run manual smoke commands with a temp graph and confirm both `--output human` and `--output json` are stable.
55. Review help text alignment and command ordering to match existing CLI aesthetics.

## Edge cases and error handling

`sync status` must return a valid map even when `:ws-url` is missing, with an explicit inactive state rather than throwing.

`sync start` must keep current behavior where missing `ws-url` or missing graph uuid results in no crash and a deterministic status response.

`sync grant-access` must surface cloud errors with existing `http-error` path and preserve status code and body context.

`sync config get auth-token` must redact token values in human output while keeping full value available in JSON and EDN output for scripting.

`sync config set auth-token <token-value>` must write to the config file selected by `--config` (default `~/logseq/cli.edn`) so headless auth survives daemon restarts.

`sync remote-graphs` must return a deterministic empty list when user has no remote graphs instead of returning nil.

`sync download` must fail fast when the target local graph is missing required auth or remote graph metadata, and must report a clear sync-specific error code.

Repo mismatch and lock ownership behavior must remain enforced by db-worker-node and must not be bypassed in CLI command code.

All new options must keep kebab-case keyword naming and avoid introducing `_` forms.

## Verification commands

| Command | Expected outcome |
|---|---|
| `bb dev:test -v logseq.cli.command.sync-test` | Sync command unit tests pass with no failures. |
| `bb dev:test -v logseq.cli.commands-test/test-help-output` | Help output includes `sync` group and subcommands. |
| `bb dev:test -v frontend.worker.db-worker-node-test` | Worker invoke tests pass including new sync read APIs. |
| `bb dev:test -v logseq.cli.format-test` | Human and structured output tests pass including sync formatters. |
| `bb dev:test -v logseq.cli.integration-test` | CLI integration tests pass for sync status and config flow. |
| `bb dev:lint-and-test` | Full lint and unit suite passes with exit code `0`. |
| `node ./dist/logseq.js sync status --graph demo --output json` | Returns `{"status":"ok","data":...}` with sync status fields. |
| `node ./dist/logseq.js sync remote-graphs --output json` | Returns remote graph list in structured output. |
| `node ./dist/logseq.js sync download --graph demo` | Downloads remote graph snapshot and imports it into local graph data. |
| `node ./dist/logseq.js sync config set auth-token <token-value>` | Sets headless auth token for db-sync API calls. |
| `node ./dist/logseq.js sync config get auth-token --output json` | Returns configured token value in structured output. |
| `node ./dist/logseq.js sync config unset auth-token` | Removes configured token and returns success message. |

## Testing Details

The new tests verify behavior at parser level, action-building level, transport payload level, worker invoke contract level, output formatting level, and end-to-end CLI invocation level.

The tests assert external behavior such as command availability, returned status payloads, and worker method invocations, instead of asserting internal helper implementation details.

## Implementation Details

- Add new file `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` for sync command ownership.
- Keep `sync` command wiring inside existing dispatch points in `commands.cljs` and do not introduce a second dispatcher.
- Add core worker sync inspection APIs, `get-db-sync-config` and `db-sync-status`, and reuse existing `set-db-sync-config` for config writes.
- Add worker sync APIs for remote graph listing and graph download to support `sync remote-graphs` and `sync download`.
- Reuse `transport/invoke` with existing `direct-pass?` handling and default to transit mode.
- Keep `sync status` output fields stable for scripting, including `repo`, `graph-id`, `ws-state`, and pending counters.
- Keep human output terse and redact auth-token values.
- Update `command.core/top-level-summary` and group-help routing so `sync` behaves like existing command groups.
- Keep all new keyword names kebab-case and avoid shadowed local names such as `bytes`.
- Update `docs/cli/logseq-cli.md` with command list, examples, and expected error hints.
- Run full lint and tests after targeted green passes.

## Question

No open question.

This plan adopts option A and includes `sync config set|get|unset` with `config set auth-token <token-value>` as the token setup path.

---
