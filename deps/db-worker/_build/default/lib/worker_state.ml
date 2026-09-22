let datascript_conns : (string, Datascript.conn) Hashtbl.t = Hashtbl.create 7
let sqlite_conns : (string, Sqlite.db) Hashtbl.t = Hashtbl.create 7

let datascript_conn repo = Hashtbl.find_opt datascript_conns repo
let set_datascript_conn repo conn = Hashtbl.replace datascript_conns repo conn
let drop_datascript_conn repo = Hashtbl.remove datascript_conns repo

let sqlite_conn repo = Hashtbl.find_opt sqlite_conns repo
let set_sqlite_conn repo db = Hashtbl.replace sqlite_conns repo db
let drop_sqlite_conn repo = Hashtbl.remove sqlite_conns repo

let repos () = Hashtbl.fold (fun repo _ acc -> repo :: acc) sqlite_conns []

let close_other_sqlite_conns keep_repo =
  Hashtbl.iter
    (fun repo db ->
      if repo <> keep_repo then begin
        (try Sqlite.close db with _ -> ());
        drop_sqlite_conn repo;
        drop_datascript_conn repo
      end)
    sqlite_conns

(* :worker/context *)
let current_context : Wire.t ref = ref (Wire.kw_map [])

let context () = !current_context

let merge_context t =
  match t with
  | Wire.Map kvs ->
      let merged =
        match !current_context with
        | Wire.Map cur ->
            List.fold_left
              (fun acc (k, v) ->
                let without = List.remove_assoc k acc in
                (k, v) :: without)
              cur kvs
        | _ -> kvs
      in
      current_context := Wire.Map merged
  | _ -> ()

let set_context t = current_context := t

(* worker-state/*state keyed by qualified keyword name *)
let app_state : (string, Wire.t) Hashtbl.t = Hashtbl.create 17

let state_key_name = function
  | Wire.Keyword s | Wire.Symbol s -> s
  | Wire.String s -> s
  | t -> Transit_codec.to_string t

let state_get k = Hashtbl.find_opt app_state k

let merge_state t =
  match t with
  | Wire.Map kvs ->
      List.iter
        (fun (k, v) -> Hashtbl.replace app_state (state_key_name k) v)
        kvs
  | _ -> ()

(* thread atoms *)
let thread_atom_names =
  [ "thread-atom/online-event"; "thread-atom/search-input-idle-status" ]

let thread_atoms : (string, Wire.t ref) Hashtbl.t = Hashtbl.create 7

let () =
  List.iter (fun n -> Hashtbl.replace thread_atoms n (ref Wire.Nil)) thread_atom_names

let update_thread_atom key v =
  match Hashtbl.find_opt thread_atoms key with
  | Some cell -> cell := v
  | None -> invalid_arg ("not a thread-atom key: " ^ key)

let thread_atom key = Option.map (fun r -> !r) (Hashtbl.find_opt thread_atoms key)

(* db-sync config *)
let db_sync_config_ref : Wire.t ref = ref Wire.Nil
let set_db_sync_config t = db_sync_config_ref := t
let db_sync_config () = !db_sync_config_ref

(* ui-request deferreds *)
let ui_requests :
    (string, (Wire.t, Wire.t) result Db_worker_effect.resolver) Hashtbl.t =
  Hashtbl.create 17

let ui_request_put id r = Hashtbl.replace ui_requests id r

let ui_request_take id =
  match Hashtbl.find_opt ui_requests id with
  | Some r ->
      Hashtbl.remove ui_requests id;
      Some r
  | None -> None

let ui_request_ids () = Hashtbl.fold (fun k _ acc -> k :: acc) ui_requests []

(* deleted block uuid -> db-id *)
let deleted_blocks : (string, int) Hashtbl.t = Hashtbl.create 17
let deleted_block_uuid_to_db_id () = deleted_blocks
let reset_deleted_blocks () = Hashtbl.reset deleted_blocks

(* pending local tx counts *)
let pending_tx : (string, int) Hashtbl.t = Hashtbl.create 7
let pending_local_tx_count repo = Option.value (Hashtbl.find_opt pending_tx repo) ~default:0
let set_pending_local_tx_count repo n = Hashtbl.replace pending_tx repo n
let drop_pending_local_tx_count repo = Hashtbl.remove pending_tx repo
