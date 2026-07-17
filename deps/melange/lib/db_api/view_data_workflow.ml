module Selection = Melange_db.View_entity_selection
module Domain = Melange_db.View_data_workflow

type encoded_sorting = { id : Support.Runtime_codec.value; asc : bool }

type encoded_options = {
  journals : bool;
  viewForId : Support.Runtime_codec.value Js.Nullable.t;
  feature : string Js.Nullable.t;
  groupByPropertyIdent : Support.Runtime_codec.value Js.Nullable.t;
  input : string Js.Nullable.t;
  queryEntityIds : Support.Runtime_codec.value array;
  query : Support.Runtime_codec.value Js.Nullable.t;
  filters : Support.Runtime_codec.value Js.Nullable.t;
  sorting : encoded_sorting array;
}

type encoded_page_count = {
  label : Support.Runtime_codec.value;
  count : int;
}

type encoded_result = {
  count : int;
  data : Support.Runtime_codec.value;
  refPageCounts : encoded_page_count array Js.Nullable.t;
  refMatchedChildrenIds : Support.Runtime_codec.value array Js.Nullable.t;
  properties : Support.Runtime_codec.value array Js.Nullable.t;
}

let ident_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else Support.Runtime_codec.value_to_string runtime value

let optional_field runtime datascript entity name =
  let value = Entity_read.field runtime datascript entity name in
  if Support.Runtime_codec.value_is_nil runtime value then None
  else Some value

let required_entity datascript database id label =
  match
    Support.Datascript.entity datascript database id |> Js.Nullable.toOption
  with
  | Some entity -> entity
  | None -> invalid_arg ("DB view data workflow: missing " ^ label)

let property_rules runtime =
  Melange_db.Rules.extract_query_rules
    (Rrbvec.singleton "has-property-or-object-property")
  |> Rrbvec.to_array |> Melange_db.Datalog_form.vector_form
  |> Support.encode_datalog_form runtime

let selection_capabilities runtime datascript database :
    ( Support.Runtime_codec.value,
      Support.Runtime_codec.value,
      Support.Runtime_codec.value,
      Support.Runtime_codec.value )
    Selection.capabilities =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let field = Entity_read.field runtime datascript in
  let entity id =
    Support.Datascript.entity datascript database id |> Js.Nullable.toOption
  in
  let required_id entity =
    match optional_field runtime datascript entity "db/id" with
    | Some id -> id
    | None -> invalid_arg "DB view entity selection: entity id is missing"
  in
  let datom_ids attribute components =
    Support.Datascript.datoms datascript database (keyword "avet")
      (Array.append [| keyword attribute |] components)
    |> Array.map (Support.Datascript.datom_entity datascript)
    |> Rrbvec.of_array
  in
  let sort_value entity attribute =
    let value = field entity attribute in
    if Support.Runtime_codec.value_is_nil runtime value then
      Melange_db.View_order.Missing
    else if Support.Runtime_codec.value_is_bool runtime value then
      Melange_db.View_order.Bool
        (Support.Runtime_codec.bool_from_value runtime value)
    else if Support.Runtime_codec.value_is_number runtime value then
      Melange_db.View_order.Number
        (Support.Runtime_codec.float_from_value runtime value)
    else if Support.Runtime_codec.value_is_string runtime value then
      Melange_db.View_order.Text
        (Support.Runtime_codec.string_from_value runtime value)
    else invalid_arg "DB view entity selection: unsupported sort value"
  in
  {
    resolve_id =
      (fun ident ->
        Option.bind
          (entity (keyword ident))
          (fun entity -> optional_field runtime datascript entity "db/id"));
    entity;
    entity_id = required_id;
    equal_id = Support.Runtime_codec.value_equals runtime;
    hidden = Entity_read.hiddenWith runtime datascript;
    ids_with_attribute = (fun attribute -> datom_ids attribute [||]);
    ids_with_bool =
      (fun attribute value ->
        datom_ids attribute
          [| Support.Runtime_codec.bool_to_value runtime value |]);
    ids_with_ref = (fun attribute value -> datom_ids attribute [| value |]);
    with_refs_count =
      (fun entity count ->
        Support.Runtime_codec.map_assoc runtime entity
          (keyword "block.temp/refs-count")
          (Support.Runtime_codec.int_to_value runtime count));
    refs_count = Initial_read.blockRefsCountWith runtime datascript database;
    sort_value;
    class_objects =
      (fun id ->
        Class_read.objectsWith runtime datascript database id
        |> Rrbvec.of_array);
    property_object_ids =
      (fun property_ident ->
        Support.Datascript.query datascript
          (Support.encode_datalog_form runtime
             Selection.property_objects_query)
          database
          [| property_rules runtime; keyword property_ident |]
        |> Support.Runtime_codec.collection_to_array runtime
        |> Rrbvec.of_array);
    linked_references =
      (fun id ->
        let result =
          Reference_workflow.linkedWith runtime datascript database id
        in
        ({
           blocks = Rrbvec.of_array result.refBlocks;
           page_counts =
             result.refPageCounts |> Js.Nullable.toOption
             |> Option.map (fun counts ->
                 counts
                 |> Array.map
                      (fun
                        (count : Reference_workflow.encoded_page_count) ->
                        ({ label = count.label; count = count.count }
                          : Support.Runtime_codec.value Selection.page_count))
                 |> Rrbvec.of_array);
           matched_children_ids =
             result.refMatchedChildrenIds |> Js.Nullable.toOption
             |> Option.map Rrbvec.of_array;
         }
          : ( Support.Runtime_codec.value,
              Support.Runtime_codec.value,
              Support.Runtime_codec.value )
            Selection.reference_result));
    unlinked_references =
      (fun id ->
        Reference_filter.unlinkedWith runtime datascript database id
        |> Js.Nullable.toOption |> Option.map Rrbvec.of_array);
  }

