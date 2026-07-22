module Domain = Melange_db.Initial_data_workflow
module Projection = Melange_db.Initial_projection

type encoded_result = {
  schema : Support.Datascript.schema;
  initialData : Support.Datascript.datom array;
}

let projection_capabilities runtime datascript =
  let keyword name =
    Support.Runtime_codec.keyword_from_string runtime name
  in
  let field value name =
    Support.Datascript.entity_get datascript value (keyword name)
  in
  let values value =
    if Support.Runtime_codec.value_is_nil runtime value then [||]
    else Support.Runtime_codec.collection_to_array runtime value
  in
  let entry_name value =
    if Support.Runtime_codec.value_is_keyword runtime value then
      Support.Runtime_codec.keyword_to_string runtime value
    else Support.Runtime_codec.string_from_value runtime value
  in
  let entries value =
    Support.Runtime_codec.map_to_entries runtime value
    |> Array.map (fun entry -> (entry_name entry.(0), entry.(1)))
  in
  let map entries =
    entries
    |> Array.map (fun (name, value) -> [| keyword name; value |])
    |> Support.Runtime_codec.entries_to_map runtime
  in
  let collection value =
    Support.Runtime_codec.value_is_vector runtime value
    || Support.Runtime_codec.value_is_set runtime value
    || Support.Runtime_codec.value_is_sequential runtime value
    || Support.Runtime_codec.value_is_map runtime value
  in
  ({
     field;
     entries;
     map;
     assoc =
       (fun value name entry ->
         Support.Runtime_codec.map_assoc runtime value (keyword name) entry);
     nil = Support.Runtime_codec.nil_value runtime;
     is_nil = Support.Runtime_codec.value_is_nil runtime;
     truthy = Support.Runtime_codec.value_truthy runtime;
     entity = Support.Datascript.entity_is datascript;
     values;
     entity_values =
       (fun value ->
         if not (collection value) then None
         else
           let entries = values value in
           if
             Array.for_all (Support.Datascript.entity_is datascript) entries
           then Some entries
           else None);
     sequence = Support.Runtime_codec.array_to_list runtime;
     lookup_entity =
       (fun database lookup ->
         Support.Datascript.entity datascript database lookup
         |> Js.Nullable.toOption);
     pull_all = Support.Datascript.pull_all datascript;
     uuid_lookup =
       (fun value ->
         [| keyword "block/uuid"; value |]
         |> Support.Runtime_codec.array_to_vector runtime);
     oldest_page_by_name =
       (fun database name ->
         Initial_read.oldestPageByName runtime datascript database name
         |> Js.Nullable.toOption
         |> Option.map (Support.Runtime_codec.int_to_value runtime));
     children_ids =
       (fun database id include_collapsed ->
         Initial_read.childrenIdsWith runtime datascript database id
           include_collapsed
         |> Js.Nullable.toOption
         |> Option.map
              (Array.map (Support.Runtime_codec.int_to_value runtime)));
     block_refs_count = Initial_read.blockRefsCountWith runtime datascript;
     has_children =
       (fun database id ->
         Support.Datascript.datoms datascript database (keyword "avet")
           [| keyword "block/parent"; id |]
         |> Array.length |> ( < ) 0);
     equal = Support.Runtime_codec.value_equals runtime;
     bool = Support.Runtime_codec.bool_to_value runtime;
     int = Support.Runtime_codec.int_to_value runtime;
     keyword;
   }
    : ( Support.Datascript.database,
        Support.Runtime_codec.cljs_value )
      Projection.capabilities)

let projection_properties runtime properties =
  Support.Runtime_codec.collection_to_array runtime properties
  |> Array.map (fun value ->
      if Support.Runtime_codec.value_is_keyword runtime value then
        Support.Runtime_codec.keyword_to_string runtime value
      else Support.Runtime_codec.string_from_value runtime value)
  |> Rrbvec.of_array

let entityToMapWith runtime datascript entity properties =
  Projection.entity_to_map
    (projection_capabilities runtime datascript)
    ~properties:(projection_properties runtime properties)
    entity

let withParentWith runtime datascript database block =
  Projection.with_parent
    (projection_capabilities runtime datascript)
    database block

