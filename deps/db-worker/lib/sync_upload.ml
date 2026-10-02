(* frontend.worker.sync.upload — initial graph snapshot upload:
   create remote graph, offload large titles, encrypt datoms, write the
   temp kvs sqlite, then stream kvs rows up in framed gzip batches. *)

open Datascript
open Db_worker_effect.Infix

let upload_kvs_batch_size = 500
let upload_prepare_datoms_batch_size = 100000
let snapshot_upload_max_bytes = 1000000
let snapshot_frame_header_bytes = 4
let snapshot_content_type = "application/transit+json"
let snapshot_content_encoding = "gzip"

let ignored_oversized_upload_attr a =
  a = "logseq.property.tldraw/page"

let snapshot_local_only_attr a = a = "block/tx-id"

let http_base () : string option =
  Sync_auth.http_base_url (Worker_state.db_sync_config ())

(* strip-leading-db-version-prefix *)
let strip_db_version_prefix (s : string) : string =
  let prefix = "logseq_db_" in
  let trimmed = Unicode.trim s in
  if String.length trimmed >= String.length prefix
     && String.sub trimmed 0 (String.length prefix) = prefix then
    Unicode.trim
      (String.sub trimmed (String.length prefix)
         (String.length trimmed - String.length prefix))
  else trimmed

(* fetch-kvs-rows — returns (addr, content, addresses) rows *)
let fetch_kvs_rows (db : Sqlite.db) last_addr limit
    : (int * string * string option) list =
  Sqlite.query db
    ~sql:
      "select addr, content, addresses from kvs where addr > ? order by \
       addr asc limit ?"
    ~bind:
      [| Sqlite.Integer (Int64.of_int last_addr)
       ; Sqlite.Integer (Int64.of_int limit) |]
  |> List.filter_map (fun (row : Sqlite.row) ->
         match row.(0), row.(1), row.(2) with
         | Sqlite.Integer addr, Sqlite.Text content, addresses ->
             Some
               ( Int64.to_int addr
               , content
               , (match addresses with
                  | Sqlite.Text a -> Some a
                  | _ -> None) )
         | _ -> None)

let count_kvs_rows (db : Sqlite.db) : int =
  match
    Sqlite.query db ~sql:"select count(*) from kvs" ~bind:[||]
  with
  | [ row ] ->
      (match row.(0) with
       | Sqlite.Integer n -> Int64.to_int n
       | _ -> 0)
  | _ -> 0

(* rows sqlite row -> wire [addr content addresses] *)
let row_to_wire (addr, content, addresses) : Wire.t =
  Wire.Array
    [ Wire.Int addr; Wire.String content
    ; (match addresses with
       | Some a -> Wire.String a
       | None -> Wire.Nil) ]

let encode_snapshot_rows (rows : Wire.t list) : string =
  Transit_codec.to_string (Wire.Array rows)

let datom_value_byte_length (v : value) : int =
  String.length (Transit_codec.to_string (Ds_wire.transit_of_value v))

(* drop-oversized-upload-datoms — returns (kept, dropped) *)
let drop_oversized_upload_datoms (datoms : datom list)
    : datom list * (string * int * int) list =
  let threshold = snapshot_upload_max_bytes - snapshot_frame_header_bytes in
  List.fold_left
    (fun (kept, dropped) (d : datom) ->
       if ignored_oversized_upload_attr d.a then
         let size = datom_value_byte_length d.v in
         if size > threshold then
           (kept, (d.a, d.e, size) :: dropped)
         else (d :: kept, dropped)
       else (d :: kept, dropped))
    ([], []) datoms
  |> fun (k, d) -> (List.rev k, List.rev d)

let snapshot_rows_byte_length (rows : Wire.t list) : int =
  snapshot_frame_header_bytes + String.length (encode_snapshot_rows rows)

(* Greedy split by per-row encodes. A row encoded alone is never
   smaller than inside the framed array (no cross-row transit cache), so
   the estimate stays conservative and packing costs O(n) instead of
   re-encoding prefixes in a binary search. A single row that does not
   fit can never fit — fail fast. *)
