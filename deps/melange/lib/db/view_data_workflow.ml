type sorting = View_entity_selection.sorting = { id : string; ascending : bool }

type ('id, 'entity, 'value) view = {
  feature : View_entity_selection.feature;
  view_for_id : 'id option;
  property_ident : string option;
  group_property : 'entity option;
  group_ident : string option;
  list_view : bool;
  filters : 'value option;
  stored_sorting : sorting Rrbvec.t option;
  group_sort_ident : string;
  group_descending : bool;
}

type ('id, 'value) options = {
  journals : bool;
  view_for_id : 'id option;
  feature : View_entity_selection.feature option;
  group_ident : string option;
  input : string;
  query_entity_ids : 'id Rrbvec.t;
  query : 'value option;
  filters : 'value option;
  sorting : sorting Rrbvec.t option;
}

type ('id, 'uuid) parent_block = { id : 'id; parent_uuid : 'uuid option }

type ('id, 'uuid) parent_group = {
  uuid : 'uuid;
  blocks : ('id, 'uuid) parent_block Rrbvec.t;
}

type ('id, 'uuid) group_rows =
  | Group_ids of 'id Rrbvec.t
  | Parent_groups of ('id, 'uuid) parent_group Rrbvec.t

type ('value, 'id, 'uuid) group = {
  key : 'value;
  rows : ('id, 'uuid) group_rows;
}

