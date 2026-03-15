# DB Worker Node Owner-Aware Process Management Implementation Plan

Goal: Add owner-aware lock metadata and orphan-process recovery so CLI and Electron can safely share one graph daemon without cross-managing each other.

Architecture: Keep one `db-worker.lock` per graph directory, but extend lock schema with `owner-source` so lifecycle actions can enforce owner boundaries.
Architecture: Keep read and write traffic reusable across clients, while restricting `stop` and `restart` to the side that originally started the daemon.
Architecture: Add orphan-process detection for lock-missing cases so `logseq server restart` does not hang on timeout when a legacy process is still alive.

Tech Stack: ClojureScript, Node.js child process APIs, `promesa`, `logseq.cli.server`, `logseq.db-worker.daemon`, Electron main-process daemon manager, db-worker-node lock helpers.

Related: Builds on `docs/agent-guide/033-desktop-db-worker-node-backend.md`.
Related: Relates to `docs/agent-guide/030-logseq-cli-db-graph-default-dir-locking.md`.
Related: Relates to `docs/agent-guide/003-db-worker-node-cli-orchestration.md`.

## Problem statement

Current lock payload only records repo, pid, host, and port, so ownership is implicit and lifecycle commands cannot distinguish CLI-started and Electron-started daemons.

`stop-server!` and `restart-server!` can currently terminate any alive daemon if the lock exists, which violates the requirement that each client should manage only its own process.

If a db-worker-node process remains alive but lock file is missing, `server restart` can wait until timeout because startup relies on lock appearance and has no orphan recovery path.

When CLI starts a daemon first, Electron may treat the runtime as managed-by-self and attempt stop or restart logic, which can break graph open flow and produce user-facing errors.

## Testing Plan

I will follow `@test-driven-development` and add failing tests before each implementation change.

I will add lock schema and owner compatibility tests in `src/test/frontend/worker/db_worker_node_lock_test.cljs`.

I will add daemon-owner lifecycle and orphan-recovery tests in `src/test/logseq/cli/server_test.cljs` and `src/test/logseq/db_worker/daemon_test.cljs`.

I will add Electron manager tests for external-runtime attachment and no-cross-stop behavior in `src/test/electron/db_worker_manager_test.cljs`.

I will add db-worker-node argument and lock-write tests in `src/test/frontend/worker/db_worker_node_test.cljs`.

I will run focused red-green loops first, then run `bb dev:lint-and-test`, and finish with a review pass against `@prompts/review.md`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current behavior map

| Area | Current behavior | Target behavior |
|---|---|---|
| Lock metadata | No owner field in `db-worker.lock`. | Lock includes `owner-source` as `cli` or `electron`, plus versioned metadata. |
| Lifecycle authority | Any caller can stop or restart lock-owned daemon. | `stop` and `restart` are allowed only for matching owner-source. |
| Runtime reuse | Reuse happens, but manager cannot tell owned vs external runtime. | Reuse still happens, and runtime state tracks `owned?` to prevent cross-stop. |
| Lock missing + orphan process | Startup can timeout with no clear recovery path. | Orphan detection and cleanup path runs before or after failed startup wait. |
| Compatibility | Legacy lock without owner is ambiguous. | Legacy lock is treated as `owner-source: unknown` with explicit policy. |

## Integration sketch

```text
CLI or Electron request ensure-server(repo, requester-owner)
  -> read lock
  -> if lock exists and healthy:
       return runtime + ownership(owned/external)
  -> if lock missing:
       scan orphan db-worker-node process for same repo/data-dir
       if orphan found:
         terminate orphan
       spawn new daemon with --owner-source <cli|electron>
  -> db-worker-node writes lock {repo,pid,host,port,owner-source,lock-id,...}

stop/restart(requester-owner)
  -> read lock owner-source
  -> if owner-source matches requester-owner: allow
  -> else: deny with :server-owned-by-other
```

## Implementation plan

### Phase 1: Add failing tests for owner-aware lock schema and policies.

