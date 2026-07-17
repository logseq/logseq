module Domain = Melange_db.View_workflow

type encoded_sorting = { id : Support.Runtime_codec.value; asc : bool }

let ident_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else Support.Runtime_codec.value_to_string runtime value

let capabilities_with runtime datascript ~resolve_entity ~datom_entity_ids :
    Support.Runtime_codec.value Domain.capabilities =
  {
    field = Entity_read.field runtime datascript;
    resolve_entity;
    is_nil = Support.Runtime_codec.value_is_nil runtime;
    value_truthy = Support.Runtime_codec.value_truthy runtime;
    is_bool = Support.Runtime_codec.value_is_bool runtime;
    bool_from_value = Support.Runtime_codec.bool_from_value runtime;
    is_number = Support.Runtime_codec.value_is_number runtime;
    float_from_value = Support.Runtime_codec.float_from_value runtime;
    is_string = Support.Runtime_codec.value_is_string runtime;
    string_from_value = Support.Runtime_codec.string_from_value runtime;
    ident_text = ident_text runtime;
    ident_from_string = Support.Runtime_codec.keyword_from_string runtime;
    collection_to_array = Support.Runtime_codec.collection_to_array runtime;
    string_to_value = Support.Runtime_codec.string_to_value runtime;
    float_to_value = Support.Runtime_codec.float_to_value runtime;
    value_to_string = Support.Runtime_codec.value_to_string runtime;
    equal = Support.Runtime_codec.value_equals runtime;
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
          : Support.Runtime_codec.value Domain.sorting))
    |> Rrbvec.of_array
  in
  let capabilities =
    capabilities_with runtime datascript
      ~resolve_entity:(fun lookup ->
        Support.Datascript.entity datascript database lookup
        |> Js.Nullable.toOption)
      ~datom_entity_ids:(fun ident ->
        Support.Datascript.datoms datascript database
          (Support.Runtime_codec.keyword_from_string runtime "avet")
          [| Support.Runtime_codec.keyword_from_string runtime ident |]
        |> Array.map (Support.Datascript.datom_entity datascript))
  in
  Domain.sort_entities_with capabilities sorting (Rrbvec.of_array entities)
  |> Rrbvec.to_array
