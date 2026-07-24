module Domain = Melange_db.View_grouping

type encoded_group = {
  key : Melange_cljs_runtime_spec.Value_codec.cljs_value;
  rows : Melange_cljs_runtime_spec.Value_codec.cljs_value array;
}

let ident_text runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value then
    Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
  else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value
  then Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
  else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value

let capabilities runtime datascript :
    Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.capabilities =
  {
    field = Entity_read.field runtime datascript;
    is_nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
    is_entity = Melange_datascript_spec.Api.entity_is datascript;
    is_collection =
      (fun value ->
        Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value
        || Melange_cljs_runtime_spec.Value_codec.value_is_sequential runtime
             value);
    is_map = Melange_cljs_runtime_spec.Value_codec.value_is_map runtime;
    is_bool = Melange_cljs_runtime_spec.Value_codec.value_is_bool runtime;
    is_number = Melange_cljs_runtime_spec.Value_codec.value_is_number runtime;
    is_string = Melange_cljs_runtime_spec.Value_codec.value_is_string runtime;
    value_truthy = Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
    bool_from_value =
      Melange_cljs_runtime_spec.Value_codec.bool_from_value runtime;
    float_from_value =
      Melange_cljs_runtime_spec.Value_codec.float_from_value runtime;
    string_from_value =
      Melange_cljs_runtime_spec.Value_codec.string_from_value runtime;
    ident_text = ident_text runtime;
    collection_to_array =
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime;
    equal = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
  }

let groupEntitiesWith runtime datascript property group_ident sort_ident
    descending entities =
  Domain.group_entities_with
    (capabilities runtime datascript)
    ~property
    ~group_ident:(ident_text runtime group_ident)
    ~sort_ident:(ident_text runtime sort_ident)
    ~descending (Rrbvec.of_array entities)
  |> Rrbvec.map
       (fun
         (group : Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.group)
       ->
         ({ key = group.key; rows = Rrbvec.to_array group.entities }
           : encoded_group))
  |> Rrbvec.to_array
