type preview = { preview : string; length : int; truncated : bool }
type level = Debug | Info | Warn | Error

type record = {
  time : Js.Date.t option;
  level : level;
  logger : string option;
  message : string;
  exception_ : string option;
}

let default_preview_limit = 400
let handler_installed = ref false

let truncate_preview ?(max_len = default_preview_limit) value =
  let limit = max 0 max_len in
  let text =
    match Edn_util.as_string value with
    | Some value -> value
    | None -> Melange_edn_melange.to_edn_string value
  in
  let length = String.length text in
  let truncated = length > limit in
  let preview = if truncated then String.sub text 0 limit else text in
  { preview; length; truncated }

let install_stderr_handler () = handler_installed := true
