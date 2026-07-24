module Domain = Melange_db.View_query_workflow

let ident_text runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value then
    Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
  else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value
  then Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
  else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value

let map_keys runtime value =
  Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime value
  |> Array.map (fun entry ->
      if Array.length entry = 0 then
        invalid_arg "DB view query entity entry is empty"
      else entry.(0))

let capabilities runtime datascript database :
    Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.capabilities =
  let keyword =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  in
  {
    field = Entity_read.field runtime datascript;
    map_keys = map_keys runtime;
    resolve_ident =
      (fun ident ->
        Melange_datascript_spec.Api.entity datascript database ident
        |> Js.Nullable.toOption);
    resolve_uuid =
      (fun uuid ->
        Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
          [| keyword "block/uuid"; uuid |]
        |> Melange_datascript_spec.Api.entity datascript database
        |> Js.Nullable.toOption);
    nil_value = Melange_cljs_runtime_spec.Value_codec.nil_value runtime;
    is_nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
    is_entity = Melange_datascript_spec.Api.entity_is datascript;
    is_collection =
      (fun value ->
        Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value
        || Melange_cljs_runtime_spec.Value_codec.value_is_sequential runtime
             value);
    is_string = Melange_cljs_runtime_spec.Value_codec.value_is_string runtime;
    is_bool = Melange_cljs_runtime_spec.Value_codec.value_is_bool runtime;
    is_number = Melange_cljs_runtime_spec.Value_codec.value_is_number runtime;
    is_keyword = Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime;
    is_uuid = Melange_cljs_runtime_spec.Value_codec.value_is_uuid runtime;
    is_instant = Melange_cljs_runtime_spec.Value_codec.value_is_instant runtime;
    value_truthy = Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
    bool_from_value =
      Melange_cljs_runtime_spec.Value_codec.bool_from_value runtime;
    float_from_value =
      Melange_cljs_runtime_spec.Value_codec.float_from_value runtime;
    string_from_value =
      Melange_cljs_runtime_spec.Value_codec.string_from_value runtime;
    string_to_value =
      Melange_cljs_runtime_spec.Value_codec.string_to_value runtime;
    lowercase = Melange_cljs_runtime_spec.Value_codec.string_lowercase runtime;
    ident_text = ident_text runtime;
    collection_to_array =
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime;
    value_to_string =
      Melange_cljs_runtime_spec.Value_codec.value_to_string runtime;
    equal = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
    instant_to_ms = Melange_cljs_runtime_spec.Value_codec.instant_to_ms runtime;
    now_ms = Melange_common.Date_time.now_ms;
    relative_timestamp_ms = Melange_common.Date_time.relative_timestamp_ms;
  }

let filterEntitiesWith runtime datascript database filters input entities =
  let input =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime input then ""
    else Melange_cljs_runtime_spec.Value_codec.string_from_value runtime input
  in
  Domain.filter_entities_with
    (capabilities runtime datascript database)
    ~filters ~input (Rrbvec.of_array entities)
  |> Rrbvec.to_array

let queryPropertiesWith runtime query entities =
  Domain.query_properties ~map_keys:(map_keys runtime)
    ~collection_to_array:
      (Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime)
    ~ident_text:(ident_text runtime)
    ~equal:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    ~query ~entities:(Rrbvec.of_array entities)
  |> Rrbvec.to_array
