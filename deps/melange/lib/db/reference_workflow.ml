type ('id, 'entity, 'label) capabilities = {
  entity : 'id -> 'entity option;
  entity_id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  id_text : 'id -> string;
  aliases : 'id -> 'id Rrbvec.t;
  structured_children : 'id -> 'id Rrbvec.t;
  children_ids : 'entity -> 'id Rrbvec.t;
  direct_children : 'entity -> 'entity Rrbvec.t;
  parents : 'entity -> 'entity Rrbvec.t;
  parent : 'entity -> 'entity option;
  page : 'entity -> 'entity option;
  view_for : 'entity -> 'entity option;
  references : 'entity -> 'entity Rrbvec.t;
  references_to : 'entity -> 'entity Rrbvec.t;
  tags : 'entity -> 'entity Rrbvec.t;
  filter_includes : 'entity -> 'entity Rrbvec.t;
  filter_excludes : 'entity -> 'entity Rrbvec.t;
  ident : 'entity -> string option;
  has_ident_field : 'entity -> string -> bool;
  hidden : 'entity -> bool;
  class_entity : 'entity -> bool;
  page_entity : 'entity -> bool;
  title : 'entity -> 'label;
}

type 'label page_count = { label : 'label; count : int }

type 'entity filters = {
  included : 'entity Rrbvec.t;
  excluded : 'entity Rrbvec.t;
}

type ('id, 'entity, 'label) result = {
  ref_blocks : 'entity Rrbvec.t;
  ref_pages_count : 'label page_count Rrbvec.t option;
  ref_matched_children_ids : 'id Rrbvec.t option;
}

let filters ~included ~excluded =
  if Rrbvec.is_empty included && Rrbvec.is_empty excluded then None
  else Some { included; excluded }

let required_entity capabilities id =
  match capabilities.entity id with
  | Some value -> value
  | None -> invalid_arg "DB linked references: entity is missing"

let push_unique equal value values =
  if Rrbvec.fold_left (fun found item -> found || equal value item) false values
  then values
  else Rrbvec.push_back values value

let entity_ids capabilities entities =
  Rrbvec.map capabilities.entity_id entities

let id_in capabilities id ids =
  Rrbvec.fold_left
    (fun found candidate -> found || capabilities.equal_id id candidate)
    false ids

let class_ids capabilities target_id target =
  if capabilities.class_entity target then
    Some
      (Rrbvec.fold_left
         (fun values id -> push_unique capabilities.equal_id id values)
         (Rrbvec.singleton target_id)
         (capabilities.structured_children target_id))
  else None

let class_match capabilities class_ids candidate =
  match class_ids with
  | None -> false
  | Some ids ->
      capabilities.tags candidate
      |> entity_ids capabilities
      |> Rrbvec.fold_left
           (fun found id -> found || id_in capabilities id ids)
           false

let hidden_reference capabilities ~target_id ~target_ident ~class_ids candidate
    =
  let same_entity value =
    capabilities.equal_id target_id (capabilities.entity_id value)
  in
  same_entity candidate
  || Option.fold ~none:false ~some:same_entity (capabilities.page candidate)
  || Option.fold ~none:false ~some:same_entity (capabilities.view_for candidate)
  || Option.fold ~none:false ~some:capabilities.hidden
       (capabilities.page candidate)
  || capabilities.hidden candidate
  || class_match capabilities class_ids candidate
  || Option.fold ~none:false
       ~some:(capabilities.has_ident_field candidate)
       target_ident

let full_reference_ids capabilities ~target_id ~target_ident ~class_ids =
  let source_ids =
    Rrbvec.fold_left
      (fun values id -> push_unique capabilities.equal_id id values)
      (Rrbvec.singleton target_id)
      (capabilities.aliases target_id)
  in
  Rrbvec.fold_left
    (fun result source_id ->
      let source = required_entity capabilities source_id in
      capabilities.references_to source
      |> Rrbvec.fold_left
           (fun result candidate ->
             if
               hidden_reference capabilities ~target_id ~target_ident ~class_ids
                 candidate
             then result
             else
               push_unique capabilities.equal_id
                 (capabilities.entity_id candidate)
                 result)
           result)
    Rrbvec.empty source_ids

let descendant_ids capabilities top_ids =
  let rec collect pending visited result =
    match Rrbvec.pop_front pending with
    | None -> result
    | Some (id, rest) when id_in capabilities id visited ->
        collect rest visited result
    | Some (id, rest) ->
        let entity = required_entity capabilities id in
        let children =
          capabilities.direct_children entity |> entity_ids capabilities
        in
        collect
          (Rrbvec.append rest children)
          (Rrbvec.push_back visited id)
          (Rrbvec.fold_left
             (fun values child ->
               push_unique capabilities.equal_id child values)
             result children)
  in
  collect top_ids Rrbvec.empty
    (Rrbvec.fold_left
       (fun values id -> push_unique capabilities.equal_id id values)
       Rrbvec.empty top_ids)

let include_parent_ids capabilities ids =
  let rec collect pending result =
    match Rrbvec.pop_front pending with
    | None -> result
    | Some (id, rest) -> (
        let entity = required_entity capabilities id in
        match capabilities.parent entity with
        | None -> collect rest result
        | Some parent ->
            let parent_id = capabilities.entity_id parent in
            if id_in capabilities parent_id result then collect rest result
            else
              collect
                (Rrbvec.push_back rest parent_id)
                (Rrbvec.push_back result parent_id))
  in
  collect ids ids

