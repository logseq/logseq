type target =
  | By_id of Cli_primitive.db_id
  | By_ids of Cli_primitive.db_id Rrbvec.t
  | By_uuid of Cli_primitive.uuid
  | By_page of string

type opts = {
  id_raw : string option;
  uuid : Cli_primitive.uuid option;
  page : string option;
  page_hierarchy : bool;
  linked_references : bool option;
  ref_id_footer : bool option;
  level : int option;
  stdin_id : string option;
}

type parsed = Parsed_show of opts

type action = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target : target;
  multi_id : bool;
  linked_references : bool;
  ref_id_footer : bool;
  page_hierarchy : bool;
  level : int option;
}

type linked_references = { count : int; blocks : Block.t Rrbvec.t }

type tree_data = {
  root : Block.t;
  linked_references : linked_references option;
  referenced_uuids : Cli_primitive.uuid Rrbvec.t;
  uuid_to_entity : (Cli_primitive.uuid * Entity.t) Rrbvec.t;
  breadcrumb_line : string option;
}

let is_integer_text value =
  let value = String.trim value in
  let len = String.length value in
  if len = 0 then false
  else
    let start = if value.[0] = '-' then 1 else 0 in
    start < len
    && String.for_all
         (fun c -> c >= '0' && c <= '9')
         (String.sub value start (len - start))

let split_lines value =
  Vec.split_on_char '\n' value
  |> Vec.map String.trim
  |> Vec.filter (fun line -> line <> "")

let split_ws value =
  Vec.split_on_char ' ' value
  |> Vec.concat_map (fun value -> Vec.split_on_char '\t' value)
  |> Vec.map String.trim
  |> Vec.filter (fun token -> token <> "")

let bracketed_id_vector value =
  let value = String.trim value in
  let len = String.length value in
  len >= 2
  && value.[0] = '['
  && value.[len - 1] = ']'
  &&
  let body = String.sub value 1 (len - 2) in
  Vec.split_on_char ',' body |> Vec.concat_map split_ws
  |> Vec.for_all is_integer_text

let normalize_stdin_id = function
  | Some raw ->
      let text = String.trim raw in
      if text = "" then None
      else if bracketed_id_vector text || is_integer_text text then Some text
      else
        let lines = split_lines text in
        let last_line = Option.value (Vec.peek_back_opt lines) ~default:"" in
        if bracketed_id_vector last_line then Some last_line
        else
          let tokens = split_ws text in
          if (not (Vec.is_empty tokens)) && Vec.for_all is_integer_text tokens
          then
            Some
              (Melange_edn_melange.to_edn_string
                 (Edn_util.vector_vec
                    (tokens
                    |> Vec.map (fun token ->
                        Edn_util.int64 (Int64.of_string token)))))
          else Some text
  | None -> None

let id_raw opts =
  match opts.id_raw with
  | Some _ as id -> id
  | None -> normalize_stdin_id opts.stdin_id

let count_present values = values |> Vec.filter Option.is_some |> Vec.length

let target_count opts =
  count_present
    (Vec.of_array [| opts.id_raw; opts.stdin_id; opts.uuid; opts.page |])

let resolve_target opts =
  match id_raw opts with
  | Some s -> (
      match Id_parse.parse_id_string s with
      | Ok { ids; _ } when Vec.length ids = 1 -> Ok (By_id (Vec.nth ids 0))
      | Ok { ids; _ } when not (Vec.is_empty ids) -> Ok (By_ids ids)
      | Ok _ -> Error (Error.invalid_options "invalid id")
      | Error e -> Error e)
  | None -> (
      match (opts.uuid, opts.page) with
      | Some uuid, _ ->
          let uuid = String.trim uuid in
          if Cli_primitive.is_uuid_string uuid then Ok (By_uuid uuid)
          else
            Error
              (Error.invalid_options "Option uuid must be a valid UUID string")
      | None, Some page when String.trim page <> "" ->
          Ok (By_page (String.trim page))
      | _ -> Error (Error.missing_target "block or page is required"))

let invalid_options (opts : opts) =
  if target_count opts > 1 then
    Some "only one of --id, --uuid, or --page is allowed"
  else
    match opts.level with
    | Some level when level < 1 -> Some "level must be >= 1"
    | _ -> None

let command_id _ = Command_id.Show
let default_level = 10

let validate_parsed (Parsed_show opts) =
  match invalid_options opts with
  | Some message -> Error (Error.invalid_options message)
  | None -> Ok ()

let build ?registry:_ config _globals (Parsed_show opts) =
  match config.Cli_config.repo with
  | None -> Error (Error.missing_repo "repo is required for show")
  | Some repo ->
      Error.bind (validate_parsed (Parsed_show opts)) (fun () ->
          Error.bind (resolve_target opts) (fun target ->
              Ok
                {
                  repo;
                  graph = Cli_config.repo_to_graph repo;
                  target;
                  multi_id = (match target with By_ids _ -> true | _ -> false);
                  linked_references =
                    Option.value opts.linked_references ~default:true;
                  ref_id_footer = Option.value opts.ref_id_footer ~default:true;
                  page_hierarchy = opts.page_hierarchy;
                  level = Some (Option.value opts.level ~default:default_level);
                }))

let kw value = Edn_util.keyword value
let sym value = Edn_util.symbol value
let vector_vec values = Edn_util.vector_vec values
let wildcard = sym "*"

