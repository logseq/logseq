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
`/tmp/pw-lui-perf` (graph `logseq_db_Demo`, BenchSmall ~55 blocks,
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

## What is still slow (evidence)

- **Page navigation ~300ms raf.** One full-page emit: ~6.4K live nodes →
  ~23K patch ops. Split ≈ 165ms OCaml emit/diff/encode + ~77ms DOM
  apply + worker ~65ms (`get-page-route-info` first call) + ~210ms
  trailing `favorited-page?`/`get-recent-pages`/`get-blocks` batch
  (unlinked-refs fetch). The emit is linear in page size; the fixture
  runs `rtc-test` with `Logseq_virt` disabled so the whole page renders.
  Cutting this needs either virtualization on the bench path, chunked
  emit, or cheaper per-op encode — none done here.
- **Indent/outdent/enter trigger a ~70-send storm (~190ms of worker +
  ~30ms main-thread churn spread over ~1s).** Each edit sends
  `Action.Page_loaded` twice (optimistic reparent + authoritative splice
  — see `optimistic:page-loaded`/`splice:page-loaded` marks), each of
  which re-runs page subscribers that send further actions. Mostly
  background after first paint, but it keeps the main thread busy right
  after the op. A send coalescing/debounce pass on `subs` broadcasts
  would cut it; out of scope of these changes.
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
