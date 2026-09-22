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
  let enqueue_asset_sync_prev = !(Sync_assets.enqueue_asset_sync_fn) in
  let dl_missing_prev = !(Sync_assets.download_missing_remote_assets_fn) in
  let dl_if_missing_prev = !(Sync_assets.download_remote_assets_if_missing_fn) in
  let dl_remote_prev = !(Sync_assets.download_remote_asset_fn) in
  let upload_remote_prev = !(Sync_assets.upload_remote_asset_fn) in
  let http_send_prev = !(Sync_assets.http_send_fn) in
  let http_bytes_prev = !(Sync_assets.http_bytes_send_fn) in
  let fail_fast_prev = !(Sync_util.fail_fast_fn) in
  let transact_fn_prev = !(Db_transact.transact_fn) in
  let pipeline_fn_prev = !(Db_tx.transact_pipeline_fn) in
  let invalid_cb_prev = !(Db_tx.transact_invalid_callback) in
  let handle_local_tx_prev = !(Sync_apply.handle_local_tx_ref) in
  let owner_source_prev = Sys.getenv_opt "LOGSEQ_OWNER_SOURCE" in
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
      (match owner_source_prev with
       | Some v -> Unix.putenv "LOGSEQ_OWNER_SOURCE" v
       | None -> Unix.unsetenv "LOGSEQ_OWNER_SOURCE");
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
      Sync_assets.enqueue_asset_sync_fn := enqueue_asset_sync_prev;
      Sync_assets.download_missing_remote_assets_fn := dl_missing_prev;
      Sync_assets.download_remote_assets_if_missing_fn := dl_if_missing_prev;
      Sync_assets.download_remote_asset_fn := dl_remote_prev;
      Sync_assets.upload_remote_asset_fn := upload_remote_prev;
      Sync_assets.http_send_fn := http_send_prev;
      Sync_assets.http_bytes_send_fn := http_bytes_prev;
      Sync_util.fail_fast_fn := fail_fast_prev;
      Db_transact.transact_fn := transact_fn_prev;
      Db_tx.transact_pipeline_fn := pipeline_fn_prev;
      Db_tx.transact_invalid_callback := invalid_cb_prev;
      Sync_apply.handle_local_tx_ref := handle_local_tx_prev;
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
  Worker_state.drop_pending_local_tx_count test_repo;
  Hashtbl.replace Sync_state.client_ops_conns test_repo db;
  Fun.protect f ~finally:(fun () ->
      Worker_state.drop_pending_local_tx_count test_repo;
      match prev with
      | Some d -> Hashtbl.replace Sync_state.client_ops_conns test_repo d
      | None -> Hashtbl.remove Sync_state.client_ops_conns test_repo)

(* cljs with-redefs [client-op/get-local-tx (constantly n)]: no redef
   seam — seed the ops meta row to n inside a fresh client-ops db *)
let with_local_tx (n : int) (f : unit -> 'a) : 'a =
  with_client_ops_db (new_client_ops_db ()) (fun () ->
      Sync_client_op.update_local_tx test_repo n;
      f ())

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

let wire_uuid_str (u : Wire.t) : string =
  match u with
  | Wire.Uuid s | Wire.String s -> s
  | _ -> failwith "not a uuid"

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
      (* cljs runs these under the browser owner: only a cli/node owner
         skips the refresh fetch *)
      Unix.putenv "LOGSEQ_OWNER_SOURCE" "browser";
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
      Unix.putenv "LOGSEQ_OWNER_SOURCE" "browser";
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

(* ---------- tx/reject + changed/pull-request tests ---------- *)

let ent_block_uuid (e : entity) : string =
  match Ldb.value e "block/uuid" with
  | Some (Uuid s) -> s
  | _ -> failwith "entity has no block/uuid"

let ent_by_block_uuid (db : db) (u : string) : entity option =
  Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))

let delete_blocks (conn : conn) (blocks : entity list) : unit =
  ignore
    (Outliner_core.delete_blocks_conn conn
       (List.map Block_map.of_entity blocks) Block_map.empty)

let move_blocks (conn : conn) (blocks : entity list) (target : entity)
    (sibling : bool) : unit =
  Outliner_core.move_blocks_conn conn blocks target
    { Outliner_core.default_insert_opts with sibling }
    (Block_map.of_transit (wire_map [ "sibling?", Wire.Bool sibling ]))

(* cljs client-op-tx-row aget *)
let tx_row_int (r : Sqlite.bind array option) (i : int) : int =
  match r with
  | Some row -> Option.value (sql_int row.(i)) ~default:(-1)
  | None -> -1

(* cljs (try ... (catch :default e e)) around handle-message *)
let handle_message_error (repo : string) (client : Sync_state.client)
    (raw : string) : exn option =
  try
    Sync_handle_message.handle_message repo client raw;
    None
  with e -> Some e

let expect_reject_error (f : unit -> unit) : exn =
  match (try f (); None with e -> Some e) with
  | Some e -> e
  | None -> Alcotest.fail "expected tx/reject to fail-fast"

let rejected_data (e : exn) : Wire.t = Sync_util.ex_data e

let tx_meta_get (name : string) (meta : tx_meta) : value option =
  match List.find_opt (fun (k, _) -> k = name) meta with
  | Some (_, v) -> Some v
  | None -> None

(* cljs tx-reject-db-transact-failed-surfaces-rejected-tx-test *)
let test_tx_reject_db_transact_failed_surfaces_rejected_tx () =
  preserve_state (fun () ->
      let rejected =
        wire_map
          [ ( "tx"
            , Wire.String
                (Transit_codec.to_string
                   (Wire.Array
                      [ db_add
                          (block_uuid_lookup (Wire.Uuid (fresh_uuid ())))
                          "block/title" (Wire.String "bad") ])) )
          ; "outliner-op", kw "save-block" ]
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "db transact failed"
          ; "t", Wire.Int 3
          ; "data", Wire.String (Transit_codec.to_string rejected) ]
      in
      let client = mk_client () in
      with_local_tx 0 (fun () ->
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "reason"
                (Wire.get "reason" data
                 = Some (Wire.String "db transact failed"));
              check "data"
                (wire_equal
                   (Option.get (Wire.get "data" data)) rejected);
              let captured = !(Sync_log_and_state.rtc_log) in
              check "rtc-log type"
                (Wire.get "type" captured
                 = Some (kw "rtc.log/tx-rejected"));
              check "rtc-log data"
                (wire_equal
                   (Option.get (Wire.get "data" captured)) rejected)))

(* cljs tx-reject-db-transact-failed-marks-inflight-op-failed-test *)
let test_tx_reject_db_transact_failed_marks_inflight_op_failed () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "db transact failed"
          ; "t", Wire.Int 3
          ; ( "data"
            , Wire.String
                (Transit_codec.to_string
                   (wire_map
                      [ ( "tx"
                        , Wire.String
                            (Transit_codec.to_string
                               (Wire.Array
                                  [ db_add
                                      (block_uuid_lookup
                                         (Wire.Uuid (fresh_uuid ())))
                                      "block/title"
                                      (Wire.String "bad") ])) )
                      ; "outliner-op", kw "save-block" ])) ) ]
      in
      let client = mk_client ~inflight:[ tx_id ] () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 tx_id ];
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "reason"
                (Wire.get "reason" data
                 = Some (Wire.String "db transact failed"));
              check "inflight cleared" (!(client.inflight) = []);
              let ent = client_op_tx_row ops tx_id in
              check "pending 0" (tx_row_int ent 1 = 0);
              check "failed 1" (tx_row_int ent 2 = 1)))

(* cljs tx-reject-db-transact-failed-rolls-back-rejected-local-delete-test *)
let test_tx_reject_db_transact_failed_rolls_back_rejected_local_delete () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      let child_title =
        match Ldb.value child1 "block/title" with
        | Some (String t) -> t
        | _ -> failwith "child has no title"
      in
      with_datascript_conns conn (Some ops) (fun () ->
          delete_blocks conn [ child1 ];
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_id = (List.hd pending).tx_id in
          let raw_message =
            msg_json
              [ "type", Wire.String "tx/reject"
              ; "reason", Wire.String "db transact failed"
              ; "t", Wire.Int 3
              ; "failed-tx-id", Wire.String tx_id ]
          in
          let client = mk_client ~inflight:[ tx_id ] () in
          check "child deleted"
            (ent_by_block_uuid (Datascript.db conn) child_uuid = None);
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "inflight cleared" (!(client.inflight) = []);
              let ent = client_op_tx_row ops tx_id in
              check "pending 0" (tx_row_int ent 1 = 0);
              check "failed 1" (tx_row_int ent 2 = 1);
              let child' =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) child_uuid)
              in
              check "title restored"
                (Ldb.value child' "block/title" = Some (String child_title))))

(* cljs tx-reject-db-transact-failed-keeps-checksum-aligned-test *)
let test_tx_reject_db_transact_failed_keeps_checksum_aligned () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ child1 ];
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_id = (List.hd pending).tx_id in
          let checksum_after_delete =
            Sync_client_op.get_local_checksum test_repo
          in
          let raw_message =
            msg_json
              [ "type", Wire.String "tx/reject"
              ; "reason", Wire.String "db transact failed"
              ; "t", Wire.Int 3
              ; "failed-tx-id", Wire.String tx_id ]
          in
          let client = mk_client ~inflight:[ tx_id ] () in
          check "child deleted"
            (ent_by_block_uuid (Datascript.db conn) child_uuid = None);
          check "checksum after delete"
            (checksum_after_delete
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)));
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "checksum aligned"
                (Sync_client_op.get_local_checksum test_repo
                 = Some
                     (Db_sync_checksum.recompute_checksum
                        (Datascript.db conn)))))

(* cljs tx-reject-db-transact-failed-rolls-back-property-value-delete-test *)
let test_tx_reject_db_transact_failed_rolls_back_property_value_delete () =
  preserve_state (fun () ->
      let property_value_uuid = fresh_uuid () in
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "user.property/cli-http-prop"
              , { Db_test_util.default_property with p_type = "default" }
              ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_properties =
                        [ ( "user.property/cli-http-prop"
                          , Db_test_util.Map
                              [ "build/property-value", Db_test_util.Kw "block"
                              ; "block/title"
                              , Db_test_util.Str "property value"
                              ; "block/uuid"
                              , Db_test_util.Uuid property_value_uuid
                              ; "build/keep-uuid?", Db_test_util.Bool true ] )
                        ] } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let parent =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "parent")
      in
      let parent_uuid = ent_block_uuid parent in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ parent ];
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_id = (List.hd pending).tx_id in
          let raw_message =
            msg_json
              [ "type", Wire.String "tx/reject"
              ; "reason", Wire.String "db transact failed"
              ; "t", Wire.Int 3
              ; "failed-tx-id", Wire.String tx_id ]
          in
          let client = mk_client ~inflight:[ tx_id ] () in
          check "parent deleted"
            (ent_by_block_uuid (Datascript.db conn) parent_uuid = None);
          check "property value deleted"
            (ent_by_block_uuid (Datascript.db conn) property_value_uuid
             = None);
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              let restored_parent =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) parent_uuid)
              in
              let restored_pv =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn)
                     property_value_uuid)
              in
              check "property value parent"
                (Ldb.value restored_pv "block/parent"
                 = Some (Ref restored_parent.id));
              check "checksum aligned"
                (Sync_client_op.get_local_checksum test_repo
                 = Some
                     (Db_sync_checksum.recompute_checksum
                        (Datascript.db conn)))))

