type selector =
  | By_id of Cli_primitive.db_id
  | By_uuid of Cli_primitive.uuid
  | By_ident of Cli_primitive.keyword

type opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  ident : Cli_primitive.keyword option;
}

type parsed = Parsed_pull of opts

type action =
  | Debug_pull of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      lookup : selector;
      selector : Edn_ocaml.any;
    }

val parse_ident_option : string -> Cli_primitive.keyword Error.build_result
val resolve_selector : opts -> selector Error.build_result

include Command_spec.S with type parsed := parsed and type action := action
