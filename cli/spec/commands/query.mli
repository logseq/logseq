type input_spec = {
  name : string;
  optional : bool;
  default : Melange_edn_melange.any option;
}

type source = Built_in | Custom

type query_entry = {
  name : string;
  source : source;
  doc : string option;
  inputs : input_spec list;
  query : Melange_edn_melange.any;
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
      query : Melange_edn_melange.any;
      inputs : Melange_edn_melange.any list;
      name : string option;
    }
  | List

val built_in_queries : query_entry list
val normalize_query_name : string -> string option
val list_queries : Cli_config.t -> query_entry list
val find_query : Cli_config.t -> string -> query_entry option
val validate_query : Melange_edn_melange.any -> Melange_edn_melange.any Error.build_result

val normalize_inputs :
  query_entry option ->
  Melange_edn_melange.any list ->
  Melange_edn_melange.any list Error.build_result

include Command_spec.S with type parsed := parsed and type action := action
