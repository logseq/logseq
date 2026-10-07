(* Import dialog body (.importer) — five labeled file inputs matching
   components/imports.cljs; each selection asks for a graph name via the
   generic prompt dialog (#modal-headline + .form-input + Submit) then
   runs the matching thread-api import endpoint. *)

open Promise_ext
open Lui_elements

let dom = Logseq_el.el
module T = I18n
let finish_import repo label =
  let short = Graphs_ops.short_name repo in
  Toast.success (T.import_finished label short);
  Web_dom.later ~ms:4000 (fun () ->
      ignore (Graphs_ops.refresh ());
      ignore (Graphs_ops.navigate_journal repo))

(* name prompt -> validate -> run import; `run` resolves true only when
   the import actually landed (it may toast a local error itself) *)
let ask_name_and_run label run =
  Dialogs_state.prompt ~title:T.set_graph_name ~on_submit:(fun name ->
      let name = String.trim name in
      if name = "" then Toast.warning T.import_empty_name
      else if Graphs_ops.invalid_chars name <> [] then
        Toast.warning (Printf.sprintf "%s \"%s\"" T.invalid_name name)
      else if Graphs_ops.already_exists name then
        Toast.error (T.already_exists name)
      else (
        Dialogs_state.close_prompt ();
        let repo = Graph.full_graph_name name in
        ignore
          (let* ok =
            (Js.Promise.catch
               (fun _e ->
                  Toast.error T.import_failed;
                  Js.Promise.resolve false)
               (run repo))
          in
          if ok then finish_import repo label;
          Js.Promise.resolve ())))
  ()

let import_sqlite_db repo file =
  let* buf = file |> Web_dom.file_buffer in
  let* _ =
    (Runtime.invoke2 "thread-api/import-db-binary"
       (Wire.String repo)
       (Wire.Binary (Web_dom.u8_of_buffer buf)))
  in
  Js.Promise.resolve true

let import_edn repo file =
  let* text = file |> Web_dom.file_text in
  match (try Some (Edn.parse text) with _ -> None) with
  | None ->
      Toast.warning T.import_invalid_edn;
      Js.Promise.resolve false
  | Some w ->
      let* _ =
        (Runtime.invoke2 "thread-api/import-edn"
           (Wire.String repo) w)
      in
      Js.Promise.resolve true

let file_item f =
  let* text = f |> Web_dom.file_text in
  Js.Promise.resolve
    (Wire.Map
       [ (Wire.kw "path", Wire.String (Web_dom.file_name f))
       ; (Wire.kw "content", Wire.String text)
       ])

let import_file_graph repo files =
  match files with
  | config :: rest ->
      let* files_w = Js.Promise.all (Array.of_list (List.map file_item rest)) in
      let* cfg = (Web_dom.file_text config) in
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
  else if e.Zip.e_method = 8 then Web_dom.inflate_raw raw
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
            Asset_store.write_asset ~repo ~name ~u8:(Web_dom.binary_to_u8 data)
          in
          copy_zip_assets repo buf rest (copied + 1) failed)

(* cljs <import-from-sqlite-zip!: unzip, import the db.sqlite entry via
   import-db-binary, then copy every assets/ file into the repo *)
let import_sqlite_zip repo file =
  let* buf = file |> Web_dom.file_buffer in
  let buf = Web_dom.u8_of_buffer buf in
  let es = Zip.entries buf in
  match sqlite_zip_entry es with
  | None ->
      Toast.warning T.import_zip_missing_db;
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
let import_debug_transit repo file =
  let* raw = file |> Web_dom.file_text in
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

let on_change id () =
  match Web_dom.query_selector ("#" ^ id) with
  | Some el -> (
      match Array.to_list (Web_dom.el_files el) with
      | [] -> ()
      | files -> run_files id files)
  | None -> ()

(* svg/logo 28 — three hard-coded ellipses from components/svg.cljs,
   registered as the "logseq-logo" app icon in Icons.custom_icons *)

(* TODO(component): stays dom — .importer .d > label.action-input keys
   on the label tag and the nested <input type=file> click activation
   has no component equivalent: file_picker's web backend emits a bare
   `lui-file-picker` element — no Picked event, no web File objects.
   Needs a web FilePicker backend plus directory-pick support *)
let file_input ~id ~label ~desc ~accept ?(extra_attrs = []) () =
  Logseq_el.el ~key:id ~tag:"label"
    ~style_class:"action-input"
    [ box ~key:(id ^ "-ic") ~style_class:"as-flex-center"
        [ icon ~key:(id ^ "-ico") ~name:(`app "logseq-logo")
            ~point_size:28 [] ]
    ; column ~key:(id ^ "-t")
        ~style_class:"ls-imp-field"
        [ text ~key:(id ^ "-s") ~as_:`Strong ~value:label []
        ; text ~key:(id ^ "-d") ~as_:`Small ~value:desc [] ]
    ; Logseq_el.el ~key:(id ^ "-i") ~tag:"input"
        ~style_class:"ls-hidden-input"
        ~attrs:
          ([ ("id", id); ("type", "file"); ("accept", accept) ]
           @ extra_attrs)
        ~events:"change"
        ~on_dom_event:(fun n _ -> if n = "change" then on_change id ())
        []
    ]

(* cljs imports.cljs importer — sqlite / zip / file-graph / transit / edn *)
let items () =
  [ file_input ~id:"import-sqlite-db" ~label:T.import_sqlite_title
      ~desc:T.import_sqlite_desc ~accept:".sqlite,.sqlite3,.db" ()
  ; file_input ~id:"import-sqlite-zip" ~label:T.import_sqlite_zip_title
      ~desc:T.import_sqlite_zip_desc ~accept:".zip" ()
  ; file_input ~id:"import-file-graph" ~label:T.import_file_graph_title
      ~desc:T.import_file_graph_desc
      ~accept:".edn,.json,.md,.org,.png,.jpg,.jpeg,.zip"
      ~extra_attrs:[ ("webkitdirectory", "true") ]
      ()
  ; file_input ~id:"import-debug-transit"
      ~label:T.import_debug_transit_title ~desc:T.import_debug_transit_desc
      ~accept:".transit,.json" ()
  ; file_input ~id:"import-db-edn" ~label:T.import_db_edn_title
      ~desc:T.import_db_edn_desc ~accept:".edn" ()
  ]

let article () =
  column ~key:"import" ~style_class:"importer"
    [ column ~key:"imp-c" ~style_class:"c"
        [ (* .importer .c h1/h2 key on the heading tags — ~as_ retags
             the heading element so the CSS contract holds *)
          heading ~key:"imp-h" ~level:1 ~as_:`H1
            ~value:T.import_title []
        ; heading ~key:"imp-d" ~level:2 ~as_:`H2
            ~value:T.import_desc [] ]
    ; column ~key:"imp-l" ~style_class:"d" (items ()) ]

(* route view — cljs setups/setups-container :importer wraps the article in
   .cp__onboarding-setups > .inner-card with a title/subtitle header *)
let view () : t =
  column ~key:"importer" ~style_class:"cp__onboarding-setups"
    [ column ~key:"imp-card"
        ~style_class:"inner-card"
        [ (* .inner-card > h1.ls-imp-title / > h2 key on
             the heading tags — ~as_ retags the heading element *)
          heading ~key:"imp-th" ~level:1 ~as_:`H1
            ~style_class:"ls-imp-title"
            ~value:T.import_existing_notes []
        ; heading ~key:"imp-td" ~level:2 ~as_:`H2
            ~value:T.import_later []
        ; article () ]
    ]

let body (_ms : Model.t Signal.signal) : t = article ()
