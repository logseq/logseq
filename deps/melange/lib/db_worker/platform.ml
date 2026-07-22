module Transit = Transit_melange.Transit

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

let rejected message = Js.Promise.reject (Failure message)

let unsupported section name =
  rejected ("platform " ^ section ^ "/" ^ name ^ " unsupported")

let includes text needle =
  let text_len = String.length text in
  let needle_len = String.length needle in
  let rec loop index =
    if needle_len = 0 then true
    else if index + needle_len > text_len then false
    else if String.sub text index needle_len = needle then true
    else loop (index + 1)
  in
  loop 0

let starts_with text prefix =
  let text_len = String.length text in
  let prefix_len = String.length prefix in
  text_len >= prefix_len && String.sub text 0 prefix_len = prefix

module Browser = struct
  type value = Js.Json.t
  type binary = Js.Json.t
  type transferables = Js.Json.t
  type sqlite_module
  type storage_pool
  type sqlite_db
  type websocket
  type timer_id = Js.Global.intervalId

  module Location = struct
    type global
    type t

    external global_this : global = "globalThis"

    external current : global -> t option = "location"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

    external href : t -> string = "href" [@@mel.get]
    external search : t -> string = "search" [@@mel.get]
  end

  module Search_params = struct
    type t

    external make : string -> t = "URLSearchParams" [@@mel.new]

    external get : t -> string -> string option = "get"
    [@@mel.send] [@@mel.return { null_to_opt }]
  end

  module Env = struct
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

    let location = Location.current Location.global_this

    let location_search =
      match location with
      | None -> ""
      | Some location -> Location.search location

    let location_href =
      match location with None -> "" | Some location -> Location.href location

    let search_param_true name =
      match Search_params.get (Search_params.make location_search) name with
      | Some ("true" | "1") -> true
      | _ -> false

    let publishing = includes location_href "publishing=true"
    let runtime = Runtime_browser

    let owner_source =
      if search_param_true "capacitor" then Owner_capacitor
      else if search_param_true "electron" then Owner_electron
      else Owner_browser

    let root_dir = None
    let recreate_lock_fn = None
  end

  module Storage = struct
    type asset_stat = {
      size : int64;
      type_ : string option;
      is_file : bool option;
    }

    type pool_options

    external pool_options :
      name:string -> initialCapacity:int -> unit -> pool_options = ""
    [@@mel.obj]

    external install_opfs_pool_ :
      sqlite_module -> pool_options -> storage_pool Js.Promise.t
      = "installOpfsSAHPoolVfs"
    [@@mel.send]

    external export_file : storage_pool -> string -> binary Js.Promise.t
      = "exportFile"
    [@@mel.send]

    external import_db : storage_pool -> string -> binary -> unit Js.Promise.t
      = "importDb"
    [@@mel.send]

    external remove_vfs_ : storage_pool -> unit = "removeVfs" [@@mel.send]

    let install_opfs_pool sqlite pool_name =
      install_opfs_pool_ sqlite
        (pool_options ~name:pool_name ~initialCapacity:20 ())

    let replace_all text pattern replacement =
      let pattern_len = String.length pattern in
      let text_len = String.length text in
      if pattern_len = 0 then text
      else
        let rec loop index acc =
          if index >= text_len then String.concat "" (List.rev acc)
          else if
            index + pattern_len <= text_len
            && String.sub text index pattern_len = pattern
          then loop (index + pattern_len) (replacement :: acc)
          else loop (index + 1) (String.sub text index 1 :: acc)
        in
        loop 0 []

    let strip_db_prefix repo =
      let prefix = "logseq_db_" in
      if starts_with repo prefix then
        String.sub repo (String.length prefix)
          (String.length repo - String.length prefix)
      else repo

    let pool_name graph =
      "logseq-pool-"
      ^ (strip_db_prefix graph
        |> String.map (function '/' | '\\' | ':' -> '_' | char -> char))

    let list_graphs () =
      let pool_dir_prefix = ".logseq-pool-" in
      let pool_dir_prefix_len = String.length pool_dir_prefix in
      Opfs.list_directory_names ()
      |> Js.Promise.then_ (fun names ->
          names
          |> List.filter (fun name -> starts_with name pool_dir_prefix)
          |> List.map (fun name ->
              String.sub name pool_dir_prefix_len
                (String.length name - pool_dir_prefix_len)
              |> fun graph ->
              replace_all graph "+3A+" ":" |> fun graph ->
              replace_all graph "++" "/")
          |> Js.Promise.resolve)

    let db_exists graph = Opfs.directory_exists ("." ^ pool_name graph)
    let resolve_db_path = Some (fun _repo _pool path -> path)

    let remove_vfs pool =
      remove_vfs_ pool;
      Js.Promise.resolve ()

    let read_text = Opfs.read_text
    let write_text = Opfs.write_text

    let write_text_atomic =
      Some
        (fun _path _text -> unsupported "browser-storage" "write-text-atomic")

    let delete_file =
      Some (fun _path -> unsupported "browser-storage" "delete-file")

    let mirror_read_text =
      Some (fun _path -> unsupported "browser-storage" "mirror-read-text")

    module Pfs = struct
      type global
      type window
      type t
      type stat

      external global_this : global = "globalThis"

      external window : global -> window option = "window"
      [@@mel.get] [@@mel.return { undefined_to_opt }]

      external window_pfs : window -> t option = "pfs"
      [@@mel.get] [@@mel.return { undefined_to_opt }]

      external global_pfs : global -> t option = "pfs"
      [@@mel.get] [@@mel.return { undefined_to_opt }]

      external read_file : t -> string -> binary Js.Promise.t = "readFile"
      [@@mel.send]

      external write_file : t -> string -> binary -> unit Js.Promise.t
        = "writeFile"
      [@@mel.send]

      external stat : t -> string -> stat Js.Promise.t = "stat" [@@mel.send]
      external mkdir : t -> string -> unit Js.Promise.t = "mkdir" [@@mel.send]
      external unlink : t -> string -> unit Js.Promise.t = "unlink" [@@mel.send]
      external size : stat -> int = "size" [@@mel.get]

      external type_ : stat -> string option = "type"
      [@@mel.get] [@@mel.return { undefined_to_opt }]

      let current () =
        match window global_this with
        | Some window -> (
            match window_pfs window with
            | Some pfs -> pfs
            | None -> (
                match global_pfs global_this with
                | Some pfs -> pfs
                | None -> failwith "browser pfs is not available"))
        | None -> (
            match global_pfs global_this with
            | Some pfs -> pfs
            | None -> failwith "browser pfs is not available")
    end

    let path_join left right =
      if left = "" then right
      else if right = "" then left
      else if left.[String.length left - 1] = '/' then left ^ right
      else left ^ "/" ^ right

    let parent path =
      match String.rindex_opt path '/' with
      | None -> None
      | Some 0 -> Some "/"
      | Some index -> Some (String.sub path 0 index)

    let graph_assets_dir repo =
      "memory:///" ^ strip_db_prefix repo |> fun root -> path_join root "assets"

    let asset_path repo file_name = path_join (graph_assets_dir repo) file_name

    let rec ensure_pfs_dir pfs dir =
      match dir with
      | None
      | Some ""
      | Some "/"
      | Some "."
      | Some "memory:"
      | Some "memory://"
      | Some "memory:///" ->
          Js.Promise.resolve ()
      | Some dir ->
          Pfs.stat pfs dir
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
          |> Js.Promise.catch (fun _ ->
              ensure_pfs_dir pfs (parent dir)
              |> Js.Promise.then_ (fun () -> Pfs.mkdir pfs dir))

    let asset_read_bytes repo file_name =
      Pfs.read_file (Pfs.current ()) (asset_path repo file_name)

    let asset_write_bytes repo file_name payload =
      let pfs = Pfs.current () in
      let file_path = asset_path repo file_name in
      ensure_pfs_dir pfs (parent file_path)
      |> Js.Promise.then_ (fun () -> Pfs.write_file pfs file_path payload)

    let asset_stat repo file_name =
      Pfs.stat (Pfs.current ()) (asset_path repo file_name)
      |> Js.Promise.then_ (fun stat ->
          Js.Promise.resolve
            (Some
               {
                 size = Int64.of_int (Pfs.size stat);
                 type_ = Pfs.type_ stat;
                 is_file = None;
               }))
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)

    let asset_delete =
      Some
        (fun repo file_name ->
          Pfs.unlink (Pfs.current ()) (asset_path repo file_name)
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))

    external transfer_ : value -> transferables -> value = "transfer"
    [@@mel.module "comlink"]

    let transfer = Some transfer_
  end

  module Kv = struct
    let get = Idb.get_item

    let set key = function
      | Some value -> Idb.set_item key value
      | None -> Idb.remove_item key
  end

  module Broadcast = struct
    external post_message_string : string -> unit = "postMessage"

    let post_message type_ payload =
      Transit.Json.Array
        [
          Transit.Json.String type_;
          payload |> Melange_edn_melange.of_json |> Transit.Json.of_edn;
        ]
      |> Transit.Json.to_string |> post_message_string
  end

  module Websocket = struct
    external connect : string -> websocket = "WebSocket" [@@mel.new]
  end

  module Sqlite = struct
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
    type init_options
    type oo1
    type db_constructor

    external init_options : unit -> init_options = "" [@@mel.obj]

    external sqlite3_init_module : init_options -> sqlite_module Js.Promise.t
      = "default"
    [@@mel.module "@sqlite.org/sqlite-wasm"]

    external opfs_sah_pool_db : storage_pool -> db_constructor = "OpfsSAHPoolDb"
    [@@mel.get]

    external oo1 : sqlite_module -> oo1 = "oo1" [@@mel.get]
    external db_constructor : oo1 -> db_constructor = "DB" [@@mel.get]

    external reflect_construct : db_constructor -> string array -> sqlite_db
      = "construct"
    [@@mel.scope "Reflect"]

    external close_db : sqlite_db -> unit = "close" [@@mel.send]
    external exec_string : sqlite_db -> string -> value = "exec" [@@mel.send]
    external exec_value : sqlite_db -> value -> value = "exec" [@@mel.send]

    external transaction : sqlite_db -> (sqlite_db -> value) -> value
      = "transaction"
    [@@mel.send]

    let row_mode = function Row_array -> "array" | Row_object -> "object"
    let return_value Result_rows = "resultRows"

    let options_to_value opts =
      let options = Js.Dict.empty () in
      Js.Dict.set options "sql" (Js.Json.string opts.sql);
      Option.iter (Js.Dict.set options "bind") opts.bind;
      Option.iter
        (fun mode ->
          Js.Dict.set options "rowMode" (Js.Json.string (row_mode mode)))
        opts.row_mode;
      Option.iter
        (fun value ->
          Js.Dict.set options "returnValue"
            (Js.Json.string (return_value value)))
        opts.return_value;
      Js.Json.object_ options

    let init () =
      sqlite3_init_module (init_options ())
      |> Js.Promise.then_ (fun sqlite -> Js.Promise.resolve (Some sqlite))

    let open_db opts =
      match opts.pool with
      | Some pool ->
          Js.Promise.resolve
            (reflect_construct (opfs_sah_pool_db pool) [| opts.path |])
      | None ->
          let sqlite =
            match opts.sqlite with
            | Some sqlite -> sqlite
            | None -> failwith "platform browser-sqlite/open-db requires sqlite"
          in
          Js.Promise.resolve
            (reflect_construct
               (db_constructor (oo1 sqlite))
               [| opts.path; Option.value opts.mode ~default:"c" |])

    let exec db = function
      | Sql_string sql -> exec_string db sql
      | Sql_options opts -> exec_value db (options_to_value opts)

    let backup_db = None
  end

  module Crypto = struct
    let save_secret_text key text = Kv.set key (Some (Js.Json.string text))

    let read_secret_text key =
      Kv.get key
      |> Js.Promise.then_ (function
        | Some value -> Js.Promise.resolve (Js.Json.decodeString value)
        | None -> Js.Promise.resolve None)

    let delete_secret_text key = Kv.set key None
  end

  module Timers = struct
    let set_interval f ms = Js.Global.setInterval ~f ms
  end

  module Vector = struct
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

    module Index = struct
      let query _index _embedding _limit _page =
        failwith "platform browser-vector/query unsupported"

      let upsert _index _docs =
        failwith "platform browser-vector/upsert unsupported"

      let delete _index _ids =
        failwith "platform browser-vector/delete unsupported"

      let truncate _index =
        failwith "platform browser-vector/truncate unsupported"

      let metadata _index = None
      let set_metadata _index = None
      let close _index = None
    end

    type open_options = { path : string; dimension : int }

    let open_index _opts = unsupported "browser-vector" "open-index"
  end

  module Embedding = struct
    let model_id = ""
    let dimension = 0
    let embed_texts _texts = unsupported "browser-embedding" "embed-texts"
  end