1. Add a failing test in `src/test/frontend/worker/db_worker_node_lock_test.cljs` that lock serialization includes `owner-source`.
2. Add a failing test in `src/test/frontend/worker/db_worker_node_lock_test.cljs` that missing owner metadata is normalized to `:unknown`.
3. Add a failing test in `src/test/frontend/worker/db_worker_node_test.cljs` that `--owner-source cli` is written into the lock.
4. Add a failing test in `src/test/frontend/worker/db_worker_node_test.cljs` that `--owner-source electron` is written into the lock.
5. Add a failing test in `src/test/logseq/cli/server_test.cljs` that `stop-server!` returns `:server-owned-by-other` on owner mismatch.
6. Add a failing test in `src/test/logseq/cli/server_test.cljs` that `restart-server!` does not SIGTERM external-owner daemon.
7. Add a failing test in `src/test/electron/db_worker_manager_test.cljs` that external runtime release does not call `stop-daemon!`.
8. Run `bb dev:test -v 'frontend.worker.db-worker-node-lock-test'` and confirm failures match new assertions.
9. Run `bb dev:test -v 'logseq.cli.server-test'` and confirm failures match new assertions.

### Phase 2: Extend lock schema and daemon startup arguments.

10. Update argument parsing in `src/main/frontend/worker/db_worker_node.cljs` to accept `--owner-source`.
11. Add owner-source validation in `src/main/frontend/worker/db_worker_node.cljs` with allowed values `cli`, `electron`, and fallback `unknown`.
12. Thread owner-source through `start-daemon!` in `src/main/frontend/worker/db_worker_node.cljs` into lock creation.
13. Update `create-lock!` in `src/main/frontend/worker/db_worker_node_lock.cljs` to persist `owner-source`.
14. Update `read-lock` normalization path in `src/main/frontend/worker/db_worker_node_lock.cljs` to inject `:owner-source :unknown` for legacy files.
15. Keep `update-lock!` in `src/main/frontend/worker/db_worker_node_lock.cljs` from mutating existing owner-source during port updates.
16. Add targeted tests for lock read-write roundtrip in `src/test/frontend/worker/db_worker_node_lock_test.cljs`.
17. Run `bb dev:test -v 'frontend.worker.db-worker-node-test'` and make sure lock owner assertions pass.

### Phase 3: Make CLI server orchestration owner-aware.

18. Add requester owner config to `ensure-server!` in `src/main/logseq/cli/server.cljs`.
19. Pass owner-source to daemon spawn args from `spawn-server!` in `src/main/logseq/db_worker/daemon.cljs`.
20. Update `ensure-server-started!` in `src/main/logseq/cli/server.cljs` to return ownership metadata for caller state tracking.
21. Update `stop-server!` in `src/main/logseq/cli/server.cljs` to deny stop when lock owner-source differs from requester owner.
22. Update `restart-server!` in `src/main/logseq/cli/server.cljs` to preserve the same owner check semantics as `stop-server!`.
23. Update `server-status` and `list-servers` in `src/main/logseq/cli/server.cljs` to include owner-source in output payload.
24. Update server command response formatting so `logseq server list` human output includes an `OWNER` column mapped from `owner-source` (and preserves owner metadata in structured output).
25. Add regression tests in `src/test/logseq/cli/server_test.cljs` for owner-aware start, stop, and restart.
26. Run `bb dev:test -v 'logseq.cli.server-test'` and verify no timeout-based flaky failure remains.

### Phase 4: Add orphan-process detection and recovery for lock-missing start.

27. Add process listing helper in `src/main/logseq/db_worker/daemon.cljs` that discovers db-worker-node processes by repo and data-dir arguments.
28. Add parser helpers in `src/main/logseq/db_worker/daemon.cljs` to read `repo`, `data-dir`, and `owner-source` from command args.
29. Add `cleanup-orphan-process!` in `src/main/logseq/db_worker/daemon.cljs` to SIGTERM matched orphan pids before new spawn.
30. Call orphan cleanup path in `ensure-server-started!` in `src/main/logseq/cli/server.cljs` when lock is missing before spawn.
31. Add timeout fallback in `ensure-server-started!` in `src/main/logseq/cli/server.cljs` to emit `:server-start-timeout-orphan` with discovered pids.
32. Add unit tests in `src/test/logseq/db_worker/daemon_test.cljs` for process-arg parsing and orphan match logic.
33. Add CLI regression test in `src/test/logseq/cli/server_test.cljs` for lock-missing orphan scenario to avoid raw timeout.
34. Run `bb dev:test -v 'logseq.db-worker.daemon-test'` and `bb dev:test -v 'logseq.cli.server-test'`.

### Phase 5: Make Electron manager attach external daemon without cross-management.