let decode_sorting runtime (sorting : encoded_sorting) : Domain.sorting =
  { id = ident_text runtime sorting.id; ascending = sorting.asc }

let decode_sorting_value runtime value =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  if Support.Runtime_codec.value_is_nil runtime value then None
  else if
    Support.Runtime_codec.value_is_keyword runtime value
    && String.equal
         (Support.Runtime_codec.keyword_to_string runtime value)
         "logseq.property/empty-placeholder"
  then None
  else
    let values = Support.Runtime_codec.collection_to_array runtime value in
    if Array.length values = 0 then None
    else
      Some
        (values
        |> Array.map (fun value ->
            ({
               id =
                 Support.Runtime_codec.map_get runtime value (keyword "id")
                 |> ident_text runtime;
               ascending =
                 Support.Runtime_codec.map_get runtime value
                   (keyword "asc?")
                 |> Support.Runtime_codec.value_truthy runtime;
             }
              : Domain.sorting))
        |> Rrbvec.of_array)

let nonempty_map runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then None
  else if
    Support.Runtime_codec.value_is_map runtime value
    && Array.length (Support.Runtime_codec.map_to_entries runtime value) = 0
  then None
  else Some value

let view_config runtime datascript database view_id feature_override journals =
  if journals then
    ({
       feature = Selection.All_pages;
       view_for_id = None;
       property_ident = None;
       group_property = None;
       group_ident = None;
       list_view = false;
       filters = None;
       stored_sorting = None;
       group_sort_ident = "block/journal-day";
       group_descending = false;
     }
      : ( Support.Runtime_codec.value,
          Support.Runtime_codec.value,
          Support.Runtime_codec.value )
        Domain.view)
  else
    let field = Entity_read.field runtime datascript in
    let view = required_entity datascript database view_id "view entity" in
    let stored_feature =
      field view "logseq.property.view/feature-type"
      |> ident_text runtime |> Selection.feature_of_string
    in
    let feature = Option.value feature_override ~default:stored_feature in
    let view_for =
      optional_field runtime datascript view "logseq.property/view-for"
    in
    let view_for_id =
      Option.bind view_for (fun entity ->
          optional_field runtime datascript entity "db/id")
    in
    let property_ident =
      match feature with
      | Selection.All_pages -> Some "block/name"
      | Property_objects ->
          Option.bind view_for (fun entity ->
              optional_field runtime datascript entity "db/ident"
              |> Option.map (ident_text runtime))
      | Class_objects | Linked_references | Unlinked_references | Query_result
        ->
          None
    in
    let group_property =
      optional_field runtime datascript view
        "logseq.property.view/group-by-property"
    in
    let group_ident =
      Option.bind group_property (fun property ->
          optional_field runtime datascript property "db/ident"
          |> Option.map (ident_text runtime))
    in
    let list_view =
      match
        optional_field runtime datascript view "logseq.property.view/type"
      with
      | None -> false
      | Some view_type -> (
          match optional_field runtime datascript view_type "db/ident" with
          | None -> false
          | Some ident ->
              String.equal (ident_text runtime ident)
                "logseq.property.view/type.list")
    in
    let group_sort_ident =
      match
        optional_field runtime datascript view
          "logseq.property.view/sort-groups-by-property"
      with
      | None -> "block/journal-day"
      | Some property -> (
          match optional_field runtime datascript property "db/ident" with
          | None -> "block/journal-day"
          | Some ident -> ident_text runtime ident)
    in
    {
      feature;
      view_for_id;
      property_ident;
      group_property;
      group_ident;
      list_view;
      filters =
        field view "logseq.property.table/filters" |> nonempty_map runtime;
      stored_sorting =
        decode_sorting_value runtime
          (field view "logseq.property.table/sorting");
      group_sort_ident;
      group_descending =
        field view "logseq.property.view/sort-groups-desc?"
        |> Support.Runtime_codec.value_truthy runtime;
    }

