module Db_platform = Melange_db_worker_spec.Platform
module Node_api = Entry_common.Make (Db_platform.Node)
module Bridge = Entry_bridge.Bridge

module Platform = struct
  type node_platform = Node_api.platform
  type node_options = Js.Json.t
  type js_event_fn = (string -> Js.Json.t -> unit[@u])
  type js_write_guard_fn = (unit -> unit[@u])
  type js_recreate_lock_fn = (unit -> unit[@u])

  type js_open_vector_index_fn =
    (Node_api.vector_open_options -> Node_api.vector_index Js.Promise.t[@u])

  type node_storage =
    ( Db_platform.Node.sqlite_module,
      Db_platform.Node.storage_pool,
      Db_platform.Node.binary,
      Db_platform.Node.transferables )
    Node_api.storage

  type node_sqlite =
    ( Db_platform.Node.sqlite_module,
      Db_platform.Node.storage_pool,
      Db_platform.Node.sqlite_db )
    Node_api.sqlite

  external node_root_dir : node_options -> string Js.Nullable.t = "rootDir"
  [@@mel.get]

  external node_owner_source : node_options -> string Js.Nullable.t
    = "ownerSource"
  [@@mel.get]

  external node_event_fn : node_options -> js_event_fn Js.Nullable.t = "eventFn"
  [@@mel.get]

  external node_write_guard_fn : node_options -> js_write_guard_fn Js.Nullable.t
    = "writeGuardFn"
  [@@mel.get]

  external node_recreate_lock_fn :
    node_options -> js_recreate_lock_fn Js.Nullable.t = "recreateLockFn"
  [@@mel.get]

  external node_embedding_endpoint : node_options -> string Js.Nullable.t
    = "embeddingEndpoint"
  [@@mel.get]

  external node_embedding_model_id : node_options -> string Js.Nullable.t
    = "embeddingModelId"
  [@@mel.get]

  external node_open_vector_index_fn :
    node_options -> js_open_vector_index_fn Js.Nullable.t = "openVectorIndexFn"
  [@@mel.get]

  external node_open_vector_index_fn_legacy :
    node_options ->
    (Node_api.vector_open_options -> Node_api.vector_index Js.Promise.t)
    Js.Nullable.t = "openVectorIndexFn"
  [@@mel.get]

  let node_event_fn_option options =
    node_event_fn options |> Js.Nullable.toOption
    |> Option.map (fun event_fn type_ payload -> (event_fn type_ payload [@u]))

  let node_write_guard_fn_option options =
    node_write_guard_fn options
    |> Js.Nullable.toOption
    |> Option.map (fun write_guard_fn () ->
        Js.Promise.resolve (write_guard_fn () [@u]))

  let node_recreate_lock_fn_option options =
    node_recreate_lock_fn options
    |> Js.Nullable.toOption
    |> Option.map (fun recreate_lock_fn () -> (recreate_lock_fn () [@u]))

  let node_open_vector_index_fn_option options =
    match node_open_vector_index_fn options |> Js.Nullable.toOption with
    | Some open_vector_index_fn ->
        Some (fun opts -> (open_vector_index_fn opts [@u]))
    | None -> Js.Nullable.toOption (node_open_vector_index_fn_legacy options)

  external set_platform_kv : node_platform -> Node_api.kv -> unit = "kv"
  [@@mel.set]

  external set_platform_storage : node_platform -> node_storage -> unit
    = "storage"
  [@@mel.set]

  external set_platform_broadcast : node_platform -> Node_api.broadcast -> unit
    = "broadcast"
  [@@mel.set]

  external set_platform_crypto : node_platform -> Node_api.crypto -> unit
    = "crypto"
  [@@mel.set]

  external set_platform_sqlite : node_platform -> node_sqlite -> unit = "sqlite"
  [@@mel.set]

  external set_platform_vector :
    node_platform -> Node_api.vector_index Node_api.vector -> unit = "vector"
  [@@mel.set]

  external set_platform_embedding : node_platform -> Node_api.embedding -> unit
    = "embedding"
  [@@mel.set]

  let configure_node = function
    | None -> Db_platform.Node.configure ()
    | Some options ->
        Db_platform.Node.configure
          ?root_dir:(Js.Nullable.toOption (node_root_dir options))
          ?owner_source:(Js.Nullable.toOption (node_owner_source options))
          ?event_fn:(node_event_fn_option options)
          ?write_guard_fn:(node_write_guard_fn_option options)
          ?recreate_lock_fn:(node_recreate_lock_fn_option options)
          ?embedding_endpoint:
            (Js.Nullable.toOption (node_embedding_endpoint options))
          ?embedding_model_id:
            (Js.Nullable.toOption (node_embedding_model_id options))
          ()

  let scoped_kv options =
    let get key =
      configure_node options;
      Node_api.js_kv_get key
    in
    let set key value =
      configure_node options;
      Node_api.js_kv_set key value
    in
    Node_api.make_kv ~get ~set ()

  let scoped_broadcast options =
    let post_message type_ payload =
      configure_node options;
      Db_platform.Node.Broadcast.post_message type_ payload
    in
    Node_api.make_broadcast ~postMessage:post_message ()

  let scoped_crypto options =
    let save_secret_text key text =
      configure_node options;
      Db_platform.Node.Crypto.save_secret_text key text
    in
    let read_secret_text key =
      configure_node options;
      Node_api.js_crypto_read_secret_text key
    in
    let delete_secret_text key =
      configure_node options;
      Db_platform.Node.Crypto.delete_secret_text key
    in
    Node_api.make_crypto ~saveSecretText:save_secret_text
      ~readSecretText:read_secret_text ~deleteSecretText:delete_secret_text ()

  let scoped_sqlite options =
    let init () =
      configure_node options;
      Node_api.js_sqlite_init ()
    in
    let open_db opts =
      configure_node options;
      Node_api.js_sqlite_open_db opts
    in
    let close_db db =
      configure_node options;
      Db_platform.Node.Sqlite.close_db db
    in
    let exec db input =
      configure_node options;
      Node_api.js_sqlite_exec db input
    in
    let transaction db f =
      configure_node options;
      Db_platform.Node.Sqlite.transaction db f
    in
    let backup_db =
      Db_platform.Node.Sqlite.backup_db
      |> Option.map (fun f db path ->
          configure_node options;
          f db path)
      |> Js.Nullable.fromOption
    in
    Node_api.make_sqlite ~init ~openDb:open_db ~closeDb:close_db ~exec
      ~transaction ~backupDb:backup_db ()

  let scoped_vector options open_vector_index_fn =
    let open_index =
      match open_vector_index_fn with
      | Some open_vector_index_fn ->
          fun opts ->
            configure_node options;
            open_vector_index_fn opts
      | None ->
          fun opts ->
            configure_node options;
            Node_api.js_vector_open_index opts
    in
    Node_api.make_vector ~openIndex:open_index ()

  let scoped_embedding options ~model_id ~dimension =
    let embed_texts texts =
      configure_node options;
      Node_api.js_embed_texts texts
    in
    Node_api.make_embedding ~modelId:model_id ~dimension ~embedTexts:embed_texts
      ()

  let scoped_storage options =
    let configure () = configure_node options in
    let install_opfs_pool sqlite pool_name =
      configure ();
      Db_platform.Node.Storage.install_opfs_pool sqlite pool_name
    in
    let list_graphs () =
      configure ();
      Db_platform.Node.Storage.list_graphs ()
      |> Js.Promise.then_ (fun graphs ->
          Js.Promise.resolve (Array.of_list graphs))
    in
    let db_exists graph =
      configure ();
      Db_platform.Node.Storage.db_exists graph
    in
    let resolve_db_path =
      Db_platform.Node.Storage.resolve_db_path
      |> Option.map (fun f repo pool path ->
          configure ();
          f repo pool path)
      |> Js.Nullable.fromOption
    in
    let export_file pool path =
      configure ();
      Db_platform.Node.Storage.export_file pool path
    in
    let import_db pool path payload =
      configure ();
      Db_platform.Node.Storage.import_db pool path payload
    in
    let remove_vfs pool =
      configure ();
      Db_platform.Node.Storage.remove_vfs pool
    in
    let read_text path =
      configure ();
      Db_platform.Node.Storage.read_text path
    in
    let write_text path text =
      configure ();
      Db_platform.Node.Storage.write_text path text
    in
    let write_text_atomic =
      Db_platform.Node.Storage.write_text_atomic
      |> Option.map (fun f path text ->
          configure ();
          f path text)
      |> Js.Nullable.fromOption
    in
    let delete_file =
      Db_platform.Node.Storage.delete_file
      |> Option.map (fun f path ->
          configure ();
          f path)
      |> Js.Nullable.fromOption
    in
    let mirror_read_text =
      Db_platform.Node.Storage.mirror_read_text
      |> Option.map (fun f path ->
          configure ();
          f path)
      |> Js.Nullable.fromOption
    in
    let asset_read_bytes repo file_name =
      configure ();
      Db_platform.Node.Storage.asset_read_bytes repo file_name
    in
    let asset_write_bytes repo file_name payload =
      configure ();
      Db_platform.Node.Storage.asset_write_bytes repo file_name payload
    in
    let asset_stat repo file_name =
      configure ();
      Node_api.js_asset_stat repo file_name
    in
    let asset_delete =
      Db_platform.Node.Storage.asset_delete
      |> Option.map (fun f repo file_name ->
          configure ();
          f repo file_name)
      |> Js.Nullable.fromOption
    in
    let transfer =
      Db_platform.Node.Storage.transfer
      |> Option.map (fun f value transferables ->
          configure ();
          f value transferables)
      |> Js.Nullable.fromOption
    in
    Node_api.make_storage ~installOpfsPool:install_opfs_pool
      ~listGraphs:list_graphs ~dbExists:db_exists ~resolveDbPath:resolve_db_path
      ~exportFile:export_file ~importDb:import_db ~removeVfs:remove_vfs
      ~readText:read_text ~writeText:write_text
      ~writeTextAtomic:write_text_atomic ~deleteFile:delete_file
      ~mirrorReadText:mirror_read_text ~assetReadBytes:asset_read_bytes
      ~assetWriteBytes:asset_write_bytes ~assetStat:asset_stat
      ~assetDelete:asset_delete ~transfer ()

  let node_platform options =
    let options = Js.Nullable.toOption options in
    configure_node options;
    let model_id = Db_platform.Node.current_embedding_model_id () in
    let open_vector_index_fn =
      match options with
      | Some options -> node_open_vector_index_fn_option options
      | None -> None
    in
    let platform =
      Node_api.platform_with
        ~root_dir:(Db_platform.Node.current_root_dir_option ())
        ~owner_source:(Db_platform.Node.current_owner_source ())
        ~recreate_lock_fn:(Db_platform.Node.current_recreate_lock_fn ())
        ~model_id ?open_vector_index_fn
        ~dimension:(Db_platform.Node.embedding_dimension_for_model model_id)
        ()
    in
    set_platform_storage platform (scoped_storage options);
    set_platform_kv platform (scoped_kv options);
    set_platform_broadcast platform (scoped_broadcast options);
    set_platform_crypto platform (scoped_crypto options);
    set_platform_sqlite platform (scoped_sqlite options);
    set_platform_vector platform (scoped_vector options open_vector_index_fn);
    set_platform_embedding platform
      (scoped_embedding options ~model_id
         ~dimension:(Db_platform.Node.embedding_dimension_for_model model_id));
    platform

  let node = node_platform Js.Nullable.undefined
end
