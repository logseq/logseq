type block_opts = { id_raw : string option; uuid : Cli_primitive.uuid option }
type page_opts = { id : Cli_primitive.db_id option; page : string option }

type named_entity_opts = {
  id : Cli_primitive.db_id option;
  name : string option;
}

type parsed =
  | Parsed_block of block_opts
  | Parsed_page of page_opts
  | Parsed_tag of named_entity_opts
  | Parsed_property of named_entity_opts

type action =
  | Remove_block of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      ids : Cli_primitive.db_id list;
      multi_id : bool;
      uuid : Cli_primitive.uuid option;
    }
  | Remove_page of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      page : string option;
    }
  | Remove_tag of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      name : string option;
    }
  | Remove_property of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      name : string option;
    }

let command_id = function
  | Parsed_block _ -> Command_id.Remove_block
  | Parsed_page _ -> Remove_page
  | Parsed_tag _ -> Remove_tag
  | Parsed_property _ -> Remove_property

let count_some values =
  List.fold_left
    (fun count -> function Some _ -> count + 1 | None -> count)
    0 values

let invalid_options = function
  | Parsed_block opts when count_some [ opts.id_raw; opts.uuid ] > 1 ->
      Some "only one of --id or --uuid is allowed"
  | Parsed_page opts
    when count_some [ Option.map Int64.to_string opts.id; opts.page ] > 1 ->
      Some "only one of --id or --page is allowed"
  | Parsed_page { page = Some page; _ } when String.trim page = "" ->
      Some "page must be non-empty"
  | (Parsed_tag opts | Parsed_property opts)
    when count_some [ Option.map Int64.to_string opts.id; opts.name ] > 1 ->
      Some "only one of --id or --name is allowed"
  | Parsed_tag { name = Some name; _ }
  | Parsed_property { name = Some name; _ }
    when String.trim name = "" ->
      Some "name must be non-empty"
  | _ -> None

let validate_parsed parsed =
  match invalid_options parsed with
  | Some message -> Error (Error.invalid_options message)
  | None -> Ok ()

let repo_or_error config =
  match config.Cli_config.repo with
  | Some repo -> Ok (repo, Cli_config.repo_to_graph repo)
  | None -> Error (Error.missing_repo "repo is required for remove")

let build_block repo graph (opts : block_opts) =
  match (opts.id_raw, opts.uuid) with
  | None, None ->
      Error
        (Error.make (Edn_util.keyword_t "missing-target") "block is required")
  | Some id_raw, None -> (
      match Id_parse.parse_id_string id_raw with
      | Ok ids ->
          Ok
            (Remove_block
               {
                 repo;
                 graph;
                 id = Id_parse.to_single ids;
                 ids = ids.ids;
                 multi_id = ids.multi;
                 uuid = None;
               })
      | Error err -> Error err)
  | None, Some uuid ->
      let uuid = String.trim uuid in
      if Cli_primitive.is_uuid_string uuid then
        Ok
          (Remove_block
             {
               repo;
               graph;
               id = None;
               ids = [];
               multi_id = false;
               uuid = Some uuid;
             })
      else
        Error (Error.invalid_options "Option uuid must be a valid UUID string")
  | Some _, Some _ ->
      Error (Error.invalid_options "only one of --id or --uuid is allowed")

let build_page repo graph (opts : page_opts) =
  match (opts.id, Option.map String.trim opts.page) with
  | None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-page-name")
           "page name or id is required")
  | Some id, None -> Ok (Remove_page { repo; graph; id = Some id; page = None })
  | None, Some page when page <> "" ->
      Ok (Remove_page { repo; graph; id = None; page = Some page })
  | None, Some _ -> Error (Error.invalid_options "page must be non-empty")
  | Some _, Some _ ->
      Error (Error.invalid_options "only one of --id or --page is allowed")

let build_named make repo graph (opts : named_entity_opts) =
  match (opts.id, Option.map String.trim opts.name) with
  | None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-target")
           "name or id is required")
  | Some id, None -> Ok (make repo graph (Some id) None)
  | None, Some name when name <> "" -> Ok (make repo graph None (Some name))
  | None, Some _ -> Error (Error.invalid_options "name must be non-empty")
  | Some _, Some _ ->
      Error (Error.invalid_options "only one of --id or --name is allowed")

