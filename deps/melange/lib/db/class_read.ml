module Int_set = Set.Make (Int)

type node = { id : int; extends : int Rrbvec.t }
type object_candidate = { id : int; hidden : bool }

let extends_ids ~root_id nodes =
  let by_id = Hashtbl.create (Rrbvec.length nodes) in
  Rrbvec.iter (fun (node : node) -> Hashtbl.replace by_id node.id node) nodes;
  let root : node =
    match Hashtbl.find_opt by_id root_id with
    | Some node -> node
    | None -> invalid_arg "DB class reads: root node is missing"
  in
  let rec collect frontier result =
    if Rrbvec.length frontier = 0 then result
    else
      let next =
        Rrbvec.concat_map
          (fun id ->
            match Hashtbl.find_opt by_id id with
            | Some (node : node) -> node.extends
            | None -> invalid_arg "DB class reads: extended node is missing")
          frontier
      in
      collect next (Rrbvec.append result frontier)
  in
  let traversed = collect root.extends Rrbvec.empty in
  let _, distinct =
    Rrbvec.fold_left
      (fun (seen, result) id ->
        if Int_set.mem id seen then (seen, result)
        else (Int_set.add id seen, Rrbvec.push_back result id))
      (Int_set.empty, Rrbvec.empty)
      traversed
  in
  Rrbvec.rev distinct

let extends_entities_with ~entity_id ~entity_extends root =
  let entities = Hashtbl.create 16 in
  let rec collect pending seen nodes =
    match Rrbvec.pop_front pending with
    | None -> (seen, nodes)
    | Some (entity, rest) ->
        let id = entity_id entity in
        if Int_set.mem id seen then collect rest seen nodes
        else
          let children = entity_extends entity in
          Hashtbl.replace entities id entity;
          let node =
            { id; extends = children |> Array.map entity_id |> Rrbvec.of_array }
          in
          collect
            (Rrbvec.append_array rest children)
            (Int_set.add id seen)
            (Rrbvec.push_back nodes node)
  in
  let _, nodes =
    collect (Rrbvec.singleton root) Int_set.empty Rrbvec.empty
  in
  extends_ids ~root_id:(entity_id root) nodes
  |> Rrbvec.map (fun id ->
      match Hashtbl.find_opt entities id with
      | Some entity -> entity
      | None -> invalid_arg "DB class reads: extended entity is missing")
  |> Rrbvec.to_array

let structured_children_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol "?c"; symbol "..." |];
      keyword "in";
      symbol "$";
      symbol "?p";
      symbol "%";
      keyword "where";
      list_form [| symbol "class-extends"; symbol "?p"; symbol "?c" |];
    |]

let structured_children_with ~encode_form ~query ~collection_to_array
    ~value_equals ~root ~rule =
  query (encode_form structured_children_query) [| root; rule |]
  |> collection_to_array |> Rrbvec.of_array
  |> Rrbvec.filter (fun value -> not (value_equals value root))
  |> Rrbvec.to_array

let objects_with ~encode_form ~query ~collection_to_array ~value_equals ~datoms
    ~datom_entity ~entity ~hidden ~root ~rule ~index ~attribute =
  let children =
    structured_children_with ~encode_form ~query ~collection_to_array
      ~value_equals ~root ~rule
  in
  let distinct values =
    values
    |> Array.fold_left
         (fun result value ->
           if Rrbvec.exists (value_equals value) result then result
           else Rrbvec.push_back result value)
         Rrbvec.empty
    |> Rrbvec.to_array
  in
  let class_ids = distinct (Array.append [| root |] children) in
  let entity_ids =
    class_ids
    |> Array.fold_left
         (fun result class_id ->
           Array.append result
             (datoms index [| attribute; class_id |] |> Array.map datom_entity))
         [||]
    |> distinct
  in
  entity_ids
  |> Array.fold_left
       (fun result id ->
         let value =
           match entity id with
           | Some value -> value
           | None -> invalid_arg "DB class reads: tagged entity is missing"
         in
         if hidden value then result else Rrbvec.push_back result value)
       Rrbvec.empty
  |> Rrbvec.to_array

let object_ids candidates =
  let _, result =
    Rrbvec.fold_left
      (fun (seen, result) (candidate : object_candidate) ->
        if Int_set.mem candidate.id seen then (seen, result)
        else
          let seen = Int_set.add candidate.id seen in
          if candidate.hidden then (seen, result)
          else (seen, Rrbvec.push_back result candidate.id))
      (Int_set.empty, Rrbvec.empty)
      candidates
  in
  result

let logseq_class namespace_ = namespace_ = "logseq.class"

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

let user_class_namespace namespace_ = contains namespace_ ".class"
