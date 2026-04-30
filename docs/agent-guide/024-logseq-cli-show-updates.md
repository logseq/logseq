# Logseq CLI Show Output & Linked References Options Plan

Goal: Update the `logseq show` command to (1) render the ID column in human output with lighter styling (matching tree glyphs), (2) include `:db/ident` on block entities in JSON/EDN output when present, and (3) add an option to toggle Linked References (default enabled).
Architecture: Keep the existing logseq-cli → db-worker-node HTTP transport and thread-api calls; adjust show command selectors and output formatting only.
Tech Stack: ClojureScript, babashka.cli, db-worker-node transport, Logseq pull selectors, CLI styling helpers.
Related: Builds on `logseq.cli.command.show` tree rendering and linked references fetch; see `docs/agent-guide/010-logseq-cli-show-linked-references.md` and `docs/agent-guide/023-logseq-cli-help-show-styling.md`.

## Problem Statement

The `show` command currently renders the ID column with the same styling as regular text, does not expose `:db/ident` in JSON/EDN output for blocks, and always fetches/prints Linked References. We need to make the ID column visually lighter, surface `:db/ident` when it exists, and add a switch to disable linked references (defaulting to true).

## Non-Goals

- Changing db-worker-node APIs or transport protocols.
- Altering the show command’s existing tree structure or block ordering.
- Changing JSON/EDN output structure beyond adding `:db/ident` when present.

## Current Behavior (Key Points)

- Human output is rendered by `tree->text` in `src/main/logseq/cli/command/show.cljs`, with tree glyphs styled via `style/dim` but IDs unstyled.
- JSON/EDN output pulls specific selectors via `tree-block-selector` / `linked-ref-selector` and strips only `:block/uuid`.
- Linked References are always fetched and rendered via `fetch-linked-references` + `tree->text-with-linked-refs`.

## Proposed Changes

1) **Lighter ID column in human output**
   - Style the padded ID column with the same dim styling used for tree glyphs.
   - Apply the change in `tree->text` so both root and child rows render IDs dimmed.

2) **Include `:db/ident` in JSON/EDN for blocks (when present)**
   - Add `:db/ident` to block pull selectors:
     - `tree-block-selector` (children)
     - `linked-ref-selector` (linked references)
     - root entity pulls in `fetch-tree` for `:id`, `:uuid`, and `:page`
   - No post-processing is required because absent attributes will not appear in the pulled maps.

3) **Optional Linked References (default true)**
   - Add a boolean option `--linked-references` to `show-spec`, defaulting to true.
   - Pass the option through `build-action` and into `build-tree-data`.
   - When disabled:
     - Skip `fetch-linked-references` entirely.
     - Omit the `Linked References` section from human output.
     - Omit `:linked-references` from JSON/EDN output.

## Implementation Plan

1) **Add show option wiring**
   - Update `show-spec` in `src/main/logseq/cli/command/show.cljs` with a new boolean option (choose name + description, note default true).
   - Extend `build-action` to include the option in `:action` (e.g., `:linked-references?`).
   - Update `invalid-options?` if needed for any new validation.

2) **Gate linked references fetching/rendering**
   - Update `build-tree-data` to honor the new option:
     - If enabled, keep current logic.
     - If disabled, skip `fetch-linked-references`, avoid UUID label resolution based on linked refs, and avoid `tree->text-with-linked-refs`.
   - Update `execute-show` to select `tree->text` vs `tree->text-with-linked-refs` based on the option.
   - Ensure JSON/EDN output omits `:linked-references` when disabled.

3) **Add `:db/ident` to selectors**
   - Update `tree-block-selector`, `linked-ref-selector`, and root entity pull vectors in `fetch-tree` to include `:db/ident`.
   - Ensure this does not add nil values (pull should omit missing attributes).

4) **Dim ID column in human output**
   - In `tree->text`, apply `style/dim` to the padded ID string (e.g., `pad-id` output) for both root and child rows.
   - Keep existing branch/prefix dim styling unchanged.

5) **Help output updates**
   - Ensure `logseq show --help` lists the new linked references option (covered automatically by `show-spec`).

## Testing Plan

- Update or add unit tests in:
  - `src/test/logseq/cli/format_test.cljs` to verify:
    - ANSI dim styling is applied to the ID column in human output when color is enabled.
    - No regressions in strip-ansi output.
  - `src/test/logseq/cli/commands_test.cljs` to verify:
    - `logseq show --help` includes the new linked references option.
- Add show-specific tests for JSON/EDN output:
  - Ensure `:db/ident` appears when present (use a stubbed tree map or test fixtures if available).
  - Ensure `:linked-references` is omitted when the option disables them.

## Edge Cases

- Blocks with no `:db/ident` should not gain a nil or empty key in output.
- When linked refs are disabled, UUID label resolution should not depend on linked refs (ensure `collect-uuid-refs` handles empty refs).
- Multi-id output should still honor the linked references option per target and not render linked refs when disabled.

## Files to Touch

- `src/main/logseq/cli/command/show.cljs` (options, selectors, tree output, linked refs gating)
- `src/test/logseq/cli/format_test.cljs` (ID dim styling test)
- `src/test/logseq/cli/commands_test.cljs` (help output)
- Possibly `src/test/logseq/cli/command_show_test.cljs` or similar if a dedicated show test file exists

## Open Questions

- None.

---
