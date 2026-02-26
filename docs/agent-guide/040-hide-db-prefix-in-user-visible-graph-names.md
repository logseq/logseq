# Hide Db Prefix In User Visible Graph Names Implementation Plan

Goal: Ensure user-visible graph names strip exactly one leading `logseq_db_` prefix while preventing new multi-prefix repos from being created.

Architecture: Keep display normalization as single-pass prefix stripping for web, Electron, and CLI user-facing fields.

Architecture: Add shared canonicalization at ingestion and graph-discovery boundaries so internal repo identifiers are normalized to exactly one leading prefix before persistence and routing.

Architecture: Follow `@test-driven-development` with failing tests first across frontend, Electron boundary code, RTC ingestion, and CLI paths.

Tech Stack: ClojureScript, Rum, Electron IPC, db-worker-node runtime, Logseq CLI formatting pipeline, Babashka tests.

Related: Relates to `docs/agent-guide/033-desktop-db-worker-node-backend.md`.

Related: Builds on `docs/agent-guide/038-electron-db-worker-switch-graph.md`.

## Problem statement

Graph names shown in the web graph list can expose `logseq_db_` when the stored repo value has multiple leading prefixes.

Current rendering logic intentionally strips only one leading prefix, so malformed values like `logseq_db_logseq_db_demo` still render as `logseq_db_demo`.

The product decision is to keep one-layer stripping behavior and fix the upstream causes that create multi-prefix repo identifiers.

Multi-prefix data can enter through legacy disk graph discovery, Electron graph mapping, RTC remote metadata ingestion, and CLI graph-name conversion paths.

The required outcome is stable single-prefix internal repo identifiers plus single-pass display normalization, so normal graphs render as `demo` and malformed legacy doubles render as `logseq_db_demo`.

## Current and target normalization path

```text
Current path with multi-prefix source data.
input repo: logseq_db_logseq_db_demo
  -> display helper strips once
  -> output: logseq_db_demo
  -> user-visible prefix leak occurs.

Target path with source canonicalization + single-pass display stripping.
ingress repo: logseq_db_logseq_db_demo
  -> canonicalize to one internal prefix: logseq_db_demo
  -> display helper strips once
  -> output: demo

Legacy persisted double-prefix fallback path (no migration).
input repo from old state: logseq_db_logseq_db_demo
  -> display helper strips once
  -> output: logseq_db_demo
```

## Testing Plan

I will follow `@test-driven-development` and write all failing tests before implementation.

I will add frontend unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/util/text_test.cljs` to assert single-pass prefix stripping behavior.

I will add frontend persist tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/db/persist_test.cljs` to assert merged graph sources are canonicalized to one internal prefix before UI state usage.

I will add RTC tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/handler/db_based/rtc_test.cljs` to assert remote graph payload ingestion cannot create local double-prefix repos.

I will extend CLI formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` to assert user-facing fields strip exactly one prefix and never introduce additional prefixes.

I will extend CLI command tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `graph list` and server output paths with unprefixed and prefix-like graph names, and assert prefix-like `--repo` values are treated as graph-name content instead of invalid input.

