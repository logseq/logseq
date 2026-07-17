type feature =
  | All_pages
  | Class_objects
  | Property_objects
  | Linked_references
  | Unlinked_references
  | Query_result

type sorting = { id : string; ascending : bool }
type 'label page_count = { label : 'label; count : int }

type ('id, 'entity, 'label) reference_result = {
  blocks : 'entity Rrbvec.t;
  page_counts : 'label page_count Rrbvec.t option;
  matched_children_ids : 'id Rrbvec.t option;
}

type ('id, 'entity, 'label) selection =
  | Entities of 'entity Rrbvec.t
  | References of ('id, 'entity, 'label) reference_result
  | Empty

type ('id, 'entity, 'value, 'label) capabilities = {
  resolve_id : string -> 'id option;
  entity : 'id -> 'entity option;
  entity_id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  hidden : 'entity -> bool;
  ids_with_attribute : string -> 'id Rrbvec.t;
  ids_with_bool : string -> bool -> 'id Rrbvec.t;
  ids_with_ref : string -> 'id -> 'id Rrbvec.t;
  with_refs_count : 'entity -> int -> 'entity;
  refs_count : 'id -> int;
  sort_value : 'entity -> string -> View_order.value;
  class_objects : 'id -> 'entity Rrbvec.t;
  property_object_ids : string -> 'id Rrbvec.t;
  linked_references : 'id -> ('id, 'entity, 'label) reference_result;
  unlinked_references : 'id -> 'entity Rrbvec.t option;
}

let feature_of_string = function
  | "all-pages" -> All_pages
  | "class-objects" -> Class_objects
  | "property-objects" -> Property_objects
  | "linked-references" -> Linked_references
  | "unlinked-references" -> Unlinked_references
  | "query-result" -> Query_result
  | value -> invalid_arg ("Unsupported DB view feature: " ^ value)

let feature_to_string = function
  | All_pages -> "all-pages"
  | Class_objects -> "class-objects"
  | Property_objects -> "property-objects"
  | Linked_references -> "linked-references"
  | Unlinked_references -> "unlinked-references"
  | Query_result -> "query-result"

let property_objects_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol "?b"; symbol "..." |];
      keyword "in";
      symbol "$";
      symbol "%";
      symbol "?prop";
      keyword "where";
      list_form
        [|
          symbol "has-property-or-object-property?"; symbol "?b"; symbol "?prop";
        |];
    |]

let required label = function
  | Some value -> value
  | None -> invalid_arg ("DB view entity selection: missing " ^ label)

let distinct_ids capabilities ids =
  Rrbvec.fold_left
    (fun result id ->
      if Rrbvec.exists (capabilities.equal_id id) result then result
      else Rrbvec.push_back result id)
    Rrbvec.empty ids

let excluded_ids capabilities =
  let property_id =
    capabilities.resolve_id "logseq.class/Property" |> required "Property class"
  in
  Rrbvec.empty
  |> Rrbvec.append (capabilities.ids_with_bool "logseq.property/hide?" true)
  |> Rrbvec.append
       (capabilities.ids_with_attribute "logseq.property/deleted-at")
  |> Rrbvec.append (capabilities.ids_with_bool "logseq.property/built-in?" true)
  |> Rrbvec.append (capabilities.ids_with_ref "block/tags" property_id)
  |> distinct_ids capabilities

let visible_entities capabilities ids =
  let excluded = excluded_ids capabilities in
  ids |> distinct_ids capabilities
  |> Rrbvec.filter_map (fun id ->
      if Rrbvec.exists (capabilities.equal_id id) excluded then None
      else
        match capabilities.entity id with
        | None -> invalid_arg "DB view entity selection: page entity is missing"
        | Some entity when capabilities.hidden entity -> None
        | Some entity -> Some entity)

let includes_refs_count sorting =
  Rrbvec.exists
    (fun sorting -> String.equal sorting.id "block.temp/refs-count")
    sorting

let all_pages_with capabilities ~sorting ~property_ident =
  capabilities.ids_with_attribute property_ident
  |> visible_entities capabilities
  |> fun entities ->
  if includes_refs_count sorting then
    Rrbvec.map
      (fun entity ->
        let id = capabilities.entity_id entity in
        capabilities.with_refs_count entity (capabilities.refs_count id))
      entities
  else entities

let fast_sort_ids =
  Rrbvec.of_array
    [| "block/updated-at"; "block/created-at"; "block/title"; "block/name" |]

let fast_all_page_ids_with capabilities ~sorting =
  if Rrbvec.length sorting <> 1 then None
  else
    let sorting = Rrbvec.nth sorting 0 in
    if not (Rrbvec.mem sorting.id fast_sort_ids) then None
    else
      let entities =
        capabilities.ids_with_attribute "block/name"
        |> visible_entities capabilities
      in
      let rows =
        entities
        |> Rrbvec.mapi (fun index entity ->
            ({
               View_order.index;
               keys =
                 Rrbvec.singleton (capabilities.sort_value entity sorting.id);
             }
              : View_order.row))
      in
      let direction = if sorting.ascending then View_order.Asc else Desc in
      let indices =
        View_order.sort_indices_with_missing_last rows
          (Rrbvec.singleton direction)
          (Rrbvec.singleton true)
      in
      Some
        (Rrbvec.map
           (fun index -> Rrbvec.nth entities index |> capabilities.entity_id)
           indices)

let required_target label = function
  | Some id -> id
  | None -> invalid_arg ("DB view entity selection: missing " ^ label)

let property_entities capabilities property_ident =
  capabilities.property_object_ids property_ident
  |> distinct_ids capabilities
  |> Rrbvec.filter_map (fun id ->
      match capabilities.entity id with
      | None ->
          invalid_arg "DB view entity selection: property object is missing"
      | Some entity when capabilities.hidden entity -> None
      | Some entity -> Some entity)

let select_with capabilities ~feature ~view_for_id ~property_ident ~sorting =
  match feature with
  | All_pages ->
      let property_ident = required "all-pages property ident" property_ident in
      Entities (all_pages_with capabilities ~sorting ~property_ident)
  | Class_objects ->
      let id = required_target "class target" view_for_id in
      Entities (capabilities.class_objects id)
  | Property_objects ->
      let property_ident = required "property target ident" property_ident in
      Entities (property_entities capabilities property_ident)
  | Linked_references ->
      let id = required_target "linked reference target" view_for_id in
      References (capabilities.linked_references id)
  | Unlinked_references ->
      let id = required_target "unlinked reference target" view_for_id in
      Entities
        (capabilities.unlinked_references id
        |> Option.value ~default:Rrbvec.empty)
  | Query_result -> Empty
