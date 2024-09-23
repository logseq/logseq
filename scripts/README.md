## Description
This is a collection of development related scripts, written as bash scripts, bb/babashka scripts and nbb scripts.

## Usage

### Babashka scripts
Most bb scripts live under `src/` and are defined as bb tasks. See [babashka tasks](../docs/dev-practices.md#babashka-tasks)

### Nbb scripts

Before running [nbb-logseq](https://github.com/logseq/nbb-logseq) scripts, be sure to have node >= 18.14 installed as well as a recent [babashka](https://github.com/babashka/babashka) for managing the dependencies in `nbb.edn`. Then `yarn install` to install dependencies

#### Create graph scripts

These scripts generate custom database graphs written with nbb-logseq. If this is
your first time generating a DB graph, first try the
`dev:db-create` bb task in [db graph
tasks](../docs/dev-practices.md#db-graph-tasks) as it only requires writing EDN.

Creating graphs from the commandline using scripts and a concise EDN map is
possible thanks to nbb-logseq and the namespaces
[logseq.outliner.db-pipeline](deps/outliner/src/logseq/outliner/db_pipeline.cljs)
and [logseq.db.sqlite.build](deps/db/src/logseq/db/sqlite/build.cljs).  For
example, the `create_graph_with_properties.cljs` script uses this ns to create a
graph with a variety of properties:

```
$ yarn nbb-logseq src/logseq/tasks/db_graph/create_graph_with_properties.cljs woot
Generating 16 pages and 24 blocks ...
Created graph woot!
```

**NOTE**: To use this created graph, click on the three dots menu in the upper right corner and select `Import`. Then click on the `SQLite` import button and upload the generated graph.

This script creates a DB graph with blocks containing several property types for
both single and many cardinality. It also includes queries for most of these
properties. Read the docs in
[logseq.db.sqlite.build](deps/db/src/logseq/db/sqlite/build.cljs)
for specifics on the EDN map.

To create large graphs with varying size:

```
$ yarn -s nbb-logseq src/logseq/tasks/db_graph/create_graph_with_large_sizes.cljs large
Building tx ...
Built 21000 tx, 1000 pages and 20000 blocks ...
Transacting chunk 1 of 21 starting with block: #:block{:name "page-0"}
...
Created graph large with 187810 datoms!

# To see options available
$ yarn -s nbb-logseq src/logseq/tasks/db_graph/create_graph_with_large_sizes.cljs -h
Usage: $0 GRAPH-NAME [OPTIONS]
Options:
  -h, --help        Print help
  -p, --pages  1000 Number of pages to create
  -b, --blocks 20   Number of blocks to create
```

Another example is the `create_graph_with_schema_org.cljs` script which creates a graph
with the https://schema.org/ ontology with as many of the classes and properties as possible:

```
$ yarn -s nbb-logseq src/logseq/tasks/db_graph/create_graph_with_schema_org.cljs schema
Skipping 67 superseded properties
Skipping 25 properties with unsupported data types
Renaming 1 properties due to page name conflicts
Generating 2268 pages with 900 classes and 1368 properties ...
Created graph schema!
```

#### Update graph scripts

For database graphs, it is recommended to use
`logseq.outliner.db-pipeline/add-listener!` when updating graphs. TODO
