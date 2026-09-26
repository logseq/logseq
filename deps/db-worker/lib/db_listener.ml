(* frontend.worker.db-listener — post-commit listener dispatch.

   cljs runs, per committed tx: db-sync checksum, db-sync
   persist-local-tx, the sync-db-to-main-thread pipeline
   (invoke-hooks -> render-delta -> broadcast), then deferred
   listeners (markdown-mirror, search). *)

open Datascript

type handler = string -> tx_report -> unit

(* deferred handlers keyed by cljs listen-key name ("markdown-mirror",
   "search", ...); :db-sync is hoisted out below like cljs does. *)
let deferred_handlers : (string, handler) Hashtbl.t = Hashtbl.create 8

let register key f = Hashtbl.replace deferred_handlers key f

(* hoistable slots — set by the sync/pipeline ports when they land *)
let update_checksum : (string -> tx_report -> unit) ref =
  ref (fun _ _ -> ())

let persist_local_tx : (string -> tx_report -> unit) ref =
  ref (fun _ _ -> ())

let kw s = Wire.Keyword s

(* perf-time-ms — float ms *)
let perf_time_ms () = Int64.to_float (Date_time_util.time_ms ())

let tx_meta_bool (r : tx_report) k : bool =
  Db_tx.tx_meta_flag r.tx_meta k

let tx_meta_v (r : tx_report) k : value option =
  Db_tx.tx_meta_lookup r.tx_meta k

let tx_meta_string (r : tx_report) k : string option =
  match Db_tx.tx_meta_lookup r.tx_meta k with
  | Some (String s) | Some (Keyword s) | Some (Uuid s) -> Some s
  | _ -> None

let outliner_op_of (tx_meta : tx_meta) : string option =
  match Db_tx.tx_meta_lookup tx_meta "outliner-op" with
  | Some (Keyword s) | Some (String s) -> Some s
  | _ -> None

(* ---------- outliner-op perf/delta tables (cljs atoms named
   outliner-op-deltas and outliner-op-perf), keyed by :ui/perf-id;
   apply-outliner-ops takes them back out. *)
let outliner_op_deltas : (string, Wire.t) Hashtbl.t = Hashtbl.create 8

let note_outliner_op_delta perf_id delta =
  Hashtbl.replace outliner_op_deltas perf_id delta

let take_outliner_op_delta perf_id =
  match perf_id with
  | None -> None
  | Some id -> (
      match Hashtbl.find_opt outliner_op_deltas id with
      | Some d -> Hashtbl.remove outliner_op_deltas id; Some d
      | None -> None)

let outliner_op_perf : (string, Wire.t list) Hashtbl.t = Hashtbl.create 8

let note_outliner_op_perf perf_id data =
  let prev = Option.value (Hashtbl.find_opt outliner_op_perf perf_id) ~default:[] in
  Hashtbl.replace outliner_op_perf perf_id (prev @ [ data ])

let take_outliner_op_perf perf_id =
  match perf_id with
  | None -> []
  | Some id -> (
      match Hashtbl.find_opt outliner_op_perf id with
      | Some xs -> Hashtbl.remove outliner_op_perf id; xs
      | None -> [])

(* cljs transaction.cljs log-outliner-op-perf! — the endpoint-level perf
   log emitted by :thread-api/apply-outliner-ops. dev (goog.DEBUG) logs
   every op; OUTLINER-PERF-LOGGING (e2e builds) logs only op-names +
   worker-apply-ms for the three e2e op sets. *)
let e2e_perf_op_names =
  [ [ "insert-blocks" ]; [ "save-block"; "insert-blocks" ]; [ "delete-blocks" ] ]

let op_names_of (data : Wire.t) : string list =
  match Wire.get "op-names" data with
  | Some (Wire.Array xs) | Some (Wire.List xs) ->
      List.filter_map (function Wire.Keyword s -> Some s | _ -> None) xs
  | _ -> []

