# Worker Platform Abstraction Cleanup Implementation Plan

Goal: Route shared db-worker sync code through `frontend.worker.platform` wrappers so browser and node runtimes both work without runtime-specific branches in shared modules.

Architecture: Keep runtime-specific APIs inside `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/browser.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs`.
Call platform capabilities from shared modules via `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform.cljs` using `platform/current` at the call site.
Preserve existing key names and payload shapes to avoid data migration.

Tech Stack: ClojureScript, promesa, cljs.test, clojure-lsp diagnostics, db-worker platform adapters.

Related: Relates to `docs/agent-guide/038-electron-db-worker-switch-graph.md` and `docs/agent-guide/db-sync/db-sync-guide.md`.

## Problem statement

`frontend.worker.platform` currently exposes public wrappers that clojure-lsp reports as unused.

The reported vars are `kv-get`, `kv-set!`, `read-text!`, `write-text!`, and `websocket-connect`.

Shared worker modules still contain runtime-specific calls that bypass those wrappers.

The bypasses are concentrated in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs`.

This creates duplicated runtime assumptions and weakens node and browser parity.

| Symptom | Current location | Impact |
|---|---|---|
| `clojure-lsp/unused-public-var` on `platform/kv-get` and `platform/kv-set!` | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform.cljs` | Signals shared code is not using the adapter path for kv persistence. |
| `clojure-lsp/unused-public-var` on `platform/read-text!` and `platform/write-text!` | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform.cljs` | Signals text file I/O in shared code can still hardcode a backend. |
| `clojure-lsp/unused-public-var` on `platform/websocket-connect` | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform.cljs` | Signals websocket creation in shared sync code may bypass node adapter (`ws`). |
| Direct `js/WebSocket.` in shared sync module | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` | Couples shared sync lifecycle to browser global API. |
| Direct `opfs/<read-text!` and `opfs/<write-text!` in shared crypt module | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` | Couples password persistence fallback to OPFS path. |
| Direct idb key-value calls in shared crypt module | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` | Bypasses node kv adapter path and keeps duplicate kv plumbing. |

```text
Current shared path.
db_core -> sync.cljs -> js/WebSocket.
db_core -> sync/crypt.cljs -> opfs/idb-keyval.

Target shared path.
db_core -> sync.cljs -> platform/websocket-connect.
db_core -> sync/crypt.cljs -> platform/read-text!/write-text!/kv-get/kv-set!.

Runtime adapter ownership.
browser adapter -> OPFS + IndexedDB + browser WebSocket.
node adapter -> fs + JSON kv file + ws package.
```

## Testing Plan

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` that asserts `#'db-sync/connect!` creates sockets through `platform/websocket-connect` and not direct globals.

I will write the test by stubbing `platform/current`, `platform/websocket-connect`, and `#'db-sync/attach-ws-handlers!` to verify the adapter call receives the tokenized URL.

I will add unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` that assert non-native password read and write paths call `platform/read-text!` and `platform/write-text!`.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` that asserts native write fallback uses `platform/write-text!` when main-thread persistence fails.

I will add unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` that assert encrypted AES key cache I/O flows through `platform/kv-get`, `platform/kv-set!`, and `platform/current`.

I will run each new test case first and confirm failure before implementation changes using `@test-driven-development`.

I will then run targeted suites and expect all tests to pass.

I will run `bb dev:test -v frontend.worker.db-sync-test` and expect `0 failures, 0 errors`.

I will run `bb dev:test -v frontend.worker.sync.crypt-test` and expect `0 failures, 0 errors` for the selected non-`:fix-me` cases.

I will run `bb dev:lint-and-test` and expect lint plus unit test completion without new warnings in touched namespaces.

I will verify clojure-lsp diagnostics no longer report `clojure-lsp/unused-public-var` for the five wrapper vars in `frontend.worker.platform`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Scope and non-goals

This plan changes shared worker modules that should remain runtime-agnostic.

This plan does not change browser or node adapter implementations except where signature alignment is required.

This plan does not redesign db-sync protocol or e2ee crypto flow.

This plan does not migrate persisted data keys.

This plan is intentionally limited to the exact five wrapper warnings first.

This plan includes migrating encrypted AES key cache access in `sync/crypt.cljs` to `platform/kv-get` and `platform/kv-set!` because it is in scope of those warnings.

This plan does not include unrelated broader idb migration outside these touched shared worker paths.

## Implementation steps

1. Add a failing websocket adapter test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` for `#'db-sync/connect!`.

2. Run `bb dev:test -v frontend.worker.db-sync-test` and confirm the new test fails because the code still uses direct `js/WebSocket.`.

