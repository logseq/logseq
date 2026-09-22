(* Top-level worker entry: registers all endpoints once, then
   answers remoteInvoke(qualifiedName, transitArgs) -> transit result. *)
val init : unit -> unit
val invoke : string -> string -> string Db_worker_effect.t

(* cljs build-proxy-object remoteInvoke — routes through the
   per-graph shared service: create-or-open-db re-inits the service
   and posts :record-worker-client-id, sync-app-state and calls made
   before any service exists dispatch directly, everything else waits
   for the service to be ready and goes through its proxy (which on a
   slave client forwards to the master over BroadcastChannel).
   Result is the transit-string payload, as on the cljs side. *)
val remote_invoke : string -> string -> string Db_worker_effect.t

(* cljs remote-binary-function — bypasses the service: raw method
   dispatch with the binary payload as a byte string; the result is
   the handler's Wire.t (Wire.Binary for export endpoints). *)
val remote_invoke_binary :
  string -> string -> string option -> Wire.t Db_worker_effect.t
