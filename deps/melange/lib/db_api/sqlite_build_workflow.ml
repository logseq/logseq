type value_callback = (unit -> Support.Runtime_codec.value[@u])
type float_callback = (unit -> float[@u])

type capabilities = {
  generateUuid : value_callback;
  generateOrder : value_callback;
  nowMs : float_callback;
}

module Default_capabilities = struct
  type global
  type crypto

  external global_this : global = "globalThis"

  external crypto : global -> crypto option = "crypto"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external random_uuid : crypto -> string = "randomUUID" [@@mel.send]

  let uuid_text () =
    match crypto global_this with
    | Some crypto -> random_uuid crypto
    | None -> invalid_arg "SQLite build UUID generation requires crypto.randomUUID"
end

let default_capabilities runtime =
  {
    generateUuid =
      (fun [@u] () ->
        Default_capabilities.uuid_text ()
        |> Support.Runtime_codec.uuid_from_string runtime);
    generateOrder =
      (fun [@u] () ->
        Melange_db.Order.generate_tracked_key_between
          Melange_db.Order.default_state None None
        |> Support.Runtime_codec.string_to_value runtime);
    nowMs = (fun [@u] () -> Melange_common.Date_time.now_ms ());
  }

let field = Property_build.field
let assoc = Property_build.assoc
let empty_map = Property_build.empty_map
let merge_map = Property_build.merge_map

let keyword runtime name =
  Support.Runtime_codec.keyword_from_string runtime name

let keyword_text runtime value =
  Support.Runtime_codec.keyword_to_string runtime value

let keyword_parts runtime value =
  let text = keyword_text runtime value in
  match String.rindex_opt text '/' with
  | None -> (None, text)
  | Some index ->
      ( Some (String.sub text 0 index),
        String.sub text (index + 1) (String.length text - index - 1) )

let qualified_keyword runtime value =
  Support.Runtime_codec.value_is_keyword runtime value
  && Option.is_some (fst (keyword_parts runtime value))

let dissoc runtime name map =
  Support.Runtime_codec.map_dissoc runtime map (keyword runtime name)

let dissoc_many runtime names map =
  Rrbvec.fold_left (fun result name -> dissoc runtime name result) map names

let select_many runtime names map =
  names
  |> Rrbvec.fold_left
       (fun result name ->
         let key = keyword runtime name in
         if Support.Runtime_codec.map_contains runtime map key then
           Support.Runtime_codec.map_assoc runtime result key
             (Support.Runtime_codec.map_get runtime map key)
         else result)
       (empty_map runtime)

let collection runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    Support.Runtime_codec.collection_to_array runtime value
    |> Rrbvec.of_array

let fail message = Js.Exn.raiseError ("SQLite build: " ^ message)

let require_map runtime label value =
  if not (Support.Runtime_codec.value_is_map runtime value) then
    fail (label ^ " must be a map")

let require_vector runtime label value =
  if not (Support.Runtime_codec.value_is_vector runtime value) then
    fail (label ^ " must be a vector")

let require_collection runtime label value =
  if
    not
      (Support.Runtime_codec.value_is_vector runtime value
      || Support.Runtime_codec.value_is_set runtime value)
  then fail (label ^ " must be a vector or set")

let require_optional runtime name predicate description value =
  if
    (not (Support.Runtime_codec.value_is_nil runtime value))
    && not (predicate runtime value)
  then fail (":" ^ name ^ " must be " ^ description)

let validate_keyword_collection runtime label value =
  require_collection runtime label value;
  collection runtime value
  |> Rrbvec.iter (fun item ->
      if not (Support.Runtime_codec.value_is_keyword runtime item) then
        fail (label ^ " values must be keywords"))

let validate_properties_map runtime label value =
  if not (Support.Runtime_codec.value_is_nil runtime value) then (
    require_map runtime label value;
    value
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.iter (function
      | [| property; _value |] ->
          if not (Support.Runtime_codec.value_is_keyword runtime property)
          then fail (label ^ " keys must be keywords")
      | _ -> fail (label ^ " contains an invalid map entry")))

let rec validate_block runtime block =
  require_map runtime "block" block;
  let title = field runtime block "block/title" in
  if not (Support.Runtime_codec.value_is_string runtime title) then
    fail "block :block/title must be a string";
  require_optional runtime "block/uuid" Support.Runtime_codec.value_is_uuid
    "a UUID"
    (field runtime block "block/uuid");
  validate_properties_map runtime ":build/properties"
    (field runtime block "build/properties");
  let tags = field runtime block "build/tags" in
  if not (Support.Runtime_codec.value_is_nil runtime tags) then
    validate_keyword_collection runtime ":build/tags" tags;
  require_optional runtime "build/keep-uuid?"
    Support.Runtime_codec.value_is_bool "a boolean"
    (field runtime block "build/keep-uuid?");
  let children = field runtime block "build/children" in
  if not (Support.Runtime_codec.value_is_nil runtime children) then (
    require_vector runtime ":build/children" children;
    collection runtime children |> Rrbvec.iter (validate_block runtime))

let validate_page runtime page =
  require_map runtime "page" page;
  let title = field runtime page "block/title" in
  let uuid = field runtime page "block/uuid" in
  let journal = field runtime page "build/journal" in
  if
    Support.Runtime_codec.value_is_nil runtime title
    && Support.Runtime_codec.value_is_nil runtime uuid
    && Support.Runtime_codec.value_is_nil runtime journal
  then fail "page requires :block/title, :block/uuid, or :build/journal";
  require_optional runtime "block/title"
    Support.Runtime_codec.value_is_string "a string" title;
  require_optional runtime "block/uuid" Support.Runtime_codec.value_is_uuid
    "a UUID" uuid;
  require_optional runtime "build/journal"
    Support.Runtime_codec.value_is_integer "an integer" journal;
  validate_properties_map runtime ":build/properties"
    (field runtime page "build/properties");
  let tags = field runtime page "build/tags" in
  if not (Support.Runtime_codec.value_is_nil runtime tags) then
    validate_keyword_collection runtime ":build/tags" tags;
  require_optional runtime "build/keep-uuid?"
    Support.Runtime_codec.value_is_bool "a boolean"
    (field runtime page "build/keep-uuid?")

let validate_page_entry runtime entry =
  require_map runtime "pages-and-blocks entry" entry;
  entry
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.iter (function
    | [| key; _ |] ->
        let name = keyword_text runtime key in
        if name <> "page" && name <> "blocks" then
          fail ("unknown pages-and-blocks key :" ^ name)
    | _ -> fail "pages-and-blocks contains an invalid map entry");
  validate_page runtime (field runtime entry "page");
  let blocks = field runtime entry "blocks" in
  if not (Support.Runtime_codec.value_is_nil runtime blocks) then (
    require_vector runtime ":blocks" blocks;
    collection runtime blocks |> Rrbvec.iter (validate_block runtime))

