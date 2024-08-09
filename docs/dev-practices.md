## Description

This page describes development practices for this codebase.

## Linting

Most of our linters require babashka. Before running them, please [install babashka](https://github.com/babashka/babashka#installation). To invoke all the linters in this section, run

```sh
bb lint:dev
```

### Clojure code

To lint:
```sh
clojure -M:clj-kondo --parallel --lint src --cache false
```

We lint our Clojure(Script) code with https://github.com/clj-kondo/clj-kondo/. If you need to configure specific linters, see [this documentation](https://github.com/clj-kondo/clj-kondo/blob/master/doc/linters.md). Where possible, a global linting configuration is used and namespace specific configuration is avoided.

There are outstanding linting items that are currently ignored to allow linting the rest of the codebase in CI. These outstanding linting items should be addressed at some point:

* Comments starting with `TODO:lint`
* Code marked with `#_:clj-kondo/ignore` require a good understanding of the context to address as they usually involve something with a side effect or require changing multiple fns up the call stack.

### Unused vars

We use https://github.com/borkdude/carve to detect unused vars in our codebase.

To run this linter:
```sh
bb lint:carve
```

By default, the script runs in CI mode which prints unused vars if they are
found. The script can be run in an interactive mode which prompts for keeping
(ignoring) an unused var or removing it. Run this mode with:

```sh
bb lint:carve '{:interactive true}'
```

When a var is ignored, it is added to `.carve/ignore`. Please add a comment for
why a var is ignored to help others understand why it's unused.

### Large vars

Large vars have a lot of complexity and make it hard for the team to maintain
and understand them. To run this linter:
```sh
bb lint:large-vars
```

To configure the linter, see the `[:tasks/config :large-vars]` path of bb.edn.

### Document namespaces

Documentation helps teams share their knowledge and enables more individuals to contribute to the codebase. Documenting our namespaces is a good first step to improving our documentation. To run this linter:
```sh
bb lint:ns-docstrings
```

To skip documenting a ns, use the common `^:no-doc` metadata flag.

### Datalog linting

We use [datascript](https://github.com/tonsky/datascript)'s datalog to power our
modeling and querying layer. Since datalog is concise, it is easy to write
something invalid. To avoid typos and other preventable mistakes, we lint our
queries and rules. Our queries are linted through clj-kondo and
[datalog-parser](https://github.com/lambdaforge/datalog-parser). clj-kondo will
error if it detects an invalid query.

### Translations

We use [tongue](https://github.com/tonsky/tongue), a simple and effective
library, for translations. We have a couple bb tasks for working with
translations under `lang:` e.g. `bb lang:list`. See [the translator
guide](./contributing-to-translations.md) for usage.

One useful task for reviewers (us) and contributors alike, is `bb
lang:validate-translations` which catches [common
mistakes](./contributing-to-translations.md#fix-mistakes)). When reviewing
translations here are some things to keep in mind:

* Punctuation and delimiting characters (e.g. `:`, `:`, `?`) should be part of
  the translatable string. Those characters and their position may vary depending on the language.
* Translations usually return strings but they can return hiccup vectors with a
  fn translation. Hiccup vectors are needed when word order matters for a
  translation and formatting is involved. See [this 3 word Turkish
  example](https://github.com/logseq/logseq/commit/1d932f07c4a0aad44606da6df03a432fe8421480#r118971415).
* Translations can be anonymous fns with arguments for interpolating strings. Fns should be simple and only include the following fns: `str`, `when`, `if` and `=`.

### Spell Checker

We use [typos](https://github.com/crate-ci/typos) to spell check our source code.

To install it locally and use it:

```sh
$ brew install typos-cli
# Catch any errors
$ typos
# Fix errors
$ typos -w
```

To configure it e.g. for dealing with false positives, see `typos.toml`.

### Separate DB and File Graph Code

There is a growing number of code and features that are only for file or DB graphs. Run this linter to
ensure that code you add or modify keeps with existing conventions:

```
$ bb lint:db-and-file-graphs-separate
✅ All checks passed!
```

The main convention is that file and db specific files go under directories named `file_based` and `db_based` respectively. To see the full list of file and db specific namespaces and files see the top of [the script](/scripts/src/logseq/tasks/dev/db_and_file_graphs.clj).

### Separate Worker from Frontend

The worker and frontend code share common code from deps/ and `frontend.common.*`. However, the worker should never depend on other frontend namespaces as it could pull in libraries like React which cause it to fail hard. Likewise the frontend should never depend on worker namespaces. Run this linter to ensure worker and frontend namespaces don't require each other:

```
$ bb lint:worker-and-frontend-separate
Valid worker namespaces!
Valid frontend namespaces!
```

## Testing

We have unit, performance and end to end tests.

### End to End Tests

Even though we have a nightly release channel, it's hard for testing users (thanks to the brave users!) to notice all issues in a limited time, as Logseq is covering so many features.
The only solution is automatic end-to-end tests - adding tests for GUI software is always painful but necessary. See https://github.com/logseq/logseq/pulls?q=E2E for e2e test examples.

To run end to end tests

```sh
yarn electron-watch
# in another shell
yarn e2e-test # or npx playwright test
```

If e2e failed after first running:
- `rm -rdf ~/.logseq`
- `rm -rdf ~/.config/Logseq`
- `rm -rdf <repo dir>/tmp/`
- Windows: `rmdir /s %APPDATA%/Electron`  (Reference: https://www.electronjs.org/de/docs/latest/api/app#appgetpathname)

There's a `traceAll()` helper function to enable playwright trace file dump for specific test files https://github.com/logseq/logseq/pull/8332

If e2e tests fail in the file, they can be debugged by examining a trace dump with [the
playwright trace
viewer](https://playwright.dev/docs/trace-viewer#recording-a-trace).

Locally this will get dumped into e2e-dump/.

On CI the trace file will be under Artifacts at the bottom of a run page e.g.
https://github.com/logseq/logseq/actions/runs/3574600322.

### Unit Testing

Our unit tests use the [shadow-cljs test-runner](https://shadow-cljs.github.io/docs/UsersGuide.html#_testing). To run them:

```bash
yarn test
```

By convention, a namespace's tests are found at a corresponding namespace
of the same name with an added `-test` suffix. For example, tests
for `frontend.db.model` are found in `frontend.db.model-test`.

There are a couple different ways to run tests:

* [Focus tests](#focus-tests) - Run one or more tests from the CLI
* [Autorun tests](#autorun-tests) - Autorun tests from the CLI
* [Repl tests](#repl-tests) - Run tests from REPL

There a couple types of tests and they can overlap with each other:

* [Database tests](#database-tests) - Tests that involve a datascript DB.
* [Performance tests](#performance-tests) - Tests that aim to measure and enforce a performance characteristic.
* [Async tests](#async-tests) - Tests that run async code and require some helpers.

#### Focus Tests

Tests can be selectively run on the commandline using our own test runner which
provides the same test selection options as [cognitect-labs/test
runner](https://github.com/cognitect-labs/test-runner#invoke-with-clojure--m-clojuremain).
For this workflow:

1. Run `clj -M:test watch test` in one shell
2. Focus tests:
  1. Add `^:focus` metadata flags to tests e.g. `(deftest ^:focus test-name ...)`.
  2. In another shell, run `node static/tests.js -i focus` to only run those
  tests. To run all tests except those tests run `node static/tests.js -e focus`.
3. Or focus namespaces: Using the regex option `-r`, run tests for `frontend.db.query-dsl-test` with `node static/tests.js -r query-dsl`.

Multiple options can be specified to AND selections. For example, to run all `frontend.db.query-dsl-test` tests except for the focused one: `node static/tests.js -r query-dsl -e focus`

For help on more options, run `node static/tests.js -h`.

#### Autorun Tests

To run tests automatically on file save, run `clojure -M:test watch test
--config-merge '{:autorun true}'`. Specific namespace(s) can be auto run with
the `:ns-regexp` option e.g. `clojure -M:test watch test --config-merge
'{:autorun true :ns-regexp "frontend.db.query-dsl-test"}'`.

#### REPL tests

Most unit tests e.g. ones that are browser compatible and don't require node libraries, can be run from the REPL. To do so:

* Start a REPL for your editor. See [here for an example](https://github.com/logseq/logseq/blob/master/docs/develop-logseq.md#repl-setup).
* Load a test namespace.
* Run `(cljs.test/run-tests)` to run tests for the current test namespace.


#### Database tests

To write a test that uses a datascript db:

* Be sure your test ns has test fixtures from `test-helper` ns to create and
  destroy test databases after each test.
* The easiest way to set up test data is to use `test-helper/load-test-files`.
* For the repo argument that most fns take, pass it `test-helper/test-db`

#### Performance tests
To write a performance test:

* Use `frontend.util/with-time-number` to get the time in ms.

* Example:
  ```clojure
  (are [x timeout] (>= timeout (:time (util/with-time-number (block/normalize-block x true))))
      ... )
  ```

For examples of these tests, see `frontend.db.query-dsl-test` and `frontend.db.model-test`.

#### Async Tests

Async unit testing is well supported in ClojureScript.
https://clojurescript.org/tools/testing#async-testing is a good guide for how to
do this. We have a couple of test helpers that make testing async easier:

- `frontend.test.helper/deftest-async` - `deftest` for async tests that ensures
  uncaught exceptions don't abruptly end the test suite. If you don't use this
  macro for async tests, you are expected to handle unexpected failures in your test
- `frontend.test.helper/with-reset` - A version of `with-redefs` that works for
  async contexts

## Accessibility

Please refer to our [accessibility guidelines](accessibility.md).

## Logging

For logging, we use https://github.com/lambdaisland/glogi. When in development,
be sure to have [enabled custom
formatters](https://github.com/binaryage/cljs-devtools/blob/master/docs/installation.md#enable-custom-formatters-in-chrome)
in the desktop app and browser. Without this enabled, most of the log messages
aren't readable.

## Data validation and generation

We use [malli](https://github.com/metosin/malli) and
[spec](https://github.com/clojure/spec.alpha)  data validation, fn validation
(and generation someday). malli has the advantage that its schema is data and
can be used for additional purposes.

Reusable malli schemas should go under `src/main/frontend/schema/` and be
compatible with clojure and clojurescript. See
`frontend.schema.handler.plugin-config` for an example.

Reusable specs should go under `src/main/frontend/spec/` and be compatible with
clojure and clojurescript. See `frontend.spec.storage` for an example.

By following these conventions, these should also be usable by babashka. This is
helpful as it allows for third party tools to be written with logseq's data
model.

### Optionally Validating Functions

We use [malli](https://github.com/metosin/malli) for optionally validating fns
a.k.a instrumenting fns. Function validation is enabled in dev mode. To add
typing for a fn, just add it to a var's metadata [per this
example](https://github.com/metosin/malli/blob/master/docs/function-schemas.md#function-schema-metadata).
We also have clj-kondo type annotations derived from these fn schemas. To
re-generate them after new schemas have been added, update the namespaces in
`gen-malli-kondo-config.core` and then run `bb dev:gen-malli-kondo-config`. To
learn more about fn instrumentation, see [this
page](https://github.com/metosin/malli/blob/master/docs/clojurescript-function-instrumentation.md).

## Auto-formatting

Currently the codebase is not formatted/indented consistently. We loosely follow https://github.com/bbatsov/clojure-style-guide. [cljfmt](https://cljdoc.org/d/cljfmt/) is a common formatter used for Clojure, analogous to Prettier for other languages. You can do so easily with the [Calva](https://marketplace.visualstudio.com/items?itemName=betterthantomorrow.calva) extension in [VSCode](https://code.visualstudio.com/): It will (mostly) indent your code correctly as you type, and you can move your cursor to the start of the line(s) you've written and press `Tab` to auto-indent all Clojure forms nested under the one starting on the current line.

## Naming

We strive to use explicit names that are self explanatory so that our codebase is readable and maintainable. Sometimes we use abbreviations for frequently occurring concepts. Some common abbreviations:

* `rpath` - Relative path e.g. `logseq/config.edn`
* `fpath` -  Full path e.g. `/full/path/to/logseq/config.edn`

## Development Tools

### Babashka tasks

There are a number of bb tasks under `dev:` for developers. Some useful ones to
point out:

* `dev:validate-repo-config-edn` - Validate a repo config.edn

  ```sh
  bb dev:validate-repo-config-edn deps/common/resources/templates/config.edn
  ```


* `dev:publishing` - Build a publishing app for a given graph dir. If the
  publishing frontend is out of date, it builds that first which takes time.
  Subsequent runs are quick.

  ```sh
  # One time setup
  $ cd scripts && yarn install && cd -

  # Build a release publishing app
  $ bb dev:publishing /path/to/graph-dir tmp/publish

  # OR build a dev publishing app that watches frontend changes
  $ bb dev:publishing /path/to/graph-dir tmp/publish --dev

  # View the publishing app in a browser
  $ python3 -m http.server 8080 -d tmp/publish &; open http://localhost:8080

  # Rebuild the publishing backend for dev/release.
  # Handy when making backend changes in deps/publishing or
  # to test a different graph
  $ bb dev:publishing-backend /path/graph-dir tmp/publish

  ```

There are also some tasks under `nbb:` which are useful for inspecting database
changes in realtime. See [these
docs](https://github.com/logseq/bb-tasks#logseqbb-tasksnbbwatch) for more info.

#### DB Graph Tasks

These tasks are specific to database graphs. For these tasks there is a one time setup:

```sh
  $ cd deps/db && yarn install && cd ../outliner && yarn install && cd ../..
```

* `dev:validate-db` - Validates a DB graph's datascript schema

  ```sh
  # One or more graphs can be validated e.g.
  $ bb dev:validate-db test-db schema -c -g
  Read graph test-db with 1572 datoms, 220 entities and 13 properties
  Valid!
  Read graph schema with 26105 datoms, 2320 entities and 3168 properties
  Valid!
  ```

* `dev:db-query` - Query a DB graph

  ```sh
  $ bb dev:db-query woot '[:find (pull ?b [*]) :where (block-content ?b "Dogma")]'
  DB contains 833 datoms
  [{:block/tx-id 536870923, :block/link #:db{:id 100065}, :block/uuid #uuid "65565c26-f972-4400-bce4-a15df488784d", :block/updated-at 1700158508564, :block/order "a0", :block/refs [#:db{:id 100064}], :block/created-at 1700158502056, :block/format :markdown, :block/tags [#:db{:id 100064}], :block/title "Dogma #~^65565c2a-b1c5-4dc8-a0f0-81b786bc5c6d", :db/id 100090, :block/path-refs [#:db{:id 100051} #:db{:id 100064}], :block/parent #:db{:id 100051}, :block/page #:db{:id 100051}}]
  ```

* `dev:db-transact` - Run a `d/transact!` against the queried results of a DB graph

  ```sh
  # The second arg is a datascript like with db-query. The third arg is a fn that is applied to each query result to generate transact data
  $ bb dev:db-transact
  Usage: $0 GRAPH-DIR QUERY TRANSACT-FN

  # First use the -n flag to see a dry-run of what would happen
  $ bb dev:db-transact test-db '[:find ?b :where [?b :block/type "object"]]' '(fn [id] (vector :db/retract id :block/type "object"))' -n
  Would update 16 blocks with the following tx:
  [[:db/retract 100137 :block/type "object"] [:db/retract 100035 :block/type "object"] [:db/retract 100128 :block/type "object"] [:db/retract 100049 :block/type "object"] [:db/retract 100028 :block/type "object"] [:db/retract 100146 :block/type "object"] [:db/retract 100144 :block/type "object"] [:db/retract 100047 :block/type "object"] [:db/retract 100145 :block/type "object"] [:db/retract 100046 :block/type "object"] [:db/retract 100045 :block/type "object"] [:db/retract 100063 :block/type "object"] [:db/retract 100036 :block/type "object"] [:db/retract 100044 :block/type "object"] [:db/retract 100129 :block/type "object"] [:db/retract 100030 :block/type "object"]]
  With the following blocks updated:
  ...

  # When the transact looks good, run it without the flag
  $ bb dev:db-transact test-db '[:find ?b :where [?b :block/type "object"]]' '(fn [id] (vector :db/retract id :block/type "object"))'
  Updated 16 block(s) for graph test-db!
  ```

* `dev:db-create` - Create a DB graph given a `sqlite.build` EDN file

  First in Electron, create the name of the graph you want create e.g. `inferred`.
  Then:

  ```sh
  bb dev:db-create inferred deps/db/script/create_graph/inferred.edn
  Generating 11 pages and 0 blocks ...
  Created graph inferred!
  ```

  Finally, upload this created graph with the dev command: `Replace graph with
  its db.sqlite file`. You'll be switched to the graph and you can use it!

* `dev:db-datoms` and `dev:diff-datoms` - Save a db's datoms to file and diff two datom files

  ```sh
  # Save a current datoms snapshot of a graph
  $ bb dev:db-datoms woot w2.edn
  # After some edits, save another datoms snapshot
  $ bb dev:db-datoms woot w3.edn

  # Diff the two datom snapshots
  # This snapshot correctly shows an added block with content "b7" and a property using a closed :default value
  $  bb dev:diff-datoms w2.edn w3.edn
  [[]
  [[162 :block/title "b7" 536871039 true]
    [162 :block/created-at 1703004379103 536871037 true]
    [162 :block/format :markdown 536871037 true]
    [162 :block/page 149 536871037 true]
    [162 :block/parent 149 536871037 true]
    [162 :block/path-refs 108 536871044 true]
    [162 :block/path-refs 149 536871044 true]
    [162 :block/path-refs 160 536871044 true]
    [162
    :block/properties
    {#uuid "21be4275-bba9-48b8-9351-c9ca27883159"
      #uuid "6581b09e-8b9c-4dca-a938-c900aedc8275"}
    536871043
    true]
    [162 :block/refs 108 536871043 true]
    [162 :block/refs 160 536871043 true]
    [162
    :block/uuid
    #uuid "6581c8db-a2a2-4e09-b30d-cdea6ad69512"
    536871037
    true]]]

  # By default this task ignores commonly changing datascript attributes.
  # To see all changed attributes, tell the task to ignore a nonexistent attribute:
  $ bb dev:diff-datoms w2.edn w3.edn -i a
  [[[nil nil 536871029 536871030]
    [nil nil 1702998192728 536871029]
    [nil nil 536871035 536871036]
    [nil nil 1703000139716 536871035]
    [nil nil 149 536871033]
    [nil nil 536871035 536871036]]
  [[nil nil 536871041 536871042]
    [nil nil 1703004384793 536871041]
    [nil nil 536871039 536871040]
    [nil nil 1703004380918 536871039]
    [nil nil 162 536871037]
    [nil nil 536871037 536871038]
    [162 :block/title "b7" 536871039 true]
    [162 :block/created-at 1703004379103 536871037 true]
    [162 :block/format :markdown 536871037 true]
    [162 :block/order "a0" 536871037 true]
    [162 :block/page 149 536871037 true]
    [162 :block/parent 149 536871037 true]
    [162 :block/path-refs 108 536871044 true]
    [162 :block/path-refs 149 536871044 true]
    [162 :block/path-refs 160 536871044 true]
    [162
    :block/properties
    {#uuid "21be4275-bba9-48b8-9351-c9ca27883159"
      #uuid "6581b09e-8b9c-4dca-a938-c900aedc8275"}
    536871043
    true]
    [162 :block/refs 108 536871043 true]
    [162 :block/refs 160 536871043 true]
    [162 :block/tx-id 536871043 536871044 true]
    [162 :block/updated-at 1703004380918 536871039 true]
    [162
    :block/uuid
    #uuid "6581c8db-a2a2-4e09-b30d-cdea6ad69512"
    536871037
    true]]]
  ```

### Dev Commands

In the app, you can enable Dev commands under `Settings > Advanced > Developer
mode`. Then search for commands starting with `(Dev)`. Commands include
inspectors for block/page data and AST.

### Desktop Developer Tools

Since the desktop app is built with Electron, a full set of Chromium developer
tools is available under the menu `View > Toggle Developer Tools`. Handy tools
include a JS console and HTML inspector.

## Security Practices

* Our builds should not include unverified, third-party resources as this opens
  up the app to possibly harmful injections. If a third-party resource is
  included, it should be verified against an official distributor. Use
  https://github.com/logseq/logseq/pull/9712 as an example to include a third
  party resource and not the examples under resources/js/.

## FAQ

If dev app launch failed after electron upgrade:
```sh
yarn
yarn watch
```
In another window:
```sh
cd static
yarn
cd ..
yarn dev-electron-app
```
and kill all electron process
Then a normal start happens via `yarn dev-electron-app`
