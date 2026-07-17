type value
type adapter
type callback = (value -> value[@u])
type value_thunk = (unit -> value[@u])

external keyword_to_string_fn : adapter -> (value -> string[@u])
  = "keywordToString"
[@@mel.get]

external keyword_from_string_fn : adapter -> (string -> value[@u])
  = "keywordFromString"
[@@mel.get]

external symbol_from_string_fn : adapter -> (string -> value[@u])
  = "symbolFromString"
[@@mel.get]

external nil_value_fn : adapter -> (unit -> value[@u]) = "nilValue" [@@mel.get]

external string_to_value_fn : adapter -> (string -> value[@u]) = "stringToValue"
[@@mel.get]

external string_from_value_fn : adapter -> (value -> string[@u])
  = "stringFromValue"
[@@mel.get]

external string_lowercase_fn : adapter -> (string -> string[@u])
  = "stringLowercase"
[@@mel.get]

external string_is_url_fn : adapter -> (string -> bool[@u]) = "stringIsUrl"
[@@mel.get]

external bool_to_value_fn : adapter -> (bool -> value[@u]) = "boolToValue"
[@@mel.get]

external bool_from_value_fn : adapter -> (value -> bool[@u]) = "boolFromValue"
[@@mel.get]

external int_to_value_fn : adapter -> (int -> value[@u]) = "intToValue"
[@@mel.get]

external int_from_value_fn : adapter -> (value -> int[@u]) = "intFromValue"
[@@mel.get]

external float_to_value_fn : adapter -> (float -> value[@u]) = "floatToValue"
[@@mel.get]

external float_from_value_fn : adapter -> (value -> float[@u])
  = "floatFromValue"
[@@mel.get]

external value_equals_fn : adapter -> (value -> value -> bool[@u])
  = "valueEquals"
[@@mel.get]

external value_truthy_fn : adapter -> (value -> bool[@u]) = "valueTruthy"
[@@mel.get]

external value_to_string_fn : adapter -> (value -> string[@u]) = "valueToString"
[@@mel.get]

external value_is_nil_fn : adapter -> (value -> bool[@u]) = "valueIsNil"
[@@mel.get]

external value_is_string_fn : adapter -> (value -> bool[@u]) = "valueIsString"
[@@mel.get]

external value_is_bool_fn : adapter -> (value -> bool[@u]) = "valueIsBool"
[@@mel.get]

external value_is_number_fn : adapter -> (value -> bool[@u]) = "valueIsNumber"
[@@mel.get]

external value_is_integer_fn : adapter -> (value -> bool[@u]) = "valueIsInteger"
[@@mel.get]

external value_is_keyword_fn : adapter -> (value -> bool[@u]) = "valueIsKeyword"
[@@mel.get]

external value_is_uuid_fn : adapter -> (value -> bool[@u]) = "valueIsUuid"
[@@mel.get]

external value_is_instant_fn : adapter -> (value -> bool[@u]) = "valueIsInstant"
[@@mel.get]

external instant_to_ms_fn : adapter -> (value -> float[@u]) = "instantToMs"
[@@mel.get]

external value_is_vector_fn : adapter -> (value -> bool[@u]) = "valueIsVector"
[@@mel.get]

external value_is_set_fn : adapter -> (value -> bool[@u]) = "valueIsSet"
[@@mel.get]

external value_is_map_fn : adapter -> (value -> bool[@u]) = "valueIsMap"
[@@mel.get]

external value_is_sequential_fn : adapter -> (value -> bool[@u])
  = "valueIsSequential"
[@@mel.get]

external uuid_to_string_fn : adapter -> (value -> string[@u]) = "uuidToString"
[@@mel.get]

external uuid_from_string_fn : adapter -> (string -> value[@u])
  = "uuidFromString"
[@@mel.get]

external collection_to_array_fn : adapter -> (value -> value array[@u])
  = "collectionToArray"
[@@mel.get]

external array_to_list_fn : adapter -> (value array -> value[@u])
  = "arrayToList"
[@@mel.get]

external vector_to_array_fn : adapter -> (value -> value array[@u])
  = "vectorToArray"
[@@mel.get]

external array_to_vector_fn : adapter -> (value array -> value[@u])
  = "arrayToVector"
[@@mel.get]

external set_to_array_fn : adapter -> (value -> value array[@u]) = "setToArray"
[@@mel.get]

