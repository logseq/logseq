# Logseq CLI List Title Display Width Implementation Plan

Goal: Make every `TITLE` column in `logseq list *` human output use a fixed maximum visual width with correct CJK-aware width handling via `string-width`.

Architecture: Keep list data retrieval unchanged in db-worker-node thread APIs and implement presentation-only changes in the CLI formatter layer.

Architecture: Introduce a display-width-aware truncation and padding path that is applied to list title cells before table rendering.

Tech Stack: ClojureScript, `logseq.cli.format`, `logseq.cli.command.list`, db-worker thread APIs in `frontend.worker.db-core`, JavaScript `string-width`.

Related: Builds on `docs/agent-guide/062-logseq-cli-list-default-sort-updated-at.md`, `docs/agent-guide/066-logseq-cli-list-property-cardinality-column.md`, `docs/agent-guide/078-logseq-cli-task-subcommands.md`, and `docs/cli/logseq-cli.md`.

## Problem statement

Current human table rendering in `src/main/logseq/cli/format.cljs` uses `(count text)` for width calculation and right padding.

`count` is code-point length, not terminal display width.

This breaks alignment when titles contain CJK or mixed-width text.

Current `list` human output also allows unbounded title length, which can push important columns out of view for `list page`, `list tag`, `list property`, and `list task`.

We need a stable, readable table contract where `TITLE` is capped to a reasonable visual width and aligned correctly for mixed-language content.

## Current baseline from implementation

The active CLI stack is the `src/main/logseq/cli/*` implementation, not the legacy `deps/cli` command stack.

List command data is produced by db-worker helpers and returned through thread APIs without formatter concerns.

The relevant path is:

```text
logseq list <page|tag|property|task>
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs
  -> transport/invoke :thread-api/cli-list-*
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs
```

`TITLE` columns are defined in formatter column configs in `src/main/logseq/cli/format.cljs`.

All table rendering goes through `render-table` and `format-counted-table` in the same file.

## Scope

In scope commands are:

| Command | Human output table has `TITLE` column | Source formatter function |
| --- | --- | --- |
| `logseq list page` | Yes | `format-list-page` |
| `logseq list tag` | Yes | `format-list-tag` |
| `logseq list property` | Yes | `format-list-property` |
| `logseq list task` | Yes | `format-list-task` |

The default max visual width target for title is `40` columns.

The value is configurable in `cli.edn` via a new CLI config key.

The cap is measured by display width, not character count.

Out of scope commands include `search *`, `query list`, `graph list`, and `server list`.

Out of scope outputs include JSON and EDN payload shape changes.

## Design decisions

### 1) Keep db-worker-node payloads unchanged

No changes are required in `src/main/logseq/cli/common/db_worker.cljs` or thread API wiring in `src/main/frontend/worker/db_core.cljs`.

db-worker should continue returning full `:block/title` values.

Human formatting is the only layer that applies visual truncation.

### 2) Add explicit title max-width policy in formatter

Introduce a formatter default constant such as `list-human-title-max-display-width-default` with value `40`.

Read an optional override from resolved CLI config using a new `cli.edn` key `:list-title-max-display-width`.

Apply this policy only to `TITLE` extractors in list column definitions.

Truncated values append a suffix `…` and remain within the max display width.

### 3) Use `string-width` for display width operations

Add npm interop in `src/main/logseq/cli/format.cljs` for `string-width`.

Use `string-width` for:

- Width measurement during truncation.
- Width measurement during table column width calculation.
- Padding logic in `pad-right` or equivalent.

This ensures CJK and mixed-width titles align with other columns.

### 4) Preserve existing list data semantics

Sorting, filtering, `--fields`, `--limit`, and `--offset` behavior in `src/main/logseq/cli/command/list.cljs` remain unchanged.

Only rendered human strings are affected.

### 5) Keep non-list command behavior stable

Prefer implementing title truncation in list-specific extractors.

If `render-table` is upgraded to display-width-aware padding globally, verify non-list tables are unaffected except improved alignment.

## Proposed implementation steps

1. Invoke `@test-driven-development` and add failing formatter tests for long ASCII title truncation in each list command.

2. Add failing formatter tests for long CJK and mixed CJK/ASCII titles in each list command.

3. Add failing config resolution tests in `src/test/logseq/cli/config_test.cljs` for `:list-title-max-display-width`, including default fallback to `40` and valid `cli.edn` override.

4. Add a focused formatter unit test for truncation helper behavior ensuring output display width is `<= 40` and suffix handling is correct.

5. Add a focused formatter unit test for width-aware padding behavior with CJK text so column alignment is deterministic.

6. Add config normalization helpers in `src/main/logseq/cli/config.cljs` to parse and validate `:list-title-max-display-width` as a positive integer.

7. Add `string-width` import and helper functions in `src/main/logseq/cli/format.cljs`.

