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

external create_conn_fn :
  adapter -> (schema -> connection_options Js.Nullable.t -> connection[@u])
  = "createConn"
[@@mel.get]

external create_conn_with_storage_fn :
  adapter -> (schema -> storage -> connection[@u]) = "createConnWithStorage"
[@@mel.get]

external restore_conn_fn : adapter -> (storage -> connection Js.Nullable.t[@u])
  = "restoreConn"
[@@mel.get]

external database_fn : adapter -> (connection -> database[@u]) = "database"
[@@mel.get]

external connection_skips_validation_fn : adapter -> (connection -> bool[@u])
  = "connectionSkipsValidation"
[@@mel.get]

external create_temporary_connection_fn :
  adapter -> (database -> connection[@u]) = "createTemporaryConnection"
[@@mel.get]

external connection_batch_active_fn : adapter -> (connection -> bool[@u])
  = "connectionBatchActive"
[@@mel.get]

external begin_batch_fn : adapter -> (connection -> unit[@u]) = "beginBatch"
[@@mel.get]

external end_batch_fn : adapter -> (connection -> unit[@u]) = "endBatch"
[@@mel.get]

external reset_database_fn : adapter -> (connection -> database -> unit[@u])
  = "resetDatabase"
[@@mel.get]

external release_connection_fn : adapter -> (connection -> unit[@u])
  = "releaseConnection"
[@@mel.get]

external mark_database_stored_fn :
  adapter -> (connection -> database -> unit[@u]) = "markDatabaseStored"
[@@mel.get]

external compare_and_set_database_fn :
  adapter -> (connection -> database -> database -> bool[@u])
  = "compareAndSetDatabase"
[@@mel.get]

external database_schema_fn : adapter -> (database -> schema[@u])
  = "databaseSchema"
[@@mel.get]

external entity_fn : adapter -> (database -> value -> entity Js.Nullable.t[@u])
  = "entity"
[@@mel.get]

external entity_database_fn :
  adapter -> (entity -> database Js.Nullable.t[@u]) = "entityDb"
[@@mel.get]

external entity_get_fn : adapter -> (entity -> value -> value[@u]) = "entityGet"
[@@mel.get]

external entity_is_fn : adapter -> (value -> bool[@u]) = "entityIs" [@@mel.get]

external datoms_fn :
  adapter -> (database -> index -> value array -> datom array[@u]) = "datoms"
[@@mel.get]

external rseek_datoms_fn :
  adapter -> (database -> index -> value array -> datom array[@u])
  = "rseekDatoms"
[@@mel.get]

external query_fn :
  adapter -> (query_form -> database -> value array -> value[@u]) = "query"
[@@mel.get]

external pull_fn : adapter -> (database -> pull_pattern -> value -> value[@u])
  = "pull"
[@@mel.get]

external pull_all_fn : adapter -> (database -> value -> value[@u]) = "pullAll"
[@@mel.get]

external pull_many_fn :
  adapter -> (database -> pull_pattern -> value array -> value array[@u])
  = "pullMany"
[@@mel.get]

external with_tx_fn :
  adapter ->
  (database ->
   transaction_data ->
   transaction_metadata Js.Nullable.t ->
   transaction_report
  [@u]) = "withTx"
[@@mel.get]

external transact_fn :
  adapter ->
  (connection ->
   transaction_data ->
   transaction_metadata Js.Nullable.t ->
   transaction_report
  [@u]) = "transact"
[@@mel.get]

external listen_fn :
  adapter -> (connection -> listener_key -> transaction_listener -> unit[@u])
  = "listen"
[@@mel.get]

external unlisten_fn : adapter -> (connection -> listener_key -> unit[@u])
  = "unlisten"
[@@mel.get]

external report_db_before_fn : adapter -> (transaction_report -> database[@u])
  = "reportDbBefore"
[@@mel.get]

external report_db_after_fn : adapter -> (transaction_report -> database[@u])
  = "reportDbAfter"
[@@mel.get]

external report_datoms_fn : adapter -> (transaction_report -> datom array[@u])
  = "reportDatoms"
[@@mel.get]

external report_tx_metadata_fn : adapter -> (transaction_report -> value[@u])
  = "reportTxMetadata"
[@@mel.get]

external make_transaction_report_fn :
  adapter ->
  (database ->
   database ->
   transaction_metadata ->
   datom array ->
   transaction_report
  [@u]) = "makeTransactionReport"
[@@mel.get]

external datom_entity_fn : adapter -> (datom -> value[@u]) = "datomEntity"
[@@mel.get]

external datom_attribute_fn : adapter -> (datom -> value[@u]) = "datomAttribute"
[@@mel.get]

external datom_value_fn : adapter -> (datom -> value[@u]) = "datomValue"
[@@mel.get]

external datom_added_fn : adapter -> (datom -> bool[@u]) = "datomAdded"
[@@mel.get]

external datom_equals_fn : adapter -> (datom -> datom -> bool[@u])
  = "datomEquals"
[@@mel.get]

external datom_from_value_fn : adapter -> (value -> datom Js.Nullable.t[@u])
  = "datomFromValue"
[@@mel.get]

external storage_for_fn : adapter -> (database -> storage Js.Nullable.t[@u])
  = "storageFor"
[@@mel.get]