external array_to_set_fn : adapter -> (value array -> value[@u]) = "arrayToSet"
[@@mel.get]

external map_to_entries_fn : adapter -> (value -> value array array[@u])
  = "mapToEntries"
[@@mel.get]

external entries_to_map_fn : adapter -> (value array array -> value[@u])
  = "entriesToMap"
[@@mel.get]

external map_get_fn : adapter -> (value -> value -> value[@u]) = "mapGet"
[@@mel.get]

external map_assoc_fn : adapter -> (value -> value -> value -> value[@u])
  = "mapAssoc"
[@@mel.get]

external map_dissoc_fn : adapter -> (value -> value -> value[@u]) = "mapDissoc"
[@@mel.get]

external map_contains_fn : adapter -> (value -> value -> bool[@u])
  = "mapContains"
[@@mel.get]

external value_meta_fn : adapter -> (value -> value[@u]) = "valueMeta"
[@@mel.get]

external value_with_meta_fn : adapter -> (value -> value -> value[@u])
  = "valueWithMeta"
[@@mel.get]

external ordered_map_to_entries_fn : adapter -> (value -> value array array[@u])
  = "orderedMapToEntries"
[@@mel.get]

external entries_to_ordered_map_fn : adapter -> (value array array -> value[@u])
  = "entriesToOrderedMap"
[@@mel.get]

external invoke_callback_fn : adapter -> (callback -> value -> value[@u])
  = "invokeCallback"
[@@mel.get]

external sequence_fn : adapter -> (value -> value[@u]) = "sequence" [@@mel.get]

external sequence_first_fn : adapter -> (value -> value[@u]) = "sequenceFirst"
[@@mel.get]

external sequence_rest_fn : adapter -> (value -> value[@u]) = "sequenceRest"
[@@mel.get]

external sequence_cons_fn : adapter -> (value -> value -> value[@u])
  = "sequenceCons"
[@@mel.get]

external lazy_sequence_fn : adapter -> (value_thunk -> value[@u])
  = "lazySequence"
[@@mel.get]

external mutable_cell_value_fn : adapter -> (value -> value[@u])
  = "mutableCellValue"
[@@mel.get]

external mutable_cell_reset_fn : adapter -> (value -> value -> unit[@u])
  = "mutableCellReset"
[@@mel.get]

external log_error_fn : adapter -> (string -> unit[@u]) = "logError" [@@mel.get]

external log_values_fn : adapter -> (value array -> unit[@u]) = "logValues"
[@@mel.get]

external reject_promise_fn : adapter -> (string -> value Js.Promise.t[@u])
  = "rejectPromise"
[@@mel.get]

let keyword_to_string adapter value =
  let callback = keyword_to_string_fn adapter in
  (callback value [@u])

let keyword_from_string adapter value =
  let callback = keyword_from_string_fn adapter in
  (callback value [@u])

let symbol_from_string adapter value =
  let callback = symbol_from_string_fn adapter in
  (callback value [@u])

let nil_value adapter =
  let callback = nil_value_fn adapter in
  (callback () [@u])

let string_to_value adapter value =
  let callback = string_to_value_fn adapter in
  (callback value [@u])

let string_from_value adapter value =
  let callback = string_from_value_fn adapter in
  (callback value [@u])

let string_lowercase adapter value =
  let callback = string_lowercase_fn adapter in
  (callback value [@u])

let string_is_url adapter value =
  let callback = string_is_url_fn adapter in
  (callback value [@u])

let bool_to_value adapter value =
  let callback = bool_to_value_fn adapter in
  (callback value [@u])

let bool_from_value adapter value =
  let callback = bool_from_value_fn adapter in
  (callback value [@u])

let int_to_value adapter value =
  let callback = int_to_value_fn adapter in
  (callback value [@u])

let int_from_value adapter value =
  let callback = int_from_value_fn adapter in
  (callback value [@u])

let float_to_value adapter value =
  let callback = float_to_value_fn adapter in
  (callback value [@u])

let float_from_value adapter value =
  let callback = float_from_value_fn adapter in
  (callback value [@u])

let value_equals adapter left right =
  let callback = value_equals_fn adapter in
  (callback left right [@u])

let value_truthy adapter value =
  let callback = value_truthy_fn adapter in
  (callback value [@u])

let value_to_string adapter value =
  let callback = value_to_string_fn adapter in
  (callback value [@u])

let value_is_nil adapter value =
  let callback = value_is_nil_fn adapter in
  (callback value [@u])

