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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    int Js.Nullable.t ->
    runtime_codec_value array Js.Nullable.t
end

module BlockTitle : sig
  type encoded_workflow_options = block_title_encoded_workflow_options

  val uniqueTitleWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_value ->
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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_value ->
    datascript_entity array

  val logseqClassValueWith :
    runtime_codec_adapter -> runtime_codec_value -> bool

  val objectsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    datascript_entity array

  val structuredChildren :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value array

  val userClassNamespace : string -> bool
end

module ClassWorkflow : sig
  val buildNew :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    sqlite_util_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val createUserIdent :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    string ->
    runtime_codec_value ->
    runtime_codec_value
end

module ContentWorkflow : sig
  val containsUuidRefWith : runtime_codec_adapter -> runtime_codec_value -> bool

  val contentIdRefToPageWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    Js.String.t ->
    runtime_codec_value ->
    Js.String.t

  val idRefToTitleRefWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    datascript_database Js.Nullable.t ->
    bool ->
    bool ->
    runtime_codec_value

  val matchedIdsWith : runtime_codec_adapter -> string -> runtime_codec_value

  val replaceTagRefsWithPageRefsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    Js.String.t ->
    runtime_codec_value ->
    Js.String.t

  val replaceTagsWithIdRefsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    Js.String.t ->
    runtime_codec_value ->
    Js.String.t

  val replaceTitleRefsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    bool ->
    Js.String.t

  val replaceUuidInBlockTitleWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    int ->
    bool ->
    datascript_value

  val updateBlockContentWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity ->
    datascript_value ->
    datascript_entity
end

module CoreRead : sig
  val aliasSourcePageWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value Js.Nullable.t ->
    runtime_codec_value Js.Nullable.t

  val allPagesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity array

  val allTaggedPagesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value

  val casePageByReferenceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    runtime_codec_value ->
    datascript_entity Js.Nullable.t

  val hasChildrenByReferenceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool

  val hiddenOrInternalTagWith :
    runtime_codec_adapter -> datascript_adapter -> datascript_entity -> bool

  val journalPageByDatabaseWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    runtime_codec_value ->
    datascript_entity Js.Nullable.t

  val journalPageByDayInputWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    runtime_codec_value Js.Nullable.t ->
    datascript_entity Js.Nullable.t

  val keyValueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    datascript_value Js.Nullable.t

  val lastChildBlockWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value ->
    bool Js.Nullable.t

  val lastDirectChildIdWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool ->
    runtime_codec_value Js.Nullable.t

  val libraryPageWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity Js.Nullable.t

  val nonConsecutiveBlocksWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity array ->
    datascript_entity array

  val optionalKeyValueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_value ->
    datascript_value Js.Nullable.t

  val orphanedPagesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value Js.Nullable.t ->
    runtime_codec_value ->
    runtime_codec_callback Js.Nullable.t ->
    datascript_entity array

  val pageAliasSetWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value array

  val pageBlocksByPageWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value Js.Nullable.t ->
    datascript_pull_pattern ->
    datascript_value array Js.Nullable.t

  val pageBlocksCountWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    int

  val pageByReferenceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    runtime_codec_value ->
    datascript_entity Js.Nullable.t

  val pageEmptyByReferenceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool

  val pageExistsInputWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value Js.Nullable.t ->
    runtime_codec_value ->
    runtime_codec_value array Js.Nullable.t

  val pageInLibraryWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity ->
    bool

  val pagesRelationWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    bool ->
    datascript_value

  val pagesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value array

  val parentsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    int ->
    datascript_entity array

  val sortPageRandomBlocksWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity array ->
    datascript_entity array
end

module DbIdent : sig
  val createGenerated : string -> string -> string

  val ensureUniqueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val normalizeNamePart : string -> string
end

