module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
module Runtime = Melange_common_runtime.Common_runtime.Graph_registry_runtime

type encoded_value_result = {
  value : Runtime_codec.cljs_value;
  error : string Js.Nullable.t;
}

let boundary_result result =
  {
    value = Runtime.result_value result;
    error = Runtime.result_error result |> Js.Nullable.fromOption;
  }

module GraphRegistry = struct
  type nonrec encoded_value_result = encoded_value_result

  let normalizeValueWith runtime value =
    Runtime.normalize_value runtime value |> boundary_result

  let upsertValueWith runtime registry value =
    Runtime.upsert_value runtime registry value |> boundary_result

  let resolveTargetValueWith = Runtime.resolve_target_value
end
