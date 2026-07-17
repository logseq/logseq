type 'value capabilities = {
  field : 'value -> string -> 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_collection : 'value -> bool;
  is_map : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_string : 'value -> bool;
  value_truthy : 'value -> bool;
  bool_from_value : 'value -> bool;
  float_from_value : 'value -> float;
  string_from_value : 'value -> string;
  ident_text : 'value -> string;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
}

type 'value group = { key : 'value; entities : 'value Rrbvec.t }

let optional_field capabilities entity name =
  let value = capabilities.field entity name in
  if capabilities.is_nil value then None else Some value

let property_type capabilities property =
  Option.bind (optional_field capabilities property "logseq.property/type")
    (fun value -> value |> capabilities.ident_text |> Property_type.of_string)

let property_value_content capabilities entity =
  let title = capabilities.field entity "block/title" in
  if capabilities.value_truthy title then title
  else capabilities.field entity "logseq.property/value"

let matches_as_entity capabilities value property =
  let has_ident =
    capabilities.field value "db/ident" |> capabilities.is_nil |> not
  in
  has_ident
  || Option.fold ~none:true
       ~some:(fun property_type ->
         not (Rrbvec.mem property_type Property_type.closed_value))
       (property_type capabilities property)

let group_values capabilities property group_ident entity =
  let value = capabilities.field entity group_ident in
  let values =
    if
      (not (capabilities.is_entity value))
      && capabilities.is_collection value
      && not (capabilities.is_map value)
    then value |> capabilities.collection_to_array |> Rrbvec.of_array
    else Rrbvec.singleton value
  in
  values
  |> Rrbvec.map (fun value ->
      if capabilities.is_entity value then
        if matches_as_entity capabilities value property then value
        else property_value_content capabilities value
      else value)

let add_to_group capabilities groups key entity =
  let rec find index =
    if index = Rrbvec.length groups then None
    else if capabilities.equal key (Rrbvec.nth groups index).key then Some index
    else find (index + 1)
  in
  match find 0 with
  | Some index ->
      let group = Rrbvec.nth groups index in
      Rrbvec.set groups index
        { group with entities = Rrbvec.push_back group.entities entity }
  | None -> Rrbvec.push_back groups { key; entities = Rrbvec.singleton entity }

let scalar_sort_value capabilities value =
  if capabilities.is_nil value then View_order.Missing
  else if capabilities.is_bool value then
    View_order.Bool (capabilities.bool_from_value value)
  else if capabilities.is_number value then
    View_order.Number (capabilities.float_from_value value)
  else if capabilities.is_string value then
    View_order.Text (capabilities.string_from_value value)
  else View_order.Missing

let property_is_ref capabilities property =
  optional_field capabilities property "db/valueType"
  |> Option.exists (fun value ->
      String.equal (capabilities.ident_text value) "db.type/ref")

let property_has_closed_values capabilities property =
  capabilities.field property "property/closed-values"
  |> capabilities.is_nil |> not

let sort_value capabilities ~property ~group_ident ~sort_ident ~descending key =
  if String.equal group_ident "block/page" then
    let value = capabilities.field key sort_ident in
    if
      String.equal sort_ident "block/journal-day"
      && (not descending) && capabilities.is_nil value
    then View_order.Number 9_007_199_254_740_991.
    else scalar_sort_value capabilities value
  else if property_has_closed_values capabilities property then
    capabilities.field key "block/order" |> scalar_sort_value capabilities
  else if property_is_ref capabilities property then
    let value =
      if capabilities.is_entity key then property_value_content capabilities key
      else key
    in
    scalar_sort_value capabilities value
  else scalar_sort_value capabilities key

let secondary_sort_value capabilities sort_ident key =
  capabilities.field key sort_ident |> scalar_sort_value capabilities

let sort_groups capabilities ~property ~group_ident ~sort_ident ~descending
    groups =
  let include_secondary = not (String.equal sort_ident "block/title") in
  let rows =
    groups
    |> Rrbvec.mapi (fun index group ->
        let major =
          sort_value capabilities ~property ~group_ident ~sort_ident ~descending
            group.key
        in
        let keys =
          if include_secondary then
            Rrbvec.of_array
              [|
                major; secondary_sort_value capabilities "block/title" group.key;
              |]
          else Rrbvec.singleton major
        in
        ({ View_order.index; keys } : View_order.row))
  in
  let direction = if descending then View_order.Desc else Asc in
  let directions =
    if include_secondary then Rrbvec.of_array [| direction; direction |]
    else Rrbvec.singleton direction
  in
  View_order.sort_indices rows directions |> Rrbvec.map (Rrbvec.nth groups)

let group_entities_with capabilities ~property ~group_ident ~sort_ident
    ~descending entities =
  let groups =
    Rrbvec.fold_left
      (fun groups entity ->
        group_values capabilities property group_ident entity
        |> Rrbvec.fold_left
             (fun groups key -> add_to_group capabilities groups key entity)
             groups)
      Rrbvec.empty entities
  in
  sort_groups capabilities ~property ~group_ident ~sort_ident ~descending groups
