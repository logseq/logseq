type order = Asc | Desc

type common_opts = {
  fields : string list option;
  limit : int option;
  offset : int option;
  sort : string option;
  order : order option;
}

type page_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  include_journal : bool option;
  journal_only : bool;
  include_hidden : bool;
  updated_after : string option;
  created_after : string option;
}

type tag_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  with_properties : bool;
  with_extends : bool;
}

type property_opts = {
  common : common_opts;
  expand : bool;
  include_built_in : bool option;
  with_classes : bool;
  with_type : bool;
}

type task_opts = {
  common : common_opts;
  status : string option;
  priority : string option;
  content : string option;
}

type node_opts = {
  common : common_opts;
  tags : string list;
  properties : string list;
}

type asset_opts = { common : common_opts }

type parsed =
  | Parsed_page of page_opts
  | Parsed_tag of tag_opts
  | Parsed_property of property_opts
  | Parsed_task of task_opts
  | Parsed_node of node_opts
  | Parsed_asset of asset_opts

type kind = Page | Tag | Property | Task | Node | Asset

type action = {
  kind : kind;
  command : Command_id.t;
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  options : Edn_ocaml.any;
}

type list_result = { items : Entity.t list }

let empty_common_opts =
  { fields = None; limit = None; offset = None; sort = None; order = None }

let order_of_string value =
  match String.lowercase_ascii (String.trim value) with
  | "asc" -> Some Asc
  | "desc" -> Some Desc
  | _ -> None

let string_of_order = function Asc -> "asc" | Desc -> "desc"

let kind_of_parsed = function
  | Parsed_page _ -> Page
  | Parsed_tag _ -> Tag
  | Parsed_property _ -> Property
  | Parsed_task _ -> Task
  | Parsed_node _ -> Node
  | Parsed_asset _ -> Asset

let normalize_priority value =
  match String.lowercase_ascii (String.trim value) with
  | "low" -> Some ":logseq.property/priority.low"
  | "medium" -> Some ":logseq.property/priority.medium"
  | "high" -> Some ":logseq.property/priority.high"
  | "urgent" -> Some ":logseq.property/priority.urgent"
  | _ -> None

let invalid_priority_message value =
  "Invalid value for option :priority: " ^ value
  ^ ". Available values: low, medium, high, urgent"

let validate_parsed = function
  | Parsed_page opts when opts.include_journal = Some true && opts.journal_only
    ->
      Error
        (Error.invalid_options
           "include-journal and journal-only are mutually exclusive")
  | Parsed_task opts -> (
      match opts.priority with
      | Some value when normalize_priority value = None ->
          Error (Error.invalid_options (invalid_priority_message value))
      | _ -> Ok ())
  | Parsed_node opts when opts.tags = [] && opts.properties = [] ->
      Error
        (Error.invalid_options
           "list node requires at least one of --tags or --properties")
  | _ -> Ok ()

let normalize_options p = Error.bind (validate_parsed p) (fun () -> Ok p)
let default_sort_field = "updated-at"

let field_map fields =
  List.map (fun (name, keyword) -> (name, Edn_util.keyword_t keyword)) fields

let page_field_map =
  field_map
    [
      ("id", ":db/id");
      ("ident", ":db/ident");
      ("title", ":block/title");
      ("uuid", ":block/uuid");
      ("created-at", ":block/created-at");
      ("updated-at", ":block/updated-at");
    ]

let tag_field_map =
  page_field_map
  @ field_map
      [
        ("properties", ":logseq.property.class/properties");
        ("extends", ":logseq.property.class/extends");
        ("description", ":logseq.property/description");
      ]

let property_field_map =
  page_field_map
  @ field_map
      [
        ("classes", ":logseq.property/classes");
        ("type", ":logseq.property/type");
        ("cardinality", ":db/cardinality");
        ("description", ":logseq.property/description");
      ]

let task_field_map =
  field_map
    [
      ("id", ":db/id");
      ("title", ":block/title");
      ("status", ":logseq.property/status");
      ("priority", ":logseq.property/priority");
      ("scheduled", ":logseq.property/scheduled");
      ("deadline", ":logseq.property/deadline");
      ("updated-at", ":block/updated-at");
      ("created-at", ":block/created-at");
    ]