(* cljs tx-reject-db-transact-failed-rebase-keeps-checksum-aligned-test *)
let test_tx_reject_db_transact_failed_rebase_keeps_checksum_aligned () =
  preserve_state (fun () ->
      let conn, ops, parent_a, _parent_b, a_child_1, b_child_1 =
        setup_two_parents ()
      in
      let deleted_uuid = ent_block_uuid a_child_1 in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ a_child_1 ];
          move_blocks conn [ b_child_1 ] parent_a false;
          let pending = Sync_apply.pending_txs test_repo () in
          let delete_tx_id = (List.hd pending).tx_id in
          let inflight = List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id) pending in
          let raw_message =
            msg_json
              [ "type", Wire.String "tx/reject"
              ; "reason", Wire.String "db transact failed"
              ; "t", Wire.Int 3
              ; "failed-tx-id", Wire.String delete_tx_id ]
          in
          let client = mk_client ~inflight () in
          check "child deleted"
            (ent_by_block_uuid (Datascript.db conn) deleted_uuid = None);
          check "checksum before reject"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)));
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "checksum aligned"
                (Sync_client_op.get_local_checksum test_repo
                 = Some
                     (Db_sync_checksum.recompute_checksum
                        (Datascript.db conn)));
              let b_child' =
                Option.get (Ldb.ent_of_id (Datascript.db conn) b_child_1.id)
              in
              check "b-child parent"
                (Ldb.value b_child' "block/parent"
                 = Some (Ref parent_a.id));
              check "child restored"
                (ent_by_block_uuid (Datascript.db conn) deleted_uuid
                 <> None)))

(* cljs tx-reject-db-transact-failed-selectively-updates-inflight-ops-test *)
let test_tx_reject_db_transact_failed_selectively_updates_inflight_ops () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let success_tx_id = fresh_uuid () in
      let failed_tx_id = fresh_uuid () in
      let untouched_tx_id = fresh_uuid () in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "db transact failed"
          ; "t", Wire.Int 3
          ; "success-tx-ids", Wire.Array [ Wire.String success_tx_id ]
          ; "failed-tx-id", Wire.String failed_tx_id ]
      in
      let client =
        mk_client
          ~inflight:[ success_tx_id; failed_tx_id; untouched_tx_id ]
          ()
      in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 success_tx_id
            ; seed_tx ~created_at:2 failed_tx_id
            ; seed_tx ~created_at:3 untouched_tx_id ];
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "reason"
                (Wire.get "reason" data
                 = Some (Wire.String "db transact failed"));
              check "inflight cleared" (!(client.inflight) = []);
              let success_ent = client_op_tx_row ops success_tx_id in
              let failed_ent = client_op_tx_row ops failed_tx_id in
              let untouched_ent = client_op_tx_row ops untouched_tx_id in
              check "success pending 0" (tx_row_int success_ent 1 = 0);
              check "success not failed" (tx_row_int success_ent 2 <> 1);
              check "failed pending 0" (tx_row_int failed_ent 1 = 0);
              check "failed 1" (tx_row_int failed_ent 2 = 1);
              check "untouched pending 1" (tx_row_int untouched_ent 1 = 1);
              check "untouched not failed"
                (tx_row_int untouched_ent 2 <> 1)))

(* cljs tx-reject-missing-blocks-marks-failed-tx-failed-test *)
let test_tx_reject_missing_blocks_marks_failed_tx_failed () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let failed_tx_id = fresh_uuid () in
      let missing_uuid = ent_block_uuid parent in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "db transact failed"
          ; "t", Wire.Int 0
          ; "failed-tx-id", Wire.String failed_tx_id
          ; "missing-block-uuids"
          , Wire.Array [ Wire.String missing_uuid ] ]
      in
      let client = mk_client ~inflight:[ failed_tx_id ] () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (Wire.Uuid missing_uuid))
                         "block/title" (Wire.String "local title") ])
                failed_tx_id ];
          match
            handle_message_error test_repo client raw_message
          with
          | None -> Alcotest.fail "expected tx/reject to fail-fast"
          | Some error ->
              let data = rejected_data error in
              check "type"
                (Wire.get "type" data = Some (kw "db-sync/tx-rejected"));
              check "missing-block-uuids"
                (Wire.get "missing-block-uuids" data
                 = Some (Wire.Array [ Wire.Uuid missing_uuid ]));
              check "inflight cleared" (!(client.inflight) = []);
              let failed_ent = client_op_tx_row ops failed_tx_id in
              check "pending 0" (tx_row_int failed_ent 1 = 0);
              check "failed 1" (tx_row_int failed_ent 2 = 1);
              let pending = Sync_apply.pending_txs test_repo () in
              let tx_entries, _, _ =
                Sync_apply.prepare_upload_tx_entries ~repo:test_repo
                  (Some conn) pending
              in
              check "no tx entries" (tx_entries = [])))

(* cljs tx-reject-stale-keeps-inflight-op-pending-test *)
let test_tx_reject_stale_keeps_inflight_op_pending () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let sent = ref [] in
      let ws =
        fake_ws ~on_send:(fun raw ->
            sent := !sent @ [ Json_codec.parse raw ]) ()
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "stale"
          ; "t", Wire.Int 3 ]
      in
      let client = mk_client ~ws ~inflight:[ tx_id ] () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 tx_id ];
          Sync_handle_message.handle_message test_repo client raw_message;
          await_task !(client.send_queue);
          check "one pull sent"
            (match !sent with
             | [ m ] ->
                 Wire.get "type" m = Some (Wire.String "pull")
                 && Wire.get "since" m = Some (Wire.Int 0)
             | _ -> false);
          check "inflight kept" (!(client.inflight) = [ tx_id ]);
          let ent = client_op_tx_row ops tx_id in
          check "pending 1" (tx_row_int ent 1 = 1);
          check "not failed" (tx_row_int ent 2 <> 1)))

(* cljs tx-reject-stale-dedupes-pull-request-test *)
let test_tx_reject_stale_dedupes_pull_request () =
  preserve_state (fun () ->
      let sent = ref [] in
      let ws =
        fake_ws ~on_send:(fun raw ->
            sent := !sent @ [ Json_codec.parse raw ]) ()
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "tx/reject"
          ; "reason", Wire.String "stale"
          ; "t", Wire.Int 3 ]
      in
      let client = mk_client ~ws () in
      with_local_tx 0 (fun () ->
          Sync_handle_message.handle_message test_repo client raw_message;
          Sync_handle_message.handle_message test_repo client raw_message;
          await_task !(client.send_queue);
          check "one pull sent"
            (match !sent with
             | [ m ] ->
                 Wire.get "type" m = Some (Wire.String "pull")
                 && Wire.get "since" m = Some (Wire.Int 0)
             | _ -> false);
          check "pending-pull-since 0"
            (!(client.pending_pull_since) = Some 0)))

(* cljs changed-message-dedupes-pull-request-test *)
let test_changed_message_dedupes_pull_request () =
  preserve_state (fun () ->
      let sent = ref [] in
      let ws =
        fake_ws ~on_send:(fun raw ->
            sent := !sent @ [ Json_codec.parse raw ]) ()
      in
      let raw_message =
        msg_json [ "type", Wire.String "changed"; "t", Wire.Int 10 ]
      in
      let client = mk_client ~ws () in
      with_local_tx 3 (fun () ->
          Sync_handle_message.handle_message test_repo client raw_message;
          Sync_handle_message.handle_message test_repo client raw_message;
          await_task !(client.send_queue);
          check "one pull sent"
            (match !sent with
             | [ m ] ->
                 Wire.get "type" m = Some (Wire.String "pull")
                 && Wire.get "since" m = Some (Wire.Int 3)
             | _ -> false);
          check "pending-pull-since 3"
            (!(client.pending_pull_since) = Some 3)))

(* cljs pull-ok-clears-pending-pull-request-marker-test *)
let test_pull_ok_clears_pending_pull_request_marker () =
  preserve_state (fun () ->
      let raw_message =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 4
          ; "txs", Wire.Array [] ]
      in
      let client = mk_client ~pending_pull_since:(Some 3) () in
      with_local_tx 3 (fun () ->
          Sync_handle_message.handle_message test_repo client raw_message;
          check "marker cleared" (!(client.pending_pull_since) = None)))

(* cljs redefs of flush-pending! + enqueue-asset-sync! shared by the
   hello tests *)
let with_hello_redefs (f : unit -> 'a) : 'a =
  Sync_apply.flush_pending_fn :=
    (fun _ _ -> Db_worker_effect.pure ());
  Sync_assets.enqueue_asset_sync_fn :=
    (fun _ _ ~enqueue_asset_task:_ ~current_client:_ ~broadcast_rtc_state:_ ->
       ());
  f ()

(* cljs hello-checksum-mismatch-logs-warning-test *)
let test_hello_checksum_mismatch_logs_warning () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let raw_message =
        msg_json
          [ "type", Wire.String "hello"; "t", Wire.Int 0
          ; "checksum", Wire.String "bad-checksum" ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.remove Sync_apply.repo_latest_remote_tx test_repo;
          with_hello_redefs (fun () ->
              let outcome =
                try
                  Sync_handle_message.handle_message test_repo client
                    raw_message;
                  `Ok
                with _ -> `Thrown
              in
              check "no throw" (outcome = `Ok))))

(* cljs hello-checksum-mismatch-logs-warning-for-e2ee-test *)
let test_hello_checksum_mismatch_logs_warning_for_e2ee () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let raw_message =
        msg_json
          [ "type", Wire.String "hello"; "t", Wire.Int 0
          ; "checksum", Wire.String "bad-checksum" ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.remove Sync_apply.repo_latest_remote_tx test_repo;
          with_hello_redefs (fun () ->
              Sync_deps.graph_e2ee := Some (fun _ -> true);
              let outcome =
                try
                  Sync_handle_message.handle_message test_repo client
                    raw_message;
                  `Ok
                with _ -> `Thrown
              in
              check "no throw" (outcome = `Ok))))

(* cljs hello-without-checksum-is-accepted-test *)
let test_hello_without_checksum_is_accepted () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let raw_message =
        msg_json [ "type", Wire.String "hello"; "t", Wire.Int 0 ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.remove Sync_apply.repo_latest_remote_tx test_repo;
          with_hello_redefs (fun () ->
              Sync_handle_message.handle_message test_repo client
                raw_message;
              check "remote tx recorded"
                (Hashtbl.find_opt Sync_apply.repo_latest_remote_tx
                   test_repo
                 = Some 0))))

(* cljs pull-ok-without-checksum-is-accepted-test *)
let test_pull_ok_without_checksum_is_accepted () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_id = parent.id in
      let new_tx =
        Transit_codec.to_string
          (Wire.Array
             [ db_add (Wire.Int parent_id) "block/title"
                 (Wire.String "remote-new-title") ])
      in
      let raw_message =
        msg_json
          [ "type", Wire.String "pull/ok"; "t", Wire.Int 2
          ; ( "txs"
            , Wire.Array
                [ wire_map [ "t", Wire.Int 2; "tx", Wire.String new_tx ] ]
            ) ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              Sync_handle_message.handle_message test_repo client
                raw_message;
              let parent' =
                Option.get
                  (Ldb.ent_of_id (Datascript.db conn) parent_id)
              in
              check "title"
                (Ldb.value parent' "block/title"
                 = Some (String "remote-new-title"));
              check "local tx 2"
                (Sync_client_op.get_local_tx test_repo = Some 2))))

