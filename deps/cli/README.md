## Description

This library provides a `logseq` CLI for DB graph to be installed with npm or yarn. Most of this
library is also compatible with ClojureScript for use on the frontend.

## Usage

First, install the CLI per [the dev setup instructions](#setup). Ensure that you have the [database-version](/README.md#-database-version) desktop app installed. If you can't install the CLI locally, the below commands can be run as `node cli.mjs` for `logseq` e.g. `node.cli.mjs -h`.

All commands excepts for `search` can be used offline or on CI. For the `search` command and any command that has an optional api-query-token mode, you will need the [HTTP Server](https://docs.logseq.com/#/page/local%20http%20server) turned on in the Desktop app.

Then use it!

```
$ logseq -h
Usage: logseq [command] [options]

Options:
  -v, --version Print version

Commands:
list                 List graphs
show                 Show DB graph(s) info
search [options]     Search current DB graph
query [options]      Query DB graph(s)
export-edn [options] Export DB graph as EDN
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

# Search your current graph and print results one per line like grep
$ logseq search woot -a my-token
Search found 100 results:
dev:db-export woot woot.edn && dev:db-create woot2 woot.edn
dev:db-diff woot woot2
...

# Local query using `d/entity` ids like a :db/ident
$ logseq query woot :logseq.class/Tag
({:block/uuid #uuid "00000002-5389-0208-3000-000000000000",
  :block/updated-at 1751985393459,
  :logseq.property.class/extends #{{:db/id 1}},
  :block/refs #{{:db/id 1} {:db/id 23} {:db/id 40}},
  :block/created-at 1751985393459,
  :logseq.property/built-in? true,
  :block/tags #{{:db/id 2}},
  :block/title "Tag",
  :db/id 2,
  :db/ident :logseq.class/Tag,
  :block/path-refs #{{:db/id 1} {:db/id 23} {:db/id 40}},
  :block/name "tag"})

# Local query using datalog
$ logseq query woot '[:find (pull ?b [*]) :where [?b :kv/value]]'
[{:db/id 5, :db/ident :logseq.kv/db-type, :kv/value "db"}
 {:db/id 6,
  :db/ident :logseq.kv/schema-version,
  :kv/value {:major 65, :minor 7}}

# Api query using a simple query
# Api query can also take a datalog query like the local query
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

# Export your DB graph as EDN
$ logseq export-edn woot -f woot.edn
Exported 16 properties, 16 classes and 36 pages
```

## API

This library is under the parent namespace `logseq.cli`.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/cli.yml) for linting examples.

### Setup

First install the following dependencies:
* Install node.js >= 22 and yarn or npm.
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
