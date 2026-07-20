module Domain = Melange_db.Sqlite_export

type diff_callback =
  (Support.Runtime_codec.cljs_value ->
   Support.Runtime_codec.cljs_value ->
   Support.Runtime_codec.cljs_value
  [@u])

type value_predicate = (Support.Runtime_codec.cljs_value -> bool[@u])

type export_predicates = {
  includeUuid : value_predicate;
  includePvalueUuid : value_predicate;
}

type export_capabilities = { logValidationError : (exn -> unit[@u]) }
type diff_capabilities = { diffValues : diff_callback }

type runtime_page_group = {
  title : Support.Runtime_codec.cljs_value;
  journal : Support.Runtime_codec.cljs_value;
  entries : Support.Runtime_codec.cljs_value Rrbvec.t ref;
}

type encoded_import_validation_result = {
  database : Support.Datascript.database Js.Nullable.t;
  transactionData : Support.Runtime_codec.cljs_value;
  error : string Js.Nullable.t;
}

let field = Property_build.field
let assoc = Property_build.assoc
let empty_map = Property_build.empty_map
let merge_map = Property_build.merge_map

let keyword runtime name =
  Support.Runtime_codec.keyword_from_string runtime name

let keyword_text runtime value =
  Support.Runtime_codec.keyword_to_string runtime value

let collection runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    Support.Runtime_codec.collection_to_array runtime value
    |> Rrbvec.of_array

let export_type runtime export_map =
  let value = field runtime export_map "logseq.db.sqlite.export/export-type" in
  if Support.Runtime_codec.value_is_nil runtime value then ""
  else keyword_text runtime value

let datom_export runtime export_map =
  let format =
    field runtime export_map "logseq.db.sqlite.export/graph-format"
  in
  (not (Support.Runtime_codec.value_is_nil runtime format))
  && String.equal (keyword_text runtime format) "datoms"

let lookup_uuid runtime uuid =
  Support.Runtime_codec.array_to_vector runtime
    [| keyword runtime "block/uuid"; uuid |]

let entity_field runtime datascript entity name =
  Entity_read.field runtime datascript entity name

let entity _runtime datascript database lookup =
  Support.Datascript.entity datascript database lookup
  |> Js.Nullable.toOption

let page_entity runtime datascript database page =
  let journal = field runtime page "build/journal" in
  if not (Support.Runtime_codec.value_is_nil runtime journal) then
    let datoms =
      Support.Datascript.datoms datascript database (keyword runtime "avet")
        [| keyword runtime "block/journal-day"; journal |]
    in
    if Array.length datoms = 0 then None
    else
      Support.Datascript.datom_entity datascript datoms.(0)
      |> entity runtime datascript database
  else
    let title = field runtime page "block/title" in
    if Support.Runtime_codec.value_is_nil runtime title then None
    else
      Core_read.casePageWith runtime datascript database "name" title
      |> Js.Nullable.toOption

let filter_existing_properties runtime datascript entity properties =
  properties
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result -> function
         | [| property; value |] ->
             let existing =
               Support.Datascript.entity_get datascript entity property
             in
             if Support.Runtime_codec.value_is_nil runtime existing then
               Support.Runtime_codec.map_assoc runtime result property value
             else result
         | _ -> invalid_arg "SQLite import properties expect map entries")
       (empty_map runtime)

let prepare_page runtime datascript database keep_existing_properties
    replacements page =
  match page_entity runtime datascript database page with
  | None -> page
  | Some existing ->
      let old_uuid = field runtime page "block/uuid" in
      let existing_uuid =
        entity_field runtime datascript existing "block/uuid"
      in
      if not (Support.Runtime_codec.value_is_nil runtime old_uuid) then
        replacements :=
          Support.Runtime_codec.map_assoc runtime !replacements old_uuid
            existing_uuid;
      let page = assoc runtime "block/uuid" existing_uuid page in
      if not keep_existing_properties then page
      else
        let properties = field runtime page "build/properties" in
        if Support.Runtime_codec.value_is_nil runtime properties then page
        else
          assoc runtime "build/properties"
            (filter_existing_properties runtime datascript existing properties)
            page

let rec postwalk runtime transform value =
  let walked =
    if Support.Runtime_codec.value_is_map runtime value then
      value
      |> Support.Runtime_codec.map_to_entries runtime
      |> Array.map (function
        | [| key; item |] ->
            [|
              postwalk runtime transform key; postwalk runtime transform item;
            |]
        | _ -> invalid_arg "SQLite import walk expects map entries")
      |> Support.Runtime_codec.entries_to_map runtime
    else if Support.Runtime_codec.value_is_vector runtime value then
      value
      |> Support.Runtime_codec.vector_to_array runtime
      |> Array.map (postwalk runtime transform)
      |> Support.Runtime_codec.array_to_vector runtime
    else if Support.Runtime_codec.value_is_set runtime value then
      value
      |> Support.Runtime_codec.set_to_array runtime
      |> Array.map (postwalk runtime transform)
      |> Support.Runtime_codec.array_to_set runtime
    else value
  in
  transform walked

let patchInvalidKeywordsWith runtime export_map =
  let initial_version =
    field runtime export_map "logseq.db.sqlite.export/kv-values"
    |> collection runtime
    |> Rrbvec.find_map (fun entry ->
        let ident = field runtime entry "db/ident" in
        if
          Support.Runtime_codec.value_is_keyword runtime ident
          && String.equal
               (keyword_text runtime ident)
               "logseq.kv/graph-initial-schema-version"
        then
          let value = field runtime entry "kv/value" in
          if Support.Runtime_codec.value_is_nil runtime value then None
          else if Support.Runtime_codec.value_is_string runtime value then
            Some (Support.Runtime_codec.string_from_value runtime value)
          else if Support.Runtime_codec.value_is_map runtime value then (
            let major = field runtime value "major" in
            let minor = field runtime value "minor" in
            if not (Support.Runtime_codec.value_is_integer runtime major)
            then
              invalid_arg
                "SQLite export schema version requires an integer :major";
            Melange_db.Schema_version.make
              (Support.Runtime_codec.int_from_value runtime major)
              (if Support.Runtime_codec.value_is_nil runtime minor then None
               else if Support.Runtime_codec.value_is_integer runtime minor
               then
                 Some (Support.Runtime_codec.int_from_value runtime minor)
               else
                 invalid_arg
                   "SQLite export schema version :minor must be an integer")
            |> Melange_db.Schema_version.to_string |> Option.some)
          else
            invalid_arg
              "SQLite export schema version must be a string or version map"
        else None)
  in
  postwalk runtime
    (fun value ->
      if not (Support.Runtime_codec.value_is_keyword runtime value) then
        value
      else
        let ident = keyword_text runtime value in
        match String.rindex_opt ident '/' with
        | None -> value
        | Some index -> (
            let namespace_ = String.sub ident 0 index in
            let name =
              String.sub ident (index + 1) (String.length ident - index - 1)
            in
            match
              Domain.patch_legacy_user_ident ~initial_version ~namespace_ ~name
            with
            | None -> value
            | Some patched -> keyword runtime patched))
    export_map

let build_page_marker runtime value =
  if not (Support.Runtime_codec.value_is_vector runtime value) then None
  else
    match Support.Runtime_codec.vector_to_array runtime value with
    | [| marker; page |]
      when Support.Runtime_codec.value_equals runtime marker
             (keyword runtime "build/page") ->
        Some page
    | _ -> None

let rewrite_page_values runtime datascript database keep_existing_properties
    replacements export_map =
  postwalk runtime
    (fun value ->
      match build_page_marker runtime value with
      | None -> value
      | Some page ->
          Support.Runtime_codec.array_to_vector runtime
            [|
              keyword runtime "build/page";
              prepare_page runtime datascript database keep_existing_properties
                replacements page;
            |])
    export_map

let rewrite_uuid_references runtime replacements export_map =
  postwalk runtime
    (fun value ->
      if not (Support.Runtime_codec.value_is_vector runtime value) then
        value
      else
        match Support.Runtime_codec.vector_to_array runtime value with
        | [| marker; uuid |]
          when Support.Runtime_codec.value_equals runtime marker
                 (keyword runtime "block/uuid") ->
            let replacement =
              Support.Runtime_codec.map_get runtime replacements uuid
            in
            if Support.Runtime_codec.value_is_nil runtime replacement then
              value
            else lookup_uuid runtime replacement
        | _ -> value)
    export_map

let update_existing_definitions runtime datascript database definitions =
  if Support.Runtime_codec.value_is_nil runtime definitions then
    empty_map runtime
  else
    definitions
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.map (function
      | [| ident; definition |] ->
          let definition =
            match entity runtime datascript database ident with
            | None -> definition
            | Some existing ->
                assoc runtime "block/uuid"
                  (entity_field runtime datascript existing "block/uuid")
                  definition
          in
          [| ident; definition |]
      | _ -> invalid_arg "SQLite import definitions expect map entries")
    |> Support.Runtime_codec.entries_to_map runtime

let property_conflicts runtime datascript database properties =
  if Support.Runtime_codec.value_is_nil runtime properties then Rrbvec.empty
  else
    properties
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.filter_map (function
      | [| ident; definition |] -> (
          match entity runtime datascript database ident with
          | None -> None
          | Some existing ->
              let differs name =
                not
                  (Support.Runtime_codec.value_equals runtime
                     (field runtime definition name)
                     (entity_field runtime datascript existing name))
              in
              if differs "logseq.property/type" || differs "db/cardinality" then
                Some ident
              else None)
      | _ -> invalid_arg "SQLite import properties expect map entries")

let append_pages runtime export_map page_entry =
  let pages =
    field runtime export_map "pages-and-blocks" |> collection runtime
  in
  assoc runtime "pages-and-blocks"
    (Rrbvec.push_back pages page_entry
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime)
    export_map

let current_block_import runtime datascript export_map current_block =
  let exported = field runtime export_map "logseq.db.sqlite.export/block" in
  if
    Support.Runtime_codec.value_is_nil runtime exported
    || Support.Runtime_codec.value_is_nil runtime current_block
  then export_map
  else
    let page = entity_field runtime datascript current_block "block/page" in
    let page_uuid = entity_field runtime datascript page "block/uuid" in
    let block =
      exported
      |> assoc runtime "block/uuid"
           (entity_field runtime datascript current_block "block/uuid")
      |> assoc runtime "block/page"
           (empty_map runtime |> assoc runtime "block/uuid" page_uuid)
    in
    let page_entry =
      empty_map runtime
      |> assoc runtime "page"
           (empty_map runtime |> assoc runtime "block/uuid" page_uuid)
      |> assoc runtime "blocks"
           (Support.Runtime_codec.array_to_vector runtime
              [|
                Support.Runtime_codec.map_dissoc runtime block
                  (keyword runtime "block/page");
              |])
    in
    append_pages runtime export_map page_entry

let keyword_namespace runtime value =
  let text = keyword_text runtime value in
  match String.rindex_opt text '/' with
  | None -> None
  | Some index -> Some (String.sub text 0 index)

let internal_property runtime property =
  Melange_db.Property_identity.is_internal_property
    ~namespace_:(keyword_namespace runtime property)
    ~ident:(keyword_text runtime property)
    ~is_keyword:(Support.Runtime_codec.value_is_keyword runtime property)

let namespace_included runtime prefixes property =
  match keyword_namespace runtime property with
  | None -> false
  | Some namespace_ ->
      prefixes
      |> Rrbvec.exists (fun prefix ->
          let prefix =
            let _namespace, name =
              match String.rindex_opt (keyword_text runtime prefix) '/' with
              | None -> (None, keyword_text runtime prefix)
              | Some index ->
                  ( Some (String.sub (keyword_text runtime prefix) 0 index),
                    String.sub
                      (keyword_text runtime prefix)
                      (index + 1)
                      (String.length (keyword_text runtime prefix) - index - 1)
                  )
            in
            name
          in
          String.equal namespace_ prefix
          || String.starts_with ~prefix:(prefix ^ ".") namespace_)

let include_namespace_properties runtime datascript database export_map =
  let prefixes =
    field runtime export_map "logseq.db.sqlite.export/auto-include-namespaces"
    |> collection runtime
  in
  if Rrbvec.is_empty prefixes then export_map
  else
    let properties =
      let value = field runtime export_map "properties" in
      if Support.Runtime_codec.value_is_nil runtime value then
        empty_map runtime
      else value
    in
    let properties =
      Sqlite_build.getUsedPropertiesWith runtime export_map
      |> Support.Runtime_codec.map_to_entries runtime
      |> Array.fold_left
           (fun result -> function
             | [| property; _ |]
               when (not (internal_property runtime property))
                    && namespace_included runtime prefixes property -> (
                 match entity runtime datascript database property with
                 | None -> result
                 | Some existing ->
                     let definition =
                       Rrbvec.of_array
                         [| "logseq.property/type"; "db/cardinality" |]
                       |> Rrbvec.fold_left
                            (fun definition name ->
                              let value =
                                entity_field runtime datascript existing name
                              in
                              if
                                Support.Runtime_codec.value_is_nil runtime
                                  value
                              then definition
                              else assoc runtime name value definition)
                            (empty_map runtime)
                     in
                     let current =
                       Support.Runtime_codec.map_get runtime result property
                     in
                     let definition =
                       if Support.Runtime_codec.value_is_nil runtime current
                       then definition
                       else merge_map runtime current definition
                     in
                     Support.Runtime_codec.map_assoc runtime result property
                       definition)
             | _ -> result)
           properties
    in
    export_map |> assoc runtime "properties" properties |> fun export_map ->
    Support.Runtime_codec.map_dissoc runtime export_map
      (keyword runtime "logseq.db.sqlite.export/auto-include-namespaces")

let remove_export_keys runtime export_map =
  export_map
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result -> function
         | [| key; _value |]
           when keyword_namespace runtime key = Some "logseq.db.sqlite.export"
           ->
             result
         | [| key; value |] ->
             Support.Runtime_codec.map_assoc runtime result key value
         | _ -> invalid_arg "SQLite import options expect map entries")
       (empty_map runtime)

let add_distinct runtime values value =
  if
    Support.Runtime_codec.value_is_nil runtime value
    || Rrbvec.exists
         (Support.Runtime_codec.value_equals runtime value)
         values
  then values
  else Rrbvec.push_back values value

let optional_entity_field runtime datascript entity name =
  let value = entity_field runtime datascript entity name in
  if Support.Runtime_codec.value_is_nil runtime value then None
  else Some value

let required_entity_field runtime datascript entity name =
  match optional_entity_field runtime datascript entity name with
  | Some value -> value
  | None -> invalid_arg ("SQLite export entity is missing :" ^ name)

let assoc_entity_field runtime datascript source name target =
  match optional_entity_field runtime datascript source name with
  | None -> target
  | Some value -> assoc runtime name value target

let nonempty_collection runtime value =
  not (Rrbvec.is_empty (collection runtime value))

let nonempty_map runtime value =
  (not (Support.Runtime_codec.value_is_nil runtime value))
  && Array.length (Support.Runtime_codec.map_to_entries runtime value) > 0

let buildTagsWith runtime datascript block_tags =
  let page = keyword runtime "logseq.class/Page" in
  let journal = keyword runtime "logseq.class/Journal" in
  block_tags |> collection runtime
  |> Rrbvec.fold_left
       (fun result tag ->
         let ident = entity_field runtime datascript tag "db/ident" in
         if
           Support.Runtime_codec.value_is_nil runtime ident
           || Support.Runtime_codec.value_equals runtime ident page
           || Support.Runtime_codec.value_equals runtime ident journal
           || Rrbvec.exists
                (Support.Runtime_codec.value_equals runtime ident)
                result
         then result
         else Rrbvec.push_back result ident)
       Rrbvec.empty
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_set runtime

let blockTitleWith runtime datascript entity =
  match optional_entity_field runtime datascript entity "block/raw-title" with
  | Some title -> title
  | None -> entity_field runtime datascript entity "block/title"

