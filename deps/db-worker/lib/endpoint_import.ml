(* thread-api/import-file-graph — cljs frontend.worker.db-core import
   helpers + <import-file-graph! + compact/terminal import result.
   Source: src/main/frontend/worker/db_core.cljs (~230-430, ~993). *)

open Datascript

module Eff = Db_worker_effect
module BM = Block_map
open Eff.Infix

let kw (s : string) : Wire.t = Wire.Keyword s
let import_file_read_timeout_ms = 5 * 60 * 1000

let node_fs_promises () : bool =
  (* cljs (node-runtime?) && (js/require "fs/promises"). File_sys has a
     native impl, so Native behaves like Node for import. *)
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> false
  | Runtime_env.Node | Runtime_env.Native -> true

let bm_get_string (m : BM.t) (a : Datascript.attr) : string option =
  match BM.attr_value m a with
  | Some (String s) -> Some s
  | _ -> None

let file_needs_lazy_read (file : BM.t) : bool =
  (match bm_get_string file "fs-path" with
   | Some _ -> true
   | None -> false)
  &&
  match BM.attr_value file "file/content" with
  | Some (String s) -> String.trim s = ""
  | _ -> true

(* ui-request/<request :read-import-file {:path} — resolves to a file map *)
let request_import_file (file : BM.t) : BM.t Eff.t =
  Sync_crypt.ui_request_impl (kw "read-import-file")
    (Wire.kw_map
       [ ( "path"
         , match bm_get_string file "path" with
           | Some p -> Wire.String p
           | None -> Wire.Nil ) ])
    ~hint:"import-file-graph" ~timeout_ms:import_file_read_timeout_ms ()
  |> Eff.map BM.of_transit

(* <read-import-file-content *)
let read_import_file_content (file : BM.t) : string Eff.t =
  if file_needs_lazy_read file && node_fs_promises () then
    match bm_get_string file "fs-path" with
    | Some p ->
      File_sys.read_text p
      |> Fun.flip Eff.catch (fun e ->
         Worker_log.error "read-import-file"
           [ ("fs-path", p); ("error", Printexc.to_string e) ];
         Eff.error e)
    | None ->
      Eff.error
        (Dispatcher.Exn_info
           ( "Import file is missing content and fs-path"
           , [ (kw "path", Wire.Nil) ] ))
  else
    match BM.attr_value file "file/content" with
    | Some (String c) -> Eff.pure c
    | _ ->
      (match bm_get_string file "path" with
       | Some path ->
         request_import_file file
         >>= fun resolved ->
         (match BM.attr_value resolved "file/content" with
          | Some (String c) -> Eff.pure c
          | _ ->
            Eff.error
              (Dispatcher.Exn_info
                 ( "Import file is missing content"
                 , [ (kw "path", Wire.String path) ] )))
       | None ->
         Eff.error
           (Dispatcher.Exn_info
              ( "Import file is missing content and fs-path"
              , [ (kw "path", Wire.Nil) ] )))

(* <import-file-stat — node fs.stat -> {:mtime-ms :birthtime-ms} *)
let import_file_stat (fs_path : string) : File_sys.file_stat option Eff.t =
  if node_fs_promises () then
    File_sys.stat fs_path
    |> Fun.flip Eff.catch (fun e ->
       Worker_log.error "import-file-stat"
         [ ("fs-path", fs_path); ("error", Printexc.to_string e) ];
       Eff.pure None)
  else Eff.pure None

(* import-file-payload — Uint8Array/ArrayBuffer/array of ints arrive as
   transit Binary (-> String) or a vector of ints *)
let import_file_payload (v : Datascript.value option) : string option =
  match v with
  | Some (String s) -> Some s
  | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
    (try
       Some
         (String.init (List.length vs) (fun i ->
              Char.chr
                (match List.nth vs i with
                 | Int n -> n land 0xff
                 | Float f -> int_of_float f land 0xff
                 | _ -> 0)))
     with _ -> None)
  | _ -> None

