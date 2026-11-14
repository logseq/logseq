type plugin_id
type callback_id
type command_descriptor
type command_handle
type editing_context
type entity
type page_result
type query
type program

type identity = Entity_id of int | Uuid of string | Page_name of string
type sibling_direction = Previous_sibling | Next_sibling
type log_level = Log_debug | Log_info | Log_warn | Log_error
type capability = Editor_read | Editor_command | Graph_read | Db_query
type request =
  | Get_editing_context
  | Get_plugin_info
  | Get_editing_state
  | Get_current_block
  | Get_current_page
  | Get_block of identity
  | Get_page of identity
  | Get_sibling_block of sibling_direction * identity
  | Datascript_query of query
  | Log of log_level * string
  | Register_editor_command of command_descriptor * callback_id
type reply =
  | Editing_context of editing_context
  | Plugin_info of plugin_id * capability list
  | Editing_state of editing_context option
  | Block of entity option
  | Page of entity option
  | Current_page of page_result
  | Query_result of Json.t
  | Logged
  | Editor_command_registered
type action = Insert_text of string | Show_date_picker | Exit_editing
type error =
  | Invalid_request
  | Unsupported
  | Permission_denied
  | Stale_context
  | Cancelled
  | Resource_limit
  | Runtime_failure

val max_message_bytes : int
val max_string_bytes : int
val max_nodes : int
val max_depth : int
val max_calls : int
val valid_utf8 : string -> bool
val validate_value : Json.t -> (unit, error) result
val plugin_id : string -> (plugin_id, error) result
val plugin_id_value : plugin_id -> string
val callback_id : owner:int -> callback_id
val command_callback_id : owner:int -> slot:int -> (callback_id, error) result
val callback_slot : callback_id -> int
val command_descriptor : Json.t -> (command_descriptor, error) result
val command_key : command_descriptor -> string
val command_label : command_descriptor -> string
val command_handle : id:plugin_id -> generation:int -> command_descriptor -> command_handle
val command_plugin : command_handle -> plugin_id
val command_generation : command_handle -> int
val command_metadata : command_handle -> command_descriptor
val owns_callback : owner:int -> callback_id -> bool
val editing_context : block_uuid:string -> text:string -> (editing_context, error) result
val entity : Json.t -> (entity, error) result
val page_result : Json.t -> (page_result, error) result
val query : text:string -> inputs:Json.t array -> (query, error) result
val query_text : query -> string
val query_inputs : query -> Json.t array
val decode_request : operation:int -> Json.t -> (request, error) result
val reply_value : reply -> Json.t
val program : action list -> (program, error) result
val decode_program : Json.t -> (program, error) result
val actions : program -> action list
val error_name : error -> string
val error_of_code : int -> error
