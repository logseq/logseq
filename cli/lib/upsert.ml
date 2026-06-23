type mode = Create | Update | Page

type block_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  content : string option;
  blocks_edn : string option;
  blocks_file : Cli_primitive.path option;
  update_tags_edn : string option;
  update_properties_edn : string option;
  remove_tags_edn : string option;
  remove_properties_edn : string option;
}

type page_opts = {
  id : Cli_primitive.db_id option;
  page : string option;
  restore : bool;
  update_tags_edn : string option;
  update_properties_edn : string option;
  remove_tags_edn : string option;
  remove_properties_edn : string option;
}

type task_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  page : string option;
  content : string option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  status : string option;
  priority : string option;
  scheduled : Js.Date.t option;
  deadline : Js.Date.t option;
  no_status : bool;
  no_priority : bool;
  no_scheduled : bool;
  no_deadline : bool;
}

type asset_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  path : Cli_primitive.path option;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page : string option;
  pos : Block.position option;
  content : string option;
}

type tag_opts = {
  id : Cli_primitive.db_id option;
  name : string option;
  add_properties_edn : string option;
  remove_properties_edn : string option;
}

type property_opts = {
  id : Cli_primitive.db_id option;
  name : string option;
  kind : Property.kind option;
  cardinality : Property.cardinality option;
  hide : bool option;
  public : bool option;
}

type parsed =
  | Parsed_block of block_opts
  | Parsed_page of page_opts
  | Parsed_task of task_opts
  | Parsed_asset of asset_opts
  | Parsed_tag of tag_opts
  | Parsed_property of property_opts

type block_target =
  | Target_id of Cli_primitive.db_id
  | Target_uuid of Cli_primitive.uuid
  | Target_page of string

type block_source =
  | Source_id of Cli_primitive.db_id
  | Source_uuid of Cli_primitive.uuid

type block_create = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target : block_target;
  pos : Block.position;
  status : Cli_primitive.keyword option;
  tags : Selector.tag list;
  properties : Property.assignment list;
  blocks : Block.t list;
  update_plan : Property.update_plan;
}

type block_update = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  source : block_source;
  target : block_target option;
  pos : Block.position option;
  update_tags : Selector.tag list;
  update_properties : Property.assignment list;
  remove_tags : Selector.tag list;
  remove_properties : Property.key list;
  content : string option;
  source_label : string option;
  target_label : string option;
}

type block_action =
  | Block_create of block_create
  | Block_update of block_update

type action =
  | Upsert_block of block_action
  | Upsert_page of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      page : string option;
      restore : bool;
      plan : Property.update_plan;
    }
  | Upsert_task of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
      page : string option;
      content : string option;
      update_properties : Property.assignment list;
      clear_properties : Property.key list;
      status_input : string option;
    }
  | Upsert_asset of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
      path : Cli_primitive.path option;
      content : string option;
      create_action : block_create option;
    }
  | Upsert_tag of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      name : string option;
      add_properties : Property.key list;
      remove_properties : Property.key list;
    }
  | Upsert_property of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      mode : mode;
      id : Cli_primitive.db_id option;
      name : string option;
      schema : Property.schema;
    }

let update_mode (opts : block_opts) =
  Option.is_some opts.id || Option.is_some opts.uuid

let normalize_tag_name value =
  let value = String.trim value in
  let rec drop_hash idx =
    if idx < String.length value && value.[idx] = '#' then drop_hash (idx + 1)
    else idx
  in
  let start = drop_hash 0 in
  let value =
    String.sub value start (String.length value - start) |> String.trim
  in
  if value = "" then None else Some value

let normalized_lookup_name value = String.lowercase_ascii (String.trim value)

let strip_keyword_prefix value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let nonempty_trimmed = function
  | Some value ->
      let value = String.trim value in
      if value = "" then None else Some value
  | None -> None

let count_present values =
  List.fold_left
    (fun count -> function Some _ -> count + 1 | None -> count)
    0 values

let invalid_uuid_option option_name = function
  | Some value when not (Cli_primitive.is_uuid_string (String.trim value)) ->
      Some ("Option " ^ option_name ^ " must be a valid UUID string")
  | _ -> None

let rec first_error = function
  | [] -> None
  | Some message :: _ -> Some message
  | None :: rest -> first_error rest

let invalid_uuid_options = function
  | Parsed_block opts ->
      first_error
        [
          invalid_uuid_option "uuid" opts.uuid;
          invalid_uuid_option "target-uuid" opts.target_uuid;
        ]
  | Parsed_task opts ->
      first_error
        [
          invalid_uuid_option "uuid" opts.uuid;
          invalid_uuid_option "target-uuid" opts.target_uuid;
        ]
  | Parsed_asset opts ->
      first_error
        [
          invalid_uuid_option "uuid" opts.uuid;
          invalid_uuid_option "target-uuid" opts.target_uuid;
        ]
  | _ -> None

let update_opts_of_block_opts (opts : block_opts) : Update.opts =
  {
    id = opts.id;
    uuid = opts.uuid;
    target_id = opts.target_id;
    target_uuid = opts.target_uuid;
    target_page = opts.target_page;
    pos = opts.pos;
    status = None;
    content = opts.content;
    update_tags_edn = opts.update_tags_edn;
    update_properties_edn = opts.update_properties_edn;
    remove_tags_edn = opts.remove_tags_edn;
    remove_properties_edn = opts.remove_properties_edn;
    blocks_edn = opts.blocks_edn;
    blocks_file = opts.blocks_file;
  }

let invalid_options = function
  | Parsed_block opts when update_mode opts ->
      Update.invalid_options (update_opts_of_block_opts opts)
  | Parsed_block opts
    when (not (update_mode opts))
         && (Option.is_some opts.remove_tags_edn
            || Option.is_some opts.remove_properties_edn) ->
      Some "--remove-tags and --remove-properties are only for update mode"
  | Parsed_page opts
    when count_present
           [ Option.map Int64.to_string opts.id; nonempty_trimmed opts.page ]
         > 1 ->
      Some "only one of --id or --page is allowed"
  | Parsed_page { page = Some page; _ } when String.trim page = "" ->
      Some "page must be non-empty"
  | Parsed_tag { name = Some name; _ } when normalize_tag_name name = None ->
      Some "tag name must not be blank"
  | Parsed_property opts
    when count_present
           [ Option.map Int64.to_string opts.id; nonempty_trimmed opts.name ]
         > 1 ->
      Some "only one of --id or --name is allowed"
  | Parsed_property { name = Some name; _ } when String.trim name = "" ->
      Some "name must be non-empty"
  | Parsed_asset opts ->
      let path = nonempty_trimmed opts.path in
      let target_page = nonempty_trimmed opts.target_page in
      let target_selectors =
        [
          Option.map Int64.to_string opts.target_id;
          opts.target_uuid;
          target_page;
        ]
      in
      let update_mode = Option.is_some opts.id || Option.is_some opts.uuid in
      if Option.is_some opts.id && Option.is_some opts.uuid then
        Some "only one of --id or --uuid is allowed"
      else if update_mode && Option.is_some path then
        Some "--path is only valid in create mode"
      else if (not update_mode) && Option.is_none path then
        Some "--path is required in create mode"
      else if count_present target_selectors > 1 then
        Some
          "only one of --target-id, --target-uuid, or --target-page is allowed"
      else if
        update_mode
        && (count_present target_selectors > 0 || Option.is_some opts.pos)
      then Some "--target-* and --pos are only valid in create mode"
      else if Option.is_some opts.pos && count_present target_selectors = 0 then
        Some "--pos is only valid when a target option is provided"
      else if opts.pos = Some Block.Sibling && Option.is_some target_page then
        Some "--pos sibling is only valid for block targets"
      else None
  | Parsed_task opts ->
      let uuid = nonempty_trimmed opts.uuid in
      let page = nonempty_trimmed opts.page in
      let content = nonempty_trimmed opts.content in
      let target_page = nonempty_trimmed opts.target_page in
      let status = nonempty_trimmed opts.status in
      let priority = nonempty_trimmed opts.priority in
      let selectors = [ Option.map Int64.to_string opts.id; uuid; page ] in
      let target_selectors =
        [
          Option.map Int64.to_string opts.target_id;
          opts.target_uuid;
          target_page;
        ]
      in
      let selector_mode = count_present selectors > 0 in
      if count_present selectors > 1 then
        Some "only one of --id, --uuid, or --page is allowed"
      else if Option.is_some page && Option.is_some content then
        Some "--content and --page are mutually exclusive"
      else if
        (Option.is_some opts.id || Option.is_some uuid)
        && Option.is_some content
      then Some "--content is only valid when creating a block task"
      else if count_present target_selectors > 1 then
        Some
          "only one of --target-id, --target-uuid, or --target-page is allowed"
      else if
        selector_mode
        && (count_present target_selectors > 0 || Option.is_some opts.pos)
      then
        Some
          "--target-* and --pos are only valid when creating a block task with \
           --content"
      else if Option.is_some opts.pos && count_present target_selectors = 0 then
        Some "--pos is only valid when a target option is provided"
      else if opts.pos = Some Block.Sibling && Option.is_some target_page then
        Some "--pos sibling is only valid for block targets"
      else if Option.is_some status && opts.no_status then
        Some "--status and --no-status are mutually exclusive"
      else if Option.is_some priority && opts.no_priority then
        Some "--priority and --no-priority are mutually exclusive"
      else if Option.is_some opts.scheduled && opts.no_scheduled then
        Some "--scheduled and --no-scheduled are mutually exclusive"
      else if Option.is_some opts.deadline && opts.no_deadline then
        Some "--deadline and --no-deadline are mutually exclusive"
      else None
  | _ -> None

let command_id = function
  | Parsed_block _ -> Command_id.Upsert_block
  | Parsed_page _ -> Upsert_page
  | Parsed_task _ -> Upsert_task
  | Parsed_asset _ -> Upsert_asset
  | Parsed_tag _ -> Upsert_tag
  | Parsed_property _ -> Upsert_property

let validate_parsed parsed =
  match invalid_uuid_options parsed with
  | Some message -> Error (Error.invalid_options message)
  | None -> (
      match invalid_options parsed with
      | Some message -> Error (Error.invalid_options message)
      | None -> Ok ())

let repo_or_error config =
  match config.Cli_config.repo with
  | Some repo -> Ok (repo, Cli_config.repo_to_graph repo)
  | None -> Error (Error.missing_repo "repo is required for upsert")

let ordinal value =
  let suffix =
    match value mod 100 with
    | 11 | 12 | 13 -> "th"
    | _ -> (
        match value mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th")
  in
  string_of_int value ^ suffix

let default_journal_title () =
  let year, month, day = Time.local_date (Time.now ()) in
  let months =
    [|
      "Jan";
      "Feb";
      "Mar";
      "Apr";
      "May";
      "Jun";
      "Jul";
      "Aug";
      "Sep";
      "Oct";
      "Nov";
      "Dec";
    |]
  in
  months.(month - 1) ^ " " ^ ordinal day ^ ", " ^ string_of_int year

let block_target_of_parts target_id target_uuid target_page =
  match
    (target_id, nonempty_trimmed target_uuid, nonempty_trimmed target_page)
  with
  | Some id, None, None -> Ok (Target_id id)
  | None, Some uuid, None -> Ok (Target_uuid uuid)
  | None, None, Some page -> Ok (Target_page page)
  | None, None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-target")
           "target page or block is required")
  | _ ->
      Error
        (Error.invalid_options
           "only one of --target-id, --target-uuid, or --target-page is allowed")