let split_snapshot_rows_by_max_bytes (rows : Wire.t list) max_bytes
    : Wire.t list list =
  let emit batch batches =
    match batch with
    | [] -> batches
    | _ -> List.rev batch :: batches
  in
  let row_size (r : Wire.t) = snapshot_rows_byte_length [ r ] in
  let rec loop remaining batches batch batch_size =
    match remaining with
    | [] -> List.rev (emit batch batches)
    | row :: rest ->
        let size = row_size row in
        if batch_size + size <= max_bytes then
          loop rest batches (row :: batch) (batch_size + size)
        else if batch <> [] then
          loop remaining (emit batch batches) [] 0
        else
          Sync_util.fail_fast "db-sync/snapshot-row-too-large"
            (Wire.Map
               [ Wire.Keyword "max-bytes", Wire.Int max_bytes
               ; Wire.Keyword "row-size", Wire.Int size
               ; Wire.Keyword "addr"
               , (match row with Wire.Array (a :: _) -> a | _ -> row) ])
  in
  loop rows [] [] 0

(* frame-bytes — 4-byte big-endian length header + payload *)
let frame_bytes (data : string) : string =
  let len = String.length data in
  let out = Bytes.create (4 + len) in
  Bytes.set out 0 (Char.chr ((len lsr 24) land 0xff));
  Bytes.set out 1 (Char.chr ((len lsr 16) land 0xff));
  Bytes.set out 2 (Char.chr ((len lsr 8) land 0xff));
  Bytes.set out 3 (Char.chr (len land 0xff));
  Bytes.blit_string data 0 out 4 len;
  Bytes.unsafe_to_string out

(* <snapshot-upload-body — frame + gzip when supported *)
let snapshot_upload_body (rows : Wire.t list)
    : (string * string option) Db_worker_effect.t =
  let frame = frame_bytes (encode_snapshot_rows rows) in
  if Compression.supported () then
    Compression.gzip_encode frame >>= fun encoded ->
    Db_worker_effect.pure (encoded, Some snapshot_content_encoding)
  else Db_worker_effect.pure (frame, None)

let snapshot_upload_url base graph_id reset finished checksum =
  Printf.sprintf "%s/sync/%s/snapshot/upload?reset=%s&finished=%s%s" base
    graph_id
    (if reset then "true" else "false")
    (if finished then "true" else "false")
    (if finished then
       "&checksum=" ^ Sync_transport.uri_encode checksum
     else "")

(* <upload-snapshot-rows-batches! *)
let upload_snapshot_rows_batches (rows_batches : Wire.t list list)
    ~base ~graph_id ~first_batch ~finished ~checksum
    ~(auth_fetch : string -> (string * string) list -> string ->
        unit Db_worker_effect.t) : unit Db_worker_effect.t =
  let remaining = ref rows_batches in
  let first_request = ref first_batch in
  let done_task, done_resolver = Db_worker_effect.wait () in
  (* flat step driver — see stream_snapshot_row_batches *)
  let rec step () : unit =
    match !remaining with
    | [] -> Db_worker_effect.wakeup done_resolver ()
    | batch :: rest ->
        let last_request = rest = [] in
        let finished_request = finished && last_request in
        let upload_url =
          snapshot_upload_url base graph_id !first_request finished_request
            checksum
        in
        Db_worker_effect.on_any
          (snapshot_upload_body batch
           >>= fun (body, encoding) ->
           let headers =
             ("content-type", snapshot_content_type)
             :: (match encoding with
                 | Some e -> [ ("content-encoding", e) ]
                 | None -> [])
           in
           auth_fetch upload_url headers body)
          (fun () ->
             remaining := rest;
             first_request := false;
             step ())
          (fun e -> Db_worker_effect.reject done_resolver e)
  in
  step ();
  done_task

