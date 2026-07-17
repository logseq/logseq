module Runtime_codec : sig
  type value = Melange_cljs_runtime_spec.Value_codec.value
  type adapter = Melange_cljs_runtime_spec.Value_codec.adapter
  type callback = Melange_cljs_runtime_spec.Value_codec.callback
end

module Datascript : sig
  type value = Melange_datascript_spec.Api.value
  type adapter = Melange_datascript_spec.Api.adapter
  type schema = Melange_datascript_spec.Api.schema
  type storage = Melange_datascript_spec.Api.storage
  type connection = Melange_datascript_spec.Api.connection
  type database = Melange_datascript_spec.Api.database
  type entity = Melange_datascript_spec.Api.entity
  type datom = Melange_datascript_spec.Api.datom
  type pull_pattern = Melange_datascript_spec.Api.pull_pattern
  type transaction_data = Melange_datascript_spec.Api.transaction_data
  type transaction_metadata = Melange_datascript_spec.Api.transaction_metadata
  type transaction_report = Melange_datascript_spec.Api.transaction_report
  type listener_key = Melange_datascript_spec.Api.listener_key
end

type asset_value
type block_title_encoded_workflow_options
type class_catalog_encoded_value
type entity_lookup_workflow_capabilities
type entity_lookup_workflow_log_lookup_error_callback
type entity_lookup_workflow_value
type frontend_read_encoded_extend
type initial_data_workflow_encoded_result
type input_workflow_capabilities
type property_build_encoded_closed_value_options
type property_build_encoded_property_values_options
type property_build_encoded_value_block_options
type property_build_float_callback
type property_build_value_callback
type property_catalog_encoded_closed_value
type property_catalog_encoded_entry
type reference_workflow_encoded_filters
type reference_workflow_encoded_result
type rules_encoded_form
type schema_version_encoded
type sqlite_cli_workflow_adapter
type sqlite_cli_workflow_connection
type sqlite_cli_workflow_encoded_open
type sqlite_cli_workflow_sqlite
type sqlite_cli_workflow_storage
type sqlite_create_graph_encoded_initial_options
type sqlite_create_graph_float_callback
type sqlite_export_workflow_diff_capabilities
type sqlite_export_workflow_encoded_import_validation_result
type sqlite_export_workflow_export_capabilities
type sqlite_gc_workflow_database
type 'a sqlite_lifecycle_domain_backup
type 'a sqlite_lifecycle_domain_close
type 'a sqlite_lifecycle_domain_open_db
type sqlite_lifecycle_domain_remove
type sqlite_util_float_callback
type sqlite_util_value_callback
type transaction_execution_collector
type transaction_execution_execution_adapter
type transaction_policy_encoded_favorite
type transaction_runtime_invalid_callback
type transaction_runtime_pipeline_callback
type transaction_runtime_transact_callback
type validation_database_encoded_counts
type validation_property_encoded_validation_options
type validation_schema_encoded_database_result
type validation_schema_encoded_local_database_result
type validation_schema_encoded_transaction_result
type validation_schema_encoded_workflow_options
type validation_schema_encoded_workflow_result
type validation_schema_print_local_counts_callback
type view_data_workflow_encoded_options
type view_data_workflow_encoded_result
type view_property_values_encoded_entry

module Asset : sig
  type value = asset_value

  val checksumValue : asset_value -> string Js.Promise.t
  val digestHex : int array -> string
  val nameTitle : string -> string
  val pathType : string -> string
end

module Bidirectional : sig
  val getPropertiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    int Js.Nullable.t ->
    Runtime_codec.value array Js.Nullable.t
end

module BlockTitle : sig
  type encoded_workflow_options = block_title_encoded_workflow_options

  val uniqueTitleWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.value ->
    block_title_encoded_workflow_options ->
    string Js.Nullable.t
end

module ClassCatalog : sig
  type encoded_value = class_catalog_encoded_value

  val blockKindTags : string array
  val disallowedInlineTags : string array

  val entries :
    (string
    * string
    * (string * class_catalog_encoded_value) array
    * string array
    * string array)
    array

  val extendsHiddenTags : string array
  val hiddenTags : string array
  val internalTags : string array
  val pageChildrenClasses : string array
  val pageClasses : string array
  val privateTags : string array
end

