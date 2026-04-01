# Logseq CLI `debug` Command Implementation Plan

Goal: Add a new `debug` command group with `debug pull` for low-level Datascript entity inspection via `db-worker-node`.

Goal: `debug pull` must support `--graph <name>` or default to current graph resolution already used by existing commands.

Goal: In global help (`logseq --help`), show `debug` under `Utilities` and do not show `debug` subcommands (same top-level-only behavior as `example`).

Architecture: Keep command parsing, validation, and output behavior in `logseq-cli`, and reuse existing `db-worker-node` invoke API `:thread-api/pull` with selector `[*]`.

Architecture: Avoid adding new worker thread APIs unless we discover a hard blocker; current worker already exposes `:thread-api/pull` and supports lookup refs.

Tech Stack: ClojureScript, `babashka.cli` dispatch table, existing command pipeline in `logseq.cli.commands` (`parse-args -> build-action -> execute`), and existing CLI e2e spec harness.

Related:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/id.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/transport.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`

## Problem statement

Today we have user-facing inspection commands (`show`, `query`), but no direct debug command that exposes a raw `pull` for a single entity selector path.

For debugging schema/data issues, we need a predictable command that can fetch one entity using either db id, uuid, or ident and return raw entity data.

The requested command is:

```text
logseq debug pull --id <db-id>
logseq debug pull --uuid <uuid>
logseq debug pull --ident <db-ident>
```

with selector fixed to `[*]` and data source being the current graph DB served by `db-worker-node`.

## Requested behavior contract

| Area | Requirement |
| --- | --- |
| Command shape | Add top-level `debug` group with subcommand `pull`. |
| Graph selection | Accept `--graph` globally; if omitted, use current graph resolution (same as existing commands using `pick-graph`). |
| Target selector | `debug pull` accepts exactly one of `--id`, `--uuid`, `--ident`. |
| Pull behavior | Execute `:thread-api/pull` with selector `[*]` and resolved lookup value. |
| Global help | `logseq --help` shows `debug` in `Utilities` and does not list `debug pull` there. |
| Group help | `logseq debug` and `logseq debug --help` show `debug pull` as subcommand. |

## Current baseline

- Top-level help grouping is implemented in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` with `Utilities` currently configured as top-level-only and already hiding `example` subcommands.
- Graph fallback is implemented centrally via `logseq.cli.command.core/pick-graph` and is already used in `build-action` for graph-scoped commands.
- `db-worker-node` already provides `:thread-api/pull` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`:
  - accepts `(repo selector id)`
  - supports integer ids and lookup refs (e.g. `[:db/ident kw]`, `[:block/uuid uuid]`)
- Existing command modules (`show`, `query`) already demonstrate ensure-server + invoke flow and can be reused as implementation patterns.

Conclusion: this feature should be mostly CLI-side wiring; worker protocol changes are likely unnecessary.

## CLI design proposal

### 1) New command namespace

Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/debug.cljs`.

Planned entry:
- `debug pull` (`:debug-pull`)

Planned command options:
- `--id` (db id)
- `--uuid` (UUID string)
- `--ident` (strict EDN keyword string, e.g. `:logseq.class/Tag`)

Global options (`--graph`, `--output`, etc.) continue to come from `command-entry` merged global spec.

### 2) Selector normalization

`debug pull` resolves exactly one lookup target:
- `--id` -> numeric entity id
- `--uuid` -> lookup ref `[:block/uuid <uuid>]`
- `--ident` -> lookup ref `[:db/ident <keyword>]`

Validation rules:
- exactly one of `--id`, `--uuid`, `--ident` is required
- reject multiple selectors with clear invalid-options message
- reject invalid uuid / invalid id / invalid ident formats
- `--ident` accepts only strict EDN keyword syntax with leading `:`

### 3) Action model

`build-action` output shape:

```clojure
{:type :debug-pull
 :repo <resolved repo>
 :lookup <id-or-lookup-ref>
 :selector '[*]}
```

`repo` resolution should reuse existing command pipeline behavior:
- `--graph` first
- then config current graph
- then repo fallback from config

### 4) Execute model

Execution pattern:
1. ensure server for repo (`cli-server/ensure-server!`)
2. invoke worker `:thread-api/pull` with `[repo selector lookup]`
3. return structured data payload (include selector metadata for traceability)

Suggested success payload:

```clojure
{:entity <pulled-entity>
 :lookup <normalized lookup>
 :selector '[*]}
```

For missing entity, return a clear typed error (e.g. `:entity-not-found`) instead of silently returning `nil`.

## Global help behavior plan

