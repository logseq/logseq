type status = { ident : Cli_primitive.keyword; value : string }

val status_closed_values_query : Edn_ocaml.vector Edn_ocaml.t
val normalize_available_statuses : Edn_ocaml.any list -> status list
val resolve_status_ident : string -> status list -> Cli_primitive.keyword option
val invalid_status_message : string -> status list -> string
