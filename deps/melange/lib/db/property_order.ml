type entry = { index : int; order : string option; uuid : string }
type update = { index : int; order : string }

let compare_entry (left : entry) (right : entry) =
  match (left.order, right.order) with
  | None, None -> String.compare left.uuid right.uuid
  | None, Some _ -> 1
  | Some _, None -> -1
  | Some left_order, Some right_order ->
      let order_comparison = String.compare left_order right_order in
      if order_comparison = 0 then String.compare left.uuid right.uuid
      else order_comparison

let sort_indices entries =
  let sorted = Rrbvec.to_array entries in
  Array.stable_sort compare_entry sorted;
  sorted |> Array.map (fun (entry : entry) -> entry.index) |> Rrbvec.of_array

let normalize_orders entries =
  let values : entry array = Rrbvec.to_array entries in
  let updates = ref Rrbvec.empty in
  let start_order = ref None in
  let start = ref 0 in
  while !start < Array.length values do
    let finish = ref (!start + 1) in
    while
      !finish < Array.length values
      && values.(!finish).order = values.(!start).order
    do
      incr finish
    done;
    let count = !finish - !start in
    if count > 1 then (
      let orders =
        Order.generate_n_keys_between count !start_order values.(!start).order
      in
      for offset = 0 to count - 1 do
        updates :=
          Rrbvec.push_back !updates
            {
              index = values.(!start + offset).index;
              order = Rrbvec.nth orders offset;
            }
      done;
      start_order := Rrbvec.peek_back_opt orders)
    else start_order := values.(!start).order;
    start := !finish
  done;
  !updates
