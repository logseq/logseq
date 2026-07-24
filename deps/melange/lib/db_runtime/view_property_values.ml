module Domain = Melange_db.View_property_values

type encoded_entry = {
  label : Melange_cljs_runtime_spec.Value_codec.cljs_value;
  value : Melange_cljs_runtime_spec.Value_codec.cljs_value;
}

let ident_text runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value then
    Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
  else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value
  then Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
  else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value

let capabilities runtime datascript database :
    Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.capabilities =
  let keyword =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  in
  let field = Entity_read.field runtime datascript in
  {
    field;
    resolve_entity =
      (fun lookup ->
        Melange_datascript_spec.Api.entity datascript database lookup
        |> Js.Nullable.toOption);
    resolve_uuid =
      (fun uuid ->
        Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
          [| keyword "block/uuid"; uuid |]
        |> Melange_datascript_spec.Api.entity datascript database
        |> Js.Nullable.toOption);
    recycled = Entity_read.recycledWith runtime datascript;
    nil_value = Melange_cljs_runtime_spec.Value_codec.nil_value runtime;
    is_nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
    is_entity = Melange_datascript_spec.Api.entity_is datascript;
    is_set = Melange_cljs_runtime_spec.Value_codec.value_is_set runtime;
    is_string = Melange_cljs_runtime_spec.Value_codec.value_is_string runtime;
    is_keyword = Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime;
    is_uuid = Melange_cljs_runtime_spec.Value_codec.value_is_uuid runtime;
    value_truthy = Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
    collection_to_array =
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime;
    string_to_value =
      Melange_cljs_runtime_spec.Value_codec.string_to_value runtime;
    value_to_string =
      Melange_cljs_runtime_spec.Value_codec.value_to_string runtime;
    equal = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
    project_entity =
      (fun entity ->
        Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
          [|
            [| keyword "db/id"; field entity "db/id" |];
            [| keyword "block/uuid"; field entity "block/uuid" |];
          |]);
  }

let encode_entries entries =
  entries
  |> Rrbvec.map
       (fun
         (entry : Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.entry)
       -> ({ label = entry.label; value = entry.value } : encoded_entry))
  |> Rrbvec.to_array

let contentWith runtime datascript database value =
  Domain.content (capabilities runtime datascript database) value

let fromEntitiesWith runtime datascript database property_ident empty_id rows =
  Domain.from_entities
    (capabilities runtime datascript database)
    ~property_ident:(ident_text runtime property_ident)
    ~empty_id (Rrbvec.of_array rows)
  |> encode_entries

let fromDatomsWith runtime datascript database ref_type default_value values =
  let default_value =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime default_value
    then None
    else Some default_value
  in
  Domain.from_datoms
    (capabilities runtime datascript database)
    ~ref_type ~default_value (Rrbvec.of_array values)
  |> encode_entries
