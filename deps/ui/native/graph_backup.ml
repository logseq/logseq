module Policy = Graph_backup_policy

let child_path parent child =
  if child = "" || child = "." || String.starts_with ~prefix:".." child
     || not (Filename.is_relative child) || String.contains child '/'
     || String.contains child '\\' then
    invalid_arg "Invalid backup directory";
  Filename.concat parent child

let rec ensure_directory path =
  try Unix.mkdir path 0o755 with
  | Unix.Unix_error (Unix.EEXIST, _, _) ->
      if not (Sys.is_directory path) then
        failwith "Backup parent is not a directory"
  | Unix.Unix_error (Unix.ENOENT, _, _) ->
      ensure_directory (Filename.dirname path);
      ensure_directory path

let rec remove_owned path =
  match Unix.lstat path with
  | stat when stat.Unix.st_kind = Unix.S_DIR ->
      Array.iter (fun name -> remove_owned (Filename.concat path name))
        (Sys.readdir path);
      Unix.rmdir path
  | _ -> Unix.unlink path
  | exception Unix.Unix_error (Unix.ENOENT, _, _) -> ()

let write_text path contents =
  let oc = open_out_bin path in
  try output_string oc contents; close_out oc
  with error -> close_out_noerr oc; raise error

let create_manual ~graphs_dir ~repo ~temp_id ~snapshot ~check_current =
  if graphs_dir = "" || Filename.is_relative graphs_dir then
    invalid_arg "Backup graph storage must be absolute";
  let graph_name =
    match Graph_dir.repo_to_graph_dir_key repo with
    | Some name -> name
    | None -> invalid_arg "Backup graph name is required"
  in
  let graph_dir = child_path graphs_dir (Graph_dir.encode_graph_dir_name graph_name) in
  let backup_root = Filename.concat graph_dir Policy.backup_root_dir_name in
  let now = Unix.gettimeofday () in
  let utc = Unix.gmtime now in
  let timestamp =
    Printf.sprintf "%04d%02d%02dT%02d%02d%02dZ"
      (utc.Unix.tm_year + 1900) (utc.Unix.tm_mon + 1) utc.Unix.tm_mday
      utc.Unix.tm_hour utc.Unix.tm_min utc.Unix.tm_sec
  in
  let base_name = Policy.build_backup_name ~graph_name ~label:None ~timestamp in
  ensure_directory backup_root;
  let rec reserve suffix =
    let name = Policy.candidate_name ~base_name ~suffix in
    let dir = child_path backup_root (Graph_dir.encode_graph_dir_name name) in
    match Unix.mkdir dir 0o755 with
    | () -> name, dir
    | exception Unix.Unix_error (Unix.EEXIST, _, _) -> reserve (suffix + 1)
  in
  let backup_name, dir = reserve 0 in
  let db_path = Filename.concat dir Policy.backup_db_file_name in
  let tmp_path =
    child_path dir
      (Printf.sprintf "db.%d.%s.tmp.sqlite" (Unix.getpid ()) temp_id)
  in
  let published = ref false in
  try
    snapshot tmp_path;
    if (Unix.stat tmp_path).Unix.st_kind <> Unix.S_REG then
      failwith "Snapshot did not create a regular SQLite backup";
    check_current ();
    Unix.rename tmp_path db_path;
    published := true;
    let metadata =
      Wire.Map
        (Policy.metadata_fields ~keyword:Wire.kw
           ~string:(fun value -> Wire.String value)
           ~int:(fun value -> Wire.Int value)
           ~backup_name ~repo ~source:"electron-manual"
           ~created_at:(Wire.Int64 (Int64.of_float (Float.floor (now *. 1000.))))
           ~db_path)
    in
    write_text (Filename.concat dir Policy.backup_metadata_file_name)
      (Edn.to_string metadata);
    check_current ();
    Wire.Map
      [ Wire.kw "backup-name", Wire.String backup_name
      ; Wire.kw "path", Wire.String db_path
      ; Wire.kw "created?", Wire.Bool true
      ; Wire.kw "reason", Wire.Nil
      ]
  with error ->
    let error =
      try
        remove_owned tmp_path;
        if not !published then
          (match Unix.lstat db_path with
           | _ -> ()
           | exception Unix.Unix_error (Unix.ENOENT, _, _) -> remove_owned dir);
        error
      with cleanup_error ->
        Failure
          (Printexc.to_string error ^ "; backup cleanup failed: "
           ^ Printexc.to_string cleanup_error)
    in
    raise error
