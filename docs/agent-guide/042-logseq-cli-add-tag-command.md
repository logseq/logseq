# Logseq CLI Add Tag Subcommand Implementation Plan

Goal: Add `logseq add tag` so CLI users can create a tag entity before using that tag in `add block`, `add page`, and `update`.

Architecture: Reuse the existing CLI to db-worker-node write path by sending `:create-page` with `{:class? true}` through `:thread-api/apply-outliner-ops`.
Architecture: Keep db-worker-node protocol and HTTP endpoints unchanged because the feature composes existing worker operations.
Architecture: Validate the result after write by pulling the page entity and asserting the page has `:logseq.class/Tag` semantics.

Tech Stack: ClojureScript, babashka.cli, Promesa, Datascript, db-worker-node, outliner ops.

Related: Builds on docs/agent-guide/018-logseq-cli-add-tags-builtin-properties.md and docs/agent-guide/041-logseq-cli-add-block-json-identifiers.md.

## Problem statement

Current CLI behavior can attach only existing tags because `resolve-tag-entity` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` fails with `:tag-not-found` when a tag is missing.

Current CLI behavior has no `add tag` command entry in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`, so users cannot create custom tags from CLI.

Current db-worker-node flow already supports page and class creation through `:thread-api/apply-outliner-ops` and `:create-page`, so the missing capability is command orchestration in CLI instead of worker transport.

`list tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` returns entities tagged with `:logseq.class/Tag`, so `add tag` must create that exact class shape instead of a plain page.

## Testing Plan

I will follow `@test-driven-development` and write parsing tests before changing command implementation code.

I will add failing action-building tests that verify required options, normalized action payload, and explicit errors for invalid input.

I will add failing execution tests that stub transport calls and verify emitted outliner ops include `:create-page` with `{:class? true}`.

I will add failing format tests for human output so `:add-tag` has a stable success message contract.

I will add one integration test that creates a new tag and then uses that tag in `add block` to prove end to end behavior through db-worker-node.

I will add one integration test that confirms failure when the same title already exists as a non-tag page, so the command does not report false success.

NOTE: I will write *all* tests before I add any implementation behavior.

## Scope and non-goals

This plan adds only `add tag` under the existing `add` command group.

This plan does not add new db-worker-node endpoints or thread-api methods.

This plan does not add editing features such as setting class extends, class properties, or tag description during creation.

This plan does not change existing `add block`, `add page`, or `update` option syntax.

`add tag` accepts `--name` only, and does not support `--tag` alias.

## Integration overview

```
logseq add tag --name "Quote"
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs
  -> db-worker-node /v1/invoke
  -> :thread-api/apply-outliner-ops
  -> :create-page [title {:class? true}]
  -> Datascript entity tagged as :logseq.class/Tag
```

## Detailed implementation plan

1. Add a failing parser help test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that expects `add` group help to include `add tag`.
2. Add a failing parser test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `["add" "tag" "--name" "Quote"]` to produce `:add-tag`.
3. Add a failing parser validation test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that missing `--name` returns `:missing-tag-name`.
4. Add a failing build-action test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that ensures `:add-tag` action contains `:type`, `:repo`, `:graph`, and normalized `:name`.
5. Add a failing execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that stubs transport and verifies `:create-page` options include `:class? true`.
6. Add a failing execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that simulates existing non-tag page conflict and expects a deterministic CLI error code.
7. Add a failing format test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for `:add-tag` human output.
8. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that runs `add tag`, validates `list tag` contains the new tag, and confirms `add block --tags` with that tag succeeds.
9. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for duplicate title where a normal page exists and command must fail with clear error.
10. Run focused tests and confirm all new tests fail for behavior reasons, and use `@clojure-debug` only if failures are caused by test setup mistakes.
11. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` with a new `add-tag` command spec, entry, action builder, and executor.
12. In `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`, implement execution via `:thread-api/apply-outliner-ops` and `[:create-page [name {:class? true}]]`.
13. In `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`, add a post-create pull check that verifies the resulting entity is class-tagged and raise an explicit error if not.
14. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` parse validation with `:missing-tag-name` handling for `:add-tag`.
15. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` action dispatch and execute dispatch for `:add-tag`.
16. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` context propagation to include the new tag field used by formatter output.
17. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` with `format-add-tag` and command routing for `:add-tag`.
18. Run focused unit and integration tests and confirm they pass without changing unrelated command behavior.
19. Run `bb dev:lint-and-test` and confirm the repository remains green after the feature.
20. Refactor only local helper naming and shared logic inside `add.cljs` while preserving behavior and keeping tests green.

## Edge cases to cover

Tag names with leading `#` should be normalized consistently, or rejected consistently, with one documented behavior.

Tag names containing namespace separators like `A/B` should produce deterministic behavior aligned with existing page creation rules.

Duplicate tag creation should be idempotent when the existing entity is already a tag class.

If a page with the same name exists but is not a tag class, `add tag` should fail with a dedicated error instead of silently succeeding.

Built-in tag names should remain valid and should return existing ids without creating duplicate entities.

The command should reject blank names after trim.

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test/test-parse-args-help` | New `add tag` appears in add group help assertions. |
| `bb dev:test -v logseq.cli.commands-test/test-verb-subcommand-parse-add` | New parse and validation tests for `add tag` pass. |
| `bb dev:test -v logseq.cli.commands-test/test-build-action-inspect-edit` | Build action includes `:add-tag` cases and passes. |
| `bb dev:test -v logseq.cli.commands-test/test-execute-add-tag-builds-create-page-op` | Outliner op assertions pass with `{:class? true}`. |
| `bb dev:test -v logseq.cli.format-test/test-human-output-add-remove` | Human output for `:add-tag` matches expected string. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-add-tag-create-and-use` | End to end creation and usage of a new tag passes. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-add-tag-rejects-existing-non-tag-page` | Conflict behavior test passes with explicit error. |
| `bb dev:lint-and-test` | Full lint and unit suite pass. |

## Testing Details

The tests validate user-visible behavior at parser, action, executor, formatter, and integration boundaries.

The tests assert command success and failure contracts, and they verify persisted graph behavior with CLI reads such as `list tag` and `show`.

The tests avoid asserting implementation details that are not externally observable.

## Implementation Details

- Add `add tag` spec and entry in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`.
- Add `build-add-tag-action` and `execute-add-tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`.
- Use existing server bootstrap and transport invoke path from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs`.
- Create tag through `:create-page` with `{:class? true}` and verify resulting entity semantics.
- Add parse validation and missing error mapping in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
- Add build and execute routing for `:add-tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
- Add human formatter branch for `:add-tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
- Add parser and executor unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
- Add formatter test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.
- Add integration coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.

## Question

No open questions.

---
