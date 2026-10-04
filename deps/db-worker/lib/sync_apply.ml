(* frontend.worker.sync.apply-txs — pending tx persistence, the local-tx
   enqueue/upload pipeline, and the shared tx-item/pending helpers used
   by Sync_replay (remote tx application, pending replay, conflicts, and
   undo/redo history actions live there).

   Cross-package deps via Sync_deps:
     - gen_undo_ops / clear_history (frontend.worker.undo-redo)
     - crypt hooks: graph_e2ee, ensure_graph_aes_key, encrypt_tx_data,
       decrypt_tx_data, encrypt_text_value, decrypt_text_value
     - op-construct hooks: derive_history_outliner_ops,
       semantic_outliner_ops, assert_no_numeric_entity_ids,
       rewrite_block_title_with_retracted_refs
     - capture_error (platform capture-error channel; optional)
*)

open Datascript
open Db_worker_effect.Infix

let kw s = Wire.Keyword s

(* ---- atoms ---- *)

let repo_latest_remote_tx : (string, int) Hashtbl.t = Hashtbl.create 7
let repo_latest_remote_checksum : (string, string) Hashtbl.t =
  Hashtbl.create 7

let latest_remote_tx repo : int option =
  Hashtbl.find_opt repo_latest_remote_tx repo

let latest_remote_checksum repo : string option =
  Hashtbl.find_opt repo_latest_remote_checksum repo

let repo_upload_stopped : (string, bool) Hashtbl.t = Hashtbl.create 7
let repo_large_upload_progress : ((string * string), int) Hashtbl.t =
  Hashtbl.create 17

let upload_response_timeout_ms = 120_000

(* cljs def max-upload-request-datoms — a var so tests can rebind it
   (with-redefs) the way the cljs suite does *)
let max_upload_request_datoms = ref 5000

let set_upload_stopped repo stopped =
  Hashtbl.replace repo_upload_stopped repo stopped;
  stopped

let upload_stopped repo : bool =
  match Hashtbl.find_opt repo_upload_stopped repo with
  | Some b -> b
  | None -> false

let current_client repo : Sync_state.client option =
  Sync_presence.current_client repo

let sync_counts repo : Wire.t option =
  Sync_presence.sync_counts
    ~get_missing_asset_upload_files:Sync_assets.get_missing_asset_upload_files
    ~latest_remote_tx:repo_latest_remote_tx
    ~latest_remote_checksum:repo_latest_remote_checksum repo

let broadcast_rtc_state (client : Sync_state.client option) : unit =
  match client with
  | Some client ->
      Broadcast.to_clients ~kind:"rtc-sync-state"
        ~transit_payload:
          (Transit_codec.to_string
             (Wire.Array
                [ kw "rtc-sync-state"
                ; Sync_presence.rtc_state_payload ~sync_counts client ]))
  | None -> ()

(* ---- ignored attrs ---- *)

let reverse_data_ignored_attrs = [ "block/tx-id" ]

let rtc_ignored_attrs =
  reverse_data_ignored_attrs @ Sync_const.ignore_attrs_when_syncing
  @ Sync_const.ignore_entities_when_init_upload @ [ "block/pre-block?" ]

let remove_ignored_attrs (tx_data : datom list) : datom list =
  List.filter (fun (d : datom) -> not (List.mem d.a rtc_ignored_attrs)) tx_data

(* normalize-tx-data on tx-report datoms; returns wire tx forms *)
let normalize_tx_data ?memo (db_after : db) (db_before : db)
    (tx_data : datom list) : Wire.t list =
  tx_data
  |> remove_ignored_attrs
  |> Db_normalize.wire_of_datoms
  |> Db_normalize.normalize_tx_data ?memo db_after db_before
  |> List.filter (fun item ->
         let e = Db_normalize.nth_wire item 1 in
         match e with
         | Wire.Keyword ident ->
             not (Sync_const.is_ignored_entity ident)
         | _ -> true)

(* reverse-tx-data: datoms -> reversed wire tx forms *)
let reverse_tx_data ?memo (db_before : db) (db_after : db)
    (tx_data : datom list) : Wire.t list =
  tx_data
  |> List.rev
  |> List.filter_map (fun (d : datom) ->
         let reversed =
           Db_normalize.wire_of_datom { d with added = not d.added }
         in
         Db_normalize.normalize_datom ?memo db_before db_after reversed)
  |> Db_normalize.replace_attr_retract_with_retract_entity_v2 ?memo db_after
  |> Db_normalize.reorder_retract_entity

let ws_open = Sync_transport.ws_open

let send (ws : Sync_state.ws_endpoint) (message : Wire.t)
    : unit Db_worker_effect.t =
  Sync_transport.send ws message

let tx_items_of (w : Wire.t) : Wire.t list =
  match w with Wire.Array xs | Wire.List xs -> xs | _ -> []

let outliner_op_to_string (op : Wire.t option) : string option =
  match op with
  | Some (Wire.Keyword s) -> Some s
  | Some w -> Some (Transit_codec.to_string w)
  | None -> None

let report_upload_response_timeout (client : Sync_state.client)
    (request : Sync_state.upload_request) : unit =
  let repo = client.repo in
  let ws = client.ws in
  let online = Sync_state.online () in
  let ws_open_state =
    match ws with Some ws -> ws_open ws | None -> false
  in
  if online && ws_open_state then begin
    let elapsed_ms =
      Time.diff_monotonic_ms request.sent_at (Time.monotonic_now ())
    in
    let outliner_op_tag =
      match request.outliner_ops with
      | [] -> Wire.Nil
      | ops -> Wire.String (String.concat "," ops)
    in
    let data =
      Wire.Map
        (List.filter_map Fun.id
           [ Some (kw "source", Wire.String "db-sync")
           ; Some (kw "operation", Wire.String "upload-tx-batch")
           ; Some (kw "repo", Wire.String repo)
           ; Some
               ( kw "graph-id"
               , (match client.graph_id with
                  | Some g -> Wire.String g
                  | None -> Wire.Nil) )
           ; Some (kw "timeout-ms", Wire.Int upload_response_timeout_ms)
           ; Some (kw "elapsed-ms", Wire.Float elapsed_ms)
           ; Some (kw "tx-count", Wire.Int (List.length request.tx_ids))
           ; Some
               ( kw "t-before"
               , (match request.t_before with
                  | Some t -> Wire.Int t
                  | None -> Wire.Nil) )
           ; Some
               ( kw "latest-remote-tx"
               , (match Hashtbl.find_opt repo_latest_remote_tx repo with
                  | Some t -> Wire.Int t
                  | None -> Wire.Nil) )
           ; Some
               ( kw "current-local-tx"
               , (match Sync_client_op.get_local_tx repo with
                  | Some t -> Wire.Int t
                  | None -> Wire.Nil) )
           ; Some (kw "online?", Wire.Bool online)
           ; Some (kw "ws-open?", Wire.Bool ws_open_state)
           ; (match request.outliner_ops with
              | [] -> None
              | _ -> Some (kw "outliner-op", outliner_op_tag)) ])
    in
    Worker_log.error "db-sync/upload-response-timeout"
      (List.map
         (fun (k, v) ->
            ( (match k with Wire.Keyword s | Wire.String s -> s | _ -> "?")
            , Transit_codec.to_string v ))
         (Wire.as_map data));
    (try
       match !Sync_deps.capture_error with
       | Some fn ->
           fn "Sync upload request did not get response" data
             (Wire.Map
                [ ( kw "tx-ids"
                  , Wire.Array
                      (List.map (fun s -> Wire.String s) request.tx_ids) )
                ; ( kw "outliner-ops"
                  , Wire.Array
                      (List.map (fun s -> Wire.String s)
                         request.outliner_ops) ) ])
       | None -> ()
     with e ->
       Worker_log.error "db-sync/report-upload-response-timeout-failed"
         [ "repo", repo; "error", Printexc.to_string e ])
  end

let clear_upload_response_timeout (client : Sync_state.client)
    : Sync_state.upload_request option =
  match !(client.upload_request) with
  | None -> None
  | Some request ->
      (match request.timer with
       | Some t -> Timers.clear t
       | None -> ());
      client.upload_request := None;
      Some request

let request_equal a (b : Sync_state.upload_request) : bool =
  a.Sync_state.tx_ids = b.tx_ids
  && a.outliner_ops = b.outliner_ops
  && a.large_upload_progress = b.large_upload_progress
  && a.t_before = b.t_before && a.sent_at = b.sent_at

