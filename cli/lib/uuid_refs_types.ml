type uuid_label = {
  uuid : Cli_primitive.uuid;
  id : Cli_primitive.db_id option;
  label : string option;
}

let uuid_ref_max_depth = 10
let lower_uuid uuid = String.lowercase_ascii uuid

let unique_preserve_order values =
  let rec loop seen acc values =
    match Vec.pop_front values with
    | None -> Vec.rev acc
    | Some (value, rest) ->
        if Vec.mem value seen then loop seen acc rest
        else loop (Vec.push_front seen value) (Vec.push_front acc value) rest
  in
  loop Vec.empty Vec.empty values

let find_substring_from ~needle haystack start =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop index =
    if index + needle_len > haystack_len then None
    else if String.sub haystack index needle_len = needle then Some index
    else loop (index + 1)
  in
  loop start

let extract_wiki_refs value =
  let rec loop start acc =
    match find_substring_from ~needle:"[[" value start with
    | None -> Vec.rev acc |> unique_preserve_order
    | Some open_index -> (
        let content_start = open_index + 2 in
        match find_substring_from ~needle:"]]" value content_start with
        | None -> Vec.rev acc |> unique_preserve_order
        | Some close_index ->
            let candidate =
              String.sub value content_start (close_index - content_start)
            in
            loop (close_index + 2) (Vec.push_front acc candidate))
  in
  loop 0 Vec.empty

let extract_uuid_refs value =
  value |> extract_wiki_refs
  |> Vec.filter Cli_primitive.is_uuid_string
  |> Vec.map lower_uuid |> unique_preserve_order

let label_lookup labels uuid =
  let uuid = lower_uuid uuid in
  Vec.find_map
    (fun (candidate, label) ->
      if lower_uuid candidate = uuid then Some label else None)
    labels

let replace_uuid_refs_once value labels =
  let buffer = Buffer.create (String.length value) in
  let rec loop start changed =
    match find_substring_from ~needle:"[[" value start with
    | None ->
        Buffer.add_substring buffer value start (String.length value - start);
        (Buffer.contents buffer, changed)
    | Some open_index -> (
        Buffer.add_substring buffer value start (open_index - start);
        let content_start = open_index + 2 in
        match find_substring_from ~needle:"]]" value content_start with
        | None ->
            Buffer.add_substring buffer value open_index
              (String.length value - open_index);
            (Buffer.contents buffer, changed)
        | Some close_index -> (
            let candidate =
              String.sub value content_start (close_index - content_start)
            in
            match label_lookup labels candidate with
            | Some label when Cli_primitive.is_uuid_string candidate ->
                Buffer.add_string buffer ("[[" ^ label ^ "]]");
                loop (close_index + 2) true
            | _ ->
                Buffer.add_substring buffer value open_index
                  (close_index + 2 - open_index);
                loop (close_index + 2) changed))
  in
  loop 0 false

let replace_uuid_refs text labels =
  let rec loop remaining current =
    if remaining <= 0 || Vec.is_empty labels then current
    else
      let next, changed = replace_uuid_refs_once current labels in
      if changed then loop (remaining - 1) next else current
  in
  loop uuid_ref_max_depth text

let collect_uuid_refs_from_strings values =
  values |> Vec.concat_map extract_uuid_refs |> unique_preserve_order

let field_text field = Edn_util.keyword_to_string field

let string_field item field =
  Edn_util.get_string item.Entity.raw (field_text field)

let collect_uuid_refs_from_items items fields =
  items
  |> Vec.concat_map (fun item -> Vec.filter_map (string_field item) fields)
  |> collect_uuid_refs_from_strings

let normalize_entity_field item field labels =
  match string_field item field with
  | None -> item
  | Some value ->
      let value = replace_uuid_refs value labels in
      let field = field_text field in
      let raw = Edn_util.assoc field (Edn_util.string value) item.Entity.raw in
      let item = { item with Entity.raw } in
      if field = "block/title" then { item with title = Some value }
      else if field = "block/name" || field = "name" then
        { item with name = Some value }
      else item

let normalize_item_string_fields items fields labels =
  Vec.map
    (fun item ->
      Vec.fold_left
        (fun item field -> normalize_entity_field item field labels)
        item fields)
    items

let kw value = Edn_util.keyword value
let vector_vec values = Edn_util.vector_vec values

let uuid_lookup_selector =
  vector_vec
    (Vec.of_array
       [| kw "db/id"; kw "block/uuid"; kw "block/title"; kw "block/name" |])

let uuid_lookup uuid =
  vector_vec (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |])

let value_uuid value =
  match
    Option.bind (Edn_util.get value "block/uuid") Edn_util.as_string_like
  with
  | Some uuid when Cli_primitive.is_uuid_string uuid -> Some (lower_uuid uuid)
  | _ -> None

let label_of_value value =
  match Edn_util.get_string value "block/title" with
  | Some title when String.trim title <> "" -> Some title
  | _ -> (
      match Edn_util.get_string value "block/name" with
      | Some name when String.trim name <> "" -> Some name
      | _ -> value_uuid value)

let fetch_uuid_entities config repo uuids =
  let uuids =
    uuids
    |> Vec.filter Cli_primitive.is_uuid_string
    |> Vec.map lower_uuid |> unique_preserve_order
  in
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error _ -> pure Vec.empty
    | Ok invoke_config ->
        let rec pull acc uuids =
          match Vec.pop_front uuids with
          | None -> pure (Vec.rev acc)
          | Some (uuid, rest) ->
              bind
                (Transport.thread_api_pull invoke_config ~repo
                   ~selector:
                     (Edn_util.expect_vector_t "uuid lookup selector"
                        uuid_lookup_selector)
                   ~lookup:(uuid_lookup uuid))
                (fun value ->
                  let acc =
                    match value_uuid value with
                    | None -> acc
                    | Some uuid ->
                        Vec.push_front acc
                          {
                            uuid;
                            id = Edn_util.get_int64 value "db/id";
                            label = label_of_value value;
                          }
                  in
                  pull acc rest)
        in
        pull Vec.empty uuids)

let fetch_uuid_labels config repo uuids =
  Cli_effect.map
    (Vec.filter_map (fun entry ->
         Option.map (fun label -> (entry.uuid, label)) entry.label))
    (fetch_uuid_entities config repo uuids)
