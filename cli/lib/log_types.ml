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
let verbose_enabled = ref false

let truncate_preview ?(max_len = default_preview_limit) value =
  let limit = max 0 max_len in
  let text = Melange_edn.to_edn_string value in
  let length = String.length text in
  let truncated = length > limit in
  let preview = if truncated then String.sub text 0 limit else text in
  { preview; length; truncated }

let install_stderr_handler () = handler_installed := true

let set_verbose verbose =
  install_stderr_handler ();
  verbose_enabled := verbose

let level_value = function
  | Debug -> Edn_util.keyword "debug"
  | Info -> Edn_util.keyword "info"
  | Warn -> Edn_util.keyword "warn"
  | Error -> Edn_util.keyword "error"

let level_enabled = function
  | Debug -> !verbose_enabled
  | Info | Warn | Error -> true

let preview_fields = function
  | None -> []
  | Some value ->
      let preview = truncate_preview value in
      [
        (Edn_util.keyword "preview", Edn_util.string preview.preview);
        (Edn_util.keyword "length", Edn_util.int preview.length);
        (Edn_util.keyword "truncated?", Edn_util.bool preview.truncated);
      ]

let log level message value =
  if !handler_installed && level_enabled level then
    let fields =
      [
        (Edn_util.keyword "level", level_value level);
        (Edn_util.keyword "message", Edn_util.string message);
      ]
      @ preview_fields value
    in
    prerr_endline (Melange_edn.to_edn_string (Edn_util.map fields))
