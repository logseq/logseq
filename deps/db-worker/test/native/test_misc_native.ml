(* 1:1 translations of cljs unit tests for misc worker modules.

   Sources:
   - src/test/frontend/worker/migrate_test.cljs        -> migrate_cases
   - src/test/frontend/worker/plain_value_test.cljs    -> plain_value_cases
   - src/test/frontend/worker/commands_test.cljs       -> commands_cases
   - src/test/frontend/worker/publish_test.cljs        -> publish_cases
   - src/test/frontend/worker/state_test.cljs          -> state_cases
   - src/test/frontend/worker/worker_common_util_test.cljs
     -> worker_util_cases

   cljs deftest names are kept as OCaml test names.

   Skipped cljs cases:
   - (decode-graph-dir-name nil): OCaml Graph_dir.decode_graph_dir_name
     takes a string; the nil input has no port. The cljs assertion is
     documented here.

   cljs-with-redefs substitutions:
   - commands tests pin cljs-time.core/now; OCaml Commands.utc_now reads
     the real clock (Date_time_util.time_ms is not injectable). Tests
     snapshot now once and assert in whole units (minutes/hours/days/
     weeks) or via the same joda-style civil arithmetic the impl uses,
     so ms drift between the snapshot and the internal clock cannot
     flip a whole-unit expectation. The 2030 deadline fixture used by
     repeated-task-with-deadline-and-missing-temporal-property-test is
     in the future relative to any real clock, so its expected value is
     clock-independent.
   - resolve-recur-frequency-test redefs property-value-content,
     d/entity and build-property-value-block with a mock db; the port
     uses a real seeded conn and real entities.
   - double-plus-far-overdue-minute-is-bounded-test counts t/minutes
     calls via with-redefs to prove bounded iteration; OCaml has no
     hookable unit fn (repeat_next_timestamp takes a recur_unit), so
     only the observable outcome (next timestamp = now + 1 minute,
     computed without unbounded iteration) is asserted.
   - ensure-built-in-data-live-repair-assigns-canonical-revision: cljs
     registers worker-pipeline/transact-pipeline explicitly; OCaml
     Worker_pipeline only registers itself at module init when the
     module is linked, so the test installs
     Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline
     under try/finally restore (mirroring the cljs registration).
   - cljs entity-map fixtures asserting {:kv/value {:major .. :minor ..}}
     under non-ref :kv/value {} schema throw "nested entity attribute
     requires ref schema" in datascript-ocaml; the port emits the same
     datoms via [:db/add "v" :db/ident :logseq.kv/schema-version] +
     [:db/add "v" :kv/value {:major .. :minor ..}] vector ops instead.
   - migrate returns OCaml migrate_result {upgrade_reports}; the cljs
     :migrate-updates map on upgrade-report entries is not preserved in
     the port, so the ':properties [...]' migrate-updates assertions of
     migrate-65-30/-31 are dropped (the property-creation assertions
     they accompany are kept). The cljs (:db-after migration-report)
     for migrate-65-32 is upgrade_reports' first report's db_after.
   - run-commands: cljs commands/run-commands takes the tx_report; OCaml
     Commands.run_commands takes (db_after, tx_data) — the port passes
     report.db_after and report.tx_data.
   - ensure-built-in-data-exists!: cljs reads src/test/migration/
     64.8.transit via node fs; the port resolves the repo root by
     walking ancestors of the cwd looking for the fixture.
   - cljs create-conn-with-blocks transacts its fixture via raw
     d/transact! (deps/db sqlite-build/create-blocks). OCaml
     Sqlite_build.create_blocks transacts through Db_tx.transact —
     the worker transactor — which runs the malli validate hook
     (Worker_core registers Db_validate.validate_tx_report) and rejects
     the fixture's own generated blocks with "invalid dispatch value",
     and additionally its :build/properties path throws "Key in map must
     have a :db/ident" (spec maps store db/ident as Keyword but
     Block_map.string_attr only accepts String — breaks any builtin
     value_ref-type property like logseq.property.repeat/recur-frequency)
     and its :build/tags emits bare keyword elements the engine rejects
     for ref attrs ("Expected number or lookup ref"). The four fixtures
     that used create-conn-with-blocks (repeated-task-with-deadline and
     the three publish tests) instead emit the same entities via
     Datascript.transact_conn_string entity maps on the same
     Sqlite_export.create_conn seed — same graph, same d/transact!
     semantics.

   cljs-vs-OCaml divergences asserted where observable:
   - state_test: Sync_state.online on native always returns true
     (Runtime_env.kind () = Native never consults the
     thread-atom/online-event atom — native plays the cljs :node role).
     All three cljs cases assert their node-runtime observable truth
     (online) here; the web-runtime atom-driven branch has no native
     counterpart.

   Known lib/engine bugs kept red (documented, no workarounds):
   - Graph_dir.pool_name trims BEFORE stripping the logseq_db_ prefix;
     cljs get-pool-name strips the prefix first, then trims. For
     "  logseq_db_ space name  " OCaml yields "logseq-pool- space name"
     where cljs yields "logseq-pool-space name". The cljs expectation is
     asserted verbatim and fails red.
   - ensure-built-in-data-exists! (datascript-ocaml): the transit
     fixture src/test/migration/64.8.transit declares :block/uuid
     :db.unique/identity, but Ds_wire.serializable_db_of_transit ->
     Datascript.from_serializable loses the unique flag, so the
     keep-item lookup ref [:block/uuid #uuid ...] throws "Lookup ref
     attribute should be marked as :db/unique".
   - migrate-65-* upgrade cases (lib/db_migrate.ml): migrate appends
     ensure_built_in_data_exists, whose seed_initial_data composes
     properties_tx @ classes_tx but never emits the bootstrap_class_ids
     (Root/Property/Tag/Page/Template idents) that
     Sqlite_create_graph.initial_tx_data emits first; on a bare-schema
     conn property maps referencing :logseq.class/Property by ident
     throw "ident did not resolve" in transact.ml resolve_entity_ref. *)

open Datascript
open Test_shared

(* ---------- shared helpers ---------- *)

(* cljs (d/q '[:find [?e ...] :in $ ?attr :where [?e ?attr]] db attr) *)
let entities_with (db : db) (a : attr) : entity_id list =
  match
    Datascript.q_string ~inputs:[ Arg_scalar (Result_attr a) ] db
      "[:find [?e ...] :in $ ?attr :where [?e ?attr]]"
  with
  | [ row ] ->
      List.filter_map
        (function
          | Result_entity id -> Some id
          | Result_value (Int id) -> Some id
          | _ -> None)
        row
  | _ -> []

(* cljs (set (map :db/ident (:block/tags e))) *)
let tag_idents (e : entity) : string list =
  sort_uniq (List.filter_map Ldb.ident_of (Ldb.ref_ents e "block/tags"))

(* cljs ref-ids: (set (map :db/id refs)) *)
let ref_id_set (e : entity) (a : attr) : int list =
  List.sort_uniq compare (Ldb.ref_ids e a)

let ident_of_ref (e : entity) (a : attr) : string option =
  match Ldb.ref_ent e a with Some r -> Ldb.ident_of r | None -> None

(* cljs (:kv/value (d/entity db ident)) read as {:major _ :minor _} *)
let kv_version (db : db) (ident : string) : (int * int) option =
  match entity db (Ident ident) with
  | Some e -> (
      match Ldb.value e "kv/value" with
      | Some (Map kvs) ->
          let get k =
            List.find_map
              (function
                | Keyword k', Int n when k' = k -> Some n | _ -> None)
              kvs
          in
          (match get "major", get "minor" with
           | Some maj, Some minor -> Some (maj, minor)
           | Some maj, None -> Some (maj, 0)
           | _ -> None)
      | _ -> None)
  | None -> None

let kv_value (db : db) (ident : string) : value option =
  match entity db (Ident ident) with
  | Some e -> Ldb.value e "kv/value"
  | None -> None

(* cljs (merge db-schema/schema extra-schema) *)
let schema_with (extra_edn : string) : schema =
  Datascript.schema_of_edn_string extra_edn @ Db_schema.schema ()

(* cljs (d/create-conn (merge db-schema/schema extra)) *)
let create_conn_with_schema (s : schema) : conn =
  Datascript.create_conn ~schema:s ()

let e_at_uuid (db : db) (uuid : string) : entity option =
  entity db (Lookup_ref ("block/uuid", Uuid uuid))

(* ---------- migrate_test.cljs ---------- *)

(* cljs delete-property-schema *)
let delete_property_schema () : schema =
  schema_with
    "{:user.property/obsolete {:db/index true}
      :logseq.property/view-for {:db/valueType :db.type/ref}
      :logseq.property.view/type {:db/valueType :db.type/ref}
      :logseq.property.view/feature-type {}
      :logseq.property.history/block {:db/valueType :db.type/ref}
      :logseq.property.history/property {:db/valueType :db.type/ref}
      :logseq.property.history/scalar-value {}}"

(* cljs legacy-65-24-schema *)
let legacy_65_24_schema () : schema =
  schema_with
    "{:block/pre-block? {:db/index true}
      :logseq.property.embedding/hnsw-label {:db/index true}
      :logseq.property.embedding/hnsw-label-updated-at {:db/index true}}"

