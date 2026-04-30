# 057: Make `logseq-cli sync download` stream realtime progress and support long-running downloads

## Summary

This document defines an execution-ready implementation plan for improving `logseq-cli sync download` for large graphs.

Today, the CLI waits for a single `/v1/invoke` response and uses a short default timeout. This creates two bad outcomes for large graph downloads:

1. the terminal is silent while the snapshot is downloading and importing, and
2. healthy long-running work may appear to fail because the CLI request timeout is too short.

The implementation should reuse the existing sync log/event infrastructure already used by the app, instead of creating a separate CLI-only progress system.

## Decision records (confirmed)

The following decisions are fixed for implementation:

1. `sync download` timeout strategy uses a command-level long-running policy (not a global timeout increase).
2. Progress logs are printed to `stdout`.
3. Add `--progress` option for `sync download`.
4. `--progress` defaults to `true` for human output.
5. For structured output modes (for example `json` / `edn`), progress is automatically disabled unless the user explicitly passes `--progress true`.
6. Download progress log emission should be unified into shared worker/sync code (no duplicate app-only emission path for the same milestones).

## Problem statement

`logseq-cli sync download` already uses the same db-worker-node and worker sync stack that powers app sync behavior, but it does not currently reuse the realtime event stream.

Relevant current-state facts:

- CLI sends a request to db-worker-node over `/v1/invoke` and waits for one final response.
- db-worker-node already exposes `/v1/events` as an SSE event stream.
- worker/app sync logic already emits `:rtc-log` events.
- app/desktop already displays those logs.
- CLI transport defaults to a `10000` ms timeout, which is not appropriate for a full graph snapshot download/import.

The implementation goal is therefore not to invent progress tracking from scratch. The goal is to make CLI consume and display the same progress events, and to change timeout behavior so long-running downloads can complete.

## Goals

- Show realtime progress during `logseq-cli sync download`.
- Reuse the existing `:rtc-log` event model and db-worker-node SSE stream.
- Unify download progress log emission into shared worker/sync code for the full download flow.
- Add `--progress` to `sync download` with default behavior enabled for human output.
- Print progress to `stdout`.
- Automatically disable progress for structured output modes unless `--progress true` is explicitly set.
- Prevent large graph downloads from failing under the generic short CLI timeout path.
- Preserve the final command result semantics and existing validation behavior.

## Non-goals

- Redesign the sync protocol.
- Replace the app RTC log UI.
- Introduce a polling-based progress API.
- Change the existing success/failure meaning of `sync download`.
- Add a CLI-only event schema that diverges from app behavior.

## Current implementation map

### CLI entrypoints

- `src/main/logseq/cli/command/sync.cljs`
  - defines `sync download`
  - resolves auth, starts db-worker-node, validates empty DB, invokes `:thread-api/db-sync-download-graph-by-id`
- `src/main/logseq/cli/transport.cljs`
  - sends HTTP requests to db-worker-node `/v1/invoke`
  - currently applies default timeout behavior
- `src/main/logseq/cli/format.cljs`
  - formats final CLI output
- `src/main/logseq/cli/config.cljs`
  - defines CLI defaults, including timeout
- `src/main/logseq/cli/command/core.cljs`
  - defines global CLI options including `--timeout-ms`

### db-worker-node / worker entrypoints

- `src/main/frontend/worker/db_worker_node.cljs`
  - serves `/v1/invoke`
  - serves `/v1/events` as SSE
- `src/main/frontend/worker/db_core.cljs`
  - handles `:thread-api/db-sync-download-graph-by-id`
  - already emits import/decrypt/save-stage logs
- `src/main/frontend/worker/sync.cljs`
  - performs remote snapshot download and sync data fetch
- `src/main/frontend/worker/sync/log_and_state.cljs`
  - publishes `:rtc-log` events to connected clients

### App-side log consumers and app-specific log emission

