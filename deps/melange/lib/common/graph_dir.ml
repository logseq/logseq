let replace_all ~target ~replacement value =
  value |> Js.String.split ~sep:target |> Js.Array.join ~sep:replacement

let encode_graph_dir_name graph_name =
  graph_name |> Option.value ~default:"" |> Js.Global.encodeURIComponent
  |> replace_all ~target:"%20" ~replacement:" "
  |> replace_all ~target:"~" ~replacement:"%7E"
  |> replace_all ~target:"%" ~replacement:"~"

let decode_component value =
  try Some (Js.Global.decodeURIComponent value) with _ -> None

let decode_graph_dir_name dir_name =
  Option.bind dir_name (fun dir_name ->
      if
        Js.String.includes ~search:"++" dir_name
        || Js.String.includes ~search:"+3A+" dir_name
      then None
      else
        dir_name |> replace_all ~target:"~" ~replacement:"%" |> decode_component)

let has_legacy_encoding value =
  Js.String.includes ~search:"++" value
  || Js.String.includes ~search:"+3A+" value
  || Js.String.includes ~search:"%" value

let decode_legacy_graph_dir_name dir_name =
  Option.bind dir_name (fun dir_name ->
      if not (has_legacy_encoding dir_name) then None
      else
        let decoded =
          dir_name
          |> replace_all ~target:"+3A+" ~replacement:":"
          |> replace_all ~target:"++" ~replacement:"/"
          |> decode_component
        in
        Option.bind decoded (fun decoded ->
            if String.equal decoded "" then None else Some decoded))

let repo_to_graph_dir_key repo =
  Option.bind repo (fun repo ->
      if String.equal repo "" then None
      else Some (Config.strip_leading_db_version_prefix repo))

let repo_identity = repo_to_graph_dir_key

let same_repo left right =
  match (repo_identity left, repo_identity right) with
  | Some left, Some right -> String.equal left right
  | Some _, None | None, _ -> false

let graph_dir_key_to_encoded_dir_name graph_dir_key =
  Option.map
    (fun graph_dir_key -> encode_graph_dir_name (Some graph_dir_key))
    graph_dir_key

let repo_to_encoded_graph_dir_name repo =
  repo |> repo_to_graph_dir_key |> graph_dir_key_to_encoded_dir_name
