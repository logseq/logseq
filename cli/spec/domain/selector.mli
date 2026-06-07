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

val block_to_lookup : block -> Melange_edn.any
val page_to_lookup : page -> Melange_edn.any
val property_to_lookup : property -> Melange_edn.any
val tag_to_lookup : tag -> Melange_edn.any
val entity_to_lookup : entity -> Melange_edn.any
val parse_entity_token : string -> entity option
val parse_property_token : string -> property option
val parse_tag_token : string -> tag option
