val is_logseq_property_namespace : string option -> bool
val is_user_property_namespace : string -> bool
val is_plugin_property_namespace : string option -> bool

val is_internal_property :
  namespace_:string option -> ident:string -> is_keyword:bool -> bool

val is_property :
  namespace_:string option -> ident:string -> is_keyword:bool -> bool

val visible_entries :
  namespace_of:('key -> string option) ->
  ident_of:('key -> string) ->
  is_keyword:('key -> bool) ->
  ('key * 'value) Rrbvec.t ->
  ('key * 'value) Rrbvec.t

val valid_property_name : string -> bool

val built_in_i18n_key :
  namespace_:string option -> name:string -> (string * string) option

val built_in_i18n_key_for_ident : string -> (string * string) option
val built_in_has_ref_value : string -> bool
