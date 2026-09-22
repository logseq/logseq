(* Port of logseq.db.common.sqlite — sqlite util fns that work on
   browser and node. *)
open Datascript

(* create-kvs-table! — same SQL lives in Graph_store (byte-compatible
   on-disk format); kept here for API parity with the cljs ns. *)
let create_kvs_table (db : Sqlite.db) : unit = Graph_store.create_kvs_table db

(* get-storage-conn — (or (d/restore-conn storage)
   (d/create-conn schema {:storage storage})) *)
let get_storage_conn (storage : storage) (schema : (attr * schema_attr) list)
    : conn =
  match Datascript.restore_conn storage with
  | Some conn -> conn
  | None -> Datascript.create_conn ~schema ~storage ()

(* sanitize-db-name *)
let sanitize_db_name (db_name : string) : string =
  db_name
  |> Graph_dir.str_replace_all Common_config.db_version_prefix ""
  |> Graph_dir.str_replace_all "/" "_"
  |> Graph_dir.str_replace_all "\\" "_"
  |> Graph_dir.str_replace_all ":" "_"

(* get-db-full-path — [graph-dir-name, <graphs-dir>/<graph-dir>/db.sqlite].
   Raises like cljs node-path/join when the name can't be encoded. *)
let get_db_full_path (graphs_dir : string) (db_name : string)
    : string * string =
  match Graph_dir.repo_to_encoded_graph_dir_name db_name with
  | None -> invalid_arg ("get-db-full-path: unencodable db-name " ^ db_name)
  | Some graph_dir_name ->
      let graph_dir = Common_path.path_join graphs_dir [ graph_dir_name ] in
      (graph_dir_name, Common_path.path_join graph_dir [ "db.sqlite" ])

(* get-db-backups-path — <graphs-dir>/<graph-dir>/backups *)
let get_db_backups_path (graphs_dir : string) (db_name : string) : string =
  match Graph_dir.repo_to_encoded_graph_dir_name db_name with
  | None -> invalid_arg ("get-db-backups-path: unencodable db-name " ^ db_name)
  | Some graph_dir_name ->
      Common_path.path_join graphs_dir [ graph_dir_name; "backups" ]
