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
  graph_name |> Js.Global.encodeURIComponent
  |> replace_all ~needle:"%20" ~replacement:" "
  |> replace_all ~needle:"~" ~replacement:"%7E"
  |> replace_all ~needle:"%" ~replacement:"~"

let graph_dir_name_of_repo repo =
  Cli_config.repo_to_graph repo
  |> Cli_primitive.string_of_graph |> encode_graph_dir_name

let canonical_graph_name_of_dir dir_name =
  try
    let graph_name =
      dir_name
      |> replace_all ~needle:"~" ~replacement:"%"
      |> Js.Global.decodeURIComponent
    in
    if graph_name <> "" && encode_graph_dir_name graph_name = dir_name then
      Some graph_name
    else None
  with _ -> None
