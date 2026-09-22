(* The `@logseq/graph-lifecycle` npm package surface the
   db-worker-node daemon uses (frontend.worker.db-worker-node +
   logseq.db-worker.log). Implemented via require() on melange;
   the native implementation raises [Invalid_argument]. *)

(* resolveStorage(root, graphsDir) — canonical storage roots;
   creates dirs, returns {root, graphsDir, lifecycleDir}. *)
type storage =
  { root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  }

val resolve_storage : root:string -> graphs_dir:string -> storage

(* admit({storage, repo, ticket, generation, owner}) — claims graph
   ownership and registers this worker; resolves to the runtime
   record the rest of the API takes. *)
type runtime

val admit :
  storage:storage ->
  repo:string ->
  owner:string ->
  ?ticket:string ->
  ?generation:string ->
  unit ->
  runtime Db_worker_effect.t

val runtime_ticket : runtime -> string option
val runtime_generation : runtime -> string option
val runtime_root : runtime -> string
val runtime_storage : runtime -> storage

(* checkAdmission/assertOwnership — raise (code 'graph-not-exists' /
   'repo-locked') when the registration or ownership changed. *)
val check_admission : runtime -> unit
val assert_ownership : runtime -> unit
val release_ownership : runtime -> unit

(* recordStop/abortAdmission(runtime, error) — [error] as message
   string; pass [None] for clean stop. *)
val record_stop : runtime -> string option -> unit
val abort_admission : runtime -> string option -> unit

(* publish(runtime, port, exposeReady) — writes the ready runtime
   record then invokes exposeReady inside the lease. *)
val publish : runtime -> int -> (unit -> unit) -> unit Db_worker_effect.t
