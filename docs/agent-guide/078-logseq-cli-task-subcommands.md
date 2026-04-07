# Logseq CLI Task Subcommands Implementation Plan

Goal: Add task-oriented subcommands to the current `logseq-cli` command surface with `list task` and `upsert task`, where a task is any node tagged with `#Task` (`:logseq.class/Task`), including both blocks and pages.

Architecture: Reuse the existing `logseq-cli -> transport/invoke -> db-worker-node thread-api` flow, and keep command parsing/build/validation in CLI command namespaces with db read logic in db-worker helpers.

Architecture: Keep behavior aligned with current `list`/`upsert`/`remove` conventions, and avoid introducing a parallel command framework for tasks.

Tech Stack: ClojureScript, `babashka.cli`, `promesa`, Datascript pull/query, existing `apply-outliner-ops` mutation path in db-worker.

Related: Builds on [069-logseq-cli-search-subcommands.md](/Users/rcmerci/gh-repos/logseq/docs/agent-guide/069-logseq-cli-search-subcommands.md), [071-logseq-cli-search-content-option.md](/Users/rcmerci/gh-repos/logseq/docs/agent-guide/071-logseq-cli-search-content-option.md), and [docs/cli/logseq-cli.md](/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md).

## Problem statement

Current CLI supports generic node operations (`list page/tag/property`, `upsert block/page/tag/property`, `remove block/page/tag/property`) but has no task-focused command path.

The product model already has built-in class `:logseq.class/Task` and task properties (`status`, `priority`, `deadline`, `scheduled`), so users currently need multiple generic commands or custom queries for common task workflows.

We need a first-class task command group that maps to existing implementation patterns and is script-friendly.

## Current baseline from implementation

`list` commands already expose pagination and sort contracts and depend on db-worker helper functions via `:thread-api/cli-list-*`.

`upsert block/page` already supports tag/property mutation via `--update-tags`, `--update-properties`, `--remove-tags`, and `--remove-properties`.

`remove` commands already implement robust selector validation, name/id disambiguation, and best-effort multi-id behavior for blocks.

Built-in class `:logseq.class/Task` exists and is treated as a tag class with task properties in db bootstrap.

## Command surface proposal (for discussion first)

This section is intentionally a proposal draft so we can converge on options before implementation.

### 1) `list task` options proposal

Recommended MVP options:

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `--status` | status alias | none | Accept same aliases as current `upsert block --status` normalization. |
| `--priority` | `low|medium|high|urgent` | none | Task priority filter. |
| `--content` | string | none | Case-insensitive substring filter on `:block/title`. |
| `--fields` | csv | command default | Same pattern as existing `list` commands. |
| `--limit` | long | none | Same as existing `list`. |
| `--offset` | long | none | Same as existing `list`. |
| `--sort` | enum | `updated-at` | Proposed sort fields: `updated-at`, `created-at`, `title`, `status`, `priority`. |
| `--order` | `asc|desc` | `asc` | Same as existing `list`. |

Recommended default output fields:

`id,title,status,priority,scheduled,deadline,updated-at,created-at`.

Phase 2 optional filters:

`--scheduled-after`, `--scheduled-before`, `--deadline-after`, `--deadline-before`, and multi-status support.

### 2) `upsert task` options proposal

Recommended MVP options:

| Option | Type | Purpose |
| --- | --- | --- |
| `--id` | long | Update an existing node as task by db/id. |
| `--uuid` | uuid | Update an existing node as task by UUID. |
| `--page` | string | Upsert a page task by page name. |
| `--content` | string | Create a block task with content. |
| `--target-id` | long | Block create target selector. |
| `--target-uuid` | uuid | Block create target selector. |
| `--target-page` | string | Block create target selector. |
| `--pos` | `first-child|last-child|sibling` | Block create position control. |
| `--status` | status alias | Set `:logseq.property/status`. |
| `--priority` | enum | Set `:logseq.property/priority.*`. |
| `--update-properties` | edn map | Advanced property mutation. |
| `--remove-properties` | edn vector | Advanced property removal. |
| `--update-tags` | edn vector | Optional extra tags beyond `#Task`. |
| `--remove-tags` | edn vector | Optional tag removal with guardrails for `#Task`. |

Recommended semantics:

`upsert task` always ensures `:logseq.class/Task` tag exists on the target node.

