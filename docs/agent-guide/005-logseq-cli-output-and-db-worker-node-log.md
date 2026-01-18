# Logseq CLI Output and db-worker-node Log Implementation Plan

Goal: Improve all logseq-cli human output for clarity and usability, and write db-worker-node logs to <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log with retention of the most recent 7 logs.

Architecture: Add a dedicated human output formatter with per-command renderers and consistent error messaging in the CLI formatting layer.
Add a file-based glogi appender for db-worker-node that writes logs into the graph-specific data directory using dated filenames and retention while keeping console logging behavior explicit and configurable.

Tech Stack: ClojureScript, babashka/cli, lambdaisland.glogi, Node.js fs/path.

Related: Builds on docs/agent-guide/004-logseq-cli-verb-subcommands.md and docs/agent-guide/003-db-worker-node-cli-orchestration.md.

## Problem statement

The current logseq-cli human output is mostly raw pr-str output, which is hard to read and inconsistent across commands.
Users need clearer, command-specific summaries, stable table formats, and more helpful error messages for CLI usage.
The db-worker-node process currently logs only to console, but operational debugging requires a per-graph log file stored under the data directory with simple retention.

## Testing Plan

I will add unit tests for human output formatting functions to ensure stable, readable rendering for each command result shape.
I will add unit tests for error formatting to ensure consistent human output for common failure cases.
I will add an integration test that starts db-worker-node and verifies that a log file is created at <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log.
I will add an integration test that exercises a log-producing db-worker-node action and asserts the log file contains the expected log entries.
I will follow @test-driven-development for all behavior changes.
NOTE: I will write *all* tests before I add any implementation behavior.

## Architecture sketch

The CLI outputs structured results and the formatter converts them into human-friendly text based on the command and payload.
The db-worker-node daemon configures glogi to append to a per-graph log file under the repo-specific data directory.

ASCII diagram:

+-----------------+     format-result     +------------------------+
| logseq-cli      | --------------------> | human output formatter  |
| result payloads | <-------------------- | command renderers       |
+-----------------+                       +------------------------+

+------------------+   glogi appender   +-------------------------------------+
| db-worker-node   | -----------------> | <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log |
+------------------+                    +-------------------------------------+

## Implementation plan

1. Use tool(update_plan) to track the full task list and include the @test-driven-development red-green-refactor steps.
2. Read @test-driven-development guidelines and confirm the red phase will include all CLI output and log file tests first.
3. Review existing CLI output shapes in src/main/logseq/cli/commands.cljs to catalog the current :data payloads by command.
4. Review current formatting in src/main/logseq/cli/format.cljs and identify all human output paths that need command-specific rendering.
5. Define a human output specification table in docs/agent-guide/005-logseq-cli-output-and-db-worker-node-log.md that maps each command to its target human output layout.
6. Add unit test scaffolding for CLI formatting in src/test/logseq/cli/format_test.cljs (or a new namespace) using representative :status/:data payloads.
7. Write a failing unit test for list commands to ensure human output renders a table with a header and row count.
8. Write a failing unit test for add/remove commands to ensure human output renders a succinct success line with key identifiers.
9. Write a failing unit test for graph management commands to ensure human output includes graph name and status text.
10. Write a failing unit test for server commands to ensure human output includes repo, status, host, and port when available.
11. Write a failing unit test for search and show commands to ensure human output includes result counts and stable ordering.
12. Write a failing unit test for error formatting to ensure error codes and helpful hints are included in human output.
13. Add a failing integration test in src/test/frontend/worker/db_worker_node_test.cljs (or a new namespace) that starts db-worker-node and asserts the log file exists at <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log.
14. Add a failing integration test that performs a db-worker-node action and asserts at least one log line is appended to the log file.
15. Implement a command-aware human formatter in src/main/logseq/cli/format.cljs, using a dispatch on command or data shape.
16. Update src/main/logseq/cli/main.cljs to pass command context into the formatter so it can choose the correct renderer.
17. Normalize CLI result payloads in src/main/logseq/cli/commands.cljs to include explicit command identifiers where needed for formatting.
18. Ensure human output uses consistent spacing, headers, and ordering for list output, and avoids raw EDN dumps in normal cases.
19. Add a utility for table rendering with fixed column widths and truncation behavior in src/main/logseq/cli/format.cljs or a new helper namespace.
20. Implement db-worker-node log file setup in src/main/frontend/worker/db_worker_node.cljs using lambdaisland.glogi appenders.
21. Compute the log path using frontend.worker.db-worker-node-lock/repo-dir and ensure the directory exists before writing.
22. Configure glogi to append to <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log and define whether console logging remains enabled.
23. Update help text in src/main/frontend/worker/db_worker_node.cljs to document the log file location and log-level flag behavior.
24. Update docs/cli/logseq-cli.md with the new human output expectations and any new formatting options.
25. Run unit tests in the red phase to confirm failures, then implement minimal changes to make them pass.
26. Run bb dev:test -v logseq.cli.* and bb dev:test -v frontend.worker.db-worker-node-test in the green phase.
27. Run bb dev:lint-and-test after all changes to validate lint and unit tests.

