(* Top-level worker entry: registers all endpoints once, then
   answers remoteInvoke(qualifiedName, transitArgs) -> transit result. *)
val init : unit -> unit
val invoke : string -> string -> string Db_worker_effect.t
