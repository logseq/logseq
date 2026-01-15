# Logseq CLI Subcommands Implementation Plan

Goal: Replace the CLI argument parser with babashka/cli and expose every command as a subcommand with consistent help and output formats.

Architecture: The CLI remains a Node-targeted ClojureScript program built via shadow-cljs, but command parsing moves to babashka/cli with an explicit subcommand map. The CLI entrypoint will delegate to per-subcommand parsers and handlers that return a consistent result envelope that is rendered to human, JSON, or EDN output.

Tech Stack: ClojureScript, babashka/cli, shadow-cljs, Node.js runtime, db-worker-node HTTP API.

Related: Builds on docs/agent-guide/001-logseq-cli.md.

## Problem statement

The current CLI uses clojure.tools.cli with a flat flag set and manual command detection.
This limits help text, makes subcommand-specific options awkward, and complicates output formatting consistency.
We need to migrate to babashka/cli so that each command is a first-class subcommand with its own help, and so output formats are consistent across all commands.

## Testing Plan

I will add unit tests that validate babashka/cli subcommand parsing for every command and its flags.
I will add unit tests that assert each subcommand renders help and that top-level help includes all subcommands.
I will add unit tests that verify output formatting for human, JSON, and EDN across success and error paths for each subcommand.
I will add integration tests that invoke the Node CLI with subcommands and verify consistent output formats for graph and content commands.
NOTE: I will write all tests before I add any implementation behavior.

## Architecture sketch

+--------------+        HTTP        +---------------------+
| logseq-cli   | -----------------> | db-worker-node       |
| node script  | <----------------- | server on port 9101  |
+--------------+                    +---------------------+

## Command and output surface

The CLI will expose these subcommands and shared output controls.

| Subcommand | Purpose | Output formats | Notes |
| --- | --- | --- | --- |
| graph list | List graphs | human, json, edn | Replaces graph-list |
| graph create | Create graph | human, json, edn | Replaces graph-create |
| graph switch | Switch current graph | human, json, edn | Replaces graph-switch |
| graph remove | Remove graph | human, json, edn | Replaces graph-remove |
| graph validate | Validate graph | human, json, edn | Replaces graph-validate |
| graph info | Graph metadata | human, json, edn | Replaces graph-info |
| block add | Add blocks | human, json, edn | Replaces add |
| block remove | Remove block or page | human, json, edn | Replaces remove |
| block search | Search blocks | human, json, edn | Replaces search |
| block tree | Show tree | human, json, edn | Replaces tree |

The plan assumes a single global output flag that defaults to human, and each subcommand may also accept it.

## Subcommand map design

Global options apply to all subcommands and are parsed before subcommand options.

| Option | Purpose | Notes |
| --- | --- | --- |
| --help | Show help | Available at top level and per subcommand. |
| --config PATH | Config file path | Defaults to ~/.logseq/cli.edn. |
| --base-url URL | Server URL | Overrides host/port. |
| --host HOST | Server host | Combined with --port. |
| --port PORT | Server port | Combined with --host. |
| --auth-token TOKEN | Auth token | Sent as header. |
| --repo REPO | Graph name | Used as current repo. |
| --timeout-ms MS | Request timeout | Integer milliseconds. |
| --retries N | Retry count | Integer count. |
| --output FORMAT | Output format | One of human, json, edn. |

Each subcommand uses a nested path and its own options.

| Subcommand path | Required args | Options | Notes |
| --- | --- | --- | --- |
| graph list | none | --output | Lists all graphs. |
| graph create | none | --graph GRAPH, --output | Creates and switches graph. |
| graph switch | none | --graph GRAPH, --output | Switches current graph. |
| graph remove | none | --graph GRAPH, --output | Removes graph. |
| graph validate | none | --graph GRAPH, --output | Validates graph. |
| graph info | none | --graph GRAPH, --output | Shows metadata, defaults to config repo if omitted. |
| block add | none | --content TEXT, --blocks EDN, --blocks-file PATH, --page PAGE, --parent UUID, --output | Content source is required, with file and text variants. |
| block remove | none | --block UUID, --page PAGE, --output | One of block or page is required. |
| block search | none | --text TEXT, --limit N, --output | Search text is required. |
| block tree | none | --block UUID, --page PAGE, --format FORMAT, --output | One of block or page is required, and format controls tree rendering. |

## Plan

