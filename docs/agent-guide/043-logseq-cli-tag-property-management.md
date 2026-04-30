# Logseq CLI Tag and Property Management Implementation Plan

Goal: Add first class CLI support for `upsert tag`, `upsert property`, `remove tag`, and `remove property`, and restructure existing remove behavior into `remove block` and `remove page`.

Architecture: Replace current `add tag` command entry with `upsert tag` so tag creation and idempotent update semantics are unified under one verb.
Architecture: Expand `remove` into typed subcommands (`block`, `page`, `tag`, `property`) to make deletion intent explicit and prevent mixed selector ambiguity.
Architecture: Reuse `:thread-api/apply-outliner-ops` in db-worker-node so no new HTTP route or transport protocol is introduced.

Tech Stack: ClojureScript, babashka.cli, Promesa, Datascript, db-worker-node, outliner ops.

Related: Builds on docs/agent-guide/042-logseq-cli-add-tag-command.md and docs/agent-guide/029-logseq-cli-show-properties.md.

## Problem statement

Current CLI supports tag creation through `add tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs`, but does not expose an `upsert` verb for tags and properties.

Current `update` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/update.cljs` updates tag and property values on blocks, but does not upsert or remove tag/property entities.

Current `remove` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs` mixes block and page deletion under one command, and has no explicit tag/property deletion path.

db-worker-node already supports required mutation primitives through `:thread-api/apply-outliner-ops` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` and outliner ops in `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/op.cljs`.

The implementation gap is CLI command surface design, parser wiring, validation, and output contract coverage.

## Testing Plan

I will follow `@test-driven-development` and write failing parser, action, executor, formatter, and integration tests before adding behavior.

I will add parser tests for the new `upsert` verb and the new typed `remove` subcommands.

I will add action builder tests that verify repo propagation, normalized names, schema coercion, and typed action payloads for each new command.

I will add executor tests that stub transport and assert exact outliner ops emitted for each command path.

I will add formatter tests for human and json output so command responses are stable for scripts.

I will add integration tests against db-worker-node that verify graph state changes through `list`, `show`, and entity queries.

I will use `@clojure-debug` only when failures are caused by test setup rather than behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Command contract

The final command surface is top level verbs without a `manage` group.

| Command | Required options | Optional options | Behavior |
| --- | --- | --- | --- |
| `logseq upsert tag` | `--name` | none in v1 | Creates tag when missing, returns existing tag when already present, and errors if same title exists as non-tag page. |
| `logseq upsert property` | `--name` | `--type`, `--cardinality`, `--hide`, `--public` | Creates property when missing, updates schema for existing property, and validates type or cardinality compatibility. |
| `logseq remove tag` | one of `--name`, `--id` | none | Deletes a tag entity after validating target type and removability, and fails with a candidate list when `--name` matches multiple tags. |
| `logseq remove property` | one of `--name`, `--id` | none | Deletes a property entity after validating target type and removability, and fails with a candidate list when `--name` matches multiple properties. |
| `logseq remove block` | one of `--id`, `--uuid` | none | Deletes one or more blocks with existing block remove behavior. |
| `logseq remove page` | `--name` | none | Deletes a page with existing page remove behavior. |

`add tag` will be removed from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` and replaced by `upsert tag`.

Bare `remove` without a subcommand will be rejected with a clear parse error.

No compatibility aliases or deprecation shims will be kept for removed commands.

## Integration overview

```text
logseq upsert property --name "owner" --type node --cardinality many
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs (/v1/invoke)
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs (:thread-api/apply-outliner-ops)
  -> /Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/op.cljs (:upsert-property)
```

```text
logseq remove tag --name "Quote"
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs
  -> remove tag resolver validates :logseq.class/Tag
  -> :thread-api/apply-outliner-ops with [:delete-page [tag-uuid]]
  -> outliner page delete flow applies class cleanup and persistence
```

## Detailed implementation plan