let node_field_map =
  field_map
    [
      ("id", ":db/id");
      ("title", ":block/title");
      ("type", ":node/type");
      ("page-id", ":block/page-id");
      ("page-title", ":block/page-title");
      ("created-at", ":block/created-at");
      ("updated-at", ":block/updated-at");
    ]

let asset_field_map =
  field_map
    [
      ("id", ":db/id");
      ("title", ":block/title");
      ("asset-type", ":logseq.property.asset/type");
      ("size", ":logseq.property.asset/size");
      ("updated-at", ":block/updated-at");
      ("created-at", ":block/created-at");
    ]

let field_map_of_kind = function
  | Page -> page_field_map
  | Tag -> tag_field_map
  | Property -> property_field_map
  | Task -> task_field_map
  | Node -> node_field_map
  | Asset -> asset_field_map

let value_rank value =
  match value with
  | Edn_ocaml.Any Edn_ocaml.Nil -> 0
  | Any (Bool _) -> 1
  | Any (Int _ | Bigint _ | Float _ | Decimal _) -> 2
  | Any (String _ | Symbol _ | Keyword _ | Tagged ("uuid", _)) -> 3
  | Any (Tagged ("bytes", _)) -> 4
  | Any (List _ | Vector _ | Set _) -> 5
  | Any (Map _) -> 6
  | Any (Char _ | Tagged _) -> 7

let compare_value a b =
  let number value =
    match (Edn_util.as_int value, Edn_util.as_float value) with
    | Some value, _ -> Some (float_of_int value)
    | _, Some value -> Some value
    | _ -> None
  in
  match
    ( Edn_util.is_null a,
      Edn_util.is_null b,
      Edn_util.as_bool a,
      Edn_util.as_bool b,
      number a,
      number b,
      Edn_util.as_string_like a,
      Edn_util.as_string_like b,
      Edn_util.as_bytes a,
      Edn_util.as_bytes b )
  with
  | true, true, _, _, _, _, _, _, _, _ -> 0
  | _, _, Some a, Some b, _, _, _, _, _, _ -> Bool.compare a b
  | _, _, _, _, Some a, Some b, _, _, _, _ -> Float.compare a b
  | _, _, _, _, _, _, Some a, Some b, _, _ -> String.compare a b
  | _, _, _, _, _, _, _, _, Some a, Some b ->
      String.compare (Bytes.to_string a) (Bytes.to_string b)
  | _ ->
      let rank = Int.compare (value_rank a) (value_rank b) in
      if rank <> 0 then rank
      else
        String.compare (Edn_ocaml.to_edn_string a) (Edn_ocaml.to_edn_string b)

let compare_item_by keyword a b =
  let value_of key item =
    Option.value
      (Edn_util.get item (Edn_util.keyword_to_string key))
      ~default:Edn_util.nil
  in
  let primary = compare_value (value_of keyword a) (value_of keyword b) in
  if primary <> 0 then primary
  else
    compare_value
      (value_of (Edn_util.keyword_t ":db/id") a)
      (value_of (Edn_util.keyword_t ":db/id") b)

let sort_values ~field_map common items =
  let sort_field = Option.value common.sort ~default:default_sort_field in
  match List.assoc_opt sort_field field_map with
  | None -> items
  | Some keyword -> (
      let sorted = List.sort (compare_item_by keyword) items in
      match common.order with
      | Some Asc -> sorted
      | Some Desc | None -> List.rev sorted)

let apply_sort ~field_map common entities =
  let sort_field = Option.value common.sort ~default:default_sort_field in
  match List.assoc_opt sort_field field_map with
  | None -> entities
  | Some keyword -> (
      let sorted =
        List.sort
          (fun a b -> compare_item_by keyword a.Entity.raw b.Entity.raw)
          entities
      in
      match common.order with
      | Some Asc -> sorted
      | Some Desc | None -> List.rev sorted)

let apply_offset_limit common entities =
  let entities =
    match common.offset with
    | Some n -> entities |> List.to_seq |> Seq.drop n |> List.of_seq
    | None -> entities
  in
  match common.limit with
  | Some n -> entities |> List.to_seq |> Seq.take n |> List.of_seq
  | None -> entities

