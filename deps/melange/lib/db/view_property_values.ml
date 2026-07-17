type 'value capabilities = {
  field : 'value -> string -> 'value;
  resolve_entity : 'value -> 'value option;
  resolve_uuid : 'value -> 'value option;
  recycled : 'value -> bool;
  nil_value : 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_set : 'value -> bool;
  is_string : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  value_truthy : 'value -> bool;
  collection_to_array : 'value -> 'value array;
  string_to_value : string -> 'value;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  project_entity : 'value -> 'value;
}

type 'value entry = { label : 'value; value : 'value }

let property_value_content capabilities entity =
  let title = capabilities.field entity "block/title" in
  if capabilities.value_truthy title then title
  else capabilities.field entity "logseq.property/value"

let content capabilities value =
  if capabilities.is_uuid value then
    value |> capabilities.resolve_uuid
    |> Option.fold ~none:capabilities.nil_value
         ~some:(property_value_content capabilities)
  else if capabilities.is_entity value then
    property_value_content capabilities value
  else if capabilities.is_keyword value then
    value |> capabilities.value_to_string |> capabilities.string_to_value
  else value

let add_unique capabilities entries entry =
  if
    Rrbvec.fold_left
      (fun found candidate ->
        found || capabilities.equal candidate.label entry.label)
      false entries
  then entries
  else Rrbvec.push_back entries entry

let from_entities capabilities ~property_ident ~empty_id entities =
  entities
  |> Rrbvec.concat_map (fun entity ->
      let value = capabilities.field entity property_ident in
      if capabilities.is_set value then
        value |> capabilities.collection_to_array |> Rrbvec.of_array
      else Rrbvec.singleton value)
  |> Rrbvec.fold_left
       (fun entries value ->
         if capabilities.is_nil value then entries
         else if capabilities.is_entity value && capabilities.recycled value
         then entries
         else
           let label_value = content capabilities value in
           let empty_entity =
             capabilities.is_entity value
             && capabilities.equal (capabilities.field value "db/id") empty_id
           in
           if
             capabilities.is_nil label_value
             || empty_entity
             || String.trim (capabilities.value_to_string label_value) = ""
           then entries
           else
             let entry =
               {
                 label =
                   label_value |> capabilities.value_to_string
                   |> capabilities.string_to_value;
                 value =
                   (if capabilities.is_entity value then
                      capabilities.project_entity value
                    else value);
               }
             in
             add_unique capabilities entries entry)
       Rrbvec.empty

let ref_entry capabilities value =
  match capabilities.resolve_entity value with
  | None -> invalid_arg "DB view property value entity is missing"
  | Some entity ->
      if capabilities.recycled entity then None
      else
        Some
          {
            label = property_value_content capabilities entity;
            value = capabilities.project_entity entity;
          }

let raw_entry value = { label = value; value }

let from_datoms capabilities ~ref_type ~default_value raw_values =
  let values =
    Rrbvec.fold_left
      (fun values value ->
        if
          Rrbvec.fold_left
            (fun found item -> found || capabilities.equal item value)
            false values
        then values
        else Rrbvec.push_back values value)
      Rrbvec.empty raw_values
  in
  let entries =
    values
    |> Rrbvec.filter_map (fun value ->
        if ref_type then ref_entry capabilities value
        else Some (raw_entry value))
  in
  let entries =
    match default_value with
    | Some value when not (capabilities.recycled value) ->
        Rrbvec.append
          (Rrbvec.singleton
             {
               label = property_value_content capabilities value;
               value = capabilities.project_entity value;
             })
          entries
    | Some _ | None -> entries
  in
  Rrbvec.fold_left (add_unique capabilities) Rrbvec.empty entries
