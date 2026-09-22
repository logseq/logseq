(* npm "mldoc" package JSON API (logseq/mldoc, js_of_ocaml bundle).
   All arguments and results are JSON strings, mirroring
   Mldoc.parseJson/parseInlineJson/getReferences/astExportMarkdown.

   The JS implementation binds the npm bundle; the native implementation
   binds the same OCaml mldoc library directly and mirrors its
   error-fallback semantics. *)

exception Mldoc_error of string

val parse_json : content:string -> config:string -> string
val parse_inline_json : text:string -> config:string -> string
val get_references : text:string -> config:string -> string
val ast_export_markdown : ast:string -> config:string -> references:string -> string
