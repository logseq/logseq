# Logseq CLI Doctor Command Implementation Plan

Goal: Add a `doctor` command that verifies logseq-cli runtime availability before normal command execution, including `db-worker-node.js` existence and `data-dir` read and write readiness.

Architecture: Add a dedicated `logseq.cli.command.doctor` namespace and wire it into the existing `parse-args` -> `build-action` -> `execute` pipeline in `logseq.cli.commands`.
Architecture: Reuse existing helpers in `logseq.cli.data-dir` and `logseq.cli.server` for permission checks and daemon liveness probes, then return one structured diagnostics report.

Tech Stack: ClojureScript, babashka.cli command table, Node.js `fs` and `path`, Promesa, existing CLI formatter and test harness.

Related: Builds on `docs/agent-guide/019-logseq-cli-data-dir-permissions.md`.
Related: Relates to `docs/agent-guide/015-logseq-cli-db-worker-node-housekeeping.md`.
Related: Relates to `docs/agent-guide/017-logseq-cli-db-worker-node-housekeeping-2.md`.
Related: Relates to `docs/agent-guide/030-logseq-cli-db-graph-default-dir-locking.md`.

## Problem statement

The current CLI fails only when a concrete command touches startup paths, so users discover environment problems late.

We need a fast explicit health command that confirms whether logseq-cli can run reliably in the current machine context.

The minimum required checks are the presence of `db-worker-node.js` and read and write access for `data-dir`.

Note: `dist/db-worker-node.js` is a thin entry wrapper that loads `static/db-worker-node.js`. Doctor should validate the actual runtime target in `static/` rather than only the `dist/` wrapper.

We should also surface practical runtime risks already modeled by current code, especially stale or unready db-worker instances discovered from lock files and health endpoints.

This plan keeps scope to diagnostics and does not change daemon lifecycle semantics, lock protocol, or graph migration behavior.

## Testing Plan

I will follow `@test-driven-development` and write all failing tests before adding implementation behavior.

I will add parser and action-dispatch tests for `doctor` in `commands_test` so command discovery and help output are guarded.

I will add dedicated `doctor` command tests that cover success, missing script file, and `data-dir` permission failure behavior.

I will add `format` tests to ensure human and machine-readable output for `doctor` are stable and useful.

I will run focused test namespaces first to validate RED and GREEN transitions, then run the full lint and test suite.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current behavior map

| Area | Current implementation | Required change |
|---|---|---|
| Runtime script path | `spawn-server!` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` starts `../dist/db-worker-node.js`, which delegates to `../static/db-worker-node.js`, but no explicit diagnostic command validates that runtime target path readiness. | Add `doctor` check that validates the effective script file existence and readability before startup commands fail. |
| Data-dir readiness | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/data_dir.cljs` enforces directory creation and read or write access in `ensure-data-dir!`. | Reuse `ensure-data-dir!` inside `doctor` and report a dedicated failing check item. |
| Daemon liveness visibility | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` has `list-servers`, `server-status`, `ready?`, and `healthy?`, but no consolidated health summary command. | Add optional runtime checks in `doctor` that flag non-ready running servers discovered from lock files. |
| CLI discoverability | Top-level help and command table in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` do not include diagnostics entrypoint. | Add `doctor` to command entries and help summaries. |

## Proposed doctor checks

| Check id | Behavior | Existing helper to reuse | Failure signal |
|---|---|---|---|
| `db-worker-script` | Verify `../static/db-worker-node.js` exists and is readable as a file (and optionally verify `../dist/db-worker-node.js` wrapper exists). | New shared path helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` plus Node `fs` checks in doctor command. | `:doctor-script-missing` or `:doctor-script-unreadable`. |
| `data-dir` | Verify configured or default data dir can be created and is read and write accessible. | `logseq.cli.data-dir/ensure-data-dir!` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/data_dir.cljs`. | Existing `:data-dir-permission` surfaced as doctor failure detail. |
| `running-servers` | Verify currently locked db-worker instances are reachable on readiness endpoint. | `logseq.cli.server/list-servers` status derivation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`. | `:doctor-server-not-ready` for any server reported as `:starting`. |

## Integration sketch

```text
logseq doctor
  -> parse-args (commands table)
  -> build-action {:type :doctor}
  -> execute-doctor
       1) check effective db-worker-node.js runtime path (`static/db-worker-node.js`).
       2) check data-dir accessibility.
       3) inspect running server readiness.
  -> format result for human/json/edn.