module DeleteWorkflow : sig
  val cleanupWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val expandWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value
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
    runtime_codec_adapter ->
    datascript_adapter ->
    entity_lookup_workflow_capabilities ->
    datascript_database Js.Nullable.t ->
    bool Js.Nullable.t

  val lookupSafeWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    entity_lookup_workflow_capabilities ->
    entity_lookup_workflow_value ->
    runtime_codec_value ->
    entity_lookup_workflow_value ->
    entity_lookup_workflow_log_lookup_error_callback ->
    runtime_codec_value

  val memoizedWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool ->
    datascript_entity Js.Nullable.t
end

module EntityRead : sig
  val entityToMapWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value

  val entityTypesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    string array

  val fieldPresentWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    string ->
    bool

  val fieldValueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    string ->
    datascript_value

  val hasTagWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    string ->
    bool Js.Nullable.t

  val hiddenWith :
    runtime_codec_adapter -> datascript_adapter -> datascript_entity -> bool

  val pageWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    bool Js.Nullable.t

  val pagesByNameWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    string ->
    datascript_datom array

  val recycledWith :
    runtime_codec_adapter -> datascript_adapter -> datascript_entity -> bool
end

module FrontendRead : sig
  type encoded_extend = frontend_read_encoded_extend

  val allPropertiesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value array

  val builtInClassProperty :
    bool -> bool -> bool -> string -> string array -> bool

  val builtInPageNullableWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    string ->
    datascript_entity Js.Nullable.t

  val classIdentByDisplayType : string -> string Js.Nullable.t

  val classInstanceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_entity ->
    bool

  val classTitleWithExtends :
    string Js.Nullable.t ->
    frontend_read_encoded_extend array ->
    string Js.Nullable.t

  val classesParentsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value array

  val displayTypeByClassIdent : string -> string Js.Nullable.t
  val inlineTag : string -> string -> bool
  val library : bool -> string -> string -> bool
  val nodeDisplayTypeClasses : string array

  val pageParentsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    runtime_codec_value array Js.Nullable.t

  val privateBuiltInPage : bool -> bool -> bool -> bool -> bool

  val titleWithParentsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    String.t ->
    runtime_codec_value
end

module InitialDataWorkflow : sig
  type encoded_result = initial_data_workflow_encoded_result

  val blockAndChildrenWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool ->
    runtime_codec_value ->
    bool ->
    runtime_codec_value Js.Nullable.t

  val getWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    initial_data_workflow_encoded_result

  val withParentWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value
end

module InitialRead : sig
  val blockAliasesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value array

  val blockRefsCountWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    int

  val blockRefsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    datascript_entity array

  val childrenEntitiesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    bool ->
    datascript_entity array Js.Nullable.t

  val childrenIdsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    bool ->
    int array Js.Nullable.t

  val fullChildrenWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value array

  val latestJournalsNowWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    ((unit -> float)[@u]) ->
    datascript_entity array

  val oldestPageByNameInputWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    runtime_codec_value ->
    int Js.Nullable.t

  val oldestPageByTitle :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    string ->
    int Js.Nullable.t

  val recentPagesNullableWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_entity array Js.Nullable.t
end

module InputWorkflow : sig
  type capabilities = input_workflow_capabilities

  val resolveWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    input_workflow_capabilities ->
    runtime_codec_value Js.Nullable.t ->
    runtime_codec_value ->
    runtime_codec_value
end

module KvEntity : sig
  val entries : (string * string * bool) array
end

module NormalizePlan : sig
  val normalizeDatomWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value Js.Nullable.t

  val normalizeTxDataWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val removeConflictDatomsWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val removeRetractEntityRefsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val reorderRetractEntityWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val replaceAttrRetractV2With :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val replaceAttrRetractWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val sortDatomsWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value
end

