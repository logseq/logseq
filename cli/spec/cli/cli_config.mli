type env = string -> string option

type defaults = {
  timeout_span : Time.span;
  login_timeout_span : Time.span;
  logout_timeout_span : Time.span;
  list_title_max_display_width : int;
  root_dir : Cli_primitive.path;
  ws_url : Cli_primitive.url;
  http_base : Cli_primitive.url;
}

type t = {
  graph : Cli_primitive.graph option;
  repo : Cli_primitive.repo option;
  root_dir : Cli_primitive.path;
  config_path : Cli_primitive.path;
  timeout_span : Time.span;
  login_timeout_span : Time.span;
  logout_timeout_span : Time.span;
  list_title_max_display_width : int;
  output_format : Output.Mode.packed option;
  verbose : bool;
  profile : bool;
  ws_url : Cli_primitive.url option;
  http_base : Cli_primitive.url option;
  auth_path : Cli_primitive.path option;
  id_token : string option;
  access_token : string option;
  refresh_token : string option;
  base_url : Cli_primitive.url option;
  owner_source : Cli_primitive.owner_source;
  project_dir : Cli_primitive.path option;
  raw_file_config : Melange_edn.any option;
  profile_session : Profile_types.session option;
}

type source = Defaults | Env | File of Cli_primitive.path | Argv
type resolved = { config : t; sources : source list }

val default_root_dir : unit -> Cli_primitive.path
val default_config_path : Cli_primitive.path -> Cli_primitive.path
val defaults : unit -> defaults

val read_config_file :
  Cli_primitive.path -> Melange_edn.any option Error.build_result

val env_config : env -> Melange_edn.map Melange_edn.t
val sanitize_file_config : Melange_edn.any -> Melange_edn.any

val resolve :
  defaults:defaults ->
  env:env ->
  Global_opts.t ->
  resolved Error.build_result Cli_effect.t

val update_config :
  t ->
  Melange_edn.any ->
  Melange_edn.map Melange_edn.t Error.build_result Cli_effect.t

val graph_to_repo : Cli_primitive.graph -> Cli_primitive.repo
val repo_to_graph : Cli_primitive.repo -> Cli_primitive.graph
val pick_graph : t -> Global_opts.t -> Cli_primitive.graph option
val pick_repo : t -> Global_opts.t -> Cli_primitive.repo option
