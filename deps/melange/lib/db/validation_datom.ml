type entry = {
  index : int;
  entity_id : int;
  attribute : string;
  schema_many : bool;
  value_truthy : bool;
  value_is_set : bool;
}

type action_kind = Assign | Begin_set | Start_set | Add_set
type action = { kind : action_kind; previous_index : int option }

let kind action = action.kind
let previous_index action = action.previous_index

module Key = struct
  type t = int * string

  let compare (left_entity, left_attribute) (right_entity, right_attribute) =
    match Int.compare left_entity right_entity with
    | 0 -> String.compare left_attribute right_attribute
    | value -> value
end

module Key_map = Map.Make (Key)

type state = Scalar of { index : int; truthy : bool } | Set_value

let plan entries =
  entries
  |> Rrbvec.fold_left
       (fun (states, actions) entry ->
         let key = (entry.entity_id, entry.attribute) in
         let current = Key_map.find_opt key states in
         let action, next_state =
           if entry.schema_many then
             ( {
                 kind =
                   (match current with None -> Begin_set | Some _ -> Add_set);
                 previous_index = None;
               },
               Set_value )
           else
             match current with
             | None ->
                 ( { kind = Assign; previous_index = None },
                   if entry.value_is_set then Set_value
                   else
                     Scalar { index = entry.index; truthy = entry.value_truthy }
                 )
             | Some (Scalar { truthy = false; _ }) ->
                 ( { kind = Assign; previous_index = None },
                   if entry.value_is_set then Set_value
                   else
                     Scalar { index = entry.index; truthy = entry.value_truthy }
                 )
             | Some (Scalar { index; truthy = true }) ->
                 ({ kind = Start_set; previous_index = Some index }, Set_value)
             | Some Set_value ->
                 ({ kind = Add_set; previous_index = None }, Set_value)
         in
         (Key_map.add key next_state states, Rrbvec.push_back actions action))
       (Key_map.empty, Rrbvec.empty)
  |> snd
