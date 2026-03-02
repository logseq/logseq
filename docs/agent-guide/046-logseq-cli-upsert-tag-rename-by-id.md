# Logseq CLI Upsert Tag Rename by ID Implementation Plan

Goal: Allow `logseq upsert tag --id <id> --name <new-name>` to rename an existing tag while preserving the current create-by-name and validate-by-id behavior.

Architecture: Keep the current `logseq-cli -> transport/invoke -> :thread-api/apply-outliner-ops` integration and implement rename-by-id entirely in the CLI command layer.
Architecture: Reuse the existing db-worker-node `:rename-page` outliner op instead of introducing a new thread API.
Architecture: Keep `upsert tag --id <id>` with no `--name` as an id-validation no-op for backward compatibility.

Tech Stack: ClojureScript, babashka.cli, Promesa, Datascript pull queries, db-worker-node outliner ops.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/042-logseq-cli-add-tag-command.md`, `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/043-logseq-cli-tag-property-management.md`, and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/045-logseq-cli-property-type-and-upsert-option-unification.md`.

## Problem statement

Current `upsert tag` validation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` rejects `--id` and `--name` together with the error `only one of --id or --name is allowed`.

Current update mode in `execute-upsert-tag` only calls `ensure-tag-by-id!` and returns success without mutation when `:mode` is `:update`.

Current db-worker-node path already supports page rename through `:thread-api/apply-outliner-ops` with `[:rename-page [page-uuid new-title]]` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`, so rename behavior can be reused without adding new APIs.

The user-visible gap is that a command like `logseq upsert tag --repo <repo> --id 180 --name "Project Renamed"` should rename tag `180`, but currently fails at option validation.

## Testing Plan

I will use `@test-driven-development` for all implementation.

I will write all RED tests first in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` and `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` before any production edits.

I will verify RED failures are behavior failures by asserting error codes or missing mutation ops rather than fixture or async setup problems.

I will use `@clojure-debug` only if async transport stubs or db-worker test harness behavior is unclear.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation baseline

| Requirement | Current behavior | Gap |
| --- | --- | --- |
| `upsert tag --id <id> --name <name>` renames an existing tag. | `invalid-options?` for `:upsert-tag` rejects mixed selectors in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`. | Rename-by-id cannot be triggered. |
| `upsert tag --id <id>` stays supported. | `execute-upsert-tag` update mode validates id and returns `[id]` without mutation. | Must remain unchanged for compatibility. |
| Rename execution uses existing db-worker-node contracts. | db-worker-node already handles `:rename-page` via `:thread-api/apply-outliner-ops` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`. | CLI does not currently call rename op in tag update path. |

## Target contract

`upsert tag --name <name>` keeps create or idempotent-create semantics.

`upsert tag --id <id>` keeps id-validation no-op semantics and returns the same id.

`upsert tag --id <id> --name <new-name>` renames the target tag to `<new-name>` using the existing outliner rename op.

`upsert tag --id <id> --name <new-name>` must fail with `:upsert-id-not-found` or `:upsert-id-type-mismatch` when id is invalid or not a tag.

`upsert tag --id <id> --name <new-name>` must no-op when `<new-name>` normalizes to the same `:block/name` as the target.

`upsert tag --id <id> --name <new-name>` must fail if `<new-name>` belongs to another non-tag page with `:tag-name-conflict`.

`upsert tag --id <id> --name <new-name>` must fail if `<new-name>` belongs to another existing tag to avoid ambiguous cross-tag merges.

## Architecture sketch

```text
CLI
  logseq upsert tag --id 180 --name "Project Renamed"
    -> /src/main/logseq/cli/commands.cljs finalize-command
    -> /src/main/logseq/cli/command/upsert.cljs build-tag-action
    -> /src/main/logseq/cli/command/upsert.cljs execute-upsert-tag
         1) ensure-tag-by-id!
         2) conflict lookup by target name
         3) transport/invoke :thread-api/apply-outliner-ops
            [repo [[:rename-page [tag-uuid new-name]]] {}]
         4) pull by id and return same id
DB Worker
  /src/main/frontend/worker/db_core.cljs
    :rename-page handler -> outliner-core/save-block! with new title
