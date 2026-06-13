type opts = {
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page_name : string option;
  pos : Block.position option;
  status : string option;
  tags_edn : string option;
  properties_edn : string option;
  content : string option;
  blocks_edn : string option;
  blocks_file : Cli_primitive.path option;
}

type action = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page_name : string option;
  pos : Block.position;
  status : Cli_primitive.keyword option;
  tags : Selector.tag list;
  properties : Property.assignment list;
  blocks : Block.t list;
}

let kw value = Edn_util.keyword value
let vector values = Edn_util.vector values
let list values = Edn_util.list values
let sym value = Edn_util.symbol value
let normalized_lookup_name value = String.lowercase_ascii (String.trim value)

let edn_value_of_string ~label text =
  try Ok (Melange_edn.of_edn_string text)
  with Melange_edn.Parse_error _ ->
    Error (Error.invalid_options ("invalid " ^ label ^ " edn"))

let strip_tag_prefix value =
  let value = String.trim value in
  let rec loop index =
    if index < String.length value && value.[index] = '#' then loop (index + 1)
    else index
  in
  let start = loop 0 in
  String.sub value start (String.length value - start) |> String.trim

let tag_of_value value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_uuid value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _, _ -> Some (Selector.Tag_id id)
  | _, Some uuid, _, _ -> Some (Tag_uuid uuid)
  | _, _, Some ident, _ -> Some (Tag_ident ident)
  | _, _, _, Some value ->
      let value = strip_tag_prefix value in
      if value = "" then None
      else if Cli_primitive.is_uuid_string value then Some (Tag_uuid value)
      else if value.[0] = ':' then Some (Tag_ident (Edn_util.keyword_t value))
      else Some (Tag_name value)
  | _ -> None

let parse_tags_option = function
  | None -> Ok []
  | Some text ->
      Error.bind (edn_value_of_string ~label:"tags" text) (fun value ->
          match Edn_util.as_vector value with
          | Some [] ->
              Error (Error.invalid_options "tags must be a non-empty vector")
          | Some values ->
              let rec loop acc = function
                | [] -> Ok (List.rev acc)
                | value :: rest -> (
                    match tag_of_value value with
                    | Some tag -> loop (tag :: acc) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             "tags must be strings, keywords, uuids, or ids"))
              in
              loop [] values
          | None -> Error (Error.invalid_options "tags must be a vector"))

let parse_tags_vector_option = parse_tags_option

let normalize_property_name value =
  let value = String.trim value in
  if value = "" then None else Some (Edn_util.keyword_t value)

let property_key_of_value value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _ -> Some (Property.Key_id id)
  | _, Some ident, _ -> Some (Key_ident ident)
  | _, _, Some value ->
      Option.map
        (fun ident -> Property.Key_ident ident)
        (normalize_property_name value)
  | _ -> None

let parse_properties_option ?(allow_non_built_in = false) = function
  | None -> Ok []
  | Some text ->
      let _ = allow_non_built_in in
      Error.bind (edn_value_of_string ~label:"properties" text) (fun value ->
          match Edn_util.as_map value with
          | Some [] ->
              Error (Error.invalid_options "properties must be a non-empty map")
          | Some fields ->
              let rec loop acc = function
                | [] -> Ok (List.rev acc)
                | (key, value) :: rest -> (
                    match property_key_of_value key with
                    | Some key -> loop ({ Property.key; value } :: acc) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn.to_edn_string key)))
              in
              loop [] fields
          | None -> Error (Error.invalid_options "properties must be a map"))

let parse_properties_vector_option ?(allow_non_built_in = false) = function
  | None -> Ok []
  | Some text ->
      let _ = allow_non_built_in in
      Error.bind (edn_value_of_string ~label:"properties" text) (fun value ->
          match Edn_util.as_vector value with
          | Some [] ->
              Error
                (Error.invalid_options "properties must be a non-empty vector")
          | Some values ->
              let rec loop acc = function
                | [] -> Ok (List.rev acc)
                | value :: rest -> (
                    match property_key_of_value value with
                    | Some key -> loop (key :: acc) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn.to_edn_string value)))
              in
              loop [] values
          | None -> Error (Error.invalid_options "properties must be a vector"))

