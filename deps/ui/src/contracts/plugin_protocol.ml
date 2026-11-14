type plugin_id = string
type callback_id = { owner : int; slot : int }
type command_descriptor = { key : string; label : string }
type command_handle = { plugin : plugin_id; generation : int; descriptor : command_descriptor }
type editing_context = { block_uuid : string; text : string }
type entity = Json.t
type page_result = Json.t
type query = { text : string; inputs : Json.t array }
type action = Insert_text of string | Show_date_picker | Exit_editing
type program = action list
type identity = Entity_id of int | Uuid of string | Page_name of string
type sibling_direction = Previous_sibling | Next_sibling
type insertion_position = First_child | Last_child | Before | After
type insert_options = { position : insertion_position; custom_uuid : string option }
type property_key = string
type property_value = Text_value of string | Number_value of float | Checkbox_value of bool
type property_patch = (property_key * property_value option) list
type move_position = Move_before | Move_after | Move_into
type mutation =
  | Insert_block of identity * string * insert_options
  | Update_block of identity * string * property_patch
  | Upsert_block_property of identity * property_key * property_value
  | Remove_block_property of identity * property_key
  | Remove_block of identity
  | Move_block of identity * identity * move_position
  | Create_page of string * string option
  | Rename_page of identity * string
  | Delete_page of identity
type log_level = Log_debug | Log_info | Log_warn | Log_error
type capability = Editor_read | Editor_command | Graph_read | Db_query | Graph_write
type request =
  | Get_editing_context
  | Get_plugin_info
  | Get_editing_state
  | Get_current_block
  | Get_current_page
  | Get_block of identity
  | Get_page of identity
  | Get_sibling_block of sibling_direction * identity
  | Get_block_properties of identity
  | Get_page_blocks_tree of identity
  | Get_block_children of identity
  | Mutate of mutation
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
  | Properties of Json.t
  | Mutation_applied
  | Blocks of entity list
  | Page_renamed
type error =
  | Invalid_request
  | Unsupported
  | Permission_denied
  | Stale_context
  | Cancelled
  | Resource_limit
  | Runtime_failure

let max_message_bytes = 65536
let max_string_bytes = 32768
let max_nodes = 4096
let max_depth = 16
let max_calls = 32
let ( let* ) = Result.bind

let valid_utf8 text =
  let length = String.length text in
  let byte i = Char.code text.[i] in
  let between i lo hi = i < length && byte i >= lo && byte i <= hi in
  let continuation i = between i 0x80 0xbf in
  let rec loop i =
    if i = length then true
    else
      let first = byte i in
      if first < 0x80 then loop (i + 1)
      else if first >= 0xc2 && first <= 0xdf then
        continuation (i + 1) && loop (i + 2)
      else if first >= 0xe0 && first <= 0xef then
        let lo, hi =
          if first = 0xe0 then 0xa0, 0xbf
          else if first = 0xed then 0x80, 0x9f
          else 0x80, 0xbf
        in
        between (i + 1) lo hi && continuation (i + 2) && loop (i + 3)
      else if first >= 0xf0 && first <= 0xf4 then
        let lo, hi =
          if first = 0xf0 then 0x90, 0xbf
          else if first = 0xf4 then 0x80, 0x8f
          else 0x80, 0xbf
        in
        between (i + 1) lo hi && continuation (i + 2)
        && continuation (i + 3) && loop (i + 4)
      else false
  in
  loop 0

