# db-worker-node Server List Write Lock Implementation Plan

Goal: Make `db-worker-node` server-list reads and writes safe across multiple CLI and Electron processes without blocking readers.

Architecture: Keep `server-list` as the shared discovery file under the configured root-dir, and serialize every mutation with a sibling `server-list.lock` file.
Architecture: Reads remain lock-free and parse the latest complete `server-list` content, while writes acquire the lock, read the current file inside the critical section, write through a temporary file, and atomically rename it into place.

Tech Stack: ClojureScript, Node.js `fs` and `path`, Promesa, existing `logseq.db-worker.server-list`, existing `logseq.cli.server`, existing `frontend.worker.db-worker-node` lifecycle code.

Related: Builds on `docs/agent-guide/db-worker/001-db-worker-node-restart-on-version-mismatch.md`.
Related: Relates to `docs/agent-guide/db-worker/002-desktop-db-worker-request-cap-switch-graph.md`.
Related: Relates to `docs/cli/logseq-cli.md` server lifecycle documentation.

## Problem statement

The current `server-list` file is a root-dir level text file used to discover running `db-worker-node` servers.

The current file path is derived by `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` through `logseq.db-worker.server-list/path`, which returns `<root-dir>/server-list`.

Each line currently contains one `pid port` pair.

`logseq.db-worker.server-list/read-entries` currently checks existence, reads the whole file with `fs/readFileSync`, splits lines, parses valid `pid port` pairs, ignores invalid lines, and returns a vector.

`logseq.db-worker.server-list/append-entry!` currently creates the parent directory and calls `fs/appendFileSync` with one line.

`logseq.db-worker.server-list/remove-entry!` currently reads all entries, removes the matching `pid port`, and calls `rewrite-entries!`.

`logseq.db-worker.server-list/rewrite-entries!` currently creates the parent directory and overwrites the entire file with `fs/writeFileSync`.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` appends the current process entry after the HTTP server starts listening.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` removes the current process entry when the daemon runtime clears state during stop.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` discovers servers by reading `server-list`, checking process and `/healthz` state for each entry, then rewriting the list with retained entries.

The current read-modify-write cleanup path can lose data when another process appends or removes entries between the initial read and the later rewrite.

A concrete lost-update sequence is possible today.

1. Process A calls `discover-servers` and reads stale entry `S` from `server-list`.
2. Process B starts a new `db-worker-node` and appends live entry `B` to `server-list`.
3. Process A finishes stale-entry cleanup using its old snapshot and rewrites `server-list` without entry `B`.
4. Later discovery cannot see process B even though process B is alive.

The requested fix is to add a lock when writing `server-list`.

The requested lock file name is exactly `server-list.lock`.

The requested lock file is only used by write operations.

Read operations must not acquire, wait for, or delete `server-list.lock`.

## Testing Plan

I will use @Test-Driven Development (TDD) before changing implementation behavior.

I will add unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs` for lock path derivation and lock-free reads.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs` proving `read-entries` can read `server-list` while `server-list.lock` already exists.

I will add behavior tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs` for `append-entry!` and `remove-entry!` preserving unrelated entries through the new locked update path.

I will add a regression test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` that simulates stale cleanup racing with a concurrent append.

The CLI regression test should create an initial stale entry, make the stale check append a live entry before cleanup finishes, call `logseq.cli.server/list-servers`, and assert that the live entry remains in `server-list` after stale cleanup.

This test should fail on the current implementation because `discover-servers` rewrites from a stale snapshot.

I will add a regression test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` only if the public `append-entry!` or `remove-entry!` return contract changes.

The preferred implementation should keep those return contracts stable, so existing daemon registration tests should continue to cover daemon integration.

I will run the focused RED tests before implementation and confirm they fail because of missing write locking or stale-snapshot cleanup behavior.

I will run the same focused tests after implementation and confirm they pass.

I will run the existing daemon and CLI server-list tests to ensure the lifecycle still registers, unregisters, lists, and lazily cleans stale entries.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

| Concern | Current location | Current behavior | Risk |
|---------|------------------|------------------|------|
| Path derivation | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` | `path` returns `<root-dir>/server-list`. | No lock path exists. |
| Reads | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` | `read-entries` reads without locking and ignores invalid lines. | Existence check plus read has a small TOCTOU window. |
| Append | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` | `append-entry!` appends one line without coordination. | Append can race with a full rewrite. |
| Remove | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` | `remove-entry!` reads and rewrites without coordination. | Remove can overwrite a concurrent append. |
| Full cleanup rewrite | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | `discover-servers` rewrites retained entries after async checks. | Cleanup can overwrite changes made after the initial read. |
| Daemon publish | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | A started daemon calls `append-entry!`. | Publish can be lost by concurrent cleanup. |
| Daemon unpublish | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | A stopped daemon calls `remove-entry!`. | Unpublish can lose unrelated entries. |