let test_delete_property_cleans_property_usages () =
  let conn = create_conn_with_schema (delete_property_schema ()) in
  let target_block_uuid = "11111111-1111-1111-1111-111111111111"
  and view_uuid = "22222222-2222-2222-2222-222222222222"
  and history_uuid = "33333333-3333-3333-3333-333333333333"
  and view_history_uuid = "44444444-4444-4444-4444-444444444444" in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.class/Property
          :block/title \"Property\"}
         {:db/ident :logseq.property.view/type.table
          :block/title \"Table View\"}
         {:db/ident :user.property/obsolete
          :block/title \"Obsolete property\"
          :block/tags #{:logseq.class/Property}}
         {:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"target block\"
          :user.property/obsolete \"stale value\"}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"view block\"
          :logseq.property/view-for :user.property/obsolete
          :logseq.property.view/type :logseq.property.view/type.table
          :logseq.property.view/feature-type :property}
         {:block/uuid #uuid \"33333333-3333-3333-3333-333333333333\"
          :block/title \"history\"
          :logseq.property.history/block [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
          :logseq.property.history/property :user.property/obsolete
          :logseq.property.history/scalar-value \"stale value\"}
         {:block/uuid #uuid \"44444444-4444-4444-4444-444444444444\"
          :block/title \"view history\"
          :logseq.property.history/block [:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"]
          :logseq.property.history/property :user.property/obsolete
          :logseq.property.history/scalar-value \"stale value\"}]");
  (* cljs (d/transact! conn (db-migrate/delete-property @conn prop)) *)
  ignore
    (Db_transact.transact conn
       (Db_migrate.delete_property (db_of conn) "user.property/obsolete")
       []);
  let db = db_of conn in
  check "delete-property: property entity gone"
    (entity db (Ident "user.property/obsolete") = None);
  check "delete-property: attr removed from usage block"
    (match e_at_uuid db target_block_uuid with
     | Some e -> Ldb.value e "user.property/obsolete" = None
     | None -> false);
  check "delete-property: view-for block retracted"
    (e_at_uuid db view_uuid = None);
  check "delete-property: history block retracted"
    (e_at_uuid db history_uuid = None);
  check "delete-property: view history block retracted"
    (e_at_uuid db view_history_uuid = None)

(* locate the repo root by walking ancestors for the migration fixture *)
let repo_file (rel : string) : string option =
  let rec find dir =
    let p = Filename.concat dir rel in
    if Sys.file_exists p then Some p
    else
      let parent = Filename.dirname dir in
      if parent = dir then None else find parent
  in
  find (Sys.getcwd ())

let read_file_string (p : string) : string =
  let ic = open_in_bin p in
  let s = really_input_string ic (in_channel_length ic) in
  close_in ic;
  s

(* cljs (d/conn-from-db (ldb/read-transit-str (fs/readFileSync ...))) *)
let conn_from_transit_fixture (rel : string) : conn option =
  match repo_file rel with
  | Some path ->
      let sdb =
        Ds_wire.serializable_db_of_transit
          (Transit_codec.of_string (read_file_string path))
      in
      Some (Datascript.conn_from_db (Datascript.from_serializable sdb))
  | None -> None

let test_ensure_built_in_data_exists () =
  match conn_from_transit_fixture "src/test/migration/64.8.transit" with
  | None -> check "ensure-built-in-data-exists!: transit fixture readable" false
  | Some conn ->
      let db = db_of conn in
      let initial_version =
        kv_value db "logseq.kv/graph-initial-schema-version"
      in
      let graph_created_at = kv_value db "logseq.kv/graph-created-at" in
      (* cljs (assert (= {:major 64 :minor 8} initial-version)) *)
      check "ensure-built-in-data-exists!: fixture is 64.8"
        (match initial_version with
         | Some (Map kvs) ->
             List.mem (Keyword "major", Int 64) kvs
             && List.mem (Keyword "minor", Int 8) kvs
         | _ -> false);
      check "ensure-built-in-data-exists!: graph-created-at present"
        (Option.is_some graph_created_at);
      ignore (Db_migrate.ensure_built_in_data_exists conn);
      let db' = db_of conn in
      check "ensure-built-in-data-exists!: initial version unchanged"
        (kv_value db' "logseq.kv/graph-initial-schema-version"
         = initial_version);
      check "ensure-built-in-data-exists!: graph-created-at unchanged"
        (kv_value db' "logseq.kv/graph-created-at" = graph_created_at)

let test_ensure_built_in_data_live_repair_assigns_canonical_revision () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"" ()));
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/retractEntity :logseq.property/icon]]");
  (* cljs (ldb/register-transact-pipeline-fn!
     worker-pipeline/transact-pipeline) in a try/finally restoring the
     previous fn *)
  let pipeline_before = !Db_tx.transact_pipeline_fn in
  Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline;
  (try
     ignore (Db_migrate.ensure_built_in_data_exists conn);
     match entity (db_of conn) (Ident "logseq.property/icon") with
     | Some icon ->
         check "live-repair: icon property recreated" true;
         check "live-repair: canonical revision assigned"
           (match Ldb.value icon "block/tx-id" with
            | Some (Int n) -> n >= 0
            | _ -> false)
     | None -> check "live-repair: icon property recreated" false
   with e ->
     Db_tx.transact_pipeline_fn := pipeline_before;
     raise e);
  Db_tx.transact_pipeline_fn := pipeline_before

let test_migrate_65_25_deletes_legacy_properties () =
  let conn = create_conn_with_schema (legacy_65_24_schema ()) in
  let legacy_block_uuid = "11111111-1111-1111-1111-111111111111" in
  let legacy_attrs =
    [ "block/pre-block?"
    ; "logseq.property.embedding/hnsw-label"
    ; "logseq.property.embedding/hnsw-label-updated-at" ]
  in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 24}]
         {:db/ident :logseq.property.embedding/hnsw-label
          :block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"HNSW label\"}
         {:db/ident :logseq.property.embedding/hnsw-label-updated-at
          :block/uuid #uuid \"33333333-3333-3333-3333-333333333333\"
          :block/title \"HNSW label updated-at\"}
         {:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"legacy block\"
          :block/pre-block? true
          :logseq.property.embedding/hnsw-label \"label\"
          :logseq.property.embedding/hnsw-label-updated-at 123}]");
  let db = db_of conn in
  check "65-25: legacy attrs present before migrate"
    (List.for_all (fun a -> entities_with db a <> []) legacy_attrs);
  check "65-25: hnsw-label ident exists"
    (entity db (Ident "logseq.property.embedding/hnsw-label") <> None);
  check "65-25: hnsw-label-updated-at ident exists"
    (entity db (Ident "logseq.property.embedding/hnsw-label-updated-at")
     <> None);
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 25 });
  let db' = db_of conn in
  check "65-25: schema-version bumped"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 25));
  check "65-25: legacy attrs gone"
    (List.for_all (fun a -> entities_with db' a = []) legacy_attrs);
  check "65-25: hnsw-label ident gone"
    (entity db' (Ident "logseq.property.embedding/hnsw-label") = None);
  check "65-25: hnsw-label-updated-at ident gone"
    (entity db' (Ident "logseq.property.embedding/hnsw-label-updated-at")
     = None);
  check "65-25: legacy block title kept"
    (match e_at_uuid db' legacy_block_uuid with
     | Some e -> Ldb.string_value e "block/title" = Some "legacy block"
     | None -> false)

let test_migrate_65_25_adds_repeat_type_property () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 25}]]");
  ignore (Db_migrate.migrate conn);
  let db' = db_of conn in
  check "65-25b: schema-version bumped to latest"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 33));
  match entity db' (Ident "logseq.property.repeat/repeat-type") with
  | None -> check "65-25b: repeat-type property created" false
  | Some property ->
      check "65-25b: repeat-type property created" true;
      check "65-25b: default-value is double-plus"
        (ident_of_ref property "logseq.property/default-value"
         = Some "logseq.property.repeat/repeat-type.double-plus");
      check "65-25b: closed values"
        (sort_uniq
           (List.filter_map Ldb.ident_of
              (Ldb.ref_ents property "property/closed-values"))
         = sort_uniq
             [ "logseq.property.repeat/repeat-type.dotted-plus"
             ; "logseq.property.repeat/repeat-type.plus"
             ; "logseq.property.repeat/repeat-type.double-plus" ])

let test_migrate_65_26_adds_comments_blocks_property () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 26}]]");
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 27 });
  let db' = db_of conn in
  check "65-26: schema-version 65.27"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 27));
  match entity db' (Ident "logseq.property.comments/blocks") with
  | None -> check "65-26: comments/blocks property created" false
  | Some property ->
      check "65-26: comments/blocks property created" true;
      check "65-26: title"
        (Ldb.string_value property "block/title" = Some "Commented blocks");
      check "65-26: type node"
        (Ldb.value property "logseq.property/type" = Some (Keyword "node"));
      check "65-26: hide? true"
        (Ldb.value property "logseq.property/hide?" = Some (Bool true));
      check "65-26: public? false"
        (Ldb.value property "logseq.property/public?" = Some (Bool false))

