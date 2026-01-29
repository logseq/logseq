# Logseq CLI Add Reference UUID Rewrite Plan

Goal: For logseq-cli add block/page content, replace every `[[<reference-name>]]` with `[[block-uuid]]` before calling db-worker-node thread-api, creating missing pages when needed.

Architecture: logseq-cli (`src/main/logseq/cli/command/add.cljs`) sends `:thread-api/apply-outliner-ops` calls through `logseq.cli.transport`. db-worker-node executes `outliner-op/apply-ops!` without normalizing refs. Frontend already normalizes refs using `logseq.db.frontend.content/title-ref->id-ref`, but CLI does not.

Tech Stack: ClojureScript, logseq-cli, db-worker-node, Datascript.

## Problem statement

Today logseq-cli passes block content to db-worker-node as-is. If content includes `[[Page Name]]`, db-worker-node does not automatically resolve or create that page for outliner ops. We need to normalize content refs to uuid references up front so db-worker-node receives canonical refs and missing pages are created deterministically.

## Current behavior summary

- `logseq-cli add block` builds blocks and calls `:thread-api/apply-outliner-ops` with `:insert-blocks`.
- `logseq-cli add page` calls `:thread-api/apply-outliner-ops` with `:create-page` only (no content normalization).
- db-worker-node `:thread-api/apply-outliner-ops` applies ops verbatim and does not resolve page refs in block content.
- Frontend editor normalizes refs using `logseq.db.frontend.content/title-ref->id-ref`, but CLI paths do not use it.

## Requirements

- For add block and add page content, replace every `[[<reference-name>]]` with `[[block-uuid]]` before invoking db-worker-node thread-api.
- Page reference:
  - If `<reference-name>` is not a UUID, treat it as a page title.
  - If the page does not exist, create it first.
  - Replace `[[Page Title]]` with `[[page-uuid]]` (case-insensitive).
- Block reference:
  - If `<reference-name>` is a UUID, treat it as a block ref.
  - The block must exist; otherwise return a CLI error.
- Do not change other syntax (e.g. `((uuid))` block refs, tags, or macros) unless they are inside `[[...]]`.

## Non-goals

- Do not alter how `((uuid))` block refs are parsed or stored.
- Do not introduce automatic block creation for missing block UUIDs.
- Do not change CLI command flags or output format.

## Design decisions

- Reuse `logseq.db.frontend.content/title-ref->id-ref` so CLI behavior matches frontend normalization rules.
- Extract `[[...]]` refs using the existing page-ref regex from `logseq.common.util.page-ref` to avoid implementing a new parser.
- Resolve refs once per CLI action, cache page-name -> uuid, and then update all affected blocks before the first `:thread-api/apply-outliner-ops` call.
- Handle page creation with the existing `ensure-page!` helper in `src/main/logseq/cli/command/add.cljs` for consistent behavior.

## Implementation plan

### 1) Add reference extraction and resolution helpers

- `src/main/logseq/cli/command/add.cljs`
  - Add a helper to extract `[[...]]` tokens from a block title using `logseq.common.util.page-ref/page-ref-re`.
  - Add a helper that partitions refs into:
    - `uuid-refs`: `[[<uuid>]]` values
    - `page-refs`: `[[<page-title>]]` values
  - Add a resolver that:
    - For `page-refs`, calls `ensure-page!` (once per unique title) and returns `{:block/uuid uuid :block/title title}`.
    - For `uuid-refs`, pulls the entity by `[:block/uuid uuid]` and errors if missing.

### 2) Normalize add block content before outliner ops

- `src/main/logseq/cli/command/add.cljs`
  - In `execute-add-block`, before building ops:
    - Walk the `:blocks` tree (top-level and any nested `:block/children`) and collect all `[[...]]` refs.
    - Resolve refs once per action using the resolver from step 1.
    - For each block with `:block/title`, rewrite it with `db-content/title-ref->id-ref` using the resolved refs and `{:replace-tag? false}`.
  - Use the rewritten blocks in the `:insert-blocks` op.

### 3) Normalize add page content (when present)

- `src/main/logseq/cli/command/add.cljs`
  - If add page grows to accept initial blocks/content (or if `:create-page` options start supporting content), reuse the same ref normalization flow from step 2 before invoking `:create-page` or `:insert-blocks`.
  - If no content is provided, no change is needed in the current implementation.

### 4) Tests

- `test/logseq/cli/integration_test.cljs`
  - Add an integration test for `add block` with content `"See [[New Page]]"`:
    - Assert the page is created.
    - Pull the inserted block and verify its title contains `[[<page-uuid>]]` instead of `[[New Page]]`.
  - Add an integration test for `add block` with content `"See [[<existing-block-uuid>]]"`:
    - Assert the UUID is preserved and no new page is created.
  - Add an integration test for `add block` with content `"See [[<missing-block-uuid>]]"`:
    - Assert CLI returns an error with a clear message.

## Notes

- If we later decide to normalize tags (`#tag`) or macro-based refs, we can extend the resolver to call `db-content/title-ref->id-ref` with `:replace-tag? true` and add tests accordingly.
- Keep all normalization in CLI to avoid changing db-worker-node semantics for other callers.
