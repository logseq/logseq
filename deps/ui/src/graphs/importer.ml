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
let ask_name_and_run label run =
  Dialogs_state.prompt ~title:(T.t "import/set-graph-name-label") ~on_submit:(fun name ->
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
               (fun _e ->
                  Toast.error (T.t "import/import-error");
                  Js.Promise.resolve false)
               (run repo))
          in
          if ok then finish_import repo label;
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

let file_item (f : Ui_services.file) =
  let* text = promise_of (f.Ui_services.file_text ()) in
  Js.Promise.resolve
    (Wire.Map
       [ (Wire.kw "path", Wire.String f.Ui_services.file_name)
       ; (Wire.kw "content", Wire.String text)
       ])

let import_file_graph repo files =
  match files with
  | config :: rest ->
      let* files_w = Js.Promise.all (Array.of_list (List.map file_item rest)) in
      let* cfg = promise_of (config.Ui_services.file_text ()) in
        let* _ =
        Runtime.invoke "thread-api/import-file-graph"
          [ Wire.String repo
          ; Wire.Map
              [ ( Wire.kw "path"
                , Wire.String "logseq/config.edn" )
              ; (Wire.kw "content", Wire.String cfg)
              ]
          ; Wire.Array (Array.to_list files_w)
          ; Wire.Map []
          ]
      in
      Js.Promise.resolve true
  | [] -> Js.Promise.resolve false

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
      ask_name_and_run "file graph" (fun repo ->
          import_file_graph repo files)
  | "import-sqlite-zip", f :: _ ->
      ask_name_and_run "SQLite DB + assets" (fun repo ->
          import_sqlite_zip repo f)
  | "import-debug-transit", f :: _ ->
      ask_name_and_run "debug transit" (fun repo ->
          import_debug_transit repo f)
  | _ -> ()

(* Import actions use the shared file service on both hosts. *)
let file_input ~id ~label ~desc ~accept ?(directory=false) () =
  Ui_components.with_props
    [ Ui_components.Prop.opacity 0.8; Ui_components.Prop.hover_opacity 1.
    ; Ui_components.Prop.pressed_opacity 0.5; Ui_components.Prop.cursor `pointer
    ; Ui_components.Prop.hover_background "var(--lx-gray-06, var(--ls-quaternary-background-color, var(--rx-gray-06)))"
    ; Ui_components.Prop.hover_foreground "inherit"; Ui_components.Prop.white_space `normal ]
    (button ~key:id ~accessibility_identifier:id ~label ~variant:`ghost ~text_alignment:`start
       ~on_press:(fun _ ->
       Ui_services.files_pick_files ~accept ~directory (run_files id))
         ~main:`start ~cross:`center ~gap:0 ~padding:0 ~border_width:0
         ~height:62 ~min_height:62 ~margin_horizontal:8 ~margin_top:8 ~margin_bottom:10
         ~corner_radius:12 ~foreground:"inherit"
         ~background:"var(--lx-gray-06, var(--ls-quaternary-background-color, var(--rx-gray-06)))"
         [ box ~key:(id ^ "-icon") ~width:62 ~height:62 ~padding:16
             ~main:`center ~cross:`center
             [ icon ~key:(id ^ "-logo") ~name:(`app "logseq-logo") ~point_size:28 [] ]
         ; column ~key:(id ^ "-text") ~min_width:0
             [ text ~key:(id ^ "-title") ~as_:`Strong ~font_size:"1.125rem"
                 ~font_weight:700 ~line_height:"1.6875rem" ~value:label []
             ; text ~key:(id ^ "-description") ~as_:`Small ~font_size:"0.6875rem"
                 ~font_weight:400 ~line_height:"1.03125rem" ~value:desc [] ] ])

let items () =
  [ file_input ~id:"import-sqlite-db" ~label:"SQLite"
      ~desc:(T.t "onboarding.import/sqlite-desc") ~accept:".sqlite,.sqlite3,.db" ()
  ; file_input ~id:"import-sqlite-zip" ~label:(T.t "import/sqlite-and-assets-title")
      ~desc:(T.t "import/sqlite-and-assets-desc") ~accept:".zip" ()
  ; file_input ~id:"import-file-graph" ~label:(T.t "import/file-to-db-title")
      ~desc:(T.t "import/file-to-db-desc")
      ~accept:".edn,.json,.md,.org,.png,.jpg,.jpeg,.zip" ~directory:true ()
  ; file_input ~id:"import-debug-transit"
      ~label:(T.t "import/debug-transit-title") ~desc:(T.t "import/debug-transit-desc")
      ~accept:".transit,.json" ()
  ; file_input ~id:"import-db-edn" ~label:(T.t "import/db-edn-title")
      ~desc:(T.t "import/db-edn-desc") ~accept:".edn" () ]

let article () =
  column ~key:"import" ~accessibility_identifier:"import-options"
    ~padding_vertical:64 ~padding_horizontal:32 ~corner_radius:20 ~cross:`stretch
    ~background:"var(--lx-gray-03, var(--ls-tertiary-background-color, var(--rx-gray-03)))"
    [ column ~key:"intro" ~cross:`stretch
        [ heading ~key:"question" ~level:1 ~as_:`H1 ~font_size:"1.75rem"
            ~font_weight:500 ~line_height:"1.5" ~margin:0 ~text_alignment:`center
            ~value:(T.t "onboarding.import/title") []
        ; heading ~key:"description" ~level:2 ~as_:`H2 ~font_size:"1.1875rem"
            ~font_weight:400 ~line_height:"3" ~margin:0 ~text_alignment:`center
            ~value:(T.t "onboarding.import/desc") [] ]
    ; column ~key:"choices" ~accessibility_identifier:"import-choices"
        ~padding_vertical:20 ~cross:`stretch (items ()) ]

let view () : t =
  Ui_components.with_props [Ui_components.Prop.padding_top 55]
    (column ~key:"importer" ~accessibility_identifier:"importer" ~cross:`center
        [ heading ~key:"title" ~level:1 ~as_:`H1 ~font_size:"2.25rem"
            ~font_weight:400 ~line_height:"1.4" ~margin:0 ~text_alignment:`center
            ~value:(T.t "import/notes") []
        ; heading ~key:"subtitle" ~level:2 ~as_:`H2 ~font_size:"1.25rem"
            ~font_weight:400 ~line_height:"1.5" ~margin_top:20 ~margin_bottom:40
            ~text_alignment:`center ~value:(T.t "onboarding.import-option/desc") []
        ; article () ])

let body (_ms : Model.t Signal.signal) : t = article ()
