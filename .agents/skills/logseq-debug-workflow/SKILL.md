---
name: logseq-debug-workflow
description: Debug Logseq bugs by using repo-local debugging tools and always producing concrete reproduction steps, plus a reproduction script when possible.
---

# Logseq Debug Workflow

Use for any Logseq bug investigation.

## Available debugging tools

### General code debugging

- Add labeled `prn` checkpoints for Clojure/ClojureScript values.
- Use small REPL/eval checks when available.
- Use targeted tests to confirm behavior.
- Inspect only relevant inputs, branch decisions, transformed values, outputs, and errors.
- For async flows, inspect both sides of the async boundary.

### Logseq REPL

Prefer repo-local `logseq-repl` for runtime debugging. Load it before starting or attaching to Logseq REPLs.

Use it to pick and run the right runtime:

- `:app` for Desktop renderer, DOM, UI, frontend state, and page rendering.
- `:electron` for Electron main-process behavior, BrowserWindow setup, IPC handlers, and app config.
- `:db-worker-node` for Node worker behavior, graph DB operations, worker IPC, queries, transactions, and serialization.

Use small REPL scripts to reproduce at the narrowest useful level, then confirm with logs and tests when possible.

### Logs are important evidence

Check relevant logs early for Electron, CLI, worker, IPC, async, or surprising REPL results. Logs can reveal hidden promise failures, serialization errors, and swallowed exceptions.

Common locations: `tmp/desktop-app-repl/desktop-electron.log`, `tmp/logseq-repl/shared-shadow-watch.log`, `~/Library/Logs/Logseq/main.log`, `~/Library/Logs/Logseq/main.old.log`, `~/Library/Application Support/Logseq/configs.edn`, and graph-local `db-worker-node-<timestamp>.log` files.

### Logseq CLI

Before running or interpreting any `logseq` command, load repo-local `logseq-cli`.

Useful tools:

- `--verbose` for detailed stderr/debug output.
- `--profile` for timing and performance debugging.
- `logseq debug` for CLI diagnostics.
- Any `logseq` command needed for inspection or reproduction.
- Read-only inspection commands first when possible: `graph info`, `graph validate`, `doctor`, `list`, `show`, `query`, `search`.
- `--output edn` or `--output json` when exact data shape matters.

## Reproduction output requirements

Every debugging result must include:

1. Concrete reproduction steps with exact commands, inputs, graph/data-dir info if relevant, and expected vs actual result.
2. Evidence used: logs, stack trace, CLI output, profile output, REPL result, test failure, or captured data shape.
3. Root cause, if found; otherwise the most likely narrowed boundary.
4. Verification performed or why verification was not possible.

Also provide a reproduction script whenever possible:

- Prefer a Clojure/ClojureScript snippet that can be pasted directly into the relevant REPL.
- If there is no usable repo/runtime REPL, provide a Babashka or shell script instead.
- Use a scratch graph or disposable test data when mutation is needed.
- Do not mutate a user graph unless it is explicitly disposable or backed up.
- If no script is possible, explain why and provide the closest exact command sequence instead.

## Verification reminders

- Never run tests, lint, build, or E2E verification in the background.
- Check relevant logs before concluding from REPL/CLI output alone.
- For performance bugs, compare `--profile` before/after on the same graph and command.
- For CLI bugs, reuse the same `--graph`, `--data-dir`, and output mode.
- For REPL debugging, verify against the intended runtime (`:app`, `:electron`, or `:db-worker-node`), not a stale or wrong one.

Common checks: `bb dev:test -v <namespace/testcase-name>`, `bb dev:lint-and-test`, `bb dev:cli-e2e`.