(* cljs pull-ok-batched-txs-preserve-tempid-boundaries-test *)
let test_pull_ok_batched_txs_preserve_tempid_boundaries () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page_uuid =
        match Ldb.value parent "block/page" with
        | Some (Ref id) -> (
            match Ldb.ent_of_id (Datascript.db conn) id with
            | Some page -> ent_block_uuid page
            | None -> failwith "no page")
        | _ -> failwith "no page ref"
      in
      let block_uuid_a = fresh_uuid () in
      let block_uuid_b = fresh_uuid () in
      let now = 1760000000000L in
      let now_w = Wire.Int64 now in
      let tx_of (block_uuid : string) (order : int) : Wire.t list =
        let e = Wire.Int (-1) in
        [ db_add e "block/uuid" (Wire.Uuid block_uuid)
        ; db_add e "block/title"
            (Wire.String
               (Printf.sprintf "remote-%s"
                  (if order = 1 then "a" else "b")))
        ; db_add e "block/parent" (block_uuid_lookup (Wire.Uuid page_uuid))
        ; db_add e "block/page" (block_uuid_lookup (Wire.Uuid page_uuid))
        ; db_add e "block/order" (Wire.Int order)
        ; db_add e "block/updated-at" now_w
        ; db_add e "block/created-at" now_w ]
      in
      let remote_txs =
        [ wire_map [ "tx-data", Wire.Array (tx_of block_uuid_a 1) ]
        ; wire_map [ "tx-data", Wire.Array (tx_of block_uuid_b 2) ] ]
      in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              match
                (try
                   await_unit
                     (Sync_apply.apply_remote_txs test_repo client
                        remote_txs);
                   None
                 with e -> Some e)
              with
              | Some e ->
                  Alcotest.fail
                    (Printf.sprintf "apply-remote-txs raised: %s"
                       (Printexc.to_string e))
              | None -> ())))

(* cljs apply-remote-txs-updates-journal-title-format-test *)
let test_apply_remote_txs_updates_journal_title_format () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_journal = Some 20250314 }
              ; blocks = [] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let journal =
        Option.get
          (Db_test_util.find_journal_by_journal_day (Datascript.db conn)
             20250314)
      in
      let tx_id_before = Ldb.value journal "block/tx-id" in
      let journal_class =
        Option.get
          (Datascript.entity (Datascript.db conn)
             (Ident "logseq.class/Journal"))
      in
      let title_format = "EEE, dd.MM.yyyy" in
      let title = "Fri, 14.03.2025" in
      let pipeline_prev = !(Db_tx.transact_pipeline_fn) in
      Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline;
      let client = mk_client () in
      Fun.protect
        ~finally:(fun () ->
            Db_tx.transact_pipeline_fn := pipeline_prev)
        (fun () ->
            with_datascript_conns conn (Some ops) (fun () ->
                with_pull_ok_prelude (fun () ->
                    await_unit
                      (Sync_apply.apply_remote_txs test_repo client
                         [ wire_map
                             [ ( "tx-data"
                               , Wire.Array
                                   [ db_add
                                       (Wire.Int journal_class.id)
                                       "logseq.property.journal/title-format"
                                       (Wire.String title_format)
                                   ; db_add (Wire.Int journal.id)
                                       "block/title"
                                       (Wire.String title) ] ) ] ]);
                    let journal_class' =
                      Option.get
                        (Datascript.entity (Datascript.db conn)
                           (Ident "logseq.class/Journal"))
                    in
                    check "title format"
                      (Ldb.value journal_class'
                         "logseq.property.journal/title-format"
                       = Some (String title_format));
                    let journal' =
                      Option.get
                        (Db_test_util.find_journal_by_journal_day
                           (Datascript.db conn) 20250314)
                    in
                    check "title"
                      (Ldb.value journal' "block/title"
                       = Some (String title));
                    check "tx-id changed"
                      (Ldb.value journal' "block/tx-id" <> tx_id_before)))))

(* cljs apply-remote-txs-applies-db-migration-entry-test *)
let test_apply_remote_txs_applies_db_migration_entry () =
  preserve_state (fun () ->
      let conn = Db_test_util.create_conn () in
      let ops = new_client_ops_db () in
      let block_uuid = fresh_uuid () in
      let tx_data =
        Wire.Array
          [ db_add (Wire.Int (-1)) "block/uuid" (Wire.Uuid block_uuid)
          ; db_add (Wire.Int (-1)) "block/title"
              (Wire.String "remote-migration-only") ]
      in
      let tx_metas = ref [] in
      let client = mk_client () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_pull_ok_prelude (fun () ->
              let listen_key =
                Datascript.listen conn "capture-remote-db-migrate-tx-meta"
                  (fun (r : tx_report) ->
                     tx_metas := !tx_metas @ [ r.tx_meta ])
              in
              Fun.protect
                ~finally:(fun () ->
                    Datascript.unlisten conn listen_key)
                (fun () ->
                    await_unit
                      (Sync_apply.apply_remote_txs test_repo client
                         [ wire_map
                             [ "tx-data", tx_data
                             ; "outliner-op", kw "db-migrate" ] ]));
              check "db-migrate meta"
                (List.exists
                   (fun meta ->
                      tx_meta_get "db-migrate?" meta = Some (Bool true)
                      && tx_meta_get "skip-validate-db?" meta
                         = Some (Bool true))
                   !tx_metas);
              let found =
                Db_test_util.find_page_by_title (Datascript.db conn)
                  "remote-migration-only"
              in
              check "title"
                (match found with
                 | Some e ->
                     Ldb.value e "block/title"
                     = Some (String "remote-migration-only")
                 | None -> false))))

(* cljs remote-asset-tx-data *)
let remote_asset_tx_data (asset_uuid : string) (page_uuid : string)
    (title : string) : Wire.t list =
  let e = Wire.Int (-1) in
  [ db_add e "block/uuid" (Wire.Uuid asset_uuid)
  ; db_add e "block/title" (Wire.String title)
  ; db_add e "block/parent" (block_uuid_lookup (Wire.Uuid page_uuid))
  ; db_add e "block/page" (block_uuid_lookup (Wire.Uuid page_uuid))
  ; db_add e "block/order" (Wire.String "a0")
  ; db_add e "block/created-at" (Wire.Int64 1760000000000L)
  ; db_add e "block/updated-at" (Wire.Int64 1760000000000L)
  ; db_add e "block/tags" (kw "logseq.class/Asset")
  ; db_add e "logseq.property.asset/type" (Wire.String "png")
  ; db_add e "logseq.property.asset/size" (Wire.Int 42)
  ; db_add e "logseq.property.asset/checksum"
      (Wire.String "remote-checksum")
  ; db_add e "logseq.property.asset/remote-metadata"
      (wire_map
         [ "checksum", Wire.String "remote-checksum"
         ; "type", Wire.String "png" ]) ]

(* cljs apply-remote-asset-tx-with-owner-source — platform/set-platform!
   maps to the LOGSEQ_OWNER_SOURCE env var on the native runtime *)
let apply_remote_asset_tx_with_owner_source (owner : string)
    (calls : (string * string * string list) list ref) : unit =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      (* cljs create-conn initial data carries every built-in class; the
         trimmed test schema still needs logseq.class/Asset as an ident
         for the remote :block/tags value below *)
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Entity
               { db_id = None
               ; attrs =
                   [ ( "db/ident"
                     , One_value (Keyword "logseq.class/Asset") )
                   ; "block/uuid", One_value (Uuid (fresh_uuid ()))
                   ; "block/title", One_value (String "Asset")
                   ; ( "block/tags"
                     , One_value (Ref_to (Ident "logseq.class/Tag")) )
                   ; ( "logseq.property/built-in?"
                     , One_value (Bool true) )
                   ; ( "logseq.property.class/extends"
                     , One_value (Ref_to (Ident "logseq.class/Root")) )
                   ] } ]);
      let page_uuid =
        match Ldb.value parent "block/page" with
        | Some (Ref id) -> (
            match Ldb.ent_of_id (Datascript.db conn) id with
            | Some page -> ent_block_uuid page
            | None -> failwith "no page")
        | _ -> failwith "no page ref"
      in
      let asset_uuid = fresh_uuid () in
      let title = Printf.sprintf "remote-%s-asset.png" owner in
      let client = mk_client () in
      Unix.putenv "LOGSEQ_OWNER_SOURCE" owner;
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_assets.download_missing_remote_assets_fn :=
            (fun _ _ ->
               failwith
                 "incremental sync should not scan all assets");
          Sync_assets.download_remote_assets_if_missing_fn :=
            (fun repo graph_id candidates ->
               calls :=
                 !calls
                 @ [ (repo, graph_id, List.map snd candidates) ];
               Db_worker_effect.pure
                 (wire_map
                    [ "total", Wire.Int 1; "downloaded", Wire.Int 1
                    ; "skipped-existing", Wire.Int 0 ]));
          with_pull_ok_prelude (fun () ->
              await_unit
                (Sync_apply.apply_remote_txs test_repo client
                   [ wire_map
                       [ ( "tx-data"
                         , Wire.Array
                             (remote_asset_tx_data asset_uuid page_uuid
                                title) ) ] ]);
              let asset =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) asset_uuid)
              in
              check "title"
                (Ldb.value asset "block/title" = Some (String title)))))

(* cljs apply-remote-txs-downloads-missing-assets-for-cli-and-desktop-test *)
let test_apply_remote_txs_downloads_missing_assets_for_cli_and_desktop () =
  let owner_prev = Sys.getenv_opt "LOGSEQ_OWNER_SOURCE" in
  Fun.protect
    ~finally:(fun () ->
        Unix.putenv "LOGSEQ_OWNER_SOURCE"
          (Option.value owner_prev ~default:"cli"))
    (fun () ->
        let calls = ref [] in
        apply_remote_asset_tx_with_owner_source "cli" calls;
        apply_remote_asset_tx_with_owner_source "electron" calls;
        check "cli call"
          (List.exists
             (fun (repo, graph_id, types) ->
                repo = test_repo && graph_id = "graph-1" && types = [ "png" ])
             !calls);
        check "electron call"
          (List.length
             (List.filter
                (fun (repo, graph_id, types) ->
                   repo = test_repo && graph_id = "graph-1"
                   && types = [ "png" ])
                !calls)
           = 2))

(* cljs apply-remote-txs-keeps-browser-assets-lazy-test *)
let test_apply_remote_txs_keeps_browser_assets_lazy () =
  let owner_prev = Sys.getenv_opt "LOGSEQ_OWNER_SOURCE" in
  Fun.protect
    ~finally:(fun () ->
        Unix.putenv "LOGSEQ_OWNER_SOURCE"
          (Option.value owner_prev ~default:"cli"))
    (fun () ->
        let calls = ref [] in
        apply_remote_asset_tx_with_owner_source "browser" calls;
        check "no download calls" (!calls = []))

