module Domain = Melange_db.Core_read

type encoded_orphan = {
  emptyRefs : bool;
  emptyOrPlaceholder : bool;
  builtIn : bool;
  propertyValue : bool;
  namespacedNonJournal : bool;
  hasProperties : bool;
  hidden : bool;
}

let caseSensitivePageLookup tags =
  Domain.case_sensitive_page_lookup (Rrbvec.of_array tags)

let orphan (candidate : encoded_orphan) =
  Domain.orphan
    {
      empty_refs = candidate.emptyRefs;
      empty_or_placeholder = candidate.emptyOrPlaceholder;
      built_in = candidate.builtIn;
      property = candidate.propertyValue;
      namespaced_non_journal = candidate.namespacedNonJournal;
      has_properties = candidate.hasProperties;
      hidden = candidate.hidden;
    }

let pageInLibrary library_id parent_ids =
  Domain.page_in_library ~library_id (Rrbvec.of_array parent_ids)

let pageInLibraryWith runtime datascript database page =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  let optional_field entity name =
    let value = field entity name in
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some value
  in
  let capabilities :
      ( Support.Datascript.entity,
        Support.Runtime_codec.value )
      Domain.library_capabilities =
    {
      library_page =
        (fun () ->
          let uuid =
            Melange_common.Uuid.builtin_block
              Melange_common.Config.library_page_name
            |> Support.Runtime_codec.uuid_from_string runtime
          in
          let lookup =
            [|
              Support.Runtime_codec.keyword_from_string runtime "block/uuid";
              uuid;
            |]
            |> Support.Runtime_codec.array_to_vector runtime
          in
          Support.Datascript.entity datascript database lookup
          |> Js.Nullable.toOption);
      eligible_page =
        (fun entity ->
          match
            Entity_read.pageWith runtime datascript entity
            |> Js.Nullable.toOption
          with
          | Some true -> true
          | Some false | None -> false);
      library_entity_id = (fun entity -> field entity "db/id");
      library_equal_id = Support.Runtime_codec.value_equals runtime;
      library_parent = (fun entity -> optional_field entity "block/parent");
    }
  in
  Domain.page_in_library_with capabilities page

let libraryPageWith runtime datascript database =
  let uuid =
    Melange_common.Uuid.builtin_block Melange_common.Config.library_page_name
    |> Support.Runtime_codec.uuid_from_string runtime
  in
  let lookup =
    [|
      Support.Runtime_codec.keyword_from_string runtime "block/uuid"; uuid;
    |]
    |> Support.Runtime_codec.array_to_vector runtime
  in
  Support.Datascript.entity datascript database lookup

let page_lookup_capabilities runtime datascript database :
    ( Support.Datascript.entity,
      Support.Runtime_codec.value )
    Domain.page_lookup_capabilities =
  let keyword name =
    Support.Runtime_codec.keyword_from_string runtime name
  in
  let entity lookup =
    Support.Datascript.entity datascript database lookup
    |> Js.Nullable.toOption
  in
  let by_uuid uuid =
    [| keyword "block/uuid"; uuid |]
    |> Support.Runtime_codec.array_to_vector runtime
    |> entity
  in
  let oldest attribute text eligible =
    Melange_db.Initial_read.oldest_matching_id_with
      ~datoms:(fun () ->
        Support.Datascript.datoms datascript database (keyword "avet")
          [|
            attribute; Support.Runtime_codec.string_to_value runtime text;
          |])
      ~datom_id:(fun datom ->
        Support.Datascript.datom_entity datascript datom
        |> Support.Runtime_codec.int_from_value runtime)
      ~eligible
    |> Option.map (Support.Runtime_codec.int_to_value runtime)
  in
  {
    page_by_id = entity;
    page_by_uuid = by_uuid;
    oldest_page_by_name =
      (fun name ->
        oldest (keyword "block/name")
          (Melange_common.String_util.page_name_sanity_lower name) (fun _ ->
            true));
    oldest_page_by_title =
      (fun title ->
        oldest (keyword "block/title") title (fun id ->
            let page_entity =
              match
                Support.Runtime_codec.int_to_value runtime id |> entity
              with
              | Some value -> value
              | None -> invalid_arg "DB page lookup: entity is missing"
            in
            match
              Entity_read.pageWith runtime datascript page_entity
              |> Js.Nullable.toOption
            with
            | Some page -> page
            | None -> invalid_arg "DB page lookup: value is not an entity"));
    parse_page_uuid =
      (fun text ->
        if Melange_common.Uuid.is_string text then
          Some (Support.Runtime_codec.uuid_from_string runtime text)
        else None);
  }

