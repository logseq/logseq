(** Top-level CLI lifecycle contract. *)

type request = Cli_request.t
type config = Cli_config.t
type action = Cli_action.t
type result = Result : 'o Cli_result.t -> result

type phase =
  | Raw_argv
  | Parse_argv
  | Resolve_config
  | Build_action
  | Execute_action
  | Format_result
  | Print_output
  | Exit

type lifecycle = {
  argv : string list;
  request : request option;
  config : config option;
  action : action option;
  result : result option;
  output : string option;
  exit_code : int option;
  current_phase : phase;
}

type app = {
  registry : Command_registry.t;
  defaults : Cli_config.defaults;
}

type run_input = {
  argv : string list;
  env : (string * string) list;
  cwd : Cli_primitive.path;
  stdin : string option;
}

type run_output = {
  result : result;
  stdout : string option;
  stderr : string list;
  exit_code : int;
  lifecycle : lifecycle;
}

val make_app : ?version:string -> unit -> app
val env_lookup : (string * string) list -> Cli_config.env
val parse_request : app -> run_input -> request Error.build_result Cli_effect.t

val resolve_config :
  app -> request -> run_input -> config Error.build_result Cli_effect.t

val build_action :
  app -> request -> config -> action Error.build_result Cli_effect.t

val execute_action : app -> action -> config -> result Cli_effect.t
val format_result : app -> result -> config -> string
val run : app -> run_input -> run_output Cli_effect.t

val main_effect :
  ?argv:string array -> ?env:Cli_config.env -> unit -> int Cli_effect.t
