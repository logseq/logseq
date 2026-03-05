# Graph Info Kv Display Implementation Plan

Goal: Make `logseq graph info` display all persisted `:logseq.kv/<...>` values in a readable and script-friendly way without introducing new db-worker-node protocol endpoints.

Architecture: Reuse existing `logseq-cli -> transport -> db-worker-node -> :thread-api/q` flow to query kv entities by `:db/ident` namespace `logseq.kv`.

Architecture: Keep backward compatibility by preserving current summary fields while adding a structured ident-keyed kv map for JSON and EDN output plus a dedicated kv section in human output.

Architecture: Follow `@test-driven-development` with failing tests first in command, formatter, and integration layers.

Tech Stack: ClojureScript, Datascript query via existing `:thread-api/q`, db-worker-node HTTP transit transport, Logseq CLI formatter pipeline, Babashka test runner.

Related: Builds on `docs/agent-guide/001-logseq-cli.md`.

Related: Builds on `docs/agent-guide/007-logseq-cli-thread-api-and-command-split.md`.

Related: Relates to `docs/agent-guide/033-desktop-db-worker-node-backend.md`.

## Problem statement

Current `execute-graph-info` only fetches `:logseq.kv/graph-created-at` and `:logseq.kv/schema-version` via two `:thread-api/pull` calls.

Current human output shows only three lines, which is too limited for diagnosing graph state during CLI usage.

Current JSON and EDN outputs also omit other kv entries such as `:logseq.kv/db-type`, `:logseq.kv/graph-initial-schema-version`, and runtime metadata keys.

The requested behavior is to show all `:logseq.kv/<...>` kv pairs in a way that is readable for humans and stable for machine consumers.

The implementation should stay within the current db-worker-node design and avoid adding new RPC methods unless absolutely necessary.

## Current and target data flow

```text
Current.
logseq graph info
  -> execute-graph-info
  -> thread-api/pull (:graph-created-at)
  -> thread-api/pull (:schema-version)
  -> formatter renders 3 lines.

Target.
logseq graph info
  -> execute-graph-info
  -> thread-api/q (query all :db/ident in namespace "logseq.kv" with :kv/value)
  -> normalize + sort kv rows
  -> data payload keeps summary fields + ident-keyed kv map
  -> formatter renders summary + kv section (human) or structured kv payload (json/edn).
```

## Target behavior

`graph info` keeps existing top summary lines so users still see graph name, created-at, and schema version immediately.

`graph info` adds a complete kv section in human output, sorted by ident for deterministic reading.

`graph info` adds a structured ident-keyed kv map field in result data for JSON and EDN output so scripts can parse all kv values directly.

The kv field contains only persisted kv rows, which means keys without `:kv/value` in the DB are not synthesized.

All output formats redact kv keys matching sensitive patterns like `token`, `secret`, or `password`.

Human output truncates very long string values with explicit marker text.

The implementation uses only existing `:thread-api/q` and transport invocation paths.

## Testing Plan

I will follow `@test-driven-development` and write all failing tests before implementation.

I will add command-level tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` to validate `execute-graph-info` builds kv payload from query rows and preserves existing summary fields.

I will extend formatting tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` to verify human output includes a deterministic kv section and still keeps the existing summary lines.

I will add JSON and EDN formatting assertions in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for the new structured kv field shape.

I will add formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for sensitive key redaction across human, JSON, and EDN outputs plus long string truncation in human output.

I will add integration coverage in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that creates a graph and asserts `graph info` returns non-empty `logseq.kv` data end-to-end through db-worker-node.

I will run focused tests first and use `@clojure-debug` if any failure is non-obvious before changing implementation.

I will run `bb dev:lint-and-test` as final gate.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

### Phase 1: Add failing tests for command payload shape.

1. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` that stubs `cli-server/ensure-server!` and `transport/invoke` and asserts `execute-graph-info` issues one `:thread-api/q` request for `logseq.kv` rows.
2. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` that asserts result data still includes `:graph`, `:logseq.kv/graph-created-at`, and `:logseq.kv/schema-version`.
3. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` that asserts kv rows are normalized into an ident-keyed map for machine output and deterministic sorted entries for human rendering.

### Phase 2: Add failing tests for human output.

4. Extend `test-human-output-graph-info` in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` to expect the existing summary lines plus a kv section.
5. Add a failing formatter test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that verifies kv rows are ordered lexicographically by ident.
6. Add a failing formatter test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that verifies sensitive kv keys are redacted in human output.
7. Add a failing formatter test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that verifies long string kv values are truncated in human output.

### Phase 3: Add failing tests for machine outputs and integration.