let propertyValueContentWith runtime datascript entity =
  let title = blockTitleWith runtime datascript entity in
  if not (Support.Runtime_codec.value_is_nil runtime title) then title
  else entity_field runtime datascript entity "logseq.property/value"

let referenced_property_value_contents runtime datascript database property =
  let value_type = entity_field runtime datascript property "db/valueType" in
  if
    not
      (Support.Runtime_codec.value_equals runtime value_type
         (keyword runtime "db.type/ref"))
  then Rrbvec.empty
  else
    let ident = required_entity_field runtime datascript property "db/ident" in
    Support.Datascript.datoms datascript database (keyword runtime "avet")
      [| ident |]
    |> Array.fold_left
         (fun result datom ->
           match
             Support.Datascript.datom_value datascript datom
             |> entity runtime datascript database
           with
           | None -> result
           | Some value ->
               let content =
                 propertyValueContentWith runtime datascript value
               in
               if
                 Support.Runtime_codec.value_is_nil runtime content
                 || Rrbvec.exists
                      (Support.Runtime_codec.value_equals runtime content)
                      result
               then result
               else Rrbvec.push_back result content)
         Rrbvec.empty

let referencedPropertyValueContentsWith runtime datascript database property =
  referenced_property_value_contents runtime datascript database property
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_set runtime

let closedValuesForExportWith runtime datascript database property =
  let referenced =
    referenced_property_value_contents runtime datascript database property
  in
  let declared =
    entity_field runtime datascript property "property/closed-values"
    |> collection runtime
  in
  let referenced_reverse =
    entity_field runtime datascript property "block/_closed-value-property"
    |> collection runtime
    |> Rrbvec.filter (fun value ->
        let content = propertyValueContentWith runtime datascript value in
        Rrbvec.exists
          (Support.Runtime_codec.value_equals runtime content)
          referenced)
  in
  let values =
    Rrbvec.append declared referenced_reverse
    |> Rrbvec.fold_left
         (fun result value ->
           let id = required_entity_field runtime datascript value "db/id" in
           let result =
             Rrbvec.filter
               (fun existing ->
                 let existing_id =
                   required_entity_field runtime datascript existing "db/id"
                 in
                 not
                   (Support.Runtime_codec.value_equals runtime existing_id
                      id))
               result
           in
           Rrbvec.push_back result value)
         Rrbvec.empty
    |> Rrbvec.to_array
  in
  Array.stable_sort
    (fun left right ->
      let order value =
        optional_entity_field runtime datascript value "block/order"
        |> Option.map (Support.Runtime_codec.string_from_value runtime)
      in
      match (order left, order right) with
      | None, None -> 0
      | None, Some _ -> -1
      | Some _, None -> 1
      | Some left, Some right -> String.compare left right)
    values;
  Support.Runtime_codec.array_to_vector runtime values

let shallowCopyPageWith runtime datascript page =
  if Entity_read.journalWith runtime datascript page then
    empty_map runtime
    |> assoc runtime "build/journal"
         (required_entity_field runtime datascript page "block/journal-day")
  else
    empty_map runtime
    |> assoc runtime "block/title" (blockTitleWith runtime datascript page)

let buildPvaluePageWith runtime datascript pvalue =
  if Entity_read.internalPageWith runtime datascript pvalue then
    let page = shallowCopyPageWith runtime datascript pvalue in
    let tags = entity_field runtime datascript pvalue "block/tags" in
    let page =
      if not (nonempty_collection runtime tags) then page
      else
        assoc runtime "build/tags" (buildTagsWith runtime datascript tags) page
    in
    Support.Runtime_codec.array_to_vector runtime
      [| keyword runtime "build/page"; page |]
    |> Js.Nullable.return
  else if Entity_read.journalWith runtime datascript pvalue then
    Support.Runtime_codec.array_to_vector runtime
      [|
        keyword runtime "build/page";
        empty_map runtime
        |> assoc runtime "build/journal"
             (required_entity_field runtime datascript pvalue
                "block/journal-day");
      |]
    |> Js.Nullable.return
  else Js.Nullable.null

let buildPvalueDefaultWith runtime datascript (include_uuid : value_predicate)
    ent_properties build_children pvalue include_timestamps =
  let content = propertyValueContentWith runtime datascript pvalue in
  let tags = entity_field runtime datascript pvalue "block/tags" in
  let uuid = entity_field runtime datascript pvalue "block/uuid" in
  let keep_uuid = (include_uuid uuid [@u]) in
  if
    (not (nonempty_map runtime ent_properties))
    && (not (nonempty_collection runtime build_children))
    && (not (nonempty_collection runtime tags))
    && not keep_uuid
  then content
  else
    let result =
      empty_map runtime
      |> assoc runtime "build/property-value" (keyword runtime "block")
      |> assoc runtime "block/title" content
    in
    let result =
      if not (nonempty_collection runtime build_children) then result
      else assoc runtime "build/children" build_children result
    in
    let result =
      if not (nonempty_collection runtime tags) then result
      else
        assoc runtime "build/tags"
          (buildTagsWith runtime datascript tags)
          result
    in
    let result =
      if not (nonempty_map runtime ent_properties) then result
      else assoc runtime "build/properties" ent_properties result
    in
    let result =
      if not keep_uuid then result
      else
        result
        |> assoc runtime "block/uuid" uuid
        |> assoc runtime "build/keep-uuid?"
             (Support.Runtime_codec.bool_to_value runtime true)
    in
    if not include_timestamps then result
    else
      result
      |> assoc_entity_field runtime datascript pvalue "block/created-at"
      |> assoc_entity_field runtime datascript pvalue "block/updated-at"

let entity_uuid_lookup runtime datascript entity =
  Support.Runtime_codec.array_to_vector runtime
    [|
      keyword runtime "block/uuid";
      required_entity_field runtime datascript entity "block/uuid";
    |]

let buildExportClassWith runtime datascript class_entity include_uuid
    shallow_copy include_timestamps include_alias =
  let result =
    empty_map runtime
    |> assoc_entity_field runtime datascript class_entity "block/title"
    |> assoc_entity_field runtime datascript class_entity "block/collapsed?"
  in
  let result =
    if not include_uuid then result
    else
      result
      |> assoc runtime "block/uuid"
           (required_entity_field runtime datascript class_entity "block/uuid")
      |> assoc runtime "build/keep-uuid?"
           (Support.Runtime_codec.bool_to_value runtime true)
  in
  let result =
    if not include_timestamps then result
    else
      result
      |> assoc_entity_field runtime datascript class_entity "block/created-at"
      |> assoc_entity_field runtime datascript class_entity "block/updated-at"
  in
  let class_properties =
    entity_field runtime datascript class_entity
      "logseq.property.class/properties"
    |> collection runtime |> Rrbvec.to_array
  in
  Array.stable_sort
    (fun left right ->
      let order value =
        optional_entity_field runtime datascript value "block/order"
        |> Option.map (Support.Runtime_codec.string_from_value runtime)
      in
      match (order left, order right) with
      | None, None -> 0
      | None, Some _ -> -1
      | Some _, None -> 1
      | Some left, Some right -> String.compare left right)
    class_properties;
  let ignored =
    Rrbvec.of_array
      [|
        keyword runtime "logseq.property/created-by-ref";
        keyword runtime "logseq.property.embedding/hnsw-label-updated-at";
      |]
  in
  let class_property_idents =
    class_properties |> Rrbvec.of_array
    |> Rrbvec.filter_map (fun property ->
        let ident = entity_field runtime datascript property "db/ident" in
        if
          Support.Runtime_codec.value_is_nil runtime ident
          || Rrbvec.exists
               (Support.Runtime_codec.value_equals runtime ident)
               ignored
        then None
        else Some ident)
  in
  let result =
    if shallow_copy || Rrbvec.is_empty class_property_idents then result
    else
      assoc runtime "build/class-properties"
        (class_property_idents |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_vector runtime)
        result
  in
  let aliases =
    entity_field runtime datascript class_entity "block/alias"
    |> collection runtime
  in
  let result =
    if shallow_copy || (not include_alias) || Rrbvec.is_empty aliases then
      result
    else
      aliases
      |> Rrbvec.map (entity_uuid_lookup runtime datascript)
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_set runtime
      |> fun aliases -> assoc runtime "block/alias" aliases result
  in
  let extends =
    entity_field runtime datascript class_entity "logseq.property.class/extends"
    |> collection runtime
    |> Rrbvec.filter_map (fun parent ->
        optional_entity_field runtime datascript parent "db/ident")
  in
  let only_root =
    Rrbvec.length extends = 1
    && Support.Runtime_codec.value_equals runtime (Rrbvec.nth extends 0)
         (keyword runtime "logseq.class/Root")
  in
  if shallow_copy || Rrbvec.is_empty extends || only_root then result
  else
    extends |> Rrbvec.to_array |> Support.Runtime_codec.array_to_set runtime
    |> fun values -> assoc runtime "build/class-extends" values result

let logseq_class_ident runtime ident =
  if not (Support.Runtime_codec.value_is_keyword runtime ident) then false
  else
    let text = keyword_text runtime ident in
    match String.rindex_opt text '/' with
    | None -> false
    | Some index ->
        String.sub text 0 index |> Melange_db.Class_read.logseq_class

let add_distinct_value runtime values value =
  if
    Support.Runtime_codec.value_is_nil runtime value
    || Rrbvec.exists
         (Support.Runtime_codec.value_equals runtime value)
         values
  then values
  else Rrbvec.push_back values value

let buildNodeClassesWith runtime datascript database build_block block_tags
    properties =
  let property_values map =
    if Support.Runtime_codec.value_is_nil runtime map then Rrbvec.empty
    else
      map
      |> Support.Runtime_codec.map_to_entries runtime
      |> Rrbvec.of_array
      |> Rrbvec.map (function
        | [| _key; value |] -> value
        | _ -> invalid_arg "SQLite export expects map entries")
  in
  let pvalue_classes =
    field runtime build_block "build/properties"
    |> property_values
    |> Rrbvec.fold_left
         (fun result value_or_values ->
           let values =
             if Support.Runtime_codec.value_is_set runtime value_or_values
             then
               Support.Runtime_codec.set_to_array runtime value_or_values
               |> Rrbvec.of_array
             else Rrbvec.singleton value_or_values
           in
           values
           |> Rrbvec.fold_left
                (fun result value ->
                  let tags =
                    if Sqlite_build.pagePropertyValueWith runtime value then
                      match
                        Support.Runtime_codec.vector_to_array runtime value
                      with
                      | [| _marker; page |] -> field runtime page "build/tags"
                      | _ -> Support.Runtime_codec.nil_value runtime
                    else if
                      Sqlite_build.blockPropertyValueWith runtime value
                    then field runtime value "build/tags"
                    else Support.Runtime_codec.nil_value runtime
                  in
                  tags |> collection runtime
                  |> Rrbvec.fold_left
                       (fun result ident ->
                         if logseq_class_ident runtime ident then result
                         else add_distinct_value runtime result ident)
                       result)
                result)
         Rrbvec.empty
  in
  let property_classes =
    properties |> property_values
    |> Rrbvec.fold_left
         (fun result definition ->
           field runtime definition "build/property-classes"
           |> collection runtime
           |> Rrbvec.fold_left
                (fun result ident ->
                  if logseq_class_ident runtime ident then result
                  else add_distinct_value runtime result ident)
                result)
         Rrbvec.empty
  in
  let new_class_entities =
    block_tags |> collection runtime
    |> Rrbvec.filter (fun entity ->
        entity_field runtime datascript entity "db/ident"
        |> logseq_class_ident runtime |> not)
  in
  let new_class_idents =
    Rrbvec.map
      (fun entity -> required_entity_field runtime datascript entity "db/ident")
      new_class_entities
  in
  let shallow_classes =
    Rrbvec.append property_classes pvalue_classes
    |> Rrbvec.fold_left (add_distinct_value runtime) Rrbvec.empty
    |> Rrbvec.filter (fun ident ->
        not
          (Rrbvec.exists
             (Support.Runtime_codec.value_equals runtime ident)
             new_class_idents))
  in
  let result =
    shallow_classes
    |> Rrbvec.fold_left
         (fun result ident ->
           match entity runtime datascript database ident with
           | None ->
               invalid_arg
                 ("SQLite export class is missing: "
                 ^ Support.Runtime_codec.value_to_string runtime ident)
           | Some entity ->
               Support.Runtime_codec.map_assoc runtime result ident
                 (buildExportClassWith runtime datascript entity false true
                    false false))
         (empty_map runtime)
  in
  new_class_entities
  |> Rrbvec.fold_left
       (fun result entity ->
         let ident =
           required_entity_field runtime datascript entity "db/ident"
         in
         Support.Runtime_codec.map_assoc runtime result ident
           (buildExportClassWith runtime datascript entity false false false
              false))
       result

let option_bool runtime options name =
  field runtime options name |> Support.Runtime_codec.value_truthy runtime

let dissoc_names runtime names value =
  names
  |> Rrbvec.fold_left
       (fun result name ->
         Support.Runtime_codec.map_dissoc runtime result
           (keyword runtime name))
       value

let property_map runtime entity =
  Property_workflow.propertiesWith runtime entity

let public_attribute_names =
  Melange_db.Property_catalog.public_db_attribute_properties

let schema_attribute_names = Melange_db.Property_catalog.schema_properties

let dissoc_catalog runtime names value =
  names
  |> Rrbvec.fold_left
       (fun result name ->
         Support.Runtime_codec.map_dissoc runtime result
           (keyword runtime name))
       value

let is_logseq_property runtime value =
  if not (Support.Runtime_codec.value_is_keyword runtime value) then false
  else
    let ident = keyword_text runtime value in
    match String.rindex_opt ident '/' with
    | None -> false
    | Some index ->
        Melange_db.Property_identity.is_logseq_property_namespace
          (Some (String.sub ident 0 index))

let map_entries runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    value
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.map (function
      | [| key; value |] -> (key, value)
      | _ -> invalid_arg "SQLite export expects map entries")

let map_value_list runtime value = map_entries runtime value |> Rrbvec.map snd

let entity_required runtime datascript database lookup label =
  match entity runtime datascript database lookup with
  | Some entity -> entity
  | None ->
      invalid_arg
        ("SQLite export " ^ label ^ " is missing: "
        ^ Support.Runtime_codec.value_to_string runtime lookup)

let pvalue_uuids runtime build_block =
  let marker =
    keyword runtime "logseq.db.sqlite.export/existing-property-value?"
  in
  let property_values =
    let properties = field runtime build_block "build/properties" in
    if Support.Runtime_codec.value_is_nil runtime properties then
      Rrbvec.empty
    else
      properties
      |> Support.Runtime_codec.map_to_entries runtime
      |> Rrbvec.of_array
      |> Rrbvec.map (function
        | [| _key; value |] -> value
        | _ -> invalid_arg "SQLite export expects map entries")
  in
  property_values
  |> Rrbvec.fold_left
       (fun result value_or_values ->
         let values =
           if Support.Runtime_codec.value_is_set runtime value_or_values
           then
             Support.Runtime_codec.set_to_array runtime value_or_values
             |> Rrbvec.of_array
           else Rrbvec.singleton value_or_values
         in
         values
         |> Rrbvec.fold_left
              (fun result value ->
                if not (Support.Runtime_codec.value_is_vector runtime value)
                then result
                else
                  match
                    Support.Runtime_codec.vector_to_array runtime value
                  with
                  | [| attribute; uuid |]
                    when Support.Runtime_codec.value_equals runtime
                           attribute
                           (keyword runtime "block/uuid") ->
                      let metadata =
                        Support.Runtime_codec.value_meta runtime value
                      in
                      if
                        Support.Runtime_codec.value_is_nil runtime metadata
                        || (not
                              (Support.Runtime_codec.map_contains runtime
                                 metadata marker))
                        || not
                             (Support.Runtime_codec.map_get runtime metadata
                                marker
                             |> Support.Runtime_codec.value_truthy runtime)
                      then result
                      else add_distinct runtime result uuid
                  | _ -> result)
              result)
       Rrbvec.empty
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_set runtime

