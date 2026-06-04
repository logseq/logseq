val unlink_graph :
  ?graphs_dir:Cli_primitive.path ->
  Cli_primitive.repo ->
  Cli_primitive.path option Error.build_result

val canonicalize_repo : Cli_primitive.graph -> Cli_primitive.repo
val strip_repo_prefix : Cli_primitive.repo -> Cli_primitive.graph
val expand_home : Cli_primitive.path -> Cli_primitive.path
