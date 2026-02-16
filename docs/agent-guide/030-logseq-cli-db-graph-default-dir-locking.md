# Logseq CLI DB Graph Default Dir And Write Exclusion Implementation Plan

Goal: Move the default CLI data directory to `~/logseq/graphs`, store graph directories without requiring the `logseq_db_` prefix, and enforce single-writer behavior for graph files while one db-worker-node instance owns a graph.

Architecture: Keep `logseq_db_` as the internal repo identifier used by thread-api calls, but introduce a canonical graph directory key that strips the db prefix for filesystem paths.
Architecture: Centralize graph directory resolution and lock ownership checks so `logseq.cli.server`, `frontend.worker.db-worker-node-lock`, and `frontend.worker.platform.node` enforce the same rules.

Tech Stack: ClojureScript, Node.js `fs` and `path`, promesa, logseq-cli command pipeline, db-worker-node daemon, existing lock file protocol.

Related: Builds on `docs/agent-guide/019-logseq-cli-data-dir-permissions.md`.
Related: Supersedes `docs/agent-guide/020-logseq-cli-default-paths-move.md`.
Related: Relates to `docs/agent-guide/012-logseq-cli-graph-storage.md`.

## Problem statement

The current CLI default data directory is `~/logseq/cli-graphs`, while this change requires `~/logseq/graphs`.

The current filesystem directory naming for a graph is based on repo identifiers that frequently include `logseq_db_`, so users still observe prefixed names in the data directory.

The current lock model prevents launching a second db-worker-node for one repo, but it does not define an explicit write-lease boundary that all graph file mutations must validate before writing.

We need one coherent model where graph directories are user-facing names, internal repo identifiers stay db-prefixed for thread-api compatibility, and graph writes are denied for non-owners while a server is running.

This plan does not include compatibility logic, migration, or special handling for old on-disk graph directories that start with `logseq_db_`.

This plan treats old on-disk `logseq_db_` prefixed graph directories as ignored entries.

## Testing Plan

I will follow `@test-driven-development` and add all failing tests before implementation edits.

I will add unit tests for default path resolution and help text defaults in CLI and db-worker-node code paths.

I will add unit tests for graph directory canonicalization that prove `logseq_db_demo` resolves to the same on-disk directory as `demo` in the default data directory.

I will not add migration tests for old prefixed directories because compatibility and migration are out of scope for this change.

I will add db-worker-node tests that validate write-lease ownership checks fail for non-owner lock metadata and pass for the active owner.

I will run targeted test namespaces first for fast red and green loops, then run the full lint and test suite.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current behavior map

| Area | Current implementation | Required change |
|---|---|---|
| Default data dir | `~/logseq/cli-graphs` in CLI and db-worker-node defaults. | `~/logseq/graphs` in all default derivation and help output locations. |
| Graph dir naming | Graph directory derivation commonly receives repo values that include `logseq_db_`. | Graph directory derivation must use canonical graph names without requiring `logseq_db_`. |
| Graph type assumption | DB graph identity is inferred from repo prefix in several paths. | In default data dir, treat every graph directory as a db graph and map to internal repo with prefix only at invocation boundaries. |
| Write exclusivity | `db-worker.lock` blocks duplicate daemon start, but write ownership is not verified by all mutation paths. | Introduce write-lease ownership checks for all graph file mutation operations executed by db-worker-node. |

## Integration sketch

```text
CLI --repo demo
  -> command-core resolves internal repo: logseq_db_demo
  -> graph-dir resolver maps repo to graph key: demo
  -> fs paths use ~/logseq/graphs/demo
  -> thread-api calls still use logseq_db_demo

db-worker-node owner lease
  -> creates db-worker.lock with pid + lock-id
  -> mutation path checks lock-id + pid ownership
  -> non-owner mutation attempt returns :repo-locked
```

## Implementation plan

### Phase 1: Add failing tests for path defaults and naming.

1. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/config_test.cljs` that `resolve-config` defaults `:data-dir` to `~/logseq/graphs`.
2. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/data_dir_test.cljs` that `normalize-data-dir` resolves to `$HOME/logseq/graphs`.
3. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that `show-help!` prints `default ~/logseq/graphs` for `--data-dir`.
4. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that global help includes `Path to db-worker data dir (default ~/logseq/graphs)`.
5. Run `bb dev:test -v 'logseq.cli.config-test'` and confirm the new default path assertion fails.
6. Run `bb dev:test -v 'logseq.cli.data-dir-test'` and confirm the new default path assertion fails.

### Phase 2: Add failing tests for prefix-free graph directory semantics.

7. Add a new test namespace `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_lock_test.cljs` that asserts repo `logseq_db_demo` resolves to graph directory key `demo` under default data dir.
8. Add a second test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_lock_test.cljs` that repo `demo` also resolves to graph directory key `demo`.
9. Add a test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_lock_test.cljs` that verifies no migration helper is invoked for legacy prefixed on-disk graph directories.
10. Add a test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_lock_test.cljs` that canonical directory resolution only targets `<graph>` naming in the default data dir.
11. Add a failing CLI server test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` that `lock-path` for repo `logseq_db_demo` points to `<data-dir>/demo/db-worker.lock`.
12. Run `bb dev:test -v 'frontend.worker.db-worker-node-lock-test'` and confirm failures for unimplemented canonicalization and non-migration logic.
13. Run `bb dev:test -v 'logseq.cli.server-test'` and confirm lock-path behavior fails before implementation.

### Phase 3: Add failing tests for write-lease ownership.

14. Add a test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that simulates lock metadata mismatch and expects write mutation to fail with `:repo-locked`.
15. Add a test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that verifies owner write mutation succeeds when lock metadata matches current owner.
16. Add a test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that stale lock ownership is rejected after lock replacement.
17. Run `bb dev:test -v 'frontend.worker.db-worker-node-test'` and confirm the write-lease tests fail before implementation.

### Phase 4: Implement default directory switch to `~/logseq/graphs`.

18. Update default path constants in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/data_dir.cljs` from `~/logseq/cli-graphs` to `~/logseq/graphs`.
19. Update CLI config defaults in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/config.cljs` so `:data-dir` defaults to `~/logseq/graphs`.
20. Update server fallback in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` so `resolve-data-dir` defaults to `~/logseq/graphs`.
21. Update db-worker-node default path in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node_lock.cljs` so `resolve-data-dir` defaults to `~/logseq/graphs`.
22. Update node platform fallback in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` so `node-platform` defaults to `~/logseq/graphs`.
23. Update CLI help text in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` to show `~/logseq/graphs`.
24. Re-run `bb dev:test -v 'logseq.cli.config-test'` and `bb dev:test -v 'logseq.cli.data-dir-test'` and confirm green results.

### Phase 5: Implement canonical graph directory resolution without required `logseq_db_` prefix.

25. Add shared graph directory canonicalization helpers in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node_lock.cljs` to map internal repo names to canonical graph directory keys.
26. Ensure canonicalization strips `logseq_db_` only when the repo is a db repo and preserves encoded filename safety through existing `encode-graph-dir-name` helpers.
27. Explicitly avoid adding legacy directory migration logic from `logseq_db_<graph>` to `<graph>` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node_lock.cljs`.
28. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` to use canonical graph directory resolution for `repo-dir`, `lock-path`, and graph enumeration.
29. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` to use canonical graph directory keys in `storage-pool-name` and `db-exists?` path resolution for node runtime.
30. Re-run `bb dev:test -v 'frontend.worker.db-worker-node-lock-test'` and `bb dev:test -v 'logseq.cli.server-test'` and confirm canonical naming tests pass without migration behavior.

### Phase 6: Implement write-lease ownership checks for graph file mutations.

