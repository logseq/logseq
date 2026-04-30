---
name: logseq-debug-workflow
description: Debug Logseq bugs with the right runtime, concrete before/after evidence, and end-to-end reproduction steps.
---

# Logseq Debug Workflow

Use for any Logseq bug investigation.

## Core rule

Treat this as a debugging workflow, not a code-only change.

Before claiming a fix, you must:

1. Choose the correct *runtime repl* and say why:
   - `:app` for renderer, DOM, UI, frontend state
   - `:electron` for main-process, BrowserWindow, IPC, app config
   - `:db-worker-node` for worker DB behavior, worker IPC, queries, transactions
   - CLI for `logseq` command behavior
2. Reproduce the bug in *runtime REPL* before editing code.
3. Capture concrete evidence from that runtime: REPL output, CLI output, logs, or a failing test that matches the real runtime path.
4. Check relevant logs early.
5. Apply the smallest justified fix.
6. Re-run the same reproduction flow after the fix and capture evidence again.
7. Include restart/reload/reopen verification when the bug involves settings, startup, persistence, window creation, or cross-process behavior.

## Do not conclude early

Do **not** say the bug is fixed if any of these is missing:

- pre-fix reproduction evidence
- relevant log evidence, or an explicit statement that checked logs had nothing useful
- post-fix evidence from the same runtime/path
- required end-to-end lifecycle verification

Unit tests alone are **not** enough when this skill applies, unless the bug is truly unit-level and you explicitly justify that.

If the environment blocks full verification, report:

- the blocker
- what you tried
- which evidence is still missing
- the strongest partial evidence you have

## Debugging tools

### General

- Add labeled `prn` checkpoints when helpful.
- Use small REPL/eval checks.
- Use targeted tests to confirm behavior.
- Inspect only relevant inputs, branches, transformed values, outputs, and errors.
- For async flows, inspect both sides of the async boundary.

### Logseq REPL

check `logseq-repl` skill.

### Logs

Logs are evidence. Check them early for Electron, CLI, worker, IPC, async, or persistence issues.

Common locations:
- `tmp/desktop-app-repl/desktop-electron.log` (logseq-repl skill)
- `tmp/logseq-repl/shared-shadow-watch.log` (logseq-repl skill)
- `~/Library/Logs/Logseq/main.log`
- `~/Library/Logs/Logseq/main.old.log`
- `~/Library/Application Support/Logseq/configs.edn`
- graph-local `db-worker-node-<timestamp>.log`

### Logseq CLI

Before using `logseq`, load `logseq-cli` skill.

## Required final output

The final response must include these sections or an equivalent structure:

1. **Runtime chosen** — which *runtime REPL* you used and why
2. **Pre-fix reproduction** — reproduce bug in *runtime REPL*, exact steps and evidence
3. **Root cause** — concrete cause and relevant files/flow
4. **Fix applied** — short description of the change
5. **Post-fix verification** — same steps again with new evidence
6. **Additional verification** — tests/checks run, and what was not verified
7. **Gaps or blockers** — any missing evidence and why

## Quick checklist

Before ending, make sure the answer is yes to all:

- Did I reproduce the bug before fixing it?
- Did I show evidence, not just claim reproduction?
- Did I inspect relevant logs?
- Did I verify in the correct runtime?
- Did I rerun the same scenario after the fix?
- Did I include both before and after evidence in the final output?
- Did I avoid claiming completion if required evidence is missing?

## Verification reminders

- Never run tests, lint, build, or E2E verification in the background.
- Check logs before trusting REPL/CLI output alone.
- For performance bugs, compare `--profile` before/after on the same graph and command.
- For CLI bugs, reuse the same `--graph`, `--data-dir`, and output mode.
- For REPL debugging, verify against the intended runtime, not a stale one.

Common checks: `bb dev:test -v <namespace/testcase-name>`, `bb dev:lint-and-test`, `bb dev:cli-e2e`.
