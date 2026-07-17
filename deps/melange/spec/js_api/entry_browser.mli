module Bridge : sig
  type value
  type runtime_adapter
  type callback = (value -> value[@u])

  val keywordToString : runtime_adapter -> value -> string
  val keywordFromString : runtime_adapter -> string -> value
  val symbolFromString : runtime_adapter -> string -> value
  val nilValue : runtime_adapter -> value
  val stringToValue : runtime_adapter -> string -> value
  val stringFromValue : runtime_adapter -> value -> string
  val stringLowercase : runtime_adapter -> string -> string
  val boolToValue : runtime_adapter -> bool -> value
  val boolFromValue : runtime_adapter -> value -> bool
  val intToValue : runtime_adapter -> int -> value
  val intFromValue : runtime_adapter -> value -> int
  val floatToValue : runtime_adapter -> float -> value
  val floatFromValue : runtime_adapter -> value -> float
  val valueEquals : runtime_adapter -> value -> value -> bool
  val valueTruthy : runtime_adapter -> value -> bool
  val valueToString : runtime_adapter -> value -> string
  val valueIsNil : runtime_adapter -> value -> bool
  val valueIsString : runtime_adapter -> value -> bool
  val valueIsBool : runtime_adapter -> value -> bool
  val valueIsNumber : runtime_adapter -> value -> bool
  val valueIsInteger : runtime_adapter -> value -> bool
  val valueIsKeyword : runtime_adapter -> value -> bool
  val valueIsUuid : runtime_adapter -> value -> bool
  val valueIsInstant : runtime_adapter -> value -> bool
  val instantToMs : runtime_adapter -> value -> float
  val valueIsVector : runtime_adapter -> value -> bool
  val valueIsSet : runtime_adapter -> value -> bool
  val valueIsMap : runtime_adapter -> value -> bool
  val valueIsSequential : runtime_adapter -> value -> bool
  val uuidToString : runtime_adapter -> value -> string
  val uuidFromString : runtime_adapter -> string -> value
  val collectionToArray : runtime_adapter -> value -> value array
  val arrayToList : runtime_adapter -> value array -> value
  val vectorToArray : runtime_adapter -> value -> value array
  val arrayToVector : runtime_adapter -> value array -> value
  val setToArray : runtime_adapter -> value -> value array
  val arrayToSet : runtime_adapter -> value array -> value
  val mapToEntries : runtime_adapter -> value -> value array array
  val entriesToMap : runtime_adapter -> value array array -> value
  val mapGet : runtime_adapter -> value -> value -> value
  val mapAssoc : runtime_adapter -> value -> value -> value -> value
  val mapDissoc : runtime_adapter -> value -> value -> value
  val mapContains : runtime_adapter -> value -> value -> bool
  val valueMeta : runtime_adapter -> value -> value
  val valueWithMeta : runtime_adapter -> value -> value -> value
  val orderedMapToEntries : runtime_adapter -> value -> value array array
  val entriesToOrderedMap : runtime_adapter -> value array array -> value
  val invokeCallback : runtime_adapter -> callback -> value -> value
  val logValues : runtime_adapter -> value array -> unit
  val rejectPromise : runtime_adapter -> string -> value Js.Promise.t

  type datascript_adapter
  type schema
  type connection_options
  type storage
  type connection
  type database
  type entity
  type datom
  type index
  type query_form
  type pull_pattern
  type transaction_data
  type transaction_metadata
  type transaction_report
  type listener_key
  type uuid
  type transaction_listener = (transaction_report -> unit[@u])

  val datascriptCreateConn :
    datascript_adapter ->
    schema ->
    connection_options Js.Nullable.t ->
    connection

  val datascriptCreateConnWithStorage :
    datascript_adapter -> schema -> storage -> connection

  val datascriptRestoreConn :
    datascript_adapter -> storage -> connection Js.Nullable.t

  val datascriptDatabase : datascript_adapter -> connection -> database
  val datascriptDatabaseSchema : datascript_adapter -> database -> schema

  val datascriptEntity :
    datascript_adapter -> database -> value -> entity Js.Nullable.t

  val datascriptEntityGet : datascript_adapter -> entity -> value -> value
  val datascriptEntityIs : datascript_adapter -> value -> bool

  val datascriptDatoms :
    datascript_adapter -> database -> index -> value array -> datom array

  val datascriptRseekDatoms :
    datascript_adapter -> database -> index -> value array -> datom array

  val datascriptQuery :
    datascript_adapter -> query_form -> database -> value array -> value

  val datascriptPull :
    datascript_adapter -> database -> pull_pattern -> value -> value

  val datascriptPullMany :
    datascript_adapter -> database -> pull_pattern -> value array -> value array

  val datascriptWith :
    datascript_adapter ->
    database ->
    transaction_data ->
    transaction_metadata Js.Nullable.t ->
    transaction_report

  val datascriptTransact :
    datascript_adapter ->
    connection ->
    transaction_data ->
    transaction_metadata Js.Nullable.t ->
    transaction_report

  val datascriptListen :
    datascript_adapter ->
    connection ->
    listener_key ->
    transaction_listener ->
    unit

  val datascriptUnlisten :
    datascript_adapter -> connection -> listener_key -> unit

  val datascriptReportDbBefore :
    datascript_adapter -> transaction_report -> database

  val datascriptReportDbAfter :
    datascript_adapter -> transaction_report -> database

  val datascriptReportDatoms :
    datascript_adapter -> transaction_report -> datom array

  val datascriptReportTxMetadata :
    datascript_adapter -> transaction_report -> value

  val datascriptDatomEntity : datascript_adapter -> datom -> value
  val datascriptDatomAttribute : datascript_adapter -> datom -> value
  val datascriptDatomValue : datascript_adapter -> datom -> value
  val datascriptDatomEquals : datascript_adapter -> datom -> datom -> bool

  val datascriptStorageFor :
    datascript_adapter -> database -> storage Js.Nullable.t

  val datascriptStore : datascript_adapter -> database -> unit

  val datascriptStoreAfterTransact :
    datascript_adapter -> connection -> transaction_report -> unit

  val datascriptRunCallbacks :
    datascript_adapter -> connection -> transaction_report -> unit

  val datascriptSquuid : datascript_adapter -> uuid
end

module Platform : sig
  type browser_platform

  val browser_platform : unit -> browser_platform
  val browser : browser_platform
end
