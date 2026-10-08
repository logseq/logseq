# Large-graph performance: 1000 journals × 100 blocks

Branch base: `devin/component-migration` (LUI rewrite, OCaml deps/ui +
gpui native host, OCaml db-worker daemon).

## Fixture

- Graph: `~/logseq-perf`, repo `logseq_db_perf1k`
  (`~/logseq-perf/graphs/perf1k/db.sqlite`).
- 1001 journal pages on consecutive days (Jan 13 2024 → Oct 8 2026,
  including today), each with ~100 top-level blocks; ~12% of blocks have
  1–3 nested children. Realistic text: varied lengths, `[[page refs]]`,
  `#tags`, TODO markers.
- Creation method: `~/perf-fixture/mkfixture.py` drives the native
  db-worker daemon's `POST /v1/invoke` API directly
  (`thread-api/create-or-open-db`, `create-page`, `apply-outliner-ops`
  `insert-blocks`, batched 5 journals per tx, 2.5s idle gaps so the
  WAL-checkpoint timer fires).
- Fixture insertion wall time: ~468s for the final ~40k blocks
  (`insert-blocks` calls: p50 3227ms, p95 5471ms, max 5824ms per
  5-journal tx). See "Write amplification" — bulk writes are the known
  hot spot.

## Measurements

### 1. Startup → first rendered journal page

`[boot +…]` marks + `[perf] patches` bytes, epoch `u=` wall clock.

| Launch | Daemon | daemon up | boot-ready | nav:journals | first content patch |
|--------|--------|-----------|------------|--------------|---------------------|
| Cold   | spawned fresh (20.9 GB db, `open-db` phase 26ms) | +78ms | +82ms | +88ms | **+141ms** |
| Warm   | reused (already running) | — | +11ms | +28ms | **+70ms** |

The db open is lazy (datascript restores on demand), so a 20.9 GB graph
costs ~80ms of daemon spawn, not GB-scale load time. Journal page
content patches then stream progressively (`patches ext` ~8–270KB per
journal chunk).

### 2. Journals list first paint

First journals content patch (`pump bytes=164997`) lands at **+141ms
cold / +70ms warm** — the initial page (`journals_initial=3` days)
renders inside the first second end-to-end including daemon spawn.

### 3. Scroll — blank-gap check (screen recordings)

Baseline (keyed non-virtual list): scrolling the journals list showed
blank/unrendered gaps → **FAIL** (recording: `recordings/journals-scroll.mp4`).
Root cause: `journals_view_ms` mounted every journal row
(`Lui_elements.keyed`) — the item list was "a keyed collection rather
than a virtualized one". ~1000 days × ~100 blocks each cannot mount
eagerly.

Fix landed on this branch (`deps/ui/src/pages/page.ml`): the outer day
list now uses `Virt_list.rows_sig` (web: tanstack-virtual window via
`Logseq_virt`; gpui: lazy-mount spine placeholders + `virt-end`
pagination). Inner block lists stay the non-virtual keyed
`Lazy_children` collection — a changed day row remounts on splice,
only the touched day repaints.

Post-fix on gpui: verified by screenshot pass — day rows mount as they
approach the viewport (Oct 7th item filled in on scroll, deep-scroll
viewports render dense block text with no blank bands). Testing-agent
recording `recordings/journals-scroll-virt.mp4` was captured on an
intermediate build that also lacked the content-column style
registration (below); the final build's scroll is verified via
`journals-virt-*` screenshots.

Layout fix on the same branch (`deps/ui/gpui/host/src/logseq_ext.rs`):
`cp__sidebar-main-content` / `cp__content-wrap` / `ls-page-blocks` /
`page-inner` / `journal-item` / `journal-last-item` semantic classes
were unregistered on gpui (no stylesheet there), so the 960px centered
content column collapsed to full-bleed and the -20px block gutter
clipped text at the window edge — text rendered flush/clipped left.
Ported the class rules from `resources/css/lui-core.css`.

