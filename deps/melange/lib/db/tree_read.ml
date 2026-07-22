module Int_set = Set.Make (Int)

type direction = Left | Right
type child = { id : int; order : string; excluded : bool }
type node = { id : int; order : string; children : int Rrbvec.t }

let sorted_children children =
  let children = Rrbvec.to_array children in
  Array.stable_sort
    (fun (left : child) right -> String.compare left.order right.order)
    children;
  children

let sort_ids children =
  children |> sorted_children
  |> Array.map (fun (child : child) -> child.id)
  |> Rrbvec.of_array

let neighbor_id ~direction ~current_order children =
  let children = sorted_children children in
  let length = Array.length children in
  let rec find index step =
    if index < 0 || index >= length then None
    else
      let child = children.(index) in
      let comparison = String.compare child.order current_order in
      let eligible =
        (not child.excluded)
        &&
        match direction with
        | Right -> comparison > 0
        | Left -> comparison < 0
      in
      if eligible then Some child.id else find (index + step) step
  in
  match direction with Right -> find 0 1 | Left -> find (length - 1) (-1)

let preorder_ids ~root_id nodes =
  let by_id = Hashtbl.create (Rrbvec.length nodes) in
  Rrbvec.iter (fun (node : node) -> Hashtbl.replace by_id node.id node) nodes;
  let node id =
    match Hashtbl.find_opt by_id id with
    | Some node -> node
    | None -> invalid_arg "DB tree reads: node is missing"
  in
  let result = ref Rrbvec.empty in
  let rec visit active id =
    if Int_set.mem id active then invalid_arg "DB tree reads: parent cycle";
    let current = node id in
    let active = Int_set.add id active in
    let children =
      current.children
      |> Rrbvec.map (fun child_id ->
          let child = node child_id in
          ({ id = child.id; order = child.order; excluded = false } : child))
      |> sorted_children
    in
    Array.iter
      (fun (child : child) ->
        result := Rrbvec.push_back !result child.id;
        visit active child.id)
      children
  in
  visit Int_set.empty root_id;
  !result
