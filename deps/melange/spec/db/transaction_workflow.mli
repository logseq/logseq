type collection_kind = [ `Vector | `Set | `Sequential ]
type 'value entity_id = [ `Not_entity | `Missing | `Id of 'value ]

type 'value capabilities = {
  entity_id : 'value -> 'value entity_id;
  map_entries : 'value -> ('value * 'value) Rrbvec.t option;
  collection : 'value -> (collection_kind * 'value Rrbvec.t) option;
  build_map : ('value * 'value) Rrbvec.t -> 'value;
  build_collection : collection_kind -> 'value Rrbvec.t -> 'value;
  integer : 'value -> bool;
  nil : 'value -> bool;
  value_text : 'value -> string;
}

type ('connection,
       'database,
       'transaction_data,
       'metadata,
       'report,
       'errors)
     sync_capabilities = {
  database : 'connection -> 'database;
  validation_input :
    'connection -> 'database -> 'metadata -> Transaction_policy.validation_input;
  with_tx : 'database -> 'transaction_data -> 'metadata -> 'report;
  apply_pipeline : 'report -> 'report;
  validate_parent : 'report -> bool;
  validate_report : 'report -> (unit, 'errors) result;
  same_database : 'database -> 'database -> bool;
  report_after : 'report -> 'database;
  report_has_datoms : 'report -> bool;
  compare_and_set : 'connection -> 'database -> 'database -> bool;
  store_after : 'connection -> 'report -> unit;
  run_callbacks : 'connection -> 'report -> unit;
  direct_transact : 'connection -> 'transaction_data -> 'metadata -> 'report;
  notify_invalid : 'report -> 'errors -> unit;
  invalid_error : 'metadata -> 'transaction_data -> 'errors -> 'report -> exn;
  parent_error : 'transaction_data -> exn;
  suppress_failure : 'metadata -> exn -> bool;
  log_failure : exn -> 'metadata -> 'transaction_data -> unit;
}

type ('connection,
       'database,
       'metadata,
       'report,
       'transaction_data,
       'collector,
       'result)
     temp_batch_capabilities = {
  database : 'connection -> 'database;
  create_temporary : 'database -> 'connection;
  create_collector : unit -> 'collector;
  listen : 'connection -> ('report -> unit) -> unit;
  unlisten : 'connection -> unit;
  append_report : 'collector -> 'report -> unit;
  notify_listener : 'report -> unit;
  invoke_batch : 'connection -> 'collector -> unit;
  before_commit : unit -> unit;
  collector_data : 'collector -> 'transaction_data;
  transaction_data_nonempty : 'transaction_data -> bool;
  commit : 'connection -> 'transaction_data -> 'metadata -> 'result;
  release_connection : 'connection -> unit;
  clear_collector : 'collector -> unit;
}

type ('connection, 'database, 'metadata, 'report, 'datom) batch_capabilities = {
  database : 'connection -> 'database;
  batch_active : 'connection -> bool;
  nested_error : 'metadata -> exn;
  listen : 'connection -> ('report -> unit) -> unit;
  unlisten : 'connection -> unit;
  report_data : 'report -> 'datom Rrbvec.t;
  notify_listener : 'report -> unit;
  begin_batch : 'connection -> unit;
  invoke_batch : 'connection -> unit;
  end_batch : 'connection -> unit;
  storage_exists : 'database -> bool;
  store : 'database -> unit;
  mark_database_stored : 'connection -> 'database -> unit;
  final_metadata : 'metadata -> 'metadata;
  make_report :
    'database -> 'database -> 'metadata -> 'datom Rrbvec.t -> 'report;
  run_callbacks : 'connection -> 'report -> unit;
  log_error : exn -> unit;
  reset_database : 'connection -> 'database -> unit;
}

type ('target,
       'connection,
       'transaction_data,
       'metadata,
       'result)
     transact_capabilities = {
  prepare : 'transaction_data -> bool -> 'transaction_data;
  transaction_nonempty : 'transaction_data -> bool;
  local_target : 'target -> 'connection option;
  expand_delete :
    'connection -> 'transaction_data -> 'metadata -> 'transaction_data;
  update_history :
    'connection -> 'transaction_data -> 'metadata -> 'transaction_data;
  concat_transaction :
    'transaction_data -> 'transaction_data -> 'transaction_data;
  batch_metadata : 'metadata -> 'metadata;
  external_transact :
    ('target -> 'transaction_data -> 'metadata -> 'result) option;
  local_transact : 'connection -> 'transaction_data -> 'metadata -> 'result;
  missing_target_error : 'target -> exn;
}

val replace_entities : 'value capabilities -> 'value -> 'value

val prepare :
  'value capabilities ->
  external_transact:bool ->
  'value Rrbvec.t ->
  'value Rrbvec.t

val transact_sync :
  ( 'connection,
    'database,
    'transaction_data,
    'metadata,
    'report,
    'errors )
  sync_capabilities ->
  'connection ->
  'transaction_data ->
  'metadata ->
  'report

val batch_with_temp :
  ( 'connection,
    'database,
    'metadata,
    'report,
    'transaction_data,
    'collector,
    'result )
  temp_batch_capabilities ->
  'connection ->
  'metadata ->
  'result option

val batch_transact :
  ('connection, 'database, 'metadata, 'report, 'datom) batch_capabilities ->
  'connection ->
  'metadata ->
  'report

val transact :
  ( 'target,
    'connection,
    'transaction_data,
    'metadata,
    'result )
  transact_capabilities ->
  'target ->
  'transaction_data ->
  'metadata ->
  'result option