## Target behavior

All writes to `<root-dir>/server-list` must be serialized by `<root-dir>/server-list.lock`.

The lock file basename must be exactly `server-list.lock`.

The lock file must live in the same directory as `server-list`.

Reads must remain lock-free.

Reads must not block when `server-list.lock` exists.

Reads must not remove stale `server-list.lock` files.

Writes must acquire `server-list.lock` before reading current entries for a mutation.

Writes must release `server-list.lock` in a `finally` path after the file mutation finishes or fails.

Writes must fail fast with a structured error after a bounded lock acquisition timeout.

Writes must not silently skip server-list publication or cleanup when lock acquisition fails.

Stale cleanup must remove only entries that the cleanup pass proved stale.

Stale cleanup must not rewrite the file from an old snapshot that can exclude newer entries.

Readers must only ever observe either the previous complete `server-list` file or the next complete `server-list` file.

The implementation must not add backward compatibility for old lock names or old `--server-list-file` arguments.

## Design

### 1. Add server-list lock path derivation

Add `logseq.db-worker.server-list/lock-path` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.

`lock-path` should accept the existing `server-list` file path and return `(node-path/join (node-path/dirname file-path) "server-list.lock")`.

`lock-path` should reject a missing or blank file path with a clear `js/Error` or `ex-info` error.

Do not derive the lock path as `server-list.cljs.lock`, `server-list.locked`, or `<server-list>.lock` if that can produce a basename other than `server-list.lock`.

### 2. Add a write-lock helper

Add a private helper such as `with-write-lock!` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.

The helper should create the parent directory before acquiring the lock.

The helper should acquire `server-list.lock` with exclusive file creation through Node `fs.openSync` using an exclusive mode such as `"wx"`.

The helper should write small metadata into the lock file after acquisition.

The metadata should include the owning process pid and a unique lock id.

The metadata makes stale-lock cleanup safer and prevents a releasing writer from deleting a lock owned by a later writer.

The helper should close the lock file descriptor after writing metadata.

The helper should run the supplied write operation only after acquiring the lock.

The helper should release the lock in `finally` by reading the lock metadata and unlinking only when the lock id still matches the current writer.

The helper should tolerate `ENOENT` while releasing because another process may have removed a stale lock after a crash.

The helper should treat `EEXIST` as normal contention while waiting for the lock.

The helper should retry acquisition on a short fixed interval until timeout.

Use a small poll interval such as `25` milliseconds.

Use a bounded timeout of `2000` milliseconds.

If timeout expires and the lock owner process is still alive or cannot be inspected, throw `ex-info` with `:code :server-list-lock-timeout` and include `:file-path`, `:lock-path`, and lock metadata when available.

If timeout sees a stale lock whose metadata pid is not alive, remove that stale lock and retry acquisition.

If the lock file exists but metadata cannot be parsed, treat it as active until timeout and then fail fast rather than guessing.

Do not use `js/Buffer` in this helper.

### 3. Make writes atomic

Add a private `write-entries-unlocked!` helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.

The helper should write the next payload to a unique temporary file in the same directory as `server-list`.

The helper should then call `fs/renameSync` from the temporary file to `server-list`.

The temporary file name should include `server-list`, the current pid, and a unique suffix.

The temporary file must not be named `server-list.lock`.

The helper should remove the temporary file in a best-effort `catch` path if writing or renaming fails.

Atomic rename keeps lock-free readers from observing a partially truncated `server-list` file.

### 4. Centralize mutations through an update helper

Add a public helper such as `update-entries!` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.

`update-entries!` should acquire `server-list.lock`.

`update-entries!` should call `read-entries` after the lock is acquired.

`update-entries!` should apply a pure transform to the current entries.

`update-entries!` should normalize the result before writing.

Normalization should keep only valid positive integer `:pid` and `:port` pairs.

Normalization should remove exact duplicate `pid port` entries while preserving first-seen order.

`update-entries!` should write with `write-entries-unlocked!`.

`update-entries!` should return the normalized entries that were written.

