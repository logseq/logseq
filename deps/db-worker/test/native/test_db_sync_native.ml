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
  Fun.protect f ~finally:(fun () ->
      Hashtbl.reset Worker_state.app_state;
      Hashtbl.iter (Hashtbl.replace Worker_state.app_state) state_prev;
      Worker_state.set_db_sync_config cfg_prev;
      Sync_util.auth_token_fn := auth_token_prev;
      Sync_auth.id_token_expired_fn := id_token_expired_prev;
      Sync_util.parse_jwt_fn := parse_jwt_prev)

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
      ~options:
        { Db_test_util.default_options with
          pages_and_blocks =
            [ { Db_test_util.page = Db_test_util.default_page
              ; blocks =
                  [ { Db_test_util.default_block with
                      b_title = Some "parent"
                    ; b_children =
                        [ { Db_test_util.default_block with
                            b_title = Some "child 1" }
                        ; { Db_test_util.default_block with
                            b_title = Some "child 2" }
                        ; { Db_test_util.default_block with
                            b_title = Some "child 3" } ] } ] } ] } ()
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
      ~options:
        { Db_test_util.default_options with
          pages_and_blocks =
            [ { Db_test_util.page = Db_test_util.default_page
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
                            b_title = Some "b child 2" } ] } ] } ] } ()
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
            `Quick test_presence_message_updates_other_user ] ) ]