8. Add a failing JSON output test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting new kv map field is present and parseable.
9. Add a failing EDN output test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting kv map preserves keyword idents and applies sensitive key redaction.
10. Add a failing JSON output test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting sensitive keys are redacted in machine output.
11. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that runs `graph create` then `graph info` and asserts returned data includes multiple `:logseq.kv/...` keys.
12. Run focused tests and confirm failures are behavior gaps rather than fixture or server boot issues.

### Phase 4: Implement command-side kv collection with existing db-worker-node API.

13. Add a private datalog query constant in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` that finds `?ident` and `?value` where ident namespace is `"logseq.kv"` and entity has `:kv/value`.
14. Update `execute-graph-info` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` to call `transport/invoke` once with `:thread-api/q` and query inputs.
15. Normalize query tuples into an ident-keyed kv map for machine output and keep a sorted kv entry list for deterministic human formatting.
16. Derive `:logseq.kv/graph-created-at` and `:logseq.kv/schema-version` from the kv map to keep backward compatibility in `:data`.
17. Add the new structured kv map field to the response payload while keeping existing keys unchanged.

### Phase 5: Implement formatter changes for reasonable display.

18. Add a helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` to format graph kv rows for human output with a clear header and deterministic ordering.
19. Update `format-graph-info` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` to render summary lines first and kv section second.
20. Add centralized masking for kv keys matching sensitive patterns like `token`, `secret`, or `password` so human, JSON, and EDN output share the same redaction behavior.
21. Add human output truncation for very long string values with an explicit marker.
22. Ensure human output remains readable when kv list is empty by showing an explicit empty state line.

### Phase 6: Verify behavior and compatibility.

23. Run `bb dev:test -v 'logseq.cli.command.graph-test'` and verify new command tests pass.
24. Run `bb dev:test -v 'logseq.cli.format-test'` and verify human, JSON, and EDN formatting tests pass.
25. Run `bb dev:test -v 'logseq.cli.integration-test'` and verify graph-info integration behavior across db-worker-node is green.
26. Run `bb dev:lint-and-test` and verify `0 failures, 0 errors`.
27. Review against `/Users/rcmerci/gh-repos/logseq/prompts/review.md` checklist before final submission.

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Graph has only default kv rows. | Human output shows summary lines plus kv section with default keys. |
| Graph has additional future `:logseq.kv/*` keys. | All persisted keys are included automatically without code changes. |
| Graph has composite kv values such as map or vector. | Human output renders values safely as printable EDN strings. |
| Graph has boolean and UUID kv values. | JSON output serializes them in existing normalize-json behavior without crashes. |
| Kv key includes `token`, `secret`, or `password`. | Human, JSON, and EDN outputs all show redacted value. |
| Kv value is a very long string. | Human output shows truncated text with explicit marker. |
| Query returns no kv rows due to corrupted graph state. | Command still succeeds with summary placeholders and an explicit empty kv section. |
| Existing script parses `graph-created-at` and `schema-version` fields. | Backward compatible fields remain present in response data. |
| Human output consumers expect old first three lines. | Existing first three lines remain unchanged in order and meaning. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'logseq.cli.command.graph-test'
bb dev:test -v 'logseq.cli.format-test'
bb dev:test -v 'logseq.cli.integration-test'
bb dev:lint-and-test
```

Each command should complete with `0 failures, 0 errors`.

Integration output should include a non-empty kv field in `graph info` JSON payload.

Human output should include `Graph`, `Created at`, and `Schema version` before the kv section.

## Testing Details

The tests verify behavior at command assembly, output formatting, and end-to-end runtime boundaries.

The command tests validate query usage and payload compatibility instead of checking internal helper implementation details only.

The format tests verify visible behavior for human readability and machine parseability for JSON and EDN outputs.

The integration test verifies real db-worker-node invocation and confirms that kv data is actually surfaced through CLI transport.

## Implementation Details

- Reuse `:thread-api/q` and avoid introducing a new db-worker-node endpoint.
- Keep `execute-graph-info` backward compatible for existing top-level summary fields.
- Add one new ident-keyed kv map field for scripts instead of spreading arbitrary keys at top level.
- Keep kv ordering deterministic in CLI code to stabilize human snapshots and tests.
- Render complex values safely in human output with printable EDN formatting.
- Redact sensitive keys in human, JSON, and EDN output for `token`, `secret`, and `password` patterns.
- Truncate very long string values in human output only.
- Preserve existing output pipeline behavior for `:json`, `:edn`, and `:human`.
- Keep command parser and `graph info` CLI flags unchanged for this iteration.
- Follow `@test-driven-development` strictly and use `@clojure-debug` on unexpected failures.

## Question

Decision: The new structured kv field is a single ident-keyed map for machine output.

Decision: Human, JSON, and EDN outputs must redact kv keys matching sensitive patterns like `token`, `secret`, or `password`.

Decision: Human output must truncate very long string values with an explicit marker.

---
