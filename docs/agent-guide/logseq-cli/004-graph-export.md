# CLI Graph Export Optimization Implementation Plan

Goal: Improve `logseq graph export` so it exposes the useful EDN graph export options already supported by the worker stack and removes avoidable SQLite export overhead without adding a new thread API unless existing APIs prove insufficient.

Architecture: Keep `graph export` as the single public command surface and reuse the current `db-worker-node` transport contract instead of introducing a parallel export path.
Architecture: Route EDN exports through the existing `:thread-api/export-edn` graph-options payload, route SQLite exports through the existing `:thread-api/backup-db-sqlite` direct-to-path capability, and reject option combinations that do not make sense for the chosen export type.

Tech Stack: ClojureScript, Node `fs`, Logseq CLI command parsing, `db-worker-node` HTTP transport, `logseq.db.sqlite.export`, and existing CLI/db-worker tests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md`.

## Problem statement

The current `logseq graph export` implementation is functionally correct but unnecessarily narrow.

The public CLI surface in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` exposes only `--type` and `--file`, even though the worker-side EDN export path already supports several graph export options through `logseq.db.sqlite.export/build-export`.

The current SQLite export path is also more expensive than it needs to be.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` currently calls `:thread-api/export-db-base64`, receives a base64 string over HTTP, decodes it back into a `Buffer`, and only then writes it to disk.

That means the command performs extra encoding, extra decoding, and extra in-memory copying for the largest export payload shape.

At the same time, the worker already exposes `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` `:thread-api/backup-db-sqlite`, which checkpoints the DB and writes the SQLite file directly to a destination path.

The existing implementation therefore has a mismatch between current capability and current command design.

There is also a discoverability and migration gap.

The older CLI exposed several EDN graph export options in `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/spec.cljs`, and several of those options still map cleanly onto the current worker export implementation.

The implementation plan should recover the useful options that still fit the new CLI architecture while explicitly rejecting old options that belonged to the legacy API-server workflow or to dev-only validation flows.

A key constraint for this work is to avoid adding another worker thread API unless profiling or a hard behavior gap proves that the existing APIs cannot support the desired CLI behavior.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add command parsing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` before changing any implementation so the new CLI surface is locked down first.

I will add execution tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that prove EDN exports forward graph-options correctly and SQLite exports switch from `:thread-api/export-db-base64` to `:thread-api/backup-db-sqlite`.

I will add completion coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` so the new export options appear in generated shell completions and `--type`-specific completions remain coherent.

I will update output formatting coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` only if the human success line or error wording changes.

I will add or extend worker integration coverage in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` only where the CLI plan depends on an already-existing worker contract that is currently under-specified by tests.

I will run the new parsing tests first and confirm they fail for the expected missing-option behavior before implementation begins.

I will run the new execute-path tests next and confirm they fail because the command still calls `:thread-api/export-db-base64` and still omits the new EDN graph-options payload.

I will run targeted completion tests after adding the option metadata and confirm the completion failures are caused by the new command surface not yet being wired in.

I will finish by running the focused CLI and worker test namespaces plus the relevant doc-facing smoke checks.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

The current export flows are:

```text
CLI graph export --type edn
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs
  -> transport/invoke :thread-api/export-edn
  -> worker db_core.cljs calls sqlite-export/build-export
  -> CLI writes EDN to --file

CLI graph export --type sqlite
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs
  -> transport/invoke :thread-api/export-db-base64
  -> worker db_core.cljs exports bytes then encodes base64
  -> CLI decodes base64 to Buffer
  -> CLI writes SQLite file to --file
```

The worker capabilities that already exist are:

```text
:thread-api/export-edn
  Supports {:export-type :graph :graph-options {...}} through sqlite-export/build-export.

:thread-api/backup-db-sqlite
  Checkpoints the DB and writes a SQLite backup directly to a destination path.

:thread-api/export-db-base64
  Exports SQLite as base64 for transport, but adds avoidable payload inflation for file export.