module ClassRead : sig
  val extendsEntitiesCheckedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.value ->
    Datascript.entity array

  val logseqClassValueWith :
    Runtime_codec.adapter -> Runtime_codec.value -> bool

  val objectsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Datascript.entity array

  val structuredChildren :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value array

  val userClassNamespace : string -> bool
end

module ClassWorkflow : sig
  val buildNew :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    sqlite_util_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val createUserIdent :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    string ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module ContentWorkflow : sig
  val containsUuidRefWith : Runtime_codec.adapter -> Runtime_codec.value -> bool

  val contentIdRefToPageWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Js.String.t ->
    Runtime_codec.value ->
    Js.String.t

  val idRefToTitleRefWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Datascript.database Js.Nullable.t ->
    bool ->
    bool ->
    Runtime_codec.value

  val matchedIdsWith : Runtime_codec.adapter -> string -> Runtime_codec.value

  val replaceTagRefsWithPageRefsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Js.String.t ->
    Runtime_codec.value ->
    Js.String.t

  val replaceTagsWithIdRefsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Js.String.t ->
    Runtime_codec.value ->
    Js.String.t

  val replaceTitleRefsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    bool ->
    Js.String.t

  val replaceUuidInBlockTitleWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    int ->
    bool ->
    Datascript.value

  val updateBlockContentWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity ->
    Datascript.value ->
    Datascript.entity
end

module CoreRead : sig
  val aliasSourcePageWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value Js.Nullable.t ->
    Runtime_codec.value Js.Nullable.t

  val allPagesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity array

  val allTaggedPagesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value

  val casePageByReferenceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Runtime_codec.value ->
    Datascript.entity Js.Nullable.t

  val hasChildrenByReferenceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool

  val hiddenOrInternalTagWith :
    Runtime_codec.adapter -> Datascript.adapter -> Datascript.entity -> bool

  val journalPageByDatabaseWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Runtime_codec.value ->
    Datascript.entity Js.Nullable.t

  val journalPageByDayInputWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Runtime_codec.value Js.Nullable.t ->
    Datascript.entity Js.Nullable.t

  val keyValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    Datascript.value Js.Nullable.t

  val lastChildBlockWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    bool Js.Nullable.t

  val lastDirectChildIdWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool ->
    Runtime_codec.value Js.Nullable.t

  val libraryPageWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity Js.Nullable.t

  val nonConsecutiveBlocksWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity array ->
    Datascript.entity array

  val optionalKeyValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.value ->
    Datascript.value Js.Nullable.t

  val orphanedPagesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value Js.Nullable.t ->
    Runtime_codec.value ->
    Runtime_codec.callback Js.Nullable.t ->
    Datascript.entity array

  val pageAliasSetWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value array

  val pageBlocksByPageWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value Js.Nullable.t ->
    Datascript.pull_pattern ->
    Datascript.value array Js.Nullable.t

  val pageBlocksCountWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    int

  val pageByReferenceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Runtime_codec.value ->
    Datascript.entity Js.Nullable.t

  val pageEmptyByReferenceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool

  val pageExistsInputWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value Js.Nullable.t ->
    Runtime_codec.value ->
    Runtime_codec.value array Js.Nullable.t

  val pageInLibraryWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity ->
    bool

  val pagesRelationWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    bool ->
    Datascript.value

  val pagesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value array

  val parentsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    int ->
    Datascript.entity array

  val sortPageRandomBlocksWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity array ->
    Datascript.entity array
end

module DbIdent : sig
  val createGenerated : string -> string -> string

  val ensureUniqueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val normalizeNamePart : string -> string
end

module DeleteWorkflow : sig
  val cleanupWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val expandWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module EntityLookup : sig
  val immutableIdents : string array
  val nilIdents : string array
end

module EntityLookupWorkflow : sig
  type capabilities = entity_lookup_workflow_capabilities

  type log_lookup_error_callback =
    entity_lookup_workflow_log_lookup_error_callback

  type value = entity_lookup_workflow_value

  val dbBasedNullableWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    entity_lookup_workflow_capabilities ->
    Datascript.database Js.Nullable.t ->
    bool Js.Nullable.t

  val lookupSafeWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    entity_lookup_workflow_capabilities ->
    entity_lookup_workflow_value ->
    Runtime_codec.value ->
    entity_lookup_workflow_value ->
    entity_lookup_workflow_log_lookup_error_callback ->
    Runtime_codec.value

  val memoizedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool ->
    Datascript.entity Js.Nullable.t