(* <read-import-asset-payload *)
let read_import_asset_payload (file : BM.t) : string option Eff.t =
  match import_file_payload (BM.attr_value file "asset/payload") with
  | Some p -> Eff.pure (Some p)
  | None ->
    if
      (match bm_get_string file "fs-path" with
       | Some _ -> true
       | None -> false)
      && node_fs_promises ()
    then
      (match bm_get_string file "fs-path" with
       | Some p ->
         Eff.map (fun b -> Some b) (File_sys.read_binary p)
         |> Fun.flip Eff.catch (fun e ->
            Worker_log.error "read-import-asset"
              [ ("fs-path", p); ("error", Printexc.to_string e) ];
            Eff.pure None)
       | None -> Eff.pure None)
    else
      (match bm_get_string file "path" with
       | Some _ ->
         request_import_file file
         |> Eff.map (fun resolved ->
            import_file_payload (BM.attr_value resolved "asset/payload"))
       | None -> Eff.pure None)

(* <read-and-copy-import-asset — payload -> checksum + edn-handler ->
   assets[asset-name] + asset write unless pdf-annotation *)
let read_and_copy_import_asset (repo : string) (file : BM.t)
    (assets : (string, BM.t) Hashtbl.t)
    (buffer_handler : string -> (BM.t -> BM.t) * bool) : unit Eff.t =
  read_import_asset_payload file
  >>= fun payload ->
  match payload with
  | None -> Eff.pure ()
  | Some payload ->
    let asset_type =
      Db_asset.asset_path_to_type
        (Option.value ~default:"" (bm_get_string file "path"))
    in
    let asset_id = Common_uuid.new_block_id () in
    let asset_name =
      Option.bind (bm_get_string file "path") (fun p ->
          Gp_exporter.asset_path_to_name (Some p))
    in
    let size =
      match BM.attr_value file "asset/size" with
      | Some (Int n) -> n
      | Some (Float f) -> int_of_float f
      | _ -> String.length payload
    in
    Crypto.sha256_hex payload
    >>= fun checksum ->
    let with_edn_content, pdf_annotation = buffer_handler payload in
    let asset_data =
      with_edn_content
        [ ("size", Int size); ("type", String asset_type)
        ; ( "path"
          , match bm_get_string file "path" with
            | Some p -> String p
            | None -> Nil )
        ; ("checksum", String checksum); ("asset-id", Uuid asset_id) ]
    in
    (match asset_name with
     | Some name -> Hashtbl.replace assets name asset_data
     | None -> Hashtbl.replace assets "" asset_data);
    if not pdf_annotation then
      Asset_store.write_bytes ~repo
        ~name:(Sync_assets.asset_file_name asset_id asset_type)
        payload
    else Eff.pure ()

(* set-import-ui-state! — node posts to the host event-fn; browser goes
   through invoke-main-thread (invoke_remote is stubbed, so it degrades
   to a noop). Runs async like cljs (returns p/resolved nil). *)
let set_import_ui_state (path : string list) (v : Datascript.value) : unit =
  let path_wire =
    Wire.Array (List.map (fun s -> Wire.Keyword s) path)
  in
  let value_wire = Ds_wire.transit_of_value v in
  if node_fs_promises () then
    Broadcast.to_clients ~kind:"thread-api/set-ui-state"
      ~transit_payload:
        (Transit_codec.to_string (Wire.Array [ path_wire; value_wire ]))
  else
    Eff.async (fun () ->
        Comlink.invoke_remote "thread-api/set-ui-state"
          (Transit_codec.to_string (Wire.Array [ path_wire; value_wire ]))
        |> Eff.map ignore
        |> Fun.flip Eff.catch (fun _ -> Eff.pure ()))

(* ---- options assembly ---- *)

let wire_bm (w : Wire.t) : BM.t = BM.of_transit w

let decode_user_options (m : BM.t) : Gp_exporter.user_options =
  let open Gp_exporter in
  let d = default_user_options () in
  let str_list k =
    match BM.attr_value m k with
    | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
      List.filter_map
        (fun (v : value) -> match v with String s -> Some s | _ -> None)
        vs
    | Some (String s) -> [ s ]
    | _ -> []
  in
  let bool_opt k cur =
    match BM.attr_value m k with Some (Bool b) -> b | _ -> cur
  in
  { tag_classes =
      (match BM.attr_value m "tag-classes" with
       | Some _ -> str_list "tag-classes"
       | None -> d.tag_classes)
  ; property_classes =
      (match BM.attr_value m "property-classes" with
       | Some _ -> str_list "property-classes"
       | None -> d.property_classes)
  ; property_parent_classes =
      (match BM.attr_value m "property-parent-classes" with
       | Some _ -> str_list "property-parent-classes"
       | None -> d.property_parent_classes)
  ; convert_all_tags = bool_opt "convert-all-tags?" d.convert_all_tags
  ; remove_inline_tags =
      bool_opt "remove-inline-tags?" d.remove_inline_tags
  ; extract_code_snippets =
      bool_opt "extract-code-snippets" d.extract_code_snippets }