```

The underlying EDN graph export options currently supported by `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/sqlite/export.cljs` are:

| Option | Current backend support | Notes |
| --- | --- | --- |
| `:include-timestamps?` | Yes | Graph option already documented in `build-graph-export`. |
| `:exclude-namespaces` | Yes | Useful for ontology-heavy graphs, but validation becomes less strict. |
| `:exclude-built-in-pages?` | Yes | Supported today, with existing backend caveats. |
| `:exclude-files?` | Yes | Direct graph option already wired in backend export, but intentionally not exposed by this plan. |

## Goals

Expose the useful EDN graph export options that already map cleanly onto the current worker implementation.

Make SQLite export stop paying the base64 round-trip cost when the command’s only goal is to write a file to disk.

Keep one clear `graph export` command path instead of creating a second export command family.

Keep the worker API surface unchanged unless an implementation step proves that reuse is impossible.

Preserve current import compatibility by continuing to emit the same EDN graph export structure and the same SQLite snapshot format.

## Non-goals

Do not reintroduce the legacy API-server-token export flow from `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/commands/export_edn.cljs`.

Do not revive the legacy Markdown zip export command from `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/commands/export.cljs` as part of this work.

Do not expose non-graph export types such as `:page`, `:block`, `:view-nodes`, or `:graph-ontology` under `graph export` in this phase.

Do not expose old dev-only export switches such as `--validate`, `--roundtrip`, or `--catch-validation-errors` unless a separate product requirement appears.

Do not add a new streaming or file-writing thread API unless the existing `:thread-api/backup-db-sqlite` and `:thread-api/export-edn` paths prove insufficient.

## Recommended option scope

The old option inventory in `/Users/rcmerci/gh-repos/logseq/deps/cli/src/logseq/cli/spec.cljs` should be split into adopt, reject, and defer groups.

| Old option | Recommendation | Reason |
| --- | --- | --- |
| `--include-timestamps` | Adopt for `--type edn` | Directly supported by current graph export backend. |
| `--exclude-namespaces` | Adopt for `--type edn` | Directly supported and useful for seeded ontology graphs. |
| `--exclude-built-in-pages` | Adopt for `--type edn` | Directly supported by current backend export. |
| `--exclude-files` | Defer | Backend supports it, but this plan intentionally keeps the initial option set smaller. |
| `--validate` | Reject for now | Old command did extra local validation work that current CLI does not expose through worker APIs. |
| `--roundtrip` | Reject for now | Dev-only workflow that does more than export and would need separate orchestration. |
| `--catch-validation-errors` | Reject for now | Dev-only and intentionally permits invalid output. |
| Legacy `--api-server-token` | Reject | Belongs to the old API-server architecture, not current db-worker-node CLI. |
| Legacy EDN `--export-type` variants | Reject | `graph export` should remain a graph export command in this phase. |
| Legacy Markdown export command | Reject | Different artifact type and command semantics. |

## Proposed CLI behavior

The public command should remain `logseq graph export --type edn|sqlite --file <path> [--graph <name>]`.

When `--type edn` is selected, the command should additionally allow `--include-timestamps`, `--exclude-built-in-pages`, and `--exclude-namespaces <csv>`.

When `--type sqlite` is selected, those EDN-only options should be rejected with a clear invalid-options error instead of being silently ignored.

The EDN branch should keep calling `:thread-api/export-edn`, but it should pass `{:export-type :graph :graph-options {...}}` instead of the current hard-coded `{:export-type :graph}` payload.

The SQLite branch should stop calling `:thread-api/export-db-base64` and should instead call `:thread-api/backup-db-sqlite` with the resolved destination path.

The command should preserve the current success shape of writing to `--file` and then returning a normal `:graph-export` success result.

The human formatter can stay minimal unless we decide to include a short option summary in structured output.

## Execution steps

1. Write the new failing parser tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for each adopted EDN-only export option.

2. Write the failing parser tests that prove those EDN-only options are rejected for `--type sqlite`.

3. Write the failing execution test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that expects EDN exports to forward `:graph-options` to `:thread-api/export-edn`.

4. Write the failing execution test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that expects SQLite exports to call `:thread-api/backup-db-sqlite` instead of `:thread-api/export-db-base64`.

5. Write the failing completion tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` for the new export options.

6. Run the focused parser and execution tests and confirm every new case fails for the intended reason.

7. Extend `graph-export-spec` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` with the adopted EDN-only options and keep the option descriptions implementation-aligned.

8. Add a small export-options normalization helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` that builds the `:graph-options` map only for `--type edn`.

9. Reuse existing CLI parsing conventions for comma-delimited multi-value options when implementing `--exclude-namespaces`, rather than inventing a one-off parser shape.

10. Update action-building in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` so the selected export options are available at execution time and invalid combinations are rejected early.

11. Change the EDN branch of `execute-graph-export` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` to call `:thread-api/export-edn` with `{:export-type :graph :graph-options ...}`.

12. Change the SQLite branch of `execute-graph-export` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` to call `:thread-api/backup-db-sqlite` with the destination file path and remove the base64 decode path.

13. Keep `:thread-api/export-db-base64` unchanged in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` unless another caller analysis proves it is now dead code and safe to remove in a separate cleanup.