let normalize_status value =
  match String.lowercase_ascii (String.trim value) with
  | "" -> None
  | "todo" | "later" -> Some (Edn_util.keyword_t "logseq.property/status.todo")
  | "doing" | "now" | "in-progress" | "in progress" | "inprogress" ->
      Some (Edn_util.keyword_t "logseq.property/status.doing")
  | "done" -> Some (Edn_util.keyword_t "logseq.property/status.done")
  | "wait" | "waiting" | "backlog" ->
      Some (Edn_util.keyword_t "logseq.property/status.backlog")
  | "canceled" | "cancelled" ->
      Some (Edn_util.keyword_t "logseq.property/status.canceled")
  | "in-review" | "in_review" | "inreview" ->
      Some (Edn_util.keyword_t "logseq.property/status.in-review")
  | value when String.length value > 0 && value.[0] = ':' ->
      Some (Edn_util.keyword_t value)
  | _ -> None

let invalid_options (opts : opts) =
  let target_selectors =
    List.filter Option.is_some
      [
        Option.map Int64.to_string opts.target_id;
        opts.target_uuid;
        Option.map String.trim opts.target_page_name;
      ]
  in
  let nonempty = function
    | Some value -> String.trim value <> ""
    | None -> false
  in
  let has_blocks =
    nonempty opts.blocks_edn || Option.is_some opts.blocks_file
  in
  let has_metadata = nonempty opts.tags_edn || nonempty opts.properties_edn in
  let invalid_target_uuid =
    match opts.target_uuid with
    | Some uuid -> not (Cli_primitive.is_uuid_string uuid)
    | None -> false
  in
  match (opts.pos, opts.target_page_name, target_selectors) with
  | _, _, _ when invalid_target_uuid ->
      Some "Option target-uuid must be a valid UUID string"
  | Some Block.Sibling, Some page, _ when String.trim page <> "" ->
      Some "--pos sibling is only valid for block targets"
  | Some Block.Sibling, _, [] ->
      Some "--pos sibling is only valid for block targets"
  | _, _, _ when List.length target_selectors > 1 ->
      Some
        "only one of --target-id, --target-uuid, or --target-page-name is \
         allowed"
  | _, _, _ when has_blocks && has_metadata ->
      Some
        "tags and properties cannot be combined with --blocks or --blocks-file"
  | _ -> None

module Node_crypto = struct
  external random_uuid : unit -> string = "randomUUID" [@@mel.module "crypto"]
end

let generate_uuid = Node_crypto.random_uuid

let rec block_of_value raw =
  match Edn_util.as_map raw with
  | Some fields ->
      let find key =
        List.find_map
          (fun (k, v) ->
            match Edn_util.as_string_like k with
            | Some k when k = key -> Some v
            | _ -> None)
          fields
      in
      let title =
        match
          ( Option.bind (find "block/title") Edn_util.as_string,
            Option.bind (find "block/content") Edn_util.as_string )
        with
        | Some value, _ | _, Some value -> Some value
        | _ -> None
      in
      let uuid = Option.bind (find "block/uuid") Edn_util.as_string_like in
      let tags =
        Option.value
          (Option.map
             (List.filter_map tag_of_value)
             (Option.bind (find "block/tags") Edn_util.as_seq))
          ~default:[]
      in
      let children =
        Option.value
          (Option.map (List.map block_of_value)
             (Option.bind (find "block/children") Edn_util.as_seq))
          ~default:[]
      in
      { (Block.make ?uuid ?title ~children ()) with tags; raw }
  | None -> (
      match Edn_util.as_string raw with
      | Some title -> Block.make ~title ()
      | None -> { (Block.make ()) with raw })

let ensure_block_uuid block =
  match block.Block.uuid with
  | Some _ -> block
  | None -> { block with uuid = Some (generate_uuid ()) }

let rec ensure_block_uuids block =
  let children = List.map ensure_block_uuids block.Block.children in
  ensure_block_uuid { block with children }

let parse_blocks_edn ~label text =
  Error.bind (edn_value_of_string ~label text) (function value ->
      (match Edn_util.as_vector value with
      | Some values -> Ok (List.map block_of_value values)
      | None ->
          Error
            (Error.make
               (Edn_util.keyword_t "invalid-blocks")
               "blocks must be a vector")))

let read_file path = Cli_unix.read_text_file path

