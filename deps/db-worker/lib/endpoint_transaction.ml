(* frontend.worker.handler.transaction — transaction + outliner ops
   endpoints. Source: src/main/frontend/worker/handler/transaction.cljs *)

open Datascript

let kw s = Wire.Keyword s

let wire_truthy = function
  | Wire.Nil | Wire.Bool false -> false
  | _ -> true

let require_repo (args : Wire.t list) : string =
  match args with
  | Wire.String repo :: _ -> repo
  | Wire.Nil :: _ | [] -> ""
  | _ -> invalid_arg "transact/apply-outliner-ops: missing repo arg"

let missing_connection repo =
  Dispatcher.Exn_info
    ( "Missing worker graph connection",
      [ (kw "type", kw "db/missing-connection"); (kw "repo", Wire.String repo) ] )

let require_conn repo : conn =
  match Worker_state.datascript_conn repo with
  | Some c -> c
  | None -> raise (missing_connection repo)

(* maybe-run-recycle-gc! *)
let recycle_gc_kv = "logseq.kv/recycle-last-gc-at"

let maybe_run_recycle_gc (conn : conn) : unit =
  let now = Time.now () in
  let last_gc_at =
    match entity (Conn.db conn) (Ident recycle_gc_kv) with
    | Some e -> (
        match Ldb.value e "kv/value" with
        | Some (Int64 n) -> Some (Time.epoch_ms n)
        | Some (Float f) -> Some (Time.epoch_ms_of_float f)
        | _ -> None)
    | None -> None
  in
  (match last_gc_at with
   | Some l
     when Time.epoch_ms_to_float now -. Time.epoch_ms_to_float l
          <= Outliner_recycle.gc_interval_ms -> ()
   | _ ->
       ignore (Outliner_recycle.gc conn ~now_ms:now ());
       ignore
         (Db_tx.transact conn
            [ Entity
                { db_id = None
                ; attrs =
                    [ ("db/ident", One_value (Keyword recycle_gc_kv))
                    ; ("kv/value", One_value (Float (Time.epoch_ms_to_float now))) ] } ]
            ~tx_meta:
              [ ("persist-op?", Bool false); ("skip-validate-db?", Bool true) ] ))