let test_migrate_65_28_tags_existing_comment_blocks () =
  let conn = Db_test_util.create_conn_bare () in
  let comments_area_uuid = "11111111-1111-1111-1111-111111111111"
  and first_comment_uuid = "22222222-2222-2222-2222-222222222222"
  and second_comment_uuid = "33333333-3333-3333-3333-333333333333"
  and ordinary_child_uuid = "44444444-4444-4444-4444-444444444444" in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 27}]
         {:db/ident :logseq.class/Comments
          :block/title \"Comments\"}
         {:db/ident :logseq.class/Task
          :block/title \"Task\"}
         {:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"Comments\"
          :block/tags #{:logseq.class/Comments}}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"first comment\"
          :block/parent [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]}
         {:block/uuid #uuid \"33333333-3333-3333-3333-333333333333\"
          :block/title \"second comment\"
          :block/parent [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
          :block/tags #{:logseq.class/Task}}
         {:block/uuid #uuid \"44444444-4444-4444-4444-444444444444\"
          :block/title \"ordinary child\"}]");
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 28 });
  let db' = db_of conn in
  check "65-28: schema-version 65.28"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 28));
  check "65-28: Comment class exists"
    (entity db' (Ident "logseq.class/Comment") <> None);
  check "65-28: first comment tagged Comment"
    (match e_at_uuid db' first_comment_uuid with
     | Some e -> tag_idents e = [ "logseq.class/Comment" ]
     | None -> false);
  check "65-28: second comment keeps Task + Comment"
    (match e_at_uuid db' second_comment_uuid with
     | Some e ->
         tag_idents e = [ "logseq.class/Comment"; "logseq.class/Task" ]
     | None -> false);
  check "65-28: comments area keeps Comments tag only"
    (match e_at_uuid db' comments_area_uuid with
     | Some e -> tag_idents e = [ "logseq.class/Comments" ]
     | None -> false);
  check "65-28: ordinary child untagged"
    (match e_at_uuid db' ordinary_child_uuid with
     | Some e -> Ldb.ref_ents e "block/tags" = []
     | None -> false)

let test_migrate_65_29_adds_single_block_comment_targets () =
  let conn = Db_test_util.create_conn_bare () in
  let target_uuid = "11111111-1111-1111-1111-111111111111"
  and comments_area_uuid = "22222222-2222-2222-2222-222222222222"
  and range_comments_uuid = "33333333-3333-3333-3333-333333333333"
  and range_target_uuid = "44444444-4444-4444-4444-444444444444" in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 28}]
         {:db/ident :logseq.class/Comments
          :block/title \"Comments\"}
         {:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"target\"}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"Comments\"
          :block/parent [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
          :block/tags #{:logseq.class/Comments}}
         {:block/uuid #uuid \"44444444-4444-4444-4444-444444444444\"
          :block/title \"range target\"}
         {:block/uuid #uuid \"33333333-3333-3333-3333-333333333333\"
          :block/title \"Comments\"
          :block/tags #{:logseq.class/Comments}}]");
  let db = db_of conn in
  let eid_of uuid = (Option.get (e_at_uuid db uuid)).id in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[[:db/add %d :logseq.property.comments/blocks %d]]"
          (eid_of range_comments_uuid) (eid_of range_target_uuid)));
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 29 });
  let db' = db_of conn in
  check "65-29: schema-version 65.29"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 29));
  let eid_of' uuid = (Option.get (e_at_uuid db' uuid)).id in
  check "65-29: comments area targets block"
    (match e_at_uuid db' comments_area_uuid with
     | Some e ->
         ref_id_set e "logseq.property.comments/blocks"
         = [ eid_of' target_uuid ]
     | None -> false);
  check "65-29: existing range comment targets preserved"
    (match e_at_uuid db' range_comments_uuid with
     | Some e ->
         ref_id_set e "logseq.property.comments/blocks"
         = [ eid_of' range_target_uuid ]
     | None -> false)

let test_migrate_65_27_with_missing_comments_built_ins_does_not_crash () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 27}]
         {:db/ident :logseq.class/Root
          :block/title \"Root Tag\"}]");
  let db = db_of conn in
  check "65-27: Comments class absent before"
    (entity db (Ident "logseq.class/Comments") = None);
  check "65-27: comments/blocks property absent before"
    (entity db (Ident "logseq.property.comments/blocks") = None);
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 33 });
  let db' = db_of conn in
  check "65-27: schema-version 65.33"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 33));
  check "65-27: Comments class created"
    (entity db' (Ident "logseq.class/Comments") <> None);
  check "65-27: Comment class created"
    (entity db' (Ident "logseq.class/Comment") <> None);
  check "65-27: comments/blocks property created"
    (entity db' (Ident "logseq.property.comments/blocks") <> None)

let test_migrate_65_30_adds_assignee_property () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 29}]]");
  let result =
    Db_migrate.migrate conn
      ~target_version:{ sv_major = 65; sv_minor = Some 30 }
  in
  let db' = db_of conn in
  check "65-30: schema-version 65.30"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 30));
  (match entity db' (Ident "logseq.property/assignee") with
   | None -> check "65-30: assignee property created" false
   | Some property ->
       check "65-30: assignee property created" true;
       check "65-30: title"
         (Ldb.string_value property "block/title" = Some "Assignee");
       check "65-30: type node"
         (Ldb.value property "logseq.property/type"
          = Some (Keyword "node"));
       check "65-30: cardinality many"
         (Ldb.value property "db/cardinality"
          = Some (Keyword "db.cardinality/many"));
       check "65-30: public? true"
         (Ldb.value property "logseq.property/public?" = Some (Bool true)));
  (* cljs also asserts (:migrate-updates <report>) =
     {:properties [:logseq.property/assignee]} — migrate-updates is not
     carried into the OCaml migrate_result; observable outcome checked
     instead. *)
  match result with
  | Some r -> check "65-30: upgrade ran" (r.upgrade_reports <> [])
  | None -> check "65-30: upgrade ran" false

let test_migrate_65_31_adds_agent_session_id_property () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 30}]]");
  let result =
    Db_migrate.migrate conn
      ~target_version:{ sv_major = 65; sv_minor = Some 31 }
  in
  let db' = db_of conn in
  check "65-31: schema-version 65.31"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 31));
  (match entity db' (Ident "logseq.property.agent/session-id") with
   | None -> check "65-31: session-id property created" false
   | Some property ->
       check "65-31: session-id property created" true;
       check "65-31: title"
         (Ldb.string_value property "block/title"
          = Some "Agent Session ID");
       check "65-31: type string"
         (Ldb.value property "logseq.property/type"
          = Some (Keyword "string"));
       check "65-31: public? true"
         (Ldb.value property "logseq.property/public?" = Some (Bool true));
       check "65-31: hide? true"
         (Ldb.value property "logseq.property/hide?" = Some (Bool true));
       check "65-31: description"
         (match Ldb.ref_ent property "logseq.property/description" with
          | Some d ->
              Ldb.string_value d "block/title"
              = Some "Stores the AgentBridge session ID for a routed task."
          | None -> false));
  match result with
  | Some r -> check "65-31: upgrade ran" (r.upgrade_reports <> [])
  | None -> check "65-31: upgrade ran" false

