# Logseq CLI (Node)

The Logseq CLI is a Node.js program compiled from ClojureScript that connects to a db-worker-node server managed by the CLI. When installed, the CLI binary name is `logseq`.

## Build the CLI

```bash
clojure -M:cljs compile logseq-cli db-worker-node
```

## db-worker-node lifecycle

`logseq` manages `db-worker-node` automatically. You should not start the server manually. The server binds to localhost on a random port and records that port in the repo lock file.

Desktop + CLI shared semantics:
- Electron desktop and CLI are expected to use the same `db-worker-node` and lock-file protocol for a graph.
- Disk SQLite under `~/logseq/graphs` is the source of truth; OPFS periodic export is not part of the desktop primary write path.
- If a daemon already exists for the graph, CLI reuses it via lock-file discovery instead of starting a second writer.
- If lock ownership is invalid or stale, startup cleans stale lock state before retrying.
- Lock metadata includes an `owner-source` value (`cli`, `electron`, `unknown`) and lifecycle actions enforce owner boundaries.
- `server stop` and `server restart` are owner-aware: CLI can only stop/restart servers it owns (or legacy `unknown` ownership).
- If lock is missing but a matching orphan `db-worker-node` process still exists for the same repo/data-dir, startup performs orphan cleanup before retrying.

## Run the CLI

```bash
node ./dist/logseq.js graph list
```

You can also use npm link to make ./dist/logseq.js globally available, run:
```
npm link
```

If installed(or linked) globally, run:

```bash
logseq graph list
```

## Configuration

Optional configuration file: `~/logseq/cli.edn`

Default data dir: `~/logseq/graphs`.

Graph directories on disk are stored as user-facing graph names (for example, `demo/`), not `logseq_db_` prefixed repo identifiers.

Migration note: If you previously used `~/.logseq/cli-graphs` or `~/.logseq/cli.edn`, pass `--data-dir` or `--config` to continue using those locations.

Supported keys include:
- `:repo`
- `:data-dir`
- `:timeout-ms`
- `:output-format` (use `:json` or `:edn` for scripting)

CLI flags take precedence over environment variables, which take precedence over the config file.

Verbose logging:
- `--verbose` enables structured debug logs to stderr for CLI option parsing and db-worker-node API calls.
- stdout remains reserved for command output; large payloads are truncated in debug previews.

## Commands

Graph commands:
- `graph list` - list all db graphs
- `graph create --repo <name>` - create a new db graph and switch to it
- `graph switch --repo <name>` - switch current graph
- `graph remove --repo <name>` - remove a graph
- `graph validate --repo <name>` - validate graph data
- `graph info [--repo <name>]` - show graph metadata (defaults to current graph)
- `graph export --type edn|sqlite --output <path> [--repo <name>]` - export a graph to EDN or SQLite
- `graph import --type edn|sqlite --input <path> --repo <name>` - import a graph from EDN or SQLite (new graph only)

For any command that requires `--repo`, if the target graph does not exist, the CLI returns `graph not exists` (except for `graph create`). `graph import` fails if the target graph already exists.

Server commands:
- `server list` - list running db-worker-node servers
- `server status --repo <name>` - show server status for a graph
- `server start --repo <name>` - start db-worker-node for a graph
- `server stop --repo <name>` - stop db-worker-node for a graph
- `server restart --repo <name>` - restart db-worker-node for a graph
- `doctor` - run runtime diagnostics for `db-worker-node.js`, `data-dir` permissions, and running server readiness

Server ownership behavior:
- `server stop` and `server restart` can return `server-owned-by-other` if the daemon was started by another owner source.
- `server start` can return `server-start-timeout-orphan` when lock creation times out and orphan matching processes are detected.
- `server list` human output includes an `OWNER` column, and `server status` / `server list` include owner metadata in structured output (`--output json|edn`).

