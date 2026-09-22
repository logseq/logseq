(* 1:1 port of src/test/frontend/worker/db_sync_test.cljs to native OCaml.

   Port notes:
   - p/with-redefs map to hook refs: Sync_deps.* (crypt/fetch),
     Db_tx.* (pipeline hooks), Sync_apply.flush_pending_fn /
     prepare_upload_tx_entries_fn, Sync_assets.enqueue_asset_sync_fn /
     download_remote_assets_if_missing_fn / download_missing_remote_assets_fn,
     Broadcast.set_post_fn, Http via Native_test_hooks.install_http,
     Timers via Native_test_hooks.install_timers.
   - ws/make-fake-websocket maps to Sync_state.fake_ws (a Fake_ws
     ws_endpoint on the client record).
   - worker-state/*main-thread has no native equivalent (the node host
     stubs it): the resolve-ws-token tests keep their js/fetch assertions
     and drop the main-thread call counter.
   - promise-like? / (.then ...) checks: Db_worker_effect runs callbacks
     eagerly, so "is a promise" assertions are replaced by awaiting the
     effect; message-order assertions that relied on JS microtask
     interleaving are preserved where the ordering is observable.
   - client-op/*repo->pending-local-tx-count is the
     Worker_state.pending_local_tx_count table; the cljs `dissoc` maps to
     Worker_state.drop_pending_local_tx_count.
   - tests that drive logseq.db-sync.worker.handler.sync (the Cloudflare
     D1 sync worker) are dropped — there is no OCaml port of that worker.

   Dropped tests (cljs source order):
     - first-local-block-after-upload, first-page-and-block-after-upload,
       snapshot-roundtrip (cljs ~2560-2656: drive the db-sync server
       worker over D1 — no OCaml port). *)

open Datascript
open Db_worker_effect.Infix

let check = Test_shared.check
let kw (s : string) : Wire.t = Wire.Keyword s

let test_repo = "test-db-sync-repo"

(* keep lazy client_ops_conn sqlite files out of the repo dir *)
let () = Unix.putenv "LOGSEQ_WORKER_DB_DIR" (Filename.get_temp_dir_name ())

let local_tx_meta : Wire.t =
  Wire.Map
    [ Wire.Keyword "client-id", Wire.String "test-client"
    ; Wire.Keyword "local-tx?", Wire.Bool true ]

(* ---------- effect helpers ---------- *)

let await_task (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let await_unit (t : unit Db_worker_effect.t) : unit = await_task t

let await_wire (t : Wire.t Db_worker_effect.t) : Wire.t = await_task t

let await_error (t : 'a Db_worker_effect.t) : exn =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok _) -> failwith "expected error, got success"
  | Some (Error e) -> e
  | None -> failwith "task still pending"

(* cljs promise-like? — every Db_worker_effect.t is awaitable *)
let promise_like (_ : 'a Db_worker_effect.t) : bool = true

(* ---------- uuid / wire builders ---------- *)

let uuid_counter = ref 0

let fresh_uuid () : string =
  incr uuid_counter;
  Printf.sprintf "11111111-2222-3333-4444-%012d" !uuid_counter

(* unguessable-but-deterministic uuids for tests that need distinct ones *)
let fresh_uuid_uniq () : string =
  incr uuid_counter;
  Printf.sprintf "99999999-8888-7777-6666-%012d" !uuid_counter

let lref_uuid (attr : string) (u : string) : Wire.t =
  Wire.Array [ Wire.Keyword attr; Wire.Uuid u ]

let tx_add (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ Wire.Keyword "db/add"; e; Wire.Keyword a; v ]

let tx_retract (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ Wire.Keyword "db/retract"; e; Wire.Keyword a; v ]

let tx_retract_entity (e : Wire.t) : Wire.t =
  Wire.Array [ Wire.Keyword "db/retractEntity"; e ]

let tx_data (items : Wire.t list) : Wire.t = Wire.Array items

let wire_map (pairs : (string * Wire.t) list) : Wire.t =
  Wire.Map (List.map (fun (k, v) -> (kw k, v)) pairs)

let msg_json (pairs : (string * Wire.t) list) : string =
  Json_codec.encode (wire_map pairs)

let wire_get_str (k : string) (w : Wire.t) : string option =
  match Wire.get k w with
  | Some (Wire.String s) | Some (Wire.Uuid s) -> Some s
  | _ -> None

let wire_get_int (k : string) (w : Wire.t) : int option =
  match Wire.get k w with
  | Some (Wire.Int n) -> Some n
  | Some (Wire.Int64 n) -> Some (Int64.to_int n)
  | _ -> None

(* ---------- state / config save-restore ---------- *)

(* also snapshots the lib *_fn redef seams so test-local rebinds
   (cljs with-redefs) never leak *)
let preserve_state (f : unit -> 'a) : 'a =
  let state_prev = Hashtbl.copy Worker_state.app_state in
  let cfg_prev = Worker_state.db_sync_config () in
  let auth_token_prev = !(Sync_util.auth_token_fn) in
  let id_token_expired_prev = !(Sync_auth.id_token_expired_fn) in
  let parse_jwt_prev = !(Sync_util.parse_jwt_fn) in
  let remote_tx_prev = Hashtbl.copy Sync_apply.repo_latest_remote_tx in
  let remote_ck_prev = Hashtbl.copy Sync_apply.repo_latest_remote_checksum in
  let stopped_prev = Hashtbl.copy Sync_apply.repo_upload_stopped in
  let large_up_prev = Hashtbl.copy Sync_apply.repo_large_upload_progress in
  let ck_prev = Hashtbl.copy Sync_state.latest_remote_checksums in
  let prep_prev = !(Sync_apply.prepare_upload_tx_entries_fn) in
  let flush_prev = !(Sync_apply.flush_pending_fn) in
  let client_prev = !(Sync_state.db_sync_client) in
  let dev_or_test_prev = !(Sync_state.dev_or_test) in
  let module SD = Sync_deps in
  let sd_encrypt_tx = !(SD.encrypt_tx_data)
  and sd_decrypt_tx = !(SD.decrypt_tx_data)
  and sd_aes_key = !(SD.ensure_graph_aes_key)
  and sd_e2ee = !(SD.graph_e2ee)
  and sd_enc_datoms = !(SD.encrypt_datoms)
  and sd_dec_snap = !(SD.decrypt_snapshot_datoms_batch)
  and sd_enc_text = !(SD.encrypt_text_value)
  and sd_dec_text = !(SD.decrypt_text_value)
  and sd_enc_bytes = !(SD.encrypt_bytes)
  and sd_dec_bytes = !(SD.decrypt_bytes)
  and sd_fetch_key = !(SD.fetch_graph_aes_key_for_download)
  and sd_preflight = !(SD.preflight_upload_e2ee)
  and sd_rsa = !(SD.ensure_user_rsa_keys)
  and sd_grant = !(SD.grant_graph_access)
  and sd_derive = !(SD.derive_history_outliner_ops)
  and sd_semantic = !(SD.semantic_outliner_ops)
  and sd_no_numeric = !(SD.assert_no_numeric_entity_ids)
  and sd_rewr_title = !(SD.rewrite_block_title_with_retracted_refs)
  and sd_apply_ops = !(SD.outliner_apply_ops)
  and sd_page_create = !(SD.outliner_page_create)
  and sd_page_delete = !(SD.outliner_page_delete)
  and sd_upsert_prop = !(SD.outliner_upsert_property)
  and sd_save_block = !(SD.outliner_save_block)
  and sd_insert = !(SD.outliner_insert_blocks)
  and sd_move = !(SD.outliner_move_blocks)
  and sd_move_ud = !(SD.outliner_move_blocks_up_down)
  and sd_indent = !(SD.outliner_indent_outdent_blocks)
  and sd_del_blocks = !(SD.outliner_delete_blocks)
  and sd_template = !(SD.outliner_apply_template)
  and sd_trunc = !(SD.search_truncate_table)
  and sd_import = !(SD.batch_import_edn_fn)
  and sd_canonical = !(SD.canonical_blocks_fn)
  and sd_close = !(SD.close_db)
  and sd_unlink = !(SD.unlink_db)
  and sd_inv_search = !(SD.invalidate_search_db)
  and sd_open_db = !(SD.create_or_open_db)
  and sd_rehydrate = !(SD.rehydrate_large_titles)
  and sd_gen_undo = !(SD.gen_undo_ops)
  and sd_clear_hist = !(SD.clear_history)
  and sd_capture = !(SD.capture_error)
  and sd_fetch_json = !(SD.fetch_json)
  and sd_http_stream = !(SD.http_send_stream) in
  Fun.protect f ~finally:(fun () ->
      Hashtbl.reset Worker_state.app_state;
      Hashtbl.iter (Hashtbl.replace Worker_state.app_state) state_prev;
      Worker_state.set_db_sync_config cfg_prev;
      Sync_util.auth_token_fn := auth_token_prev;
      Sync_auth.id_token_expired_fn := id_token_expired_prev;
      Sync_util.parse_jwt_fn := parse_jwt_prev;
      Hashtbl.reset Sync_apply.repo_latest_remote_tx;
      Hashtbl.iter
        (Hashtbl.replace Sync_apply.repo_latest_remote_tx) remote_tx_prev;
      Hashtbl.reset Sync_apply.repo_latest_remote_checksum;
      Hashtbl.iter
        (Hashtbl.replace Sync_apply.repo_latest_remote_checksum)
        remote_ck_prev;
      Hashtbl.reset Sync_apply.repo_upload_stopped;
      Hashtbl.iter
        (Hashtbl.replace Sync_apply.repo_upload_stopped) stopped_prev;
      Hashtbl.reset Sync_apply.repo_large_upload_progress;
      Hashtbl.iter
        (Hashtbl.replace Sync_apply.repo_large_upload_progress)
        large_up_prev;
      Hashtbl.reset Sync_state.latest_remote_checksums;
      Hashtbl.iter
        (Hashtbl.replace Sync_state.latest_remote_checksums) ck_prev;
      Sync_state.db_sync_client := client_prev;
      Sync_state.dev_or_test := dev_or_test_prev;
      Sync_apply.prepare_upload_tx_entries_fn := prep_prev;
      Sync_apply.flush_pending_fn := flush_prev;
      SD.encrypt_tx_data := sd_encrypt_tx;
      SD.decrypt_tx_data := sd_decrypt_tx;
      SD.ensure_graph_aes_key := sd_aes_key;
      SD.graph_e2ee := sd_e2ee;
      SD.encrypt_datoms := sd_enc_datoms;
      SD.decrypt_snapshot_datoms_batch := sd_dec_snap;
      SD.encrypt_text_value := sd_enc_text;
      SD.decrypt_text_value := sd_dec_text;
      SD.encrypt_bytes := sd_enc_bytes;
      SD.decrypt_bytes := sd_dec_bytes;
      SD.fetch_graph_aes_key_for_download := sd_fetch_key;
      SD.preflight_upload_e2ee := sd_preflight;
      SD.ensure_user_rsa_keys := sd_rsa;
      SD.grant_graph_access := sd_grant;
      SD.derive_history_outliner_ops := sd_derive;
      SD.semantic_outliner_ops := sd_semantic;
      SD.assert_no_numeric_entity_ids := sd_no_numeric;
      SD.rewrite_block_title_with_retracted_refs := sd_rewr_title;
      SD.outliner_apply_ops := sd_apply_ops;
      SD.outliner_page_create := sd_page_create;
      SD.outliner_page_delete := sd_page_delete;
      SD.outliner_upsert_property := sd_upsert_prop;
      SD.outliner_save_block := sd_save_block;
      SD.outliner_insert_blocks := sd_insert;
      SD.outliner_move_blocks := sd_move;
      SD.outliner_move_blocks_up_down := sd_move_ud;
      SD.outliner_indent_outdent_blocks := sd_indent;
      SD.outliner_delete_blocks := sd_del_blocks;
      SD.outliner_apply_template := sd_template;
      SD.search_truncate_table := sd_trunc;
      SD.batch_import_edn_fn := sd_import;
      SD.canonical_blocks_fn := sd_canonical;
      SD.close_db := sd_close;
      SD.unlink_db := sd_unlink;
      SD.invalidate_search_db := sd_inv_search;
      SD.create_or_open_db := sd_open_db;
      SD.rehydrate_large_titles := sd_rehydrate;
      SD.gen_undo_ops := sd_gen_undo;
      SD.clear_history := sd_clear_hist;
      SD.capture_error := sd_capture;
      SD.fetch_json := sd_fetch_json;
      SD.http_send_stream := sd_http_stream)

let with_db_sync_config (cfg : Wire.t) (f : unit -> 'a) : 'a =
  let prev = Worker_state.db_sync_config () in
  Worker_state.set_db_sync_config cfg;
  Fun.protect f ~finally:(fun () -> Worker_state.set_db_sync_config prev)

(* broadcast-to-clients! capture — payload is transit [kind data] *)
let broadcast_data (payload : Wire.t) : Wire.t =
  match payload with
  | Wire.Array [ _kind; data ] -> data
  | _ -> payload

let with_broadcast_capture (f : (string * Wire.t) list ref -> 'a) : 'a =
  let captured = ref [] in
  let prev_default = fun ~kind:_ ~payload:_ -> () in
  Broadcast.set_post_fn (fun ~kind ~payload ->
      captured := !captured @ [ (kind, Transit_codec.of_string payload) ]);
  Fun.protect
    ~finally:(fun () -> Broadcast.set_post_fn prev_default)
    (fun () -> f captured)

(* http fetch stub — cljs (set! js/fetch ...) *)
let with_http_send
    (handler : Native_test_hooks.http_req -> Native_test_hooks.http_resp
               Db_worker_effect.t)
    (f : unit -> 'a) : 'a =
  Native_test_hooks.install_http ~send:handler
    ~send_binary:(fun _ ->
      Db_worker_effect.error (Failure "send_binary not stubbed"));
  Fun.protect f ~finally:Native_test_hooks.restore_http

(* ---------- client ops sqlite db ---------- *)

let new_client_ops_db () : Sqlite.db =
  let db = Sqlite.open_db ~path:":memory:" in
  Sync_client_op.ensure_schema db;
  db

let with_client_ops_db (db : Sqlite.db) (f : unit -> 'a) : 'a =
  let prev = Hashtbl.find_opt Sync_state.client_ops_conns test_repo in
  Hashtbl.replace Sync_state.client_ops_conns test_repo db;
  Fun.protect f ~finally:(fun () ->
      match prev with
      | Some d -> Hashtbl.replace Sync_state.client_ops_conns test_repo d
      | None -> Hashtbl.remove Sync_state.client_ops_conns test_repo)

let sql_text (v : Sqlite.bind) : string option =
  match v with Sqlite.Text s -> Some s | _ -> None

let sql_int (v : Sqlite.bind) : int option =
  match v with Sqlite.Integer n -> Some (Int64.to_int n) | _ -> None

let sqlite_get_row (db : Sqlite.db) (sql : string) (args : Sqlite.bind list)
    : Sqlite.bind array option =
  match Sqlite.query db ~sql ~bind:(Array.of_list args) with
  | r :: _ -> Some r
  | [] -> None

let sqlite_get_rows (db : Sqlite.db) (sql : string) (args : Sqlite.bind list)
    : Sqlite.bind array list =
  Sqlite.query db ~sql ~bind:(Array.of_list args)

(* cljs client-op-tx-row *)
let client_op_tx_row (db : Sqlite.db) (tx_id : string)
    : Sqlite.bind array option =
  sqlite_get_row db
    "select tx_id, pending, failed, created_at from client_ops where kind = 'tx' and tx_id = ? limit 1"
    [ Sqlite.Text tx_id ]

(* cljs sync-conflict-rows -> (block_uuid, attr, value) *)
let sync_conflict_rows (db : Sqlite.db) (block_uuid : string)
    : (string * string * string) list =
  try
    sqlite_get_rows db
      "select block_uuid, attr, value from sync_conflicts where block_uuid = ? order by id asc"
      [ Sqlite.Text block_uuid ]
    |> List.filter_map (fun r ->
           match sql_text r.(0), sql_text r.(1), sql_text r.(2) with
           | Some b, Some a, Some v -> Some (b, a, v)
           | _ -> None)
  with _ -> []

(* cljs seed-client-op-txs! — the db-sync/* keys of the tx maps *)
type seed_tx =
  { s_tx_id : string
  ; s_created_at : int option
  ; s_pending : bool
  ; s_failed : bool
  ; s_outliner_op : string option
  ; s_undo_redo : string option
  ; s_forward_ops : Wire.t list
  ; s_inverse_ops : Wire.t list
  ; s_inferred : bool
  ; s_tx_data : Wire.t
  ; s_reversed_tx_data : Wire.t
  }

let seed_tx ?created_at ?(pending = true) ?(failed = false)
    ?(outliner_op : string option) ?(undo_redo : string option)
    ?(forward_ops = ([] : Wire.t list)) ?(inverse_ops = ([] : Wire.t list))
    ?(inferred = false) ?(tx_data_v = Wire.Array [])
    ?(reversed_tx_data = Wire.Array []) (tx_id : string) : seed_tx =
  { s_tx_id = tx_id
  ; s_created_at = created_at
  ; s_pending = pending
  ; s_failed = failed
  ; s_outliner_op = outliner_op
  ; s_undo_redo = undo_redo
  ; s_forward_ops = forward_ops
  ; s_inverse_ops = inverse_ops
  ; s_inferred = inferred
  ; s_tx_data = tx_data_v
  ; s_reversed_tx_data = reversed_tx_data
  }

let seed_client_op_txs (repo : string) (txs : seed_tx list) : unit =
  List.iter
    (fun t ->
       ignore
         (Sync_client_op.upsert_local_tx_entry repo ~tx_id:t.s_tx_id
            ?created_at:t.s_created_at ~pending:t.s_pending
            ~failed:t.s_failed ~outliner_op:t.s_outliner_op
            ~undo_redo:t.s_undo_redo
            ~forward_outliner_ops:t.s_forward_ops
            ~inverse_outliner_ops:t.s_inverse_ops
            ~inferred_outliner_ops:t.s_inferred
            ~normalized_tx_data:t.s_tx_data
            ~reversed_tx_data:t.s_reversed_tx_data ()))
    txs

(* cljs with-datascript-conns *)
let with_datascript_conns (db_conn : conn) (ops_conn : Sqlite.db option)
    (f : unit -> 'a) : 'a =
  Worker_state.drop_pending_local_tx_count test_repo;
  let db_prev = Worker_state.datascript_conn test_repo in
  let ops_prev = Hashtbl.find_opt Sync_state.client_ops_conns test_repo in
  Worker_state.set_datascript_conn test_repo db_conn;
  (match ops_conn with
   | Some db -> Hashtbl.replace Sync_state.client_ops_conns test_repo db
   | None -> Hashtbl.remove Sync_state.client_ops_conns test_repo);
  Undo_redo.clear_history test_repo;
  (match ops_conn with
   | Some _ when Sync_client_op.get_local_tx test_repo = None ->
       Sync_client_op.update_local_tx test_repo 0
   | _ -> ());
  let listen_key = "db-sync-test-listen-db" in
  (match ops_conn with
   | Some _ ->
       ignore
         (Datascript.listen db_conn listen_key (fun r ->
              Sync_apply.enqueue_local_tx test_repo r))
   | None -> ());
  Fun.protect f ~finally:(fun () ->
      (match ops_conn with
       | Some _ -> Datascript.unlisten db_conn listen_key
       | None -> ());
      Undo_redo.clear_history test_repo;
      Worker_state.drop_pending_local_tx_count test_repo;
      (match db_prev with
       | Some c -> Worker_state.set_datascript_conn test_repo c
       | None -> Worker_state.drop_datascript_conn test_repo);
      (match ops_prev with
       | Some d -> Hashtbl.replace Sync_state.client_ops_conns test_repo d
       | None -> Hashtbl.remove Sync_state.client_ops_conns test_repo))

(* ---------- graph setup helpers ---------- *)

let setup_parent_child () :
    conn * Sqlite.db * entity * entity * entity * entity =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page" }
          ; blocks =
              [ { Db_test_util.default_block with
                  b_title = Some "parent"
                ; b_children =
                    [ { Db_test_util.default_block with
                        b_title = Some "child 1" }
                    ; { Db_test_util.default_block with
                        b_title = Some "child 2" }
                    ; { Db_test_util.default_block with
                        b_title = Some "child 3" } ] } ] } ] ()
  in
  let ops = new_client_ops_db () in
  let find title =
    Option.get (Db_test_util.find_block_by_content (Datascript.db conn) title)
  in
  (conn, ops, find "parent", find "child 1", find "child 2", find "child 3")

let setup_two_parents () :
    conn * Sqlite.db * entity * entity * entity * entity =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page" }
          ; blocks =
              [ { Db_test_util.default_block with
                  b_title = Some "parent a"
                ; b_children =
                    [ { Db_test_util.default_block with
                        b_title = Some "a child 1" }
                    ; { Db_test_util.default_block with
                        b_title = Some "a child 2" } ] }
              ; { Db_test_util.default_block with
                  b_title = Some "parent b"
                ; b_children =
                    [ { Db_test_util.default_block with
                        b_title = Some "b child 1" }
                    ; { Db_test_util.default_block with
                        b_title = Some "b child 2" } ] } ] } ] ()
  in
  let ops = new_client_ops_db () in
  let find title =
    Option.get (Db_test_util.find_block_by_content (Datascript.db conn) title)
  in
  (conn, ops, find "parent a", find "parent b", find "a child 1",
   find "b child 1")

let wire_list (w : Wire.t) : Wire.t list =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* cljs block-id->uuid *)
let block_id_to_uuid (db : db) (v : Wire.t) : Wire.t =
  let by_id (id : int) =
    match Datascript.entity db (Entity_id id) with
    | Some e ->
        (match Ldb.value e "block/uuid" with
         | Some (Uuid _ as u) -> Ds_wire.transit_of_value u
         | _ -> v)
    | None -> v
  in
  match v with
  | Wire.Uuid _ -> v
  | Wire.Array [ Wire.Keyword "block/uuid"; u ] -> u
  | Wire.Int n -> by_id n
  | Wire.Int64 n -> by_id (Int64.to_int n)
  | _ -> v

(* cljs property-id->ident *)
let property_id_to_ident (db : db) (v : Wire.t) : Wire.t =
  match v with
  | Wire.Keyword s when String.contains s '/' -> v
  | Wire.Int n ->
      (match Datascript.entity db (Entity_id n) with
       | Some e ->
           (match Ldb.value e "db/ident" with
            | Some (Keyword _ as k) -> Ds_wire.transit_of_value k
            | _ -> v)
       | None -> v)
  | _ -> v

let nth_opt (xs : 'a list) (i : int) : 'a = List.nth xs i

let _ = nth_opt

(* cljs normalize-op-block-ids — translate :db/id entity ids into
   :block/uuid refs (and property ids into :db/ident idents) in the
   canonical op args, per-op. *)
let normalize_op_block_ids (db : db) (op_entry : Wire.t) : Wire.t =
  let id v = block_id_to_uuid db v in
  let pid v = property_id_to_ident db v in
  let ids vs = Wire.Array (List.map id (wire_list vs)) in
  let op_args op args = Wire.Array [ kw op; Wire.Array args ] in
  match op_entry with
  | Wire.Array [ Wire.Keyword op; Wire.Array args ] -> (
      match op, args with
      | "save-block", [ block; opts ] ->
          let block' =
            match block with
            | Wire.Map kvs ->
                (match Wire.get "db/id" block with
                 | Some (Wire.Uuid u) ->
                     (* cljs: uuid db/id -> dissoc db/id; when block/uuid
                        is nil assoc it to the db/id uuid *)
                     let m1 = List.filter (fun (k, _) -> k <> kw "db/id") kvs in
                     (match Wire.get "block/uuid" block with
                      | None -> Wire.Map (m1 @ [ kw "block/uuid", Wire.Uuid u ])
                      | Some _ -> Wire.Map m1)
                 | Some ((Wire.Int _ | Wire.Int64 _) as nid) ->
                     (match Wire.get "block/uuid" block with
                      | None -> Wire.Map (kvs @ [ kw "block/uuid", id nid ])
                      | Some _ -> block)
                 | _ -> block)
            | _ -> block
          in
          op_args op [ block'; opts ]
      | "insert-blocks", [ a; b; c ] -> op_args op [ a; id b; c ]
      | "apply-template", [ a; b; c ] -> op_args op [ id a; id b; c ]
      | "delete-blocks", [ a; b ] -> op_args op [ ids a; b ]
      | "move-blocks", [ a; b; c ] -> op_args op [ ids a; id b; c ]
      | "move-blocks-up-down", [ a; b ] -> op_args op [ ids a; b ]
      | "indent-outdent-blocks", [ a; b; c ] -> op_args op [ ids a; b; c ]
      | "set-block-property", [ a; b; c ] -> op_args op [ id a; pid b; c ]
      | "remove-block-property", [ a; b ] -> op_args op [ id a; pid b ]
      | "delete-property-value", [ a; b; c ] -> op_args op [ id a; pid b; c ]
      | "create-property-text-block", [ a; b; c; d ] ->
          op_args op
            [ (match a with Wire.Nil -> a | _ -> id a); pid b; c; d ]
      | "batch-set-property", [ a; b; c; d ] ->
          op_args op [ ids a; pid b; c; d ]
      | "batch-remove-property", [ a; b ] -> op_args op [ ids a; pid b ]
      | "batch-delete-property-value", [ a; b; c ] ->
          op_args op [ ids a; pid b; c ]
      | "class-add-property", [ a; b ] -> op_args op [ id a; pid b ]
      | "class-remove-property", [ a; b ] -> op_args op [ id a; pid b ]
      | "upsert-property", [ a; b; c ] ->
          op_args op [ (match a with Wire.Nil -> a | _ -> pid a); b; c ]
      | "upsert-closed-value", [ a; b ] -> op_args op [ pid a; b ]
      | "delete-closed-value", [ a; b ] -> op_args op [ pid a; id b ]
      | "add-existing-values-to-closed-values", [ a; b ] ->
          op_args op [ pid a; b ]
      | _ -> op_entry)
  | _ -> op_entry

(* cljs apply-ops! *)
let apply_ops (conn : conn) (ops : Wire.t list) (opts : Wire.t) : Wire.t =
  Outliner_op.apply_ops conn
    (Wire.Array
       (List.map (normalize_op_block_ids (Datascript.db conn)) ops))
    opts

(* ---------- fake ws / client ---------- *)

let fake_ws ?(ready_state = 1) ?(on_send = fun _ -> ())
    ?(on_close = fun () -> ()) () : Sync_state.ws_endpoint =
  Sync_state.fake_ws ~ready_state ~on_send ~on_close ()

let mk_client ?(graph_id = Some "graph-1") ?(ws : Sync_state.ws_endpoint option)
    ?(inflight = []) ?(pending_pull_since = None) ?(online_users = [])
    ?(ws_state = "open") ?(repo = test_repo) () : Sync_state.client =
  let c = Sync_state.new_client repo in
  c.graph_id <- graph_id;
  c.ws <- ws;
  c.inflight := inflight;
  c.pending_pull_since := pending_pull_since;
  c.online_users := online_users;
  c.ws_state := ws_state;
  c

let sent_wire_messages (raw : string list) : Wire.t list =
  List.map Json_codec.parse raw

(* cljs online-users fixture value *)
let online_users_alice_bob () : Wire.t list =
  [ wire_map [ "user/uuid", Wire.String "u1"; "user/name", Wire.String "Alice" ]
  ; wire_map [ "user/uuid", Wire.String "u2"; "user/name", Wire.String "Bob" ] ]

(* b64url encode for hand-crafted JWTs *)
let b64url_encode (s : string) : string =
  let alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  in
  let n = String.length s in
  let b = Buffer.create ((n + 2) / 3 * 4) in
  let i = ref 0 in
  while !i < n do
    let rem = n - !i in
    let c0 = Char.code s.[!i] in
    let c1 = if rem > 1 then Char.code s.[!i + 1] else 0 in
    let c2 = if rem > 2 then Char.code s.[!i + 2] else 0 in
    let v = (c0 lsl 16) lor (c1 lsl 8) lor c2 in
    Buffer.add_char b alphabet.[(v lsr 18) land 63];
    Buffer.add_char b alphabet.[(v lsr 12) land 63];
    if rem > 1 then Buffer.add_char b alphabet.[(v lsr 6) land 63];
    if rem > 2 then Buffer.add_char b alphabet.[v land 63];
    i := !i + 3
  done;
  Buffer.contents b

let jwt_with_sub (sub : string) : string =
  Printf.sprintf "e30.%s.sig"
    (b64url_encode (Printf.sprintf "{\"sub\":\"%s\"}" sub))

(* set the auth/id-token used by auth-token and get-user-uuid *)
let set_id_token (token : string) : unit =
  Worker_state.merge_state
    (wire_map [ "auth/id-token", Wire.String token ])

(* cljs map equality is unordered; do the same for Wire.Map pairs *)
let rec wire_eq (a : Wire.t) (b : Wire.t) : bool =
  match a, b with
  | Wire.Map kvs, Wire.Map kvs' ->
      List.length kvs = List.length kvs'
      && List.for_all
           (fun (k, v) ->
              match List.find_opt (fun (k', _) -> k' = k) kvs' with
              | Some (_, v') -> wire_eq v v'
              | None -> false)
           kvs
  | Wire.Array xs, Wire.Array xs' | Wire.List xs, Wire.List xs'
  | Wire.List xs, Wire.Array xs' | Wire.Array xs, Wire.List xs' ->
      List.length xs = List.length xs'
      && List.for_all2 wire_eq xs xs'
  | Wire.Set xs, Wire.Set xs' ->
      List.length xs = List.length xs'
      && List.for_all (fun x -> List.exists (fun y -> wire_eq x y) xs') xs
  | _ -> a = b

let wire_equal (a : Wire.t) (b : Wire.t) : bool = wire_eq a b

(* ---------- upload/payload helpers ---------- *)

let entity_block_uuid (e : entity) : Wire.t =
  match Ldb.value e "block/uuid" with
  | Some (Uuid _ as u) -> Ds_wire.transit_of_value u
  | _ -> failwith "entity has no block/uuid"

(* cljs [:block/uuid u] lookup ref *)
let block_uuid_lookup (u : Wire.t) : Wire.t =
  Wire.Array [ kw "block/uuid"; u ]

(* cljs [:db/add e a v] *)
let db_add (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ kw "db/add"; e; kw a; v ]

let db_retract_entity (e : Wire.t) : Wire.t =
  Wire.Array [ kw "db/retractEntity"; e ]

(* cljs (:txs payload) *)
let payload_txs (w : Wire.t) : Wire.t list =
  match Wire.get "txs" w with
  | Some (Wire.Array xs | Wire.List xs) -> xs
  | _ -> []

let str_field (name : string) (w : Wire.t) : string =
  match Wire.get name w with
  | Some (Wire.String s | Wire.Uuid s | Wire.Keyword s) -> s
  | _ -> failwith (Printf.sprintf "missing string field %s" name)

let wire_string_opt (w : Wire.t option) : string option =
  match w with
  | Some (Wire.String s | Wire.Uuid s | Wire.Keyword s) -> Some s
  | _ -> None

let wire_nil_or_absent (w : Wire.t option) : bool =
  match w with None | Some Wire.Nil -> true | _ -> false

let wire_tx_items (w : Wire.t) : Wire.t list =
  match w with Wire.Array xs | Wire.List xs -> xs | _ -> []

let list_sub (xs : 'a list) (start : int) (n : int) : 'a list =
  List.filteri (fun i _ -> i >= start && i < start + n) xs

let read_transit_str (s : string) : Wire.t = Transit_codec.of_string s

(* a fake-ws client whose sends are captured as parsed JSON wire maps *)
let sent_client () : Sync_state.client * Wire.t list ref =
  let sent = ref [] in
  let ws =
    fake_ws ~on_send:(fun raw ->
        sent := !sent @ [ Json_codec.parse raw ]) ()
  in
  (mk_client ~ws (), sent)

(* set-timeout/clear-timeout capture — cljs (set! js/setTimeout ...) *)
let with_timeout_capture
    (f : (unit -> unit) option ref -> int option ref -> 'a) : 'a =
  let cb = ref None in
  let ms = ref None in
  Native_test_hooks.install_timers
    ~set_timeout:(fun n fn ->
      cb := Some fn;
      ms := Some n;
      { Native_test_hooks.cancelled = false })
    ~set_interval:(fun _ _ -> { Native_test_hooks.cancelled = false });
  Fun.protect (fun () -> f cb ms)
    ~finally:Native_test_hooks.restore_timers

(* cljs shared flush-pending upload prelude: parent/child graph +
   client-ops conn + capturing fake ws; the callback seeds txs (it needs
   child1's uuid) and runs the scenario *)
let with_large_upload
    (f : Sync_state.client -> Wire.t list ref -> string -> entity -> 'a)
    : 'a =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let sent = ref [] in
      let ws =
        fake_ws ~on_send:(fun raw ->
            sent := !sent @ [ Json_codec.parse raw ]) ()
      in
      let client = mk_client ~ws () in
      with_datascript_conns conn (Some ops) (fun () ->
          (* cljs with-redefs [worker-state/online? (constantly true)
             sync-crypt/graph-e2ee? (constantly false)] — native online?
             is always true *)
          Sync_deps.graph_e2ee := Some (fun _ -> false);
          Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo 0;
          Sync_client_op.update_local_tx test_repo 0;
          f client sent tx_id child1))

let payload_tx_entry (payload : Wire.t) : Wire.t =
  match payload_txs payload with
  | e :: _ -> e
  | [] -> failwith "no txs in payload"

(* cljs (:tx tx-entry) transit-read *)
let uploaded_tx_of (tx_entry : Wire.t) : Wire.t list =
  wire_tx_items (read_transit_str (str_field "tx" tx_entry))

(* cljs ack-upload-response! + bump remote/local t + flush again *)
let ack_and_reflush (client : Sync_state.client) (remote_tx : int) : unit =
  Sync_apply.ack_upload_response test_repo client;
  Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo remote_tx;
  Sync_client_op.update_local_tx test_repo remote_tx;
  await_unit (Sync_apply.flush_pending test_repo client)

(* ---------- tests ---------- *)

(* (deftest resolve-ws-token-refreshes-when-token-expired-test ...)
   cljs also asserts the main-thread ensure-id&access-token path is NOT
   called; worker-state/*main-thread is a node-host stub here, so that
   counter is dropped. *)
let test_resolve_ws_token_refreshes () =
  preserve_state (fun () ->
      Worker_state.set_db_sync_config
        (wire_map
           [ ( "feature-flags"
             , wire_map [ "worker-auth-refresh?", Wire.Bool true ] ) ]);
      Worker_state.merge_state
        (wire_map
           [ "auth/id-token", Wire.String "expired-token"
           ; "auth/refresh-token", Wire.String "refresh-token"
           ; ( "auth/oauth-token-url"
             , Wire.String "https://auth.example.com/oauth2/token" )
           ; ( "auth/oauth-client-id"
             , Wire.String "worker-client-id" ) ]);
      let fetch_calls = ref [] in
      (* cljs with-redefs [sync-util/auth-token (fn [] "expired-token")
         sync-auth/id-token-expired? (fn [_] true)] *)
      Sync_util.auth_token_fn := (fun () -> Some "expired-token");
      Sync_auth.id_token_expired_fn := (fun _ -> true);
      with_http_send
        (fun (req : Native_test_hooks.http_req) ->
           fetch_calls := !fetch_calls @ [ req ];
           Db_worker_effect.pure
             { Native_test_hooks.status = 200
             ; headers = []
             ; body =
                 "{\"id_token\":\"fresh-worker-token\",\"access_token\":\"fresh-worker-access-token\"}" })
        (fun () ->
           let token = await_task (Sync_auth.resolve_ws_token ()) in
           check "1 fetch call" (List.length !fetch_calls = 1);
           check "fresh-worker-token"
             (token = Some "fresh-worker-token");
           check "id-token stored"
             (Worker_state.state_get "auth/id-token"
              = Some (Wire.String "fresh-worker-token"));
           check "access-token stored"
             (Worker_state.state_get "auth/access-token"
              = Some (Wire.String "fresh-worker-access-token"))))

let test_resolve_ws_token_no_main_thread_fallback () =
  preserve_state (fun () ->
      Worker_state.set_db_sync_config
        (wire_map
           [ ( "feature-flags"
             , wire_map [ "worker-auth-refresh?", Wire.Bool false ] ) ]);
      Worker_state.merge_state
        (wire_map
           [ "auth/id-token", Wire.String "expired-token"
           ; "auth/refresh-token", Wire.String "refresh-token"
           ; ( "auth/oauth-token-url"
             , Wire.String "https://auth.example.com/oauth2/token" )
           ; ( "auth/oauth-client-id"
             , Wire.String "worker-client-id" ) ]);
      let fetch_calls = ref 0 in
      Sync_util.auth_token_fn := (fun () -> Some "expired-token");
      Sync_auth.id_token_expired_fn := (fun _ -> true);
      with_http_send
        (fun (_ : Native_test_hooks.http_req) ->
           incr fetch_calls;
           Db_worker_effect.pure
             { Native_test_hooks.status = 200
             ; headers = []
             ; body =
                 "{\"id_token\":\"fresh-worker-token-2\",\"access_token\":\"fresh-worker-access-token-2\"}" })
        (fun () ->
           let token = await_task (Sync_auth.resolve_ws_token ()) in
           check "1 fetch call" (!fetch_calls = 1);
           check "fresh-worker-token-2"
             (token = Some "fresh-worker-token-2");
           check "id-token stored"
             (Worker_state.state_get "auth/id-token"
              = Some (Wire.String "fresh-worker-token-2"))))

let test_update_online_users_dedupes () =
  preserve_state (fun () ->
      let client = mk_client ~online_users:[] ~ws_state:"open" () in
      with_broadcast_capture (fun broadcasts ->
          let users =
            [ wire_map
                [ "user-id", Wire.String "u1"
                ; "username", Wire.String "Alice" ] ]
          in
          Sync_client.update_online_users client users;
          Sync_client.update_online_users client users;
          check "1 broadcast" (List.length !broadcasts = 1);
          let payload =
            match !broadcasts with
            | [ (_, p) ] -> broadcast_data p
            | _ -> Wire.Nil
          in
          check "online-users payload"
            (wire_equal
               (match Wire.get "online-users" payload with
                | Some v -> v
                | None -> Wire.Nil)
               (Wire.Array
                  [ wire_map
                      [ "user/uuid", Wire.String "u1"
                      ; "user/name", Wire.String "Alice" ] ]))))

let test_presence_message_ignores_source_client () =
  preserve_state (fun () ->
      let client = mk_client ~online_users:(online_users_alice_bob ())
          ~ws_state:"open" () in
      (* cljs with-redefs [worker-state/get-id-token (fn [] "token")
         worker-util/parse-jwt (fn [_] {:sub "u1"})] *)
      set_id_token "token";
      Sync_util.parse_jwt_fn :=
        (fun _ -> Some (wire_map [ "sub", Wire.String "u1" ]));
      let raw =
        msg_json
          [ "type", Wire.String "presence"
          ; "user-id", Wire.String "u1"
          ; "editing-block-uuid", Wire.String "block-self" ]
      in
      with_broadcast_capture (fun broadcasts ->
          Sync_handle_message.handle_message test_repo client raw;
          check "online-users unchanged"
            (List.length !(client.online_users) = 2
             && wire_equal
                  (Wire.Array !(client.online_users))
                  (Wire.Array (online_users_alice_bob ())));
          check "no broadcasts" (!broadcasts = [])))

let test_presence_message_updates_other_user () =
  preserve_state (fun () ->
      let client = mk_client ~online_users:(online_users_alice_bob ())
          ~ws_state:"open" () in
      set_id_token "token";
      Sync_util.parse_jwt_fn :=
        (fun _ -> Some (wire_map [ "sub", Wire.String "u1" ]));
      let raw =
        msg_json
          [ "type", Wire.String "presence"
          ; "user-id", Wire.String "u2"
          ; "editing-block-uuid", Wire.String "block-2" ]
      in
      with_broadcast_capture (fun broadcasts ->
          Sync_handle_message.handle_message test_repo client raw;
          check "u2 editing-block-uuid set"
            (match Wire.get "user/uuid" (List.nth !(client.online_users) 1) with
             | Some (Wire.String "u2") ->
                 Wire.get "user/editing-block-uuid"
                   (List.nth !(client.online_users) 1)
                 = Some (Wire.String "block-2")
             | _ -> false);
          check "1 broadcast" (List.length !broadcasts = 1)))


(* (deftest ws-send-tx-batch-serializes-tx-id-as-uuid-string-test ...) *)
let test_ws_send_tx_batch_serializes_tx_id_as_uuid_string () =
  preserve_state (fun () ->
      let sent_raw = ref None in
      let ws = fake_ws ~on_send:(fun raw -> sent_raw := Some raw) () in
      let tx_id = fresh_uuid () in
      await_unit
        (Sync_transport.send ws
           (wire_map
              [ "type", Wire.String "tx/batch"
              ; "t-before", Wire.Int 99
              ; "txs"
                , Wire.Array
                    [ wire_map
                        [ "tx", Wire.String "[]"
                        ; "tx-id", Wire.Uuid tx_id
                        ; "outliner-op", kw "move-blocks" ] ] ]));
      let payload = Json_codec.parse (Option.get !sent_raw) in
      let payload_tx_id =
        match payload_txs payload with
        | e :: _ -> Wire.get "tx-id" e
        | [] -> None
      in
      check "type tx/batch"
        (Wire.get "type" payload = Some (Wire.String "tx/batch"));
      check "tx-id serialized" (payload_tx_id = Some (Wire.String tx_id));
      check "tx-id is string"
        (match payload_tx_id with
         | Some (Wire.String _) -> true
         | _ -> false))

(* (deftest coerce-ws-server-message-accepts-legacy-tx-reject-shape-test ...) *)
let test_coerce_ws_server_message_accepts_legacy_tx_reject_shape () =
  let failed_tx_id = fresh_uuid () in
  let success_tx_id = fresh_uuid () in
  let coerced =
    Option.get
      (Sync_transport.coerce_ws_server_message
         (wire_map
            [ "type", Wire.String "tx/reject"
            ; "reason", Wire.String "db transact failed"
            ; "t", Wire.Int 1392
            ; "error-detail", Wire.String "legacy server detail"
            ; "failed-tx-id", wire_map [ "uuid", Wire.String failed_tx_id ]
            ; "success-tx-ids"
              , Wire.Array
                  [ wire_map [ "uuid", Wire.String success_tx_id ] ] ]))
  in
  check "type" (Wire.get "type" coerced = Some (Wire.String "tx/reject"));
  check "error-detail"
    (Wire.get "error-detail" coerced
     = Some (Wire.String "legacy server detail"));
  check "failed-tx-id"
    (wire_string_opt (Wire.get "failed-tx-id" coerced) = Some failed_tx_id);
  check "success-tx-ids"
    (match Wire.get "success-tx-ids" coerced with
     | Some (Wire.Array [ w ]) -> wire_string_opt (Some w) = Some success_tx_id
     | _ -> false)

(* (deftest flush-pending-honors-stop-upload-debug-flag-test ...) *)
let test_flush_pending_honors_stop_upload_debug_flag () =
  preserve_state (fun () ->
      let conn, ops, _parent, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let prepare_calls = ref 0 in
      let send_calls = ref 0 in
      let ws = fake_ws ~on_send:(fun _ -> incr send_calls) () in
      let client = mk_client ~ws () in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo 0;
          Sync_client_op.update_local_tx test_repo 0;
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (entity_block_uuid child1))
                         "block/title"
                         (Wire.String "pending upload debug gate test") ])
                tx_id ];
          (* cljs with-redefs [sync-apply/prepare-upload-tx-entries ...] *)
          Sync_apply.prepare_upload_tx_entries_fn :=
            (fun ?repo:_repo _conn _pending ->
               incr prepare_calls;
               ([], [], []));
          ignore (Sync_apply.set_upload_stopped test_repo true);
          await_unit (Sync_apply.flush_pending test_repo client);
          check "prepare skipped" (!prepare_calls = 0);
          check "no sends" (!send_calls = 0);
          ignore (Sync_apply.set_upload_stopped test_repo false);
          await_unit (Sync_apply.flush_pending test_repo client);
          check "prepare ran once" (!prepare_calls = 1);
          check "still no sends" (!send_calls = 0)))

(* (deftest flush-pending-splits-large-upload-request-test ...) *)
let test_flush_pending_splits_large_upload_request () =
  with_large_upload (fun client sent tx_id child1 ->
      let child_ref = block_uuid_lookup (entity_block_uuid child1) in
      let split_tempid = "large-upload-request-split" in
      let tx_data =
        List.concat
          [ List.init 4999 (fun _ ->
                db_add child_ref "block/title"
                  (Wire.String "large upload request split"))
          ; [ db_add (Wire.String split_tempid) "block/uuid"
                (Wire.Uuid (fresh_uuid ()))
            ; db_add (Wire.String split_tempid) "block/title"
                (Wire.String "grouped split tail") ] ]
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      let payload = List.hd !sent in
      let tx_entry = payload_tx_entry payload in
      let uploaded_tx = uploaded_tx_of tx_entry in
      check "type tx/batch"
        (Wire.get "type" payload = Some (Wire.String "tx/batch"));
      check "first chunk nil tx-id"
        (wire_nil_or_absent (Wire.get "tx-id" tx_entry));
      check "first chunk 4999" (List.length uploaded_tx = 4999);
      check "inflight empty" (!(client.inflight) = []);
      ack_and_reflush client 1;
      let payload2 = List.nth !sent 1 in
      let tx_entry2 = payload_tx_entry payload2 in
      let uploaded2 = uploaded_tx_of tx_entry2 in
      check "second tx/batch"
        (Wire.get "type" payload2 = Some (Wire.String "tx/batch"));
      check "second tx-id"
        (wire_string_opt (Wire.get "tx-id" tx_entry2) = Some tx_id);
      check "second chunk 2" (List.length uploaded2 = 2);
      check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]))

(* (deftest flush-pending-retries-large-upload-chunk-until-server-ack-test ...) *)
let test_flush_pending_retries_large_upload_chunk_until_server_ack () =
  with_large_upload (fun client sent tx_id child1 ->
      let child_ref = block_uuid_lookup (entity_block_uuid child1) in
      let tx_data =
        List.concat
          [ List.init 5000 (fun _ ->
                db_add child_ref "block/title"
                  (Wire.String "large upload retry split"))
          ; [ db_add child_ref "block/title"
                (Wire.String "large upload retry tail") ] ]
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      await_unit (Sync_apply.flush_pending test_repo client);
      check "2 sends" (List.length !sent = 2);
      List.iter
        (fun payload ->
           let tx_entry = payload_tx_entry payload in
           let uploaded_tx = uploaded_tx_of tx_entry in
           check "type tx/batch"
             (Wire.get "type" payload = Some (Wire.String "tx/batch"));
           check "nil tx-id"
             (wire_nil_or_absent (Wire.get "tx-id" tx_entry));
           check "5000 chunk" (List.length uploaded_tx = 5000))
        !sent)

(* (deftest flush-pending-splits-large-upload-request-with-dependent-blocks-test
   ...) *)
let test_flush_pending_splits_large_upload_request_with_dependent_blocks () =
  with_large_upload (fun client sent tx_id child1 ->
      let child_ref = block_uuid_lookup (entity_block_uuid child1) in
      let parent_uuid = fresh_uuid () in
      let child_uuid = fresh_uuid () in
      let parent_tempid = "large-upload-parent" in
      let child_tempid = "large-upload-child" in
      let parent_tx =
        [ db_add (Wire.String parent_tempid) "block/uuid"
            (Wire.Uuid parent_uuid)
        ; db_add (Wire.String parent_tempid) "block/title"
            (Wire.String "split parent")
        ; db_add (Wire.String parent_tempid) "block/page" child_ref
        ; db_add (Wire.String parent_tempid) "block/parent" child_ref
        ; db_add (Wire.String parent_tempid) "block/order"
            (Wire.String "a0")
        ; db_add (Wire.String parent_tempid) "block/created-at"
            (Wire.Int 1)
        ; db_add (Wire.String parent_tempid) "block/updated-at"
            (Wire.Int 1) ]
      in
      let child_tx =
        [ db_add (Wire.String child_tempid) "block/uuid"
            (Wire.Uuid child_uuid)
        ; db_add (Wire.String child_tempid) "block/title"
            (Wire.String "split child")
        ; db_add (Wire.String child_tempid) "block/page" child_ref
        ; db_add (Wire.String child_tempid) "block/parent"
            (Wire.Uuid parent_uuid)
        ; db_add (Wire.String child_tempid) "block/order"
            (Wire.String "a1")
        ; db_add (Wire.String child_tempid) "block/created-at"
            (Wire.Int 2)
        ; db_add (Wire.String child_tempid) "block/updated-at"
            (Wire.Int 2) ]
      in
      let tx_data =
        List.concat
          [ List.init 4993 (fun _ ->
                db_add child_ref "block/title"
                  (Wire.String "large upload dependency split"))
          ; parent_tx
          ; child_tx ]
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      let payload = List.hd !sent in
      let tx_entry = payload_tx_entry payload in
      check "type tx/batch"
        (Wire.get "type" payload = Some (Wire.String "tx/batch"));
      check "first chunk nil tx-id"
        (wire_nil_or_absent (Wire.get "tx-id" tx_entry));
      let first_uploaded_tx = uploaded_tx_of tx_entry in
      check "first chunk 5000" (List.length first_uploaded_tx = 5000);
      check "parent-tx tail"
        (List.for_all2 wire_equal
           (list_sub first_uploaded_tx 4993 7)
           parent_tx);
      ack_and_reflush client 1;
      let payload2 = List.nth !sent 1 in
      let tx_entry2 = payload_tx_entry payload2 in
      let second_uploaded_tx = uploaded_tx_of tx_entry2 in
      check "second tx/batch"
        (Wire.get "type" payload2 = Some (Wire.String "tx/batch"));
      check "second tx-id"
        (wire_string_opt (Wire.get "tx-id" tx_entry2) = Some tx_id);
      check "second chunk = child-tx"
        (List.for_all2 wire_equal second_uploaded_tx child_tx);
      check "concat = tx-data"
        (List.for_all2 wire_equal
           (first_uploaded_tx @ second_uploaded_tx)
           tx_data);
      check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]))

(* (deftest flush-pending-does-not-overgroup-existing-lookup-refs-test ...) *)
let test_flush_pending_does_not_overgroup_existing_lookup_refs () =
  with_large_upload (fun client sent tx_id child1 ->
      let child_ref = block_uuid_lookup (entity_block_uuid child1) in
      let tx_data =
        List.init 5001 (fun _ ->
            db_add child_ref "block/title"
              (Wire.String "large upload existing lookup split"))
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"save-block"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      let tx_entry = payload_tx_entry (List.hd !sent) in
      let first_uploaded_tx = uploaded_tx_of tx_entry in
      check "type tx/batch"
        (Wire.get "type" (List.hd !sent) = Some (Wire.String "tx/batch"));
      check "first chunk nil tx-id"
        (wire_nil_or_absent (Wire.get "tx-id" tx_entry));
      check "first chunk 5000" (List.length first_uploaded_tx = 5000);
      ack_and_reflush client 1;
      let payload2 = List.nth !sent 1 in
      let tx_entry2 = payload_tx_entry payload2 in
      let second_uploaded_tx = uploaded_tx_of tx_entry2 in
      check "second tx/batch"
        (Wire.get "type" payload2 = Some (Wire.String "tx/batch"));
      check "second tx-id"
        (wire_string_opt (Wire.get "tx-id" tx_entry2) = Some tx_id);
      check "second chunk 1" (List.length second_uploaded_tx = 1);
      check "concat = tx-data"
        (List.for_all2 wire_equal
           (first_uploaded_tx @ second_uploaded_tx)
           tx_data);
      check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]))

(* (deftest flush-pending-splits-large-delete-upload-request-test ...) *)
let test_flush_pending_splits_large_delete_upload_request () =
  with_large_upload (fun client sent tx_id child1 ->
      let child_ref = block_uuid_lookup (entity_block_uuid child1) in
      let tx_data =
        List.init 5001 (fun _ -> db_retract_entity child_ref)
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"delete-blocks"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      let tx_entry = payload_tx_entry (List.hd !sent) in
      let first_uploaded_tx = uploaded_tx_of tx_entry in
      check "type tx/batch"
        (Wire.get "type" (List.hd !sent) = Some (Wire.String "tx/batch"));
      check "first chunk nil tx-id"
        (wire_nil_or_absent (Wire.get "tx-id" tx_entry));
      check "first chunk 5000" (List.length first_uploaded_tx = 5000);
      ack_and_reflush client 1;
      let payload2 = List.nth !sent 1 in
      let tx_entry2 = payload_tx_entry payload2 in
      let second_uploaded_tx = uploaded_tx_of tx_entry2 in
      check "second tx/batch"
        (Wire.get "type" payload2 = Some (Wire.String "tx/batch"));
      check "second tx-id"
        (wire_string_opt (Wire.get "tx-id" tx_entry2) = Some tx_id);
      check "second chunk 1" (List.length second_uploaded_tx = 1);
      check "concat = tx-data"
        (List.for_all2 wire_equal
           (first_uploaded_tx @ second_uploaded_tx)
           tx_data);
      check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]))

(* (deftest flush-pending-keeps-oversized-tempid-group-in-one-request-test ...) *)
let test_flush_pending_keeps_oversized_tempid_group_in_one_request () =
  with_large_upload (fun client sent tx_id _child1 ->
      let tempid = "oversized-tempid-group" in
      let tx_data =
        List.init 5001 (fun idx ->
            db_add (Wire.String tempid)
              (Printf.sprintf "large-upload.group/attr-%d" idx)
              (Wire.Int idx))
      in
      seed_client_op_txs test_repo
        [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
            ~tx_data_v:(Wire.Array tx_data) tx_id ];
      await_unit (Sync_apply.flush_pending test_repo client);
      check "1 send" (List.length !sent = 1);
      let payload = List.hd !sent in
      let tx_entry = payload_tx_entry payload in
      let uploaded_tx = uploaded_tx_of tx_entry in
      check "type tx/batch"
        (Wire.get "type" payload = Some (Wire.String "tx/batch"));
      check "tx-id"
        (wire_string_opt (Wire.get "tx-id" tx_entry) = Some tx_id);
      check "5001 chunk" (List.length uploaded_tx = 5001);
      check "whole tx-data"
        (List.for_all2 wire_equal uploaded_tx tx_data);
      check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]))

(* (deftest flush-pending-reports-upload-response-timeout-test ...) *)
let test_flush_pending_reports_upload_response_timeout () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let sent = ref [] in
      let events = ref [] in
      let ws =
        fake_ws ~on_send:(fun raw ->
            sent := !sent @ [ Json_codec.parse raw ]) ()
      in
      let client = mk_client ~ws () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_deps.graph_e2ee := Some (fun _ -> false);
          Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo 0;
          Sync_client_op.update_local_tx test_repo 0;
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (entity_block_uuid child1))
                         "block/title"
                         (Wire.String "pending upload timeout report") ])
                tx_id ];
          (* cljs (set! js/setTimeout ...) + platform capture-error *)
          Sync_deps.capture_error :=
            Some
              (fun msg data extra ->
                 events := !events @ [ (msg, data, extra) ]);
          with_timeout_capture (fun timeout_cb timeout_ms ->
              await_unit (Sync_apply.flush_pending test_repo client);
              check "type tx/batch"
                (Wire.get "type" (List.hd !sent)
                 = Some (Wire.String "tx/batch"));
              check "inflight [tx-id]" (!(client.inflight) = [ tx_id ]);
              check "timeout 2min" (!timeout_ms = Some (2 * 60 * 1000));
              check "timeout cb set" (!timeout_cb <> None);
              (Option.get !timeout_cb) ();
              check "1 event" (List.length !events = 1);
              let msg, data, extra = List.hd !events in
              check "source db-sync"
                (Wire.get "source" data = Some (Wire.String "db-sync"));
              check "operation"
                (Wire.get "operation" data
                 = Some (Wire.String "upload-tx-batch"));
              check "repo"
                (Wire.get "repo" data = Some (Wire.String test_repo));
              check "graph-id"
                (Wire.get "graph-id" data = Some (Wire.String "graph-1"));
              check "tx-count" (Wire.get "tx-count" data = Some (Wire.Int 1));
              check "outliner-op"
                (Wire.get "outliner-op" data
                 = Some (Wire.String "save-block"));
              check "timeout-ms"
                (Wire.get "timeout-ms" data = Some (Wire.Int (2 * 60 * 1000)));
              check "extra tx-ids"
                (Wire.get "tx-ids" extra
                 = Some (Wire.Array [ Wire.String tx_id ]));
              check "extra outliner-ops"
                (Wire.get "outliner-ops" extra
                 = Some (Wire.Array [ Wire.String "save-block" ]));
              check "error message"
                (msg = "Sync upload request did not get response");
              events := [];
              (* cljs (aset (:ws client) "readyState" 3) + second timeout *)
              Sync_state.set_fake_ws_ready_state
                (Option.get client.ws) 3;
              Sync_apply.start_upload_response_timeout client
                { Sync_state.tx_ids = [ tx_id ]
                ; outliner_ops = [ "save-block" ]
                ; large_upload_progress = []
                ; t_before = Some 0
                ; sent_at = 0.0
                ; timer = None };
              (Option.get !timeout_cb) ();
              check "no events when ws closed" (!events = []));
          ignore (Sync_apply.mark_pending_txs_false test_repo [ tx_id ])))

(* cljs start-active-client-flushes-pending-local-txs-test *)
let test_start_active_client_flushes_pending_local_txs () =
  with_large_upload (fun client sent tx_id child1 ->
      let repo = test_repo in
      let broadcasts = ref 0 in
      Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> incr broadcasts);
      Sync_state.db_sync_client := Some client;
      Worker_state.set_db_sync_config
        (wire_map
           [ "ws-url", Wire.String "wss://sync.example.test/sync/%s" ]);
      Sync_client_op.update_graph_uuid repo (Some "graph-1");
      seed_client_op_txs repo
        [ seed_tx ~created_at:1 ~outliner_op:"save-block"
            ~tx_data_v:
              (Wire.Array
                 [ db_add
                     (block_uuid_lookup (entity_block_uuid child1))
                     "block/title"
                     (Wire.String "pending active client flush") ])
            tx_id ];
      await_unit (Sync_client.start repo);
      await_task !(client.Sync_state.send_queue);
      check "1 broadcast" (!broadcasts = 1);
      check "local-tx 0" (Sync_client_op.get_local_tx repo = Some 0);
      check "latest-remote-tx 0"
        (Hashtbl.find_opt Sync_apply.repo_latest_remote_tx repo = Some 0);
      check "pending txs"
        (List.map
           (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
           (Sync_apply.pending_txs repo ())
         = [ tx_id ]);
      check "no sync error" (!(client.Sync_state.last_sync_error) = None);
      (match !sent with
       | first :: _ ->
           check "tx/batch" (str_field "type" first = "tx/batch");
           check "tx-ids"
             (List.map (str_field "tx-id") (payload_txs first) = [ tx_id ])
       | [] -> Alcotest.fail "nothing sent");
      check "inflight" (!(client.Sync_state.inflight) = [ tx_id ]))

(* cljs receive-queue-failure-updates-last-sync-error-test *)
let test_receive_queue_failure_updates_last_sync_error () =
  preserve_state (fun () ->
      let client = mk_client () in
      let rejected =
        Dispatcher.Exn_info
          ( "tx-rejected"
          , [ kw "type", kw "db-sync/tx-rejected"
            ; kw "reason", Wire.String "db transact failed" ] )
      in
      Sync_client.enqueue_receive_message client (fun () -> raise rejected);
      await_unit !(client.Sync_state.receive_queue);
      match !(client.Sync_state.last_sync_error) with
      | None -> Alcotest.fail "last-sync-error not set"
      | Some last_error ->
          check "code"
            (Wire.get "code" last_error = Some (kw "tx-rejected"));
          check "message"
            (Wire.get "message" last_error
             = Some (Wire.String "tx-rejected"));
          (match Wire.get "data" last_error with
           | Some data ->
               check "data type"
                 (Wire.get "type" data
                  = Some (kw "db-sync/tx-rejected"));
               check "data reason"
                 (Wire.get "reason" data
                  = Some (Wire.String "db transact failed"))
           | None -> Alcotest.fail "no error data"))

(* cljs temp-conn-batch-preserves-cardinality-one-schema-test *)
let test_temp_conn_batch_preserves_cardinality_one_schema () =
  let conn, _ops, _p, child1, _c2, _c3 = setup_parent_child () in
  let child_uuid =
    match Ldb.value child1 "block/uuid" with
    | Some (Uuid s) -> s
    | _ -> failwith "child has no block/uuid"
  in
  ignore
    (Db_tx.batch_transact_with_temp_conn conn (fun temp ->
         ignore
           (Db_tx.transact temp
              [ Add
                  ( Lookup_ref ("block/uuid", Uuid child_uuid)
                  , "block/order", String "a-test") ])));
  let child_after =
    Option.get
      (Datascript.entity (Datascript.db conn)
         (Lookup_ref ("block/uuid", Uuid child_uuid)))
  in
  let errors = Db_validate.validate_local_db (Datascript.db conn) in
  check "order"
    (Ldb.value child_after "block/order" = Some (String "a-test"));
  check "no validation errors" (errors = [])

(* cljs prepare-upload-tx-entries-drops-empty-txs-test *)
let test_prepare_upload_tx_entries_drops_empty_txs () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let empty_tx_id = fresh_uuid () in
      let valid_tx_id = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"transact" empty_tx_id
            ; seed_tx ~created_at:2 ~outliner_op:"save-block"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (entity_block_uuid child1))
                         "block/title" (Wire.String "valid-title") ])
                valid_tx_id ];
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_entries, drop_tx_ids, drop_txs =
            Sync_apply.prepare_upload_tx_entries ~repo:test_repo (Some conn)
              pending
          in
          check "drop ids" (drop_tx_ids = [ empty_tx_id ]);
          check "drop txs"
            (drop_txs
             = [ Wire.Map
                   [ kw "tx-id", Wire.String empty_tx_id
                   ; kw "outliner-op", kw "transact"
                   ; kw "reason", kw "empty-tx-data" ] ]);
          check "tx entries"
            (List.map (str_field "tx-id") tx_entries = [ valid_tx_id ])))

(* cljs large-block-insert-upload-tx *)
let large_block_insert_upload_tx (page_uuid : string) (parent_uuid : string)
    (block_count : int) : Wire.t list =
  List.init block_count Fun.id
  |> List.concat_map (fun idx ->
         let block_uuid = fresh_uuid () in
         let eid = block_uuid in
         [ Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/uuid"
             ; Wire.Uuid block_uuid; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/title"
             ; Wire.String ("large-client-block-" ^ string_of_int idx)
             ; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/page"
             ; Wire.Array [ kw "block/uuid"; Wire.Uuid page_uuid ]
             ; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/parent"
             ; Wire.Array [ kw "block/uuid"; Wire.Uuid parent_uuid ]
             ; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/order"
             ; Wire.String "a0"; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/created-at"
             ; Wire.Int idx; Wire.Int idx ]
         ; Wire.Array
             [ kw "db/add"; Wire.String eid; kw "block/updated-at"
             ; Wire.Int idx; Wire.Int idx ] ])

(* cljs prepare-upload-tx-entries-keeps-large-client-op-test *)
let test_prepare_upload_tx_entries_keeps_large_client_op () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let uuid_of (e : entity) : string =
        match Ldb.value e "block/uuid" with
        | Some (Uuid s) -> s
        | _ -> failwith "entity has no block/uuid"
      in
      let page_uuid =
        match Ldb.value parent "block/page" with
        | Some (Ref id) -> (
            match Ldb.ent_of_id parent.db id with
            | Some page -> uuid_of page
            | None -> failwith "parent has no page entity")
        | _ -> failwith "parent has no block/page"
      in
      let parent_uuid = uuid_of parent in
      let tx_data =
        large_block_insert_upload_tx page_uuid parent_uuid 120
      in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
                ~tx_data_v:(Wire.Array tx_data) tx_id ];
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_entries, drop_tx_ids, _drop_txs =
            Sync_apply.prepare_upload_tx_entries ~repo:test_repo (Some conn)
              pending
          in
          check "no drops" (drop_tx_ids = []);
          check "1 entry" (List.length tx_entries = 1);
          (match tx_entries with
           | [ e ] ->
               check "tx-id" (str_field "tx-id" e = tx_id);
               check "tx-data"
                 (Wire.get "tx-data" e = Some (Wire.Array tx_data))
           | _ -> Alcotest.fail "expected one tx entry")))

(* cljs sync-counts-counts-only-true-pending-local-ops-test *)
let test_sync_counts_counts_only_true_pending_local_ops () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~pending:false (fresh_uuid ())
            ; seed_tx ~created_at:2 ~pending:false (fresh_uuid ())
            ; seed_tx ~created_at:3 (fresh_uuid ()) ];
          match Sync_apply.sync_counts test_repo with
          | Some counts ->
              check "pending-local 1"
                (Wire.get "pending-local" counts = Some (Wire.Int 1))
          | None -> Alcotest.fail "no sync counts"))

(* cljs sync-counts-reports-stored-local-checksum-test *)
let test_sync_counts_reports_stored_local_checksum () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo 42;
          Hashtbl.replace Sync_apply.repo_latest_remote_checksum test_repo
            "fresh";
          List.iter
            (fun cached_checksum ->
               Hashtbl.replace Sync_state.client_ops_conns test_repo
                 (new_client_ops_db ());
               Worker_state.drop_pending_local_tx_count test_repo;
               Sync_client_op.update_local_tx test_repo 42;
               Sync_client_op.update_graph_uuid test_repo (Some "graph-1");
               (match cached_checksum with
                | Some c -> Sync_client_op.update_local_checksum test_repo c
                | None -> ());
               let counts =
                 Option.get (Sync_apply.sync_counts test_repo)
               in
               let client = mk_client () in
               let payload =
                 Sync_presence.rtc_state_payload
                   ~sync_counts:(fun _ -> Some counts) client
               in
               (match cached_checksum with
                | Some c ->
                    check "local-checksum"
                      (Wire.get "local-checksum" counts
                       = Some (Wire.String c))
                | None ->
                    check "local-checksum nil"
                      (wire_nil_or_absent
                         (Wire.get "local-checksum" counts)));
               check "graph-id"
                 (Wire.get "graph-id" counts = Some (Wire.String "graph-1"));
               check "graph-uuid"
                 (Wire.get "graph-uuid" payload
                  = Some (Wire.String "graph-1")))
            [ Some "stale"; None ]))

(* pull/ok test prelude: conns wired + e2ee disabled + remote state reset *)
let with_pull_ok_prelude (f : unit -> 'a) : 'a =
  Hashtbl.remove Sync_apply.repo_latest_remote_tx test_repo;
  Sync_deps.graph_e2ee := Some (fun _ -> false);
  Sync_deps.ensure_graph_aes_key :=
    Some (fun _ -> Db_worker_effect.pure Wire.Nil);
  f ()

(* cljs pull-ok-with-older-remote-tx-is-ignored-test *)
let test_pull_ok_with_older_remote_tx_is_ignored () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_id = parent.id in
      let stale_tx =
        Transit_codec.to_string
          (Wire.Array
             [ db_add (Wire.Int parent_id) "block/title"
                 (Wire.String "stale-title") ])
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 4
          ; "checksum", Wire.String "ignored"
          ; ( "txs"
            , Wire.Array
                [ wire_map
                    [ "t", Wire.Int 4; "tx", Wire.String stale_tx ] ] ) ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              Sync_client_op.update_local_tx test_repo 5;
              Sync_handle_message.handle_message test_repo client
                raw_message;
              let parent' =
                Option.get
                  (Ldb.ent_of_id (Datascript.db conn) parent_id)
              in
              check "title unchanged"
                (Ldb.value parent' "block/title"
                 = Some (String "parent"));
              check "local tx 5"
                (Sync_client_op.get_local_tx test_repo = Some 5))))

(* cljs pull-ok-out-of-order-stale-response-is-ignored-test *)
let test_pull_ok_out_of_order_stale_response_is_ignored () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_id = parent.id in
      let new_tx =
        Transit_codec.to_string
          (Wire.Array
             [ db_add (Wire.Int parent_id) "block/title"
                 (Wire.String "remote-new-title") ])
      in
      let stale_tx =
        Transit_codec.to_string
          (Wire.Array
             [ db_add (Wire.Int parent_id) "block/title"
                 (Wire.String "stale-title") ])
      in
      let new_checksum =
        Db_sync_checksum.recompute_checksum
          (Datascript.db_with
             [ Add
                 ( Entity_id parent_id, "block/title"
                 , String "remote-new-title") ]
             (Datascript.db conn))
      in
      let raw_new =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 2
          ; "checksum", Wire.String new_checksum
          ; ( "txs"
            , Wire.Array
                [ wire_map [ "t", Wire.Int 2; "tx", Wire.String new_tx ] ]
            ) ]
      in
      let raw_stale =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 1
          ; "checksum", Wire.String "ignored"
          ; ( "txs"
            , Wire.Array
                [ wire_map
                    [ "t", Wire.Int 1; "tx", Wire.String stale_tx ] ] ) ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              Sync_handle_message.handle_message test_repo client raw_new;
              Sync_handle_message.handle_message test_repo client
                raw_stale;
              let parent' =
                Option.get
                  (Ldb.ent_of_id (Datascript.db conn) parent_id)
              in
              check "new title"
                (Ldb.value parent' "block/title"
                 = Some (String "remote-new-title"));
              check "local tx 2"
                (Sync_client_op.get_local_tx test_repo = Some 2))))

(* cljs pull-ok-does-not-anchor-remote-checksum-before-verify-test *)
let test_pull_ok_does_not_anchor_remote_checksum_before_verify () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_id = parent.id in
      let remote_tx_data =
        [ Add (Entity_id parent_id, "block/title",
               String "remote-checksum-anchor") ]
      in
      let local_checksum_after_remote =
        Db_sync_checksum.recompute_checksum
          (Datascript.db_with remote_tx_data (Datascript.db conn))
      in
      let remote_checksum = "bad-remote-checksum" in
      let remote_tx_wire =
        Transit_codec.to_string
          (Wire.Array
             [ db_add (Wire.Int parent_id) "block/title"
                 (Wire.String "remote-checksum-anchor") ])
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 1
          ; "checksum", Wire.String remote_checksum
          ; ( "txs"
            , Wire.Array
                [ wire_map
                    [ "t", Wire.Int 1; "tx", Wire.String remote_tx_wire ] ]
            ) ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              Sync_state.dev_or_test := true;
              Sync_client_op.update_local_checksum test_repo
                (Db_sync_checksum.recompute_checksum (Datascript.db conn));
              let listen_key =
                Datascript.listen conn "pull-ok-checksum"
                  (fun (r : tx_report) ->
                     if r.tx_data <> []
                        && not (Db_tx.flags_of conn).Db_tx.batch_tx
                     then
                       Sync_client.update_local_sync_checksum test_repo r)
              in
              Fun.protect
                ~finally:(fun () ->
                    Datascript.unlisten conn listen_key)
                (fun () ->
                    Sync_handle_message.handle_message test_repo client
                      raw_message;
                    let parent' =
                      Option.get
                        (Ldb.ent_of_id (Datascript.db conn) parent_id)
                    in
                    check "title"
                      (Ldb.value parent' "block/title"
                       = Some (String "remote-checksum-anchor"));
                    check "local tx 1"
                      (Sync_client_op.get_local_tx test_repo = Some 1);
                    check "local checksum"
                      (Sync_client_op.get_local_checksum test_repo
                       = Some local_checksum_after_remote);
                    let captured = !(Sync_log_and_state.rtc_log) in
                    check "rtc-log type"
                      (Wire.get "type" captured
                       = Some (kw "rtc.log/checksum-mismatch"));
                    check "local-checksum"
                      (Wire.get "local-checksum" captured
                       = Some (Wire.String local_checksum_after_remote));
                    check "remote-checksum"
                      (Wire.get "remote-checksum" captured
                       = Some (Wire.String remote_checksum))))))

(*__TESTS__*)

let () =
  Alcotest.run "db-sync-native"
    [ ( "db-sync"
      , [ Alcotest.test_case "resolve-ws-token-refreshes-when-token-expired"
            `Quick test_resolve_ws_token_refreshes
        ; Alcotest.test_case
            "resolve-ws-token-no-main-thread-fallback"
            `Quick test_resolve_ws_token_no_main_thread_fallback
        ; Alcotest.test_case "update-online-users-dedupes-identical-messages"
            `Quick test_update_online_users_dedupes
        ; Alcotest.test_case "presence-message-ignores-source-client"
            `Quick test_presence_message_ignores_source_client
        ; Alcotest.test_case "presence-message-updates-other-user"
            `Quick test_presence_message_updates_other_user
        ; Alcotest.test_case "ws-send-tx-batch-serializes-tx-id-as-uuid-string"
            `Quick test_ws_send_tx_batch_serializes_tx_id_as_uuid_string
        ; Alcotest.test_case
            "coerce-ws-server-message-accepts-legacy-tx-reject-shape"
            `Quick
            test_coerce_ws_server_message_accepts_legacy_tx_reject_shape
        ; Alcotest.test_case "flush-pending-honors-stop-upload-debug-flag"
            `Quick test_flush_pending_honors_stop_upload_debug_flag
        ; Alcotest.test_case "flush-pending-splits-large-upload-request"
            `Quick test_flush_pending_splits_large_upload_request
        ; Alcotest.test_case
            "flush-pending-retries-large-upload-chunk-until-server-ack"
            `Quick test_flush_pending_retries_large_upload_chunk_until_server_ack
        ; Alcotest.test_case
            "flush-pending-splits-large-upload-request-with-dependent-blocks"
            `Quick
            test_flush_pending_splits_large_upload_request_with_dependent_blocks
        ; Alcotest.test_case
            "flush-pending-does-not-overgroup-existing-lookup-refs"
            `Quick test_flush_pending_does_not_overgroup_existing_lookup_refs
        ; Alcotest.test_case "flush-pending-splits-large-delete-upload-request"
            `Quick test_flush_pending_splits_large_delete_upload_request
        ; Alcotest.test_case
            "flush-pending-keeps-oversized-tempid-group-in-one-request"
            `Quick test_flush_pending_keeps_oversized_tempid_group_in_one_request
        ; Alcotest.test_case "flush-pending-reports-upload-response-timeout"
            `Quick test_flush_pending_reports_upload_response_timeout
        ; Alcotest.test_case
            "start-active-client-flushes-pending-local-txs"
            `Quick test_start_active_client_flushes_pending_local_txs
        ; Alcotest.test_case
            "receive-queue-failure-updates-last-sync-error"
            `Quick test_receive_queue_failure_updates_last_sync_error
        ; Alcotest.test_case
            "temp-conn-batch-preserves-cardinality-one-schema"
            `Quick test_temp_conn_batch_preserves_cardinality_one_schema
        ; Alcotest.test_case "prepare-upload-tx-entries-drops-empty-txs"
            `Quick test_prepare_upload_tx_entries_drops_empty_txs
        ; Alcotest.test_case "prepare-upload-tx-entries-keeps-large-client-op"
            `Quick test_prepare_upload_tx_entries_keeps_large_client_op
        ; Alcotest.test_case
            "sync-counts-counts-only-true-pending-local-ops"
            `Quick test_sync_counts_counts_only_true_pending_local_ops
        ; Alcotest.test_case "sync-counts-reports-stored-local-checksum"
            `Quick test_sync_counts_reports_stored_local_checksum
        ; Alcotest.test_case "pull-ok-with-older-remote-tx-is-ignored"
            `Quick test_pull_ok_with_older_remote_tx_is_ignored
        ; Alcotest.test_case "pull-ok-out-of-order-stale-response-is-ignored"
            `Quick test_pull_ok_out_of_order_stale_response_is_ignored
        ; Alcotest.test_case
            "pull-ok-does-not-anchor-remote-checksum-before-verify"
            `Quick test_pull_ok_does_not_anchor_remote_checksum_before_verify
        ] ) ]