let command_id = function
  | Parsed_page _ -> Command_id.List_page
  | Parsed_tag _ -> List_tag
  | Parsed_property _ -> List_property
  | Parsed_task _ -> List_task
  | Parsed_node _ -> List_node
  | Parsed_asset _ -> List_asset

let value_of_string_list values =
  Edn_util.vector (List.map (fun value -> Edn_util.string value) values)

let string_list_of_value value =
  match Edn_util.as_seq value with
  | Some values -> List.filter_map Edn_util.as_string_like values
  | None -> (
      match Edn_util.as_string_like value with
      | Some value -> [ value ]
      | None -> [])

let common_of_options options =
  {
    fields = Option.map string_list_of_value (Edn_util.get options ":fields");
    limit = Edn_util.get_int options ":limit";
    offset = Edn_util.get_int options ":offset";
    sort = Edn_util.get_string options ":sort";
    order = Option.bind (Edn_util.get_string options ":order") order_of_string;
  }

let select_fields field_map fields item =
  let keys =
    fields |> List.filter_map (fun field -> List.assoc_opt field field_map)
  in
  if keys = [] then item
  else
    Edn_util.map
      (List.filter_map
         (fun key ->
           Option.map
             (fun value -> (Edn_util.any key, value))
             (Edn_util.get item (Edn_util.keyword_to_string key)))
         keys)

let apply_fields field_map common items =
  match common.fields with
  | None -> items
  | Some fields -> List.map (select_fields field_map fields) items

let postprocess_items kind options items =
  let common = common_of_options options in
  let field_map = field_map_of_kind kind in
  let sorted = sort_values ~field_map common items in
  let limited =
    sorted |> List.map Entity.of_value |> apply_offset_limit common
    |> List.map (fun entity -> entity.Entity.raw)
  in
  apply_fields field_map common limited

let status_query invoke_config repo =
  Transport.thread_api_q invoke_config ~repo
    ~query:(Edn_util.vector_t [ Edn_util.any Task_status.status_closed_values_query ])

let kw value = Edn_util.keyword value
let sym value = Edn_util.string ("~$" ^ value)
let vector values = Edn_util.vector values
let list values = Edn_util.list values
let normalized_lookup_name value = String.lowercase_ascii (String.trim value)

let tag_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      kw ":block/name";
      kw ":block/title";
      Edn_util.map [ (kw ":block/tags", vector [ kw ":db/ident" ]) ];
      kw ":logseq.property/public?";
    ]

let property_selector =
  vector
    [
      kw ":db/id";
      kw ":db/ident";
      kw ":block/name";
      kw ":block/title";
      kw ":logseq.property/type";
      kw ":db/cardinality";
      kw ":logseq.property/public?";
    ]

let class_query selector class_ident =
  Edn_util.map
    [
      ( kw ":find",
        vector [ vector [ list [ sym "pull"; sym "?e"; selector ]; sym "..." ] ]
      );
      (kw ":in", list [ sym "$"; sym "?name" ]);
      ( kw ":where",
        vector
          [
            vector [ sym "?e"; kw ":block/name"; sym "?name" ];
            vector [ sym "?e"; kw ":block/tags"; sym "?tag" ];
            vector [ sym "?tag"; kw ":db/ident"; kw class_ident ];
          ] );
    ]

let pull_tag_by_name config repo name =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t
         [
           class_query tag_selector ":logseq.class/Tag";
           Edn_util.string (normalized_lookup_name name);
         ])

let pull_tag_by_uuid config repo uuid =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "list tag selector" tag_selector)
    ~lookup:(vector [ kw ":block/uuid"; Edn_util.uuid uuid ])

let pull_property_by_ident config repo ident =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "list property selector" property_selector)
    ~lookup:(vector [ kw ":db/ident"; kw ident ])

let pull_property_by_id config repo id =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "list property selector" property_selector)
    ~lookup:(Edn_util.int64 id)

let pull_asset_tag config repo =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.vector_t [ kw ":db/id" ])
    ~lookup:(vector [ kw ":db/ident"; kw ":logseq.class/Asset" ])

