type entry = {
  index : int;
  id : string option;
  scope_ids : string Rrbvec.t;
  recycled : bool;
}

let intersects left right =
  Rrbvec.fold_left
    (fun found value -> found || Rrbvec.mem value right)
    false left

let filter_indices entries ~class_ids ~excluded_ids =
  Rrbvec.filter_map
    (fun (entry : entry) ->
      if entry.recycled then None
      else if Rrbvec.is_empty entry.scope_ids then
        match entry.id with
        | Some id when Rrbvec.mem id excluded_ids -> None
        | Some _ | None -> Some entry.index
      else if intersects entry.scope_ids class_ids then Some entry.index
      else None)
    entries

let present_ids values =
  values |> Rrbvec.of_array
  |> Rrbvec.filter_map Fun.id

let filter_values_with ~id_text ~scope_ids ~recycled ~class_id ~class_entity
    ~block_id ~exclusions ~values ~classes =
  let class_ids = classes |> Array.map class_id |> present_ids in
  let class_ids =
    match (class_entity, block_id) with
    | true, Some id when not (Rrbvec.mem id class_ids) ->
        Rrbvec.push_back class_ids id
    | _ -> class_ids
  in
  let excluded_ids =
    classes
    |> Array.fold_left
         (fun result class_value ->
           Array.append result (exclusions class_value))
         [||]
    |> Array.map id_text |> present_ids
  in
  let entries =
    values
    |> Array.mapi (fun index value ->
        ({
           index;
           id = id_text value;
           scope_ids = scope_ids value |> Rrbvec.of_array;
           recycled = recycled value;
         }
          : entry))
    |> Rrbvec.of_array
  in
  filter_indices entries ~class_ids ~excluded_ids
  |> Rrbvec.map (Array.get values)
  |> Rrbvec.to_array

let compare_order left right =
  match (left, right) with
  | None, None -> 0
  | None, Some _ -> -1
  | Some _, None -> 1
  | Some left, Some right -> String.compare left right

let closed_values_with ~lookup ~values ~recycled ~order property_id =
  match lookup property_id with
  | None -> None
  | Some property ->
      let result =
        values property |> Rrbvec.of_array
        |> Rrbvec.filter (fun value -> not (recycled value))
        |> Rrbvec.to_array
      in
      Array.stable_sort
        (fun left right -> compare_order (order left) (order right))
        result;
      Some result

let find_closed_value_with ~lookup ~values ~recycled ~order ~content ~equals
    property_id target =
  match closed_values_with ~lookup ~values ~recycled ~order property_id with
  | None -> None
  | Some values ->
      let rec find index =
        if index >= Array.length values then None
        else
          let value = Array.get values index in
          if equals (content value) target then Some value else find (index + 1)
      in
      find 0