let start_upload_response_timeout (client : Sync_state.client)
    (request : Sync_state.upload_request) : unit =
  if !(client.upload_request) = None then begin
    let request =
      match request.timer with
      | Some _ -> request
      | None -> { request with Sync_state.sent_at = Time.monotonic_now () }
    in
    let timer =
      Timers.set_timeout upload_response_timeout_ms (fun () ->
           match !(client.upload_request) with
           | Some current when request_equal { current with timer = None }
                                    { request with timer = None } ->
               client.upload_request := None;
               report_upload_response_timeout client request
           | _ -> ())
    in
    request.timer <- Some timer;
    client.upload_request := Some request
  end

let commit_large_upload_progress repo tx_entries : unit =
  List.iter
    (fun entry ->
       match
         ( Wire.get "large-upload-original-tx-id" entry
         , Wire.get "large-upload-next-index" entry
         , Wire.get "large-upload-final?" entry )
       with
       | Some (Wire.String orig), Some next_idx, final_w -> (
           let key = (repo, orig) in
           match final_w with
           | Some (Wire.Bool true) ->
               Hashtbl.remove repo_large_upload_progress key
           | _ ->
               (match next_idx with
                | Wire.Int n ->
                    Hashtbl.replace repo_large_upload_progress key n
                | _ -> ()))
       | _ -> ())
    tx_entries

let ack_upload_response repo (client : Sync_state.client) : unit =
  match clear_upload_response_timeout client with
  | Some request ->
      commit_large_upload_progress repo request.large_upload_progress
  | None -> ()

(* ---- large title wrappers ---- *)

let upload_large_title repo graph_id title (aes_key : Wire.t)
    : Wire.t Db_worker_effect.t =
  Sync_large_title.upload_large_title ~repo ~graph_id ~title ~aes_key
    ~http_base:
      (Option.value
         (Sync_auth.http_base_url (Worker_state.db_sync_config ()))
         ~default:"")
    ~auth_headers:(Sync_auth.auth_headers ())

let offload_large_titles repo graph_id (tx_data : Wire.t list)
    (aes_key : Wire.t) : Wire.t list Db_worker_effect.t =
  Sync_large_title.offload_large_titles tx_data
    ~upload_fn:(fun title -> upload_large_title repo graph_id title aes_key)

let rehydrate_large_titles repo ~(tx_data : Wire.t list option)
    ~(graph_id : string option) : unit Db_worker_effect.t =
  Sync_large_title.rehydrate_large_titles repo ~tx_data ~graph_id
    ~graph_e2ee:(fun () ->
       match Worker_state.datascript_conn repo with
       | Some conn ->
           Sync_deps.require "graph_e2ee" Sync_deps.graph_e2ee (Conn.db conn)
       | None -> false)
    ~ensure_graph_aes_key:
      (Sync_deps.require "ensure_graph_aes_key"
         Sync_deps.ensure_graph_aes_key)
    ~conn:(Worker_state.datascript_conn repo)
    ~download_fn:(fun ~repo ~graph_id ~obj ~aes_key ->
       Sync_large_title.download_large_title ~repo ~graph_id ~obj ~aes_key
         ~http_base:
           (Option.value
              (Sync_auth.http_base_url (Worker_state.db_sync_config ()))
              ~default:"")
         ~auth_headers:(Sync_auth.auth_headers ()))

let rehydrate_large_titles_from_db repo graph_id : unit Db_worker_effect.t =
  Sync_large_title.rehydrate_large_titles_from_db repo graph_id
    ~rehydrate:(fun ~tx_data ~graph_id ->
       rehydrate_large_titles repo ~tx_data:(Some tx_data)
         ~graph_id:(Some graph_id))

let request_asset_download repo asset_uuid : unit =
  Sync_assets.request_asset_download repo asset_uuid
    ~current_client ~enqueue_asset_task:Sync_assets.enqueue_asset_task
    ~broadcast_rtc_state:(fun client -> broadcast_rtc_state (Some client))

(* ---- history op helpers ---- *)

(* op-construct impls — this module is the sole caller of these slots,
   so binding them here keeps Outliner_op_construct in the link closure
   (cljs binds them via direct namespace refs loaded alongside sync). *)
let () =
  Sync_deps.derive_history_outliner_ops :=
    Some Outliner_op_construct.derive_history_outliner_ops;
  Sync_deps.rewrite_block_title_with_retracted_refs :=
    Some Outliner_op_construct.rewrite_block_title_with_retracted_refs;
  Sync_deps.assert_no_numeric_entity_ids :=
    Some
      (fun conn ops stage ->
         Outliner_op_construct.assert_no_numeric_entity_ids
           (Datascript.Conn.db conn) ops stage);
  Sync_deps.semantic_outliner_ops :=
    Some (fun op -> List.mem op Outliner_op.semantic_outliner_op_names)

let derive_history_outliner_ops db_before db_after tx_data
    (tx_meta : tx_meta) : Wire.t list * Wire.t list =
  let tx_meta_wire =
    List.map (fun (k, v) -> (kw k, Ds_wire.transit_of_value v)) tx_meta
  in
  let fwd, inv =
    Sync_deps.require "derive_history_outliner_ops"
      Sync_deps.derive_history_outliner_ops db_before db_after tx_data
      tx_meta_wire
  in
  (tx_items_of fwd, tx_items_of inv)

let semantic_outliner_op (op : Wire.t) : bool =
  match op with
  | Wire.Keyword s ->
      Sync_deps.require "semantic_outliner_ops" Sync_deps.semantic_outliner_ops
        s
  | _ -> false

(* cljs rebase-history-ops: forward ops are canonicalized so replay
   preserves the inserted block identities (op-construct/canonicalize-
   insert-ops on the pre-rebase db). *)
let normalize_tx_data_for_rebase (tx_data : Wire.t) : Wire.t list =
  let items =
    match tx_data with
    | Wire.Array xs | Wire.List xs ->
        List.map
          (fun item ->
             match item with
             | Wire.Array ([ op; e; a; v; _t ] as l) when List.length l = 5 ->
                 Wire.Array [ op; e; a; v ]
             | _ -> item)
          xs
    | _ -> []
  in
  Db_normalize.reorder_retract_entity items

let inferred_outliner_ops (tx_meta : tx_meta) : bool =
  List.assoc_opt "outliner-ops" tx_meta = None
  && List.assoc_opt "undo?" tx_meta <> Some (Bool true)
  && List.assoc_opt "redo?" tx_meta <> Some (Bool true)
  && List.assoc_opt "outliner-op" tx_meta <> Some (Keyword "batch-import-edn")

let tx_meta_outliner_op (tx_meta : tx_meta) : value option =
  match List.assoc_opt "outliner-op" tx_meta with
  | Some _ as op -> op
  | None -> (
      match List.assoc_opt "db-migrate?" tx_meta with
      | Some (Bool true) -> Some (Keyword "db-migrate")
      | _ -> None)

let apply_tx_meta (remote_tx : Wire.t) : tx_meta =
  let outliner_op =
    match Wire.get "outliner-op" remote_tx with
    | Some (Wire.Keyword s) -> Some s
    | _ -> None
  in
  let base =
    [ "transact-remote?", Bool true; "persist-op?", Bool false ]
    @ (match Wire.get "t" remote_tx with
       | Some (Wire.Int n) -> [ "t", Int64 (Int64.of_int n) ]
       | _ -> [])
  in
  let with_op =
    match outliner_op with
    | Some op -> base @ [ "outliner-op", Keyword op ]
    | None -> base
  in
  match outliner_op with
  | Some "db-migrate" ->
      with_op
      @ [ "db-migrate?", Bool true; "skip-validate-db?", Bool true ]
  | _ -> with_op

let perf_time_ms () = Time.monotonic_now ()

let log_outliner_op_perf (_data : (string * string) list) : unit =
  if !Sync_state.dev_or_test then
    Worker_log.info ":db-worker/outliner-op-perf" _data

(* ---- tx item helpers (wire items) ---- *)

let uuid_str_of_wire (v : Wire.t) : string option =
  match v with
  | Wire.Uuid s -> Some s
  | Wire.String s when Sync_state.uuid_string s -> Some s
  | _ -> None

let item_nth (item : Wire.t) i = Db_normalize.nth_wire item i

let tx_item_block_uuid (db : db) (v : Wire.t) : string option =
  match v with
  | Wire.Uuid s -> Some s
  | Wire.Array [ a; u ] | Wire.List [ a; u ]
    when a = kw "block/uuid" ->
      uuid_str_of_wire u
  | Wire.Int n -> (
      match Datascript.entity db (Entity_id n) with
      | Some e -> (
          match Datascript.entity_attr e "block/uuid" with
          | Some (One_value (Uuid s)) -> Some s
          | _ -> None)
      | None -> None)
  | _ -> None

(* cljs tx items may be (d/datom ...) records: [e a v tx] with added =
   (pos? tx). On the wire they arrive as #datascript/Datom tagged values,
   and after the wire->value->wire sanitize round-trip as
   [datascript/Datom [e a v tx]] vectors *)
