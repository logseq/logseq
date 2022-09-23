## Description

This page describes development practices for this codebase.

## Linting

Most of our linters require babashka. Before running them, please install
https://github.com/babashka/babashka#installation. To invoke all the linters in
this section, run `bb dev:lint`.

### Clojure code

To lint:
```
clojure -M:clj-kondo --lint src
```

We lint our Clojure(Script) code with https://github.com/clj-kondo/clj-kondo/. If you need to configure specific linters, see [this documentation](https://github.com/clj-kondo/clj-kondo/blob/master/doc/linters.md). Where possible, a global linting configuration is used and namespace specific configuration is avoided.

There are outstanding linting items that are currently ignored to allow linting the rest of the codebase in CI. These outstanding linting items should be addressed at some point:

* Comments starting with `TODO:lint`
* Code marked with `#_:clj-kondo/ignore` require a good understanding of the context to address as they usually involve something with a side effect or require changing multiple fns up the call stack.

### Unused vars

We use https://github.com/borkdude/carve to detect unused vars in our codebase.

To run this linter:
```
bb lint:carve
```

By default, the script runs in CI mode which prints unused vars if they are
found. The script can be run in an interactive mode which prompts for keeping
(ignoring) an unused var or removing it. Run this mode with:

```
bb lint:carve '{:interactive true}'
```

When a var is ignored, it is added to `.carve/ignore`. Please add a comment for
why a var is ignored to help others understand why it's unused.

### Large vars

Large vars have a lot of complexity and make it hard for the team to maintain
and understand them. To run this linter:
```
bb lint:large-vars
```

To configure the linter, see the `[:tasks/config :large-vars]` path of bb.edn.

### Document namespaces

Documentation helps teams share their knowledge and enables more individuals to contribute to the codebase. Documenting our namespaces is a good first step to improving our documentation. To run this linter:
```
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

### Invalid translations

Our translations can be configured incorrectly. We can catch some of these
mistakes [as noted here](./contributing-to-translations.md#fix-mistakes).

## Testing

We have unit and end to end tests.

### End to End Tests

To run end to end tests

``` bash
yarn electron-watch
# in another shell
yarn e2e-test # or npx playwright test
```

### Unit Testing

Our unit tests use the [shadow-cljs test-runner](https://shadow-cljs.github.io/docs/UsersGuide.html#_testing). To run them:

```bash
yarn test
```

By convention, a namespace's tests are found at a corresponding namespace
of the same name with an added `-test` suffix. For example, tests
for `frontend.db.model` are found in `frontend.db.model-test`.

There are a couple different ways to develop with tests:

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
3. Or focus namespaces: Using the regex option `-r`, run tests for `frontend.util.page-property-test` with `node static/tests.js -r page-property`.

Multiple options can be specified to AND selections. For example, to run all `frontend.util.page-property-test` tests except for the focused one: `node static/tests.js -r page-property -e focus`

For help on more options, run `node static/tests.js -h`.

#### Autorun Tests

To run tests automatically on file save, run `clojure -M:test watch test
--config-merge '{:autorun true}'`. Specific namespace(s) can be auto run with
the `:ns-regexp` option e.g. `clojure -M:test watch test --config-merge
'{:autorun true :ns-regexp "frontend.util.page-property-test"}'`.

#### Database tests

To write a test that uses a datascript db:

* Be sure your test ns has test fixtures from `test-helper` ns to create and
  destroy test databases after each test.
* The easiest way to set up test data is to use `test-helper/load-test-files`.
* For the repo argument that most fns take, pass it `test-helper/test-db`

For examples of these tests, see `frontend.db.query-dsl-test` and `frontend.db.model-test`.

## Accessibility

Please refer to our [accessibility guidelines](accessibility.md).

## Logging

For logging, we use https://github.com/lambdaisland/glogi. When in development,
be sure to have [enabled custom
formatters](https://github.com/binaryage/cljs-devtools/blob/master/docs/installation.md#enable-custom-formatters-in-chrome)
in the desktop app and browser. Without this enabled, most of the log messages
aren't readable.

## Data validation and generation

We currently use [spec](https://github.com/clojure/spec.alpha) for data
validation (and generation someday). We may switch to
[malli](https://github.com/metosin/malli) if we need to datafy our data models
at some point.

Specs should go under `src/main/frontend/spec/` and be compatible with clojure
and clojurescript. See `frontend.spec.storage` for an example. By following
these conventions, specs should also be usable by babashka. This is helpful as it
allows for third party tools to be written with logseq's data model.

## Development Tools

There are some babashka tasks under `nbb:` which are useful for inspecting
database changes in realtime. See [these
docs](https://github.com/logseq/bb-tasks#logseqbb-tasksnbbwatch) for more info.
