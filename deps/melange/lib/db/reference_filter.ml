module String_map = Map.Make (String)
module String_set = Set.Make (String)

type node = {
  id : string;
  parent : string option;
  own_refs : string Rrbvec.t;
  children : string Rrbvec.t;
  class_ok : bool;
}

type result = { top_ids : string Rrbvec.t; child_ids : string Rrbvec.t }

let set_of_vector values =
  Rrbvec.fold_left
    (fun result value -> String_set.add value result)
    String_set.empty values

let intersects left right =
  String_set.exists (fun value -> String_set.mem value right) left

let contains_all values required =
  String_set.for_all (fun value -> String_set.mem value values) required

let select nodes ~top_ids ~includes ~excludes =
  let nodes_by_id =
    Rrbvec.fold_left
      (fun result (node : node) -> String_map.add node.id node result)
      String_map.empty nodes
  in
  let find_node id = String_map.find id nodes_by_id in
  let includes = set_of_vector includes in
  let excludes = set_of_vector excludes in
  let effective_cache = Hashtbl.create (Rrbvec.length nodes) in
  let rec effective id =
    match Hashtbl.find_opt effective_cache id with
    | Some refs -> refs
    | None ->
        let node = find_node id in
        let refs = set_of_vector node.own_refs in
        let refs =
          match node.parent with
          | None -> refs
          | Some parent -> String_set.union refs (effective parent)
        in
        Hashtbl.add effective_cache id refs;
        refs
  in
  let subtree_cache = Hashtbl.create (Rrbvec.length nodes) in
  let rec allowed_subtree id =
    match Hashtbl.find_opt subtree_cache id with
    | Some refs -> refs
    | None ->
        let node = find_node id in
        let refs =
          if
            (not (String_set.is_empty excludes))
            && intersects (effective id) excludes
          then String_set.empty
          else
            Rrbvec.fold_left
              (fun refs child -> String_set.union refs (allowed_subtree child))
              (set_of_vector node.own_refs)
              node.children
        in
        Hashtbl.add subtree_cache id refs;
        refs
  in
  let rec visit stack visited matched =
    match Rrbvec.pop_front stack with
    | None -> matched
    | Some (id, rest) when String_set.mem id visited ->
        visit rest visited matched
    | Some (id, rest) ->
        let visited = String_set.add id visited in
        let node = find_node id in
        let effective_refs = effective id in
        if not node.class_ok then
          visit (Rrbvec.append node.children rest) visited matched
        else
          let possible = String_set.union effective_refs (allowed_subtree id) in
          if not (contains_all possible includes) then
            visit rest visited matched
          else
            let matches =
              contains_all possible includes
              && (String_set.is_empty excludes
                 || not (intersects effective_refs excludes))
            in
            let matched =
              if matches then String_set.add id matched else matched
            in
            visit (Rrbvec.append node.children rest) visited matched
  in
  let top_set = set_of_vector top_ids in
  let matched = visit top_ids String_set.empty String_set.empty in
  let expanded =
    String_set.fold
      (fun start result ->
        let rec add_path id result =
          if String_set.mem id result then result
          else
            let result = String_set.add id result in
            if String_set.mem id top_set then result
            else
              match (find_node id).parent with
              | None -> result
              | Some parent -> add_path parent result
        in
        add_path start result)
      matched String_set.empty
  in
  {
    top_ids =
      String_set.inter top_set expanded |> String_set.to_seq |> Rrbvec.of_seq;
    child_ids =
      String_set.diff expanded top_set |> String_set.to_seq |> Rrbvec.of_seq;
  }

let contains text pattern =
  let text_length = String.length text in
  let pattern_length = String.length pattern in
  let rec loop index =
    if pattern_length = 0 then true
    else if index + pattern_length > text_length then false
    else if String.sub text index pattern_length = pattern then true
    else loop (index + 1)
  in
  loop 0

let blank value =
  let whitespace = function
    | ' ' | '\t' | '\n' | '\r' | '\012' -> true
    | _ -> false
  in
  let rec loop index =
    index = String.length value || (whitespace value.[index] && loop (index + 1))
  in
  loop 0

let unlinked_with ~entity ~title ~title_datoms ~datom_entity ~datom_title
    ~id_equals ~references ~linked ~built_in ~lowercase target_id =
  let target_title = entity target_id |> title in
  match target_title with
  | None -> None
  | Some value ->
      let target = lowercase value in
      if blank target then None
      else
        title_datoms ()
        |> Array.fold_left
             (fun result datom ->
               let candidate_id = datom_entity datom in
               if
                 id_equals target_id candidate_id
                 || not (contains (lowercase (datom_title datom)) target)
               then result
               else
                 let candidate = entity candidate_id in
                 let directly_references =
                   references candidate
                   |> Array.exists (fun id -> id_equals target_id id)
                 in
                 if
                   directly_references || linked candidate || built_in candidate
                 then result
                 else result @ [ candidate ])
             []
        |> Array.of_list
        |> fun values -> Some values