`append-entry!` should become a thin wrapper around `update-entries!`.

`append-entry!` should append the entry only when both `pid` and `port` are positive integers.

`append-entry!` should avoid adding a duplicate exact `pid port` entry.

`append-entry!` should keep returning the appended entry for valid input to preserve current callers.

`remove-entry!` should become a thin wrapper around `update-entries!`.

`remove-entry!` should remove only exact matches for the target `pid port` pair.

`remove-entry!` should preserve unrelated entries added by other writers.

`rewrite-entries!` should remain public only as a locked full replacement helper for compatibility with explicit full-replacement callers.

Production code must not use `rewrite-entries!` with a stale snapshot from before asynchronous work.

Prefer mutation-specific helpers such as `update-entries!` and `remove-entries!` for normal production server-list changes.

### 5. Replace stale cleanup rewrite in discovery

Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`.

In `logseq.cli.server/discover-servers`, keep the existing lock-free read for discovery input.

Keep health checks outside the write lock because health checks are asynchronous and can take up to the request timeout.

Compute the set of entries that should be removed because they are proven stale.

After checks finish, call a server-list helper such as `remove-entries!` or `update-entries!` to remove only that stale set from the current file under `server-list.lock`.

Do not rewrite `server-list` from `cleaned-entries` computed from the initial snapshot.

Do not hold `server-list.lock` while calling `pid-status` or `/healthz`.

Return discovered server payloads from the original discovery pass as today.

The purpose of the write lock is to protect file mutations, not to serialize discovery network work.

### 6. Keep daemon call sites simple

Keep `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` call sites using `server-list/append-entry!` on publish and `server-list/remove-entry!` on stop if the public signatures stay the same.

Do not add a separate lock concern in the daemon namespace.

The server-list namespace should own all lock-file details.

### 7. Improve lock-free reads without changing semantics

Update `read-entries` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` to avoid a separate `fs/existsSync` check before reading.

Read the file directly and catch only missing-file errors such as `ENOENT` to return `[]`.

Continue returning `[]` for blank or missing paths only if that is the existing accepted behavior.

Continue ignoring invalid lines unless implementation review decides to fail fast for corrupt server-list content.

Do not inspect `server-list.lock` from `read-entries`.

This removes one filesystem call from the common read path and avoids an existence-check TOCTOU race.

## Integration overview

```text
CLI or Electron process
  |
  | lock-free read
  v
<root-dir>/server-list
  |
  | parse pid port entries
  v
pid-status and /healthz checks
  |
  | write mutation only
  v
acquire <root-dir>/server-list.lock
  |
  | read current server-list inside lock
  | apply append/remove/prune transform
  | write temp file
  | rename temp file to server-list
  v
release <root-dir>/server-list.lock
```

## Affected files

| File | Planned change |
|------|----------------|
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs` | Add `lock-path`, write-lock helper, atomic write helper, update helper, locked append/remove/prune behavior, and optimized read behavior. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | Replace stale full rewrite in `discover-servers` with locked removal of only proven stale entries. |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | Prefer no code change, but verify existing publish and unpublish call sites use the updated locked helpers. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs` | Add focused server-list lock, read, append, remove, dedupe, and stale-lock tests. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` | Add a regression test for discovery cleanup preserving entries added during cleanup. |
| `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` | Keep existing daemon registration tests green, and add tests only if signatures or return contracts change. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Update only if user-facing server-list troubleshooting needs to mention `server-list.lock`. |

## Implementation tasks

### Phase 0: Preparation

1. Read `/Users/rcmerci/gh-repos/logseq/AGENTS.md`.
2. Check for directory-specific `AGENTS.md` files before editing each target file.
3. Load @Test-Driven Development (TDD) before implementation.
4. Re-read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.
5. Re-read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` around `discover-servers`.
6. Re-read `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` around server-list append and remove call sites.

### Phase 1: Write RED tests

