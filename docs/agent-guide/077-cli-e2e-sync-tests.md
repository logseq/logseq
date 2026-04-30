# CLI E2E Sync Suite Implementation Plan

Goal: Add a dedicated sync-focused `cli-e2e` suite that is isolated from non-sync coverage and validates MVP upload and download behavior using two independent `db-worker-node` processes driven only through CLI commands.

Architecture: Keep the existing non-sync suite as the default `cli-e2e` path and introduce a separate sync suite with its own manifest files, runner entrypoint, and preconditions.
Architecture: Model sync behavior with two distinct data directories that run two different `db-worker-node` processes against the same graph name, then assert health via `sync status` and data convergence via CLI queries.
Architecture: Ship MVP coverage for upload and download first, while leaving realtime sync-start convergence tests for a follow-up phase.

Tech Stack: Babashka, EDN case manifests, `logseq-cli`, `db-worker-node`, JSON parsing via Python 3 in shell helpers, existing CLI sync commands.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/064-logseq-cli-integration-test-shell-refactor.md`.
Related: Relates to `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/047-logseq-cli-sync-command.md`.
Related: Relates to `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/048-sync-download-start-reliability.md`.
Related: Relates to `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/051-logseq-cli-sync-upload-fix.md`.

## Problem statement

`cli-e2e` currently excludes all `sync` commands by design.

`/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` explicitly excludes the `sync` prefix, and `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/manifests.clj` only loads `non_sync_*` manifests.

This keeps non-sync coverage clean, but there is currently no shell-first `cli-e2e` coverage for sync upload and download behavior.

Current sync integration checks in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` are mostly mocked transport-level tests and do not validate real shell command orchestration in a two-process setup.

The requested test architecture requires two independent `db-worker-node` processes in different directories, both operating on the same graph name, with CLI-only operations and status-driven verification.

## Current implementation snapshot

| Area | Current file | Current behavior | Gap for this plan |
| --- | --- | --- | --- |
| Suite manifests | `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/manifests.clj` | Loads only `non_sync_inventory.edn` and `non_sync_cases.edn`. | No sync suite loading path. |
| Non-sync inventory policy | `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Excludes `sync`, `login`, and `logout`. | Sync tests must live in separate manifests to avoid policy conflict. |
| CLI runner tasks | `/Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn` | Exposes `test`, `list-cases`, and `build` for one suite. | Need dedicated sync tasks and clearer suite-level ergonomics. |
| Case execution model | `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/runner.clj` | Supports shell-first setup and command chains with templating. | No built-in wait helper for polling `sync status` until pending queues are empty. |
| Sync command behavior | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` | `sync upload`, `sync download`, and `sync status` are implemented and return structured JSON. | E2E harness does not yet assert these behaviors with two independent workers. |
| Server process isolation | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | Data-dir and graph path determine lock ownership and process identity. | Need explicit test cases that prove two data dirs produce two independent worker processes for the same graph name. |

## Scope and MVP boundaries

MVP in this plan covers upload and download flows only.

MVP does not add coverage for long-running `sync start` websocket convergence behavior.

MVP requires CLI-only graph operations during test execution, including graph creation, mutation, upload, download, status checks, and data verification queries.

MVP keeps non-sync test behavior unchanged and isolated.

## Testing Plan

I will add runner-level unit tests that fail first when sync suite manifests and tasks are missing, and pass only after suite separation is implemented.

I will add sync suite manifest coverage tests that fail first when required sync command options are not covered by MVP cases.

I will add shell-first sync E2E cases that fail first and validate the two-data-dir architecture, `sync status` health checks, pending queue convergence checks, and graph data parity assertions.

I will validate command ergonomics by running non-sync and sync suites independently and ensuring their outputs and selection logic remain deterministic.

I will follow @test-driven-development for every behavior slice in this plan.

NOTE: I will write all tests before I add any implementation behavior.

## Target sync suite architecture

```text
+----------------------------------+                 +----------------------------------+
| data-dir A                       |                 | data-dir B                       |
| graph: sync-e2e-mvp              |                 | graph: sync-e2e-mvp              |
| db-worker-node process A         |                 | db-worker-node process B         |
+----------------+-----------------+                 +----------------+-----------------+
                 |                                                    |
                 | CLI commands only                                  | CLI commands only
                 v                                                    v
        logseq sync upload                                   logseq sync download
                 |                                                    |
                 +-------------------> remote sync backend <----------+

Verification path:
1) mutate graph via CLI in A.
2) run sync upload via CLI in A.
3) poll sync status via CLI until pending queues settle and last-error remains nil.
4) run sync download via CLI in B.
5) compare graph data via CLI queries in A and B.
```

## Detailed implementation plan

### Phase 1. Add explicit sync suite separation in `cli-e2e`.

