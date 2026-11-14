type plugin_id
type callback_id
type editing_context
type program

type capability = Editor_read | Editor_command
type request = Get_editing_context
type reply = Editing_context of editing_context
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
val callback_id : owner:int -> callback_id
val owns_callback : owner:int -> callback_id -> bool
val editing_context : block_uuid:string -> text:string -> (editing_context, error) result
val reply_value : reply -> Json.t
val program : action list -> (program, error) result
val decode_program : Json.t -> (program, error) result
val actions : program -> action list
val error_name : error -> string
val error_of_code : int -> error
