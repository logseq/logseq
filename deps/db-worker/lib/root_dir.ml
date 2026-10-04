(* logseq.cli.root-dir — root-dir validation and path derivation for
   the CLI and db-worker-node. *)

module E = Db_worker_effect

let default_root_dir () =
  Filename.concat (Node_process.home_dir ()) "logseq"

(* Base dir for per-graph sqlite/search/asset files. Falls back to the
   process cwd, which is the graph-dir root in the cljs daemon path. *)
let worker_db_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

(* common-graph/expand-home — leading '~' expands to homedir
   (node-path/join semantics: the segment after ~ is treated as
   relative). *)
let expand_home (path : string) : string =
  if String.length path > 0 && path.[0] = '~' then begin
    let rest = String.sub path 1 (String.length path - 1) in
    let rest =
      if String.length rest > 0 && rest.[0] = '/' then
        String.sub rest 1 (String.length rest - 1)
      else rest
    in
    if rest = "" then Node_process.home_dir ()
    else Filename.concat (Node_process.home_dir ()) rest
  end
  else path

(* windows drive-letter absolute path (C:\ or C:/ prefix). *)
let windows_drive (s : string) : bool =
  String.length s >= 2
  && s.[1] = ':'
  &&
  (let c = s.[0] in
   (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'))

(* node-path/resolve — lexical resolution to an absolute path against
   the process cwd ('.'/'..' collapsed, trailing slash dropped).
   Windows drive paths keep their drive letter and normalize to forward
   slashes, matching node's win32 resolve output the fs layer accepts. *)
let path_resolve (path : string) : string =
  let abs =
    if Filename.is_relative path && not (windows_drive path) then
      Filename.concat (Node_process.cwd ()) path
    else path
  in
  let sep_fixed =
    String.map (fun c -> if c = '\\' then '/' else c) abs
  in
  let segs = String.split_on_char '/' sep_fixed in
  let rec go acc = function
    | [] -> List.rev acc
    | "" :: rest -> go acc rest
    | "." :: rest -> go acc rest
    | ".." :: rest ->
        (match acc with
         | [] -> go acc rest
         | _ :: acc' -> go acc' rest)
    | s :: rest -> go (s :: acc) rest
  in
  match segs with
  | drive :: rest when windows_drive drive ->
      drive ^ "/" ^ String.concat "/" (go [] rest)
  | _ -> "/" ^ String.concat "/" (go [] segs)

let normalize_root_dir (path : string option) : string =
  path_resolve
    (expand_home (Option.value path ~default:(default_root_dir ())))

let graphs_dir (root_dir : string) : string =
  Filename.concat (normalize_root_dir (Some root_dir)) "graphs"

let is_root_dir_permission_exn (e : exn) : bool =
  match e with
  | Dispatcher.Exn_info (_, kvs) ->
      List.exists
        (fun (k, v) ->
           k = Wire.Keyword "code" && v = Wire.Keyword "root-dir-permission")
        kvs
  | _ -> false

let root_dir_permission_exn (path : string) (cause : string) : exn =
  Dispatcher.Exn_info
    ( "root-dir is not readable/writable: " ^ path
    , [ Wire.Keyword "code", Wire.Keyword "root-dir-permission"
      ; Wire.Keyword "path", Wire.String path
      ; Wire.Keyword "cause", Wire.String cause ] )

(* ensure-root-dir! — fs errors become :root-dir-permission ex-info
   carrying the node error as :cause. *)
let ensure_root_dir (path : string) : string E.t =
  let path = normalize_root_dir (Some path) in
  E.catch
    (E.bind (File_sys.exists path) (fun exists ->
         E.bind
           (if exists then E.pure () else File_sys.mkdir_p path)
           (fun () ->
              E.bind (File_sys.is_directory path) (fun is_dir ->
                  if not is_dir then
                    E.error
                      (Dispatcher.Exn_info
                         ( "root-dir is not a directory: " ^ path
                         , [ Wire.Keyword "code"
                           , Wire.Keyword "root-dir-permission"
                           ; Wire.Keyword "path", Wire.String path
                           ; Wire.Keyword "cause", Wire.String "ENOTDIR"
                           ] ))
                  else
                    E.map (fun () -> path)
                      (File_sys.check_read_write path)))))
    (fun e ->
       if is_root_dir_permission_exn e then E.error e
       else E.error (root_dir_permission_exn path (Printexc.to_string e)))
