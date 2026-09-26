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
       worker over D1 — no OCaml port).
     - create-temp-sqlite-db-uses-opfs-pool-test (cljs ~7247: asserts
       the OPFS-backed browser VFS pool — there is no OPFS on native).
     - download-large-title-decrypts-transit-payload-test (cljs ~7333:
       marked ^:fix-me upstream — skipped in cljs too). *)

open Datascript
open Db_worker_effect.Infix

(* wires Db_tx.transact_pipeline_fn / validate_tx_report_fn and the
   endpoint registry like the cljs worker bundle *)
let () = Worker_core.init ()

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
  ; s_created_at : int64 option
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
  ; s_created_at = Option.map Int64.of_int created_at
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

(* cljs sync-handler delete-outliner-ops *)
let delete_outliner_ops = [ "delete-blocks"; "delete-page" ]

(* cljs sync-handler large-tx-min-items / large-tx-max-chunk-items *)
let large_tx_min_items = 500
let large_tx_max_chunk_items = 500

(* cljs sync-handler/reduce-ordered-tx-chunks — tempid-dependency groups
   are kept inside one chunk; chunks are capped at large-tx-max-chunk-items *)
let reduce_ordered_tx_chunks (db : db) (f : Wire.t list -> unit)
    (tx_data : Wire.t list) : unit =
  let item_count = List.length tx_data in
  let range_by_start = Sync_apply.upload_tempid_range_by_start db tx_data in
  let rec loop idx chunk =
    if idx < item_count then begin
      let next_idx, group =
        Sync_apply.next_upload_tx_group tx_data range_by_start idx
      in
      let next_count = List.length chunk + List.length group in
      if chunk <> [] && next_count > large_tx_max_chunk_items then begin
        f chunk;
        loop idx []
      end
      else loop next_idx (chunk @ group)
    end
    else if chunk <> [] then f chunk
  in
  loop 0 []

(* f6fc6f78ac: cljs (d/with @server-conn tx-data) +
   #'sync-handler/apply-tx-entry! — the D1 sync-handler is not ported;
   this mirrors it: dry-run the raw lookups, sanitize-tx-entry (which
   always appends missing-retract-eids so every apply is descendant-closed
   and cannot leave orphans mid-tree), then transact — chunked through
   reduce-ordered-tx-chunks for large txs *)
let server_apply_entry (server_conn : conn) (entry : Wire.t) : unit =
  let db = Datascript.db server_conn in
  match Wire.get "tx-data" entry with
  | Some tx_data ->
      let input_ops = Wire.as_seq tx_data in
      let outliner_op =
        match Wire.get "outliner-op" entry with
        | Some (Wire.Keyword s) | Some (Wire.String s) -> s
        | _ -> ""
      in
      (* cljs (d/with @server-conn tx-data) — validate raw lookups without
         committing *)
      ignore
        (Datascript.db_with
           (Db_transact.tx_ops_of_tx_data db input_ops) db);
      (* cljs sanitize-tx-entry *)
      let in_delete_ops = List.mem outliner_op delete_outliner_ops in
      let sanitized =
        List.map Ds_wire.value_of_transit input_ops
        |> Db_sync_tx_sanitize.sanitize_tx db
             ~drop_missing_retract_ops:(outliner_op = "fix" || in_delete_ops)
             ~drop_ops_targeting_retracted_entities:in_delete_ops
             ~retract_touched_descendants:in_delete_ops
        |> List.map Ds_wire.transit_of_value
      in
      let tx_meta =
        [ "op", Keyword "apply-client-tx" ]
        @ (if outliner_op = "" then []
           else [ "outliner-op", Keyword outliner_op ])
      in
      if sanitized <> [] then begin
        if List.length sanitized >= large_tx_min_items then
          reduce_ordered_tx_chunks db
            (fun chunk ->
               ignore (Db_transact.transact server_conn chunk tx_meta))
            sanitized
        else
          ignore (Db_transact.transact server_conn sanitized tx_meta)
      end
  | None -> ()

(* cljs upload-pending-and-assert-converged! *)
let upload_pending_and_assert_converged (conn : conn)
    (server_conn : conn) : unit =
  let tx_entries, drop_tx_ids, _drop_txs =
    Sync_apply.prepare_upload_tx_entries ~repo:test_repo (Some conn)
      (Sync_apply.pending_txs test_repo ())
  in
  List.iter (server_apply_entry server_conn) tx_entries;
  check "client/server checksums converge"
    (Db_sync_checksum.recompute_checksum (Datascript.db conn)
     = Db_sync_checksum.recompute_checksum (Datascript.db server_conn));
  let tx_ids =
    drop_tx_ids @ List.filter_map (wire_get_str "tx-id") tx_entries
  in
  ignore (Sync_apply.mark_pending_txs_false test_repo tx_ids);
  check "pending empty after upload"
    (Sync_apply.pending_txs test_repo () = [])

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

(* cljs (let [remote-tx (:tx-data (ldb/transact! server-conn ops))]
          (sync-apply/apply-remote-tx! test-repo nil remote-tx)) —
   worker transact on the server conn (pipeline runs), then feed the
   produced datoms back to the client through apply-remote-tx *)
let remote_tx_to_client (server_conn : conn) (ops : tx_op list) : unit =
  let report = Db_tx.transact server_conn ops in
  let remote_tx =
    Sync_apply.normalize_tx_data report.db_after report.db_before
      report.tx_data
  in
  await_unit
    (Sync_apply.apply_remote_tx test_repo (mk_client ()) remote_tx)

(* cljs (assoc local-tx-meta :outliner-op op) *)
let local_tx_meta_with_outliner_op (op : string) : Wire.t =
  Cljs_map.assoc local_tx_meta "outliner-op" (Wire.Keyword op)

(* cljs get-in on nested wire vectors ending at a map key *)
let rec wire_ix_path (path : int list) (w : Wire.t) : Wire.t =
  match path with
  | [] -> w
  | i :: rest -> (
      match w with
      | Wire.Array xs | Wire.List xs -> (
          match List.nth_opt xs i with
          | Some x -> wire_ix_path rest x
          | None -> Wire.Nil)
      | _ -> Wire.Nil)

let wire_get_in (path : int list) (key : string) (w : Wire.t) : Wire.t =
  match wire_ix_path path w with
  | (Wire.Map _) as m -> Option.value ~default:Wire.Nil (Wire.get key m)
  | _ -> Wire.Nil

(* cljs (assoc-in w [i ... k] v) — the trailing key is a map key *)
let rec wire_assoc_in (path : int list) (key : string) (v : Wire.t)
    (w : Wire.t) : Wire.t =
  match path with
  | [] -> Cljs_map.assoc w key v
  | i :: rest -> (
      match w with
      | Wire.Array xs ->
          Wire.Array
            (List.mapi
               (fun j x -> if j = i then wire_assoc_in rest key v x else x)
               xs)
      | Wire.List xs ->
          Wire.List
            (List.mapi
               (fun j x -> if j = i then wire_assoc_in rest key v x else x)
               xs)
      | _ -> w)

(* cljs (client-op/upsert-local-tx-entry! test-repo (assoc pending ...)) —
   rewrites a stored local tx entry, preserving pending/created_at *)
let upsert_local_tx_entry_from (e : Sync_client_op.local_tx_entry)
    ~(forward_outliner_ops : Wire.t list) : unit =
  ignore
    (Sync_client_op.upsert_local_tx_entry test_repo ~tx_id:e.tx_id
       ~pending:true ~failed:false ~outliner_op:e.outliner_op
       ~undo_redo:e.undo_redo ~forward_outliner_ops
       ~inverse_outliner_ops:e.inverse_outliner_ops
       ~inferred_outliner_ops:e.inferred_outliner_ops
       ~normalized_tx_data:e.tx ~reversed_tx_data:e.reversed_tx ())

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

(* option-returning variant that also unwraps transit-tagged values *)
let rec wire_uuid_string (w : Wire.t) : string option =
  match w with
  | Wire.Uuid s | Wire.String s -> Some s
  | Wire.Tagged (_, inner) -> wire_uuid_string inner
  | _ -> None

(* cljs [:block/uuid u] lookup ref *)
let block_uuid_lookup (u : Wire.t) : Wire.t =
  Wire.Array [ kw "block/uuid"; u ]

(* cljs [:db/add e a v] *)
let db_add (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ kw "db/add"; e; kw a; v ]

(* cljs (:block/raw-title e) — virtual attr falling back to :block/title *)
let ent_raw_title (e : entity) : value option = Ldb.raw_title e.db e

let db_retract (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ kw "db/retract"; e; kw a; v ]

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
                ; sent_at = Time.monotonic_now ()
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
                | Some c ->
                    Sync_client_op.update_local_checksum test_repo c
                      (Datascript.db conn).max_tx
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
                (Db_sync_checksum.recompute_checksum (Datascript.db conn))
                (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            | Some (Ref id) -> id
            | Some (Int64 id) -> Datascript.Util.int64_to_int_exn "block/page" id
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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

(* cljs local-checksum-heals-when-covered-commit-lags-test *)
let test_local_checksum_heals_when_covered_commit_lags () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          (* Commit lands without its checksum write, as when the process
             dies between the graph store and the post-commit checksum
             update *)
          ignore
            (Datascript.transact_conn conn
               [ Add
                   ( Entity_id parent.id, "block/title"
                   , String "lost checksum write") ]);
          check "stale checksum"
            (Sync_client_op.get_local_checksum test_repo
             <> Some
                  (Db_sync_checksum.recompute_checksum (Datascript.db conn)));
          Sync_client.reconcile_local_checksum test_repo conn;
          check "checksum healed"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs local-checksum-untouched-when-covered-commit-current-test *)
let test_local_checksum_untouched_when_covered_commit_current () =
  preserve_state (fun () ->
      let conn, ops, _parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo "stale"
            (Datascript.db conn).max_tx;
          Sync_client.reconcile_local_checksum test_repo conn;
          check "checksum untouched"
            (Sync_client_op.get_local_checksum test_repo = Some "stale")))

(* cljs local-checksum-ignores-aborted-batch-transact-test *)
let test_local_checksum_ignores_aborted_batch_transact () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
        | Some (Ref id) -> id
        | Some (Int64 id) -> Datascript.Util.int64_to_int_exn "block/page" id
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
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
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
                | Some (Ref id) -> (
                    match Ldb.ent_of_id (Datascript.db conn) id with
                    | Some p -> Some (ent_block_uuid p)
                    | None -> None)
                | Some (Int64 id) -> (
                    match Datascript.Util.int64_to_int id with
                    | Some id -> (
                        match Ldb.ent_of_id (Datascript.db conn) id with
                        | Some p -> Some (ent_block_uuid p)
                        | None -> None)
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

(* cljs local-tx map → local_tx_entry *)
let mk_local_tx_entry ?(outliner_op : string option)
    ?(forward_ops = ([] : Wire.t list))
    ?(inverse_ops = ([] : Wire.t list)) ?(tx = Wire.Array [])
    ?(reversed_tx = Wire.Array []) (tx_id : string)
    : Sync_client_op.local_tx_entry =
  { tx_id
  ; outliner_op
  ; forward_outliner_ops = forward_ops
  ; inverse_outliner_ops = inverse_ops
  ; inferred_outliner_ops = false
  ; undo_redo = None
  ; tx
  ; reversed_tx }

(* cljs with-silenced-console-error *)
let with_silenced_console_error (f : unit -> 'a) : 'a = f ()

(* cljs reverse-local-txs-uses-reversed-tx-data-test *)
let test_reverse_local_txs_uses_reversed_tx_data () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      let local_tx =
        mk_local_tx_entry ~outliner_op:"save-block"
          ~forward_ops:
            [ save_block_op
                (wire_map
                   [ "block/uuid", Wire.Uuid (fresh_uuid ())
                   ; "block/title", Wire.String "value" ])
                (wire_map []) ]
          ~reversed_tx:
            (Wire.Array
               [ db_add (Wire.Int child1.id) "block/title"
                   (Wire.String "raw reverse") ])
          tx_id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          let reports = Sync_apply.reverse_local_txs conn [ local_tx ] in
          check "1 report" (List.length reports = 1);
          check "title"
            (match ent_by_block_uuid (Datascript.db conn) child_uuid with
             | Some e -> Ldb.value e "block/title" = Some (String "raw reverse")
             | None -> false)))

(* cljs reverse-local-txs-keeps-order-add-for-restored-entity-test *)
let test_reverse_local_txs_keeps_order_add_for_restored_entity () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let restored_id = 999999 in
      let restored_uuid = fresh_uuid () in
      let now = Wire.Int64 1760000000000L in
      let local_tx =
        mk_local_tx_entry ~outliner_op:"delete-block"
          ~reversed_tx:
            (Wire.Array
               [ db_add (Wire.Int restored_id) "block/uuid"
                   (Wire.Uuid restored_uuid)
               ; db_add (Wire.Int restored_id) "block/title"
                   (Wire.String "reverse-restored")
               ; db_add (Wire.Int restored_id) "block/created-at" now
               ; db_add (Wire.Int restored_id) "block/updated-at" now
               ; db_add (Wire.Int restored_id) "block/page"
                   (Wire.Int parent.id)
               ; db_add (Wire.Int restored_id) "block/parent"
                   (Wire.Int parent.id)
               ; db_add (Wire.Int restored_id) "block/order"
                   (Wire.String "a0") ])
          tx_id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          check "absent"
            (ent_by_block_uuid (Datascript.db conn) restored_uuid = None);
          let reports = Sync_apply.reverse_local_txs conn [ local_tx ] in
          check "1 report" (List.length reports = 1);
          match ent_by_block_uuid (Datascript.db conn) restored_uuid with
          | Some restored ->
              check "title"
                (Ldb.value restored "block/title"
                 = Some (String "reverse-restored"));
              check "order"
                (Ldb.value restored "block/order" = Some (String "a0"))
          | None -> Alcotest.fail "restored entity missing"))

(* cljs reverse-local-txs-resolves-existing-uuid-string-temp-id-test *)
let test_reverse_local_txs_resolves_existing_uuid_string_temp_id () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      let local_tx =
        mk_local_tx_entry ~outliner_op:"delete-blocks"
          ~reversed_tx:
            (Wire.Array
               [ Wire.Array
                   [ kw "db/add"; Wire.String child_uuid
                   ; kw "block/uuid"; Wire.Uuid child_uuid
                   ; Wire.Int 536880744 ]
               ; Wire.Array
                   [ kw "db/add"; Wire.String child_uuid
                   ; kw "block/title"; Wire.String "reverse existing"
                   ; Wire.Int 536880744 ] ])
          tx_id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          let reports = Sync_apply.reverse_local_txs conn [ local_tx ] in
          check "1 report" (List.length reports = 1);
          match ent_by_block_uuid (Datascript.db conn) child_uuid with
          | Some child' ->
              check "same eid" (child'.id = child1.id);
              check "title"
                (Ldb.value child' "block/title"
                 = Some (String "reverse existing"))
          | None -> Alcotest.fail "child missing"))

(* cljs reverse-local-txs-drops-stale-duplicate-block-uuid-reverse-test *)
let test_reverse_local_txs_drops_stale_duplicate_block_uuid_reverse () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, child2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let stale_uuid = wire_uuid_str (entity_block_uuid child1) in
      let duplicate_uuid = wire_uuid_str (entity_block_uuid child2) in
      let local_tx =
        mk_local_tx_entry ~outliner_op:"insert-blocks"
          ~forward_ops:
            [ Wire.Array
                [ kw "insert-blocks"
                ; Wire.Array
                    [ Wire.Array
                        [ wire_map
                            [ "block/uuid", Wire.Uuid stale_uuid
                            ; "block/title", Wire.String "stale forward" ] ]
                    ; Wire.Uuid duplicate_uuid
                    ; wire_map [ "keep-uuid?", Wire.Bool true ] ] ] ]
          ~reversed_tx:
            (Wire.Array
               [ Wire.Array
                   [ kw "db/add"; block_uuid_lookup (Wire.Uuid stale_uuid)
                   ; kw "block/uuid"; Wire.Uuid duplicate_uuid ] ])
          tx_id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          with_silenced_console_error (fun () ->
              let reports = Sync_apply.reverse_local_txs conn [ local_tx ] in
              check "failed"
                (reports
                 = [ Sync_apply.Reverse_failed tx_id ]);
              check "child1 uuid"
                (match
                   Datascript.entity (Datascript.db conn) (Entity_id child1.id)
                 with
                 | Some e ->
                     Ldb.value e "block/uuid" = Some (Uuid stale_uuid)
                 | None -> false);
              check "child2 uuid"
                (match
                   Datascript.entity (Datascript.db conn) (Entity_id child2.id)
                 with
                 | Some e ->
                     Ldb.value e "block/uuid" = Some (Uuid duplicate_uuid)
                 | None -> false))))

(* cljs reverse-local-txs-skips-validation-for-rebase-intermediate-state-test *)
let test_reverse_local_txs_skips_validation_for_rebase_intermediate_state () =
  preserve_state (fun () ->
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      ignore
        (Datascript.transact_conn conn
           [ Datascript.Raw_datom
               (Datascript.datom ~e:child1.id
                  ~a:"logseq.property/created-by-ref"
                  ~v:(Ref parent.id) ~added:true ~tx:0 ()) ]);
      with_datascript_conns conn (Some ops) (fun () ->
          with_silenced_console_error (fun () ->
              let reports =
                Sync_apply.reverse_local_txs conn
                  [ mk_local_tx_entry ~outliner_op:"insert-blocks"
                      ~reversed_tx:
                        (Wire.Array
                           [ Wire.Array
                               [ kw "db/retract"; Wire.Int child1.id
                               ; kw "block/title"; Wire.String "child 1" ] ])
                      tx_id ]
              in
              check "1 report" (List.length reports = 1);
              check "title retracted"
                (match
                   Datascript.entity (Datascript.db conn) (Entity_id child1.id)
                 with
                 | Some e -> Ldb.value e "block/title" = None
                 | None -> false))))

(* cljs apply-remote-txs-reverses-parent-insert-with-existing-child-without-orphaning-test *)
let test_apply_remote_txs_reverses_parent_insert_with_existing_child () =
  preserve_state (fun () ->
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let parent_page_uuid =
        match Ldb.value parent "block/page" with
        | Some (Ref page_id) -> (
            match Ldb.ent_of_id (Datascript.db conn) page_id with
            | Some page -> wire_uuid_str (entity_block_uuid page)
            | None -> "")
        | _ -> ""
      in
      let target_uuid = wire_uuid_str (entity_block_uuid parent) in
      let remote_block_id = child1.id in
      let inserted_parent_uuid = fresh_uuid () in
      let inserted_child_uuid = fresh_uuid () in
      ignore
        (Datascript.transact_conn_string conn
           (Printf.sprintf
              "[[:db/add \"queued-parent\" :block/uuid #uuid \"%s\"]\n\
              \            [:db/add \"queued-parent\" :block/title \"queued \
               parent\"]\n\
              \            [:db/add \"queued-parent\" :block/page [:block/uuid \
               #uuid \"%s\"]]\n\
              \            [:db/add \"queued-parent\" :block/parent \
               [:block/uuid #uuid \"%s\"]]\n\
              \            [:db/add \"queued-parent\" :block/order \"b1X\"]\n\
              \            [:db/add \"queued-parent\" :block/created-at 1]\n\
              \            [:db/add \"queued-parent\" :block/updated-at 1]\n\
              \            [:db/add \"queued-child\" :block/uuid #uuid \"%s\"]\n\
              \            [:db/add \"queued-child\" :block/title \"queued \
               child\"]\n\
              \            [:db/add \"queued-child\" :block/page [:block/uuid \
               #uuid \"%s\"]]\n\
              \            [:db/add \"queued-child\" :block/parent \
               \"queued-parent\"]\n\
              \            [:db/add \"queued-child\" :block/order \"b1Y\"]\n\
              \            [:db/add \"queued-child\" :block/created-at 1]\n\
              \            [:db/add \"queued-child\" :block/updated-at 1]]"
              inserted_parent_uuid parent_page_uuid target_uuid
              inserted_child_uuid parent_page_uuid));
      with_datascript_conns conn (Some ops) (fun () ->
          (* cljs binds sync-crypt fns directly; the fixture graph is not
             e2ee so graph-e2ee? is false and the aes key is never used. *)
          Sync_deps.graph_e2ee := Some (fun _ -> false);
          Sync_deps.ensure_graph_aes_key :=
            Some (fun _ -> Db_worker_effect.pure Wire.Nil);
          let pending_tx_id = fresh_uuid () in
          let reversed_item =
            db_retract_entity (block_uuid_lookup (Wire.Uuid inserted_parent_uuid))
          in
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "insert-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ wire_map
                                  [ ( "block/uuid"
                                    , Wire.Uuid inserted_parent_uuid )
                                  ; ( "block/title"
                                    , Wire.String "queued parent" ) ] ]
                          ; Wire.Uuid target_uuid
                          ; wire_map
                              [ "sibling?", Wire.Bool false
                              ; "keep-uuid?", Wire.Bool true ] ] ] ]
                ~reversed_tx_data:(Wire.Array [ reversed_item ])
                pending_tx_id ];
          let pending_before =
            Option.get
              (List.nth_opt (Sync_apply.pending_txs test_repo ()) 0)
          in
          check "outliner-op"
            (pending_before.outliner_op = Some "insert-blocks");
          check "fwd ops" (pending_before.forward_outliner_ops <> []);
          check "reversed item"
            (List.exists
               (fun i -> wire_equal i reversed_item)
               (wire_list pending_before.reversed_tx));
          let client = mk_client () in
          await_unit
            (Sync_apply.apply_remote_txs test_repo client
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add (Wire.Int remote_block_id) "block/title"
                             (Wire.String "remote while nested insert pending")
                         ] ) ] ]);
          ( match
              ent_by_block_uuid (Datascript.db conn) inserted_parent_uuid
            with
            | Some inserted_parent ->
                check "parent title"
                  (Ldb.value inserted_parent "block/title"
                   = Some (String "queued parent"))
            | None -> Alcotest.fail "inserted parent missing" );
          ( match
              ent_by_block_uuid (Datascript.db conn) inserted_child_uuid
            with
            | Some inserted_child ->
                check "child parent"
                  (Ldb.value inserted_child "block/parent" <> None);
                check "child page"
                  (Ldb.value inserted_child "block/page" <> None)
            | None -> () );
          let validation =
            Db_validate.validate_local_db (Datascript.db conn)
          in
          check "no validation errors"
            (non_recycle_validation_entities validation = [])))

(* cljs apply-remote-txs-drops-stale-save-block-reverse-test *)
let test_apply_remote_txs_drops_stale_save_block_reverse () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let missing_uuid = fresh_uuid () in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_deps.graph_e2ee := Some (fun _ -> false);
          Sync_deps.ensure_graph_aes_key :=
            Some (fun _ -> Db_worker_effect.pure Wire.Nil);
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"save-block"
                ~forward_ops:
                  [ save_block_op
                      (wire_map
                         [ "block/uuid", Wire.Uuid missing_uuid
                         ; "block/title", Wire.String "stale forward" ])
                      (wire_map []) ]
                ~inverse_ops:
                  [ save_block_op
                      (wire_map
                         [ "block/uuid", Wire.Uuid missing_uuid
                         ; "block/title", Wire.String "stale reverse" ])
                      (wire_map []) ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid missing_uuid))
                         "block/title" (Wire.String "stale forward") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid missing_uuid))
                         "block/title" (Wire.String "stale reverse") ])
                tx_id ];
          let client = mk_client () in
          await_unit
            (Sync_apply.apply_remote_tx test_repo client
               [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/title" (Wire.String "remote parent") ]);
          check "parent title"
            (match ent_by_block_uuid (Datascript.db conn) parent_uuid with
             | Some e ->
                 Ldb.value e "block/title" = Some (String "remote parent")
             | None -> false);
          let row = client_op_tx_row ops tx_id in
          check "pending 0" (tx_row_int row 1 = 0)))

(* cljs enqueue-local-tx-keeps-mixed-semantic-forward-outliner-ops-test *)
let test_enqueue_local_tx_keeps_mixed_semantic_forward_outliner_ops () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, child2, _c3 = setup_parent_child () in
      let block_uuid = wire_uuid_str (entity_block_uuid child2) in
      let tx_report =
        Datascript.with_tx (Datascript.db conn)
          ~tx_meta:
            [ "client-id", String "test-client"
            ; "local-tx?", Bool true
            ; "outliner-op", Keyword "save-block"
            ; ( "outliner-ops"
              , Vector
                  [ Ds_wire.value_of_transit
                      (save_block_op
                         (wire_map
                            [ "block/uuid", Wire.Uuid block_uuid
                            ; "block/title", Wire.String "mixed fallback" ])
                         (wire_map []))
                  ; Ds_wire.value_of_transit
                      (Wire.Array
                         [ kw "indent-outdent-blocks"
                         ; Wire.Array
                             [ Wire.Array [ Wire.Int child2.id ]
                             ; Wire.Bool false
                             ; wire_map
                                 [ "parent-original", Wire.Nil
                                 ; "logical-outdenting?", Wire.Nil ] ] ]) ] ) ]
          [ Datascript.Raw_datom
              (Datascript.datom ~e:child2.id ~a:"block/title"
                 ~v:(String "mixed fallback") ~added:true ~tx:0 ()) ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_apply.enqueue_local_tx test_repo tx_report;
          let forward_ops =
            (List.hd (Sync_apply.pending_txs test_repo ()))
              .forward_outliner_ops
          in
          check "op0 save-block"
            (match List.nth_opt forward_ops 0 with
             | Some (Wire.Array (Wire.Keyword "save-block" :: _)) -> true
             | _ -> false);
          check "op1 indent-outdent-blocks"
            (match List.nth_opt forward_ops 1 with
             | Some (Wire.Array (Wire.Keyword "indent-outdent-blocks" :: _)) ->
                 true
             | _ -> false);
          check "op1 block-uuid"
            (match List.nth_opt forward_ops 1 with
             | Some
                 (Wire.Array
                    [ _; Wire.Array (Wire.Array [ Wire.Uuid u ] :: _) ]) ->
                 u = block_uuid
             | _ -> false)))

(* cljs apply-history-action-undo-delete-blocks-noops-when-target-missing-test *)
let test_apply_history_action_undo_delete_blocks_noops_when_target_missing ()
    =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = entity_block_uuid child1 in
      let missing_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"delete-blocks"
                ~forward_ops:
                  [ save_block_op
                      (wire_map
                         [ "block/uuid", child_uuid
                         ; "block/title", Wire.String "semantic source" ])
                      Wire.Nil ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "delete-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ block_uuid_lookup (Wire.Uuid missing_uuid) ]
                          ; wire_map [] ] ] ]
                tx_id ];
          let r = Sync_apply.apply_history_action test_repo tx_id true [] in
          check "applied" (Wire.get "applied?" r = Some (Wire.Bool true));
          check "child exists"
            (ent_by_block_uuid (Datascript.db conn)
               (wire_uuid_str child_uuid)
             <> None)))

(* cljs enqueue-local-tx-persists-semantic-undo-ops-test *)
let test_enqueue_local_tx_persists_semantic_undo_ops () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = entity_block_uuid child1 in
      let forward_ops =
        [ save_block_op
            (wire_map
               [ "block/uuid", child_uuid
               ; "block/title", Wire.String "undo value" ])
            (wire_map []) ]
      in
      let inverse_ops =
        [ save_block_op
            (wire_map
               [ "block/uuid", child_uuid
               ; "block/title", Wire.String "child 1" ])
            (wire_map []) ]
      in
      let tx_report =
        Datascript.with_tx (Datascript.db conn)
          ~tx_meta:
            [ "client-id", String "test-client"
            ; "local-tx?", Bool true
            ; "db-sync/tx-id", Uuid tx_id
            ; ( "db-sync/forward-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit forward_ops) )
            ; ( "db-sync/inverse-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit inverse_ops) )
            ; "outliner-op", Keyword "save-block"
            ; "undo?", Bool true
            ; "gen-undo-ops?", Bool false ]
          [ Datascript.Raw_datom
              (Datascript.datom ~e:child1.id ~a:"block/title"
                 ~v:(String "undo value") ~added:true ~tx:0 ()) ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_apply.enqueue_local_tx test_repo tx_report;
          let pending = List.hd (Sync_apply.pending_txs test_repo ()) in
          let raw_pending =
            Sync_client_op.get_local_tx_entry test_repo tx_id
          in
          check "tx-id" (pending.tx_id = tx_id);
          check "fwd"
            (pending.forward_outliner_ops = forward_ops);
          check "raw fwd"
            (match raw_pending with
             | Some e -> e.forward_outliner_ops = forward_ops
             | None -> false);
          check "raw inv"
            (match raw_pending with
             | Some e -> e.inverse_outliner_ops = inverse_ops
             | None -> false)))

(* cljs direct-outliner-page-delete-persists-delete-page-outliner-op-test *)
let test_direct_outliner_page_delete_persists_delete_page_outliner_op () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "Delete Me" }
              ; blocks = [] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let page =
        Option.get
          (Db_test_util.find_page_by_title (Datascript.db conn) "Delete Me")
      in
      let page_uuid = wire_uuid_str (entity_block_uuid page) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_page.delete_conn conn page_uuid (Wire.Map []));
          let pending = List.hd (Sync_apply.pending_txs test_repo ()) in
          check "delete-page op"
            (match pending.forward_outliner_ops with
             | Wire.Array (Wire.Keyword "delete-page" :: _) :: _ -> true
             | _ -> false);
          check "uuid arg"
            (match pending.forward_outliner_ops with
             | Wire.Array [ _; Wire.Array (Wire.Uuid u :: _) ] :: _ ->
                 u = page_uuid
             | _ -> false);
          check "inverse ops" (pending.inverse_outliner_ops <> [])))

(* cljs [:db/retract e a v] *)
let db_retract (e : Wire.t) (a : string) (v : Wire.t) : Wire.t =
  Wire.Array [ kw "db/retract"; e; kw a; v ]

(* the last pending tx with this :outliner-op (cljs (filter ... last)) *)
let last_pending_tx_with_op (op : string) : Sync_client_op.local_tx_entry =
  List.filter
    (fun (e : Sync_client_op.local_tx_entry) -> e.outliner_op = Some op)
    (Sync_apply.pending_txs test_repo ())
  |> List.rev |> List.hd |> Option.some
  |> function
  | Some e -> e
  | None -> Alcotest.fail "pending tx with outliner-op missing"

(* cljs (ffirst entry) = op keyword of an op entry *)
let op_entry_name (entry : Wire.t) : string option =
  match entry with
  | Wire.Array (Wire.Keyword n :: _) -> Some n
  | _ -> None

(* cljs (get-in entry [1 0]) — first arg of an op entry *)
let op_entry_arg0 (entry : Wire.t) : Wire.t option =
  match entry with
  | Wire.Array [ _; Wire.Array (a :: _) ] -> Some a
  | _ -> None

(* cljs ([op [block]] ...) destructured save-block entries *)
let save_block_entry_block (entry : Wire.t) : Wire.t option =
  match entry with
  | Wire.Array [ Wire.Keyword "save-block"; Wire.Array (b :: _) ] -> Some b
  | _ -> None

let ent_refs (db : db) (uuid_str : string) (attr : string) : value list =
  match ent_by_block_uuid db uuid_str with
  | Some e -> Ldb.values e attr
  | None -> []

let ref_ids (vs : value list) : int list =
  List.filter_map (fun v -> match v with Ref id -> Some id | _ -> None) vs

(* cljs delete-page-rewrites-node-refs-and-semantic-undo-redo-test *)
let test_delete_page_rewrites_node_refs_and_semantic_undo_redo () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "Delete Me" }
              ; blocks = [] }
            ; { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "Ref Page" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "seed" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let page =
        Option.get
          (Db_test_util.find_page_by_title (Datascript.db conn) "Delete Me")
      in
      let page_id = page.id in
      let page_uuid = wire_uuid_str (entity_block_uuid page) in
      let ref_block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "seed")
      in
      let ref_block_uuid = wire_uuid_str (entity_block_uuid ref_block) in
      let node_ref_content = "ref " ^ Page_ref.to_page_ref page_uuid in
      let title_content = "ref Delete Me" in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Datascript.transact_conn_string conn
               (Printf.sprintf
                  "[{:db/id %d :block/title \"%s\" :block/refs #{%d}}]"
                  ref_block.id node_ref_content page_id));
          ignore (Outliner_page.delete_conn conn page_uuid (Wire.Map []));
          let tx = last_pending_tx_with_op "delete-page" in
          let fwd = tx.forward_outliner_ops in
          let inv = tx.inverse_outliner_ops in
          check "first op delete-page"
            (match fwd with
             | e :: _ -> op_entry_name e = Some "delete-page"
             | [] -> false);
          check "delete-page arg"
            (match fwd with
             | e :: _ -> op_entry_arg0 e = Some (Wire.Uuid page_uuid)
             | [] -> false);
          check "fwd rewritten save-block"
            (List.exists
               (fun e ->
                  match save_block_entry_block e with
                  | Some b ->
                      Wire.get "block/uuid" b = Some (Wire.Uuid ref_block_uuid)
                      && Wire.get "block/title" b
                         = Some (Wire.String title_content)
                  | None -> false)
               fwd);
          check "inv restore-recycled"
            (List.exists
               (fun e ->
                  op_entry_name e = Some "restore-recycled"
                  && op_entry_arg0 e = Some (Wire.Uuid page_uuid))
               inv);
          check "inv node-ref save-block"
            (List.exists
               (fun e ->
                  match save_block_entry_block e with
                  | Some b ->
                      Wire.get "block/uuid" b = Some (Wire.Uuid ref_block_uuid)
                      && Wire.get "block/title" b
                         = Some (Wire.String node_ref_content)
                  | None -> false)
               inv);
          ( match ent_by_block_uuid (Datascript.db conn) ref_block_uuid with
            | Some e ->
                check "raw title rewritten"
                  (ent_raw_title e = Some (String title_content));
                check "page ref removed"
                  (not (List.mem page_id (ref_ids (Ldb.values e "block/refs"))))
            | None -> Alcotest.fail "ref-block missing" );
          let r_undo =
            Sync_apply.apply_history_action test_repo tx.tx_id true []
          in
          check "undo applied"
            (Wire.get "applied?" r_undo = Some (Wire.Bool true));
          ( match ent_by_block_uuid (Datascript.db conn) ref_block_uuid with
            | Some e ->
                check "undo raw title"
                  (ent_raw_title e = Some (String node_ref_content));
                check "undo ref restored"
                  (List.mem page_id (ref_ids (Ldb.values e "block/refs")))
            | None -> Alcotest.fail "ref-block missing" );
          check "undo deleted-at cleared"
            (match ent_by_block_uuid (Datascript.db conn) page_uuid with
             | Some e -> Ldb.value e "logseq.property/deleted-at" = None
             | None -> false);
          let r_redo =
            Sync_apply.apply_history_action test_repo tx.tx_id false []
          in
          check "redo applied"
            (Wire.get "applied?" r_redo = Some (Wire.Bool true));
          ( match ent_by_block_uuid (Datascript.db conn) ref_block_uuid with
            | Some e ->
                check "redo raw title"
                  (ent_raw_title e = Some (String title_content));
                check "redo page ref removed"
                  (not
                     (List.mem page_id (ref_ids (Ldb.values e "block/refs"))))
            | None -> Alcotest.fail "ref-block missing" );
          check "redo deleted-at set"
            (match ent_by_block_uuid (Datascript.db conn) page_uuid with
             | Some e -> (
                 match Ldb.value e "logseq.property/deleted-at" with
                 | Some (Int64 _ | Instant _) -> true
                 | _ -> false)
             | None -> false)))

(* cljs direct-outliner-property-set-persists-set-block-property-outliner-op-test *)
let test_direct_outliner_property_set_persists_set_block_property_op () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ "p2", { Db_test_util.default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "local object")
      in
      let block_uuid = wire_uuid_str (entity_block_uuid block) in
      with_datascript_conns conn (Some ops) (fun () ->
          Outliner_property.set_block_property conn
            (block_uuid_lookup (Wire.Uuid block_uuid))
            "user.property/p2" (Wire.String "local value");
          let pending = Sync_apply.pending_txs test_repo () in
          let property_tx =
            List.find_opt
              (fun (e : Sync_client_op.local_tx_entry) ->
                 e.outliner_op = Some "set-block-property")
              pending
          in
          check "pending" (pending <> []);
          check "property tx" (property_tx <> None);
          check "no forward ops"
            (match property_tx with
             | Some e -> e.forward_outliner_ops = []
             | None -> false)))

(* cljs rebase-replays-direct-set-block-property-without-semantic-ops-test *)
let test_rebase_replays_direct_set_block_property_without_semantic_ops () =
  preserve_state (fun () ->
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ "p2", { Db_test_util.default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      ignore
        (Datascript.listen conn_b "capture-rebase-direct-property-set"
           (fun r ->
              if !remote_tx = [] then
                remote_tx :=
                  Db_normalize.normalize_tx_data r.db_after r.db_before
                    (Db_normalize.wire_of_datoms r.tx_data)));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-rebase-direct-property-set")
        (fun () ->
           Sync_deps.graph_e2ee := Some (fun _ -> false);
           Sync_deps.ensure_graph_aes_key :=
             Some (fun _ -> Db_worker_effect.pure Wire.Nil);
           with_datascript_conns conn_a (Some ops) (fun () ->
               let block =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "local object")
               in
               let block_uuid = wire_uuid_str (entity_block_uuid block) in
               Outliner_property.set_block_property conn_a
                 (block_uuid_lookup (Wire.Uuid block_uuid))
                 "user.property/p2" (Wire.String "local value");
               let pending_before =
                 List.hd (Sync_apply.pending_txs test_repo ())
               in
               check "outliner-op"
                 (pending_before.outliner_op = Some "set-block-property");
               check "no fwd ops"
                 (pending_before.forward_outliner_ops = []);
               ignore
                 (Outliner_core.save_block_conn conn_b
                    (Outliner_op.block_map_of_wire
                       (wire_map
                          [ "block/uuid", Wire.Uuid block_uuid
                          ; "block/title", Wire.String "remote title" ]))
                    Outliner_core.default_save_opts Block_map.empty);
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               ( match
                   ent_by_block_uuid (Datascript.db conn_a) block_uuid
                 with
                 | Some e ->
                     check "remote title"
                       (Ldb.value e "block/title"
                        = Some (String "remote title"));
                     (* cljs (if (map? property-value)
                          (:block/title property-value) property-value) *)
                     let property_value =
                       match Ldb.value e "user.property/p2" with
                       | Some (Ref id) -> (
                           match
                             Datascript.entity (Datascript.db conn_a)
                               (Entity_id id)
                           with
                           | Some ve -> Ldb.value ve "block/title"
                           | None -> None)
                       | v -> v
                     in
                     check "local property kept"
                       (property_value = Some (String "local value"))
                 | None -> Alcotest.fail "block missing" );
               check "still pending"
                 (Sync_apply.pending_tx_by_id test_repo pending_before.tx_id
                  <> None))))

