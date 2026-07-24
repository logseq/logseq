module Domain = Melange_db.Content

let keyword runtime name =
  Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name

let field runtime datascript value name =
  Melange_datascript_spec.Api.entity_get datascript value (keyword runtime name)

let optional_field runtime datascript value name =
  let result = field runtime datascript value name in
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime result then None
  else Some result

let values runtime value =
  Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
  |> Rrbvec.of_array

let field_values runtime datascript value name =
  field runtime datascript value name |> values runtime

let required_string runtime label value =
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value)
  then invalid_arg ("DB content: " ^ label ^ " must be a string");
  Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value

let required_field runtime datascript label value name =
  match optional_field runtime datascript value name with
  | Some result -> result
  | None -> invalid_arg ("DB content: " ^ label ^ " is missing")

let value_string runtime value =
  Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value

let page_ref_entity runtime datascript reference =
  let page_idents =
    [|
      "logseq.class/Page";
      "logseq.class/Journal";
      "logseq.class/Tag";
      "logseq.class/Property";
    |]
    |> Array.map (keyword runtime)
    |> Rrbvec.of_array
  in
  Domain.page_ref_entity_with
    ~tags:(fun value -> field_values runtime datascript value "block/tags")
    ~tag_ident:(fun tag ->
      match optional_field runtime datascript tag "db/ident" with
      | Some ident -> ident
      | None -> tag)
    ~is_page_ident:(fun ident ->
      Rrbvec.exists
        (Melange_cljs_runtime_spec.Value_codec.value_equals runtime ident)
        page_idents)
    reference

let tag_entries runtime datascript tags =
  tags |> values runtime
  |> Rrbvec.map (fun tag ->
      let title =
        required_field runtime datascript "tag title" tag "block/title"
        |> required_string runtime "tag title"
      in
      let id =
        required_field runtime datascript "tag UUID" tag "block/uuid"
        |> value_string runtime
      in
      ({ title; id } : Domain.tag_entry))

let title_ref_entries runtime datascript refs =
  refs |> values runtime
  |> Rrbvec.filter_map (fun reference ->
      if Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime reference
      then
        match
          Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime
            reference
        with
        | [| marker; id |]
          when Melange_cljs_runtime_spec.Value_codec.value_equals runtime marker
                 (keyword runtime "block/uuid") ->
            Some
              ({
                 title = value_string runtime marker;
                 id = value_string runtime id;
                 original_title = None;
               }
                : Domain.title_ref_entry)
        | _ -> None
      else if
        Melange_cljs_runtime_spec.Value_codec.value_is_map runtime reference
      then
        match
          ( optional_field runtime datascript reference "block/title",
            optional_field runtime datascript reference "block/uuid" )
        with
        | Some title, Some id ->
            let original_title =
              optional_field runtime datascript reference
                "block.temp/original-page-name"
              |> Option.map (required_string runtime "original page name")
            in
            Some
              ({
                 title = required_string runtime "reference title" title;
                 id = value_string runtime id;
                 original_title;
               }
                : Domain.title_ref_entry)
        | Some _, None | None, _ -> None
      else None)

let containsUuidRefWith runtime content =
  Melange_cljs_runtime_spec.Value_codec.value_is_string runtime content
  && content
     |> Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
     |> Domain.contains_uuid_ref

let matchedIdsWith runtime content =
  content |> Domain.matched_ids
  |> Rrbvec.map (Melange_cljs_runtime_spec.Value_codec.uuid_from_string runtime)
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.array_to_list runtime

let contentIdRefToPageWith runtime datascript content refs =
  refs |> values runtime
  |> Rrbvec.filter_map (fun reference ->
      match optional_field runtime datascript reference "block/title" with
      | None -> None
      | Some title ->
          let id =
            required_field runtime datascript "reference UUID" reference
              "block/uuid"
            |> value_string runtime
          in
          Some
            ({
               target = Domain.page_ref id;
               title = required_string runtime "reference title" title;
             }
              : Domain.ref_entry))
  |> Domain.replace_id_refs content

let replaceTagsWithIdRefsWith runtime datascript content tags =
  tag_entries runtime datascript tags
  |> Domain.replace_tags_with_id_refs content