1. Add `server-list-lock-path-derives-sibling-lock-file` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs`.
2. Assert `(server-list/lock-path "/tmp/logseq-root/server-list")` returns `/tmp/logseq-root/server-list.lock`.
3. Add `read-entries-ignores-server-list-lock` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs`.
4. Create both `server-list` and `server-list.lock` in a temporary root-dir.
5. Assert `server-list/read-entries` returns parsed entries without waiting for or deleting `server-list.lock`.
6. Add `append-entry-deduplicates-valid-entry-under-update` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs`.
7. Assert two identical appends leave one `pid port` line.
8. Add `remove-entry-preserves-unrelated-current-entry` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/server_list_test.cljs`.
9. Assert removing one entry does not remove another existing entry.
10. Add `list-servers-preserves-concurrent-server-list-writes` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs`.
11. In that test, write one stale entry to `server-list`.
12. In that test, redefine `daemon/pid-status` so checking the stale pid appends a second live entry to `server-list` before returning `:not-found`.
13. In that test, call `cli-server/list-servers`.
14. In that test, assert the final `server-list` still contains the second live entry.
15. Run the focused tests and confirm the new race regression test fails on current behavior.

Expected RED command examples:

```shell
bb dev:test -v logseq.db-worker.server-list-test/server-list-lock-path-derives-sibling-lock-file
bb dev:test -v logseq.db-worker.server-list-test/read-entries-ignores-server-list-lock
bb dev:test -v logseq.cli.server-test/list-servers-preserves-concurrent-server-list-writes
```

The first command should fail until `lock-path` exists.

The race regression command should fail until discovery cleanup stops rewriting stale snapshots.

### Phase 2: Implement locked server-list mutations

1. Add `lock-path` to `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/server_list.cljs`.
2. Add private constants for write-lock timeout and poll interval.
3. Set the write-lock timeout constant to `2000` milliseconds.
4. Set the write-lock poll interval constant to `25` milliseconds unless tests show this is too aggressive.
5. Add a private lock metadata writer.
6. Add a private lock metadata reader.
7. Add a private stale-lock predicate using current lock metadata and process status.
8. Use a local process-status helper rather than depending on `logseq.db-worker.daemon` if adding the dependency would create a cycle.
9. Add `acquire-write-lock!` with exclusive file creation.
10. Add `release-write-lock!` with lock-id verification.
11. Add `with-write-lock!` that wraps acquire, body execution, and release.
12. Add `read-entries-unlocked` only if it keeps the public `read-entries` simple and testable.
13. Update `read-entries` to read directly and catch missing-file errors.
14. Add `entry-key` or equivalent exact `pid port` identity helper.
15. Add `normalize-entries` to validate entries and remove exact duplicate `pid port` entries while preserving order.
16. Add `payload-for-entries` or equivalent formatting helper.
17. Add `write-entries-unlocked!` that writes through a temporary file and renames to `server-list`.
18. Add `update-entries!` that reads current entries inside the lock and writes normalized transformed entries.
19. Reimplement `append-entry!` through `update-entries!`.
20. Reimplement `remove-entry!` through `update-entries!`.
21. Keep `rewrite-entries!` public as a locked full-replacement helper.
22. Add `remove-entries!` or `prune-entries!` if this makes `discover-servers` clearer.
23. Keep public return values compatible for current daemon call sites unless a test proves a change is needed.

### Phase 3: Replace stale discovery cleanup

1. Update `logseq.cli.server/discover-servers` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`.
2. Keep `entries` as the discovery input read before health checks.
3. Keep the existing `p/all` health-check structure.
4. Compute `stale-entries` as entries whose result has `:retain? false`.
5. Call `server-list/remove-entries!` or `server-list/update-entries!` only when `stale-entries` is non-empty.
6. Remove the current `cleaned-entries` full rewrite based on the initial snapshot.
7. Preserve existing `retained-results` and returned `:server` values.
8. Verify `list-servers-lazily-cleans-stale-server-list-entries` still passes.
9. Verify `ensure-server-preserves-live-server-list-entry-after-transient-healthz-failure` still passes.

### Phase 4: Verify integration behavior

1. Run the new focused server-list tests.
2. Run the new focused CLI race regression test.
3. Run existing CLI server-list cleanup tests.
4. Run existing db-worker-node daemon registration tests.
5. Run the full lint and unit test suite when the focused tests are green.

Expected GREEN command examples:

```shell
bb dev:test -v logseq.db-worker.server-list-test
bb dev:test -v logseq.cli.server-test/list-servers-preserves-concurrent-server-list-writes
bb dev:test -v logseq.cli.server-test/list-servers-lazily-cleans-stale-server-list-entries
bb dev:test -v logseq.cli.server-test/ensure-server-preserves-live-server-list-entry-after-transient-healthz-failure
bb dev:test -v frontend.worker.db-worker-node-test/db-worker-node-start-daemon-registers-and-unregisters-derived-server-list-entry
bb dev:lint-and-test
```

Each focused command should pass without warnings.

`bb dev:lint-and-test` should pass before opening a PR.

