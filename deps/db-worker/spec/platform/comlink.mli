(* Worker <-> main-thread channel. invoke carries transit strings,
   matching remoteInvoke on the CLJS side. *)
val invoke_remote : string -> string -> string Db_worker_effect.t
val post_message : string -> unit
