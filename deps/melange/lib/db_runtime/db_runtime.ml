open Melange_db_runtime_internal

type runtime_codec_value = Melange_cljs_runtime_spec.Value_codec.cljs_value
type runtime_codec_adapter = Melange_cljs_runtime_spec.Value_codec.adapter
type runtime_codec_callback = Melange_cljs_runtime_spec.Value_codec.callback
type datascript_value = Melange_datascript_spec.Api.value
type datascript_adapter = Melange_datascript_spec.Api.adapter
type datascript_schema = Melange_datascript_spec.Api.schema
type datascript_storage = Melange_datascript_spec.Api.storage
type datascript_connection = Melange_datascript_spec.Api.connection
type datascript_database = Melange_datascript_spec.Api.database
type datascript_entity = Melange_datascript_spec.Api.entity
type datascript_datom = Melange_datascript_spec.Api.datom
type datascript_pull_pattern = Melange_datascript_spec.Api.pull_pattern
type datascript_transaction_data = Melange_datascript_spec.Api.transaction_data

type datascript_transaction_metadata =
  Melange_datascript_spec.Api.transaction_metadata

type datascript_transaction_report =
  Melange_datascript_spec.Api.transaction_report

type datascript_listener_key = Melange_datascript_spec.Api.listener_key
(** Typed DB workflow API aggregation. *)

type asset_value = Asset.value
type block_title_encoded_workflow_options = Block_title.encoded_workflow_options
type class_catalog_encoded_value = Class_catalog.encoded_value
type entity_lookup_workflow_capabilities = Entity_lookup_workflow.capabilities
type entity_lookup_workflow_value = Entity_lookup_workflow.value
type frontend_read_encoded_extend = Frontend_read.encoded_extend
type initial_data_workflow_encoded_result = Initial_data_workflow.encoded_result
type input_workflow_capabilities = Input_workflow.capabilities

type property_build_encoded_value_block_options =
  Property_build.encoded_value_block_options

type property_build_float_callback = Property_build.float_callback
type property_build_value_callback = Property_build.value_callback

type property_catalog_encoded_closed_value =
  Property_catalog.encoded_closed_value

type property_catalog_encoded_entry = Property_catalog.encoded_entry
type reference_workflow_encoded_filters = Reference_workflow.encoded_filters
type reference_workflow_encoded_result = Reference_workflow.encoded_result
type rules_encoded_form = Rules.encoded_form
type schema_version_encoded = Schema_version.encoded
type sqlite_cli_workflow_adapter = Sqlite_cli_workflow.adapter
type sqlite_cli_workflow_connection = Sqlite_cli_workflow.connection
type sqlite_cli_workflow_encoded_open = Sqlite_cli_workflow.encoded_open
type sqlite_cli_workflow_sqlite = Sqlite_cli_workflow.sqlite
type sqlite_cli_workflow_storage = Sqlite_cli_workflow.storage

type sqlite_create_graph_encoded_initial_options =
  Sqlite_create_graph.encoded_initial_options

type sqlite_create_graph_float_callback = Sqlite_create_graph.float_callback

type sqlite_export_workflow_diff_capabilities =
  Sqlite_export_workflow.diff_capabilities

type sqlite_export_workflow_export_capabilities =
  Sqlite_export_workflow.export_capabilities

type sqlite_gc_workflow_database = Sqlite_gc_workflow.database
type 'a sqlite_lifecycle_domain_backup = 'a Sqlite_lifecycle.Domain.backup
type 'a sqlite_lifecycle_domain_close = 'a Sqlite_lifecycle.Domain.close
type 'a sqlite_lifecycle_domain_open_db = 'a Sqlite_lifecycle.Domain.open_db
type sqlite_lifecycle_domain_remove = Sqlite_lifecycle.Domain.remove
type sqlite_util_float_callback = Sqlite_util.float_callback
type sqlite_util_value_callback = Sqlite_util.value_callback
type transaction_execution_collector = Transaction_execution.collector

type transaction_execution_execution_adapter =
  Transaction_execution.execution_adapter

