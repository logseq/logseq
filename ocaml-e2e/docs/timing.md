# E2E timing comparison — Melange (`ocaml-e2e`) vs Clojure (`clj-e2e`)

Measured on this branch (`devin/ocaml-db-worker`), same machine, serial
runs for clean numbers. App built with `DEV-RELEASE` +
`OUTLINER-PERF-LOGGING`, served from `static/` on :3001/:3002.

## Suite totals

| suite | wall time | tests | pass | fail | run config |
|---|---|---|---|---|---|
| melange (30 files, serial) | **3011 s (~50 min)** | 249 | 241 | 8 | headless, `slow_mo=100`, port 3002, one `node --test` per file |
| clj subset (4 namespaces) | 365 s | 63 | — | 1 error | **headed**, `slow-mo=30`, port 3001 (`dev/user.clj` semantics: `clojure -X:dev-run-all-basic-test`) |

### Per-namespace, melange vs clj (representative subset)

| namespace | clj (s) | melange (s) | ratio |
|---|---|---|---|
| undo_redo | 25.5 | 30.7 | 1.20 |
| commands_basic | 152.9 | 231.7 | 1.52 |
| property_basic | 36.9 | 44.7 | 1.21 |
| outliner_basic | 150.0 | 209.6 | 1.40 |

clj figures include ~2.3 s JVM+namespace boot each. clj ran headed with
`slow-mo=30`; melange ran headless with `slow_mo=100` — most of the ~1.35x
gap is the per-action delay difference, confirmed by the A/B below.

## Where melange time goes

Stage breakdown (`bench-stages.js`, 3 iterations each, slow_mo=100 → 30 → 0):

| stage | @100 | @30 | @0 | notes |
|---|---|---|---|---|
| browser launch | 0.04 | 0.04 | 0.04 | headless shell is cheap |
| new page + init script | 0.02 | 0.02 | 0.03 | |
| `open_app` (nav + `#search-button`) | 3.37 | 3.47 | 3.46 | app boot itself — JS eval + first graph create |
| `developer_mode` + normal-mode assert | 0.02 | 0.02 | 0.02 | already applied by init script |
| `refresh_test_env` (reload + checks) | 1.98 | 1.92 | 1.90 | second full app boot per file |
| `new_logseq_page` (per-test fixture) | 1.11 | 0.91 | 0.79 | cmdk search 400 ms settle + create |
| `validate_graph` (per-test fixture) | 1.31 | 0.98 | 0.97 | esc + cmdk + toast wait |
| browser close | 0.04 | 0.03 | 0.04 | |

- **Per-file fixed cost ≈ 5.5 s** (launch→refresh→close), i.e. ~165 s of the
  suite. `open_app`+`refresh` dominate it (~5.3 s of pure app boot ×2).
- **Per-test fixed cost ≈ 2.4 s** (`new_logseq_page`+`validate_graph`),
  ~10 min of the suite over ~249 tests.
- The rest is test bodies (~9 s/test avg): Playwright actions at
  `slow_mo=100 ms` each + `cmdk_search_settle_ms=400` per search + explicit
  `wait_timeout` sleeps (~33 s of fixed sleeps across all test files).

### `slow_mo` A/B on real files (before this change)

| file | @100 (s) | @30 (s) | @0 |
|---|---|---|---|
| test_tag_basic | 34.7 | 25.2 (−27.6%) | 31.7 + 1 flake |
| test_property_basic | 44.5 | 34.9 (−21.6%) | — |
| test_right_sidebar | 18.0 | 15.9 (−11.7%) | — |

`E2E_SLOW_MO=0` is faster per action but turns waits into flakes that cost
more than they save. `30` is the sweet spot (same value clj `dev/user.clj`
uses; clj CI still uses 100).

## Optimizations already applied (this commit)

1. `lib/config.ml`: `slow_mo` default `100.` → `30.` (`E2E_SLOW_MO` still
   overrides). ~20% suite-wide, stays green.
2. `lib/settings.ml` `refresh_test_env`: check `test_env_ready` *before*
   reloading; the init script already installs the env pre-navigation, so
   the reload is skipped (~1.9 s × 30 files ≈ 57 s). Readiness check itself
   is unchanged.

