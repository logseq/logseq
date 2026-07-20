type shape = {
  reaction : bool;
  property : bool;
  class_ : bool;
  page : bool;
  hidden : bool;
  whiteboard : bool;
  asset : bool;
  file : bool;
  property_history : bool;
  closed_value : bool;
  created_from_property : bool;
  property_value : bool;
  empty_placeholder : bool;
  uuid : bool;
  ident : bool;
}

type kind =
  | Reaction_entity
  | Property
  | Class
  | Hidden
  | Normal_page
  | Asset_block
  | File_block
  | Property_history_block
  | Closed_value_block
  | Property_value_block
  | Property_value_placeholder
  | Block
  | Db_ident_key_value

val dispatch : shape -> kind option
