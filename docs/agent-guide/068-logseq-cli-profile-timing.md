# Logseq CLI Profile Stage Timing Implementation Plan

Goal: Add a global `--profile` option with default `false` so every `logseq` command can print stage-by-stage elapsed time without breaking existing command output contracts.

Architecture: Introduce a lightweight profiling session in `logseq-cli` that records ordered stage spans across argument parsing, config resolution, command execution, server orchestration, and transport calls.
Architecture: Reuse existing `logseq-cli -> db-worker-node` boundaries by instrumenting `logseq.cli.main`, `logseq.cli.server`, and `logseq.cli.transport` rather than changing db-worker-node API contracts.
Architecture: Emit profile report lines to stderr only so stdout remains identical for human, JSON, and EDN command outputs.

Tech Stack: ClojureScript, `promesa`, `babashka.cli`, `lambdaisland.glogi`, Node.js process I/O, existing `logseq-cli` and `db-worker-node` runtime boundaries.

Related: Builds on `docs/agent-guide/003-db-worker-node-cli-orchestration.md`, `docs/agent-guide/005-logseq-cli-output-and-db-worker-node-log.md`, and `docs/agent-guide/028-logseq-cli-verbose-debug.md`.

## Problem statement

`logseq-cli` currently has debug logging via `--verbose`, but it does not provide a stable per-stage timing summary for each command run.

Developers can see individual transport elapsed logs in debug mode, but they cannot reliably answer where command time is spent end to end.

This is especially painful for commands that include daemon startup, lock waiting, readiness checks, and multiple thread-api invocations.

The feature request is to add a global `--profile` option with default `false` and print stage timing for command execution.

The new behavior must avoid changing functional command results and must not pollute stdout machine output.

## Current implementation baseline

Global CLI options are defined in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` via `global-spec*` and `parse-leading-global-opts`.

Command runtime orchestration is centralized in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` in `run!`.

Action dispatch and pre-checks are centralized in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` in `execute`.

Daemon lifecycle orchestration is centralized in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` with `ensure-server-started!` and helpers delegated to `logseq.db-worker.daemon`.

Transport round trips are centralized in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs` in `invoke`.

db-worker-node daemon CLI parsing lives in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` and currently has no profile flag.

## Target behavior

`--profile` is a global option for `logseq` commands and defaults to `false` when absent.

When `--profile` is enabled, command stdout content remains unchanged and profile output is written to stderr.

Profile output includes total duration and ordered stage rows with elapsed milliseconds.

Repeated stages such as multiple `transport/invoke` calls are aggregated by stage key with count, total, and average durations.

A failed command still prints profile data for stages that ran before the failure.

Help and version paths also support profiling and print minimal stage reports.

No db-worker-node HTTP endpoint or thread-api signature changes are required.

### Proposed stage taxonomy

| Stage key | Source file | Trigger |
| --- | --- | --- |
| `cli.parse-args` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `commands/parse-args` call. |
| `cli.resolve-config` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `config/resolve-config` call. |
| `cli.ensure-data-dir` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `data-dir/ensure-data-dir!` call. |
| `cli.build-action` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `commands/build-action` call. |
| `cli.execute-action` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `commands/execute` call. |
| `server.ensure-started` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | `ensure-server-started!` total path. |
| `server.spawn-daemon` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | daemon spawn branch only. |
| `server.wait-lock` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | wait for lock file and bound port. |
| `server.wait-ready` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | wait for `/readyz`. |
| `transport.invoke:<method>` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs` | per thread-api HTTP invoke. |
| `cli.format-result` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | `format/format-result` call. |
| `cli.total` | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | whole `run!` lifecycle. |

### Proposed stderr output example

```text
[profile] total=842ms command=graph-info status=ok
[profile] cli.parse-args count=1 total=2ms avg=2ms
[profile] cli.resolve-config count=1 total=1ms avg=1ms
[profile] cli.ensure-data-dir count=1 total=3ms avg=3ms
[profile] cli.build-action count=1 total=1ms avg=1ms
[profile] server.ensure-started count=1 total=522ms avg=522ms
[profile] server.wait-ready count=1 total=417ms avg=417ms
[profile] transport.invoke:thread-api/q count=2 total=286ms avg=143ms
[profile] cli.format-result count=1 total=2ms avg=2ms
```

## Scope and non-goals

In scope is a global `--profile` option for `logseq` command execution profiling.

In scope is timing visibility for CLI orchestration stages and transport boundaries that dominate latency.

In scope is deterministic stderr profile output suitable for local debugging and CI logs.

Out of scope is changing db-worker-node protocol payloads or introducing profile fields into command data output.

Out of scope is a full distributed trace system across child processes.

Out of scope is changing default command behavior when `--profile` is not provided.

## Testing Plan

I will follow `@test-driven-development` and write failing tests before implementation.

I will add a parser test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that asserts `--profile` is accepted as a global option and is absent by default.

I will add completion metadata tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` to verify `--profile` appears in generated zsh and bash completions.

I will add runtime profiling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/main_test.cljs` that assert profile lines are produced only when `--profile` is enabled.

I will add transport profiling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/transport_test.cljs` that assert `transport.invoke:<method>` stage records include elapsed timing and aggregation counts.

I will add server lifecycle profiling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` that verify spawn and wait stages are recorded in profile-enabled runs.

I will add a regression test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` confirming stdout JSON remains parseable and profile lines only appear on stderr.

I will update docs assertions or snapshots only where global option text changes.

NOTE: I will write *all* tests before I add any implementation behavior.

## Architecture sketch