(* cljs non-recycle-validation-entities *)
let non_recycle_validation_entities
    (validation : Db_validate.grouped_error list) : value list =
  let recycle_idents =
    [ "logseq.property.recycle/original-parent"
    ; "logseq.property.recycle/original-page"
    ; "logseq.property.recycle/original-order" ]
  in
  List.filter_map
    (fun ge ->
       let keep =
         match ge.Db_validate.ge_entity with
         | Map kvs -> (
             match
               List.find_map
                 (fun (k, v) ->
                    match k, v with
                    | (Keyword "db/ident" | String "db/ident"), Keyword s ->
                        Some s
                    | _ -> None)
                 kvs
             with
             | Some s -> not (List.mem s recycle_idents)
             | None -> true)
         | _ -> true
       in
       if keep then Some ge.ge_entity else None)
    validation

(* cljs worker-page/create! *)
let page_create (conn : conn) (title : string) ?uuid () : unit =
  ignore
    (Outliner_page.create_bang conn title
       ~opts:(fun () -> Outliner_page.create (Datascript.db conn) title ?uuid ())
       ())

(* cljs apply-remote-txs-preserves-many-page-property-values-test *)
let test_apply_remote_txs_preserves_many_page_property_values () =
  preserve_state (fun () ->
      let property_id = "plugin.property._test_plugin/x7" in
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "remote object" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_txs = ref [] in
      ignore
        (Datascript.listen conn_b "capture-remote-many-page-property"
           (fun r ->
              remote_txs :=
                !remote_txs
                @ [ wire_map
                      [ ( "tx-data"
                        , Wire.Array
                            (Db_normalize.normalize_tx_data r.db_after
                               r.db_before
                               (Db_normalize.wire_of_datoms r.tx_data)) )
                      ; ( "outliner-op"
                        , (match List.assoc_opt "outliner-op" r.tx_meta with
                           | Some v -> Ds_wire.transit_of_value v
                           | None -> Wire.Nil) ) ] ]));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-remote-many-page-property")
        (fun () ->
           let block_id =
             (Option.get
                (Db_test_util.find_block_by_content (Datascript.db conn_b)
                   "remote object"))
               .id
           in
           ignore
             (Outliner_property.upsert_property conn_b (Some property_id)
                (wire_map
                   [ "logseq.property/type", kw "page"
                   ; "db/cardinality", kw "db.cardinality/many" ])
                ~property_name:(Some "x7") ~properties:[]);
           Outliner_property.set_block_property conn_b (Wire.Int block_id)
             property_id (Wire.String "Page y");
           Outliner_property.set_block_property conn_b (Wire.Int block_id)
             property_id (Wire.String "Page z");
           with_datascript_conns conn_a (Some ops) (fun () ->
               with_pull_ok_prelude (fun () ->
                   await_unit
                     (Sync_apply.apply_remote_txs test_repo (mk_client ())
                        !remote_txs);
                   let block' =
                     Option.get
                       (Db_test_util.find_block_by_content
                          (Datascript.db conn_a) "remote object")
                   in
                   let names =
                     List.filter_map
                       (function
                         | Ref id -> (
                             match Ldb.ent_of_id (Datascript.db conn_a) id with
                             | Some e -> Ldb.string_value e "block/name"
                             | None -> None)
                         | _ -> None)
                       (Ldb.values block' property_id)
                     |> List.sort compare
                   in
                   check "property values" (names = [ "page y"; "page z" ])))))

(* cljs batch-transact-preserves-many-page-property-values-test *)
let test_batch_transact_preserves_many_page_property_values () =
  preserve_state (fun () ->
      let property_id = "plugin.property._test_plugin/x7" in
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "remote object" } ] } ]
          ()
      in
      let block_id =
        (Option.get
           (Db_test_util.find_block_by_content (Datascript.db conn)
              "remote object"))
          .id
      in
      ignore
        (Db_tx.batch_transact_with_temp_conn conn (fun temp ->
             ignore
               (Outliner_property.upsert_property temp (Some property_id)
                  (wire_map
                     [ "logseq.property/type", kw "page"
                     ; "db/cardinality", kw "db.cardinality/many" ])
                  ~property_name:(Some "x7") ~properties:[]);
             Outliner_property.set_block_property temp (Wire.Int block_id)
               property_id (Wire.String "Page y");
             Outliner_property.set_block_property temp (Wire.Int block_id)
               property_id (Wire.String "Page z")));
      let block' =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "remote object")
      in
      let names =
        List.filter_map
          (function
            | Ref id -> (
                match Ldb.ent_of_id (Datascript.db conn) id with
                | Some e -> Ldb.string_value e "block/name"
                | None -> None)
            | _ -> None)
          (Ldb.values block' property_id)
        |> List.sort compare
      in
      check "property values" (names = [ "page y"; "page z" ]))

(* cljs batch-transact-preserves-tag-many-page-property-values-test *)
let test_batch_transact_preserves_tag_many_page_property_values () =
  preserve_state (fun () ->
      let property_id = "plugin.property._test_plugin/x7" in
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "remote object" } ] } ]
          ()
      in
      ignore
        (Db_tx.batch_transact_with_temp_conn conn (fun temp ->
             ignore
               (Outliner_property.upsert_property temp (Some property_id)
                  (wire_map
                     [ "logseq.property/type", kw "page"
                     ; "db/cardinality", kw "db.cardinality/many" ])
                  ~property_name:(Some "x7") ~properties:[]);
             ignore
               (Outliner_page.create_bang temp "Tag x"
                  ~opts:(fun () ->
                    Outliner_page.create (Datascript.db temp) "Tag x"
                      ~class_:true ())
                  ());
             let tag_id =
               (Option.get
                  (Ldb.get_page (Datascript.db temp) (String "Tag x")))
                 .id
             in
             Outliner_property.set_block_property temp (Wire.Int tag_id)
               property_id (Wire.String "Page y");
             Outliner_property.set_block_property temp (Wire.Int tag_id)
               property_id (Wire.String "Page z")));
      let tag' =
        Option.get (Ldb.get_page (Datascript.db conn) (String "Tag x"))
      in
      check "is class" (Ldb.is_class tag');
      let names =
        List.filter_map
          (function
            | Ref id -> (
                match Ldb.ent_of_id (Datascript.db conn) id with
                | Some e -> Ldb.string_value e "block/name"
                | None -> None)
            | _ -> None)
          (Ldb.values tag' property_id)
        |> List.sort compare
      in
      check "property values" (names = [ "page y"; "page z" ]))

(* cljs replace-attr-retract-with-retract-entity-preserves-input-order-test *)
let test_replace_attr_retract_with_retract_entity_preserves_input_order () =
  preserve_state (fun () ->
      let property_id = "plugin.property._test_plugin/x7" in
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "remote object" } ] } ]
          ()
      in
      let block_id =
        (Option.get
           (Db_test_util.find_block_by_content (Datascript.db conn)
              "remote object"))
          .id
      in
      let temp_conn = Datascript.conn_from_db (Datascript.db conn) in
      let batch_tx_data = ref [] in
      let fl = Db_tx.flags_of temp_conn in
      fl.Db_tx.skip_store <- true;
      fl.Db_tx.batch_tx <- true;
      ignore
        (Datascript.listen temp_conn "capture-temp-batch" (fun r ->
             batch_tx_data := !batch_tx_data @ r.tx_data));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten temp_conn "capture-temp-batch")
        (fun () ->
           ignore
             (Outliner_property.upsert_property temp_conn (Some property_id)
                (wire_map
                   [ "logseq.property/type", kw "page"
                   ; "db/cardinality", kw "db.cardinality/many" ])
                ~property_name:(Some "x7") ~properties:[]);
           Outliner_property.set_block_property temp_conn
             (Wire.Int block_id) property_id (Wire.String "Page y");
           Outliner_property.set_block_property temp_conn
             (Wire.Int block_id) property_id (Wire.String "Page z");
           let tx_data' =
             Db_normalize.replace_attr_retract_with_retract_entity
               (Datascript.db temp_conn)
               (Db_normalize.wire_of_datoms !batch_tx_data)
           in
           let nth w i = List.nth (wire_tx_items w) i in
           let find_index pred =
             let rec go i = function
               | [] -> None
               | d :: rest -> if pred d then Some i else go (i + 1) rest
             in
             go 0 tx_data'
           in
           let schema_index =
             find_index (fun d ->
                 nth d 1 = kw "db/ident" && nth d 2 = kw property_id)
           in
           let value_index =
             find_index (fun d ->
                 nth d 0 = Wire.Int block_id && nth d 1 = kw property_id
                 && nth d 4 = Wire.Bool true)
           in
           check "schema index found" (schema_index <> None);
           check "value index found" (value_index <> None);
           match schema_index, value_index with
           | Some s, Some v -> check "schema before value" (s < v)
           | _ -> ()))

(* cljs local-checksum-matches-recompute-after-post-pipeline-update-test *)
let test_local_checksum_matches_recompute_after_post_pipeline_update () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          let page_id =
            match Ldb.value parent "block/page" with
            | Some (Ref id | Int id) -> id
            | _ -> failwith "no page ref"
          in
          let parent_id = parent.id in
          let block_uuid = fresh_uuid () in
          let now = "1773661308002" in
          let tx_report' =
            Datascript.with_tx_string (Datascript.db conn)
              ~tx_meta:[ "outliner-op", Keyword "insert-blocks" ]
              (Printf.sprintf
                 "[[:db/add -1 :block/uuid #uuid \"%s\"]\
                  [:db/add -1 :block/title \"Checksum Block\"]\
                  [:db/add -1 :block/parent %d]\
                  [:db/add -1 :block/page %d]\
                  [:db/add -1 :block/order \"a0\"]\
                  [:db/add -1 :block/created-at %s]\
                  [:db/add -1 :block/updated-at %s]]"
                 block_uuid parent_id page_id now now)
          in
          let tx_report = Worker_pipeline.transact_pipeline tx_report' in
          Sync_client.update_local_sync_checksum test_repo tx_report;
          check "checksum"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum tx_report.db_after))))

(* cljs local-checksum-listener-updates-in-release-mode-test *)
let test_local_checksum_listener_updates_in_release_mode () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Sync_state.dev_or_test := false;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          ignore
            (Datascript.transact_conn conn
               [ Add
                   ( Entity_id parent.id
                   , "block/title"
                   , String "Release checksum block" ) ]);
          check "checksum"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs local-checksum-ignores-aborted-batch-transact-test *)
let test_local_checksum_ignores_aborted_batch_transact () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          let checksum_before =
            Sync_client_op.get_local_checksum test_repo
          in
          let title_before = Ldb.value parent "block/title" in
          check "aborted batch throws"
            (try
               ignore
                 (Db_tx.batch_transact conn
                    ~tx_meta:[ "outliner-op", Keyword "checksum-abort-test" ]
                    (fun c ->
                       ignore
                         (Db_transact.transact c
                            [ db_add (Wire.Int parent.id) "block/title"
                                (Wire.String "aborted batch title") ]
                            []);
                       failwith "abort checksum batch"));
               false
             with _ -> true);
          let parent' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) parent.id)
          in
          check "title unchanged"
            (Ldb.value parent' "block/title" = title_before);
          check "checksum unchanged"
            (Some
               (Db_sync_checksum.recompute_checksum (Datascript.db conn))
             = checksum_before
             && Sync_client_op.get_local_checksum test_repo
                = checksum_before);
          ignore
            (Db_tx.batch_transact conn
               ~tx_meta:[ "outliner-op", Keyword "checksum-commit-test" ]
               (fun c ->
                  ignore
                    (Db_transact.transact c
                       [ db_add (Wire.Int parent.id) "block/title"
                           (Wire.String "committed batch title") ]
                       [])));
          check "checksum updated"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs local-checksum-updates-for-final-batch-report-with-batch-flag-test *)