8. Add title truncation helper and wire it into the `TITLE` extractor entries in `list-page-columns`, `list-tag-columns`, `list-property-columns`, and `list-task-columns`.

9. Replace `(count ...)`-based width and padding internals in table rendering with display-width-aware logic.

10. Run formatter and config tests and update exact spacing snapshots where needed.

11. Update user-facing docs in `docs/cli/logseq-cli.md` to mention that list human `TITLE` uses default width `40`, supports `cli.edn` override, and always truncates with `…`.

12. Optionally add one CLI e2e non-sync human-output case for long mixed-width title rendering if we want package-level regression protection.

## Files to modify

- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/config.cljs`.
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/config_test.cljs`.
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` (optional, only if we decide to cover human output end-to-end).
- `/Users/rcmerci/gh-repos/logseq/package.json` (only if `string-width` is added as an explicit direct dependency).

## Edge cases to cover

A title with only CJK characters that exceeds max width.

A title with alternating CJK and ASCII characters.

A title exactly at width boundary.

A title one display cell over boundary.

A title containing emoji or variation selectors.

A nil title where current logic falls back to `-`.

A title containing newlines where current multiline row rendering is preserved.

A very short title where no extra truncation marker appears.

An invalid `cli.edn` width value such as `0`, negative numbers, or non-numeric values that must fall back to default `40`.

## Risks and mitigation

Risk: Moving width calculations to display width can shift spacing in non-list tables.

Mitigation: Add or adjust tests for affected command outputs and constrain behavioral changes to alignment only.

Risk: `string-width` import style may vary by bundling mode.

Mitigation: Verify in unit tests and CLI runtime, and choose the interop form that matches current CJS usage conventions in the repo.

Risk: New truncation can reduce discoverability of long titles.

Mitigation: Keep JSON and EDN outputs untruncated and document this behavior clearly.

Risk: Invalid `cli.edn` width values can produce inconsistent rendering if not normalized.

Mitigation: Parse as positive integer with fallback to default `40` and add config tests for invalid values.

## Open questions

No open question.

Decisions locked for this plan are default width `40`, `cli.edn` configurability, truncation suffix `…`, and list-only scope.

## Testing Plan

I will add formatter behavior tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` that verify title truncation and alignment for `list page`, `list tag`, `list property`, and `list task` human output.

I will add helper-level tests in the same test namespace to validate width-aware truncation and padding with CJK and mixed-width samples.

I will add config tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/config_test.cljs` to validate default value `40`, `cli.edn` override, and invalid-value fallback behavior.

I will run focused tests first with `bb dev:test -v logseq.cli.format-test/test-human-output-list-page`, `bb dev:test -v logseq.cli.format-test/test-human-output-list-tag-property`, and `bb dev:test -v logseq.cli.format-test/test-human-output-list-task`.

I will run broader CLI tests with `bb dev:test -v logseq.cli.format-test` and config tests with `bb dev:test -v logseq.cli.config-test`.

If e2e coverage is added, I will run `bb -f cli-e2e/bb.edn test --skip-build`.

I will finish with `bb dev:lint-and-test`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Step-by-step execution checklist

| Step | Action | Verification |
| --- | --- | --- |
| 1 | Add failing list title truncation tests. | Tests fail with current unbounded title output. |
| 2 | Add failing CJK width alignment tests. | Tests fail due current `count`-based width logic. |
| 3 | Add failing config tests for `:list-title-max-display-width`. | Tests fail before config parsing is implemented. |
| 4 | Implement config parsing with default `40` and invalid fallback. | Config tests pass for default and override behavior. |
| 5 | Implement `string-width` helpers. | Helper tests pass. |
| 6 | Implement title truncation in list column extractors. | List tests show bounded title width and `…` suffix. |
| 7 | Switch table padding/width to display-width-aware logic. | CJK alignment tests pass. |
| 8 | Update docs and optional e2e. | Docs mention truncation behavior and tests stay green. |
| 9 | Run full regression. | `bb dev:lint-and-test` passes. |

## Testing Details

The tests validate observable CLI behavior by asserting final human output strings for list commands, including truncation marker presence and table alignment under mixed-width input.

The tests do not assert internal helper data structures beyond what is needed to validate final output semantics.

## Implementation Details

- Keep default max title width as formatter constant `40`.
- Allow override from `cli.edn` key `:list-title-max-display-width`.
- Parse config width as positive integer and fall back to default on invalid values.
- Truncate by display width instead of character count.
- Keep truncation policy limited to list `TITLE` columns.
- Always use `…` as truncation suffix in human list output.
- Preserve db-worker payload contracts and thread API names.
- Preserve JSON and EDN full title output.
- Ensure multiline table behavior is not regressed.
- Document human-output-only truncation and config override in CLI docs.

## Question

No blocking question for implementation.

---
