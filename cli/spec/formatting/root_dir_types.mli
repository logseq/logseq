val default_root_dir : unit -> Cli_primitive.path
val normalize_root_dir : Cli_primitive.path option -> Cli_primitive.path
val graphs_dir : Cli_primitive.path -> Cli_primitive.path

val ensure_root_dir :
  Cli_primitive.path option -> Cli_primitive.path Error.build_result
