# Logseq CLI and db-worker-node Housekeeping Implementation Plan

Goal: Remove the --retries and --auth-token options from logseq-cli and db-worker-node, and add a --version option that prints build time and commit.

Architecture: Keep option parsing centralized in logseq.cli.command.core and frontend.worker.db-worker-node, and move build metadata into a dedicated ClojureScript namespace injected via shadow-cljs closure defines.
Architecture: Ensure logseq-cli prints version info without needing a running db-worker-node, and db-worker-node no longer gates endpoints on auth tokens.

Tech Stack: ClojureScript, babashka.cli, shadow-cljs, Node.js.

Related: Relates to docs/agent-guide/001-logseq-cli.md.
Related: Relates to docs/agent-guide/002-logseq-cli-subcommands.md.
Related: Relates to docs/agent-guide/003-db-worker-node-cli-orchestration.md.

## Problem statement

The current logseq-cli and db-worker-node expose --retries and --auth-token options that are no longer desired, and the CLI lacks a version command that prints build time and commit.
The cleanup should remove these options without compatibility shims and introduce a clear version output backed by build metadata.

## Testing Plan

I will add a unit test for logseq-cli parsing that asserts --version short-circuits command execution and prints build metadata fields.
I will update the config and transport tests to remove retries and auth token expectations while still validating timeout behavior.
I will add a db-worker-node CLI test that verifies the help output no longer mentions --auth-token and that args parsing ignores the removed flag.
NOTE: I will write *all* tests before I add any implementation behavior.

## Plan

1. Review current option definitions and call sites for retries and auth-token in src/main/logseq/cli/command/core.cljs, src/main/logseq/cli/config.cljs, src/main/logseq/cli/transport.cljs, and src/main/frontend/worker/db_worker_node.cljs.
2. Update src/main/logseq/cli/command/core.cljs to remove :auth-token and :retries from the global spec and option summary output.
3. Update src/main/logseq/cli/config.cljs to remove env parsing and defaults for auth-token and retries, and to stop persisting those keys in config files.
4. Update src/main/logseq/cli/transport.cljs to drop auth header handling and retry loops, and adjust invoke to pass only method, url, body, and timeout values.
5. Update any logseq-cli action builders or server helpers that still read :auth-token or :retries from config, and delete those plumbing paths if present.
6. Update src/main/frontend/worker/db_worker_node.cljs to remove --auth-token parsing, remove authorization checks on endpoints, and delete auth-token from daemon options and help output.
7. Add a new namespace such as src/main/logseq/cli/version.cljs that defines BUILD_TIME and REVISION via goog-define with safe defaults, and exposes a formatter for the CLI.
8. Add a global --version flag in logseq-cli by extending the global spec and by adding a short-circuit path in src/main/logseq/cli/main.cljs or src/main/logseq/cli/commands.cljs that prints build time and commit without requiring a command.
9. Add closure defines for the CLI build in shadow-cljs.edn under :logseq-cli and for the node test build under :test so tests can assert deterministic build metadata values.
10. Update build entry points that compile logseq-cli, such as package.json scripts or any CI workflow that calls clojure -M:cljs compile logseq-cli, to export LOGSEQ_BUILD_TIME and LOGSEQ_REVISION for the defines.
11. Update docs/cli/logseq-cli.md to remove auth-token and retries from the configuration list and to document --version output format with build time and commit.
12. Scan for remaining user-facing mentions of --auth-token or --retries in docs and README files, and update or remove them where appropriate.
13. Run unit tests for CLI and db-worker-node using bb dev:test for the modified namespaces, and run bb dev:lint-and-test if time allows.
14. Follow @prompts/review.md and @skills/test-driven-development throughout implementation and verification.

## Testing Details

The CLI tests will assert that --version returns a non-empty output containing build time and commit keys and that it exits successfully without requiring a subcommand.
The transport tests will still cover timeout behavior but will no longer assert retries behavior or auth header inclusion.
The db-worker-node tests will validate updated help output and ensure that argument parsing still recognizes required flags after removing --auth-token.

## Implementation Details

- Remove :auth-token and :retries from global CLI option specs and summaries in src/main/logseq/cli/command/core.cljs.
- Remove env parsing and defaults for auth-token and retries in src/main/logseq/cli/config.cljs.
- Simplify HTTP request and invoke logic in src/main/logseq/cli/transport.cljs to remove retries and auth headers.
- Remove auth-token CLI parsing and authorization gating in src/main/frontend/worker/db_worker_node.cljs.
- Add build metadata defines in a new CLI version namespace and wire --version output through logseq-cli entrypoints.
- Add closure defines for LOGSEQ_BUILD_TIME and LOGSEQ_REVISION in shadow-cljs.edn for :logseq-cli and :test builds.
- Update scripts or CI to populate LOGSEQ_BUILD_TIME and LOGSEQ_REVISION at compile time.
- Update docs/cli/logseq-cli.md and any other user-facing documentation to reflect the new option set.

## Question

Answer: remove all auth support entirely, including env vars and header checks.

---
