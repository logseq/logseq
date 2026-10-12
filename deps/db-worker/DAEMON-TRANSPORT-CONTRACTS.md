# Native daemon transport contract inventory

Oracle: `src/test/frontend/worker/db_worker_node_test.cljs` at
`114f6416a7fb21d20d6fe5a593271e5ea7697966` (53 `deftest`s).
Counterpart: `test/test_db_worker_node_melange.ml` (53 Fest registrations).
These names match, but this is **not** evidence of native process parity.
The Fest suite runs the daemon in-process; some tests replace its invoke,
storage, ownership, process, or logging functions. Every row below is a
source-to-contract comparison, not a name-only coverage count.

Legend: **P** is portable to the native worker/process; **A** is a portable
behavior whose original assertion also exercises a JS/Node-only trigger;
**O** includes orchestration outside this worker. **Real** means the Fest
case calls a real in-process worker for the decisive assertion;
**seam** means that assertion is made against an injected result or hook;
**mixed** means both. These are classifications of the *existing* Fest case,
not native process test results. **Selected** identifies the first native
transport/persistence slice; **later** means not covered by that slice.

| # | Master `deftest` (line) | Production contract; JS/desktop boundary | Fest (line; path) | Native process plan |
|---:|---|---|---|---|
| 1 | `db-worker-node-root-dir-permission-error` (244) | P: reject unwritable isolated root; Node chmod/OS permissions are the trigger | 566; real | later, OS-dependent |
| 2 | `db-worker-node-creates-log-file` (261) | P: log file appears after admitted start | 592; real | later |
| 3 | `db-worker-node-log-file-has-entries` (280) | P: unknown invocation returns 500 and emits a nonempty log | 604; real | selected, including log |
| 4 | `db-worker-node-logs-version-on-startup` (304) | P: logged revision/build time | 624; real | later |
| 5 | `db-worker-node-logs-println-output` (327) | A: captured stdout/logging; cljs `println` primitive is JS runtime-specific | 647; real, uses Node console instead | later; distinguish the trigger |
| 6 | `db-worker-node-logs-console-error-output` (349) | A: captured error logging; JS `console.error` primitive | 662; real, uses Node console | later; distinguish the trigger |
| 7 | `db-worker-node-logs-console-number-output` (371) | A: non-string console argument formatting; JS console primitive | 677; real, stringifies `123` first | later; not exact numeric-argument parity |
| 8 | `db-worker-node-logs-process-stdout-output` (392) | A: raw Node `process.stdout.write` interception | 691; real, Node-specific | JS-only trigger; native stdout capture needs separate proof |
| 9 | `db-worker-node-log-retention` (414) | P: keep seven dated logs | 706; real | later; native log retention unit behavior may exist |
| 10 | `db-worker-node-parse-args-ignores-host-and-port` (440) | P: unsupported CLI flags do not change repo/root | 749; real parser, omits JS nil-field assertions | executed real child with ignored legacy flags; host/port/repo observed via health |
| 11 | `db-worker-node-parse-args-ignores-auth-token` (452) | P: ignore deprecated auth-token flag | 765; real parser | executed with ignored auth-token; no direct nil-field parser assertion |
| 12 | `db-worker-node-parse-args-ignores-rtc-ws-url` (460) | P: ignore deprecated websocket flag | 776; real parser | executed with ignored rtc-ws-url; no direct nil-field parser assertion |
| 13 | `db-worker-node-parse-args-recognizes-create-empty-db` (468) | P: recognize empty-graph flag | 788; real parser | later |
| 14 | `db-worker-node-parse-args-ignores-server-list-file` (476) | P: ignore deprecated registry flag | 802; real parser | executed real child; legacy path unused, default registry published |
| 15 | `db-worker-node-parse-args-recognizes-version` (486) | P: recognize version flag | 819; real parser | later |
| 16 | `db-worker-node-main-version-exits-early-without-repo` (493) | P: version/exit 0 without opening graph | 826; seam for process exit/start | executed; actual exit 0, revision stdout, no graph/registry |
| 17 | `db-worker-node-main-missing-root-dir-prints-error-and-exits-1` (526) | P: missing root produces error and exit 1 | 846; seam for process exit/start | executed; actual exit 1, empty stdout, required error stderr |
| 18 | `db-worker-node-main-missing-repo-prints-error-and-exits-1` (554) | P: missing repo produces error and exit 1 | 873; seam for process exit/start | executed; actual exit 1, empty stdout, required error stderr |
| 19 | `db-worker-node-owner-source-cli-is-published` (582) | P: `/healthz` publishes `owner-source=cli` | 899; real | selected |
| 20 | `db-worker-node-owner-source-electron-is-published` (602) | P: `/healthz` publishes `owner-source=electron` | 912; real | later; no Electron host required for daemon assertion |
| 21 | `db-worker-node-handle-event-encodes-sse-json-payload` (622) | P: SSE `data:` JSON contains Transit payload; original calls `handle-event` directly | 928; seam for sink; real encoder | selected for emitted production event; not direct synthetic event |
| 22 | `db-worker-node-handle-event-preserves-namespaced-type` (640) | P: namespaced event type and Transit payload survive SSE; original uses synthetic `db-worker/ui-request` | 950; seam for sink; real encoder | selected for production `thread-api/set-ui-state`; synthetic kind remains separate |
| 23 | `db-worker-node-help-documents-required-root-dir-and-omits-server-list-file` (658) | P: public help flags and ANSI styling | 972; mixed stdout/color seams | executed plain CLI help; forced ANSI/TTY assertion remains later |
| 24 | `db-worker-node-start-daemon-uses-empty-datoms-when-create-empty-enabled` (678) | P: init then create/open with empty datoms and sync download flag | 1015; seam invoke and db-exists | later; verify resulting graph, not fabricated call list |
| 25 | `db-worker-node-start-daemon-uses-default-startup-opts-without-create-empty` (706) | P: init then normal create/open options | 1049; seam invoke and db-exists | later; native actual startup |
| 26 | `db-worker-node-start-daemon-defers-open-for-new-graph` (732) | P: non-CLI graph waits for explicit open | 1074; seam invoke and db-exists | selected for binary import destination |
| 27 | `db-worker-node-start-daemon-opens-new-graph-for-cli-owner` (758) | P: CLI graph opens eagerly | 1094; seam invoke and db-exists | selected for source graph |
| 28 | `db-worker-node-stop-closes-bound-repo` (786) | P: shutdown closes worker DB | 1116; seam invoke | selected via different-PID reopen, not call-list equivalence |
| 29 | `db-worker-node-stop-retains-publication-until-process-exit` (813) | P: registry publication persists at stop; same PID remains in original in-process test | 1145; seam invoke/db-exists, real registry | later; process-exit timing differs |
| 30 | `db-worker-node-repo-error-handles-keyword-methods` (836) | P: missing/mismatched repo rejection and repo-less method exemptions; cljs keyword method accepted | 1176; real pure validator, methods translated to strings | selected for HTTP repo errors; keyword-method equivalence later |
| 31 | `db-worker-node-set-context-does-not-trigger-repo-mismatch` (864) | P: context/sync configuration is exempt from repo mismatch | 1276; real | later; no real RTC server in this case |
| 32 | `db-worker-node-create-empty-startup-skips-built-in-initial-data` (889) | P: empty graph lacks library page | 1309; real | later |
| 33 | `db-worker-node-sync-status-requires-repo-and-returns-structured-status` (913) | P: structured sync state and missing-repo error | 1327; real but no server | later; server-backed RTC separate |
| 34 | `db-worker-node-sync-start-and-status-invoke-path` (944) | P: sync remains inactive without WS config | 1363; real but no server | later; no claim of real RTC |
| 35 | `db-worker-node-daemon-smoke-test` (971) | P: health/readyz, registry, lock, invoke Transit, typed transact/query | 1403; real *in-process* | selected with real child PID; publication-at-stop requires separate assertion |
| 36 | `db-worker-node-vector-search-finds-outline-context-after-rebuild` (1048) | P: semantic vector search after rebuild | 1494; conditional `darwin` plus embeddings URL, otherwise true/skip | later; never count optional skip as verified |
| 37 | `db-worker-node-import-edn` (1124) | P: export/import graph EDN between repos | 1562; real | later |
| 38 | `db-worker-node-import-file-graph-posts-progress-over-sse` (1184) | P: import status, progress type/payload/labels, persisted page | 1609; real SSE + import | selected; check importer result and emitted SSE |
| 39 | `db-worker-node-import-file-graph-electron-lazy-fs-path` (1269) | O: worker resolves lazy `fs-path`; Electron file enumeration is outside worker | 1717; real worker on fixture, paths enumerated inline | later; use actual filesystem inputs, not UI substitute |
| 40 | `db-worker-node-import-db-binary` (1306) | P: Transit `Wire.Binary` export/import into another graph | 1771; real | selected; distinct daemon PIDs |
| 41 | `db-worker-node-import-db-binary-accepts-raw-request-body` (1367) | P: octet-stream POST import from raw SQLite bytes | 1821; real Node Buffer transport | selected; native byte string preserves exact bytes |
| 42 | `db-worker-node-export-client-ops-db-binary` (1431) | P: client-ops binary has SQLite header | 1877; real | selected |
| 43 | `db-worker-node-backup-db-sqlite` (1455) | P: backup path exists and bytes import into second graph | 1908; real | selected; backup generated by endpoint only |
| 44 | `db-worker-node-accepts-prefix-equivalent-repo-test` (1518) | P: `demo` and `logseq_db_demo` match | 1969; real | later |
| 45 | `db-worker-node-repo-mismatch-test` (1540) | P: mismatched repo returns HTTP 409/code | 1990; real | selected |
| 46 | `db-worker-node-lock-prevents-multiple-daemons` (1562) | P: another owner cannot acquire same graph | 2010; real but same PID | executed; competing executable exits 1/repo-locked, first owner remains ready |
| 47 | `db-worker-node-ownership-covers-import-backup-and-reopen` (1584) | P: ownership persists across mutate/reopen until stop | 2030; real within one PID | executed lifetime via real child contenders after import/backup/close/reopen; original direct lock-file assertion not reproduced |
| 48 | `db-worker-node-mutations-require-retained-ownership` (1614) | P: lost ownership rejects mutating methods | 2081; injected ownership failure, real HTTP | later; production lock loss reproduction only |
| 49 | `db-worker-node-desktop-and-cli-share-same-graph-daemon` (1640) | O: actual Electron/CLI reuse path belongs to orchestrator | 2129; real daemon but inline imitation, not real Electron/CLI | later; native UI/CLI integration owner |
| 50 | `db-worker-node-validation-error-returns-400` (1691) | P: invalid outliner tag assignment maps to HTTP 400, not 500 | 2183; real | later; use original invalid operation |
| 51 | `db-worker-node-query-validate-error-returns-400-with-invalid-query-code` (1741) | P: invalid query returns 400/code/message | 2240; real | selected |
| 52 | `db-worker-node-opening-graph-does-not-run-maintenance` (1769) | P: cold reopen retains `graph-last-gc-at=0` | 2272; real same PID | selected; actual different PID and typed graph values |
| 53 | `close-bound-repo-releases-db-after-sync-stop-fails` (1799) | P: close DB despite sync-stop failure, propagate error | 2306; injected invoke failure | later; no fake successful sync or RTC server |