let rec buildable_properties runtime datascript database predicates
    ent_properties properties_config options =
  let ignored =
    Rrbvec.of_array
      [|
        "logseq.property/created-by-ref";
        "logseq.property.embedding/hnsw-label-updated-at";
      |]
  in
  let ent_properties = dissoc_names runtime ignored ent_properties in
  let closed_lookup property value =
    let definition =
      Support.Runtime_codec.map_get runtime properties_config property
    in
    let entries =
      field runtime definition "build/closed-values" |> collection runtime
    in
    let content = Property_workflow.content runtime datascript value in
    match
      Rrbvec.find_opt
        (fun entry ->
          Support.Runtime_codec.value_equals runtime
            (field runtime entry "value")
            content)
        entries
    with
    | Some entry -> field runtime entry "uuid"
    | None ->
        invalid_arg
          ("SQLite export has no closed value for "
          ^ Support.Runtime_codec.value_to_string runtime content)
  in
  let rec build_pvalue property_entity pvalue =
    if not (option_bool runtime options "property-value-uuids?") then
      match
        buildPvaluePageWith runtime datascript pvalue |> Js.Nullable.toOption
      with
      | Some page -> page
      | None -> build_pvalue_default property_entity pvalue
    else build_pvalue_default property_entity pvalue
  and build_pvalue_default property_entity pvalue =
    let property_type =
      entity_field runtime datascript property_entity "logseq.property/type"
    in
    let property_ident =
      entity_field runtime datascript property_entity "db/ident"
    in
    let reference_type =
      Rrbvec.of_array [| "node"; "date"; "entity" |]
      |> Rrbvec.exists (fun name ->
          Support.Runtime_codec.value_equals runtime property_type
            (keyword runtime name))
    in
    let default_property =
      Support.Runtime_codec.value_equals runtime property_ident
        (keyword runtime "logseq.property/default-value")
    in
    let ident = entity_field runtime datascript pvalue "db/ident" in
    if reference_type && not default_property then
      if not (Support.Runtime_codec.value_is_nil runtime ident) then ident
      else
        let lookup = entity_uuid_lookup runtime datascript pvalue in
        let metadata =
          empty_map runtime
          |> Support.Runtime_codec.map_assoc runtime
               (keyword runtime
                  "logseq.db.sqlite.export/existing-property-value?")
               (Support.Runtime_codec.bool_to_value runtime true)
        in
        Support.Runtime_codec.value_with_meta runtime lookup metadata
    else if not (Support.Runtime_codec.value_is_nil runtime ident) then
      ident
    else
      let nested_properties =
        property_map runtime pvalue
        |> dissoc_names runtime
             (Rrbvec.of_array
                [|
                  "logseq.property/value";
                  "logseq.property/created-from-property";
                |])
        |> dissoc_catalog runtime public_attribute_names
      in
      let uuid = required_entity_field runtime datascript pvalue "block/uuid" in
      let descendants =
        Tree_workflow.blockAndChildrenWith runtime datascript database uuid
          false
        |> Js.Nullable.toOption |> Option.map Rrbvec.of_array
        |> Option.value ~default:Rrbvec.empty
      in
      let child_blocks =
        match Rrbvec.pop_front descendants with
        | None -> Rrbvec.empty
        | Some (_root, children) -> children
      in
      let child_predicates : export_predicates =
        {
          includeUuid = (fun[@u] _value -> false);
          includePvalueUuid = (fun[@u] _value -> false);
        }
      in
      let build_children =
        if Rrbvec.is_empty child_blocks then
          Support.Runtime_codec.nil_value runtime
        else
          build_blocks_export runtime datascript database child_predicates
            (child_blocks |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime)
            options
          |> fun result -> field runtime result "blocks"
      in
      let nested =
        if
          (not
             (Support.Runtime_codec.value_is_nil runtime
                (entity_field runtime datascript pvalue
                   "block/closed-value-property")))
          || not (nonempty_map runtime nested_properties)
        then empty_map runtime
        else
          buildable_properties runtime datascript database predicates
            nested_properties properties_config options
      in
      buildPvalueDefaultWith runtime datascript predicates.includePvalueUuid
        nested build_children pvalue
        (option_bool runtime options "include-timestamps?")
  in
  ent_properties |> map_entries runtime
  |> Rrbvec.fold_left
       (fun result (property, value) ->
         let first_value =
           if Support.Runtime_codec.value_is_set runtime value then
             Support.Runtime_codec.set_to_array runtime value
             |> Array.to_seq |> Seq.uncons |> Option.map fst
           else Some value
         in
         let closed =
           (not (is_logseq_property runtime property))
           && Option.fold ~none:false
                ~some:(fun value ->
                  not
                    (Support.Runtime_codec.value_is_nil runtime
                       (entity_field runtime datascript value
                          "block/closed-value-property")))
                first_value
         in
         let built =
           if closed then
             if Support.Runtime_codec.value_is_set runtime value then
               value
               |> Support.Runtime_codec.set_to_array runtime
               |> Array.map (fun item ->
                   Support.Runtime_codec.array_to_vector runtime
                     [|
                       keyword runtime "block/uuid"; closed_lookup property item;
                     |])
               |> Support.Runtime_codec.array_to_set runtime
             else
               Support.Runtime_codec.array_to_vector runtime
                 [|
                   keyword runtime "block/uuid"; closed_lookup property value;
                 |]
           else if Support.Datascript.entity_is datascript value then
             let property_entity =
               entity_required runtime datascript database property "property"
             in
             build_pvalue property_entity value
           else if Support.Runtime_codec.value_is_set runtime value then
             let values =
               Support.Runtime_codec.set_to_array runtime value
             in
             if
               Array.for_all
                 (Support.Datascript.entity_is datascript)
                 values
             then
               let property_entity =
                 entity_required runtime datascript database property "property"
               in
               values
               |> Array.map (build_pvalue property_entity)
               |> Support.Runtime_codec.array_to_set runtime
             else value
           else value
         in
         Support.Runtime_codec.map_assoc runtime result property built)
       (empty_map runtime)

and build_export_properties runtime datascript database predicates
    user_property_idents options =
  let include_properties = option_bool runtime options "include-properties?" in
  let include_timestamps = option_bool runtime options "include-timestamps?" in
  let include_uuid = option_bool runtime options "include-uuid?" in
  let shallow_copy = option_bool runtime options "shallow-copy?" in
  let include_alias = option_bool runtime options "include-alias?" in
  let property_pairs =
    user_property_idents |> collection runtime
    |> Rrbvec.map (fun ident ->
        let property =
          entity_required runtime datascript database ident "property"
        in
        let selected_names =
          schema_attribute_names
          |> Rrbvec.filter (fun name ->
              not (String.equal name "logseq.property/classes"))
          |> fun names ->
          Rrbvec.append names
            (Rrbvec.of_array [| "block/title"; "block/collapsed?" |])
        in
        let definition =
          selected_names
          |> Rrbvec.fold_left
               (fun result name ->
                 assoc_entity_field runtime datascript property name result)
               (empty_map runtime)
        in
        let definition =
          if not include_uuid then definition
          else
            definition
            |> assoc runtime "block/uuid"
                 (required_entity_field runtime datascript property "block/uuid")
            |> assoc runtime "build/keep-uuid?"
                 (Support.Runtime_codec.bool_to_value runtime true)
        in
        let definition =
          if not include_timestamps then definition
          else
            definition
            |> assoc_entity_field runtime datascript property "block/created-at"
            |> assoc_entity_field runtime datascript property "block/updated-at"
        in
        let aliases =
          entity_field runtime datascript property "block/alias"
          |> collection runtime
        in
        let definition =
          if shallow_copy || (not include_alias) || Rrbvec.is_empty aliases then
            definition
          else
            aliases
            |> Rrbvec.map (entity_uuid_lookup runtime datascript)
            |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_set runtime
            |> fun values -> assoc runtime "block/alias" values definition
        in
        let classes =
          entity_field runtime datascript property "logseq.property/classes"
          |> collection runtime
        in
        let definition =
          if shallow_copy || Rrbvec.is_empty classes then definition
          else
            classes
            |> Rrbvec.map (fun value ->
                required_entity_field runtime datascript value "db/ident")
            |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_set runtime
            |> fun values ->
            assoc runtime "build/property-classes" values definition
        in
        let closed_values =
          closedValuesForExportWith runtime datascript database property
          |> collection runtime
        in
        let definition =
          if Rrbvec.is_empty closed_values then definition
          else
            closed_values
            |> Rrbvec.map (fun value ->
                let entry =
                  empty_map runtime
                  |> assoc runtime "value"
                       (Property_workflow.content runtime datascript value)
                  |> assoc runtime "uuid"
                       (required_entity_field runtime datascript value
                          "block/uuid")
                in
                assoc_entity_field runtime datascript value
                  "logseq.property/icon" entry)
            |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime
            |> fun values ->
            assoc runtime "build/closed-values" values definition
        in
        (property, ident, definition))
  in
  let configs =
    property_pairs
    |> Rrbvec.fold_left
         (fun result (_property, ident, definition) ->
           Support.Runtime_codec.map_assoc runtime result ident definition)
         (empty_map runtime)
  in
  if not include_properties then configs
  else
    property_pairs
    |> Rrbvec.fold_left
         (fun result (property, ident, definition) ->
           let properties =
             property_map runtime property
             |> dissoc_catalog runtime schema_attribute_names
             |> dissoc_catalog runtime public_attribute_names
           in
           let built =
             buildable_properties runtime datascript database predicates
               properties configs options
           in
           let definition =
             if nonempty_map runtime built then
               assoc runtime "build/properties" built definition
             else definition
           in
           Support.Runtime_codec.map_assoc runtime result ident definition)
         (empty_map runtime)

and build_node_properties runtime datascript database predicates entity
    ent_properties options =
  let existing_properties = field runtime options "properties" in
  let configured ident =
    (not (Support.Runtime_codec.value_is_nil runtime existing_properties))
    && Support.Runtime_codec.map_contains runtime existing_properties ident
  in
  let rec collect_nested_property_ids result value =
    if Support.Datascript.entity_is datascript value then
      let created_from =
        entity_field runtime datascript value
          "logseq.property/created-from-property"
      in
      if Support.Runtime_codec.value_is_nil runtime created_from then result
      else
        let properties =
          property_map runtime value
          |> dissoc_catalog runtime public_attribute_names
        in
        properties |> map_entries runtime
        |> Rrbvec.fold_left
             (fun result (ident, nested_value) ->
               let result = add_distinct_value runtime result ident in
               collect_nested_property_ids result nested_value)
             result
    else if Support.Runtime_codec.value_is_set runtime value then
      value
      |> Support.Runtime_codec.set_to_array runtime
      |> Rrbvec.of_array
      |> Rrbvec.fold_left collect_nested_property_ids result
    else result
  in
  let direct_property_ids =
    ent_properties |> map_entries runtime |> Rrbvec.map fst
  in
  let class_property_ids =
    entity_field runtime datascript entity "block/tags"
    |> collection runtime
    |> Rrbvec.fold_left
         (fun result tag ->
           entity_field runtime datascript tag
             "logseq.property.class/properties"
           |> collection runtime
           |> Rrbvec.fold_left
                (fun result property ->
                  let ident =
                    entity_field runtime datascript property "db/ident"
                  in
                  add_distinct_value runtime result ident)
                result)
         Rrbvec.empty
  in
  let nested_property_ids =
    ent_properties |> map_entries runtime |> Rrbvec.map snd
    |> Rrbvec.fold_left collect_nested_property_ids Rrbvec.empty
  in
  Rrbvec.append direct_property_ids class_property_ids |> fun result ->
  Rrbvec.append result nested_property_ids
  |> Rrbvec.fold_left (add_distinct_value runtime) Rrbvec.empty
  |> Rrbvec.filter (fun ident ->
      (not (is_logseq_property runtime ident)) && not (configured ident))
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_vector runtime
  |> fun property_idents ->
  build_export_properties runtime datascript database predicates property_idents
    options

and build_node_export runtime datascript database predicates entity options =
  let shallow_copy = option_bool runtime options "shallow-copy?" in
  let exclude_ontology = option_bool runtime options "exclude-ontology?" in
  let include_timestamps = option_bool runtime options "include-timestamps?" in
  let ent_properties =
    property_map runtime entity |> dissoc_catalog runtime public_attribute_names
  in
  let block_tags = entity_field runtime datascript entity "block/tags" in
  let build_tags = buildTagsWith runtime datascript block_tags in
  let new_properties =
    if shallow_copy || exclude_ontology then empty_map runtime
    else
      let property_options =
        Support.Runtime_codec.map_dissoc runtime options
          (keyword runtime "shallow-copy?")
        |> fun options ->
        Support.Runtime_codec.map_dissoc runtime options
          (keyword runtime "include-uuid-fn")
      in
      build_node_properties runtime datascript database predicates entity
        ent_properties property_options
  in
  let properties_config =
    let configured = field runtime options "properties" in
    let configured =
      if Support.Runtime_codec.value_is_nil runtime configured then
        empty_map runtime
      else configured
    in
    merge_map runtime configured new_properties
  in
  let build_properties =
    if shallow_copy || not (nonempty_map runtime ent_properties) then
      empty_map runtime
    else
      buildable_properties runtime datascript database predicates ent_properties
        properties_config options
  in
  let build_node =
    empty_map runtime
    |> assoc runtime "block/title"
         (propertyValueContentWith runtime datascript entity)
  in
  let build_node =
    match
      optional_entity_field runtime datascript entity "block/collapsed?"
    with
    | None -> build_node
    | Some value -> assoc runtime "block/collapsed?" value build_node
  in
  let build_node =
    match optional_entity_field runtime datascript entity "block/link" with
    | None -> build_node
    | Some link ->
        assoc runtime "block/link"
          (entity_uuid_lookup runtime datascript link)
          build_node
  in
  let uuid = entity_field runtime datascript entity "block/uuid" in
  let build_node =
    if predicates.includeUuid uuid [@u] then
      build_node
      |> assoc runtime "block/uuid" uuid
      |> assoc runtime "build/keep-uuid?"
           (Support.Runtime_codec.bool_to_value runtime true)
    else build_node
  in
  let build_node =
    if not include_timestamps then build_node
    else
      build_node
      |> assoc_entity_field runtime datascript entity "block/created-at"
      |> assoc_entity_field runtime datascript entity "block/updated-at"
  in
  let build_node =
    if shallow_copy || not (nonempty_collection runtime build_tags) then
      build_node
    else assoc runtime "build/tags" build_tags build_node
  in
  let build_node =
    if nonempty_map runtime build_properties then
      assoc runtime "build/properties" build_properties build_node
    else build_node
  in
  let new_classes =
    if shallow_copy || exclude_ontology then empty_map runtime
    else
      buildNodeClassesWith runtime datascript database build_node block_tags
        new_properties
  in
  let result = empty_map runtime |> assoc runtime "node" build_node in
  let result =
    if nonempty_map runtime new_classes then
      assoc runtime "classes" new_classes result
    else result
  in
  if nonempty_map runtime new_properties then
    assoc runtime "properties" new_properties result
  else result

