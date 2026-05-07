# Graph Create Enable Sync Implementation Plan

Goal: Add `logseq graph create --enable-sync` so a newly selected graph is created, persisted as the current graph, uploaded to Logseq Sync, and started for continuous sync in one command.

Architecture: Keep the public feature in the existing `graph create` command and compose current CLI command behavior instead of adding a new `db-worker-node` thread API.
Architecture: Reuse `:thread-api/create-or-open-db`, `:thread-api/db-sync-upload-graph`, `:thread-api/db-sync-start`, and the existing CLI sync runtime setup paths.
Architecture: Preserve the sync-free `graph create` path when `--enable-sync` is absent, while making local graph name collisions fail before creation starts.

Tech Stack: ClojureScript, babashka.cli option parsing, Logseq CLI command dispatch, Logseq CLI sync command helpers, `db-worker-node` HTTP transport, and existing CLI unit plus CLI e2e tests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/004-graph-export.md`.

## Problem statement

Users currently need multiple CLI calls to create a graph and immediately enable sync for it.

The manual flow is:

```text
logseq graph create --graph <name>
logseq graph switch --graph <name>
logseq sync upload --graph <name>
logseq sync start --graph <name>
```

The current `graph create` implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` already calls `:thread-api/create-or-open-db` and persists the graph to `cli.edn` through `:persist-repo`.

That means the separate `graph switch` step is effectively part of the current `graph create` execution path.

The current sync implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` already knows how to resolve sync runtime config, validate required sync config, start or reuse the graph worker, apply sync config to the worker, upload the graph, and start the sync websocket client.

The worker already exposes the thread APIs needed by this flow in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

A new thread API would duplicate orchestration that the CLI already owns.

The desired implementation should therefore add only CLI orchestration and tests unless a concrete existing API gap is discovered during implementation.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add parser coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` proving `graph create --graph demo --enable-sync` parses successfully and stores `:enable-sync true` in parsed options.

I will add parser coverage proving `graph create --graph demo --enable-sync --e2ee-password pw` parses successfully and stores the password using the same option semantics as `sync upload` and `sync start`.

I will add build-action coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` proving `graph create --enable-sync` builds an orchestration action with repo `logseq_db_demo`, graph `demo`, `:require-missing-graph true`, and no new worker method field beyond the existing create method.

I will add build-action coverage proving plain `graph create --graph demo` also requires the graph to be locally missing before create starts.

I will add execution coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` proving the enabled path invokes worker methods in this order: `:thread-api/create-or-open-db`, `:thread-api/set-db-sync-config`, optional `:thread-api/verify-and-save-e2ee-password`, `:thread-api/db-sync-upload-graph`, `:thread-api/q`, `:thread-api/db-sync-start`, and status polling through `:thread-api/db-sync-status` as required by the current sync start implementation.

I will add execution coverage proving `cli.edn` is updated to the created graph before upload and start are run.

I will add failure coverage proving local graph name collision returns `:graph-exists` before creating or syncing anything.

I will add failure coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` proving upload failure stops the flow before `:thread-api/db-sync-start`.

I will add failure coverage proving sync-start failure returns the existing sync-start error shape instead of hiding it behind a generic graph-create success.

I will add formatter coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for the required multi-line human summary and the structured stage-result payload.

I will add completion coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` so `--enable-sync` appears for `graph create` completions.

I will add one CLI e2e manifest case in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` that explicitly runs `graph create --enable-sync --e2ee-password <password>` and proves it replaces the separate create, upload, and start setup commands when the local mock sync server is available.

The e2e case should verify that the newly created graph can sync with a second local root by downloading the remote graph, starting sync there, and comparing a marker query across both roots.

I will run parser and build-action tests first and confirm they fail before adding the option spec.

I will run execution tests next and confirm they fail because no graph-create sync orchestration exists yet.

I will run the e2e case after unit tests pass and confirm it fails before the implementation is wired into the built CLI.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

The current `graph create` path is:

```text
src/main/logseq/cli/command/graph.cljs entries
  -> graph create has an empty command-specific spec
  -> build-graph-action :graph-create
  -> action {:type :invoke,
             :command :graph-create,
             :method :thread-api/create-or-open-db,
             :args [repo {}],
             :allow-missing-graph true,
             :persist-repo graph}
  -> commands/execute skips existing-graph validation because allow-missing-graph is true
  -> execute-invoke starts or reuses db-worker-node
  -> transport/invoke :thread-api/create-or-open-db
  -> cli-config/update-config! persists the current graph
