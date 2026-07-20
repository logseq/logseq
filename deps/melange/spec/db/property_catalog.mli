type scalar =
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | Int of int

type icon = { icon_type : string; id : string }
type closed_value_properties = Absent | Nil | Checkbox of bool
type closed_value
type schema
type entry

val ident : entry -> string
val title : entry -> string option
val attribute : entry -> string option
val schema : entry -> schema
val queryable : entry -> bool option
val properties : entry -> (string * scalar) Rrbvec.t
val closed_values : entry -> closed_value Rrbvec.t
val rtc_ignore_attr_when_syncing : entry -> bool
val schema_property_type : schema -> string
val schema_cardinality : schema -> string option
val schema_hide : schema -> bool option
val schema_public : schema -> bool option
val schema_view_context : schema -> string option
val schema_ui_position : schema -> string option
val schema_classes : schema -> string Rrbvec.t
val closed_value_ident : closed_value -> string
val closed_value_value : closed_value -> string
val closed_value_uuid : closed_value -> string
val closed_value_icon : closed_value -> icon option
val closed_value_properties : closed_value -> closed_value_properties
val entries : entry Rrbvec.t
val public_built_in_properties : string Rrbvec.t
val db_attribute_properties : string Rrbvec.t
val private_db_attribute_properties : string Rrbvec.t
val public_db_attribute_properties : string Rrbvec.t
val read_only_properties : string Rrbvec.t
val schema_properties_map : (string * string) Rrbvec.t
val schema_properties : string Rrbvec.t

val schema_entries :
  ident_of:('key -> string) ->
  ('key * 'value) Rrbvec.t ->
  ('key * 'value) Rrbvec.t

val logseq_property_namespaces : string Rrbvec.t