Inspect and edit commands:
- `list page [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list pages
- `list tag [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list tags
- `list property [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list properties
- `add block --content <text> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - add blocks; defaults to today’s journal page if no target is given
- `add block --blocks <edn> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks via EDN vector
- `add block --blocks-file <path> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks from an EDN file
- `add page --page <name>` - create a page
- `move --id <id>|--uuid <uuid> --target-id <id>|--target-uuid <uuid>|--target-page <name> [--pos first-child|last-child|sibling]` - move a block and its children (defaults to first-child)
- `remove --id <id>|--uuid <uuid>|--page <name>` - remove blocks (by db/id or UUID) or pages
- `search <query> [--type page|block|tag|property|all] [--tag <name>] [--case-sensitive] [--sort updated-at|created-at] [--order asc|desc]` - search across pages, blocks, tags, and properties (query is positional)
- `query --query <edn> [--inputs <edn-vector>]` - run a Datascript query against the graph
- `query --name <query-name> [--inputs <edn-vector>]` - run a named query (built-in or from `cli.edn`)
- `query list` - list available named queries
- `show --page <name> [--level <n>]` - show page tree
- `show --uuid <uuid> [--level <n>]` - show block tree
- `show --id <id> [--level <n>]` - show block tree by db/id

Help output:

```
Subcommands:
  list page [options]      List pages
  list tag [options]       List tags
  list property [options]  List properties
  add block [options]      Add blocks
  add page [options]       Create page
  move [options]           Move block
  remove [options]         Remove block or page
  search <query> [options] Search graph
  show [options]           Show tree
```

Options grouping:
- Help output separates **Global options** (apply to all commands) and **Command options** (command-specific flags).

Version output:
- `logseq --version` prints:

```
Build time: <timestamp>
Revision: <commit>
```

Output formats:
- Global `--output <human|json|edn>` applies to all commands
- For `graph export`, `--output` refers to the destination file path. Output formatting is controlled via `:output-format` in config or `LOGSEQ_CLI_OUTPUT`.
- Human output is plain text. List/search commands render tables with a final `Count: N` line. For list and search subcommands, the ID column uses `:db/id` (not UUID). If `:db/ident` exists, an `IDENT` column is included. Search table columns are `ID` and `TITLE`. Block titles can include multiple lines; multi-line rows align additional lines under the `TITLE` column. Times such as list `UPDATED-AT`/`CREATED-AT` and `graph info` `Created at` are shown in human-friendly relative form. Errors include error codes and may include a `Hint:` line. Use `--output json|edn` for structured output.
- `doctor` output includes overall status (`ok`, `warning`, `error`) and per-check rows for `db-worker-script`, `data-dir`, and `running-servers`. For scripting, `--output json|edn` keeps the structured check payload.
- Common doctor failures:
  - `doctor-script-missing`: `db-worker-node.js` runtime target is missing (typically `static/db-worker-node.js`; `dist/db-worker-node.js` is only the wrapper entry).
  - `doctor-script-unreadable`: script path exists but is not a readable file.
  - `data-dir-permission`: configured data dir is not readable or writable.
  - `doctor-server-not-ready`: one or more lock-discovered servers are still in `:starting` state (warning).
- `query` human output returns a plain string (the query result rendered via `pr-str`), which is convenient for pipelines like `logseq query ... | xargs logseq show --id`.
- Built-in named queries currently include `block-search`, `task-search`, `recent-updated`, `list-status`, and `list-priority`. Use `query list` to see the full set for your config.
- Show and search outputs resolve block reference UUIDs inside text, replacing `[[<uuid>]]` with the referenced block content. Nested references are resolved recursively up to 10 levels to avoid excessive expansion. For example: `[[<uuid1>]]` → `[[some text [[<uuid2>]]]]` and then `<uuid2>` is also replaced.
- `show` human output prints the `:db/id` as the first column followed by a tree:

```
id1 block1
id2 ├── b2
id3 │   └── b3
id4 ├── b4
id5 │   ├── b5
id6 │   │   └── b6
id7 │   └── b7
id8 └── b8
```

Examples:

```bash
node ./dist/logseq.js graph create --repo demo
node ./dist/logseq.js graph export --type edn --output /tmp/demo.edn --repo demo
node ./dist/logseq.js graph import --type edn --input /tmp/demo.edn --repo demo-import
node ./dist/logseq.js add block --target-page-name TestPage --content "hello world"
node ./dist/logseq.js move --uuid <uuid> --target-page TargetPage
node ./dist/logseq.js search "hello"
node ./dist/logseq.js show --page TestPage --output json
node ./dist/logseq.js server list
node ./dist/logseq.js doctor
node ./dist/logseq.js doctor --output json
```