let project_group_key runtime datascript value =
  if not (Support.Datascript.entity_is datascript value) then value
  else
    let keyword = Support.Runtime_codec.keyword_from_string runtime in
    Rrbvec.of_array
      [|
        "db/id";
        "db/ident";
        "block/uuid";
        "block/title";
        "block/name";
        "logseq.property/value";
        "logseq.property/icon";
        "block/tags";
      |]
    |> Rrbvec.filter_map (fun name ->
        let value = Entity_read.field runtime datascript value name in
        if Support.Runtime_codec.value_is_nil runtime value then None
        else Some [| keyword name; value |])
    |> Rrbvec.to_array
    |> Support.Runtime_codec.entries_to_map runtime

let sort_by_order runtime datascript entities =
  let field = Entity_read.field runtime datascript in
  let candidates =
    entities
    |> Rrbvec.mapi (fun index entity ->
        let order = field entity "block/order" in
        if Support.Runtime_codec.value_is_nil runtime order then
          invalid_arg "DB view data workflow: block order is missing"
        else
          ({
             Melange_db.Tree_read.id = index;
             order = Support.Runtime_codec.string_from_value runtime order;
             excluded = false;
           }
            : Melange_db.Tree_read.child))
  in
  Melange_db.Tree_read.sort_ids candidates |> Rrbvec.map (Rrbvec.nth entities)

