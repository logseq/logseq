module Domain = Melange_db.Initial_data_workflow
module Projection = Melange_db.Initial_projection

type encoded_result = {
  schema : Melange_datascript_spec.Api.schema;
  initialData : Melange_datascript_spec.Api.datom array;
}

let projection_capabilities runtime datascript =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  let field value name =
    Melange_datascript_spec.Api.entity_get datascript value (keyword name)
  in
  let values value =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then [||]
    else Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
  in
  let entry_name value =
    if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value then
      Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
    else Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
  in
  let entries value =
    Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime value
    |> Array.map (fun entry -> (entry_name entry.(0), entry.(1)))
  in
  let map entries =
    entries
    |> Array.map (fun (name, value) -> [| keyword name; value |])
    |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
  in
  let collection value =
    Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime value
    || Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value
    || Melange_cljs_runtime_spec.Value_codec.value_is_sequential runtime value
    || Melange_cljs_runtime_spec.Value_codec.value_is_map runtime value
  in
  ({
     field;
     entries;
     map;
     assoc =
       (fun value name entry ->
         Melange_cljs_runtime_spec.Value_codec.map_assoc runtime value
           (keyword name) entry);
     nil = Melange_cljs_runtime_spec.Value_codec.nil_value runtime;
     is_nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
     truthy = Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
     entity = Melange_datascript_spec.Api.entity_is datascript;
     values;
     entity_values =
       (fun value ->
         if not (collection value) then None
         else
           let entries = values value in
           if
             Array.for_all
               (Melange_datascript_spec.Api.entity_is datascript)
               entries
           then Some entries
           else None);
     sequence = Melange_cljs_runtime_spec.Value_codec.array_to_list runtime;
     lookup_entity =
       (fun database lookup ->
         Melange_datascript_spec.Api.entity datascript database lookup
         |> Js.Nullable.toOption);
     pull_all = Melange_datascript_spec.Api.pull_all datascript;
     uuid_lookup =
       (fun value ->
         [| keyword "block/uuid"; value |]
         |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime);
     oldest_page_by_name =
       (fun database name ->
         Initial_read.oldestPageByName runtime datascript database name
         |> Js.Nullable.toOption
         |> Option.map
              (Melange_cljs_runtime_spec.Value_codec.int_to_value runtime));
     children_ids =
       (fun database id include_collapsed ->
         Initial_read.childrenIdsWith runtime datascript database id
           include_collapsed
         |> Js.Nullable.toOption
         |> Option.map
              (Array.map
                 (Melange_cljs_runtime_spec.Value_codec.int_to_value runtime)));
     block_refs_count = Initial_read.blockRefsCountWith runtime datascript;
     has_children =
       (fun database id ->
         Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
           [| keyword "block/parent"; id |]
         |> Array.length |> ( < ) 0);
     equal = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
     bool = Melange_cljs_runtime_spec.Value_codec.bool_to_value runtime;
     int = Melange_cljs_runtime_spec.Value_codec.int_to_value runtime;
     keyword;
   }
    : ( Melange_datascript_spec.Api.database,
        Melange_cljs_runtime_spec.Value_codec.cljs_value )
      Projection.capabilities)

let projection_properties runtime properties =
  Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime properties
  |> Array.map (fun value ->
      if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value
      then Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
      else Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value)
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
    if Melange_cljs_runtime_spec.Value_codec.value_is_uuid runtime lookup then
      Projection.Uuid lookup
    else if
      Melange_cljs_runtime_spec.Value_codec.value_is_integer runtime lookup
    then Id lookup
    else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime lookup
    then
      Page_name
        (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime lookup)
    else Missing
  in
  Projection.block_and_children
    (projection_capabilities runtime datascript)
    database lookup ~children ~include_collapsed
    ~properties:(projection_properties runtime properties)
  |> Js.Nullable.fromOption

let getWith runtime datascript database =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  let field entity name =
    Melange_datascript_spec.Api.entity_get datascript entity (keyword name)
  in
  let optional_entity value =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else Some value
  in
  let oldest lookup database name =
    lookup runtime datascript database name
    |> Js.Nullable.toOption
    |> Option.map (Melange_cljs_runtime_spec.Value_codec.int_to_value runtime)
  in
  let capabilities :
      ( Melange_datascript_spec.Api.database,
        Melange_datascript_spec.Api.schema,
        Melange_datascript_spec.Api.entity,
        Melange_cljs_runtime_spec.Value_codec.cljs_value,
        Melange_datascript_spec.Api.datom )
      Domain.capabilities =
    {
      schema = Melange_datascript_spec.Api.database_schema datascript;
      max_order =
        (fun database ->
          let value = Order.maxOrderWith runtime datascript database in
          if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value
          then None
          else
            Some
              (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
                 value));
      reset_max_order =
        Melange_db.Order.reset_state Melange_db.Order.default_state;
      entity_by_ident =
        (fun database ident ->
          Melange_datascript_spec.Api.entity datascript database (keyword ident)
          |> Js.Nullable.toOption);
      entity_by_id =
        (fun database id ->
          Melange_datascript_spec.Api.entity datascript database id
          |> Js.Nullable.toOption);
      entity_id = (fun entity -> field entity "db/id");
      entity_ref =
        (fun entity attribute -> field entity attribute |> optional_entity);
      entity_refs =
        (fun entity attribute ->
          field entity attribute
          |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime);
      resolve_ident = keyword;
      attribute_datoms =
        (fun database attribute ->
          Melange_datascript_spec.Api.datoms datascript database
            (keyword "avet")
            [| keyword attribute |]);
      attribute_value_datoms =
        (fun database attribute value ->
          Melange_datascript_spec.Api.datoms datascript database
            (keyword "avet")
            [| keyword attribute; value |]);
      entity_datoms =
        (fun database id ->
          Melange_datascript_spec.Api.datoms datascript database
            (keyword "eavt") [| id |]);
      datom_entity = Melange_datascript_spec.Api.datom_entity datascript;
      datom_attribute =
        (fun datom ->
          Melange_datascript_spec.Api.datom_attribute datascript datom
          |> Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime);
      datom_value = Melange_datascript_spec.Api.datom_value datascript;
      equal_value = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
      equal_datom = Melange_datascript_spec.Api.datom_equals datascript;
      oldest_page_by_name = oldest Initial_read.oldestPageByName;
      oldest_page_by_title = oldest Initial_read.oldestPageByTitle;
      built_in_page =
        (fun database title ->
          let uuid =
            Melange_common.Uuid.builtin_block title
            |> Melange_cljs_runtime_spec.Value_codec.uuid_from_string runtime
          in
          let lookup =
            [| keyword "block/uuid"; uuid |]
            |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
          in
          Melange_datascript_spec.Api.entity datascript database lookup
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
