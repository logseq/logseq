type opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  status : string option;
  content : string option;
  update_tags_edn : string option;
  update_properties_edn : string option;
  remove_tags_edn : string option;
  remove_properties_edn : string option;
  blocks_edn : string option;
  blocks_file : Cli_primitive.path option;
}

type parsed = Parsed_update_block of opts

type action = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  update_tags : Selector.tag Rrbvec.t;
  update_properties : Property.assignment Rrbvec.t;
  remove_tags : Selector.tag Rrbvec.t;
  remove_properties : Property.key Rrbvec.t;
  content : string option;
  source_label : string option;
  target_label : string option;
}

let kw value = Edn_util.keyword value
let vector_vec values = Edn_util.vector_vec values
let vector values = vector_vec values

let trim_non_empty = function
  | None -> None
  | Some value ->
      let value = String.trim value in
      if value = "" then None else Some value

let count_present values =
  Vec.fold_left
    (fun count -> function Some _ -> count + 1 | None -> count)
    0 values

let has_text value = Option.is_some (trim_non_empty value)

let invalid_uuid_option option_name = function
  | Some value when not (Cli_primitive.is_uuid_string value) ->
      Some ("Option " ^ option_name ^ " must be a valid UUID string")
  | _ -> None

let invalid_options (opts : opts) =
  let source_selectors =
    Vec.of_array
      [| Option.map Int64.to_string opts.id; trim_non_empty opts.uuid |]
  in
  let target_page = trim_non_empty opts.target_page in
  let target_selectors =
    Vec.of_array
      [|
        Option.map Int64.to_string opts.target_id;
        trim_non_empty opts.target_uuid;
        target_page;
      |]
  in
  let has_target = count_present target_selectors > 0 in
  let has_updates =
    has_text opts.update_tags_edn
    || has_text opts.update_properties_edn
    || has_text opts.remove_tags_edn
    || has_text opts.remove_properties_edn
    || Option.is_some opts.status
    || Option.is_some opts.content
  in
  match invalid_uuid_option "uuid" opts.uuid with
  | Some message -> Some message
  | None -> (
      match invalid_uuid_option "target-uuid" opts.target_uuid with
      | Some message -> Some message
      | None ->
          if count_present source_selectors > 1 then
            Some "only one of --id or --uuid is allowed"
          else if count_present target_selectors > 1 then
            Some
              "only one of --target-id, --target-uuid, or --target-page is \
               allowed"
          else if opts.pos = Some Block.Sibling && Option.is_some target_page
          then Some "--pos sibling is only valid for block targets"
          else if Option.is_some opts.pos && not has_target then
            Some "--pos is only valid when a target option is provided"
          else if (not has_target) && not has_updates then
            Some "target or update/remove options are required"
          else if
            Option.is_some opts.blocks_edn || Option.is_some opts.blocks_file
          then Some "--blocks and --blocks-file are only for create mode"
          else None)

let command_id _ = Command_id.Upsert_block

let validate_parsed (Parsed_update_block opts) =
  match invalid_options opts with
  | Some message -> Error (Error.invalid_options message)
  | None -> Ok ()

let parse_tags_edn _label value =
  match value with
  | None -> Ok Vec.empty
  | Some text when String.trim text = "" -> Ok Vec.empty
  | Some _ -> Add.parse_tags_vector_option value

let property_key_of_value value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _ -> Some (Property.Key_id id)
  | _, Some ident, _ -> Some (Key_ident ident)
  | _, _, Some name ->
      let name = String.trim name in
      if name = "" then None else Some (Key_name name)
  | _ -> None

let edn_value_of_string ~label text =
  try Ok (Melange_edn_melange.of_edn_string text)
  with Melange_edn_melange.Parse_error _ ->
    Error (Error.invalid_options ("invalid " ^ label ^ " edn"))

let parse_properties_edn value =
  match value with
  | None -> Ok Vec.empty
  | Some text when String.trim text = "" -> Ok Vec.empty
  | Some text ->
      Error.bind (edn_value_of_string ~label:"properties" text) (fun parsed ->
          match Edn_util.as_map parsed with
          | Some fields when Vec.is_empty fields ->
              Error (Error.invalid_options "properties must be a non-empty map")
          | Some fields ->
              let rec loop acc remaining =
                match Vec.pop_front remaining with
                | None -> Ok acc
                | Some ((key, value), rest) -> (
                    match property_key_of_value key with
                    | Some key ->
                        loop (Vec.push_back acc { Property.key; value }) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn_melange.to_edn_string key)))
              in
              loop Vec.empty fields
          | None -> Error (Error.invalid_options "properties must be a map"))