let validate_property_definition runtime definition =
  require_map runtime "property definition" definition;
  validate_properties_map runtime ":build/properties"
    (field runtime definition "build/properties");
  let ref_types = field runtime definition "build/properties-ref-types" in
  if not (Support.Runtime_codec.value_is_nil runtime ref_types) then (
    require_map runtime ":build/properties-ref-types" ref_types;
    ref_types
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.iter (function
      | [| key; value |]
        when Support.Runtime_codec.value_is_keyword runtime key
             && Support.Runtime_codec.value_is_keyword runtime value ->
          ()
      | _ -> fail ":build/properties-ref-types must map keywords to keywords"));
  let closed_values = field runtime definition "build/closed-values" in
  if not (Support.Runtime_codec.value_is_nil runtime closed_values) then (
    require_vector runtime ":build/closed-values" closed_values;
    collection runtime closed_values
    |> Rrbvec.iter (fun closed_value ->
        require_map runtime "closed value" closed_value;
        let value = field runtime closed_value "value" in
        if
          not
            (Support.Runtime_codec.value_is_string runtime value
            || Support.Runtime_codec.value_is_number runtime value)
        then fail "closed value :value must be a string or number";
        require_optional runtime "uuid" Support.Runtime_codec.value_is_uuid
          "a UUID"
          (field runtime closed_value "uuid");
        require_optional runtime "icon" Support.Runtime_codec.value_is_map
          "a map"
          (field runtime closed_value "icon")));
  let classes = field runtime definition "build/property-classes" in
  if not (Support.Runtime_codec.value_is_nil runtime classes) then
    validate_keyword_collection runtime ":build/property-classes" classes;
  require_optional runtime "build/keep-uuid?"
    Support.Runtime_codec.value_is_bool "a boolean"
    (field runtime definition "build/keep-uuid?")

let validate_class_definition runtime definition =
  require_map runtime "class definition" definition;
  validate_properties_map runtime ":build/properties"
    (field runtime definition "build/properties");
  let extends = field runtime definition "build/class-extends" in
  if not (Support.Runtime_codec.value_is_nil runtime extends) then
    validate_keyword_collection runtime ":build/class-extends" extends;
  let parent = field runtime definition "build/class-parent" in
  require_optional runtime "build/class-parent"
    Support.Runtime_codec.value_is_keyword "a keyword" parent;
  let properties = field runtime definition "build/class-properties" in
  if not (Support.Runtime_codec.value_is_nil runtime properties) then (
    require_vector runtime ":build/class-properties" properties;
    collection runtime properties
    |> Rrbvec.iter (fun property ->
        if not (Support.Runtime_codec.value_is_keyword runtime property)
        then fail ":build/class-properties values must be keywords"));
  require_optional runtime "build/keep-uuid?"
    Support.Runtime_codec.value_is_bool "a boolean"
    (field runtime definition "build/keep-uuid?")

let validate_definition_map runtime label validate_definition definitions =
  if not (Support.Runtime_codec.value_is_nil runtime definitions) then (
    require_map runtime label definitions;
    definitions
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.iter (function
      | [| key; definition |] ->
          if not (Support.Runtime_codec.value_is_keyword runtime key) then
            fail (label ^ " keys must be keywords");
          validate_definition runtime definition
      | _ -> fail (label ^ " contains an invalid map entry")))

let internal_property runtime property =
  let namespace_, _name = keyword_parts runtime property in
  Melange_db.Property_identity.is_internal_property ~namespace_
    ~ident:(keyword_text runtime property)
    ~is_keyword:(Support.Runtime_codec.value_is_keyword runtime property)

let joined_values runtime values =
  values
  |> Rrbvec.fold_left
       (fun result value ->
         let text = Support.Runtime_codec.value_to_string runtime value in
         if String.length result = 0 then text else result ^ ", " ^ text)
       ""

let validateOptionsWith runtime options =
  require_map runtime "options" options;
  let allowed_options =
    Rrbvec.of_array
      [|
        "pages-and-blocks";
        "properties";
        "classes";
        "graph-namespace";
        "page-id-fn";
        "auto-create-ontology?";
        "build-existing-tx?";
        "extract-content-refs?";
        "translate-property-values?";
      |]
  in
  options
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.iter (function
    | [| key; _ |] ->
        let name = keyword_text runtime key in
        if not (Rrbvec.mem name allowed_options) then
          fail ("unknown option :" ^ name)
    | _ -> fail "options contains an invalid map entry");
  let pages = field runtime options "pages-and-blocks" in
  if not (Support.Runtime_codec.value_is_nil runtime pages) then (
    require_vector runtime ":pages-and-blocks" pages;
    collection runtime pages |> Rrbvec.iter (validate_page_entry runtime));
  let properties = field runtime options "properties" in
  validate_definition_map runtime ":properties" validate_property_definition
    properties;
  validate_definition_map runtime ":classes" validate_class_definition
    (field runtime options "classes");
  require_optional runtime "graph-namespace"
    Support.Runtime_codec.value_is_keyword "a keyword"
    (field runtime options "graph-namespace");
  Rrbvec.of_array
    [|
      "auto-create-ontology?";
      "build-existing-tx?";
      "extract-content-refs?";
      "translate-property-values?";
    |]
  |> Rrbvec.iter (fun name ->
      require_optional runtime name Support.Runtime_codec.value_is_bool
        "a boolean"
        (field runtime options name));
  let auto_create =
    field runtime options "auto-create-ontology?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  if not auto_create then
    let properties =
      if Support.Runtime_codec.value_is_nil runtime properties then
        empty_map runtime
      else properties
    in
    let undeclared =
      Sqlite_build.getUsedPropertiesWith runtime options
      |> Support.Runtime_codec.map_to_entries runtime
      |> Rrbvec.of_array
      |> Rrbvec.filter_map (function
        | [| property; _ |]
          when (not
                  (Support.Runtime_codec.map_contains runtime properties
                     property))
               && not (internal_property runtime property) ->
            Some property
        | _ -> None)
    in
    if not (Rrbvec.is_empty undeclared) then
      fail
        ("the following properties used in EDN were not declared in "
       ^ ":properties: "
        ^ joined_values runtime undeclared)

let default_option runtime name value options =
  let key = keyword runtime name in
  if Support.Runtime_codec.map_contains runtime options key then options
  else Support.Runtime_codec.map_assoc runtime options key value

let normalize_options runtime options =
  options
  |> default_option runtime "extract-content-refs?"
       (Support.Runtime_codec.bool_to_value runtime true)
  |> default_option runtime "translate-property-values?"
       (Support.Runtime_codec.bool_to_value runtime true)

let next_temp_id runtime =
  Melange_db.Sqlite_build.next_temp_id
    Melange_db.Sqlite_build.default_temp_id_state
  |> Support.Runtime_codec.int_to_value runtime

let id_reference runtime id = empty_map runtime |> assoc runtime "db/id" id

