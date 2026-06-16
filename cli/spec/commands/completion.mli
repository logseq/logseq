type opts = { shell : Cli_primitive.shell option }
type parsed = Parsed_completion of opts

type action =
  | Completion of {
      shell : Cli_primitive.shell;
      registry : Command_registry.t option;
    }

val generate : Cli_primitive.shell -> Command_registry.t -> string

include Command_spec.S with type parsed := parsed and type action := action
