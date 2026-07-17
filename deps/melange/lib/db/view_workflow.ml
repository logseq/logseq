type 'value sorting = { id : 'value; ascending : bool }

type 'value capabilities = {
  field : 'value -> string -> 'value;
  resolve_entity : 'value -> 'value option;
  is_nil : 'value -> bool;
  value_truthy : 'value -> bool;
  is_bool : 'value -> bool;
  bool_from_value : 'value -> bool;
  is_number : 'value -> bool;
  float_from_value : 'value -> float;
  is_string : 'value -> bool;
  string_from_value : 'value -> string;
  ident_text : 'value -> string;
  ident_from_string : string -> 'value;
  collection_to_array : 'value -> 'value array;
  string_to_value : string -> 'value;
  float_to_value : float -> 'value;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  datom_entity_ids : string -> 'value array;
}

let optional_field capabilities entity name =
  let value = capabilities.field entity name in
  if capabilities.is_nil value then None else Some value

let property_type capabilities property =
  Option.bind (optional_field capabilities property "logseq.property/type")
    (fun value -> value |> capabilities.ident_text |> Property_type.of_string)

let property_ident capabilities property =
  capabilities.field property "db/ident" |> capabilities.ident_text

let property_many capabilities property =
  optional_field capabilities property "db/cardinality"
  |> Option.exists (fun value ->
      String.equal (capabilities.ident_text value) "db.cardinality/many")

let property_uses_content capabilities property =
  match property_type capabilities property with
  | Some property_type -> Rrbvec.mem property_type Property_type.all_ref
  | None -> false

let property_value_content capabilities entity =
  let title = capabilities.field entity "block/title" in
  if capabilities.value_truthy title then title
  else capabilities.field entity "logseq.property/value"

let scalar_value capabilities value =
  capabilities.is_number value
  || capabilities.is_string value
  || capabilities.is_bool value

let join_values capabilities values =
  values
  |> Array.mapi (fun index value ->
      let text = capabilities.value_to_string value in
      if index = 0 then text else ", " ^ text)
  |> Array.fold_left ( ^ ) "" |> capabilities.string_to_value

let sum_numbers capabilities values =
  values
  |> Array.fold_left
       (fun sum value ->
         if capabilities.is_number value then
           sum +. capabilities.float_from_value value
         else sum)
       0.
  |> capabilities.float_to_value

let property_value_for_search capabilities ~entity ~property =
  let value =
    capabilities.field entity (property_ident capabilities property)
  in
  if scalar_value capabilities value then value
  else
    let property_type = property_type capabilities property in
    let number_type =
      property_type
      |> Option.exists (fun property_type ->
          let name = Property_type.to_string property_type in
          String.equal name "number" || String.equal name "datetime")
    in
    let content value =
      if property_uses_content capabilities property then
        property_value_content capabilities value
      else value
    in
    if property_many capabilities property then
      let values =
        value |> capabilities.collection_to_array |> Array.map content
        |> Array.fold_left
             (fun result value ->
               if capabilities.is_nil value then result
               else Rrbvec.push_back result value)
             Rrbvec.empty
        |> Rrbvec.to_array
      in
      if number_type then sum_numbers capabilities values
      else join_values capabilities values
    else content value

type 'value resolved_sorting = {
  sorting : 'value sorting;
  property : 'value option;
  ident : string;
}

let resolve_sorting capabilities sorting =
  let property = capabilities.resolve_entity sorting.id in
  let ident =
    match property with
    | Some property -> property_ident capabilities property
    | None -> capabilities.ident_text sorting.id
  in
  { sorting; property; ident }

let scalar_sort_value capabilities value =
  if capabilities.is_nil value then View_order.Missing
  else if capabilities.is_bool value then
    View_order.Bool (capabilities.bool_from_value value)
  else if capabilities.is_number value then
    View_order.Number (capabilities.float_from_value value)
  else if capabilities.is_string value then
    View_order.Text (capabilities.string_from_value value)
  else View_order.Missing

let closed_value_sort_key capabilities property entity ident =
  let closed_values =
    capabilities.field property "property/closed-values"
    |> capabilities.collection_to_array
  in
  if Array.length closed_values = 0 then None
  else
    let value = capabilities.field entity ident in
    let value_id = capabilities.field value "db/id" in
    let all_ordered =
      Array.for_all
        (fun closed_value ->
          capabilities.field closed_value "block/order"
          |> capabilities.is_nil |> not)
        closed_values
    in
    let rec find index =
      if index = Array.length closed_values then View_order.Missing
      else
        let closed_value = closed_values.(index) in
        let closed_id = capabilities.field closed_value "db/id" in
        if capabilities.equal value_id closed_id then
          if all_ordered then
            capabilities.field closed_value "block/order"
            |> scalar_sort_value capabilities
          else View_order.Number (float_of_int index)
        else find (index + 1)
    in
    Some (find 0)

