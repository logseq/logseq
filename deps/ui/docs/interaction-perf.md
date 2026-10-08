# Interaction latency — end-to-end profiling + fixes

Status: measurement report + fixes landed on `devin/interaction-perf`,
2026-10-07. Scope is everything *outside* the keystroke path (see
`docs/editor-perf.md` for the keystroke work): signal fan-out per op,
patch-emit volume, DOM apply cost, worker roundtrips, and per-event
O(tree) work.

## Method

Instrumentation lives in `src/core/interaction_perf.ml` + wrappers in
`js_app/main.ml`. Every interaction path (`dispatch_event`, `Runtime.send`,
`Runtime.flush`) records a `window.__uiPerf` sample with per-stage ms:

- `dispatch` — `Lui_app.dispatch_event` / `Lui_app.send` reducer+publish
- `flush` — `Lui_app.flush`: signal stabilize + view emit + keyed diff +
  wire encode (`sigRounds`/`sigEffects`/`ops` from `Lui_runtime.diagnostics`
  accumulated per op)
- `apply` — `backend.apply_batch`: `Store.apply_batch_with_extensions` +
  `apply_dom_batch`
- `virt` — `Logseq_virt.sync()`
- `focus` — `Editor_actions.focus_pending()`

Worker roundtrips come from the existing `invoke:*` `__navEvents` spans
(`Runtime.invoke`); send sites are labelled with
`Platform.perf_mark "<site>:page-loaded"`.

Harness: `docs/interaction-perf.mjs` — Playwright on
`~/pw-lui-perf` (graph `logseq_db_Demo`, BenchSmall ~55 blocks,
BenchBig ~200). Each op is an event→DOM-change rAF meter plus the
`__uiPerf` stage sums inside that window, median of 5 runs. Serve with
`node scripts/serve-static.mjs 3013`, open
`http://localhost:3013/index.html?rtc-test=true` (virtualization off in
this fixture — worst case for patch volume).

## Numbers (median of 5; ms; ops = patch ops in window)

| op                   | raf before | raf after | OCaml after | flush | apply | ops before | ops after | samples | worker ms |
|----------------------|-----------:|----------:|------------:|------:|------:|-----------:|----------:|--------:|----------:|
| click-to-edit        |       10.8 |       6.3 |        14.4 |   9.5 |   4.3 |         ~50 |        50 |       6 |      — |
| type-char            |         —* |         —* |        12.3 |   6.9 |   5.4 |          ~8 |         8 |       2 |    26 |
| enter-new-block      |         —  |      25.5 |        37.5 |  31.9 |   6.7 |          — |       168 |      72 |   181 |
| escape-editor        |         —  |      18.1 |        19.8 |  16.3 |   3.7 |          — |        41 |       6 |     2 |
| indent-tab           |       ~50  |      40.9 |        34.0 |  28.3 |   5.8 |          — |       316 |      73 |   199 |
| outdent-shift-tab    |         —  |       0.8 |        44.4 |  27.5 |   7.4 |        377 |       377 |      72 |   189 |
| fold-toggle          |         —  |      15.2 |        19.5 |  13.5 |   6.0 |          — |       198 |       2 |    19 |
| nav-page-ref         |        281 |     306.7 |       353.1 | 274.2 |  76.6 |    50,775 |    27,499 |      27 |   982 |
| sidebar-toggle       |        3.3 |      12.4 |         6.9 |   3.6 |   3.1 |          2 |         2 |       6 |    13 |
| cmdk-open            |         17 |      23.6 |        25.2 |  20.0 |   5.3 |        526 |       526 |       8 |    15 |
| cmdk-query           |         35 |      13.4 |        39.8 |  34.0 |   5.6 |     1,878 |       303 |       6 |    61 |
| cmdk-pick            |     ~330†  |       0.4†|       345.0 | 270.4 |  74.3 |    27,360 |    27,742 |      18 |   685 |
| ctx-menu             |     crash  |       1.2 |        26.6 |  16.4 |  10.2 |        —   |       408 |       3 |     — |
| set-property-dialog  |        7.5 |      18.6 |        27.2 |  17.5 |   9.4 |        —   |       348 |      15 |    28 |
| scroll-big-page      |         —  |         — |           0 |     0 |     0 |          0 |         0 |       1 |     — |

\* type-char raf check unreliable (textarea-value probe); OCaml side
measured — 12.3ms total, 8 ops, dominated by flush. keystroke emit was
already fixed on `editor-perf-opt`.
† cmdk-pick's raf is meaningless (it triggers navigation; the nav emit
is what `total_ocaml` shows). Nav cost ≈ nav-page-ref.

## Findings + fixes

### 1. Context menu crashed on open — fixed

