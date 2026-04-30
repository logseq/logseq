# 060 — CLI graph list: mark legacy graph-dir and provide rename command

## Summary

`logseq-cli graph list` currently filters out graph directories that cannot be decoded by the current canonical graph-dir encoding. This behavior makes legacy graph directories invisible to users.

This plan proposes to:

1. Detect non-canonical (legacy) graph directories during graph listing.
2. Mark them as `legacy` in `graph list` output.
3. Show a warning when legacy entries exist.
4. Print a suggested shell rename command from legacy dir name to current canonical encoded dir name (only when graph-name can be derived reliably).

## Product decisions (locked)

1. Scope is `graph list` only.
2. Human output must show:
   - regular graph items (existing behavior),
   - legacy marker per legacy item,
   - a warning section when at least one legacy graph is found,
   - one rename command suggestion per legacy graph when derivation is reliable.
3. Structured outputs (`json` / `edn`) must include legacy metadata (not human-only text).
4. Suggested command target is POSIX shell (`mv`) with safe quoting.
5. If target encoded dir already exists, output should include conflict guidance instead of a blind rename suggestion.
6. If a legacy dir cannot be decoded to a reliable graph-name, show `legacy` marker and warning only; do not output a rename command.

## Goals

- Make legacy graph dirs visible in `logseq-cli graph list`.
- Provide actionable migration guidance with minimal user effort.
- Keep current canonical graph listing behavior unchanged for non-legacy entries.

## Non-goals

- Automatic rename/migration execution.
- Reworking graph storage layout.
- Adding new CLI subcommands in this iteration.

## Current behavior (based on code)

- `src/main/logseq/cli/server.cljs` `list-graphs` scans graph data dirs and decodes names via canonical decode.
- Entries that fail canonical decode are dropped.
- `src/main/logseq/cli/command/graph.cljs` `execute-graph-list` passes graph names to formatter.
- `src/main/logseq/cli/format.cljs` `format-graph-list` renders graph names but has no legacy path.

Related encoding utilities:

- Canonical encode/decode logic:
  - `deps/common/src/logseq/common/graph_dir.cljs`
  - `src/main/frontend/worker/db_worker_node_lock.cljs`
- Legacy token hints still exist in browser-side logic (`+3A+`, `++`) and can be used to define migration decoding behavior.

## Design

### 1) Data model for graph list results

Introduce a richer graph-list item shape from CLI server layer:

- Canonical item:
  - `{:kind :canonical :graph-name <decoded-graph-name> :graph-dir <encoded-dir-name>}`
- Legacy item:
  - `{:kind :legacy :legacy-dir <raw-dir-name> :legacy-graph-name <decoded-or-derived-name> :target-graph-dir <canonical-encoded-dir-name> :conflict? <bool>}`
- Undecodable non-canonical item:
  - `{:kind :legacy-undecodable :legacy-dir <raw-dir-name> :reason <keyword-or-string>}`

Notes:

- `legacy-graph-name` should be derived using a dedicated legacy decode path (fallbacks allowed).
- `target-graph-dir` should always be computed from `legacy-graph-name` through current canonical encoding.
- `:legacy-undecodable` entries must never produce rename commands.

### 2) Legacy detection and derivation

At graph discovery stage (`src/main/logseq/cli/server.cljs`):

1. Keep current canonical decode attempt.
2. If canonical decode succeeds -> canonical item.
3. If canonical decode fails -> try legacy derivation:
   - legacy token replacement decode path (e.g. `+3A+ -> :`, `++ -> /`) as compatibility rule,
   - URI decode fallback if applicable.
4. If derivation yields a reliable name, classify as `:legacy`.
5. If no reliable derivation is possible, classify as `:legacy-undecodable` and include warning-only entry (no rename command).

### 3) Command layer contract

In `src/main/logseq/cli/command/graph.cljs`:

- `execute-graph-list` should return:
  - `:data` containing canonical + legacy + undecodable legacy metadata,
  - `:human` warning payload when any legacy entries exist.

