type adapter
type sqlite
type storage
type connection
type encoded_open = { sqlite : sqlite; conn : connection }
type string_callback = (string -> string[@u])
type string_pair_callback = (string -> string -> string[@u])
type bool_callback = (string -> bool[@u])
type optional_string_callback = (unit -> string Js.Nullable.t[@u])
type unit_string_callback = (unit -> string[@u])
type open_callback = (string -> sqlite[@u])
type sqlite_unit_callback = (sqlite -> unit[@u])
type storage_callback = (sqlite -> storage[@u])
type connection_callback = (storage -> connection[@u])

type value_string_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value -> string[@u])

type string_value_callback =
  (string -> Melange_cljs_runtime_spec.Value_codec.cljs_value[@u])

type make_row_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
   string ->
   string Js.Nullable.t ->
   Melange_cljs_runtime_spec.Value_codec.cljs_value
  [@u])

type upsert_rows_callback =
  (sqlite -> Melange_cljs_runtime_spec.Value_codec.cljs_value array -> unit[@u])

type load_row_callback =
  (sqlite ->
   Melange_cljs_runtime_spec.Value_codec.cljs_value ->
   Melange_cljs_runtime_spec.Value_codec.cljs_value Js.Nullable.t
  [@u])

type row_content_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value -> string[@u])

type row_addresses_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value -> string Js.Nullable.t[@u])

type store_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
   Melange_cljs_runtime_spec.Value_codec.cljs_value ->
   unit
  [@u])

type restore_callback =
  (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
   Melange_cljs_runtime_spec.Value_codec.cljs_value
  [@u])

type create_datascript_storage_callback =
  (store_callback -> restore_callback -> storage[@u])

external is_absolute_fn : adapter -> bool_callback = "isAbsolute" [@@mel.get]
external dirname_fn : adapter -> string_callback = "dirname" [@@mel.get]
external basename_fn : adapter -> string_callback = "basename" [@@mel.get]
external join_fn : adapter -> string_pair_callback = "join" [@@mel.get]

external original_pwd_fn : adapter -> optional_string_callback = "originalPwd"
[@@mel.get]

external default_graphs_dir_fn : adapter -> unit_string_callback
  = "defaultGraphsDir"
[@@mel.get]

external expand_home_fn : adapter -> string_callback = "expandHome" [@@mel.get]
external open_sqlite_fn : adapter -> open_callback = "openSqlite" [@@mel.get]

external create_table_fn : adapter -> sqlite_unit_callback = "createTable"
[@@mel.get]

external create_storage_fn : adapter -> storage_callback = "createStorage"
[@@mel.get]

external storage_connection_fn : adapter -> connection_callback
  = "storageConnection"
[@@mel.get]

external write_transit_fn : adapter -> value_string_callback = "writeTransit"
[@@mel.get]

external read_transit_fn : adapter -> string_value_callback = "readTransit"
[@@mel.get]

external stringify_json_fn : adapter -> value_string_callback = "stringifyJson"
[@@mel.get]

external parse_json_fn : adapter -> string_value_callback = "parseJson"
[@@mel.get]

external make_row_fn : adapter -> make_row_callback = "makeRow" [@@mel.get]

external upsert_rows_fn : adapter -> upsert_rows_callback = "upsertRows"
[@@mel.get]

external load_row_fn : adapter -> load_row_callback = "loadRow" [@@mel.get]

external row_content_fn : adapter -> row_content_callback = "rowContent"
[@@mel.get]

external row_addresses_fn : adapter -> row_addresses_callback = "rowAddresses"
[@@mel.get]

external create_datascript_storage_fn :
  adapter -> create_datascript_storage_callback = "createDatascriptStorage"
[@@mel.get]

let database_path graphs_dir db_name =
  let graph_dir_name =
    Melange_common.Graph_dir.repo_to_encoded_graph_dir_name (Some db_name)
    |> Option.value ~default:(invalid_arg "SQLite CLI graph name is empty")
  in
  let graph_dir =
    Melange_common.Path.path_join (Some graphs_dir) [| Some graph_dir_name |]
  in
  Melange_common.Path.path_join (Some graph_dir) [| Some "db.sqlite" |]

let open_path graphs_dir db_name =
  match Js.Nullable.toOption graphs_dir with
  | None -> db_name
  | Some graphs_dir -> database_path graphs_dir db_name

