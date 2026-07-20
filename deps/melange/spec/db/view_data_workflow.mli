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

val get_with :
  ('id, 'entity, 'value, 'label, 'uuid) capabilities ->
  view:('id, 'entity, 'value) view ->
  options:('id, 'value) options ->
  ('value, 'id, 'label, 'uuid) result
