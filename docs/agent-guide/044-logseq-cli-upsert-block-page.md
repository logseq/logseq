# Logseq CLI Upsert Block and Upsert Page Implementation Plan

Goal: Consolidate block and page write commands by replacing `add block`, `add page`, and `update` with `upsert block` and `upsert page` while preserving current db-worker-node write behavior.

Architecture: Keep db-worker-node RPC and outliner operation contracts unchanged, and implement command consolidation in CLI parsing, action building, execution, and formatting layers.
Architecture: Reuse existing helper logic from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/update.cljs` first, then fold shared behavior into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
Architecture: Route all mutations through existing `:thread-api/apply-outliner-ops` and `:thread-api/pull` calls so `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` require no new thread APIs.

Tech Stack: ClojureScript, babashka.cli, Promesa, Logseq CLI transport, db-worker-node, and outliner ops.

Related: Relates to `docs/agent-guide/027-logseq-cli-update-command.md` and builds on `docs/agent-guide/041-logseq-cli-add-block-json-identifiers.md`.
Document naming follows @planning-documents with sequence `044`.

## Problem statement

The current CLI splits block mutations across `add block` and `update`, while page writes are exposed as `add page`.
This creates an inconsistent user model and duplicates validation and formatting paths in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
The current block update property options only support built-in properties, which prevents consistent upsert behavior for custom properties.
The current `add page` flow applies tags after create, but page property behavior for existing pages is not fully upsert-like because `create-page` may no-op when the page exists.
The db-worker-node layer already exposes stable generic APIs, so this feature should be implemented as a CLI surface refactor without protocol changes.

## Testing Plan

I will use @test-driven-development for all implementation batches.
I will write all RED tests for parser, action builder, formatter, and integration flows before changing implementation behavior.
I will add parser and builder tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `upsert block` and `upsert page` command forms and for hard-removal behavior of `add` and `update`.
I will add formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of `:upsert-block` and `:upsert-page`.
I will add integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that verify block creation, block update, block move, page creation, and page update through only `upsert` commands.
I will add one integration test that verifies `upsert page` updates properties on an existing page, which closes the current `add page` gap.
I will verify RED failures come from missing behavior and not from broken test setup.
I will run focused GREEN tests after minimal implementation, then refactor, then rerun focused tests and full lint-test.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation baseline

| Area | Current implementation | Change target |
| --- | --- | --- |
| Command entries | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` defines `["add" "block"]` and `["add" "page"]`, and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/update.cljs` defines `["update"]`. | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` defines `["upsert" "block"]` and `["upsert" "page"]` together with existing upsert subcommands. |
| Validation and dispatch | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` validates and dispatches `:add-block`, `:add-page`, and `:update-block` separately. | Replace with `:upsert-block` and `:upsert-page` parse and dispatch paths. |
| Help and group summaries | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` top-level summary and group handling still expose `add` and `update`. | Expose only `upsert` for these write cases. |
| Formatter | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` has `format-add-block`, `format-add-page`, and `format-update-block`. | Replace with upsert-focused formatter routes while preserving existing output contract style. |
| Worker APIs | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` already provide `:thread-api/apply-outliner-ops`. | No new worker endpoint or transport shape. |
| Page create behavior | `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/page.cljs` `create!` can return existing page with no transaction. | `upsert page` applies properties and tags explicitly on existing page to ensure real upsert behavior. |

## Interface contract proposal

`upsert block` supports two modes with deterministic priority.
If `--id` or `--uuid` is provided, `upsert block` always runs update mode.
If neither `--id` nor `--uuid` is provided, `upsert block` runs create mode.
For `upsert block` update mode, add, update, and remove property options must support all existing properties, not only built-in properties.
`upsert page` requires `--page` and always resolves an existing or newly created page, then applies add, update, and remove semantics for tags and properties.
For `upsert page`, all add, update, and remove tag or property operations require the target tag and property to already exist, otherwise the command returns an error.