let test_migrate_65_32_adds_root_extends_to_comment_classes () =
  let conn = Db_test_util.create_conn_bare () in
  let target_uuid = "11111111-1111-1111-1111-111111111111"
  and comments_area_uuid = "22222222-2222-2222-2222-222222222222" in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 31}]
         {:db/ident :logseq.class/Root
          :block/title \"Root Tag\"}
         {:db/ident :logseq.class/Comments
          :block/title \"Comments\"
          :block/order \"a0\"}
         {:db/ident :logseq.class/Comment
          :block/title \"Comment\"
          :block/order \"a1\"}
         {:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"target\"}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"Comments\"
          :block/parent [:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"]
          :block/tags #{:logseq.class/Comments}}]");
  let result =
    Db_migrate.migrate conn
      ~target_version:{ sv_major = 65; sv_minor = Some 32 }
  in
  let db' = db_of conn in
  check "65-32: schema-version 65.32"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 32));
  (* cljs (first (:upgrade-result-coll result)) -> :db-after *)
  let migration_db =
    match result with
    | Some { upgrade_reports = Some report :: _; _ } -> Some report.db_after
    | _ -> None
  in
  let extends_idents (db : db) (ident : string) : string list =
    match entity db (Ident ident) with
    | Some e ->
        Ldb.ref_ents e "logseq.property.class/extends"
        |> List.filter_map Ldb.ident_of
    | None -> []
  in
  (match migration_db with
   | None -> check "65-32: migration report present" false
   | Some mdb ->
       check "65-32: migration report present" true;
       check "65-32: Comments extends Root"
         (extends_idents mdb "logseq.class/Comments"
          = [ "logseq.class/Root" ]);
       check "65-32: Comments block/order removed"
         (match entity mdb (Ident "logseq.class/Comments") with
          | Some e -> Ldb.value e "block/order" = None
          | None -> false);
       check "65-32: Comment extends Root"
         (extends_idents mdb "logseq.class/Comment"
          = [ "logseq.class/Root" ]);
       check "65-32: Comment block/order removed"
         (match entity mdb (Ident "logseq.class/Comment") with
          | Some e -> Ldb.value e "block/order" = None
          | None -> false);
       check "65-32: comments area targets block"
         (match
            ( e_at_uuid mdb comments_area_uuid,
              e_at_uuid mdb target_uuid )
          with
          | Some area, Some target ->
              ref_id_set area "logseq.property.comments/blocks"
              = [ target.id ]
          | _ -> false))

let test_migrate_65_33_adds_gallery_view_properties () =
  let conn = Db_test_util.create_conn_bare () in
  let property_idents =
    [ "logseq.property.view/gallery-asset-property"
    ; "logseq.property.view/gallery-display-properties"
    ; "logseq.property.view/gallery-card-size"
    ; "logseq.property.view/gallery-card-width"
    ; "logseq.property.view/gallery-card-height" ]
  in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add \"v\" :db/ident :logseq.kv/schema-version]
          [:db/add \"v\" :kv/value {:major 65 :minor 32}]]");
  let db = db_of conn in
  check "65-33: gallery properties absent before"
    (List.for_all (fun i -> entity db (Ident i) = None) property_idents);
  ignore
    (Db_migrate.migrate conn
       ~target_version:{ sv_major = 65; sv_minor = Some 33 });
  let db' = db_of conn in
  check "65-33: schema-version 65.33"
    (kv_version db' "logseq.kv/schema-version" = Some (65, 33));
  check "65-33: gallery properties created"
    (List.for_all (fun i -> entity db' (Ident i) <> None) property_idents);
  check "65-33: asset-property type :property"
    (match entity db' (Ident "logseq.property.view/gallery-asset-property")
     with
     | Some e ->
         Ldb.value e "logseq.property/type" = Some (Keyword "property")
     | None -> false);
  check "65-33: display-properties cardinality many"
    (match
       entity db' (Ident "logseq.property.view/gallery-display-properties")
     with
     | Some e ->
         Ldb.value e "db/cardinality"
         = Some (Keyword "db.cardinality/many")
     | None -> false);
  (match entity db' (Ident "logseq.property.view/gallery-card-size") with
   | Some e ->
       check "65-33: card-size type :keyword"
         (Ldb.value e "logseq.property/type" = Some (Keyword "keyword"));
       check "65-33: card-size scalar-default :default"
         (Ldb.value e "logseq.property/scalar-default-value"
          = Some (Keyword "default"))
   | None ->
       check "65-33: card-size type :keyword" false;
       check "65-33: card-size scalar-default :default" false);
  check "65-33: card width/height type :raw-number"
    (List.for_all
       (fun i ->
         match entity db' (Ident i) with
         | Some e ->
             Ldb.value e "logseq.property/type"
             = Some (Keyword "raw-number")
         | None -> false)
       [ "logseq.property.view/gallery-card-width"
       ; "logseq.property.view/gallery-card-height" ])

let migrate_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "delete-property-cleans-property-usages" `Quick
      test_delete_property_cleans_property_usages
  ; Alcotest.test_case "ensure-built-in-data-exists!" `Quick
      test_ensure_built_in_data_exists
  ; Alcotest.test_case
      "ensure-built-in-data-live-repair-assigns-canonical-revision"
      `Quick
      test_ensure_built_in_data_live_repair_assigns_canonical_revision
  ; Alcotest.test_case "migrate-65-25-deletes-legacy-properties" `Quick
      test_migrate_65_25_deletes_legacy_properties
  ; Alcotest.test_case "migrate-65-25-adds-repeat-type-property" `Quick
      test_migrate_65_25_adds_repeat_type_property
  ; Alcotest.test_case "migrate-65-26-adds-comments-blocks-property"
      `Quick test_migrate_65_26_adds_comments_blocks_property
  ; Alcotest.test_case "migrate-65-28-tags-existing-comment-blocks"
      `Quick test_migrate_65_28_tags_existing_comment_blocks
  ; Alcotest.test_case
      "migrate-65-29-adds-single-block-comment-targets" `Quick
      test_migrate_65_29_adds_single_block_comment_targets
  ; Alcotest.test_case
      "migrate-65-27-with-missing-comments-built-ins-does-not-crash"
      `Quick
      test_migrate_65_27_with_missing_comments_built_ins_does_not_crash
  ; Alcotest.test_case "migrate-65-30-adds-assignee-property" `Quick
      test_migrate_65_30_adds_assignee_property
  ; Alcotest.test_case "migrate-65-31-adds-agent-session-id-property"
      `Quick test_migrate_65_31_adds_agent_session_id_property
  ; Alcotest.test_case
      "migrate-65-32-adds-root-extends-to-comment-classes" `Quick
      test_migrate_65_32_adds_root_extends_to_comment_classes
  ; Alcotest.test_case "migrate-65-33-adds-gallery-view-properties"
      `Quick test_migrate_65_33_adds_gallery_view_properties ]

(* ---------- plain_value_test.cljs ---------- *)

(* cljs property-value-db: bare schema conn + build-db-initial-data
   (= Sqlite_export.create_conn), then the 4 entity maps. *)
let property_value_db ?(value_attrs = "") (property_type : string)
    (target : string) : db * entity * string * string =
  let conn = Sqlite_export.create_conn () in
  let target_uuid = "11111111-1111-1111-1111-111111111111"
  and value_uuid = "22222222-2222-2222-2222-222222222222"
  and host_uuid = "33333333-3333-3333-3333-333333333333" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1
            :db/ident :user.property/related
            :block/title \"Related\"
            :logseq.property/type %s
            :db/valueType :db.type/ref
            :db/cardinality :db.cardinality/one
            :block/tags :logseq.class/Property}
           {:db/id -2
            :block/uuid #uuid \"%s\"
            :block/title \"Target\"
            %s}
           {:db/id -3
            :block/uuid #uuid \"%s\"
            :block/title \"%s\"
            :logseq.property/created-from-property -1
            :block/parent -1
            :block/page -1
            %s}
           {:db/id -4
            :block/uuid #uuid \"%s\"
            :block/title \"Host\"
            :block/name \"host\"
            :block/tags :logseq.class/Page
            :user.property/related -3}]"
          property_type target_uuid target value_uuid target_uuid
          value_attrs host_uuid));
  let db = db_of conn in
  (db, Option.get (e_at_uuid db host_uuid), target_uuid, value_uuid)

(* cljs (:user.property/related (plain-value/entity-forward-map ...)) *)
let forward_map_get (k : string) (m : Wire.t) : (Wire.t * Wire.t) list =
  match m with
  | Wire.Map kvs -> (
      match wire_get k kvs with Some (Wire.Map m) -> m | _ -> [])
  | _ -> []

let test_node_property_values_resolve_their_target_entity () =
  (* cljs: "Page values are returned as the page, not the
     property-value wrapper" *)
  let db, host, target_uuid, _value_uuid =
    property_value_db ":node" ":block/name \"target\" :block/tags :logseq.class/Page"
  in
  let fm = Plain_value.entity_forward_map db host in
  let value = forward_map_get "user.property/related" fm in
  check "node-property-values: page uuid"
    (wire_string_field "block/uuid" value = Some target_uuid);
  check "node-property-values: page title"
    (wire_string_field "block/title" value = Some "Target");
  check "node-property-values: page name"
    (wire_string_field "block/name" value = Some "target");
  (* cljs: "Block values resolve through the same node-property path" *)
  let db, host, target_uuid, _value_uuid = property_value_db ":node" "" in
  let fm = Plain_value.entity_forward_map db host in
  let value = forward_map_get "user.property/related" fm in
  check "node-property-values: block uuid"
    (wire_string_field "block/uuid" value = Some target_uuid);
  check "node-property-values: block title"
    (wire_string_field "block/title" value = Some "Target")

let test_legacy_node_property_values_keep_their_value_entity () =
  let target_title = "https://logseq.io/p/nx4mc_ggev" in
  let db, host, _target_uuid, value_uuid =
    property_value_db ":node"
      (Printf.sprintf
         ":block/title \"%s\" :block/name \"%s\" :block/tags :logseq.class/Page"
         target_title target_title)
      ~value_attrs:(Printf.sprintf ":block/title \"%s\"" target_title)
  in
  let fm = Plain_value.entity_forward_map db host in
  let value = forward_map_get "user.property/related" fm in
  check "legacy-node: value uuid"
    (wire_string_field "block/uuid" value = Some value_uuid);
  check "legacy-node: value title"
    (wire_string_field "block/title" value = Some target_title)

let test_direct_node_references_keep_their_target_entity () =
  let db, _host, target_uuid, _value_uuid = property_value_db ":node" "" in
  (* cljs passes the property eid and the raw value eid; the OCaml fn
     takes the attr name and a Ref value. *)
  let target_id = (Option.get (e_at_uuid db target_uuid)).id in
  let value =
    Plain_value.attribute_value_to_plain db "user.property/related"
      (Ref target_id)
  in
  check "direct-node: uuid"
    (match value with
     | Wire.Map kvs ->
         wire_string_field "block/uuid" kvs = Some target_uuid
     | _ -> false);
  check "direct-node: title"
    (match value with
     | Wire.Map kvs -> wire_string_field "block/title" kvs = Some "Target"
     | _ -> false)

let test_property_value_summaries_keep_scalar_values () =
  List.iter
    (fun (scalar, attrs) ->
      let db, _host, _t, value_uuid =
        property_value_db ":number" "" ~value_attrs:attrs
      in
      let value_id = (Option.get (e_at_uuid db value_uuid)).id in
      let value =
        Plain_value.attribute_value_to_plain db "user.property/related"
          (Ref value_id)
      in
      check "scalar-values: logseq.property/value kept"
        (match value with
         | Wire.Map kvs -> wire_get "logseq.property/value" kvs = Some scalar
         | _ -> false))
    [ (Wire.Int 1, ":logseq.property/value 1")
    ; (Wire.Int 0, ":logseq.property/value 0")
    ; (Wire.Bool false, ":logseq.property/value false") ]

let test_non_node_property_values_keep_their_value_entity () =
  let db, host, _t, value_uuid = property_value_db ":default" "" in
  let fm = Plain_value.entity_forward_map db host in
  let value = forward_map_get "user.property/related" fm in
  check "non-node: value uuid"
    (wire_string_field "block/uuid" value = Some value_uuid);
  check "non-node: value title is target uuid string"
    (wire_string_field "block/title" value
     = Some "11111111-1111-1111-1111-111111111111")

let test_asset_property_values_keep_render_fields () =
  let conn = Sqlite_export.create_conn () in
  let asset_uuid = "11111111-1111-1111-1111-111111111111"
  and host_uuid = "33333333-3333-3333-3333-333333333333" in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/id -1
          :db/ident :user.property/cover
          :block/title \"Cover\"
          :logseq.property/type :asset
          :db/valueType :db.type/ref
          :db/cardinality :db.cardinality/one
          :block/tags :logseq.class/Property}
         {:db/id -2
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"poster\"
          :block/tags :logseq.class/Asset
          :logseq.property.asset/type \"webp\"
          :logseq.property.asset/width 640
          :logseq.property.asset/height 480}
         {:db/id -3
          :block/uuid #uuid \"33333333-3333-3333-3333-333333333333\"
          :block/title \"Host\"
          :block/name \"host\"
          :block/tags :logseq.class/Page
          :user.property/cover -2}]");
  let db = db_of conn in
  let host = Option.get (e_at_uuid db host_uuid) in
  let fm = Plain_value.entity_forward_map db host in
  let value = forward_map_get "user.property/cover" fm in
  check "asset: uuid"
    (wire_string_field "block/uuid" value = Some asset_uuid);
  check "asset: type"
    (wire_string_field "logseq.property.asset/type" value = Some "webp");
  check "asset: width"
    (match wire_get "logseq.property.asset/width" value with
     | Some (Wire.Int 640) -> true
     | _ -> false);
  check "asset: height"
    (match wire_get "logseq.property.asset/height" value with
     | Some (Wire.Int 480) -> true
     | _ -> false);
  (* cljs (is (not= {:db/id (:db/id value)} value)) — the summary is a
     full map, not a bare {:db/id} ref *)
  check "asset: summary has more than db/id"
    (match value with
     | [] -> false
     | kvs ->
         List.length kvs > 1
         && List.exists (fun (k, _) -> k = Wire.Keyword "db/id") kvs)

let test_entity_forward_map_excludes_requested_attributes () =
  let db, host, _t, _v = property_value_db ":default" "" in
  let result =
    Plain_value.entity_forward_map db host
      ~exclude_attrs:[ "block/name"; "user.property/related" ]
  in
  match result with
  | Wire.Map kvs ->
      check "exclude-attrs: no block/name"
        (wire_get "block/name" kvs = None);
      check "exclude-attrs: no user.property/related"
        (wire_get "user.property/related" kvs = None);
      check "exclude-attrs: block/title kept"
        (wire_string_field "block/title" kvs = Some "Host")
  | _ -> check "exclude-attrs: result is map" false

let test_entity_forward_map_includes_own_property_keys () =
  let db, host, _t, _v = property_value_db ":default" "" in
  let result = Plain_value.entity_forward_map db host in
  check "property-keys: own property idents persisted"
    (match result with
     | Wire.Map kvs -> (
         match wire_get "block.temp/property-keys" kvs with
         | Some (Wire.Array ks) ->
             List.mem (Wire.Keyword "user.property/related") ks
         | _ -> false)
     | _ -> false)

let test_get_block_display_properties_use_resolved_node_values () =
  let db, host, target_uuid, _v =
    property_value_db ":node"
      ":block/name \"target\" :block/tags :logseq.class/Page"
  in
  (* cljs (block-handler/get-block-and-children db id {:children? false}) *)
  let result =
    Endpoint_block.get_block_and_children db (Int host.id)
      { gb_all = false
      ; gb_children = false
      ; gb_properties = []
      ; gb_render_data = None
      ; gb_root_render_data = false
      ; gb_include_collapsed_children = false
      ; gb_include_property_block = false }
  in
  (* cljs (get-in result [:block :block/properties
     :user.property/related]) *)
  let value =
    match result with
    | Wire.Map kvs -> (
        match wire_get "block" kvs with
        | Some (Wire.Map b) -> (
            match wire_get "block/properties" b with
            | Some (Wire.Map props) -> (
                match wire_get "user.property/related" props with
                | Some (Wire.Map m) -> Some m
                | _ -> None)
            | _ -> None)
        | _ -> None)
    | _ -> None
  in
  match value with
  | Some m ->
      check "display-properties: resolved uuid"
        (wire_string_field "block/uuid" m = Some target_uuid);
      check "display-properties: resolved title"
        (wire_string_field "block/title" m = Some "Target")
  | None ->
      check "display-properties: user.property/related present" false

let plain_value_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case
      "node-property-values-resolve-their-target-entity" `Quick
      test_node_property_values_resolve_their_target_entity
  ; Alcotest.test_case
      "legacy-node-property-values-keep-their-value-entity" `Quick
      test_legacy_node_property_values_keep_their_value_entity
  ; Alcotest.test_case "direct-node-references-keep-their-target-entity"
      `Quick test_direct_node_references_keep_their_target_entity
  ; Alcotest.test_case "property-value-summaries-keep-scalar-values"
      `Quick test_property_value_summaries_keep_scalar_values
  ; Alcotest.test_case "non-node-property-values-keep-their-value-entity"
      `Quick test_non_node_property_values_keep_their_value_entity
  ; Alcotest.test_case "asset-property-values-keep-render-fields" `Quick
      test_asset_property_values_keep_render_fields
  ; Alcotest.test_case
      "entity-forward-map-excludes-requested-attributes" `Quick
      test_entity_forward_map_excludes_requested_attributes
  ; Alcotest.test_case "entity-forward-map-includes-own-property-keys"
      `Quick test_entity_forward_map_includes_own_property_keys
  ; Alcotest.test_case
      "get-block-display-properties-use-resolved-node-values" `Quick
      test_get_block_display_properties_use_resolved_node_values ]

(* ---------- commands_test.cljs ---------- *)

(* cljs {:db/ident <ident>} unit maps — get_next_time only reads
   db/ident through lookup_attr. *)
let empty_db = Datascript.empty_db ()

let unit_entity (ident : string option) : entity =
  { id = -1
  ; db = empty_db
  ; attrs = []
  ; lookup_attr =
      (fun a ->
        match ident, a with
        | Some i, "db/ident" -> Some (One_value (Keyword i))
        | _ -> None)
  ; materialize_attrs = (fun () -> []) }

let minute_unit = unit_entity (Some "logseq.property.repeat/recur-unit.minute")
let hour_unit = unit_entity (Some "logseq.property.repeat/recur-unit.hour")
let day_unit = unit_entity (Some "logseq.property.repeat/recur-unit.day")
let week_unit = unit_entity (Some "logseq.property.repeat/recur-unit.week")
let month_unit = unit_entity (Some "logseq.property.repeat/recur-unit.month")
let year_unit = unit_entity (Some "logseq.property.repeat/recur-unit.year")

let dotted_plus = "logseq.property.repeat/repeat-type.dotted-plus"
let plus = "logseq.property.repeat/repeat-type.plus"
let double_plus = "logseq.property.repeat/repeat-type.double-plus"

(* cljs get-next-time — 3-arg form uses the :double-plus default *)
let get_next_time3 (current : int64) (unit : entity) (freq : int) =
  Commands.get_next_time current unit freq double_plus

let get_next_time4 (current : int64) (unit : entity) (freq : int)
    (repeat_type : string) =
  Commands.get_next_time current unit freq repeat_type

let now_ms () : int64 = Int64.of_float (Clock.now_ms ())

let minus_ms (t : int64) (ms : int64) : int64 = Int64.sub t ms
let plus_ms (t : int64) (ms : int64) : int64 = Int64.add t ms

let minute_ms = 60000L
let hour_ms = 3600000L
let day_ms = 86400000L
let week_ms = 604800000L

(* cljs-time t/plus/t/minus for month/year — joda clamped civil add *)
let plus_months (t : int64) (n : int) : int64 =
  Commands.ms_of_utc_civil
    (Commands.add_units (Commands.utc_civil_of_ms t) Commands.Month n)

let plus_years (t : int64) (n : int) : int64 =
  Commands.ms_of_utc_civil
    (Commands.add_units (Commands.utc_civil_of_ms t) Commands.Year n)

(* cljs in-minutes/in-hours/... relative to the test's now snapshot *)
let in_minutes ~(now : int64) (t : int64) : int =
  Int64.to_int (Int64.div (Int64.sub t now) minute_ms)

let in_hours ~(now : int64) (t : int64) : int =
  Int64.to_int (Int64.div (Int64.sub t now) hour_ms)

let in_days ~(now : int64) (t : int64) : int =
  Int64.to_int (Int64.div (Int64.sub t now) day_ms)

let in_weeks ~(now : int64) (t : int64) : int =
  Int64.to_int (Int64.div (Int64.sub t now) week_ms)

(* cljs t/in-months / t/in-years — whole-unit civil diff *)
let in_months ~(now : int64) (t : int64) : int =
  Commands.in_units
    (Commands.utc_civil_of_ms now)
    (Commands.utc_civil_of_ms t) Commands.Month

let in_years ~(now : int64) (t : int64) : int =
  Commands.in_units
    (Commands.utc_civil_of_ms now)
    (Commands.utc_civil_of_ms t) Commands.Year

(* cljs t/day-of-week — consistent weekday index is enough for
   equality assertions *)
let day_of_week (t : int64) : int =
  let c = Commands.utc_civil_of_ms t in
  Commands.days_from_civil c.y c.mo c.d mod 7

let civil_ms y mo d h mi =
  Commands.ms_of_utc_civil
    { y; mo; d; h; mi; s = 0; ms = 0 }

let opt_get_exn = function Some x -> x | None -> failwith "get_next_time"

let test_get_next_time () =
  let now = now_ms () in
  let one_minute_ago = minus_ms now minute_ms in
  let one_hour_ago = minus_ms now hour_ms in
  let one_day_ago = minus_ms now day_ms in
  let one_week_ago = minus_ms now week_ms in
  let one_month_ago = plus_months now (-1) in
  let one_year_ago = plus_years now (-1) in
  (* minute *)
  check "get-next-time: now minute 1"
    (in_minutes ~now (opt_get_exn (get_next_time3 now minute_unit 1)) = 1);
  check "get-next-time: minute-ago 1"
    (in_minutes ~now
       (opt_get_exn (get_next_time3 one_minute_ago minute_unit 1)) = 1);
  check "get-next-time: minute-ago 3"
    (in_minutes ~now
       (opt_get_exn (get_next_time3 one_minute_ago minute_unit 3)) = 2);
  check "get-next-time: minute-ago 5"
    (in_minutes ~now
       (opt_get_exn (get_next_time3 one_minute_ago minute_unit 5)) = 4);
  (* hour *)
  check "get-next-time: now hour 1"
    (in_hours ~now (opt_get_exn (get_next_time3 now hour_unit 1)) = 1);
  check "get-next-time: hour-ago 1"
    (in_hours ~now (opt_get_exn (get_next_time3 one_hour_ago hour_unit 1)) = 1);
  check "get-next-time: hour-ago 3"
    (in_hours ~now (opt_get_exn (get_next_time3 one_hour_ago hour_unit 3)) = 2);
  check "get-next-time: hour-ago 5"
    (in_hours ~now (opt_get_exn (get_next_time3 one_hour_ago hour_unit 5)) = 4);
  (* day *)
  check "get-next-time: now day 1"
    (in_days ~now (opt_get_exn (get_next_time3 now day_unit 1)) = 1);
  check "get-next-time: day-ago 1"
    (in_days ~now (opt_get_exn (get_next_time3 one_day_ago day_unit 1)) = 1);
  check "get-next-time: day-ago 3"
    (in_days ~now (opt_get_exn (get_next_time3 one_day_ago day_unit 3)) = 2);
  check "get-next-time: day-ago 5"
    (in_days ~now (opt_get_exn (get_next_time3 one_day_ago day_unit 5)) = 4);
  (* week *)
  check "get-next-time: now week 1"
    (in_weeks ~now (opt_get_exn (get_next_time3 now week_unit 1)) = 1);
  check "get-next-time: week-ago 1"
    (in_weeks ~now (opt_get_exn (get_next_time3 one_week_ago week_unit 1)) = 1);
  check "get-next-time: week-ago 3"
    (in_weeks ~now (opt_get_exn (get_next_time3 one_week_ago week_unit 3)) = 2);
  check "get-next-time: week-ago 5"
    (in_weeks ~now (opt_get_exn (get_next_time3 one_week_ago week_unit 5)) = 4);
  (* month *)
  check "get-next-time: now month 1"
    (in_months ~now (opt_get_exn (get_next_time3 now month_unit 1)) = 1);
  check "get-next-time: month-ago 1 (>1 day)"
    (in_days ~now (opt_get_exn (get_next_time3 one_month_ago month_unit 1)) > 1);
  check "get-next-time: month-ago 3 in #{1 2}"
    (List.mem
       (in_months ~now
          (opt_get_exn (get_next_time3 one_month_ago month_unit 3)))
       [ 1; 2 ]);
  check "get-next-time: month-ago 5 in #{3 4}"
    (List.mem
       (in_months ~now
          (opt_get_exn (get_next_time3 one_month_ago month_unit 5)))
       [ 3; 4 ]);
  (* year *)
  check "get-next-time: now year 1"
    (in_years ~now (opt_get_exn (get_next_time3 now year_unit 1)) = 1);
  check "get-next-time: year-ago 1"
    (in_years ~now (opt_get_exn (get_next_time3 one_year_ago year_unit 1)) = 1);
  check "get-next-time: year-ago 3"
    (in_years ~now (opt_get_exn (get_next_time3 one_year_ago year_unit 3)) = 2);
  check "get-next-time: year-ago 5"
    (in_years ~now (opt_get_exn (get_next_time3 one_year_ago year_unit 5)) = 4);
  (* preserves week day *)
  check "get-next-time: week preserves weekday (now)"
    (day_of_week (opt_get_exn (get_next_time3 now week_unit 1))
     = day_of_week now);
  check "get-next-time: week preserves weekday (ago)"
    (day_of_week (opt_get_exn (get_next_time3 one_week_ago week_unit 1))
     = day_of_week now);
  (* schedule on future time moves to the next one *)
  check "get-next-time: future minute"
    (in_minutes ~now
       (opt_get_exn
          (get_next_time3 (plus_ms now (Int64.mul 10L minute_ms)) minute_unit
             1))
     = 11);
  check "get-next-time: future hour"
    (in_hours ~now
       (opt_get_exn
          (get_next_time3 (plus_ms now (Int64.mul 10L hour_ms)) hour_unit 1))
     = 11);
  check "get-next-time: future day"
    (in_days ~now
       (opt_get_exn
          (get_next_time3 (plus_ms now (Int64.mul 10L day_ms)) day_unit 1))
     = 11);
  check "get-next-time: future week"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time3 (plus_ms now (Int64.mul 10L week_ms)) week_unit 1))
     = 11);
  check "get-next-time: future month in #{10 11}"
    (List.mem
       (in_months ~now
          (opt_get_exn (get_next_time3 (plus_months now 10) month_unit 1)))
       [ 10; 11 ]);
  check "get-next-time: future year"
    (in_years ~now
       (opt_get_exn (get_next_time3 (plus_years now 10) year_unit 1)) = 11);
  (* schedule on past time moves to future *)
  check "get-next-time: past minute"
    (in_minutes ~now
       (opt_get_exn
          (get_next_time3 (minus_ms now (Int64.mul 10L minute_ms))
             minute_unit 1))
     = 1);
  check "get-next-time: past hour"
    (in_hours ~now
       (opt_get_exn
          (get_next_time3 (minus_ms now (Int64.mul 10L hour_ms)) hour_unit 1))
     = 1);
  check "get-next-time: past day"
    (in_days ~now
       (opt_get_exn
          (get_next_time3 (minus_ms now (Int64.mul 10L day_ms)) day_unit 1))
     = 1);
  check "get-next-time: past week"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time3 (minus_ms now (Int64.mul 10L week_ms)) week_unit 1))
     = 1);
  check "get-next-time: past month >1 day"
    (in_days ~now
       (opt_get_exn (get_next_time3 (plus_months now (-10)) month_unit 1)) > 1);
  check "get-next-time: past year"
    (in_years ~now
       (opt_get_exn (get_next_time3 (plus_years now (-10)) year_unit 1)) = 1)

