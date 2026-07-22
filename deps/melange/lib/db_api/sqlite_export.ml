module Domain = Melange_db.Sqlite_export

let pageSortKey title journal uuid =
  Domain.page_sort_key
    ~title:(Js.Nullable.toOption title)
    ~journal:(Js.Nullable.toOption journal)
    ~uuid

let keepUuid referenced unique_attributes =
  Domain.keep_uuid ~referenced ~unique_attributes

let excludedKv = Domain.excluded_kv
let excludedKvs = Rrbvec.to_array Domain.excluded_kvs
let excludedAttribute = Domain.excluded_attribute

let exportableDatom excluded_entity attribute =
  Domain.exportable_datom ~excluded_entity ~attribute

let includeKvInDiff = Domain.include_kv_in_diff

let sortPagesWith runtime pages =
  let field value name =
    Support.Runtime_codec.map_get runtime value
      (Support.Runtime_codec.keyword_from_string runtime name)
  in
  let page value = field value "page" in
  let optional convert value =
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some (convert value)
  in
  pages
  |> Support.Runtime_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.sort_pages
       ~title:(fun value ->
         field (page value) "block/title"
         |> optional (Support.Runtime_codec.string_from_value runtime))
       ~journal:(fun value ->
         field (page value) "build/journal"
         |> optional (Support.Runtime_codec.int_from_value runtime))
       ~uuid:(fun value ->
         field (page value) "block/uuid"
         |> Support.Runtime_codec.value_to_string runtime)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_vector runtime

let importTransactionDataWith runtime transactions =
  let group name =
    let value =
      Support.Runtime_codec.map_get runtime transactions
        (Support.Runtime_codec.keyword_from_string runtime name)
    in
    if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
    else
      Support.Runtime_codec.collection_to_array runtime value
      |> Rrbvec.of_array
  in
  Domain.import_transaction_data ~init:(group "init-tx")
    ~block_properties:(group "block-props-tx") ~misc:(group "misc-tx")
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_vector runtime

let graphDatomsWith runtime datascript database schema_version =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let entity_id entity =
    let id =
      Support.Datascript.entity_get datascript entity (keyword "db/id")
    in
    if Support.Runtime_codec.value_is_nil runtime id then None else Some id
  in
  let resolve_entity lookup =
    match
      Support.Datascript.entity datascript database lookup
      |> Js.Nullable.toOption
    with
    | None -> None
    | Some entity -> entity_id entity
  in
  let capabilities :
      ( Support.Datascript.database,
        Support.Runtime_codec.cljs_value,
        Support.Datascript.datom,
        Support.Runtime_codec.cljs_value )
      Domain.datom_capabilities =
    {
      excluded_entity = (fun _ ident -> ident |> keyword |> resolve_entity);
      datoms =
        (fun database ->
          Support.Datascript.datoms datascript database (keyword "eavt") [||]);
      datom_entity = Support.Datascript.datom_entity datascript;
      datom_attribute = Support.Datascript.datom_attribute datascript;
      datom_value = Support.Datascript.datom_value datascript;
      attribute_name = Support.Runtime_codec.keyword_to_string runtime;
      lookup_ref =
        (fun value ->
          if not (Support.Runtime_codec.value_is_vector runtime value) then
            false
          else
            match Support.Runtime_codec.vector_to_array runtime value with
            | [| attribute; _ |] ->
                Support.Runtime_codec.value_is_keyword runtime attribute
            | _ -> false);
      resolve_lookup = (fun _ lookup -> resolve_entity lookup);
      equal_entity = Support.Runtime_codec.value_equals runtime;
      entity_order = Support.Runtime_codec.int_from_value runtime;
    }
  in
  let datoms =
    Domain.graph_datoms capabilities database
    |> Rrbvec.map (fun (datom : (_, _) Domain.export_datom) ->
        Support.Runtime_codec.array_to_vector runtime
          [| datom.entity; datom.attribute; datom.value |])
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  Support.Runtime_codec.entries_to_map runtime
    [|
      [|
        keyword "logseq.db.sqlite.export/schema-version";
        Support.Runtime_codec.string_to_value runtime schema_version;
      |];
      [| keyword "logseq.db.sqlite.export/graph-format"; keyword "datoms" |];
      [| keyword "datoms"; datoms |];
    |]

let datomImportWith runtime datascript database export_map =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let imported =
    Support.Runtime_codec.map_get runtime export_map (keyword "datoms")
    |> Support.Runtime_codec.collection_to_array runtime
    |> Array.map (fun value ->
        match Support.Runtime_codec.vector_to_array runtime value with
        | [| entity; attribute; value |] ->
            {
              Domain.import_entity =
                Support.Runtime_codec.int_from_value runtime entity;
              import_attribute = attribute;
              import_value = value;
            }
        | _ -> invalid_arg "DB SQLite datom import expects [e a v] tuples")
    |> Rrbvec.of_array
  in
  let capabilities :
      ( Support.Datascript.database,
        Support.Runtime_codec.cljs_value )
      Domain.import_capabilities =
    {
      current_entity_ids =
        (fun database ->
          Support.Datascript.datoms datascript database (keyword "eavt") [||]
          |> Array.map (fun datom ->
              Support.Datascript.datom_entity datascript datom
              |> Support.Runtime_codec.int_from_value runtime));
      attribute_name = Support.Runtime_codec.keyword_to_string runtime;
      value_key = Support.Runtime_codec.value_to_string runtime;
      entity_value = Support.Runtime_codec.int_to_value runtime;
      lookup_ref =
        (fun value ->
          if not (Support.Runtime_codec.value_is_vector runtime value) then
            None
          else
            match Support.Runtime_codec.vector_to_array runtime value with
            | [| attribute; lookup_value |] -> Some (attribute, lookup_value)
            | _ -> None);
    }
  in
  let init_transactions =
    Domain.datom_import capabilities database imported
    |> Rrbvec.map (function
      | Domain.Retract_entity entity ->
          Support.Runtime_codec.array_to_vector runtime
            [|
              keyword "db/retractEntity";
              Support.Runtime_codec.int_to_value runtime entity;
            |]
      | Domain.Add (entity, attribute, value) ->
          Support.Runtime_codec.array_to_vector runtime
            [|
              keyword "db/add";
              Support.Runtime_codec.int_to_value runtime entity;
              attribute;
              value;
            |])
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  let empty = Support.Runtime_codec.array_to_vector runtime [||] in
  Support.Runtime_codec.entries_to_map runtime
    [|
      [| keyword "init-tx"; init_transactions |];
      [| keyword "block-props-tx"; empty |];
      [| keyword "misc-tx"; empty |];
    |]
