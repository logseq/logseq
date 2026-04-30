# Logseq CLI Add Command Entity Id Output Implementation Plan

Goal: Make `add page` and `add block` return newly created entity `db/id` in `--output human`, `--output json`, and `--output edn`.

Architecture: Keep existing add command write paths and add a post-write identifier resolution step in the CLI command layer.
Architecture: Return a unified structured payload for both add commands where `:result` is a vector of created entity `db/id`.
Architecture: Update human formatter for add commands to include created entity ids while preserving existing success semantics.

Tech Stack: ClojureScript, Logseq CLI command layer, db-worker-node thread API, Logseq CLI formatter.

Related: Builds on docs/agent-guide/027-logseq-cli-update-command.md and docs/agent-guide/005-logseq-cli-output-and-db-worker-node-log.md.

Document naming follows @planning-documents using the next available sequence number `041`.

## Problem statement

Current behavior for `add block --output json` is `{"status":"ok","data":{"result":null}}` because `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` sets `:result nil` in `execute-add-block`.

Current add command outputs are not consistent for machine and human flows when users need the new entity id immediately.

Users now require `db/id` in all output formats for both `add page` and `add block`.

Without this output, automation must run extra commands to locate newly created entities before `update` or `remove`.

## Testing Plan

I will follow @test-driven-development and complete all RED tests before implementation.

I will add integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `add page --output json` and `add block --output json` asserting returned `db/id`.

I will add integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `add page --output edn` and `add block --output edn` asserting returned `:db/id`.

I will add formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting human output lines for add page and add block include new ids.

I will add one integration chain test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that uses returned add ids directly in `update` and `remove` commands.

I will add a focused unit test namespace at `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/add_test.cljs` for helper logic that builds the created-entity result payload.

NOTE: I will write *all* tests before I add any implementation behavior.

## Architecture sketch

```
add page/add block
  -> /src/main/logseq/cli/command/add.cljs execute-add-*
  -> thread-api write call
  -> resolve created entity ids in CLI command layer
  -> result payload {:result [id1 id2 ...]}
  -> /src/main/logseq/cli/format.cljs human renderer includes id information
```

## Output contract

JSON output for add page returns created page id vector in `data.result`.

JSON output for add block returns created block ids in `data.result`.

EDN output mirrors the same data shape using keyword keys.

Human output includes created ids for both commands.

Example human output for add page is:

```text
Added page:
[123]
```

Example human output for add block is:

```text
Added blocks:
[101 102]
```

## Plan

1. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` and confirm current add page and add block result payload shapes.
2. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` and confirm current human formatter paths for add commands.
3. Write RED integration test A in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for add page JSON result containing created page `db/id`.
4. Write RED integration test B in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for add block JSON result containing created block `db/id` list.
5. Write RED integration test C in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for add page and add block EDN output containing `:db/id`.
6. Write RED formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting human add output includes ids.
7. Write RED unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/add_test.cljs` for id vector normalization and deterministic ordering.
8. Run focused tests and verify failures are caused by missing behavior and not incorrect test setup.
9. Implement add block result enrichment in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` so it returns all created block ids including nested children.
10. Implement add page result enrichment in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` so it returns created page id as a one-element vector.
11. Keep result field naming stable with a shape `:data {:result [101 102]}`.
12. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` add page and add block human renderers to include id data from command result.
13. Ensure JSON and EDN formatter paths continue to serialize the enriched result without special-case regressions.
14. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` with add page and add block structured output examples that include `db/id`.
15. Run focused tests again and verify GREEN behavior for all newly added tests.
16. Refactor helper naming and duplicate mapping code in add command execution if needed without behavior change.
17. Re-run focused tests after refactor to verify tests stay green.
18. Run `bb dev:lint-and-test` for regression verification.

## Edge cases

Add block from `--content` must still return generated block id when UUID was not supplied in input.

Add block from `--blocks` with multiple nested blocks must return all created ids and use deterministic ordering in returned payload.

Add page should return the created page id even when tags and properties are added in the same command.

Add block human output should remain readable when returning many ids including nested children.

When id resolution fails unexpectedly after a successful write, command should return an error rather than a misleading success payload without ids.

Error output format and exit codes must remain unchanged for invalid input and missing target cases.

## Testing commands and expected output

Run focused RED tests.

```bash
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-page-json-output-returns-id'
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-block-json-output-returns-ids'
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-page-block-edn-output-returns-id'
bb dev:test -v 'logseq.cli.format-test/test-human-output-add-remove'
```

Expected RED output includes assertion failures indicating missing id fields in add outputs.

Run focused GREEN tests after implementation.

```bash
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-page-json-output-returns-id'
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-block-json-output-returns-ids'
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-page-block-edn-output-returns-id'
bb dev:test -v 'logseq.cli.integration-test/test-cli-add-identifiers-chain-update-remove'
bb dev:test -v 'logseq.cli.command.add-test'
bb dev:test -v 'logseq.cli.format-test/test-human-output-add-remove'
```

Expected GREEN output includes zero failures and zero errors for the focused namespaces.

Run full verification.

```bash
bb dev:lint-and-test
```

Expected output includes successful lint and tests with exit code `0`.

## Testing Details

Integration tests will assert actual CLI command output payloads and real persisted graph behavior for add page and add block.

Formatter tests will assert exact human output strings for add page and add block including id fragments.

Unit tests will validate helper behavior for id list assembly and ordering.

## Implementation Details

- Enrich `execute-add-block` result so `:result` is a vector of all created block ids including nested children.
- Enrich `execute-add-page` result so `:result` is a one-element vector containing created page id.
- Keep result payload stable across JSON and EDN output paths by using Clojure maps with keyword keys.
- Update human formatters for add page and add block to include id information:
  - add page rendered as `Added page:` on one line and `[123]` on the next line.
  - add block rendered as `Added blocks:` on one line and `[101 102]` on the next line.
- Preserve existing command success and error semantics besides the new id output fields.
- Add integration coverage for add outputs plus id-based `update` and `remove` chaining.
- Update CLI docs to show the new add page and add block result examples with ids.

## Decisions

Human output for add block must display all created ids including nested children.

For add block and add page, `:result` must be an id vector such as `[101 102]`.

---
