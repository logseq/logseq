(* frontend.worker.sync.client-op — client sync metadata + ops persisted in
   the per-repo client-ops sqlite db (Sync_state.client_ops_conn). *)

open Datascript

let sync_meta_sql =
  "create table if not exists sync_meta (key text primary key, value text)"

let client_ops_sql =
  "create table if not exists client_ops ("
  ^ "id integer primary key autoincrement,"
  ^ "kind text not null,"
  ^ "created_at integer not null,"
  ^ "tx_id text unique,"
  ^ "pending integer not null default 0,"
  ^ "failed integer not null default 0,"
  ^ "outliner_op text,"
  ^ "undo_redo text,"
  ^ "forward_outliner_ops text,"
  ^ "inverse_outliner_ops text,"
  ^ "inferred_outliner_ops integer,"
  ^ "normalized_tx_data text,"
  ^ "reversed_tx_data text,"
  ^ "asset_uuid text,"
  ^ "asset_op text,"
  ^ "asset_t integer,"
  ^ "asset_value text"
  ^ ")"

let pending_index_sql =
  "create index if not exists idx_client_ops_pending_created on client_ops(kind, pending, created_at, id)"

let asset_index_sql =
  "create index if not exists idx_client_ops_asset_uuid on client_ops(kind, asset_uuid)"

let sync_conflicts_sql =
  "create table if not exists sync_conflicts ("
  ^ "id integer primary key autoincrement,"
  ^ "block_uuid text not null,"
  ^ "attr text not null,"
  ^ "value text not null,"
  ^ "remote_t integer,"
  ^ "created_at integer not null,"
  ^ "unique(block_uuid, attr, value)"
  ^ ")"

let sync_conflicts_index_sql =
  "create index if not exists idx_sync_conflicts_block_uuid on sync_conflicts(block_uuid, created_at)"

let schema_ready : (string, unit) Hashtbl.t = Hashtbl.create 7

(* every ":memory:" database shares the same filename — track readiness by
   connection identity there *)
let schema_ready_mem : Sqlite.db list ref = ref []

let ensure_schema (db : Sqlite.db) =
  let f = Sqlite.filename db in
  let in_mem = f = ":memory:" in
  let ready =
    if in_mem then List.exists (fun d -> d == db) !schema_ready_mem
    else Hashtbl.mem schema_ready f
  in
  if not ready then begin
    Sqlite.transaction db (fun () ->
        Sqlite.exec db ~sql:sync_meta_sql ~bind:[||];
        Sqlite.exec db ~sql:client_ops_sql ~bind:[||];
        Sqlite.exec db ~sql:sync_conflicts_sql ~bind:[||];
        Sqlite.exec db ~sql:pending_index_sql ~bind:[||];
        Sqlite.exec db ~sql:asset_index_sql ~bind:[||];
        Sqlite.exec db ~sql:sync_conflicts_index_sql ~bind:[||]);
    if in_mem then schema_ready_mem := db :: !schema_ready_mem
    else Hashtbl.replace schema_ready f ()
  end

(* run! / rows / row helpers over the sync Sqlite surface *)
let run db sql params = Sqlite.exec db ~sql ~bind:(Array.of_list params)
let rows db sql params = Sqlite.query db ~sql ~bind:(Array.of_list params)

let row db sql params =
  match rows db sql params with
  | r :: _ -> Some r
  | [] -> None

let col (r : Sqlite.row) i =
  if i < Array.length r then r.(i) else Sqlite.Null

let col_text r i =
  match col r i with
  | Sqlite.Text s -> s
  | Sqlite.Blob s -> s
  | _ -> invalid_arg "expected text column"

let col_text_opt r i =
  match col r i with
  | Sqlite.Text s | Sqlite.Blob s -> Some s
  | _ -> None

let col_int r i =
  match col r i with
  | Sqlite.Integer n -> Int64.to_int n
  | Sqlite.Float f -> int_of_float f
  | _ -> 0

let col_int_opt r i =
  match col r i with
  | Sqlite.Integer n -> Some (Int64.to_int n)
  | Sqlite.Float f -> Some (int_of_float f)
  | _ -> None

let text s = Sqlite.Text s
let int n = Sqlite.Integer (Int64.of_int n)
let text_opt = function Some s -> Sqlite.Text s | None -> Sqlite.Null

let parse_uuid_str s =
  if Sync_state.uuid_string s then Some s else None