module Order : sig
  val advanceCellWith :
    runtime_codec_adapter -> runtime_codec_value -> string Js.Nullable.t -> unit

  val advanceTrackedMaxKey : string Js.Nullable.t -> unit

  val generateKeyWithStateWith :
    runtime_codec_adapter ->
    bool ->
    runtime_codec_value ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string

  val generateNKeysWithStateWith :
    runtime_codec_adapter ->
    bool ->
    runtime_codec_value ->
    int ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string array

  val generateTrackedKeyBetween :
    string Js.Nullable.t -> string Js.Nullable.t -> string

  val maxOrderWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value

  val nextOrderWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    datascript_value ->
    string Js.Nullable.t

  val previousOrderWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    datascript_value ->
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
    runtime_codec_adapter ->
    property_build_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    property_build_encoded_closed_value_options ->
    runtime_codec_value

  val buildClosedValuesWith :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_callback Js.Nullable.t ->
    runtime_codec_callback Js.Nullable.t ->
    runtime_codec_value

  val buildPropertiesWithRefValuesWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val buildPropertyValuesWith :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    property_build_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    property_build_encoded_property_values_options ->
    runtime_codec_value

  val buildValueBlockWith :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    property_build_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    property_build_encoded_value_block_options ->
    runtime_codec_value

  val closedValuesToBlocksWith :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_float_callback ->
    runtime_codec_value ->
    runtime_codec_value
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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_entity array

  val normalizeEntitiesValueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value

  val sortEntitiesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity array ->
    datascript_entity array
end

module PropertyScope : sig
  val closedValueByNameNullableWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_value ->
    datascript_value ->
    runtime_codec_value Js.Nullable.t

  val closedValuesNullableWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_value ->
    runtime_codec_value array Js.Nullable.t

  val scopedValuesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_entity ->
    runtime_codec_value Js.Nullable.t ->
    datascript_entity array
end

module PropertyShape : sig
  val isMany : string -> bool

  val isPropertyCreatedBlockWith :
    runtime_codec_adapter -> runtime_codec_value -> bool
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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database Js.Nullable.t ->
    datascript_entity ->
    datascript_value ->
    runtime_codec_value

  val builtInDisplayTitleWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    ((runtime_codec_value -> datascript_value)[@u]) ->
    datascript_value

  val contentWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_value

  val createUserIdent :
    runtime_codec_adapter ->
    string ->
    string Js.Nullable.t ->
    runtime_codec_value

  val lookupWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_value ->
    datascript_value

  val propertiesWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val publicBuiltInWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val schemaWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value
end

module ReferenceFilter : sig
  val unlinkedWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    datascript_entity array Js.Nullable.t
end

module ReferenceWorkflow : sig
  type encoded_filters = reference_workflow_encoded_filters
  type encoded_result = reference_workflow_encoded_result

  val filtersWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    reference_workflow_encoded_filters Js.Nullable.t

  val linkedWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    reference_workflow_encoded_result
end

module Rules : sig
  type encoded_form = rules_encoded_form

  val dbQueryDslEntries : (string * rules_encoded_form) array
  val dependencyEntries : (string * string array) array
  val entries : (string * rules_encoded_form) array

  val extractWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

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
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value -> int

  val decodeValueWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    schema_version_encoded Js.Nullable.t

  val stringValueWith :
    runtime_codec_adapter -> runtime_codec_value -> string Js.Nullable.t

  val valueIsVersionWith : runtime_codec_adapter -> runtime_codec_value -> bool
  val version : schema_version_encoded
end

module SqliteBuild : sig
  val blockPropertyValueWith :
    runtime_codec_adapter -> runtime_codec_value -> bool

  val extractBlocksWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    runtime_codec_callback ->
    runtime_codec_value

  val getUsedPropertiesWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val nextTempId : unit -> int

  val pagePropertyValueWith :
    runtime_codec_adapter -> runtime_codec_value -> bool

  val updateBlocksWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    runtime_codec_callback ->
    runtime_codec_value
end

module SqliteBuildWorkflow : sig
  val buildBlocksTx :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val createBlocksInput :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_connection ->
    runtime_codec_value ->
    datascript_transaction_report Js.Nullable.t

  val validateOptionsWith : runtime_codec_adapter -> runtime_codec_value -> unit
