type scope = Block | Page | Property | Tag
type opts = { content : string }

type parsed =
  | Parsed_block of opts
  | Parsed_page of opts
  | Parsed_property of opts
  | Parsed_tag of opts

type action = {
  scope : scope;
  command : Command_id.t;
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  query : string;
}

val scope_of_parsed : parsed -> scope

include Command_spec.S with type parsed := parsed and type action := action
