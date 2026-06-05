type server_status = Starting | Ready | Error | Unknown

type server = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph option;
  pid : Cli_primitive.pid;
  host : string;
  port : Cli_primitive.port;
  base_url : Cli_primitive.url;
  status : server_status;
  revision : string option;
  root_dir : Cli_primitive.path option;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
  raw : Edn_ocaml.any option;
}

type start_result = {
  repo : Cli_primitive.repo;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
}

type stop_result = { repo : Cli_primitive.repo }
type revision_mismatch = { cli_revision : string; servers : server list }

type cleanup_result = {
  cli_revision : string;
  checked : int;
  mismatched : int;
  eligible : int;
  skipped_owner : int;
  killed : server list;
  failed : (server * Error.t) list;
}

val resolve_root_dir : Cli_config.t -> Cli_primitive.path
val graphs_dir : Cli_config.t -> Cli_primitive.path

val lock_path :
  root_dir:Cli_primitive.path -> Cli_primitive.repo -> Cli_primitive.path

val db_worker_runtime_script_path : unit -> Cli_primitive.path

val ensure_server :
  Cli_config.t ->
  Cli_primitive.repo ->
  create_empty_db:bool ->
  Transport.invoke_config Error.build_result Cli_effect.t

val start_server :
  Cli_config.t ->
  Cli_primitive.repo ->
  create_empty_db:bool ->
  start_result Error.build_result Cli_effect.t

val stop_server :
  Cli_config.t ->
  Cli_primitive.repo ->
  stop_result Error.build_result Cli_effect.t

val restart_server :
  Cli_config.t ->
  Cli_primitive.repo ->
  start_result Error.build_result Cli_effect.t

val list_servers : Cli_config.t -> server list Cli_effect.t
val list_graph_items : Cli_config.t -> Graph_types.graph_item list
val list_graphs : Cli_config.t -> Cli_primitive.graph list

val compute_revision_mismatches :
  cli_revision:string -> server list -> revision_mismatch option

val cleanup_revision_mismatched_servers :
  Cli_config.t ->
  cli_revision:string ->
  cleanup_result Error.build_result Cli_effect.t