let link_target_selector =
  vector_vec
    (Vec.of_array
       [|
         wildcard;
         kw "db/id";
         kw "db/ident";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         kw "block/order";
         kw "logseq.property/deleted-at";
         kw "logseq.property/created-from-property";
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "logseq.property/status",
                  vector_vec
                    (Vec.of_array [| kw "db/ident"; kw "block/title" |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/page",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/parent",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/tags",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "db/ident";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
       |])

let pull_selector =
  vector_vec
    (Vec.of_array
       [|
         wildcard;
         kw "db/id";
         kw "db/ident";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         kw "block/order";
         kw "logseq.property/deleted-at";
         kw "logseq.property/created-from-property";
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "logseq.property/status",
                  vector_vec
                    (Vec.of_array [| kw "db/ident"; kw "block/title" |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/page",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/parent",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/tags",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "db/ident";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array [| (kw "block/link", link_target_selector) |]);
       |])

let lookup_of_target = function
  | By_id id -> Edn_util.int64 id
  | By_uuid uuid ->
      vector_vec (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |])
  | By_page page ->
      vector_vec (Vec.of_array [| kw "block/name"; Edn_util.string page |])
  | By_ids _ -> Edn_util.nil

let strip_keyword_prefix value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let value_key_matches expected key_value =
  let expected = strip_keyword_prefix expected in
  match (Edn_util.as_keyword key_value, Edn_util.as_string key_value) with
  | Some key, _ | _, Some key -> strip_keyword_prefix key = expected
  | _ -> false

let string_starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let show_internal_key key_value =
  match (Edn_util.as_keyword key_value, Edn_util.as_string key_value) with
  | Some key, _ | _, Some key ->
      string_starts_with ~prefix:"show/" (strip_keyword_prefix key)
  | _ -> false

let structured_internal_key key =
  value_key_matches "block/uuid" key || show_internal_key key

let rec sanitize_structured_value value =
  match Edn_util.as_map value with
  | Some fields ->
      fields
      |> Vec.filter (fun (key, _) -> not (structured_internal_key key))
      |> Vec.map (fun (key, value) -> (key, sanitize_structured_value value))
      |> fun fields -> Edn_util.map_vec fields
  | None -> (
      match Edn_util.as_list value with
      | Some values ->
          Edn_util.list_vec (values |> Vec.map sanitize_structured_value)
      | None -> (
          match Edn_util.as_vector value with
          | Some values ->
              Edn_util.vector_vec (values |> Vec.map sanitize_structured_value)
          | None -> (
              match Edn_util.as_set value with
              | Some values ->
                  Edn_util.set_vec (values |> Vec.map sanitize_structured_value)
              | None -> value)))

let linked_references_value (refs : linked_references) =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (kw "count", Edn_util.int refs.count);
         ( kw "blocks",
           Edn_util.vector_vec
             (Vec.map
                (fun block -> sanitize_structured_value block.Block.raw)
                refs.blocks) );
       |])

let tree_data_value root linked_references =
  let fields = Vec.singleton (kw "root", sanitize_structured_value root) in
  let fields =
    match linked_references with
    | Some refs ->
        Vec.push_back fields
          (kw "linked-references", linked_references_value refs)
    | None -> fields
  in
  Edn_util.map_vec fields

let missing_entity value =
  if Edn_util.is_null value then true
  else
    match Edn_util.as_map value with
    | Some fields -> Vec.mem_assoc (kw "db/id") fields && Vec.length fields = 1
    | _ -> false

let property_value_block value =
  Option.is_some (Edn_util.get value "logseq.property/created-from-property")

let recycled_page value =
  Option.is_some (Edn_util.get value "block/name")
  && Option.is_some (Edn_util.get value "logseq.property/deleted-at")

let recycled_page_error () = Error.make Error.Recycled_page "page is recycled"

let ident_value value =
  Option.map strip_keyword_prefix
    (Option.bind (Edn_util.get value "db/ident") Edn_util.as_string_like)

let tag_ident_matches expected tag =
  let expected = strip_keyword_prefix expected in
  match Edn_util.as_string_like tag with
  | Some ident -> strip_keyword_prefix ident = expected
  | None -> (
      match Edn_util.as_map tag with
      | Some _ -> ident_value tag = Some expected
      | None -> false)

let has_tag_ident value expected =
  match Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq with
  | Some tags -> Vec.exists (tag_ident_matches expected) tags
  | _ -> false

let page_hierarchy_display_page value =
  (has_tag_ident value "logseq.class/Page"
  || has_tag_ident value "logseq.class/Journal")
  && (not (has_tag_ident value "logseq.class/Tag"))
  && not (has_tag_ident value "logseq.class/Property")

let page_hierarchy_target_page value =
  page_hierarchy_display_page value
  && Option.is_none (Edn_util.get value "block/page")

let library_page value =
  Edn_util.get_bool value "logseq.property/built-in?" = Some true
  && Edn_util.get_string value "block/title" = Some "Library"

let entity_error = function
  | By_page _ -> Error.make Error.Page_not_found "page not found"
  | _ -> Error.make Error.Entity_not_found "entity not found"

exception Show_error of Error.t

let block_link_target_not_found () =
  Error.make Error.Block_link_target_not_found "block link target not found"

let block_link_cycle () =
  Error.make Error.Block_link_cycle "block link cycle detected"

let page_hierarchy_parent_cycle () =
  Error.make Error.Page_hierarchy_parent_cycle
    "page hierarchy parent cycle detected"

let fail_show_error err = Cli_effect.error (Show_error err)

let multi_id_error_value id err =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (kw "id", Edn_util.int64 id);
         ( kw "error",
           Edn_util.map_vec
             (Vec.of_array
                [|
                  ( kw "code",
                    Edn_util.string (Error.code_to_string err.Error.code) );
                  ( kw "message",
                    Edn_util.string
                      ("Entity " ^ Int64.to_string id ^ " not found") );
                |]) );
       |])

let multi_id_error_message id _err =
  "Entity " ^ Int64.to_string id ^ " not found"

let pull_entity config repo target =
  let open Cli_effect in
  bind
    (Transport.thread_api_pull config ~repo
       ~selector:(Edn_util.expect_vector_t "show pull selector" pull_selector)
       ~lookup:(lookup_of_target target))
    (fun value -> pure value)

let tree_block_selector =
  vector_vec
    (Vec.of_array
       [|
         wildcard;
         kw "db/id";
         kw "db/ident";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         kw "logseq.property/created-from-property";
         kw "block/order";
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "logseq.property/status",
                  vector_vec
                    (Vec.of_array [| kw "db/ident"; kw "block/title" |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                (kw "block/parent", vector_vec (Vec.of_array [| kw "db/id" |]));
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/page",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array
              [|
                ( kw "block/tags",
                  vector_vec
                    (Vec.of_array
                       [|
                         kw "db/id";
                         kw "db/ident";
                         kw "block/name";
                         kw "block/title";
                         kw "block/uuid";
                       |]) );
              |]);
         Edn_util.map_vec
           (Vec.of_array [| (kw "block/link", link_target_selector) |]);
       |])

let page_blocks_query =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.singleton
         (Edn_util.list_vec
            (Vec.of_array [| sym "pull"; sym "?b"; tree_block_selector |])))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?page-id";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?b"; kw "block/page"; sym "?page-id" |]));
         |])
    ()

let page_hierarchy_children_query =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.singleton
         (Edn_util.list_vec
            (Vec.of_array [| sym "pull"; sym "?child"; tree_block_selector |])))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$";
           Melange_edn_melange.symbol "?parent-id";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| sym "?child"; kw "block/parent"; sym "?parent-id" |]));
         |])
    ()

let row_entity value =
  match
    (Edn_util.as_vector value, Edn_util.as_list value, Edn_util.as_map value)
  with
  | Some values, _, _ when Vec.length values = 1 -> Some (Vec.peek_front values)
  | _, Some values, _ when Vec.length values = 1 -> Some (Vec.peek_front values)
  | _, _, Some _ -> Some value
  | _ -> None

let id_of value = Edn_util.get_int64 value "db/id"