1. Consult the clojure-expert agent about babashka/cli idioms for nested subcommands and help generation.
2. Consult the research-agent for a reference implementation of babashka/cli subcommand parsing in ClojureScript, including Node usage.
3. Review current CLI documentation in docs/cli/logseq-cli.md and list all existing flags and examples that must be preserved.
4. Review the current parser and action mapping in src/main/logseq/cli/commands.cljs and list which options are command-specific versus global.
5. Create a babashka/cli command map design and capture it in this document as a table of subcommands, arguments, and defaults.
6. Write new unit tests for top-level help output in src/test/logseq/cli/commands_test.cljs that assert subcommand listing and usage text.
7. Write new unit tests for each subcommand parse path in src/test/logseq/cli/commands_test.cljs covering required args, missing args, and unknown flags.
8. Write new unit tests in src/test/logseq/cli/format_test.cljs that assert human, json, and edn output for success and error results.
9. Write new unit tests in src/test/logseq/cli/config_test.cljs for output format precedence between flags, env, and config file.
10. Write new integration tests in src/test/logseq/cli/integration_test.cljs that invoke the built CLI with subcommands and verify outputs for at least one graph and one block command in each format.
11. Run the new tests to confirm they fail for the current parser and output handling.
12. Replace the parser in src/main/logseq/cli/commands.cljs with babashka/cli, using a subcommand map and per-command option specs.
13. Update src/main/logseq/cli/main.cljs to route to babashka/cli and return subcommand-specific help when requested.
14. Update src/main/logseq/cli/config.cljs to add a unified output format option and ensure json and edn are both supported.
15. Update src/main/logseq/cli/format.cljs so that all commands emit consistent human, json, or edn output using a single option path.
16. Update docs/cli/logseq-cli.md to document subcommands, shared output flags, and per-subcommand help examples.
17. Run the unit test suite with bb dev:test -v logseq.cli.* and confirm 0 failures and 0 errors.
18. Run lint and tests with bb dev:lint-and-test and confirm a zero exit code.
19. Refactor for naming clarity, shared helpers, and reduced duplication while keeping tests green.

## Status

- Completed: Plan tasks 1-10, 12-19.
- Skipped: Plan task 11 (red-phase confirmation no longer applicable after parser swap).

## Edge cases

Missing subcommand should show top-level help with a non-zero exit code.
Unknown subcommands should show a helpful error that includes the available subcommands.
Subcommand-specific help should not require a working db-worker-node server.
Output format flags should be accepted both at the top level and at subcommand level without conflict.
Existing config keys such as :output-format and the legacy --json flag should either be preserved or mapped with a clear deprecation path.
Windows quoting should be covered for block add subcommand with multi-word content arguments.

## Testing commands and expected output

Run a single failing unit test in red phase.

```bash
bb dev:test -v logseq.cli.commands-test/test-help-output
```

Expected output includes a failing assertion about subcommand help text and ends with a non-zero exit code.

Run the full unit test suite in green phase.

```bash
bb dev:test -r logseq.cli.*
```

Expected output includes 0 failures and 0 errors.

Run lint and unit tests when all work is complete.

```bash
bb dev:lint-and-test
```

Expected output includes successful linting and tests with exit code 0.

## Testing Details

The unit tests will exercise parsing and output formatting behavior without mocking internal parser details.
The integration tests will start db-worker-node on a test port and invoke the CLI entrypoint with subcommands to verify end-to-end behavior.

## Implementation Details

- Replace clojure.tools.cli usage with babashka/cli and define a nested subcommand map for graph and block groups.
- Keep global options for server connection and output format and merge them with per-subcommand options.
- Normalize output format selection to :human, :json, or :edn and route it through a single formatting function.
- Preserve config precedence across flags, env vars, and config file while adding the output format option.
- Ensure each subcommand has a help string and usage text generated by babashka/cli.
- Keep error envelopes consistent with current :status and :error keys to avoid breaking existing scripts.
- Update CLI docs to show subcommand usage and output format examples.
- Add a transition note for legacy command names if backward compatibility is required.

## Question

Should we keep backwards compatibility for legacy command names like graph-list and add, or require the new subcommand forms only.
- Answer: No need to keep backwards compatibility
Should we retain the --json flag as an alias for --output json or remove it after a deprecation period.
- Answer: remove --json, only keep --output
Do we want --output edn and --output json to be accepted at both the top level and per-subcommand level.
- Answer: yes, accept at both levels
---
