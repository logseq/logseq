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

Block commands:
- `block add --content <text> [--page <name>] [--parent <uuid>]` - add blocks; defaults to today’s journal page if no page is given
- `block add --blocks <edn> [--page <name>] [--parent <uuid>]` - insert blocks via EDN vector
- `block add --blocks-file <path> [--page <name>] [--parent <uuid>]` - insert blocks from an EDN file
- `block remove --block <uuid>` - remove a block and its children
- `block remove --page <name>` - remove a page and its children
- `block search --text <query> [--limit <n>]` - search block titles (Datalog includes?)
- `block tree --page <name> [--format text|json|edn]` - show page tree
- `block tree --block <uuid> [--format text|json|edn]` - show block tree

Help output:

```
Subcommands:
  block add [options]     Add blocks
  block remove [options]  Remove block or page
  block search [options]  Search blocks
  block tree [options]    Show tree
```

Output formats:
- Global `--output <human|json|edn>` (also accepted per subcommand)

Examples:

```bash
node ./static/logseq-cli.js graph create --repo demo
node ./static/logseq-cli.js block add --page TestPage --content "hello world"
node ./static/logseq-cli.js block search --text "hello"
node ./static/logseq-cli.js block tree --page TestPage --format json --output json
node ./static/logseq-cli.js server list
```
