# Logseq CLI Show Multi-ID Implementation Plan

Goal: Extend the logseq-cli show command so `--id` accepts one or more block ids, and when passed as `[<id1> <id2> ...]`, it displays all blocks separated by a clear delimiter.
Architecture: Keep existing CLI parsing and db-worker-node transport, but allow `--id` to accept an EDN vector of ids; execute one fetch per id or a single multi-id fetch if supported by the worker thread API.
Tech Stack: ClojureScript, babashka.cli, db-worker-node HTTP transport, Logseq block formatting.
Related: Builds on existing show command behavior and db-worker-node thread API usage.

## Problem statement

The current `logseq show --id <id>` only supports a single block id, which makes it cumbersome to inspect multiple blocks from scripts.
We need `--id` to accept `[<id1> <id2> ...]` and print each corresponding block, separated by a reasonable visual delimiter.
This should align with existing logseq-cli and db-worker-node patterns and preserve existing single-id behavior.
This also enables a pipeline workflow such as: `logseq query --name task-search --inputs '["todo"]' | xargs logseq show -id`.

## Note on removing `search`

Remove the `search` subcommand. No migration or compatibility work is required.

## Note on `logseq query` output

`logseq query` output handling:
1. Validate it is valid EDN.
2. Replace all spaces with commas.

## Note on `logseq query task-search` inputs

The first `task-search` input `status` should be a string like `"todo"` or `"doing"`, not `:logseq.property/status.todo`.

## Testing Plan

I will add unit tests for show argument parsing to accept a vector of ids and to reject invalid EDN in `--id`.
I will add an integration test that runs `logseq show --id '["id1" "id2"]'` and asserts that both blocks are present in output with the delimiter between them.
I will keep existing single-id tests intact and ensure no regressions in JSON/EDN output modes.
I will follow @test-driven-development and write the failing tests before implementing behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Plan

Locate the show command definition and parsing in `src/main/logseq/cli/command/show.cljs` (or equivalent) and identify current `--id` parsing behavior.
Update argument parsing so `--id` accepts either a single id (string) or an EDN vector of ids; parse via `cljs.reader/read-string` or `logseq.common.util/safe-read-string` with clear errors on invalid EDN.
Normalize the parsed value into a vector of ids, preserving the current single-id behavior by wrapping the string in a vector.
Update the show execution path to iterate through ids and fetch each block via existing db-worker-node transport; if a batch API exists, prefer it but keep compatibility with current API.
Add output formatting logic to insert a delimiter between each block in human output (for example `\n-----\n` or `\n====\n`), and keep JSON/EDN output structured as a vector of blocks instead of concatenated text.
Update command help/usage in `src/main/logseq/cli/main.cljs` and `src/main/logseq/cli/commands.cljs` to document vector form, including an example.
Add unit tests in `src/test/logseq/cli/commands_test.cljs` or a show-specific test file to validate parsing and error cases.
Add an integration test in `src/test/logseq/cli/integration_test.cljs` to verify multi-id output with delimiter and correct block ordering.
Confirm db-worker-node thread API endpoints used by show (likely in `src/main/frontend/worker/`) do not need changes; if they do, add a minimal batch fetch method and corresponding tests.

## Edge cases

`--id` contains invalid EDN (e.g., `[` without closing bracket) should return a clear invalid-options error and non-zero exit.
Mixed types in the id vector (e.g., numbers, maps) should either coerce to strings or be rejected with a clear error; prefer rejection to avoid surprising behavior.
Missing blocks (id not found) should return a clear message per block while still printing other valid blocks.
Output delimiter should not appear before the first block or after the last block.

## Testing Details

Unit tests should cover parsing of a single id, a vector of ids, and invalid EDN.
Integration tests should create two blocks, fetch them by ids, and verify both are present in order with the delimiter separating them in human output.
JSON/EDN outputs should be a vector of block structures matching current single-id output shape.

## Implementation Details

- Update `--id` parsing to accept EDN vectors of ids while preserving single-id strings.
- Normalize `id` input to `ids` vector for downstream handling.
- Loop fetches through existing db-worker-node transport, or add a batch fetch endpoint only if necessary.
- Insert a delimiter between blocks in human output; keep machine-readable outputs as structured vectors.
- Update help text and tests accordingly.

---