let page_reference runtime kind value =
  match kind with
  | "id" -> Domain.Page_id value
  | "uuid" -> Domain.Page_uuid value
  | "name" ->
      Domain.Page_name
        (Support.Runtime_codec.string_from_value runtime value)
  | kind -> invalid_arg ("DB core reads: unknown page lookup " ^ kind)

let pageWith runtime datascript database kind value =
  Domain.page_with
    (page_lookup_capabilities runtime datascript database)
    (page_reference runtime kind value)
  |> Js.Nullable.fromOption

let value_name runtime value =
  if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else if Support.Runtime_codec.value_is_keyword runtime value then
    let ident = Support.Runtime_codec.keyword_to_string runtime value in
    match String.rindex_opt ident '/' with
    | None -> ident
    | Some index ->
        String.sub ident (index + 1) (String.length ident - index - 1)
  else Support.Runtime_codec.value_to_string runtime value

let inferred_page_reference runtime value =
  if Support.Runtime_codec.value_is_integer runtime value then
    Domain.Page_id value
  else if Support.Runtime_codec.value_is_uuid runtime value then
    Domain.Page_uuid value
  else Domain.Page_name (value_name runtime value)

let pageByReferenceWith runtime datascript
    (database : Support.Datascript.database Js.Nullable.t) value =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database ->
      Domain.page_with
        (page_lookup_capabilities runtime datascript database)
        (inferred_page_reference runtime value)
      |> Js.Nullable.fromOption

let journalPageWith runtime datascript database value =
  Domain.journal_page_value_with
    ~decode_name:(fun value ->
      if Support.Runtime_codec.value_is_string runtime value then
        Some (Support.Runtime_codec.string_from_value runtime value)
      else None)
    (page_lookup_capabilities runtime datascript database)
    value
  |> Js.Nullable.fromOption

let journalPageByDatabaseWith runtime datascript
    (database : Support.Datascript.database Js.Nullable.t) value =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database -> journalPageWith runtime datascript database value

let casePageWith runtime datascript database kind value =
  Domain.case_page_with
    (page_lookup_capabilities runtime datascript database)
    (page_reference runtime kind value)
  |> Js.Nullable.fromOption

let casePageByReferenceWith runtime datascript
    (database : Support.Datascript.database Js.Nullable.t) value =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database ->
      Domain.case_page_with
        (page_lookup_capabilities runtime datascript database)
        (inferred_page_reference runtime value)
      |> Js.Nullable.fromOption

let direct_child_capabilities runtime datascript database :
    ( Support.Datascript.entity,
      Support.Runtime_codec.value )
    Domain.direct_child_capabilities =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  {
    direct_lookup = page_lookup_capabilities runtime datascript database;
    direct_children =
      (fun entity ->
        let value = field entity "block/_parent" in
        if Support.Runtime_codec.value_is_nil runtime value then
          Rrbvec.empty
        else
          value
          |> Support.Runtime_codec.collection_to_array runtime
          |> Rrbvec.of_array);
    direct_children_present =
      (fun entity ->
        field entity "block/_parent"
        |> Support.Runtime_codec.value_is_nil runtime
        |> not);
    direct_collapsed =
      (fun entity ->
        field entity "block/collapsed?"
        |> Support.Runtime_codec.value_truthy runtime);
    direct_order =
      (fun entity ->
        let value = field entity "block/order" in
        if Support.Runtime_codec.value_is_nil runtime value then ""
        else Support.Runtime_codec.string_from_value runtime value);
    direct_id = (fun entity -> field entity "db/id");
  }

