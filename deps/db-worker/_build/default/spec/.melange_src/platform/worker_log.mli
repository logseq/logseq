# 1 "spec/platform/worker_log.mli"
type level =
  | Trace
  | Debug
  | Info
  | Warn
  | Error

val set_min_level : level -> unit
val log : level -> string -> (string * string) list -> unit
val trace : string -> (string * string) list -> unit
val debug : string -> (string * string) list -> unit
val info : string -> (string * string) list -> unit
val warn : string -> (string * string) list -> unit
val error : string -> (string * string) list -> unit

(* Rolling in-memory log ring (cap 1000) backing :thread-api/mobile-logs. *)
type entry = {
  level : level;
  message : string;
  fields : (string * string) list;
  time_ms : float;
}

val entries : unit -> entry list