I will add legacy graph discovery tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/graph_test.cljs` to verify old directory names do not produce multi-prefix repo ids.

I will run focused tests after RED and GREEN phases, then run `bb dev:lint-and-test` before completion.

I will review changes against `@prompts/review.md` before merge.

NOTE: I will write all tests before I add any implementation behavior.

## Implementation plan

### Phase 1: Add failing tests for one-layer display stripping and multi-prefix prevention.

1. Add failing unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/util/text_test.cljs` for `logseq_db_demo -> demo`, `logseq_db_logseq_db_demo -> logseq_db_demo`, and middle-substring preservation.
2. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/db/persist_test.cljs` to verify worker and Electron graph sources are canonicalized to one internal prefix.
3. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/handler/db_based/rtc_test.cljs` for remote graph mapping and download paths with prefixed and double-prefixed payload names.
4. Extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` with failing cases where `:repo` or `:graph` includes one or two prefixes and output uses one-layer stripping only.
5. Extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` with failing cases for graph list and server output using unprefixed and prefix-like `--repo` values, and assert prefix-like values are not rejected by argument validation.
6. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/graph_test.cljs` for legacy directory names that already contain `logseq_db_`.
7. Run focused tests and confirm failures reflect behavior gaps rather than setup errors.

### Phase 2: Implement shared helpers for display normalization and repo canonicalization.

8. Add shared helpers in `/Users/rcmerci/gh-repos/logseq/deps/common/src/logseq/common/config.cljs` for single-pass display stripping and exact-one-prefix canonicalization.
9. Keep display helper semantics strict to remove only one leading prefix and preserve all middle substrings.
10. Keep canonicalization helper semantics strict to collapse any number of leading prefixes to exactly one.
11. Use function names that clearly separate display behavior from internal repo id normalization.
12. Keep helpers pure and dependency-light so they can be reused in frontend, Electron, and CLI namespaces.

### Phase 3: Apply web app fixes with one-layer display semantics.

13. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/util/text.cljs` so `get-graph-name-from-path` calls the shared single-pass display helper.
14. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` so `db-graph-name` remains one-layer stripping and does not over-strip.
15. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/db/conn.cljs` so `get-short-repo-name` uses shared one-layer display normalization.
16. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/repo.cljs` rendering paths only if needed to ensure all user-visible labels share one-layer stripping behavior.
17. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/db/persist.cljs` so merged graph sources are canonicalized to one internal prefix before entering repo state.
18. Keep `data-testid` and internal routing keys unchanged unless canonicalization is required to prevent multi-prefix key creation.

### Phase 4: Fix Electron and graph discovery paths that can create multi-prefix repos.

19. Update `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/common/graph.cljs` so `get-db-based-graphs` canonicalizes discovered graph repo names to one prefix.
20. Update `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` and `/Users/rcmerci/gh-repos/logseq/src/electron/electron/utils.cljs` to canonicalize repo identifiers at IPC mapping boundaries.
21. Verify Electron IPC `getGraphs` keeps stable internal repo identifiers and no path emits new double-prefixed repos.

### Phase 5: Fix RTC ingestion paths that can reintroduce multi-prefix repos.

22. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/db_based/rtc.cljs` so remote graph payload mapping canonicalizes incoming graph names before repo/url construction.
23. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/rtc/full_upload_download_graph.cljs` so download naming canonicalizes to one internal prefix before local repo creation.
24. Ensure existing graphs with prefixed remote names remain accessible after normalization.
25. Ensure new uploads and downloads cannot create `logseq_db_logseq_db_*` local repo ids.

### Phase 6: Apply CLI fixes for one-layer display and one-prefix internal ids.

26. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` so `repo->graph` strips exactly one leading prefix for user-visible output.
27. Verify `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` uses one-layer display normalization consistently for human, JSON, and EDN user-facing graph fields.
28. Update `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/commands/graph.cljs` to canonicalize internal repo identifiers before list rendering and server-target resolution.
29. Ensure CLI parsing and command execution treat `--repo` as a graph-name string, so leading `logseq_db_` is interpreted as part of graph name when present and is not rejected by input validation.

### Phase 7: Verification and release gate.

30. Run `bb dev:test -v 'frontend.util.text-test'` and confirm one-layer strip behavior and canonicalization tests pass.
31. Run `bb dev:test -v 'frontend.db.persist-test'` and confirm merged-source canonicalization behavior is stable.
32. Run `bb dev:test -v 'frontend.handler.db-based.rtc-test'` and confirm remote ingestion cannot produce multi-prefix repos.
33. Run `bb dev:test -v 'logseq.cli.format-test'` and confirm CLI display fields apply one-layer strip behavior.
34. Run `bb dev:test -v 'logseq.cli.commands-test'` and confirm graph command behavior remains stable with unprefixed and prefix-like `--repo` input.
35. Run `bb dev:test -v 'logseq.cli.common.graph-test'` and confirm legacy graph discovery does not emit double-prefixed repo names.
36. Run `bb dev:lint-and-test` and confirm `0 failures, 0 errors`.
37. Perform a manual graph-list smoke check on web and Electron to confirm normal graphs display without prefix and legacy doubles display with one remaining prefix.
38. Perform a manual CLI smoke check with `logseq graph list`, `logseq server status --repo demo`, and `logseq server status --repo logseq_db_demo` to confirm both inputs are accepted as graph names.

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Internal repo is `logseq_db_demo`. | User-visible name is `demo`. |
| Internal repo is `logseq_db_logseq_db_demo`. | User-visible name is `logseq_db_demo`. |
| Graph name contains middle substring like `my_logseq_db_notes`. | Middle substring is preserved and only one leading prefix is removed when present. |
| Legacy disk directory is named `logseq_db_demo`. | Discovery canonicalization keeps exactly one prefix and does not create `logseq_db_logseq_db_demo`. |
| Legacy disk directory is named `logseq_db_logseq_db_demo`. | Discovery canonicalization collapses to internal repo `logseq_db_demo`. |
| Remote graph payload returns `graph-name` as `logseq_db_demo`. | RTC mapping keeps internal repo `logseq_db_demo` and user-visible name `demo`. |
| Remote graph payload returns `graph-name` as `logseq_db_logseq_db_demo`. | RTC mapping canonicalizes to internal repo `logseq_db_demo`, and user-visible name is `demo` after one-layer display strip. |
| CLI receives `--repo demo`. | Command works and output graph name is `demo`. |
| CLI receives `--repo logseq_db_demo`. | Command treats `logseq_db_` as part of graph name and does not fail argument validation. |
| CLI receives `--repo logseq_db_logseq_db_demo`. | Command treats the full value as graph name content and does not fail argument validation. |
| Non-user-visible fields like `data-testid` include repo id. | Existing selectors remain unchanged unless canonicalization is required to prevent duplicate graph entries. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'frontend.util.text-test'
bb dev:test -v 'frontend.db.persist-test'
bb dev:test -v 'frontend.handler.db-based.rtc-test'
bb dev:test -v 'logseq.cli.format-test'
bb dev:test -v 'logseq.cli.commands-test'
bb dev:test -v 'logseq.cli.common.graph-test'
bb dev:lint-and-test
```

Each command should finish with `0 failures, 0 errors`.

Web and Electron manual checks should show no new multi-prefix repo entries.

Web and Electron display should strip one prefix only at render time.

CLI human output should match one-layer strip semantics, and CLI `--repo` should treat prefix-like values as normal graph names.

## Testing Details

The tests verify user-visible behavior and repo-id canonicalization at ingress and discovery boundaries.

Frontend tests assert display output and merged-state behavior rather than helper internals alone.

RTC and Electron tests assert that incoming prefixed names cannot generate additional prefixes in local repo ids.

CLI tests assert command behavior and output formatting remain stable for unprefixed and prefix-like graph-name input.

## Implementation Details

- Keep display normalization as single-pass prefix stripping.
- Add one shared helper for exact-one-prefix repo canonicalization.
- Canonicalize ingress and discovery data before it reaches persistent repo state.
- Reuse shared helpers across frontend, Electron, and CLI.
- Preserve `data-testid` compatibility unless canonicalization makes key updates unavoidable.
- Avoid one-time metadata migration for existing persisted graphs.
- Treat CLI `--repo` input as raw graph name where `logseq_db_` may be part of the name.
- Keep internal thread-api contracts based on prefixed repo ids.
- Follow `@test-driven-development` for RED, GREEN, and REFACTOR order.
- Validate final patch with `@prompts/review.md` checklist.

## Question

Decision: Display normalization removes only one leading prefix, so `logseq_db_logseq_db_xxxx` displays as `logseq_db_xxxx` in app surfaces that read legacy uncanonicalized values.

Decision: The implementation focus is to identify and fix all paths that can create multi-prefix repo identifiers, so newly produced data stays canonical.

Decision: This change does not include a one-time metadata migration for existing persisted legacy values.

Decision: CLI `--repo` option treats leading `logseq_db_` as graph-name content, not as forbidden prefix.

Decision: Treat `data-testid` stability as a strict compatibility requirement for `clj-e2e`.

---