let log_tx_outliner_op_perf (data : Wire.t) =
  match Wire.get "perf-id" data with
  | Some (Wire.String _) | Some (Wire.Uuid _) ->
      let data' =
        match Wire.get "apply-ms" data with
        | Some am -> Cljs_map.assoc data "worker-apply-ms" am
        | None -> data
      in
      if !Sync_state.dev_or_test then
        Worker_log.info ":db-worker/outliner-op-perf"
          [ ("data", Ds_wire.edn_of_transit data') ]
      else if !Sync_state.outliner_perf_logging
              && List.mem (op_names_of data') e2e_perf_op_names then
        let slim =
          Wire.Map
            (List.filter
               (fun (k, _) -> k = kw "op-names" || k = kw "worker-apply-ms")
               (Wire.as_map data'))
        in
        Worker_log.info ":db-worker/outliner-op-perf"
          [ ("data", Ds_wire.edn_of_transit slim) ]
  | _ -> ()

(* cljs log-outliner-op-perf! — recorded only in dev (goog.DEBUG) *)
let log_outliner_op_perf (data : Wire.t) =
  if !Sync_state.dev_or_test then
    match Wire.get "perf-id" data with
    | Some (Wire.String perf_id) | Some (Wire.Uuid perf_id) -> begin
        note_outliner_op_perf perf_id data;
        Worker_log.info ":db-worker/outliner-op-perf"
          (List.map
             (fun (k, v) ->
                ( (match k with
                   | Wire.Keyword s -> s
                   | _ -> "?")
                , Transit_codec.to_string v ))
             (Wire.as_map data))
      end
    | _ -> ()
  else ()

let perf_wire (data : (string * Wire.t) list) : Wire.t =
  Wire.Map (List.map (fun (k, v) -> (kw k, v)) data)

let ms_wire (ms : float) : Wire.t = Wire.Float ms

(* ---------- renderer-tx-meta ---------- *)

let renderer_tx_meta_keys =
  [ "initial-pages?"; "end?"; "client-id"; "outliner-op"; "deleted-page"
  ; "data" ]

(* cljs (select-keys tx-meta renderer-tx-meta-keys) — only present keys *)
let renderer_tx_meta (tx_meta : tx_meta) : Wire.t =
  Wire.Map
    (List.filter_map
       (fun (a, v) ->
          if List.mem a renderer_tx_meta_keys then
            Some (kw a, Ds_wire.transit_of_value v)
          else None)
       tx_meta)

(* ---------- publish-render-delta? ---------- *)

let publish_render_delta (tx_meta : tx_meta) : bool =
  not
    (Db_tx.tx_meta_flag tx_meta "rtc-download-graph?"
     || Db_tx.tx_meta_flag tx_meta "sync-download-graph?"
     || Db_tx.tx_meta_flag tx_meta "skip-validate-db?"
     || Db_tx.tx_meta_flag tx_meta
          "logseq.graph-parser.exporter/new-graph?"
     (* see cljs comment — file-graph import payloads can crash the
        renderer Comlink endpoint *)
     || Db_tx.tx_meta_flag tx_meta
          "logseq.graph-parser.exporter/imported-data?")

(* ---------- canonical-replacements ---------- *)

let datom_entity_uuid (db : db) (v : value) : string option =
  match v with
  | Ref id -> (
      match entity db (Entity_id id) with
      | Some e -> (
          match Ldb.value e "block/uuid" with
          | Some (Uuid u) -> Some u
          | _ -> None)
      | None -> None)
  | Int64 id -> (
      match Datascript.Util.int64_to_int id with
      | Some id -> (
          match entity db (Entity_id id) with
          | Some e -> (
              match Ldb.value e "block/uuid" with
              | Some (Uuid u) -> Some u
              | _ -> None)
          | None -> None)
      | None -> None)
  | _ -> None

let canonical_replacements (r : tx_report) : Wire.t =
  let db_after = r.db_after in
  let block_uuids =
    List.filter_map
      (fun (d : datom) ->
         if d.added && d.a = "block/tx-id" then
           datom_entity_uuid db_after (Ref d.e)
         else None)
      r.tx_data
  in
  let parent_uuids =
    List.filter_map
      (fun (d : datom) ->
         if d.a = "block/parent" then datom_entity_uuid db_after d.v
         else None)
      r.tx_data
  in
  (* canonical_blocks lives in render_snapshot which transitively
     depends on db_listener — late-bound ref like endpoint_transaction *)
  match !Sync_deps.canonical_blocks_fn with
  | Some f -> (
      match
        f db_after
          (List.map (fun u -> Wire.Uuid u) (block_uuids @ parent_uuids))
      with
      | Wire.Map _ as m ->
          Option.value (Wire.get "blocks" m) ~default:(Wire.Map [])
      | _ -> Wire.Map [])
  | None -> Wire.Map []

(* ---------- renderer-route-candidates ---------- *)

let renderer_route_candidates (_db : db) (blocks : entity list)
    : Wire.t =
  let tagged ident =
    List.filter_map
      (fun (b : entity) -> if Ldb.has_tag b ident then Some b.id else None)
      blocks
  in
  let task_ids = tagged "logseq.class/Task" in
  let comment_ids = tagged "logseq.class/Comment" in
  Wire.Map
    (List.filter_map Fun.id
       [ (if task_ids <> [] then
            Some
              ( kw "task-route-candidate-ids"
              , Wire.Array (List.map (fun i -> Wire.Int i) task_ids) )
          else None)
       ; (if comment_ids <> [] then
            Some
              ( kw "comment-route-candidate-ids"
              , Wire.Array (List.map (fun i -> Wire.Int i) comment_ids) )
          else None) ])

(* ---------- build-render-delta ---------- *)

let build_render_delta (repo : string) (r : tx_report)
    (affected_keys : Wire.t list) (deleted_block_uuids : string list)
    : Wire.t =
  let blocks = canonical_replacements r in
  let block_keys =
    match blocks with
    | Wire.Map kvs ->
        List.filter_map
          (fun (k, _) -> match k with Wire.Uuid u -> Some u | _ -> None)
          kvs
    | _ -> []
  in
  let deleted_block_uuids =
    List.filter
      (fun u -> not (List.mem u block_keys))
      deleted_block_uuids
  in
  Render_delta.build ~graph_id:repo ~rev:r.db_after.max_tx
    ~op_id:
      (match tx_meta_v r "db-sync/tx-id" with
       | Some v -> Ds_wire.transit_of_value v
       | None -> Wire.Nil)
    ~blocks ~deleted_block_uuids ~affected_keys ~tx_report:r

(* ---------- main-thread-sync-result ---------- *)

type sync_result =
  { sync_tx_report : tx_report
  ; sync_started_at : float
  ; sync_pipeline_at : float
  ; sync_delta_at : float
  ; sync_payload : Wire.t }

let main_thread_sync_result (repo : string) (conn : conn)
    (r : tx_report) : sync_result option =
  Worker_state.set_db_latest_tx_time repo;
  if publish_render_delta r.tx_meta then begin
    let started_at = perf_time_ms () in
    let render_result = Worker_pipeline.invoke_hooks conn r in
    let pipeline_at = perf_time_ms () in
    let processed = render_result.hooks_tx_report in
    let delta =
      build_render_delta repo processed
        render_result.hooks_affected_keys
        render_result.hooks_deleted_block_uuids
    in
    let delta_at = perf_time_ms () in
    let route =
      renderer_route_candidates processed.db_after
        render_result.hooks_blocks
    in
    let payload =
      Wire.Map
        ([ kw "repo", Wire.String repo
         ; kw "tx-meta", renderer_tx_meta r.tx_meta
         ; kw "delta", delta ]
         @ Wire.as_map route)
    in
    (match tx_meta_string r "ui/perf-id" with
     | Some perf_id -> note_outliner_op_delta perf_id delta
     | None -> ());
    Some
      { sync_tx_report = processed
      ; sync_started_at = started_at
      ; sync_pipeline_at = pipeline_at
      ; sync_delta_at = delta_at
      ; sync_payload = payload }
  end
  else None

(* ---------- broadcast-main-thread-sync! ---------- *)

let broadcast_main_thread_sync (r : tx_report) (s : sync_result) : unit =
  let broadcast_at = perf_time_ms () in
  Broadcast.to_clients ~kind:"sync-db-changes"
    ~transit_payload:
      (Transit_codec.to_string
         (Wire.Array [ kw "sync-db-changes"; s.sync_payload ]));
  let perf_id =
    match tx_meta_v r "ui/perf-id" with
    | Some v -> Ds_wire.transit_of_value v
    | None -> Wire.Nil
  in
  log_outliner_op_perf
    (perf_wire
       [ "stage", kw "sync-db-to-main-thread"
       ; "perf-id", perf_id
       ; ( "outliner-op"
         , match outliner_op_of r.tx_meta with
           | Some o -> kw o
           | None -> Wire.Nil )
       ; "tx-count", Wire.Int (List.length s.sync_tx_report.tx_data)
       ; "pipeline-ms", ms_wire (s.sync_pipeline_at -. s.sync_started_at)
       ; "delta-ms", ms_wire (s.sync_delta_at -. s.sync_pipeline_at)
       ; "broadcast-ms", ms_wire (perf_time_ms () -. broadcast_at) ])

(* ---------- error reporting ---------- *)

let report_post_commit_error repo (tx_meta : tx_meta) stage exn =
  Worker_log.error "db-worker/post-commit-handler-failed"
    [ ("repo", repo); ("stage", stage); ("error", Printexc.to_string exn) ];
  (* cljs platform/post-message! :capture-error {:error :payload} *)
  (try
     Broadcast.to_clients ~kind:"capture-error"
       ~transit_payload:
         (Transit_codec.to_string
            (Wire.Array
               [ kw "capture-error"
               ; Wire.Map
                   [ kw "error"
                   , Wire.String (Printexc.to_string exn)
                   ; ( kw "payload"
                     , Wire.Map
                         (List.filter_map Fun.id
                            [ Some (kw "repo", Wire.String repo)
                            ; Some (kw "stage", kw stage)
                            ; (match outliner_op_of tx_meta with
                               | Some o ->
                                   Some (kw "outliner-op", kw o)
                               | None -> None) ]) ) ] ]))
   with report_error ->
     Worker_log.error "db-worker/report-post-commit-handler-failed"
       [ ("repo", repo); ("stage", stage)
       ; ("error", Printexc.to_string report_error) ])

let run_post_commit repo tx_meta stage f =
  try f () with exn -> report_post_commit_error repo tx_meta stage exn

(* ---------- process-committed-tx! ---------- *)

let invoke_listener_handler (timings : (string * float) list ref) k
    (handler_fn : handler) repo (r : tx_report) =
  let started_at = perf_time_ms () in
  let result = handler_fn repo r in
  timings := !timings @ [ (k, perf_time_ms () -. started_at) ];
  result

let process_committed_tx ~persist_enabled ~sync_db_to_main_thread
    ~(deferred : (string * handler) list) repo conn (r : tx_report) =
  let started_at = perf_time_ms () in
  run_post_commit repo r.tx_meta "update-checksum" (fun () ->
      !update_checksum repo r);
  let checksum_at = perf_time_ms () in
  let handler_timings = ref [] in
  (if persist_enabled then
     run_post_commit repo r.tx_meta "persist-local-tx" (fun () ->
         invoke_listener_handler handler_timings "db-sync"
           !persist_local_tx repo r));
  let persist_at = perf_time_ms () in
  let sync_result =
    if sync_db_to_main_thread then
      main_thread_sync_result repo conn r
    else None
  in
  let processed_tx_report =
    match sync_result with
    | Some s -> s.sync_tx_report
    | None -> r
  in
  let sync_main_at = perf_time_ms () in
  List.iter
    (fun (key, f) ->
       run_post_commit repo r.tx_meta key (fun () ->
           invoke_listener_handler handler_timings key f repo
             processed_tx_report))
    deferred;
  (match sync_result with
   | Some s -> broadcast_main_thread_sync r s
   | None -> ());
  let perf_id =
    match tx_meta_v r "ui/perf-id" with
    | Some v -> Ds_wire.transit_of_value v
    | None -> Wire.Nil
  in
  log_outliner_op_perf
    (perf_wire
       [ "stage", kw "db-listener-complete"
       ; "perf-id", perf_id
       ; ( "outliner-op"
         , match outliner_op_of r.tx_meta with
           | Some o -> kw o
           | None -> Wire.Nil )
       ; "tx-count", Wire.Int (List.length r.tx_data)
       ; "checksum-ms", ms_wire (checksum_at -. started_at)
       ; "persist-ms", ms_wire (persist_at -. checksum_at)
       ; "sync-main-ms", ms_wire (sync_main_at -. persist_at)
       ; ( "handlers-ms"
         , Wire.Array
             (List.map
                (fun (k, ms) ->
                   Wire.Array [ kw k; ms_wire ms ])
                !handler_timings) )
       ; "total-ms", ms_wire (perf_time_ms () -. started_at) ])

(* cljs listen-db-changes! — installed on each repo conn via
   d/listen! ::listen-db-changes!. handler-keys selects which deferred
   listeners run and gates the whole main-thread sync. *)
let listen_db_changes ?(handler_keys : string list option) repo conn =
  let all_handlers =
    Hashtbl.fold (fun k f acc -> (k, f) :: acc) deferred_handlers []
  in
  let selected =
    match handler_keys with
    | Some keys -> List.filter (fun (k, _) -> List.mem k keys) all_handlers
    | None -> all_handlers
  in
  let persist_enabled =
    match handler_keys with
    | Some keys -> List.mem "db-sync" keys
    | None -> true
  in
  let sync_db_to_main_thread =
    match handler_keys with
    | Some keys -> List.mem "sync-db-to-main-thread" keys
    | None -> true
  in
  ignore
    (Datascript.listen conn "listen-db-changes!" (fun (r : tx_report) ->
         if
           r.tx_data <> []
           && (tx_meta_bool r "batch-final-tx-report?"
               || not (tx_meta_bool r "batch-tx-report?"))
         then
           process_committed_tx ~persist_enabled
             ~sync_db_to_main_thread ~deferred:selected repo conn r))

(* built-in deferred listeners — mirror queues jobs with debounce *)
let () =
  register "markdown-mirror" (fun repo r ->
      Db_worker_effect.async (fun () ->
          Db_worker_effect.map (fun _ -> ())
            (Markdown_mirror.handle_tx_report repo r
               { Markdown_mirror.default_opts with defer = true })))

(* cljs platform/post-message! :capture-error {:error msg :payload data
   :extra extra} — broadcast on the shared service channel. *)
let capture_error (api : string) (payload : Wire.t) (extra : Wire.t) : unit =
  Broadcast.to_clients ~kind:"capture-error"
    ~transit_payload:
      (Transit_codec.to_string
         (Wire.Array
            [ kw "capture-error"
            ; Wire.Map
                [ kw "error", Wire.String api
                ; kw "payload", payload
                ; kw "extra", extra ] ]))

(* sync-deps: capture-error reporting *)
let () = Sync_deps.capture_error := Some capture_error