end

module SqliteCliWorkflow : sig
  type adapter = sqlite_cli_workflow_adapter
  type connection = sqlite_cli_workflow_connection
  type encoded_open = sqlite_cli_workflow_encoded_open
  type sqlite = sqlite_cli_workflow_sqlite
  type storage = sqlite_cli_workflow_storage

  val newStorageWith :
    runtime_codec_adapter ->
    sqlite_cli_workflow_adapter ->
    sqlite_cli_workflow_sqlite ->
    sqlite_cli_workflow_storage

  val openArgsWith : sqlite_cli_workflow_adapter -> string -> string array

  val openStorageConnectionWith :
    runtime_codec_adapter ->
    sqlite_cli_workflow_adapter ->
    string Js.Nullable.t ->
    string ->
    sqlite_cli_workflow_connection

  val openStorageWith :
    runtime_codec_adapter ->
    sqlite_cli_workflow_adapter ->
    string Js.Nullable.t ->
    string ->
    sqlite_cli_workflow_encoded_open
end

module SqliteCreateGraph : sig
  type encoded_initial_options = sqlite_create_graph_encoded_initial_options
  type float_callback = sqlite_create_graph_float_callback

  val buildInitialClassesWith :
    runtime_codec_adapter ->
    sqlite_create_graph_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val buildInitialData :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    sqlite_create_graph_float_callback ->
    property_build_value_callback ->
    string ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    sqlite_create_graph_encoded_initial_options ->
    runtime_codec_value

  val buildInitialViewsWith :
    runtime_codec_adapter ->
    sqlite_create_graph_float_callback ->
    runtime_codec_value

  val buildProperties :
    runtime_codec_adapter ->
    property_build_value_callback ->
    property_build_value_callback ->
    sqlite_create_graph_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val markBuiltInWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value
end

module SqliteDebugWorkflow : sig
  val findMissingNode : sqlite_gc_workflow_database -> int array
  val findMissingWasm : sqlite_gc_workflow_database -> int array
end

module SqliteExport : sig
  val importTransactionDataWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value

  val sortPagesWith :
    runtime_codec_adapter -> runtime_codec_value -> runtime_codec_value
end

module SqliteExportWorkflow : sig
  type diff_capabilities = sqlite_export_workflow_diff_capabilities

  type encoded_import_validation_result =
    sqlite_export_workflow_encoded_import_validation_result

  type export_capabilities = sqlite_export_workflow_export_capabilities

  val buildExportWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    sqlite_export_workflow_export_capabilities ->
    string ->
    runtime_codec_value ->
    runtime_codec_value

  val buildImport :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value

  val createSeededConnectionWith :
    datascript_adapter ->
    datascript_schema ->
    datascript_transaction_data ->
    datascript_connection

  val diffExportsWith :
    runtime_codec_adapter ->
    sqlite_export_workflow_diff_capabilities ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val pruneUnreferencedUuidsWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val validateImportTransactionsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    datascript_database ->
    string ->
    sqlite_export_workflow_encoded_import_validation_result

  val validateSeededExport :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    datascript_schema ->
    datascript_transaction_data ->
    runtime_codec_value ->
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
    datascript_adapter ->
    datascript_storage ->
    datascript_schema ->
    datascript_connection
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
    runtime_codec_adapter ->
    sqlite_util_float_callback ->
    runtime_codec_value ->
    runtime_codec_value

  val buildPageWith :
    runtime_codec_adapter ->
    sqlite_util_float_callback ->
    string ->
    runtime_codec_value

  val buildProperty :
    runtime_codec_adapter ->
    sqlite_util_value_callback ->
    sqlite_util_float_callback ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value

  val importTxWith :
    runtime_codec_adapter ->
    sqlite_util_float_callback ->
    runtime_codec_value ->
    runtime_codec_value

  val kvWith :
    runtime_codec_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value
