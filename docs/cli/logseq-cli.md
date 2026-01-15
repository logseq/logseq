# Logseq CLI (Node)

The Logseq CLI is a Node.js program compiled from ClojureScript that connects to the db-worker-node server.

## Build the CLI

```bash
clojure -M:cljs compile logseq-cli
```

## Start db-worker-node (in another terminal)

```bash
clojure -M:cljs compile db-worker-node
node ./static/db-worker-node.js
```

## Run the CLI

```bash
node ./static/logseq-cli.js graph list --base-url http://127.0.0.1:9101
```

## Configuration

Optional configuration file: `~/.logseq/cli.edn`

Supported keys include:
- `:base-url`
- `:auth-token`
- `:repo`
- `:timeout-ms`
- `:retries`
- `:output-format` (use `:json` or `:edn` for scripting)

CLI flags take precedence over environment variables, which take precedence over the config file.

## Commands

Graph commands:
- `graph list` - list all db graphs
- `graph create --graph <name>` - create a new db graph and switch to it
- `graph switch --graph <name>` - switch current graph
- `graph remove --graph <name>` - remove a graph
- `graph validate --graph <name>` - validate graph data
- `graph info [--graph <name>]` - show graph metadata (defaults to current graph)

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
node ./static/logseq-cli.js graph create --graph demo --base-url http://127.0.0.1:9101
node ./static/logseq-cli.js block add --page TestPage --content "hello world"
node ./static/logseq-cli.js block search --text "hello"
node ./static/logseq-cli.js block tree --page TestPage --format json --output json
```
