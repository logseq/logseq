(* frontend.worker.sync.assets — remote asset upload/download + the
   asset-op queue processing. Crypt fns come through Sync_deps hooks. *)

open Datascript
open Db_worker_effect.Infix

let max_asset_size = 100 * 1024 * 1024
let remote_asset_download_parallelism = 10

let repo_missing_asset_upload_files : (string, Wire.t list) Hashtbl.t =
  Hashtbl.create 7

let str_or = function Some s -> Wire.String s | None -> Wire.Nil

(* cljs distinct — first occurrence wins, order preserved *)
let distinct (l : 'a list) : 'a list =
  let seen = Hashtbl.create 8 in
  List.filter
    (fun x ->
       if Hashtbl.mem seen x then false
       else begin
         Hashtbl.add seen x ();
         true
       end)
    l

let graph_aes_key repo : Wire.t option Db_worker_effect.t =
  match Worker_state.datascript_conn repo with
  | Some conn
    when Sync_deps.require "graph_e2ee" Sync_deps.graph_e2ee (Conn.db conn) ->
      Sync_deps.require "ensure_graph_aes_key" Sync_deps.ensure_graph_aes_key repo
      >>= fun aes_key ->
      (match aes_key with
       | Wire.Nil ->
           Sync_util.fail_fast "db-sync/missing-field"
             (Wire.Map
                [ Wire.Keyword "repo", Wire.String repo
                ; Wire.Keyword "field", Wire.Keyword "aes-key" ])
       | _ -> Db_worker_effect.pure (Some aes_key))
  | _ -> Db_worker_effect.pure None

let asset_file_name asset_uuid asset_type =
  Printf.sprintf "%s.%s" asset_uuid asset_type

let local_assets_dir = "assets"

let missing_asset_upload_file asset_id asset_type : Wire.t =
  Wire.Map
    [ Wire.Keyword "asset-id", Wire.String asset_id
    ; Wire.Keyword "asset-type", Wire.String asset_type
    ; Wire.Keyword "file"
    , Wire.String
        (Printf.sprintf "%s/%s" local_assets_dir
           (asset_file_name asset_id asset_type)) ]

let mark_missing_asset_upload_file repo asset_id asset_type =
  let files =
    Option.value
      (Hashtbl.find_opt repo_missing_asset_upload_files repo)
      ~default:[]
  in
  let entry = missing_asset_upload_file asset_id asset_type in
  let files =
    entry :: List.filter (fun f -> Wire.get "asset-id" f <> Some (Wire.String asset_id)) files
  in
  Hashtbl.replace repo_missing_asset_upload_files repo files

let clear_missing_asset_upload_file repo asset_id =
  match Hashtbl.find_opt repo_missing_asset_upload_files repo with
  | Some files ->
      let files' =
        List.filter
          (fun f -> Wire.get "asset-id" f <> Some (Wire.String asset_id))
          files
      in
      if files' = [] then
        Hashtbl.remove repo_missing_asset_upload_files repo
      else Hashtbl.replace repo_missing_asset_upload_files repo files'
  | None -> ()

(* get-missing-asset-upload-files — vec of {:asset-id :asset-type :file}
   maps sorted by :file, matching the cljs wire payload. *)
let get_missing_asset_upload_files repo : Wire.t list =
  match Hashtbl.find_opt repo_missing_asset_upload_files repo with
  | None -> []
  | Some files ->
      List.sort
        (fun a b ->
          compare (Wire.get "file" a) (Wire.get "file" b))
        files

let clear_missing_asset_upload_files repo =
  Hashtbl.remove repo_missing_asset_upload_files repo

let broadcast kind data =
  Broadcast.to_clients ~kind
    ~transit_payload:(Transit_codec.to_string (Wire.Array [ Wire.Keyword kind; data ]))

let notify_asset_progress repo asset_id direction loaded total =
  broadcast "rtc-asset-upload-download-progress"
    (Wire.Map
       [ Wire.Keyword "repo", Wire.String repo
       ; Wire.Keyword "asset-id", Wire.String asset_id
       ; Wire.Keyword "progress"
       , Wire.Map
           [ Wire.Keyword "direction", Wire.Keyword direction
           ; Wire.Keyword "loaded", Wire.Int loaded
           ; Wire.Keyword "total", Wire.Int total ] ])

let mark_asset_write_finish repo asset_id =
  broadcast "asset-file-write-finish"
    (Wire.Map
       [ Wire.Keyword "repo", Wire.String repo
       ; Wire.Keyword "asset-id", Wire.String asset_id
       ; Wire.Keyword "ts", Wire.Float (Sync_state.time_ms ()) ])

let read_asset_bytes repo asset_id asset_type : string Db_worker_effect.t =
  Asset_store.read_bytes ~repo ~name:(asset_file_name asset_id asset_type)

let write_asset_bytes repo asset_id asset_type payload : unit Db_worker_effect.t =
  Asset_store.write_bytes ~repo ~name:(asset_file_name asset_id asset_type)
    payload
  >>= fun () ->
  mark_asset_write_finish repo asset_id;
  Db_worker_effect.pure ()

let http_base () : string option =
  Sync_auth.http_base_url (Worker_state.db_sync_config ())

let asset_url base graph_id asset_id asset_type =
  Printf.sprintf "%s/assets/%s/%s.%s" base graph_id asset_id asset_type

let err typ ?(data = []) msg : exn =
  Sync_util.ex_info msg
    ([ (Wire.Keyword "type", Wire.Keyword typ) ]
     @ (match data with [] -> [] | _ -> [ (Wire.Keyword "data", Wire.Map data) ]))

(* http seams are rebindable like the cljs js/fetch global (tests
   substitute a recorder); download-remote-asset! below is rebindable
   like the cljs var (tests with-redefs it). *)
let http_send_fn : (Http.request -> Http.response Db_worker_effect.t) ref =
  ref Http.send

let http_bytes_send_fn
    : (Http_bytes.request -> Http_bytes.response Db_worker_effect.t) ref =
  ref Http_bytes.send

(* upload-remote-asset! *)
let upload_remote_asset repo graph_id asset_uuid asset_type checksum
    : unit Db_worker_effect.t =
  match (http_base (), graph_id, asset_type, checksum) with
  | Some base, Some gid, Some at, Some cs
    when base <> "" && gid <> "" && at <> "" && cs <> "" ->
      Db_worker_effect.catch
        (graph_aes_key repo >>= fun aes_key ->
         let asset_id = asset_uuid in
         let put_url = asset_url base gid asset_id at in
         (* cljs: (log/error :read-asset-failed e) + mark-missing +
            (throw (ex-info "read-asset failed" {:type ...} e)) *)
         Db_worker_effect.catch
           (read_asset_bytes repo asset_id at)
           (fun e ->
              Worker_log.error "read-asset-failed"
                [ ("repo", repo); ("asset-id", asset_id)
                ; ("error", Printexc.to_string e) ];
              mark_missing_asset_upload_file repo asset_id at;
              raise
                (err "rtc.exception/read-asset-failed" "read-asset failed"))
         >>= fun asset_bytes ->
         clear_missing_asset_upload_file repo asset_id;
         (match aes_key with
          | None -> Db_worker_effect.pure (asset_bytes, false)
          | Some key ->
              Sync_deps.require "encrypt_bytes" Sync_deps.encrypt_bytes key asset_bytes
              >>= fun encrypted ->
              Db_worker_effect.pure
                (Transit_codec.to_string encrypted, true))
         >>= fun (payload, text_payload) ->
         (* cljs payload-size: (count s) for strings = UTF-16 code
            units; .-byteLength for bytes. e2ee payload is transit text,
            raw payload is opaque bytes *)
         let total =
           if text_payload then Search_fuzzy.utf16_length payload
           else String.length payload
         in
         notify_asset_progress repo asset_id "upload" 0 total;
         !http_send_fn
           { Http.url = put_url
           ; method_ = "PUT"
           ; headers =
               Sync_util.auth_headers ()
               @ [ "x-amz-meta-checksum", cs; "x-amz-meta-type", at ]
           ; body = Some payload }
         >>= fun (resp : Http.response) ->
         notify_asset_progress repo asset_id "upload" total total;
         if resp.status >= 200 && resp.status < 300 then
           Db_worker_effect.pure ()
         else
           raise
             (err "rtc.exception/upload-asset-failed" "upload-asset failed"
                ~data:[ (Wire.Keyword "status", Wire.Int resp.status) ]))
        (fun e ->
           match e with
           | Dispatcher.Exn_info (_, kvs)
             when (match Wire.get "type" (Wire.Map kvs) with
                   | Some (Wire.Keyword ("rtc.exception/read-asset-failed"
                                        | "rtc.exception/upload-asset-failed")) ->
                       true
                   | _ -> false) ->
               raise e
           | _ ->
               raise (err "rtc.exception/upload-asset-failed" "upload-asset failed"))
  | _ ->
      (* cljs ex-data: {:repo :asset-uuid :asset-type :checksum :base
         :graph-id} *)
      Db_worker_effect.error
        (Sync_util.ex_info "missing asset upload info"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "asset-uuid", Wire.String asset_uuid
           ; Wire.Keyword "asset-type", str_or asset_type
           ; Wire.Keyword "checksum", str_or checksum
           ; Wire.Keyword "base", str_or (http_base ())
           ; Wire.Keyword "graph-id", str_or graph_id ])

