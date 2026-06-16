type target =
  | By_id of Cli_primitive.db_id
  | By_ids of Cli_primitive.db_id list
  | By_uuid of Cli_primitive.uuid
  | By_page of string

type opts = {
  id_raw : string option;
  uuid : Cli_primitive.uuid option;
  page : string option;
  page_hierarchy : bool;
  linked_references : bool option;
  ref_id_footer : bool option;
  level : int option;
  stdin_id : string option;
}

type parsed = Parsed_show of opts

type action = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target : target;
  multi_id : bool;
  linked_references : bool;
  ref_id_footer : bool;
  page_hierarchy : bool;
  level : int option;
}

type linked_references = { count : int; blocks : Block.t list }

type tree_data = {
  root : Block.t;
  linked_references : linked_references option;
  referenced_uuids : Cli_primitive.uuid list;
  uuid_to_entity : (Cli_primitive.uuid * Entity.t) list;
  breadcrumb_line : string option;
}

val normalize_stdin_id : string option -> string option
val resolve_target : opts -> target Error.build_result
val invalid_options : opts -> string option

include Command_spec.S with type parsed := parsed and type action := action