Post-change verification (serial, all green incl. RTC):

| file | before | after | Δ |
|---|---|---|---|
| test_tag_basic | 34.7 | 22.7 | −34.7% |
| test_property_basic | 44.5 | 32.2 | −27.7% |
| test_export_basic | 12.4 | 9.2 | −26.1% |
| test_undo_redo | 30.7 | 22.7 | −26.0% |
| test_query_builder_basic | 23.9 | 16.1 | −32.7% |
| test_rtc_basic | 85.5 | 76.4 | −10.6% |

## Top 5 remaining opportunities (ranked by expected savings)

1. **Run test files in parallel — biggest lever (~2.4–4x wall time).**
   `node --test` already runs each file in its own worker process; files
   only share the read-only static server (graphs live in per-browser
   IndexedDB). Verified: tag+property+export+right_sidebar in one
   invocation = 33.3 s vs ~80 s serial, all green. Projected suite
   ~15–20 min vs ~50. Keep `test_rtc*` serial/low-concurrency to avoid
   sync-service rate limits. Change: invoke `node --test` on file groups
   (or `--test-concurrency`) in a runner script/CI.
2. **`cmdk_search_settle_ms` 400 → 150–200 ms** (`lib/util.ml:71`). Every
   `search`/`search_and_click` pays the fixed settle ≥2×/test (page create
   + validate command) ≈ 2–3 min suite-wide. Search result waits already
   retry via `repeat_until_visible`, so a shorter settle mostly shifts the
   wait to where it's needed. Medium flake risk — verify before defaulting.
3. **RTC grace polls** (`lib/graph.ml`): `e2ee_password_prompt_grace_ms
   = 2000` + 250 ms poll steps; `rtc.ml` waits `button.cloud.on.idle` up to
   35 s. The 2 s grace fires per sync-graph operation — ~1–2 min across
   `rtc_extra*`. RTC-only; keep serial with #1.
4. **Reduce per-file boot by sharing a browser/context across files**
   (~5.5 s/file → amortize the 3.4 s `open_app` + 1.9 s refresh over the
   suite ≈ up to ~2.5 min more). Larger refactor: shared env pool keyed by
   file, conflicts with per-file process isolation unless combined with #1.
5. **Trim per-action keyboard delays** (`press_seq`/`repeat_keyboard`
   `~delay:20` per keystroke, ~60+ call sites) and the `exit_edit` 1 s
   `wait_for_hidden` retry: tens of seconds total; lower payoff than #1–#4.

## Failure / flake log from the measured run (8 melange, 1 clj)

For follow-up as port bugs/flakes — none are timing issues:

- `test_bidirectional_properties`: waits `.property-k 'People'` (20.9 s) —
  likely real port bug.
- `test_commands_basic` `date-time-test` — assertion flake; clj
  `calculator-test` also errored in the same namespace run.
- `test_editor_basic`: `journals-list-remounts-…` and
  `consecutive-enter-and-delete-ops-…` — 2 flakes.
- `test_plugins_marketplace`: 2 lifecycle flakes.
- `test_rtc_extra` (`rtc-outliner-conflict-update-test`) and
  `test_rtc_extra_part2` (`online-two-clients-undo-redo-stress-test`, 319 s)
  — RTC flakes, worst offenders in the suite.

## Reproducing

```sh
# build once
cd ocaml-e2e && eval $(opam env --switch default --set-switch) && dune build
# serve ../static on :3002 (melange) and :3001 (clj dev)
cd clj-e2e && bb serve -p 3002 & bb serve -p 3001 &

# serial per-file timing → timing/<ts>/
ocaml-e2e/run-timing.sh          # then summarize-timing.py timing/<ts>/
# single file
node --test ocaml-e2e/_build/default/test/test_node/test/test_<name>.js
# clj per-namespace (dev semantics: headed, slow-mo 30, port 3001)
cd clj-e2e && clojure -M:dev-run-all-basic-test -e \
  "(require 'logseq.e2e.undo-redo-test) \
   (clojure.test/run-tests 'logseq.e2e.undo-redo-test) (System/exit 0)"
# stage benchmark
node ocaml-e2e/bench-stages.js [slow_mo] [iters]
```
