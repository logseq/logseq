## Description

This page describes development practices for this codebase.

## Linting

We lint our Clojure(Script) code with https://github.com/clj-kondo/clj-kondo/. If you need to configure specific linters, see [this documentation](https://github.com/clj-kondo/clj-kondo/blob/master/doc/linters.md). Where possible, a global linting configuration is used and namespace specific configuration is avoided.

Linting is a work in progress as this is a large Clojure codebase with some areas to refactor. There are outstanding linting items that are currently ignored in order to allow full linting of the codebase to run in CI. These outstanding linting items should be addressed at some point:

* Comments starting with `TODO:lint`
* Code marked with `#_:clj-kondo/ignore` require a good understanding of the context to address as they usually involve something with a side effect or require changing multiple fns up the call stack.
