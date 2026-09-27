(* Import dialog body (.importer) — five labeled file inputs matching
   components/imports.cljs; each selection asks for a graph name via the
   generic prompt dialog (#modal-headline + .form-input + Submit) then
   runs the matching thread-api import endpoint. *)

open Lui_elements

let dom = Logseq_dom.dom
module T = Graphs_text
module B = Browser_ui

let finish_import repo label =
  let short = Graphs_ops.short_name repo in
  Toast.success (T.import_finished label short);
  B.later ~ms:4000 (fun () ->
      ignore (Graphs_ops.refresh ());
      ignore (Graphs_ops.navigate_journal repo))

(* name prompt -> validate -> create repo -> run import *)
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
          (Js.Promise.then_
             (fun _ ->
                finish_import repo label;
                Js.Promise.resolve ())
             (Js.Promise.catch
                (fun _e ->
                   Toast.error T.import_failed;
                   Js.Promise.resolve Wire.Nil)
                (run repo)))))
  ()

let import_sqlite_db repo file =
  file |> B.file_buffer
  |> Js.Promise.then_ (fun buf ->
         Runtime.invoke2 "thread-api/import-db-binary"
           (Wire.String repo)
           (Wire.Binary (B.u8_of_buffer buf)))

let import_edn repo file =
  file |> B.file_text
  |> Js.Promise.then_ (fun text ->
         match (try Some (Edn.parse text) with _ -> None) with
         | None ->
             Toast.warning T.import_invalid_edn;
             Js.Promise.resolve Wire.Nil
         | Some w ->
             Runtime.invoke2 "thread-api/import-edn" (Wire.String repo)
               w)

let file_item f =
  f |> B.file_text
  |> Js.Promise.then_ (fun text ->
         Js.Promise.resolve
           (Wire.Map
              [ (Wire.kw "path", Wire.String (B.file_name f))
              ; (Wire.kw "content", Wire.String text)
              ]))

let import_file_graph repo files =
  match files with
  | config :: rest ->
      Js.Promise.all (Array.of_list (List.map file_item rest))
      |> Js.Promise.then_ (fun files_w ->
             config |> B.file_text
             |> Js.Promise.then_ (fun cfg ->
                    Runtime.invoke3 "thread-api/import-file-graph"
                      (Wire.String repo)
                      (Wire.Map
                         [ ( Wire.kw "path"
                           , Wire.String "logseq/config.edn" )
                         ; (Wire.kw "content", Wire.String cfg)
                         ])
                      (Wire.Array (Array.to_list files_w))))
  | [] -> Js.Promise.resolve Wire.Nil

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

let file_input ~id ~label ~accept =
  dom ~key:id ~style_class:"flex flex-col gap-1"
    [ dom ~key:(id ^ "-l") ~tag:"label"
        ~style_class:"text-sm font-medium" ~attrs:[ ("for", id) ]
        ~text:label []
    ; dom ~key:(id ^ "-i") ~tag:"input"
        ~attrs:
          [ ("id", id); ("type", "file"); ("accept", accept)
          ; ("class", "form-input") ]
        ~events:"change"
        ~on_dom_event:(fun n _ -> if n = "change" then on_change id ())
        []
    ]

let body (_ms : Model.t Signal.signal) : t =
  dom ~key:"import" ~style_class:"importer flex flex-col gap-4"
    [ dom ~key:"imp-h" ~tag:"h1" ~style_class:"title" ~text:T.import_title
        []
    ; file_input ~id:"import-db-edn" ~label:T.import_db_edn_title
        ~accept:".edn"
    ; file_input ~id:"import-sqlite-db" ~label:T.import_sqlite_title
        ~accept:".sqlite"
    ; file_input ~id:"import-sqlite-zip" ~label:T.import_sqlite_zip_title
        ~accept:".zip"
    ; file_input ~id:"import-file-graph" ~label:T.import_file_graph_title
        ~accept:".edn,.json,.md,.org,.png,.jpg,.jpeg,.zip"
    ; file_input ~id:"import-debug-transit"
        ~label:T.import_debug_transit_title ~accept:".transit,.json"
    ]
