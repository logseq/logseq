type list_options = Melange_edn.any

type page_filter = {
  expand : bool;
  include_hidden : bool;
  include_built_in : bool;
  include_journal : bool;
  journal_only : bool;
  created_after : Js.Date.t option;
  updated_after : Js.Date.t option;
}

type node_filter = {
  tag_ids : Cli_primitive.db_id list;
  property_idents : Cli_primitive.keyword list;
}

let add_raw_field key raw fields =
  match Edn_util.get raw key with
  | None -> fields
  | Some value -> (Edn_util.keyword key, value) :: fields

let minimal_list_item e =
  []
  |> add_raw_field ":logseq.property/type" e.Entity.raw
  |> add_raw_field ":db/cardinality" e.Entity.raw
  |> add_raw_field ":db/ident" e.Entity.raw
  |> add_raw_field ":block/updated-at" e.Entity.raw
  |> add_raw_field ":block/created-at" e.Entity.raw
  |> add_raw_field ":block/title" e.Entity.raw
  |> add_raw_field ":db/id" e.Entity.raw
  |> fun fields -> Edn_util.map_t fields

let values_of_collection value =
  match Edn_util.as_seq value with
  | Some xs -> xs
  | None when Edn_util.is_null value -> []
  | _ -> [ value ]

let value_ident value =
  match Edn_util.as_keyword_t value with
  | Some keyword -> Some keyword
  | None -> (
      match Edn_util.as_string_like value with
      | Some keyword -> Some (Edn_util.keyword_t keyword)
      | None ->
          if Option.is_some (Edn_util.as_map value) then
            Option.bind (Edn_util.get value ":db/ident") Edn_util.as_keyword_t
          else None)

let value_id value =
  match Edn_util.as_int64 value with
  | Some id -> Some id
  | None ->
      if Option.is_some (Edn_util.as_map value) then
        Edn_util.get_int64 value ":db/id"
      else None

let bool_field key value =
  match Edn_util.get_bool value key with Some true -> true | _ -> false

let int_field key value = Edn_util.get_int64 value key

let time_field key value =
  Option.map Time.time_of_epoch_ms (int_field key value)

let tags_of_value value =
  match Edn_util.get value ":block/tags" with
  | Some tags_value -> (
      match Edn_util.as_seq tags_value with
      | Some tags -> List.filter_map value_ident tags
      | None -> (
          match value_ident tags_value with Some tag -> [ tag ] | None -> []))
  | None -> []

let tag_ids_of_value value =
  match Edn_util.get value ":block/tags" with
  | Some tags_value -> (
      match Edn_util.as_seq tags_value with
      | Some tags -> List.filter_map value_id tags
      | None -> (
          match value_id tags_value with Some id -> [ id ] | None -> []))
  | None -> []

let key_matches key value =
  match Edn_util.as_string_like value with
  | Some candidate ->
      candidate = key
      || String.length key > 0
         && key.[0] = ':'
         && candidate = String.sub key 1 (String.length key - 1)
      || candidate = ":" ^ key
  | None -> false

let has_key key value =
  match Edn_util.as_map value with
  | Some fields ->
      List.exists (fun (candidate, _) -> key_matches key candidate) fields
  | None -> false

let is_built_in value =
  bool_field ":logseq.property/built-in?" value
  || bool_field ":block/built-in?" value

let is_hidden value =
  bool_field ":block/hidden?" value
  || bool_field ":logseq.property/hidden?" value
  || bool_field ":logseq.property/hide?" value

let is_journal value =
  bool_field ":block/journal?" value
  || Option.is_some (Edn_util.get value ":block/journal-day")

let with_entity_raw raw kind =
  let entity = Entity.of_value raw in
  {
    entity with
    kind;
    tags = tags_of_value raw;
    created_at = time_field ":block/created-at" raw;
    updated_at = time_field ":block/updated-at" raw;
    deleted_at = time_field ":logseq.property/deleted-at" raw;
  }

