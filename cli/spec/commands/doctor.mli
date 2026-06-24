type opts = { dev_script : bool }
type parsed = Parsed_doctor of opts
type action = Doctor of { script_path : Cli_primitive.path option }
type check_status = Ok | Warning | Error

type check = {
  id : Cli_primitive.keyword;
  status : check_status;
  code : Error.code option;
  message : string;
  path : Cli_primitive.path option;
  servers : Melange_edn.any list;
  raw : Melange_edn.any option;
}

type report = { status : check_status; checks : check list }

val check_db_worker_script : action -> check
val check_root_dir : Cli_config.t -> check
val check_running_servers : Cli_config.t -> check Cli_effect.t

include Command_spec.S with type parsed := parsed and type action := action