## Edge cases

The repo name contains characters that change the pool directory name, so the log file path must use worker-util/get-pool-name consistently.
The data directory is on a filesystem without write permissions, which should surface a clear error message and non-zero exit code.
Multiple db-worker-node instances for different repos should not overwrite each other’s log files.
The log file should be created even if no requests are served yet and only startup logs are emitted.
Human output should remain stable when list results are empty or fields are missing.
The human formatter should avoid printing large nested maps by default for search or show results.

## Testing commands and expected output

Run a focused unit test during the red phase.

```bash
bb dev:test -v logseq.cli.format-test/test-human-output-list
```

Expected output includes a failing assertion and exits with a non-zero status code.

Run the db-worker-node log integration test in the green phase.

```bash
bb dev:test -v frontend.worker.db-worker-node-test/test-log-file-created
```

Expected output includes 0 failures and 0 errors.

Run the full lint and unit test suite when all changes are complete.

```bash
bb dev:lint-and-test
```

Expected output includes successful linting and tests with exit code 0.

## Testing Details

I will validate human output formatting by asserting on complete rendered strings for representative payloads instead of inspecting internal formatting helpers.
I will validate db-worker-node logging by checking file existence, dated filename format, and that only the most recent 7 log files remain after multiple startups.
I will assert that a known log event is present after a startup or invoke action.

## Implementation Details

- Add a command-aware human output renderer that produces tables, summaries, and success lines based on command and result payloads.
- Standardize human error output to include error codes, messages, and actionable hints when possible.
- Ensure human output defaults to stable ordering and includes a count line for list and search commands.
- Add a table rendering helper with column width limits and truncation rules.
- Pass command context through CLI result objects so the formatter can select the correct renderer.
- Configure db-worker-node glogi to append logs to <data-dir>/<graph-dir>/db-worker-node-YYYYMMDD.log.
- Enforce log retention by keeping only the most recent 7 dated log files per graph directory.
- Ensure the log directory exists before log initialization and keep the log file path deterministic.
- Document log file location and new human output behavior in CLI documentation.
- Keep JSON and EDN outputs unchanged for scripting compatibility.
- Preserve existing exit codes and error handling semantics in the CLI.

## Question

Should the human output include color or ANSI styling, or should it remain plain text for maximal portability.
Answer: Remain plain text for maximal portability.
Should db-worker-node log to both console and file, or file-only to avoid duplicate logs in CLI output.
Answer: File-only to avoid duplicate logs in CLI output.
Is log rotation or size management required for db-worker-node.log, or is simple append-only acceptable.
Answer: Use dated log filenames and keep only the most recent 7 log files.

---
