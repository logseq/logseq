type memo_plan = Return_none | Cached | Direct

type lookup_action =
  | Journal_title
  | Raw_title
  | Properties
  | Property_keys
  | Title
  | Filtered_parent
  | Raw_parent
  | Closed_values
  | Default_lookup

val nil_idents : string Rrbvec.t
val immutable_idents : string Rrbvec.t
val nil_ident : string -> bool
val immutable_ident : string -> bool

val memo_plan :
  qualified:bool -> node:bool -> cache_enabled:bool -> string -> memo_plan

val lookup_action : db_based:bool -> journal:bool -> string -> lookup_action
val default_attribute : checkbox:bool -> string
