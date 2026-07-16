type scope = Block | Page | Property | Tag
type opts = { content : string }

type parsed =
  | Parsed_block of opts
  | Parsed_page of opts
  | Parsed_property of opts
  | Parsed_tag of opts

type action = {
  scope : scope;
  command : Command_id.t;
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  query : string;
}

let scope_of_parsed = function
  | Parsed_block _ -> Block
  | Parsed_page _ -> Page
  | Parsed_property _ -> Property
  | Parsed_tag _ -> Tag

let command_id = function
  | Parsed_block _ -> Command_id.Search_block
  | Parsed_page _ -> Search_page
  | Parsed_property _ -> Search_property
  | Parsed_tag _ -> Search_tag

let validate_parsed _ = Ok ()

let opts_of_parsed = function
  | Parsed_block opts
  | Parsed_page opts
  | Parsed_property opts
  | Parsed_tag opts ->
      opts

let trim_query parsed = (opts_of_parsed parsed).content |> String.trim

let build ?registry:_ config _globals parsed =
  match config.Cli_config.repo with
  | None -> Error (Error.missing_repo "repo is required for search")
  | Some repo ->
      let query = trim_query parsed in
      if query = "" then
        Error
          (Error.make
             ~hint:
               "Use: logseq search <block|page|property|tag> --content <query>"
             Error.Missing_query_text "query text is required")
      else
        Ok
          {
            scope = scope_of_parsed parsed;
            command = command_id parsed;
            repo;
            graph = Cli_config.repo_to_graph repo;
            query;
          }

let items_value items =
  Edn_util.map_vec
    (Vec.of_array [| (Edn_util.keyword "items", Edn_util.vector_vec items) |])

let sym name = Edn_util.symbol name
let kw name = Edn_util.keyword name
let vector_vec values = Edn_util.vector_vec values
let vector values = vector_vec values
let list_vec values = Edn_util.list_vec values
let variable name = sym ("?" ^ name)
let call name args = Edn_util.list_vec (Vec.push_front args (sym name))
let where_v values = Cli_primitive.V (Edn_util.vector_t_vec values)

let query_value query =
  Edn_util.any (Cli_primitive.datascript_query_to_edn query)

let pull_attrs = function
  | Block ->
      Vec.of_array
        [|
          kw "db/id";
          kw "db/ident";
          kw "block/title";
          kw "logseq.property/deleted-at";
          Edn_util.map_vec (Vec.of_array [| (kw "block/parent", sym "...") |]);
        |]
  | Page ->
      Vec.of_array
        [|
          kw "db/id";
          kw "db/ident";
          kw "block/title";
          kw "logseq.property/deleted-at";
        |]
  | Property | Tag ->
      Vec.of_array [| kw "db/id"; kw "db/ident"; kw "block/title" |]

let text_attr = function
  | Block -> kw "block/title"
  | Page -> kw "block/name"
  | Property | Tag -> kw "block/title"

let class_filter = function
  | Property -> Some (kw "logseq.class/Property")
  | Tag -> Some (kw "logseq.class/Tag")
  | Block | Page -> None

let query_of_scope scope =
  let entity = variable "e" in
  let query = variable "query" in
  let title = variable "title" in
  let title_lower = variable "title-lower" in
  let query_lower = variable "query-lower" in
  let where =
    Vec.of_array
      [|
        where_v (Vec.of_array [| entity; text_attr scope; title |]);
        where_v
          (Vec.of_array
             [|
               call "clojure.string/lower-case" (Vec.singleton title);
               title_lower;
             |]);
        where_v
          (Vec.of_array
             [|
               call "clojure.string/lower-case" (Vec.singleton query);
               query_lower;
             |]);
        where_v
          (Vec.of_array
             [|
               call "clojure.string/includes?"
                 (Vec.of_array [| title_lower; query_lower |]);
             |]);
      |]
    |> fun clauses ->
    match class_filter scope with
    | Some class_ ->
        Vec.push_front clauses
          (where_v (Vec.of_array [| entity; kw "block/tags"; class_ |]))
    | None -> clauses
  in
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.of_array
         [|
           vector_vec
             (Vec.of_array
                [|
                  list_vec
                    (Vec.of_array
                       [| sym "pull"; entity; vector (pull_attrs scope) |]);
                  sym "...";
                |]);
         |])
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?query";
         |])
    ~where ()

