module Domain = Melange_db.View_grouping

type encoded_group = {
  key : Support.Runtime_codec.value;
  rows : Support.Runtime_codec.value array;
}

let ident_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else Support.Runtime_codec.value_to_string runtime value

let capabilities runtime datascript :
    Support.Runtime_codec.value Domain.capabilities =
  {
    field = Entity_read.field runtime datascript;
    is_nil = Support.Runtime_codec.value_is_nil runtime;
    is_entity = Support.Datascript.entity_is datascript;
    is_collection =
      (fun value ->
        Support.Runtime_codec.value_is_set runtime value
        || Support.Runtime_codec.value_is_sequential runtime value);
    is_map = Support.Runtime_codec.value_is_map runtime;
    is_bool = Support.Runtime_codec.value_is_bool runtime;
    is_number = Support.Runtime_codec.value_is_number runtime;
    is_string = Support.Runtime_codec.value_is_string runtime;
    value_truthy = Support.Runtime_codec.value_truthy runtime;
    bool_from_value = Support.Runtime_codec.bool_from_value runtime;
    float_from_value = Support.Runtime_codec.float_from_value runtime;
    string_from_value = Support.Runtime_codec.string_from_value runtime;
    ident_text = ident_text runtime;
    collection_to_array = Support.Runtime_codec.collection_to_array runtime;
    equal = Support.Runtime_codec.value_equals runtime;
  }

let groupEntitiesWith runtime datascript property group_ident sort_ident
    descending entities =
  Domain.group_entities_with
    (capabilities runtime datascript)
    ~property
    ~group_ident:(ident_text runtime group_ident)
    ~sort_ident:(ident_text runtime sort_ident)
    ~descending (Rrbvec.of_array entities)
  |> Rrbvec.map (fun (group : Support.Runtime_codec.value Domain.group) ->
      ({ key = group.key; rows = Rrbvec.to_array group.entities }
        : encoded_group))
  |> Rrbvec.to_array
