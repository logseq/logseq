# Editor keystroke latency smoke — O(local) verification

Status: measurement report (no fixes). Branch `devin/editor-perf`,
2026-10-06. Contract under test (`docs/editor-surface-extension.md`):
*"typing must stay O(local run diff), never re-segment the page"* and
*"shape signature skip-rebuild per keystroke"*.

## Method

`test/editor_bench.ml` mounts a real `Lui_app` (`Edit_view.view` +
`logseq-editor` extension + `Edit_input.handle` reducer — the same
wiring as `edit_view_test.ml`) on a recording backend that replays
every patch batch into `Drive.Model` while counting ops, distinct
touched node ids and estimated wire bytes. Corpus: one synthetic
500-line block (26,226 bytes; plain text with `**bold**` / `[[ref]]` /
`#tag` / `` `code` `` lines mixed in).

Phases per operation:

- **model** — pure `Edit_input.handle` on a pristine model.
- **send** — `Lui_app.send` (reducer + publish).
- **emit** — `Lui_app.flush` minus patch-callback time: signal
  recompute + `lines_of` + keyed diff + op encoding.
- **apply** — inside `apply_batch` (replay into the hashtable model; a
  lower-bound proxy for host DOM work, not a measurement of it).

Reproduce:

```sh
opam exec --switch=5.5.0 -- dune build test
node _build/default/test/ui_test/test/editor_bench.js   # full table
node _build/default/test/ui_test/test/editor_probe.js   # scaling probe
```

Times in ms, node (V8, same runtime family as the web surface — the
bench runs the Melange build, which is what production ships).
p50/p95 over 12–25 samples; patch counts are exact per flush.

## Numbers — one 500-line block, single keystroke ops

| op                      | model p50 | model p95 | send p50 | emit p50 | emit p95 | apply p50 | ops p50 | ops max | nodes | bytes p50 |
|-------------------------|-----------|-----------|----------|----------|----------|-----------|---------|---------|-------|-----------|
| caret_move              |     0.004 |     0.012 |    0.011 |   97.340 |  103.317 |     0.004 |     1 |     1 |     1 |      30 |
| insert_plain            |  2138.636 |  2288.015 | 2236.645 |  117.960 |  146.084 |     0.008 |     3 |     3 |     2 |   22037 |
| insert_in_bold_reveal   |  2152.635 |  2543.755 | 2167.574 |  113.030 |  123.088 |     0.007 |     3 |     3 |     2 |   21995 |
| backspace_at_delim      |  2970.263 |  3178.138 | 3116.738 |  120.032 |  128.150 |     0.433 |  2929 |  2929 |  1186 |  101470 |
| select_expand           |     0.001 |     0.002 |    0.015 |   97.531 |  101.026 |     0.005 |     1 |     1 |     1 |      30 |
| ime_comp_update         |     0.001 |     0.009 |    0.010 |   99.312 |  104.962 |     0.005 |     1 |     1 |     1 |      38 |
| ime_commit              |  2297.097 |  2356.102 | 2274.821 |  116.835 |  120.456 |     0.008 |     4 |     4 |     2 |   22066 |
| enter_split_route       |     0.000 |     0.002 |    0.012 |  100.374 |  105.101 |     0.000 |     0 |     0 |     0 |       0 |
| paste_200_lines         |  3978.476 |  4150.558 | 4253.536 |  355.346 |  392.783 |     4.671 |  9760 |  9760 |  2816 |  276582 |
| insert_near_end         |  2122.878 |  2164.287 | 2127.915 |   97.942 |  103.672 |     0.007 |     3 |     3 |     2 |   22037 |

Internals (same corpus, independent timings):

| step                        | p50 (ms) | p95 (ms) |
|-----------------------------|----------|----------|
| `M.create` (runs + lines)   | 2286.7   | 2355.5   |
| `Edit_runs.runs` source     |  325.1   |  337.5   |
| `M.lines_of_source` source  | 1931.7   | 1953.8   |
| `Edit_view.lines_of` model  |   99.3   |  106.2   |
| `Edit_view.runs_prop_of`    |  101.4   |  107.1   |

Scaling probe (`test/editor_probe.ml`, markup corpus):

| lines | runs | create | lines_of |
|------:|-----:|-------:|---------:|
|    50 |   4.5 |   14.5 |    1.4 |
|   100 |   9.6 |   62.3 |    2.8 |
|   200 |  36.4 |  227.2 |   11.2 |
|   500 | 350.1 | 2272.2 |  104.5 |
|  1000 | 1422.0 | 8960.1 |  370.7 |

## Where the time goes

**Model side (~2.1s per buffer mutation at 500 lines).**
`Edit_model.rebuild` re-segments the *whole* source on every splice —
`E.runs` + `lines_of_source` — by design. Two independent costs stack:

1. **`Str_util.index_from` is quadratic under Melange**
   (`edit_model.ml:233` via `lines_of_source`). Its inner loop calls
   `String.sub s j m` at every position — and the Melange runtime
   implements `String.sub` as
   `bytes_to_string(Bytes.sub(bytes_of_string(s), ofs, len))`:
   `bytes_of_string` converts the **entire 26KB source to a char-code
   array per call**. So each character position costs O(buffer) —
   1.93s to split 500 lines. The same scan with stdlib
   `String.index_from` takes **0.4ms** (~2800–5000× faster).