let read_blocks (opts : opts) args =
  match
    (opts.blocks_edn, opts.blocks_file, Option.map String.trim opts.content)
  with
  | Some text, _, _ -> parse_blocks_edn ~label:"blocks" text
  | None, Some path, _ -> parse_blocks_edn ~label:"blocks" (read_file path)
  | None, None, Some content when content <> "" ->
      Ok [ Block.make ~title:content () ]
  | None, None, _ when args <> [] ->
      Ok [ Block.make ~title:(String.concat " " args) () ]
  | _ ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-content")
           "content is required")

let build_add_block_action (opts : opts) args repo =
  match invalid_options opts with
  | Some message -> Error (Error.invalid_options message)
  | None ->
      Error.bind (read_blocks opts args) (fun blocks ->
          Error.bind (parse_tags_option opts.tags_edn) (fun tags ->
              Error.bind (parse_properties_option opts.properties_edn)
                (fun properties ->
                  let pos = Option.value opts.pos ~default:Block.Last_child in
                  let status = Option.bind opts.status normalize_status in
                  match (Option.map String.trim opts.status, status) with
                  | Some status_text, None when status_text <> "" ->
                      Error
                        (Error.invalid_options
                           ("invalid status: " ^ status_text))
                  | _ ->
                      let blocks = List.map ensure_block_uuids blocks in
                      Ok
                        {
                          repo;
                          graph = Cli_config.repo_to_graph repo;
                          target_id = opts.target_id;
                          target_uuid = opts.target_uuid;
                          target_page_name = opts.target_page_name;
                          pos;
                          status;
                          tags;
                          properties;
                          blocks;
                        })))

let page_selector =
  vector [ kw "db/id"; kw "block/uuid"; kw "block/name"; kw "block/title" ]

let tag_selector =
  vector
    [
      kw "db/id";
      kw "block/uuid";
      kw "block/name";
      kw "block/title";
      Edn_util.map [ (kw "block/tags", vector [ kw "db/ident" ]) ];
      kw "logseq.property/public?";
      kw "logseq.property/built-in?";
    ]

let property_entity_selector =
  vector
    [
      kw "db/id";
      kw "db/ident";
      kw "block/name";
      kw "block/title";
      kw "logseq.property/type";
      kw "db/cardinality";
      kw "logseq.property/public?";
    ]

