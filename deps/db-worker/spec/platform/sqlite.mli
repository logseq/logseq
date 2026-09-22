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
