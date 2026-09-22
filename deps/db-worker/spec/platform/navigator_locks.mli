(* navigator.locks for the shared-service master-client election
   (frontend.worker.shared-service). Browser-worker API; node never
   reaches it (node-runtime? short-circuits); native raises
   [Invalid_argument]. *)

(* A granted lock callback receives the lock handle — [None] when
   if_available was set and the lock could not be granted. *)
type lock

val request :
  name:string ->
  ?mode:string ->
  ?if_available:bool ->
  (lock option -> 'a Db_worker_effect.t) ->
  'a Db_worker_effect.t

type lock_info =
  { name : string
  ; client_id : string
  }

type query_result =
  { held : lock_info list
  ; pending : lock_info list
  }

val query : unit -> query_result Db_worker_effect.t
