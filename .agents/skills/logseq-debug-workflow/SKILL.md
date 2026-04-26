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

### Logseq CLI

Before running or interpreting any `logseq` command, load repo-local `logseq-cli`.

Useful tools:

- `--verbose` for detailed stderr/debug output.
- `--profile` for timing and performance debugging.
- `logseq debug` for CLI diagnostics.
- Any `logseq` command needed for inspection or reproduction.
- Read-only inspection commands first when possible: `graph info`, `graph validate`, `doctor`, `list`, `show`, `query`, `search`.
- `--output edn` or `--output json` when exact data shape matters.

### `db-worker-node`

Before controlling or attaching to `db-worker-node`, load repo-local `logseq-repl`.

Useful tools:

- `db-worker-node-<timestamp>.log` files in the graph directory when a graph directory is known.
- Provided log lines, stack traces, request payloads, and bad data shapes when no graph is known.
- REPL checks against relevant vars/functions using captured data.
- Small reproductions at any useful level: function, handler, query, transaction, serialization, or full graph flow.
- Graph/process checks only when graph or process context exists.

Do not require a complete graph-based reproducer for `db-worker-node` bugs.

### User-facing UI text

Before editing user-facing text or translation keys, load repo-local `logseq-i18n`.

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
- For performance bugs, compare `--profile` before/after on the same graph and command.
- For CLI bugs, reuse the same `--graph`, `--data-dir`, and output mode.
- For `db-worker-node`, verify at the smallest reproducing level; if graph/process is involved, verify against the expected worker, not a stale one.

Common checks: `bb dev:test -v <namespace/testcase-name>`, `bb dev:lint-and-test`, `bb dev:cli-e2e`.
