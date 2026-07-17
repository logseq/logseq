type conflict_group = { indices : int Rrbvec.t; tx : int option }
type candidate = { index : int; tx : int option }
type priority = { index : int; priority : int }

type reorder_kind =
  | Recreated_retract
  | Retracted_datom
  | Other
  | Final_retract

type reorder_entry = { index : int; kind : reorder_kind }

type item_shape = {
  index : int;
  retract_block_uuid : bool;
  has_attr : bool;
  has_value : bool;
}

type item_action = Retract_entity | Keep_item | Shorten_item
type item_plan = { index : int; action : item_action }
type replacement_entry = { index : int; replacement_group : int option }
type entity_retraction_action = Emit_retraction of int | Keep_original of int

type resolution_availability = {
  has_before_lookup : bool;
  has_after_tempid : bool;
}

type resolution_source = Before_lookup | After_tempid | Original_value
type datom_operation = Drop_datom | Add_datom | Retract_datom

type datom_shape = {
  added : bool;
  entity : resolution_availability;
  resolve_value : bool;
  value : resolution_availability;
  original_value_present : bool;
}

type datom_plan = {
  operation : datom_operation;
  entity_source : resolution_source option;
  value_source : resolution_source option;
}

let select_conflict_indices groups =
  let candidates =
    groups
    |> Rrbvec.map (fun group ->
        match Rrbvec.peek_back_opt group.indices with
        | Some index -> { index; tx = group.tx }
        | None -> invalid_arg "DB normalization: empty conflict group")
    |> Rrbvec.to_array
  in
  Array.stable_sort
    (fun (left : candidate) (right : candidate) ->
      match (left.tx, right.tx) with
      | Some left, Some right -> Int.compare left right
      | None, _ | _, None -> 0)
    candidates;
  candidates
  |> Array.map (fun (candidate : candidate) -> candidate.index)
  |> Rrbvec.of_array

let sort_priority_indices priorities =
  let values =
    priorities |> Rrbvec.to_array
    |> Array.mapi (fun index priority -> { index; priority })
  in
  Array.stable_sort
    (fun (left : priority) (right : priority) ->
      Int.compare left.priority right.priority)
    values;
  values |> Array.map (fun (value : priority) -> value.index) |> Rrbvec.of_array

let reorder_rank = function
  | Recreated_retract -> 0
  | Retracted_datom -> 1
  | Other -> 2
  | Final_retract -> 3

let reorder_retract_indices entries =
  let values = Rrbvec.to_array entries in
  Array.stable_sort
    (fun (left : reorder_entry) (right : reorder_entry) ->
      Int.compare (reorder_rank left.kind) (reorder_rank right.kind))
    values;
  values
  |> Array.map (fun (entry : reorder_entry) -> entry.index)
  |> Rrbvec.of_array

let plan_item_actions items =
  Rrbvec.map
    (fun (item : item_shape) ->
      let action =
        if item.retract_block_uuid then Retract_entity
        else if item.has_attr && item.has_value then Keep_item
        else Shorten_item
      in
      { index = item.index; action })
    items

let retained_indices removals =
  removals |> Rrbvec.to_array
  |> Array.mapi (fun index remove -> if remove then None else Some index)
  |> Array.to_seq |> Seq.filter_map Fun.id |> Array.of_seq |> Rrbvec.of_array

let plan_entity_retractions entries =
  let entry_count = Rrbvec.length entries in
  let seen_groups = Array.make entry_count false in
  Rrbvec.filter_map
    (fun (entry : replacement_entry) ->
      match entry.replacement_group with
      | None -> Some (Keep_original entry.index)
      | Some group ->
          if group < 0 then
            invalid_arg "DB normalization: negative replacement group"
          else if group >= entry_count then
            invalid_arg "DB normalization: replacement group out of range"
          else if Array.get seen_groups group then None
          else (
            Array.set seen_groups group true;
            Some (Emit_retraction group)))
    entries

let resolved_source added availability =
  if availability.has_before_lookup then Some Before_lookup
  else if added && availability.has_after_tempid then Some After_tempid
  else None

let plan_datom shape =
  let entity_source = resolved_source shape.added shape.entity in
  let value_source =
    if shape.resolve_value then resolved_source shape.added shape.value
    else if shape.original_value_present then Some Original_value
    else None
  in
  match (entity_source, value_source) with
  | Some entity_source, Some value_source ->
      {
        operation = (if shape.added then Add_datom else Retract_datom);
        entity_source = Some entity_source;
        value_source = Some value_source;
      }
  | None, _ | _, None ->
      { operation = Drop_datom; entity_source = None; value_source = None }
