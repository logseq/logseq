(* Bindings for the npm mldoc package — no mldoc wrappers exist in
   melange.js/melange.node (checked), so these externals are required. *)
external parse_json : string -> string -> string = "parseJson"
[@@mel.module "mldoc"] [@@mel.scope "Mldoc"]

external get_references : string -> string -> string = "getReferences"
[@@mel.module "mldoc"] [@@mel.scope "Mldoc"]

let config =
  let fields = Js.Dict.empty () in
  Js.Dict.set fields "toc" (Js.Json.boolean false);
  Js.Dict.set fields "parse_outline_only" (Js.Json.boolean false);
  Js.Dict.set fields "heading_number" (Js.Json.boolean false);
  Js.Dict.set fields "keep_line_break" (Js.Json.boolean true);
  Js.Dict.set fields "format" (Js.Json.string "Markdown");
  Js.Dict.set fields "heading_to_list" (Js.Json.boolean false);
  Js.Dict.set fields "enable_drawers" (Js.Json.boolean true);
  Js.Dict.set fields "parse_marker" (Js.Json.boolean false);
  Js.Dict.set fields "parse_priority" (Js.Json.boolean false);
  Js.Json.stringify (Js.Json.object_ fields)

let parse_ast text = Js.Json.parseExn (parse_json text config)
let references text = Js.Json.parseExn (get_references text config)
