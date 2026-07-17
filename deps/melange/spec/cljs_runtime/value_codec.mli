type value
type adapter
type callback = (value -> value[@u])
type value_thunk = (unit -> value[@u])

val keyword_to_string : adapter -> value -> string
val keyword_from_string : adapter -> string -> value
val symbol_from_string : adapter -> string -> value
val nil_value : adapter -> value
val string_to_value : adapter -> string -> value
val string_from_value : adapter -> value -> string
val string_lowercase : adapter -> string -> string
val string_is_url : adapter -> string -> bool
val bool_to_value : adapter -> bool -> value
val bool_from_value : adapter -> value -> bool
val int_to_value : adapter -> int -> value
val int_from_value : adapter -> value -> int
val float_to_value : adapter -> float -> value
val float_from_value : adapter -> value -> float
val value_equals : adapter -> value -> value -> bool
val value_truthy : adapter -> value -> bool
val value_to_string : adapter -> value -> string
val value_is_nil : adapter -> value -> bool
val value_is_string : adapter -> value -> bool
val value_is_bool : adapter -> value -> bool
val value_is_number : adapter -> value -> bool
val value_is_integer : adapter -> value -> bool
val value_is_keyword : adapter -> value -> bool
val value_is_uuid : adapter -> value -> bool
val value_is_instant : adapter -> value -> bool
val instant_to_ms : adapter -> value -> float
val value_is_vector : adapter -> value -> bool
val value_is_set : adapter -> value -> bool
val value_is_map : adapter -> value -> bool
val value_is_sequential : adapter -> value -> bool
val uuid_to_string : adapter -> value -> string
val uuid_from_string : adapter -> string -> value
val collection_to_array : adapter -> value -> value array
val array_to_list : adapter -> value array -> value
val vector_to_array : adapter -> value -> value array
val array_to_vector : adapter -> value array -> value
val set_to_array : adapter -> value -> value array
val array_to_set : adapter -> value array -> value
val map_to_entries : adapter -> value -> value array array
val entries_to_map : adapter -> value array array -> value
val map_get : adapter -> value -> value -> value
val map_assoc : adapter -> value -> value -> value -> value
val map_dissoc : adapter -> value -> value -> value
val map_contains : adapter -> value -> value -> bool
val value_meta : adapter -> value -> value
val value_with_meta : adapter -> value -> value -> value
val ordered_map_to_entries : adapter -> value -> value array array
val entries_to_ordered_map : adapter -> value array array -> value
val invoke_callback : adapter -> callback -> value -> value
val sequence : adapter -> value -> value
val sequence_first : adapter -> value -> value
val sequence_rest : adapter -> value -> value
val sequence_cons : adapter -> value -> value -> value
val lazy_sequence : adapter -> value_thunk -> value
val mutable_cell_value : adapter -> value -> value
val mutable_cell_reset : adapter -> value -> value -> unit
val log_error : adapter -> string -> unit
val log_values : adapter -> value array -> unit
val reject_promise : adapter -> string -> value Js.Promise.t