let first_entity value =
  let map_value value =
    match Edn_util.as_map value with Some _ -> Some value | None -> None
  in
  match
    (Edn_util.as_vector value, Edn_util.as_list value, Edn_util.as_map value)
  with
  | Some (first :: _), _, _ | _, Some (first :: _), _ -> (
      match map_value first with
      | Some _ as result -> result
      | None -> (
          match (Edn_util.as_vector first, Edn_util.as_list first) with
          | Some (nested :: _), _ | _, Some (nested :: _) -> map_value nested
          | _ -> None))
  | _, _, Some _ -> Some value
  | _ -> None

let id_of_entity value = Edn_util.get_int64 value ":db/id"

let ident_of_entity value =
  Option.bind (Edn_util.get value ":db/ident") Edn_util.as_keyword_t

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

let tag_id_of_result result =
  match first_entity result with
  | Some entity when tag_entity entity -> (
      match id_of_entity entity with
      | Some id -> Ok id
      | None ->
          Error
            (Error.make (Edn_util.keyword_t "tag-not-found") "tag not found"))
  | _ -> Error (Error.make (Edn_util.keyword_t "tag-not-found") "tag not found")

let property_entity value =
  Option.is_some (Edn_util.get value ":logseq.property/type")

let property_public value =
  match Edn_util.get_bool value ":logseq.property/public?" with
  | Some false -> false
  | _ -> true

let property_ident_of_entity entity =
  if property_entity entity && property_public entity then
    match ident_of_entity entity with
    | Some ident -> Ok ident
    | None ->
        Error
          (Error.make
             (Edn_util.keyword_t "property-not-found")
             "property not found")
  else
    Error
      (Error.make
         (Edn_util.keyword_t "property-not-found")
         "property not found")

let parse_tag_selector value =
  let value = String.trim value in
  match Int64.of_string_opt value with
  | Some id -> Selector.Tag_id id
  | None ->
      if Cli_primitive.is_uuid_string value then Selector.Tag_uuid value
      else if String.length value > 0 && value.[0] = ':' then
        Selector.Tag_ident (Edn_util.keyword_t value)
      else Selector.Tag_name value

let parse_property_selector value =
  let value = String.trim value in
  match Int64.of_string_opt value with
  | Some id -> Property.Key_id id
  | None ->
      if String.length value > 0 && value.[0] = ':' then
        Property.Key_ident (Edn_util.keyword_t value)
      else Key_name value

let resolve_tag_id invoke_config repo selector =
  let open Cli_effect in
  match selector with
  | Selector.Tag_id id -> pure (Ok id)
  | Tag_name name ->
      bind (pull_tag_by_name invoke_config repo name) (fun result ->
          pure (tag_id_of_result result))
  | Tag_ident ident ->
      bind
        (pull_tag_by_name invoke_config repo (Edn_util.keyword_to_string ident))
        (fun result -> pure (tag_id_of_result result))
  | Tag_uuid uuid ->
      bind (pull_tag_by_uuid invoke_config repo uuid) (fun result ->
          pure (tag_id_of_result result))

let rec resolve_tag_ids invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | selector :: rest ->
      let open Cli_effect in
      bind (resolve_tag_id invoke_config repo selector) (function
        | Error err -> pure (Error err)
        | Ok id ->
            bind (resolve_tag_ids invoke_config repo rest) (function
              | Error err -> pure (Error err)
              | Ok ids -> pure (Ok (id :: ids))))

let resolve_property_ident invoke_config repo selector =
  let open Cli_effect in
  match selector with
  | Property.Key_ident ident ->
      bind
        (pull_property_by_ident invoke_config repo
           (Edn_util.keyword_to_string ident))
        (fun entity -> pure (property_ident_of_entity entity))
  | Key_id id ->
      bind (pull_property_by_id invoke_config repo id) (fun entity ->
          pure (property_ident_of_entity entity))
  | Key_name name ->
      bind
        (pull_property_by_ident invoke_config repo
           (Edn_util.keyword_to_string
              (Cli_primitive.normalize_keyword (Edn_util.keyword_t name))))
        (fun entity -> pure (property_ident_of_entity entity))

