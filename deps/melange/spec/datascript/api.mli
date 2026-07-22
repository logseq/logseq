type value = Melange_cljs_runtime_spec.Value_codec.cljs_value
type adapter
type schema
type connection_options
type storage
type connection
type database
type entity = value
type datom
type index = value
type query_form = value
type pull_pattern
type transaction_data = value
type transaction_metadata = value
type transaction_report
type listener_key = value
type uuid
type transaction_listener = (transaction_report -> unit[@u])

val create_conn :
  adapter -> schema -> connection_options Js.Nullable.t -> connection

val create_conn_with_storage : adapter -> schema -> storage -> connection
val restore_conn : adapter -> storage -> connection Js.Nullable.t
val database : adapter -> connection -> database
val connection_skips_validation : adapter -> connection -> bool
val create_temporary_connection : adapter -> database -> connection
val connection_batch_active : adapter -> connection -> bool
val begin_batch : adapter -> connection -> unit
val end_batch : adapter -> connection -> unit
val reset_database : adapter -> connection -> database -> unit
val release_connection : adapter -> connection -> unit
val mark_database_stored : adapter -> connection -> database -> unit

val compare_and_set_database :
  adapter -> connection -> database -> database -> bool

val database_schema : adapter -> database -> schema
val entity : adapter -> database -> value -> entity Js.Nullable.t
val entity_database : adapter -> entity -> database Js.Nullable.t
val entity_get : adapter -> entity -> value -> value
val entity_is : adapter -> value -> bool
val datoms : adapter -> database -> index -> value array -> datom array
val rseek_datoms : adapter -> database -> index -> value array -> datom array
val query : adapter -> query_form -> database -> value array -> value
val pull : adapter -> database -> pull_pattern -> value -> value
val pull_all : adapter -> database -> value -> value

val pull_many :
  adapter -> database -> pull_pattern -> value array -> value array

val with_tx :
  adapter ->
  database ->
  transaction_data ->
  transaction_metadata Js.Nullable.t ->
  transaction_report

val transact :
  adapter ->
  connection ->
  transaction_data ->
  transaction_metadata Js.Nullable.t ->
  transaction_report

val listen :
  adapter -> connection -> listener_key -> transaction_listener -> unit

val unlisten : adapter -> connection -> listener_key -> unit
val report_db_before : adapter -> transaction_report -> database
val report_db_after : adapter -> transaction_report -> database
val report_datoms : adapter -> transaction_report -> datom array
val report_tx_metadata : adapter -> transaction_report -> value

val make_transaction_report :
  adapter ->
  database ->
  database ->
  transaction_metadata ->
  datom array ->
  transaction_report

val datom_entity : adapter -> datom -> value
val datom_attribute : adapter -> datom -> value
val datom_value : adapter -> datom -> value
val datom_added : adapter -> datom -> bool
val datom_equals : adapter -> datom -> datom -> bool
val datom_from_value : adapter -> value -> datom Js.Nullable.t
val storage_for : adapter -> database -> storage Js.Nullable.t
val store : adapter -> database -> unit
val store_after_transact : adapter -> connection -> transaction_report -> unit
val run_callbacks : adapter -> connection -> transaction_report -> unit
val squuid : adapter -> uuid
