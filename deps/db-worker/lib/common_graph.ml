(* Port of logseq.common.graph (subset) — graph dir helpers needed by
   sqlite-cli open-db args. The graph-file-listing fns are not ported. *)

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