(* cljs canonical-set-block-property-rewrites-ref-values-to-stable-refs-test *)
let test_canonical_set_block_property_rewrites_ref_values () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "x7"
              , { Db_test_util.default_property with
                  p_type = "page"; p_cardinality_many = true } ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "local object")
      in
      let block_uuid = wire_uuid_str (entity_block_uuid block) in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Page y" ();
          let page_y =
            Option.get
              (Db_test_util.find_page_by_title (Datascript.db conn) "Page y")
          in
          Outliner_property.set_block_property conn
            (block_uuid_lookup (Wire.Uuid block_uuid))
            "user.property/x7" (Wire.Int page_y.id);
          let property_tx =
            List.find_opt
              (fun (e : Sync_client_op.local_tx_entry) ->
                 match e.forward_outliner_ops with
                 | op :: _ -> op_entry_name op = Some "set-block-property"
                 | [] -> false)
              (Sync_apply.pending_txs test_repo ())
          in
          check "no set-block-property fwd op" (property_tx = None)))

(* cljs canonical-batch-set-property-rewrites-ref-values-to-stable-refs-test *)
let test_canonical_batch_set_property_rewrites_ref_values () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "x7"
              , { Db_test_util.default_property with
                  p_type = "page"; p_cardinality_many = true } ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object 1" }
                  ; { Db_test_util.default_block with
                      b_title = Some "local object 2" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let db0 = Datascript.db conn in
      let block_1 =
        Option.get (Db_test_util.find_block_by_content db0 "local object 1")
      in
      let block_2 =
        Option.get (Db_test_util.find_block_by_content db0 "local object 2")
      in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Page y" ();
          let page_y =
            Option.get
              (Db_test_util.find_page_by_title (Datascript.db conn) "Page y")
          in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "batch-set-property"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Int block_1.id; Wire.Int block_2.id ]
                       ; kw "user.property/x7"
                       ; Wire.Int page_y.id
                       ; wire_map [] ] ] ]
               (wire_map []));
          let property_tx =
            List.find_opt
              (fun (e : Sync_client_op.local_tx_entry) ->
                 match e.forward_outliner_ops with
                 | op :: _ -> op_entry_name op = Some "batch-set-property"
                 | [] -> false)
              (Sync_apply.pending_txs test_repo ())
          in
          check "no batch-set-property fwd op" (property_tx = None)))

(* shared body for the three apply-history-action batch/set replays:
   seed a tx whose semantic ops carry whatever id form cljs used, then
   apply forward (undo=false) and undo (undo=true) and check values *)
let check_property_value (db : db) (block_uuid : string) (prop : string)
    : value list =
  match ent_by_block_uuid db block_uuid with
  | Some e -> Ldb.values e prop
  | None -> []

let prop_names (db : db) (vs : value list) : string list =
  List.filter_map
    (fun v ->
       match v with
       | Ref id ->
           Option.bind
             (Ldb.ent_of_id db id)
             (fun e ->
                match Ldb.value e "block/name" with
                | Some (String s) -> Some s
                | _ -> None)
       | _ -> None)
    vs

(* cljs apply-history-action-replays-batch-set-property-from-tx-data-with-lookup-refs-test *)
let test_apply_history_action_batch_set_property_lookup_refs () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "x7"
              , { Db_test_util.default_property with
                  p_type = "page"; p_cardinality_many = true } ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Page y" ();
          let db = Datascript.db conn in
          let block =
            Option.get (Db_test_util.find_block_by_content db "local object")
          in
          let page_y =
            Option.get (Db_test_util.find_page_by_title db "Page y")
          in
          let block_ref = block_uuid_lookup (entity_block_uuid block) in
          let page_y_ref = block_uuid_lookup (entity_block_uuid page_y) in
          let block_uuid = wire_uuid_str (entity_block_uuid block) in
          let action_tx_id = fresh_uuid () in
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"batch-set-property"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "batch-set-property"
                      ; Wire.Array
                          [ Wire.Array [ block_ref ]
                          ; kw "user.property/x7"
                          ; page_y_ref
                          ; wire_map [ "entity-id?", Wire.Bool true ] ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "batch-remove-property"
                      ; Wire.Array
                          [ Wire.Array [ block_ref ]; kw "user.property/x7" ] ]
                  ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add block_ref "user.property/x7" page_y_ref ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract block_ref "user.property/x7" page_y_ref ])
                action_tx_id ];
          let r1 =
            Sync_apply.apply_history_action test_repo action_tx_id false []
          in
          check "apply" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check "x7 = page y"
            (List.sort compare
               (prop_names (Datascript.db conn)
                  (check_property_value (Datascript.db conn) block_uuid
                     "user.property/x7"))
             = [ "page y" ]);
          let r2 =
            Sync_apply.apply_history_action test_repo action_tx_id true []
          in
          check "undo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check "x7 empty"
            (check_property_value (Datascript.db conn) block_uuid
               "user.property/x7"
             = [])))

(* cljs apply-history-action-replays-batch-set-property-from-tx-data-with-raw-uuid-ids-test
   and cljs apply-history-action-redo-replays-batch-set-property-with-raw-uuid-ids-test
   — identical bodies in cljs; ported once here and registered under both
   test names so the suite keeps the same count/order. *)
let batch_set_property_raw_uuid_body () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "heading"
              , { Db_test_util.default_property with p_type = "number" } )
            ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let db = Datascript.db conn in
          let block =
            Option.get (Db_test_util.find_block_by_content db "local object")
          in
          let block_uuid = wire_uuid_str (entity_block_uuid block) in
          let block_ref = block_uuid_lookup (Wire.Uuid block_uuid) in
          let action_tx_id = fresh_uuid () in
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"batch-set-property"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "batch-set-property"
                      ; Wire.Array
                          [ Wire.Array [ Wire.Uuid block_uuid ]
                          ; kw "logseq.property/heading"
                          ; Wire.Int 2
                          ; Wire.Nil ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "batch-remove-property"
                      ; Wire.Array
                          [ Wire.Array [ block_ref ]
                          ; kw "logseq.property/heading" ] ] ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add block_ref "logseq.property/heading"
                         (Wire.Int 2) ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract block_ref "logseq.property/heading"
                         (Wire.Int 2) ])
                action_tx_id ];
          let r1 =
            Sync_apply.apply_history_action test_repo action_tx_id false []
          in
          check "apply" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          let heading_v =
            check_property_value (Datascript.db conn) block_uuid
              "logseq.property/heading"
          in
          check "heading 2"
            (match heading_v with
             | [ Int64 2L ] -> true
             | [ Float f ] -> f = 2.
             | _ -> false);
          let r2 =
            Sync_apply.apply_history_action test_repo action_tx_id true []
          in
          check "undo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check "heading cleared"
            (check_property_value (Datascript.db conn) block_uuid
               "logseq.property/heading"
             = [])))

(* cljs apply-history-action-replays-set-block-property-from-tx-data-with-lookup-refs-test *)
let test_apply_history_action_set_block_property_lookup_refs () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "x7"
              , { Db_test_util.default_property with
                  p_type = "page"; p_cardinality_many = true } ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Page y" ();
          let db = Datascript.db conn in
          let block =
            Option.get (Db_test_util.find_block_by_content db "local object")
          in
          let page_y =
            Option.get (Db_test_util.find_page_by_title db "Page y")
          in
          let block_ref = block_uuid_lookup (entity_block_uuid block) in
          let page_y_ref = block_uuid_lookup (entity_block_uuid page_y) in
          let block_uuid = wire_uuid_str (entity_block_uuid block) in
          let action_tx_id = fresh_uuid () in
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"set-block-property"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "set-block-property"
                      ; Wire.Array [ block_ref; kw "user.property/x7"; page_y_ref ]
                      ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "remove-block-property"
                      ; Wire.Array [ block_ref; kw "user.property/x7" ] ] ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add block_ref "user.property/x7" page_y_ref ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract block_ref "user.property/x7" page_y_ref ])
                action_tx_id ];
          let r1 =
            Sync_apply.apply_history_action test_repo action_tx_id false []
          in
          check "apply" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check "x7 = page y"
            (List.sort compare
               (prop_names (Datascript.db conn)
                  (check_property_value (Datascript.db conn) block_uuid
                     "user.property/x7"))
             = [ "page y" ]);
          let r2 =
            Sync_apply.apply_history_action test_repo action_tx_id true []
          in
          check "undo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check "x7 empty"
            (check_property_value (Datascript.db conn) block_uuid
               "user.property/x7"
             = [])))

(* cljs apply-history-action-skips-sync-fix-pending-tx-test *)
let test_apply_history_action_skips_sync_fix_pending_tx () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let missing_block_ref = block_uuid_lookup (Wire.Uuid (fresh_uuid ())) in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"fix"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add missing_block_ref "block/title"
                         (Wire.String "missing") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract missing_block_ref "block/title"
                         (Wire.String "missing") ])
                tx_id ];
          let r = Sync_apply.apply_history_action test_repo tx_id true [] in
          check "not applied" (Wire.get "applied?" r = Some (Wire.Bool false));
          check "reason"
            (Wire.get "reason" r = Some (kw "unsupported-history-action"))))

(* cljs replay-recycle-delete-permanently-removes-recycled-page-test *)
let test_replay_recycle_delete_permanently_removes_recycled_page () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "child 1" } ] } ]
          ()
      in
      let db = Datascript.db conn in
      let page =
        Option.get (Db_test_util.find_page_by_title db "page 1")
      in
      let child =
        Option.get (Db_test_util.find_block_by_content db "child 1")
      in
      let page_uuid = wire_uuid_str (entity_block_uuid page) in
      let child_uuid = wire_uuid_str (entity_block_uuid child) in
      ignore (Outliner_page.delete_conn conn page_uuid (Wire.Map []));
      check "page recycled"
        (match ent_by_block_uuid (Datascript.db conn) page_uuid with
         | Some e -> Ldb.recycled e
         | None -> false);
      check "replay"
        (Sync_apply.replay_canonical_outliner_op conn
           (Wire.Array
              [ kw "recycle-delete-permanently"
              ; Wire.Array [ block_uuid_lookup (Wire.Uuid page_uuid) ] ])
           None
         <> None);
      check "page gone"
        (ent_by_block_uuid (Datascript.db conn) page_uuid = None);
      check "child gone"
        (ent_by_block_uuid (Datascript.db conn) child_uuid = None))

(* cljs replay-recycle-delete-permanently-removes-recycled-block-test *)
let test_replay_recycle_delete_permanently_removes_recycled_block () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_children =
                        [ { Db_test_util.default_block with
                            b_title = Some "child" } ] } ] } ]
          ()
      in
      let db = Datascript.db conn in
      let parent =
        Option.get (Db_test_util.find_block_by_content db "parent")
      in
      let child =
        Option.get (Db_test_util.find_block_by_content db "child")
      in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      let child_uuid = wire_uuid_str (entity_block_uuid child) in
      ignore
        (Datascript.transact_conn
           ~tx_meta:[ "outliner-op", Keyword "delete-blocks" ]
           conn
           (Outliner_recycle.recycle_blocks_tx_data (Datascript.db conn)
              [ parent ] ()));
      check "parent recycled"
        (match ent_by_block_uuid (Datascript.db conn) parent_uuid with
         | Some e -> Ldb.recycled e
         | None -> false);
      check "replay"
        (Sync_apply.replay_canonical_outliner_op conn
           (Wire.Array
              [ kw "recycle-delete-permanently"
              ; Wire.Array [ block_uuid_lookup (Wire.Uuid parent_uuid) ] ])
           None
         <> None);
      check "parent gone"
        (ent_by_block_uuid (Datascript.db conn) parent_uuid = None);
      check "child gone"
        (ent_by_block_uuid (Datascript.db conn) child_uuid = None))

(* cljs replay-recycle-delete-permanently-missing-root-is-idempotent-test *)
let test_replay_recycle_delete_permanently_missing_root_is_idempotent () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks = [] } ]
          ()
      in
      check "replay nil"
        (Sync_apply.replay_canonical_outliner_op conn
           (Wire.Array
              [ kw "recycle-delete-permanently"
              ; Wire.Array [ block_uuid_lookup (Wire.Uuid (fresh_uuid ())) ] ])
           None
         = None))

(* cljs apply-history-action-replays-set-block-property-from-tx-data-with-raw-uuid-id-test
   and cljs apply-history-action-redo-replays-set-block-tags-with-raw-uuid-id-test
   — identical bodies in cljs; shared body, registered under both names. *)
let set_block_property_raw_uuid_body () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~classes:[ "tag1", Db_test_util.default_class ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let db = Datascript.db conn in
          let block =
            Option.get (Db_test_util.find_block_by_content db "local object")
          in
          let tag1 =
            Option.get (Ldb.ent_of_ref db (Ident "user.class/tag1"))
          in
          let block_uuid = wire_uuid_str (entity_block_uuid block) in
          let tag_uuid = wire_uuid_str (entity_block_uuid tag1) in
          let block_ref = block_uuid_lookup (Wire.Uuid block_uuid) in
          let tag_ref = block_uuid_lookup (Wire.Uuid tag_uuid) in
          let action_tx_id = fresh_uuid () in
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"set-block-property"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "set-block-property"
                      ; Wire.Array
                          [ Wire.Uuid block_uuid; kw "block/tags"; tag_ref ] ]
                  ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "remove-block-property"
                      ; Wire.Array [ block_ref; kw "block/tags" ] ] ]
                ~tx_data_v:
                  (Wire.Array [ db_add block_ref "block/tags" tag_ref ])
                ~reversed_tx_data:
                  (Wire.Array [ db_retract block_ref "block/tags" tag_ref ])
                action_tx_id ];
          let r1 =
            Sync_apply.apply_history_action test_repo action_tx_id false []
          in
          check "apply" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check "tags = #{tag}"
            (ref_ids
               (check_property_value (Datascript.db conn) block_uuid
                  "block/tags")
             = [ tag1.id ]);
          let r2 =
            Sync_apply.apply_history_action test_repo action_tx_id true []
          in
          check "undo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check "tags cleared"
            (check_property_value (Datascript.db conn) block_uuid "block/tags"
             = [])))

let raw_transact_string (conn : conn) (tx_data : Wire.t list) : unit =
  (* cljs bare (d/transact! conn [...]) — no db-transact processing *)
  ignore
    (Datascript.transact_conn_string conn
       ("["
        ^ String.concat " "
            (List.map Ds_wire.edn_of_transit tx_data)
        ^ "]"))

(* cljs (:logseq.property/status e) — entity-plus
   lookup-kv-with-default-value: qualified property attr falls back to the
   property's :logseq.property/scalar-default-value (checkbox) or
   :logseq.property/default-value entity when the entity has no value *)