end

module Node = struct
  type value = Js.Json.t
  type binary = Node.buffer
  type transferables = Js.Json.t
  type sqlite_module
  type storage_pool = { repo_dir : string }
  type database_sync

  type sqlite_db = {
    raw : database_sync;
    tx_depth : int ref;
    savepoint_seq : int ref;
  }

  type websocket
  type timer_id = Js.Global.intervalId

  module Env = struct
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

    let env_get key = Js.Dict.get Node.Process.process##env key
    let publishing = false
    let runtime = Runtime_node
    let root_dir = env_get "LOGSEQ_DB_WORKER_ROOT_DIR"

    let owner_source =
      match env_get "LOGSEQ_DB_WORKER_OWNER_SOURCE" with
      | Some "cli" -> Owner_cli
      | Some "electron" -> Owner_electron
      | Some "browser" -> Owner_browser
      | Some "capacitor" -> Owner_capacitor
      | _ -> Owner_unknown

    let recreate_lock_fn = None
  end

  let configured_root_dir : string option ref = ref None
  let configured_owner_source : Env.owner_source option ref = ref None
  let configured_event_fn : (string -> value -> unit) option ref = ref None

  let configured_write_guard_fn : (unit -> unit Js.Promise.t) option ref =
    ref None

  let configured_recreate_lock_fn : (unit -> unit) option ref = ref None
  let configured_embedding_endpoint : string option ref = ref None
  let configured_embedding_model_id : string option ref = ref None

  let owner_source_from_string = function
    | "cli" -> Env.Owner_cli
    | "electron" -> Env.Owner_electron
    | "browser" -> Env.Owner_browser
    | "capacitor" -> Env.Owner_capacitor
    | _ -> Env.Owner_unknown

  let configure ?root_dir ?owner_source ?event_fn ?write_guard_fn
      ?recreate_lock_fn ?embedding_endpoint ?embedding_model_id () =
    configured_root_dir := root_dir;
    configured_owner_source := Option.map owner_source_from_string owner_source;
    configured_event_fn := event_fn;
    configured_write_guard_fn := write_guard_fn;
    configured_recreate_lock_fn := recreate_lock_fn;
    configured_embedding_endpoint := embedding_endpoint;
    configured_embedding_model_id := embedding_model_id

  let current_owner_source () =
    Option.value !configured_owner_source ~default:Env.owner_source

  let current_root_dir_option () =
    match !configured_root_dir with
    | Some root_dir -> Some root_dir
    | None -> Env.root_dir

  let current_recreate_lock_fn () =
    match !configured_recreate_lock_fn with
    | Some _ as recreate_lock_fn -> recreate_lock_fn
    | None -> Env.recreate_lock_fn

  let write_guard () =
    match !configured_write_guard_fn with
    | Some write_guard_fn -> write_guard_fn ()
    | None -> Js.Promise.resolve ()

  module Fs = struct
    type stat
    type mkdir_options
    type rm_options

    external mkdir_options : recursive:bool -> unit -> mkdir_options = ""
    [@@mel.obj]

    external rm_options : recursive:bool -> force:bool -> unit -> rm_options
      = ""
    [@@mel.obj]

    external stat_sync : string -> stat = "statSync" [@@mel.module "fs"]

    external read_file_bytes_sync : string -> binary = "readFileSync"
    [@@mel.module "fs"]

    external write_file_bytes_sync : string -> binary -> unit = "writeFileSync"
    [@@mel.module "fs"]

    external mkdir_sync : string -> mkdir_options -> unit = "mkdirSync"
    [@@mel.module "fs"]

    external rm_sync : string -> rm_options -> unit = "rmSync"
    [@@mel.module "fs"]

    external size : stat -> int = "size" [@@mel.get]
    external is_file : stat -> bool = "isFile" [@@mel.send]
  end

  let root_dir () =
    match current_root_dir_option () with
    | Some root -> root
    | None -> failwith "LOGSEQ_DB_WORKER_ROOT_DIR is required for Node platform"

  let data_dir () = Node.Path.join [| root_dir (); "graphs" |]
  let ensure_dir path = Fs.mkdir_sync path (Fs.mkdir_options ~recursive:true ())

  let strip_leading_slash path =
    if String.length path > 0 && path.[0] = '/' then
      String.sub path 1 (String.length path - 1)
    else path

  let path_under_data_dir path =
    if Node.Path.isAbsolute path then path
    else Node.Path.join [| data_dir (); path |]

  module Storage = struct
    type asset_stat = {
      size : int64;
      type_ : string option;
      is_file : bool option;
    }

    let pool_path pool path =
      Node.Path.join [| pool.repo_dir; strip_leading_slash path |]

    let install_opfs_pool _sqlite pool_name =
      let repo_dir = Node.Path.join [| data_dir (); pool_name |] in
      ensure_dir repo_dir;
      Js.Promise.resolve { repo_dir }

    let list_graphs () =
      let dir = data_dir () in
      let entries =
        if Node.Fs.existsSync dir then Node.Fs.readdirSync dir else [||]
      in
      entries |> Array.to_list
      |> List.filter (fun name -> name <> "backup" && name <> "Unlinked graphs")
      |> Js.Promise.resolve

    let db_exists graph =
      Node.Path.join [| data_dir (); graph; "db.sqlite" |]
      |> Node.Fs.existsSync |> Js.Promise.resolve

    let resolve_db_path = Some (fun _repo pool path -> pool_path pool path)

    let export_file pool path =
      Js.Promise.resolve (Fs.read_file_bytes_sync (pool_path pool path))

    let import_db pool path payload =
      write_guard ()
      |> Js.Promise.then_ (fun () ->
          let full_path = pool_path pool path in
          ensure_dir (Node.Path.dirname full_path);
          Fs.write_file_bytes_sync full_path payload;
          Js.Promise.resolve ())

    let remove_vfs pool =
      Fs.rm_sync pool.repo_dir (Fs.rm_options ~recursive:true ~force:true ());
      Js.Promise.resolve ()

    let read_text path =
      Js.Promise.resolve ()
      |> Js.Promise.then_ (fun () ->
          Js.Promise.resolve
            (Node.Fs.readFileAsUtf8Sync (path_under_data_dir path)))

    let write_text path text =
      write_guard ()
      |> Js.Promise.then_ (fun () ->
          let full_path = path_under_data_dir path in
          ensure_dir (Node.Path.dirname full_path);
          Node.Fs.writeFileAsUtf8Sync full_path text;
          Js.Promise.resolve ())

    let write_text_atomic =
      Some
        (fun path text ->
          write_guard ()
          |> Js.Promise.then_ (fun () ->
              let full_path = path_under_data_dir path in
              let tmp_path = full_path ^ ".tmp" in
              ensure_dir (Node.Path.dirname full_path);
              Node.Fs.writeFileAsUtf8Sync tmp_path text;
              Node.Fs.renameSync tmp_path full_path;
              Js.Promise.resolve ()))

    let delete_file =
      Some
        (fun path ->
          write_guard ()
          |> Js.Promise.then_ (fun () ->
              Fs.rm_sync (path_under_data_dir path)
                (Fs.rm_options ~recursive:false ~force:true ());
              Js.Promise.resolve ()))

    let mirror_read_text = None

    let asset_file_path repo file_name =
      Node.Path.join [| data_dir (); repo; "assets"; file_name |]

    let asset_read_bytes repo file_name =
      Js.Promise.resolve
        (Fs.read_file_bytes_sync (asset_file_path repo file_name))

    let asset_write_bytes repo file_name payload =
      write_guard ()
      |> Js.Promise.then_ (fun () ->
          let full_path = asset_file_path repo file_name in
          ensure_dir (Node.Path.dirname full_path);
          Fs.write_file_bytes_sync full_path payload;
          Js.Promise.resolve ())

    let asset_stat repo file_name =
      let path = asset_file_path repo file_name in
      if Node.Fs.existsSync path then
        let stat = Fs.stat_sync path in
        Some
          {
            size = Int64.of_int (Fs.size stat);
            type_ = None;
            is_file = Some (Fs.is_file stat);
          }
        |> Js.Promise.resolve
      else Js.Promise.resolve None

    let asset_delete =
      Some
        (fun repo file_name ->
          write_guard ()
          |> Js.Promise.then_ (fun () ->
              Fs.rm_sync
                (asset_file_path repo file_name)
                (Fs.rm_options ~recursive:false ~force:true ());
              Js.Promise.resolve ()))

    let transfer = None
  end

  module Kv = struct
    let state : (string * value Js.Dict.t) option ref = ref None
    let kv_path () = Node.Path.join [| root_dir (); "kv-store.json" |]

    external is_binary_view : value -> bool = "isView"
    [@@mel.scope "ArrayBuffer"]

    external array_from_binary : value -> int array = "from"
    [@@mel.scope "Array"]

    external uint8_array : int array -> value = "Uint8Array" [@@mel.new]

    let binary_to_string value =
      value |> array_from_binary |> Array.to_list |> List.map Char.chr
      |> List.to_seq |> String.of_seq

    let string_to_binary text =
      Array.init (String.length text) (fun index -> Char.code text.[index])
      |> uint8_array

    let rec value_to_transit value =
      if is_binary_view value then Transit.Json.Binary (binary_to_string value)
      else
        match Js.Json.classify value with
        | JSONNull -> Transit.Json.Null
        | JSONFalse -> Bool false
        | JSONTrue -> Bool true
        | JSONString text -> String text
        | JSONNumber number -> Float number
        | JSONArray values ->
            Array (values |> Array.to_list |> List.map value_to_transit)
        | JSONObject object_ ->
            Map
              (object_ |> Js.Dict.entries |> Array.to_list
              |> List.map (fun (key, value) ->
                  (Transit.Json.String key, value_to_transit value)))

    let rec transit_to_value = function
      | Transit.Json.Null -> Js.Json.null
      | Bool value -> Js.Json.boolean value
      | String text -> Js.Json.string text
      | Int value -> Js.Json.number (float_of_int value)
      | Int64 value -> Js.Json.number (Int64.to_float value)
      | Float value -> Js.Json.number value
      | Binary text -> string_to_binary text
      | Keyword text -> Js.Json.string (":" ^ text)
      | Symbol text | Big_decimal text | Big_int text | Uuid text | Uri text ->
          Js.Json.string text
      | Date milliseconds -> Js.Json.number (Int64.to_float milliseconds)
      | Array values | Set values | List values ->
          Js.Json.array (Array.of_list (List.map transit_to_value values))
      | Map entries ->
          let object_ = Js.Dict.empty () in
          List.iter
            (fun (key, value) ->
              let key =
                match key with
                | Transit.Json.String text -> text
                | Keyword text -> ":" ^ text
                | key -> Transit.Json.to_string key
              in
              Js.Dict.set object_ key (transit_to_value value))
            entries;
          Js.Json.object_ object_
      | Tagged (tag, value) ->
          let object_ = Js.Dict.empty () in
          Js.Dict.set object_ "tag" (Js.Json.string tag);
          Js.Dict.set object_ "rep" (transit_to_value value);
          Js.Json.object_ object_

    let state_to_transit state =
      state |> Js.Json.object_ |> value_to_transit |> Transit.Json.to_string

    let parse_state payload =
      try
        match
          payload |> Transit.Json.of_string |> transit_to_value
          |> Js.Json.decodeObject
        with
        | Some object_ -> object_
        | None -> Js.Dict.empty ()
      with _ -> Js.Dict.empty ()

    let load () =
      let path = kv_path () in
      match !state with
      | Some (loaded_path, state) when loaded_path = path -> state
      | None ->
          let loaded =
            if Node.Fs.existsSync path then
              parse_state (Node.Fs.readFileAsUtf8Sync path)
            else Js.Dict.empty ()
          in
          state := Some (path, loaded);
          loaded
      | Some _ ->
          let loaded =
            if Node.Fs.existsSync path then
              parse_state (Node.Fs.readFileAsUtf8Sync path)
            else Js.Dict.empty ()
          in
          state := Some (path, loaded);
          loaded

    let persist state =
      ensure_dir (Node.Path.dirname (kv_path ()));
      Node.Fs.writeFileAsUtf8Sync (kv_path ()) (state_to_transit state)

    let get key =
      let state = load () in
      match Js.Dict.get state key with
      | Some value when Option.is_some (Js.Json.decodeNull value) ->
          Js.Promise.resolve None
      | value -> Js.Promise.resolve value

    let set key value =
      let state = load () in
      Js.Dict.set state key (Option.value value ~default:Js.Json.null);
      persist state;
      Js.Promise.resolve ()
  end

  module Broadcast = struct
    let post_message type_ payload =
      match !configured_event_fn with
      | Some event_fn -> event_fn type_ payload
      | None -> ()
  end

  module Websocket = struct
    external connect : string -> websocket = "WebSocket"
    [@@mel.module "ws"] [@@mel.new]
  end

  module Sqlite = struct
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
    type statement
    type statement_fn

    external make_database_sync : string -> database_sync = "DatabaseSync"
    [@@mel.module "node:sqlite"] [@@mel.new]

    external close_raw : database_sync -> unit = "close" [@@mel.send]
    external exec_raw : database_sync -> string -> value = "exec" [@@mel.send]

    external prepare : database_sync -> string -> statement = "prepare"
    [@@mel.send]

    external set_return_arrays : statement -> bool -> unit = "setReturnArrays"
    [@@mel.send]

    external all0 : statement -> value = "all" [@@mel.send]
    external all1 : statement -> value -> value = "all" [@@mel.send]
    external run0 : statement -> value = "run" [@@mel.send]
    external run1 : statement -> value -> value = "run" [@@mel.send]
    external all_fn : statement -> statement_fn = "all" [@@mel.get]
    external run_fn : statement -> statement_fn = "run" [@@mel.get]

    external reflect_apply : statement_fn -> statement -> value array -> value
      = "apply"
    [@@mel.scope "Reflect"]

    external backup_raw : database_sync -> string -> unit Js.Promise.t
      = "backup"
    [@@mel.module "node:sqlite"]

    let close_db db = close_raw db.raw
    let init () = Js.Promise.resolve None

    let open_db opts =
      ensure_dir (Node.Path.dirname opts.path);
      Js.Promise.resolve
        {
          raw = make_database_sync opts.path;
          tx_depth = ref 0;
          savepoint_seq = ref 0;
        }

    let strip_bind_prefix key =
      if starts_with key "$" || starts_with key ":" then
        String.sub key 1 (String.length key - 1)
      else key

    let normalize_bind bind =
      match Js.Json.decodeObject bind with
      | Some object_ ->
          let normalized = Js.Dict.empty () in
          Array.iter
            (fun (key, value) ->
              Js.Dict.set normalized (strip_bind_prefix key) value)
            (Js.Dict.entries object_);
          Js.Json.object_ normalized
      | None -> bind

    let stmt_all stmt = function
      | None -> all0 stmt
      | Some bind -> (
          match Js.Json.decodeArray bind with
          | Some values -> reflect_apply (all_fn stmt) stmt values
          | None -> all1 stmt (normalize_bind bind))

    let stmt_run stmt = function
      | None ->
          ignore (run0 stmt : value);
          Js.Json.null
      | Some bind -> (
          match Js.Json.decodeArray bind with
          | Some values ->
              ignore (reflect_apply (run_fn stmt) stmt values : value);
              Js.Json.null
          | None ->
              ignore (run1 stmt (normalize_bind bind) : value);
              Js.Json.null)

    let returns_rows opts =
      match (opts.row_mode, opts.return_value) with
      | Some (Row_array | Row_object), _ | _, Some Result_rows -> true
      | None, None -> false

    let exec db = function
      | Sql_string sql -> exec_raw db.raw sql
      | Sql_options opts ->
          let stmt = prepare db.raw opts.sql in
          if opts.row_mode = Some Row_array then set_return_arrays stmt true;
          if returns_rows opts then stmt_all stmt opts.bind
          else stmt_run stmt opts.bind

    let exec_ignore db sql =
      try
        ignore (exec_raw db.raw sql : value);
        ()
      with _ -> ()

    let transaction db f =
      let outermost = !(db.tx_depth) = 0 in
      let savepoint =
        if outermost then None
        else (
          incr db.savepoint_seq;
          Some ("__logseq_tx_" ^ string_of_int !(db.savepoint_seq)))
      in
      (match savepoint with
      | None -> ignore (exec_raw db.raw "BEGIN" : value)
      | Some savepoint ->
          ignore (exec_raw db.raw ("SAVEPOINT " ^ savepoint) : value));
      incr db.tx_depth;
      try
        let result = f db in
        try
          (match savepoint with
          | None -> ignore (exec_raw db.raw "COMMIT" : value)
          | Some savepoint ->
              ignore
                (exec_raw db.raw ("RELEASE SAVEPOINT " ^ savepoint) : value));
          decr db.tx_depth;
          result
        with exn ->
          decr db.tx_depth;
          raise exn
      with exn ->
        (match savepoint with
        | None -> exec_ignore db "ROLLBACK"
        | Some savepoint ->
            exec_ignore db ("ROLLBACK TO SAVEPOINT " ^ savepoint);
            exec_ignore db ("RELEASE SAVEPOINT " ^ savepoint));
        decr db.tx_depth;
        raise exn

    let backup_db =
      Some
        (fun db path ->
          write_guard ()
          |> Js.Promise.then_ (fun () ->
              ensure_dir (Node.Path.dirname path);
              backup_raw db.raw path))
  end

  module Crypto = struct
    type keytar_module

    external require_keytar : string -> keytar_module = "require"

    external keytar_set_password :
      keytar_module -> string -> string -> string -> unit Js.Promise.t
      = "setPassword"
    [@@mel.send]

    external keytar_get_password :
      keytar_module -> string -> string -> string Js.Nullable.t Js.Promise.t
      = "getPassword"
    [@@mel.send]

    external keytar_delete_password :
      keytar_module -> string -> string -> bool Js.Promise.t = "deletePassword"
    [@@mel.send]

    let keychain_service = "Logseq E2EE"
    let keytar_ref : keytar_module option ref = ref None

    let keytar_module () =
      match !keytar_ref with
      | Some module_ -> module_
      | None ->
          let module_ = require_keytar "keytar" in
          keytar_ref := Some module_;
          module_

    let kv_save_secret_text key text = Kv.set key (Some (Js.Json.string text))

    let kv_read_secret_text key =
      Kv.get key
      |> Js.Promise.then_ (function
        | Some value -> Js.Promise.resolve (Js.Json.decodeString value)
        | None -> Js.Promise.resolve None)

    let kv_delete_secret_text key = Kv.set key None

    let truthy_env = function
      | None -> false
      | Some value -> (
          match String.lowercase_ascii (String.trim value) with
          | "1" | "true" | "yes" | "on" -> true
          | _ -> false)

    let use_keychain_for_owner () =
      match current_owner_source () with
      | Env.Owner_cli -> not (truthy_env (Env.env_get "CLI_E2E_TEST"))
      | _ -> true

    let save_secret_text key text =
      if use_keychain_for_owner () then
        keytar_set_password (keytar_module ()) keychain_service key text
        |> Js.Promise.catch (fun _ -> kv_save_secret_text key text)
      else kv_save_secret_text key text

    let read_secret_text key =
      if use_keychain_for_owner () then
        keytar_get_password (keytar_module ()) keychain_service key
        |> Js.Promise.then_ (fun secret ->
            Js.Promise.resolve (Js.Nullable.toOption secret))
        |> Js.Promise.catch (fun _ -> kv_read_secret_text key)
      else kv_read_secret_text key

    let delete_secret_text key =
      if use_keychain_for_owner () then
        keytar_delete_password (keytar_module ()) keychain_service key
        |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
        |> Js.Promise.catch (fun _ -> kv_delete_secret_text key)
      else kv_delete_secret_text key
  end

  module Timers = struct
    let set_interval f ms = Js.Global.setInterval ~f ms
  end

  module Vector = struct
    type zvec_module
    type enum_group
    type enum_value
    type index_params
    type schema_vector
    type schema_field
    type schema_options
    type schema_constructor
    type schema
    type mmap_options
    type query_params
    type query_options
    type collection
    type doc_vectors
    type doc_fields
    type zvec_doc
    type zvec_result
    type zvec_result_fields

    type index = {
      path : string;
      dimension : int;
      mutable collection : collection;
    }

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

    external require_zvec : string -> zvec_module = "require"
    external log_level : zvec_module -> enum_group = "ZVecLogLevel" [@@mel.get]
    external data_type : zvec_module -> enum_group = "ZVecDataType" [@@mel.get]

    external index_type : zvec_module -> enum_group = "ZVecIndexType"
    [@@mel.get]

    external metric_type : zvec_module -> enum_group = "ZVecMetricType"
    [@@mel.get]

    external enum_warn : enum_group -> enum_value = "WARN" [@@mel.get]

    external enum_vector_fp32 : enum_group -> enum_value = "VECTOR_FP32"
    [@@mel.get]

    external enum_string : enum_group -> enum_value = "STRING" [@@mel.get]
    external enum_hnsw : enum_group -> enum_value = "HNSW" [@@mel.get]
    external enum_invert : enum_group -> enum_value = "INVERT" [@@mel.get]
    external enum_cosine : enum_group -> enum_value = "COSINE" [@@mel.get]

    external init_options : logLevel:enum_value -> unit -> value = ""
    [@@mel.obj]

    external zvec_initialize : zvec_module -> value -> unit = "ZVecInitialize"
    [@@mel.send]

    external schema_constructor : zvec_module -> schema_constructor
      = "ZVecCollectionSchema"
    [@@mel.get]

    external reflect_construct_schema :
      schema_constructor -> schema_options array -> schema = "construct"
    [@@mel.scope "Reflect"]

    external index_params :
      indexType:enum_value -> ?metricType:enum_value -> unit -> index_params
      = ""
    [@@mel.obj]

    external schema_vector :
      name:string ->
      dataType:enum_value ->
      dimension:int ->
      indexParams:index_params ->
      unit ->
      schema_vector = ""
    [@@mel.obj]

    external schema_field :
      name:string ->
      dataType:enum_value ->
      ?indexParams:index_params ->
      unit ->
      schema_field = ""
    [@@mel.obj]

    external schema_options :
      name:string ->
      vectors:schema_vector array ->
      fields:schema_field array ->
      unit ->
      schema_options = ""
    [@@mel.obj]

    external mmap_options : enableMMAP:bool -> unit -> mmap_options = ""
    [@@mel.obj]

    external zvec_create_and_open :
      zvec_module -> string -> schema -> mmap_options -> collection
      = "ZVecCreateAndOpen"
    [@@mel.send]

    external zvec_open : zvec_module -> string -> mmap_options -> collection
      = "ZVecOpen"
    [@@mel.send]

    external query_params :
      indexType:enum_value -> ef:int -> unit -> query_params = ""
    [@@mel.obj]

    external query_options :
      fieldName:string ->
      topk:int ->
      vector:float array ->
      outputFields:string array ->
      params:query_params ->
      unit ->
      query_options = ""
    [@@mel.obj]

    external query_sync : collection -> query_options -> zvec_result array
      = "querySync"
    [@@mel.send]

    external upsert_sync : collection -> zvec_doc array -> unit = "upsertSync"
    [@@mel.send]

    external delete_sync : collection -> string array -> unit = "deleteSync"
    [@@mel.send]

    external destroy_sync : collection -> unit = "destroySync" [@@mel.send]
    external close_sync : collection -> unit = "closeSync" [@@mel.send]

    external doc_vectors : embedding:float array -> unit -> doc_vectors = ""
    [@@mel.obj]

    external doc_fields : page:string -> title:string -> unit -> doc_fields = ""
    [@@mel.obj]

    external make_zvec_doc :
      id:string -> vectors:doc_vectors -> fields:doc_fields -> unit -> zvec_doc
      = ""
    [@@mel.obj]

    external result_id : zvec_result -> string = "id" [@@mel.get]

    external result_fields : zvec_result -> zvec_result_fields = "fields"
    [@@mel.get]

    external result_score : zvec_result -> float option = "score"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

    external result_page : zvec_result_fields -> string option = "page"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

    external result_title : zvec_result_fields -> string option = "title"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

    external error_code : Js.Exn.t -> string option = "code"
    [@@mel.get] [@@mel.return { undefined_to_opt }]

    let zvec_vector_field = "embedding"
    let zvec_page_field = "page"
    let zvec_title_field = "title"
    let zvec_module_ref : zvec_module option ref = ref None
    let zvec_initialized = ref false

    let zvec_module () =
      match !zvec_module_ref with
      | Some module_ -> module_
      | None ->
          let module_ = require_zvec "@zvec/zvec" in
          zvec_module_ref := Some module_;
          module_

    let initialize_zvec () =
      let module_ = zvec_module () in
      if not !zvec_initialized then (
        zvec_initialize module_
          (init_options ~logLevel:(enum_warn (log_level module_)) ());
        zvec_initialized := true);
      module_

    let zvec_schema module_ dimension =
      let vector_params =
        index_params
          ~indexType:(enum_hnsw (index_type module_))
          ~metricType:(enum_cosine (metric_type module_))
          ()
      in
      let page_params =
        index_params ~indexType:(enum_invert (index_type module_)) ()
      in
      let vectors =
        [|
          schema_vector ~name:zvec_vector_field
            ~dataType:(enum_vector_fp32 (data_type module_))
            ~dimension ~indexParams:vector_params ();
        |]
      in
      let fields =
        [|
          schema_field ~name:zvec_page_field
            ~dataType:(enum_string (data_type module_))
            ~indexParams:page_params ();
          schema_field ~name:zvec_title_field
            ~dataType:(enum_string (data_type module_))
            ();
        |]
      in
      reflect_construct_schema
        (schema_constructor module_)
        [| schema_options ~name:"blocks" ~vectors ~fields () |]

    let create_zvec_collection path dimension =
      let module_ = initialize_zvec () in
      zvec_create_and_open module_ path
        (zvec_schema module_ dimension)
        (mmap_options ~enableMMAP:true ())

    let zvec_collection_missing_error exn =
      match Js.Exn.asJsExn exn with
      | None -> false
      | Some js_exn -> (
          error_code js_exn = Some "ZVEC_NOT_FOUND"
          || error_code js_exn = Some "ZVEC_INVALID_ARGUMENT"
             &&
             match Js.Exn.message js_exn with
             | Some message -> includes message " not exist"
             | None -> false)

    let open_zvec_collection path dimension =
      let module_ = initialize_zvec () in
      try zvec_open module_ path (mmap_options ~enableMMAP:true ())
      with exn ->
        if zvec_collection_missing_error exn then
          create_zvec_collection path dimension
        else raise exn

    let zvec_doc (doc : document) =
      make_zvec_doc ~id:doc.id
        ~vectors:(doc_vectors ~embedding:(Array.of_list doc.embedding) ())
        ~fields:
          (doc_fields ~page:doc.page
             ~title:(Option.value doc.vector_title ~default:"")
             ())
        ()

    let zvec_result_to_result doc =
      let fields = result_fields doc in
      let score =
        match result_score doc with
        | Some distance -> 1.0 /. (1.0 +. distance)
        | None -> 0.0
      in
      {
        id = result_id doc;
        page = result_page fields;
        title = None;
        vector_title = result_title fields;
        vector_score = score;
      }

    let metadata_path path = Node.Path.join [| path; "metadata.json" |]

    let read_metadata path =
      let path = metadata_path path in
      if Node.Fs.existsSync path then
        Some (Js.Json.parseExn (Node.Fs.readFileAsUtf8Sync path))
      else None

    let write_metadata path metadata =
      ensure_dir path;
      Node.Fs.writeFileAsUtf8Sync (metadata_path path)
        (Js.Json.stringify metadata)

    let vector_query_topks limit page =
      let limit = Option.value limit ~default:100 in
      match page with
      | Some _ -> [ 4 * limit; 16 * limit; 64 * limit ]
      | None -> [ limit ]

    let query_zvec collection embedding topk =
      let module_ = zvec_module () in
      query_sync collection
        (query_options ~fieldName:zvec_vector_field ~topk
           ~vector:(Array.of_list embedding)
           ~outputFields:[| zvec_page_field; zvec_title_field |]
           ~params:
             (query_params
                ~indexType:(enum_hnsw (index_type module_))
                ~ef:300 ())
           ())

    let enough_vector_results results limit page =
      match page with None -> true | Some _ -> List.length results >= limit

    module Index = struct
      let query index embedding limit page =
        let limit = Option.value limit ~default:100 in
        let rec loop latest_results = function
          | [] -> latest_results
          | topk :: rest ->
              let results =
                query_zvec index.collection embedding topk
                |> Array.to_list
                |> List.map zvec_result_to_result
                |> List.filter (fun result ->
                    match page with
                    | None -> true
                    | Some page -> result.page = Some page)
                |> fun results ->
                if List.length results <= limit then results
                else results |> List.to_seq |> Seq.take limit |> List.of_seq
              in
              if enough_vector_results results limit page || rest = [] then
                results
              else loop results rest
        in
        loop [] (vector_query_topks (Some limit) page)

      let upsert index docs =
        upsert_sync index.collection (Array.of_list (List.map zvec_doc docs))

      let delete index ids = delete_sync index.collection (Array.of_list ids)

      let truncate index =
        destroy_sync index.collection;
        index.collection <- open_zvec_collection index.path index.dimension

      let metadata index = Some (fun () -> read_metadata index.path)

      let set_metadata index =
        Some (fun metadata -> write_metadata index.path metadata)

      let close index = Some (fun () -> close_sync index.collection)
    end

    type open_options = { path : string; dimension : int }

    let open_index opts =
      ensure_dir (Node.Path.dirname opts.path);
      Js.Promise.resolve
        {
          path = opts.path;
          dimension = opts.dimension;
          collection = open_zvec_collection opts.path opts.dimension;
        }
  end

  module Embedding = struct
    type response

    external fetch : string -> value -> response Js.Promise.t = "fetch"
    external ok : response -> bool = "ok" [@@mel.get]
    external status : response -> int = "status" [@@mel.get]
    external json : response -> value Js.Promise.t = "json" [@@mel.send]
    external date_now : unit -> float = "now" [@@mel.scope "Date"]

    let default_model_id = "all-MiniLM-L6-v2"
    let fetch_timeout_ms = 120000.0
    let fetch_retry_ms = 250

    let current_model_id () =
      match !configured_embedding_model_id with
      | Some model_id -> model_id
      | None -> (
          match Env.env_get "LOGSEQ_EMBEDDING_MODEL" with
          | Some model_id -> model_id
          | None -> default_model_id)

    let model_id = current_model_id ()

    let dimension_for_model = function
      | "all-MiniLM-L6-v2" -> 384
      | "BAAI/bge-m3" | "Qwen/Qwen3-Embedding-4B" -> 1024
      | model_id ->
          failwith ("Unsupported embedding model dimension: " ^ model_id)

    let dimension = dimension_for_model model_id

    let endpoint () =
      match
        match !configured_embedding_endpoint with
        | Some endpoint -> Some endpoint
        | None -> Env.env_get "LOGSEQ_EMBEDDINGS_URL"
      with
      | Some endpoint when endpoint <> "" -> endpoint
      | _ -> failwith "LOGSEQ_EMBEDDINGS_URL is required for node embeddings"

    let delay ms =
      Js.Promise.make (fun ~resolve ~reject:_ ->
          ignore
            (Js.Global.setTimeout ~f:(fun () -> (resolve true [@u])) ms
              : Js.Global.timeoutId))

    let headers =
      let headers = Js.Dict.empty () in
      Js.Dict.set headers "Content-Type" (Js.Json.string "application/json");
      Js.Json.object_ headers

    let request_body texts =
      let body = Js.Dict.empty () in
      Js.Dict.set body "model" (Js.Json.string (current_model_id ()));
      Js.Dict.set body "input"
        (Js.Json.array (Array.of_list (List.map Js.Json.string texts)));
      Js.Json.stringify (Js.Json.object_ body)

    let fetch_options body =
      let options = Js.Dict.empty () in
      Js.Dict.set options "method" (Js.Json.string "POST");
      Js.Dict.set options "headers" headers;
      Js.Dict.set options "body" (Js.Json.string body);
      Js.Json.object_ options

    let fetch_embedding_response endpoint request =
      let deadline = date_now () +. fetch_timeout_ms in
      let rec attempt () =
        fetch endpoint request
        |> Js.Promise.catch (fun _ ->
            if date_now () < deadline then
              delay fetch_retry_ms |> Js.Promise.then_ (fun _ -> attempt ())
            else rejected "embedding server fetch failed")
      in
      attempt ()

    let number_value value =
      match Js.Json.decodeNumber value with
      | Some value -> value
      | None -> failwith "embedding response contains a non-number value"

    let embedding_from_item item =
      match Js.Json.decodeObject item with
      | None -> failwith "embedding response data item is not an object"
      | Some item -> (
          match Js.Dict.get item "embedding" with
          | Some embedding -> (
              match Js.Json.decodeArray embedding with
              | Some values -> values |> Array.to_list |> List.map number_value
              | None -> failwith "embedding response embedding is not an array")
          | None -> failwith "embedding response item is missing embedding")

    let item_index item =
      match Js.Json.decodeObject item with
      | None -> 0
      | Some item -> (
          match Js.Dict.get item "index" with
          | Some index -> (
              match Js.Json.decodeNumber index with
              | Some index -> int_of_float index
              | None -> 0)
          | None -> 0)

    let embeddings_from_response body =
      match Js.Json.decodeObject body with
      | None -> failwith "embedding response is not an object"
      | Some body -> (
          match Js.Dict.get body "data" with
          | Some data -> (
              match Js.Json.decodeArray data with
              | Some data ->
                  data |> Array.to_list
                  |> List.sort (fun left right ->
                      compare (item_index left) (item_index right))
                  |> List.map embedding_from_item
              | None -> failwith "embedding response data is not an array")
          | None -> failwith "embedding response is missing data")

    let embed_texts texts =
      match texts with
      | [] -> Js.Promise.resolve []
      | texts ->
          let endpoint = endpoint () in
          let request = fetch_options (request_body texts) in
          fetch_embedding_response endpoint request
          |> Js.Promise.then_ (fun response ->
              if ok response then json response
              else
                rejected
                  ("embedding server request failed with status "
                  ^ string_of_int (status response)))
          |> Js.Promise.then_ (fun body ->
              Js.Promise.resolve (embeddings_from_response body))
  end

  let current_embedding_model_id = Embedding.current_model_id
  let embedding_dimension_for_model = Embedding.dimension_for_model
end