32. Extend lock payload in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node_lock.cljs` with a generated `lock-id` and keep ownership fields immutable after acquisition.
33. Add `assert-lock-owner!` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node_lock.cljs` that validates lock existence, pid ownership, and `lock-id` match before mutation.
34. Pass a write-guard callback from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` into `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs`.
35. Invoke the write-guard callback before every graph file mutation path in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs`, including sqlite import, text writes, and recursive delete paths.
36. Return consistent `:repo-locked` errors from ownership failures and ensure CLI formatting remains readable through `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
37. Re-run `bb dev:test -v 'frontend.worker.db-worker-node-test'` and confirm ownership tests pass.

### Phase 7: Update docs and run full verification.

38. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` for the new default data dir and for prefix-free on-disk graph directory naming.
39. Add a breaking-change note in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` stating old on-disk prefixed graph directories are not automatically migrated.
40. Re-run `bb dev:test -v 'logseq.cli.commands-test'` and `bb dev:test -v 'logseq.cli.main-test'` to verify help text and command behavior coverage.
41. Run `bb dev:lint-and-test` and confirm the suite passes with no regressions.
42. Review changed code against `@prompts/review.md` to catch Clojure and ClojureScript correctness pitfalls before merge.

## Edge cases to cover

| Scenario | Expected behavior |
|---|---|
| Graph name contains `/`, `:`, `%`, or unicode. | Directory naming remains reversible through encode and decode helpers. |
| Legacy on-disk directory `logseq_db_demo` exists. | No compatibility or migration is performed by this change, and discovery commands ignore this directory. |
| Lock file is stale with dead pid. | Startup removes stale lock and acquires a fresh lease. |
| Lock file exists with alive non-owner pid. | Startup and direct mutation fail fast with `:repo-locked`. |
| Default data dir has non-graph directories. | Enumeration ignores directories that are not valid graph directories after canonicalization checks. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'logseq.cli.config-test'
bb dev:test -v 'logseq.cli.data-dir-test'
bb dev:test -v 'logseq.cli.server-test'
bb dev:test -v 'frontend.worker.db-worker-node-lock-test'
bb dev:test -v 'frontend.worker.db-worker-node-test'
bb dev:test -v 'logseq.cli.commands-test'
bb dev:lint-and-test
```

Each command should finish with zero failures and zero errors.

If a red phase command is run before implementation, it should fail specifically on the newly added assertions in that phase.

## Testing Details

The tests validate behavior through public CLI and daemon entrypoints instead of validating only implementation internals.

The naming tests prove that internal db repo prefixes remain stable while on-disk names are canonicalized for user-facing graph directories.

The ownership tests verify that only the active lock owner can execute graph file mutation paths in db-worker-node.

The tests intentionally avoid migration coverage because compatibility with old prefixed on-disk graph directories is out of scope.

## Implementation Details

- Keep internal repo values db-prefixed for thread-api compatibility and db metadata reads.
- Use canonical graph directory keys for all on-disk path construction in node runtime.
- Do not add compatibility branches or migration logic for old `logseq_db_` prefixed on-disk graph directories.
- Ignore old `logseq_db_` prefixed on-disk graph directories during graph discovery and server listing.
- Add lock ownership token fields and verify ownership before each graph mutation path.
- Enforce ownership checks for all files under a graph directory, including sqlite files, search and client-op files, debug logs, backups, and text files.
- Keep error code semantics stable by reusing `:repo-locked` for ownership and lock conflicts.
- Keep lock-conflict error semantics unified across CLI and db-worker-node as `:repo-locked`.
- Update all default data-dir strings and help text to `~/logseq/graphs`.
- Keep CLI output graph names user-facing and prefix-free.
- Update docs with a breaking-change note for old prefixed on-disk graph directories.
- Follow `@test-driven-development` and `@prompts/review.md` through implementation and verification.

## Question

Resolved decisions:

1. Ignore old on-disk `logseq_db_` prefixed graph directories.
2. Requirement three covers all files under the graph directory.
3. Lock conflicts and ownership failures use unified error code `:repo-locked`.

---
