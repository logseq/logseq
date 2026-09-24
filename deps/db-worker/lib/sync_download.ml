(* frontend.worker.sync.download — snapshot download + import state
   machine (import-prepare / import-rows-chunk / import-finalize).
   Cross-package calls (close-db, unlink-db, create-or-open-db,
   invalidate-search-db, rehydrate-large-titles, search truncate) go
   through Sync_deps hooks; the owning endpoint files wire them. *)

open Datascript
open Db_worker_effect.Infix

module Int_set = Set.Make (Int)

let gzip_bytes (payload : string) : bool =
  String.length payload >= 2
  && Char.code payload.[0] = 31
  && Char.code payload.[1] = 139

let http_base () : string option =
  Sync_auth.http_base_url (Worker_state.db_sync_config ())

(* ---------- import state ---------- *)

let import_temp_dir repo =
  Filename.concat (Sync_state.db_dir ())
    ("download-import-" ^ Sync_state.sanitize_repo_name repo)

let import_rows_path repo =
  Filename.concat (import_temp_dir repo) "download-import.sqlite"

type import_state =
  { aes_key : Wire.t
  ; conn : conn
  ; graph_e2ee : bool
  ; graph_id : string
  ; import_id : string
  ; mutable imported_datoms : int
  ; mutable rows_db : Sqlite.db option
  ; mutable rows_imported : bool
  ; repo : string
  ; mutable total_datoms : int option
  }

let import_state : import_state option ref = ref None

let stale_import_exn repo graph_id import_id =
  Sync_util.ex_info "stale db sync import"
    [ Wire.Keyword "type", Wire.Keyword "db-sync/stale-import"
    ; Wire.Keyword "repo", Wire.String repo
    ; Wire.Keyword "graph-id", Wire.String graph_id
    ; Wire.Keyword "import-id", Wire.String import_id ]

let import_state_of repo graph_id import_id : import_state =
  match !import_state with
  | Some state
    when state.import_id = import_id
         && (repo = "" || state.repo = repo)
         && state.graph_id = graph_id ->
      state
  | _ -> raise (stale_import_exn repo graph_id import_id)

let is_stale_import (e : exn) : bool =
  match e with
  | Dispatcher.Exn_info (_, kvs) ->
      Wire.get "type" (Wire.Map kvs)
      = Some (Wire.Keyword "db-sync/stale-import")
  | _ -> false

let close_import_state (state : import_state) : unit Db_worker_effect.t =
  (match state.rows_db with
   | Some db -> Sqlite.close db
   | None -> ());
  let path = import_rows_path state.repo in
  File_sys.exists path >>= fun exists ->
  if exists then File_sys.remove path else Db_worker_effect.pure ()

let close_import_state_for_repo repo : unit Db_worker_effect.t =
  match !import_state with
  | Some state when state.repo = repo ->
      close_import_state state >>= fun () ->
      import_state := None;
      Db_worker_effect.pure ()
  | _ -> Db_worker_effect.pure ()

let clear_import_state import_id : unit Db_worker_effect.t =
  match !import_state with
  | Some state when state.import_id = import_id ->
      close_import_state state >>= fun () ->
      import_state := None;
      Db_worker_effect.pure ()
  | _ -> Db_worker_effect.pure ()

(* ---------- rows sqlite (temp kvs for streamed snapshot rows) ---------- *)

let create_import_rows_db repo : Sqlite.db Db_worker_effect.t =
  let dir = import_temp_dir repo in
  let path = import_rows_path repo in
  (if Sqlite.pooled_runtime () then Db_worker_effect.pure ()
   else
     File_sys.mkdir_p dir >>= fun () ->
     File_sys.exists path >>= fun exists ->
     if exists then File_sys.remove path else Db_worker_effect.pure ())
  >>= fun () ->
  Sqlite.prepare_pool ~name:(Graph_dir.pool_name ("download-import-" ^ repo))
  >>= fun () ->
  let db =
    Sqlite.open_db_pool ~name:(Graph_dir.pool_name ("download-import-" ^ repo))
      ~path:(if Sqlite.pooled_runtime () then "/download-import.sqlite" else path)
  in
  Graph_store.create_kvs_table db;
  Db_worker_effect.pure db

