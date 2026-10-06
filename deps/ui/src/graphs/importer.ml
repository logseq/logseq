(* Import dialog body (.importer) — five labeled file inputs matching
   components/imports.cljs; each selection asks for a graph name via the
   generic prompt dialog (#modal-headline + .form-input + Submit) then
   runs the matching thread-api import endpoint. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
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

let run_files kind files =
  match (kind, files) with
  | "import-sqlite-db", f :: _ ->
      ask_name_and_run "SQLite DB" (fun repo -> import_sqlite_db repo f)
  | "import-db-edn", f :: _ ->
      ask_name_and_run "EDN" (fun repo -> import_edn repo f)
  | "import-file-graph", _ :: _ ->
      ask_name_and_run "file graph" (fun repo ->
          import_file_graph repo files)
  | "import-sqlite-zip", _ :: _ | "import-debug-transit", _ :: _ ->
      (* zip/transit unpacking isn't wired to a worker endpoint yet *)
      Toast.warning (T.import_unsupported kind)
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
  dom ~key:id ~tag:"label"
    ~style_class:"action-input"
    [ box ~key:(id ^ "-ic") ~style_class:"as-flex-center"
        [ icon ~key:(id ^ "-ico") ~name:(`app "logseq-logo")
            ~point_size:28 [] ]
    ; column ~key:(id ^ "-t")
        ~style_class:"ls-imp-field"
        [ text ~key:(id ^ "-s") ~as_:`Strong ~value:label []
        ; text ~key:(id ^ "-d") ~as_:`Small ~value:desc [] ]
    ; dom ~key:(id ^ "-i") ~tag:"input"
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
