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
| Cold load → first block | 170 | 1035 | LUI 6.1× slower |
| Page nav `[[link]]` → rows mounted | 155 | 715 | LUI 4.6× slower |
| Typing keydown → DOM update | 20 | 5 | LUI faster |
| Enter → new block editable | 49 | 146 | LUI 3.0× slower |
| Indent (Tab) | 27 | 1 | LUI faster |
| Outdent (Shift-Tab) | 27 | 79 | LUI 2.9× slower |
| Collapse (chevron) | 33 | 2 | LUI faster |
| Palette open (Cmd-K) | 49 | 32 | LUI faster |
| Palette query → first results | 57 | 26 | LUI faster |
| Scroll 200-block page | 713 | 579 | LUI faster |
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

## Remaining gaps (not fixed here — architectural)

- **Nav (~715ms)**: ~105ms serial worker pipeline (route-info → page tree →
  tags) then a single ~340ms LUI mount flush. CPU profile shows diffuse
  runtime cost — `_2` currying dispatch ~97ms, string building
  (`unsafe_blits`/`caml_create_bytes`/`bytes_to_string`) ~120ms, Map/Hashtbl
  ops ~100ms, `List.sort` ~70ms, GC ~65ms, native DOM ~140ms — no single
  fixable hotspot. LUI emits ~30 DOM elements per row vs Out's ~7
  (6091 vs 1480 elements for ~200 rows): bullet, chevron, content wrapper,
  indent container, properties host per block. Cheaper mounts would need
  lighter row DOM — a tree/view-level change, not a point fix.
- **Cold load (~1035ms)**: 7.9MB dev bundle eval (~200ms incl. DCL), worker
  boot (5.7MB worker bundle eval), sqlite/OPFS init + graph open, then the
  first page mount. Serial boot chain: init → set-context →
  set-db-sync-config → sync-app-state → set-context (rtc-test) → list-db →
  create-or-open-db → journal check → route. Out has no worker and a small
  bundle.
- **Enter (~146ms)**: ~35ms `apply-outliner-ops` roundtrip + ~55ms delta
  splice flush + ~30-50ms editor (CodeMirror) mount for the new block.
- **Outdent (~79ms)**: same op+splice+editor path as Enter; LUI's Indent is
  ~1ms because it is a pure DOM reparenting, while Outdent re-renders the
  parent subtree.

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