let optional_block_target_of_parts target_id target_uuid target_page =
  match
    (target_id, nonempty_trimmed target_uuid, nonempty_trimmed target_page)
  with
  | None, None, None -> Ok None
  | Some id, None, None -> Ok (Some (Target_id id))
  | None, Some uuid, None -> Ok (Some (Target_uuid uuid))
  | None, None, Some page -> Ok (Some (Target_page page))
  | _ ->
      Error
        (Error.invalid_options
           "only one of --target-id, --target-uuid, or --target-page is allowed")

let add_action_of_block_create (action : block_create) : Add.action =
  let target_id, target_uuid, target_page_name =
    match action.target with
    | Target_id id -> (Some id, None, None)
    | Target_uuid uuid -> (None, Some uuid, None)
    | Target_page page -> (None, None, Some page)
  in
  {
    Add.repo = action.repo;
    graph = action.graph;
    target_id;
    target_uuid;
    target_page_name;
    pos = action.pos;
    status = action.status;
    tags = action.tags;
    properties = action.properties;
    blocks = action.blocks;
  }

let block_create_of_add_action ~update_plan (action : Add.action) =
  Error.map
    (fun target ->
      {
        repo = action.repo;
        graph = action.graph;
        target;
        pos = action.pos;
        status = action.status;
        tags = action.tags;
        properties = action.properties;
        blocks = action.blocks;
        update_plan;
      })
    (block_target_of_parts action.target_id action.target_uuid
       action.target_page_name)

let block_update_of_update_action (action : Update.action) =
  let source =
    match (action.id, action.uuid) with
    | Some id, None -> Ok (Source_id id)
    | None, Some uuid -> Ok (Source_uuid uuid)
    | _ ->
        Error
          (Error.make
             (Edn_util.keyword_t "missing-source")
             "source block is required")
  in
  Error.bind source (fun source ->
      Error.map
        (fun target ->
          {
            repo = action.repo;
            graph = action.graph;
            source;
            target;
            pos = action.pos;
            update_tags = action.update_tags;
            update_properties = action.update_properties;
            remove_tags = action.remove_tags;
            remove_properties = action.remove_properties;
            content = action.content;
            source_label = action.source_label;
            target_label = action.target_label;
          })
        (optional_block_target_of_parts action.target_id action.target_uuid
           action.target_page))

let update_action_of_block_update (action : block_update) : Update.action =
  let id, uuid =
    match action.source with
    | Source_id id -> (Some id, None)
    | Source_uuid uuid -> (None, Some uuid)
  in
  let target_id, target_uuid, target_page =
    match action.target with
    | None -> (None, None, None)
    | Some (Target_id id) -> (Some id, None, None)
    | Some (Target_uuid uuid) -> (None, Some uuid, None)
    | Some (Target_page page) -> (None, None, Some page)
  in
  {
    Update.repo = action.repo;
    graph = action.graph;
    id;
    uuid;
    target_id;
    target_uuid;
    target_page;
    pos = action.pos;
    update_tags = action.update_tags;
    update_properties = action.update_properties;
    remove_tags = action.remove_tags;
    remove_properties = action.remove_properties;
    content = action.content;
    source_label = action.source_label;
    target_label = action.target_label;
  }

let normalize_page_name_input value =
  let value = String.trim value in
  if value = "" then None else Some value

let strip_tag_prefix value =
  let value = String.trim value in
  let rec loop idx =
    if idx < String.length value && value.[idx] = '#' then loop (idx + 1)
    else idx
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

let key_of_value = Property.parse_key

let edn_value_of_string ~label text =
  try Ok (Melange_edn.of_edn_string text)
  with Melange_edn.Parse_error _ ->
    Error (Error.invalid_options ("invalid " ^ label ^ " edn"))

let parse_vector_edn ~label text =
  Error.bind (edn_value_of_string ~label text) (fun parsed ->
      match Edn_util.as_vector parsed with
      | Some values -> Ok values
      | _ -> Error (Error.invalid_options (label ^ " must be a vector")))

let parse_tags_edn ~label = function
  | None -> Ok []
  | Some text ->
      Error.bind (parse_vector_edn ~label text) (fun values ->
          let rec loop acc = function
            | [] -> Ok (List.rev acc)
            | value :: rest -> (
                match tag_of_value value with
                | Some tag -> loop (tag :: acc) rest
                | None ->
                    Error
                      (Error.invalid_options
                         (label
                        ^ " must contain strings, keywords, uuids, or ids")))
          in
          loop [] values)

let parse_property_keys_edn ~label = function
  | None -> Ok []
  | Some text ->
      Error.bind (parse_vector_edn ~label text) (fun values ->
          let rec loop acc = function
            | [] -> Ok (List.rev acc)
            | value :: rest -> (
                match key_of_value value with
                | Some key -> loop (key :: acc) rest
                | None ->
                    Error
                      (Error.invalid_options
                         (label ^ " must contain property keys")))
          in
          loop [] values)

let parse_tag_schema_properties opts =
  Error.bind
    (parse_property_keys_edn ~label:"add-properties" opts.add_properties_edn)
    (fun add_properties ->
      Error.map
        (fun remove_properties -> (add_properties, remove_properties))
        (parse_property_keys_edn ~label:"remove-properties"
           opts.remove_properties_edn))

let build_tag repo graph (opts : tag_opts) =
  Error.bind (parse_tag_schema_properties opts)
    (fun (add_properties, remove_properties) ->
      match (opts.id, Option.bind opts.name normalize_tag_name) with
      | Some id, name ->
          Ok
            (Upsert_tag
               {
                 repo;
                 graph;
                 mode = Update;
                 id = Some id;
                 name;
                 add_properties;
                 remove_properties;
               })
      | None, Some name ->
          Ok
            (Upsert_tag
               {
                 repo;
                 graph;
                 mode = Create;
                 id = None;
                 name = Some name;
                 add_properties;
                 remove_properties;
               })
      | None, None ->
          Error
            (Error.make
               (Edn_util.keyword_t "missing-tag-name")
               "tag name is required"))

let parse_property_assignments_edn ~label = function
  | None -> Ok []
  | Some text ->
      Error.bind (edn_value_of_string ~label text) (fun parsed ->
          match Edn_util.as_map parsed with
          | Some fields ->
              let rec loop acc = function
                | [] -> Ok (List.rev acc)
                | (key, value) :: rest -> (
                    match key_of_value key with
                    | Some key -> loop ({ Property.key; value } :: acc) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             (label ^ " must contain property keys")))
              in
              loop [] fields
          | _ -> Error (Error.invalid_options (label ^ " must be a map")))

let parse_update_plan (opts : page_opts) =
  Error.bind (parse_tags_edn ~label:"update-tags" opts.update_tags_edn)
    (fun update_tags ->
      Error.bind (parse_tags_edn ~label:"remove-tags" opts.remove_tags_edn)
        (fun remove_tags ->
          Error.bind
            (parse_property_assignments_edn ~label:"update-properties"
               opts.update_properties_edn) (fun update_properties ->
              Error.bind
                (parse_property_keys_edn ~label:"remove-properties"
                   opts.remove_properties_edn) (fun remove_properties ->
                  Ok
                    {
                      Property.update_tags;
                      remove_tags;
                      update_properties;
                      remove_properties;
                    }))))

let build_page repo graph (opts : page_opts) =
  Error.bind (parse_update_plan opts) (fun plan ->
      match (opts.id, Option.bind opts.page normalize_page_name_input) with
      | Some id, page ->
          Ok
            (Upsert_page
               {
                 repo;
                 graph;
                 mode = Update;
                 id = Some id;
                 page;
                 restore = opts.restore;
                 plan;
               })
      | None, Some page ->
          Ok
            (Upsert_page
               {
                 repo;
                 graph;
                 mode = Create;
                 id = None;
                 page = Some page;
                 restore = opts.restore;
                 plan;
               })
      | None, None ->
          Error
            (Error.make
               (Edn_util.keyword_t "missing-page-name")
               "page name is required"))

let schema_of_property_opts (opts : property_opts) =
  {
    Property.kind = opts.kind;
    cardinality = opts.cardinality;
    hidden = opts.hide;
    public = opts.public;
  }

let normalize_property_name value =
  let value = String.trim value in
  if value = "" then None else Some value

let build_property repo graph (opts : property_opts) =
  let schema = schema_of_property_opts opts in
  match (opts.id, Option.bind opts.name normalize_property_name) with
  | Some id, name ->
      Ok
        (Upsert_property
           { repo; graph; mode = Update; id = Some id; name; schema })
  | None, Some name ->
      Ok
        (Upsert_property
           { repo; graph; mode = Create; id = None; name = Some name; schema })
  | None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-property-name")
           "property name is required")

let normalize_content value =
  let value = String.trim value in
  if value = "" then None else Some value

let normalize_priority value =
  match String.lowercase_ascii (String.trim value) with
  | "low" -> Some (Edn_util.keyword_t "logseq.property/priority.low")
  | "medium" -> Some (Edn_util.keyword_t "logseq.property/priority.medium")
  | "high" -> Some (Edn_util.keyword_t "logseq.property/priority.high")
  | "urgent" -> Some (Edn_util.keyword_t "logseq.property/priority.urgent")
  | _ -> None

let invalid_priority_message value =
  "Invalid value for option :priority: " ^ value
  ^ ". Available values: low, medium, high, urgent"

let build_asset repo graph (opts : asset_opts) =
  let content = Option.bind opts.content normalize_content in
  match (opts.id, opts.uuid, opts.path) with
  | Some id, None, _ ->
      Ok
        (Upsert_asset
           {
             repo;
             graph;
             mode = Update;
             id = Some id;
             uuid = None;
             path = None;
             content;
             create_action = None;
           })
  | None, Some uuid, _ ->
      Ok
        (Upsert_asset
           {
             repo;
             graph;
             mode = Update;
             id = None;
             uuid = Some uuid;
             path = None;
             content;
             create_action = None;
           })
  | None, None, Some path ->
      let title =
        match content with
        | Some content -> content
        | None -> Filename.basename path
      in
      let add_opts =
        {
          Add.target_id = opts.target_id;
          target_uuid = opts.target_uuid;
          target_page_name = opts.target_page;
          pos = opts.pos;
          status = None;
          tags_edn = None;
          properties_edn = None;
          content = Some title;
          blocks_edn = None;
          blocks_file = None;
        }
      in
      Error.bind (Add.build_add_block_action add_opts [] repo)
        (fun create_action ->
          Error.map
            (fun create_action ->
              Upsert_asset
                {
                  repo;
                  graph;
                  mode = Create;
                  id = None;
                  uuid = None;
                  path = Some path;
                  content = Some title;
                  create_action = Some create_action;
                })
            (block_create_of_add_action ~update_plan:Property.empty_update_plan
               create_action))
  | None, None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-asset-selector")
           "asset id, uuid, or path is required")
  | Some _, Some _, _ ->
      Error (Error.invalid_options "only one of --id or --uuid is allowed")

