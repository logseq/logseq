module Db_platform = Melange_db_worker_spec.Platform
module Node_api = Entry_common.Make (Db_platform.Node)

module Platform = struct
  type node_platform = Node_api.platform
  type node_options = Js.Json.t
  type js_event_fn = (string -> Js.Json.t -> unit[@u])
  type js_write_guard_fn = (unit -> unit Js.Promise.t[@u])
  type js_recreate_lock_fn = (unit -> unit[@u])

  type js_open_vector_index_fn =
    (Node_api.vector_open_options -> Node_api.vector_index Js.Promise.t[@u])

  external node_root_dir : node_options -> string Js.Nullable.t = "rootDir"
  [@@mel.get]

  external node_root_dir_kebab : node_options -> string Js.Nullable.t
    = "root-dir"
  [@@mel.get]

  external node_owner_source : node_options -> string Js.Nullable.t
    = "ownerSource"
  [@@mel.get]

  external node_owner_source_kebab : node_options -> string Js.Nullable.t
    = "owner-source"
  [@@mel.get]

  external node_event_fn : node_options -> js_event_fn Js.Nullable.t = "eventFn"
  [@@mel.get]

  external node_event_fn_kebab : node_options -> js_event_fn Js.Nullable.t
    = "event-fn"
  [@@mel.get]

  external node_write_guard_fn : node_options -> js_write_guard_fn Js.Nullable.t
    = "writeGuardFn"
  [@@mel.get]

  external node_write_guard_fn_kebab :
    node_options -> js_write_guard_fn Js.Nullable.t = "write-guard-fn"
  [@@mel.get]

  external node_recreate_lock_fn :
    node_options -> js_recreate_lock_fn Js.Nullable.t = "recreateLockFn"
  [@@mel.get]

  external node_recreate_lock_fn_kebab :
    node_options -> js_recreate_lock_fn Js.Nullable.t = "recreate-lock-fn"
  [@@mel.get]

  external node_embedding_endpoint : node_options -> string Js.Nullable.t
    = "embeddingEndpoint"
  [@@mel.get]

  external node_embedding_endpoint_kebab : node_options -> string Js.Nullable.t
    = "embedding-endpoint"
  [@@mel.get]

  external node_embedding_model_id : node_options -> string Js.Nullable.t
    = "embeddingModelId"
  [@@mel.get]

  external node_embedding_model_id_kebab : node_options -> string Js.Nullable.t
    = "embedding-model-id"
  [@@mel.get]

  external node_open_vector_index_fn :
    node_options -> js_open_vector_index_fn Js.Nullable.t = "openVectorIndexFn"
  [@@mel.get]

  external node_open_vector_index_fn_kebab :
    node_options -> js_open_vector_index_fn Js.Nullable.t
    = "open-vector-index-fn"
  [@@mel.get]

  external node_open_vector_index_fn_legacy :
    node_options ->
    (Node_api.vector_open_options -> Node_api.vector_index Js.Promise.t)
    Js.Nullable.t = "openVectorIndexFn"
  [@@mel.get]

  external node_open_vector_index_fn_kebab_legacy :
    node_options ->
    (Node_api.vector_open_options -> Node_api.vector_index Js.Promise.t)
    Js.Nullable.t = "open-vector-index-fn"
  [@@mel.get]

  let nullable_or primary fallback =
    if Js.Nullable.isNullable primary then fallback else primary

  let node_event_fn_option options =
    nullable_or (node_event_fn options) (node_event_fn_kebab options)
    |> Js.Nullable.toOption
    |> Option.map (fun event_fn type_ payload -> (event_fn type_ payload [@u]))

  let node_write_guard_fn_option options =
    nullable_or
      (node_write_guard_fn options)
      (node_write_guard_fn_kebab options)
    |> Js.Nullable.toOption
    |> Option.map (fun write_guard_fn () -> (write_guard_fn () [@u]))

  let node_recreate_lock_fn_option options =
    nullable_or
      (node_recreate_lock_fn options)
      (node_recreate_lock_fn_kebab options)
    |> Js.Nullable.toOption
    |> Option.map (fun recreate_lock_fn () -> (recreate_lock_fn () [@u]))

  let node_open_vector_index_fn_option options =
    match
      nullable_or
        (node_open_vector_index_fn options)
        (node_open_vector_index_fn_kebab options)
      |> Js.Nullable.toOption
    with
    | Some open_vector_index_fn ->
        Some (fun opts -> (open_vector_index_fn opts [@u]))
    | None ->
        Js.Nullable.toOption
          (nullable_or
             (node_open_vector_index_fn_legacy options)
             (node_open_vector_index_fn_kebab_legacy options))

  let configure_node = function
    | None -> Db_platform.Node.configure ()
    | Some options ->
        Db_platform.Node.configure
          ?root_dir:
            (Js.Nullable.toOption
               (nullable_or (node_root_dir options)
                  (node_root_dir_kebab options)))
          ?owner_source:
            (Js.Nullable.toOption
               (nullable_or
                  (node_owner_source options)
                  (node_owner_source_kebab options)))
          ?event_fn:(node_event_fn_option options)
          ?write_guard_fn:(node_write_guard_fn_option options)
          ?recreate_lock_fn:(node_recreate_lock_fn_option options)
          ?embedding_endpoint:
            (Js.Nullable.toOption
               (nullable_or
                  (node_embedding_endpoint options)
                  (node_embedding_endpoint_kebab options)))
          ?embedding_model_id:
            (Js.Nullable.toOption
               (nullable_or
                  (node_embedding_model_id options)
                  (node_embedding_model_id_kebab options)))
          ()

  let node_platform options =
    let options = Js.Nullable.toOption options in
    configure_node options;
    let model_id = Db_platform.Node.current_embedding_model_id () in
    let open_vector_index_fn =
      match options with
      | Some options -> node_open_vector_index_fn_option options
      | None -> None
    in
    Node_api.platform_with
      ~root_dir:(Db_platform.Node.current_root_dir_option ())
      ~owner_source:(Db_platform.Node.current_owner_source ())
      ~recreate_lock_fn:(Db_platform.Node.current_recreate_lock_fn ())
      ~model_id ?open_vector_index_fn
      ~dimension:(Db_platform.Node.embedding_dimension_for_model model_id)
      ()

  let node = node_platform Js.Nullable.undefined
end
