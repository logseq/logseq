type cljs_value
type adapter
type callback = (cljs_value -> cljs_value[@u])
type value_thunk = (unit -> cljs_value[@u])

val keyword_to_string : adapter -> cljs_value -> string
val keyword_from_string : adapter -> string -> cljs_value
val symbol_from_string : adapter -> string -> cljs_value
val nil_value : adapter -> cljs_value
val string_to_value : adapter -> string -> cljs_value
val string_from_value : adapter -> cljs_value -> string
val string_lowercase : adapter -> string -> string
val string_is_url : adapter -> string -> bool
val bool_to_value : adapter -> bool -> cljs_value
val bool_from_value : adapter -> cljs_value -> bool
val int_to_value : adapter -> int -> cljs_value
val int_from_value : adapter -> cljs_value -> int
val float_to_value : adapter -> float -> cljs_value
val float_from_value : adapter -> cljs_value -> float
val value_equals : adapter -> cljs_value -> cljs_value -> bool
val value_truthy : adapter -> cljs_value -> bool
val value_to_string : adapter -> cljs_value -> string
val value_is_nil : adapter -> cljs_value -> bool
val value_is_string : adapter -> cljs_value -> bool
val value_is_bool : adapter -> cljs_value -> bool
val value_is_number : adapter -> cljs_value -> bool
val value_is_integer : adapter -> cljs_value -> bool
val value_is_keyword : adapter -> cljs_value -> bool
val value_is_uuid : adapter -> cljs_value -> bool
val value_is_instant : adapter -> cljs_value -> bool
val instant_to_ms : adapter -> cljs_value -> float
val value_is_vector : adapter -> cljs_value -> bool
val value_is_set : adapter -> cljs_value -> bool
val value_is_map : adapter -> cljs_value -> bool
val value_is_sequential : adapter -> cljs_value -> bool
val uuid_to_string : adapter -> cljs_value -> string
val uuid_from_string : adapter -> string -> cljs_value
val collection_to_array : adapter -> cljs_value -> cljs_value array
val array_to_list : adapter -> cljs_value array -> cljs_value
val vector_to_array : adapter -> cljs_value -> cljs_value array
val array_to_vector : adapter -> cljs_value array -> cljs_value
val set_to_array : adapter -> cljs_value -> cljs_value array
val array_to_set : adapter -> cljs_value array -> cljs_value
val map_to_entries : adapter -> cljs_value -> cljs_value array array
val entries_to_map : adapter -> cljs_value array array -> cljs_value
val map_get : adapter -> cljs_value -> cljs_value -> cljs_value
val map_assoc : adapter -> cljs_value -> cljs_value -> cljs_value -> cljs_value
val map_dissoc : adapter -> cljs_value -> cljs_value -> cljs_value
val map_contains : adapter -> cljs_value -> cljs_value -> bool
val value_meta : adapter -> cljs_value -> cljs_value
val value_with_meta : adapter -> cljs_value -> cljs_value -> cljs_value
val ordered_map_to_entries : adapter -> cljs_value -> cljs_value array array
val entries_to_ordered_map : adapter -> cljs_value array array -> cljs_value
val invoke_callback : adapter -> callback -> cljs_value -> cljs_value
val sequence : adapter -> cljs_value -> cljs_value
val sequence_first : adapter -> cljs_value -> cljs_value
val sequence_rest : adapter -> cljs_value -> cljs_value
val sequence_cons : adapter -> cljs_value -> cljs_value -> cljs_value
val lazy_sequence : adapter -> value_thunk -> cljs_value
val mutable_cell_value : adapter -> cljs_value -> cljs_value
val mutable_cell_reset : adapter -> cljs_value -> cljs_value -> unit
val log_error : adapter -> string -> unit
val log_values : adapter -> cljs_value array -> unit
val reject_promise : adapter -> string -> cljs_value Js.Promise.t