let sort_key capabilities resolved entity =
  match resolved.property with
  | None ->
      capabilities.field entity resolved.ident |> scalar_sort_value capabilities
  | Some property -> (
      match
        closed_value_sort_key capabilities property entity resolved.ident
      with
      | Some key -> key
      | None ->
          let value =
            if
              property_type capabilities property
              |> Option.exists (fun property_type ->
                  String.equal (Property_type.to_string property_type) "date")
            then
              capabilities.field entity resolved.ident |> fun value ->
              capabilities.field value "block/journal-day"
            else property_value_for_search capabilities ~entity ~property
          in
          scalar_sort_value capabilities value)

let direction resolved =
  if resolved.sorting.ascending then View_order.Asc else Desc

let sort_with capabilities resolved entities =
  let resolved = Rrbvec.of_array resolved in
  let rows =
    entities
    |> Rrbvec.mapi (fun index entity ->
        ({
           View_order.index;
           keys =
             Rrbvec.map
               (fun sorting -> sort_key capabilities sorting entity)
               resolved;
         }
          : View_order.row))
  in
  let directions = Rrbvec.map direction resolved in
  View_order.sort_indices rows directions |> Rrbvec.map (Rrbvec.nth entities)

let distinct capabilities values =
  Rrbvec.fold_left
    (fun result value ->
      if Rrbvec.exists (capabilities.equal value) result then result
      else Rrbvec.push_back result value)
    Rrbvec.empty values

let reverse_array values =
  Array.init (Array.length values) (fun index ->
      values.(Array.length values - index - 1))

let fast_sort_supported ident =
  String.equal ident "block/updated-at"
  || String.equal ident "block/created-at"
  || String.equal ident "block/title"

let property_is_ref capabilities = function
  | None -> false
  | Some property ->
      optional_field capabilities property "db/valueType"
      |> Option.exists (fun value ->
          String.equal (capabilities.ident_text value) "db.type/ref")

let fast_major_sort capabilities resolved entities =
  if
    Rrbvec.length entities <= 10_000
    || (not (fast_sort_supported resolved.ident))
    || property_is_ref capabilities resolved.property
  then None
  else
    let ids = capabilities.datom_entity_ids resolved.ident in
    let ids = if resolved.sorting.ascending then ids else reverse_array ids in
    let ids = Rrbvec.of_array ids |> distinct capabilities in
    let rows =
      entities
      |> Rrbvec.map (fun entity -> (capabilities.field entity "db/id", entity))
    in
    let result =
      Rrbvec.fold_left
        (fun result id ->
          match
            Rrbvec.find_opt
              (fun (candidate, _) -> capabilities.equal id candidate)
              rows
          with
          | Some (_, entity) -> Rrbvec.push_back result entity
          | None -> result)
        Rrbvec.empty ids
    in
    Some result

let partition_by capabilities resolved entities =
  Rrbvec.fold_left
    (fun groups entity ->
      let key = sort_key capabilities resolved entity in
      match
        if Rrbvec.is_empty groups then None
        else Some (Rrbvec.nth groups (Rrbvec.length groups - 1))
      with
      | Some (group_key, group) when group_key = key ->
          Rrbvec.set groups
            (Rrbvec.length groups - 1)
            (group_key, Rrbvec.push_back group entity)
      | Some _ | None -> Rrbvec.push_back groups (key, Rrbvec.singleton entity))
    Rrbvec.empty entities

let sort_entities_with capabilities sorting entities =
  let sorting =
    if Rrbvec.is_empty sorting then
      Rrbvec.singleton
        {
          id = capabilities.ident_from_string "block/updated-at";
          ascending = false;
        }
    else sorting
  in
  let resolved = sorting |> Rrbvec.map (resolve_sorting capabilities) in
  let major = Rrbvec.nth resolved 0 in
  let major_sorted =
    fast_major_sort capabilities major entities
    |> Option.value ~default:(sort_with capabilities [| major |] entities)
    |> distinct capabilities
  in
  if Rrbvec.length resolved = 1 then major_sorted
  else
    let minor =
      Array.init
        (Rrbvec.length resolved - 1)
        (fun index -> Rrbvec.nth resolved (index + 1))
    in
    partition_by capabilities major major_sorted
    |> Rrbvec.concat_map (fun (_, group) -> sort_with capabilities minor group)