let parent_id_of value =
  match Edn_util.get value "block/parent" with
  | Some parent -> (
      match (Edn_util.as_map parent, Edn_util.as_int64 parent) with
      | Some _, _ -> Edn_util.get_int64 parent "db/id"
      | _, Some id -> Some id
      | _ -> None)
  | None -> None

let page_id_of root =
  match Edn_util.get root "block/page" with
  | Some page -> (
      match (Edn_util.as_map page, Edn_util.as_int64 page) with
      | Some _, _ -> Edn_util.get_int64 page "db/id"
      | _, Some id -> Some id
      | _ -> id_of root)
  | None -> id_of root

let order_key value =
  match Edn_util.get value "block/order" with
  | Some value -> (
      match (Edn_util.as_string value, Edn_util.as_int value) with
      | Some s, _ -> s
      | _, Some i -> string_of_int i
      | _ -> "")
  | _ -> ""

let assoc_children value children =
  if Vec.is_empty children then value
  else Edn_util.assoc "block/children" (Edn_util.vector_vec children) value

let build_children ?max_depth blocks root_id =
  let rec children_of depth parent_id =
    match max_depth with
    | Some max_depth when depth >= max_depth -> Vec.empty
    | _ ->
        blocks
        |> Vec.filter (fun block -> parent_id_of block = Some parent_id)
        |> Vec.sort (fun a b -> String.compare (order_key a) (order_key b))
        |> Vec.map (fun block ->
            match id_of block with
            | Some id -> assoc_children block (children_of (depth + 1) id)
            | None -> block)
  in
  children_of 1 root_id

let fetch_page_blocks config repo page_id =
  let open Cli_effect in
  bind
    (Transport.thread_api_q config ~repo
       ~query:
         (Edn_util.vector_t_vec
            (Vec.of_array
               [|
                 Edn_util.any
                   (Cli_primitive.datascript_query_to_edn page_blocks_query);
                 Edn_util.int64 page_id;
               |])))
    (fun rows ->
      let blocks =
        Option.value (Edn_util.as_seq rows) ~default:Vec.empty
        |> Vec.filter_map row_entity
      in
      pure (Vec.filter (fun block -> not (property_value_block block)) blocks))

let fetch_page_hierarchy_children config repo parent_id =
  let open Cli_effect in
  bind
    (Transport.thread_api_q config ~repo
       ~query:
         (Edn_util.vector_t_vec
            (Vec.of_array
               [|
                 Edn_util.any
                   (Cli_primitive.datascript_query_to_edn
                      page_hierarchy_children_query);
                 Edn_util.int64 parent_id;
               |])))
    (fun rows ->
      let blocks =
        Option.value (Edn_util.as_seq rows) ~default:Vec.empty
        |> Vec.filter_map row_entity
      in
      pure
        (blocks
        |> Vec.filter page_hierarchy_display_page
        |> Vec.sort (fun a b -> String.compare (order_key a) (order_key b))))

let linked_ref_ids value =
  match Edn_util.as_seq value with
  | Some refs ->
      Vec.filter_map
        (fun ref ->
          match (Edn_util.as_map ref, Edn_util.as_int64 ref) with
          | Some _, _ -> Edn_util.get_int64 ref "db/id"
          | _, Some id -> Some id
          | _ -> None)
        refs
  | _ -> Vec.empty

let fetch_linked_references config repo root_id =
  let open Cli_effect in
  bind (Transport.thread_api_get_block_refs config ~repo ~block_id:root_id)
    (fun refs ->
      let rec pull_blocks acc remaining =
        match Vec.pop_front remaining with
        | None -> pure acc
        | Some (id, rest) ->
            bind
              (Transport.thread_api_pull config ~repo
                 ~selector:
                   (Edn_util.expect_vector_t "show pull selector" pull_selector)
                 ~lookup:(Edn_util.int64 id))
              (fun value ->
                let acc =
                  if missing_entity value || property_value_block value then acc
                  else Vec.push_back acc (Block.of_value value)
                in
                pull_blocks acc rest)
      in
      bind
        (pull_blocks Vec.empty (linked_ref_ids refs))
        (fun blocks -> pure { count = Vec.length blocks; blocks }))

let attach_children config repo ?max_depth root =
  let open Cli_effect in
  match (id_of root, page_id_of root) with
  | Some root_id, Some page_id ->
      bind (fetch_page_blocks config repo page_id) (fun blocks ->
          pure (assoc_children root (build_children ?max_depth blocks root_id)))
  | _ -> pure root

let attach_page_hierarchy config repo ?max_depth root =
  let open Cli_effect in
  let rec attach_node depth visited node =
    match id_of node with
    | Some id when Vec.mem id visited ->
        fail_show_error (page_hierarchy_parent_cycle ())
    | None -> pure node
    | Some parent_id -> (
        let visited = Vec.push_front visited parent_id in
        match max_depth with
        | Some max_depth when depth >= max_depth -> pure node
        | _ ->
            bind (fetch_page_hierarchy_children config repo parent_id)
              (fun children ->
                let rec attach_all acc remaining =
                  match Vec.pop_front remaining with
                  | None -> pure acc
                  | Some (child, rest) ->
                      bind
                        (attach_node (depth + 1) visited child)
                        (fun child -> attach_all (Vec.push_back acc child) rest)
                in
                bind (attach_all Vec.empty children) (fun children ->
                    pure (assoc_children node children))))
  in
  attach_node 1 Vec.empty root

let attach_tree config (action : action) root =
  if library_page root then
    attach_page_hierarchy config action.repo ?max_depth:action.level root
  else if action.page_hierarchy && page_hierarchy_target_page root then
    attach_page_hierarchy config action.repo ?max_depth:action.level root
  else attach_children config action.repo ?max_depth:action.level root

let lookup_of_link_value link =
  match Edn_util.as_map link with
  | Some _ -> (
      match Edn_util.get_int64 link "db/id" with
      | Some id -> Some (Edn_util.int64 id)
      | None -> (
          match
            Option.bind (Edn_util.get link "block/uuid") Edn_util.as_string_like
          with
          | Some uuid ->
              Some
                (vector_vec
                   (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))
          | _ -> None))
  | None -> (
      match (Edn_util.as_int64 link, Edn_util.as_uuid link) with
      | Some id, _ -> Some (Edn_util.int64 id)
      | _, Some uuid ->
          Some
            (vector_vec
               (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))
      | _ -> (
          let values =
            match (Edn_util.as_vector link, Edn_util.as_list link) with
            | Some values, _ | _, Some values -> Some values
            | _ -> None
          in
          match values with
          | Some values
            when Vec.length values = 2
                 && value_key_matches "db/id" (Vec.nth values 0)
                 && Option.is_some (Edn_util.as_int64 (Vec.nth values 1)) ->
              let id = Vec.nth values 1 in
              Some
                (Edn_util.int64
                   (Option.value (Edn_util.as_int64 id) ~default:0L))
          | Some values
            when Vec.length values = 2
                 && value_key_matches "block/uuid" (Vec.nth values 0) -> (
              let uuid_value = Vec.nth values 1 in
              match Edn_util.as_string_like uuid_value with
              | Some uuid ->
                  Some
                    (vector_vec
                       (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))
              | _ -> None)
          | _ -> None))