let create_ident_with runtime stable_idents random_index random_bytes ~kind
    ~graph_namespace source =
  let namespace_, name = keyword_parts runtime source in
  let target_namespace =
    match graph_namespace with
    | Some graph -> graph ^ "." ^ kind
    | None -> (
        match namespace_ with
        | Some namespace_ -> namespace_
        | None -> "user." ^ kind)
  in
  match (graph_namespace, namespace_) with
  | None, Some _ -> source
  | _ ->
      Melange_db.Db_ident.create_with
        ~stable_idents ~random_index ~random_bytes
        ~namespace_:target_namespace ~name
      |> keyword runtime

let create_ident runtime ~kind ~graph_namespace source =
  create_ident_with runtime Db_ident.Default_runtime.stable_idents
    Db_ident.Default_runtime.random_index Db_ident.Default_runtime.random_bytes
    ~kind ~graph_namespace source

let build_all_idents_with create_ident runtime options properties classes =
  let graph_namespace =
    let value = field runtime options "graph-namespace" in
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some (snd (keyword_parts runtime value))
  in
  let add kind result entries =
    entries
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.fold_left
         (fun result -> function
           | [| source; _definition |] ->
               Support.Runtime_codec.map_assoc runtime result source
                 (create_ident runtime ~kind ~graph_namespace source)
           | _ -> invalid_arg "SQLite build ontology expects map entries")
         result
  in
  empty_map runtime |> fun result ->
  add "property" result properties |> fun result -> add "class" result classes

let build_all_idents runtime options properties classes =
  build_all_idents_with create_ident runtime options properties classes

let get_ident runtime all_idents value =
  if qualified_keyword runtime value then value
  else
    let ident = Support.Runtime_codec.map_get runtime all_idents value in
    if Support.Runtime_codec.value_is_nil runtime ident then
      Js.Exn.raiseError
        ("No ident found for "
        ^ Support.Runtime_codec.value_to_string runtime value)
    else ident

let timestamp runtime capabilities block =
  Property_build.timestamp_block runtime capabilities.nowMs block

let rec expand_blocks runtime capabilities blocks parent_uuid =
  collection runtime blocks
  |> Rrbvec.concat_map (fun block ->
      let original_uuid = field runtime block "block/uuid" in
      let existing =
        not (Support.Runtime_codec.value_is_nil runtime original_uuid)
      in
      let uuid =
        if existing then original_uuid else capabilities.generateUuid () [@u]
      in
      let children = field runtime block "build/children" in
      let block =
        block
        |> assoc runtime "block/uuid" uuid
        |> assoc runtime "logseq.db.sqlite.build/existing-block?"
             (Support.Runtime_codec.bool_to_value runtime existing)
        |> dissoc runtime "build/children"
      in
      let block =
        match parent_uuid with
        | None -> block
        | Some parent_uuid ->
            let lookup =
              Support.Runtime_codec.array_to_vector runtime
                [| keyword runtime "block/uuid"; parent_uuid |]
            in
            block |> assoc runtime "block/parent" (id_reference runtime lookup)
      in
      Rrbvec.push_front
        (expand_blocks runtime capabilities children (Some uuid))
        block)

let prepare_page runtime capabilities page =
  let journal = field runtime page "build/journal" in
  let page =
    if Support.Runtime_codec.value_is_nil runtime journal then page
    else
      let journal_day =
        Support.Runtime_codec.int_from_value runtime journal
      in
      let existing_uuid = field runtime page "block/uuid" in
      let new_page =
        Support.Runtime_codec.value_is_nil runtime existing_uuid
      in
      let uuid =
        if new_page then
          Melange_common.Uuid.journal_page journal_day
          |> Support.Runtime_codec.uuid_from_string runtime
        else existing_uuid
      in
      page
      |> dissoc runtime "build/journal"
      |> assoc runtime "block/journal-day" journal
      |> assoc runtime "block/title"
           (Melange_common.Date_time.format_journal_day ~journal_day
              ~formatter:
                Melange_common.Date_time.default_journal_title_formatter
           |> Support.Runtime_codec.string_to_value runtime)
      |> assoc runtime "block/uuid" uuid
      |> assoc runtime "block/tags" (keyword runtime "logseq.class/Journal")
      |> assoc runtime "logseq.db.sqlite.build/new-page?"
           (Support.Runtime_codec.bool_to_value runtime new_page)
  in
  let uuid = field runtime page "block/uuid" in
  if Support.Runtime_codec.value_is_nil runtime uuid then
    page
    |> assoc runtime "block/uuid" (capabilities.generateUuid () [@u])
    |> assoc runtime "logseq.db.sqlite.build/new-page?"
         (Support.Runtime_codec.bool_to_value runtime true)
  else page

let add_pages_from_content_refs runtime options pages =
  let extract =
    field runtime options "extract-content-refs?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  if not extract then pages
  else
    let existing =
      pages
      |> Rrbvec.filter_map (fun entry ->
          let title =
            field runtime (field runtime entry "page") "block/title"
          in
          if Support.Runtime_codec.value_is_nil runtime title then None
          else Some (Support.Runtime_codec.string_from_value runtime title))
    in
    let discovered =
      pages
      |> Rrbvec.fold_left
           (fun result entry ->
             field runtime entry "blocks"
             |> collection runtime
             |> Rrbvec.fold_left
                  (fun result block ->
                    let title = field runtime block "block/title" in
                    if Support.Runtime_codec.value_is_nil runtime title then
                      result
                    else
                      title
                      |> Support.Runtime_codec.string_from_value runtime
                      |> Melange_common.Page_ref.matched_names
                      |> Rrbvec.fold_left
                           (fun result name ->
                             if
                               Melange_common.Uuid.is_string name
                               || Rrbvec.mem name existing
                               || Rrbvec.mem name result
                             then result
                             else Rrbvec.push_back result name)
                           result)
                  result)
           Rrbvec.empty
    in
    let new_pages =
      discovered
      |> Rrbvec.map (fun title ->
          let page =
            empty_map runtime
            |> assoc runtime "block/title"
                 (Support.Runtime_codec.string_to_value runtime title)
          in
          empty_map runtime |> assoc runtime "page" page)
    in
    Rrbvec.append new_pages pages

let page_spec_key runtime page =
  let journal = field runtime page "build/journal" in
  if not (Support.Runtime_codec.value_is_nil runtime journal) then
    "journal:"
    ^ string_of_int (Support.Runtime_codec.int_from_value runtime journal)
  else
    let title = field runtime page "block/title" in
    if Support.Runtime_codec.value_is_nil runtime title then
      let uuid = field runtime page "block/uuid" in
      if Support.Runtime_codec.value_is_nil runtime uuid then
        invalid_arg "Page property value requires a title, journal day, or UUID"
      else "uuid:" ^ Support.Runtime_codec.uuid_to_string runtime uuid
    else "title:" ^ Support.Runtime_codec.string_from_value runtime title