let validate_value value =
  let nodes = ref 0 and bytes = ref 0 in
  let string text =
    bytes := !bytes + String.length text;
    if String.length text > max_string_bytes || !bytes > max_message_bytes then
      Error Resource_limit
    else if valid_utf8 text then Ok () else Error Invalid_request
  in
  let rec visit depth value =
    incr nodes;
    bytes := !bytes + 16;
    if depth > max_depth || !nodes > max_nodes || !bytes > max_message_bytes then
      Error Resource_limit
    else match value with
      | Json.Null | Json.Bool _ -> Ok ()
      | Json.Number n -> if Float.is_finite n then Ok () else Error Invalid_request
      | Json.String text -> string text
      | Json.Array values ->
          let rec loop i =
            if i = Array.length values then Ok ()
            else let* () = visit (depth + 1) values.(i) in loop (i + 1)
          in
          if Array.length values > max_nodes then Error Resource_limit else loop 0
      | Json.Object fields ->
          let seen = Hashtbl.create 8 in
          let rec loop = function
            | [] -> Ok ()
            | (key, value) :: rest ->
                if Hashtbl.mem seen key then Error Invalid_request
                else begin
                  Hashtbl.add seen key ();
                  let* () = string key in
                  let* () = visit (depth + 1) value in
                  loop rest
                end
          in
          loop fields
  in
  visit 0 value

let plugin_id id =
  if String.length id = 0 || String.length id > 128 then Error Invalid_request
  else if String.for_all (function
    | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '-' | '_' | '.' -> true
    | _ -> false) id then Ok id
  else Error Invalid_request

let callback_id ~owner = { owner; slot = 0 }
let command_callback_id ~owner ~slot =
  if slot < 1 || slot > max_calls then Error Invalid_request
  else Ok { owner; slot }
let callback_slot callback = callback.slot
let plugin_id_value id = id
let owns_callback ~owner callback = owner = callback.owner

let command_descriptor value =
  let* () = validate_value value in
  match value with
  | Json.Object fields when List.length fields = 2 ->
      (match Json.get "key" value, Json.get "label" value with
      | Some (Json.String key), Some (Json.String label) ->
          let rec controls index =
            index < String.length label &&
            (Char.code label.[index] < 32 || Char.code label.[index] = 127 ||
             (Char.code label.[index] = 194 && index + 1 < String.length label &&
              Char.code label.[index + 1] >= 128 && Char.code label.[index + 1] <= 159) ||
             controls (index + 1)) in
          if String.length key > 64 || String.length label > 128 then Error Resource_limit
          else if key = "" || label = "" ||
            not (String.for_all (function
              | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '-' | '_' | '.' -> true
              | _ -> false) key) ||
            controls 0
          then Error Invalid_request
          else Ok { key; label }
      | _ -> Error Invalid_request)
  | _ -> Error Invalid_request

let command_key descriptor = descriptor.key
let command_label descriptor = descriptor.label
let command_handle ~id ~generation descriptor = { plugin = id; generation; descriptor }
let command_plugin handle = handle.plugin
let command_generation handle = handle.generation
let command_metadata handle = handle.descriptor

let editing_context ~block_uuid ~text =
  let uuid_valid = String.length block_uuid = 36 &&
    String.for_all (function
      | 'a' .. 'f' | 'A' .. 'F' | '0' .. '9' | '-' -> true
      | _ -> false) block_uuid &&
    let rec check i =
      if i = 36 then true
      else if (block_uuid.[i] = '-') = List.mem i [8; 13; 18; 23]
      then check (i + 1) else false
    in check 0
  in
  if not uuid_valid then Error Invalid_request
  else let* () = validate_value (Json.String text) in Ok { block_uuid; text }

let editing_context_value context =
  Json.Object ["blockUuid", Json.String context.block_uuid; "text", Json.String context.text]

let entity value =
  let* () = validate_value value in
  match value with
  | Json.Object _ ->
      (match Json.get "id" value, Json.get "uuid" value with
      | Some (Json.Number id), Some (Json.String uuid)
        when id >= 1. && id <= 2147483647. && Float.floor id = id ->
          let* _ = editing_context ~block_uuid:uuid ~text:"" in
          Ok value
      | _ -> Error Invalid_request)
  | _ -> Error Invalid_request

let query ~text ~inputs =
  if String.length text = 0 then Error Invalid_request
  else
    let* () = validate_value (Json.Array [|Json.String text; Json.Array inputs|]) in
    Ok { text; inputs = Array.copy inputs }