- `src/main/frontend/handler/db_based/sync.cljs`
  - currently emits useful early download messages such as:
    - `Preparing graph snapshot download`
    - `Start downloading graph snapshot, file size: ...`
    - `Graph snapshot downloaded`
- `src/main/frontend/handler/worker.cljs`
- `src/main/frontend/handler/events.cljs`
- `src/main/frontend/handler/db_based/rtc_flows.cljs`
- `src/main/frontend/components/rtc/indicator.cljs`

These app-side files are useful references because they show the desired end-user progress semantics. However, the actual shared event source should live in worker/shared sync code, not in app-only UI handlers.

## Design constraints

1. **One shared progress model**
   - CLI and app should consume the same logical progress events.
   - Avoid a separate CLI-only progress protocol.

2. **Invoke result remains authoritative**
   - Realtime logs improve visibility but must not replace final command success/failure semantics.

3. **Long-running timeout behavior must be command-aware**
   - `sync download` should not rely on the same timeout assumptions as short metadata requests.

4. **Output compatibility matters**
   - Streaming progress should not break final human or machine-readable command results.

## Proposed implementation

The implementation should be delivered in four phases.

---

## Phase 1: Make timeout handling explicit for long-running `sync download`

### Objective

Remove the dependency on the generic short CLI request timeout for the long-running download/import invoke path.

### Files

- `src/main/logseq/cli/command/sync.cljs`
- `src/main/logseq/cli/transport.cljs`
- `src/main/logseq/cli/config.cljs`
- `src/main/logseq/cli/command/core.cljs`

### Tasks

1. Trace exactly how `:timeout-ms` flows from CLI options/config into `transport/invoke` for `sync download`.
2. Introduce command-specific timeout behavior for `sync download`.
3. Keep the timeout policy explicit in code, rather than relying on an accidental global default.
4. Preserve existing timeout behavior for short non-download CLI commands unless intentionally changed.

### Recommended implementation direction

Prefer a command-specific long-task timeout path over raising the global default for all CLI traffic.

Good options include:

- passing a much larger timeout only for the final `db-sync-download-graph-by-id` invoke, or
- introducing a dedicated long-running request helper for commands that are expected to take a long time.

Do **not** solve this by silently changing all CLI requests to use a large default timeout.

### Acceptance criteria

- `sync download` no longer depends on the generic `10000` ms timeout for the full download/import request.
- Other CLI requests keep their current short-request behavior unless explicitly updated.
- The effective timeout policy is easy to understand from the command implementation.

### Verification

- Unit test or integration test proving that `sync download` can run longer than the old short timeout path.
- Regression test showing short requests are unchanged.

---

## Phase 2: Unify all download-progress logs into shared worker/sync code

### Objective

Ensure the full download flow emits shared progress events from the same worker/sync path used by both app and CLI.

### Files

- `src/main/frontend/worker/sync.cljs`
- `src/main/frontend/worker/db_core.cljs`
- `src/main/frontend/worker/sync/log_and_state.cljs`
- `src/main/frontend/handler/db_based/sync.cljs`

### Tasks

1. Inventory all download-progress log emissions related to `sync download` across app handlers and worker code.
2. Move or extract all shared milestones into worker/shared sync code where the remote snapshot and import/decrypt flow actually executes.
3. Reuse the existing `:rtc.log/download` event family and existing `sub-type` semantics wherever possible.
4. Remove duplicate app-only emission for shared milestones, and keep app handlers as consumers of shared events.
5. Keep milestone wording stable enough to avoid unnecessary UI regression in existing app consumers.

### Required shared milestones

The worker/shared path should emit at least these human-meaningful milestones:

- preparing snapshot download,
- snapshot download started, including file size when available,
- snapshot download completed,
- saving/import/decrypt progress,
- graph ready / download complete.

The final wording may differ, but the milestones must cover both:

- network download progress stages, and
- local import/decrypt stages.

### Acceptance criteria

- Shared download milestones are emitted from worker/sync code across the full flow (download + import/decrypt).
- There is no competing app-only emission path for the same shared milestones.
- CLI-triggered `db-sync-download-graph-by-id` produces the same family of download progress events as app-triggered flows.
- Existing app consumers can still display download progress using the shared event source.