14. Update command help examples in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` so at least one EDN example demonstrates the new options and one SQLite example still shows the simple snapshot case.

15. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document the adopted EDN-only options and the fact that SQLite export is a direct snapshot path.

16. Update `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` so the current-state CLI guide stays aligned with the new command surface.

17. Run the focused CLI command, completion, and format tests again and confirm they all pass after implementation.

18. Run the focused worker tests that cover `export-edn`, `backup-db-sqlite`, and SQLite import/export compatibility to confirm the reused worker contract is still green.

19. Refactor any duplicated export option assembly or validation code only after the green phase is complete.

20. Re-run all touched test namespaces after refactoring and confirm the suite stays green.

## File-by-file plan

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` will hold the public option spec changes, export option normalization, command examples, and the `execute-graph-export` switch from base64 SQLite export to direct backup export.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` will need any command-validation updates required to reject EDN-only options for `--type sqlite` and to preserve current missing-type or missing-file behavior.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` will be the primary place for parse and execute regressions.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` should be updated so shell completion coverage matches the new command surface.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` only needs updates if the human success line or invalid-option wording changes.

`/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` should be reviewed to ensure the direct backup-based SQLite export path is covered by the existing worker behavior tests.

`/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` must be updated because it is the operator-facing CLI reference.

`/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` must be updated because it is the implementation-aligned guide for future agents.

## Edge cases and failure handling

The implementation should reject EDN-only flags when `--type sqlite` is chosen.

The implementation should continue to fail fast when `--type` or `--file` is missing.

The implementation should preserve current graph selection semantics so `--graph` remains optional only when config already selects a graph.

The implementation should verify how `--exclude-namespaces` behaves when the user passes empty segments, duplicate values, or surrounding whitespace, and tests should define the normalization rule explicitly.

The implementation should preserve the current backend caveat that `exclude-namespaces` reduces some validation strictness, and the CLI docs should describe this briefly rather than pretending the option is free.

The implementation should confirm whether the destination parent directory error message from direct backup export is acceptable or whether CLI should wrap it with a clearer file-path-specific message.

The implementation should ensure the SQLite direct backup path still works when the server process owns the file write and the target path is outside the graph root.

The implementation should ensure that overwriting an existing export file follows the current Node filesystem behavior intentionally and is documented or validated consistently.

## Why this plan avoids a new thread API

The current worker stack already exposes the two capabilities this feature needs.

EDN graph export options already flow through `:thread-api/export-edn` into `logseq.db.sqlite.export/build-export`.

SQLite file export already has a direct-to-path worker contract in `:thread-api/backup-db-sqlite`.

Adding a new export thread API in this phase would duplicate behavior, expand the compatibility surface, and work against the repository rule to prefer one clear path when an existing path is already sufficient.

A new thread API should only be reconsidered if real profiling shows that the reused APIs still miss a required behavior or introduce an unacceptable correctness issue.

## Verification commands

Run `bb dev:test -v logseq.cli.commands-test/test-verb-subcommand-parse-graph-import-export` after writing the parser tests and expect new export-option assertions to fail before implementation.

Run `bb dev:test -v logseq.cli.commands-test/test-execute-graph-export` after writing the execution tests and expect the SQLite branch assertion to fail until the command stops using `:thread-api/export-db-base64`.

Run `bb dev:test -v logseq.cli.completion-generator-test` after adding completion coverage and expect new cases to fail before the command spec is updated.

Run `bb dev:test -v logseq.cli.format-test` if formatter strings change.

Run `bb dev:test -v frontend.worker.db-worker-node-test/db-worker-node-backup-db-sqlite` and the existing export/import worker tests after the CLI path changes to confirm the reused worker contract remains valid.

Run `bb dev:lint-and-test` after the focused suites are green if the change footprint stays small enough for a full verification pass.

## Testing Details

The test additions should prove behavior at the command boundary, not just helper internals.

The key behaviors are that the CLI accepts only the intended export options, forwards the exact EDN graph-options payload to the worker, routes SQLite file exports through direct backup instead of base64 transport, and keeps user-facing help and completion aligned.

Worker coverage should remain focused on actual export and import behavior rather than on transport implementation details.

## Implementation Details

- Reuse `:thread-api/export-edn` for all EDN export work in this phase.
- Reuse `:thread-api/backup-db-sqlite` for SQLite file export in this phase.
- Do not add a new thread API unless an implementation blocker is proven.
- Keep `graph export` scoped to full-graph exports only.
- Adopt only the old EDN options that map directly onto current `build-graph-export` support.
- Reject EDN-only options for SQLite instead of silently ignoring them.
- Keep help examples and shell completion synchronized with the spec changes.
- Keep `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` aligned with the implementation.
- Treat `exclude-namespaces` normalization as a tested contract.
- Defer dev-only validation and roundtrip workflows to a separate plan if they are still needed.

## Question

No further product questions are currently blocking implementation.

Locked decisions for this plan are:

- `--exclude-namespaces` should follow the existing CLI convention of a single comma-delimited value.
- `graph export --type sqlite` should keep the current overwrite behavior.
- `--exclude-files` should remain out of scope for this phase even though the backend supports it.

---
