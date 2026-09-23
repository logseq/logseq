---
name: logseq-cli-testing
description: Test the Logseq CLI end-to-end on this box — build it, run it against a mock db-worker-node HTTP server (when a real worker can't be built), and verify outliner ops via captured request bodies.
---

# Testing the Logseq CLI

## Build

- Fast build for CLI-only work: `cd cli && opam exec --switch 5.5.0 -- dune build`
  produces a runnable bundle at `cli/_build/default/dist/logseq-cli.js`
  (run via `node _build/default/dist/logseq-cli.js --help`).
- `dune build @bundle` (a.k.a. `pnpm --dir cli bundle`) additionally runs vite and
  promotes to `cli/dist/logseq-cli.js`; `pnpm cli:release` stages `static/logseq-cli.js`.
- Unit tests: `opam exec --switch 5.5.0 -- dune runtest` inside `cli/`.

## When a real db-worker-node is infeasible

A real worker needs `pnpm db-worker-node:release:bundle` (shadow-cljs release →
`dist/db-worker-node.js`). On boxes without the clojure CLI and without
`pnpm install` at repo root, that build cannot run — there is also no `bb`, so
`cli-e2e` (`bb -f cli-e2e/bb.edn test`) cannot run either. Use a mock HTTP server
instead, mirroring `cli/test/test_support.ml` (`invoke_server`):

- CLI env: `LOGSEQ_CLI_BASE_URL=http://127.0.0.1:<port>` plus `--graph <name>`
  (still required — the repo name is just a string in each request).
- Contract: `POST /v1/invoke` with body
  `{"method":"thread-api/<m>","argsTransit":"<transit>"}` → reply
  `{"resultTransit":"<transit-json>"}`. Any other path → 404.
- With `LOGSEQ_CLI_BASE_URL` set, `ensure_server` never spawns a worker and no
  graph dirs / `--root-dir` are touched.

## Transit response shapes (verify against test_support.ml fixtures)

- transit map literal: `["^ ", "~:key", value, ...]` (`"^ "` is the cmap marker;
  `"~u<uuid>"` for uuids, `"~:kw"` for keywords).
- `q` (page/property lookups): **vector of maps** — `[["^ ", ...]]`.
- `pull` (ident/id/uuid lookups): **bare map** — `["^ ", "~:db/id", N, ...]`.
- `cli-list-tags`/`cli-list-pages`: vector of maps.
- `apply-outliner-ops`: `"[]"` is fine.
- Created-id verification pulls each `[:block/uuid ...]` — reply a bare map with a
  fresh `db/id` so `{:result [ids]}` comes back.

> Shape sensitivity: some consumers apply `first_entity` (expects vector/list)
> to pull results, others call `id_of_entity`/`uuid_of_entity` directly on the
> map. If a lookup mysteriously fails with `property-not-found`/`tag not found`,
> check whether that code path can handle the shape you returned.

## Verification approach

- Log every request `{method, argsTransit}` to a JSONL file; the ops the CLI
  sends ARE the test surface (worker-side `apply-outliner-ops` is unchanged
  upstream code). Assert on op structure (`insert-blocks`, `batch-set-property`,
  `block/parent` `[:block/uuid ...]` lookup-refs, `block/level`) and on the
  absence of `apply-outliner-ops` for `--dry-run`/error paths.
- Request order for `upsert block --target-page X --blocks <md>` (create):
  property ident/q lookups → page `q` → `cli-list-tags` (for `#tags`) →
  `apply-outliner-ops` → per-uuid `pull`s for created ids.
- Match mock responses on `argsTransit` substrings (page/property names) rather
  than request order — ordering varies with options.

## Parser detail

`is_option` requires `-`/`--` followed by an ASCII letter, so `--blocks '- ...'`
and `--content '- dash'` are values, not flags. When testing markdown outlines,
pass them as one quoted arg (`$'- Parent\n  - Child'`).