let parse_property_keys_edn value =
  match value with
  | None -> Ok Vec.empty
  | Some text when String.trim text = "" -> Ok Vec.empty
  | Some text ->
      Error.bind (edn_value_of_string ~label:"properties" text) (fun parsed ->
          match Edn_util.as_vector parsed with
          | Some values when Vec.is_empty values ->
              Error
                (Error.invalid_options "properties must be a non-empty vector")
          | Some values ->
              let rec loop acc remaining =
                match Vec.pop_front remaining with
                | None -> Ok acc
                | Some (value, rest) -> (
                    match property_key_of_value value with
                    | Some key -> loop (Vec.push_back acc key) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn_melange.to_edn_string value)))
              in
              loop Vec.empty values
          | None -> Error (Error.invalid_options "properties must be a vector"))

let status_assignment = function
  | None -> Ok Vec.empty
  | Some status -> (
      match Add.normalize_status status with
      | Some ident ->
          Ok
            (Vec.singleton
               {
                 Property.key =
                   Property.Key_ident
                     (Edn_util.keyword_t "logseq.property/status");
                 value = Edn_util.any ident;
               })
      | None -> Error (Error.invalid_options ("invalid status: " ^ status)))

let source_label (opts : opts) =
  match (trim_non_empty opts.uuid, opts.id) with
  | Some uuid, _ -> Some uuid
  | None, Some id -> Some (Int64.to_string id)
  | None, None -> None

let target_label (opts : opts) =
  match
    ( trim_non_empty opts.target_page,
      trim_non_empty opts.target_uuid,
      opts.target_id )
  with
  | Some page, _, _ -> Some ("page:" ^ page)
  | None, Some uuid, _ -> Some uuid
  | None, None, Some id -> Some (Int64.to_string id)
  | None, None, None -> None

let opts_has_target (opts : opts) =
  Option.is_some opts.target_id
  || Option.is_some (trim_non_empty opts.target_uuid)
  || Option.is_some (trim_non_empty opts.target_page)

let action_has_target (action : action) =
  Option.is_some action.target_id
  || Option.is_some action.target_uuid
  || Option.is_some action.target_page

let build_action opts repo =
  match invalid_options opts with
  | Some message -> Error (Error.invalid_options message)
  | None ->
      if Option.is_none opts.id && Option.is_none (trim_non_empty opts.uuid)
      then Error (Error.make Error.Missing_source "source block is required")
      else
        Error.bind (status_assignment opts.status) (fun status_properties ->
            Error.bind (parse_tags_edn "update-tags" opts.update_tags_edn)
              (fun update_tags ->
                Error.bind (parse_tags_edn "remove-tags" opts.remove_tags_edn)
                  (fun remove_tags ->
                    Error.bind (parse_properties_edn opts.update_properties_edn)
                      (fun update_properties ->
                        Error.bind
                          (parse_property_keys_edn opts.remove_properties_edn)
                          (fun remove_properties ->
                            Ok
                              {
                                repo;
                                graph = Cli_config.repo_to_graph repo;
                                id = opts.id;
                                uuid = trim_non_empty opts.uuid;
                                target_id = opts.target_id;
                                target_uuid = trim_non_empty opts.target_uuid;
                                target_page = trim_non_empty opts.target_page;
                                pos =
                                  (if opts_has_target opts then
                                     Some
                                       (Option.value opts.pos
                                          ~default:Block.First_child)
                                   else None);
                                update_tags;
                                update_properties =
                                  Vec.append status_properties update_properties;
                                remove_tags;
                                remove_properties;
                                content = opts.content;
                                source_label = source_label opts;
                                target_label = target_label opts;
                              })))))

let build ?registry:_ config _globals (Parsed_update_block opts) =
  match config.Cli_config.repo with
  | None -> Error (Error.missing_repo "repo is required for update")
  | Some repo -> build_action opts repo

let block_selector =
  vector_vec
    (Vec.of_array
       [| kw "db/id"; kw "block/uuid"; kw "block/name"; kw "block/title" |])