let selected_ids capabilities ~class_ids top_ids includes excludes =
  let graph_ids =
    descendant_ids capabilities top_ids |> include_parent_ids capabilities
  in
  let id_by_text =
    Rrbvec.map (fun id -> (capabilities.id_text id, id)) graph_ids
  in
  let decode text =
    match
      Rrbvec.find_opt
        (fun (candidate, _) -> String.equal text candidate)
        id_by_text
    with
    | Some (_, id) -> id
    | None -> invalid_arg "DB linked references: selected id is missing"
  in
  let nodes =
    Rrbvec.map
      (fun id ->
        let entity = required_entity capabilities id in
        let own_refs =
          capabilities.references entity |> entity_ids capabilities
          |> fun ids ->
          match capabilities.page entity with
          | None -> ids
          | Some page ->
              push_unique capabilities.equal_id
                (capabilities.entity_id page)
                ids
        in
        let parent =
          capabilities.parent entity
          |> Option.map (fun value ->
              value |> capabilities.entity_id |> capabilities.id_text)
        in
        ({
           Reference_filter.id = capabilities.id_text id;
           parent;
           own_refs = Rrbvec.map capabilities.id_text own_refs;
           children =
             capabilities.direct_children entity
             |> entity_ids capabilities
             |> Rrbvec.map capabilities.id_text;
           class_ok = not (class_match capabilities class_ids entity);
         }
          : Reference_filter.node))
      graph_ids
  in
  let result =
    Reference_filter.select nodes
      ~top_ids:(Rrbvec.map capabilities.id_text top_ids)
      ~includes:(Rrbvec.map capabilities.id_text includes)
      ~excludes:(Rrbvec.map capabilities.id_text excludes)
  in
  (Rrbvec.map decode result.top_ids, Rrbvec.map decode result.child_ids)

let reference_children capabilities ref_blocks =
  Rrbvec.fold_left
    (fun result entity ->
      capabilities.children_ids entity
      |> Rrbvec.fold_left
           (fun values id -> push_unique capabilities.equal_id id values)
           result)
    Rrbvec.empty ref_blocks

let distinct_entities capabilities entities =
  Rrbvec.fold_left
    (fun result entity ->
      let id = capabilities.entity_id entity in
      if
        Rrbvec.fold_left
          (fun found value ->
            found || capabilities.equal_id id (capabilities.entity_id value))
          false result
      then result
      else Rrbvec.push_back result entity)
    Rrbvec.empty entities

let path_references capabilities ref_block =
  let values =
    capabilities.parents ref_block |> Rrbvec.concat_map capabilities.references
  in
  let values =
    match capabilities.page ref_block with
    | None -> values
    | Some page -> Rrbvec.push_front values page
  in
  distinct_entities capabilities values

let page_counts capabilities ~target_id ~target_ident ~class_ids ref_blocks
    child_ids =
  if Rrbvec.is_empty ref_blocks then None
  else
    let children = Rrbvec.map (required_entity capabilities) child_ids in
    let candidates =
      Rrbvec.append
        (Rrbvec.concat_map (path_references capabilities) ref_blocks)
        (Rrbvec.concat_map capabilities.references
           (Rrbvec.append ref_blocks children))
    in
    let counts =
      Rrbvec.fold_left
        (fun counts candidate ->
          let candidate_id = capabilities.entity_id candidate in
          if
            (not (capabilities.page_entity candidate))
            || capabilities.equal_id target_id candidate_id
            || Option.exists
                 (String.equal "block/tags")
                 (capabilities.ident candidate)
            || hidden_reference capabilities ~target_id ~target_ident ~class_ids
                 candidate
          then counts
          else
            let rec find index =
              if index = Rrbvec.length counts then None
              else
                let id, _ = Rrbvec.nth counts index in
                if capabilities.equal_id id candidate_id then Some index
                else find (index + 1)
            in
            match find 0 with
            | None -> Rrbvec.push_back counts (candidate_id, 1)
            | Some index ->
                let id, count = Rrbvec.nth counts index in
                Rrbvec.set counts index (id, count + 1))
        Rrbvec.empty candidates
    in
    let entries =
      counts
      |> Rrbvec.map (fun (id, count) ->
          let entity = required_entity capabilities id in
          { label = capabilities.title entity; count })
      |> Rrbvec.to_array
    in
    Array.stable_sort
      (fun (left : _ page_count) right -> Int.compare right.count left.count)
      entries;
    Some (Rrbvec.of_array entries)

let linked_with capabilities target_id =
  let target = required_entity capabilities target_id in
  let target_ident = capabilities.ident target in
  let class_ids = class_ids capabilities target_id target in
  let top_ids =
    full_reference_ids capabilities ~target_id ~target_ident ~class_ids
  in
  let includes =
    capabilities.filter_includes target |> entity_ids capabilities
  in
  let excludes =
    capabilities.filter_excludes target |> entity_ids capabilities
  in
  let filtered =
    Option.is_some (filters ~included:includes ~excluded:excludes)
  in
  let final_ids, matched_children =
    if filtered then
      let selected, children =
        selected_ids capabilities ~class_ids top_ids includes excludes
      in
      (selected, Some children)
    else (top_ids, None)
  in
  let ref_blocks = Rrbvec.map (required_entity capabilities) final_ids in
  let child_ids =
    Option.value matched_children
      ~default:(reference_children capabilities ref_blocks)
  in
  {
    ref_blocks;
    ref_pages_count =
      page_counts capabilities ~target_id ~target_ident ~class_ids ref_blocks
        child_ids;
    ref_matched_children_ids = matched_children;
  }