| Command | Input signal | Behavior | Existing code path to reuse |
| --- | --- | --- | --- |
| `upsert block` create mode | `--id` and `--uuid` are absent and a content source is present. | Insert blocks under target with existing add semantics and support add, update, and remove tag or property options in post-insert ops. | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` add helpers plus update option helpers. |
| `upsert block` update mode | `--id` or `--uuid` is present. | Move and or add, update, and remove tags or properties with existing update semantics, and support both built-in and custom properties in property options. | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/update.cljs` update helpers. |
| `upsert page` | `--page` is present. | Create page if missing, then apply add, update, and remove tags and properties for both new and existing pages, with strict existing-tag and existing-property validation. | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` plus explicit remove op wiring. |

## Architecture sketch

```text
CLI args
  -> parse-args in commands.cljs
  -> build-action returns :upsert-block or :upsert-page
  -> execute routes to upsert command executor
  -> transport/invoke :thread-api/apply-outliner-ops and :thread-api/pull
  -> db-worker-node /v1/invoke passthrough
  -> db_core thread-api handlers and outliner-op/apply-ops!
```

## Plan

1. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `upsert block` create mode with `--content` and for update mode with `--id` plus `--update-tags`.
2. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that confirm `--id` or `--uuid` forces update mode even when create inputs are also present.
3. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `upsert page --page <name>` with tags and properties.
4. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` to define expected unknown-command behavior for legacy `add block`, `add page`, and `update`.
5. Add RED builder tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `:upsert-block` action shape in create mode.
6. Add RED builder tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `:upsert-block` action shape in update mode, including custom property option inputs.
7. Add RED builder tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `:upsert-page` action shape including resolved options.
8. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` to verify `:upsert-block` delegates to insert-style ops for create mode.
9. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` to verify `:upsert-block` delegates to move and property ops for update mode across built-in and custom properties.
10. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` to verify `:upsert-page` applies add, update, and remove property or tag ops on an already existing page.
11. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` to verify `:upsert-page` returns errors when any referenced tag or property does not exist.
12. Add RED formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output text of `:upsert-block` and `:upsert-page`.
13. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `upsert block` create mode id outputs.
14. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `upsert block` update mode move behavior and custom property updates.
15. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `upsert page` create and update-existing behaviors.
16. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `upsert page` erroring when referenced tags or properties do not exist.
17. Run focused RED commands and confirm failures are expectation failures rather than transport or fixture errors.
18. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` spec to include block and page options while keeping existing tag and property specs.
19. Implement `build-block-action` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to classify create mode versus update mode with `--id` or `--uuid` priority, and normalize property options for all property identifiers.
20. Implement `build-page-action` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` for `upsert page`.
21. Extract or reuse add helper functions from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` for reading blocks, parsing tags, parsing properties, and resolving ids.
22. Extract or reuse update helper functions from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/update.cljs` for source and target resolution and move option mapping.
23. Implement `execute-upsert-block` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` that branches by mode and calls reused logic without behavior drift, including custom property update support.
24. Implement `execute-upsert-page` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` so add, update, and remove property or tag ops are applied after resolving the page entity in both create and existing-page paths.
25. Enforce strict `upsert page` validation and execution behavior where missing tags or properties fail fast instead of creating missing entities.
26. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` table entries and finalize-command validation for `:upsert-block` and `:upsert-page`.
27. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` build and execute case dispatch to remove `:add-block`, `:add-page`, and `:update-block` routing.
28. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` top-level summary and group-help triggers to reflect the new command family.
29. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` with `format-upsert-block` and `format-upsert-page` and command dispatch keys.
30. Keep `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` unchanged unless test evidence proves a missing worker behavior.
31. Update CLI documentation in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to replace add and update examples with upsert equivalents.
32. Run focused GREEN tests and confirm parser, builder, formatter, and integration cases pass.
33. Refactor duplicated helper wiring between add, update, and upsert modules while preserving test behavior.
34. Rerun focused test set after refactor to confirm no regressions.
35. Run `bb dev:lint-and-test` as final regression verification.

