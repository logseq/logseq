type plugin_id = string
type callback_id = { owner : int }
type editing_context = { block_uuid : string; text : string }
type action = Insert_text of string | Show_date_picker | Exit_editing
type program = action list
type capability = Editor_read | Editor_command
type request = Get_editing_context
type reply = Editing_context of editing_context
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

let callback_id ~owner = { owner }
let owns_callback ~owner callback = owner = callback.owner

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

let reply_value (Editing_context context) =
  Json.Object ["blockUuid", Json.String context.block_uuid; "text", Json.String context.text]

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
