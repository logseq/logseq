type t
type session
type invocation
type services = {
  get_editing_context : unit -> (Plugin_protocol.editing_context, Plugin_protocol.error) result Ui_task.t;
  current : unit -> bool;
}

val create : unit -> t
val open_session : t -> Plugin_protocol.plugin_id -> Plugin_protocol.capability list -> session
val begin_invocation : t -> session -> services -> invocation
val check : t -> session -> invocation -> (unit, Plugin_protocol.error) result
val dispatch : t -> session -> invocation -> Plugin_protocol.request ->
  (Plugin_protocol.reply, Plugin_protocol.error) result Ui_task.t
val accept_program : t -> session -> invocation -> Plugin_protocol.program ->
  (Plugin_protocol.program, Plugin_protocol.error) result
val cancel : t -> invocation -> unit
val close_session : t -> session -> unit
