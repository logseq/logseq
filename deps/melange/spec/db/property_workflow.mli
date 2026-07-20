val value_content_with :
  get:('entity -> string -> 'value) ->
  truthy:('value -> bool) ->
  'entity ->
  'value

val lookup_with :
  get:('block -> 'ident -> 'value) ->
  has_ref_value:('ident -> bool) ->
  content:('value -> 'value) ->
  'block ->
  'ident ->
  'value

val built_in_display_title_with :
  get:('entity -> string -> 'value) ->
  ident_text:('value -> string option) ->
  translate:(string -> 'value) ->
  truthy:('value -> bool) ->
  value_to_string:('value -> string) ->
  'entity ->
  'value

val block_property_value_with :
  entity:('database -> 'id -> 'block option) ->
  block_id:('block -> 'id) ->
  lookup:('block -> 'ident -> 'value) ->
  'database option ->
  'block ->
  'ident ->
  'value option