(* test hook — cljs tests rebind upload-remote-asset! *)
let upload_remote_asset_fn = ref upload_remote_asset

let drop_asset_op repo asset_uuid reason data ~current_client ~broadcast_rtc_state
    : unit Db_worker_effect.t =
  Worker_log.warn "db-sync/drop-asset-op"
    [ ("repo", repo); ("asset-uuid", asset_uuid); ("reason", reason) ];
  ignore data;
  clear_missing_asset_upload_file repo asset_uuid;
  Sync_client_op.remove_asset_op repo asset_uuid;
  (match current_client repo with
   | Some client -> broadcast_rtc_state client
   | None -> ());
  Db_worker_effect.pure ()

(* process-asset-op! — asset-op = {:block/uuid u, :update-asset|:remove-asset [...]} *)
let process_asset_op repo graph_id (asset_op : Wire.t)
    ~current_client ~broadcast_rtc_state : unit Db_worker_effect.t =
  (* cljs (when-not asset-uuid fail-fast): "" is truthy — only an
     absent/non-uuid :block/uuid fails *)
  let asset_uuid_opt =
    match Wire.get "block/uuid" asset_op with
    | Some (Wire.Uuid u) | Some (Wire.String u) -> Some u
    | _ -> None
  in
  let asset_uuid = Option.value asset_uuid_opt ~default:"" in
  let op_type =
    if Wire.get "update-asset" asset_op <> None then "update-asset"
    else if Wire.get "remove-asset" asset_op <> None then "remove-asset"
    else "unknown"
  in
  if asset_uuid_opt = None then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "asset-uuid"
         ; Wire.Keyword "op", Wire.Keyword op_type ])
  else if op_type = "update-asset" then
    match Worker_state.datascript_conn repo with
    | None ->
        Sync_util.fail_fast "db-sync/missing-db"
          (Wire.Map
             [ Wire.Keyword "repo", Wire.String repo
             ; Wire.Keyword "op", Wire.Keyword "process-asset-op" ])
    | Some conn ->
        let db = Conn.db conn in
        let ent = entity db (Lookup_ref ("block/uuid", Uuid asset_uuid)) in
        let get a =
          match ent with
          | Some e -> Ldb.value e a
          | None -> None
        in
        let asset_type =
          match get "logseq.property.asset/type" with
          | Some (String s) -> Some s
          | _ -> None
        in
        let checksum =
          match get "logseq.property.asset/checksum" with
          | Some (String s) -> Some s
          | _ -> None
        in
        let size =
          match get "logseq.property.asset/size" with
          | Some (Int64 n) -> Datascript.Util.int64_to_int_exn "asset size" n
          | Some (Float f) -> int_of_float f
          | _ -> 0
        in
        (match (ent, asset_type, checksum) with
         | None, _, _ ->
             drop_asset_op repo asset_uuid "missing-asset-entity"
               [ ("op", "update-asset") ]
               ~current_client ~broadcast_rtc_state
         | _, None, _ | _, Some "", _ ->
             drop_asset_op repo asset_uuid "missing-asset-type"
               [ ("op", "update-asset") ]
               ~current_client ~broadcast_rtc_state
         | _, _, None | _, _, Some "" ->
             drop_asset_op repo asset_uuid "missing-checksum"
               [ ("op", "update-asset") ]
               ~current_client ~broadcast_rtc_state
         | _, _, _ when size > max_asset_size ->
             Worker_log.info "db-sync/asset-too-large"
               [ ("repo", repo); ("asset-uuid", asset_uuid)
               ; ("size", string_of_int size) ];
             clear_missing_asset_upload_file repo asset_uuid;
             Sync_client_op.remove_asset_op repo asset_uuid;
             (match current_client repo with
              | Some client -> broadcast_rtc_state client
              | None -> ());
             Db_worker_effect.pure ()
         | Some _, Some at, Some cs ->
             Db_worker_effect.catch
               (!upload_remote_asset_fn repo (Some graph_id) asset_uuid (Some at) (Some cs)
                >>= fun () ->
                (match entity (Conn.db conn)
                        (Lookup_ref ("block/uuid", Uuid asset_uuid)) with
                 | Some _ ->
                     ignore
                       (!Db_transact.transact_fn conn
                          [ Wire.Map
                              [ Wire.Keyword "block/uuid", Wire.Uuid asset_uuid
                              ; Wire.Keyword "logseq.property.asset/remote-metadata"
                              , Wire.Map
                                  [ Wire.Keyword "checksum", Wire.String cs
                                  ; Wire.Keyword "type", Wire.String at ] ] ]
                          [ ("persist-op?", Bool true) ])
                 | None -> ());
                Sync_client_op.remove_asset_op repo asset_uuid;
                (match current_client repo with
                 | Some client -> broadcast_rtc_state client
                 | None -> ());
                Db_worker_effect.pure ())
               (fun e ->
                  match e with
                  | Dispatcher.Exn_info (_, kvs) ->
                      (match Wire.get "type" (Wire.Map kvs) with
                       | Some (Wire.Keyword "rtc.exception/read-asset-failed") ->
                           (match current_client repo with
                            | Some client -> broadcast_rtc_state client
                            | None -> ());
                           Db_worker_effect.pure ()
                       | Some (Wire.Keyword "rtc.exception/upload-asset-failed") ->
                           Db_worker_effect.pure ()
                       | _ ->
                           Worker_log.error "db-sync/asset-upload-failed"
                             [ ("repo", repo); ("asset-uuid", asset_uuid)
                             ; ("error", Printexc.to_string e) ];
                           Db_worker_effect.pure ())
                  | _ ->
                      Worker_log.error "db-sync/asset-upload-failed"
                        [ ("repo", repo); ("asset-uuid", asset_uuid)
                        ; ("error", Printexc.to_string e) ];
                      Db_worker_effect.pure ()))
  else if op_type = "remove-asset" then begin
    clear_missing_asset_upload_file repo asset_uuid;
    Db_worker_effect.catch
      (Sync_client_op.remove_asset_op repo asset_uuid;
       (match current_client repo with
        | Some client -> broadcast_rtc_state client
        | None -> ());
       Db_worker_effect.pure ())
      (fun e ->
         Worker_log.error "db-sync/asset-delete-failed"
           [ ("repo", repo); ("asset-uuid", asset_uuid)
           ; ("error", Printexc.to_string e) ];
         Db_worker_effect.pure ())
  end
  else Db_worker_effect.pure ()

