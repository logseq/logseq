# Logseq CLI Show Referenced Entity IDs in Footer Plan

Goal: Add a footer section to `logseq show` human output that lists referenced entities and their IDs when block content contains `[[<ref>]]`.

Architecture: Keep the existing tree rendering unchanged and append a post-tree summary section (`Referenced Entities`) generated from refs discovered in the shown tree (and linked references when enabled).

Tech Stack: ClojureScript, `logseq.cli.command.show`, db-worker-node thread-api pull/query via existing transport.

Related:
- `docs/agent-guide/021-logseq-cli-reference-uuid-rewrite.md`
- `docs/agent-guide/024-logseq-cli-show-updates.md`
- `docs/agent-guide/010-logseq-cli-show-linked-references.md`

## Problem Statement

Current `show` output rewrites `[[<uuid>]]` to readable labels, but users cannot see the stable entity ID for each reference in human output.

When reviewing large trees or debugging graph links, users need a deterministic ID mapping without polluting every inline block line.

The selected UX is a dedicated footer section (not inline expansion) so the tree remains readable.

## Proposed UX

### Human output (new footer section)

Keep current tree output exactly as-is, then append:

```text
Referenced Entities (2)
181 -> First child line A\nline B for wrapping
179 -> Root task for show command
```

Behavior:
- Section appears only when at least one reference is present.
- Order is by first appearance in rendered traversal order.
- ID should be `:db/id` (human-facing stable numeric id in CLI context).
- Label should prefer `:block/title`, then `:block/name`, then UUID string fallback.

### Option behavior

Provide an explicit option so users can disable the footer when needed:
- `--ref-id-footer` (boolean, default `true`)

When `true` (default), append the footer section.
When `false`, do not render the footer section.

Because this changes default human output, update related snapshots/tests accordingly and document the behavior in release notes.

## Scope

In scope:
- Human output for `show` command only.
- Single target and multi-id target modes.
- Respect existing `--linked-references` behavior for reference discovery source.

Out of scope:
- JSON/EDN schema changes.
- Inline replacement format changes.
- New reference graph traversal semantics.

## Design Details

### Reference discovery source

Build the footer map from already available tree data:
1. Traverse `:root` tree nodes and gather references from text fields (`:block/title`, `:block/name`, `:block/content`).
2. If linked references are enabled, include linked reference block texts too.
3. Reuse existing UUID extraction and label fetch behavior where possible.

### UUID to entity resolution

Current logic already fetches labels for UUID refs. Extend resolution to also fetch `:db/id` for each referenced UUID:
- Pull selector should include `:db/id`, `:block/uuid`, `:block/title`, `:block/name`.
- Build map: `uuid-lowercase -> {:id <db-id> :label <label>}`.

### Footer rendering

Add formatter helper in `show.cljs`:
- Input: ordered vector of referenced UUIDs + resolution map
- Output:
  - Header: `Referenced Entities (N)`
  - Rows: `<id> -> <label>`

Fallbacks:
- Missing id: `- -> <label>`
- Missing label: `<id> -> <uuid>`

### Multi-id output

For multi-id human output (joined by delimiter), each successful tree result should include its own footer section when enabled.

Failed targets keep current error text behavior unchanged.

## Implementation Plan (TDD Order)

1. Add failing tests for footer rendering helper (no refs, one ref, multiple refs, missing label/id fallbacks).
2. Add failing tests for `show` human output with `--ref-id-footer true`:
   - Single target output includes `Referenced Entities` section.
   - `--ref-id-footer false` has no section.
3. Add failing tests for multi-id output ensuring each successful segment can include its own footer.
4. Extend `show-spec` with `--ref-id-footer` boolean option.
5. Thread option through `build-action` into action map.
6. Extend reference metadata fetch to include `:db/id` and produce `uuid -> {:id :label}` map.
7. Add footer rendering and append step to human rendering path only.
8. Ensure existing JSON/EDN output remains unchanged.
9. Update help/commands tests that validate `show --help` options.
10. Run targeted and full CLI tests.

## Files to Touch

- `src/main/logseq/cli/command/show.cljs`
  - Option spec (`show-spec`)
  - Action wiring (`build-action`)
  - UUID metadata fetch (id + label)
  - Footer rendering helpers
  - Human rendering composition

- `src/test/logseq/cli/command/show_test.cljs`
  - Unit tests for new helper behavior

- `src/test/logseq/cli/format_test.cljs`
  - Human formatting assertions for `show` payload passthrough

- `src/test/logseq/cli/commands_test.cljs`
  - Help output option coverage if command options are asserted there

## Testing Plan

Targeted tests:
- `bb dev:test -v logseq.cli.command.show-test`
- `bb dev:test -v logseq.cli.format-test/test-human-output-show`
- `bb dev:test -v logseq.cli.commands-test`

Regression:
- `bb dev:lint-and-test`

Acceptance criteria:
- With default options, show human output appends `Referenced Entities (N)` with `<id> -> <label>` rows when references exist.
- With `--ref-id-footer false`, footer section is not rendered.
- Multi-id output preserves delimiter/error behavior and only enhances successful segments.
- JSON/EDN outputs do not add/remove fields due to this feature.

## Edge Cases

- Duplicate references in multiple blocks should appear once in footer (first-seen order).
- Broken references (entity missing) should still print UUID fallback row.
- References discovered only inside linked references should be included only when linked references are enabled.
- Very large reference sets should remain deterministic; consider future pagination if needed.

## Rollout and Risk

Risk: medium.
- Medium for human-output compatibility because default behavior changes.
- Medium for output snapshot tests and formatting expectations.

Mitigation:
- Provide `--ref-id-footer false` opt-out.
- Add precise tests for ordering and fallback behavior.
- Document the default change in release notes.

## Future Extensions

- Allow `--ref-id-footer db-id|uuid|both` display mode.
- Add `--ref-id-footer-limit` for huge outputs.
- Add grouped footer by page for better navigation.
