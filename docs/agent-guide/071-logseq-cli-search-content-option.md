# Search Content Option Migration Implementation Plan

Goal: Replace positional `search` query arguments with explicit `--content` for all `search` subcommands so trailing global options are parsed reliably.

Architecture: Keep query execution and `db-worker-node` transport unchanged and limit behavior change to CLI parsing, action building, help text, completion metadata, tests, and docs.
Architecture: `logseq-cli` will continue to call `:thread-api/q` through `/v1/invoke`, so worker-side search semantics and result shape stay stable.

Tech Stack: ClojureScript, `babashka.cli`, existing `logseq.cli.command.*` architecture, `db-worker-node` HTTP `/v1/invoke`, Datascript query execution.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/069-logseq-cli-search-subcommands.md`.
Related: Touches `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
Related: Touches `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs`.
Related: References `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` parsing behavior.
Related: References `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` for protocol compatibility.

## Problem statement

Current `search` commands use free-form positional query text.

Current examples are `logseq search block task --graph my-graph` and similar forms.

`parse-leading-global-opts` only extracts global options that appear before the command path.

For `search`, trailing options can leak into positional args, which is why `search.cljs` currently has `extract-inline-graph` as a command-specific workaround.

This workaround handles only `--graph` and `-g` and does not solve general trailing global options like `--output json`.

As a result, commands like `search block something --output json` can produce unstable UX by mixing option tokens into query text or requiring option placement discipline that users do not expect.

The CLI should use explicit command options for search input to avoid positional swallowing behavior.

## Current baseline and compatibility constraints

`search` entries are defined in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` with empty command-specific spec maps.

`search` build logic currently receives positional `args` and joins them into `:query`.

`commands.cljs` validation currently checks `(string/join " " args)` for `:missing-query-text`.

Execution already uses `transport/invoke` with `:thread-api/q` and submits `[repo [query query-text]]`.

`db-worker-node` invoke routing is method-generic and does not encode CLI syntax assumptions.

Therefore this migration is a CLI surface change and test-doc update, not a worker protocol migration.

## Target behavior

### Canonical command syntax

```text
logseq search block --content <search-content> [global options]
logseq search page --content <search-content> [global options]
logseq search property --content <search-content> [global options]
logseq search tag --content <search-content> [global options]
```

Examples:

```text
logseq search block --content "task" --graph my-graph --output json
logseq search page --content "project notes" --output edn --graph my-graph
```

### Validation behavior

`--content` is required for all four search subcommands.

Blank content is rejected with `:missing-query-text`.

Legacy positional query usage is rejected with an explicit `:invalid-options` message that instructs users to use `--content`.

### Non-goals

No change to search result schema.

No change to Datascript query semantics.

No new `db-worker-node` endpoints.

No fuzzy search or ranking changes.

## Testing Plan

I will add unit and integration-style CLI tests that validate behavior rather than internal implementation details.

I will first add failing parser tests that assert `search <scope> --content ...` succeeds and positional `search <scope> foo` fails with migration guidance.

I will then add failing build-action tests that assert query text is sourced from options instead of positional args.

I will add completion tests to ensure `--content` is discoverable in generated zsh/bash scripts.

I will update CLI e2e cases so search coverage uses `--content` and includes a trailing global option order check.

I will update docs examples and help snapshots where search syntax is listed.

NOTE: I will write all tests before I add any implementation behavior.

## Implementation plan

1. Add failing parse tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.

2. Replace positional search parse expectations with `:options {:content ...}` expectations.

3. Add a failing test that `search block positional` returns `:invalid-options` with migration guidance.

4. Add a failing test that `search block --content alpha --output json` keeps query as `alpha` and does not consume `--output` as content.

5. Add failing unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/search_test.cljs` for `build-action` using options map input.

6. Add a failing unit test that blank `--content` is rejected with `:missing-query-text`.

7. Update `search` command specs in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` to include `:content` option metadata.

8. Remove positional-args normalization and inline graph extraction logic from `search.cljs`.

9. Change `search-command/build-action` to read query text from `opts[:content]` and repo from resolved graph config path as already done by central parser.

10. Update `commands.cljs` validation for search commands to read from `opts[:content]` and to reject unexpected positional args with a clear migration hint.

11. Update `commands.cljs` call-site so search build-action is invoked with `options` instead of raw `args`.

12. Keep execute path unchanged because worker invocation contract already accepts final query string only.

13. Add completion assertions in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` for `--content` under search subcommands.

14. Update CLI e2e inventory in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` so search options include `--content`.

15. Update CLI e2e cases in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` to use `--content` and at least one trailing-global-order scenario.

16. Update user docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to replace `search <scope> <query>` with `search <scope> --content <query>` across command list and examples.

17. Run focused tests.

18. Run broader lint and test suites.

## File-by-file change map

| File | Planned change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` | Add `:content` command option spec for all search subcommands and switch build-action input source to options. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Validate `--content`, reject legacy positional args for search, and pass options to search build-action. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/search_test.cljs` | Convert build-action tests from positional args to option-driven content and add migration failure coverage. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Update parse and build-action tests for search syntax and trailing global option behavior. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Assert completion output includes `--content` for search commands. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Add `--content` to search options inventory. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Replace search command invocations with `--content` and add option-order stability checks. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Update syntax, examples, and command reference text. |

## db-worker-node impact

No API route changes are required in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.

No thread-api additions are required in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` for this migration.

`logseq-cli` will still call `:thread-api/q` with the same query payload shape.

This means rollout risk is concentrated in CLI parse and docs/test updates.

## Verification commands

```bash
bb dev:test -v logseq.cli.command.search-test
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.completion-generator-test
bb -f cli-e2e/bb.edn test --skip-build
bb dev:lint-and-test
```

Expected outcomes:

All updated search parser tests pass with explicit `--content` syntax.

No test still asserts positional query behavior for search.

CLI e2e search cases pass with globals after command while preserving content fidelity.

## Rollout notes

This change intentionally breaks legacy positional search syntax to remove ambiguity and option swallowing risk.

Error messaging must include a direct rewrite hint from `search <scope> <query>` to `search <scope> --content <query>`.

If immediate hard cut is considered too disruptive, an optional short deprecation period can be introduced, but it should still reject option-like trailing tokens in positional mode to avoid unstable behavior.

## Edge cases

`--content "   "` should fail with missing query text.

`--content` values containing leading dashes as literal text should remain accepted when properly quoted.

`--content` should preserve multi-word queries exactly as user input after trim.

Search commands should still fail with `:missing-repo` when graph resolution is unavailable.

## Testing Details

The tests will assert user-visible behavior for parse success, parse failure guidance, and stable interaction with trailing global options.

The tests will not mock babashka.cli internals and will exercise `commands/parse-args`, `commands/build-action`, and real completion generation output strings.

The e2e tests will verify actual executable command lines against a temporary graph and inspect output payload fields.

## Implementation Details

- Use command-specific `:content` option specs so help and completion are automatically generated.
- Keep search execution logic and worker transport untouched to minimize regression surface.
- Keep `:missing-query-text` code path for blank content.
- Add explicit legacy positional rejection in central command finalization for consistent error style.
- Update search examples in command entries to demonstrate trailing global options after `--content`.
- Ensure docs and e2e inventory are updated together so command contract is synchronized.
- Preserve existing table output format for search results.
- Validate that `--graph` and `--output` can both appear after subcommands without affecting query extraction.
- Prefer one clear migration error message over silent fallback behavior.

## Question

Should we enforce an immediate hard cut for positional search syntax, or keep a one-release compatibility shim with a warning and then remove it in the next release?

---
