(* Filesystem asset store: <LOGSEQ_WORKER_DB_DIR>/<encoded-graph>/assets/<name>.
   Same directory as db.sqlite. The logseq_db_ prefix is stripped and the
   name is encoded, so assets live inside the graph directory that delete
   moves. Keeping the raw repo string created a sibling
   graphs/logseq_db_<name>/assets that the desktop scanner listed as the
   graph again after the real directory was gone. *)

let base_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

let sanitize_repo_name repo =
  String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo

let path ~repo ~name =
  let repo_dir =
    match Graph_dir.repo_to_encoded_graph_dir_name repo with
    | Some dir -> dir
    | None -> sanitize_repo_name repo
  in
  Filename.concat
    (Filename.concat (base_dir ()) repo_dir)
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
