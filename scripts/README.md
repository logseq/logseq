## Description
This is a collection of development related scripts, written as bash scripts, bb/babashka scripts and nbb scripts.

## Usage

### Babashka scripts
Most bb scripts live under `src/` and are defined as bb tasks. See [babashka tasks](../docs/dev-practices.md#babashka-tasks)

### Nbb scripts

Before running [nbb-logseq](https://github.com/logseq/nbb-logseq) scripts, be sure to have node >= 18.14 installed as well as a recent [babashka](https://github.com/babashka/babashka) for managing the dependencies in `nbb.edn`. Then `yarn install` to install dependencies

#### Create graph scripts

For database graphs, it is possible to create graphs with the
[logseq.tasks.db-graph.create-graph](src/logseq/tasks/db_graph/create_graph.cljs)
ns. This ns makes it easy to write scripts that create graphs by supporting a
concise EDN map for graph generation. For example, the
`create_graph_with_properties.cljs` script uses this ns to create a graph with
a variety of properties:

```
$ yarn nbb-logseq src/logseq/tasks/db_graph/create_graph_with_properties.cljs woot
Generating 16 pages and 24 blocks ...
Created graph woot!
```

This script creates a DB graph with blocks containing several property types for
both single and many cardinality. It also includes queries for most of these
properties. Read the docs in
[logseq.tasks.db-graph.create-graph](src/logseq/tasks/db_graph/create_graph.cljs)
for specifics on the EDN map.

#### Update graph scripts

For database graphs, it is possible to update graphs with the
[logseq.tasks.db-graph.persist-graph](src/logseq/tasks/db_graph/persist_graph.cljs)
ns. This ns makes it easy to write scripts that update graphs using datascript
and logseq's schema. For example, the `update_graph_to_add_todos.cljs` script
uses this ns to update blocks with a specified query with a `TODO` task marker:

```
$ yarn -s nbb-logseq src/logseq/tasks/db_graph/update_graph_to_add_todos.cljs woot '[:find (pull ?b [*]) :where (has-property ?b :url-many)]'
Updated 1 block(s) with a 'TODO' for graph woot!
```

This script updates a DB graph by finding all blocks that match the given
property query and marking them as `TODO`.