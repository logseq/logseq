(* Import dialog body (.importer) — five labeled file inputs matching
   components/imports.cljs; each selection asks for a graph name via the
   generic prompt dialog (#modal-headline + .form-input + Submit) then
   runs the matching thread-api import endpoint. *)

open Promise_ext
open Lui_elements

module T = I18n

(* Ui_services file reads return Ui_task; the import flows stay
   promise-chained — bridge at the call site *)
let promise_of = Subs_state.promise_of_task

let finish_import repo label =
  let short = Graphs_ops.short_name repo in
  Toast.success (T.import_finished label short);
  Ui_services.timers_later ~ms:4000 (fun () ->
      ignore (Graphs_ops.refresh ());
      ignore (Graphs_ops.navigate_journal repo))

(* name prompt -> validate -> run import; `run` resolves true only when
   the import actually landed (it may toast a local error itself) *)
let ask_name_and_run ?(restored=false) label run =
  Dialogs_state.prompt ~title:(T.t "import/new-graph-name") ~on_submit:(fun name ->
      let name = String.trim name in
      if name = "" then Toast.warning (T.t "import/empty-graph-name")
      else if Graphs_ops.invalid_chars name <> [] then
        Toast.warning (Printf.sprintf "%s \"%s\"" (T.t "graph.validation/name-invalid") name)
      else if Graphs_ops.already_exists name then
        Toast.error (T.already_exists name)
      else (
        Dialogs_state.close_prompt ();
        let repo = Graph.full_graph_name name in
        ignore
          (let* ok =
            (Js.Promise.catch
               (fun e ->
                  Ui_services.log_error ("Import failed", e);
                  Toast.error (T.t "import/import-error");
                  Js.Promise.resolve false)
               (run repo))
          in
          if ok then
            if restored then Toast.success (T.import_finished label (Graphs_ops.short_name repo))
            else finish_import repo label;
          Js.Promise.resolve ())))
  ()

let import_sqlite_db repo (file : Ui_services.file) =
  let* buf = promise_of (file.Ui_services.file_binary ()) in
  let* _ =
    (Runtime.invoke2 "thread-api/import-db-binary"
       (Wire.String repo)
       (Wire.Binary buf))
  in
  Js.Promise.resolve true

let import_edn repo (file : Ui_services.file) =
  let* text = promise_of (file.Ui_services.file_text ()) in
  match (try Some (Edn.parse text) with _ -> None) with
  | None ->
      Toast.warning (T.t "import/invalid-edn-file");
      Js.Promise.resolve false
  | Some w ->
      let* _ =
        (Runtime.invoke2 "thread-api/import-edn"
           (Wire.String repo) w)
      in
      Js.Promise.resolve true

let import_error message =
  Ui_services.log_error_message ("directory import: " ^ message);
  failwith message

let import_path (file : Ui_services.file) =
  match file.file_relative_path with
  | Some path
    when not (String.contains path '\\')
         && not (String.length path > 1 && path.[1] = ':')
         && List.for_all (fun part -> part <> "" && part <> "." && part <> "..")
              (String.split_on_char '/' path) -> path
  | _ -> import_error "Directory import requires a selected-root-relative file path"

let is_import_asset path = String.starts_with ~prefix:"assets/" path

let ignored_import_path path =
  if is_import_asset path then false
  else
    let rec ignored_parts = function
      | [] -> false
      | part :: rest ->
          String.starts_with ~prefix:"." part || part = "node_modules"
          || (part = "logseq"
              && match rest with
                 | ("bak" | "version-files" | "graphs-txid.edn") :: _ -> true
                 | _ -> false)
          || ignored_parts rest
    in
    ignored_parts (String.split_on_char '/' path)
    || let extension = String.lowercase_ascii (Filename.extension path) in
       extension <> ""
       && not (List.mem extension [ ".md"; ".markdown"; ".org"; ".js"; ".edn"; ".css" ])

let file_item (path, (file : Ui_services.file)) =
  let asset = is_import_asset path in
  let read = if asset then file.file_binary else file.file_text in
  let* content =
    promise_of
      (Ui_task.catch (read ()) (fun error ->
           Ui_services.log_error_message
             ("directory import read " ^ path ^ ": " ^ Printexc.to_string error);
           Ui_task.reject error))
  in
  let modified =
    match file.file_last_modified with
    | None -> []
    | Some ms ->
        let time = Wire.Date_ms (Int64.of_float ms) in
        [ Wire.kw "last-modified-at", time; Wire.kw "file-updated-at", time ]
  in
  let payload =
    if asset then
      [ Wire.kw "asset/payload", Wire.Binary content
      ; Wire.kw "asset/size", Wire.Int (String.length content) ]
    else [ Wire.kw "file/content", Wire.String content ]
  in
  Js.Promise.resolve (Wire.Map ((Wire.kw "path", Wire.String path) :: modified @ payload))

let import_completed result =
  Wire.get result "status" = Some (Wire.Keyword "completed")
  && Wire.get result "persisted?" = Some (Wire.Bool true)
  && Wire.map_get_int result "issue-count" = Some 0
  && match Wire.get result "validation" with
     | Some validation ->
         Wire.get validation "status" = Some (Wire.Keyword "passed")
         && Wire.map_get_int validation "error-count" = Some 0
     | None -> false

let import_file_graph repo files =
  let previous_repo = (Runtime.model ()).Model.repo in
  let attaching = ref false in
  let stage = ref "prepare files" in
  let run =
    let* () = Js.Promise.resolve () in
    let seen = Hashtbl.create (List.length files) in
    let files =
      List.filter_map (fun file ->
          let path = import_path file in
          if ignored_import_path path then None
          else if Hashtbl.mem seen path then import_error ("Duplicate import file: " ^ path)
          else begin
            Hashtbl.add seen path ();
            Some (path, file)
          end) files
    in
    match List.partition (fun (path, _) -> path = "logseq/config.edn") files with
    | [ config ], rest ->
        stage := "read config";
        let* config = file_item config in
        let rec read_files acc = function
          | [] -> Js.Promise.resolve (List.rev acc)
          | ((path, _) as file) :: rest ->
              stage := "read " ^ path;
              let* item = file_item file in
              read_files (item :: acc) rest
        in
        let* files = read_files [] rest in
        stage := "check graph name";
        let* repos = Graph.list_graphs () in
        if List.mem repo repos then import_error "Target graph already exists";
        stage := "create graph";
        attaching := true;
        let* _ = Graph.create_graph (Graphs_ops.short_name repo) in
        stage := "import worker files";
        let* result =
          Runtime.invoke "thread-api/import-file-graph"
            [ Wire.String repo; config; Wire.Array files; Wire.Map [] ]
        in
        if not (import_completed result) then begin
          let status map =
            match Option.bind (Wire.get map "status") Wire.as_keyword with
            | Some status -> status
            | None -> "missing"
          in
          Ui_services.log_error_message
            (Printf.sprintf "directory import terminal: status=%s persisted=%b issues=%s validation=%s"
               (status result) (Wire.get result "persisted?" = Some (Wire.Bool true))
               (match Wire.map_get_int result "issue-count" with
                | Some n -> string_of_int n | None -> "missing")
               (match Wire.get result "validation" with
                | Some validation -> status validation | None -> "missing"));
          import_error "Directory import did not complete without errors"
        end;
        stage := "restore imported graph";
        let* _ = Graphs_ops.refresh () in
        let* () = Graphs_ops.navigate_journal repo in
        Js.Promise.resolve true
    | _ ->
        Toast.error (T.t "import/logseq-config-missing");
        Js.Promise.resolve false
  in
  run |> Js.Promise.catch (fun _error ->
      Ui_services.log_error_message ("directory import failed during " ^ !stage);
      Toast.error (T.t "import/import-error");
      if !attaching then
        match previous_repo with
        | Some previous ->
            let* config = Graph.open_graph previous in
            Runtime.send (Action.Boot_graph_ready (previous, config));
            Js.Promise.resolve false
        | None -> Js.Promise.resolve false
      else Js.Promise.resolve false)

(* cljs import.cljs zip helpers: entry names lowercase with "+" as "/";
   the db is the shortest path ending in "db.sqlite", assets are any
   file under an assets/ dir *)
let zip_norm name =
  String.lowercase_ascii (Str_util.replace_all name ~pat:"+" ~rep:"/")

let sqlite_zip_entry (es : Zip.zip_entry list) =
  let cands =
    List.filter
      (fun e -> Str_util.ends_with (zip_norm e.Zip.e_name) "db.sqlite")
      es
  in
  match
    List.sort
      (fun a b -> compare (String.length a.Zip.e_name) (String.length b.Zip.e_name))
      cands
  with
  | e :: _ -> Some e
  | [] -> None

let asset_zip_entry (e : Zip.zip_entry) =
  let n = zip_norm e.Zip.e_name in
  Str_util.starts_with n "assets/" || Str_util.contains n "/assets/"

(* cljs asset-file-name: basename under the assets/ dir *)
let asset_zip_file_name name =
  let n = Str_util.replace_all name ~pat:"+" ~rep:"/" in
  let rel =
    match Str_util.index_of (String.lowercase_ascii n) "/assets/" with
    | Some i -> String.sub n (i + 8) (String.length n - (i + 8))
    | None ->
        (if Str_util.starts_with n "assets/"
         then String.sub n 7 (String.length n - 7)
         else n)
  in
  Filename.basename rel

(* STORE passes through; DEFLATE inflates via DecompressionStream *)
let zip_entry_data buf (e : Zip.zip_entry) : string Js.Promise.t =
  let raw = Zip.raw_data buf e in
  if e.Zip.e_method = 0 then Js.Promise.resolve raw
  else if e.Zip.e_method = 8 then
    promise_of (Ui_services.files_inflate_raw raw)
  else
    Js.Promise.reject
      (Failure ("unsupported zip method " ^ string_of_int e.Zip.e_method))

let rec copy_zip_assets repo buf assets copied failed =
  match assets with
  | [] -> Js.Promise.resolve (copied, List.rev failed)
  | e :: rest -> (
      let name = asset_zip_file_name e.Zip.e_name in
      if name = "" then copy_zip_assets repo buf rest copied failed
      else
        let* data =
          zip_entry_data buf e
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve "")
        in
        if data = "" then
          copy_zip_assets repo buf rest copied (name :: failed)
        else
          let* () =
            Asset_store.write_asset ~repo ~name ~u8:(Str_util.binary_to_u8 data)
          in
          copy_zip_assets repo buf rest (copied + 1) failed)