end

module EntityRead : sig
  val entityToMapWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value

  val entityTypesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    string array

  val fieldPresentWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    string ->
    bool

  val fieldValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    string ->
    Datascript.value

  val hasTagWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    string ->
    bool Js.Nullable.t

  val hiddenWith :
    Runtime_codec.adapter -> Datascript.adapter -> Datascript.entity -> bool

  val pageWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    bool Js.Nullable.t

  val pagesByNameWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    string ->
    Datascript.datom array

  val recycledWith :
    Runtime_codec.adapter -> Datascript.adapter -> Datascript.entity -> bool
end

module FrontendRead : sig
  type encoded_extend = frontend_read_encoded_extend

  val allPropertiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value array

  val builtInClassProperty :
    bool -> bool -> bool -> string -> string array -> bool

  val builtInPageNullableWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    string ->
    Datascript.entity Js.Nullable.t

  val classIdentByDisplayType : string -> string Js.Nullable.t

  val classInstanceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.entity ->
    bool

  val classTitleWithExtends :
    string Js.Nullable.t ->
    frontend_read_encoded_extend array ->
    string Js.Nullable.t

  val classesParentsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value array

  val displayTypeByClassIdent : string -> string Js.Nullable.t
  val inlineTag : string -> string -> bool
  val library : bool -> string -> string -> bool
  val nodeDisplayTypeClasses : string array

  val pageParentsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Runtime_codec.value array Js.Nullable.t

  val privateBuiltInPage : bool -> bool -> bool -> bool -> bool

  val titleWithParentsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    String.t ->
    Runtime_codec.value
end

module InitialDataWorkflow : sig
  type encoded_result = initial_data_workflow_encoded_result

  val blockAndChildrenWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool ->
    Runtime_codec.value ->
    bool ->
    Runtime_codec.value Js.Nullable.t

  val getWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    initial_data_workflow_encoded_result

  val withParentWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module InitialRead : sig
  val blockAliasesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value array

  val blockRefsCountWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    int

  val blockRefsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Datascript.entity array

  val childrenEntitiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    bool ->
    Datascript.entity array Js.Nullable.t

  val childrenIdsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    bool ->
    int array Js.Nullable.t

  val fullChildrenWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value array

  val latestJournalsNowWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    ((unit -> float)[@u]) ->
    Datascript.entity array

  val oldestPageByNameInputWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Runtime_codec.value ->
    int Js.Nullable.t

  val oldestPageByTitle :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    string ->
    int Js.Nullable.t

  val recentPagesNullableWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.entity array Js.Nullable.t
end

module InputWorkflow : sig
  type capabilities = input_workflow_capabilities

  val resolveWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    input_workflow_capabilities ->
    Runtime_codec.value Js.Nullable.t ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module KvEntity : sig
  val entries : (string * string * bool) array
end

module NormalizePlan : sig
  val normalizeDatomWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value Js.Nullable.t

  val normalizeTxDataWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val removeConflictDatomsWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val removeRetractEntityRefsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val reorderRetractEntityWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val replaceAttrRetractV2With :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val replaceAttrRetractWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val sortDatomsWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value
end

module Order : sig
  val advanceCellWith :
    Runtime_codec.adapter -> Runtime_codec.value -> string Js.Nullable.t -> unit

  val advanceTrackedMaxKey : string Js.Nullable.t -> unit

  val generateKeyWithStateWith :
    Runtime_codec.adapter ->
    bool ->
    Runtime_codec.value ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string

  val generateNKeysWithStateWith :
    Runtime_codec.adapter ->
    bool ->
    Runtime_codec.value ->
    int ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string array

  val generateTrackedKeyBetween :
    string Js.Nullable.t -> string Js.Nullable.t -> string

  val maxOrderWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value

  val nextOrderWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Datascript.value ->
    string Js.Nullable.t

  val previousOrderWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Datascript.value ->
    string Js.Nullable.t

  val validateOrderKey : string -> bool
end

