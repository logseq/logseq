let is_lower_hex = function '0' .. '9' | 'a' .. 'f' -> true | _ -> false

let is_uuid value =
  if String.length value <> 36 then false
  else
    let valid = ref true in
    let index = ref 0 in
    while !valid && !index < 36 do
      valid :=
        if !index = 8 || !index = 13 || !index = 18 || !index = 23 then
          value.[!index] = '-'
        else is_lower_hex value.[!index];
      index := !index + 1
    done;
    !valid

let contains values value =
  let found = ref false in
  let index = ref 0 in
  while (not !found) && !index < Rrbvec.length values do
    found := String.equal (Rrbvec.nth values !index) value;
    index := !index + 1
  done;
  !found

let matched_ids content =
  let content_length = String.length content in
  let rec scan index matches =
    if index + 40 > content_length then matches
    else if
      content.[index] = '['
      && content.[index + 1] = '['
      && content.[index + 38] = ']'
      && content.[index + 39] = ']'
    then
      let candidate = String.sub content (index + 2) 36 in
      if is_uuid candidate then
        let matches =
          if contains matches candidate then matches
          else Rrbvec.push_back matches candidate
        in
        scan (index + 40) matches
      else scan (index + 1) matches
    else scan (index + 1) matches
  in
  scan 0 Rrbvec.empty

type ref_entry = { target : string; title : string }

let regex_special_characters =
  Js.Re.fromStringWithFlags "[\\\\[\\]{}().+*?|$^]" ~flags:"g"

let replace_entry content entry =
  let regexp =
    entry.target
    |> Js.String.replaceByRe ~regexp:regex_special_characters
         ~replacement:"\\$&"
    |> Js.Re.fromStringWithFlags ~flags:"g"
  in
  Js.String.replaceByRe ~regexp ~replacement:entry.title content

let replace_id_refs content refs = Rrbvec.fold_left replace_entry content refs

type tag_entry = { title : string; id : string }

let nested_page_ref_re = Js.Re.fromString "\\[\\[([^\\[\\]]+)\\]\\]"

let compare_tag left right =
  let left_nested = Js.Re.test ~str:left.title nested_page_ref_re in
  let right_nested = Js.Re.test ~str:right.title nested_page_ref_re in
  let nested_order = Bool.compare right_nested left_nested in
  if nested_order <> 0 then nested_order
  else String.compare right.title left.title

let sort_tags tags =
  let sorted = Rrbvec.to_array tags in
  Array.stable_sort compare_tag sorted;
  Rrbvec.of_array sorted

let page_ref value = "[[" ^ value ^ "]]"

let replace_ignore_case value old_value new_value =
  let regexp =
    old_value
    |> Js.String.replaceByRe ~regexp:regex_special_characters
         ~replacement:"\\$&"
    |> Js.Re.fromStringWithFlags ~flags:"gi"
  in
  Js.String.replaceByRe ~regexp ~replacement:new_value value

let replace_tag_with_id_ref content entry =
  let id_ref = page_ref entry.id in
  let content =
    replace_ignore_case content ("#" ^ page_ref entry.title) id_ref
  in
  replace_ignore_case content ("#" ^ entry.title) id_ref

let replace_tags_with_id_refs content tags =
  tags |> sort_tags
  |> Rrbvec.fold_left replace_tag_with_id_ref content
  |> Js.String.trim

let replace_tag_ref_with_page_ref content entry =
  let id_ref = page_ref entry.id in
  let content = replace_ignore_case content ("#" ^ id_ref) id_ref in
  replace_ignore_case content ("#" ^ id_ref) id_ref

let replace_tag_refs_with_page_refs content tags =
  tags |> sort_tags
  |> Rrbvec.fold_left replace_tag_ref_with_page_ref content
  |> Js.String.trim

type title_ref_entry = {
  title : string;
  id : string;
  original_title : string option;
}

let is_hex = function
  | '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' -> true
  | _ -> false

