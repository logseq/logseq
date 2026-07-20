val page_sort_key :
  title:string option -> journal:int option -> uuid:string -> string

val keep_uuid : referenced:bool -> unique_attributes:bool -> bool
val excluded_kvs : string Rrbvec.t
val excluded_kv : string -> bool
val excluded_attribute : string -> bool
val exportable_datom : excluded_entity:bool -> attribute:string -> bool
val include_kv_in_diff : string -> bool

val prepare_diff_kvs :
  ident:('value -> string) -> 'value Rrbvec.t -> 'value Rrbvec.t

val patch_legacy_user_ident :
  initial_version:string option ->
  namespace_:string ->
  name:string ->
  string option

val sort_pages :
  title:('page -> string option) ->
  journal:('page -> int option) ->
  uuid:('page -> string) ->
  'page Rrbvec.t ->
  'page Rrbvec.t

val import_transaction_data :
  init:'transaction Rrbvec.t ->
  block_properties:'transaction Rrbvec.t ->
  misc:'transaction Rrbvec.t ->
  'transaction Rrbvec.t

type validation_error_group = {
  attribute : string option;
  messages : string Rrbvec.t;
}

type 'entity_id entity_validation_error = {
  entity_id : 'entity_id option;
  groups : validation_error_group Rrbvec.t;
}

type ('database, 'entity_id, 'transaction) import_validation_capabilities = {
  dry_run : 'database -> 'transaction Rrbvec.t -> 'database;
  validate : 'database -> 'entity_id entity_validation_error Rrbvec.t;
  added_attribute : 'transaction -> ('entity_id * string) option;
  equal_entity_id : 'entity_id -> 'entity_id -> bool;
}

type ('database, 'transaction) import_validation_result =
  | Valid_import of {
      database : 'database;
      transactions : 'transaction Rrbvec.t;
    }
  | Invalid_import of { error_count : int }

val validate_import_transactions :
  ('database, 'entity_id, 'transaction) import_validation_capabilities ->
  'database ->
  'transaction Rrbvec.t ->
  ('database, 'transaction) import_validation_result

type ('entity, 'value) export_datom = {
  entity : 'entity;
  attribute : 'value;
  value : 'value;
}

type ('database, 'entity, 'datom, 'value) datom_capabilities = {
  excluded_entity : 'database -> string -> 'entity option;
  datoms : 'database -> 'datom array;
  datom_entity : 'datom -> 'entity;
  datom_attribute : 'datom -> 'value;
  datom_value : 'datom -> 'value;
  attribute_name : 'value -> string;
  lookup_ref : 'value -> bool;
  resolve_lookup : 'database -> 'value -> 'value option;
  equal_entity : 'entity -> 'entity -> bool;
  entity_order : 'entity -> int;
}

val graph_datoms :
  ('database, 'entity, 'datom, 'value) datom_capabilities ->
  'database ->
  ('entity, 'value) export_datom Rrbvec.t

type 'value import_datom = {
  import_entity : int;
  import_attribute : 'value;
  import_value : 'value;
}

type 'value import_operation =
  | Retract_entity of int
  | Add of int * 'value * 'value

type ('database, 'value) import_capabilities = {
  current_entity_ids : 'database -> int array;
  attribute_name : 'value -> string;
  value_key : 'value -> string;
  entity_value : int -> 'value;
  lookup_ref : 'value -> ('value * 'value) option;
}

val datom_import :
  ('database, 'value) import_capabilities ->
  'database ->
  'value import_datom Rrbvec.t ->
  'value import_operation Rrbvec.t
