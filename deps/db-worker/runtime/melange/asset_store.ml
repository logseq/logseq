(* Node-backed asset store: <LOGSEQ_WORKER_DB_DIR>/<repo>/assets/<name>.
   The browser pfs layout is not implemented in this runtime. *)

let base_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

let sanitize_repo_name repo =
  String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo

let path ~repo ~name =
  Filename.concat
    (Filename.concat (base_dir ()) (sanitize_repo_name repo))
    (Filename.concat "assets" name)

let ensure_parent p =
  let dir = Filename.dirname p in
  Db_worker_effect.bind (File_sys.mkdir_p dir) (fun () ->
      Db_worker_effect.pure ())

let read_bytes ~repo ~name = File_sys.read_binary (path ~repo ~name)

let write_bytes ~repo ~name bytes =
  let p = path ~repo ~name in
  Db_worker_effect.bind (ensure_parent p) (fun () ->
      File_sys.write_binary p bytes)

let exists ~repo ~name = File_sys.exists (path ~repo ~name)

let delete ~repo ~name = File_sys.remove (path ~repo ~name)
