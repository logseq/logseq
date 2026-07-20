type form = Datalog_form.t =
  | Symbol of string
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | List_form of form Rrbvec.t
  | Vector_form of form Rrbvec.t

type entry
type dependency

val entry_name : entry -> string
val entry_body : entry -> form
val dependency_name : dependency -> string
val dependency_names : dependency -> string Rrbvec.t
val dependency : string -> string Rrbvec.t -> dependency
val rules : entry Rrbvec.t
val db_query_dsl_rules : entry Rrbvec.t
val rules_dependencies : dependency Rrbvec.t
val find_body : string -> form
val find_query_body : string -> form
val extract_query_rules : string Rrbvec.t -> form Rrbvec.t

val full_dependencies :
  string Rrbvec.t -> dependency Rrbvec.t -> string Rrbvec.t
