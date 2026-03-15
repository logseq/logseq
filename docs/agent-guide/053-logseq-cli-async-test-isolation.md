# Logseq CLI and db-worker-node Async Test Isolation Plan

Goal: Audit all CLI-related async test cases and ensure every mocked function, overridden global binding, and shared test state is reset after each test case so no test leaks state into later tests.

Architecture: Prefer per-test scoped mocking (`with-redefs` / `p/with-redefs`) and explicit `:each` fixtures for mutable globals, while keeping real process/server lifecycle cleanup in `p/finally` so async resources are always released.

Tech Stack: ClojureScript, `cljs.test`, `promesa`, Node.js-based test runtime.

Related: Builds on `docs/agent-guide/001-logseq-cli.md`, `docs/agent-guide/003-db-worker-node-cli-orchestration.md`, `docs/agent-guide/015-logseq-cli-db-worker-node-housekeeping.md`, and `docs/agent-guide/035-logseq-cli-db-worker-deps-cli-decoupling.md`.

## Problem statement

Current CLI-related async tests rely heavily on mutating namespace vars and process globals with `set!`, then restoring them manually in `p/finally` blocks.

That pattern works only if every async branch reaches cleanup. It is easy to miss one restore path, and a failed or aborted test can leave mutated globals behind for later tests.

The most leak-prone coverage today is concentrated in these files:

- `src/test/logseq/cli/command/sync_test.cljs` — many async tests mutate `cli-server/ensure-server!`, `transport/invoke`, and `cli-config/update-config!` with `set!`.
- `src/test/logseq/cli/commands_test.cljs` — many async command execution tests mutate `cli-server/*`, `transport/invoke`, and add-command resolver vars.
- `src/test/logseq/cli/server_test.cljs` — async tests mutate daemon fns plus process globals like `js/process.kill` and `child_process.spawn`.
- `src/test/logseq/cli/command/doctor_test.cljs` and `src/test/logseq/cli/command/graph_test.cljs` — smaller but repeated manual global override patterns.
- `src/test/logseq/cli/integration_test.cljs` — a mix of safe `p/with-redefs` usage and unsafe direct `set!` of `cli-server/ensure-server!`, `transport/invoke`, and `process.stderr.write` interception.
- `src/test/logseq/cli/transport_test.cljs` — mutates `url.parse` and depends on manual restoration around async flows.
- `src/test/frontend/worker/db_worker_node_test.cljs` — async tests mutate platform/db-core/db-lock vars and also interact with module-level `defonce` atoms such as `*sse-clients`, `*ready?`, `*lock-info`, and `*file-handler` in `src/main/frontend/worker/db_worker_node.cljs`.

The risk is not theoretical: these tests are asynchronous, share a single Node process, and run against real namespace vars or process objects. Any missing reset can change behavior of unrelated tests that run later in the same suite.

## Current leak vectors

### 1. Manual `set!` / restore in async tests

The dominant pattern is:

1. capture original var value,
2. `set!` the var to a mock,
3. run async code,
4. restore in `p/finally`.

This appears throughout `sync_test.cljs`, `commands_test.cljs`, `server_test.cljs`, `doctor_test.cljs`, `graph_test.cljs`, and parts of `integration_test.cljs`.

This pattern is brittle because cleanup is duplicated in every test and can drift over time.

### 2. Process-global overrides

Some tests override Node globals directly, for example:

- `child_process.spawn` in `src/test/logseq/cli/server_test.cljs`
- `js/process.kill` in `src/test/logseq/cli/server_test.cljs`
- `js/process.stderr.write` via `capture-stderr!` in `src/test/logseq/cli/integration_test.cljs`
- `url.parse` in `src/test/logseq/cli/transport_test.cljs`

These are more dangerous than namespace-local mocks because they affect any code running in the same process while the override is active.

### 3. Module-level mutable atoms in db-worker-node

`src/main/frontend/worker/db_worker_node.cljs` keeps daemon state in `defonce` atoms:

- `*ready?`
- `*sse-clients`
- `*lock-info`
- `*file-handler`

`db_worker_node_test.cljs` already has one `:each` fixture for print suppression, but the file still contains tests that interact with or depend on mutable daemon state. Some tests locally save and restore `*sse-clients`; others rely on daemon stop paths to reset internals.

This should be normalized into a single fixture-backed reset strategy so every test starts from a known baseline even if a previous test fails unexpectedly.

### 4. Mixed mocking styles across files

Some tests already use safer scoped mocking:

- `p/with-redefs` in `src/test/logseq/cli/integration_test.cljs`
- `with-redefs` in targeted synchronous tests

But many nearby tests still use raw `set!`. The inconsistency makes future maintenance error-prone and makes it harder to know which tests are safely isolated.

## Scope

This plan covers async tests for current `logseq-cli` and `db-worker-node` behavior.

