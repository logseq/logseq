module Domain = Melange_db.Transaction_workflow

type execution_adapter
type collector

type invalid_error_callback =
  (Support.Runtime_codec.cljs_value ->
   Support.Runtime_codec.cljs_value ->
   Support.Runtime_codec.cljs_value ->
   Support.Datascript.transaction_report ->
   exn
  [@u])

type parent_error_callback = (Support.Runtime_codec.cljs_value -> exn[@u])
type error_code_callback = (exn -> string Js.Nullable.t[@u])
type rethrow_error_callback = (exn -> unit[@u])

type log_failure_callback =
  (exn ->
   Support.Runtime_codec.cljs_value ->
   Support.Runtime_codec.cljs_value ->
   unit
  [@u])

type create_collector_callback = (unit -> collector[@u])

type append_collector_callback =
  (collector -> Support.Datascript.datom array -> unit[@u])

type collector_value_callback =
  (collector -> Support.Runtime_codec.cljs_value[@u])

type clear_collector_callback = (collector -> unit[@u])

type temp_batch_callback =
  (Support.Datascript.connection -> collector -> unit[@u])

type batch_callback = (Support.Datascript.connection -> unit[@u])
type listener_callback = (Support.Datascript.transaction_report -> unit[@u])
type before_commit_callback = (unit -> unit[@u])

type commit_callback =
  (Support.Datascript.connection ->
   Support.Datascript.transaction_data ->
   Support.Datascript.transaction_metadata ->
   Support.Runtime_codec.cljs_value
  [@u])

type nested_error_callback = (Support.Runtime_codec.cljs_value -> exn[@u])
type log_batch_error_callback = (exn -> unit[@u])

type local_connection_callback =
  (Support.Runtime_codec.cljs_value ->
   Support.Datascript.connection Js.Nullable.t
  [@u])

type local_result_callback =
  (Support.Datascript.transaction_report -> Support.Runtime_codec.cljs_value
  [@u])

type missing_target_error_callback =
  (Support.Runtime_codec.cljs_value -> exn[@u])

external invalid_error_fn : execution_adapter -> invalid_error_callback
  = "makeInvalidError"
[@@mel.get]

external parent_error_fn : execution_adapter -> parent_error_callback
  = "makeParentError"
[@@mel.get]

external error_code_fn : execution_adapter -> error_code_callback = "errorCode"
[@@mel.get]

external rethrow_error_fn : execution_adapter -> rethrow_error_callback
  = "rethrowError"
[@@mel.get]

external log_failure_fn : execution_adapter -> log_failure_callback
  = "logFailure"
[@@mel.get]

external create_collector_fn : execution_adapter -> create_collector_callback
  = "createCollector"
[@@mel.get]

external append_collector_fn : execution_adapter -> append_collector_callback
  = "appendCollector"
[@@mel.get]

external collector_value_fn : execution_adapter -> collector_value_callback
  = "collectorValue"
[@@mel.get]

external clear_collector_fn : execution_adapter -> clear_collector_callback
  = "clearCollector"
[@@mel.get]

external nested_error_fn : execution_adapter -> nested_error_callback
  = "makeNestedError"
[@@mel.get]

external log_batch_error_fn : execution_adapter -> log_batch_error_callback
  = "logBatchError"
[@@mel.get]

external local_connection_fn : execution_adapter -> local_connection_callback
  = "localConnection"
[@@mel.get]

external local_result_fn : execution_adapter -> local_result_callback
  = "localResult"
[@@mel.get]

external missing_target_error_fn :
  execution_adapter -> missing_target_error_callback = "makeMissingTargetError"
[@@mel.get]

let metadata_flag runtime metadata name =
  Support.Runtime_codec.map_get runtime metadata
    (Support.Runtime_codec.keyword_from_string runtime name)
  |> Support.Runtime_codec.value_truthy runtime

let rethrow_caught_error rethrow_error error =
  rethrow_error error [@u];
  raise error

