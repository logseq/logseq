# Logseq CLI Update Command (Move Refactor)

## Summary
Introduce a new `update` CLI command that subsumes the current `move` command and adds tag/property updates. The new command keeps all existing move capabilities/options, makes move targets optional (no target means no move), and adds update/remove semantics for tags and properties. The plan is grounded in current `logseq-cli` parsing/execution and db-worker-node outliner ops.

## Goals
- Replace `move` command behavior with `update` while keeping all current move options and semantics.
- Allow `update` to move blocks *and/or* update tags/properties in one command.
- Support new options:
  - `--update-tags`, `--update-properties`
  - `--remove-tags`, `--remove-properties`
- Reuse tag/property parsing and resolution rules from `add block`:
  - Identifiers accept `db/id`, `db/ident`, `block/title`.
  - `--update-tags` and `--update-properties` accept the same EDN format as `add block` `--tags`/`--properties`.
  - `--remove-tags` and `--remove-properties` accept EDN vectors of tag/property identifiers.

## Non-goals
- Changing db-worker-node APIs or introducing new outliner ops.
- Expanding `update` beyond blocks (no page-level update scope in this iteration).
- Changing move semantics or target resolution.

## Background: Current Move Command
- CLI move implementation lives in `src/main/logseq/cli/command/move.cljs`.
- It requires a source (`--id` or `--uuid`) and a target (`--target-id`, `--target-uuid`, or `--target-page`).
- Execution uses `:thread-api/apply-outliner-ops` with `[:move-blocks ...]`.
- Move output formatting in `src/main/logseq/cli/format.cljs` uses `format-move-block`.

## Proposed Behavior (Update Command)
### Required/Optional Inputs
- **Source is required**: one of `--id` or `--uuid`.
- **Move targets are optional**:
  - `--target-page`, `--target-uuid`, `--target-id`, `--pos` are optional.
  - If no target is provided, no move occurs and the command only updates tags/properties.
  - If a target is provided, move executes with the same semantics as today.
- **Update/remove options are optional**:
  - `--update-tags` (EDN vector, same as `add block --tags`)
  - `--update-properties` (EDN map, same as `add block --properties`)
  - `--remove-tags` (EDN vector of tag identifiers)
  - `--remove-properties` (EDN vector of property identifiers)

### Validation Rules
- Only one source selector is allowed: `--id` or `--uuid`.
- Only one target selector is allowed: `--target-id`, `--target-uuid`, or `--target-page`.
- `--pos sibling` is only valid when the target is a block (not a page), same as `move`.
- At least one of the following must be provided: target (move) or update/remove options.
- `--update-tags` and `--update-properties` accept the same EDN grammar and validations as in `add`.
- `--remove-tags` and `--remove-properties` must be non-empty vectors (EDN), with identifiers validated similarly to add.

### Execution Semantics
- Resolve source block to `db/id` using existing move helpers.
- If move target provided, resolve target entity using existing move helpers and compute `pos` opts.
- Tag/property updates use current outliner ops (no new db-worker changes):
  - **Add/update tags**: `[:batch-set-property [block-ids :block/tags tag-id {}]]` for each tag.
  - **Add/update properties**: `[:batch-set-property [block-ids property-id value {}]]`.
  - **Remove tags**: `[:batch-delete-property-value [block-ids :block/tags tag-id]]`.
  - **Remove properties**: `[:batch-remove-property [block-ids property-id]]`, with property resolution aligned to `add` (built-in/public property rules).
- Combine operations into a single `apply-outliner-ops` call when possible to keep updates atomic and reduce roundtrips.

## Design and Implementation Plan
### 1) Create `update` command module
- New file: `src/main/logseq/cli/command/update.cljs`.
- Start from `move.cljs` and expand the spec to include update/remove tag/property options.
- Extract shared helpers from `move.cljs` (e.g., `resolve-source`, `resolve-target`, `pos->opts`, `invalid-options?`) into a small shared namespace or move into `update.cljs`.

