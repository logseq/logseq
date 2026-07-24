type encoded_ref = { target : string; title : string }
type encoded_tag = { title : string; id : string }

type encoded_title_ref = {
  title : string;
  id : string;
  originalTitle : string Js.Nullable.t;
}

type encoded_uuid_title = { id : string; title : string }

let matchedIds content =
  Melange_db.Content.matched_ids content |> Rrbvec.to_array

let replaceIdRefs content refs =
  refs
  |> Array.map (fun (entry : encoded_ref) ->
      ({ target = entry.target; title = entry.title }
        : Melange_db.Content.ref_entry))
  |> Rrbvec.of_array
  |> Melange_db.Content.replace_id_refs content

let decode_tags tags =
  tags
  |> Array.map (fun (entry : encoded_tag) ->
      ({ title = entry.title; id = entry.id } : Melange_db.Content.tag_entry))
  |> Rrbvec.of_array

let replaceTagsWithIdRefs content tags =
  Melange_db.Content.replace_tags_with_id_refs content (decode_tags tags)

let replaceTagRefsWithPageRefs content tags =
  Melange_db.Content.replace_tag_refs_with_page_refs content (decode_tags tags)

let replaceTitleRefs content refs replace_tags =
  refs
  |> Array.map (fun (entry : encoded_title_ref) ->
      ({
         title = entry.title;
         id = entry.id;
         original_title = Js.Nullable.toOption entry.originalTitle;
       }
        : Melange_db.Content.title_ref_entry))
  |> Rrbvec.of_array
  |> Melange_db.Content.replace_title_refs content ~replace_tags

let containsUuidRef content = Melange_db.Content.contains_uuid_ref content

let decode_uuid_titles entries =
  entries
  |> Array.map (fun (entry : encoded_uuid_title) ->
      ({ uuid = entry.id; title = entry.title }
        : Melange_db.Content.uuid_title_entry))
  |> Rrbvec.of_array

let replaceUuidRefs content entries max_depth =
  entries |> decode_uuid_titles
  |> Melange_db.Content.replace_uuid_refs content ~max_depth

let replaceIdRefsWithTitles content entries =
  Melange_db.Content.replace_id_refs_with_titles content
    (decode_uuid_titles entries)