let page_result value =
  let* () = validate_value value in
  match value with
  | Json.Null -> Ok value
  | Json.Object fields ->
      (match Json.get "id" value with
       | Some _ -> entity value
       | None ->
           match fields, Json.get "title" value, Json.get "name" value with
           | [_; _], Some (Json.String title), Some (Json.String name)
             when title = name -> Ok value
           | _ -> Error Invalid_request)
  | _ -> Error Invalid_request

let query_text query = query.text
let query_inputs query = Array.copy query.inputs

let decode_identity ~page = function
  | Json.Number id when id >= 1. && id <= 2147483647. && Float.floor id = id ->
      Ok (Entity_id (int_of_float id))
  | Json.Object ["uuid", Json.String uuid] ->
      let* _ = editing_context ~block_uuid:uuid ~text:"" in
      Ok (Uuid uuid)
  | Json.String text when String.length text > 0 ->
      (match editing_context ~block_uuid:text ~text:"" with
      | Ok _ -> Ok (Uuid text)
      | Error _ when page -> Ok (Page_name text)
      | Error error -> Error error)
  | _ -> Error Invalid_request

let property_key key =
  if String.length key > 64 then Error Resource_limit
  else if String.length key = 0 || not (String.for_all (function
    | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '_' | '-' -> true
    | _ -> false) key) then Error Invalid_request
  else Ok key

let property_key_value key = key
let insertion_position options = options.position
let custom_uuid options = options.custom_uuid

let insert_options value =
  let* () = validate_value value in
  match value with
  | Json.Object fields ->
      let rec validate = function
        | [] -> Ok ()
        | ("customUUID", Json.String uuid) :: rest ->
            let* _ = editing_context ~block_uuid:uuid ~text:"" in validate rest
        | (("before" | "sibling" | "start" | "end"), Json.Bool _) :: rest -> validate rest
        | (("before" | "sibling" | "start" | "end" | "customUUID"), _) :: _ -> Error Invalid_request
        | (("properties" | "schema" | "autoOrderedList"), _) :: _ -> Error Unsupported
        | _ :: _ -> Error Invalid_request in
      let* () = validate fields in
      let flag name = Json.get name value = Some (Json.Bool true) in
      let before = flag "before" and sibling = flag "sibling"
      and start = flag "start" and finish = flag "end" in
      if (start && finish) || ((before || sibling) && (start || finish)) then Error Invalid_request
      else Ok { position = (if before then Before else if sibling then After
                             else if start then First_child else Last_child);
                custom_uuid = (match Json.get "customUUID" value with
                  | Some (Json.String uuid) -> Some uuid | _ -> None) }
  | _ -> Error Invalid_request

let decode_property_value = function
  | Json.String value -> Ok (Text_value value)
  | Json.Number value -> Ok (Number_value value)
  | Json.Bool value -> Ok (Checkbox_value value)
  | Json.Null -> Error Invalid_request
  | Json.Array _ | Json.Object _ -> Error Unsupported

let property_patch value =
  match value with
  | Json.Object fields when List.length fields <= max_calls ->
      let rec collect result = function
        | [] -> Ok (List.rev result)
        | (key, value) :: rest ->
            let* key = property_key key in
            let* value = match value with Json.Null -> Ok None
              | _ -> Result.map Option.some (decode_property_value value) in
            collect ((key, value) :: result) rest in
      collect [] fields
  | Json.Object _ -> Error Resource_limit
  | _ -> Error Invalid_request

let page_title text =
  if String.trim text = "" || String.exists (fun c -> Char.code c < 32 || c = '\127') text
  then Error Invalid_request else Ok text

let create_options = function
  | Json.Object fields ->
      let rec parse uuid = function
        | [] -> Ok uuid
        | ("customUUID", Json.String value) :: rest ->
            let* _ = editing_context ~block_uuid:value ~text:"" in parse (Some value) rest
        | ("redirect", Json.Bool false) :: rest -> parse uuid rest
        | (("redirect" | "journal" | "class" | "schema"), _) :: _ -> Error Unsupported
        | _ -> Error Invalid_request in
      parse None fields
  | _ -> Error Invalid_request

