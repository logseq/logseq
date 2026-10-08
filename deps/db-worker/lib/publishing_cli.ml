(* Standalone publishing uses the same SQLite storage, HTML builder and
   asset exporter as the desktop application. *)

module Eff = Db_worker_effect
let ( >>= ) = Eff.Infix.( >>= )

let require_file path =
  File_sys.exists path >>= fun exists ->
  if not exists then Eff.error (Failure ("Required publishing file missing: " ^ path))
  else File_sys.is_file path >>= fun is_file ->
    if is_file then Eff.pure ()
    else Eff.error (Failure ("Expected publishing file: " ^ path))

let repo_config db =
  match Datascript.find_datom db Datascript.Avet
    ~a:"file/path" ~v:(Datascript.String "logseq/config.edn") () with
  | None -> Datascript.Map []
  | Some d ->
      (match Datascript.find_datom db Datascript.Eavt ~e:d.e ~a:"file/content" () with
       | Some { v = Datascript.String content; _ } ->
           (match Edn_util.read_string content with
            | Datascript.Map _ as config -> config
            | _ -> invalid_arg "Graph publishing config must be an EDN map")
       | _ -> invalid_arg "Graph config content missing")

let export_site static_dir graph_dir output_dir dev =
  let db_path = Gp_node_path.join [ graph_dir; "db.sqlite" ] in
  require_file db_path >>= fun () ->
  require_file (Gp_node_path.join [ static_dir; "js"; "main.js" ]) >>= fun () ->
  let sqlite, conn = Sqlite_cli.open_sqlite_datascript db_path in
  Eff.finally
    (Eff.bind (Eff.pure ()) (fun () ->
      let db = Datascript.db conn in
      let result = Publishing_html.build_html db
        (Datascript.Map
          [ Datascript.Keyword "repo",
            Datascript.String ("logseq_db_" ^ Gp_node_path.basename graph_dir)
          ; Datascript.Keyword "repo-config", repo_config db
          ; Datascript.Keyword "app-state", Datascript.Map
              [ Datascript.Keyword "ui/theme", Datascript.String "dark"
              ; Datascript.Keyword "ui/radix-color", Datascript.Keyword "cyan" ]
          ; Datascript.Keyword "dev?", Datascript.Bool dev ]) in
      let fields = Sqlite_build.bm_of_value result in
      let html = match Sqlite_build.bm_get fields "html" with
        | Datascript.String html -> html
        | _ -> failwith "Publishing HTML missing" in
      let asset_filenames = match Sqlite_build.bm_get fields "asset-filenames" with
        | Datascript.Vector assets -> List.map (function
            | Datascript.String s -> s
            | _ -> failwith "Publishing asset filename must be a string") assets
        | _ -> failwith "Publishing assets missing" in
      Publishing_export.create_export html static_dir graph_dir output_dir
        ~asset_filenames ~dev ()))
    (fun () -> Sqlite.close sqlite; Eff.pure ())

let run_transit args on_ok on_error =
  try
    let task = match Transit_codec.of_string args with
      | Wire.Array [ Wire.String static_dir; Wire.String graph_dir
                   ; Wire.String output_dir; Wire.Bool dev ] ->
          export_site static_dir graph_dir output_dir dev
      | _ -> invalid_arg "Publishing requires static, graph and output directories" in
    Eff.on_any task on_ok (fun exn -> on_error (Printexc.to_string exn))
  with exn -> on_error (Printexc.to_string exn)
