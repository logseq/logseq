type status = { ident : Cli_primitive.keyword; value : string }

val status_closed_values_query : Melange_edn.vector Melange_edn.t
val normalize_available_statuses : Melange_edn.any list -> status list
val resolve_status_ident : string -> status list -> Cli_primitive.keyword option
val invalid_status_message : string -> status list -> string