```text
raw argv
  -> cli.main/run!
      -> profile session (enabled by --profile)
      -> parse args
      -> resolve config
      -> ensure data dir
      -> build action
      -> execute action
           -> cli.server ensure/start/reuse db-worker-node
           -> cli.transport invoke thread-api methods
      -> format result
      -> stdout (unchanged command output)
      -> stderr (profile summary when enabled)
```

## Implementation plan

1. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` and add `:profile` to `global-spec*` as boolean global option with help text.

2. Add a RED test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` proving `commands/parse-args` accepts `--profile` and stores it under `:options`.

3. Run the focused parser test and confirm it fails for the expected missing-option reason.

4. Add RED completion tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` asserting generated completion scripts include `--profile`.

5. Run focused completion tests and confirm failure before implementation.

6. Create `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/profile.cljs` with a small profiling session API for span recording, aggregation, and stderr rendering.

7. Add RED unit tests for the new profiling helper in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/log_test.cljs` or a new `profile_test.cljs` namespace.

8. Run focused profiling helper tests and confirm failure before implementation.

9. Instrument `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` to create a profiling session when `--profile` is present and wrap top-level stages.

10. Extend `run!` return shape to include profile report lines or profile metadata in a non-breaking internal field consumed by `main`.

11. Update `main` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` to print profile lines to stderr after command output handling.

12. Add RED main runtime tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/main_test.cljs` for both enabled and disabled profile modes.

13. Run focused main tests and confirm they fail before instrumentation is complete.

14. Instrument `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` stage boundaries for ensure, spawn, wait-lock, and wait-ready using the shared profiling session in config.

15. Add RED server profiling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` to validate stage records for spawn and reuse paths.

16. Run focused server tests and confirm expected failing assertions.

17. Instrument `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs` so each invoke records `transport.invoke:<method>` spans.

18. Add RED transport profiling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/transport_test.cljs` verifying stage key naming and aggregation semantics.

19. Run focused transport tests and confirm failure before final implementation pass.

20. Wire profile context propagation through the existing config flow without changing command action schemas.

21. Add integration coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` to verify stdout contract safety with `--output json` plus `--profile`.

22. Run focused integration tests and confirm profile output is stderr-only.

23. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` with a concise `--profile` section including output stream and stability notes.

24. Run `bb dev:test -v logseq.cli.main-test`, `bb dev:test -v logseq.cli.transport-test`, and `bb dev:test -v logseq.cli.server-test`.

25. Run `bb dev:test -v logseq.cli.integration-test` and verify machine-output regression safety.

26. Run `bb dev:lint-and-test` for final regression.

## File-by-file change map

| File | Change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` | Add `:profile` global option metadata. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/profile.cljs` | Add profile session lifecycle, span recording, aggregation, and render helpers. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs` | Create profile session, wrap top-level stages, and print stderr report. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | Record daemon lifecycle stage timings for ensure/spawn/wait phases. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs` | Record per-method invoke stage timings. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add parse coverage for `--profile`. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Add completion coverage for new global option. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/main_test.cljs` | Add runtime profile-on and profile-off behavior tests. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` | Add stage timing coverage for daemon orchestration paths. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/transport_test.cljs` | Add invoke stage timing and aggregation tests. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` | Assert stdout stability with profile enabled. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document `--profile` behavior and stderr output contract. |

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test` | Global option parse tests including `--profile` pass. |
| `bb dev:test -v logseq.cli.completion-generator-test` | Completion output includes `--profile` for zsh and bash. |
| `bb dev:test -v logseq.cli.main-test` | Profile output appears only when enabled. |
| `bb dev:test -v logseq.cli.transport-test` | Per-method transport stage timing tests pass. |
| `bb dev:test -v logseq.cli.server-test` | Daemon lifecycle stage profiling tests pass. |
| `bb dev:test -v logseq.cli.integration-test` | Structured stdout contract remains stable with profiling enabled. |
| `bb dev:lint-and-test` | Full lint and test suite remains green. |

## Edge cases

`--profile` combined with `--output json` or `--output edn` must not inject profile text into stdout.

Commands that return early, such as `--help` and `--version`, should still produce valid and short profile reports when enabled.

Commands failing during parse, config, or daemon startup should report only completed stages and not crash profile rendering.

Commands with many thread-api calls, such as `show` and `sync download`, should aggregate repeated stage keys to avoid huge stderr output.

Timing collection must remain low overhead when enabled and near-zero overhead when disabled.

Concurrent async calls should keep deterministic aggregation and avoid data races in shared profile state.

Detached daemon startup should still be represented from the CLI perspective even though child-process internals are not directly traced.

## Rollout and compatibility notes

This feature is opt-in and does not change default output behavior.

Profile report output in this scope is human-readable text only.

Stage key names are internal debug labels and are not a semver-stable public contract.

If users request machine-parseable profile output later, add a follow-up `--profile-format` option instead of changing this first version.

## Testing Details

Behavioral coverage focuses on whether users can observe stage timing only when `--profile` is enabled and whether normal command output remains untouched.

Integration tests must validate real command execution paths through server orchestration and transport boundaries, not only helper mocks.

The most critical regression check is stdout purity for machine outputs while profiling data is emitted to stderr.

## Implementation Details

- Keep profile output stderr-only.
- Add `--profile` to global option parsing and completion metadata.
- Introduce a dedicated profile helper namespace instead of spreading ad hoc timing atoms.
- Pass profile session through config to avoid broad action schema changes.
- Instrument top-level `run!` stages in `main.cljs`.
- Instrument db-worker lifecycle boundaries in `server.cljs`.
- Instrument per-method invoke timing in `transport.cljs`.
- Aggregate repeated stage keys with count, total, and average.
- Preserve all existing command result formatting behavior.
- Document option behavior in CLI docs.

## Question

None.

---
