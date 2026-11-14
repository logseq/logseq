type t

(** All operations, including explicit [close], belong to the creating native thread.
    Pumping executes at most 32 jobs per turn, with a 5ms interrupt budget.
    Queue memory is bounded by the runtime heap, not a hard job-count limit.
    Failed, stale or cancelled invocations retire the instance and session;
    callers must create a new session/runtime and reload before another command. *)
val create : Plugin_broker.t -> Plugin_broker.session -> (t, Plugin_protocol.error) result
val load : t -> source:string -> (Plugin_protocol.callback_id, Plugin_protocol.error) result
val invoke_command : t -> Plugin_broker.invocation -> Plugin_protocol.callback_id ->
  (Plugin_protocol.program, Plugin_protocol.error) result Ui_task.t
val invoke_read_only : t -> Plugin_broker.invocation -> Plugin_protocol.callback_id ->
  (unit, Plugin_protocol.error) result Ui_task.t
val pump : t -> unit
val close : t -> unit