let page_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         kw "logseq.property/deleted-at";
       |])

let tag_selector =
  vector_vec
    (Vec.of_array
       [| kw "db/id"; kw "block/uuid"; kw "block/name"; kw "block/title" |])

let property_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "db/ident";
         kw "block/name";
         kw "block/title";
         kw "logseq.property/type";
       |])

let id_of_entity value = Edn_util.get_int64 value "db/id"

let uuid_of_entity value =
  Option.bind (Edn_util.get value "block/uuid") Edn_util.as_string_like

let ident_of_entity value =
  Option.bind (Edn_util.get value "db/ident") Edn_util.as_keyword_t

let page_entity value = Option.is_some (Edn_util.get_string value "block/name")

let recycled_entity value =
  Option.is_some (Edn_util.get value "logseq.property/deleted-at")

let page_not_found () = Error.make Error.Page_not_found "page not found"
let recycled_page_error () = Error.make Error.Recycled_page "page is recycled"

let pull invoke_config repo selector lookup =
  Transport.thread_api_pull invoke_config ~repo
    ~selector:(Edn_util.expect_vector_t "update pull selector" selector)
    ~lookup

let pull_by_id invoke_config repo selector id =
  pull invoke_config repo selector (Edn_util.int64 id)

let pull_by_uuid invoke_config repo selector uuid =
  pull invoke_config repo selector
    (vector_vec (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))

let normalized_page_name value = String.lowercase_ascii (String.trim value)
let variable value = Edn_util.symbol value
let list_vec values = Edn_util.list_vec values
let list values = list_vec values

let query_value query =
  Edn_util.any (Cli_primitive.datascript_query_to_edn query)

let class_query selector class_ident =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.of_array
         [|
           vector_vec
             (Vec.of_array
                [|
                  list_vec
                    (Vec.of_array
                       [| variable "pull"; variable "?e"; selector |]);
                  variable "...";
                |]);
         |])
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?name";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| variable "?e"; kw "block/name"; variable "?name" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| variable "?e"; kw "block/tags"; variable "?t" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| variable "?t"; kw "db/ident"; kw class_ident |]));
         |])
    ()

let tag_query selector = query_value (class_query selector "logseq.class/Tag")
let property_query selector = class_query selector "logseq.class/Property"

let first_entity value =
  match
    (Edn_util.as_vector value, Edn_util.as_list value, Edn_util.as_map value)
  with
  | Some values, _, _ when not (Vec.is_empty values) -> Some (Vec.hd values)
  | _, Some values, _ when not (Vec.is_empty values) -> Some (Vec.hd values)
  | _, _, Some _ -> Some value
  | _ -> None

let pull_tag_by_name invoke_config repo name =
  Transport.thread_api_q invoke_config ~repo
    ~query:
      (Edn_util.vector_t_vec
         (Vec.of_array
            [|
              tag_query tag_selector;
              Edn_util.string (normalized_page_name name);
            |]))

let list_tags invoke_config repo =
  Transport.thread_api_cli_list_tags invoke_config ~repo
    ~options:(Edn_util.map_t_vec Vec.empty)

let tag_name_matches name entity =
  let expected = normalized_page_name name in
  let matches value = String.equal (normalized_page_name value) expected in
  match
    ( Edn_util.get_string entity "block/title",
      Edn_util.get_string entity "block/name" )
  with
  | Some title, _ when matches title -> true
  | _, Some name when matches name -> true
  | _ -> false

let find_tag_by_name invoke_config repo name =
  let open Cli_effect in
  bind (list_tags invoke_config repo) (fun value ->
      match Edn_util.as_seq value with
      | Some tags -> pure (Vec.find_opt (tag_name_matches name) tags)
      | None -> pure None)

let pull_property_by_name invoke_config repo name =
  Transport.thread_api_q invoke_config ~repo
    ~query:
      (Edn_util.vector_t_vec
         (Vec.of_array
            [|
              query_value (property_query property_selector);
              Edn_util.string (normalized_page_name name);
            |]))

let source_not_found () =
  Error.make Error.Source_not_found "source block not found"

let target_not_found () =
  Error.make Error.Target_not_found "target block not found"

let ensure_non_page entity message code =
  if page_entity entity then Error (Error.make code message) else Ok entity

