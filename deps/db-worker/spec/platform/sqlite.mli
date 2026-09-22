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
val close : db -> unit
val exec : db -> sql:string -> bind:bind array -> unit
val query : db -> sql:string -> bind:bind array -> row list
val transaction : db -> (unit -> 'a) -> 'a
val checkpoint : db -> unit
val backup : db -> dst_path:string -> unit
val filename : db -> string
