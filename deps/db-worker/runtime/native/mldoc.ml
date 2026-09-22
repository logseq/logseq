(* Native implementation of spec/platform/mldoc.mli.
   The npm "mldoc" bundle cannot run on the native target, so every entry
   point fails fast — the file-graph import endpoint is JS-only for now. *)

exception Mldoc_error of string

let unavailable () = invalid_arg "Mldoc is not available on the native target"

let parse_json ~content:_ ~config:_ = unavailable ()
let parse_inline_json ~text:_ ~config:_ = unavailable ()
let get_references ~text:_ ~config:_ = unavailable ()
let ast_export_markdown ~ast:_ ~config:_ ~references:_ = unavailable ()