This keeps formatter logic deterministic while preserving structured output for `json` and `edn`.

### 4) Human formatter behavior

In `src/main/logseq/cli/format.cljs`:

- Extend graph list rendering to show legacy marker, for example:
  - `- my/old/graph [legacy]`
  - `- unknown-legacy-dir [legacy]`
- Add warning block when legacy entries are present.
- For each renameable legacy item, print a shell suggestion:
  - `mv '<data-dir>/<legacy-dir>' '<data-dir>/<target-graph-dir>'`
- For conflict entries (`target already exists`), print explicit conflict note and no direct `mv` command.
- For undecodable legacy entries, print explicit warning and no `mv` command.

### 5) Shell quoting

Current CLI arg quoting helper is not sufficient for robust shell copy/paste.

Plan:

- Add a dedicated POSIX single-quote escaping helper for rendered shell suggestions.
- Use it only in human formatting layer.

## Output examples (human)

Example list section:

- `my/new/graph`
- `my/old/graph [legacy]`
- `strange-dir-name [legacy]`

Warning section example:

- `Warning: 2 legacy graph directories detected.`
- `Rename suggestion:`
- `mv '/path/to/data/my++old++graph' '/path/to/data/my~2Fold~2Fgraph'`
- `Warning: cannot derive graph name for legacy dir 'strange-dir-name'; rename command is not available.`

Conflict example:

- `Warning: target directory already exists for legacy graph 'my/old/graph'.`
- `Please rename manually after resolving the conflict.`

## Test plan

### Unit tests

1. `src/test/logseq/cli/commands_test.cljs`
   - verify `graph list` command data includes legacy and undecodable legacy entries.
2. `src/test/logseq/cli/format_test.cljs`
   - verify human output marker `[legacy]`.
   - verify warning block appears only when legacy exists.
   - verify rename command rendering and shell quoting.
   - verify undecodable legacy outputs warning only and no rename command.
3. `src/test/frontend/worker/graph_dir_test.cljs`
   - extend coverage for canonical encode/decode + legacy derivation helper behavior.

### Integration tests

1. `src/test/logseq/cli/integration_test.cljs`
   - seed canonical + legacy dirs in test data dir.
   - assert `graph list` behavior for human/json/edn outputs.
   - assert conflict message when target encoded dir already exists.
   - assert undecodable legacy case emits warning without rename command.

## Edge cases

- Legacy dir cannot be decoded to a graph name.
- Canonical target dir already exists.
- Graph names containing shell-sensitive characters.
- Mixed directories that are not graph dirs (must avoid false positives).

## Implementation plan

1. Add legacy classification utilities and detailed graph list payload in CLI server layer.
2. Adapt `graph list` command contract to pass structured legacy information to formatter and machine outputs.
3. Extend human formatter with legacy marker, warning block, and safe rename suggestions.
4. Add/adjust tests for unit + integration coverage.
5. Validate no regression for all existing `graph list` output formats.

## Acceptance criteria

- `graph list` shows legacy entries instead of silently hiding them.
- Human output includes explicit legacy marker and warning.
- Human output includes safe rename command for renameable entries.
- Undecodable legacy entries are clearly reported with warning only (no rename command).
- Conflict scenarios are surfaced without unsafe rename suggestions.
- JSON/EDN outputs expose legacy metadata for automation.
- Existing canonical-only behavior remains stable when no legacy entries exist.

## Affected files (planned)

Would modify:

- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/command/graph.cljs`
- `src/main/logseq/cli/format.cljs`
- `src/test/logseq/cli/commands_test.cljs`
- `src/test/logseq/cli/format_test.cljs`
- `src/test/logseq/cli/integration_test.cljs`
- `src/test/frontend/worker/graph_dir_test.cljs`

Would create:

- `docs/agent-guide/060-cli-graph-list-legacy-graph-dir-rename-command.md`
