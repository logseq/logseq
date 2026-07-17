module String_set = Set.Make (String)

type ancestor = { id : string option; hidden : bool; deleted : bool }
type entity_type = Class | Property | Journal | Page

let has_tag tags target =
  Rrbvec.fold_left
    (fun found tag -> found || String.equal tag target)
    false tags

let entity_types tags =
  Rrbvec.of_array
  [|
    ("logseq.class/Tag", Class);
    ("logseq.class/Property", Property);
    ("logseq.class/Journal", Journal);
    ("logseq.class/Page", Page);
  |]
  |> Rrbvec.fold_left
       (fun result (tag, entity_type) ->
         if has_tag tags tag then Rrbvec.push_back result entity_type
         else result)
       Rrbvec.empty

let pages_by_name_with ~datoms ~name_attribute ~normalize page_name =
  datoms name_attribute (normalize page_name)

let tag_ident_texts_with ~get ~collection_to_array ~is_collection ~is_keyword
    ~keyword_to_string ~resolve_tag entity =
  let tags = get entity "block/tags" in
  (if is_collection tags then collection_to_array tags else [| tags |])
  |> Array.fold_left
       (fun result tag ->
         let tag = if is_keyword tag then tag else resolve_tag tag in
         let ident = if is_keyword tag then tag else get tag "db/ident" in
         if is_keyword ident then
           Rrbvec.push_back result (keyword_to_string ident)
         else result)
       Rrbvec.empty

let has_internal_page_name value =
  String.length value >= 3 && String.equal (String.sub value 0 3) "$$$"

let ancestor_matches predicate ancestors =
  let _, _, found =
    Rrbvec.fold_left
      (fun (seen, stopped, found) ancestor ->
        if stopped || found then (seen, stopped, found)
        else
          match ancestor.id with
          | None -> (seen, true, false)
          | Some id when String_set.mem id seen -> (seen, true, false)
          | Some id ->
              let seen = String_set.add id seen in
              (seen, false, predicate ancestor))
      (String_set.empty, false, false)
      ancestors
  in
  found

let hidden ~page_name ~recognized ~root_hidden ~root_deleted ancestors =
  match page_name with
  | Some value -> has_internal_page_name value
  | None ->
      recognized
      && (root_hidden || root_deleted
         || ancestor_matches
              (fun ancestor -> ancestor.hidden || ancestor.deleted)
              ancestors)

let recycled ~recognized ~root_deleted ancestors =
  recognized
  && (root_deleted
     || ancestor_matches (fun ancestor -> ancestor.deleted) ancestors)

let ancestors_with ~get ~is_nil ~truthy ~value_to_string parent =
  let rec collect entity seen result =
    if is_nil entity then result
    else
      let id_value = get entity "db/id" in
      let id =
        if is_nil id_value then None else Some (value_to_string id_value)
      in
      let payload =
        {
          id;
          hidden = truthy (get entity "logseq.property/hide?");
          deleted = truthy (get entity "logseq.property/deleted-at");
        }
      in
      let result = Rrbvec.push_back result payload in
      match id with
      | None -> result
      | Some value when String_set.mem value seen -> result
      | Some value ->
          collect (get entity "block/parent") (String_set.add value seen) result
  in
  collect parent String_set.empty Rrbvec.empty

let hidden_value_with ~get ~is_nil ~is_string ~string_from_value ~entity_like
    ~truthy ~value_to_string page =
  if is_string page then
    hidden
      ~page_name:(Some (string_from_value page))
      ~recognized:false ~root_hidden:false ~root_deleted:false Rrbvec.empty
  else
    let recognized = entity_like page in
    let ancestors =
      if recognized then
        ancestors_with ~get ~is_nil ~truthy ~value_to_string
          (get page "block/parent")
      else Rrbvec.empty
    in
    hidden ~page_name:None ~recognized
      ~root_hidden:(recognized && truthy (get page "logseq.property/hide?"))
      ~root_deleted:
        (recognized && truthy (get page "logseq.property/deleted-at"))
      ancestors

let recycled_value_with ~get ~is_nil ~entity_like ~truthy ~value_to_string
    entity =
  let recognized = entity_like entity in
  let ancestors =
    if recognized then
      ancestors_with ~get ~is_nil ~truthy ~value_to_string
        (get entity "block/parent")
    else Rrbvec.empty
  in
  recycled ~recognized
    ~root_deleted:
      (recognized && truthy (get entity "logseq.property/deleted-at"))
    ancestors