let move_options = function
  | Json.Object fields as value ->
      if List.exists (function ("before" | "children"), Json.Bool _ -> false | _ -> true) fields
      then Error Invalid_request
      else let before = Json.get "before" value = Some (Json.Bool true)
           and children = Json.get "children" value = Some (Json.Bool true) in
        if before && children then Error Invalid_request
        else Ok (if before then Move_before else if children then Move_into else Move_after)
  | _ -> Error Invalid_request

let decode_request ~operation value =
  let* () = validate_value value in
  match operation, value with
  | 0, Json.Array [||] -> Ok Get_editing_context
  | 1, Json.Array [||] -> Ok Get_plugin_info
  | 2, Json.Array [||] -> Ok Get_editing_state
  | 3, Json.Array [||] -> Ok Get_current_block
  | 4, Json.Array [||] -> Ok Get_current_page
  | 5, Json.Array [|value|] ->
      let* identity = decode_identity ~page:false value in Ok (Get_block identity)
  | 6, Json.Array [|value|] ->
      let* identity = decode_identity ~page:true value in Ok (Get_page identity)
  | 7, Json.Array [|Json.String text; Json.Array inputs|] ->
      let* query = query ~text ~inputs in Ok (Datascript_query query)
  | 10, Json.Array [|Json.String direction; value|] ->
      let* relation = match direction with
        | "previous" -> Ok Previous_sibling
        | "next" -> Ok Next_sibling
        | _ -> Error Invalid_request in
      let* identity = decode_identity ~page:false value in
      Ok (Get_sibling_block (relation, identity))
  | 11, Json.Array [|value|] ->
      let* identity = decode_identity ~page:false value in Ok (Get_block_properties identity)
  | 12, Json.Array [|value; Json.String text; options|] ->
      let* identity = decode_identity ~page:false value in
      let* options = insert_options options in Ok (Mutate (Insert_block (identity, text, options)))
  | 13, Json.Array [|value; Json.String text; properties|] ->
      let* identity = decode_identity ~page:false value in
      let* properties = property_patch properties in Ok (Mutate (Update_block (identity, text, properties)))
  | 14, Json.Array [|value; Json.String key; property_value|] ->
      let* identity = decode_identity ~page:false value in
      let* key = property_key key in
      let* property_value = decode_property_value property_value in
      Ok (Mutate (Upsert_block_property (identity, key, property_value)))
  | 15, Json.Array [|value; Json.String key|] ->
      let* identity = decode_identity ~page:false value in
      let* key = property_key key in Ok (Mutate (Remove_block_property (identity, key)))
  | 16, Json.Array [|value|] ->
      let* identity = decode_identity ~page:true value in Ok (Get_page_blocks_tree identity)
  | 17, Json.Array [|value|] ->
      let* identity = decode_identity ~page:false value in Ok (Get_block_children identity)
  | 18, Json.Array [|value|] ->
      let* identity = decode_identity ~page:false value in Ok (Mutate (Remove_block identity))
  | 19, Json.Array [|source; target; options|] ->
      let* source = decode_identity ~page:false source in
      let* target = decode_identity ~page:false target in
      let* position = move_options options in Ok (Mutate (Move_block (source, target, position)))
  | 20, Json.Array [|Json.String title; options|] ->
      let* title = page_title title in
      let* uuid = create_options options in Ok (Mutate (Create_page (title, uuid)))
  | 21, Json.Array [|value; Json.String title|] ->
      let* identity = decode_identity ~page:true value in
      let* title = page_title title in Ok (Mutate (Rename_page (identity, title)))
  | 22, Json.Array [|value|] ->
      let* identity = decode_identity ~page:true value in Ok (Mutate (Delete_page identity))
  | 8, Json.Array [|Json.String level; Json.String text|] ->
      if String.length text > 8192 then Error Resource_limit
      else
        (match level with
        | "debug" -> Ok (Log (Log_debug, text))
        | "info" -> Ok (Log (Log_info, text))
        | "warn" -> Ok (Log (Log_warn, text))
        | "error" -> Ok (Log (Log_error, text))
        | _ -> Error Invalid_request)
  | (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11 | 12 | 13 | 14 | 15
     | 16 | 17 | 18 | 19 | 20 | 21 | 22), _ -> Error Invalid_request
  | _ -> Error Unsupported