let blockAndChildrenWith runtime datascript database lookup children properties
    include_collapsed =
  let lookup =
    if Support.Runtime_codec.value_is_uuid runtime lookup then
      Projection.Uuid lookup
    else if Support.Runtime_codec.value_is_integer runtime lookup then
      Id lookup
    else if Support.Runtime_codec.value_is_string runtime lookup then
      Page_name (Support.Runtime_codec.string_from_value runtime lookup)
    else Missing
  in
  Projection.block_and_children
    (projection_capabilities runtime datascript)
    database lookup ~children ~include_collapsed
    ~properties:(projection_properties runtime properties)
  |> Js.Nullable.fromOption

let getWith runtime datascript database =
  let keyword name =
    Support.Runtime_codec.keyword_from_string runtime name
  in
  let field entity name =
    Support.Datascript.entity_get datascript entity (keyword name)
  in
  let optional_entity value =
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some value
  in
  let oldest lookup database name =
    lookup runtime datascript database name
    |> Js.Nullable.toOption
    |> Option.map (Support.Runtime_codec.int_to_value runtime)
  in
  let capabilities :
      ( Support.Datascript.database,
        Support.Datascript.schema,
        Support.Datascript.entity,
        Support.Runtime_codec.cljs_value,
        Support.Datascript.datom )
      Domain.capabilities =
    {
      schema = Support.Datascript.database_schema datascript;
      max_order =
        (fun database ->
          let value = Order.maxOrderWith runtime datascript database in
          if Support.Runtime_codec.value_is_nil runtime value then None
          else Some (Support.Runtime_codec.string_from_value runtime value));
      reset_max_order =
        Melange_db.Order.reset_state Melange_db.Order.default_state;
      entity_by_ident =
        (fun database ident ->
          Support.Datascript.entity datascript database (keyword ident)
          |> Js.Nullable.toOption);
      entity_by_id =
        (fun database id ->
          Support.Datascript.entity datascript database id
          |> Js.Nullable.toOption);
      entity_id = (fun entity -> field entity "db/id");
      entity_ref =
        (fun entity attribute -> field entity attribute |> optional_entity);
      entity_refs =
        (fun entity attribute ->
          field entity attribute
          |> Support.Runtime_codec.collection_to_array runtime);
      resolve_ident = keyword;
      attribute_datoms =
        (fun database attribute ->
          Support.Datascript.datoms datascript database (keyword "avet")
            [| keyword attribute |]);
      attribute_value_datoms =
        (fun database attribute value ->
          Support.Datascript.datoms datascript database (keyword "avet")
            [| keyword attribute; value |]);
      entity_datoms =
        (fun database id ->
          Support.Datascript.datoms datascript database (keyword "eavt")
            [| id |]);
      datom_entity = Support.Datascript.datom_entity datascript;
      datom_attribute =
        (fun datom ->
          Support.Datascript.datom_attribute datascript datom
          |> Support.Runtime_codec.keyword_to_string runtime);
      datom_value = Support.Datascript.datom_value datascript;
      equal_value = Support.Runtime_codec.value_equals runtime;
      equal_datom = Support.Datascript.datom_equals datascript;
      oldest_page_by_name = oldest Initial_read.oldestPageByName;
      oldest_page_by_title = oldest Initial_read.oldestPageByTitle;
      built_in_page =
        (fun database title ->
          let uuid =
            Melange_common.Uuid.builtin_block title
            |> Support.Runtime_codec.uuid_from_string runtime
          in
          let lookup =
            [| keyword "block/uuid"; uuid |]
            |> Support.Runtime_codec.array_to_vector runtime
          in
          Support.Datascript.entity datascript database lookup
          |> Js.Nullable.toOption);
      recent_pages = Initial_read.recentPagesWith runtime datascript;
    }
  in
  let names : Domain.page_names =
    {
      favorites = Melange_common.Config.favorites_page_name;
      contents = "Contents";
      quick_add = Melange_common.Config.quick_add_page_name;
      views = Melange_common.Config.views_page_name;
      recycle = Melange_common.Config.recycle_page_name;
    }
  in
  let result = Domain.get_with capabilities names database in
  { schema = result.schema; initialData = result.initial_data }