Right-clicking a block threw `Invalid_argument` and rejected the whole
patch batch: `menu_item` kind requires a `~text:` prop (`TextValue`
schema), but `cm_item_el`/`cm_sub_item_el` emitted the label as a `text`
child node instead. Added `~text:label` to all three `menu_item` call
sites in `src/popups/popups_view.ml` and dropped the redundant `text`
children. Menu now opens (13 items), "Set property" dialog works.

### 2. Stale page-ref hover preview mounted a second page after navigation — fixed

`pv_open` (`popups_view.ml`) arms a 1000ms hover timer, then fetches
`get-page-route-info` + `get-page-blocks-tree` and mounts the *entire
target page* inside `.lui-popup-portal`. Clicking a page-ref navigated
within the hover window; `on_hash_change` only closes an *already-open*
preview, so the fetch resolved ~1.1s after nav and mounted ~6,000 nodes
as a ghost popover over the new page — measured as a second 23,658-op
emit + ~226ms flush, plus the duplicated worker fetches. `pv_open` now
skips triggers whose wrapper is no longer `isConnected`, and re-checks
attachment when the fetch resolves. Post-nav ghost emit is gone
(50,775 → 27,499 ops per nav).

### 3. cmdk result rows remounted on every keystroke — fixed

`Cmdk_state.item_dom_key` encoded 10 content fields (query, highlight,
mouse, index, title, icon, badge…) into the `keyed` key. Every keystroke
changed every row's key → full drop+remount of the ~50-item list:
~626 patch ops per char. The key is now the stable `it.ikey`
(uuid-scoped per item); all dynamic fields already ride the row's
`item_sig` reactive props, so they update in place and in-order.
3-char query: 1,878 → 303 ops. Verified in-browser: typing, hover,
ArrowDown, Enter-pick all work, zero emit errors — the old key's safety
comment ("never re-mount dynamic branches mid-flush") doesn't apply
because signal republish is an in-place update, not a remount.
`test_main.ml` assertions updated to the stable-key contract.

## Round 2 — flush coalescing + incremental page mount

Target: outliner ops ≤60ms end-to-end on the main thread, and the
~300ms page-nav resend. Two structural changes:

### 4. ~70 synchronous flushes per outliner op — coalesced

Every async callback (worker `done:` handlers, sync subscribers) ended
with `Signal.set` + `Runtime.flush ()`, and a single outliner op queued
~70 of them — 70 full stabilize/emit/diff passes on the main thread
(~190ms of churn spread over ~1s after each op). `Runtime.flush` now
schedules one flush through a host-wired `schedule_flush` ref
(`setTimeout 0` on web, `Host.set_timeout` on native, inline in tests);
callbacks across sequential event-loop tasks share a single pass, and
`Runtime.send` keeps its synchronous tail-flush for callers that mutate
DOM-read state. Samples per outliner op: ~73 → ~13.

That exposed a latent bug: `Signal.set` only stages `pending` until
the next stabilize, so `Signal.get_state`/`Signal.get` read the *last
published* value — any `get`→`set` read-modify-write inside one
deferred window reverted intermediate writes (cmdk `open_palette`'s
later `set_in`s clobbered `open_=true` back to false; the same hazard
existed in sidebar/cards/dialogs/properties/popups/views). Fix:
`Runtime.signal_get` reads `pending` first, published second; all
`Signal.get_state` / `Signal.get *.state_signal` sites under `src/`
converted. Upstream has since added the same pending-aware read inline
in `cmdk_state`/`state_cell`/`export_state`/`editor_*` — equivalent.

### 5. Page navigation full-page emit — incremental keyed mount

`nav-page-ref` was one `send:page-loaded` flush of ~503ms emitting
~24.4K ops / ~6.8K nodes (200-block page, keyed path — rtc-test
disables `Logseq_virt`, and production pages <64 rows take keyed too).
`blocks_area` now feeds `keyed` a growing prefix of the blocks spine:
first 16 rows emit in the nav flush, then a `setTimeout(0)` growth loop
republishes the window one chunk at a time — keyed only mounts newly
appended rows per republish, so each deferred task emits one chunk.
The per-page reset lives inside the derived signal chain
(`spine_sig → windowed`) so a route change can't publish a full spine
before the new limit lands; the driver is armed only when the keyed
list is the one mounted (virtualized pages window rows themselves).

Results (median, 200-block BenchBig in rtc-test):

| metric                        | before   | after    |
|-------------------------------|---------:|---------:|
| nav raf (event→visible)       |   ~626ms |   ~146ms |
| largest single flush          |  ~503ms  |  ~40–56ms|
| first block in DOM            |  ~600ms+ |  ~150ms  |
| all 200 rows in DOM           |  ~530ms  |  ~525ms  |
| per-chunk flush (16 rows)     |    —     |  ~26–30ms|