let test_local_checksum_updates_for_final_batch_report_with_batch_flag () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          let flags = Db_tx.flags_of conn in
          flags.Db_tx.batch_tx <- true;
          Fun.protect
            ~finally:(fun () -> flags.Db_tx.batch_tx <- false)
            (fun () ->
               ignore
                 (Datascript.transact_conn conn
                    ~tx_meta:
                      [ "outliner-op", Keyword "checksum-final-batch-test"
                      ; "batch-final-tx-report?", Bool true ]
                    [ Add
                        ( Entity_id parent.id
                        , "block/title"
                        , String "final batch report title" ) ]));
          check "checksum"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs local-checksum-updates-non-batch-report-with-stale-batch-flag-test *)
let test_local_checksum_updates_non_batch_report_with_stale_batch_flag () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          let flags = Db_tx.flags_of conn in
          flags.Db_tx.batch_tx <- true;
          Fun.protect
            ~finally:(fun () -> flags.Db_tx.batch_tx <- false)
            (fun () ->
               ignore
                 (Datascript.transact_conn conn
                    ~tx_meta:
                      [ ( "outliner-op"
                        , Keyword "checksum-stale-batch-flag-test" ) ]
                    [ Add
                        ( Entity_id parent.id
                        , "block/title"
                        , String
                            "non-batch tx while stale batch flag is set" ) ]));
          check "checksum"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs local-checksum-updates-ldb-non-batch-report-with-stale-batch-flag-test *)
let test_local_checksum_updates_ldb_non_batch_report_with_stale_batch_flag
    () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          let flags = Db_tx.flags_of conn in
          flags.Db_tx.batch_tx <- true;
          Fun.protect
            ~finally:(fun () -> flags.Db_tx.batch_tx <- false)
            (fun () ->
               ignore
                 (Db_transact.transact conn
                    [ db_add (Wire.Int parent.id) "block/title"
                        (Wire.String
                           "ldb non-batch tx while stale batch flag is set") ]
                    [ ( "outliner-op"
                      , Keyword "checksum-ldb-stale-batch-flag-test" ) ]));
          check "checksum"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs batch-transact-tags-inner-tx-reports-test *)
let test_batch_transact_tags_inner_tx_reports () =
  preserve_state (fun () ->
      let conn, _ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let captured = ref [] in
      with_datascript_conns conn None (fun () ->
          ignore
            (Datascript.listen conn "capture-batch-tx-meta" (fun r ->
                 captured := !captured @ [ r.tx_meta ]));
          Fun.protect
            ~finally:(fun () ->
                Datascript.unlisten conn "capture-batch-tx-meta")
            (fun () ->
               ignore
                 (Db_tx.batch_transact conn
                    ~tx_meta:
                      [ "outliner-op", Keyword "checksum-batch-final-test" ]
                    (fun c ->
                       ignore
                         (Db_transact.transact c
                            [ db_add (Wire.Int parent.id) "block/title"
                                (Wire.String "inner batch report title") ]
                            [ ( "outliner-op"
                              , Keyword "checksum-inner-batch-test" ) ]))));
          match !captured with
          | [ inner; final ] ->
              check "inner batch-tx-report?"
                (tx_meta_get "batch-tx-report?" inner
                 = Some (Bool true));
              check "inner no batch-final"
                (tx_meta_get "batch-final-tx-report?" inner = None);
              check "final batch-final-tx-report?"
                (tx_meta_get "batch-final-tx-report?" final
                 = Some (Bool true));
              check "final no batch-tx-report?"
                (tx_meta_get "batch-tx-report?" final = None)
          | _ ->
              Alcotest.failf "expected 2 captured tx-metas, got %d"
                (List.length !captured)))

(* cljs remote-batch-drops-follow-up-ops-for-stale-created-block-test *)
let test_remote_batch_drops_follow_up_ops_for_stale_created_block () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page_id =
        match Ldb.value parent "block/page" with
        | Some (Ref id | Int id) -> id
        | _ -> failwith "no page ref"
      in
      let missing_parent_uuid = fresh_uuid () in
      let stale_child_uuid = fresh_uuid () in
      let now = Wire.Int64 1783110501711L in
      let client = mk_client () in
      let remote_txs =
        [ wire_map
            [ "t", Wire.Int 1; "outliner-op", kw "insert-blocks"
            ; ( "tx-data"
              , Wire.Array
                  [ db_add (Wire.String "stale-child") "block/uuid"
                      (Wire.Uuid stale_child_uuid)
                  ; db_add (Wire.String "stale-child") "block/title"
                      (Wire.String "stale child")
                  ; db_add (Wire.String "stale-child") "block/parent"
                      (block_uuid_lookup (Wire.Uuid missing_parent_uuid))
                  ; db_add (Wire.String "stale-child") "block/page"
                      (Wire.Int page_id)
                  ; db_add (Wire.String "stale-child") "block/order"
                      (Wire.String "a0")
                  ; db_add (Wire.String "stale-child") "block/created-at"
                      now
                  ; db_add (Wire.String "stale-child") "block/updated-at"
                      now ] ) ]
        ; wire_map
            [ "t", Wire.Int 2; "outliner-op", kw "save-block"
            ; ( "tx-data"
              , Wire.Array
                  [ db_add
                      (block_uuid_lookup (Wire.Uuid stale_child_uuid))
                      "block/title"
                      (Wire.String "stale child update") ] ) ] ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn));
          with_pull_ok_prelude (fun () ->
              (match
                 (try
                    await_unit
                      (Sync_apply.apply_remote_txs test_repo client
                         remote_txs);
                    None
                  with _ -> Some ())
               with
               | Some () -> Alcotest.fail "apply-remote-txs raised"
               | None -> ());
              check "stale child absent"
                (ent_by_block_uuid (Datascript.db conn) stale_child_uuid
                 = None);
              check "checksum aligned"
                (Sync_client_op.get_local_checksum test_repo
                 = Some
                     (Db_sync_checksum.recompute_checksum
                        (Datascript.db conn))))))

(* cljs reaction-add-enqueues-pending-sync-tx-test *)
let test_reaction_add_enqueues_pending_sync_tx () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "toggle-reaction"
                   ; Wire.Array
                       [ Wire.Uuid (ent_block_uuid parent)
                       ; Wire.String "+1"; Wire.Nil ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let txs =
            List.concat_map
              (fun (e : Sync_client_op.local_tx_entry) ->
                 wire_tx_items e.tx)
              pending
          in
          check "pending" (pending <> []);
          check "outliner-op"
            ((List.hd pending).outliner_op = Some "toggle-reaction");
          check "emoji datom"
            (List.exists
               (function
                 | Wire.Array
                     (Wire.Keyword "db/add" :: _
                     :: Wire.Keyword "logseq.property.reaction/emoji-id"
                     :: Wire.String "+1" :: _) -> true
                 | _ -> false)
               txs)))

(* cljs db-migration-tx-enqueues-db-migrate-pending-op-test *)
let test_db_migration_tx_enqueues_db_migrate_pending_op () =
  preserve_state (fun () ->
      let conn = Db_test_util.create_conn () in
      let ops = new_client_ops_db () in
      let block_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Db_transact.transact conn
               [ db_add (Wire.Int (-1)) "block/uuid"
                   (Wire.Uuid block_uuid)
               ; db_add (Wire.Int (-1)) "block/title"
                   (Wire.String "migration-only") ]
               [ "db-migrate?", Bool true
               ; "skip-validate-db?", Bool true ]);
          let pending = Sync_apply.pending_txs test_repo () in
          check "one pending" (List.length pending = 1);
          check "outliner-op"
            ((List.hd pending).outliner_op = Some "db-migrate")))

(* cljs rename-page-enqueues-canonical-save-block-pending-op-test *)
let test_rename_page_enqueues_canonical_save_block_pending_op () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let page_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Rename Me" ~uuid:page_uuid ();
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "rename-page"
                   ; Wire.Array [ Wire.Uuid page_uuid; Wire.String "Renamed" ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd (List.rev pending) in
          match row.Sync_client_op.forward_outliner_ops with
          | Wire.Array [ Wire.Keyword op; Wire.Array [ block; _opts ] ]
            :: _ ->
              check "op" (op = "save-block");
              check "block uuid"
                (Wire.get "block/uuid" block = Some (Wire.Uuid page_uuid));
              check "block title"
                (Wire.get "block/title" block
                 = Some (Wire.String "Renamed"))
          | ops ->
              Alcotest.failf "unexpected forward ops: %d entries"
                (List.length ops)))

(* cljs move-blocks-up-down-enqueues-canonical-move-blocks-pending-op-test *)
let test_move_blocks_up_down_enqueues_canonical_move_blocks_pending_op () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, child2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "move-blocks-up-down"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Int child2.id ]
                       ; Wire.Bool true ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd pending in
          match row.Sync_client_op.forward_outliner_ops with
          | Wire.Array [ Wire.Keyword op; Wire.Array [ ids; up ] ] :: _ ->
              check "op" (op = "move-blocks-up-down");
              check "ids" (wire_list ids <> []);
              check "up?" (up = Wire.Bool true)
          | _ -> Alcotest.fail "unexpected forward ops"))

(* cljs indent-outdent-enqueues-canonical-move-blocks-pending-op-test *)
let test_indent_outdent_enqueues_canonical_move_blocks_pending_op () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, child2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "indent-outdent-blocks"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Int child2.id ]
                       ; Wire.Bool true; Wire.Map [] ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd pending in
          match row.Sync_client_op.forward_outliner_ops with
          | Wire.Array [ Wire.Keyword op; Wire.Array [ _ids; target; opts ] ]
            :: _ ->
              check "op" (op = "move-blocks");
              check "target" (target <> Wire.Nil);
              check "sibling? key"
                (Wire.get "sibling?" opts <> None);
              check "no source-op"
                (Wire.get "source-op" opts = None)
          | _ -> Alcotest.fail "unexpected forward ops"))

let move_blocks_tx_meta : Wire.t =
  wire_map
    [ "client-id", Wire.String "test-client"
    ; "local-tx?", Wire.Bool true
    ; "outliner-op", kw "move-blocks" ]

let indent_outdent_block (conn : conn) (block : entity) (indent : bool)
    (meta : Wire.t) : unit =
  ignore
    (apply_ops conn
       [ Wire.Array
           [ kw "indent-outdent-blocks"
           ; Wire.Array
               [ Wire.Array [ Wire.Int block.id ]
               ; Wire.Bool indent
               ; Wire.Map
                   [ kw "parent-original", Wire.Nil
                   ; kw "logical-outdenting?", Wire.Nil ] ] ] ]
       meta)

let check_move_op (label : string) (ops : Wire.t list) (ids_uuid : string)
    (target_uuid : string) : unit =
  match ops with
  | Wire.Array [ Wire.Keyword op; Wire.Array [ ids; target; opts ] ] :: _
    ->
      check (label ^ " op") (op = "move-blocks");
      check (label ^ " ids")
        (ids = Wire.Array [ Wire.Uuid ids_uuid ]);
      check (label ^ " target") (target = Wire.Uuid target_uuid);
      check (label ^ " sibling?")
        (Wire.get "sibling?" opts = Some (Wire.Bool true))
  | _ -> Alcotest.fail (label ^ ": unexpected ops")