let page_query selector =
  Edn_util.map
    [
      ( kw "find",
        vector [ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
      );
      (kw "in", list [ sym "$"; sym "?name" ]);
      (kw "where", vector [ vector [ sym "?e"; kw "block/name"; sym "?name" ] ]);
    ]

let tag_query selector =
  Edn_util.map
    [
      ( kw "find",
        vector [ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
      );
      (kw "in", list [ sym "$"; sym "?name" ]);
      ( kw "where",
        vector
          [
            vector [ sym "?e"; kw "block/name"; sym "?name" ];
            vector [ sym "?e"; kw "block/tags"; sym "?t" ];
            vector [ sym "?t"; kw "db/ident"; kw "logseq.class/Tag" ];
          ] );
    ]

let property_query selector =
  Edn_util.map
    [
      ( kw "find",
        vector [ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
      );
      (kw "in", list [ sym "$"; sym "?name" ]);
      ( kw "where",
        vector
          [
            vector [ sym "?e"; kw "block/name"; sym "?name" ];
            vector [ sym "?e"; kw "block/tags"; sym "?t" ];
            vector [ sym "?t"; kw "db/ident"; kw "logseq.class/Property" ];
          ] );
    ]

let first_entity = function
  | value -> (
      match
        (Edn_util.as_vector value, Edn_util.as_list value, Edn_util.as_map value)
      with
      | Some (first :: _), _, _ | _, Some (first :: _), _ -> Some first
      | _, _, Some _ -> Some value
      | _ -> None)

let uuid_of_entity value =
  Option.bind (Edn_util.get value "block/uuid") Edn_util.as_string_like

let id_of_entity value = Edn_util.get_int64 value "db/id"

let ident_of_entity value =
  Option.bind (Edn_util.get value "db/ident") Edn_util.as_keyword_t

let pull_entity config repo selector lookup =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "add pull selector" selector)
    ~lookup

let apply_outliner_ops config repo ops =
  Transport.thread_api_apply_outliner_ops config ~repo
    ~ops:(Edn_util.vector_t ops) ~options:(Edn_util.map_t [])

let create_page config repo name =
  let op =
    Edn_util.vector
      [
        kw "create-page";
        Edn_util.vector [ Edn_util.string name; Edn_util.map [] ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let pull_pages_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [ page_query selector; Edn_util.string (normalized_lookup_name name) ])

let pull_tag_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [ tag_query selector; Edn_util.string (normalized_lookup_name name) ])

let pull_property_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [
           property_query selector;
           Edn_util.string (normalized_lookup_name name);
         ])

let pull_created_page config repo name create_result =
  match (Edn_util.as_vector create_result, Edn_util.as_list create_result) with
  | Some (_ :: uuid_value :: _), _ | _, Some (_ :: uuid_value :: _) -> (
      match Edn_util.as_string_like uuid_value with
      | Some uuid ->
          pull_entity config repo
            (vector [ kw "db/id"; kw "block/uuid" ])
            (vector [ kw "block/uuid"; Edn_util.uuid uuid ])
      | _ ->
          pull_entity config repo
            (vector [ kw "db/id"; kw "block/uuid" ])
            (vector
               [
                 kw "block/name"; Edn_util.string (normalized_lookup_name name);
               ]))
  | _ ->
      pull_entity config repo
        (vector [ kw "db/id"; kw "block/uuid" ])
        (vector
           [ kw "block/name"; Edn_util.string (normalized_lookup_name name) ])

let ensure_page config repo page_name =
  let open Cli_effect in
  bind (pull_pages_by_name config repo page_name page_selector) (fun result ->
      match Option.bind (first_entity result) uuid_of_entity with
      | Some uuid -> pure (Ok uuid)
      | None ->
          bind (create_page config repo page_name) (fun create_result ->
              bind (pull_created_page config repo page_name create_result)
                (fun page ->
                  match uuid_of_entity page with
                  | Some uuid -> pure (Ok uuid)
                  | None ->
                      pure
                        (Error
                           (Error.make
                              (Edn_util.keyword_t "page-not-found")
                              "page not found")))))

let resolve_add_target config (action : action) =
  let open Cli_effect in
  match (action.target_id, action.target_uuid, action.target_page_name) with
  | Some id, _, _ ->
      bind
        (pull_entity config action.repo
           (vector [ kw "db/id"; kw "block/uuid"; kw "block/title" ])
           (Edn_util.int64 id))
        (fun block ->
          match uuid_of_entity block with
          | Some uuid -> pure (Ok uuid)
          | None ->
              pure
                (Error
                   (Error.make
                      (Edn_util.keyword_t "target-not-found")
                      "target block not found")))
  | None, Some uuid, _ ->
      bind
        (pull_entity config action.repo
           (vector [ kw "db/id"; kw "block/uuid"; kw "block/title" ])
           (vector [ kw "block/uuid"; Edn_util.uuid uuid ]))
        (fun block ->
          match uuid_of_entity block with
          | Some uuid -> pure (Ok uuid)
          | None ->
              pure
                (Error
                   (Error.make
                      (Edn_util.keyword_t "target-not-found")
                      "target block not found")))
  | None, None, Some page_name -> ensure_page config action.repo page_name
  | None, None, None ->
      pure
        (Error
           (Error.make
              (Edn_util.keyword_t "missing-target")
              "target page or block is required"))

let flatten_blocks blocks =
  let rec flatten_one parent_uuid block =
    let parent =
      match parent_uuid with
      | Some uuid -> Some (Selector.Block_uuid uuid)
      | None -> block.Block.parent
    in
    let children = block.children in
    let block = { block with parent; children = [] } in
    let child_parent_uuid = block.Block.uuid in
    block :: List.concat_map (flatten_one child_parent_uuid) children
  in
  List.concat_map (flatten_one None) blocks

let insert_opts = function
  | Block.Last_child ->
      Edn_util.map
        [
          (kw "sibling?", Edn_util.bool false);
          (kw "bottom?", Edn_util.bool true);
          (kw "keep-uuid?", Edn_util.bool true);
          (kw "outliner-op", kw "insert-blocks");
        ]
  | First_child ->
      Edn_util.map
        [
          (kw "sibling?", Edn_util.bool false);
          (kw "keep-uuid?", Edn_util.bool true);
          (kw "outliner-op", kw "insert-blocks");
        ]
  | Sibling ->
      Edn_util.map
        [
          (kw "sibling?", Edn_util.bool true);
          (kw "keep-uuid?", Edn_util.bool true);
          (kw "outliner-op", kw "insert-blocks");
        ]

let collect_uuids_from_value value =
  let rec loop acc value =
    match Edn_util.as_map value with
    | Some fields ->
        let acc =
          match
            Option.bind
              (Edn_util.get value "block/uuid")
              Edn_util.as_string_like
          with
          | Some uuid -> uuid :: acc
          | _ -> acc
        in
        List.fold_left (fun acc (k, v) -> loop (loop acc k) v) acc fields
    | None -> (
        match Edn_util.as_seq value with
        | Some values -> List.fold_left loop acc values
        | None -> acc)
  in
  List.rev (loop [] value)

let unique values =
  let rec loop seen = function
    | [] -> List.rev seen
    | value :: rest when List.mem value seen -> loop seen rest
    | value :: rest -> loop (value :: seen) rest
  in
  loop [] values

let collect_action_block_uuids blocks =
  blocks |> flatten_blocks
  |> List.filter_map (fun block -> block.Block.uuid)
  |> unique

let result_ids ids =
  Edn_util.map
    [
      (kw "result", Edn_util.vector (List.map (fun id -> Edn_util.int64 id) ids));
    ]

let lookup_of_tag = function
  | Selector.Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string (normalized_lookup_name name)
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid -> vector [ kw "block/uuid"; Edn_util.uuid uuid ]

let tag_entity value =
  match Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq with
  | Some tags ->
      List.exists
        (fun tag ->
          match
            Option.bind (Edn_util.get tag "db/ident") Edn_util.as_string_like
          with
          | Some "logseq.class/Tag" -> true
          | _ -> false)
        tags
  | None -> false

let resolve_tag_entity invoke_config repo tag =
  let open Cli_effect in
  let pulled =
    match tag with
    | Selector.Tag_name name ->
        pull_tag_by_name invoke_config repo name tag_selector
    | _ -> pull_entity invoke_config repo tag_selector (lookup_of_tag tag)
  in
  bind pulled (fun entity ->
      match first_entity entity with
      | Some entity
        when Option.is_some (id_of_entity entity) && tag_entity entity ->
          pure (Entity.of_value entity)
      | Some _ -> failwith "tag not found"
      | None -> failwith "tag not found")

let resolve_tags config repo tags =
  match tags with
  | [] -> Cli_effect.pure []
  | _ ->
      let open Cli_effect in
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err -> failwith err.message
        | Ok invoke_config ->
            all (List.map (resolve_tag_entity invoke_config repo) tags))

