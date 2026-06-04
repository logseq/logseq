type mode = Create | Update | Page

type block_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  content : string option;
  blocks_edn : string option;
  blocks_file : Cli_primitive.path option;
  update_tags_edn : string option;
  update_properties_edn : string option;
  remove_tags_edn : string option;
  remove_properties_edn : string option;
}

type page_opts = {
  id : Cli_primitive.db_id option;
  page : string option;
  update_tags_edn : string option;
  update_properties_edn : string option;
  remove_tags_edn : string option;
  remove_properties_edn : string option;
}

type task_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  page : string option;
  content : string option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  status : string option;
  priority : string option;
  scheduled : string option;
  deadline : string option;
  no_status : bool;
  no_priority : bool;
  no_scheduled : bool;
  no_deadline : bool;
}

type asset_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  path : Cli_primitive.path option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  content : string option;
}

type tag_opts = { id : Cli_primitive.db_id option; name : string option }

type property_opts = {
  id : Cli_primitive.db_id option;
  name : string option;
  kind : Property.kind option;
  cardinality : Property.cardinality option;
  hide : bool option;
  public : bool option;
}

type parsed =
  | Parsed_block of block_opts
  | Parsed_page of page_opts
  | Parsed_task of task_opts
  | Parsed_asset of asset_opts
  | Parsed_tag of tag_opts
  | Parsed_property of property_opts

type block_target =
  | Target_id of Cli_primitive.db_id
  | Target_uuid of Cli_primitive.uuid
  | Target_page of string

type block_source =
  | Source_id of Cli_primitive.db_id
  | Source_uuid of Cli_primitive.uuid

type block_create = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target : block_target;
  pos : Block.position;
  status : Cli_primitive.keyword option;
  tags : Selector.tag list;
  properties : Property.assignment list;
  blocks : Block.t list;
  update_plan : Property.update_plan;
}

type block_update = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  source : block_source;
  target : block_target option;
  pos : Block.position option;
  update_tags : Selector.tag list;
  update_properties : Property.assignment list;
  remove_tags : Selector.tag list;
  remove_properties : Property.key list;
  content : string option;
  source_label : string option;
  target_label : string option;
}

type block_action =
  | Block_create of block_create
  | Block_update of block_update

type action =
  | Upsert_block of block_action
  | Upsert_page of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      page : string option;
      plan : Property.update_plan;
    }
  | Upsert_task of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
      page : string option;
      content : string option;
      update_properties : Property.assignment list;
      clear_properties : Property.key list;
      status_input : string option;
    }
  | Upsert_asset of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
      path : Cli_primitive.path option;
      content : string option;
      create_action : block_create option;
    }
  | Upsert_tag of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      name : string option;
    }
  | Upsert_property of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      name : string option;
      schema : Property.schema;
    }

val update_mode : block_opts -> bool
val invalid_options : parsed -> string option

include Command_spec.S with type parsed := parsed and type action := action

val repo : action -> Cli_primitive.repo
val graph : action -> Cli_primitive.graph