let build_task repo graph (opts : task_opts) =
  let priority = Option.bind opts.priority normalize_priority in
  match (opts.priority, priority) with
  | Some value, None ->
      Error (Error.invalid_options (invalid_priority_message value))
  | _ -> (
      let clear_properties =
        let properties = [] in
        let properties =
          if opts.no_status then
            Property.Key_ident (Edn_util.keyword_t "logseq.property/status")
            :: properties
          else properties
        in
        let properties =
          if opts.no_priority then
            Property.Key_ident (Edn_util.keyword_t "logseq.property/priority")
            :: properties
          else properties
        in
        let properties =
          if opts.no_scheduled then
            Property.Key_ident (Edn_util.keyword_t "logseq.property/scheduled")
            :: properties
          else properties
        in
        let properties =
          if opts.no_deadline then
            Property.Key_ident (Edn_util.keyword_t "logseq.property/deadline")
            :: properties
          else properties
        in
        List.rev properties
      in
      let update_properties =
        let properties = [] in
        let properties =
          match priority with
          | Some priority ->
              {
                Property.key =
                  Property.Key_ident
                    (Edn_util.keyword_t "logseq.property/priority");
                value = Edn_util.any priority;
              }
              :: properties
          | None -> properties
        in
        let properties =
          match opts.scheduled with
          | Some scheduled ->
              {
                Property.key =
                  Property.Key_ident
                    (Edn_util.keyword_t "logseq.property/scheduled");
                value = Edn_util.float (Js.Date.getTime scheduled);
              }
              :: properties
          | None -> properties
        in
        let properties =
          match opts.deadline with
          | Some deadline ->
              {
                Property.key =
                  Property.Key_ident
                    (Edn_util.keyword_t "logseq.property/deadline");
                value = Edn_util.float (Js.Date.getTime deadline);
              }
              :: properties
          | None -> properties
        in
        List.rev properties
      in
      match (opts.page, opts.id, opts.uuid, opts.content) with
      | Some page, None, None, _ when String.trim page <> "" ->
          Ok
            (Upsert_task
               {
                 repo;
                 graph;
                 mode = Page;
                 id = None;
                 uuid = None;
                 page = Some page;
                 content = None;
                 update_properties;
                 clear_properties;
                 status_input = opts.status;
               })
      | None, Some id, None, _ ->
          Ok
            (Upsert_task
               {
                 repo;
                 graph;
                 mode = Update;
                 id = Some id;
                 uuid = None;
                 page = None;
                 content = opts.content;
                 update_properties;
                 clear_properties;
                 status_input = opts.status;
               })
      | None, None, Some uuid, _ ->
          Ok
            (Upsert_task
               {
                 repo;
                 graph;
                 mode = Update;
                 id = None;
                 uuid = Some uuid;
                 page = None;
                 content = opts.content;
                 update_properties;
                 clear_properties;
                 status_input = opts.status;
               })
      | None, None, None, Some content when String.trim content <> "" -> (
          match
            (opts.target_id, opts.target_uuid, opts.target_page, opts.pos)
          with
          | Some _, _, _, _ | _, Some _, _, _ | _, _, _, Some _ ->
              Error
                (Error.make
                   (Edn_util.keyword_t "spec-blocker")
                   "upsert task create currently supports only --target-page \
                    because spec/l3/upsert.mli does not carry target id, \
                    target uuid, or pos in Upsert_task actions")
          | None, None, Some target_page, None
            when String.trim target_page <> "" ->
              Ok
                (Upsert_task
                   {
                     repo;
                     graph;
                     mode = Create;
                     id = None;
                     uuid = None;
                     page = Some target_page;
                     content = Some content;
                     update_properties;
                     clear_properties;
                     status_input = opts.status;
                   })
          | None, None, None, None ->
              Ok
                (Upsert_task
                   {
                     repo;
                     graph;
                     mode = Create;
                     id = None;
                     uuid = None;
                     page = Some (default_journal_title ());
                     content = Some content;
                     update_properties;
                     clear_properties;
                     status_input = opts.status;
                   })
          | _ ->
              Error
                (Error.make
                   (Edn_util.keyword_t "missing-target")
                   "target page is required when creating a task block"))
      | _ ->
          Error
            (Error.make
               (Edn_util.keyword_t "missing-target")
               "block or page is required"))

let parse_block_update_plan (opts : block_opts) =
  Error.bind (parse_tags_edn ~label:"update-tags" opts.update_tags_edn)
    (fun update_tags ->
      Error.bind (parse_tags_edn ~label:"remove-tags" opts.remove_tags_edn)
        (fun remove_tags ->
          Error.bind
            (parse_property_assignments_edn ~label:"update-properties"
               opts.update_properties_edn) (fun update_properties ->
              Error.bind
                (parse_property_keys_edn ~label:"remove-properties"
                   opts.remove_properties_edn) (fun remove_properties ->
                  Ok
                    {
                      Property.update_tags;
                      remove_tags;
                      update_properties;
                      remove_properties;
                    }))))

let build_block repo (opts : block_opts) =
  Error.bind (parse_block_update_plan opts) (fun plan ->
      if update_mode opts then
        Error.bind
          (Update.build_action (update_opts_of_block_opts opts) repo)
          (fun action ->
            Error.map
              (fun action -> Upsert_block (Block_update action))
              (block_update_of_update_action action))
      else
        let target_page =
          match
            ( opts.target_id,
              nonempty_trimmed opts.target_uuid,
              nonempty_trimmed opts.target_page )
          with
          | None, None, None -> Some (default_journal_title ())
          | _ -> opts.target_page
        in
        let add_opts =
          {
            Add.target_id = opts.target_id;
            target_uuid = opts.target_uuid;
            target_page_name = target_page;
            pos = opts.pos;
            status = None;
            tags_edn = None;
            properties_edn = None;
            content = opts.content;
            blocks_edn = opts.blocks_edn;
            blocks_file = opts.blocks_file;
          }
        in
        Error.bind (Add.build_add_block_action add_opts [] repo) (fun action ->
            Error.map
              (fun action -> Upsert_block (Block_create action))
              (block_create_of_add_action ~update_plan:plan action)))

let build ?registry:_ config _globals parsed =
  Error.bind (validate_parsed parsed) (fun () ->
      Error.bind (repo_or_error config) (fun (repo, graph) ->
          match parsed with
          | Parsed_block opts -> build_block repo opts
          | Parsed_page opts -> build_page repo graph opts
          | Parsed_tag opts -> build_tag repo graph opts
          | Parsed_property opts -> build_property repo graph opts
          | Parsed_asset opts -> build_asset repo graph opts
          | Parsed_task opts -> build_task repo graph opts))

let kw value = Edn_util.keyword value
let sym value = Edn_util.symbol value
let vector values = Edn_util.vector values
let list values = Edn_util.list values
let query_value query = Edn_util.any (Cli_primitive.datascript_query_to_edn query)

let tag_selector =
  vector
    [
      kw "db/id";
      kw "block/uuid";
      kw "block/name";
      kw "block/title";
      Edn_util.map [ (kw "block/tags", vector [ kw "db/ident" ]) ];
    ]

let page_selector =
  vector
    [
      kw "db/id";
      kw "block/uuid";
      kw "block/name";
      kw "block/title";
      kw "logseq.property/deleted-at";
    ]

let property_selector =
  vector
    [
      kw "db/id";
      kw "db/ident";
      kw "block/uuid";
      kw "block/name";
      kw "block/title";
      kw "logseq.property/type";
    ]

let asset_selector =
  vector
    [
      kw "db/id";
      kw "block/uuid";
      kw "block/title";
      kw "logseq.property/deleted-at";
      Edn_util.map [ (kw "block/tags", vector [ kw "db/ident" ]) ];
    ]

let task_selector =
  vector [ kw "db/id"; kw "block/uuid"; kw "block/name"; kw "block/title" ]

let result_ids ids =
  Edn_util.map
    [
      (kw "result", Edn_util.vector (List.map (fun id -> Edn_util.int64 id) ids));
    ]

module Node_crypto = struct
  type hash

  external create_hash : string -> hash = "createHash" [@@mel.module "crypto"]
  external update_buffer : hash -> Node.Buffer.t -> hash = "update" [@@mel.send]
  external digest : hash -> string -> string = "digest" [@@mel.send]
end

