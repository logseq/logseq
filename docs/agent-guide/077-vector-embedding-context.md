# 077 — Vector embedding context chunks for cross-block search

Goal: Improve desktop vector search so semantic queries can match ideas that span adjacent or related blocks.

Goal: Preserve the current result model where a search hit resolves to a single anchor block UUID.

Goal: Keep vector index size and rebuild time close to the current one-vector-per-block design.

Related:
- `src/main/frontend/worker/search.cljs`
- `src/main/frontend/worker/db_core.cljs`
- `src/main/frontend/worker/platform/node.cljs`
- `src/test/frontend/worker/search_test.cljs`
- `src/test/frontend/worker/db_core_test.cljs`

## Context

The current vector index embeds one text value per searchable block. That keeps index size predictable, but misses queries where the meaning is split across a parent, a child, or neighboring sibling blocks.

Increasing recall by creating rolling windows for every block would multiply vector count. On large graphs this would increase zvec index size, rebuild time, and ONNX embedding work.

## Decision

Use one bounded context chunk per anchor block.

Each searchable block keeps one vector document whose id is the anchor block UUID. The embedding text is built from bounded local context:

- page title
- up to three nearest non-page parent titles
- previous sibling title
- current block title
- up to two direct child titles
- next sibling title

SQLite keyword search continues to index only the existing per-block `:title`. The richer context is vector-only.

Full index rebuilds must build the local-context cache once and reuse it across index batches. Do not compute sibling or child context by sorting the same parent children for every block.

Hybrid ranking should keep vector similarity as an auxiliary signal. Exact or strong keyword matches must not be displaced by weak vector hits.

## Constraints

- Do not increase vector document count.
- Do not change search result ids or rendering contracts.
- Do not put unbounded subtree text into an embedding input.
- Keep the final embedding input capped by `db_core` before it reaches Transformers.
- Preserve existing keyword index behavior and exact-match precision.
- Keep full-rebuild context preparation close to linear in block count.

## Rationale

This design improves cross-block semantic recall without multiplying index size. It also keeps incremental search updates simple: an updated block can still be represented as a block-shaped search document, while richer dependency-aware incremental refresh can be added later if needed.

The tradeoff is that context may become slightly stale for neighboring block edits until the next rebuild or a broader incremental refresh. This is acceptable for the first phase because full rebuild correctness is the priority and result ids remain stable.

## Future Work

- Rebuild affected neighbor anchor chunks on incremental updates:
  - the changed block
  - its previous and next sibling
  - its parent
  - direct children that include the changed block as context
- Add optional section-level chunks only if recall remains insufficient, with a hard cap on extra vectors.