let pageEmptyWith runtime datascript database kind value =
  Domain.page_empty_with
    (direct_child_capabilities runtime datascript database)
    (page_reference runtime kind value)

let pageEmptyByReferenceWith runtime datascript database value =
  let reference =
    if Support.Runtime_codec.value_is_string runtime value then
      Domain.Page_name
        (Support.Runtime_codec.string_from_value runtime value)
    else Domain.Page_id value
  in
  Domain.page_empty_with
    (direct_child_capabilities runtime datascript database)
    reference

let hasChildrenWith runtime datascript database kind value =
  Domain.has_children_with
    (direct_child_capabilities runtime datascript database)
    (page_reference runtime kind value)

let hasChildrenByReferenceWith runtime datascript database value =
  let reference =
    if Support.Runtime_codec.value_is_uuid runtime value then
      Domain.Page_uuid value
    else Domain.Page_id value
  in
  Domain.has_children_with
    (direct_child_capabilities runtime datascript database)
    reference

let lastDirectChildIdWith runtime datascript database value not_collapsed =
  Domain.last_direct_child_id_with
    (direct_child_capabilities runtime datascript database)
    ~not_collapsed (Domain.Page_id value)
  |> Js.Nullable.fromOption

let searchLastChild not_collapsed collapsed has_children =
  Domain.search_last_child ~not_collapsed ~collapsed ~has_children

let pageBlocksWith runtime datascript database page_id pattern =
  let attribute =
    Support.Runtime_codec.keyword_from_string runtime "block/page"
  in
  Domain.page_blocks_with
    ~datoms:(fun attribute page_id ->
      Support.Datascript.datoms datascript database
        (Support.Runtime_codec.keyword_from_string runtime "avet")
        [| attribute; page_id |])
    ~datom_entity:(Support.Datascript.datom_entity datascript)
    ~pull_many:(fun pattern ids ->
      Support.Datascript.pull_many datascript database pattern ids)
    ~attribute ~pattern page_id

let pageBlocksByPageWith runtime datascript database
    (page_id : Support.Runtime_codec.value Js.Nullable.t) pattern =
  match Js.Nullable.toOption page_id with
  | None -> Js.Nullable.undefined
  | Some page_id ->
      pageBlocksWith runtime datascript database page_id pattern
      |> Js.Nullable.return

let pageBlocksCountWith runtime datascript database page_id =
  let attribute =
    Support.Runtime_codec.keyword_from_string runtime "block/page"
  in
  Domain.page_blocks_count_with
    ~datoms:(fun attribute page_id ->
      Support.Datascript.datoms datascript database
        (Support.Runtime_codec.keyword_from_string runtime "avet")
        [| attribute; page_id |])
    ~attribute page_id

let journalPageByDayWith runtime datascript database day =
  let attribute =
    Support.Runtime_codec.keyword_from_string runtime "block/journal-day"
  in
  Domain.journal_page_by_day_with
    ~datoms:(fun attribute day ->
      Support.Datascript.datoms datascript database
        (Support.Runtime_codec.keyword_from_string runtime "avet")
        [| attribute; day |])
    ~datom_entity:(Support.Datascript.datom_entity datascript)
    ~entity:(fun id ->
      Support.Datascript.entity datascript database id
      |> Js.Nullable.toOption)
    ~attribute day
  |> Js.Nullable.fromOption

let journalPageByDayInputWith runtime datascript
    (database : Support.Datascript.database Js.Nullable.t)
    (day : Support.Runtime_codec.value Js.Nullable.t) =
  match (Js.Nullable.toOption database, Js.Nullable.toOption day) with
  | Some database, Some day ->
      journalPageByDayWith runtime datascript database day
  | None, _ | _, None -> Js.Nullable.undefined

