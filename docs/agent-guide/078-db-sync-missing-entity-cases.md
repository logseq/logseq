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

## Likely Cause

The client local DB and client sync cursor are inconsistent for this block:

- The server is sending txs after the client's stored `local-tx`.
- The server assumes earlier txs created `6a37baf7...` locally.
- The client DB does not contain that entity.

This can happen if a restored local DB or snapshot is missing an entity whose
creation happened before the stored cursor, or if an earlier remote apply/import
advanced the cursor without leaving the corresponding entity in local DB.

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

The fix should only prune obsolete tx items when all of these are true:

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