let pull_link_target config repo link =
  let open Cli_effect in
  match lookup_of_link_value link with
  | Some lookup ->
      bind
        (Transport.thread_api_pull config ~repo
           ~selector:
             (Edn_util.expect_vector_t "show pull selector" pull_selector)
           ~lookup)
        (fun target ->
          if missing_entity target then
            fail_show_error (block_link_target_not_found ())
          else pure target)
  | None -> fail_show_error (block_link_target_not_found ())

let link_target_id link =
  match (Edn_util.as_map link, Edn_util.as_int64 link) with
  | Some _, _ -> Edn_util.get_int64 link "db/id"
  | _, Some id -> Some id
  | _ -> None

let push_value_id value ids =
  match id_of value with Some id -> Vec.push_front ids id | None -> ids

let remaining_linked_depth max_depth depth =
  Option.map (fun max_depth -> max 1 (1 + max_depth - depth)) max_depth

let linked_target_action action depth =
  { action with level = remaining_linked_depth action.level depth }

let rec resolve_linked_blocks ?(depth = 1) ?(visited = Vec.empty) config
    (action : action) root =
  let open Cli_effect in
  match Edn_util.get root "block/link" with
  | Some link -> (
      match link_target_id link with
      | Some target_id when Vec.mem target_id visited ->
          fail_show_error (block_link_cycle ())
      | _ ->
          bind (pull_link_target config action.repo link) (fun target ->
              match id_of target with
              | Some target_id when Vec.mem target_id visited ->
                  fail_show_error (block_link_cycle ())
              | _ ->
                  let visited =
                    visited |> push_value_id root |> push_value_id target
                  in
                  let target_action = linked_target_action action depth in
                  bind (attach_tree config target_action target) (fun target ->
                      bind
                        (resolve_linked_blocks ~depth ~visited config action
                           target) (fun target ->
                          pure
                            (Edn_util.assoc "show/linked-display?"
                               (Edn_util.bool true) target)))))
  | None ->
      let children =
        Option.value
          (Option.bind (Edn_util.get root "block/children") Edn_util.as_seq)
          ~default:Vec.empty
      in
      if Vec.is_empty children then pure root
      else
        let rec resolve_all acc remaining =
          match Vec.pop_front remaining with
          | None -> pure acc
          | Some (child, rest) ->
              bind
                (resolve_linked_blocks ~depth:(depth + 1) ~visited config action
                   child)
                (fun child -> resolve_all (Vec.push_back acc child) rest)
        in
        bind (resolve_all Vec.empty children) (fun children ->
            pure
              (Edn_util.assoc "block/children"
                 (Edn_util.vector_vec children)
                 root))

let nonblank_string = function
  | Some text when String.trim text <> "" -> Some text
  | _ -> None

let uuid_string value key =
  Option.bind (Edn_util.get value key) Edn_util.as_string_like
  |> nonblank_string

let tag_label tag =
  match nonblank_string (Edn_util.get_string tag "block/title") with
  | Some title -> Some title
  | None -> (
      match nonblank_string (Edn_util.get_string tag "block/name") with
      | Some name -> Some name
      | None -> uuid_string tag "block/uuid")

let tags_suffix value =
  let tags =
    Option.value
      (Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq)
      ~default:Vec.empty
  in
  let labels = Vec.filter_map tag_label tags in
  if Vec.is_empty labels then None
  else Some (Vec.string_concat " " (Vec.map (fun label -> "#" ^ label) labels))

let status_label value =
  match Edn_util.get value "logseq.property/status" with
  | Some status -> nonblank_string (Edn_util.get_string status "block/title")
  | None -> None

let base_label_of value =
  match Edn_util.get_string value "block/title" with
  | Some title when String.trim title <> "" -> title
  | _ -> (
      match Edn_util.get_string value "block/name" with
      | Some name when String.trim name <> "" -> name
      | _ -> (
          match Edn_util.get_string value "db/ident" with
          | Some ident when String.trim ident <> "" -> ident
          | _ -> "-"))

let linked_display value =
  Option.bind (Edn_util.get value "show/linked-display?") Edn_util.as_bool
  = Some true

let linked_arrow = Cli_platform.Symbols.linked_arrow

let label_of value =
  let base =
    match status_label value with
    | Some status -> status ^ " " ^ base_label_of value
    | None -> base_label_of value
  in
  let label =
    match tags_suffix value with
    | Some suffix -> base ^ " " ^ suffix
    | None -> base
  in
  match linked_display value with
  | true -> linked_arrow ^ label
  | false -> label

let children_of value =
  Option.value
    (Option.bind (Edn_util.get value "block/children") Edn_util.as_seq)
    ~default:Vec.empty

type render_metadata = {
  property_titles : (string * string) Rrbvec.t;
  property_value_labels : (Cli_primitive.db_id * string) Rrbvec.t;
}

let empty_render_metadata =
  { property_titles = Vec.empty; property_value_labels = Vec.empty }

let unique_preserve_order values =
  let rec loop acc remaining =
    match Vec.pop_front remaining with
    | None -> acc
    | Some (value, rest) ->
        if Vec.mem value rest then loop acc rest
        else loop (Vec.push_back acc value) rest
  in
  loop Vec.empty values

let property_key_namespace key =
  let key = strip_keyword_prefix key in
  key <> "logseq.property/status"
  && (not (string_starts_with ~prefix:"logseq.property/created-" key))
  && (string_starts_with ~prefix:"user.property/" key
     || string_starts_with ~prefix:"logseq.property/" key
     || string_starts_with ~prefix:"logseq.property." key)

let property_entity_hidden value =
  Edn_util.get_bool value "logseq.property/hide?" = Some true

let property_entity_block_left value =
  match Edn_util.get_string value "logseq.property/ui-position" with
  | Some "block-left" -> true
  | _ -> false

let property_entity value =
  Option.is_some (Edn_util.get value "logseq.property/type")

let visible_property_entity value =
  property_entity value
  && (not (property_entity_hidden value))
  && not (property_entity_block_left value)

let display_property_key key =
  match (Edn_util.as_keyword key, Edn_util.as_keyword_t key) with
  | Some text, Some ident when property_key_namespace text -> Some (text, ident)
  | _ -> None

