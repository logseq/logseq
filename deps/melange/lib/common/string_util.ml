let split_at position pattern value =
  let pattern_length = String.length pattern in
  ( Js.String.substring ~start:0 ~end_:position value,
    Js.String.substring ~start:(position + pattern_length) value )

let split_first pattern value =
  let position = Js.String.indexOf ~search:pattern value in
  if position < 0 then None else Some (split_at position pattern value)

let split_last pattern value =
  let position = Js.String.lastIndexOf ~search:pattern value in
  if position < 0 then None else Some (split_at position pattern value)

let invalid_tag_re = Js.Re.fromString "[#\\t\\r\\n]+"
let is_valid_tag value = not (Js.Re.test ~str:value invalid_tag_re)

let safe_substring value ~start =
  Js.String.substring ~start:(min (String.length value) start) value

let safe_substring_range value ~start ~end_ =
  let length = String.length value in
  Js.String.substring ~start:(min length start) ~end_:(min length end_) value

let is_wrapped_by value ~start ~end_ =
  let length = String.length value in
  length >= 2
  && String.equal (Js.String.substring ~start:0 ~end_:1 value) start
  && String.equal (Js.String.substring ~start:(length - 1) value) end_

let is_wrapped_by_quotes value = is_wrapped_by value ~start:"\"" ~end_:"\""
let is_wrapped_by_parens value = is_wrapped_by value ~start:"(" ~end_:")"

let zero_pad value =
  let formatted = string_of_int value in
  if value < 10 then "0" ^ formatted else formatted

let markdown_heading_re = Js.Re.fromString "^#+\\s+"

let clear_markdown_heading value =
  Js.String.replaceByRe ~regexp:markdown_heading_re ~replacement:"" value

let normalize_nfc value = Js.String.normalize ~form:`NFC value

let join ~separator values =
  let buffer = Buffer.create (Rrbvec.length values * 16) in
  Rrbvec.iteri
    (fun index value ->
      if index > 0 then Buffer.add_string buffer separator;
      Buffer.add_string buffer value)
    values;
  Buffer.contents buffer

let remove_boundary_slashes value =
  let without_leading =
    if String.equal (Js.String.substring ~start:0 ~end_:1 value) "/" then
      Js.String.substring ~start:1 value
    else value
  in
  let length = String.length without_leading in
  if
    length > 0
    && String.equal
         (Js.String.substring ~start:(length - 1) without_leading)
         "/"
  then Js.String.substring ~start:0 ~end_:(length - 1) without_leading
  else without_leading

let without_trailing_empty_parts value parts =
  if String.equal value "" then parts
  else
    let last = ref (Array.length parts - 1) in
    while !last >= 0 && String.equal parts.(!last) "" do
      decr last
    done;
    Array.sub parts 0 (!last + 1)

let split_namespace_pages value =
  let parts =
    value |> Js.String.split ~sep:"/"
    |> without_trailing_empty_parts value
    |> Rrbvec.of_array
  in
  if Rrbvec.is_empty parts then invalid_arg "namespace page has no parts";
  parts
  |> Rrbvec.fold_left
       (fun (previous, result) part ->
         let current =
           match previous with
           | None -> part
           | Some previous -> previous ^ "/" ^ part
         in
         (Some current, Rrbvec.push_back result (Js.String.trim current)))
       (None, Rrbvec.empty)
  |> snd

let page_name_sanity value = value |> remove_boundary_slashes |> normalize_nfc

let page_name_sanity_lower value =
  value |> Js.String.toLowerCase |> page_name_sanity

let capitalize_word value =
  if String.equal value "" then ""
  else
    (Js.String.substring ~start:0 ~end_:1 value |> Js.String.toUpperCase)
    ^ (Js.String.substring ~start:1 value |> Js.String.toLowerCase)

let capitalize_all value =
  value |> Js.String.split ~sep:" " |> Rrbvec.of_array
  |> Rrbvec.map capitalize_word |> Rrbvec.to_array |> Js.Array.join ~sep:" "

let decode_uri_component value =
  try Ok (Js.Global.decodeURIComponent value) with _ -> Error value

let is_url value =
  try
    let origin = value |> Url_support.make |> Url_support.origin in
    not (String.equal origin "null")
  with _ -> false

let url_encoded_pattern = Js.Re.fromStringWithFlags "%[0-9a-f]{2}" ~flags:"i"

let normalize_format_name value =
  if String.equal value "md" then "markdown" else value

let file_extension_re = Js.Re.fromString "(?:\\.)(\\w+)[^.]*$"

let path_file_extension value =
  let parts = Js.String.split ~sep:"/" value in
  let last_part = parts.(Array.length parts - 1) in
  match Js.Re.exec ~str:last_part file_extension_re with
  | None -> None
  | Some result ->
      let captures = Js.Re.captures result in
      captures.(1) |> Js.Nullable.toOption

let file_extension value =
  if not (Js.String.includes ~search:"." value) then None
  else path_file_extension value |> Option.map Js.String.toLowerCase

let file_format_name value =
  path_file_extension value
  |> Option.map (fun extension ->
      extension |> Js.String.toLowerCase |> normalize_format_name)

let join_path_segments segments =
  segments |> Rrbvec.to_array |> Js.Array.join ~sep:"/"

let regex_special_characters_re =
  Js.Re.fromStringWithFlags "[\\\\[\\]{}().+*?|$^]" ~flags:"g"

let escape_regex_chars value =
  Js.String.replaceByRe ~regexp:regex_special_characters_re ~replacement:"\\$&"
    value

let replace_ignore_case value old_value new_value =
  let regexp =
    old_value |> escape_regex_chars |> Js.Re.fromStringWithFlags ~flags:"gi"
  in
  Js.String.replaceByRe ~regexp ~replacement:new_value value

let valid_edn_keyword_shape value =
  let length = String.length value in
  let rec loop index slash_seen =
    if index = length then true
    else
      match value.[index] with
      | '@' | '\\' | '`' -> false
      | '/' ->
          (not slash_seen) && index > 1
          && index < length - 1
          && loop (index + 1) true
      | _ -> loop (index + 1) slash_seen
  in
  length > 1 && Char.equal value.[0] ':' && loop 1 false

let is_valid_edn_keyword value =
  if String.equal value ":/" then true
  else
    valid_edn_keyword_shape value
    &&
      try
        match
          Melange_edn_melange.of_edn_string_all ("{" ^ value ^ " nil}")
          |> Array.of_list
        with
        | [| Melange_edn_melange.Any (Melange_edn_melange.Map _) |] -> true
        | _ -> false
      with Melange_edn_melange.Parse_error _ -> false

let re_find regexp value =
  match Js.Re.exec ~str:value regexp with
  | None -> None
  | Some result ->
      result |> Js.Re.captures
      |> Array.map Js.Nullable.toOption
      |> Rrbvec.of_array
      |> fun captures -> Some captures

let uuid_pattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
