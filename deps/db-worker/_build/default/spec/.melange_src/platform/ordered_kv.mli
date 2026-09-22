# 1 "spec/platform/ordered_kv.mli"
(* Ordered byte-key store over SQLite, per logseq/datascript-sqlite
   IOrderedKV. Keys are hex-encoded strings, ordered by decoded bytes. *)
type t

val make : Sqlite.db -> t
val range : t -> begin_:string -> end_:string -> reverse:bool -> string list
val put : t -> string list -> unit
val delete_range : t -> begin_:string -> end_:string -> unit
