(* logseq.db.common.sqlite — common sqlite util fns that work on
   browser and node. *)

open Datascript

(* create-kvs-table! *)
let create_kvs_table (sqlite_db : Sqlite.db) : unit =
  Graph_store.create_kvs_table sqlite_db

(* get-storage-conn *)
let get_storage_conn (storage : storage) (schema : schema) : conn =
  match Datascript.restore_conn storage with
  | Some conn -> conn
  | None -> Datascript.create_conn ~schema ~storage ()

(* sanitize-db-name — string/replace replaces every occurrence *)
let sanitize_db_name (db_name : string) : string =
  Graph_dir.str_replace_all db_name Graph_dir.db_version_prefix ""
  |> fun s -> Graph_dir.str_replace_all s "/" "_"
  |> fun s -> Graph_dir.str_replace_all s "\\" "_"
  |> fun s -> Graph_dir.str_replace_all s ":" "_"

(* get-db-full-path -> [graph-dir-name, db.sqlite path] *)
let get_db_full_path (graphs_dir : string) (db_name : string)
    : string * string =
  let graph_dir_name =
    match Graph_dir.repo_to_encoded_graph_dir_name db_name with
    | Some n -> n
    | None -> invalid_arg "db-name must resolve to a graph dir name"
  in
  let graph_dir = Common_path.path_join graphs_dir [ graph_dir_name ] in
  (graph_dir_name, Common_path.path_join graph_dir [ "db.sqlite" ])

let get_db_backups_path (graphs_dir : string) (db_name : string) : string =
  let graph_dir_name =
    match Graph_dir.repo_to_encoded_graph_dir_name db_name with
    | Some n -> n
    | None -> invalid_arg "db-name must resolve to a graph dir name"
  in
  Common_path.path_join graphs_dir [ graph_dir_name; "backups" ]
