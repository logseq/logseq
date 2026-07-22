let value_content_with ~get ~truthy entity =
  let title = get entity "block/title" in
  if truthy title then title else get entity "logseq.property/value"

let lookup_with ~get ~has_ref_value ~content block ident =
  let value = get block ident in
  if has_ref_value ident then content value else value

let built_in_display_title_with ~get ~ident_text ~translate ~truthy
    ~value_to_string entity =
  let title = get entity "block/title" in
  match
    Option.bind
      (get entity "db/ident" |> ident_text)
      Property_identity.built_in_i18n_key_for_ident
  with
  | None -> title
  | Some (namespace_, name) ->
      let translated = translate (namespace_ ^ "/" ^ name) in
      if
        (not (truthy translated))
        || String.starts_with ~prefix:"{Missing" (value_to_string translated)
      then title
      else translated

let block_property_value_with ~entity ~block_id ~lookup database block ident =
  match database with
  | None -> None
  | Some database ->
      let current =
        entity database (block_id block) |> Option.value ~default:block
      in
      Some (lookup current ident)