let resolve_source invoke_config repo action =
  let open Cli_effect in
  match (action.id, action.uuid) with
  | Some id, _ ->
      bind (pull_by_id invoke_config repo block_selector id) (fun entity ->
          match id_of_entity entity with
          | None -> pure (Error (source_not_found ()))
          | Some _ ->
              pure
                (ensure_non_page entity "source must be a non-page block"
                   Error.Invalid_source))
  | None, Some uuid ->
      bind (pull_by_uuid invoke_config repo block_selector uuid) (fun entity ->
          match id_of_entity entity with
          | None -> pure (Error (source_not_found ()))
          | Some _ ->
              pure
                (ensure_non_page entity "source must be a non-page block"
                   Error.Invalid_source))
  | None, None ->
      pure (Error (Error.make Error.Missing_source "source is required"))

let resolve_target invoke_config repo action =
  let open Cli_effect in
  match (action.target_id, action.target_uuid, action.target_page) with
  | Some id, _, _ ->
      bind (pull_by_id invoke_config repo block_selector id) (fun entity ->
          match id_of_entity entity with
          | None -> pure (Error (target_not_found ()))
          | Some _ ->
              pure
                (ensure_non_page entity "target must be a block"
                   Error.Invalid_target))
  | None, Some uuid, _ ->
      bind (pull_by_uuid invoke_config repo block_selector uuid) (fun entity ->
          match id_of_entity entity with
          | None -> pure (Error (target_not_found ()))
          | Some _ ->
              pure
                (ensure_non_page entity "target must be a block"
                   Error.Invalid_target))
  | None, None, Some page ->
      bind
        (pull invoke_config repo page_selector
           (vector_vec
              (Vec.of_array
                 [|
                   kw "block/name"; Edn_util.string (normalized_page_name page);
                 |])))
        (fun entity ->
          match id_of_entity entity with
          | None -> pure (Error (page_not_found ()))
          | Some _ when recycled_entity entity ->
              pure (Error (recycled_page_error ()))
          | Some _ -> pure (Ok entity))
  | None, None, None ->
      pure (Error (Error.make Error.Missing_target "target is required"))

let pos_opts = function
  | Some Block.Last_child ->
      Edn_util.map_vec
        (Vec.of_array
           [|
             (kw "sibling?", Edn_util.bool false);
             (kw "bottom?", Edn_util.bool true);
           |])
  | Some Sibling ->
      Edn_util.map_vec (Vec.of_array [| (kw "sibling?", Edn_util.bool true) |])
  | Some First_child | None ->
      Edn_util.map_vec (Vec.of_array [| (kw "sibling?", Edn_util.bool false) |])

let lookup_of_tag = function
  | Selector.Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string (normalized_page_name name)
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid -> Edn_util.uuid uuid

let resolve_tag_id invoke_config repo = function
  | Selector.Tag_id id -> Cli_effect.pure (Ok id)
  | Tag_name name ->
      let open Cli_effect in
      bind (find_tag_by_name invoke_config repo name) (fun result ->
          match Option.bind result id_of_entity with
          | Some id -> pure (Ok id)
          | None ->
              pure (Error (Error.make Error.Tag_not_found "tag not found")))
  | (Tag_ident _ | Tag_uuid _) as tag ->
      let open Cli_effect in
      bind
        (pull invoke_config repo tag_selector (lookup_of_tag tag))
        (fun result ->
          match id_of_entity result with
          | Some id -> pure (Ok id)
          | None ->
              pure (Error (Error.make Error.Tag_not_found "tag not found")))

let resolve_property_ident invoke_config repo = function
  | Property.Key_ident ident -> Cli_effect.pure (Ok ident)
  | Key_id id ->
      let open Cli_effect in
      bind
        (pull invoke_config repo
           (vector_vec (Vec.of_array [| kw "db/ident" |]))
           (Edn_util.int64 id))
        (fun result ->
          match ident_of_entity result with
          | Some ident -> pure (Ok ident)
          | None ->
              pure
                (Error
                   (Error.make Error.Property_not_found "property not found")))
  | Key_name name ->
      let open Cli_effect in
      bind (pull_property_by_name invoke_config repo name) (fun result ->
          match Option.bind (first_entity result) ident_of_entity with
          | Some ident -> pure (Ok ident)
          | None ->
              let ident = Edn_util.keyword_t name in
              bind
                (pull invoke_config repo
                   (vector_vec (Vec.of_array [| kw "db/id" |]))
                   (vector_vec
                      (Vec.of_array [| kw "db/ident"; Edn_util.any ident |])))
                (fun result ->
                  if Option.is_some (id_of_entity result) then pure (Ok ident)
                  else
                    pure
                      (Error
                         (Error.make Error.Property_not_found
                            "property not found"))))

