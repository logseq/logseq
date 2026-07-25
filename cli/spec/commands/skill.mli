type install_opts = { global : bool }
type parsed = Parsed_show | Parsed_install of install_opts

type action =
  | Skill_show of { source_path : Cli_primitive.path option }
  | Skill_install of {
      global : bool;
      source_path : Cli_primitive.path option;
      destination_dir : Cli_primitive.path option;
      destination_file : Cli_primitive.path option;
    }

type install_target = {
  scope : Cli_primitive.keyword;
  path : Cli_primitive.path;
  update_command : string;
}

type update_status = {
  installed : bool;
  outdated : bool;
  outdated_targets : install_target Rrbvec.t;
  error : Error.t option;
}

val resolve_install_target :
  global:bool ->
  cwd:Cli_primitive.path ->
  home_dir:Cli_primitive.path option ->
  install_target Error.build_result

val installed_skill_targets :
  cwd:Cli_primitive.path ->
  home_dir:Cli_primitive.path option ->
  install_target Rrbvec.t

include Command_spec.S with type parsed := parsed and type action := action
