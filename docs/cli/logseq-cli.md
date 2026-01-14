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
node ./static/logseq-cli.js ping --base-url http://127.0.0.1:9101
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
- `graph-list` - list all db graphs
- `graph-create --graph <name>` - create a new db graph and switch to it
- `graph-switch --graph <name>` - switch current graph
- `graph-remove --graph <name>` - remove a graph
- `graph-validate --graph <name>` - validate graph data
- `graph-info [--graph <name>]` - show graph metadata (defaults to current graph)

Graph content commands:
- `add --content <text> [--page <name>] [--parent <uuid>]` - add blocks; defaults to today’s journal page if no page is given
- `add --blocks <edn> [--page <name>] [--parent <uuid>]` - insert blocks via EDN vector
- `add --blocks-file <path> [--page <name>] [--parent <uuid>]` - insert blocks from an EDN file
- `remove --block <uuid>` - remove a block and its children
- `remove --page <name>` - remove a page and its children
- `search --text <query> [--limit <n>]` - search block titles (Datalog includes?)
- `tree --page <name> [--format text|json|edn]` - show page tree
- `tree --block <uuid> [--format text|json|edn]` - show block tree

Examples:

```bash
node ./static/logseq-cli.js graph-create --graph demo --base-url http://127.0.0.1:9101
node ./static/logseq-cli.js add --page TestPage --content "hello world"
node ./static/logseq-cli.js search --text "hello"
node ./static/logseq-cli.js tree --page TestPage --format json
```
