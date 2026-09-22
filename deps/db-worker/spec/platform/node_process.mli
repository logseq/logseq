(* Node `process` surface used by the db-worker-node daemon port
   (frontend.worker.db-worker-node and friends). Node-only: the
   native implementation raises [Invalid_argument]. *)

val argv : unit -> string list
val pid : unit -> int
val exit : int -> unit
val cwd : unit -> string
val home_dir : unit -> string
val set_env : string -> string -> unit
val on_signal : string -> (unit -> unit) -> unit

(* cljs daemon/pid-status + server-list/process-status:
   process.kill(pid, 0) mapped to a status. *)
type pid_status =
  | Alive
  | Not_found
  | No_permission
  | Error

val kill0 : int -> pid_status

(* cljs server-list/sleep-sync! — SharedArrayBuffer + Atomics.wait;
   blocks the thread for [ms]. *)
val sleep_sync_ms : int -> unit

(* child_process.spawnSync argv -> (exit status, stdout). [None] when
   the spawn itself failed. *)
val spawn_stdout : string -> string list -> (int * string) option

(* process.stdout.isTTY — cli style color support check. *)
val stdout_is_tty : unit -> bool
