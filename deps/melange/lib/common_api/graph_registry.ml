module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
(** Graph registry JavaScript-boundary conversions. *)

module Registry = Melange_common.Graph_registry

type encoded_value_result = {
  value : Runtime_codec.value;
  error : string Js.Nullable.t;
}

let field runtime value name =
  Runtime_codec.map_get runtime value
    (Runtime_codec.keyword_from_string runtime name)

let string_value runtime value =
  if Runtime_codec.value_is_string runtime value then
    Some (Runtime_codec.string_from_value runtime value)
  else None

let comparable_text runtime value =
  if Runtime_codec.value_is_nil runtime value then None
  else Some (Runtime_codec.value_to_string runtime value)

let value_entry runtime value =
  Registry.make_entry
    ?graph_id:(field runtime value "graph-id" |> string_value runtime)
    ?local_graph_id:
      (field runtime value "local-graph-id" |> string_value runtime)
    ?repo:(field runtime value "repo" |> string_value runtime)
    ?graph_id_text:(field runtime value "graph-id" |> comparable_text runtime)
    ?repo_text:(field runtime value "repo" |> comparable_text runtime)
    ?graph_name_text:
      (field runtime value "graph-name" |> comparable_text runtime)
    ()

let apply_normalization runtime value normalization =
  let value =
    Runtime_codec.map_assoc runtime value
      (Runtime_codec.keyword_from_string runtime "graph-id")
      (Registry.normalized_graph_id normalization
      |> Runtime_codec.string_to_value runtime)
  in
  if Registry.remove_rtc_graph_id normalization then
    Runtime_codec.map_dissoc runtime value
      (Runtime_codec.keyword_from_string runtime "rtc-graph-id")
  else value

let error_result runtime message =
  {
    value = Runtime_codec.nil_value runtime;
    error = Js.Nullable.return message;
  }

let value_result value = { value; error = Js.Nullable.undefined }

module GraphRegistry = struct
  type nonrec encoded_value_result = encoded_value_result

  let normalizeValueWith runtime value =
    let entry = value_entry runtime value in
    match Registry.normalization_error entry with
    | Some message -> error_result runtime message
    | None ->
        Registry.normalize_entry entry
        |> apply_normalization runtime value
        |> value_result

  let upsertValueWith runtime registry value =
    let entry = value_entry runtime value in
    match Registry.normalization_error entry with
    | Some message -> error_result runtime message
    | None ->
        let registry =
          if Runtime_codec.value_is_nil runtime registry then Rrbvec.empty
          else
            Runtime_codec.collection_to_array runtime registry
            |> Rrbvec.of_array
        in
        let snapshots = Rrbvec.map (value_entry runtime) registry in
        let result = Registry.upsert_entry snapshots entry in
        let value =
          Registry.upsert_normalization result
          |> apply_normalization runtime value
        in
        Registry.upsert_retained_indices result
        |> Rrbvec.fold_left
             (fun values index ->
               Rrbvec.push_back values (Rrbvec.nth registry index))
             (Rrbvec.singleton value)
        |> Rrbvec.to_array
        |> Runtime_codec.array_to_vector runtime
        |> value_result

  let resolveTargetValueWith runtime registry graph_id graph_identifier =
    let registry =
      if Runtime_codec.value_is_nil runtime registry then Rrbvec.empty
      else Runtime_codec.collection_to_array runtime registry |> Rrbvec.of_array
    in
    let snapshots = Rrbvec.map (value_entry runtime) registry in
    match
      Registry.resolve_target_index snapshots
        ~graph_id:(string_value runtime graph_id)
        ~graph_identifier:(string_value runtime graph_identifier)
    with
    | Some index -> Rrbvec.nth registry index
    | None -> Runtime_codec.nil_value runtime
end
