# Logseq CLI Thread API Keywords And Command Split Implementation Plan

Goal: Replace thread-api string usage with keywords, standardize CLI repo option to --repo, and split logseq.cli.commands into per-subcommand namespaces.

Architecture: Update transport and db-worker-node boundaries to accept keyword methods while still serializing over HTTP. Refactor CLI command parsing into a shared dispatcher plus per-subcommand namespaces under a new command directory. Keep existing CLI behavior and output stable while updating option naming and error hints.

Tech Stack: ClojureScript, babashka.cli, promesa, Logseq db-worker-node.

Related: Builds on docs/agent-guide/004-logseq-cli-verb-subcommands.md, docs/agent-guide/005-logseq-cli-output-and-db-worker-node-log.md, docs/agent-guide/006-logseq-cli-import-export.md.

## Problem statement

The current CLI and db-worker-node codebase mixes thread-api method strings with keyword-based APIs, which makes it easy to introduce mismatches and reduces consistency with the thread-api macro design. The CLI option naming also has legacy --graph hints and expectations that conflict with the newer --repo naming, which creates confusion for users and tests. The logseq.cli.commands namespace has grown large and mixes parsing, validation, and execution for multiple command groups, which makes maintenance and ownership difficult.

## Testing Plan

I will add unit tests to ensure all CLI thread-api method invocations use keywords and still serialize correctly through transport when invoking db-worker-node. I will add unit tests to ensure any error hint or help text for missing graph/repo uses --repo and no longer mentions --graph. I will add unit tests for command parsing and action building to cover the new per-subcommand namespaces and ensure summaries and help still match expected output. I will update db-worker-node tests to assert keyword method handling for repo validation and allowed non-repo methods. NOTE: I will write *all* tests before I add any implementation behavior.

## Plan

1. Review @prompts/review.md to align plan with review expectations.

2. Enumerate all thread-api string usages in CLI, db-worker-node, and tests using `rg -n -- "\"thread-api/" src/main src/test`.

3. Enumerate all --graph references in CLI code and tests using `rg -n -- "--graph" src/main src/test` and confirm there are no docs references outside CLI.

4. Define a small utility in `src/main/logseq/cli/transport.cljs` to normalize thread-api method arguments to keywords for callers while serializing over HTTP as string names.

5. Add tests in `src/test/logseq/cli/transport_test.cljs` that pass a keyword method to transport invoke and assert the outgoing payload uses the string name and the response handling is unchanged.

6. Update all CLI calls in `src/main/logseq/cli/commands.cljs` to pass keyword thread-api names to transport invoke and to any action maps that store method identifiers.

7. Update CLI tests in `src/test/logseq/cli/commands_test.cljs` and `src/test/logseq/cli/integration_test.cljs` to expect keyword thread-api methods where they assert method calls.

8. Update db-worker-node internal invocation and repo validation in `src/main/frontend/worker/db_worker_node.cljs` to coerce incoming method values to keywords for comparisons and logging, while still accepting string input from JSON payloads.

9. Update any db-worker-node tests in `src/test/frontend/worker/db_worker_node_test.cljs` that assert method strings to use keyword expectations and verify non-repo method handling.

10. Replace any --graph option references in CLI formatting and tests by updating `src/main/logseq/cli/format.cljs` and `src/test/logseq/cli/format_test.cljs` to use --repo.

11. Search for any `:graph` option wiring in `src/main/logseq/cli/commands.cljs` and remove CLI option parsing for --graph, including any help or usage text, while preserving graph-specific subcommands like `graph create`.

12. Introduce a new directory `src/main/logseq/cli/command/` and split `logseq.cli.commands` into per-subcommand namespaces such as `logseq.cli.command.graph`, `logseq.cli.command.server`, `logseq.cli.command.list`, `logseq.cli.command.add`, `logseq.cli.command.remove`, `logseq.cli.command.search`, and `logseq.cli.command.show`.

13. Create a small shared namespace like `src/main/logseq/cli/command/core.cljs` for global option spec, parsing helpers, summary formatting, and shared validation utilities, ensuring no behavior changes in parsing or summaries.

14. Update `src/main/logseq/cli/commands.cljs` to become a thin facade that assembles tables from per-subcommand modules, delegates parse-args and build-action to those modules, and exposes execute dispatching without changing public API.

15. Update `src/main/logseq/cli/main.cljs` requires to match any namespace changes and confirm the CLI usage summary still renders the same command list.

16. Update tests in `src/test/logseq/cli/commands_test.cljs` to import any moved namespaces or use the facade namespace, and ensure all help summary snapshots still pass.

17. Run unit tests for CLI and db-worker-node with `bb dev:test -v logseq.cli.commands-test`, `bb dev:test -v logseq.cli.transport-test`, and `bb dev:test -v frontend.worker.db-worker-node-test` and fix failures.

18. Run the full lint and unit test suite with `bb dev:lint-and-test` after all changes are complete.

## Testing Details

The tests will focus on behavior by asserting that CLI invocations still produce the same actions and outputs while enforcing keyword-based thread-api methods and updated --repo hints. The db-worker-node tests will assert that repo validation and non-repo method bypass logic behave correctly when methods are provided as keywords or strings. The command split will be validated by reusing existing parse-args and summary tests to ensure no behavioral regression in user-facing help or dispatch.

## Implementation Details

- Normalize thread-api method values at transport and db-worker-node boundaries to accept keywords and serialize as strings over HTTP.
- Replace all explicit "thread-api/..." literals in CLI and db-worker-node call sites with :thread-api/... keywords.
- Remove --graph option handling and update error hints to use --repo.
- Preserve graph subcommands and graph naming semantics while standardizing on :repo options.
- Move per-subcommand parsing and execution helpers into `src/main/logseq/cli/command/` namespaces and keep `logseq.cli.commands` as a facade.
- Keep action map shapes stable to avoid downstream changes in format or execution.
- Update tests to match keyword method expectations and new module layout.
- Ensure public CLI output and behavior remain unchanged aside from --repo messaging.

## Question

Resolved: Remove --graph entirely and fail fast on any --graph usage.

---
