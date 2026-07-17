# Melange Common and DB API Inventory

Goal: Record the exact statically discovered public definitions, consumer sets, initial dispositions, and migration batches for Gate 1 of `docs/agent-guide/079-melange-common-db.md`.

## Method

The inventory was generated with clj-kondo `var-definitions` and `var-usages` analysis across `deps/common`, `deps/db`, all downstream `deps/*` CLJS libraries, root application and Electron sources, tests, scripts, CLI, and E2E sources.

CLJC definitions were deduplicated by namespace, var name, source path, and source row because clj-kondo reports the CLJ and CLJS branches separately.

The exact per-var records are stored in `docs/agent-guide/079-melange-common-db_inventory_common.json` and `docs/agent-guide/079-melange-common-db_inventory_db.json`.

Each record names its owner namespace, source location, resolved consumer namespaces, consumer groups, initial disposition, and planned migration batch.

Static analysis cannot prove dynamic `require`, computed var resolution, JavaScript property access, or runtime-only references, so those paths require separate searches and runtime parity tests before deletion.

## Summary

| Library | Distinct public definitions | Retain and port | Macro caller migration | Test helpers | Review delete candidates |
| --- | ---: | ---: | ---: | ---: | ---: |
| `common` | 190 | 181 | 3 | 0 | 6 |
| `db` | 425 | 410 | 1 | 7 | 7 |

The inventory contains 615 distinct public definitions after CLJC deduplication.

Deletion classifications are review candidates, not authorization to delete.

Every candidate must pass an exact `rg` search, dynamic-reference review, and focused regression test before removal.

## Migration batch sizes

| Library | Batch | Definitions |
| --- | --- | ---: |
| `common` | `common-1` | 136 |
| `common` | `common-2` | 21 |
| `common` | `common-3` | 28 |
| `common` | `common-4` | 5 |
| `db` | `db-1` | 50 |
| `db` | `db-1+db-4` | 53 |
| `db` | `db-2` | 84 |
| `db` | `db-3` | 36 |
| `db` | `db-4` | 127 |
| `db` | `db-5` | 67 |
| `db` | `test-helper` | 8 |

## Consumer impact

| Library | Consumer group | Referenced definitions |
| --- | --- | ---: |
| `common` | `app` | 104 |
| `common` | `cli` | 27 |
| `common` | `common` | 93 |
| `common` | `db` | 37 |
| `common` | `db-sync` | 1 |
| `common` | `deps/common-test` | 21 |
| `common` | `deps/db-sync-test` | 1 |
| `common` | `deps/db-test` | 8 |
| `common` | `deps/graph-parser-test` | 9 |
| `common` | `deps/outliner-test` | 9 |
| `common` | `deps/publish-test` | 1 |
| `common` | `deps/publishing-test` | 1 |
| `common` | `electron` | 11 |
| `common` | `graph-parser` | 64 |
| `common` | `outliner` | 16 |
| `common` | `publish` | 4 |
| `common` | `root-test` | 24 |
| `common` | `script` | 7 |
| `db` | `app` | 184 |
| `db` | `cli` | 24 |
| `db` | `db` | 305 |
| `db` | `db-sync` | 14 |
| `db` | `deps/db-sync-test` | 10 |
| `db` | `deps/db-test` | 75 |
| `db` | `deps/graph-parser-test` | 23 |
| `db` | `deps/outliner-test` | 28 |
| `db` | `deps/publishing-test` | 3 |
| `db` | `electron` | 4 |
| `db` | `graph-parser` | 44 |
| `db` | `outliner` | 88 |
| `db` | `publish` | 5 |
| `db` | `publishing` | 5 |
| `db` | `root-test` | 88 |
| `db` | `script` | 18 |

A definition can appear in more than one consumer group, so these counts do not sum to the public-definition total.

## Namespace ownership and routing

