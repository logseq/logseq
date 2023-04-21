## Description

This library provides common util namespaces to share between the frontend and
other non-frontend namespaces. This library is not supposed to depend on other logseq
libraries.

## API

This library is under the parent namespace `logseq.common`.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/logseq-common.yml) for linting examples.

### Testing

To run ClojureScript tests:
```
clojure -M:test
```

To auto-run tests while writing tests:

```
clojure -M:test -w src
```