let keyValueWith runtime datascript database key =
  Domain.key_value_with
    ~entity:(fun key ->
      Support.Datascript.entity datascript database key
      |> Js.Nullable.toOption)
    ~value:(fun entity ->
      let value = Entity_read.field runtime datascript entity "kv/value" in
      if Support.Runtime_codec.value_is_nil runtime value then None
      else Some value)
    key
  |> Js.Nullable.fromOption

let optionalKeyValueWith runtime datascript
    (database : Support.Datascript.database Js.Nullable.t) key =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database -> keyValueWith runtime datascript database key

let pageExistsWith runtime datascript database page_name tags =
  let tag_text value =
    if Support.Runtime_codec.value_is_keyword runtime value then
      Support.Runtime_codec.keyword_to_string runtime value
    else Support.Runtime_codec.value_to_string runtime value
  in
  let case_sensitive =
    tags
    |> Support.Runtime_codec.collection_to_array runtime
    |> Array.map tag_text |> Rrbvec.of_array
    |> Domain.case_sensitive_page_lookup
  in
  Domain.page_exists_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form inputs ->
      Support.Datascript.query datascript form database inputs)
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~string_to_value:(Support.Runtime_codec.string_to_value runtime)
    ~case_sensitive ~page_name
    ~normalized_name:
      (Melange_common.String_util.page_name_sanity_lower page_name)
    ~tags

let pageExistsInputWith runtime datascript database
    (page_name : Support.Runtime_codec.value Js.Nullable.t) tags =
  match Js.Nullable.toOption page_name with
  | None -> Js.Nullable.undefined
  | Some page_name ->
      let collection =
        Support.Runtime_codec.value_is_vector runtime tags
        || Support.Runtime_codec.value_is_set runtime tags
        || Support.Runtime_codec.value_is_sequential runtime tags
        || Support.Runtime_codec.value_is_map runtime tags
      in
      let tags =
        if collection then tags
        else Support.Runtime_codec.array_to_set runtime [| tags |]
      in
      pageExistsWith runtime datascript database
        (Support.Runtime_codec.string_from_value runtime page_name)
        tags
      |> Js.Nullable.return

let pagesWith runtime datascript database =
  Domain.pages_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form ->
      Support.Datascript.query datascript form database [||])
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~row_first:(fun row ->
      match
        Support.Runtime_codec.collection_to_array runtime row
        |> Array.to_list
      with
      | value :: _ -> value
      | [] -> invalid_arg "DB pages: query row is empty")
    ~hidden:(Entity_read.hiddenWith runtime datascript)