When selector is `--id` or `--uuid`, command runs in update mode and converts non-task node into task by adding `:logseq.class/Task`.

When selector is `--page`, command upserts page and ensures task tag plus task properties.

When selector is `--content` and no id/page selector is provided, command creates block task and supports current block targeting options.

Key validation proposal:

Only one of `--id`, `--uuid`, `--page` is allowed.

`--content` and `--page` cannot be combined.

`--target-*` and `--pos` are only valid for block-create path.

Task removal strategy:

Do not add `remove task` in this scope.

Use existing `remove block` and `remove page` commands for deletion.

## Proposed architecture and files

Keep `list task` in list command flow and add db-worker helper method to avoid large query logic in CLI command layer.

Implement `upsert task` by reusing existing upsert/tag/property helper functions and `apply-outliner-ops` patterns.

Primary files to touch:

- [/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs)
- [/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs)
- [/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs)
- [/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs)
- [/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs)
- [/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs](/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs)
- [/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md](/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md)
- [/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn](/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn)
- [/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn](/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn)

## Testing Plan

I will follow @test-driven-development and add all failing tests before implementation code changes.

I will add parser and validation tests in [commands_test.cljs](/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs) for new command paths and option conflicts.

I will add command execution tests for new task logic in [upsert_test.cljs](/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/upsert_test.cljs) and existing remove/list test files, or create focused task command test namespaces if coverage becomes too broad.

I will add db-worker behavior tests for task listing in [db_worker_test.cljs](/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/db_worker_test.cljs).

I will add output formatting tests in [format_test.cljs](/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs) for human/json/edn task command outputs.

I will extend CLI e2e inventory and non-sync cases for `list task` and `upsert task`.

I will run focused tests first and then run `bb dev:lint-and-test`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Step-by-step implementation plan

1. Add command entries for `list task` and `upsert task` with proposed option specs and examples.

2. Wire new command keywords into parse-time validation in [commands.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs).

3. Add build-action branches for new task commands and keep error codes aligned with existing style (`:missing-target`, `:invalid-options`, `:missing-page-name`).

4. Add execute branch wiring for new task command types in [commands.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs).

5. Implement `list task` db-worker helper query in [db_worker.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs) and expose it via new `:thread-api/cli-list-tasks` in [db_core.cljs](/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs).

6. Implement `execute-list-task` in [list.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs) with existing sort/fields/offset/limit helpers.

7. Implement `build-task-action` and `execute-upsert-task` in [upsert.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs) by composing existing tag/property resolution utilities and task-specific normalization for status and priority.

8. Add `format` support for new command result shapes in [format.cljs](/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs).

9. Update docs and CLI e2e coverage files once behavior is stable.

## Edge cases to cover explicitly

A target node can exist but not have `#Task`, and command should fail with explicit type-mismatch style error instead of silently mutating or deleting wrong entities.

Task pages and task blocks must both be supported for list and upsert.

`upsert task` status aliases should match current `upsert block --status` normalization so scripts can reuse existing values.

`--scheduled` and `--deadline` are explicitly out of MVP and should be handled later via dedicated options or via `--update-properties`.

`list task` sort behavior must stay stable with deterministic tie-breaker by `:db/id`, consistent with current list commands.

## Testing Details

I will verify parse/build/execute behavior at command layer and confirm db-worker helper output contracts without relying on ad hoc manual checks.

I will ensure tests assert behavior for both block task and page task paths, including conversion of non-task nodes during upsert when selector-based update is used.

I will include at least one e2e case that creates task via `upsert task` and lists it via `list task` in one flow.

## Implementation Details

- Keep task identity canonical as `:block/tags` containing `:logseq.class/Task`.
- Reuse existing normalization helpers for status and property parsing to minimize duplicate parsing logic.
- Prefer extending existing command namespaces over introducing a second task-only command framework.
- Reuse existing list formatting utilities with task-specific column mapping.
- Keep error code naming aligned with current conventions to avoid inconsistent CLI UX.
- Keep JSON namespaced key behavior unchanged by routing through existing formatter normalization.
- Ensure command help examples include both block and page task use cases.
- Keep cli-e2e inventory and docs in lockstep with final option names.
- Defer non-MVP filters (`deadline`/`scheduled` ranges, multi-status) and `upsert task` dedicated `--scheduled/--deadline` options.

## Question

No open questions.

---
