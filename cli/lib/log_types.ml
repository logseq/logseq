type preview = { preview : string; length : int; truncated : bool }
type level = Debug | Info | Warn | Error

type record = {
  time : Ptime.t option;
  level : level;
  logger : string option;
  message : string;
  exception_ : string option;
}

let default_preview_limit = 400
let handler_installed = ref false
let verbose_enabled = ref false

let truncate_preview ?(max_len = default_preview_limit) value =
  let limit = max 0 max_len in
  let text = Edn_ocaml.to_edn_string value in
  let length = String.length text in
  let truncated = length > limit in
  let preview = if truncated then String.sub text 0 limit else text in
  { preview; length; truncated }

let install_stderr_handler () = handler_installed := true

let set_verbose verbose =
  install_stderr_handler ();
  verbose_enabled := verbose

let string_of_level = function
  | Debug -> ":debug"
  | Info -> ":info"
  | Warn -> ":warn"
  | Error -> ":error"

let level_enabled = function
  | Debug -> !verbose_enabled
  | Info | Warn | Error -> true

let escape_string value =
  let buffer = Buffer.create (String.length value) in
  String.iter
    (function
      | '\n' -> Buffer.add_string buffer "\\n"
      | '\r' -> Buffer.add_string buffer "\\r"
      | '\t' -> Buffer.add_string buffer "\\t"
      | c -> Buffer.add_char buffer c)
    value;
  Buffer.contents buffer

let preview_fields = function
  | None -> []
  | Some value ->
      let preview = truncate_preview value in
      [
        Printf.sprintf ":preview %s" (escape_string preview.preview);
        Printf.sprintf ":length %d" preview.length;
        Printf.sprintf ":truncated? %b" preview.truncated;
      ]

let log level message value =
  if !handler_installed && level_enabled level then
    let fields =
      [
        Printf.sprintf ":level %s" (string_of_level level);
        Printf.sprintf ":message %s" (escape_string message);
      ]
      @ preview_fields value
    in
    prerr_endline ("{" ^ String.concat " " fields ^ "}")