and build_blocks_export runtime datascript database predicates blocks options =
  let blocks = collection runtime blocks in
  let ontology = field runtime options "graph-ontology" in
  let raw_initial_properties = field runtime ontology "properties" in
  let raw_initial_classes = field runtime ontology "classes" in
  let ontology_map value =
    if Support.Runtime_codec.value_is_nil runtime value then
      empty_map runtime
    else value
  in
  let initial_properties = ontology_map raw_initial_properties in
  let initial_classes = ontology_map raw_initial_classes in
  let properties = ref initial_properties in
  let classes = ref initial_classes in
  let collected_pvalue_uuids = ref Rrbvec.empty in
  let include_children =
    let key = keyword runtime "include-children?" in
    if Support.Runtime_codec.map_contains runtime options key then
      Support.Runtime_codec.map_get runtime options key
      |> Support.Runtime_codec.value_truthy runtime
    else true
  in
  let block_id block = required_entity_field runtime datascript block "db/id" in
  let parent_id block =
    match optional_entity_field runtime datascript block "block/parent" with
    | None -> None
    | Some parent -> optional_entity_field runtime datascript parent "db/id"
  in
  let child_groups = ref Rrbvec.empty in
  if include_children then
    blocks
    |> Rrbvec.iter (fun block ->
        match parent_id block with
        | None -> ()
        | Some parent ->
            let found =
              !child_groups
              |> Rrbvec.exists (fun (id, _children) ->
                  Support.Runtime_codec.value_equals runtime id parent)
            in
            if found then
              child_groups :=
                !child_groups
                |> Rrbvec.map (fun (id, children) ->
                    if Support.Runtime_codec.value_equals runtime id parent
                    then (id, Rrbvec.push_back children block)
                    else (id, children))
            else
              child_groups :=
                Rrbvec.push_back !child_groups (parent, Rrbvec.singleton block));
  let children_of block =
    let id = block_id block in
    !child_groups
    |> Rrbvec.find_opt (fun (parent, _children) ->
        Support.Runtime_codec.value_equals runtime parent id)
    |> Option.map snd
    |> Option.value ~default:Rrbvec.empty
  in
  let merge_configs target extra =
    if nonempty_map runtime extra then target := merge_map runtime !target extra
  in
  let add_pvalue_uuids values =
    values |> collection runtime
    |> Rrbvec.iter (fun value ->
        collected_pvalue_uuids :=
          add_distinct_value runtime !collected_pvalue_uuids value)
  in
  let rec build_block block =
    let child_nodes = children_of block |> Rrbvec.map build_block in
    let node_options =
      Support.Runtime_codec.map_dissoc runtime options
        (keyword runtime "graph-ontology")
      |> fun options ->
      Support.Runtime_codec.map_assoc runtime options
        (keyword runtime "properties")
        !properties
    in
    let export =
      build_node_export runtime datascript database predicates block
        node_options
    in
    let node = field runtime export "node" in
    merge_configs properties (field runtime export "properties");
    merge_configs classes (field runtime export "classes");
    pvalue_uuids runtime node |> add_pvalue_uuids;
    if Rrbvec.is_empty child_nodes then node
    else
      assoc runtime "build/children"
        (child_nodes |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_vector runtime)
        node
  in
  let is_root block =
    match parent_id block with
    | None -> true
    | Some parent ->
        not
          (blocks
          |> Rrbvec.exists (fun candidate ->
              Support.Runtime_codec.value_equals runtime
                (block_id candidate) parent))
  in
  let exported_blocks =
    blocks |> Rrbvec.filter is_root |> Rrbvec.map build_block
  in
  let result =
    empty_map runtime
    |> assoc runtime "blocks"
         (exported_blocks |> Rrbvec.to_array
         |> Support.Runtime_codec.array_to_vector runtime)
    |> assoc runtime "pvalue-uuids"
         (!collected_pvalue_uuids |> Rrbvec.to_array
         |> Support.Runtime_codec.array_to_set runtime)
  in
  let result =
    if
      Support.Runtime_codec.value_equals runtime !properties
        raw_initial_properties
    then result
    else assoc runtime "properties" !properties result
  in
  if Support.Runtime_codec.value_equals runtime !classes raw_initial_classes
  then result
  else assoc runtime "classes" !classes result

let buildablePropertiesWith runtime datascript database predicates
    ent_properties properties_config options =
  buildable_properties runtime datascript database predicates ent_properties
    properties_config options

let buildExportPropertiesWith runtime datascript database predicates
    user_property_idents options =
  build_export_properties runtime datascript database predicates
    user_property_idents options

let buildNodePropertiesWith runtime datascript database predicates entity
    ent_properties options =
  build_node_properties runtime datascript database predicates entity
    ent_properties options

let buildNodeExportWith runtime datascript database predicates entity options =
  build_node_export runtime datascript database predicates entity options

let buildBlocksExportWith runtime datascript database predicates blocks options
    =
  build_blocks_export runtime datascript database predicates blocks options

let datoms_for_attribute runtime datascript database name =
  let attribute = keyword runtime name in
  Support.Datascript.datoms datascript database (keyword runtime "avet")
    [| attribute |]

let graphContentRefUuidsWith runtime datascript database exclude_built_in_pages
    =
  let title_refs =
    Support.Datascript.datoms datascript database (keyword runtime "avet")
      [| keyword runtime "block/title" |]
    |> Array.fold_left
         (fun result datom ->
           let value = Support.Datascript.datom_value datascript datom in
           if not (Support.Runtime_codec.value_is_string runtime value) then
             result
           else
             value
             |> Support.Runtime_codec.string_from_value runtime
             |> Melange_db.Content.matched_ids
             |> Rrbvec.fold_left
                  (fun result id ->
                    add_distinct runtime result
                      (Support.Runtime_codec.uuid_from_string runtime id))
                  result)
         Rrbvec.empty
  in
  Support.Datascript.datoms datascript database (keyword runtime "avet")
    [| keyword runtime "block/link" |]
  |> Array.fold_left
       (fun result datom ->
         let include_link =
           if not exclude_built_in_pages then true
           else
             match
               Support.Datascript.datom_entity datascript datom
               |> entity runtime datascript database
             with
             | None -> true
             | Some source -> (
                 match
                   optional_entity_field runtime datascript source "block/page"
                 with
                 | None -> true
                 | Some page ->
                     optional_entity_field runtime datascript page
                       "logseq.property/built-in?"
                     |> Option.fold ~none:true ~some:(fun value ->
                         not
                           (Support.Runtime_codec.value_truthy runtime value))
                 )
         in
         if not include_link then result
         else
           match
             Support.Datascript.datom_value datascript datom
             |> entity runtime datascript database
           with
           | None -> result
           | Some target ->
               add_distinct runtime result
                 (entity_field runtime datascript target "block/uuid"))
       title_refs
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_set runtime

let graphFilesWith runtime datascript database include_timestamps =
  let files =
    Support.Datascript.datoms datascript database (keyword runtime "avet")
      [| keyword runtime "file/path" |]
    |> Array.map (fun datom ->
        let source =
          Support.Datascript.datom_entity datascript datom |> fun id ->
          match entity runtime datascript database id with
          | Some entity -> entity
          | None -> invalid_arg "SQLite export file entity is missing"
        in
        let result =
          empty_map runtime
          |> assoc_entity_field runtime datascript source "file/path"
          |> assoc_entity_field runtime datascript source "file/content"
        in
        if not include_timestamps then result
        else
          result
          |> assoc_entity_field runtime datascript source "file/created-at"
          |> assoc_entity_field runtime datascript source
               "file/last-modified-at")
  in
  Array.stable_sort
    (fun left right ->
      String.compare
        (field runtime left "file/path"
        |> Support.Runtime_codec.string_from_value runtime)
        (field runtime right "file/path"
        |> Support.Runtime_codec.string_from_value runtime))
    files;
  Support.Runtime_codec.array_to_vector runtime files

let kvValuesWith runtime datascript database =
  let schema_version = keyword runtime "logseq.kv/schema-version" in
  datoms_for_attribute runtime datascript database "kv/value"
  |> Array.to_seq
  |> Seq.filter_map (fun datom ->
      let source =
        Support.Datascript.datom_entity datascript datom
        |> entity runtime datascript database
      in
      match source with
      | None -> None
      | Some source ->
          let ident =
            required_entity_field runtime datascript source "db/ident"
          in
          if Support.Runtime_codec.value_equals runtime ident schema_version
          then None
          else
            Some
              (empty_map runtime
              |> assoc runtime "db/ident" ident
              |> assoc runtime "kv/value"
                   (required_entity_field runtime datascript source "kv/value")
              ))
  |> Array.of_seq
  |> Support.Runtime_codec.array_to_vector runtime

let uuid_lookup runtime datascript entity =
  Support.Runtime_codec.array_to_vector runtime
    [|
      keyword runtime "block/uuid";
      required_entity_field runtime datascript entity "block/uuid";
    |]

let propertyHistoryWith runtime datascript database =
  datoms_for_attribute runtime datascript database
    "logseq.property.history/block"
  |> Array.map (fun datom ->
      let history =
        Support.Datascript.datom_entity datascript datom |> fun id ->
        match entity runtime datascript database id with
        | Some entity -> entity
        | None -> invalid_arg "SQLite export property history is missing"
      in
      let block =
        required_entity_field runtime datascript history
          "logseq.property.history/block"
      in
      let property =
        required_entity_field runtime datascript history
          "logseq.property.history/property"
      in
      let result =
        empty_map runtime
        |> assoc runtime "block/uuid"
             (required_entity_field runtime datascript history "block/uuid")
        |> assoc_entity_field runtime datascript history "block/created-at"
        |> assoc runtime "logseq.property.history/block"
             (uuid_lookup runtime datascript block)
        |> assoc runtime "logseq.property.history/property"
             (required_entity_field runtime datascript property "db/ident")
      in
      let result =
        match
          optional_entity_field runtime datascript history
            "logseq.property.history/ref-value"
        with
        | None -> result
        | Some reference ->
            let value =
              match
                optional_entity_field runtime datascript reference "db/ident"
              with
              | Some ident -> ident
              | None -> uuid_lookup runtime datascript reference
            in
            assoc runtime "logseq.property.history/ref-value" value result
      in
      assoc_entity_field runtime datascript history
        "logseq.property.history/scalar-value" result)
  |> Support.Runtime_codec.array_to_set runtime

let merge_export_entry runtime left right =
  right
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result -> function
         | [| key; value |] ->
             if not (Support.Runtime_codec.map_contains runtime result key)
             then Support.Runtime_codec.map_assoc runtime result key value
             else
               let existing =
                 Support.Runtime_codec.map_get runtime result key
               in
               let merged =
                 if
                   Support.Runtime_codec.value_is_map runtime existing
                   && Support.Runtime_codec.value_is_map runtime value
                 then merge_map runtime existing value
                 else
                   Array.append
                     (Support.Runtime_codec.collection_to_array runtime
                        existing)
                     (Support.Runtime_codec.collection_to_array runtime
                        value)
                   |> Support.Runtime_codec.array_to_vector runtime
               in
               Support.Runtime_codec.map_assoc runtime result key merged
         | _ -> invalid_arg "SQLite export expects map entries")
       left

let merge_nested_maps runtime maps =
  maps
  |> Rrbvec.fold_left
       (fun result map ->
         map
         |> Support.Runtime_codec.map_to_entries runtime
         |> Array.fold_left
              (fun result -> function
                | [| key; definition |] ->
                    let definition =
                      if
                        not
                          (Support.Runtime_codec.map_contains runtime result
                             key)
                      then definition
                      else
                        merge_map runtime
                          (Support.Runtime_codec.map_get runtime result key)
                          definition
                    in
                    Support.Runtime_codec.map_assoc runtime result key
                      definition
                | _ -> invalid_arg "SQLite export expects map entries")
              result)
       (empty_map runtime)

let mergeExportMapsWith runtime export_maps =
  let export_maps = collection runtime export_maps in
  let groups = ref Rrbvec.empty in
  let rec find_group title journal index =
    if index >= Rrbvec.length !groups then None
    else
      let group = Rrbvec.nth !groups index in
      if
        Support.Runtime_codec.value_equals runtime group.title title
        && Support.Runtime_codec.value_equals runtime group.journal journal
      then Some group
      else find_group title journal (index + 1)
  in
  export_maps
  |> Rrbvec.iter (fun export_map ->
      field runtime export_map "pages-and-blocks"
      |> collection runtime
      |> Rrbvec.iter (fun entry ->
          let page = field runtime entry "page" in
          let title = field runtime page "block/title" in
          let journal = field runtime page "build/journal" in
          match find_group title journal 0 with
          | Some group ->
              group.entries := Rrbvec.push_back !(group.entries) entry
          | None ->
              groups :=
                Rrbvec.push_back !groups
                  { title; journal; entries = ref (Rrbvec.singleton entry) }));
  let pages =
    !groups
    |> Rrbvec.map (fun group ->
        match Rrbvec.pop_front !(group.entries) with
        | None -> invalid_arg "SQLite export has an empty page group"
        | Some (first, rest) ->
            Rrbvec.fold_left (merge_export_entry runtime) first rest)
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  let collect_named name =
    export_maps
    |> Rrbvec.filter_map (fun export_map ->
        let value = field runtime export_map name in
        if Support.Runtime_codec.value_is_nil runtime value then None
        else Some value)
    |> merge_nested_maps runtime
  in
  let properties = collect_named "properties" in
  let classes = collect_named "classes" in
  let result = empty_map runtime |> assoc runtime "pages-and-blocks" pages in
  let result =
    if
      Array.length (Support.Runtime_codec.map_to_entries runtime properties)
      = 0
    then result
    else assoc runtime "properties" properties result
  in
  if Array.length (Support.Runtime_codec.map_to_entries runtime classes) = 0
  then result
  else assoc runtime "classes" classes result

let false_predicates : export_predicates =
  {
    includeUuid = (fun[@u] _value -> false);
    includePvalueUuid = (fun[@u] _value -> false);
  }

let options_with_flags runtime flags =
  flags
  |> Rrbvec.fold_left
       (fun result (name, enabled) ->
         assoc runtime name
           (Support.Runtime_codec.bool_to_value runtime enabled)
           result)
       (empty_map runtime)

let mark_definitions_keep_uuid runtime definitions =
  if Support.Runtime_codec.value_is_nil runtime definitions then
    empty_map runtime
  else
    definitions |> map_entries runtime
    |> Rrbvec.fold_left
         (fun result (ident, definition) ->
           Support.Runtime_codec.map_assoc runtime result ident
             (assoc runtime "build/keep-uuid?"
                (Support.Runtime_codec.bool_to_value runtime true)
                definition))
         (empty_map runtime)

let build_mixed_properties_and_classes runtime datascript database entities
    options =
  let entities = collection runtime entities in
  let property_idents =
    entities
    |> Rrbvec.filter (Entity_read.propertyWith runtime datascript)
    |> Rrbvec.map (fun entity ->
        required_entity_field runtime datascript entity "db/ident")
  in
  let class_entities =
    entities |> Rrbvec.filter (Entity_read.classWith runtime datascript)
  in
  let result = empty_map runtime in
  let result =
    if Rrbvec.is_empty property_idents then result
    else
      assoc runtime "properties"
        (build_export_properties runtime datascript database false_predicates
           (property_idents |> Rrbvec.to_array
           |> Support.Runtime_codec.array_to_vector runtime)
           options)
        result
  in
  if Rrbvec.is_empty class_entities then result
  else
    let classes =
      class_entities
      |> Rrbvec.fold_left
           (fun result entity ->
             let ident =
               required_entity_field runtime datascript entity "db/ident"
             in
             Support.Runtime_codec.map_assoc runtime result ident
               (buildExportClassWith runtime datascript entity
                  (option_bool runtime options "include-uuid?")
                  (option_bool runtime options "shallow-copy?")
                  (option_bool runtime options "include-timestamps?")
                  (option_bool runtime options "include-alias?")))
           (empty_map runtime)
    in
    assoc runtime "classes" classes result

