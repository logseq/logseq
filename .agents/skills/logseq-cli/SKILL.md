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
- Omit `--output` for human output. Use `--output json` or `--output edn` for structured command results. `skill show` prints raw Markdown in every output mode.

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
- `sync status|start|stop|upload|download|asset download|remote-graphs|ensure-keys|grant-access|config set|get|unset`
- Authentication: `login|logout`
- Utilities: `agent bridge`, `completion`, `debug`, `example`, `skill`

## Global options

- `--config` Path to `cli.edn` (default `<root-dir>/cli.edn`)
- `--graph` Graph name
- `--root-dir` Path to CLI root dir (default `~/logseq`)
- `--timeout-ms` Request timeout in ms (default `10000`)
- `--output` Output format (`human`, `json`, `edn`)
- `--profile` Enable stage timing profile output to stderr
- `--verbose` Enable verbose debug logging to stderr

## Command option policy

- Check the full command path with `logseq <command-path> --help` before using its options; for example, `logseq upsert block --help`.

## Task command preference

- If a user request is task-related, prefer task-scoped commands first.
- Use `list task`, `upsert task`, and other `... task` commands before block/page-level alternatives.
- Only fall back to `upsert block`/`list page` style workflows when task commands cannot satisfy the requested operation.
- For any task state, create/update the task with `upsert task --status <status>` and keep status markers out of `--content`.
- If the same task block also needs additional tags, use explicit tag association separately, for example `upsert block --id <task-block-id> --update-tags '["AI-GENERATED" "CLI"]'`.

## Examples policy

- Do not maintain long static command examples in this skill.
- Use `logseq example <command-path>` for starting points, then check the command's help and input format before using an example.
- Prefer exact selectors when possible (for example, `logseq example upsert page`).
- Use prefix selectors when grouped examples are needed (for example, `logseq example upsert`).
- Replace placeholder ids/uuids in retrieved examples with real entities from the target graph.
- Use `logseq list ...`, `logseq show ...`, or `logseq query ...` first to discover valid ids/uuids.
- For graph transfer flows, keep `graph export --file` and `graph import --input` paths consistent.
- Quote `--content` values with single quotes in shell examples, for example `--content 'Block content'`, so markdown backticks are not interpreted by the shell.

## Structured block writes

- When writing multi-item or hierarchical content, prefer a block tree instead of packing everything into one block.
- Preserve the source structure as sibling and child blocks. Each logical bullet, row, or subsection should usually become its own block.
- Reserve `--content` for true single-block writes or targeted updates to one existing block.
- If the user asks to write notes, lists, outlines, imported data, or any content that already has structure, do not flatten it into one long `--content` string.
- Create multiple sibling or child blocks with `upsert block --blocks <markdown>` or `--blocks-file <path>`. Use Markdown list indentation for the hierarchy; for example, `--blocks $'- Parent\n  - Child\n- Sibling'` in Bash or Zsh.
- Specify `--target-page`, `--target-id`, or `--target-uuid` when the destination matters. Create mode defaults to the current journal if no target is given. `--pos sibling` requires a block target.
- `--blocks` and `--blocks-file` are create-mode inputs. With `--id` or `--uuid`, `upsert block` updates one existing block and rejects those options. Use `--dry-run` in create mode to inspect planned operations without writing.

## Tag association semantics

- For block or page tag association, prefer explicit CLI tag options such as `--update-tags` and `--remove-tags`.
- `upsert block` supports `--update-tags` in both create mode and update mode.
- `--update-tags` expects an EDN vector.
- Tag values may be tag title/name strings, db/id, UUID, or `:db/ident` values.
- String tag values may include a leading `#`, but they should still be passed inside `--update-tags`.
- If the user asks to tag a block or page, prefer explicit tag association.
- Tags must already exist. If needed, create the tag first with `upsert tag --name "<TagName>"`. Do not assume a tag's public property controls whether it can be associated; tag resolution does not check that property.

## Anti-patterns and correct usage

### Task status in block content

- Anti-pattern: store task state in content, for example `--content 'DONE Implemented and verified ...'` with `upsert block`.
- Correct usage: store task state as structured task data with `upsert task --status <status>` and keep content free of `TODO`, `DOING`, `DONE`, or other status markers.
- Example:
  1. `logseq upsert task --graph "Lambda RTC" --target-page "May 4th, 2026" --content 'Some content here' --status done --output json`
  2. If tags are needed, use the returned block id: `logseq upsert block --graph "Lambda RTC" --id <returned-block-id> --update-tags '["AI-GENERATED" "CLI" "db-sync"]'`

### Hashtags in content instead of tag association

- Anti-pattern: treat content hashtags as tag association, for example `--content 'Summary #AI-GENERATED'`.
- Correct usage: keep tags in explicit tag options, for example `upsert block --update-tags '["AI-GENERATED"]'`.

### Comma-separated tag lists

- Anti-pattern: pass tag updates as a comma-separated string, for example `--update-tags "AI-GENERATED,CLI"`.
- Correct usage: pass an EDN vector, for example `--update-tags '["AI-GENERATED" "CLI"]'`.

### Missing tags

- Anti-pattern: retry the same tag association command after a tag association failure without checking tag state.
- Correct usage: verify the tag exists; create it first when needed with `upsert tag --name "<TagName>"`.

## Tips

- `query list` returns both built-ins and `custom-queries` from `cli.edn`.
- `agent bridge` starts/reuses db-worker-node, listens to db-worker-node events, scans routable tasks on startup and each event, starts one in-process master Codex session, and dispatches matched task/comment requests to that session.
- `show --id` and `remove block --id` accept one positive db/id or a bracketed list such as `'[123,456]'`. Their id parser splits integers on commas or whitespace; it does not parse EDN.
- `upsert block` enters update mode when `--id` or `--uuid` is provided.
- If `logseq` reports that it doesn’t have read/write permission for `root-dir`, then check filesystem permissions or set `LOGSEQ_CLI_ROOT_DIR`.