let is_canonical_uuid value =
  if String.length value <> 36 then false
  else
    let valid = ref true in
    let index = ref 0 in
    while !valid && !index < 36 do
      valid :=
        if !index = 8 || !index = 13 || !index = 18 || !index = 23 then
          value.[!index] = '-'
        else is_hex value.[!index];
      index := !index + 1
    done;
    !valid

let replacement_title entry =
  match entry.original_title with
  | Some title when not (is_canonical_uuid title) -> title
  | Some _ | None -> entry.title

let hash_tag_prefix_re = Js.Re.fromStringWithFlags "HashTag-" ~flags:"g"

let normalize_replacement_title title =
  Js.String.replaceByRe ~regexp:hash_tag_prefix_re ~replacement:"#" title

let compare_title_ref left right =
  let left_nested = Js.Re.test ~str:left.title nested_page_ref_re in
  let right_nested = Js.Re.test ~str:right.title nested_page_ref_re in
  let nested_order = Bool.compare right_nested left_nested in
  if nested_order <> 0 then nested_order
  else String.compare right.title left.title

let sort_title_refs refs =
  let sorted = Rrbvec.to_array refs in
  Array.stable_sort compare_title_ref sorted;
  Rrbvec.of_array sorted

let escape_regex value =
  Js.String.replaceByRe ~regexp:regex_special_characters ~replacement:"\\$&"
    value

let replace_page_title_ref content title id =
  let regexp =
    Js.Re.fromStringWithFlags
      ("(^|[^#])" ^ escape_regex (page_ref title))
      ~flags:"gi"
  in
  Js.String.replaceByRe ~regexp ~replacement:("$1" ^ page_ref id) content

let replace_tag_title_ref content title id =
  let page = if String.contains title ' ' then page_ref title else title in
  let regexp =
    Js.Re.fromStringWithFlags
      ("(^|\\s|\\()(" ^ escape_regex ("#" ^ page) ^ ")(?=[,\\.\\)]*($|\\s|\\)))")
      ~flags:"gi"
  in
  Js.String.replaceByRe ~regexp ~replacement:("$1#" ^ page_ref id) content

let replace_title_ref ~replace_tags content entry =
  let title = entry |> replacement_title |> normalize_replacement_title in
  let content = replace_page_title_ref content title entry.id in
  if replace_tags then replace_tag_title_ref content title entry.id else content

let replace_title_refs content refs ~replace_tags =
  refs |> sort_title_refs
  |> Rrbvec.fold_left (replace_title_ref ~replace_tags) content

type uuid_title_entry = { uuid : string; title : string }
type uuid_ref_match = { id : string; tagged : bool; length : int }

let uuid_ref_at content index =
  let content_length = String.length content in
  if
    index + 41 <= content_length
    && content.[index] = '#'
    && content.[index + 1] = '['
    && content.[index + 2] = '['
    && content.[index + 39] = ']'
    && content.[index + 40] = ']'
  then
    let id = String.sub content (index + 3) 36 in
    if is_uuid id then Some { id; tagged = true; length = 41 } else None
  else if
    index + 40 <= content_length
    && content.[index] = '['
    && content.[index + 1] = '['
    && content.[index + 38] = ']'
    && content.[index + 39] = ']'
  then
    let id = String.sub content (index + 2) 36 in
    if is_uuid id then Some { id; tagged = false; length = 40 } else None
  else None

let contains_uuid_ref content =
  let rec scan index =
    index < String.length content
    &&
    match uuid_ref_at content index with
    | Some _ -> true
    | None -> scan (index + 1)
  in
  scan 0

let find_uuid_title entries id =
  let rec find index =
    if index >= Rrbvec.length entries then None
    else
      let entry : uuid_title_entry = Rrbvec.nth entries index in
      if String.equal entry.uuid id then Some entry.title else find (index + 1)
  in
  find 0

let replacement_for_uuid_ref match_ title =
  if match_.tagged then
    if String.contains title ' ' then "#" ^ page_ref title else "#" ^ title
  else page_ref title