let datom_item_parts (item : Wire.t) : (Wire.t * Wire.t * int) option =
  let rep =
    match item with
    | Wire.Tagged ("datascript/Datom", rep) -> Some rep
    | Wire.Array [ Wire.Symbol "datascript/Datom"; rep ]
    | Wire.List [ Wire.Symbol "datascript/Datom"; rep ] -> Some rep
    | _ -> None
  in
  match rep with
  | Some (Wire.Array [ e; a; _; Wire.Int tx ])
  | Some (Wire.List [ e; a; _; Wire.Int tx ]) -> Some (e, a, tx)
  | _ -> None

let tx_item_entity (item : Wire.t) : Wire.t =
  match datom_item_parts item with
  | Some (e, _, _) -> e
  | None -> item_nth item 1

let tx_item_attr (item : Wire.t) : Wire.t =
  match datom_item_parts item with
  | Some (_, a, _) -> a
  | None -> item_nth item 2

let tx_item_add (item : Wire.t) : bool =
  match datom_item_parts item with
  | Some (_, _, tx) -> tx > 0
  | None -> item_nth item 0 = kw "db/add"

let tx_item_retract (item : Wire.t) : bool =
  match datom_item_parts item with
  | Some (_, _, tx) -> tx <= 0
  | None -> item_nth item 0 = kw "db/retract"

let block_uuid_lookup_ref_value (v : Wire.t) : string option =
  match v with
  | Wire.Array [ a; u ] | Wire.List [ a; u ]
    when a = kw "block/uuid" ->
      uuid_str_of_wire u
  | _ -> None

let tx_item_ref_block_uuids (item : Wire.t) : string list =
  match item with
  | Wire.Array l | Wire.List l when List.length l >= 4 ->
      List.filter_map block_uuid_lookup_ref_value
        [ List.nth l 1; List.nth l 3 ]
  | _ -> []

let tx_data_has_block_uuid_ref (tx_data : Wire.t list) : bool =
  List.exists (fun item -> tx_item_ref_block_uuids item <> []) tx_data

let tx_item_retract_entity_block_uuid (item : Wire.t) : string option =
  match item with
  | Wire.Array [ op; e ] | Wire.List [ op; e ]
    when op = kw "db/retractEntity" || op = kw "db.fn/retractEntity" ->
      block_uuid_lookup_ref_value e
  | _ -> None

(* set ops on string lists *)
module SSet = Set.Make (String)
module Int_set = Set.Make (Int)

let remote_txs_retract_entity_block_uuid_suffixes (remote_txs : Wire.t list)
    : SSet.t list =
  (* cljs reduces over (reverse remote-txs) prepending each accumulated
     delete set, so the resulting list is already aligned with the forward
     remote-txs order: suffix i = deletes from tx i through the last tx. *)
  let _, suffixes =
    List.fold_left
      (fun (deleted, suffixes) remote_tx ->
         let tx_items =
           match Wire.get "tx-data" remote_tx with
           | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
           | _ -> []
         in
         let deleted' =
           List.fold_left
             (fun acc item ->
                match tx_item_retract_entity_block_uuid item with
                | Some u -> SSet.add u acc
                | None -> acc)
             deleted tx_items
         in
         (deleted', deleted' :: suffixes))
      (SSet.empty, []) (List.rev remote_txs)
  in
  suffixes

let tx_item_missing_deleted_block_ref (db : db) (deleted : SSet.t)
    (item : Wire.t) : bool =
  List.exists
    (fun block_uuid ->
       SSet.mem block_uuid deleted
       && Outliner_op.entity_of_uuid db block_uuid = None)
    (tx_item_ref_block_uuids item)

let tx_item_missing_block_ref ?(display_db : db option) (db : db)
    (created : SSet.t) (item : Wire.t) : bool =
  List.exists
    (fun block_uuid ->
       (not (SSet.mem block_uuid created))
       && Outliner_op.entity_of_uuid db block_uuid = None
       &&
       match display_db with
       | Some ddb -> Outliner_op.entity_of_uuid ddb block_uuid = None
       | None -> true)
    (tx_item_ref_block_uuids item)

let tx_item_entity_block_uuid ?(temp_id_uuid = Hashtbl.create 0)
    (db : db) (item : Wire.t) : string option =
  match item with
  | Wire.Array _ | Wire.List _ -> (
      let e = item_nth item 1 in
      match Hashtbl.find_opt temp_id_uuid (Transit_codec.to_string e) with
      | Some u -> Some u
      | None -> tx_item_block_uuid db e)
  | _ -> None

let tx_item_created_block_uuid_entry (item : Wire.t)
    : (string * string) option =
  match item with
  | Wire.Array l | Wire.List l when List.length l >= 4 -> (
      let e = List.nth l 1 and a = List.nth l 2 and v = List.nth l 3 in
      let is_add = List.nth l 0 = kw "db/add" in
      match (is_add, a, v) with
      | true, Wire.Keyword "block/uuid", (Wire.Uuid u) -> (
          match e with
          | Wire.Int _ | Wire.String _ ->
              Some (Transit_codec.to_string e, u)
          | _ -> None)
      | _ -> None)
  | _ -> None

let tx_temp_id_uuid (tx_data : Wire.t list) : (string, string) Hashtbl.t =
  let tbl = Hashtbl.create 17 in
  List.iter
    (fun item ->
       match tx_item_created_block_uuid_entry item with
       | Some (k, u) -> Hashtbl.replace tbl k u
       | None -> ())
    tx_data;
  tbl

let drop_stale_deleted_block_ref_ops (db : db) (deleted : SSet.t)
    (tx_data : Wire.t list) : Wire.t list =
  let temp_id_uuid = tx_temp_id_uuid tx_data in
  let stale_entity_uuids =
    List.filter_map
      (fun item ->
         if tx_item_missing_deleted_block_ref db deleted item then
           tx_item_entity_block_uuid ~temp_id_uuid db item
         else None)
      tx_data
    |> List.fold_left (fun s u -> SSet.add u s) SSet.empty
  in
  List.filter
    (fun item ->
       match tx_item_entity_block_uuid ~temp_id_uuid db item with
       | Some u -> not (SSet.mem u stale_entity_uuids)
       | None -> true)
    tx_data

let drop_missing_block_ref_ops ?(display_db : db option) (db : db)
    (tx_data : Wire.t list) : Wire.t list =
  let temp_id_uuid = tx_temp_id_uuid tx_data in
  let created =
    Hashtbl.fold (fun _ u acc -> SSet.add u acc) temp_id_uuid SSet.empty
  in
  let stale_entity_uuids =
    List.filter_map
      (fun item ->
         if tx_item_missing_block_ref ?display_db db created item then
           tx_item_entity_block_uuid ~temp_id_uuid db item
         else None)
      tx_data
    |> List.fold_left (fun s u -> SSet.add u s) SSet.empty
  in
  List.filter
    (fun item ->
       not
         (tx_item_missing_block_ref ?display_db db created item
          ||
          match tx_item_entity_block_uuid ~temp_id_uuid db item with
          | Some u -> SSet.mem u stale_entity_uuids
          | None -> false))
    tx_data

let entity_block_uuid (db : db) (eid : int) : string option =
  match Datascript.entity db (Entity_id eid) with
  | Some e -> (
      match Datascript.entity_attr e "block/uuid" with
      | Some (One_value (Uuid s)) -> Some s
      | _ -> None)
  | None -> None

let drop_stale_adds_after_remote_entity_delete (tx_data : Wire.t list)
    : Wire.t list =
  let deleted_eids =
    List.filter_map
      (fun item ->
         if tx_item_retract item && tx_item_attr item = kw "block/uuid" then
           match tx_item_entity item with
           | Wire.Int n -> Some n
           | _ -> None
         else None)
      tx_data
  in
  let recreated_eids =
    List.filter_map
      (fun item ->
         if tx_item_add item && tx_item_attr item = kw "block/uuid" then
           match tx_item_entity item with
           | Wire.Int n -> Some n
           | _ -> None
         else None)
      tx_data
  in
  (* cljs (set/difference deleted-eids recreated-eids) *)
  let to_set =
    List.fold_left (fun s e -> Int_set.add e s) Int_set.empty
  in
  let stale_eids =
    Int_set.diff (to_set deleted_eids) (to_set recreated_eids)
  in
  List.filter
    (fun item ->
       not
         (tx_item_add item
          &&
          match tx_item_entity item with
          | Wire.Int n -> Int_set.mem n stale_eids
          | _ -> false))
    tx_data

let remote_txs_db_migrate (remote_txs : Wire.t list) : bool =
  List.exists
    (fun tx -> Wire.get "outliner-op" tx = Some (kw "db-migrate"))
    remote_txs

