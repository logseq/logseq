module Domain = Melange_db.View_workflow

type encoded_sorting = {
  id : Melange_cljs_runtime_spec.Value_codec.cljs_value;
  asc : bool;
}

let ident_text runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value then
    Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
  else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value
  then Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
  else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value

let capabilities_with runtime datascript ~resolve_entity ~datom_entity_ids :
    Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.capabilities =
  {
    field = Entity_read.field runtime datascript;
    resolve_entity;
    is_nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
    value_truthy = Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
    is_bool = Melange_cljs_runtime_spec.Value_codec.value_is_bool runtime;
    bool_from_value =
      Melange_cljs_runtime_spec.Value_codec.bool_from_value runtime;
    is_number = Melange_cljs_runtime_spec.Value_codec.value_is_number runtime;
    float_from_value =
      Melange_cljs_runtime_spec.Value_codec.float_from_value runtime;
    is_string = Melange_cljs_runtime_spec.Value_codec.value_is_string runtime;
    string_from_value =
      Melange_cljs_runtime_spec.Value_codec.string_from_value runtime;
    ident_text = ident_text runtime;
    ident_from_string =
      Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime;
    collection_to_array =
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime;
    string_to_value =
      Melange_cljs_runtime_spec.Value_codec.string_to_value runtime;
    float_to_value =
      Melange_cljs_runtime_spec.Value_codec.float_to_value runtime;
    value_to_string =
      Melange_cljs_runtime_spec.Value_codec.value_to_string runtime;
    equal = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
    datom_entity_ids;
  }

let propertyValueForSearchWith runtime datascript entity property =
  Domain.property_value_for_search
    (capabilities_with runtime datascript
       ~resolve_entity:(fun _ -> None)
       ~datom_entity_ids:(fun _ -> [||]))
    ~entity ~property

let sortEntitiesWith runtime datascript database sorting entities =
  let sorting =
    sorting
    |> Array.map (fun (sorting : encoded_sorting) ->
        ({ id = sorting.id; ascending = sorting.asc }
          : Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.sorting))
    |> Rrbvec.of_array
  in
  let capabilities =
    capabilities_with runtime datascript
      ~resolve_entity:(fun lookup ->
        Melange_datascript_spec.Api.entity datascript database lookup
        |> Js.Nullable.toOption)
      ~datom_entity_ids:(fun ident ->
        Melange_datascript_spec.Api.datoms datascript database
          (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
             "avet")
          [|
            Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
              ident;
          |]
        |> Array.map (Melange_datascript_spec.Api.datom_entity datascript))
  in
  Domain.sort_entities_with capabilities sorting (Rrbvec.of_array entities)
  |> Rrbvec.to_array