let db_based runtime datascript database =
  match
    Support.Datascript.entity datascript database
      (Support.Runtime_codec.keyword_from_string runtime "logseq.kv/db-type")
    |> Js.Nullable.toOption
  with
  | None -> false
  | Some entity ->
      let value = Entity_read.field runtime datascript entity "kv/value" in
      Support.Runtime_codec.value_is_string runtime value
      && Support.Runtime_codec.string_from_value runtime value = "db"

let page runtime datascript value =
  match
    Entity_read.pageWith runtime datascript value |> Js.Nullable.toOption
  with
  | Some value -> value
  | None -> false

let valid_page_parent runtime datascript report =
  let database = Support.Datascript.report_db_after datascript report in
  let parent_attribute =
    Support.Runtime_codec.keyword_from_string runtime "block/parent"
  in
  Support.Datascript.report_datoms datascript report
  |> Array.exists (fun datom ->
      Support.Datascript.datom_added datascript datom
      && Support.Runtime_codec.value_equals runtime
           (Support.Datascript.datom_attribute datascript datom)
           parent_attribute
      &&
      match
        Support.Datascript.entity datascript database
          (Support.Datascript.datom_entity datascript datom)
        |> Js.Nullable.toOption
      with
      | None -> false
      | Some entity -> (
          let parent =
            Entity_read.field runtime datascript entity "block/parent"
          in
          page runtime datascript entity
          && Support.Runtime_codec.value_equals runtime
               (Support.Datascript.datom_value datascript datom)
               (Entity_read.field runtime datascript parent "db/id")
          &&
          match
            Support.Datascript.entity datascript database
              (Support.Datascript.datom_value datascript datom)
            |> Js.Nullable.toOption
          with
          | None -> true
          | Some parent_entity -> not (page runtime datascript parent_entity)))
  |> not

let batchWithTemp runtime datascript execution connection metadata
    batch_callback listener before_commit commit listener_key =
  let create_collector = create_collector_fn execution in
  let append_collector = append_collector_fn execution in
  let collector_value = collector_value_fn execution in
  let clear_collector = clear_collector_fn execution in
  let listener = Js.Nullable.toOption listener in
  let before_commit = Js.Nullable.toOption before_commit in
  let capabilities =
    ({
       database = Support.Datascript.database datascript;
       create_temporary =
         Support.Datascript.create_temporary_connection datascript;
       create_collector = (fun () -> (create_collector () [@u]));
       listen =
         (fun connection callback ->
           Support.Datascript.listen datascript connection listener_key
             (fun[@u] report -> callback report));
       unlisten =
         (fun connection ->
           Support.Datascript.unlisten datascript connection listener_key);
       append_report =
         (fun collector report ->
           (append_collector collector
              (Support.Datascript.report_datoms datascript report) [@u]));
       notify_listener =
         (fun report ->
           Option.iter (fun callback -> (callback report [@u])) listener);
       invoke_batch =
         (fun connection collector ->
           (batch_callback connection collector [@u]));
       before_commit =
         (fun () ->
           Option.iter (fun callback -> (callback () [@u])) before_commit);
       collector_data = (fun collector -> (collector_value collector [@u]));
       transaction_data_nonempty =
         (fun transaction_data ->
           Array.length
             (Support.Runtime_codec.collection_to_array runtime
                transaction_data)
           > 0);
       commit =
         (fun connection transaction_data metadata ->
           (commit connection transaction_data metadata [@u]));
       release_connection = Support.Datascript.release_connection datascript;
       clear_collector = (fun collector -> (clear_collector collector [@u]));
     }
      : ( Support.Datascript.connection,
          Support.Datascript.database,
          Support.Datascript.transaction_metadata,
          Support.Datascript.transaction_report,
          Support.Datascript.transaction_data,
          collector,
          Support.Runtime_codec.cljs_value )
        Domain.temp_batch_capabilities)
  in
  Domain.batch_with_temp capabilities connection metadata
  |> Js.Nullable.fromOption