let replace_uuid_refs_once content entries =
  let result = Buffer.create (String.length content) in
  let rec scan index =
    if index >= String.length content then Buffer.contents result
    else
      match uuid_ref_at content index with
      | Some match_ -> (
          match find_uuid_title entries match_.id with
          | Some title ->
              Buffer.add_string result (replacement_for_uuid_ref match_ title);
              scan (index + match_.length)
          | None ->
              Buffer.add_char result content.[index];
              scan (index + 1))
      | None ->
          Buffer.add_char result content.[index];
          scan (index + 1)
  in
  scan 0

let replace_uuid_refs content entries ~max_depth =
  let rec replace result depth =
    if depth >= max_depth || not (contains_uuid_ref result) then result
    else
      let next_result = replace_uuid_refs_once result entries in
      if String.equal result next_result then result
      else replace next_result (depth + 1)
  in
  replace content 0

let compare_uuid_title left right =
  let left_nested = Js.Re.test ~str:left.title nested_page_ref_re in
  let right_nested = Js.Re.test ~str:right.title nested_page_ref_re in
  let nested_order = Bool.compare right_nested left_nested in
  if nested_order <> 0 then nested_order
  else String.compare right.title left.title

let sort_uuid_titles refs =
  let sorted = Rrbvec.to_array refs in
  Array.stable_sort compare_uuid_title sorted;
  Rrbvec.of_array sorted

let replace_id_ref_with_title content entry =
  let target = page_ref entry.uuid in
  let content =
    if String.contains entry.title ' ' then content
    else
      replace_entry content { target = "#" ^ target; title = "#" ^ entry.title }
  in
  replace_entry content { target; title = page_ref entry.title }

let replace_id_refs_with_titles content refs =
  refs |> sort_uuid_titles |> Rrbvec.fold_left replace_id_ref_with_title content

let page_ref_entity_with ~tags ~tag_ident ~is_page_ident reference =
  reference |> tags |> Rrbvec.exists (fun tag -> tag |> tag_ident |> is_page_ident)

let contains_with equal values target = Rrbvec.exists (equal target) values

let append_ref_children ~refs ~is_ref values reference =
  reference |> refs
  |> Rrbvec.fold_left
       (fun result value ->
         if is_ref value then Rrbvec.push_back result value else result)
       values

let uuid_title_entries_with ~refs ~uuid ~title ~page_ref ~is_ref ~equal
    ~stringify ~max_depth ~replace_block_refs entity =
  if max_depth < 0 then invalid_arg "DB content: max depth cannot be negative";
  let rec collect frontier seen entries depth =
    if depth >= max_depth || Rrbvec.is_empty frontier then entries
    else
      let current =
        frontier
        |> Rrbvec.filter (fun reference ->
             is_ref reference
             &&
             match uuid reference with
             | Some id -> not (contains_with equal seen id)
             | None -> true)
      in
      let seen =
        current
        |> Rrbvec.fold_left
             (fun result reference ->
               match uuid reference with
               | None -> result
               | Some id ->
                   if contains_with equal result id then result
                   else Rrbvec.push_back result id)
             seen
      in
      let entries =
        current
        |> Rrbvec.fold_left
             (fun result reference ->
               match (uuid reference, title reference) with
               | Some id, Some title
                 when replace_block_refs || page_ref reference ->
                   Rrbvec.push_back result { uuid = stringify id; title }
               | Some _, Some _ | None, _ | _, None -> result)
             entries
      in
      let next =
        current
        |> Rrbvec.fold_left (append_ref_children ~refs ~is_ref) Rrbvec.empty
      in
      collect next seen entries (depth + 1)
  in
  collect (refs entity) Rrbvec.empty Rrbvec.empty 0

let select_id_title_entries_with ~refs ~page_ref ~uuid ~raw_title
    ~duplicate_title ~replace_block_ids ~replace_pages_with_same_name =
  refs
  |> Rrbvec.filter_map (fun reference ->
       let page_reference = page_ref reference in
       if (not replace_block_ids) && not page_reference then None
       else
         match (uuid reference, raw_title reference) with
         | Some uuid, Some title
           when replace_pages_with_same_name
                || not (page_reference && duplicate_title title) ->
             Some { uuid; title }
         | Some _, Some _ | None, _ | _, None -> None)