(* import-rows-batch! — rows are (addr, content, addresses) triples *)
let import_rows_batch (state : import_state)
    (rows : (int * string * string option) list) : int =
  let rows_db =
    match state.rows_db with
    | Some db -> db
    | None ->
        raise
          (Sync_util.ex_info "missing import rows db"
             [ Wire.Keyword "type", Wire.Keyword "db-sync/missing-field"
             ; Wire.Keyword "field", Wire.Keyword "rows-db" ])
  in
  Sqlite.transaction rows_db (fun () ->
      List.iter
        (fun (addr, content, addresses) ->
           let addresses_bind =
             match addresses with Some a -> Sqlite.Text a | None -> Sqlite.Null
           in
           Sqlite.exec rows_db
             ~sql:
               ("INSERT INTO kvs (addr, content, addresses) "
                ^ "values (?, ?, ?) "
                ^ "on conflict(addr) do update set content = ?, \
                   addresses = ?")
             ~bind:
               [| Sqlite.Integer (Int64.of_int addr)
                ; Sqlite.Text content
                ; addresses_bind
                ; Sqlite.Text content
                ; addresses_bind |])
        rows);
  List.length rows

(* ---------- datoms import ---------- *)

let snapshot_local_only_attr a = a = "block/tx-id"

let attr_ns (a : string) : string option =
  match String.index_opt a '/' with
  | Some i -> Some (String.sub a 0 i)
  | None -> None

(* import-datoms-batch! — batch is a list of datom wire forms *)
let import_datoms_batch (conn : conn) aes_key graph_e2ee
    (datoms : Wire.t list) : unit Db_worker_effect.t =
  (if graph_e2ee then
     Sync_deps.require "decrypt_snapshot_datoms_batch"
       Sync_deps.decrypt_snapshot_datoms_batch aes_key datoms
   else Db_worker_effect.pure datoms)
  >>= fun datoms_batch ->
  let datoms =
    List.filter_map
      (fun w -> try Some (Ds_wire.datom_of_transit w) with _ -> None)
      datoms_batch
  in
  let datoms =
    List.filter
      (fun (d : datom) -> not (snapshot_local_only_attr d.a))
      datoms
  in
  let block_eids =
    List.fold_left
      (fun acc (d : datom) ->
         if d.a = "block/uuid" then Int_set.add d.e acc else acc)
      Int_set.empty datoms
  in
  let datom_to_tx (d : datom) : Wire.t =
    Wire.Array
      [ Wire.Keyword "db/add"; Wire.Int d.e; Wire.Keyword d.a
      ; Ds_wire.transit_of_value d.v ]
  in
  let schema_tx, regular_tx =
    List.fold_left
      (fun (s, r) (d : datom) ->
         let tx = datom_to_tx d in
         if attr_ns d.a = Some "db" then (tx :: s, r) else (s, tx :: r))
      ([], []) datoms
  in
  let tx_id = (Conn.db conn).Datascript.max_tx + 1 in
  let block_tx_ids =
    Int_set.fold
      (fun eid acc ->
         Wire.Array
           [ Wire.Keyword "db/add"; Wire.Int eid
           ; Wire.Keyword "block/tx-id"; Wire.Int tx_id ]
         :: acc)
      block_eids []
  in
  let tx_data =
    List.rev schema_tx @ List.rev regular_tx @ block_tx_ids
  in
  (match tx_data with
   | [] -> ()
   | _ ->
       ignore
         (Db_transact.transact conn tx_data
            [ "sync-download-graph?", Bool true ]));
  Db_worker_effect.pure ()

let schema_datom ident_eids schema_version_eid (d : datom) : bool =
  d.e = schema_version_eid
  || (Int_set.mem d.e ident_eids
      && (d.a = "db/ident" || attr_ns d.a = Some "db"))

