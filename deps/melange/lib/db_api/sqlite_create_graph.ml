type float_callback = (unit -> float[@u])

let field = Property_build.field
let assoc = Property_build.assoc
let empty_map = Property_build.empty_map
let merge_map = Property_build.merge_map

let keyword_text runtime value =
  if not (Support.Runtime_codec.value_is_keyword runtime value) then
    invalid_arg "Graph construction expects a keyword";
  Support.Runtime_codec.keyword_to_string runtime value

let ident_parts runtime value =
  keyword_text runtime value |> Sqlite_util.split_ident

let nonempty_map = Sqlite_util.nonempty_map

let markBuiltInWith runtime block =
  assoc runtime "logseq.property/built-in?"
    (Support.Runtime_codec.bool_to_value runtime true)
    block

let qualifyPropertySchemaWith runtime property_schema schema_properties_map =
  property_schema
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.map (function
    | [| key; value |] ->
        let key =
          if
            Support.Runtime_codec.value_is_keyword runtime key
            && not
                 (String.contains
                    (Support.Runtime_codec.keyword_to_string runtime key)
                    '/')
          then
            let qualified =
              Support.Runtime_codec.map_get runtime schema_properties_map
                key
            in
            if Support.Runtime_codec.value_is_nil runtime qualified then key
            else qualified
          else key
        in
        [| key; value |]
    | _ -> invalid_arg "Property schema expects map entries")
  |> Support.Runtime_codec.entries_to_map runtime

let validateUniqueIdentsWith runtime transaction =
  let counts = Hashtbl.create 64 in
  transaction
  |> Support.Runtime_codec.collection_to_array runtime
  |> Array.iter (fun entity ->
      let ident = field runtime entity "db/ident" in
      if not (Support.Runtime_codec.value_is_nil runtime ident) then
        let text = keyword_text runtime ident in
        let count = Option.value (Hashtbl.find_opt counts text) ~default:0 in
        Hashtbl.replace counts text (count + 1));
  let conflicts =
    Hashtbl.fold
      (fun ident count result ->
        if count > 1 then Rrbvec.push_back result ident else result)
      counts Rrbvec.empty
  in
  if not (Rrbvec.is_empty conflicts) then
    Js.Exn.raiseError
      ("The following :db/idents are not unique and clobbered each other: "
      ^ Melange_common.String_util.join ~separator:", " conflicts)

let internal_ident runtime value =
  if not (Support.Runtime_codec.value_is_keyword runtime value) then false
  else
    let ident = Support.Runtime_codec.keyword_to_string runtime value in
    let namespace_ =
      match String.index_opt ident '/' with
      | None -> None
      | Some index -> Some (String.sub ident 0 index)
    in
    Melange_db.Validation_identity.is_internal_ident ~namespace_ ~ident

let value_ref_property_type runtime value =
  value |> keyword_text runtime |> Melange_db.Property_type.of_string
  |> Option.fold ~none:false ~some:(fun property_type ->
      Rrbvec.mem property_type Melange_db.Property_type.value_ref)