let add_pages_from_property_values runtime options pages =
  let existing =
    pages
    |> Rrbvec.map (fun entry ->
        field runtime entry "page" |> page_spec_key runtime)
  in
  let used = Sqlite_build.getUsedPropertiesWith runtime options in
  let discovered =
    used
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.fold_left
         (fun result -> function
           | [| _property; values |] ->
               values |> collection runtime
               |> Rrbvec.fold_left
                    (fun result value ->
                      let values =
                        if Support.Runtime_codec.value_is_set runtime value
                        then
                          Support.Runtime_codec.set_to_array runtime value
                          |> Rrbvec.of_array
                        else Rrbvec.singleton value
                      in
                      values
                      |> Rrbvec.fold_left
                           (fun result value ->
                             match
                               Sqlite_build.page_property_value runtime
                                 value
                             with
                             | None -> result
                             | Some page ->
                                 let key = page_spec_key runtime page in
                                 let duplicate =
                                   Rrbvec.mem key existing
                                   || Rrbvec.exists
                                        (fun existing_page ->
                                          String.equal key
                                            (page_spec_key runtime existing_page))
                                        result
                                 in
                                 if duplicate then result
                                 else Rrbvec.push_back result page)
                           result)
                    result
           | _ -> result)
         Rrbvec.empty
  in
  let new_pages =
    discovered
    |> Rrbvec.map (fun page -> empty_map runtime |> assoc runtime "page" page)
  in
  Rrbvec.append new_pages pages

let prepare_pages runtime capabilities options pages_and_blocks =
  let prepare_entry entry =
    let page =
      field runtime entry "page" |> prepare_page runtime capabilities
    in
    let blocks =
      field runtime entry "blocks" |> fun blocks ->
      expand_blocks runtime capabilities blocks None
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime
    in
    entry |> assoc runtime "page" page |> assoc runtime "blocks" blocks
  in
  collection runtime pages_and_blocks
  |> add_pages_from_property_values runtime options
  |> Rrbvec.map prepare_entry
  |> add_pages_from_content_refs runtime options
  |> Rrbvec.map (fun entry ->
      let page =
        field runtime entry "page" |> prepare_page runtime capabilities
      in
      assoc runtime "page" page entry)

let page_uuid_map runtime pages =
  Rrbvec.fold_left
    (fun result entry ->
      let page = field runtime entry "page" in
      let title = field runtime page "block/title" in
      if Support.Runtime_codec.value_is_nil runtime title then result
      else
        Support.Runtime_codec.map_assoc runtime result title
          (field runtime page "block/uuid"))
    (empty_map runtime) pages

let build_page runtime capabilities options page =
  let build_existing =
    field runtime options "build-existing-tx?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let new_page =
    field runtime page "logseq.db.sqlite.build/new-page?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let keep_uuid =
    field runtime page "build/keep-uuid?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let existing = build_existing && (not new_page) && not keep_uuid in
  let has_changes =
    let properties = field runtime page "build/properties" in
    let tags = field runtime page "build/tags" in
    (not (Support.Runtime_codec.value_is_nil runtime properties))
    || not (Support.Runtime_codec.value_is_nil runtime tags)
  in
  let source_page = page in
  let page =
    dissoc_many runtime
      (Rrbvec.of_array
         [|
           "build/tags";
           "build/properties";
           "build/keep-uuid?";
           "logseq.db.sqlite.build/new-page?";
         |])
      page
  in
  let page =
    if existing then page
    else
      let title = field runtime page "block/title" in
      let title_text =
        Support.Runtime_codec.string_from_value runtime title
      in
      let tags =
        Support.Runtime_codec.array_to_set runtime
          [| keyword runtime "logseq.class/Page" |]
      in
      empty_map runtime
      |> assoc runtime "db/id" (next_temp_id runtime)
      |> assoc runtime "block/title" title
      |> assoc runtime "block/name"
           (Melange_common.String_util.page_name_sanity_lower title_text
           |> Support.Runtime_codec.string_to_value runtime)
      |> assoc runtime "block/tags" tags
      |> fun base -> merge_map runtime base page
  in
  if existing && not has_changes then
    select_many runtime
      (Rrbvec.of_array
         [| "block/uuid"; "block/created-at"; "block/updated-at" |])
      source_page
  else if existing then
    empty_map runtime
    |> assoc runtime "block/updated-at"
         ((capabilities.nowMs () [@u])
         |> Support.Runtime_codec.float_to_value runtime)
    |> merge_map runtime page
  else timestamp runtime capabilities page

let add_content_refs runtime options page_uuids source block =
  let extract =
    field runtime options "extract-content-refs?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let title = field runtime source "block/title" in
  if (not extract) || Support.Runtime_codec.value_is_nil runtime title then
    block
  else
    let title_text =
      Support.Runtime_codec.string_from_value runtime title
    in
    let names = Melange_common.Page_ref.matched_names title_text in
    if Rrbvec.is_empty names then block
    else
      let refs, replacements =
        names
        |> Rrbvec.fold_left
             (fun (refs, replacements) name ->
               let named = not (Melange_common.Uuid.is_string name) in
               let uuid =
                 if named then
                   let value =
                     Support.Runtime_codec.map_get runtime page_uuids
                       (Support.Runtime_codec.string_to_value runtime name)
                   in
                   if Support.Runtime_codec.value_is_nil runtime value then
                     Js.Exn.raiseError ("No uuid for page ref name " ^ name)
                   else Support.Runtime_codec.uuid_to_string runtime value
                 else name
               in
               let reference =
                 empty_map runtime
                 |> assoc runtime "block/uuid"
                      (Support.Runtime_codec.uuid_from_string runtime uuid)
               in
               let reference =
                 if named then
                   assoc runtime "block/title"
                     (Support.Runtime_codec.string_to_value runtime name)
                     reference
                 else reference
               in
               let replacements =
                 if named then
                   Rrbvec.push_back replacements
                     ({ title = name; id = uuid; original_title = None }
                       : Melange_db.Content.title_ref_entry)
                 else replacements
               in
               (Rrbvec.push_back refs reference, replacements))
             (Rrbvec.empty, Rrbvec.empty)
      in
      let title =
        Melange_db.Content.replace_title_refs title_text replacements
          ~replace_tags:false
        |> Support.Runtime_codec.string_to_value runtime
      in
      block
      |> assoc runtime "block/title" title
      |> assoc runtime "block/refs"
           (refs |> Rrbvec.to_array
           |> Support.Runtime_codec.array_to_vector runtime)

let build_block runtime capabilities options all_idents page_uuids page_id block
    =
  let build_existing =
    field runtime options "build-existing-tx?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let existing_marker =
    field runtime block "logseq.db.sqlite.build/existing-block?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let keep_uuid =
    field runtime block "build/keep-uuid?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let existing = build_existing && existing_marker && not keep_uuid in
  let tags = field runtime block "build/tags" in
  let block_data =
    dissoc_many runtime
      (Rrbvec.of_array
         [|
           "build/properties";
           "build/tags";
           "build/keep-uuid?";
           "logseq.db.sqlite.build/existing-block?";
         |])
      block
  in
  let result =
    if existing then
      empty_map runtime
      |> assoc runtime "block/updated-at"
           ((capabilities.nowMs () [@u])
           |> Support.Runtime_codec.float_to_value runtime)
      |> merge_map runtime block_data
    else
      let parent = field runtime block "block/parent" in
      let parent =
        if Support.Runtime_codec.value_is_nil runtime parent then
          id_reference runtime page_id
        else parent
      in
      empty_map runtime
      |> assoc runtime "db/id" (next_temp_id runtime)
      |> assoc runtime "block/page" (id_reference runtime page_id)
      |> assoc runtime "block/order" (capabilities.generateOrder () [@u])
      |> assoc runtime "block/parent" parent
      |> merge_map runtime block_data
      |> timestamp runtime capabilities
  in
  let result =
    if Support.Runtime_codec.value_is_nil runtime tags then result
    else
      tags |> collection runtime
      |> Rrbvec.map (fun tag ->
          empty_map runtime
          |> assoc runtime "db/ident" (get_ident runtime all_idents tag))
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime
      |> fun tags -> assoc runtime "block/tags" tags result
  in
  add_content_refs runtime options page_uuids block result