type ('value, 'id, 'uuid) data =
  | Ids of 'id Rrbvec.t
  | Grouped of ('value, 'id, 'uuid) group Rrbvec.t

type ('value, 'id, 'label, 'uuid) result = {
  count : int;
  data : ('value, 'id, 'uuid) data;
  ref_page_counts : 'label View_entity_selection.page_count Rrbvec.t option;
  ref_matched_children_ids : 'id Rrbvec.t option;
  properties : 'value Rrbvec.t option;
}

type ('id, 'entity, 'value, 'label, 'uuid) capabilities = {
  entity : 'id -> 'entity option;
  entity_id : 'entity -> 'id;
  entity_uuid : 'entity -> 'uuid;
  equal_id : 'id -> 'id -> bool;
  page : 'entity -> 'entity option;
  parent : 'entity -> 'entity option;
  created_from_query : 'entity -> bool;
  latest_journals : unit -> 'entity Rrbvec.t;
  fast_all_page_ids : sorting Rrbvec.t -> 'id Rrbvec.t option;
  select :
    feature:View_entity_selection.feature ->
    view_for_id:'id option ->
    property_ident:string option ->
    sorting:sorting Rrbvec.t ->
    ('id, 'entity, 'label) View_entity_selection.selection;
  filter_entities :
    filters:'value option ->
    input:string ->
    'entity Rrbvec.t ->
    'entity Rrbvec.t;
  sort_entities :
    sorting:sorting Rrbvec.t -> 'entity Rrbvec.t -> 'entity Rrbvec.t;
  group_entities :
    property:'entity ->
    group_ident:string ->
    sort_ident:string ->
    descending:bool ->
    'entity Rrbvec.t ->
    ('value * 'entity Rrbvec.t) Rrbvec.t;
  project_group_key : 'value -> 'value;
  sort_by_order : 'entity Rrbvec.t -> 'entity Rrbvec.t;
  query_properties :
    query:'value -> entities:'entity Rrbvec.t -> 'value Rrbvec.t;
}

let default_sorting =
  Rrbvec.singleton ({ id = "block/updated-at"; ascending = false } : sorting)

let preferred first second = match first with Some _ -> first | None -> second

let effective_sorting view options =
  match view.stored_sorting with
  | Some sorting when not (Rrbvec.is_empty sorting) -> sorting
  | Some _ | None -> (
      match options.sorting with
      | Some sorting when not (Rrbvec.is_empty sorting) -> sorting
      | Some _ | None -> default_sorting)

let is_blank value = String.equal (String.trim value) ""

let distinct_ids capabilities ids =
  Rrbvec.fold_left
    (fun result id ->
      if Rrbvec.exists (capabilities.equal_id id) result then result
      else Rrbvec.push_back result id)
    Rrbvec.empty ids

let flat_result ?ref_page_counts ?ref_matched_children_ids ?properties ~count
    ids =
  {
    count;
    data = Ids ids;
    ref_page_counts;
    ref_matched_children_ids;
    properties;
  }

let required_entity capabilities id = capabilities.entity id

let query_entities capabilities ids =
  ids
  |> Rrbvec.filter_map (required_entity capabilities)
  |> Rrbvec.filter (fun entity -> not (capabilities.created_from_query entity))

type ('id, 'entity) parent_bucket = {
  parent : 'entity option;
  entities : 'entity Rrbvec.t;
}

let same_parent (capabilities : (_, _, _, _, _) capabilities) left right =
  match (left, right) with
  | None, None -> true
  | Some left, Some right ->
      capabilities.equal_id
        (capabilities.entity_id left)
        (capabilities.entity_id right)
  | None, Some _ | Some _, None -> false

let parent_buckets (capabilities : (_, _, _, _, _) capabilities) entities =
  Rrbvec.fold_left
    (fun buckets entity ->
      let parent = capabilities.parent entity in
      match
        Rrbvec.find_opt
          (fun bucket -> same_parent capabilities bucket.parent parent)
          buckets
      with
      | None ->
          Rrbvec.push_back buckets
            { parent; entities = Rrbvec.singleton entity }
      | Some existing ->
          Rrbvec.map
            (fun bucket ->
              if same_parent capabilities bucket.parent parent then
                {
                  bucket with
                  entities = Rrbvec.push_back existing.entities entity;
                }
              else bucket)
            buckets)
    Rrbvec.empty entities

let sort_parent_buckets (capabilities : (_, _, _, _, _) capabilities) buckets =
  let without_parent, with_parent =
    Rrbvec.fold_left
      (fun (without_parent, with_parent) bucket ->
        match bucket.parent with
        | None -> (Rrbvec.push_back without_parent bucket, with_parent)
        | Some parent ->
            (without_parent, Rrbvec.push_back with_parent (parent, bucket)))
      (Rrbvec.empty, Rrbvec.empty)
      buckets
  in
  let sorted_parents =
    capabilities.sort_entities
      ~sorting:(Rrbvec.singleton { id = "block/order"; ascending = true })
      (Rrbvec.map fst with_parent)
  in
  let sorted =
    Rrbvec.filter_map
      (fun parent ->
        Rrbvec.find_opt
          (fun (candidate, _) ->
            capabilities.equal_id
              (capabilities.entity_id candidate)
              (capabilities.entity_id parent))
          with_parent
        |> Option.map snd)
      sorted_parents
  in
  Rrbvec.append without_parent sorted

let parent_groups (capabilities : (_, _, _, _, _) capabilities) entities =
  entities
  |> parent_buckets capabilities
  |> sort_parent_buckets capabilities
  |> Rrbvec.map (fun bucket ->
      let first = Rrbvec.nth bucket.entities 0 in
      let blocks =
        bucket.entities |> capabilities.sort_by_order
        |> Rrbvec.map (fun entity ->
            let parent_uuid =
              capabilities.parent entity |> Option.map capabilities.entity_uuid
            in
            { id = capabilities.entity_id entity; parent_uuid })
      in
      { uuid = capabilities.entity_uuid first; blocks })

let grouped_data (capabilities : (_, _, _, _, _) capabilities) view ~group_ident
    ~sorting entities =
  let property =
    match view.group_property with
    | Some property -> property
    | None -> invalid_arg "DB view data workflow: group property is missing"
  in
  capabilities.group_entities ~property ~group_ident
    ~sort_ident:view.group_sort_ident ~descending:view.group_descending entities
  |> Rrbvec.map (fun (key, entities) ->
      let has_block_page =
        Rrbvec.exists (fun row -> capabilities.page row <> None) entities
      in
      let rows =
        if view.list_view && has_block_page then
          Parent_groups (parent_groups capabilities entities)
        else
          Group_ids
            (capabilities.sort_entities ~sorting entities
            |> Rrbvec.map capabilities.entity_id)
      in
      { key = capabilities.project_group_key key; rows })

let selection_entities = function
  | View_entity_selection.Entities entities -> (entities, None, None)
  | References result ->
      (result.blocks, result.page_counts, result.matched_children_ids)
  | Empty -> (Rrbvec.empty, None, None)

let get_with (capabilities : (_, _, _, _, _) capabilities)
    ~(view : (_, _, _) view) ~(options : (_, _) options) =
  if options.journals then
    let journals = capabilities.latest_journals () in
    journals
    |> Rrbvec.map capabilities.entity_id
    |> flat_result ~count:(Rrbvec.length journals)
  else
    let feature = Option.value options.feature ~default:view.feature in
    let query = feature = View_entity_selection.Query_result in
    let view_for_id = preferred view.view_for_id options.view_for_id in
    let group_ident = preferred view.group_ident options.group_ident in
    let filters = preferred view.filters options.filters in
    let sorting = effective_sorting view options in
    let fast_eligible =
      feature = View_entity_selection.All_pages
      && (not query) && group_ident = None && filters = None
      && is_blank options.input
    in
    match
      if fast_eligible then capabilities.fast_all_page_ids sorting else None
    with
    | Some ids -> flat_result ~count:(Rrbvec.length ids) ids
    | None ->
        let selection =
          if query then View_entity_selection.Empty
          else
            capabilities.select ~feature ~view_for_id
              ~property_ident:view.property_ident ~sorting
        in
        let entities, ref_page_counts, ref_matched_children_ids =
          if query then
            (query_entities capabilities options.query_entity_ids, None, None)
          else selection_entities selection
        in
        let filtered =
          if filters <> None || not (is_blank options.input) then
            capabilities.filter_entities ~filters ~input:options.input entities
          else entities
        in
        let count = Rrbvec.length filtered in
        let data =
          match group_ident with
          | Some group_ident ->
              Grouped
                (grouped_data capabilities view ~group_ident ~sorting filtered)
          | None ->
              let ids =
                capabilities.sort_entities ~sorting filtered
                |> Rrbvec.map capabilities.entity_id
              in
              let ids =
                if query || feature = View_entity_selection.Property_objects
                then distinct_ids capabilities ids
                else ids
              in
              Ids ids
        in
        let properties =
          match data with
          | Ids _ | Grouped _ ->
              if query then
                let query =
                  match options.query with
                  | Some query -> query
                  | None ->
                      invalid_arg "DB view data workflow: query is missing"
                in
                Some (capabilities.query_properties ~query ~entities)
              else None
        in
        { count; data; ref_page_counts; ref_matched_children_ids; properties }
