val built_in_class_property :
  class_built_in:bool ->
  class_value:bool ->
  property_built_in:bool ->
  property_ident:string ->
  schema_properties:string Rrbvec.t ->
  bool

val private_built_in_page :
  property:bool ->
  public_property:bool ->
  class_value:bool ->
  internal_page:bool ->
  bool

val page_title : string Rrbvec.t -> string -> string

type extend = { title : string option; built_in : bool }

val class_title_with_extends :
  title:string option -> extend Rrbvec.t -> string option

val class_instance :
  class_id:string ->
  tag_ids:string Rrbvec.t ->
  parent_ids:string Rrbvec.t ->
  bool

val inline_tag : string -> string -> bool
val node_display_type_classes : string Rrbvec.t
val class_ident_by_display_type : string -> string option
val display_type_by_class_ident : string -> string option
val library : built_in:bool -> title:string -> library_title:string -> bool
