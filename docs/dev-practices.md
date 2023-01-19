# Logseq Dev Practices

## description

This page describes development practices for this codebase.

## Linting

Most of our linters require babashka. Before running them,
please install babashka. To invoke all the linters in
this section, run

```sh
bb dev:lint
```

### Clojure code

To lint:

```sh
clojure -M:clj-kondo --parallel --lint src --cache false
```

We lint our Clojure(Script) code with
[clj-kondo](https://github.com/clj-kondo/clj-kondo).
If you need to configure specific linters, see
[clj-kondo linters documentation](https://github.com/clj-kondo/clj-kondo/blob/master/doc/linters.md).
Where possible, a global linting configuration is used and namespace specific
configuration is avoided.

There are outstanding linting items that are currently ignored to allow linting
the rest of the codebase in CI.

These outstanding linting items should be addressed at some point:

* Comments starting with `TODO:lint`
* Code marked with `#_:clj-kondo/ignore` require a good understanding of the
  context to address as they usually involve something with a side effect or
  require changing multiple fns up the call stack.

### Unused vars

We use [borkdude/carve](https://github.com/borkdude/carve) to detect unused vars
in our codebase.

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

Documentation helps teams share their knowledge and enables more individuals to
contribute to the codebase. Documenting our namespaces is a good first step to
improving our documentation. To run this linter:

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

### Invalid translations

Our translations can be configured incorrectly. We can catch some of these
mistakes [as noted here](./contributing-to-translations.md#fix-mistakes).

## Testing

We have unit, performance and end to end tests.

### End to End Tests

Even though we have a nightly release channel, it's hard for testing users
(thanks to the brave users!) to notice all issues in a limited time, as Logseq
is covering so many features.
The only solution is automatic end-to-end tests - adding tests for GUI software
is always painful but necessary.
See [pull requests tagged with `E2E`](https://github.com/logseq/logseq/pulls?q=E2E)
 for E2E test examples.

To run end to end tests

```sh
yarn electron-watch
# in another shell
yarn e2e-test # or npx playwright test
```

If e2e failed after first running:

* `rm -rdf ~/.logseq`
* `rm -rdf ~/.config/Logseq`
* `rm -rdf <repo dir>/tmp/`
* Windows: `rmdir /s %APPDATA%/Electron`  ([Reference: Electron API docs](https://www.electronjs.org/de/docs/latest/api/app#appgetpathname))

There's a `traceAll()` helper function to enable playwright trace file dump for specific test files (https://github.com/logseq/logseq/pull/8332)

If E2E tests fail in the file, they can be debugged by examining a trace dump
with [the playwright trace viewer](https://playwright.dev/docs/trace-viewer#recording-a-trace).

Locally this will get dumped into e2e-dump/.

On CI the trace file will be under Artifacts at the bottom of a run page e.g.
https://github.com/logseq/logseq/actions/runs/3574600322.

### Unit Testing

Our unit tests use the [shadow-cljs test-runner](https://shadow-cljs.github.io/docs/UsersGuide.html#_testing). To run them:

```sh
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

     * Add `^:focus` metadata flags to tests e.g. `(deftest ^:focus test-name ...)`.
     * In another shell, run `node static/tests.js -i focus` to only run those
        tests. To run all tests except those tests run `node static/tests.js -e focus`.
     * Or focus namespaces: Using the regex option `-r`, run tests for `frontend.util.page-property-test` with `node static/tests.js -r page-property`.

Multiple options can be specified to AND selections. For example,
to run all `frontend.util.page-property-test` tests except for the focused one:
 `node static/tests.js -r page-property -e focus`

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

#### Performance tests

To write a performance test:

* Use `frontend.util/with-time-number` to get the time in ms.

* Example:

  ```clojure
  (are [x timeout] (>= timeout (:time (util/with-time-number (block/normalize-block x true))))
      ... )
  ```

For examples of these tests, see `frontend.db.query-dsl-test` and `frontend.db.model-test`.

### Async Unit Testing

Async unit testing is well supported in ClojureScript.
[clojurescript.org/tools/testing#async-testing](https://clojurescript.org/tools/testing#async-testing) is a good guide for how to
do this. We have a couple of test helpers that make testing async easier:

* `frontend.test.helper/deftest-async` - `deftest` for async tests that ensures
  uncaught exceptions don't abruptly end the test suite. If you don't use this
  macro for async tests, you are expected to handle unexpected failures in your test
* `frontend.test.helper/with-reset` - A version of `with-redefs` that works for
  async contexts

## Accessibility

Please refer to our [accessibility guidelines](accessibility.md).

## Logging

For logging, we use [lambdaisland/glogi](https://github.com/lambdaisland/glogi). When in development,
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
To re-generate the clj-kondo type annotations for malli typed fns, update
`gen-malli-kondo-config.core` and then run `bb dev:gen-malli-kondo-config`. To
learn more about fn instrumentation, see [this
page](https://github.com/metosin/malli/blob/master/docs/clojurescript-function-instrumentation.md).

## Auto-formatting

Currently the codebase is not formatted/indented consistently. We loosely follow
[clojure style guide](https://github.com/bbatsov/clojure-style-guide).
[cljfmt](https://cljdoc.org/d/cljfmt/) is a common formatter used for Clojure,
analogous to Prettier for other languages. You can do so easily with the
[Calva](https://marketplace.visualstudio.com/items?itemName=betterthantomorrow.calva)
extension in [VSCode](https://code.visualstudio.com/): It will (mostly) indent
your code correctly as you type, and you can move your cursor to the start of
the line(s) you've written and press `Tab` to auto-indent all Clojure forms
nested under the one starting on the current line.

## Development Tools

There are some babashka tasks under `nbb:` which are useful for inspecting
database changes in realtime. See [these
docs](https://github.com/logseq/bb-tasks#logseqbb-tasksnbbwatch) for more info.

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