let build_properties_with build_property runtime
    (generate_uuid : Property_build.value_callback)
    (generate_order : Property_build.value_callback)
    (now_ms : float_callback) built_in_properties property_catalog
    schema_properties_map =
  let build_property db_ident schema title =
    let options = empty_map runtime |> assoc runtime "title" title in
    build_property runtime generate_order now_ms db_ident schema options
  in
  let build_one = function
    | [| catalog_ident; definition |] ->
        let attribute = field runtime definition "attribute" in
        let db_ident =
          if Support.Runtime_codec.value_is_nil runtime attribute then
            catalog_ident
          else attribute
        in
        let schema =
          qualifyPropertySchemaWith runtime
            (field runtime definition "schema")
            schema_properties_map
        in
        let title = field runtime definition "title" in
        let closed_values = field runtime definition "closed-values" in
        let property = build_property db_ident schema title in
        let others =
          if Support.Runtime_codec.value_is_nil runtime closed_values then
            [||]
          else
            let property_input =
              empty_map runtime
              |> assoc runtime "db/ident" db_ident
              |> assoc runtime "schema" schema
              |> assoc runtime "closed-values" closed_values
            in
            Property_build.closedValuesToBlocksWith runtime generate_order
              now_ms property_input
            |> Support.Runtime_codec.collection_to_array runtime
        in
        let configured_properties = field runtime definition "properties" in
        let property_value_entries =
          if
            Support.Runtime_codec.value_is_nil runtime configured_properties
          then [||]
          else
            configured_properties
            |> Support.Runtime_codec.map_to_entries runtime
            |> Array.to_seq
            |> Seq.filter_map (function
              | [| property_ident; value |]
                when not (internal_ident runtime value) ->
                  let property_definition =
                    Support.Runtime_codec.map_get runtime property_catalog
                      property_ident
                  in
                  if
                    Support.Runtime_codec.value_is_nil runtime
                      property_definition
                  then None
                  else
                    let property_type =
                      field runtime
                        (field runtime property_definition "schema")
                        "type"
                    in
                    if
                      Support.Runtime_codec.value_is_nil runtime
                        property_type
                    then None
                    else
                      let target_closed_values =
                        field runtime property_definition "closed-values"
                      in
                      let effective_type =
                        if
                          value_ref_property_type runtime property_type
                          && Support.Runtime_codec.value_is_nil runtime
                               target_closed_values
                        then Some property_type
                        else if keyword_text runtime property_type = "entity"
                        then
                          Some
                            (Support.Runtime_codec.keyword_from_string
                               runtime "number")
                        else None
                      in
                      effective_type
                      |> Option.map (fun effective_type ->
                          let property_key =
                            empty_map runtime
                            |> assoc runtime "db/ident" property_ident
                            |> assoc runtime "logseq.property/type"
                                 effective_type
                          in
                          (property_ident, property_key, value))
              | _ -> None)
            |> Array.of_seq
        in
        let property_value_transactions =
          Property_build.build_property_value_entries_with runtime
            generate_uuid generate_order now_ms property property_value_entries
            ({ pure = true; pvalueMap = false }
              : Property_build.encoded_property_values_options)
        in
        let nested_transactions =
          property_value_transactions
          |> Support.Runtime_codec.map_to_entries runtime
          |> Array.fold_left
               (fun result -> function
                 | [| _key; value |] ->
                     if Support.Runtime_codec.value_is_set runtime value
                     then
                       Rrbvec.append result
                         (value
                         |> Support.Runtime_codec.set_to_array runtime
                         |> Rrbvec.of_array)
                     else Rrbvec.push_back result value
                 | _ -> result)
               Rrbvec.empty
          |> Rrbvec.to_array
        in
        let property_update =
          if nonempty_map runtime configured_properties then
            let base =
              empty_map runtime
              |> assoc runtime "block/uuid"
                   (field runtime property "block/uuid")
              |> fun base -> merge_map runtime base configured_properties
            in
            Property_build.buildPropertiesWithRefValuesWith runtime
              property_value_transactions
            |> merge_map runtime base |> Option.some
          else None
        in
        let result =
          Rrbvec.of_array [| property |] |> fun result ->
          Rrbvec.append result (Rrbvec.of_array others) |> fun result ->
          Rrbvec.append result (Rrbvec.of_array nested_transactions)
        in
        Option.fold ~none:result
          ~some:(fun update -> Rrbvec.push_back result update)
          property_update
    | _ -> invalid_arg "Built-in property catalog expects map entries"
  in
  built_in_properties
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result entry -> Rrbvec.append result (build_one entry))
       Rrbvec.empty
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let buildProperties runtime (generate_uuid : Property_build.value_callback)
    (generate_order : Property_build.value_callback)
    (now_ms : float_callback) built_in_properties property_catalog
    schema_properties_map =
  build_properties_with Sqlite_util.buildProperty runtime generate_uuid
    generate_order now_ms built_in_properties property_catalog
    schema_properties_map