let capability_name = function
  | Editor_read -> "editor_read"
  | Editor_command -> "editor_command"
  | Graph_read -> "graph_read"
  | Db_query -> "db_query"
  | Graph_write -> "graph_write"

let reply_value = function
  | Editing_context context -> editing_context_value context
  | Plugin_info (id, capabilities) ->
      let normalized_capabilities = List.sort_uniq Stdlib.compare capabilities in
      Json.Object ["id", Json.String id; "runtime", Json.String "quickjs";
        "grantedCapabilities", Json.Array (Array.of_list
          (List.map (fun capability -> Json.String (capability_name capability)) normalized_capabilities))]
  | Editing_state (Some context) -> editing_context_value context
  | Block (Some entity) | Page (Some entity) -> entity
  | Editing_state None | Block None | Page None | Logged | Editor_command_registered -> Json.Null
  | Current_page value | Query_result value | Properties value -> value
  | Mutation_applied -> Json.Null
  | Blocks entities -> Json.Array (Array.of_list entities)
  | Page_renamed -> Json.Bool true

let program actions =
  let rec loop count bytes = function
    | [] -> Ok actions
    | _ when count >= max_calls -> Error Resource_limit
    | Insert_text text :: rest ->
        let bytes = bytes + String.length text in
        if bytes > max_message_bytes then Error Resource_limit
        else let* () = validate_value (Json.String text) in loop (count + 1) bytes rest
    | [Show_date_picker] | [Exit_editing] -> Ok actions
    | (Show_date_picker | Exit_editing) :: _ -> Error Invalid_request
  in
  loop 0 0 actions

let decode_program value =
  let* () = validate_value value in
  let decode = function
    | Json.Object fields ->
        (match Json.get "kind" (Json.Object fields) with
        | Some (Json.String "insertText") ->
            (match fields, Json.get "text" (Json.Object fields) with
            | [_; _], Some (Json.String text) -> Ok (Insert_text text)
            | _ -> Error Invalid_request)
        | Some (Json.String "showDatePicker") when List.length fields = 1 -> Ok Show_date_picker
        | Some (Json.String "exitEditing") when List.length fields = 1 -> Ok Exit_editing
        | Some (Json.String ("showDatePicker" | "exitEditing")) -> Error Invalid_request
        | Some (Json.String _) -> Error Unsupported
        | _ -> Error Invalid_request)
    | _ -> Error Invalid_request
  in
  match value with
  | Json.Array values when Array.length values <= max_calls ->
      let rec loop i acc =
        if i = Array.length values then program (List.rev acc)
        else let* action = decode values.(i) in loop (i + 1) (action :: acc)
      in loop 0 []
  | Json.Array _ -> Error Resource_limit
  | _ -> Error Invalid_request

let actions program = program
let error_name = function
  | Invalid_request -> "Invalid_request"
  | Unsupported -> "Unsupported"
  | Permission_denied -> "Permission_denied"
  | Stale_context -> "Stale_context"
  | Cancelled -> "Cancelled"
  | Resource_limit -> "Resource_limit"
  | Runtime_failure -> "Runtime_failure"

let error_of_code = function
  | 0 -> Invalid_request
  | 1 -> Unsupported
  | 2 -> Permission_denied
  | 3 -> Stale_context
  | 4 -> Cancelled
  | 5 -> Resource_limit
  | 6 -> Runtime_failure
  | _ -> invalid_arg "Unknown plugin bridge error code"