let resolve_tag_ids invoke_config repo tags =
  let open Cli_effect in
  let rec loop acc remaining =
    match Vec.pop_front remaining with
    | None -> pure (Ok acc)
    | Some (tag, rest) ->
        bind (resolve_tag_id invoke_config repo tag) (function
          | Error err -> pure (Error err)
          | Ok id -> loop (Vec.push_back acc id) rest)
  in
  loop Vec.empty tags

let resolve_property_keys invoke_config repo keys =
  let open Cli_effect in
  let rec loop acc remaining =
    match Vec.pop_front remaining with
    | None -> pure (Ok acc)
    | Some (key, rest) ->
        bind (resolve_property_ident invoke_config repo key) (function
          | Error err -> pure (Error err)
          | Ok ident -> loop (Vec.push_back acc ident) rest)
  in
  loop Vec.empty keys

let resolve_property_assignments invoke_config repo assignments =
  let open Cli_effect in
  let rec loop acc remaining =
    match Vec.pop_front remaining with
    | None -> pure (Ok acc)
    | Some (assignment, rest) ->
        bind (resolve_property_ident invoke_config repo assignment.Property.key)
          (function
          | Error err -> pure (Error err)
          | Ok ident -> loop (Vec.push_back acc (ident, assignment.value)) rest)
  in
  loop Vec.empty assignments

let property_ops block_uuids ~update_tag_ids ~remove_tag_ids ~update_properties
    ~remove_properties =
  let uuid_values =
    Edn_util.vector_vec (block_uuids |> Vec.map (fun uuid -> Edn_util.uuid uuid))
  in
  let remove_tag_ops =
    Vec.map
      (fun tag_id ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-delete-property-value";
               Edn_util.vector_vec
                 (Vec.of_array
                    [| uuid_values; kw "block/tags"; Edn_util.int64 tag_id |]);
             |]))
      remove_tag_ids
  in
  let remove_property_ops =
    Vec.map
      (fun ident ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-remove-property";
               Edn_util.vector_vec
                 (Vec.of_array [| uuid_values; Edn_util.any ident |]);
             |]))
      remove_properties
  in
  let update_tag_ops =
    Vec.map
      (fun tag_id ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-set-property";
               Edn_util.vector_vec
                 (Vec.of_array
                    [|
                      uuid_values;
                      kw "block/tags";
                      Edn_util.int64 tag_id;
                      Edn_util.map_vec Vec.empty;
                    |]);
             |]))
      update_tag_ids
  in
  let update_property_ops =
    Vec.map
      (fun (ident, value) ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-set-property";
               Edn_util.vector_vec
                 (Vec.of_array
                    [|
                      uuid_values;
                      Edn_util.any ident;
                      value;
                      Edn_util.map_vec Vec.empty;
                    |]);
             |]))
      update_properties
  in
  Vec.append remove_tag_ops
    (Vec.append remove_property_ops
       (Vec.append update_tag_ops update_property_ops))

let resolve_update_ops invoke_config repo action block_uuids =
  let open Cli_effect in
  bind (resolve_tag_ids invoke_config repo action.update_tags) (function
    | Error err -> pure (Error err)
    | Ok update_tag_ids ->
        bind (resolve_tag_ids invoke_config repo action.remove_tags) (function
          | Error err -> pure (Error err)
          | Ok remove_tag_ids ->
              bind
                (resolve_property_assignments invoke_config repo
                   action.update_properties) (function
                | Error err -> pure (Error err)
                | Ok update_properties ->
                    bind
                      (resolve_property_keys invoke_config repo
                         action.remove_properties) (function
                      | Error err -> pure (Error err)
                      | Ok remove_properties ->
                          pure
                            (Ok
                               (property_ops block_uuids ~update_tag_ids
                                  ~remove_tag_ids ~update_properties
                                  ~remove_properties))))))