(* cljs indent-outdent-direct-outdent-last-child-builds-forward-and-inverse-move-history-test *)
let
    test_indent_outdent_direct_outdent_last_child_builds_forward_and_inverse_move_history
    () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, child2, child3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          indent_outdent_block conn child3 false move_blocks_tx_meta;
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd pending in
          check_move_op "forward" row.Sync_client_op.forward_outliner_ops
            (ent_block_uuid child3) (ent_block_uuid parent);
          check_move_op "inverse" row.Sync_client_op.inverse_outliner_ops
            (ent_block_uuid child3) (ent_block_uuid child2)))

(* cljs indent-outdent-direct-outdent-with-right-sibling-persists-semantic-move-history-test *)
let
    test_indent_outdent_direct_outdent_with_right_sibling_persists_semantic_move_history
    () =
  preserve_state (fun () ->
      let conn, ops, parent, child1, child2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          indent_outdent_block conn child2 false move_blocks_tx_meta;
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd pending in
          check_move_op "forward" row.Sync_client_op.forward_outliner_ops
            (ent_block_uuid child2) (ent_block_uuid parent);
          check_move_op "inverse" row.Sync_client_op.inverse_outliner_ops
            (ent_block_uuid child2) (ent_block_uuid child1)))

(* cljs indent-outdent-direct-outdent-undo-restores-right-sibling-parent-test *)
let test_indent_outdent_direct_outdent_undo_restores_right_sibling_parent
    () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, child2, child3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      let child2_uuid = ent_block_uuid child2 in
      let child3_uuid = ent_block_uuid child3 in
      with_datascript_conns conn (Some ops) (fun () ->
          indent_outdent_block conn child2 false local_tx_meta;
          let pending = Sync_apply.pending_txs test_repo () in
          let tx_id = (List.hd pending).tx_id in
          let parent_uuid_of (u : string) : string option =
            match ent_by_block_uuid (Datascript.db conn) u with
            | Some e -> (
                match Ldb.value e "block/parent" with
                | Some (Ref id | Int id) -> (
                    match Ldb.ent_of_id (Datascript.db conn) id with
                    | Some p -> Some (ent_block_uuid p)
                    | None -> None)
                | _ -> None)
            | None -> None
          in
          check "child3 parented to child2"
            (parent_uuid_of child3_uuid = Some child2_uuid);
          let undo_result =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo applied"
            (Wire.get "applied?" undo_result = Some (Wire.Bool true));
          check "child2 restored"
            (parent_uuid_of child2_uuid = Some parent_uuid);
          check "child3 restored"
            (parent_uuid_of child3_uuid = Some parent_uuid)))

(* cljs indent-outdent-undo-enqueues-concrete-move-blocks-history-test *)
let test_indent_outdent_undo_enqueues_concrete_move_blocks_history () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, child2, _c3 = setup_parent_child () in
      let invalid_payload = ref false in
      with_datascript_conns conn (Some ops) (fun () ->
          Db_tx.transact_invalid_callback :=
            Some (fun _report _errors -> invalid_payload := true);
          indent_outdent_block conn child2 false local_tx_meta;
          let pending = Sync_apply.pending_txs test_repo () in
          let row = List.hd pending in
          let tx_id = row.tx_id in
          let undo_result =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          let redo_result =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "op"
            (match row.Sync_client_op.forward_outliner_ops with
             | Wire.Array [ Wire.Keyword op; _ ] :: _ ->
                 op = "move-blocks"
             | _ -> false);
          check "undo applied"
            (Wire.get "applied?" undo_result = Some (Wire.Bool true));
          check "redo applied"
            (Wire.get "applied?" redo_result = Some (Wire.Bool true));
          check "no invalid tx" (not !invalid_payload);
          let child2' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) child2.id)
          in
          check "child2 title"
            (Ldb.value child2' "block/title" = Some (String "child 2"))))

(* cljs enqueue-local-tx-preserves-existing-tx-id-test *)
let test_enqueue_local_tx_preserves_existing_tx_id () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let tx_report =
        Datascript.with_tx (Datascript.db conn)
          ~tx_meta:
            [ "client-id", String "test-client"
            ; "local-tx?", Bool true
            ; "db-sync/tx-id", Uuid tx_id
            ; "outliner-op", Keyword "save-block" ]
          [ Add (Entity_id child1.id, "block/title", String "stable tx id") ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_apply.enqueue_local_tx test_repo tx_report;
          let pending = Sync_apply.pending_txs test_repo () in
          check "tx-id" ((List.hd pending).tx_id = tx_id)))

(* cljs handle-local-tx-enqueues-asset-op-for-local-asset-checksum-test *)
let test_handle_local_tx_enqueues_asset_op_for_local_asset_checksum () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let asset_uuid = fresh_uuid () in
      let tx_report =
        Datascript.with_tx (Datascript.db conn)
          ~tx_meta:
            [ "client-id", String "test-client"
            ; "local-tx?", Bool true
            ; "outliner-op", Keyword "save-block" ]
          [ Datascript.Entity
              { db_id = None
              ; attrs =
                  [ "block/uuid", One_value (Uuid asset_uuid)
                  ; "block/title", One_value (String "asset.png")
                  ; ( "logseq.property.asset/type"
                    , One_value (String "png") )
                  ; ( "logseq.property.asset/checksum"
                    , One_value (String "sha-256-value") ) ] } ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_apply.handle_local_tx test_repo tx_report;
          let asset_ops = Sync_client_op.get_all_asset_ops test_repo in
          check "one asset op"
            (Sync_client_op.get_unpushed_asset_ops_count test_repo = 1);
          match asset_ops with
          | asset_op :: _ -> (
              match Wire.get "update-asset" asset_op with
              | Some (Wire.Array [ Wire.Keyword "update-asset"; _t; m ]) ->
                  check "block-uuid"
                    (Wire.get "block-uuid" m
                     = Some (Wire.Uuid asset_uuid))
              | _ -> Alcotest.fail "missing :update-asset op")
          | [] -> Alcotest.fail "no asset ops"))

(* cljs process-pending-asset-op! *)
let process_pending_asset_op (asset_uuid : string) : bool * int * int =
  Sync_client_op.add_asset_ops test_repo
    [ Wire.Array
        [ kw "update-asset"; Wire.Int 10
        ; wire_map [ "block-uuid", Wire.Uuid asset_uuid ] ] ];
  let fail_fast_called = ref false in
  let broadcast_count = ref 0 in
  let asset_op = List.hd (Sync_client_op.get_all_asset_ops test_repo) in
  Sync_util.fail_fast_fn :=
    (fun tag _data ->
       fail_fast_called := true;
       Sync_util.ex_info tag []);
  (try
     await_unit
       (Sync_assets.process_asset_op test_repo "graph-id" asset_op
          ~current_client:(fun _ ->
             Some (Sync_state.new_client test_repo))
          ~broadcast_rtc_state:(fun _ -> incr broadcast_count))
   with _ -> ());
  ( !fail_fast_called, !broadcast_count
  , Sync_client_op.get_unpushed_asset_ops_count test_repo )

let check_asset_op_dropped (result : bool * int * int) : unit =
  let fail_fast_called, broadcast_count, pending_count = result in
  check "no fail-fast" (not fail_fast_called);
  check "one broadcast" (broadcast_count = 1);
  check "op dropped" (pending_count = 0)

(* cljs process-asset-op-drops-update-when-asset-entity-is-missing-test *)
let test_process_asset_op_drops_update_when_asset_entity_is_missing () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let asset_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          check_asset_op_dropped (process_pending_asset_op asset_uuid)))

(* cljs process-asset-op-drops-update-when-asset-type-is-missing-test *)
let test_process_asset_op_drops_update_when_asset_type_is_missing () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let asset_uuid = fresh_uuid () in
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Entity
               { db_id = None
               ; attrs =
                   [ "block/uuid", One_value (Uuid asset_uuid)
                   ; "block/title"
                   , One_value (String "asset-without-type")
                   ; ( "logseq.property.asset/checksum"
                     , One_value (String "sha-256-value") ) ] } ]);
      with_datascript_conns conn (Some ops) (fun () ->
          check_asset_op_dropped (process_pending_asset_op asset_uuid)))

(* cljs process-asset-op-drops-update-when-asset-checksum-is-missing-test *)
let test_process_asset_op_drops_update_when_asset_checksum_is_missing () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let asset_uuid = fresh_uuid () in
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Entity
               { db_id = None
               ; attrs =
                   [ "block/uuid", One_value (Uuid asset_uuid)
                   ; "block/title", One_value (String "asset.png")
                   ; ( "logseq.property.asset/type"
                     , One_value (String "png") ) ] } ]);
      with_datascript_conns conn (Some ops) (fun () ->
          check_asset_op_dropped (process_pending_asset_op asset_uuid)))

(* cljs process-asset-op-drops-update-when-required-asset-attributes-are-blank-test *)
let test_process_asset_op_drops_update_when_required_asset_attributes_are_blank
    () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let asset_uuid = fresh_uuid () in
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Entity
               { db_id = None
               ; attrs =
                   [ "block/uuid", One_value (Uuid asset_uuid)
                   ; "block/title", One_value (String "asset.png")
                   ; ( "logseq.property.asset/type"
                     , One_value (String "png") )
                   ; ( "logseq.property.asset/checksum"
                     , One_value (String "") ) ] } ]);
      with_datascript_conns conn (Some ops) (fun () ->
          check_asset_op_dropped (process_pending_asset_op asset_uuid)))