let data_capabilities runtime datascript database selection_capabilities :
    ( Support.Runtime_codec.value,
      Support.Runtime_codec.value,
      Support.Runtime_codec.value,
      Support.Runtime_codec.value,
      Support.Runtime_codec.value )
    Domain.capabilities =
  let optional entity name = optional_field runtime datascript entity name in
  let sort_entities ~sorting entities =
    let sorting =
      sorting
      |> Rrbvec.map (fun (sorting : Domain.sorting) ->
          ({
             View_workflow.id =
               Support.Runtime_codec.keyword_from_string runtime sorting.id;
             asc = sorting.ascending;
           }
            : View_workflow.encoded_sorting))
      |> Rrbvec.to_array
    in
    View_workflow.sortEntitiesWith runtime datascript database sorting
      (Rrbvec.to_array entities)
    |> Rrbvec.of_array
  in
  {
    entity =
      (fun id ->
        Support.Datascript.entity datascript database id
        |> Js.Nullable.toOption);
    entity_id =
      (fun entity ->
        match optional entity "db/id" with
        | Some id -> id
        | None -> invalid_arg "DB view data workflow: entity id is missing");
    entity_uuid =
      (fun entity ->
        match optional entity "block/uuid" with
        | Some uuid -> uuid
        | None -> invalid_arg "DB view data workflow: entity uuid is missing");
    equal_id = Support.Runtime_codec.value_equals runtime;
    page = (fun entity -> optional entity "block/page");
    parent = (fun entity -> optional entity "block/parent");
    created_from_query =
      (fun entity ->
        match optional entity "logseq.property/created-from-property" with
        | None -> false
        | Some property -> (
            match optional property "db/ident" with
            | None -> false
            | Some ident ->
                String.equal (ident_text runtime ident) "logseq.property/query"));
    latest_journals =
      (fun () ->
        Initial_read.latestJournalsWith runtime datascript database
          (Melange_common.Date_time.now_ms ()
          |> Melange_common.Date_time.journal_day_of_ms)
        |> Rrbvec.of_array);
    fast_all_page_ids =
      (fun sorting ->
        Selection.fast_all_page_ids_with selection_capabilities ~sorting);
    select =
      (fun ~feature ~view_for_id ~property_ident ~sorting ->
        Selection.select_with selection_capabilities ~feature ~view_for_id
          ~property_ident ~sorting);
    filter_entities =
      (fun ~filters ~input entities ->
        let filters =
          Option.value filters
            ~default:(Support.Runtime_codec.nil_value runtime)
        in
        View_query_workflow.filterEntitiesWith runtime datascript database
          filters
          (Support.Runtime_codec.string_to_value runtime input)
          (Rrbvec.to_array entities)
        |> Rrbvec.of_array);
    sort_entities;
    group_entities =
      (fun ~property ~group_ident ~sort_ident ~descending entities ->
        View_grouping.groupEntitiesWith runtime datascript property
          (Support.Runtime_codec.keyword_from_string runtime group_ident)
          (Support.Runtime_codec.keyword_from_string runtime sort_ident)
          descending (Rrbvec.to_array entities)
        |> Array.map (fun (group : View_grouping.encoded_group) ->
            (group.key, Rrbvec.of_array group.rows))
        |> Rrbvec.of_array);
    project_group_key = project_group_key runtime datascript;
    sort_by_order = sort_by_order runtime datascript;
    query_properties =
      (fun ~query ~entities ->
        View_query_workflow.queryPropertiesWith runtime query
          (Rrbvec.to_array entities)
        |> Rrbvec.of_array);
  }

let encode_data runtime = function
  | Domain.Ids ids ->
      ids |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime
  | Grouped groups ->
      let keyword = Support.Runtime_codec.keyword_from_string runtime in
      let vector = Support.Runtime_codec.array_to_vector runtime in
      groups
      |> Rrbvec.map (fun (group : (_, _, _) Domain.group) ->
          let rows =
            match group.rows with
            | Domain.Group_ids ids -> ids |> Rrbvec.to_array |> vector
            | Parent_groups parents ->
                parents
                |> Rrbvec.map (fun (parent : (_, _) Domain.parent_group) ->
                    let blocks =
                      parent.blocks
                      |> Rrbvec.map (fun (block : (_, _) Domain.parent_block) ->
                          Support.Runtime_codec.entries_to_map runtime
                            [|
                              [| keyword "db/id"; block.id |];
                              [|
                                keyword "block/parent";
                                Option.value block.parent_uuid
                                  ~default:
                                    (Support.Runtime_codec.nil_value runtime);
                              |];
                            |])
                      |> Rrbvec.to_array |> vector
                    in
                    vector [| parent.uuid; blocks |])
                |> Rrbvec.to_array |> vector
          in
          vector [| group.key; rows |])
      |> Rrbvec.to_array |> vector

let propertyValuesWith runtime datascript database property_ident empty_id
    view_id query_entity_ids =
  let view = view_config runtime datascript database view_id None false in
  let selection_capabilities =
    selection_capabilities runtime datascript database
  in
  let sorting =
    Option.value view.stored_sorting
      ~default:
        (Rrbvec.singleton
           ({ id = "block/updated-at"; ascending = false } : Domain.sorting))
  in
  let selection =
    Selection.select_with selection_capabilities ~feature:view.feature
      ~view_for_id:view.view_for_id ~property_ident:view.property_ident ~sorting
  in
  let entities =
    match selection with
    | Selection.Entities entities -> entities
    | References result -> result.blocks
    | Empty -> Rrbvec.empty
  in
  let entities =
    if Array.length query_entity_ids = 0 then entities
    else
      query_entity_ids
      |> Array.fold_left
           (fun result id ->
             match
               Support.Datascript.entity datascript database id
               |> Js.Nullable.toOption
             with
             | None -> result
             | Some entity -> Rrbvec.push_back result entity)
           Rrbvec.empty
  in
  Melange_db.View_property_values.from_entities
    (View_property_values.capabilities runtime datascript database)
    ~property_ident:(ident_text runtime property_ident)
    ~empty_id entities
  |> View_property_values.encode_entries

