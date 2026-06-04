type block =
  | Block_id of Cli_primitive.db_id
  | Block_uuid of Cli_primitive.uuid

type page =
  | Page_id of Cli_primitive.db_id
  | Page_name of string
  | Page_uuid of Cli_primitive.uuid

type property =
  | Property_id of Cli_primitive.db_id
  | Property_ident of Cli_primitive.keyword
  | Property_name of string
  | Property_uuid of Cli_primitive.uuid

type tag =
  | Tag_id of Cli_primitive.db_id
  | Tag_name of string
  | Tag_ident of Cli_primitive.keyword
  | Tag_uuid of Cli_primitive.uuid

type entity =
  | Entity_id of Cli_primitive.db_id
  | Entity_uuid of Cli_primitive.uuid
  | Entity_ident of Cli_primitive.keyword
  | Entity_name of string

let block_to_lookup = function
  | Block_id id -> Edn_util.int64 id
  | Block_uuid uuid -> Edn_util.uuid uuid

let page_to_lookup = function
  | Page_id id -> Edn_util.int64 id
  | Page_name name -> Edn_util.string name
  | Page_uuid uuid -> Edn_util.uuid uuid

let property_to_lookup = function
  | Property_id id -> Edn_util.int64 id
  | Property_ident ident -> Edn_util.any ident
  | Property_name name -> Edn_util.string name
  | Property_uuid uuid -> Edn_util.uuid uuid

let tag_to_lookup = function
  | Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string name
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid -> Edn_util.uuid uuid

let entity_to_lookup = function
  | Entity_id id -> Edn_util.int64 id
  | Entity_uuid uuid -> Edn_util.uuid uuid
  | Entity_ident ident -> Edn_util.any ident
  | Entity_name name -> Edn_util.string name

let parse_int s = try Some (Int64.of_string s) with Failure _ -> None

let parse_entity_token s =
  match parse_int s with
  | Some id -> Some (Entity_id id)
  | None ->
      if Cli_primitive.is_uuid_string s then Some (Entity_uuid s)
      else if String.length s > 0 && s.[0] = ':' then
        Some (Entity_ident (Edn_util.keyword_t s))
      else Some (Entity_name s)

let parse_property_token s =
  match parse_int s with
  | Some id -> Some (Property_id id)
  | None ->
      if Cli_primitive.is_uuid_string s then Some (Property_uuid s)
      else if String.length s > 0 && s.[0] = ':' then
        Some (Property_ident (Edn_util.keyword_t s))
      else Some (Property_name s)

let parse_tag_token s =
  match parse_int s with
  | Some id -> Some (Tag_id id)
  | None ->
      if Cli_primitive.is_uuid_string s then Some (Tag_uuid s)
      else if String.length s > 0 && s.[0] = ':' then
        Some (Tag_ident (Edn_util.keyword_t s))
      else Some (Tag_name s)
