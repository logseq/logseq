type render_options = {
  uuid_labels : (Cli_primitive.uuid * string) list;
  property_titles : (Cli_primitive.keyword * string) list;
  property_value_labels : (Melange_edn_melange.any * string) list;
  show_ids : bool;
}
