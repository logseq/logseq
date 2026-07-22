type entry = { name : string; body : Datalog_form.t }
type dependency = { name : string; dependencies : string Rrbvec.t }

val rules : entry Rrbvec.t
val db_query_dsl_rules : entry Rrbvec.t
val rules_dependencies : dependency Rrbvec.t
