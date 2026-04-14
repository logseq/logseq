# ADR 0014: KV-Row R2 Snapshot Download With Worker-Owned Low-Memory Import

Date: 2026-04-01
Status: Proposed

## Context
Snapshot download previously exported Datascript datoms as gzip NDJSON from the
server and parsed/transacted datoms on the client main-thread handler path.

That design had two issues:

1. Server snapshot export walked full datoms and spent avoidable CPU/memory.
2. Client download logic lived in handler code and was not aligned with worker
   ownership for large-graph import.

We already use framed Transit `kvs` rows for snapshot upload. Download should
converge on the same wire format.

## Decision
1. `GET /sync/:graph-id/snapshot/download` and `/snapshot/stream` export framed
   Transit `kvs` rows (`[addr content addresses]`) instead of datom NDJSON.
2. Snapshot download payload content-type is `application/transit+json`
   (gzip-compressed when available).
3. Server snapshot export reads directly from sqlite `kvs` rows in ascending
   `addr` batches and streams framed payloads to response/R2.
4. Graph snapshot download orchestration is moved to
   `frontend.worker.sync.download` and invoked from db-worker thread API.
5. Handler code delegates graph download to worker API instead of parsing
   snapshot payloads directly.
6. Client import adds row-chunk API (`:thread-api/db-sync-import-rows-chunk`).
   Row batches are staged in temp sqlite, then replayed into target conn in
   schema-first order.
7. Replay order must transact schema-critical datoms before regular data:
   - `:logseq.kv/schema-version` entity datoms
   - attribute-definition datoms (`:db/ident` and `:db/*` metadata such as
     `:db/valueType`, `:db/cardinality`, `:db/unique`, `:db/isComponent`)
   - all remaining datoms

## Consequences

### Positive
- Lower server CPU/memory for snapshot export (no datom NDJSON generation).
- Download/upload snapshot format is unified around framed `kvs` rows.
- Download pipeline ownership moves to worker sync module.
- Schema-first replay protects index/schema correctness for large imports.

### Tradeoffs
- Client still performs datom replay during finalize to rebuild a consistent
  target store, so import cost shifts to worker finalize phase.
- Adds temp sqlite staging and one additional import path (`rows` alongside
  legacy datom chunk path).

## Verification
- Server tests assert snapshot download/stream return framed kv rows with
  transit content-type and sorted addresses.
- Handler tests assert graph download delegates to worker API and maintains
  download-state lifecycle.
- Worker tests assert rows-chunk API wiring and schema-first import ordering.