let rec resolve_property_idents invoke_config repo = function
  | [] -> Cli_effect.pure (Ok [])
  | selector :: rest ->
      let open Cli_effect in
      bind (resolve_property_ident invoke_config repo selector) (function
        | Error err -> pure (Error err)
        | Ok ident ->
            bind (resolve_property_idents invoke_config repo rest) (function
              | Error err -> pure (Error err)
              | Ok idents -> pure (Ok (ident :: idents))))

let normalize_task_options invoke_config repo options =
  let open Cli_effect in
  let options =
    match Edn_util.get_string options ":priority" with
    | Some priority_input -> (
        match normalize_priority priority_input with
        | Some priority ->
            Edn_util.assoc ":priority" (Edn_util.keyword priority) options
        | None -> options)
    | None -> options
  in
  match Edn_util.get_string options ":status" with
  | None -> pure (Ok options)
  | Some status_input when String.trim status_input = "" -> pure (Ok options)
  | Some status_input ->
      bind (status_query invoke_config repo) (fun result ->
          let values =
            match (Edn_util.as_vector result, Edn_util.as_list result) with
            | Some values, _ | _, Some values -> values
            | _ -> []
          in
          let statuses = Task_status.normalize_available_statuses values in
          match Task_status.resolve_status_ident status_input statuses with
          | Some ident ->
              pure (Ok (Edn_util.assoc ":status" (Edn_util.any ident) options))
          | None ->
              pure
                (Error
                   (Error.invalid_options
                      (Task_status.invalid_status_message status_input statuses))))

let bool_option options key =
  match Edn_util.get_bool options key with
  | Some true -> true
  | Some false | None -> false

let fields_include options field =
  match (common_of_options options).fields with
  | Some fields -> List.exists (( = ) field) fields
  | None -> false

let normalize_tag_options options =
  if
    bool_option options ":with-properties"
    || bool_option options ":with-extends"
  then Edn_util.assoc ":expand" (Edn_util.bool true) options
  else options

let normalize_property_options options =
  if bool_option options ":with-classes" then
    Edn_util.assoc ":expand" (Edn_util.bool true) options
  else options

let normalize_node_options invoke_config repo options =
  let open Cli_effect in
  let tag_selectors =
    Edn_util.get options ":tags"
    |> Option.map string_list_of_value
    |> Option.value ~default:[]
    |> List.map parse_tag_selector
  in
  let property_selectors =
    Edn_util.get options ":properties"
    |> Option.map string_list_of_value
    |> Option.value ~default:[]
    |> List.map parse_property_selector
  in
  bind (resolve_tag_ids invoke_config repo tag_selectors) (function
    | Error err -> pure (Error err)
    | Ok tag_ids ->
        bind (resolve_property_idents invoke_config repo property_selectors)
          (function
          | Error err -> pure (Error err)
          | Ok property_idents ->
              let options =
                options |> Edn_util.remove ":tags"
                |> Edn_util.remove ":properties"
              in
              let options =
                if tag_ids = [] then options
                else
                  Edn_util.assoc ":tag-ids"
                    (Edn_util.vector
                       (List.map (fun id -> Edn_util.int64 id) tag_ids))
                    options
              in
              let options =
                if property_idents = [] then options
                else
                  Edn_util.assoc ":property-idents"
                    (Edn_util.vector
                       (List.map
                          (fun ident -> Edn_util.any ident)
                          property_idents))
                    options
              in
              pure (Ok options)))

let normalize_asset_options invoke_config repo options =
  let open Cli_effect in
  bind (pull_asset_tag invoke_config repo) (fun entity ->
      match id_of_entity entity with
      | Some id ->
          pure
            (Ok
               (Edn_util.assoc ":tag-ids"
                  (Edn_util.vector [ Edn_util.int64 id ])
                  options))
      | None ->
          pure
            (Error
               (Error.make
                  (Edn_util.keyword_t "asset-tag-not-found")
                  "asset tag not found")))

let prepare_tag_item options item =
  ( ( item |> fun item ->
      if bool_option options ":with-properties" then item
      else Edn_util.remove ":logseq.property.class/properties" item )
  |> fun item ->
    if bool_option options ":with-extends" then item
    else Edn_util.remove ":logseq.property.class/extends" item )
  |> fun item ->
  if fields_include options "description" then item
  else Edn_util.remove ":logseq.property/description" item