type transaction_policy_encoded_favorite = Transaction_policy.encoded_favorite
type transaction_runtime_invalid_callback = Transaction_runtime.invalid_callback

type transaction_runtime_pipeline_callback =
  Transaction_runtime.pipeline_callback

type transaction_runtime_transact_callback =
  Transaction_runtime.transact_callback

type validation_database_encoded_counts = Validation_database.encoded_counts

type validation_schema_encoded_database_result =
  Validation_schema.encoded_database_result

type validation_schema_encoded_workflow_options =
  Validation_schema.encoded_workflow_options

type validation_schema_encoded_workflow_result =
  Validation_schema.encoded_workflow_result

type view_data_workflow_encoded_options = View_data_workflow.encoded_options
type view_data_workflow_encoded_result = View_data_workflow.encoded_result
type view_property_values_encoded_entry = View_property_values.encoded_entry

type entity_lookup_workflow_log_lookup_error_callback =
  Entity_lookup_workflow.log_lookup_error_callback

type property_build_encoded_closed_value_options =
  Property_build.encoded_closed_value_options

type property_build_encoded_property_values_options =
  Property_build.encoded_property_values_options

type sqlite_export_workflow_encoded_import_validation_result =
  Sqlite_export_workflow.encoded_import_validation_result

type validation_property_encoded_validation_options =
  Validation_property.encoded_validation_options

type validation_schema_encoded_local_database_result =
  Validation_schema.encoded_local_database_result

type validation_schema_encoded_transaction_result =
  Validation_schema.encoded_transaction_result

type validation_schema_print_local_counts_callback =
  Validation_schema.print_local_counts_callback

module Asset = Asset
module BlockTitle = Block_title
module Bidirectional = Bidirectional
module ClassCatalog = Class_catalog
module ClassRead = Class_read
module DbIdent = Db_ident
module Order = Order
module KvEntity = Kv_entity
module ContentWorkflow = Content_workflow
module PropertyType = Property_type
module SchemaVersion = Schema_version
module PropertyIdentity = Property_identity
module EntityRead = Entity_read
module EntityLookup = Entity_lookup
module EntityLookupWorkflow = Entity_lookup_workflow
module FrontendRead = Frontend_read
module ReferenceFilter = Reference_filter
module TreeWorkflow = Tree_workflow
module CoreRead = Core_read
module TransactionPolicy = Transaction_policy
module TransactionWorkflow = Transaction_workflow
module TransactionRuntime = Transaction_runtime
module DeleteWorkflow = Delete_workflow
module InitialRead = Initial_read
module InitialDataWorkflow = Initial_data_workflow
module ReferenceWorkflow = Reference_workflow
module SqlitePolicy = Sqlite_policy
module SqliteDebugWorkflow = Sqlite_debug_workflow
module SqliteGcWorkflow = Sqlite_gc_workflow
module SqliteLifecycle = Sqlite_lifecycle
module SqliteCliWorkflow = Sqlite_cli_workflow
module SqliteBuild = Sqlite_build
module SqliteExport = Sqlite_export
module ValidationIdentity = Validation_identity
module ViewWorkflow = View_workflow
module ViewPropertyValues = View_property_values
module ViewDataWorkflow = View_data_workflow
module ValidationDatom = Validation_datom
module ValidationEntity = Validation_entity
module ValidationDatabase = Validation_database
module ValidationProperty = Validation_property
module ValidationSchema = Validation_schema
module TransactionExecution = Transaction_execution
module PropertyOrder = Property_order
module PropertyScope = Property_scope
module PropertyShape = Property_shape
module PropertyWorkflow = Property_workflow
module PropertyBuild = Property_build
module SqliteUtil = Sqlite_util
module ClassWorkflow = Class_workflow
module SqliteCreateGraph = Sqlite_create_graph
module SqliteBuildWorkflow = Sqlite_build_workflow
module SqliteExportWorkflow = Sqlite_export_workflow
module InputWorkflow = Input_workflow
module NormalizePlan = Normalize_plan
module PropertyCatalog = Property_catalog
module Schema = Schema
module Rules = Rules
