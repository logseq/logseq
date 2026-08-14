type parsed =
  | Parsed_list
  | Parsed_cleanup
  | Parsed_start
  | Parsed_stop
  | Parsed_restart

type action =
  | Server_list
  | Server_cleanup
  | Server_start of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Server_stop of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Server_restart of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }

include Command_spec.S with type parsed := parsed and type action := action