external store_fn : adapter -> (database -> unit[@u]) = "store" [@@mel.get]

external store_after_transact_fn :
  adapter -> (connection -> transaction_report -> unit[@u])
  = "storeAfterTransact"
[@@mel.get]

external run_callbacks_fn :
  adapter -> (connection -> transaction_report -> unit[@u]) = "runCallbacks"
[@@mel.get]

external squuid_fn : adapter -> (unit -> uuid[@u]) = "squuid" [@@mel.get]

let create_conn adapter schema options =
  let callback = create_conn_fn adapter in
  (callback schema options [@u])

let create_conn_with_storage adapter schema storage =
  let callback = create_conn_with_storage_fn adapter in
  (callback schema storage [@u])

let restore_conn adapter storage =
  let callback = restore_conn_fn adapter in
  (callback storage [@u])

let database adapter connection =
  let callback = database_fn adapter in
  (callback connection [@u])

let connection_skips_validation adapter connection =
  let callback = connection_skips_validation_fn adapter in
  (callback connection [@u])

let create_temporary_connection adapter database =
  let callback = create_temporary_connection_fn adapter in
  (callback database [@u])

let connection_batch_active adapter connection =
  let callback = connection_batch_active_fn adapter in
  (callback connection [@u])

let begin_batch adapter connection =
  let callback = begin_batch_fn adapter in
  (callback connection [@u])

let end_batch adapter connection =
  let callback = end_batch_fn adapter in
  (callback connection [@u])

let reset_database adapter connection database =
  let callback = reset_database_fn adapter in
  (callback connection database [@u])

let release_connection adapter connection =
  let callback = release_connection_fn adapter in
  (callback connection [@u])

let mark_database_stored adapter connection database =
  let callback = mark_database_stored_fn adapter in
  (callback connection database [@u])

let compare_and_set_database adapter connection before after =
  let callback = compare_and_set_database_fn adapter in
  (callback connection before after [@u])

let database_schema adapter database =
  let callback = database_schema_fn adapter in
  (callback database [@u])

let entity adapter database lookup =
  let callback = entity_fn adapter in
  (callback database lookup [@u])

let entity_database adapter entity =
  let callback = entity_database_fn adapter in
  (callback entity [@u])

let entity_get adapter entity attribute =
  let callback = entity_get_fn adapter in
  (callback entity attribute [@u])

let entity_is adapter value =
  let callback = entity_is_fn adapter in
  (callback value [@u])

let datoms adapter database index components =
  let callback = datoms_fn adapter in
  (callback database index components [@u])

let rseek_datoms adapter database index components =
  let callback = rseek_datoms_fn adapter in
  (callback database index components [@u])

let query adapter form database inputs =
  let callback = query_fn adapter in
  (callback form database inputs [@u])

let pull adapter database pattern lookup =
  let callback = pull_fn adapter in
  (callback database pattern lookup [@u])

let pull_all adapter database lookup =
  let callback = pull_all_fn adapter in
  (callback database lookup [@u])

let pull_many adapter database pattern lookups =
  let callback = pull_many_fn adapter in
  (callback database pattern lookups [@u])

let with_tx adapter database tx_data tx_meta =
  let callback = with_tx_fn adapter in
  (callback database tx_data tx_meta [@u])

let transact adapter connection tx_data tx_meta =
  let callback = transact_fn adapter in
  (callback connection tx_data tx_meta [@u])

let listen adapter connection key callback =
  let invoke = listen_fn adapter in
  (invoke connection key callback [@u])

let unlisten adapter connection key =
  let callback = unlisten_fn adapter in
  (callback connection key [@u])

let report_db_before adapter report =
  let callback = report_db_before_fn adapter in
  (callback report [@u])

let report_db_after adapter report =
  let callback = report_db_after_fn adapter in
  (callback report [@u])

let report_datoms adapter report =
  let callback = report_datoms_fn adapter in
  (callback report [@u])

let report_tx_metadata adapter report =
  let callback = report_tx_metadata_fn adapter in
  (callback report [@u])

let make_transaction_report adapter database_before database_after metadata
    transaction_data =
  let callback = make_transaction_report_fn adapter in
  (callback database_before database_after metadata transaction_data [@u])

let datom_entity adapter datom =
  let callback = datom_entity_fn adapter in
  (callback datom [@u])

let datom_attribute adapter datom =
  let callback = datom_attribute_fn adapter in
  (callback datom [@u])

let datom_value adapter datom =
  let callback = datom_value_fn adapter in
  (callback datom [@u])

let datom_added adapter datom =
  let callback = datom_added_fn adapter in
  (callback datom [@u])

let datom_equals adapter left right =
  let callback = datom_equals_fn adapter in
  (callback left right [@u])

let datom_from_value adapter value =
  let callback = datom_from_value_fn adapter in
  (callback value [@u])

let storage_for adapter database =
  let callback = storage_for_fn adapter in
  (callback database [@u])

let store adapter database =
  let callback = store_fn adapter in
  (callback database [@u])

let store_after_transact adapter connection report =
  let callback = store_after_transact_fn adapter in
  (callback connection report [@u])

let run_callbacks adapter connection report =
  let callback = run_callbacks_fn adapter in
  (callback connection report [@u])

let squuid adapter =
  let callback = squuid_fn adapter in
  (callback () [@u])