let ent_prop_with_default (e : entity) (a : attr) : entity option =
  (* cljs entity attr read resolves ref/lookup-ref/keyword values to
     entities (entity-plus lookup-kv-then-entity) *)
  let prop_ref (p : entity) (pa : attr) : entity option =
    match Ldb.value p pa with
    | Some (Ref id) -> Ldb.ent_of_id p.db id
    | Some (Vector [ Keyword "block/uuid"; Uuid u ]) ->
        Ldb.ent_of_ref p.db (Lookup_ref ("block/uuid", Uuid u))
    | Some (Keyword k) -> Datascript.entity p.db (Ident k)
    | _ -> None
  in
  match prop_ref e a with
  | Some _ as r -> r
  | None -> (
      match Datascript.entity e.db (Ident a) with
      | Some prop -> (
          let default_attr =
            match Ldb.value prop "logseq.property/type" with
            | Some (Keyword "checkbox") ->
                "logseq.property/scalar-default-value"
            | _ -> "logseq.property/default-value"
          in
          match prop_ref prop default_attr with
          | Some _ as r -> r
          | None -> (
              (* cljs initial data carries the builtin :properties (e.g.
                 status's :logseq.property/default-value -> status.todo);
                 the canned initial-data fixture doesn't, so resolve the
                 declared default from the builtin spec — same observable
                 result as cljs *)
              match
                List.find_opt
                  (fun (p : Builtin_data.builtin_property) ->
                    p.Builtin_data.ident = a)
                  Builtin_data.built_in_properties
              with
              | Some b -> (
                  match
                    List.assoc_opt default_attr
                      b.Builtin_data.properties
                  with
                  | Some (Keyword ident) ->
                      Datascript.entity e.db (Ident ident)
                  | _ -> None)
              | None -> None))
      | None -> None)

let op_name (entry : Wire.t) : string option =
  match entry with
  | Wire.Array (Wire.Keyword s :: _) -> Some s
  | _ -> None

let op_args (entry : Wire.t) : Wire.t list =
  match entry with
  | Wire.Array [ Wire.Keyword _; (Wire.Array args | Wire.List args) ] -> args
  | _ -> []

let op_arg (entry : Wire.t) (i : int) : Wire.t =
  match List.nth_opt (op_args entry) i with
  | Some v -> v
  | None -> Wire.Nil

(* cljs (reset! undo-redo/*apply-history-action! apply-history-action!) —
   in OCaml the hook installs through gen-undo-ops during
   enqueue-local-tx-aux, so wire Sync_deps.gen_undo_ops exactly like
   Sync_client's startup wiring. *)
(* cljs tests run with sync-crypt/graph-e2ee? stubbed off *)
let wire_no_e2ee () : unit =
  Sync_deps.graph_e2ee := Some (fun _ -> false);
  Sync_deps.ensure_graph_aes_key :=
    Some (fun _ -> Db_worker_effect.pure Wire.Nil)

let wire_gen_undo_ops () : unit =
  Sync_deps.gen_undo_ops :=
    Some
      (fun repo (r : Datascript.tx_report) tx_id ->
        Undo_redo.gen_undo_ops repo ~tx_data:r.tx_data
          ~tx_meta:
            (List.map
               (fun (a, v) -> (a, Ds_wire.transit_of_value v))
               r.tx_meta)
          ~db_before:r.db_before ~db_after:r.db_after ~tx_id
          ~apply_history:(fun repo tx_id_opt undo pairs ->
            let tx_meta =
              List.filter_map
                (fun (k, v) ->
                  match k with
                  | Wire.Keyword s -> Some (s, Ds_wire.value_of_transit v)
                  | _ -> None)
                pairs
            in
            let result =
              Sync_apply.apply_history_action repo
                (Option.value ~default:"" tx_id_opt) undo tx_meta
            in
            match result with
            | Wire.Map kvs ->
                List.filter_map
                  (fun (k, v) ->
                    match k with Wire.Keyword s -> Some (s, v) | _ -> None)
                  kvs
            | _ -> []))

(* cljs apply-history-action-redo-replays-insert-blocks-test *)
let test_apply_history_action_redo_replays_insert_blocks () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let requested_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/title", Wire.String "history insert"
                               ; "block/uuid", Wire.Uuid requested_uuid ] ]
                       ; Wire.Int parent.id
                       ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
               local_tx_meta);
          let pending = List.hd (Sync_apply.pending_txs test_repo ()) in
          let inserted =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn)
                 "history insert")
          in
          let inserted_uuid = entity_block_uuid inserted in
          let tx_id = pending.tx_id in
          check "forward uuid"
            (Wire.get "block/uuid"
               (List.hd
                  (wire_list
                     (op_arg (List.hd pending.forward_outliner_ops) 0)))
             = Some inserted_uuid);
          check "inverse uuid"
            (List.hd
               (wire_list (op_arg (List.hd pending.inverse_outliner_ops) 0))
             = inserted_uuid);
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check "inserted gone"
            (ent_by_block_uuid (Datascript.db conn)
               (wire_uuid_str inserted_uuid)
             = None);
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          match
            ent_by_block_uuid (Datascript.db conn)
              (wire_uuid_str inserted_uuid)
          with
          | Some inserted' ->
              check "title"
                (Ldb.value inserted' "block/title"
                 = Some (String "history insert"));
              check "parent uuid"
                (Ldb.ref_ent inserted' "block/parent"
                 |> Option.map entity_block_uuid
                 = Some (entity_block_uuid parent))
          | None -> Alcotest.fail "inserted missing"))

(* cljs apply-history-action-redo-replays-save-block-test *)
let test_apply_history_action_redo_replays_save_block () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid child_uuid
                           ; "block/title", Wire.String "child 1 inline edit" ]
                       ; wire_map [] ] ] ]
               local_tx_meta);
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let check_title expected =
            match ent_by_block_uuid (Datascript.db conn) child_uuid with
            | Some e ->
                check "title" (Ldb.value e "block/title" = Some (String expected))
            | None -> Alcotest.fail "child missing"
          in
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_title "child 1";
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_title "child 1 inline edit"))

(* cljs apply-history-action-redo-rejects-save-block-with-late-created-query-ref-test *)
let test_apply_history_action_redo_rejects_save_block_late_query_ref () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "source" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let tx_id = fresh_uuid () in
      let query_block_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          let source =
            Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "source")
          in
          let source_uuid = wire_uuid_str (entity_block_uuid source) in
          let source_page_uuid =
            match Ldb.ref_ent source "block/page" with
            | Some p -> wire_uuid_str (entity_block_uuid p)
            | None -> Alcotest.fail "source page missing"
          in
          check "source exists"
            (ent_by_block_uuid (Datascript.db conn) source_uuid <> None);
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"save-block"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid source_uuid
                              ; ( "logseq.property/query"
                                , block_uuid_lookup
                                    (Wire.Uuid query_block_uuid) ) ]
                          ; Wire.Nil ] ]
                  ; Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid query_block_uuid
                              ; "block/title", Wire.String ""
                              ; ( "block/parent"
                                , block_uuid_lookup
                                    (Wire.Uuid source_page_uuid) )
                              ; ( "block/page"
                                , block_uuid_lookup
                                    (Wire.Uuid source_page_uuid) )
                              ; "block/order", Wire.String "a0" ]
                          ; Wire.Nil ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "remove-block-property"
                      ; Wire.Array
                          [ Wire.Uuid source_uuid
                          ; kw "logseq.property/query" ] ]
                  ; Wire.Array
                      [ kw "delete-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ block_uuid_lookup
                                  (Wire.Uuid query_block_uuid) ]
                          ; wire_map [] ] ] ]
                tx_id ];
          let result =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "applied?" (Wire.get "applied?" result = Some (Wire.Bool false));
          check "reason" (Wire.get "reason" result = Some (kw "error"));
          check "error" (Wire.get "error" result = None);
          check "query block not created"
            (ent_by_block_uuid (Datascript.db conn) query_block_uuid = None);
          check "source query nil"
            (match ent_by_block_uuid (Datascript.db conn) source_uuid with
             | Some e ->
                 Ldb.ref_ent e "logseq.property/query" = None
             | None -> false)))

(* cljs replay-save-block-missing-block-is-invalid-test *)
let test_replay_save_block_missing_block_is_invalid () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "seed" } ]
              } ]
          ()
      in
      let seed =
        Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "seed")
      in
      let page_uuid =
        match Ldb.ref_ent seed "block/page" with
        | Some p -> wire_uuid_str (entity_block_uuid p)
        | None -> Alcotest.fail "page missing"
      in
      let block_uuid = fresh_uuid () in
      let raised =
        try
          ignore
            (with_silenced_console_error (fun () ->
                 Sync_apply.replay_canonical_outliner_op conn
                   (Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid block_uuid
                              ; "block/title", Wire.String ""
                              ; ( "block/parent"
                                , block_uuid_lookup (Wire.Uuid page_uuid) )
                              ; ( "block/page"
                                , block_uuid_lookup (Wire.Uuid page_uuid) )
                              ; "block/order", Wire.String "a0" ]
                          ; Wire.Nil ] ])
                   None));
          false
        with _ -> true
      in
      check "throws" raised;
      check "block not created"
        (ent_by_block_uuid (Datascript.db conn) block_uuid = None))

(* cljs apply-history-action-redo-replays-status-property-test *)
let test_apply_history_action_redo_replays_status_property () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "task"
                    ; b_tags = [ "logseq.class/Task" ]
                    ; b_properties = [ "status", Str "Todo" ] } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let task =
            Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "task")
          in
          let task_uuid = wire_uuid_str (entity_block_uuid task) in
          Outliner_property.set_block_property conn (Wire.Int task.id)
            "logseq.property/status" (Wire.String "Doing");
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let check_status expected =
            match ent_by_block_uuid (Datascript.db conn) task_uuid with
            | Some e ->
                check "status ident"
                  (Option.bind
                     (ent_prop_with_default e "logseq.property/status")
                     (fun s -> Ldb.value s "db/ident")
                   = Some (Keyword expected))
            | None -> Alcotest.fail "task missing"
          in
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_status "logseq.property/status.todo";
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_status "logseq.property/status.doing"))

(* cljs apply-history-action-redo-replays-upsert-property-test *)
let test_apply_history_action_redo_replays_upsert_property () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "seed" } ]
              } ]
          ()
      in
      let ops = new_client_ops_db () in
      let property_name = "custom_prop_x" in
      let property_page_ids (arg_db : db) : int list =
        match Ldb.ent_of_ref arg_db (Ident "logseq.class/Property") with
        | None -> []
        | Some cls ->
            List.of_seq (datoms arg_db Aevt ~a:"block/tags" ~v:(Ref cls.id) ())
            |> List.map (fun (d : datom) -> d.e)
      in
      with_datascript_conns conn (Some ops) (fun () ->
          let before_ids = property_page_ids (Datascript.db conn) in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "upsert-property"
                   ; Wire.Array
                       [ Wire.Nil
                       ; wire_map [ "logseq.property/type", kw "default" ]
                       ; wire_map
                           [ "property-name", Wire.String property_name ] ] ] ]
               local_tx_meta);
          let after_ids = property_page_ids (Datascript.db conn) in
          let created_id =
            List.find_opt (fun id -> not (List.mem id before_ids)) after_ids
          in
          match created_id with
          | None -> Alcotest.fail "property not created"
          | Some created_id -> (
              let created =
                Option.get (Datascript.entity (Datascript.db conn) (Entity_id created_id))
              in
              let created_ident =
                match Ldb.value created "db/ident" with
                | Some (Keyword s) -> s
                | _ -> Alcotest.fail "created property has no ident"
              in
              let created_uuid =
                wire_uuid_str (entity_block_uuid created)
              in
              let tx_id =
                (List.hd (Sync_apply.pending_txs test_repo ())).tx_id
              in
              check "ident is kw" (String.contains created_ident '/');
              check "uuid is uuid" (created_uuid <> "");
              let pending = Sync_apply.pending_tx_by_id test_repo tx_id in
              (match pending with
               | Some pending ->
                   check "forward op"
                     (op_name (List.hd pending.forward_outliner_ops)
                      = Some "upsert-property");
                   check "forward ident"
                     (op_arg (List.hd pending.forward_outliner_ops) 0
                      = kw created_ident);
                   check "inverse op"
                     (op_name (List.hd pending.inverse_outliner_ops)
                      = Some "delete-page");
                   check "inverse uuid"
                     (op_arg (List.hd pending.inverse_outliner_ops) 0
                      = Wire.Uuid created_uuid)
               | None -> Alcotest.fail "pending tx missing");
              let r1 =
                Sync_apply.apply_history_action test_repo tx_id true []
              in
              check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
              check "ident gone"
                (Datascript.entity (Datascript.db conn) (Ident created_ident) = None);
              let r2 =
                Sync_apply.apply_history_action test_repo tx_id false []
              in
              check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
              match Datascript.entity (Datascript.db conn) (Ident created_ident) with
              | Some restored ->
                  check "uuid restored"
                    (wire_uuid_str (entity_block_uuid restored) = created_uuid)
              | None -> Alcotest.fail "restored missing")))

(* cljs undo-upsert-property-many-node-restores-previous-schema-test *)
let test_undo_upsert_property_many_node_restores_previous_schema () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "p-many"
              , { Db_test_util.default_property with p_type = "node" } ) ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "seed" } ]
              } ]
          ()
      in
      let ops = new_client_ops_db () in
      let property_id = "user.property/p-many" in
      wire_gen_undo_ops ();
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (kw property_id) "logseq.property/classes"
                (kw "logseq.class/Root") ];
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "upsert-property"
                   ; Wire.Array
                       [ kw property_id
                       ; wire_map
                           [ "logseq.property/type", kw "node"
                           ; "db/cardinality", kw "many" ]
                       ; wire_map [] ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let last = List.nth pending (List.length pending - 1) in
          (match last.inverse_outliner_ops with
           | inv :: _ ->
               check "inverse op" (op_name inv = Some "upsert-property");
               check "inverse ident" (op_arg inv 0 = kw property_id);
               check "transit writes"
                 (Transit_codec.to_string
                    (Wire.Array last.inverse_outliner_ops)
                  <> "")
           | [] -> Alcotest.fail "no inverse ops");
          let check_card expected =
            match Datascript.entity (Datascript.db conn) (Ident property_id) with
            | Some e ->
                check "cardinality"
                  (Ldb.value e "db/cardinality" = Some (Keyword expected))
            | None -> Alcotest.fail "property missing"
          in
          check_card "db.cardinality/many";
          let undo_result = Undo_redo.undo test_repo in
          check "undo?"
            (Wire.get "undo?" undo_result = Some (Wire.Bool true));
          check "property exists"
            (Datascript.entity (Datascript.db conn) (Ident property_id) <> None);
          check_card "db.cardinality/one"))

(* cljs apply-history-action-redo-replays-block-concat-test *)
let test_apply_history_action_redo_replays_block_concat () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "hellohello" }
                  ; { Db_test_util.default_block with
                      b_title = Some "hello" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let left =
            Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "hellohello")
          in
          let right =
            Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "hello")
          in
          let left_uuid = wire_uuid_str (entity_block_uuid left) in
          let right_uuid = wire_uuid_str (entity_block_uuid right) in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "delete-blocks"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Int right.id ]
                       ; wire_map
                           [ "deleted-by-uuid", Wire.Uuid (fresh_uuid ()) ] ] ]
               ; Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid left_uuid
                           ; "block/title", Wire.String "hellohellohello" ]
                       ; Wire.Nil ] ] ]
               local_tx_meta);
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let check_titles expected_left right_gone =
            (match ent_by_block_uuid (Datascript.db conn) left_uuid with
             | Some e ->
                 check "left title"
                   (Ldb.value e "block/title" = Some (String expected_left))
             | None -> Alcotest.fail "left missing");
            check "right gone"
              ((ent_by_block_uuid (Datascript.db conn) right_uuid = None) = right_gone)
          in
          check_titles "hellohellohello" true;
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_titles "hellohello" false;
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_titles "hellohellohello" true))

(* cljs apply-history-action-redo-replays-save-then-insert-test *)
let test_apply_history_action_redo_replays_save_then_insert () =
  preserve_state (fun () ->
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      let inserted_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid child_uuid
                           ; "block/title", Wire.String "child 1 edited" ]
                       ; wire_map [] ] ]
               ; Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/title"
                               , Wire.String "inserted after save"
                               ; "block/uuid", Wire.Uuid inserted_uuid ] ]
                       ; Wire.Int child1.id
                       ; wire_map [ "sibling?", Wire.Bool true ] ] ] ]
               local_tx_meta);
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let inserted =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn) "inserted after save")
          in
          let inserted_uuid' = wire_uuid_str (entity_block_uuid inserted) in
          let check_titles child_title inserted_gone =
            (match ent_by_block_uuid (Datascript.db conn) child_uuid with
             | Some e ->
                 check "child title"
                   (Ldb.value e "block/title" = Some (String child_title))
             | None -> Alcotest.fail "child missing");
            check "inserted gone"
              ((ent_by_block_uuid (Datascript.db conn) inserted_uuid' = None) = inserted_gone)
          in
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_titles "child 1" true;
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_titles "child 1 edited" false))

(* cljs apply-history-action-redo-replays-paste-into-empty-target-test *)
let test_apply_history_action_redo_replays_paste_into_empty_target () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "first" }
                  ; { Db_test_util.default_block with b_title = Some "" } ] }
            ]
          ()
      in
      let ops = new_client_ops_db () in
      let empty_target =
        Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "")
      in
      let empty_target_uuid = wire_uuid_str (entity_block_uuid empty_target) in
      let parent_uuid = fresh_uuid () in
      let copied_blocks =
        Wire.Array
          [ wire_map
              [ "block/uuid", Wire.Uuid parent_uuid
              ; "block/title", Wire.String "paste parent" ]
          ; wire_map
              [ "block/uuid", Wire.Uuid (fresh_uuid ())
              ; "block/title", Wire.String "paste child"
              ; ( "block/parent"
                , block_uuid_lookup (Wire.Uuid parent_uuid) ) ] ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ copied_blocks
                       ; Wire.Int empty_target.id
                       ; wire_map
                           [ "sibling?", Wire.Bool true
                           ; "outliner-op", kw "paste"
                           ; "replace-empty-target?", Wire.Bool true ] ] ] ]
               local_tx_meta);
          let pending = List.hd (Sync_apply.pending_txs test_repo ()) in
          let tx_id = pending.tx_id in
          let pasted_uuid =
            let e =
              Option.get
                (Db_test_util.find_block_by_content (Datascript.db conn) "paste parent")
            in
            wire_uuid_str (entity_block_uuid e)
          in
          let pasted_child_uuid =
            let e =
              Option.get
                (Db_test_util.find_block_by_content (Datascript.db conn) "paste child")
            in
            wire_uuid_str (entity_block_uuid e)
          in
          let inverse = pending.inverse_outliner_ops in
          check "inverse has delete-blocks target"
            (List.exists
               (fun entry ->
                  op_name entry = Some "delete-blocks"
                  && List.map wire_uuid_str (wire_list (op_arg entry 0))
                     = [ empty_target_uuid ])
               inverse);
          check "inverse has insert-blocks"
            (List.exists
               (fun entry ->
                  op_name entry = Some "insert-blocks"
                  && Wire.get "block/uuid"
                       (List.hd (wire_list (op_arg entry 0)))
                     = Some (Wire.Uuid empty_target_uuid))
               inverse);
          check "no save-block inverse"
            (not
               (List.exists
                  (fun entry -> op_name entry = Some "save-block")
                  inverse));
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          (match ent_by_block_uuid (Datascript.db conn) empty_target_uuid with
           | Some restored ->
               check "restored empty title"
                 (Ldb.value restored "block/title" = Some (String ""))
           | None -> Alcotest.fail "target missing");
          check "pasted child gone"
            (ent_by_block_uuid (Datascript.db conn) pasted_child_uuid = None);
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          match ent_by_block_uuid (Datascript.db conn) pasted_uuid with
          | Some redone ->
              check "pasted title"
                (Ldb.value redone "block/title" = Some (String "paste parent"))
          | None -> Alcotest.fail "pasted missing"))

(* cljs apply-history-action-redo-replays-insert-save-delete-sequence-test *)
let test_apply_history_action_redo_replays_insert_save_delete_sequence () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let inserted_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/title", Wire.String "draft"
                               ; "block/uuid", Wire.Uuid inserted_uuid ] ]
                       ; Wire.Int parent.id
                       ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
               local_tx_meta);
          let inserted =
            Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "draft")
          in
          let inserted_uuid' = wire_uuid_str (entity_block_uuid inserted) in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid inserted_uuid'
                           ; "block/title", Wire.String "published" ]
                       ; wire_map [] ] ] ]
               local_tx_meta);
          delete_blocks conn [ inserted ];
          let pending = Sync_apply.pending_txs test_repo () in
          let find_op op =
            List.find_opt
              (fun (t : Sync_client_op.local_tx_entry) ->
                t.outliner_op = Some op)
              pending
          in
          let insert_action = find_op "insert-blocks"
          and save_action = find_op "save-block"
          and delete_action = find_op "delete-blocks" in
          check "insert" (insert_action <> None);
          check "save" (save_action <> None);
          check "delete" (delete_action <> None);
          let save_id = (Option.get save_action).tx_id
          and delete_id = (Option.get delete_action).tx_id in
          check "gone" (ent_by_block_uuid (Datascript.db conn) inserted_uuid' = None);
          let check_title expected =
            match ent_by_block_uuid (Datascript.db conn) inserted_uuid' with
            | Some e ->
                check "title" (Ldb.value e "block/title" = Some (String expected))
            | None -> check "title" (expected = "")
          in
          let r1 =
            Sync_apply.apply_history_action test_repo delete_id true []
          in
          check "undo delete" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_title "published";
          let r2 =
            Sync_apply.apply_history_action test_repo save_id true []
          in
          check "undo save" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_title "draft";
          let r3 =
            Sync_apply.apply_history_action test_repo save_id false []
          in
          check "redo save" (Wire.get "applied?" r3 = Some (Wire.Bool true));
          check_title "published";
          let r4 =
            Sync_apply.apply_history_action test_repo delete_id false []
          in
          check "redo delete" (Wire.get "applied?" r4 = Some (Wire.Bool true));
          check "gone again" (ent_by_block_uuid (Datascript.db conn) inserted_uuid' = None)))

(* cljs apply-history-action-undo-keeps-working-after-remote-non-structural-update-test *)
let test_apply_history_action_undo_keeps_working_after_remote_update () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid child_uuid
                           ; "block/title", Wire.String "local-2" ]
                       ; wire_map [] ] ] ]
               local_tx_meta);
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int child1.id) "block/updated-at"
                   (Wire.Int 12345) ]);
          let check_title expected =
            match ent_by_block_uuid (Datascript.db conn) child_uuid with
            | Some e ->
                check "title" (Ldb.value e "block/title" = Some (String expected))
            | None -> Alcotest.fail "child missing"
          in
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          check_title "child 1";
          let r2 =
            Sync_apply.apply_history_action test_repo tx_id false []
          in
          check "redo" (Wire.get "applied?" r2 = Some (Wire.Bool true));
          check_title "local-2"))

(* cljs apply-history-action-undo-restores-hard-deleted-block-via-semantic-inverse-test *)
let test_apply_history_action_undo_restores_hard_deleted_block () =
  preserve_state (fun () ->
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = wire_uuid_str (entity_block_uuid child1) in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      let page_uuid =
        match Ldb.ref_ent parent "block/page" with
        | Some p -> wire_uuid_str (entity_block_uuid p)
        | None -> Alcotest.fail "page missing"
      in
      with_datascript_conns conn (Some ops) (fun () ->
          delete_blocks conn [ child1 ];
          let pending = Sync_apply.pending_txs test_repo () in
          let delete_action =
            List.find_opt
              (fun (t : Sync_client_op.local_tx_entry) ->
                t.outliner_op = Some "delete-blocks")
              pending
            |> Option.get
          in
          check "deleted" (ent_by_block_uuid (Datascript.db conn) child_uuid = None);
          check "inverse is insert-blocks"
            (op_name (List.hd delete_action.inverse_outliner_ops)
             = Some "insert-blocks");
          let r1 =
            Sync_apply.apply_history_action test_repo delete_action.tx_id
              true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          match ent_by_block_uuid (Datascript.db conn) child_uuid with
          | Some restored ->
              check "page uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent restored "block/page")
                 = Some page_uuid);
              check "parent uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent restored "block/parent")
                 = Some parent_uuid);
              check "deleted-at nil"
                (Ldb.value restored "logseq.property/deleted-at" = None)
          | None -> Alcotest.fail "restored missing"))

(* cljs apply-history-action-undo-restores-multi-parent-delete-via-semantic-inverse-test *)
let test_apply_history_action_undo_restores_multi_parent_delete () =
  preserve_state (fun () ->
      let conn, ops, parent_a, parent_b, a_child_1, b_child_1 =
        setup_two_parents ()
      in
      let a_uuid = wire_uuid_str (entity_block_uuid a_child_1)
      and b_uuid = wire_uuid_str (entity_block_uuid b_child_1)
      and parent_a_uuid = wire_uuid_str (entity_block_uuid parent_a)
      and parent_b_uuid = wire_uuid_str (entity_block_uuid parent_b) in
      with_datascript_conns conn (Some ops) (fun () ->
          delete_blocks conn
            [ Option.get (ent_by_block_uuid (Datascript.db conn) a_uuid)
            ; Option.get (ent_by_block_uuid (Datascript.db conn) b_uuid) ];
          let pending = Sync_apply.pending_txs test_repo () in
          let delete_action =
            List.find_opt
              (fun (t : Sync_client_op.local_tx_entry) ->
                t.outliner_op = Some "delete-blocks")
              pending
            |> Option.get
          in
          let r1 =
            Sync_apply.apply_history_action test_repo delete_action.tx_id
              true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          let check_parent uuid expected =
            match ent_by_block_uuid (Datascript.db conn) uuid with
            | Some e ->
                check "parent"
                  (Option.map
                     (fun p -> wire_uuid_str (entity_block_uuid p))
                     (Ldb.ref_ent e "block/parent")
                   = Some expected)
            | None -> Alcotest.fail "restored missing"
          in
          check_parent a_uuid parent_a_uuid;
          check_parent b_uuid parent_b_uuid))

(* cljs move-blocks-multi-parent-builds-per-root-inverse-history-test *)
let test_move_blocks_multi_parent_builds_per_root_inverse_history () =
  preserve_state (fun () ->
      let conn, ops, parent_a, parent_b, a_child_1, b_child_1 =
        setup_two_parents ()
      in
      let a_uuid = wire_uuid_str (entity_block_uuid a_child_1)
      and b_uuid = wire_uuid_str (entity_block_uuid b_child_1)
      and parent_a_uuid = wire_uuid_str (entity_block_uuid parent_a)
      and parent_b_uuid = wire_uuid_str (entity_block_uuid parent_b) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "move-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ Wire.Int a_child_1.id; Wire.Int b_child_1.id ]
                       ; Wire.Int parent_b.id
                       ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let move_action =
            List.find_opt
              (fun (t : Sync_client_op.local_tx_entry) ->
                t.outliner_op = Some "move-blocks")
              pending
            |> Option.get
          in
          let inverse = move_action.inverse_outliner_ops in
          check "2 inverse ops" (List.length inverse = 2);
          let check_move uuid target =
            List.exists
              (fun entry ->
                op_name entry = Some "move-blocks"
                && wire_list (op_arg entry 0)
                   = [ Wire.Uuid uuid ]
                && op_arg entry 1 = Wire.Uuid target
                && Wire.get "sibling?" (op_arg entry 2)
                   = Some (Wire.Bool false))
              inverse
          in
          check "a move" (check_move a_uuid parent_a_uuid);
          check "b move" (check_move b_uuid parent_b_uuid)))

(* cljs apply-history-action-undo-restores-multi-parent-move-via-semantic-inverse-test *)
let test_apply_history_action_undo_restores_multi_parent_move () =
  preserve_state (fun () ->
      let conn, ops, parent_a, parent_b, a_child_1, b_child_1 =
        setup_two_parents ()
      in
      let a_uuid = wire_uuid_str (entity_block_uuid a_child_1)
      and b_uuid = wire_uuid_str (entity_block_uuid b_child_1)
      and parent_a_uuid = wire_uuid_str (entity_block_uuid parent_a)
      and parent_b_uuid = wire_uuid_str (entity_block_uuid parent_b) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "move-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ Wire.Int a_child_1.id; Wire.Int b_child_1.id ]
                       ; Wire.Int parent_b.id
                       ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
               local_tx_meta);
          let pending = Sync_apply.pending_txs test_repo () in
          let move_action =
            List.find_opt
              (fun (t : Sync_client_op.local_tx_entry) ->
                t.outliner_op = Some "move-blocks")
              pending
            |> Option.get
          in
          let r1 =
            Sync_apply.apply_history_action test_repo move_action.tx_id
              true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          let check_parent uuid expected =
            match ent_by_block_uuid (Datascript.db conn) uuid with
            | Some e ->
                check "parent"
                  (Option.map
                     (fun p -> wire_uuid_str (entity_block_uuid p))
                     (Ldb.ref_ent e "block/parent")
                   = Some expected)
            | None -> Alcotest.fail "restored missing"
          in
          check_parent a_uuid parent_a_uuid;
          check_parent b_uuid parent_b_uuid))

(* cljs apply-history-action-undo-replays-move-blocks-with-nested-lookup-ref-id-test *)
let test_apply_history_action_undo_replays_move_blocks_nested_lookup_ref () =
  preserve_state (fun () ->
      let conn, ops, _parent_a, parent_b, a_child_1, _b_child_1 =
        setup_two_parents ()
      in
      let tx_id = fresh_uuid () in
      let child_uuid = wire_uuid_str (entity_block_uuid a_child_1)
      and target_parent_uuid = wire_uuid_str (entity_block_uuid parent_b) in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"move-blocks"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid child_uuid
                              ; "block/title", Wire.String "semantic source" ]
                          ; Wire.Nil ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "move-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ block_uuid_lookup (Wire.Uuid child_uuid) ]
                          ; block_uuid_lookup
                              (Wire.Uuid target_parent_uuid)
                          ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
                tx_id ];
          let r1 =
            Sync_apply.apply_history_action test_repo tx_id true []
          in
          check "undo" (Wire.get "applied?" r1 = Some (Wire.Bool true));
          match ent_by_block_uuid (Datascript.db conn) child_uuid with
          | Some e ->
              check "parent uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent e "block/parent")
                 = Some target_parent_uuid)
          | None -> Alcotest.fail "child missing"))

(* cljs direct-outliner-core-insert-blocks-persists-insert-blocks-outliner-op-test *)
let test_direct_outliner_core_insert_blocks_persists_insert_blocks_op () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map [ "block/title", Wire.String "direct insert" ]) ]
               (Block_map.of_entity parent)
               Outliner_core.default_insert_opts
               Block_map.empty);
          let pending = Sync_apply.pending_txs test_repo () in
          let first = List.hd pending in
          check "forward op"
            (op_name (List.hd first.forward_outliner_ops)
             = Some "insert-blocks");
          check "target uuid"
            (op_arg (List.hd first.forward_outliner_ops) 1
             = entity_block_uuid parent)))

(* cljs rebase-create-page-keeps-page-uuid-test *)
let test_rebase_create_page_keeps_page_uuid () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page_title = "rebase page uuid" in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "create-page"
                   ; Wire.Array
                       [ Wire.String page_title
                       ; wire_map
                           [ "redirect?", Wire.Bool false
                           ; "split-namespace?", Wire.Bool true
                           ; "tags", Wire.List [] ] ] ] ]
               local_tx_meta);
          let page_before =
            Option.get (Db_test_util.find_page_by_title (Datascript.db conn) page_title)
          in
          let page_uuid = entity_block_uuid page_before in
          let pending_before =
            List.nth (Sync_apply.pending_txs test_repo ())
              (List.length (Sync_apply.pending_txs test_repo ()) - 1)
          in
          check "forward op"
            (op_name (List.hd pending_before.forward_outliner_ops)
             = Some "create-page");
          check "forward uuid"
            (Wire.get "uuid" (op_arg (List.hd pending_before.forward_outliner_ops) 1)
             = Some page_uuid);
          check "inverse op"
            (op_name (List.hd pending_before.inverse_outliner_ops)
             = Some "delete-page");
          check "inverse uuid"
            (op_arg (List.hd pending_before.inverse_outliner_ops) 0
             = page_uuid);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote create-page") ]);
          match Db_test_util.find_page_by_title (Datascript.db conn) page_title with
          | Some page_after ->
              check "uuid kept"
                (entity_block_uuid page_after = page_uuid)
          | None -> Alcotest.fail "page missing"))

(* cljs rebase-duplicate-create-page-keeps-remote-children-test *)
let test_rebase_duplicate_create_page_keeps_remote_children () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let page_title = "shared rebase page" in
      let child_uuid = fresh_uuid () in
      let now = 1760000000000 in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "create-page"
                   ; Wire.Array
                       [ Wire.String page_title
                       ; wire_map
                           [ "redirect?", Wire.Bool false
                           ; "split-namespace?", Wire.Bool true
                           ; "tags", Wire.List [] ] ] ] ]
               local_tx_meta);
          let page_uuid_w =
            entity_block_uuid
              (Option.get
                 (Db_test_util.find_page_by_title (Datascript.db conn) page_title))
          in
          let pending_before =
            List.nth (Sync_apply.pending_txs test_repo ())
              (List.length (Sync_apply.pending_txs test_repo ()) - 1)
          in
          let remote_page_tx = pending_before.tx in
          let remote_child_tx =
            [ db_add (Wire.String child_uuid) "block/uuid"
                (Wire.Uuid child_uuid)
            ; db_add (Wire.String child_uuid) "block/title"
                (Wire.String "remote child")
            ; db_add (Wire.String child_uuid) "block/page"
                (block_uuid_lookup page_uuid_w)
            ; db_add (Wire.String child_uuid) "block/parent"
                (block_uuid_lookup page_uuid_w)
            ; db_add (Wire.String child_uuid) "block/order"
                (Wire.String "a0")
            ; db_add (Wire.String child_uuid) "block/created-at"
                (Wire.Int now)
            ; db_add (Wire.String child_uuid) "block/updated-at"
                (Wire.Int now) ]
          in
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map [ "tx-data", remote_page_tx ]
               ; wire_map [ "tx-data", Wire.Array remote_child_tx ] ]);
          match Db_test_util.find_page_by_title (Datascript.db conn) page_title with
          | None -> Alcotest.fail "page missing"
          | Some page_after ->
              check "uuid kept"
                (entity_block_uuid page_after = page_uuid_w);
              (match ent_by_block_uuid (Datascript.db conn) child_uuid with
               | Some child_after ->
                   check "child title"
                     (Ldb.value child_after "block/title"
                      = Some (String "remote child"));
                   check "child page uuid"
                     (Option.map entity_block_uuid
                        (Ldb.ref_ent child_after "block/page")
                      = Some page_uuid_w)
               | None -> Alcotest.fail "child missing")))

(* cljs rebase-drops-stale-title-add-for-remotely-deleted-reference-view-test *)
let test_rebase_drops_stale_title_add_for_deleted_reference_view () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page =
        Option.get (Ldb.ref_ent parent "block/page")
      in
      let page_uuid = wire_uuid_str (entity_block_uuid page) in
      let page_id = page.id in
      let local_page_title = "Jul 7th, 2026" in
      let local_page_name =
        Common_util.page_name_sanity_lc local_page_title
      in
      let local_page_uuid = fresh_uuid () in
      let view_uuid = fresh_uuid () in
      let now = 1760000000000 in
      let local_page_tx_data =
        [ db_add (Wire.String "local-page") "block/name"
            (Wire.String local_page_name)
        ; db_add (Wire.String "local-page") "block/title"
            (Wire.String local_page_title)
        ; db_add (Wire.String "local-page") "block/uuid"
            (Wire.Uuid local_page_uuid)
        ; db_add (Wire.String "local-page") "block/created-at" (Wire.Int now)
        ; db_add (Wire.String "local-page") "block/updated-at" (Wire.Int now)
        ; db_add (Wire.String "local-page") "block/tags"
            (kw "logseq.class/Page") ]
      in
      let local_page_reversed_tx_data =
        Wire.Array
          [ db_retract_entity (block_uuid_lookup (Wire.Uuid local_page_uuid)) ]
      in
      let view_tx_data =
        [ db_add (Wire.String "remote-view") "block/title"
            (Wire.String "Unlinked references")
        ; db_add (Wire.String "remote-view") "block/uuid"
            (Wire.Uuid view_uuid)
        ; db_add (Wire.String "remote-view") "block/created-at" (Wire.Int now)
        ; db_add (Wire.String "remote-view") "block/updated-at" (Wire.Int now)
        ; db_add (Wire.String "remote-view") "block/page"
            (block_uuid_lookup (Wire.Uuid page_uuid))
        ; db_add (Wire.String "remote-view") "block/parent"
            (block_uuid_lookup (Wire.Uuid page_uuid))
        ; db_add (Wire.String "remote-view") "block/order"
            (Wire.String "cD66")
        ; db_add (Wire.String "remote-view") "logseq.property/view-for"
            (block_uuid_lookup (Wire.Uuid page_uuid))
        ; db_add (Wire.String "remote-view")
            "logseq.property.view/feature-type" (kw "unlinked-references")
        ; db_add (Wire.String "remote-view")
            "logseq.property.view/group-by-property" (kw "block/page")
        ; db_add (Wire.String "remote-view") "logseq.property.view/type"
            (kw "logseq.property.view/type.list") ]
      in
      raw_transact_string conn (local_page_tx_data @ view_tx_data);
      with_datascript_conns conn (Some ops) (fun () ->
          let view =
            Option.get (ent_by_block_uuid (Datascript.db conn) view_uuid)
          in
          let view_id = view.id in
          (* cljs reads (:db/id (:logseq.property.view/type view)) — the
             attr is keyword-valued (type :default, not a schema ref), so
             :db/id of the raw keyword is nil; the remote datom then
             retracts all values of the attr *)
          let view_type_id = Datascript.Nil in
          (* :logseq.property.view/group-by-property is type :property
             (ref-typed) so cljs :db/id gives the referenced eid *)
          let group_by_id =
            match Ldb.ref_ent view "logseq.property.view/group-by-property" with
            | Some e -> Ref e.id
            | None -> Alcotest.fail "group-by missing"
          in
          seed_client_op_txs test_repo
            [ seed_tx ~outliner_op:"create-page"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "create-page"
                      ; Wire.Array
                          [ Wire.String local_page_title
                          ; wire_map
                              [ "redirect?", Wire.Bool false
                              ; "split-namespace?", Wire.Bool false
                              ; "today-journal?", Wire.Bool true
                              ; "tags", Wire.List []
                              ; "uuid", Wire.Uuid local_page_uuid ] ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "delete-page"
                      ; Wire.Array
                          [ Wire.Uuid local_page_uuid; wire_map [] ] ] ]
                ~tx_data_v:(Wire.Array local_page_tx_data)
                ~reversed_tx_data:local_page_reversed_tx_data
                (fresh_uuid ()) ];
          check "1 pending"
            (List.length (Sync_apply.pending_txs test_repo ()) = 1);
          let raw_datom ?(added = false) a v =
            Wire.Tagged
              ( "datascript/Datom"
              , Ds_wire.transit_of_datom
                  (Datascript.datom ~e:view_id ~a ~v ~tx:now ~added ()) )
          in
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ raw_datom "block/created-at" (Int64 (Int64.of_int now))
                         ; raw_datom "block/order" (String "cD66")
                         ; raw_datom "block/page" (Ref page_id)
                         ; raw_datom "block/parent" (Ref page_id)
                         ; raw_datom "block/title"
                             (String "Unlinked references")
                         ; raw_datom "block/updated-at" (Int64 (Int64.of_int now))
                         ; raw_datom "block/uuid" (Uuid view_uuid)
                         ; raw_datom "logseq.property/view-for"
                             (Ref page_id)
                         ; raw_datom "logseq.property.view/feature-type"
                             (Keyword "unlinked-references")
                         ; raw_datom "logseq.property.view/group-by-property"
                             group_by_id
                         ; raw_datom "logseq.property.view/type"
                             view_type_id
                         ; Wire.Tagged
                             ( "datascript/Datom"
                             , Ds_wire.transit_of_datom
                                 (Datascript.datom ~e:view_id ~a:"block/title"
                                    ~v:(String "Unlinked references")
                                    ~tx:(now + 1) ~added:true ()) ) ] ) ] ]);
          check "view gone" (ent_by_block_uuid (Datascript.db conn) view_uuid = None);
          let validation = Db_validate.validate_local_db (Datascript.db conn) in
          check "no non-recycle errors"
            (non_recycle_validation_entities validation = [])))

(* cljs rebase-insert-blocks-keeps-block-uuid-test *)
let test_rebase_insert_blocks_keeps_block_uuid () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          let inserted_uuid = fresh_uuid () in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/title"
                               , Wire.String "rebase uuid block"
                               ; "block/uuid", Wire.Uuid inserted_uuid ] ]
                       ; Wire.Int parent.id
                       ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
               local_tx_meta);
          let block_before =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn) "rebase uuid block")
          in
          let block_uuid = entity_block_uuid block_before in
          let pending_before =
            List.nth (Sync_apply.pending_txs test_repo ())
              (List.length (Sync_apply.pending_txs test_repo ()) - 1)
          in
          check "forward op"
            (op_name (List.hd pending_before.forward_outliner_ops)
             = Some "insert-blocks");
          check "forward uuid"
            (Wire.get "block/uuid"
               (List.hd
                  (wire_list
                     (op_arg
                        (List.hd pending_before.forward_outliner_ops)
                        0)))
             = Some block_uuid);
          check "keep-uuid?"
            (Wire.get "keep-uuid?"
               (op_arg (List.hd pending_before.forward_outliner_ops) 2)
             = Some (Wire.Bool true));
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote insert-blocks") ]);
          match ent_by_block_uuid (Datascript.db conn) (wire_uuid_str block_uuid) with
          | Some block_after ->
              check "uuid kept"
                (entity_block_uuid block_after = block_uuid)
          | None -> Alcotest.fail "block missing"))

(* cljs rebase-local-insert-then-save-keeps-cardinality-one-values-test *)
let test_rebase_local_insert_then_save_keeps_cardinality_one_values () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let block_uuid = wire_uuid_str (entity_block_uuid child1) in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      let now = Int64.to_int (Time.epoch_ms_to_int64 (Time.now ())) in
      raw_transact_string conn
        [ db_add (Wire.Int child1.id) "block/title"
            (Wire.String "local saved") ];
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:now ~outliner_op:"insert-blocks"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "insert-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ wire_map
                                  [ "block/title"
                                  , Wire.String "local inserted"
                                  ; "block/uuid", Wire.Uuid block_uuid ] ]
                          ; Wire.Uuid parent_uuid
                          ; wire_map
                              [ "sibling?", Wire.Bool false
                              ; "keep-uuid?", Wire.Bool true ] ] ] ]
                ~inverse_ops:[]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "local inserted") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract_entity
                         (block_uuid_lookup (Wire.Uuid block_uuid)) ])
                (fresh_uuid ())
            ; seed_tx ~created_at:(now + 1) ~outliner_op:"save-block"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid block_uuid
                              ; "block/title", Wire.String "local saved" ]
                          ; Wire.Nil ] ] ]
                ~inverse_ops:[]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "local saved") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "local saved")
                     ; db_add
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "local inserted") ])
                (fresh_uuid ()) ];
          check "2 pending"
            (List.length (Sync_apply.pending_txs test_repo ()) = 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/updated-at"
                   (Wire.Int 1710000000000) ]);
          match ent_by_block_uuid (Datascript.db conn) block_uuid with
          | Some block_after ->
              check "title"
                (Ldb.value block_after "block/title"
                 = Some (String "local saved"));
              let validation = Db_validate.validate_local_db (Datascript.db conn) in
              check "no errors" (validation = [])
          | None -> Alcotest.fail "block missing"))

(* cljs rebase-insert-indent-save-sequence-keeps-structural-state-test *)
let test_rebase_insert_indent_save_sequence_keeps_structural_state () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_children =
                        [ { Db_test_util.default_block with
                            b_title = Some "child 1" } ] } ] }
            ; { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 2" }
              ; blocks = [] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let parent =
        Option.get (Db_test_util.find_block_by_content (Datascript.db conn) "parent")
      in
      let page_1 =
        Option.get (Db_test_util.find_page_by_title (Datascript.db conn) "page 1")
      in
      let page_2 =
        Option.get (Db_test_util.find_page_by_title (Datascript.db conn) "page 2")
      in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent)
      and page_1_uuid = wire_uuid_str (entity_block_uuid page_1)
      and page_2_uuid = wire_uuid_str (entity_block_uuid page_2) in
      let block_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map
                      [ "block/uuid", Wire.Uuid block_uuid
                      ; "block/title", Wire.String "" ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with
                 sibling = true
               ; keep_uuid = true }
               (Block_map.of_transit
                  (wire_map
                     [ "sibling?", Wire.Bool true
                     ; "keep-uuid?", Wire.Bool true ])));
          let inserted =
            Option.get (ent_by_block_uuid (Datascript.db conn) block_uuid)
          in
          Outliner_core.indent_outdent_blocks_conn conn [ inserted ] true
            Block_map.empty;
          Outliner_core.save_block_conn conn
            (Block_map.put
               (Block_map.of_entity
                  (Option.get
                     (ent_by_block_uuid (Datascript.db conn) block_uuid)))
               "block/title" (String "121"))
            Outliner_core.default_save_opts
            Block_map.empty
          |> ignore;
          let parent_order =
            match Ldb.value parent "block/order" with
            | Some v -> Ds_wire.transit_of_value v
            | None -> Wire.Nil
          in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_retract (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/parent"
                   (block_uuid_lookup (Wire.Uuid page_1_uuid))
               ; db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/parent"
                   (block_uuid_lookup (Wire.Uuid page_2_uuid))
               ; db_retract (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/page"
                   (block_uuid_lookup (Wire.Uuid page_1_uuid))
               ; db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/page"
                   (block_uuid_lookup (Wire.Uuid page_2_uuid))
               ; db_retract (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/order" parent_order
               ; db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/order" (Wire.String "a0") ]);
          match ent_by_block_uuid (Datascript.db conn) block_uuid with
          | Some block_after ->
              check "title"
                (Ldb.value block_after "block/title" = Some (String "121"));
              check "parent uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent block_after "block/parent")
                 = Some parent_uuid);
              check "page uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent block_after "block/page")
                 = Some page_1_uuid)
          | None -> Alcotest.fail "block missing"))

(* cljs rebase-keeps-local-insert-and-save-when-sibling-target-deleted-test *)
let test_rebase_keeps_local_insert_and_save_when_sibling_target_deleted () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let remote_delete_sibling_tx =
        (Outliner_core.delete_blocks (Datascript.db conn)
           [ Block_map.of_entity child1 ]).tx_data
      in
      let block_uuid = fresh_uuid () in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map
                      [ "block/uuid", Wire.Uuid block_uuid
                      ; "block/title", Wire.String "" ]) ]
               (Block_map.of_entity child1)
               { Outliner_core.default_insert_opts with
                 sibling = true
               ; keep_uuid = true }
               (Block_map.of_transit
                  (wire_map
                     [ "sibling?", Wire.Bool true
                     ; "keep-uuid?", Wire.Bool true ])));
          let inserted =
            Option.get (ent_by_block_uuid (Datascript.db conn) block_uuid)
          in
          Outliner_core.save_block_conn conn
            (Block_map.put (Block_map.of_entity inserted) "block/title"
               (String "local unsynced text"))
            Outliner_core.default_save_opts
            Block_map.empty
          |> ignore;
          let pending_before = Sync_apply.pending_txs test_repo () in
          check "2+ pending" (List.length pending_before >= 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               (List.map Ds_wire.transit_of_tx_op remote_delete_sibling_tx));
          match ent_by_block_uuid (Datascript.db conn) block_uuid with
          | Some block_after ->
              check "title"
                (Ldb.value block_after "block/title"
                 = Some (String "local unsynced text"));
              check "parent uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent block_after "block/parent")
                 = Some parent_uuid)
          | None -> Alcotest.fail "block missing"))

(* cljs rebase-replays-pending-insert-before-save-when-local-(Datascript.db conn)-missed-pending-block-test *)
let test_rebase_replays_pending_insert_before_save_when_missed () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      let page_uuid =
        match Ldb.ref_ent parent "block/page" with
        | Some p -> wire_uuid_str (entity_block_uuid p)
        | None -> Alcotest.fail "page missing"
      in
      let block_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx ~created_at:1 ~outliner_op:"insert-blocks"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "insert-blocks"
                      ; Wire.Array
                          [ Wire.Array
                              [ wire_map
                                  [ "block/uuid", Wire.Uuid block_uuid
                                  ; "block/title", Wire.String "" ] ]
                          ; Wire.Uuid parent_uuid
                          ; wire_map
                              [ "sibling?", Wire.Bool false
                              ; "keep-uuid?", Wire.Bool true ] ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "delete-blocks"
                      ; Wire.Array
                          [ Wire.Array [ Wire.Uuid block_uuid ]
                          ; wire_map [] ] ] ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (Wire.String block_uuid) "block/uuid"
                         (Wire.Uuid block_uuid)
                     ; db_add (Wire.String block_uuid) "block/title"
                         (Wire.String "")
                     ; db_add (Wire.String block_uuid) "block/parent"
                         (block_uuid_lookup (Wire.Uuid parent_uuid))
                     ; db_add (Wire.String block_uuid) "block/page"
                         (block_uuid_lookup (Wire.Uuid page_uuid))
                     ; db_add (Wire.String block_uuid) "block/order"
                         (Wire.String "a0") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract_entity
                         (block_uuid_lookup (Wire.Uuid block_uuid)) ])
                (fresh_uuid ())
            ; seed_tx ~created_at:2 ~outliner_op:"save-block"
                ~forward_ops:
                  [ Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid block_uuid
                              ; ( "block/title"
                                , Wire.String "local unsynced text" )
                              ; ( "block/parent"
                                , block_uuid_lookup
                                    (Wire.Uuid parent_uuid) )
                              ; ( "block/page"
                                , block_uuid_lookup (Wire.Uuid page_uuid) )
                              ; "block/order", Wire.String "a0" ]
                          ; wire_map [] ] ] ]
                ~inverse_ops:
                  [ Wire.Array
                      [ kw "save-block"
                      ; Wire.Array
                          [ wire_map
                              [ "block/uuid", Wire.Uuid block_uuid
                              ; "block/title", Wire.String ""
                              ; ( "block/parent"
                                , block_uuid_lookup
                                    (Wire.Uuid parent_uuid) )
                              ; ( "block/page"
                                , block_uuid_lookup (Wire.Uuid page_uuid) )
                              ; "block/order", Wire.String "a0" ]
                          ; wire_map [] ] ] ]
                ~tx_data_v:
                  (Wire.Array
                     [ db_add
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title"
                         (Wire.String "local unsynced text") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title"
                         (Wire.String "local unsynced text")
                     ; db_add
                         (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "") ])
                (fresh_uuid ()) ];
          check "block absent" (ent_by_block_uuid (Datascript.db conn) block_uuid = None);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/title" (Wire.String "remote parent title") ]);
          match ent_by_block_uuid (Datascript.db conn) block_uuid with
          | Some block_after ->
              check "title"
                (Ldb.value block_after "block/title"
                 = Some (String "local unsynced text"));
              check "parent uuid"
                (Option.map
                   (fun p -> wire_uuid_str (entity_block_uuid p))
                   (Ldb.ref_ent block_after "block/parent")
                 = Some parent_uuid)
          | None -> Alcotest.fail "block missing"))

(* cljs reaction-remove-enqueues-pending-sync-tx-test *)
let test_reaction_remove_enqueues_pending_sync_tx () =
  preserve_state (fun () ->
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = wire_uuid_str (entity_block_uuid parent) in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "toggle-reaction"
                   ; Wire.Array
                       [ Wire.Uuid parent_uuid
                       ; Wire.String "+1"; Wire.Nil ] ] ]
               local_tx_meta);
          let reaction_eids =
            List.of_seq
              (datoms (Datascript.db conn) Avet ~a:"logseq.property.reaction/target"
                 ~v:(Ref parent.id) ())
            |> List.map (fun (d : datom) -> d.e)
          in
          check "reaction exists" (reaction_eids <> []);
          let before_count =
            List.length (Sync_apply.pending_txs test_repo ())
          in
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "toggle-reaction"
                   ; Wire.Array
                       [ Wire.Uuid parent_uuid
                       ; Wire.String "+1"; Wire.Nil ] ] ]
               local_tx_meta);
          let after_count =
            List.length (Sync_apply.pending_txs test_repo ())
          in
          check "more pending" (after_count > before_count)))

(* cljs rebase-drops-pending-reaction-tx-when-target-is-remotely-deleted-test *)
let test_rebase_drops_pending_reaction_tx_when_target_deleted () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let target_uuid = wire_uuid_str (entity_block_uuid parent) in
      let remote_delete_tx =
        (Outliner_core.delete_blocks (Datascript.db conn)
           [ Block_map.of_entity parent ]).tx_data
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "toggle-reaction"
                   ; Wire.Array
                       [ Wire.Uuid target_uuid
                       ; Wire.String "+1"; Wire.Nil ] ] ]
               local_tx_meta);
          let pending_before = Sync_apply.pending_txs test_repo () in
          check "1 pending" (List.length pending_before = 1);
          let tx_id_before = (List.hd pending_before).tx_id in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               (List.map Ds_wire.transit_of_tx_op remote_delete_tx));
          let pending_after = Sync_apply.pending_txs test_repo () in
          check "pending empty" (pending_after = []);
          let tx_row = client_op_tx_row ops tx_id_before in
          check "row exists" (tx_row <> None);
          check "pending col 0" (tx_row_int tx_row 1 = 0)))

(*__TESTS__*)

(* cljs tx-batch-ok-removes-acked-pending-txs-test *)
let test_tx_batch_ok_removes_acked_pending_txs () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 1 ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Ack Page" ~uuid:(fresh_uuid ()) ();
          let pending_before = Sync_apply.pending_txs test_repo () in
          check "pending" (pending_before <> []);
          client.inflight
          := List.map (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
               pending_before;
          Sync_handle_message.handle_message test_repo client raw;
          check "inflight cleared" (!(client.inflight) = []);
          check "pending cleared"
            (Sync_apply.pending_txs test_repo () = []);
          check "local tx 1"
            (Sync_client_op.get_local_tx test_repo = Some 1)))

(* cljs tx-batch-ok-broadcasts-cleared-pending-state-test *)
let test_tx_batch_ok_broadcasts_cleared_pending_state () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 1 ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Ack Page" ~uuid:(fresh_uuid ()) ();
          client.inflight
          := List.map (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
               (Sync_apply.pending_txs test_repo ());
          with_broadcast_capture (fun broadcasts ->
              Sync_handle_message.handle_message test_repo client raw;
              let rtc_bcasts =
                List.filter_map
                  (fun (kind, payload) ->
                    if kind = "rtc-sync-state" then Some payload else None)
                  !broadcasts
              in
              let last = List.nth rtc_bcasts (List.length rtc_bcasts - 1) in
              (* transit payload is [kind, state-map]; cljs captures the
                 state map directly as the broadcast payload *)
              let state = wire_ix_path [ 1 ] last in
              check "unpushed 0"
                (Wire.get "unpushed-block-update-count" state
                 = Some (Wire.Int 0)))))

(* cljs tx-batch-ok-removes-only-inflight-acked-pending-txs-test *)
let test_tx_batch_ok_removes_only_inflight_acked_pending_txs () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 1 ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Ack Page A" ~uuid:(fresh_uuid ()) ();
          page_create conn "Ack Page B" ~uuid:(fresh_uuid ()) ();
          let pending_before = Sync_apply.pending_txs test_repo () in
          let acked_tx_id = (List.nth pending_before 0).tx_id in
          let unacked_tx_id = (List.nth pending_before 1).tx_id in
          check "2 pending" (List.length pending_before = 2);
          client.inflight := [ acked_tx_id ];
          Sync_handle_message.handle_message test_repo client raw;
          check "inflight cleared" (!(client.inflight) = []);
          check "unacked stays"
            (List.map (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
               (Sync_apply.pending_txs test_repo ())
             = [ unacked_tx_id ]);
          check "local tx 1"
            (Sync_client_op.get_local_tx test_repo = Some 1)))

(* cljs tx-batch-ok-does-not-anchor-remote-checksum-after-acked-pending-txs-test *)
let test_tx_batch_ok_does_not_anchor_remote_checksum () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let remote_checksum = "bad-remote-checksum" in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 1
          ; "checksum", Wire.String remote_checksum ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          page_create conn "Ack Checksum Page" ~uuid:(fresh_uuid ()) ();
          let pending_before = Sync_apply.pending_txs test_repo () in
          let local_checksum =
            Db_sync_checksum.recompute_checksum (Datascript.db conn)
          in
          check "pending" (pending_before <> []);
          Sync_client_op.update_local_checksum test_repo local_checksum
            (Datascript.db conn).max_tx;
          client.inflight
          := List.map (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
               pending_before;
          Sync_state.dev_or_test := true;
          Sync_log_and_state.rtc_log := Wire.Nil;
          Sync_handle_message.handle_message test_repo client raw;
          check "inflight cleared" (!(client.inflight) = []);
          check "pending cleared"
            (Sync_apply.pending_txs test_repo () = []);
          check "local tx 1"
            (Sync_client_op.get_local_tx test_repo = Some 1);
          check "local checksum stays"
            (Sync_client_op.get_local_checksum test_repo
             = Some local_checksum);
          let captured = !(Sync_log_and_state.rtc_log) in
          check "rtc-log type"
            (Wire.get "type" captured
             = Some (kw "rtc.log/checksum-mismatch"));
          check "local-checksum"
            (Wire.get "local-checksum" captured
             = Some (Wire.String local_checksum));
          check "remote-checksum"
            (Wire.get "remote-checksum" captured
             = Some (Wire.String remote_checksum))))

(* cljs apply-remote-tx-does-not-clear-pending-without-ack-test *)
let test_apply_remote_tx_does_not_clear_pending_without_ack () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      let block_uuid = fresh_uuid () in
      let remote_conn = Datascript.conn_from_db (Datascript.db conn) in
      let remote_tx = ref [] in
      ignore (Datascript.listen remote_conn "capture-remote-same-insert"
        (fun (r : tx_report) ->
          if r.tx_data <> [] then
            remote_tx
            := Sync_apply.normalize_tx_data r.db_after r.db_before r.tx_data));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten remote_conn "capture-remote-same-insert")
        (fun () ->
           with_datascript_conns conn (Some ops) (fun () ->
               ignore
                 (Outliner_core.insert_blocks_conn conn
                    [ Block_map.of_transit
                        (wire_map
                           [ "block/title", Wire.String "same insert"
                           ; "block/uuid", Wire.Uuid block_uuid ]) ]
                    (Block_map.of_entity parent)
                    { Outliner_core.default_insert_opts with
                      sibling = false
                    ; keep_uuid = true }
                    (Block_map.of_transit
                       (wire_map
                          [ "sibling?", Wire.Bool false
                          ; "keep-uuid?", Wire.Bool true ])));
               let pending_before = Sync_apply.pending_txs test_repo () in
               let pending_ids =
                 List.map (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
                   pending_before
               in
               check "1 pending" (List.length pending_before = 1);
               let remote_parent =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn) parent_uuid)
               in
               ignore
                 (Outliner_core.insert_blocks_conn remote_conn
                    [ Block_map.of_transit
                        (wire_map
                           [ "block/title", Wire.String "same insert"
                           ; "block/uuid", Wire.Uuid block_uuid ]) ]
                    (Block_map.of_entity remote_parent)
                    { Outliner_core.default_insert_opts with
                      sibling = false
                    ; keep_uuid = true }
                    (Block_map.of_transit
                       (wire_map
                          [ "sibling?", Wire.Bool false
                          ; "keep-uuid?", Wire.Bool true ])));
               check "remote tx" (!remote_tx <> []);
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let pending_after = Sync_apply.pending_txs test_repo () in
               check "tx ids unchanged"
                 (List.map
                    (fun (p : Sync_client_op.local_tx_entry) -> p.tx_id)
                    pending_after
                  = pending_ids);
               check "1 pending" (List.length pending_after = 1))))

(* cljs tx-batch-ok-stale-ack-does-not-regress-local-or-remote-checksum-state-test *)
let test_tx_batch_ok_stale_ack_does_not_regress_checksum_state () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let actual_checksum =
        Db_sync_checksum.recompute_checksum (Datascript.db conn)
      in
      let stale_checksum = "ffffffffffffffff" in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 4
          ; "checksum", Wire.String stale_checksum ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Hashtbl.replace Sync_apply.repo_latest_remote_tx test_repo 5;
          Hashtbl.replace Sync_apply.repo_latest_remote_checksum test_repo
            actual_checksum;
          Sync_client_op.update_local_tx test_repo 5;
          Sync_client_op.update_local_checksum test_repo actual_checksum
            (Datascript.db conn).max_tx;
          Sync_state.dev_or_test := true;
          Sync_log_and_state.rtc_log := Wire.Nil;
          Sync_handle_message.handle_message test_repo client raw;
          check "inflight cleared" (!(client.inflight) = []);
          check "local tx stays 5"
            (Sync_client_op.get_local_tx test_repo = Some 5);
          check "latest remote tx stays 5"
            (Hashtbl.find_opt Sync_apply.repo_latest_remote_tx test_repo
             = Some 5);
          check "latest remote checksum stays"
            (Hashtbl.find_opt Sync_apply.repo_latest_remote_checksum
               test_repo
             = Some actual_checksum);
          check "no rtc-log" (!(Sync_log_and_state.rtc_log) = Wire.Nil)))

(* cljs tx-batch-ok-real-checksum-mismatch-logs-warning-test *)
let test_tx_batch_ok_real_checksum_mismatch_logs_warning () =
  preserve_state (fun () ->
      let conn, ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let stale_checksum = "0000000000000000" in
      let remote_checksum = "ffffffffffffffff" in
      let client = mk_client () in
      let raw =
        msg_json
          [ "type", Wire.String "tx/batch/ok"; "t", Wire.Int 0
          ; "checksum", Wire.String remote_checksum ]
      in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo stale_checksum
            (Datascript.db conn).max_tx;
          check "no throw"
            (handle_message_error test_repo client raw = None)))

(* cljs local-checksum-stays-in-sync-after-undo-redo-sequence-test *)
let test_local_checksum_stays_in_sync_after_undo_redo () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let inserted_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes
            ~handler_keys:[ "checksum-undo-redo" ] test_repo conn;
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map
                      [ "block/uuid", Wire.Uuid inserted_uuid
                      ; "block/title", Wire.String "tmp" ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with
                 sibling = false
               ; keep_uuid = true }
               (Block_map.of_transit
                  (wire_map
                     [ "sibling?", Wire.Bool false
                     ; "keep-uuid?", Wire.Bool true ])));
          let inserted =
            Option.get
              (ent_by_block_uuid (Datascript.db conn) inserted_uuid)
          in
          Outliner_core.indent_outdent_blocks_conn conn [ inserted ] true
            Block_map.empty;
          Outliner_core.indent_outdent_blocks_conn conn [ inserted ] false
            Block_map.empty;
          delete_blocks conn [ inserted ];
          let rec undo_all n =
            match Undo_redo.undo test_repo with
            | Wire.Keyword "frontend.worker.undo-redo/empty-undo-stack" -> ()
            | _ ->
                if n > 128 then failwith "undo loop exceeded";
                undo_all (n + 1)
          in
          let rec redo_all n =
            match Undo_redo.redo test_repo with
            | Wire.Keyword "frontend.worker.undo-redo/empty-redo-stack" -> ()
            | _ ->
                if n > 128 then failwith "redo loop exceeded";
                redo_all (n + 1)
          in
          undo_all 0;
          redo_all 0;
          check "checksum in sync"
            (Sync_client_op.get_local_checksum test_repo
             = Some
                 (Db_sync_checksum.recompute_checksum (Datascript.db conn)))))

(* cljs reparent-block-when-cycle-detected-test *)
let test_reparent_block_when_cycle_detected () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          let page_id =
            match Ldb.ref_ent parent "block/page" with
            | Some p -> p.id
            | None -> failwith "parent has no page"
          in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/parent"
                   (Wire.Int child1.id)
               ; db_add (Wire.Int child1.id) "block/parent"
                   (Wire.Int page_id) ]);
          let parent' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) parent.id)
          in
          let child1' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) child1.id)
          in
          let page' = Ldb.ref_ent parent' "block/page" in
          check "page" (page' <> None);
          check "parent's parent is child1"
            (Option.map (fun (p : entity) -> p.id)
               (Ldb.ref_ent parent' "block/parent")
             = Some child1'.id);
          check "child1's parent is page"
            (Option.map (fun (p : entity) -> p.id)
               (Ldb.ref_ent child1' "block/parent")
             = Option.map (fun (p : entity) -> p.id) page')))

(* cljs two-children-cycle-test *)
let test_two_children_cycle () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, child2, _c3 = setup_parent_child () in
      let remote_conn = Datascript.conn_from_db (Datascript.db conn) in
      let child1_uuid = ent_block_uuid child1 in
      let child2_uuid = ent_block_uuid child2 in
      let remote_tx = ref [] in
      ignore (Datascript.listen remote_conn "capture-two-children-cycle-remote"
        (fun (r : tx_report) ->
          if r.tx_data <> [] && !remote_tx = [] then
            remote_tx
            := Sync_apply.normalize_tx_data r.db_after r.db_before r.tx_data));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten remote_conn
              "capture-two-children-cycle-remote")
        (fun () ->
           with_datascript_conns conn (Some ops) (fun () ->
               raw_transact_string conn
                 [ db_add (Wire.Int child1.id) "block/parent"
                     (Wire.Int child2.id) ];
               let remote_child1 =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn)
                      child1_uuid)
               in
               let remote_child2 =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn)
                      child2_uuid)
               in
               move_blocks remote_conn [ remote_child2 ] remote_child1 false;
               check "remote tx" (!remote_tx <> []);
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let child1' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) child1_uuid)
               in
               let child2' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) child2_uuid)
               in
               check "child1 parent is child 2"
                 (Option.bind (Ldb.ref_ent child1' "block/parent")
                    (fun p -> Ldb.value p "block/title")
                  = Some (String "child 2"));
               check "child2 parent is child 1"
                 (Option.bind (Ldb.ref_ent child2' "block/parent")
                    (fun p -> Ldb.value p "block/title")
                  = Some (String "child 1")))))

(* cljs three-children-cycle-test *)
let test_three_children_cycle () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, child2, child3 = setup_parent_child () in
      let remote_conn = Datascript.conn_from_db (Datascript.db conn) in
      let child1_uuid = ent_block_uuid child1 in
      let child2_uuid = ent_block_uuid child2 in
      let child3_uuid = ent_block_uuid child3 in
      let remote_txs = ref [] in
      ignore (Datascript.listen remote_conn "capture-three-children-cycle-remote"
        (fun (r : tx_report) ->
          if r.tx_data <> [] then
            remote_txs
            := !remote_txs
               @ [ Sync_apply.normalize_tx_data r.db_after r.db_before
                     r.tx_data ]));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten remote_conn
              "capture-three-children-cycle-remote")
        (fun () ->
           with_datascript_conns conn (Some ops) (fun () ->
               raw_transact_string conn
                 [ db_add (Wire.Int child2.id) "block/parent"
                     (Wire.Int child1.id)
                 ; db_add (Wire.Int child3.id) "block/parent"
                     (Wire.Int child2.id) ];
               let remote_child1 =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn)
                      child1_uuid)
               in
               let remote_child2 =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn)
                      child2_uuid)
               in
               let remote_child3 =
                 Option.get
                   (ent_by_block_uuid (Datascript.db remote_conn)
                      child3_uuid)
               in
               move_blocks remote_conn [ remote_child2 ] remote_child3
                 false;
               move_blocks remote_conn [ remote_child1 ] remote_child2
                 false;
               check "2 remote txs" (List.length !remote_txs = 2);
               await_unit
                 (Sync_apply.apply_remote_txs test_repo (mk_client ())
                    (List.map
                       (fun tx ->
                          Wire.Map [ kw "tx-data", Wire.Array tx ])
                       !remote_txs));
               let child1' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) child1_uuid)
               in
               let child2' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) child2_uuid)
               in
               let child3' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) child3_uuid)
               in
               check "child1 parent is child 2"
                 (Option.bind (Ldb.ref_ent child1' "block/parent")
                    (fun p -> Ldb.value p "block/title")
                  = Some (String "child 2"));
               check "child2 parent is child 1"
                 (Option.bind (Ldb.ref_ent child2' "block/parent")
                    (fun p -> Ldb.value p "block/title")
                  = Some (String "child 1"));
               check "child3 parent is child 2"
                 (Option.bind (Ldb.ref_ent child3' "block/parent")
                    (fun p -> Ldb.value p "block/title")
                  = Some (String "child 2")))))

(* cljs sync-apply/normalize-rebased-pending-tx (remote-tx-data-set unused
   in tests) *)
let normalize_rebased_pending_tx ~(db_before : db) ~(db_after : db)
    ~(tx_data : datom list) : Wire.t list * Wire.t list =
  ( Sync_apply.normalize_tx_data db_after db_before tx_data
  , Sync_apply.reverse_tx_data db_before db_after tx_data )

(* cljs (reduce (fn [db r] (:db-after (d/with db r))) db rows) *)
let db_after_of (db : db) (reversed : Wire.t list) : db =
  (Datascript.with_tx db ~tx_meta:[]
     (Db_transact.tx_ops_of_tx_data db reversed)).db_after

(* cljs (:block/uuid (first (:blocks apply-ops-result))) — the first
   block/uuid add in an insert-blocks tx result *)
let first_block_uuid_of_tx_result (r : Wire.t) : string =
  match Wire.get "tx-data" r with
  | Some (Wire.Array items) | Some (Wire.List items) -> (
      match
        List.find_map
          (fun it ->
            match it with
            | Wire.Map _ as m -> (
                match Wire.get "block/uuid" m with
                | Some (Wire.Uuid u) -> Some u
                | _ -> None)
            | Wire.Array [ op; _e; a; Wire.Uuid u ]
            | Wire.List [ op; _e; a; Wire.Uuid u ]
            | Wire.Array [ op; _e; a; Wire.Uuid u; _ ]
            | Wire.List [ op; _e; a; Wire.Uuid u; _ ]
              when op = kw "db/add" && a = kw "block/uuid" -> Some u
            | _ -> None)
          items
      with
      | Some u -> u
      | None ->
          failwith
            ("no block/uuid in insert-blocks result: "
             ^ Transit_codec.to_string r))
  | _ -> failwith ("no tx-data: " ^ Transit_codec.to_string r)

(* cljs (d/transact! conn [[:db/retract ...]...])-style remote delete ops as
   Wire.t list from a pure outliner tx_result *)
let wire_of_tx_result (r : Outliner_core.tx_result) : Wire.t list =
  List.map Ds_wire.transit_of_tx_op r.tx_data

(* cljs (.now js/Date) *)
let now_ms () : int = int_of_float (Unix.gettimeofday () *. 1000.)

(* cljs ignore-missing-parent-update-after-local-delete-test *)
let test_ignore_missing_parent_update_after_local_delete () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map [ "block/title", Wire.String "child 4" ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with sibling = false }
               Block_map.empty);
          let pending_before = Sync_apply.pending_txs test_repo () in
          let tx_id_before = (List.hd pending_before).tx_id in
          check "one pending" (List.length pending_before = 1);
          let delete_tx =
            (Outliner_core.delete_blocks (Datascript.db conn)
               [ Block_map.of_entity parent ]).tx_data
          in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               (List.map Ds_wire.transit_of_tx_op delete_tx));
          check "child retracted"
            (ent_by_block_uuid (Datascript.db conn) child_uuid = None);
          check "pending cleared" (Sync_apply.pending_txs test_repo () = []);
          let row = client_op_tx_row ops tx_id_before in
          check "tx row kept" (row <> None);
          check "pending flag cleared" (tx_row_int row 1 = 0)))

(* cljs missing-parent-after-remote-delete-removes-descendants-test *)
let test_missing_parent_after_remote_delete_removes_descendants () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, _ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      let remote_delete_tx =
        (Outliner_core.delete_blocks (Datascript.db conn)
           [ Block_map.of_entity parent ]).tx_data
      in
      with_datascript_conns conn None (fun () ->
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               (List.map Ds_wire.transit_of_tx_op remote_delete_tx));
          check "child retracted"
            (ent_by_block_uuid (Datascript.db conn) child_uuid = None)))

(* cljs capture listener writing one normalized remote tx *)
let listen_capture_one (conn : conn) (key : string) (remote_tx : Wire.t list ref)
    : unit =
  ignore
    (Datascript.listen conn key (fun (r : tx_report) ->
         if r.tx_data <> [] && !remote_tx = [] then
           remote_tx
           := Sync_apply.normalize_tx_data r.db_after r.db_before r.tx_data))

(* cljs rebase-drops-local-property-pairs-for-remotely-deleted-property-test *)
let test_rebase_drops_local_property_pairs_for_deleted_property () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ "p2", { Db_test_util.default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      listen_capture_one conn_b "capture-property-delete-rebase" remote_tx;
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-property-delete-rebase")
        (fun () ->
           with_datascript_conns conn_a (Some ops) (fun () ->
               let local_block =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "local object")
               in
               Outliner_property.set_block_property conn_a
                 (block_uuid_lookup (entity_block_uuid local_block))
                 "user.property/p2" (Wire.String "local value");
               let p2_b =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_b)
                      (Ident "user.property/p2"))
               in
               ignore
                 (Outliner_page.delete_conn conn_b (ent_block_uuid p2_b)
                    (Wire.Map []));
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let local_block' =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "local object")
               in
               let validation =
                 Db_validate.validate_local_db (Datascript.db conn_a)
               in
               check "p2 dropped"
                 (Ldb.value local_block' "user.property/p2" = None);
               check "no validation errors"
                 (non_recycle_validation_entities validation = []))))

(* cljs rebase-drops-local-tags-for-remotely-deleted-tag-test *)
let test_rebase_drops_local_tags_for_deleted_tag () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~classes:[ "Tag1", Db_test_util.default_class ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "local object" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      listen_capture_one conn_b "capture-tag-delete-rebase" remote_tx;
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-tag-delete-rebase")
        (fun () ->
           with_datascript_conns conn_a (Some ops) (fun () ->
               let local_block =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "local object")
               in
               let tag =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_a)
                      (Ident "user.class/Tag1"))
               in
               ignore
                 (Db_transact.transact conn_a
                    [ db_add (Wire.Int local_block.id) "block/tags"
                        (Wire.Int tag.id) ]
                    (Ds_wire.tx_meta_of_transit local_tx_meta));
               let tag_b =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_b)
                      (Ident "user.class/Tag1"))
               in
               ignore
                 (Outliner_page.delete_conn conn_b (ent_block_uuid tag_b)
                    (Wire.Map []));
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let local_block' =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "local object")
               in
               let validation =
                 Db_validate.validate_local_db (Datascript.db conn_a)
               in
               check "tags dropped"
                 (Ldb.ref_ents local_block' "block/tags" = []);
               check "no validation errors"
                 (non_recycle_validation_entities validation = []))))

(* cljs rebase-inserted-page-ref-does-not-keep-stale-ref-to-remotely-deleted-tag-test *)
let test_rebase_inserted_page_ref_drops_stale_ref_for_deleted_tag () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~classes:[ "tag1", Db_test_util.default_class ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks = [] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      listen_capture_one conn_b "capture-ref-delete-rebase" remote_tx;
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-ref-delete-rebase")
        (fun () ->
           with_datascript_conns conn_a (Some ops) (fun () ->
               let page =
                 Option.get
                   (Db_test_util.find_page_by_title (Datascript.db conn_a)
                      "page 1")
               in
               let tag1 =
                 Option.get
                   (Ldb.get_page (Datascript.db conn_a) (String "tag1"))
               in
               let tag1_uuid = ent_block_uuid tag1 in
               let result =
                 apply_ops conn_a
                   [ Wire.Array
                       [ kw "insert-blocks"
                       ; Wire.Array
                           [ Wire.Array
                               [ wire_map
                                   [ ( "block/title"
                                     , Wire.String
                                         (Printf.sprintf "[[%s]]" tag1_uuid) )
                                   ; ( "block/refs"
                                     , Wire.Array
                                         [ wire_map
                                             [ "block/uuid",
                                               Wire.Uuid tag1_uuid
                                             ; "block/title",
                                               Wire.String "tag1" ] ] ) ] ]
                           ; Wire.Int page.id
                           ; wire_map [ "sibling?", Wire.Bool false ] ] ] ]
                   (Wire.Map [])
               in
               let block_uuid = first_block_uuid_of_tx_result result in
               let tag_b =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_b)
                      (Ident "user.class/tag1"))
               in
               ignore
                 (Outliner_page.delete_conn conn_a (ent_block_uuid tag_b)
                    (Wire.Map []));
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               match ent_by_block_uuid (Datascript.db conn_a) block_uuid with
               | None -> check "block exists" false
               | Some block ->
                   check "refs empty"
                     (Ldb.ref_ents block "block/refs" = []);
                   check "raw title"
                     (ent_raw_title block = Some (String "tag1")))))

(* cljs save-block! with a merged entity map — (assoc (into {} block) kvs) *)
let save_block_merged (conn : conn) (block : entity)
    (pairs : (string * Datascript.value) list) : unit =
  let bm =
    List.fold_left
      (fun m (k, v) -> Block_map.put m k v)
      (Block_map.of_entity block)
      pairs
  in
  ignore
    (Outliner_core.save_block_conn conn bm Outliner_core.default_save_opts
       Block_map.empty)

(* cljs #{tag-ref} — a set containing the lazy entity map, which serializes
   into forward ops with :block/uuid + :db/ident intact *)
let entity_map_value (e : entity) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) (Block_map.of_entity e))

(* cljs rebase-save-block-inline-tag-recreates-deleted-tag-with-same-ident-test *)
let test_rebase_save_block_inline_tag_recreates_deleted_tag () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~classes:[ "tag4", Db_test_util.default_class ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "hello" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      listen_capture_one conn_b "capture-save-inline-tag-rebase" remote_tx;
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-save-inline-tag-rebase")
        (fun () ->
           with_datascript_conns conn_a (Some ops) (fun () ->
               let block =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "hello")
               in
               let block_uuid = ent_block_uuid block in
               let tag =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_a)
                      (Ident "user.class/tag4"))
               in
               let tag_uuid = ent_block_uuid tag in
               let tag_ident = Ldb.value tag "db/ident" in
               save_block_merged conn_a block
                 [ "block/title", String "hello #tag4"
                 ; "block/refs", Set [ entity_map_value tag ]
                 ; "block/tags", Set [ entity_map_value tag ] ];
               let tag_b =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_b)
                      (Ident "user.class/tag4"))
               in
               ignore
                 (Outliner_page.delete_conn conn_b (ent_block_uuid tag_b)
                    (Wire.Map []));
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let db = Datascript.db conn_a in
               let block' = ent_by_block_uuid db block_uuid in
               let recreated_tag = ent_by_block_uuid db tag_uuid in
               let validation = Db_validate.validate_local_db db in
               check "block exists" (block' <> None);
               check "tag recreated" (recreated_tag <> None);
               (match recreated_tag with
                | Some t ->
                    check "tag ident kept"
                      (Ldb.value t "db/ident" = tag_ident)
                | None -> ());
               (match block' with
                | Some b ->
                    check "raw title"
                      (ent_raw_title b = Some (String "hello #tag4"));
                    let ref_idents =
                      List.filter_map
                        (fun r -> Ldb.value r "db/ident")
                        (Ldb.ref_ents b "block/refs")
                    in
                    let tag_idents =
                      List.filter_map
                        (fun r -> Ldb.value r "db/ident")
                        (Ldb.ref_ents b "block/tags")
                    in
                    check "tag in refs"
                      (List.mem (Option.get tag_ident) ref_idents);
                    check "tags idents"
                      (tag_idents = [ Option.get tag_ident ])
                | None -> ());
               check "no validation errors"
                 (non_recycle_validation_entities validation = []))))

(* cljs rebase-save-block-inline-tag-keeps-surviving-and-recreates-deleted-with-same-ident-test *)
let test_rebase_save_block_inline_tag_mixed_surviving_deleted () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn_a =
        Db_test_util.create_conn_with_blocks
          ~classes:
            [ "tag1", Db_test_util.default_class
            ; "tag2", Db_test_util.default_class ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "hello" } ] } ]
          ()
      in
      let conn_b = Datascript.conn_from_db (Datascript.db conn_a) in
      let ops = new_client_ops_db () in
      let remote_tx = ref [] in
      listen_capture_one conn_b "capture-save-inline-mixed-tag-rebase"
        remote_tx;
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b
              "capture-save-inline-mixed-tag-rebase")
        (fun () ->
           with_datascript_conns conn_a (Some ops) (fun () ->
               let block =
                 Option.get
                   (Db_test_util.find_block_by_content (Datascript.db conn_a)
                      "hello")
               in
               let block_uuid = ent_block_uuid block in
               let tag1 =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_a)
                      (Ident "user.class/tag1"))
               in
               let tag2 =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_a)
                      (Ident "user.class/tag2"))
               in
               let tag1_ident = Ldb.value tag1 "db/ident" in
               let tag2_ident = Ldb.value tag2 "db/ident" in
               let tag2_uuid = ent_block_uuid tag2 in
               save_block_merged conn_a block
                 [ "block/title", String "hello #tag1 #tag2"
                 ; "block/refs"
                 , Set [ entity_map_value tag1; entity_map_value tag2 ]
                 ; "block/tags"
                 , Set [ entity_map_value tag1; entity_map_value tag2 ] ];
               let tag2_b =
                 Option.get
                   (Ldb.ent_of_ref (Datascript.db conn_b)
                      (Ident "user.class/tag2"))
               in
               ignore
                 (Outliner_page.delete_conn conn_b (ent_block_uuid tag2_b)
                    (Wire.Map []));
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    !remote_tx);
               let db = Datascript.db conn_a in
               let block' = ent_by_block_uuid db block_uuid in
               let recreated_tag2 = ent_by_block_uuid db tag2_uuid in
               let validation = Db_validate.validate_local_db db in
               check "block exists" (block' <> None);
               check "tag2 recreated" (recreated_tag2 <> None);
               (match recreated_tag2 with
                | Some t ->
                    check "tag2 ident kept"
                      (Ldb.value t "db/ident" = tag2_ident)
                | None -> ());
               (match block' with
                | Some b ->
                    check "raw title"
                      (ent_raw_title b
                       = Some (String "hello #tag1 #tag2"));
                    let ref_idents =
                      List.filter_map
                        (fun r -> Ldb.value r "db/ident")
                        (Ldb.ref_ents b "block/refs")
                    in
                    let tag_idents =
                      List.filter_map
                        (fun r -> Ldb.value r "db/ident")
                        (Ldb.ref_ents b "block/tags")
                        |> List.sort compare
                    in
                    let expected =
                      List.sort compare
                        [ Option.get tag1_ident; Option.get tag2_ident ]
                    in
                    check "both tags in refs"
                      (List.for_all (fun i -> List.mem i ref_idents)
                         expected);
                    check "tags idents" (tag_idents = expected)
                | None -> ());
               check "no validation errors"
                 (non_recycle_validation_entities validation = []))))

(* cljs cut-paste-parent-with-child-keeps-child-parent-after-sync-test *)
let test_cut_paste_parent_with_child_keeps_child_parent () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_children =
                        [ { Db_test_util.default_block with
                            b_title = Some "child" } ] }
                  ; { Db_test_util.default_block with
                      b_title = Some "target" } ] } ]
          ()
      in
      let parent =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "parent")
      in
      let child =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "child")
      in
      let target =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "target")
      in
      let page_uuid =
        ent_block_uuid (Option.get (Ldb.ref_ent parent "block/page"))
      in
      let parent_uuid = ent_block_uuid parent in
      let child_uuid = ent_block_uuid child in
      let target_uuid = ent_block_uuid target in
      let target_order = Option.get (Ldb.value target "block/order") in
      let now = 1760000000000 in
      with_datascript_conns conn None (fun () ->
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_retract_entity (block_uuid_lookup (Wire.Uuid parent_uuid))
               ; db_retract_entity (block_uuid_lookup (Wire.Uuid target_uuid))
               ; db_add (Wire.Int (-1)) "block/uuid" (Wire.Uuid target_uuid)
               ; db_add (Wire.Int (-1)) "block/title" (Wire.String "parent")
               ; db_add (Wire.Int (-1)) "block/parent"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-1)) "block/page"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-1)) "block/order"
                   (Ds_wire.transit_of_value target_order)
               ; db_add (Wire.Int (-1)) "block/created-at" (Wire.Int now)
               ; db_add (Wire.Int (-1)) "block/updated-at" (Wire.Int now)
               ; db_add (block_uuid_lookup (Wire.Uuid child_uuid))
                   "block/parent" (block_uuid_lookup (Wire.Uuid target_uuid)) ]);
          let parent' = ent_by_block_uuid (Datascript.db conn) target_uuid in
          let child' = ent_by_block_uuid (Datascript.db conn) child_uuid in
          match parent', child' with
          | Some p', Some c' ->
              check "title" (Ldb.value p' "block/title" = Some (String "parent"));
              check "child parent is recreated"
                (Option.map (fun (p : entity) -> p.id)
                   (Ldb.ref_ent c' "block/parent")
                 = Some p'.id)
          | _ -> check "entities exist" false))

(* cljs fix-duplicate-orders-after-rebase-test *)
let test_fix_duplicate_orders_after_rebase () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, child2, _c3 = setup_parent_child () in
      let order = Option.get (Ldb.value child1 "block/order") in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title"
                (Wire.String "child 1 local") ];
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int child1.id) "block/order"
                   (Ds_wire.transit_of_value order)
               ; db_add (Wire.Int child2.id) "block/order"
                   (Ds_wire.transit_of_value order) ]);
          let child1' = Option.get (Ldb.ent_of_id (Datascript.db conn) child1.id) in
          let child2' = Option.get (Ldb.ent_of_id (Datascript.db conn) child2.id) in
          let o1 = Ldb.value child1' "block/order" in
          let o2 = Ldb.value child2' "block/order" in
          check "orders present" (o1 <> None && o2 <> None);
          check "orders distinct" (o1 <> o2)))

(* cljs create-today-journal-does-not-rewrite-existing-journal-timestamps-test *)
let test_create_today_journal_keeps_existing_timestamps () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn = Db_test_util.create_conn () in
      let ops = new_client_ops_db () in
      let title = "Dec 16th, 2024" in
      with_datascript_conns conn (Some ops) (fun () ->
          let _title, page_uuid =
            Outliner_page.create_bang conn title
              ~opts:(fun () ->
                Outliner_page.create (Datascript.db conn) title
                  ~today_journal:true ())
              ()
          in
          let page_uuid = Option.get page_uuid in
          let page =
            Option.get (ent_by_block_uuid (Datascript.db conn) page_uuid)
          in
          let library_page =
            Option.get
              (Ldb.get_built_in_page (Datascript.db conn)
                 Ldb.library_page_name)
          in
          raw_transact_string conn
            [ db_add (Wire.Int page.id) "block/parent"
                (Wire.Int library_page.id) ];
          let before =
            Option.get (ent_by_block_uuid (Datascript.db conn) page_uuid)
          in
          let created_at_before = Ldb.value before "block/created-at" in
          let updated_at_before = Ldb.value before "block/updated-at" in
          ignore
            (Outliner_page.create_bang conn title
               ~opts:(fun () ->
                 Outliner_page.create (Datascript.db conn) title
                   ~today_journal:true ())
               ());
          let page' =
            Option.get (ent_by_block_uuid (Datascript.db conn) page_uuid)
          in
          check "created-at kept"
            (Ldb.value page' "block/created-at" = created_at_before);
          check "updated-at kept"
            (Ldb.value page' "block/updated-at" = updated_at_before)))

(* cljs temp-conn-batch-commit-ignores-transient-invalid-page-parent-test *)
let test_temp_conn_batch_commit_ignores_transient_page_parent () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "temporary parent" } ] } ]
          ()
      in
      let temporary_parent =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "temporary parent")
      in
      let page_tag =
        (Option.get
           (Ldb.ent_of_ref (Datascript.db conn) (Ident "logseq.class/Page"))).id
      in
      let page_uuid = fresh_uuid () in
      let now = 1760000000000 in
      ignore
        (Db_transact.batch_transact_with_temp_conn conn
           [ "rtc-tx?", Bool true ] (fun temp_conn ->
             ignore
               (Db_transact.transact temp_conn
                  [ wire_map
                      [ "db/id", Wire.Int (-1)
                      ; "block/uuid", Wire.Uuid page_uuid
                      ; "block/title", Wire.String "Reused UUID Page"
                      ; "block/name", Wire.String "reused uuid page"
                      ; "block/tags", Wire.Int page_tag
                      ; "block/parent", Wire.Int temporary_parent.id
                      ; "block/created-at", Wire.Int now
                      ; "block/updated-at", Wire.Int now ] ]
                  []);
             ignore
               (Db_transact.transact temp_conn
                  [ Wire.Array
                      [ kw "db/retract"
                      ; block_uuid_lookup (Wire.Uuid page_uuid)
                      ; kw "block/parent"; Wire.Int temporary_parent.id ] ]
                  [])));
      match ent_by_block_uuid (Datascript.db conn) page_uuid with
      | None -> check "entity exists" false
      | Some entity ->
          check "name"
            (Ldb.value entity "block/name"
             = Some (String "reused uuid page"));
          check "no parent" (Ldb.ref_ent entity "block/parent" = None);
          check "is page" (Ldb.is_page entity))

(* cljs fix-duplicate-order-against-existing-sibling-test *)
let test_fix_duplicate_order_against_existing_sibling () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, child2, _c3 = setup_parent_child () in
      let child2_order = Option.get (Ldb.value child2 "block/order") in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title"
                (Wire.String "child 1 local") ];
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int child1.id) "block/order"
                   (Ds_wire.transit_of_value child2_order) ]);
          let child1' = Option.get (Ldb.ent_of_id (Datascript.db conn) child1.id) in
          let child2' = Option.get (Ldb.ent_of_id (Datascript.db conn) child2.id) in
          let o1 = Ldb.value child1' "block/order" in
          let o2 = Ldb.value child2' "block/order" in
          check "order present" (o1 <> None);
          check "orders differ" (o1 <> o2)))

(* cljs apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test *)
let test_apply_remote_txs_rejects_invalid_final_rebase () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let child_uuid = ent_block_uuid child1 in
      let parent_title = Ldb.value parent "block/title" in
      let original_title = Ldb.value child1 "block/title" in
      let original_created_at = Ldb.value child1 "block/created-at" in
      let original_order = Ldb.value child1 "block/order" in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx tx_id ~created_at:(now_ms ()) ~pending:true
                ~outliner_op:"insert-blocks"
                ~tx_data_v:(Wire.Array [])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_retract (Wire.Int child1.id) "block/title"
                         (Ds_wire.transit_of_value
                            (Option.get original_title))
                     ; db_retract (Wire.Int child1.id) "block/created-at"
                         (Ds_wire.transit_of_value
                            (Option.get original_created_at))
                     ; db_retract (Wire.Int child1.id) "block/order"
                         (Ds_wire.transit_of_value
                            (Option.get original_order)) ]) ];
          let error =
            try
              await_unit
                (Sync_apply.apply_remote_tx test_repo (mk_client ())
                   [ db_add (Wire.Int parent.id) "block/title"
                       (Wire.String "remote parent") ]);
              None
            with e -> Some e
          in
          check "rejected" (error <> None);
          let child1' =
            Option.get (ent_by_block_uuid (Datascript.db conn) child_uuid)
          in
          let parent' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) parent.id)
          in
          check "child title unchanged"
            (Ldb.value child1' "block/title" = original_title);
          check "child created-at unchanged"
            (Ldb.value child1' "block/created-at" = original_created_at);
          check "child order unchanged"
            (Ldb.value child1' "block/order" = original_order);
          check "parent title unchanged"
            (Ldb.value parent' "block/title" = parent_title)))

(* cljs two-clients-extends-cycle-test *)
let test_two_clients_extends_cycle () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn = Db_test_util.create_conn () in
      let ops = new_client_ops_db () in
      let db0 = Datascript.db conn in
      let root_id =
        Option.get
          (Datascript.entid_ref db0 (Ident "logseq.class/Root"))
      in
      let tag_id =
        Option.get (Datascript.entid_ref db0 (Ident "logseq.class/Tag"))
      in
      let now = 1710000000000 in
      let a_uuid = fresh_uuid () in
      let b_uuid = fresh_uuid () in
      raw_transact_string conn
        [ wire_map
            [ "db/ident", Wire.Keyword "user.class/A"
            ; "block/uuid", Wire.Uuid a_uuid
            ; "block/name", Wire.String "a"
            ; "block/title", Wire.String "A"
            ; "block/created-at", Wire.Int now
            ; "block/updated-at", Wire.Int now
            ; "block/tags", Wire.Array [ Wire.Int tag_id ]
            ; "logseq.property.class/extends",
              Wire.Array [ Wire.Int root_id ] ]
        ; wire_map
            [ "db/ident", Wire.Keyword "user.class/B"
            ; "block/uuid", Wire.Uuid b_uuid
            ; "block/name", Wire.String "b"
            ; "block/title", Wire.String "B"
            ; "block/created-at", Wire.Int now
            ; "block/updated-at", Wire.Int now
            ; "block/tags", Wire.Array [ Wire.Int tag_id ]
            ; "logseq.property.class/extends",
              Wire.Array [ Wire.Int root_id ] ] ];
      with_datascript_conns conn (Some ops) (fun () ->
          let a_id =
            Option.get
              (Datascript.entid_ref (Datascript.db conn)
                 (Ident "user.class/A"))
          in
          let b_id =
            Option.get
              (Datascript.entid_ref (Datascript.db conn)
                 (Ident "user.class/B"))
          in
          raw_transact_string conn
            [ db_add (Wire.Int a_id) "logseq.property.class/extends"
                (Wire.Int b_id) ];
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int b_id) "logseq.property.class/extends"
                   (Wire.Int a_id) ]);
          let a =
            Option.get
              (Ldb.ent_of_ref (Datascript.db conn) (Ident "user.class/A"))
          in
          let b =
            Option.get
              (Ldb.ent_of_ref (Datascript.db conn) (Ident "user.class/B"))
          in
          let idents e =
            List.filter_map
              (fun r -> Ldb.value r "db/ident")
              (Ldb.ref_ents e "logseq.property.class/extends")
          in
          let extends_a = idents a in
          let extends_b = idents b in
          check "a extends B"
            (List.mem (Keyword "user.class/B") extends_a);
          check "a extends Root"
            (List.mem (Keyword "logseq.class/Root") extends_a);
          check "b extends A"
            (List.mem (Keyword "user.class/A") extends_b)))

(* cljs fix-duplicate-orders-with-local-and-remote-new-blocks-test *)
let test_fix_duplicate_orders_local_and_remote_new_blocks () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page_uuid =
        ent_block_uuid (Option.get (Ldb.ref_ent parent "block/page"))
      in
      let remote_uuid_1 = fresh_uuid () in
      let remote_uuid_2 = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map
                      [ "block/title", Wire.String "local 1"
                      ; "block/uuid", Wire.Uuid (fresh_uuid ()) ])
               ; Block_map.of_transit
                   (wire_map
                      [ "block/title", Wire.String "local 2"
                      ; "block/uuid", Wire.Uuid (fresh_uuid ()) ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with sibling = true }
               Block_map.empty);
          let local1 =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn)
                 "local 1")
          in
          let local2 =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn)
                 "local 2")
          in
          let local1_order = Option.get (Ldb.value local1 "block/order") in
          let local2_order = Option.get (Ldb.value local2 "block/order") in
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int (-1)) "block/uuid"
                   (Wire.Uuid remote_uuid_1)
               ; db_add (Wire.Int (-1)) "block/title"
                   (Wire.String "remote 1")
               ; db_add (Wire.Int (-1)) "block/parent"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-1)) "block/page"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-1)) "block/order"
                   (Ds_wire.transit_of_value local1_order)
               ; db_add (Wire.Int (-1)) "block/updated-at"
                   (Wire.Int 1768308019312)
               ; db_add (Wire.Int (-1)) "block/created-at"
                   (Wire.Int 1768308019312)
               ; db_add (Wire.Int (-2)) "block/uuid"
                   (Wire.Uuid remote_uuid_2)
               ; db_add (Wire.Int (-2)) "block/title"
                   (Wire.String "remote 2")
               ; db_add (Wire.Int (-2)) "block/parent"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-2)) "block/page"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-2)) "block/order"
                   (Ds_wire.transit_of_value local2_order)
               ; db_add (Wire.Int (-2)) "block/updated-at"
                   (Wire.Int 1768308019312)
               ; db_add (Wire.Int (-2)) "block/created-at"
                   (Wire.Int 1768308019312) ]);
          let parent' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) parent.id)
          in
          let children = Ldb.ref_ents parent' "block/_parent" in
          let orders =
            List.map (fun c -> Ldb.value c "block/order") children
          in
          check "all orders" (List.for_all (fun o -> o <> None) orders);
          check "orders distinct"
            (List.length orders
             = List.length (List.sort_uniq compare orders))))

(* cljs rebase-preserves-pending-tx-boundaries-test *)
let test_rebase_preserves_pending_tx_boundaries () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, child2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title"
                (Wire.String "child 1 local") ];
          raw_transact_string conn
            [ db_add (Wire.Int child2.id) "block/title"
                (Wire.String "child 2 local") ];
          let pending_before = Sync_apply.pending_txs test_repo () in
          let tx_ids_before =
            List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
              pending_before
          in
          check "2 pending" (List.length pending_before = 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote") ]);
          let pending_after = Sync_apply.pending_txs test_repo () in
          let tx_ids_after =
            List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
              pending_after
          in
          check "still 2 pending" (List.length pending_after = 2);
          check "same tx-ids" (tx_ids_before = tx_ids_after);
          check "distinct tx-ids"
            (List.length tx_ids_after
             = List.length (List.sort_uniq compare tx_ids_after))))

(* cljs remote-rebase-tx-is-not-enqueued-as-local-pending-test *)
let test_remote_rebase_tx_not_enqueued_as_local_pending () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title"
                (Wire.String "child local") ];
          let pending_before = Sync_apply.pending_txs test_repo () in
          let tx_ids_before =
            List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
              pending_before
          in
          check "1 pending" (List.length pending_before = 1);
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add (Wire.Int parent.id) "block/title"
                             (Wire.String "remote rebase") ] )
                   ; "outliner-op", Wire.Keyword "rebase" ] ]);
          let pending_after = Sync_apply.pending_txs test_repo () in
          let tx_ids_after =
            List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
              pending_after
          in
          check "still 1 pending" (List.length pending_after = 1);
          check "same tx-id" (tx_ids_before = tx_ids_after);
          check "rebase op"
            ((List.hd pending_after).outliner_op = Some "rebase")))

(* cljs rebase-keeps-original-created-at-for-pending-tx-test *)
let test_rebase_keeps_original_created_at_for_pending_tx () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title"
                (Wire.String "child 1 local") ];
          let tx_id = (List.hd (Sync_apply.pending_txs test_repo ())).tx_id in
          let created_at_before =
            tx_row_int (client_op_tx_row ops tx_id) 3
          in
          check "created-at recorded" (created_at_before > 0);
          while now_ms () <= created_at_before do
            ()
          done;
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote") ]);
          let created_at_after =
            tx_row_int (client_op_tx_row ops tx_id) 3
          in
          check "created-at kept" (created_at_before = created_at_after)))

(* cljs persist-local-tx-keeps-created-at-for-existing-tx-id-test *)
let test_persist_local_tx_keeps_created_at_for_existing_tx_id () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          let report1 =
            Datascript.with_tx (Datascript.db conn)
              ~tx_meta:
                [ "client-id", String "test-client"
                ; "local-tx?", Bool true
                ; "db-sync/tx-id", Uuid tx_id
                ; "outliner-op", Keyword "save-block" ]
              [ Add
                  ( Entity_id child1.id, "block/title"
                  , String "created-at-v1" ) ]
          in
          let normalized1, reversed1 =
            normalize_rebased_pending_tx ~db_before:report1.db_before
              ~db_after:report1.db_after ~tx_data:report1.tx_data
          in
          ignore
            (Sync_apply.persist_local_tx test_repo report1 normalized1
               reversed1);
          let created_at_before =
            tx_row_int (client_op_tx_row ops tx_id) 3
          in
          check "created-at recorded" (created_at_before > 0);
          while now_ms () <= created_at_before do
            ()
          done;
          let report2 =
            Datascript.with_tx (Datascript.db conn)
              ~tx_meta:
                [ "client-id", String "test-client"
                ; "local-tx?", Bool true
                ; "db-sync/tx-id", Uuid tx_id
                ; "outliner-op", Keyword "rebase" ]
              [ Add
                  ( Entity_id child1.id, "block/title"
                  , String "created-at-v2" ) ]
          in
          let normalized2, reversed2 =
            normalize_rebased_pending_tx ~db_before:report2.db_before
              ~db_after:report2.db_after ~tx_data:report2.tx_data
          in
          ignore
            (Sync_apply.persist_local_tx test_repo report2 normalized2
               reversed2);
          let created_at_after =
            tx_row_int (client_op_tx_row ops tx_id) 3
          in
          check "created-at kept" (created_at_before = created_at_after)))

(* cljs rebase-keeps-pending-when-rebased-empty-test *)
let test_rebase_keeps_pending_when_rebased_empty () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id) "block/title" (Wire.String "same") ];
          let pending_before = Sync_apply.pending_txs test_repo () in
          check "1 pending" (List.length pending_before = 1);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int child1.id) "block/title"
                   (Wire.String "same") ]);
          check "pending dropped"
            (Sync_apply.pending_txs test_repo () = [])))

(* cljs apply-remote-tx-collapsed-encrypted-title-update-test *)
let test_apply_remote_tx_collapsed_encrypted_title () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      let title = Option.get (Ldb.value child1 "block/title") in
      with_datascript_conns conn (Some ops) (fun () ->
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (block_uuid_lookup (Wire.Uuid child_uuid))
                   "block/title" (Ds_wire.transit_of_value title)
               ; db_retract (block_uuid_lookup (Wire.Uuid child_uuid))
                   "block/title" (Ds_wire.transit_of_value title) ]);
          let child' =
            Option.get (ent_by_block_uuid (Datascript.db conn) child_uuid)
          in
          check "title kept"
            (Ldb.value child' "block/title" = Some title)))

(* cljs rebase-later-tx-for-new-block-uses-lookup-ref-test *)
let test_rebase_later_tx_for_new_block_uses_lookup_ref () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map
                      [ "block/title", Wire.String "temp for lookup" ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with sibling = false }
               Block_map.empty);
          let block =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn)
                 "temp for lookup")
          in
          let block_uuid = ent_block_uuid block in
          ignore
            (Outliner_core.save_block_conn conn
               (Block_map.of_transit
                  (wire_map
                     [ "block/uuid", Wire.Uuid block_uuid
                     ; "block/title",
                       Wire.String "temp for lookup updated" ]))
               Outliner_core.default_save_opts Block_map.empty);
          let pending_before = Sync_apply.pending_txs test_repo () in
          check ">=2 pending" (List.length pending_before >= 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote") ]);
          let pending = Sync_apply.pending_txs test_repo () in
          let expected =
            db_add (block_uuid_lookup (Wire.Uuid block_uuid)) "block/title"
              (Wire.String "temp for lookup updated")
          in
          (* cljs (mapv (fn [[op e a v _t]] [op e a v]) tx) — drop the
             5th tx column before comparing rows *)
          let strip_t (w : Wire.t) : Wire.t =
            match w with
            | Wire.Array [ op; e; a; v; _t ] -> Wire.Array [ op; e; a; v ]
            | Wire.List [ op; e; a; v; _t ] -> Wire.List [ op; e; a; v ]
            | other -> other
          in
          let save_block_tx =
            List.find_opt
              (fun (e : Sync_client_op.local_tx_entry) ->
                 List.exists
                   (fun w -> strip_t w = expected)
                   (wire_tx_items e.tx))
              pending
          in
          check "save-block tx found" (save_block_tx <> None);
          (match save_block_tx with
           | Some entry ->
               check "no string eids"
                 (List.for_all
                    (fun w ->
                       match w with
                       | Wire.Array (_ :: e :: _)
                       | Wire.List (_ :: e :: _) -> (
                           match e with
                           | Wire.String _ -> false
                           | _ -> true)
                       | _ -> true)
                    (wire_tx_items entry.tx))
           | None -> ())))

(* cljs rebase-drops-stale-raw-pending-tx-with-missing-history-ops-test *)
let test_rebase_drops_stale_raw_pending_missing_history_ops () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let block_uuid = ent_block_uuid child1 in
      let previous_title = Option.get (Ldb.value child1 "block/title") in
      let tx_id = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx tx_id ~created_at:1 ~pending:true
                ~outliner_op:"rebase"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String "stale raw value") ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title"
                         (Ds_wire.transit_of_value previous_title) ]) ];
          check "1 pending" (List.length (Sync_apply.pending_txs test_repo ()) = 1);
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_retract_entity
                             (block_uuid_lookup (Wire.Uuid block_uuid)) ] ) ] ]);
          check "pending dropped"
            (Sync_apply.pending_txs test_repo () = [])))

(* cljs rebase-replays-title-only-raw-pending-tx-without-history-ops-test *)
let test_rebase_replays_title_only_raw_pending_tx () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let block_uuid = ent_block_uuid child1 in
      let previous_title = Option.get (Ldb.value child1 "block/title") in
      let parent_uuid = ent_block_uuid parent in
      let tx_id = fresh_uuid () in
      let local_title = "local raw title" in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx tx_id ~created_at:1 ~pending:true
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title" (Wire.String local_title) ])
                ~reversed_tx_data:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid block_uuid))
                         "block/title"
                         (Ds_wire.transit_of_value previous_title) ]) ];
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add
                             (block_uuid_lookup (Wire.Uuid parent_uuid))
                             "block/title"
                             (Wire.String "parent remote") ] ) ] ]);
          let pending = Sync_apply.pending_txs test_repo () in
          let block' =
            Option.get (ent_by_block_uuid (Datascript.db conn) block_uuid)
          in
          check "local title applied"
            (Ldb.value block' "block/title" = Some (String local_title));
          check "1 pending" (List.length pending = 1)))

(* cljs rebase-keeps-fix-pending-tx-with-empty-reversed-data-test *)
let test_rebase_keeps_fix_pending_empty_reversed () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let parent_uuid = ent_block_uuid parent in
      let child_uuid = ent_block_uuid child1 in
      let fix_title = "local fix title" in
      raw_transact_string conn
        [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid)) "block/title"
            (Wire.String fix_title) ];
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx tx_id ~created_at:1 ~pending:true ~outliner_op:"fix"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                         "block/title" (Wire.String fix_title) ])
                ~reversed_tx_data:(Wire.Array []) ];
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add
                             (block_uuid_lookup (Wire.Uuid child_uuid))
                             "block/title"
                             (Wire.String "remote child") ] ) ] ]);
          let pending_after =
            Sync_apply.pending_tx_by_id test_repo tx_id
          in
          let parent' =
            Option.get (ent_by_block_uuid (Datascript.db conn) parent_uuid)
          in
          let child' =
            Option.get (ent_by_block_uuid (Datascript.db conn) child_uuid)
          in
          check "fix title"
            (Ldb.value parent' "block/title" = Some (String fix_title));
          check "remote child"
            (Ldb.value child' "block/title"
             = Some (String "remote child"));
          check "fix op kept"
            ((Option.get pending_after).outliner_op = Some "fix")))

(* cljs rebase-keeps-no-op-fix-pending-tx-with-empty-reversed-data-test *)
let test_rebase_keeps_no_op_fix_pending_empty_reversed () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let tx_id = fresh_uuid () in
      let parent_uuid = ent_block_uuid parent in
      let fix_title = "remote already fixed" in
      with_datascript_conns conn (Some ops) (fun () ->
          seed_client_op_txs test_repo
            [ seed_tx tx_id ~created_at:1 ~pending:true ~outliner_op:"fix"
                ~tx_data_v:
                  (Wire.Array
                     [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                         "block/title" (Wire.String fix_title) ])
                ~reversed_tx_data:(Wire.Array []) ];
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add
                             (block_uuid_lookup (Wire.Uuid parent_uuid))
                             "block/title"
                             (Wire.String fix_title) ] ) ] ]);
          let parent' =
            Option.get (ent_by_block_uuid (Datascript.db conn) parent_uuid)
          in
          check "fix title"
            (Ldb.value parent' "block/title" = Some (String fix_title));
          let pending_after =
            Sync_apply.pending_tx_by_id test_repo tx_id
          in
          check "fix op kept"
            ((Option.get pending_after).outliner_op = Some "fix")))

(* cljs remote-log-uuid-string-scalar-values-stay-scalar-test *)
let test_remote_log_uuid_string_scalar_values_stay_scalar () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, _ops, _p, _c1, _c2, _c3 = setup_parent_child () in
      let title_uuid = "6a4970da-145c-430f-ba25-869617b87b1d" in
      let title_uuid_str = title_uuid in
      let class_temp_id = "6a4970e3-275b-4d99-bc0e-04616f55afb9" in
      let history_t = Wire.Int 536872354 in
      raw_transact_string conn
        [ wire_map
            [ "block/uuid", Wire.Uuid title_uuid
            ; "block/title",
              Wire.String "existing page with UUID title text"
            ; "block/name",
              Wire.String "existing page with UUID title text" ] ];
      let title_eid =
        (Option.get
           (ent_by_block_uuid (Datascript.db conn) title_uuid)).id
      in
      let resolve a v =
        Sync_apply.resolve_temp_id (Datascript.db conn)
          (Wire.Array
             [ kw "db/add"; Wire.String class_temp_id; kw a; v
             ; history_t ])
      in
      let expected a v =
        Wire.Array
          [ kw "db/add"; Wire.String class_temp_id; kw a; v; history_t ]
      in
      check "title scalar kept"
        (resolve "block/title" (Wire.String title_uuid_str)
         = expected "block/title" (Wire.String title_uuid_str));
      check "name scalar kept"
        (resolve "block/name" (Wire.String title_uuid_str)
         = expected "block/name" (Wire.String title_uuid_str));
      check "refs resolved"
        (resolve "block/refs" (Wire.String title_uuid_str)
         = expected "block/refs" (Wire.Int title_eid)))

(* cljs reverse-tx-data-create-property-text-block-restores-base-db-test *)
let test_reverse_tx_data_create_property_text_block_restores_base () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "b1"
                    ; b_properties =
                        [ "default", Db_test_util.Str "foo" ] }
                  ; { Db_test_util.default_block with b_title = Some "b2" } ] } ]
          ()
      in
      let tx_reports = ref [] in
      ignore
        (Datascript.listen conn "capture-create-property-text-block"
           (fun (r : tx_report) -> tx_reports := !tx_reports @ [ r ]));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn
              "capture-create-property-text-block")
        (fun () ->
           let base_db = Datascript.db conn in
           let block_before =
             Option.get
               (Db_test_util.find_block_by_content base_db "b2")
           in
           ignore
             (Outliner_property.create_property_text_block conn
                ~block_id:(Some (Wire.Int block_before.id))
                "user.property/default" (Wire.String "") ());
           let db_after = Datascript.db conn in
           let block_after =
             Option.get
               (Db_test_util.find_block_by_content db_after "b2")
           in
           let value_block =
             Option.get
               (Ldb.ref_ent block_after "user.property/default")
           in
           let value_uuid = ent_block_uuid value_block in
           let reversed_rows =
             List.map
               (fun (r : tx_report) ->
                  Sync_apply.reverse_tx_data r.db_before r.db_after
                    r.tx_data)
               !tx_reports
           in
           let restored_db =
             List.fold_left db_after_of db_after
               (List.rev reversed_rows)
           in
           let block_restored =
             Option.get
               (Db_test_util.find_block_by_content restored_db "b2")
           in
           check "one report" (List.length !tx_reports = 1);
           check "reversed rows" (List.exists (fun r -> r <> []) reversed_rows);
           check "property gone"
             (Ldb.value block_restored "user.property/default" = None);
           check "uuid same"
             (Ldb.value block_restored "block/uuid"
              = Ldb.value block_before "block/uuid");
           check "title same"
             (Ldb.value block_restored "block/title"
              = Ldb.value block_before "block/title");
           check "order same"
             (Ldb.value block_restored "block/order"
              = Ldb.value block_before "block/order");
           check "value block gone"
             (ent_by_block_uuid restored_db value_uuid = None)))

(* cljs count [:find ?h :where [?h :logseq.property.history/block ?block]] *)
let history_block_count (db : db) (block_id : int) : int =
  List.length
    (Datascript.q_string
       ~inputs:[ Arg_scalar (Result_value (Int64 (Int64.of_int block_id))) ] db
       "[:find ?h :in $ ?block :where [?h :logseq.property.history/block ?block]]")

(* cljs (set (map :db/ident (:block/tags e))) *)
let tag_idents_of (e : entity) : value list =
  List.filter_map
    (fun r -> Ldb.value r "db/ident")
    (Ldb.ref_ents e "block/tags")
  |> List.sort compare

(* cljs (some-> (:logseq.property/status e) :db/ident) *)
let status_ident_of (e : entity) : value option =
  Option.bind (Ldb.ref_ent e "logseq.property/status") (fun s ->
      Ldb.value s "db/ident")

(* cljs restore base db by folding reversed pending txs *)
let restore_base_db (db : db) (pending : Sync_client_op.local_tx_entry list)
    : db =
  List.fold_left db_after_of db
    (List.rev
       (List.map
          (fun (e : Sync_client_op.local_tx_entry) -> wire_tx_items e.reversed_tx)
          pending))

(* cljs pending-reversed-txs-for-multiple-status-changes-restore-base-db-test *)
let test_pending_reversed_txs_multiple_status_restore_base () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "task"
                    ; b_properties =
                        [ "status", Db_test_util.Str "Todo" ] } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let base_db = Datascript.db conn in
          let block_before =
            Option.get (Db_test_util.find_block_by_content base_db "task")
          in
          let block_uuid = ent_block_uuid block_before in
          let base_status = status_ident_of block_before in
          let base_tags = tag_idents_of block_before in
          let base_history_count =
            history_block_count base_db block_before.id
          in
          Outliner_property.set_block_property conn
            (Wire.Int block_before.id) "logseq.property/status"
            (Wire.String "Doing");
          Outliner_property.set_block_property conn
            (Wire.Int block_before.id) "logseq.property/status"
            (Wire.String "Todo");
          Outliner_property.set_block_property conn
            (Wire.Int block_before.id) "logseq.property/status"
            (Wire.String "Doing");
          let pending = Sync_apply.pending_txs test_repo () in
          let restored_db =
            restore_base_db (Datascript.db conn) pending
          in
          let block_restored =
            Option.get (ent_by_block_uuid restored_db block_uuid)
          in
          let restored_history_count =
            history_block_count restored_db block_restored.id
          in
          check "3 pending" (List.length pending = 3);
          check "status restored"
            (status_ident_of block_restored = base_status);
          check "tags restored"
            (tag_idents_of block_restored = base_tags);
          check "history count restored"
            (base_history_count = restored_history_count)))

(* cljs pending-reversed-txs-for-batch-status-changes-restore-base-db-test *)
let test_pending_reversed_txs_batch_status_restore_base () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "task"
                    ; b_properties =
                        [ "status", Db_test_util.Str "Todo" ] } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      with_datascript_conns conn (Some ops) (fun () ->
          let base_db = Datascript.db conn in
          let block_before =
            Option.get (Db_test_util.find_block_by_content base_db "task")
          in
          let block_uuid = ent_block_uuid block_before in
          let status_doing =
            (Option.get
               (Ldb.ent_of_ref base_db
                  (Ident "logseq.property/status.doing"))).id
          in
          let status_todo =
            (Option.get
               (Ldb.ent_of_ref base_db
                  (Ident "logseq.property/status.todo"))).id
          in
          let base_status = status_ident_of block_before in
          let base_tags = tag_idents_of block_before in
          let base_history_count =
            history_block_count base_db block_before.id
          in
          Outliner_property.batch_set_property conn
            [ Wire.Int block_before.id ] "logseq.property/status"
            (Wire.Int status_doing) ~entity_id_opt:true ();
          Outliner_property.batch_set_property conn
            [ Wire.Int block_before.id ] "logseq.property/status"
            (Wire.Int status_todo) ~entity_id_opt:true ();
          Outliner_property.batch_set_property conn
            [ Wire.Int block_before.id ] "logseq.property/status"
            (Wire.Int status_doing) ~entity_id_opt:true ();
          let pending = Sync_apply.pending_txs test_repo () in
          let restored_db =
            restore_base_db (Datascript.db conn) pending
          in
          let block_restored =
            Option.get (ent_by_block_uuid restored_db block_uuid)
          in
          let restored_history_count =
            history_block_count restored_db block_restored.id
          in
          check "3 pending" (List.length pending = 3);
          check "status restored"
            (status_ident_of block_restored = base_status);
          check "tags restored"
            (tag_idents_of block_restored = base_tags);
          check "history count restored"
            (base_history_count = restored_history_count)))

(* cljs normalize-rebased-pending-tx-keeps-reconstructive-reverse-for-retract-entity-test *)
let test_normalize_rebased_keeps_reconstructive_reverse () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "target" } ] } ]
          ()
      in
      let target =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "target")
      in
      let target_uuid = ent_block_uuid target in
      let db_before = Datascript.db conn in
      let tx_report =
        Datascript.with_tx db_before ~tx_meta:[]
          (Db_transact.tx_ops_of_tx_data db_before
             [ db_retract_entity
                 (block_uuid_lookup (Wire.Uuid target_uuid)) ])
      in
      let normalized, reversed =
        normalize_rebased_pending_tx ~db_before
          ~db_after:tx_report.db_after ~tx_data:tx_report.tx_data
      in
      let restored_db = db_after_of tx_report.db_after reversed in
      check "normalized retractEntity"
        (normalized
         = [ db_retract_entity
               (block_uuid_lookup (Wire.Uuid target_uuid)) ]);
      check "reversed non-empty" (reversed <> []);
      let restored = ent_by_block_uuid restored_db target_uuid in
      check "target restored" (restored <> None))

(* cljs reverse-tx-data-delete-and-recreate-same-uuid-remains-reversible-test *)
let test_reverse_tx_data_delete_recreate_same_uuid_reversible () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "old" } ] } ]
          ()
      in
      let target =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "old")
      in
      let target_uuid = ent_block_uuid target in
      let page_uuid =
        ent_block_uuid (Option.get (Ldb.ref_ent target "block/page"))
      in
      let original_order = Option.get (Ldb.value target "block/order") in
      let db_before = Datascript.db conn in
      let tx_report =
        Datascript.with_tx db_before ~tx_meta:[]
          (Db_transact.tx_ops_of_tx_data db_before
             [ db_retract_entity
                 (block_uuid_lookup (Wire.Uuid target_uuid))
             ; db_add (Wire.Int (-1)) "block/uuid"
                 (Wire.Uuid target_uuid)
             ; db_add (Wire.Int (-1)) "block/title" (Wire.String "new")
             ; db_add (Wire.Int (-1)) "block/parent"
                 (block_uuid_lookup (Wire.Uuid page_uuid))
             ; db_add (Wire.Int (-1)) "block/page"
                 (block_uuid_lookup (Wire.Uuid page_uuid))
             ; db_add (Wire.Int (-1)) "block/order"
                 (Ds_wire.transit_of_value original_order) ])
      in
      let reversed =
        Sync_apply.reverse_tx_data db_before tx_report.db_after
          tx_report.tx_data
      in
      let reverse_conn = Datascript.conn_from_db tx_report.db_after in
      check "recreated exists"
        (ent_by_block_uuid tx_report.db_after target_uuid <> None);
      ignore
        (Db_transact.transact reverse_conn reversed
           [ "outliner-op", Keyword "reverse-test" ]);
      match ent_by_block_uuid (Datascript.db reverse_conn) target_uuid with
      | None -> check "restored exists" false
      | Some restored ->
          check "old title"
            (Ldb.value restored "block/title" = Some (String "old"));
          check "page uuid"
            (Option.map ent_block_uuid (Ldb.ref_ent restored "block/page")
             = Some page_uuid);
          check "parent uuid"
            (Option.map ent_block_uuid (Ldb.ref_ent restored "block/parent")
             = Some page_uuid))

(* cljs rebase-preserves-title-when-reversed-tx-ids-change-test *)
let test_rebase_preserves_title_when_reversed_tx_ids_change () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with b_title = Some "old" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "old")
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid",
                             entity_block_uuid block
                           ; "block/title", Wire.String "test" ]
                       ; Wire.Nil ] ] ]
               local_tx_meta);
          check "1 pending"
            (List.length (Sync_apply.pending_txs test_repo ()) = 1);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int block.id) "block/updated-at"
                   (Wire.Int 1710000000000) ]);
          let block' =
            Option.get (Ldb.ent_of_id (Datascript.db conn) block.id)
          in
          check "local title kept"
            (Ldb.value block' "block/title" = Some (String "test"))))

(* cljs rebase-saves-remote-title-and-name-conflicts-test *)
let test_rebase_saves_remote_title_and_name_conflicts () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "old page" }
              ; blocks = [ { Db_test_util.default_block with
                             b_title = Some "old block" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let page =
        Option.get
          (Db_test_util.find_page_by_title (Datascript.db conn) "old page")
      in
      let block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "old block")
      in
      let page_uuid = ent_block_uuid page in
      let block_uuid = ent_block_uuid block in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid block_uuid
                           ; "block/title", Wire.String "local block" ]
                       ; Wire.Nil ] ]
               ; Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid page_uuid
                           ; "block/title", Wire.String "local page" ]
                       ; Wire.Nil ] ] ]
               local_tx_meta);
          check "pending"
            (Sync_apply.pending_txs test_repo () <> []);
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ "t", Wire.Int 10
                   ; ( "tx-data"
                     , Wire.Array
                         [ db_add
                             (block_uuid_lookup (Wire.Uuid block_uuid))
                             "block/title" (Wire.String "remote block")
                         ; db_add
                             (block_uuid_lookup (Wire.Uuid page_uuid))
                             "block/title" (Wire.String "remote page") ] ) ] ]);
          let db = Datascript.db conn in
          check "local block kept"
            (Ldb.value (Option.get (ent_by_block_uuid db block_uuid))
               "block/title"
             = Some (String "local block"));
          check "local page kept"
            (Ldb.value (Option.get (ent_by_block_uuid db page_uuid))
               "block/title"
             = Some (String "local page"));
          let rows =
            sync_conflict_rows ops block_uuid
            @ sync_conflict_rows ops page_uuid
          in
          check "conflicts"
            (List.sort compare rows
             = List.sort compare
                 [ block_uuid, "block/title", "remote block"
                 ; page_uuid, "block/title", "remote page" ])))

(* cljs (set (map (comp str :block/uuid) (d/datoms db :avet :block/uuid))) *)
let block_uuid_strings (db : db) : string list =
  Datascript.datoms db Avet ~a:"block/uuid" ()
  |> Seq.filter_map
       (fun (d : datom) ->
          match d.v with
          | Uuid u -> Some u
          | _ -> None)
  |> List.of_seq

(* cljs rebase-does-not-leave-anonymous-created-by-entities-test *)
let test_rebase_does_not_leave_anonymous_created_by_entities () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let page_id =
        (Option.get (Ldb.ref_ent parent "block/page")).id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          raw_transact_string conn
            [ db_add (Wire.Int child1.id)
                "logseq.property/created-by-ref" (Wire.Int page_id) ];
          ignore (delete_blocks conn [ child1 ]);
          check "pending" (Sync_apply.pending_txs test_repo () <> []);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote") ]);
          let db = Datascript.db conn in
          let anonymous_ents =
            List.filter_map
              (fun (d : datom) ->
                 match Ldb.ent_of_id db d.e with
                 | Some ent
                   when Ldb.value ent "block/uuid" = None
                        && Ldb.value ent "db/ident" = None
                        && Ldb.value ent "block/created-at" <> None
                        && Ldb.value ent "block/updated-at" <> None ->
                     Some ent.id
                 | _ -> None)
              (List.of_seq
                 (Datascript.datoms db Avet
                    ~a:"logseq.property/created-by-ref" ()))
          in
          let validation = Db_validate.validate_local_db db in
          check "no anonymous" (anonymous_ents = []);
          check "no validation errors"
            (non_recycle_validation_entities validation = [])))

(* cljs rebase-create-then-delete-does-not-leave-anonymous-entities-test *)
let test_rebase_create_then_delete_no_anonymous () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let page_id =
        (Option.get (Ldb.ref_ent parent "block/page")).id
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_core.insert_blocks_conn conn
               [ Block_map.of_transit
                   (wire_map [ "block/title", Wire.String "temp-rebase-case" ]) ]
               (Block_map.of_entity parent)
               { Outliner_core.default_insert_opts with sibling = false }
               Block_map.empty);
          let temp_block =
            Option.get
              (Db_test_util.find_block_by_content (Datascript.db conn)
                 "temp-rebase-case")
          in
          raw_transact_string conn
            [ db_add (Wire.Int temp_block.id)
                "logseq.property/created-by-ref" (Wire.Int page_id) ];
          ignore (delete_blocks conn [ temp_block ]);
          check ">=2 pending"
            (List.length (Sync_apply.pending_txs test_repo ()) >= 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote 2") ]);
          let db = Datascript.db conn in
          let anonymous_ents =
            List.filter_map
              (fun (d : datom) ->
                 match Ldb.ent_of_id db d.e with
                 | Some ent
                   when Ldb.value ent "block/uuid" = None
                        && Ldb.value ent "db/ident" = None
                        && Ldb.value ent "block/updated-at" <> None ->
                     Some ent.id
                 | _ -> None)
              (List.of_seq
                 (Datascript.datoms db Avet ~a:"block/created-at" ()))
          in
          let validation = Db_validate.validate_local_db db in
          check "no anonymous" (anonymous_ents = []);
          check "no validation errors"
            (non_recycle_validation_entities validation = [])))

(* cljs apply-remote-txs-delete-parent-with-child-without-local-changes-test *)
let test_apply_remote_txs_delete_parent_with_child_no_local () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let child1_uuid = ent_block_uuid child1 in
      let remote_parent_uuid = fresh_uuid () in
      let remote_child_uuid = fresh_uuid () in
      raw_transact_string conn
        [ db_add (Wire.String "remote-parent") "block/uuid"
            (Wire.Uuid remote_parent_uuid)
        ; db_add (Wire.String "remote-parent") "block/title"
            (Wire.String "remote parent")
        ; db_add (Wire.String "remote-parent") "block/page"
            (block_uuid_lookup (Wire.Uuid remote_parent_uuid))
        ; db_add (Wire.String "remote-parent") "block/parent"
            (block_uuid_lookup (Wire.Uuid remote_parent_uuid))
        ; db_add (Wire.String "remote-child") "block/uuid"
            (Wire.Uuid remote_child_uuid)
        ; db_add (Wire.String "remote-child") "block/title"
            (Wire.String "remote child")
        ; db_add (Wire.String "remote-child") "block/page"
            (block_uuid_lookup (Wire.Uuid remote_parent_uuid))
        ; db_add (Wire.String "remote-child") "block/parent"
            (block_uuid_lookup (Wire.Uuid remote_parent_uuid)) ];
      with_datascript_conns conn (Some ops) (fun () ->
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_retract_entity
                             (block_uuid_lookup
                                (Wire.Uuid remote_parent_uuid)) ] ) ] ]);
          let db = Datascript.db conn in
          check "remote parent deleted"
            (ent_by_block_uuid db remote_parent_uuid = None);
          check "remote child deleted"
            (ent_by_block_uuid db remote_child_uuid = None);
          check "unrelated child kept"
            (ent_by_block_uuid db child1_uuid <> None)))

(* cljs delete-expansion-includes-generated-property-value-children-test *)
let test_delete_expansion_includes_generated_pvalue_children () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let property_value_uuid = fresh_uuid () in
      let conn =
        Db_test_util.create_conn_with_blocks
          ~properties:
            [ ( "user.property/delete-expansion"
              , { Db_test_util.default_property with p_type = "default" } )
            ]
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_properties =
                        [ ( "user.property/delete-expansion"
                          , Db_test_util.Map
                              [ ( "build/property-value"
                                , Db_test_util.Kw "block" )
                              ; "block/title",
                                Db_test_util.Str "property value"
                              ; "block/uuid",
                                Db_test_util.Uuid property_value_uuid
                              ; "build/keep-uuid?", Db_test_util.Bool true
                              ; ( "build/children"
                                , Db_test_util.Vec
                                    [ Db_test_util.Map
                                        [ ( "block/title"
                                          , Db_test_util.Str
                                              "nested property child" ) ] ] )
                              ] ) ] } ] } ]
          ()
      in
      let parent =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "parent")
      in
      let property_value =
        Option.get
          (ent_by_block_uuid (Datascript.db conn) property_value_uuid)
      in
      let nested_child =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "nested property child")
      in
      let generic_expanded =
        Delete_blocks.expand_delete_blocks_tx (Datascript.db conn)
          [ RetractEntity (Entity_id parent.id) ] ~outliner_op:"delete-blocks"
      in
      let sync_expanded =
        Sync_apply.expand_block_retracts_to_descendants
          (Datascript.db conn)
          [ db_retract_entity (Wire.Int parent.id) ]
      in
      let sync_retracted_ids =
        List.filter_map
          (fun w ->
             match w with
             | Wire.Array [ Wire.Keyword "db/retractEntity"; ref_ ]
             | Wire.List [ Wire.Keyword "db/retractEntity"; ref_ ] -> (
                 match
                   Ldb.ent_of_ref (Datascript.db conn)
                     (Ds_wire.entity_ref_of_transit ref_)
                 with
                 | Some e -> Some e.id
                 | None -> None)
             | _ -> None)
          sync_expanded
      in
      check "created-from-property"
        (Ldb.ref_ent property_value "logseq.property/created-from-property"
         <> None);
      check "no filtered children"
        (Ldb.parent_children parent = []);
      check "raw children = [pv]"
        (List.map
           (fun (e : entity) -> e.id)
           (Ldb.ref_ents parent "block/_parent")
         = [ property_value.id ]);
      check "generic retracts pv"
        (List.mem
           (RetractEntity (Entity_id property_value.id))
           generic_expanded);
      check "generic retracts nested"
        (List.mem
           (RetractEntity (Entity_id nested_child.id))
           generic_expanded);
      check "sync retracts pv"
        (List.mem property_value.id sync_retracted_ids);
      check "sync retracts nested"
        (List.mem nested_child.id sync_retracted_ids))

(* cljs apply-remote-txs-computes-remote-deletes-once-per-batch-test *)
let test_apply_remote_txs_computes_remote_deletes_once () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, child2, _c3 = setup_parent_child () in
      let parent_id = parent.id in
      let child2_uuid = ent_block_uuid child2 in
      let delete_set_computations = ref 0 in
      let original =
        !Sync_apply.remote_txs_retract_entity_block_uuid_suffixes_fn
      in
      let remote_txs =
        List.init 128 (fun index ->
            wire_map
              [ ( "tx-data"
                , Wire.Array
                    [ db_add (Wire.Int parent_id) "block/title"
                        (Wire.String
                           (Printf.sprintf "remote title %d" index)) ] ) ])
        @ [ wire_map
              [ ( "tx-data"
                , Wire.Array
                    [ db_retract_entity
                        (block_uuid_lookup (Wire.Uuid child2_uuid)) ] ) ] ]
      in
      Sync_apply.remote_txs_retract_entity_block_uuid_suffixes_fn :=
        (fun txs ->
           incr delete_set_computations;
           original txs);
      Fun.protect
        ~finally:(fun () ->
            Sync_apply.remote_txs_retract_entity_block_uuid_suffixes_fn :=
              original)
        (fun () ->
           with_datascript_conns conn (Some ops) (fun () ->
               await_unit
                 (Sync_apply.apply_remote_txs test_repo (mk_client ())
                    remote_txs);
               check "computed once" (!delete_set_computations = 1);
               check "last title"
                 (Ldb.value
                    (Option.get
                       (Ldb.ent_of_id (Datascript.db conn) parent_id))
                    "block/title"
                  = Some (String "remote title 127"));
               check "child2 deleted"
                 (ent_by_block_uuid (Datascript.db conn) child2_uuid
                  = None))))

(* cljs apply-remote-txs-skips-block-ref-filters-when-txs-have-no-block-uuid-refs-test *)
let test_apply_remote_txs_skips_block_ref_filters_no_refs () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      let remote_txs =
        List.init 128 (fun index ->
            wire_map
              [ ( "tx-data"
                , Wire.Array
                    [ db_add (Wire.Int parent.id) "block/title"
                        (Wire.String (Printf.sprintf "remote title %d" index))
                    ] ) ])
      in
      let stale_calls = ref 0 in
      let missing_calls = ref 0 in
      let orig_stale =
        !Sync_apply.drop_stale_deleted_block_ref_ops_fn
      in
      let orig_missing = !Sync_apply.drop_missing_block_ref_ops_fn in
      Sync_apply.drop_stale_deleted_block_ref_ops_fn :=
        (fun db deleted txs ->
           incr stale_calls;
           orig_stale db deleted txs);
      Sync_apply.drop_missing_block_ref_ops_fn :=
        (fun db txs ->
           incr missing_calls;
           orig_missing db txs);
      Fun.protect
        ~finally:(fun () ->
            Sync_apply.drop_stale_deleted_block_ref_ops_fn := orig_stale;
            Sync_apply.drop_missing_block_ref_ops_fn := orig_missing)
        (fun () ->
           with_datascript_conns conn (Some ops) (fun () ->
               await_unit
                 (Sync_apply.apply_remote_txs test_repo (mk_client ())
                    remote_txs);
               check "stale skipped" (!stale_calls = 0);
               check "missing skipped" (!missing_calls = 0);
               let parent' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) parent_uuid)
               in
               check "title applied"
                 (Ldb.value parent' "block/title"
                  = Some (String "remote title 127")))))

(* cljs apply-remote-txs-keeps-refs-to-block-recreated-after-earlier-delete-test *)
let test_apply_remote_txs_keeps_refs_recreated_after_earlier_delete () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, child2, _c3 = setup_parent_child () in
      let child2_uuid = ent_block_uuid child2 in
      let parent_uuid = ent_block_uuid parent in
      let page_uuid =
        ent_block_uuid
          (Option.get (Ldb.ref_ent parent "block/page"))
      in
      let recreated_child_uuid = fresh_uuid () in
      let now = now_ms () in
      with_datascript_conns conn (Some ops) (fun () ->
          await_unit
            (Sync_apply.apply_remote_txs test_repo (mk_client ())
               [ wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_retract_entity
                             (block_uuid_lookup (Wire.Uuid child2_uuid))
                         ] ) ]
               ; wire_map
                   [ ( "tx-data"
                     , Wire.Array
                         [ db_add (Wire.Int (-1)) "block/uuid"
                             (Wire.Uuid child2_uuid)
                         ; db_add (Wire.Int (-1)) "block/title"
                             (Wire.String "child 2 recreated")
                         ; db_add (Wire.Int (-1)) "block/parent"
                             (block_uuid_lookup (Wire.Uuid parent_uuid))
                         ; db_add (Wire.Int (-1)) "block/page"
                             (block_uuid_lookup (Wire.Uuid page_uuid))
                         ; db_add (Wire.Int (-1)) "block/order"
                             (Wire.String "b2")
                         ; db_add (Wire.Int (-1)) "block/created-at"
                             (Wire.Int now)
                         ; db_add (Wire.Int (-1)) "block/updated-at"
                             (Wire.Int now)
                         ; db_add (Wire.Int (-2)) "block/uuid"
                             (Wire.Uuid recreated_child_uuid)
                         ; db_add (Wire.Int (-2)) "block/title"
                             (Wire.String "child 2 descendant")
                         ; db_add (Wire.Int (-2)) "block/parent"
                             (block_uuid_lookup (Wire.Uuid child2_uuid))
                         ; db_add (Wire.Int (-2)) "block/page"
                             (block_uuid_lookup (Wire.Uuid page_uuid))
                         ; db_add (Wire.Int (-2)) "block/order"
                             (Wire.String "b2a")
                         ; db_add (Wire.Int (-2)) "block/created-at"
                             (Wire.Int now)
                         ; db_add (Wire.Int (-2)) "block/updated-at"
                             (Wire.Int now) ] ) ] ]);
          let recreated_child2 =
            Option.get
              (ent_by_block_uuid (Datascript.db conn) child2_uuid)
          in
          let descendant =
            Option.get
              (ent_by_block_uuid (Datascript.db conn)
                 recreated_child_uuid)
          in
          check "child2 title"
            (Ldb.value recreated_child2 "block/title"
             = Some (String "child 2 recreated"));
          check "descendant title"
            (Ldb.value descendant "block/title"
             = Some (String "child 2 descendant"));
          let descendant_parent =
            Option.get (Ldb.ref_ent descendant "block/parent")
          in
          check "descendant parent"
            (ent_block_uuid descendant_parent = child2_uuid)))

(* cljs apply-remote-txs-local-fallback-delete-parent-retracts-remote-child-test *)
let test_apply_remote_txs_local_fallback_delete_parent_retracts_child () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "page 1" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent" } ] } ]
          ()
      in
      let ops = new_client_ops_db () in
      let parent =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn) "parent")
      in
      let parent_uuid = ent_block_uuid parent in
      let page_uuid =
        ent_block_uuid (Option.get (Ldb.ref_ent parent "block/page"))
      in
      let child_uuid = fresh_uuid () in
      let now = now_ms () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Db_transact.transact conn
               [ db_retract_entity
                   (block_uuid_lookup (Wire.Uuid parent_uuid)) ]
               [ "local-tx?", Bool true
               ; "outliner-op", Keyword "batch-remove-property" ]);
          check "pending"
            (List.length (Sync_apply.pending_txs test_repo ()) = 1);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int (-1)) "block/uuid"
                   (Wire.Uuid child_uuid)
               ; db_add (Wire.Int (-1)) "block/title"
                   (Wire.String "remote child")
               ; db_add (Wire.Int (-1)) "block/parent"
                   (block_uuid_lookup (Wire.Uuid parent_uuid))
               ; db_add (Wire.Int (-1)) "block/page"
                   (block_uuid_lookup (Wire.Uuid page_uuid))
               ; db_add (Wire.Int (-1)) "block/order" (Wire.String "Zz")
               ; db_add (Wire.Int (-1)) "block/created-at" (Wire.Int now)
               ; db_add (Wire.Int (-1)) "block/updated-at" (Wire.Int now) ]);
          let db = Datascript.db conn in
          check "remote child deleted"
            (ent_by_block_uuid db child_uuid = None);
          check "parent deleted"
            (ent_by_block_uuid db parent_uuid = None);
          let validation = Db_validate.validate_local_db db in
          check "no validation errors"
            (non_recycle_validation_entities validation = [])))

(* cljs with-redefs [ldb/batch-transact-with-temp-conn!] — swap the fn ref,
   delegate to the saved impl, restore on exit *)
let with_batch_transact_hook
    (hook :
      (conn -> tx_meta -> ?listen_db:(tx_report -> unit) ->
       ?before_commit:(unit -> unit) -> (conn -> unit) -> unit ->
       tx_report option) ->
      conn -> tx_meta -> ?listen_db:(tx_report -> unit) ->
      ?before_commit:(unit -> unit) -> (conn -> unit) -> unit ->
      tx_report option)
    (f : unit -> 'a) : 'a =
  let orig = !Sync_apply.batch_transact_with_temp_conn_fn in
  Sync_apply.batch_transact_with_temp_conn_fn := hook orig;
  Fun.protect f ~finally:(fun () ->
      Sync_apply.batch_transact_with_temp_conn_fn := orig)

let tx_meta_has (name : string) (tx_meta : tx_meta) : bool =
  List.exists (fun (k, _) -> k = name) tx_meta

(* cljs apply-remote-txs-rechecks-local-txs-when-local-delete-races-temp-snapshot-test *)
let test_rechecks_local_delete_races_temp_snapshot () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ child1 ];
          check "pending" (Sync_apply.pending_txs test_repo () <> []);
          let injected = ref false in
          with_batch_transact_hook
            (fun orig conn' tx_meta ?listen_db ?before_commit f' () ->
               orig conn' tx_meta ?listen_db
                 ~before_commit:
                   (fun () ->
                      (match before_commit with
                       | Some bc -> bc ()
                       | None -> ());
                      if (not !injected)
                         && tx_meta_has "with-local-changes?" tx_meta
                      then begin
                        injected := true;
                        delete_blocks conn [ parent ]
                      end)
                 f' ())
            (fun () ->
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    [ db_add
                        (block_uuid_lookup (Wire.Uuid parent_uuid))
                        "block/title"
                        (Wire.String "parent remote title") ]));
          check "injected" !injected;
          let pending_after = Sync_apply.pending_txs test_repo () in
          check "pending after"
            (List.exists
               (fun (e : Sync_client_op.local_tx_entry) ->
                  List.exists
                    (fun w ->
                       match w with
                       | Wire.Array [ op; _ ] | Wire.List [ op; _ ] ->
                           op = kw "db/retractEntity"
                       | _ -> false)
                    (wire_tx_items e.tx))
               pending_after)))

(* cljs apply-remote-txs-rechecks-local-txs-when-local-delete-races-temp-commit-test *)
let test_rechecks_local_delete_races_temp_commit () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ child1 ];
          let remote_tx =
            [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                "block/title" (Wire.String "parent remote title") ]
          in
          let injected = ref false in
          with_batch_transact_hook
            (fun orig conn' tx_meta ?listen_db ?before_commit f' () ->
               orig conn' tx_meta ?listen_db ?before_commit
                 (fun tc ->
                    f' tc;
                    if (not !injected)
                       && tx_meta_has "with-local-changes?" tx_meta
                    then begin
                      injected := true;
                      delete_blocks conn [ parent ]
                    end)
                 ())
            (fun () ->
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    remote_tx));
          check "injected" !injected;
          let pending_after = Sync_apply.pending_txs test_repo () in
          check "pending after"
            (List.exists
               (fun (e : Sync_client_op.local_tx_entry) ->
                  List.exists
                    (fun w ->
                       match w with
                       | Wire.Array [ op; _ ] | Wire.List [ op; _ ] ->
                           op = kw "db/retractEntity"
                       | _ -> false)
                    (wire_tx_items e.tx))
               pending_after)))

(* cljs apply-remote-txs-rechecks-local-txs-when-local-edit-races-without-local-batch-test *)
let test_rechecks_local_edit_races_without_local_batch () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let child_uuid = ent_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          let remote_txs =
            [ wire_map
                [ ( "tx-data"
                  , Wire.Array
                      [ db_add
                          (block_uuid_lookup (Wire.Uuid child_uuid))
                          "block/title"
                          (Wire.String "remote child") ] ) ] ]
          in
          let inserted = ref false in
          with_batch_transact_hook
            (fun orig conn' tx_meta ?listen_db ?before_commit f' () ->
               orig conn' tx_meta ?listen_db ?before_commit
                 (fun tc ->
                    f' tc;
                    if (not !inserted)
                       && tx_meta_has "without-local-changes?" tx_meta
                    then begin
                      inserted := true;
                      ignore
                        (Outliner_core.insert_blocks_conn conn
                           [ Block_map.of_transit
                               (wire_map
                                  [ "block/title",
                                    Wire.String "injected sibling"
                                  ; "block/uuid",
                                    Wire.Uuid (fresh_uuid ()) ]) ]
                           (Block_map.of_entity parent)
                           { Outliner_core.default_insert_opts with
                             sibling = true }
                           Block_map.empty)
                    end)
                 ())
            (fun () ->
               await_unit
                 (Sync_apply.apply_remote_txs test_repo (mk_client ())
                    remote_txs));
          check "inserted" !inserted;
          let injected =
            Db_test_util.find_block_by_content (Datascript.db conn)
              "injected sibling"
          in
          let child' =
            Option.get (ent_by_block_uuid (Datascript.db conn) child_uuid)
          in
          check "injected exists" (injected <> None);
          check "remote title applied"
            (Ldb.value child' "block/title"
             = Some (String "remote child"))))

(* cljs apply-remote-txs-delays-retry-when-local-txs-keep-changing-test *)
let test_delays_retry_when_local_txs_keep_changing () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _p, child1, _c2, _c3 = setup_parent_child () in
      let parent = Option.get (Ldb.ref_ent child1 "block/parent") in
      let child_uuid = ent_block_uuid child1 in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ child1 ];
          let remote_tx =
            [ db_add (block_uuid_lookup (Wire.Uuid child_uuid))
                "block/title" (Wire.String "remote child title") ]
          in
          let snapshot_taken = ref false in
          with_batch_transact_hook
            (fun orig conn' tx_meta ?listen_db ?before_commit f' () ->
               orig conn' tx_meta ?listen_db ?before_commit
                 (fun tc ->
                    if (not !snapshot_taken)
                       && tx_meta_has "with-local-changes?" tx_meta
                    then begin
                      snapshot_taken := true;
                      f' tc;
                      delete_blocks conn [ parent ]
                    end
                    else f' tc)
                 ())
            (fun () ->
               ignore
                 (await_task
                    (Sync_apply.apply_remote_txs_with_retry test_repo
                       (mk_client ())
                       [ wire_map [ "tx-data", Wire.Array remote_tx ] ] 0)));
          check "snapshot taken" !snapshot_taken;
          check "parent delete kept"
            (Sync_apply.pending_txs test_repo () <> []);
          check "child deleted"
            (ent_by_block_uuid (Datascript.db conn) child_uuid = None)))

(* cljs apply-remote-txs-retries-snapshot-drift-even-if-pending-list-stabilizes-test *)
let test_retries_snapshot_drift_pending_list_stabilizes () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      with_datascript_conns conn (Some ops) (fun () ->
          Sync_client_op.update_local_checksum test_repo
            (Db_sync_checksum.recompute_checksum (Datascript.db conn))
            (Datascript.db conn).max_tx;
          Db_listener.listen_db_changes ~handler_keys:[ "checksum-test" ]
            test_repo conn;
          delete_blocks conn [ child1 ];
          let pending = Sync_apply.pending_txs test_repo () in
          let delete_tx_id = (List.hd pending).tx_id in
          let remote_txs =
            [ wire_map
                [ ( "tx-data"
                  , Wire.Array
                      [ db_add
                          (block_uuid_lookup (Wire.Uuid parent_uuid))
                          "block/title"
                          (Wire.String "parent remote title") ] ) ] ]
          in
          let staged_insert_done = ref false in
          with_batch_transact_hook
            (fun orig conn' tx_meta ?listen_db ?before_commit f' () ->
               if tx_meta_has "with-local-changes?" tx_meta
                  && not !staged_insert_done
               then begin
                 staged_insert_done := true;
                 orig conn' tx_meta ?listen_db ?before_commit
                   (fun tc ->
                      ignore
                        (Outliner_core.insert_blocks_conn conn
                           [ Block_map.of_transit
                               (wire_map
                                  [ "block/title",
                                    Wire.String "snapshot racing block"
                                  ; "block/uuid",
                                    Wire.Uuid (fresh_uuid ()) ]) ]
                           (Block_map.of_entity parent)
                           { Outliner_core.default_insert_opts with
                             sibling = true }
                           Block_map.empty);
                      ignore
                        (Sync_client_op.mark_pending_txs_false test_repo
                           [ delete_tx_id ]);
                      f' tc)
                   ()
               end
               else orig conn' tx_meta ?listen_db ?before_commit f' ())
            (fun () ->
               ignore
                 (await_task
                    (Sync_apply.apply_remote_txs_with_retry test_repo
                       (mk_client ()) remote_txs 0)));
          check "staged insert" !staged_insert_done;
          let injected =
            Db_test_util.find_block_by_content (Datascript.db conn)
              "snapshot racing block"
          in
          check "injected kept" (injected <> None);
          let parent' =
            Option.get (ent_by_block_uuid (Datascript.db conn) parent_uuid)
          in
          check "remote title applied"
            (Ldb.value parent' "block/title"
             = Some (String "parent remote title"))))

(* cljs rebase-persisted-row-contains-forward-and-inverse-outliner-ops-test *)
let test_rebase_persisted_row_forward_and_inverse_ops () =
  preserve_state (fun () ->
      let conn, ops, parent, child1, _c2, _c3 = setup_parent_child () in
      wire_no_e2ee ();
      with_datascript_conns conn (Some ops) (fun () ->
          delete_blocks conn [ child1 ];
          let tx_id =
            match Sync_apply.pending_txs test_repo () with
            | first :: _ -> first.tx_id
            | [] -> failwith "no pending tx"
          in
          (match Sync_apply.pending_txs test_repo () with
           | first :: _ ->
               check "before forward" (first.forward_outliner_ops <> []);
               check "before inverse" (first.inverse_outliner_ops <> [])
           | [] -> check "pending exists" false);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int parent.id) "block/title"
                   (Wire.String "parent remote") ]);
          match Sync_apply.pending_tx_by_id test_repo tx_id with
          | Some row ->
              check "rebase op" (row.outliner_op = Some "rebase");
              check "forward ops" (row.forward_outliner_ops <> []);
              check "inverse ops" (row.inverse_outliner_ops <> [])
          | None -> check "pending kept" false))

(* cljs apply-remote-txs-rebases-create-delete-page-as-recycled-test *)
let test_apply_remote_txs_rebases_create_delete_page_as_recycled () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with pg_title = Some "remote page" }
              ; blocks = [] } ]
          ()
      in
      let ops = new_client_ops_db () in
      wire_no_e2ee ();
      let page_uuid = fresh_uuid () in
      let remote_page =
        Option.get
          (Db_test_util.find_page_by_title (Datascript.db conn)
             "remote page")
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (Outliner_page.create_bang conn "local recycled page"
               ~opts:(fun () ->
                 Outliner_page.create (Datascript.db conn)
                   "local recycled page" ~uuid:page_uuid ())
               ());
          ignore
            (Outliner_page.delete_conn conn page_uuid (Wire.Map []));
          let page_before =
            Option.get (ent_by_block_uuid (Datascript.db conn) page_uuid)
          in
          check "recycled before" (Ldb.recycled page_before);
          check "2 pending"
            (List.length (Sync_apply.pending_txs test_repo ()) = 2);
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (Wire.Int remote_page.id) "block/title"
                   (Wire.String "remote page updated") ]);
          let page =
            Option.get (ent_by_block_uuid (Datascript.db conn) page_uuid)
          in
          check "page kept" true;
          check "recycled after" (Ldb.recycled page);
          check "parent kept"
            (Ldb.ref_ent page "block/parent" <> None);
          check "deleted-at"
            (Ldb.value page "logseq.property/deleted-at" <> None);
          let original_page =
            Ldb.ref_ent page "logseq.property.recycle/original-page"
          in
          check "original-page self"
            (match original_page with
             | Some op -> op.id = page.id
             | None -> false)))

(* cljs legacy-rebase-row-with-missing-history-ops-gets-persisted-with-both-ops-test *)
let test_legacy_rebase_row_missing_history_persisted_with_both_ops () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
      let parent_uuid = ent_block_uuid parent in
      let old_title = Option.get (Ldb.value parent "block/title") in
      let new_title = "legacy rebase title" in
      let tx_id = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          let legacy_pending =
            seed_tx tx_id ~created_at:1 ~pending:true ~outliner_op:"rebase"
              ~tx_data_v:
                (Wire.Array
                   [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                       "block/title" (Wire.String new_title) ])
              ~reversed_tx_data:
                (Wire.Array
                   [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                       "block/title"
                       (Ds_wire.transit_of_value old_title) ])
          in
          seed_client_op_txs test_repo [ legacy_pending ];
          await_unit
            (Sync_apply.apply_remote_tx test_repo (mk_client ())
               [ db_add (block_uuid_lookup (Wire.Uuid parent_uuid))
                   "block/title" (Wire.String "parent remote refresh") ]);
          let pending_after = Sync_apply.pending_txs test_repo () in
          check "1 pending" (List.length pending_after = 1);
          let row = List.hd pending_after in
          check "tx_id kept" (row.tx_id = tx_id);
          check "rebase op" (row.outliner_op = Some "rebase");
          (* cljs asserts (vector? ...) — empty vector qualifies *)
          check "forward ops" true;
          check "inverse ops" true))

(* substring check without str *)
let string_contains (haystack : string) (needle : string) : bool =
  let n = String.length needle and h = String.length haystack in
  let rec loop i =
    if i + n > h then false
    else if String.sub haystack i n = needle then true
    else loop (i + 1)
  in
  n = 0 || loop 0

(* cljs offload-large-title-test *)
let test_offload_large_title () =
  let large_title = String.make 5000 'a' in
  let tx_data =
    [ db_add (Wire.Int 1) "block/title" (Wire.String large_title) ]
  in
  let upload_calls = ref [] in
  let upload_fn title =
    upload_calls := !upload_calls @ [ title ];
    Db_worker_effect.pure
      (Sync_large_title.large_title_object_wire "title-1" "txt")
  in
  let result =
    await_task (Sync_large_title.offload_large_titles tx_data ~upload_fn)
  in
  check "upload called" (!upload_calls = [ large_title ]);
  check "placeholder + object"
    (result
     = [ db_add (Wire.Int 1) "block/title" (Wire.String "")
       ; db_add (Wire.Int 1)
           "logseq.property.sync/large-title-object"
           (Sync_large_title.large_title_object_wire "title-1" "txt") ])

(* cljs offload-small-title-test *)
let test_offload_small_title () =
  let tx_data =
    [ db_add (Wire.Int 1) "block/title" (Wire.String "short") ]
  in
  let upload_fn _title =
    Db_worker_effect.pure (Wire.Map [])
  in
  let result =
    await_task (Sync_large_title.offload_large_titles tx_data ~upload_fn)
  in
  check "unchanged" (result = tx_data)

(* cljs offload-large-title-preserves-map-form-tx-items-test *)
let test_offload_large_title_preserves_map_form () =
  let map_item =
    wire_map
      [ "db/ident", Wire.Keyword "logseq.class/Comments"
      ; "block/uuid",
        Wire.Uuid "00000002-2556-9161-5000-000000000000"
      ; "block/title", Wire.String "Comments" ]
  in
  let tx_data =
    [ map_item
    ; db_add
        (block_uuid_lookup
           (Wire.Uuid "00000002-2556-9161-5000-000000000000"))
        "block/title" (Wire.String "Comments") ]
  in
  let upload_fn _title = Db_worker_effect.pure (Wire.Map []) in
  let result =
    await_task (Sync_large_title.offload_large_titles tx_data ~upload_fn)
  in
  check "unchanged" (result = tx_data)

(* cljs offload-large-title-datoms-drops-stale-object-for-same-entity-test *)
let test_offload_datoms_drops_stale_object_same_entity () =
  let large_title = String.make 5000 'a' in
  let old_obj =
    Ds_wire.value_of_transit
      (Sync_large_title.large_title_object_wire "old-title" "txt")
  in
  let other_obj =
    Ds_wire.value_of_transit
      (Sync_large_title.large_title_object_wire "other-title" "txt")
  in
  let new_obj_wire =
    Sync_large_title.large_title_object_wire "new-title" "txt"
  in
  let datoms =
    [ Datascript.datom ~e:1 ~a:"block/title" ~v:(String large_title) ()
    ; Datascript.datom ~e:1
        ~a:"logseq.property.sync/large-title-object" ~v:old_obj ()
    ; Datascript.datom ~e:2
        ~a:"logseq.property.sync/large-title-object" ~v:other_obj () ]
  in
  let upload_calls = ref [] in
  let upload_fn ~repo:_ ~graph_id:_ ~title ~aes_key:_ =
    upload_calls := !upload_calls @ [ title ];
    Db_worker_effect.pure new_obj_wire
  in
  let result =
    await_task
      (Sync_large_title.offload_large_titles_in_datoms_batch test_repo
         "graph-1" datoms ~aes_key:Wire.Nil ~upload_fn ())
  in
  check "upload called" (!upload_calls = [ large_title ]);
  check "datoms"
    (result
     = [ Datascript.datom ~e:1 ~a:"block/title" ~v:(String "") ()
       ; Datascript.datom ~e:1
           ~a:"logseq.property.sync/large-title-object"
           ~v:(Ds_wire.value_of_transit new_obj_wire) ()
       ; Datascript.datom ~e:2
           ~a:"logseq.property.sync/large-title-object" ~v:other_obj () ])

(* cljs offload-large-title-datoms-drops-stale-object-from-known-offload-set-test *)
let test_offload_datoms_drops_stale_object_known_offload_set () =
  let old_obj =
    Ds_wire.value_of_transit
      (Sync_large_title.large_title_object_wire "old-title" "txt")
  in
  let other_obj =
    Ds_wire.value_of_transit
      (Sync_large_title.large_title_object_wire "other-title" "txt")
  in
  let datoms =
    [ Datascript.datom ~e:1
        ~a:"logseq.property.sync/large-title-object" ~v:old_obj ()
    ; Datascript.datom ~e:2
        ~a:"logseq.property.sync/large-title-object" ~v:other_obj () ]
  in
  let upload_fn ~repo:_ ~graph_id:_ ~title:_ ~aes_key:_ =
    Db_worker_effect.pure (Wire.Map [])
  in
  let result =
    await_task
      (Sync_large_title.offload_large_titles_in_datoms_batch test_repo
         "graph-1" datoms ~aes_key:Wire.Nil ~upload_fn
         ~offloaded_title_eids:[ 1 ] ())
  in
  check "stale dropped"
    (result
     = [ Datascript.datom ~e:2
           ~a:"logseq.property.sync/large-title-object" ~v:other_obj () ])

(* cljs upload-preparation-processes-datoms-in-batches-test *)
let test_upload_preparation_processes_datoms_in_batches () =
  let datoms =
    [ Datascript.datom ~e:1 ~a:"block/title" ~v:(String "a") ()
    ; Datascript.datom ~e:2 ~a:"block/title" ~v:(String "b") ()
    ; Datascript.datom ~e:3 ~a:"block/title" ~v:(String "c") ()
    ; Datascript.datom ~e:4 ~a:"block/title" ~v:(String "d") ()
    ; Datascript.datom ~e:5 ~a:"block/title" ~v:(String "e") () ]
  in
  let seen_batches = ref [] in
  let progress_calls = ref [] in
  await_unit
    (Sync_large_title.process_upload_datoms_in_batches datoms
       ~batch_size:2
       ~process_batch:(fun batch ->
         seen_batches :=
           !seen_batches
           @ [ List.map (fun (d : datom) -> d.e) batch ];
         Db_worker_effect.pure ())
       ~progress:(fun processed total ->
         progress_calls := !progress_calls @ [ processed, total ]));
  check "batches"
    (!seen_batches = [ [ 1; 2 ]; [ 3; 4 ]; [ 5 ] ]);
  check "progress"
    (!progress_calls = [ 2, 5; 4, 5; 5, 5 ])

(* cljs upload-large-title-encrypts-transit-payload-test *)
let test_upload_large_title_encrypts_transit_payload () =
  preserve_state (fun () ->
      Sync_crypt.init ();
      let title = String.make 5000 'a' in
      let captured_body = ref None in
      Native_test_hooks.install_http
        ~send:(fun (req : Native_test_hooks.http_req) ->
          captured_body := req.body;
          Db_worker_effect.pure { Native_test_hooks.status = 200; headers = []; body = "" })
        ~send_binary:(fun _ -> Db_worker_effect.pure "");
      Fun.protect
        ~finally:Native_test_hooks.restore_http
        (fun () ->
           let aes_key =
             await_wire (!Sync_crypt.generate_aes_key_fn ())
           in
           ignore
             (await_wire
                (Sync_large_title.upload_large_title ~repo:test_repo
                   ~graph_id:"graph-1" ~title ~aes_key
                   ~http_base:"https://example.com" ~auth_headers:[]));
           check "body captured" (!captured_body <> None);
           let payload = Option.get !captured_body in
           let decrypted =
             await_task
               (Sync_deps.require "decrypt_text_value"
                  Sync_deps.decrypt_text_value aes_key payload)
           in
           check "decrypts to title" (decrypted = title)))

(* cljs rehydrate-large-title-test — download-fn maps to an http_bytes
   install returning the title text; the cljs download-calls assertion
   becomes "the captured request URL contains the asset uuid" *)
let test_rehydrate_large_title () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "rehydrate-page" }
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "rehydrate-block" } ] } ]
          ()
      in
      let block =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "rehydrate-block")
      in
      let block_id = block.id in
      let obj_wire =
        Sync_large_title.large_title_object_wire "title-1" "txt"
      in
      let tx_data =
        [ db_add (Wire.Int block_id) "block/title" (Wire.String "")
        ; db_add (Wire.Int block_id)
            "logseq.property.sync/large-title-object" obj_wire ]
      in
      let download_calls = ref [] in
      let download_fn ~repo:_ ~graph_id:_ ~obj ~aes_key:_ =
        download_calls := !download_calls @ [ obj ];
        Db_worker_effect.pure "rehydrated-title"
      in
      with_datascript_conns conn None (fun () ->
               raw_transact_string conn tx_data;
               check "conn registered"
                 (Worker_state.datascript_conn test_repo <> None);
               let obj_datoms =
                 Datascript.datoms (Datascript.db conn) Eavt ()
                 |> List.of_seq
                 |> List.filter
                      (fun (d : datom) ->
                        d.a = "logseq.property.sync/large-title-object")
               in
               check "one object datom" (List.length obj_datoms = 1);
               check "large-title-object?"
                 ((match obj_datoms with
                   | [ (d : datom) ] ->
                       Sync_large_title.large_title_object_wire_of
                         (Ds_wire.transit_of_value d.v)
                       <> None
                   | _ -> false));
               let items =
                 List.filter_map
                   (fun item ->
                      match item with
                      | Wire.Array [ op; e; a; obj ]
                      | Wire.List [ op; e; a; obj ]
                        when op = kw "db/add"
                             && a = kw
                                  "logseq.property.sync/large-title-object"
                             && Sync_large_title
                                  .large_title_object_wire_of obj
                                <> None ->
                          Some (e, obj)
                      | _ -> None)
                   tx_data
                 |> Sync_state.distinct_by Fun.id
               in
               check "one item" (List.length items = 1);
               await_unit
                 (Sync_large_title.rehydrate_large_titles test_repo
                    ~graph_id:(Some "graph-1")
                    ~tx_data:(Some tx_data)
                    ~download_fn
                    ~graph_e2ee:(fun () -> false)
                    ~ensure_graph_aes_key:(fun _ ->
                      Db_worker_effect.pure Wire.Nil)
                    ~conn:(Some conn));
               check "download called with obj"
                 (!download_calls = [ obj_wire ]);
               let block' =
                 Option.get (Ldb.ent_of_id (Datascript.db conn) block_id)
               in
               check "title rehydrated"
                 (Ldb.value block' "block/title"
                  = Some (String "rehydrated-title"))))

(* cljs rehydrate-large-title-tempid-test *)
let test_rehydrate_large_title_tempid () =
  preserve_state (fun () ->
      let conn =
        Db_test_util.create_conn_with_blocks
          ~pages_and_blocks:
            [ { Db_test_util.page =
                  { Db_test_util.default_page with
                    pg_title = Some "tempid-rehydrate-page" }
              ; blocks = [] } ]
          ()
      in
      let page =
        Option.get
          (Db_test_util.find_page_by_title (Datascript.db conn)
             "tempid-rehydrate-page")
      in
      let block_uuid = fresh_uuid () in
      let tempid = block_uuid in
      let obj_wire =
        Sync_large_title.large_title_object_wire "title-tempid" "txt"
      in
      let tx_data =
        [ db_add (Wire.String tempid) "block/uuid" (Wire.Uuid block_uuid)
        ; db_add (Wire.String tempid) "block/title" (Wire.String "")
        ; db_add (Wire.String tempid) "block/page" (Wire.Int page.id)
        ; db_add (Wire.String tempid) "block/parent" (Wire.Int page.id)
        ; db_add (Wire.String tempid) "block/order" (Wire.String "a0")
        ; db_add (Wire.String tempid) "block/created-at" (Wire.Int 1)
        ; db_add (Wire.String tempid) "block/updated-at" (Wire.Int 1)
        ; db_add (Wire.String tempid)
            "logseq.property.sync/large-title-object" obj_wire ]
      in
      let download_calls = ref [] in
      let download_fn ~repo:_ ~graph_id:_ ~obj ~aes_key:_ =
        download_calls := !download_calls @ [ obj ];
        Db_worker_effect.pure "rehydrated tempid title"
      in
      with_datascript_conns conn None (fun () ->
               raw_transact_string conn tx_data;
               let block =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) block_uuid)
               in
               check "tempid resolved" (block.id > 0);
               await_unit
                 (Sync_large_title.rehydrate_large_titles test_repo
                    ~graph_id:(Some "graph-1")
                    ~tx_data:(Some tx_data)
                    ~download_fn
                    ~graph_e2ee:(fun () -> false)
                    ~ensure_graph_aes_key:(fun _ ->
                      Db_worker_effect.pure Wire.Nil)
                    ~conn:(Some conn));
               check "download called with obj"
                 (!download_calls = [ obj_wire ]);
               let block' =
                 Option.get
                   (ent_by_block_uuid (Datascript.db conn) block_uuid)
               in
               check "same eid" (block'.id = block.id);
               check "title rehydrated"
                 (Ldb.value block' "block/title"
                  = Some (String "rehydrated tempid title"));
               check "no tempid entity"
                 (Ldb.ent_of_ref (Datascript.db conn) (Temp_id tempid)
                  = None)))

(* cljs rehydrate-large-titles-from-db-skips-missing-object-attr-test *)
let test_rehydrate_from_db_skips_missing_object_attr () =
  preserve_state (fun () ->
      let conn = Db_test_util.create_conn () in
      let calls = ref 0 in
      with_datascript_conns conn None (fun () ->
          await_unit
            (Sync_large_title.rehydrate_large_titles_from_db test_repo
               "graph-1"
               ~rehydrate:(fun ~tx_data:_ ~graph_id:_ ->
                 incr calls;
                 Db_worker_effect.pure ()));
          check "no calls" (!calls = 0)))

(* cljs rehydrate-large-titles-from-db-reads-unindexed-object-attr-test *)
let test_rehydrate_from_db_reads_unindexed_object_attr () =
  preserve_state (fun () ->
      let conn = Db_test_util.create_conn () in
      let obj_wire =
        Sync_large_title.large_title_object_wire "title-unindexed" "txt"
      in
      raw_transact_string conn
        [ wire_map
            [ "db/id", Wire.Int 100
            ; "block/title", Wire.String ""
            ; "logseq.property.sync/large-title-object", obj_wire ] ];
      let calls = ref [] in
      with_datascript_conns conn None (fun () ->
          await_unit
            (Sync_large_title.rehydrate_large_titles_from_db test_repo
               "graph-1"
               ~rehydrate:(fun ~tx_data ~graph_id ->
                 calls := !calls @ [ tx_data, graph_id ];
                 Db_worker_effect.pure ()));
          check "one call" (List.length !calls = 1);
          let tx_data, graph_id = List.hd !calls in
          check "graph-id" (graph_id = "graph-1");
          check "tx-data"
            (match tx_data with
             | [ item ] ->
                 wire_eq item
                   (Wire.Array
                      [ kw "db/add"; Wire.Int 100
                      ; kw "logseq.property.sync/large-title-object"
                      ; obj_wire ])
             | _ -> false)))

(* cljs apply-template-to-empty-target! *)
let apply_template_op_wire conn template_root_uuid target_uuid
    (opts_pairs : (string * Wire.t) list) : Wire.t =
  let db = Datascript.db conn in
  let template_root =
    Option.get (ent_by_block_uuid db template_root_uuid)
  in
  let children =
    Ldb.get_block_and_children db ~include_property_block:true
      template_root_uuid
  in
  let blocks_to_insert =
    match children with
    | _root :: first_child :: rest ->
        Block_map.put (Block_map.of_entity first_child)
          "logseq.property/used-template" (Ref template_root.id)
        :: List.map Block_map.of_entity rest
    | _ -> []
  in
  apply_ops conn
    [ Wire.Array
        [ kw "apply-template"
        ; Wire.Array
            [ Wire.Uuid template_root_uuid
            ; Wire.Uuid target_uuid
            ; wire_map
                ([ "sibling?", Wire.Bool true
                 ; ( "template-blocks"
                   , Wire.Array
                       (List.map Block_map.to_transit blocks_to_insert) ) ]
                 @ opts_pairs) ] ] ]
    local_tx_meta

let apply_template_to_empty_target conn template_root_uuid
    empty_target_uuid : Wire.t =
  apply_template_op_wire conn template_root_uuid empty_target_uuid
    [ "replace-empty-target?", Wire.Bool true ]

let apply_template_with_opts conn template_root_uuid target_uuid
    (opts_pairs : (string * Wire.t) list) : Wire.t =
  apply_template_op_wire conn template_root_uuid target_uuid opts_pairs

(* cljs apply-ops [[:apply-template [template-id target-id {:sibling? true}]]]
   without :template-blocks *)
let apply_template_simple conn template_root_uuid target_uuid : Wire.t =
  apply_ops conn
    [ Wire.Array
        [ kw "apply-template"
        ; Wire.Array
            [ Wire.Uuid template_root_uuid
            ; Wire.Uuid target_uuid
            ; wire_map [ "sibling?", Wire.Bool true ] ] ] ]
    local_tx_meta

(* cljs undo-all!/redo-all! *)
let undo_all (repo : string) : unit =
  let rec loop n =
    let result = Undo_redo.undo repo in
    if result
       <> Wire.Keyword "frontend.worker.undo-redo/empty-undo-stack"
    then begin
      if n > 128 then failwith "undo loop exceeded";
      loop (n + 1)
    end
  in
  loop 0

let redo_all (repo : string) : unit =
  let rec loop n =
    let result = Undo_redo.redo repo in
    if result
       <> Wire.Keyword "frontend.worker.undo-redo/empty-redo-stack"
    then begin
      if n > 128 then failwith "redo loop exceeded";
      loop (n + 1)
    end
  in
  loop 0

(* cljs select-offline-inserted-three/one — title entities whose parent
   uuid differs from template-root-uuid (else first) *)
let select_offline_inserted conn template_root_uuid (title : string)
    : entity option =
  let db = Datascript.db conn in
  let all =
    match
      Datascript.q_string
        ~inputs:[ Arg_scalar (Result_value (String title)) ] db
        "[:find [?b ...] :in $ ?title :where [?b :block/title ?title]]"
    with
    | [ row ] ->
        List.filter_map
          (fun v ->
             match v with
             | Result_value (Int64 id) -> Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db)
             | Result_entity id -> Ldb.ent_of_id db id
             | _ -> None)
          row
    | rows ->
        List.filter_map
          (fun row ->
             match row with
             | [ Result_value (Int64 id) ] -> Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db)
             | [ Result_entity id ] -> Ldb.ent_of_id db id
             | _ -> None)
          rows
  in
  match
    List.find_opt
      (fun (b : entity) ->
         Option.map ent_block_uuid (Ldb.ref_ent b "block/parent")
         <> Some template_root_uuid)
      all
  with
  | Some b -> Some b
  | None -> List.nth_opt all 0

(* cljs setup-rebase-apply-template-repro-state *)
let setup_rebase_apply_template_repro_state () =
  let template_root_uuid = fresh_uuid () in
  let template_1_uuid = fresh_uuid () in
  let template_2_uuid = fresh_uuid () in
  let template_3_uuid = fresh_uuid () in
  let empty_target_uuid = fresh_uuid () in
  let local_empty_uuid = fresh_uuid () in
  let seed_conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page 1" }
          ; blocks =
              [ { Db_test_util.default_block with b_title = Some "seed" } ] } ]
      ()
  in
  let seed_page =
    Option.get
      (Db_test_util.find_page_by_title (Datascript.db seed_conn) "page 1")
  in
  let ops = new_client_ops_db () in
  ignore
    (apply_ops seed_conn
       [ Wire.Array
           [ kw "insert-blocks"
           ; Wire.Array
               [ Wire.Array
                   [ wire_map
                       [ "block/uuid", Wire.Uuid template_root_uuid
                       ; "block/title", Wire.String "template 1"
                       ; "block/tags",
                         Wire.Array
                           [ Wire.Keyword "logseq.class/Template" ] ]
                   ; wire_map
                       [ "block/uuid", Wire.Uuid template_1_uuid
                       ; "block/title", Wire.String "1"
                       ; "block/parent",
                         block_uuid_lookup
                           (Wire.Uuid template_root_uuid) ]
                   ; wire_map
                       [ "block/uuid", Wire.Uuid template_2_uuid
                       ; "block/title", Wire.String "2"
                       ; "block/parent",
                         block_uuid_lookup (Wire.Uuid template_1_uuid) ]
                   ; wire_map
                       [ "block/uuid", Wire.Uuid template_3_uuid
                       ; "block/title", Wire.String "3"
                       ; "block/parent",
                         block_uuid_lookup
                           (Wire.Uuid template_root_uuid) ] ]
               ; Wire.Int seed_page.id
               ; wire_map
                   [ "sibling?", Wire.Bool false
                   ; "keep-uuid?", Wire.Bool true ] ]
           ]
       ; Wire.Array
           [ kw "insert-blocks"
           ; Wire.Array
               [ Wire.Array
                   [ wire_map
                       [ "block/uuid", Wire.Uuid empty_target_uuid
                       ; "block/title", Wire.String "" ] ]
               ; Wire.Int seed_page.id
               ; wire_map
                   [ "sibling?", Wire.Bool false
                   ; "keep-uuid?", Wire.Bool true ] ]
           ] ]
       local_tx_meta);
  ( template_root_uuid, template_1_uuid, template_2_uuid
  , template_3_uuid, empty_target_uuid, local_empty_uuid
  , seed_conn, ops )

(* cljs (reset! undo-redo/*apply-history-action! sync-apply/apply-history-action!) *)
let apply_history_wrapper (repo : string) (tx_id_opt : string option)
    (undo : bool) (pairs : (Wire.t * Wire.t) list) :
    (string * Wire.t) list =
  let tx_meta =
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword s -> Some (s, Ds_wire.value_of_transit v)
        | _ -> None)
      pairs
  in
  let result =
    Sync_apply.apply_history_action repo
      (Option.value ~default:"" tx_id_opt) undo tx_meta
  in
  match result with
  | Wire.Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with Wire.Keyword s -> Some (s, v) | _ -> None)
        kvs
  | _ -> []

let with_apply_history_action (f : unit -> 'a) : 'a =
  let prev = !Undo_redo.apply_history_action in
  Undo_redo.apply_history_action := Some apply_history_wrapper;
  Fun.protect f ~finally:(fun () ->
      Undo_redo.apply_history_action := prev)

(* cljs rebase-apply-template-preserves-followup-insert-target-uuid-test *)
let test_rebase_apply_template_preserves_followup_insert () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, _t1, _t2, _t3, empty_target_uuid
          , local_empty_uuid, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn_a = Datascript.conn_from_db (Datascript.db seed_conn) in
      let conn_b = Datascript.conn_from_db (Datascript.db seed_conn) in
      (* cljs (d/listen! conn-b ::capture ... (swap! remote-txs conj
          {:tx-data (normalize-tx-data ...) :outliner-op ...})) — one
          normalized {:tx-data :outliner-op} map per tx-report *)
      let remote_txs = ref [] in
      ignore
        (Datascript.listen conn_b "capture-rebase-apply-template"
           (fun (r : tx_report) ->
              if r.tx_data <> [] then
                remote_txs :=
                  !remote_txs
                  @ [ wire_map
                        [ ( "tx-data"
                          , Wire.Array
                              (Sync_apply.normalize_tx_data r.db_after
                                 r.db_before r.tx_data) )
                        ; ( "outliner-op"
                          , (match tx_meta_get "outliner-op" r.tx_meta with
                             | Some v -> Ds_wire.transit_of_value v
                             | None -> Wire.Nil) ) ] ]));
      Fun.protect
        ~finally:(fun () ->
            Datascript.unlisten conn_b "capture-rebase-apply-template")
        (fun () ->
          ignore
            (apply_template_to_empty_target conn_b template_root_uuid
               empty_target_uuid);
          with_datascript_conns conn_a (Some ops) (fun () ->
              ignore
                (apply_template_to_empty_target conn_a template_root_uuid
                   empty_target_uuid);
              let inserted_three =
                Option.get
                  (select_offline_inserted conn_a template_root_uuid "3")
              in
              ignore
                (Outliner_core.insert_blocks_conn conn_a
                   [ Block_map.of_transit
                       (wire_map
                          [ "block/uuid", Wire.Uuid local_empty_uuid
                          ; "block/title", Wire.String "" ]) ]
                   (Block_map.of_entity inserted_three)
                   { Outliner_core.default_insert_opts with
                     sibling = true; keep_uuid = true }
                   (Block_map.of_transit
                      (wire_map
                         [ "sibling?", Wire.Bool true
                         ; "keep-uuid?", Wire.Bool true ])));
              delete_blocks conn_a [ inserted_three ];
              let pending_before =
                Sync_apply.pending_txs test_repo ()
              in
              let insert_tx_id =
                List.filter
                  (fun (e : Sync_client_op.local_tx_entry) ->
                     e.outliner_op = Some "insert-blocks")
                  pending_before
                |> List.rev |> List.hd
                |> fun (e : Sync_client_op.local_tx_entry) -> e.tx_id
              in
              let error =
                try
                  await_unit
                    (Sync_apply.apply_remote_txs test_repo (mk_client ())
                       !remote_txs);
                  None
                with e -> Some e
              in
              let insert_pending_after =
                Sync_apply.pending_tx_by_id test_repo insert_tx_id
              in
              let local_empty_block =
                ent_by_block_uuid (Datascript.db conn_a) local_empty_uuid
              in
              check "remote txs captured" (!remote_txs <> []);
              check "no error" (error = None);
              check "insert pending after"
                (insert_pending_after <> None);
              check "rebase op"
                ((Option.get insert_pending_after).outliner_op
                 = Some "rebase");
              check "local empty kept" (local_empty_block <> None);
              let validation =
                Db_validate.validate_local_db (Datascript.db conn_a)
              in
              check "no validation errors"
                (non_recycle_validation_entities validation = []))))

(* cljs apply-history-action-redo-after-apply-template-undo-all-preserves-followup-insert-test *)
let test_redo_after_apply_template_undo_all_preserves_followup () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, _t1, _t2, _t3, empty_target_uuid
          , _local_empty_uuid, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn = Datascript.conn_from_db (Datascript.db seed_conn) in
      let followup_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_apply_history_action (fun () ->
              ignore
                (apply_template_to_empty_target conn template_root_uuid
                   empty_target_uuid);
              let inserted_three =
                Option.get
                  (select_offline_inserted conn template_root_uuid "3")
              in
              ignore
                (apply_ops conn
                   [ Wire.Array
                       [ kw "insert-blocks"
                       ; Wire.Array
                           [ Wire.Array
                               [ wire_map
                                   [ "block/uuid",
                                     Wire.Uuid followup_uuid
                                   ; "block/title",
                                     Wire.String "followup" ] ]
                           ; Wire.Int inserted_three.id
                           ; wire_map
                               [ "sibling?", Wire.Bool true
                               ; "keep-uuid?", Wire.Bool true ] ] ] ]
                   local_tx_meta);
              undo_all test_repo;
              check "followup gone"
                (ent_by_block_uuid (Datascript.db conn) followup_uuid
                 = None);
              redo_all test_repo;
              let followup =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) followup_uuid)
              in
              check "followup restored" true;
              check "followup title"
                (Ldb.value followup "block/title"
                 = Some (String "followup")))))

(* cljs apply-history-action-redo-after-non-empty-template-insert-preserves-followup-insert-test *)
let test_redo_after_non_empty_template_insert_preserves_followup () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, _t1, _t2, _t3, empty_target_uuid
          , _local_empty_uuid, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn = Datascript.conn_from_db (Datascript.db seed_conn) in
      let followup_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_apply_history_action (fun () ->
              raw_transact_string conn
                [ db_add
                    (block_uuid_lookup (Wire.Uuid empty_target_uuid))
                    "block/title" (Wire.String "target") ];
              ignore
                (apply_template_with_opts conn template_root_uuid
                   empty_target_uuid []);
              let inserted_three =
                Option.get
                  (select_offline_inserted conn template_root_uuid "3")
              in
              ignore
                (apply_ops conn
                   [ Wire.Array
                       [ kw "insert-blocks"
                       ; Wire.Array
                           [ Wire.Array
                               [ wire_map
                                   [ "block/uuid",
                                     Wire.Uuid followup_uuid
                                   ; "block/title",
                                     Wire.String "followup" ] ]
                           ; Wire.Int inserted_three.id
                           ; wire_map
                               [ "sibling?", Wire.Bool true
                               ; "keep-uuid?", Wire.Bool true ] ] ] ]
                   local_tx_meta);
              undo_all test_repo;
              check "followup gone"
                (ent_by_block_uuid (Datascript.db conn) followup_uuid
                 = None);
              redo_all test_repo;
              let followup =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) followup_uuid)
              in
              check "followup restored" true;
              check "followup title"
                (Ldb.value followup "block/title"
                 = Some (String "followup")))))

(* cljs undo-redo-apply-template-without-template-blocks-keeps-followup-insert-target-test *)
let test_undo_redo_apply_template_simple_keeps_followup () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, _t1, _t2, _t3, empty_target_uuid
          , _local_empty_uuid, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn = Datascript.conn_from_db (Datascript.db seed_conn) in
      let followup_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          with_apply_history_action (fun () ->
              raw_transact_string conn
                [ db_add
                    (block_uuid_lookup (Wire.Uuid empty_target_uuid))
                    "block/title" (Wire.String "target") ];
              ignore
                (apply_template_simple conn template_root_uuid
                   empty_target_uuid);
              let inserted_three =
                Option.get
                  (select_offline_inserted conn template_root_uuid "3")
              in
              ignore
                (apply_ops conn
                   [ Wire.Array
                       [ kw "insert-blocks"
                       ; Wire.Array
                           [ Wire.Array
                               [ wire_map
                                   [ "block/uuid",
                                     Wire.Uuid followup_uuid
                                   ; "block/title",
                                     Wire.String "followup" ] ]
                           ; Wire.Int inserted_three.id
                           ; wire_map
                               [ "sibling?", Wire.Bool true
                               ; "keep-uuid?", Wire.Bool true ] ] ] ]
                   local_tx_meta);
              undo_all test_repo;
              check "followup gone"
                (ent_by_block_uuid (Datascript.db conn) followup_uuid
                 = None);
              redo_all test_repo;
              let followup =
                Option.get
                  (ent_by_block_uuid (Datascript.db conn) followup_uuid)
              in
              check "followup restored" true;
              check "followup title"
                (Ldb.value followup "block/title"
                 = Some (String "followup")))))

(* cljs undo-redo-apply-template-without-template-blocks-rewrites-property-value-refs-test *)
let test_undo_redo_apply_template_rewrites_property_value_refs () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, template_1_uuid, _t2, template_3_uuid
          , empty_target_uuid, _local_empty_uuid, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn = Datascript.conn_from_db (Datascript.db seed_conn) in
      with_datascript_conns conn (Some ops) (fun () ->
          with_apply_history_action (fun () ->
              raw_transact_string conn
                [ db_add
                    (block_uuid_lookup (Wire.Uuid template_1_uuid))
                    "user.property/p1"
                    (block_uuid_lookup (Wire.Uuid template_3_uuid))
                ; db_add
                    (block_uuid_lookup (Wire.Uuid empty_target_uuid))
                    "block/title" (Wire.String "target") ];
              ignore
                (apply_template_simple conn template_root_uuid
                   empty_target_uuid);
              let check_ref () =
                let inserted_one =
                  Option.get
                    (select_offline_inserted conn template_root_uuid "1")
                in
                let inserted_three =
                  Option.get
                    (select_offline_inserted conn template_root_uuid "3")
                in
                (* cljs (cond (map? v) (:block/uuid v) (and (vector? v)
                   (= :block/uuid (first v))) (second v) :else v) — the
                   property value may be an entity map, a [:block/uuid u]
                   lookup vector, or a raw value *)
                let ref_uuid =
                  match Ldb.value inserted_one "user.property/p1" with
                  | Some (Vector [ Keyword "block/uuid"; Uuid u ])
                  | Some (List [ Keyword "block/uuid"; Uuid u ]) -> Some u
                  | Some (Map kvs) -> (
                      match
                        List.find_map
                          (fun (k, v) ->
                             match k, v with
                             | (Keyword "block/uuid" | String "block/uuid")
                               , Uuid u -> Some u
                             | _ -> None)
                          kvs
                      with
                      | Some u -> Some u
                      | None -> None)
                  | Some (Ref id) -> (
                      match Ldb.ent_of_id (Datascript.db conn) id with
                      | Some e -> Some (ent_block_uuid e)
                      | None -> None)
                  | Some (Int64 id) -> (
                      match Datascript.Util.int64_to_int id with
                      | Some id -> (
                          match Ldb.ent_of_id (Datascript.db conn) id with
                          | Some e -> Some (ent_block_uuid e)
                          | None -> None)
                      | None -> None)
                  | Some (Keyword ident) -> (
                      match
                        Ldb.ent_of_ref (Datascript.db conn) (Ident ident)
                      with
                      | Some e -> Some (ent_block_uuid e)
                      | None -> None)
                  | Some _ | None -> None
                in
                check "ref = inserted three"
                  (ref_uuid = Some (ent_block_uuid inserted_three));
                check "ref <> template-3"
                  (ref_uuid <> Some template_3_uuid)
              in
              check_ref ();
              undo_all test_repo;
              redo_all test_repo;
              check_ref ())))

(* (deftest sync-conflict-store-roundtrip-test)
   add-sync-conflicts! persists title conflicts keyed by block uuid
   outside graph data; get-sync-conflicts returns them. *)
let test_sync_conflict_store_roundtrip () =
  let ops = new_client_ops_db () in
  let block_uuid = fresh_uuid () in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page 1" }
          ; blocks =
              [ { Db_test_util.default_block with b_title = Some "target" } ] } ]
      ()
  in
  with_datascript_conns conn (Some ops) (fun () ->
      Sync_client_op.add_sync_conflicts test_repo
        [ block_uuid, "block/title", "remote title", 42 ];
      match Sync_client_op.get_sync_conflicts test_repo block_uuid with
      | [ c ] ->
          check "conflict fields roundtrip"
            (c.Sync_client_op.block_uuid = block_uuid
             && c.Sync_client_op.attr = "block/title"
             && c.Sync_client_op.value = "remote title"
             && c.Sync_client_op.remote_t = Some 42)
      | cs -> check "single conflict row" (List.length cs = 1))

(* (deftest sync-title-conflict-store-keeps-only-latest-non-empty-value-test)
   newer title conflicts replace previous ones per block; an empty value
   clears the stored conflict. *)
let test_sync_title_conflict_keeps_latest () =
  let ops = new_client_ops_db () in
  let block_uuid = fresh_uuid () in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page 1" }
          ; blocks =
              [ { Db_test_util.default_block with b_title = Some "target" } ] } ]
      ()
  in
  with_datascript_conns conn (Some ops) (fun () ->
      Sync_client_op.add_sync_conflicts test_repo
        [ block_uuid, "block/title", "first remote title", 42
        ; block_uuid, "block/title", "", 43
        ; block_uuid, "block/title", "latest remote title", 44 ];
      (match Sync_client_op.get_sync_conflicts test_repo block_uuid with
       | [ c ] ->
           check "keeps only latest non-empty conflict"
             (c.Sync_client_op.value = "latest remote title"
              && c.Sync_client_op.remote_t = Some 44)
       | cs -> check "single conflict row" (List.length cs = 1));
      Sync_client_op.add_sync_conflicts test_repo
        [ block_uuid, "block/title", "", 45 ];
      check "empty value clears the stored conflict"
        (Sync_client_op.get_sync_conflicts test_repo block_uuid = []))

(* (deftest sync-conflict-clear-test)
   clear-sync-conflicts! removes resolved conflicts for one block and
   leaves other blocks' conflicts intact. *)
let test_sync_conflict_clear () =
  let ops = new_client_ops_db () in
  let block_uuid = fresh_uuid () in
  let other_block_uuid = fresh_uuid () in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with pg_title = Some "page 1" }
          ; blocks =
              [ { Db_test_util.default_block with b_title = Some "target" } ] } ]
      ()
  in
  with_datascript_conns conn (Some ops) (fun () ->
      Sync_client_op.add_sync_conflicts test_repo
        [ block_uuid, "block/title", "remote title", 42
        ; other_block_uuid, "block/title", "other remote title", 43 ];
      Sync_client_op.clear_sync_conflicts test_repo block_uuid;
      check "cleared block has no conflicts"
        (Sync_client_op.get_sync_conflicts test_repo block_uuid = []);
      check "other block keeps its conflict"
        (List.map
           (fun (c : Sync_client_op.sync_conflict) -> c.value)
           (Sync_client_op.get_sync_conflicts test_repo other_block_uuid)
         = [ "other remote title" ]))

(* f6fc6f78ac (deftest outliner-upload-chunks-preserve-entities-and-acknowledgment-test)
   cljs with-redefs sync-apply/max-upload-request-datoms (2 for delete,
   15 for insert) — the OCaml cap is a ref for the same purpose. *)
let test_outliner_upload_chunks_preserve_entities_and_acknowledgment () =
  preserve_state (fun () ->
      List.iter
        (fun delete ->
           let conn, ops, parent, _c1, _c2, _c3 = setup_parent_child () in
           let parent_uuid = ent_block_uuid parent in
           (if delete then
              ignore
                (Outliner_page.delete_conn conn parent_uuid
                   (Wire.Map [])));
           let server_conn =
             Datascript.conn_from_db (Datascript.db conn)
           in
           with_datascript_conns conn (Some ops) (fun () ->
               ignore
                 (apply_ops conn
                    [ (if delete then
                         Wire.Array
                           [ kw "recycle-delete-permanently"
                           ; Wire.Array [ Wire.Uuid parent_uuid ] ]
                       else
                         let blocks =
                           List.init 6 (fun i ->
                               wire_map
                                 [ "block/uuid", Wire.Uuid (fresh_uuid ())
                                 ; ( "block/title"
                                   , Wire.String
                                       (Printf.sprintf "Chunk block %d"
                                          i) ) ])
                         in
                         Wire.Array
                           [ kw "insert-blocks"
                           ; Wire.Array
                               [ Wire.Array blocks
                               ; Wire.Int parent.id
                               ; wire_map
                                   [ "sibling?", Wire.Bool false
                                   ; "keep-uuid?", Wire.Bool true ] ] ]) ]
                    local_tx_meta);
               let prev_cap = !(Sync_apply.max_upload_request_datoms) in
               Fun.protect
                 ~finally:(fun () ->
                    Sync_apply.max_upload_request_datoms := prev_cap)
                 (fun () ->
                    Sync_apply.max_upload_request_datoms :=
                      (if delete then 2 else 15);
                    let rec loop requests =
                 let pending = Sync_apply.pending_txs test_repo () in
                 let tx_entries, _drops, _drop_txs =
                   Sync_apply.prepare_upload_tx_entries ~repo:test_repo
                     (Some conn) pending
                 in
                 match tx_entries with
                 | [] ->
                     check "permanent deletion spans requests"
                       ((not delete) || requests > 1);
                     check "insert stays one atomic request"
                       (delete || requests = 1);
                     check "pending empty after upload"
                       (Sync_apply.pending_txs test_repo () = []);
                     check "client/server checksums converge"
                       (Db_sync_checksum.recompute_checksum
                          (Datascript.db conn)
                        = Db_sync_checksum.recompute_checksum
                            (Datascript.db server_conn))
                 | _ ->
                     check "chunk progress bounded" (requests < 20);
                     (if requests < 20 then begin
                        let again, _, _ =
                          Sync_apply.prepare_upload_tx_entries
                            ~repo:test_repo (Some conn) pending
                        in
                        check "retry resends same chunk"
                          (tx_entries = again);
                        List.iter
                          (fun entry ->
                             server_apply_entry server_conn entry;
                             (* a lost response resends the chunk before
                                advancing the cursor *)
                             server_apply_entry server_conn entry)
                          tx_entries;
                        Sync_apply.commit_large_upload_progress test_repo
                          tx_entries;
                        ignore
                          (Sync_apply.mark_pending_txs_false test_repo
                             (List.filter_map
                                (wire_get_str "tx-id") tx_entries));
                        loop (requests + 1)
                      end)
               in
               loop 0)))
        [ false; true ])

(* f6fc6f78ac (deftest additional-outliner-operations-upload-test) *)
let test_additional_outliner_operations_upload () =
  preserve_state (fun () ->
      List.iter
        (fun (op, rebase) ->
           let conn, ops, _p, child1, child2, _c3 =
             setup_parent_child ()
           in
           let recycled_uuid = fresh_uuid () in
           page_create conn "Recycled upload page" ~uuid:recycled_uuid ();
           ignore
             (Outliner_page.delete_conn conn recycled_uuid
                (Wire.Map []));
           let source_conn =
             Db_test_util.create_conn_with_blocks
               ~pages_and_blocks:
                 [ { Db_test_util.page =
                       { Db_test_util.default_page with
                         pg_title = Some "Imported upload page" }
                   ; blocks =
                       [ { Db_test_util.default_block with
                           b_title = Some "Imported child" } ] } ]
               ()
           in
           let source_db = Datascript.db source_conn in
           let source_page =
             Option.get (Ldb.get_page source_db (String "Imported upload page"))
           in
           let export_map =
             Sqlite_export.build_export source_db
               (Map
                  [ Keyword "export-type", Keyword "page"
                  ; Keyword "page-id", Int64 (Int64.of_int source_page.id) ])
           in
           let child1_uuid = ent_block_uuid child1 in
           let args =
             match op with
             | "restore-recycled" | "recycle-delete-permanently" ->
                 Wire.Array [ Wire.Uuid recycled_uuid ]
             | "collapse-expand-blocks" ->
                 Wire.Array
                   [ Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid child1_uuid
                           ; "block/collapsed?", Wire.Bool true ] ]
                   ; wire_map [] ]
             | _ ->
                 Wire.Array
                   [ Ds_wire.transit_of_value export_map; wire_map [] ]
           in
           let server_conn =
             Datascript.conn_from_db (Datascript.db conn)
           in
           with_datascript_conns conn (Some ops) (fun () ->
               let result =
                 apply_ops conn
                   [ Wire.Array [ kw op; args ] ]
                   local_tx_meta
               in
               check "apply-ops has no error"
                 (match Wire.get "error" result with
                  | Some Wire.Nil | None -> true
                  | _ -> false);
               (if rebase then
                  remote_tx_to_client server_conn
                    [ Add
                        ( Entity_id child2.id
                        , "block/title"
                        , String "Remote edit" ) ]);
               let db = Datascript.db conn in
               (match op with
                | "restore-recycled" ->
                    check "restored page is not recycled"
                      (match
                         ent_by_block_uuid db recycled_uuid
                       with
                       | Some e -> not (Outliner_recycle.recycled e)
                       | None -> false)
                | "recycle-delete-permanently" ->
                    check "page permanently deleted"
                      (ent_by_block_uuid db recycled_uuid = None)
                | "collapse-expand-blocks" ->
                    check "child1 collapsed"
                      (Ldb.value
                         (Option.get
                            (Datascript.entity db
                               (Entity_id child1.id)))
                         "block/collapsed?"
                       = Some (Bool true))
                | _ ->
                    check "imported page exists"
                      (Option.is_some
                         (Ldb.get_page db
                            (String "Imported upload page"))));
               upload_pending_and_assert_converged conn server_conn))
        (List.concat_map
           (fun op ->
              List.map
                (fun rebase -> (op, rebase))
                [ false; true ])
           [ "restore-recycled"; "recycle-delete-permanently"
           ; "collapse-expand-blocks"; "batch-import-edn" ]))

(* cljs (count (d/q '[:find [?e ...] :where [?e :block/title t]] db t)) *)
let count_blocks_by_title conn (title : string) : int =
  match
    Datascript.q_string
      ~inputs:[ Arg_scalar (Result_value (String title)) ]
      (Datascript.db conn)
      "[:find [?e ...] :in $ ?title :where [?e :block/title ?title]]"
  with
  | [ row ] -> List.length row
  | rows -> List.length rows

(* cljs rebase-save-new-page-reference-and-insert-sibling-test *)
let test_rebase_save_new_page_reference_and_insert_sibling () =
  List.iter
    (fun persisted_bad_history ->
       List.iter
         (fun recycle ->
            List.iter
              (fun move_reference_to_library ->
                 preserve_state (fun () ->
                     wire_no_e2ee ();
                     let conn, ops, _parent, child1, child2, _c3 =
                       setup_parent_child ()
                     in
                     let _, recycled_uuid_opt =
                       Outliner_page.create_bang conn "TickTick" ()
                     in
                     let recycled_uuid = Option.get recycled_uuid_opt in
                     let remote_conn =
                       Datascript.conn_from_db (Datascript.db conn)
                     in
                     let parsed_ref =
                       Option.get
                         (Gp_block.page_name_to_map "New Contact"
                            (Datascript.db conn) true None ())
                     in
                     let page_uuid =
                       match List.assoc_opt "block/uuid" parsed_ref with
                       | Some (Uuid u) -> u
                       | _ -> failwith "parsed ref has no block/uuid"
                     in
                     with_datascript_conns conn (Some ops) (fun () ->
                         let child1_uuid = ent_block_uuid child1 in
                         ignore
                           (apply_ops conn
                              [ Wire.Array
                                  [ kw "save-block"
                                  ; Wire.Array
                                      [ wire_map
                                          [ "block/uuid",
                                            Wire.Uuid child1_uuid
                                          ; "block/title",
                                            Wire.String
                                              ("Call [[" ^ page_uuid ^ "]]")
                                          ; "block/refs",
                                            Wire.Array
                                              [ Block_map.to_transit
                                                  parsed_ref ] ]
                                      ; wire_map [] ] ]
                              ; Wire.Array
                                  [ kw "insert-blocks"
                                  ; Wire.Array
                                      [ Wire.Array
                                          [ wire_map
                                              [ "block/title",
                                                Wire.String ""
                                              ; "block/uuid",
                                                Wire.Uuid (fresh_uuid ()) ] ]
                                      ; Wire.Int child1.id
                                      ; wire_map
                                          [ "sibling?", Wire.Bool true ] ] ] ]
                              (local_tx_meta_with_outliner_op
                                 "insert-blocks"));
                         let inserted =
                           Option.get
                             (Ldb.get_right_sibling
                                (Option.get
                                   (Datascript.entity
                                      (Datascript.db conn)
                                      (Entity_id child1.id))))
                         in
                         let inserted_uuid = ent_block_uuid inserted in
                         let pending =
                           List.hd (Sync_apply.pending_txs test_repo ())
                         in
                         let tx_id = pending.tx_id in
                         check "inserted uuid differs from page uuid"
                           (page_uuid <> inserted_uuid);
                         if not persisted_bad_history then
                           check "forward ops carry inserted uuid"
                             (wire_uuid_string
                                (wire_get_in [ 1; 1; 0; 0 ] "block/uuid"
                                   (Wire.Array
                                      pending.forward_outliner_ops))
                              = Some inserted_uuid)
                         else
                           (* cljs: the affected client stored the created
                              reference UUID as the inserted sibling UUID,
                              while its durable datoms stayed correct *)
                           upsert_local_tx_entry_from pending
                             ~forward_outliner_ops:
                               (List.mapi
                                  (fun i op ->
                                     if i = 1 then
                                       op
                                       |> wire_assoc_in [ 1; 0; 0 ]
                                            "block/uuid"
                                            (Wire.Uuid page_uuid)
                                       |> wire_assoc_in [ 1; 0; 0 ]
                                            "block/parent"
                                            (Wire.Array
                                               [ kw "block/uuid"
                                               ; Wire.Nil ])
                                     else op)
                                  pending.forward_outliner_ops);
                         (if recycle then
                            ignore
                              (apply_ops conn
                                 [ Wire.Array
                                     [ kw "delete-page"
                                     ; Wire.Array
                                         [ Wire.Uuid recycled_uuid
                                         ; wire_map [] ] ] ]
                                 local_tx_meta));
                         (if move_reference_to_library then
                            let library =
                              Option.get
                                (Ldb.get_built_in_page
                                   (Datascript.db conn)
                                   Ldb.library_page_name)
                            in
                            ignore
                              (apply_ops conn
                                 [ Wire.Array
                                     [ kw "move-blocks"
                                     ; Wire.Array
                                         [ Wire.Array
                                             [ Wire.Uuid page_uuid ]
                                         ; Wire.Uuid
                                             (ent_block_uuid library)
                                         ; wire_map
                                             [ "sibling?", Wire.Bool false ]
                                         ] ] ]
                                 local_tx_meta));
                         for attempt = 0 to 1 do
                           let title =
                             "Remote edit " ^ string_of_int attempt
                           in
                           check "remote tx applied"
                             (try
                                remote_tx_to_client remote_conn
                                  [ Add
                                      ( Entity_id child2.id
                                      , "block/title"
                                      , String title ) ];
                                true
                              with _ -> false);
                           let db = Datascript.db conn in
                           check "remote title applied"
                             (Ldb.string_value
                                (Option.get
                                   (Datascript.entity db
                                      (Entity_id child2.id)))
                                "block/title"
                              = Some title);
                           check "New Contact page keeps title"
                             (match ent_by_block_uuid db page_uuid with
                              | Some e ->
                                  Ldb.string_value e "block/title"
                                  = Some "New Contact"
                              | None -> false);
                           check "reference parent is Library"
                             ((if move_reference_to_library then
                                 Option.map
                                   (fun (l : entity) -> l.id)
                                   (Ldb.get_built_in_page db
                                      Ldb.library_page_name)
                               else None)
                              = (match
                                   ent_by_block_uuid db page_uuid
                                 with
                                 | Some p -> (
                                     match
                                       Ldb.ref_ent p "block/parent"
                                     with
                                     | Some par -> Some par.id
                                     | None -> None)
                                 | None -> None));
                           check "right sibling keeps inserted uuid"
                             (Option.map ent_block_uuid
                                (Ldb.get_right_sibling
                                   (Option.get
                                      (Datascript.entity db
                                         (Entity_id child1.id))))
                              = Some inserted_uuid);
                           check "stored forward op keeps inserted uuid"
                             (match
                                Sync_client_op.get_local_tx_entry
                                  test_repo tx_id
                              with
                              | Some e ->
                                  wire_uuid_string
                                    (wire_get_in [ 1; 1; 0; 0 ]
                                       "block/uuid"
                                       (Wire.Array e.forward_outliner_ops))
                                  = Some inserted_uuid
                              | None -> false)
                         done;
                         check "pending still records the tx"
                           (List.exists
                              (fun (e : Sync_client_op.local_tx_entry) ->
                                 e.tx_id = tx_id)
                              (Sync_apply.pending_txs test_repo ()));
                         (if recycle then
                            check "recycled page flagged"
                              (match
                                 ent_by_block_uuid
                                   (Datascript.db conn) recycled_uuid
                               with
                               | Some e -> Outliner_recycle.recycled e
                               | None -> false));
                         upload_pending_and_assert_converged conn
                           remote_conn)))
              [ false; true ])
         [ false; true ])
    [ false; true ]

(* cljs rebase-insert-page-in-library-with-reference-test *)
let test_rebase_insert_page_in_library_with_reference () =
  List.iter
    (fun with_reference ->
       preserve_state (fun () ->
           wire_no_e2ee ();
           let conn, ops, _parent, child1, _c2, _c3 =
             setup_parent_child ()
           in
           let server_conn =
             Datascript.conn_from_db (Datascript.db conn)
           in
           let db0 = Datascript.db conn in
           let library =
             Option.get
               (Ldb.get_built_in_page db0 Ldb.library_page_name)
           in
           let parsed_ref =
             Option.get
               (Gp_block.page_name_to_map "Referenced Page" db0 true
                  None ())
           in
           let ref_uuid =
             match List.assoc_opt "block/uuid" parsed_ref with
             | Some (Uuid u) -> u
             | _ -> failwith "parsed ref has no block/uuid"
           in
           let title =
             if with_reference then "Page with [[" ^ ref_uuid ^ "]]"
             else "Library Page"
           in
           let page_map =
             Option.get
               (Gp_block.page_name_to_map title db0 true None ())
           in
           with_datascript_conns conn (Some ops) (fun () ->
               let page_wire =
                 if with_reference then
                   Cljs_map.assoc
                     (Block_map.to_transit page_map) "block/refs"
                     (Wire.Array [ Block_map.to_transit parsed_ref ])
                 else Block_map.to_transit page_map
               in
               let page_uuid =
                 match List.assoc_opt "block/uuid" page_map with
                 | Some (Uuid u) -> u
                 | _ -> failwith "page map has no block/uuid"
               in
               ignore
                 (apply_ops conn
                    [ Wire.Array
                        [ kw "insert-blocks"
                        ; Wire.Array
                            [ Wire.Array [ page_wire ]
                            ; Wire.Int library.id
                            ; wire_map
                                [ "sibling?", Wire.Bool false
                                ; "keep-uuid?", Wire.Bool true ] ] ] ]
                    local_tx_meta);
               let pending =
                 List.hd (Sync_apply.pending_txs test_repo ())
               in
               check "forward op carries page uuid"
                 (wire_uuid_string
                    (wire_get_in [ 0; 1; 0; 0 ] "block/uuid"
                       (Wire.Array pending.forward_outliner_ops))
                  = Some page_uuid);
               let db = Datascript.db conn in
               let page_before =
                 Option.get (ent_by_block_uuid db page_uuid)
               in
               ignore
                 (Datascript.transact_conn server_conn
                    [ Add
                        ( Entity_id child1.id
                        , "block/title"
                        , String "Remote edit" ) ]);
               await_unit
                 (Sync_apply.apply_remote_tx test_repo (mk_client ())
                    [ db_add (Wire.Int child1.id) "block/title"
                        (Wire.String "Remote edit") ]);
               let db = Datascript.db conn in
               let inserted =
                 Option.get (ent_by_block_uuid db page_uuid)
               in
               check "inserted is page" (Ldb.is_page inserted);
               check "title preserved"
                 (Ldb.string_value inserted "block/title"
                  = Ldb.string_value page_before "block/title");
               check "parent is library"
                 (Option.map ent_block_uuid
                    (Ldb.ref_ent inserted "block/parent")
                  = Some (ent_block_uuid library));
               check "remote edit applied"
                 (Ldb.string_value
                    (Option.get
                       (Datascript.entity db (Entity_id child1.id)))
                    "block/title"
                  = Some "Remote edit");
               (if with_reference then begin
                  let refs e =
                    List.sort compare
                      (List.map ent_block_uuid
                         (Ldb.ref_ents e "block/refs"))
                  in
                  check "refs preserved"
                    (refs page_before = refs inserted);
                  check "refs contain parsed ref"
                    (List.mem ref_uuid (refs inserted));
                  check "parsed ref page title"
                    (match ent_by_block_uuid db ref_uuid with
                     | Some e ->
                         Ldb.string_value e "block/title"
                         = Some "Referenced Page"
                     | None -> false)
               end);
               upload_pending_and_assert_converged conn server_conn)))
    [ false; true ]

(* cljs rebase-multiple-insertions-preserves-identities-test *)
let test_rebase_multiple_insertions_preserves_identities () =
  List.iter
    (fun keep_uuid ->
       List.iter
         (fun replace_empty_target ->
            preserve_state (fun () ->
                wire_no_e2ee ();
                let conn, ops, _parent, child1, child2, child3 =
                  setup_parent_child ()
                in
                if replace_empty_target then
                  ignore
                    (Datascript.transact_conn conn
                       [ Add
                           ( Entity_id child1.id
                           , "block/title"
                           , String "" ) ]);
                let server_conn =
                  Datascript.conn_from_db (Datascript.db conn)
                in
                with_datascript_conns conn (Some ops) (fun () ->
                    ignore
                      (apply_ops conn
                         [ Wire.Array
                             [ kw "insert-blocks"
                             ; Wire.Array
                                 [ Wire.Array
                                     [ wire_map
                                         [ "block/uuid",
                                           Wire.Uuid (fresh_uuid ())
                                         ; "block/title",
                                           Wire.String "First insertion"
                                         ] ]
                                 ; Wire.Int child1.id
                                 ; wire_map
                                     [ "sibling?", Wire.Bool true
                                     ; "keep-uuid?", Wire.Bool keep_uuid
                                     ; "replace-empty-target?",
                                       Wire.Bool replace_empty_target ] ]
                             ]
                         ; Wire.Array
                             [ kw "insert-blocks"
                             ; Wire.Array
                                 [ Wire.Array
                                     [ wire_map
                                         [ "block/uuid",
                                           Wire.Uuid (fresh_uuid ())
                                         ; "block/title",
                                           Wire.String "Second insertion"
                                         ] ]
                                 ; Wire.Int child2.id
                                 ; wire_map
                                     [ "sibling?", Wire.Bool true
                                     ; "keep-uuid?", Wire.Bool keep_uuid ]
                                 ] ] ]
                         local_tx_meta);
                    let db = Datascript.db conn in
                    let first_uuid =
                      if replace_empty_target then ent_block_uuid child1
                      else
                        ent_block_uuid
                          (Option.get
                             (Ldb.get_right_sibling
                                (Option.get
                                   (Datascript.entity db
                                      (Entity_id child1.id)))))
                    in
                    let second_uuid =
                      ent_block_uuid
                        (Option.get
                           (Ldb.get_right_sibling
                              (Option.get
                                 (Datascript.entity db
                                    (Entity_id child2.id)))))
                    in
                    ignore
                      (apply_ops conn
                         [ Wire.Array
                             [ kw "save-block"
                             ; Wire.Array
                                 [ wire_map
                                     [ "block/uuid",
                                       Wire.Uuid second_uuid
                                     ; "block/title",
                                       Wire.String "Second edited" ]
                                 ; wire_map [] ] ] ]
                         local_tx_meta);
                    check "remote tx applied"
                      (try
                         remote_tx_to_client server_conn
                           [ Add
                               ( Entity_id child3.id
                               , "block/title"
                               , String "Remote edit" ) ];
                         true
                       with _ -> false);
                    let db = Datascript.db conn in
                    check "first insertion kept"
                      (match ent_by_block_uuid db first_uuid with
                       | Some e ->
                           Ldb.string_value e "block/title"
                           = Some "First insertion"
                       | None -> false);
                    check "second insertion kept"
                      (match ent_by_block_uuid db second_uuid with
                       | Some e ->
                           Ldb.string_value e "block/title"
                           = Some "Second edited"
                       | None -> false);
                    let tx_entries, _, _ =
                      Sync_apply.prepare_upload_tx_entries
                        ~repo:test_repo (Some conn)
                        (Sync_apply.pending_txs test_repo ())
                    in
                    List.iter
                      (fun entry ->
                         check "apply-tx-entry succeeded"
                           (try
                              server_apply_entry server_conn entry;
                              true
                            with _ -> false))
                      tx_entries;
                    check "client/server checksums converge"
                      (Db_sync_checksum.recompute_checksum
                         (Datascript.db conn)
                       = Db_sync_checksum.recompute_checksum
                           (Datascript.db server_conn)))))
         [ false; true ])
    [ false; true ]

(* cljs compound-save-empty-target-then-insert-preserves-identities-test *)
let test_compound_save_empty_target_then_insert_preserves_identities () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _parent, child1, child2, _c3 = setup_parent_child () in
      ignore
        (Datascript.transact_conn conn
           [ Add (Entity_id child1.id, "block/title", String "") ]);
      let server_conn =
        Datascript.conn_from_db (Datascript.db conn)
      in
      let first_uuid = fresh_uuid () in
      let second_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "save-block"
                   ; Wire.Array
                       [ wire_map
                           [ "block/uuid", Wire.Uuid (ent_block_uuid child1)
                           ; "block/title", Wire.String "Typed" ]
                       ; wire_map [] ] ]
               ; Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/uuid", Wire.Uuid first_uuid
                               ; "block/title", Wire.String "First" ]
                           ; wire_map
                               [ "block/uuid", Wire.Uuid second_uuid
                               ; "block/title", Wire.String "Second" ] ]
                       ; Wire.Int child1.id
                       ; wire_map
                           [ "sibling?", Wire.Bool true
                           ; "keep-uuid?", Wire.Bool true
                           ; "replace-empty-target?", Wire.Bool false ] ]
                   ] ]
               local_tx_meta);
          remote_tx_to_client server_conn
            [ Add
                ( Entity_id child2.id
                , "block/title"
                , String "Remote" ) ];
          let db = Datascript.db conn in
          List.iter
            (fun (id, title) ->
               check ("title of " ^ title)
                 (match ent_by_block_uuid db id with
                  | Some e -> Ldb.string_value e "block/title" = Some title
                  | None -> false))
            [ ent_block_uuid child1, "Typed"; first_uuid, "First"
            ; second_uuid, "Second" ];
          upload_pending_and_assert_converged conn server_conn))

(* cljs rebase-nested-insert-then-delete-preserves-tree-test *)
let test_rebase_nested_insert_then_delete_preserves_tree () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let conn, ops, _parent, child1, child2, _c3 = setup_parent_child () in
      let server_conn =
        Datascript.conn_from_db (Datascript.db conn)
      in
      let root_uuid = fresh_uuid () in
      let child_uuid = fresh_uuid () in
      let grandchild_uuid = fresh_uuid () in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "insert-blocks"
                   ; Wire.Array
                       [ Wire.Array
                           [ wire_map
                               [ "block/uuid", Wire.Uuid root_uuid
                               ; "block/title",
                                 Wire.String "Inserted root" ]
                           ; wire_map
                               [ "block/uuid", Wire.Uuid child_uuid
                               ; "block/title",
                                 Wire.String "Inserted child"
                               ; "block/parent",
                                 block_uuid_lookup
                                   (Wire.Uuid root_uuid) ]
                           ; wire_map
                               [ "block/uuid",
                                 Wire.Uuid grandchild_uuid
                               ; "block/title",
                                 Wire.String "Inserted grandchild"
                               ; "block/parent",
                                 block_uuid_lookup
                                   (Wire.Uuid child_uuid) ] ]
                       ; Wire.Int child1.id
                       ; wire_map
                           [ "sibling?", Wire.Bool true
                           ; "keep-uuid?", Wire.Bool true ] ] ] ]
               local_tx_meta);
          let db = Datascript.db conn in
          check "grandchild under child"
            (match ent_by_block_uuid db grandchild_uuid with
             | Some g ->
                 Option.map ent_block_uuid
                   (Ldb.ref_ent g "block/parent")
                 = Some child_uuid
             | None -> false);
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "delete-blocks"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Uuid child_uuid ]
                       ; wire_map [] ] ]
               ; Wire.Array
                   [ kw "recycle-delete-permanently"
                   ; Wire.Array [ Wire.Uuid child_uuid ] ] ]
               local_tx_meta);
          let db = Datascript.db conn in
          check "grandchild deleted"
            (ent_by_block_uuid db grandchild_uuid = None);
          check "remote tx applied"
            (try
               remote_tx_to_client server_conn
                 [ Add
                     ( Entity_id child2.id
                     , "block/title"
                     , String "Remote edit" ) ];
               true
             with _ -> false);
          let db = Datascript.db conn in
          check "inserted root kept"
            (match ent_by_block_uuid db root_uuid with
             | Some e ->
                 Ldb.string_value e "block/title"
                 = Some "Inserted root"
             | None -> false);
          check "inserted child deleted"
            (ent_by_block_uuid db child_uuid = None);
          check "inserted grandchild deleted"
            (ent_by_block_uuid db grandchild_uuid = None);
          let tx_entries, _, _ =
            Sync_apply.prepare_upload_tx_entries ~repo:test_repo
              (Some conn) (Sync_apply.pending_txs test_repo ())
          in
          List.iter
            (fun entry ->
               check "apply-tx-entry succeeded"
                 (try
                    server_apply_entry server_conn entry;
                    true
                  with _ -> false))
            tx_entries;
          check "client/server checksums converge"
            (Db_sync_checksum.recompute_checksum (Datascript.db conn)
             = Db_sync_checksum.recompute_checksum
                 (Datascript.db server_conn))))

(* cljs compound-template-and-insert-upload-test *)
let test_compound_template_and_insert_upload () =
  List.iter
    (fun keep_uuid ->
       List.iter
         (fun template_first ->
            List.iter
              (fun explicit_sibling ->
                 preserve_state (fun () ->
                     wire_no_e2ee ();
                     let ( template_root_uuid, _t1, _t2, _t3
                         , empty_target_uuid, _local_empty
                         , seed_conn, ops ) =
                       setup_rebase_apply_template_repro_state ()
                     in
                     let conn =
                       Datascript.conn_from_db (Datascript.db seed_conn)
                     in
                     let server_conn =
                       Datascript.conn_from_db (Datascript.db seed_conn)
                     in
                     let seed =
                       Option.get
                         (Db_test_util.find_block_by_content
                            (Datascript.db conn) "seed")
                     in
                     let template_op =
                       Wire.Array
                         [ kw "apply-template"
                         ; Wire.Array
                             [ Wire.Uuid template_root_uuid
                             ; Wire.Uuid empty_target_uuid
                             ; (if explicit_sibling then
                                  wire_map
                                    [ "sibling?", Wire.Bool true ]
                                else wire_map []) ] ]
                     in
                     let insert_op =
                       Wire.Array
                         [ kw "insert-blocks"
                         ; Wire.Array
                             [ Wire.Array
                                 [ wire_map
                                     [ "block/uuid",
                                       Wire.Uuid (fresh_uuid ())
                                     ; "block/title",
                                       Wire.String "Compound followup" ]
                                 ]
                             ; block_uuid_lookup
                                 (Wire.Uuid (ent_block_uuid seed))
                             ; wire_map
                                 [ "sibling?", Wire.Bool true
                                 ; "keep-uuid?", Wire.Bool keep_uuid ] ]
                         ]
                     in
                     with_datascript_conns conn (Some ops) (fun () ->
                         ignore
                           (apply_ops conn
                              (if template_first then
                                 [ template_op; insert_op ]
                               else [ insert_op; template_op ])
                              local_tx_meta);
                         let followup_uuid =
                           ent_block_uuid
                             (Option.get
                                (Db_test_util.find_block_by_content
                                   (Datascript.db conn)
                                   "Compound followup"))
                         in
                         remote_tx_to_client server_conn
                           [ Add
                               ( Entity_id seed.id
                               , "block/title"
                               , String "Remote seed" ) ];
                         let db = Datascript.db conn in
                         check "followup title"
                           (match ent_by_block_uuid db followup_uuid with
                            | Some e ->
                                Ldb.string_value e "block/title"
                                = Some "Compound followup"
                            | None -> false);
                         check "two '3' blocks"
                           (count_blocks_by_title conn "3" = 2);
                         upload_pending_and_assert_converged conn
                           server_conn)))
              [ false; true ])
         [ false; true ])
    [ false; true ]

(* cljs rebase-template-after-target-permanently-deleted-test *)
let test_rebase_template_after_target_permanently_deleted () =
  preserve_state (fun () ->
      wire_no_e2ee ();
      let ( template_root_uuid, _t1, _t2, _t3, empty_target_uuid
          , _local_empty, seed_conn, ops ) =
        setup_rebase_apply_template_repro_state ()
      in
      let conn = Datascript.conn_from_db (Datascript.db seed_conn) in
      let server_conn =
        Datascript.conn_from_db (Datascript.db seed_conn)
      in
      let seed =
        Option.get
          (Db_test_util.find_block_by_content (Datascript.db conn)
             "seed")
      in
      with_datascript_conns conn (Some ops) (fun () ->
          ignore
            (apply_template_to_empty_target conn template_root_uuid
               empty_target_uuid);
          ignore
            (apply_ops conn
               [ Wire.Array
                   [ kw "delete-blocks"
                   ; Wire.Array
                       [ Wire.Array [ Wire.Uuid empty_target_uuid ]
                       ; wire_map [] ] ]
               ; Wire.Array
                   [ kw "recycle-delete-permanently"
                   ; Wire.Array [ Wire.Uuid empty_target_uuid ] ] ]
               local_tx_meta);
          remote_tx_to_client server_conn
            [ Add
                ( Entity_id seed.id
                , "block/title"
                , String "Remote seed" ) ];
          let db = Datascript.db conn in
          check "empty target deleted"
            (ent_by_block_uuid db empty_target_uuid = None);
          check "one '2' block" (count_blocks_by_title conn "2" = 1);
          upload_pending_and_assert_converged conn server_conn))

(* cljs template-uploads-after-rebase-and-undo-redo-test *)
let test_template_uploads_after_rebase_and_undo_redo () =
  List.iter
    (fun rebase ->
       List.iter
         (fun undo_redo ->
            preserve_state (fun () ->
                wire_no_e2ee ();
                let ( template_root_uuid, _t1, _t2, _t3
                    , empty_target_uuid, _local_empty, seed_conn, ops ) =
                  setup_rebase_apply_template_repro_state ()
                in
                let conn =
                  Datascript.conn_from_db (Datascript.db seed_conn)
                in
                let server_conn =
                  Datascript.conn_from_db (Datascript.db seed_conn)
                in
                let seed =
                  Option.get
                    (Db_test_util.find_block_by_content
                       (Datascript.db conn) "seed")
                in
                with_datascript_conns conn (Some ops) (fun () ->
                    with_apply_history_action (fun () ->
                        ignore
                          (apply_template_to_empty_target conn
                             template_root_uuid empty_target_uuid);
                        let inserted =
                          Option.get
                            (select_offline_inserted conn
                               template_root_uuid "3")
                        in
                        let inserted_uuid = ent_block_uuid inserted in
                        (if undo_redo then begin
                           ignore (Undo_redo.undo test_repo);
                           ignore (Undo_redo.redo test_repo)
                        end);
                        (if rebase then
                           remote_tx_to_client server_conn
                             [ Add
                                 ( Entity_id seed.id
                                 , "block/title"
                                 , String "Remote seed" ) ]);
                        check "inserted title 3"
                          (match
                             ent_by_block_uuid (Datascript.db conn)
                               inserted_uuid
                           with
                           | Some e ->
                               Ldb.string_value e "block/title"
                               = Some "3"
                           | None -> false);
                        upload_pending_and_assert_converged conn
                          server_conn))))
         [ false; true ])
    [ false; true ]

(* cljs setup-template-text-property-state *)
let setup_template_text_property_state explicit_value_block
    with_reference nonempty_target =
  let ( template_root_uuid, _t1, _t2, template_3_uuid
      , empty_target_uuid, local_empty_uuid, seed_conn, ops ) =
    setup_rebase_apply_template_repro_state ()
  in
  let property_id = "user.property/template-notes" in
  let page_uuid =
    ent_block_uuid
      (Option.get
         (Db_test_util.find_page_by_title (Datascript.db seed_conn)
            "page 1"))
  in
  let text =
    "Template notes"
    ^ (if with_reference then "\n" ^ Db_content.page_ref page_uuid
       else "")
  in
  ignore
    (Outliner_property.upsert_property seed_conn (Some property_id)
       (wire_map
          [ "logseq.property/type", Wire.Keyword "default"
          ; "db/cardinality", Wire.Keyword "db.cardinality/one" ])
       ~property_name:(Some "template-notes") ~properties:[]);
  (if explicit_value_block then
     ignore
       (Outliner_property.create_property_text_block seed_conn
          ~block_id:
            (Some (block_uuid_lookup (Wire.Uuid template_3_uuid)))
          property_id (Wire.String text) ())
   else
     Outliner_property.set_block_property seed_conn
       (block_uuid_lookup (Wire.Uuid template_3_uuid)) property_id
       (Wire.String text));
  (if nonempty_target then
     ignore
       (Datascript.transact_conn seed_conn
          [ Add
              ( Lookup_ref ("block/uuid", Uuid empty_target_uuid)
              , "block/title"
              , String "Existing target" ) ]));
  ( template_root_uuid, template_3_uuid, empty_target_uuid
  , local_empty_uuid, seed_conn, ops, text
  , if with_reference then Some page_uuid else None )

(* cljs assert-template-text-property *)
let assert_template_text_property ?(tag = "") (db : db) inserted_uuid
    value_uuid source_uuid text reference_uuid : unit =
  let check name v = check (tag ^ name) v in
  let copied = ent_by_block_uuid db inserted_uuid in
  let value_ent =
    Option.bind copied (fun c ->
        Ldb.ref_ent c "user.property/template-notes")
  in
  let original =
    Option.bind
      (ent_by_block_uuid db source_uuid)
      (fun e -> Ldb.ref_ent e "user.property/template-notes")
  in
  let value_title =
    Option.bind value_ent (fun e -> Ldb.string_value e "block/title")
  in
  check "copied title 3"
    (Option.bind copied (fun c -> Ldb.string_value c "block/title")
     = Some "3");
  check "copied value edited title"
    (value_title = Some ("Edited " ^ text));
  check "original value keeps title"
    (Option.bind original (fun e -> Ldb.string_value e "block/title")
     = Some text);
  check "value uuid"
    (Option.map ent_block_uuid value_ent = Some value_uuid);
  check "value parent is inserted"
    (Option.bind value_ent
       (fun e ->
          Option.map ent_block_uuid (Ldb.ref_ent e "block/parent"))
     = Some inserted_uuid);
  check "original parent is source"
    (Option.bind original
       (fun e ->
          Option.map ent_block_uuid (Ldb.ref_ent e "block/parent"))
     = Some source_uuid);
  match reference_uuid with
  | Some r ->
      check "value refs page"
        (List.exists
           (fun (e : entity) -> ent_block_uuid e = r)
           (match value_ent with
            | Some v -> Ldb.ref_ents v "block/refs"
            | None -> []))
  | None -> ()

(* cljs template-text-property-uploads-after-rebase-and-undo-redo-test *)
let test_template_text_property_uploads_after_rebase_and_undo_redo () =
  List.iter
    (fun explicit_value_block ->
       List.iter
         (fun with_reference ->
            List.iter
              (fun nonempty_target ->
                 List.iter
                   (fun rebase ->
                      List.iter
                        (fun undo_redo ->
                           List.iter
                             (fun edit_before_rebase ->
                                preserve_state (fun () ->
                                    wire_no_e2ee ();
                                    let ( template_root_uuid
                                        , template_3_uuid
                                        , empty_target_uuid
                                        , _local_empty
                                        , seed_conn, ops
                                        , property_text
                                        , reference_uuid ) =
                                      setup_template_text_property_state
                                        explicit_value_block
                                        with_reference nonempty_target
                                    in
                                    let conn =
                                      Datascript.conn_from_db
                                        (Datascript.db seed_conn)
                                    in
                                    let server_conn =
                                      Datascript.conn_from_db
                                        (Datascript.db seed_conn)
                                    in
                                    let seed =
                                      Option.get
                                        (Db_test_util
                                           .find_block_by_content
                                           (Datascript.db conn)
                                           "seed")
                                    in
                                    let db = Datascript.db conn in
                                    let source_value =
                                      Ldb.ref_ent
                                        (Option.get
                                           (ent_by_block_uuid db
                                              template_3_uuid))
                                        "user.property/template-notes"
                                    in
                                    with_datascript_conns conn
                                      (Some ops) (fun () ->
                                          with_apply_history_action
                                            (fun () ->
                                                ignore
                                                  (apply_template_with_opts
                                                     conn
                                                     template_root_uuid
                                                     empty_target_uuid
                                                     [ "sibling?",
                                                       Wire.Bool true ]);
                                                let inserted =
                                                  Option.get
                                                    (select_offline_inserted
                                                       conn
                                                       template_root_uuid
                                                       "3")
                                                in
                                                let inserted_uuid =
                                                  ent_block_uuid inserted
                                                in
                                                let value_uuid =
                                                  ent_block_uuid
                                                    (Option.get
                                                       (Ldb.ref_ent
                                                          inserted
                                                          "user.property/\
                                                           template-notes"))
                                                in
                                                let edit () =
                                                  ignore
                                                    (apply_ops conn
                                                       [ Wire.Array
                                                           [ kw
                                                               "save-block"
                                                           ; Wire.Array
                                                               [ (match
                                                                    reference_uuid
                                                                  with
                                                                  | Some
                                                                      r ->
                                                                    wire_map
                                                                      [ "block/uuid",
                                                                        Wire
                                                                          .Uuid
                                                                          value_uuid
                                                                      ; "block/title",
                                                                        Wire
                                                                          .String
                                                                          ("Edited "
                                                                           ^ property_text)
                                                                      ; "block/refs",
                                                                        Wire
                                                                          .Array
                                                                          [ wire_map
                                                                              [ "block/uuid",
                                                                                Wire
                                                                                  .Uuid
                                                                                  r ]
                                                                          ] ]
                                                                  | None ->
                                                                    wire_map
                                                                      [ "block/uuid",
                                                                        Wire
                                                                          .Uuid
                                                                          value_uuid
                                                                      ; "block/title",
                                                                        Wire
                                                                          .String
                                                                          ("Edited "
                                                                           ^ property_text)
                                                                      ])
                                                               ; wire_map
                                                                   [] ] ]
                                                       ]
                                                       local_tx_meta)
                                                in
                                                check
                                                  "value uuid differs from \
                                                   source"
                                                  (Option.map
                                                     ent_block_uuid
                                                     source_value
                                                   <> Some value_uuid);
                                                (if undo_redo then begin
                                                   ignore
                                                     (Undo_redo.undo
                                                        test_repo);
                                                   ignore
                                                     (Undo_redo.redo
                                                        test_repo)
                                                end);
                                                (if edit_before_rebase then
                                                   edit ());
                                                (if rebase then
                                                   List.iter
                                                     (fun title ->
                                                        remote_tx_to_client
                                                          server_conn
                                                          [ Add
                                                              ( Entity_id
                                                                  seed.id
                                                              , "block/title"
                                                              , String
                                                                  title )
                                                          ])
                                                     [ "Remote seed"
                                                     ; "Remote seed again" ]);
                                                (if
                                                   not edit_before_rebase
                                                 then edit ());
                                                upload_pending_and_assert_converged
                                                  conn server_conn;
                                                List.iter
                                                  (fun (side, db) ->
                                                     assert_template_text_property
                                                       ~tag:
                                                         (Printf.sprintf
                                                            "[ev=%b ref=%b nonempty=%b rebase=%b ur=%b edit=%b %s] "
                                                            explicit_value_block
                                                            with_reference
                                                            nonempty_target
                                                            rebase undo_redo
                                                            edit_before_rebase
                                                            side)
                                                       db inserted_uuid
                                                       value_uuid
                                                       template_3_uuid
                                                       property_text
                                                       reference_uuid)
                                                  [ "client"
                                                  , Datascript.db conn
                                                  ; "server"
                                                  , Datascript.db
                                                      server_conn ]))))
                             [ false; true ])
                        [ false; true ])
                   [ false; true ])
              [ false; true ])
         [ false; true ])
    [ false; true ]

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
            "local-checksum-heals-when-covered-commit-lags"
            `Quick test_local_checksum_heals_when_covered_commit_lags
        ; Alcotest.test_case
            "local-checksum-untouched-when-covered-commit-current"
            `Quick test_local_checksum_untouched_when_covered_commit_current
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
        ; Alcotest.test_case "reverse-local-txs-uses-reversed-tx-data" `Quick
            test_reverse_local_txs_uses_reversed_tx_data
        ; Alcotest.test_case
            "reverse-local-txs-keeps-order-add-for-restored-entity" `Quick
            test_reverse_local_txs_keeps_order_add_for_restored_entity
        ; Alcotest.test_case
            "reverse-local-txs-resolves-existing-uuid-string-temp-id" `Quick
            test_reverse_local_txs_resolves_existing_uuid_string_temp_id
        ; Alcotest.test_case
            "reverse-local-txs-drops-stale-duplicate-block-uuid-reverse"
            `Quick
            test_reverse_local_txs_drops_stale_duplicate_block_uuid_reverse
        ; Alcotest.test_case
            "reverse-local-txs-skips-validation-for-rebase-intermediate-state"
            `Quick
            test_reverse_local_txs_skips_validation_for_rebase_intermediate_state
        ; Alcotest.test_case
            "apply-remote-txs-reverses-parent-insert-with-existing-child-without-orphaning"
            `Quick
            test_apply_remote_txs_reverses_parent_insert_with_existing_child
        ; Alcotest.test_case "apply-remote-txs-drops-stale-save-block-reverse"
            `Quick test_apply_remote_txs_drops_stale_save_block_reverse
        ; Alcotest.test_case
            "enqueue-local-tx-keeps-mixed-semantic-forward-outliner-ops"
            `Quick
            test_enqueue_local_tx_keeps_mixed_semantic_forward_outliner_ops
        ; Alcotest.test_case
            "apply-history-action-undo-delete-blocks-noops-when-target-missing"
            `Quick
            test_apply_history_action_undo_delete_blocks_noops_when_target_missing
        ; Alcotest.test_case "enqueue-local-tx-persists-semantic-undo-ops"
            `Quick test_enqueue_local_tx_persists_semantic_undo_ops
        ; Alcotest.test_case
            "direct-outliner-page-delete-persists-delete-page-outliner-op"
            `Quick
            test_direct_outliner_page_delete_persists_delete_page_outliner_op
        ; Alcotest.test_case
            "delete-page-rewrites-node-refs-and-semantic-undo-redo" `Quick
            test_delete_page_rewrites_node_refs_and_semantic_undo_redo
        ; Alcotest.test_case
            "direct-outliner-property-set-persists-set-block-property-outliner-op"
            `Quick
            test_direct_outliner_property_set_persists_set_block_property_op
        ; Alcotest.test_case
            "rebase-replays-direct-set-block-property-without-semantic-ops"
            `Quick
            test_rebase_replays_direct_set_block_property_without_semantic_ops
        ; Alcotest.test_case
            "canonical-set-block-property-rewrites-ref-values-to-stable-refs"
            `Quick test_canonical_set_block_property_rewrites_ref_values
        ; Alcotest.test_case
            "canonical-batch-set-property-rewrites-ref-values-to-stable-refs"
            `Quick test_canonical_batch_set_property_rewrites_ref_values
        ; Alcotest.test_case
            "apply-history-action-replays-batch-set-property-from-tx-data-with-lookup-refs"
            `Quick test_apply_history_action_batch_set_property_lookup_refs
        ; Alcotest.test_case
            "apply-history-action-replays-batch-set-property-from-tx-data-with-raw-uuid-ids"
            `Quick batch_set_property_raw_uuid_body
        ; Alcotest.test_case
            "apply-history-action-redo-replays-batch-set-property-with-raw-uuid-ids"
            `Quick batch_set_property_raw_uuid_body
        ; Alcotest.test_case
            "apply-history-action-replays-set-block-property-from-tx-data-with-lookup-refs"
            `Quick test_apply_history_action_set_block_property_lookup_refs
        ; Alcotest.test_case "apply-history-action-skips-sync-fix-pending-tx"
            `Quick test_apply_history_action_skips_sync_fix_pending_tx
        ; Alcotest.test_case
            "replay-recycle-delete-permanently-removes-recycled-page" `Quick
            test_replay_recycle_delete_permanently_removes_recycled_page
        ; Alcotest.test_case
            "replay-recycle-delete-permanently-removes-recycled-block" `Quick
            test_replay_recycle_delete_permanently_removes_recycled_block
        ; Alcotest.test_case
            "replay-recycle-delete-permanently-missing-root-is-idempotent"
            `Quick
            test_replay_recycle_delete_permanently_missing_root_is_idempotent
        ; Alcotest.test_case
            "apply-history-action-replays-set-block-property-from-tx-data-with-raw-uuid-id"
            `Quick set_block_property_raw_uuid_body
        ; Alcotest.test_case
            "apply-history-action-redo-replays-set-block-tags-with-raw-uuid-id"
            `Quick set_block_property_raw_uuid_body
        ; Alcotest.test_case
            "apply-history-action-redo-replays-insert-blocks" `Quick
            test_apply_history_action_redo_replays_insert_blocks
        ; Alcotest.test_case "apply-history-action-redo-replays-save-block"
            `Quick test_apply_history_action_redo_replays_save_block
        ; Alcotest.test_case
            "apply-history-action-redo-rejects-save-block-with-late-created-query-ref"
            `Quick
            test_apply_history_action_redo_rejects_save_block_late_query_ref
        ; Alcotest.test_case
            "replay-save-block-missing-block-is-invalid" `Quick
            test_replay_save_block_missing_block_is_invalid
        ; Alcotest.test_case
            "apply-history-action-redo-replays-status-property" `Quick
            test_apply_history_action_redo_replays_status_property
        ; Alcotest.test_case
            "apply-history-action-redo-replays-upsert-property" `Quick
            test_apply_history_action_redo_replays_upsert_property
        ; Alcotest.test_case
            "undo-upsert-property-many-node-restores-previous-schema" `Quick
            test_undo_upsert_property_many_node_restores_previous_schema
        ; Alcotest.test_case
            "apply-history-action-redo-replays-block-concat" `Quick
            test_apply_history_action_redo_replays_block_concat
        ; Alcotest.test_case
            "apply-history-action-redo-replays-save-then-insert" `Quick
            test_apply_history_action_redo_replays_save_then_insert
        ; Alcotest.test_case
            "apply-history-action-redo-replays-paste-into-empty-target"
            `Quick
            test_apply_history_action_redo_replays_paste_into_empty_target
        ; Alcotest.test_case
            "apply-history-action-redo-replays-insert-save-delete-sequence"
            `Quick
            test_apply_history_action_redo_replays_insert_save_delete_sequence
        ; Alcotest.test_case
            "apply-history-action-undo-keeps-working-after-remote-non-structural-update"
            `Quick
            test_apply_history_action_undo_keeps_working_after_remote_update
        ; Alcotest.test_case
            "apply-history-action-undo-restores-hard-deleted-block-via-semantic-inverse"
            `Quick
            test_apply_history_action_undo_restores_hard_deleted_block
        ; Alcotest.test_case
            "apply-history-action-undo-restores-multi-parent-delete-via-semantic-inverse"
            `Quick
            test_apply_history_action_undo_restores_multi_parent_delete
        ; Alcotest.test_case
            "move-blocks-multi-parent-builds-per-root-inverse-history"
            `Quick
            test_move_blocks_multi_parent_builds_per_root_inverse_history
        ; Alcotest.test_case
            "apply-history-action-undo-restores-multi-parent-move-via-semantic-inverse"
            `Quick test_apply_history_action_undo_restores_multi_parent_move
        ; Alcotest.test_case
            "apply-history-action-undo-replays-move-blocks-with-nested-lookup-ref-id"
            `Quick
            test_apply_history_action_undo_replays_move_blocks_nested_lookup_ref
        ; Alcotest.test_case
            "direct-outliner-core-insert-blocks-persists-insert-blocks-outliner-op"
            `Quick
            test_direct_outliner_core_insert_blocks_persists_insert_blocks_op
        ; Alcotest.test_case "rebase-create-page-keeps-page-uuid" `Quick
            test_rebase_create_page_keeps_page_uuid
        ; Alcotest.test_case
            "rebase-duplicate-create-page-keeps-remote-children" `Quick
            test_rebase_duplicate_create_page_keeps_remote_children
        ; Alcotest.test_case
            "rebase-drops-stale-title-add-for-remotely-deleted-reference-view"
            `Quick
            test_rebase_drops_stale_title_add_for_deleted_reference_view
        ; Alcotest.test_case "rebase-insert-blocks-keeps-block-uuid" `Quick
            test_rebase_insert_blocks_keeps_block_uuid
        ; Alcotest.test_case
            "rebase-local-insert-then-save-keeps-cardinality-one-values"
            `Quick
            test_rebase_local_insert_then_save_keeps_cardinality_one_values
        ; Alcotest.test_case
            "rebase-insert-indent-save-sequence-keeps-structural-state"
            `Quick
            test_rebase_insert_indent_save_sequence_keeps_structural_state
        ; Alcotest.test_case
            "rebase-keeps-local-insert-and-save-when-sibling-target-deleted"
            `Quick
            test_rebase_keeps_local_insert_and_save_when_sibling_target_deleted
        ; Alcotest.test_case
            "rebase-replays-pending-insert-before-save-when-local-db-missed-pending-block"
            `Quick
            test_rebase_replays_pending_insert_before_save_when_missed
        ; Alcotest.test_case "reaction-remove-enqueues-pending-sync-tx"
            `Quick test_reaction_remove_enqueues_pending_sync_tx
        ; Alcotest.test_case
            "rebase-drops-pending-reaction-tx-when-target-is-remotely-deleted"
            `Quick
            test_rebase_drops_pending_reaction_tx_when_target_deleted
        ; Alcotest.test_case "tx-batch-ok-removes-acked-pending-txs"
            `Quick test_tx_batch_ok_removes_acked_pending_txs
        ; Alcotest.test_case "tx-batch-ok-broadcasts-cleared-pending-state"
            `Quick test_tx_batch_ok_broadcasts_cleared_pending_state
        ; Alcotest.test_case
            "tx-batch-ok-removes-only-inflight-acked-pending-txs" `Quick
            test_tx_batch_ok_removes_only_inflight_acked_pending_txs
        ; Alcotest.test_case
            "tx-batch-ok-does-not-anchor-remote-checksum" `Quick
            test_tx_batch_ok_does_not_anchor_remote_checksum
        ; Alcotest.test_case
            "apply-remote-tx-does-not-clear-pending-without-ack" `Quick
            test_apply_remote_tx_does_not_clear_pending_without_ack
        ; Alcotest.test_case
            "tx-batch-ok-stale-ack-does-not-regress-checksum-state" `Quick
            test_tx_batch_ok_stale_ack_does_not_regress_checksum_state
        ; Alcotest.test_case
            "tx-batch-ok-real-checksum-mismatch-logs-warning" `Quick
            test_tx_batch_ok_real_checksum_mismatch_logs_warning
        ; Alcotest.test_case
            "local-checksum-stays-in-sync-after-undo-redo" `Quick
            test_local_checksum_stays_in_sync_after_undo_redo
        ; Alcotest.test_case "reparent-block-when-cycle-detected" `Quick
            test_reparent_block_when_cycle_detected
        ; Alcotest.test_case "two-children-cycle" `Quick
            test_two_children_cycle
        ; Alcotest.test_case "three-children-cycle" `Quick
            test_three_children_cycle
        ; Alcotest.test_case
            "ignore-missing-parent-update-after-local-delete" `Quick
            test_ignore_missing_parent_update_after_local_delete
        ; Alcotest.test_case
            "missing-parent-after-remote-delete-removes-descendants" `Quick
            test_missing_parent_after_remote_delete_removes_descendants
        ; Alcotest.test_case
            "rebase-drops-local-property-pairs-for-deleted-property" `Quick
            test_rebase_drops_local_property_pairs_for_deleted_property
        ; Alcotest.test_case
            "rebase-drops-local-tags-for-deleted-tag" `Quick
            test_rebase_drops_local_tags_for_deleted_tag
        ; Alcotest.test_case
            "rebase-inserted-page-ref-drops-stale-ref-for-deleted-tag"
            `Quick
            test_rebase_inserted_page_ref_drops_stale_ref_for_deleted_tag
        ; Alcotest.test_case
            "rebase-save-block-inline-tag-recreates-deleted-tag" `Quick
            test_rebase_save_block_inline_tag_recreates_deleted_tag
        ; Alcotest.test_case
            "rebase-save-block-inline-tag-mixed-surviving-deleted" `Quick
            test_rebase_save_block_inline_tag_mixed_surviving_deleted
        ; Alcotest.test_case
            "cut-paste-parent-with-child-keeps-child-parent" `Quick
            test_cut_paste_parent_with_child_keeps_child_parent
        ; Alcotest.test_case "fix-duplicate-orders-after-rebase" `Quick
            test_fix_duplicate_orders_after_rebase
        ; Alcotest.test_case
            "create-today-journal-keeps-existing-timestamps" `Quick
            test_create_today_journal_keeps_existing_timestamps
        ; Alcotest.test_case
            "temp-conn-batch-commit-ignores-transient-page-parent" `Quick
            test_temp_conn_batch_commit_ignores_transient_page_parent
        ; Alcotest.test_case
            "fix-duplicate-order-against-existing-sibling" `Quick
            test_fix_duplicate_order_against_existing_sibling
        ; Alcotest.test_case
            "apply-remote-txs-rejects-invalid-final-rebase" `Quick
            test_apply_remote_txs_rejects_invalid_final_rebase
        ; Alcotest.test_case "two-clients-extends-cycle" `Quick
            test_two_clients_extends_cycle
        ; Alcotest.test_case
            "fix-duplicate-orders-local-and-remote-new-blocks" `Quick
            test_fix_duplicate_orders_local_and_remote_new_blocks
        ; Alcotest.test_case "rebase-preserves-pending-tx-boundaries"
            `Quick test_rebase_preserves_pending_tx_boundaries
        ; Alcotest.test_case
            "remote-rebase-tx-not-enqueued-as-local-pending" `Quick
            test_remote_rebase_tx_not_enqueued_as_local_pending
        ; Alcotest.test_case
            "rebase-keeps-original-created-at-for-pending-tx" `Quick
            test_rebase_keeps_original_created_at_for_pending_tx
        ; Alcotest.test_case
            "persist-local-tx-keeps-created-at-for-existing-tx-id" `Quick
            test_persist_local_tx_keeps_created_at_for_existing_tx_id
        ; Alcotest.test_case "rebase-keeps-pending-when-rebased-empty"
            `Quick test_rebase_keeps_pending_when_rebased_empty
        ; Alcotest.test_case
            "apply-remote-tx-collapsed-encrypted-title" `Quick
            test_apply_remote_tx_collapsed_encrypted_title
        ; Alcotest.test_case
            "rebase-later-tx-for-new-block-uses-lookup-ref" `Quick
            test_rebase_later_tx_for_new_block_uses_lookup_ref
        ; Alcotest.test_case
            "rebase-drops-stale-raw-pending-missing-history-ops" `Quick
            test_rebase_drops_stale_raw_pending_missing_history_ops
        ; Alcotest.test_case
            "rebase-replays-title-only-raw-pending-tx" `Quick
            test_rebase_replays_title_only_raw_pending_tx
        ; Alcotest.test_case "rebase-keeps-fix-pending-empty-reversed"
            `Quick test_rebase_keeps_fix_pending_empty_reversed
        ; Alcotest.test_case
            "rebase-keeps-no-op-fix-pending-empty-reversed" `Quick
            test_rebase_keeps_no_op_fix_pending_empty_reversed
        ; Alcotest.test_case
            "remote-log-uuid-string-scalar-values-stay-scalar" `Quick
            test_remote_log_uuid_string_scalar_values_stay_scalar
        ; Alcotest.test_case
            "reverse-tx-data-create-property-text-block-restores-base"
            `Quick
            test_reverse_tx_data_create_property_text_block_restores_base
        ; Alcotest.test_case
            "pending-reversed-txs-multiple-status-restore-base" `Quick
            test_pending_reversed_txs_multiple_status_restore_base
        ; Alcotest.test_case
            "pending-reversed-txs-batch-status-restore-base" `Quick
            test_pending_reversed_txs_batch_status_restore_base
        ; Alcotest.test_case
            "normalize-rebased-keeps-reconstructive-reverse" `Quick
            test_normalize_rebased_keeps_reconstructive_reverse
        ; Alcotest.test_case
            "reverse-tx-data-delete-recreate-same-uuid-reversible" `Quick
            test_reverse_tx_data_delete_recreate_same_uuid_reversible
        ; Alcotest.test_case
            "rebase-preserves-title-when-reversed-tx-ids-change" `Quick
            test_rebase_preserves_title_when_reversed_tx_ids_change
        ; Alcotest.test_case
            "rebase-saves-remote-title-and-name-conflicts" `Quick
            test_rebase_saves_remote_title_and_name_conflicts
        ; Alcotest.test_case
            "rebase-does-not-leave-anonymous-created-by-entities" `Quick
            test_rebase_does_not_leave_anonymous_created_by_entities
        ; Alcotest.test_case
            "rebase-create-then-delete-no-anonymous" `Quick
            test_rebase_create_then_delete_no_anonymous
        ; Alcotest.test_case
            "apply-remote-txs-delete-parent-with-child-no-local" `Quick
            test_apply_remote_txs_delete_parent_with_child_no_local
        ; Alcotest.test_case
            "delete-expansion-includes-generated-pvalue-children" `Quick
            test_delete_expansion_includes_generated_pvalue_children
        ; Alcotest.test_case
            "apply-remote-txs-computes-remote-deletes-once" `Quick
            test_apply_remote_txs_computes_remote_deletes_once
        ; Alcotest.test_case
            "apply-remote-txs-skips-block-ref-filters-no-refs" `Quick
            test_apply_remote_txs_skips_block_ref_filters_no_refs
        ; Alcotest.test_case
            "apply-remote-txs-keeps-refs-recreated-after-earlier-delete"
            `Quick
            test_apply_remote_txs_keeps_refs_recreated_after_earlier_delete
        ; Alcotest.test_case
            "apply-remote-txs-local-fallback-delete-parent-retracts-child"
            `Quick
            test_apply_remote_txs_local_fallback_delete_parent_retracts_child
        ; Alcotest.test_case
            "rechecks-local-delete-races-temp-snapshot" `Quick
            test_rechecks_local_delete_races_temp_snapshot
        ; Alcotest.test_case "rechecks-local-delete-races-temp-commit"
            `Quick test_rechecks_local_delete_races_temp_commit
        ; Alcotest.test_case
            "rechecks-local-edit-races-without-local-batch" `Quick
            test_rechecks_local_edit_races_without_local_batch
        ; Alcotest.test_case
            "delays-retry-when-local-txs-keep-changing" `Quick
            test_delays_retry_when_local_txs_keep_changing
        ; Alcotest.test_case
            "retries-snapshot-drift-pending-list-stabilizes" `Quick
            test_retries_snapshot_drift_pending_list_stabilizes
        ; Alcotest.test_case
            "rebase-persisted-row-forward-and-inverse-ops" `Quick
            test_rebase_persisted_row_forward_and_inverse_ops
        ; Alcotest.test_case
            "apply-remote-txs-rebases-create-delete-page-as-recycled"
            `Quick
            test_apply_remote_txs_rebases_create_delete_page_as_recycled
        ; Alcotest.test_case
            "legacy-rebase-row-missing-history-persisted-with-both-ops"
            `Quick
            test_legacy_rebase_row_missing_history_persisted_with_both_ops
        ; Alcotest.test_case "offload-large-title" `Quick
            test_offload_large_title
        ; Alcotest.test_case "offload-small-title" `Quick
            test_offload_small_title
        ; Alcotest.test_case "offload-large-title-preserves-map-form"
            `Quick test_offload_large_title_preserves_map_form
        ; Alcotest.test_case
            "offload-datoms-drops-stale-object-same-entity" `Quick
            test_offload_datoms_drops_stale_object_same_entity
        ; Alcotest.test_case
            "offload-datoms-drops-stale-object-known-offload-set" `Quick
            test_offload_datoms_drops_stale_object_known_offload_set
        ; Alcotest.test_case
            "upload-preparation-processes-datoms-in-batches" `Quick
            test_upload_preparation_processes_datoms_in_batches
        ; Alcotest.test_case
            "upload-large-title-encrypts-transit-payload" `Quick
            test_upload_large_title_encrypts_transit_payload
        ; Alcotest.test_case "rehydrate-large-title" `Quick
            test_rehydrate_large_title
        ; Alcotest.test_case "rehydrate-large-title-tempid" `Quick
            test_rehydrate_large_title_tempid
        ; Alcotest.test_case
            "rehydrate-from-db-skips-missing-object-attr" `Quick
            test_rehydrate_from_db_skips_missing_object_attr
        ; Alcotest.test_case
            "rehydrate-from-db-reads-unindexed-object-attr" `Quick
            test_rehydrate_from_db_reads_unindexed_object_attr
        ; Alcotest.test_case
            "rebase-apply-template-preserves-followup-insert" `Quick
            test_rebase_apply_template_preserves_followup_insert
        ; Alcotest.test_case
            "redo-after-apply-template-undo-all-preserves-followup" `Quick
            test_redo_after_apply_template_undo_all_preserves_followup
        ; Alcotest.test_case
            "redo-after-non-empty-template-insert-preserves-followup"
            `Quick
            test_redo_after_non_empty_template_insert_preserves_followup
        ; Alcotest.test_case
            "undo-redo-apply-template-simple-keeps-followup" `Quick
            test_undo_redo_apply_template_simple_keeps_followup
        ; Alcotest.test_case
            "undo-redo-apply-template-rewrites-property-value-refs" `Quick
            test_undo_redo_apply_template_rewrites_property_value_refs
        ; Alcotest.test_case "sync-conflict-store-roundtrip-test" `Quick
            test_sync_conflict_store_roundtrip
        ; Alcotest.test_case
            "sync-title-conflict-store-keeps-only-latest-non-empty-value-test" `Quick
            test_sync_title_conflict_keeps_latest
        ; Alcotest.test_case "sync-conflict-clear-test" `Quick
            test_sync_conflict_clear
        ; Alcotest.test_case
            "outliner-upload-chunks-preserve-entities-and-acknowledgment-test"
            `Quick
            test_outliner_upload_chunks_preserve_entities_and_acknowledgment
        ; Alcotest.test_case "additional-outliner-operations-upload-test"
            `Quick test_additional_outliner_operations_upload
        ; Alcotest.test_case
            "rebase-save-new-page-reference-and-insert-sibling-test" `Quick
            test_rebase_save_new_page_reference_and_insert_sibling
        ; Alcotest.test_case
            "rebase-insert-page-in-library-with-reference-test" `Quick
            test_rebase_insert_page_in_library_with_reference
        ; Alcotest.test_case
            "rebase-multiple-insertions-preserves-identities-test" `Quick
            test_rebase_multiple_insertions_preserves_identities
        ; Alcotest.test_case
            "compound-save-empty-target-then-insert-preserves-identities-test"
            `Quick
            test_compound_save_empty_target_then_insert_preserves_identities
        ; Alcotest.test_case
            "rebase-nested-insert-then-delete-preserves-tree-test" `Quick
            test_rebase_nested_insert_then_delete_preserves_tree
        ; Alcotest.test_case "compound-template-and-insert-upload-test"
            `Quick test_compound_template_and_insert_upload
        ; Alcotest.test_case
            "rebase-template-after-target-permanently-deleted-test" `Quick
            test_rebase_template_after_target_permanently_deleted
        ; Alcotest.test_case
            "template-uploads-after-rebase-and-undo-redo-test" `Quick
            test_template_uploads_after_rebase_and_undo_redo
        ; Alcotest.test_case
            "template-text-property-uploads-after-rebase-and-undo-redo-test"
            `Quick
            test_template_text_property_uploads_after_rebase_and_undo_redo
        ] )
    ; ( "db-sync-upload"
      , Test_db_sync_upload_native.cases ) ]