let schema_for_property runtime definition =
  Melange_db.Property_catalog.schema_properties
  |> Rrbvec.fold_left
       (fun result name ->
         let key = keyword runtime name in
         if Support.Runtime_codec.map_contains runtime definition key then
           Support.Runtime_codec.map_assoc runtime result key
             (Support.Runtime_codec.map_get runtime definition key)
         else result)
       (empty_map runtime)

let configured_property_type runtime definition =
  let value = field runtime definition "logseq.property/type" in
  if Support.Runtime_codec.value_is_nil runtime value then None
  else value |> keyword_text runtime |> Melange_db.Property_type.of_string

let built_in_property_type runtime property_name =
  let ident = keyword_text runtime property_name in
  match
    Melange_db.Property_catalog.entries
    |> Rrbvec.find_opt (fun entry ->
        Melange_db.Property_catalog.ident entry = ident)
  with
  | None -> None
  | Some entry ->
      if not (Rrbvec.is_empty (Melange_db.Property_catalog.closed_values entry))
      then None
      else
        entry |> Melange_db.Property_catalog.schema
        |> Melange_db.Property_catalog.schema_property_type
        |> Melange_db.Property_type.of_string

let closed_value_uuid runtime definition value =
  let closed_values = field runtime definition "build/closed-values" in
  if Support.Runtime_codec.value_is_nil runtime closed_values then None
  else
    closed_values |> collection runtime
    |> Rrbvec.find_map (fun entry ->
        if
          Support.Runtime_codec.value_equals runtime
            (field runtime entry "value")
            value
        then
          let uuid = field runtime entry "uuid" in
          if Support.Runtime_codec.value_is_nil runtime uuid then None
          else Some uuid
        else None)

let lookup_reference runtime value =
  if not (Support.Runtime_codec.value_is_vector runtime value) then false
  else
    match Support.Runtime_codec.vector_to_array runtime value with
    | [| marker; _uuid |] ->
        Support.Runtime_codec.value_equals runtime marker
          (keyword runtime "block/uuid")
    | _ -> false

let translate_page_property runtime options page_uuids page =
  let translate =
    field runtime options "translate-property-values?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  if not translate then None
  else
    let title =
      let journal = field runtime page "build/journal" in
      if Support.Runtime_codec.value_is_nil runtime journal then
        field runtime page "block/title"
      else
        journal |> Support.Runtime_codec.int_from_value runtime
        |> fun journal_day ->
        Melange_common.Date_time.format_journal_day ~journal_day
          ~formatter:Melange_common.Date_time.default_journal_title_formatter
        |> Support.Runtime_codec.string_to_value runtime
    in
    let uuid = Support.Runtime_codec.map_get runtime page_uuids title in
    if Support.Runtime_codec.value_is_nil runtime uuid then
      Js.Exn.raiseError
        ("No uuid for page "
        ^ Support.Runtime_codec.value_to_string runtime title)
    else
      Some
        (Support.Runtime_codec.array_to_vector runtime
           [| keyword runtime "block/uuid"; uuid |])