(* process-asset-ops! — pop-queue + 10 workers *)
let process_asset_ops repo (client : Sync_state.client)
    ~current_client ~broadcast_rtc_state : unit Db_worker_effect.t =
  let asset_ops = Sync_client_op.get_all_asset_ops repo in
  match (client.Sync_state.graph_id, asset_ops) with
  | Some graph_id, _ :: _ ->
      let queue = ref asset_ops in
      let pop () =
        match !queue with
        | [] -> None
        | x :: rest -> queue := rest; Some x
      in
      let rec worker () : unit Db_worker_effect.t =
        match pop () with
        | Some asset_op ->
            (* cljs p/catch outside the recur: a failed op kills this
               parallel slot instead of draining the queue *)
            Db_worker_effect.catch
              (process_asset_op repo graph_id asset_op ~current_client
                 ~broadcast_rtc_state
               >>= worker)
              (fun e ->
                 Worker_log.error "db-sync/process-asset-op-loop-failed"
                   [ ("repo", repo); ("error", Printexc.to_string e) ];
                 Db_worker_effect.pure ())
        | None -> Db_worker_effect.pure ()
      in
      let n = min 10 (List.length asset_ops) in
      Db_worker_effect.all (List.init n (fun _ -> worker ())) >>= fun _ ->
      Db_worker_effect.pure ()
  | _ -> Db_worker_effect.pure ()

