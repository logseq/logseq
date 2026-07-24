module Domain = Melange_db.Initial_read

type encoded_hidden_ref = {
  self : bool;
  pageSelf : bool;
  viewSelf : bool;
  hiddenPage : bool;
  hiddenBlock : bool;
  classMatch : bool;
  identProperty : bool;
}

let status = function
  | Domain.Full -> "full"
  | Children -> "children"
  | Self -> "self"

let oldestId ids =
  Domain.oldest_id (Rrbvec.of_array ids) |> Js.Nullable.fromOption

let oldestPageByName runtime datascript database page_name =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  Domain.oldest_matching_id_with
    ~datoms:(fun () ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
        [|
          keyword "block/name";
          Melange_cljs_runtime_spec.Value_codec.string_to_value runtime
            (Melange_common.String_util.page_name_sanity_lower page_name);
        |])
    ~datom_id:(fun datom ->
      Melange_datascript_spec.Api.datom_entity datascript datom
      |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime)
    ~eligible:(fun _ -> true)
  |> Js.Nullable.fromOption

let oldestPageByNameInputWith runtime datascript database page_name =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database ->
      if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime page_name
      then
        oldestPageByName runtime datascript database
          (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
             page_name)
      else Js.Nullable.undefined

let oldestPageByTitle runtime datascript database page_title =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  Domain.oldest_matching_id_with
    ~datoms:(fun () ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
        [|
          keyword "block/title";
          Melange_cljs_runtime_spec.Value_codec.string_to_value runtime
            page_title;
        |])
    ~datom_id:(fun datom ->
      Melange_datascript_spec.Api.datom_entity datascript datom
      |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime)
    ~eligible:(fun id ->
      let id = Melange_cljs_runtime_spec.Value_codec.int_to_value runtime id in
      match
        Melange_datascript_spec.Api.entity datascript database id
        |> Js.Nullable.toOption
      with
      | None -> invalid_arg "DB oldest page: entity is missing"
      | Some entity -> (
          match
            Entity_read.pageWith runtime datascript entity
            |> Js.Nullable.toOption
          with
          | Some value -> value
          | None -> invalid_arg "DB oldest page: value is not an entity"))
  |> Js.Nullable.fromOption

let expandChildren include_collapsed collapsed page =
  Domain.expand_children ~include_collapsed ~collapsed ~page

let hiddenRef (input : encoded_hidden_ref) =
  Domain.hidden_ref
    {
      self = input.self;
      page_self = input.pageSelf;
      view_self = input.viewSelf;
      hidden_page = input.hiddenPage;
      hidden_block = input.hiddenBlock;
      class_match = input.classMatch;
      ident_property = input.identProperty;
    }

let childLoadStatus collapsed large_page all_children_loaded =
  Domain.child_load_status ~collapsed ~large_page ~all_children_loaded |> status

let blockLoadStatus children include_collapsed properties_empty =
  Domain.block_load_status ~children ~include_collapsed ~properties_empty
  |> status

let journal day today journal id_present recycled =
  Domain.journal ~day ~today ~journal ~id_present ~recycled

let recentPage has_page_datom blank_title page hidden =
  Domain.recent_page ~has_page_datom ~blank_title ~page ~hidden

let recentPagesWith runtime datascript database =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  let required_entity id =
    match
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption
    with
    | Some entity -> entity
    | None -> invalid_arg "DB recent pages: entity is missing"
  in
  Domain.recent_pages_with
    ~updated_datoms:(fun () ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
        [| keyword "block/updated-at" |])
    ~datom_entity:(Melange_datascript_spec.Api.datom_entity datascript)
    ~has_page_datom:(fun id ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "eavt")
        [| id; keyword "block/page" |]
      |> Array.length |> ( < ) 0)
    ~title:(fun id ->
      match
        Melange_datascript_spec.Api.datoms datascript database (keyword "eavt")
          [| id; keyword "block/title" |]
        |> Array.to_list
      with
      | [] -> None
      | datom :: _ ->
          Some
            (Melange_datascript_spec.Api.datom_value datascript datom
            |> Melange_cljs_runtime_spec.Value_codec.string_from_value runtime))
    ~entity:required_entity
    ~page:(fun entity ->
      match
        Entity_read.pageWith runtime datascript entity |> Js.Nullable.toOption
      with
      | Some value -> value
      | None -> invalid_arg "DB recent pages: value is not an entity")
    ~hidden:(Entity_read.hiddenWith runtime datascript)

let recentPagesNullableWith runtime datascript database =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database ->
      recentPagesWith runtime datascript database |> Js.Nullable.return