(* ---- upload temp-id grouping ---- *)

let upload_tempid (v : Wire.t) : bool =
  match v with
  | Wire.Int n -> n < 0
  | Wire.String _ -> true
  | _ -> false

let ref_attr (db : db) (attr : attr) : bool =
  Schema.schema_attr_is_ref (Datascript.schema db) attr
  || Db_normalize.entity_value_type_ref db attr

(* [a v] lookup-refs such as [:block/uuid u]: when the same ref appears in a
   ref-attr value position elsewhere in the tx, datoms whose entity position
   is that ref are dependency-linked to the datoms pointing at it and must
   stay in the same request — otherwise an early chunk can carry e.g. a lone
   retract ahead of its add and leave the server holding a mid-state. Refs
   that appear only in entity position (nothing references them) do not
   group. *)
let lookup_ref_wire (v : Wire.t) : bool =
  match v with
  | Wire.Array [ Wire.Keyword _; _ ] | Wire.List [ Wire.Keyword _; _ ] -> true
  | _ -> false

(* cljs upload-replaced-values: the [entity attr] pairs whose
   cardinality-one value the tx retracts on an existing entity. The server
   validates each request as a whole transaction, so such a retract sent
   ahead of the add of the new value can leave the entity without a
   required attribute and be rejected. *)
let upload_replaced_values (db : db) (tx_data : Wire.t list)
    : (string, unit) Hashtbl.t =
  let replaced = Hashtbl.create 17 in
  List.iter
    (fun item ->
       match item with
       | Wire.Array l | Wire.List l -> (
           match l with
           | op :: entity :: (Wire.Keyword a as attr_wire) :: _ :: _
             when op = kw "db/retract"
                  && List.length l >= 4
                  && (not (upload_tempid entity))
                  && not (Ldb.many_attr db a) ->
               Hashtbl.replace replaced
                 (Transit_codec.to_string (Wire.Array [ entity; attr_wire ]))
                 ()
           | _ -> ())
       | _ -> ())
    tx_data;
  replaced

(* cljs upload-tx-item-group-keys: keys of the groups an upload tx item
   belongs to. Items sharing a key are sent in one request: those of a
   tempid, which the server resolves within a request, and the retract and
   adds of a value in [replaced]. *)
let upload_tx_item_group_keys (db : db) (linked : Wire.t list)
    (replaced : (string, unit) Hashtbl.t) (item : Wire.t) : Wire.t list =
  match item with
  | Wire.Map _ -> (
      match Wire.get "db/id" item with
      | Some id when upload_tempid id -> [ id ]
      | _ -> [])
  | Wire.Array l | Wire.List l -> (
      match l with
      | op :: entity :: attr :: value :: _
        when List.mem op
               [ kw "db/add"; kw "db/retract"; kw "db/cas"; kw "db.fn/cas" ]
             && List.length l >= 4 ->
          let acc = ref [] in
          let is_ref =
            match attr with
            | Wire.Keyword a -> ref_attr db a
            | _ -> false
          in
          (* a plain non-ref add on a linked entity is leaf data and may
             split; a retract/cas or a ref edge on it is a dependency *)
          if upload_tempid entity
             || (List.mem entity linked && (op <> kw "db/add" || is_ref))
          then acc := entity :: !acc;
          (match attr with
           | Wire.Keyword a when ref_attr db a ->
               if upload_tempid value then acc := value :: !acc
           | _ -> ());
          if (op = kw "db/add" || op = kw "db/retract")
             && Hashtbl.mem replaced
                  (Transit_codec.to_string (Wire.Array [ entity; attr ]))
          then
            acc :=
              Wire.List [ kw "sync/value-replacement"; entity; attr ]
              :: !acc;
          !acc
      | [ op; e ]
        when (op = kw "db/retractEntity" || op = kw "db.fn/retractEntity")
             && (upload_tempid e || List.mem e linked) ->
          [ e ]
      | _ -> [])
  | _ -> []

let merge_upload_tx_ranges (ranges : (int * int) list) : (int * int) list =
  let sorted =
    List.sort (fun (a, _) (b, _) -> compare a b) ranges
  in
  List.fold_left
    (fun merged (start, e) ->
       match merged with
       | (prev_start, prev_end) :: rest when start <= prev_end ->
           (prev_start, max prev_end e) :: rest
       | _ -> (start, e) :: merged)
    [] sorted
  |> List.rev

let upload_group_range_by_start (db : db) (tx_data : Wire.t list)
    : (int, int) Hashtbl.t =
  let replaced = upload_replaced_values db tx_data in
  let linked =
    List.concat_map
      (fun item ->
         match item with
         | Wire.Array (_ :: _ :: Wire.Keyword a :: v :: _)
         | Wire.List (_ :: _ :: Wire.Keyword a :: v :: _)
           when ref_attr db a && lookup_ref_wire v -> [ v ]
         | _ -> [])
      tx_data
  in
  let by_key : (string, int * int) Hashtbl.t = Hashtbl.create 17 in
  List.iteri
    (fun idx item ->
       List.iter
         (fun group_key ->
            let k = Transit_codec.to_string group_key in
            match Hashtbl.find_opt by_key k with
            | Some (s, e) ->
                Hashtbl.replace by_key k (min s idx, max e idx)
            | None -> Hashtbl.replace by_key k (idx, idx))
         (upload_tx_item_group_keys db linked replaced item))
    tx_data;
  let ranges =
    Hashtbl.fold (fun _ r acc -> r :: acc) by_key []
    |> merge_upload_tx_ranges
  in
  let by_start = Hashtbl.create 17 in
  List.iter (fun (s, e) -> Hashtbl.replace by_start s e) ranges;
  by_start

let next_upload_tx_group (tx_data : Wire.t list)
    (range_by_start : (int, int) Hashtbl.t) idx : int * Wire.t list =
  match Hashtbl.find_opt range_by_start idx with
  | Some e ->
      let group =
        List.filteri (fun i _ -> i >= idx && i <= e) tx_data
      in
      (e + 1, group)
  | None -> (idx + 1, [ List.nth tx_data idx ])

let next_large_upload_request_chunk (db : db) (tx_data : Wire.t list)
    (start : int) : Wire.t list * int =
  let range_by_start = upload_group_range_by_start db tx_data in
  let total = List.length tx_data in
  let arr = Array.of_list tx_data in
  let rec loop idx chunk_len chunk_rev =
    if idx < total then begin
      let next_idx, group_len =
        match Hashtbl.find_opt range_by_start idx with
        | Some e -> (e + 1, e + 1 - idx)
        | None -> (idx + 1, 1)
      in
      let next_count = chunk_len + group_len in
      if chunk_rev <> [] && next_count > !max_upload_request_datoms then
        (List.rev chunk_rev, idx)
      else
        loop next_idx next_count
          (List.rev_append
             (Array.to_list (Array.init group_len (fun i -> arr.(idx + i))))
             chunk_rev)
    end
    else (List.rev chunk_rev, total)
  in
  loop start 0 []

(* tx-entry wire maps: {tx-id tx-data outliner-op large-upload-*} *)
let cap_upload_request_tx_entries repo (db : db)
    (tx_entries : Wire.t list) : Wire.t list =
  let rec loop remaining result datom_count =
    match remaining with
    | entry :: rest -> (
        let tx_data =
          Option.value (Wire.get "tx-data" entry) ~default:(Wire.Array [])
          |> tx_items_of
        in
        let entry_count = List.length tx_data in
        let next_count = datom_count + entry_count in
        if result = [] && entry_count > !max_upload_request_datoms then
          [ large_upload_request_entry repo db entry ]
        else if next_count > !max_upload_request_datoms then List.rev result
        else loop rest (entry :: result) next_count)
    | [] -> List.rev result
  and large_upload_request_entry repo (db : db) (entry : Wire.t)
      : Wire.t =
    let tx_data =
      Option.value (Wire.get "tx-data" entry) ~default:(Wire.Array [])
      |> tx_items_of
    in
    let tx_id = Wire.get "tx-id" entry in
    let total = List.length tx_data in
    let progress_key =
      match tx_id with
      | Some (Wire.String id) -> Some (repo, id)
      | _ -> None
    in
    let progress_start =
      match progress_key with
      | Some key ->
          Option.value
            (Hashtbl.find_opt repo_large_upload_progress key)
            ~default:0
      | None -> 0
    in
    let start = if progress_start < total then progress_start else 0 in
    let chunk, next_index =
      next_large_upload_request_chunk db tx_data start
    in
    let final_ = next_index >= total in
    Worker_log.info "db-sync/large-upload-request-chunk"
      [ "repo", repo
      ; "tx-id"
      , (match tx_id with Some (Wire.String s) -> s | _ -> "")
      ; "start", string_of_int start
      ; "end", string_of_int next_index
      ; "total", string_of_int total
      ; "final?", string_of_bool final_ ];
    let base =
      Wire.as_map entry
      |> List.map (fun (k, v) ->
             if k = kw "tx-data" then (k, Wire.Array chunk)
             else (k, v))
    in
    let augmented =
      base
      @ [ kw "large-upload-original-tx-id"
        , (match tx_id with Some w -> w | None -> Wire.Nil)
        ; kw "large-upload-next-index", Wire.Int next_index
        ; kw "large-upload-final?", Wire.Bool final_ ]
    in
    let augmented =
      if not final_ then
        List.filter (fun (k, _) -> k <> kw "tx-id") augmented
      else augmented
    in
    Wire.Map augmented
  in
  loop tx_entries [] 0