```

## Implementation plan

### Phase 1: RED for command plumbing.

1. Add failing assertions in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that top-level help includes `doctor` and bold-styled `doctor` command text.
2. Add a failing parse test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `commands/parse-args ["doctor"]` returning `:ok? true` with command `:doctor`.
3. Add a failing build-action test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `{:command :doctor}` producing action type `:doctor`.
4. Run `bb dev:test -v 'logseq.cli.commands-test'` and confirm failures are specifically on new doctor assertions.

### Phase 2: RED for doctor behavior.

5. Create `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/doctor_test.cljs` with namespace and fixtures consistent with existing command tests.
6. Add a failing test that marks script check as failed when `static/db-worker-node.js` path does not exist.
7. Add a failing test that marks data-dir check as failed when `ensure-data-dir!` throws `:data-dir-permission`.
8. Add a failing test that returns all checks passed when script and data-dir are both valid and no running server is unready.
9. Add a failing test that reports runtime warning or failure when `list-servers` includes entries with status `:starting`.
10. Run `bb dev:test -v 'logseq.cli.command.doctor-test'` and confirm all new tests fail for expected reasons.

### Phase 3: GREEN for command integration.

11. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs` with `entries`, `build-action`, and `execute-doctor` returning structured check results.
12. Wire doctor namespace into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` requires and append `doctor-command/entries` into `table`.
13. Add `:doctor` branch in `build-action` inside `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
14. Add `:doctor` branch in `execute` inside `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
15. Update top-level command grouping in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` to show `doctor` in help output.
16. Run `bb dev:test -v 'logseq.cli.commands-test'` and confirm doctor parse and help tests are green.

### Phase 4: GREEN for doctor checks.

17. Extract or add a shared db-worker script path helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` so spawn and doctor share one source of truth.
18. Implement script existence and readability check in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs` using Node `fs` metadata checks.
19. Implement data-dir check in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs` by invoking `logseq.cli.data-dir/ensure-data-dir!`.
20. Implement running-server readiness check in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs` using `logseq.cli.server/list-servers`.
21. Return deterministic check ordering and include actionable message per check in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs`.
22. Re-run `bb dev:test -v 'logseq.cli.command.doctor-test'` and confirm all doctor behavior tests are green.

### Phase 5: RED and GREEN for formatting and docs.

23. Add failing output tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human summary rendering of doctor checks.
24. Add failing output tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for json and edn output preserving structured check payload.
25. Implement doctor-specific human formatter in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
26. Ensure `doctor` output includes overall status and per-check status in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
27. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` with `doctor` command description, examples, and expected failure hints.
28. Run `bb dev:test -v 'logseq.cli.format-test'` and confirm new doctor formatting tests are green.

### Phase 6: Verify RED to GREEN cycle completion, refactor, and full validation.

29. Run `bb dev:test -v 'logseq.cli.commands-test'` and ensure no regressions in help parsing and action dispatch.
30. Run `bb dev:test -v 'logseq.cli.command.doctor-test'` and ensure all doctor checks are behavior-driven and stable.
31. Run `bb dev:test -v 'logseq.cli.main-test'` to confirm entrypoint behavior remains compatible.
32. Run `bb dev:test -v 'logseq.cli.server-test'` to verify shared script path changes do not break server startup assumptions.
33. Run `bb dev:test -v 'logseq.cli.format-test'` to validate output contracts.
34. Run `bb dev:lint-and-test` and confirm zero failures and zero errors.
35. Review changed code against `@prompts/review.md` before merge.

## Edge cases to cover

| Scenario | Expected behavior |
|---|---|
| `static/db-worker-node.js` path exists but points to a directory. | `doctor` reports script check failure with explicit path and reason. |
| `data-dir` path points to a file. | `doctor` fails with `:data-dir-permission` detail and does not continue to misleading pass status. |
| `data-dir` is readable but not writable. | `doctor` fails data-dir check and returns actionable permission hint. |
| Running server lock exists but `/readyz` is not healthy. | `doctor` reports runtime check as failed for that repo. |
| No running server exists. | Runtime server check passes with empty server list and does not force daemon startup. |
| `--output json` is used. | Doctor returns stable machine-readable check list for scripts and automation. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'logseq.cli.commands-test'
bb dev:test -v 'logseq.cli.command.doctor-test'
bb dev:test -v 'logseq.cli.server-test'
bb dev:test -v 'logseq.cli.format-test'
bb dev:test -v 'logseq.cli.main-test'
bb dev:lint-and-test
```

Each command should finish with zero failures and zero errors in GREEN phase.

Each RED phase run should fail on newly added doctor assertions and not on unrelated setup errors.

## Testing Details

The tests focus on command behavior and diagnostics outcomes through public parser and executor boundaries.

The tests avoid implementation-detail assertions and instead validate user-observable results for success and failure cases.

The formatter tests ensure the same doctor payload is usable for both human troubleshooting and automation output modes.

## Implementation Details

- Keep `doctor` as a first-class command in the existing CLI command table.
- Reuse `ensure-data-dir!` instead of reimplementing permission checks.
- Reuse server health status discovery through existing `list-servers` behavior.
- Keep check execution deterministic and output stable for CI parsing.
- Keep command scope read-only for diagnostics and avoid auto-remediation side effects.
- Return explicit error codes for script and runtime health failures.
- Preserve current graph and repo naming semantics and lock protocol behavior.
- Add targeted formatter support so human output is concise and actionable.
- Verify all changes via focused tests before full lint and test pass.
- Follow `@test-driven-development` and `@prompts/review.md` throughout implementation.

## Question

Resolved: `doctor` will fail fast on the first failed check.

Resolved: `doctor` will treat `:starting` servers as warnings when script and data-dir checks pass.

Resolved: `doctor` will support a future `--repo` scoped deep check that verifies per-graph lock path and repo directory access without starting the daemon.

---
