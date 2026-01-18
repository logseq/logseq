# Logseq CLI (Node)

The Logseq CLI is a Node.js program compiled from ClojureScript that connects to a db-worker-node server managed by the CLI.

## Build the CLI

```bash
clojure -M:cljs compile logseq-cli
```

## db-worker-node lifecycle

`logseq-cli` manages `db-worker-node` automatically. You should not start the server manually. The server binds to localhost on a random port and records that port in the repo lock file.

## Run the CLI

```bash
node ./static/logseq-cli.js graph list
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

For any command that requires `--repo`, if the target graph does not exist, the CLI returns `graph not exists` (except for `graph create`).

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
- `add block --content <text> [--page <name>] [--parent <uuid>]` - add blocks; defaults to today’s journal page if no page is given
- `add block --blocks <edn> [--page <name>] [--parent <uuid>]` - insert blocks via EDN vector
- `add block --blocks-file <path> [--page <name>] [--parent <uuid>]` - insert blocks from an EDN file
- `add page --page <name>` - create a page
- `remove block --block <uuid>` - remove a block and its children
- `remove page --page <name>` - remove a page and its children
- `search --text <query> [--type page|block|tag|property|all] [--include-content] [--limit <n>]` - search across pages, blocks, tags, and properties
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
  remove block [options]   Remove block
  remove page [options]    Remove page
  search [options]         Search graph
  show [options]           Show tree
```

Output formats:
- Global `--output <human|json|edn>` (also accepted per subcommand)

Examples:

```bash
node ./static/logseq-cli.js graph create --repo demo
node ./static/logseq-cli.js add block --page TestPage --content "hello world"
node ./static/logseq-cli.js search --text "hello"
node ./static/logseq-cli.js show --page-name TestPage --format json --output json
node ./static/logseq-cli.js server list
```