(* cljs <import-from-sqlite-zip!: unzip, import the db.sqlite entry via
   import-db-binary, then copy every assets/ file into the repo *)
let import_sqlite_zip repo (file : Ui_services.file) =
  let* buf = promise_of (file.Ui_services.file_binary ()) in
  let es = Zip.entries buf in
  match sqlite_zip_entry es with
  | None ->
      Toast.warning (T.t "import/zip-missing-db-sqlite");
      Js.Promise.resolve false
  | Some entry -> (
      let* sqlite = zip_entry_data buf entry in
      let* _ =
        Runtime.invoke2 "thread-api/import-db-binary" (Wire.String repo)
          (Wire.Binary sqlite)
      in
      let assets = List.filter asset_zip_entry es in
      let* copied, failed = copy_zip_assets repo buf assets 0 [] in
      if copied > 0 then Toast.success (T.import_assets_imported copied);
      if failed <> [] then
        Toast.warning (T.import_assets_skipped (List.length failed));
      let total = List.length assets in
      if total > 0 && total <> copied + List.length failed then
        Toast.warning (T.import_assets_partial copied total);
      Js.Promise.resolve true)

(* cljs <import-from-debug-transit!: create the graph with the raw
   transit payload as an open opt — the worker bootstrap-transacts the
   decoded datoms instead of seed data *)