(* cljs process-asset-ops-retries-missing-file-without-blocking-later-ops-test *)
let test_process_asset_ops_retries_missing_file_without_blocking_later_ops
    () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let repo = test_repo ^ "-asset-retry" in
      let missing_uuid = fresh_uuid () in
      let later_uuid = fresh_uuid () in
      let restored = ref false in
      let upload_calls = ref [] in
      let broadcast_count = ref 0 in
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Entity
               { db_id = None
               ; attrs =
                   [ "block/uuid", One_value (Uuid missing_uuid)
                   ; "block/title", One_value (String "missing.pdf")
                   ; ( "logseq.property.asset/type"
                     , One_value (String "pdf") )
                   ; ( "logseq.property.asset/checksum"
                     , One_value (String "missing-sha-256") )
                   ; ( "block/tags"
                     , One_value (Ref_to (Ident "logseq.class/Asset")) ) ] }
           ; Datascript.Entity
               { db_id = None
               ; attrs =
                   [ "block/uuid", One_value (Uuid later_uuid)
                   ; "block/title", One_value (String "later.pdf")
                   ; ( "logseq.property.asset/type"
                     , One_value (String "pdf") )
                   ; ( "logseq.property.asset/checksum"
                     , One_value (String "later-sha-256") )
                   ; ( "block/tags"
                     , One_value (Ref_to (Ident "logseq.class/Asset")) ) ] }
           ]);
      Worker_state.set_datascript_conn repo conn;
      Hashtbl.replace Sync_state.client_ops_conns repo ops;
      Fun.protect
        ~finally:(fun () ->
            Worker_state.drop_datascript_conn repo;
            Hashtbl.remove Sync_state.client_ops_conns repo)
        (fun () ->
           let client = Sync_state.new_client repo in
           client.Sync_state.graph_id <- Some "graph-id";
           Sync_assets.upload_remote_asset_fn :=
             (fun _repo _graph_id asset_uuid _asset_type _checksum ->
                upload_calls := !upload_calls @ [ asset_uuid ];
                if asset_uuid = missing_uuid && not !restored then
                  Db_worker_effect.error
                    (Sync_util.ex_info "read-asset failed"
                       [ ( Wire.Keyword "type"
                         , kw "rtc.exception/read-asset-failed" ) ])
                else Db_worker_effect.pure ());
           (* cljs rebinds ldb/transact! to a bare d/transact! so the
              remote-metadata write survives the test's unvalidated graph *)
           Db_transact.transact_fn :=
             (fun conn tx_data _tx_meta ->
                Some
                  (Datascript.transact_conn_string conn
                     ("["
                      ^ String.concat " "
                          (List.map Ds_wire.edn_of_transit tx_data)
                      ^ "]")));
           let process_asset_ops () =
             await_unit
               (Sync_assets.process_asset_ops repo client
                  ~current_client:(fun _ -> Some client)
                  ~broadcast_rtc_state:(fun _ -> incr broadcast_count))
           in
           Sync_client_op.add_asset_ops repo
             [ Wire.Array
                 [ kw "update-asset"; Wire.Int 10
                 ; wire_map [ "block-uuid", Wire.Uuid missing_uuid ] ]
             ; Wire.Array
                 [ kw "update-asset"; Wire.Int 11
                 ; wire_map [ "block-uuid", Wire.Uuid later_uuid ] ] ];
           process_asset_ops ();
           let pending_after_missing =
             Sync_client_op.get_unpushed_asset_ops_count repo
           in
           let later_remote_metadata =
             match ent_by_block_uuid (Datascript.db conn) later_uuid with
             | Some e ->
                 Ldb.value e "logseq.property.asset/remote-metadata"
             | None -> None
           in
           restored := true;
           process_asset_ops ();
           let pending_after_retry =
             Sync_client_op.get_unpushed_asset_ops_count repo
           in
           check "upload calls"
             (!upload_calls = [ missing_uuid; later_uuid; missing_uuid ]);
           check "pending after missing" (pending_after_missing = 1);
           check "later remote metadata"
             (match later_remote_metadata with
              | Some v ->
                  let m = Ds_wire.transit_of_value v in
                  Wire.get "checksum" m
                  = Some (Wire.String "later-sha-256")
                  && Wire.get "type" m = Some (Wire.String "pdf")
              | None -> false);
           check "pending after retry" (pending_after_retry = 0);
           check "missing remote metadata"
             (match ent_by_block_uuid (Datascript.db conn) missing_uuid with
              | Some e -> (
                  match
                    Ldb.value e "logseq.property.asset/remote-metadata"
                  with
                  | Some v ->
                      let m = Ds_wire.transit_of_value v in
                      Wire.get "checksum" m
                      = Some (Wire.String "missing-sha-256")
                      && Wire.get "type" m = Some (Wire.String "pdf")
                  | None -> false)
              | None -> false);
           check "broadcasts" (!broadcast_count = 3)))

(* cljs (:forward-outliner-ops e) [0] [1] [0] :block/title *)
let op_entry_first_block_title (ops : Wire.t list) : string option =
  match ops with
  | Wire.Array [ _; Wire.Array ((Wire.Map _ as m) :: _) ] :: _ -> (
      match Wire.get "block/title" m with
      | Some (Wire.String s) -> Some s
      | _ -> None)
  | _ -> None

let save_block_op (block : Wire.t) (opts : Wire.t) : Wire.t =
  Wire.Array [ kw "save-block"; Wire.Array [ block; opts ] ]

(* cljs apply-history-action-does-not-reuse-original-tx-id-test *)
let test_apply_history_action_does_not_reuse_original_tx_id () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = entity_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ save_block_op
                   (wire_map
                      [ "block/uuid", child_uuid
                      ; "block/title", Wire.String "hello" ])
                   Wire.Nil ]
               local_tx_meta);
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let r =
            Sync_apply.apply_history_action test_repo tx_id true
              [ "db-sync/tx-id", Uuid tx_id ]
          in
          check "applied" (Wire.get "applied?" r = Some (Wire.Bool true));
          let history_tx_id =
            match Wire.get "history-tx-id" r with
            | Some (Wire.Uuid s) -> s
            | _ -> ""
          in
          check "uuid" (history_tx_id <> "");
          check "new id" (history_tx_id <> tx_id);
          let pending = Sync_apply.pending_txs test_repo () in
          check "2 pending" (List.length pending = 2);
          check "distinct ids"
            (List.length
               (List.sort_uniq String.compare
                  (List.map
                  (fun (e : Sync_client_op.local_tx_entry) ->
                     e.tx_id)
                  pending)) = 2);
          check "source title"
            (op_entry_first_block_title
               (Option.get (Sync_apply.pending_tx_by_id test_repo tx_id))
                 .forward_outliner_ops
             = Some "hello")))

(* cljs apply-history-action-preserves-source-forward-inverse-ops-test *)
let test_apply_history_action_preserves_source_forward_inverse_ops () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = entity_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ save_block_op
                   (wire_map
                      [ "block/uuid", child_uuid
                      ; "block/title", Wire.String "hello" ])
                   Wire.Nil ]
               local_tx_meta);
          let source_tx_id =
            (List.hd (Sync_apply.pending_txs test_repo ())).tx_id
          in
          let r =
            Sync_apply.apply_history_action test_repo source_tx_id true []
          in
          check "undo applied" (Wire.get "applied?" r = Some (Wire.Bool true));
          let undo_history_tx_id =
            match Wire.get "history-tx-id" r with
            | Some (Wire.Uuid s) -> s
            | _ -> ""
          in
          check "uuid" (undo_history_tx_id <> "");
          check "new id" (undo_history_tx_id <> source_tx_id);
          let source_pending =
            Option.get (Sync_apply.pending_tx_by_id test_repo source_tx_id)
          in
          let pending_after_undo = Sync_apply.pending_txs test_repo () in
          let undo_pending =
            List.find_opt
              (fun (e : Sync_client_op.local_tx_entry) ->
                  e.tx_id <> source_tx_id)
              pending_after_undo
          in
          check "2 pending" (List.length pending_after_undo = 2);
          check "undo pending" (undo_pending <> None);
          check "source fwd title"
            (op_entry_first_block_title source_pending.forward_outliner_ops
             = Some "hello");
          check "source inv title"
            (op_entry_first_block_title source_pending.inverse_outliner_ops
             = Some "child 1");
          let undo_pending = Option.get undo_pending in
          check "undo fwd title"
            (op_entry_first_block_title undo_pending.forward_outliner_ops
             = Some "child 1");
          check "undo inv title"
            (op_entry_first_block_title undo_pending.inverse_outliner_ops
             = Some "hello");
          let r2 =
            Sync_apply.apply_history_action test_repo source_tx_id false []
          in
          check "redo applied" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          let redo_history_tx_id =
            match Wire.get "history-tx-id" r2 with
            | Some (Wire.Uuid s) -> s
            | _ -> ""
          in
          check "uuid" (redo_history_tx_id <> "");
          check "new id" (redo_history_tx_id <> source_tx_id);
          let source_pending2 =
            Option.get (Sync_apply.pending_tx_by_id test_repo source_tx_id)
          in
          let pending_after_redo = Sync_apply.pending_txs test_repo () in
          let new_tx_ids =
            List.sort_uniq String.compare
              (List.map
              (fun (e : Sync_client_op.local_tx_entry) ->
                 e.tx_id)
              pending_after_redo)
          in
          check "3 pending" (List.length pending_after_redo = 3);
          check "3 ids" (List.length new_tx_ids = 3);
          check "source still present" (List.mem source_tx_id new_tx_ids);
          check "source fwd title"
            (op_entry_first_block_title source_pending2.forward_outliner_ops
             = Some "hello");
          check "source inv title"
            (op_entry_first_block_title source_pending2.inverse_outliner_ops
             = Some "child 1")))

(* cljs apply-history-action-semantic-op-must-not-fallback-to-raw-tx-test *)
let test_apply_history_action_semantic_op_must_not_fallback_to_raw_tx () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = entity_block_uuid child1 in
      let before_title =
        match Ldb.value child1 "block/title" with
        | Some (String s) -> s
        | _ -> ""
      in
      let missing_uuid = fresh_uuid () in
      let raw_title = "raw fallback title" in
      let tx_data =
        Wire.Array
          [ db_add (block_uuid_lookup child_uuid) "block/title"
              (Wire.String raw_title) ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~forward_ops:
                  [ save_block_op
                      (wire_map
                         [ "block/uuid", Wire.Uuid missing_uuid
                         ; "block/title", Wire.String "broken semantic" ])
                      (wire_map []) ]
                ~tx_data_v:tx_data tx_id ];
          let r = Sync_apply.apply_history_action test_repo tx_id false [] in
          check "not applied" (Wire.get "applied?" r = Some (Wire.Bool false));
          check "reason"
            (Wire.get "reason" r
             = Some (kw "invalid-history-action-ops"));
          check "title unchanged"
            (match ent_by_block_uuid (Datascript.db conn) (wire_uuid_str child_uuid) with
             | Some e -> Ldb.value e "block/title" = Some (String before_title)
             | None -> false)))

(* cljs apply-history-action-inline-semantic-op-rejects-numeric-ref-ids-test *)
let test_apply_history_action_inline_semantic_op_rejects_numeric_ref_ids () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = entity_block_uuid child1 in
      let stale_ref_id = 99999999 in
      with_datascript_conns conn (Some ops) (fun () ->
          let fwd =
            [ save_block_op
                (wire_map
                   [ "block/uuid", child_uuid
                   ; "block/tags", Wire.List [ Wire.Int stale_ref_id ] ])
                (wire_map []) ]
          in
          let inv =
            [ save_block_op
                (wire_map
                   [ "block/uuid", child_uuid
                   ; "block/title", Wire.String "child 1" ])
                (wire_map []) ]
          in
          let r =
            Sync_apply.apply_history_action test_repo tx_id false
              [ "outliner-op", Keyword "save-block"
              ; ( "db-sync/forward-outliner-ops"
                , Vector (List.map Ds_wire.value_of_transit fwd) )
              ; ( "db-sync/inverse-outliner-ops"
                , Vector (List.map Ds_wire.value_of_transit inv) ) ]
          in
          check "not applied" (Wire.get "applied?" r = Some (Wire.Bool false));
          check "reason"
            (Wire.get "reason" r
             = Some (kw "invalid-history-action-ops"))))