let rec build_property_values runtime capabilities options all_idents properties
    page_uuids block property_values =
  let build_one property_name value =
    let db_ident = get_ident runtime all_idents property_name in
    let definition =
      Support.Runtime_codec.map_get runtime properties property_name
    in
    let property_type =
      match configured_property_type runtime definition with
      | Some value -> Some value
      | None -> built_in_property_type runtime property_name
    in
    match closed_value_uuid runtime definition value with
    | Some uuid ->
        ( Rrbvec.empty,
          Support.Runtime_codec.array_to_vector runtime
            [| keyword runtime "block/uuid"; uuid |] )
    | None -> (
        match Sqlite_build.page_property_value runtime value with
        | Some page ->
            let value =
              translate_page_property runtime options page_uuids page
              |> Option.value ~default:value
            in
            (Rrbvec.empty, value)
        | None when lookup_reference runtime value -> (Rrbvec.empty, value)
        | None
          when Sqlite_build.block_property_value runtime value
               && Option.fold ~none:false
                    ~some:(fun value ->
                      Rrbvec.mem value Melange_db.Property_type.all_ref)
                    property_type ->
            let uuid =
              let value_uuid = field runtime value "block/uuid" in
              if Support.Runtime_codec.value_is_nil runtime value_uuid then
                capabilities.generateUuid () [@u]
              else value_uuid
            in
            let lookup =
              Support.Runtime_codec.array_to_vector runtime
                [| keyword runtime "block/uuid"; uuid |]
            in
            let nested_block =
              empty_map runtime
              |> assoc runtime "block/uuid" uuid
              |> assoc runtime "db/id" lookup
            in
            let nested_transactions, nested_properties =
              let values = field runtime value "build/properties" in
              if Support.Runtime_codec.value_is_nil runtime values then
                (Rrbvec.empty, empty_map runtime)
              else
                build_property_values runtime capabilities options all_idents
                  properties page_uuids nested_block values
            in
            let attributes = nested_properties in
            let attributes =
              let tags = field runtime value "build/tags" in
              if Support.Runtime_codec.value_is_nil runtime tags then
                attributes
              else
                tags |> collection runtime
                |> Rrbvec.map (fun tag ->
                    empty_map runtime
                    |> assoc runtime "db/ident"
                         (get_ident runtime all_idents tag))
                |> Rrbvec.to_array
                |> Support.Runtime_codec.array_to_vector runtime
                |> fun tags -> assoc runtime "block/tags" tags attributes
            in
            let attributes =
              Rrbvec.of_array [| "block/created-at"; "block/updated-at" |]
              |> Rrbvec.fold_left
                   (fun result name ->
                     let attribute = field runtime value name in
                     if Support.Runtime_codec.value_is_nil runtime attribute
                     then result
                     else assoc runtime name attribute result)
                   attributes
            in
            let content =
              let property_value =
                field runtime value "logseq.property/value"
              in
              if Support.Runtime_codec.value_truthy runtime property_value
              then property_value
              else field runtime value "block/title"
            in
            let property_type = property_type |> Option.get in
            let property =
              empty_map runtime
              |> assoc runtime "db/ident" db_ident
              |> assoc runtime "logseq.property/type"
                   (Melange_db.Property_type.to_string property_type
                   |> keyword runtime)
            in
            let attributes_option =
              if
                Array.length
                  (Support.Runtime_codec.map_to_entries runtime attributes)
                = 0
              then Js.Nullable.null
              else Js.Nullable.return attributes
            in
            let value_block =
              Property_build.buildValueBlockWith runtime
                capabilities.generateUuid capabilities.generateOrder
                capabilities.nowMs block property content
                ({
                   blockUuid = Js.Nullable.return uuid;
                   properties = attributes_option;
                 }
                  : Property_build.encoded_value_block_options)
            in
            let children_transactions =
              let children = field runtime value "build/children" in
              if Support.Runtime_codec.value_is_nil runtime children then
                Rrbvec.empty
              else
                let page_id = field runtime value_block "block/page" in
                expand_blocks runtime capabilities children (Some uuid)
                |> Rrbvec.concat_map (fun source ->
                    let child =
                      build_block runtime capabilities options all_idents
                        page_uuids page_id source
                    in
                    let values = field runtime source "build/properties" in
                    if Support.Runtime_codec.value_is_nil runtime values
                    then Rrbvec.singleton child
                    else
                      let property_transactions, built =
                        build_property_values runtime capabilities options
                          all_idents properties page_uuids child values
                      in
                      Rrbvec.push_back property_transactions
                        (merge_map runtime child built))
            in
            Rrbvec.push_front nested_transactions value_block |> fun result ->
            ( Rrbvec.append result children_transactions,
              Support.Runtime_codec.array_to_vector runtime
                [| keyword runtime "block/uuid"; uuid |] )
        | None
          when Option.fold ~none:false
                 ~some:(fun value ->
                   Rrbvec.mem value Melange_db.Property_type.all_ref)
                 property_type ->
            let property_type = Option.get property_type in
            let property =
              empty_map runtime
              |> assoc runtime "db/ident" db_ident
              |> assoc runtime "logseq.property/type"
                   (Melange_db.Property_type.to_string property_type
                   |> keyword runtime)
            in
            let options : Property_build.encoded_value_block_options =
              { blockUuid = Js.Nullable.null; properties = Js.Nullable.null }
            in
            let value_block =
              Property_build.buildValueBlockWith runtime
                capabilities.generateUuid capabilities.generateOrder
                capabilities.nowMs block property value options
            in
            let reference =
              Support.Runtime_codec.array_to_vector runtime
                [|
                  keyword runtime "block/uuid";
                  field runtime value_block "block/uuid";
                |]
            in
            (Rrbvec.singleton value_block, reference)
        | None -> (Rrbvec.empty, value))
  in
  property_values
  |> Support.Runtime_codec.map_to_entries runtime
  |> Rrbvec.of_array
  |> Rrbvec.fold_left
       (fun (transactions, properties_result) -> function
         | [| property_name; value |] ->
             let values =
               if Support.Runtime_codec.value_is_set runtime value then
                 Support.Runtime_codec.set_to_array runtime value
               else [| value |]
             in
             let transactions, built_values =
               values
               |> Array.fold_left
                    (fun (transactions, built_values) value ->
                      let value_transactions, built_value =
                        build_one property_name value
                      in
                      ( Rrbvec.append transactions value_transactions,
                        Rrbvec.push_back built_values built_value ))
                    (transactions, Rrbvec.empty)
             in
             let built_value =
               if Support.Runtime_codec.value_is_set runtime value then
                 built_values |> Rrbvec.to_array
                 |> Support.Runtime_codec.array_to_set runtime
               else Rrbvec.nth built_values 0
             in
             ( transactions,
               Support.Runtime_codec.map_assoc runtime properties_result
                 (get_ident runtime all_idents property_name)
                 built_value )
         | _ -> invalid_arg "SQLite build properties expect map entries")
       (Rrbvec.empty, empty_map runtime)

let add_block_properties runtime capabilities options all_idents properties
    page_uuids source owner block =
  let values = field runtime source "build/properties" in
  if Support.Runtime_codec.value_is_nil runtime values then
    (Rrbvec.empty, block)
  else
    let transactions, built =
      build_property_values runtime capabilities options all_idents properties
        page_uuids owner values
    in
    (transactions, merge_map runtime block built)

let ensure_lookup_id runtime entity =
  let id = field runtime entity "db/id" in
  if not (Support.Runtime_codec.value_is_nil runtime id) then entity
  else
    let uuid = field runtime entity "block/uuid" in
    if Support.Runtime_codec.value_is_nil runtime uuid then entity
    else
      assoc runtime "db/id"
        (Support.Runtime_codec.array_to_vector runtime
           [| keyword runtime "block/uuid"; uuid |])
        entity

let add_page_tags runtime all_idents source page =
  let tags = field runtime source "build/tags" in
  if Support.Runtime_codec.value_is_nil runtime tags then page
  else
    let tag_idents =
      tags |> collection runtime |> Rrbvec.map (get_ident runtime all_idents)
    in
    let contains_page_class =
      Rrbvec.exists
        (fun ident ->
          Rrbvec.mem
            (keyword_text runtime ident)
            Melange_db.Class_catalog.page_classes)
        tag_idents
    in
    let tags =
      tag_idents
      |> Rrbvec.map (fun ident ->
          empty_map runtime |> assoc runtime "db/ident" ident)
      |> fun tags ->
      if contains_page_class then tags
      else Rrbvec.push_back tags (keyword runtime "logseq.class/Page")
    in
    assoc runtime "block/tags"
      (tags |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime)
      page

let build_pages_and_blocks runtime capabilities options all_idents properties
    page_uuids pages =
  pages
  |> Rrbvec.concat_map (fun entry ->
      let source_page = field runtime entry "page" in
      let page = build_page runtime capabilities options source_page in
      let page = add_page_tags runtime all_idents source_page page in
      let page_id =
        let id = field runtime page "db/id" in
        if Support.Runtime_codec.value_is_nil runtime id then
          Support.Runtime_codec.array_to_vector runtime
            [|
              keyword runtime "block/uuid";
              field runtime source_page "block/uuid";
            |]
        else id
      in
      let page_property_transactions, page =
        add_block_properties runtime capabilities options all_idents properties
          page_uuids source_page
          (ensure_lookup_id runtime page)
          page
      in
      let blocks =
        field runtime entry "blocks"
        |> collection runtime
        |> Rrbvec.concat_map (fun source ->
            let block =
              build_block runtime capabilities options all_idents page_uuids
                page_id source
            in
            let property_transactions, block =
              let owner = ensure_lookup_id runtime block in
              let owner =
                let owner_page = field runtime owner "block/page" in
                if Support.Runtime_codec.value_is_nil runtime owner_page
                then
                  assoc runtime "block/page"
                    (id_reference runtime page_id)
                    owner
                else owner
              in
              add_block_properties runtime capabilities options all_idents
                properties page_uuids source owner block
            in
            Rrbvec.push_back property_transactions block)
      in
      page_property_transactions |> fun result ->
      Rrbvec.push_back result page |> fun result -> Rrbvec.append result blocks)

