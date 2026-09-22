(* Minimal string KV on top of whatever durable store the platform
   has: localStorage/IDB in the browser, a file/sqlite table natively. *)
val get : string -> string option Db_worker_effect.t
val set : string -> string -> unit Db_worker_effect.t
val delete : string -> unit Db_worker_effect.t
val keys : unit -> string list Db_worker_effect.t
