# Logseq CLI `upsert task` Option Surface Cleanup Plan

Goal: simplify `upsert task` into a task-focused command by removing generic tag/property mutation options, adding first-class `--deadline` / `--scheduled` options, and standardizing explicit clear semantics with `--no-status`, `--no-priority`, `--no-scheduled`, and `--no-deadline`.

Architecture: keep the current `logseq-cli -> parse/build -> execute -> transport/invoke -> db-worker-node` flow, and **do not add new thread-api unless strictly necessary**.

Architecture: this change should be implemented entirely in existing CLI command/build/execute logic (`upsert task`) and existing mutation endpoint (`:thread-api/apply-outliner-ops`), with no new db-worker-node API contract.

Tech Stack: ClojureScript, `babashka.cli`, existing command modules under `src/main/logseq/cli/command/*`, existing CLI docs/e2e specs.

Related:
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/078-logseq-cli-task-subcommands.md`
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/080-logseq-cli-status-option-cleanup.md`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

## Problem statement

Current `upsert task` still exposes generic mutation options:

- `--update-tags`
- `--update-properties`
- `--remove-tags`
- `--remove-properties`

This overlaps with `upsert block`, which already serves as the general-purpose surface for tag/property updates/removals.

At the same time, task-specific scheduling fields are missing as first-class options:

- `--scheduled`
- `--deadline`

The command should become more cohesive:

- task semantics stay in `upsert task` (status, priority, scheduled, deadline, and automatic `#Task` attachment)
- generic tag/property mutations are done via `upsert block`
- set/clear semantics are explicit and paired:
  - set via `--status` / `--priority` / `--scheduled` / `--deadline`
  - clear via `--no-status` / `--no-priority` / `--no-scheduled` / `--no-deadline`

## Current baseline from implementation

### 1) `upsert task` currently includes generic tag/property options

`src/main/logseq/cli/command/upsert.cljs` currently defines these options in `upsert-task-spec`:

- `:update-tags`
- `:update-properties`
- `:remove-tags`
- `:remove-properties`

### 2) `upsert task` execute path currently applies generic tag/property ops

`execute-upsert-task-ops!` currently:

- resolves update/remove tags and properties
- merges task overrides (`status`, `priority`) into update properties
- supports remove operations and guards against removing `#Task`

### 3) Runtime status validation already uses existing `:thread-api/q`

Status validation now relies on:

- `src/main/logseq/cli/command/task_status.cljs`
- query via existing `:thread-api/q`

This should remain unchanged (no new thread-api needed).

### 4) Task list/output already models `scheduled` and `deadline`

Current list/format paths already include:

- `:logseq.property/scheduled`
- `:logseq.property/deadline`

So adding write options in `upsert task` aligns with existing read/output behavior.

## Scope

In scope:

1. Remove from `upsert task` option surface:
   - `--update-tags`
   - `--update-properties`
   - `--remove-tags`
   - `--remove-properties`
2. Add to `upsert task` option surface:
   - `--scheduled`
   - `--deadline`
   - `--no-status`
   - `--no-priority`
   - `--no-scheduled`
   - `--no-deadline`
3. Keep `status` runtime validation behavior as-is for `--status <value>` inputs (graph-derived values via existing `:thread-api/q`).
4. Add explicit clear semantics: `--no-status`, `--no-priority`, `--no-scheduled`, and `--no-deadline` clear corresponding properties.
5. Define and enforce conflict behavior: passing both set and clear for the same field (for example `--status X` + `--no-status`) is invalid and must return a clear validation error.
6. Add migration guidance so removed task options point users to `upsert block`.
7. Update tests/docs/e2e inventory to match the new option contract.

Out of scope:

- Any new thread-api endpoint.
- Any schema/property/class additions.
- Reworking `upsert block` behavior.
- Introducing new date parser/normalizer infrastructure outside `upsert task` needs.

## Design decisions

### Decision A: `upsert task` becomes task-focused only

Keep task-centric options:

- selectors/targets: `--id`, `--uuid`, `--page`, `--content`, `--target-id`, `--target-uuid`, `--target-page`, `--pos`
- task fields: `--status`, `--priority`, `--scheduled`, `--deadline`

Remove generic options (`update/remove tags/properties`) from `upsert task`.

### Decision B: Generic tag/property modifications are delegated to `upsert block`

When users need:

- `--update-tags`
- `--update-properties`
- `--remove-tags`
- `--remove-properties`

they should use `upsert block` on the target block/page id/uuid.

### Decision C: Keep status runtime validation architecture, with explicit `--no-status` clear bypass

`status` should continue using the existing runtime path for `--status <value>`:

- query available status values from current graph via `:thread-api/q`
- resolve/validate in `task_status.cljs`

For `--no-status`, skip value resolution and clear `:logseq.property/status` directly.

No additional thread-api is required.

### Decision D: Paired set/clear options for task fields (`--field` and `--no-field`)

`upsert task` will support direct set semantics:

- `--status <value>` -> `:logseq.property/status` (resolved against graph statuses at runtime)
- `--priority <value>` -> `:logseq.property/priority`
- `--scheduled <value>` -> `:logseq.property/scheduled`
- `--deadline <value>` -> `:logseq.property/deadline`

And explicit clear semantics:

- `--no-status` clears `:logseq.property/status`
- `--no-priority` clears `:logseq.property/priority`
- `--no-scheduled` clears `:logseq.property/scheduled`
- `--no-deadline` clears `:logseq.property/deadline`

Conflict rule: passing both set and clear for the same field in one command (for example `--status TODO` with `--no-status`) is invalid and must fail with a clear validation error.