let property_entries value =
  match Edn_util.as_map value with
  | Some fields ->
      fields
      |> Vec.filter_map (fun (key, value) ->
          Option.map
            (fun (key_text, key_ident) -> (key_text, key_ident, value))
            (display_property_key key))
  | None -> Vec.empty

let rec collect_tree_property_entries root =
  Vec.append (property_entries root)
    (children_of root |> Vec.concat_map collect_tree_property_entries)

let collect_property_entries root linked_references =
  let linked_blocks =
    match linked_references with
    | None -> Vec.empty
    | Some refs -> Vec.map (fun block -> block.Block.raw) refs.blocks
  in
  Vec.push_front linked_blocks root
  |> Vec.concat_map collect_tree_property_entries

let lookup_id_of_value value =
  match Edn_util.as_map value with
  | Some _ -> Edn_util.get_int64 value "db/id"
  | None -> (
      let values =
        match (Edn_util.as_vector value, Edn_util.as_list value) with
        | Some values, _ | _, Some values -> Some values
        | _ -> None
      in
      match values with
      | Some values
        when Vec.length values = 2
             && value_key_matches "db/id" (Vec.nth values 0) ->
          Edn_util.as_int64 (Vec.nth values 1)
      | _ -> None)

let rec property_value_ref_ids value =
  match lookup_id_of_value value with
  | Some id -> Vec.singleton id
  | None -> (
      match Edn_util.as_seq value with
      | Some values -> property_value_ref_ids_seq values
      | None -> Vec.empty)

and property_value_ref_ids_seq values =
  match Vec.pop_front values with
  | Some (key, values)
    when (not (Vec.is_empty values)) && value_key_matches "db/id" key -> (
      let id, rest =
        match Vec.pop_front values with
        | Some pair -> pair
        | None -> failwith "non-empty vector must have a front value"
      in
      match Edn_util.as_int64 id with
      | Some id -> Vec.push_front (property_value_ref_ids_seq rest) id
      | None ->
          Vec.append
            (property_value_ref_ids key)
            (Vec.append
               (property_value_ref_ids id)
               (property_value_ref_ids_seq rest)))
  | Some (value, rest) ->
      Vec.append
        (property_value_ref_ids value)
        (property_value_ref_ids_seq rest)
  | None -> Vec.empty

let property_title_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "db/ident";
         kw "block/title";
         kw "block/name";
         kw "logseq.property/type";
         kw "logseq.property/hide?";
         kw "logseq.property/ui-position";
       |])

let property_value_label_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "db/ident";
         kw "block/title";
         kw "block/name";
         kw "logseq.property/value";
       |])

let property_lookup ident =
  vector_vec (Vec.of_array [| kw "db/ident"; Edn_util.any ident |])

let fallback_property_title key =
  let key =
    if String.length key > 0 && key.[0] = ':' then
      String.sub key 1 (String.length key - 1)
    else key
  in
  match Vec.peek_back_opt (Vec.split_on_char '/' key) with
  | Some value when value <> "" -> value
  | _ -> key

let entity_label_from_value value =
  match nonblank_string (Edn_util.get_string value "block/title") with
  | Some title -> Some title
  | None -> (
      match nonblank_string (Edn_util.get_string value "block/name") with
      | Some name -> Some name
      | None -> (
          match
            nonblank_string (Edn_util.get_string value "logseq.property/value")
          with
          | Some value -> Some value
          | None -> (
              match nonblank_string (Edn_util.get_string value "db/ident") with
              | Some ident -> Some ident
              | None -> None)))

let fetch_property_titles invoke_config repo idents =
  let open Cli_effect in
  let rec pull acc remaining =
    match Vec.pop_front remaining with
    | None -> pure acc
    | Some ((key_text, ident), rest) ->
        bind
          (Transport.thread_api_pull invoke_config ~repo
             ~selector:
               (Edn_util.expect_vector_t "property title selector"
                  property_title_selector)
             ~lookup:(property_lookup ident))
          (fun value ->
            let acc =
              if visible_property_entity value then
                let title =
                  Option.value
                    (entity_label_from_value value)
                    ~default:(fallback_property_title key_text)
                in
                Vec.push_back acc (key_text, title)
              else acc
            in
            pull acc rest)
  in
  pull Vec.empty idents

let fetch_property_value_labels invoke_config repo ids =
  let open Cli_effect in
  let rec pull acc remaining =
    match Vec.pop_front remaining with
    | None -> pure acc
    | Some (id, rest) ->
        bind
          (Transport.thread_api_pull invoke_config ~repo
             ~selector:
               (Edn_util.expect_vector_t "property value selector"
                  property_value_label_selector)
             ~lookup:(Edn_util.int64 id))
          (fun value ->
            let acc =
              match entity_label_from_value value with
              | Some label -> Vec.push_back acc (id, label)
              | None -> acc
            in
            pull acc rest)
  in
  pull Vec.empty ids

let replace_uuid_refs_in_property_value_labels config repo property_value_labels
    =
  let label_uuids =
    property_value_labels |> Vec.map snd
    |> Uuid_refs_types.collect_uuid_refs_from_strings
  in
  let open Cli_effect in
  bind (Uuid_refs_types.fetch_uuid_entities config repo label_uuids)
    (fun uuid_entities ->
      let labels =
        Vec.filter_map
          (fun (entry : Uuid_refs_types.uuid_label) ->
            Option.map (fun label -> (entry.uuid, label)) entry.label)
          uuid_entities
      in
      let property_value_labels =
        Vec.map
          (fun (id, label) ->
            (id, Uuid_refs_types.replace_uuid_refs label labels))
          property_value_labels
      in
      pure property_value_labels)

let prepare_property_render_metadata config invoke_config action root
    linked_references =
  let entries = collect_property_entries root linked_references in
  if Vec.is_empty entries then Cli_effect.pure empty_render_metadata
  else
    let property_idents =
      entries
      |> Vec.map (fun (key_text, key_ident, _) -> (key_text, key_ident))
      |> unique_preserve_order
    in
    let open Cli_effect in
    bind (fetch_property_titles invoke_config action.repo property_idents)
      (fun property_titles ->
        let property_title_key key =
          Option.is_some (Vec.assoc_opt key property_titles)
        in
        let visible_entries =
          Vec.filter
            (fun (key_text, _, _) -> property_title_key key_text)
            entries
        in
        let value_ids =
          visible_entries
          |> Vec.concat_map (fun (_, _, value) -> property_value_ref_ids value)
          |> unique_preserve_order
        in
        bind (fetch_property_value_labels invoke_config action.repo value_ids)
          (fun property_value_labels ->
            bind
              (replace_uuid_refs_in_property_value_labels config action.repo
                 property_value_labels) (fun property_value_labels ->
                pure { property_titles; property_value_labels })))

