## Description

This library provides a `logseq` CLI for DB graphs. The CLI currently only applies to desktop DB graphs and requires the [database-version](/README.md#-database-version) desktop app to be installed. The CLI works offline by default which means it can also be used on CI/CD platforms like Github Actions. Some CLI commands can also interact with the current DB graph if the [HTTP Server](https://docs.logseq.com/#/page/local%20http%20server) is turned on in the Desktop app.

## Install

Install the `logseq` CLI with `npm install -g @logseq/cli`.

## Usage

This section assumes you have installed the CLI from npm or via the [dev
setup](#setup). If you haven't, substitute `node cli.mjs` for `logseq` e.g.
`node.cli.mjs -h`.

All commands except for `append` can be used offline or on CI. The `search` command and any command that has an api-server-token option require the [HTTP API Server](https://docs.logseq.com/#/page/local%20http%20server) to be turned on.

Now let's use it!

```
$ logseq -h
Usage: logseq [command] [options]

Options:
  -v, --version Print version

Commands:
list                 List graphs
show                 Show DB graph(s) info
search [options]     Search DB graph
query [options]      Query DB graph(s)
export [options]     Export DB graph as Markdown
export-edn [options] Export DB graph as EDN
append [options]     Appends text to current page
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

# Search your current graph and print highlighted results one per line like grep
$ logseq search woot -a my-token
Search found 100 results:
dev:db-export woot woot.edn && dev:db-create woot2 woot.edn
dev:db-diff woot woot2
...
# Can also authenticate api with $LOGSEQ_API_SERVER_TOKEN
$ LOGSEQ_API_SERVER_TOKEN=my-token logseq search woot
...

# Search a local graph
$ logseq search woot page
Search found 23 results:
Node page
Annotation page
...

# Query a graph locally using `d/entity` id(s) like an integer or a :db/ident
# Can also specify a uuid string to fetch an entity
$ logseq query woot 10 :logseq.class/Tag
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
$ logseq query woot '[:find (pull ?b [*]) :where [?b :kv/value]]'
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

# Export DB graph as markdown
$ logseq export yep
Exported 41 pages to yep_markdown_1756128259.zip

# Export DB graph as EDN
$ logseq export-edn woot -f woot.edn
Exported 16 properties, 16 classes and 36 pages

# Append text to current page
$ logseq append add this text -a my-token
Success!
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

To install the CLI locally, `yarn link`.

### Testing

Testing is done with nbb-logseq and
[nbb-test-runner](https://github.com/nextjournal/nbb-test-runner). Some basic
usage:

```
# Run all tests
$ yarn test
# List available options
$ yarn test -H
# Run tests with :focus metadata flag
$ yarn test -i focus
```

### Managing dependencies

See [standard nbb/cljs library advice in graph-parser](/deps/graph-parser/README.md#managing-dependencies).