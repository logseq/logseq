type config_key = Ws_url | Http_base
type start_opts = { e2ee_password : string option }
type upload_opts = { e2ee_password : string option }
type download_opts = { progress : bool option; e2ee_password : string option }

type asset_download_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
}

type ensure_keys_opts = { e2ee_password : string option; upload_keys : bool }

type grant_access_opts = {
  graph_id : Cli_primitive.uuid option;
  email : Cli_primitive.email option;
}

type config_get_opts = { key : config_key option }
type config_set_opts = { key : config_key option; value : string option }
type config_unset_opts = { key : config_key option }

type parsed =
  | Parsed_status
  | Parsed_start of start_opts
  | Parsed_stop
  | Parsed_upload of upload_opts
  | Parsed_download of download_opts
  | Parsed_asset_download of asset_download_opts
  | Parsed_remote_graphs
  | Parsed_ensure_keys of ensure_keys_opts
  | Parsed_grant_access of grant_access_opts
  | Parsed_config_get of config_get_opts
  | Parsed_config_set of config_set_opts
  | Parsed_config_unset of config_unset_opts

type action =
  | Sync_status of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Sync_start of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      e2ee_password : string option;
    }
  | Sync_stop of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Sync_upload of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      e2ee_password : string option;
    }
  | Sync_download of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      progress : bool;
      progress_explicit : bool;
      e2ee_password : string option;
      allow_missing_graph : bool;
      require_missing_graph : bool;
    }
  | Sync_asset_download of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
    }
  | Sync_remote_graphs
  | Sync_ensure_keys of { e2ee_password : string option; upload_keys : bool }
  | Sync_grant_access of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      graph_id : Cli_primitive.uuid;
      email : Cli_primitive.email;
    }
  | Sync_config_get of { key : config_key }
  | Sync_config_set of { key : config_key; value : string }
  | Sync_config_unset of { key : config_key }

type remote_graph = {
  graph_id : Cli_primitive.uuid;
  graph_name : Cli_primitive.graph;
  graph_e2ee : bool;
  raw : Melange_edn.any;
}

type sync_status = {
  ws_state : Cli_primitive.keyword option;
  graph_id : Cli_primitive.uuid option;
  last_error : Melange_edn.any option;
  raw : Melange_edn.any;
}

val config_key_of_string : string -> config_key option
val string_of_config_key : config_key -> string
val authenticated : action -> bool
val required_config_keys : action -> config_key list

include Command_spec.S with type parsed := parsed and type action := action