(* opts (a transit map) -> Gp_exporter.options; notify_user accumulates
   notifications into the ref. *)
let options_of_opts (repo : string) (opts : BM.t)
    (notifications : BM.t list ref) : Gp_exporter.options =
  let base = Gp_exporter.default_options () in
  let getv k = BM.attr_value opts k in
  let int_opt k =
    match getv k with
    | Some (Int n) -> Some n
    | Some (Float f) -> Some (int_of_float f)
    | _ -> None
  in
  let macros =
    match getv "macros" with
    | Some (Map kvs) ->
      List.filter_map
        (fun (k, v) ->
          match k, v with
          | (Keyword name | String name), String body -> Some (name, body)
          | _ -> None)
        kvs
    | _ -> []
  in
  let default_config =
    match getv "default-config" with
    | Some (String s) ->
      (match Edn_util.safe_read_string s with
       | Some v -> BM.of_transit (Ds_wire.transit_of_value v)
       | None -> [])
    | Some (Map _ as v) -> BM.of_transit (Ds_wire.transit_of_value v)
    | _ -> []
  in
  { base with
    verbose =
      (match getv "verbose" with Some (Bool b) -> b | _ -> false)
  ; user_options =
      (match getv "user-options" with
       | Some (Map _ as v) ->
         decode_user_options
           (BM.of_transit (Ds_wire.transit_of_value v))
       | _ -> base.user_options)
  ; macros
  ; notify_user = (fun n -> notifications := n :: !notifications)
  ; set_ui_state = set_import_ui_state
  ; read_file = read_import_file_content
  ; get_file_stat = Some import_file_stat
  ; read_and_copy_asset =
      Some
        (fun (file : BM.t) (assets : (string, BM.t) Hashtbl.t)
          (buffer_handler : string -> (BM.t -> BM.t) * bool) ->
          read_and_copy_import_asset repo file assets buffer_handler)
  ; default_config
  ; import_timeout_ms = int_opt "import-timeout-ms"
  ; import_heartbeat_ms = int_opt "import-heartbeat-ms"
  ; rpath_key =
      (match getv "rpath-key" with
       | Some (Keyword s) | Some (String s) -> s
       | _ -> "path")
  ; finalize_imported_graph =
      (match getv "finalize-imported-graph?" with
       | Some (Bool b) -> b
       | _ -> true) }

(* ---- compact/terminal result ---- *)

let compact_error_notification (n : BM.t) : Wire.t =
  Wire.kw_map
    [ ( "msg"
      , match BM.attr_value n "msg" with
        | Some (String s) -> Wire.String s
        | Some v -> Ds_wire.transit_of_value v
        | None -> Wire.Nil )
    ; ( "level"
      , match BM.attr_value n "level" with
        | Some (Keyword s) | Some (String s) -> Wire.Keyword s
        | _ -> Wire.Nil ) ]