let import_debug_transit repo (file : Ui_services.file) =
  let* raw = promise_of (file.Ui_services.file_text ()) in
  let* _ =
    Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
      (Wire.Map
         [ (Wire.kw "import-type", Wire.Keyword "debug-transit")
         ; (Wire.kw "debug-transit-raw", Wire.String raw) ])
  in
  Js.Promise.resolve true

let run_files kind files =
  match (kind, files) with
  | "import-sqlite-db", f :: _ ->
      ask_name_and_run "SQLite DB" (fun repo -> import_sqlite_db repo f)
  | "import-db-edn", f :: _ ->
      ask_name_and_run "EDN" (fun repo -> import_edn repo f)
  | "import-file-graph", _ :: _ ->
      ask_name_and_run ~restored:true "file graph" (fun repo ->
          import_file_graph repo files)
  | "import-sqlite-zip", f :: _ ->
      ask_name_and_run "SQLite DB + assets" (fun repo ->
          import_sqlite_zip repo f)
  | "import-debug-transit", f :: _ ->
      ask_name_and_run "debug transit" (fun repo ->
          import_debug_transit repo f)
  | _ -> ()

(* Import actions use the shared file service on both hosts. *)
let file_input viewport ~id ~label ~desc ~accept ?(directory=false) ?(first=false) () =
  Ui_parts.int_prop Lui_protocol.HeightValue
    ~value:(reactive (fun width -> if width<768. then 80 else 62) viewport)
    (Ui_parts.int_prop Lui_protocol.MarginTop
      ~value:(reactive (fun width -> if width>=768. || first then 8 else 0) viewport)
      (Ui_components.with_props
    [ Ui_components.Prop.opacity 0.8; Ui_components.Prop.hover_opacity 1.
    ; Ui_components.Prop.pressed_opacity 0.5; Ui_components.Prop.cursor `pointer
    ; Ui_components.Prop.hover_background "var(--lx-gray-06, var(--ls-quaternary-background-color, var(--rx-gray-06)))"
    ; Ui_components.Prop.hover_foreground "inherit"; Ui_components.Prop.white_space `normal ]
    (button ~key:id ~accessibility_identifier:id ~label ~variant:`ghost ~text_alignment:`start
       ~on_press:(fun _ ->
       Ui_services.files_pick_files ~accept ~directory (run_files id))
         ~main:`start ~cross:`center ~gap:0 ~padding:0 ~border_width:0
         ~min_height:62 ~margin_horizontal:8 ~margin_bottom:10
         ~corner_radius:12 ~foreground:"inherit"
         ~background:"var(--lx-gray-06, var(--ls-quaternary-background-color, var(--rx-gray-06)))"
         [ box ~key:(id ^ "-icon") ~width:62 ~min_width:62 ~height:62 ~padding:16
             ~main:`center ~cross:`center
             [ icon ~key:(id ^ "-logo") ~name:(`app "logseq-logo") ~point_size:28 [] ]
         ; column ~key:(id ^ "-text") ~min_width:0
             [ text ~key:(id ^ "-title") ~as_:`Strong ~font_size:"1.125rem"
                 ~font_weight:700 ~line_height:"1.6875rem" ~value:label []
             ; text ~key:(id ^ "-description") ~as_:`Small ~font_size:"0.6875rem"
                 ~font_weight:400 ~line_height:"1.03125rem" ~value:desc [] ] ])))

let items viewport =
  [ file_input viewport ~first:true ~id:"import-sqlite-db" ~label:"SQLite"
      ~desc:(T.t "onboarding.import/sqlite-desc") ~accept:".sqlite,.sqlite3,.db" ()
  ; file_input viewport ~id:"import-sqlite-zip" ~label:(T.t "import/sqlite-and-assets-title")
      ~desc:(T.t "import/sqlite-and-assets-desc") ~accept:".zip" ()
  ; file_input viewport ~id:"import-file-graph" ~label:(T.t "import/file-to-db-title")
      ~desc:(T.t "import/file-to-db-desc")
      ~accept:".edn,.json,.md,.org,.png,.jpg,.jpeg,.zip" ~directory:true ()
  ; file_input viewport ~id:"import-debug-transit"
      ~label:(T.t "import/debug-transit-title") ~desc:(T.t "import/debug-transit-desc")
      ~accept:".transit,.json" ()
  ; file_input viewport ~id:"import-db-edn" ~label:(T.t "import/db-edn-title")
      ~desc:(T.t "import/db-edn-desc") ~accept:".edn" () ]

let desktop_font viewport large compact element =
  Ui_parts.string_prop Lui_protocol.FontSize
    ~value:(reactive (fun width -> if width>=1024. then large else compact) viewport) element

let article viewport =
  column ~key:"import" ~accessibility_identifier:"import-options"
    ~padding_vertical:64 ~padding_horizontal:32 ~corner_radius:20 ~cross:`stretch
    ~background:"var(--lx-gray-03, var(--ls-tertiary-background-color, var(--rx-gray-03)))"
    [ Ui_parts.int_prop Lui_protocol.PaddingHorizontal
        ~value:(reactive (fun width -> if width>=1024. then 0 else 30) viewport)
        (column ~key:"intro" ~cross:`stretch
          [ desktop_font viewport "1.75rem" "1.625rem"
              (heading ~key:"question" ~level:1 ~as_:`H1
                ~font_weight:500 ~line_height:"1.5" ~margin:0 ~text_alignment:`center
                ~value:(T.t "onboarding.import/title") [])
          ; Ui_parts.string_prop Lui_protocol.LineHeight
              ~value:(reactive (fun width -> if width>=1024. then "3" else "1.5") viewport)
              (Ui_parts.int_prop Lui_protocol.PaddingVertical
                ~value:(reactive (fun width -> if width>=1024. then 0 else 15) viewport)
                (desktop_font viewport "1.1875rem" "0.875rem"
                  (heading ~key:"description" ~level:2 ~as_:`H2
                    ~font_weight:400 ~margin:0 ~text_alignment:`center
                    ~value:(T.t "onboarding.import/desc") []))) ])
    ; column ~key:"choices" ~accessibility_identifier:"import-choices"
        ~padding_vertical:20 ~cross:`stretch (items viewport) ]

let view () : t =
 fun ctx parent ->
  let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  Ui_components.with_props [Ui_components.Prop.padding_top 55]
    (column ~key:"importer" ~accessibility_identifier:"importer" ~cross:`center
        [ desktop_font viewport "2.25rem" "1.875rem"
            (heading ~key:"title" ~level:1 ~as_:`H1
              ~font_weight:400 ~line_height:"1.4" ~margin:0 ~text_alignment:`start
              ~value:(T.t "import/notes") [])
        ; Ui_parts.int_prop Lui_protocol.PaddingHorizontal
            ~value:(reactive (fun width -> if width>=1024. then 0 else 30) viewport)
            (desktop_font viewport "1.25rem" "0.875rem"
              (heading ~key:"subtitle" ~level:2 ~as_:`H2
                ~font_weight:400 ~line_height:"1.5" ~margin_top:20 ~margin_bottom:40
                ~text_alignment:`center ~value:(T.t "onboarding.import-option/desc") []))
        ; article viewport ]) ctx parent

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  article viewport ctx parent