end

module TransactionExecution : sig
  type collector = transaction_execution_collector
  type execution_adapter = transaction_execution_execution_adapter

  val batchWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    transaction_execution_execution_adapter ->
    datascript_connection ->
    datascript_transaction_metadata ->
    ((datascript_connection -> unit)[@u]) ->
    ((datascript_transaction_report -> unit)[@u]) Js.Nullable.t ->
    datascript_listener_key ->
    datascript_transaction_report

  val batchWithTemp :
    runtime_codec_adapter ->
    datascript_adapter ->
    transaction_execution_execution_adapter ->
    datascript_connection ->
    datascript_transaction_metadata ->
    ((datascript_connection -> transaction_execution_collector -> unit)[@u]) ->
    ((datascript_transaction_report -> unit)[@u]) Js.Nullable.t ->
    ((unit -> unit)[@u]) Js.Nullable.t ->
    ((datascript_connection ->
     datascript_transaction_data ->
     datascript_transaction_metadata ->
     runtime_codec_value)
    [@u]) ->
    datascript_listener_key ->
    runtime_codec_value Js.Nullable.t

  val transactOwnedWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    transaction_execution_execution_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value ->
    bool ->
    runtime_codec_value Js.Nullable.t
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
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value
end

module TreeWorkflow : sig
  val blockAndChildrenWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    bool ->
    datascript_entity array Js.Nullable.t

  val childrenByReferenceWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    datascript_entity array Js.Nullable.t

  val firstChildOfWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    datascript_entity Js.Nullable.t

  val firstChildWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    string ->
    datascript_entity ->
    datascript_entity Js.Nullable.t

  val siblingWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity ->
    string ->
    datascript_entity Js.Nullable.t

  val sortWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_entity array ->
    datascript_entity array
end

module ValidationDatabase : sig
  type encoded_counts = validation_database_encoded_counts

  val graphCountsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity array ->
    validation_database_encoded_counts
end

module ValidationDatom : sig
  val entitiesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_datom array ->
    runtime_codec_callback Js.Nullable.t ->
    runtime_codec_value array

  val entityMapsWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_datom array ->
    runtime_codec_callback Js.Nullable.t ->
    runtime_codec_value
end

module ValidationEntity : sig
  val dispatchWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity ->
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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value array ->
    runtime_codec_value array

  val requiredProperties : string array

  val validatePropertyValueWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_entity ->
    runtime_codec_value ->
    validation_property_encoded_validation_options ->
    runtime_codec_callback ->
    runtime_codec_callback ->
    bool

  val valueValidWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value ->
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
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_database_result

  val validateEntityWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_workflow_result

  val validateLocalDatabaseAndLogWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    validation_schema_encoded_workflow_options ->
    bool ->
    string Js.Nullable.t ->
    validation_schema_print_local_counts_callback ->
    validation_schema_encoded_local_database_result

  val validateTransactionWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_transaction_report ->
    validation_schema_encoded_workflow_options ->
    validation_schema_encoded_transaction_result
end

module ViewDataWorkflow : sig
  type encoded_options = view_data_workflow_encoded_options
  type encoded_result = view_data_workflow_encoded_result

  val getPropertyValuesWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value Js.Nullable.t ->
    datascript_value array ->
    view_property_values_encoded_entry array

  val getWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    datascript_value ->
    view_data_workflow_encoded_options ->
    view_data_workflow_encoded_result
end

module ViewPropertyValues : sig
  type encoded_entry = view_property_values_encoded_entry

  val contentWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    datascript_database ->
    runtime_codec_value ->
    runtime_codec_value
end

module ViewWorkflow : sig
  val propertyValueForSearchWith :
    runtime_codec_adapter ->
    datascript_adapter ->
    runtime_codec_value ->
    runtime_codec_value ->
    runtime_codec_value
end
