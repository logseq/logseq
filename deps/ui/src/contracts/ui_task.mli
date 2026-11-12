type scheduler = {
  (* Thread-safe posting; callbacks execute later on the application thread. *)
  enqueue : (unit -> unit) -> unit;
  assert_owner : unit -> unit;
}

type 'a t
exception Cancelled

val install : scheduler -> unit
(* Create and observe tasks on the application thread. Completion functions
   returned by pending/create may be called by I/O threads; the first queued
   completion wins. All observers run through the installed scheduler. *)
val pending : unit -> 'a t * ('a -> unit) * (exn -> unit)
val create : ?cancel:(unit -> unit) ->
  (resolve:('a -> unit) -> reject:(exn -> unit) -> unit) -> 'a t
val resolve : 'a -> 'a t
val reject : exn -> 'a t
val bind : 'a t -> ('a -> 'b t) -> 'b t
val catch : 'a t -> (exn -> 'a t) -> 'a t
val all : 'a t array -> 'a array t
val cancel : 'a t -> unit
(* Cancellation immediately retires a pending task on the application thread,
   releases observations, and invokes its cancellation hook once. Rejection
   observers remain deferred, and later I/O completions are ignored. *)
val ( let* ) : 'a t -> ('a -> 'b t) -> 'b t


(** Optional work counters owned by one serialized application/scope. Observation
    does not settle, cancel, retain or enumerate tasks. Existing callers need not
    install a scope. Call these operations on the application's owner thread. *)
module Activity : sig
  type t
  type snapshot = { pending : int; epoch : int }
  val create : unit -> t
  val within : t -> (unit -> 'a) -> 'a
  val without : (unit -> 'a) -> 'a

  (** Capture the current observation context for a later continuation. *)
  val capture : ('a -> 'b) -> 'a -> 'b

  (** A one-shot completion hook for an additional application-owned async
      primitive, or [None] outside an observed scope. No task is created. *)
  val begin_work : unit -> (unit -> unit) option
  val snapshot : t -> snapshot

  (** Stop observing newly created work; existing completion hooks still work. *)
  val close : t -> unit
end