1. Add a failing unit test in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/main_test.clj` that expects a dedicated sync test entrypoint to load sync manifests instead of non-sync manifests.
2. Add a failing unit test in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/main_test.clj` that expects non-sync `test` to keep current behavior unchanged.
3. Add `sync_inventory.edn` loading support in `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/manifests.clj` with a suite selector API.
4. Add `sync_cases.edn` loading support in `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/manifests.clj` with the same suite selector API.
5. Add suite-aware run helpers in `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/main.clj` so non-sync and sync share execution plumbing but load different manifests.
6. Add new tasks in `/Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn` for `test-sync` and `list-sync-cases`.
7. Keep existing `test` and `list-cases` mapped to non-sync manifests.
8. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn unit-test` and confirm failures turn green for the new suite selection behavior.

### Phase 2. Define sync inventory and MVP case manifests.

9. Create `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_inventory.edn` with MVP required commands `sync upload`, `sync download`, and `sync status`.
10. Include only MVP-required sync options in `sync_inventory.edn` to avoid over-scoping phase one.
11. Add a failing coverage test in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/coverage_test.clj` for missing sync command coverage.
12. Create `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` with initial empty or placeholder MVP case definitions that intentionally fail coverage.
13. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test-sync --skip-build` and confirm coverage failure is clear and actionable.

### Phase 3. Add reusable sync status and graph parity helper scripts.

14. Add `/Users/rcmerci/gh-repos/logseq/cli-e2e/scripts/wait_sync_status.py` that repeatedly executes CLI `sync status --output json` until pending queues reach zero or timeout.
15. Make `wait_sync_status.py` fail immediately when `status` is not `ok` or when `data.last-error` is not `null`.
16. Add `/Users/rcmerci/gh-repos/logseq/cli-e2e/scripts/compare_graph_queries.py` that executes two CLI query commands and compares normalized payloads.
17. Keep helper scripts CLI-only by calling `node static/logseq-cli.js` commands rather than reading DB files directly.
18. Add shell-level tests for these helper scripts in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/runner_test.clj` or a new helper test namespace using mocked command execution.

### Phase 4. Implement MVP sync upload/download test case with two worker processes.

19. Add one MVP case in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` that provisions two data dirs under one temp root.
20. In setup, create two separate config files for directory A and directory B with explicit sync endpoint keys and auth placeholders sourced from environment variables.
21. In setup, create the graph in directory A via CLI and add deterministic marker data via CLI `upsert` commands.
22. In setup, start `db-worker-node` for graph A via CLI `server start`.
23. In main commands, run CLI `sync upload` in directory A.
24. In main commands, run `wait_sync_status.py` against directory A to ensure `last-error` remains empty and pending counters settle.
25. In main commands, run CLI `sync download` in directory B for the same graph name.
26. In main commands, start `db-worker-node` for graph B via CLI `server start`.
27. In main commands, use `compare_graph_queries.py` to compare deterministic query outputs between A and B.
28. In cleanup, stop servers for both directory A and directory B via CLI `server stop`.
29. Ensure the case `:covers` map marks `sync upload`, `sync download`, and `sync status` coverage in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn`.
30. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test-sync --skip-build` and verify the MVP case passes.

### Phase 5. Keep non-sync suite stable and document operator workflow.

31. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test --skip-build` and verify non-sync behavior is unchanged.
32. Update `/Users/rcmerci/gh-repos/logseq/cli-e2e/README.md` with separate commands for non-sync and sync suites.
33. Add required environment variable documentation in `/Users/rcmerci/gh-repos/logseq/cli-e2e/README.md` for sync suite execution.
34. Optionally add `dev:cli-e2e-sync` task in `/Users/rcmerci/gh-repos/logseq/bb.edn` that delegates to `bb -f cli-e2e/bb.edn test-sync`.
35. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn list-sync-cases` and ensure the new case is discoverable.

## Verification commands and expected outcomes

| Command | Expected outcome |
| --- | --- |
| `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test --skip-build` | Runs non-sync suite only and remains green. |
| `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn list-cases` | Lists non-sync case ids only. |
| `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn list-sync-cases` | Lists sync case ids only. |
| `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test-sync --skip-build` | Runs sync suite only and validates MVP upload or download behavior. |
| `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test-sync --skip-build --case sync-upload-download-mvp` | Runs one sync MVP case with deterministic status and parity checks. |

## Edge cases to include in MVP case design

The sync suite must fail with a clear message when required auth or endpoint environment variables are missing.

The status polling helper must fail on timeout and print the last seen status payload for debugging.

The status polling helper must fail when `last-error` appears even if pending counters reach zero.

The graph parity helper must compare normalized query results, not raw command output strings that can differ by formatting.

Cleanup must tolerate partially started state and still attempt to stop both servers.

The sync suite must not mutate or depend on `non_sync_*` manifest files.

## Open clarifications to resolve before implementation

MVP sync suite will target local db-sync by default (`http://localhost:8080` plus local websocket).

CI integration is intentionally out of scope for this phase and will be decided after MVP stabilizes.

Confirm the minimum auth material for sync MVP in test environments, including whether a refresh token is strictly required or whether pre-seeded runtime tokens in config are sufficient.

## Testing Details

The new tests validate real shell behavior through compiled `logseq-cli` commands and real `db-worker-node` process lifecycle handling across two independent data directories.

The MVP sync case verifies behavior outcomes by checking sync health status, pending queue convergence, and cross-directory graph data parity for deterministic query payloads.

The suite separation tests ensure sync coverage does not destabilize non-sync command coverage expectations.

## Implementation Details

- Keep non-sync manifests and command coverage unchanged.
- Add sync manifests as a separate suite, not an extension of non-sync inventory.
- Reuse existing `main/run!` and runner infrastructure with suite-aware manifest loading.
- Keep all graph mutations and validations CLI-driven in case commands and helper scripts.
- Use two explicit data directories per sync case to guarantee two independent `db-worker-node` processes.
- Poll `sync status` until pending counters settle and fail on `last-error`.
- Compare graph parity through deterministic CLI query outputs.
- Document sync suite environment requirements in `cli-e2e/README.md`.
- Keep sync suite runnable independently with `test-sync` and `list-sync-cases` tasks.
- Defer `sync start` realtime scenarios to a follow-up plan after MVP upload and download stabilization.

## Question

Should MVP include only one-direction flow `A upload -> B download`, or should it also include the reverse-direction snapshot refresh in the same phase.

---