```

The current `sync upload` path is:

```text
src/main/logseq/cli/command/sync.cljs
  -> build-action :sync-upload
  -> execute :sync-upload
  -> resolve-runtime-config!
  -> require :http-base
  -> ensure-server!
  -> <sync-worker-runtime!
  -> optional E2EE password verification
  -> transport/invoke :thread-api/db-sync-upload-graph
```

The current `sync start` path is:

```text
src/main/logseq/cli/command/sync.cljs
  -> build-action :sync-start
  -> execute :sync-start
  -> resolve-runtime-config!
  -> require :ws-url
  -> ensure-server!
  -> <sync-worker-runtime!
  -> query :logseq.kv/graph-rtc-e2ee?
  -> ensure E2EE password availability when needed
  -> transport/invoke :thread-api/db-sync-start
  -> wait-sync-start-ready polls :thread-api/db-sync-status
```

The worker APIs already available in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` are:

| Thread API | Current owner | Needed for this feature |
| --- | --- | --- |
| `:thread-api/create-or-open-db` | Graph create and worker startup | Yes. |
| `:thread-api/set-db-sync-config` | CLI sync runtime setup | Yes. |
| `:thread-api/db-sync-upload-graph` | `sync upload` | Yes. |
| `:thread-api/db-sync-start` | `sync start` | Yes. |
| `:thread-api/db-sync-status` | `sync status` and sync-start readiness polling | Yes. |
| `:thread-api/q` | Sync-start E2EE metadata query | Yes. |

No new thread API is required for the planned happy path.

## Goals

Add `--enable-sync` to `graph create` as a boolean option.

Make `graph create --enable-sync --graph <name>` perform create, current graph persistence, sync upload, and sync start in that order.

Reuse the existing sync command runtime behavior so auth, sync config defaults, missing config errors, E2EE password checks, and worker setup stay consistent with `sync upload` and `sync start`.

Keep the worker API surface unchanged unless implementation finds a hard gap in the existing APIs.

Make `graph create --graph <name>` fail when a local graph with the same name already exists.

Keep failures fail-fast and return the real failing stage error.

## Non-goals

Do not add a new `db-worker-node` thread API for create-and-sync orchestration.

Do not add a new public command such as `graph sync create` or `sync create`.

Do not add backward compatibility aliases for old command names.

Do not silently ignore sync upload or sync start failures.

Do not add default sync credentials, default E2EE passwords, or fallback auth state.

Do not automatically run `sync ensure-keys` as part of `graph create --enable-sync`.

Do not change the semantics of `sync upload`, `sync start`, or `graph switch` outside this feature.

## Proposed CLI behavior

The new public command shapes should be:

```text
logseq graph create --graph <name> --enable-sync
logseq graph create --graph <name> --enable-sync --e2ee-password <password>
```

The command should accept `--enable-sync` as a boolean option using the same babashka.cli boolean coercion style as other CLI flags.

The command should accept `--e2ee-password` by reusing the current sync command option semantics and password verification flow.

The command should reject `--e2ee-password` unless `--enable-sync` is true.

The command should still require `--graph`.

When `--enable-sync` is absent or false, `graph create` should create and persist the graph but should fail if a local graph with the same name already exists.

When `--enable-sync` is true, the command should execute these stages:

| Stage | Existing equivalent command | Required behavior |
| --- | --- | --- |
| Create | `graph create --graph <name>` | Create the local graph through `:thread-api/create-or-open-db` only after confirming the graph does not already exist locally. |
| Switch | `graph switch --graph <name>` | Persist the created graph as current graph in `cli.edn`. |
| Upload | `sync upload --graph <name> [--e2ee-password <password>]` | Upload the local graph snapshot using existing sync upload logic and pass the password when provided. |
| Start | `sync start --graph <name> [--e2ee-password <password>]` | Start db-sync websocket client using existing sync start logic and pass the password when provided. |

The structured success payload should include enough stage data for automation to confirm what happened.

The structured success payload should include the graph, repo, create stage result, upload stage result, and start stage result.

A recommended structured success shape is:

```text
{:graph "demo"
 :repo "logseq_db_demo"
 :stages {:create <existing-create-data>
          :upload <existing-sync-upload-data>
          :start <existing-sync-start-data>}}
```

The human success output should be a short multi-line summary.