Additional native-only invariant (not counted as one of the 53): a complete
graph delete must not be rediscovered on a cold restart by either the worker's
`list-db` or native UI's `getGraphs`/`list_repo_names`. `unsafe-unlink-db`
deliberately retains a graph directory for sync re-download; do not treat it
as complete deletion or change its directory policy without an observed
failure and the corresponding UI/lifecycle owner.

Native verification must first build `bin/main.exe`, then run the registered
native suites. The current `test/native/dune` rule does not list the daemon
binary as a dependency; no Dune change is authorized for this slice.
When running `dune runtest`, export `LOGSEQ_DB_WORKER_BIN` as the **absolute**
path to the built executable. The Dune sandbox does not otherwise contain it.

## Executed first slice

Four native Alcotest cases now launch a real, graph-admitted `bin/main.exe` in
isolated roots and communicate over TCP, not an in-process invoke hook:

1. `/healthz`/ownership, production `/v1/invoke` JSON+Transit typed
   page/block transact and query, logged unknown method (500), missing repo
   (400), repo mismatch (409), and invalid query (400 plus original message).
2. Chunked `/v1/events` frames with both ordinary transaction updates and
   import progress, Transit-decoded typed payloads, original importer status,
   issue count, current page, finishing state, persisted page, and clean
   client-close/worker-shutdown sequence.
