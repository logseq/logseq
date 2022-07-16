## Description

This library parses a logseq graph directory and returns it as a datascript
database connection. This library powers the Logseq app and also runs from the
commandline, _independent_ of the app. This is powerful as this can run anywhere
that a Node.js script has access to a Logseq graph e.g. on CI processes like
Github Actions. This library is compatible with ClojureScript and with
[nbb-logseq](https://github.com/logseq/nbb-logseq) to respectively provide
frontend and commandline functionality.

## API

This library is under the parent namespace `logseq.graph-parser`. This library
provides two main namespaces for parsing, `logseq.graph-parser` and
`logseq.graph-parser.cli`. `logseq.graph-parser/parse-file` is the main fn for
the frontend. `logseq.graph-parser.cli/parse-graph` is the main fn for node.js
CLIs.

## Usage

See `logseq.graph-parser.cli-test` for now. A real world example is coming soon.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/graph-parser.yml) for linting examples.

### Setup

To run linters and tests, you'll want to install yarn dependencies once:
```
yarn install
```

This step is not needed if you're just running the application.

### Testing

Since this file is compatible with cljs and nbb-logseq, tests are run against both languages.

ClojureScript tests use https://github.com/Olical/cljs-test-runner. To run tests:
```
clojure -M:test
```

To see available options that can run specific tests or namespaces: `clojure -M:test --help`

To run nbb-logseq tests:
```
yarn test
```

### Managing dependencies

The package.json dependencies are just for testing and should be updated if there is
new behavior to test.

The deps.edn dependecies are used by both ClojureScript and nbb-logseq. Their
versions should be backwards compatible with each other with priority given to
the frontend. _No new dependency_ should be introduced to this library without
an understanding of the tradeoffs of adding this to nbb-logseq.
