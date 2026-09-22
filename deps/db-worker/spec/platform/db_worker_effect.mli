(* JS-friendly promise effect. Implemented per platform
   (JS.Promise on Melange, an in-process scheduler on native). *)
type 'a t
type 'a resolver

val pure : 'a -> 'a t
val error : exn -> 'a t
val map : ('a -> 'b) -> 'a t -> 'b t
val bind : 'a t -> ('a -> 'b t) -> 'b t
val both : 'a t -> 'b t -> ('a * 'b) t
val all : 'a t list -> 'a list t
val catch : 'a t -> (exn -> 'a t) -> 'a t
val finally : 'a t -> (unit -> unit t) -> 'a t
val sleep : float -> unit t

(* promesa p/timeout — reject with Failure "timeout" when the task has
   not settled within ms. *)
val timeout : 'a t -> float -> 'a t
val wait : unit -> 'a t * 'a resolver
val wakeup : 'a resolver -> 'a -> unit
val is_pending : 'a t -> bool
val async : (unit -> unit t) -> unit
val on_any : 'a t -> ('a -> unit) -> (exn -> unit) -> unit

module Infix : sig
  val ( >>= ) : 'a t -> ('a -> 'b t) -> 'b t
end