let batchWith runtime datascript execution connection metadata batch_callback
    listener listener_key =
  let listener = Js.Nullable.toOption listener in
  let make_nested_error = nested_error_fn execution in
  let log_batch_error = log_batch_error_fn execution in
  let capabilities =
    ({
       database = Support.Datascript.database datascript;
       batch_active = Support.Datascript.connection_batch_active datascript;
       nested_error = (fun metadata -> (make_nested_error metadata [@u]));
       listen =
         (fun connection callback ->
           Support.Datascript.listen datascript connection listener_key
             (fun[@u] report -> callback report));
       unlisten =
         (fun connection ->
           Support.Datascript.unlisten datascript connection listener_key);
       report_data =
         (fun report ->
           Support.Datascript.report_datoms datascript report
           |> Rrbvec.of_array);
       notify_listener =
         (fun report ->
           Option.iter (fun callback -> (callback report [@u])) listener);
       begin_batch = Support.Datascript.begin_batch datascript;
       invoke_batch = (fun connection -> (batch_callback connection [@u]));
       end_batch = Support.Datascript.end_batch datascript;
       storage_exists =
         (fun database ->
           Support.Datascript.storage_for datascript database
           |> Js.Nullable.toOption |> Option.is_some);
       store = Support.Datascript.store datascript;
       mark_database_stored =
         Support.Datascript.mark_database_stored datascript;
       final_metadata =
         (fun metadata ->
           Support.Runtime_codec.map_assoc runtime metadata
             (Support.Runtime_codec.keyword_from_string runtime
                "batch-final-tx-report?")
             (Support.Runtime_codec.bool_to_value runtime true));
       make_report =
         (fun database_before database_after metadata datoms ->
           Support.Datascript.make_transaction_report datascript
             database_before database_after metadata (Rrbvec.to_array datoms));
       run_callbacks = Support.Datascript.run_callbacks datascript;
       log_error = (fun error -> (log_batch_error error [@u]));
       reset_database = Support.Datascript.reset_database datascript;
     }
      : ( Support.Datascript.connection,
          Support.Datascript.database,
          Support.Datascript.transaction_metadata,
          Support.Datascript.transaction_report,
          Support.Datascript.datom )
        Domain.batch_capabilities)
  in
  Domain.batch_transact capabilities connection metadata

let transaction_validation_options :
    Validation_schema.encoded_workflow_options =
  {
    dispatchKey = Js.Nullable.undefined;
    closedSchema = false;
    newClosedValue = false;
    closedValuesValidate = false;
    skipStrictUrlValidate = true;
  }

let syncOwnedWith runtime datascript execution connection transaction_data
    metadata =
  let make_invalid_error = invalid_error_fn execution in
  let make_parent_error = parent_error_fn execution in
  let error_code = error_code_fn execution in
  let rethrow_error = rethrow_error_fn execution in
  let log_failure = log_failure_fn execution in
  let capabilities =
    ({
       database = Support.Datascript.database datascript;
       validation_input =
         (fun connection database metadata ->
           {
             Melange_db.Transaction_policy.db_based =
               db_based runtime datascript database;
             rtc_download = metadata_flag runtime metadata "rtc-download-graph?";
             reset_conn = metadata_flag runtime metadata "reset-conn!";
             initial_db = metadata_flag runtime metadata "initial-db?";
             skip_meta = metadata_flag runtime metadata "skip-validate-db?";
             skip_conn =
               Support.Datascript.connection_skips_validation datascript
                 connection;
             exporter_new_graph =
               metadata_flag runtime metadata
                 "logseq.graph-parser.exporter/new-graph?";
           });
       with_tx =
         (fun database transaction_data metadata ->
           Support.Datascript.with_tx datascript database transaction_data
             (Js.Nullable.return metadata));
       apply_pipeline = Transaction_runtime.applyPipeline;
       validate_parent = valid_page_parent runtime datascript;
       validate_report =
         (fun report ->
           let result =
             Validation_schema.validateTransactionValueWith runtime
               datascript report transaction_validation_options
           in
           if result.valid then Ok () else Error result.errors);
       same_database = ( == );
       report_after = Support.Datascript.report_db_after datascript;
       report_has_datoms =
         (fun report ->
           Array.length (Support.Datascript.report_datoms datascript report)
           > 0);
       compare_and_set =
         Support.Datascript.compare_and_set_database datascript;
       store_after = Support.Datascript.store_after_transact datascript;
       run_callbacks = Support.Datascript.run_callbacks datascript;
       direct_transact =
         (fun connection transaction_data metadata ->
           Support.Datascript.transact datascript connection
             transaction_data
             (Js.Nullable.return metadata));
       notify_invalid = Transaction_runtime.notifyInvalid;
       invalid_error =
         (fun metadata transaction_data errors report ->
           (make_invalid_error metadata transaction_data errors report [@u]));
       parent_error =
         (fun transaction_data -> (make_parent_error transaction_data [@u]));
       suppress_failure =
         (fun metadata error ->
           metadata_flag runtime metadata
             "db-sync/suppress-transact-failed-log?"
           || metadata_flag runtime metadata
                "db-sync/suppress-stale-rebase-transact-failed-log?"
              &&
              match (error_code error [@u]) |> Js.Nullable.toOption with
              | Some code -> code = "entity-id/missing"
              | None -> false);
       log_failure =
         (fun error metadata transaction_data ->
           (log_failure error metadata transaction_data [@u]));
     }
      : ( Support.Datascript.connection,
          Support.Datascript.database,
          Support.Datascript.transaction_data,
          Support.Datascript.transaction_metadata,
          Support.Datascript.transaction_report,
          Support.Runtime_codec.cljs_value )
        Domain.sync_capabilities)
  in
  try Domain.transact_sync capabilities connection transaction_data metadata
  with error -> rethrow_caught_error rethrow_error error