let build_content_ref_export runtime datascript database blocks =
  let blocks =
    blocks |> collection runtime
    |> Rrbvec.filter (fun block ->
        entity_field runtime datascript block "logseq.property/value"
        |> Support.Runtime_codec.value_is_nil runtime)
  in
  let content_ref_uuids =
    blocks
    |> Rrbvec.fold_left
         (fun result block ->
           let result =
             match
               optional_entity_field runtime datascript block "block/link"
             with
             | None -> result
             | Some link ->
                 required_entity_field runtime datascript link "block/uuid"
                 |> add_distinct_value runtime result
           in
           blockTitleWith runtime datascript block
           |> Support.Runtime_codec.string_from_value runtime
           |> Melange_db.Content.matched_ids
           |> Rrbvec.fold_left
                (fun result uuid ->
                  Support.Runtime_codec.uuid_from_string runtime uuid
                  |> add_distinct_value runtime result)
                result)
         Rrbvec.empty
  in
  let content_ref_entities =
    content_ref_uuids
    |> Rrbvec.filter_map (fun uuid ->
        lookup_uuid runtime uuid |> entity runtime datascript database)
  in
  let content_ref_pages =
    content_ref_entities
    |> Rrbvec.filter (fun entity ->
        Entity_read.internalPageWith runtime datascript entity
        || Entity_read.journalWith runtime datascript entity)
  in
  let shallow_options =
    options_with_flags runtime
      (Rrbvec.of_array [| ("include-uuid?", true); ("shallow-copy?", true) |])
  in
  let mixed =
    build_mixed_properties_and_classes runtime datascript database
      (content_ref_entities |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      shallow_options
  in
  let page_entries =
    content_ref_pages
    |> Rrbvec.map (fun page ->
        let page =
          shallowCopyPageWith runtime datascript page
          |> assoc runtime "block/uuid"
               (required_entity_field runtime datascript page "block/uuid")
          |> assoc runtime "build/keep-uuid?"
               (Support.Runtime_codec.bool_to_value runtime true)
        in
        empty_map runtime |> assoc runtime "page" page)
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  empty_map runtime
  |> assoc runtime "content-ref-uuids"
       (content_ref_uuids |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_set runtime)
  |> assoc runtime "content-ref-ents"
       (content_ref_entities |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_vector runtime)
  |> assoc runtime "properties"
       (field runtime mixed "properties" |> mark_definitions_keep_uuid runtime)
  |> assoc runtime "classes"
       (field runtime mixed "classes" |> mark_definitions_keep_uuid runtime)
  |> assoc runtime "pages-and-blocks" page_entries

let class_parents runtime datascript class_entities =
  let rec visit frontier result =
    if Rrbvec.is_empty frontier then result
    else
      let next, result =
        frontier
        |> Rrbvec.fold_left
             (fun (next, result) class_entity ->
               entity_field runtime datascript class_entity
                 "logseq.property.class/extends"
               |> collection runtime
               |> Rrbvec.fold_left
                    (fun (next, result) parent ->
                      if
                        Rrbvec.exists
                          (Support.Runtime_codec.value_equals runtime parent)
                          result
                      then (next, result)
                      else
                        ( Rrbvec.push_back next parent,
                          Rrbvec.push_back result parent ))
                    (next, result))
             (Rrbvec.empty, result)
      in
      visit next result
  in
  class_entities |> Rrbvec.filter (Entity_read.classWith runtime datascript)
  |> fun roots -> visit roots Rrbvec.empty

let build_class_parents_export runtime datascript database classes_config =
  let configured_classes =
    classes_config |> map_entries runtime
    |> Rrbvec.filter_map (fun (ident, definition) ->
        if
          field runtime definition "build/class-extends"
          |> Support.Runtime_codec.value_is_nil runtime
        then None
        else entity runtime datascript database ident)
  in
  let parents = class_parents runtime datascript configured_classes in
  let classes =
    parents
    |> Rrbvec.fold_left
         (fun result parent ->
           let ident =
             required_entity_field runtime datascript parent "db/ident"
           in
           if logseq_class_ident runtime ident then result
           else
             Support.Runtime_codec.map_assoc runtime result ident
               (buildExportClassWith runtime datascript parent false false false
                  false))
         (empty_map runtime)
  in
  let property_idents =
    parents
    |> Rrbvec.fold_left
         (fun result parent ->
           entity_field runtime datascript parent
             "logseq.property.class/properties"
           |> collection runtime
           |> Rrbvec.fold_left
                (fun result property ->
                  let ident =
                    required_entity_field runtime datascript property "db/ident"
                  in
                  if is_logseq_property runtime ident then result
                  else add_distinct_value runtime result ident)
                result)
         Rrbvec.empty
  in
  let properties =
    build_export_properties runtime datascript database false_predicates
      (property_idents |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      (options_with_flags runtime
         (Rrbvec.of_array [| ("shallow-copy?", true) |]))
  in
  empty_map runtime
  |> assoc runtime "classes" classes
  |> assoc runtime "properties" properties

let build_uuid_block_export runtime datascript database pvalue_uuids
    content_ref_entities options =
  let entities =
    pvalue_uuids |> collection runtime
    |> Rrbvec.fold_left
         (fun result uuid ->
           match
             lookup_uuid runtime uuid |> entity runtime datascript database
           with
           | None -> result
           | Some entity -> add_distinct_value runtime result entity)
         Rrbvec.empty
  in
  let entities =
    content_ref_entities |> collection runtime
    |> Rrbvec.fold_left
         (fun result entity ->
           match
             Entity_read.pageWith runtime datascript entity
             |> Js.Nullable.toOption
           with
           | Some true -> result
           | Some false | None -> add_distinct_value runtime result entity)
         entities
  in
  let excluded_page =
    optional_entity_field runtime datascript options "page-entity"
  in
  let groups = ref Rrbvec.empty in
  entities
  |> Rrbvec.iter (fun block ->
      let page = required_entity_field runtime datascript block "block/page" in
      let excluded =
        Option.fold ~none:false
          ~some:(Support.Runtime_codec.value_equals runtime page)
          excluded_page
      in
      if not excluded then
        match
          !groups
          |> Rrbvec.find_opt (fun (existing, _blocks) ->
              Support.Runtime_codec.value_equals runtime existing page)
        with
        | Some _ ->
            groups :=
              !groups
              |> Rrbvec.map (fun (existing, blocks) ->
                  if
                    Support.Runtime_codec.value_equals runtime existing page
                  then (existing, Rrbvec.push_back blocks block)
                  else (existing, blocks))
        | None ->
            groups := Rrbvec.push_back !groups (page, Rrbvec.singleton block));
  let include_all : export_predicates =
    {
      includeUuid = (fun[@u] _value -> true);
      includePvalueUuid = (fun[@u] _value -> false);
    }
  in
  let shallow_options =
    options_with_flags runtime (Rrbvec.of_array [| ("shallow-copy?", true) |])
  in
  let pages =
    !groups
    |> Rrbvec.map (fun (page, blocks) ->
        let blocks =
          blocks |> Rrbvec.to_array
          |> Tree_workflow.sortWith runtime datascript
          |> Support.Runtime_codec.array_to_vector runtime
        in
        build_blocks_export runtime datascript database include_all blocks
          shallow_options
        |> assoc runtime "page" (shallowCopyPageWith runtime datascript page))
  in
  let merged name =
    let values =
      pages
      |> Rrbvec.filter_map (fun page ->
          let value = field runtime page name in
          if Support.Runtime_codec.value_is_nil runtime value then None
          else Some value)
    in
    if Rrbvec.is_empty values then Support.Runtime_codec.nil_value runtime
    else merge_nested_maps runtime values
  in
  let page_entries =
    pages
    |> Rrbvec.map (fun page ->
        empty_map runtime
        |> assoc runtime "page" (field runtime page "page")
        |> assoc runtime "blocks" (field runtime page "blocks"))
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  empty_map runtime
  |> assoc runtime "properties" (merged "properties")
  |> assoc runtime "classes" (merged "classes")
  |> assoc runtime "pages-and-blocks" page_entries

let finalize_export_maps runtime datascript database export_maps =
  let final_export = mergeExportMapsWith runtime export_maps in
  let class_parents =
    let classes = field runtime final_export "classes" in
    if Support.Runtime_codec.value_is_nil runtime classes then
      Support.Runtime_codec.nil_value runtime
    else build_class_parents_export runtime datascript database classes
  in
  let merged =
    Support.Runtime_codec.array_to_vector runtime
      [| final_export; class_parents |]
    |> mergeExportMapsWith runtime
  in
  let pages = field runtime merged "pages-and-blocks" in
  if Support.Runtime_codec.value_is_nil runtime pages then merged
  else
    assoc runtime "pages-and-blocks"
      (Sqlite_export.sortPagesWith runtime pages)
      merged

let buildBlockExportWith runtime datascript database eid =
  let block = entity_required runtime datascript database eid "block" in
  let property_values =
    Support.Runtime_codec.map_dissoc runtime
      (property_map runtime block)
      (keyword runtime "block/tags")
    |> map_value_list runtime
    |> Rrbvec.filter (Support.Datascript.entity_is datascript)
  in
  let content_entities = Rrbvec.push_front property_values block in
  let content_export =
    build_content_ref_export runtime datascript database
      (content_entities |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
  in
  let content_uuids =
    field runtime content_export "content-ref-uuids" |> collection runtime
  in
  let predicates : export_predicates =
    {
      includeUuid =
        (fun[@u] uuid ->
          Rrbvec.exists
            (Support.Runtime_codec.value_equals runtime uuid)
            content_uuids);
      includePvalueUuid = (fun[@u] _value -> false);
    }
  in
  let node_export =
    build_node_export runtime datascript database predicates block
      (empty_map runtime)
  in
  let node = field runtime node_export "node" in
  let uuid_export =
    build_uuid_block_export runtime datascript database
      (pvalue_uuids runtime node)
      (field runtime content_export "content-ref-ents")
      (empty_map runtime)
  in
  let final =
    Support.Runtime_codec.array_to_vector runtime
      [| node_export; uuid_export; content_export |]
    |> finalize_export_maps runtime datascript database
  in
  merge_map runtime
    (empty_map runtime |> assoc runtime "logseq.db.sqlite.export/block" node)
    final

let map_values runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    value
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.map (function
      | [| _key; entry |] -> entry
      | _ -> invalid_arg "SQLite export expects map entries")

let map_keys runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    value
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.map (function
      | [| key; _entry |] -> key
      | _ -> invalid_arg "SQLite export expects map entries")

let rec fold_blocks runtime blocks initial transform =
  collection runtime blocks
  |> Rrbvec.fold_left
       (fun result block ->
         let result = transform result block in
         fold_blocks runtime
           (field runtime block "build/children")
           result transform)
       initial

let fold_field_values runtime values name result transform =
  values
  |> Rrbvec.fold_left
       (fun result value ->
         field runtime value name |> collection runtime
         |> Rrbvec.fold_left transform result)
       result

let internal_class runtime value =
  if not (Support.Runtime_codec.value_is_keyword runtime value) then false
  else
    match keyword_namespace runtime value with
    | Some namespace_ -> Melange_db.Class_read.logseq_class namespace_
    | None -> false

let internal_property runtime value =
  Melange_db.Property_identity.is_internal_property
    ~namespace_:(keyword_namespace runtime value)
    ~ident:(keyword_text runtime value)
    ~is_keyword:(Support.Runtime_codec.value_is_keyword runtime value)

let undefined_ontology runtime export_map =
  let classes = field runtime export_map "classes" in
  let properties = field runtime export_map "properties" in
  let pages =
    field runtime export_map "pages-and-blocks" |> collection runtime
  in
  let class_definitions = map_values runtime classes in
  let property_definitions = map_values runtime properties in
  let referenced_classes =
    fold_field_values runtime property_definitions "build/property-classes"
      Rrbvec.empty (add_distinct runtime)
    |> fun result ->
    class_definitions
    |> Rrbvec.fold_left
         (fun result definition ->
           add_distinct runtime result (field runtime definition "class/parent"))
         result
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           field runtime entry "page" |> fun page ->
           field runtime page "block/tags"
           |> collection runtime
           |> Rrbvec.fold_left (add_distinct runtime) result)
         result
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           fold_blocks runtime (field runtime entry "blocks") result
             (fun result block ->
               field runtime block "build/tags"
               |> collection runtime
               |> Rrbvec.fold_left (add_distinct runtime) result))
         result
    |> Rrbvec.filter (fun value -> not (internal_class runtime value))
  in
  let defined_classes = map_keys runtime classes in
  let undefined_classes =
    referenced_classes
    |> Rrbvec.filter (fun value ->
        not
          (Rrbvec.exists
             (Support.Runtime_codec.value_equals runtime value)
             defined_classes))
  in
  let referenced_properties =
    fold_field_values runtime class_definitions "build/class-properties"
      Rrbvec.empty (add_distinct runtime)
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           field runtime entry "page" |> fun page ->
           field runtime page "build/properties"
           |> map_keys runtime
           |> Rrbvec.fold_left (add_distinct runtime) result)
         result
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           fold_blocks runtime (field runtime entry "blocks") result
             (fun result block ->
               field runtime block "build/properties"
               |> map_keys runtime
               |> Rrbvec.fold_left (add_distinct runtime) result))
         result
    |> Rrbvec.filter (fun value -> not (internal_property runtime value))
  in
  let defined_properties = map_keys runtime properties in
  let undefined_properties =
    referenced_properties
    |> Rrbvec.filter (fun value ->
        not
          (Rrbvec.exists
             (Support.Runtime_codec.value_equals runtime value)
             defined_properties))
  in
  (undefined_classes, undefined_properties)

let alias_uuids runtime value result =
  field runtime value "block/alias"
  |> collection runtime
  |> Rrbvec.fold_left
       (fun result alias ->
         if not (Support.Runtime_codec.value_is_vector runtime alias) then
           result
         else
           match Support.Runtime_codec.vector_to_array runtime alias with
           | [| _attribute; uuid |] -> add_distinct runtime result uuid
           | _ -> result)
       result

let pvalue_reference_uuids runtime value result =
  field runtime value "build/properties"
  |> map_values runtime
  |> Rrbvec.fold_left
       (fun result property_value ->
         let values =
           if Support.Runtime_codec.value_is_set runtime property_value then
             Support.Runtime_codec.set_to_array runtime property_value
             |> Rrbvec.of_array
           else Rrbvec.singleton property_value
         in
         values
         |> Rrbvec.fold_left
              (fun result value ->
                if not (Support.Runtime_codec.value_is_vector runtime value)
                then result
                else
                  match
                    Support.Runtime_codec.vector_to_array runtime value
                  with
                  | [| marker; uuid |]
                    when Support.Runtime_codec.value_equals runtime marker
                           (keyword runtime "block/uuid") ->
                      let metadata =
                        Support.Runtime_codec.value_meta runtime value
                      in
                      if
                        Support.Runtime_codec.value_is_nil runtime metadata
                        || not
                             (field runtime metadata
                                "logseq.db.sqlite.export/existing-property-value?"
                             |> Support.Runtime_codec.value_truthy runtime)
                      then result
                      else add_distinct runtime result uuid
                  | _ -> result)
              result)
       result

