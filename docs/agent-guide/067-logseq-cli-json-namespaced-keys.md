# Logseq CLI JSON Namespaced Keys Implementation Plan

Goal: Make `--output json` preserve namespaced keys so agents can reliably parse Logseq graph semantics without lossy key flattening.

Architecture: Keep the existing `logseq-cli -> db-worker-node` transit transport contract unchanged for `directPass=false` calls.
Architecture: Move semantic-preserving JSON conversion into the CLI formatting boundary so all command outputs can keep canonical namespaced keys in machine output.
Architecture: Update tests, shell completion, and user docs to consume namespaced JSON keys as the canonical contract.

Tech Stack: ClojureScript, `logseq.cli.format`, `logseq.cli.transport`, `frontend.worker.db-worker-node`, `cli-e2e`, JSON parsing with keywordized paths.

Related: Builds on `docs/agent-guide/035-logseq-cli-db-worker-deps-cli-decoupling.md`, `docs/agent-guide/066-logseq-cli-list-property-cardinality-column.md`, and `docs/agent-guide/task--db-worker-nodejs-compatible.md`.

## Problem statement

Current JSON output is not semantically faithful for keyword keys and ident-heavy graph data.

The core `db-worker-node` invoke contract already preserves Clojure semantics in transit for `directPass=false` via `resultTransit`.

The semantic loss happens at the final CLI JSON formatting stage in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` when `clj->js` is used on keyword-keyed maps.

When keyword namespaces are dropped in JSON keys, `:block/title` and `:logseq.property/title` can collapse into an ambiguous flat key, which breaks stable agent parsing.

This is especially harmful for Logseq because identity and schema semantics depend on namespace, ident, and cardinality.

If JSON output strips namespace semantics, CLI machine output no longer reflects the graph-native model accurately.

## Current implementation baseline

The current non-direct-pass runtime path is:

```text
CLI command execution
  -> /src/main/logseq/cli/transport.cljs transport/invoke
  -> POST /v1/invoke on db-worker-node
  -> db-worker-node returns {:ok true :resultTransit "..."}
  -> CLI decodes transit into Clojure data
  -> /src/main/logseq/cli/format.cljs format-result ->json
  -> JSON stringify for stdout
```

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` keeps `resultTransit` for `directPass=false`, which is good and should remain unchanged.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` currently serializes machine output with `clj->js`, which is the lossy boundary we need to replace.

`list property` currently has a JSON-only key remap (`db/cardinality` to `cardinality`) that also weakens namespace semantics.

Shell completion generation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/completion_generator.cljs` currently reads flat keys like `title` from JSON output.

`cli-e2e` non-sync specs currently assert many flat JSON paths such as `[:data :items 0 :title]`.

## Target JSON contract

JSON output must preserve canonical key namespaces whenever the source map key is a namespaced keyword.

The canonical key form is string `namespace/name` in JSON object keys.

Unqualified keyword keys remain plain strings like `status`, `data`, and `message`.

String keys already present in data must remain unchanged.

Keyword values that represent idents must preserve namespace text in machine output.

The output contract should prioritize semantic correctness over legacy flat-key convenience.

### Contract examples

| Source key or value | Current JSON behavior | Target JSON behavior |
| --- | --- | --- |
| `:block/title` key | `"title"` | `"block/title"` |
| `:logseq.property/title` key | `"title"` | `"logseq.property/title"` |
| `:db/id` key | `"id"` | `"db/id"` |
| `:db/cardinality` key | `"cardinality"` in list-property path | `"db/cardinality"` |
| ident value like `:logseq.class/Tag` | lossy/ambiguous stringification in machine output | namespace-preserving machine string |

## Scope and non-goals

In scope is `--output json` machine output behavior for CLI command results.

In scope is preserving namespaced semantics for nested maps, vectors, and mixed payloads.

In scope is keeping `--output edn` unchanged as already semantically rich.

In scope is preserving current `db-worker-node` transit invoke protocol for non-direct-pass methods.

Out of scope is redesigning command-specific domain schemas unrelated to namespace loss.

Out of scope is changing human output formatting.

Out of scope is adding new graph schema attributes.

## Testing Plan

I will follow `@test-driven-development` and write failing tests before implementation.

I will add formatter unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that assert namespaced key preservation in JSON output for nested maps.

I will add a collision test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that includes both `:block/title` and `:logseq.property/title` and verifies both keys survive in JSON output simultaneously.

I will add tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` asserting `:db/id`, `:db/ident`, and `:db/cardinality` are emitted as namespaced JSON keys.

I will add a regression test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` ensuring UUID conversion still emits strings and does not regress while changing JSON key conversion.

I will add CLI e2e expectation updates in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` for JSON paths that currently rely on flat keys, switching them to namespaced paths where the source keys are namespaced.

I will add or update completion-related tests for `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/completion_generator.cljs` to ensure JSON key path usage remains correct when page titles are read from `block/title`.

I will keep existing db-worker-node invoke contract tests green in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` to confirm no protocol regressions in `resultTransit` handling.

NOTE: I will write *all* tests before I add any implementation behavior.

## Architecture sketch

