type status = { ident : Cli_primitive.keyword; value : string }

val status_closed_values_query :
  Melange_edn_melange.vector Melange_edn_melange.t

val normalize_available_statuses :
  Melange_edn_melange.any Rrbvec.t -> status Rrbvec.t

val resolve_status_ident :
  string -> status Rrbvec.t -> Cli_primitive.keyword option

val invalid_status_message : string -> status Rrbvec.t -> string