let undefined_uuids runtime datascript database export_map =
  let classes = field runtime export_map "classes" |> map_values runtime in
  let properties =
    field runtime export_map "properties" |> map_values runtime
  in
  let pages =
    field runtime export_map "pages-and-blocks" |> collection runtime
  in
  let definitions = Rrbvec.append classes properties in
  let known =
    definitions
    |> Rrbvec.fold_left
         (fun result value ->
           add_distinct runtime result (field runtime value "block/uuid"))
         Rrbvec.empty
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           let page = field runtime entry "page" in
           add_distinct runtime result (field runtime page "block/uuid"))
         result
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           fold_blocks runtime (field runtime entry "blocks") result
             (fun result block ->
               add_distinct runtime result (field runtime block "block/uuid")))
         result
    |> fun result ->
    let rec nested result value =
      let result =
        if Sqlite_build.blockPropertyValueWith runtime value then
          add_distinct runtime result (field runtime value "block/uuid")
        else result
      in
      if Support.Runtime_codec.value_is_map runtime value then
        value
        |> Support.Runtime_codec.map_to_entries runtime
        |> Rrbvec.of_array
        |> Rrbvec.fold_left
             (fun result -> function
               | [| key; item |] -> nested (nested result key) item
               | _ -> result)
             result
      else if
        Support.Runtime_codec.value_is_vector runtime value
        || Support.Runtime_codec.value_is_set runtime value
        || Support.Runtime_codec.value_is_sequential runtime value
      then
        value
        |> Support.Runtime_codec.collection_to_array runtime
        |> Rrbvec.of_array
        |> Rrbvec.fold_left nested result
      else result
    in
    nested result (field runtime export_map "pages-and-blocks")
  in
  let referenced =
    definitions
    |> Rrbvec.fold_left
         (fun result value ->
           result |> alias_uuids runtime value
           |> pvalue_reference_uuids runtime value)
         Rrbvec.empty
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           let page = field runtime entry "page" in
           result |> alias_uuids runtime page
           |> pvalue_reference_uuids runtime page)
         result
    |> fun result ->
    pages
    |> Rrbvec.fold_left
         (fun result entry ->
           fold_blocks runtime (field runtime entry "blocks") result
             (fun result block -> pvalue_reference_uuids runtime block result))
         result
    |> Rrbvec.filter (fun uuid ->
        let lookup = lookup_uuid runtime uuid in
        match entity runtime datascript database lookup with
        | None -> true
        | Some value ->
            entity_field runtime datascript value
              "logseq.property/created-from-property"
            |> Support.Runtime_codec.value_is_nil runtime)
  in
  referenced
  |> Rrbvec.filter (fun uuid ->
      not
        (Rrbvec.exists
           (Support.Runtime_codec.value_equals runtime uuid)
           known))

let validateBuildExportWith runtime datascript database export_map options =
  if datom_export runtime export_map then ()
  else
    let cleaned = remove_export_keys runtime export_map in
    let graph_options = field runtime options "graph-options" in
    let excludes =
      field runtime graph_options "exclude-namespaces" |> collection runtime
    in
    if Rrbvec.is_empty excludes then
      Sqlite_build_workflow.validateOptionsWith runtime cleaned;
    let undefined_classes, undefined_properties =
      if Rrbvec.is_empty excludes then undefined_ontology runtime cleaned
      else (Rrbvec.empty, Rrbvec.empty)
    in
    let undefined_uuid_values =
      undefined_uuids runtime datascript database cleaned
    in
    if
      not
        (Rrbvec.is_empty undefined_classes
        && Rrbvec.is_empty undefined_properties
        && Rrbvec.is_empty undefined_uuid_values)
    then
      let section label values =
        if Rrbvec.is_empty values then ""
        else
          let rendered =
            values
            |> Rrbvec.fold_left
                 (fun result value ->
                   let value =
                     Support.Runtime_codec.value_to_string runtime value
                   in
                   if String.length result = 0 then value
                   else result ^ ", " ^ value)
                 ""
          in
          label ^ " [" ^ rendered ^ "] "
      in
      Js.Exn.raiseError
        ("The following classes, uuids and properties are not defined: "
        ^ section "classes" undefined_classes
        ^ section "properties" undefined_properties
        ^ section "uuids" undefined_uuid_values)

let referenced_uuid runtime references uuid =
  (not (Support.Runtime_codec.value_is_nil runtime uuid))
  && Rrbvec.exists
       (Support.Runtime_codec.value_equals runtime uuid)
       references

let map_update_values runtime value transform =
  if Support.Runtime_codec.value_is_nil runtime value then value
  else
    value
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.map (function
      | [| key; item |] -> [| key; transform item |]
      | _ -> invalid_arg "SQLite export expects map entries")
    |> Support.Runtime_codec.entries_to_map runtime

let rec prune_export_entity runtime references value =
  let uuid = field runtime value "block/uuid" in
  let value =
    if referenced_uuid runtime references uuid then value
    else
      let value =
        Support.Runtime_codec.map_dissoc runtime value
          (keyword runtime "block/uuid")
      in
      Support.Runtime_codec.map_dissoc runtime value
        (keyword runtime "build/keep-uuid?")
  in
  let properties = field runtime value "build/properties" in
  if Support.Runtime_codec.value_is_nil runtime properties then value
  else
    assoc runtime "build/properties"
      (map_update_values runtime properties (fun property_value ->
           if Support.Runtime_codec.value_is_set runtime property_value then
             property_value
             |> Support.Runtime_codec.set_to_array runtime
             |> Array.map (shrink_property_value runtime references)
             |> Support.Runtime_codec.array_to_set runtime
           else shrink_property_value runtime references property_value))
      value

and shrink_property_value runtime references value =
  if not (Sqlite_build.blockPropertyValueWith runtime value) then value
  else
    let uuid = field runtime value "block/uuid" in
    let unique_attributes =
      Rrbvec.of_array [| "build/tags"; "build/properties"; "build/children" |]
      |> Rrbvec.exists (fun name ->
          field runtime value name
          |> Support.Runtime_codec.value_truthy runtime)
    in
    if
      Domain.keep_uuid
        ~referenced:(referenced_uuid runtime references uuid)
        ~unique_attributes
    then value
    else field runtime value "block/title"

let rec prune_export_blocks runtime references blocks =
  collection runtime blocks
  |> Rrbvec.map (fun block ->
      let children = field runtime block "build/children" in
      let block = prune_export_entity runtime references block in
      if Support.Runtime_codec.value_is_nil runtime children then block
      else
        assoc runtime "build/children"
          (prune_export_blocks runtime references children)
          block)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_vector runtime

let pruneUnreferencedUuidsWith runtime export_map all_references =
  let references = collection runtime all_references in
  let definitions name export_map =
    let value = field runtime export_map name in
    if Support.Runtime_codec.value_is_nil runtime value then export_map
    else
      assoc runtime name
        (map_update_values runtime value
           (prune_export_entity runtime references))
        export_map
  in
  let export_map =
    export_map |> definitions "classes" |> definitions "properties"
  in
  let pages = field runtime export_map "pages-and-blocks" in
  if Support.Runtime_codec.value_is_nil runtime pages then export_map
  else
    let pages =
      collection runtime pages
      |> Rrbvec.map (fun entry ->
          let page =
            field runtime entry "page" |> prune_export_entity runtime references
          in
          let blocks = field runtime entry "blocks" in
          let entry = assoc runtime "page" page entry in
          let entry =
            if Support.Runtime_codec.value_is_nil runtime blocks then entry
            else
              assoc runtime "blocks"
                (prune_export_blocks runtime references blocks)
                entry
          in
          postwalk runtime
            (fun value ->
              if Sqlite_build.blockPropertyValueWith runtime value then
                prune_export_entity runtime references value
              else value)
            entry)
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime
    in
    assoc runtime "pages-and-blocks" pages export_map

let page_blocks runtime datascript database eid =
  Support.Datascript.datoms datascript database (keyword runtime "avet")
    [| keyword runtime "block/page"; eid |]
  |> Array.to_seq
  |> Seq.filter_map (fun datom ->
      Support.Datascript.datom_entity datascript datom
      |> entity runtime datascript database)
  |> Array.of_seq
  |> Support.Runtime_codec.array_to_vector runtime

let build_page_blocks_export runtime datascript database predicates page options
    =
  let node_options =
    dissoc_names runtime
      (Rrbvec.of_array [| "classes"; "blocks"; "graph-ontology" |])
      options
  in
  let node_options =
    if not (option_bool runtime options "exclude-ontology?") then node_options
    else
      let ontology_properties =
        field runtime options "graph-ontology" |> fun ontology ->
        field runtime ontology "properties"
      in
      assoc runtime "properties" ontology_properties node_options
  in
  let page_export =
    if option_bool runtime options "ontology-page?" then
      let node =
        empty_map runtime
        |> assoc runtime "block/uuid"
             (required_entity_field runtime datascript page "block/uuid")
      in
      empty_map runtime |> assoc runtime "node" node
    else
      build_node_export runtime datascript database predicates page node_options
  in
  let node = field runtime page_export "node" in
  let page_pvalue_uuids = pvalue_uuids runtime node in
  let built_page =
    if option_bool runtime options "ontology-page?" then node
    else
      let node_without_title =
        Support.Runtime_codec.map_dissoc runtime node
          (keyword runtime "block/title")
      in
      let result =
        merge_map runtime node_without_title
          (shallowCopyPageWith runtime datascript page)
      in
      let aliases =
        entity_field runtime datascript page "block/alias" |> collection runtime
      in
      if
        (not (option_bool runtime options "include-alias?"))
        || Rrbvec.is_empty aliases
      then result
      else
        aliases
        |> Rrbvec.map (entity_uuid_lookup runtime datascript)
        |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_set runtime
        |> fun aliases -> assoc runtime "block/alias" aliases result
  in
  let blocks =
    let blocks = field runtime options "blocks" in
    if Support.Runtime_codec.value_is_nil runtime blocks then
      Support.Runtime_codec.array_to_vector runtime [||]
    else blocks
  in
  let page_entry =
    empty_map runtime
    |> assoc runtime "page" built_page
    |> assoc runtime "blocks" blocks
  in
  let blocks_export =
    empty_map runtime
    |> assoc runtime "pages-and-blocks"
         (Support.Runtime_codec.array_to_vector runtime [| page_entry |])
    |> assoc runtime "properties" (field runtime options "properties")
    |> assoc runtime "classes" (field runtime options "classes")
  in
  Support.Runtime_codec.array_to_vector runtime
    [| blocks_export; page_export |]
  |> mergeExportMapsWith runtime
  |> assoc runtime "pvalue-uuids" page_pvalue_uuids

let removeUuidIfNotRefWith runtime references value =
  prune_export_entity runtime (collection runtime references) value

let pvalue_descendant runtime datascript block =
  let rec loop parent =
    if Support.Runtime_codec.value_is_nil runtime parent then false
    else
      let created_from =
        entity_field runtime datascript parent
          "logseq.property/created-from-property"
      in
      if not (Support.Runtime_codec.value_is_nil runtime created_from) then
        true
      else loop (entity_field runtime datascript parent "block/parent")
  in
  loop (entity_field runtime datascript block "block/parent")

let union_values runtime left right =
  right |> collection runtime
  |> Rrbvec.fold_left (add_distinct_value runtime) left

