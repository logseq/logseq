type t = private {
  graph : Cli_primitive.graph option;
  root_dir : Cli_primitive.path option;
  config_path : Cli_primitive.path option;
  timeout_span : Time.span option;
  output_format : Output.Mode.packed option;
  verbose : bool;
  profile : bool;
}

val create :
  ?graph:Cli_primitive.graph ->
  ?root_dir:Cli_primitive.path ->
  ?config_path:Cli_primitive.path ->
  ?timeout_span:Time.span ->
  ?output_format:Output.Mode.packed ->
  ?verbose:bool ->
  ?profile:bool ->
  unit ->
  t
