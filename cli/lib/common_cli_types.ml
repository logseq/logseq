let canonicalize_repo graph = Cli_config.graph_to_repo graph
let strip_repo_prefix repo = Cli_config.repo_to_graph repo

let expand_home path =
  if String.length path >= 2 && String.sub path 0 2 = "~/" then
    Filename.concat
      (Sys.getenv_opt "HOME" |> Option.value ~default:"")
      (String.sub path 2 (String.length path - 2))
  else path

let unlink_graph ?graphs_dir repo =
  match graphs_dir with
  | None -> Ok None
  | Some dir ->
      Ok (Some (Filename.concat dir (Cli_primitive.string_of_repo repo)))
