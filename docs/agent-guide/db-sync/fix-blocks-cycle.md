This document describes the handling of cycles formed between multiple blocks in the implementation of db-sync.

## When cycles are detected
- Cycles are detected on the server when applying client tx batches in `deps/db-sync/src/logseq/db_sync/worker.cljs`.
- The server calls `logseq.db-sync.cycle/detect-cycle` which inspects updates to `:block/parent` (and other special attrs like class extends).
- If applying the tx would introduce a cycle, the server rejects the batch with `{:type "tx/reject" :reason "cycle" ...}`.

## What the server returns
- The reject payload includes:
  - `attr`: the attribute that introduced the cycle (for blocks this is `:block/parent`).
  - `server_values`: a map of the affected entities to the server’s current value for `attr` (from `logseq.db-sync.cycle/server-values-for`).
- This allows the client to realign its local state to the server’s authoritative values.

## Client-side reconciliation
- The client handles `tx/reject` with reason `"cycle"` in `src/main/frontend/worker/db_sync.cljs`.
- It calls `reconcile-cycle!` which builds `:db/add` / `:db/retract` ops to restore `attr` to the server values, then transacts them locally with `:rtc-tx? true`.
- The intent is to correct local cycles and prevent re-uploading conflicting changes.
- The client also strips cycle-related attrs (`:block/parent`, `:logseq.property.class/extends`) from the rejected inflight txs, requeues the remaining changes, and flushes pending txs so other attribute updates still sync.

## Known pitfalls and fixes
- :logseq.property.class/extends not well handled yet, let it be for now, FIX it later
