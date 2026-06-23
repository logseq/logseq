# DB Sync Missing Entity Cases

## Context

Observed failure on iOS startup:

- The app opened a db graph and automatically created the current journal page.
- Client had `local pending = 1`.
- Server had about `remote pending = 109`.
- Remote apply failed with:

```clojure
Nothing found for entity id [:block/uuid #uuid "6a37baf7-116c-4d25-a2da-cefca3bef9fd"]
```

The single local pending tx in the captured log is the automatic journal creation:

```clojure
{:outliner-op :create-page
 :forward-outliner-ops [[:create-page ["Jun 22nd, 2026" ...]]]}
```

That local tx is not the missing block. It makes `apply-remote-txs!` use the
reverse-remote-rebase path while the client catches up remote txs.

## Original Remote Shape

The remote batch does not create the failing block in the same batch. It first
modifies a block that the client does not have, then deletes that same block:

```clojure
;; t 45803
{:outliner-op :save-block
 :tx-data [[:db/retract [:block/uuid #uuid "6a37baf7-116c-4d25-a2da-cefca3bef9fd"]
                         :block/title
                         "several"
                         ...]
           [:db/add [:block/uuid #uuid "6a37baf7-116c-4d25-a2da-cefca3bef9fd"]
                    :block/title
                    ""
                    ...]]}

;; t 45804
{:outliner-op :delete-blocks
 :tx-data [[:db/retractEntity [:block/uuid #uuid "6a37baf7-116c-4d25-a2da-cefca3bef9fd"]]]}
```

Datascript fails while resolving the lookup ref in `t 45803`, before it can
apply the later delete in `t 45804`.

## Root Cause

The client local DB and client sync cursor are inconsistent for this block:

- The server is sending txs after the client's stored `local-tx`.
- The server assumes earlier txs created `6a37baf7...` locally.
- The client DB does not contain that entity.

The reproduced root cause is the graph download path:

1. The client called `/sync/:graph-id/pull` and read `:t` from that response.
2. The client then downloaded a snapshot from `/sync/:graph-id/snapshot/stream`.
3. Import finalization wrote the earlier `/pull` `:t` into client-op
   `:local-tx`.

Those are different requests. If the snapshot content is older than the `/pull`
cursor, the client DB can miss entities whose create tx is at or before the
stored cursor. Later catch-up starts after that cursor, so it never receives the
create tx. The next remote edit for that UUID fails with `:entity-id/missing`.

Local RED proof:

```clojure
;; /pull says the server is at t=2
{:type "pull/ok" :t 2}

;; the actual snapshot stream represents t=1
;; old code finalized import with t=2
```

Pre-fix test result:

```text
expected: (= 1 @finalized-remote-t*)
  actual: (not (= 1 2))
```

Test:

```clojure
frontend.worker.sync.download-test/download-finalizes-with-snapshot-t-not-preflight-pull-t-test
```

The iOS automatic journal creation is important because it creates a local
pending tx before remote catch-up completes. It does not create the missing
entity, but it makes remote apply run through the rebase path:

1. Reverse pending local journal creation.
2. Apply remote catch-up txs.
3. Rebase the local journal creation.

## Local Reproduction Cases

### Case 1: Missing block edit followed by delete

Shape:

- Client DB does not have `missing-uuid`.
- Repair endpoint returns no tx data for `missing-uuid`.
- Remote batch contains a title edit for `missing-uuid`.
- Same remote batch later contains `[:db/retractEntity [:block/uuid missing-uuid]]`.
- Remote batch also contains an unrelated valid edit that must still apply.

Pre-fix result on `b6fec73d8b`:

```clojure
:entity-id/missing
[:block/uuid missing-uuid]
```

Post-fix expected result:

- `missing-uuid` is absent.
- Unrelated remote edit is applied.
- `db-validate/validate-local-db!` has no non-recycle validation errors.

Test:

```clojure
frontend.worker.db-sync-test/apply-remote-txs-skips-unrepaired-missing-block-deleted-in-batch-test
```

