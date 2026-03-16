# Logseq CLI Verbose Debug Logging Implementation Plan

Goal: Add a global --verbose flag that enables structured debug logging for CLI options and all db-worker-node API calls without polluting normal command output.

Architecture: The CLI will install a stderr log handler and enable debug level logging when --verbose is set.
Architecture: The CLI transport and db-worker-node lifecycle utilities will emit structured debug logs for each request and response, using a shared truncation helper to cap large payloads.
Architecture: The db-worker-node process log level remains unchanged, and --verbose only controls logseq-cli logging.

Tech Stack: ClojureScript, lambdaisland.glogi, Node.js, db-worker-node HTTP API.

Related: Relates to docs/agent-guide/005-logseq-cli-output-and-db-worker-node-log.md.

## Problem statement

The CLI currently has no verbose debug mode for troubleshooting, so engineers cannot easily see which options were parsed or what db-worker-node API calls were made.
This makes it hard to diagnose failures, especially when db-worker-node responses are large and need safe, truncated logging.
The goal is to add a global --verbose option that emits debug logs for command options and db-worker-node API calls without breaking existing output contracts.

## Testing Plan

I will add a unit test that verifies the log truncation helper returns a preview with a stable maximum length and a flag indicating truncation.
I will add a unit test that verifies the log truncation helper handles strings, collections, and nil without throwing.
I will add a unit test that verifies the CLI debug logger emits records only when verbose is enabled by capturing glogi records via a temporary handler.
I will add an integration test that runs the CLI with --verbose and asserts that stderr contains a db-worker-node invoke debug line while stdout remains valid JSON for a simple command.
NOTE: I will write all tests before I add any implementation behavior.

## Logging coverage

| Area | File path | Log events | Notes |
| --- | --- | --- | --- |
| CLI option intake | src/main/logseq/cli/main.cljs | Parsed options and resolved config values | Use truncation for long option values like content or blocks. |
| db-worker-node invoke | src/main/logseq/cli/transport.cljs | Request and response debug logs with timing | Truncate response preview and include size metadata. |
| db-worker-node health checks | src/main/logseq/cli/server.cljs | /healthz, /readyz, /v1/shutdown debug logs | Keep quiet unless verbose is true. |
| db-worker-node server logs | src/main/frontend/worker/db_worker_node.cljs | Keep existing logging behavior unchanged. | --verbose does not affect db-worker-node. |

## Implementation Plan

1. Read @prompts/review.md and note any CLI and db-worker-node review checklist items that affect logging or output stability.
2. Add :verbose to the CLI global option spec in src/main/logseq/cli/command/core.cljs with a description and boolean coercion so it appears in help output.
3. Add a new logging helper namespace in src/main/logseq/cli/log.cljs that sets a stderr handler, toggles log levels, and exposes a truncate-preview helper that caps output length and records the original size.
4. Add unit tests for the new logging helper in src/test/logseq/cli/log_test.cljs to cover truncation behavior and the verbose gating behavior using a temporary glogi handler.
5. Initialize CLI logging in src/main/logseq/cli/main.cljs after resolving config so --verbose turns on debug level and installs the handler once per run.
6. Emit a debug log in src/main/logseq/cli/main.cljs that includes the command, args, and full options map from the parsed command, using the truncation helper for large values.
7. Add request and response debug logs in src/main/logseq/cli/transport.cljs around invoke, including method, directPass, args preview, response preview, response size, and elapsed time.
8. Add request and response debug logs in src/main/logseq/cli/server.cljs for db-worker-node HTTP calls, and ensure logs are emitted only when --verbose is set.
9. Confirm no changes are made to src/main/frontend/worker/db_worker_node.cljs behavior or log levels for this feature.
10. Add an integration test in src/test/logseq/cli/integration_test.cljs to ensure stdout remains valid JSON when verbose logs are emitted to stderr.
11. Update docs/cli/logseq-cli.md to document the new --verbose flag, that it only affects logseq-cli, and that debug logs go to stderr with large payloads truncated.

## Edge Cases

Large query or export results can exceed the preview limit, so logs must include a length field and a truncated preview instead of full payloads.
CLI commands that output JSON or EDN must keep stdout clean, so debug logs must go to stderr only.
Options that contain large text content or EDN blocks must be truncated in logs to avoid massive log lines.
db-worker-node can be started independently, so its debug logs should still be gated by its log-level flag even when the CLI is not involved.

## Testing Details

Tests will validate that debug logging is gated by --verbose, that truncation is applied consistently, and that stdout output remains parseable while stderr contains debug logs for a simple db-worker-node invocation.

## Implementation Details

- Use lambdaisland.glogi for CLI logging so log-level control is consistent with db-worker-node.
- Install a stderr log handler in the CLI to avoid polluting stdout output formats.
- Truncate previews by character count and include metadata such as original length and truncation flag.
- Log db-worker-node invoke timings so slow calls are visible in verbose mode.
- Keep db-worker-node API behavior and log levels unchanged.
- Ensure all verbose logs are emitted by logseq-cli only.

## Question

None.

---
