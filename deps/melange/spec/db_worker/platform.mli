module type S = sig
  type value
  type binary
  type transferables
  type sqlite_module
  type storage_pool
  type sqlite_db
  type websocket
  type timer_id

  module Env : sig
    type runtime = Runtime_browser | Runtime_node

    type owner_source =
      | Owner_browser
      | Owner_electron
      | Owner_capacitor
      | Owner_cli
      | Owner_unknown

    type key =
      | Publishing
      | Runtime
      | Root_dir
      | Owner_source
      | Recreate_lock_fn

    type flag_value =
      | Env_bool of bool
      | Env_runtime of runtime
      | Env_owner_source of owner_source
      | Env_string of string
      | Env_callback of (unit -> unit)
      | Env_value of value

    val publishing : bool
    val runtime : runtime
    val root_dir : string option
    val owner_source : owner_source
    val recreate_lock_fn : (unit -> unit) option
  end

  module Storage : sig
    type asset_stat = {
      size : int64;
      type_ : string option;
      is_file : bool option;
    }

    val install_opfs_pool : sqlite_module -> string -> storage_pool Js.Promise.t
    val list_graphs : unit -> string list Js.Promise.t
    val db_exists : string -> bool Js.Promise.t
    val resolve_db_path : (string -> storage_pool -> string -> string) option
    val export_file : storage_pool -> string -> binary Js.Promise.t
    val import_db : storage_pool -> string -> binary -> unit Js.Promise.t
    val remove_vfs : storage_pool -> unit Js.Promise.t
    val read_text : string -> string Js.Promise.t
    val write_text : string -> string -> unit Js.Promise.t
    val write_text_atomic : (string -> string -> unit Js.Promise.t) option
    val delete_file : (string -> unit Js.Promise.t) option
    val mirror_read_text : (string -> string Js.Promise.t) option
    val asset_read_bytes : string -> string -> binary Js.Promise.t
    val asset_write_bytes : string -> string -> binary -> unit Js.Promise.t
    val asset_stat : string -> string -> asset_stat option Js.Promise.t
    val asset_delete : (string -> string -> unit Js.Promise.t) option
    val transfer : (value -> transferables -> value) option
  end

  module Kv : sig
    val get : string -> value option Js.Promise.t
    val set : string -> value option -> unit Js.Promise.t
  end

  module Broadcast : sig
    val post_message : string -> value -> unit
  end

  module Websocket : sig
    val connect : string -> websocket
  end

  module Sqlite : sig
    type open_options = {
      sqlite : sqlite_module option;
      pool : storage_pool option;
      path : string;
      mode : string option;
    }

    type row_mode = Row_array | Row_object
    type return_value = Result_rows

    type options = {
      sql : string;
      bind : value option;
      row_mode : row_mode option;
      return_value : return_value option;
    }

    type input = Sql_string of string | Sql_options of options

    val init : unit -> sqlite_module option Js.Promise.t
    val open_db : open_options -> sqlite_db Js.Promise.t
    val close_db : sqlite_db -> unit
    val exec : sqlite_db -> input -> value
    val transaction : sqlite_db -> (sqlite_db -> value) -> value
    val backup_db : (sqlite_db -> string -> unit Js.Promise.t) option
  end

  module Crypto : sig
    val save_secret_text : string -> string -> unit Js.Promise.t
    val read_secret_text : string -> string option Js.Promise.t
    val delete_secret_text : string -> unit Js.Promise.t
  end

  module Timers : sig
    val set_interval : (unit -> unit) -> int -> timer_id
  end

  module Vector : sig
    type index

    type document = {
      id : string;
      page : string;
      embedding : float list;
      vector_title : string option;
    }

    type result = {
      id : string;
      page : string option;
      title : string option;
      vector_title : string option;
      vector_score : float;
    }

    type metadata = value

    module Index : sig
      val query :
        index -> float list -> int option -> string option -> result list

      val upsert : index -> document list -> unit
      val delete : index -> string list -> unit
      val truncate : index -> unit
      val metadata : index -> (unit -> metadata option) option
      val set_metadata : index -> (metadata -> unit) option
      val close : index -> (unit -> unit) option
    end

    type open_options = { path : string; dimension : int }

    val open_index : open_options -> index Js.Promise.t
  end

  module Embedding : sig
    val model_id : string
    val dimension : int
    val embed_texts : string list -> float list list Js.Promise.t
  end
end

module Browser : S with type value = Js.Json.t

module Node : sig
  include S with type value = Js.Json.t

  val configure :
    ?root_dir:string ->
    ?owner_source:string ->
    ?event_fn:(string -> value -> unit) ->
    ?write_guard_fn:(unit -> unit Js.Promise.t) ->
    ?recreate_lock_fn:(unit -> unit) ->
    ?embedding_endpoint:string ->
    ?embedding_model_id:string ->
    unit ->
    unit

  val current_owner_source : unit -> Env.owner_source
  val current_root_dir_option : unit -> string option
  val current_recreate_lock_fn : unit -> (unit -> unit) option
  val current_embedding_model_id : unit -> string
  val embedding_dimension_for_model : string -> int
end
