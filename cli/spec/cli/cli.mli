(** Top-level CLI lifecycle contract. *)
type run_input = {
  argv : string list;
  env : (string * string) list;
  cwd : Cli_primitive.path;
  stdin : string option;
}


val env_lookup : (string * string) list -> Cli_config.env

type raw_argv
type parsed_argv
type resolved_config
type built_action
type executed_action
type error
type final
type not_final

type app_context = private
                   {
                     registry : Command_registry.t;
                     defaults : Cli_config.defaults;
                   }

type ('phase, 'final) state = private
  | Raw_argv_state: run_input -> (raw_argv, not_final) state
  | Parsed_argv_state: (run_input * Cli_request.t) -> (parsed_argv, not_final) state
  | Resolved_config_state: (Cli_config.t * Cli_request.t) -> (resolved_config, not_final) state
  | Built_action_state: (Cli_config.t * Cli_action.t) -> (built_action, not_final) state
  | Executed_action_state: (Cli_config.t * Cli_result.t) -> (executed_action, final) state
  | Error_state: Error.t -> (error, final) state

val make_app_context : ?version:string -> unit -> app_context
val make_error_state: Error.t -> (error, final) state
val make_raw_argv_state: app_context -> run_input -> (raw_argv, not_final) state
val parse_args: app_context -> (raw_argv, _) state -> (parsed_argv, not_final) state Error.build_result
val resolve_config: app_context -> (parsed_argv,_) state -> (resolved_config, not_final) state Error.build_result Cli_effect.t
val build_action: app_context -> (resolved_config,_) state -> (built_action,not_final) state Error.build_result Cli_effect.t
val execute_action: app_context -> (built_action,_) state -> (executed_action, final) state Error.build_result Cli_effect.t
val format_result: app_context -> (executed_action, final) state -> string

val final_effect : (_, final) state -> int Cli_effect.t