(* <prepare-upload-temp-sqlite! *)
let prepare_upload_temp_sqlite repo graph_id (source_conn : conn)
    ~(aes_key : Wire.t) ~(update_progress : Wire.t -> unit)
    : Sqlite.db Db_worker_effect.t =
  let schema = Datascript.schema (Conn.db source_conn) in
  Sync_temp_sqlite.create_temp_sqlite_conn schema [] >>= fun (db, conn) ->
  let datoms_seq () =
    datoms (Conn.db source_conn) Eavt ()
    |> Seq.filter (fun (d : datom) -> not (snapshot_local_only_attr d.a))
  in
  let large_title_eids =
    datoms_seq ()
    |> Seq.filter_map (fun (d : datom) ->
           if Sync_large_title.large_title_datom d then Some d.e else None)
    |> List.of_seq
  in
  Sync_large_title.process_upload_datoms_in_batches (datoms_seq ())
    ~total:(Seq.length (datoms_seq ()))
    ~batch_size:upload_prepare_datoms_batch_size
    ~process_batch:
      (fun batch ->
         Sync_large_title.offload_large_titles_in_datoms_batch repo
           graph_id batch ~aes_key
           ~upload_fn:
             (fun ~repo ~graph_id ~title ~aes_key ->
                Sync_large_title.upload_large_title ~repo ~graph_id ~title
                  ~aes_key
                  ~http_base:(Option.value (http_base ()) ~default:"")
                  ~auth_headers:(Sync_auth.auth_headers ()))
           ~offloaded_title_eids:large_title_eids ()
         >>= fun datoms' ->
         let kept, dropped = drop_oversized_upload_datoms datoms' in
         (match dropped with
          | [] -> ()
          | _ ->
              Worker_log.warn "db-sync/drop-oversized-upload-datoms"
                [ ("repo", repo)
                ; ("count", string_of_int (List.length dropped))
                ; ("max-bytes"
                  , string_of_int
                      (List.fold_left
                         (fun acc (_, _, b) -> max acc b)
                         0 dropped)) ]);
         (match aes_key with
          | Wire.Nil -> Db_worker_effect.pure (List.map Ds_wire.transit_of_datom kept)
          | _ ->
              Sync_deps.require "encrypt_datoms" Sync_deps.encrypt_datoms
                aes_key
                (List.map Ds_wire.transit_of_datom kept))
         >>= fun encrypted ->
         (* cljs (mapv datom->tx encrypted-datoms): no drop — every item
            yields [:db/add e a v]; fields that can't be read destructure
            to nil like cljs *)
         let tx_data =
           List.map
             (fun w ->
                match
                  (try Some (Ds_wire.datom_of_transit w) with _ -> None)
                with
                | Some (d : datom) ->
                    Wire.Array
                      [ Wire.Keyword "db/add"; Wire.Int d.e
                      ; Wire.Keyword d.a; Ds_wire.transit_of_value d.v ]
                | None ->
                    Wire.Array
                      [ Wire.Keyword "db/add"
                      ; Option.value (Wire.get "e" w) ~default:Wire.Nil
                      ; Option.value (Wire.get "a" w) ~default:Wire.Nil
                      ; Option.value (Wire.get "v" w) ~default:Wire.Nil ])
             encrypted
         in
         ignore
           (Db_transact.transact conn tx_data [ ("initial-db?", Bool true) ]);
         Db_worker_effect.pure ())
    ~progress:
      (fun processed total ->
         update_progress
           (Wire.Map
              [ Wire.Keyword "sub-type", Wire.Keyword "upload-progress"
              ; Wire.Keyword "message"
              , Wire.String
                  (match aes_key with
                   | Wire.Nil ->
                       Printf.sprintf "Preparing %d/%d" processed total
                   | _ ->
                       Printf.sprintf "Encrypting %d/%d" processed total) ]))
  >>= fun () -> Db_worker_effect.pure db

(* cljs normalize-graph-e2ee? : (if (nil? g) true (true? g)) *)
let normalize_graph_e2ee (v : Wire.t) : bool =
  match v with Wire.Nil -> true | Wire.Bool true -> true | _ -> false

let graph_id_uuid repo graph_id =
  if graph_id = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-id" ]);
  if Sync_state.uuid_string graph_id then graph_id
  else
    Sync_util.fail_fast "db-sync/invalid-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-id"
         ; Wire.Keyword "value", Wire.String graph_id ])

