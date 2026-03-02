# Logseq CLI Property Type and Upsert Option Unification Implementation Plan

Goal: Add a property type column to `list property`, add `--id` update-mode semantics to `upsert block/page/tag/property`, and remove duplicated `--tags` or `--properties` options from `upsert block/page` in favor of `--update-tags` or `--update-properties`.

Architecture: Keep the existing `logseq-cli -> transport/invoke -> db-worker-node :thread-api/*` contract unchanged and implement behavior changes in CLI parsing, action building, execution, and formatting.
Architecture: Extend property list payload shaping so non-expanded property items include `:logseq.property/type`, then render a dedicated property table in human output with a `TYPE` column.
Architecture: Treat `--id` as an explicit update signal for all upsert entity commands, and keep create paths only when `--id` is absent.

Tech Stack: ClojureScript, babashka.cli, Promesa, Datascript, logseq-cli command modules, db-worker-node thread APIs.

Related: Builds on `docs/agent-guide/044-logseq-cli-upsert-block-page.md` and relates to `docs/agent-guide/043-logseq-cli-tag-property-management.md`.

## Problem statement

Current `list property` human output in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` uses the same formatter as `list tag`, so no property-type column is rendered.

Current non-expanded property list items from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` are built by `minimal-list-item`, which does not include `:logseq.property/type`.

Current `upsert block` already supports `--id` and treats it as update mode via `update-mode?` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`, but `upsert page`, `upsert tag`, and `upsert property` do not accept `--id`.

Current `upsert block/page` specs include both `--tags` or `--properties` and `--update-tags` or `--update-properties` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`, which duplicates semantics and increases parser and action complexity.

Current parser validation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` requires `--page` for `upsert page` and requires `--name` for `upsert property`, so there is no update-by-id mode for those commands.

## Testing Plan

I will use `@test-driven-development` for all implementation batches.

I will add parser and action RED tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for new `--id` contracts on `upsert page`, `upsert tag`, and `upsert property`.

I will add formatter RED tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for the `list property` `TYPE` column and its value normalization.

I will add contract RED tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/mcp_tools_contract_test.cljs` to ensure non-expanded property list items carry `:logseq.property/type`.

I will add integration RED tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for update-by-id flows and for rejecting removed `--tags` or `--properties` flags on `upsert block/page`.

I will use `@clojure-debug` only when failures indicate fixture or async harness issues rather than missing behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation baseline

| Requirement | Current behavior | Gap |
| --- | --- | --- |
| `list property` shows type column. | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` renders tag and property with the same columns (`ID`, `TITLE`, optional `IDENT`, timestamps). | No `TYPE` column in human output, and non-expanded payload currently omits type. |
| `upsert block/page/tag/property` supports `--id` and `--id` forces update mode. | `upsert block` supports this already, but `upsert page/tag/property` specs do not expose `--id` and still depend on page/name creation-first contracts. | Missing update-by-id mode for three upsert commands. |
| `upsert block/page` removes `--tags` or `--properties` and uses `--update-tags` or `--update-properties` only. | Both old and new options are accepted and merged in action building and execution. | Duplicate option surface and duplicate parsing paths remain. |

## Target contract

`upsert block` keeps current `--id` update-mode behavior and remove legacy create-only `--tags` or `--properties` options.

`upsert page` accepts `--id` as update mode, and accepts `--page` only for create mode.

`upsert tag` accepts `--id` as update mode, and keeps `--name` for create mode.

`upsert property` accepts `--id` as update mode, and keeps `--name` for create mode.

`upsert tag --id <id>` with no additional mutation options is a successful no-op after id lookup and tag-class validation.

`upsert page --id <id> --page <name>` is invalid and must fail as conflicting selectors.

When `--id` is provided for any upsert command, create-specific resolution paths must be skipped and the command must fail if the target id does not exist or has the wrong entity class.

`upsert block/page` should reject `--tags` and `--properties` as unknown options after spec cleanup, with guidance to use `--update-tags` and `--update-properties`.

Update-by-id failures should use new id-mode specific error codes so scripts can distinguish id lookup and id class mismatch from create-mode validation failures.

## Architecture sketch

```text
list property
  -> /src/main/logseq/cli/command/list.cljs execute-list-property
  -> /src/main/frontend/worker/db_core.cljs :thread-api/api-list-properties
  -> /src/main/logseq/cli/common/mcp/tools.cljs list-properties
  -> /src/main/logseq/cli/format.cljs format-list-property (new dedicated formatter)
```

```text
upsert page/tag/property --id <id>
  -> /src/main/logseq/cli/commands.cljs parse + finalize-command
  -> /src/main/logseq/cli/command/upsert.cljs update-mode detection and action build
  -> transport/invoke :thread-api/pull for id/entity validation
  -> transport/invoke :thread-api/apply-outliner-ops for update ops only
