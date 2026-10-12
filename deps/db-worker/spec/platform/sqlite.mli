(* Synchronous sqlite surface. All backends (sqlite-wasm oo1,
   node:sqlite, ocaml-sqlite3) are synchronous; async shells live
   in callers, not here. *)
type db

type bind =
  | Null
  | Integer of int64
  | Float of float
  | Text of string
  | Blob of string

type row = bind array

exception Sqlite_error of string

val open_db : path:string -> db
(* Browser OPFS pools (sqlite-wasm): [prepare_pool] installs the SAH pool
   vfs once per pool name; a no-op where pools don't exist. *)
val prepare_pool : name:string -> unit Db_worker_effect.t
(* [open_db_pool ~name ~path] opens [path] inside the prepared pool on
   browser, identical to [open_db] elsewhere. *)
val open_db_pool : name:string -> path:string -> db
val close : db -> unit
val exec : db -> sql:string -> bind:bind array -> unit
val query : db -> sql:string -> bind:bind array -> row list
val transaction : db -> (unit -> 'a) -> 'a
val checkpoint : db -> unit
val backup : db -> dst_path:string -> unit
val filename : db -> string
(* True when opens go through named pools (browser OPFS). *)
val pooled_runtime : unit -> bool

(* Raw db-file ops used by the binary export/import endpoints (cljs
   platform/{browser,node} storage :export-file/:import-db). On pooled
   runtimes [name] selects the prepared OPFS pool and the ops go through
   OpfsSAHPoolDb .exportFile/.importDb; elsewhere [path] resolves under
   [dir] with a leading '/' stripped (cljs platform/node.cljs
   pool-path). Binary payloads are byte strings. *)
val export_file : name:string -> dir:string -> path:string -> string Db_worker_effect.t
val import_db : name:string -> dir:string -> path:string -> string -> unit Db_worker_effect.t

(* cljs platform/sqlite-init! — browser loads sqlite-wasm via
   sqlite3InitModule with log taps; node/native are per-open so this
   is a no-op. *)
val init : unit -> unit Db_worker_effect.t

(* cljs storage :list-graphs — decoded graph names without the
   logseq_db_ prefix (the endpoint re-prepends it). Browser scans OPFS
   root ".logseq-pool-*" dirs; node/native scan graph dirs under the
   storage root. *)
val list_graphs : unit -> string list Db_worker_effect.t

(* cljs storage :db-exists? — browser checks the OPFS pool dir;
   node/native checks <graph-dir>/db.sqlite. *)
val db_exists : repo:string -> bool Db_worker_effect.t

(* cljs storage :remove-vfs! — drops the graph's whole storage
   namespace: pool.removeVfs on browser, repo-dir contents on
   node/native. *)
val remove_vfs : repo:string -> unit Db_worker_effect.t

(* Browser SAH pool access handles and capacity; no-ops/zero where
   pools don't exist. cljs close-db! pauses; <open-dbs unpauses when
   capacity is 0. *)
val pause_vfs : repo:string -> unit
val unpause_vfs : repo:string -> unit
val pool_capacity : repo:string -> int

(* cljs worker-state/forget-storage-pool! — drops the cached pool
   handle for repo. *)
val drop_pool : repo:string -> unit
