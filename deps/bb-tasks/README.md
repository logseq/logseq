## Description

Library of reusable https://github.com/babashka/babashka tasks

## Install

Add a git dependency to your `bb.edn`:

```clojure
:deps
{logseq/bb-tasks
{:git/url "https://github.com/logseq/logseq"
 :git/sha "FILL IN"
 :deps/root "deps/bb-tasks"}}
```

## Usage

### nbb:watch

Given a graph directory and an nbb script, the nbb script will run when either the
script or a file in the directory is saved.

For example, from root of logseq repo, run the following:

```
$ bb nbb:watch /path/to/graph deps/graph-parser/examples/parse_file.cljs
Watching /path/to/graph ...
```

See [this demo
clip](https://www.loom.com/share/20debb49fdd64e77ae83056289750b0f) to see it in
action.
