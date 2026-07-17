module Asset : sig
  val checksumValue :
    Melange_db_api.Workflows.Asset.value -> string Js.Promise.t

  val digestHex : int array -> string
  val nameTitle : string -> string
  val pathType : string -> string
end

module Bidirectional : sig
  val getPropertiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    int Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value array Js.Nullable.t
end

module BlockTitle : sig
  val uniqueTitleWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.BlockTitle.encoded_workflow_options ->
    string Js.Nullable.t
end

module ClassCatalog : sig
  val blockKindTags : string array
  val disallowedInlineTags : string array

  val entries :
    (string
    * string
    * (string * Melange_db_api.Workflows.ClassCatalog.encoded_value)
      array
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
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.entity array

  val logseqClassValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val objectsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity array

  val structuredChildren :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val userClassNamespace : string -> bool
end

module ClassWorkflow : sig
  val buildNew :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.SqliteUtil.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val createUserIdent :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    string ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module ContentWorkflow : sig
  val containsUuidRefWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val contentIdRefToPageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Js.String.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Js.String.t

  val idRefToTitleRefWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    bool ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value

  val matchedIdsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    string ->
    Melange_db_api.Workflows.Runtime_codec.value

  val replaceTagRefsWithPageRefsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Js.String.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Js.String.t

  val replaceTagsWithIdRefsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Js.String.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Js.String.t

  val replaceTitleRefsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Js.String.t

  val replaceUuidInBlockTitleWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    int ->
    bool ->
    Melange_db_api.Workflows.Datascript.value

  val updateBlockContentWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.entity
end

module CoreRead : sig
  val aliasSourcePageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val allPagesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity array

  val allTaggedPagesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value

  val casePageByReferenceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val hasChildrenByReferenceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val hiddenOrInternalTagWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    bool

  val journalPageByDatabaseWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val journalPageByDayInputWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val keyValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.value Js.Nullable.t

  val lastChildBlockWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool Js.Nullable.t

  val lastDirectChildIdWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val libraryPageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val nonConsecutiveBlocksWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity array ->
    Melange_db_api.Workflows.Datascript.entity array

  val optionalKeyValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.value Js.Nullable.t

  val orphanedPagesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.callback Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.entity array

  val pageAliasSetWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val pageBlocksByPageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.pull_pattern ->
    Melange_db_api.Workflows.Datascript.value array Js.Nullable.t

  val pageBlocksCountWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    int

  val pageByReferenceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val pageEmptyByReferenceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val pageExistsInputWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array Js.Nullable.t

  val pageInLibraryWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity ->
    bool

  val pagesRelationWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    bool ->
    Melange_db_api.Workflows.Datascript.value

  val pagesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val parentsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    int ->
    Melange_db_api.Workflows.Datascript.entity array

  val sortPageRandomBlocksWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity array ->
    Melange_db_api.Workflows.Datascript.entity array
end

module DbIdent : sig
  val createGenerated : string -> string -> string

  val ensureUniqueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val normalizeNamePart : string -> string
end

module DeleteWorkflow : sig
  val cleanupWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val expandWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module EntityLookup : sig
  val immutableIdents : string array
  val nilIdents : string array
end

module EntityLookupWorkflow : sig
  val dbBasedNullableWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.EntityLookupWorkflow.capabilities ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    bool Js.Nullable.t

  val lookupSafeWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.EntityLookupWorkflow.capabilities ->
    Melange_db_api.Workflows.EntityLookupWorkflow.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.EntityLookupWorkflow.value ->
    Melange_db_api.Workflows.EntityLookupWorkflow
    .log_lookup_error_callback ->
    Melange_db_api.Workflows.Runtime_codec.value

  val memoizedWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t
end

module EntityRead : sig
  val entityToMapWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val entityTypesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    string array

  val fieldPresentWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    string ->
    bool

  val fieldValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    string ->
    Melange_db_api.Workflows.Datascript.value

  val hasTagWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    string ->
    bool Js.Nullable.t

  val hiddenWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    bool

  val pageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool Js.Nullable.t

  val pagesByNameWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    string ->
    Melange_db_api.Workflows.Datascript.datom array

  val recycledWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    bool
end

module FrontendRead : sig
  val allPropertiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val builtInClassProperty :
    bool -> bool -> bool -> string -> string array -> bool

  val builtInPageNullableWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    string ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val classIdentByDisplayType : string -> string Js.Nullable.t

  val classInstanceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.entity ->
    bool

  val classTitleWithExtends :
    string Js.Nullable.t ->
    Melange_db_api.Workflows.FrontendRead.encoded_extend array ->
    string Js.Nullable.t

  val classesParentsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val displayTypeByClassIdent : string -> string Js.Nullable.t
  val inlineTag : string -> string -> bool
  val library : bool -> string -> string -> bool
  val nodeDisplayTypeClasses : string array

  val pageParentsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Runtime_codec.value array Js.Nullable.t

  val privateBuiltInPage : bool -> bool -> bool -> bool -> bool

  val titleWithParentsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    String.t ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module InitialDataWorkflow : sig
  val blockAndChildrenWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val getWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.InitialDataWorkflow.encoded_result

  val withParentWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module InitialRead : sig
  val blockAliasesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val blockRefsCountWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    int

  val blockRefsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity array

  val childrenEntitiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    bool ->
    Melange_db_api.Workflows.Datascript.entity array Js.Nullable.t

  val childrenIdsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    bool ->
    int array Js.Nullable.t

  val fullChildrenWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val latestJournalsNowWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    ((unit -> float)[@u]) ->
    Melange_db_api.Workflows.Datascript.entity array

  val oldestPageByNameInputWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    int Js.Nullable.t

  val oldestPageByTitle :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    string ->
    int Js.Nullable.t

  val recentPagesNullableWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.entity array Js.Nullable.t
end

module InputWorkflow : sig
  val resolveWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.InputWorkflow.capabilities ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module KvEntity : sig
  val entries : (string * string * bool) array
end

module NormalizePlan : sig
  val normalizeDatomWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val normalizeTxDataWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val removeConflictDatomsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val removeRetractEntityRefsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val reorderRetractEntityWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val replaceAttrRetractV2With :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val replaceAttrRetractWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val sortDatomsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module Order : sig
  val advanceCellWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    string Js.Nullable.t ->
    unit

  val advanceTrackedMaxKey : string Js.Nullable.t -> unit

  val generateKeyWithStateWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string

  val generateNKeysWithStateWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    int ->
    string Js.Nullable.t ->
    string Js.Nullable.t ->
    string array

  val generateTrackedKeyBetween :
    string Js.Nullable.t -> string Js.Nullable.t -> string

  val maxOrderWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value

  val nextOrderWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.value ->
    string Js.Nullable.t

  val previousOrderWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.value ->
    string Js.Nullable.t

  val validateOrderKey : string -> bool
end

module PropertyBuild : sig
  val buildClosedValueBlockWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.PropertyBuild
    .encoded_closed_value_options ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildClosedValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.callback Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.callback Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildPropertiesWithRefValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildPropertyValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.PropertyBuild
    .encoded_property_values_options ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildValueBlockWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.PropertyBuild.encoded_value_block_options ->
    Melange_db_api.Workflows.Runtime_codec.value

  val closedValuesToBlocksWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module PropertyCatalog : sig
  val closedValues :
    string ->
    Melange_db_api.Workflows.PropertyCatalog.encoded_closed_value
    array
    Js.Nullable.t

  val dbAttributeProperties : string array

  val entries :
    Melange_db_api.Workflows.PropertyCatalog.encoded_entry array

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
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.entity array

  val normalizeEntitiesValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val sortEntitiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity array ->
    Melange_db_api.Workflows.Datascript.entity array
end

module PropertyScope : sig
  val closedValueByNameNullableWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val closedValuesNullableWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Runtime_codec.value array Js.Nullable.t

  val scopedValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.entity array
end

module PropertyShape : sig
  val isMany : string -> bool

  val isPropertyCreatedBlockWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool
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
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val builtInDisplayTitleWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    ((Melange_db_api.Workflows.Runtime_codec.value ->
     Melange_db_api.Workflows.Datascript.value)
    [@u]) ->
    Melange_db_api.Workflows.Datascript.value

  val contentWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.value

  val createUserIdent :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    string ->
    string Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value

  val lookupWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.value

  val propertiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val publicBuiltInWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val schemaWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module ReferenceFilter : sig
  val unlinkedWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.Datascript.entity array Js.Nullable.t
end

module ReferenceWorkflow : sig
  val filtersWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.ReferenceWorkflow.encoded_filters
    Js.Nullable.t

  val linkedWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.ReferenceWorkflow.encoded_result
end

module Rules : sig
  val dbQueryDslEntries :
    (string * Melange_db_api.Workflows.Rules.encoded_form) array

  val dependencyEntries : (string * string array) array

  val entries :
    (string * Melange_db_api.Workflows.Rules.encoded_form) array

  val extractWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

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
  val compareValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    int

  val decodeValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.SchemaVersion.encoded Js.Nullable.t

  val stringValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    string Js.Nullable.t

  val valueIsVersionWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val version : Melange_db_api.Workflows.SchemaVersion.encoded
end

module SqliteBuild : sig
  val blockPropertyValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val extractBlocksWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.callback ->
    Melange_db_api.Workflows.Runtime_codec.value

  val getUsedPropertiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val nextTempId : unit -> int

  val pagePropertyValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool

  val updateBlocksWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.callback ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module SqliteBuildWorkflow : sig
  val buildBlocksTx :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val createBlocksInput :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.connection ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.transaction_report
    Js.Nullable.t

  val validateOptionsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    unit
end

module SqliteCliWorkflow : sig
  val newStorageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteCliWorkflow.adapter ->
    Melange_db_api.Workflows.SqliteCliWorkflow.sqlite ->
    Melange_db_api.Workflows.SqliteCliWorkflow.storage

  val openArgsWith :
    Melange_db_api.Workflows.SqliteCliWorkflow.adapter ->
    string ->
    string array

  val openStorageConnectionWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteCliWorkflow.adapter ->
    string Js.Nullable.t ->
    string ->
    Melange_db_api.Workflows.SqliteCliWorkflow.connection

  val openStorageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteCliWorkflow.adapter ->
    string Js.Nullable.t ->
    string ->
    Melange_db_api.Workflows.SqliteCliWorkflow.encoded_open
end

module SqliteCreateGraph : sig
  val buildInitialClassesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteCreateGraph.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildInitialData :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.SqliteCreateGraph.float_callback ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    string ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.SqliteCreateGraph.encoded_initial_options ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildInitialViewsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteCreateGraph.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildProperties :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.PropertyBuild.value_callback ->
    Melange_db_api.Workflows.SqliteCreateGraph.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val markBuiltInWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module SqliteDebugWorkflow : sig
  val findMissingNode :
    Melange_db_api.Workflows.SqliteGcWorkflow.database -> int array

  val findMissingWasm :
    Melange_db_api.Workflows.SqliteGcWorkflow.database -> int array

end

module SqliteExport : sig
  val importTransactionDataWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val sortPagesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module SqliteExportWorkflow : sig
  val buildExportWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.SqliteExportWorkflow.export_capabilities ->
    string ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildImport :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val createSeededConnectionWith :
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.schema ->
    Melange_db_api.Workflows.Datascript.transaction_data ->
    Melange_db_api.Workflows.Datascript.connection

  val diffExportsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteExportWorkflow.diff_capabilities ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val pruneUnreferencedUuidsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val validateImportTransactionsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.database ->
    string ->
    Melange_db_api.Workflows.SqliteExportWorkflow
    .encoded_import_validation_result

  val validateSeededExport :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.schema ->
    Melange_db_api.Workflows.Datascript.transaction_data ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.SqliteExportWorkflow
    .encoded_import_validation_result
end

module SqliteGcWorkflow : sig
  val collectNodeDefault :
    Melange_db_api.Workflows.SqliteGcWorkflow.database -> bool -> unit

  val collectWasmDefault :
    Melange_db_api.Workflows.SqliteGcWorkflow.database Js.Nullable.t ->
    bool ->
    unit

  val ensureNoGarbageDefault :
    Melange_db_api.Workflows.SqliteGcWorkflow.database -> bool

end

module SqliteLifecycle : sig
  val backupConnection :
    'a Melange_db_api.Workflows.SqliteLifecycle.Domain.backup ->
    Melange_db_api.Workflows.SqliteLifecycle.Domain.remove ->
    'a ->
    string ->
    unit Js.Promise.t

  val backupFile :
    'a Melange_db_api.Workflows.SqliteLifecycle.Domain.open_db ->
    'a Melange_db_api.Workflows.SqliteLifecycle.Domain.backup ->
    Melange_db_api.Workflows.SqliteLifecycle.Domain.remove ->
    'a Melange_db_api.Workflows.SqliteLifecycle.Domain.close ->
    string ->
    string ->
    unit Js.Promise.t

  val storageConnection :
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.storage ->
    Melange_db_api.Workflows.Datascript.schema ->
    Melange_db_api.Workflows.Datascript.connection
end

module SqlitePolicy : sig
  val dbBasedGraphNullable :
    string -> string Js.Nullable.t -> bool Js.Nullable.t

  val sanitizeDbName : string -> string -> string
end

module SqliteUtil : sig
  val buildClassWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteUtil.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildPageWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteUtil.float_callback ->
    string ->
    Melange_db_api.Workflows.Runtime_codec.value

  val buildProperty :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteUtil.value_callback ->
    Melange_db_api.Workflows.SqliteUtil.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val importTxWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.SqliteUtil.float_callback ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value

  val kvWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module TransactionExecution : sig
  val batchWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.TransactionExecution.execution_adapter ->
    Melange_db_api.Workflows.Datascript.connection ->
    Melange_db_api.Workflows.Datascript.transaction_metadata ->
    ((Melange_db_api.Workflows.Datascript.connection -> unit)[@u]) ->
    ((Melange_db_api.Workflows.Datascript.transaction_report -> unit)
    [@u])
    Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.listener_key ->
    Melange_db_api.Workflows.Datascript.transaction_report

  val batchWithTemp :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.TransactionExecution.execution_adapter ->
    Melange_db_api.Workflows.Datascript.connection ->
    Melange_db_api.Workflows.Datascript.transaction_metadata ->
    ((Melange_db_api.Workflows.Datascript.connection ->
     Melange_db_api.Workflows.TransactionExecution.collector ->
     unit)
    [@u]) ->
    ((Melange_db_api.Workflows.Datascript.transaction_report -> unit)
    [@u])
    Js.Nullable.t ->
    ((unit -> unit)[@u]) Js.Nullable.t ->
    ((Melange_db_api.Workflows.Datascript.connection ->
     Melange_db_api.Workflows.Datascript.transaction_data ->
     Melange_db_api.Workflows.Datascript.transaction_metadata ->
     Melange_db_api.Workflows.Runtime_codec.value)
    [@u]) ->
    Melange_db_api.Workflows.Datascript.listener_key ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t

  val transactOwnedWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.TransactionExecution.execution_adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t
end

module TransactionPolicy : sig
  val favorite :
    string ->
    Melange_db_api.Workflows.TransactionPolicy.encoded_favorite
end

module TransactionRuntime : sig
  val invalidCallback :
    unit ->
    Melange_db_api.Workflows.TransactionRuntime.invalid_callback
    Js.Nullable.t

  val pipelineCallback :
    unit ->
    Melange_db_api.Workflows.TransactionRuntime.pipeline_callback
    Js.Nullable.t

  val registerInvalidCallback :
    Melange_db_api.Workflows.TransactionRuntime.invalid_callback
    Js.Nullable.t ->
    unit

  val registerPipeline :
    Melange_db_api.Workflows.TransactionRuntime.pipeline_callback
    Js.Nullable.t ->
    unit

  val registerTransact :
    Melange_db_api.Workflows.TransactionRuntime.transact_callback
    Js.Nullable.t ->
    unit

  val transactCallback :
    unit ->
    Melange_db_api.Workflows.TransactionRuntime.transact_callback
    Js.Nullable.t
end

module TransactionWorkflow : sig
  val replaceEntities :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module TreeWorkflow : sig
  val blockAndChildrenWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    bool ->
    Melange_db_api.Workflows.Datascript.entity array Js.Nullable.t

  val childrenByReferenceWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Datascript.entity array Js.Nullable.t

  val firstChildOfWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val firstChildWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    string ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val siblingWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity ->
    string ->
    Melange_db_api.Workflows.Datascript.entity Js.Nullable.t

  val sortWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.entity array ->
    Melange_db_api.Workflows.Datascript.entity array
end

module ValidationDatabase : sig
  val graphCountsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity array ->
    Melange_db_api.Workflows.ValidationDatabase.encoded_counts
end

module ValidationDatom : sig
  val entitiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.datom array ->
    Melange_db_api.Workflows.Runtime_codec.callback Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val entityMapsWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.datom array ->
    Melange_db_api.Workflows.Runtime_codec.callback Js.Nullable.t ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module ValidationEntity : sig
  val dispatchWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity ->
    string Js.Nullable.t
end

module ValidationIdentity : sig
  val isClassIdent : string Js.Nullable.t -> bool -> bool
  val isInternalIdent : string Js.Nullable.t -> string -> bool
  val isUserPropertyIdent : string Js.Nullable.t -> bool -> bool
end

module ValidationProperty : sig
  val errorMessage : string -> string

  val prepareEntitiesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value array ->
    Melange_db_api.Workflows.Runtime_codec.value array

  val requiredProperties : string array

  val validatePropertyValueWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.entity ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.ValidationProperty
    .encoded_validation_options ->
    Melange_db_api.Workflows.Runtime_codec.callback ->
    Melange_db_api.Workflows.Runtime_codec.callback ->
    bool

  val valueValidWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.ValidationProperty
    .encoded_validation_options ->
    bool
end

module ValidationSchema : sig
  val validateDatabaseWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.ValidationSchema.encoded_workflow_options ->
    Melange_db_api.Workflows.ValidationSchema.encoded_database_result

  val validateEntityWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.ValidationSchema.encoded_workflow_options ->
    Melange_db_api.Workflows.ValidationSchema.encoded_workflow_result

  val validateLocalDatabaseAndLogWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.ValidationSchema.encoded_workflow_options ->
    bool ->
    string Js.Nullable.t ->
    Melange_db_api.Workflows.ValidationSchema
    .print_local_counts_callback ->
    Melange_db_api.Workflows.ValidationSchema
    .encoded_local_database_result

  val validateTransactionWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.transaction_report ->
    Melange_db_api.Workflows.ValidationSchema.encoded_workflow_options ->
    Melange_db_api.Workflows.ValidationSchema
    .encoded_transaction_result
end

module ViewDataWorkflow : sig
  val getPropertyValuesWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value Js.Nullable.t ->
    Melange_db_api.Workflows.Datascript.value array ->
    Melange_db_api.Workflows.ViewPropertyValues.encoded_entry array

  val getWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Datascript.value ->
    Melange_db_api.Workflows.ViewDataWorkflow.encoded_options ->
    Melange_db_api.Workflows.ViewDataWorkflow.encoded_result
end

module ViewPropertyValues : sig
  val contentWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Datascript.database ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end

module ViewWorkflow : sig
  val propertyValueForSearchWith :
    Melange_db_api.Workflows.Runtime_codec.adapter ->
    Melange_db_api.Workflows.Datascript.adapter ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value ->
    Melange_db_api.Workflows.Runtime_codec.value
end
