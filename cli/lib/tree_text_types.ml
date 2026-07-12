type render_options = {
  uuid_labels : (Cli_primitive.uuid * string) Rrbvec.t;
  property_titles : (Cli_primitive.keyword * string) Rrbvec.t;
  property_value_labels : (Melange_edn_melange.any * string) Rrbvec.t;
  show_ids : bool;
}
