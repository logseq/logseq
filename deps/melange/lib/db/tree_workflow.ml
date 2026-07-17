type ('entity, 'id) capabilities = {
  id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  order : 'entity -> string;
  children : 'entity -> 'entity Rrbvec.t;
  raw_children : 'entity -> 'entity Rrbvec.t;
  query_child : 'entity -> 'entity option;
}

type direction = Left | Right

type ('entity, 'id) sibling_capabilities = {
  sibling_id : 'entity -> 'id;
  sibling_equal_id : 'id -> 'id -> bool;
  sibling_order : 'entity -> string;
  parent : 'entity -> 'entity option;
  closed_property : 'entity -> 'entity option;
  created_from : 'entity -> 'entity option;
  closed_children : 'entity -> 'entity Rrbvec.t;
  raw_children : 'entity -> 'entity Rrbvec.t;
  normal_children : 'entity -> 'entity Rrbvec.t;
}

type ('entity, 'identifier) child_reference =
  | Entity of 'entity
  | Id of 'identifier
  | Uuid of 'identifier

type ('entity, 'identifier) child_capabilities = {
  child_order : 'entity -> string;
  child_entities : 'entity -> 'entity Rrbvec.t;
  child_by_id : 'identifier -> 'entity option;
  child_by_uuid : 'identifier -> 'entity option;
}

let sort_with ~order values =
  let values = Rrbvec.to_array values in
  Array.stable_sort
    (fun left right -> String.compare (order left) (order right))
    values;
  Rrbvec.of_array values

let contains equal id values = Rrbvec.exists (equal id) values

let block_and_children_with (capabilities : ('entity, 'id) capabilities)
    ~include_property_blocks root =
  let seen = ref Rrbvec.empty in
  let children entity =
    let values =
      if include_property_blocks then
        let raw = capabilities.raw_children entity in
        Rrbvec.append raw (Rrbvec.filter_map capabilities.query_child raw)
      else capabilities.children entity
    in
    sort_with ~order:capabilities.order values
  in
  let rec visit active entity =
    let id = capabilities.id entity in
    if contains capabilities.equal_id id active then
      invalid_arg "DB tree workflow: parent cycle";
    if contains capabilities.equal_id id !seen then Rrbvec.empty
    else (
      seen := Rrbvec.push_back !seen id;
      let active = Rrbvec.push_back active id in
      children entity
      |> Rrbvec.fold_left
           (fun result child -> Rrbvec.append result (visit active child))
           (Rrbvec.singleton entity))
  in
  visit Rrbvec.empty root

let sibling_with (capabilities : ('entity, 'id) sibling_capabilities) ~direction
    block =
  match capabilities.parent block with
  | None -> None
  | Some parent -> (
      let children =
        match capabilities.closed_property block with
        | Some property -> capabilities.closed_children property
        | None -> (
            match capabilities.created_from block with
            | Some property ->
                let property_id = capabilities.sibling_id property in
                capabilities.raw_children parent
                |> Rrbvec.filter (fun child ->
                    match capabilities.created_from child with
                    | None -> false
                    | Some candidate ->
                        capabilities.sibling_equal_id property_id
                          (capabilities.sibling_id candidate))
            | None ->
                capabilities.normal_children parent
                |> Rrbvec.filter (fun child ->
                    Option.is_none (capabilities.closed_property child)
                    && Option.is_none (capabilities.created_from child)))
      in
      let children = sort_with ~order:capabilities.sibling_order children in
      let current_order = capabilities.sibling_order block in
      match direction with
      | Right ->
          Rrbvec.find_opt
            (fun child ->
              String.compare (capabilities.sibling_order child) current_order
              > 0)
            children
      | Left ->
          children |> Rrbvec.rev
          |> Rrbvec.find_opt (fun child ->
              String.compare (capabilities.sibling_order child) current_order
              < 0))

let children_of_with ~order ~children entity =
  children entity |> sort_with ~order

let first_child_of_with ~order ~children entity =
  children_of_with ~order ~children entity |> fun values ->
  Rrbvec.nth_opt values 0

let resolve_child_reference
    (capabilities : ('entity, 'identifier) child_capabilities) = function
  | Entity entity -> Some entity
  | Id identifier -> capabilities.child_by_id identifier
  | Uuid identifier -> capabilities.child_by_uuid identifier

let children_with capabilities reference =
  resolve_child_reference capabilities reference
  |> Option.map
       (children_of_with ~order:capabilities.child_order
          ~children:capabilities.child_entities)

let first_child_with capabilities reference =
  Option.bind (children_with capabilities reference) (fun children ->
      Rrbvec.nth_opt children 0)
