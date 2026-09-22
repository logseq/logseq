let datascript_conns : (string, Datascript.conn) Hashtbl.t = Hashtbl.create 7

(* cljs worker-state/*sqlite-conns* — (repo, kind) -> db *)
type db_kind =
  | Db
  | Search
  | Client_ops

let sqlite_conns : (string * db_kind, Sqlite.db) Hashtbl.t = Hashtbl.create 7

let datascript_conn repo = Hashtbl.find_opt datascript_conns repo
let set_datascript_conn repo conn = Hashtbl.replace datascript_conns repo conn
let drop_datascript_conn repo = Hashtbl.remove datascript_conns repo

let sqlite_conn_of repo kind = Hashtbl.find_opt sqlite_conns (repo, kind)
let set_sqlite_conn_of repo kind db = Hashtbl.replace sqlite_conns (repo, kind) db
let drop_sqlite_conn_of repo kind = Hashtbl.remove sqlite_conns (repo, kind)

let sqlite_conn repo = sqlite_conn_of repo Db
let set_sqlite_conn repo db = set_sqlite_conn_of repo Db db
let drop_sqlite_conn repo = drop_sqlite_conn_of repo Db

let repos () =
  Hashtbl.fold
    (fun (repo, kind) _ acc ->
       if kind = Db && not (List.mem repo acc) then repo :: acc else acc)
    sqlite_conns []

let close_other_sqlite_conns keep_repo =
  Hashtbl.iter
    (fun (repo, kind) db ->
      if repo <> keep_repo then begin
        (try Sqlite.close db with _ -> ());
        drop_sqlite_conn_of repo kind;
        if kind = Db then drop_datascript_conn repo
      end)
    sqlite_conns

(* cljs worker-state/*vector-indexes* *)
let vector_indexes : (string, Vector_index.index) Hashtbl.t = Hashtbl.create 7
let vector_index repo = Hashtbl.find_opt vector_indexes repo
let set_vector_index repo idx = Hashtbl.replace vector_indexes repo idx
let drop_vector_index repo = Hashtbl.remove vector_indexes repo

(* cljs worker-state/*search-index-build-ids* /
   *vector-index-rebuild-ids* — repo -> build id *)
let search_index_build_ids : (string, string) Hashtbl.t = Hashtbl.create 7
let vector_index_rebuild_ids : (string, string) Hashtbl.t = Hashtbl.create 7

let search_index_build_id repo = Hashtbl.find_opt search_index_build_ids repo
let set_search_index_build_id repo id = Hashtbl.replace search_index_build_ids repo id
let clear_search_index_build_id repo = Hashtbl.remove search_index_build_ids repo
let vector_index_rebuild_id repo = Hashtbl.find_opt vector_index_rebuild_ids repo
let set_vector_index_rebuild_id repo id = Hashtbl.replace vector_index_rebuild_ids repo id
let clear_vector_index_rebuild_id repo = Hashtbl.remove vector_index_rebuild_ids repo

(* cljs worker-state/*publishing? *)
let publishing_ref = ref false
let publishing () = !publishing_ref
let set_publishing b = publishing_ref := b

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

(* :db/latest-transact-time per repo *)
let db_latest_tx_time : (string, float) Hashtbl.t = Hashtbl.create 7

let set_db_latest_tx_time repo =
  Hashtbl.replace db_latest_tx_time repo (Date_time_util.time_ms () |> Int64.to_float)

let db_latest_tx_time_get repo = Hashtbl.find_opt db_latest_tx_time repo
