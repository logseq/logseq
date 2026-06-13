(** Shared command lifecycle signature for CLI command families. *)

module type S = sig
  type parsed
  type action

  val command_id : parsed -> Command_id.t
  val validate_parsed : parsed -> unit Error.build_result

  val build :
    ?registry:Command_registry.t ->
    Cli_config.t ->
    Global_opts.t ->
    parsed ->
    action Error.build_result

  val execute :
    action -> Cli_config.t -> Cli_result.t Cli_effect.t

  val metadata : unit -> Command_registry.command_meta list
end