(* snapshot-datoms-in-import-order *)
let snapshot_datoms_in_import_order (conn : conn) : datom list =
  let db = Conn.db conn in
  let schema_version_eid =
    match entid_ref db (Ident "logseq.kv/schema-version") with
    | Some id -> id
    | None -> -1
  in
  let ident_eids =
    Seq.fold_left
      (fun acc (d : datom) -> Int_set.add d.e acc)
      Int_set.empty
      (datoms db Aevt ~a:"db/ident" ())
  in
  let ordered pred =
    datoms db Eavt () |> Seq.filter pred |> List.of_seq
  in
  ordered (schema_datom ident_eids schema_version_eid)
  @ ordered (fun d -> not (schema_datom ident_eids schema_version_eid d))

let log_import_progress (state : import_state) datoms_count =
  if datoms_count > 0 then begin
    state.imported_datoms <- state.imported_datoms + datoms_count;
    let message =
      match state.total_datoms with
      | Some total ->
          Printf.sprintf "Importing data %d/%d" state.imported_datoms total
      | None -> Printf.sprintf "Importing data %d" state.imported_datoms
    in
    Sync_log_and_state.add_rtc_log "rtc.log/download"
      (Wire.Map
         [ Wire.Keyword "sub-type", Wire.Keyword "download-progress"
         ; Wire.Keyword "graph-uuid", Wire.String state.graph_id
         ; Wire.Keyword "message", Wire.String message ])
  end

let snapshot_import_batch_size = 10000

let replay_imported_rows (state : import_state) : unit Db_worker_effect.t =
  match state.rows_db with
  | None -> Db_worker_effect.pure ()
  | Some rows_db ->
      let storage = Graph_store.storage rows_db in
      let source_conn =
        match Datascript.restore_conn storage with
        | Some c -> c
        | None ->
            raise
              (Sync_util.ex_info "db-sync import source conn restore failed"
                 [ Wire.Keyword "repo", Wire.String state.repo ])
      in
      let remaining = ref (snapshot_datoms_in_import_order source_conn) in
      let rec loop () : unit Db_worker_effect.t =
        match !remaining with
        | [] -> Db_worker_effect.pure ()
        | _ ->
            let rec take acc rem n =
              if n >= snapshot_import_batch_size then (List.rev acc, rem)
              else
                match rem with
                | [] -> (List.rev acc, [])
                | x :: xs -> take (x :: acc) xs (n + 1)
            in
            let batch, rest = take [] !remaining 0 in
            remaining := rest;
            let wire_datoms = List.map Ds_wire.transit_of_datom batch in
            import_datoms_batch state.conn state.aes_key state.graph_e2ee
              wire_datoms
            >>= fun () ->
            log_import_progress state (List.length batch);
            Db_worker_effect.sleep 0. >>= loop
      in
      loop ()

(* ---------- lifecycle ---------- *)

