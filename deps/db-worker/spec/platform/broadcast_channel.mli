(* BroadcastChannel for the shared-service master-client election
   (frontend.worker.shared-service). Browser-worker API; node has no
   BroadcastChannel (shared-service short-circuits to master on node,
   so this is never reached there); both native and node raise
   [Invalid_argument] at call time. *)

type t

val create : string -> t
val close : t -> unit

(* postMessage of a JSON-able payload (Wire.Map with String keys
   mirrors the cljs bean/->js message objects). *)
val post_message : t -> Wire.t -> unit

(* add/removeEventListener "message"; the listener receives the
   event .data payload decoded like cljs bean/->clj (object keys as
   Wire.String keys). add returns the handle remove needs — callers
   keep it like cljs keeps the listener fn in the atom. *)
type listener

val add_message_listener : t -> (Wire.t -> unit) -> listener
val remove_message_listener : t -> listener -> unit
