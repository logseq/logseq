val modal_selector : string
val cloud_ready_selector : string
val poll_ms : float
val grace_ms : float
val timeout_ms : float

module type Monad = sig
  type 'a t
  val return : 'a -> 'a t
  val bind : 'a t -> ('a -> 'b t) -> 'b t
end

module Make (M : Monad) : sig
  val run :
    visible:(string -> bool M.t) ->
    wait_timeout:(float -> unit M.t) ->
    input_password:(unit -> unit M.t) -> unit -> unit M.t
end