let lookup_property_entity invoke_config repo = function
  | Property.Key_id id ->
      pull_entity invoke_config repo property_entity_selector
        (Edn_util.int64 id)
  | Key_ident ident ->
      pull_entity invoke_config repo property_entity_selector
        (vector [ kw "db/ident"; Edn_util.any ident ])
  | Key_name name ->
      let open Cli_effect in
      bind
        (pull_property_by_name invoke_config repo name property_entity_selector)
        (fun result ->
          match first_entity result with
          | Some entity when Option.is_some (id_of_entity entity) -> pure entity
          | _ ->
              let ident = Edn_util.keyword_t name in
              pull_entity invoke_config repo property_entity_selector
                (vector [ kw "db/ident"; Edn_util.any ident ]))

let resolve_property_assignment invoke_config repo assignment =
  let open Cli_effect in
  bind (lookup_property_entity invoke_config repo assignment.Property.key)
    (fun entity ->
      match
        ( id_of_entity entity,
          ident_of_entity entity,
          Edn_util.get entity "logseq.property/type" )
      with
      | Some _, Some ident, Some _ ->
          pure { assignment with Property.key = Property.Key_ident ident }
      | _ -> failwith "property not found")

let resolve_properties config repo properties =
  match properties with
  | [] -> Cli_effect.pure []
  | _ ->
      let open Cli_effect in
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err -> failwith err.message
        | Ok invoke_config ->
            all
              (List.map
                 (resolve_property_assignment invoke_config repo)
                 properties))

let resolve_created_ids config repo blocks insert_result =
  let open Cli_effect in
  let uuids =
    match collect_uuids_from_value insert_result with
    | [] -> collect_action_block_uuids blocks
    | uuids -> unique uuids
  in
  let rec loop acc = function
    | [] -> pure (Ok (List.rev acc))
    | uuid :: rest ->
        bind
          (pull_entity config repo
             (vector [ kw "db/id"; kw "block/uuid" ])
             (vector [ kw "block/uuid"; Edn_util.uuid uuid ]))
          (fun entity ->
            match id_of_entity entity with
            | Some id -> loop (id :: acc) rest
            | None ->
                pure
                  (Error
                     (Error.make
                        (Edn_util.keyword_t "add-id-resolution-failed")
                        "unable to resolve created ids")))
  in
  loop [] uuids

