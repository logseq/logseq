type render_options = {
  uuid_labels : (Cli_primitive.uuid * string) list;
  property_titles : (Cli_primitive.keyword * string) list;
  property_value_labels : (Melange_edn.any * string) list;
  show_ids : bool;
}

val property_value_to_string :
  ?labels:(Melange_edn.any * string) list ->
  ?uuid_labels:(Cli_primitive.uuid * string) list ->
  Melange_edn.any ->
  string option

val node_property_lines :
  Block.t -> render_options -> indent:string -> string list

val tree_to_text : render_options -> Block.tree -> string
val linked_refs_to_text : render_options -> Block.t list -> string