let kw_to_str = function
  | None -> None
  | Some s ->
      (match String.index_opt s '/' with
       | Some _ -> Some s
       | None -> Some s)

(* sqlite-util/read-transit-str / write-transit-str over Wire.t *)
let read_transit s = Transit_codec.of_string s
let write_transit v = Transit_codec.to_string v

(* normalize-op-entries: cljs wraps a single op vector [[kw ...]] *)
let normalize_op_entries (ops : Wire.t) : Wire.t list =
  match ops with
  | Wire.Nil -> []
  | Wire.Array xs | Wire.List xs ->
      (* cljs: if first is kw and second is vector, wrap whole thing *)
      (match (xs, List.nth_opt xs 0, List.nth_opt xs 1) with
       | _, Some (Wire.Keyword _), Some (Wire.Array _ | Wire.List _) -> [ ops ]
       | _ -> xs)
  | _ -> []

(* sqlite-store-or-throw *)
let store repo : Sqlite.db =
  let db = Sync_state.client_ops_conn repo in
  ensure_schema db;
  db

let get_meta db k =
  match row db "select value from sync_meta where key = ?" [ text k ] with
  | Some r -> col_text_opt r 0
  | None -> None

let set_meta db k v =
  run db
    "insert into sync_meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value"
    [ text k; text v ]

let update_graph_uuid repo graph_uuid =
  match graph_uuid with
  | None -> invalid_arg "update-graph-uuid: nil uuid"
  | Some u -> set_meta (store repo) "graph-uuid" u

let get_graph_uuid repo = get_meta (store repo) "graph-uuid"

let get_local_tx repo : int option =
  match get_meta (store repo) "local-tx" with
  | Some s -> int_of_string_opt s
  | None -> None

let update_local_tx repo (t : int) =
  if t < 0 then invalid_arg "local-tx must be >= 0";
  let st = store repo in
  (match get_local_tx repo with
   | Some prev when t < prev ->
       raise
         (Dispatcher.Exn_info ("local-tx should be monotonically increasing",
            [ (Wire.Keyword "repo", Wire.String repo)
            ; (Wire.Keyword "prev-t", Wire.Int prev)
            ; (Wire.Keyword "new-t", Wire.Int t) ]))
   | _ -> ());
  set_meta st "local-tx" (string_of_int t)

let reset_local_tx repo = set_meta (store repo) "local-tx" "0"

let update_local_checksum repo checksum =
  set_meta (store repo) "db-sync/checksum" checksum

let get_local_checksum repo = get_meta (store repo) "db-sync/checksum"

let get_pending_local_tx_count repo : int =
  match Worker_state.pending_local_tx_count repo with
  | Some cached -> cached
  | None ->
    let c =
      match
        row (store repo)
          "select count(*) as c from client_ops where kind = 'tx' and pending = 1"
          []
      with
      | Some r -> col_int r 0
      | None -> 0
    in
    Worker_state.set_pending_local_tx_count repo c;
    c

let adjust_pending_local_tx_count repo delta =
  let base = get_pending_local_tx_count repo in
  Worker_state.set_pending_local_tx_count repo (max 0 (base + delta))

let rtc_db_graph repo =
  Runtime_env.kind () = Runtime_env.Node || get_graph_uuid repo <> None

(* ---- pending local txs ---- *)

type local_tx_entry =
  { tx_id : string
  ; outliner_op : string option
  ; forward_outliner_ops : Wire.t list
  ; inverse_outliner_ops : Wire.t list
  ; inferred_outliner_ops : bool
  ; undo_redo : string option
  ; tx : Wire.t
  ; reversed_tx : Wire.t
  }

let int_to_bool i = i <> 0

let row_to_pending_local_tx (r : Sqlite.row) : local_tx_entry option =
  match col_text_opt r 0 with
  | Some tx_id ->
      let ops i =
        match col_text_opt r i with
        | Some s -> normalize_op_entries (read_transit s)
        | None -> []
      in
      Some
        { tx_id
        ; outliner_op = col_text_opt r 1
        ; undo_redo = col_text_opt r 2
        ; forward_outliner_ops = ops 3
        ; inverse_outliner_ops = ops 4
        ; inferred_outliner_ops = int_to_bool (col_int r 5)
        ; tx = (match col_text_opt r 6 with Some s -> read_transit s | None -> Wire.Array [])
        ; reversed_tx =
            (match col_text_opt r 7 with Some s -> read_transit s | None -> Wire.Array [])
        }
  | None -> None

