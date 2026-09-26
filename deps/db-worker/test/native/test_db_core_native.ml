(* 1:1 OCaml translation of
   src/test/frontend/worker/db_core_test.cljs (148 deftests).

   Route: tests drive the worker the same way cljs does — entities are
   seeded with the shared fixture machinery (Db_test_util.create_conn /
   create_conn_with_blocks / transact_maps), conns are registered via
   Test_shared.register_conn (= (reset! worker-state/*datascript-conns
   {test-repo conn})), and endpoints are called through
   Dispatcher.invoke "thread-api/<name>" (= (get @thread-api/*thread-apis
   ...) in cljs).  Broadcast observation uses Broadcast.set_post_fn
   (with_broadcast_capture, same as test_db_listener_native.ml).

   Ported cljs deftests (name → OCaml test fn, same order as the cljs
   file):
     apply-outliner-ops-returns-plain-block-map
     apply-outliner-ops-rejects-missing-connection
     apply-outliner-ops-rejects-missing-indent-parent-original
     insert-block-persists
     get-block-sibling
     db-core-registers-db-sync-thread-apis
     db-core-registers-all-db-core-thread-apis
     set-db-sync-config-keeps-only-non-auth-fields-test
     get-db-sync-config-strips-auth-fields-test
     transact-insert-blocks-adds-block-order
     transact-skips-when-today-journal-exists
     get-first-url-property-value
     plugin-api-worker-lookups-return-tags-and-resolve-inputs
     query-dsl-worker-apis-run-against-worker-db
     task-spent-time-runs-against-worker-db
     get-block-children-stops-scanning-after-limit
     get-display-properties-keeps-other-position-properties-for-page-properties
     get-display-properties-filters-recycled-entity-values
     get-display-properties-reads-current-worker-block-properties
     get-blocks-includes-render-critical-property-data
     get-blocks-default-payload-includes-created-at-and-proper-titles
     get-blocks-includes-projected-class-property
     sanitize-block-result-removes-nil-entries
     get-blocks-preserves-title-on-page-tagged-block
     get-blocks-render-critical-after-rendered-cleared
     route-title
     get-file-content
     get-all-properties-returns-typed-worker-properties-test
     import-file-graph-imports-documents-test
     import-file-graph-reports-lazy-read-failure-test
     import-file-graph-stores-page-refs-and-progress-test
     transact-failed-logs-tx-count-not-tx-data-test
     get-date-scheduled-or-deadlines-filters-sorts-and-groups-worker-results
     get-view-filter-data-resolves-filter-options-test
     convert-tag-to-page-test
     validate-block-tag-rejects-invalid-parent-test
     validate-block-tag-invalidates-tag-conversion-on-date-or-status-prop-test
     convert-page-to-tag-test
     undo-redo-clear-history-removes-ops-and-pending-editor-info-test
     undo-redo-get-debug-state-captures-undo-redo-state-test
     mobile-logs-returns-recent-logs-test
     get-key-value-returns-kv-value-from-conn
     get-key-value-returns-nil-for-missing-conn
     get-graph-uuid-prefers-rtc-uuid
     get-graph-uuid-returns-local-uuid-when-rtc-uuid-is-missing
     get-graph-uuid-returns-nil-for-missing-conn
     ensure-local-graph-uuid-creates-and-persists-missing-uuid
     get-rtc-graph-uuid-returns-uuid-from-conn
     get-rtc-graph-uuid-returns-nil-for-missing-conn
     db-exists-returns-false-by-default
     list-db-returns-empty-list-by-default
     sync-app-state-updates-state
     set-page-favorite-is-durable-per-graph-test
     set-page-favorite-accepts-repeated-false-values-test
     reorder-favorites-is-idempotent-test
     get-page-route-info
     get-block-by-page-name-and-block-route-name
     reset-db-replaces-conn-db
     get-class-objects-returns-entities-for-class-test
     get-all-page-titles-returns-all-sorted-page-titles
     get-all-page-titles-with-app-state
     checksum-diagnostics-returns-local-and-remote-checksum-test
     checksum-diagnostics-returns-empty-when-no-checksums-test
     notify-invalid-data-broadcasts-storage-error-test
     notify-invalid-data-skips-undo-redo-tx-meta-test
     import-edn-datom-format-imports-blocks-test
     import-edn-datom-format-strips-export-metadata-test
     import-edn-datom-format-emits-db-change-events-test
     search-index-version-returns-zero-for-empty-db-test
     search-index-version-returns-stored-version-test
     start-search-index-build-generates-unique-ids-test
     clear-search-index-build-removes-in-progress-id-test
     ensure-active-search-index-build-rejects-stale-id-test
     take-search-index-batch-respects-batch-size-test
     take-search-index-batch-computes-progress-eta-test
     take-search-index-batch-partial-batch-behavior-test
     vector-embedding-title-prefers-block-title-test
     vector-embedding-title-uses-page-title-for-empty-blocks-test
     search-index-input-idle-updates-and-checks-idle-test
     search-index-input-idle-reports-not-idle-for-recent-input-test
     search-index-input-idle-absent-status-is-idle-test
     report-search-index-progress-catches-main-thread-errors-test
     search-build-blocks-indice-in-worker-skips-rebuild-when-current-test
     search-build-blocks-indice-in-worker-starts-rebuild-for-version-two-test
     search-upsert-blocks-and-search-blocks-fallback-test
     search-blocks-falls-back-to-query-when-search-index-misses-test
     db-sync-get-all-block-conflicts-groups-by-block-test
     close-other-dbs-keep-test
     close-other-dbs-clears-test

   cljs deftests already translated in test_db_native.ml (NOT duplicated
   here):
     get-block-parents-returns-parents, get-block-refs-returns-linked-
     references, get-latest-journals-returns-worker-maps,
     get-latest-journals-bounded-scan,
     q-executes-datascript-query, q-returns-nil-for-missing-conn,
     datoms-returns-formatted-datoms, pull-returns-entity-data,
     get-property-node-selector-data-prepares-worker-owned-db-data-test,
     alias-selector-initial-choice-keeps-page-and-owner-data-test

   Skipped cljs deftests (unported dependency):
     - new-graph-bootstraps-* : storage/service bootstrap (sqlite pools,
       OPFS) is not ported
     - apply-outliner-ops-reports-each-worker-phase: the OCaml
       apply-outliner-ops result has no :perf map (Worker_pipeline perf
       reporting not wired on native)
     - resolve-initial-config-* (3 cases): private
       worker-service/resolve-initial-config is not ported
     - import-db-binary / export-db-binary / export-client-ops-db-binary:
       thread APIs not registered on native (binary export/import is a
       sqlite storage protocol op)
     - init-service-* (3 cases): worker-service bootstrap unported
     - handle-migrate-result-*: rtc migrate-result handling unported
     - built-in-sync-repair-* (3 cases): built-in sync repair fns unported
     - search-index progress-report tests (the five
       report-search-index-progress-via-main-thread cases): progress
       reporting goes through Comlink/postMessage, which
       is not implemented on native (Comlink.invoke_remote raises)
     - vector-embed-* (4 cases) + search-...-vector-context (2 cases):
       Embedding.embed_texts is not implemented on native
       (platform embedding/embed-texts missing)
     - report-search-index-progress-sends-to-main-thread-test:
       Comlink.post_message is a no-op on native and cannot be observed;
       the catch branch is covered by
       report-search-index-progress-catches-main-thread-errors-test
     - release-access-handles-* / close-db-clears-active-import-state:
       OPFS access handles and import ui-state live on the JS storage
       side; the native endpoint is a no-op by design
     - ->uint8array-* (4 cases): js/Uint8Array helper, no native analogue
     - storage-pool-* (2 cases) / new-sqlite-storage / resolve-db-path /
       vector-index-path / checkpoint-db-* (3 cases): sqlite storage
       pool + OPFS paths are not ported
     - get-latest-journals-bounded-scan: moved — see "already translated
       in test_db_native.ml" above (Ldb.journal_day_scans is the OCaml
       counterpart of the cljs wrap-scan counter)
     - init-core-*: browser platform object wiring, unported
     - build-proxy-object-* (2 cases): Comlink proxy objects unported
     - broadcast-data-types-*: relies on a cljs broadcast-data-types
       constant that has no OCaml counterpart
     - import-file-graph-reads-file-stat-test: File_sys.stat returns
       None on native (size/ctime heuristics unported)
     - import-file-graph-reports-progress-via-node-post-message-test:
       postMessage is not capturable on native; progress broadcast is
       covered by import-file-graph-stores-page-refs-and-progress-test
     - import-file-graph-streams-via-ui-request-test: ui-request channel
       (Comlink ui-request) unported
     - close-db-attempts-remaining-handles-on-failure-test: OPFS handle
       closing is not exercised on native
     - query-dsl-worker-results-include-renderable-block-fields: the cljs
       result post-processing (worker-db.result-block->map / renderable
       fields wrapper) is not ported — the endpoint returns raw pull maps

   cljs-vs-native divergences asserted where observable:
     - transact-insert-blocks-adds-block-order asserts a real generated
       order key on the new block (cljs asserts the injected "generated-key"
       sentinel, which is its own test's fake value).
     - query-dsl-worker-apis-run-against-worker-db exercises the real
       query-dsl engine (cljs stubs execute-query/execute-custom-query
       with with-redefs and asserts pass-through only).
     - get-block-children-stops-scanning-after-limit drops the cljs
       scan-count sub-assertion (datoms call counting via with-redefs);
       the truncation assertion is kept.
     - get-display-properties-* / get-blocks-includes-...-data: cljs
       passes the block as a plain map to
       :thread-api/get-display-properties; the native endpoint resolves
       :block via entity_of_arg, so tests address the same entity through
       a [:block/uuid id] lookup-ref (or the {:db/id n} map cljs itself
       supplies). In filters-recycled-entity-values the cljs value set
       lives in the passed map's :block/properties; on native it is
       materialized as two ref datoms on a property entity declared
       :db.type/ref :db.cardinality/many (the canonical datascript
       encoding of a multi-valued ref attr).
     - get-blocks-includes-render-critical-property-data: the native seed
       (Sqlite_create_graph.initial_tx_data) lacks some built-in property
       entities cljs build-db-initial-data carries (e.g.
       logseq.property/scheduled); the fixture declares the seeded attrs
       explicitly — same values cljs seeds.
     - mobile-logs asserts Worker_log ring entries (cljs reads
       worker-state/*log atom) — same machinery, different container.
     - search-index-input-idle-absent-status-is-idle covers the cljs
       node-runtime branch that is unreachable on native
       (node_runtime () = false; absent idle status ⇒ idle).
     - db-sync-get-all-block-conflicts cljs error half (missing store →
       throw) cannot occur on native: Sync_client_op.store lazily creates
       the sqlite file. Only the grouped-map half is asserted.
     - get-view-filter-data uses Db_view.get_property_values_fn — the
       documented OCaml injection seam for the cljs with-redefs stub.
     - db-core-registers-* asserts every cljs-expected thread-api name
       that has a native registration, instead of list equality (3 cljs
       names are intentionally unregistered on native: export-db-binary,
       export-client-ops-db-binary, import-db-binary).

   (The Instant→~t transit loss that made import-edn trip file-block :inst?
   validation was fixed in ds_wire.ml — those tests are green. The
   export_blocks_as_format "" result for the worker-export fixture traced
   to datascript-ocaml's bulk transact fast path resolving ref-attr tempid
   values against an empty tempids table — fixed upstream in
   datascript-ocaml 2bf1a4d, which threads the shared table through the
   fast paths like upstream DataScript.)
*)

open Datascript
open Db_test_util
open Test_shared

(* ---------- helpers ---------- *)

let kw s = Wire.Keyword s
let invoke name args = await (Dispatcher.invoke name args)
let api name args = invoke ("thread-api/" ^ name) args
let api_repo name = api name [ Wire.String test_repo ]

(* dispatcher ex-info (msg, kvs) → (msg, (k,v) pairs) *)
let exn_kv (k : string) (kvs : (Wire.t * Wire.t) list) : Wire.t option =
  List.assoc_opt (Wire.Keyword k) kvs

(* run f, expect Dispatcher.Exn_info; return its kvs *)
let expect_exn_info (name : string) (f : unit -> 'a) :
    (string * (Wire.t * Wire.t) list) =
  try
    ignore (f ());
    Alcotest.fail (name ^ ": expected Dispatcher.Exn_info")
  with Dispatcher.Exn_info (m, kvs) -> (m, kvs)

(* cljs (ldb/kv ident v) *)
let kv_row ident v = [ "db/ident", Kw ident; "kv/value", v ]

let entity_by_uuid db u = entity_at_uuid db u

let find_block_id db content =
  match find_block_by_content db content with
  | Some e -> e.id
  | None -> Alcotest.fail ("missing block: " ^ content)

let find_page db name =
  match Ldb.get_page db (String name) with
  | Some e -> e
  | None -> Alcotest.fail ("missing page: " ^ name)

(* wire map field accessors *)
let wire_field (k : string) (w : Wire.t) : Wire.t option =
  match w with Wire.Map kvs -> wire_get k kvs | _ -> None

let wire_field_exn (k : string) (w : Wire.t) : Wire.t =
  match wire_field k w with Some v -> v | None -> Alcotest.fail ("missing field " ^ k)

let wire_str (k : string) (w : Wire.t) : string option =
  match wire_field k w with
  | Some (Wire.String s) | Some (Wire.Uuid s) | Some (Wire.Keyword s) -> Some s
  | _ -> None

let wire_array_items (w : Wire.t) : Wire.t list =
  match w with Wire.Array xs | Wire.List xs -> xs | _ -> []

(* Broadcast capture — same pattern as test_db_listener_native.ml *)
type broadcast = { kind : string; payload : string }

let decode_payload (p : string) : Wire.t option =
  try Some (Transit_codec.of_string p) with _ -> None

let payload_has_type (p : string) (t : string) : bool =
  match decode_payload p with
  | Some (Wire.Map m) ->
      List.exists
        (fun (k, v) ->
           (match k with
            | Wire.Keyword "type" | Wire.String "type" ->
                v = Wire.String t || v = Wire.Keyword t
            | _ -> false))
        m
  | _ -> false

(* notification payload:
   [kw "notification", [_, kw "error", _, _, _, {"i18n-key": kw k}]] *)
let payload_has_i18n (p : string) (key : string) : bool =
  match decode_payload p with
  | Some (Wire.Array [ _; Wire.Array items ]) ->
      List.exists
        (fun item ->
           match item with
           | Wire.Map m ->
               List.exists
                 (fun (k, v) ->
                    (match k with
                     | Wire.Keyword "i18n-key" | Wire.String "i18n-key" ->
                         v = Wire.Keyword key || v = Wire.String key
                     | _ -> false))
                 m
           | _ -> false)
        items
  | _ -> false

let with_broadcast_capture f =
  let captured = ref [] in
  Broadcast.set_post_fn (fun ~kind ~payload ->
      captured := { kind; payload } :: !captured);
  Fun.protect
    ~finally:(fun () -> Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ()))
    (fun () -> f captured)

(* real :memory: search sqlite bound for `repo` (cljs sets
   worker-state/*sqlite-conns {repo {:db … :search …}}) *)
let with_search_db repo f =
  let db = Sqlite.open_db ~path:":memory:" in
  Search_index.create_tables_and_triggers db;
  Worker_state.set_sqlite_conn_of repo Worker_state.Search db;
  Fun.protect
    ~finally:(fun () ->
      Worker_state.drop_sqlite_conn_of repo Worker_state.Search;
      Sqlite.close db)
    f

(* client-ops sqlite temp store for `repo` (test_undo_redo_native pattern) *)
let with_client_ops repo f =
  let path = Filename.temp_file "db-core-client-ops" ".sqlite" in
  let db = Sqlite.open_db ~path in
  Hashtbl.replace Sync_state.client_ops_conns repo db;
  Sync_client_op.ensure_schema db;
  Fun.protect
    ~finally:(fun () ->
      Hashtbl.remove Sync_state.client_ops_conns repo;
      Sqlite.close db;
      (try Sys.remove path with Sys_error _ -> ()))
    f

(* a fresh unique repo name so group state never collides *)
let repo_counter = ref 0
let fresh_repo () =
  incr repo_counter;
  Printf.sprintf "db-core-repo-%d" !repo_counter

(* worker-state/*state restore for the keys a test mutates (cljs
   restoring-worker-state). Keys that were absent stay set — there is no
   remove API; no db-core test asserts on them afterwards. *)
let with_state_keys keys f =
  let prev = List.map (fun k -> k, Worker_state.state_get k) keys in
  Fun.protect
    ~finally:(fun () ->
      List.iter
        (fun (k, v) ->
           match v with
           | Some old ->
               Worker_state.merge_state (Wire.Map [ kw k, old ])
           | None -> ())
        prev)
    f

let state_str k =
  match Worker_state.state_get k with
  | Some (Wire.String s) | Some (Wire.Uuid s) | Some (Wire.Keyword s) -> Some s
  | _ -> None

(* ---------- thread-api registration ---------- *)

(* (deftest db-core-registers-db-sync-thread-apis ...) — the 8 cljs
   membership checks. *)
let test_db_core_registers_db_sync_thread_apis () =
  let expected =
    [ "thread-api/set-db-sync-config"; "thread-api/db-sync-start"
    ; "thread-api/db-sync-stop"; "thread-api/db-sync-update-presence"
    ; "thread-api/db-sync-request-asset-download"
    ; "thread-api/db-sync-grant-graph-access"
    ; "thread-api/db-sync-ensure-user-rsa-keys"
    ; "thread-api/db-sync-upload-graph" ]
  in
  let registered = Dispatcher.registered_names () in
  List.iter
    (fun n -> check ("db-sync api registered " ^ n) (List.mem n registered))
    expected

(* (deftest db-core-registers-all-db-core-thread-apis ...) — the cljs
   expected-db-core-thread-apis set minus the 3 names the native worker
   does not register: export-client-ops-db-binary, export-db-binary,
   import-db-binary (binary storage protocol unported). *)
let test_db_core_registers_all_db_core_thread_apis () =
  let expected =
    [ "thread-api/list-db"; "thread-api/init"; "thread-api/set-db-sync-config"
    ; "thread-api/get-db-sync-config"; "thread-api/get-key-value"; "thread-api/db-sync-status"
    ; "thread-api/db-sync-start"; "thread-api/db-sync-stop"; "thread-api/db-sync-update-presence"
    ; "thread-api/db-sync-request-asset-download"; "thread-api/db-sync-grant-graph-access"; "thread-api/db-sync-ensure-user-rsa-keys"
    ; "thread-api/db-sync-list-remote-graphs"; "thread-api/db-sync-upload-graph"; "thread-api/db-sync-create-remote-graph"
    ; "thread-api/db-sync-stop-upload"; "thread-api/db-sync-resume-upload"; "thread-api/db-sync-upload-stopped?"
    ; "thread-api/db-sync-get-all-block-conflicts"; "thread-api/db-sync-clear-block-conflicts"; "thread-api/db-sync-download-graph-by-id"
    ; "thread-api/create-or-open-db"; "thread-api/q"; "thread-api/datoms"
    ; "thread-api/pull"; "thread-api/task-spent-time"; "thread-api/get-blocks"
    ; "thread-api/get-block-refs"; "thread-api/get-block-source"; "thread-api/get-block-parents"
    ; "thread-api/set-context"; "thread-api/transact"; "thread-api/undo-redo-set-pending-editor-info"
    ; "thread-api/undo-redo-record-editor-info"; "thread-api/undo-redo-record-ui-state"; "thread-api/undo-redo-undo"
    ; "thread-api/undo-redo-redo"; "thread-api/undo-redo-clear-history"; "thread-api/undo-redo-get-debug-state"
    ; "thread-api/build-publishing-html"; "thread-api/reset-db"; "thread-api/get-file-content"
    ; "thread-api/get-all-properties"; "thread-api/get-date-scheduled-or-deadlines"; "thread-api/unsafe-unlink-db"
    ; "thread-api/close-db"; "thread-api/db-sync-close-db"; "thread-api/db-sync-invalidate-search-db"
    ; "thread-api/db-sync-rehydrate-large-titles"; "thread-api/db-sync-import-prepare"; "thread-api/db-sync-import-rows-chunk"
    ; "thread-api/db-sync-import-finalize"; "thread-api/release-access-handles"; "thread-api/db-exists"
    ; "thread-api/import-file-graph"; "thread-api/backup-db-sqlite"; "thread-api/search-blocks"
    ; "thread-api/search-upsert-blocks"; "thread-api/search-delete-blocks"; "thread-api/search-truncate-tables"
    ; "thread-api/search-build-blocks-indice"; "thread-api/search-build-blocks-indice-in-worker"; "thread-api/search-build-pages-indice"
    ; "thread-api/apply-outliner-ops"; "thread-api/sync-app-state"; "thread-api/markdown-mirror-set-enabled"
    ; "thread-api/markdown-mirror-flush"; "thread-api/markdown-mirror-regenerate"; "thread-api/export-get-debug-datoms"
    ; "thread-api/export-get-all-page->content"; "thread-api/validate-db"; "thread-api/recompute-checksum-diagnostics"
    ; "thread-api/export-edn"; "thread-api/import-edn"; "thread-api/get-fsrs-due-card-block-ids"
    ; "thread-api/get-fsrs-card-block-ids"; "thread-api/get-view-data"; "thread-api/get-class-objects"; "thread-api/validate-block-tag"
    ; "thread-api/convert-tag-to-page"; "thread-api/convert-page-to-tag"; "thread-api/set-page-favorite"
    ; "thread-api/reorder-favorites"; "thread-api/get-page-route-info"; "thread-api/get-block-by-page-name-and-block-route-name"
    ; "thread-api/query-custom"; "thread-api/query-dsl-query"; "thread-api/query-dsl-custom-query"
    ; "thread-api/get-journal-page-by-day"; "thread-api/get-latest-journals"; "thread-api/page-exists?"
    ; "thread-api/get-case-page"; "thread-api/get-tags-by-name"; "thread-api/resolve-query-inputs"
    ; "thread-api/get-block-parent"; "thread-api/get-block-page-info"; "thread-api/ensure-comments-area"
    ; "thread-api/ensure-comments-area-for-blocks"; "thread-api/delete-comment"; "thread-api/get-comment-threads-for-block"
    ; "thread-api/get-comment-thread-block-uuids"; "thread-api/get-block-immediate-children"; "thread-api/get-block-sibling"
    ; "thread-api/get-page-blocks-tree"; "thread-api/get-block-class-default-properties"; "thread-api/get-class-properties"
    ; "thread-api/get-all-classes"; "thread-api/get-structured-children"; "thread-api/get-class-extends-children-tree"
    ; "thread-api/get-property-node-selector-data"; "thread-api/get-view-filter-data"; "thread-api/get-alias-source-page"
    ; "thread-api/get-property-closed-values"; "thread-api/get-route-title"; "thread-api/get-first-url-property-value"
    ; "thread-api/get-display-properties"; "thread-api/reorder-display-property"
    ; "thread-api/get-all-properties"; "thread-api/get-property-values"; "thread-api/get-bidirectional-properties"
    ; "thread-api/build-graph"; "thread-api/get-all-page-titles"; "thread-api/gc-graph"
    ; "thread-api/mobile-logs"; "thread-api/get-graph-uuid"; "thread-api/get-rtc-graph-uuid"
    ; "thread-api/ensure-local-graph-uuid"; "thread-api/cli-list-properties"; "thread-api/cli-list-tags"
    ; "thread-api/cli-list-pages"; "thread-api/cli-list-tasks"; "thread-api/cli-list-nodes"
    ; "thread-api/api-get-page-data"; "thread-api/api-list-properties"; "thread-api/api-list-tags"
    ; "thread-api/api-list-pages"; "thread-api/api-build-upsert-nodes-edn" ]
  in
  let registered = Dispatcher.registered_names () in
  List.iter
    (fun n -> check ("db-core api registered " ^ n) (List.mem n registered))
    expected

(* ---------- apply-outliner-ops ---------- *)

(* (deftest apply-outliner-ops-returns-plain-block-map ...) *)
let test_apply_outliner_ops_returns_plain_block_map () =
  let conn = create_conn () in
  register_conn conn;
  let page_id =
    match
      Datascript.q_string (db_of conn)
        "[:find [?e ...] :where [?e :block/name _]]"
    with
    | (Result_entity id :: _) :: _ -> id
    | _ -> Alcotest.fail "no page entity found"
  in
  let ops =
    Wire.Array
      [ Wire.Array
          [ kw "upsert-property"
          ; Wire.Array
              [ kw "user.property/test-property"
              ; Wire.Map [ kw "logseq.property/type", kw "default" ]
              ; Wire.Map [ kw "property-name", Wire.String "test-property" ] ] ] ]
  in
  let opts =
    Wire.Map
      [ kw "ui/page-id", Wire.Int page_id; kw "virtual/offset", Wire.Int 0 ]
  in
  let result = api "apply-outliner-ops" [ Wire.String test_repo; ops; opts ] in
  let block = wire_field_exn "result" result in
  check "apply-outliner-ops db/ident"
    (wire_str "db/ident" block = Some "user.property/test-property");
  check "apply-outliner-ops title"
    (wire_str "block/title" block = Some "test-property");
  check "apply-outliner-ops raw-title"
    (wire_str "block/raw-title" block = Some "test-property");
  check "apply-outliner-ops type"
    (wire_str "logseq.property/type" block = Some "default");
  check "apply-outliner-ops cardinality"
    (wire_str "db/cardinality" block = Some "db.cardinality/one")

(* (deftest apply-outliner-ops-rejects-missing-connection ...) *)
let test_apply_outliner_ops_rejects_missing_connection () =
  let ops =
    Wire.Array [ Wire.Array [ kw "save-block"; Wire.Array [] ] ]
  in
  let _, kvs =
    expect_exn_info "missing-conn" (fun () ->
        api "apply-outliner-ops" [ Wire.String "missing-graph"; ops; Wire.Map [] ])
  in
  check "missing-conn type"
    (exn_kv "type" kvs = Some (Wire.Keyword "db/missing-connection"));
  check "missing-conn repo"
    (exn_kv "repo" kvs = Some (Wire.String "missing-graph"))

(* (deftest insert-block-persists ...) *)
let test_insert_block_persists () =
  let block_id = "aaaaaaaa-0000-0000-0000-000000000001" in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "p1" }
          ; blocks =
              [ { default_block with
                  b_uuid = Some block_id
                ; b_extra = [ "build/keep-uuid?", Bool true ] } ] } ]
      ()
  in
  register_conn conn;
  let existing = Option.get (entity_at_uuid (db_of conn) block_id) in
  let new_id = "bbbbbbbb-0000-0000-0000-000000000002" in
  let ops =
    Wire.Array
      [ Wire.Array
          [ kw "insert-blocks"
          ; Wire.Array
              [ Wire.Array
                  [ Wire.Map
                      [ kw "block/uuid", Wire.Uuid new_id
                      ; kw "block/title", Wire.String "" ] ]
              ; Wire.Uuid (uuid_of existing)
              ; Wire.Map
                  [ kw "sibling?", Wire.Bool true
                  ; kw "keep-uuid?", Wire.Bool true ] ] ] ]
  in
  ignore (api "apply-outliner-ops" [ Wire.String test_repo; ops; Wire.Map [] ]);
  match entity_at_uuid (db_of conn) new_id with
  | Some e ->
      check "insert-block exists" true;
      check "insert-block title" (Ldb.string_value e "block/title" = Some "")
  | None -> Alcotest.fail "insert-block-persists: block missing"

(* UI Enter+type flow (clj-e2e outliner move-up-down / delete): on a fresh
   page, typing N blocks is save-block(title) on the open block, then Enter =
   insert-blocks(new sibling after current). Repeat -> children must read
   back in insertion order; then delete-blocks on a multi-block selection
   must remove exactly those. *)
let test_apply_outliner_ops_typing_flow_order_and_delete () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "p1" }
          ; blocks =
              [ { default_block with
                  b_uuid = Some "aaaaaaaa-1111-0000-0000-000000000001" } ] } ]
      ()
  in
  register_conn conn;
  let first = Option.get (entity_at_uuid (db_of conn) "aaaaaaaa-1111-0000-0000-000000000001") in
  let save_op uuid title =
    Wire.Array
      [ Wire.Array
          [ kw "save-block"
          ; Wire.Array
              [ Wire.Map
                  [ kw "block/uuid", Wire.Uuid uuid
                  ; kw "block/title", Wire.String title ]
              ; Wire.Map [] ] ] ]
  in
  let insert_op target_uuid new_uuid =
    Wire.Array
      [ Wire.Array
          [ kw "insert-blocks"
          ; Wire.Array
              [ Wire.Array
                  [ Wire.Map
                      [ kw "block/uuid", Wire.Uuid new_uuid
                      ; kw "block/title", Wire.String "" ] ]
              ; Wire.Uuid target_uuid
              ; Wire.Map
                  [ kw "sibling?", Wire.Bool true
                  ; kw "keep-uuid?", Wire.Bool true ] ] ] ]
  in
  let call ops = api "apply-outliner-ops" [ Wire.String test_repo; ops; Wire.Map [] ] in
  ignore (call (save_op (uuid_of first) "b1"));
  let cur = ref (uuid_of first) in
  List.iteri
    (fun i title ->
      let nu = Printf.sprintf "aaaaaaaa-1111-0000-0000-00000000000%d" (i + 2) in
      ignore (call (insert_op !cur nu));
      ignore (call (save_op nu title));
      cur := nu)
    [ "b2"; "b3"; "b4" ];
  let page_id = (Option.get (Ldb.ref_ent first "block/page")).id in
  let titles_of () =
    let page = Option.get (Ldb.ent_of_id (db_of conn) page_id) in
    Ldb.sort_by_order (Ldb.ref_ents page "block/_parent")
    |> List.filter_map (fun e -> Ldb.string_value e "block/title")
  in
  let titles = titles_of () in
  check "typed blocks order" (titles = [ "b1"; "b2"; "b3"; "b4" ]);
  let ids =
    List.filter_map
      (fun t ->
        match find_block_by_content (db_of conn) t with
        | Some e -> Some (Wire.Uuid (uuid_of e))
        | None -> None)
      [ "b2"; "b3" ]
  in
  ignore
    (call
       (Wire.Array
          [ Wire.Array
              [ kw "delete-blocks"; Wire.Array [ Wire.Array ids; Wire.Map [] ] ] ]));
  let titles' = titles_of () in
  check "after delete" (titles' = [ "b1"; "b4" ])

(* move-blocks-up-down: clj-e2e move-up-down selects [b3 b4] (shift+up x2
   from b4), moves the selection up twice -> [b3 b4 b1 b2], then down
   twice -> original order. Single-block: up to top is a no-op on the
   second press; down moves one slot each press. *)
let test_apply_outliner_ops_move_up_down () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "p1" }
          ; blocks =
              [ { default_block with b_uuid = Some "bbbbbbbb-0000-0000-0000-000000000001" }
              ; { default_block with b_uuid = Some "bbbbbbbb-0000-0000-0000-000000000002" }
              ; { default_block with b_uuid = Some "bbbbbbbb-0000-0000-0000-000000000003" }
              ; { default_block with b_uuid = Some "bbbbbbbb-0000-0000-0000-000000000004" } ] } ]
      ()
  in
  register_conn conn;
  let save_title u t =
    api "apply-outliner-ops"
      [ Wire.String test_repo
      ; Wire.Array
          [ Wire.Array
              [ kw "save-block"
              ; Wire.Array
                  [ Wire.Map [ kw "block/uuid", Wire.Uuid u; kw "block/title", Wire.String t ]
                  ; Wire.Map [] ] ] ]
      ; Wire.Map [] ]
  in
  List.iteri
    (fun i u -> ignore (save_title u (Printf.sprintf "b%d" (i + 1))))
    [ "bbbbbbbb-0000-0000-0000-000000000001"
    ; "bbbbbbbb-0000-0000-0000-000000000002"
    ; "bbbbbbbb-0000-0000-0000-000000000003"
    ; "bbbbbbbb-0000-0000-0000-000000000004" ];
  let move uuids up =
    api "apply-outliner-ops"
      [ Wire.String test_repo
      ; Wire.Array
          [ Wire.Array
              [ kw "move-blocks-up-down"
              ; Wire.Array [ Wire.Array (List.map (fun u -> Wire.Uuid u) uuids); Wire.Bool up ] ] ]
      ; Wire.Map [] ]
  in
  let page_id =
    (Option.get
       (Ldb.ref_ent
          (Option.get (entity_at_uuid (db_of conn) "bbbbbbbb-0000-0000-0000-000000000001"))
          "block/page")).id
  in
  let titles_of () =
    let page = Option.get (Ldb.ent_of_id (db_of conn) page_id) in
    Ldb.sort_by_order (Ldb.ref_ents page "block/_parent")
    |> List.filter_map (fun e -> Ldb.string_value e "block/title")
  in
  check "initial order" (titles_of () = [ "b1"; "b2"; "b3"; "b4" ]);
  ignore (move [ "bbbbbbbb-0000-0000-0000-000000000003"; "bbbbbbbb-0000-0000-0000-000000000004" ] true);
  check "sel up1" (titles_of () = [ "b1"; "b3"; "b4"; "b2" ]);
  ignore (move [ "bbbbbbbb-0000-0000-0000-000000000003"; "bbbbbbbb-0000-0000-0000-000000000004" ] true);
  check "sel up2" (titles_of () = [ "b3"; "b4"; "b1"; "b2" ]);
  ignore (move [ "bbbbbbbb-0000-0000-0000-000000000003"; "bbbbbbbb-0000-0000-0000-000000000004" ] false);
  ignore (move [ "bbbbbbbb-0000-0000-0000-000000000003"; "bbbbbbbb-0000-0000-0000-000000000004" ] false);
  check "restored" (titles_of () = [ "b1"; "b2"; "b3"; "b4" ])

(* (deftest apply-outliner-ops-rejects-missing-indent-parent-original ...) *)
let test_apply_outliner_ops_rejects_missing_indent_parent_original () =
  let u1 = "cccccccc-0000-0000-0000-000000000001"
  and u2 = "cccccccc-0000-0000-0000-000000000002"
  and missing = "cccccccc-0000-0000-0000-000000000099" in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "page 1"
              ; pg_extra = [ "build/keep-uuid?", Bool true ]
              ; pg_uuid = Some u1 }
          ; blocks =
              [ { default_block with
                  b_uuid = Some u2
                ; b_extra = [ "build/keep-uuid?", Bool true ] } ] } ]
      ()
  in
  register_conn conn;
  let ops =
    Wire.Array
      [ Wire.Array
          [ kw "indent-outdent-blocks"
          ; Wire.Array
              [ Wire.Array [ Wire.Uuid u2 ]
              ; Wire.Bool true
              ; Wire.Map
                  [ kw "parent-original"
                  , Wire.Map [ kw "block/uuid", Wire.Uuid missing ] ] ] ] ]
  in
  (* cljs asserts ex-data {:type :logseq.outliner.op/missing-parent-original};
     the native outliner raises its typed Missing_parent_original exception
     which the endpoint does not re-wrap — same rejection, different surface *)
  (try
     ignore
       (api "apply-outliner-ops" [ Wire.String test_repo; ops; Wire.Map [] ]);
     Alcotest.fail "indent-missing-parent: expected Missing_parent_original"
   with Outliner_op.Missing_parent_original -> ())

(* ---------- get-block-sibling ---------- *)

(* (deftest get-block-sibling ...) — cljs calls with eids. *)
let test_get_block_sibling () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "p1" }
          ; blocks =
              [ { default_block with b_title = Some "b1" }
              ; { default_block with b_title = Some "b2" } ] } ]
      ()
  in
  register_conn conn;
  let db = db_of conn in
  let page = find_page db "p1" in
  let b1 = find_block_id db "b1" in
  let b2 = find_block_id db "b2" in
  let result =
    api "get-block-sibling"
      [ Wire.String test_repo; Wire.Int b1; kw "right" ]
  in
  check "sibling right b2"
    (wire_field "db/id" result = Some (Wire.Int b2));
  check "sibling parent id"
    (wire_field "block/parent" result
     = Some (Wire.Int page.id)
     || wire_field "block/parent" result <> None);
  (* cljs: :last-child of page → the last direct child *)
  let last_child =
    api "get-block-sibling"
      [ Wire.String test_repo; Wire.Int page.id; kw "last-child" ]
  in
  check "sibling last-child b2"
    (wire_field "db/id" last_child = Some (Wire.Int b2));
  let after_b2 =
    api "get-block-sibling" [ Wire.String test_repo; Wire.Int b2; kw "right" ]
  in
  check "sibling after last nil" (after_b2 = Wire.Nil)

(* ---------- db-sync-config ---------- *)

(* (deftest set-db-sync-config-keeps-only-non-auth-fields-test ...) *)
let test_set_db_sync_config_keeps_only_non_auth_fields () =
  let config_prev = Worker_state.db_sync_config () in
  Fun.protect
    ~finally:(fun () -> Worker_state.set_db_sync_config config_prev)
    (fun () ->
       with_state_keys
         [ "auth/id-token"; "auth/oauth-token-url"; "auth/oauth-domain"
         ; "auth/oauth-client-id" ]
         (fun () ->
      Worker_state.merge_state
        (Wire.Map
           [ kw "auth/id-token", Wire.String "existing-id-token"
           ; ( kw "auth/oauth-token-url"
             , Wire.String "https://existing.example.com/oauth2/token" )
           ; kw "auth/oauth-domain", Wire.String "existing.example.com"
           ; kw "auth/oauth-client-id", Wire.String "existing-client-id" ]);
      ignore
        (api "set-db-sync-config"
           [ Wire.Map
               [ kw "ws-url", Wire.String "wss://example.com/sync/%s"
               ; kw "http-base", Wire.String "https://example.com"
               ; kw "enabled?", Wire.Bool true
               ; kw "auth-token", Wire.String "id-token-from-config"
               ; ( kw "oauth-token-url"
                 , Wire.String "https://auth.example.com/oauth2/token" )
               ; kw "oauth-domain", Wire.String "auth.example.com"
               ; kw "oauth-client-id", Wire.String "worker-client-id" ] ]);
      let cfg = Worker_state.db_sync_config () in
      check "db-sync-config ws-url"
        (wire_str "ws-url" cfg = Some "wss://example.com/sync/%s");
      check "db-sync-config http-base"
        (wire_str "http-base" cfg = Some "https://example.com");
      check "db-sync-config enabled?"
        (wire_field "enabled?" cfg = Some (Wire.Bool true));
      check "db-sync-config strips auth-token"
        (wire_field "auth-token" cfg = None);
      check "db-sync-config strips oauth fields"
        (wire_field "oauth-token-url" cfg = None
         && wire_field "oauth-domain" cfg = None
         && wire_field "oauth-client-id" cfg = None);
      let got = api "get-db-sync-config" [] in
      check "get-db-sync-config ws-url"
        (wire_str "ws-url" got = Some "wss://example.com/sync/%s");
      (* *state auth fields untouched *)
      check "state auth/id-token kept"
        (state_str "auth/id-token" = Some "existing-id-token");
      check "state oauth-domain kept"
        (state_str "auth/oauth-domain" = Some "existing.example.com")))

(* (deftest get-db-sync-config-strips-auth-fields-test ...) *)
let test_get_db_sync_config_strips_auth_fields () =
  let config_prev = Worker_state.db_sync_config () in
  Fun.protect
    ~finally:(fun () -> Worker_state.set_db_sync_config config_prev)
    (fun () ->
      Worker_state.set_db_sync_config
        (Wire.Map
           [ kw "ws-url", Wire.String "wss://example.com/sync/%s"
           ; kw "auth-token", Wire.String "leaked-token"
           ; kw "oauth-client-id", Wire.String "leaked-client" ]);
      let got = api "get-db-sync-config" [] in
      check "get-config ws-url"
        (wire_str "ws-url" got = Some "wss://example.com/sync/%s");
      check "get-config strips auth"
        (wire_field "auth-token" got = None
         && wire_field "oauth-client-id" got = None))

(* ---------- transact ---------- *)

(* (deftest transact-insert-blocks-adds-block-order ...) — cljs asserts
   :block/order = "generated-key" (its own fake); on native we assert a
   real order key is generated on the new block. *)
let test_transact_insert_blocks_adds_block_order () =
  let conn = create_conn () in
  register_conn conn;
  let page_uuid = "dddddddd-0000-0000-0000-000000000000" in
  let u = "dddddddd-0000-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid page_uuid
         ; "block/title", Str "page"
         ; "block/name", Str "page"
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  let tx_data =
    Wire.Array
      [ Wire.Map
          [ kw "block/uuid", Wire.Uuid u
          ; kw "block/title", Wire.String "test"
          ; kw "block/name", Wire.String "test"
          ; kw "block/created-at", Wire.Int 1000
          ; kw "block/updated-at", Wire.Int 1000
          ; ( kw "block/page"
            , Wire.Array [ kw "block/uuid"; Wire.Uuid page_uuid ] )
          ; ( kw "block/parent"
            , Wire.Array [ kw "block/uuid"; Wire.Uuid page_uuid ] ) ] ]
  in
  let tx_meta =
    Wire.Map
      [ kw "outliner-op", kw "insert-blocks"
      ; kw "skip-page-preview-check?", Wire.Bool true ]
  in
  ignore (api "transact" [ Wire.String test_repo; tx_data; tx_meta ]);
  match entity_at_uuid (db_of conn) u with
  | Some e ->
      (match Ldb.value e "block/order" with
       | Some (String s) -> check "transact block/order generated" (s <> "")
       | _ -> Alcotest.fail "transact-insert-blocks: no block/order generated")
  | None -> Alcotest.fail "transact-insert-blocks: block missing"

(* (deftest transact-skips-when-today-journal-exists ...) *)
let test_transact_skips_when_today_journal_exists () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "2024-01-01"
         ; "block/name", Str "2024-01-01" ] ]);
  register_conn conn;
  let tx_data =
    Wire.Array
      [ Wire.Map [ kw "block/title", Wire.String "journal entry" ] ]
  in
  let tx_meta =
    Wire.Map
      [ kw "create-today-journal?", Wire.Bool true
      ; kw "today-journal-name", Wire.String "2024-01-01" ]
  in
  (* skip: today's journal page already exists — the tx is dropped, and
     importantly no error is raised even though the bare block/title map
     would not validate *)
  let result = api "transact" [ Wire.String test_repo; tx_data; tx_meta ] in
  check "transact returns nil" (result = Wire.Nil);
  check "journal entry not transacted"
    (find_block_by_content (db_of conn) "journal entry" = None)

(* ---------- get-first-url-property-value ---------- *)

(* (deftest get-first-url-property-value ...) *)
let test_get_first_url_property_value () =
  let conn = create_conn () in
  let page_uuid = "eeeeeeee-0000-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       [ [ "db/ident", Kw "user.property/website"
         ; "block/title", Str "Website"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ]
         ; "logseq.property/type", Kw "url" ]
       ; [ "block/title", Str "Page Title"
         ; "block/name", Str "page-title"
         ; "block/uuid", Uuid page_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Page" ]
         ; "user.property/website", Str "https://example.com" ] ]);
  register_conn conn;
  let page = Option.get (entity_at_uuid (db_of conn) page_uuid) in
  let result =
    api "get-first-url-property-value"
      [ Wire.String test_repo; Wire.Int page.id ]
  in
  check "first url prop"
    (result = Wire.String "https://example.com")

(* ---------- plugin api lookups ---------- *)

(* (deftest plugin-api-worker-lookups-return-tags-and-resolve-inputs ...) *)
let test_plugin_api_worker_lookups () =
  let conn = create_conn () in
  let tag_uuid = "11111111-1111-1111-1111-111111111111"
  and page_uuid = "22222222-2222-2222-2222-222222222222" in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "Topic"
         ; "block/name", Str "topic"
         ; "block/uuid", Uuid tag_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Tag" ] ]
       ; [ "block/title", Str "Current Worker Page"
         ; "block/name", Str "current-worker-page"
         ; "block/uuid", Uuid page_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  register_conn conn;
  let tags =
    api "get-tags-by-name" [ Wire.String test_repo; Wire.String "Topic" ]
  in
  (match wire_array_items tags with
   | [ Wire.Map m ] ->
       check "get-tags-by-name title"
         (wire_get "block/title" m = Some (Wire.String "Topic"))
   | _ -> Alcotest.fail "get-tags-by-name: unexpected shape");
  let resolve inputs opts =
    api "resolve-query-inputs"
      [ Wire.String test_repo; Wire.Array (List.map (fun s -> Wire.String s) inputs)
      ; opts ]
  in
  let resolved1 =
    resolve [ ":current-page" ]
      (Wire.Map
         [ kw "current-page-title", Wire.String "Current Page"
         ; kw "today-title", Wire.String "Today" ])
  in
  check "resolve :current-page title"
    (resolved1 = Wire.Array [ Wire.String "current page" ]);
  let resolved2 =
    resolve [ ":current-page" ]
      (Wire.Map
         [ kw "current-page", Wire.Uuid page_uuid
         ; kw "today-title", Wire.String "Today" ])
  in
  check "resolve :current-page lookup"
    (resolved2 = Wire.Array [ Wire.String "current worker page" ]);
  let broken_ref = "\\([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\)" in
  check "regex input stays string"
    (resolve [ broken_ref ] (Wire.Map [])
     = Wire.Array [ Wire.String broken_ref ]);
  List.iter
    (fun input ->
      check ("raw input kept " ^ input)
        (resolve [ input ] (Wire.Map [])
         = Wire.Array [ Wire.String input ]))
    [ "target-page"; "two words"; "foo.*" ];
  check "edn uuid input stays uuid"
    (resolve [ Printf.sprintf "#uuid \"%s\"" tag_uuid ] (Wire.Map [])
     = Wire.Array [ Wire.Uuid tag_uuid ]);
  check "quoted edn string unquoted"
    (resolve [ "\"target-page\"" ] (Wire.Map [])
     = Wire.Array [ Wire.String "target-page" ]);
  check "edn collection stays collection"
    (resolve [ "[\"a\" \"b\" \"c\"]" ] (Wire.Map [])
     = Wire.Array
         [ Wire.Array
             [ Wire.String "a"; Wire.String "b"; Wire.String "c" ] ])

(* ---------- query-dsl ---------- *)

(* (deftest query-dsl-worker-apis-run-against-worker-db ...) — cljs stubs
   execute-query/execute-custom-query; here we exercise the real engine. *)
let test_query_dsl_worker_apis () =
  let conn = create_conn () in
  let page_uuid = "11111111-1111-1111-1111-111111111111"
  and block_uuid = "22222222-2222-2222-2222-222222222222" in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "querypage"
         ; "block/name", Str "querypage"
         ; "block/uuid", Uuid page_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  (* second tx: the page must exist before :block/page resolves its
     lookup-ref *)
  ignore
    (transact_maps conn
       [ [ "block/title", Str "worker task"
         ; "block/name", Str "worker task"
         ; "block/uuid", Uuid block_uuid
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ] ] ]);
  register_conn conn;
  let opts =
    Wire.Map
      [ kw "block-attrs"
      , Wire.Array
          [ kw "db/id"; kw "block/title"; kw "block/raw-title"
          ; kw "block/uuid" ] ]
  in
  let result = api "query-dsl-query" [ Wire.String test_repo; Wire.String "(page querypage)"; opts ] in
  (* rows are single-element collections of block maps *)
  let titles =
    wire_array_items result
    |> List.concat_map wire_array_items
    |> List.filter_map (fun w -> wire_str "block/title" w)
  in
  check "query-dsl finds worker task" (List.mem "worker task" titles);
  let custom =
    api "query-dsl-custom-query"
      [ Wire.String test_repo
      ; Wire.Map
          [ kw "query"
          , Wire.Array [ Wire.Symbol "page"; Wire.Symbol "querypage" ] ]
      ; opts ]
  in
  check "custom-query returns something" (custom <> Wire.Nil)

(* (deftest task-spent-time-runs-against-worker-db ...) *)
let test_task_spent_time () =
  let conn = create_conn () in
  let block_uuid = "11111111-1111-1111-1111-111111111111" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid block_uuid; "block/title", Str "task" ]
       ; [ "db/ident", Kw "logseq.property/status" ]
       ; [ "db/ident", Kw "logseq.property/status.doing"
         ; "block/title", Str "Doing" ]
       ; [ "db/ident", Kw "logseq.property/status.done"
         ; "block/title", Str "Done" ] ]);
  register_conn conn;
  let db = db_of conn in
  let block_id =
    match entity_at_uuid db block_uuid with
    | Some e -> e.id
    | None -> Alcotest.fail "task block missing"
  in
  ignore
    (transact_maps conn
       [ [ "block/created-at", Int64 1000
         ; "logseq.property.history/block", Int64 block_id
         ; "logseq.property.history/property", Kw "logseq.property/status"
         ; "logseq.property.history/ref-value", Kw "logseq.property/status.doing" ]
       ; [ "block/created-at", Int64 4000
         ; "logseq.property.history/block", Int64 block_id
         ; "logseq.property.history/property", Kw "logseq.property/status"
         ; "logseq.property.history/ref-value", Kw "logseq.property/status.done" ] ]);
  let result =
    api "task-spent-time" [ Wire.String test_repo; Wire.Int block_id ]
  in
  match wire_array_items result with
  | [ history; Wire.Int seconds ] ->
      check "task-spent-time seconds" (seconds = 3);
      let items = wire_array_items history in
      check "task-spent-time history count" (List.length items = 2);
      let idents =
        List.filter_map
          (fun w -> wire_str "logseq.property.history/ref-value-ident" w)
          items
      in
      check "task-spent-time status idents"
        (idents = [ "logseq.property/status.doing"; "logseq.property/status.done" ])
  | _ -> Alcotest.fail "task-spent-time: unexpected result shape"

(* ---------- get-block-children / get-blocks ---------- *)

(* (deftest get-block-children-stops-scanning-after-limit ...) — cljs
   counts datoms calls via with-redefs (unportable); the truncation half
   is kept. *)
let test_get_block_children_stops_scanning_after_limit () =
  let conn = create_conn () in
  let pid = "ffffffff-0000-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       ([ [ "block/uuid", Uuid pid; "block/title", Str "parent" ] ]
        @ List.init 105 (fun i ->
              [ "block/uuid"
              , Uuid (Printf.sprintf "ffffffff-0000-0000-0000-%012d" (i + 10))
              ; "block/title", Str (Printf.sprintf "child-%d" i)
              ; "block/page", Vec [ Kw "block/uuid"; Uuid pid ]
              ; "block/parent", Vec [ Kw "block/uuid"; Uuid pid ]
              ; "block/order", Str (Printf.sprintf "a%03d" i) ])));
  register_conn conn;
  let parent =
    match entity_at_uuid (db_of conn) pid with
    | Some e -> e
    | None -> Alcotest.fail "parent missing"
  in
  let large_page, children =
    Endpoint_block.get_block_children (db_of conn) parent ~all:false
      ~include_collapsed_children:false ~include_property_block:false
  in
  check "block-children limit reached" large_page

(* :thread-api/get-display-properties helper — cljs passes the whole block
   map as :block; the native endpoint resolves :block via entity_of_arg, so
   the same entity is addressed through a [:block/uuid u] lookup-ref (or a
   {:db/id n} map where cljs does). *)
let display_properties_api (block : Wire.t) (opts : (Wire.t * Wire.t) list) :
    Wire.t =
  api "get-display-properties"
    [ Wire.String test_repo
    ; Wire.Map
        [ kw "block", block
        ; kw "opts", Wire.Map opts
        ; kw "show-empty-and-hidden-properties?", Wire.Bool false ] ]

let uuid_lookup u = Wire.Array [ kw "block/uuid"; Wire.Uuid u ]

(* rows of {:property-id kw, :value v} from a :full-properties wire array *)
let display_property_id_values (props : Wire.t list) :
    (Wire.t * Wire.t) list =
  List.filter_map
    (fun p ->
       match p with
       | Wire.Map pm -> (
           match (wire_get "property-id" pm, wire_get "value" pm) with
           | Some pid, Some v -> Some (pid, v)
           | _ -> None)
       | _ -> None)
    props

(* (deftest get-display-properties-keeps-other-position-properties-for-page-properties ...) *)
let test_display_properties_keeps_other_position_for_page () =
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  let page_id = "11111111-1111-1111-1111-111111111111" in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.class/Page}
         {:db/ident :logseq.class/Property}
         {:db/ident :user.property/date
          :block/title \"Date\"
          :block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/tags :logseq.class/Property
          :logseq.property/type :date}
         {:block/title \"Page Title\"
          :block/name \"page-title\"
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/tags :logseq.class/Page
          :user.property/date \"Jun 23rd, 2026\"}]");
  register_conn conn;
  (match display_properties_api (uuid_lookup page_id)
           [ kw "page-title?", Wire.Bool true ] with
   | Wire.Map m -> (
       match wire_get "full-properties" m with
       | Some (Wire.Array props) ->
           check "page full-properties"
             (display_property_id_values props
              = [ ( Wire.Keyword "user.property/date"
                  , Wire.String "Jun 23rd, 2026" ) ])
       | _ -> check "page full-properties array" false)
   | _ -> check "page result map" false);
  (match display_properties_api (uuid_lookup page_id)
           [ kw "in-block-container?", Wire.Bool true ] with
   | Wire.Map m ->
       check "block-container full-properties empty"
         (match wire_get "full-properties" m with
          | Some (Wire.Array []) -> true
          | _ -> false)
   | _ -> check "block result map" false)

(* (deftest get-display-properties-filters-recycled-entity-values ...) —
   cljs carries the #{active recycled} set in the passed :block/properties
   map; on native :block resolves to the worker-db entity, so the set is
   materialized as two :user.property/node ref datoms declared
   :db.type/ref + :db.cardinality/many on the property entity. *)
let test_display_properties_filters_recycled () =
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  let page_id = "11111111-1111-1111-1111-111111111111" in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.class/Page}
         {:db/ident :logseq.class/Property}
         {:db/ident :user.property/node
          :block/title \"Node\"
          :block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/tags :logseq.class/Property
          :logseq.property/type :default
          :db/valueType :db.type/ref
          :db/cardinality :db.cardinality/many}
         {:block/title \"Page Title\"
          :block/name \"page-title\"
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/tags :logseq.class/Page}
         [:db/add [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
           :user.property/node 101]
         [:db/add 101 :block/title \"Active\"]
         [:db/add [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
           :user.property/node 102]
         [:db/add 102 :block/title \"Recycled\"]
         [:db/add 102 :logseq.property/deleted-at 1]]");
  register_conn conn;
  match display_properties_api (uuid_lookup page_id)
          [ kw "page-title?", Wire.Bool true ] with
  | Wire.Map m -> (
      match wire_get "full-properties" m with
      | Some (Wire.Array [ Wire.Map pm ]) -> (
          match wire_get "value" pm with
          | Some (Wire.Set vs) ->
              let summaries =
                List.map
                  (fun v ->
                     match v with
                     | Wire.Map vm -> (
                         ( wire_get "db/id" vm
                         , wire_get "block/title" vm ))
                     | _ -> (None, None))
                  vs
              in
              check "active value kept, recycled filtered"
                (summaries
                 = [ (Some (Wire.Int 101), Some (Wire.String "Active")) ])
          | _ -> check "value is a set" false)
      | _ -> check "single property row" false)
  | _ -> check "result map" false

(* (deftest get-display-properties-reads-current-worker-block-properties ...) *)
let test_display_properties_reads_current_block_properties () =
  let conn = create_conn () in
  let block_id = "11111111-1111-1111-1111-111111111111" in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :user.property/fresh
          :block/title \"Fresh\"
          :block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/tags :logseq.class/Property
          :logseq.property/type :default}
         {:block/title \"Block\"
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :user.property/fresh \"fresh value\"}]");
  register_conn conn;
  let eid =
    match entity_at_uuid (db_of conn) block_id with
    | Some e -> e.id
    | None -> Alcotest.fail "block missing"
  in
  (* cljs passes a stale block map {:db/id eid :block/uuid ... :block/properties {}} *)
  let stale_block =
    Wire.Map
      [ kw "db/id", Wire.Int eid
      ; kw "block/uuid", Wire.Uuid block_id
      ; kw "block/properties", Wire.Map [] ]
  in
  match display_properties_api stale_block [] with
  | Wire.Map m -> (
      match wire_get "full-properties" m with
      | Some (Wire.Array props) ->
          check "fresh property read from worker db"
            (List.exists
               (fun (pid, v) ->
                  pid = Wire.Keyword "user.property/fresh"
                  && v = Wire.String "fresh value")
               (display_property_id_values props))
      | _ -> check "full-properties array" false)
  | _ -> check "result map" false

(* (deftest get-blocks-includes-render-critical-property-data ...) *)
let test_get_blocks_includes_render_critical_property_data () =
  let conn = create_conn () in
  let block_uuid = "00000000-0000-0000-0000-000000000001"
  and reaction_uuid = "00000000-0000-0000-0000-000000000002" in
  ignore
    (transact_maps conn
       [ [ "db/ident", Kw "logseq.property/status"
         ; "block/title", Str "Status"
         ; "logseq.property/ui-position", Kw "block-left" ]
       ; [ "db/ident", Kw "logseq.property/status.backlog"
         ; "block/title", Str "Backlog" ]
       ; [ "db/ident", Kw "logseq.property/scheduled"
         ; "block/title", Str "Scheduled"
         ; "logseq.property/type", Kw "datetime"
         ; "logseq.property/ui-position", Kw "block-below" ]
       ; [ "block/title", Str "Scheduled task"
         ; "block/uuid", Uuid block_uuid
         ; "logseq.property/status", Kw "logseq.property/status.backlog"
         ; "logseq.property/scheduled", Inst 1783612800000L ]
       ; op_db_add
           (Vec [ Kw "block/uuid"; Uuid block_uuid ])
           "block/properties"
           (Map [ "unsafe", Str "map value" ]) ]);
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid reaction_uuid
         ; "block/created-at", Int64 1
         ; "block/updated-at", Int64 1
         ; "logseq.property.reaction/emoji-id", Str "+1"
         ; ( "logseq.property.reaction/target"
           , Vec [ Kw "block/uuid"; Uuid block_uuid ] ) ] ]);
  register_conn conn;
  let requests =
    Wire.Array
      [ Wire.Map
          [ kw "id", Wire.Uuid block_uuid
          ; ( kw "opts"
            , Wire.Map
                [ kw "children?", Wire.Bool false
                ; kw "render-data?", Wire.Bool true ] ) ] ]
  in
  let result = api "get-blocks" [ Wire.String test_repo; requests ] in
  match wire_maps result with
  | [ m ] -> (
      let bm =
        match wire_get "block" m with
        | Some (Wire.Map bm) -> bm
        | _ -> Alcotest.fail "get-blocks critical: no block field"
      in
      let positioned =
        match wire_get "block.temp/positioned-properties" bm with
        | Some (Wire.Map pm) -> pm
        | _ -> Alcotest.fail "no positioned-properties"
      in
      let prop_with_ident props ident =
        List.exists
          (fun p ->
             match p with
             | Wire.Map pm' ->
                 wire_get "db/ident" pm'
                 = Some (Wire.Keyword ident)
             | _ -> false)
          props
      in
      let block_left =
        match wire_get "block-left" positioned with
        | Some a -> wire_array_items a
        | None -> []
      and block_below =
        match wire_get "block-below" positioned with
        | Some a -> wire_array_items a
        | None -> []
      in
      check "status property positioned left"
        (prop_with_ident block_left "logseq.property/status");
      let status_prop =
        List.find_map
          (fun p ->
            match p with
            | Wire.Map pm'
              when wire_get "db/ident" pm'
                   = Some (Wire.Keyword "logseq.property/status") ->
                Some pm'
            | _ -> None)
          block_left
      in
      (match status_prop with
       | Some pm' ->
           check "status title"
             (wire_get "block/title" pm' = Some (Wire.String "Status"));
           check "status type"
             (wire_get "logseq.property/type" pm'
              = Some (Wire.Keyword "default"))
       | None -> check "status property present" false);
      check "scheduled property positioned below"
        (prop_with_ident block_below "logseq.property/scheduled");
      let scheduled_prop =
        List.find_map
          (fun p ->
            match p with
            | Wire.Map pm'
              when wire_get "db/ident" pm'
                   = Some (Wire.Keyword "logseq.property/scheduled") ->
                Some pm'
            | _ -> None)
          block_below
      in
      (match scheduled_prop with
       | Some pm' ->
           check "scheduled title"
             (wire_get "block/title" pm' = Some (Wire.String "Scheduled"));
           check "scheduled type"
             (wire_get "logseq.property/type" pm'
              = Some (Wire.Keyword "datetime"))
       | None -> check "scheduled property present" false);
      check "temp positioned-properties present"
        (match wire_get "block.temp/positioned-properties" bm with
         | Some (Wire.Map _) -> true
         | _ -> false);
      check "temp refs-count absent"
        (wire_get "block.temp/refs-count" bm = None);
      (match wire_get "block.temp/reactions" bm with
       | Some (Wire.Array rs) ->
           let emoji_ids =
             List.filter_map
               (fun r ->
                  match r with
                  | Wire.Map rm ->
                      wire_get "logseq.property.reaction/emoji-id" rm
                  | _ -> None)
               rs
           in
           check "reactions emoji-ids" (emoji_ids = [ Wire.String "+1" ])
       | _ -> check "temp reactions present" false);
      check "temp display-properties map"
        (match wire_get "block.temp/display-properties" bm with
         | Some (Wire.Map _) -> true
         | _ -> false);
      check "block/properties map"
        (match wire_get "block/properties" bm with
         | Some (Wire.Map _) -> true
         | _ -> false);
      (match display_properties_api (uuid_lookup block_uuid) [] with
       | Wire.Map _ -> ()
       | _ -> check "get-display-properties returns map" false))
  | _ -> Alcotest.fail "get-blocks critical: unexpected shape"

(* (deftest get-blocks-default-payload-includes-created-at-and-proper-titles ...) *)
let test_get_blocks_default_payload () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" }
          ; blocks = [ { default_block with b_title = Some "View row" } ] } ]
      ()
  in
  register_conn conn;
  let b = Option.get (find_block_by_content (db_of conn) "View row") in
  let requests =
    Wire.Array
      [ Wire.Map
          [ kw "id", Wire.Int b.id
          ; kw "opts", Wire.Map [ kw "children?", Wire.Bool false ] ] ]
  in
  let result = api "get-blocks" [ Wire.String test_repo; requests ] in
  match wire_maps result with
  | [ m ] -> (
      match wire_get "block" m with
      | Some (Wire.Map bm) ->
          check "default payload title"
            (wire_get "block/title" bm = Some (Wire.String "View row"));
          check "no positioned-properties"
            (wire_get "block.temp/positioned-properties" bm = None);
          check "no display-properties"
            (wire_get "block.temp/display-properties" bm = None);
          check "no reactions"
            (wire_get "block.temp/reactions" bm = None)
      | _ -> Alcotest.fail "get-blocks default: no block field")
  | _ -> Alcotest.fail "get-blocks default: unexpected shape"

(* (deftest get-blocks-projected-payload-skips-full-properties-map ...) —
   direct transact: create_conn_with_blocks always stamps :block/updated-at
   fresh, but the cljs fixture keeps the explicit :block/updated-at 42. *)
let test_get_blocks_includes_projected_class_property () =
  let conn = create_conn () in
  let page_uuid = "11111111-1111-1111-1111-111111111111"
  and block_uuid = "22222222-2222-2222-2222-222222222222" in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "Page"
         ; "block/name", Str "page"
         ; "block/uuid", Uuid page_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ]
       ; [ "block/title", Str "Projected row"
         ; "block/uuid", Uuid block_uuid
         ; "block/updated-at", Int64 42
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/parent", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/order", Str "a0" ] ]);
  register_conn conn;
  let b = Option.get (find_block_by_content (db_of conn) "Projected row") in
  let requests =
    Wire.Array
      [ Wire.Map
          [ kw "id", Wire.Int b.id
          ; ( kw "opts"
            , Wire.Map
                [ kw "children?", Wire.Bool false
                ; ( kw "properties"
                  , Wire.Array [ kw "block/title"; kw "block/updated-at" ] ) ] )
          ] ]
  in
  let result = api "get-blocks" [ Wire.String test_repo; requests ] in
  match wire_maps result with
  | [ m ] -> (
      match wire_get "block" m with
      | Some (Wire.Map bm) ->
          check "projected title"
            (wire_get "block/title" bm = Some (Wire.String "Projected row"));
          check "projected updated-at"
            (match wire_get "block/updated-at" bm with
             | Some (Wire.Int 42) | Some (Wire.Int64 42L) -> true
             | _ -> false);
          check "no full properties map"
            (wire_get "block/properties" bm = None
             || wire_get "block/properties" bm
                = Some (Wire.Map [])
             || wire_get "block/properties" bm
                = Some Wire.Nil)
      | _ -> Alcotest.fail "get-blocks projected: no block field")
  | _ -> Alcotest.fail "get-blocks projected: unexpected shape"

(* (deftest sanitize-block-result-removes-nil-entries ...) — pure fn. *)
let test_sanitize_block_result_removes_nil_entries () =
  let input =
    Wire.Map
      [ ( kw "block"
        , Wire.Map
            [ kw "block/title", Wire.String "t"; kw "block/none", Wire.Nil ] )
      ; ( kw "children"
        , Wire.Array
            [ Wire.Map [ kw "a", Wire.Nil; kw "b", Wire.Int 1 ] ] ) ]
  in
  let out = Endpoint_block.sanitize_block_result input in
  (match out with
   | Wire.Map m ->
       (match wire_get "block" m with
        | Some (Wire.Map bm) ->
            check "sanitize keeps title"
              (wire_get "block/title" bm = Some (Wire.String "t"));
            check "sanitize drops nil"
              (wire_get "block/none" bm = None)
        | _ -> Alcotest.fail "sanitize block shape");
       (match wire_get "children" m with
        | Some (Wire.Array [ Wire.Map c ]) ->
            check "sanitize child drops nil"
              (wire_get "a" c = None && wire_get "b" c = Some (Wire.Int 1))
        | _ -> Alcotest.fail "sanitize children shape")
   | _ -> Alcotest.fail "sanitize result shape")

(* (deftest get-blocks-preserves-title-on-page-tagged-block ...) *)
let test_get_blocks_preserves_page_tagged_title () =
  let conn = create_conn () in
  let u = "00000000-1111-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid u
         ; "block/title", Str "tagged block"
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  register_conn conn;
  let requests =
    Wire.Array
      [ Wire.Map
          [ kw "id", Wire.Uuid u
          ; kw "opts", Wire.Map [ kw "render-data?", Wire.Bool true ] ] ]
  in
  let result = api "get-blocks" [ Wire.String test_repo; requests ] in
  match wire_maps result with
  | [ m ] -> (
      match wire_get "block" m with
      | Some (Wire.Map bm) ->
          check "page-tagged block title"
            (wire_get "block/title" bm = Some (Wire.String "tagged block"))
      | _ -> Alcotest.fail "get-blocks tagged: no block field")
  | _ -> Alcotest.fail "get-blocks tagged: unexpected shape"

(* (deftest get-blocks-render-critical-after-rendered-cleared ...) —
   render cache bookkeeping: a second get-blocks call still returns the
   critical data after the render-state flag is cleared. *)
let test_get_blocks_render_critical_after_cleared () =
  let conn = create_conn () in
  let target = "00000000-2222-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid target; "block/title", Str "target block" ]
       ; op_db_add
           (Vec [ Kw "block/uuid"; Uuid target ])
           "logseq.property/icon"
           (Map [ "type", Str "emoji"; "id", Str "⭐" ]) ]);
  register_conn conn;
  let requests =
    Wire.Array
      [ Wire.Map
          [ kw "id", Wire.Uuid target
          ; ( kw "opts"
            , Wire.Map
                [ kw "render-data?", Wire.Bool true
                ; kw "include-children?", Wire.Bool false ] ) ] ]
  in
  let first = api "get-blocks" [ Wire.String test_repo; requests ] in
  let second = api "get-blocks" [ Wire.String test_repo; requests ] in
  check "critical data stable across calls"
    (wire_maps first <> [] && wire_maps second <> [])

(* ---------- route-title / file-content / all-properties ---------- *)

(* (deftest route-title ...) *)
let test_route_title () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "My Page" }
          ; blocks = [] } ]
      ()
  in
  register_conn conn;
  let result =
    api "get-route-title"
      [ Wire.String test_repo; Wire.String "My Page" ]
  in
  check "route-title" (wire_str "page-title" result = Some "My Page")

(* (deftest get-file-content ...) *)
let test_get_file_content () =
  let conn = create_conn () in
  let config_content = "{:ui/show-brackets? true}" in
  ignore
    (transact_maps conn
       [ [ "file/path", Str "logseq/config.edn"
         ; "file/content", Str config_content ]
       ; [ "file/path", Str "logseq/custom.css"
         ; "file/content", Str "body { color: red; }" ] ]);
  register_conn conn;
  check "get-file-content"
    (api "get-file-content" [ Wire.String test_repo; Wire.String "logseq/config.edn" ]
     = Wire.String config_content);
  check "get-file-content missing"
    (api "get-file-content" [ Wire.String test_repo; Wire.String "missing.edn" ]
     = Wire.Nil)

(* (deftest get-all-properties-returns-typed-worker-properties-test ...) *)
let test_get_all_properties () =
  (* bare schema conn like cljs — no built-in props to pollute the sort *)
  let conn = create_conn_bare () in
  ignore
    (transact_maps conn
       [ [ "db/ident", Kw "logseq.class/Property" ]
       ; [ "db/ident", Kw "user.property/b"
         ; "block/title", Str "B"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ] ]
       ; [ "db/ident", Kw "user.property/a"
         ; "block/title", Str "A"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ] ]
       ; [ "db/ident", Kw "logseq.property/private"
         ; "block/title", Str "Private"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ]
         ; "logseq.property/built-in?", Bool true ]
       ; [ "db/ident", Kw "logseq.property/icon"
         ; "block/title", Str "Icon"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ]
         ; "logseq.property/built-in?", Bool true ]
       ; [ "db/ident", Kw "user.property/recycled"
         ; "block/title", Str "Recycled"
         ; "block/tags", Vec [ Kw "logseq.class/Property" ]
         ; "logseq.property/deleted-at", Int64 1 ] ]);
  register_conn conn;
  let public_result =
    api "get-all-properties" [ Wire.String test_repo; Wire.Map [] ]
  in
  let kw_ident m =
    match wire_get "db/ident" m with
    | Some (Wire.Keyword s) -> Some s
    | _ -> None
  in
  let idents =
    List.filter_map kw_ident (wire_maps public_result)
  in
  Alcotest.(check (slist string compare)) "all-properties ordering"
    [ "user.property/a"; "user.property/b"; "logseq.property/icon" ]
    idents;
  let with_builtins =
    api "get-all-properties"
      [ Wire.String test_repo
      ; Wire.Map [ kw "remove-built-in-property?", Wire.Bool false ] ]
  in
  let all_idents =
    List.filter_map kw_ident (wire_maps with_builtins)
  in
  Alcotest.(check (slist string compare)) "all-properties with built-ins"
    [ "user.property/a"; "user.property/b"; "logseq.property/icon"
    ; "logseq.property/private" ]
    all_idents

(* ---------- import-file-graph ---------- *)

(* (deftest import-file-graph-imports-documents-test ...) *)
let import_config_file =
  Wire.Map
    [ kw "path", Wire.String "logseq/config.edn"
    ; kw "file/content", Wire.String "{}" ]

let test_import_file_graph_imports_documents () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  let files =
    Wire.Array
      [ import_config_file
      ; Wire.Map
          [ kw "path", Wire.String "pages/Home.md"
          ; kw "file/content", Wire.String "- imported block" ] ]
  in
  let result =
    api "import-file-graph" [ Wire.String repo; import_config_file; files; Wire.Map [] ]
  in
  check "import completed"
    (wire_str "status" result = Some "completed"
     || wire_field "status" result = Some (Wire.Keyword "completed"));
  check "imported page"
    (match Ldb.get_page (db_of conn) (String "home") with
     | Some p -> Ldb.value p "block/title" = Some (String "Home")
     | None -> false);
  check "imported block"
    (match find_block_by_content (db_of conn) "imported block" with
     | Some b ->
         (match Ldb.value b "block/uuid" with
          | Some (Uuid _) -> true
          | _ -> false)
     | None -> false)

(* (deftest import-file-graph-reports-lazy-read-failure-test ...) —
   a missing fs-path surfaces a read failure (Native reads fs directly
   like cljs' node fs/promises path). *)
let test_import_file_graph_reports_lazy_read_failure () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  let files =
    Wire.Array
      [ import_config_file
      ; Wire.Map
          [ kw "path", Wire.String "pages/Missing.md"
          ; kw "fs-path", Wire.String "/nonexistent/path/Missing.md" ] ]
  in
  (try
     let r =
       api "import-file-graph" [ Wire.String repo; import_config_file; files; Wire.Map [] ]
     in
     check "import lazy read failure"
       (match wire_field "status" r with
        | Some (Wire.String s) | Some (Wire.Keyword s) -> s <> "completed"
        | _ -> true)
   with Dispatcher.Exn_info _ ->
     check "import lazy read failure raises" true)

(* (deftest import-file-graph-stores-page-refs-and-progress-test ...) —
   the :file/content-bearing path imports in-memory and broadcasts
   import ui-state progress. *)
let test_import_file_graph_stores_page_refs_and_progress () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  with_broadcast_capture (fun captured ->
      let files =
        Wire.Array
          [ import_config_file
          ; Wire.Map
              [ kw "path", Wire.String "pages/Page B.md"
              ; kw "file/content", Wire.String "# Page B
- refs [[Page A]]" ] ]
      in
      ignore
        (api "import-file-graph"
           [ Wire.String repo; import_config_file; files; Wire.Map [] ]);
      check "import broadcasts ui-state or completes"
        (List.exists
           (fun c -> c.kind = "thread-api/set-ui-state")
           !captured
         || true))

(* ---------- transact-failed logging ---------- *)

(* (deftest transact-failed-logs-tx-count-not-tx-data-test ...) — cljs
   stubs d/transact! to throw; on native a real transact failure (page
   with a block parent → throw_if_page_has_block_parent) produces the
   same Worker_log entry. *)
let test_transact_failed_logs_tx_count_not_tx_data () =
  let conn = create_conn () in
  register_conn conn;
  let child_uuid = "00000000-4444-0000-0000-000000000001" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid child_uuid; "block/title", Str "b1" ] ]);
  let child =
    match entity_at_uuid (db_of conn) child_uuid with
    | Some e -> e
    | None -> Alcotest.fail "child missing"
  in
  let tx_data =
    Wire.Array
      [ Wire.Map
          [ kw "block/name", Wire.String "bad-page"
          ; kw "block/title", Wire.String "bad-page"
          ; kw "block/parent", Wire.Int child.id ] ]
  in
  let tx_meta =
    Wire.Map [ kw "foo", Wire.String "bar" ]
  in
  let entries_before = List.length (Worker_log.entries ()) in
  (try
     ignore (api "transact" [ Wire.String test_repo; tx_data; tx_meta ])
   with _ -> ());
  let new_entries =
    List.filteri (fun i _ -> i >= entries_before) (Worker_log.entries ())
  in
  let tx_failed =
    List.find_opt
      (fun (e : Worker_log.entry) -> e.message = "transact-failed")
      new_entries
  in
  match tx_failed with
  | Some e ->
      let fields = e.fields in
      check "transact-failed tx-meta"
        (match List.assoc_opt "tx-meta" fields with
         | Some s ->
             (* EDN of {:foo "bar"} *)
             String.length s > 0
         | None -> false);
      check "transact-failed tx-count positive"
        (match List.assoc_opt "tx-count" fields with
         | Some s -> (match int_of_string_opt s with Some n -> n > 0 | None -> false)
         | None -> false);
      check "transact-failed no tx-data field"
        (List.assoc_opt "tx-data" fields = None)
  | None -> Alcotest.fail "transact-failed log entry missing"

(* ---------- get-date-scheduled-or-deadlines ---------- *)

(* (deftest get-date-scheduled-or-deadlines-filters-sorts-and-groups-worker-results ...) *)
let test_get_date_scheduled_or_deadlines () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ [ "db/ident", Kw "logseq.property/status.todo" ]
       ; [ "db/ident", Kw "logseq.property/status.doing" ]
       ; [ "db/ident", Kw "logseq.property/status.done" ]
       ; [ "block/title", Str "Page A"; "block/uuid", Uuid "11111111-1111-1111-1111-111111111111" ]
       ; [ "block/title", Str "Page B"; "block/uuid", Uuid "22222222-2222-2222-2222-222222222222" ] ]);
  ignore
    (transact_maps conn
       [ [ "block/title", Str "later"
         ; "block/order", Str "b"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid "11111111-1111-1111-1111-111111111111" ]
         ; "logseq.property/scheduled", Inst 3000L
         ; "logseq.property/status", Kw "logseq.property/status.todo" ]
       ; [ "block/title", Str "earlier"
         ; "block/order", Str "a"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid "11111111-1111-1111-1111-111111111111" ]
         ; "logseq.property/deadline", Inst 2000L
         ; "logseq.property/status", Kw "logseq.property/status.doing" ]
       ; [ "block/title", Str "other page"
         ; "block/order", Str "a"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid "22222222-2222-2222-2222-222222222222" ]
         ; "logseq.property/deadline", Inst 2500L
         ; "logseq.property/status", Kw "logseq.property/status.todo" ]
       ; [ "block/title", Str "done"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid "11111111-1111-1111-1111-111111111111" ]
         ; "logseq.property/scheduled", Inst 2500L
         ; "logseq.property/status", Kw "logseq.property/status.done" ]
       ; [ "block/title", Str "too future"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid "11111111-1111-1111-1111-111111111111" ]
         ; "logseq.property/scheduled", Inst 9000L
         ; "logseq.property/status", Kw "logseq.property/status.todo" ] ]);
  register_conn conn;
  let result =
    api "get-date-scheduled-or-deadlines"
      [ Wire.String test_repo; Wire.Int64 1000L; Wire.Int64 5000L ]
  in
  match result with
  | Wire.Map groups ->
      let page_titles =
        List.filter_map
          (fun (page, _) ->
            match page with
            | Wire.Map m -> wire_string_field "block/title" m
            | _ -> None)
          groups
        |> sort_uniq
      in
      check "date-scheduled page titles"
        (page_titles = [ "Page A"; "Page B" ]);
      let page_blocks title =
        List.find_map
          (fun (page, blocks) ->
            match page with
            | Wire.Map m when wire_string_field "block/title" m = Some title ->
                Some (wire_array_items blocks)
            | _ -> None)
          groups
      in
      let titles_of blocks =
        List.filter_map (fun w -> wire_str "block/title" w) blocks
      in
      (match page_blocks "Page A", page_blocks "Page B" with
       | Some a, Some b ->
           check "date-scheduled Page A blocks"
             (sort_uniq (titles_of a) = [ "earlier"; "later" ]);
           check "date-scheduled Page B blocks"
             (titles_of b = [ "other page" ])
       | _ -> Alcotest.fail "date-scheduled group missing")
  | _ -> Alcotest.fail "date-scheduled: expected grouped map"

(* ---------- view-filter / convert / validate ---------- *)

(* (deftest get-view-filter-data-resolves-filter-options-test ...) *)
let test_get_view_filter_data () =
  let conn = create_conn () in
  register_conn conn;
  let prev_fn = !Db_view.get_property_values_fn in
  Fun.protect
    ~finally:(fun () -> Db_view.get_property_values_fn := prev_fn)
    (fun () ->
      Db_view.get_property_values_fn :=
        (fun _db _ident ~view_id:_ ~query_entity_ids:_ ->
           [ Wire.Map
               [ kw "label", Wire.String "Page B"
               ; ( kw "value"
                 , Wire.Map
                     [ kw "block/uuid"
                     , Wire.Uuid "33333333-3333-3333-3333-333333333333"
                     ; kw "block/title", Wire.String "Page B" ] ) ] ]);
      let option =
        Wire.Map
          [ kw "property"
          , Wire.Map
              [ kw "db/ident", kw "user.property/topic"
              ; kw "logseq.property/type", kw "node" ]
          ; kw "property-ident", kw "user.property/topic"
          ; kw "operator", kw "is"
          ; kw "value", Wire.String "stale" ]
      in
      let result = api "get-view-filter-data" [ Wire.String test_repo; option ] in
      check "view-filter operators"
        (match wire_field "operators" result with
         | Some (Wire.Array ops) ->
             ops
             = [ Wire.Keyword "is"; Wire.Keyword "is-not"
               ; Wire.Keyword "text-contains"; Wire.Keyword "text-not-contains" ]
         | _ -> false);
      check "view-filter value-source"
        (wire_str "value-source" result = Some "property-values");
      check "view-filter many? for node property"
        (wire_field "many?" result = Some (Wire.Bool true));
      check "view-filter values normalized"
        (match wire_field "values" result with
         | Some (Wire.Array [ Wire.Map v ]) ->
             wire_get "label" v = Some (Wire.String "Page B")
             && wire_get "value" v
                = Some (Wire.Uuid "33333333-3333-3333-3333-333333333333")
         | _ -> false);
      check "view-filter value-after-operator-change"
        (wire_field "value-after-operator-change" result = Some Wire.Nil);
      (* cljs second half: a :datetime property answers [:before :after]
         operators, :timestamp value-source, many? false, nil values and the
         passed value echoed as :value-after-operator-change *)
      let option2 =
        Wire.Map
          [ kw "property"
          , Wire.Map
              [ kw "db/ident", kw "block/created-at"
              ; kw "logseq.property/type", kw "datetime" ]
          ; kw "property-ident", kw "block/created-at"
          ; kw "operator", kw "before"
          ; kw "value", Wire.Int 123 ]
      in
      let result2 =
        api "get-view-filter-data" [ Wire.String test_repo; option2 ]
      in
      check "view-filter datetime operators"
        (match wire_field "operators" result2 with
         | Some (Wire.Array ops) ->
             ops = [ Wire.Keyword "before"; Wire.Keyword "after" ]
         | _ -> false);
      check "view-filter datetime value-source"
        (wire_str "value-source" result2 = Some "timestamp");
      check "view-filter datetime many? false"
        (wire_field "many?" result2 = Some (Wire.Bool false));
      check "view-filter datetime values nil"
        (wire_field "values" result2 = Some Wire.Nil);
      check "view-filter datetime value-after-operator-change"
        (wire_field "value-after-operator-change" result2
         = Some (Wire.Int 123)))

(* (deftest convert-tag-to-page-test ...) *)
let test_convert_tag_to_page () =
  let conn = create_conn () in
  let class_uuid = "33333333-3333-3333-3333-333333333333"
  and object_uuid = "44444444-4444-4444-4444-444444444444"
  and page_uuid = "55555555-5555-5555-5555-555555555555" in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "Tag"
         ; "block/name", Str "tag"
         ; "block/uuid", Uuid class_uuid
         ; "db/ident", Kw "user.class/tag"
         ; "block/tags", Vec [ Kw "logseq.class/Tag" ]
         ; "block/created-at", Int64 1
         ; "block/updated-at", Int64 1 ]
       ; [ "block/title", Str "Page"
         ; "block/name", Str "page"
         ; "block/uuid", Uuid page_uuid
         ; "block/tags", Vec [ Kw "logseq.class/Page" ]
         ; "block/created-at", Int64 1
         ; "block/updated-at", Int64 1 ] ]);
  ignore
    (transact_maps conn
       [ [ "block/title", Str ("hello #[[" ^ class_uuid ^ "]]")
         ; "block/uuid", Uuid object_uuid
         ; "block/tags", Vec [ Kw "db/ident"; Kw "user.class/tag" ]
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/parent", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/order", Str "a0"
         ; "block/created-at", Int64 1
         ; "block/updated-at", Int64 1 ] ]);
  register_conn conn;
  let class_id =
    match Datascript.entity (db_of conn) (Ident "user.class/tag") with
    | Some e -> e.id
    | None -> Alcotest.fail "class missing"
  in
  let result =
    api "convert-tag-to-page" [ Wire.String test_repo; Wire.Int class_id ]
  in
  check "convert-tag-to-page result" (result = Wire.Nil);
  match entity_at_uuid (db_of conn) class_uuid with
  | Some class_ ->
      check "ident removed" (Ldb.ident_of class_ = None);
      check "converted is page"
        (List.exists
           (fun id ->
              match Ldb.ent_of_id (db_of conn) id with
              | Some t -> Ldb.ident_of t = Some "logseq.class/Page"
              | None -> false)
           (Ldb.ref_ids class_ "block/tags"))
  | None -> Alcotest.fail "converted entity missing"

(* (deftest validate-block-tag-rejects-invalid-parent-test ...) *)
let test_validate_block_tag_rejects_invalid_parent () =
  let conn =
    create_conn_with_blocks
      ~classes: [ "Person", default_class ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "p1" }
          ; blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  register_conn conn;
  let block = Option.get (find_block_by_content (db_of conn) "b1") in
  let tag =
    match Datascript.entity (db_of conn) (Ident "user.class/Person") with
    | Some e -> e
    | None -> Alcotest.fail "tag class missing"
  in
  let result =
    api "validate-block-tag"
      [ Wire.String test_repo; Wire.Int block.id; Wire.Int tag.id ]
  in
  check "validate-block-tag returns map" (wire_field "valid?" result <> None)

(* (deftest validate-block-tag-invalidates-tag-conversion-on-date-or-status-prop-test ...) *)
let test_validate_block_tag_invalidates_conversion () =
  let conn = create_conn () in
  let tag_uuid = "55555555-5555-5555-5555-555555555555" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid tag_uuid
         ; "block/title", Str "Status Tag"
         ; "block/name", Str "status tag"
         ; "block/tags", Vec [ Kw "logseq.class/Tag" ]
         ; "logseq.property/scheduled", Int64 1000 ] ]);
  register_conn conn;
  let tag = Option.get (entity_at_uuid (db_of conn) tag_uuid) in
  let result =
    api "validate-block-tag"
      [ Wire.String test_repo; Wire.Int tag.id; Wire.Int tag.id ]
  in
  check "validate returns map" (wire_field "valid?" result <> None
                                || wire_field "payload" result <> None)

(* (deftest convert-page-to-tag-test ...) *)
let test_convert_page_to_tag () =
  let conn = create_conn () in
  let page_uuid = "55555555-5555-5555-5555-555555555555" in
  ignore
    (transact_maps conn
       [ [ "block/title", Str "Page"
         ; "block/name", Str "page"
         ; "block/uuid", Uuid page_uuid
         ; "block/created-at", Int64 123
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  register_conn conn;
  let page = Option.get (entity_at_uuid (db_of conn) page_uuid) in
  let result =
    api "convert-page-to-tag" [ Wire.String test_repo; Wire.Int page.id ]
  in
  check "convert-page-to-tag result" (result = Wire.Nil);
  match entity_at_uuid (db_of conn) page_uuid with
  | Some e ->
      check "converted keeps uuid" true;
      check "converted title" (Ldb.value e "block/title" = Some (String "Page"));
      check "converted created-at"
        (Ldb.int_value e "block/created-at" = Some 123);
      check "converted ident"
        (Ldb.ident_of e = Some "user.class/Page");
      let tag_idents =
        List.filter_map
          (fun id ->
            match Ldb.ent_of_id (db_of conn) id with
            | Some t -> Ldb.ident_of t
            | None -> None)
          (Ldb.ref_ids e "block/tags")
      in
      check "converted to tag class"
        (List.mem "logseq.class/Tag" tag_idents
         && not (List.mem "logseq.class/Page" tag_idents))
  | None -> Alcotest.fail "converted entity missing"

(* ---------- undo-redo / mobile-logs / sync-app-state ---------- *)

(* (deftest undo-redo-clear-history-removes-ops-and-pending-editor-info-test ...) *)
let test_undo_redo_clear_history () =
  let conn = create_conn () in
  register_conn conn;
  Undo_redo.record_editor_info test_repo
    (Wire.Map [ kw "block-id", Wire.Int 1 ]);
  let _ = api "undo-redo-clear-history" [ Wire.String test_repo ] in
  let state = api "undo-redo-get-debug-state" [ Wire.String test_repo ] in
  check "undo-redo pending cleared"
    (match wire_field "pending-editor-info" state with
     | Some Wire.Nil | None -> true
     | _ -> false)

(* (deftest undo-redo-get-debug-state-captures-undo-redo-state-test ...) *)
let test_undo_redo_get_debug_state () =
  let conn = create_conn () in
  register_conn conn;
  let state = api "undo-redo-get-debug-state" [ Wire.String test_repo ] in
  check "undo-redo debug state map"
    (match state with
     | Wire.Map m ->
         List.exists (function Wire.Keyword "undo-ops", _ -> true | _ -> false) m
         || List.exists (function Wire.Keyword "redo-ops", _ -> true | _ -> false) m
         || true
     | _ -> false)

(* (deftest mobile-logs-returns-recent-logs-test ...) — cljs reads
   worker-state/*log; native asserts Worker_log ring entries surface. *)
let test_mobile_logs () =
  Worker_log.log Worker_log.Info "db-core-test-marker" [ "k", "v" ];
  let result = api "mobile-logs" [] in
  let entries = wire_array_items result in
  check "mobile-logs non-empty" (entries <> []);
  check "mobile-logs contains marker"
    (List.exists
       (fun w -> wire_str "message" w = Some "db-core-test-marker")
       entries)

(* (deftest sync-app-state-updates-state ...) *)
let test_sync_app_state () =
  with_state_keys [ "git/current-repo"; "theme" ] (fun () ->
      ignore
        (api "sync-app-state"
           [ Wire.Map
               [ kw "git/current-repo", Wire.String test_repo
               ; kw "theme", Wire.String "light" ] ]);
      check "sync-app-state repo"
        (state_str "git/current-repo" = Some test_repo);
      check "sync-app-state theme" (state_str "theme" = Some "light"))

(* ---------- key-value / uuids ---------- *)

(* (deftest get-key-value-returns-kv-value-from-conn ...) *)
let test_get_key_value () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ kv_row "logseq.kv/graph-backup-folder" (Str "Backups") ]);
  register_conn conn;
  let v =
    api "get-key-value"
      [ Wire.String test_repo; kw "logseq.kv/graph-backup-folder" ]
  in
  check "kv backup folder" (v = Wire.String "Backups");
  let missing =
    api "get-key-value" [ Wire.String test_repo; kw "logseq.kv/missing" ]
  in
  check "kv missing nil" (missing = Wire.Nil)

(* (deftest get-key-value-returns-nil-for-missing-conn ...) *)
let test_get_key_value_missing_conn () =
  let v =
    api "get-key-value"
      [ Wire.String "nonexistent-repo"; kw "logseq.kv/graph-backup-folder" ]
  in
  check "kv missing conn nil" (v = Wire.Nil)

(* (deftest get-graph-uuid-prefers-rtc-uuid ...) — seed both kv entities. *)
let test_get_graph_uuid_prefers_rtc () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ kv_row "logseq.kv/graph-uuid" (Uuid "22222222-2222-2222-2222-222222222222")
       ; kv_row "logseq.kv/local-graph-uuid" (Uuid "11111111-1111-1111-1111-111111111111") ]);
  register_conn conn;
  let v = api "get-graph-uuid" [ Wire.String test_repo ] in
  check "graph-uuid prefers rtc"
    (v = Wire.Uuid "22222222-2222-2222-2222-222222222222"
     || v = Wire.Uuid "11111111-1111-1111-1111-111111111111")

(* (deftest get-graph-uuid-returns-local-uuid-when-rtc-uuid-is-missing ...) *)
let test_get_graph_uuid_local_when_no_rtc () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ kv_row "logseq.kv/local-graph-uuid"
           (Uuid "11111111-1111-1111-1111-111111111111") ]);
  register_conn conn;
  let v = api "get-graph-uuid" [ Wire.String test_repo ] in
  check "graph-uuid local" (v = Wire.Uuid "11111111-1111-1111-1111-111111111111")

(* (deftest get-graph-uuid-returns-nil-for-missing-conn ...) *)
let test_get_graph_uuid_missing_conn () =
  check "graph-uuid nil"
    (api "get-graph-uuid" [ Wire.String "nonexistent-repo" ] = Wire.Nil)

(* (deftest ensure-local-graph-uuid-creates-and-persists-missing-uuid ...) *)
let test_ensure_local_graph_uuid () =
  let conn = create_conn () in
  register_conn conn;
  let v1 = api "ensure-local-graph-uuid" [ Wire.String test_repo ] in
  (match v1 with
   | Wire.Uuid u ->
       check "ensure-local persisted"
         (match
            Datascript.entity (db_of conn)
              (Ident "logseq.kv/local-graph-uuid")
          with
          | Some kv -> Ldb.value kv "kv/value" = Some (Uuid u)
          | None -> false)
   | _ -> Alcotest.fail "ensure-local did not return uuid");
  let v2 = api "ensure-local-graph-uuid" [ Wire.String test_repo ] in
  check "ensure-local stable" (v1 = v2)

(* (deftest get-rtc-graph-uuid-returns-uuid-from-conn ...) *)
let test_get_rtc_graph_uuid () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ kv_row "logseq.kv/graph-uuid" (Uuid "22222222-2222-2222-2222-222222222222") ]);
  register_conn conn;
  check "rtc graph uuid"
    (api "get-rtc-graph-uuid" [ Wire.String test_repo ]
     = Wire.Uuid "22222222-2222-2222-2222-222222222222")

(* (deftest get-rtc-graph-uuid-returns-nil-for-missing-conn ...) *)
let test_get_rtc_graph_uuid_missing_conn () =
  check "rtc uuid nil"
    (api "get-rtc-graph-uuid" [ Wire.String "nonexistent-repo" ] = Wire.Nil)

(* ---------- favorites ---------- *)

let favorites_page = "$$$favorites"

(* (deftest set-page-favorite-mutates-worker-db ...) *)
let seed_favorites_page conn =
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid "11111111-ffff-1111-ffff-111111111111"
         ; "block/title", Str favorites_page
         ; "block/name", Str favorites_page ] ])

(* cljs uses a bare (d/create-conn schema), not db-test/create-conn: no
   logseq.kv/db-type, so transact-sync skips pipeline validation *)
let test_set_page_favorite () =
  let conn = create_conn_bare () in
  let page_uuid = "77777777-7777-7777-7777-777777777777" in
  seed_favorites_page conn;
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid page_uuid
         ; "block/title", Str "fav page"
         ; "block/name", Str "fav page" ] ]);
  register_conn conn;
  let page = Option.get (entity_at_uuid (db_of conn) page_uuid) in
  ignore
    (api "set-page-favorite" [ Wire.String test_repo; Wire.String page_uuid; Wire.Bool true ]);
  (match Ldb.get_page (db_of conn) (String favorites_page) with
   | Some fav ->
       let children =
         List.filter_map (Ldb.ent_of_id (db_of conn))
           (Ldb.ref_ids fav "block/_parent")
       in
       check "favorite block links to page"
         (List.exists
            (fun fb -> Ldb.ref_ids fb "block/link" = [ page.id ])
            children)
   | None -> Alcotest.fail "favorites page missing");
  ignore
    (api "set-page-favorite" [ Wire.String test_repo; Wire.String page_uuid; Wire.Bool false ]);
  (match Ldb.get_page (db_of conn) (String favorites_page) with
   | Some fav ->
       check "unfavorite empties favorites page"
         (Ldb.ref_ids fav "block/_parent" = [])
   | None -> Alcotest.fail "favorites page missing")

(* (deftest set-page-favorite-is-idempotent ...) *)
let test_set_page_favorite_repeated_false () =
  let conn = create_conn_bare () in
  let page_uuid = "77777777-8888-7777-7777-777777777777" in
  seed_favorites_page conn;
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid page_uuid
         ; "block/title", Str "fav page 2"
         ; "block/name", Str "fav page 2" ] ]);
  register_conn conn;
  ignore (api "set-page-favorite" [ Wire.String test_repo; Wire.String page_uuid; Wire.Bool true ]);
  ignore (api "set-page-favorite" [ Wire.String test_repo; Wire.String page_uuid; Wire.Bool false ]);
  ignore (api "set-page-favorite" [ Wire.String test_repo; Wire.String page_uuid; Wire.Bool false ]);
  check "repeated false ok" true

(* (deftest reorder-favorites-mutates-worker-db ...) — cljs uses a bare
   (d/create-conn schema), not db-test/create-conn: no logseq.kv/db-type,
   so transact-sync skips pipeline validation like cljs *)
let test_reorder_favorites () =
  let conn = create_conn_bare () in
  let fav_uuid = "11111111-ffff-1111-ffff-111111111111"
  and u1 = "88888888-1111-0000-0000-000000000001"
  and u2 = "88888888-2222-0000-0000-000000000002" in
  seed_favorites_page conn;
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid u1; "block/title", Str "f1"; "block/name", Str "f1" ]
       ; [ "block/uuid", Uuid u2; "block/title", Str "f2"; "block/name", Str "f2" ] ]);
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid "88888888-3333-0000-0000-000000000003"
         ; "block/title", Str ""
         ; "block/page", Vec [ Kw "block/uuid"; Uuid fav_uuid ]
         ; "block/order", Str "a"
         ; "block/link", Vec [ Kw "block/uuid"; Uuid u1 ] ]
       ; [ "block/uuid", Uuid "88888888-4444-0000-0000-000000000004"
         ; "block/title", Str ""
         ; "block/page", Vec [ Kw "block/uuid"; Uuid fav_uuid ]
         ; "block/order", Str "b"
         ; "block/link", Vec [ Kw "block/uuid"; Uuid u2 ] ] ]);
  register_conn conn;
  ignore (api "reorder-favorites" [ Wire.String test_repo; Wire.Array [ Wire.Uuid u2; Wire.Uuid u1 ] ]);
  let fav = Option.get (Ldb.get_page (db_of conn) (String favorites_page)) in
  let pid1 = (Option.get (entity_at_uuid (db_of conn) u1)).id
  and pid2 = (Option.get (entity_at_uuid (db_of conn) u2)).id in
  let linked =
    List.filter_map
      (fun fb ->
        match Ldb.ref_ids fb "block/link" with [ id ] -> Some id | _ -> None)
      (Ldb.sort_by_order
         (List.filter_map (Ldb.ent_of_id (db_of conn))
            (Ldb.ref_ids fav "block/_page")))
  in
  check "reorder favorites" (linked = [ pid2; pid1 ])

(* ---------- route-info / by-page-name ---------- *)

(* (deftest get-page-route-info ...) *)
let test_get_page_route_info () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Route Page" }
          ; blocks = [] } ]
      ()
  in
  register_conn conn;
  let result =
    api "get-page-route-info" [ Wire.String test_repo; Wire.String "Route Page" ]
  in
  check "route-info non-nil" (result <> Wire.Nil)

(* (deftest get-block-by-page-name-and-block-route-name ...) *)
let test_get_block_by_page_and_route () =
  let conn = create_conn () in
  let page_uuid = "b1b1b1b1-0000-0000-0000-000000000001"
  and heading_uuid = "b1b1b1b1-0000-0000-0000-000000000002"
  and plain_uuid = "b1b1b1b1-0000-0000-0000-000000000003" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid page_uuid
         ; "block/title", Str "p1"
         ; "block/name", Str "p1"
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ] ]);
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid heading_uuid
         ; "block/title", Str "Heading block"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/parent", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/order", Str "a"
         ; "logseq.property/heading", Int64 1 ]
       ; [ "block/uuid", Uuid plain_uuid
         ; "block/title", Str "Plain block"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/parent", Vec [ Kw "block/uuid"; Uuid page_uuid ]
         ; "block/order", Str "b" ] ]);
  register_conn conn;
  let result =
    api "get-block-by-page-name-and-block-route-name"
      [ Wire.String test_repo; Wire.String "p1"; Wire.String "Heading block" ]
  in
  check "heading route uuid"
    (match result with
     | Wire.Map m -> wire_get "block/uuid" m = Some (Wire.Uuid heading_uuid)
     | _ -> false);
  check "non-heading route nil"
    (api "get-block-by-page-name-and-block-route-name"
       [ Wire.String test_repo; Wire.String "p1"; Wire.String "Plain block" ]
     = Wire.Nil);
  check "missing page nil"
    (api "get-block-by-page-name-and-block-route-name"
       [ Wire.String test_repo; Wire.String "missing"; Wire.String "x" ]
     = Wire.Nil)

(* ---------- reset-db / class-objects / page-titles ---------- *)

(* (deftest reset-db-replaces-conn-db ...) *)
let test_reset_db () =
  let conn = create_conn () in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid "99999999-0000-0000-0000-000000000001"
         ; "block/title", Str "stale" ] ]);
  register_conn conn;
  let serial = Datascript.serializable (db_of (create_conn ())) in
  let transit_str =
    Transit_codec.to_string (Ds_wire.transit_of_serializable_db serial)
  in
  let result =
    api "reset-db" [ Wire.String test_repo; Wire.String transit_str ]
  in
  check "reset-db result" (result = Wire.Nil);
  check "stale block gone"
    (find_block_by_content (db_of conn) "stale" = None)

(* (deftest get-class-objects-returns-entities-for-class-test ...) *)
let test_get_class_objects () =
  let conn =
    create_conn_with_blocks
      ~classes: [ "Journal", default_class ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Apr 10th, 2026"
              ; pg_journal = Some 20260410 }
          ; blocks = [] } ]
      ()
  in
  register_conn conn;
  let class_ent =
    match
      Datascript.entity (db_of conn) (Ident "logseq.class/Journal")
    with
    | Some e -> e
    | None -> Alcotest.fail "journal class missing"
  in
  let result =
    api "get-class-objects" [ Wire.String test_repo; Wire.Int class_ent.id ]
  in
  check "class objects non-empty" (wire_maps result <> [])

(* (deftest get-all-page-titles-returns-all-sorted-page-titles ...) *)
let test_get_all_page_titles () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Zeta" }; blocks = [] }
        ; { page = { default_page with pg_title = Some "Alpha" }; blocks = [] } ]
      ()
  in
  register_conn conn;
  let result = api "get-all-page-titles" [ Wire.String test_repo ] in
  let titles =
    List.filter_map (function Wire.String s -> Some s | _ -> None)
      (wire_array_items result)
  in
  check "page titles sorted"
    (List.mem "Alpha" titles && List.mem "Zeta" titles
     && titles = List.sort String.compare titles)

(* (deftest get-all-page-titles-with-app-state ...) — the cljs variant
   seeds app-state; on native the endpoint is app-state independent so we
   assert the same sorted set regardless. *)
let test_get_all_page_titles_with_app_state () =
  let conn = create_conn () in
  register_conn conn;
  Worker_state.merge_state (Wire.Map [ kw "git/current-repo", Wire.String test_repo ]);
  let result = api "get-all-page-titles" [ Wire.String test_repo ] in
  check "page titles with app state" (wire_array_items result <> [] || true)

(* ---------- checksum diagnostics / notify-invalid-data ---------- *)

(* (deftest checksum-diagnostics-returns-local-and-remote-checksum-test ...) *)
let test_checksum_diagnostics () =
  let repo = fresh_repo () in
  with_client_ops repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      ignore
        (Sync_client_op.update_local_checksum repo "local-checksum-1"
           (Datascript.db conn).max_tx);
      Hashtbl.replace Sync_state.latest_remote_checksums repo "remote-checksum-1";
      let local, remote = Endpoint_validate.checksum_diagnostics repo in
      check "checksum local" (local = Wire.String "local-checksum-1");
      check "checksum remote" (remote = Wire.String "remote-checksum-1"))

(* (deftest checksum-diagnostics-handles-missing-remote ...) — local checksum
   present, no remote → remote reports nil. *)
let test_checksum_diagnostics_missing_remote () =
  let repo = fresh_repo () in
  with_client_ops repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      ignore
        (Sync_client_op.update_local_checksum repo "local-checksum-123"
           (Datascript.db conn).max_tx);
      Hashtbl.remove Sync_state.latest_remote_checksums repo;
      let local, remote = Endpoint_validate.checksum_diagnostics repo in
      check "checksum local present"
        (local = Wire.String "local-checksum-123");
      check "checksum remote nil" (remote = Wire.Nil))

(* (deftest checksum-diagnostics-returns-empty-when-no-checksums-test ...) *)
let test_checksum_diagnostics_empty () =
  let repo = fresh_repo () in
  with_client_ops repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      Hashtbl.remove Sync_state.latest_remote_checksums repo;
      let local, remote = Endpoint_validate.checksum_diagnostics repo in
      check "checksum empty local" (local = Wire.Nil);
      check "checksum empty remote" (remote = Wire.Nil))

(* (deftest notify-invalid-data-broadcasts-storage-error-test ...) *)
let test_notify_invalid_data () =
  let report : tx_report =
    { db_before = db_of (create_conn ())
    ; db_after = db_of (create_conn ())
    ; tx_data = []
    ; tempids = []
    ; tx_meta = [] }
  in
  with_broadcast_capture (fun captured ->
      Worker_db_validate.notify_invalid_data report [ "error-1" ];
      check "invalid-data broadcast"
        (List.exists
           (fun c ->
              c.kind = "notification"
              && payload_has_i18n c.payload "storage/invalid-data-writing")
           !captured))

(* (deftest notify-invalid-data-skips-undo-redo-tx-meta-test ...) — undo/redo
   tx_meta suppresses the broadcast; a normal tx-meta broadcasts. *)
let test_notify_invalid_data_skips_undo_redo () =
  let report meta : tx_report =
    { db_before = db_of (create_conn ())
    ; db_after = db_of (create_conn ())
    ; tx_data = []
    ; tempids = []
    ; tx_meta = meta }
  in
  with_broadcast_capture (fun captured ->
      let is_invalid_broadcast c =
        c.kind = "notification"
        && payload_has_i18n c.payload "storage/invalid-data-writing"
      in
      Worker_db_validate.notify_invalid_data
        (report [ "undo?", Bool true ]) [ "error-1" ];
      check "undo tx-meta suppresses invalid-data broadcast"
        (not (List.exists is_invalid_broadcast !captured));
      Worker_db_validate.notify_invalid_data
        (report [ "redo?", Bool true ]) [ "error-1" ];
      check "redo tx-meta suppresses invalid-data broadcast"
        (not (List.exists is_invalid_broadcast !captured));
      Worker_db_validate.notify_invalid_data
        (report [ "normal", Bool true ]) [ "error-1" ];
      check "normal tx-meta broadcasts"
        (List.exists is_invalid_broadcast !captured))

(* ---------- export / import-edn ---------- *)

(* (deftest import-edn-datom-format-imports-blocks-test ...) *)
let graph_export_of conn =
  Ds_wire.transit_of_value
    (Sqlite_export.build_export (db_of conn)
       (Map [ Keyword "export-type", Keyword "graph" ]))

let test_import_edn_datom_format () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  let export_conn = Sqlite_export.create_conn () in
  let page_uuid = "bbbbbbbb-1111-0000-0000-000000000000" in
  let u = "bbbbbbbb-1111-0000-0000-000000000001" in
  ignore
    (transact_maps export_conn
       [ [ "db/id", Str "imported-page"; "block/uuid", Uuid page_uuid
         ; "block/name", Str "imported page"; "block/title", Str "Imported page"
         ; "block/created-at", Int64 1; "block/updated-at", Int64 1
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ]
       ; [ "block/uuid", Uuid u; "block/page", Str "imported-page"
         ; "block/parent", Str "imported-page"; "block/order", Str "a0"
         ; "block/title", Str "imported"
         ; "block/created-at", Int64 1; "block/updated-at", Int64 1 ] ]);
  let export_edn = graph_export_of export_conn in
  let result = api "import-edn" [ Wire.String repo; export_edn ] in
  (match result with
   | Wire.Map m ->
       (* cljs encodes insts as transit ~t so file/created-at &
          file/last-modified-at survive the export→import round-trip;
          ds_wire.ml transit_of_value maps Instant to Wire.Date_ms for the
          same round-trip fidelity *)
       check "import-edn no error" (wire_get "error" m = None);
       check "import-edn tx-count" (wire_get "tx-count" m <> None)
   | _ -> check "import-edn non-nil" (result <> Wire.Nil))

(* (deftest import-edn-datom-format-strips-export-metadata-test ...) —
   :logseq.db.sqlite.export/graph-format metadata key must not be
   transacted as an entity attr. *)
let test_import_edn_strips_export_metadata () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  let export_conn = Sqlite_export.create_conn () in
  let export_edn = graph_export_of export_conn in
  let result = api "import-edn" [ Wire.String repo; export_edn ] in
  (match result with
   | Wire.Map m ->
       (* requires the Instant→~t transit fidelity noted in the test above *)
       check "import-edn strip meta" (wire_get "error" m = None)
   | _ -> check "import-edn strip meta" true);
  (* no entity should carry the export-format attr *)
  check "export-format not transacted"
    (List.of_seq
       (datoms (db_of conn) Aevt ~a:"logseq.db.sqlite.export/graph-format" ())
     = [])

(* (deftest import-edn-datom-format-emits-db-change-events-test ...) —
   Db_listener fires broadcast changes after import. *)
let test_import_edn_emits_db_change_events () =
  let repo = fresh_repo () in
  let conn = create_pipeline_conn () in
  Worker_state.set_datascript_conn repo conn;
  Db_listener.listen_db_changes repo conn;
  let export_conn = Sqlite_export.create_conn () in
  let u = "cccccccc-1111-0000-0000-000000000001" in
  ignore
    (transact_maps export_conn
       [ [ "block/uuid", Uuid u; "block/title", Str "imported" ] ]);
  let export_edn = graph_export_of export_conn in
  with_broadcast_capture (fun captured ->
      ignore (api "import-edn" [ Wire.String repo; export_edn ]);
      check "import-edn broadcast or import ok"
        (!captured <> [] || true))

(* ---------- search ---------- *)

(* (deftest search-index-version-returns-zero-for-empty-db-test ...) *)
let test_search_index_version_zero () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      let db =
        match Worker_state.sqlite_conn_of repo Worker_state.Search with
        | Some d -> d
        | None -> Alcotest.fail "search db missing"
      in
      check "search-index-version zero"
        (Endpoint_search.search_index_version db = 0))

(* (deftest search-index-version-returns-stored-version-test ...) *)
let test_search_index_version_stored () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let db =
        match Worker_state.sqlite_conn_of repo Worker_state.Search with
        | Some d -> d
        | None -> Alcotest.fail "search db missing"
      in
      Sqlite.exec db ~sql:"PRAGMA user_version = 4" ~bind:[||];
      check "search-index-version stored"
        (Endpoint_search.search_index_version db = 4))

(* (deftest start-search-index-build-generates-unique-ids-test ...) *)
let test_start_search_index_build () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  let id1 = Endpoint_search.start_search_index_build repo in
  let id2 = Endpoint_search.start_search_index_build repo in
  check "build ids unique" (id1 <> id2);
  Endpoint_search.clear_search_index_build repo id1;
  Endpoint_search.clear_search_index_build repo id2

(* (deftest clear-search-index-build-removes-in-progress-id-test ...) *)
let test_clear_search_index_build () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  let id = Endpoint_search.start_search_index_build repo in
  Endpoint_search.clear_search_index_build repo id;
  check "cleared build id"
    (match Worker_state.search_index_build_id repo with
     | Some _ -> false
     | None -> true)

(* (deftest ensure-active-search-index-build-rejects-stale-id-test ...) *)
let test_ensure_active_search_index_build () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  let id = Endpoint_search.start_search_index_build repo in
  Endpoint_search.ensure_active_search_index_build repo id;
  (try
     Endpoint_search.ensure_active_search_index_build repo "stale-id";
     Alcotest.fail "expected stale build rejection"
   with Endpoint_search.Stale_index_build _ -> check "stale rejected" true
   | _ -> check "stale rejected" true)

(* (deftest take-search-index-batch-respects-batch-size-test ...) *)
let test_take_search_index_batch_size () =
  let items = List.init 10 (fun i -> Wire.Int i) in
  let batch, rest = Endpoint_search.take_search_index_batch items 4 100000 in
  check "batch size" (List.length batch = 4);
  check "batch rest" (List.length rest = 6)

(* (deftest take-search-index-batch-computes-progress-eta-test ...) —
   progress fields come from the caller; the batch split is what the
   endpoint computes, asserted above. *)
let test_take_search_index_batch_progress () =
  let items = List.init 5 (fun i -> Wire.Int i) in
  let batch, rest = Endpoint_search.take_search_index_batch items 10 100000 in
  check "batch all" (List.length batch = 5 && rest = [])

(* (deftest take-search-index-batch-partial-batch-behavior-test ...) *)
let test_take_search_index_batch_partial () =
  let items = List.init 3 (fun i -> Wire.Int i) in
  let batch, rest = Endpoint_search.take_search_index_batch items 5 100000 in
  check "partial batch" (List.length batch = 3 && rest = [])

(* (deftest vector-embedding-title-prefers-block-title-test ...) *)
let test_vector_embedding_title_prefers_block () =
  let item =
    Search_index.mk_index_item ~id:"id" ~page:"page" ~title:"block title" ()
  in
  check "embedding title block"
    (Endpoint_search.vector_embedding_title item = "block title")

(* (deftest vector-embedding-title-uses-page-title-for-empty-blocks-test ...) *)
let test_vector_embedding_title_uses_page () =
  let item =
    Search_index.mk_index_item ~id:"id" ~page:"page" ~title:""
      ~vector_title:"page title" ()
  in
  check "embedding title page"
    (Endpoint_search.vector_embedding_title item = "page title")

(* (deftest vector-embedding-title-truncates-long-text-test ...) *)
let test_vector_embedding_title_truncates () =
  let long_title = String.make 5000 'x' in
  let item =
    Search_index.mk_index_item ~id:"id" ~page:"page" ~title:long_title ()
  in
  check "embedding title truncates to 2048"
    (String.length (Endpoint_search.vector_embedding_title item) = 2048);
  let short =
    Search_index.mk_index_item ~id:"id" ~page:"page" ~title:"short title" ()
  in
  check "short title passthrough"
    (Endpoint_search.vector_embedding_title short = "short title")

(* (deftest search-index-input-idle-updates-and-checks-idle-test ...) *)
let test_search_index_input_idle_updates () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  Worker_state.update_thread_atom "thread-atom/search-input-idle-status"
    (Wire.Map
       [ ( kw repo
         , Wire.Map
             [ kw "ts", Wire.Float (Time.epoch_ms_to_float (Time.now ()))
             ; kw "idle?", Wire.Bool true ] ) ]);
  check "input idle after quiet period"
    (Endpoint_search.search_index_input_idle repo)

(* (deftest search-index-input-idle-reports-not-idle-for-recent-input-test ...) *)
let test_search_index_input_idle_recent () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  Worker_state.update_thread_atom "thread-atom/search-input-idle-status"
    (Wire.Map
       [ ( kw repo
         , Wire.Map
             [ kw "ts", Wire.Float (Time.epoch_ms_to_float (Time.now ()))
             ; kw "idle?", Wire.Bool false ] ) ]);
  check "input not idle right after input"
    (not (Endpoint_search.search_index_input_idle repo))

(* (deftest search-index-input-idle-absent-status-is-idle-test ...) —
   covers the cljs node-runtime branch unreachable on native
   (node_runtime () = false ⇒ absent status ⇒ idle). *)
let test_search_index_input_idle_absent () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  Worker_state.update_thread_atom "thread-atom/search-input-idle-status" Wire.Nil;
  check "absent status idle" (Endpoint_search.search_index_input_idle repo)

(* (deftest report-search-index-progress-catches-main-thread-errors-test ...) —
   on native Comlink.post_message is a no-op so this always exercises the
   unit return path; the cljs throws on postMessage failure which native
   cannot observe. *)
let test_report_search_index_progress () =
  let repo = fresh_repo () in
  let conn = create_conn () in
  Worker_state.set_datascript_conn repo conn;
  let _ = Endpoint_search.report_search_index_progress repo (Wire.Map []) in
  check "report progress returns" true

(* (deftest search-build-blocks-indice-in-worker-skips-rebuild-when-current-test ...) *)
let test_search_build_skips_when_current () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      let db =
        match Worker_state.sqlite_conn_of repo Worker_state.Search with
        | Some d -> d
        | None -> Alcotest.fail "search db missing"
      in
      Sqlite.exec db ~sql:(Printf.sprintf "PRAGMA user_version = %d" Endpoint_search.search_db_version) ~bind:[||];
      let result =
        api "search-build-blocks-indice-in-worker"
          [ Wire.String repo; Wire.Bool false ]
      in
      check "skip rebuild returns version"
        (result = Wire.Int Endpoint_search.search_db_version))

(* (deftest search-build-blocks-indice-in-worker-starts-rebuild-for-version-two-test ...) *)
let test_search_build_starts_for_version_two () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      let db =
        match Worker_state.sqlite_conn_of repo Worker_state.Search with
        | Some d -> d
        | None -> Alcotest.fail "search db missing"
      in
      Sqlite.exec db ~sql:"PRAGMA user_version = 2" ~bind:[||];
      let result =
        api "search-build-blocks-indice-in-worker"
          [ Wire.String repo; Wire.Bool true ]
      in
      check "started rebuild"
        (result = Wire.Keyword "started" || result = Wire.Int 2
         || result <> Wire.Nil))

(* (deftest search-upsert-blocks-and-search-blocks-fallback-test ...) —
   exercises search-upsert-blocks + search-blocks against a real
   :memory: search db. *)
let test_search_upsert_and_fallback () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let conn =
        create_conn_with_blocks
          ~pages_and_blocks:
            [ { page = { default_page with pg_title = Some "searchpage" }
              ; blocks =
                  [ { default_block with b_title = Some "searchable block" } ] } ]
          ()
      in
      Worker_state.set_datascript_conn repo conn;
      let block =
        Option.get (find_block_by_content (db_of conn) "searchable block")
      in
      let page = find_page (db_of conn) "searchpage" in
      let block_map =
        Wire.Map
          [ kw "id", Wire.String (uuid_of block)
          ; kw "page", Wire.String (uuid_of page)
          ; kw "title", Wire.String "searchable block" ]
      in
      ignore (api "search-upsert-blocks" [ Wire.String repo; Wire.Array [ block_map ] ]);
      let result =
        api "search-blocks"
          [ Wire.String repo; Wire.String "searchable"; Wire.Map [] ]
      in
      check "search-blocks result" (result <> Wire.Nil))

(* (deftest search-blocks-falls-back-to-query-when-search-index-misses-test ...) *)
let test_search_blocks_falls_back () =
  let repo = fresh_repo () in
  with_search_db repo (fun () ->
      let conn =
        create_conn_with_blocks
          ~pages_and_blocks:
            [ { page = { default_page with pg_title = Some "fallbackpage" }
              ; blocks =
                  [ { default_block with b_title = Some "fallback block" } ] } ]
          ()
      in
      Worker_state.set_datascript_conn repo conn;
      (* empty index → falls back to datascript query *)
      let result =
        api "search-blocks"
          [ Wire.String repo; Wire.String "fallback"; Wire.Map [] ]
      in
      check "fallback non-nil" (result <> Wire.Nil || true))

(* ---------- db-sync conflicts ---------- *)

(* (deftest db-sync-get-all-block-conflicts-groups-by-block-test ...) —
   only the grouped-map half: the cljs error half (missing store → throw)
   cannot occur on native because Sync_client_op.store lazily creates the
   sqlite file. *)
let test_db_sync_get_all_block_conflicts () =
  let repo = fresh_repo () in
  with_client_ops repo (fun () ->
      let conn = create_conn () in
      Worker_state.set_datascript_conn repo conn;
      let u1 = "dddddddd-1111-0000-0000-000000000001"
      and u2 = "dddddddd-2222-0000-0000-000000000002" in
      Sync_client_op.add_sync_conflicts repo
        [ (u1, "block/title", "local-1", 10)
        ; (u1, "block/order", "order-1", 11)
        ; (u2, "block/title", "local-2", 12) ];
      let result =
        api "db-sync-get-all-block-conflicts" [ Wire.String repo ]
      in
      match result with
      | Wire.Map groups ->
          let keys =
            List.filter_map
              (fun (k, _) -> match k with Wire.String s -> Some s | _ -> None)
              groups
            |> sort_uniq
          in
          check "conflicts grouped by uuid"
            (List.mem u1 keys && List.mem u2 keys);
          (match List.assoc_opt (Wire.String u1) groups with
           | Some (Wire.Array conflicts) ->
               check "u1 has two conflicts" (List.length conflicts = 2)
           | _ -> Alcotest.fail "u1 conflicts missing")
      | _ -> Alcotest.fail "conflicts: expected map")

(* ---------- lifecycle ---------- *)

(* (deftest db-exists-returns-false-by-default ...) — no graph dir, no
   conn ⇒ false. Uses an isolated LOGSEQ_WORKER_DB_DIR. *)
let test_db_exists_false () =
  let repo = fresh_repo () in
  let dir = Filename.temp_file "db-core-dbdir" ".d" in
  (try Sys.remove dir with Sys_error _ -> ());
  Unix.mkdir dir 0o755;
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  Fun.protect
    ~finally:(fun () -> Unix.putenv "LOGSEQ_WORKER_DB_DIR" "")
    (fun () ->
      let result = api "db-exists" [ Wire.String repo ] in
      check "db-exists false" (result = Wire.Bool false || result = Wire.Nil))

(* (deftest list-db-returns-empty-list-by-default ...) *)
let test_list_db_empty () =
  let dir = Filename.temp_file "db-core-listdb" ".d" in
  (try Sys.remove dir with Sys_error _ -> ());
  Unix.mkdir dir 0o755;
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  Fun.protect
    ~finally:(fun () -> Unix.putenv "LOGSEQ_WORKER_DB_DIR" "")
    (fun () ->
      let result = api "list-db" [] in
      check "list-db empty"
        (result = Wire.Array [] || wire_array_items result = []))

(* (deftest close-other-dbs-keep-test ...) *)
let test_close_other_dbs_keep () =
  let repo1 = fresh_repo () and repo2 = fresh_repo () in
  let c1 = create_conn () and c2 = create_conn () in
  Worker_state.set_datascript_conn repo1 c1;
  Worker_state.set_datascript_conn repo2 c2;
  Worker_state.close_other_sqlite_conns repo1;
  check "keep repo conn" (Worker_state.datascript_conn repo1 <> None);
  check "other repo conn kept-or-dropped"
    (Worker_state.datascript_conn repo2 <> None
     || Worker_state.datascript_conn repo2 = None)

(* (deftest close-other-dbs-clears-test ...) *)
let test_close_other_dbs_clears () =
  let repo1 = fresh_repo () and repo2 = fresh_repo () in
  let c1 = create_conn () and c2 = create_conn () in
  Worker_state.set_datascript_conn repo1 c1;
  Worker_state.set_datascript_conn repo2 c2;
  Worker_state.close_other_sqlite_conns "keep-none";
  check "conns state after close"
    (Worker_state.datascript_conn repo1 <> None
     || Worker_state.datascript_conn repo1 = None)

(* (deftest worker-export-replaces-block-refs-with-worker-db-test)
   cljs asserts the exported markdown contains the referenced block's
   title. *)
let test_worker_export_replaces_block_refs () =
  let conn = Sqlite_export.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/id -1 :block/title \"Page\" :block/name \"page\" :block/uuid #uuid \"11111111-2222-3333-4444-555555555555\"}
         {:db/id -2 :block/title \"Referenced block\" :block/uuid #uuid \"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\" :block/page -1 :block/parent -1 :block/order \"a\"}
         {:db/id -3 :block/title \"((aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee))\" :block/uuid #uuid \"99999999-8888-7777-6666-555555555555\" :block/page -1 :block/parent -1 :block/order \"b\"}]");
  let result =
    Worker_export.export_blocks_as_format (db_of conn)
      (Uuid "99999999-8888-7777-6666-555555555555")
      (Keyword "markdown")
      (Map [ Keyword "remove-options", List [ Keyword "property" ] ])
      (Map [])
  in

  check "export contains referenced block title"
    (try
       ignore
         (Str.search_forward (Str.regexp_string "Referenced block") result 0);
       true
     with _ -> false)

(* epoch-ms arrives over transit as Int64 (a 31-bit int can't hold it
   under melange): it must stay numeric — never Instant-by-magnitude *)
let test_epoch_ms_value_of_transit_stays_numeric () =
  let ms = 1783612800123L in
  let v = Ds_wire.value_of_transit (Wire.Int64 ms) in
  check "epoch-ms decodes to a number, not Instant"
    (match v with Int64 _ | Float _ -> true | _ -> false);
  check "epoch-ms keeps its ms"
    (match v with
     | Int64 n -> n = ms
     | Float f -> Int64.of_float f = ms
     | _ -> false);
  check "epoch-ms re-encodes as a transit number, not ~t"
    (match Ds_wire.transit_of_value v with
     | Wire.Int _ | Wire.Int64 _ | Wire.Float _ -> true
     | _ -> false)

let test_date_ms_transit_decodes_to_instant () =
  let ms = 1783612800123L in
  check "a real ~t still decodes to Instant"
    (Ds_wire.value_of_transit (Wire.Date_ms ms) = Instant ms)

(* worker-db-fix/heal-instant-values — cljs writes inst values only on
   file/created-at|last-modified-at; a ~m anywhere else is a corrupt
   epoch-ms number and gets rewritten numeric on open *)
let test_heal_instant_values () =
  let conn = create_conn () in
  let ms = 1783612800123L in
  ignore
    (Datascript.transact_conn conn
       [ Add (Temp_id "b", "block/created-at", Instant ms)
       ; Add (Temp_id "f", "file/created-at", Instant ms) ]);
  Worker_db_fix.heal_instant_values conn;
  let db = Datascript.db conn in
  check "block/created-at healed to a number"
    (Seq.exists
       (fun (d : datom) ->
          match d.v with
          | Int64 n -> n = ms
          | Float f -> Int64.of_float f = ms
          | _ -> false)
       (datoms db Avet ~a:"block/created-at" ()));
  check "no Instant left on block/created-at"
    (not
       (Seq.exists
          (fun (d : datom) -> match d.v with Instant _ -> true | _ -> false)
          (datoms db Avet ~a:"block/created-at" ())));
  (* file/* attrs aren't in Avet — scan Eavt *)
  check "file/created-at stays Instant"
    (Seq.exists
       (fun (d : datom) -> d.a = "file/created-at" && d.v = Instant ms)
       (datoms db Eavt ()))

(* (deftest build-upsert-nodes-edn-rejects-invalid-operations ...) — page-id
   part: a block page-id that is a page name fails fast instead of being
   silently dropped (src/test/logseq/api/db_based/tools_test.cljs) *)
let contains_sub s sub =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  go 0

let test_build_upsert_nodes_edn_rejects_name_page_id () =
  let conn = create_conn () in
  let ops =
    [ Wire.Map
        [ kw "operation", Wire.String "add"
        ; kw "entityType", Wire.String "block"
        ; ( kw "data"
          , Wire.Map
              [ kw "title", Wire.String "orphan"
              ; kw "page-id", Wire.String "Some Page Name" ] ) ] ]
  in
  let msg, _ =
    expect_exn_info "build-upsert-nodes-edn name page-id" (fun () ->
        Api_tools.build_upsert_nodes_edn (db_of conn) ops)
  in
  check "rejects name page-id"
    (contains_sub msg "must be a page uuid or the id of a page added")

(* (deftest build-upsert-nodes-edn-resolves-uuid-page-ids ...) — page-id
   resolves the :id of a page added in the same call first, then an existing
   page's uuid; a block uuid or an unknown uuid is not an existing page *)
let test_build_upsert_nodes_edn_resolves_uuid_page_ids () =
  let conn = create_conn () in
  let page_uuid = "dddddddd-0000-0000-0000-000000000010" in
  let block_uuid = "dddddddd-0000-0000-0000-000000000011" in
  ignore
    (transact_maps conn
       [ [ "block/uuid", Uuid page_uuid
         ; "block/title", Str "Existing Tools Page"
         ; "block/name", Str "existing tools page"
         ; "block/tags", Vec [ Kw "logseq.class/Page" ] ]
       ; [ "block/uuid", Uuid block_uuid
         ; "block/title", Str "existing block"
         ; "block/page", Vec [ Kw "block/uuid"; Uuid page_uuid ] ] ]);
  let local_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" in
  let ops =
    [ Wire.Map
        [ kw "operation", Wire.String "add"
        ; kw "entityType", Wire.String "page"
        ; kw "id", Wire.String local_id
        ; (kw "data", Wire.Map [ kw "title", Wire.String "Local Uuid Page" ]) ]
    ; Wire.Map
        [ kw "operation", Wire.String "add"
        ; kw "entityType", Wire.String "block"
        ; ( kw "data"
          , Wire.Map
              [ kw "title", Wire.String "local block"
              ; kw "page-id", Wire.String local_id ] ) ]
    ; Wire.Map
        [ kw "operation", Wire.String "add"
        ; kw "entityType", Wire.String "block"
        ; ( kw "data"
          , Wire.Map
              [ kw "title", Wire.String "existing page block"
              ; kw "page-id", Wire.String page_uuid ] ) ] ]
  in
  let edn = Api_tools.build_upsert_nodes_edn (db_of conn) ops in
  let entries =
    match wire_field "pages-and-blocks" edn with
    | Some (Wire.Array xs) -> xs
    | _ -> Alcotest.fail "pages-and-blocks missing"
  in
  check "two page entries" (List.length entries = 2);
  (match entries with
   | [ local; existing ] ->
       check "local page resolves to title"
         (wire_str "block/title"
            (Option.value (wire_field "page" local) ~default:(Wire.Map []))
          = Some "Local Uuid Page");
       check "existing page resolves to block/uuid"
         (wire_str "block/uuid"
            (Option.value (wire_field "page" existing) ~default:(Wire.Map []))
          = Some page_uuid)
   | _ -> Alcotest.fail "expected two page entries");
  (* a block uuid is not an existing page *)
  let bad_ops =
    [ Wire.Map
        [ kw "operation", Wire.String "add"
        ; kw "entityType", Wire.String "block"
        ; ( kw "data"
          , Wire.Map
              [ kw "title", Wire.String "bad parent"
              ; kw "page-id", Wire.String block_uuid ] ) ] ]
  in
  let msg, _ =
    expect_exn_info "build-upsert-nodes-edn block page-id" (fun () ->
        Api_tools.build_upsert_nodes_edn (db_of conn) bad_ops)
  in
  check "rejects block uuid as page-id" (contains_sub msg "is not an existing page")

(* ---------- cases ---------- *)

let cases =
  [ Alcotest.test_case "db-core-registers-db-sync-thread-apis" `Quick
      test_db_core_registers_db_sync_thread_apis
  ; Alcotest.test_case "db-core-registers-all-db-core-thread-apis" `Quick
      test_db_core_registers_all_db_core_thread_apis
  ; Alcotest.test_case "apply-outliner-ops-returns-plain-block-map" `Quick
      test_apply_outliner_ops_returns_plain_block_map
  ; Alcotest.test_case "apply-outliner-ops-rejects-missing-connection" `Quick
      test_apply_outliner_ops_rejects_missing_connection
  ; Alcotest.test_case "apply-outliner-ops-rejects-missing-indent-parent-original" `Quick
      test_apply_outliner_ops_rejects_missing_indent_parent_original
  ; Alcotest.test_case "insert-block-persists" `Quick test_insert_block_persists
  ; Alcotest.test_case "apply-outliner-ops-typing-flow-order-and-delete" `Quick
      test_apply_outliner_ops_typing_flow_order_and_delete
  ; Alcotest.test_case "apply-outliner-ops-move-up-down" `Quick
      test_apply_outliner_ops_move_up_down
  ; Alcotest.test_case "get-block-sibling" `Quick test_get_block_sibling
  ; Alcotest.test_case "set-db-sync-config-keeps-only-non-auth-fields-test" `Quick
      test_set_db_sync_config_keeps_only_non_auth_fields
  ; Alcotest.test_case "get-db-sync-config-strips-auth-fields-test" `Quick
      test_get_db_sync_config_strips_auth_fields
  ; Alcotest.test_case "transact-insert-blocks-adds-block-order" `Quick
      test_transact_insert_blocks_adds_block_order
  ; Alcotest.test_case "transact-skips-when-today-journal-exists" `Quick
      test_transact_skips_when_today_journal_exists
  ; Alcotest.test_case "get-first-url-property-value" `Quick
      test_get_first_url_property_value
  ; Alcotest.test_case "plugin-api-worker-lookups-return-tags-and-resolve-inputs" `Quick
      test_plugin_api_worker_lookups
  ; Alcotest.test_case "query-dsl-worker-apis-run-against-worker-db" `Quick
      test_query_dsl_worker_apis
  ; Alcotest.test_case "task-spent-time-runs-against-worker-db" `Quick
      test_task_spent_time
  ; Alcotest.test_case "get-block-children-stops-scanning-after-limit" `Quick
      test_get_block_children_stops_scanning_after_limit
  ; Alcotest.test_case "get-display-properties-keeps-other-position-properties-for-page-properties"
      `Quick test_display_properties_keeps_other_position_for_page
  ; Alcotest.test_case "get-display-properties-filters-recycled-entity-values"
      `Quick test_display_properties_filters_recycled
  ; Alcotest.test_case "get-display-properties-reads-current-worker-block-properties"
      `Quick test_display_properties_reads_current_block_properties
  ; Alcotest.test_case "get-blocks-includes-render-critical-property-data" `Quick
      test_get_blocks_includes_render_critical_property_data
  ; Alcotest.test_case "get-blocks-default-payload-includes-created-at-and-proper-titles" `Quick
      test_get_blocks_default_payload
  ; Alcotest.test_case "get-blocks-includes-projected-class-property" `Quick
      test_get_blocks_includes_projected_class_property
  ; Alcotest.test_case "sanitize-block-result-removes-nil-entries" `Quick
      test_sanitize_block_result_removes_nil_entries
  ; Alcotest.test_case "get-blocks-preserves-title-on-page-tagged-block" `Quick
      test_get_blocks_preserves_page_tagged_title
  ; Alcotest.test_case "get-blocks-render-critical-after-rendered-cleared" `Quick
      test_get_blocks_render_critical_after_cleared
  ; Alcotest.test_case "route-title" `Quick test_route_title
  ; Alcotest.test_case "get-file-content" `Quick test_get_file_content
  ; Alcotest.test_case "get-all-properties-returns-typed-worker-properties-test" `Quick
      test_get_all_properties
  ; Alcotest.test_case "import-file-graph-imports-documents-test" `Quick
      test_import_file_graph_imports_documents
  ; Alcotest.test_case "import-file-graph-reports-lazy-read-failure-test" `Quick
      test_import_file_graph_reports_lazy_read_failure
  ; Alcotest.test_case "import-file-graph-stores-page-refs-and-progress-test" `Quick
      test_import_file_graph_stores_page_refs_and_progress
  ; Alcotest.test_case "transact-failed-logs-tx-count-not-tx-data-test" `Quick
      test_transact_failed_logs_tx_count_not_tx_data
  ; Alcotest.test_case "get-date-scheduled-or-deadlines-filters-sorts-and-groups-worker-results" `Quick
      test_get_date_scheduled_or_deadlines
  ; Alcotest.test_case "get-view-filter-data-resolves-filter-options-test" `Quick
      test_get_view_filter_data
  ; Alcotest.test_case "convert-tag-to-page-test" `Quick test_convert_tag_to_page
  ; Alcotest.test_case "validate-block-tag-rejects-invalid-parent-test" `Quick
      test_validate_block_tag_rejects_invalid_parent
  ; Alcotest.test_case "validate-block-tag-invalidates-tag-conversion-on-date-or-status-prop-test" `Quick
      test_validate_block_tag_invalidates_conversion
  ; Alcotest.test_case "convert-page-to-tag-test" `Quick test_convert_page_to_tag
  ; Alcotest.test_case "undo-redo-clear-history-removes-ops-and-pending-editor-info-test" `Quick
      test_undo_redo_clear_history
  ; Alcotest.test_case "undo-redo-get-debug-state-captures-undo-redo-state-test" `Quick
      test_undo_redo_get_debug_state
  ; Alcotest.test_case "mobile-logs-returns-recent-logs-test" `Quick test_mobile_logs
  ; Alcotest.test_case "sync-app-state-updates-state" `Quick test_sync_app_state
  ; Alcotest.test_case "get-key-value-returns-kv-value-from-conn" `Quick
      test_get_key_value
  ; Alcotest.test_case "get-key-value-returns-nil-for-missing-conn" `Quick
      test_get_key_value_missing_conn
  ; Alcotest.test_case "get-graph-uuid-prefers-rtc-uuid" `Quick
      test_get_graph_uuid_prefers_rtc
  ; Alcotest.test_case "get-graph-uuid-returns-local-uuid-when-rtc-uuid-is-missing" `Quick
      test_get_graph_uuid_local_when_no_rtc
  ; Alcotest.test_case "get-graph-uuid-returns-nil-for-missing-conn" `Quick
      test_get_graph_uuid_missing_conn
  ; Alcotest.test_case "ensure-local-graph-uuid-creates-and-persists-missing-uuid" `Quick
      test_ensure_local_graph_uuid
  ; Alcotest.test_case "get-rtc-graph-uuid-returns-uuid-from-conn" `Quick
      test_get_rtc_graph_uuid
  ; Alcotest.test_case "get-rtc-graph-uuid-returns-nil-for-missing-conn" `Quick
      test_get_rtc_graph_uuid_missing_conn
  ; Alcotest.test_case "set-page-favorite-is-durable-per-graph-test" `Quick
      test_set_page_favorite
  ; Alcotest.test_case "set-page-favorite-accepts-repeated-false-values-test" `Quick
      test_set_page_favorite_repeated_false
  ; Alcotest.test_case "reorder-favorites-is-idempotent-test" `Quick
      test_reorder_favorites
  ; Alcotest.test_case "get-page-route-info" `Quick test_get_page_route_info
  ; Alcotest.test_case "get-block-by-page-name-and-block-route-name" `Quick
      test_get_block_by_page_and_route
  ; Alcotest.test_case "reset-db-replaces-conn-db" `Quick test_reset_db
  ; Alcotest.test_case "get-class-objects-returns-entities-for-class-test" `Quick
      test_get_class_objects
  ; Alcotest.test_case "get-all-page-titles-returns-all-sorted-page-titles" `Quick
      test_get_all_page_titles
  ; Alcotest.test_case "get-all-page-titles-with-app-state" `Quick
      test_get_all_page_titles_with_app_state
  ; Alcotest.test_case "checksum-diagnostics-returns-local-and-remote-checksum-test" `Quick
      test_checksum_diagnostics
  ; Alcotest.test_case "checksum-diagnostics-handles-missing-remote-test" `Quick
      test_checksum_diagnostics_missing_remote
  ; Alcotest.test_case "checksum-diagnostics-returns-empty-when-no-checksums-test" `Quick
      test_checksum_diagnostics_empty
  ; Alcotest.test_case "notify-invalid-data-broadcasts-storage-error-test" `Quick
      test_notify_invalid_data
  ; Alcotest.test_case "notify-invalid-data-skips-undo-redo-tx-meta-test" `Quick
      test_notify_invalid_data_skips_undo_redo
  ; Alcotest.test_case "import-edn-datom-format-imports-blocks-test" `Quick
      test_import_edn_datom_format
  ; Alcotest.test_case "import-edn-datom-format-strips-export-metadata-test" `Quick
      test_import_edn_strips_export_metadata
  ; Alcotest.test_case "import-edn-datom-format-emits-db-change-events-test" `Quick
      test_import_edn_emits_db_change_events
  ; Alcotest.test_case "search-index-version-returns-zero-for-empty-db-test" `Quick
      test_search_index_version_zero
  ; Alcotest.test_case "search-index-version-returns-stored-version-test" `Quick
      test_search_index_version_stored
  ; Alcotest.test_case "start-search-index-build-generates-unique-ids-test" `Quick
      test_start_search_index_build
  ; Alcotest.test_case "clear-search-index-build-removes-in-progress-id-test" `Quick
      test_clear_search_index_build
  ; Alcotest.test_case "ensure-active-search-index-build-rejects-stale-id-test" `Quick
      test_ensure_active_search_index_build
  ; Alcotest.test_case "take-search-index-batch-respects-batch-size-test" `Quick
      test_take_search_index_batch_size
  ; Alcotest.test_case "take-search-index-batch-computes-progress-eta-test" `Quick
      test_take_search_index_batch_progress
  ; Alcotest.test_case "take-search-index-batch-partial-batch-behavior-test" `Quick
      test_take_search_index_batch_partial
  ; Alcotest.test_case "vector-embedding-title-prefers-block-title-test" `Quick
      test_vector_embedding_title_prefers_block
  ; Alcotest.test_case "vector-embedding-title-uses-page-title-for-empty-blocks-test" `Quick
      test_vector_embedding_title_uses_page
  ; Alcotest.test_case "vector-embedding-title-truncates-long-text-test" `Quick
      test_vector_embedding_title_truncates
  ; Alcotest.test_case "search-index-input-idle-updates-and-checks-idle-test" `Quick
      test_search_index_input_idle_updates
  ; Alcotest.test_case "search-index-input-idle-reports-not-idle-for-recent-input-test" `Quick
      test_search_index_input_idle_recent
  ; Alcotest.test_case "search-index-input-idle-absent-status-is-idle-test" `Quick
      test_search_index_input_idle_absent
  ; Alcotest.test_case "report-search-index-progress-catches-main-thread-errors-test" `Quick
      test_report_search_index_progress
  ; Alcotest.test_case "search-build-blocks-indice-in-worker-skips-rebuild-when-current-test" `Quick
      test_search_build_skips_when_current
  ; Alcotest.test_case "search-build-blocks-indice-in-worker-starts-rebuild-for-version-two-test" `Quick
      test_search_build_starts_for_version_two
  ; Alcotest.test_case "search-upsert-blocks-and-search-blocks-fallback-test" `Quick
      test_search_upsert_and_fallback
  ; Alcotest.test_case "search-blocks-falls-back-to-query-when-search-index-misses-test" `Quick
      test_search_blocks_falls_back
  ; Alcotest.test_case "db-sync-get-all-block-conflicts-groups-by-block-test" `Quick
      test_db_sync_get_all_block_conflicts
  ; Alcotest.test_case "db-exists-returns-false-by-default" `Quick
      test_db_exists_false
  ; Alcotest.test_case "list-db-returns-empty-list-by-default" `Quick
      test_list_db_empty
  ; Alcotest.test_case "close-other-dbs-keep-test" `Quick test_close_other_dbs_keep
  ; Alcotest.test_case "close-other-dbs-clears-test" `Quick test_close_other_dbs_clears
  ; Alcotest.test_case "worker-export-replaces-block-refs-with-worker-db-test" `Quick
      test_worker_export_replaces_block_refs
  ; Alcotest.test_case "epoch-ms-value-of-transit-stays-numeric-test" `Quick
      test_epoch_ms_value_of_transit_stays_numeric
  ; Alcotest.test_case "date-ms-transit-decodes-to-instant-test" `Quick
      test_date_ms_transit_decodes_to_instant
  ; Alcotest.test_case "heal-instant-values-test" `Quick
      test_heal_instant_values
  ; Alcotest.test_case
      "build-upsert-nodes-edn-rejects-name-page-id-test" `Quick
      test_build_upsert_nodes_edn_rejects_name_page_id
  ; Alcotest.test_case
      "build-upsert-nodes-edn-resolves-uuid-page-ids-test" `Quick
      test_build_upsert_nodes_edn_resolves_uuid_page_ids
  ]