let id_text value =
  match id_of value with Some id -> Int64.to_string id | None -> "-"

let rec tree_id_width value =
  children_of value
  |> Vec.fold_left
       (fun width child -> max width (tree_id_width child))
       (String.length (id_text value))

let pad_id width id = id ^ String.make (max 0 (width - String.length id)) ' '

let rstrip_spaces value =
  let rec loop idx =
    if idx < 0 then ""
    else
      match value.[idx] with
      | ' ' | '\t' -> loop (idx - 1)
      | _ -> String.sub value 0 (idx + 1)
  in
  loop (String.length value - 1)

let append_label_lines lines ~id_width ~id ~prefix ~branch ~continuation_prefix
    label =
  match Vec.split_on_char '\n' label with
  | values when Vec.is_empty values -> lines
  | values ->
      let first = Vec.peek_front values in
      let rest =
        match Vec.pop_front values with
        | Some (_, rest) -> rest
        | None -> Vec.empty
      in
      let id_padding = String.make (id_width + 1) ' ' in
      let continuation_prefix =
        if Vec.is_empty rest then continuation_prefix
        else id_padding ^ continuation_prefix
      in
      let continuation_line line =
        let line = continuation_prefix ^ line in
        rstrip_spaces line
      in
      Vec.append
        (Vec.push_back lines
           (pad_id id_width id ^ " " ^ prefix ^ branch ^ first))
        (Vec.map continuation_line rest)

let property_title metadata key = Vec.assoc_opt key metadata.property_titles

let property_value_label metadata id =
  Vec.assoc_opt id metadata.property_value_labels

let scalar_property_value_text value =
  match
    ( Edn_util.as_string_like value,
      Edn_util.as_bool value,
      Edn_util.as_int64 value,
      Edn_util.as_float value )
  with
  | Some text, _, _, _ -> Some (strip_keyword_prefix text)
  | _, Some bool, _, _ -> Some (string_of_bool bool)
  | _, _, Some int, _ -> Some (Int64.to_string int)
  | _, _, _, Some float -> Some (string_of_float float)
  | _ -> None

let rec property_value_items metadata value =
  match lookup_id_of_value value with
  | Some id -> (
      match property_value_label metadata id with
      | Some label -> Vec.singleton label
      | None -> Vec.empty)
  | None -> (
      match entity_label_from_value value with
      | Some label -> Vec.singleton (strip_keyword_prefix label)
      | None -> (
          match Edn_util.as_seq value with
          | Some values -> property_value_items_seq metadata values
          | None -> (
              match scalar_property_value_text value with
              | Some text -> Vec.singleton text
              | None -> Vec.empty)))

and property_value_items_seq metadata values =
  match Vec.pop_front values with
  | Some (key, values)
    when (not (Vec.is_empty values)) && value_key_matches "db/id" key -> (
      let id, rest =
        match Vec.pop_front values with
        | Some pair -> pair
        | None -> failwith "non-empty vector must have a front value"
      in
      match Edn_util.as_int64 id with
      | Some id ->
          Vec.append
            (match property_value_label metadata id with
            | Some label -> Vec.singleton label
            | None -> Vec.empty)
            (property_value_items_seq metadata rest)
      | None ->
          Vec.append
            (property_value_items metadata key)
            (Vec.append
               (property_value_items metadata id)
               (property_value_items_seq metadata rest)))
  | Some (value, rest) ->
      Vec.append
        (property_value_items metadata value)
        (property_value_items_seq metadata rest)
  | None -> Vec.empty

let property_line metadata (key, _, value) =
  match property_title metadata key with
  | None -> None
  | Some title -> (
      match property_value_items metadata value with
      | values when Vec.is_empty values -> None
      | values when Vec.length values = 1 ->
          Some (title ^ ": " ^ Vec.peek_front values)
      | values ->
          Some
            (title ^ ":\n"
            ^ Vec.string_concat "\n"
                (Vec.map (fun value -> "- " ^ value) values)))

let property_lines metadata value =
  property_entries value |> Vec.filter_map (property_line metadata)

let append_property_lines lines ~id_width ~prefix metadata value =
  let line_prefix = String.make (id_width + 1) ' ' ^ prefix in
  let append_line lines line =
    match Vec.split_on_char '\n' line with
    | values when Vec.is_empty values -> lines
    | values ->
        let first = Vec.peek_front values in
        let rest =
          match Vec.pop_front values with
          | Some (_, rest) -> rest
          | None -> Vec.empty
        in
        Vec.append
          (Vec.push_back lines (rstrip_spaces (line_prefix ^ first)))
          (Vec.map (fun line -> rstrip_spaces (line_prefix ^ "  " ^ line)) rest)
  in
  Vec.fold_left append_line lines (property_lines metadata value)

let render_tree_text_value ?(metadata = empty_render_metadata) root =
  let lines = ref Vec.empty in
  let id_width = tree_id_width root in
  let root_id = id_text root in
  lines :=
    append_label_lines !lines ~id_width ~id:root_id ~prefix:"" ~branch:""
      ~continuation_prefix:"" (label_of root);
  lines := append_property_lines !lines ~id_width ~prefix:"" metadata root;
  let rec walk prefix node =
    let children = children_of node in
    let total = Vec.length children in
    Vec.iteri
      (fun idx child ->
        let last_child = idx = total - 1 in
        let branch =
          if last_child then Cli_platform.Symbols.tree_last
          else Cli_platform.Symbols.tree_middle
        in
        let next_prefix =
          prefix ^ if last_child then "    " else Cli_platform.Symbols.tree_pipe
        in
        lines :=
          append_label_lines !lines ~id_width ~id:(id_text child) ~prefix
            ~branch ~continuation_prefix:next_prefix (label_of child);
        lines :=
          append_property_lines !lines ~id_width ~prefix:next_prefix metadata
            child;
        walk next_prefix child)
      children
  in
  walk "" root;
  Vec.string_concat "\n" !lines

let linked_reference_context_value block =
  match Edn_util.get block "block/page" with
  | Some page when Option.is_some (Edn_util.as_map page) ->
      Edn_util.assoc "block/children"
        (Edn_util.vector_vec (Vec.of_array [| block |]))
        page
  | _ -> block

let render_linked_reference_text metadata block =
  render_tree_text_value ~metadata (linked_reference_context_value block)

let collect_uuid_ref_strings value =
  let rec collect acc value =
    let acc =
      match Edn_util.as_string value with
      | Some text -> Vec.push_front acc text
      | None -> acc
    in
    match Edn_util.as_map value with
    | Some fields ->
        Vec.fold_left (fun acc (_, value) -> collect acc value) acc fields
    | None -> (
        match Edn_util.as_seq value with
        | Some values -> Vec.fold_left collect acc values
        | None -> acc)
  in
  collect Vec.empty value