let require_thread_fn (r : 'a option ref) name : 'a =
  match !r with
  | Some f -> f
  | None ->
      Sync_util.fail_fast "db-sync/missing-field"
        (Wire.Map [ (Wire.Keyword "field", Wire.Keyword name) ])

(* complete-datoms-import! *)
let complete_datoms_import repo graph_id remote_tx : unit Db_worker_effect.t =
  Db_worker_effect.catch
    ((match Worker_state.sqlite_conn_of repo Search with
      | Some search_db ->
          Sync_deps.require "search_truncate_table"
            Sync_deps.search_truncate_table search_db
      | None -> ());
     Sync_log_and_state.add_rtc_log "rtc.log/download"
       (Wire.Map
          [ Wire.Keyword "sub-type", Wire.Keyword "download-progress"
          ; Wire.Keyword "graph-uuid", Wire.String graph_id
          ; Wire.Keyword "message", Wire.String "Saving data to DB" ]);
     Db_worker_effect.catch
       (require_thread_fn Sync_deps.rehydrate_large_titles
          "thread-api/db-sync-rehydrate-large-titles" repo graph_id)
       (fun e ->
          Worker_log.error "rehydrate-large-title-failed"
            [ ("error", Printexc.to_string e) ];
          Db_worker_effect.pure ())
     >>= fun () ->
     Sync_log_and_state.add_rtc_log "rtc.log/download"
       (Wire.Map
          [ Wire.Keyword "sub-type", Wire.Keyword "download-completed"
          ; Wire.Keyword "graph-uuid", Wire.String graph_id
          ; Wire.Keyword "message", Wire.String "Graph is ready!" ]);
     (match Worker_state.sqlite_conn_of repo Db with
      | Some db ->
          Sqlite.exec db ~sql:"PRAGMA wal_checkpoint(TRUNCATE)" ~bind:[||]
      | None -> ());
     Sync_client_op.update_local_tx repo remote_tx;
     Broadcast.to_clients ~kind:"add-repo"
       ~transit_payload:
         (Transit_codec.to_string
            (Wire.Array
               [ Wire.Keyword "add-repo"
               ; Wire.Map [ (Wire.Keyword "repo", Wire.String repo) ] ]));
     Db_worker_effect.pure ())
    (fun e ->
       Worker_log.error "complete-datoms-import-failed"
         [ ("error", Printexc.to_string e) ];
       Db_worker_effect.pure ())

(* prepare-import! — total-datoms optionally recorded on the state *)
let prepare_import repo reset graph_id graph_e2ee_opt ?total_datoms ()
    : Wire.t Db_worker_effect.t =
  let graph_e2ee =
    match graph_e2ee_opt with
    | Some b -> b
    | None -> true
  in
  Db_worker_effect.catch
    (let close_db_f =
       require_thread_fn Sync_deps.close_db "thread-api/db-sync-close-db"
     in
     let unlink_db_f =
       require_thread_fn Sync_deps.unlink_db "thread-api/unsafe-unlink-db"
     in
     let invalidate_search_db_f =
       require_thread_fn Sync_deps.invalidate_search_db
         "thread-api/db-sync-invalidate-search-db"
     in
     let create_or_open_db_f =
       require_thread_fn Sync_deps.create_or_open_db
         "thread-api/create-or-open-db"
     in
     (match !import_state with
      | Some state ->
          close_import_state state >>= fun () -> close_db_f state.repo
      | None -> Db_worker_effect.pure ())
     >>= fun () ->
     import_state := None;
     (if reset then
        close_db_f repo
        >>= fun () ->
        unlink_db_f repo >>= fun () -> invalidate_search_db_f repo
      else Db_worker_effect.pure ())
     >>= fun () ->
     let import_id = Uuid_gen.uuid () in
     (if graph_e2ee then
        Sync_deps.require "fetch_graph_aes_key_for_download"
          Sync_deps.fetch_graph_aes_key_for_download repo graph_id
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
     create_or_open_db_f repo
       (Wire.Map
          [ Wire.Keyword "close-other-db?", Wire.Bool true
          ; Wire.Keyword "sync-download-graph?", Wire.Bool true ])
     >>= fun _ ->
     match Worker_state.datascript_conn repo with
     | None ->
         Sync_util.fail_fast "db-sync/missing-field"
           (Wire.Map
              [ Wire.Keyword "repo", Wire.String repo
              ; Wire.Keyword "field", Wire.Keyword "datascript-conn" ])
     | Some conn ->
         import_state :=
           Some
             { aes_key
             ; conn
             ; graph_e2ee
             ; graph_id
             ; import_id
             ; imported_datoms = 0
             ; rows_db = None
             ; rows_imported = false
             ; repo
             ; total_datoms };
         Db_worker_effect.pure
           (Wire.Map
              [ (Wire.Keyword "import-id", Wire.String import_id) ]))
    (fun e ->
       import_state := None;
       Db_worker_effect.error e)

(* import-rows-chunk! *)
let import_rows_chunk (rows : (int * string * string option) list)
    graph_id import_id : bool Db_worker_effect.t =
  Db_worker_effect.catch
    (let state = import_state_of "" graph_id import_id in
     (match state.rows_db with
      | Some _ -> Db_worker_effect.pure ()
      | None ->
          create_import_rows_db state.repo >>= fun rows_db ->
          (match !import_state with
           | Some s when s.import_id = import_id ->
               s.rows_db <- Some rows_db
           | _ -> ());
          Db_worker_effect.pure ())
     >>= fun () ->
     let state = import_state_of "" graph_id import_id in
     ignore (import_rows_batch state rows);
     (match !import_state with
      | Some s when s.import_id = import_id -> s.rows_imported <- true
      | _ -> ());
     Db_worker_effect.pure true)
    (fun e ->
       if not (is_stale_import e) then
         Db_worker_effect.async
           (fun () -> clear_import_state import_id >>= fun () ->
                      Db_worker_effect.pure ());
       Db_worker_effect.error e)

(* finalize-import! *)
let finalize_import repo graph_id remote_tx import_id
    : unit Db_worker_effect.t =
  Db_worker_effect.catch
    (let state = import_state_of repo graph_id import_id in
     (if state.rows_imported then replay_imported_rows state
      else Db_worker_effect.pure ())
     >>= fun () ->
     complete_datoms_import repo graph_id remote_tx >>= fun () ->
     clear_import_state import_id)
    (fun e ->
       if not (is_stale_import e) then
         Db_worker_effect.async
           (fun () -> clear_import_state import_id >>= fun () ->
                      Db_worker_effect.pure ());
       Db_worker_effect.error e)

(* ---------- snapshot download ---------- *)

let kv_row ident v : Wire.t =
  Wire.Map
    [ Wire.Keyword "db/ident", Wire.Keyword ident
    ; Wire.Keyword "kv/value", v ]

let set_graph_sync_metadata conn graph_id graph_e2ee =
  ignore
    (Db_transact.transact conn
       [ kv_row "logseq.kv/graph-uuid" (Uuid graph_id)
       ; kv_row "logseq.kv/graph-remote?" (Bool true)
       ; kv_row "logseq.kv/graph-rtc-e2ee?" (Bool graph_e2ee) ]
       [ ("persist-op?", Bool false) ])

let rtc_download_log payload =
  Sync_log_and_state.add_rtc_log "rtc.log/download" payload

(* snapshot row wire form -> (addr, content, addresses) *)
let row_of_wire (w : Wire.t) : int * string * string option =
  match w with
  | Wire.Array [ addr; content; addresses ]
  | Wire.List [ addr; content; addresses ] ->
      let addr =
        match addr with
        | Wire.Int n -> n
        | Wire.Int64 n -> Int64.to_int n
        | Wire.Float f -> int_of_float f
        | _ -> invalid_arg "snapshot row addr must be int"
      in
      let content =
        match content with
        | Wire.String s -> s
        | _ -> invalid_arg "snapshot row content must be string"
      in
      let addresses =
        match addresses with
        | Wire.String s -> Some s
        | _ -> None
      in
      (addr, content, addresses)
  | _ -> invalid_arg "snapshot row must be [addr content addresses]"

(* <stream-snapshot-row-batches! — framed rows through [on_batch] in
   [batch_size] chunks; a gzip-magic first chunk buffers the whole body
   and decompresses before framing (cljs tees the stream the same way). *)
let stream_snapshot_row_batches read_fn batch_size
    (on_batch : (int * string * string option) list -> unit Db_worker_effect.t)
    : unit Db_worker_effect.t =
  let buffer = ref None in
  let pending = ref [] in
  let first_chunk = ref true in
  let rec flush_pending () : unit Db_worker_effect.t =
    if List.length !pending >= batch_size then begin
      let batch =
        let rec take acc rem n =
          if n >= batch_size then List.rev acc
          else
            match rem with
            | [] -> List.rev acc
            | x :: xs -> take (x :: acc) xs (n + 1)
        in
        take [] !pending 0
      in
      pending := List.filteri (fun i _ -> i >= batch_size) !pending;
      on_batch batch >>= flush_pending
    end
    else Db_worker_effect.pure ()
  in
  let process_chunk chunk : unit Db_worker_effect.t =
    let rows, buf = Db_sync_snapshot.parse_framed_chunk !buffer chunk in
    buffer := buf;
    pending := !pending @ List.map row_of_wire rows;
    flush_pending ()
  in
  let rec collect acc =
    read_fn () >>= function
    | None -> Db_worker_effect.pure (String.concat "" (List.rev acc))
    | Some c -> collect (c :: acc)
  in
  let rec loop () : unit Db_worker_effect.t =
    read_fn () >>= function
    | None ->
        let tail =
          match !buffer with
          | Some buf when String.length buf > 0 ->
              List.map row_of_wire
                (Db_sync_snapshot.finalize_framed_buffer !buffer)
          | _ -> []
        in
        let rows = !pending @ tail in
        if rows <> [] then on_batch rows else Db_worker_effect.pure ()
    | Some chunk ->
        if !first_chunk && gzip_bytes chunk then begin
          first_chunk := false;
          collect [ chunk ] >>= Compression.gzip_decode
          >>= fun decoded -> process_chunk decoded >>= loop
        end
        else begin
          first_chunk := false;
          process_chunk chunk >>= loop
        end
  in
  loop ()

(* download-graph-by-id! *)
let download_graph_by_id repo graph_id graph_e2ee : Wire.t Db_worker_effect.t =
  match http_base () with
  | Some base when repo <> "" && graph_id <> "" && base <> "" ->
      let stage = ref "init" in
      let import_id_cell = ref None in
      Db_worker_effect.catch
        (rtc_download_log
           (Wire.Map
              [ Wire.Keyword "sub-type", Wire.Keyword "download-progress"
              ; Wire.Keyword "graph-uuid", Wire.String graph_id
              ; Wire.Keyword "message"
              , Wire.String "Preparing graph snapshot download" ]);
         stage := "fetch-pull";
         Sync_util.fetch_json (base ^ "/sync/" ^ graph_id ^ "/pull")
           ~response_schema:"sync/pull" ()
         >>= fun pull_resp ->
         let remote_tx =
           match Wire.get "t" pull_resp with
           | Some (Wire.Int t) -> t
           | Some (Wire.Float f) -> int_of_float f
           | _ ->
               raise
                 (Sync_util.ex_info
                    "non-integer remote-tx when downloading graph"
                    [ Wire.Keyword "repo", Wire.String repo
                    ; Wire.Keyword "remote-tx"
                    , Option.value (Wire.get "t" pull_resp) ~default:Wire.Nil ])
         in
         stage := "fetch-snapshot-download";
         Sync_util.fetch_json
           (base ^ "/sync/" ^ graph_id ^ "/snapshot/download")
           ~response_schema:"sync/snapshot-download" ()
         >>= fun snapshot_resp ->
         (if graph_e2ee then begin
            stage := "prepare-e2ee";
            Sync_deps.require "fetch_graph_aes_key_for_download"
              Sync_deps.fetch_graph_aes_key_for_download repo graph_id
            >>= fun _ -> Db_worker_effect.pure ()
          end
          else Db_worker_effect.pure ())
         >>= fun () ->
         stage := "fetch-snapshot-stream";
         let url =
           match Wire.get "url" snapshot_resp with
           | Some (Wire.String u) -> u
           | _ ->
               raise
                 (Sync_util.ex_info "snapshot download missing url"
                    [ Wire.Keyword "repo", Wire.String repo ])
         in
         (match !Sync_deps.http_send_stream with
          | Some f -> f
          | None -> Http_bytes.send_stream)
           { Http_bytes.url
           ; method_ = "GET"
           ; headers = Sync_util.auth_headers ()
           ; body = None }
           (fun status _headers read ->
              rtc_download_log
                (Wire.Map
                   [ Wire.Keyword "sub-type"
                   , Wire.Keyword "download-progress"
                   ; Wire.Keyword "graph-uuid", Wire.String graph_id
                   ; Wire.Keyword "message"
                   , Wire.String "Start downloading graph snapshot" ]);
              if status < 200 || status >= 300 then
                raise
                  (Sync_util.ex_info "snapshot download failed"
                     [ Wire.Keyword "repo", Wire.String repo
                     ; Wire.Keyword "status", Wire.Int status ]);
              let ensure_import () : string Db_worker_effect.t =
                match !import_id_cell with
                | Some id -> Db_worker_effect.pure id
                | None ->
                    stage := "prepare-import";
                    prepare_import repo true graph_id (Some graph_e2ee) ()
                    >>= fun result ->
                    (match Wire.get "import-id" result with
                     | Some (Wire.String id) ->
                         import_id_cell := Some id;
                         Db_worker_effect.pure id
                     | _ ->
                         Db_worker_effect.error
                           (Sync_util.ex_info
                              "prepare-import missing import-id"
                              [ Wire.Keyword "repo", Wire.String repo ]))
              in
              stage := "stream-snapshot";
              stream_snapshot_row_batches read 25000
                (fun rows ->
                   ensure_import () >>= fun import_id ->
                   import_rows_chunk rows graph_id import_id >>= fun _ ->
                   Db_worker_effect.pure ()))
         >>= fun () ->
         rtc_download_log
           (Wire.Map
              [ Wire.Keyword "sub-type", Wire.Keyword "download-completed"
              ; Wire.Keyword "graph-uuid", Wire.String graph_id
              ; Wire.Keyword "message"
              , Wire.String "Graph snapshot downloaded" ]);
         (match !import_id_cell with
          | Some import_id ->
              stage := "finalize-import";
              finalize_import repo graph_id remote_tx import_id
          | None -> Db_worker_effect.pure ())
         >>= fun () ->
         (match Worker_state.datascript_conn repo with
          | Some conn -> set_graph_sync_metadata conn graph_id graph_e2ee
          | None -> ());
         Db_worker_effect.pure
           (Wire.Map
              [ Wire.Keyword "repo", Wire.String repo
              ; Wire.Keyword "graph-id", Wire.String graph_id
              ; Wire.Keyword "remote-tx", Wire.Int remote_tx
              ; Wire.Keyword "graph-e2ee?", Wire.Bool graph_e2ee ]))
        (fun e ->
           (match !import_id_cell with
            | Some import_id ->
                Db_worker_effect.async
                  (fun () -> clear_import_state import_id >>= fun () ->
                             Db_worker_effect.pure ())
            | None -> ());
           rtc_download_log
             (Wire.Map
                [ Wire.Keyword "sub-type", Wire.Keyword "download-completed"
                ; Wire.Keyword "graph-uuid", Wire.String graph_id
                ; Wire.Keyword "message"
                , Wire.String "Graph snapshot download failed" ]);
           Worker_log.error "db-sync/download-graph-by-id-failed"
             [ ("repo", repo); ("graph-id", graph_id); ("stage", !stage)
             ; ("error", Printexc.to_string e) ];
           Db_worker_effect.error
             (Sync_util.ex_info "db-sync download failed"
                [ Wire.Keyword "repo", Wire.String repo
                ; Wire.Keyword "graph-id", Wire.String graph_id
                ; Wire.Keyword "graph-e2ee?", Wire.Bool graph_e2ee
                ; Wire.Keyword "stage", Wire.String !stage
                ; Wire.Keyword "error-message"
                , Wire.String (Printexc.to_string e) ]))
  | _ ->
      Db_worker_effect.error
        (Sync_util.ex_info "db-sync missing graph download info"
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "graph-id", Wire.String graph_id ])

(* sync-deps: platform streaming http transport *)
let () = Sync_deps.http_send_stream := Some Http_bytes.send_stream
