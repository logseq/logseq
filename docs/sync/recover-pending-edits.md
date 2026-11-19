# Recovering dropped DB sync edits

This guide covers the malformed saved references reported in
[db-test#1541](https://github.com/logseq/db-test/issues/1541).

Close the affected graph and copy its full directory before attempting
recovery. Keep the SQLite databases, any accompanying WAL files, and available
backups. The client operations database can hold saved text and reference
metadata that no longer appear in the graph.

The fixed worker repairs pending transactions during replay when their reference
metadata identifies the missing references. The repaired transaction stays
pending until the server acknowledges it. Check the complete text, links and
descendants after syncing and reopening the graph.

When replay fails, the worker keeps the original transaction in the local
operations database and marks it failed. The sync indicator shows a warning and
`logseq sync status --output json` reports the count in `failed-local`. Keep the
operations database for recovery. On a backup copy, the following read-only
query lists failed rows with their saved forward operations and normalized
transaction data:

```sql
SELECT tx_id, created_at, outliner_op, forward_outliner_ops, normalized_tx_data
FROM client_ops
WHERE kind = 'tx' AND failed = 1
ORDER BY created_at, id;
```

Older versions may have marked lost edits `pending=0, failed=0`, which is also
the state of normally acknowledged edits. Compare a backup and any retained
operations by block UUID. Review missing descendants and partial text changes
as well as absent blocks. Restore confirmed missing material into a separate
graph for review before merging it with current content, since newer edits may
exist on other devices.