let latestJournalsWith runtime datascript database today =
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  let field entity name = Entity_read.field runtime datascript entity name in
  Domain.latest_journals_with
    ~datoms:(fun () ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
        [| keyword "block/journal-day" |])
    ~datom_entity:(Melange_datascript_spec.Api.datom_entity datascript)
    ~datom_day:(fun datom ->
      Melange_datascript_spec.Api.datom_value datascript datom
      |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime)
    ~entity:(fun id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~entity_id:(fun entity ->
      let id = field entity "db/id" in
      if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime id then None
      else Some id)
    ~journal_entity:(Entity_read.journalWith runtime datascript)
    ~recycled:(Entity_read.recycledWith runtime datascript)
    ~id_equal:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    ~today

let relatedIdsWith runtime datascript database relation root =
  let rule =
    Melange_db.Rules.find_body relation |> Datalog_runtime.encode runtime
  in
  Domain.related_ids_with
    ~encode_form:(Datalog_runtime.encode runtime)
    ~query:(fun form inputs ->
      Melange_datascript_spec.Api.query datascript form database inputs)
    ~collection_to_array:
      (Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime)
    ~value_equals:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    ~relation ~root ~rule

let blockAliasesWith runtime datascript database root =
  relatedIdsWith runtime datascript database "alias" root

let fullChildrenWith runtime datascript database root =
  relatedIdsWith runtime datascript database "parent" root

let childrenIdsWith runtime datascript database root include_collapsed =
  let field entity name = Entity_read.field runtime datascript entity name in
  let entity_by_id id =
    let lookup =
      Melange_cljs_runtime_spec.Value_codec.int_to_value runtime id
    in
    match
      Melange_datascript_spec.Api.entity datascript database lookup
      |> Js.Nullable.toOption
    with
    | Some entity -> entity
    | None -> invalid_arg "DB child traversal: entity is missing"
  in
  Domain.children_ids_with
    ~root:(fun () ->
      Melange_datascript_spec.Api.entity datascript database root
      |> Js.Nullable.toOption)
    ~entity:entity_by_id
    ~entity_id:(fun entity ->
      field entity "db/id"
      |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime)
    ~collapsed:(fun entity ->
      field entity "block/collapsed?"
      |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime)
    ~page:(fun entity ->
      match
        Entity_read.pageWith runtime datascript entity |> Js.Nullable.toOption
      with
      | Some value -> value
      | None -> invalid_arg "DB child traversal: value is not an entity")
    ~children:(fun entity ->
      field entity "block/_parent"
      |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
      |> Array.map (fun child ->
          field child "db/id"
          |> Melange_cljs_runtime_spec.Value_codec.int_from_value runtime))
    ~include_collapsed
  |> Js.Nullable.fromOption

let childrenEntitiesWith runtime datascript database root include_collapsed =
  childrenIdsWith runtime datascript database root include_collapsed
  |> Js.Nullable.toOption
  |> Option.map (fun ids ->
      ids
      |> Array.map (fun id ->
          match
            Melange_cljs_runtime_spec.Value_codec.int_to_value runtime id
            |> Melange_datascript_spec.Api.entity datascript database
            |> Js.Nullable.toOption
          with
          | Some entity -> entity
          | None -> invalid_arg "DB child traversal: entity is missing"))
  |> Js.Nullable.fromOption

let latestJournalsNowWith runtime datascript database
    (now_ms : (unit -> float[@u])) =
  (now_ms () [@u]) |> Melange_common.Date_time.journal_day_of_ms
  |> latestJournalsWith runtime datascript database

let blockRefsWith runtime datascript database root =
  let field entity name = Entity_read.field runtime datascript entity name in
  let collection entity name =
    field entity name
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  in
  let optional_field entity name =
    let value = field entity name in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else Some value
  in
  Domain.block_refs_with
    ~aliases:(blockAliasesWith runtime datascript database)
    ~entity:(fun id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~entity_id:(fun entity -> optional_field entity "db/id")
    ~ident:(fun entity -> optional_field entity "db/ident")
    ~class_entity:(Entity_read.classWith runtime datascript)
    ~structured_children:
      (Class_read.structuredChildren runtime datascript database)
    ~references:(fun entity -> collection entity "block/_refs")
    ~page:(fun entity -> optional_field entity "block/page")
    ~view_for:(fun entity -> optional_field entity "logseq.property/view-for")
    ~hidden:(Entity_read.hiddenWith runtime datascript)
    ~tags:(fun entity -> collection entity "block/tags")
    ~has_ident:(fun entity ident ->
      Melange_datascript_spec.Api.entity_get datascript entity ident
      |> Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
      |> not)
    ~id_equal:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    root

let blockRefsCountWith runtime datascript database root =
  let field entity name = Entity_read.field runtime datascript entity name in
  let collection entity name =
    field entity name
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  in
  let optional_field entity name =
    let value = field entity name in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else Some value
  in
  let keyword name =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name
  in
  Domain.block_refs_count_with
    ~aliases:(blockAliasesWith runtime datascript database)
    ~entity:(fun id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~entity_id:(fun entity -> optional_field entity "db/id")
    ~ident:(fun entity -> optional_field entity "db/ident")
    ~class_entity:(Entity_read.classWith runtime datascript)
    ~structured_children:
      (Class_read.structuredChildren runtime datascript database)
    ~ref_datoms:(fun id ->
      Melange_datascript_spec.Api.datoms datascript database (keyword "avet")
        [| keyword "block/refs"; id |])
    ~datom_entity:(Melange_datascript_spec.Api.datom_entity datascript)
    ~page:(fun entity -> optional_field entity "block/page")
    ~view_for:(fun entity -> optional_field entity "logseq.property/view-for")
    ~hidden:(Entity_read.hiddenWith runtime datascript)
    ~tags:(fun entity -> collection entity "block/tags")
    ~has_ident:(fun entity ident ->
      Melange_datascript_spec.Api.entity_get datascript entity ident
      |> Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
      |> not)
    ~id_equal:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    root

let includeInitialAttribute = Domain.include_initial_attribute
let largePage = Domain.large_page