let linked_reference_values = function
  | None -> Vec.empty
  | Some refs -> Vec.map (fun block -> block.Block.raw) refs.blocks

let referenced_uuids root linked_references =
  Vec.push_front (linked_reference_values linked_references) root
  |> Vec.concat_map collect_uuid_ref_strings
  |> Uuid_refs_types.collect_uuid_refs_from_strings

let label_pairs uuid_entities =
  Vec.filter_map
    (fun (entry : Uuid_refs_types.uuid_label) ->
      Option.map (fun label -> (entry.uuid, label)) entry.label)
    uuid_entities

let rec replace_uuid_refs_in_value labels value =
  match Edn_util.as_string value with
  | Some text -> Edn_util.string (Uuid_refs_types.replace_uuid_refs text labels)
  | None -> (
      match Edn_util.as_list value with
      | Some values ->
          Edn_util.list_vec
            (values |> Vec.map (replace_uuid_refs_in_value labels))
      | None -> (
          match Edn_util.as_vector value with
          | Some values ->
              Edn_util.vector_vec
                (values |> Vec.map (replace_uuid_refs_in_value labels))
          | None -> (
              match Edn_util.as_set value with
              | Some values ->
                  Edn_util.set_vec
                    (values |> Vec.map (replace_uuid_refs_in_value labels))
              | None -> (
                  match Edn_util.as_map value with
                  | Some fields ->
                      Edn_util.map_vec
                        (fields
                        |> Vec.map (fun (key, value) ->
                            (key, replace_uuid_refs_in_value labels value)))
                  | None -> value))))

let replace_linked_references labels = function
  | None -> None
  | Some refs ->
      Some
        {
          refs with
          blocks =
            Vec.map
              (fun block ->
                let raw = replace_uuid_refs_in_value labels block.Block.raw in
                { (Block.of_value raw) with Block.raw })
              refs.blocks;
        }

let referenced_entity_line (entry : Uuid_refs_types.uuid_label) =
  let id = match entry.id with Some id -> Int64.to_string id | None -> "-" in
  let label = Option.value entry.label ~default:entry.uuid in
  id ^ " -> " ^ label

let referenced_entities_footer (action : action) ordered_uuids uuid_entities =
  if (not action.ref_id_footer) || Vec.is_empty ordered_uuids then None
  else
    let rows =
      ordered_uuids
      |> Vec.filter_map (fun uuid ->
          Vec.find_opt
            (fun (entry : Uuid_refs_types.uuid_label) -> entry.uuid = uuid)
            uuid_entities)
      |> Vec.map referenced_entity_line
    in
    if Vec.is_empty rows then None
    else
      Some
        ("Referenced Entities ("
        ^ Humanize_types.format_count (Vec.length rows)
        ^ ")\n"
        ^ Vec.string_concat "\n" rows)

let block_page_id root =
  match Edn_util.get root "block/page" with
  | Some page -> (
      match (Edn_util.as_map page, Edn_util.as_int64 page) with
      | Some _, _ -> Edn_util.get_int64 page "db/id"
      | _, Some id -> Some id
      | _ -> None)
  | None -> None

let ordinary_block_root root =
  Option.is_some (id_of root) && Option.is_some (block_page_id root)

let breadcrumb_label value = label_of value

let render_breadcrumb_line parents =
  let rows =
    parents
    |> Vec.filter_map (fun parent ->
        let label = breadcrumb_label parent in
        if String.trim label = "" || label = "-" then None
        else Some (parent, label))
  in
  if Vec.is_empty rows then None
  else
    let id_width =
      rows
      |> Vec.map (fun (parent, _) -> String.length (id_text parent))
      |> Vec.fold_left max 0
    in
    rows
    |> Vec.mapi (fun index (parent, label) ->
        let id = id_text parent in
        let padding = String.make (max 0 (id_width - String.length id)) ' ' in
        let indent = String.make (index * 2) ' ' in
        id ^ padding ^ indent ^ " > " ^ label)
    |> Vec.string_concat "\n" |> Option.some

let fetch_breadcrumb_line invoke_config (action : action) root =
  let open Cli_effect in
  match id_of root with
  | Some root_id when ordinary_block_root root ->
      bind
        (Transport.thread_api_get_block_parents invoke_config ~repo:action.repo
           ~block_id:root_id) (fun value ->
          let parents =
            Option.value (Edn_util.as_seq value) ~default:Vec.empty
          in
          pure (render_breadcrumb_line parents))
  | _ -> pure None

let prepare_uuid_refs config (action : action) root linked_references =
  let uuids = referenced_uuids root linked_references in
  let open Cli_effect in
  bind (Uuid_refs_types.fetch_uuid_entities config action.repo uuids)
    (fun uuid_entities ->
      let labels = label_pairs uuid_entities in
      let root = replace_uuid_refs_in_value labels root in
      let linked_references =
        replace_linked_references labels linked_references
      in
      pure
        ( root,
          linked_references,
          referenced_entities_footer action uuids uuid_entities,
          uuids ))

let human_output_for_mode mode = not (Output.Mode.structured mode)

let show_result mode _config _action root linked_references footer metadata =
  if not (human_output_for_mode mode) then
    Cli_result.ok ~command:Command_id.Show mode
      (Raw (tree_data_value root linked_references))
  else
    let tree_message =
      match linked_references with
      | Some { count; blocks } when not (Vec.is_empty blocks) ->
          render_tree_text_value ~metadata root
          ^ "\n\nLinked References (" ^ string_of_int count ^ ")\n"
          ^ Vec.string_concat "\n\n"
              (Vec.map
                 (fun block ->
                   render_linked_reference_text metadata block.Block.raw)
                 blocks)
      | _ -> render_tree_text_value ~metadata root
    in
    let message =
      match footer with
      | Some footer -> tree_message ^ "\n\n" ^ footer
      | None -> tree_message
    in
    Cli_result.ok ~command:Command_id.Show mode (Message message)

let show_result_with_breadcrumb mode config action root linked_references footer
    metadata breadcrumb_line =
  match
    show_result mode config action root linked_references footer metadata
  with
  | { Cli_result.data = Some (Message message); _ } ->
      let message =
        match breadcrumb_line with
        | Some line -> line ^ "\n" ^ message
        | None -> message
      in
      Cli_result.ok ~command:Command_id.Show mode (Message message)
  | result -> result

let attach_linked_references config (action : action) root =
  let open Cli_effect in
  if not action.linked_references then pure None
  else
    match id_of root with
    | Some root_id ->
        bind (fetch_linked_references config action.repo root_id) (fun refs ->
            pure (Some refs))
    | None -> pure (Some { count = 0; blocks = Vec.empty })

