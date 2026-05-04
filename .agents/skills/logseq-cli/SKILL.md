---
name: logseq-cli
description: Operate the current Logseq command-line interface to inspect or modify graphs, pages, blocks, tasks, tags, and properties; run Datascript queries; show page/block trees; manage graphs; and manage db-worker-node servers. Use when a request involves running `logseq` commands or interpreting CLI output.
---

# Logseq CLI

## Overview

Use `logseq` to inspect and edit graph entities, run Datascript queries, and control graph/server lifecycle.

## Quick start

- Run `logseq --help` to see top-level commands and global flags.
- Run `logseq <command> --help` to see command-specific options.
- Use `--graph` to target a specific graph.
- Omit `--output` for human output. Set `--output json` or `--output edn` only when machine-readable output is required.

## Command groups (from `logseq --help`)

- Graph Inspect and Edit:
- `list node`, `list page`, `list tag`, `list property`, `list task`, `list asset`
- `upsert block`, `upsert page`, `upsert tag`, `upsert property`, `upsert task`, `upsert asset`
- `remove block`, `remove page`, `remove tag`, `remove property`
- `query`, `query list`, `show`, `search block|page|property|tag`
- Graph Management:
- `graph list|create|switch|remove|validate|info|export|import|backup list|backup create|backup restore|backup remove`
- `server list|cleanup|start|stop|restart`
- `doctor`
- `sync status|start|stop|upload|download|remote-graphs|ensure-keys|grant-access|config set|get|unset`
- Authentication: `login|logout`
- Utilities: `completion`, `debug`, `example`, `skill`

## Global options

- `--config` Path to `cli.edn` (default `<root-dir>/cli.edn`)
- `--graph` Graph name
- `--root-dir` Path to CLI root dir (default `~/logseq`)
- `--timeout-ms` Request timeout in ms (default `10000`)
- `--output` Output format (`human`, `json`, `edn`)
- `--profile` Enable stage timing profile output to stderr
- `--verbose` Enable verbose debug logging to stderr

## Command option policy

- Do not memorize or hardcode command options in this skill.
- Before running any command, always check live options with:
- `logseq <command> --help`
- `logseq <command> <subcommand> --help`

## Task command preference

- If a user request is task-related, prefer task-scoped commands first.
- Use `list task`, `upsert task`, and other `... task` commands before block/page-level alternatives.
- Only fall back to `upsert block`/`list page` style workflows when task commands cannot satisfy the requested operation.
- For any task state, create/update the task with `upsert task --status <status>` and keep status markers out of `--content`.
- If the same task block also needs additional tags, use explicit tag association separately, for example `upsert block --id <task-block-id> --update-tags '["AI-GENERATED" "CLI"]'`.

## Examples policy

- Do not maintain long static command examples in this skill.
- Use `logseq example` as the source of truth for runnable examples.
- Before proposing runnable commands, always inspect live examples with:
  - `logseq example`
  - `logseq example <command-or-prefix...>`
  - `logseq example <command-or-prefix...> --help`
- Prefer exact selectors when possible (for example, `logseq example upsert page`).
- Use prefix selectors when grouped examples are needed (for example, `logseq example upsert`).
- Replace placeholder ids/uuids in retrieved examples with real entities from the target graph.
- Use `logseq list ...`, `logseq show ...`, or `logseq query ...` first to discover valid ids/uuids.
- For graph transfer flows, keep `graph export --file` and `graph import --input` paths consistent.

## Structured block writes

- When writing multi-item or hierarchical content, prefer a block tree instead of packing everything into one block.
- Preserve the source structure as sibling and child blocks. Each logical bullet, row, or subsection should usually become its own block.
- Reserve `--content` for true single-block writes or targeted updates to one existing block.
- If the user asks to write notes, lists, outlines, imported data, or any content that already has structure, do not flatten it into one long `--content` string.

## Tag association semantics

- For block or page tag association, prefer explicit CLI tag options such as `--update-tags` and `--remove-tags`.
- `upsert block` supports `--update-tags` in both create mode and update mode.
- `--update-tags` expects an EDN vector.
- Tag values may be tag title/name strings, db/id, UUID, or `:db/ident` values.
- String tag values may include a leading `#`, but they should still be passed inside `--update-tags`.
- If the user asks to tag a block or page, prefer explicit tag association.
- Tags must already exist and be public. If needed, create the tag first with `upsert tag --name "<TagName>"`.

## Anti-patterns and correct usage

### Task status in block content

- Anti-pattern: store task state in content, for example `--content "DONE Implemented and verified ..."` with `upsert block`.
- Correct usage: store task state as structured task data with `upsert task --status <status>` and keep content free of `TODO`, `DOING`, `DONE`, or other status markers.
- Example:
  1. `logseq upsert task --graph "Lambda RTC" --target-page "May 4th, 2026" --content "Some content here" --status done --output json`
  2. If tags are needed, use the returned block id: `logseq upsert block --graph "Lambda RTC" --id <returned-block-id> --update-tags '["AI-GENERATED" "CLI" "db-sync"]'`

### Hashtags in content instead of tag association

- Anti-pattern: treat content hashtags as tag association, for example `--content "Summary #AI-GENERATED"`.
- Correct usage: keep tags in explicit tag options, for example `upsert block --update-tags '["AI-GENERATED"]'`.

### Comma-separated tag lists

- Anti-pattern: pass tag updates as a comma-separated string, for example `--update-tags "AI-GENERATED,CLI"`.
- Correct usage: pass an EDN vector, for example `--update-tags '["AI-GENERATED" "CLI"]'`.

### Missing or private tags

- Anti-pattern: retry the same tag association command after a tag association failure without checking tag state.
- Correct usage: verify the tag exists and is public; create it first when needed with `upsert tag --name "<TagName>"`.

## Tips

- `query list` returns both built-ins and `custom-queries` from `cli.edn`.
- `show --id` accepts either one db/id or an EDN vector of ids.
- `remove block --id` also accepts one db/id or an EDN vector.
- `upsert block` enters update mode when `--id` or `--uuid` is provided.
- Always verify command flags with `logseq --help` and `logseq <...> --help` before execution.
- If `logseq` reports that it doesn’t have read/write permission for `root-dir`, then check filesystem permissions or set `LOGSEQ_CLI_ROOT_DIR`.
- In sandboxed environments, `graph create` may print a process-scan warning to stderr; if command status is `ok`, the graph is still created.