let entity_with_output raw kind ~expand =
  let entity = with_entity_raw raw kind in
  if expand then entity
  else { entity with raw = Edn_util.any (minimal_list_item entity) }

let include_after key cutoff value =
  match cutoff with
  | None -> true
  | Some cutoff -> (
      match Edn_util.get_int64 value key with
      | Some actual ->
          Time.compare_time (Time.time_of_epoch_ms actual) cutoff > 0
      | None -> Time.compare_time Time.epoch cutoff > 0)

let list_pages db filter =
  db |> values_of_collection
  |> List.filter (fun value -> filter.include_hidden || not (is_hidden value))
  |> List.filter (fun value ->
      filter.include_built_in || not (is_built_in value))
  |> List.filter (fun value ->
      let journal = is_journal value in
      if filter.journal_only then journal
      else filter.include_journal || not journal)
  |> List.filter (include_after ":block/created-at" filter.created_after)
  |> List.filter (include_after ":block/updated-at" filter.updated_after)
  |> List.map (fun raw ->
      entity_with_output raw Entity.Page ~expand:filter.expand)

let option_bool key default options =
  match Edn_util.get_bool options key with
  | Some value -> value
  | None -> default

let option_string key options = Edn_util.get_string options key

let option_ident key options =
  match Edn_util.get options key with
  | Some value -> value_ident value
  | None -> None

let option_expand options = option_bool ":expand" false options

let option_include_built_in options =
  option_bool ":include-built-in" true options

let list_schema_entities db options kind =
  let expand = option_expand options in
  let include_built_in = option_include_built_in options in
  db |> values_of_collection
  |> List.filter (fun value -> include_built_in || not (is_built_in value))
  |> List.map (fun raw -> entity_with_output raw kind ~expand)

let list_tags db options = list_schema_entities db options Entity.Tag
let list_properties db options = list_schema_entities db options Entity.Property

let string_includes ~needle value =
  let needle = String.lowercase_ascii needle in
  let value = String.lowercase_ascii value in
  let needle_len = String.length needle in
  let value_len = String.length value in
  let rec loop index =
    needle_len = 0
    || index + needle_len <= value_len
       && (String.sub value index needle_len = needle || loop (index + 1))
  in
  loop 0

let list_tasks db options =
  let status = option_ident ":status" options in
  let priority = option_ident ":priority" options in
  let content = option_string ":content" options in
  db |> values_of_collection
  |> List.filter (fun value ->
      match status with
      | None -> true
      | Some expected ->
          option_ident ":logseq.property/status" value = Some expected)
  |> List.filter (fun value ->
      match priority with
      | None -> true
      | Some expected ->
          option_ident ":logseq.property/priority" value = Some expected)
  |> List.filter (fun value ->
      match content with
      | None -> true
      | Some needle -> (
          match Edn_util.get_string value ":block/title" with
          | Some title -> string_includes ~needle title
          | None -> false))
  |> List.map (fun raw -> entity_with_output raw Entity.Task ~expand:false)

let has_all_tag_ids expected value =
  match expected with
  | [] -> true
  | ids ->
      let actual = tag_ids_of_value value in
      List.for_all (fun id -> List.mem id actual) ids

let has_all_property_idents expected value =
  match expected with
  | [] -> true
  | idents ->
      List.for_all
        (fun ident -> has_key (Edn_util.keyword_to_string ident) value)
        idents

let schema_definition value =
  let tags = tags_of_value value in
  List.mem (Edn_util.keyword_t ":logseq.class/Tag") tags
  || List.mem (Edn_util.keyword_t ":logseq.class/Property") tags

let list_nodes db filter =
  db |> values_of_collection
  |> List.filter (fun value -> not (schema_definition value))
  |> List.filter (has_all_tag_ids filter.tag_ids)
  |> List.filter (has_all_property_idents filter.property_idents)
  |> List.map (fun raw ->
      let kind =
        if Option.is_some (Edn_util.get raw ":block/page") then Entity.Block
        else Entity.Page
      in
      entity_with_output raw kind ~expand:false)