let prepare_property_item options item =
  let with_type =
    match Edn_util.get_bool options ":with-type" with
    | Some value -> value
    | None -> true
  in
  ( ( item |> fun item ->
      if bool_option options ":with-classes" then item
      else Edn_util.remove ":logseq.property/classes" item )
  |> fun item ->
    if with_type then item else Edn_util.remove ":logseq.property/type" item )
  |> fun item ->
  if fields_include options "description" then item
  else Edn_util.remove ":logseq.property/description" item

let prepare_items kind options items =
  match kind with
  | Tag -> List.map (prepare_tag_item options) items
  | Property -> List.map (prepare_property_item options) items
  | Page | Task | Node | Asset -> items

let visible_title_fields = function
  | Node ->
      [
        Edn_util.keyword_t ":block/title";
        Edn_util.keyword_t ":block/page-title";
      ]
  | Page | Tag | Property | Task | Asset ->
      [ Edn_util.keyword_t ":block/title" ]

let normalize_visible_title_fields config repo kind items =
  let fields = visible_title_fields kind in
  let entities = List.map Entity.of_value items in
  let uuids = Uuid_refs_types.collect_uuid_refs_from_items entities fields in
  match uuids with
  | [] -> Cli_effect.pure items
  | uuids ->
      Cli_effect.map
        (fun labels ->
          Uuid_refs_types.normalize_item_string_fields entities fields labels
          |> List.map (fun item -> item.Entity.raw))
        (Uuid_refs_types.fetch_uuid_labels config repo uuids)

let add_optional key value fields =
  match value with
  | None -> fields
  | Some value -> (Edn_util.keyword key, value) :: fields

let common_options common =
  []
  |> add_optional ":fields" (Option.map value_of_string_list common.fields)
  |> add_optional ":limit"
       (Option.map (fun value -> Edn_util.int value) common.limit)
  |> add_optional ":offset"
       (Option.map (fun value -> Edn_util.int value) common.offset)
  |> add_optional ":sort"
       (Option.map (fun value -> Edn_util.string value) common.sort)
  |> add_optional ":order"
       (Option.map
          (fun value -> Edn_util.string (string_of_order value))
          common.order)

let add_bool key enabled fields =
  if enabled then (Edn_util.keyword key, Edn_util.bool true) :: fields
  else fields

let add_optional_bool key value fields =
  add_optional key (Option.map (fun value -> Edn_util.bool value) value) fields

let options_of_parsed = function
  | Parsed_page opts ->
      common_options opts.common
      |> add_bool ":expand" opts.expand
      |> add_optional_bool ":include-built-in" opts.include_built_in
      |> add_optional_bool ":include-journal" opts.include_journal
      |> add_bool ":journal-only" opts.journal_only
      |> add_bool ":include-hidden" opts.include_hidden
      |> add_optional ":updated-after"
           (Option.map (fun value -> Edn_util.string value) opts.updated_after)
      |> add_optional ":created-after"
           (Option.map (fun value -> Edn_util.string value) opts.created_after)
      |> fun fields -> Edn_util.map (List.rev fields)
  | Parsed_tag opts ->
      common_options opts.common
      |> add_bool ":expand" opts.expand
      |> add_optional_bool ":include-built-in" opts.include_built_in
      |> add_bool ":with-properties" opts.with_properties
      |> add_bool ":with-extends" opts.with_extends
      |> fun fields -> Edn_util.map (List.rev fields)
  | Parsed_property opts ->
      common_options opts.common
      |> add_bool ":expand" opts.expand
      |> add_optional_bool ":include-built-in" opts.include_built_in
      |> add_bool ":with-classes" opts.with_classes
      |> add_bool ":with-type" opts.with_type
      |> fun fields -> Edn_util.map (List.rev fields)
  | Parsed_task opts ->
      common_options opts.common
      |> add_optional ":status"
           (Option.map (fun value -> Edn_util.string value) opts.status)
      |> add_optional ":priority"
           (Option.map (fun value -> Edn_util.string value) opts.priority)
      |> add_optional ":content"
           (Option.map (fun value -> Edn_util.string value) opts.content)
      |> fun fields -> Edn_util.map (List.rev fields)
  | Parsed_node opts ->
      common_options opts.common
      |> add_optional ":tags"
           (if opts.tags = [] then None
            else Some (value_of_string_list opts.tags))
      |> add_optional ":properties"
           (if opts.properties = [] then None
            else Some (value_of_string_list opts.properties))
      |> fun fields -> Edn_util.map (List.rev fields)
  | Parsed_asset opts -> Edn_util.map (List.rev (common_options opts.common))