(* cljs enqueue-asset-task! — the single shared implementation;
   Sync_state.enqueue catches the previous tail so one failed task
   doesn't stall later enqueues. *)
let enqueue_asset_task (client : Sync_state.client)
    (task : unit -> unit Db_worker_effect.t) : unit =
  Sync_state.enqueue client.Sync_state.asset_queue task

let enqueue_asset_sync_impl repo (client : Sync_state.client) ~enqueue_asset_task
    ~current_client ~broadcast_rtc_state =
  enqueue_asset_task client (fun () ->
      process_asset_ops repo client ~current_client ~broadcast_rtc_state)

(* test hook — cljs tests rebind enqueue-asset-sync! (same convention as
   download_remote_asset_fn). *)
let enqueue_asset_sync_fn :
    (string -> Sync_state.client ->
     enqueue_asset_task:(Sync_state.client ->
                         (unit -> unit Db_worker_effect.t) -> unit) ->
     current_client:(string -> Sync_state.client option) ->
     broadcast_rtc_state:(Sync_state.client -> unit) -> unit) ref =
  ref enqueue_asset_sync_impl

let enqueue_asset_sync repo client ~enqueue_asset_task ~current_client
    ~broadcast_rtc_state =
  ignore
    (!enqueue_asset_sync_fn repo client ~enqueue_asset_task ~current_client
       ~broadcast_rtc_state
     : unit)

let header_opt name (headers : (string * string) list) =
  let name = Unicode.lowercase name in
  match
    List.find_opt
      (fun (k, _) -> Unicode.lowercase k = name)
      headers
  with
  | Some (_, v) -> Some v
  | None -> None

(* download-remote-asset! *)
let download_remote_asset_impl repo graph_id asset_uuid asset_type
    : unit Db_worker_effect.t =
  match (http_base (), graph_id, asset_type) with
  | Some base, Some gid, Some at
    when base <> "" && gid <> "" && at <> "" ->
      Db_worker_effect.catch
        (graph_aes_key repo >>= fun aes_key ->
         let asset_id = asset_uuid in
         let get_url = asset_url base gid asset_id at in
         !http_bytes_send_fn
           { Http_bytes.url = get_url
           ; method_ = "GET"
           ; headers = Sync_util.auth_headers ()
           ; body = None }
         >>= fun (resp : Http_bytes.response) ->
         if resp.status < 200 || resp.status >= 300 then
           raise
             (err "rtc.exception/download-asset-failed" "download asset failed"
                ~data:[ (Wire.Keyword "status", Wire.Int resp.status) ]);
         let total =
           match header_opt "content-length" resp.headers with
           | Some s -> Option.value (int_of_string_opt (Unicode.trim s)) ~default:0
           | None -> 0
         in
         notify_asset_progress repo asset_id "download" 0 total;
         let body = resp.body in
         notify_asset_progress repo asset_id "download" (String.length body)
           (if total > 0 then total else String.length body);
         (match aes_key with
          | None -> write_asset_bytes repo asset_id at body
          | Some key ->
              let untransited = Transit_codec.of_string body in
              Sync_deps.require "decrypt_bytes" Sync_deps.decrypt_bytes key untransited
              >>= fun decrypted -> write_asset_bytes repo asset_id at decrypted))
        (fun e ->
           match e with
           | Dispatcher.Exn_info (_, kvs)
             when (match Wire.get "type" (Wire.Map kvs) with
                   | Some (Wire.Keyword "rtc.exception/download-asset-failed") ->
                       true
                   | _ -> false) ->
               raise e
           | _ ->
               raise
                 (err "rtc.exception/download-asset-failed"
                    "download asset failed"))
  | _ ->
      Db_worker_effect.error
        (Sync_util.ex_info "missing asset download info"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "asset-uuid", Wire.String asset_uuid
           ; Wire.Keyword "graph-id", str_or graph_id ])

