type t

(** All operations, including explicit [close], belong to the creating native thread.
    Pumping executes at most 32 jobs per turn, with a 5ms interrupt budget.
    Queue memory is bounded by the runtime heap, not a hard job-count limit. *)
val create : Plugin_broker.t -> Plugin_broker.session -> (t, Plugin_protocol.error) result
val load : t -> source:string -> (Plugin_protocol.callback_id, Plugin_protocol.error) result
val invoke_command : t -> Plugin_broker.invocation -> Plugin_protocol.callback_id ->
  (Plugin_protocol.program, Plugin_protocol.error) result Ui_task.t
val pump : t -> unit
val close : t -> unit