In scope:

- `src/test/logseq/cli/*.cljs`
- `src/test/logseq/cli/command/*.cljs`
- `src/test/frontend/worker/db_worker_node_test.cljs`
- `src/test/frontend/worker/db_worker_node_lock_test.cljs` if follow-up cleanup is needed for consistency

Out of scope:

- Non-CLI frontend async tests unless a reusable helper extracted here is intentionally shared
- Refactoring production runtime logic unless needed only to expose test-reset hooks for daemon state
- Rewriting all sync tests that already use safe scoped mocks

## Desired end state

After this work:

- every async test that mocks a namespace var uses scoped mocking or a standardized helper that guarantees restoration;
- every process-global override has one canonical helper with guaranteed teardown;
- every db-worker-node mutable singleton used by tests is reset in an `:each` fixture;
- no CLI-related async test relies on state left behind by a previous test;
- the suite can run target namespaces together, repeatedly, and in different orders without order-dependent failures.

## Testing Plan

I will first lock in the current risk surface by inventorying every CLI-related async test that uses `set!`, process-global mutation, or mutable singleton state.

I will convert one representative file in each category to a safer reset pattern before touching the rest, so the approach is proven incrementally.

I will run targeted test namespaces repeatedly and in grouped combinations to detect order-dependent leakage.

NOTE: I will write or adjust tests/helpers before broad refactors where possible, and any unexpected async failure will be debugged before continuing wide mechanical conversion.

## Implementation plan

1. Create an audit checklist of all CLI-related async tests that currently use `set!`, process-global mutation, manual restore logic, or mutable singleton state.

2. Group those findings by leak type:
   - namespace-var overrides,
   - Node process/global overrides,
   - db-worker-node singleton atoms,
   - real server/daemon lifecycle cleanup.

3. Add a small shared test helper namespace for CLI async isolation, e.g. `src/test/logseq/cli/test_helper.cljs`, to centralize patterns that should no longer be repeated inline.

4. In that helper, add wrappers/macros/functions for scoped async mocking around Promesa flows so tests can replace repeated `orig-*` / `set!` / `p/finally restore` boilerplate.

5. Prefer `p/with-redefs` for namespace vars that are only needed during the async body, especially in:
   - `src/test/logseq/cli/command/sync_test.cljs`
   - `src/test/logseq/cli/commands_test.cljs`
   - `src/test/logseq/cli/command/doctor_test.cljs`
   - `src/test/logseq/cli/command/graph_test.cljs`
   - targeted sections of `src/test/logseq/cli/integration_test.cljs`

6. Convert low-risk files first (`graph_test.cljs`, `doctor_test.cljs`, `main_test.cljs` if needed) to establish the preferred style with minimal surface area.

7. Convert `src/test/logseq/cli/command/sync_test.cljs` from repeated manual `set!` restoration to scoped mocks. This file should become the reference pattern for async command tests.

8. Convert `src/test/logseq/cli/commands_test.cljs` in batches, prioritizing the async sections that currently mutate `cli-server/list-graphs`, `cli-server/ensure-server!`, `transport/invoke`, and add-command resolution vars.

9. For `src/test/logseq/cli/server_test.cljs`, separate two concerns:
   - keep real filesystem/server cleanup in `p/finally`,
   - move mock restoration for functions/globals into scoped helper wrappers wherever possible.

10. For process-global overrides that cannot use ordinary `with-redefs` (for example `child_process.spawn`, `js/process.kill`, `process.stderr.write`, `url.parse`), add dedicated helper functions that use `try`/`finally` or Promesa-aware wrappers so restoration is guaranteed from one place.

11. Refactor `src/test/logseq/cli/integration_test.cljs` to replace the remaining direct `set!` mocks with `p/with-redefs` where possible, since that file already demonstrates the safer pattern in other tests.

12. Add or reuse an `:each` fixture in `src/test/frontend/worker/db_worker_node_test.cljs` to reset db-worker-node mutable singleton atoms before and after every test:
    - `*ready?`
    - `*sse-clients`
    - `*lock-info`
    - `*file-handler`

13. Keep the existing quiet-print fixture in `db_worker_node_test.cljs`, but merge or compose it with the new daemon-state reset fixture so both print behavior and daemon singletons are normalized per test.

14. Review tests in `db_worker_node_test.cljs` that directly save/restore individual atoms (for example `*sse-clients`) and simplify them once the shared fixture guarantees a clean baseline.

15. If a daemon stop path is currently relied on for cleanup, keep asserting `stop!` behavior but do not rely on it as the only test isolation mechanism.

16. Add comments in the helper or fixture code documenting the rule: mock restoration belongs in scoped helpers/fixtures, while resource cleanup (servers, files, daemons) belongs in `p/finally`.

17. Update any contributor-facing guidance near the modified tests if a recurring pattern should be preserved, especially when replacing repetitive manual restore code with helper abstractions.

