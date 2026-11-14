type t
type session
type invocation
type services = {
  get_editing_context : unit -> (Plugin_protocol.editing_context, Plugin_protocol.error) result Ui_task.t;
  current : unit -> bool;
}
type read_services = {
  editing_state : unit -> (Plugin_protocol.editing_context option, Plugin_protocol.error) result Ui_task.t;
  current_block : unit -> (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  current_page : unit -> (Plugin_protocol.page_result, Plugin_protocol.error) result Ui_task.t;
  get_block : Plugin_protocol.identity -> (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  get_block_tree : Plugin_protocol.identity -> (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  get_page : Plugin_protocol.identity -> (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  page_linked_references : Plugin_protocol.identity ->
    ((Plugin_protocol.entity * Plugin_protocol.entity list) list option, Plugin_protocol.error) result Ui_task.t;
  sibling_block : Plugin_protocol.sibling_direction -> Plugin_protocol.identity ->
    (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  current_page_blocks_tree : unit -> (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t;
  selected_blocks : unit -> (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t;
  block_property : Plugin_protocol.identity -> Plugin_protocol.property_ident ->
    (Json.t, Plugin_protocol.error) result Ui_task.t;
  page_properties : Plugin_protocol.identity -> (Json.t, Plugin_protocol.error) result Ui_task.t;
  today_page : unit -> (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t;
  all_pages : unit -> (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t;
  query : Plugin_protocol.query -> (Json.t, Plugin_protocol.error) result Ui_task.t;
  log : Plugin_protocol.log_level -> string -> (unit, Plugin_protocol.error) result Ui_task.t;
}

val create : unit -> t
val open_session : t -> Plugin_protocol.plugin_id -> Plugin_protocol.capability list -> session
val session_current : t -> session -> bool
val activate_commands : t -> session -> (unit, Plugin_protocol.error) result
val commands : t -> session -> Plugin_protocol.command_descriptor list
val command_callback : t -> session -> key:string ->
  (Plugin_protocol.callback_id, Plugin_protocol.error) result
val begin_invocation : ?reads:read_services -> t -> session -> services -> invocation
val check : t -> session -> invocation -> (unit, Plugin_protocol.error) result
val dispatch : t -> session -> invocation -> Plugin_protocol.request ->
  (Plugin_protocol.reply, Plugin_protocol.error) result Ui_task.t
val get_sibling_block : t -> session -> invocation ->
  direction:Plugin_protocol.sibling_direction -> Plugin_protocol.identity ->
  (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t
val get_current_page_blocks_tree : t -> session -> invocation ->
  (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t
val get_selected_blocks : t -> session -> invocation ->
  (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t
val get_all_pages : t -> session -> invocation ->
  (Plugin_protocol.entity list, Plugin_protocol.error) result Ui_task.t
val get_block_property : t -> session -> invocation ->
  Plugin_protocol.identity -> Plugin_protocol.property_ident -> (Json.t, Plugin_protocol.error) result Ui_task.t
val get_page_properties : t -> session -> invocation ->
  Plugin_protocol.identity -> (Json.t, Plugin_protocol.error) result Ui_task.t
val get_today_page : t -> session -> invocation ->
  (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t
val get_block_tree : t -> session -> invocation -> Plugin_protocol.identity ->
  (Plugin_protocol.entity option, Plugin_protocol.error) result Ui_task.t
val get_page_linked_references : t -> session -> invocation -> Plugin_protocol.identity ->
  ((Plugin_protocol.entity * Plugin_protocol.entity list) list option, Plugin_protocol.error) result Ui_task.t
val accept_program : t -> session -> invocation -> Plugin_protocol.program ->
  (Plugin_protocol.program, Plugin_protocol.error) result
val cancel : t -> invocation -> unit
val close_session : t -> session -> unit