(* cljs apply-history-action-redo-invalid-insert-conflict-skips-fail-fast-test *)
let test_apply_history_action_redo_invalid_insert_conflict_skips_fail_fast ()
    =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let missing_parent_uuid = fresh_uuid () in
      let inserted_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          let inserted_block =
            wire_map
              [ "block/uuid", Wire.Uuid inserted_uuid
              ; "block/title", Wire.String ""
              ; ( "block/parent"
                , block_uuid_lookup (Wire.Uuid missing_parent_uuid) ) ]
          in
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "insert-blocks"
                      ; Wire.Array
                          [ Wire.Array [ inserted_block ]
                          ; block_uuid_lookup (Wire.Uuid missing_parent_uuid)
                          ; wire_map
                              [ "sibling?", Wire.Bool false
                              ; "keep-uuid?", Wire.Bool true ] ] ] ]
                tx_id ];
          Sync_util.fail_fast_fn :=
            (fun _tag _data -> Failure "fail-fast-called");
          let r = Sync_apply.apply_history_action test_repo tx_id false [] in
          check "not applied" (Wire.get "applied?" r = Some (Wire.Bool false));
          check "reason"
            (Wire.get "reason" r
             = Some (kw "invalid-history-action-ops"));
          check "action outliner-op"
            (match Wire.get "action" r with
             | Some a -> Wire.get "outliner-op" a = Some (kw "insert-blocks")
             | None -> false)))

(* cljs apply-history-action-save-block-ignores-stale-db-id-when-uuid-exists-test *)
let test_apply_history_action_save_block_ignores_stale_db_id_when_uuid_exists
    () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = entity_block_uuid child1 in
      let stale_db_id = 99999999 in
      let new_title = "semantic replay with stale db id" in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~forward_ops:
                  [ save_block_op
                      (wire_map
                         [ "db/id", Wire.Int stale_db_id
                         ; "block/uuid", child_uuid
                         ; "block/title", Wire.String new_title ])
                      (wire_map []) ]
                tx_id ];
          let r = Sync_apply.apply_history_action test_repo tx_id false [] in
          check "applied" (Wire.get "applied?" r = Some (Wire.Bool true));
          check "new title"
            (match ent_by_block_uuid (Datascript.db conn) (wire_uuid_str child_uuid) with
             | Some e -> Ldb.value e "block/title" = Some (String new_title)
             | None -> false)))

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
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-surfaces-rejected-tx"
            `Quick test_tx_reject_db_transact_failed_surfaces_rejected_tx
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-marks-inflight-op-failed"
            `Quick
            test_tx_reject_db_transact_failed_marks_inflight_op_failed
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-rolls-back-rejected-local-delete"
            `Quick
            test_tx_reject_db_transact_failed_rolls_back_rejected_local_delete
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-keeps-checksum-aligned"
            `Quick
            test_tx_reject_db_transact_failed_keeps_checksum_aligned
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-rolls-back-property-value-delete"
            `Quick
            test_tx_reject_db_transact_failed_rolls_back_property_value_delete
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-rebase-keeps-checksum-aligned"
            `Quick
            test_tx_reject_db_transact_failed_rebase_keeps_checksum_aligned
        ; Alcotest.test_case
            "tx-reject-db-transact-failed-selectively-updates-inflight-ops"
            `Quick
            test_tx_reject_db_transact_failed_selectively_updates_inflight_ops
        ; Alcotest.test_case
            "tx-reject-missing-blocks-marks-failed-tx-failed"
            `Quick test_tx_reject_missing_blocks_marks_failed_tx_failed
        ; Alcotest.test_case
            "tx-reject-stale-keeps-inflight-op-pending"
            `Quick test_tx_reject_stale_keeps_inflight_op_pending
        ; Alcotest.test_case "tx-reject-stale-dedupes-pull-request"
            `Quick test_tx_reject_stale_dedupes_pull_request
        ; Alcotest.test_case "changed-message-dedupes-pull-request"
            `Quick test_changed_message_dedupes_pull_request
        ; Alcotest.test_case "pull-ok-clears-pending-pull-request-marker"
            `Quick test_pull_ok_clears_pending_pull_request_marker
        ; Alcotest.test_case "hello-checksum-mismatch-logs-warning"
            `Quick test_hello_checksum_mismatch_logs_warning
        ; Alcotest.test_case "hello-checksum-mismatch-logs-warning-for-e2ee"
            `Quick test_hello_checksum_mismatch_logs_warning_for_e2ee
        ; Alcotest.test_case "hello-without-checksum-is-accepted"
            `Quick test_hello_without_checksum_is_accepted
        ; Alcotest.test_case "pull-ok-without-checksum-is-accepted"
            `Quick test_pull_ok_without_checksum_is_accepted
        ; Alcotest.test_case
            "pull-ok-batched-txs-preserve-tempid-boundaries"
            `Quick test_pull_ok_batched_txs_preserve_tempid_boundaries
        ; Alcotest.test_case
            "apply-remote-txs-updates-journal-title-format"
            `Quick test_apply_remote_txs_updates_journal_title_format
        ; Alcotest.test_case
            "apply-remote-txs-applies-db-migration-entry"
            `Quick test_apply_remote_txs_applies_db_migration_entry
        ; Alcotest.test_case
            "apply-remote-txs-downloads-missing-assets-for-cli-and-desktop"
            `Quick
            test_apply_remote_txs_downloads_missing_assets_for_cli_and_desktop
        ; Alcotest.test_case
            "apply-remote-txs-keeps-browser-assets-lazy"
            `Quick test_apply_remote_txs_keeps_browser_assets_lazy
        ; Alcotest.test_case
            "apply-remote-txs-preserves-many-page-property-values"
            `Quick
            test_apply_remote_txs_preserves_many_page_property_values
        ; Alcotest.test_case
            "batch-transact-preserves-many-page-property-values"
            `Quick
            test_batch_transact_preserves_many_page_property_values
        ; Alcotest.test_case
            "batch-transact-preserves-tag-many-page-property-values"
            `Quick
            test_batch_transact_preserves_tag_many_page_property_values
        ; Alcotest.test_case
            "replace-attr-retract-with-retract-entity-preserves-input-order"
            `Quick
            test_replace_attr_retract_with_retract_entity_preserves_input_order
        ; Alcotest.test_case
            "local-checksum-matches-recompute-after-post-pipeline-update"
            `Quick
            test_local_checksum_matches_recompute_after_post_pipeline_update
        ; Alcotest.test_case
            "local-checksum-listener-updates-in-release-mode"
            `Quick test_local_checksum_listener_updates_in_release_mode
        ; Alcotest.test_case
            "local-checksum-ignores-aborted-batch-transact"
            `Quick test_local_checksum_ignores_aborted_batch_transact
        ; Alcotest.test_case
            "local-checksum-updates-for-final-batch-report-with-batch-flag"
            `Quick
            test_local_checksum_updates_for_final_batch_report_with_batch_flag
        ; Alcotest.test_case
            "local-checksum-updates-non-batch-report-with-stale-batch-flag"
            `Quick
            test_local_checksum_updates_non_batch_report_with_stale_batch_flag
        ; Alcotest.test_case
            "local-checksum-updates-ldb-non-batch-report-with-stale-batch-flag"
            `Quick
            test_local_checksum_updates_ldb_non_batch_report_with_stale_batch_flag
        ; Alcotest.test_case "batch-transact-tags-inner-tx-reports"
            `Quick test_batch_transact_tags_inner_tx_reports
        ; Alcotest.test_case
            "remote-batch-drops-follow-up-ops-for-stale-created-block"
            `Quick
            test_remote_batch_drops_follow_up_ops_for_stale_created_block
        ; Alcotest.test_case "reaction-add-enqueues-pending-sync-tx"
            `Quick test_reaction_add_enqueues_pending_sync_tx
        ; Alcotest.test_case
            "db-migration-tx-enqueues-db-migrate-pending-op"
            `Quick test_db_migration_tx_enqueues_db_migrate_pending_op
        ; Alcotest.test_case
            "rename-page-enqueues-canonical-save-block-pending-op"
            `Quick
            test_rename_page_enqueues_canonical_save_block_pending_op
        ; Alcotest.test_case
            "move-blocks-up-down-enqueues-canonical-move-blocks-pending-op"
            `Quick
            test_move_blocks_up_down_enqueues_canonical_move_blocks_pending_op
        ; Alcotest.test_case
            "indent-outdent-enqueues-canonical-move-blocks-pending-op"
            `Quick
            test_indent_outdent_enqueues_canonical_move_blocks_pending_op
        ; Alcotest.test_case
            "indent-outdent-direct-outdent-last-child-builds-forward-and-inverse-move-history"
            `Quick
            test_indent_outdent_direct_outdent_last_child_builds_forward_and_inverse_move_history
        ; Alcotest.test_case
            "indent-outdent-direct-outdent-with-right-sibling-persists-semantic-move-history"
            `Quick
            test_indent_outdent_direct_outdent_with_right_sibling_persists_semantic_move_history
        ; Alcotest.test_case
            "indent-outdent-direct-outdent-undo-restores-right-sibling-parent"
            `Quick
            test_indent_outdent_direct_outdent_undo_restores_right_sibling_parent
        ; Alcotest.test_case
            "indent-outdent-undo-enqueues-concrete-move-blocks-history"
            `Quick
            test_indent_outdent_undo_enqueues_concrete_move_blocks_history
        ; Alcotest.test_case "enqueue-local-tx-preserves-existing-tx-id"
            `Quick test_enqueue_local_tx_preserves_existing_tx_id
        ; Alcotest.test_case
            "handle-local-tx-enqueues-asset-op-for-local-asset-checksum"
            `Quick
            test_handle_local_tx_enqueues_asset_op_for_local_asset_checksum
        ; Alcotest.test_case
            "process-asset-op-drops-update-when-asset-entity-is-missing"
            `Quick
            test_process_asset_op_drops_update_when_asset_entity_is_missing
        ; Alcotest.test_case
            "process-asset-op-drops-update-when-asset-type-is-missing"
            `Quick
            test_process_asset_op_drops_update_when_asset_type_is_missing
        ; Alcotest.test_case
            "process-asset-op-drops-update-when-asset-checksum-is-missing"
            `Quick
            test_process_asset_op_drops_update_when_asset_checksum_is_missing
        ; Alcotest.test_case
            "process-asset-op-drops-update-when-required-asset-attributes-are-blank"
            `Quick
            test_process_asset_op_drops_update_when_required_asset_attributes_are_blank
        ; Alcotest.test_case
            "process-asset-ops-retries-missing-file-without-blocking-later-ops"
            `Quick
            test_process_asset_ops_retries_missing_file_without_blocking_later_ops
        ; Alcotest.test_case
            "apply-history-action-does-not-reuse-original-tx-id" `Quick
            test_apply_history_action_does_not_reuse_original_tx_id
        ; Alcotest.test_case
            "apply-history-action-preserves-source-forward-inverse-ops"
            `Quick
            test_apply_history_action_preserves_source_forward_inverse_ops
        ; Alcotest.test_case
            "apply-history-action-semantic-op-must-not-fallback-to-raw-tx"
            `Quick
            test_apply_history_action_semantic_op_must_not_fallback_to_raw_tx
        ; Alcotest.test_case
            "apply-history-action-inline-semantic-op-rejects-numeric-ref-ids"
            `Quick
            test_apply_history_action_inline_semantic_op_rejects_numeric_ref_ids
        ; Alcotest.test_case
            "apply-history-action-redo-invalid-insert-conflict-skips-fail-fast"
            `Quick
            test_apply_history_action_redo_invalid_insert_conflict_skips_fail_fast
        ; Alcotest.test_case
            "apply-history-action-save-block-ignores-stale-db-id-when-uuid-exists"
            `Quick
            test_apply_history_action_save_block_ignores_stale_db_id_when_uuid_exists
        ] ) ]
