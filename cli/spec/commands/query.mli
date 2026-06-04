type input_spec = {
  name : string;
  optional : bool;
  default : Edn_ocaml.any option;
}

type source = Built_in | Custom

type query_entry = {
  name : string;
  source : source;
  doc : string option;
  inputs : input_spec list;
  query : Edn_ocaml.any;
}

type opts = {
  query_edn : string option;
  name : string option;
  inputs_edn : string option;
}

type parsed = Parsed_run of opts | Parsed_list

type action =
  | Run of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      query : Edn_ocaml.any;
      inputs : Edn_ocaml.any list;
      name : string option;
    }
  | List

val built_in_queries : query_entry list
val normalize_query_name : string -> string option
val list_queries : Cli_config.t -> query_entry list
val find_query : Cli_config.t -> string -> query_entry option
val validate_query : Edn_ocaml.any -> Edn_ocaml.any Error.build_result

val normalize_inputs :
  query_entry option ->
  Edn_ocaml.any list ->
  Edn_ocaml.any list Error.build_result

include Command_spec.S with type parsed := parsed and type action := action
