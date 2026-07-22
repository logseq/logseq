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

let dispatch shape =
  if shape.reaction then Some Reaction_entity
  else if shape.property then Some Property
  else if shape.class_ then Some Class
  else if shape.page && shape.hidden then Some Hidden
  else if shape.whiteboard || shape.page then Some Normal_page
  else if shape.asset then Some Asset_block
  else if shape.file then Some File_block
  else if shape.property_history then Some Property_history_block
  else if shape.closed_value then Some Closed_value_block
  else if shape.created_from_property && shape.property_value then
    Some Property_value_block
  else if shape.empty_placeholder then Some Property_value_placeholder
  else if shape.uuid then Some Block
  else if shape.ident then Some Db_ident_key_value
  else None