(* cljs tests with-redefs download-remote-asset!; every caller goes
   through this ref so a substitute sees the same call sites. *)
let download_remote_asset_fn = ref download_remote_asset_impl

let download_remote_asset repo graph_id asset_uuid asset_type =
  !download_remote_asset_fn repo graph_id asset_uuid asset_type

let log_request_asset_download_failed repo asset_uuid e =
  Worker_log.error "db-sync/request-asset-download-failed"
    [ ("repo", repo); ("asset-uuid", asset_uuid)
    ; ("error", Printexc.to_string e) ]

(* request-asset-download! *)
let request_asset_download repo asset_uuid ~current_client ~enqueue_asset_task
    ~broadcast_rtc_state =
  match current_client repo with
  | Some client ->
      (match client.Sync_state.graph_id with
       | Some graph_id ->
           enqueue_asset_task client (fun () ->
               match Worker_state.datascript_conn repo with
               | Some conn ->
                   (match
                      entity (Conn.db conn)
                        (Lookup_ref ("block/uuid", Uuid asset_uuid))
                    with
                    | Some ent ->
                        let asset_type =
                          match Ldb.value ent "logseq.property.asset/type" with
                          | Some (String s) -> Some s
                          | _ -> None
                        in
                        let should_download =
                          asset_type <> None && asset_type <> Some ""
                          && Ldb.value ent "logseq.property.asset/remote-metadata"
                             <> None
                        in
                        Db_worker_effect.catch
                          ((if should_download then
                              Asset_store.exists ~repo
                                ~name:
                                  (asset_file_name asset_uuid
                                     (Option.get asset_type))
                              >>= fun exists -> Db_worker_effect.pure (not exists)
                            else Db_worker_effect.pure false)
                           >>= fun missing_local ->
                           (if missing_local then
                              download_remote_asset repo (Some graph_id)
                                asset_uuid asset_type
                              >>= fun () ->
                              Sync_client_op.remove_asset_op repo asset_uuid;
                              broadcast_rtc_state client;
                              Db_worker_effect.pure ()
                            else Db_worker_effect.pure ()))
                          (fun e ->
                             log_request_asset_download_failed repo asset_uuid e;
                             Db_worker_effect.error e)
                    | None -> Db_worker_effect.pure ())
               | None -> Db_worker_effect.pure ())
       | None -> ())
  | None -> ()