3. SQLite bytes from `export-db-binary`, `export-client-ops-db-binary`, and
   `backup-db-sqlite`, imported through Transit binary and raw
   `application/octet-stream` POST into separately admitted daemons, then
   queried from the imported databases.
4. A *different-PID* cold restart with persistent typed page, block, parent,
   reference, collapsed flag, property definition/value, and query results;
   `graph-last-gc-at=0` remains unchanged after reopening.

Focused `daemon-http`: 4/4 passed. Full `dune runtest` with the explicit
binary path: exit 0 (the native aggregate ran 979 registrations, including
these four). Actual `logseq/docs` v0.10.12 fixture: exporter integration
cases 11, 32, 38 passed. Worker Node/browser package build and schema
`65.34` passed; UI `js_app` and browser-vector regression 3/3 passed on
`ocaml-signal` 02e18cdc and LUI 9771a6d. The original first run of
`dune runtest` *without* `LOGSEQ_DB_WORKER_BIN` failed only the four new
cases because its sandbox could not see the separately built executable;
it is not a native transport failure.

One red-green native runtime regression was observed: after a successful
binary import, the subsequent real HTTP invoke stalled for 60 seconds,
sampling at 100% test-process CPU inside `Net_eio.read_loop` and
`Httpun.Client_connection.read_with_more`. `R.read` returned zero for a
fragmented response, and the pump re-parsed the same pending bytes forever.
`Net_eio.pump` now preserves and refills pending bytes before parsing again,
with bounded growth and a fail-fast EOF path. The same four daemon cases
then passed, as did the full worker suite. This native-only HTTP pump has
no counterpart in pinned master's Node HTTP implementation.