1. Add failing parse help tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that expect top level `upsert` and `remove` subcommands (`block`, `page`, `tag`, `property`).
2. Add failing parse tests for `['upsert' 'tag' '--name' 'Quote']` and `['upsert' 'property' '--name' 'owner' '--type' 'node' '--cardinality' 'many']` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
3. Add failing parse tests for `['remove' 'tag' '--name' 'Quote']` and `['remove' 'property' '--id' '123']` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
4. Add failing parse tests for `['remove' 'block' '--id' '1']` and `['remove' 'page' '--name' 'Home']` to preserve old delete behavior in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
5. Add failing parse validation tests that reject bare `remove` and old `add tag` command usage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
6. Add failing parse validation tests for invalid property type and cardinality values in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
7. Add failing build action tests for `upsert tag` name normalization and `#` prefix stripping in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
8. Add failing build action tests for `upsert property` schema coercion to `:logseq.property/type` and `:db/cardinality` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
9. Add failing executor tests that `upsert tag` emits `[:create-page [name {:class? true}]]` only when the tag is missing in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
10. Add failing executor tests that `upsert tag` is idempotent for existing tag entities and rejects non-tag title conflicts in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
11. Add failing executor tests that `upsert property` emits `[:upsert-property [property-id schema opts]]` and passes `{:property-name name}` when creating a new property in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
12. Add failing executor tests that `remove tag` and `remove property` resolve entities by `--name` or `--id` and emit `[:delete-page [uuid]]` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
13. Add failing executor tests that `remove tag --name` and `remove property --name` fail on multiple matches, return all matched candidates in output, and require rerun with `--id` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
14. Add failing executor tests that built in or hidden tag or property targets are rejected with explicit error codes in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
15. Add failing formatter tests for `upsert tag`, `upsert property`, `remove tag`, and `remove property` outputs in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.
16. Add failing formatter tests that `remove block` and `remove page` outputs remain backward compatible in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.
17. Add failing integration tests for `upsert tag` create and idempotent behavior in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
18. Add failing integration tests for `upsert property` create and schema update behavior in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
19. Add failing integration tests for `remove tag` and `remove property` ensuring entities disappear from `list tag` and `list property` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
20. Add failing integration tests for `remove tag --name` and `remove property --name` ambiguous matches to assert candidate list output and `--id` guidance in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
21. Add failing integration tests for `remove block` and `remove page` command migration behavior in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
22. Run focused tests and confirm all new tests fail for behavior reasons before implementation.
23. Create `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` with command specs, entries, validation helpers, action builders, and executors for tag and property upsert.
24. Refactor shared tag resolver helpers from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` into `upsert.cljs` or a shared helper namespace to avoid duplication.
25. Remove `add tag` command entry and related build or execute dispatch from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
26. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs` to register `remove block`, `remove page`, `remove tag`, and `remove property` entries.
27. Keep existing block and page delete execution logic and map it behind `remove block` and `remove page` subcommands.
28. Implement new remove tag and remove property resolver and execution paths in `remove.cljs` using `:delete-page` outliner op after entity type validation and ambiguity failure behavior for `--name`.
29. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` table, parse validation, action builder, context propagation, and execute dispatch for new upsert and remove contracts.
30. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` to format results for `upsert tag`, `upsert property`, `remove tag`, and `remove property`, including ambiguous candidate lists.
31. Run focused unit and integration tests, then run `bb dev:lint-and-test`, and keep only behavior preserving refactors.
32. Update CLI help text snapshots and any docs references to remove `add tag` and bare `remove` usage.

## Edge cases to cover

Tag names with leading `#` should normalize consistently in `upsert tag`.

Tag and property names that collide by title or case must fail resolution for `--name`, list all candidate matches, and require explicit `--id`.

Remove selectors must reject ambiguous name matches with a clear error, include all candidate ids and names in output, and require `--id`.

Built in tags and built in properties must not be removable.

Property type and cardinality updates must reject invalid transitions already enforced by outliner validation.

`remove block` multi id behavior must stay unchanged from current implementation.

`remove page` must preserve current not found and built in page deletion behavior.

Commands must reject blank names after trim.

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test/test-parse-args-help` | Help output includes `upsert` and typed `remove` subcommands. |
| `bb dev:test -v logseq.cli.commands-test/test-verb-subcommand-parse-upsert-remove` | Parse and validation tests for new command contracts pass. |
| `bb dev:test -v logseq.cli.commands-test/test-build-action-upsert-remove` | Action payload tests pass for all new paths. |
| `bb dev:test -v logseq.cli.commands-test/test-execute-upsert-remove-tag-property` | Outliner op emission tests pass for upsert and entity removal flows. |
| `bb dev:test -v logseq.cli.format-test/test-human-output-upsert-remove` | Human output formatting for new commands is stable. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-upsert-and-remove-tag-property` | End to end behavior through db-worker-node passes for all four new commands. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-remove-block-page-subcommands` | Block and page deletion still work through new remove subcommands. |
| `bb dev:lint-and-test` | Full lint and unit suite pass. |

## Migration and compatibility

No db-worker-node route migration is required because this feature reuses `/v1/invoke` and existing thread-api methods.

No schema migration is required because tag and property entities are created and deleted through existing outliner operations.

This is a CLI breaking change because `add tag` is removed and bare `remove` is replaced by typed `remove block` and `remove page` commands.

This breaking change will be applied directly with no compatibility alias period.

## Testing Details

Tests validate parser, action, execution, formatter, and integration behavior for `upsert tag`, `upsert property`, `remove tag`, and `remove property`.

Tests also validate migration behavior for `remove block` and `remove page` so previous block and page deletion semantics are preserved.

Tests focus on command contracts and graph outcomes instead of helper internals.

## Implementation Details

- Add new upsert command module at `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Register upsert entries and dispatch hooks in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
- Remove `add tag` command entry and related dispatch from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
- Refactor remove command entries in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs` to `remove block`, `remove page`, `remove tag`, and `remove property`.
- Reuse `:thread-api/apply-outliner-ops` with `:create-page`, `:upsert-property`, and `:delete-page` for all entity mutations.
- Add formatter branches in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` for new commands.
- Add parser and executor unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
- Add formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.
- Add end to end coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
- Use `@clojure-debug` only when failures indicate fixture or async wiring issues.

## Question

No open questions.

---