3. Add `frontend.worker.platform` require alias in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs`.

4. Replace the socket constructor in `connect!` with `(platform/websocket-connect (platform/current) ...)`.

5. Run `bb dev:test -v frontend.worker.db-sync-test` and confirm the websocket adapter test passes.

6. Add a failing non-native read and write adapter test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs`.

7. Add a failing native fallback test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` that forces native save failure and expects `platform/write-text!`.

8. Add a failing kv adapter test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` for AES key cache persistence path.

9. Run `bb dev:test -v frontend.worker.sync.crypt-test` and confirm new tests fail before implementation.

10. Add `frontend.worker.platform` require alias in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs`.

11. Replace direct password file I/O calls with `platform/read-text!` and `platform/write-text!` against `(platform/current)`.

12. Replace direct encrypted AES cache idb calls with `platform/kv-get` and `platform/kv-set!` against `(platform/current)`.

13. Keep key format exactly as `rtc-encrypted-aes-key###<graph-id>` to preserve existing browser data compatibility.

14. Remove now-unused direct OPFS and idb-keyval requirements from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` if no longer referenced.

15. Re-run `bb dev:test -v frontend.worker.sync.crypt-test` and confirm all new tests pass.

16. Re-run `bb dev:test -v frontend.worker.db-sync-test` and confirm no regressions from sync namespace changes.

17. Run `bb dev:lint-and-test` and confirm there are no new lint or test regressions.

18. Verify editor or CI diagnostics no longer show the five `frontend.worker.platform` unused-public-var warnings.

19. If any wrapper remains unused, decide whether to add a real call site or convert that wrapper to private in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform.cljs`.

20. Document verification evidence and remaining caveats in the PR description.

## Edge cases and risk controls

Native worker password flow must keep current behavior that first attempts main-thread persistence and falls back on local storage write.

Node runtime may not expose browser globals, so all shared websocket construction must pass through the adapter.

Key-value persistence must keep existing key naming to avoid cache misses for already stored encrypted graph AES keys.

The adapter functions may return promises, so call sites must preserve existing `p/let` sequencing and error paths.

If `platform/current` is unset in tests, failures should be explicit and tests should set a minimal platform map.

## Clarified decisions before coding

Encrypted AES key cache in `sync/crypt.cljs` will migrate from direct idb store to platform kv now.

Removal of the five `unused-public-var` warnings is mandatory acceptance criteria.

Tests remain colocated in `db_sync_test.cljs` and `sync/crypt_test.cljs` instead of adding a dedicated platform test namespace.

## Verification commands

```bash
bb dev:test -v frontend.worker.db-sync-test
```

Expected output contains the new websocket adapter test name and ends with zero failures.

```bash
bb dev:test -v frontend.worker.sync.crypt-test
```

Expected output contains new adapter usage tests and ends with zero failures for executed tests.

```bash
bb dev:lint-and-test
```

Expected output finishes lint plus test pipeline without new errors in touched files.

## Skills to apply during implementation

Use `@test-driven-development` for all behavior changes.

Use `@clojure-debug` immediately when any new test fails unexpectedly.

Use `@clojure-paren-repair` if Clojure delimiter errors occur while editing touched namespaces.

## Testing Details

Tests focus on externally visible behavior of shared worker modules choosing runtime behavior through adapter calls.

The websocket test validates the constructor path and tokenized URL input instead of testing internal locals.

The crypt tests validate fallback and persistence behavior through adapter interaction and returned outcomes.

The kv cache tests validate read and write behavior by key and value flow rather than implementation-specific helpers.

## Implementation Details

- Touch `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` to route socket creation through `platform/websocket-connect`.
- Touch `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` to route text and kv persistence through platform wrappers.
- Touch `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` to add websocket adapter behavior tests.
- Touch `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` to add adapter-backed storage and kv behavior tests.
- Preserve existing e2ee key naming and payload shapes.
- Keep adapter interface unchanged unless tests prove a missing capability.
- Prefer removing obsolete direct dependencies once wrappers are adopted.
- Keep all new logic promise-safe with existing `promesa` flow.
- Validate clojure-lsp warning cleanup for all five wrapper vars.
- Keep PR scoped to abstraction usage cleanup and tests only.

## Question

Confirmed scope: limit this effort to the exact five wrapper warnings first.

Confirmed decision: migrate encrypted AES key cache usage in `sync/crypt.cljs` to platform kv in this pass.

Confirmed quality gate: the five `unused-public-var` warnings must be cleared.

Confirmed test placement: keep new tests in existing `db_sync_test.cljs` and `sync/crypt_test.cljs`.

---