let file_sha256 path =
  try
    let payload = Cli_unix.read_binary_file path in
    let hash = Node_crypto.create_hash "sha256" in
    let payload_buffer =
      Node.Buffer.fromStringWithEncoding payload ~encoding:`latin1
    in
    Some
      (Node_crypto.digest (Node_crypto.update_buffer hash payload_buffer) "hex")
  with _ -> None

let file_size path = (Cli_unix.stat path).Cli_unix.st_size

let file_extension path =
  let base = Filename.basename path in
  match String.rindex_opt base '.' with
  | Some index when index + 1 < String.length base ->
      Some
        (String.sub base (index + 1) (String.length base - index - 1)
        |> String.lowercase_ascii)
  | _ -> None

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Cli_unix.file_exists path then
    ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let copy_file source destination =
  mkdir_p (Filename.dirname destination);
  Cli_unix.copy_file source destination

let graph_assets_dir config repo =
  Filename.concat
    (Filename.concat
       (Filename.concat config.Cli_config.root_dir "graphs")
       (Graph_dir.graph_dir_name_of_repo repo))
    "assets"

let class_query selector class_ident =
  Cli_primitive.make_datascript_query
    ~find:[ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
    ~in_:[ Melange_edn.symbol "$"; Melange_edn.symbol "?name" ]
    ~where:
      [
        Cli_primitive.V
          (Edn_util.vector_t [ sym "?e"; kw "block/name"; sym "?name" ]);
        Cli_primitive.V
          (Edn_util.vector_t [ sym "?e"; kw "block/tags"; sym "?t" ]);
        Cli_primitive.V
          (Edn_util.vector_t [ sym "?t"; kw "db/ident"; kw class_ident ]);
      ]
    ()

let tag_query selector = class_query selector "logseq.class/Tag"
let property_query selector = class_query selector "logseq.class/Property"

let page_query selector =
  Cli_primitive.make_datascript_query
    ~find:[ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
    ~in_:[ Melange_edn.symbol "$"; Melange_edn.symbol "?name" ]
    ~where:
      [
        Cli_primitive.V
          (Edn_util.vector_t [ sym "?e"; kw "block/name"; sym "?name" ]);
      ]
    ()

let pull_pages_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [
           query_value (page_query selector);
           Edn_util.string (normalized_lookup_name name);
         ])

let pull_tag_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [
           query_value (tag_query selector);
           Edn_util.string (normalized_lookup_name name);
         ])

let pull_property_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [
           query_value (property_query selector);
           Edn_util.string (normalized_lookup_name name);
         ])

let pull_entity_by_id config repo selector id =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "upsert pull selector" selector)
    ~lookup:(Edn_util.int64 id)

let pull_entity_by_lookup config repo selector lookup =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "upsert pull selector" selector)
    ~lookup

let first_entity value =
  match (Edn_util.as_vector value, Edn_util.as_list value) with
  | Some (first :: _), _ | _, Some (first :: _) -> Some first
  | _ -> None

let id_of_entity value = Edn_util.get_int64 value "db/id"

let uuid_of_entity value =
  Option.bind (Edn_util.get value "block/uuid") Edn_util.as_string_like

let name_of_entity value = Edn_util.get_string value "block/name"

let tag_entity value =
  match Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq with
  | Some tags ->
      List.exists
        (fun tag ->
          match
            Option.bind (Edn_util.get tag "db/ident") Edn_util.as_string_like
          with
          | Some ident -> strip_keyword_prefix ident = "logseq.class/Tag"
          | _ -> false)
        tags
  | _ -> false

let property_entity value =
  Option.is_some (Edn_util.get value "logseq.property/type")

let asset_entity value =
  match Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq with
  | Some tags ->
      List.exists
        (fun tag ->
          match
            Option.bind (Edn_util.get tag "db/ident") Edn_util.as_string_like
          with
          | Some ident -> strip_keyword_prefix ident = "logseq.class/Asset"
          | _ -> false)
        tags
  | _ -> false

let ident_of_entity value =
  Option.bind (Edn_util.get value "db/ident") Edn_util.as_keyword_t

let lookup_of_tag = function
  | Selector.Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string (normalized_lookup_name name)
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid -> Edn_util.uuid uuid

let apply_outliner_ops config repo ops =
  Transport.thread_api_apply_outliner_ops config ~repo
    ~ops:(Edn_util.vector_t ops) ~options:(Edn_util.map_t [])

let create_tag_page config repo name =
  let op =
    Edn_util.vector
      [
        kw "create-page";
        Edn_util.vector
          [
            Edn_util.string name;
            Edn_util.map [ (kw "class?", Edn_util.bool true) ];
          ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let create_page config repo name =
  let op =
    Edn_util.vector
      [
        kw "create-page";
        Edn_util.vector [ Edn_util.string name; Edn_util.map [] ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let rename_page config repo uuid name =
  let op =
    Edn_util.vector
      [
        kw "rename-page";
        Edn_util.vector [ Edn_util.uuid uuid; Edn_util.string name ];
      ]
  in
  apply_outliner_ops config repo [ op ]

let value_of_kind kind = Edn_util.keyword (Property.string_of_kind kind)

let value_of_cardinality = function
  | Property.One -> Edn_util.keyword "db.cardinality/one"
  | Many -> Edn_util.keyword "db.cardinality/many"

let value_of_schema (schema : Property.schema) =
  let fields = [] in
  let fields =
    match schema.kind with
    | Some kind -> (kw "logseq.property/type", value_of_kind kind) :: fields
    | None -> fields
  in
  let fields =
    match schema.cardinality with
    | Some cardinality ->
        (kw "db/cardinality", value_of_cardinality cardinality) :: fields
    | None -> fields
  in
  let fields =
    match schema.hidden with
    | Some hidden ->
        (kw "logseq.property/hide?", Edn_util.bool hidden) :: fields
    | None -> fields
  in
  let fields =
    match schema.public with
    | Some public ->
        (kw "logseq.property/public?", Edn_util.bool public) :: fields
    | None -> fields
  in
  Edn_util.map (List.rev fields)

let schema_empty (schema : Property.schema) =
  schema.kind = None && schema.cardinality = None && schema.hidden = None
  && schema.public = None

let upsert_property_op ?(opts = Edn_util.map []) ident schema =
  let ident =
    match ident with Some ident -> Edn_util.any ident | None -> Edn_util.nil
  in
  Edn_util.vector
    [
      kw "upsert-property";
      Edn_util.vector [ ident; value_of_schema schema; opts ];
    ]

let upsert_property config repo ?opts ident schema =
  apply_outliner_ops config repo [ upsert_property_op ?opts ident schema ]

let ok_tag_ids mode ids =
  Cli_result.ok ~command:Command_id.Upsert_tag mode (Raw (result_ids ids))

let ok_page_ids mode ids =
  Cli_result.ok ~command:Command_id.Upsert_page mode (Raw (result_ids ids))

let ok_property_ids mode ids =
  Cli_result.ok ~command:Command_id.Upsert_property mode (Raw (result_ids ids))

let ok_asset_ids mode ids =
  Cli_result.ok ~command:Command_id.Upsert_asset mode (Raw (result_ids ids))

let tag_not_found mode =
  Cli_result.error ~command:Command_id.Upsert_tag mode
    (Error.make
       (Edn_util.keyword_t "tag-not-found")
       "tag not found after upsert")

let upsert_id_not_found entity_type id =
  Error.make
    (Edn_util.keyword_t "upsert-id-not-found")
    (entity_type ^ " not found for id")
    ~context:
      (Edn_util.map
         [
           (kw "entity-type", Edn_util.string entity_type);
           (kw "id", Edn_util.int64 id);
         ])

let upsert_id_type_mismatch entity_type id =
  Error.make
    (Edn_util.keyword_t "upsert-id-type-mismatch")
    ("id must be a node tagged with #" ^ entity_type)
    ~context:
      (Edn_util.map
         [
           (kw "entity-type", Edn_util.string entity_type);
           (kw "id", Edn_util.int64 id);
         ])

let same_tag_name entity target_name =
  match name_of_entity entity with
  | Some current_name ->
      String.equal current_name (normalized_lookup_name target_name)
  | None -> false

let rename_conflict current_entity target =
  match (id_of_entity target, id_of_entity current_entity) with
  | None, _ -> None
  | Some target_id, Some current_id when target_id = current_id -> None
  | Some _, _ when tag_entity target ->
      Some
        (Error.make
           (Edn_util.keyword_t "tag-rename-conflict")
           "rename target already exists as a tag")
  | Some _, _ ->
      Some
        (Error.make
           (Edn_util.keyword_t "tag-name-conflict")
           "tag already exists as a page and is not a tag")

let page_entity value = Option.is_some (name_of_entity value)

let recycled_entity value =
  Option.is_some (Edn_util.get value "logseq.property/deleted-at")

let page_not_found () =
  Error.make (Edn_util.keyword_t "page-not-found") "page not found"

let recycled_page_error () =
  Error.make (Edn_util.keyword_t "recycled-page") "page is recycled"

let resolve_tag_id invoke_config repo tag =
  let open Cli_effect in
  match tag with
  | Selector.Tag_id id -> pure (Ok id)
  | Tag_name name ->
      bind (pull_tag_by_name invoke_config repo name tag_selector)
        (fun result ->
          match Option.bind (first_entity result) id_of_entity with
          | Some id -> pure (Ok id)
          | None ->
              pure
                (Error
                   (Error.make
                      (Edn_util.keyword_t "tag-not-found")
                      "tag not found")))
  | Tag_ident _ | Tag_uuid _ ->
      bind
        (pull_entity_by_lookup invoke_config repo tag_selector
           (lookup_of_tag tag))
        (fun result ->
          match id_of_entity result with
          | Some id -> pure (Ok id)
          | None ->
              pure
                (Error
                   (Error.make
                      (Edn_util.keyword_t "tag-not-found")
                      "tag not found")))

let property_key_label = function
  | Property.Key_ident ident ->
      Edn_util.keyword_to_string ident |> strip_keyword_prefix
  | Key_id id -> Int64.to_string id
  | Key_name name -> name

let string_starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let qualified_property_ident ident =
  String.contains (property_key_label (Property.Key_ident ident)) '/'

let property_not_found_error key =
  let label = property_key_label key in
  Error.make
    (Edn_util.keyword_t "property-not-found")
    ("property not found: " ^ label)

let resolved_property_ident key entity =
  match (id_of_entity entity, ident_of_entity entity) with
  | Some _, Some ident -> Ok ident
  | _ -> Error (property_not_found_error key)

let resolved_property_ident_from_query key result =
  match first_entity result with
  | Some entity -> resolved_property_ident key entity
  | None -> Error (property_not_found_error key)

let resolved_schema_property_ident key entity =
  if property_entity entity then resolved_property_ident key entity
  else Error (property_not_found_error key)

let resolved_schema_property_ident_from_query key result =
  match first_entity result with
  | Some entity -> resolved_schema_property_ident key entity
  | None -> Error (property_not_found_error key)

let resolve_property_ident invoke_config repo key =
  let open Cli_effect in
  match key with
  | Property.Key_ident ident when qualified_property_ident ident ->
      pure (Ok ident)
  | Property.Key_ident ident ->
      bind
        (pull_entity_by_lookup invoke_config repo
           (vector [ kw "db/id" ])
           (vector [ kw "db/ident"; Edn_util.any ident ]))
        (fun result ->
          match resolved_property_ident key result with
          | Ok ident -> pure (Ok ident)
          | Error _ when not (qualified_property_ident ident) ->
              bind
                (pull_property_by_name invoke_config repo
                   (property_key_label key) property_selector)
                (fun result ->
                  pure (resolved_property_ident_from_query key result))
          | Error err -> pure (Error err))
  | Key_id id ->
      bind
        (pull_entity_by_lookup invoke_config repo
           (vector [ kw "db/ident" ])
           (Edn_util.int64 id))
        (fun result ->
          match ident_of_entity result with
          | Some ident -> pure (Ok ident)
          | None -> pure (Error (property_not_found_error key)))
  | Key_name name ->
      bind (pull_property_by_name invoke_config repo name property_selector)
        (fun result ->
          match resolved_property_ident_from_query key result with
          | Ok ident -> pure (Ok ident)
          | Error _ ->
              let ident = Edn_util.keyword_t name in
              bind
                (pull_entity_by_lookup invoke_config repo
                   (vector [ kw "db/id" ])
                   (vector [ kw "db/ident"; Edn_util.any ident ]))
                (fun result ->
                  if Option.is_some (id_of_entity result) then pure (Ok ident)
                  else pure (Error (property_not_found_error key))))

let resolve_schema_property_ident invoke_config repo key =
  let open Cli_effect in
  match key with
  | Property.Key_ident ident ->
      bind
        (pull_entity_by_lookup invoke_config repo property_selector
           (vector [ kw "db/ident"; Edn_util.any ident ]))
        (fun result ->
          match resolved_schema_property_ident key result with
          | Ok ident -> pure (Ok ident)
          | Error _ when not (qualified_property_ident ident) ->
              bind
                (pull_property_by_name invoke_config repo
                   (property_key_label key) property_selector)
                (fun result ->
                  pure (resolved_schema_property_ident_from_query key result))
          | Error err -> pure (Error err))
  | Key_id id ->
      bind
        (pull_entity_by_lookup invoke_config repo property_selector
           (Edn_util.int64 id))
        (fun result -> pure (resolved_schema_property_ident key result))
  | Key_name name ->
      bind (pull_property_by_name invoke_config repo name property_selector)
        (fun result ->
          match resolved_schema_property_ident_from_query key result with
          | Ok ident -> pure (Ok ident)
          | Error _ ->
              let ident = Edn_util.keyword_t name in
              bind
                (pull_entity_by_lookup invoke_config repo property_selector
                   (vector [ kw "db/ident"; Edn_util.any ident ]))
                (fun result -> pure (resolved_schema_property_ident key result)))

let rec resolve_tag_ids invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | tag :: rest ->
      let open Cli_effect in
      bind (resolve_tag_id invoke_config repo tag) (function
        | Error err -> pure (Error err)
        | Ok id ->
            bind (resolve_tag_ids invoke_config repo rest) (function
              | Error err -> pure (Error err)
              | Ok ids -> pure (Ok (id :: ids))))

let rec resolve_property_keys invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | key :: rest ->
      let open Cli_effect in
      bind (resolve_property_ident invoke_config repo key) (function
        | Error err -> pure (Error err)
        | Ok ident ->
            bind (resolve_property_keys invoke_config repo rest) (function
              | Error err -> pure (Error err)
              | Ok idents -> pure (Ok (ident :: idents))))

let rec resolve_schema_property_keys invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | key :: rest ->
      let open Cli_effect in
      bind (resolve_schema_property_ident invoke_config repo key) (function
        | Error err -> pure (Error err)
        | Ok ident ->
            bind (resolve_schema_property_keys invoke_config repo rest)
              (function
              | Error err -> pure (Error err)
              | Ok idents -> pure (Ok (ident :: idents))))

let block_uuid_lookup_ref value =
  match (Edn_util.as_vector value, Edn_util.as_list value) with
  | Some [ key; uuid ], _ | _, Some [ key; uuid ] -> (
      match (Edn_util.as_string_like key, Edn_util.as_string_like uuid) with
      | Some "block/uuid", Some uuid -> Some uuid
      | _ -> None)
  | _ -> None

let resolve_block_uuid_ref invoke_config repo uuid =
  let open Cli_effect in
  bind
    (pull_entity_by_lookup invoke_config repo
       (vector [ kw "db/id"; kw "block/uuid" ])
       (vector [ kw "block/uuid"; Edn_util.uuid uuid ]))
    (fun entity ->
      match id_of_entity entity with
      | Some id -> pure (Ok (Edn_util.int64 id))
      | None ->
          pure
            (Error
               (Error.make
                  (Edn_util.keyword_t "block-not-found")
                  ("block not found: " ^ uuid))))

let rec resolve_property_value_refs invoke_config repo value =
  let open Cli_effect in
  match block_uuid_lookup_ref value with
  | Some uuid -> resolve_block_uuid_ref invoke_config repo uuid
  | None -> (
      let resolve_values wrap values =
        let rec loop acc = function
          | [] -> pure (Ok (wrap (List.rev acc)))
          | value :: rest ->
              bind (resolve_property_value_refs invoke_config repo value)
                (function
                | Error err -> pure (Error err)
                | Ok value -> loop (value :: acc) rest)
        in
        loop [] values
      in
      match value with
      | Melange_edn.Any (Melange_edn.Vector values) ->
          resolve_values Edn_util.vector (Edn_util.iarray_to_list values)
      | Any (List values) ->
          resolve_values Edn_util.list (Edn_util.iarray_to_list values)
      | Any (Set values) ->
          resolve_values Edn_util.set (Edn_util.iarray_to_list values)
      | Any (Map fields) ->
          let rec loop acc = function
            | [] -> pure (Ok (Edn_util.map (List.rev acc)))
            | (key, value) :: rest ->
                bind (resolve_property_value_refs invoke_config repo value)
                  (function
                  | Error err -> pure (Error err)
                  | Ok value -> loop ((key, value) :: acc) rest)
          in
          loop [] (Edn_util.iarray_to_list fields)
      | _ -> pure (Ok value))

let rec resolve_property_assignments invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | assignment :: rest ->
      let open Cli_effect in
      bind (resolve_property_ident invoke_config repo assignment.Property.key)
        (function
        | Error err -> pure (Error err)
        | Ok ident ->
            bind
              (resolve_property_value_refs invoke_config repo assignment.value)
              (function
              | Error err -> pure (Error err)
              | Ok value ->
                  bind (resolve_property_assignments invoke_config repo rest)
                    (function
                    | Error err -> pure (Error err)
                    | Ok assignments ->
                        pure (Ok ((ident, value) :: assignments)))))

let option_resolution_error option err =
  {
    err with
    Error.context =
      Some
        (Edn_util.map
           [
             (kw "option", Edn_util.string option);
             (kw "phase", Edn_util.string "resolve-options");
           ]);
  }

let structural_block_field key =
  match Edn_util.as_string_like key with
  | Some key ->
      key = "block/title" || key = "block/content" || key = "block/uuid"
      || key = "block/children" || key = "block/tags"
      || string_starts_with ~prefix:"db/" key
      || string_starts_with ~prefix:"build/" key
  | None -> false

let inline_property_assignments block =
  match Edn_util.as_map block.Block.raw with
  | None -> Ok []
  | Some fields ->
      let rec loop acc = function
        | [] -> Ok (List.rev acc)
        | (key, value) :: rest -> (
            if structural_block_field key then loop acc rest
            else
              match Property.parse_key key with
              | Some key -> loop ({ Property.key; value } :: acc) rest
              | None ->
                  Error
                    (Error.invalid_options
                       ("invalid block property key: "
                       ^ Melange_edn.to_edn_string key)))
      in
      loop [] fields

let rec resolve_block_inline_properties invoke_config repo block =
  let open Cli_effect in
  match inline_property_assignments block with
  | Error err -> pure (Error err)
  | Ok assignments ->
      bind (resolve_property_assignments invoke_config repo assignments)
        (function
        | Error err -> pure (Error (option_resolution_error "--blocks" err))
        | Ok resolved_assignments ->
            let resolved_properties =
              List.map
                (fun (ident, value) ->
                  { Property.key = Property.Key_ident ident; value })
                resolved_assignments
            in
            let rec resolve_children acc = function
              | [] -> pure (Ok (List.rev acc))
              | child :: rest ->
                  bind
                    (resolve_block_inline_properties invoke_config repo child)
                    (function
                    | Error err -> pure (Error err)
                    | Ok child -> resolve_children (child :: acc) rest)
            in
            bind (resolve_children [] block.Block.children) (function
              | Error err -> pure (Error err)
              | Ok children ->
                  pure
                    (Ok
                       {
                         block with
                         Block.properties =
                           block.Block.properties @ resolved_properties;
                         children;
                       })))

let rec resolve_blocks_inline_properties invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | block :: rest ->
      let open Cli_effect in
      bind (resolve_block_inline_properties invoke_config repo block) (function
        | Error err -> pure (Error err)
        | Ok block ->
            bind (resolve_blocks_inline_properties invoke_config repo rest)
              (function
              | Error err -> pure (Error err)
              | Ok blocks -> pure (Ok (block :: blocks))))

let rec strip_block_properties block =
  {
    block with
    Block.properties = [];
    children = List.map strip_block_properties block.Block.children;
  }

let property_key_value = function
  | Property.Key_ident ident -> Edn_util.any ident
  | Key_id id -> Edn_util.int64 id
  | Key_name name -> Edn_util.string name

let rec block_inline_property_ops block =
  let own_ops =
    match (block.Block.uuid, block.Block.properties) with
    | Some uuid, properties ->
        List.map
          (fun assignment ->
            Edn_util.vector
              [
                kw "batch-set-property";
                Edn_util.vector
                  [
                    Edn_util.vector [ Edn_util.uuid uuid ];
                    property_key_value assignment.Property.key;
                    assignment.value;
                    Edn_util.map [];
                  ];
              ])
          properties
    | None, _ -> []
  in
  own_ops @ List.concat_map block_inline_property_ops block.Block.children

let inline_property_ops blocks =
  List.concat_map block_inline_property_ops blocks

let apply_inline_property_ops invoke_config repo blocks =
  let open Cli_effect in
  match inline_property_ops blocks with
  | [] -> pure (Ok Edn_util.nil)
  | ops ->
      bind (apply_outliner_ops invoke_config repo ops) (fun result ->
          pure (Ok result))

let append_tag_and_property_ops block_uuids ~update_tag_ids ~remove_tag_ids
    ~update_properties ~remove_properties =
  let uuid_values =
    Edn_util.vector (List.map (fun uuid -> Edn_util.uuid uuid) block_uuids)
  in
  let remove_tag_ops =
    List.map
      (fun tag_id ->
        Edn_util.vector
          [
            kw "batch-delete-property-value";
            Edn_util.vector
              [ uuid_values; kw "block/tags"; Edn_util.int64 tag_id ];
          ])
      remove_tag_ids
  in
  let remove_property_ops =
    List.map
      (fun ident ->
        Edn_util.vector
          [
            kw "batch-remove-property";
            Edn_util.vector [ uuid_values; Edn_util.any ident ];
          ])
      remove_properties
  in
  let update_tag_ops =
    List.map
      (fun tag_id ->
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
      update_tag_ids
  in
  let update_property_ops =
    List.map
      (fun (ident, value) ->
        Edn_util.vector
          [
            kw "batch-set-property";
            Edn_util.vector
              [ uuid_values; Edn_util.any ident; value; Edn_util.map [] ];
          ])
      update_properties
  in
  remove_tag_ops @ remove_property_ops @ update_tag_ops @ update_property_ops

let resolve_update_plan invoke_config repo plan =
  let open Cli_effect in
  bind (resolve_tag_ids invoke_config repo plan.Property.update_tags) (function
    | Error err -> pure (Error (option_resolution_error "--update-tags" err))
    | Ok update_tag_ids ->
        bind (resolve_tag_ids invoke_config repo plan.remove_tags) (function
          | Error err ->
              pure (Error (option_resolution_error "--remove-tags" err))
          | Ok remove_tag_ids ->
              bind
                (resolve_property_assignments invoke_config repo
                   plan.update_properties) (function
                | Error err ->
                    pure
                      (Error (option_resolution_error "--update-properties" err))
                | Ok update_properties ->
                    bind
                      (resolve_property_keys invoke_config repo
                         plan.remove_properties) (function
                      | Error err ->
                          pure
                            (Error
                               (option_resolution_error "--remove-properties"
                                  err))
                      | Ok remove_properties ->
                          pure
                            (Ok
                               ( update_tag_ids,
                                 remove_tag_ids,
                                 update_properties,
                                 remove_properties ))))))

let apply_resolved_update_plan invoke_config repo block_uuids
    (update_tag_ids, remove_tag_ids, update_properties, remove_properties) =
  let open Cli_effect in
  let ops =
    append_tag_and_property_ops block_uuids ~update_tag_ids ~remove_tag_ids
      ~update_properties ~remove_properties
  in
  if ops = [] then pure (Ok Edn_util.nil)
  else
    bind (apply_outliner_ops invoke_config repo ops) (fun result ->
        pure (Ok result))

let execute_plan_on_uuids invoke_config repo block_uuids plan =
  let open Cli_effect in
  bind (resolve_update_plan invoke_config repo plan) (function
    | Error err -> pure (Error err)
    | Ok resolved ->
        apply_resolved_update_plan invoke_config repo block_uuids resolved)

let execute_page_plan invoke_config repo page_uuid plan =
  execute_plan_on_uuids invoke_config repo [ page_uuid ] plan

let restore_recycled_page invoke_config repo page_uuid =
  apply_outliner_ops invoke_config repo
    [ vector [ kw "restore-recycled"; vector [ Edn_util.uuid page_uuid ] ] ]

let pull_created_page invoke_config repo name create_result =
  match (Edn_util.as_vector create_result, Edn_util.as_list create_result) with
  | Some (_ :: uuid_value :: _), _ | _, Some (_ :: uuid_value :: _) -> (
      match Edn_util.as_string_like uuid_value with
      | Some uuid ->
          Transport.thread_api_pull invoke_config ~repo
            ~selector:(Edn_util.vector_t [ kw "db/id"; kw "block/uuid" ])
            ~lookup:(vector [ kw "block/uuid"; Edn_util.uuid uuid ])
      | _ ->
          Transport.thread_api_pull invoke_config ~repo
            ~selector:(Edn_util.vector_t [ kw "db/id"; kw "block/uuid" ])
            ~lookup:
              (vector
                 [
                   kw "block/name";
                   Edn_util.string (normalized_lookup_name name);
                 ]))
  | _ ->
      Transport.thread_api_pull invoke_config ~repo
        ~selector:(Edn_util.vector_t [ kw "db/id"; kw "block/uuid" ])
        ~lookup:
          (vector
             [ kw "block/name"; Edn_util.string (normalized_lookup_name name) ])

let tag_schema_property_ops tag_uuid ~add_properties ~remove_properties =
  let add_ops =
    List.map
      (fun ident ->
        Edn_util.vector
          [
            kw "class-add-property";
            Edn_util.vector [ Edn_util.uuid tag_uuid; Edn_util.any ident ];
          ])
      add_properties
  in
  let remove_ops =
    List.map
      (fun ident ->
        Edn_util.vector
          [
            kw "class-remove-property";
            Edn_util.vector [ Edn_util.uuid tag_uuid; Edn_util.any ident ];
          ])
      remove_properties
  in
  add_ops @ remove_ops

let execute_tag_schema_properties invoke_config repo tag_uuid ~add_properties
    ~remove_properties =
  let open Cli_effect in
  bind (resolve_schema_property_keys invoke_config repo add_properties)
    (function
    | Error err -> pure (Error (option_resolution_error "--add-properties" err))
    | Ok add_properties ->
        bind (resolve_schema_property_keys invoke_config repo remove_properties)
          (function
          | Error err ->
              pure (Error (option_resolution_error "--remove-properties" err))
          | Ok remove_properties ->
              let ops =
                tag_schema_property_ops tag_uuid ~add_properties
                  ~remove_properties
              in
              if ops = [] then pure (Ok Edn_util.nil)
              else
                bind (apply_outliner_ops invoke_config repo ops) (fun result ->
                    pure (Ok result))))

let tag_result_with_schema_properties mode invoke_config repo entity
    ~add_properties ~remove_properties =
  let open Cli_effect in
  match (id_of_entity entity, uuid_of_entity entity) with
  | Some id, Some uuid ->
      if tag_entity entity then
        bind
          (execute_tag_schema_properties invoke_config repo uuid ~add_properties
             ~remove_properties) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_tag mode err)
          | Ok _ -> pure (ok_tag_ids mode [ id ]))
      else
        pure
          (Cli_result.error ~command:Command_id.Upsert_tag mode
             (Error.make
                (Edn_util.keyword_t "tag-create-not-tag")
                "created entity is not tagged as :logseq.class/Tag"))
  | Some _, None ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_tag mode
           (Error.make
              (Edn_util.keyword_t "upsert-id-not-found")
              "tag uuid not found"))
  | None, _ -> pure (tag_not_found mode)

let execute_create_tag mode invoke_config repo name ~add_properties
    ~remove_properties =
  let open Cli_effect in
  bind (pull_tag_by_name invoke_config repo name tag_selector) (fun existing ->
      match first_entity existing with
      | Some entity ->
          tag_result_with_schema_properties mode invoke_config repo entity
            ~add_properties ~remove_properties
      | None ->
          bind (create_tag_page invoke_config repo name) (fun _ ->
              bind (pull_tag_by_name invoke_config repo name tag_selector)
                (fun page ->
                  match first_entity page with
                  | Some entity ->
                      tag_result_with_schema_properties mode invoke_config repo
                        entity ~add_properties ~remove_properties
                  | None -> pure (tag_not_found mode))))

let execute_update_tag mode invoke_config repo id name ~add_properties
    ~remove_properties =
  let open Cli_effect in
  bind (pull_entity_by_id invoke_config repo tag_selector id) (fun entity ->
      match id_of_entity entity with
      | None ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_tag mode
               (upsert_id_not_found "tag" id))
      | Some id when not (tag_entity entity) ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_tag mode
               (upsert_id_type_mismatch "Tag" id))
      | Some _ -> (
          match name with
          | None ->
              tag_result_with_schema_properties mode invoke_config repo entity
                ~add_properties ~remove_properties
          | Some target_name when same_tag_name entity target_name ->
              tag_result_with_schema_properties mode invoke_config repo entity
                ~add_properties ~remove_properties
          | Some target_name ->
              bind
                (pull_tag_by_name invoke_config repo target_name tag_selector)
                (fun target ->
                  match
                    Option.bind (first_entity target) (rename_conflict entity)
                  with
                  | Some err ->
                      pure
                        (Cli_result.error ~command:Command_id.Upsert_tag mode
                           err)
                  | None -> (
                      match uuid_of_entity entity with
                      | None ->
                          pure
                            (Cli_result.error ~command:Command_id.Upsert_tag
                               mode
                               (Error.make
                                  (Edn_util.keyword_t "upsert-id-not-found")
                                  "tag uuid not found"))
                      | Some uuid ->
                          bind (rename_page invoke_config repo uuid target_name)
                            (fun _ ->
                              tag_result_with_schema_properties mode
                                invoke_config repo entity ~add_properties
                                ~remove_properties)))))

let execute_create_property mode invoke_config repo name schema =
  let open Cli_effect in
  bind (pull_property_by_name invoke_config repo name property_selector)
    (fun existing ->
      let ident = Option.bind (first_entity existing) ident_of_entity in
      let opts =
        match ident with
        | Some _ -> Edn_util.map []
        | None -> Edn_util.map [ (kw "property-name", Edn_util.string name) ]
      in
      bind (upsert_property invoke_config repo ~opts ident schema) (fun _ ->
          bind (pull_property_by_name invoke_config repo name property_selector)
            (fun property ->
              match Option.bind (first_entity property) id_of_entity with
              | Some id -> pure (ok_property_ids mode [ id ])
              | None ->
                  pure
                    (Cli_result.error ~command:Command_id.Upsert_property mode
                       (Error.make
                          (Edn_util.keyword_t "property-not-found")
                          "property not found after upsert")))))

let execute_update_property mode invoke_config repo id schema =
  let open Cli_effect in
  bind (pull_entity_by_id invoke_config repo property_selector id)
    (fun entity ->
      match id_of_entity entity with
      | None ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_property mode
               (upsert_id_not_found "property" id))
      | Some id when not (property_entity entity) ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_property mode
               (upsert_id_type_mismatch "Property" id))
      | Some id ->
          if schema_empty schema then pure (ok_property_ids mode [ id ])
          else
            let ident = ident_of_entity entity in
            bind (upsert_property invoke_config repo ident schema) (fun _ ->
                pure (ok_property_ids mode [ id ])))

let save_block_title invoke_config repo uuid content =
  let block =
    Edn_util.map
      [
        (kw "block/uuid", Edn_util.uuid uuid);
        (kw "block/title", Edn_util.string content);
      ]
  in
  let op =
    Edn_util.vector
      [ kw "save-block"; Edn_util.vector [ block; Edn_util.map [] ] ]
  in
  apply_outliner_ops invoke_config repo [ op ]

let pull_asset_by_uuid invoke_config repo uuid =
  pull_entity_by_lookup invoke_config repo asset_selector
    (vector [ kw "block/uuid"; Edn_util.uuid uuid ])

let ensure_asset_file_metadata path =
  if not (Cli_unix.file_exists path) then
    Error
      (Error.make
         ~context:(Edn_util.map [ (kw "path", Edn_util.string path) ])
         (Edn_util.keyword_t "asset-file-not-found")
         "asset file not found")
  else
    match file_extension path with
    | None ->
        Error
          (Error.make
             ~context:(Edn_util.map [ (kw "path", Edn_util.string path) ])
             (Edn_util.keyword_t "invalid-options")
             "asset path must include a file extension")
    | Some asset_type -> (
        match file_sha256 path with
        | None ->
            Error
              (Error.make
                 ~context:(Edn_util.map [ (kw "path", Edn_util.string path) ])
                 (Edn_util.keyword_t "asset-checksum-failed")
                 "asset checksum failed")
        | Some checksum -> Ok (asset_type, file_size path, checksum))

let ensure_asset_tag_id invoke_config repo =
  let open Cli_effect in
  bind
    (pull_entity_by_lookup invoke_config repo
       (vector [ kw "db/id" ])
       (vector [ kw "db/ident"; kw "logseq.class/Asset" ]))
    (fun entity ->
      match id_of_entity entity with
      | Some id -> pure (Ok id)
      | None ->
          pure
            (Error
               (Error.make
                  (Edn_util.keyword_t "asset-tag-not-found")
                  "asset tag not found")))

let with_asset_metadata (block : Block.t) asset_tag_id asset_type asset_size
    asset_checksum =
  {
    block with
    Block.tags = Selector.Tag_id asset_tag_id :: block.tags;
    properties =
      [
        {
          Property.key =
            Property.Key_ident (Edn_util.keyword_t "logseq.property.asset/type");
          value = Edn_util.string asset_type;
        };
        {
          key =
            Property.Key_ident (Edn_util.keyword_t "logseq.property.asset/size");
          value = Edn_util.int64 (Int64.of_int asset_size);
        };
        {
          key =
            Property.Key_ident
              (Edn_util.keyword_t "logseq.property.asset/checksum");
          value = Edn_util.string asset_checksum;
        };
      ]
      @ block.properties;
  }

let result_ids_of_create_result result =
  match Cli_result.data_value result with
  | Some value -> (
      match Option.bind (Edn_util.get value "result") Edn_util.as_seq with
      | Some values ->
          let ids = List.filter_map Edn_util.as_int64 values in
          if List.length ids = List.length values then Some ids else None
      | _ -> None)
  | None -> None

let execute_create_asset mode config repo path create_action =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_asset mode err)
    | Ok invoke_config -> (
        match ensure_asset_file_metadata path with
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_asset mode err)
        | Ok (asset_type, asset_size, asset_checksum) ->
            bind (ensure_asset_tag_id invoke_config repo) (function
              | Error err ->
                  pure
                    (Cli_result.error ~command:Command_id.Upsert_asset mode err)
              | Ok asset_tag_id -> (
                  match create_action.blocks with
                  | [] ->
                      pure
                        (Cli_result.error ~command:Command_id.Upsert_asset mode
                           (Error.make
                              (Edn_util.keyword_t "asset-create-failed")
                              "created asset block missing uuid"))
                  | first :: rest -> (
                      match first.Block.uuid with
                      | None ->
                          pure
                            (Cli_result.error ~command:Command_id.Upsert_asset
                               mode
                               (Error.make
                                  (Edn_util.keyword_t "asset-create-failed")
                                  "created asset block missing uuid"))
                      | Some block_uuid -> (
                          let first =
                            with_asset_metadata first asset_tag_id asset_type
                              asset_size asset_checksum
                          in
                          let create_action =
                            { create_action with blocks = first :: rest }
                          in
                          let add_action =
                            add_action_of_block_create create_action
                          in
                          let destination =
                            Filename.concat
                              (graph_assets_dir config repo)
                              (block_uuid ^ "." ^ asset_type)
                          in
                          try
                            copy_file path destination;
                            bind (Add.execute_add_block add_action config mode)
                              (fun result ->
                                if Cli_result.is_error result then pure result
                                else
                                  match result_ids_of_create_result result with
                                  | Some ids ->
                                      pure
                                        (Cli_result.ok
                                           ~command:Command_id.Upsert_asset mode
                                           (Raw (result_ids ids)))
                                  | None ->
                                      pure
                                        (Cli_result.error
                                           ~command:Command_id.Upsert_asset mode
                                           (Error.make
                                              (Edn_util.keyword_t
                                                 "asset-create-failed")
                                              "asset block not created")))
                          with exn ->
                            pure
                              (Cli_result.error ~command:Command_id.Upsert_asset
                                 mode
                                 (Error.make
                                    (Edn_util.keyword_t "asset-file-copy-failed")
                                    (Printexc.to_string exn)))))))))

let execute_update_asset mode invoke_config repo id uuid content =
  let open Cli_effect in
  let pulled =
    match (id, uuid) with
    | Some id, _ -> pull_entity_by_id invoke_config repo asset_selector id
    | None, Some uuid -> pull_asset_by_uuid invoke_config repo uuid
    | None, None -> pure Edn_util.nil
  in
  bind pulled (fun entity ->
      match id_of_entity entity with
      | None ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_asset mode
               (upsert_id_not_found "asset" (Option.value id ~default:0L)))
      | Some id when not (asset_entity entity) ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_asset mode
               (upsert_id_type_mismatch "Asset" id))
      | Some id -> (
          match (content, uuid_of_entity entity) with
          | Some content, Some uuid ->
              bind (save_block_title invoke_config repo uuid content) (fun _ ->
                  pure (ok_asset_ids mode [ id ]))
          | Some _, None ->
              pure
                (Cli_result.error ~command:Command_id.Upsert_asset mode
                   (Error.make
                      (Edn_util.keyword_t "upsert-id-not-found")
                      "asset uuid not found"))
          | None, _ -> pure (ok_asset_ids mode [ id ])))

let ok_task_ids mode ids =
  Cli_result.ok ~command:Command_id.Upsert_task mode (Raw (result_ids ids))

let status_query invoke_config repo =
  Transport.thread_api_q invoke_config ~repo
    ~query:
      (Edn_util.vector_t
         [ Edn_util.any Task_status.status_closed_values_query ])

let resolve_task_status invoke_config repo = function
  | None -> Cli_effect.pure (Ok None)
  | Some status_input ->
      let open Cli_effect in
      bind (status_query invoke_config repo) (fun result ->
          let values = Option.value (Edn_util.as_seq result) ~default:[] in
          let statuses = Task_status.normalize_available_statuses values in
          match Task_status.resolve_status_ident status_input statuses with
          | Some ident -> pure (Ok (Some ident))
          | None ->
              pure
                (Error
                   (Error.invalid_options
                      (Task_status.invalid_status_message status_input statuses))))

let ensure_task_tag_id invoke_config repo =
  let open Cli_effect in
  bind
    (pull_entity_by_lookup invoke_config repo
       (vector [ kw "db/id" ])
       (vector [ kw "db/ident"; kw "logseq.class/Task" ]))
    (fun entity ->
      match id_of_entity entity with
      | Some id -> pure (Ok id)
      | None ->
          pure
            (Error
               (Error.make
                  (Edn_util.keyword_t "task-tag-not-found")
                  "task tag not found")))

let ensure_task_page invoke_config repo page =
  let open Cli_effect in
  bind (pull_pages_by_name invoke_config repo page task_selector) (fun result ->
      match first_entity result with
      | Some entity -> (
          match (id_of_entity entity, uuid_of_entity entity) with
          | Some id, Some uuid -> pure (Ok (id, uuid))
          | _ ->
              pure
                (Error
                   (Error.make
                      (Edn_util.keyword_t "page-not-found")
                      "page not found after upsert")))
      | None ->
          bind (create_page invoke_config repo page) (fun create_result ->
              bind (pull_created_page invoke_config repo page create_result)
                (fun entity ->
                  match (id_of_entity entity, uuid_of_entity entity) with
                  | Some id, Some uuid -> pure (Ok (id, uuid))
                  | _ ->
                      pure
                        (Error
                           (Error.make
                              (Edn_util.keyword_t "page-not-found")
                              "page not found after upsert")))))

let execute_task_plan_on_uuids invoke_config repo block_uuids task_tag_id
    status_ident update_property_assignments clear_properties =
  let update_properties =
    match status_ident with
    | Some ident ->
        [ (Edn_util.keyword_t "logseq.property/status", Edn_util.any ident) ]
    | None -> []
  in
  let update_properties =
    update_properties
    @ List.filter_map
        (fun assignment ->
          match assignment.Property.key with
          | Property.Key_ident ident -> Some (ident, assignment.value)
          | _ -> None)
        update_property_assignments
  in
  let remove_properties =
    List.filter_map
      (function Property.Key_ident ident -> Some ident | _ -> None)
      clear_properties
  in
  apply_resolved_update_plan invoke_config repo block_uuids
    ([ task_tag_id ], [], update_properties, remove_properties)

let execute_task_plan_on_uuid invoke_config repo block_uuid task_tag_id
    status_ident update_property_assignments clear_properties =
  execute_task_plan_on_uuids invoke_config repo [ block_uuid ] task_tag_id
    status_ident update_property_assignments clear_properties

let execute_task_page mode invoke_config repo page status_input
    update_properties clear_properties =
  let open Cli_effect in
  bind (resolve_task_status invoke_config repo status_input) (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
    | Ok status_ident ->
        bind (ensure_task_tag_id invoke_config repo) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
          | Ok task_tag_id ->
              bind (ensure_task_page invoke_config repo page) (function
                | Error err ->
                    pure
                      (Cli_result.error ~command:Command_id.Upsert_task mode err)
                | Ok (page_id, page_uuid) ->
                    bind
                      (execute_task_plan_on_uuid invoke_config repo page_uuid
                         task_tag_id status_ident update_properties
                         clear_properties) (function
                      | Error err ->
                          pure
                            (Cli_result.error ~command:Command_id.Upsert_task
                               mode err)
                      | Ok _ -> pure (ok_task_ids mode [ page_id ])))))

let pull_task_by_uuid invoke_config repo uuid =
  pull_entity_by_lookup invoke_config repo task_selector
    (vector [ kw "block/uuid"; Edn_util.uuid uuid ])

let execute_task_update mode invoke_config repo id uuid status_input
    update_properties clear_properties =
  let open Cli_effect in
  bind (resolve_task_status invoke_config repo status_input) (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
    | Ok status_ident ->
        bind (ensure_task_tag_id invoke_config repo) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
          | Ok task_tag_id ->
              let pulled =
                match (id, uuid) with
                | Some id, _ ->
                    pull_entity_by_id invoke_config repo task_selector id
                | None, Some uuid -> pull_task_by_uuid invoke_config repo uuid
                | None, None -> pure Edn_util.nil
              in
              bind pulled (fun entity ->
                  match (id_of_entity entity, uuid_of_entity entity) with
                  | Some node_id, Some node_uuid ->
                      bind
                        (execute_task_plan_on_uuid invoke_config repo node_uuid
                           task_tag_id status_ident update_properties
                           clear_properties) (function
                        | Error err ->
                            pure
                              (Cli_result.error ~command:Command_id.Upsert_task
                                 mode err)
                        | Ok _ -> pure (ok_task_ids mode [ node_id ]))
                  | Some _, None ->
                      pure
                        (Cli_result.error ~command:Command_id.Upsert_task mode
                           (Error.make
                              (Edn_util.keyword_t "upsert-id-not-found")
                              "task uuid not found"))
                  | None, _ ->
                      pure
                        (Cli_result.error ~command:Command_id.Upsert_task mode
                           (upsert_id_not_found "task"
                              (Option.value id ~default:0L))))))

let page_result_with_plan ?(restore = false) mode invoke_config repo page_id
    page_uuid plan =
  let open Cli_effect in
  let restore_effect =
    if restore then restore_recycled_page invoke_config repo page_uuid
    else pure Edn_util.nil
  in
  bind restore_effect (fun _ ->
      bind (execute_page_plan invoke_config repo page_uuid plan) (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Upsert_page mode err)
      | Ok _ -> pure (ok_page_ids mode [ page_id ])))

let execute_create_page mode invoke_config repo name restore plan =
  let open Cli_effect in
  bind (pull_pages_by_name invoke_config repo name page_selector)
    (fun existing ->
      match first_entity existing with
      | Some page -> (
          let recycled = recycled_entity page in
          if recycled && not restore then
            pure
              (Cli_result.error ~command:Command_id.Upsert_page mode
                 (recycled_page_error ()))
          else
            match (id_of_entity page, uuid_of_entity page) with
            | Some id, Some uuid ->
                page_result_with_plan ~restore:recycled mode invoke_config repo
                  id uuid plan
            | Some _, None when recycled ->
                pure
                  (Cli_result.error ~command:Command_id.Upsert_page mode
                     (recycled_page_error ()))
            | Some id, None -> pure (ok_page_ids mode [ id ])
            | _ ->
                pure
                  (Cli_result.error ~command:Command_id.Upsert_page mode
                     (page_not_found ())))
      | None ->
          bind (create_page invoke_config repo name) (fun create_result ->
              bind (pull_created_page invoke_config repo name create_result)
                (fun page ->
                  match (id_of_entity page, uuid_of_entity page) with
                  | Some id, Some uuid ->
                      page_result_with_plan mode invoke_config repo id uuid plan
                  | Some id, None -> pure (ok_page_ids mode [ id ])
                  | _ ->
                      pure
                        (Cli_result.error ~command:Command_id.Upsert_page mode
                           (page_not_found ())))))

let execute_update_page mode invoke_config repo id restore plan =
  let open Cli_effect in
  bind (pull_entity_by_id invoke_config repo page_selector id) (fun entity ->
      match id_of_entity entity with
      | None ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_page mode
               (upsert_id_not_found "page" id))
      | Some id when not (page_entity entity) ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_page mode
               (upsert_id_type_mismatch "Page" id))
      | Some _ when recycled_entity entity && not restore ->
          pure
            (Cli_result.error ~command:Command_id.Upsert_page mode
               (recycled_page_error ()))
      | Some id -> (
          let recycled = recycled_entity entity in
          match uuid_of_entity entity with
          | Some uuid ->
              page_result_with_plan ~restore:recycled mode invoke_config repo id
                uuid plan
          | None when recycled ->
              pure
                (Cli_result.error ~command:Command_id.Upsert_page mode
                   (recycled_page_error ()))
          | None -> pure (ok_page_ids mode [ id ])))

let update_plan_empty (plan : Property.update_plan) =
  plan.update_tags = [] && plan.remove_tags = []
  && plan.update_properties = []
  && plan.remove_properties = []

let result_ids_of_cli_result result =
  match Cli_result.data_value result with
  | Some value -> (
      match Option.bind (Edn_util.get value "result") Edn_util.as_seq with
      | Some values ->
          let ids = List.filter_map Edn_util.as_int64 values in
          if List.length ids = List.length values then Some ids else None
      | _ -> None)
  | _ -> None

let rec resolve_block_uuids_by_id invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | id :: rest ->
      let open Cli_effect in
      bind
        (pull_entity_by_id invoke_config repo
           (vector [ kw "db/id"; kw "block/uuid" ])
           id)
        (fun entity ->
          match uuid_of_entity entity with
          | None -> pure (Error (upsert_id_not_found "block" id))
          | Some uuid ->
              bind (resolve_block_uuids_by_id invoke_config repo rest) (function
                | Error err -> pure (Error err)
                | Ok uuids -> pure (Ok (uuid :: uuids))))

let block_uuids_of_add_action action =
  List.filter_map (fun block -> block.Block.uuid) action.Add.blocks

let execute_task_create mode config invoke_config repo target_page content
    status_input update_properties clear_properties =
  let open Cli_effect in
  bind (resolve_task_status invoke_config repo status_input) (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
    | Ok status_ident ->
        bind (ensure_task_tag_id invoke_config repo) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
          | Ok task_tag_id -> (
              let add_opts =
                {
                  Add.target_id = None;
                  target_uuid = None;
                  target_page_name = Some target_page;
                  pos = None;
                  status = None;
                  tags_edn = None;
                  properties_edn = None;
                  content = Some content;
                  blocks_edn = None;
                  blocks_file = None;
                }
              in
              match Add.build_add_block_action add_opts [] repo with
              | Error err ->
                  pure
                    (Cli_result.error ~command:Command_id.Upsert_task mode err)
              | Ok create_action ->
                  bind (Add.execute_add_block create_action config mode)
                    (fun result ->
                      if Cli_result.is_error result then
                        pure
                          (Cli_result.with_command Command_id.Upsert_task result)
                      else
                        match result_ids_of_cli_result result with
                        | None ->
                            pure
                              (Cli_result.error ~command:Command_id.Upsert_task
                                 mode
                                 (Error.make
                                    (Edn_util.keyword_t
                                       "add-id-resolution-failed")
                                    "unable to resolve created ids"))
                        | Some ids ->
                            let block_uuids =
                              block_uuids_of_add_action create_action
                            in
                            let resolved_uuids =
                              if block_uuids = [] then
                                resolve_block_uuids_by_id invoke_config repo ids
                              else pure (Ok block_uuids)
                            in
                            bind resolved_uuids (function
                              | Error err ->
                                  pure
                                    (Cli_result.error
                                       ~command:Command_id.Upsert_task mode err)
                              | Ok block_uuids ->
                                  bind
                                    (execute_task_plan_on_uuids invoke_config
                                       repo block_uuids task_tag_id status_ident
                                       update_properties clear_properties)
                                    (function
                                    | Error err ->
                                        pure
                                          (Cli_result.error
                                             ~command:Command_id.Upsert_task
                                             mode err)
                                    | Ok _ -> pure (ok_task_ids mode ids)))))))

let execute_create_block mode (action : block_create) config =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
    | Ok invoke_config ->
        bind
          (resolve_blocks_inline_properties invoke_config action.repo
             action.blocks) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
          | Ok blocks ->
              let action = { action with blocks } in
              let resolved_plan_effect =
                if update_plan_empty action.update_plan then pure (Ok None)
                else
                  map
                    (function
                      | Ok plan -> Ok (Some plan) | Error err -> Error err)
                    (resolve_update_plan invoke_config action.repo
                       action.update_plan)
              in
              bind resolved_plan_effect (function
                | Error err ->
                    pure
                      (Cli_result.error ~command:Command_id.Upsert_block mode
                         err)
                | Ok resolved_plan ->
                    let add_action =
                      add_action_of_block_create
                        {
                          action with
                          blocks = List.map strip_block_properties action.blocks;
                        }
                    in
                    bind (Add.execute_add_block add_action config mode)
                      (fun result ->
                        if Cli_result.is_error result then pure result
                        else
                          bind
                            (apply_inline_property_ops invoke_config action.repo
                               action.blocks) (function
                            | Error err ->
                                pure
                                  (Cli_result.error
                                     ~command:Command_id.Upsert_block mode err)
                            | Ok _ -> (
                                match resolved_plan with
                                | None -> pure result
                                | Some resolved_plan -> (
                                    match result_ids_of_cli_result result with
                                    | None ->
                                        pure
                                          (Cli_result.error
                                             ~command:Command_id.Upsert_block
                                             mode
                                             (Error.make
                                                (Edn_util.keyword_t
                                                   "add-id-resolution-failed")
                                                "unable to resolve created ids"))
                                    | Some ids ->
                                        bind
                                          (resolve_block_uuids_by_id
                                             invoke_config action.repo ids)
                                          (function
                                          | Error err ->
                                              pure
                                                (Cli_result.error
                                                   ~command:
                                                     Command_id.Upsert_block
                                                   mode err)
                                          | Ok block_uuids ->
                                              bind
                                                (apply_resolved_update_plan
                                                   invoke_config action.repo
                                                   block_uuids resolved_plan)
                                                (function
                                                | Error err ->
                                                    pure
                                                      (Cli_result.error
                                                         ~command:
                                                           Command_id
                                                           .Upsert_block mode
                                                         err)
                                                | Ok _ -> pure result)))))))))

let execute_with_mode action config mode =
  let open Cli_effect in
  match action with
  | Upsert_block (Block_create action) ->
      execute_create_block mode action config
  | Upsert_block (Block_update action) ->
      map
        (Cli_result.with_command Command_id.Upsert_block)
        (Update.execute (update_action_of_block_update action) config mode)
  | Upsert_tag
      {
        repo;
        mode = Create;
        name = Some name;
        add_properties;
        remove_properties;
        _;
      } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_tag mode err)
        | Ok invoke_config ->
            execute_create_tag mode invoke_config repo name ~add_properties
              ~remove_properties)
  | Upsert_tag
      {
        repo;
        mode = Update;
        id = Some id;
        name;
        add_properties;
        remove_properties;
        _;
      } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_tag mode err)
        | Ok invoke_config ->
            execute_update_tag mode invoke_config repo id name ~add_properties
              ~remove_properties)
  | Upsert_tag _ ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_tag mode
           (Error.make
              (Edn_util.keyword_t "not-implemented")
              "upsert tag is not implemented"))
  | Upsert_page { repo; mode = Create; page = Some page; restore; plan; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_page mode err)
        | Ok invoke_config ->
            execute_create_page mode invoke_config repo page restore plan)
  | Upsert_page { repo; mode = Update; id = Some id; restore; plan; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_page mode err)
        | Ok invoke_config ->
            execute_update_page mode invoke_config repo id restore plan)
  | Upsert_page _ ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_page mode
           (Error.make
              (Edn_util.keyword_t "not-implemented")
              "upsert page is not implemented"))
  | Upsert_property { repo; mode = Create; name = Some name; schema; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_property mode err)
        | Ok invoke_config ->
            execute_create_property mode invoke_config repo name schema)
  | Upsert_property { repo; mode = Update; id = Some id; schema; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_property mode err)
        | Ok invoke_config ->
            execute_update_property mode invoke_config repo id schema)
  | Upsert_property _ ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_property mode
           (Error.make
              (Edn_util.keyword_t "not-implemented")
              "upsert property is not implemented"))
  | Upsert_asset { repo; mode = Update; id; uuid; content; _ } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_asset mode err)
        | Ok invoke_config ->
            execute_update_asset mode invoke_config repo id uuid content)
  | Upsert_asset
      {
        repo;
        mode = Create;
        path = Some path;
        create_action = Some create_action;
        _;
      } ->
      execute_create_asset mode config repo path create_action
  | Upsert_asset _ ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_asset mode
           (Error.make
              (Edn_util.keyword_t "not-implemented")
              "upsert asset is not implemented"))
  | Upsert_task
      {
        repo;
        mode = Page;
        page = Some page;
        status_input;
        update_properties;
        clear_properties;
        _;
      } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
        | Ok invoke_config ->
            execute_task_page mode invoke_config repo page status_input
              update_properties clear_properties)
  | Upsert_task
      {
        repo;
        mode = Create;
        page = Some target_page;
        content = Some content;
        status_input;
        update_properties;
        clear_properties;
        _;
      } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
        | Ok invoke_config ->
            execute_task_create mode config invoke_config repo target_page
              content status_input update_properties clear_properties)
  | Upsert_task
      {
        repo;
        mode = Update;
        id;
        uuid;
        status_input;
        update_properties;
        clear_properties;
        _;
      } ->
      bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
        (function
        | Error err ->
            pure (Cli_result.error ~command:Command_id.Upsert_task mode err)
        | Ok invoke_config ->
            execute_task_update mode invoke_config repo id uuid status_input
              update_properties clear_properties)
  | Upsert_task _ ->
      pure
        (Cli_result.error ~command:Command_id.Upsert_task mode
           (Error.make
              (Edn_util.keyword_t "not-implemented")
              "upsert task is not implemented"))

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
    human_table_headers_order = [];
  }

let metadata () =
  [
    meta
      ~examples:
        [
          "logseq upsert block --graph my-graph --target-page Home --content \
           \"New block\"";
          "logseq upsert block --graph my-graph --id 123 --content \"Updated \
           content\"";
          "logseq upsert block --graph my-graph --id 123 --target-page Home";
          "logseq upsert block --graph my-graph --target-page Meeting Notes \
           --content \"AI summary of the discussion\" --update-tags \
           '[\"AI-GENERATED\"]'";
          "logseq upsert block --graph my-graph --blocks '[{:block/title \
           \"A\"} {:block/title \"B\"}]'";
        ]
      Command_id.Upsert_block "Upsert block";
    meta
      ~examples:
        [
          "logseq upsert page --graph my-graph --page Home --update-tags \
           '[\"project\"]'";
          "logseq upsert page --graph my-graph --id 999 --update-properties \
           '{:logseq.property/description \"Example\"}'";
        ]
      Upsert_page "Upsert page";
    meta
      ~examples:
        [
          "logseq upsert task --graph my-graph --content \"Ship release\" \
           --target-page Home --status todo --priority high --scheduled \
           \"2026-02-10T08:00:00.000Z\" --deadline \
           \"2026-02-12T18:00:00.000Z\"";
          "logseq upsert task --graph my-graph --page Weekly Plan --status \
           doing";
          "logseq upsert task --graph my-graph --id 123 --no-status \
           --no-priority";
        ]
      Upsert_task "Upsert task";
    meta
      ~examples:
        [
          "logseq upsert asset --graph my-graph --path ./assets/logo.png \
           --target-page Home";
          "logseq upsert asset --graph my-graph --id 123 --content \"Updated \
           asset title\"";
        ]
      Upsert_asset "Upsert asset";
    meta
      ~examples:
        [
          "logseq upsert tag --graph my-graph --name project";
          "logseq upsert tag --graph my-graph --id 200 --name Project Renamed";
          "logseq upsert tag --graph my-graph --name project --add-properties \
           '[\"status\" \"owner\"]'";
        ]
      Upsert_tag "Upsert tag";
    meta
      ~examples:
        [
          "logseq upsert property --graph my-graph --name status --type \
           default --cardinality one";
          "logseq upsert property --graph my-graph --id 321 --hide true";
        ]
      Upsert_property "Upsert property";
  ]

let repo = function
  | Upsert_block (Block_create a) -> a.repo
  | Upsert_block (Block_update a) -> a.repo
  | Upsert_page { repo; _ }
  | Upsert_task { repo; _ }
  | Upsert_asset { repo; _ }
  | Upsert_tag { repo; _ }
  | Upsert_property { repo; _ } ->
      repo

let graph = function
  | Upsert_block (Block_create a) -> a.graph
  | Upsert_block (Block_update a) -> a.graph
  | Upsert_page { graph; _ }
  | Upsert_task { graph; _ }
  | Upsert_asset { graph; _ }
  | Upsert_tag { graph; _ }
  | Upsert_property { graph; _ } ->
      graph

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