### Verification

- Worker-level or sync-level tests for emitted `:rtc-log` events.
- Manual verification in app that download progress still appears after the refactor.

---

## Phase 3: Add CLI support for db-worker-node SSE event consumption

### Objective

Allow the CLI to subscribe to `/v1/events` while a long-running invoke is in progress.

### Files

- `src/main/logseq/cli/transport.cljs`
- `src/main/logseq/cli/command/sync.cljs`
- optionally a new helper namespace under `src/main/logseq/cli/` if event-stream logic should be isolated
- reference implementation:
  - `src/main/frontend/persist_db/remote.cljs`
  - `src/main/frontend/persist_db/node.cljs`

### Tasks

1. Add a lightweight CLI-side SSE client for db-worker-node `/v1/events`.
2. Decode incoming event payloads into the same shape consumed elsewhere in the codebase.
3. Support subscription lifecycle management:
   - connect before starting the long-running invoke,
   - receive events during the invoke,
   - close cleanly on success, error, timeout, or interruption.
4. Keep the event client generic enough that future CLI commands could reuse it if needed.

### Important behavior

- The SSE stream is for observability, not command truth.
- If SSE disconnects, the invoke result still determines command success/failure.
- If the invoke finishes successfully, the CLI must stop listening and finalize normally.

### Acceptance criteria

- CLI can consume db-worker-node `/v1/events` while a command is in flight.
- Incoming `:rtc-log` events are decoded correctly.
- Subscription cleanup is reliable across success and failure paths.

### Verification

- Tests for event decode behavior.
- Tests or integration coverage for stream setup/cleanup.
- Manual verification against a running db-worker-node.

---

## Phase 4: Render download progress in `sync download` without breaking final output

### Objective

Display realtime download/import progress in the terminal while preserving final result compatibility.

### Files

- `src/main/logseq/cli/command/sync.cljs`
- `src/main/logseq/cli/format.cljs`
- any new CLI event/render helper added in Phase 3
- `docs/cli/logseq-cli.md`

### Tasks

1. Add `--progress` option to `sync download` command handling.
2. Define default behavior: progress enabled for human-oriented output mode.
3. Define structured-output behavior: progress automatically disabled for structured modes unless explicitly overridden by `--progress true`.
4. Subscribe to the worker event stream before invoking `db-sync-download-graph-by-id` when progress is enabled.
5. Filter only the relevant download log events for the active graph.
6. Render progress messages in chronological order to `stdout`.
7. Preserve the final success/failure output contract.
8. Document the new behavior in CLI docs, including mode-dependent defaults and override rules.

### Output policy

The implementation must make a clear separation between:

- streaming progress lines, and
- the final command result.

Confirmed direction:

- stream progress to `stdout` when progress is enabled,
- add `--progress` option for `sync download`,
- default `--progress` to `true` for human-oriented output,
- automatically disable progress for structured output modes unless the user explicitly passes `--progress true`,
- keep the final result formatter responsible for terminal success/failure summary semantics.

### Filtering policy

The command should filter progress events using enough context to avoid printing unrelated logs.

At minimum, filtering should consider the active graph identity. If a more precise operation-level filter is available without major complexity, prefer it.

### Acceptance criteria

- Running `logseq-cli sync download` with human-oriented output prints realtime progress lines to `stdout` during download/import.
- `--progress false` suppresses progress streaming.
- Structured output modes auto-disable progress unless `--progress true` is explicitly provided.
- Final command output still reflects the authoritative invoke result.
- Structured output parsing is not broken under the default mode-dependent progress behavior.

### Verification

- Integration test or high-confidence manual test showing visible staged output.
- Verification that final success output still matches expected formatter behavior.
- Verification that failure cases still return the correct final error.

---

## Concrete execution order

Implement in this order:

1. **Phase 1 first** so large downloads no longer die under the short timeout path.
2. **Phase 2 second** so the CLI has a complete shared event source to consume.
3. **Phase 3 third** to add CLI event subscription infrastructure.
4. **Phase 4 last** to wire the streaming logs into `sync download` and finalize output behavior.

Do not start Phase 4 before Phase 2 is complete, or the CLI will only show partial progress from the existing worker import stage.

## Testing plan

### Unit / focused tests

Add or update tests in the most appropriate existing test namespaces for:

- CLI timeout behavior for `sync download`
- event decoding / event subscription lifecycle
- worker/shared sync download log emission
- filtering and rendering of relevant `:rtc-log` events

Likely test locations:

- `src/test/logseq/cli/command/sync_test.cljs`
- `src/test/logseq/cli/integration_test.cljs`
- `src/test/frontend/worker/db_worker_node_test.cljs`
- `src/test/frontend/worker/db_sync_test.cljs`
- `src/test/frontend/handler/db_based/sync_test.cljs`

The exact namespace choices may differ depending on existing test structure, but the coverage categories above are required.

### Manual verification checklist

1. Start a `sync download` against a graph large enough to produce visible staged progress.
2. Confirm the terminal shows early snapshot-download messages.
3. Confirm the terminal shows import/decrypt/save progress.
4. Confirm progress lines are emitted to `stdout` in human-oriented mode.
5. Confirm `--progress false` suppresses streaming progress output.
6. Confirm structured output mode auto-disables progress by default.
7. Confirm structured output mode prints progress only when explicitly using `--progress true`.
8. Confirm successful completion still depends on the invoke result.
9. Confirm a slow download no longer fails under the old short timeout path.
10. Confirm existing app download progress still works after shared-log refactoring.
11. Confirm non-empty DB validation and other preflight failures remain unchanged.

## Risks and open questions

### Risk 1: app and CLI may need slightly different rendering

The event source should be shared, but rendering may differ by client.

Mitigation:

- share event emission, not presentation details.
- keep worker messages human-readable enough for both app and CLI.

### Risk 2: progress events may not uniquely identify one operation

If multiple operations or graphs are active, CLI could print unrelated logs.

Mitigation:

- filter by graph identity at minimum,
- add more precise filtering only if needed and justified by actual ambiguity.

### Risk 3: output-mode compatibility

Streaming logs can interfere with structured output modes.

Mitigation:

- enforce mode-dependent default behavior (`progress` auto-off for structured output unless explicitly enabled),
- verify human and machine-readable modes explicitly.

### Resolved decision: timeout strategy

`sync download` uses command-level long-running timeout handling instead of a global timeout increase.

### Open question 1

Should the CLI event-stream helper remain local to `sync download`, or be introduced as a reusable CLI transport helper?

Recommendation:

- prefer a small reusable helper if the abstraction stays simple.

## Out-of-scope follow-ups

The following can be considered later and are **not required** for this plan:

- byte-level progress bars,
- richer TUI formatting,
- resumable download semantics,
- generalized event streaming for all CLI commands.

## Definition of done

This work is complete when all of the following are true:

- `logseq-cli sync download` displays realtime progress while a large graph is downloading/importing.
- The progress messages come from the shared worker/app event model, not a CLI-only ad hoc implementation.
- Download-progress milestones are unified in shared worker/sync code across the full flow.
- `sync download` supports `--progress`, with mode-dependent default behavior as documented.
- In structured output modes, progress is auto-disabled unless explicitly enabled.
- Large downloads are no longer constrained by the old generic short timeout path.
- Final command success/failure semantics remain intact.
- Relevant automated tests and CLI docs are updated.

## Recommendation

Execute this as a shared-event refactor plus a command-specific long-request timeout change.

The key architecture decision is to make worker/shared sync code the source of truth for download progress, then let the CLI subscribe to db-worker-node events just like the app already does. This maximizes reuse, keeps progress semantics aligned across clients, and solves the two real UX issues together: silent long-running work and premature short-timeout failures.