let search_result_keys = Vec.of_array [| "db/id"; "db/ident"; "block/title" |]

let select_search_item item =
  Edn_util.map_vec
    (Vec.filter_map
       (fun key ->
         Option.map
           (fun value -> (Edn_util.keyword key, value))
           (Edn_util.get item key))
       search_result_keys)

let rec recycled item =
  match Edn_util.as_map item with
  | Some _ -> (
      Option.is_some (Edn_util.get item "logseq.property/deleted-at")
      ||
      match Edn_util.get item "block/parent" with
      | Some parent -> recycled parent
      | None -> false)
  | None -> false

let compare_search_item a b =
  let title item =
    Edn_util.get_string item "block/title"
    |> Option.value ~default:"" |> String.lowercase_ascii
  in
  let id item =
    Edn_util.get_int64 item "db/id" |> Option.value ~default:Int64.max_int
  in
  let title_cmp = String.compare (title a) (title b) in
  if title_cmp <> 0 then title_cmp else Int64.compare (id a) (id b)

let normalize_items scope items =
  let items =
    match scope with
    | Block | Page -> Vec.filter (fun item -> not (recycled item)) items
    | Property | Tag -> items
  in
  items
  |> Vec.filter (fun value -> Option.is_some (Edn_util.as_map value))
  |> Vec.map select_search_item
  |> Vec.sort compare_search_item

let normalize_uuid_refs config repo items =
  let entities = Vec.map Entity.of_value items in
  let uuids =
    Uuid_refs_types.collect_uuid_refs_from_items entities
      (Vec.singleton (Edn_util.keyword_t "block/title"))
  in
  if Vec.is_empty uuids then Cli_effect.pure items
  else
    Cli_effect.map
      (fun labels ->
        Uuid_refs_types.normalize_item_string_fields entities
          (Vec.singleton (Edn_util.keyword_t "block/title"))
          labels
        |> Vec.map (fun item -> item.Entity.raw))
      (Uuid_refs_types.fetch_uuid_labels config repo uuids)

let execute_with_mode action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err -> pure (Output_mode.error ~command:action.command mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_q invoke_config ~repo:action.repo
             ~query:
               (Edn_util.vector_t_vec
                  (Vec.of_array
                     [|
                       query_value (query_of_scope action.scope);
                       Edn_util.string action.query;
                     |])))
          (fun value ->
            let items =
              match (Edn_util.as_vector value, Edn_util.as_list value) with
              | Some xs, _ | _, Some xs -> xs
              | _ when Edn_util.is_null value -> Vec.empty
              | _ -> Vec.singleton value
            in
            let items = normalize_items action.scope items in
            bind (normalize_uuid_refs config action.repo items) (fun items ->
                pure
                  (Cli_result.ok ~command:action.command mode
                     (Raw (items_value items))))))

let meta ?(examples = Vec.empty) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = Vec.empty;
    category = Command_registry.Graph_inspect_and_edit;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = Vec.empty;
  }

let metadata () =
  Vec.of_array
    [|
      meta
        ~examples:
          (Vec.singleton
             "logseq search block --content \"task\" --graph my-graph")
        Command_id.Search_block "Search blocks by title";
      meta
        ~examples:
          (Vec.singleton
             "logseq search page --content \"home\" --graph my-graph")
        Search_page "Search pages by name";
      meta
        ~examples:
          (Vec.singleton
             "logseq search property --content \"owner\" --graph my-graph")
        Search_property "Search properties by title";
      meta
        ~examples:
          (Vec.singleton
             "logseq search tag --content \"quote\" --graph my-graph")
        Search_tag "Search tags by title";
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
