module Domain = Melange_db.Frontend_read

type encoded_extend = { title : string Js.Nullable.t; builtIn : bool }

let builtInClassProperty class_built_in class_value property_built_in
    property_ident schema_properties =
  Domain.built_in_class_property ~class_built_in ~class_value ~property_built_in
    ~property_ident
    ~schema_properties:(Rrbvec.of_array schema_properties)

let privateBuiltInPage property public_property class_value internal_page =
  Domain.private_built_in_page ~property ~public_property ~class_value
    ~internal_page

let pageTitle parent_titles title =
  Domain.page_title (Rrbvec.of_array parent_titles) title

let classTitleWithExtends title extends =
  extends
  |> Array.map (fun (value : encoded_extend) ->
      ({ title = Js.Nullable.toOption value.title; built_in = value.builtIn }
        : Domain.extend))
  |> Rrbvec.of_array
  |> Domain.class_title_with_extends ~title:(Js.Nullable.toOption title)
  |> Js.Nullable.fromOption

let classInstance class_id tag_ids parent_ids =
  Domain.class_instance ~class_id ~tag_ids:(Rrbvec.of_array tag_ids)
    ~parent_ids:(Rrbvec.of_array parent_ids)

let inlineTag title uuid = Domain.inline_tag title uuid
let nodeDisplayTypeClasses = Rrbvec.to_array Domain.node_display_type_classes

let classIdentByDisplayType display_type =
  Domain.class_ident_by_display_type display_type |> Js.Nullable.fromOption

let displayTypeByClassIdent class_ident =
  Domain.display_type_by_class_ident class_ident |> Js.Nullable.fromOption

let library built_in title library_title =
  Domain.library ~built_in ~title ~library_title

let field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity
    (Support.Runtime_codec.keyword_from_string runtime name)

let collection runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    Support.Runtime_codec.collection_to_array runtime value
    |> Rrbvec.of_array

let add_distinct runtime values value =
  if Rrbvec.exists (Support.Runtime_codec.value_equals runtime value) values
  then values
  else Rrbvec.push_back values value

let allPropertiesWith runtime datascript database =
  Support.Datascript.datoms datascript database
    (Support.Runtime_codec.keyword_from_string runtime "avet")
    [|
      Support.Runtime_codec.keyword_from_string runtime "block/tags";
      Support.Runtime_codec.keyword_from_string runtime
        "logseq.class/Property";
    |]
  |> Array.fold_left
       (fun result datom ->
         match
           Support.Datascript.datom_entity datascript datom
           |> Support.Datascript.entity datascript database
           |> Js.Nullable.toOption
         with
         | None -> result
         | Some entity -> add_distinct runtime result entity)
       Rrbvec.empty
  |> Rrbvec.to_array

let page_parents runtime datascript entity =
  let rec loop current result =
    if Support.Runtime_codec.value_is_nil runtime current then
      Rrbvec.rev result
    else if
      Rrbvec.exists
        (Support.Runtime_codec.value_equals runtime current)
        result
    then Rrbvec.rev result
    else
      loop
        (field runtime datascript current "block/parent")
        (Rrbvec.push_back result current)
  in
  loop (field runtime datascript entity "block/parent") Rrbvec.empty

let pageParentsWith runtime datascript entity =
  let parents = page_parents runtime datascript entity in
  if Rrbvec.is_empty parents then Js.Nullable.null
  else parents |> Rrbvec.to_array |> Js.Nullable.return

let class_parents runtime datascript tags =
  let class_extends class_entity =
    let rec loop frontier result =
      if Rrbvec.is_empty frontier then Rrbvec.rev result
      else
        let next =
          frontier
          |> Rrbvec.fold_left
               (fun next parent ->
                 field runtime datascript parent "logseq.property.class/extends"
                 |> collection runtime |> Rrbvec.append next)
               Rrbvec.empty
        in
        loop next (Rrbvec.append result frontier)
    in
    field runtime datascript class_entity "logseq.property.class/extends"
    |> collection runtime
    |> fun extends -> loop extends Rrbvec.empty
  in
  tags |> collection runtime
  |> Rrbvec.filter (Entity_read.classWith runtime datascript)
  |> Rrbvec.fold_left
       (fun result class_entity ->
         class_extends class_entity
         |> Rrbvec.fold_left (add_distinct runtime) result)
       Rrbvec.empty

let classesParentsWith runtime datascript tags =
  class_parents runtime datascript tags |> Rrbvec.to_array

let titleWithParentsWith runtime datascript entity library_title =
  let title = field runtime datascript entity "block/title" in
  if Entity_read.classWith runtime datascript entity then
    let extends =
      field runtime datascript entity "logseq.property.class/extends"
      |> collection runtime
      |> Rrbvec.map (fun parent ->
          ({
             title =
               (let value = field runtime datascript parent "block/title" in
                if Support.Runtime_codec.value_is_nil runtime value then
                  None
                else
                  Some
                    (Support.Runtime_codec.string_from_value runtime value));
             built_in =
               field runtime datascript parent "logseq.property/built-in?"
               |> Support.Runtime_codec.value_truthy runtime;
           }
            : Domain.extend))
    in
    Domain.class_title_with_extends
      ~title:
        (if Support.Runtime_codec.value_is_nil runtime title then None
         else Some (Support.Runtime_codec.string_from_value runtime title))
      extends
    |> Option.map (Support.Runtime_codec.string_to_value runtime)
    |> Option.value ~default:(Support.Runtime_codec.nil_value runtime)
  else
    match
      Entity_read.pageWith runtime datascript entity |> Js.Nullable.toOption
    with
    | Some true ->
        let parent_titles =
          page_parents runtime datascript entity
          |> Rrbvec.filter_map (fun parent ->
              let built_in =
                field runtime datascript parent "logseq.property/built-in?"
                |> Support.Runtime_codec.value_truthy runtime
              in
              let parent_title =
                field runtime datascript parent "block/title"
              in
              if
                built_in
                && (not
                      (Support.Runtime_codec.value_is_nil runtime
                         parent_title))
                && String.equal
                     (Support.Runtime_codec.string_from_value runtime
                        parent_title)
                     library_title
              then None
              else if
                Support.Runtime_codec.value_is_nil runtime parent_title
              then None
              else
                Some
                  (Support.Runtime_codec.string_from_value runtime
                     parent_title))
        in
        Domain.page_title parent_titles
          (Support.Runtime_codec.string_from_value runtime title)
        |> Support.Runtime_codec.string_to_value runtime
    | Some false | None -> title

let classInstanceWith runtime datascript class_entity object_entity =
  let id entity =
    field runtime datascript entity "db/id"
    |> Support.Runtime_codec.value_to_string runtime
  in
  let tags = field runtime datascript object_entity "block/tags" in
  Domain.class_instance ~class_id:(id class_entity)
    ~tag_ids:(tags |> collection runtime |> Rrbvec.map id)
    ~parent_ids:(class_parents runtime datascript tags |> Rrbvec.map id)

let builtInPageWith runtime datascript database title =
  let uuid =
    Melange_common.Uuid.builtin_block title
    |> Support.Runtime_codec.uuid_from_string runtime
  in
  let lookup =
    Support.Runtime_codec.array_to_vector runtime
      [|
        Support.Runtime_codec.keyword_from_string runtime "block/uuid"; uuid;
      |]
  in
  Support.Datascript.entity datascript database lookup

let builtInPageNullableWith runtime datascript database title =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database -> builtInPageWith runtime datascript database title
