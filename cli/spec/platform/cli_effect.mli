(** Runtime effect abstraction.

    Initial implementation may be identity + Lwt/Promise wrappers. Keeping this
    abstract avoids leaking JS promises, Lwt, Eio, or Async into domain
    signatures. *)

type 'a t

val pure : 'a -> 'a t
val error : exn -> 'a t
val map : ('a -> 'b) -> 'a t -> 'b t
val map_s : ('a -> 'b t) -> 'a list -> 'b list t
val bind : 'a t -> ('a -> 'b t) -> 'b t
val ( >>= ) : 'a t -> ('a -> 'b t) -> 'b t
val both : 'a t -> 'b t -> ('a * 'b) t
val all : 'a t list -> 'a list t
val catch : 'a t -> (exn -> 'a t) -> 'a t
val finally : 'a t -> (unit -> unit t) -> 'a t
val of_lwt : 'a Lwt.t -> 'a t
val to_lwt : 'a t -> 'a Lwt.t
val sleep : Ptime.span -> unit t
