type t

val start_read : id:Plugin_protocol.plugin_id ->
  grants:Plugin_protocol.capability list -> source:string ->
  (t, Plugin_protocol.error) result Ui_task.t
val start_commands : id:Plugin_protocol.plugin_id ->
  grants:Plugin_protocol.capability list -> source:string ->
  (t, Plugin_protocol.error) result Ui_task.t
val current : t -> bool
val invoking : t -> bool
val commands : t -> Plugin_protocol.command_descriptor list
val invoke : ?writes:Plugin_broker.write_services -> t -> key:string -> Plugin_broker.services -> Plugin_broker.read_services ->
  (Plugin_protocol.program, Plugin_protocol.error) result Ui_task.t
val close : t -> unit