let apply_outliner_ops invoke_config repo ops =
  Transport.thread_api_apply_outliner_ops invoke_config ~repo
    ~ops:(Edn_util.vector_t_vec ops)
    ~options:(Edn_util.map_t_vec Vec.empty)

let save_ops source_uuid = function
  | Some content ->
      Vec.singleton
        (Edn_util.vector_vec
           (Vec.of_array
              [|
                kw "save-block";
                Edn_util.vector_vec
                  (Vec.of_array
                     [|
                       Edn_util.map_vec
                         (Vec.of_array
                            [|
                              (kw "block/uuid", Edn_util.uuid source_uuid);
                              (kw "block/title", Edn_util.string content);
                            |]);
                       Edn_util.map_vec Vec.empty;
                     |]);
              |]))
  | None -> Vec.empty

let move_ops source_uuid pos = function
  | Some target_uuid ->
      Vec.singleton
        (Edn_util.vector_vec
           (Vec.of_array
              [|
                kw "move-blocks";
                Edn_util.vector_vec
                  (Vec.of_array
                     [|
                       Edn_util.vector_vec
                         (Vec.of_array [| Edn_util.uuid source_uuid |]);
                       Edn_util.uuid target_uuid;
                       pos_opts pos;
                     |]);
              |]))
  | None -> Vec.empty

let execute_ops mode invoke_config action source_uuid target_uuid =
  let open Cli_effect in
  bind
    (resolve_update_ops invoke_config action.repo action
       (Vec.singleton source_uuid))
    (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
      | Ok property_ops ->
          let ops =
            Vec.append
              (save_ops source_uuid action.content)
              (Vec.append
                 (move_ops source_uuid action.pos target_uuid)
                 property_ops)
          in
          if Vec.is_empty ops then
            pure
              (Cli_result.ok ~command:Command_id.Upsert_block mode
                 (Raw
                    (Edn_util.map_vec
                       (Vec.of_array [| (kw "result", Edn_util.nil) |]))))
          else
            bind (apply_outliner_ops invoke_config action.repo ops)
              (fun result ->
                pure
                  (Cli_result.ok ~command:Command_id.Upsert_block mode
                     (Raw
                        (Edn_util.map_vec
                           (Vec.of_array [| (kw "result", result) |]))))))

let resolve_optional_target_uuid invoke_config action =
  let open Cli_effect in
  if action_has_target action then
    bind (resolve_target invoke_config action.repo action) (function
      | Error err -> pure (Error err)
      | Ok target -> (
          match uuid_of_entity target with
          | Some target_uuid -> pure (Ok (Some target_uuid))
          | None ->
              pure
                (Error
                   (Error.make Error.Target_not_found
                      "target block uuid not found"))))
  else pure (Ok None)

let execute action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
    | Ok invoke_config ->
        bind (resolve_source invoke_config action.repo action) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
          | Ok source -> (
              match uuid_of_entity source with
              | None ->
                  pure
                    (Cli_result.error ~command:Command_id.Upsert_block mode
                       (Error.make Error.Source_not_found
                          "source block uuid not found"))
              | Some source_uuid ->
                  bind (resolve_optional_target_uuid invoke_config action)
                    (function
                    | Error err ->
                        pure
                          (Cli_result.error ~command:Command_id.Upsert_block
                             mode err)
                    | Ok target_uuid ->
                        execute_ops mode invoke_config action source_uuid
                          target_uuid))))

let metadata () =
  Vec.singleton
    {
      Command_registry.id = Command_id.Upsert_block;
      path = Command_id.to_path Command_id.Upsert_block;
      doc = "Upsert block";
      long_doc = None;
      examples =
        Vec.of_array
          [|
            "logseq upsert block --graph my-graph --id 123 --content \"Updated \
             content\"";
            "logseq upsert block --graph my-graph --id 123 --target-page Home \
             --pos last-child";
            "logseq upsert block --graph my-graph --uuid \
             11111111-1111-1111-1111-111111111111 --status done";
          |];
      options = Vec.empty;
      category = Command_registry.Graph_inspect_and_edit;
      requires_graph = Command_id.requires_graph Command_id.Upsert_block;
      requires_auth = Command_id.requires_auth Command_id.Upsert_block;
      write_command = Command_id.is_write Command_id.Upsert_block;
      human_table_headers_order = Vec.empty;
    }