(* :thread-api/transact [repo tx-data tx-meta context] *)
let transact args : Wire.t Db_worker_effect.t =
  let repo = require_repo args in
  let conn = require_conn repo in
  Worker_state.set_db_latest_tx_time repo;
  let tx_data =
    match List.nth_opt args 1 with
    | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
    | _ -> []
  in
  let tx_meta_w =
    match List.nth_opt args 2 with
    | Some (Wire.Map _ as m) -> m
    | _ -> Wire.Map []
  in
  let context = List.nth_opt args 3 in
  (* cljs (contains? #{:insert-blocks} (:outliner-op tx-meta)) — keyword
     equality only; a wire string never matches. *)
  let insert_blocks_op =
    match Cljs_map.get tx_meta_w "outliner-op" with
    | Some (Wire.Keyword "insert-blocks") -> true
    | _ -> false
  in
  let tx_data' =
    if insert_blocks_op then
      List.map
        (fun tx ->
          match tx with
          (* cljs (and (map? tx) (nil? (:block/order tx))) — an explicit
             nil still gets a fresh order. *)
          | Wire.Map _
            when (match Cljs_map.get tx "block/order" with
                  | Some Wire.Nil | None -> true
                  | Some _ -> false) ->
              Cljs_map.assoc tx "block/order"
                (Wire.String (Db_order.gen_key None None))
          | t -> t)
        tx_data
    else tx_data
  in
  (try
     (match context with
      | Some w when w <> Wire.Nil ->
          Worker_state.set_context w;
          (* cljs e2e builds compile OUTLINER-PERF-LOGGING in; the runtime
             signal for the same e2e/dev app build here is the :dev? flag
             in the transact context (DEV-RELEASE). *)
          (match Cljs_map.get w "dev?" with
           | Some (Wire.Bool true) -> Sync_state.outliner_perf_logging := true
           | _ -> ())
      | _ -> ());
     let tx_meta' = Cljs_map.dissoc tx_meta_w "insert-blocks?" in
     (* cljs (and (:create-today-journal? m) (:today-journal-name m)
        (seq tx-data') (ldb/get-page db name)) — all truthy, not typed. *)
     let journal_name =
       match Cljs_map.get tx_meta' "today-journal-name" with
       | Some w when wire_truthy w -> Some w
       | _ -> None
     in
     let skip =
       (match Cljs_map.get tx_meta' "create-today-journal?" with
        | Some w -> wire_truthy w
        | None -> false)
       && journal_name <> None
       && tx_data' <> []
       && (match journal_name with
           | Some w ->
               Option.is_some
                 (Ldb.get_page (Conn.db conn) (Ds_wire.value_of_transit w))
           | None -> false)
     in
     if not skip then
       ignore
         (Db_transact.transact conn tx_data'
            (Ds_wire.tx_meta_of_transit tx_meta'));
     maybe_run_recycle_gc conn;
     Db_worker_effect.pure Wire.Nil
   with e ->
     (* cljs (log/error ::worker-transact-failed {...}) then rethrow *)
     Worker_log.error "worker-transact-failed"
       [ ("tx-meta", Ds_wire.edn_of_transit tx_meta_w)
       ; ("tx-count", string_of_int (List.length tx_data))
       ; ("error", Printexc.to_string e) ];
     raise e)

let () = Dispatcher.register "thread-api/transact" transact

(* shared-service broadcast :notification [message type clear? uid
   timeout {:i18n-key :i18n-args}] *)
let broadcast_notification (payload : Wire.t) =
  let get k = Option.value (Cljs_map.get payload k) ~default:Wire.Nil in
  let i18n =
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword ("i18n-key" | "i18n-args") | Wire.String ("i18n-key" | "i18n-args") ->
            Some (k, v)
        | _ -> None)
      (match payload with Wire.Map kvs -> kvs | _ -> [])
  in
  let msg =
    Wire.Array
      [ kw "notification"
      ; Wire.Array
          [ get "message"; get "type"; get "clear?"; get "uid"; get "timeout"
          ; Wire.Map i18n ] ]
  in
  Broadcast.to_clients ~kind:"notification"
    ~transit_payload:(Transit_codec.to_string msg)

(* ex-data {:type :notification, :payload {...}} extraction *)
let notification_data (exn : exn) : Wire.t option =
  let extract (data : (Wire.t * Wire.t) list) =
    let get k =
      match
        List.find_opt
          (fun (k', _) ->
            match k' with
            | Wire.Keyword s | Wire.String s -> s = k
            | _ -> false)
          data
      with
      | Some (_, v) -> Some v
      | None -> None
    in
    match get "type" with
    | Some (Wire.Keyword "notification") -> get "payload"
    | _ -> None
  in
  match exn with
  | Dispatcher.Exn_info (_, data) -> extract data
  | Outliner_validate.Notification w -> (
      match w with
      | Wire.Map kvs -> extract kvs
      | _ -> Some w)
  | _ -> None

(* cljs perf-time-ms *)
let perf_time_ms () = Time.monotonic_now ()

(* :thread-api/apply-outliner-ops [repo ops opts] *)
let apply_outliner_ops args : Wire.t Db_worker_effect.t =
  let repo = require_repo args in
  let conn = require_conn repo in
  let ops =
    match List.nth_opt args 1 with
    | Some w -> w
    | None -> Wire.Array []
  in
  let op_list =
    match ops with Wire.Array xs | Wire.List xs -> xs | _ -> []
  in
  (* cljs (mapv first ops) *)
  let op_names =
    Wire.Array
      (List.map
         (fun e ->
           match e with
           | Wire.Array (x :: _) | Wire.List (x :: _) -> x
           | _ -> Wire.Nil)
         op_list)
  in
  let opts =
    match List.nth_opt args 2 with
    | Some (Wire.Map _ as m) -> m
    | _ -> Wire.Map []
  in
  (try
     (* must run before apply-ops! so undo records pre-op editor state *)
     Undo_redo.set_pending_editor_info repo
       (Cljs_map.get opts "pending-editor-info");
     let started_at = perf_time_ms () in
     (* cljs perf-id is (random-uuid) — arrives as a uuid, not a string *)
     let perf_id_w =
       match Cljs_map.get opts "ui/perf-id" with
       | Some (Wire.String _ as s) -> Some s
       | Some (Wire.Uuid _ as u) -> Some u
       | _ -> None
     in
     let perf_id =
       match perf_id_w with
       | Some (Wire.String s) | Some (Wire.Uuid s) -> Some s
       | _ -> None
     in
     let editor_row_uuids =
       match Cljs_map.get opts "editor-row-uuids" with
       | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
       | _ -> []
     in
     let operation_opts =
       Cljs_map.dissoc_list opts
         [ "affected-block-uuids"; "editor-row-uuids"; "pending-editor-info"
         ; "return-updated-blocks?" ]
     in
     let apply_started_at = perf_time_ms () in
     let operation_result = Outliner_op.apply_ops conn ops operation_opts in
     let applied_at = perf_time_ms () in
     let delta = Db_listener.take_outliner_op_delta perf_id in
     let listener_perf = Db_listener.take_outliner_op_perf perf_id in
     let listener_at = perf_time_ms () in
     let editor_rows =
       if editor_row_uuids = [] then Wire.Nil
       else
         match !Sync_deps.canonical_blocks_fn with
         | Some f -> (
             match f (Conn.db conn) editor_row_uuids with
             | Wire.Map kvs -> (
                 (* {:blocks {uuid row}} -> rows for the requested uuids *)
                 match
                   List.find_opt
                     (fun (k, _) -> k = kw "blocks")
                     kvs
                 with
                 | Some (_, Wire.Map rows) ->
                     let rows' =
                       List.filter
                         (fun (k, _) ->
                           List.exists (fun u -> k = u) editor_row_uuids)
                         rows
                     in
                     Wire.Map rows'
                 | _ -> Wire.Map [])
             | w -> w)
         | None -> Wire.Map []
     in
     let response =
       [ (kw "result", operation_result) ]
       |> (fun m ->
          match delta with
          | Some d -> m @ [ (kw "delta", d) ]
          | None -> m)
       |> fun m ->
       if editor_row_uuids <> [] then
         m
         @ [ (kw "editor-row-uuids", Wire.Array editor_row_uuids)
           ; (kw "editor-rows", editor_rows) ]
       else m
     in
     let plain_at = perf_time_ms () in
     (* cljs perf-data + log-outliner-op-perf! — the console line the
        e2e suite counts per outliner op. *)
     let perf_data =
       [ ( "apply-ms"
         , Wire.Float (Time.diff_monotonic_ms apply_started_at applied_at) )
       ; ( "listener-ms"
         , Wire.Float (Time.diff_monotonic_ms applied_at listener_at) )
       ; ( "plain-ms"
         , Wire.Float (Time.diff_monotonic_ms listener_at plain_at) )
       ; ( "total-ms"
         , Wire.Float (Time.diff_monotonic_ms started_at plain_at) )
       ; ("listener", Wire.Array listener_perf) ]
     in
     Db_listener.log_tx_outliner_op_perf
       (Wire.Map
          ((List.filter (fun (k, _) -> k <> "listener") perf_data
            |> List.map (fun (k, v) -> (kw k, v)))
           @ [ kw "perf-id"
             , (match perf_id_w with Some w -> w | None -> Wire.Nil)
             ; kw "op-names", op_names
             ; kw "op-count", Wire.Int (List.length op_list) ]));
     let response =
       if !Sync_state.dev_or_test then
         response @ [ (kw "perf", Wire.Map (List.map (fun (k, v) -> (kw k, v)) perf_data)) ]
       else response
     in
     Db_worker_effect.pure (Wire.Map response)
   with e ->
     (match notification_data e with
      | Some payload ->
          broadcast_notification payload;
          raise e
      | None -> raise e))

let () = Dispatcher.register "thread-api/apply-outliner-ops" apply_outliner_ops
