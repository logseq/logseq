(* Port of logseq.common.graph — graph dir helpers. *)

module E = Db_worker_effect

(* path-at-or-under? *)
let path_at_or_under (path : string) (dir : string) : bool =
  path = dir || Common_util.str_starts_with path (dir ^ "/")

(* ignored-path? — see cljs docstring for the rule list. *)
let ignored_path (dir : string) (path : string) : bool =
  let dir = Common_path.path_normalize dir in
  let path = Common_path.path_normalize path in
  match Common_path.trim_dir_prefix dir path with
  | None -> false
  | Some rpath ->
      Common_util.str_starts_with rpath "."
      || List.exists (path_at_or_under rpath)
           [ "logseq/.recycle"; "logseq/bak"; "logseq/version-files"
           ; "mirror/markdown" ]
      || List.mem rpath
           [ "logseq/graphs-txid.edn"; "logseq/pages-metadata.edn" ]
      || Common_util.str_includes rpath "/node_modules/"
      || Common_util.str_ends_with rpath ".DS_Store"
      || Regexp.test (Regexp.compile "/\\.[^.]+") rpath
      || Regexp.test (Regexp.compile "^\\.[^.]+") rpath

(* readdir — tree-seq over File_sys.readdir, filtering symbolic links and
   entries whose name starts with '.'. *)
let readdir (root_dir : string) : string list E.t =
  let path_join = Filename.concat in
  let rec walk dir acc =
    E.bind (File_sys.readdir dir) (fun names ->
        let rec step acc = function
          | [] -> E.pure (List.rev acc)
          | name :: rest ->
              if String.length name > 0 && name.[0] = '.' then step acc rest
              else
                let fpath = path_join dir name in
                E.bind (File_sys.is_symbolic_link fpath) (fun is_link ->
                    if is_link then step acc rest
                    else
                      E.bind (File_sys.is_directory fpath) (fun is_dir ->
                          if is_dir then
                            E.bind (walk fpath acc) (fun acc' ->
                                step acc' rest)
                          else step (fpath :: acc) rest))
        in
        step acc names)
  in
  walk root_dir []

(* read-directories — sub-directory names only. *)
let read_directories (root_dir : string) : string list E.t =
  E.bind (File_sys.readdir root_dir) (fun names ->
      let rec step acc = function
        | [] -> E.pure (List.rev acc)
        | name :: rest ->
            if String.length name > 0 && name.[0] = '.' then step acc rest
            else
              let fpath = Filename.concat root_dir name in
              E.bind (File_sys.is_symbolic_link fpath) (fun is_link ->
                  if is_link then step acc rest
                  else
                    E.bind (File_sys.is_directory fpath) (fun is_dir ->
                        step (if is_dir then name :: acc else acc) rest))
      in
      step [] names)

let allowed_formats =
  [ "org"; "markdown"; "md"; "edn"; "json"; "js"; "css" ]

(* node-path/extname + subs 1 — extension without the dot. *)
let get_ext (p : string) : string =
  snd (Common_path.split_ext p)

(* get-files — readdir minus ignored paths, filtered to allowed exts. *)
let get_files (graph_dir : string) : string list E.t =
  E.map
    (fun files ->
      List.filter
        (fun f ->
          (not (ignored_path graph_dir f)) && List.mem (get_ext f) allowed_formats)
        files)
    (readdir graph_dir)


(* get-default-graphs-dir — env var wins over
   common-config/default-graphs-dir ("~/logseq/graphs"). *)
let get_default_graphs_dir () : string =
  match Runtime_env.env "LOGSEQ_GRAPHS_DIR" with
  | Some dir -> dir
  | None -> Common_config.default_graphs_dir

(* expand-home — node-path/join homedir rest when path starts with ~ *)
let expand_home (path : string) : string =
  if String.length path > 0 && String.get path 0 = '~' then
    Common_path.path_join (Runtime_env.home_dir ())
      [ String.sub path 1 (String.length path - 1) ]
  else path

(* get-db-graphs-dir *)
let get_db_graphs_dir () : string = expand_home (get_default_graphs_dir ())