| Library | Namespace | Public definitions | Planned batches | Consumer groups | Delete candidates |
| --- | --- | ---: | --- | --- | ---: |
| `common` | `logseq.common.authorization` | 3 | `common-3` | `common`, `db-sync`, `deps/db-sync-test`, `deps/publish-test`, `publish` | 0 |
| `common` | `logseq.common.cognito-config` | 4 | `common-1` | `app`, `cli`, `root-test` | 0 |
| `common` | `logseq.common.config` | 26 | `common-1` | `app`, `cli`, `common`, `db`, `deps/common-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `deps/publishing-test`, `electron`, `graph-parser`, `outliner`, `root-test`, `script` | 0 |
| `common` | `logseq.common.date` | 7 | `common-2` | `app`, `common`, `graph-parser`, `outliner` | 0 |
| `common` | `logseq.common.defkeywords` | 2 | `common-4` | `app`, `db` | 0 |
| `common` | `logseq.common.graph` | 8 | `common-3` | `cli`, `common`, `db`, `deps/common-test`, `deps/graph-parser-test`, `electron`, `root-test`, `script` | 0 |
| `common` | `logseq.common.graph-dir` | 8 | `common-3` | `app`, `cli`, `common`, `db`, `electron`, `root-test` | 0 |
| `common` | `logseq.common.graph-registry` | 3 | `common-3` | `app`, `common`, `electron`, `root-test` | 0 |
| `common` | `logseq.common.log` | 1 | `common-3` | `common`, `db` | 0 |
| `common` | `logseq.common.path` | 17 | `common-1` | `app`, `cli`, `common`, `db`, `deps/common-test`, `deps/graph-parser-test`, `graph-parser`, `root-test` | 1 |
| `common` | `logseq.common.plural` | 9 | `common-1` | `common`, `db` | 2 |
| `common` | `logseq.common.profile` | 3 | `common-4` | None | 2 |
| `common` | `logseq.common.util` | 48 | `common-1` | `app`, `cli`, `common`, `db`, `deps/common-test`, `deps/db-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `publish`, `root-test`, `script` | 1 |
| `common` | `logseq.common.util.block-ref` | 9 | `common-1` | `app`, `common`, `db`, `deps/graph-parser-test`, `graph-parser` | 0 |
| `common` | `logseq.common.util.date-time` | 12 | `common-2` | `app`, `cli`, `common`, `db`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `root-test`, `script` | 0 |
| `common` | `logseq.common.util.macro` | 5 | `common-1` | `app`, `common`, `db`, `graph-parser` | 0 |
| `common` | `logseq.common.util.namespace` | 5 | `common-1` | `app`, `common`, `db`, `graph-parser`, `outliner` | 0 |
| `common` | `logseq.common.util.page-ref` | 13 | `common-1` | `app`, `cli`, `common`, `db`, `deps/common-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `root-test`, `script` | 0 |
| `common` | `logseq.common.uuid` | 2 | `common-2` | `app`, `cli`, `db`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `graph-parser`, `outliner` | 0 |
| `common` | `logseq.common.version` | 5 | `common-3` | `app`, `cli`, `common`, `deps/common-test`, `root-test` | 0 |
| `db` | `logseq.db` | 96 | `db-4` | `app`, `cli`, `db`, `db-sync`, `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `deps/publishing-test`, `graph-parser`, `outliner`, `publish`, `root-test`, `script` | 4 |
| `db` | `logseq.db.common.delete-blocks` | 2 | `db-4` | `app`, `db`, `deps/db-test`, `outliner` | 0 |
| `db` | `logseq.db.common.entity-plus` | 9 | `db-3` | `app`, `db`, `deps/graph-parser-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `publishing`, `root-test` | 0 |
| `db` | `logseq.db.common.initial-data` | 14 | `db-4` | `app`, `db`, `deps/db-test`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.common.normalize` | 9 | `db-2` | `app`, `db`, `db-sync`, `deps/db-sync-test`, `root-test` | 0 |
| `db` | `logseq.db.common.order` | 8 | `db-1` | `app`, `db`, `db-sync`, `deps/db-sync-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.common.reference` | 3 | `db-3` | `app`, `db`, `root-test` | 0 |
| `db` | `logseq.db.common.sqlite` | 5 | `db-5` | `app`, `db`, `db-sync`, `electron`, `root-test` | 0 |
| `db` | `logseq.db.common.sqlite-cli` | 6 | `db-5` | `db`, `deps/db-test`, `outliner`, `script` | 0 |
| `db` | `logseq.db.common.view` | 6 | `db-3` | `app`, `db`, `deps/db-test`, `root-test` | 0 |
| `db` | `logseq.db.frontend.asset` | 3 | `db-3` | `app`, `cli`, `deps/graph-parser-test`, `graph-parser`, `script` | 0 |
| `db` | `logseq.db.frontend.block-title` | 1 | `db-3` | `app` | 0 |
| `db` | `logseq.db.frontend.class` | 17 | `db-1+db-4` | `app`, `db`, `deps/db-test`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.frontend.content` | 9 | `db-2` | `app`, `cli`, `db`, `deps/db-test`, `deps/graph-parser-test`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.frontend.db` | 15 | `db-4` | `app`, `db`, `deps/outliner-test` | 0 |
| `db` | `logseq.db.frontend.db-ident` | 6 | `db-1` | `app`, `db`, `deps/db-test`, `graph-parser`, `outliner`, `root-test` | 1 |
| `db` | `logseq.db.frontend.entity-util` | 14 | `db-3` | `app`, `cli`, `db`, `deps/db-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.frontend.inputs` | 3 | `db-2` | `app`, `db`, `deps/db-test`, `root-test` | 0 |
| `db` | `logseq.db.frontend.kv-entity` | 1 | `db-1` | `app`, `db-sync` | 0 |
| `db` | `logseq.db.frontend.malli-schema` | 51 | `db-2` | `db`, `deps/graph-parser-test`, `graph-parser`, `outliner`, `publishing` | 0 |
| `db` | `logseq.db.frontend.property` | 36 | `db-1+db-4` | `app`, `cli`, `db`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `graph-parser`, `outliner`, `publish`, `root-test` | 0 |
| `db` | `logseq.db.frontend.property.build` | 6 | `db-2` | `app`, `db`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.frontend.property.type` | 18 | `db-1` | `app`, `cli`, `db`, `deps/db-test`, `graph-parser`, `outliner`, `publish`, `script` | 0 |
| `db` | `logseq.db.frontend.rules` | 4 | `db-1` | `app`, `cli`, `db`, `deps/db-test`, `deps/graph-parser-test`, `graph-parser`, `publishing`, `root-test`, `script` | 0 |
| `db` | `logseq.db.frontend.schema` | 13 | `db-1` | `app`, `db`, `db-sync`, `deps/db-sync-test`, `deps/db-test`, `outliner`, `root-test`, `script` | 1 |
| `db` | `logseq.db.frontend.validate` | 6 | `db-2` | `app`, `db`, `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/publishing-test`, `root-test`, `script` | 0 |
| `db` | `logseq.db.sqlite.backup` | 2 | `db-5` | `db`, `electron`, `root-test` | 0 |
| `db` | `logseq.db.sqlite.build` | 21 | `db-5` | `db`, `deps/db-test`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.sqlite.create-graph` | 6 | `db-5` | `app`, `db`, `deps/db-test`, `graph-parser`, `outliner`, `root-test` | 0 |
| `db` | `logseq.db.sqlite.debug` | 2 | `db-5` | `deps/db-test` | 1 |
| `db` | `logseq.db.sqlite.export` | 11 | `db-5` | `app`, `db`, `deps/db-test`, `outliner`, `root-test`, `script` | 0 |
| `db` | `logseq.db.sqlite.gc` | 4 | `db-5` | `app`, `db`, `deps/db-test`, `root-test` | 0 |
| `db` | `logseq.db.sqlite.util` | 10 | `db-5` | `app`, `db`, `db-sync`, `electron`, `graph-parser`, `outliner`, `root-test`, `script` | 0 |
| `db` | `logseq.db.test.helper` | 8 | `test-helper` | `db`, `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `deps/publishing-test`, `root-test` | 0 |

## Non-standard dispositions

| Library | Var | Source | Disposition | Batch | Consumer groups |
| --- | --- | --- | --- | --- | --- |
| `common` | `logseq.common.defkeywords/defkeyword` | `deps/common/src/logseq/common/defkeywords.cljc:8` | `migrate-callers-then-remove` | `common-4` | `app`, `db` |
| `common` | `logseq.common.defkeywords/defkeywords` | `deps/common/src/logseq/common/defkeywords.cljc:15` | `migrate-callers-then-remove` | `common-4` | `app`, `db` |
| `common` | `logseq.common.path/file-stem` | `deps/common/src/logseq/common/path.cljs:44` | `review-delete-unused` | `common-1` | None |
| `common` | `logseq.common.plural/is-plural?` | `deps/common/src/logseq/common/plural.cljs:145` | `review-delete-unused` | `common-1` | None |
| `common` | `logseq.common.plural/is-singular?` | `deps/common/src/logseq/common/plural.cljs:146` | `review-delete-unused` | `common-1` | None |
| `common` | `logseq.common.profile/*key->call-count` | `deps/common/src/logseq/common/profile.cljs:5` | `review-delete-debug-only` | `common-4` | None |
| `common` | `logseq.common.profile/*key->time-sum` | `deps/common/src/logseq/common/profile.cljs:9` | `review-delete-debug-only` | `common-4` | None |
| `common` | `logseq.common.profile/profile-fn!` | `deps/common/src/logseq/common/profile.clj:4` | `migrate-callers-then-remove` | `common-4` | None |
| `common` | `logseq.common.util/sort-coll-by-dependency` | `deps/common/src/logseq/common/util.cljs:278` | `review-delete-unused` | `common-1` | None |
| `db` | `logseq.db/get-all-tagged-pages` | `deps/db/src/logseq/db.cljs:830` | `review-delete-unused` | `db-4` | None |
| `db` | `logseq.db/get-class-title-with-extends` | `deps/db/src/logseq/db.cljs:851` | `review-delete-unused` | `db-4` | None |
| `db` | `logseq.db/get-graph-remote-schema-version` | `deps/db/src/logseq/db.cljs:792` | `review-delete-unused` | `db-4` | None |
| `db` | `logseq.db/get-pages-relation` | `deps/db/src/logseq/db.cljs:815` | `review-delete-unused` | `db-4` | None |
| `db` | `logseq.db.frontend.db-ident/replace-db-ident-random-suffix` | `deps/db/src/logseq/db/frontend/db_ident.cljc:92` | `review-delete-unused` | `db-1` | None |
| `db` | `logseq.db.frontend.schema/major-version` | `deps/db/src/logseq/db/frontend/schema.cljs:35` | `review-delete-unused` | `db-1` | None |
| `db` | `logseq.db.sqlite.debug/find-missing-addresses` | `deps/db/src/logseq/db/sqlite/debug.cljs:7` | `review-delete-unused` | `db-5` | None |
| `db` | `logseq.db.test.helper/create-conn` | `deps/db/src/logseq/db/test/helper.cljs:74` | `keep-until-parity-replacement` | `test-helper` | `db`, `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `root-test` |
| `db` | `logseq.db.test.helper/create-conn-with-blocks` | `deps/db/src/logseq/db/test/helper.cljs:76` | `keep-until-parity-replacement` | `test-helper` | `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `deps/publishing-test`, `root-test` |
| `db` | `logseq.db.test.helper/create-conn-with-import-map` | `deps/db/src/logseq/db/test/helper.cljs:83` | `keep-until-parity-replacement` | `test-helper` | `deps/db-test` |
| `db` | `logseq.db.test.helper/find-block-by-content` | `deps/db/src/logseq/db/test/helper.cljs:9` | `keep-until-parity-replacement` | `test-helper` | `deps/db-sync-test`, `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `root-test` |
| `db` | `logseq.db.test.helper/find-journal-by-journal-day` | `deps/db/src/logseq/db/test/helper.cljs:44` | `keep-until-parity-replacement` | `test-helper` | `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `root-test` |
| `db` | `logseq.db.test.helper/find-page-by-title` | `deps/db/src/logseq/db/test/helper.cljs:33` | `keep-until-parity-replacement` | `test-helper` | `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test`, `root-test` |
| `db` | `logseq.db.test.helper/readable-properties` | `deps/db/src/logseq/db/test/helper.cljs:56` | `keep-until-parity-replacement` | `test-helper` | `deps/db-test`, `deps/graph-parser-test`, `deps/outliner-test` |
| `db` | `logseq.db.test.helper/silence-stderr` | `deps/db/src/logseq/db/test/helper.cljs:96` | `migrate-callers-then-remove` | `test-helper` | `deps/db-test`, `deps/outliner-test` |

## Dynamic-reference audit

The repository-wide dynamic-reference search found one relevant path in `deps/db/src/logseq/db/frontend/entity_util.cljs`.

That path dynamically requires `logseq.common.profile` inside a `comment` form and invokes `profile-fn!` only as an interactive profiling aid.

This supports the initial `review-delete-debug-only` classification, but deletion still requires the Common batch 4 focused checks.

No other dynamic `require`, `requiring-resolve`, `resolve`, or `find-var` reference to `logseq.common` or `logseq.db` was found by the audit pattern.

## Gate 1 status

The owner, source location, consumer namespace set, consumer group set, disposition, and migration batch are recorded for every statically discovered public definition.

Unused, debug-only, compile-time macro, and test-helper candidates are separated from runtime behavior that should be ported.

Gate 1 static inventory is complete, with dynamic and runtime verification explicitly deferred to the behavior slice that can prove each deletion or cutover.

## Legacy test ownership classification

The remaining test files under `deps/common/test` and `deps/db/test` are classified below before those directories are removed. "Split" means pure decisions stay in or move to OCaml tests while runtime-bound assertions move to the final bridge or application integration suite. No file in this table may remain under the legacy directories at cutover.

| Legacy test file | Classification | Final owner | Required disposition |
| --- | --- | --- | --- |
| `deps/common/test/logseq/common/graph_test.cljs` | JS contract and platform adapter integration | `deps/melange/test/common`, `deps/melange/test`, and bridge platform tests | Split graph policy from Node filesystem behavior, then delete the legacy test. |
| `deps/db/test/logseq/db/common/delete_blocks_test.cljs` | Domain planning plus DataScript integration | `deps/melange/test/db/delete_plan_test.ml` and bridge DB tests | Keep deletion planning in OCaml; retain only transaction/result-shape assertions at the boundary. |
| `deps/db/test/logseq/db/common/initial_data_refs_test.cljs` | Domain read decisions plus DataScript integration | `deps/melange/test/db/initial_read_test.ml` and bridge DB tests | Split reference-count decisions from opaque database access. |
| `deps/db/test/logseq/db/common/initial_data_test.cljs` | Domain read decisions plus graph construction integration | `deps/melange/test/db/initial_read_test.ml`, SQLite workflow tests, and bridge DB tests | Split pure selection from DataScript/SQLite execution. |
| `deps/db/test/logseq/db/common/view_test.cljs` | Filtering, ordering, grouping, and DataScript integration | `deps/melange/test/db/view_*_test.ml`, reference tests, and bridge DB tests | Port every pure decision to OCaml; retain only handle and value conversion assertions in CLJS. |
| `deps/db/test/logseq/db/frontend/class_test.cljs` | Class traversal decisions plus DataScript integration | `deps/melange/test/db/class_read_test.ml` and bridge DB tests | Keep traversal, deduplication, and visibility decisions in OCaml. |
| `deps/db/test/logseq/db/frontend/content_test.cljs` | Content transformation plus entity lookup integration | `deps/melange/test/db/content_test.ml` and bridge DB tests | Keep scanning and replacement policy in OCaml; retain opaque entity access at the boundary. |
| `deps/db/test/logseq/db/frontend/db_ident_test.cljc` | Pure domain behavior | `deps/melange/test/db/db_ident_test.ml` | Delete after parity is proven by OCaml tests; do not copy to the bridge. |
| `deps/db/test/logseq/db/frontend/frontend_test.cljs` | Pure frontend read decisions with entity access | `deps/melange/test/db/frontend_read_test.ml`, block-title tests, and bridge DB tests | Keep classification/title policy in OCaml and only entity conversion in CLJS. |
| `deps/db/test/logseq/db/frontend/inputs_test.cljs` | Input planning plus database lookup integration | `deps/melange/test/db/input_plan_test.ml` and bridge DB tests | Keep date/query/input branching in OCaml; adapt primitive lookups in the bridge. |
| `deps/db/test/logseq/db/frontend/property/type_test.cljs` | Property-type policy plus entity validation integration | `deps/melange/test/db/property_type_test.ml`, validation tests, and bridge DB tests | Keep type and validator decisions in OCaml; retain opaque entity checks at the boundary. |
| `deps/db/test/logseq/db/frontend/property_test.cljs` | Property catalog and ordering behavior | `deps/melange/test/db/property_*_test.ml` and bridge DB tests | Port catalog/order assertions to OCaml and keep only transaction conversion in CLJS. |
| `deps/db/test/logseq/db/frontend/reaction_test.cljs` | Validation workflow integration | `deps/melange/test/db/validation_*_test.ml` and bridge DB tests | Keep validation dispatch and rules in OCaml; exercise DataScript handles through the bridge. |
| `deps/db/test/logseq/db/frontend/rules_test.cljs` | Datalog rule contract and query integration | `deps/melange/test/db/rules_test.ml`, DB JS contract tests, and bridge DB tests | Protect rule data in OCaml/JS and retain only real DataScript query integration in CLJS. |
| `deps/db/test/logseq/db/sqlite/build_test.cljs` | Build planning plus SQLite/DataScript integration | `deps/melange/test/db/sqlite_build_test.ml`, property-build tests, and bridge DB tests | Keep build decisions and ordering in OCaml; adapt primitive DB operations at the boundary. |
| `deps/db/test/logseq/db/sqlite/create_graph_test.cljs` | Graph construction and schema workflow integration | DB catalog/schema/lifecycle OCaml tests and bridge DB tests | Keep construction sequencing in OCaml and use typed SQLite/DataScript capabilities. |
| `deps/db/test/logseq/db/sqlite/export_test.cljs` | Export/import policy and end-to-end graph integration | `deps/melange/test/db/sqlite_export_test.ml`, JS contract tests, and application integration tests | Keep deterministic policy in OCaml; retain end-to-end persisted-format coverage outside the legacy project. |
| `deps/db/test/logseq/db/sqlite/gc_test.cljs` | Primitive SQLite storage integration | bridge platform tests | Move as a controlled adapter integration test; it is not an OCaml domain test. |
| `deps/db/test/logseq/db_test.cljs` | Core reads, transaction policy, bidirectional policy, and DataScript integration | corresponding `deps/melange/test/db/*_test.ml` files and bridge DB tests | Split pure policies from real connection/transaction behavior, then delete the legacy test. |

The classification is complete for all 19 surviving legacy test files. Every listed legacy path has been removed; retained boundary and integration coverage now lives under `deps/melange/bridge/test`, `deps/melange/test`, or the root application test tree.

## Final cutover inventory

The frozen Gate 1 JSON artifacts remain unchanged as the historical migration input. The legacy `deps/common` and `deps/db` directories have been deleted, and no live manifest, task, test configuration, or source path depends on them. The former DB test helper now lives at `deps/melange/bridge/test-support/logseq/melange/bridge/db/test_helper.cljs`, and downstream test classpaths point directly at that bridge test-support root.

| Final owner | Production ownership | Verification ownership |
| --- | --- | --- |
| `deps/melange/lib/common` | All Common policy, validation, state, and effect sequencing | Pure behavior and fake-capability workflow tests under `deps/melange/test/common` |
| `deps/melange/lib/db` | All DB queries, transaction preparation, validation, view logic, SQLite workflows, and mutable workflow state | Pure behavior and fake-capability workflow tests under `deps/melange/test/db` |
| `deps/melange/js_api` | Stable root, Common, DB, Browser, Node, and graph-fs JavaScript package surfaces | Plain JavaScript, static ClojureScript, CommonJS, ESM, named-export, and clean-package resolution tests |
| `deps/melange/bridge` | Value conversion, error conversion, primitive runtime adapters, and one-hop delegation only | Bridge conversion, adapter, exception, and application-facing integration tests |
| `scripts/src/logseq/tasks/db` | Repository DB development, fixture, dump, query, export, and replay commands | Script help/fixture paths and CLI build coverage |

An exact source guard scans tracked and untracked non-ignored Clojure, ClojureScript, EDN, JavaScript, and package files. It reports zero old Common or DB namespace loads, zero direct `@logseq/melange-js-api` imports outside the bridge, zero forbidden bridge state/fallback markers, and zero live `deps/common` or `deps/db` paths. Namespaced data such as `:logseq.db.sqlite.export/graph-format` remains intentionally because it is persisted data, metadata, a schema name, or a diagnostic key rather than a namespace dependency.

The root workspace owns `@logseq/nbb-logseq`. DB scripts load through `scripts/nbb.edn`, and the Common config template is owned by `deps/melange/bridge/resources`. Common and DB CommonJS and ESM entries load self-contained, gitignored artifacts promoted by Dune into `deps/melange/js_api/dist`; Browser, Node, and graph-fs retain their authorized generated-module loading model.

## Final bridge classification

The production bridge contains 53 files and 4,359 lines. The 43 Common/DB files are classified below; the other ten files are the shared runtime plus nine primitive platform adapters.

| Group | Files | Lines | Final responsibility |
| --- | ---: | ---: | --- |
| Common bridge | 9 | 446 | Conversion and one-hop delegation |
| DB bridge | 34 | 3,209 | Capability construction, conversion, error translation, and one-hop delegation |
| Platform adapters | 9 | 508 | One primitive browser, Node.js, DataScript, SQLite, crypto, or filesystem operation per capability |
| Shared runtime | 1 | 196 | Named CLJS value, collection, sequence, callback, promise, mutable-cell, logging, and error adapters |

Every Common/DB production file has one of the following final classifications:

| Classification | Files |
| --- | --- |
| Common public conversion/delegation | `common/api.cljs`, `common/collection.cljs`, `common/regex.cljs`, `common/util.cljs` |
| Common workflow delegation | `common/authorization.cljs`, `common/graph_registry.cljs`, `common/log.cljs`, `common/uuid.cljs`, `common/version.cljs` |
| DB catalogs and value projection | `db/class_catalog.cljs`, `db/kv_entity.cljs`, `db/property_catalog.cljs`, `db/property_type.cljs`, `db/rules.cljs`, `db/schema.cljs` |
| DB read/query delegation | `db/block_title.cljs`, `db/class.cljs`, `db/content.cljs`, `db/entity.cljs`, `db/entity_plus.cljc`, `db/frontend.cljs`, `db/initial_data.cljs`, `db/inputs.cljs`, `db/property.cljs`, `db/reference.cljs`, `db/view.cljs` |
| DB mutation/workflow delegation | `db/core.cljs`, `db/delete_blocks.cljs`, `db/normalize.cljs`, `db/order.cljc`, `db/property_build.cljs`, `db/validation.cljs` |
| DB SQLite delegation | `db/sqlite.cljs`, `db/sqlite/backup.cljs`, `db/sqlite/build.cljs`, `db/sqlite/create_graph.cljs`, `db/sqlite/debug.cljs`, `db/sqlite/export.cljs`, `db/sqlite/gc.cljs`, `db/sqlite/util.cljs`, `db/sqlite_cli.cljs` |
| DB primitive-domain delegation | `db/asset.cljs`, `db/db_ident.cljc` |

The bridge does not construct domain queries, choose transaction or retry policy, validate domain values, sort/group domain results, or own domain caches. DataScript imports are confined to `platform/*`; workflow namespaces receive an explicit typed adapter and call one JavaScript API entry point. Mutable authorization caches, fractional-order state, transaction sequencing, view grouping, validation dispatch, SQLite lifecycle state, and build/export/import decisions are owned by OCaml.

## Authorized typed interfaces

The final migration uses narrowly scoped interfaces for opaque handles and primitive capabilities:

| Specification | Responsibility |
| --- | --- |
| `deps/melange/spec/cljs_runtime/value_codec.mli` | Named scalar, keyword, UUID, vector, set, map, ordered-map, sequence, lazy-sequence, mutable-cell, callback, promise, logging, and error operations |
| `deps/melange/spec/datascript/api.mli` | Opaque connection, database, entity, entity-database, datom, query, pull, transaction, listener, report, and storage operations |
| `deps/melange/spec/authorization/platform.mli` | Clock, JWT decode, JWKS fetch, Web Crypto import, byte conversion, and signature verification primitives |
| `deps/melange/spec/crypto/digest.mli` | Buffer, SHA-256, and digest-byte primitives for asset checksum workflows |
| `deps/melange/spec/db_runtime/ident.mli` | Runtime target and random-byte primitives for DB ident creation |
| `deps/melange/spec/db_worker/platform.mli` | Typed DB worker platform operations |
| `deps/melange/spec/js_api/entry_browser.mli` and `entry_node.mli` | Exact Browser and Node bridge contracts receiving runtime/platform adapters per call |

The interfaces expose named operations rather than a generic JavaScript escape hatch. DataScript and SQLite handles remain opaque, and the scalar tag path resolves an entity id through the owning DataScript entity database before reading `:db/ident`. Contract and behavior tests were added RED before the corresponding implementation.

## Final verification

| Command | Result |
| --- | --- |
| `node deps/melange/test/cljs_boundary_test.js` | PASS, 1 source-boundary test |
| `cd deps/melange && opam exec -- dune build @runtest @bundle` | PASS; 93 Common domain tests, 248 DB domain tests, 14 Common JS contract tests, 95 DB JS contract tests, 10 package-resolution tests, 55 bridge tests with 249 assertions, and platform, graph-fs, boundary, and dependency contracts |
| `pnpm melange:build-js-api` | PASS; package entries remain unchanged and Common/DB artifacts regenerate in the gitignored source dist directory |
| `pnpm cljs:test` | PASS; test artifact compiled from 1,141 files |
| `LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n frontend.worker.pipeline-test` | PASS, 19 tests with 90 assertions |
| `pnpm cljs:run-test` | Migration-owned tests PASS: 1,008 tests, 4,130 assertions, 0 failures; 16 environment errors are all the missing `better-sqlite3@12.9.0` Node 22.21.1 darwin-arm64 native binding |
| `pnpm cljs:build-electron` | PASS for app, DB worker, DB worker Node, and Electron targets |
| `pnpm cljs:release-mobile` | PASS for Mobile, DB worker, and DB worker Node release targets |
| `pnpm --dir deps/graph-parser test` | PASS, 62 tests with 707 assertions |
| `pnpm --dir deps/outliner test` | PASS, 88 tests with 314 assertions |
| `pnpm --dir deps/db-sync test` | PASS, 152 tests with 3,785 assertions |
| `pnpm --dir deps/publish test` | PASS, 33 tests with 84 assertions |
| `pnpm --dir deps/publishing test` | PASS, 7 tests with 22 assertions |
| `bb -f cli-e2e/bb.edn build` | PASS |
| `bb -f cli-e2e/bb.edn test --skip-build` | PASS, 90 cases |
| `bb dev:lint-and-test` | All lint stages PASS; the unit-test stage stops only on the same missing `better-sqlite3` native binding |

The NBB `read-string-failed` / `Unexpected EOF` diagnostic emitted by the Melange Dune suite is a known harness diagnostic with exit status zero; all registered Dune actions and assertions pass. No migration-owned failure remains in the verification matrix.