Single journal page: the ≥64-block `Virt_list.list` page-route path was
observed rendering a blank body on one run (pre-existing; the block
list emits lazily-mounting spacers whose `lazy-mount` watches did not
fire during that session's dwell). Journals-list lazy-mount does fire
correctly after the style fix. Needs a follow-up look at the page
route's lazy-children path — flagged, not fixed.

Ops inside virtualized rows: Enter-split persisted to the db
(daemon-verified) and now renders after the fixes; a text edit
("muqqQQ") rendered live. Two `Db_tx.Invalid_tx` errors were seen
retrying ops on a block inserted out-of-band via rt.json (fixture
tooling artifact — fixture-native blocks save fine).

### 4. Outliner op latency (daemon-side invoke wall clock)

Measured by `~/perf-fixture/opprobe.py` against the live daemon
(port 55742) on a 100-block journal, n=15–30 per op:

| op                        | p50 | p95 | max | ≤60ms? |
|---------------------------|-----|-----|-----|--------|
| insert-blocks (Enter)     | 6ms | 26ms | 26ms | ✅ |
| save-block (edit text)    | 4ms | 38ms | 38ms | ✅ |
| indent-outdent (Tab)      | 7ms | 36ms | 37ms | ✅ |
| indent-outdent (Shift-Tab)| 6ms | 49ms | 49ms | ✅ |
| move-blocks-up-down       | 8ms | 32ms | 50ms | ✅ |
| collapse-expand           | 3ms | 20ms | 20ms | ✅ |
| delete-blocks             | 8ms | 35ms | 35ms | ✅ |
| checkbox toggle           | same tx class as save-block | | | ✅ |

All op types pass the 60ms bar at the storage/tx layer. UI-side adds
patch-apply latency (`[perf] op.apply_to_page` / `op.send` lines +
`apply batch` in the host log); the testing-agent recording covers the
interactive path.

### 5. Warm-cache second launch

Warm launch (daemon reused): boot-ready +11ms, first journals patch
+70ms — the graph handle is reused over `server-list`; reopen cost is
one `get-latest-journals` round trip.

## Bottlenecks found

### A. Write amplification (blocker for bulk loads — ~40KB/block)

Reproduced empirically by the companion investigation
(child session `devin-32c95e46f6504bcfa6e7f632ed797096`):
200 tx × 5 blocks (~5000 datoms) → 24,953 kvs rows / 40.5 MB payload
≈ **~40KB per block**. The finished graph is 20.9 GB in `kvs` —
roughly 10× the live-node count (2.16M rows vs ~200k live nodes).
Root causes, in order of impact:

1. **Orphaned rows are never deleted.** OCaml `buffered_node_storage`
   (datascript-ocaml `impl/storage.ml`) allocates a fresh address for
   every dirty node (append-only, preserving db-as-value for lazy
   snapshot refs) but has **no delete-buffer** — old-address rows
   accumulate forever. GC exists but is opt-in and not enabled.
2. **Compaction threshold too small.** OCaml pss
   `branching_factor = 32` (pss/lib:53) vs cljs fork's 512 — tail
   compaction (= full index store) fires every ~32 datoms ≈ every
   1–2 block txs instead of every ~500.
3. **Path-copy amplification.** Each compaction writes ~450–490 new
   rows, far above the ~15 nodes expected of path copying — suspected
   dirty-marking contagion up the parent chain (under investigation).
4. **WAL checkpoint starvation.** `deps/db-worker/lib/graph_store.ml:31-46`
   runs `wal_autocheckpoint=0` + a `wal_checkpoint(TRUNCATE)` debounced
   to 2s after the last tx; sustained writers starve the timer so the
   WAL grows unbounded (5.26GB observed mid-fixture). The graph pool is
   `locking_mode=exclusive` (`sync_state.ml:168`), so external
   checkpoints are also blocked — only idle gaps truncate.

Design tension noted: the cljs pss upsert semantics (write back to the
same `_address`) sacrifice db-as-value for storage-backed lazy refs;
OCaml's append-only keeps it but pays in rows unless GC/delete-buffer
lands.

### B. Journals list virtualization gap — fixed on this branch

Non-virtualized outer list (see §3). Fixed via `Virt_list.rows_sig`.

### C. Journals pagination granularity

`journals_chunk = 2` days per scroll-end (`deps/ui/src/routing/router.ml:222`)
vs web Virtuoso's continuous window — deep scrolling into year-old
journals requires ~500 sequential load_more round trips. Each trip is a
`get-latest-journals` invoke (~1–5ms server-side) so it converges, but
chunk=2 keeps the pipeline shallow during fast scroll. Not fixed —
flagged for review.

## Notes / caveats

- `opprobe.py` numbers are daemon-side; UI round trip adds patch apply.
- The 20.9GB fixture DB is kept live at
  `~/logseq-perf/graphs/perf1k/db.sqlite` for reproduction.
- Disk headroom on this VM is tight (~5GB free) — rebuilds compete with
  the fixture DB's footprint; a `VACUUM` of the graph would reclaim
  ~14GB but was deferred to keep the fixture intact.