module PropertyBuild : sig
  type encoded_closed_value_options =
    property_build_encoded_closed_value_options

  type encoded_property_values_options =
    property_build_encoded_property_values_options

  type encoded_value_block_options = property_build_encoded_value_block_options
  type float_callback = property_build_float_callback
  type value_callback = property_build_value_callback

  val buildClosedValueBlockWith :
    Runtime_codec.adapter ->
    property_build_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    property_build_encoded_closed_value_options ->
    Runtime_codec.value

  val buildClosedValuesWith :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.callback Js.Nullable.t ->
    Runtime_codec.callback Js.Nullable.t ->
    Runtime_codec.value

  val buildPropertiesWithRefValuesWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val buildPropertyValuesWith :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    property_build_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    property_build_encoded_property_values_options ->
    Runtime_codec.value

  val buildValueBlockWith :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    property_build_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    property_build_encoded_value_block_options ->
    Runtime_codec.value

  val closedValuesToBlocksWith :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module PropertyCatalog : sig
  type encoded_closed_value = property_catalog_encoded_closed_value
  type encoded_entry = property_catalog_encoded_entry

  val closedValues :
    string -> property_catalog_encoded_closed_value array Js.Nullable.t

  val dbAttributeProperties : string array
  val entries : property_catalog_encoded_entry array
  val logseqPropertyNamespaces : string array
  val privateDbAttributeProperties : string array
  val publicBuiltInProperties : string array
  val publicDbAttributeProperties : string array
  val readOnlyProperties : string array
  val schemaProperties : string array
  val schemaPropertiesMap : (string * string) array
end

module PropertyIdentity : sig
  val builtInHasRefValue : string -> bool

  val builtInI18nKey :
    string Js.Nullable.t -> string -> (string * string) Js.Nullable.t

  val isInternalProperty : string Js.Nullable.t -> string -> bool -> bool
  val isLogseqPropertyNamespace : string Js.Nullable.t -> bool
  val isPluginPropertyNamespace : string Js.Nullable.t -> bool
  val isProperty : string Js.Nullable.t -> string -> bool -> bool
  val isUserPropertyNamespace : string -> bool
  val validPropertyName : string -> bool
end

module PropertyOrder : sig
  val classOrderedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.entity array

  val normalizeEntitiesValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value

  val sortEntitiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity array ->
    Datascript.entity array
end

module PropertyScope : sig
  val closedValueByNameNullableWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.value ->
    Datascript.value ->
    Runtime_codec.value Js.Nullable.t

  val closedValuesNullableWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.value ->
    Runtime_codec.value array Js.Nullable.t

  val scopedValuesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.entity ->
    Runtime_codec.value Js.Nullable.t ->
    Datascript.entity array
end

module PropertyShape : sig
  val isMany : string -> bool

  val isPropertyCreatedBlockWith :
    Runtime_codec.adapter -> Runtime_codec.value -> bool
end

module PropertyType : sig
  val allRef : string array
  val cardinality : string array
  val closedValue : string array
  val defaultValueRef : string array
  val infer : bool -> bool -> bool -> string
  val internalBuiltIn : string array
  val originalValueRef : string array

  val propertyValueContent :
    string Js.Nullable.t -> bool -> string Js.Nullable.t -> bool

  val textRef : string array
  val userAllowedInternal : string array
  val userBuiltIn : string array
  val userRef : string array
  val valueRef : string array
  val withDb : string array
end

module PropertyWorkflow : sig
  val blockValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database Js.Nullable.t ->
    Datascript.entity ->
    Datascript.value ->
    Runtime_codec.value

  val builtInDisplayTitleWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    ((Runtime_codec.value -> Datascript.value)[@u]) ->
    Datascript.value

  val contentWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.value

  val createUserIdent :
    Runtime_codec.adapter ->
    string ->
    string Js.Nullable.t ->
    Runtime_codec.value

  val lookupWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.value ->
    Datascript.value

  val propertiesWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val publicBuiltInWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val schemaWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value
end

module ReferenceFilter : sig
  val unlinkedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    Datascript.entity array Js.Nullable.t
end

module ReferenceWorkflow : sig
  type encoded_filters = reference_workflow_encoded_filters
  type encoded_result = reference_workflow_encoded_result

  val filtersWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    reference_workflow_encoded_filters Js.Nullable.t

  val linkedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    reference_workflow_encoded_result
end