let orphanedPagesWith runtime datascript database pages built_in_pages_names
    empty_ref_callback =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  let collection entity name =
    let value = field entity name in
    if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
    else
      value
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array
  in
  let required_string entity name =
    let value = field entity name in
    if Support.Runtime_codec.value_is_string runtime value then
      Support.Runtime_codec.string_from_value runtime value
    else invalid_arg ("DB orphaned pages: missing string field " ^ name)
  in
  let reference value =
    if Support.Runtime_codec.value_is_integer runtime value then
      Domain.Page_id value
    else if Support.Runtime_codec.value_is_uuid runtime value then
      Domain.Page_uuid value
    else if Support.Runtime_codec.value_is_string runtime value then
      Domain.Page_name
        (Support.Runtime_codec.string_from_value runtime value)
    else if Support.Runtime_codec.value_is_keyword runtime value then
      Domain.Page_name
        (Support.Runtime_codec.keyword_to_string runtime value)
    else invalid_arg "DB orphaned pages: invalid page reference"
  in
  let empty_ref_callback = Js.Nullable.toOption empty_ref_callback in
  let capabilities :
      ( Support.Datascript.entity,
        Support.Runtime_codec.value )
      Domain.orphan_capabilities =
    {
      orphan_default_pages =
        (fun () -> pagesWith runtime datascript database |> Rrbvec.of_array);
      orphan_resolve_page =
        (fun value ->
          Domain.page_with
            (page_lookup_capabilities runtime datascript database)
            (reference value));
      orphan_empty_refs =
        (fun entity ->
          match empty_ref_callback with
          | Some callback ->
              Support.Runtime_codec.invoke_callback runtime callback entity
              |> Support.Runtime_codec.value_truthy runtime
          | None -> Rrbvec.is_empty (collection entity "block/_refs"));
      orphan_direct_children = (fun entity -> collection entity "block/_parent");
      orphan_page_children_count =
        (fun entity -> Rrbvec.length (collection entity "block/_page"));
      orphan_name = (fun entity -> required_string entity "block/name");
      orphan_title = (fun entity -> required_string entity "block/title");
      orphan_order =
        (fun entity ->
          let value = field entity "block/order" in
          if Support.Runtime_codec.value_is_nil runtime value then ""
          else Support.Runtime_codec.string_from_value runtime value);
      orphan_property = Entity_read.propertyWith runtime datascript;
      orphan_journal = Entity_read.journalWith runtime datascript;
      orphan_has_properties =
        (fun entity ->
          field entity "block/properties"
          |> Support.Runtime_codec.value_truthy runtime);
      orphan_hidden = Entity_read.hiddenWith runtime datascript;
    }
  in
  let pages =
    Js.Nullable.toOption pages
    |> Option.map (fun values ->
        values
        |> Support.Runtime_codec.collection_to_array runtime
        |> Rrbvec.of_array)
  in
  let built_in_pages_names =
    if Support.Runtime_codec.value_is_nil runtime built_in_pages_names then
      Rrbvec.empty
    else
      built_in_pages_names
      |> Support.Runtime_codec.collection_to_array runtime
      |> Array.map (Support.Runtime_codec.string_from_value runtime)
      |> Rrbvec.of_array
  in
  Domain.orphaned_pages_with capabilities ~pages ~built_in_pages_names
  |> Rrbvec.to_array

let aliasSourcePageWith runtime datascript database alias_id =
  let aliases entity =
    let value =
      Entity_read.field runtime datascript entity "block/_alias"
    in
    if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
    else
      value
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array
  in
  Domain.alias_source_page_with
    ~entity:(fun id ->
      Support.Datascript.entity datascript database id
      |> Js.Nullable.toOption)
    ~aliases
    (Js.Nullable.toOption alias_id)
  |> Js.Nullable.fromOption

let pageAliasSetWith runtime datascript database page_id =
  let rule =
    Melange_db.Rules.find_body "alias"
    |> Support.encode_datalog_form runtime
  in
  Melange_db.Initial_read.related_ids_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form inputs ->
      Support.Datascript.query datascript form database inputs)
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~value_equals:(Support.Runtime_codec.value_equals runtime)
    ~relation:"alias" ~root:page_id ~rule
  |> Rrbvec.of_array
  |> Domain.page_alias_set
       ~equal:(Support.Runtime_codec.value_equals runtime)
       page_id
  |> Rrbvec.to_array

let hiddenOrInternalTagWith runtime datascript entity =
  let internal_ident value =
    let ident = Entity_read.field runtime datascript value "db/ident" in
    Support.Runtime_codec.value_is_keyword runtime ident
    && Rrbvec.mem
         (Support.Runtime_codec.keyword_to_string runtime ident)
         Melange_db.Class_catalog.internal_tags
  in
  Domain.hidden_or_internal_tag
    ~hidden:(Entity_read.hiddenWith runtime datascript)
    ~internal_ident entity

