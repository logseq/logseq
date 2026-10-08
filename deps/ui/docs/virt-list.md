# Virtual list notes (page blocks + journals)

Audit vs cljs master's react-virtuoso (`use-virtual-list-opts`,
`src/main/frontend/components/block.cljs`) and the fixes that came out
of it, branch `devin/virt-list-blank-fix`.

## Bugs fixed

1. **Blank list body after navigate / refetch** —
   `Logseq_virt.attach` runs on a `setTimeout(0)` after mount and
   subscribed the items signal with `~emit_initial:false`, so any
   emission that landed between mount and attach — plus the value the
   signal already held — was dropped. The virtualizer then computed its
   first window with `count=0`, leaving the spacer at `height:0` until
   the next publish. `attach` now seeds `data` with `Signal.sample`
   before building the virtualizer.

2. **White gaps during continuous scroll** — every scroll-driven
   republish went through the coalesced deferred flush
   (`Runtime.flush` → `setTimeout(0)`), so row positions stayed stale
   for whole frames while the viewport moved (measured ~15–20% viewport
   coverage at 600px/frame, ~53ms commit latency). `publish` now calls
   `Runtime.flush_now` so the commit happens inside the scroll event,
   the same position React commits virtuoso updates. Painted coverage
   is now ≥0.9 at every sampled position.

3. **Journals infinite scroll dead on the boot route** —
   `load_more_journals` gated its append on
   `!Runtime.current_route`, a ref only set by `Navigate_to` — it is
   `None` on the boot-loaded journals route, so every fetched chunk was
   silently discarded. It now checks `Runtime.route ()` (the model),
   matching `load_journals`. Verified: 47 seeded journal days paginate
   in `on_end` chunks until `has_more` closes.

4. **Overscan parity** — page block lists pass `~overscan:16`
   (16 rows ≈ 508px at the 32px estimate, matching cljs virtuoso's
   overscan 254 + increase-viewport-by 254). Journals keep 5
   (5 × 800px ≈ 4000px, already wider).

## Verification (Playwright, `node scripts/serve-static.mjs 3013`,
`?rtc-test=true&virtualized=true`, ~3900-block `VirtProbe` page)

- `docs/virt-probe.mjs`: 8 navigate round-trips, 0 blank states.
- `docs/flick-probe.mjs`: scrollbar flick top↔bottom — first visible
  row lands in 26–51ms (~1–2 frames, row-mount bound; same class as
  master on an instant jump).
- `docs/virt-verify.mjs`: 600px/frame sweeps, painted viewport coverage
  ≥0.9 everywhere (was 0–0.2 before fix 2); settled coverage 1.0.
- `docs/journal-verify.mjs`: scroll-to-bottom pages all 47 days via
  `on_end` → `load_more_journals` chunks; stops when the worker returns
  fewer than `journals_chunk`.
- `node _build/default/test/ui_test/test/test_main.js`: 1551 checks, 0
  failures.

## Residual notes / documented exceptions

- Sustained 600px/frame scrolling costs ~60–80ms per frame while the
  leading-edge rows mount — block rows are real components, same
  per-frame mount cost master pays (virtuoso also blocks paint during
  row mounts). Teleport jumps (scrollbar grab) show content after
  ~30–50ms for the same reason.
- Pixelmatch vs cljs master: not run — the cljs master bundle is not
  built in this environment (only the LUI dev bundle exists under
  `static/js`). The comparisons above are numeric DOM coverage/latency
  measurements instead of image diffs.
- Master's `:is-scrolling` journal placeholder (`journal.cljs`
  `journal-placeholder-item`) has no LUI equivalent; LUI mounts real
  rows during scroll, trading mount cost for no placeholder flash.
