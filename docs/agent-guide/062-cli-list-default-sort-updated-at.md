# Logseq CLI List Default Updated-at Sort Implementation Plan

Goal: Make `list page`, `list tag`, and `list property` behave as if `--sort updated-at` is provided when users do not pass `--sort`.

Architecture: Keep the change in the CLI command layer so the existing db-worker-node API surface remains stable.
Architecture: Reuse current CLI-side sorting flow in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` where sorting already runs before offset and limit.
Architecture: Keep db-worker-node list providers in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` unchanged for this scope, and document that decision explicitly.

Tech Stack: ClojureScript, babashka.cli option specs, Promesa, Datascript-backed db-worker-node thread-api, existing CLI integration test harness.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/004-logseq-cli-verb-subcommands.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/043-logseq-cli-tag-property-management.md`.

## Problem statement

Current list commands support `--sort` and `--order`, but default behavior is unsorted because no sort field is applied unless users pass `--sort`.

In current implementation, `list` execution fetches items from db-worker-node and runs `apply-sort` only when `:sort` is present in options.

This means default output order depends on entity scan order from db-worker-node list functions, which is not aligned with the desired product behavior.

The requested behavior is a consistent default sort key of `updated-at` for page, tag, and property list subcommands.

## Current behavior snapshot

| Layer | File | Current behavior |
| --- | --- | --- |
| CLI command parsing and execution | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` | `:sort` is optional and defaults to nil, so `apply-sort` is skipped when `--sort` is absent. |
| db-worker-node list thread-api bridge | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | `:thread-api/api-list-pages`, `:thread-api/api-list-tags`, and `:thread-api/api-list-properties` return unsorted collections from shared list helpers. |
| Shared list helpers | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` | List helpers filter and shape items but do not apply sort by `updated-at`. |
| User docs | `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | List command syntax documents `--sort` as optional but does not state default sort behavior. |

## Scope and non-goals

This plan changes default sort behavior for CLI commands `list page`, `list tag`, and `list property`.

This plan does not add new db-worker-node thread-api methods.

This plan does not push pagination or sorting into db-worker-node.

This plan does not change field names or output schemas.

## Proposed behavior

When users run `logseq list page`, `logseq list tag`, or `logseq list property` without `--sort`, CLI should sort by `updated-at` using the existing list sorting pipeline.

When users pass `--sort`, the explicit value must override the default.

`--order` should continue to default to `asc` unless explicitly set to `desc`.

When multiple entities have the same primary sort value, CLI should apply `:db/id` as the deterministic secondary sort key.

`offset` and `limit` must still be applied after sorting.

The behavior should be equivalent to explicitly passing `--sort updated-at` today, with deterministic tie-breaking by `:db/id`.

## Integration overview

```text
logseq list page
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs
     - determine effective sort field (default updated-at)
     - apply CLI-side sort/order
     - apply offset/limit/fields
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs
```

## Testing Plan

I will follow `@test-driven-development` and add tests before implementation changes.

I will add unit tests for CLI list execution paths that verify default sorting is applied when `:sort` is missing.

I will add unit tests that verify explicit `--sort` still overrides the new default.

I will add integration tests that verify default output order matches explicit `--sort updated-at` output for page, tag, and property list commands.

I will update docs assertions or command help expectations if any existing tests encode old behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Detailed implementation plan

1. Add a failing unit test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for list-page execution where input items are intentionally out of updated-at order and no `:sort` is provided.
2. Assert in that test that returned item ids are ordered exactly as if `:sort` were `"updated-at"` with default `:order`.
3. Add a failing unit test for list-tag execution with no `:sort` and confirm default updated-at ordering is applied after tag item preparation.
4. Add a failing unit test for list-property execution with no `:sort` and confirm default updated-at ordering is applied after property item preparation.
5. Add a failing unit test that passes explicit `:sort "title"` and confirms explicit sort overrides default updated-at behavior.
6. Add a failing unit test that passes explicit `:order "desc"` without `:sort` and confirms order is applied to default updated-at sort key.
7. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that compares `list page` results against `list page --sort updated-at` for the same graph and asserts identical id sequences.
8. Add a failing integration test that compares `list tag` against `list tag --sort updated-at` and asserts identical id sequences.
9. Add a failing integration test that compares `list property` against `list property --sort updated-at` and asserts identical id sequences.
10. Run focused tests to verify they fail for the new default-sort behavior and not for unrelated setup issues.
11. Implement an `effective-sort` decision in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` so list commands use `"updated-at"` when `:sort` is absent.
12. Reuse the effective sort key for all three executors: `execute-list-page`, `execute-list-tag`, and `execute-list-property`.
13. Keep existing explicit sort validation and allowed sort fields unchanged.
14. Add deterministic tie-breaking by `:db/id` in CLI list sorting when primary sort values are equal.
15. Keep existing order default (`asc`) unchanged.
16. Update option descriptions in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` to clarify default sort behavior for users.
17. Update docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to state that list subcommands default to sorting by `updated-at`.
18. Run focused unit and integration tests again and confirm green.
19. Run `bb dev:test -v logseq.cli.commands-test` to confirm command-level regressions are not introduced.
20. Run `bb dev:test -v logseq.cli.integration-test` for list command scenarios impacted by ordering.
21. Run `bb dev:lint-and-test` for final confidence.

## Edge cases to cover

Entities with missing `:block/updated-at` should still be sortable without runtime errors.

Multiple entities with equal `updated-at` values should be secondarily sorted by `:db/id` for deterministic output across repeated runs.

`--fields` filtering should not remove `updated-at` before sorting is executed.

`--offset` and `--limit` should continue to apply after sorting, not before sorting.

`--sort` with any allowed non-time field should keep existing behavior and take precedence over the new default.

`--order desc` without explicit `--sort` should now reverse default updated-at order.

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test/test-list-subcommand-parse` | Existing parse behavior remains valid and list options remain accepted. |
| `bb dev:test -v logseq.cli.commands-test` | New default-sort unit tests pass and no command-level regressions are introduced. |
| `bb dev:test -v logseq.cli.integration-test` | Integration checks for list default ordering pass against a real db-worker-node flow. |
| `bb dev:lint-and-test` | Full lint and unit suite pass with zero errors. |

## Rollout and compatibility

This is a behavior change in default ordering for three CLI list commands.

Scripts that depended on previous implicit scan order may observe changed item order.

Scripts that already pass explicit `--sort` remain unaffected.

No db-worker-node API contract change is introduced in this scope.

## Testing Details

Tests verify user-visible command behavior by comparing result ordering between default list calls and explicit `--sort updated-at` calls.

Tests validate override behavior so explicit sort fields still control final ordering.

Tests validate order plus pagination interaction to ensure behavior consistency.

## Implementation Details

- Update default sort selection in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` for page, tag, and property list executors.
- Keep existing `apply-sort`, `apply-offset-limit`, and `apply-fields` sequencing unchanged.
- Extend CLI sort implementation to apply `:db/id` as secondary key when primary sort values are equal.
- Reuse existing `list-*-field-map` entries for `updated-at` so no new field mapping is introduced.
- Keep db-worker-node list handlers in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` unchanged in this scope.
- Keep shared list helper behavior in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/mcp/tools.cljs` unchanged in this scope.
- Add command-level unit coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.
- Add end-to-end list ordering coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`.
- Update user-facing list docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.

## Question

No open questions.

---