let build ?registry:_ config _globals parsed =
  Error.bind (normalize_options parsed) (fun parsed ->
      match config.Cli_config.repo with
      | None -> Error (Error.missing_repo "repo is required for list")
      | Some repo ->
          Ok
            {
              kind = kind_of_parsed parsed;
              command = command_id parsed;
              repo;
              graph = Cli_config.repo_to_graph repo;
              options = options_of_parsed parsed;
            })

let items_value items =
  Edn_util.map_t [ (Edn_util.keyword ":items", Edn_util.vector items) ]

let execute action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false) (function
    | Error err -> pure (Output_mode.error ~command:action.command mode err)
    | Ok invoke_config ->
        let options =
          match action.kind with
          | Tag -> pure (Ok (normalize_tag_options action.options))
          | Property -> pure (Ok (normalize_property_options action.options))
          | Task ->
              normalize_task_options invoke_config action.repo action.options
          | Node ->
              normalize_node_options invoke_config action.repo action.options
          | Asset ->
              normalize_asset_options invoke_config action.repo action.options
          | _ -> pure (Ok action.options)
        in
        bind options (function
          | Error err ->
              pure (Output_mode.error ~command:action.command mode err)
          | Ok options ->
              let options =
                Edn_util.expect_map_t "list command options" options
              in
              bind
                (match action.kind with
                | Page ->
                    Transport.thread_api_cli_list_pages invoke_config
                      ~repo:action.repo ~options
                | Tag ->
                    Transport.thread_api_cli_list_tags invoke_config
                      ~repo:action.repo ~options
                | Property ->
                    Transport.thread_api_cli_list_properties invoke_config
                      ~repo:action.repo ~options
                | Task ->
                    Transport.thread_api_cli_list_tasks invoke_config
                      ~repo:action.repo ~options
                | Node | Asset ->
                    Transport.thread_api_cli_list_nodes invoke_config
                      ~repo:action.repo ~options)
                (fun value ->
                  let items =
                    match
                      (Edn_util.as_vector value, Edn_util.as_list value)
                    with
                    | Some xs, _ | _, Some xs -> xs
                    | _ when Edn_util.is_null value -> []
                    | _ -> [ value ]
                  in
                  let items = prepare_items action.kind action.options items in
                  let items =
                    postprocess_items action.kind action.options items
                  in
                  bind
                    (normalize_visible_title_fields config action.repo
                       action.kind items) (fun items ->
                      let data = Edn_util.any (items_value items) in
                      pure
                        (Cli_result.ok ~command:action.command mode (Raw data))))))

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
          "logseq list page --graph my-graph";
          "logseq list page --graph my-graph --journal-only --limit 20";
          "logseq list page --graph my-graph --limit 50 --sort updated-at \
           --order desc";
        ]
      Command_id.List_page "List pages";
    meta
      ~examples:
        [
          "logseq list tag --graph my-graph --with-properties";
          "logseq list tag --graph my-graph --include-built-in --limit 20 \
           --output json";
        ]
      List_tag "List tags";
    meta
      ~examples:
        [
          "logseq list property --graph my-graph --with-type";
          "logseq list property --graph my-graph --include-built-in --limit 20 \
           --output json";
        ]
      List_property "List properties";
    meta
      ~examples:
        [
          "logseq list task --graph my-graph --status todo --priority high";
          "logseq list task --graph my-graph --content \"release\" --sort \
           updated-at --order desc";
        ]
      List_task "List tasks";
    meta
      ~examples:
        [
          "logseq list node --graph my-graph --tags project,work";
          "logseq list node --graph my-graph --properties status,priority \
           --sort updated-at --order desc";
        ]
      List_node "List nodes";
    meta
      ~examples:
        [
          "logseq list asset --graph my-graph";
          "logseq list asset --graph my-graph --limit 20 --sort updated-at \
           --order desc";
        ]
      List_asset "List assets";
  ]
