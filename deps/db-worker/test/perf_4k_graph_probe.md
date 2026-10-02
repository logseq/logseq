# db-worker perf probe — 4k movies graph

`perf_4k_graph_probe.cjs` measures the app-shaped calls the frontend issues
to the db-worker over the node daemon's `/v1/invoke` HTTP surface, on the
real `4k movies` graph from
[logseq/db-benchmark-graphs](https://github.com/logseq/db-benchmark-graphs).

It is a **regression probe, not a wall-clock gate**: timings are reported
per call (median/min/max across `--iters`), and the probe exits non-zero
only on endpoint errors, malformed responses, or blocks left behind after
cleanup. Wall-clock assertions flake in CI, so nothing here gates on them.

## Running

From `deps/db-worker`:

```sh
# spawn a fresh daemon (measures cold start: spawn -> migrations+heal+open)
node test/perf_4k_graph_probe.cjs --root-dir ~/bench-graphs

# attach to an already-running daemon (skips the spawn measurement)
node test/perf_4k_graph_probe.cjs --attach 45987 --iters 5
```

The graph file is expected at `<graphs-dir>/<repo>/db.sqlite` (default
`~/bench-graphs/graphs/"4k movies"/db.sqlite`). When missing it is
downloaded once from Git LFS (~190MB); the first daemon open then performs
the one-time sqlite migration (~40-60s), so the first cold-start number
includes migration while later runs do not. `--no-download` disables this.

Options: `--repo`, `--root-dir`, `--graphs-dir`, `--worker-bundle`
(default `dist/db-worker-node.js` — build it with
`pnpm db-worker-node:compile:bundle`), `--iters N`, `--attach <port>`,
`--keep-daemon`, `--json <file>`, `--spawn-timeout-ms`.

## What it measures

| scenario | calls |
|---|---|
| cold-start | `daemon-ready` (spawn -> `/healthz` ready, i.e. migrations + heal + `ensure_builtin` + graph open), `close-db`, `create-or-open-db` |
| journals | `journals-window` (`get-view-data {:journals? true}`), `journal-children` + `journal-children-render` (`get-render-snapshots` children/blocks on the latest journal) |
| table-views | `all-pages.window0` and `all-pages.offset20000` (`get-view-data` on the builtin all-pages view), `tag-view.window0` and a deep-offset window (`view-feature-type :class-objects`, `view-for-id` = largest non-Page tag) |
| list-views | `get-view-data` on a list-mode all-pages view and a list-mode linked-references view (`logseq.property.view/type` = list, created via `apply-outliner-ops` the same way `create-view!` does), plus `get-render-snapshots` blocks=25/200 and children=25 for the returned rows |
| page-tree | `get-render-snapshots` children on the page with the most children, children expansion of each child, and block snapshots for the children |
| outliner-ops | `op.enter` (`insert-blocks` sibling of the journal's last child, with `editor-row-uuids` like the FE sends), `op.indent`/`op.outdent` (`indent-outdent-blocks`), `op.paste10` (`insert-blocks` with `:paste` + `:block/level` tree), `op.delete` (`delete-blocks`) — each timed end-to-end |

Fixture discovery is dynamic (biggest tag, latest journal day, builtin
all-pages view entity, page with most children, `$$$views` page,
`block/page` + `logseq.property.view/type.list` entities) — nothing about
the 4k-movies graph is hardcoded beyond its name and download URL. Any
other graph works via `--repo`/`--graphs-dir` (auto-download is
4k-movies-only).

Blocks the probe creates (bench views, inserted/pasted journal blocks) are
deleted at the end and the cleanup step asserts none remain.

## Output

A markdown table: `scenario | call | n | median ms | min ms | max ms`,
suitable for pasting into PRs and comparing across commits. `--json`
writes the same rows as JSON for tooling. `FAIL` lines plus a non-zero
exit mark broken endpoints or leftover state — never slow timings.
