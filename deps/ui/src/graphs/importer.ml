(* Import dialog body (.importer) — five labeled file inputs matching
   components/imports.cljs; each selection asks for a graph name via the
   generic prompt dialog (#modal-headline + .form-input + Submit) then
   runs the matching thread-api import endpoint. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module T = I18n
module B = Browser_ui

let finish_import repo label =
  let short = Graphs_ops.short_name repo in
  Toast.success (T.import_finished label short);
  B.later ~ms:4000 (fun () ->
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
  let* buf = file |> B.file_buffer in
  let* _ =
    (Runtime.invoke2 "thread-api/import-db-binary"
       (Wire.String repo)
       (Wire.Binary (B.u8_of_buffer buf)))
  in
  Js.Promise.resolve true

let import_edn repo file =
  let* text = file |> B.file_text in
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
  let* text = f |> B.file_text in
  Js.Promise.resolve
    (Wire.Map
       [ (Wire.kw "path", Wire.String (B.file_name f))
       ; (Wire.kw "content", Wire.String text)
       ])

let import_file_graph repo files =
  match files with
  | config :: rest ->
      let* files_w = Js.Promise.all (Array.of_list (List.map file_item rest)) in
      let* cfg = (B.file_text config) in
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
  match B.qs ("#" ^ id) with
  | Some el -> (
      match Array.to_list (B.files_of el) with
      | [] -> ()
      | files -> run_files id files)
  | None -> ()

(* svg/logo 28 — three hard-coded ellipses from components/svg.cljs *)
let logo_svg () =
  let ellipse transform rx ry =
    dom ~tag:"ellipse"
      ~attrs:
        [ ("transform", transform); ("rx", rx); ("ry", ry) ]
      []
  in
  dom ~tag:"svg"
    ~attrs:
      [ ("fill", "currentColor"); ("viewBox", "0 0 21 21")
      ; ("height", "28"); ("width", "28") ]
    [ ellipse "matrix(0.987073 0.160274 -0.239143 0.970984 11.7346 2.59206)"
        "3.29236" "2.04373"
    ; ellipse "matrix(-0.495846 0.868411 -0.825718 -0.564084 3.97209 5.54515)"
        "2.95326" "3.37606"
    ; ellipse "matrix(0.987073 0.160274 -0.239143 0.970984 13.0843 14.72)"
        "7.78547" "6.13006"
    ]

let file_input ~id ~label ~desc ~accept ?(extra_attrs = []) () =
  dom ~key:id ~tag:"label"
    ~style_class:"action-input"
    ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then
        (* native hosts route the pick through their own file dialog —
           in the browser the label-for-input click opens it natively *)
        B.pick_files ~accept
          ~directory:
            (List.exists
               (fun (k, _) -> k = "webkitdirectory")
               extra_attrs)
          ~on_picked:(fun () -> on_change id ())
          id)
    [ dom ~key:(id ^ "-ic") ~style_class:"as-flex-center"
        [ dom ~key:(id ^ "-ico") ~tag:"i" [ logo_svg () ] ]
    ; dom ~key:(id ^ "-t")
        ~style_class:"ls-imp-field"
        [ dom ~key:(id ^ "-s") ~tag:"strong" ~text:label []
        ; dom ~key:(id ^ "-d") ~tag:"small" ~text:desc [] ]
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
  dom ~key:"import" ~tag:"article"
    ~style_class:"importer"
    [ dom ~key:"imp-c" ~style_class:"c text-center"
        [ dom ~key:"imp-h" ~tag:"h1" ~text:T.import_title []
        ; dom ~key:"imp-d" ~tag:"h2" ~text:T.import_desc [] ]
    ; dom ~key:"imp-l" ~style_class:"d" (items ()) ]

(* route view — cljs setups/setups-container :importer wraps the article in
   .cp__onboarding-setups > .inner-card with a title/subtitle header *)
let view () : t =
  dom ~key:"importer" ~style_class:"cp__onboarding-setups"
    [ dom ~key:"imp-card"
        ~style_class:"inner-card"
        [ dom ~key:"imp-th" ~tag:"h1" ~style_class:"ls-imp-title"
            [ dom ~key:"imp-ts" ~tag:"span"
                ~text:T.import_existing_notes [] ]
        ; dom ~key:"imp-td" ~tag:"h2" ~text:T.import_later []
        ; article () ]
    ]

let body (_ms : Model.t Signal.signal) : t = article ()
