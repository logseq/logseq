# db-worker-node and logseq-cli Orchestration Plan

Goal: Based on the current `logseq-cli` and `db-worker-node` implementations, refactor db-worker-node to be repo-bound with locking, make logseq-cli fully manage db-worker-node lifecycle, and add server subcommands for management.

## Background and Current State (from existing code)

- `db-worker-node` currently accepts `--repo` but it is optional; it can open/switch graphs via `thread-api/create-or-open-db` at runtime. Entrypoint: `src/main/frontend/worker/db_worker_node.cljs`.
- `logseq-cli` connects to an existing db-worker-node on localhost using the port recorded in the lock file; it does not start/stop the server. Entrypoint: `src/main/logseq/cli/main.cljs`, `src/main/logseq/cli/commands.cljs`, `src/main/logseq/cli/transport.cljs`.
- Tests explicitly start db-worker-node (`src/test/logseq/cli/integration_test.cljs`, `src/test/frontend/worker/db_worker_node_test.cljs`).

## Requirements

1. Refactor `db-worker-node`: startup must require `--repo`; on startup it must open or create that graph; it must not switch graphs at runtime; it must create a lock file so a graph can be served by only one db-worker-node instance; it only needs to bind to localhost.
2. In `logseq-cli`, all commands requiring `--repo` or any graph operations must connect to or create the corresponding db-worker-node server.
3. db-worker-node server must not be started manually; logseq-cli is fully responsible.
4. Add `server` subcommand(s) to logseq-cli for managing db-worker-node servers.

## Scope / Non-goals

- In scope: db-worker-node startup and lifecycle, repo binding enforcement, lock files, CLI server orchestration, management commands, tests/docs.
- Out of scope: changing db-worker core query/write protocol; changing db-worker-node HTTP API semantics beyond repo binding constraints.

## Proposed Design

- **Repo-bound server**: db-worker-node opens a single repo at startup and refuses repo changes for the lifetime of the process. It only listens on localhost.
- **Lock file**: each repo directory has a lock file to ensure one server per graph. Lock contains metadata for status/cleanup; db-worker-node handles it by default, and logseq-cli handles cases db-worker-node cannot.
- **CLI orchestration**: logseq-cli discovers/starts/reuses db-worker-node servers per repo. It is the only entrypoint for starting servers.
- **Server subcommands**: add `server list|status|start|stop|restart` (or similar) to manage servers explicitly.

## Detailed Design

### 1) db-worker-node: required repo, repo binding, lock file

Files:
- `src/main/frontend/worker/db_worker_node.cljs`
- `src/main/frontend/worker/platform/node.cljs` (for data-dir / repo dir resolution)
- Optional new helper: `src/main/frontend/worker/db_worker_node_lock.cljs`

Key changes:
- **Argument parsing**: `--repo` becomes required. If missing, print help and exit non-zero. Host binding is restricted to localhost (e.g., `127.0.0.1`) regardless of input.
- **Startup flow**: replace `<maybe-open-repo!` with a required `create-or-open-db` for the repo; store `bound-repo`.
- **Reject switching**:
  - In `/v1/invoke`, for repo-scoped thread APIs, validate `args[0]` matches `bound-repo`.
  - Reject `thread-api/create-or-open-db`, `thread-api/unsafe-unlink-db`, etc. when repo differs.
  - Return 409/400 with `:repo-mismatch` error shape.
- **Lock file**:
  - Location: inside repo dir (e.g. `~/.logseq/cli-graphs/<graph>/db-worker.lock`).
  - Content: JSON `{repo, pid, host, port, startedAt}`.
  - Creation: exclusive create (`fs.open` with `wx`) or atomic temp + rename. If exists, fail with “graph already locked”.
  - Cleanup: delete lock file on stop (`stop!`) and on SIGINT/SIGTERM.
  - Stale lock: if lock exists but pid is dead, allow replacement (db-worker-node first; CLI can repair when server cannot).

### 2) logseq-cli: auto start/reuse db-worker-node per repo

Files:
- `src/main/logseq/cli/commands.cljs`
- `src/main/logseq/cli/main.cljs`
- `src/main/logseq/cli/config.cljs`
- New: `src/main/logseq/cli/server.cljs` (process management + lock handling)

Key changes:
- **Repo resolution**: for all graph/content commands, require `--repo` or resolved repo from config; otherwise error.
- **Ensure server** (new helper `ensure-server!`):
  1. Derive data-dir, repo dir, and lock file path from repo.
  2. If lock file exists, read port/pid; probe `/healthz` + `/readyz`.
  3. If healthy, reuse existing server; build the connection URL from localhost and the lock file port.
  4. If unhealthy or stale, attempt to spawn a new server; if db-worker-node cannot handle the lock situation, CLI repairs the lock then retries.
  5. Spawn via `child_process.spawn`: `node ./static/db-worker-node.js --repo <repo> --data-dir <...>`.
  6. Resolve actual port from the lock file written by db-worker-node.
- **Connection URL**: derived from the repo lock file; host is always localhost and the port is always discovered from the lock file.

### 3) CLI `server` subcommands

Suggested command group:
- `server list`: list servers from lock files (repo, pid, port, status).
- `server start --repo <name>`: start server for repo.
- `server stop --repo <name>`: stop server (SIGTERM or `/v1/shutdown`).
- `server restart --repo <name>`: stop + start.

Implementation notes:
- `start|stop|restart` require `--repo`.
- `list` scans data-dir for repo directories, reads lock files, and verifies status.
- Consider adding `/v1/shutdown` in db-worker-node for graceful stop.

## Compatibility / Migration

- No need to preserve compatibility for existing env vars, config keys, or flags related to db-worker-node or CLI server connectivity; remove them if they are no longer needed.

## Test Plan

- **Unit tests**:
  - CLI: repo resolution, server orchestration logic, lock parsing, error codes (`src/test/logseq/cli/*`).
  - db-worker-node: repo required, repo mismatch rejection, lock file create/cleanup (`src/test/frontend/worker/db_worker_node_test.cljs`).
- **Integration tests**:
  - CLI runs graph/content commands without manual server startup (`src/test/logseq/cli/integration_test.cljs`).
  - Concurrent startup of same repo must fail due to lock.

## Milestones

1. **db-worker-node binding & lock file**: repo required + repo enforcement + lock creation/cleanup.
2. **CLI server module**: `ensure-server!` with lock/health checks and spawning.
3. **CLI command updates**: graph/content commands require repo and auto-start server; add `server` subcommands.
4. **Tests + docs**: update/extend tests and adjust CLI docs (`docs/cli/logseq-cli.md`).

## Open Questions

1. Should `graph list` require `--repo`? If not, define a “global” server or out-of-band access to data-dir.
   - Answer: No --repo needed, using 'out-of-band access to data-dir' way
2. Lock file format and location: confirm cross-platform expectations (Windows paths/permissions).
   - lockfile name:`db-worker.lock`,
   - Location: inside repo dir (e.g. `~/.logseq/cli-graphs/<graph>/db-worker.lock`).
   - only consider linux/macos for now
3. Who owns lock cleanup and stale lock handling: primarily db-worker-node; CLI only steps in for cases db-worker-node cannot handle.
4. Add `/v1/shutdown` for graceful stop vs. SIGTERM from CLI?
5. db-worker-node servers should keep running unless `logseq-cli server stop` is invoked or the process exits unexpectedly; in the latter case, CLI should handle lockfile cleanup on restart.
