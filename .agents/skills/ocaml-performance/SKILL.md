---
name: ocaml-performance
description: Performance rules and profiling workflow for the OCaml db-worker (deps/db-worker) — quadratic `List` patterns that blow up on datom/tx-scale data, storage-backed index costs (Aevt vs Avet, entity materialization, whole-index walks), and how to CPU-profile the node daemon. Use when writing, reviewing, or debugging OCaml code in deps/db-worker or logseq/lg, especially when something is slow but "looked fine" in cljs.
---

# OCaml performance (deps/db-worker)

cljs datascript keeps every index in memory, so patterns that look free there
(`List.exists` dedup, `entity` per row, `d/datoms` full scans) become real
costs in the OCaml worker: storage-backed indexes make each `entity`/`ent_of_id`
a seek, and `List` ops on datom-scale collections are O(n²) on real graphs.

## Quadratic `List` patterns — never use on datom/tx/entity-scale collections

Flag any of these inside loops or folds over datoms, tx ops, entities, or
rows (anything that scales with graph size):

| Pattern | Problem | Replacement |
| --- | --- | --- |
| `List.exists`/`List.mem` against an accumulated `seen`/`acc` list | O(n²) membership scans | `Hashtbl` (keyed by the value or `.id`), or `Db_reference.IdSet`/`Int_set` for entity ids |
| `acc @ [x]` / `xs @ [x]` inside `List.fold_left` | O(n²) list copies per element | `x :: acc` then `List.rev` at the end, or `Rrbvec` for indexable vectors |
| `List.assoc`/`List.remove_assoc` inside a fold (grouping) | O(n²) assoc scans | `Hashtbl.replace tbl key (x :: Hashtbl.find_opt tbl key)` then `Hashtbl.fold` |
| `let seen = ref []` + `List.mem` dedup | Same quadratic dedup | `Delete_blocks.distinct_txs` / `distinct_entities` (hashtbl, keeps first-occurrence order like cljs `distinct`) |
| `List.of_seq (datoms db <idx> ())` | Materializes the whole index into a list — GBs of heap churn + GC | `Seq.fold_left`/`Seq.iter` streaming; only collect what you emit |
| `(distinct …)` ported as list dedup | cljs `distinct` is hash-based | mirror it with `Hashtbl`, never lists |

Real-world instance: `delete_property` ran `List.exists` + `acc @ [tx]` over
~25k `block/path-refs` retract ops on the 4k-movies graph — ~10⁹ structural
compares, 20+ minutes at 100% CPU while the cljs equivalent (`distinct`)
finishes in milliseconds. Same bug shape appeared in
`Delete_blocks.update_refs_history`/`build_cleanup_tx`/`expand_delete_blocks_tx`.

## Index access rules (AGENTS.md restated with the traps)

- `datoms db Avet ~a:attr` **throws** `Invalid_argument ("Attribute :x should
  be marked as :db/index true")` when the attr lacks `:db/index true`
  (e.g. `block/pre-block?`). For attr-bounded walks that must work on any
  attr, use `Aevt` — it covers every datom and returns the same
  `(a,e,v,tx)` ordering for a single attr.
- `entity`/`ent_of_id`/`Ldb.value` inside a loop = one storage seek per
  call. Prefer a bounded `datoms ~e`/`~a`/`~v` query and datom-level checks.
- `datoms db Eavt ()` or an unbounded `Avet ~a` slice walks the whole index —
  only acceptable for inherently whole-db operations (export, checksum,
  validate, one-time heals), and then stream with `Seq.fold_left`, never
  `List.of_seq`.
- Value-range seeks don't isolate `Instant` values: `compare_value` ranks
  `Instant` as its own class but compares it numerically against
  `Int64`/`Float`/`Ref`, so instants interleave with numerics in AVET.

## Sets and maps

- `Clj_value` set ops (`set_intersection`, `set_difference`, `set_contains`)
  are `List.mem` over `coll_items` — O(n·m). Fine for small cardinality-many
  attrs; flag when used on large ref sets (refs, path-refs).
- `Wire.Map`/`Block_map` assoc-lists are per-entity (~tens of entries) —
  `List.assoc` there is fine.

## Profiling the node daemon

The daemon is a plain node process — no rebuild needed:

```bash
kill -USR1 <pid>            # enables inspector on 127.0.0.1:9229
curl -s 127.0.0.1:9229/json/list   # find the webSocketDebuggerUrl
```

Then drive CDP `Profiler.start`/`stop` over the ws url (`ws` npm package).
The worker bundle is minified — map `callFrame` line/column to
`dist/db-worker-node.js` columns to identify frames: `caml_obj` compare/equal
machinery ≈ structural compares (quadratic dedup, set ops), `caml_*` GC frames
≈ heap churn (`List.of_seq`, `@` appends).

Symptom signatures: CPU 100% with `/proc/<pid>/io` reads stopped =
in-memory/CPU work, not disk — usually a quadratic `List` pattern or index
materialization, not "search index building" or sqlite.
