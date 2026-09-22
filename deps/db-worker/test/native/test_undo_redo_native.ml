(* cljs test file translated 1:1:
   src/test/frontend/worker/undo_redo_test.cljs — 29 deftests → group "undo-redo"

   Exercises: frontend.worker.undo-redo (lib/undo_redo.ml — undo_ops/redo_ops
   stacks, record-ui-state!, undo/redo, clear-history!, gen-undo-ops),
   frontend.worker.sync.apply-txs (lib/sync_apply.ml — enqueue-local-tx!,
   apply-history-action), frontend.worker.sync.client-op
   (lib/sync_client_op.ml — client_ops sqlite store), frontend.worker.state
   (lib/worker_state.ml — datascript-conns), frontend.worker.sync.state
   (lib/sync_state.ml — client-ops-conns), logseq.outliner.op/apply-ops!
   (lib/outliner_op.ml), db helpers (ldb, db-test/create-conn-with-blocks).

   Wiring: cljs binds worker-state/*datascript-conns, *client-ops-conns and
   worker-undo-redo/*apply-history-action! in a per-test fixture, plus a
   d/listen! hook calling db-sync/enqueue-local-tx!. The OCaml port routes
   the cljs direct-namespace references through injection refs, so the
   fixture binds:
     Undo_redo.apply_history_action        — cljs *apply-history-action!
     Undo_redo.history_action_ops_provider — cljs client-op/history-action-ops-by-tx-id
                                             (a direct call in cljs; nothing in
                                             lib/ binds the OCaml provider, so
                                             without this gen_undo_ops records
                                             no forward/inverse ops — reported
                                             as missing lib wiring)
     Sync_deps.gen_undo_ops                — cljs gen-undo-ops! call inside
                                             persist-local-tx! (bound by
                                             Sync_client module init in prod;
                                             wired explicitly here so the test
                                             does not depend on link order)
   plus Datascript.listen → Sync_apply.enqueue_local_tx (cljs d/listen! +
   db-sync/enqueue-local-tx!).

   Fixture: cljs db-test/create-conn-with-blocks over db-test/create-conn →
   Sqlite_export.create_conn () (full built-in ontology — the tests use
   :logseq.property/status, logseq.class/Task, Template, Comment(s),
   created-by-ref, used-template, Journal title-format). The
   :build/children path of Sqlite_build.create_blocks can't be used for
   the fixture's nested blocks (lib/engine bug below), so the page +
   task/parent/child tree is emitted as a plain transact_conn_string
   with the same attrs the cljs fixture produces.
   cljs new-client-ops-db uses better-sqlite3 :memory: →
   Sqlite.open_db + Sync_client_op.ensure_schema on a unique temp file
   (:memory: would collide in Sync_client_op's filename-keyed schema_ready
   cache across fixtures).

   Known lib/engine bugs hit by these tests (no workarounds — left red):
     - UNPORTED DEPENDENCY: the op-construct package
       (deps/outliner/src/logseq/outliner/op/construct.cljc, ~1300 lines)
       has no OCaml port. Sync_deps.derive_history_outliner_ops,
       outliner_apply_ops and rewrite_block_title_with_retracted_refs
       are never bound in lib/, so Sync_apply.persist_local_tx raises
       "sync_deps: not wired: derive_history_outliner_ops" on every
       local tx. Every history-recording case in this file fails there —
       they should flip green once op-construct is ported and wired.
       (worker-ui-state-roundtrips passes: it never transacts.)
     - Sqlite_build.create_blocks :build/children emits :block/parent as
       a same-tx forward lookup-ref {:db/id [:block/uuid u]}; under
       Db_tx.transact the attr is silently dropped and Db_validate then
       fails the tx with ":block/parent missing required key". The same
       entity map via Datascript.transact_conn_string resolves fine, and
       the lookup-ref resolves fine in a later tx — the drop happens
       inside the Db_tx pipeline path (with_report/apply_report).
*)

open Datascript
open Test_shared

let test_repo = "test-worker-undo-redo"

(* ---------- small helpers ---------- *)

let edn_value (s : string) : value =
  Edn_util.value_of_edn (Edn_parser.of_edn_string s)

let edn_wire (s : string) : Wire.t = Ds_wire.transit_of_value (edn_value s)

let qstr s = Printf.sprintf "\"%s\"" s

let uuid_lit u = Printf.sprintf "#uuid %s" (qstr u)

let ent_uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> u | _ -> ""

let ent_at_uuid db u = entity_at_uuid db u

let ent_title_of (e : entity) : string option = Ldb.string_value e "block/title"

let ent_ident (e : entity) : string option =
  match Ldb.value e "db/ident" with Some (Keyword k) -> Some k | _ -> None

let entity_of_ident db ident = Datascript.entity db (Ident ident)

(* ---------- client-ops sqlite fixture (cljs new-client-ops-db) ---------- *)

let new_client_ops_db repo =
  let path = Filename.temp_file "client-ops-" ".sqlite" in
  let db = Sqlite.open_db ~path in
  Sync_client_op.ensure_schema db;
  Hashtbl.replace Sync_state.client_ops_conns repo db;
  db

let delete_client_op_tx_row (db : Sqlite.db) (tx_id : string) =
  Sqlite.exec db
    ~sql:"delete from client_ops where kind = 'tx' and tx_id = ?"
    ~bind:[| Sqlite.Text tx_id |]

let client_op_tx_row_exists (db : Sqlite.db) (tx_id : string) : bool =
  Sqlite.query db
    ~sql:"select 1 as ok from client_ops where kind = 'tx' and tx_id = ? limit 1"
    ~bind:[| Sqlite.Text tx_id |]
  <> []

(* ---------- sync wiring (cljs fixture resets) ---------- *)

(* cljs (reset! *apply-history-action! sync-apply/apply-history-action!) —
   adapter shape copied from Sync_client module init (sync_client.ml). *)
let apply_history_action_adapter repo tx_id_opt undo pairs =
  let tx_meta =
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword s -> Some (s, Ds_wire.value_of_transit v)
        | _ -> None)
      pairs
  in
  (match
     Sync_apply.apply_history_action repo
       (Option.value ~default:"" tx_id_opt)
       undo tx_meta
   with
   | Wire.Map kvs ->
       List.filter_map
         (fun (k, v) ->
           match k with Wire.Keyword s -> Some (s, v) | _ -> None)
         kvs
   | _ -> [])

(* cljs worker-undo-redo/gen-undo-ops! invoked from persist-local-tx!. *)
let gen_undo_ops_adapter repo (r : tx_report) tx_id =
  Undo_redo.gen_undo_ops repo ~tx_data:r.tx_data
    ~tx_meta:
      (List.map (fun (a, v) -> (a, Ds_wire.transit_of_value v)) r.tx_meta)
    ~db_before:r.db_before ~db_after:r.db_after ~tx_id
    ~apply_history:apply_history_action_adapter

(* cljs db-test/create-conn — full seeded graph. Seeding takes ~25s, so
   the seeded db snapshot is built once and every conn clones it via
   conn_from_db (structural sharing — transacts never mutate the
   snapshot). *)
let seeded_db : db option ref = ref None

let create_conn () : conn =
  let db =
    match !seeded_db with
    | Some d -> d
    | None ->
        let c = Sqlite_export.create_conn () in
        let d = db_of c in
        seeded_db := Some d;
        d
  in
  conn_from_db db

let with_worker_conns f =
  let conn = create_conn () in
  (* cljs fixture: db-test/create-conn-with-blocks page 1 with task +
     parent/child tree. Sqlite_build.create_blocks emits the child's
     :block/parent as a same-tx forward lookup-ref {:db/id [:block/uuid
     u]} which the Db_tx pipeline drops (engine bug), so the fixture is
     emitted here as plain transact_conn_string maps — same entities the
     cljs fixture produces. *)
  let page_u = Uuid_gen.uuid () and task_u = Uuid_gen.uuid () in
  let parent_u = Uuid_gen.uuid () and child_u = Uuid_gen.uuid () in
  let now = Int64.of_float (Clock.now_ms ()) in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid %s :block/title \"page 1\" :block/name \"page 1\" :block/tags [:logseq.class/Page] :block/created-at %Ld :block/updated-at %Ld} \
           {:block/uuid %s :block/title \"task\" :block/page [:block/uuid %s] :block/parent [:block/uuid %s] :block/order \"a1\" :block/created-at %Ld :block/updated-at %Ld} \
           {:block/uuid %s :block/title \"parent\" :block/page [:block/uuid %s] :block/parent [:block/uuid %s] :block/order \"a2\" :block/created-at %Ld :block/updated-at %Ld} \
           {:block/uuid %s :block/title \"child\" :block/page [:block/uuid %s] :block/parent {:db/id [:block/uuid %s]} :block/order \"a3\" :block/created-at %Ld :block/updated-at %Ld}]"
          (uuid_lit page_u) now now (uuid_lit task_u) (uuid_lit page_u)
          (uuid_lit page_u) now now (uuid_lit parent_u) (uuid_lit page_u)
          (uuid_lit page_u) now now (uuid_lit child_u) (uuid_lit page_u)
          (uuid_lit parent_u) now now));
  let client_ops_db = new_client_ops_db test_repo in
  Worker_state.set_datascript_conn test_repo conn;
  Undo_redo.apply_history_action := Some apply_history_action_adapter;
  Undo_redo.history_action_ops_provider :=
    (fun repo tx_id -> Sync_client_op.history_action_ops_by_tx_id repo tx_id);
  Sync_deps.gen_undo_ops := Some gen_undo_ops_adapter;
  let listen_key =
    Datascript.listen conn "::gen-undo-ops"
      (fun (r : tx_report) -> Sync_apply.enqueue_local_tx test_repo r)
  in
  Undo_redo.clear_history test_repo;
  Fun.protect
    ~finally:(fun () ->
      Datascript.unlisten conn listen_key;
      Undo_redo.clear_history test_repo;
      Undo_redo.apply_history_action := None;
      Undo_redo.history_action_ops_provider := (fun _ _ -> None);
      Worker_state.drop_datascript_conn test_repo;
      Hashtbl.remove Sync_state.client_ops_conns test_repo;
      Sqlite.close client_ops_db)
    f

let conn () =
  match Worker_state.datascript_conn test_repo with
  | Some c -> c
  | None -> failwith "no datascript conn for test repo"

let client_ops_conn () =
  match Hashtbl.find_opt Sync_state.client_ops_conns test_repo with
  | Some db -> db
  | None -> failwith "no client-ops conn for test repo"

(* ---------- tx/meta helpers ---------- *)

let local_tx_meta ?tx_id ?(extra = []) () : tx_meta =
  let tx_id = match tx_id with Some t -> t | None -> Uuid_gen.uuid () in
  ("local-tx?", Bool true) :: ("db-sync/tx-id", Uuid tx_id) :: extra

let save_block_title ?tx_id conn block_uuid title =
  let tx_id = match tx_id with Some t -> t | None -> Uuid_gen.uuid () in
  ignore
    (transact_conn_string conn
       ~tx_meta:
         (local_tx_meta ~tx_id
            ~extra:
              [ ("outliner-op", Keyword "save-block")
              ; ( "outliner-ops"
                , edn_value
                    (Printf.sprintf
                       "[[:save-block [{:block/uuid %s :block/title %s} {}]]]"
                       (uuid_lit block_uuid) (qstr title)) )
              ]
            ())
       (Printf.sprintf "[[:db/add [:block/uuid %s] :block/title %s]]"
          (uuid_lit block_uuid) (qstr title)))

let seed_page_parent_child () =
  let db = db_of (conn ()) in
  let page_uuid =
    match Db_test_util.find_page_by_title db "page 1" with
    | Some e -> ent_uuid_of e
    | None -> failwith "page 1 not found"
  in
  let parent_uuid =
    match Db_test_util.find_block_by_content db "parent" with
    | Some e -> ent_uuid_of e
    | None -> failwith "parent not found"
  in
  let child_uuid =
    match
      Datascript.q_string db
        "[:find ?child-uuid . :in $ ?parent-uuid :where \
         [?parent :block/uuid ?parent-uuid] [?child :block/parent ?parent] \
         [?child :block/uuid ?child-uuid]]"
        ~inputs:[ Arg_scalar (Result_value (Uuid parent_uuid)) ]
    with
    | [ [ Result_value (Uuid u) ] ] -> u
    | [ [ Result_value (String u) ] ] -> u
    | [ [ Result_entity _ ] ] -> failwith "child uuid came back as entity"
    | _ -> failwith "child uuid not found"
  in
  (page_uuid, parent_uuid, child_uuid)

(* cljs normalize-op-block-ids: rewrite raw db/ids inside op args to block
   uuids / property idents before calling apply-ops!. *)
let block_id_to_uuid db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Uuid _ -> w
  | Wire.Array [ Wire.Keyword "block/uuid"; (Wire.Uuid _ as u) ]
  | Wire.List [ Wire.Keyword "block/uuid"; (Wire.Uuid _ as u) ] ->
      u
  | Wire.Int id ->
      (match Datascript.entity db (Entity_id id) with
       | Some e ->
           (match Ldb.value e "block/uuid" with
            | Some (Uuid u) -> Wire.Uuid u
            | _ -> w)
       | None -> w)
  | _ -> w

let property_id_to_ident db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Keyword _ -> w
  | Wire.Int id ->
      (match Datascript.entity db (Entity_id id) with
       | Some e ->
           (match Ldb.value e "db/ident" with
            | Some (Keyword k) -> Wire.Keyword k
            | _ -> w)
       | None -> w)
  | _ -> w

let coll_ids db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Array xs | Wire.List xs ->
      Wire.Array (List.map (block_id_to_uuid db) xs)
  | _ -> w

let normalize_op_entry db (entry : Wire.t) : Wire.t =
  match Outliner_op.op_of_entry entry with
  | None -> entry
  | Some (op, args) ->
      let id = block_id_to_uuid db in
      let pid = property_id_to_ident db in
      let cids = coll_ids db in
      let args' =
        match op, args with
        | "save-block", [ block; opts ] ->
            let block' =
              match block with
              | Wire.Map kvs ->
                  let db_id = wire_get "db/id" kvs in
                  let uuid_v = wire_get "block/uuid" kvs in
                  (match db_id, uuid_v with
                   | Some (Wire.Uuid u), _ ->
                       let kvs' =
                         List.filter
                           (fun (k, _) -> k <> Wire.Keyword "db/id")
                           kvs
                       in
                       (match uuid_v with
                        | Some _ -> Wire.Map kvs'
                        | None ->
                            Wire.Map
                              (kvs'
                              @ [ (Wire.Keyword "block/uuid", Wire.Uuid u) ]))
                   | Some ((Wire.Int _ | Wire.Int64 _) as idv), None ->
                       Wire.Map
                         (kvs @ [ (Wire.Keyword "block/uuid", id idv) ])
                   | _ -> block)
              | _ -> block
            in
            [ block'; opts ]
        | "insert-blocks", [ a; b; c ] -> [ a; id b; c ]
        | "apply-template", [ a; b; c ] -> [ id a; id b; c ]
        | "delete-blocks", [ a; b ] -> [ cids a; b ]
        | "move-blocks", [ a; b; c ] -> [ cids a; id b; c ]
        | "move-blocks-up-down", [ a; b ] -> [ cids a; b ]
        | "indent-outdent-blocks", [ a; b; c ] -> [ cids a; b; c ]
        | "set-block-property", [ a; b; c ] -> [ id a; pid b; c ]
        | "remove-block-property", [ a; b ] -> [ id a; pid b ]
        | "delete-property-value", [ a; b; c ] -> [ id a; pid b; c ]
        | "create-property-text-block", [ a; b; c; d ] ->
            [ (match a with Wire.Nil -> a | _ -> id a); pid b; c; d ]
        | "batch-set-property", [ a; b; c; d ] -> [ cids a; pid b; c; d ]
        | "batch-remove-property", [ a; b ] -> [ cids a; pid b ]
        | "batch-delete-property-value", [ a; b; c ] -> [ cids a; pid b; c ]
        | "class-add-property", [ a; b ] -> [ id a; pid b ]
        | "class-remove-property", [ a; b ] -> [ id a; pid b ]
        | "upsert-property", [ a; b; c ] ->
            [ (match a with Wire.Nil -> a | _ -> pid a); b; c ]
        | "upsert-closed-value", [ a; b ] -> [ pid a; b ]
        | "delete-closed-value", [ a; b ] -> [ pid a; id b ]
        | "add-existing-values-to-closed-values", [ a; b ] -> [ pid a; b ]
        | _ -> args
      in
      Wire.Array [ Wire.Keyword op; Wire.Array args' ]

let normalize_ops db (ops : Wire.t) : Wire.t =
  match ops with
  | Wire.Array xs | Wire.List xs ->
      Wire.Array (List.map (normalize_op_entry db) xs)
  | _ -> ops

(* cljs apply-ops! *)
let apply_ops conn (ops : Wire.t) : Wire.t =
  let opts =
    edn_wire
      (Printf.sprintf
         "{:client-id \"test-client\" :local-tx? true :db-sync/tx-id %s}"
         (uuid_lit (Uuid_gen.uuid ())))
  in
  Outliner_op.apply_ops conn (normalize_ops (db_of conn) ops) opts

let apply_ops_edn conn ops_edn : Wire.t = apply_ops conn (edn_wire ops_edn)

(* cljs undo-all! / redo-all! *)
let undo_all () : Wire.t list =
  let rec loop acc =
    let r = Undo_redo.undo test_repo in
    if r = Undo_redo.empty_stack_result ~undo:true then acc else loop (r :: acc)
  in
  List.rev (loop [])

let redo_all () : Wire.t list =
  let rec loop acc =
    let r = Undo_redo.redo test_repo in
    if r = Undo_redo.empty_stack_result ~undo:false then acc else loop (r :: acc)
  in
  List.rev (loop [])

(* ---------- history data helpers ---------- *)

let stack_of tbl repo = Option.value (Hashtbl.find_opt tbl repo) ~default:[]

let db_transact_data (op : Undo_redo.undo_op) : (string * Wire.t) list option =
  List.find_map (function Undo_redo.Db_transact d -> Some d | _ -> None) op

let latest_history_data tbl repo : (string * Wire.t) list option =
  match List.rev (stack_of tbl repo) with
  | op :: _ -> db_transact_data op
  | [] -> None

let latest_undo_history_data () =
  latest_history_data Undo_redo.undo_ops test_repo

let latest_redo_history_data () =
  latest_history_data Undo_redo.redo_ops test_repo

let data_get (k : string) (data : (string * Wire.t) list) : Wire.t option =
  List.assoc_opt k data

let data_uuid k data =
  match data_get k data with
  | Some (Wire.Uuid u) | Some (Wire.String u) -> Some u
  | _ -> None

(* cljs move-retract-entity-ops-to-front over a Wire array of tx ops *)
let move_retract_entity_ops_to_front (w : Wire.t) : Wire.t =
  let items = match w with Wire.Array xs | Wire.List xs -> xs | _ -> [] in
  let is_retract = function
    | Wire.Array [ Wire.Keyword "db/retractEntity"; _ ]
    | Wire.List [ Wire.Keyword "db/retractEntity"; _ ] ->
        true
    | _ -> false
  in
  Wire.Array
    (List.filter is_retract items
    @ List.filter (fun x -> not (is_retract x)) items)

let poison_history_tx_order tx_id =
  match Sync_client_op.get_local_tx_entry test_repo tx_id with
  | Some entry ->
      ignore
        (Sync_client_op.upsert_local_tx_entry test_repo ~tx_id ~pending:true
           ~failed:false ~outliner_op:entry.outliner_op
           ~undo_redo:entry.undo_redo
           ~forward_outliner_ops:entry.forward_outliner_ops
           ~inverse_outliner_ops:entry.inverse_outliner_ops
           ~inferred_outliner_ops:entry.inferred_outliner_ops
           ~normalized_tx_data:(move_retract_entity_ops_to_front entry.tx)
           ~reversed_tx_data:
             (move_retract_entity_ops_to_front entry.reversed_tx)
           ())
  | None -> ()

(* cljs (swap! *undo-ops update repo ...) — poison the latest op's :tx-data *)
let poison_latest_stack_data tbl repo =
  let stack = stack_of tbl repo in
  match List.rev stack with
  | [] -> ()
  | last_op :: rev_rest ->
      let op' =
        List.map
          (function
            | Undo_redo.Db_transact data ->
                Undo_redo.Db_transact
                  (( "tx-data"
                   , Wire.List
                       [ Ds_wire.transit_of_datom
                           (Datascript.datom ~e:1 ~a:"block/title"
                              ~v:(String "poisoned") ~tx:1 ~added:true ())
                       ] )
                  :: List.remove_assoc "tx-data" data)
            | item -> item)
          last_op
      in
      Hashtbl.replace tbl repo (List.rev (op' :: rev_rest))

let wire_nth (w : Wire.t) (i : int) : Wire.t option =
  match w with
  | Wire.Array xs | Wire.List xs -> List.nth_opt xs i
  | _ -> None

let wire_get_in (w : Wire.t) (path : [ `K of string | `I of int ] list)
    : Wire.t option =
  List.fold_left
    (fun cur step ->
      match cur, step with
      | Some (Wire.Map kvs), `K k -> wire_get k kvs
      | Some w, `I i -> wire_nth w i
      | _ -> None)
    (Some w) path

(* cljs (get-in data [k i1 i2 attr]) where data is (string*Wire.t) list *)
let data_get_in (data : (string * Wire.t) list)
    (path : [ `K of string | `I of int ] list) : Wire.t option =
  match path with
  | `K k :: rest -> Option.bind (data_get k data) (fun v -> wire_get_in v rest)
  | _ -> None

let uuid_str_of_wire = function
  | Wire.Uuid u -> Some u
  | Wire.String u -> Some u
  | _ -> None

(* cljs property-value-titles — flatten entity attr value(s) to titles *)
let property_value_titles db (e : entity) (ident : string) : string list =
  let rec flatten (v : value) : string list =
    match v with
    | Ref id ->
        (match Datascript.entity db (Entity_id id) with
         | Some e' -> (
             match ent_title_of e' with Some t -> [ t ] | None -> [])
         | None -> [])
    | String s -> [ s ]
    | Set vs | Vector vs | List vs -> List.concat_map flatten vs
    | _ -> []
  in
  List.concat_map flatten (Ldb.values e ident)

let inverse_op_named data op_name =
  match data_get "db-sync/inverse-outliner-ops" data with
  | Some (Wire.Array ops) | Some (Wire.List ops) ->
      List.find_opt
        (fun w ->
          match Outliner_op.op_of_entry w with
          | Some (n, _) -> n = op_name
          | None -> false)
        ops
  | _ -> None

(* shared template fixture: insert template root + children, then an empty
   target block on the page *)
let setup_template conn =
  let page_uuid, _p, _c = seed_page_parent_child () in
  let page_id =
    match ent_at_uuid (db_of conn) page_uuid with
    | Some e -> e.id
    | None -> failwith "page missing"
  in
  let template_root_uuid = Uuid_gen.uuid () in
  let template_a_uuid = Uuid_gen.uuid () in
  let template_b_uuid = Uuid_gen.uuid () in
  let empty_target_uuid = Uuid_gen.uuid () in
  ignore
    (apply_ops_edn conn
       (Printf.sprintf
          "[[:insert-blocks [[{:block/uuid %s :block/title \"template 1\" :block/tags #{:logseq.class/Template}} {:block/uuid %s :block/title \"a\" :block/parent [:block/uuid %s]} {:block/uuid %s :block/title \"b\" :block/parent [:block/uuid %s]}] %d {:sibling? false :keep-uuid? true}]]]"
          (uuid_lit template_root_uuid) (uuid_lit template_a_uuid)
          (uuid_lit template_root_uuid) (uuid_lit template_b_uuid)
          (uuid_lit template_a_uuid) page_id));
  ignore
    (apply_ops_edn conn
       (Printf.sprintf
          "[[:insert-blocks [[{:block/uuid %s :block/title \"\"}] %d {:sibling? false :keep-uuid? true}]]]"
          (uuid_lit empty_target_uuid) page_id));
  (template_root_uuid, template_a_uuid, template_b_uuid, empty_target_uuid)

(* cljs (rest (ldb/get-block-and-children @conn root-uuid {:include-property-block? true}))
   as wire maps — each entity's :block/uuid + :block/title + :block/parent +
   :block/order (the attrs insert-blocks needs). *)
let template_blocks_wire db root_uuid : Wire.t list =
  let ents =
    Ldb.get_block_and_children db ~include_property_block:true root_uuid
  in
  (match ents with [] -> [] | _ :: rest -> rest)
  |> List.map (fun (e : entity) ->
         let kvs =
           [ Some (Wire.Keyword "block/uuid", Wire.Uuid (ent_uuid_of e))
           ; (match ent_title_of e with
              | Some t -> Some (Wire.Keyword "block/title", Wire.String t)
              | None -> None)
           ; (match Ldb.ref_ent e "block/parent" with
              | Some p ->
                  Some
                    ( Wire.Keyword "block/parent"
                    , Wire.Array
                        [ Wire.Keyword "block/uuid"; Wire.Uuid (ent_uuid_of p) ] )
              | None -> None)
           ; (match Ldb.value e "block/order" with
              | Some (String o) ->
                  Some (Wire.Keyword "block/order", Wire.String o)
              | _ -> None)
           ]
         in
         Wire.Map (List.filter_map Fun.id kvs))

(* cljs (cons (assoc first :logseq.property/used-template (:db/id template-root)) rest) *)
let blocks_to_insert_wire db root_uuid : Wire.t =
  let template_root = Option.get (ent_at_uuid db root_uuid) in
  match template_blocks_wire db root_uuid with
  | [] -> Wire.Array []
  | Wire.Map kvs :: rest ->
      Wire.Array
        (Wire.Map
           (kvs
           @ [ ( Wire.Keyword "logseq.property/used-template"
               , Wire.Int template_root.id ) ])
        :: rest)
  | other :: rest -> Wire.Array (other :: rest)

let find_inserted_a_id db template_root_uuid : entity_id option =
  match
    Datascript.q_string db
      "[:find ?b . :in $ ?template-uuid :where \
       [?template :block/uuid ?template-uuid] \
       [?b :logseq.property/used-template ?template] [?b :block/title \"a\"]]"
      ~inputs:[ Arg_scalar (Result_value (Uuid template_root_uuid)) ]
  with
  | [ [ Result_entity id ] ] -> Some id
  | [ [ Result_value (Int id) ] ] -> Some id
  | _ -> None

(* cljs apply-ops! with explicit tx-meta via wire opts *)
let apply_ops_wire conn (ops : Wire.t) : Wire.t =
  Outliner_op.apply_ops conn
    (normalize_ops (db_of conn) ops)
    (edn_wire
       (Printf.sprintf
          "{:client-id \"test-client\" :local-tx? true :db-sync/tx-id %s}"
          (uuid_lit (Uuid_gen.uuid ()))))

(* insert-blocks op with blocks-to-insert wire list (template tests) *)
let insert_template_blocks conn blocks_wire target_id ~insert_template () =
  let opts =
    if insert_template then
      edn_wire "{:sibling? true :replace-empty-target? true :insert-template? true}"
    else edn_wire "{:sibling? true :replace-empty-target? true}"
  in
  apply_ops_wire conn
    (Wire.Array
       [ Wire.Array
           [ Wire.Keyword "insert-blocks"
           ; Wire.Array [ blocks_wire; Wire.Int target_id; opts ] ] ])

(* apply-template op with template-blocks wire list *)
let apply_template_op conn ~template_root_id ~empty_target_id ~blocks_wire () =
  let opts =
    match edn_wire "{:sibling? true :replace-empty-target? true}" with
    | Wire.Map kvs ->
        Wire.Map (kvs @ [ (Wire.Keyword "template-blocks", blocks_wire) ])
    | w -> w
  in
  apply_ops_wire conn
    (Wire.Array
       [ Wire.Array
           [ Wire.Keyword "apply-template"
           ; Wire.Array
               [ Wire.Int template_root_id; Wire.Int empty_target_id; opts ] ] ])

(* ---------- tests ---------- *)

let test_worker_ui_state_roundtrip () =
  with_worker_conns (fun () ->
      let ui_state_str =
        "{:old-state {}, :new-state {:route-data {:to :page}}}"
      in
      Undo_redo.record_ui_state test_repo (Wire.String ui_state_str);
      let undo_result = Undo_redo.undo test_repo in
      (match undo_result with
       | Wire.Map kvs ->
           check "ui-state-str"
             (wire_get "ui-state-str" kvs = Some (Wire.String ui_state_str));
           check "undo?" (wire_get "undo?" kvs = Some (Wire.Bool true))
       | _ -> Alcotest.fail "undo result not a map");
      let redo_result = Undo_redo.redo test_repo in
      match redo_result with
      | Wire.Map kvs ->
          check "ui-state-str"
            (wire_get "ui-state-str" kvs = Some (Wire.String ui_state_str));
          check "redo undo?" (wire_get "undo?" kvs = Some (Wire.Bool false))
      | _ -> Alcotest.fail "redo result not a map")

let test_undo_redo_selection_editor_info_roundtrip () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _page_uuid, _parent_uuid, child_uuid = seed_page_parent_child () in
      let selection_info =
        edn_wire
          (Printf.sprintf
             "{:selected-block-uuids [%s] :selection-direction :down}"
             (uuid_lit child_uuid))
      in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             (local_tx_meta
                ~extra:
                  [ ("outliner-op", Keyword "save-block")
                  ; ( "undo-redo/editor-info"
                    , Ds_wire.value_of_transit selection_info )
                  ; ( "outliner-ops"
                    , edn_value
                        (Printf.sprintf
                           "[[:save-block [{:block/uuid %s :block/title \"selection-history\"} {}]]]"
                           (uuid_lit child_uuid)) )
                  ]
                ())
           (Printf.sprintf
              "[[:db/add [:block/uuid %s] :block/title \"selection-history\"]]"
              (uuid_lit child_uuid)));
      let undo_result = Undo_redo.undo test_repo in
      (match undo_result with
       | Wire.Map kvs ->
           check "editor-cursors"
             (wire_get "editor-cursors" kvs
             = Some (Wire.List [ selection_info ]));
           check "block-content absent" (wire_get "block-content" kvs = None)
       | _ -> Alcotest.fail "undo result not a map");
      let redo_result = Undo_redo.redo test_repo in
      match redo_result with
      | Wire.Map kvs ->
          check "redo editor-cursors"
            (wire_get "editor-cursors" kvs
            = Some (Wire.List [ selection_info ]));
          check "redo block-content absent" (wire_get "block-content" kvs = None)
      | _ -> Alcotest.fail "redo result not a map")

let test_undo_missing_history_action_row_replays_from_inline_ops () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let client_ops_db = client_ops_conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      let tx_id_1 = Uuid_gen.uuid () in
      let tx_id_2 = Uuid_gen.uuid () in
      save_block_title ~tx_id:tx_id_1 conn child_uuid "v1";
      save_block_title ~tx_id:tx_id_2 conn child_uuid "v2";
      check "title v2"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "v2"
         | None -> false);
      check "two undo ops"
        (List.length (stack_of Undo_redo.undo_ops test_repo) = 2);
      (match latest_undo_history_data () with
       | Some data ->
           check "forward ops seq"
             (match data_get "db-sync/forward-outliner-ops" data with
              | Some (Wire.Array xs) | Some (Wire.List xs) -> xs <> []
              | _ -> false);
           check "inverse ops seq"
             (match data_get "db-sync/inverse-outliner-ops" data with
              | Some (Wire.Array xs) | Some (Wire.List xs) -> xs <> []
              | _ -> false)
       | None -> Alcotest.fail "no undo history data");
      (* poison tx-data — undo/redo must not rely on raw datoms *)
      poison_latest_stack_data Undo_redo.undo_ops test_repo;
      delete_client_op_tx_row client_ops_db tx_id_2;
      let undo_result = Undo_redo.undo test_repo in
      check "undo not empty"
        (undo_result <> Undo_redo.empty_stack_result ~undo:true);
      check "title v1 after undo"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "v1"
         | None -> false);
      check "one undo op left"
        (List.length (stack_of Undo_redo.undo_ops test_repo) = 1);
      check "one redo op"
        (List.length (stack_of Undo_redo.redo_ops test_repo) = 1);
      let redo_result = Undo_redo.redo test_repo in
      check "redo not empty"
        (redo_result <> Undo_redo.empty_stack_result ~undo:false);
      check "title v2 after redo"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "v2"
         | None -> false))

let test_redo_invalid_history_action_result_keeps_redo_strict () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      let tx_id_1 = Uuid_gen.uuid () in
      let tx_id_2 = Uuid_gen.uuid () in
      let prev = !Undo_redo.apply_history_action in
      Fun.protect
        ~finally:(fun () -> Undo_redo.apply_history_action := prev)
        (fun () ->
          save_block_title ~tx_id:tx_id_1 conn child_uuid "v1";
          save_block_title ~tx_id:tx_id_2 conn child_uuid "v2";
          check "undo applies"
            (Undo_redo.undo test_repo
            <> Undo_redo.empty_stack_result ~undo:true);
          check "title v1"
            (match ent_at_uuid (db_of conn) child_uuid with
             | Some e -> ent_title_of e = Some "v1"
             | None -> false);
          Undo_redo.apply_history_action :=
            Some
              (fun _repo _tx_id _undo _tx_meta ->
                [ ("applied?", Wire.Bool false)
                ; ("reason", Wire.Keyword "invalid-history-action-tx") ]);
          check "redo returns empty stack"
            (Undo_redo.redo test_repo
            = Undo_redo.empty_stack_result ~undo:false);
          check "title stays v1"
            (match ent_at_uuid (db_of conn) child_uuid with
             | Some e -> ent_title_of e = Some "v1"
             | None -> false);
          check "undo stack empty"
            (stack_of Undo_redo.undo_ops test_repo = []);
          check "redo stack empty"
            (stack_of Undo_redo.redo_ops test_repo = [])))

let test_undo_skippable_worker_error_does_not_fallback () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      let tx_id_1 = Uuid_gen.uuid () in
      let tx_id_2 = Uuid_gen.uuid () in
      let prev = !Undo_redo.apply_history_action in
      Fun.protect
        ~finally:(fun () -> Undo_redo.apply_history_action := prev)
        (fun () ->
          save_block_title ~tx_id:tx_id_1 conn child_uuid "v1";
          save_block_title ~tx_id:tx_id_2 conn child_uuid "v2";
          Undo_redo.apply_history_action :=
            Some
              (fun _repo _tx_id _undo _tx_meta ->
                failwith "invalid-history-action-ops");
          check "undo empty stack"
            (Undo_redo.undo test_repo
            = Undo_redo.empty_stack_result ~undo:true);
          check "title stays v2"
            (match ent_at_uuid (db_of conn) child_uuid with
             | Some e -> ent_title_of e = Some "v2"
             | None -> false)))

let test_undo_row_missing_and_poisoned_tx_data_does_not_clear_history () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let client_ops_db = client_ops_conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      let tx_id = Uuid_gen.uuid () in
      save_block_title ~tx_id conn child_uuid "new-title";
      poison_latest_stack_data Undo_redo.undo_ops test_repo;
      delete_client_op_tx_row client_ops_db tx_id;
      check "undo applies"
        (Undo_redo.undo test_repo
        <> Undo_redo.empty_stack_result ~undo:true);
      check "redo ops non-empty"
        (stack_of Undo_redo.redo_ops test_repo <> []))

let test_undo_redo_rebinds_stack_to_latest_history_tx_id () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let client_ops_db = client_ops_conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      save_block_title conn child_uuid "v1";
      let source_tx_id =
        Option.bind (latest_undo_history_data ()) (data_uuid "db-sync/tx-id")
      in
      check "source tx-id is uuid" (source_tx_id <> None);
      check "undo applies"
        (Undo_redo.undo test_repo
        <> Undo_redo.empty_stack_result ~undo:true);
      let redo_tx_id =
        Option.bind (latest_redo_history_data ()) (data_uuid "db-sync/tx-id")
      in
      check "redo tx-id is uuid" (redo_tx_id <> None);
      check "redo tx-id = source tx-id" (redo_tx_id = source_tx_id);
      check "redo applies"
        (Undo_redo.redo test_repo
        <> Undo_redo.empty_stack_result ~undo:false);
      let undo_tx_id =
        Option.bind (latest_undo_history_data ()) (data_uuid "db-sync/tx-id")
      in
      check "undo tx-id is uuid" (undo_tx_id <> None);
      check "undo tx-id <> source tx-id" (undo_tx_id <> source_tx_id);
      match undo_tx_id with
      | Some id ->
          check "client-op tx row exists" (client_op_tx_row_exists client_ops_db id)
      | None -> Alcotest.fail "no undo tx id")

let test_undo_records_only_local_txs () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      save_block_title conn child_uuid "local-update";
      check "one undo op recorded"
        (List.length (stack_of Undo_redo.undo_ops test_repo) = 1);
      Undo_redo.clear_history test_repo;
      let _p, _par, child_uuid = seed_page_parent_child () in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             [ ("outliner-op", Keyword "save-block"); ("local-tx?", Bool false) ]
           (Printf.sprintf
              "[[:db/add [:block/uuid %s] :block/title \"remote-update\"]]"
              (uuid_lit child_uuid)));
      check "no undo op for remote tx"
        (stack_of Undo_redo.undo_ops test_repo = []))

let latest_undo_op () =
  match List.rev (stack_of Undo_redo.undo_ops test_repo) with
  | op :: _ -> Some op
  | [] -> None

let test_undo_history_records_semantic_action_metadata () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             (local_tx_meta
                ~extra:
                  [ ("client-id", String "test-client")
                  ; ("outliner-op", Keyword "save-block")
                  ; ( "outliner-ops"
                    , edn_value
                        (Printf.sprintf
                           "[[:save-block [{:block/uuid %s :block/title \"semantic-save\"} {}]]]"
                           (uuid_lit child_uuid)) )
                  ]
                ())
           (Printf.sprintf
              "[[:db/add [:block/uuid %s] :block/title \"semantic-save\"]]"
              (uuid_lit child_uuid)));
      match Option.bind (latest_undo_op ()) db_transact_data with
      | None -> Alcotest.fail "no undo op"
      | Some data ->
          check "tx-id is uuid" (data_uuid "db-sync/tx-id" data <> None);
          check "forward first op is save-block"
            (match
               data_get_in data
                 [ `K "db-sync/forward-outliner-ops"; `I 0; `I 0 ]
             with
             | Some (Wire.Keyword "save-block") -> true
             | _ -> false);
          check "inverse first op is save-block"
            (match
               data_get_in data
                 [ `K "db-sync/inverse-outliner-ops"; `I 0; `I 0 ]
             with
             | Some (Wire.Keyword "save-block") -> true
             | _ -> false);
          check "forward block uuid"
            (Option.bind
                (data_get_in data
                   [ `K "db-sync/forward-outliner-ops"; `I 0; `I 1; `I 0
                   ; `K "block/uuid" ])
                uuid_str_of_wire = Some child_uuid);
          check "inverse block uuid"
            (Option.bind
                (data_get_in data
                   [ `K "db-sync/inverse-outliner-ops"; `I 0; `I 1; `I 0
                   ; `K "block/uuid" ])
                uuid_str_of_wire = Some child_uuid))

let test_undo_history_allows_non_semantic_outliner_op () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             (local_tx_meta
                ~extra:
                  [ ("client-id", String "test-client")
                  ; ("outliner-op", Keyword "restore-recycled") ]
                ())
           (Printf.sprintf
              "[[:db/add [:block/uuid %s] :block/title \"restored child\"]]"
              (uuid_lit child_uuid)));
      match Option.bind (latest_undo_op ()) db_transact_data with
      | None -> Alcotest.fail "no undo op"
      | Some data ->
          check "no inverse ops"
            (match data_get "db-sync/inverse-outliner-ops" data with
             | None | Some Wire.Nil -> true
             | _ -> false))

let test_undo_history_canonicalizes_insert_block_uuids () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_uuid, _p, _c = seed_page_parent_child () in
      let page_id =
        match ent_at_uuid (db_of conn) page_uuid with
        | Some e -> e.id
        | None -> failwith "page entity missing"
      in
      let requested_uuid = Uuid_gen.uuid () in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             (local_tx_meta
                ~extra:
                  [ ("client-id", String "test-client")
                  ; ("outliner-op", Keyword "insert-blocks")
                  ; ( "outliner-ops"
                    , edn_value
                        (Printf.sprintf
                           "[[:insert-blocks [[{:block/title \"semantic insert\" :block/uuid %s}] %d {:sibling? false}]]]"
                           (uuid_lit requested_uuid) page_id) )
                  ]
                ())
           (Printf.sprintf
              "[{:block/uuid %s :block/title \"semantic insert\" \
                :block/page [:block/uuid %s] :block/parent [:block/uuid %s]}]"
              (uuid_lit requested_uuid) (uuid_lit page_uuid)
              (uuid_lit page_uuid)));
      let db = db_of conn in
      let inserted_id =
        match
          Datascript.q_string db
            "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
            ~inputs:[ Arg_scalar (Result_value (String "semantic insert")) ]
        with
        | [ [ Result_entity id ] ] -> id
        | [ [ Result_value (Int id) ] ] -> id
        | _ -> failwith "inserted not found"
      in
      let inserted_uuid =
        match Datascript.entity db (Entity_id inserted_id) with
        | Some e -> ent_uuid_of e
        | None -> ""
      in
      match Option.bind (latest_undo_op ()) db_transact_data with
      | None -> Alcotest.fail "no undo op"
      | Some data ->
          check "forward inserted uuid"
            (Option.bind
                (data_get_in data
                   [ `K "db-sync/forward-outliner-ops"; `I 0; `I 1; `I 0; `I 0
                   ; `K "block/uuid" ])
                uuid_str_of_wire = Some inserted_uuid);
          check "inverse inserted uuid"
            (Option.bind
                (data_get_in data
                   [ `K "db-sync/inverse-outliner-ops"; `I 0; `I 1; `I 0; `I 0 ])
                uuid_str_of_wire = Some inserted_uuid))

let test_undo_works_for_local_graph () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      save_block_title conn child_uuid "local-1";
      let undo_result = Undo_redo.undo test_repo in
      check "undo result is map"
        (match undo_result with Wire.Map _ -> true | _ -> false);
      check "title back to child"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "child"
         | None -> false);
      let redo_result = Undo_redo.redo test_repo in
      check "redo result is map"
        (match redo_result with Wire.Map _ -> true | _ -> false);
      check "title local-1"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "local-1"
         | None -> false))

let test_undo_cycle_todo_removes_task_class () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let block_uuid =
        match Db_test_util.find_block_by_content (db_of conn) "task" with
        | Some e -> ent_uuid_of e
        | None -> failwith "task not found"
      in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:set-block-property [%s :logseq.property/status :logseq.property/status.todo]]]"
              (uuid_lit block_uuid)));
      let db = db_of conn in
      let block_after_set = Option.get (ent_at_uuid db block_uuid) in
      check "status ident todo"
        (match Ldb.ref_ent block_after_set "logseq.property/status" with
         | Some s -> ent_ident s = Some "logseq.property/status.todo"
         | None -> false);
      check "has Task tag"
        (List.exists
           (fun t -> ent_ident t = Some "logseq.class/Task")
           (Ldb.ref_ents block_after_set "block/tags"));
      check "undo map"
        (match Undo_redo.undo test_repo with Wire.Map _ -> true | _ -> false);
      let db = db_of conn in
      let block_after_undo = Option.get (ent_at_uuid db block_uuid) in
      check "status removed"
        (Ldb.value block_after_undo "logseq.property/status" = None);
      check "Task tag removed"
        (not
           (List.exists
              (fun t -> ent_ident t = Some "logseq.class/Task")
              (Ldb.ref_ents block_after_undo "block/tags"))))

let test_undo_delete_page_restores_page_out_of_recycle () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_uuid, _p, _c = seed_page_parent_child () in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf "[[:delete-page [%s {}]]]" (uuid_lit page_uuid)));
      let deleted_page = Option.get (ent_at_uuid (db_of conn) page_uuid) in
      check "page recycled" (Ldb.recycled deleted_page);
      let undo_result = Undo_redo.undo test_repo in
      let restored_page = Option.get (ent_at_uuid (db_of conn) page_uuid) in
      check "undo result map"
        (match undo_result with Wire.Map _ -> true | _ -> false);
      check "page not recycled" (not (Ldb.recycled restored_page));
      check "no parent" (Ldb.value restored_page "block/parent" = None);
      check "no deleted-at"
        (Ldb.value restored_page "logseq.property/deleted-at" = None);
      check "no original-parent"
        (Ldb.value restored_page "logseq.property.recycle/original-parent"
        = None);
      check "no original-page"
        (Ldb.value restored_page "logseq.property.recycle/original-page"
        = None);
      check "no original-order"
        (Ldb.value restored_page "logseq.property.recycle/original-order"
        = None))

let test_undo_delete_comment_restores_created_by_ref () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_uuid, _p, _c = seed_page_parent_child () in
      let user_uuid = Uuid_gen.uuid () in
      let comments_uuid = Uuid_gen.uuid () in
      let comment_uuid = Uuid_gen.uuid () in
      let now = Int64.of_float (Clock.now_ms ()) in
      ignore
        (transact_conn_string conn
           (Printf.sprintf
              "[{:block/uuid %s :block/title \"Alice\" :block/name \"alice\" :block/tags :logseq.class/Page :block/created-at %Ld :block/updated-at %Ld} {:block/uuid %s :block/title \"Comments\" :block/page [:block/uuid %s] :block/parent [:block/uuid %s] :block/tags :logseq.class/Comments :block/created-at %Ld :block/updated-at %Ld} {:block/uuid %s :block/title \"hello\" :block/page [:block/uuid %s] :block/parent [:block/uuid %s] :block/tags :logseq.class/Comment :logseq.property/created-by-ref [:block/uuid %s] :block/created-at %Ld :block/updated-at %Ld}]"
              (uuid_lit user_uuid) now now (uuid_lit comments_uuid)
              (uuid_lit page_uuid) (uuid_lit page_uuid) now now
              (uuid_lit comment_uuid) (uuid_lit page_uuid)
              (uuid_lit comments_uuid) (uuid_lit user_uuid) now now));
      Undo_redo.clear_history test_repo;
      ignore
        (apply_ops_edn conn
           (Printf.sprintf "[[:delete-blocks [[%s] {}]]]"
              (uuid_lit comment_uuid)));
      check "comment deleted" (ent_at_uuid (db_of conn) comment_uuid = None);
      let undo_result = Undo_redo.undo test_repo in
      check "undo result map"
        (match undo_result with Wire.Map _ -> true | _ -> false);
      let restored = Option.get (ent_at_uuid (db_of conn) comment_uuid) in
      check "created-by-ref title Alice"
        (match Ldb.ref_ent restored "logseq.property/created-by-ref" with
         | Some u -> ent_title_of u = Some "Alice"
         | None -> false))

let test_undo_delete_page_restores_class_property_and_today_page () =
  with_worker_conns (fun () ->
      let conn = conn () in
      let class_title = "undo class page movie" in
      let class_uuid =
        match
          apply_ops_edn conn
            (Printf.sprintf
               "[[:create-page [%s {:class? true :redirect? false :split-namespace? true :tags ()}]]]"
               (qstr class_title))
        with
        | Wire.Array [ _; Wire.Uuid u ] -> u
        | Wire.Array [ _; Wire.String u ] -> u
        | _ -> (
            match Db_test_util.find_page_by_title (db_of conn) class_title with
            | Some e -> ent_uuid_of e
            | None -> Alcotest.fail "create-page returned no uuid")
      in
      ignore
        (apply_ops_edn conn
           "[[:upsert-property [:user.property/undo-rating {:logseq.property/type :number} {:property-name \"undo-rating\"}]]]");
      let property_uuid =
        match entity_of_ident (db_of conn) "user.property/undo-rating" with
        | Some e -> ent_uuid_of e
        | None -> failwith "property page missing"
      in
      let today_day =
        Date_time_util.ms_to_journal_day (Int64.of_float (Clock.now_ms ()))
      in
      let today_title =
        let journal =
          Option.get (entity_of_ident (db_of conn) "logseq.class/Journal")
        in
        let fmt =
          Option.value
            (Ldb.string_value journal "logseq.property.journal/title-format")
            ~default:"MMM do, yyyy"
        in
        Date_time_util.int_to_journal_title today_day fmt
      in
      let today_page_uuid =
        match
          apply_ops_edn conn
            (Printf.sprintf
               "[[:create-page [%s {:today-journal? true :redirect? false :split-namespace? true :tags ()}]]]"
               (qstr today_title))
        with
        | Wire.Array [ _; Wire.Uuid u ] -> u
        | Wire.Array [ _; Wire.String u ] -> u
        | _ -> (
            match Db_test_util.find_page_by_title (db_of conn) today_title with
            | Some e -> ent_uuid_of e
            | None -> Alcotest.fail "today page create returned no uuid")
      in
      let today_page_id =
        match ent_at_uuid (db_of conn) today_page_uuid with
        | Some e -> e.id
        | None -> failwith "today page missing"
      in
      let today_child_uuid = Uuid_gen.uuid () in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:insert-blocks [[{:block/uuid %s :block/title \"today undo child\"}] %d {:sibling? false :keep-uuid? true}]]]"
              (uuid_lit today_child_uuid) today_page_id));
      let class_ident_before =
        Option.bind (ent_at_uuid (db_of conn) class_uuid) ent_ident
      in
      let property_ident_before =
        Option.bind (ent_at_uuid (db_of conn) property_uuid) ent_ident
      in
      Undo_redo.clear_history test_repo;
      ignore
        (apply_ops_edn conn
           (Printf.sprintf "[[:delete-page [%s {}]]]" (uuid_lit class_uuid)));
      check "class page deleted" (ent_at_uuid (db_of conn) class_uuid = None);
      check "undo class map"
        (match Undo_redo.undo test_repo with Wire.Map _ -> true | _ -> false);
      check "class ident restored"
        (Option.bind (ent_at_uuid (db_of conn) class_uuid) ent_ident
        = class_ident_before);
      Undo_redo.clear_history test_repo;
      ignore
        (apply_ops_edn conn
           (Printf.sprintf "[[:delete-page [%s {}]]]" (uuid_lit property_uuid)));
      check "property deleted"
        (entity_of_ident (db_of conn) "user.property/undo-rating" = None);
      check "undo property map"
        (match Undo_redo.undo test_repo with Wire.Map _ -> true | _ -> false);
      check "property ident restored"
        (Option.bind (ent_at_uuid (db_of conn) property_uuid) ent_ident
        = property_ident_before);
      Undo_redo.clear_history test_repo;
      ignore
        (apply_ops_edn conn
           (Printf.sprintf "[[:delete-page [%s {}]]]"
              (uuid_lit today_page_uuid)));
      check "today page still exists"
        (ent_at_uuid (db_of conn) today_page_uuid <> None);
      check "today child deleted"
        (ent_at_uuid (db_of conn) today_child_uuid = None);
      check "undo today map"
        (match Undo_redo.undo test_repo with Wire.Map _ -> true | _ -> false);
      check "today child restored"
        (ent_at_uuid (db_of conn) today_child_uuid <> None))

let test_redo_create_page_restores_recycled_page () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_title = "redo create page alpha" in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:create-page [%s {:redirect? false :split-namespace? true :tags ()}]]]"
              (qstr page_title)));
      (match Db_test_util.find_page_by_title (db_of conn) page_title with
       | Some e -> check "page not recycled" (not (Ldb.recycled e))
       | None -> Alcotest.fail "created page missing");
      check "undo all non-empty" (undo_all () <> []);
      (match Db_test_util.find_page_by_title (db_of conn) page_title with
       | Some e -> check "page recycled after undo" (Ldb.recycled e)
       | None -> Alcotest.fail "deleted page missing");
      check "redo all non-empty" (redo_all () <> []);
      match Db_test_util.find_page_by_title (db_of conn) page_title with
      | Some e -> check "page restored" (not (Ldb.recycled e))
      | None -> Alcotest.fail "page missing after redo")

let test_redo_template_insert_restores_valid_blocks () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let template_root_uuid, _a, _b, empty_target_uuid = setup_template conn in
      let db = db_of conn in
      let empty_target = Option.get (ent_at_uuid db empty_target_uuid) in
      let blocks_wire = blocks_to_insert_wire db template_root_uuid in
      ignore
        (insert_template_blocks conn blocks_wire empty_target.id
           ~insert_template:true ());
      check "undo all non-empty" (undo_all () <> []);
      check "redo all non-empty" (redo_all () <> []);
      let inserted_a_id = find_inserted_a_id (db_of conn) template_root_uuid in
      check "inserted a exists" (inserted_a_id <> None);
      match inserted_a_id with
      | Some id ->
          let inserted_a = Option.get (entity (db_of conn) (Entity_id id)) in
          check "used-template uuid"
            (match Ldb.ref_ent inserted_a "logseq.property/used-template" with
             | Some t -> ent_uuid_of t = template_root_uuid
             | None -> false)
      | None -> ())

let check_restore_op ~insert_op ~save_op empty_target_uuid =
  check "restore op present" (insert_op <> None || save_op <> None);
  match insert_op, save_op with
  | Some op, _ ->
      check "restore uuid"
        (Option.bind
             (wire_get_in op [ `I 1; `I 0; `I 0; `K "block/uuid" ])
             uuid_str_of_wire = Some empty_target_uuid);
      check "restore title empty"
        (wire_get_in op [ `I 1; `I 0; `I 0; `K "block/title" ]
        = Some (Wire.String ""))
  | None, Some op ->
      check "restore uuid"
        (Option.bind
             (wire_get_in op [ `I 1; `I 0; `K "block/uuid" ])
             uuid_str_of_wire = Some empty_target_uuid);
      check "restore title empty"
        (wire_get_in op [ `I 1; `I 0; `K "block/title" ]
        = Some (Wire.String ""))
  | None, None -> ()

let test_undo_history_canonicalizes_template_replace_empty_target () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let template_root_uuid, _a, _b, empty_target_uuid = setup_template conn in
      let db = db_of conn in
      let empty_target = Option.get (ent_at_uuid db empty_target_uuid) in
      let blocks_wire = blocks_to_insert_wire db template_root_uuid in
      ignore
        (insert_template_blocks conn blocks_wire empty_target.id
           ~insert_template:true ());
      match latest_undo_history_data () with
      | None -> Alcotest.fail "no undo history data"
      | Some data ->
          check "forward op is apply-template or insert-blocks"
            (match
               data_get_in data
                 [ `K "db-sync/forward-outliner-ops"; `I 0; `I 0 ]
             with
             | Some (Wire.Keyword k) ->
                 List.mem k [ "apply-template"; "insert-blocks" ]
             | _ -> false);
          check "inverse delete op"
            (inverse_op_named data "delete-blocks" <> None);
          check_restore_op empty_target_uuid
            ~insert_op:(inverse_op_named data "insert-blocks")
            ~save_op:(inverse_op_named data "save-block"))

let test_undo_history_replace_empty_target_insert_restores_empty_target () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_uuid, _p, _c = seed_page_parent_child () in
      let page_id =
        match ent_at_uuid (db_of conn) page_uuid with
        | Some e -> e.id
        | None -> failwith "page missing"
      in
      let empty_target_uuid = Uuid_gen.uuid () in
      let inserted_root_uuid = Uuid_gen.uuid () in
      let inserted_child_uuid = Uuid_gen.uuid () in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:insert-blocks [[{:block/uuid %s :block/title \"\"}] %d {:sibling? false :keep-uuid? true}]]]"
              (uuid_lit empty_target_uuid) page_id));
      let empty_target =
        Option.get (ent_at_uuid (db_of conn) empty_target_uuid)
      in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:insert-blocks [[{:block/uuid %s :block/title \"insert root\"} {:block/uuid %s :block/title \"insert child\" :block/parent [:block/uuid %s]}] %d {:sibling? true :replace-empty-target? true}]]]"
              (uuid_lit inserted_root_uuid) (uuid_lit inserted_child_uuid)
              (uuid_lit inserted_root_uuid) empty_target.id));
      match latest_undo_history_data () with
      | None -> Alcotest.fail "no undo history data"
      | Some data ->
          check "forward op is insert-blocks"
            (match
               data_get_in data
                 [ `K "db-sync/forward-outliner-ops"; `I 0; `I 0 ]
             with
             | Some (Wire.Keyword "insert-blocks") -> true
             | _ -> false);
          let delete_op = inverse_op_named data "delete-blocks" in
          let delete_ids =
            match
              Option.bind delete_op (fun op -> wire_get_in op [ `I 1; `I 0 ])
            with
            | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
            | _ -> []
          in
          check "delete ids non-empty" (delete_ids <> []);
          check_restore_op empty_target_uuid
            ~insert_op:(inverse_op_named data "insert-blocks")
            ~save_op:(inverse_op_named data "save-block"))

let test_apply_template_op_replays_via_undo_redo () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let template_root_uuid, _a, _b, empty_target_uuid = setup_template conn in
      let db = db_of conn in
      let template_root = Option.get (ent_at_uuid db template_root_uuid) in
      let empty_target = Option.get (ent_at_uuid db empty_target_uuid) in
      let blocks_wire = blocks_to_insert_wire db template_root_uuid in
      ignore
        (apply_template_op conn ~template_root_id:template_root.id
           ~empty_target_id:empty_target.id ~blocks_wire ());
      (match latest_undo_history_data () with
       | Some data ->
           check "forward op apply-template"
             (match
                data_get_in data
                  [ `K "db-sync/forward-outliner-ops"; `I 0; `I 0 ]
              with
              | Some (Wire.Keyword "apply-template") -> true
              | _ -> false)
       | None -> Alcotest.fail "no undo history data");
      check "undo all" (undo_all () <> []);
      check "redo all" (redo_all () <> []);
      let db = db_of conn in
      let inserted_a_id = find_inserted_a_id db template_root_uuid in
      check "inserted a" (inserted_a_id <> None);
      match inserted_a_id with
      | Some id ->
          let inserted_a = Option.get (entity db (Entity_id id)) in
          let inserted_b =
            Ldb.ref_ents inserted_a "block/_parent"
            |> List.find_opt (fun c -> ent_title_of c = Some "b")
          in
          check "inserted b" (inserted_b <> None)
      | None -> ())

let test_apply_template_repeated_undo_redo_uses_latest_history_tx_id () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let template_root_uuid, _a, _b, empty_target_uuid = setup_template conn in
      Undo_redo.clear_history test_repo;
      let db = db_of conn in
      let template_root = Option.get (ent_at_uuid db template_root_uuid) in
      let empty_target = Option.get (ent_at_uuid db empty_target_uuid) in
      let blocks_wire = blocks_to_insert_wire db template_root_uuid in
      ignore
        (apply_template_op conn ~template_root_id:template_root.id
           ~empty_target_id:empty_target.id ~blocks_wire ());
      check "inserted a exists"
        (find_inserted_a_id (db_of conn) template_root_uuid <> None);
      check "undo 1"
        (Undo_redo.undo test_repo
        <> Undo_redo.empty_stack_result ~undo:true);
      check "a gone"
        (find_inserted_a_id (db_of conn) template_root_uuid = None);
      check "redo 1"
        (Undo_redo.redo test_repo
        <> Undo_redo.empty_stack_result ~undo:false);
      let redo_1_a_id = find_inserted_a_id (db_of conn) template_root_uuid in
      check "redo-1 a" (redo_1_a_id <> None);
      check "undo 2"
        (Undo_redo.undo test_repo
        <> Undo_redo.empty_stack_result ~undo:true);
      check "a gone again"
        (find_inserted_a_id (db_of conn) template_root_uuid = None);
      check "redo 2"
        (Undo_redo.redo test_repo
        <> Undo_redo.empty_stack_result ~undo:false);
      let redo_2_a_id = find_inserted_a_id (db_of conn) template_root_uuid in
      check "redo-2 a" (redo_2_a_id <> None);
      check "different entities" (redo_1_a_id <> redo_2_a_id);
      check "undo 3"
        (Undo_redo.undo test_repo
        <> Undo_redo.empty_stack_result ~undo:true);
      check "a gone final"
        (find_inserted_a_id (db_of conn) template_root_uuid = None))

let test_undo_history_records_forward_ops_for_save_block () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      ignore
        (apply_ops_edn conn
           (Printf.sprintf
              "[[:save-block [{:block/uuid %s :block/title \"saved via apply-ops\"} {}]]]"
              (uuid_lit child_uuid)));
      match Option.bind (latest_undo_op ()) db_transact_data with
      | None -> Alcotest.fail "no undo op"
      | Some data ->
          check "forward op save-block"
            (match
               data_get_in data
                 [ `K "db-sync/forward-outliner-ops"; `I 0; `I 0 ]
             with
             | Some (Wire.Keyword "save-block") -> true
             | _ -> false);
          check "forward block uuid"
            (Option.bind
                (data_get_in data
                   [ `K "db-sync/forward-outliner-ops"; `I 0; `I 1; `I 0
                   ; `K "block/uuid" ])
                uuid_str_of_wire = Some child_uuid);
          check "forward block title"
            (data_get_in data
               [ `K "db-sync/forward-outliner-ops"; `I 0; `I 1; `I 0
               ; `K "block/title" ]
             = Some (Wire.String "saved via apply-ops"));
          check "block title applied"
            (match ent_at_uuid (db_of conn) child_uuid with
             | Some e -> ent_title_of e = Some "saved via apply-ops"
             | None -> false))

let test_undo_insert_retracts_added_entity_cleanly () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let page_uuid, _p, _c = seed_page_parent_child () in
      let page_id =
        match ent_at_uuid (db_of conn) page_uuid with
        | Some e -> e.id
        | None -> failwith "page missing"
      in
      let inserted_uuid = Uuid_gen.uuid () in
      ignore
        (transact_conn_string conn
           ~tx_meta:
             (local_tx_meta
                ~extra:
                  [ ("client-id", String "test-client")
                  ; ("outliner-op", Keyword "insert-blocks")
                  ; ( "outliner-ops"
                    , edn_value
                        (Printf.sprintf
                           "[[:insert-blocks [[{:block/title \"inserted\" :block/uuid %s}] %d {:sibling? false}]]]"
                           (uuid_lit inserted_uuid) page_id) )
                  ]
                ())
           (Printf.sprintf
              "[{:block/uuid %s :block/title \"inserted\" \
                :block/page [:block/uuid %s] :block/parent [:block/uuid %s]}]"
              (uuid_lit inserted_uuid) (uuid_lit page_uuid)
              (uuid_lit page_uuid)));
      check "inserted exists" (ent_at_uuid (db_of conn) inserted_uuid <> None);
      let undo_result = Undo_redo.undo test_repo in
      check "undo map"
        (match undo_result with Wire.Map _ -> true | _ -> false);
      check "inserted retracted"
        (ent_at_uuid (db_of conn) inserted_uuid = None))

let test_repeated_save_block_content_undo_redo () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      List.iter
        (fun t -> save_block_title conn child_uuid t)
        [ "v1"; "v2"; "v3" ];
      let title_is want =
        match ent_at_uuid (db_of conn) child_uuid with
        | Some e -> ent_title_of e = Some want
        | None -> false
      in
      check "title v3" (title_is "v3");
      ignore (Undo_redo.undo test_repo);
      check "title v2" (title_is "v2");
      ignore (Undo_redo.undo test_repo);
      check "title v1" (title_is "v1");
      ignore (Undo_redo.undo test_repo);
      check "title child" (title_is "child");
      ignore (Undo_redo.redo test_repo);
      check "title v1 again" (title_is "v1");
      ignore (Undo_redo.redo test_repo);
      check "title v2 again" (title_is "v2");
      ignore (Undo_redo.redo test_repo);
      check "title v3 again" (title_is "v3"))

let test_repeated_save_block_op_content_undo_redo () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      List.iter
        (fun title ->
          ignore
            (apply_ops_edn conn
               (Printf.sprintf
                  "[[:save-block [{:block/uuid %s :block/title %s} {}]]]"
                  (uuid_lit child_uuid) (qstr title))))
        [ "foo"; "foo bar" ];
      let title_is want =
        match ent_at_uuid (db_of conn) child_uuid with
        | Some e -> ent_title_of e = Some want
        | None -> false
      in
      check "title foo bar" (title_is "foo bar");
      ignore (Undo_redo.undo test_repo);
      check "title foo" (title_is "foo");
      ignore (Undo_redo.redo test_repo);
      check "title foo bar again" (title_is "foo bar"))

let test_repeated_set_block_property_text_value_undo_redo () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      List.iter
        (fun (suffix, cardinality) ->
          let property_id =
            Printf.sprintf "user.property/p1-undo-redo-%s" suffix
          in
          ignore
            (apply_ops_edn conn
               (Printf.sprintf
                  "[[:upsert-property [:%s {:logseq.property/type :default :db/cardinality :db.cardinality/%s} {}]]]"
                  property_id cardinality));
          Undo_redo.clear_history test_repo;
          ignore
            (apply_ops_edn conn
               (Printf.sprintf "[[:set-block-property [%s :%s \"value-1\"]]]"
                  (uuid_lit child_uuid) property_id));
          (match latest_undo_history_data () with
           | Some data ->
               check "forward ops empty"
                 (match data_get "db-sync/forward-outliner-ops" data with
                  | Some (Wire.Array []) | Some (Wire.List []) -> true
                  | None -> true
                  | _ -> false)
           | None -> Alcotest.fail "no undo history data");
          for _ = 1 to 3 do
            (match
               Option.bind (latest_undo_history_data ())
                 (data_uuid "db-sync/tx-id")
             with
             | Some id -> poison_history_tx_order id
             | None -> ());
            check "undo map"
              (match Undo_redo.undo test_repo with
               | Wire.Map _ -> true
               | _ -> false);
            let db = db_of conn in
            let e = Option.get (ent_at_uuid db child_uuid) in
            check "value empty after undo"
              (property_value_titles db e property_id = []);
            (match
               Option.bind (latest_redo_history_data ())
                 (data_uuid "db-sync/tx-id")
             with
             | Some id -> poison_history_tx_order id
             | None -> ());
            check "redo map"
              (match Undo_redo.redo test_repo with
               | Wire.Map _ -> true
               | _ -> false);
            let db = db_of conn in
            let e = Option.get (ent_at_uuid db child_uuid) in
            check "value-1 restored"
              (List.mem "value-1" (property_value_titles db e property_id))
          done)
        [ ("one", "one"); ("many", "many") ])

let test_save_two_blocks_undo_targets_latest_block () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, parent_uuid, child_uuid = seed_page_parent_child () in
      save_block_title conn parent_uuid "parent updated";
      save_block_title conn child_uuid "child updated";
      ignore (Undo_redo.undo test_repo);
      let db = db_of conn in
      check "parent still updated"
        (match ent_at_uuid db parent_uuid with
         | Some e -> ent_title_of e = Some "parent updated"
         | None -> false);
      check "child reverted"
        (match ent_at_uuid db child_uuid with
         | Some e -> ent_title_of e = Some "child"
         | None -> false);
      ignore (Undo_redo.undo test_repo);
      check "parent reverted"
        (match ent_at_uuid (db_of conn) parent_uuid with
         | Some e -> ent_title_of e = Some "parent"
         | None -> false))

let test_new_local_save_clears_redo_stack () =
  with_worker_conns (fun () ->
      Undo_redo.clear_history test_repo;
      let conn = conn () in
      let _p, _par, child_uuid = seed_page_parent_child () in
      save_block_title conn child_uuid "v1";
      save_block_title conn child_uuid "v2";
      ignore (Undo_redo.undo test_repo);
      check "title v1"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "v1"
         | None -> false);
      save_block_title conn child_uuid "v3";
      check "redo empty"
        (Undo_redo.redo test_repo
        = Undo_redo.empty_stack_result ~undo:false);
      check "title v3"
        (match ent_at_uuid (db_of conn) child_uuid with
         | Some e -> ent_title_of e = Some "v3"
         | None -> false))

let cases =
  [ Alcotest.test_case "worker-ui-state-roundtrip-test" `Quick
      test_worker_ui_state_roundtrip
  ; Alcotest.test_case "undo-redo-selection-editor-info-roundtrip-test" `Quick
      test_undo_redo_selection_editor_info_roundtrip
  ; Alcotest.test_case
      "undo-missing-history-action-row-replays-from-inline-ops-test" `Quick
      test_undo_missing_history_action_row_replays_from_inline_ops
  ; Alcotest.test_case
      "redo-invalid-history-action-result-keeps-redo-strict-test" `Quick
      test_redo_invalid_history_action_result_keeps_redo_strict
  ; Alcotest.test_case
      "undo-skippable-worker-error-does-not-fallback-to-local-tx-test" `Quick
      test_undo_skippable_worker_error_does_not_fallback
  ; Alcotest.test_case
      "undo-row-missing-and-poisoned-tx-data-does-not-clear-history-test"
      `Quick test_undo_row_missing_and_poisoned_tx_data_does_not_clear_history
  ; Alcotest.test_case "undo-redo-rebinds-stack-to-latest-history-tx-id-test"
      `Quick test_undo_redo_rebinds_stack_to_latest_history_tx_id
  ; Alcotest.test_case "undo-records-only-local-txs-test" `Quick
      test_undo_records_only_local_txs
  ; Alcotest.test_case "undo-history-records-semantic-action-metadata-test"
      `Quick test_undo_history_records_semantic_action_metadata
  ; Alcotest.test_case "undo-history-allows-non-semantic-outliner-op-test"
      `Quick test_undo_history_allows_non_semantic_outliner_op
  ; Alcotest.test_case "undo-history-canonicalizes-insert-block-uuids-test"
      `Quick test_undo_history_canonicalizes_insert_block_uuids
  ; Alcotest.test_case "undo-works-for-local-graph-test" `Quick
      test_undo_works_for_local_graph
  ; Alcotest.test_case "undo-cycle-todo-removes-task-class-test" `Quick
      test_undo_cycle_todo_removes_task_class
  ; Alcotest.test_case "undo-delete-page-restores-page-out-of-recycle-test"
      `Quick test_undo_delete_page_restores_page_out_of_recycle
  ; Alcotest.test_case "undo-delete-comment-restores-created-by-ref-test"
      `Quick test_undo_delete_comment_restores_created_by_ref
  ; Alcotest.test_case
      "undo-delete-page-restores-class-property-and-today-page-test" `Quick
      test_undo_delete_page_restores_class_property_and_today_page
  ; Alcotest.test_case "redo-create-page-restores-recycled-page-test" `Quick
      test_redo_create_page_restores_recycled_page
  ; Alcotest.test_case "redo-template-insert-restores-valid-blocks-test"
      `Quick test_redo_template_insert_restores_valid_blocks
  ; Alcotest.test_case
      "undo-history-canonicalizes-template-replace-empty-target-to-apply-template-test"
      `Quick test_undo_history_canonicalizes_template_replace_empty_target
  ; Alcotest.test_case
      "undo-history-replace-empty-target-insert-restores-empty-target-with-insert-op-test"
      `Quick test_undo_history_replace_empty_target_insert_restores_empty_target
  ; Alcotest.test_case "apply-template-op-replays-via-undo-redo-test" `Quick
      test_apply_template_op_replays_via_undo_redo
  ; Alcotest.test_case
      "apply-template-repeated-undo-redo-uses-latest-history-tx-id-test" `Quick
      test_apply_template_repeated_undo_redo_uses_latest_history_tx_id
  ; Alcotest.test_case "undo-history-records-forward-ops-for-save-block-test"
      `Quick test_undo_history_records_forward_ops_for_save_block
  ; Alcotest.test_case "undo-insert-retracts-added-entity-cleanly-test" `Quick
      test_undo_insert_retracts_added_entity_cleanly
  ; Alcotest.test_case "repeated-save-block-content-undo-redo-test" `Quick
      test_repeated_save_block_content_undo_redo
  ; Alcotest.test_case "repeated-save-block-op-content-undo-redo-test" `Quick
      test_repeated_save_block_op_content_undo_redo
  ; Alcotest.test_case
      "repeated-set-block-property-text-value-undo-redo-test" `Quick
      test_repeated_set_block_property_text_value_undo_redo
  ; Alcotest.test_case "save-two-blocks-undo-targets-latest-block-test" `Quick
      test_save_two_blocks_undo_targets_latest_block
  ; Alcotest.test_case "new-local-save-clears-redo-stack-test" `Quick
      test_new_local_save_clears_redo_stack
  ]
