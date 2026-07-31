# Search and Indexing Review Rules

Apply when a change touches search, indexing, query caches, full-text search, page/block lookup, autocomplete, or cache invalidation.

## Review focus

- Index updates should stay consistent with DB transactions, imports, deletes, renames, and graph switches.
- Search results should respect graph boundaries and current graph state.
- Cache keys must include every input that changes the result.
- Ranking and filtering changes should be tested with realistic mixed data.
- Large graph performance should be considered for repeated queries and background indexing.

## Red flags

- Cache invalidation based only on partial transaction data.
- Index updates that can miss rename/delete/move events.
- Search results leaking across graphs or windows.
- Blocking UI while rebuilding large indexes.
- Tests with only one page or one matching block.

## Review questions

- What invalidates the index or cache?
- Does deletion, rename, move, import, and sync update results correctly?
- Are results scoped to the active graph?
- Does ranking remain deterministic enough for tests?
- Is the work done off hot render paths?
