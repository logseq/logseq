(** Runtime effect abstraction. *)

type 'a t
type 'a resolver

val pure : 'a -> 'a t
val error : exn -> 'a t
val map : ('a -> 'b) -> 'a t -> 'b t
val map_s : ('a -> 'b t) -> 'a Rrbvec.t -> 'b Rrbvec.t t
val bind : 'a t -> ('a -> 'b t) -> 'b t
val both : 'a t -> 'b t -> ('a * 'b) t
val all : 'a t Rrbvec.t -> 'a Rrbvec.t t
val catch : 'a t -> (exn -> 'a t) -> 'a t
val finally : 'a t -> (unit -> unit t) -> 'a t
val sleep : float -> unit t
val wait : unit -> 'a t * 'a resolver
val wakeup : 'a resolver -> 'a -> unit
val is_pending : 'a t -> bool
val async : (unit -> unit t) -> unit
val on_any : 'a t -> ('a -> unit) -> (exn -> unit) -> unit

module Infix : sig
  val ( >>= ) : 'a t -> ('a -> 'b t) -> 'b t
end