let build ?registry:_ config _globals parsed =
  Error.bind (validate_parsed parsed) (fun () ->
      Error.bind (repo_or_error config) (fun (repo, graph) ->
          match parsed with
          | Parsed_block opts -> build_block repo graph opts
          | Parsed_page opts -> build_page repo graph opts
          | Parsed_tag opts ->
              build_named
                (fun repo graph id name -> Remove_tag { repo; graph; id; name })
                repo graph opts
          | Parsed_property opts ->
              build_named
                (fun repo graph id name ->
                  Remove_property { repo; graph; id; name })
                repo graph opts))

let kw value = Edn_util.keyword value
let vector values = Edn_util.vector values
let block_selector = vector [ kw ":db/id"; kw ":block/uuid"; kw ":block/name" ]

let page_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/name";
      kw ":block/title";
      kw ":logseq.property/deleted-at";
    ]

let entity_selector =
  vector
    [
      kw ":db/id";
      kw ":db/ident";
      kw ":block/uuid";
      kw ":block/name";
      kw ":block/title";
      kw ":logseq.property/type";
      kw ":logseq.property/public?";
      kw ":logseq.property/built-in?";
      Edn_util.map
        [
          ( kw ":block/tags",
            vector
              [
                kw ":db/id"; kw ":db/ident"; kw ":block/title"; kw ":block/name";
              ] );
        ];
    ]

let result_value value = Edn_util.map [ (kw ":result", value) ]

let entity_result_value result id name =
  Edn_util.map
    [
      (kw ":result", result);
      (kw ":id", Edn_util.int64 id);
      (kw ":name", Edn_util.string name);
    ]

let multi_block_result ~deleted_ids ~missing_ids ~result ~page_ids =
  let fields =
    [
      ( kw ":deleted-ids",
        Edn_util.vector (List.map (fun id -> Edn_util.int64 id) deleted_ids) );
      ( kw ":missing-ids",
        Edn_util.vector (List.map (fun id -> Edn_util.int64 id) missing_ids) );
      (kw ":result", result);
    ]
  in
  let fields =
    match page_ids with
    | [] -> fields
    | ids ->
        fields
        @ [
            ( kw ":page-ids",
              Edn_util.vector (List.map (fun id -> Edn_util.int64 id) ids) );
          ]
  in
  Edn_util.map fields

let uuid_of_entity value =
  Option.bind (Edn_util.get value ":block/uuid") Edn_util.as_string_like

let id_of_entity value = Edn_util.get_int64 value ":db/id"
let has_name value = Option.is_some (Edn_util.get_string value ":block/name")
let has_id value = Option.is_some (Edn_util.get_int64 value ":db/id")

let pull config repo selector lookup =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "remove pull selector" selector)
    ~lookup

let list_named_entities config repo method_ =
  let options =
    Edn_util.map_t
      [
        (kw ":include-built-in", Edn_util.bool true);
        (kw ":expand", Edn_util.bool true);
      ]
  in
  match Edn_util.keyword_to_string method_ with
  | ":thread-api/cli-list-pages" ->
      Transport.thread_api_cli_list_pages config ~repo ~options
  | ":thread-api/cli-list-tags" ->
      Transport.thread_api_cli_list_tags config ~repo ~options
  | ":thread-api/cli-list-properties" ->
      Transport.thread_api_cli_list_properties config ~repo ~options
  | method_name -> invalid_arg ("unsupported list method: " ^ method_name)

let list_pages config repo =
  list_named_entities config repo
    (Edn_util.keyword_t ":thread-api/cli-list-pages")

let apply_outliner_ops config repo ops =
  Transport.thread_api_apply_outliner_ops config ~repo
    ~ops:(Edn_util.vector_t ops) ~options:(Edn_util.map_t [])

