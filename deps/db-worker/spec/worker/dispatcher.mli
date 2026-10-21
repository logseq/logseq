(* Endpoint registry + transit-string dispatch, mirroring
   frontend.common.thread-api/remote-function.
   endpoint names are the qualified keyword strings
   ("thread-api/q"), args/result are transit vectors/values. *)

type handler = Wire.t list -> Wire.t Db_worker_effect.t

(* ex-info equivalent: raising this makes the wire error payload carry
   the data map, so callers can match ex-data keys (:type, :code, ...). *)
exception Exn_info of string * (Wire.t * Wire.t) list

val register : string -> handler -> unit
val registered : string -> bool
val invoke : string -> Wire.t list -> Wire.t Db_worker_effect.t
val invoke_transit : string -> string -> string Db_worker_effect.t
val registered_names : unit -> string list

(* Tagged "error" wire value for an exception, the same payload
   cljs `read-transit-str` decodes back into ExceptionInfo. *)
val encode_error : string -> exn -> Wire.t

(* cljs (ex-message e) — the raw message, not Printexc.to_string's
   Constructor(...) rendering. *)
val exn_message : exn -> string
