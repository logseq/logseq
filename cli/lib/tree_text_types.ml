type render_options = {
  uuid_labels : (Cli_primitive.uuid * string) list;
  property_titles : (Cli_primitive.keyword * string) list;
  property_value_labels : (Melange_edn.any * string) list;
  show_ids : bool;
}

let property_value_to_string ?labels:_ ?uuid_labels:_ value =
  Some (Melange_edn.to_edn_string value)

let node_property_lines _ _ ~indent:_ = []
let tree_to_text _ tree = Option.value (Block.label tree.Block.root) ~default:""

let linked_refs_to_text _ blocks =
  blocks |> List.filter_map Block.label |> String.concat "\n"
