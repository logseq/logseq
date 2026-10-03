(* Port of logseq.db.common.sqlite-cli (node-only) — sqlite file access
   for CLIs. The storage layer is Graph_store (byte-compatible kvs
   format), matching db-worker/new-sqlite-storage. *)
open Datascript

(* query — run a sql query against the sqlite db *)
let query (db : Sqlite.db) (sql : string) : Sqlite.row list =
  Sqlite.query db ~sql ~bind:[||]

(* store-profile-state — optional map; when set, each -store records
   {:ms :n :nodes :series}. *)
type store_profile =
  { mutable ms : float
  ; mutable n : int
  ; mutable nodes : int
  ; mutable series : float list
  }

let store_profile_state : store_profile option ref = ref None

let new_store_profile () =
  { ms = 0.0; n = 0; nodes = 0; series = [] }

(* new-sqlite-storage — cljs instruments -store when
   store-profile-state is set; Graph_store.store does the kvs upsert. *)
let new_sqlite_storage (db : Sqlite.db) : storage =
  match !store_profile_state with
  | None -> Graph_store.storage db
  | Some _ ->
      let base = Graph_store.storage db in
      { base with
        storage_store =
          (fun addr_payloads ->
             let start = Time.monotonic_now () in
             let n = List.length addr_payloads in
             base.storage_store addr_payloads;
             let ms = Time.diff_monotonic_ms start (Time.monotonic_now ()) in
             match !store_profile_state with
             | None -> ()
             | Some s ->
                 s.ms <- s.ms +. ms;
                 s.n <- s.n + 1;
                 s.nodes <- s.nodes + n;
                 s.series <- s.series @ [ ms ])
      }

(* open-sqlite-datascript! — returns {:sqlite db :conn conn};
   [?graphs_dir] selects the cljs arity: called with a bare db-full-path
   or with graphs-dir + db-name. *)
let open_sqlite_datascript ?(graphs_dir : string option) (db_name : string)
    : Sqlite.db * conn =
  let db_full_path =
    match graphs_dir with
    | None -> db_name
    | Some dir -> snd (Common_sqlite.get_db_full_path dir db_name)
  in
  let db = Sqlite.open_db ~path:db_full_path in
  Common_sqlite.create_kvs_table db;
  let storage = new_sqlite_storage db in
  let conn = Common_sqlite.get_storage_conn storage (Db_schema.schema ()) in
  (db, conn)

(* open-db! — returns the datascript conn only *)
let open_db ?(graphs_dir : string option) (db_name : string) : conn =
  snd (open_sqlite_datascript ?graphs_dir db_name)

(* ->open-db-args — absolute paths pass through as [path]; relative
   paths containing "/" resolve against ORIGINAL_PWD (bb task cwd) then
   split into [dirname basename]; otherwise
   [default-graphs-dir graph-name]. *)
let resolve_path (p : string) : string =
  if Common_path.absolute p then p
  else
    Common_path.path_join
      (Option.value (Runtime_env.env "ORIGINAL_PWD") ~default:".")
      [ p ]

let open_db_args (graph_dir_or_path : string) : string list =
  if Common_path.absolute graph_dir_or_path then [ graph_dir_or_path ]
  else if String.contains graph_dir_or_path '/' then
    let resolved = resolve_path graph_dir_or_path in
    let dirname =
      match Common_path.parent resolved with
      | Some d -> d
      | None -> "." (* node-path/dirname of a bare name *)
    in
    let basename =
      match Common_path.basename resolved with
      | Some b -> b
      | None -> resolved
    in
    [ dirname; basename ]
  else [ Common_graph.get_db_graphs_dir (); graph_dir_or_path ]