let buildInitialClassesWith runtime (now_ms : float_callback) built_in_classes
    db_ident_to_properties =
  built_in_classes
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.map (function
    | [| db_ident; definition |] ->
        let namespace_, name = ident_parts runtime db_ident in
        let title_value = field runtime definition "title" in
        let title =
          if Support.Runtime_codec.value_is_nil runtime title_value then
            name
          else Support.Runtime_codec.string_from_value runtime title_value
        in
        let schema = field runtime definition "schema" in
        let schema_properties = field runtime schema "properties" in
        let class_properties =
          if Support.Runtime_codec.value_is_nil runtime schema_properties
          then [||]
          else
            Support.Runtime_codec.collection_to_array runtime
              schema_properties
            |> Array.map (fun property_ident ->
                let property =
                  Support.Runtime_codec.map_get runtime
                    db_ident_to_properties property_ident
                in
                if Support.Runtime_codec.value_is_nil runtime property then
                  invalid_arg
                    ("Built-in property "
                    ^ keyword_text runtime property_ident
                    ^ " is not defined yet");
                property_ident)
        in
        let block =
          empty_map runtime
          |> assoc runtime "block/title"
               (Support.Runtime_codec.string_to_value runtime title)
          |> assoc runtime "block/name"
               (Melange_common.String_util.page_name_sanity_lower title
               |> Support.Runtime_codec.string_to_value runtime)
          |> assoc runtime "db/ident" db_ident
          |> assoc runtime "block/uuid"
               (Melange_common.Uuid.db_ident_block ~namespace_:(Some namespace_)
                  ~name
               |> Support.Runtime_codec.uuid_from_string runtime)
        in
        let block =
          if Array.length class_properties = 0 then block
          else
            assoc runtime "logseq.property.class/properties"
              (Support.Runtime_codec.array_to_vector runtime
                 class_properties)
              block
        in
        let properties = field runtime definition "properties" in
        let block =
          if nonempty_map runtime properties then
            merge_map runtime block properties
          else block
        in
        Sqlite_util.buildClassWith runtime now_ms block
        |> markBuiltInWith runtime
    | _ -> invalid_arg "Built-in class catalog expects map entries")
  |> Support.Runtime_codec.array_to_list runtime

type encoded_initial_options = {
  importType : Support.Runtime_codec.cljs_value Js.Nullable.t;
  graphGitSha : Support.Runtime_codec.cljs_value Js.Nullable.t;
  creatingRemoteGraph : bool;
}

let select_keys runtime map names =
  Rrbvec.fold_left
    (fun result name ->
      let key = Support.Runtime_codec.keyword_from_string runtime name in
      if Support.Runtime_codec.map_contains runtime map key then
        Support.Runtime_codec.map_assoc runtime result key
          (Support.Runtime_codec.map_get runtime map key)
      else result)
    (empty_map runtime) names

let dissoc_keys runtime map names =
  Rrbvec.fold_left
    (fun result name ->
      Support.Runtime_codec.map_dissoc runtime result
        (Support.Runtime_codec.keyword_from_string runtime name))
    map names

let hidden_page runtime (now_ms : float_callback) ~title ~name =
  empty_map runtime
  |> assoc runtime "block/uuid"
       (Melange_common.Uuid.builtin_block title
       |> Support.Runtime_codec.uuid_from_string runtime)
  |> assoc runtime "block/name"
       (Support.Runtime_codec.string_to_value runtime name)
  |> assoc runtime "block/title"
       (Support.Runtime_codec.string_to_value runtime title)
  |> assoc runtime "block/tags"
       (Support.Runtime_codec.array_to_vector runtime
          [|
            Support.Runtime_codec.keyword_from_string runtime
              "logseq.class/Page";
          |])
  |> assoc runtime "logseq.property/hide?"
       (Support.Runtime_codec.bool_to_value runtime true)
  |> markBuiltInWith runtime
  |> Property_build.timestamp_block runtime now_ms

let buildInitialViewsWith runtime (now_ms : float_callback) =
  let title = Melange_common.Config.views_page_name in
  Support.Runtime_codec.array_to_vector runtime
    [| hidden_page runtime now_ms ~title ~name:title |]

