(* Port of the export endpoints in frontend.worker.handler.export
   (src/main/frontend/worker/handler/export.cljs), minus validate-db /
   recompute-checksum-diagnostics which live in endpoint_validate.ml,
   plus the binary db-file endpoints from frontend.worker.db-core.

   Endpoints registered at module load:
     thread-api/export-get-debug-datoms
     thread-api/export-get-all-page->content
     thread-api/export-get-blocks-data
     thread-api/export-blocks-as-format
     thread-api/export-db-binary
     thread-api/export-client-ops-db-binary
     thread-api/import-db-binary
     thread-api/export-edn
     thread-api/import-edn
     thread-api/build-publishing-html    (via Publishing_html/Publishing_db)
   init () wiring: Worker_core.init touches
     Endpoint_export.export_get_debug_datoms
     Endpoint_export.export_get_all_page_content
     Endpoint_export.export_get_blocks_data
     Endpoint_export.export_blocks_as_format
     Endpoint_export.export_db_binary
     Endpoint_export.export_client_ops_db_binary
     Endpoint_export.import_db_binary
     Endpoint_export.export_edn_endpoint
     Endpoint_export.import_edn_endpoint
     Endpoint_export.build_publishing_html
   Also installs Sync_deps.batch_import_edn_fn (outliner-op import-edn-data). *)

open Datascript

let kw s = Wire.Keyword s

let arg args i = List.nth_opt args i

let repo_of args =
  match arg args 0 with
  | Some (Wire.String s) -> s
  | Some Wire.Nil | None -> ""
  | _ -> invalid_arg "first arg must be repo name"

let value_arg args i =
  match arg args i with
  | Some w -> Ds_wire.value_of_transit w
  | None -> Nil

(* :thread-api/export-get-debug-datoms [repo] *)
let export_get_debug_datoms args =
  let repo = repo_of args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      Db_worker_effect.pure
        (Wire.Array
           (List.map
              (fun d -> Wire.Tagged ("datascript/Datom", Ds_wire.transit_of_datom d))
              (Worker_export.get_debug_datoms conn)))

let () =
  Dispatcher.register "thread-api/export-get-debug-datoms"
    export_get_debug_datoms

(* :thread-api/export-get-all-page->content [repo options] *)
let export_get_all_page_content args =
  let repo = repo_of args in
  let options_v = value_arg args 1 in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      let pairs =
        Worker_export.get_all_page_content (Datascript.db conn) options_v
      in
      Db_worker_effect.pure
        (Wire.Array
           (List.map
              (fun (name, content) ->
                Wire.Array [ Wire.String name; Wire.String content ])
              pairs))

let () =
  Dispatcher.register "thread-api/export-get-all-page->content"
    export_get_all_page_content

(* :thread-api/export-get-blocks-data [repo root-block-uuids-or-page-uuid opts content-config] *)
let export_get_blocks_data args =
  let repo = repo_of args in
  let uuids_v = value_arg args 1 in
  let opts_v = value_arg args 2 in
  let content_config_v = value_arg args 3 in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      Db_worker_effect.pure
        (Ds_wire.transit_of_value
           (Worker_export.get_blocks_export_data
              (Datascript.db conn) uuids_v opts_v content_config_v))

let () =
  Dispatcher.register "thread-api/export-get-blocks-data"
    export_get_blocks_data

(* :thread-api/export-blocks-as-format [repo root-block-uuids-or-page-uuid
   format-type options content-config] — worker-export/export-blocks-as-format. *)
let export_blocks_as_format args =
  let repo = repo_of args in
  let uuids_v = value_arg args 1 in
  let format_type_v = value_arg args 2 in
  let options_v = value_arg args 3 in
  let content_config_v = value_arg args 4 in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      Db_worker_effect.pure
        (Wire.String
           (Worker_export.export_blocks_as_format
              (Datascript.db conn) uuids_v format_type_v options_v
              content_config_v))

let () =
  Dispatcher.register "thread-api/export-blocks-as-format"
    export_blocks_as_format

(* --- binary export/import endpoints (frontend.worker.db-core) --- *)

let repo_arg0 = repo_of

(* cljs checkpoint-db! — WAL checkpoint, errors are only logged. *)
let checkpoint_quietly (db : Sqlite.db) =
  try Sqlite.checkpoint db
  with e ->
    Worker_log.warn "db-worker/wal-checkpoint-failed"
      [ "error", Printexc.to_string e ]

