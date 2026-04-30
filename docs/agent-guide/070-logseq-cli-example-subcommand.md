# Logseq CLI `example` Subcommand Implementation Plan

Goal: Add a new `example` command group so users can ask for runnable command examples by command path or command prefix, for example:
- `logseq example upsert page`
- `logseq example upsert`
- `logseq example show`
- `logseq example search block`

Phase 1 scope is limited to **all commands in the current `Graph Inspect and Edit` group**.

Architecture: Keep this feature CLI-only in phase 1. Reuse command metadata already defined in `logseq-cli` command entries (`:examples`) and do not add any new `db-worker-node` invoke methods.

Tech Stack: ClojureScript, `babashka.cli` dispatch table, existing `logseq.cli.command.*` entry model, existing formatter/completion/test stack.

Related:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/query.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/completion_generator.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

## Problem statement

Today users can see examples only via `--help` on each specific command entry.

That creates two UX gaps:
1. There is no dedicated way to request examples directly by command path.
2. There is no single command namespace for future automation/docs workflows that want examples on demand.

We need `example` as a first-class command group that resolves an existing command path and prints curated example lines.

## Current baseline

- Command registration is centralized in `src/main/logseq/cli/commands.cljs` with a single dispatch table built from `command/*` namespaces.
- Command help rendering already supports per-entry `:examples` metadata through `logseq.cli.command.core/command-summary`.
- `Graph Inspect and Edit` currently includes top-level commands:
  - `list`
  - `upsert`
  - `remove`
  - `query`
  - `search`
  - `show`
- `db-worker-node` is an HTTP invoke daemon with no concept of CLI examples; this feature does not require worker protocol changes.

## Phase 1 target coverage (Graph Inspect and Edit)

Phase 1 must support `logseq example <target...>` for all of these command paths:

| Group | Target command path |
| --- | --- |
| list | `list page`, `list tag`, `list property` |
| upsert | `upsert block`, `upsert page`, `upsert tag`, `upsert property` |
| remove | `remove block`, `remove page`, `remove tag`, `remove property` |
| query | `query`, `query list` |
| search | `search block`, `search page`, `search property`, `search tag` |
| show | `show` |

Additionally, phase 1 supports group-level prefix selectors for covered groups (`example list`, `example upsert`, `example remove`, `example query`, `example search`, `example show`).

## Target UX

### Main usage

```text
logseq example <command-or-prefix...>
```

Examples:

```text
logseq example upsert page
logseq example upsert
logseq example show
logseq example search block
```

Selector semantics:
- Exact command path: `example upsert page` returns examples only for `upsert page`.
- Prefix command path: `example upsert` returns merged examples for all covered `upsert *` subcommands in a stable order.

### Help behavior

- `logseq example` shows available phase-1 example selectors.
- `logseq example <target...> --help` shows command help for that example selector.
- `logseq example upsert --help` and `logseq example upsert page --help` are both valid.

### Output behavior

- Human output: clear text block with selected target and example lines.
- JSON/EDN output (**required**): include machine-readable fields, at minimum:
  - `selector` (requested selector, e.g. `"upsert"` or `"upsert page"`)
  - `matched-commands` (resolved command paths)
  - `examples` (flattened example lines)
  - `message` (human-readable summary string)

## Design

### 1) Create an `example` command namespace

Add a new namespace, e.g. `src/main/logseq/cli/command/example.cljs`, responsible for:
- declaring phase-1 target selector (Graph Inspect and Edit only)
- generating mirrored `example` entries from existing command paths
- validating requested target path
- building non-worker action payloads
- executing as pure local logic

### 2) Mirror both exact paths and prefix selectors

Use generated entries like:
- exact: `example upsert page`, `example show`, `example search block`
- prefix: `example upsert`, `example list`, `example remove`, `example query`, `example search`

This keeps behavior aligned with existing dispatch/help/completion generation while also supporting grouped output (`example upsert`) without introducing ad-hoc free-form parsing.

### 3) Reuse `:examples` metadata as source of truth

For each supported target command entry:
- pull `:examples` from the original entry metadata
- for exact selectors, return only that entry's examples
- for prefix selectors, aggregate examples from all matched covered subcommands

If any matched target has missing/empty examples, return a clear CLI error (new code such as `:missing-examples`) so metadata coverage remains enforceable.

### 4) Ensure metadata completeness for phase-1 targets

Add/normalize `:examples` metadata on phase-1 target entries where missing (notably `query list`).

### 5) Integrate into central command table

In `commands.cljs`:
- build a `base-table` from existing command namespaces
- generate exact-selector and prefix-selector `example` entries from that base table
- create final `table = base-table + example entries`

Then wire command handling for example commands in:
- parse/finalize branch (if needed)
- `build-action`
- `execute`

No server ensure/invoke is needed for `example` actions.

### 6) Update top-level help groups

In `command/core.cljs` top-level summary groups, include `example` under `Utilities` so the command is visible in `logseq --help`.

### 7) Completion support

Because example commands are mirrored table entries, existing completion generation should include them automatically once table wiring is updated.

## Testing plan (TDD)

1. Add failing parser/help tests in `src/test/logseq/cli/commands_test.cljs`:
   - `example` group help appears
   - exact selectors: `example upsert page`, `example show`, `example search block`
   - prefix selectors: `example upsert`, `example list`, `example query`
   - unknown/uncovered selector returns expected error

2. Add focused tests for new namespace (new test file):
   - entry generation from base table
   - phase-1 filtering only allows Graph Inspect and Edit targets
   - missing examples metadata handling

3. Extend completion tests in `src/test/logseq/cli/completion_generator_test.cljs`:
   - example group appears
   - mirrored example command functions are generated

4. Add format assertions for required structured output:
   - human output includes selector, matched commands, and example lines
   - json/edn include `selector`, `matched-commands`, `examples`, and `message`

5. Extend CLI e2e inventory/spec:
   - add `example` command scope and selectors
   - add non-sync cases for representative exact and prefix selectors (`example show`, `example upsert page`, `example upsert`, `example search block`)

6. Run focused and full checks:
   - `bb dev:test -v logseq.cli.commands-test`
   - `bb dev:test -v logseq.cli.completion-generator-test`
   - `bb -f cli-e2e/bb.edn test --skip-build`
   - `bb dev:lint-and-test`

## File-by-file change map

| File | Change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/example.cljs` | New namespace: target filtering, mirrored entries, build/execute helpers. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Build base table, append generated example entries, wire build/execute for example actions. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` | Add `example` to top-level help groups (Utilities). |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/query.cljs` | Add missing `:examples` metadata for `query list` (if absent). |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` | Add explicit example formatting branch for human and structured (`json`/`edn`) output contract. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add parse/help/build/execute coverage for `example` commands. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/example_test.cljs` | New unit tests for entry generation and target validation. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Assert completion output includes example command tree. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Add `example` command inventory coverage. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Add non-sync runtime cases for representative example commands. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document `example` command usage and phase-1 coverage. |

## db-worker-node impact

No `db-worker-node` API, transport, or thread-api changes are required in phase 1.

`example` is resolved and rendered entirely in CLI command metadata/action flow.

## Rollout / extension plan

- Phase 1 (this plan): only Graph Inspect and Edit coverage.
- Phase 2: extend target selector to include Graph Management, Authentication, and Utilities commands.
- Keep coverage policy explicit in tests so newly added CLI commands either:
  - automatically receive `example` coverage, or
  - are intentionally excluded with a documented reason.

## Open questions

1. For commands with sensitive placeholders, should we define a metadata convention to mark examples as redacted/non-runnable?