```text
db-worker-node (unchanged transit contract)
  /v1/invoke -> {:ok true :resultTransit "..."}

logseq-cli transport
  decode transit -> Clojure data with keyword keys

logseq-cli format
  semantic JSON normalizer
  keyword keys -> namespaced key strings
  keyword ident values -> namespace-preserving machine strings
  UUID -> string

stdout JSON
  canonical namespaced keys for graph-native parsing
```

## Implementation plan

1. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` and identify all JSON-path helpers currently used by `->json`.

2. Add a RED formatter test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that fails under current flattening for a map containing both `:block/title` and `:logseq.property/title`.

3. Run the focused formatter test and confirm it fails for the expected key collision reason.

4. Add a RED formatter test asserting list-property JSON exposes `db/cardinality` instead of only `cardinality`.

5. Run focused tests and confirm failure before implementation.

6. Add a RED formatter test asserting namespaced id key preservation for `:db/id` and `:db/ident` in JSON output.

7. Run focused tests and confirm failure before implementation.

8. Implement a JSON key conversion helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` that maps keyword keys to canonical JSON key strings using full namespace.

9. Implement a JSON value normalization helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` that preserves namespace text for ident-like keyword values and keeps UUID string conversion.

10. Replace direct `clj->js` serialization in `->json` with the new semantic JSON normalization pipeline.

11. Remove or adjust `list-property` JSON-only remap in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` so canonical namespaced key output is preserved.

12. Run formatter tests and ensure new JSON contract tests pass.

13. Review `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/completion_generator.cljs` and update JSON extraction paths from flat keys to namespaced keys where required.

14. Add or update completion generator tests to verify title extraction still works using namespaced JSON keys.

15. Run focused completion-related tests and ensure green results.

16. Update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` JSON path assertions that currently depend on flattened keys.

17. Run `bb -f /Users/rcmerci/gh-repos/logseq/cli-e2e/bb.edn test --skip-build` and verify non-sync CLI e2e passes with namespaced JSON paths.

18. Update machine output documentation in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to describe namespaced JSON key behavior and migration examples.

19. Add a migration table in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` mapping old flat keys to new canonical namespaced keys.

20. Re-run focused formatter and e2e tests after docs-aligned contract updates.

21. Run `bb dev:test -v logseq.cli.format-test` for full formatter regression.

22. Run `bb dev:test -v frontend.worker.db-worker-node-test` to ensure transport protocol behavior remains unchanged.

23. Run `bb dev:lint-and-test` for final regression verification.

## File-by-file change map

| File | Change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` | Add semantic JSON key/value serializer and switch `->json` to it. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` | Add collision and namespaced-key JSON contract tests. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/completion_generator.cljs` | Update JSON key lookup paths for namespaced key contract. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Update JSON path assertions to namespaced key paths. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document canonical namespaced JSON output and migration guidance. |

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.cli.format-test` | New and existing formatter tests pass, including namespaced key coverage. |
| `bb -f cli-e2e/bb.edn test --skip-build` | Non-sync CLI e2e spec passes with updated JSON paths. |
| `bb dev:test -v frontend.worker.db-worker-node-test` | db-worker-node invoke contract remains green. |
| `bb dev:lint-and-test` | Repository lint and unit/integration checks remain green. |

## Edge cases

A payload map may contain both namespaced and unqualified keys with the same leaf name.

A payload map may contain multiple namespaced keys sharing the same leaf name across different namespaces.

Nested maps inside vectors and vectors inside maps must preserve key semantics recursively.

Keyword values that are real user strings in data must not be mis-typed by the serializer.

String keys containing `/` must remain unchanged and must not be reinterpreted as keywords.

`doctor` and auth outputs with simple keys should remain stable.

Graph info `kv` already uses string keys like `logseq.kv/schema-version` and must remain unchanged.

## Rollout and compatibility notes

This change modifies machine output key names for JSON consumers that rely on flat keys.

Internal completion scripts and cli-e2e specs must be migrated in the same change set.

CLI docs must include a key migration table to avoid silent script breakage.

If release policy requires a compatibility bridge, introduce a temporary opt-in or opt-out key mode as a follow-up decision.

## Testing Details

The most important behavioral tests are output-level assertions on actual JSON strings parsed back into maps, not helper internals.

Collision tests must prove we can simultaneously represent `:block/title` and `:logseq.property/title` in one JSON object.

E2E tests must confirm real CLI commands still work for scripting with updated key paths in shell-driven scenarios.

Protocol safety is verified by keeping db-worker-node invoke tests unchanged and green, demonstrating this plan does not alter transit transport semantics.

## Implementation Details

- Keep `db-worker-node` non-direct-pass invoke contract unchanged.
- Fix semantic loss only at CLI JSON formatting boundary.
- Convert keyword keys to canonical namespaced JSON keys.
- Preserve UUID string conversion behavior.
- Preserve namespace text in ident-like keyword values.
- Remove JSON-only flattening remaps that conflict with canonical namespaced contract.
- Update completion generator JSON key lookup paths.
- Update cli-e2e JSON path expectations.
- Update CLI docs with migration mapping.
- Validate with formatter tests, cli-e2e, and full lint-and-test.

## Decisions

`--output json` will switch directly to namespaced keys as the default behavior with no compatibility mode for legacy flat keys.

Keyword and ident values in JSON output will be serialized as plain namespace-preserving strings, without type-tag objects.

## Question

None at this stage.

---
