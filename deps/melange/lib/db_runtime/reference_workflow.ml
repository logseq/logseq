module Domain = Melange_db.Reference_workflow

type encoded_page_count = {
  label : Melange_cljs_runtime_spec.Value_codec.cljs_value;
  count : int;
}

type encoded_filters = {
  included : Melange_cljs_runtime_spec.Value_codec.cljs_value array;
  excluded : Melange_cljs_runtime_spec.Value_codec.cljs_value array;
}

type encoded_result = {
  refBlocks : Melange_cljs_runtime_spec.Value_codec.cljs_value array;
  refPageCounts : encoded_page_count array Js.Nullable.t;
  refMatchedChildrenIds :
    Melange_cljs_runtime_spec.Value_codec.cljs_value array Js.Nullable.t;
}

let filtersWith runtime datascript value =
  let collection name =
    Entity_read.field runtime datascript value name
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  Domain.filters
    ~included:(collection "logseq.property.linked-references/includes")
    ~excluded:(collection "logseq.property.linked-references/excludes")
  |> Option.map
       (fun
         (filters :
           Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.filters)
       ->
         ({
            included = Rrbvec.to_array filters.included;
            excluded = Rrbvec.to_array filters.excluded;
          }
           : encoded_filters))
  |> Js.Nullable.fromOption

let capabilities runtime datascript database :
    ( Melange_cljs_runtime_spec.Value_codec.cljs_value,
      Melange_cljs_runtime_spec.Value_codec.cljs_value,
      Melange_cljs_runtime_spec.Value_codec.cljs_value )
    Domain.capabilities =
  let field entity name = Entity_read.field runtime datascript entity name in
  let optional_field entity name =
    let value = field entity name in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else Some value
  in
  let collection entity name =
    field entity name
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  let required_id entity =
    let id = field entity "db/id" in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime id then
      invalid_arg "DB linked references: entity id is missing"
    else id
  in
  let entity id =
    Melange_datascript_spec.Api.entity datascript database id
    |> Js.Nullable.toOption
  in
  let entity_predicate predicate value =
    match predicate runtime datascript value |> Js.Nullable.toOption with
    | Some result -> result
    | None -> invalid_arg "DB linked references: value is not an entity"
  in
  {
    entity;
    entity_id = required_id;
    equal_id = Melange_cljs_runtime_spec.Value_codec.value_equals runtime;
    id_text = Melange_cljs_runtime_spec.Value_codec.value_to_string runtime;
    aliases =
      (fun id ->
        Initial_read.blockAliasesWith runtime datascript database id
        |> Rrbvec.of_array);
    structured_children =
      (fun id ->
        Class_read.structuredChildren runtime datascript database id
        |> Rrbvec.of_array);
    children_ids =
      (fun value ->
        Initial_read.childrenIdsWith runtime datascript database
          (required_id value) true
        |> Js.Nullable.toOption
        |> Option.fold ~none:Rrbvec.empty ~some:(fun ids ->
            ids
            |> Array.map
                 (Melange_cljs_runtime_spec.Value_codec.int_to_value runtime)
            |> Rrbvec.of_array));
    direct_children = (fun value -> collection value "block/_parent");
    parents =
      (fun value ->
        match optional_field value "block/uuid" with
        | None -> Rrbvec.empty
        | Some uuid ->
            Core_read.parentsWith runtime datascript database uuid 100
            |> Rrbvec.of_array);
    parent = (fun value -> optional_field value "block/parent");
    page = (fun value -> optional_field value "block/page");
    view_for = (fun value -> optional_field value "logseq.property/view-for");
    references = (fun value -> collection value "block/refs");
    references_to = (fun value -> collection value "block/_refs");
    tags = (fun value -> collection value "block/tags");
    filter_includes =
      (fun value ->
        collection value "logseq.property.linked-references/includes");
    filter_excludes =
      (fun value ->
        collection value "logseq.property.linked-references/excludes");
    ident =
      (fun value ->
        optional_field value "db/ident"
        |> Option.map (fun ident ->
            if
              Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime
                ident
            then
              Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime
                ident
            else
              Melange_cljs_runtime_spec.Value_codec.value_to_string runtime
                ident));
    has_ident_field =
      (fun value ident ->
        field value ident
        |> Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
        |> not);
    hidden = Entity_read.hiddenWith runtime datascript;
    class_entity = Entity_read.classWith runtime datascript;
    page_entity = entity_predicate Entity_read.pageWith;
    title = (fun value -> field value "block/title");
  }

let linkedWith runtime datascript database target_id =
  let result =
    Domain.linked_with (capabilities runtime datascript database) target_id
  in
  {
    refBlocks = Rrbvec.to_array result.ref_blocks;
    refPageCounts =
      result.ref_pages_count
      |> Option.map (fun values ->
          values
          |> Rrbvec.map
               (fun
                 (entry :
                   Melange_cljs_runtime_spec.Value_codec.cljs_value
                   Domain.page_count)
               ->
                 ({ label = entry.label; count = entry.count }
                   : encoded_page_count))
          |> Rrbvec.to_array)
      |> Js.Nullable.fromOption;
    refMatchedChildrenIds =
      result.ref_matched_children_ids |> Option.map Rrbvec.to_array
      |> Js.Nullable.fromOption;
  }