let build_page_export_core runtime datascript database predicates included_uuids
    eid page_blocks_value options =
  let page = entity_required runtime datascript database eid "page" in
  let page_blocks =
    page_blocks_value |> collection runtime |> Rrbvec.to_array
    |> Tree_workflow.sortWith runtime datascript
    |> Rrbvec.of_array
    |> Rrbvec.filter (fun block ->
        entity_field runtime datascript block
          "logseq.property/created-from-property"
        |> Support.Runtime_codec.value_is_nil runtime
        && not (pvalue_descendant runtime datascript block))
  in
  let handle_block_uuids = option_bool runtime options "handle-block-uuids?" in
  let block_predicates =
    if not handle_block_uuids then predicates
    else { predicates with includeUuid = (fun[@u] _value -> true) }
  in
  let blocks_export =
    build_blocks_export runtime datascript database block_predicates
      (page_blocks |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      options
  in
  let blocks_export =
    if not handle_block_uuids then blocks_export
    else
      let references =
        field runtime blocks_export "pvalue-uuids" |> collection runtime
        |> fun values -> union_values runtime values included_uuids
      in
      assoc runtime "blocks"
        (prune_export_blocks runtime references
           (field runtime blocks_export "blocks"))
        blocks_export
  in
  let ontology_page = option_bool runtime options "ontology-page?" in
  let ontology_export =
    if
      ontology_page
      || not
           (Entity_read.classWith runtime datascript page
           || Entity_read.propertyWith runtime datascript page)
    then Support.Runtime_codec.nil_value runtime
    else
      build_mixed_properties_and_classes runtime datascript database
        (Support.Runtime_codec.array_to_vector runtime [| page |])
        (options_with_flags runtime
           (Rrbvec.of_array [| ("include-uuid?", true) |]))
  in
  let class_page_properties =
    if ontology_page || not (Entity_read.classWith runtime datascript page)
    then Support.Runtime_codec.nil_value runtime
    else
      let property_idents =
        entity_field runtime datascript page "logseq.property.class/properties"
        |> collection runtime
        |> Rrbvec.map (fun property ->
            required_entity_field runtime datascript property "db/ident")
      in
      if Rrbvec.is_empty property_idents then
        Support.Runtime_codec.nil_value runtime
      else
        empty_map runtime
        |> assoc runtime "properties"
             (build_export_properties runtime datascript database
                false_predicates
                (property_idents |> Rrbvec.to_array
                |> Support.Runtime_codec.array_to_vector runtime)
                (options_with_flags runtime
                   (Rrbvec.of_array [| ("shallow-copy?", true) |])))
  in
  let page_options =
    if Support.Runtime_codec.value_is_nil runtime ontology_export then
      blocks_export
    else
      Support.Runtime_codec.array_to_vector runtime
        [| blocks_export; ontology_export; class_page_properties |]
      |> mergeExportMapsWith runtime
  in
  let page_options =
    merge_map runtime page_options options
    |> assoc runtime "blocks" (field runtime blocks_export "blocks")
  in
  let page_options =
    if Support.Runtime_codec.value_is_nil runtime ontology_export then
      page_options
    else
      assoc runtime "ontology-page?"
        (Support.Runtime_codec.bool_to_value runtime true)
        page_options
  in
  let page_export =
    build_page_blocks_export runtime datascript database predicates page
      page_options
  in
  let pvalue_uuids =
    field runtime blocks_export "pvalue-uuids" |> collection runtime
    |> fun values ->
    union_values runtime values (field runtime page_export "pvalue-uuids")
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_set runtime
  in
  assoc runtime "pvalue-uuids" pvalue_uuids page_export

let buildPageExportWith runtime datascript database eid =
  let blocks = page_blocks runtime datascript database eid in
  let content_export =
    build_content_ref_export runtime datascript database blocks
  in
  let content_uuids =
    field runtime content_export "content-ref-uuids" |> collection runtime
  in
  let include_content uuid =
    Rrbvec.exists
      (Support.Runtime_codec.value_equals runtime uuid)
      content_uuids
  in
  let predicates : export_predicates =
    {
      includeUuid = (fun[@u] uuid -> include_content uuid);
      includePvalueUuid = (fun[@u] uuid -> include_content uuid);
    }
  in
  let core_options =
    options_with_flags runtime
      (Rrbvec.of_array
         [| ("handle-block-uuids?", true); ("include-alias?", true) |])
  in
  let page_export =
    build_page_export_core runtime datascript database predicates
      (field runtime content_export "content-ref-uuids")
      eid blocks core_options
  in
  let page = entity_required runtime datascript database eid "page" in
  let uuid_options = empty_map runtime |> assoc runtime "page-entity" page in
  let uuid_export =
    build_uuid_block_export runtime datascript database
      (field runtime page_export "pvalue-uuids")
      (field runtime content_export "content-ref-ents")
      uuid_options
  in
  let aliases =
    entity_field runtime datascript page "block/alias" |> collection runtime
  in
  let alias_export =
    if Rrbvec.is_empty aliases then Support.Runtime_codec.nil_value runtime
    else
      let pages =
        aliases
        |> Rrbvec.map (fun alias ->
            let page =
              shallowCopyPageWith runtime datascript alias
              |> assoc runtime "block/uuid"
                   (required_entity_field runtime datascript alias "block/uuid")
              |> assoc runtime "build/keep-uuid?"
                   (Support.Runtime_codec.bool_to_value runtime true)
            in
            empty_map runtime |> assoc runtime "page" page)
        |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_vector runtime
      in
      empty_map runtime |> assoc runtime "pages-and-blocks" pages
  in
  Support.Runtime_codec.array_to_vector runtime
    [| page_export; uuid_export; content_export; alias_export |]
  |> finalize_export_maps runtime datascript database

let entity_is_page runtime datascript entity =
  match
    Entity_read.pageWith runtime datascript entity |> Js.Nullable.toOption
  with
  | Some true -> true
  | Some false | None -> false

let entity_property_values runtime datascript entity =
  property_map runtime entity
  |> dissoc_catalog runtime public_attribute_names
  |> map_value_list runtime
  |> Rrbvec.filter (Support.Datascript.entity_is datascript)

let build_nodes_export runtime datascript database predicates nodes options =
  let nodes = collection runtime nodes in
  let pages = nodes |> Rrbvec.filter (entity_is_page runtime datascript) in
  let page_options =
    options_with_flags runtime (Rrbvec.of_array [| ("shallow-copy?", true) |])
  in
  let pages_export =
    let mixed =
      build_mixed_properties_and_classes runtime datascript database
        (pages |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_vector runtime)
        page_options
    in
    let entries =
      pages
      |> Rrbvec.filter (fun page ->
          Entity_read.internalPageWith runtime datascript page
          || Entity_read.journalWith runtime datascript page)
      |> Rrbvec.map (fun page ->
          empty_map runtime
          |> assoc runtime "page" (shallowCopyPageWith runtime datascript page))
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime
    in
    assoc runtime "pages-and-blocks" entries mixed
  in
  let block_groups = ref Rrbvec.empty in
  nodes
  |> Rrbvec.filter (fun node -> not (entity_is_page runtime datascript node))
  |> Rrbvec.iter (fun block ->
      let page = required_entity_field runtime datascript block "block/page" in
      if
        !block_groups
        |> Rrbvec.exists (fun (existing, _blocks) ->
            Support.Runtime_codec.value_equals runtime existing page)
      then
        block_groups :=
          !block_groups
          |> Rrbvec.map (fun (existing, blocks) ->
              if Support.Runtime_codec.value_equals runtime existing page
              then (existing, Rrbvec.push_back blocks block)
              else (existing, blocks))
      else
        block_groups :=
          Rrbvec.push_back !block_groups (page, Rrbvec.singleton block));
  let page_blocks =
    !block_groups
    |> Rrbvec.map (fun (page, blocks) ->
        let blocks =
          blocks |> Rrbvec.to_array
          |> Tree_workflow.sortWith runtime datascript
          |> Support.Runtime_codec.array_to_vector runtime
        in
        build_blocks_export runtime datascript database predicates blocks
          options
        |> assoc runtime "page" (shallowCopyPageWith runtime datascript page))
  in
  let merged_definitions name =
    let values =
      page_blocks
      |> Rrbvec.filter_map (fun entry ->
          let value = field runtime entry name in
          if Support.Runtime_codec.value_is_nil runtime value then None
          else Some value)
    in
    if Rrbvec.is_empty values then Support.Runtime_codec.nil_value runtime
    else merge_nested_maps runtime values
  in
  let block_entries =
    page_blocks
    |> Rrbvec.map (fun entry ->
        empty_map runtime
        |> assoc runtime "page" (field runtime entry "page")
        |> assoc runtime "blocks" (field runtime entry "blocks"))
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  let blocks_export =
    empty_map runtime
    |> assoc runtime "properties" (merged_definitions "properties")
    |> assoc runtime "classes" (merged_definitions "classes")
    |> assoc runtime "pages-and-blocks" block_entries
  in
  let merged =
    Support.Runtime_codec.array_to_vector runtime
      [| pages_export; blocks_export |]
    |> mergeExportMapsWith runtime
  in
  let pvalue_uuids =
    page_blocks
    |> Rrbvec.fold_left
         (fun result entry ->
           union_values runtime result (field runtime entry "pvalue-uuids"))
         Rrbvec.empty
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_set runtime
  in
  assoc runtime "pvalue-uuids" pvalue_uuids merged

let entities_with_property_values runtime datascript entities =
  entities
  |> Rrbvec.fold_left
       (fun result entity ->
         entity_property_values runtime datascript entity
         |> Rrbvec.fold_left (add_distinct_value runtime) result)
       entities

let build_view_nodes_export runtime datascript database rows options =
  let eids =
    let rows = collection runtime rows in
    if not (option_bool runtime options "group-by?") then rows
    else
      rows
      |> Rrbvec.fold_left
           (fun result row ->
             let values = collection runtime row in
             if Rrbvec.length values < 2 then
               invalid_arg "SQLite view export group requires rows";
             union_values runtime result (Rrbvec.nth values 1))
           Rrbvec.empty
  in
  let nodes =
    eids
    |> Rrbvec.map (fun eid ->
        entity_required runtime datascript database eid "view node")
  in
  let content_entities =
    entities_with_property_values runtime datascript nodes
  in
  let content_export =
    build_content_ref_export runtime datascript database
      (content_entities |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
  in
  let content_uuids =
    field runtime content_export "content-ref-uuids" |> collection runtime
  in
  let predicates : export_predicates =
    {
      includeUuid =
        (fun[@u] uuid ->
          Rrbvec.exists
            (Support.Runtime_codec.value_equals runtime uuid)
            content_uuids);
      includePvalueUuid = (fun[@u] _value -> false);
    }
  in
  let node_options =
    options_with_flags runtime
      (Rrbvec.of_array [| ("include-children?", false) |])
  in
  let nodes_export =
    build_nodes_export runtime datascript database predicates
      (nodes |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      node_options
  in
  let uuid_export =
    build_uuid_block_export runtime datascript database
      (field runtime nodes_export "pvalue-uuids")
      (field runtime content_export "content-ref-ents")
      (empty_map runtime)
  in
  Support.Runtime_codec.array_to_vector runtime
    [| nodes_export; uuid_export; content_export |]
  |> finalize_export_maps runtime datascript database

let buildSelectedNodesExportWith runtime datascript database eids =
  let top_nodes =
    eids |> collection runtime
    |> Rrbvec.filter_map (entity runtime datascript database)
  in
  let nodes =
    top_nodes
    |> Rrbvec.fold_left
         (fun result node ->
           if entity_is_page runtime datascript node then result
           else
             let uuid =
               required_entity_field runtime datascript node "block/uuid"
             in
             let descendants =
               Tree_workflow.blockAndChildrenWith runtime datascript
                 database uuid false
               |> Js.Nullable.toOption |> Option.map Rrbvec.of_array
               |> Option.value ~default:Rrbvec.empty
             in
             match Rrbvec.pop_front descendants with
             | None -> result
             | Some (_root, children) ->
                 children
                 |> Rrbvec.filter (fun child ->
                     entity_field runtime datascript child
                       "logseq.property/created-from-property"
                     |> Support.Runtime_codec.value_is_nil runtime)
                 |> Rrbvec.fold_left (add_distinct_value runtime) result)
         top_nodes
  in
  let content_entities =
    entities_with_property_values runtime datascript nodes
  in
  let content_export =
    build_content_ref_export runtime datascript database
      (content_entities |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
  in
  let content_uuids =
    field runtime content_export "content-ref-uuids" |> collection runtime
  in
  let predicates : export_predicates =
    {
      includeUuid =
        (fun[@u] uuid ->
          Rrbvec.exists
            (Support.Runtime_codec.value_equals runtime uuid)
            content_uuids);
      includePvalueUuid = (fun[@u] _value -> false);
    }
  in
  let node_options =
    options_with_flags runtime
      (Rrbvec.of_array [| ("include-children?", true) |])
  in
  let nodes_export =
    build_nodes_export runtime datascript database predicates
      (nodes |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      node_options
  in
  let uuid_export =
    build_uuid_block_export runtime datascript database
      (field runtime nodes_export "pvalue-uuids")
      (field runtime content_export "content-ref-ents")
      (empty_map runtime)
  in
  Support.Runtime_codec.array_to_vector runtime
    [| nodes_export; uuid_export; content_export |]
  |> finalize_export_maps runtime datascript database

let tagged_entities runtime datascript database tag =
  Support.Datascript.datoms datascript database (keyword runtime "avet")
    [| keyword runtime "block/tags"; keyword runtime tag |]
  |> Array.fold_left
       (fun result datom ->
         match
           Support.Datascript.datom_entity datascript datom
           |> entity runtime datascript database
         with
         | None -> result
         | Some entity -> add_distinct_value runtime result entity)
       Rrbvec.empty

let keyword_local_name runtime value =
  let text = keyword_text runtime value in
  match String.rindex_opt text '/' with
  | None -> text
  | Some index -> String.sub text (index + 1) (String.length text - index - 1)

let ident_namespace runtime ident =
  let text = keyword_text runtime ident in
  match String.rindex_opt text '/' with
  | None -> ""
  | Some index -> String.sub text 0 index

let excluded_namespace runtime exclusions ident =
  let namespace_ = ident_namespace runtime ident in
  exclusions
  |> Rrbvec.exists (fun exclusion ->
      let prefix = keyword_local_name runtime exclusion in
      String.equal namespace_ prefix
      || String.starts_with ~prefix:(prefix ^ ".") namespace_)

let buildGraphOntologyWith runtime datascript database options =
  let exclusions =
    field runtime options "exclude-namespaces" |> collection runtime
  in
  let user_properties =
    tagged_entities runtime datascript database "logseq.class/Property"
    |> Rrbvec.filter (fun property ->
        not
          (entity_field runtime datascript property "logseq.property/built-in?"
          |> Support.Runtime_codec.value_truthy runtime))
    |> Rrbvec.map (fun property ->
        required_entity_field runtime datascript property "db/ident")
    |> Rrbvec.filter (fun ident ->
        not (excluded_namespace runtime exclusions ident))
  in
  let property_options =
    assoc runtime "include-properties?"
      (Support.Runtime_codec.bool_to_value runtime true)
      options
  in
  let properties =
    build_export_properties runtime datascript database false_predicates
      (user_properties |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      property_options
  in
  let classes =
    tagged_entities runtime datascript database "logseq.class/Tag"
    |> Rrbvec.filter (fun class_entity ->
        not
          (entity_field runtime datascript class_entity
             "logseq.property/built-in?"
          |> Support.Runtime_codec.value_truthy runtime))
    |> Rrbvec.filter (fun class_entity ->
        let ident =
          required_entity_field runtime datascript class_entity "db/ident"
        in
        not (excluded_namespace runtime exclusions ident))
    |> Rrbvec.fold_left
         (fun result class_entity ->
           let ident =
             required_entity_field runtime datascript class_entity "db/ident"
           in
           let entity_properties =
             property_map runtime class_entity
             |> dissoc_names runtime
                  (Rrbvec.of_array [| "logseq.property.class/extends" |])
             |> dissoc_catalog runtime public_attribute_names
           in
           let build_properties =
             Support.Runtime_codec.map_dissoc runtime
               (buildable_properties runtime datascript database
                  false_predicates entity_properties properties options)
               (keyword runtime "logseq.property.class/properties")
           in
           let definition =
             buildExportClassWith runtime datascript class_entity
               (option_bool runtime options "include-uuid?")
               (option_bool runtime options "shallow-copy?")
               (option_bool runtime options "include-timestamps?")
               (option_bool runtime options "include-alias?")
           in
           let definition =
             if nonempty_map runtime build_properties then
               assoc runtime "build/properties" build_properties definition
             else definition
           in
           Support.Runtime_codec.map_assoc runtime result ident definition)
         (empty_map runtime)
  in
  let result = empty_map runtime in
  let result =
    if nonempty_map runtime properties then
      assoc runtime "properties" properties result
    else result
  in
  if nonempty_map runtime classes then assoc runtime "classes" classes result
  else result

let first_page runtime export =
  let pages = field runtime export "pages-and-blocks" |> collection runtime in
  if Rrbvec.is_empty pages then None else Some (Rrbvec.nth pages 0)

let lookup_uuid_value runtime value =
  if not (Support.Runtime_codec.value_is_vector runtime value) then None
  else
    match Support.Runtime_codec.vector_to_array runtime value with
    | [| attribute; uuid |]
      when Support.Runtime_codec.value_equals runtime attribute
             (keyword runtime "block/uuid") ->
        Some uuid
    | _ -> None

let buildGraphPagesWith runtime datascript database graph_ontology options =
  let exclusions =
    field runtime options "exclude-namespaces" |> collection runtime
  in
  let options = assoc runtime "graph-ontology" graph_ontology options in
  let options =
    if not (Rrbvec.is_empty exclusions) then options
    else
      assoc runtime "exclude-ontology?"
        (Support.Runtime_codec.bool_to_value runtime true)
        options
  in
  let page_entities =
    Rrbvec.append
      (tagged_entities runtime datascript database "logseq.class/Page")
      (tagged_entities runtime datascript database "logseq.class/Journal")
    |> Rrbvec.fold_left (add_distinct_value runtime) Rrbvec.empty
  in
  let ontology_entities =
    Rrbvec.append
      (tagged_entities runtime datascript database "logseq.class/Tag")
      (tagged_entities runtime datascript database "logseq.class/Property")
    |> Rrbvec.fold_left (add_distinct_value runtime) Rrbvec.empty
  in
  let include_all : export_predicates =
    {
      includeUuid = (fun[@u] _value -> true);
      includePvalueUuid = (fun[@u] _value -> true);
    }
  in
  let page_exports =
    page_entities
    |> Rrbvec.map (fun page ->
        let eid = required_entity_field runtime datascript page "db/id" in
        build_page_export_core runtime datascript database include_all
          (Support.Runtime_codec.nil_value runtime)
          eid
          (page_blocks runtime datascript database eid)
          options)
  in
  let ontology_options =
    assoc runtime "ontology-page?"
      (Support.Runtime_codec.bool_to_value runtime true)
      options
  in
  let ontology_exports =
    ontology_entities
    |> Rrbvec.filter_map (fun page ->
        let eid = required_entity_field runtime datascript page "db/id" in
        let blocks =
          page_blocks runtime datascript database eid
          |> collection runtime
          |> Rrbvec.filter (fun block ->
              entity_field runtime datascript block
                "logseq.property/created-from-property"
              |> Support.Runtime_codec.value_is_nil runtime)
        in
        if Rrbvec.is_empty blocks then None
        else
          Some
            (build_page_export_core runtime datascript database include_all
               (Support.Runtime_codec.nil_value runtime)
               eid
               (blocks |> Rrbvec.to_array
               |> Support.Runtime_codec.array_to_vector runtime)
               ontology_options))
  in
  let exports = Rrbvec.append page_exports ontology_exports in
  let exports =
    if not (option_bool runtime options "exclude-built-in-pages?") then exports
    else
      exports
      |> Rrbvec.filter (fun export ->
          match first_page runtime export with
          | None -> true
          | Some entry ->
              field runtime entry "page" |> fun page ->
              field runtime page "build/properties" |> fun properties ->
              field runtime properties "logseq.property/built-in?"
              |> Support.Runtime_codec.value_truthy runtime
              |> not)
  in
  let alias_uuids_from_definitions definitions result =
    definitions |> map_value_list runtime
    |> Rrbvec.fold_left
         (fun result definition ->
           field runtime definition "block/alias"
           |> collection runtime
           |> Rrbvec.fold_left
                (fun result lookup ->
                  match lookup_uuid_value runtime lookup with
                  | None -> result
                  | Some uuid -> add_distinct_value runtime result uuid)
                result)
         result
  in
  let alias_uuids =
    exports
    |> Rrbvec.fold_left
         (fun result export ->
           field runtime export "pages-and-blocks"
           |> collection runtime
           |> Rrbvec.fold_left
                (fun result entry ->
                  field runtime entry "page" |> fun page ->
                  field runtime page "block/alias"
                  |> collection runtime
                  |> Rrbvec.fold_left
                       (fun result lookup ->
                         match lookup_uuid_value runtime lookup with
                         | None -> result
                         | Some uuid -> add_distinct_value runtime result uuid)
                       result)
                result)
         Rrbvec.empty
    |> alias_uuids_from_definitions (field runtime graph_ontology "classes")
    |> alias_uuids_from_definitions (field runtime graph_ontology "properties")
  in
  let uuids_to_keep =
    exports
    |> Rrbvec.fold_left
         (fun result export ->
           union_values runtime result (field runtime export "pvalue-uuids"))
         alias_uuids
    |> fun result ->
    ontology_exports
    |> Rrbvec.fold_left
         (fun result export ->
           match first_page runtime export with
           | None -> result
           | Some entry ->
               field runtime entry "page" |> fun page ->
               field runtime page "block/uuid"
               |> add_distinct_value runtime result)
         result
  in
  let pages =
    exports
    |> Rrbvec.fold_left
         (fun result export ->
           field runtime export "pages-and-blocks"
           |> collection runtime
           |> Rrbvec.fold_left Rrbvec.push_back result)
         Rrbvec.empty
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  empty_map runtime
  |> assoc runtime "pages-and-blocks" pages
  |> assoc runtime "pvalue-uuids"
       (uuids_to_keep |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_set runtime)

let history_reference_uuids runtime history =
  history |> collection runtime
  |> Rrbvec.fold_left
       (fun result entry ->
         Rrbvec.of_array
           [|
             field runtime entry "logseq.property.history/block";
             field runtime entry "logseq.property.history/ref-value";
           |]
         |> Rrbvec.fold_left
              (fun result lookup ->
                match lookup_uuid_value runtime lookup with
                | None -> result
                | Some uuid -> add_distinct_value runtime result uuid)
              result)
       Rrbvec.empty

let buildGraphHumanWith runtime datascript database schema_version options =
  let options =
    options
    |> assoc runtime "property-value-uuids?"
         (Support.Runtime_codec.bool_to_value runtime true)
    |> assoc runtime "include-alias?"
         (Support.Runtime_codec.bool_to_value runtime true)
  in
  let content_uuids =
    graphContentRefUuidsWith runtime datascript database
      (option_bool runtime options "exclude-built-in-pages?")
  in
  let ontology_options =
    assoc runtime "include-uuid?"
      (Support.Runtime_codec.bool_to_value runtime true)
      options
  in
  let ontology =
    buildGraphOntologyWith runtime datascript database ontology_options
  in
  let ontology_pvalue_uuids =
    Rrbvec.append
      (field runtime ontology "properties" |> map_value_list runtime)
      (field runtime ontology "classes" |> map_value_list runtime)
    |> Rrbvec.fold_left
         (fun result definition ->
           union_values runtime result (pvalue_uuids runtime definition))
         Rrbvec.empty
  in
  let pages =
    buildGraphPagesWith runtime datascript database ontology options
  in
  let graph_export =
    Support.Runtime_codec.map_dissoc runtime
      (merge_map runtime ontology pages)
      (keyword runtime "pvalue-uuids")
  in
  let exclusions = field runtime options "exclude-namespaces" in
  let graph_export =
    if Rrbvec.is_empty (collection runtime exclusions) then graph_export
    else
      assoc runtime "logseq.db.sqlite.export/auto-include-namespaces" exclusions
        graph_export
  in
  let history = propertyHistoryWith runtime datascript database in
  let references =
    content_uuids |> collection runtime |> fun values ->
    union_values runtime values
      (ontology_pvalue_uuids |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_set runtime)
    |> fun values ->
    union_values runtime values (field runtime pages "pvalue-uuids")
    |> fun values ->
    union_values runtime values
      (history_reference_uuids runtime history
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_set runtime)
  in
  let graph_export =
    pruneUnreferencedUuidsWith runtime graph_export
      (references |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_set runtime)
  in
  let graph_export =
    assoc runtime "pages-and-blocks"
      (field runtime graph_export "pages-and-blocks"
      |> Sqlite_export.sortPagesWith runtime)
      graph_export
    |> assoc runtime "logseq.db.sqlite.export/schema-version"
         (Support.Runtime_codec.string_to_value runtime schema_version)
  in
  let graph_export =
    if option_bool runtime options "exclude-files?" then graph_export
    else
      assoc runtime "logseq.db.sqlite.export/graph-files"
        (graphFilesWith runtime datascript database
           (option_bool runtime options "include-timestamps?"))
        graph_export
  in
  graph_export
  |> assoc runtime "logseq.db.sqlite.export/kv-values"
       (kvValuesWith runtime datascript database)
  |> assoc runtime "logseq.db.sqlite.export/property-history" history

let buildExportWith runtime datascript database
    (capabilities : export_capabilities) schema_version options =
  let export_type = field runtime options "export-type" in
  let export_type_name = keyword_text runtime export_type in
  let export =
    match export_type_name with
    | "block" ->
        buildBlockExportWith runtime datascript database
          (field runtime options "block-id")
    | "page" ->
        buildPageExportWith runtime datascript database
          (field runtime options "page-id")
    | "view-nodes" ->
        build_view_nodes_export runtime datascript database
          (field runtime options "rows")
          (empty_map runtime
          |> assoc runtime "group-by?" (field runtime options "group-by?"))
    | "selected-nodes" ->
        buildSelectedNodesExportWith runtime datascript database
          (field runtime options "node-ids")
    | "graph-ontology" ->
        buildGraphOntologyWith runtime datascript database (empty_map runtime)
    | "graph" ->
        Sqlite_export.graphDatomsWith runtime datascript database
          schema_version
    | "graph-human" ->
        buildGraphHumanWith runtime datascript database schema_version
          (field runtime options "graph-options")
    | name -> invalid_arg (":" ^ name ^ " is an invalid export-type")
  in
  let export = patchInvalidKeywordsWith runtime export in
  let validate () =
    ignore (validateBuildExportWith runtime datascript database export options)
  in
  if
    field runtime options "graph-options" |> fun graph_options ->
    option_bool runtime graph_options "catch-validation-errors?"
  then
    try validate () with error -> capabilities.logValidationError error [@u]
  else validate ();
  assoc runtime "logseq.db.sqlite.export/export-type" export_type export

let prepare_export_to_diff runtime export_map =
  let kv_values =
    field runtime export_map "logseq.db.sqlite.export/kv-values"
    |> collection runtime
    |> Domain.prepare_diff_kvs ~ident:(fun entry ->
        field runtime entry "db/ident" |> keyword_text runtime)
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  assoc runtime "logseq.db.sqlite.export/kv-values" kv_values export_map

let diffExportsWith runtime capabilities export_map other_export_map =
  let export_map = prepare_export_to_diff runtime export_map in
  let other_export_map = prepare_export_to_diff runtime other_export_map in
  let diff = (capabilities.diffValues export_map other_export_map [@u]) in
  if not (Support.Runtime_codec.value_is_vector runtime diff) then
    invalid_arg "SQLite export diff capability must return a vector";
  match Support.Runtime_codec.vector_to_array runtime diff with
  | [| left; right; _common |] ->
      if
        Support.Runtime_codec.value_is_nil runtime left
        && Support.Runtime_codec.value_is_nil runtime right
      then Support.Runtime_codec.nil_value runtime
      else Support.Runtime_codec.array_to_list runtime [| left; right |]
  | _ -> invalid_arg "SQLite export diff capability must return three values"

let text_values runtime values =
  values
  |> Rrbvec.fold_left
       (fun result value ->
         let text = Support.Runtime_codec.value_to_string runtime value in
         if String.length result = 0 then text else result ^ ", " ^ text)
       ""

let import_transaction_data runtime transactions =
  let group name = field runtime transactions name |> collection runtime in
  Domain.import_transaction_data ~init:(group "init-tx")
    ~block_properties:(group "block-props-tx") ~misc:(group "misc-tx")

let validation_options : Validation_schema.encoded_workflow_options =
  {
    dispatchKey = Js.Nullable.undefined;
    closedSchema = true;
    newClosedValue = false;
    closedValuesValidate = true;
    skipStrictUrlValidate = false;
  }

let import_validation_success runtime database transaction_data =
  ({
     database = Js.Nullable.return database;
     transactionData =
       transaction_data |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_vector runtime;
     error = Js.Nullable.undefined;
   }
    : encoded_import_validation_result)

let import_validation_error runtime message =
  ({
     database = Js.Nullable.undefined;
     transactionData = Support.Runtime_codec.nil_value runtime;
     error = Js.Nullable.return message;
   }
    : encoded_import_validation_result)

let exception_message exn =
  match Js.Exn.asJsExn exn with
  | Some error ->
      Option.value ~default:(Printexc.to_string exn) (Js.Exn.message error)
  | None -> Printexc.to_string exn

let validateImportTransactionsWith runtime datascript transactions database
    edn_label =
  let supplied_error = field runtime transactions "error" in
  if not (Support.Runtime_codec.value_is_nil runtime supplied_error) then
    import_validation_error runtime
      (Support.Runtime_codec.string_from_value runtime supplied_error)
  else
    try
      let db_add = keyword runtime "db/add" in
      let validation_capabilities :
          ( Support.Datascript.database,
            Support.Runtime_codec.cljs_value,
            Support.Runtime_codec.cljs_value )
          Domain.import_validation_capabilities =
        {
          dry_run =
            (fun database transactions ->
              let transaction_data =
                transactions |> Rrbvec.to_array
                |> Support.Runtime_codec.array_to_vector runtime
              in
              Support.Datascript.with_tx datascript database
                transaction_data Js.Nullable.undefined
              |> Support.Datascript.report_db_after datascript);
          validate =
            (fun database ->
              let validation =
                Validation_schema.validateLocalDatabaseWith runtime
                  datascript database validation_options false
              in
              validation.errors |> Rrbvec.of_array
              |> Rrbvec.map
                   (fun (error : Validation_schema.encoded_entity_error) ->
                     let entity_id = field runtime error.entity "db/id" in
                     ({
                        entity_id =
                          (if
                             Support.Runtime_codec.value_is_nil runtime
                               entity_id
                           then None
                           else Some entity_id);
                        groups =
                          error.errors |> Rrbvec.of_array
                          |> Rrbvec.map
                               (fun
                                 (group :
                                   Validation_schema.encoded_error_group)
                               ->
                                 ({
                                    attribute =
                                      Js.Nullable.toOption group.attribute;
                                    messages = Rrbvec.of_array group.messages;
                                  }
                                   : Domain.validation_error_group));
                      }
                       : Support.Runtime_codec.cljs_value
                         Domain.entity_validation_error)));
          added_attribute =
            (fun transaction ->
              if
                not
                  (Support.Runtime_codec.value_is_vector runtime transaction)
              then None
              else
                let values =
                  Support.Runtime_codec.vector_to_array runtime transaction
                in
                if
                  Array.length values < 3
                  || not
                       (Support.Runtime_codec.value_equals runtime
                          values.(0) db_add)
                then None
                else Some (values.(1), keyword_text runtime values.(2)));
          equal_entity_id = Support.Runtime_codec.value_equals runtime;
        }
      in
      match
        Domain.validate_import_transactions validation_capabilities database
          (import_transaction_data runtime transactions)
      with
      | Domain.Valid_import { database; transactions } ->
          import_validation_success runtime database transactions
      | Invalid_import { error_count } ->
          import_validation_error runtime
            ("The " ^ edn_label ^ " has " ^ string_of_int error_count
           ^ " validation error(s)")
    with exn ->
      let message = exception_message exn in
      Support.Runtime_codec.log_error runtime
        ("Unexpected " ^ edn_label ^ " validation error: " ^ message);
      import_validation_error runtime
        ("The " ^ edn_label ^ " is unexpectedly invalid: " ^ message)

let build_import_with build_blocks_tx runtime datascript capabilities export_map
    database options =
  if datom_export runtime export_map then
    Sqlite_export.datomImportWith runtime datascript database export_map
  else
    let current_block = field runtime options "current-block" in
    let export_map =
      current_block_import runtime datascript export_map current_block
    in
    let kind = export_type runtime export_map in
    let graph = String.equal kind "graph" || String.equal kind "graph-human" in
    let export_map =
      if graph then
        include_namespace_properties runtime datascript database export_map
      else export_map
    in
    let conflicts =
      property_conflicts runtime datascript database
        (field runtime export_map "properties")
    in
    if not (Rrbvec.is_empty conflicts) then
      empty_map runtime
      |> assoc runtime "error"
           (Support.Runtime_codec.string_to_value runtime
              ("The following imported properties conflict with the current \
                graph: "
              ^ text_values runtime conflicts))
    else
      let import_options =
        field runtime export_map "logseq.db.sqlite.export/import-options"
      in
      let keep_existing_properties =
        field runtime import_options "existing-pages-keep-properties?"
        |> Support.Runtime_codec.value_truthy runtime
      in
      let replacements = ref (empty_map runtime) in
      let pages =
        field runtime export_map "pages-and-blocks"
        |> collection runtime
        |> Rrbvec.map (fun entry ->
            let page = field runtime entry "page" in
            assoc runtime "page"
              (prepare_page runtime datascript database keep_existing_properties
                 replacements page)
              entry)
      in
      let prepared =
        empty_map runtime
        |> assoc runtime "build-existing-tx?"
             (Support.Runtime_codec.bool_to_value runtime true)
        |> assoc runtime "extract-content-refs?"
             (Support.Runtime_codec.bool_to_value runtime false)
      in
      let prepared =
        if Rrbvec.is_empty pages then prepared
        else
          assoc runtime "pages-and-blocks"
            (pages |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime)
            prepared
      in
      let classes =
        update_existing_definitions runtime datascript database
          (field runtime export_map "classes")
      in
      let properties =
        update_existing_definitions runtime datascript database
          (field runtime export_map "properties")
      in
      let prepared =
        if
          Array.length
            (Support.Runtime_codec.map_to_entries runtime classes)
          = 0
        then prepared
        else assoc runtime "classes" classes prepared
      in
      let prepared =
        if
          Array.length
            (Support.Runtime_codec.map_to_entries runtime properties)
          = 0
        then prepared
        else assoc runtime "properties" properties prepared
      in
      let prepared =
        if graph then
          prepared
          |> assoc runtime "translate-property-values?"
               (Support.Runtime_codec.bool_to_value runtime false)
        else prepared
      in
      let prepared =
        prepared
        |> rewrite_page_values runtime datascript database
             keep_existing_properties replacements
        |> rewrite_uuid_references runtime !replacements
      in
      let transactions =
        prepared |> remove_export_keys runtime
        |> build_blocks_tx runtime capabilities
      in
      if not graph then transactions
      else
        let misc =
          Rrbvec.of_array
            [|
              "logseq.db.sqlite.export/graph-files";
              "logseq.db.sqlite.export/kv-values";
              "logseq.db.sqlite.export/property-history";
            |]
          |> Rrbvec.fold_left
               (fun result name ->
                 Rrbvec.append result
                   (field runtime export_map name |> collection runtime))
               Rrbvec.empty
        in
        assoc runtime "misc-tx"
          (misc |> Rrbvec.to_array
          |> Support.Runtime_codec.array_to_vector runtime)
          transactions

let buildImport runtime datascript export_map database options =
  let capabilities = Sqlite_build_workflow.default_capabilities runtime in
  build_import_with Sqlite_build_workflow.build_blocks_tx_with_capabilities
    runtime datascript capabilities export_map database options

let createSeededConnectionWith datascript schema initial_data =
  let connection =
    Support.Datascript.create_conn datascript schema Js.Nullable.undefined
  in
  let _report =
    Support.Datascript.transact datascript connection initial_data
      Js.Nullable.undefined
  in
  connection

let validateExport runtime datascript export_map database options =
  try
    let transactions = buildImport runtime datascript export_map database options in
    validateImportTransactionsWith runtime datascript transactions database
      "exported EDN"
  with exn ->
    let message = exception_message exn in
    Support.Runtime_codec.log_error runtime
      ("Unexpected export-edn validation error: " ^ message);
    import_validation_error runtime
      ("The exported EDN is unexpectedly invalid: " ^ message)

let validateSeededExport runtime datascript export_map schema initial_data options =
  let connection = createSeededConnectionWith datascript schema initial_data in
  validateExport runtime datascript export_map
    (Support.Datascript.database datascript connection)
    options
