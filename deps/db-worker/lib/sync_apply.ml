(* frontend.worker.sync.apply-txs — pending tx persistence, remote tx
   application on the server conn plus pending replay on the display
   projection (no reverse/rebase), upload flush, and undo/redo history
   actions.

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
                 | Wire.Keyword a'
                   when ref_attr db a' && is_missing_ref v -> None
                 | _ -> Some item))
       | _ -> Some item)
    tx_data

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
                      (Conn.db c) (tx_items_of e.tx))
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

let invalid_rebase_op op data : 'a =
  let data' =
    match data with
    | Wire.Map kvs -> Wire.Map (kvs @ [ kw "op", op ])
    | _ -> data
  in
  raise (Sync_util.ex_info "invalid rebase op" (Wire.as_map data'))

let expected_stale_rebase_error (error : exn) : bool =
  let err, attr =
    match error with
    | Dispatcher.Exn_info (_, kvs) ->
        ( List.assoc_opt (Wire.Keyword "error") kvs
        , List.assoc_opt (Wire.Keyword "attribute") kvs )
    | _ -> (None, None)
  in
  (* datascript raises bare invalid_arg where cljs datascript attaches
     ex-data: "Nothing found for entity id" = :entity-id/missing;
     "unique constraint" = :transact/unique. The cljs check narrows the
     latter to :block/uuid, but in a rebase-reverse context block/uuid is
     the only db.unique attribute that can conflict. *)
  match error with
  | Dispatcher.Exn_info (msg, _) when msg = "invalid rebase op" -> true
  | Invalid_argument msg
    when msg = "unique constraint"
         || Common_util.str_starts_with msg "Nothing found for entity id" -> true
  | _ ->
      err = Some (kw "entity-id/missing")
      || (err = Some (kw "transact/unique") && attr = Some (kw "block/uuid"))

let history_action_error_reason (error : exn) : Wire.t =
  let msg =
    match error with
    | Dispatcher.Exn_info (msg, _) -> msg
    | e -> Printexc.to_string e
  in
  if msg = "invalid rebase op"
     || msg = "Non-transact outliner ops contain numeric entity ids" then
    kw "invalid-history-action-ops"
  else kw "error"

let expected_history_action_error_reason reason : bool =
  reason = kw "invalid-history-action-ops"
  || reason = kw "invalid-history-action-tx"

(* batch-transact-with-temp-conn! with cljs {:listen-db :before-commit} *)
let batch_transact_with_temp_conn_impl (conn : conn) (tx_meta : tx_meta)
    ?(listen_db : (tx_report -> unit) option)
    ?(before_commit : (unit -> unit) option) (f : conn -> unit) () :
    tx_report option =
  let temp_conn =
    Datascript.conn_from_db
      { (Datascript.db conn) with storage_ref = None }
  in
  let fl = Db_tx.flags_of temp_conn in
  fl.Db_tx.batch_tx <- true;
  fl.Db_tx.skip_store <- true;
  fl.Db_tx.skip_validate <- true;
  let collected = ref [] in
  let listener_id =
    Datascript.listen temp_conn "temp-conn-batch-tx" (fun report ->
         collected := List.rev_append report.tx_data !collected;
         match listen_db with
         | Some listen -> listen report
         | None -> ())
  in
  Db_tx.with_temp_conn_cleanup temp_conn listener_id (fun () ->
      f temp_conn;
      match before_commit with
      | Some bc -> bc ()
      | None -> ());
  match List.rev !collected with
  | [] -> None
  | datoms ->
      Db_transact.transact conn
        (List.map
           (fun (d : datom) ->
              Wire.Array
                [ kw (if d.added then "db/add" else "db/retract")
                ; Wire.Int d.e; kw d.a; Ds_wire.transit_of_value d.v ])
           datoms)
        tx_meta

(* cljs with-redefs seam — tests intercept the temp-conn batch to inject a
   local change mid-apply *)
let batch_transact_with_temp_conn_fn = ref batch_transact_with_temp_conn_impl

let batch_transact_with_temp_conn (conn : conn) (tx_meta : tx_meta)
    ?(listen_db : (tx_report -> unit) option)
    ?(before_commit : (unit -> unit) option) (f : conn -> unit) () :
    tx_report option =
  !batch_transact_with_temp_conn_fn conn tx_meta ?listen_db ?before_commit f ()

(* ---- entity resolution helpers for replay ---- *)

let replay_entity_id_value (db : db) (v : Wire.t) : Wire.t =
  match v with
  | Wire.Int _ -> v
  | Wire.Uuid _ -> (
      match
        Datascript.entity db (Lookup_ref ("block/uuid", Ds_wire.value_of_transit v))
      with
      | Some e -> Wire.Int e.id
      | None -> Wire.Nil)
  | Wire.Array _ | Wire.List _ | Wire.Keyword _ -> (
      match
        (try Datascript.entity db (Ds_wire.entity_ref_of_transit v)
         with _ -> None)
      with
      | Some e -> Wire.Int e.id
      | None -> Wire.Nil)
  | _ -> v

let replay_entity_id_coll (db : db) (ids : Wire.t) : Wire.t list =
  ids
  |> tx_items_of
  |> List.map (fun v ->
         match replay_entity_id_value db v with
         | Wire.Nil -> v
         | w -> w)

let entity_of_wire_ref (db : db) (v : Wire.t) : entity option =
  match v with
  | Wire.Int n -> Datascript.entity db (Entity_id n)
  | Wire.Uuid s -> Datascript.entity db (Lookup_ref ("block/uuid", Uuid s))
  | _ -> (
      try Datascript.entity db (Ds_wire.entity_ref_of_transit v)
      with _ -> None)

let get_left_sibling_entity (e : entity) : entity option =
  Ldb.get_left_sibling e

let rebase_find_existing_left_sibling (current_db : db) (target : entity)
    : entity option =
  let rec loop (sibling : entity option) =
    match sibling with
    | None -> None
    | Some s -> (
        let su =
          match Datascript.entity_attr s "block/uuid" with
          | Some (One_value (Uuid u)) -> Some u
          | _ -> None
        in
        match su with
        | Some u -> (
            match
              Datascript.entity current_db (Lookup_ref ("block/uuid", Uuid u))
            with
            | Some cur -> Some cur
            | None -> loop (Ldb.get_left_sibling s))
        | None -> loop (Ldb.get_left_sibling s))
  in
  loop (Ldb.get_left_sibling target)

let rebase_target_ref (target_id : Wire.t) : Wire.t =
  match target_id with
  | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = kw "block/uuid" ->
      target_id
  | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; target_id ]
  | Wire.Map _ -> (
      match Wire.get "block/uuid" target_id with
      | Some (Wire.Uuid _ as u) -> Wire.Array [ kw "block/uuid"; u ]
      | _ -> target_id)
  | _ -> target_id

(* Walks a deleted target's ancestor chain on db_before: the closest
   ancestor still present on current_db becomes the insert parent, and
   falling off the top lands on the target's own block/page entity. *)
let resolve_ancestor_or_page (db_before : db) (current_db : db)
    (tb : entity) : entity option =
  let entity_on_current (e : entity) : entity option =
    match Datascript.entity_attr e "block/uuid" with
    | Some (One_value (Uuid u)) ->
        Datascript.entity current_db (Lookup_ref ("block/uuid", Uuid u))
    | _ -> None
  in
  let parent_on (d : db) (e : entity) : entity option =
    match Datascript.entity_attr e "block/parent" with
    | Some (One_entity pe) ->
        Option.bind pe.db_id (fun r ->
            try Datascript.entity d r with _ -> None)
    | _ -> None
  in
  let visited = Hashtbl.create 7 in
  let rec up (e : entity) : entity option =
    if Hashtbl.mem visited e.id then None
    else begin
      Hashtbl.replace visited e.id ();
      match parent_on db_before e with
      | Some p -> (
          match entity_on_current p with
          | Some cur -> Some cur
          | None -> up p)
      | None -> (
          match Datascript.entity_attr e "block/page" with
          | Some (One_entity pe) -> (
              match
                Option.bind pe.db_id (fun r ->
                    try Datascript.entity db_before r with _ -> None)
              with
              | Some page -> entity_on_current page
              | None -> None)
          | _ -> None)
    end
  in
  up tb

let rebase_resolve_target_and_sibling ?(page_root_fallback = false)
    (current_db : db) (rebase_db_before : db option) (target_id : Wire.t)
    (sibling : bool) : (entity * bool) option =
  let target_ref = rebase_target_ref target_id in
  let target = entity_of_wire_ref current_db target_ref in
  let target_before, parent_uuid =
    match rebase_db_before with
    | Some db -> (
        ( entity_of_wire_ref db target_ref
        , match entity_of_wire_ref db target_ref with
          | Some e -> (
              match Datascript.entity_attr e "block/parent" with
              | Some (One_entity te) -> (
                  match
                    Option.bind te.db_id (fun r ->
                         try Some (Datascript.entity db r) with _ -> None)
                  with
                  | Some (Some parent) -> (
                      match Datascript.entity_attr parent "block/uuid" with
                      | Some (One_value (Uuid u)) -> Some u
                      | _ -> None)
                  | _ -> None)
              | _ -> None)
          | None -> None ))
    | None -> (None, None)
  in
  let page_root tb =
    if page_root_fallback then
      match rebase_db_before with
      | Some db ->
          Option.map
            (fun e -> (e, false))
            (resolve_ancestor_or_page db current_db tb)
      | None -> None
    else None
  in
  let r =
    match target with
    | Some t -> Some (t, sibling)
    | None -> (
        match (target_before, parent_uuid, sibling) with
        | Some tb, Some puuid, true -> (
            match rebase_find_existing_left_sibling current_db tb with
            | Some s -> Some (s, true)
            | None -> (
                match
                  Datascript.entity current_db
                    (Lookup_ref ("block/uuid", Uuid puuid))
                with
                | Some parent -> Some (parent, false)
                | None -> page_root tb))
        | Some tb, _, _ -> page_root tb
        | _ -> None)
  in
  r

let template_parent_ref (parent : Wire.t) : Wire.t =
  match parent with
  | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = kw "block/uuid" ->
      parent
  | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; parent ]
  | Wire.Map _ -> (
      match Wire.get "block/uuid" parent with
      | Some (Wire.Uuid _ as u) -> Wire.Array [ kw "block/uuid"; u ]
      | _ -> parent)
  | _ -> parent

(* cljs truthy — anything but nil/false *)
let wire_truthy (v : Wire.t option) : bool =
  match v with
  | Some Wire.Nil | Some (Wire.Bool false) | None -> false
  | Some _ -> true

let sanitize_template_block (current_db : db) (rebase_db_before : db option)
    (block : Wire.t) : Wire.t =
  let m = Wire.as_map block in
  let block_id =
    List.assoc_opt (kw "db/id") m |> Option.value ~default:Wire.Nil
  in
  (* cljs (or (:block/uuid m) ...) — a truthy :block/uuid wins raw, whatever
     its shape; the db/id and lookup-vector fallbacks only run when it's
     absent/nil/false. uuid? is checked at assoc time, so a non-uuid
     :block/uuid is kept verbatim rather than replaced by a db lookup. *)
  let block_uuid =
    match List.assoc_opt (kw "block/uuid") m with
    | Some v when v <> Wire.Nil && v <> Wire.Bool false -> Some v
    | _ -> (
        match block_id with
        | Wire.Int n -> (
            let from db = entity_block_uuid db n in
            match rebase_db_before with
            | Some db -> (
                match from db with
                | Some u -> Some (Wire.Uuid u)
                | None -> (
                    match from current_db with
                    | Some u -> Some (Wire.Uuid u)
                    | None -> None))
            | None -> (
                match from current_db with
                | Some u -> Some (Wire.Uuid u)
                | None -> None))
        | Wire.Array [ a; u ] | Wire.List [ a; u ]
          when a = kw "block/uuid" -> (
            match u with Wire.Uuid _ -> Some u | _ -> None)
        | _ -> None)
  in
  let dropped =
    List.filter
      (fun (k, _) ->
         k <> kw "db/id" && k <> kw "block/order" && k <> kw "block/page"
         && k <> kw "block/tx-id")
      m
  in
  (* cljs (update :block/parent template-parent-ref) — :block/parent is
     always present in the result (nil when absent in the input) *)
  let with_parent =
    let has_parent = List.exists (fun (k, _) -> k = kw "block/parent") dropped in
    let mapped =
      List.map
        (fun (k, v) ->
           if k = kw "block/parent" then (k, template_parent_ref v)
           else (k, v))
        dropped
    in
    if has_parent then mapped
    else mapped @ [ (kw "block/parent", template_parent_ref Wire.Nil) ]
  in
  match block_uuid with
  | Some (Wire.Uuid _ as u) ->
      Cljs_map.assoc (Wire.Map with_parent) "block/uuid" u
  | _ -> Wire.Map with_parent

(* ---- replay-canonical-outliner-op! ---- *)

let kw_str (w : Wire.t) : string option =
  match w with Wire.Keyword s | Wire.String s -> Some s | _ -> None

let opts_wire_map (w : Wire.t) : Wire.t =
  match w with Wire.Map _ -> w | _ -> Wire.Map []

let block_map_wire (w : Wire.t) : Block_map.t =
  Outliner_op.block_map_of_wire w

let rec replay_canonical_outliner_op (conn : conn) (op_entry : Wire.t)
    (rebase_db_before : db option) : Wire.t option =
  let op, args =
    match Outliner_op.op_of_entry op_entry with
    | Some x -> x
    | None -> invalid_rebase_op op_entry (Wire.Map [])
  in
  let db = Conn.db conn in
  match (op, args) with
  | "save-block", [ block; opts ] ->
      let block_uuid = Wire.get "block/uuid" block in
      let block_ent =
        match block_uuid with
        | Some (Wire.Uuid u) ->
            Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        | _ -> None
      in
      let block_base =
        block
        |> Wire.as_map
        |> List.filter (fun (k, _) -> k <> kw "db/id" && k <> kw "block/order")
        |> fun kvs -> Wire.Map kvs
      in
      let block' =
        Sync_deps.require "rewrite_block_title_with_retracted_refs"
          Sync_deps.rewrite_block_title_with_retracted_refs db block_base
      in
      (match block_ent with
       | None ->
           invalid_rebase_op (kw op)
             (Wire.Map [ kw "args", Wire.Array args
                       ; kw "reason", kw "missing-block" ])
       | Some _ -> ());
      ignore
        (Outliner_core.save_block_conn conn (block_map_wire block')
           (Outliner_op.save_opts_of (opts_wire_map opts))
           (block_map_wire opts));
      None
  | "insert-blocks", [ blocks; target_id; opts ] ->
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      (match
         rebase_resolve_target_and_sibling db rebase_db_before target_id
           ~page_root_fallback:true sibling
       with
       | Some (target, sibling') -> (
           let blocks' =
             tx_items_of blocks
             |> List.map (fun b ->
                    Sync_deps.require
                      "rewrite_block_title_with_retracted_refs"
                      Sync_deps.rewrite_block_title_with_retracted_refs db b)
           in
           match blocks' with
           | [] ->
               invalid_rebase_op (kw op)
                 (Wire.Map [ kw "args", Wire.Array args ])
           | _ ->
               let opts' =
                 Cljs_map.assoc (opts_wire_map opts) "sibling?"
                   (Wire.Bool sibling')
               in
               ignore
                 (Outliner_core.insert_blocks_conn conn
                    (List.map block_map_wire blocks')
                    (Block_map.of_entity target)
                    (Outliner_op.insert_opts_of opts')
                    (block_map_wire opts'));
               None)
       | None ->
           invalid_rebase_op (kw op)
             (Wire.Map [ kw "args", Wire.Array args ]))
  | "apply-template", [ template_id; target_id; opts ] -> (
      let template_id' = replay_entity_id_value db template_id in
      let target_id' = replay_entity_id_value db target_id in
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let resolved =
        rebase_resolve_target_and_sibling db rebase_db_before target_id'
          ~page_root_fallback:true sibling
      in
      let template_ent = entity_of_wire_ref db template_id' in
      match (template_ent, resolved) with
      | Some template, Some (target, sibling') -> (
          let template_uuid =
            match Datascript.entity_attr template "block/uuid" with
            | Some (One_value (Uuid u)) -> Some u
            | _ -> None
          in
          let target_uuid =
            match Datascript.entity_attr target "block/uuid" with
            | Some (One_value (Uuid u)) -> Some u
            | _ -> None
          in
          match (template_uuid, target_uuid) with
          | Some tuuid, Some tguuid ->
              let replace_empty_target =
                match Wire.get "replace-empty-target?"
                        (opts_wire_map opts) with
                | Some (Wire.Bool b) -> b
                | _ -> false
              in
              let template_blocks =
                match Wire.get "template-blocks" (opts_wire_map opts) with
                | Some (Wire.Array xs) | Some (Wire.List xs) ->
                    xs
                    |> List.mapi (fun idx block ->
                           let block' =
                             sanitize_template_block db rebase_db_before
                               block
                           in
                           let block'' =
                             if replace_empty_target && idx = 0
                                && not
                                     (wire_truthy
                                        (Wire.get "block/uuid" block'))
                             then
                               Cljs_map.assoc block' "block/uuid"
                                 (Wire.Uuid tguuid)
                             else block'
                           in
                           if wire_truthy (Wire.get "block/uuid" block'') then
                             Some block''
                           else None)
                    |> List.filter_map Fun.id
                | _ -> []
              in
              let opts' =
                let o = opts_wire_map opts in
                let o = Cljs_map.assoc o "sibling?" (Wire.Bool sibling') in
                let o =
                  Wire.Map
                    (List.filter
                       (fun (k, _) -> k <> kw "template-blocks")
                       (Wire.as_map o))
                in
                if template_blocks <> [] then
                  Cljs_map.assoc o "template-blocks"
                    (Wire.Array template_blocks)
                else o
              in
              ignore
                (Outliner_op.apply_ops conn
                   (Wire.Array
                      [ Wire.Array
                          [ kw "apply-template"
                          ; Wire.Array
                              [ Wire.Uuid tuuid; Wire.Uuid tguuid; opts' ] ] ])
                   (Wire.Map [ (kw "gen-undo-ops?", Wire.Bool false) ]));
              None
          | _ ->
              invalid_rebase_op (kw op)
                (Wire.Map
                   [ kw "args", Wire.Array args
                   ; kw "reason", kw "missing-template-or-target-uuid" ]))
      | _ ->
          invalid_rebase_op (kw op)
            (Wire.Map
               [ kw "args", Wire.Array args
               ; kw "reason", kw "missing-template-or-target-block" ]))
  | "move-blocks", [ ids; target_id; opts ] -> (
      let ids' = replay_entity_id_coll db ids in
      let target_id' = replay_entity_id_value db target_id in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let resolved =
        rebase_resolve_target_and_sibling db rebase_db_before target_id'
          sibling
      in
      match (blocks, resolved) with
      | _ :: _, Some (target, sibling') ->
          Outliner_core.move_blocks_conn conn blocks target
            (Outliner_op.insert_opts_of
               (Cljs_map.assoc (opts_wire_map opts) "sibling?"
                  (Wire.Bool sibling')))
            (block_map_wire
               (Cljs_map.assoc (opts_wire_map opts) "sibling?"
                  (Wire.Bool sibling')));
          None
      | _ ->
          invalid_rebase_op (kw op) (Wire.Map [ kw "args", Wire.Array args ]))
  | "move-blocks-up-down", [ ids; up ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let up = match up with Wire.Bool b -> b | _ -> false in
      (match blocks with
       | [] -> ()
       | _ -> Outliner_core.move_blocks_up_down_conn conn blocks up);
      None
  | "indent-outdent-blocks", [ ids; indent; opts ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let indent = match indent with Wire.Bool b -> b | _ -> false in
      (match blocks with
       | [] ->
           invalid_rebase_op (kw op)
             (Wire.Map [ kw "args", Wire.Array args ])
       | _ ->
           Outliner_core.indent_outdent_blocks_conn conn blocks indent
             (block_map_wire (opts_wire_map opts)));
      None
  | "delete-blocks", [ ids; _opts ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      (match blocks with
       | [] -> ()
       | _ ->
           ignore
             (Outliner_core.delete_blocks_conn conn
                (List.map Block_map.of_entity blocks)
                (block_map_wire (opts_wire_map _opts))));
      None
  | "create-page", [ title; opts ] -> (
      let title_str =
        match title with Wire.String s -> s | _ -> ""
      in
      let opts = opts_wire_map opts in
      let opt_bool k =
        match Wire.get k opts with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let page_uuid =
        match Wire.get "uuid" opts with
        | Some (Wire.Uuid u) -> Some u
        | Some (Wire.String u) when Sync_state.uuid_string u -> Some u
        | _ -> None
      in
      let existing_page =
        (* A page, a tag or a property can share a title; only an entity
           of the kind being created is this page. *)
        let by_title =
          match Ldb.get_page db (String title_str) with
          | Some page
            when (not (Ldb.is_property page))
                 && opt_bool "class?" = Ldb.is_class page ->
              Some page
          | _ -> None
        in
        match page_uuid with
        | Some u -> (
            match
              Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
            with
            | Some e -> Some e
            | None -> by_title)
        | None -> by_title
      in
      match existing_page with
      | Some page when not (Ldb.recycled page) -> (
          let title_v =
            match Datascript.entity_attr page "block/title" with
            | Some (One_value (String s)) -> Wire.String s
            | _ -> Wire.Nil
          in
          let uuid_v =
            match Datascript.entity_attr page "block/uuid" with
            | Some (One_value (Uuid u)) -> Wire.Uuid u
            | _ -> Wire.Nil
          in
          Some (Wire.Array [ title_v; uuid_v ]))
      | _ ->
          (* cljs (outliner-page/create! conn title opts) — opts carries
             :uuid/:tags/:properties/flags; keep them on replay so the
             recreated page keeps the wire uuid *)
          let created_title, created_uuid =
            Outliner_page.create_bang conn title_str
              ~opts:(fun () ->
                Outliner_page.create db title_str
                    ?uuid:page_uuid
                    ?tags:
                      (match Wire.get "tags" opts with
                       | Some w -> Some (tx_items_of w)
                       | None -> None)
                    ?properties:
                      (match Wire.get "properties" opts with
                       | Some (Wire.Map kvs) ->
                           Some
                             (List.filter_map
                                (fun (k, v) ->
                                   match kw_str k with
                                   | Some s -> Some (s, v)
                                   | None -> None)
                                kvs)
                       | _ -> None)
                    ~persist_op:
                      (match Wire.get "persist-op?" opts with
                       | Some (Wire.Bool b) -> b
                       | _ -> true)
                    ~class_:(opt_bool "class?")
                    ~journal:(opt_bool "journal?")
                    ~today_journal:(opt_bool "today-journal?")
                    ~split_namespace:
                      (match Wire.get "split-namespace?" opts with
                       | Some (Wire.Bool b) -> b
                       | _ -> false)
                    ?class_ident_namespace:
                      (match Wire.get "class-ident-namespace" opts with
                       | Some (Wire.String s) -> Some s
                       | _ -> None)
                    ())
              ()
          in
          (* cljs create! returns [title page-uuid] *)
          Some
            (Wire.Array
               [ Wire.String created_title
               ; (match created_uuid with
                  | Some u -> Wire.Uuid u
                  | None -> Wire.Nil) ]))
  | "delete-page", [ page_uuid; opts ] ->
      (match page_uuid with
       | Wire.Uuid u | Wire.String u ->
           ignore (Outliner_page.delete_conn conn u (opts_wire_map opts))
       | _ -> ());
      None
  | "upsert-property", property_id :: schema :: rest -> (
      let opts = match rest with o :: _ -> opts_wire_map o | [] -> Wire.Map [] in
      let property_name =
        Option.bind (Wire.get "property-name" opts) kw_str
      in
      let properties =
        match Wire.get "properties" opts with
        | Some (Wire.Map kvs) ->
            List.filter_map
              (fun (k, v) -> Option.map (fun k' -> (k', v)) (kw_str k))
              kvs
        | _ -> []
      in
      ignore
        (Outliner_property.upsert_property conn (kw_str property_id) schema
           ~property_name ~properties);
      None)
  | "restore-recycled", [ root_id ] -> (
      let root_ref =
        match root_id with
        | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = kw "block/uuid" ->
            root_id
        | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; root_id ]
        | _ -> root_id
      in
      let root = entity_of_wire_ref db root_ref in
      let tx_ops =
        match root with
        | Some r -> Outliner_recycle.restore_tx_data db r
        | None -> []
      in
      match tx_ops with
      | [] ->
          invalid_rebase_op (kw op)
            (Wire.Map
               [ kw "args", Wire.Array args
               ; kw "reason", kw "invalid-restore-target" ])
      | _ ->
          ignore
            (Db_tx.transact
               ~tx_meta:[ "outliner-op", Keyword "restore-recycled" ] conn
               tx_ops);
          None)
  | "recycle-delete-permanently", [ root_id ] -> (
      let root_ref =
        match root_id with
        | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = kw "block/uuid" ->
            root_id
        | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; root_id ]
        | _ -> root_id
      in
      let root = entity_of_wire_ref db root_ref in
      match root with
      | Some r -> (
          match Outliner_recycle.permanently_delete_tx_data db r with
          | [] -> None
          | tx_ops ->
              (* cljs returns the transact report — callers/tests only need
                 truthy-vs-nil, so Bool true carries the same signal *)
              ignore
                (Db_tx.transact
                   ~tx_meta:
                     [ "outliner-op", Keyword "recycle-delete-permanently" ]
                   conn tx_ops);
              Some (Wire.Bool true))
      | None -> None)
  | _, [ tx_data; tx_meta ] ->
      let tx_data =
        expand_block_retracts_to_descendants db (tx_items_of tx_data)
      in
      (match tx_data with
       | [] -> None
       | _ ->
           ignore
             (Db_transact.transact conn tx_data
                (Ds_wire.tx_meta_of_transit tx_meta));
           None)
  | _ -> None

and expand_block_retracts_to_descendants (db : db) (tx_data : Wire.t list)
    : Wire.t list =
  let explicit_retracts =
    List.filter_map
      (fun item ->
         match item with
         | Wire.Array [ op; e ] | Wire.List [ op; e ]
           when op = kw "db/retractEntity" || op = kw "db.fn/retractEntity" -> (
             match entity_of_wire_ref db e with
             | Some ent -> Some ent.id
             | None -> None)
         | _ -> None)
      tx_data
  in
  (* cljs block-descendants: (sort-by :block/order (:block/_raw-parent b))
     — raw children incl. closed-value/created-from-property, order-sorted.
     visited guards parent cycles (a moved block can temporarily close a
     loop while an ancestor is selected). *)
  let visited = Hashtbl.create 16 in
  let rec descendants (block : entity) : entity list =
    Ldb.sort_by_order (Ldb.ref_ents block "block/_parent")
    |> List.concat_map (fun child ->
           if Hashtbl.mem visited child.id then []
           else begin
             Hashtbl.add visited child.id ();
             child :: descendants child
           end)
  in
  let descendants block =
    Hashtbl.add visited block.id ();
    descendants block
  in
  List.concat_map
    (fun item ->
       match item with
       | Wire.Array [ op; e ] | Wire.List [ op; e ]
         when op = kw "db/retractEntity" || op = kw "db.fn/retractEntity" -> (
           match entity_of_wire_ref db e with
           | Some root ->
               descendants root
               |> List.filter (fun ent ->
                      not (List.mem ent.id explicit_retracts))
               |> List.map (fun ent ->
                      let ref_v =
                        match
                          Datascript.entity_attr ent "block/uuid"
                        with
                        | Some (One_value (Uuid u)) ->
                            Wire.Array [ kw "block/uuid"; Wire.Uuid u ]
                        | _ -> Wire.Int ent.id
                      in
                      Wire.Array [ kw "db/retractEntity"; ref_v ])
               |> fun ds -> ds @ [ item ]
           | None -> [ item ])
       | _ -> [ item ])
    tx_data

(* ---- reverse / rebase ---- *)

let resolve_temp_id (db : db) (datom_v : Wire.t) : Wire.t =
  let replace v =
    match v with
    | Wire.String s when Sync_state.uuid_string s -> (
        let u = Datascript.Util.uuid_canonicalize s in
        match
          Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        with
        | Some e -> Wire.Int e.id
        | None -> v)
    | _ -> v
  in
  match datom_v with
  | Wire.Array (op :: e :: a :: v :: rest)
  | Wire.List (op :: e :: a :: v :: rest)
    when op = kw "db/add" || op = kw "db/retract" ->
      let e' = replace e in
      let v' =
        match a with
        | Wire.Keyword attr when ref_attr db attr -> replace v
        | _ -> v
      in
      Wire.Array (op :: e' :: a :: v' :: rest)
  | _ -> datom_v

let inline_history_action (tx_meta : tx_meta)
    : (value option * Wire.t list * Wire.t list) option =
  let get_opt names =
    List.find_map
      (fun n ->
         match List.assoc_opt n tx_meta with
         | Some (Vector xs) -> Some (List.map Ds_wire.transit_of_value xs)
         | Some (List xs) -> Some (List.map Ds_wire.transit_of_value xs)
         | _ -> None)
      names
  in
  match
    ( get_opt [ "db-sync/forward-outliner-ops"; "forward-outliner-ops" ]
    , get_opt [ "db-sync/inverse-outliner-ops"; "inverse-outliner-ops" ] )
  with
  | Some fwd, Some inv when fwd <> [] && inv <> [] ->
      Some (List.assoc_opt "outliner-op" tx_meta, fwd, inv)
  | _ -> None

(* apply-history-action! *)
let apply_history_action repo (tx_id : string) (undo : bool)
    (tx_meta : tx_meta) : Wire.t =
  match Worker_state.datascript_conn repo with
  | None ->
      Sync_util.fail_fast "db-sync/missing-db"
        (Wire.Map
           [ kw "repo", Wire.String repo
           ; kw "op", kw "apply-history-action" ])
  | Some conn -> (
      let action =
        match pending_tx_by_id repo tx_id with
        | Some entry ->
            Some
              ( (match entry.outliner_op with
                 | Some o -> Some (Keyword o)
                 | None -> None)
              , entry.forward_outliner_ops
              , entry.inverse_outliner_ops
              , entry.tx
              , entry.reversed_tx )
        | None -> (
            match inline_history_action tx_meta with
            | Some (op, fwd, inv) -> Some (op, fwd, inv, Wire.Array [], Wire.Array [])
            | None -> None)
      in
      match action with
      | None ->
          Wire.Map
            [ kw "applied?", Wire.Bool false
            ; kw "reason", kw "missing-history-action"
            ; kw "tx-id", Wire.String tx_id ]
      | Some (outliner_op, forward_ops, inverse_ops, tx, reversed_tx) ->
          let action_wire =
            Wire.Map
              [ ( kw "outliner-op"
                , match outliner_op with
                    | Some o -> Ds_wire.transit_of_value o
                    | None -> Nil )
              ; kw "forward-outliner-ops", Wire.Array forward_ops
              ; kw "inverse-outliner-ops", Wire.Array inverse_ops
              ; kw "tx", tx
              ; kw "reversed-tx", reversed_tx ]
          in
          if outliner_op = Some (Keyword "fix") then
            Wire.Map
              [ kw "applied?", Wire.Bool false
              ; kw "reason", kw "unsupported-history-action"
              ; kw "action", action_wire ]
          else
            let ops =
              (if undo then inverse_ops else forward_ops)
              |> List.filter (fun op_entry ->
                     match Outliner_op.op_of_entry op_entry with
                     | Some (op_name, _) ->
                         List.mem op_name
                           Outliner_op.semantic_outliner_op_names
                     | None -> false)
            in
            let tx_data_items =
              (if undo then reversed_tx else tx)
              |> normalize_tx_data_for_rebase
            in
            let ops' =
              match ops with
              | _ :: _ -> ops
              | [] ->
                  [ Wire.Array
                      [ kw "transact"
                      ; Wire.Array
                          [ Wire.Array tx_data_items; Wire.Nil ] ] ]
            in
            let provided_history_tx_id =
              match List.assoc_opt "db-sync/tx-id" tx_meta with
              | Some (Uuid s) when s <> tx_id -> Some s
              | _ -> None
            in
            let history_tx_id =
              Option.value provided_history_tx_id ~default:(Uuid_gen.uuid ())
            in
            let fwd = if undo then inverse_ops else forward_ops in
            let inv = if undo then forward_ops else inverse_ops in
            let tx_meta' : tx_meta =
              [ "outliner-op"
              , (match outliner_op with Some o -> o | None -> Nil)
              ; "local-tx?", Bool true
              ; "gen-undo-ops?", Bool false
              ; "persist-op?", Bool true
              ; "undo?", Bool undo
              ; ( "redo?"
                , match List.assoc_opt "redo?" tx_meta with
                  | Some (Bool b) -> Bool b
                  | _ -> Bool false )
              ; "db-sync/tx-id", Uuid history_tx_id
              ; ( "db-sync/source-tx-id"
                , match List.assoc_opt "db-sync/source-tx-id" tx_meta with
                  | Some (Uuid s) -> Uuid s
                  | _ -> Uuid tx_id )
              ; "db-sync/forward-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit fwd)
              ; "db-sync/inverse-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit inv) ]
            in
            (match ops' with
             | [] ->
                 Wire.Map
                   [ kw "applied?", Wire.Bool false
                   ; kw "reason", kw "unsupported-history-action"
                   ; kw "action", action_wire ]
             | _ -> (
                 try
                   if ops <> [] then
                     Sync_deps.require "assert_no_numeric_entity_ids"
                       Sync_deps.assert_no_numeric_entity_ids conn ops
                       "history-action-ops";
                   ignore
                     (batch_transact_with_temp_conn conn tx_meta' (fun c ->
                           List.iter
                             (fun op ->
                                ignore
                                  (replay_canonical_outliner_op c op None))
                             ops')
                        ());
                   Wire.Map
                     [ kw "applied?", Wire.Bool true
                     ; kw "history-tx-id", Wire.Uuid history_tx_id ]
                 with e ->
                   let reason = history_action_error_reason e in
                   if not (expected_history_action_error_reason reason) then
                     Worker_log.error "undo-redo-failed"
                       [ "repo", repo; "error", Printexc.to_string e ];
                   Wire.Map
                     [ kw "applied?", Wire.Bool false
                     ; kw "reason", reason
                     ; kw "action", action_wire ])))

let fix_tx (conn : conn) (tx_report : tx_report) (tx_meta : tx_meta) : unit =
  Db_sync_order.fix_duplicate_orders conn tx_report.tx_data tx_meta

let sync_fix_tx_meta () : tx_meta =
  [ "outliner-op", Keyword "fix"
  ; "gen-undo-ops?", Bool false
  ; "db-sync/tx-id", Uuid (Uuid_gen.uuid ()) ]

let pending_tx_ids (local_txs : Sync_client_op.local_tx_entry list) =
  List.map (fun (t : Sync_client_op.local_tx_entry) -> t.tx_id) local_txs

let tx_meta_get name (tx_meta : tx_meta) =
  List.assoc_opt name tx_meta

(* ---- transact-remote-txs! ---- *)

(* cljs with-redefs seams — tests count/wrap these helpers *)
let remote_txs_retract_entity_block_uuid_suffixes_fn =
  ref remote_txs_retract_entity_block_uuid_suffixes

let drop_stale_deleted_block_ref_ops_fn = ref drop_stale_deleted_block_ref_ops
let drop_missing_block_ref_ops_fn = ref drop_missing_block_ref_ops

(* Remote txs reference entities by [:block/uuid u] lookup-refs, which the
   transact layer resolves strictly — it never upserts a missing ref.
   When the uuid is absent from the server conn, rewrite the ref:
   - u created inside this tx (a remote "new entity"): every
     [:block/uuid u] ref becomes a shared tempid so the tempid path
     materializes the entity;
   - u only on the display conn (a pending-local entity the remote op now
     touches): the same tempid rewrite plus an injected
     [:db/add tempid "block/uuid" u] stub — the uuid merge lands the
     remote data on the entity the confirm later completes;
   - u nowhere: leave the lookup-ref so drop_missing_block_ref_ops drops
     the item. *)
let rewrite_missing_uuid_refs ?(display_db : db option) (db : db)
    (tx_data : Wire.t list) : Wire.t list =
  (* uuid -> the e-position tempid its block/uuid add uses in this tx;
     refs to a created uuid must reuse that tempid — a bare uuid string
     would register a *different* tempid appearing only as a value *)
  let created : (string, Wire.t) Hashtbl.t = Hashtbl.create 8 in
  List.iter
    (fun item ->
       match item with
       | Wire.Array (op :: e :: a :: v :: _)
       | Wire.List (op :: e :: a :: v :: _)
         when op = kw "db/add" && a = kw "block/uuid" -> (
           match uuid_str_of_wire v with
           | Some u ->
               let u = Datascript.Util.uuid_canonicalize u in
               if not (Hashtbl.mem created u) then
                 Hashtbl.replace created u e
           | None -> ())
       | _ -> ())
    tx_data;
  let on_srv u = Outliner_op.entity_of_uuid db u <> None in
  let on_display u =
    match display_db with
    | Some ddb -> Outliner_op.entity_of_uuid ddb u <> None
    | None -> false
  in
  let display_only = ref SSet.empty in
  let rewrite_pos w =
    let uuid_of_ref_pos w =
      match block_uuid_lookup_ref_value w with
      | Some s -> Some (Datascript.Util.uuid_canonicalize s)
      | None -> (
          match w with
          | Wire.String s when Sync_state.uuid_string s ->
              Some (Datascript.Util.uuid_canonicalize s)
          | Wire.Uuid s -> Some (Datascript.Util.uuid_canonicalize s)
          | _ -> None)
    in
    match uuid_of_ref_pos w with
    | Some u -> (
        if on_srv u then w
        else
          match Hashtbl.find_opt created u with
          | Some t -> t
          | None ->
              if on_display u then begin
                display_only := SSet.add u !display_only;
                Wire.String u
              end
              else w)
    | None -> w
  in
  let tx_data =
    List.map
      (fun item ->
         match item with
         | Wire.Array (op :: e :: a :: v :: rest)
         | Wire.List (op :: e :: a :: v :: rest)
           when op = kw "db/add" || op = kw "db/retract" ->
             let e' = rewrite_pos e in
             let v' =
               match a with
               | Wire.Keyword attr when ref_attr db attr -> rewrite_pos v
               | _ -> v
             in
             Wire.Array (op :: e' :: a :: v' :: rest)
         | _ -> item)
      tx_data
  in
  List.rev_append
    (SSet.fold
       (fun u acc ->
          Wire.Array
            [ kw "db/add"; Wire.String u; kw "block/uuid"; Wire.Uuid u ]
          :: acc)
       !display_only [])
    tx_data

let transact_remote_txs ?(display_db : db option) (conn : conn)
    (remote_txs : Wire.t list) () : (Wire.t list * tx_report option) list =
  let deleted_suffixes =
    !remote_txs_retract_entity_block_uuid_suffixes_fn remote_txs
  in
  let rec loop remaining suffixes results =
    match remaining with
    | [] -> List.rev results
    | remote_tx :: rest ->
        let db = Conn.db conn in
        let deleted_block_uuids =
          match suffixes with
          | s :: _ -> s
          | [] -> SSet.empty
        in
        let raw_tx_data =
          match Wire.get "tx-data" remote_tx with
          | Some xs -> tx_items_of xs
          | None -> []
        in
        let tx_data =
          raw_tx_data
          |> fun items ->
             List.map Ds_wire.value_of_transit items
             |> Db_sync_tx_sanitize.sanitize_tx db
             |> List.map Ds_wire.transit_of_value
          |> rewrite_missing_uuid_refs ?display_db db
          |> List.map (resolve_temp_id db)
          |> drop_stale_adds_after_remote_entity_delete
        in
        let tx_data =
          (* cljs (cond->> tx-data ... (tx-data-has-block-uuid-ref? tx-data)
             (drop-missing-block-ref-ops db)): the test sees the pre-drop
             tx-data, while drop runs on the post-drop value *)
          let has_uuid_ref = tx_data_has_block_uuid_ref tx_data in
          let d =
            if not (SSet.is_empty deleted_block_uuids) then
              !drop_stale_deleted_block_ref_ops_fn db deleted_block_uuids
                tx_data
            else tx_data
          in
          if has_uuid_ref then
            !drop_missing_block_ref_ops_fn ?display_db db d
          else d
        in
        let report =
          match tx_data with
          | [] -> None
          | _ ->
              Db_transact.transact conn tx_data (apply_tx_meta remote_tx)
        in
        let results' =
          match tx_data with
          | [] -> results
          | _ -> (tx_data, report) :: results
        in
        loop rest (match suffixes with _ :: s -> s | [] -> []) results'
  in
  loop remote_txs deleted_suffixes []

(* ---- pending replay / display rebuild ---- *)

(* Attrs whose db/ident creation is still queued — a property that only
   exists inside a pending entry is pending-created, not remotely
   deleted, so verbatim replay must keep items on it. *)
let pending_property_attrs (pending : Sync_client_op.local_tx_entry list)
    : SSet.t =
  List.fold_left
    (fun acc (e : Sync_client_op.local_tx_entry) ->
       List.fold_left
         (fun acc item ->
            match item with
            | Wire.Array l | Wire.List l
              when List.length l >= 4
                   && List.nth l 0 = kw "db/add"
                   && List.nth l 2 = kw "db/ident" -> (
                match List.nth l 3 with
                | Wire.Keyword a | Wire.String a
                  when Db_property.property a -> SSet.add a acc
                | _ -> acc)
            | _ -> acc)
         acc (tx_items_of e.tx))
    SSet.empty pending

let replay_pending_entry (repo : string) (conn : conn)
    (rebase_db_before : db option) ~(pending_attrs : SSet.t)
    (local_tx : Sync_client_op.local_tx_entry) : unit =
  let db = Conn.db conn in
  (* idempotent replay: a queued op may re-run against a newer base (e.g.
     its own ack echo rebuilt the display while the entry was still
     pending). When every block/uuid the tx creates already exists, the
     op's effects are already materialized — replaying it again would
     fail resolving targets that no longer exist even on db_before. *)
  let created_uuids =
    List.filter_map
      (fun item ->
         match item with
         | Wire.Array l | Wire.List l
           when List.length l >= 4
                && List.nth l 0 = kw "db/add"
                && List.nth l 2 = kw "block/uuid" -> (
             match List.nth l 3 with
             | Wire.Uuid u -> Some u
             | _ -> None)
         | _ -> None)
      (tx_items_of local_tx.tx)
  in
  let already_materialized =
    created_uuids <> []
    && List.for_all
         (fun u ->
            match Outliner_op.entity_of_uuid db u with
            | Some e ->
                (* a uuid-only entity is the stub injected by
                   rewrite_missing_uuid_refs — the entry's own
                   effects (title, parent, ...) are NOT materialized
                   and the entry must replay *)
                List.length (Datascript.entity_attrs e) > 1
            | None -> false)
         created_uuids
  in
  if already_materialized then ()
  else
    match local_tx.forward_outliner_ops with
    | _ :: _ as forward_ops ->
        let db_before_apply = Conn.db conn in
        let ops =
          Outliner_op_construct.canonicalize_insert_ops (Conn.db conn)
            (Wire.as_seq local_tx.tx) forward_ops
        in
        (* capture the datoms this entry's ops produce: on success the
           resolved, canonical tx replaces the stored op so subsequent
           rebuilds/upload/confirm replay the same concrete tx data. *)
        let reports = ref [] in
        let lid =
          Datascript.listen conn "pending-resolve-collect"
            (fun r -> reports := r :: !reports)
        in
        (try
           List.iter
             (fun op ->
                ignore
                  (replay_canonical_outliner_op conn op rebase_db_before))
             ops
         with e ->
           Datascript.unlisten conn lid;
           raise e);
        Datascript.unlisten conn lid;
        let datoms =
          List.concat_map
            (fun (r : tx_report) -> r.tx_data)
            (List.rev !reports)
        in
        if datoms <> [] then
          let resolved =
            normalize_tx_data (Conn.db conn) db_before_apply datoms
          in
          Sync_client_op.update_local_tx_resolved repo local_tx.tx_id
            (Wire.Array resolved)
    | [] -> (
        match normalize_tx_data_for_rebase local_tx.tx with
        | _ :: _ as tx_data ->
            let attr_live (a : Wire.t) : bool =
              attr_resolves db a
              || (match a with
                  | Wire.Keyword a' | Wire.String a' ->
                      SSet.mem a' pending_attrs
                  | _ -> false)
              || (match rebase_db_before with
                  | Some b -> not (attr_resolves b a)
                  | None -> true)
            in
            let tx_data =
              sanitize_pending_tx_refs ~attr_live db tx_data
            in
            let tx_data = List.map (resolve_temp_id db) tx_data in
            ignore
              (Db_transact.transact conn tx_data
                 [ ( "outliner-op"
                   , match local_tx.outliner_op with
                     | Some o -> Keyword o
                     | None -> Nil ) ])
        | [] -> ())

(* Replays the pending queue in order. A replay failure marks the entry
   failed — the server stays authoritative and the op leaves the
   projection. Returns how many entries failed: ops committed before a
   failing op within the same entry stay applied on conn, so callers
   that can rebind should do a second pass to drop the residue. *)
let replay_pending_txs repo (conn : conn)
    (rebase_db_before : db option) : int =
  let pending = pending_txs repo () in
  if pending = [] then 0
  else begin
    let failed = ref 0 in
    Sync_state.pending_replay := true;
    let pending_attrs = pending_property_attrs pending in
    (try
       List.iter
         (fun (local_tx : Sync_client_op.local_tx_entry) ->
            try
              replay_pending_entry repo conn rebase_db_before
                ~pending_attrs local_tx
            with e ->
              incr failed;
              Worker_log.warn "db-sync/pending-replay-failed"
                [ "repo", repo
                ; "tx-id", local_tx.tx_id
                ; "outliner-op"
                , Option.value local_tx.outliner_op ~default:""
                ; "error", Printexc.to_string e ];
              ignore (mark_failed_txs repo [ local_tx.tx_id ]))
         pending
     with e ->
       Sync_state.pending_replay := false;
       raise e);
    Sync_state.pending_replay := false;
    !failed
  end

(* Display conns share the server conn's storage for lazy index reads but
   can never persist: the wrapper no-ops the store entry points, so
   pending data only ever lives in memory. *)
let display_storage (db : db) : storage option =
  Option.map
    (fun (s : storage) ->
       (* reads stay live — shared index pages are the point — but the
          projection may never write or delete durable rows *)
       { s with storage_store = (fun _ -> ())
              ; storage_delete = (fun _ -> ()) })
    db.storage_ref

let display_conn_from_server (server_db : db) : conn =
  Datascript.conn_from_db
    { server_db with storage_ref = display_storage server_db }

let display_db_from_server (server_db : db) : db =
  { server_db with storage_ref = display_storage server_db }

(* Rebinds the display projection onto the server conn's confirmed state
   and replays pending ops forward. jump_tx_data carries the datoms the
   server conn just committed (remote apply / confirm batch) so the UI
   gets one delta for the jump; replayed ops emit their own deltas. *)
let rebuild_display repo ~(jump_tx_data : datom list) : unit =
  match
    (Sync_state.server_conn repo, Worker_state.datascript_conn repo)
  with
  | Some server_conn, Some display_conn ->
      let db_before = Conn.db display_conn in
      Conn.update_db display_conn (fun _ ->
          display_db_from_server (Conn.db server_conn));
      let replay_reports = ref [] in
      let lid =
        Datascript.listen display_conn "pending-replay-collect"
          (fun r -> replay_reports := r :: !replay_reports)
      in
      (try
         let failed =
           replay_pending_txs repo display_conn (Some db_before)
         in
         if failed > 0 then begin
           (* ops committed before a failing op stay applied — rebind to
              the server base once more and replay the surviving queue
              (failed entries are out of pending now) so no residue
              leaks into the projection *)
           Conn.update_db display_conn (fun _ ->
               display_db_from_server (Conn.db server_conn));
           replay_reports := [];
           ignore (replay_pending_txs repo display_conn (Some db_before))
         end
       with e ->
         Datascript.unlisten display_conn lid;
         raise e);
      Datascript.unlisten display_conn lid;
      let replayed =
        List.concat_map
          (fun (r : tx_report) -> r.tx_data)
          (List.rev !replay_reports)
      in
      let tx_data = jump_tx_data @ replayed in
      if tx_data <> [] then begin
        let report =
          { db_before
          ; db_after = Conn.db display_conn
          ; tx_data
          ; tempids = []
          ; tx_meta = [ "rtc-tx?", Bool true ] }
        in
        Db_listener.commit_synthesized_report repo display_conn report;
        fix_tx display_conn report (sync_fix_tx_meta ())
      end
  | _ -> ()

let () =
  rebuild_display_fn :=
    (fun repo -> rebuild_display repo ~jump_tx_data:[])

(* Marks queued txs confirmed: the exact normalized tx data that was
   uploaded is applied to the server conn in queue order, so the
   projection base converges with what the server accepted. *)
let confirm_pending_txs repo (tx_ids : string list) : unit =
  match Sync_state.server_conn repo with
  | None -> ()
  | Some server_conn -> (
      let entries =
        Sync_client_op.get_pending_local_txs_in repo tx_ids
      in

      (* apply each confirmed entry in queue order, sanitized the same
         way the upload was — refs to uuids the remote side deleted are
         dropped in value position so the server conn mirrors what the
         server actually accepted. An entity-position miss means the
         upload never happened (marked failed earlier), so keep the tx
         verbatim and let transact surface it. *)
      List.iter
        (fun (local_tx : Sync_client_op.local_tx_entry) ->
           try
             match normalize_tx_data_for_rebase local_tx.tx with
             | [] -> ()
             | tx_data ->
                 let db = Conn.db server_conn in
                 (* sanitize with the upload domain: uuids the server
                    conn can see, and attrs live on either conn — the
                    server conn must only ever gain what the upload
                    could actually have carried *)
                 let uuid_exists u =
                   Outliner_op.entity_of_uuid (Conn.db server_conn) u
                   <> None
                 in
                 let attr_live (a : Wire.t) : bool =
                   attr_resolves db a
                   || (match Worker_state.datascript_conn repo with
                       | Some display -> attr_resolves (Conn.db display) a
                       | None -> true)
                 in
                 let tx_data =
                   (try
                      sanitize_pending_tx_refs ~uuid_exists ~attr_live db
                        tx_data
                    with _ -> tx_data)
                   |> List.map (resolve_temp_id db)
                   |> fun items ->
                      List.map Ds_wire.value_of_transit items
                      |> Db_sync_tx_sanitize.sanitize_tx db
                      |> List.map Ds_wire.transit_of_value
                 in
                 if tx_data <> [] then
                   ignore
                     (Db_transact.transact server_conn tx_data
                        [ "rtc-tx?", Bool true ])
           with e ->
             (* an exception anywhere in one entry's confirm pipeline
                must not abort the loop — client.inflight stays set and
                uploads stall, or a rejected tx re-uploads forever *)
             ignore (mark_failed_txs repo [ local_tx.tx_id ]);
             Worker_log.warn "db-sync/confirm-tx-failed"
               [ "repo", repo
               ; "tx-id", local_tx.tx_id
               ; "error", Printexc.to_string e ])
        entries)

(* Remote graphs keep two conns: the storage-backed conn registered at
   open becomes the server conn holding only confirmed state (restored
   snapshot + remote txs + acked local txs); datascript_conn becomes a
   storage-less display projection replaying the pending queue forward.
   The commit listener moves to the display conn — server-conn transacts
   drive checksum and the synthesized jump report explicitly. *)
let split_off_server_if_remote repo : unit =
  match Worker_state.datascript_conn repo with
  | None -> ()
  | Some conn ->
      let db = Conn.db conn in
      (* server_conn absent means this conn was never split — the display
         projection only exists once a server conn is registered *)
      if Sync_state.server_conn repo = None
         && Ldb.get_key_value db "logseq.kv/graph-remote?"
            = Some (Bool true)
      then begin
        (* the pipeline-updates listener maintains new-db-graph-refs on
           the UI-visible conn (CLI path attaches it at init) — move it
           onto the display conn so local ops keep feeding it; the
           server conn must not take its writes *)
        let had_pipeline = Outliner_db_pipeline.has_listener conn in
        Datascript.unlisten conn "listen-db-changes!";
        Datascript.unlisten conn "pipeline-updates";
        Sync_state.set_server_conn repo conn;
        Db_listener.listen_db_checksum repo conn;
        let display = display_conn_from_server db in
        Worker_state.set_datascript_conn repo display;
        Db_listener.listen_db_changes repo display;
        if had_pipeline then Outliner_db_pipeline.add_listener display;
        (* the pre-split conn db is the best available db_before: at a
           mid-session split (or a pre-upgrade graph whose pending datoms
           were persisted) it still resolves remotely-deleted targets so
           ancestor fallback can run; on a fresh restart under the new
           model it simply lacks them and those ops mark failed *)
        let failed = replay_pending_txs repo display (Some db) in
        if failed > 0 then begin
          Conn.update_db display (fun _ ->
              display_db_from_server (Conn.db conn));
          ignore (replay_pending_txs repo display None)
        end
      end

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


let clear_pending_txs repo : int =
  let ids = Sync_client_op.get_pending_local_tx_ids repo in
  (* snapshot upload already carried these to the server — confirm them
     into the server conn before un-pending *)
  confirm_pending_txs repo ids;
  mark_pending_txs_false repo ids


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
          rebuild_display repo ~jump_tx_data:[]
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

(* ---- conflicts ---- *)

let sync_conflict_attrs = [ "block/title" ]

let tx_item_components (item : Wire.t) :
    (string * Wire.t * string * Wire.t) option =
  match item with
  | Wire.Array l | Wire.List l when List.length l >= 4 -> (
      match (List.nth l 0, List.nth l 2) with
      | Wire.Keyword op, Wire.Keyword a
        when (op = "db/add" || op = "db/retract")
             && List.mem a sync_conflict_attrs ->
          Some (op, List.nth l 1, a, List.nth l 3)
      | _ -> None)
  | _ -> None

let tx_entity_uuid (db : db) (temp_id_uuid : (string, string) Hashtbl.t)
    (e : Wire.t) : string option =
  match e with
  | Wire.Uuid s -> Some s
  | Wire.String s when Sync_state.uuid_string s -> Some s
  | Wire.Array [ a; u ] | Wire.List [ a; u ] when a = kw "block/uuid" ->
      uuid_str_of_wire u
  | Wire.Int _ -> (
      match Hashtbl.find_opt temp_id_uuid (Transit_codec.to_string e) with
      | Some u -> Some u
      | None -> tx_item_block_uuid db e)
  | _ -> tx_item_block_uuid db e

let local_conflict_block_uuids (db : db)
    (local_txs : Sync_client_op.local_tx_entry list) : SSet.t =
  List.fold_left
    (fun acc (t : Sync_client_op.local_tx_entry) ->
       tx_items_of t.tx
       |> List.fold_left
            (fun acc2 item ->
               match tx_item_components item with
               | Some (_, e, _, _) -> (
                   match tx_entity_uuid db (Hashtbl.create 0) e with
                   | Some u -> SSet.add u acc2
                   | None -> acc2)
               | None -> acc2)
            acc)
    SSet.empty local_txs

let remote_sync_conflicts (db : db)
    (local_txs : Sync_client_op.local_tx_entry list) (remote_txs : Wire.t list)
    : (string * string * string * int) list =
  let local_uuids = local_conflict_block_uuids db local_txs in
  if SSet.is_empty local_uuids then []
  else
    remote_txs
    |> List.concat_map (fun remote_tx ->
           let t =
             match Wire.get "t" remote_tx with
             | Some (Wire.Int n) -> n
             | Some (Wire.Int64 n) -> Int64.to_int n
             | _ -> 0
           in
           let tx_data =
             match Wire.get "tx-data" remote_tx with
             | Some xs -> tx_items_of xs
             | None -> []
           in
           let temp_id_uuid = tx_temp_id_uuid tx_data in
           List.filter_map
             (fun item ->
                match tx_item_components item with
                | Some (op, e, a, v) when op = "db/add" -> (
                    match v with
                    | Wire.String _ -> (
                        match tx_entity_uuid db temp_id_uuid e with
                        | Some block_uuid
                          when SSet.mem block_uuid local_uuids -> (
                            let current =
                              match
                                Datascript.entity db
                                  (Lookup_ref ("block/uuid", Uuid block_uuid))
                              with
                              | Some ent -> (
                                  match Datascript.entity_attr ent a with
                                  | Some (One_value value) ->
                                      Ds_wire.transit_of_value value
                                  | _ -> Wire.Nil)
                              | None -> Wire.Nil
                            in
                            if current <> v then
                              Some (block_uuid, a,
                                    (match v with Wire.String s -> s | _ -> ""),
                                    t)
                            else None)
                        | _ -> None)
                    | _ -> None)
                | _ -> None)
             tx_data)
    (* cljs distinct — first-occurrence order *)
    |> Sync_state.distinct_by Fun.id

let broadcast_sync_conflicts repo conflicts : unit =
  (* cljs (distinct (map :block-uuid conflicts)) — first-occurrence order *)
  let uuids =
    List.map (fun (u, _, _, _) -> u) conflicts
    |> Sync_state.distinct_by Fun.id
  in
  List.iter
    (fun block_uuid ->
       let cs = Sync_client_op.get_sync_conflicts repo block_uuid in
       Broadcast.to_clients ~kind:"sync-conflicts-updated"
         ~transit_payload:
           (Transit_codec.to_string
              (Wire.Array
                 [ kw "sync-conflicts-updated"
                 ; Wire.Map
                     [ kw "repo", Wire.String repo
                     ; kw "block-uuid", Wire.String block_uuid
                     ; ( kw "conflicts"
                   , Wire.Array
                       (List.map
                          (fun (c : Sync_client_op.sync_conflict) ->
                             Wire.Map
                               [ kw "id", Wire.Int c.id
                               ; kw "block-uuid", Wire.String c.block_uuid
                               ; kw "attr", Wire.String c.attr
                               ; kw "value", Wire.String c.value
                               ; ( kw "remote-t"
                                 , match c.remote_t with
                                   | Some t -> Wire.Int t
                                   | None -> Wire.Nil )
                               ; kw "created-at", Ds_wire.wire_int64 (Time.epoch_ms_to_int64 c.created_at) ])
                          cs)) ]] )))
    uuids

(* ---- apply-remote-txs! ---- *)


let report_apply_remote_txs_error (_error : exn) has_local_changes remote_count
    local_count : unit =
  try
    match !Sync_deps.capture_error with
    | Some fn ->
        fn "Sync apply remote txs failed"
          (Wire.Map
             [ kw "source", Wire.String "db-sync"
             ; kw "operation", Wire.String "apply-remote-txs"
             ; kw "has-local-changes", Wire.Bool has_local_changes
             ; kw "remote-tx-count", Wire.Int remote_count
             ; kw "local-tx-count", Wire.Int local_count ])
          Wire.Nil
    | None -> ()
  with e ->
    Worker_log.error "db-sync/report-apply-remote-txs-error-failed"
      [ "error", Printexc.to_string e ]

let eager_remote_asset_download_owner () : bool =
  Sync_util.cli_node_owner () || Runtime_env.electron_owner ()

let download_missing_remote_assets_for_owner repo
    (client : Sync_state.client) (remote_tx_data : datom list)
    : unit Db_worker_effect.t =
  match client.graph_id with
  | Some graph_id when eager_remote_asset_download_owner () -> (
      match Worker_state.datascript_conn repo with
      | Some conn ->
          let candidates =
            Sync_assets.remote_asset_download_candidates_in_tx
              (Conn.db conn) remote_tx_data
          in
          (match candidates with
           | [] -> Db_worker_effect.pure ()
           | _ ->
               Db_worker_effect.map
                 (fun _ -> ())
                 (Sync_assets.download_remote_assets_if_missing repo graph_id
                    candidates))
      | None -> Db_worker_effect.pure ())
  | _ -> Db_worker_effect.pure ()

let finish_apply_remote_txs repo (client : Sync_state.client)
    (remote_tx_data : Wire.t list) (remote_asset_tx_data : datom list)
    : unit Db_worker_effect.t =
  client.inflight := [];
  Db_worker_effect.catch
    (rehydrate_large_titles repo ~tx_data:(Some remote_tx_data)
       ~graph_id:client.graph_id)
    (fun error ->
       Worker_log.error "db-sync/large-title-rehydrate-failed"
         [ "repo", repo; "error", Printexc.to_string error ];
       Db_worker_effect.pure ())
  >>= fun () ->
  download_missing_remote_assets_for_owner repo client remote_asset_tx_data

(* Remote txs land on the server conn only; the display projection is
   then rebuilt from confirmed state with the pending queue replayed
   forward. No reverse step — nothing local ever enters the base. *)
let apply_remote_txs_once repo (_client : Sync_state.client)
    (remote_txs : Wire.t list)
    : (Wire.t list * tx_report option) list =
  match Worker_state.datascript_conn repo with
  | None ->
      Sync_util.fail_fast "db-sync/missing-db"
        (Wire.Map
           [ kw "repo", Wire.String repo
           ; kw "op", kw "apply-remote-txs" ])
  | Some display_conn -> (
      let conn =
        Option.value (Sync_state.server_conn repo) ~default:display_conn
      in
      let local_txs = pending_txs repo () in
      let db_migrate = remote_txs_db_migrate remote_txs in
      let tx_meta =
        [ "rtc-tx?", Bool true ]
        @ (if local_txs <> []
           then [ "with-local-changes?", Bool true ]
           else [ "without-local-changes?", Bool true ])
        @ (if db_migrate then
             [ "db-migrate?", Bool true
             ; "outliner-op", Keyword "db-migrate"
             ; "skip-validate-db?", Bool true ]
           else [])
      in
      let remote_tx_results = ref [] in
      try
        let conflicts =
          remote_sync_conflicts (Conn.db display_conn) local_txs remote_txs
        in
        if conflicts <> [] then begin
          Sync_client_op.add_sync_conflicts repo conflicts;
          broadcast_sync_conflicts repo conflicts
        end;

        let tx_report =
          batch_transact_with_temp_conn conn tx_meta
            (fun c ->
               remote_tx_results :=
                 transact_remote_txs
                   ~display_db:(Conn.db display_conn) c remote_txs ())
            ()
        in
        rebuild_display repo
          ~jump_tx_data:
            (match tx_report with
             | Some r -> r.tx_data
             | None -> []);
        !remote_tx_results
      with e ->
        Worker_log.error "db-sync/apply-remote-txs-inner-error"
          [ "repo", repo; "error", Printexc.to_string e ];
        (match !Sync_deps.clear_history with
         | Some f -> f repo
         | None -> ());
        raise e)


let apply_remote_txs repo (client : Sync_state.client)
    (remote_txs : Wire.t list) : unit Db_worker_effect.t =
  let remote_tx_data =
    List.concat_map
      (fun tx ->
         tx_items_of
           (Option.value (Wire.get "tx-data" tx) ~default:(Wire.Array [])))
      remote_txs
  in
  (* bind (pure ()) defers the synchronous apply body into the task so a
     raise becomes a Rejected task the catch can report — a plain
     argument would be evaluated eagerly and escape before catch is
     installed *)
  Db_worker_effect.catch
    (Db_worker_effect.bind (Db_worker_effect.pure ()) (fun () ->
         Db_worker_effect.pure
           (apply_remote_txs_once repo client remote_txs)))
    (fun error ->
       let local_txs = pending_txs repo () in
       Worker_log.error "db-sync/apply-remote-txs-failed"
         [ "repo", repo
         ; "has-local-changes?", string_of_bool (local_txs <> [])
         ; "remote-tx-count", string_of_int (List.length remote_txs)
         ; "local-tx-count", string_of_int (List.length local_txs)
         ; "error", Printexc.to_string error ];
       report_apply_remote_txs_error error (local_txs <> [])
         (List.length remote_txs) (List.length local_txs);
       Db_worker_effect.error error)
  >>= fun remote_tx_results ->
  let remote_asset_tx_data =
    List.concat_map
      (fun (_, report) ->
         match report with Some r -> r.tx_data | None -> [])
      remote_tx_results
  in
  finish_apply_remote_txs repo client remote_tx_data remote_asset_tx_data

let apply_remote_tx repo client (tx_data : Wire.t list) =
  apply_remote_txs repo client
    [ Wire.Map [ (kw "tx-data", Wire.Array tx_data) ] ]

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
