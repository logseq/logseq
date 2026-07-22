module Domain = Melange_db.View_property_values

type encoded_entry = {
  label : Support.Runtime_codec.cljs_value;
  value : Support.Runtime_codec.cljs_value;
}

let ident_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else Support.Runtime_codec.value_to_string runtime value

let capabilities runtime datascript database :
    Support.Runtime_codec.cljs_value Domain.capabilities =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let field = Entity_read.field runtime datascript in
  {
    field;
    resolve_entity =
      (fun lookup ->
        Support.Datascript.entity datascript database lookup
        |> Js.Nullable.toOption);
    resolve_uuid =
      (fun uuid ->
        Support.Runtime_codec.array_to_vector runtime
          [| keyword "block/uuid"; uuid |]
        |> Support.Datascript.entity datascript database
        |> Js.Nullable.toOption);
    recycled = Entity_read.recycledWith runtime datascript;
    nil_value = Support.Runtime_codec.nil_value runtime;
    is_nil = Support.Runtime_codec.value_is_nil runtime;
    is_entity = Support.Datascript.entity_is datascript;
    is_set = Support.Runtime_codec.value_is_set runtime;
    is_string = Support.Runtime_codec.value_is_string runtime;
    is_keyword = Support.Runtime_codec.value_is_keyword runtime;
    is_uuid = Support.Runtime_codec.value_is_uuid runtime;
    value_truthy = Support.Runtime_codec.value_truthy runtime;
    collection_to_array = Support.Runtime_codec.collection_to_array runtime;
    string_to_value = Support.Runtime_codec.string_to_value runtime;
    value_to_string = Support.Runtime_codec.value_to_string runtime;
    equal = Support.Runtime_codec.value_equals runtime;
    project_entity =
      (fun entity ->
        Support.Runtime_codec.entries_to_map runtime
          [|
            [| keyword "db/id"; field entity "db/id" |];
            [| keyword "block/uuid"; field entity "block/uuid" |];
          |]);
  }

let encode_entries entries =
  entries
  |> Rrbvec.map (fun (entry : Support.Runtime_codec.cljs_value Domain.entry) ->
      ({ label = entry.label; value = entry.value } : encoded_entry))
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
    if Support.Runtime_codec.value_is_nil runtime default_value then None
    else Some default_value
  in
  Domain.from_datoms
    (capabilities runtime datascript database)
    ~ref_type ~default_value (Rrbvec.of_array values)
  |> encode_entries
