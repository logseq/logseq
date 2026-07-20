type 'value lookup =
  | Uuid of 'value
  | Id of 'value
  | Page_name of string
  | Missing

type ('database, 'value) capabilities = {
  field : 'value -> string -> 'value;
  entries : 'value -> (string * 'value) array;
  map : (string * 'value) array -> 'value;
  assoc : 'value -> string -> 'value -> 'value;
  nil : 'value;
  is_nil : 'value -> bool;
  truthy : 'value -> bool;
  entity : 'value -> bool;
  values : 'value -> 'value array;
  entity_values : 'value -> 'value array option;
  sequence : 'value array -> 'value;
  lookup_entity : 'database -> 'value -> 'value option;
  pull_all : 'database -> 'value -> 'value;
  uuid_lookup : 'value -> 'value;
  oldest_page_by_name : 'database -> string -> 'value option;
  children_ids : 'database -> 'value -> bool -> 'value array option;
  block_refs_count : 'database -> 'value -> int;
  has_children : 'database -> 'value -> bool;
  equal : 'value -> 'value -> bool;
  bool : bool -> 'value;
  int : int -> 'value;
  keyword : string -> 'value;
}

val entity_to_map :
  ('database, 'value) capabilities ->
  properties:string Rrbvec.t ->
  'value ->
  'value

val with_parent :
  ('database, 'value) capabilities -> 'database -> 'value -> 'value

val block_and_children :
  ('database, 'value) capabilities ->
  'database ->
  'value lookup ->
  children:bool ->
  include_collapsed:bool ->
  properties:string Rrbvec.t ->
  'value option