let test_dotted_plus_advances_from_completion () =
  let now = now_ms () in
  check ".+ scheduled 4d ago -> 7d out"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 4L day_ms)) week_unit 1
             dotted_plus))
     = 7);
  check ".+ scheduled 10w ago -> 1w out"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 10L week_ms)) week_unit 1
             dotted_plus))
     = 1);
  check ".+ scheduled 10d ago monthly -> >27d out"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 10L day_ms)) month_unit 1
             dotted_plus))
     > 27);
  check ".+ scheduled 3mo ago yearly -> 1y out"
    (in_years ~now
       (opt_get_exn
          (get_next_time4 (plus_months now (-3)) year_unit 1 dotted_plus))
     = 1);
  check ".+ scheduled 3d future weekly -> 7d out"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (plus_ms now (Int64.mul 3L day_ms)) week_unit 1
             dotted_plus))
     = 7)

let test_plus_advances_from_scheduled () =
  let now = now_ms () in
  check "+ scheduled 10d ago weekly -> -3d"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 10L day_ms)) week_unit 1
             plus))
     = -3);
  check "+ scheduled 4d ago weekly -> +3d"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 4L day_ms)) week_unit 1
             plus))
     = 3);
  check "+ scheduled 3d future weekly -> +10d"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (plus_ms now (Int64.mul 3L day_ms)) week_unit 1
             plus))
     = 10);
  check "+ every 3w scheduled 5w ago -> -2w"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 5L week_ms)) week_unit 3
             plus))
     = -2)