(* remote-asset-download-candidates — q query over the db *)
let remote_asset_download_candidates_q =
  "[:find ?e ?asset-uuid ?asset-type \
   :where \
   [?asset-class :db/ident :logseq.class/Asset] \
   [?e :block/tags ?asset-class] \
   [?e :block/uuid ?asset-uuid] \
   [?e :logseq.property.asset/type ?asset-type] \
   [?e :logseq.property.asset/remote-metadata]]"

let remote_asset_download_candidates db : (string * string) list =
  q_string db remote_asset_download_candidates_q
  |> List.filter_map (fun row ->
         let eid =
           match List.hd row with
           | Result_entity eid -> Some eid
           | Result_value (Int64 eid) -> Datascript.Util.int64_to_int eid
           | _ -> None
         in
         match row, eid with
         | ( [ _; Result_value (Uuid asset_uuid)
             ; Result_value (String asset_type) ]
           , Some eid ) ->
             (match entity db (Entity_id eid) with
              | Some ent ->
                  let external_url =
                    match
                      Ldb.value ent "logseq.property.asset/external-url"
                    with
                    | Some (String s) -> s
                    | _ -> ""
                  in
                  if external_url = "" then
                    Some (asset_uuid, asset_type)
                  else None
              | None -> None)
         | _ -> None)
  |> List.sort (fun (a, _) (b, _) -> compare a b)