Total CPU is unchanged (~435ms of emit spread over ~12 tasks), but no
single task exceeds ~60ms and the page paints + accepts input after
the first chunk. `send:navigate-to` (old-page teardown + shell +
first chunk, ~3.9K ops) measures 56–80ms across runs — the remaining
single-emit outlier; shrinking it needs subtree-level detach ops in
`Lui_runtime`, not done here.

Outliner ops after both changes (median of 5, rtc-test): click-to-edit
18.3, type-char 3.5, enter-new-block 30.2, escape 6.1, indent 5.3*,
outdent 21.5, fold 29.9 total_ocaml ms — all under 60ms. (*indent
samples under-count this run: the op's keystroke sometimes lands on an
already-indented block and emits nothing.)

## What is still slow (evidence)

- **`send:navigate-to` teardown emit** (~3.9K ops, 56–80ms): the
  old-page unmount + shell emit is still a single pass. Needs
  subtree-level detach ops at the `Lui_runtime` layer to bound it.
- **Worker tail after nav/edit** (~180–340ms off the measured path):
  unlinked-refs fetch (`favorited-page?`/`get-recent-pages`/`get-blocks`)
  and the post-edit `Page_loaded` double-fire (optimistic + authoritative
  splice) still run — mostly background, but they keep the worker busy.
- **Total nav CPU is unchanged** (~435ms emit for 200 blocks spread
  over ~12 tasks). Per-row emit cost (~20µs/op, ~122 ops/row) is the
  floor; reducing it needs cheaper wire encode or leaner row subtrees.
- **`total_ocaml` > raf on several ops** (enter 37.5ms vs 25.5ms raf):
  some flush work lands in a second cycle the rAF probe already
  resolved past. Not a mis-measurement; the stage numbers are exact,
  raf is the user-visible bound.

Not slow: fold (15ms), sidebar (12ms — raf noise; OCaml 6.9ms),
cmdk-open (24ms, 526 ops is a one-time 50-row mount), dialogs
(~19–27ms). Scroll produces zero handler samples — fully compositor-
side, no per-frame O(tree) work.

## Reproduce

```sh
cd deps/ui
OPAMSWITCH=5.5.0 opam exec -- dune build @all
pnpm gulp:build && pnpm css:build && pnpm ui:build
node scripts/serve-static.mjs 3013   # then:
node docs/interaction-perf.mjs       # writes /tmp/interaction-perf.json
```

## Round 3 — what landed

Four fixes, measured on the same BenchSmall→BenchBig nav fixture:

1. **`data_attrs_encode` exception tax (lui)** — the per-attr
   separator validation ran `String.contains` 4x per pair; every miss
   unwound a `Not_found`, which Melange lowers to `MelangeError`
   (exception object + stack capture). A nav emitted ~500K of these —
   491ms of sampled CPU, ~15µs/op. Replaced with a byte scan
   (lui `4052362`). Per-chunk mount flush: ~41–53ms → **7–17ms**;
   `send:page-loaded` 66ms → 10ms. This was THE per-op floor (~20µs/op).
2. **`href="#"` default stomp** — `.page-ref`/`.tag`/`.link-item`
   anchors never called `preventDefault`, so ~130ms after the
   programmatic hash write the browser navigated to "#", resolving a
   spurious `Home`→`load_journals` pipeline mid-nav (a second
   `get-page-blocks-tree`/`get-blocks`/`get-block-parents` chain plus a
   stray Journals mount). `on_doc_click` now preventDefaults every
   `a[href='#']` (sidebar_state + native twin). Nav workerMs
   ~704–718 → ~270.
3. **`get-rtc-graph-uuid` refetch loop** — `refresh_db_rtc_uuid`
   re-invoked the worker on every model emission while the uuid was
   unresolved (logged-out/rtc-test): ~50–65ms invokes firing per
   outliner op. Gated on `logged_in && rtc_group` like its consumers.
4. **Nav pipeline ordering + merged extras** — `resolve` fires
   `load_route` before the `Navigate_to` commit so `get-page-route-info`
   rides the worker during the synchronous ~85ms teardown flush instead
   of queueing behind it; `fetch_ref_count` + `fetch_unlinked_exists`
   merged into one `get-render-snapshots` call after `Page_loaded`.

Results (median, same fixture):

| metric                 | round-2  | round-3  |
|------------------------|---------:|---------:|
| nav total_ocaml        | ~750–870 | **~336** |
| nav workerMs           | ~704–718 | **~274** |
| nav raf                | ~251     | ~165     |
| teardown flush         | ~85–90   | ~88 (unchanged — drop ops carry no attrs) |
| per-chunk flush        | ~41–53   | ~7–17    |
| first content flush    | ~66–68   | ~10      |

Still open: `send:navigate-to` teardown (~5K ops, ~88ms) still needs
the subtree-detach op in `Lui_runtime` + every backend's store (web
store currently rejects drops on non-leaf/attached nodes). cmdk-pick
(134ms) is the same teardown shape.