### 2) Reuse tag/property parsing and resolution from `add`
- Refactor `src/main/logseq/cli/command/add.cljs` to expose reusable helpers for:
  - `parse-tags-option`, `parse-properties-option` (for update)
  - `resolve-tags`, `resolve-properties` (for update)
  - Tag/property identifier normalization functions if needed for remove vectors
- Keep the parsing behavior exactly consistent with `add block`.
- Add new helper in `add` (or a shared namespace) to parse **remove vectors**:
  - `parse-tags-vector-option` (vector of tag identifiers)
  - `parse-properties-vector-option` (vector of property identifiers)

### 3) Update top-level command registry
- Add `update` to `src/main/logseq/cli/commands.cljs` table and summary groups.
- Remove `move` from the command registry and help output (no alias/compat).

### 4) Update parse/validation logic
- In `finalize-command` (`src/main/logseq/cli/commands.cljs`):
  - Add `update`-specific validation for sources, targets, and update/remove options.
  - Reuse `update-command/invalid-options?`.
  - Allow missing target when update/remove options are present.
  - Keep error messaging aligned with existing CLI patterns.

### 5) Implement update action building
- `build-action` returns a combined action with:
  - `:type :update-block`
  - `:id`/`:uuid` for source, optional target selectors, `:pos` default `first-child` when move is requested
  - `:update-tags`, `:update-properties`, `:remove-tags`, `:remove-properties`
- `execute-update`:
  - Resolve source; resolve target only when move is requested.
  - Build a vector of outliner ops, in order: move (if present), then remove tags/properties, then update/add tags/properties (order can be adjusted if needed for predictable results).
  - Use `:thread-api/apply-outliner-ops` once with all ops.

### 6) Update output formatting
- `src/main/logseq/cli/format.cljs`:
  - Add `format-update-block` to describe move + updates in a concise line.
  - Update dispatcher to handle `:update-block`.

### 7) Tests
- Unit tests in `src/test/logseq/cli/commands_test.cljs`:
  - Parsing: `update` accepts `--id/--uuid`, optional target, and new options.
  - Validation: missing source, invalid target selector combinations, invalid pos, invalid EDN options.
  - Ensure that `update` without target but with update/remove options is accepted.
- Format tests in `src/test/logseq/cli/format_test.cljs` for `:update-block`.
- Integration tests in `src/test/logseq/cli/integration_test.cljs`:
  - Move-only update should behave the same as current `move`.
  - Update tags/properties on an existing block.
  - Remove tags/properties and validate via `show` or query.

## Open Questions
- If only `--pos` is provided without any target selector, return the error: `--pos is only valid when a target is provided`.

## Risks / Edge Cases
- If tag/property parsing rules diverge from `add`, user experience becomes inconsistent. Refactor shared parsing to avoid drift.
- Combining move and property updates in one `apply-outliner-ops` call needs to preserve correct operation order; keep move first unless property updates depend on position.
- Ensure non-page validation for source and block target remains intact when refactoring.

## Implementation Checklist (Concrete File Touches)
- Add: `src/main/logseq/cli/command/update.cljs`.
- Update: `src/main/logseq/cli/commands.cljs` (table, validation, action dispatch).
- Update: `src/main/logseq/cli/command/core.cljs` (top-level summary group list to include update).
- Update: `src/main/logseq/cli/format.cljs` (formatting for update).
- Update: `src/test/logseq/cli/commands_test.cljs`.
- Update: `src/test/logseq/cli/format_test.cljs`.
- Update: `src/test/logseq/cli/integration_test.cljs`.

## Verification
- Run unit tests: `bb dev:test -v logseq.cli.commands-test`.
- Run format tests: `bb dev:test -v logseq.cli.format-test`.
- Run CLI integration tests (move/update subset): `bb dev:test -v logseq.cli.integration-test`.
- Optional full suite: `bb dev:lint-and-test`.
