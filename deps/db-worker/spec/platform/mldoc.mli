(* npm "mldoc" package JSON API (logseq/mldoc, js_of_ocaml bundle).
   All arguments and results are JSON strings, mirroring
   Mldoc.parseJson/parseInlineJson/getReferences/astExportMarkdown.

   The parser is only available on the JS target.  The native
   implementation raises [Invalid_argument] because the file-graph import
   pipeline cannot run without it. *)

exception Mldoc_error of string

val parse_json : content:string -> config:string -> string
val parse_inline_json : text:string -> config:string -> string
val get_references : text:string -> config:string -> string
val ast_export_markdown : ast:string -> config:string -> references:string -> string
