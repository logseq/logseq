## Description

This library provides a minimal API for using a
[datascript](https://github.com/tonsky/datascript) database from the Logseq app
and the CLI. This library is compatible with ClojureScript and with
[nbb-logseq](https://github.com/logseq/nbb-logseq) to respectively provide
frontend and commandline functionality.

## API

This library is under the parent namespace `logseq.db`. This library provides
two main namespaces, `logseq.db` and `logseq.db.rules`.

## Usage

See the frontend for example usage.

## Dev

This follows the practices that [the Logseq frontend
follows](/docs/dev-practices.md). Most of the same linters are used, with
configurations that are specific to this library. See [this library's CI
file](/.github/workflows/db.yml) for linting examples.

### Setup

To run linters, you'll want to install yarn dependencies once:
```
yarn install
```

This step is not needed if you're just running the application.

## Linting

### Datalog linting

Our rules are linted through a script that also uses the datalog-parser. To run this linter:
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
