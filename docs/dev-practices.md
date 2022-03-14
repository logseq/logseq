## Description

This page describes development practices for this codebase.

## Linting

Most of our linters require babashka. Before running them, please install
https://github.com/babashka/babashka#installation.

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
scripts/carve.clj
```

By default, the script runs in CI mode which prints unused vars if they are
found. The script can be run in an interactive mode which prompts for keeping
(ignoring) an unused var or removing it. Run this mode with:

```
scripts/carve.clj '{:interactive true}'
```

When a var is ignored, it is added to `.carve/ignore`. Please add a comment for
why a var is ignored to help others understand why it's unused.

### Large vars

Large vars have a lot of complexity and make it hard for the team to maintain
and understand them. To run this linter:
```
scripts/large_vars.clj
```

To configure the linter, see its `config` var.

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
3. Or focus namespaces: Using the regex option `-r`, run tests for `frontend.text-test` with `node static/tests.js -r text`.

For help on more options, run `node static/tests.js -h`.

#### Autorun Tests

To run tests automatically on file save, run `yarn
shadow-cljs watch test --config-merge '{:autorun true}'`. The test output may
appear where shadow-cljs was first invoked e.g. where `yarn watch` is running.
Specific namespace(s) can be auto run with the `:ns-regexp` option e.g. `npx
shadow-cljs watch test --config-merge '{:autorun true :ns-regexp
"frontend.text-test"}'`.

## Logging

For logging, we use https://github.com/lambdaisland/glogi. When in development,
be sure to have [enabled custom
formatters](https://github.com/binaryage/cljs-devtools/blob/master/docs/installation.md#enable-custom-formatters-in-chrome)
in the desktop app and browser. Without this enabled, most of the log messages
aren't readable.
