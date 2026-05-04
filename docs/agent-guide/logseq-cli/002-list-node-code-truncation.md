# Plan: Limit All `list` Command Table Output to Three Lines

## Background

A bug was reported in Logseq CLI list rendering:

- In the `list` command, displayed content should not exceed three lines.
- For `list node` entries tagged as code, long code blocks should be truncated to a maximum of three lines.
- This is a **temporary rule**.

Repro step:

- `logseq list node --tags code`

(Reporter wrote `-tags`; current CLI syntax is `--tags`.)

## Current Behavior (Implementation-Aligned)

From current CLI implementation:

- `list node` fetches items in `src/main/logseq/cli/command/list.cljs` (`execute-list-node`), and other list commands follow the same list-command execution pattern.
- Human rendering for all list commands is handled in `src/main/logseq/cli/format.cljs` through shared table formatting helpers.
- Table rendering already supports multi-line cells and title width truncation by display width.
- There is currently **no line-count truncation** for multi-line title/content in list output.

Therefore, long multi-line content (including code blocks in `:block/title`) can expand to many rendered lines in human output across list commands.

## Goal

For human output of `list` family commands, enforce a temporary UI rule:

1. Any displayed multi-line content in list table cells should be limited to **max 3 lines**.
2. Explicitly satisfy the bug scenario for `list node --tags code` where code block titles are long multi-line text.

## Non-Goals

- Do not change structured outputs (`--output json`, `--output edn`).
- Do not alter worker query/filter semantics for any `list` command.
- Do not introduce permanent content-format policy yet; this is temporary.

## Proposed Design

### 1) Apply truncation at human formatting layer

Implement the behavior in `src/main/logseq/cli/format.cljs` because:

- This is a display concern.
- It avoids modifying DB/query payloads.
- It keeps JSON/EDN behavior unchanged.

### 2) Add line-count limiter for list cells

Add a helper that:

- Splits text by `\n`.
- Keeps at most first 3 lines.
- If truncated, append an ellipsis marker to the third line (or as a final marker line), preserving table readability.

Apply this helper before table rendering for list cells where content can be multiline (notably `TITLE` fields).

### 3) Preserve existing display-width truncation behavior

The existing title width truncation (`:list-title-max-display-width`) should remain active.
Recommended order:

1. Apply line-count truncation (max 3 lines).
2. Apply per-line display-width truncation (existing behavior).

This ensures both vertical and horizontal bounds.

### 4) Scope for temporary rule

**Mandatory scope (this plan):**

- All `list-*` human outputs must enforce the max-3-lines rule, including:
  - `:list-page`
  - `:list-tag`
  - `:list-property`
  - `:list-task`
  - `:list-node`
  - `:list-asset`

This is not a `:list-node`-only change. The behavior should be consistent across all list command tables.

## Files to Update

1. `src/main/logseq/cli/format.cljs`

- Introduce max-lines constant for list content (value `3`).
- Add helper to truncate multiline text by line count.
- Integrate helper into list table cell formatting path for all `list-*` commands (at minimum all `TITLE` columns; ideally all multiline-capable list table cells).

2. `src/test/logseq/cli/format_test.cljs`

Add/adjust tests:

- New tests for each list command (`list page/tag/property/task/node/asset`): title/content with 5+ lines renders only first 3 lines in human output.
- Assert output still includes `Count: N` for each command.
- Assert JSON/EDN output keeps full original title/content unchanged.
- Add at least one alignment regression test with multiline truncation enabled to ensure table columns stay aligned.

## Test Plan

### Unit Tests

Run focused tests first:

- `bb dev:test -v logseq.cli.format-test/test-human-output-list-page`
- `bb dev:test -v logseq.cli.format-test/test-human-output-list-tag-property`
- `bb dev:test -v logseq.cli.format-test/test-human-output-list-task`
- `bb dev:test -v logseq.cli.format-test/test-human-output-list-node`
- `bb dev:test -v logseq.cli.format-test/test-human-output-list-asset`
- Add and run dedicated 3-line truncation test cases covering all list commands.

Then run broader CLI tests:

- `bb dev:test -v logseq.cli.format-test`

### Regression Checks

- Verify existing title-width truncation tests still pass.
- Verify multiline table alignment remains correct after truncation.
- Verify non-human outputs remain unchanged.

## Acceptance Criteria

1. Every `list-*` command human output (`list page/tag/property/task/node/asset`) never shows more than 3 rendered lines for any single multiline list table cell.
2. `logseq list node --tags code` specifically reproduces the bug fix: long code block titles are truncated to max 3 lines.
3. Output remains a valid table with readable alignment and `Count` footer.
4. JSON/EDN outputs are unchanged (no content truncation).
5. Existing list formatting tests pass, with new cross-command truncation test coverage.

## Risks and Mitigations

Risk:

- Applying truncation too broadly may hide meaningful multiline content unexpectedly.

Mitigation:

- Keep change localized to list human formatter.
- Document as temporary rule.
- Enforce one shared truncation path used by all `list-*` formatters to avoid divergence.

Risk:

- Interaction between line-limit and width-limit may produce awkward ellipsis placement.

Mitigation:

- Centralize truncation helpers and add explicit tests for both multi-line and width truncation together.

## Rollback Strategy

Since change is formatter-only:

- Revert modifications in `format.cljs` and corresponding tests.
- No data migration or worker contract rollback needed.

## Follow-up (After Temporary Rule)

When temporary rule is revisited:

- Decide whether 3-line cap should become configurable (e.g., `cli.edn` option).
- Decide if behavior should apply uniformly across all list/search/show human outputs.
- Consider richer code-block preview strategy for CLI (language-aware header + fixed snippet).