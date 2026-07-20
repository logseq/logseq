type orphan_candidate = {
  empty_refs : bool;
  empty_or_placeholder : bool;
  built_in : bool;
  property : bool;
  namespaced_non_journal : bool;
  has_properties : bool;
  hidden : bool;
}

type ('entity, 'id) library_capabilities = {
  library_page : unit -> 'entity option;
  eligible_page : 'entity -> bool;
  library_entity_id : 'entity -> 'id;
  library_equal_id : 'id -> 'id -> bool;
  library_parent : 'entity -> 'entity option;
}

type ('entity, 'lookup) page_lookup_capabilities = {
  page_by_id : 'lookup -> 'entity option;
  page_by_uuid : 'lookup -> 'entity option;
  oldest_page_by_name : string -> 'lookup option;
  oldest_page_by_title : string -> 'lookup option;
  parse_page_uuid : string -> 'lookup option;
}

type 'lookup page_reference =
  | Page_id of 'lookup
  | Page_uuid of 'lookup
  | Page_name of string

type ('entity, 'lookup) direct_child_capabilities = {
  direct_lookup : ('entity, 'lookup) page_lookup_capabilities;
  direct_children : 'entity -> 'entity Rrbvec.t;
  direct_children_present : 'entity -> bool;
  direct_collapsed : 'entity -> bool;
  direct_order : 'entity -> string;
  direct_id : 'entity -> 'lookup;
}

type ('entity, 'reference) orphan_capabilities = {
  orphan_default_pages : unit -> 'reference Rrbvec.t;
  orphan_resolve_page : 'reference -> 'entity option;
  orphan_empty_refs : 'entity -> bool;
  orphan_direct_children : 'entity -> 'entity Rrbvec.t;
  orphan_page_children_count : 'entity -> int;
  orphan_name : 'entity -> string;
  orphan_title : 'entity -> string;
  orphan_order : 'entity -> string;
  orphan_property : 'entity -> bool;
  orphan_journal : 'entity -> bool;
  orphan_has_properties : 'entity -> bool;
  orphan_hidden : 'entity -> bool;
}

type ('entity, 'id) page_order_capabilities = {
  order_entity : 'id -> 'entity option;
  order_id : 'entity -> 'id;
  order_equal_id : 'id -> 'id -> bool;
  order_page : 'entity -> 'entity option;
  order_parent : 'entity -> 'entity option;
  order_left_sibling : 'entity -> 'entity option;
  order_right_sibling : 'entity -> 'entity option;
  ordered_page_blocks : 'id -> 'entity Rrbvec.t;
}

val case_sensitive_page_lookup : string Rrbvec.t -> bool
val orphan : orphan_candidate -> bool

val alias_source_page_with :
  entity:('id -> 'entity option) ->
  aliases:('entity -> 'page Rrbvec.t) ->
  'id option ->
  'page option

val page_alias_set :
  equal:('id -> 'id -> bool) -> 'id -> 'id Rrbvec.t -> 'id Rrbvec.t

val hidden_or_internal_tag :
  hidden:('entity -> bool) ->
  internal_ident:('entity -> bool) ->
  'entity ->
  bool

val orphaned_pages_with :
  ('entity, 'reference) orphan_capabilities ->
  pages:'reference Rrbvec.t option ->
  built_in_pages_names:string Rrbvec.t ->
  'entity Rrbvec.t

val sort_page_random_blocks_with :
  ('entity, 'id) page_order_capabilities -> 'entity Rrbvec.t -> 'entity Rrbvec.t

val last_child_block_with :
  ('entity, 'id) page_order_capabilities ->
  parent_id:'id ->
  child_id:'id ->
  bool option

val non_consecutive_blocks_with :
  ('entity, 'id) page_order_capabilities -> 'entity Rrbvec.t -> 'entity Rrbvec.t

val page_in_library : library_id:int -> int Rrbvec.t -> bool

val page_in_library_with :
  ('entity, 'id) library_capabilities -> 'entity -> bool

val page_with :
  ('entity, 'lookup) page_lookup_capabilities ->
  'lookup page_reference ->
  'entity option

val journal_page_with :
  ('entity, 'lookup) page_lookup_capabilities -> string -> 'entity option

val journal_page_value_with :
  decode_name:('value -> string option) ->
  ('entity, 'lookup) page_lookup_capabilities ->
  'value ->
  'entity option

val case_page_with :
  ('entity, 'lookup) page_lookup_capabilities ->
  'lookup page_reference ->
  'entity option

val page_empty_with :
  ('entity, 'lookup) direct_child_capabilities -> 'lookup page_reference -> bool

val has_children_with :
  ('entity, 'lookup) direct_child_capabilities -> 'lookup page_reference -> bool

val last_direct_child_id_with :
  ('entity, 'lookup) direct_child_capabilities ->
  not_collapsed:bool ->
  'lookup page_reference ->
  'lookup option

val search_last_child :
  not_collapsed:bool -> collapsed:bool -> has_children:bool -> bool

val page_blocks_with :
  datoms:('attribute -> 'id -> 'datom array) ->
  datom_entity:('datom -> 'lookup) ->
  pull_many:('pattern -> 'lookup array -> 'result array) ->
  attribute:'attribute ->
  pattern:'pattern ->
  'id ->
  'result array

val page_blocks_count_with :
  datoms:('attribute -> 'id -> 'datom array) ->
  attribute:'attribute ->
  'id ->
  int

val journal_page_by_day_with :
  datoms:('attribute -> 'day -> 'datom array) ->
  datom_entity:('datom -> 'lookup) ->
  entity:('lookup -> 'entity option) ->
  attribute:'attribute ->
  'day ->
  'entity option

val key_value_with :
  entity:('key -> 'entity option) ->
  value:('entity -> 'value option) ->
  'key ->
  'value option

val page_exists_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'value array -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  string_to_value:(string -> 'value) ->
  case_sensitive:bool ->
  page_name:string ->
  normalized_name:string ->
  tags:'value ->
  'value array

val pages_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'value) ->
  collection_to_array:('value -> 'row array) ->
  row_first:('row -> 'result) ->
  hidden:('result -> bool) ->
  'result array

val all_pages_with :
  datoms:(unit -> 'datom array) ->
  datom_entity:('datom -> 'id) ->
  entity:('id -> 'entity option) ->
  hidden:('entity -> bool) ->
  internal:('entity -> bool) ->
  'entity array

val parents_with :
  entity:('id -> 'entity option) ->
  parent:('entity -> 'entity option) ->
  uuid:('entity -> 'id) ->
  depth:int ->
  'id ->
  'entity array

val pages_relation_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'result) ->
  with_journal:bool ->
  'result

val all_tagged_pages_with :
  encode_form:(Datalog_form.t -> 'value) -> query:('value -> 'result) -> 'result
