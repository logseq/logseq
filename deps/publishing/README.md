## Description

This library handles exporting the `frontend.publishing` single page
application. This library is compatible with ClojureScript and with
node/[nbb-logseq](https://github.com/logseq/nbb-logseq) to respectively provide
frontend and Electron/commandline functionality.

## API

This library is under the parent namespace `logseq.publishing`. This library
provides two namespaces for node/CLI contexts, `logseq.publishing` and
`logseq.publishing.export` and two namespaces for the frontend,
`logseq.publishing.html` and `logseq.publishing.db`.

## Usage

See `logseq.tasks.dev.publishing` for a CLI example. See the frontend for cljs usage.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/publishing.yml) for linting examples.

### Setup

To run linters and tests, you'll want to install yarn dependencies once:
```
yarn install
```

This step is not needed if you're just running the frontend application.

### Testing

Testing is done with nbb-logseq and
[nbb-test-runner](https://github.com/nextjournal/nbb-test-runner). Some basic
usage:

```
# Run all tests
$ yarn test
# List available options
$ yarn test -H
# Run tests with :focus metadata flag
$ yarn test -i focus
```

### Managing dependencies

See [standard nbb/cljs library advice in graph-parser](/deps/graph-parser/README.md#managing-dependencies).