(* :thread-api/export-db-binary [repo] *)
let export_db_binary args =
  let repo = repo_arg0 args in
  (match Worker_state.sqlite_conn repo with
   | Some db -> checkpoint_quietly db
   | None -> ());
  Db_worker_effect.bind
    (Sqlite.prepare_pool ~name:(Graph_dir.pool_name repo))
    (fun () ->
      Db_worker_effect.map
        (fun data -> Wire.Binary data)
        (Sqlite.export_file ~name:(Graph_dir.pool_name repo)
           ~dir:(Endpoint_lifecycle.db_dir repo) ~path:"/db.sqlite"))

let () = Dispatcher.register "thread-api/export-db-binary" export_db_binary

(* :thread-api/export-client-ops-db-binary [repo] — try candidate db-file
   paths until one exports (cljs <export-db-file-with-paths). *)
let export_client_ops_db_binary args =
  let repo = repo_arg0 args in
  (match Sync_state.client_ops_conn_opt repo with
   | Some db -> checkpoint_quietly db
   | None -> ());
  Db_worker_effect.bind
    (Sqlite.prepare_pool ~name:(Graph_dir.pool_name repo))
    (fun () ->
      let name = Graph_dir.pool_name repo in
      let dir = Endpoint_lifecycle.db_dir repo in
      (* cljs export-paths, in order: the opened db's filename
         (repoDir-relative for node, pool name for OPFS), then the
         historical layout candidates. *)
      let opened_path =
        match Sync_state.client_ops_conn_opt repo with
        | Some db ->
            let f = Sqlite.filename db in
            if Sqlite.pooled_runtime () then f else Filename.basename f
        | None -> ""
      in
      let candidates =
        [ opened_path
        ; "client-ops-/db.sqlite"
        ; "client-ops-db.sqlite"
        ; "/client-ops-db.sqlite"
        ; "client-ops/db.sqlite"
        ; "/client-ops/db.sqlite"
        ; "client-ops//db.sqlite"
        ; "/client-ops//db.sqlite"
        ; "client-ops-/db.sqlite"
        ; "/client-ops-/db.sqlite" ]
        |> List.filter (fun s -> Unicode.trim s <> "")
        |> List.fold_left (fun acc s -> if List.mem s acc then acc else acc @ [ s ]) []
      in
      let rec try_export = function
        | [] -> Db_worker_effect.pure Wire.Nil
        | path :: rest ->
            Db_worker_effect.catch
              (Db_worker_effect.map
                 (fun data -> Wire.Binary data)
                 (Sqlite.export_file ~name ~dir ~path))
              (fun _ -> try_export rest)
      in
      try_export candidates)

let () =
  Dispatcher.register "thread-api/export-client-ops-db-binary"
    export_client_ops_db_binary

(* :thread-api/import-db-binary [repo data] — close, write the file into
   the pool, reopen with import-type :sqlite-db. *)
let import_db_binary args =
  let repo = repo_arg0 args in
  let data =
    (* cljs passes a Uint8Array; transit Binary arrives as a byte string,
       tolerate vectors of ints too (import-file-payload convention). *)
    match Ds_wire.value_of_transit (Option.value ~default:Wire.Nil (arg args 1)) with
    | String s -> s
    | Vector vs | List vs | Set vs ->
        String.init (List.length vs) (fun i ->
            Char.chr
              (match List.nth_opt vs i with
               | Some (Int n) -> n land 0xff
               | Some (Float f) -> int_of_float f land 0xff
               | _ -> 0))
    | _ -> invalid_arg "import-db-binary: missing data arg"
  in
  if Unicode.trim repo = "" then Db_worker_effect.pure Wire.Nil
  else begin
    Endpoint_lifecycle.close_db_aux repo;
    Db_worker_effect.bind
      (Sqlite.prepare_pool ~name:(Graph_dir.pool_name repo))
      (fun () ->
        Db_worker_effect.bind
          (Sqlite.import_db ~name:(Graph_dir.pool_name repo)
             ~dir:(Endpoint_lifecycle.db_dir repo) ~path:"/db.sqlite" data)
          (fun () ->
            Db_worker_effect.map
              (fun _ -> Wire.Nil)
              (Endpoint_lifecycle.create_or_open_db
                 [ Wire.String repo
                 ; Wire.Map [ Wire.Keyword "import-type", Wire.Keyword "sqlite-db" ] ])))
  end

let () = Dispatcher.register "thread-api/import-db-binary" import_db_binary

(* cljs :export/error-unexpected notification posted via
   platform/post-message!; OCaml posts to all clients like the other
   notification fanouts. *)