18. Run targeted namespaces individually after each batch of refactors:
    - `logseq.cli.command.graph-test`
    - `logseq.cli.command.doctor-test`
    - `logseq.cli.command.sync-test`
    - `logseq.cli.server-test`
    - `logseq.cli.transport-test`
    - `logseq.cli.commands-test`
    - `logseq.cli.integration-test`
    - `frontend.worker.db-worker-node-test`

19. Run grouped combinations of the above namespaces multiple times in the same process to catch order-dependent leaks.

20. Finish with `bb dev:lint-and-test` if the changed surface is stable enough and runtime permits.

## Verification strategy

Use three levels of verification.

### A. Static inventory verification

Re-scan CLI-related test files and confirm that leak-prone raw patterns are either gone or intentionally wrapped:

- direct `set!` to namespace vars in async tests should be eliminated or heavily reduced;
- any remaining direct process-global mutation must be routed through a dedicated helper with centralized restore logic;
- db-worker-node singleton atoms should be covered by fixtures rather than ad hoc local resets.

### B. Repetition and order verification

Run the target namespaces repeatedly and in different orders.

At minimum:

- run each namespace alone;
- run `sync-test`, `commands-test`, and `integration-test` together;
- run `server-test`, `transport-test`, and `db_worker_node_test` together;
- re-run the same grouped command at least twice to catch leaked state from the previous run.

### C. Behavioral smoke verification

Confirm that tests still validate real async behavior rather than only helper abstractions:

- server startup/shutdown tests still exercise real server lifecycle paths;
- integration tests still verify CLI flow outputs;
- db-worker-node tests still verify daemon and HTTP behavior;
- helper conversion does not weaken assertions or skip cleanup-sensitive paths.

## Proposed helper patterns

### Pattern 1: Scoped Promesa var redefs

For ordinary vars such as `cli-server/ensure-server!`, `transport/invoke`, `cli-config/update-config!`, and `db-lock/update-lock!`, prefer `p/with-redefs` around the async body.

This should replace bespoke `orig-*` capture and restoration in most test files.

### Pattern 2: Process-global guard helpers

For globals like `process.stderr.write`, `process.kill`, or JS module properties such as `child_process.spawn` and `url.parse`, create helper wrappers such as:

- `with-stderr-write-capture`
- `with-process-kill-mock`
- `with-child-process-spawn-mock`
- `with-js-property-override`

These helpers should always restore the original value in a single `finally` path.

### Pattern 3: db-worker-node state reset fixture

Create a fixture that snapshots and resets db-worker-node singleton atoms around each test. The fixture should not depend on individual tests remembering which atoms they touched.

If some atoms contain resources such as handlers or open references, the fixture should also null them out after test completion.

## Edge cases to validate during implementation

If an async test fails before reaching the happy path, mock restoration must still happen.

If a mocked function is rebound inside nested async calls, the outer helper should still restore the original after the Promise chain settles.

If real daemon startup fails, fixture teardown must not throw while resetting singleton atoms.

If `capture-stderr!` or similar helpers are used concurrently in the future, helper APIs should make nesting/ownership behavior explicit.

If a test still needs local save/restore of atom contents for assertion purposes, that local logic should compose safely with the global fixture baseline.

## Expected file touch points

Primary expected edits:

- `src/test/logseq/cli/command/graph_test.cljs`
- `src/test/logseq/cli/command/doctor_test.cljs`
- `src/test/logseq/cli/command/sync_test.cljs`
- `src/test/logseq/cli/commands_test.cljs`
- `src/test/logseq/cli/server_test.cljs`
- `src/test/logseq/cli/transport_test.cljs`
- `src/test/logseq/cli/integration_test.cljs`
- `src/test/frontend/worker/db_worker_node_test.cljs`
- `src/test/logseq/cli/test_helper.cljs` or similar new helper namespace

Possible follow-up edits:

- `src/test/frontend/worker/db_worker_node_lock_test.cljs` if helper reuse or fixture alignment is beneficial
- any nearby docs/comments that explain the approved async mocking pattern

## Non-goals

This plan does not require rewriting working synchronous tests just to match style.

This plan does not require changing production APIs unless a tiny testability hook is necessary for deterministic reset behavior.

This plan does not require introducing a new test framework; it should stay within current `cljs.test` and `promesa` patterns.

## Decision

Do not add a new lint rule or automated check for this work.

Enforce the no-leaky-mocks rule by convention, shared helpers, and fixtures only.

Adopt a two-layer strategy:

1. use scoped redefs/helpers for mocked functions and process globals;
2. use `:each` fixtures for mutable singleton state owned by `db-worker-node`.

This keeps the rollout focused on improving test isolation directly, avoids adding maintenance burden for a custom check, and still addresses both function mocking leaks and shared-state leaks.

---