let build_initial_data_with build_property build_properties runtime
    (generate_uuid : Property_build.value_callback)
    (generate_order : Property_build.value_callback)
    (now_ms : float_callback) (now_instant : Property_build.value_callback)
    config_content built_in_properties schema_properties_map built_in_classes
    schema_version (options : encoded_initial_options) =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let bootstrap_idents =
    Rrbvec.of_array
      [|
        "logseq.property/type";
        "logseq.property/hide?";
        "logseq.property/built-in?";
        "logseq.property/created-from-property";
      |]
  in
  let build_bootstrap_property ident =
    let db_ident = keyword ident in
    let definition =
      Support.Runtime_codec.map_get runtime built_in_properties db_ident
    in
    if Support.Runtime_codec.value_is_nil runtime definition then
      invalid_arg ("Missing bootstrap property " ^ ident);
    let schema =
      qualifyPropertySchemaWith runtime
        (field runtime definition "schema")
        schema_properties_map
    in
    let options =
      empty_map runtime
      |> assoc runtime "title" (field runtime definition "title")
    in
    build_property runtime generate_order now_ms db_ident schema options
  in
  let bootstrap_properties =
    Rrbvec.map build_bootstrap_property bootstrap_idents
  in
  let bootstrap_properties_tx =
    let definitions =
      Rrbvec.map
        (fun property -> dissoc_keys runtime property bootstrap_idents)
        bootstrap_properties
    in
    let references =
      let keys = Rrbvec.push_front bootstrap_idents "block/uuid" in
      Rrbvec.map
        (fun property -> select_keys runtime property keys)
        bootstrap_properties
    in
    Rrbvec.append definitions references
  in
  let remaining_properties =
    Rrbvec.fold_left
      (fun properties ident ->
        Support.Runtime_codec.map_dissoc runtime properties (keyword ident))
      built_in_properties bootstrap_idents
  in
  let properties_tx =
    build_properties runtime generate_uuid generate_order now_ms
      remaining_properties built_in_properties schema_properties_map
    |> Support.Runtime_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  let mark_uuid property =
    empty_map runtime
    |> assoc runtime "block/uuid" (field runtime property "block/uuid")
    |> markBuiltInWith runtime
  in
  let all_properties_tx =
    bootstrap_properties_tx |> fun result ->
    Rrbvec.append result properties_tx |> fun result ->
    Rrbvec.append result (Rrbvec.map mark_uuid bootstrap_properties)
    |> fun result -> Rrbvec.append result (Rrbvec.map mark_uuid properties_tx)
  in
  let property_tag = keyword "logseq.class/Property" in
  let db_ident_to_properties =
    properties_tx
    |> Rrbvec.filter_map (fun property ->
        let tags = field runtime property "block/tags" in
        let is_property =
          if Support.Runtime_codec.value_is_nil runtime tags then false
          else
            tags
            |> Support.Runtime_codec.collection_to_array runtime
            |> Array.exists
                 (Support.Runtime_codec.value_equals runtime property_tag)
        in
        if not is_property then None
        else
          let ident = field runtime property "db/ident" in
          if Support.Runtime_codec.value_is_nil runtime ident then None
          else Some [| ident; property |])
    |> Rrbvec.to_array
    |> Support.Runtime_codec.entries_to_map runtime
  in
  let default_classes =
    buildInitialClassesWith runtime now_ms built_in_classes
      db_ident_to_properties
    |> Support.Runtime_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  let bootstrap_class ident =
    ident = "logseq.class/Root"
    || ident = "logseq.class/Property"
    || ident = "logseq.class/Tag"
    || ident = "logseq.class/Page"
    || ident = "logseq.class/Template"
  in
  let bootstrap_classes =
    Rrbvec.filter
      (fun class_ ->
        field runtime class_ "db/ident"
        |> keyword_text runtime |> bootstrap_class)
      default_classes
  in
  let bootstrap_class_ids =
    let keys = Rrbvec.of_array [| "db/ident"; "block/uuid" |] in
    Rrbvec.map (fun class_ -> select_keys runtime class_ keys) bootstrap_classes
  in
  let classes_tx =
    let without_idents =
      Rrbvec.map
        (fun class_ ->
          Support.Runtime_codec.map_dissoc runtime class_
            (keyword "db/ident"))
        bootstrap_classes
    in
    let remaining =
      Rrbvec.filter
        (fun class_ ->
          field runtime class_ "db/ident"
          |> keyword_text runtime |> bootstrap_class |> not)
        default_classes
    in
    Rrbvec.append without_idents remaining
  in
  let kv key value = Sqlite_util.kvWith runtime (keyword key) value in
  let initial_data =
    Rrbvec.of_array
      [|
        kv "logseq.kv/db-type"
          (Support.Runtime_codec.string_to_value runtime "db");
        kv "logseq.kv/schema-version" schema_version;
        kv "logseq.kv/graph-initial-schema-version" schema_version;
        kv "logseq.kv/graph-created-at"
          ((now_ms () [@u]) |> Support.Runtime_codec.float_to_value runtime);
        empty_map runtime
        |> assoc runtime "db/ident"
             (keyword "logseq.property/empty-placeholder")
        |> assoc runtime "block/uuid"
             (Melange_common.Uuid.builtin_keyword_block
                ~namespace_:(Some "logseq.property") ~name:"empty-placeholder"
             |> Support.Runtime_codec.uuid_from_string runtime);
      |]
  in
  let initial_data =
    match Js.Nullable.toOption options.importType with
    | Some import_type
      when Support.Runtime_codec.value_truthy runtime import_type ->
        Sqlite_util.importTxWith runtime now_ms import_type
        |> Support.Runtime_codec.collection_to_array runtime
        |> Rrbvec.of_array |> Rrbvec.append initial_data
    | _ -> initial_data
  in
  let initial_data =
    match Js.Nullable.toOption options.graphGitSha with
    | Some sha when Support.Runtime_codec.value_truthy runtime sha ->
        Rrbvec.push_back initial_data (kv "logseq.kv/graph-git-sha" sha)
    | _ -> initial_data
  in
  let initial_data =
    if options.creatingRemoteGraph then
      Rrbvec.push_back initial_data
        (kv "logseq.kv/graph-remote?"
           (Support.Runtime_codec.bool_to_value runtime true))
    else initial_data
  in
  let generated_uuid = (generate_uuid () [@u]) in
  let generated_uuid =
    Support.Runtime_codec.uuid_to_string runtime generated_uuid
  in
  if String.length generated_uuid < 8 then
    invalid_arg "Generated graph UUID is too short";
  let local_graph_uuid =
    "00000000" ^ String.sub generated_uuid 8 (String.length generated_uuid - 8)
    |> Support.Runtime_codec.uuid_from_string runtime
  in
  let initial_data =
    Rrbvec.push_back initial_data
      (kv "logseq.kv/local-graph-uuid" local_graph_uuid)
  in
  let make_file path content =
    empty_map runtime
    |> assoc runtime "block/uuid"
         (Melange_common.Uuid.builtin_block path
         |> Support.Runtime_codec.uuid_from_string runtime)
    |> assoc runtime "file/path"
         (Support.Runtime_codec.string_to_value runtime path)
    |> assoc runtime "file/content"
         (Support.Runtime_codec.string_to_value runtime content)
    |> assoc runtime "file/created-at" (now_instant () [@u])
    |> assoc runtime "file/last-modified-at" (now_instant () [@u])
  in
  let initial_files =
    Rrbvec.of_array
      [|
        make_file "logseq/config.edn" config_content;
        make_file "logseq/custom.css" "";
        make_file "logseq/custom.js" "";
        make_file "logseq/publish.css" "";
        make_file "logseq/publish.js" "";
      |]
  in
  let default_pages =
    Rrbvec.of_array
      [|
        Melange_common.Config.library_page_name;
        Melange_common.Config.quick_add_page_name;
        "Contents";
      |]
    |> Rrbvec.map (fun title ->
        Sqlite_util.buildPageWith runtime now_ms title
        |> markBuiltInWith runtime)
  in
  let hidden_pages =
    Rrbvec.of_array
      [|
        hidden_page runtime now_ms ~title:Melange_common.Config.views_page_name
          ~name:Melange_common.Config.views_page_name;
        hidden_page runtime now_ms
          ~title:Melange_common.Config.favorites_page_name
          ~name:Melange_common.Config.favorites_page_name;
        hidden_page runtime now_ms
          ~title:Melange_common.Config.recycle_page_name
          ~name:
            (Melange_common.String_util.page_name_sanity_lower
               Melange_common.Config.recycle_page_name);
      |]
  in
  let transaction =
    bootstrap_class_ids |> fun result ->
    Rrbvec.append result initial_data |> fun result ->
    Rrbvec.append result all_properties_tx |> fun result ->
    Rrbvec.append result classes_tx |> fun result ->
    Rrbvec.append result initial_files |> fun result ->
    Rrbvec.append result default_pages |> fun result ->
    Rrbvec.append result hidden_pages
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  validateUniqueIdentsWith runtime transaction;
  transaction

let buildInitialData runtime (generate_uuid : Property_build.value_callback)
    (generate_order : Property_build.value_callback)
    (now_ms : float_callback) (now_instant : Property_build.value_callback)
    config_content built_in_properties schema_properties_map built_in_classes
    schema_version (options : encoded_initial_options) =
  build_initial_data_with Sqlite_util.buildProperty buildProperties runtime
    generate_uuid generate_order now_ms now_instant config_content
    built_in_properties schema_properties_map built_in_classes schema_version
    options