let pending_tx_select =
  "select tx_id, outliner_op, undo_redo, forward_outliner_ops, inverse_outliner_ops, inferred_outliner_ops, normalized_tx_data, reversed_tx_data from client_ops where kind = 'tx'"

type upsert_result = { created_at : int; should_inc_pending : bool }

let upsert_local_tx_entry repo ~(tx_id : string) ?created_at ?(pending = true)
    ?(failed = false) ~outliner_op ~undo_redo ~forward_outliner_ops
    ~inverse_outliner_ops ~inferred_outliner_ops ~normalized_tx_data
    ~reversed_tx_data () : upsert_result =
  let st = store repo in
  let existing =
    row st
      "select pending, created_at from client_ops where kind = 'tx' and tx_id = ?"
      [ text tx_id ]
  in
  let should_inc_pending =
    match existing with
    | Some r -> col_int r 0 <> 1
    | None -> true
  in
  let created_at' =
    match existing with
    | Some r -> col_int r 1
    | None ->
        (match created_at with
         | Some c -> c
         | None -> int_of_float (Clock.now_ms ()))
  in
  let b i = Sqlite.Integer (Int64.of_int (if i then 1 else 0)) in
  run st
    ("insert into client_ops (kind, created_at, tx_id, pending, failed, outliner_op, undo_redo, "
     ^ "forward_outliner_ops, inverse_outliner_ops, inferred_outliner_ops, "
     ^ "normalized_tx_data, reversed_tx_data) "
     ^ "values ('tx', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
     ^ "on conflict(tx_id) do update set created_at = excluded.created_at, pending = excluded.pending, "
     ^ "failed = excluded.failed, outliner_op = excluded.outliner_op, undo_redo = excluded.undo_redo, "
     ^ "forward_outliner_ops = excluded.forward_outliner_ops, inverse_outliner_ops = excluded.inverse_outliner_ops, "
     ^ "inferred_outliner_ops = excluded.inferred_outliner_ops, normalized_tx_data = excluded.normalized_tx_data, "
     ^ "reversed_tx_data = excluded.reversed_tx_data")
    [ int created_at'
    ; text tx_id
    ; b pending
    ; b failed
    ; text_opt (kw_to_str outliner_op)
    ; text_opt (kw_to_str undo_redo)
    ; text (write_transit (Wire.Array forward_outliner_ops))
    ; text (write_transit (Wire.Array inverse_outliner_ops))
    ; b inferred_outliner_ops
    ; text (write_transit normalized_tx_data)
    ; text (write_transit reversed_tx_data)
    ];
  { created_at = created_at'; should_inc_pending = should_inc_pending }

let get_local_tx_entry repo (tx_id : string) : local_tx_entry option =
  if not (Sync_state.uuid_string tx_id) then None
  else
    match
      row (store repo)
        (pending_tx_select ^ " and tx_id = ? limit 1")
        [ text tx_id ]
    with
    | Some r -> row_to_pending_local_tx r
    | None -> None

let get_pending_local_txs repo ?(limit : int option) () : local_tx_entry list =
  let sql =
    pending_tx_select
    ^ " and pending = 1 order by created_at asc, id asc"
    ^ (match limit with Some _ -> " limit ?" | None -> "")
  in
  let params = match limit with Some n -> [ int n ] | None -> [] in
  rows (store repo) sql params
  |> List.filter_map row_to_pending_local_tx

(* ---- sync_conflicts ---- *)

type sync_conflict =
  { id : int
  ; block_uuid : string
  ; attr : string
  ; value : string
  ; remote_t : int option
  ; created_at : int
  }

let add_sync_conflicts repo (conflicts : (string * string * string * int) list) =
  let st = store repo in
  let now = int_of_float (Clock.now_ms ()) in
  List.iter
    (fun (block_uuid, attr, value, remote_t) ->
       if Sync_state.uuid_string block_uuid then begin
         run st "delete from sync_conflicts where block_uuid = ? and attr = ?"
           [ text block_uuid; text attr ];
         if value <> "" then
           run st
             ("insert into sync_conflicts (block_uuid, attr, value, remote_t, created_at) "
              ^ "values (?, ?, ?, ?, ?) on conflict(block_uuid, attr, value) do update set "
              ^ "remote_t = excluded.remote_t, created_at = excluded.created_at")
             [ text block_uuid; text attr; text value; int remote_t; int now ]
       end)
    conflicts

let conflict_row r =
  { id = col_int r 0
  ; block_uuid = col_text r 1
  ; attr = col_text r 2
  ; value = col_text r 3
  ; remote_t = col_int_opt r 4
  ; created_at = col_int r 5
  }

let get_all_sync_conflicts repo : sync_conflict list =
  rows (store repo)
    "select id, block_uuid, attr, value, remote_t, created_at from sync_conflicts order by created_at desc, id desc"
    []
  |> List.map conflict_row

let get_sync_conflicts repo (block_uuid : string) : sync_conflict list =
  if not (Sync_state.uuid_string block_uuid) then []
  else
    rows (store repo)
      "select id, block_uuid, attr, value, remote_t, created_at from sync_conflicts where block_uuid = ? order by created_at desc, id desc"
      [ text block_uuid ]
    |> List.map conflict_row

let clear_sync_conflicts repo (block_uuid : string) =
  if Sync_state.uuid_string block_uuid then
    run (store repo) "delete from sync_conflicts where block_uuid = ?"
      [ text block_uuid ]

let pending_tx_id st tx_id =
  match
    row st "select pending from client_ops where kind = 'tx' and tx_id = ?"
      [ text tx_id ]
  with
  | Some r -> col_int r 0 = 1
  | None -> false

let mark_pending_txs_false repo (tx_ids : string list) : int =
  let st = store repo in
  let ids = List.filter Sync_state.uuid_string tx_ids in
  let n = List.length (List.filter (pending_tx_id st) ids) in
  List.iter
    (fun id ->
       run st "update client_ops set pending = 0 where kind = 'tx' and tx_id = ?"
         [ text id ])
    ids;
  n

let mark_failed_txs repo (tx_ids : string list) : int =
  let st = store repo in
  let ids = List.filter Sync_state.uuid_string tx_ids in
  let n = List.length (List.filter (pending_tx_id st) ids) in
  List.iter
    (fun id ->
       run st
         "update client_ops set pending = 0, failed = 1 where kind = 'tx' and tx_id = ?"
         [ text id ])
    ids;
  n

(* client-op/history-action-ops-by-tx-id — feeds Undo_redo hook *)
(* apply-txs/clear-pending-txs! — mark every pending tx non-pending *)
let clear_pending_txs repo : int =
  let ids =
    List.filter_map
      (fun (e : local_tx_entry) -> Some e.tx_id)
      (get_pending_local_txs repo ())
  in
  mark_pending_txs_false repo ids

let history_action_ops_by_tx_id repo (tx_id : string)
    : (string * Wire.t) list option =
  match get_local_tx_entry repo tx_id with
  | Some e ->
      let ops_or_nil = function [] -> Wire.Nil | ops -> Wire.Array ops in
      Some
        [ "db-sync/forward-outliner-ops", ops_or_nil e.forward_outliner_ops
        ; "db-sync/inverse-outliner-ops", ops_or_nil e.inverse_outliner_ops ]
  | None -> None

(* ---- asset ops ---- *)

(* local-asset-op-map: {:block/uuid u :update-asset|:remove-asset [kw t value]} *)
let local_asset_op_map op_type t (value : Wire.t) : Wire.t =
  let asset_uuid =
    match Wire.get "block-uuid" value with
    | Some (Wire.Uuid u | Wire.String u) -> u
    | _ -> invalid_arg "asset op missing :block-uuid"
  in
  Wire.Map
    [ Wire.Keyword "block/uuid", Wire.Uuid asset_uuid
    ; Wire.Keyword op_type
    , Wire.Array [ Wire.Keyword op_type; Wire.Int t; value ] ]

let asset_op_by_uuid st (block_uuid : string) : Wire.t option =
  match
    row st
      "select asset_uuid, asset_op, asset_t, asset_value from client_ops where kind = 'asset' and asset_uuid = ? limit 1"
      [ text block_uuid ]
  with
  | Some r ->
      let op_type = col_text r 1 in
      let t = col_int r 2 in
      let value =
        match col_text_opt r 3 with
        | Some s -> read_transit s
        | None -> Wire.Map [ Wire.Keyword "block-uuid", Wire.Uuid block_uuid ]
      in
      Some (local_asset_op_map op_type t value)
  | None -> None

let upsert_asset_op st (op_type : string) (t : int) (value : Wire.t) =
  let block_uuid =
    match Wire.get "block-uuid" value with
    | Some (Wire.Uuid u | Wire.String u) -> u
    | _ -> invalid_arg "asset op missing :block-uuid"
  in
  Sqlite.transaction st (fun () ->
      run st "delete from client_ops where kind = 'asset' and asset_uuid = ?"
        [ text block_uuid ];
      run st
        "insert into client_ops (kind, created_at, asset_uuid, asset_op, asset_t, asset_value) values ('asset', ?, ?, ?, ?, ?)"
        [ int (int_of_float (Clock.now_ms ()))
        ; text block_uuid
        ; text op_type
        ; int t
        ; text (write_transit value) ])

(* add-asset-ops: ops are [op-kw t {:block-uuid ...}] wire forms *)
let add_asset_ops repo (ops : Wire.t list) =
  let st = store repo in
  List.iter
    (fun op ->
       match Wire.as_seq op with
       | [ Wire.Keyword op_type; t_w; value ] ->
           let t = Option.value (Wire.as_int t_w) ~default:0 in
           let existing =
             match Wire.get "block-uuid" value with
             | Some (Wire.Uuid u | Wire.String u) -> asset_op_by_uuid st u
             | _ -> None
           in
           let existing_t k =
             match existing with
             | Some m ->
                 (match Wire.get k m with
                  | Some v ->
                      (match Wire.as_seq v with
                       | [ _; tw; _ ] -> Option.value (Wire.as_int tw) ~default:0
                       | _ -> 0)
                  | None -> 0)
             | None -> 0
           in
           (match op_type with
            | "update-asset" ->
                (* skip if an existing remove-op has t > this t *)
                if not (existing_t "remove-asset" > t) then
                  upsert_asset_op st "update-asset" t value
            | "remove-asset" ->
                if not (existing_t "update-asset" > t) then
                  upsert_asset_op st "remove-asset" t value
            | _ -> ())
       | _ -> ())
    ops

let add_all_exists_asset_as_ops repo =
  match Worker_state.datascript_conn repo with
  | None -> invalid_arg (Printf.sprintf "no datascript conn for %s" repo)
  | Some conn ->
      let db = Conn.db conn in
      let uuids =
        datoms db Avet ~a:"logseq.property.asset/type" ()
        |> Seq.filter_map (fun (d : datom) ->
               match find_datom db Eavt ~e:d.e ~a:"block/uuid" () with
               | Some ud ->
                   (match ud.v with Uuid u | String u -> Some u | _ -> None)
               | None -> None)
        |> List.of_seq
        |> List.sort_uniq String.compare
      in
      add_asset_ops repo
        (List.map
           (fun u ->
              Wire.Array
                [ Wire.Keyword "update-asset"; Wire.Int 1
                ; Wire.Map [ Wire.Keyword "block-uuid", Wire.Uuid u ] ])
           uuids)

let get_unpushed_asset_ops_count repo : int =
  match
    row (store repo)
      "select count(*) as c from client_ops where kind = 'asset'" []
  with
  | Some r -> col_int r 0
  | None -> 0

let get_all_asset_ops repo : Wire.t list =
  rows (store repo)
    "select asset_op, asset_t, asset_value from client_ops where kind = 'asset' order by id asc"
    []
  |> List.filter_map (fun r ->
         let op_type = col_text_opt r 0 in
         let t = col_int r 1 in
         match (op_type, col_text_opt r 2) with
         | Some op_type, Some s ->
             let value = read_transit s in
             (match Wire.get "block-uuid" value with
              | Some _ -> Some (local_asset_op_map op_type t value)
              | None -> None)
         | _ -> None)

let remove_asset_op repo (asset_uuid : string) =
  run (store repo)
    "delete from client_ops where kind = 'asset' and asset_uuid = ?"
    [ text asset_uuid ]

let cleanup_finished_history_ops repo (protected_tx_ids : string list) : int =
  let st = store repo in
  let protected_set = protected_tx_ids in
  let ids =
    rows st
      "select tx_id from client_ops where kind = 'tx' and pending = 0 and tx_id is not null"
      []
    |> List.filter_map (fun r ->
           match col_text_opt r 0 with
           | Some id when not (List.mem id protected_set) -> Some id
           | _ -> None)
  in
  List.iter
    (fun id ->
       run st "delete from client_ops where kind = 'tx' and tx_id = ?"
         [ text id ])
    ids;
  List.length ids
