# Melange Common and DB

This project owns the OCaml/Melange implementations of Logseq Common and DB behavior, the ClojureScript bridge that adapts application values, and the private `@logseq/melange-js-api` package consumed by the main application.

## Layout

- `lib/` contains the OCaml implementations and public JavaScript API entry points.
- `spec/` contains typed interfaces for opaque JavaScript handles and primitive runtime capabilities.
- `bridge/` contains value conversion, primitive platform adapters, and one-hop ClojureScript delegation.
- `test/` contains OCaml behavior tests, JavaScript package contracts, and repository architecture guards.
- `scripts/` contains the checked-source generators and the JS API build entry point.
- `js_api/` is the private workspace package. Its `dist/` directory is generated and ignored.

## Setup and verification

Install the local OPAM dependencies before the first build:

```sh
opam install . --deps-only
```

Build and test the complete project:

```sh
opam exec -- dune build @runtest @bundle
```

Build the JavaScript artifacts consumed by ClojureScript:

```sh
pnpm melange:build-js-api
```

All root `cljs:*` compilation scripts run that build first, so a clean checkout does not depend on stale artifacts. Dune promotes the Common and DB bundles into the ignored `js_api/dist/` directory; Browser, Node, and graph-fs entries load their generated Melange modules directly.

Lint the Melange-owned Datalog rules:

```sh
cd deps/melange
bb lint:rules
```

The Dune test alias also runs the source-boundary and repository-contract guards. The repository contract regenerates and formats `lib/db/property_catalog.ml` and `lib/db/rules_data.ml` in memory, then rejects any drift from their EDN oracles and generators.

## License

This subproject is part of Logseq and is governed by the repository's [GNU Affero General Public License v3](../../LICENSE.md).