module Rules : sig
  type encoded_form = rules_encoded_form

  val dbQueryDslEntries : (string * rules_encoded_form) array
  val dependencyEntries : (string * string array) array
  val entries : (string * rules_encoded_form) array

  val extractWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val fullDependencies :
    string array -> (string * string array) array -> string array
end

module Schema : sig
  val cardManyAttributes : string array
  val cardManyRefTypeAttributes : string array
  val cardOneRefTypeAttributes : string array
  val dbNonRefAttributes : string array

  val entries :
    (string
    * string Js.Nullable.t
    * string Js.Nullable.t
    * bool
    * string Js.Nullable.t)
    array

  val refTypeAttributes : string array
  val retractAttributes : string array
end

module SchemaVersion : sig
  type encoded = schema_version_encoded

  val compareValuesWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value -> int

  val decodeValueWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    schema_version_encoded Js.Nullable.t

  val stringValueWith :
    Runtime_codec.adapter -> Runtime_codec.value -> string Js.Nullable.t

  val valueIsVersionWith : Runtime_codec.adapter -> Runtime_codec.value -> bool
  val version : schema_version_encoded
end

module SqliteBuild : sig
  val blockPropertyValueWith :
    Runtime_codec.adapter -> Runtime_codec.value -> bool

  val extractBlocksWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    Runtime_codec.callback ->
    Runtime_codec.value

  val getUsedPropertiesWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val nextTempId : unit -> int

  val pagePropertyValueWith :
    Runtime_codec.adapter -> Runtime_codec.value -> bool

  val updateBlocksWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    Runtime_codec.callback ->
    Runtime_codec.value
end

module SqliteBuildWorkflow : sig
  val buildBlocksTx :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val createBlocksInput :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.connection ->
    Runtime_codec.value ->
    Datascript.transaction_report Js.Nullable.t

  val validateOptionsWith : Runtime_codec.adapter -> Runtime_codec.value -> unit
end

module SqliteCliWorkflow : sig
  type adapter = sqlite_cli_workflow_adapter
  type connection = sqlite_cli_workflow_connection
  type encoded_open = sqlite_cli_workflow_encoded_open
  type sqlite = sqlite_cli_workflow_sqlite
  type storage = sqlite_cli_workflow_storage

  val newStorageWith :
    Runtime_codec.adapter ->
    sqlite_cli_workflow_adapter ->
    sqlite_cli_workflow_sqlite ->
    sqlite_cli_workflow_storage

  val openArgsWith : sqlite_cli_workflow_adapter -> string -> string array

  val openStorageConnectionWith :
    Runtime_codec.adapter ->
    sqlite_cli_workflow_adapter ->
    string Js.Nullable.t ->
    string ->
    sqlite_cli_workflow_connection

  val openStorageWith :
    Runtime_codec.adapter ->
    sqlite_cli_workflow_adapter ->
    string Js.Nullable.t ->
    string ->
    sqlite_cli_workflow_encoded_open
end

module SqliteCreateGraph : sig
  type encoded_initial_options = sqlite_create_graph_encoded_initial_options
  type float_callback = sqlite_create_graph_float_callback

  val buildInitialClassesWith :
    Runtime_codec.adapter ->
    sqlite_create_graph_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val buildInitialData :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    sqlite_create_graph_float_callback ->
    property_build_value_callback ->
    string ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    sqlite_create_graph_encoded_initial_options ->
    Runtime_codec.value

  val buildInitialViewsWith :
    Runtime_codec.adapter ->
    sqlite_create_graph_float_callback ->
    Runtime_codec.value

  val buildProperties :
    Runtime_codec.adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    sqlite_create_graph_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val markBuiltInWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value
end

module SqliteDebugWorkflow : sig
  val findMissingNode : sqlite_gc_workflow_database -> int array

  val findMissingWasm : sqlite_gc_workflow_database -> int array
end

module SqliteExport : sig
  val importTransactionDataWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value

  val sortPagesWith :
    Runtime_codec.adapter -> Runtime_codec.value -> Runtime_codec.value
end