let resolve_linked_references config (action : action) = function
  | None -> Cli_effect.pure None
  | Some refs ->
      let open Cli_effect in
      let rec resolve_all acc remaining =
        match Vec.pop_front remaining with
        | None -> pure acc
        | Some (block, rest) ->
            bind (resolve_linked_blocks config action block.Block.raw)
              (fun raw ->
                let block = Block.of_value raw in
                resolve_all (Vec.push_back acc { block with Block.raw }) rest)
      in
      bind (resolve_all Vec.empty refs.blocks) (fun blocks ->
          pure (Some { refs with blocks }))

let rec collect_tree_ids root =
  let child_ids = children_of root |> Vec.concat_map collect_tree_ids in
  match id_of root with
  | Some id -> Vec.push_front child_ids id
  | None -> child_ids

let multi_tree_value root linked_references =
  tree_data_value root linked_references

let multi_tree_message mode config action root linked_references footer metadata
    =
  match
    show_result mode config action root linked_references footer metadata
  with
  | { Cli_result.data = Some (Message message); _ } -> message
  | _ -> render_tree_text_value ~metadata root

let execute_single mode action config target =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err -> pure (Cli_result.error ~command:Command_id.Show mode err)
    | Ok invoke_config ->
        bind (pull_entity invoke_config action.repo target) (fun value ->
            if missing_entity value then
              pure
                (Cli_result.error ~command:Command_id.Show mode
                   (entity_error target))
            else if recycled_page value then
              pure
                (Cli_result.error ~command:Command_id.Show mode
                   (recycled_page_error ()))
            else
              bind (attach_tree invoke_config action value) (fun value ->
                  bind (resolve_linked_blocks invoke_config action value)
                    (fun value ->
                      bind (attach_linked_references invoke_config action value)
                        (fun linked_references ->
                          bind
                            (resolve_linked_references invoke_config action
                               linked_references) (fun linked_references ->
                              bind
                                (prepare_uuid_refs config action value
                                   linked_references)
                                (fun (value, linked_references, footer, _) ->
                                  let metadata =
                                    if human_output_for_mode mode then
                                      prepare_property_render_metadata config
                                        invoke_config action value
                                        linked_references
                                    else pure empty_render_metadata
                                  in
                                  bind metadata (fun metadata ->
                                      let breadcrumb =
                                        if human_output_for_mode mode then
                                          fetch_breadcrumb_line invoke_config
                                            action value
                                        else pure None
                                      in
                                      bind breadcrumb (fun breadcrumb_line ->
                                          pure
                                            (show_result_with_breadcrumb mode
                                               config action value
                                               linked_references footer metadata
                                               breadcrumb_line))))))))))

let execute_with_mode action config mode =
  let run =
    match action.target with
    | By_ids ids ->
        let open Cli_effect in
        bind
          (Server_runtime.ensure_server config action.repo
             ~create_empty_db:false) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Show mode err)
          | Ok invoke_config ->
              let rec build_entries acc remaining =
                match Vec.pop_front remaining with
                | None -> pure acc
                | Some (id, rest) ->
                    bind (pull_entity invoke_config action.repo (By_id id))
                      (fun value ->
                        if missing_entity value then
                          build_entries
                            (Vec.push_back acc
                               (id, Error (entity_error (By_id id))))
                            rest
                        else if recycled_page value then
                          build_entries
                            (Vec.push_back acc
                               (id, Error (recycled_page_error ())))
                            rest
                        else
                          bind (attach_tree invoke_config action value)
                            (fun root ->
                              bind
                                (resolve_linked_blocks invoke_config action root)
                                (fun root ->
                                  bind
                                    (attach_linked_references invoke_config
                                       action root) (fun linked_references ->
                                      bind
                                        (resolve_linked_references invoke_config
                                           action linked_references)
                                        (fun linked_references ->
                                          bind
                                            (prepare_uuid_refs config action
                                               root linked_references)
                                            (fun
                                              ( root,
                                                linked_references,
                                                footer,
                                                _ )
                                            ->
                                              let metadata =
                                                if human_output_for_mode mode
                                                then
                                                  prepare_property_render_metadata
                                                    config invoke_config action
                                                    root linked_references
                                                else pure empty_render_metadata
                                              in
                                              bind metadata (fun metadata ->
                                                  build_entries
                                                    (Vec.push_back acc
                                                       ( id,
                                                         Ok
                                                           ( root,
                                                             linked_references,
                                                             footer,
                                                             metadata ) ))
                                                    rest)))))))
              in
              bind (build_entries Vec.empty ids) (fun entries ->
                  let tree_ids =
                    entries
                    |> Vec.filter_map (function
                      | id, Ok (root, _, _, _) ->
                          Some (id, collect_tree_ids root)
                      | _ -> None)
                  in
                  let contained id =
                    Vec.exists
                      (fun (other_id, ids) -> other_id <> id && Vec.mem id ids)
                      tree_ids
                  in
                  let entries =
                    Vec.filter
                      (function
                        | id, Ok _ -> not (contained id) | _, Error _ -> true)
                      entries
                  in
                  let values =
                    Vec.map
                      (function
                        | _, Ok (root, linked_references, _, _) ->
                            multi_tree_value root linked_references
                        | id, Error err -> multi_id_error_value id err)
                      entries
                  in
                  let human_messages =
                    Vec.map
                      (function
                        | _, Ok (root, linked_references, footer, metadata) ->
                            multi_tree_message mode config action root
                              linked_references footer metadata
                        | id, Error err -> multi_id_error_message id err)
                      entries
                  in
                  let data =
                    if human_output_for_mode mode then
                      Cli_result.Message
                        (Vec.string_concat
                           "\n\
                            ================================================================\n"
                           human_messages)
                    else Cli_result.Raw (Edn_util.vector_vec values)
                  in
                  pure (Cli_result.ok ~command:Command_id.Show mode data)))
    | target -> execute_single mode action config target
  in
  Cli_effect.catch run (function
    | Show_error err ->
        Cli_effect.pure (Cli_result.error ~command:Command_id.Show mode err)
    | exn -> Cli_effect.error exn)

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
          (Vec.of_array
             [|
               "logseq show --graph my-graph --page Home";
               "logseq show --graph my-graph --page Foo --page-hierarchy true";
               "logseq show --graph my-graph --page \"Meeting Notes\" --level 2";
               "logseq show --graph my-graph --id 123 --level 3";
               "logseq show --graph my-graph --id '[123,456,789]'";
               "logseq show --graph my-graph --uuid \
                11111111-1111-1111-1111-111111111111";
             |])
        Command_id.Show "Show tree";
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