let set_graph_sync_metadata repo graph_id graph_e2ee =
  match Worker_state.datascript_conn repo with
  | Some conn ->
      ignore
        (Db_transact.transact conn
           [ Wire.Map
               [ Wire.Keyword "db/ident", Wire.Keyword "logseq.kv/graph-uuid"
               ; Wire.Keyword "kv/value"
               , Wire.Uuid (graph_id_uuid repo graph_id) ]
           ; Wire.Map
               [ Wire.Keyword "db/ident"
               , Wire.Keyword "logseq.kv/graph-remote?"
               ; Wire.Keyword "kv/value", Wire.Bool true ]
           ; Wire.Map
               [ Wire.Keyword "db/ident"
               , Wire.Keyword "logseq.kv/graph-rtc-e2ee?"
               ; Wire.Keyword "kv/value", Wire.Bool graph_e2ee ] ]
           [ ("outliner-op", Keyword "set-kvs") ])
  | None -> ()

let ensure_client_graph_uuid repo graph_id =
  if graph_id <> "" then Sync_client_op.update_graph_uuid repo (Some graph_id)

let persist_upload_graph_identity repo graph_id graph_e2ee =
  let graph_id = Unicode.trim graph_id in
  if graph_id = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-id" ]);
  set_graph_sync_metadata repo graph_id graph_e2ee;
  ensure_client_graph_uuid repo graph_id;
  Wire.Map
    [ Wire.Keyword "graph-id", Wire.String graph_id
    ; Wire.Keyword "graph-e2ee?", Wire.Bool graph_e2ee ]

