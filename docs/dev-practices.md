## Description

This page describes development practices for this codebase.

## Linting

To lint:
```
clojure -M:clj-kondo --lint src
```

We lint our Clojure(Script) code with https://github.com/clj-kondo/clj-kondo/. If you need to configure specific linters, see [this documentation](https://github.com/clj-kondo/clj-kondo/blob/master/doc/linters.md). Where possible, a global linting configuration is used and namespace specific configuration is avoided.

There are outstanding linting items that are currently ignored to allow linting the rest of the codebase in CI. These outstanding linting items should be addressed at some point:

* Comments starting with `TODO:lint`
* Code marked with `#_:clj-kondo/ignore` require a good understanding of the context to address as they usually involve something with a side effect or require changing multiple fns up the call stack.

## Testing

We have unit and end to end tests as described in https://github.com/logseq/logseq#5-run-tests.

### Unit Testing

When writing unit tests it is helpful to have tests automatically run on file
save with `yarn shadow-cljs watch test --config-merge '{:autorun true}'`. The
test output may appear where shadow-cljs was first invoked e.g. where `yarn
watch` is running. For more about the shadow-cljs test runner, see [this
documentation](https://shadow-cljs.github.io/docs/UsersGuide.html#_testing).
