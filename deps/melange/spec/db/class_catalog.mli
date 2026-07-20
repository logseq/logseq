type property_value =
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | Icon of { icon_type : string; id : string }

type entry

val ident : entry -> string
val title : entry -> string
val properties : entry -> (string * property_value) Rrbvec.t
val schema_properties : entry -> string Rrbvec.t
val required_properties : entry -> string Rrbvec.t
val entries : entry Rrbvec.t
val page_children_classes : string Rrbvec.t
val page_classes : string Rrbvec.t
val internal_tags : string Rrbvec.t
val private_tags : string Rrbvec.t
val block_kind_tags : string Rrbvec.t
val disallowed_inline_tags : string Rrbvec.t
val extends_hidden_tags : string Rrbvec.t
val hidden_tags : string Rrbvec.t
