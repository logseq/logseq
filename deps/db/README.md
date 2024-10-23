## Description

This library provides an API to the
frontend([datascript](https://github.com/tonsky/datascript)) and
backend([SQLite](https://www.sqlite.org/index.html)) databases from the Logseq
app and the CLI. The majority of this library is focused on supporting DB graphs
but there are a few older namespaces that support file graphs. This library is
compatible with ClojureScript and with
[nbb-logseq](https://github.com/logseq/nbb-logseq) to respectively provide
frontend and commandline functionality.

## API

This library is under the parent namespace `logseq.db`. While `logseq.db` is the
main entry point, this library also provides frontend namespaces under
`logseq.db.frontend` and backend/sqlite namespaces under `logseq.db.sqlite`.

## Usage

See the frontend for example usage.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/db.yml) for linting examples.

### Setup

To run linters and tests, you'll want to install yarn dependencies once:
```
yarn install
```

This step is not needed if you're just running the application.

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
### Datalog linting

Datalog rules for the client are linted through a script that also uses the datalog-parser. To run this linter:
```
bb lint:rules
```

### Managing dependencies

The package.json dependencies are just for testing and should be updated if there is
new behavior to test.

The deps.edn dependencies are used by both ClojureScript and nbb-logseq. Their
versions should be backwards compatible with each other with priority given to
the frontend. _No new dependency_ should be introduced to this library without
an understanding of the tradeoffs of adding this to nbb-logseq.