A recommended human success output is:

```text
Graph created and sync enabled
  Graph: demo
  Create: ok
  Upload: ok
  Start: ok
```

If the upload stage fails, the command should return that failure and should not start sync.

If upload reports that the remote graph already exists, the command should fail fast with the existing upload error.

If the start stage fails after upload succeeds, the command should return the start failure and should not pretend the full create-enable-sync operation succeeded.

If the graph already exists locally, the command should fail before create, upload, or start.

## Proposed implementation design

Add a private `graph-create-spec` to `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

The spec should contain `:enable-sync` with `:coerce :boolean` and a concise English description.

The spec should contain `:e2ee-password` with the same description and coercion style used by `sync upload` and `sync start`.

Wire `graph-create-spec` into the existing `graph create` entry.

Update the example list for `graph create` to include `logseq graph create --graph my-graph --enable-sync` and `logseq graph create --graph my-graph --enable-sync --e2ee-password "my-secret"`.

Update `build-graph-action` for `:graph-create` so it records whether `:enable-sync` is true.

Update `build-graph-action` for `:graph-create` so all create actions require the local graph to be missing before creation starts.

The low-risk shape is to keep the existing `:invoke` action for the plain path and return a dedicated orchestration action only for the enabled path.

The enabled action should carry the existing create method and args so the create stage still uses the same worker call.

A recommended enabled action shape is:

```text
{:type :graph-create-enable-sync
 :command :graph-create
 :repo repo
 :graph graph
 :method :thread-api/create-or-open-db
 :args [repo {}]
 :allow-missing-graph true
 :require-missing-graph true
 :persist-repo graph
 :enable-sync true
 :e2ee-password e2ee-password}
```

Add a new execute branch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` for `:graph-create-enable-sync`.

Implement `execute-graph-create-enable-sync` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

The executor should call the existing create path first instead of duplicating `ensure-server!`, transport invoke, and config persistence code.

The executor should then call public sync orchestration through `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` rather than directly invoking worker sync APIs.

The executor can do this by requiring `logseq.cli.command.sync` and calling `sync-command/execute` with action maps for `:sync-upload` and `:sync-start`.

The upload action should be:

```text
{:type :sync-upload
 :repo repo
 :graph graph
 :e2ee-password e2ee-password}
```

The start action should be:

```text
{:type :sync-start
 :repo repo
 :graph graph
 :e2ee-password e2ee-password}
```

The executor should check `(:status result)` after each stage.

The executor should return immediately when a stage returns `:error`.

The executor should not catch and rewrite sync errors unless it needs to add `:stage` context without changing the original code and message.

The executor should prefer returning existing sync error shapes because scripts may already understand them.

The executor should not invoke `graph switch` as a separate command because `graph create` already persists the graph through `:persist-repo`.

The executor should still ensure config persistence happens before upload and start.

The executor should not call `sync ensure-keys`.

The formatter should render a multi-line human summary for the full create-enable-sync success result.

The JSON and EDN formatters should expose the stage results without flattening them into a single message.

## Execution steps

1. Load @Test-Driven Development before implementation starts.

2. Add parser tests for `--enable-sync` and `--e2ee-password` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.

3. Run `bb dev:test -v logseq.cli.commands-test/test-verb-subcommand-parse-graph-import-export` and confirm the new parser test fails.

4. Add build-action tests for plain `graph create`, enabled `graph create`, and E2EE password forwarding in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.

5. Run `bb dev:test -v logseq.cli.commands-test/test-build-action-graph` and confirm the enabled build-action test fails.

6. Add graph execution tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` with redefined `cli-server/ensure-server!`, `transport/invoke`, `cli-config/update-config!` if needed, and sync status polling helpers as appropriate.

7. Run the focused graph command test and confirm the execution tests fail because no enabled executor exists.

8. Add `graph-create-spec` with `:enable-sync` and `:e2ee-password` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

9. Update the `graph create` command entry to use `graph-create-spec` and the new examples.

10. Update `build-graph-action` to require a missing local graph for all create actions and to produce the enabled orchestration action when `(:enable-sync options)` is true.

11. Add `execute-graph-create-enable-sync` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

12. Require `logseq.cli.command.sync` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` only after confirming there is no circular namespace issue.

13. If a circular namespace issue appears, move the orchestration to `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` where both command namespaces are already required.

14. Wire the new action type into `commands/execute`.