let delete_block_uuids config repo uuids =
  let op =
    Edn_util.vector
      [
        kw ":delete-blocks";
        Edn_util.vector
          [
            Edn_util.vector (List.map (fun uuid -> Edn_util.uuid uuid) uuids);
            Edn_util.map [];
          ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let delete_page_uuid config repo uuid =
  let op =
    Edn_util.vector
      [
        kw ":delete-page";
        Edn_util.vector [ Edn_util.uuid uuid; Edn_util.map [] ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let entities_of_value value =
  match
    (Edn_util.as_list value, Edn_util.as_vector value, Edn_util.as_map value)
  with
  | Some pages, _, _ | _, Some pages, _ -> pages
  | _, _, Some _ -> [ value ]
  | _ -> []

let entity_name value =
  match Edn_util.get_string value ":block/title" with
  | Some title -> Some title
  | None -> (
      match Edn_util.get_string value ":block/name" with
      | Some name -> Some name
      | None -> (
          match Edn_util.get_string value ":title" with
          | Some title -> Some title
          | None -> Edn_util.get_string value ":name"))

let normalize_name name = String.lowercase_ascii (String.trim name)

let name_matches target entity =
  let target = normalize_name target in
  let candidates =
    [
      entity_name entity;
      Edn_util.get_string entity ":block/name";
      Edn_util.get_string entity ":block/title";
      Edn_util.get_string entity ":name";
      Edn_util.get_string entity ":title";
    ]
  in
  List.exists
    (function
      | Some candidate -> String.equal target (normalize_name candidate)
      | None -> false)
    candidates

let candidate_of_entity entity =
  match id_of_entity entity with
  | Some id -> Some { Error.id = Some id; name = entity_name entity }
  | None -> None

let plural_label = function "property" -> "properties" | label -> label ^ "s"

let ambiguous_error code label name matches =
  Error.make
    ~candidates:(List.filter_map candidate_of_entity matches)
    code
    ("multiple " ^ plural_label label ^ " match name: " ^ name
   ^ "; rerun with --id")

let tag_entity value =
  match Option.bind (Edn_util.get value ":block/tags") Edn_util.as_seq with
  | Some tags ->
      List.exists
        (fun tag ->
          match
            Option.bind (Edn_util.get tag ":db/ident") Edn_util.as_string_like
          with
          | Some (":logseq.class/Tag" | "logseq.class/Tag") -> true
          | _ -> false)
        tags
  | None -> false

let property_entity value =
  Option.is_some (Edn_util.get value ":logseq.property/type")

let validate_tag_target entity =
  if not (has_id entity) then
    Error (Error.make (Edn_util.keyword_t "tag-not-found") "tag not found")
  else if not (tag_entity entity) then
    Error
      (Error.make
         (Edn_util.keyword_t "invalid-tag-target")
         "target is not a tag")
  else if Edn_util.get_bool entity ":logseq.property/built-in?" = Some true then
    Error
      (Error.make
         (Edn_util.keyword_t "tag-built-in")
         "built-in tag cannot be removed")
  else if Edn_util.get_bool entity ":logseq.property/public?" = Some false then
    Error
      (Error.make
         (Edn_util.keyword_t "tag-hidden")
         "hidden tag cannot be removed")
  else
    match uuid_of_entity entity with
    | Some _ -> Ok entity
    | None ->
        Error
          (Error.make (Edn_util.keyword_t "tag-not-found") "tag uuid not found")

let validate_property_target entity =
  if not (has_id entity) then
    Error
      (Error.make
         (Edn_util.keyword_t "property-not-found")
         "property not found")
  else if not (property_entity entity) then
    Error
      (Error.make
         (Edn_util.keyword_t "invalid-property-target")
         "target is not a property")
  else if Edn_util.get_bool entity ":logseq.property/built-in?" = Some true then
    Error
      (Error.make
         (Edn_util.keyword_t "property-built-in")
         "built-in property cannot be removed")
  else if Edn_util.get_bool entity ":logseq.property/public?" = Some false then
    Error
      (Error.make
         (Edn_util.keyword_t "property-hidden")
         "hidden property cannot be removed")
  else
    match uuid_of_entity entity with
    | Some _ -> Ok entity
    | None ->
        Error
          (Error.make
             (Edn_util.keyword_t "property-not-found")
             "property uuid not found")

let target_name label action_name entity =
  match action_name with
  | Some name -> name
  | None -> ( match entity_name entity with Some name -> name | None -> label)

let delete_resolved_block mode invoke_config repo entity =
  let open Cli_effect in
  if not (has_id entity) then
    pure
      (Cli_result.error ~command:Command_id.Remove_block mode
         (Error.make (Edn_util.keyword_t "block-not-found") "block not found"))
  else if has_name entity then
    pure
      (Cli_result.error ~command:Command_id.Remove_block mode
         (Error.make
            (Edn_util.keyword_t "invalid-target")
            "target is not a block, use 'remove page' instead"))
  else
    match uuid_of_entity entity with
    | None ->
        pure
          (Cli_result.error ~command:Command_id.Remove_block mode
             (Error.make
                (Edn_util.keyword_t "block-not-found")
                "block uuid not found"))
    | Some uuid ->
        bind (delete_block_uuids invoke_config repo [ uuid ]) (fun result ->
            pure
              (Cli_result.ok ~command:Command_id.Remove_block mode
                 (Raw (result_value result))))

let execute_remove_block_id mode invoke_config repo id =
  let open Cli_effect in
  bind
    (pull invoke_config repo block_selector (Edn_util.int64 id))
    (delete_resolved_block mode invoke_config repo)

let execute_remove_block_uuid mode invoke_config repo uuid =
  let open Cli_effect in
  let lookup = vector [ kw ":block/uuid"; Edn_util.uuid uuid ] in
  bind (pull invoke_config repo block_selector lookup) (fun entity ->
      if has_id entity then delete_resolved_block mode invoke_config repo entity
      else
        let string_lookup = vector [ kw ":block/uuid"; Edn_util.string uuid ] in
        bind
          (pull invoke_config repo block_selector string_lookup)
          (delete_resolved_block mode invoke_config repo))

let execute_remove_block_ids mode invoke_config repo ids =
  let open Cli_effect in
  let entity_effects =
    map_s
      (fun id -> pull invoke_config repo block_selector (Edn_util.int64 id))
      ids
  in
  bind entity_effects (fun entities ->
      let id_entities = List.combine ids entities in
      let deleted_ids =
        id_entities
        |> List.filter_map (fun (id, entity) ->
            if has_id entity && not (has_name entity) then Some id else None)
      in
      let deleted_uuids =
        id_entities
        |> List.filter_map (fun (_, entity) ->
            if has_id entity && not (has_name entity) then uuid_of_entity entity
            else None)
      in
      let missing_ids =
        id_entities
        |> List.filter_map (fun (id, entity) ->
            if has_id entity then None else Some id)
      in
      let page_ids =
        id_entities
        |> List.filter_map (fun (id, entity) ->
            if has_id entity && has_name entity then Some id else None)
      in
      if deleted_ids = [] && page_ids <> [] then
        pure
          (Cli_result.error ~command:Command_id.Remove_block mode
             (Error.make
                (Edn_util.keyword_t "invalid-target")
                "target is not a block, use 'remove page' instead"))
      else
        let delete_effect =
          if deleted_uuids = [] then pure Edn_util.nil
          else delete_block_uuids invoke_config repo deleted_uuids
        in
        bind delete_effect (fun result ->
            pure
              (Cli_result.ok ~command:Command_id.Remove_block mode
                 (Raw
                    (multi_block_result ~deleted_ids ~missing_ids ~result
                       ~page_ids)))))

let execute_remove_page_id mode invoke_config repo id =
  let open Cli_effect in
  bind
    (pull invoke_config repo page_selector (Edn_util.int64 id))
    (fun entity ->
      if not (has_id entity) then
        pure
          (Cli_result.error ~command:Command_id.Remove_page mode
             (Error.make (Edn_util.keyword_t "page-not-found") "page not found"))
      else
        match uuid_of_entity entity with
        | None ->
            pure
              (Cli_result.error ~command:Command_id.Remove_page mode
                 (Error.make
                    (Edn_util.keyword_t "page-not-found")
                    "page not found"))
        | Some uuid ->
            bind (delete_page_uuid invoke_config repo uuid) (fun result ->
                pure
                  (Cli_result.ok ~command:Command_id.Remove_page mode
                     (Raw (result_value result)))))

let execute_remove_page_name mode invoke_config repo name =
  let open Cli_effect in
  bind (list_pages invoke_config repo) (fun pages_value ->
      let matches =
        pages_value |> entities_of_value |> List.filter (name_matches name)
      in
      match matches with
      | [] ->
          pure
            (Cli_result.error ~command:Command_id.Remove_page mode
               (Error.make
                  (Edn_util.keyword_t "page-not-found")
                  "page not found"))
      | _ :: _ :: _ ->
          pure
            (Cli_result.error ~command:Command_id.Remove_page mode
               (ambiguous_error
                  (Edn_util.keyword_t "ambiguous-page-name")
                  "page" name matches))
      | [ page ] -> (
          match uuid_of_entity page with
          | None ->
              pure
                (Cli_result.error ~command:Command_id.Remove_page mode
                   (Error.make
                      (Edn_util.keyword_t "page-not-found")
                      "page not found"))
          | Some uuid ->
              bind (delete_page_uuid invoke_config repo uuid) (fun result ->
                  pure
                    (Cli_result.ok ~command:Command_id.Remove_page mode
                       (Raw (result_value result))))))

let execute_remove_entity mode invoke_config repo ~command ~list_method
    ~not_found_code ~ambiguous_code ~label ~validate ~id ~name =
  let open Cli_effect in
  let delete entity resolved_name =
    match validate entity with
    | Error err -> pure (Cli_result.error ~command mode err)
    | Ok entity -> (
        match (id_of_entity entity, uuid_of_entity entity) with
        | Some id, Some uuid ->
            bind (delete_page_uuid invoke_config repo uuid) (fun result ->
                pure
                  (Cli_result.ok ~command mode
                     (Raw
                        (entity_result_value result id
                           (target_name label resolved_name entity)))))
        | _ ->
            pure
              (Cli_result.error ~command mode
                 (Error.make not_found_code (label ^ " not found"))))
  in
  match (id, name) with
  | Some id, _ ->
      bind
        (pull invoke_config repo entity_selector (Edn_util.int64 id))
        (fun entity -> delete entity None)
  | None, Some name ->
      bind (list_named_entities invoke_config repo list_method)
        (fun items_value ->
          let matches =
            items_value |> entities_of_value |> List.filter (name_matches name)
          in
          match matches with
          | [] ->
              pure
                (Cli_result.error ~command mode
                   (Error.make not_found_code (label ^ " not found")))
          | _ :: _ :: _ ->
              pure
                (Cli_result.error ~command mode
                   (ambiguous_error ambiguous_code label name matches))
          | [ item ] ->
              let lookup_name =
                Option.value
                  (Option.map normalize_name (entity_name item))
                  ~default:(normalize_name name)
              in
              let lookup =
                vector [ kw ":block/name"; Edn_util.string lookup_name ]
              in
              let resolved_name = entity_name item in
              bind (pull invoke_config repo entity_selector lookup)
                (fun entity -> delete entity resolved_name))
  | None, None ->
      pure
        (Cli_result.error ~command mode
           (Error.make
              (Edn_util.keyword_t "missing-target")
              (label ^ " name or id is required")))

let execute action config mode =
  let open Cli_effect in
  match action with
  | Remove_block { repo; id = Some id; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_block mode err)
        | Ok invoke_config -> execute_remove_block_id mode invoke_config repo id)
  | Remove_block { repo; ids; multi_id = true; _ } when ids <> [] ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_block mode err)
        | Ok invoke_config ->
            execute_remove_block_ids mode invoke_config repo ids)
  | Remove_block { repo; uuid = Some uuid; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_block mode err)
        | Ok invoke_config ->
            execute_remove_block_uuid mode invoke_config repo uuid)
  | Remove_block _ ->
      pure
        (Cli_result.error ~command:Command_id.Remove_block mode
           (Error.make
              (Edn_util.keyword_t "missing-target")
              "block is required"))
  | Remove_page { repo; id = Some id; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_page mode err)
        | Ok invoke_config -> execute_remove_page_id mode invoke_config repo id)
  | Remove_page { repo; page = Some page; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_page mode err)
        | Ok invoke_config ->
            execute_remove_page_name mode invoke_config repo page)
  | Remove_page _ ->
      pure
        (Cli_result.error ~command:Command_id.Remove_page mode
           (Error.make
              (Edn_util.keyword_t "missing-page-name")
              "page name or id is required"))
  | Remove_tag { repo; id; name; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_tag mode err)
        | Ok invoke_config ->
            execute_remove_entity mode invoke_config repo
              ~command:Command_id.Remove_tag
              ~list_method:(Edn_util.keyword_t ":thread-api/cli-list-tags")
              ~not_found_code:(Edn_util.keyword_t "tag-not-found")
              ~ambiguous_code:(Edn_util.keyword_t "ambiguous-tag-name")
              ~label:"tag" ~validate:validate_tag_target ~id ~name)
  | Remove_property { repo; id; name; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Remove_property mode err)
        | Ok invoke_config ->
            execute_remove_entity mode invoke_config repo
              ~command:Command_id.Remove_property
              ~list_method:
                (Edn_util.keyword_t ":thread-api/cli-list-properties")
              ~not_found_code:(Edn_util.keyword_t "property-not-found")
              ~ambiguous_code:(Edn_util.keyword_t "ambiguous-property-name")
              ~label:"property" ~validate:validate_property_target ~id ~name)

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
      ~examples:
        [
          "logseq remove block --graph my-graph --id 123";
          "logseq remove block --graph my-graph --id '[123,456]'";
          "logseq remove block --graph my-graph --uuid \
           7f0f4bb3-2e48-4b46-ae0f-18f52ef0f8be";
        ]
      Command_id.Remove_block "Remove blocks";
    meta
      ~examples:
        [
          "logseq remove page --graph my-graph --page Home";
          "logseq remove page --graph my-graph --id 123";
        ]
      Remove_page "Remove page";
    meta
      ~examples:[ "logseq remove tag --graph my-graph --name project" ]
      Remove_tag "Remove tag";
    meta
      ~examples:
        [
          "logseq remove property --graph my-graph --name owner";
          "logseq remove property --graph my-graph --id 321";
        ]
      Remove_property "Remove property";
  ]
