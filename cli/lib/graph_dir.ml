external encode_uri_component : string -> string = "encodeURIComponent"
external decode_uri_component : string -> string = "decodeURIComponent"

let replace_all ~needle ~replacement text =
  let needle_len = String.length needle in
  if needle_len = 0 then invalid_arg "needle must not be empty";
  let text_len = String.length text in
  let buffer = Buffer.create text_len in
  let rec loop index =
    if index >= text_len then Buffer.contents buffer
    else if
      index + needle_len <= text_len
      && String.sub text index needle_len = needle
    then (
      Buffer.add_string buffer replacement;
      loop (index + needle_len))
    else (
      Buffer.add_char buffer text.[index];
      loop (index + 1))
  in
  loop 0

let encode_graph_dir_name graph_name =
  graph_name |> encode_uri_component
  |> replace_all ~needle:"%20" ~replacement:" "
  |> replace_all ~needle:"~" ~replacement:"%7E"
  |> replace_all ~needle:"%" ~replacement:"~"

let graph_dir_name_of_repo repo =
  Cli_config.repo_to_graph repo
  |> Cli_primitive.string_of_graph |> encode_graph_dir_name

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  loop 0

let decode_percent_graph_dir_name dir_name =
  try Some (decode_uri_component dir_name) with _ -> None

let decode_graph_dir_name dir_name =
  if
    contains_substring ~needle:"++" dir_name
    || contains_substring ~needle:"+3A+" dir_name
  then None
  else
    dir_name
    |> replace_all ~needle:"~" ~replacement:"%"
    |> decode_percent_graph_dir_name

let decode_legacy_graph_dir_name dir_name =
  if
    not
      (contains_substring ~needle:"++" dir_name
      || contains_substring ~needle:"+3A+" dir_name
      || contains_substring ~needle:"%" dir_name)
  then None
  else
    dir_name
    |> replace_all ~needle:"+3A+" ~replacement:":"
    |> replace_all ~needle:"++" ~replacement:"/"
    |> decode_percent_graph_dir_name
    |> fun graph_name ->
    Option.bind graph_name (fun graph_name ->
        if graph_name = "" then None else Some graph_name)

let canonical_graph_name_of_dir dir_name =
  match decode_graph_dir_name dir_name with
  | Some graph_name
    when graph_name <> "" && encode_graph_dir_name graph_name = dir_name ->
      Some graph_name
  | _ -> None