## Edge cases

A reader may run while a writer holds `server-list.lock`.

The reader must ignore the lock and return entries from the current complete `server-list` file.

A reader may run while a writer is replacing `server-list` through atomic rename.

The reader should see either the old complete file or the new complete file.

A writer may crash after acquiring `server-list.lock`.

A later writer should remove the stale lock only when metadata proves the owner pid is gone.

A writer may see `server-list.lock` from a live process.

The writer should wait for the `2000` millisecond bounded timeout and then fail fast with `:server-list-lock-timeout`.

A process may not have permission to inspect the pid in the lock file.

Treat that lock as active until timeout rather than deleting it.

A lock file may contain malformed metadata.

Treat malformed metadata as active until timeout and then fail fast rather than deleting it speculatively.

Two processes may append the same `pid port` entry.

The normalized mutation path should avoid duplicate exact entries.

Discovery may prove entry `S` stale while another process appends entry `B`.

The cleanup mutation must remove only `S` from the current file and preserve `B`.

Discovery may fail `/healthz` transiently for a live process.

The current behavior retains entries after transient health failure, and the new implementation must preserve that behavior.

A daemon may stop and remove its entry while discovery is checking health.

The locked remove path should remove only the daemon entry and preserve unrelated entries.

The root-dir directory may not exist before the first write.

The write path should create the directory before lock acquisition.

The root-dir may be missing during read.

The read path should return an empty vector for a missing `server-list` file.

## Acceptance criteria

`server-list.lock` is the only lock filename used for `server-list` writes.

Every production mutation of `server-list` acquires `server-list.lock` first.

No production read of `server-list` acquires or waits for `server-list.lock`.

Write-lock acquisition times out after `2000` milliseconds with a structured `:server-list-lock-timeout` error.

Malformed `server-list.lock` metadata is not deleted speculatively and fails fast after the timeout.

`append-entry!` does not lose entries when another process is cleaning stale entries.

`remove-entry!` does not lose unrelated entries.

`discover-servers` no longer rewrites the list from a stale pre-health-check snapshot.

A stale cleanup pass preserves entries appended after the pass started.

Exact duplicate `pid port` entries are normalized away while preserving first-seen order.

`rewrite-entries!` remains public only as a locked full-replacement helper.

Readers never intentionally observe temporary files.

Focused tests for `logseq.db-worker.server-list-test` pass.

Focused tests for `logseq.cli.server-test` server-list discovery behavior pass.

Existing `frontend.worker.db-worker-node-test` daemon registration behavior passes.

`bb dev:lint-and-test` passes before PR submission.

## Testing Details

The server-list unit tests should verify externally visible file behavior rather than private helper details wherever possible.

The lock path test is acceptable because the requested lock filename is part of the behavior contract.

The lock-free read test should create `server-list.lock` and prove reads still return entries without deleting the lock.

The CLI race regression should test the actual `list-servers` or `discover-servers` behavior and prove a live entry appended during stale cleanup survives.

The daemon registration test should verify the existing start and stop behavior still publishes and unpublishes the current process entry through the updated helpers.

## Implementation Details

- Keep the lock implementation inside `logseq.db-worker.server-list` so callers cannot bypass it accidentally.
- Use `<root-dir>/server-list.lock` and no other lock filename.
- Use exclusive file creation to acquire the lock.
- Use a `2000` millisecond bounded wait and fail fast with structured error data when the lock cannot be acquired.
- Use lock metadata with pid and lock id to support safe release and stale cleanup.
- Treat malformed `server-list.lock` metadata as active until timeout and then fail fast.
- Keep reads lock-free and independent from `server-list.lock`.
- Read current entries inside the write lock before applying append, remove, or prune transforms.
- Normalize exact duplicate `pid port` entries while preserving first-seen order.
- Keep `rewrite-entries!` public only as a locked full-replacement helper.
- Replace full stale-snapshot rewrites in discovery with targeted stale-entry removal.
- Write through a temporary file and atomic rename so readers do not see partial writes.
- Preserve current public call-site simplicity in `frontend.worker.db-worker-node`.

## Question

No open questions remain for this plan.

The write-lock timeout is `2000` milliseconds.

Malformed `server-list.lock` metadata fails fast after the normal timeout and is not deleted speculatively.

`rewrite-entries!` remains public only as a locked full-replacement helper, while production code should prefer mutation-specific helpers.

Exact duplicate `pid port` entries are normalized away while preserving first-seen order.

---