let test_double_plus_advances_until_future () =
  let now = now_ms () in
  let ten_days_ago = minus_ms now (Int64.mul 10L day_ms) in
  check "++ scheduled 10d ago weekly -> +4d"
    (in_days ~now
       (opt_get_exn (get_next_time4 ten_days_ago week_unit 1 double_plus))
     = 4);
  check "++ scheduled 4d ago weekly -> +3d"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 4L day_ms)) week_unit 1
             double_plus))
     = 3);
  check "++ preserves weekday"
    (day_of_week (opt_get_exn (get_next_time4 ten_days_ago week_unit 1 double_plus))
     = day_of_week ten_days_ago);
  check "++ every 3w scheduled 5w ago -> +1w"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 5L week_ms)) week_unit 3
             double_plus))
     = 1)

let test_repeat_type_defaults_to_double_plus () =
  let now = now_ms () in
  let ten_days_ago = minus_ms now (Int64.mul 10L day_ms) in
  (* cljs nil repeat-type -> fallthrough to double-plus; "" matches no
     repeat-type ident and takes the same branch *)
  let via_nil =
    opt_get_exn (get_next_time4 ten_days_ago week_unit 1 "")
  in
  let via_default =
    opt_get_exn (get_next_time4 ten_days_ago week_unit 1 double_plus)
  in
  check "repeat-type default: nil = double-plus" (via_nil = via_default);
  check "repeat-type default: 4d out" (in_days ~now via_nil = 4)

let test_get_next_time_rejects_non_positive_frequency () =
  let now = now_ms () in
  let ten_days_ago = minus_ms now (Int64.mul 10L day_ms) in
  check "freq 0 -> nil" (get_next_time3 ten_days_ago week_unit 0 = None);
  check "freq -1 -> nil" (get_next_time3 ten_days_ago week_unit (-1) = None);
  check "freq 0 dotted-plus -> nil"
    (get_next_time4 ten_days_ago week_unit 0 dotted_plus = None);
  check "freq -2 plus -> nil"
    (get_next_time4 ten_days_ago week_unit (-2) plus = None)

let test_get_next_time_rejects_unknown_unit () =
  let now = now_ms () in
  check "empty unit map -> nil"
    (get_next_time3 now (unit_entity None) 1 = None);
  check "bogus ident -> nil"
    (get_next_time4 now (unit_entity (Some "bogus")) 1 dotted_plus = None)