(* <create-remote-graph-aux! *)
let create_remote_graph_aux repo ~graph_e2ee ~graph_ready_for_use
    : Wire.t Db_worker_effect.t =
  match (http_base (), strip_db_version_prefix repo) with
  | Some base, graph_name when base <> "" && graph_name <> "" ->
      Sync_util.require_auth_token
        (Wire.Map
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "field", Wire.Keyword "auth-token" ]);
      (if graph_e2ee then
         Sync_deps.require "ensure_user_rsa_keys"
           Sync_deps.ensure_user_rsa_keys
           (Wire.kw_map [ "ensure-server?", Wire.Bool true ])
         >>= fun _ -> Db_worker_effect.pure ()
       else Db_worker_effect.pure ())
      >>= fun () ->
      let schema_version =
        match Worker_state.datascript_conn repo with
        | Some conn -> (
            match Ldb.get_graph_schema_version (Conn.db conn) with
            | Some v -> (
                match v with
                | Map kvs ->
                    (match List.assoc_opt (Keyword "major") kvs with
                     | Some (Int64 n) -> Int64.to_string n
                     | Some (Float f) -> string_of_int (int_of_float f)
                     | _ -> "")
                | Int64 n -> Int64.to_string n
                | _ -> "")
            | None -> "")
        | None -> ""
      in
      let body =
        match
          Sync_util.coerce_http_request "graphs/create"
            (Wire.Map
               [ Wire.Keyword "graph-name", Wire.String graph_name
               ; Wire.Keyword "schema-version", Wire.String schema_version
               ; Wire.Keyword "graph-e2ee?", Wire.Bool graph_e2ee
               ; Wire.Keyword "graph-ready-for-use?"
               , Wire.Bool graph_ready_for_use ])
        with
        | Some b -> b
        | None ->
            Sync_util.fail_fast "db-sync/invalid-field"
              (Wire.Map
                 [ Wire.Keyword "repo", Wire.String repo
                 ; Wire.Keyword "field", Wire.Keyword "create-graph-body" ])
      in
      Sync_util.fetch_json (base ^ "/graphs") ~meth:"POST"
        ~headers:[ ("content-type", "application/json") ]
        ~body:(Json_codec.encode body)
        ~response_schema:"graphs/create" ()
      >>= fun result ->
      let graph_id =
        match Wire.get "graph-id" result with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      if graph_id = "" then
        Sync_util.fail_fast "db-sync/missing-field"
          (Wire.Map
             [ Wire.Keyword "repo", Wire.String repo
             ; Wire.Keyword "field", Wire.Keyword "graph-id"
             ; Wire.Keyword "op", Wire.Keyword "create-graph" ]);
      (* cljs (normalize-graph-e2ee? (if (contains? result :graph-e2ee?)
          (:graph-e2ee? result) graph-e2ee?)): a present-but-nil response
          key normalizes to true, a missing key keeps the request value *)
      let graph_e2ee' =
        normalize_graph_e2ee
          (match Wire.get "graph-e2ee?" result with
           | Some v -> v
           | None -> Wire.Bool graph_e2ee)
      in
      ignore (persist_upload_graph_identity repo graph_id graph_e2ee');
      Db_worker_effect.pure
        (Wire.Map
           [ Wire.Keyword "graph-id", Wire.String graph_id
           ; Wire.Keyword "graph-e2ee?", Wire.Bool graph_e2ee' ])
  | _ ->
      Sync_util.fail_fast "db-sync/missing-field"
        (Wire.Map
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "field", Wire.Keyword "http-base" ])

let list_remote_graphs () : Wire.t list Db_worker_effect.t =
  match http_base () with
  | Some base when base <> "" ->
      Sync_util.require_auth_token
        (Wire.Map [ (Wire.Keyword "op", Wire.Keyword "list-remote-graphs") ]);
      Sync_util.fetch_json (base ^ "/graphs") ~response_schema:"graphs/list" ()
      >>= fun resp ->
      (match Wire.get "graphs" resp with
       | Some (Wire.Array gs) | Some (Wire.List gs) ->
           Db_worker_effect.pure gs
       | _ -> Db_worker_effect.pure [])
  | _ -> Db_worker_effect.pure []

let graph_name_of (g : Wire.t) : string option =
  match Wire.get "graph-name" g with
  | Some (Wire.String s) -> Some s
  | _ -> None

let create_remote_graph repo ~graph_e2ee ~graph_ready_for_use
    : Wire.t Db_worker_effect.t =
  let target_graph_name = strip_db_version_prefix repo in
  if target_graph_name = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-name" ]);
  list_remote_graphs () >>= fun remote_graphs ->
  let matching =
    List.filter
      (fun g -> graph_name_of g = Some target_graph_name)
      remote_graphs
  in
  match List.length matching with
  | n when n > 1 ->
      Sync_util.fail_fast "db-sync/ambiguous-graph-match"
        (Wire.Map
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "graph-name", Wire.String target_graph_name
           ; Wire.Keyword "match-count", Wire.Int n ])
  | 1 ->
      (* cljs calls (fail-upload-graph-already-exists! repo {:graph-name
          target-graph-name}) — :graph-id destructures to nil *)
      Db_worker_effect.error
        (Sync_util.ex_info
           "remote graph already exists; delete it before uploading again"
           [ Wire.Keyword "code", Wire.Keyword "db-sync/graph-already-exists"
           ; Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "graph-id", Wire.Nil
           ; Wire.Keyword "graph-name", Wire.String target_graph_name ])
  | _ ->
      Sync_deps.require "preflight_upload_e2ee"
        Sync_deps.preflight_upload_e2ee repo graph_e2ee
      >>= fun () -> create_remote_graph_aux repo ~graph_e2ee ~graph_ready_for_use

let update_upload_progress payload =
  Sync_log_and_state.add_rtc_log "rtc.log/upload" payload

(* upload-graph! *)
let upload_graph repo : Wire.t Db_worker_effect.t =
  match (http_base (), Worker_state.datascript_conn repo) with
  | Some "", _ ->
      (* cljs ex-info "db-sync missing base" {:repo :base} *)
      Db_worker_effect.error
        (Sync_util.ex_info "db-sync missing base"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "base", Wire.String "" ])
  | None, _ ->
      Db_worker_effect.error
        (Sync_util.ex_info "db-sync missing base"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "base", Wire.Nil ])
  | _, None ->
      (* cljs ex-info "db-sync missing datascript conn" {:repo} *)
      Db_worker_effect.error
        (Sync_util.ex_info "db-sync missing datascript conn"
           [ Wire.Keyword "repo", Wire.String repo ])
  | Some base, Some source_conn ->
      let graph_e2ee =
        (* cljs normalize-graph-e2ee? (crypt/graph-e2ee? repo) : nil -> true,
           else (true? v) — the dep's truthy semantics (missing -> false) do
           NOT apply here *)
        match Worker_state.datascript_conn repo with
        | Some conn -> (
            match Ldb.get_graph_rtc_e2ee (Conn.db conn) with
            | None -> true
            | Some (Datascript.Bool b) -> b
            | Some _ -> false)
        | None -> true
      in
      create_remote_graph repo ~graph_e2ee ~graph_ready_for_use:false
      >>= fun created ->
      let graph_id =
        match Wire.get "graph-id" created with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      (if graph_e2ee then
         Sync_deps.require "ensure_graph_aes_key"
           Sync_deps.ensure_graph_aes_key repo
       else Db_worker_effect.pure Wire.Nil)
      >>= fun aes_key ->
      (match aes_key with
       | Wire.Nil when graph_e2ee ->
           Sync_util.fail_fast "db-sync/missing-field"
             (Wire.Map
                [ Wire.Keyword "repo", Wire.String repo
                ; Wire.Keyword "field", Wire.Keyword "aes-key" ])
       | _ -> Db_worker_effect.pure ())
      >>= fun () ->
      let snapshot_checksum =
        Db_sync_checksum.recompute_checksum (Conn.db source_conn)
      in
      Sync_client_op.update_local_checksum repo snapshot_checksum
        (Conn.db source_conn).max_tx;
      update_upload_progress
        (Wire.Map
           [ Wire.Keyword "sub-type", Wire.Keyword "upload-progress"
           ; Wire.Keyword "message"
           , Wire.String (if graph_e2ee then "Encrypting..." else "Preparing...") ]);
      let temp_db_ref = ref None in
      Db_worker_effect.finally
        (prepare_upload_temp_sqlite repo graph_id source_conn ~aes_key
           ~update_progress:update_upload_progress
         >>= fun temp_db ->
         temp_db_ref := Some temp_db;
         let total_rows = count_kvs_rows temp_db in
         let last_addr = ref (-1) in
         let first_batch = ref true in
         let loaded = ref 0 in
         let done_task, done_resolver = Db_worker_effect.wait () in
         (* flat step driver — see stream_snapshot_row_batches *)
         let rec step () : unit =
           let rows =
             fetch_kvs_rows temp_db !last_addr upload_kvs_batch_size
           in
           match rows with
           | [] ->
               ignore (Sync_apply.clear_pending_txs repo);
               Sync_client_op.reset_local_tx repo;
               Sync_client_op.add_all_exists_asset_as_ops repo;
               update_upload_progress
                 (Wire.Map
                    [ Wire.Keyword "sub-type", Wire.Keyword "upload-completed"
                    ; Wire.Keyword "message"
                    , Wire.String "Graph upload finished!" ]);
               Db_worker_effect.wakeup done_resolver
                 (Wire.Map [ (Wire.Keyword "graph-id", Wire.String graph_id) ])
           | _ ->
               let max_addr =
                 List.fold_left
                   (fun acc (a, _, _) -> max acc a)
                   !last_addr rows
               in
               let rows' = List.map row_to_wire rows in
               loaded := !loaded + List.length rows';
               let finished = !loaded = total_rows in
               let row_batches =
                 split_snapshot_rows_by_max_bytes rows'
                   snapshot_upload_max_bytes
               in
               Db_worker_effect.on_any
                 (upload_snapshot_rows_batches row_batches ~base ~graph_id
                    ~first_batch:!first_batch ~finished
                    ~checksum:snapshot_checksum
                    ~auth_fetch:
                      (fun upload_url headers body ->
                         Sync_util.fetch_json upload_url ~meth:"POST" ~headers
                           ~body ~response_schema:"sync/snapshot-upload" ()
                         >>= fun _ -> Db_worker_effect.pure ()))
                 (fun () ->
                    update_upload_progress
                      (Wire.Map
                         [ Wire.Keyword "sub-type"
                         , Wire.Keyword "upload-progress"
                         ; Wire.Keyword "message"
                         , Wire.String
                             (Printf.sprintf "Uploading %d/%d" !loaded
                                total_rows) ]);
                    last_addr := max_addr;
                    first_batch := false;
                    step ())
                 (fun e -> Db_worker_effect.reject done_resolver e)
         in
         step ();
         done_task)
        (fun () ->
           match !temp_db_ref with
           | Some db -> Sync_temp_sqlite.cleanup_temp_sqlite db
           | None -> Db_worker_effect.pure ())
