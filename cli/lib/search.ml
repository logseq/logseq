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
             (Edn_util.keyword_t "missing-query-text")
             "query text is required")
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
  Edn_util.map [ (Edn_util.keyword ":items", Edn_util.vector items) ]

let sym name = Edn_util.string ("~$" ^ name)
let kw name = Edn_util.keyword name
let vector values = Edn_util.vector values
let list values = Edn_util.list values
let variable name = sym ("?" ^ name)
let call name args = list (sym name :: args)

let pull_attrs = function
  | Block ->
      [
        kw ":db/id";
        kw ":db/ident";
        kw ":block/title";
        kw ":logseq.property/deleted-at";
        Edn_util.map [ (kw ":block/parent", sym "...") ];
      ]
  | Page ->
      [
        kw ":db/id";
        kw ":db/ident";
        kw ":block/title";
        kw ":logseq.property/deleted-at";
      ]
  | Property | Tag -> [ kw ":db/id"; kw ":db/ident"; kw ":block/title" ]

let text_attr = function
  | Block -> kw ":block/title"
  | Page -> kw ":block/name"
  | Property | Tag -> kw ":block/title"

let class_filter = function
  | Property -> Some (kw ":logseq.class/Property")
  | Tag -> Some (kw ":logseq.class/Tag")
  | Block | Page -> None

let query_of_scope scope =
  let entity = variable "e" in
  let query = variable "query" in
  let title = variable "title" in
  let title_lower = variable "title-lower" in
  let query_lower = variable "query-lower" in
  let where =
    ( ( ( ( [] |> fun clauses ->
            vector
              [ call "clojure.string/includes?" [ title_lower; query_lower ] ]
            :: clauses )
        |> fun clauses ->
          vector [ call "clojure.string/lower-case" [ query ]; query_lower ]
          :: clauses )
      |> fun clauses ->
        vector [ call "clojure.string/lower-case" [ title ]; title_lower ]
        :: clauses )
    |> fun clauses -> vector [ entity; text_attr scope; title ] :: clauses )
    |> fun clauses ->
    match class_filter scope with
    | Some class_ -> vector [ entity; kw ":block/tags"; class_ ] :: clauses
    | None -> clauses
  in
  vector
    ([
       kw ":find";
       vector
         [ list [ sym "pull"; entity; vector (pull_attrs scope) ]; sym "..." ];
       kw ":in";
       sym "$";
       query;
       kw ":where";
     ]
    @ where)

let search_result_keys = [ ":db/id"; ":db/ident"; ":block/title" ]

let select_search_item item =
  Edn_util.map
    (List.filter_map
       (fun key ->
         Option.map
           (fun value -> (Edn_util.keyword key, value))
           (Edn_util.get item key))
       search_result_keys)

let rec recycled item =
  match Edn_util.as_map item with
  | Some _ -> (
      Option.is_some (Edn_util.get item ":logseq.property/deleted-at")
      ||
      match Edn_util.get item ":block/parent" with
      | Some parent -> recycled parent
      | None -> false)
  | None -> false

let compare_search_item a b =
  let title item =
    Edn_util.get_string item ":block/title"
    |> Option.value ~default:"" |> String.lowercase_ascii
  in
  let id item =
    Edn_util.get_int64 item ":db/id" |> Option.value ~default:Int64.max_int
  in
  let title_cmp = String.compare (title a) (title b) in
  if title_cmp <> 0 then title_cmp else Int64.compare (id a) (id b)

let normalize_items scope items =
  let items =
    match scope with
    | Block | Page -> List.filter (fun item -> not (recycled item)) items
    | Property | Tag -> items
  in
  items
  |> List.filter (fun value -> Option.is_some (Edn_util.as_map value))
  |> List.map select_search_item
  |> List.sort compare_search_item

let normalize_uuid_refs config repo items =
  let entities = List.map Entity.of_value items in
  let uuids =
    Uuid_refs_types.collect_uuid_refs_from_items entities
      [ Edn_util.keyword_t ":block/title" ]
  in
  match uuids with
  | [] -> Cli_effect.pure items
  | uuids ->
      Cli_effect.map
        (fun labels ->
          Uuid_refs_types.normalize_item_string_fields entities
            [ Edn_util.keyword_t ":block/title" ]
            labels
          |> List.map (fun item -> item.Entity.raw))
        (Uuid_refs_types.fetch_uuid_labels config repo uuids)

let execute action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false) (function
    | Error err -> pure (Output_mode.error ~command:action.command mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_q invoke_config ~repo:action.repo
             ~query:
               (Edn_util.vector_t
                  [ query_of_scope action.scope; Edn_util.string action.query ]))
          (fun value ->
            let items =
              match (Edn_util.as_vector value, Edn_util.as_list value) with
              | Some xs, _ | _, Some xs -> xs
              | _ when Edn_util.is_null value -> []
              | _ -> [ value ]
            in
            let items = normalize_items action.scope items in
            bind (normalize_uuid_refs config action.repo items) (fun items ->
                pure
                  (Cli_result.ok ~command:action.command mode
                     (Raw (items_value items))))))

let meta ?(examples = []) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = [];
    category = Command_registry.Graph_inspect_and_edit;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
  }

let metadata () =
  [
    meta
      ~examples:[ "logseq search block --content \"task\" --graph my-graph" ]
      Command_id.Search_block "Search blocks by title";
    meta
      ~examples:[ "logseq search page --content \"home\" --graph my-graph" ]
      Search_page "Search pages by name";
    meta
      ~examples:
        [ "logseq search property --content \"owner\" --graph my-graph" ]
      Search_property "Search properties by title";
    meta
      ~examples:[ "logseq search tag --content \"quote\" --graph my-graph" ]
      Search_tag "Search tags by title";
  ]
