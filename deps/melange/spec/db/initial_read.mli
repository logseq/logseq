type hidden_ref_input = {
  self : bool;
  page_self : bool;
  view_self : bool;
  hidden_page : bool;
  hidden_block : bool;
  class_match : bool;
  ident_property : bool;
}

type load_status = Full | Children | Self

val oldest_id : int Rrbvec.t -> int option

val oldest_matching_id_with :
  datoms:(unit -> 'datom array) ->
  datom_id:('datom -> int) ->
  eligible:(int -> bool) ->
  int option

val expand_children :
  include_collapsed:bool -> collapsed:bool -> page:bool -> bool

val hidden_ref : hidden_ref_input -> bool

val child_load_status :
  collapsed:bool -> large_page:bool -> all_children_loaded:bool -> load_status

val block_load_status :
  children:bool ->
  include_collapsed:bool ->
  properties_empty:bool ->
  load_status

val journal :
  day:int ->
  today:int ->
  journal:bool ->
  id_present:bool ->
  recycled:bool ->
  bool

val recent_page :
  has_page_datom:bool -> blank_title:bool -> page:bool -> hidden:bool -> bool

val recent_pages_with :
  updated_datoms:(unit -> 'datom array) ->
  datom_entity:('datom -> 'id) ->
  has_page_datom:('id -> bool) ->
  title:('id -> string option) ->
  entity:('id -> 'entity) ->
  page:('entity -> bool) ->
  hidden:('entity -> bool) ->
  'entity array

val latest_journals_with :
  datoms:(unit -> 'datom array) ->
  datom_entity:('datom -> 'lookup) ->
  datom_day:('datom -> int) ->
  entity:('lookup -> 'entity option) ->
  entity_id:('entity -> 'id option) ->
  journal_entity:('entity -> bool) ->
  recycled:('entity -> bool) ->
  id_equal:('id -> 'id -> bool) ->
  today:int ->
  'entity array

val block_refs_with :
  aliases:('id -> 'id array) ->
  entity:('id -> 'entity option) ->
  entity_id:('entity -> 'id option) ->
  ident:('entity -> 'ident option) ->
  class_entity:('entity -> bool) ->
  structured_children:('id -> 'id array) ->
  references:('entity -> 'entity array) ->
  page:('entity -> 'entity option) ->
  view_for:('entity -> 'entity option) ->
  hidden:('entity -> bool) ->
  tags:('entity -> 'entity array) ->
  has_ident:('entity -> 'ident -> bool) ->
  id_equal:('id -> 'id -> bool) ->
  'id ->
  'entity array

val block_refs_count_with :
  aliases:('id -> 'id array) ->
  entity:('id -> 'entity option) ->
  entity_id:('entity -> 'id option) ->
  ident:('entity -> 'ident option) ->
  class_entity:('entity -> bool) ->
  structured_children:('id -> 'id array) ->
  ref_datoms:('id -> 'datom array) ->
  datom_entity:('datom -> 'id) ->
  page:('entity -> 'entity option) ->
  view_for:('entity -> 'entity option) ->
  hidden:('entity -> bool) ->
  tags:('entity -> 'entity array) ->
  has_ident:('entity -> 'ident -> bool) ->
  id_equal:('id -> 'id -> bool) ->
  'id ->
  int

val related_ids_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'value array -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  value_equals:('value -> 'value -> bool) ->
  relation:string ->
  root:'value ->
  rule:'value ->
  'value array

val children_ids_with :
  root:(unit -> 'entity option) ->
  entity:(int -> 'entity) ->
  entity_id:('entity -> int) ->
  collapsed:('entity -> bool) ->
  page:('entity -> bool) ->
  children:('entity -> int array) ->
  include_collapsed:bool ->
  int array option

val include_initial_attribute : string -> bool
val large_page : int -> bool