## Edge cases

`upsert block` with `--id` or `--uuid` plus create inputs must deterministically run update mode because source selectors have priority.
`upsert block` update mode must keep current `--pos` validation where `sibling` is invalid for page targets and `--pos` requires a target.
`upsert block` update mode property options must support all existing properties, including non built-in properties.
`upsert block` create mode must preserve current default target fallback to today journal when no target selector is provided.
`upsert block` create mode with `--blocks` or `--blocks-file` must keep the existing restriction that tags and properties cannot be combined if that restriction is still required by current insert behavior.
`upsert block` and `upsert page` must support remove options for tags and properties in addition to add and update options.
`upsert page` must return stable `data.result` id vectors for JSON, EDN, and human output just like current add command id outputs.
`upsert page` on an existing page must apply property updates and removals explicitly so upsert semantics are true for both create and existing states.
`upsert page` must error when any tag or property referenced by add, update, or remove options does not already exist.
Legacy command behavior must be hard removal with standard `unknown-command` errors for `add block`, `add page`, and `update`.
Help output must not regress command grouping or ANSI formatting alignment in `commands_test`.

## Verification commands and expected output

Run parser and builder tests during RED.

```bash
bb dev:test -v logseq.cli.commands-test
```

Expected RED behavior is failing assertions for missing `upsert block` and `upsert page` paths before implementation.

Run formatter tests during RED.

```bash
bb dev:test -v logseq.cli.format-test
```

Expected RED behavior is failing assertions for unknown command formatter branches for upsert block and upsert page.

Run focused integration tests after implementation.

```bash
bb dev:test -v logseq.cli.integration-test/test-cli-upsert-block-create-json-output-returns-ids
bb dev:test -v logseq.cli.integration-test/test-cli-upsert-block-update-move
bb dev:test -v logseq.cli.integration-test/test-cli-upsert-page-create-and-update-existing
```

Expected GREEN behavior is zero failures and zero errors for these tests.

Run full verification.

```bash
bb dev:lint-and-test
```

Expected GREEN behavior is full suite pass with exit code `0`.

## Testing Details

Behavior tests will assert command-level outcomes through real CLI execution and Datascript queries instead of only checking mock invocation counts.
Unit-level command tests will assert parse, validation, and action-shape behavior at module boundaries.
Integration tests will verify persisted graph state changes for both create and update paths of upsert block and upsert page.

## Implementation Details

- Keep db-worker-node API contracts unchanged and implement all command-surface changes in CLI modules only.
- Add `upsert block` and `upsert page` entries to `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Reuse add and update helper functions to minimize behavior drift and reduce migration risk.
- Ensure `upsert block` and `upsert page` support add, update, and remove options for tags and properties.
- Ensure `upsert block` property update options accept all existing properties, including custom properties, not only built-in properties.
- Ensure `upsert page` applies tags and properties after resolving page entity so existing pages are updated too.
- Ensure `upsert page` fails fast when referenced tags or properties do not exist, and never auto-creates them through upsert-page mutation options.
- Remove old command routes in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` for `add block`, `add page`, and `update`, returning standard `unknown-command`.
- Update formatter dispatch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` for new command ids.
- Update command summaries in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` to keep help output accurate.
- Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` examples and command reference text.
- Keep implementation batches aligned to @test-driven-development RED, GREEN, and refactor phases.

## Question

No open questions.
Decided: remove `add block`, `add page`, and `update` immediately.
Decided: in `upsert block`, `--id` or `--uuid` means update mode and absence of both means create mode.
Decided: support add, update, and remove semantics for tags and properties.
Decided: in `upsert block` update mode, property mutation options support all existing properties, including custom properties.
Decided: for `upsert page`, add, update, and remove tag or property options require existing tags and properties, otherwise return error.

---