let post_export_error_notification () : unit =
  Broadcast.to_clients ~kind:"notification"
    ~transit_payload:
      (Transit_codec.to_string
         (Wire.Array
            [ kw "notification"
            ; Wire.Array [ Wire.Nil; kw "export/error-unexpected" ] ]))

(* :thread-api/export-edn [repo options] *)
let export_edn_endpoint args =
  let repo = repo_of args in
  let options_v = value_arg args 1 in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn -> (
      try
        let v =
          Sqlite_export.build_export (Datascript.db conn) options_v
        in
        Db_worker_effect.pure (Ds_wire.transit_of_value v)
      with e ->
        post_export_error_notification ();
        Db_worker_effect.pure
          (Wire.Map
             [ kw "export-edn-error", Wire.String (Printexc.to_string e) ]))

let () = Dispatcher.register "thread-api/export-edn" export_edn_endpoint

(* :thread-api/import-edn [repo export-edn] *)
let import_edn_endpoint args =
  let repo = repo_of args in
  match Worker_state.datascript_conn repo with
  | None -> invalid_arg "graph not opened"
  | Some conn -> (
      let db = Datascript.db conn in
      let export_edn_v = value_arg args 1 in
      match Sqlite_export.build_import export_edn_v db None with
      | Error e ->
          Db_worker_effect.pure (Wire.Map [ kw "error", Wire.String e ])
      | Ok _ as txs_r -> (
          let validation = Sqlite_export.validate_import_txs txs_r db in
          match validation.error with
          | Some e ->
              Db_worker_effect.pure (Wire.Map [ kw "error", Wire.String e ])
          | None ->
              let tx_ops =
                Sqlite_build.tx_ops_of_values db validation.valid_tx_data
              in
              ignore
                (Db_tx.transact
                   ~tx_meta:
                     [ ("logseq.db.sqlite.export/imported-data?", Bool true) ]
                   conn tx_ops);
              Db_worker_effect.pure
                (Wire.Map
                   [ ( kw "tx-count"
                     , Wire.Int (List.length validation.valid_tx_data) ) ])))

let () = Dispatcher.register "thread-api/import-edn" import_edn_endpoint

(* outliner-op import-edn-data — installed as Sync_deps.batch_import_edn_fn
   so "batch-import-edn" ops work through the same code path. *)
let import_edn_data (conn : conn) (export_map_w : Wire.t)
    (import_options_w : Wire.t) : Wire.t option =
  let export_map = Ds_wire.value_of_transit export_map_w in
  let import_options = Ds_wire.value_of_transit import_options_w in
  let import_options_m = Sqlite_build.bm_of_value import_options in
  let tx_meta_v = Sqlite_build.bm_get import_options_m "tx-meta" in
  let db = Datascript.db conn in
  let error_result msg =
    Some (Wire.Map [ kw "error", Wire.String msg ])
  in
  match
    (try Sqlite_export.build_import export_map db None
     with e ->
       Printf.eprintf "Import EDN error: %s\n" (Printexc.to_string e);
       Error
         "An unexpected error occurred building the import. See the \
          javascript console for details.")
  with
  | Error e -> error_result e
  | Ok _ as txs_r -> (
      let validation = Sqlite_export.validate_import_txs txs_r db in
      match validation.error with
      | Some e -> error_result e
      | None -> (
          let extra_tx_meta =
            match tx_meta_v with
            | Map kvs ->
                List.filter_map
                  (fun (k, v) ->
                    match k with
                    | Keyword a -> Some (a, v)
                    | _ -> None)
                  kvs
            | _ -> []
          in
          try
            let tx_ops =
              Sqlite_build.tx_ops_of_values db validation.valid_tx_data
            in
            ignore
              (Db_tx.transact
                 ~tx_meta:
                   (("logseq.db.sqlite.export/imported-data?", Bool true)
                    :: extra_tx_meta)
                 conn tx_ops);
            None
          with e ->
            error_result
              ("Unexpected Import EDN error: " ^ Printexc.to_string e)))

let () = Sync_deps.batch_import_edn_fn := Some import_edn_data

(* :thread-api/build-publishing-html [repo options] *)
let build_publishing_html args =
  let repo = repo_of args in
  let options_v = value_arg args 1 in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.Nil
  | Some conn ->
      Db_worker_effect.pure
        (Ds_wire.transit_of_value
           (Publishing_html.build_html (Datascript.db conn) options_v))

let () =
  Dispatcher.register "thread-api/build-publishing-html" build_publishing_html