(* download-remote-assets-if-missing! *)
let download_remote_assets_if_missing_impl repo graph_id candidates :
    Wire.t Db_worker_effect.t =
  (* cljs: filter -> distinct -> (sort-by (juxt uuid type)) —
     distinct preserves first-occurrence order, sort is stable *)
  let candidates =
    List.filter (fun (_, t) -> t <> "") candidates
    |> distinct |> List.sort compare
  in
  let queue = ref candidates in
  let pop () =
    match !queue with
    | [] -> None
    | x :: rest -> queue := rest; Some x
  in
  let total = List.length candidates in
  let downloaded = ref 0 in
  let skipped_existing = ref 0 in
  let rec worker () : unit Db_worker_effect.t =
    match pop () with
    | Some (asset_uuid, asset_type) ->
        Asset_store.exists ~repo
          ~name:(asset_file_name asset_uuid asset_type)
        >>= fun exists ->
        (* cljs has no per-asset catch here — a download rejection
           propagates through p/all and rejects the whole batch *)
        (if exists then begin
           incr skipped_existing;
           Db_worker_effect.pure ()
         end
         else
           download_remote_asset repo (Some graph_id) asset_uuid
             (Some asset_type)
           >>= fun () ->
           incr downloaded;
           Db_worker_effect.pure ())
        >>= worker
    | None -> Db_worker_effect.pure ()
  in
  let n = min remote_asset_download_parallelism (List.length candidates) in
  Db_worker_effect.all (List.init n (fun _ -> worker ())) >>= fun _ ->
  Db_worker_effect.pure
    (Wire.Map
       [ Wire.Keyword "total", Wire.Int total
       ; Wire.Keyword "downloaded", Wire.Int !downloaded
       ; Wire.Keyword "skipped-existing", Wire.Int !skipped_existing ])

(* remote-asset-download-candidates-in-tx *)
let remote_asset_download_candidates_in_tx db (tx_data : datom list)
    : (string * string) list =
  List.filter_map
    (fun (d : datom) ->
       if d.a = "logseq.property.asset/remote-metadata" && d.added then
         match entity db (Entity_id d.e) with
         | Some asset ->
             (match
                ( Ldb.value asset "block/uuid"
                , Ldb.value asset "logseq.property.asset/type" )
              with
              | Some (Uuid u), Some (String t) -> Some (u, t)
              | _ -> None)
         | None -> None
       else None)
    tx_data
  |> distinct

(* download-remote-assets-if-missing! — rebindable like
   download_remote_asset_fn so tests can stub the download path. *)
let download_remote_assets_if_missing_fn =
  ref download_remote_assets_if_missing_impl

let download_remote_assets_if_missing repo graph_id candidates =
  !download_remote_assets_if_missing_fn repo graph_id candidates

(* download-missing-remote-assets! *)
let download_missing_remote_assets_impl repo graph_id : Wire.t Db_worker_effect.t =
  match Worker_state.datascript_conn repo with
  | Some conn ->
      !download_remote_assets_if_missing_fn repo graph_id
        (remote_asset_download_candidates (Conn.db conn))
  | None ->
      Db_worker_effect.error
        (Sync_util.ex_info "datascript connection not found"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "graph-id", Wire.String graph_id ])

let download_missing_remote_assets_fn =
  ref download_missing_remote_assets_impl

let download_missing_remote_assets repo graph_id =
  !download_missing_remote_assets_fn repo graph_id
