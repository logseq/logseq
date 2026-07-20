type content_source = Title | Value

val is_property_created_block :
  is_map:bool ->
  has_created_from_property:bool ->
  has_page:bool ->
  has_content:bool ->
  bool

val is_many : string -> bool
val select_content_source : title_truthy:bool -> content_source
