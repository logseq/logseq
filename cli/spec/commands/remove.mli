type block_opts = { id_raw : string option; uuid : Cli_primitive.uuid option }
type page_opts = { id : Cli_primitive.db_id option; page : string option }

type named_entity_opts = {
  id : Cli_primitive.db_id option;
  name : string option;
}

type parsed =
  | Parsed_block of block_opts
  | Parsed_page of page_opts
  | Parsed_tag of named_entity_opts
  | Parsed_property of named_entity_opts

type action =
  | Remove_block of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      ids : Cli_primitive.db_id list;
      multi_id : bool;
      uuid : Cli_primitive.uuid option;
    }
  | Remove_page of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      page : string option;
    }
  | Remove_tag of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      name : string option;
    }
  | Remove_property of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      name : string option;
    }

val invalid_options : parsed -> string option

include Command_spec.S with type parsed := parsed and type action := action