15. Add the new context key `:enable-sync` to the selected context keys in `commands/execute` only if structured output or formatter tests need the flag.

16. Do not add `:e2ee-password` to result context or any data structure that can be printed.

17. Ensure the password is never printed in human, JSON, EDN, verbose, or profile output.

18. Add completion coverage and update command metadata if the completion generator test exposes missing option metadata.

19. Add one sync e2e manifest case in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` after unit behavior is stable.

20. The e2e case should run `graph create --enable-sync --e2ee-password {{e2ee-password-arg}} --graph {{graph-arg}}`, add a marker page or block, download the same remote graph into `graphs-b`, start sync there, wait for status, and compare the marker query across both roots.

21. Run the focused tests listed in the verification section.

22. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document `graph create --enable-sync` and `--e2ee-password` only after behavior and output shape are finalized.

## Edge cases

If `--graph` is missing, the command should still return the existing `:missing-graph` error.

If the local graph already exists, the command should return `:graph-exists` before `:thread-api/create-or-open-db` is invoked.

If sync auth is missing, upload should return the existing missing-auth error and start should not run.

If `:http-base` is explicitly unset or blank, upload should return the existing `:missing-sync-config` error and start should not run.

If upload reports remote graph already exists, the command should return that upload error and start should not run.

If `--e2ee-password` is provided without `--enable-sync`, the command should return an invalid-options error.

If `--e2ee-password` is provided with `--enable-sync`, upload and start should reuse the existing verification and persistence code paths.

If the graph is encrypted and no E2EE password is available when start needs it, the command should return the existing `:e2ee-password-not-found` start error.

If upload succeeds but start times out, the local graph may already be uploaded.

The command should return the start timeout so the user can retry `logseq sync start --graph <name>`.

If config persistence fails after create, upload should not run.

If the CLI is run with `--output json` or `--output edn`, the response should include the successful stage results when the full orchestration succeeds.

If the CLI is run with `--output json` or `--output edn` and a stage fails, the response should preserve the first failed stage error.

If the worker process restarts between upload and start, reuse existing `sync start` server handling instead of adding recovery logic in this feature.

## Verification commands

Run parser and build-action tests:

```bash
bb dev:test -v logseq.cli.commands-test/test-verb-subcommand-parse-graph-import-export
bb dev:test -v logseq.cli.commands-test/test-build-action-graph
```

Run graph command execution tests:

```bash
bb dev:test -v logseq.cli.command.graph-test
```

Run sync command regression tests:

```bash
bb dev:test -v logseq.cli.command.sync-test
```

Run completion tests if command metadata changed:

```bash
bb dev:test -v logseq.cli.completion-generator-test
```

Run the CLI sync e2e suite after building the CLI runtime.

The new e2e manifest case must be included in this run and should fail before implementation because `graph create --enable-sync` is not yet wired.

```bash
bb -f cli-e2e/bb.edn build
bb -f cli-e2e/bb.edn test --skip-build
```

Run full local validation before submission:

```bash
bb dev:lint-and-test
```

## Testing Details

The parser and build-action tests verify user-visible CLI behavior and action construction rather than internal data structures alone.

The execution tests verify behavior by observing ordered worker invocations, config persistence before sync, and fail-fast behavior across upload and start stages.

The sync regression tests verify the new orchestration did not bypass existing auth, config, E2EE, and readiness behavior.

The e2e case verifies the command works through the built CLI against the existing sync test harness instead of only through mocked unit tests.

## Implementation Details

- Add `--enable-sync` only to `graph create`.
- Add `--e2ee-password` to `graph create` only for the `--enable-sync` flow.
- Reuse the existing sync password verification and persistence code paths.
- Make local graph name collisions fail before graph creation.
- Use existing sync command execution instead of direct worker sync calls where possible.
- Do not add a new `db-worker-node` thread API.
- Do not automatically run `sync ensure-keys`.
- Persist the created graph before upload and start.
- Return the first failed stage without continuing.
- Preserve existing sync error shapes.
- Render a multi-line human success summary.
- Return structured stage results for JSON and EDN output.
- Update CLI docs after implementation behavior is settled.
- Keep the e2e case in the sync suite because it depends on the sync server harness.

## Question

There are no open product questions after the current decisions.

Implementation should still verify whether requiring `logseq.cli.command.sync` from `logseq.cli.command.graph` creates a circular namespace dependency.

If it does, place create-enable-sync orchestration in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` instead.

---
