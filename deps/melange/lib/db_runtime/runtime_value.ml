module Runtime_codec = Melange_cljs_runtime_spec.Value_codec

let is_collection runtime value =
  Runtime_codec.value_is_vector runtime value
  || Runtime_codec.value_is_set runtime value
  || Runtime_codec.value_is_sequential runtime value
