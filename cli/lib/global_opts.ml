type t = {
  graph : Cli_primitive.graph option;
  root_dir : Cli_primitive.path option;
  config_path : Cli_primitive.path option;
  timeout_span : float option;
  output_format : Output.Mode.packed option;
  verbose : bool;
  profile : bool;
}

let create ?graph ?root_dir ?config_path ?timeout_span ?output_format
    ?(verbose = false) ?(profile = false) () =
  {
    graph;
    root_dir;
    config_path;
    timeout_span;
    output_format;
    verbose;
    profile;
  }