let openWith adapter graphs_dir db_name =
  let path = open_path graphs_dir db_name in
  let open_sqlite = open_sqlite_fn adapter in
  let create_table = create_table_fn adapter in
  let create_storage = create_storage_fn adapter in
  let storage_connection = storage_connection_fn adapter in
  let sqlite = (open_sqlite path [@u]) in
  create_table sqlite [@u];
  let storage = (create_storage sqlite [@u]) in
  let conn = (storage_connection storage [@u]) in
  { sqlite; conn }

let openConnectionWith adapter graphs_dir db_name =
  (openWith adapter graphs_dir db_name).conn

let openArgsWith adapter graph_dir_or_path =
  let is_absolute = is_absolute_fn adapter in
  let dirname = dirname_fn adapter in
  let basename = basename_fn adapter in
  let join = join_fn adapter in
  let original_pwd = original_pwd_fn adapter in
  let default_graphs_dir = default_graphs_dir_fn adapter in
  let expand_home = expand_home_fn adapter in
  if is_absolute graph_dir_or_path [@u] then [| graph_dir_or_path |]
  else if String.contains graph_dir_or_path '/' then
    let path =
      let base =
        (original_pwd () [@u]) |> Js.Nullable.toOption
        |> Option.value ~default:"."
      in
      (join base graph_dir_or_path [@u])
    in
    [| (dirname path [@u]); (basename path [@u]) |]
  else [| (expand_home (default_graphs_dir () [@u]) [@u]); graph_dir_or_path |]

let newStorageWith runtime adapter sqlite =
  let write_transit = write_transit_fn adapter in
  let read_transit = read_transit_fn adapter in
  let stringify_json = stringify_json_fn adapter in
  let parse_json = parse_json_fn adapter in
  let make_row = make_row_fn adapter in
  let upsert_rows = upsert_rows_fn adapter in
  let load_row = load_row_fn adapter in
  let row_content = row_content_fn adapter in
  let row_addresses = row_addresses_fn adapter in
  let create_datascript_storage = create_datascript_storage_fn adapter in
  let addresses_key =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
      "addresses"
  in
  let store address_data _delete_addresses =
    let rows =
      address_data
      |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
      |> Array.map (fun entry ->
          match
            Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
              entry
          with
          | [| address; data |] ->
              let data, addresses =
                if
                  Melange_cljs_runtime_spec.Value_codec.value_is_map runtime
                    data
                then
                  let addresses =
                    Melange_cljs_runtime_spec.Value_codec.map_get runtime data
                      addresses_key
                  in
                  let addresses =
                    if
                      Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
                        addresses
                    then None
                    else Some (stringify_json addresses [@u])
                  in
                  ( Melange_cljs_runtime_spec.Value_codec.map_dissoc runtime
                      data addresses_key,
                    addresses )
                else (data, None)
              in
              let content = (write_transit data [@u]) in
              (make_row address content (Js.Nullable.fromOption addresses) [@u])
          | _ -> invalid_arg "SQLite storage entry requires [address data]")
    in
    (upsert_rows sqlite rows [@u])
  in
  let restore address =
    match (load_row sqlite address [@u]) |> Js.Nullable.toOption with
    | None -> Melange_cljs_runtime_spec.Value_codec.nil_value runtime
    | Some row -> (
        let data = (read_transit (row_content row [@u]) [@u]) in
        let addresses =
          Option.bind
            ((row_addresses row [@u]) |> Js.Nullable.toOption)
            (fun value ->
              if String.equal value "" then None
              else Some (parse_json value [@u]))
        in
        match addresses with
        | Some addresses
          when Melange_cljs_runtime_spec.Value_codec.value_is_map runtime data
          ->
            Melange_cljs_runtime_spec.Value_codec.map_assoc runtime data
              addresses_key addresses
        | Some _ | None -> data)
  in
  (create_datascript_storage
     (fun[@u] address_data delete_addresses ->
       store address_data delete_addresses)
     (fun[@u] address -> restore address) [@u])

let openStorageWith runtime adapter graphs_dir db_name =
  let path = open_path graphs_dir db_name in
  let open_sqlite = open_sqlite_fn adapter in
  let create_table = create_table_fn adapter in
  let storage_connection = storage_connection_fn adapter in
  let sqlite = (open_sqlite path [@u]) in
  create_table sqlite [@u];
  let storage = newStorageWith runtime adapter sqlite in
  let conn = (storage_connection storage [@u]) in
  { sqlite; conn }

let openStorageConnectionWith runtime adapter graphs_dir db_name =
  (openStorageWith runtime adapter graphs_dir db_name).conn