These results verify the specified first slice, **not** all 53 master
contracts, synthetic SSE types, full native UI graph deletion, or real
server-backed RTC. Entries marked `later` remain unverified at the native
process boundary; the in-process Fest suite is not their substitute.

## Executed process-exit and ownership slice

Three additional native cases use isolated roots and the actual executable:

- CLI early exits: `--version` and `--help` exit 0 without repo/root;
  required root/repo errors exit 1 with empty stdout and the original stderr
  message. These commands create neither graph storage nor a daemon registry.
  Help documents `--root-dir` and omits `--server-list-file`. The original
  forced-color assertion is still a separate gap.
- A graph-admitted daemon accepts deprecated host/port/auth-token/RTC URL/
  server-list flags without honoring them: health reports the real loopback
  listener, bound repo, and CLI owner, the obsolete registry path is unused,
  and a typed transaction/query succeeds. The original parser's exact
  nil-field assertions remain in the in-process Fest suite, not this case.
- Ownership: actual competing child PIDs exit 1 with `repo-locked` while the
  first daemon remains ready. Repeating this after real binary import,
  backup, close, and reopen proves retained ownership. Shutdown admits a new
  PID and the original typed page remains queryable. This is not a direct
  filesystem assertion on the original master's lock path.

Focused `daemon-http`: 7/7 passed, including a separate rerun of the legacy
flag assertions; no production change was needed. They do not
prove lock-loss injection, shared Electron/CLI orchestration, or complete
native parity for the remaining matrix rows.