module SqliteExportWorkflow : sig
  type diff_capabilities = sqlite_export_workflow_diff_capabilities

  type encoded_import_validation_result =
    sqlite_export_workflow_encoded_import_validation_result

  type export_capabilities = sqlite_export_workflow_export_capabilities

  val buildExportWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    sqlite_export_workflow_export_capabilities ->
    string ->
    Runtime_codec.value ->
    Runtime_codec.value

  val buildImport :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value

  val createSeededConnectionWith :
    Datascript.adapter ->
    Datascript.schema ->
    Datascript.transaction_data ->
    Datascript.connection

  val diffExportsWith :
    Runtime_codec.adapter ->
    sqlite_export_workflow_diff_capabilities ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val pruneUnreferencedUuidsWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val validateImportTransactionsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Datascript.database ->
    string ->
    sqlite_export_workflow_encoded_import_validation_result

  val validateSeededExport :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Datascript.schema ->
    Datascript.transaction_data ->
    Runtime_codec.value ->
    sqlite_export_workflow_encoded_import_validation_result
end

module SqliteGcWorkflow : sig
  type database = sqlite_gc_workflow_database

  val collectNodeDefault : sqlite_gc_workflow_database -> bool -> unit

  val collectWasmDefault :
    sqlite_gc_workflow_database Js.Nullable.t -> bool -> unit

  val ensureNoGarbageDefault : sqlite_gc_workflow_database -> bool
end

module SqliteLifecycle : sig
  module Domain : sig
    type 'a backup = 'a sqlite_lifecycle_domain_backup
    type 'a close = 'a sqlite_lifecycle_domain_close
    type 'a open_db = 'a sqlite_lifecycle_domain_open_db
    type remove = sqlite_lifecycle_domain_remove
  end

  val backupConnection :
    'a sqlite_lifecycle_domain_backup ->
    sqlite_lifecycle_domain_remove ->
    'a ->
    string ->
    unit Js.Promise.t

  val backupFile :
    'a sqlite_lifecycle_domain_open_db ->
    'a sqlite_lifecycle_domain_backup ->
    sqlite_lifecycle_domain_remove ->
    'a sqlite_lifecycle_domain_close ->
    string ->
    string ->
    unit Js.Promise.t

  val storageConnection :
    Datascript.adapter ->
    Datascript.storage ->
    Datascript.schema ->
    Datascript.connection
end

module SqlitePolicy : sig
  val dbBasedGraphNullable :
    string -> string Js.Nullable.t -> bool Js.Nullable.t

  val sanitizeDbName : string -> string -> string
end

module SqliteUtil : sig
  type float_callback = sqlite_util_float_callback
  type value_callback = sqlite_util_value_callback

  val buildClassWith :
    Runtime_codec.adapter ->
    sqlite_util_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value

  val buildPageWith :
    Runtime_codec.adapter ->
    sqlite_util_float_callback ->
    string ->
    Runtime_codec.value

  val buildProperty :
    Runtime_codec.adapter ->
    sqlite_util_value_callback ->
    sqlite_util_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value

  val importTxWith :
    Runtime_codec.adapter ->
    sqlite_util_float_callback ->
    Runtime_codec.value ->
    Runtime_codec.value

  val kvWith :
    Runtime_codec.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module TransactionExecution : sig
  type collector = transaction_execution_collector
  type execution_adapter = transaction_execution_execution_adapter

  val batchWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    transaction_execution_execution_adapter ->
    Datascript.connection ->
    Datascript.transaction_metadata ->
    ((Datascript.connection -> unit)[@u]) ->
    ((Datascript.transaction_report -> unit)[@u]) Js.Nullable.t ->
    Datascript.listener_key ->
    Datascript.transaction_report

  val batchWithTemp :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    transaction_execution_execution_adapter ->
    Datascript.connection ->
    Datascript.transaction_metadata ->
    ((Datascript.connection -> transaction_execution_collector -> unit)[@u]) ->
    ((Datascript.transaction_report -> unit)[@u]) Js.Nullable.t ->
    ((unit -> unit)[@u]) Js.Nullable.t ->
    ((Datascript.connection ->
     Datascript.transaction_data ->
     Datascript.transaction_metadata ->
     Runtime_codec.value)
    [@u]) ->
    Datascript.listener_key ->
    Runtime_codec.value Js.Nullable.t

  val transactOwnedWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    transaction_execution_execution_adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    bool ->
    Runtime_codec.value Js.Nullable.t
end

module TransactionPolicy : sig
  type encoded_favorite = transaction_policy_encoded_favorite

  val favorite : string -> transaction_policy_encoded_favorite
end

