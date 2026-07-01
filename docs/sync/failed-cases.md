# Sync Stress Failed Cases

## CLI tag-name resolution failed during expanded stress

- Date: 2026-07-01
- Graph: `cli-test-5`
- Command: `node scripts/cli-concurrent-edit-stress.mjs --graph cli-test-5 --concurrency 3 --sync --offline --offline-ms 800 --timeout-ms 20000 --max-ops 80 --extra-pages 2 --journal-pages 2 --journal-start 2026-07-01`
- Symptom: `upsert block --update-tags '["cli-stress-tag-a"]'` failed with `Cannot parse :find, expected: (find-rel | find-coll | find-tuple | find-scalar)`.
- Root cause: OCaml CLI tag-name resolution used a duplicated Datascript class query path for tag names. Numeric tag ids worked, but string tag names failed before the outliner mutation was applied.
- Regression test: `cli/test/test_cases.ml` now covers `upsert block --update-tags '["Tag A"]'` resolving through `thread-api/cli-list-tags`.
- Fix: tag-name resolution in `cli/lib/upsert.ml`, `cli/lib/add.ml`, and `cli/lib/update.ml` now uses the existing tag list endpoint instead of the broken query path.
- Sync status after the failed stress smoke: local and remote tx both reached `71`, pending queues were zero, and checksums matched (`b18d36f60f52de7e`).

## Recent db-test sync-stuck issue cluster

- Date checked: 2026-07-01
- Issues:
  - `logseq/db-test#937`: existing browser graphs do not sync; console reports `Invalid local tx` with `local-tx nil`.
  - `logseq/db-test#947`: browser reports `0 pending server changes` while desktop and CLI changes are already on the server.
  - `logseq/db-test#969`: after suspend/resume, the app is online but RTC is stopped with `rtc-state :close`, `pending-local-ops 1`, and `local-tx == remote-tx`; clicking `Start Sync` resumes sync.
  - `logseq/db-test#898`: graph stays yellow and only recovers after deleting the local graph and re-downloading.
  - `logseq/db-test#890`: graph stays in `Preparing`; opening from remote graphs works but no sync indicator appears.

### Repro path: missing client-ops `local-tx`

- Target symptom: `Invalid local tx` on server `hello`, or a silent `db-sync/start-skipped` because `client-op-ready?` is false.
- State to create: graph DB and client-ops DB are both open, but `sync_meta.local-tx` is missing from the client-ops DB.
- Why this matches the issues: existing local graphs affected by old cache/migration state can have remote graph ids and pending local rows, while `local-tx` is absent. Missing `local-tx` must not be treated as `0`, because that would force the client to pull too many server txs from the beginning.
- Existing fix: `:thread-api/db-sync-start` opens DBs before starting sync, and `sync/start!` skips with `:client-op-not-ready` until client-op metadata has a real integer `local-tx`.
- Regression test: `frontend.worker.sync.restart-test/start-skips-when-client-op-local-tx-is-missing-test`.
- Expected fixed behavior: no websocket connection is opened when `local-tx` is missing, and no code initializes missing `local-tx` to `0` outside the explicit new-remote-graph/upload paths.

### Repro path: stale RTC after resume

- Target symptom: online app with `rtc-state :close`, pending local changes, and no automatic retry until manual `Start Sync`.
- State to create: current RTC client still targets the active repo/graph, but its websocket is already closed or stale after sleep/offline/resume.
- Relevant issue evidence: `logseq/db-test#969` reports `pending-local-ops 1`, `local-tx 1244`, `remote-tx 1244`, `rtc-state :close`; `logseq/db-test#780` reports stale websocket timeout after network returns.
- Regression tests:
  - `frontend.handler.db-based.rtc-flows-test/resume-restart-events-do-not-depend-on-cached-rtc-lock-test`
  - `frontend.worker.sync.restart-test/start-reconnects-closed-ws-with-stale-open-state-test`
  - `frontend.worker.sync.restart-test/stale-loop-marks-non-open-ws-closed-test`
  - `frontend.worker.sync.restart-test/ws-close-clears-inflight-before-reconnect-test`
- Expected fixed behavior: network-visible/resume triggers can restart RTC, and stale/closed websockets clear inflight state, broadcast `:closed`, and schedule reconnect instead of leaving the graph permanently stopped.
