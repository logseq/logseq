type t

val start : id:Plugin_protocol.plugin_id ->
  grants:Plugin_protocol.capability list -> source:string ->
  (t, Plugin_protocol.error) result Ui_task.t
val close : t -> unit