let value_is_string adapter value =
  let callback = value_is_string_fn adapter in
  (callback value [@u])

let value_is_bool adapter value =
  let callback = value_is_bool_fn adapter in
  (callback value [@u])

let value_is_number adapter value =
  let callback = value_is_number_fn adapter in
  (callback value [@u])

let value_is_integer adapter value =
  let callback = value_is_integer_fn adapter in
  (callback value [@u])

let value_is_keyword adapter value =
  let callback = value_is_keyword_fn adapter in
  (callback value [@u])

let value_is_uuid adapter value =
  let callback = value_is_uuid_fn adapter in
  (callback value [@u])

let value_is_instant adapter value =
  let callback = value_is_instant_fn adapter in
  (callback value [@u])

let instant_to_ms adapter value =
  let callback = instant_to_ms_fn adapter in
  (callback value [@u])

let value_is_vector adapter value =
  let callback = value_is_vector_fn adapter in
  (callback value [@u])

let value_is_set adapter value =
  let callback = value_is_set_fn adapter in
  (callback value [@u])

let value_is_map adapter value =
  let callback = value_is_map_fn adapter in
  (callback value [@u])

let value_is_sequential adapter value =
  let callback = value_is_sequential_fn adapter in
  (callback value [@u])

let uuid_to_string adapter value =
  let callback = uuid_to_string_fn adapter in
  (callback value [@u])

let uuid_from_string adapter value =
  let callback = uuid_from_string_fn adapter in
  (callback value [@u])

let collection_to_array adapter value =
  let callback = collection_to_array_fn adapter in
  (callback value [@u])

let array_to_list adapter value =
  let callback = array_to_list_fn adapter in
  (callback value [@u])

let vector_to_array adapter value =
  let callback = vector_to_array_fn adapter in
  (callback value [@u])

let array_to_vector adapter value =
  let callback = array_to_vector_fn adapter in
  (callback value [@u])

let set_to_array adapter value =
  let callback = set_to_array_fn adapter in
  (callback value [@u])

let array_to_set adapter value =
  let callback = array_to_set_fn adapter in
  (callback value [@u])

let map_to_entries adapter value =
  let callback = map_to_entries_fn adapter in
  (callback value [@u])

let entries_to_map adapter value =
  let callback = entries_to_map_fn adapter in
  (callback value [@u])

let map_get adapter map key =
  let callback = map_get_fn adapter in
  (callback map key [@u])

let map_assoc adapter map key value =
  let callback = map_assoc_fn adapter in
  (callback map key value [@u])

let map_dissoc adapter map key =
  let callback = map_dissoc_fn adapter in
  (callback map key [@u])

let map_contains adapter map key =
  let callback = map_contains_fn adapter in
  (callback map key [@u])

let value_meta adapter value =
  let callback = value_meta_fn adapter in
  (callback value [@u])

let value_with_meta adapter value metadata =
  let callback = value_with_meta_fn adapter in
  (callback value metadata [@u])

let ordered_map_to_entries adapter value =
  let callback = ordered_map_to_entries_fn adapter in
  (callback value [@u])

let entries_to_ordered_map adapter value =
  let callback = entries_to_ordered_map_fn adapter in
  (callback value [@u])

let invoke_callback adapter callback value =
  let invoke = invoke_callback_fn adapter in
  (invoke callback value [@u])

let sequence adapter value =
  let callback = sequence_fn adapter in
  (callback value [@u])

let sequence_first adapter value =
  let callback = sequence_first_fn adapter in
  (callback value [@u])

let sequence_rest adapter value =
  let callback = sequence_rest_fn adapter in
  (callback value [@u])

let sequence_cons adapter value values =
  let callback = sequence_cons_fn adapter in
  (callback value values [@u])

let lazy_sequence adapter thunk =
  let callback = lazy_sequence_fn adapter in
  (callback thunk [@u])

let mutable_cell_value adapter cell =
  let callback = mutable_cell_value_fn adapter in
  (callback cell [@u])

let mutable_cell_reset adapter cell value =
  let callback = mutable_cell_reset_fn adapter in
  (callback cell value [@u])

let log_error adapter message =
  let callback = log_error_fn adapter in
  (callback message [@u])

let log_values adapter values =
  let callback = log_values_fn adapter in
  (callback values [@u])

let reject_promise adapter message =
  let reject = reject_promise_fn adapter in
  (reject message [@u])
