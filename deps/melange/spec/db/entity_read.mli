type ancestor = { id : string option; hidden : bool; deleted : bool }
type entity_type = Class | Property | Journal | Page

val has_tag : string Rrbvec.t -> string -> bool
val entity_types : string Rrbvec.t -> entity_type Rrbvec.t

val pages_by_name_with :
  datoms:('attribute -> string -> 'datom array) ->
  name_attribute:'attribute ->
  normalize:(string -> string) ->
  string ->
  'datom array

val tag_ident_texts_with :
  get:('value -> string -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  is_collection:('value -> bool) ->
  is_keyword:('value -> bool) ->
  keyword_to_string:('value -> string) ->
  resolve_tag:('value -> 'value) ->
  'value ->
  string Rrbvec.t

val hidden :
  page_name:string option ->
  recognized:bool ->
  root_hidden:bool ->
  root_deleted:bool ->
  ancestor Rrbvec.t ->
  bool

val recycled : recognized:bool -> root_deleted:bool -> ancestor Rrbvec.t -> bool

val hidden_value_with :
  get:('value -> string -> 'value) ->
  is_nil:('value -> bool) ->
  is_string:('value -> bool) ->
  string_from_value:('value -> string) ->
  entity_like:('value -> bool) ->
  truthy:('value -> bool) ->
  value_to_string:('value -> string) ->
  'value ->
  bool

val recycled_value_with :
  get:('value -> string -> 'value) ->
  is_nil:('value -> bool) ->
  entity_like:('value -> bool) ->
  truthy:('value -> bool) ->
  value_to_string:('value -> string) ->
  'value ->
  bool