### Case 2: Same missing block edit/delete while local journal tx is pending

Shape:

- Same as Case 1.
- Client also has one pending local tx before remote apply.
- This matches the iOS startup observation where automatic journal creation
  creates `local pending = 1`.

Pre-fix result on `b6fec73d8b`:

```clojure
:db-sync/apply-remote-txs-failed
:entity-id/missing
```

Post-fix expected result:

- `missing-uuid` is absent.
- Unrelated remote edit is applied.
- Local pending edit is rebased.
- `db-validate/validate-local-db!` has no non-recycle validation errors.

Test:

```clojure
frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-skips-unrepaired-missing-block-deleted-in-batch-test
```

### Case 3: Remote create then delete in the same batch

Shape:

- Client has never seen `deleted-uuid`.
- Remote batch creates the block with a temp id.
- Same remote batch later deletes it by lookup ref.
- Remote batch also contains an unrelated valid edit.

This is valid remote history and should not fail. It is a guard case for the
repair pruning logic.

Expected result:

- `deleted-uuid` is absent.
- Unrelated remote edit is applied.
- `db-validate/validate-local-db!` has no non-recycle validation errors.

Test:

```clojure
frontend.worker.db-sync-test/apply-remote-txs-skips-missing-block-created-then-deleted-in-batch-test
```

## Fix Boundary

### Root fix

Graph download must not derive the imported DB cursor from a separate `/pull`
response.

Implemented boundary:

- `download-graph-by-id!` no longer preflights `/pull`.
- `/snapshot/stream` returns an `x-snapshot-t` header.
- `download-graph-by-id!` finalizes import with `x-snapshot-t` from the actual
  stream response.
- `x-snapshot-t` is exposed through CORS.
- `/snapshot/download` also returns a cheap `:t` field for protocol visibility,
  but the client uses the stream response header for the imported cursor.

Cloudflare Worker constraints:

- Do not compute a full checksum while serving snapshot download.
- Do not materialize the whole snapshot in memory.
- Keep snapshot rows streamed in batches.

### Existing bad-state guard

The apply-side guard should only prune obsolete tx items when all of these are
true:

1. The remote batch references a block UUID missing from the local DB.
2. The client requested server repair data for that UUID.
3. Repair data did not contain that UUID, meaning the server's current state no
   longer has the block.
4. The same remote batch deletes that UUID.

When pruning is needed, prune tx items whose entity is that block UUID, including:

- lookup-ref entity ids like `[:block/uuid uuid]`
- temp ids that are mapped to that UUID by `[:db/add temp-id :block/uuid uuid]`

Do not drop unrelated tx items. Do not leave temp-id-created ghost entities.

## Verification Commands

Root-cause download test:

```bash
bb dev:test -v frontend.worker.sync.download-test/download-finalizes-with-snapshot-t-not-preflight-pull-t-test
```

Download namespace:

```bash
bb dev:test -v frontend.worker.sync.download-test
```

Server protocol/handler tests:

```bash
bb dev:db-sync-test
```

Focused:

```bash
bb dev:test -v frontend.worker.db-sync-test/apply-remote-txs-skips-unrepaired-missing-block-deleted-in-batch-test \
  -v frontend.worker.db-sync-test/apply-remote-txs-skips-missing-block-created-then-deleted-in-batch-test \
  -v frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-skips-unrepaired-missing-block-deleted-in-batch-test
```

Full db-sync namespace:

```bash
bb dev:test -v frontend.worker.db-sync-test
```

Latest local full result after the fix:

```text
Ran 184 tests containing 665 assertions.
0 failures, 0 errors.
```

Additional latest results:

```text
frontend.worker.sync.download-test
Ran 4 tests containing 5 assertions.
0 failures, 0 errors.

bb dev:db-sync-test
Ran 124 tests containing 3681 assertions.
0 failures, 0 errors.

frontend.worker.db-worker-test/db-sync-download-graph-by-id-cleans-temp-pool-on-failure-test
Ran 1 tests containing 5 assertions.
0 failures, 0 errors.
```