let getPropertyValuesWith runtime datascript database property_ident
    (view_id : Support.Runtime_codec.value Js.Nullable.t) query_entity_ids =
  match Js.Nullable.toOption view_id with
  | Some view_id ->
      let empty_id =
        match
          Support.Datascript.entity datascript database
            (Support.Runtime_codec.keyword_from_string runtime
               "logseq.property/empty-placeholder")
          |> Js.Nullable.toOption
        with
        | None -> Support.Runtime_codec.nil_value runtime
        | Some entity -> Entity_read.field runtime datascript entity "db/id"
      in
      propertyValuesWith runtime datascript database property_ident empty_id
        view_id query_entity_ids
  | None ->
      let property =
        Support.Datascript.entity datascript database property_ident
        |> Js.Nullable.toOption
        |> Option.value ~default:(Support.Runtime_codec.nil_value runtime)
      in
      let field name = Entity_read.field runtime datascript property name in
      let reference_type =
        Support.Runtime_codec.value_equals runtime (field "db/valueType")
          (Support.Runtime_codec.keyword_from_string runtime "db.type/ref")
      in
      let values =
        Support.Datascript.datoms datascript database
          (Support.Runtime_codec.keyword_from_string runtime "avet")
          [| property_ident |]
        |> Array.map (Support.Datascript.datom_value datascript)
      in
      View_property_values.fromDatomsWith runtime datascript database
        reference_type
        (field "logseq.property/default-value")
        values

let getWith runtime datascript database view_id (options : encoded_options) =
  let feature_override =
    options.feature |> Js.Nullable.toOption
    |> Option.map Selection.feature_of_string
  in
  let view =
    view_config runtime datascript database view_id feature_override
      options.journals
  in
  let selection_capabilities =
    selection_capabilities runtime datascript database
  in
  let capabilities =
    data_capabilities runtime datascript database selection_capabilities
  in
  let options :
      ( Support.Runtime_codec.value,
        Support.Runtime_codec.value )
      Domain.options =
    {
      journals = options.journals;
      view_for_id = Js.Nullable.toOption options.viewForId;
      feature = feature_override;
      group_ident =
        options.groupByPropertyIdent |> Js.Nullable.toOption
        |> Option.map (ident_text runtime);
      input = Option.value (Js.Nullable.toOption options.input) ~default:"";
      query_entity_ids = Rrbvec.of_array options.queryEntityIds;
      query = Js.Nullable.toOption options.query;
      filters =
        Option.bind
          (options.filters |> Js.Nullable.toOption)
          (nonempty_map runtime);
      sorting =
        (if Array.length options.sorting = 0 then None
         else
           Some
             (options.sorting
             |> Array.map (decode_sorting runtime)
             |> Rrbvec.of_array));
    }
  in
  let result = Domain.get_with capabilities ~view ~options in
  {
    count = result.count;
    data = encode_data runtime result.data;
    refPageCounts =
      result.ref_page_counts
      |> Option.map (fun counts ->
          counts
          |> Rrbvec.map
               (fun
                 (count : Support.Runtime_codec.value Selection.page_count)
               ->
                 ({ label = count.label; count = count.count }
                   : encoded_page_count))
          |> Rrbvec.to_array)
      |> Js.Nullable.fromOption;
    refMatchedChildrenIds =
      result.ref_matched_children_ids |> Option.map Rrbvec.to_array
      |> Js.Nullable.fromOption;
    properties =
      result.properties |> Option.map Rrbvec.to_array |> Js.Nullable.fromOption;
  }