let build_properties_with build_property runtime capabilities options all_idents
    class_property_orders page_uuids properties =
  let build_existing =
    field runtime options "build-existing-tx?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  properties
  |> Support.Runtime_codec.map_to_entries runtime
  |> Rrbvec.of_array
  |> Rrbvec.concat_map (function
    | [| property_name; definition |] ->
        let uuid = field runtime definition "block/uuid" in
        let keep_uuid =
          field runtime definition "build/keep-uuid?"
          |> Support.Runtime_codec.value_truthy runtime
        in
        if
          build_existing
          && (not (Support.Runtime_codec.value_is_nil runtime uuid))
          && not keep_uuid
        then Rrbvec.empty
        else
          let db_ident = get_ident runtime all_idents property_name in
          let schema = schema_for_property runtime definition in
          let options_map =
            empty_map runtime
            |> assoc runtime "title" (field runtime definition "block/title")
            |> assoc runtime "block-uuid" uuid
          in
          let property =
            build_property runtime capabilities.generateOrder
              capabilities.nowMs db_ident schema options_map
            |> assoc runtime "db/id" (next_temp_id runtime)
          in
          let property =
            let order =
              Support.Runtime_codec.map_get runtime class_property_orders
                property_name
            in
            if Support.Runtime_codec.value_is_nil runtime order then
              property
            else assoc runtime "block/order" order property
          in
          let property =
            let classes = field runtime definition "build/property-classes" in
            if Support.Runtime_codec.value_is_nil runtime classes then
              property
            else
              classes |> collection runtime
              |> Rrbvec.map (fun class_name ->
                  empty_map runtime
                  |> assoc runtime "db/ident"
                       (get_ident runtime all_idents class_name))
              |> Rrbvec.to_array
              |> Support.Runtime_codec.array_to_vector runtime
              |> fun classes ->
              assoc runtime "logseq.property/classes" classes property
          in
          let attributes =
            select_many runtime
              (Rrbvec.of_array
                 [|
                   "build/properties-ref-types";
                   "block/created-at";
                   "block/updated-at";
                   "block/collapsed?";
                   "block/alias";
                 |])
              definition
          in
          let property = merge_map runtime property attributes in
          let property_transactions, property =
            add_block_properties runtime capabilities options all_idents
              properties page_uuids definition property property
          in
          let closed_values = field runtime definition "build/closed-values" in
          let closed_transactions =
            if Support.Runtime_codec.value_is_nil runtime closed_values then
              Rrbvec.empty
            else
              closed_values |> collection runtime
              |> Rrbvec.map (fun entry ->
                  let block_type =
                    field runtime definition "logseq.property/type"
                  in
                  let options : Property_build.encoded_closed_value_options
                      =
                    {
                      dbIdent = Js.Nullable.null;
                      icon = field runtime entry "icon" |> Js.Nullable.return;
                    }
                  in
                  Property_build.buildClosedValueBlockWith runtime
                    capabilities.nowMs
                    (field runtime entry "uuid")
                    block_type
                    (field runtime entry "value")
                    property options
                  |> assoc runtime "block/order"
                       (capabilities.generateOrder () [@u]))
          in
          property_transactions |> fun result ->
          Rrbvec.push_back result property |> fun result ->
          Rrbvec.append result closed_transactions
    | _ -> invalid_arg "SQLite build properties expect map entries")

let build_properties runtime capabilities options all_idents
    class_property_orders page_uuids properties =
  build_properties_with Sqlite_util.buildProperty runtime capabilities options
    all_idents class_property_orders page_uuids properties

let prepare_closed_values runtime capabilities properties =
  properties
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.map (function
    | [| property_name; definition |] ->
        let values = field runtime definition "build/closed-values" in
        let definition =
          if Support.Runtime_codec.value_is_nil runtime values then
            definition
          else
            values |> collection runtime
            |> Rrbvec.map (fun entry ->
                let uuid = field runtime entry "uuid" in
                if Support.Runtime_codec.value_is_nil runtime uuid then
                  assoc runtime "uuid" (capabilities.generateUuid () [@u]) entry
                else entry)
            |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime
            |> fun values ->
            assoc runtime "build/closed-values" values definition
        in
        [| property_name; definition |]
    | _ -> invalid_arg "SQLite build properties expect map entries")
  |> Support.Runtime_codec.entries_to_map runtime

let class_property_orders runtime capabilities classes =
  let constraints =
    classes
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.filter_map (function
      | [| _class_name; definition |] ->
          let properties = field runtime definition "build/class-properties" in
          if Support.Runtime_codec.value_is_nil runtime properties then None
          else
            let properties = collection runtime properties in
            if Rrbvec.is_empty properties then None
            else Some (Rrbvec.map (keyword_text runtime) properties)
      | _ -> None)
  in
  Melange_db.Sqlite_build.class_property_order constraints
  |> Rrbvec.fold_left
       (fun result property_name ->
         Support.Runtime_codec.map_assoc runtime result
           (keyword runtime property_name)
           (capabilities.generateOrder () [@u]))
       (empty_map runtime)

