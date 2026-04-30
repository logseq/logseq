# Logseq CLI and db-worker-node deps/cli Decoupling Implementation Plan

Goal: Make `logseq-cli` behavior independent from old `deps/cli` regressions while restoring list behavior that regressed after commit `0de3c337e` on February 12, 2026.

Architecture: Apply a CLI-scoped decoupling only for the runtime path used by `logseq-cli` (`src/main/logseq/cli/*` plus db-worker API path it invokes), and defer non-CLI namespace migration to follow-up work.

Tech Stack: ClojureScript, Datascript, `shadow-cljs` node-script builds (`:logseq-cli` and `:db-worker-node`), babashka test workflow.

Related: Builds on `docs/agent-guide/003-db-worker-node-cli-orchestration.md`, `docs/agent-guide/007-logseq-cli-thread-api-and-command-split.md`, and `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

Developer note (CLI-scoped): The implementation for this plan only migrates the `logseq-cli -> db-worker-node -> thread-api` runtime path by adding `src/main/logseq/cli/common/mcp/tools.cljs`. It does not migrate or alter export/Electron/non-CLI namespaces still resolving from `deps/cli`.

## Problem statement

`deps/cli` is the old CLI codebase, but current runtime paths under `src/` still require namespaces from `deps/cli`, so old CLI commits can silently change new CLI behavior.

Commit `0de3c337e` changed `deps/cli/src/logseq/cli/common/mcp/tools.cljs` and removed fields and filters that new CLI still depends on through db-worker thread-api calls.

Current regressions are reproducible with existing tests.

`bb dev:test -v 'logseq.cli.integration-test/test-cli-list-outputs-include-id'` currently fails because list items no longer include numeric `:id`.

`bb dev:test -v 'logseq.cli.integration-test/test-cli-add-tags-and-properties-by-id'` currently fails because default tag/property lists no longer include built-in entities needed for ID-based add flows.

The dependency path that causes this is shown below.

```text
logseq-cli (src/main/logseq/cli/*)
  -> HTTP invoke to db-worker-node
    -> thread-api methods in frontend.worker.db-core
      -> implementation helper logseq.cli.common.mcp.tools  (currently loaded from deps/cli)
```

## Current dependency inventory

| Namespace currently resolved from `deps/cli` | `src/` consumers | Build impact | Status in this plan |
| --- | --- | --- | --- |
| `logseq.cli.common.mcp.tools` | `src/main/frontend/worker/db_core.cljs`, `src/main/logseq/api/db_based/cli.cljs`, `src/main/logseq/sdk/utils.cljs` | `:db-worker-node`, app API, SDK | In scope now |
| `logseq.cli.common.file` | `src/main/frontend/worker/export.cljs` | `:db-worker-node` export path | Out of scope now |
| `logseq.cli.common.util` | `src/main/frontend/extensions/zip.cljs`, export handlers | app export and zip features | Out of scope now |
| `logseq.cli.common.export.common` | `src/main/frontend/handler/export/common.cljs`, `src/main/frontend/handler/export/html.cljs`, `src/main/frontend/handler/export/opml.cljs`, `src/main/frontend/handler/export/text.cljs` | app export features | Out of scope now |
| `logseq.cli.common.export.text` | `src/main/frontend/handler/export/text.cljs` | app markdown export | Out of scope now |
| `logseq.cli.common.graph` | `src/electron/electron/utils.cljs`, `src/electron/electron/db.cljs`, `src/electron/electron/handler.cljs` | Electron graph directory behavior | Out of scope now |
| `logseq.cli.common.mcp.server` | `src/electron/electron/server.cljs` | Electron MCP HTTP endpoint | Out of scope now |
| `logseq.cli.text-util` | `src/main/frontend/util/text.cljs` | frontend text helpers | Out of scope now |

## Scope

This plan only changes logseq-cli related runtime behavior.

This plan migrates the `logseq-cli -> db-worker-node -> thread-api` path where the implementation currently resolves to `deps/cli`.

In this PR, that means migrating `logseq.cli.common.mcp.tools` out of `deps/cli` because it is the thread-api-side implementation used by logseq-cli list/add flows.

This plan does not modify any code under `deps/cli`.

This plan does not migrate frontend export namespaces, Electron namespaces, or unrelated old CLI modules in `deps/cli`.

This plan does not redesign CLI command UX or old CLI feature parity, and old CLI under `deps/cli` remains frozen unless a compatibility fix is required for release safety.

Implementation must follow @test-driven-development, and any unexpected test failure while migrating must follow @clojure-debug before changing behavior.

## Testing Plan

I will first lock the current regressions by running the two failing integration tests as baseline checks and recording failure reasons in the PR notes.

I will add focused tests for list data contract behavior so `:id`, built-in inclusion defaults, and page filtering options are guaranteed independent of old CLI code.

I will run compile checks for both node builds to ensure the CLI path behaves correctly after the targeted namespace move.

I will not include export/Electron migration tests in this PR because those modules are explicitly out of scope.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

1. Add a migration checklist section in the PR description that references this document and lists the two known failing integration tests.

2. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-list-outputs-include-id'` and confirm it fails before code changes.

3. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-add-tags-and-properties-by-id'` and confirm it fails before code changes.

4. Add a focused test file at `src/test/logseq/cli/mcp_tools_contract_test.cljs` for `list-pages`, `list-tags`, and `list-properties` contract behavior used by new CLI.

5. In that test file, add a case asserting non-expanded list output includes `:db/id`, `:block/title`, `:block/created-at`, and `:block/updated-at`.

6. In that test file, add a case asserting `include-built-in` defaults to true and explicitly false excludes built-in tags and properties.

7. In that test file, add a case asserting page list filtering honors `include-hidden`, `include-journal`, `journal-only`, `created-after`, and `updated-after`.

8. Add `src/main/logseq/cli/common/mcp/tools.cljs` by porting the pre-`0de3c337e` behavior as baseline thread-api implementation and keeping API signatures used by `db-core` and SDK.

9. Update `src/` callsites to resolve the new `src/main` implementation and keep `deps/cli` source files untouched.

10. Re-run `bb dev:test -v 'logseq.cli.mcp-tools-contract-test'` and make it pass with no test skips.

11. Re-run the two integration regressions and make both pass.

12. Keep all files under `deps/cli` unchanged in this PR.

13. Do not remove `logseq/cli` from `deps.edn` in this PR because unrelated frontend and Electron runtime modules still depend on it.

14. Run `clojure -M:cljs compile logseq-cli` and verify compile success.

15. Run `clojure -M:cljs compile db-worker-node` and verify compile success.

16. Run `bb dev:test -v 'logseq.cli.commands-test/test-list-subcommand-parse'` to verify list option parsing remains stable.

17. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-list-outputs-include-id'` to verify ID contract restoration end-to-end.

18. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-add-tags-and-properties-by-id'` to verify built-in tag/property ID flows end-to-end.

19. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-list-add-show-remove'` as a smoke test for normal create/list/show/remove flow.

20. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-query-recent-updated'` as a smoke test for list timestamps and query interplay.

21. Run `bb dev:lint-and-test` before merge to satisfy repository review checklist.

## Edge cases to validate during implementation

If `created-after` or `updated-after` is an invalid date string, filtering should not crash and should behave as no time filter.

When `include-journal` is omitted, journals should remain included by default to preserve existing CLI expectations.

When `include-built-in` is omitted, built-in tags and properties must remain included so ID resolution in add/update flows still works.

Non-expanded list output must contain stable numeric IDs even if UUID and title are present.

Expanded list output must keep UUID string conversion and keep relationship fields (`classes`, `extends`, `properties`) in expected shapes.

Non-CLI frontend export and Electron behavior must remain untouched in this PR.

## Open questions requiring clarity

Should we do a second PR for non-CLI namespace migration (`export`, `electron`, `text-util`) immediately after this thread-api decoupling PR, or wait until after release.

## Testing Details

The key behavior tests are integration-first and validate user-observable outcomes, not internal helper implementation.

`test-cli-list-outputs-include-id` verifies that real CLI JSON output includes usable IDs for list operations.

`test-cli-add-tags-and-properties-by-id` verifies that list output can feed directly into add operations using IDs and complete a write/read roundtrip.

`mcp-tools-contract-test` verifies option semantics and filtering behavior at the db-worker API boundary to prevent future regressions from unrelated old CLI edits.

## Implementation Details

- Keep migration atomic by changing only logseq-cli related runtime pieces in this PR.
- Preserve public function names and argument shapes to minimize callsite churn.
- Restore pre-`0de3c337e` list semantics for IDs and built-in filtering.
- Do not edit any file under `deps/cli`; all migration changes must happen in `src/` and `src/test/`.
- Do not change command parsing behavior in `src/main/logseq/cli/command/list.cljs` unless tests show incompatibility.
- Keep Electron/export/frontend non-CLI require lines unchanged in this PR.
- Treat `deps/cli` as frozen legacy code for non-CLI modules in this PR.
- Add a short developer note in `README.md` or `docs` explaining this PR is CLI-scoped only.
- Use smallest possible commits per namespace group to simplify rollback.
- Ensure all touched files remain ASCII and follow existing formatting conventions.
- Finish with `bb dev:lint-and-test` and include command outputs in the PR summary.

## Decision

This migration will keep `logseq.cli.common.*` namespace names stable and only move CLI-path runtime implementation needed for `logseq-cli`.

Namespace renaming will be done in a follow-up PR after decoupling and regression fixes are complete.

---
