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
    Melange_cljs_runtime_spec.Value_codec.map_get runtime value
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)
  in
  let page value = field value "page" in
  let optional convert value =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else Some (convert value)
  in
  pages
  |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.sort_pages
       ~title:(fun value ->
         field (page value) "block/title"
         |> optional
              (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime))
       ~journal:(fun value ->
         field (page value) "build/journal"
         |> optional
              (Melange_cljs_runtime_spec.Value_codec.int_from_value runtime))
       ~uuid:(fun value ->
         field (page value) "block/uuid"
         |> Melange_cljs_runtime_spec.Value_codec.value_to_string runtime)
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime

let importTransactionDataWith runtime transactions =
  let group name =
    let value =
      Melange_cljs_runtime_spec.Value_codec.map_get runtime transactions
        (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)
    in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      Rrbvec.empty
    else
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
      |> Rrbvec.of_array
  in
  Domain.import_transaction_data ~init:(group "init-tx")
    ~block_properties:(group "block-props-tx") ~misc:(group "misc-tx")
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime

let graphDatomsWith runtime datascript database schema_version =
  let keyword =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  in
  let entity_id entity =
    let id =
      Melange_datascript_spec.Api.entity_get datascript entity (keyword "db/id")
    in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime id then None
    else Some id
  in
  let resolve_entity lookup =
    match
      Melange_datascript_spec.Api.entity datascript database lookup
      |> Js.Nullable.toOption
    with
    | None -> None
    | Some entity -> entity_id entity
  in
  let capabilities :
      ( Melange_datascript_spec.Api.database,
        Melange_cljs_runtime_spec.Value_codec.cljs_value,
        Melange_datascript_spec.Api.datom,
        Melange_cljs_runtime_spec.Value_codec.cljs_value )
      Domain.datom_capabilities =
    {
      excluded_entity = (fun _ ident -> ident |> keyword |> resolve_entity);
      datoms =
        (fun database ->
          Melange_datascript_spec.Api.datoms datascript database
            (keyword "eavt") [||]);
      datom_entity = Melange_datascript_spec.Api.datom_entity datascript;
      datom_attribute = Melange_datascript_spec.Api.datom_attribute datascript;
      datom_value = Melange_datascript_spec.Api.datom_value datascript;
      attribute_name =
        Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime;
      lookup_ref =
        (fun value ->
          if
            not
              (Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime
                 value)
          then false
          else
            match
              Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime
                value
            with
            | [| attribute; _ |] ->
                Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime
                  attribute
            | _ -> false);
      resolve_lookup = (fun _ lookup -> resolve_entity lookup);
      equal_entity = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
      entity_order =
        Melange_cljs_runtime_spec.Value_codec.int_from_value runtime;
    }
  in
  let datoms =
    Domain.graph_datoms capabilities database
    |> Rrbvec.map (fun (datom : (_, _) Domain.export_datom) ->
        Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
          [| datom.entity; datom.attribute; datom.value |])
    |> Rrbvec.to_array
    |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
  in
  Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
    [|
      [|
        keyword "logseq.db.sqlite.export/schema-version";
        Melange_cljs_runtime_spec.Value_codec.string_to_value runtime
          schema_version;
      |];
      [| keyword "logseq.db.sqlite.export/graph-format"; keyword "datoms" |];
      [| keyword "datoms"; datoms |];
    |]

let datomImportWith runtime datascript database export_map =
  let keyword =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  in
  let imported =
    Melange_cljs_runtime_spec.Value_codec.map_get runtime export_map
      (keyword "datoms")
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
    |> Array.map (fun value ->
        match
          Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime value
        with
        | [| entity; attribute; value |] ->
            {
              Domain.import_entity =
                Melange_cljs_runtime_spec.Value_codec.int_from_value runtime
                  entity;
              import_attribute = attribute;
              import_value = value;
            }
        | _ -> invalid_arg "DB SQLite datom import expects [e a v] tuples")
    |> Rrbvec.of_array
  in
  let capabilities :
      ( Melange_datascript_spec.Api.database,
        Melange_cljs_runtime_spec.Value_codec.cljs_value )
      Domain.import_capabilities =
    {
      current_entity_ids =
        (fun database ->
          Melange_datascript_spec.Api.datoms datascript database
            (keyword "eavt") [||]
          |> Array.map (fun datom ->
              Melange_datascript_spec.Api.datom_entity datascript datom
              |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime));
      attribute_name =
        Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime;
      value_key = Melange_cljs_runtime_spec.Value_codec.value_to_string runtime;
      entity_value = Melange_cljs_runtime_spec.Value_codec.int_to_value runtime;
      lookup_ref =
        (fun value ->
          if
            not
              (Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime
                 value)
          then None
          else
            match
              Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime
                value
            with
            | [| attribute; lookup_value |] -> Some (attribute, lookup_value)
            | _ -> None);
    }
  in
  let init_transactions =
    Domain.datom_import capabilities database imported
    |> Rrbvec.map (function
      | Domain.Retract_entity entity ->
          Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
            [|
              keyword "db/retractEntity";
              Melange_cljs_runtime_spec.Value_codec.int_to_value runtime entity;
            |]
      | Domain.Add (entity, attribute, value) ->
          Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
            [|
              keyword "db/add";
              Melange_cljs_runtime_spec.Value_codec.int_to_value runtime entity;
              attribute;
              value;
            |])
    |> Rrbvec.to_array
    |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
  in
  let empty =
    Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime [||]
  in
  Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
    [|
      [| keyword "init-tx"; init_transactions |];
      [| keyword "block-props-tx"; empty |];
      [| keyword "misc-tx"; empty |];
    |]