let build_classes runtime capabilities options all_idents properties page_uuids
    classes =
  let build_existing =
    field runtime options "build-existing-tx?"
    |> Support.Runtime_codec.value_truthy runtime
  in
  let entries =
    classes
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.filter (function
      | [| _class_name; class_definition |] ->
          let uuid = field runtime class_definition "block/uuid" in
          let keep_uuid =
            field runtime class_definition "build/keep-uuid?"
            |> Support.Runtime_codec.value_truthy runtime
          in
          not
            (build_existing
            && (not (Support.Runtime_codec.value_is_nil runtime uuid))
            && not keep_uuid)
      | _ -> false)
  in
  let class_ids =
    entries
    |> Rrbvec.fold_left
         (fun result -> function
           | [| class_name; _ |] ->
               Support.Runtime_codec.map_assoc runtime result class_name
                 (next_temp_id runtime)
           | _ -> result)
         (empty_map runtime)
  in
  let class_reference class_name =
    let id = Support.Runtime_codec.map_get runtime class_ids class_name in
    if not (Support.Runtime_codec.value_is_nil runtime id) then id
    else
      let namespace_, _name = keyword_parts runtime class_name in
      if
        Option.fold ~none:false ~some:Melange_db.Class_read.logseq_class
          namespace_
      then class_name
      else
        Js.Exn.raiseError
          ("No :db/id for "
          ^ Support.Runtime_codec.value_to_string runtime class_name)
  in
  entries
  |> Rrbvec.concat_map (function
    | [| class_name; class_definition |] ->
        let uuid = field runtime class_definition "block/uuid" in
        let db_ident = get_ident runtime all_idents class_name in
        let namespace_, ident_name = keyword_parts runtime db_ident in
        let _source_namespace, title = keyword_parts runtime class_name in
        let uuid =
          if Support.Runtime_codec.value_is_nil runtime uuid then
            Melange_common.Uuid.db_ident_block ~namespace_ ~name:ident_name
            |> Support.Runtime_codec.uuid_from_string runtime
          else uuid
        in
        let block =
          empty_map runtime
          |> assoc runtime "block/name"
               (Melange_common.String_util.page_name_sanity_lower title
               |> Support.Runtime_codec.string_to_value runtime)
          |> assoc runtime "block/title"
               (Support.Runtime_codec.string_to_value runtime title)
          |> assoc runtime "block/uuid" uuid
          |> assoc runtime "db/ident" db_ident
          |> assoc runtime "db/id"
               (Support.Runtime_codec.map_get runtime class_ids class_name)
          |> Sqlite_util.buildClassWith runtime capabilities.nowMs
        in
        let block =
          let class_properties =
            field runtime class_definition "build/class-properties"
          in
          if Support.Runtime_codec.value_is_nil runtime class_properties
          then block
          else
            class_properties |> collection runtime
            |> Rrbvec.map (fun property_name ->
                empty_map runtime
                |> assoc runtime "db/ident"
                     (get_ident runtime all_idents property_name))
            |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime
            |> fun properties ->
            assoc runtime "logseq.property.class/properties" properties block
        in
        let block =
          let parent = field runtime class_definition "build/class-parent" in
          let extends =
            if not (Support.Runtime_codec.value_is_nil runtime parent) then
              Rrbvec.singleton parent
            else
              field runtime class_definition "build/class-extends"
              |> collection runtime
          in
          if Rrbvec.is_empty extends then block
          else
            extends |> Rrbvec.map class_reference |> Rrbvec.to_array
            |> Support.Runtime_codec.array_to_vector runtime
            |> fun extends ->
            assoc runtime "logseq.property.class/extends" extends block
        in
        let definition =
          dissoc_many runtime
            (Rrbvec.of_array
               [|
                 "build/properties";
                 "build/class-extends";
                 "build/class-parent";
                 "build/class-properties";
                 "build/keep-uuid?";
               |])
            class_definition
        in
        let block = merge_map runtime block definition in
        let property_transactions, block =
          add_block_properties runtime capabilities options all_idents
            properties page_uuids class_definition block block
        in
        Rrbvec.push_back property_transactions block
    | _ -> invalid_arg "SQLite build classes expect map entries")

let split_transactions runtime all_idents properties transactions =
  let property_idents =
    properties
    |> Support.Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.filter_map (function
      | [| property_name; _ |] ->
          Some (get_ident runtime all_idents property_name)
      | _ -> None)
  in
  let init, deferred =
    transactions
    |> Rrbvec.fold_left
         (fun (init, deferred) transaction ->
           let selected =
             property_idents
             |> Rrbvec.fold_left
                  (fun result ident ->
                    if
                      Support.Runtime_codec.map_contains runtime transaction
                        ident
                    then
                      Support.Runtime_codec.map_assoc runtime result ident
                        (Support.Runtime_codec.map_get runtime transaction
                           ident)
                    else result)
                  (empty_map runtime)
           in
           let transaction =
             property_idents
             |> Rrbvec.fold_left
                  (fun result ident ->
                    Support.Runtime_codec.map_dissoc runtime result ident)
                  transaction
           in
           let init = Rrbvec.push_back init transaction in
           if
             Array.length
               (Support.Runtime_codec.map_to_entries runtime selected)
             = 0
           then (init, deferred)
           else
             let uuid = field runtime transaction "block/uuid" in
             if Support.Runtime_codec.value_is_nil runtime uuid then
               Js.Exn.raiseError "No :block/uuid for block property transaction"
             else
               let deferred_tx =
                 empty_map runtime
                 |> assoc runtime "block/uuid" uuid
                 |> merge_map runtime selected
               in
               (init, Rrbvec.push_back deferred deferred_tx))
         (Rrbvec.empty, Rrbvec.empty)
  in
  empty_map runtime
  |> assoc runtime "init-tx"
       (init |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_vector runtime)
  |> assoc runtime "block-props-tx"
       (deferred |> Rrbvec.to_array
       |> Support.Runtime_codec.array_to_vector runtime)

let build_blocks_tx_with build_all_idents build_properties runtime
    capabilities options =
  validateOptionsWith runtime options;
  let options = normalize_options runtime options in
  let pages =
    field runtime options "pages-and-blocks"
    |> prepare_pages runtime capabilities options
  in
  let page_uuids = page_uuid_map runtime pages in
  let empty = empty_map runtime in
  let properties =
    let value = field runtime options "properties" in
    if Support.Runtime_codec.value_is_nil runtime value then empty
    else value
  in
  let classes =
    let value = field runtime options "classes" in
    if Support.Runtime_codec.value_is_nil runtime value then empty
    else value
  in
  let properties, classes =
    if
      field runtime options "auto-create-ontology?"
      |> Support.Runtime_codec.value_truthy runtime
    then
      let ontology = Sqlite_build.autoCreateOntologyWith runtime options in
      (field runtime ontology "properties", field runtime ontology "classes")
    else (properties, classes)
  in
  let properties = prepare_closed_values runtime capabilities properties in
  let all_idents =
    build_all_idents runtime options properties classes
  in
  let class_orders = class_property_orders runtime capabilities classes in
  let properties_tx =
    build_properties runtime capabilities options all_idents class_orders
      page_uuids properties
  in
  let classes_tx =
    build_classes runtime capabilities options all_idents properties page_uuids
      classes
  in
  let content_tx =
    build_pages_and_blocks runtime capabilities options all_idents properties
      page_uuids pages
  in
  properties_tx |> fun result ->
  Rrbvec.append result classes_tx |> fun result ->
  Rrbvec.append result content_tx
  |> split_transactions runtime all_idents properties

let build_blocks_tx_with_capabilities runtime capabilities options =
  build_blocks_tx_with build_all_idents build_properties runtime capabilities
    options

let buildBlocksTx runtime options =
  build_blocks_tx_with_capabilities runtime (default_capabilities runtime)
    options

let create_blocks_with build_blocks_tx runtime datascript capabilities
    connection options =
  let options =
    default_option runtime "auto-create-ontology?"
      (Support.Runtime_codec.bool_to_value runtime true)
      options
  in
  let transactions = build_blocks_tx runtime capabilities options in
  let init = field runtime transactions "init-tx" in
  let deferred = field runtime transactions "block-props-tx" in
  ignore
    (Support.Datascript.transact datascript connection init Js.Nullable.null);
  if
    Array.length
      (Support.Runtime_codec.collection_to_array runtime deferred)
    = 0
  then Js.Nullable.null
  else
    Support.Datascript.transact datascript connection deferred
      Js.Nullable.null
    |> Js.Nullable.return

let createBlocks runtime datascript capabilities connection options =
  create_blocks_with build_blocks_tx_with_capabilities runtime datascript
    capabilities connection options

let createBlocksInput runtime datascript connection input =
  let options =
    if Support.Runtime_codec.value_is_vector runtime input then
      empty_map runtime |> assoc runtime "pages-and-blocks" input
    else input
  in
  createBlocks runtime datascript (default_capabilities runtime) connection
    options