```

## Detailed implementation plan

1. Add a RED parse/build test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting `upsert tag --id 180 --name "Project Renamed"` is accepted and routed to `:upsert-tag`.
2. Add a RED action test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting update-mode tag action keeps `:id` and includes normalized `:name`.
3. Add a RED execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting update-mode with both id and name emits exactly one `:rename-page` op through `:thread-api/apply-outliner-ops`.
4. Add a RED execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting update-mode with id-only remains no-op and does not call `:thread-api/apply-outliner-ops`.
5. Add a RED execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting rename target conflict with non-tag page returns `:tag-name-conflict`.
6. Add a RED execute test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` asserting rename target conflict with another tag returns a dedicated conflict error code.
7. Add a RED integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that creates a tag, fetches its id, runs `upsert tag --id <id> --name <new-name>`, and verifies the new title appears in `list tag`.
8. Add a RED integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` asserting the old name no longer appears in `list tag` after rename.
9. Run focused RED commands and confirm failures are expected contract failures.
10. Update `invalid-options?` for `:upsert-tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to permit `--id` plus `--name` and keep invalid checks for empty or malformed names.
11. Update `build-tag-action` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` so update mode accepts optional `:name` and keeps create mode semantics unchanged.
12. Add helper logic in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to detect whether normalized rename target equals current tag name and skip mutation in that case.
13. Add helper logic in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` to pull by target name and detect conflicts with other entities before rename.
14. Update `execute-upsert-tag` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` update branch to call `:rename-page` when id and name are both provided.
15. Keep error handling in `execute-upsert-tag` aligned with existing `:upsert-id-not-found` and `:upsert-id-type-mismatch` contracts, and add one dedicated rename-conflict code for tag-to-tag collisions.
16. Update CLI reference docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document `upsert tag --id <id> --name <name>` rename semantics and conflict behavior.
17. Run focused GREEN tests for `commands_test` and targeted integration tests.
18. Run `bb dev:test -v logseq.cli.commands-test` and `bb dev:test -v logseq.cli.integration-test` to confirm no regressions.
19. Run `bb dev:lint-and-test` as final verification.
20. Refactor duplicated tag-name normalization or conflict checks only after GREEN, then rerun focused tests.

## Edge cases

- `--name` with leading `#` in update mode should normalize exactly like create mode.
- `--name` that trims to blank should return `:invalid-options` and not hit db-worker.
- Rename to current name with different casing should follow normalized-name no-op behavior.
- Rename target that already exists as another tag should fail deterministically and not mutate either tag.
- Rename target that exists as a non-tag page should fail with `:tag-name-conflict`.
- Rename by id must preserve the original `:db/id` in command output.
- Id-mode not-found and type-mismatch errors must remain stable for scripts.

## Verification commands and expected output

| Command | Expected output |
| --- | --- |
| `bb dev:test -v logseq.cli.commands-test` | Upsert tag parse, build, and execute tests pass including rename-by-id and no-op id-only paths. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-upsert-tag-id-rename` | End-to-end rename-by-id test passes with renamed tag visible in list output. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-upsert-tag-id-rename-conflict` | Conflict behavior test passes and returns expected error code/message. |
| `bb dev:lint-and-test` | Full suite passes with exit code `0`. |

## Testing Details

The new tests verify user-observable behavior at parser, action, executor, and CLI integration levels.

The tests assert command outputs, mutation calls, and list/query observable state instead of helper internals.

The tests keep existing id-only no-op behavior covered so rename support does not regress current automation scripts.

## Implementation Details

- Modify tag option validation only in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.
- Keep db-worker-node thread API signatures unchanged in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.
- Reuse existing `:rename-page` outliner op instead of introducing a new op.
- Preserve create-by-name idempotency path for `upsert tag --name`.
- Preserve id-only validate path for `upsert tag --id`.
- Add deterministic rename conflict handling before invoking rename op.
- Keep error code stability for existing id lookup and type mismatch failures.
- Update CLI docs to reflect rename-by-id and no-op-by-id contracts.
- Follow `@test-driven-development` sequence strictly and use `@clojure-debug` only for harness issues.

## Question

Resolved: choose option 1.

Rename-to-existing-tag returns a dedicated conflict error and must not be treated as success by returning the existing tag id.

This prevents implicit merges and accidental retargeting.

---
