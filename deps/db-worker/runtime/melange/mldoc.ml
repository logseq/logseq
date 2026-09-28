(* Melange implementation of spec/platform/mldoc.mli via the npm "mldoc"
   package (js_of_ocaml bundle exposing a Mldoc object with JSON-string
   in/out functions). *)

exception Mldoc_error of string

type mldoc_obj

external mldoc : mldoc_obj = "Mldoc" [@@mel.module "mldoc"]

external parse_json_raw : mldoc_obj -> string -> string -> string
  = "parseJson" [@@mel.send]

external parse_inline_json_raw : mldoc_obj -> string -> string -> string
  = "parseInlineJson" [@@mel.send]

external get_references_raw : mldoc_obj -> string -> string -> string
  = "getReferences" [@@mel.send]

external ast_export_markdown_raw : mldoc_obj -> string -> string -> string -> string
  = "astExportMarkdown" [@@mel.send]

let call f a b =
  try f mldoc a b
  with Js.Exn.Error e ->
    raise
      (Mldoc_error
         (Js.Exn.message e |> Option.value ~default:"mldoc call failed"))

let call3 f a b c =
  try f mldoc a b c
  with Js.Exn.Error e ->
    raise
      (Mldoc_error
         (Js.Exn.message e |> Option.value ~default:"mldoc call failed"))

let parse_json ~content ~config = call parse_json_raw content config
let parse_inline_json ~text ~config = call parse_inline_json_raw text config
let get_references ~text ~config = call get_references_raw text config

let ast_export_markdown ~ast ~config ~references =
  call3 ast_export_markdown_raw ast config references
