---
name: logseq-cli
description: Operate the current Logseq command-line interface to inspect or modify graphs, pages, blocks, tags, and properties; run Datascript queries; show page/block trees; manage graphs; and manage db-worker-node servers. Use when a request involves running `logseq` commands or interpreting CLI output.
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

- Graph inspect/edit:
- `list page`, `list tag`, `list property`
- `upsert block`, `upsert page`, `upsert tag`, `upsert property`
- `remove block`, `remove page`, `remove tag`, `remove property`
- `query`, `query list`, `show`
- Graph management: `graph list|create|switch|remove|validate|info|export|import`
- Server management: `server list|status|start|stop|restart`
- Diagnostics: `doctor`

## Global options

- `--config` Path to `cli.edn` (default `~/logseq/cli.edn`)
- `--graph` Graph name
- `--data-dir` Path to db-worker data dir (default `~/logseq/graphs`)
- `--timeout-ms` Request timeout in ms (default `10000`)
- `--output` Output format (`human`, `json`, `edn`)
- `--verbose` Enable verbose debug logging to stderr

## Command option policy

- Do not memorize or hardcode command options in this skill.
- Before running any command, always check live options with:
- `logseq <command> --help`
- `logseq <command> <subcommand> --help`

## Example prerequisites

- Replace placeholder ids/uuids in examples (`123`, `321`, `1111...`) with real entities from the target graph.
- Use `logseq list ...`, `logseq show ...`, or `logseq query ...` first to discover valid ids/uuids.
- `logseq graph export` requires `--file`; keep `graph import --input` consistent with the export path.

## Examples

```bash
# List pages (human output by default)
logseq list page --graph "my-graph" --limit 50 --sort updated-at --order desc

# Include built-in tags/properties
logseq list tag --graph "my-graph" --include-built-in --limit 20 --output json
logseq list property --graph "my-graph" --include-built-in --limit 20 --output json

# Query by built-in query name
logseq query --graph "my-graph" --name "recent-updated" --inputs "[30]"

# Query with ad-hoc Datascript EDN
logseq query --graph "my-graph" --query "[:find [?p ...] :where [?p :block/name]]"

# List available queries (built-ins + custom-queries from cli.edn)
logseq query list --graph "my-graph" --output edn

# Show a page tree or a block
logseq show --graph "my-graph" --page "Meeting Notes" --level 2
logseq show --graph "my-graph" --id 123
logseq show --graph "my-graph" --id "[123,456,789]"

# Upsert a page (create or update by --id)
logseq upsert page --graph "my-graph" --page "Project X"
logseq upsert page --graph "my-graph" --id 999 --update-properties "{:logseq.property/description \"Example\"}"

# Upsert blocks
logseq upsert block --graph "my-graph" --target-page "Meeting Notes" --content "Discuss roadmap"
logseq upsert block --graph "my-graph" --target-page "Meeting Notes" --content "AI summary of the discussion" --update-tags '["AI-GENERATED"]'
logseq upsert block --graph "my-graph" --blocks "[{:block/title \"A\"} {:block/title \"B\"}]"
logseq upsert block --graph "my-graph" --id 123 --update-tags '["AI-GENERATED"]'
logseq upsert block --graph "my-graph" --id 123 --status done

# Ensure a tag exists before associating it with a block
logseq upsert tag --graph "my-graph" --name "AI-GENERATED"
logseq upsert block --graph "my-graph" --target-page "Meeting Notes" --content "AI summary of the discussion" --update-tags '["AI-GENERATED"]'

# Upsert tag/property
logseq upsert tag --graph "my-graph" --name "Project"
logseq upsert tag --graph "my-graph" --id 200 --name "Project Renamed"
logseq upsert property --graph "my-graph" --name "Effort" --type number --cardinality one
logseq upsert property --graph "my-graph" --id 321 --hide true

# Remove entities
logseq remove block --graph "my-graph" --id "[123,456]"
logseq remove block --graph "my-graph" --uuid "11111111-1111-1111-1111-111111111111"
logseq remove page --graph "my-graph" --name "Old Page"
logseq remove tag --graph "my-graph" --name "Old Tag"
logseq remove property --graph "my-graph" --id 321

# Graph and server commands
logseq graph create --graph "my-graph"
logseq graph list
logseq graph switch --graph "my-graph"
logseq graph info --graph "my-graph"
logseq graph export --graph "my-graph" --type edn --file /tmp/my-graph.edn
logseq graph import --graph "my-graph-import" --type edn --input /tmp/my-graph.edn
logseq server status --graph "my-graph"
logseq doctor
```

## Tag association semantics

- For block or page tag association, prefer explicit CLI tag options such as `--update-tags` and `--remove-tags`.
- Do not treat writing `#TagName` inside `--content` as equivalent guidance to explicit tag association.
- `upsert block` supports `--update-tags` in both create mode and update mode.
- `--update-tags` expects an EDN vector.
- Tag values may be tag title/name strings, db/id, UUID, or `:db/ident` values.
- String tag values may include a leading `#`, but they should still be passed inside `--update-tags` rather than embedded in content as a substitute for association.
- If the user asks to tag a block or page, prefer explicit tag association over embedding hashtags in content.
- Tags must already exist and be public. If needed, create the tag first with `upsert tag --name "<TagName>"`.

## Pitfalls

- `--content "Summary #AI-GENERATED"` is not the same guidance as `--update-tags '["AI-GENERATED"]'`.
- Do not pass `--update-tags` as a comma-separated string. Use an EDN vector.
- Do not assume a hashtag in block text will replace the need for explicit tag association when the user asks for a tagged block.
- If tag association fails, verify the tag exists and is public before retrying.

## Tips

- `query list` returns both built-ins and `custom-queries` from `cli.edn`.
- `show --id` accepts either one db/id or an EDN vector of ids.
- `remove block --id` also accepts one db/id or an EDN vector.
- `upsert block` enters update mode when `--id` or `--uuid` is provided.
- Always verify command flags with `logseq --help` and `logseq <...> --help` before execution.
- If `logseq` reports that it doesn’t have read/write permission for data-dir, then add read/write permission for data-dir in the agent’s config.
- In sandboxed environments, `graph create` may print a process-scan warning to stderr; if command status is `ok`, the graph is still created.

## References

- Built-in tags and properties: See `references/logseq-builtins.md` when you need canonical built-ins for `list ... --include-built-in` or for tag/property upsert fields.