Update `top-level-summary` groups in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`:

- add `debug` to `Utilities` command set
- keep `:top-level-only? true` for `Utilities`
- add `desc-overrides` entry for `debug` so top-level help renders stable one-line description (instead of inheriting from `debug pull` text)

Expected top-level help effect:
- shows `debug`
- does not show `debug pull`
- remains consistent with current `example` visibility behavior

## Testing Plan (TDD)

I will follow `@test-driven-development` and write failing tests first.

### Phase 1: Parser and help RED tests

1. Extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`:
   - top-level help includes `debug`
   - top-level help does **not** include `debug pull`
   - `Utilities` section still lists `example` and `completion`
2. Add group-help tests:
   - `parse-args ["debug"]` returns help summary containing `debug pull`
3. Add parse success tests:
   - `debug pull --id 1`
   - `debug pull --uuid <uuid>`
   - `debug pull --ident :logseq.class/Tag`
4. Add parse failure tests:
   - no selector
   - multiple selectors
   - malformed id / uuid / ident

### Phase 2: Action and execute RED tests

5. Add build-action tests in `commands_test.cljs`:
   - uses `--graph` when provided
   - falls back to current graph from config when `--graph` omitted
   - returns missing-repo when neither explicit nor current graph exists
6. Add execute tests (new file suggested: `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/debug_test.cljs`):
   - verifies invoke contract `:thread-api/pull` with selector `[*]`
   - verifies id/uuid/ident normalization to lookup argument
   - verifies entity-not-found behavior

### Phase 3: GREEN implementation

7. Implement new namespace `command/debug.cljs` with entries + build + execute.
8. Wire into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`:
   - include `debug-command/entries` in base table
   - finalize-command validation branch for selector constraints
   - build-action case `:debug-pull`
   - execute case `:debug-pull`
9. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` top-level group config for `Utilities` to include `debug` (hidden subcommands at global help).

### Phase 4: Completion and e2e coverage

10. Update completion tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`:
    - includes `debug` group and `pull` subcommand completion.
11. Update inventory in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`:
    - add `:debug` scope with command `debug pull`
    - add options `--id`, `--uuid`, `--ident`
12. Add e2e cases in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`:
    - id-based pull
    - uuid-based pull
    - ident-based pull
    - one case proving current-graph fallback (no `--graph` on debug call after config/graph setup)

### Phase 5: Formatter and docs

13. Add explicit human formatting branch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` for `:debug-pull`:
    - pretty-print entity as EDN for readable debugging output
    - include compact header context (selector and lookup)
14. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` with `debug pull` usage and examples.

## File-by-file change map

| File | Planned change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/debug.cljs` | New command namespace (`entries`, validation helpers, `build-action`, `execute-debug-pull`). |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Register debug entries; add parse/finalize validation, build-action route, and execute dispatch. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` | Add `debug` under `Utilities` top-level-only group and description override to hide subcommands in global help. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` | Add explicit human formatter for debug output with pretty-printed EDN entity payload. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add parser/help/build coverage for debug command and utilities help visibility rules. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/debug_test.cljs` | New execute/normalization tests for debug pull invoke contract. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Add completion coverage for `debug pull`. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Add debug scope and option coverage metadata. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Add non-sync end-to-end cases for id/uuid/ident and graph fallback behavior. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document `debug pull` usage and selector examples. |

## db-worker-node impact

No new worker API is required for the requested scope.

Reason:
- `:thread-api/pull` already exists and already performs Datascript `d/pull`.
- selector `[*]` is legal and directly maps to requested debug behavior.
- lookup refs for `:db/ident` and `:block/uuid` are already supported by Datascript pull semantics.

Potential worker-side follow-up is only needed if we later want:
- multi-entity pull
- custom selectors from CLI input
- stricter nil/not-found error signaling at worker layer

## Edge cases to explicitly cover

| Scenario | Expected behavior |
| --- | --- |
| `debug pull` with no selector flags | Error: exactly one selector required. |
| `debug pull --id 1 --uuid ...` | Error: only one of `--id`, `--uuid`, `--ident` allowed. |
| `debug pull --ident logseq.class/Tag` (without leading `:`) | Error with explicit invalid ident message (`--ident` requires strict EDN keyword). |
| `debug pull` without `--graph` and no current graph configured | Error: missing repo/graph. |
| entity not found | Return typed error (`:entity-not-found`) instead of ambiguous success with nil. |
| `logseq --help` | Shows `debug` under Utilities, not `debug pull`. |

## Verification commands

```bash
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.command.debug-test
bb dev:test -v logseq.cli.completion-generator-test
bb -f cli-e2e/bb.edn test --skip-build
bb dev:lint-and-test
```

Expected outcome: parser/help behavior, invoke contract, completion, and e2e coverage all green.

## Resolved decisions

1. `--ident` accepts only strict EDN keyword input.
2. Not-found is a hard error (`:entity-not-found`).
3. Human output for `debug pull` uses pretty-printed EDN.