type level =
  | Trace
  | Debug
  | Info
  | Warn
  | Error

val set_min_level : level -> unit
val min_level : unit -> level
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
  time_ms : Time.epoch_ms;
}

val entries : unit -> entry list

(* Optional sink invoked for every logged entry (before the
   level check), used by the db-worker-node file logger the same way
   the cljs daemon's glogi handler appends to the log file. *)
val set_entry_sink : (entry -> unit) option -> unit