35. Pass requester owner as `electron` from `start-managed-daemon!` in `src/electron/electron/db_worker.cljs`.
36. Save ownership flag in manager runtime state in `src/electron/electron/db_worker.cljs`.
37. Update stop flow in `src/electron/electron/db_worker.cljs` so `stop-daemon!` runs only when `owned?` is true.
38. Update unhealthy-runtime branch in `src/electron/electron/db_worker.cljs` to avoid stopping external owner daemon and re-resolve runtime instead.
39. Add tests in `src/test/electron/db_worker_manager_test.cljs` for external runtime reuse plus no-stop-on-release.
40. Run `bb dev:test -v 'electron.db-worker-manager-test'` and confirm lifecycle behavior.

### Phase 6: Update docs and error surfaces.

41. Update CLI docs in `docs/cli/logseq-cli.md` to document owner-aware `server stop` and `server restart` behavior.
42. Update desktop lifecycle docs in `docs/developers/desktop-db-worker-node.md` to explain external runtime attachment semantics.
43. Add explicit error messages for `:server-owned-by-other` and `:server-start-timeout-orphan` in `src/main/logseq/cli/format.cljs`.
44. Add one integration note in `docs/agent-guide/033-desktop-db-worker-node-backend.md` linking to owner-aware behavior.

### Phase 7: Full verification and review gate.

45. Run `bb dev:test -v 'frontend.worker.db-worker-node-test'`.
46. Run `bb dev:test -v 'frontend.worker.db-worker-node-lock-test'`.
47. Run `bb dev:test -v 'logseq.db-worker.daemon-test'`.
48. Run `bb dev:test -v 'logseq.cli.server-test'`.
49. Run `bb dev:test -v 'electron.db-worker-manager-test'`.
50. Run `bb dev:lint-and-test` and confirm zero failures and zero errors.
51. Perform final review checklist pass against `@prompts/review.md`.

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Lock file missing but old CLI daemon still alive. | CLI restart detects orphan by repo and data-dir, cleans it, then starts cleanly. |
| Lock owner is `cli` and Electron calls ensure runtime. | Electron reuses runtime with `owned? false` and never stops it on window close. |
| Lock owner is `electron` and CLI calls `server stop`. | CLI returns `:server-owned-by-other` with owner metadata and no process kill. |
| Legacy lock file has no owner-source field. | System treats owner as `unknown` and allows CLI takeover with owner metadata rewrite. |
| Two owners race to start same graph. | First lock wins and second caller reuses healthy daemon without extra spawn. |
| Owner process crashes and lock remains stale. | Stale lock cleanup still works, and next owner can start daemon normally. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'frontend.worker.db-worker-node-lock-test'
bb dev:test -v 'frontend.worker.db-worker-node-test'
bb dev:test -v 'logseq.db-worker.daemon-test'
bb dev:test -v 'logseq.cli.server-test'
bb dev:test -v 'electron.db-worker-manager-test'
bb dev:lint-and-test
```

Each command should finish with `0 failures, 0 errors`.

The owner-mismatch tests should return `:server-owned-by-other` instead of timeout or forced stop behavior.

`logseq server list` human output should include an `OWNER` column.

The orphan-recovery tests should return deterministic cleanup behavior instead of waiting until generic timeout.

## Testing Details

The tests validate behavior by asserting lifecycle authority boundaries, successful runtime reuse across clients, and orphan recovery outcomes.

The tests avoid mock-only success criteria by asserting returned error codes and process-management side effects observable from public APIs.

The critical regressions are lock-missing orphan restart and CLI-first then Electron-open graph flow, and both are explicitly covered.

## Implementation Details

- Extend lock payload with `owner-source` and preserve it across lock updates.
- Pass `--owner-source` when spawning db-worker-node from both CLI and Electron pathways.
- Return ownership metadata from server orchestration so callers can track `owned?` state.
- Enforce owner check for stop and restart while keeping read and write invoke reuse unchanged.
- Add orphan process discovery by command args for lock-missing recovery.
- Scope orphan process discovery in v1 to macOS and Linux, and use a Windows-safe no-op fallback.
- Keep stale-lock cleanup logic and layer orphan recovery without changing healthy lock reuse flow.
- Add explicit CLI error codes for owner mismatch and orphan timeout contexts.
- Prevent Electron manager from stopping external-owner runtime on release or health fallback.
- Document operator-visible behavior changes in CLI and desktop developer docs.
- Execute full suite and `@prompts/review.md` checks before merge.

## Question

Decision: CLI is allowed to take over `owner-source: unknown` and rewrite ownership metadata in v1.

Decision: when lock file is missing, orphan cleanup terminates all matching repo and data-dir processes.

Decision: v1 scopes orphan process-scan support to macOS and Linux only, with a Windows-safe no-op fallback.

---
