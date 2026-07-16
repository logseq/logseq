type order = Asc | Desc

type common_opts = {
  fields : string Rrbvec.t option;
  limit : int option;
  offset : int option;
  sort : string option;
  order : order option;
}

type page_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  include_journal : bool option;
  journal_only : bool;
  include_hidden : bool;
  updated_after : Time.date option;
  created_after : Time.date option;
}

type tag_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  with_properties : bool;
  with_extends : bool;
}

type property_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  with_classes : bool;
  with_type : bool;
}

type task_opts = {
  common : common_opts;
  status : string option;
  priority : string option;
  content : string option;
}

type node_opts = {
  common : common_opts;
  tags : string Rrbvec.t;
  properties : string Rrbvec.t;
}

type asset_opts = { common : common_opts }

type parsed =
  | Parsed_page of page_opts
  | Parsed_tag of tag_opts
  | Parsed_property of property_opts
  | Parsed_task of task_opts
  | Parsed_node of node_opts
  | Parsed_asset of asset_opts

type kind = Page | Tag | Property | Task | Node | Asset

type action = {
  kind : kind;
  command : Command_id.t;
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  options : Melange_edn_melange.any;
}

type list_result = { items : Entity.t Rrbvec.t }

val order_of_string : string -> order option
val string_of_order : order -> string
val kind_of_parsed : parsed -> kind
val normalize_options : parsed -> parsed Error.build_result
val apply_offset_limit : common_opts -> Entity.t Rrbvec.t -> Entity.t Rrbvec.t

include Command_spec.S with type parsed := parsed and type action := action