let test_dotted_plus_frequency_greater_than_one () =
  let now = now_ms () in
  check ".+ 5h ago 15min -> 15min out"
    (in_minutes ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 5L hour_ms)) minute_unit
             15 dotted_plus))
     = 15);
  check ".+ 2d ago 5d -> 5d out"
    (in_days ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now (Int64.mul 2L day_ms)) day_unit 5
             dotted_plus))
     = 5);
  check ".+ 1w ago 3w -> 3w out"
    (in_weeks ~now
       (opt_get_exn
          (get_next_time4 (minus_ms now week_ms) week_unit 3 dotted_plus))
     = 3)

let test_double_plus_month_and_year () =
  let now = now_ms () in
  check "++ monthly 2mo ago -> 0/1mo out"
    (List.mem
       (in_months ~now
          (opt_get_exn
             (get_next_time4 (plus_months now (-2)) month_unit 1
                double_plus)))
       [ 0; 1 ]);
  check "++ every 3mo scheduled 5mo ago -> 0/1mo out"
    (List.mem
       (in_months ~now
          (opt_get_exn
             (get_next_time4 (plus_months now (-5)) month_unit 3
                double_plus)))
       [ 0; 1 ]);
  check "++ yearly 2y ago -> 1y out"
    (in_years ~now
       (opt_get_exn
          (get_next_time4 (plus_years now (-2)) year_unit 1 double_plus))
     = 1)

let test_double_plus_month_clamp_stays_future () =
  (* cljs pins now = 2026-03-30 and scheduled = 2026-01-31; with the
     real clock this fixture is in the past, so ++ still advances until
     strictly after now — assert the observable invariant *)
  let now = now_ms () in
  let scheduled = civil_ms 2026 1 31 0 0 in
  check "++ month-clamp result strictly after now"
    (match get_next_time4 scheduled month_unit 1 double_plus with
     | Some t -> Int64.compare t now > 0
     | None -> false)

let test_double_plus_far_overdue_minute_is_bounded () =
  let now = now_ms () in
  let two_years_ago = plus_years now (-2) in
  (* cljs counts t/minutes invocations via with-redefs to bound the
     iteration; OCaml repeat_next_timestamp takes a recur_unit — the
     closed-form delta computation is asserted by its observable
     result: now + 1 minute, no hang. *)
  let result =
    Commands.repeat_next_timestamp
      (Commands.utc_civil_of_ms two_years_ago)
      Commands.Minute 1 double_plus
  in
  check "far-overdue minute: result = now + 1min"
    (in_minutes ~now (Commands.ms_of_utc_civil result) = 1)

(* cljs tx-add-value — find [:db/add eid attr v] in tx ops *)
let tx_add_value (txs : tx_op list) (eid : entity_id) (a : attr)
    : value option =
  List.find_map
    (function
      | Add (Entity_id e, a', v) when e = eid && a' = a -> (
          match v with Ref_to _ -> None | v -> Some v)
      | _ -> None)
    txs

let test_repeated_task_with_deadline_and_missing_temporal_property () =
  let conn = Sqlite_export.create_conn () in
  let deadline = civil_ms 2030 1 10 9 0 in
  let expected_next_deadline = civil_ms 2030 1 10 10 0 in
  (* cljs create-conn-with-blocks transacts via d/transact!; the port
     emits the same entities via transact_conn_string — see header for
     the Sqlite_build.create_blocks divergences this avoids. *)
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"dddd0000-0000-4000-8000-000000000001\"
             :block/title \"Regression Sandbox\" :block/name \"regression sandbox\"}
            {:block/uuid #uuid \"dddd0000-0000-4000-8000-000000000002\"
             :block/title \"Synthetic recurring item\"
             :block/parent [:block/uuid #uuid \"dddd0000-0000-4000-8000-000000000001\"]
             :block/page [:block/uuid #uuid \"dddd0000-0000-4000-8000-000000000001\"]
             :logseq.property.repeat/repeated? true
             :logseq.property.repeat/recur-frequency 1
             :logseq.property.repeat/recur-unit :logseq.property.repeat/recur-unit.hour
             :logseq.property/deadline %Ld
             :logseq.property/status :logseq.property/status.todo}]"
          deadline));
  let db = db_of conn in
  let block =
    Option.get (Db_test_util.find_block_by_content db "Synthetic recurring item")
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[[:db/add %d :logseq.property.repeat/repeat-type :logseq.property.repeat/repeat-type.double-plus]]"
          block.id));
  let report =
    Datascript.transact_conn_string conn
      (Printf.sprintf
         "[[:db/add %d :logseq.property/status :logseq.property/status.done]]"
         block.id)
  in
  let commands_tx = Commands.run_commands report.db_after report.tx_data in
  check "repeated-task: next deadline"
    (tx_add_value commands_tx block.id "logseq.property/deadline"
     = Some (Int (Int64.to_int expected_next_deadline)));
  check "repeated-task: status reset to todo"
    (match tx_add_value commands_tx block.id "logseq.property/status" with
     | Some (Keyword "logseq.property/status.todo") -> true
     | _ -> false)

let test_resolve_recur_frequency () =
  (* cljs with-redefs a mock db; port uses a real seeded conn — the
     recur-frequency built-in property exists there. *)
  let conn = Sqlite_export.create_conn () in
  let ent_uuid = "55555555-5555-5555-5555-555555555555"
  and vb_uuid = "66666666-6666-6666-6666-666666666666" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :logseq.property/value 5}
            {:block/uuid #uuid \"%s\"
             :block/title \"recurring item\"
             :logseq.property.repeat/recur-frequency [:block/uuid #uuid \"%s\"]}]"
          vb_uuid ent_uuid vb_uuid));
  let db = db_of conn in
  let ent = Option.get (e_at_uuid db ent_uuid) in
  (* "returns the explicit frequency when the property has a value" *)
  let freq, tx = Commands.resolve_recur_frequency db ent in
  check "resolve-recur-frequency: explicit 5" (freq = 5);
  check "resolve-recur-frequency: no default-value tx" (tx = []);
  (* "falls back to 1 and builds default-value tx when unset" *)
  let bare_uuid = "77777777-7777-7777-7777-777777777777" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"no freq\"}]" bare_uuid));
  let db2 = db_of conn in
  let ent2 = Option.get (e_at_uuid db2 bare_uuid) in
  let freq2, tx2 = Commands.resolve_recur_frequency db2 ent2 in
  check "resolve-recur-frequency: fallback 1" (freq2 = 1);
  check "resolve-recur-frequency: default-value tx returned" (tx2 <> []);
  check "resolve-recur-frequency: tx has 2 ops" (List.length tx2 = 2)

