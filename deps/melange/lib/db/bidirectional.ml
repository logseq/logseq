module Int_set = Set.Make (Int)

type class_ref = {
  id : int;
  class_ : bool;
  built_in : bool;
  recycled : bool;
  enabled : bool;
  created_at : float option;
}

type candidate = {
  entity_id : int;
  target : bool;
  recycled : bool;
  class_ : bool;
  property : bool;
  created_at : float option;
  classes : class_ref Rrbvec.t;
}

type entity = { id : int; created_at : float option }

type group_state = {
  class_id : int;
  class_created_at : float option;
  mutable entities : entity Rrbvec.t;
  mutable seen : Int_set.t;
}

type group = { class_id : int; entity_ids : int Rrbvec.t }

type ('entity, 'value) workflow_capabilities = {
  query_property_attrs : Datalog_form.t -> string Rrbvec.t;
  referenced_entity_ids : string -> int -> int Rrbvec.t;
  entity : int -> 'entity option;
  entity_id : 'entity -> int;
  recycled : 'entity -> bool;
  class_value : 'entity -> bool;
  property_value : 'entity -> bool;
  created_at : 'entity -> float option;
  classes : 'entity -> 'entity Rrbvec.t;
  built_in : 'entity -> bool;
  bidirectional_enabled : 'entity -> bool;
  created_from_property : 'entity -> bool;
  custom_title : 'entity -> 'value option;
  value_is_string : 'value -> bool;
  string_from_value : 'value -> string;
  property_value_content : 'value -> string;
  title : 'entity -> string;
  plural : string -> string;
}

type 'entity resolved_group = {
  resolved_title_value : string;
  resolved_class_value : 'entity;
  resolved_entity_values : 'entity Rrbvec.t;
}

let valid_candidate (candidate : candidate) target_id =
  candidate.entity_id <> target_id
  && (not candidate.target) && (not candidate.recycled)
  && (not candidate.class_) && not candidate.property

let valid_class (class_ref : class_ref) =
  class_ref.class_ && class_ref.enabled && (not class_ref.built_in)
  && not class_ref.recycled

let compare_optional_number left right =
  match (left, right) with
  | None, None -> 0
  | None, Some _ -> -1
  | Some _, None -> 1
  | Some left, Some right -> Float.compare left right

let compare_entity (left : entity) (right : entity) =
  compare_optional_number left.created_at right.created_at

let groups ~target_id candidates =
  let states = ref Rrbvec.empty in
  let state_by_class = Hashtbl.create 8 in
  let state_for (class_ref : class_ref) =
    match Hashtbl.find_opt state_by_class class_ref.id with
    | Some state -> state
    | None ->
        let state =
          {
            class_id = class_ref.id;
            class_created_at = class_ref.created_at;
            entities = Rrbvec.empty;
            seen = Int_set.empty;
          }
        in
        Hashtbl.add state_by_class class_ref.id state;
        states := Rrbvec.push_back !states state;
        state
  in
  Rrbvec.iter
    (fun candidate ->
      if valid_candidate candidate target_id then
        Rrbvec.iter
          (fun class_ref ->
            if valid_class class_ref then
              let state = state_for class_ref in
              if not (Int_set.mem candidate.entity_id state.seen) then (
                state.seen <- Int_set.add candidate.entity_id state.seen;
                state.entities <-
                  Rrbvec.push_back state.entities
                    {
                      id = candidate.entity_id;
                      created_at = candidate.created_at;
                    }))
          candidate.classes)
    candidates;
  let states = Rrbvec.to_array !states in
  Array.stable_sort
    (fun left right ->
      compare_optional_number left.class_created_at right.class_created_at)
    states;
  states
  |> Array.map (fun state ->
      let entities = Rrbvec.to_array state.entities in
      Array.stable_sort compare_entity entities;
      {
        class_id = state.class_id;
        entity_ids =
          entities |> Array.map (fun entity -> entity.id) |> Rrbvec.of_array;
      })
  |> Rrbvec.of_array

let group_class_id group = group.class_id
let group_entity_ids group = group.entity_ids

let property_attrs_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol "?a"; symbol "..." |];
      keyword "where";
      vector_form [| symbol "?property"; keyword "db/ident"; symbol "?a" |];
      vector_form
        [| symbol "?property"; keyword "db/valueType"; keyword "db.type/ref" |];
      vector_form
        [|
          symbol "?property"; keyword "logseq.property/classes"; symbol "?class";
        |];
    |]

let property_namespace ident =
  match String.rindex_opt ident '/' with
  | Some index when index > 0 -> Some (String.sub ident 0 index)
  | Some _ | None -> None

let bidirectional_property_attr ident =
  match property_namespace ident with
  | None -> false
  | Some namespace_ ->
      Property_identity.is_user_property_namespace namespace_
      || Property_identity.is_plugin_property_namespace (Some namespace_)

let required label = function
  | Some value -> value
  | None -> invalid_arg ("DB bidirectional reads: missing " ^ label)

let groups_with capabilities ~target_id =
  match capabilities.entity target_id with
  | Some target when capabilities.created_from_property target -> None
  | Some _ | None ->
      let candidates =
        capabilities.query_property_attrs property_attrs_query
        |> Rrbvec.filter bidirectional_property_attr
        |> Rrbvec.concat_map (fun attribute ->
            capabilities.referenced_entity_ids attribute target_id
            |> Rrbvec.filter_map (fun entity_id ->
                capabilities.entity entity_id
                |> Option.map (fun value ->
                    let classes =
                      capabilities.classes value
                      |> Rrbvec.map (fun class_value ->
                          ({
                             id = capabilities.entity_id class_value;
                             class_ = capabilities.class_value class_value;
                             built_in = capabilities.built_in class_value;
                             recycled = capabilities.recycled class_value;
                             enabled =
                               capabilities.bidirectional_enabled class_value;
                             created_at = capabilities.created_at class_value;
                           }
                            : class_ref))
                    in
                    ({
                       entity_id;
                       target = entity_id = target_id;
                       recycled = capabilities.recycled value;
                       class_ = capabilities.class_value value;
                       property = capabilities.property_value value;
                       created_at = capabilities.created_at value;
                       classes;
                     }
                      : candidate))))
      in
      groups ~target_id candidates
      |> Rrbvec.map (fun group ->
          let class_value =
            capabilities.entity (group_class_id group)
            |> required "class entity"
          in
          let custom_title =
            capabilities.custom_title class_value
            |> Option.map (fun value ->
                if capabilities.value_is_string value then
                  capabilities.string_from_value value
                else capabilities.property_value_content value)
          in
          let title =
            match custom_title with
            | Some value when String.trim value <> "" -> value
            | Some _ | None ->
                capabilities.title class_value |> capabilities.plural
          in
          let entities =
            group_entity_ids group
            |> Rrbvec.map (fun id ->
                capabilities.entity id |> required "group entity")
          in
          {
            resolved_title_value = title;
            resolved_class_value = class_value;
            resolved_entity_values = entities;
          })
      |> Option.some

let resolved_title group = group.resolved_title_value
let resolved_class group = group.resolved_class_value
let resolved_entities group = group.resolved_entity_values
