## Description

This library provides a `logseq` CLI for DB graphs created using the [database-version](/README.md#-database-version). By default, the CLI works offline with local graphs. This allows for running commands automatically on CI/CD platforms like Github Actions. Most CLI commands also connect to the current DB graph in a desktop app (a.k.a. in-app graph) if the [HTTP API Server](https://docs.logseq.com/#/page/local%20http%20server) is turned on.

## Install

Install the `logseq` CLI with `npm install -g @logseq/cli`.

## Usage

This section assumes you have installed the CLI from npm or via the [dev
setup](#setup). If you haven't, substitute `node cli.mjs` for `logseq` e.g.
`node.cli.mjs -h`.

All commands work with both local graphs and the current in-app graph except for `append` (in-app graph only), `validate` (local graph only) and `export` (local graph only). For a command to work with an in-app graph, the [HTTP API Server](https://docs.logseq.com/#/page/local%20http%20server) must be turned on.

Now let's use the CLI!

```sh
$ logseq -h
Usage: logseq [command] [options]

Options:
  -v, --version Print version

Commands:
list                 List local graphs
show                 Show DB graph(s) info
search [options]     Search DB graph
query [options]      Query DB graph(s)
export [options]     Export DB graph as Markdown
export-edn [options] Export DB graph as EDN
import-edn [options] Import into DB graph with EDN
append [options]     Appends text to current page
mcp-server [options] Run a MCP server
validate [options]   Validate DB graph
help                 Print a command's help

$ logseq list
DB Graphs:
db-test
docs
woot
...

File Graphs:
docs
...

$ logseq show db-test

|                         Name |                                              Value |
|------------------------------+----------------------------------------------------|
|              Graph directory |                    /Users/me/logseq/graphs/db-test |
|             Graph created at |                                     Jul 12th, 2025 |
|         Graph schema version |                              {:major 65, :minor 7} |
| Graph initial schema version |                              {:major 65, :minor 7} |
|      Graph created by commit | https://github.com/logseq/logseq/commit/3c93fd2637 |
|            Graph imported by |                                  :cli/create-graph |
```

To run a command against the current desktop graph, set `$LOGSEQ_API_SERVER_TOKEN` once or set `-a` each time with a valid token for the desktop's HTTP API server:

```sh
# Search your current graph and print highlighted results one per line like grep
$ logseq search woot -a my-token
Search found 100 results:
dev:db-export woot woot.edn && dev:db-create woot2 woot.edn
dev:db-diff woot woot2
...
# Can also authenticate api with $LOGSEQ_API_SERVER_TOKEN
$ export LOGSEQ_API_SERVER_TOKEN=my-token
$ logseq search woot
...
```

Here are more examples of all the available commands:
```sh
# Search a local graph
$ logseq search page -g woot
Search found 23 results:
Node page
Annotation page
...

# Query a graph locally using `d/entity` id(s) like an integer or a :db/ident
# Can also specify a uuid string to fetch an entity
$ logseq query 10 :logseq.class/Tag -g woot
({:db/id 10,
  :db/ident :logseq.kv/graph-git-sha,
  :kv/value "f736895b1b-dirty"}
 {:block/uuid #uuid "00000002-5389-0208-3000-000000000000",
  :block/updated-at 1751990934670,
  :logseq.property.class/extends #{{:db/id 1}},
  :block/created-at 1751990934670,
  :logseq.property/built-in? true,
  :block/tags #{{:db/id 2}},
  :block/title "Tag",
  :db/id 2,
  :db/ident :logseq.class/Tag,
  :block/name "tag"})

# Query a graph using a datalog query
$ logseq query '[:find (pull ?b [*]) :where [?b :kv/value]]' -g woot
[{:db/id 5, :db/ident :logseq.kv/db-type, :kv/value "db"}
 {:db/id 6,
  :db/ident :logseq.kv/schema-version,
  :kv/value {:major 65, :minor 7}}

# Query the current graph using the api server
# An api query can be a datalog query or a simple query
$ logseq query '(task DOING)' -a my-token
 [{:journalDay 20250717,
   :name "jul 17th, 2025",
   :title "Jul 17th, 2025",
   :type "journal",
   :uuid "00000001-2025-0717-0000-000000000000",
   :id 36418,
   :content "Jul 17th, 2025"},
  :title
  "DOING Logseq CLI\nid:: 68795144-e5f6-48e8-849d-79cd6473b952\n:LOGBOOK:\nCLOCK: [2025-07-17 Thu 12:37:09]\n:END:",
  :propertiesOrder ["id"],
  :id 37013,
  :order "aF",
  :uuid "68795144-e5f6-48e8-849d-79cd6473b952"}
  ...

# Export local graph as markdown
$ logseq export -g yep
Exported 41 pages to yep_markdown_1756128259.zip

# Export current graph as EDN
$ logseq export-edn -a my-token
Exported 16 properties, 3 classes and 16 pages to yep_1763407592.edn
# Export local graph as EDN to specified file
$ logseq export-edn -g woot -f woot.edn
Exported 16 properties, 1 classes and 36 pages to woot.edn

# Import into current graph with EDN
$ logseq import-edn -f woot-ontology.edn
Imported 16 properties, 1 classes and 0 pages!

# Validate a local graph. Useful to run in CI
$ logseq validate -g woot
Read graph woot with counts: {:entities 317, :pages 159, :blocks 147, :classes 17, :properties 112, :objects 64, :property-pairs 669, :datoms 3964}
Valid!

# Append text to current page
$ logseq append add this text -a my-token
Success!

# Start mcp-server against a local desktop graph
$ logseq mcp-server -g yep
MCP Streamable HTTP Server started on 127.0.0.1:12315
# Start mcp-server against a local graph file
$ logseq mcp-server -g ~/Downloads/logseq_db_yep_1751032977.sqlite
MCP Streamable HTTP Server started on 127.0.0.1:12315
```

## API

This library is under the parent namespace `logseq.cli`.

## Dev

Most of this library is also compatible with ClojureScript for use on the
frontend. This library follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/cli.yml) for linting examples.

### Setup

First install the following dependencies:
* Install node.js >= 22 and yarn.
* Run `yarn install` to install npm dependencies.
* Install [babashka](https://github.com/babashka/babashka).

To install the CLI locally so that local changes are immediately reflected in `logseq`, `yarn link`.

### Testing

Testing is done with nbb-logseq and
[nbb-test-runner](https://github.com/nextjournal/nbb-test-runner). Some basic
usage:

```sh
# Run all tests
$ yarn test
# List available options
$ yarn test -H
# Run tests with :focus metadata flag
$ yarn test -i focus
```

### Managing dependencies

See [standard nbb/cljs library advice in graph-parser](/deps/graph-parser/README.md#managing-dependencies).

### Build

To build and install a local version of the CLI:
```sh
$ bb build:vendor-nbb-deps && npm pack && npm install -g ./logseq-cli-*.tgz
# Run this to bring local code back to a clean state. Not running this will cause local dev issues
$ git checkout nbb.edn && rm -rf vendor logseq-cli*.tgz
```

The above is useful for testing the build process and ensuring the released tarball has no issues.