let replaceTagRefsWithPageRefsWith runtime datascript content tags =
  tag_entries runtime datascript tags
  |> Domain.replace_tag_refs_with_page_refs content

let replaceTitleRefsWith runtime datascript title refs replace_tags =
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime title)
  then invalid_arg "DB content: title must be a string";
  title_ref_entries runtime datascript refs
  |> Domain.replace_title_refs
       (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime title)
       ~replace_tags

let replaceUuidInBlockTitleWith runtime datascript entity max_depth
    replace_block_refs =
  let title = field runtime datascript entity "block/title" in
  if
    (not (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime title))
    || not
         (title
         |> Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
         |> Domain.contains_uuid_ref)
  then title
  else
    let entries =
      Domain.uuid_title_entries_with
        ~refs:(fun value -> field_values runtime datascript value "block/refs")
        ~uuid:(fun value ->
          optional_field runtime datascript value "block/uuid")
        ~title:(fun value ->
          optional_field runtime datascript value "block/title"
          |> Option.map (required_string runtime "reference title"))
        ~page_ref:(page_ref_entity runtime datascript)
        ~is_ref:(fun value ->
          Melange_cljs_runtime_spec.Value_codec.value_is_map runtime value
          || Melange_datascript_spec.Api.entity_is datascript value)
        ~equal:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
        ~stringify:(value_string runtime) ~max_depth ~replace_block_refs entity
    in
    Domain.replace_uuid_refs
      (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime title)
      entries ~max_depth
    |> Melange_cljs_runtime_spec.Value_codec.string_to_value runtime

let raw_title runtime datascript reference =
  match optional_field runtime datascript reference "block/raw-title" with
  | Some title -> Some (required_string runtime "reference raw title" title)
  | None ->
      optional_field runtime datascript reference "block/title"
      |> Option.map (required_string runtime "reference title")

let duplicate_page_name runtime datascript database title =
  let normalized = Melange_common.String_util.page_name_sanity_lower title in
  Melange_datascript_spec.Api.datoms datascript database
    (keyword runtime "avet")
    [|
      keyword runtime "block/name";
      Melange_cljs_runtime_spec.Value_codec.string_to_value runtime normalized;
    |]
  |> Array.length
  |> fun count -> count > 1

let id_title_entries runtime datascript refs database replace_block_ids
    replace_pages_with_same_name =
  let duplicate_title =
    match Js.Nullable.toOption database with
    | Some database when not replace_pages_with_same_name ->
        duplicate_page_name runtime datascript database
    | Some _ | None -> fun _title -> false
  in
  Domain.select_id_title_entries_with ~refs:(values runtime refs)
    ~page_ref:(page_ref_entity runtime datascript)
    ~uuid:(fun value ->
      optional_field runtime datascript value "block/uuid"
      |> Option.map (value_string runtime))
    ~raw_title:(raw_title runtime datascript)
    ~duplicate_title ~replace_block_ids ~replace_pages_with_same_name

let idRefToTitleRefWith runtime datascript content refs database
    replace_block_ids replace_pages_with_same_name =
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime content)
  then Melange_cljs_runtime_spec.Value_codec.nil_value runtime
  else
    id_title_entries runtime datascript refs database replace_block_ids
      replace_pages_with_same_name
    |> Domain.replace_id_refs_with_titles
         (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
            content)
    |> Melange_cljs_runtime_spec.Value_codec.string_to_value runtime

let updateBlockContentWith runtime datascript database item eid =
  match optional_field runtime datascript item "block/title" with
  | None -> item
  | Some content ->
      let refs =
        match
          Melange_datascript_spec.Api.entity datascript database eid
          |> Js.Nullable.toOption
        with
        | None -> [||]
        | Some entity ->
            field runtime datascript entity "block/refs"
            |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
      in
      let refs =
        Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime refs
      in
      let title =
        idRefToTitleRefWith runtime datascript content refs Js.Nullable.null
          false true
      in
      Melange_cljs_runtime_spec.Value_codec.map_assoc runtime item
        (keyword runtime "block/title")
        title