let property_key_to_value = function
  | Property.Key_ident ident -> Edn_util.any ident
  | Key_id id -> Edn_util.int64 id
  | Key_name name -> Edn_util.string name

let metadata_ops block_uuids status tags properties =
  let uuid_values =
    Edn_util.vector (List.map (fun uuid -> Edn_util.uuid uuid) block_uuids)
  in
  let status_ops =
    match (status, block_uuids) with
    | Some status, _ :: _ ->
        [
          Edn_util.vector
            [
              kw "batch-set-property";
              Edn_util.vector
                [
                  uuid_values;
                  kw "logseq.property/status";
                  Edn_util.any status;
                  Edn_util.map [];
                ];
            ];
        ]
    | _ -> []
  in
  let tag_ops =
    tags
    |> List.filter_map (fun tag -> tag.Entity.id)
    |> unique
    |> List.map (fun tag_id ->
        Edn_util.vector
          [
            kw "batch-set-property";
            Edn_util.vector
              [
                uuid_values;
                kw "block/tags";
                Edn_util.int64 tag_id;
                Edn_util.map [];
              ];
          ])
  in
  let property_ops =
    List.map
      (fun assignment ->
        Edn_util.vector
          [
            kw "batch-set-property";
            Edn_util.vector
              [
                uuid_values;
                property_key_to_value assignment.Property.key;
                assignment.value;
                Edn_util.map [];
              ];
          ])
      properties
  in
  if block_uuids = [] then [] else status_ops @ tag_ops @ property_ops

let execute_add_block action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
    | Ok invoke_config ->
        bind (resolve_add_target invoke_config action) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
          | Ok target_uuid ->
              bind (resolve_tags config action.repo action.tags) (fun tags ->
                  bind (resolve_properties config action.repo action.properties)
                    (fun properties ->
                      let all_blocks = Block.flatten action.blocks in
                      let block_uuids =
                        List.filter_map
                          (fun block -> block.Block.uuid)
                          all_blocks
                        |> unique
                      in
                      let block_for_insert block =
                        { block with Block.parent = None; children = [] }
                      in
                      let insert_blocks target_uuid pos blocks =
                        let insert_op =
                          Edn_util.vector
                            [
                              kw "insert-blocks";
                              Edn_util.vector
                                [
                                  Edn_util.vector
                                    (List.map
                                       (fun block ->
                                         Edn_util.any
                                           (Block.to_value
                                              (block_for_insert block)))
                                       blocks);
                                  Edn_util.uuid target_uuid;
                                  insert_opts pos;
                                ];
                            ]
                        in
                        apply_outliner_ops invoke_config action.repo
                          [ insert_op ]
                      in
                      let rec insert_tree target_uuid pos blocks =
                        if blocks = [] then pure Edn_util.nil
                        else
                          bind (insert_blocks target_uuid pos blocks)
                            (fun insert_result ->
                              let rec insert_children acc = function
                                | [] -> pure acc
                                | block :: rest -> (
                                    match block.Block.uuid with
                                    | None -> insert_children acc rest
                                    | Some uuid ->
                                        bind
                                          (insert_tree uuid Block.Last_child
                                             block.Block.children)
                                          (fun child_result ->
                                            let acc =
                                              if Edn_util.is_null acc then
                                                child_result
                                              else acc
                                            in
                                            insert_children acc rest))
                              in
                              insert_children insert_result blocks)
                      in
                      bind (insert_tree target_uuid action.pos action.blocks)
                        (fun insert_result ->
                          let metadata_ops =
                            metadata_ops block_uuids action.status tags
                              properties
                          in
                          bind
                            (if metadata_ops = [] then pure Edn_util.nil
                             else
                               apply_outliner_ops invoke_config action.repo
                                 metadata_ops)
                            (fun _metadata_result ->
                              bind
                                (resolve_created_ids invoke_config action.repo
                                   all_blocks insert_result) (function
                                | Error err ->
                                    pure
                                      (Cli_result.error
                                         ~command:Command_id.Upsert_block mode
                                         err)
                                | Ok ids ->
                                    pure
                                      (Cli_result.ok
                                         ~command:Command_id.Upsert_block mode
                                         (Raw (result_ids ids))))))))))
