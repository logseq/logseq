# perf: LUI web UI vs Out web app

Benchmark of the LUI Logseq web UI (`deps/ui`, served from `static/` via
`cd clj-e2e && bb serve --port 3013`) against the `Out` web app
(logseq/Out, `dune build @web`, served at `http://localhost:8777/app/web/index.html`)
on daily outliner ops. Script: `perf-vs-out.mjs` (Playwright, headless
Chromium, 5 runs per op, median). Same machine, same fixture: `BenchSmall`
~50 blocks containing `[[BenchBig]]`, `BenchBig` ~200 blocks incl. a
collapsible staircase parent.

## Results (median ms)

| Metric | Out | LUI | Verdict |
|---|---:|---:|---|
| Cold load → first block | 173 | 1040 | LUI 6.0× slower |
| Page nav `[[link]]` → rows mounted | 138 | 566 | LUI 4.1× slower |
| Typing keydown → DOM update | 30 | 12 | LUI faster |
| Enter → new block editable | 60 | 74 | ~par (was 146) |
| Indent (Tab) | 29 | 1 | LUI faster |
| Outdent (Shift-Tab) | 46 | 55 | ~par (was 79) |
| Collapse (chevron) | 63 | 2 | LUI faster |
| Palette open (Cmd-K) | 64 | 20 | LUI faster |
| Palette query → first results | 71 | 18 | LUI faster |
| Scroll 200-block page | 716 | 578 | LUI faster |
| Scroll long tasks | 0 | 0 | par |

## Root causes found and fixed

### 1. N+1 worker roundtrip for property render data (`properties_data.ml`)

Every mounted `.ls-block` properties area issued its own
`get-blocks {:render-data? true}` worker call. On a 200-block page that is
~203 serial postMessage roundtrips on every nav *and* on every
`refresh_all` after each tx broadcast (measured: 203 calls per nav).

Fix: `block_render_data` now coalesces callers in the same task into ONE
`get-blocks` request (`setTimeout 0` flush), distributing results by uuid.
Measured: 203 → 1 calls per page mount / refresh storm.

### 2. O(n²) touched-element dedup (`editor_dom.ml`)

`for_each_touched` deduplicated descendant `.ls-block` elements with an
identity scan over a growing OCaml list — ~260ms CPU measured on a
200-block nav flush. Replaced with a JS `Set` for O(1) membership.

### 3. Full-page re-render on every op (`page.ml`, `chrome.ml`, `tree.ml`)

Every delta splice republished the whole page and the route dyn rebuilt
~6000 DOM nodes — ~195ms flush on Enter/outdent, and every row's model
subscription re-rendered on each publish.

Fix: `Page.region` keeps the route-page element mounted across data
publishes. The top-level block list is now a `Logseq_dom.keyed`
collection keyed on block uuid — `Signal.keyed` republishes only items
whose record changed, and `block_row_sig` keeps a stable `.ls-block`
shell (class/attr signals fed by `Signal.map2` over the item signal +
editor state) with `row_main`/`row_children` dyn segments inside. A
one-block splice patches one row (~17ms flush, was ~195ms).

### 4. Eager per-row property area setup (`properties_area.ml`, `tree.ml`)

Each row emitted a permanent `.ls-block-content-indent` div and
`mount_block_area` ran its DOM queries per row at mount (~200ms tail on
nav). The indent div is gone from the tree; the area now resolves
column/indent/left-host lazily on the first refresh that finds content
and creates the indent on demand as a direct `.ls-block` child.

### 5. Enter refocus gated on the property-refresh wave (`outliner_ops.ml`)

`refresh_via_delta` awaited `refresh_property_areas` — a full-area
`get-blocks`/`pull`/`get-bidirectional-properties` refetch (~160-270ms)
— before `with_focus_after` could focus the new block's editor, so the
textarea only became active after the entire wave. Now fire-and-forget:
the refresh still runs, it just doesn't serialize the caller.

### 6. Duplicate `collapsed_sig` subscriptions per row (`tree.ml`)

`control_wrap` built a fresh `collapsed_sig` (a `Signal.map` on the
global editor state) for each of three class signals — hoisted to one
shared derived signal per row.

## Remaining gaps (not fixed here — architectural)

- **Nav (~566ms)**: ~95ms serial worker pipeline (route-info → page tree →
  tags) then a ~330ms LUI mount flush for the first render of ~200 rows
  (keyed can't help an initial mount). CPU profile shows diffuse runtime
  cost — `unsafe_blits`, Map/Hashtbl ops, `List.sort`, GC — no single
  fixable hotspot, and ~30 DOM elements per row vs Out's ~7 (6091 vs 1480
  total). In the real app `Virt_list` (≥64 rows) mounts only the visible
  window; `rtc-test` disables virtualization, so the bench measures the
  full-mount path.
- **Cold load (~1040ms)**: 7.9MB dev bundle eval (~200ms incl. DCL), worker
  boot (5.7MB worker bundle eval), sqlite/OPFS init + graph open, then the
  first page mount. Serial boot chain: init → set-context →
  set-db-sync-config → sync-app-state → set-context (rtc-test) → list-db →
  create-or-open-db → journal check → route. Out has no worker and a small
  bundle.

## Reproduce

```
cd clj-e2e && bb serve --port 3013      # LUI at http://localhost:3013/index.html?rtc-test=true
cd <out-repo> && python3 -m http.server 8777
node deps/ui/docs/perf-vs-out.mjs       # BENCH_COLD=0 to skip cold-load runs
```

Fixture notes: both apps were seeded with identical pages (`BenchSmall` ~
50 blocks with a `go to [[BenchBig]] now` link; `BenchBig` ~200 blocks,
one parent with a staircase of children for collapse, `bench-x` and
`indent-me` helper blocks). LUI uses `?rtc-test=true` against a seeded
`logseq_db_Demo` graph; Out uses its Ds.storage-backed demo graph.