2. **`Render_inline.find_sub` is the same pattern**
   (`render_inline.ml:11` — `String.sub s j m = pat` per position,
   invoked from ~15 matcher call sites). `match_tokens` tries the full
   matcher table at every position, and each `**`/`[[`/`` ` ``/`$` cue
   forward-scans with O(n) `String.sub` per position → O(n²) with a
   heavy constant: 325ms at 26KB, super-linear (1.4s at 52KB).

So a 500-line block pays **~2.3s** for one `Insert "x"` before the
view even runs — the splice itself is O(1); the mandatory full
rebuild is not.

**Emit side (~97–120ms per flush regardless of op).**
`lines_s = Signal.map lines_of model` republishes on *any* model
change — including caret-only moves, selection expansion, IME
composition updates and Enter routing, all of which emit 0–1 patch
ops yet still pay ~97ms of `lines_of` (O(lines × runs): every line
filter-maps over the entire run list) plus `runs_prop_of`
re-serialization. `Edit_model.shape` exists as the documented
skip-rebuild signature but **nothing consumes it** — the gate was
never wired to the view.

**Patch side (the good news).**
The emitted patch itself *is* narrow for local edits: `insert_plain`
and `insert_near_end` emit 3 ops / 2 touched nodes / 0 creates — the
keyed `(idx, kind-tag)` frag identities hold. `insert_near_end`
touches **zero** line-row nodes. The DOM-level O(local) contract holds;
the violation is entirely upstream CPU + wire bytes: every keystroke
re-sends the `runs` prop for the whole buffer (~22KB) since all
frag offsets shift.

## Exceptions to "narrow patch"

- **`backspace_at_delim`: 2929 ops / 1186 nodes / ~101KB.** Deleting
  one `*` of a closing `**` unbalances the pair; the orphaned opening
  `**` pairs with a delimiter ~9 lines later, and every subsequent
  `**` in the buffer re-pairs — whole-buffer re-segmentation changes
  frag keys on ~250 lines → mass remount. Whole-source reparse makes
  a single delimiter edit a tail-of-buffer invalidation event.
- **`paste_200_lines`: 9760 ops / 2816 nodes / ~277KB.** 200 new line
  rows + frags is legitimately O(pasted lines), plus the same full
  rescan (~4s model).

## Regression checks (task §3)

| check | result | verdict |
|-------|--------|---------|
| paste-200 ≈ batched, not 200× char | 4619ms vs 200×2355ms → ratio **1.96×** | PASS — one splice, one rebuild |
| insert near end doesn't re-emit earlier lines | ops=3, creates=0, line-rows-touched=`[]` | PASS — patch is O(1); *but* model+emit CPU is O(buffer) |

## Fix recommendations (not implemented)

Ordered by expected payoff:

1. **Kill the `String.sub`-per-position scans.** Rewrite
   `Str_util.index_from` and `Render_inline.find_sub` to compare
   `s.[j+k]` chars directly (portable) — or stdlib
   `String.index_from` for single chars. Same API, ~5000× faster on
   the web target, and equally fast on native. This alone removes
   ~85% of the model cost (`lines_of_source` 1.93s → ~1ms).
2. **Incremental line table.** Even fixed, `lines_of_source` stays
   O(buffer) per keystroke. Re-split only the dirty line range: the
   line table changes shape only on `\n` insert/delete, so most edits
   can reuse it or re-derive O(lines) without touching text.
3. **Wire `shape` (or finer) into the view.** Gate `lines_of` on
   `version`+`shape`: caret/selection/IME/comp updates and routed
   keys (Enter) shouldn't recompute frags at all — that's ~97ms per
   flush recovered for every non-mutating keypress. Prop-only deltas
   (`caret`, `composition`) still publish.
4. **Window run re-segmentation.** `rebuild` re-runs `match_tokens`
   on the whole source. Re-segment only the touched visual line plus
   construct context, splice the run list; fall back to full rescan
   only when the delimiter balance changed (the `backspace_at_delim`
   cascade shows exactly when that fallback is required — even that
   case currently pays full rescan + mass remount).
5. **`lines_of` single pass.** O(lines × runs) → O(lines + runs):
   assign runs to line ranges in one zip instead of per-line
   `filter_map` over the whole run list.
6. **Delta-encode or scope the `runs` prop.** ~22KB re-serialized and
   re-sent per keystroke because all downstream offsets shift.
   Per-line `runs` props (keyed by line node) or host-side
   measurement off the patched text nodes would drop this to O(local).
7. **`M.create`/`rebuild` redundancy.** `rebuild` recomputes
   `lines_of_source` even for ops that can't change line breaks
   (single-char splice inside a line). Skip when the splice contains
   no `\n` (check before calling, not after).

Web-side spot check (task §4): skipped — standing up the full web
build + CDP typing harness exceeds the 30-minute budget, and the
Melange-runtime numbers already isolate the model/emit costs a
browser frame would only obscure. `apply` is a replay proxy, not a
DOM-cost measurement.

## Caveats

- 500 lines is an extreme block (~26KB); at a more typical ~5-line
  block these costs shrink to noise (runs ~0.2ms, lines_of ~1ms).
  The findings matter because the complexity classes are wrong, not
  because typical blocks are slow.
- Times are single-threaded V8 on Apple Silicon; absolute numbers
  shift with machine, relative structure doesn't.
- `String.sub` cost is a Melange-runtime property: on the native
  OCaml platforms (apple/gpui) the same scans are cheap, so `Bytes`
  units don't rescue this — the web surface is the one that pays.
