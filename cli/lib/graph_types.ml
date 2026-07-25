type graph_item_kind = Canonical | Legacy | Legacy_undecodable

type graph_item = {
  kind : graph_item_kind;
  graph_name : Cli_primitive.graph option;
  graph_dir : Cli_primitive.path option;
  legacy_dir : Cli_primitive.path option;
  target_graph_dir : Cli_primitive.path option;
  conflict : bool;
  reason : Cli_primitive.keyword option;
}