```

## Detailed implementation plan

1. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting `upsert page --id 10 --update-properties ...` parses as `:upsert-page` and no longer requires `--page`.
2. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting `upsert tag --id 10` parses and `upsert property --id 10 --type node` parses.
3. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting `upsert block --tags ...` and `upsert page --properties ...` fail with `:invalid-options` due to removed flags.
4. Add RED parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting `upsert page --id <id> --page <name>` fails with a selector conflict error.
5. Add RED build-action tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `upsert page/tag/property` actions that include `:mode :update` when `--id` is present.
6. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` verifying `upsert tag --id <id>` with no update fields returns `:ok` and no mutation ops.
7. Add RED execute tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` verifying update-by-id rejects missing ids and wrong entity classes with new id-mode specific error codes.
8. Add RED formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting `list property` human output includes `TYPE` header and per-row values.
9. Add RED contract tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/mcp_tools_contract_test.cljs` asserting non-expanded `list-properties` items include `:logseq.property/type`.
10. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` for `upsert page --id`, `upsert tag --id`, and `upsert property --id` update mode behavior, including tag no-op behavior.
11. Add RED integration tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` verifying `upsert page --id --page` fails with selector conflict and `upsert block/page` reject removed `--tags` and `--properties` options.
12. Run focused RED commands and verify failures are behavior assertions, not fixture failures.
13. Update specs in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to remove `:tags` and `:properties` from block/page specs and add `:id` to page/tag/property specs.
14. Update option validation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` so `upsert page` and `upsert property` required-field checks are mode-aware instead of unconditional, and add explicit selector-conflict validation for `upsert page --id --page`.
15. Refactor `build-page-action` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to support create mode by `--page` and update mode by `--id`.
16. Refactor `build-tag-action` and `build-property-action` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to support update mode by `--id` with mode-specific required options.
17. Add shared helper(s) in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to pull entities by id and validate class/type constraints before updates.
18. Update `execute-upsert-page`, `execute-upsert-tag`, and `execute-upsert-property` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` so update mode uses id lookup, skips creation paths, and applies only update semantics, with `upsert tag --id` no-op when no mutation fields are provided.
19. Introduce explicit id-mode error codes in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` for id-not-found and id-type-mismatch failures.
20. Remove all `:tags` and `:properties` action wiring from page/block upsert flows in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`, and keep only `:update-tags` and `:update-properties`.
21. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` to include `:logseq.property/type` in non-expanded property list items.
22. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` to split property formatting from tag formatting and render a dedicated `TYPE` column for `:list-property`.
23. Update docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to remove `--tags` or `--properties` from `upsert block/page` docs, document update-by-id behavior across all upsert commands, and document selector conflict behavior.
24. Run focused GREEN tests for commands, format, and integration, then run `bb dev:lint-and-test`.
25. Refactor only after GREEN to reduce duplication in upsert mode branching, then rerun focused tests and full suite.

## Edge cases

`upsert page --id <id>` must fail when id points to a block that is not a page entity.

`upsert tag --id <id>` must fail when id points to a page not tagged with `:logseq.class/Tag`.

`upsert property --id <id>` must fail when id points to an entity without `:logseq.property/type`.

`upsert tag --id <id>` with no mutation options must return success without issuing mutation ops.

`upsert page --id <id> --page <name>` must fail with a dedicated selector conflict error.

Update-by-id missing target and class mismatch failures must return new id-mode specific error codes.

`upsert block` create mode with `--blocks` or `--blocks-file` must preserve existing validation behavior after removing `--tags` and `--properties` options.

Property type display should remain stable for built-in and custom properties, and missing type values should render as `-` instead of throwing.

JSON and EDN list outputs should remain backward compatible except for the additive `type` field on property items.

## Verification commands and expected output

| Command | Expected output |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test` | Parser, action, and execute tests for mode switching and option removal pass. |
| `bb dev:test -v logseq.cli.format-test` | Human formatter tests pass with `TYPE` column coverage for `list property`. |
| `bb dev:test -v logseq.cli.mcp-tools-contract-test` | Contract tests pass with `:logseq.property/type` present in non-expanded property items. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-upsert-page-create-and-update-existing` | Existing page upsert flow still passes after mode refactor. |
| `bb dev:test -v logseq.cli.integration-test` | New `--id` update-mode and removed-option behavior pass end to end. |
| `bb dev:lint-and-test` | Full suite passes with exit code `0`. |

## Testing Details

Tests cover CLI behavior at parser, action, executor, formatter, and end-to-end levels, and they assert entity outcomes instead of internal helper wiring.

Tests verify that update-by-id mode never creates entities and that legacy duplicated options are no longer accepted for block/page upsert.

Tests verify that `list property` human and structured output both include property-type information in their respective contracts.

## Implementation Details

- Keep db-worker-node thread API names unchanged and avoid adding new transport methods.
- Add `--id` to `upsert page/tag/property` specs in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Remove `--tags` and `--properties` from `upsert block/page` specs in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Make finalize validation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` mode-aware for page/property required options.
- Rework `build-page-action`, `build-tag-action`, and `build-property-action` to branch on create vs update mode.
- Add id-based entity validation helpers in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Make `upsert tag --id` with no mutation fields a successful no-op after id and class validation.
- Reject `upsert page --id --page` as explicit selector conflict.
- Add new id-mode specific error codes for id-not-found and id-type-mismatch paths.
- Include `:logseq.property/type` in non-expanded property list payload from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs`.
- Split property-specific table rendering in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` to add `TYPE` column.
- Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` command reference and examples.
- Keep implementation and debugging workflow aligned with `@test-driven-development` and `@clojure-debug`.

## Question

No open questions.

Decided: `upsert tag --id <id>` with no additional mutation options is a successful no-op.

Decided: `upsert page --id <id> --page <name>` is rejected as conflicting selectors.

Decided: update-by-id failures use new id-mode specific error codes.

---