(* Pending replay on a server base where the remote side may have deleted
   entities a queued tx references. Entity-position refs that are gone mean
   the op's target is gone — the tx fails and is marked failed (server
   wins on the entity). A missing ref in *value* position drops just that
   datom: the ref is meaningless once its target is deleted, but the rest
   of the tx still applies. *)
(* uuids created or retracted by a tx's own items — used to thread the
   server-visible uuid set across an ordered pending queue. *)
let pending_tx_uuid_delta (items : Wire.t list) : SSet.t * SSet.t =
  List.fold_left
    (fun (created, retracted) item ->
       match item with
       | (Wire.Array l | Wire.List l)
         when List.length l >= 4 && List.nth l 0 = kw "db/add" -> (
           (* an e-position [:block/uuid u] upserts u on the server even
              when the tx doesn't assert block/uuid explicitly *)
           let created =
             match List.nth l 1 with
             | Wire.Array [ a; Wire.Uuid u ] | Wire.List [ a; Wire.Uuid u ]
               when a = kw "block/uuid" -> SSet.add u created
             | _ -> created
           in
           match List.nth l 2 = kw "block/uuid", List.nth l 3 with
           | true, Wire.Uuid u -> (SSet.add u created, retracted)
           | _ -> (created, retracted))
       | (Wire.Array l | Wire.List l)
         when List.length l >= 4 && List.nth l 0 = kw "db/retract" -> (
           match List.nth l 2 = kw "block/uuid", List.nth l 3 with
           | true, Wire.Uuid u -> (created, SSet.add u retracted)
           | _ -> (created, retracted))
       | (Wire.Array [ op; e ] | Wire.List [ op; e ])
         when op = kw "db/retractEntity"
              || op = kw "db.fn/retractEntity" -> (
           match e with
           | Wire.Array [ a; Wire.Uuid u ] | Wire.List [ a; Wire.Uuid u ]
             when a = kw "block/uuid" -> (created, SSet.add u retracted)
           | _ -> (created, retracted))
       | _ -> (created, retracted))
    (SSet.empty, SSet.empty)
    items

(* an attr ident is "live" on a db when it resolves to an entity — an
   attr deleted on the new server base resolves nowhere. *)
let attr_resolves (d : db) (a : Wire.t) : bool =
  match a with
  | Wire.Keyword s | Wire.String s ->
      Datascript.entity d (Ident s) <> None
  | Wire.Int id -> Datascript.entity d (Entity_id id) <> None
  | _ -> true

let sanitize_pending_tx_refs ?uuid_exists ?(attr_live = fun _ -> true)
    (db : db) (tx_data : Wire.t list) : Wire.t list =
  let created = fst (pending_tx_uuid_delta tx_data) in
  let entity_exists =
    match uuid_exists with
    | Some f -> f
    | None -> (fun uuid_str -> Outliner_op.entity_of_uuid db uuid_str <> None)
  in
  let missing uuid_str =
    (not (SSet.mem uuid_str created)) && not (entity_exists uuid_str)
  in
  let missing_uuid_of w =
    match w with
    | Wire.String s when Sync_state.uuid_string s -> (
        let u = Datascript.Util.uuid_canonicalize s in
        if missing u then Some u else None)
    | Wire.Uuid u -> if missing u then Some u else None
    | Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
    | Wire.List [ Wire.Keyword "block/uuid"; Wire.Uuid u ] ->
        if missing u then Some u else None
    | _ -> None
  in
  let is_missing_ref w = missing_uuid_of w <> None in
  (* e-position key -> page ref: a block/parent ref whose target was
     remotely deleted falls back to the page root — the same endpoint
     the semantic replay's ancestor fallback converges on. The page ref
     is taken from a sibling block/page add in this very tx so the
     entity key form (tempid string vs lookup-ref) always matches. *)
  let page_ref_of : (string, Wire.t) Hashtbl.t = Hashtbl.create 8 in
  List.iter
    (fun item ->
       match item with
       | Wire.Array (op :: e :: a :: v :: _)
       | Wire.List (op :: e :: a :: v :: _)
         when op = kw "db/add" && a = kw "block/page"
              && not (is_missing_ref v) ->
           let k = Transit_codec.to_string e in
           if not (Hashtbl.mem page_ref_of k) then
             Hashtbl.replace page_ref_of k v
       | _ -> ())
    tx_data;
  List.filter_map
    (fun item ->
       match item with
       | Wire.Array l | Wire.List l when List.length l >= 4 -> (
           let e = List.nth l 1 and a = List.nth l 2 and v = List.nth l 3 in
           match missing_uuid_of e with
           | Some u ->
               failwith ("pending tx references missing block " ^ u)
           | None ->
               (* property-pair drop: a user/logseq property attr that
                  resolves nowhere on the new base was remotely deleted —
                  keep everything else (schema attrs like block/name have
                  no ident entity to resolve against). *)
               let dead_property_attr =
                 match a with
                 | Wire.Keyword a' | Wire.String a' ->
                     Db_property.property a' && not (attr_live a)
                 | _ -> false
               in
               if dead_property_attr then None
               else (
                 match a with
                 | Wire.Keyword "block/parent" when is_missing_ref v -> (
                     match
                       Hashtbl.find_opt page_ref_of
                         (Transit_codec.to_string e)
                     with
                     | Some pv -> (
                         match item with
                         | Wire.Array l ->
                             Some
                               (Wire.Array
                                  (List.mapi
                                     (fun i x -> if i = 3 then pv else x)
                                     l))
                         | Wire.List l ->
                             Some
                               (Wire.List
                                  (List.mapi
                                     (fun i x -> if i = 3 then pv else x)
                                     l))
                         | _ -> Some item)
                     | None -> None)
                 | Wire.Keyword a'
                   when ref_attr db a' && is_missing_ref v -> None
                 | _ -> Some item))
       | _ -> Some item)
    tx_data

let entity_of_wire_ref (db : db) (v : Wire.t) : entity option =
  match v with
  | Wire.Int n -> Datascript.entity db (Entity_id n)
  | Wire.Uuid s -> Datascript.entity db (Lookup_ref ("block/uuid", Uuid s))
  | _ -> (
      try Datascript.entity db (Ds_wire.entity_ref_of_transit v)
      with _ -> None)

(* Drop `[:db/add e "block/parent" p]` items whose edge would close a
   parent cycle on the post-tx image. Each queued move was legal when
   issued, but against a newer base (the other half of a mutual move
   already landed remotely) the pair forms a loop — verbatim replay and
   confirm have no op-time move_parents_to_child guard, so the cycle
   would land on the projection/server conn unchecked (the server
   accepts the verbatim upload as-is, same hole cljs has). Dropping the
   closing edge keeps the local image acyclic; the checksum reconcile
   surfaces the remaining drift instead of a corrupt tree. Edges are
   checked in tx order: earlier assignments win, the later edge that
   would walk back into its own subtree is dropped. *)
let drop_cycle_parent_edges
    ?(kept : (entity_id, entity_id option) Hashtbl.t option) (db : db)
    (tx_data : Wire.t list) : Wire.t list =
  let eid_of (w : Wire.t) : entity_id option =
    match entity_of_wire_ref db w with
    | Some e -> Some e.id
    | None -> None
  in
  let db_parent (e : entity_id) : entity_id option =
    match Datascript.entity db (Entity_id e) with
    | Some en -> (
        match Ldb.ref_ent en "block/parent" with
        | Some p -> Some p.id
        | None -> None)
    | None -> None
  in
  (* kept overrides: eid -> parent eid option (None = parent cleared).
     Upload passes one shared map across the batch so a later entry sees
     the parent edges an earlier surviving entry will land; replay and
     confirm use a fresh one. *)
  let kept =
    match kept with
    | Some k -> k
    | None -> Hashtbl.create 8
  in
  (* first-seen `kept` value per entity this tx mutates — restoring it on
     a dropped add undoes the tx's own retracts without clobbering what
     an earlier batch entry assigned *)
  let orig : (entity_id, entity_id option option) Hashtbl.t =
    Hashtbl.create 8
  in
  let set_kept (e : entity_id) (v : entity_id option) : unit =
    if not (Hashtbl.mem orig e) then
      Hashtbl.replace orig e (Hashtbl.find_opt kept e);
    Hashtbl.replace kept e v
  in
  let parent_of (e : entity_id) : entity_id option =
    match Hashtbl.find_opt kept e with
    | Some p -> p
    | None -> db_parent e
  in
  (* walking src's parent chain reaches dst? *)
  let reaches (src : entity_id) (dst : entity_id) : bool =
    let seen = Hashtbl.create 8 in
    let rec loop cur =
      if cur = dst then true
      else if Hashtbl.mem seen cur then false
      else begin
        Hashtbl.add seen cur ();
        match parent_of cur with
        | Some p -> loop p
        | None -> false
      end
    in
    loop src
  in
  (* first pass: decide which adds close a cycle. Earlier assignments
     win; a dropped add also takes its paired `db/retract e
     "block/parent"` with it so the block keeps its previous parent
     instead of going orphan *)
  let dropped_idx : (int, unit) Hashtbl.t = Hashtbl.create 4 in
  let dropped_es : (entity_id, unit) Hashtbl.t = Hashtbl.create 4 in
  List.iteri
    (fun i item ->
       match item with
       | Wire.Array (op :: e :: a :: v :: _)
       | Wire.List (op :: e :: a :: v :: _)
         when op = kw "db/add" && a = kw "block/parent" -> (
           match eid_of e, eid_of v with
           | Some eid, Some pid ->
               if reaches pid eid then begin
                 Hashtbl.replace dropped_idx i ();
                 Hashtbl.replace dropped_es eid ();
                 (* a paired retract may already have cleared e — restore
                    the pre-tx override so later checks see the edge that
                    survives the drop *)
                 (match Hashtbl.find_opt orig eid with
                  | Some (Some v) -> Hashtbl.replace kept eid v
                  | Some None | None -> Hashtbl.remove kept eid)
               end
               else set_kept eid (Some pid)
           | _ -> ())
       | Wire.Array (op :: e :: a :: _)
       | Wire.List (op :: e :: a :: _)
         when (op = kw "db/retract" || op = kw "db/retractEntity")
              && a = kw "block/parent" -> (
           match eid_of e with
           | Some eid -> set_kept eid None
           | None -> ())
       | Wire.Array (op :: e :: _)
       | Wire.List (op :: e :: _)
         when op = kw "db/retractEntity" -> (
           match eid_of e with
           | Some eid -> set_kept eid None
           | None -> ())
       | _ -> ())
    tx_data;
  if Hashtbl.length dropped_idx = 0 then tx_data
  else
    tx_data
    |> List.mapi
         (fun i item ->
            if Hashtbl.mem dropped_idx i then begin
              Worker_log.warn "db-sync/dropped-cycle-parent-edge"
                [ "tx-item", Ds_wire.edn_of_transit item ];
              None
            end
            else
              match item with
              | Wire.Array (op :: e :: a :: _)
              | Wire.List (op :: e :: a :: _)
                when op = kw "db/retract" && a = kw "block/parent" -> (
                  match eid_of e with
                  | Some eid when Hashtbl.mem dropped_es eid -> None
                  | _ -> Some item)
              | _ -> Some item)
    |> List.filter_map Fun.id

let prepare_upload_tx_entries ?repo ?server_db (conn : conn option)
    (pending : Sync_client_op.local_tx_entry list) :
    Wire.t list * string list * Wire.t list =
  let missing_entity_tx_ids = ref [] in
  let srv_db =
    match server_db with
    | Some d -> Some d
    | None -> (
        match repo with
        | Some r -> (
            match Sync_state.server_conn r with
            | Some c -> Some (Conn.db c)
            | None -> None)
        | None -> None)
  in
  (* the server sees entries applied in queue order, so a pending ref is
     uploadable exactly when its uuid is visible on the server conn or
     will be created (and not retracted) by an earlier pending entry —
     never by display-only state. *)
  (* uuid availability accumulates as entries survive sanitizing: a ref
     is uploadable when its uuid is on the server conn, or will be
     created (and not retracted) by an earlier surviving entry. Resolve
     lazily — only the uuids the batch actually references get a storage
     seek; never seed from a whole-index walk. *)
  let created_delta = ref SSet.empty in
  let retracted_delta = ref SSet.empty in
  (* surviving parent edges accumulate across the batch — a later entry
     sees the parent an earlier entry will land, so a cross-entry mutual
     move is caught the same as an in-tx cycle *)
  let cycle_kept = Hashtbl.create 16 in
  let srv_uuid_memo = Hashtbl.create 64 in
  let uuid_available =
    match srv_db with
    | Some d ->
        fun u ->
          SSet.mem u !created_delta
          || ((not (SSet.mem u !retracted_delta))
              &&
              match Hashtbl.find_opt srv_uuid_memo u with
              | Some b -> b
              | None ->
                  let b = Outliner_op.entity_of_uuid d u <> None in
                  Hashtbl.replace srv_uuid_memo u b;
                  b)
    | None -> fun _ -> true
  in
  let attr_live =
    match srv_db, conn with
    | Some srv, Some c ->
        fun a -> attr_resolves srv a || attr_resolves (Conn.db c) a
    | None, Some c -> fun a -> attr_resolves (Conn.db c) a
    | _, None -> fun _ -> true
  in
  let entries =
    List.filter_map
      (fun (e : Sync_client_op.local_tx_entry) ->
         let tx_data =
           match conn with
           | Some c -> (
               let uuid_exists =
                 match srv_db with
                 | Some _ -> uuid_available
                 | None ->
                     (fun u ->
                        Outliner_op.entity_of_uuid (Conn.db c) u <> None)
               in
               try
                 Some
                   (sanitize_pending_tx_refs ~uuid_exists ~attr_live
                      (Conn.db c) (tx_items_of e.tx)
                    |>
                    match srv_db with
                    | Some d ->
                        (* keep the server's image acyclic — the edge
                           must not upload, else the verbatim confirm
                           would land a parent cycle on the server conn *)
                        fun items ->
                          drop_cycle_parent_edges ~kept:cycle_kept d
                            items
                    | None -> Fun.id)
               with ex ->
                 Worker_log.warn "db-sync/upload-sanitize-failed"
                   [ ( "repo", Option.value repo ~default:"-" )
                   ; "tx-id", e.tx_id
                   ; "error", Printexc.to_string ex ];
                 None)
           | None -> Some (tx_items_of e.tx)
         in
         match tx_data with
         | Some items ->
             (match srv_db with
              | Some _ when items <> [] ->
                  (* availability must track what actually uploads — the
                     sanitized items, and only while the entry survives;
                     a uuid whose creation was sanitized out of an
                     emptied entry never reaches the server *)
                  let created', retracted' = pending_tx_uuid_delta items in
                  created_delta := SSet.union created' !created_delta;
                  retracted_delta := SSet.union retracted' !retracted_delta
              | _ -> ());
             Some
               (Wire.Map
                  [ kw "tx-id", Wire.String e.tx_id
                  ; kw "outliner-op"
                  , (match e.outliner_op with
                     | Some op -> kw op
                     | None -> Wire.Nil)
                  ; kw "tx-data", Wire.Array items ])
         | None ->
             missing_entity_tx_ids := e.tx_id :: !missing_entity_tx_ids;
             None)
      pending
  in
  let missing_entity_drops =
    List.map
      (fun tx_id ->
         Wire.Map
           [ kw "tx-id", Wire.String tx_id
           ; kw "reason", kw "missing-block-entity" ])
      (List.rev !missing_entity_tx_ids)
  in
  let empty_tx_ids =
    List.filter_map
      (fun e ->
         match Wire.get "tx-data" e with
         | Some (Wire.Array []) | Some (Wire.List []) ->
             Option.bind (Wire.get "tx-id" e) (fun w ->
                 match w with Wire.String s -> Some s | _ -> None)
         | _ -> None)
      entries
  in
  let drop_txs =
    List.filter_map
      (fun e ->
         match Wire.get "tx-data" e with
         | Some (Wire.Array []) | Some (Wire.List []) ->
             Some
               (Wire.Map
                  [ ( kw "tx-id"
                    , Option.value (Wire.get "tx-id" e) ~default:Wire.Nil )
                  ; ( kw "outliner-op"
                    , Option.value (Wire.get "outliner-op" e)
                        ~default:Wire.Nil )
                  ; kw "reason", kw "empty-tx-data" ])
         | _ -> None)
      entries
  in
  let tx_entries =
    List.filter
      (fun e ->
         match Wire.get "tx-data" e with
         | Some (Wire.Array (_ :: _)) | Some (Wire.List (_ :: _)) -> true
         | _ -> false)
      entries
  in
  let tx_entries =
    match (repo, conn) with
    | Some r, Some c -> cap_upload_request_tx_entries r (Conn.db c) tx_entries
    | _ -> tx_entries
  in
  ( tx_entries
  , empty_tx_ids @ List.rev !missing_entity_tx_ids
  , drop_txs @ missing_entity_drops )

let clear_large_upload_progress repo (tx_ids : string list) : unit =
  List.iter
    (fun tx_id -> Hashtbl.remove repo_large_upload_progress (repo, tx_id))
    tx_ids

let large_upload_progress (tx_entries : Wire.t list) : Wire.t list =
  List.filter_map
    (fun entry ->
       match Wire.get "large-upload-original-tx-id" entry with
       | Some (Wire.String _ as orig) ->
           Some
             (Wire.Map
                [ kw "large-upload-original-tx-id", orig
                ; ( kw "large-upload-next-index"
                  , Option.value
                      (Wire.get "large-upload-next-index" entry)
                      ~default:Wire.Nil )
                ; ( kw "large-upload-final?"
                  , Option.value
                      (Wire.get "large-upload-final?" entry)
                      ~default:Wire.Nil ) ])
       | _ -> None)
    tx_entries

(* test hook — cljs tests rebind prepare-upload-tx-entries (the
   upload-side counterpart of download_remote_asset_fn). *)
let prepare_upload_tx_entries_fn = ref prepare_upload_tx_entries

let pending_txs repo ?limit () : Sync_client_op.local_tx_entry list =
  Sync_client_op.get_pending_local_txs repo ?limit ()

let pending_tx_by_id repo tx_id : Sync_client_op.local_tx_entry option =
  Sync_client_op.get_local_tx_entry repo tx_id

(* forward-ref to rebuild_display (defined below) — dropping pending
   entries must re-project the display conn *)
let rebuild_display_fn : (string -> unit) ref = ref (fun _ -> ())

let mark_failed_txs ?(rebuild = true) repo (tx_ids : string list) : int =
  match tx_ids with
  | [] -> 0
  | _ ->
      clear_large_upload_progress repo tx_ids;
      let removed = Sync_client_op.mark_failed_txs repo tx_ids in
      if removed > 0 then begin
        Sync_client_op.adjust_pending_local_tx_count repo (-removed);
        (* dropping pending entries must re-project the display conn —
           during replay the rebuild in progress already drops them,
           and replay_pending_txs rebinds once more when any entry
           failed mid-apply. Batch callers pass ~rebuild:false and
           rebuild once after all drops. *)
        if rebuild && not !Sync_state.pending_replay then
          !rebuild_display_fn repo
      end;
      broadcast_rtc_state (current_client repo);
      removed

let mark_pending_txs_false ?(rebuild = true) repo (tx_ids : string list)
    : int =
  match tx_ids with
  | [] -> 0
  | _ ->
      clear_large_upload_progress repo tx_ids;
      let removed = Sync_client_op.mark_pending_txs_false repo tx_ids in
      if removed > 0 then begin
        Sync_client_op.adjust_pending_local_tx_count repo (-removed);
        if rebuild then !rebuild_display_fn repo
      end;
      broadcast_rtc_state (current_client repo);
      removed

let tx_meta_get name (tx_meta : tx_meta) =
  List.assoc_opt name tx_meta

(* ---- handle-local-tx! (forward decl via ref) ---- *)

let handle_local_tx_ref : (string -> tx_report -> unit) ref =
  ref (fun _ _ -> ())

let handle_local_tx repo tx_report = !handle_local_tx_ref repo tx_report

(* Server reject / sync failure: nothing pending lives in the server
   conn, so rejection only marks the ops failed and drops them from the
   projection. *)
let fail_pending_txs repo (tx_ids : string list) : unit =
  (* mark_failed already re-projects once — no second rebuild *)
  ignore (mark_failed_txs repo tx_ids)

(* ---- flush-pending! ---- *)

(* cljs <upload-aes-key *)
let upload_aes_key repo (tx_entries : Wire.t list) : Wire.t Db_worker_effect.t
    =
  let e2ee =
    tx_entries <> []
    &&
    match Worker_state.datascript_conn repo with
    | Some c ->
        Sync_deps.require "graph_e2ee" Sync_deps.graph_e2ee (Conn.db c)
    | None -> false
  in
  if e2ee then
    Sync_deps.require "ensure_graph_aes_key" Sync_deps.ensure_graph_aes_key
      repo
    >>= fun aes_key ->
    if aes_key = Wire.Nil then
      Sync_util.fail_fast "db-sync/missing-field"
        (Wire.Map
           [ kw "repo", Wire.String repo; kw "field", kw "aes-key" ]);
    Db_worker_effect.pure aes_key
  else Db_worker_effect.pure Wire.Nil

(* cljs <encrypt-tx-entry *)
let encrypt_tx_entry repo (client : Sync_state.client) aes_key
    (entry : Wire.t) : Wire.t Db_worker_effect.t =
  let graph_id = Option.value client.graph_id ~default:"" in
  let tx_data =
    Option.value (Wire.get "tx-data" entry) ~default:(Wire.Array [])
    |> tx_items_of
  in
  offload_large_titles repo graph_id tx_data aes_key
  >>= fun tx_data' ->
  (match aes_key with
   | Wire.Nil -> Db_worker_effect.pure tx_data'
   | _ ->
       Sync_deps.require "encrypt_tx_data" Sync_deps.encrypt_tx_data
         (match aes_key with
          | Wire.Binary b -> b
          | Wire.String s -> s
          | _ -> invalid_arg "encrypt_tx_data: aes-key is not binary")
         tx_data')
  >>= fun tx_data'' ->
  Db_worker_effect.pure
    (Wire.Map
       (List.map
          (fun (k, v) ->
             if k = kw "tx-data" then (k, Wire.Array tx_data'') else (k, v))
          (Wire.as_map entry)))

(* cljs tx-entry->upload-message *)
let tx_entry_to_upload_message (entry : Wire.t) : Wire.t =
  let tx_str =
    Transit_codec.to_string
      (Option.value (Wire.get "tx-data" entry) ~default:(Wire.Array []))
  in
  let base : (Wire.t * Wire.t) list = [ kw "tx", Wire.String tx_str ] in
  let with_id =
    match Wire.get "tx-id" entry with
    | Some (Wire.String id) -> base @ [ kw "tx-id", Wire.String id ]
    | _ -> base
  in
  Wire.Map
    (match Wire.get "outliner-op" entry with
     | Some ((Wire.Keyword _ | Wire.String _) as op) ->
         with_id @ [ kw "outliner-op", op ]
     | _ -> with_id)

(* cljs send-tx-batch! *)
let send_tx_batch (client : Sync_state.client)
    (ws : Sync_state.ws_endpoint) (local_tx : int option)
    (tx_entries : Wire.t list) (tx_entries' : Wire.t list)
    : unit Db_worker_effect.t =
  let payload = List.map tx_entry_to_upload_message tx_entries' in
  let tx_ids =
    List.filter_map
      (fun e ->
         match Wire.get "tx-id" e with
         | Some (Wire.String s) -> Some s
         | _ -> None)
      tx_entries
  in
  client.inflight := tx_ids;
  let outliner_ops =
    List.filter_map
      (fun e ->
         match Wire.get "outliner-op" e with
         | Some (Wire.Keyword s) -> Some s
         | _ -> None)
      tx_entries
    |> List.sort_uniq compare
  in
  send ws
    (Wire.Map
       [ kw "type", Wire.String "tx/batch"
       ; kw "client-revision", Wire.String (Sync_util.build_revision ())
       ; ( kw "t-before"
         , match local_tx with Some t -> Wire.Int t | None -> Wire.Nil )
       ; kw "txs", Wire.Array payload ])
  >>= fun () ->
  start_upload_response_timeout client
    { Sync_state.tx_ids
    ; outliner_ops
    ; large_upload_progress = large_upload_progress tx_entries'
    ; t_before = local_tx
    ; sent_at = Time.monotonic_now ()
    ; timer = None };
  Db_worker_effect.pure ()

(* cljs <upload-pending-batch! *)
let upload_pending_batch repo (client : Sync_state.client) (conn : conn)
    (local_tx : int option) : unit Db_worker_effect.t =
  match pending_txs repo ~limit:50 () with
  | [] -> Db_worker_effect.pure ()
  | batch ->
      let tx_entries, drop_tx_ids, drop_txs =
        !prepare_upload_tx_entries_fn ~repo
          ?server_db:(Option.map Conn.db (Sync_state.server_conn repo))
          (Some conn) batch
      in
      if drop_tx_ids <> [] then begin
        Worker_log.info "db-sync/drop-tx-ids"
          [ "tx-ids", String.concat "," drop_tx_ids
          ; "drops", Transit_codec.to_string (Wire.Array drop_txs) ];
        let failed_ids, benign_ids =
          List.partition_map
            (fun d ->
               match Wire.get "reason" d with
               | Some (Wire.Keyword "missing-block-entity") -> (
                   match Wire.get "tx-id" d with
                   | Some (Wire.String id) -> Either.Left id
                   | _ -> Either.Right "")
               | _ -> (
                   match Wire.get "tx-id" d with
                   | Some (Wire.String id) -> Either.Right id
                   | _ -> Either.Right ""))
            drop_txs
        in
        (* one rebuild for the whole drop batch, not one per marker *)
        let dropped_failed =
          mark_failed_txs ~rebuild:false repo
            (List.filter (( <> ) "") failed_ids)
        in
        let dropped_benign =
          mark_pending_txs_false ~rebuild:false repo
            (List.filter (( <> ) "") benign_ids)
        in
        if dropped_failed + dropped_benign > 0 then
          !rebuild_display_fn repo
      end;
      Db_worker_effect.catch
        (upload_aes_key repo tx_entries >>= fun aes_key ->
         Db_worker_effect.all
           (List.map (encrypt_tx_entry repo client aes_key) tx_entries)
         >>= fun tx_entries' ->
         match tx_entries with
         | [] -> Db_worker_effect.pure ()
         | _ ->
             send_tx_batch client (Option.get client.ws) local_tx tx_entries
               tx_entries')
        (fun error ->
           Sync_util.set_last_sync_error client error;
           Worker_log.error "db-sync/flush-pending-failed"
             [ "repo", repo; "error", Printexc.to_string error ];
           Db_worker_effect.pure ())

let flush_pending repo (client : Sync_state.client) : unit Db_worker_effect.t =
  let inflight = !(client.inflight) in
  let local_tx = Sync_client_op.get_local_tx repo in
  let remote_tx = Hashtbl.find_opt repo_latest_remote_tx repo in
  let conn = Worker_state.datascript_conn repo in
  let ws = client.ws in
  let ws_open_state =
    match ws with Some w -> Sync_transport.ws_open w | None -> false
  in
  let online = Sync_state.online () in
  let upload_stopped_state = upload_stopped repo in
  let pending_count = Sync_client_op.get_pending_local_tx_count repo in
  let ready =
    conn <> None
    && local_tx = remote_tx
    && inflight = [] && ws_open_state && online
    && not upload_stopped_state
  in
  if pending_count > 0 && not ready then
    Worker_log.info "db-sync/flush-pending-skipped"
      [ "repo", repo
      ; "pending-local-tx-count", string_of_int pending_count
      ; "has-db?", string_of_bool (conn <> None)
      ; ( "local-tx"
        , match local_tx with Some t -> string_of_int t | None -> "nil" )
      ; ( "remote-tx"
        , match remote_tx with Some t -> string_of_int t | None -> "nil" )
      ; "inflight-count", string_of_int (List.length inflight)
      ; "ws-open?", string_of_bool ws_open_state
      ; "online?", string_of_bool online
      ; "upload-stopped?", string_of_bool upload_stopped_state ];
  if not ready then Db_worker_effect.pure ()
  else
    match conn with
    | None -> Db_worker_effect.pure ()
    | Some conn -> upload_pending_batch repo client conn local_tx

(* test hook — cljs tests rebind flush-pending! to a no-op to isolate
   message handlers (hello/pull-ok) from the upload path. *)
let flush_pending_fn = ref flush_pending

let enqueue_flush_pending repo (client : Sync_state.client) : unit =
  Sync_state.enqueue_catching client.send_queue
    (fun () -> !flush_pending_fn repo client)
    ~on_error:(fun e ->
       Worker_log.error "db-sync/flush-pending-queue-failed"
         [ "repo", repo; "error", Printexc.to_string e ];
       Db_worker_effect.pure ())

(* ---- enqueue-local-tx! ---- *)

let rec enqueue_local_tx_aux repo (tx_report : tx_report) : string option =
  let normalized =
    normalize_tx_data ~memo:(Db_normalize.create_memo ())
      tx_report.db_after tx_report.db_before tx_report.tx_data
  in
  let reversed_datoms =
    (* separate memo: the db roles swap between forward and reverse, so a
       shared resolve cache would return the wrong db's lookups *)
    reverse_tx_data ~memo:(Db_normalize.create_memo ())
      tx_report.db_before tx_report.db_after tx_report.tx_data
  in
  match normalized with
  | [] -> None
  | _ -> (
      match persist_local_tx repo tx_report normalized reversed_datoms with
      | Some tx_id ->
          (match !(Sync_state.db_sync_client) with
           | Some client when client.repo = repo ->
               enqueue_flush_pending repo client
           | _ -> ());
          Some tx_id
      | None -> None)

and persist_local_tx repo (tx_report : tx_report) normalized reversed
    : string option =
  if not (Sync_state.has_client_ops_conn repo) then None
  else begin
    let tx_meta = tx_report.tx_meta in
    let tx_id =
      match List.assoc_opt "db-sync/tx-id" tx_meta with
      | Some (Uuid s) -> s
      | _ -> Uuid_gen.uuid ()
    in
    let outliner_op = tx_meta_outliner_op tx_meta in
    let forward_ops, inverse_ops =
      derive_history_outliner_ops tx_report.db_before tx_report.db_after
        (Db_normalize.wire_of_datoms tx_report.tx_data)
        tx_meta
    in
    let result =
      Sync_client_op.upsert_local_tx_entry repo ~tx_id
        ~created_at:(Time.now ()) ~pending:true
        ~failed:false
        ~outliner_op:
          (match outliner_op with
           | Some (Keyword s) -> Some s
           | _ -> None)
        ~undo_redo:
          (match
             ( List.assoc_opt "undo?" tx_meta
             , List.assoc_opt "redo?" tx_meta )
           with
           | Some (Bool true), _ -> Some "undo"
           | _, Some (Bool true) -> Some "redo"
           | _ -> Some "none")
        ~forward_outliner_ops:forward_ops
        ~inverse_outliner_ops:inverse_ops
        ~inferred_outliner_ops:(inferred_outliner_ops tx_meta)
        ~normalized_tx_data:(Wire.Array normalized)
        ~reversed_tx_data:(Wire.Array reversed) ()
    in
    (match !Sync_deps.gen_undo_ops with
     | Some f -> f repo tx_report tx_id
     | None -> ());
    if result.should_inc_pending then begin
      Sync_client_op.adjust_pending_local_tx_count repo 1;
      broadcast_rtc_state (current_client repo)
    end;
    Some tx_id
  end

let persistable_local_tx_meta (tx_meta : tx_meta) : bool =
  let flag name default =
    match List.assoc_opt name tx_meta with
    | Some (Bool b) -> b
    | _ -> default
  in
  not (flag "rtc-tx?" false)
  && not (flag "transact-remote?" false)
  && not (flag "sync-download-graph?" false)
  && flag "persist-op?" true
  && tx_meta_get "outliner-op" tx_meta <> Some (Keyword "rebase")

let enqueue_local_tx repo (tx_report : tx_report) : unit =
  match Worker_state.datascript_conn repo with
  | None -> ()
  | Some _ ->
      let tx_meta = tx_report.tx_meta in
      let batch_tx_report =
        tx_meta_get "batch-tx-report?" tx_meta = Some (Bool true)
      in
      if persistable_local_tx_meta tx_meta
         && not batch_tx_report
         && tx_meta_get "reverse?" tx_meta <> Some (Bool true)
         && tx_report.tx_data <> [] then
        ignore (enqueue_local_tx_aux repo tx_report)

let handle_local_tx_impl repo (tx_report : tx_report) : unit =
  if tx_report.tx_data <> [] && persistable_local_tx_meta tx_report.tx_meta
     && not !Sync_state.pending_replay
  then begin
    enqueue_local_tx repo tx_report;
    Sync_asset_db_listener.generate_asset_ops repo ~db_after:tx_report.db_after
      ~tx_data:tx_report.tx_data;
    match !(Sync_state.db_sync_client) with
    | Some client when client.repo = repo -> (
        let graph_remote =
          Ldb.get_key_value tx_report.db_after "logseq.kv/graph-remote?"
          = Some (Bool true)
        in
        if graph_remote then
          Sync_assets.enqueue_asset_sync repo client
            ~enqueue_asset_task:Sync_assets.enqueue_asset_task
            ~current_client
            ~broadcast_rtc_state:(fun c -> broadcast_rtc_state (Some c)))
    | _ -> ()
  end

let () = handle_local_tx_ref := handle_local_tx_impl