let commands_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "get-next-time-test" `Quick test_get_next_time
  ; Alcotest.test_case "dotted-plus-advances-from-completion-test"
      `Quick test_dotted_plus_advances_from_completion
  ; Alcotest.test_case "plus-advances-from-scheduled-test" `Quick
      test_plus_advances_from_scheduled
  ; Alcotest.test_case "double-plus-advances-until-future-test" `Quick
      test_double_plus_advances_until_future
  ; Alcotest.test_case "repeat-type-defaults-to-double-plus-test" `Quick
      test_repeat_type_defaults_to_double_plus
  ; Alcotest.test_case
      "get-next-time-rejects-non-positive-frequency-test" `Quick
      test_get_next_time_rejects_non_positive_frequency
  ; Alcotest.test_case "get-next-time-rejects-unknown-unit-test" `Quick
      test_get_next_time_rejects_unknown_unit
  ; Alcotest.test_case "dotted-plus-frequency-greater-than-one-test"
      `Quick test_dotted_plus_frequency_greater_than_one
  ; Alcotest.test_case "double-plus-month-and-year-test" `Quick
      test_double_plus_month_and_year
  ; Alcotest.test_case "double-plus-month-clamp-stays-future-test"
      `Quick test_double_plus_month_clamp_stays_future
  ; Alcotest.test_case
      "double-plus-far-overdue-minute-is-bounded-test" `Quick
      test_double_plus_far_overdue_minute_is_bounded
  ; Alcotest.test_case
      "repeated-task-with-deadline-and-missing-temporal-property-test"
      `Quick test_repeated_task_with_deadline_and_missing_temporal_property
  ; Alcotest.test_case "resolve-recur-frequency-test" `Quick
      test_resolve_recur_frequency ]

(* ---------- publish_test.cljs ---------- *)

let payload_datom_eids (payload : Wire.t) : int list =
  match payload with
  | Wire.Map kvs -> (
      match wire_get "datoms" kvs with
      | Some (Wire.Array datoms) ->
          List.filter_map
            (function
              | Wire.Array (Wire.Int e :: _) -> Some e | _ -> None)
            datoms
      | _ -> [])
  | _ -> []

let payload_block_contents (payload : Wire.t) : string list =
  match payload with
  | Wire.Map kvs -> (
      match wire_get "blocks" kvs with
      | Some w ->
          wire_maps w
          |> List.filter_map (fun m -> wire_string_field "block_content" m)
      | _ -> [])
  | _ -> []

let test_publish_payload_includes_embedded_blocks () =
  let conn = Sqlite_export.create_conn () in
  let target_uuid = "aaaa0000-0000-4000-8000-000000000001"
  and child_uuid = "aaaa0000-0000-4000-8000-000000000002"
  and embed_uuid = "aaaa0000-0000-4000-8000-000000000003" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000010\"
             :block/title \"Page A\" :block/name \"page a\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"Embed\"
             :block/parent [:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000010\"]
             :block/page [:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000010\"]}
            {:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000011\"
             :block/title \"Page B\" :block/name \"page b\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"Target\"
             :block/parent [:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000011\"]
             :block/page [:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000011\"]}
            {:block/uuid #uuid \"%s\"
             :block/title \"Child\"
             :block/parent [:block/uuid #uuid \"%s\"]
             :block/page [:block/uuid #uuid \"aaaa0000-0000-4000-8000-000000000011\"]}]"
          embed_uuid target_uuid child_uuid target_uuid));
  let db = db_of conn in
  let embed_eid = (Option.get (e_at_uuid db embed_uuid)).id in
  let target_eid = (Option.get (e_at_uuid db target_uuid)).id in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[{:db/id %d :block/link %d}]" embed_eid target_eid));
  let db = db_of conn in
  let page_a = Option.get (Db_test_util.find_page_by_title db "Page A") in
  let payload = Worker_publish.build_publish_page_payload db page_a in
  let datom_eids = payload_datom_eids payload in
  let child_eid = (Option.get (e_at_uuid db child_uuid)).id in
  check "publish-embed: target eid in datoms"
    (List.mem target_eid datom_eids);
  check "publish-embed: child eid in datoms" (List.mem child_eid datom_eids)

let test_publish_payload_traverses_nested_embeds () =
  let conn = Sqlite_export.create_conn () in
  let first_uuid = "bbbb0000-0000-4000-8000-000000000001"
  and second_uuid = "bbbb0000-0000-4000-8000-000000000002"
  and embed_uuid = "bbbb0000-0000-4000-8000-000000000003" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000010\"
             :block/title \"Root Page\" :block/name \"root page\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"Embed\"
             :block/parent [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000010\"]
             :block/page [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000010\"]}
            {:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000011\"
             :block/title \"First Page\" :block/name \"first page\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"First\"
             :block/parent [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000011\"]
             :block/page [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000011\"]}
            {:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000012\"
             :block/title \"First child\"
             :block/parent [:block/uuid #uuid \"%s\"]
             :block/page [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000011\"]}
            {:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000013\"
             :block/title \"Second Page\" :block/name \"second page\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"Second\"
             :block/parent [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000013\"]
             :block/page [:block/uuid #uuid \"bbbb0000-0000-4000-8000-000000000013\"]}]"
          embed_uuid first_uuid first_uuid second_uuid));
  let db = db_of conn in
  let embed_eid = (Option.get (e_at_uuid db embed_uuid)).id in
  let first_eid = (Option.get (e_at_uuid db first_uuid)).id in
  let second_eid = (Option.get (e_at_uuid db second_uuid)).id in
  let first_child =
    Option.get (Db_test_util.find_block_by_content db "First child")
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :block/link %d}
            {:db/id %d :block/link %d}]"
          embed_eid first_eid first_child.id second_eid));
  let db = db_of conn in
  let root_page =
    Option.get (Db_test_util.find_page_by_title db "Root Page")
  in
  let payload = Worker_publish.build_publish_page_payload db root_page in
  let datom_eids = payload_datom_eids payload in
  let first_eid = (Option.get (e_at_uuid db first_uuid)).id in
  let second_eid = (Option.get (e_at_uuid db second_uuid)).id in
  check "publish-nested: first eid in datoms"
    (List.mem first_eid datom_eids);
  check "publish-nested: second eid in datoms"
    (List.mem second_eid datom_eids)

let test_publish_payload_excludes_comments () =
  let conn = Sqlite_export.create_conn () in
  let target_uuid = "cccc0000-0000-4000-8000-000000000001"
  and comments_area_uuid = "cccc0000-0000-4000-8000-000000000002"
  and comment_uuid = "cccc0000-0000-4000-8000-000000000003" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"cccc0000-0000-4000-8000-000000000010\"
             :block/title \"Page A\" :block/name \"page a\"}
            {:block/uuid #uuid \"%s\"
             :block/title \"Target\"
             :block/parent [:block/uuid #uuid \"cccc0000-0000-4000-8000-000000000010\"]
             :block/page [:block/uuid #uuid \"cccc0000-0000-4000-8000-000000000010\"]}
            {:block/uuid #uuid \"%s\"
             :block/title \"Comments\"
             :block/parent [:block/uuid #uuid \"%s\"]
             :block/page [:block/uuid #uuid \"cccc0000-0000-4000-8000-000000000010\"]
             :block/tags :logseq.class/Comments}
            {:block/uuid #uuid \"%s\"
             :block/title \"Private reply\"
             :block/parent [:block/uuid #uuid \"%s\"]
             :block/page [:block/uuid #uuid \"cccc0000-0000-4000-8000-000000000010\"]
             :block/tags :logseq.class/Comment}]"
          target_uuid comments_area_uuid target_uuid comment_uuid
          comments_area_uuid));
  let db = db_of conn in
  let page_a = Option.get (Db_test_util.find_page_by_title db "Page A") in
  let comments_area_eid =
    (Option.get (e_at_uuid db comments_area_uuid)).id
  in
  let comment_eid = (Option.get (e_at_uuid db comment_uuid)).id in
  let payload = Worker_publish.build_publish_page_payload db page_a in
  let datom_eids = payload_datom_eids payload in
  let search_contents = payload_block_contents payload in
  check "publish-comments: comments area excluded"
    (not (List.mem comments_area_eid datom_eids));
  check "publish-comments: comment excluded"
    (not (List.mem comment_eid datom_eids));
  check "publish-comments: 'Comments' not in search blocks"
    (not (List.mem "Comments" search_contents));
  check "publish-comments: 'Private reply' not in search blocks"
    (not (List.mem "Private reply" search_contents))

let publish_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "publish-payload-includes-embedded-blocks" `Quick
      test_publish_payload_includes_embedded_blocks
  ; Alcotest.test_case "publish-payload-traverses-nested-embeds" `Quick
      test_publish_payload_traverses_nested_embeds
  ; Alcotest.test_case "publish-payload-excludes-comments" `Quick
      test_publish_payload_excludes_comments ]

(* ---------- state_test.cljs ---------- *)

(* cljs worker-state/online? with platform/current redefined; on native
   Runtime_env.kind () = Native — the cljs :node branch, which never
   consults the thread atom. The thread-atom is still exercised for
   parity. *)
let online_key = "thread-atom/online-event"

let test_online_uses_thread_atom_in_non_node_runtime () =
  Worker_state.update_thread_atom online_key (Wire.Bool true);
  check "online?: web runtime online-event true"
    (Sync_state.online () = true);
  Worker_state.update_thread_atom online_key (Wire.Bool false);
  (* cljs expects false on :web; on Native (the :node branch) the atom
     is never consulted and online? stays true *)
  check "online?: native ignores offline online-event (node role)"
    (Sync_state.online () = true);
  Worker_state.update_thread_atom online_key Wire.Nil

let test_online_treats_uninitialized_thread_online_event_as_online () =
  Worker_state.update_thread_atom online_key Wire.Nil;
  check "online?: nil online-event counts as online"
    (Sync_state.online () = true)

let test_online_node_runtime_does_not_require_main_thread_online_event () =
  Worker_state.update_thread_atom online_key Wire.Nil;
  check "online?: node/native runtime provides its own detection"
    (Sync_state.online () = true)

let state_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "online?-uses-thread-atom-in-non-node-runtime"
      `Quick test_online_uses_thread_atom_in_non_node_runtime
  ; Alcotest.test_case
      "online?-treats-uninitialized-thread-online-event-as-online" `Quick
      test_online_treats_uninitialized_thread_online_event_as_online
  ; Alcotest.test_case
      "online?-node-runtime-does-not-require-main-thread-online-event"
      `Quick test_online_node_runtime_does_not_require_main_thread_online_event
  ]

(* ---------- worker_common_util_test.cljs ---------- *)

let str_includes (s : string) (sub : string) : bool =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then false
    else if String.sub s i m = sub then true
    else go (i + 1)
  in
  m = 0 || go 0

let test_encode_decode_graph_dir_name_roundtrip () =
  let cases =
    [ ("Demo", "Demo")
    ; ("foo/bar", "foo~2Fbar")
    ; ("a:b", "a~3Ab")
    ; ("space name", "space name")
    ; ("100% legit", "100~25 legit")
    ; ("til~x", "til~7Ex")
    ; ("A B/C:D%~E", "A B~2FC~3AD~25~7EE") ]
  in
  List.iter
    (fun (name, expected_encoded) ->
      let encoded = Graph_dir.encode_graph_dir_name name in
      check (Printf.sprintf "roundtrip %s: encoded" name)
        (encoded = expected_encoded);
      check (Printf.sprintf "roundtrip %s: decoded" name)
        (Graph_dir.decode_graph_dir_name encoded = Some name);
      check (Printf.sprintf "roundtrip %s: no /" name)
        (not (str_includes encoded "/"));
      check (Printf.sprintf "roundtrip %s: no \\" name)
        (not (str_includes encoded "\\")))
    cases;
  check "decode accepts ~20"
    (Graph_dir.decode_graph_dir_name "space~20name" = Some "space name");
  check "decode accepts %20"
    (Graph_dir.decode_graph_dir_name "space%20name" = Some "space name")
(* cljs (is (nil? (decode-graph-dir-name nil))) — OCaml takes a string,
   no nil input; documented in header. *)

let test_graph_storage_names_trim_surrounding_whitespace () =
  check "encode trims"
    (Graph_dir.encode_graph_dir_name "  space name  " = "space name");
  (* LIB BUG: Graph_dir.pool_name trims before stripping logseq_db_, so
     the space between the prefix and the name survives. cljs trims
     after stripping, yielding "logseq-pool-space name". Asserted with
     the cljs expectation — red until the lib is fixed. *)
  check "pool-name trims"
    (Graph_dir.pool_name "  logseq_db_ space name  "
     = "logseq-pool-space name");
  check "decode rejects non-canonical whitespace"
    (Graph_dir.decode_graph_dir_name " space name " = None)

let worker_util_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "encode-decode-graph-dir-name-roundtrip" `Quick
      test_encode_decode_graph_dir_name_roundtrip
  ; Alcotest.test_case "graph-storage-names-trim-surrounding-whitespace"
      `Quick test_graph_storage_names_trim_surrounding_whitespace ]
