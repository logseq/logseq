## Description

This page describes development practices for this codebase.

## Linting

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
Before running it, please install https://github.com/babashka/babashka.

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

## Testing

We have unit and end to end tests as described in https://github.com/logseq/logseq#5-run-tests.

### Unit Testing

When writing unit tests it is helpful to have tests automatically run on file
save with `yarn shadow-cljs watch test --config-merge '{:autorun true}'`. The
test output may appear where shadow-cljs was first invoked e.g. where `yarn
watch` is running. For more about the shadow-cljs test runner, see [this
documentation](https://shadow-cljs.github.io/docs/UsersGuide.html#_testing).