module TransactionRuntime : sig
  type invalid_callback = transaction_runtime_invalid_callback
  type pipeline_callback = transaction_runtime_pipeline_callback
  type transact_callback = transaction_runtime_transact_callback

  val invalidCallback :
    unit -> transaction_runtime_invalid_callback Js.Nullable.t

  val pipelineCallback :
    unit -> transaction_runtime_pipeline_callback Js.Nullable.t

  val registerInvalidCallback :
    transaction_runtime_invalid_callback Js.Nullable.t -> unit

  val registerPipeline :
    transaction_runtime_pipeline_callback Js.Nullable.t -> unit

  val registerTransact :
    transaction_runtime_transact_callback Js.Nullable.t -> unit

  val transactCallback :
    unit -> transaction_runtime_transact_callback Js.Nullable.t
end

module TransactionWorkflow : sig
  val replaceEntities :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module TreeWorkflow : sig
  val blockAndChildrenWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    bool ->
    Datascript.entity array Js.Nullable.t

  val childrenByReferenceWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Datascript.entity array Js.Nullable.t

  val firstChildOfWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    Datascript.entity Js.Nullable.t

  val firstChildWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    string ->
    Datascript.entity ->
    Datascript.entity Js.Nullable.t

  val siblingWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity ->
    string ->
    Datascript.entity Js.Nullable.t

  val sortWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.entity array ->
    Datascript.entity array
end

module ValidationDatabase : sig
  type encoded_counts = validation_database_encoded_counts

  val graphCountsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity array ->
    validation_database_encoded_counts
end

module ValidationDatom : sig
  val entitiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.datom array ->
    Runtime_codec.callback Js.Nullable.t ->
    Runtime_codec.value array

  val entityMapsWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.datom array ->
    Runtime_codec.callback Js.Nullable.t ->
    Runtime_codec.value
end

module ValidationEntity : sig
  val dispatchWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity ->
    string Js.Nullable.t
end

module ValidationIdentity : sig
  val isClassIdent : string Js.Nullable.t -> bool -> bool
  val isInternalIdent : string Js.Nullable.t -> string -> bool
  val isUserPropertyIdent : string Js.Nullable.t -> bool -> bool
end

module ValidationProperty : sig
  type encoded_validation_options =
    validation_property_encoded_validation_options

  val errorMessage : string -> string

  val prepareEntitiesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value array ->
    Runtime_codec.value array

  val requiredProperties : string array

  val validatePropertyValueWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.entity ->
    Runtime_codec.value ->
    validation_property_encoded_validation_options ->
    Runtime_codec.callback ->
    Runtime_codec.callback ->
    bool

  val valueValidWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    validation_property_encoded_validation_options ->
    bool
end

module ValidationSchema : sig
  type encoded_database_result = validation_schema_encoded_database_result

  type encoded_local_database_result =
    validation_schema_encoded_local_database_result

  type encoded_transaction_result = validation_schema_encoded_transaction_result
  type encoded_workflow_options = validation_schema_encoded_workflow_options
  type encoded_workflow_result = validation_schema_encoded_workflow_result

  type print_local_counts_callback =
    validation_schema_print_local_counts_callback

  val validateDatabaseWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_database_result

  val validateEntityWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_workflow_result

  val validateLocalDatabaseAndLogWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    validation_schema_encoded_workflow_options ->
    bool ->
    string Js.Nullable.t ->
    validation_schema_print_local_counts_callback ->
    validation_schema_encoded_local_database_result

  val validateTransactionWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.transaction_report ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_transaction_result
end

module ViewDataWorkflow : sig
  type encoded_options = view_data_workflow_encoded_options
  type encoded_result = view_data_workflow_encoded_result

  val getPropertyValuesWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value Js.Nullable.t ->
    Datascript.value array ->
    view_property_values_encoded_entry array

  val getWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Datascript.value ->
    view_data_workflow_encoded_options ->
    view_data_workflow_encoded_result
end

module ViewPropertyValues : sig
  type encoded_entry = view_property_values_encoded_entry

  val contentWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Datascript.database ->
    Runtime_codec.value ->
    Runtime_codec.value
end

module ViewWorkflow : sig
  val propertyValueForSearchWith :
    Runtime_codec.adapter ->
    Datascript.adapter ->
    Runtime_codec.value ->
    Runtime_codec.value ->
    Runtime_codec.value
end