Implementation note: treat `--no-*` flags as explicit clear intent, and keep using existing mutation ops (`:batch-set-property` for set, `:batch-remove-property` for clear) without adding a new thread-api or a new global datetime validation subsystem.

## Proposed implementation plan (TDD-first)

1. Add RED parser tests asserting `upsert task` rejects removed options (`--update-tags`, `--update-properties`, `--remove-tags`, `--remove-properties`) with `:invalid-options`.
2. Add RED parser/build tests asserting `upsert task` accepts `--scheduled` and `--deadline` in create/page/update modes.
3. Add RED parser/build tests for clear semantics: `--no-status`, `--no-priority`, `--no-scheduled`, and `--no-deadline` are accepted and encoded as clear-intent (not invalid-option).
4. Add RED parser/build tests for conflict behavior: set and clear for the same field in one command is invalid (`--status TODO` + `--no-status`, `--priority A` + `--no-priority`, etc.).
5. Add RED execute tests asserting `upsert task`:
   - writes `status`/`priority`/`scheduled`/`deadline` via batch property set ops,
   - clears status/priority/scheduled/deadline via batch property remove ops when corresponding `--no-*` flag is present,
   - still ensures `#Task` tag attachment.
6. Update `upsert-task-spec` in `src/main/logseq/cli/command/upsert.cljs`:
   - remove generic tag/property options
   - add `:scheduled`, `:deadline`, `:no-status`, `:no-priority`, `:no-scheduled`, and `:no-deadline` options
   - refresh examples to include paired set/clear usage.
7. Refactor `build-task-action` in `upsert.cljs`:
   - remove parsing/build wiring for removed generic options
   - parse `--no-*` flags into clear intent for task properties
   - validate set/no conflicts per field
   - include scheduled/deadline in task property overrides map
   - keep existing selector/target conflict validation.
8. Refactor `execute-upsert-task-ops!` in `upsert.cljs`:
   - remove user-driven update/remove tag/property resolution paths tied to removed options
   - keep automatic `#Task` tag set
   - apply only task property writes (`status`, `priority`, `scheduled`, `deadline`)
   - add task property clear ops for `status`/`priority`/`scheduled`/`deadline` when clear intent is present.
9. Update migration guidance in `src/main/logseq/cli/commands.cljs` so unknown upsert-task legacy options map to actionable messages (e.g. use `upsert block --update-properties`).
10. Update completion/spec tests (`completion_generator_test.cljs`) to verify the new `upsert task` option surface.
11. Update command behavior tests (`commands_test.cljs`, `upsert_test.cljs`) to remove old task-option assumptions and add paired set/clear assertions (including conflicts).
12. Update CLI docs (`docs/cli/logseq-cli.md`) to reflect the new `upsert task` contract, explicit `--no-*` clear semantics, conflict behavior, and migration to `upsert block` for generic tag/property mutation.
13. Update CLI e2e inventory/cases (`cli-e2e/spec/non_sync_inventory.edn`, `cli-e2e/spec/non_sync_cases.edn`) to remove deprecated task options and add cases covering `--scheduled` / `--deadline`, the full `--no-*` clear surface, and set/no conflict failures.
14. Run focused tests and then broader checks.

## Files expected to change

Core implementation:

- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`

Tests:

- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/upsert_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`

Docs/e2e:

- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`

Expected non-changes (unless implementation reveals an actual blocker):

- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs`

## Testing plan

Follow `@test-driven-development` for this feature.

Focused verification commands:

- `bb dev:test -v logseq.cli.commands-test`
- `bb dev:test -v logseq.cli.command.upsert-test`
- `bb dev:test -v logseq.cli.completion-generator-test`
- `bb -f cli-e2e/bb.edn test --skip-build` (if e2e specs changed)
- `bb dev:lint-and-test`

## Risks and mitigations

Risk: existing scripts using removed `upsert task` generic options break.

Mitigation:

- add migration guidance in parse errors
- update docs with explicit `upsert block` replacements
- include e2e coverage for migration-safe paths

Risk: ambiguity of accepted datetime string format for `--scheduled`/`--deadline`.

Mitigation:

- document expected input examples clearly
- keep first implementation pass-through and avoid overfitting parser logic
- add follow-up validation enhancement only if real failures appear

Risk: users may pass both set and clear options for the same field (for example `--status TODO` and `--no-status`) and expect deterministic precedence.

Mitigation:

- define set/no-same-field combinations as explicit validation errors
- add parser/build/execute tests locking conflict detection across all four fields
- include explicit conflict examples in help/docs

Risk: refactor accidentally drops guaranteed `#Task` tag attachment.

Mitigation:

- execute-level tests must assert task tag set op remains present for create/page/update modes

## Acceptance criteria

1. `upsert task` no longer exposes `--update-tags`, `--update-properties`, `--remove-tags`, `--remove-properties`.
2. `upsert task` supports set semantics via `--status`, `--priority`, `--scheduled`, and `--deadline`.
3. `upsert task` supports explicit clear semantics via `--no-status`, `--no-priority`, `--no-scheduled`, and `--no-deadline`.
4. Passing both set and clear options for the same field in one command is rejected with a clear validation error.
5. `upsert task` continues to support status runtime validation using existing `:thread-api/q` flow for `--status <value>` inputs.
6. Generic tag/property modifications for task nodes are clearly migrated to `upsert block` (guidance + docs).
7. No new thread-api is introduced unless a hard blocker is discovered.
8. Unit tests and CLI e2e specs are updated and passing for changed behavior.

## Open question

No blocking question.

---
