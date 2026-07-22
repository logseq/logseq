type page_names = {
  favorites : string;
  contents : string;
  quick_add : string;
  views : string;
  recycle : string;
}

type ('database, 'schema, 'entity, 'value, 'datom) capabilities = {
  schema : 'database -> 'schema;
  max_order : 'database -> string option;
  reset_max_order : string option -> unit;
  entity_by_ident : 'database -> string -> 'entity option;
  entity_by_id : 'database -> 'value -> 'entity option;
  entity_id : 'entity -> 'value;
  entity_ref : 'entity -> string -> 'entity option;
  entity_refs : 'entity -> string -> 'entity array;
  resolve_ident : string -> 'value;
  attribute_datoms : 'database -> string -> 'datom array;
  attribute_value_datoms : 'database -> string -> 'value -> 'datom array;
  entity_datoms : 'database -> 'value -> 'datom array;
  datom_entity : 'datom -> 'value;
  datom_attribute : 'datom -> string;
  datom_value : 'datom -> 'value;
  equal_value : 'value -> 'value -> bool;
  equal_datom : 'datom -> 'datom -> bool;
  oldest_page_by_name : 'database -> string -> 'value option;
  oldest_page_by_title : 'database -> string -> 'value option;
  built_in_page : 'database -> string -> 'entity option;
  recent_pages : 'database -> 'entity array;
}

type ('schema, 'datom) result = {
  schema : 'schema;
  initial_data : 'datom array;
}

let required label = function
  | Some value -> value
  | None -> invalid_arg ("DB initial data: missing " ^ label)

let append values result = Rrbvec.append result values
let append_array array result = append (Rrbvec.of_array array) result
let push_back value result = Rrbvec.push_back result value

let datoms_for_entities capabilities database entities =
  entities
  |> Rrbvec.concat_map (fun entity ->
      capabilities.entity_datoms database (capabilities.entity_id entity)
      |> Rrbvec.of_array)

let datoms_for_ids capabilities database ids =
  ids
  |> Rrbvec.concat_map (fun id ->
      capabilities.entity_datoms database id |> Rrbvec.of_array)

let ident_names =
  Rrbvec.of_array
    [|
      "logseq.kv/db-type";
      "logseq.kv/schema-version";
      "logseq.kv/graph-uuid";
      "logseq.kv/local-graph-uuid";
      "logseq.kv/graph-rtc-e2ee?";
      "logseq.kv/graph-remote?";
      "logseq.kv/latest-code-lang";
      "logseq.kv/graph-backup-folder";
      "logseq.property/empty-placeholder";
    |]

let ident_datoms capabilities database =
  ident_names
  |> Rrbvec.filter_map (capabilities.entity_by_ident database)
  |> datoms_for_entities capabilities database

let structured_datoms capabilities database =
  let property_class =
    capabilities.entity_by_ident database "logseq.class/Property"
    |> required "Property class"
  in
  let property_id = capabilities.entity_id property_class in
  let tagged attribute ident =
    capabilities.attribute_value_datoms database attribute
      (capabilities.resolve_ident ident)
    |> Rrbvec.of_array
  in
  Rrbvec.empty
  |> append (tagged "block/tags" "logseq.class/Tag")
  |> append (tagged "block/tags" "logseq.class/Property")
  |> append_array
       (capabilities.attribute_datoms database "block/closed-value-property")
  |> Rrbvec.concat_map (fun datom ->
      let entity_id = capabilities.datom_entity datom in
      let entity_datoms =
        capabilities.entity_datoms database entity_id |> Rrbvec.of_array
      in
      if
        not
          (capabilities.equal_value
             (capabilities.datom_value datom)
             property_id)
      then entity_datoms
      else
        let entity =
          capabilities.entity_by_id database entity_id
          |> required "Property entity"
        in
        match capabilities.entity_ref entity "logseq.property/description" with
        | None -> entity_datoms
        | Some description ->
            Rrbvec.append entity_datoms
              (capabilities.entity_datoms database
                 (capabilities.entity_id description)
              |> Rrbvec.of_array))

let user_datoms capabilities database =
  match capabilities.entity_by_ident database "logseq.property.user/email" with
  | None -> Rrbvec.empty
  | Some _ ->
      capabilities.attribute_datoms database "logseq.property.user/email"
      |> Rrbvec.of_array
      |> Rrbvec.map capabilities.datom_entity
      |> datoms_for_ids capabilities database

let distinct_values capabilities values =
  Rrbvec.fold_left
    (fun result value ->
      if Rrbvec.exists (capabilities.equal_value value) result then result
      else Rrbvec.push_back result value)
    Rrbvec.empty values

let list_style_datoms capabilities database =
  capabilities.attribute_datoms database "logseq.property/order-list-type"
  |> Rrbvec.of_array
  |> Rrbvec.map capabilities.datom_value
  |> distinct_values capabilities
  |> datoms_for_ids capabilities database

let favorites_datoms capabilities names database =
  match capabilities.oldest_page_by_name database names.favorites with
  | None -> Rrbvec.empty
  | Some page_id ->
      let page =
        capabilities.entity_by_id database page_id |> required "Favorites page"
      in
      let children =
        capabilities.entity_refs page "block/_page" |> Rrbvec.of_array
      in
      let linked =
        children
        |> Rrbvec.filter_map (fun child ->
            capabilities.entity_ref child "block/link")
        |> datoms_for_entities capabilities database
      in
      capabilities.entity_datoms database page_id
      |> Rrbvec.of_array |> append linked
      |> append (datoms_for_entities capabilities database children)

let recent_datoms capabilities database =
  capabilities.recent_pages database
  |> Rrbvec.of_array
  |> datoms_for_entities capabilities database

let file_datoms capabilities database =
  capabilities.attribute_datoms database "file/path"
  |> Rrbvec.of_array
  |> Rrbvec.map capabilities.datom_entity
  |> datoms_for_ids capabilities database

let page_datoms capabilities names database =
  Rrbvec.empty
  |> push_back (capabilities.oldest_page_by_title database names.contents)
  |> push_back
       (capabilities.built_in_page database names.quick_add
       |> Option.map capabilities.entity_id)
  |> push_back (capabilities.oldest_page_by_title database names.views)
  |> push_back (capabilities.oldest_page_by_title database names.recycle)
  |> Rrbvec.filter_map Fun.id
  |> datoms_for_ids capabilities database

let distinct_datoms capabilities values =
  Rrbvec.fold_left
    (fun result datom ->
      if Rrbvec.exists (capabilities.equal_datom datom) result then result
      else Rrbvec.push_back result datom)
    Rrbvec.empty values

let get_with capabilities names database =
  capabilities.reset_max_order (capabilities.max_order database);
  let schema = capabilities.schema database in
  let initial_data =
    Rrbvec.empty
    |> append (ident_datoms capabilities database)
    |> append (structured_datoms capabilities database)
    |> append (user_datoms capabilities database)
    |> append (list_style_datoms capabilities database)
    |> append (favorites_datoms capabilities names database)
    |> append (recent_datoms capabilities database)
    |> append (file_datoms capabilities database)
    |> append (page_datoms capabilities names database)
    |> distinct_datoms capabilities
    |> Rrbvec.filter (fun datom ->
        Initial_read.include_initial_attribute
          (capabilities.datom_attribute datom))
    |> Rrbvec.to_array
  in
  { schema; initial_data }
