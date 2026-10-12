(* Per-repo binary asset store (db-sync asset upload/download).
   Platform-resolved: node stores under the graphs dir, the browser uses pfs.
   Bodies are raw byte strings. *)

(* Filesystem path for the asset file, e.g. used by cljs' local-assets-dir
   "assets" layout. *)
val path : repo:string -> name:string -> string

val read_bytes : repo:string -> name:string -> string Db_worker_effect.t
val write_bytes : repo:string -> name:string -> string -> unit Db_worker_effect.t
val exists : repo:string -> name:string -> bool Db_worker_effect.t
val delete : repo:string -> name:string -> unit Db_worker_effect.t