let page_order_capabilities runtime datascript database :
    ( Support.Datascript.entity,
      Support.Runtime_codec.value )
    Domain.page_order_capabilities =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  let optional_field entity name =
    let value = field entity name in
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some value
  in
  let entity id =
    Support.Datascript.entity datascript database id |> Js.Nullable.toOption
  in
  {
    order_entity = entity;
    order_id = (fun value -> field value "db/id");
    order_equal_id = Support.Runtime_codec.value_equals runtime;
    order_page = (fun value -> optional_field value "block/page");
    order_parent = (fun value -> optional_field value "block/parent");
    order_left_sibling =
      (fun value ->
        Tree_workflow.siblingWith runtime datascript value "left"
        |> Js.Nullable.toOption);
    order_right_sibling =
      (fun value ->
        Tree_workflow.siblingWith runtime datascript value "right"
        |> Js.Nullable.toOption);
    ordered_page_blocks =
      (fun page_id ->
        let page =
          match entity page_id with
          | Some value -> value
          | None -> invalid_arg "DB core reads: page entity is missing"
        in
        let uuid =
          match optional_field page "block/uuid" with
          | Some value -> value
          | None -> invalid_arg "DB core reads: page UUID is missing"
        in
        Tree_workflow.blockAndChildrenWith runtime datascript database uuid
          false
        |> Js.Nullable.toOption
        |> function
        | Some values -> Rrbvec.of_array values
        | None -> invalid_arg "DB core reads: page tree root is missing");
  }

let sortPageRandomBlocksWith runtime datascript database blocks =
  blocks |> Rrbvec.of_array
  |> Domain.sort_page_random_blocks_with
       (page_order_capabilities runtime datascript database)
  |> Rrbvec.to_array

let lastChildBlockWith runtime datascript database parent_id child_id =
  Domain.last_child_block_with
    (page_order_capabilities runtime datascript database)
    ~parent_id ~child_id
  |> Js.Nullable.fromOption

let nonConsecutiveBlocksWith runtime datascript database blocks =
  blocks |> Rrbvec.of_array
  |> Domain.non_consecutive_blocks_with
       (page_order_capabilities runtime datascript database)
  |> Rrbvec.to_array

let allPagesWith runtime datascript database =
  let keyword name =
    Support.Runtime_codec.keyword_from_string runtime name
  in
  Domain.all_pages_with
    ~datoms:(fun () ->
      Support.Datascript.datoms datascript database (keyword "avet")
        [| keyword "block/name" |])
    ~datom_entity:(Support.Datascript.datom_entity datascript)
    ~entity:(fun id ->
      Support.Datascript.entity datascript database id
      |> Js.Nullable.toOption)
    ~hidden:(Entity_read.hiddenWith runtime datascript)
    ~internal:(fun entity ->
      let ident = Entity_read.field runtime datascript entity "db/ident" in
      Support.Runtime_codec.value_is_keyword runtime ident
      && Rrbvec.mem
           (Support.Runtime_codec.keyword_to_string runtime ident)
           Melange_db.Class_catalog.internal_tags)

let parentsWith runtime datascript database block_id depth =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  let lookup id =
    Support.Runtime_codec.array_to_vector runtime
      [|
        Support.Runtime_codec.keyword_from_string runtime "block/uuid"; id;
      |]
  in
  Domain.parents_with
    ~entity:(fun id ->
      Support.Datascript.entity datascript database (lookup id)
      |> Js.Nullable.toOption)
    ~parent:(fun entity ->
      let value = field entity "block/parent" in
      if Support.Runtime_codec.value_is_nil runtime value then None
      else Some value)
    ~uuid:(fun entity -> field entity "block/uuid")
    ~depth block_id

let pagesRelationWith runtime datascript database with_journal =
  Domain.pages_relation_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form ->
      Support.Datascript.query datascript form database [||])
    ~with_journal

let allTaggedPagesWith runtime datascript database =
  Domain.all_tagged_pages_with
    ~encode_form:(Support.encode_datalog_form runtime) ~query:(fun form ->
      Support.Datascript.query datascript form database [||])
