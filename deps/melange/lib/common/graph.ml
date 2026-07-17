let path_at_or_under path dir =
  String.equal path dir || String.starts_with ~prefix:(dir ^ "/") path

let ignored_directories =
  [|
    "logseq/.recycle"; "logseq/bak"; "logseq/version-files"; "mirror/markdown";
  |]

let ignored_metadata =
  [| "logseq/graphs-txid.edn"; "logseq/pages-metadata.edn" |]

let hidden_path_segment segment =
  String.length segment >= 2
  && Char.equal segment.[0] '.'
  && not (Char.equal segment.[1] '.')

let is_ignored_path ~dir ~path =
  let dir = Path.path_normalize dir in
  let path = Path.path_normalize path in
  let relative_path =
    match Path.trim_dir_prefix dir path with
    | Some relative_path -> relative_path
    | None -> invalid_arg "path must be at or under the graph directory"
  in
  String.starts_with ~prefix:"." relative_path
  || Array.exists (path_at_or_under relative_path) ignored_directories
  || Array.exists (String.equal relative_path) ignored_metadata
  || Js.String.includes ~search:"/node_modules/" relative_path
  || String.ends_with ~suffix:".DS_Store" relative_path
  || relative_path |> Js.String.split ~sep:"/"
     |> Array.exists hidden_path_segment

let recognized_extension = function
  | "org" | "markdown" | "md" | "edn" | "json" | "js" | "css" -> true
  | _ -> false

let is_allowed_file_path path =
  let basename = path |> Path.path_normalize |> Path.basename in
  match String.rindex_opt basename '.' with
  | Some index when index > 0 ->
      String.sub basename (index + 1) (String.length basename - index - 1)
      |> recognized_extension
  | Some _ | None -> false

let is_visible_filesystem_entry ~name ~is_symbolic_link =
  (not is_symbolic_link) && not (String.starts_with ~prefix:"." name)

let default_graphs_dir ~environment_value =
  Option.value environment_value ~default:Config.default_graphs_dir

let home_relative_suffix path =
  if String.starts_with ~prefix:"~" path then
    Some (String.sub path 1 (String.length path - 1))
  else None

let normalize_filesystem_path ~win32 path =
  if win32 then path |> Js.String.split ~sep:"\\" |> Js.Array.join ~sep:"/"
  else path

let canonical_db_graph_repos directory_names =
  Rrbvec.fold_left
    (fun repos directory_name ->
      if String.equal directory_name Config.unlinked_graphs_dir then repos
      else
        directory_name |> Option.some |> Graph_dir.decode_graph_dir_name
        |> fun decoded ->
        Option.bind decoded (fun decoded ->
            if String.starts_with ~prefix:Config.file_version_prefix decoded
            then None
            else Config.canonicalize_db_version_repo decoded)
        |> Option.fold ~none:repos ~some:(fun repo ->
            if Rrbvec.mem repo repos then repos else Rrbvec.push_back repos repo))
    Rrbvec.empty directory_names