let transactOwnedWith runtime datascript execution target transaction_data
    metadata batch_report =
  let local_connection = local_connection_fn execution in
  let local_result = local_result_fn execution in
  let make_missing_target_error = missing_target_error_fn execution in
  let rethrow_error = rethrow_error_fn execution in
  let capabilities =
    ({
       prepare =
         (fun transaction_data external_transact ->
           transaction_data
           |> Support.Runtime_codec.collection_to_array runtime
           |> Rrbvec.of_array
           |> Domain.prepare
                (Transaction_workflow.capabilities runtime datascript)
                ~external_transact
           |> Rrbvec.to_array
           |> Support.Runtime_codec.array_to_list runtime);
       transaction_nonempty =
         (fun transaction_data ->
           Array.length
             (Support.Runtime_codec.collection_to_array runtime
                transaction_data)
           > 0);
       local_target =
         (fun target ->
           if Support.Runtime_codec.value_is_string runtime target then None
           else (local_connection target [@u]) |> Js.Nullable.toOption);
       expand_delete =
         (fun connection transaction_data metadata ->
           Delete_workflow.expandWith runtime datascript
             (Support.Datascript.database datascript connection)
             transaction_data metadata);
       update_history =
         (fun connection transaction_data _metadata ->
           Delete_workflow.cleanupWith runtime datascript
             (Support.Datascript.database datascript connection)
             transaction_data);
       concat_transaction =
         (fun left right ->
           Array.append
             (Support.Runtime_codec.collection_to_array runtime left)
             (Support.Runtime_codec.collection_to_array runtime right)
           |> Support.Runtime_codec.array_to_list runtime);
       batch_metadata =
         (fun metadata ->
           if not batch_report then metadata
           else
             Support.Runtime_codec.map_assoc runtime metadata
               (Support.Runtime_codec.keyword_from_string runtime
                  "batch-tx-report?")
               (Support.Runtime_codec.bool_to_value runtime true));
       external_transact =
         Option.map
           (fun callback target transaction_data metadata ->
             (callback target transaction_data metadata [@u]))
           !Transaction_runtime.transact_callback;
       local_transact =
         (fun connection transaction_data metadata ->
           syncOwnedWith runtime datascript execution connection
             transaction_data metadata
           |> fun report -> (local_result report [@u]));
       missing_target_error =
         (fun target -> (make_missing_target_error target [@u]));
     }
      : ( Support.Runtime_codec.cljs_value,
          Support.Datascript.connection,
          Support.Runtime_codec.cljs_value,
          Support.Runtime_codec.cljs_value,
          Support.Runtime_codec.cljs_value )
        Domain.transact_capabilities)
  in
  try
    Domain.transact capabilities target transaction_data metadata
    |> Js.Nullable.fromOption
  with error -> rethrow_caught_error rethrow_error error
