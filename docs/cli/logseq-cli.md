# Logseq CLI (Node)

The Logseq CLI is a Node.js program compiled from ClojureScript that connects to a db-worker-node server managed by the CLI. When installed, the CLI binary name is `logseq`.

## Build the CLI

```bash
clojure -M:cljs compile logseq-cli
```

## db-worker-node lifecycle

`logseq` manages `db-worker-node` automatically. You should not start the server manually. The server binds to localhost on a random port and records that port in the repo lock file.

## Run the CLI

```bash
node ./static/logseq-cli.js graph list

If installed globally, run:

```bash
logseq graph list
```
```

## Configuration

Optional configuration file: `~/.logseq/cli.edn`

Supported keys include:
- `:auth-token`
- `:repo`
- `:data-dir`
- `:timeout-ms`
- `:retries`
- `:output-format` (use `:json` or `:edn` for scripting)

CLI flags take precedence over environment variables, which take precedence over the config file.

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

Inspect and edit commands:
- `list page [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list pages
- `list tag [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list tags
- `list property [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list properties
- `add block --content <text> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - add blocks; defaults to today’s journal page if no target is given
- `add block --blocks <edn> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks via EDN vector
- `add block --blocks-file <path> [--target-page-name <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks from an EDN file
- `add page --page <name>` - create a page
- `move --id <id>|--uuid <uuid> --target-id <id>|--target-uuid <uuid>|--target-page-name <name> [--pos first-child|last-child|sibling]` - move a block and its children (defaults to first-child)
- `remove block --block <uuid>` - remove a block and its children
- `remove page --page <name>` - remove a page and its children
- `search <query> [--type page|block|tag|property|all] [--tag <name>] [--case-sensitive] [--sort updated-at|created-at] [--order asc|desc]` - search across pages, blocks, tags, and properties (query is positional)
- `show --page-name <name> [--format text|json|edn] [--level <n>]` - show page tree
- `show --uuid <uuid> [--format text|json|edn] [--level <n>]` - show block tree
- `show --id <id> [--format text|json|edn] [--level <n>]` - show block tree by db/id

Help output:

```
Subcommands:
  list page [options]      List pages
  list tag [options]       List tags
  list property [options]  List properties
  add block [options]      Add blocks
  add page [options]       Create page
  move [options]           Move block
  remove block [options]   Remove block
  remove page [options]    Remove page
  search <query> [options] Search graph
  show [options]           Show tree
```

Options grouping:
- Help output separates **Global options** (apply to all commands) and **Command options** (command-specific flags).

Output formats:
- Global `--output <human|json|edn>` (also accepted per subcommand)
- For `graph export`, `--output` refers to the destination file path. Output formatting is controlled via `:output-format` in config or `LOGSEQ_CLI_OUTPUT`.
- Human output is plain text. List/search commands render tables with a final `Count: N` line. For list and search subcommands, the ID column uses `:db/id` (not UUID). If `:db/ident` exists, an `IDENT` column is included. Search table columns are `ID` and `TITLE`. Times such as list `UPDATED-AT`/`CREATED-AT` and `graph info` `Created at` are shown in human-friendly relative form. Errors include error codes and may include a `Hint:` line. Use `--output json|edn` for structured output.
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
node ./static/logseq-cli.js graph create --repo demo
node ./static/logseq-cli.js graph export --type edn --output /tmp/demo.edn --repo demo
node ./static/logseq-cli.js graph import --type edn --input /tmp/demo.edn --repo demo-import
node ./static/logseq-cli.js add block --target-page-name TestPage --content "hello world"
node ./static/logseq-cli.js move --uuid <uuid> --target-page-name TargetPage
node ./static/logseq-cli.js search "hello"
node ./static/logseq-cli.js show --page-name TestPage --format json --output json
node ./static/logseq-cli.js server list
```
