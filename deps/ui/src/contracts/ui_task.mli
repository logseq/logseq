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
