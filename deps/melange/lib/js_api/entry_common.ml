module Db_platform = Melange_db_worker_spec.Platform

module Make (M : Db_platform.S with type value = Js.Json.t) = struct
  type env
  type ('sqlite_module, 'storage_pool, 'binary, 'transferables) storage
  type kv
  type broadcast
  type websocket
  type ('sqlite_module, 'storage_pool, 'sqlite_db) sqlite
  type crypto
  type 'timer_id timers
  type vector_index
  type 'index vector
  type embedding
  type base_platform
  type platform

  external make_env :
    publishing:bool ->
    runtime:string ->
    rootDir:string Js.Nullable.t ->
    ownerSource:string ->
    recreateLockFn:(unit -> unit) Js.Nullable.t ->
    unit ->
    env = ""
  [@@mel.obj]

  external make_storage :
    installOpfsPool:('sqlite_module -> string -> 'storage_pool Js.Promise.t) ->
    listGraphs:(unit -> string array Js.Promise.t) ->
    dbExists:(string -> bool Js.Promise.t) ->
    resolveDbPath:(string -> 'storage_pool -> string -> string) Js.Nullable.t ->
    exportFile:('storage_pool -> string -> 'binary Js.Promise.t) ->
    importDb:('storage_pool -> string -> 'binary -> unit Js.Promise.t) ->
    removeVfs:('storage_pool -> unit Js.Promise.t) ->
    readText:(string -> string Js.Promise.t) ->
    writeText:(string -> string -> unit Js.Promise.t) ->
    writeTextAtomic:(string -> string -> unit Js.Promise.t) Js.Nullable.t ->
    deleteFile:(string -> unit Js.Promise.t) Js.Nullable.t ->
    mirrorReadText:(string -> string Js.Promise.t) Js.Nullable.t ->
    assetReadBytes:(string -> string -> 'binary Js.Promise.t) ->
    assetWriteBytes:(string -> string -> 'binary -> unit Js.Promise.t) ->
    assetStat:(string -> string -> Js.Json.t Js.Nullable.t Js.Promise.t) ->
    assetDelete:(string -> string -> unit Js.Promise.t) Js.Nullable.t ->
    transfer:(Js.Json.t -> 'transferables -> Js.Json.t) Js.Nullable.t ->
    unit ->
    ('sqlite_module, 'storage_pool, 'binary, 'transferables) storage = ""
  [@@mel.obj]

  external make_kv :
    get:(string -> Js.Json.t Js.Nullable.t Js.Promise.t) ->
    set:(string -> Js.Json.t Js.Nullable.t -> unit Js.Promise.t) ->
    unit ->
    kv = ""
  [@@mel.obj]

  external make_broadcast :
    postMessage:(string -> Js.Json.t -> unit) -> unit -> broadcast = ""
  [@@mel.obj]

  external make_websocket : connect:(string -> M.websocket) -> unit -> websocket
    = ""
  [@@mel.obj]

  type ('sqlite_module, 'storage_pool) sqlite_open_options

  external sqlite_open_sqlite :
    ('sqlite_module, 'storage_pool) sqlite_open_options ->
    'sqlite_module Js.Nullable.t = "sqlite"
  [@@mel.get]

  external sqlite_open_pool :
    ('sqlite_module, 'storage_pool) sqlite_open_options ->
    'storage_pool Js.Nullable.t = "pool"
  [@@mel.get]

  external sqlite_open_path :
    ('sqlite_module, 'storage_pool) sqlite_open_options -> string = "path"
  [@@mel.get]

  external sqlite_open_mode :
    ('sqlite_module, 'storage_pool) sqlite_open_options -> string Js.Nullable.t
    = "mode"
  [@@mel.get]

  external make_sqlite :
    init:(unit -> 'sqlite_module Js.Nullable.t Js.Promise.t) ->
    openDb:
      (('sqlite_module, 'storage_pool) sqlite_open_options ->
      'sqlite_db Js.Promise.t) ->
    closeDb:('sqlite_db -> unit) ->
    exec:('sqlite_db -> Js.Json.t -> Js.Json.t) ->
    transaction:('sqlite_db -> ('sqlite_db -> Js.Json.t) -> Js.Json.t) ->
    backupDb:('sqlite_db -> string -> unit Js.Promise.t) Js.Nullable.t ->
    unit ->
    ('sqlite_module, 'storage_pool, 'sqlite_db) sqlite = ""
  [@@mel.obj]

  external make_crypto :
    saveSecretText:(string -> string -> unit Js.Promise.t) ->
    readSecretText:(string -> string Js.Nullable.t Js.Promise.t) ->
    deleteSecretText:(string -> unit Js.Promise.t) ->
    unit ->
    crypto = ""
  [@@mel.obj]

  external make_timers :
    setInterval:((unit -> unit) -> int -> 'timer_id) -> unit -> 'timer_id timers
    = ""
  [@@mel.obj]

  type vector_open_options

  external vector_open_path : vector_open_options -> string = "path" [@@mel.get]

  external vector_open_dimension : vector_open_options -> int = "dimension"
  [@@mel.get]

  external make_vector_index :
    query:
      (float array ->
      int Js.Nullable.t ->
      string Js.Nullable.t ->
      Js.Json.t array) ->
    upsert:(Js.Json.t array -> unit) ->
    delete:(string array -> unit) ->
    truncate:(unit -> unit) ->
    metadata:(unit -> Js.Json.t Js.Nullable.t) ->
    setMetadata:(Js.Json.t -> unit) ->
    close:(unit -> unit) ->
    unit ->
    vector_index = ""
  [@@mel.obj]

  external make_vector :
    openIndex:(vector_open_options -> vector_index Js.Promise.t) ->
    unit ->
    'index vector = ""
  [@@mel.obj]

  external make_embedding :
    modelId:string ->
    dimension:int ->
    embedTexts:(string array -> float array array Js.Promise.t) ->
    unit ->
    embedding = ""
  [@@mel.obj]

  external make_base_platform :
    env:env ->
    storage:('sqlite_module, 'storage_pool, 'binary, 'transferables) storage ->
    kv:kv ->
    broadcast:broadcast ->
    websocket:websocket ->
    sqlite:('sqlite_module, 'storage_pool, 'sqlite_db) sqlite ->
    crypto:crypto ->
    timers:'timer_id timers ->
    unit ->
    base_platform = ""
  [@@mel.obj]

  external make_platform :
    env:env ->
    storage:('sqlite_module, 'storage_pool, 'binary, 'transferables) storage ->
    kv:kv ->
    broadcast:broadcast ->
    websocket:websocket ->
    sqlite:('sqlite_module, 'storage_pool, 'sqlite_db) sqlite ->
    crypto:crypto ->
    timers:'timer_id timers ->
    vector:'index vector ->
    embedding:embedding ->
    unit ->
    platform = ""
  [@@mel.obj]

  let owner_source_string = function
    | M.Env.Owner_browser -> "browser"
    | Owner_electron -> "electron"
    | Owner_capacitor -> "capacitor"
    | Owner_cli -> "cli"
    | Owner_unknown -> "unknown"

  let runtime_string = function
    | M.Env.Runtime_browser -> "browser"
    | Runtime_node -> "node"

  external set_prop : 'object_ -> string -> 'value -> unit = ""
  [@@mel.set_index]

  let set_optional_string object_ key = function
    | Some value -> Js.Dict.set object_ key (Js.Json.string value)
    | None -> ()

  let asset_stat_to_json (stat : M.Storage.asset_stat) =
    let object_ = Js.Dict.empty () in
    Js.Dict.set object_ "size" (Js.Json.number (Int64.to_float stat.size));
    set_optional_string object_ "type" stat.type_;
    (match stat.is_file with
    | Some is_file -> Js.Dict.set object_ "isFile" (Js.Json.boolean is_file)
    | None -> ());
    Js.Json.object_ object_

  let js_asset_stat repo file_name =
    M.Storage.asset_stat repo file_name
    |> Js.Promise.then_ (fun stat ->
        Js.Promise.resolve
          (Js.Nullable.fromOption (Option.map asset_stat_to_json stat)))

  let js_kv_get key =
    M.Kv.get key
    |> Js.Promise.then_ (fun value ->
        Js.Promise.resolve (Js.Nullable.fromOption value))

  let js_kv_set key value = M.Kv.set key (Js.Nullable.toOption value)

  let js_sqlite_open_db opts =
    M.Sqlite.open_db
      {
        sqlite = Js.Nullable.toOption (sqlite_open_sqlite opts);
        pool = Js.Nullable.toOption (sqlite_open_pool opts);
        path = sqlite_open_path opts;
        mode = Js.Nullable.toOption (sqlite_open_mode opts);
      }

  let row_mode = function
    | "array" -> Some M.Sqlite.Row_array
    | "object" -> Some Row_object
    | _ -> None

  let return_value = function
    | "resultRows" | "result_rows" -> Some M.Sqlite.Result_rows
    | _ -> None

  let option_string_field object_ key =
    match Js.Dict.get object_ key with
    | Some value -> Js.Json.decodeString value
    | None -> None

  let sqlite_options object_ =
    match option_string_field object_ "sql" with
    | None -> failwith "sqlite exec options require a sql string"
    | Some sql ->
        {
          M.Sqlite.sql;
          bind = Js.Dict.get object_ "bind";
          row_mode =
            Option.bind (option_string_field object_ "rowMode") row_mode;
          return_value =
            Option.bind (option_string_field object_ "returnValue") return_value;
        }

  let js_sqlite_exec db input =
    match Js.Json.classify input with
    | Js.Json.JSONString sql -> M.Sqlite.exec db (Sql_string sql)
    | JSONObject object_ ->
        M.Sqlite.exec db (Sql_options (sqlite_options object_))
    | _ -> failwith "sqlite exec expects a SQL string or options object"

  let js_sqlite_init () =
    M.Sqlite.init ()
    |> Js.Promise.then_ (fun sqlite ->
        Js.Promise.resolve (Js.Nullable.fromOption sqlite))

  let js_crypto_read_secret_text key =
    M.Crypto.read_secret_text key
    |> Js.Promise.then_ (fun secret ->
        Js.Promise.resolve (Js.Nullable.fromOption secret))

  let required_string object_ key =
    match Option.bind (Js.Dict.get object_ key) Js.Json.decodeString with
    | Some value -> value
    | None -> failwith ("required string field is missing: " ^ key)

  let optional_string object_ key =
    Option.bind (Js.Dict.get object_ key) Js.Json.decodeString

  let number_list value =
    match Js.Json.decodeArray value with
    | Some values ->
        values |> Array.to_list
        |> List.map (fun value ->
            match Js.Json.decodeNumber value with
            | Some number -> number
            | None -> failwith "expected number array")
    | None -> failwith "expected number array"

  let vector_document value =
    match Js.Json.decodeObject value with
    | None -> failwith "vector document must be an object"
    | Some object_ ->
        {
          M.Vector.id = required_string object_ "id";
          page = required_string object_ "page";
          embedding =
            (match Js.Dict.get object_ "embedding" with
            | Some embedding -> number_list embedding
            | None -> failwith "vector document requires embedding");
          vector_title = optional_string object_ "vectorTitle";
        }

  let vector_result_to_json (result : M.Vector.result) =
    let object_ = Js.Dict.empty () in
    Js.Dict.set object_ "id" (Js.Json.string result.id);
    set_optional_string object_ "page" result.page;
    set_optional_string object_ "title" result.title;
    set_optional_string object_ "vectorTitle" result.vector_title;
    Js.Dict.set object_ "vectorScore" (Js.Json.number result.vector_score);
    Js.Json.object_ object_

  let js_vector_query index embedding limit page =
    M.Vector.Index.query index (Array.to_list embedding)
      (Js.Nullable.toOption limit)
      (Js.Nullable.toOption page)
    |> List.map vector_result_to_json
    |> Array.of_list

  let js_vector_upsert index docs =
    M.Vector.Index.upsert index
      (docs |> Array.to_list |> List.map vector_document)

  let js_vector_delete index ids =
    M.Vector.Index.delete index (Array.to_list ids)

  let js_vector_metadata index =
    match M.Vector.Index.metadata index with
    | Some metadata -> Js.Nullable.fromOption (metadata ())
    | None -> Js.Nullable.undefined

  let js_vector_set_metadata index metadata =
    match M.Vector.Index.set_metadata index with
    | Some set_metadata -> set_metadata metadata
    | None -> ()

  let js_vector_close index =
    match M.Vector.Index.close index with Some close -> close () | None -> ()

  let js_vector_index index =
    let query = js_vector_query index in
    let upsert = js_vector_upsert index in
    let delete = js_vector_delete index in
    let truncate () = M.Vector.Index.truncate index in
    let metadata () = js_vector_metadata index in
    let set_metadata = js_vector_set_metadata index in
    let close () = js_vector_close index in
    let vector_index =
      make_vector_index ~query ~upsert ~delete ~truncate ~metadata
        ~setMetadata:set_metadata ~close ()
    in
    set_prop vector_index "upsert!" upsert;
    set_prop vector_index "delete!" delete;
    set_prop vector_index "truncate!" truncate;
    set_prop vector_index "set-metadata!" set_metadata;
    set_prop vector_index "close!" close;
    vector_index

  let js_vector_open_index opts =
    M.Vector.open_index
      { path = vector_open_path opts; dimension = vector_open_dimension opts }
    |> Js.Promise.then_ (fun index ->
        Js.Promise.resolve (js_vector_index index))

  let js_embed_texts texts =
    M.Embedding.embed_texts (Array.to_list texts)
    |> Js.Promise.then_ (fun embeddings ->
        embeddings |> List.map Array.of_list |> Array.of_list
        |> Js.Promise.resolve)

  let env ~root_dir ~owner_source ~recreate_lock_fn () =
    let root_dir = Js.Nullable.fromOption root_dir in
    let owner_source = owner_source_string owner_source in
    let recreate_lock_fn = Js.Nullable.fromOption recreate_lock_fn in
    let env =
      make_env ~publishing:M.Env.publishing
        ~runtime:(runtime_string M.Env.runtime)
        ~rootDir:root_dir ~ownerSource:owner_source
        ~recreateLockFn:recreate_lock_fn ()
    in
    set_prop env "publishing?" M.Env.publishing;
    set_prop env "root-dir" root_dir;
    set_prop env "owner-source" owner_source;
    set_prop env "recreate-lock-fn" recreate_lock_fn;
    env

  let storage =
    let install_opfs_pool = M.Storage.install_opfs_pool in
    let list_graphs () =
      M.Storage.list_graphs ()
      |> Js.Promise.then_ (fun graphs ->
          Js.Promise.resolve (Array.of_list graphs))
    in
    let db_exists = M.Storage.db_exists in
    let resolve_db_path = Js.Nullable.fromOption M.Storage.resolve_db_path in
    let export_file = M.Storage.export_file in
    let import_db = M.Storage.import_db in
    let remove_vfs = M.Storage.remove_vfs in
    let read_text = M.Storage.read_text in
    let write_text = M.Storage.write_text in
    let write_text_atomic =
      Js.Nullable.fromOption M.Storage.write_text_atomic
    in
    let delete_file = Js.Nullable.fromOption M.Storage.delete_file in
    let mirror_read_text = Js.Nullable.fromOption M.Storage.mirror_read_text in
    let asset_read_bytes = M.Storage.asset_read_bytes in
    let asset_write_bytes = M.Storage.asset_write_bytes in
    let asset_stat = js_asset_stat in
    let asset_delete = Js.Nullable.fromOption M.Storage.asset_delete in
    let transfer = Js.Nullable.fromOption M.Storage.transfer in
    let storage =
      make_storage ~installOpfsPool:install_opfs_pool ~listGraphs:list_graphs
        ~dbExists:db_exists ~resolveDbPath:resolve_db_path
        ~exportFile:export_file ~importDb:import_db ~removeVfs:remove_vfs
        ~readText:read_text ~writeText:write_text
        ~writeTextAtomic:write_text_atomic ~deleteFile:delete_file
        ~mirrorReadText:mirror_read_text ~assetReadBytes:asset_read_bytes
        ~assetWriteBytes:asset_write_bytes ~assetStat:asset_stat
        ~assetDelete:asset_delete ~transfer ()
    in
    set_prop storage "install-opfs-pool" install_opfs_pool;
    set_prop storage "list-graphs" list_graphs;
    set_prop storage "db-exists?" db_exists;
    set_prop storage "resolve-db-path" resolve_db_path;
    set_prop storage "export-file" export_file;
    set_prop storage "import-db" import_db;
    set_prop storage "remove-vfs!" remove_vfs;
    set_prop storage "read-text!" read_text;
    set_prop storage "write-text!" write_text;
    set_prop storage "write-text-atomic!" write_text_atomic;
    set_prop storage "delete-file!" delete_file;
    set_prop storage "mirror-read-text!" mirror_read_text;
    set_prop storage "asset-read-bytes!" asset_read_bytes;
    set_prop storage "asset-write-bytes!" asset_write_bytes;
    set_prop storage "asset-stat" asset_stat;
    set_prop storage "asset-delete!" asset_delete;
    set_prop storage "transfer" transfer;
    storage

  let kv =
    let kv = make_kv ~get:js_kv_get ~set:js_kv_set () in
    set_prop kv "set!" js_kv_set;
    kv

  let broadcast =
    let post_message = M.Broadcast.post_message in
    let broadcast = make_broadcast ~postMessage:post_message () in
    set_prop broadcast "post-message!" post_message;
    broadcast

  let websocket = make_websocket ~connect:M.Websocket.connect ()

  let sqlite =
    let close_db = M.Sqlite.close_db in
    let transaction = M.Sqlite.transaction in
    let backup_db = Js.Nullable.fromOption M.Sqlite.backup_db in
    let sqlite =
      make_sqlite ~init:js_sqlite_init ~openDb:js_sqlite_open_db
        ~closeDb:close_db ~exec:js_sqlite_exec ~transaction ~backupDb:backup_db
        ()
    in
    set_prop sqlite "init!" js_sqlite_init;
    set_prop sqlite "open-db" js_sqlite_open_db;
    set_prop sqlite "close-db" close_db;
    set_prop sqlite "backup-db" backup_db;
    sqlite

  let crypto =
    let save_secret_text = M.Crypto.save_secret_text in
    let delete_secret_text = M.Crypto.delete_secret_text in
    let crypto =
      make_crypto ~saveSecretText:save_secret_text
        ~readSecretText:js_crypto_read_secret_text
        ~deleteSecretText:delete_secret_text ()
    in
    set_prop crypto "save-secret-text!" save_secret_text;
    set_prop crypto "read-secret-text" js_crypto_read_secret_text;
    set_prop crypto "delete-secret-text!" delete_secret_text;
    crypto

  let timers =
    let set_interval = M.Timers.set_interval in
    let timers = make_timers ~setInterval:set_interval () in
    set_prop timers "set-interval!" set_interval;
    timers

  let base_platform_with ~root_dir ~owner_source ~recreate_lock_fn () =
    make_base_platform
      ~env:(env ~root_dir ~owner_source ~recreate_lock_fn ())
      ~storage ~kv ~broadcast ~websocket ~sqlite ~crypto ~timers ()

  let base_platform () =
    base_platform_with ~root_dir:M.Env.root_dir ~owner_source:M.Env.owner_source
      ~recreate_lock_fn:M.Env.recreate_lock_fn ()

  let vector ?open_vector_index_fn () =
    let open_index =
      Option.value open_vector_index_fn ~default:js_vector_open_index
    in
    let vector = make_vector ~openIndex:open_index () in
    set_prop vector "open-index" open_index;
    vector

  let embedding ?(model_id = M.Embedding.model_id)
      ?(dimension = M.Embedding.dimension) () =
    let embedding =
      make_embedding ~modelId:model_id ~dimension ~embedTexts:js_embed_texts ()
    in
    set_prop embedding "model-id" model_id;
    set_prop embedding "embed-texts" js_embed_texts;
    embedding

  let platform_with ~root_dir ~owner_source ~recreate_lock_fn ?model_id
      ?dimension ?open_vector_index_fn () =
    make_platform
      ~env:(env ~root_dir ~owner_source ~recreate_lock_fn ())
      ~storage ~kv ~broadcast ~websocket ~sqlite ~crypto ~timers
      ~vector:(vector ?open_vector_index_fn ())
      ~embedding:(embedding ?model_id ?dimension ())
      ()
end