let compact_import_result (result : BM.t) (notifications : BM.t list)
    (validation : Wire.t) : Wire.t =
  let import_state =
    match BM.attr_value result "import-state" with
    | Some (Map kvs) ->
      List.filter_map
        (fun (k, v) ->
          match k with Keyword s | String s -> Some (s, v) | _ -> None)
        kvs
    | _ -> []
  in
  let files =
    match BM.attr_value result "files" with
    | Some (Vector fs) -> fs
    | _ -> []
  in
  let deref_key k =
    match List.find_opt (fun (a, _) -> a = k) import_state with
    | Some (_, Vector vs) -> vs
    | _ -> []
  in
  let ignored_files = deref_key "ignored-files" in
  let ignored_assets = deref_key "ignored-assets" in
  let ignored_props = deref_key "ignored-properties" in
  let validation_errors =
    match Wire.get "errors" validation with
    | Some (Wire.Array errs) -> errs
    | _ -> []
  in
  let error_notifications =
    List.filter
      (fun (n : BM.t) ->
        match BM.attr_value n "level" with
        | Some (Keyword "error") | Some (String "error") -> true
        | _ -> false)
      notifications
  in
  (if ignored_files <> [] then
     Worker_log.error "import-ignored-files"
       [ ("count", string_of_int (List.length ignored_files)) ]);
  (if ignored_assets <> [] then
     Worker_log.error "import-ignored-assets"
       [ ("count", string_of_int (List.length ignored_assets)) ]);
  (if ignored_props <> [] then
     Worker_log.error "import-ignored-properties"
       [ ("count", string_of_int (List.length ignored_props)) ]);
  (if validation_errors <> [] then
     Worker_log.error "import-validation-errors"
       [ ("count", string_of_int (List.length validation_errors)) ]);
  let org_file_count =
    List.length
      (List.filter
         (fun (f : value) ->
           match f with
           | Map _ ->
             let m =
               match f with
               | Map kvs ->
                 List.filter_map
                   (fun (k, v) ->
                     match k with
                     | Keyword s | String s -> Some (s, v)
                     | _ -> None)
                   kvs
               | _ -> []
             in
             (match BM.attr_value m "path" with
              | Some (String p) -> Common_path.file_ext p = "org"
              | _ -> false)
           | _ -> false)
         files)
  in
  Wire.kw_map
    [ ("org-file-count", Wire.Int org_file_count)
    ; ("ignored-files-count", Wire.Int (List.length ignored_files))
    ; ("ignored-assets-count", Wire.Int (List.length ignored_assets))
    ; ("ignored-properties-count", Wire.Int (List.length ignored_props))
    ; ("validation-error-count", Wire.Int (List.length validation_errors))
    ; ( "notifications"
      , Wire.Array
          (List.map compact_error_notification error_notifications) ) ]

let import_issue_count (compact : (string * Wire.t) list) : int =
  List.fold_left
    (fun acc (k, v) ->
      match k, v with
      | ( "ignored-files-count" | "ignored-assets-count"
        | "ignored-properties-count" | "validation-error-count" )
      , Wire.Int n ->
        acc + n
      | _ -> acc)
    0 compact

(* terminal-import-result — keep transit-safe: counts + notifications only *)
let terminal_import_result (run_id : string) (compact : Wire.t) : Wire.t =
  let kvs =
    match compact with
    | Wire.Map kvs ->
      List.filter_map
        (fun (k, v) -> match k with Wire.Keyword s -> Some (s, v) | _ -> None)
        kvs
    | _ -> []
  in
  let issue_count = import_issue_count kvs in
  let validation_error_count =
    match
      List.find_opt
        (fun (k, _) -> k = "validation-error-count") kvs
    with
    | Some (_, Wire.Int n) -> n
    | _ -> 0
  in
  Wire.kw_map
    (kvs
     @ [ ("run-id", Wire.String run_id)
       ; ( "status"
         , kw
             (if issue_count > 0 then "completed-with-errors"
              else "completed") )
       ; ("persisted?", Wire.Bool true)
       ; ( "validation"
         , Wire.kw_map
             [ ( "status"
               , kw
                   (if validation_error_count > 0 then "failed"
                    else "passed") )
             ; ("error-count", Wire.Int validation_error_count) ] )
       ; ("issue-count", Wire.Int issue_count) ])

(* ---- <import-file-graph! ---- *)

let import_file_graph (args : Wire.t list) : Wire.t Eff.t =
  match args with
  | Wire.String repo :: config_file_t :: files_t :: opts_t :: _ ->
    (match Worker_state.datascript_conn repo with
     | None -> Eff.pure Wire.nil
     | Some conn ->
       let run_id = Uuid_gen.uuid () in
       let notifications = ref [] in
       let config_file = wire_bm config_file_t in
       let files =
         match files_t with
         | Wire.Array fs | Wire.List fs -> List.map wire_bm fs
         | Wire.Nil -> []
         | _ -> []
       in
       let opts = wire_bm opts_t in
       let options = options_of_opts repo opts notifications in
       Gp_exporter.export_file_graph conn conn config_file files options
       >>= fun result ->
       set_import_ui_state [ "graph/importing-state"; "step" ]
         (Keyword "validating");
       set_import_ui_state [ "graph/importing-state"; "label" ]
         (Keyword "import/validating-graph");
       set_import_ui_state [ "graph/importing-state"; "current-page" ]
         Nil;
       let validation = Worker_db_validate.validate_db ~fix:false conn in
       Eff.pure
         (terminal_import_result run_id
            (compact_import_result result (List.rev !notifications)
               validation)))
  | _ -> invalid_arg "import-file-graph expects (repo config-file files opts)"

let () =
  Dispatcher.register "thread-api/import-file-graph" import_file_graph
