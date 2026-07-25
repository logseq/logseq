type export_type = Edn | Sqlite
type import_type = Import_edn | Import_sqlite
type create_opts = { enable_sync : bool; e2ee_password : string option }
type validate_opts = { fix : bool }
type backup_create_opts = { name : string option }
type backup_restore_opts = { src : string; dst : Cli_primitive.graph }
type backup_remove_opts = { src : string }

type export_opts = {
  export_type : export_type;
  file : Cli_primitive.path option;
  edn_options : Melange_edn_melange.any option;
  pretty_print : bool;
  include_timestamps : bool;
  exclude_built_in_pages : bool;
  exclude_namespaces : string Rrbvec.t;
}

type import_opts = { import_type : import_type; input : Cli_primitive.path }

type parsed =
  | Parsed_list
  | Parsed_create of create_opts
  | Parsed_switch
  | Parsed_remove
  | Parsed_validate of validate_opts
  | Parsed_info
  | Parsed_backup_list
  | Parsed_backup_create of backup_create_opts
  | Parsed_backup_restore of backup_restore_opts
  | Parsed_backup_remove of backup_remove_opts
  | Parsed_export of export_opts
  | Parsed_import of import_opts

type action =
  | Graph_list
  | Graph_create of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : create_opts;
    }
  | Graph_switch of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_remove of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_validate of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      fix : bool;
    }
  | Graph_info of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_backup_list of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
    }
  | Graph_backup_create of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      name : string option;
      backup_name : string option;
    }
  | Graph_backup_restore of {
      source_repo : Cli_primitive.repo;
      source_graph : Cli_primitive.graph;
      dst_repo : Cli_primitive.repo;
      dst_graph : Cli_primitive.graph;
      src : string;
      dst : string;
    }
  | Graph_backup_remove of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      src : string;
    }
  | Graph_export of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : export_opts;
    }
  | Graph_import of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : import_opts;
      require_missing_graph : bool;
    }

val normalize_export_type : string -> export_type option
val normalize_import_type : string -> import_type option
val string_of_import_type : import_type -> string

include Command_spec.S with type parsed := parsed and type action := action

val repo : action -> Cli_primitive.repo option
val graph : action -> Cli_primitive.graph option
